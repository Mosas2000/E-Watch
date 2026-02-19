import {
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { requireAuth } from '../auth';
import logger from '../utils/logger';
import { RequestCache } from '../utils/requestCache';
import { RateLimiter } from '../utils/rateLimiter';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { getActiveContract } from '../config/contractConfig';

const network = STACKS_MAINNET;
const { address: contractAddress, name: contractName } = getActiveContract();

// Cache event lookups for 30 seconds to avoid duplicate reads
const eventCache = new RequestCache<unknown>(30_000, 200);

// Cache event count for 15 seconds since it changes with each registration
const countCache = new RequestCache<unknown>(15_000, 1);

// Rate limiter: allow 20 read-only calls per minute
const readLimiter = new RateLimiter(20, 60_000);

/**
 * Invalidate all cached data. Call this after a write operation
 * (register, update, deactivate) to ensure subsequent reads
 * fetch fresh data from the contract.
 */
export const invalidateCache = () => {
  eventCache.clear();
  countCache.clear();
  logger.debug('All contract caches invalidated');
};

/**
 * Register a new event on the smart contract.
 * Opens the Stacks wallet for the user to sign and broadcast the transaction.
 *
 * @param eventType - Category label for the event (max 128 ASCII characters)
 * @param data - Payload string describing the event (max 256 ASCII characters)
 * @returns Promise resolving with the finished transaction data
 * @throws If the user is not authenticated, input is invalid, or the user cancels
 */
export const registerEvent = async (eventType: string, data: string) => {
  requireAuth('register an event');

  if (!eventType || eventType.trim().length === 0) {
    throw new Error('eventType must not be empty');
  }

  if (eventType.length > 128) {
    throw new Error('eventType exceeds maximum length of 128 characters');
  }

  if (!data || data.trim().length === 0) {
    throw new Error('data must not be empty');
  }

  if (data.length > 256) {
    throw new Error('data exceeds maximum length of 256 characters');
  }

  logger.info('Initiating event registration', {
    eventType,
    dataLength: data.length,
  });

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'register-event',
      functionArgs: [stringAsciiCV(eventType), stringAsciiCV(data)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        logger.transaction('Event registration completed', {
          eventType,
          txid: data.txId,
        });
        invalidateCache();
        resolve(data);
      },
      onCancel: () => {
        logger.warn('Event registration cancelled by user', {
          eventType,
        });
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};

/**
 * Fetch a single event from the smart contract by its numeric identifier.
 * Results are cached for 30 seconds to reduce redundant on-chain reads.
 *
 * @param eventId - Positive integer identifying the event
 * @returns Parsed JSON representation of the Clarity return value
 * @throws On network failure, rate limiting, or invalid eventId
 */
export const getEvent = async (eventId: number) => {
  if (!Number.isInteger(eventId) || eventId < 1) {
    throw new Error('eventId must be a positive integer');
  }

  const cacheKey = `event:${eventId}`;

  // Return cached result if available
  const cached = eventCache.get(cacheKey);
  if (cached) {
    logger.debug('Event cache hit', { eventId });
    return cached;
  }

  // Check rate limit before making the network call
  if (!readLimiter.tryAcquire()) {
    const retryAfter = readLimiter.getRetryAfterMs();
    logger.warn('Rate limit exceeded for event read', {
      eventId,
      retryAfterMs: retryAfter,
      remaining: readLimiter.remaining,
    });
    throw new Error(
      `Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.`,
    );
  }

  logger.debug('Fetching event from contract', {
    eventId,
    contractAddress,
  });

  try {
    const data = await retryWithBackoff(
      async () => {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-event',
          functionArgs: [uintCV(eventId)],
          network,
          senderAddress: contractAddress,
        });
        return cvToJSON(result);
      },
      {
        maxRetries: 2,
        baseDelayMs: 1000,
        onRetry: (attempt, error, delayMs) => {
          logger.warn('Retrying event fetch', {
            eventId,
            attempt,
            error: error.message,
            delayMs,
          });
        },
      },
    );

    logger.info('Event retrieved successfully', {
      eventId,
      found: !!data.value,
    });

    // Cache the successful result
    eventCache.set(cacheKey, data);

    return data;
  } catch (error: any) {
    logger.error('Failed to fetch event', {
      eventId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Retrieve the total number of registered events from the contract.
 * Results are cached for 15 seconds since the count changes with each registration.
 *
 * @returns Parsed JSON representation of the event count
 * @throws On network failure or rate limiting
 */
export const getEventCount = async () => {
  const cacheKey = 'event-count';

  // Return cached count if available
  const cached = countCache.get(cacheKey);
  if (cached) {
    logger.debug('Event count cache hit');
    return cached;
  }

  // Check rate limit
  if (!readLimiter.tryAcquire()) {
    const retryAfter = readLimiter.getRetryAfterMs();
    logger.warn('Rate limit exceeded for event count', {
      retryAfterMs: retryAfter,
    });
    throw new Error(
      `Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 1000)} seconds.`,
    );
  }

  logger.debug('Fetching event count from contract', {
    contractAddress,
  });

  try {
    const data = await retryWithBackoff(
      async () => {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-event-count',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
        return cvToJSON(result);
      },
      {
        maxRetries: 2,
        baseDelayMs: 800,
        onRetry: (attempt, error, delayMs) => {
          logger.warn('Retrying event count fetch', {
            attempt,
            error: error.message,
            delayMs,
          });
        },
      },
    );

    logger.info('Event count retrieved', {
      count: data.value?.value,
    });

    // Cache the result
    countCache.set(cacheKey, data);

    return data;
  } catch (error: any) {
    logger.error('Failed to fetch event count', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Update the data payload of an existing event on the contract.
 * Requires an active user session. Opens the wallet for transaction signing.
 *
 * @param eventId - Positive integer identifying the event to update
 * @param newData - Replacement data string (max 256 ASCII characters)
 * @returns Promise resolving with the finished transaction data
 * @throws If not authenticated, input is invalid, or the user cancels
 */
export const updateEvent = async (eventId: number, newData: string) => {
  requireAuth('update an event');

  if (!Number.isInteger(eventId) || eventId < 1) {
    throw new Error('eventId must be a positive integer');
  }

  if (!newData || newData.trim().length === 0) {
    throw new Error('newData must not be empty');
  }

  if (newData.length > 256) {
    throw new Error('newData exceeds maximum length of 256 characters');
  }

  logger.info('Initiating event update', {
    eventId,
    dataLength: newData.length,
  });

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'update-event',
      functionArgs: [uintCV(eventId), stringAsciiCV(newData)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        logger.transaction('Event update completed', {
          eventId,
          txid: data.txId,
        });
        invalidateCache();
        resolve(data);
      },
      onCancel: () => {
        logger.warn('Event update cancelled by user', { eventId });
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};

/**
 * Deactivate an event on the contract, marking it as inactive.
 * Requires an active user session. Opens the wallet for transaction signing.
 *
 * @param eventId - Positive integer identifying the event to deactivate
 * @returns Promise resolving with the finished transaction data
 * @throws If not authenticated, eventId is invalid, or the user cancels
 */
export const deactivateEvent = async (eventId: number) => {
  requireAuth('deactivate an event');

  if (!Number.isInteger(eventId) || eventId < 1) {
    throw new Error('eventId must be a positive integer');
  }

  logger.info('Initiating event deactivation', { eventId });

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'deactivate-event',
      functionArgs: [uintCV(eventId)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        logger.transaction('Event deactivation completed', {
          eventId,
          txid: data.txId,
        });
        invalidateCache();
        resolve(data);
      },
      onCancel: () => {
        logger.warn('Event deactivation cancelled by user', { eventId });
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
};
