/**
 * @fileoverview Beautiful Toast Notification System
 * 
 * Provides elegant, accessible toast notifications for user feedback.
 * Features automatic stacking, progress indicators, and smooth animations.
 * Respects prefers-reduced-motion and provides keyboard navigation.
 * 
 * @module @cardplay/ui/components/toast-notification
 */

import { fadeOut, slideIn, duration } from '../animations';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Toast notification type
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast notification position
 */
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

/**
 * Toast notification options
 */
export interface ToastOptions {
  /** Toast message (required) */
  message: string;
  
  /** Toast type (determines color/icon) */
  type?: ToastType;
  
  /** Duration in ms (0 for persistent) */
  duration?: number;
  
  /** Show action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  
  /** Show close button */
  closable?: boolean;
  
  /** Custom icon (overrides type icon) */
  icon?: string;
  
  /** Toast position */
  position?: ToastPosition;
  
  /** Show progress bar */
  showProgress?: boolean;
  
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

/**
 * Toast notification instance
 */
export interface Toast {
  readonly id: string;
  readonly element: HTMLElement;
  readonly options: Required<ToastOptions>;
  dismiss: () => void;
  isPaused: boolean;
  remainingTime: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATION = 5000;
const DEFAULT_POSITION: ToastPosition = 'bottom-right';

const TYPE_CONFIG: Record<ToastType, { icon: string; color: string }> = {
  info: { icon: 'ℹ️', color: '#3B82F6' },
  success: { icon: '✓', color: '#10B981' },
  warning: { icon: '⚠️', color: '#F59E0B' },
  error: { icon: '✕', color: '#EF4444' },
};

// ============================================================================
// STATE
// ============================================================================

/** Active toasts by position */
const toastsByPosition = new Map<ToastPosition, Toast[]>();

/** Toast ID counter */
let toastIdCounter = 0;

/** Toast containers by position */
const containers = new Map<ToastPosition, HTMLElement>();

// ============================================================================
// TOAST MANAGER
// ============================================================================

/**
 * Show a toast notification
 */
export function showToast(options: ToastOptions): Toast {
  const fullOptions: Required<ToastOptions> = {
    message: options.message,
    type: options.type ?? 'info',
    duration: options.duration ?? DEFAULT_DURATION,
    action: options.action ?? null as any,
    closable: options.closable ?? true,
    icon: options.icon ?? '',
    position: options.position ?? DEFAULT_POSITION,
    showProgress: options.showProgress ?? true,
    onDismiss: options.onDismiss ?? (() => {}),
  };

  const toast = createToast(fullOptions);
  addToastToContainer(toast);
  
  return toast;
}

/**
 * Convenience methods for specific toast types
 */
export function toastInfo(message: string, options?: Partial<ToastOptions>): Toast {
  return showToast({ ...options, message, type: 'info' });
}

export function toastSuccess(message: string, options?: Partial<ToastOptions>): Toast {
  return showToast({ ...options, message, type: 'success' });
}

export function toastWarning(message: string, options?: Partial<ToastOptions>): Toast {
  return showToast({ ...options, message, type: 'warning' });
}

export function toastError(message: string, options?: Partial<ToastOptions>): Toast {
  return showToast({ ...options, message, type: 'error' });
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  toastsByPosition.forEach(toasts => {
    toasts.forEach(toast => toast.dismiss());
  });
}

/**
 * Dismiss toasts at a specific position
 */
export function dismissToastsAtPosition(position: ToastPosition): void {
  const toasts = toastsByPosition.get(position) ?? [];
  toasts.forEach(toast => toast.dismiss());
}

// ============================================================================
// INTERNAL FUNCTIONS
// ============================================================================

/**
 * Create a toast element and instance
 */
function createToast(options: Required<ToastOptions>): Toast {
  const id = `toast-${toastIdCounter++}`;
  const typeConfig = TYPE_CONFIG[options.type];
  
  // Create toast element
  const element = document.createElement('div');
  element.className = `toast toast--${options.type}`;
  element.setAttribute('role', 'alert');
  element.setAttribute('aria-live', options.type === 'error' ? 'assertive' : 'polite');
  element.id = id;
  
  // Icon
  const iconEl = document.createElement('div');
  iconEl.className = 'toast__icon';
  iconEl.textContent = options.icon || typeConfig.icon;
  iconEl.style.color = typeConfig.color;
  element.appendChild(iconEl);
  
  // Content
  const contentEl = document.createElement('div');
  contentEl.className = 'toast__content';
  
  const messageEl = document.createElement('div');
  messageEl.className = 'toast__message';
  messageEl.textContent = options.message;
  contentEl.appendChild(messageEl);
  
  // Action button
  if (options.action) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'toast__action';
    actionBtn.textContent = options.action.label;
    actionBtn.onclick = (e) => {
      e.stopPropagation();
      options.action!.onClick();
      toast.dismiss();
    };
    contentEl.appendChild(actionBtn);
  }
  
  element.appendChild(contentEl);
  
  // Close button
  if (options.closable) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      toast.dismiss();
    };
    element.appendChild(closeBtn);
  }
  
  // Progress bar
  let progressBar: HTMLElement | null = null;
  if (options.showProgress && options.duration > 0) {
    progressBar = document.createElement('div');
    progressBar.className = 'toast__progress';
    progressBar.style.backgroundColor = typeConfig.color;
    element.appendChild(progressBar);
  }
  
  // Create toast instance
  let dismissTimer: number | null = null;
  let startTime: number = Date.now();
  let isPaused = false;
  let remainingTime = options.duration;
  
  const toast: Toast = {
    id,
    element,
    options,
    isPaused,
    remainingTime,
    dismiss: () => {
      if (dismissTimer !== null) {
        clearTimeout(dismissTimer);
      }
      
      // Animate out
      const animation = fadeOut(element, duration.fast as number);
      animation.onfinish = () => {
        removeToastFromContainer(toast);
        element.remove();
        options.onDismiss();
      };
    },
  };
  
  // Auto-dismiss logic
  if (options.duration > 0) {
    const scheduleDismiss = () => {
      startTime = Date.now();
      dismissTimer = window.setTimeout(() => {
        toast.dismiss();
      }, remainingTime);
      
      // Animate progress bar
      if (progressBar) {
        progressBar.animate(
          [
            { width: '100%' },
            { width: '0%' }
          ],
          {
            duration: remainingTime,
            easing: 'linear',
            fill: 'forwards'
          }
        );
      }
    };
    
    // Pause on hover
    element.addEventListener('mouseenter', () => {
      if (!isPaused && dismissTimer !== null) {
        isPaused = true;
        clearTimeout(dismissTimer);
        remainingTime -= Date.now() - startTime;
        
        // Pause progress bar
        if (progressBar) {
          const animations = progressBar.getAnimations();
          animations.forEach(anim => anim.pause());
        }
      }
    });
    
    // Resume on leave
    element.addEventListener('mouseleave', () => {
      if (isPaused) {
        isPaused = false;
        
        // Resume progress bar
        if (progressBar) {
          const animations = progressBar.getAnimations();
          animations.forEach(anim => anim.play());
        }
        
        scheduleDismiss();
      }
    });
    
    scheduleDismiss();
  }
  
  return toast;
}

/**
 * Get or create container for position
 */
function getContainer(position: ToastPosition): HTMLElement {
  let container = containers.get(position);
  
  if (!container) {
    container = document.createElement('div');
    container.className = `toast-container toast-container--${position}`;
    document.body.appendChild(container);
    containers.set(position, container);
  }
  
  return container;
}

/**
 * Add toast to container
 */
function addToastToContainer(toast: Toast): void {
  const container = getContainer(toast.options.position);
  const position = toast.options.position;
  
  // Get or create position array
  let toasts = toastsByPosition.get(position);
  if (!toasts) {
    toasts = [];
    toastsByPosition.set(position, toasts);
  }
  
  // Add to array
  toasts.push(toast);
  
  // Add to DOM
  if (position.includes('bottom')) {
    container.prepend(toast.element);
  } else {
    container.appendChild(toast.element);
  }
  
  // Inject styles (once)
  injectToastStyles();
  
  // Animate in
  const direction = position.includes('top') ? 'top' : 'bottom';
  slideIn(toast.element, direction, duration.normal);
}

/**
 * Remove toast from container
 */
function removeToastFromContainer(toast: Toast): void {
  const position = toast.options.position;
  const toasts = toastsByPosition.get(position);
  
  if (toasts) {
    const index = toasts.indexOf(toast);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
    
    // Clean up container if empty
    if (toasts.length === 0) {
      const container = containers.get(position);
      if (container) {
        container.remove();
        containers.delete(position);
      }
      toastsByPosition.delete(position);
    }
  }
}

// ============================================================================
// STYLES
// ============================================================================

let stylesInjected = false;

function injectToastStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    /* Toast containers */
    .toast-container {
      position: fixed;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
      padding: 1rem;
      max-width: 400px;
    }
    
    .toast-container > * {
      pointer-events: auto;
    }
    
    /* Position variants */
    .toast-container--top-left {
      top: 0;
      left: 0;
      align-items: flex-start;
    }
    
    .toast-container--top-center {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
    }
    
    .toast-container--top-right {
      top: 0;
      right: 0;
      align-items: flex-end;
    }
    
    .toast-container--bottom-left {
      bottom: 0;
      left: 0;
      align-items: flex-start;
    }
    
    .toast-container--bottom-center {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
    }
    
    .toast-container--bottom-right {
      bottom: 0;
      right: 0;
      align-items: flex-end;
    }
    
    /* Toast */
    .toast {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--surface-color, #2a2a2a);
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                  0 0 0 1px rgba(255, 255, 255, 0.1);
      color: var(--text-color, #fff);
      min-width: 300px;
      max-width: 100%;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
    }
    
    .toast:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.15);
    }
    
    /* Toast types */
    .toast--info {
      border-left: 3px solid #3B82F6;
    }
    
    .toast--success {
      border-left: 3px solid #10B981;
    }
    
    .toast--warning {
      border-left: 3px solid #F59E0B;
    }
    
    .toast--error {
      border-left: 3px solid #EF4444;
    }
    
    /* Toast parts */
    .toast__icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      line-height: 1;
    }
    
    .toast__content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .toast__message {
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--text-color, #fff);
    }
    
    .toast__action {
      align-self: flex-start;
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: 0.25rem;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-color, #fff);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .toast__action:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .toast__action:active {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .toast__close {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      border: none;
      border-radius: 0.25rem;
      background: transparent;
      color: var(--text-muted, #ccc);
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .toast__close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-color, #fff);
    }
    
    .toast__close:active {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      background: currentColor;
      opacity: 0.5;
    }
    
    /* Accessibility */
    .toast__action:focus-visible,
    .toast__close:focus-visible {
      outline: 2px solid var(--accent-color, #4a90e2);
      outline-offset: 2px;
    }
    
    /* Responsive */
    @media (max-width: 640px) {
      .toast-container {
        left: 0 !important;
        right: 0 !important;
        transform: none !important;
        max-width: none;
        padding: 0.75rem;
      }
      
      .toast {
        min-width: 0;
        width: 100%;
      }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .toast {
        transition: none;
      }
      
      .toast:hover {
        transform: none;
      }
    }
  `;
  
  document.head.appendChild(style);
}
