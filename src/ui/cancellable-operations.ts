/**
 * @fileoverview Cancellable Operations System
 * 
 * Provides infrastructure for cancelling long-running operations with
 * proper cleanup and user feedback. Uses AbortController/AbortSignal pattern.
 * 
 * Implements P029 from roadmap: Cancellation support for long operations
 * 
 * @module @cardplay/ui/cancellable-operations
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CancellableOperation<T> {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly progress?: number; // 0-100
  readonly cancel: () => void;
  readonly promise: Promise<T>;
}

export interface OperationConfig {
  readonly name: string;
  readonly description?: string;
  readonly onProgress?: (progress: number) => void;
  readonly onCancel?: () => void;
}

export type OperationResult<T> =
  | { success: true; value: T }
  | { success: false; cancelled: true }
  | { success: false; error: Error };

// ============================================================================
// OPERATION MANAGER
// ============================================================================

/**
 * Manages active cancellable operations.
 * Provides registry, progress tracking, and UI coordination.
 */
export class OperationManager {
  private operations = new Map<string, CancellableOperation<any>>();
  private nextId = 1;
  private listeners = new Set<(ops: CancellableOperation<any>[]) => void>();

  /**
   * Registers a cancellable operation.
   */
  register<T>(
    config: OperationConfig,
    executor: (signal: AbortSignal, updateProgress: (progress: number) => void) => Promise<T>
  ): CancellableOperation<T> {
    const id = `op-${this.nextId++}`;
    const controller = new AbortController();

    let currentProgress = 0;
    const updateProgress = (progress: number) => {
      currentProgress = Math.max(0, Math.min(100, progress));
      if (config.onProgress) {
        config.onProgress(currentProgress);
      }
      this.notifyListeners();
    };

    const cancel = () => {
      controller.abort();
      if (config.onCancel) {
        config.onCancel();
      }
      this.operations.delete(id);
      this.notifyListeners();
    };

    const promise = executor(controller.signal, updateProgress)
      .finally(() => {
        this.operations.delete(id);
        this.notifyListeners();
      });

    const operation: CancellableOperation<T> = {
      id,
      name: config.name,
      ...(config.description !== undefined ? { description: config.description } : {}),
      get progress() {
        return currentProgress;
      },
      cancel,
      promise,
    };

    this.operations.set(id, operation);
    this.notifyListeners();

    return operation;
  }

  /**
   * Gets all active operations.
   */
  getOperations(): CancellableOperation<any>[] {
    return Array.from(this.operations.values());
  }

  /**
   * Gets a specific operation by ID.
   */
  getOperation(id: string): CancellableOperation<any> | undefined {
    return this.operations.get(id);
  }

  /**
   * Cancels a specific operation.
   */
  cancelOperation(id: string): void {
    const operation = this.operations.get(id);
    if (operation) {
      operation.cancel();
    }
  }

  /**
   * Cancels all active operations.
   */
  cancelAll(): void {
    for (const operation of this.operations.values()) {
      operation.cancel();
    }
  }

  /**
   * Subscribes to operation changes.
   */
  subscribe(listener: (operations: CancellableOperation<any>[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const operations = this.getOperations();
    for (const listener of this.listeners) {
      listener(operations);
    }
  }
}

// Singleton instance
export const operationManager = new OperationManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wraps a promise in a cancellable operation with progress tracking.
 * 
 * Example:
 * ```typescript
 * const result = await cancellable(
 *   { name: 'Exporting project', description: 'Compressing files...' },
 *   async (signal, updateProgress) => {
 *     for (let i = 0; i < 100; i++) {
 *       if (signal.aborted) throw new Error('Cancelled');
 *       await processChunk(i);
 *       updateProgress((i / 100) * 100);
 *     }
 *     return exportedData;
 *   }
 * );
 * ```
 */
export async function cancellable<T>(
  config: OperationConfig,
  executor: (signal: AbortSignal, updateProgress: (progress: number) => void) => Promise<T>
): Promise<OperationResult<T>> {
  const operation = operationManager.register(config, executor);

  try {
    const value = await operation.promise;
    return { success: true, value };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, cancelled: true };
    }
    return { success: false, error: error as Error };
  }
}

/**
 * Checks if an operation was cancelled (for abort signal checking).
 */
export function throwIfCancelled(signal: AbortSignal): void {
  if (signal.aborted) {
    const error = new Error('Operation cancelled');
    error.name = 'AbortError';
    throw error;
  }
}

/**
 * Delays execution with cancellation support.
 */
export function cancellableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      const error = new Error('Operation cancelled');
      error.name = 'AbortError';
      reject(error);
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      const error = new Error('Operation cancelled');
      error.name = 'AbortError';
      reject(error);
    };

    signal.addEventListener('abort', onAbort);

    function cleanup() {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
    }
  });
}

/**
 * Runs multiple operations in parallel with a combined abort signal.
 */
export async function cancellableAll<T>(
  operations: Array<(signal: AbortSignal) => Promise<T>>,
  signal: AbortSignal
): Promise<T[]> {
  throwIfCancelled(signal);
  
  const promises = operations.map(op => op(signal));
  return Promise.all(promises);
}

/**
 * Processes items in batches with cancellation and progress tracking.
 */
export async function cancellableBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, signal: AbortSignal) => Promise<R>,
  signal: AbortSignal,
  updateProgress: (progress: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    throwIfCancelled(signal);
    
    const batch = items.slice(i, Math.min(i + batchSize, items.length));
    const batchResults = await Promise.all(
      batch.map(item => processor(item, signal))
    );
    
    results.push(...batchResults);
    updateProgress((results.length / items.length) * 100);
  }
  
  return results;
}

// ============================================================================
// UI COMPONENT: ACTIVE OPERATIONS PANEL
// ============================================================================

/**
 * Creates a UI panel showing active operations with cancel buttons.
 */
export function createOperationsPanel(container: HTMLElement): () => void {
  const panel = document.createElement('div');
  panel.className = 'active-operations-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    background: var(--color-bg-elevated, #2a2a2a);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--radius-md, 4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    display: none;
  `;

  const renderOperations = (operations: CancellableOperation<any>[]) => {
    if (operations.length === 0) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'block';
    panel.innerHTML = '';

    operations.forEach(op => {
      const item = document.createElement('div');
      item.className = 'operation-item';
      item.style.cssText = `
        padding: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--color-border, #333);
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm, 8px);
      `;

      const title = document.createElement('div');
      title.textContent = op.name;
      title.style.cssText = `
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-text, #e0e0e0);
      `;
      header.appendChild(title);

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '✕';
      cancelBtn.title = 'Cancel operation';
      cancelBtn.style.cssText = `
        padding: 4px 8px;
        border: none;
        background: var(--color-error, #f44336);
        color: white;
        border-radius: var(--radius-sm, 2px);
        cursor: pointer;
        font-size: 12px;
      `;
      cancelBtn.onclick = () => op.cancel();
      header.appendChild(cancelBtn);

      item.appendChild(header);

      if (op.description) {
        const desc = document.createElement('div');
        desc.textContent = op.description;
        desc.style.cssText = `
          font-size: var(--font-size-sm, 12px);
          color: var(--color-text-secondary, #888);
          margin-bottom: var(--spacing-sm, 8px);
        `;
        item.appendChild(desc);
      }

      if (op.progress !== undefined) {
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
          height: 4px;
          background: var(--color-bg, #1a1a1a);
          border-radius: 2px;
          overflow: hidden;
        `;

        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
          height: 100%;
          width: ${op.progress}%;
          background: var(--color-primary, #4a9eff);
          transition: width 0.2s ease;
        `;
        progressBar.appendChild(progressFill);

        const progressText = document.createElement('div');
        progressText.textContent = `${Math.round(op.progress)}%`;
        progressText.style.cssText = `
          font-size: var(--font-size-xs, 10px);
          color: var(--color-text-secondary, #888);
          text-align: right;
          margin-top: 4px;
        `;

        item.appendChild(progressBar);
        item.appendChild(progressText);
      }

      panel.appendChild(item);
    });
  };

  const unsubscribe = operationManager.subscribe(renderOperations);
  container.appendChild(panel);

  // Return cleanup function
  return () => {
    unsubscribe();
    panel.remove();
  };
}
