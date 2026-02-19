import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@stacks/connect', () => {
  const isSignedIn = vi.fn(() => false);
  const loadData = vi.fn(() => ({
    profile: {
      stxAddress: {
        mainnet: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
        testnet: 'ST31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQAE5SE2',
      },
    },
  }));

  return {
    AppConfig: vi.fn().mockImplementation(() => ({})),
    UserSession: vi.fn().mockImplementation(() => ({
      isUserSignedIn: isSignedIn,
      loadUserData: loadData,
    })),
    __mocks__: { isSignedIn, loadData },
  };
});

describe('auth module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('should return false when user is not signed in', async () => {
      const connect = await import('@stacks/connect');
      const mocks = (connect as any).__mocks__;
      mocks.isSignedIn.mockReturnValue(false);

      const { isAuthenticated } = await import('../auth');
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when user is signed in', async () => {
      const connect = await import('@stacks/connect');
      const mocks = (connect as any).__mocks__;
      mocks.isSignedIn.mockReturnValue(true);

      const { isAuthenticated } = await import('../auth');
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('getUserAddress', () => {
    it('should return null when user is not signed in', async () => {
      const connect = await import('@stacks/connect');
      const mocks = (connect as any).__mocks__;
      mocks.isSignedIn.mockReturnValue(false);

      const { getUserAddress } = await import('../auth');
      expect(getUserAddress()).toBeNull();
    });

    it('should return mainnet address when user is signed in', async () => {
      const connect = await import('@stacks/connect');
      const mocks = (connect as any).__mocks__;
      mocks.isSignedIn.mockReturnValue(true);

      const { getUserAddress } = await import('../auth');
      expect(getUserAddress()).toBe(
        'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
      );
    });

    it('should return null when loadUserData throws', async () => {
      const connect = await import('@stacks/connect');
      const mocks = (connect as any).__mocks__;
      mocks.isSignedIn.mockReturnValue(true);
      mocks.loadData.mockImplementation(() => {
        throw new Error('session expired');
      });

      const { getUserAddress } = await import('../auth');
      expect(getUserAddress()).toBeNull();
    });
  });

  describe('userSession export', () => {
    it('should export a userSession instance', async () => {
      const { userSession } = await import('../auth');
      expect(userSession).toBeDefined();
      expect(typeof userSession.isUserSignedIn).toBe('function');
    });
  });

  describe('requireAuth', () => {
    it('should not throw when user is authenticated', async () => {
      const connect = await import('@stacks/connect');
      const mocks = (connect as any).__mocks__;
      mocks.isSignedIn.mockReturnValue(true);

      const { requireAuth } = await import('../auth');
      expect(() => requireAuth('perform action')).not.toThrow();
    });

    it('should throw with action label when user is not authenticated', async () => {
      const connect = await import('@stacks/connect');
      const mocks = (connect as any).__mocks__;
      mocks.isSignedIn.mockReturnValue(false);

      const { requireAuth } = await import('../auth');
      expect(() => requireAuth('update an event')).toThrow(
        'User must be signed in to update an event',
      );
    });
  });
});
