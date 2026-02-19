import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { userSession } from '../auth';
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

export const registerEvent = async (eventType: string, data: string) => {
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

export const getEvent = async (eventId: number) => {
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

export const updateEvent = async (eventId: number, newData: string) => {
  if (!userSession.isUserSignedIn()) {
    throw new Error('User must be signed in to update an event');
  }

  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'update-event',
    functionArgs: [uintCV(eventId), stringAsciiCV(newData)],
    senderKey: userData.appPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction({ transaction, network });
};

export const deactivateEvent = async (eventId: number) => {
  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'deactivate-event',
    functionArgs: [uintCV(eventId)],
    senderKey: userData.appPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction({ transaction, network });
};
