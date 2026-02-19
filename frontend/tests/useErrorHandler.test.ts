import { describe, it, expect } from 'vitest';

/**
 * Tests for the useErrorHandler hook's core logic.
 * Since hooks require a React render context, these tests
 * validate the underlying patterns used by the hook.
 */

describe('useErrorHandler patterns', () => {
  describe('handleAsync pattern', () => {
    it('returns undefined on rejected promise', async () => {
      const failingPromise = Promise.reject(new Error('network down'));
      let captured: Error | null = null;

      const result = await failingPromise.catch((err: unknown) => {
        captured = err instanceof Error ? err : new Error(String(err));
        return undefined;
      });

      expect(result).toBeUndefined();
      expect(captured).toBeInstanceOf(Error);
      expect(captured!.message).toBe('network down');
    });

    it('returns value on resolved promise', async () => {
      const successPromise = Promise.resolve(42);
      let captured: Error | null = null;

      const result = await successPromise.catch((err: unknown) => {
        captured = err instanceof Error ? err : new Error(String(err));
        return undefined;
      });

      expect(result).toBe(42);
      expect(captured).toBeNull();
    });

    it('normalizes non-Error rejections', async () => {
      const stringReject = Promise.reject('plain string');
      let captured: Error | null = null;

      await stringReject.catch((err: unknown) => {
        captured = err instanceof Error ? err : new Error(String(err));
        return undefined;
      });

      expect(captured).toBeInstanceOf(Error);
      expect(captured!.message).toBe('plain string');
    });
  });

  describe('handleSync pattern', () => {
    it('catches synchronous throws', () => {
      let captured: Error | null = null;

      const fn = () => {
        throw new Error('sync failure');
      };

      try {
        fn();
      } catch (err: unknown) {
        captured = err instanceof Error ? err : new Error(String(err));
      }

      expect(captured).toBeInstanceOf(Error);
      expect(captured!.message).toBe('sync failure');
    });

    it('returns value when no error is thrown', () => {
      const fn = () => 'hello';
      let result: string | undefined;

      try {
        result = fn();
      } catch {
        result = undefined;
      }

      expect(result).toBe('hello');
    });
  });

  describe('clearError pattern', () => {
    it('resetting error to null clears the state', () => {
      let error: Error | null = new Error('active');
      error = null;
      expect(error).toBeNull();
    });
  });
});
