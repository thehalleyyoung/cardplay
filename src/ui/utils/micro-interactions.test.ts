/**
 * Tests for micro-interactions utilities
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addPulseOnClick,
  addRippleEffect,
  addHoverLift,
  shake,
  showSuccessCheckmark,
  highlightFlash,
  createLoadingSpinner,
  smoothScrollTo,
  animateNumber,
  fadeIn,
  fadeOut,
  slideIn,
} from './micro-interactions';

describe('Micro-interactions', () => {
  let element: HTMLDivElement;
  
  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    
    // Mock matchMedia for reduced motion tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });
  
  afterEach(() => {
    document.body.removeChild(element);
  });
  
  describe('addPulseOnClick', () => {
    it('adds pulse animation on click', () => {
      addPulseOnClick(element);
      element.click();
      
      expect(element.style.transform).toBe('scale(0.95)');
      
      // Wait for animation to complete
      setTimeout(() => {
        expect(element.style.transform).toBe('scale(1)');
      }, 150);
    });
    
    it('respects reduced motion preference', () => {
      // Mock reduced motion
      (window.matchMedia as any).mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      addPulseOnClick(element);
      element.click();
      
      expect(element.style.transform).not.toBe('scale(0.95)');
    });
  });
  
  describe('addRippleEffect', () => {
    it('creates ripple element on click', () => {
      addRippleEffect(element);
      
      const rect = element.getBoundingClientRect();
      const clickEvent = new MouseEvent('click', {
        clientX: rect.left + 10,
        clientY: rect.top + 10,
        bubbles: true,
      });
      
      element.dispatchEvent(clickEvent);
      
      const ripple = element.querySelector('span');
      expect(ripple).toBeTruthy();
      expect(element.style.position).toBe('relative');
      expect(element.style.overflow).toBe('hidden');
    });
    
    it('injects animation styles once', () => {
      addRippleEffect(element);
      addRippleEffect(document.createElement('div'));
      
      const styles = document.querySelectorAll('#ripple-animation-styles');
      expect(styles.length).toBe(1);
    });
  });
  
  describe('addHoverLift', () => {
    it('adds hover lift effect', () => {
      addHoverLift(element);
      
      expect(element.style.transition).toContain('transform');
      expect(element.style.transition).toContain('box-shadow');
      
      element.dispatchEvent(new MouseEvent('mouseenter'));
      expect(element.style.transform).toBe('translateY(-2px)');
      
      element.dispatchEvent(new MouseEvent('mouseleave'));
      expect(element.style.transform).toBe('translateY(0)');
    });
  });
  
  describe('shake', () => {
    it('adds shake animation', () => {
      shake(element);
      
      expect(element.style.animation).toContain('shake');
      
      const styles = document.querySelector('#shake-animation-styles');
      expect(styles).toBeTruthy();
    });
  });
  
  describe('showSuccessCheckmark', () => {
    it('shows success checkmark', () => {
      showSuccessCheckmark(element);
      
      const checkmark = element.querySelector('.success-checkmark');
      expect(checkmark).toBeTruthy();
      expect(checkmark?.textContent).toBe('✓');
    });
  });
  
  describe('highlightFlash', () => {
    it('adds highlight flash', () => {
      const originalBg = element.style.background;
      highlightFlash(element, '#ffd700');
      
      expect(element.style.background).toBe('#ffd700');
      expect(element.style.transition).toContain('background');
      
      // Background should restore after timeout
      setTimeout(() => {
        expect(element.style.background).toBe(originalBg);
      }, 700);
    });
  });
  
  describe('createLoadingSpinner', () => {
    it('creates spinner element', () => {
      const spinner = createLoadingSpinner(20);
      
      expect(spinner.className).toBe('micro-spinner');
      expect(spinner.style.width).toBe('20px');
      expect(spinner.style.height).toBe('20px');
      expect(spinner.style.borderRadius).toBe('50%');
    });
  });
  
  describe('smoothScrollTo', () => {
    it('scrolls element into view', () => {
      const scrollIntoViewMock = vi.fn();
      element.scrollIntoView = scrollIntoViewMock;
      
      smoothScrollTo(element);
      
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  });
  
  describe('animateNumber', () => {
    it('animates number from start to end', () => {
      element.textContent = '0';
      animateNumber(element, 0, 100, 100);
      
      // Should start animating
      expect(element.textContent).not.toBe('0');
    });
    
    it('respects reduced motion', () => {
      // Mock reduced motion
      (window.matchMedia as any).mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      element.textContent = '0';
      animateNumber(element, 0, 100);
      
      expect(element.textContent).toBe('100');
    });
  });
  
  describe('fadeIn', () => {
    it('fades in element', () => {
      fadeIn(element, 300);
      
      // Initially should be transparent
      requestAnimationFrame(() => {
        expect(element.style.opacity).toBe('1');
      });
    });
  });
  
  describe('fadeOut', () => {
    it('fades out element', async () => {
      element.style.opacity = '1';
      
      const promise = fadeOut(element, 100);
      
      await promise;
      expect(element.style.opacity).toBe('0');
    });
  });
  
  describe('slideIn', () => {
    it('slides in from bottom', () => {
      slideIn(element, 'bottom', 20, 300);
      
      expect(element.style.transform).toBe('translateY(20px)');
      expect(element.style.opacity).toBe('0');
      
      requestAnimationFrame(() => {
        expect(element.style.transform).toBe('translate(0, 0)');
        expect(element.style.opacity).toBe('1');
      });
    });
    
    it('slides in from top', () => {
      slideIn(element, 'top', 20);
      expect(element.style.transform).toBe('translateY(-20px)');
    });
    
    it('slides in from left', () => {
      slideIn(element, 'left', 20);
      expect(element.style.transform).toBe('translateX(-20px)');
    });
    
    it('slides in from right', () => {
      slideIn(element, 'right', 20);
      expect(element.style.transform).toBe('translateX(20px)');
    });
  });
});
