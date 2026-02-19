/**
 * Request queue with concurrency control
 *
 * Ensures that no more than a configurable number of API calls run
 * simultaneously. Queued requests are processed in FIFO order as
 * active slots become available.
 *
 * Useful for bulk event lookups where firing many requests at once
 * would overwhelm the Hiro API and trigger rate limiting.
 */

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

export class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private activeCount = 0;
  private readonly maxConcurrent: number;
  private readonly delayBetweenMs: number;

  /**
   * @param maxConcurrent - Maximum simultaneous in-flight requests. Defaults to 2.
   * @param delayBetweenMs - Minimum delay between starting consecutive requests. Defaults to 500.
   */
  constructor(maxConcurrent = 2, delayBetweenMs = 500) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenMs = delayBetweenMs;
  }

  /**
   * Add an async operation to the queue. Returns a promise that
   * resolves when the operation completes.
   */
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processNext();
    });
  }

  /**
   * Number of requests currently waiting in the queue.
   */
  get pending(): number {
    return this.queue.length;
  }

  /**
   * Number of requests currently being executed.
   */
  get active(): number {
    return this.activeCount;
  }

  /**
   * Cancel all pending requests in the queue. Active requests
   * continue to completion.
   */
  clear(): void {
    for (const request of this.queue) {
      request.reject(new Error('Request cancelled: queue cleared'));
    }
    this.queue = [];
  }

  private async processNext(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.activeCount++;

    try {
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeCount--;

      // Delay before starting the next request
      if (this.queue.length > 0 && this.delayBetweenMs > 0) {
        await new Promise((r) => setTimeout(r, this.delayBetweenMs));
      }

      this.processNext();
    }
  }
}
