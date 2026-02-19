/**
 * Retry with exponential backoff
 *
 * Wraps an async operation and retries on failure with exponentially
 * increasing delays. Handles both network errors and HTTP 429 (rate
 * limit) responses by waiting before the next attempt.
 *
 * The delay doubles after each failed attempt starting from the base
 * delay, with optional jitter to prevent thundering herd when multiple
 * clients retry simultaneously.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts. Defaults to 3. */
  maxRetries?: number;
  /** Initial delay in milliseconds before the first retry. Defaults to 1000. */
  baseDelayMs?: number;
  /** Maximum delay cap in milliseconds. Defaults to 30000. */
  maxDelayMs?: number;
  /** Add random jitter to delays to avoid thundering herd. Defaults to true. */
  jitter?: boolean;
  /** Callback invoked before each retry with attempt number and error. */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Execute an async function with automatic retry on failure.
 *
 * @param fn - The async operation to execute
 * @param options - Retry configuration
 * @returns The result of the successful invocation
 * @throws The last error if all retry attempts are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    jitter = true,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);

      // Add jitter: random value between 0 and delay
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      if (onRetry) {
        onRetry(attempt + 1, lastError, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
