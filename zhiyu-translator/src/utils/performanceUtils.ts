/**
 * Performance utility functions
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCallTime >= wait) {
      lastCallTime = now;
      func(...args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        func(...args);
      }, wait - (now - lastCallTime));
    }
  };
}

/**
 * Measures the execution time of a function
 */
export function measurePerformance<T>(
  name: string,
  func: () => T
): T {
  const startTime = performance.now();
  const result = func();
  const endTime = performance.now();

  console.log(`${name} took ${endTime - startTime} milliseconds`);
  return result;
}

/**
 * Measures the execution time of an async function
 */
export async function measureAsyncPerformance<T>(
  name: string,
  func: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  const result = await func();
  const endTime = performance.now();

  console.log(`${name} took ${endTime - startTime} milliseconds`);
  return result;
}