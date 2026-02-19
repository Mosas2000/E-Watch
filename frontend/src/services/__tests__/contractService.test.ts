import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('@stacks/connect', () => ({
  openContractCall: vi.fn(),
}));

vi.mock('@stacks/network', () => ({
  STACKS_MAINNET: { url: 'https://stacks-node-api.mainnet.stacks.co' },
}));

vi.mock('@stacks/transactions', () => ({
  AnchorMode: { Any: 3 },
  PostConditionMode: { Allow: 2 },
  stringAsciiCV: vi.fn((val: string) => ({ type: 'ascii', value: val })),
  uintCV: vi.fn((val: number) => ({ type: 'uint', value: val })),
  fetchCallReadOnlyFunction: vi.fn(),
  cvToJSON: vi.fn((val: unknown) => val),
}));

vi.mock('../auth', () => ({
  userSession: {
    isUserSignedIn: vi.fn(() => true),
  },
  isAuthenticated: vi.fn(() => true),
  requireAuth: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('../utils/requestCache', () => {
  const cache = new Map();
  return {
    RequestCache: vi.fn().mockImplementation(() => ({
      get: vi.fn((key: string) => cache.get(key)),
      set: vi.fn((key: string, val: unknown) => cache.set(key, val)),
      clear: vi.fn(() => cache.clear()),
    })),
  };
});

vi.mock('../utils/rateLimiter', () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({
    tryAcquire: vi.fn(() => true),
    getRetryAfterMs: vi.fn(() => 0),
    remaining: 20,
  })),
}));

vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('../config/contractConfig', () => ({
  getActiveContract: vi.fn(() => ({
    address: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
    name: 'ewatch-v2',
  })),
}));

describe('contractService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerEvent', () => {
    it('should throw when user is not authenticated', async () => {
      const { requireAuth } = await import('../auth');
      vi.mocked(requireAuth).mockImplementationOnce(() => {
        throw new Error('User must be signed in to register an event');
      });

      const { registerEvent } = await import('./contractService');
      await expect(registerEvent('alert', 'test data')).rejects.toThrow(
        'User must be signed in to register an event',
      );
    });

    it('should reject empty eventType', async () => {
      const { registerEvent } = await import('./contractService');
      await expect(registerEvent('', 'test data')).rejects.toThrow(
        'eventType must not be empty',
      );
    });

    it('should reject eventType exceeding 128 characters', async () => {
      const { registerEvent } = await import('./contractService');
      const longType = 'a'.repeat(129);
      await expect(registerEvent(longType, 'test data')).rejects.toThrow(
        'eventType exceeds maximum length of 128 characters',
      );
    });

    it('should reject empty data', async () => {
      const { registerEvent } = await import('./contractService');
      await expect(registerEvent('alert', '')).rejects.toThrow(
        'data must not be empty',
      );
    });

    it('should reject data exceeding 256 characters', async () => {
      const { registerEvent } = await import('./contractService');
      const longData = 'x'.repeat(257);
      await expect(registerEvent('alert', longData)).rejects.toThrow(
        'data exceeds maximum length of 256 characters',
      );
    });
  });

  describe('updateEvent', () => {
    it('should throw when user is not authenticated', async () => {
      const { requireAuth } = await import('../auth');
      vi.mocked(requireAuth).mockImplementationOnce(() => {
        throw new Error('User must be signed in to update an event');
      });

      const { updateEvent } = await import('./contractService');
      await expect(updateEvent(1, 'new data')).rejects.toThrow(
        'User must be signed in to update an event',
      );
    });

    it('should reject non-positive eventId', async () => {
      const { updateEvent } = await import('./contractService');
      await expect(updateEvent(0, 'new data')).rejects.toThrow(
        'eventId must be a positive integer',
      );
    });

    it('should reject non-integer eventId', async () => {
      const { updateEvent } = await import('./contractService');
      await expect(updateEvent(1.5, 'new data')).rejects.toThrow(
        'eventId must be a positive integer',
      );
    });

    it('should reject empty newData', async () => {
      const { updateEvent } = await import('./contractService');
      await expect(updateEvent(1, '')).rejects.toThrow(
        'newData must not be empty',
      );
    });

    it('should reject newData exceeding 256 characters', async () => {
      const { updateEvent } = await import('./contractService');
      const longData = 'x'.repeat(257);
      await expect(updateEvent(1, longData)).rejects.toThrow(
        'newData exceeds maximum length of 256 characters',
      );
    });
  });

  describe('deactivateEvent', () => {
    it('should throw when user is not authenticated', async () => {
      const { requireAuth } = await import('../auth');
      vi.mocked(requireAuth).mockImplementationOnce(() => {
        throw new Error('User must be signed in to deactivate an event');
      });

      const { deactivateEvent } = await import('./contractService');
      await expect(deactivateEvent(1)).rejects.toThrow(
        'User must be signed in to deactivate an event',
      );
    });

    it('should reject non-positive eventId', async () => {
      const { deactivateEvent } = await import('./contractService');
      await expect(deactivateEvent(0)).rejects.toThrow(
        'eventId must be a positive integer',
      );
    });

    it('should reject non-integer eventId', async () => {
      const { deactivateEvent } = await import('./contractService');
      await expect(deactivateEvent(2.7)).rejects.toThrow(
        'eventId must be a positive integer',
      );
    });
  });

  describe('getEvent', () => {
    it('should reject non-positive eventId', async () => {
      const { getEvent } = await import('./contractService');
      await expect(getEvent(-1)).rejects.toThrow(
        'eventId must be a positive integer',
      );
    });

    it('should reject non-integer eventId', async () => {
      const { getEvent } = await import('./contractService');
      await expect(getEvent(3.14)).rejects.toThrow(
        'eventId must be a positive integer',
      );
    });
  });

  describe('invalidateCache', () => {
    it('should clear all caches without throwing', async () => {
      const { invalidateCache } = await import('./contractService');
      expect(() => invalidateCache()).not.toThrow();
    });
  });
});
