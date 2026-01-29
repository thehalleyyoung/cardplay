/**
 * Loading Indicator Component
 *
 * Shows loading/progress state for async operations
 */

export interface LoadingOptions {
  message?: string;
  progress?: number; // 0-100, undefined for indeterminate
  cancellable?: boolean;
  onCancel?: () => void;
}

/**
 * Global loading indicator
 */
export class LoadingIndicator {
  private container: HTMLElement | null = null;
  private messageElement: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private cancelButton: HTMLButtonElement | null = null;
  private options: LoadingOptions = {};

  /**
   * Show loading indicator
   */
  show(options: LoadingOptions = {}): void {
    this.options = options;

    if (!this.container) {
      this.create();
    }

    if (this.container) {
      this.container.style.display = 'flex';
      this.updateContent();
    }
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Update progress
   */
  setProgress(progress: number, message?: string): void {
    this.options.progress = progress;
    if (message) {
      this.options.message = message;
    }
    this.updateContent();
  }

  /**
   * Update message
   */
  setMessage(message: string): void {
    this.options.message = message;
    this.updateContent();
  }

  private create(): void {
    this.container = document.createElement('div');
    this.container.className = 'loading-indicator';
    this.container.innerHTML = `
      <div class="loading-indicator__content">
        <div class="loading-indicator__spinner"></div>
        <div class="loading-indicator__message"></div>
        <div class="loading-indicator__progress-bar">
          <div class="loading-indicator__progress-fill"></div>
        </div>
        <button class="loading-indicator__cancel" style="display: none;">Cancel</button>
      </div>
    `;

    this.messageElement = this.container.querySelector('.loading-indicator__message');
    this.progressBar = this.container.querySelector('.loading-indicator__progress-fill');
    this.cancelButton = this.container.querySelector('.loading-indicator__cancel');

    if (this.cancelButton) {
      this.cancelButton.addEventListener('click', () => {
        if (this.options.onCancel) {
          this.options.onCancel();
        }
      });
    }

    document.body.appendChild(this.container);
    this.updateContent();
  }

  private updateContent(): void {
    if (!this.container) return;

    // Update message
    if (this.messageElement) {
      this.messageElement.textContent = this.options.message || 'Loading...';
    }

    // Update progress
    const progressContainer = this.container.querySelector('.loading-indicator__progress-bar') as HTMLElement;
    if (this.options.progress !== undefined) {
      if (progressContainer) {
        progressContainer.style.display = 'block';
      }
      if (this.progressBar) {
        this.progressBar.style.width = `${this.options.progress}%`;
      }
    } else {
      if (progressContainer) {
        progressContainer.style.display = 'none';
      }
    }

    // Update cancel button
    if (this.cancelButton) {
      this.cancelButton.style.display = this.options.cancellable ? 'block' : 'none';
    }
  }

  destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

// Singleton instance
let loadingIndicatorInstance: LoadingIndicator | undefined;

/**
 * Get the global loading indicator instance
 */
export function getLoadingIndicator(): LoadingIndicator {
  if (!loadingIndicatorInstance) {
    loadingIndicatorInstance = new LoadingIndicator();
  }
  return loadingIndicatorInstance;
}

/**
 * Show loading indicator
 */
export function showLoading(options?: LoadingOptions): void {
  getLoadingIndicator().show(options);
}

/**
 * Hide loading indicator
 */
export function hideLoading(): void {
  getLoadingIndicator().hide();
}

/**
 * Inject loading indicator styles
 */
export function injectLoadingStyles(): void {
  if (document.getElementById('loading-indicator-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'loading-indicator-styles';
  style.textContent = `
    .loading-indicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
    }

    .loading-indicator__content {
      background-color: var(--color-surface, #1e1e1e);
      border-radius: 8px;
      padding: 2rem;
      min-width: 300px;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .loading-indicator__spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-border, #333);
      border-top-color: var(--color-primary, #007bff);
      border-radius: 50%;
      animation: loading-spinner 0.8s linear infinite;
    }

    @keyframes loading-spinner {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-indicator__message {
      color: var(--color-text-primary, #fff);
      font-size: 1rem;
      text-align: center;
    }

    .loading-indicator__progress-bar {
      width: 100%;
      height: 8px;
      background-color: var(--color-border, #333);
      border-radius: 4px;
      overflow: hidden;
    }

    .loading-indicator__progress-fill {
      height: 100%;
      background-color: var(--color-primary, #007bff);
      transition: width 0.3s ease;
    }

    .loading-indicator__cancel {
      padding: 0.5rem 1rem;
      background-color: var(--color-danger, #dc3545);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .loading-indicator__cancel:hover {
      background-color: var(--color-danger-hover, #c82333);
    }
  `;

  document.head.appendChild(style);
}
