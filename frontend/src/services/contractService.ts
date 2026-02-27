// ---------------------------------------------------------------------------
// Contract Service
// ---------------------------------------------------------------------------
// Provides typed wrappers around all smart-contract interactions for the
// E-Watch application.  Write operations use openContractCall (wallet popup)
// while read operations use fetchCallReadOnlyFunction (no wallet needed).
//
// Authentication: every write function calls requireAuth() before it does
// anything else so unauthenticated requests fail fast with a clear message.
// ---------------------------------------------------------------------------

import {
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { getStacksNetwork } from '../config/networkConfig';
import { requireAuth, userSession } from '../auth';
import logger from '../utils/logger';
import { RequestCache } from '../utils/requestCache';
import { RateLimiter } from '../utils/rateLimiter';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { getActiveContract } from '../config/contractConfig';

const network = getStacksNetwork();
const { address: contractAddress, name: contractName } = getActiveContract();

// Cache event lookups for 30 seconds to avoid duplicate reads
const eventCache = new RequestCache<unknown>(30_000, 200);

// Cache event count for 15 seconds since it changes with each registration
const countCache = new RequestCache<unknown>(15_000, 1);

// Rate limiter: allow 20 read-only calls per minute
const readLimiter = new RateLimiter(20, 60_000);

/**
 * Custom Error wrapper standardizing contract transaction rejections 
 * enforcing explicit recovery behaviors.
 */
export class ContractError extends Error {
  code: string;
  userMessage: string;
  recoverySuggestion: string;

  constructor(code: string, message: string, userMessage: string, recoverySuggestion: string) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.userMessage = userMessage;
    this.recoverySuggestion = recoverySuggestion;
  }
}

/**
 * Utility wrapper to enforce Stacks transaction promises correctly 
 * mapping timeouts and user cancellations into ContractError boundaries.
 */
const executeWalletTransaction = async (
  options: any,
  actionName: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Failsafe timeout at 5 minutes to prevent hanging Promises
    const timeout = setTimeout(() => {
      logger.error(`Transaction ${actionName} timed out before wallet response`);
      reject(
        new ContractError(
          'ERR_TIMEOUT',
          'Transaction setup timed out',
          'The wallet connection timed out.',
          'Please ensure your Stacks wallet is unlocked and try again.'
        )
      );
    }, 300_000);

    try {
      openContractCall({
        ...options,
        onFinish: (data) => {
          clearTimeout(timeout);
          logger.transaction(`${actionName} completed`, { txid: data.txId });
          invalidateCache();
          resolve(data);
        },
        onCancel: () => {
          clearTimeout(timeout);
          logger.warn(`${actionName} cancelled by user`);
          reject(
            new ContractError(
              'ERR_USER_CANCEL',
              'User rejected transaction',
              'You cancelled the transaction in your wallet.',
              'No changes were made. You can safely try again.'
            )
          );
        },
      });
    } catch (err: any) {
      clearTimeout(timeout);
      logger.error(`Failed executing ${actionName}`, { error: err.message });
      reject(
        new ContractError(
          'ERR_NETWORK',
          err.message,
          'A network error interrupted the transaction.',
          'Please check your internet connection and network configuration.'
        )
      );
    }
  });
};

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
    throw new ContractError(
      'ERR_VALIDATION',
      'eventType empty',
      'Event category cannot be empty.',
      'Provide a label for your event.'
    );
  }

  if (eventType.length > 50) {
    throw new ContractError(
      'ERR_VALIDATION',
      'eventType exceeds limit',
      'Event category is too long (Max 50 characters).',
      'Shorten the category string.'
    );
  }

  if (!data || data.trim().length === 0) {
    throw new ContractError(
      'ERR_VALIDATION',
      'data empty',
      'Event data payload cannot be empty.',
      'Provide data attached to your event log.'
    );
  }

  if (data.length > 500) {
    throw new ContractError(
      'ERR_VALIDATION',
      'data exceeds limit',
      'Event payload is too long (Max 500 characters).',
      'Shorten the payload string data.'
    );
  }

  logger.info('Initiating event registration', {
    eventType,
    dataLength: data.length,
  });

  return executeWalletTransaction({
    contractAddress,
    contractName,
    functionName: 'register-event',
    functionArgs: [stringAsciiCV(eventType), stringAsciiCV(data)],
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  }, 'Event registration');
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
  if (!Number.isInteger(eventId) || eventId < 0) {
    throw new Error('eventId must be a zero or positive integer');
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
    throw new ContractError(
      'ERR_RATE_LIMIT',
      'Read operations exceeded',
      `Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.`,
      'Wait out the active throttling delay.'
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
    throw new ContractError(
      'ERR_NETWORK',
      error.message,
      'Could not communicate with the smart contract.',
      'Check your connection and Stacks node availability.'
    );
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
    throw new ContractError(
      'ERR_RATE_LIMIT',
      'Read limit exceeded',
      `Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 1000)} seconds.`,
      'Wait for the block cycle to reload capacities.'
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
    throw new ContractError(
      'ERR_NETWORK',
      error.message,
      'Network timeout establishing counter payload',
      'Try refreshing the active connection instance.'
    );
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
  if (!userSession.isUserSignedIn()) {
    requireAuth('update an event');
  }

  if (!Number.isInteger(eventId) || eventId < 0) {
    throw new ContractError(
      'ERR_VALIDATION',
      'Invalid eventId string matching',
      'Cannot update unspecified block attributes',
      'Provide an existing positive numeric target'
    );
  }

  if (!newData || newData.trim().length === 0) {
    throw new ContractError(
      'ERR_VALIDATION',
      'newData is undefined',
      'Contract updates must map a valid payload structure',
      'Supply a payload of content logic replacing the previous node'
    );
  }

  if (newData.length > 500) {
    throw new ContractError(
      'ERR_VALIDATION',
      'newData exceeds character maximum',
      'Cannot index payloads more than 500 characters',
      'Isolate content variables into segmented structures'
    );
  }

  logger.info('Initiating event update', {
    eventId,
    dataLength: newData.length,
  });

  return executeWalletTransaction({
    contractAddress,
    contractName,
    functionName: 'update-event',
    functionArgs: [uintCV(eventId), stringAsciiCV(newData)],
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  }, 'Event update');
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
  if (!userSession.isUserSignedIn()) {
    requireAuth('deactivate an event');
  }

  if (!Number.isInteger(eventId) || eventId < 0) {
    throw new ContractError(
      'ERR_VALIDATION',
      'Missing numeric event identifier',
      'Cannot map null identifier instances toward contract execution limits',
      'Isolate precise tuple properties manually bounding positive IDs'
    );
  }

  logger.info('Initiating event deactivation', { eventId });

  return executeWalletTransaction({
    contractAddress,
    contractName,
    functionName: 'deactivate-event',
    functionArgs: [uintCV(eventId)],
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  }, 'Event deactivation');
};
