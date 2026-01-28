/**
 * @fileoverview CardScript Async/Await Support.
 * 
 * Provides async execution for CardScript with support for:
 * - Promise-based async functions
 * - Await expressions
 * - Async card processing
 * - Cancelable async operations
 * - Timeout handling
 * 
 * @module @cardplay/user-cards/cardscript/async
 */

import type { CardContext } from '../../cards/card';

// ============================================================================
// ASYNC CONTEXT
// ============================================================================

/**
 * Cancelation token for async operations.
 */
export interface CancelToken {
  readonly isCanceled: boolean;
  readonly reason: string | undefined;
  cancel(reason?: string): void;
  throwIfCanceled(): void;
  onCancel(callback: (reason?: string) => void): () => void;
}

/**
 * Creates a cancelation token.
 */
export function createCancelToken(): CancelToken {
  let canceled = false;
  let cancelReason: string | undefined;
  const callbacks: Array<(reason?: string) => void> = [];
  
  const token: CancelToken = {
    get isCanceled() { return canceled; },
    get reason() { return cancelReason; },
    
    cancel(reason?: string) {
      if (canceled) return;
      canceled = true;
      cancelReason = reason;
      for (const cb of callbacks) {
        try { cb(reason); } catch {}
      }
    },
    
    throwIfCanceled() {
      if (canceled) {
        throw new AsyncCancelError(cancelReason);
      }
    },
    
    onCancel(callback: (reason?: string) => void) {
      callbacks.push(callback);
      return () => {
        const idx = callbacks.indexOf(callback);
        if (idx >= 0) callbacks.splice(idx, 1);
      };
    },
  };
  return token;
}

/**
 * Error thrown when an async operation is canceled.
 */
export class AsyncCancelError extends Error {
  constructor(reason?: string) {
    super(reason ?? 'Operation canceled');
    this.name = 'AsyncCancelError';
  }
}

/**
 * Async execution context.
 */
export interface AsyncContext {
  readonly cancelToken: CancelToken;
  readonly cardContext: CardContext;
  readonly timeout?: number;
  readonly startTime: number;
}

/**
 * Creates an async context.
 */
export function createAsyncContext(cardContext: CardContext, timeout?: number): AsyncContext {
  return {
    cancelToken: createCancelToken(),
    cardContext,
    ...(timeout !== undefined ? { timeout } : {}),
    startTime: performance.now(),
  };
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Delays execution for a given number of milliseconds.
 */
export function delay(ms: number, cancelToken?: CancelToken): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    
    if (cancelToken) {
      const unsubscribe = cancelToken.onCancel((reason) => {
        clearTimeout(timer);
        reject(new AsyncCancelError(reason));
      });
      
      // Clean up on resolve
      setTimeout(() => unsubscribe(), ms + 1);
    }
  });
}

/**
 * Delays until the next beat.
 */
export function delayUntilBeat(
  targetBeat: number,
  ctx: AsyncContext
): Promise<void> {
  const currentBeat = ctx.cardContext.currentTick;
  const bpm = ctx.cardContext.transport.tempo;
  const msPerBeat = 60000 / bpm;
  const beatsToWait = targetBeat - currentBeat;
  
  if (beatsToWait <= 0) {
    return Promise.resolve();
  }
  
  return delay(beatsToWait * msPerBeat, ctx.cancelToken);
}

/**
 * Delays for a given number of beats.
 */
export function delayBeats(
  beats: number,
  ctx: AsyncContext
): Promise<void> {
  const bpm = ctx.cardContext.transport.tempo;
  const msPerBeat = 60000 / bpm;
  return delay(beats * msPerBeat, ctx.cancelToken);
}

/**
 * Wraps a promise with timeout.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
    
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Wraps a promise with cancelation support.
 */
export function withCancel<T>(
  promise: Promise<T>,
  cancelToken: CancelToken
): Promise<T> {
  return new Promise((resolve, reject) => {
    const unsubscribe = cancelToken.onCancel((reason) => {
      reject(new AsyncCancelError(reason));
    });
    
    promise
      .then((value) => {
        unsubscribe();
        resolve(value);
      })
      .catch((error) => {
        unsubscribe();
        reject(error);
      });
  });
}

/**
 * Runs multiple promises in parallel with cancelation.
 */
export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  cancelToken?: CancelToken
): Promise<T[]> {
  const promises = tasks.map(task => {
    const promise = task();
    return cancelToken ? withCancel(promise, cancelToken) : promise;
  });
  
  return Promise.all(promises);
}

/**
 * Runs promises in sequence.
 */
export async function sequence<T>(
  tasks: Array<() => Promise<T>>,
  cancelToken?: CancelToken
): Promise<T[]> {
  const results: T[] = [];
  
  for (const task of tasks) {
    cancelToken?.throwIfCanceled();
    const result = await task();
    results.push(result);
  }
  
  return results;
}

/**
 * Races multiple promises with cancelation.
 */
export function race<T>(
  promises: Promise<T>[],
  cancelToken?: CancelToken
): Promise<T> {
  if (cancelToken) {
    promises = promises.map(p => withCancel(p, cancelToken));
  }
  return Promise.race(promises);
}

// ============================================================================
// ASYNC SCHEDULER
// ============================================================================

/**
 * Scheduled async task.
 */
export interface ScheduledTask {
  readonly id: string;
  readonly targetBeat: number;
  readonly callback: () => Promise<void>;
  readonly cancelToken: CancelToken;
  completed: boolean;
}

/**
 * Async task scheduler.
 */
export class AsyncScheduler {
  private readonly tasks: ScheduledTask[] = [];
  private taskIdCounter = 0;
  
  /**
   * Schedules a task for a specific beat.
   */
  schedule(
    targetBeat: number,
    callback: () => Promise<void>,
    cancelToken?: CancelToken
  ): string {
    const id = `task_${++this.taskIdCounter}`;
    const task: ScheduledTask = {
      id,
      targetBeat,
      callback,
      cancelToken: cancelToken ?? createCancelToken(),
      completed: false,
    };
    
    // Insert sorted by targetBeat
    const idx = this.tasks.findIndex(t => t.targetBeat > targetBeat);
    if (idx === -1) {
      this.tasks.push(task);
    } else {
      this.tasks.splice(idx, 0, task);
    }
    
    return id;
  }
  
  /**
   * Schedules a task to run after N beats.
   */
  scheduleAfter(
    beats: number,
    currentBeat: number,
    callback: () => Promise<void>,
    cancelToken?: CancelToken
  ): string {
    return this.schedule(currentBeat + beats, callback, cancelToken);
  }
  
  /**
   * Schedules a task to run on the next beat boundary.
   */
  scheduleNextBeat(
    currentBeat: number,
    callback: () => Promise<void>,
    cancelToken?: CancelToken
  ): string {
    const nextBeat = Math.ceil(currentBeat);
    return this.schedule(nextBeat, callback, cancelToken);
  }
  
  /**
   * Schedules a task to run at the start of the next bar.
   */
  scheduleNextBar(
    currentBeat: number,
    beatsPerBar: number,
    callback: () => Promise<void>,
    cancelToken?: CancelToken
  ): string {
    const currentBar = Math.floor(currentBeat / beatsPerBar);
    const nextBarBeat = (currentBar + 1) * beatsPerBar;
    return this.schedule(nextBarBeat, callback, cancelToken);
  }
  
  /**
   * Cancels a scheduled task.
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.cancelToken.cancel('Task canceled');
      task.completed = true;
      return true;
    }
    return false;
  }
  
  /**
   * Cancels all scheduled tasks.
   */
  cancelAll(): void {
    for (const task of this.tasks) {
      task.cancelToken.cancel('All tasks canceled');
      task.completed = true;
    }
  }
  
  /**
   * Processes tasks up to the current beat.
   */
  async process(currentBeat: number): Promise<void> {
    // Get tasks that should run
    const tasksToRun: ScheduledTask[] = [];
    
    while (this.tasks.length > 0 && this.tasks[0]!.targetBeat <= currentBeat) {
      const task = this.tasks.shift()!;
      if (!task.completed && !task.cancelToken.isCanceled) {
        tasksToRun.push(task);
      }
    }
    
    // Run tasks in parallel
    await Promise.all(tasksToRun.map(async (task) => {
      try {
        await task.callback();
      } catch (e) {
        if (!(e instanceof AsyncCancelError)) {
          console.error(`Task ${task.id} failed:`, e);
        }
      } finally {
        task.completed = true;
      }
    }));
  }
  
  /**
   * Gets the number of pending tasks.
   */
  get pendingCount(): number {
    return this.tasks.filter(t => !t.completed).length;
  }
  
  /**
   * Gets the next scheduled beat.
   */
  get nextBeat(): number | null {
    const pending = this.tasks.find(t => !t.completed);
    return pending?.targetBeat ?? null;
  }
}

// ============================================================================
// ASYNC CARD WRAPPER
// ============================================================================

/**
 * Result from an async card process.
 */
export interface AsyncCardResult<T> {
  readonly promise: Promise<T>;
  readonly cancel: () => void;
  readonly isComplete: boolean;
}

/**
 * Wraps an async card process function.
 */
export function asyncProcess<A, B>(
  processFn: (input: A, ctx: AsyncContext) => Promise<B>,
  timeout?: number
): (input: A, cardCtx: CardContext) => AsyncCardResult<B> {
  return (input: A, cardCtx: CardContext): AsyncCardResult<B> => {
    const asyncCtx = createAsyncContext(cardCtx, timeout);
    let complete = false;
    
    const promise = (async () => {
      try {
        const result = await processFn(input, asyncCtx);
        complete = true;
        return result;
      } catch (e) {
        complete = true;
        throw e;
      }
    })();
    
    // Apply timeout if specified
    const wrappedPromise = timeout
      ? withTimeout(promise, timeout)
      : promise;
    
    return {
      promise: wrappedPromise,
      cancel: () => asyncCtx.cancelToken.cancel(),
      get isComplete() { return complete; },
    };
  };
}

// ============================================================================
// ASYNC ITERATION
// ============================================================================

/**
 * Async iterator with cancelation support.
 */
export async function* asyncIterate<T>(
  items: T[],
  delayMs: number,
  cancelToken?: CancelToken
): AsyncGenerator<T, void, unknown> {
  for (const item of items) {
    cancelToken?.throwIfCanceled();
    yield item;
    if (delayMs > 0) {
      await delay(delayMs, cancelToken);
    }
  }
}

/**
 * Collects async iterator results.
 */
export async function collect<T>(
  iterator: AsyncIterable<T>,
  cancelToken?: CancelToken
): Promise<T[]> {
  const results: T[] = [];
  
  for await (const item of iterator) {
    cancelToken?.throwIfCanceled();
    results.push(item);
  }
  
  return results;
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

/**
 * Retry options.
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
  cancelToken?: CancelToken;
}

/**
 * Retries an async operation.
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 100,
    backoff = 'exponential',
    cancelToken,
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    cancelToken?.throwIfCanceled();
    
    try {
      return await operation();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      
      if (attempt < maxAttempts - 1) {
        const waitTime = backoff === 'exponential'
          ? delayMs * Math.pow(2, attempt)
          : delayMs * (attempt + 1);
        
        await delay(waitTime, cancelToken);
      }
    }
  }
  
  throw lastError ?? new Error('Retry failed');
}

// ============================================================================
// DEBOUNCE / THROTTLE
// ============================================================================

/**
 * Debounces an async function.
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delayMs: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastResolve: ((value: unknown) => void) | null = null;
  let lastReject: ((error: unknown) => void) | null = null;
  
  return ((...args: unknown[]) => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        lastReject?.(new Error('Debounced'));
      }
      
      lastResolve = resolve;
      lastReject = reject;
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          lastResolve?.(result);
        } catch (e) {
          lastReject?.(e);
        }
        timeoutId = null;
      }, delayMs);
    });
  }) as T;
}

/**
 * Throttles an async function.
 */
export function throttleAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  intervalMs: number
): T {
  let lastCall = 0;
  let pendingPromise: Promise<unknown> | null = null;
  
  return ((...args: unknown[]) => {
    const now = performance.now();
    
    if (pendingPromise) {
      return pendingPromise;
    }
    
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      pendingPromise = fn(...args).finally(() => {
        pendingPromise = null;
      });
      return pendingPromise;
    }
    
    return new Promise((resolve) => {
      const waitTime = intervalMs - (now - lastCall);
      setTimeout(async () => {
        lastCall = performance.now();
        const result = await fn(...args);
        resolve(result);
      }, waitTime);
    });
  }) as T;
}

// ============================================================================
// SINGLETON SCHEDULER
// ============================================================================

let defaultScheduler: AsyncScheduler | null = null;

/**
 * Gets the default async scheduler.
 */
export function getAsyncScheduler(): AsyncScheduler {
  if (!defaultScheduler) {
    defaultScheduler = new AsyncScheduler();
  }
  return defaultScheduler;
}

/**
 * Schedules a task using the default scheduler.
 */
export function scheduleAt(
  targetBeat: number,
  callback: () => Promise<void>
): string {
  return getAsyncScheduler().schedule(targetBeat, callback);
}

/**
 * Schedules a task after N beats using the default scheduler.
 */
export function scheduleAfter(
  beats: number,
  currentBeat: number,
  callback: () => Promise<void>
): string {
  return getAsyncScheduler().scheduleAfter(beats, currentBeat, callback);
}
