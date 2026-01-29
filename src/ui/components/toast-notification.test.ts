/**
 * @fileoverview Tests for Toast Notification System
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  showToast, 
  toastInfo, 
  toastSuccess, 
  toastWarning, 
  toastError,
  dismissAllToasts,
  dismissToastsAtPosition,
  type Toast
} from './toast-notification';

describe('Toast Notification System', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock Element.animate
    HTMLElement.prototype.animate = vi.fn().mockReturnValue({
      onfinish: null,
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      finish: vi.fn(),
    } as any);

    // Mock Element.getAnimations
    HTMLElement.prototype.getAnimations = vi.fn().mockReturnValue([]);

    // Clean up any existing toasts
    dismissAllToasts();
    // Clean up containers
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.toast-container').forEach(el => el.remove());
    }
    vi.useFakeTimers();
  });

  afterEach(() => {
    dismissAllToasts();
    vi.restoreAllMocks();
  });

  describe('showToast', () => {
    it('should create and display a toast', () => {
      const toast = showToast({ message: 'Test message' });
      
      expect(toast).toBeDefined();
      expect(toast.element).toBeInstanceOf(HTMLElement);
      expect(toast.element.textContent).toContain('Test message');
      expect(document.body.contains(toast.element)).toBe(true);
    });

    it('should create toast with correct type class', () => {
      const toast = showToast({ message: 'Test', type: 'success' });
      expect(toast.element.classList.contains('toast--success')).toBe(true);
    });

    it('should show toast at specified position', () => {
      const toast = showToast({ message: 'Test', position: 'top-left' });
      const container = document.querySelector('.toast-container--top-left');
      
      expect(container).toBeTruthy();
      expect(container?.contains(toast.element)).toBe(true);
    });

    it('should add action button when action is provided', () => {
      const actionFn = vi.fn();
      const toast = showToast({
        message: 'Test',
        action: {
          label: 'Undo',
          onClick: actionFn
        }
      });
      
      const actionBtn = toast.element.querySelector('.toast__action');
      expect(actionBtn).toBeTruthy();
      expect(actionBtn?.textContent).toBe('Undo');
    });

    it('should call action onClick when action button is clicked', () => {
      const actionFn = vi.fn();
      const toast = showToast({
        message: 'Test',
        action: {
          label: 'Undo',
          onClick: actionFn
        }
      });
      
      const actionBtn = toast.element.querySelector('.toast__action') as HTMLButtonElement;
      actionBtn?.click();
      
      expect(actionFn).toHaveBeenCalled();
    });

    it('should show close button when closable is true', () => {
      const toast = showToast({ message: 'Test', closable: true });
      const closeBtn = toast.element.querySelector('.toast__close');
      
      expect(closeBtn).toBeTruthy();
    });

    it('should not show close button when closable is false', () => {
      const toast = showToast({ message: 'Test', closable: false });
      const closeBtn = toast.element.querySelector('.toast__close');
      
      expect(closeBtn).toBeFalsy();
    });

    it('should show progress bar when showProgress is true', () => {
      const toast = showToast({ message: 'Test', showProgress: true, duration: 3000 });
      const progressBar = toast.element.querySelector('.toast__progress');
      
      expect(progressBar).toBeTruthy();
    });

    it('should use custom icon when provided', () => {
      const toast = showToast({ message: 'Test', icon: '🎵' });
      const iconEl = toast.element.querySelector('.toast__icon');
      
      expect(iconEl?.textContent).toBe('🎵');
    });
  });

  describe('Convenience methods', () => {
    it('should create info toast', () => {
      const toast = toastInfo('Info message');
      expect(toast.options.type).toBe('info');
      expect(toast.element.classList.contains('toast--info')).toBe(true);
    });

    it('should create success toast', () => {
      const toast = toastSuccess('Success message');
      expect(toast.options.type).toBe('success');
      expect(toast.element.classList.contains('toast--success')).toBe(true);
    });

    it('should create warning toast', () => {
      const toast = toastWarning('Warning message');
      expect(toast.options.type).toBe('warning');
      expect(toast.element.classList.contains('toast--warning')).toBe(true);
    });

    it('should create error toast', () => {
      const toast = toastError('Error message');
      expect(toast.options.type).toBe('error');
      expect(toast.element.classList.contains('toast--error')).toBe(true);
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after duration', () => {
      const onDismiss = vi.fn();
      const toast = showToast({
        message: 'Test',
        duration: 1000,
        onDismiss
      });
      
      expect(document.body.contains(toast.element)).toBe(true);
      
      vi.advanceTimersByTime(1100);
      
      // Toast should be removed after animation
      vi.advanceTimersByTime(200);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not auto-dismiss when duration is 0', () => {
      const toast = showToast({
        message: 'Test',
        duration: 0
      });
      
      vi.advanceTimersByTime(10000);
      
      expect(document.body.contains(toast.element)).toBe(true);
    });
  });

  describe('Manual dismiss', () => {
    it('should dismiss toast when dismiss() is called', () => {
      const onDismiss = vi.fn();
      const toast = showToast({
        message: 'Test',
        onDismiss
      });
      
      toast.dismiss();
      
      vi.advanceTimersByTime(200);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should dismiss toast when close button is clicked', () => {
      const onDismiss = vi.fn();
      const toast = showToast({
        message: 'Test',
        closable: true,
        onDismiss
      });
      
      const closeBtn = toast.element.querySelector('.toast__close') as HTMLButtonElement;
      closeBtn?.click();
      
      vi.advanceTimersByTime(200);
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('dismissAllToasts', () => {
    it('should dismiss all active toasts', () => {
      const toast1 = showToast({ message: 'Toast 1' });
      const toast2 = showToast({ message: 'Toast 2' });
      const toast3 = showToast({ message: 'Toast 3', position: 'top-left' });
      
      expect(document.body.contains(toast1.element)).toBe(true);
      expect(document.body.contains(toast2.element)).toBe(true);
      expect(document.body.contains(toast3.element)).toBe(true);
      
      dismissAllToasts();
      
      vi.advanceTimersByTime(200);
      
      expect(document.body.contains(toast1.element)).toBe(false);
      expect(document.body.contains(toast2.element)).toBe(false);
      expect(document.body.contains(toast3.element)).toBe(false);
    });
  });

  describe('dismissToastsAtPosition', () => {
    it('should dismiss only toasts at specified position', () => {
      const toast1 = showToast({ message: 'Bottom', position: 'bottom-right' });
      const toast2 = showToast({ message: 'Top', position: 'top-left' });
      
      dismissToastsAtPosition('bottom-right');
      
      vi.advanceTimersByTime(200);
      
      expect(document.body.contains(toast1.element)).toBe(false);
      expect(document.body.contains(toast2.element)).toBe(true);
    });
  });

  describe('Stacking', () => {
    it('should stack multiple toasts at same position', () => {
      const toast1 = showToast({ message: 'First' });
      const toast2 = showToast({ message: 'Second' });
      const toast3 = showToast({ message: 'Third' });
      
      const container = document.querySelector('.toast-container--bottom-right');
      expect(container?.children.length).toBe(3);
    });

    it('should create separate containers for different positions', () => {
      showToast({ message: 'Bottom', position: 'bottom-right' });
      showToast({ message: 'Top', position: 'top-left' });
      
      const bottomContainer = document.querySelector('.toast-container--bottom-right');
      const topContainer = document.querySelector('.toast-container--top-left');
      
      expect(bottomContainer).toBeTruthy();
      expect(topContainer).toBeTruthy();
      expect(bottomContainer?.children.length).toBe(1);
      expect(topContainer?.children.length).toBe(1);
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      const toast = showToast({ message: 'Test' });
      expect(toast.element.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="polite" for non-error toasts', () => {
      const toast = toastInfo('Test');
      expect(toast.element.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-live="assertive" for error toasts', () => {
      const toast = toastError('Test');
      expect(toast.element.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-label on close button', () => {
      const toast = showToast({ message: 'Test', closable: true });
      const closeBtn = toast.element.querySelector('.toast__close');
      
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close notification');
    });
  });
});
