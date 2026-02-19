import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../frontend/src/utils/debounce';
import { throttle } from '../frontend/src/utils/throttle';
import { RequestCache } from '../frontend/src/utils/requestCache';
import { RateLimiter } from '../frontend/src/utils/rateLimiter';
import { retryWithBackoff } from '../frontend/src/utils/retryWithBackoff';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution until wait period elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced(); // reset
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel prevents the pending call from firing', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it('passes arguments to the original function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a', 'b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('suppresses calls within the interval', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fires trailing call after interval elapses', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    throttled();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('cancel prevents the trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    throttled();
    throttled.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('RequestCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves cached values', () => {
    const cache = new RequestCache<string>(5000);
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns undefined for missing keys', () => {
    const cache = new RequestCache<string>(5000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    const cache = new RequestCache<string>(5000);
    cache.set('key1', 'value1');

    vi.advanceTimersByTime(5001);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('evicts oldest entry when max entries exceeded', () => {
    const cache = new RequestCache<string>(60000, 2);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3'); // should evict 'a'

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
  });

  it('has returns true for non-expired entries', () => {
    const cache = new RequestCache<string>(5000);
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  it('invalidate removes a specific entry', () => {
    const cache = new RequestCache<string>(5000);
    cache.set('key1', 'value1');
    cache.invalidate('key1');
    expect(cache.get('key1')).toBeUndefined();
  });

  it('clear removes all entries', () => {
    const cache = new RequestCache<string>(5000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.remaining).toBe(0);
  });

  it('rejects requests that exceed the limit', () => {
    const limiter = new RateLimiter(2, 60000);
    limiter.tryAcquire();
    limiter.tryAcquire();
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('allows requests after the window elapses', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.tryAcquire();
    expect(limiter.tryAcquire()).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('getRetryAfterMs returns correct wait time', () => {
    const limiter = new RateLimiter(1, 5000);
    limiter.tryAcquire();

    vi.advanceTimersByTime(2000);
    const retryAfter = limiter.getRetryAfterMs();
    expect(retryAfter).toBeGreaterThan(2900);
    expect(retryAfter).toBeLessThanOrEqual(3000);
  });

  it('reset clears all timestamps', () => {
    const limiter = new RateLimiter(2, 60000);
    limiter.tryAcquire();
    limiter.tryAcquire();
    expect(limiter.remaining).toBe(0);

    limiter.reset();
    expect(limiter.remaining).toBe(2);
  });
});

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result on first successful call', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, { maxRetries: 3 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      baseDelayMs: 100,
      jitter: false,
    });

    // Advance past the delay
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));

    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      baseDelayMs: 50,
      jitter: false,
    });

    await vi.advanceTimersByTimeAsync(500);

    await expect(promise).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('calls onRetry callback before each retry', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('err1'))
      .mockResolvedValue('done');

    const promise = retryWithBackoff(fn, {
      maxRetries: 1,
      baseDelayMs: 100,
      jitter: false,
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(200);
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 100);
  });
});
