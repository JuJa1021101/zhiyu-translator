import { RetryService } from '../RetryService';

describe('RetryService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('retries function until success', async () => {
    const mockFn = vi.fn();
    let attempts = 0;

    // Function that fails twice then succeeds
    mockFn.mockImplementation(() => {
      attempts++;
      if (attempts <= 2) {
        return Promise.reject(new Error(`Attempt ${attempts} failed`));
      }
      return Promise.resolve('Success');
    });

    const retryService = new RetryService();
    const promise = retryService.retry(mockFn, { maxRetries: 3, delay: 1000 });

    // First attempt (fails)
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance time to trigger first retry
    vi.advanceTimersByTime(1000);

    // Second attempt (fails)
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Advance time to trigger second retry
    vi.advanceTimersByTime(1000);

    // Third attempt (succeeds)
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Resolve all promises
    await Promise.resolve();

    const result = await promise;
    expect(result).toBe('Success');
  });

  test('gives up after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

    const retryService = new RetryService();
    const promise = retryService.retry(mockFn, { maxRetries: 3, delay: 1000 });

    // First attempt
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance time for all retries
    for (let i = 0; i < 3; i++) {
      vi.advanceTimersByTime(1000);
    }

    // Should have attempted 4 times total (initial + 3 retries)
    expect(mockFn).toHaveBeenCalledTimes(4);

    // Promise should reject with the last error
    await expect(promise).rejects.toThrow('Always fails');
  });

  test('uses exponential backoff when specified', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

    const retryService = new RetryService();
    const promise = retryService.retry(mockFn, {
      maxRetries: 3,
      delay: 1000,
      backoffFactor: 2
    });

    // First attempt
    expect(mockFn).toHaveBeenCalledTimes(1);

    // First retry after 1000ms
    vi.advanceTimersByTime(1000);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Second retry after 2000ms (1000 * 2)
    vi.advanceTimersByTime(2000);
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Third retry after 4000ms (1000 * 2 * 2)
    vi.advanceTimersByTime(4000);
    expect(mockFn).toHaveBeenCalledTimes(4);

    // Promise should reject
    await expect(promise).rejects.toThrow();
  });

  test('respects maxDelay option', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

    const retryService = new RetryService();
    const promise = retryService.retry(mockFn, {
      maxRetries: 3,
      delay: 1000,
      backoffFactor: 5,
      maxDelay: 3000
    });

    // First attempt
    expect(mockFn).toHaveBeenCalledTimes(1);

    // First retry after 1000ms
    vi.advanceTimersByTime(1000);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Second retry after 3000ms (capped at maxDelay)
    vi.advanceTimersByTime(3000);
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Third retry after 3000ms (capped at maxDelay)
    vi.advanceTimersByTime(3000);
    expect(mockFn).toHaveBeenCalledTimes(4);

    await expect(promise).rejects.toThrow();
  });

  test('calls onRetry callback before each retry', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));
    const onRetry = vi.fn();

    const retryService = new RetryService();
    const promise = retryService.retry(mockFn, {
      maxRetries: 2,
      delay: 1000,
      onRetry
    });

    // First attempt (no callback yet)
    expect(onRetry).not.toHaveBeenCalled();

    // First retry
    vi.advanceTimersByTime(1000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenLastCalledWith(
      expect.any(Error),
      1
    );

    // Second retry
    vi.advanceTimersByTime(1000);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenLastCalledWith(
      expect.any(Error),
      2
    );

    await expect(promise).rejects.toThrow();
  });

  test('can be cancelled during retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

    const retryService = new RetryService();
    const promise = retryService.retry(mockFn, { maxRetries: 3, delay: 1000 });

    // First attempt
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Cancel before first retry
    retryService.cancel();

    // Advance time
    vi.advanceTimersByTime(1000);

    // No more retries should happen
    expect(mockFn).toHaveBeenCalledTimes(1);

    await expect(promise).rejects.toThrow('Retry cancelled');
  });
});