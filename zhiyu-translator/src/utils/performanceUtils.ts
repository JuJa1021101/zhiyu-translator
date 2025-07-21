/**
 * Performance utility functions for optimizing application performance
 */

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Whether to invoke the function immediately on the leading edge
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>): void {
    const context = this;

    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every `wait` milliseconds.
 * 
 * @param func The function to throttle
 * @param wait The number of milliseconds to throttle invocations to
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    const context = this;

    if (now - lastCall >= wait) {
      lastCall = now;
      func.apply(context, args);
    } else {
      // Clear any existing timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Schedule a call for when throttle period ends
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func.apply(context, args);
      }, wait - (now - lastCall));
    }
  };
}

/**
 * Memoizes a function to cache its results based on the arguments provided
 * 
 * @param func The function to memoize
 * @param resolver Optional function to resolve the cache key from arguments
 * @returns A memoized function that caches results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = func.apply(this, args);
    cache.set(key, result);

    return result;
  };
}

/**
 * Creates a function that will only execute once
 * 
 * @param func The function to restrict
 * @returns A function that will only execute once
 */
export function once<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T> | undefined;

  return function (this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    if (!called) {
      called = true;
      result = func.apply(this, args);
    }

    return result;
  };
}

/**
 * Performance measurement interface
 */
export interface PerformanceMark {
  /** Name of the performance mark */
  name: string;
  /** Start time of the mark */
  startTime: number;
  /** End time of the mark (set after calling end()) */
  endTime?: number;
  /** Duration in milliseconds (available after calling end()) */
  duration?: number;
  /** End the performance measurement and calculate duration */
  end(): number;
  /** Log the performance measurement to console */
  log(message?: string): void;
}

/**
 * Creates a performance measurement mark
 * 
 * @param name Name of the performance mark
 * @returns PerformanceMark object with methods to end and log the measurement
 */
export function measurePerformance(name: string): PerformanceMark {
  // Use the browser's Performance API if available
  if (typeof performance !== 'undefined' && performance.mark) {
    const markName = `${name}-start`;
    performance.mark(markName);
  }

  const startTime = Date.now();

  const mark: PerformanceMark = {
    name,
    startTime,
    end() {
      this.endTime = Date.now();
      this.duration = this.endTime - this.startTime;

      // Use the browser's Performance API if available
      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        const endMarkName = `${name}-end`;
        performance.mark(endMarkName);
        performance.measure(name, `${name}-start`, endMarkName);
      }

      return this.duration;
    },
    log(message?: string) {
      if (!this.endTime || !this.duration) {
        this.end();
      }

      const logMessage = message || `Performance: ${this.name}`;
      console.info(`${logMessage}: ${this.duration}ms`);
    }
  };

  return mark;
}

/**
 * Global performance metrics store
 */
export const performanceMetrics = {
  marks: new Map<string, PerformanceMark[]>(),

  /**
   * Record a performance mark
   * @param name Name of the mark
   * @param duration Duration in milliseconds
   */
  record(name: string, duration: number): void {
    if (!this.marks.has(name)) {
      this.marks.set(name, []);
    }

    const mark: Partial<PerformanceMark> = {
      name,
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration
    };

    this.marks.get(name)!.push(mark as PerformanceMark);
  },

  /**
   * Get average duration for a specific mark
   * @param name Name of the mark
   * @returns Average duration in milliseconds or undefined if no marks exist
   */
  getAverage(name: string): number | undefined {
    const marks = this.marks.get(name);
    if (!marks || marks.length === 0) {
      return undefined;
    }

    const total = marks.reduce((sum, mark) => sum + (mark.duration || 0), 0);
    return total / marks.length;
  },

  /**
   * Get all metrics as a report object
   * @returns Object containing performance metrics
   */
  getReport(): Record<string, { count: number, average: number, min: number, max: number }> {
    const report: Record<string, { count: number, average: number, min: number, max: number }> = {};

    this.marks.forEach((marks, name) => {
      if (marks.length === 0) return;

      const durations = marks.map(mark => mark.duration || 0);
      const total = durations.reduce((sum, duration) => sum + duration, 0);

      report[name] = {
        count: marks.length,
        average: total / marks.length,
        min: Math.min(...durations),
        max: Math.max(...durations)
      };
    });

    return report;
  },

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    this.marks.clear();
  }
};

/**
 * Decorator for measuring method performance (for TypeScript class methods)
 * 
 * @param target The class prototype
 * @param propertyKey The method name
 * @param descriptor The property descriptor
 * @returns Modified property descriptor with performance measurement
 */
export function measure(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const mark = measurePerformance(`${target.constructor.name}.${propertyKey}`);
    const result = originalMethod.apply(this, args);

    // Handle promises
    if (result instanceof Promise) {
      return result.finally(() => {
        mark.end();
        performanceMetrics.record(mark.name, mark.duration!);
      });
    }

    mark.end();
    performanceMetrics.record(mark.name, mark.duration!);
    return result;
  };

  return descriptor;
}

/**
 * Measures the execution time of a function
 * 
 * @param fn Function to measure
 * @param name Optional name for the measurement
 * @returns Result of the function
 */
export function measureFunction<T>(fn: () => T, name?: string): T {
  const mark = measurePerformance(name || 'anonymous-function');
  try {
    return fn();
  } finally {
    mark.end();
    performanceMetrics.record(mark.name, mark.duration!);
  }
}

/**
 * Measures the execution time of an async function
 * 
 * @param fn Async function to measure
 * @param name Optional name for the measurement
 * @returns Promise resolving to the result of the function
 */
export async function measureAsyncFunction<T>(fn: () => Promise<T>, name?: string): Promise<T> {
  const mark = measurePerformance(name || 'anonymous-async-function');
  try {
    return await fn();
  } finally {
    mark.end();
    performanceMetrics.record(mark.name, mark.duration!);
  }
}