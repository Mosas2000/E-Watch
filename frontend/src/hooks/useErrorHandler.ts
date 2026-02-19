import { useCallback, useState } from 'react';

/**
 * Hook that provides structured error handling for functional components.
 *
 * While ErrorBoundary catches render-time errors, this hook handles
 * errors from event handlers, async operations, and effects that
 * class-based error boundaries cannot catch.
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  /**
   * Wrap an async callback so failures are captured instead
   * of turning into unhandled rejections.
   */
  const handleAsync = useCallback(
    <T,>(promise: Promise<T>): Promise<T | undefined> => {
      return promise.catch((err: unknown) => {
        const normalized =
          err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        return undefined;
      });
    },
    [],
  );

  /**
   * Wrap a synchronous callback to capture thrown errors.
   */
  const handleSync = useCallback(
    <T,>(fn: () => T): T | undefined => {
      try {
        return fn();
      } catch (err: unknown) {
        const normalized =
          err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        return undefined;
      }
    },
    [],
  );

  /**
   * Manually set an error from outside this hook.
   */
  const setManualError = useCallback((err: Error) => {
    setError(err);
  }, []);

  /**
   * Clear the current error (e.g. after user dismisses).
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleAsync,
    handleSync,
    setError: setManualError,
    clearError,
  } as const;
}
