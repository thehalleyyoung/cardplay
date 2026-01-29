/**
 * @fileoverview Micro-interactions for better user feedback
 * 
 * Provides subtle animations and visual feedback for user actions to enhance
 * the browser experience with delightful, responsive interactions.
 * 
 * @module @cardplay/ui/components/micro-interactions
 */

import { prefersReducedMotion } from '../accessibility/helper';

/**
 * Adds a subtle bounce animation to an element
 */
export function bounceElement(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    return;
  }
  
  element.style.transform = 'scale(1.05)';
  element.style.transition = 'transform 0.15s ease-out';
  
  requestAnimationFrame(() => {
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      setTimeout(() => {
        element.style.transform = '';
        element.style.transition = '';
      }, 150);
    }, 50);
  });
}

/**
 * Adds a ripple effect to an element at click position
 */
export function addRippleEffect(element: HTMLElement, event: MouseEvent): void {
  if (prefersReducedMotion()) {
    return;
  }
  
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const ripple = document.createElement('span');
  ripple.style.position = 'absolute';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = '10px';
  ripple.style.height = '10px';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = 'var(--accent-color, rgba(255, 255, 255, 0.6))';
  ripple.style.transform = 'translate(-50%, -50%) scale(0)';
  ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
  ripple.style.opacity = '1';
  ripple.style.pointerEvents = 'none';
  
  element.style.position = element.style.position || 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  requestAnimationFrame(() => {
    ripple.style.transform = 'translate(-50%, -50%) scale(10)';
    ripple.style.opacity = '0';
    
    setTimeout(() => {
      ripple.remove();
    }, 400);
  });
}

/**
 * Adds a pulse animation to draw attention
 */
export function pulseElement(element: HTMLElement, count: number = 2): void {
  if (prefersReducedMotion()) {
    return;
  }
  
  let pulseCount = 0;
  const originalBoxShadow = element.style.boxShadow;
  
  const pulse = () => {
    if (pulseCount >= count) {
      element.style.boxShadow = originalBoxShadow;
      return;
    }
    
    element.style.boxShadow = '0 0 0 4px var(--accent-color, rgba(59, 130, 246, 0.5))';
    element.style.transition = 'box-shadow 0.3s ease-out';
    
    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
      pulseCount++;
      
      if (pulseCount < count) {
        setTimeout(pulse, 300);
      } else {
        element.style.transition = '';
      }
    }, 300);
  };
  
  pulse();
}

/**
 * Adds a shake animation to indicate error or invalid action
 */
export function shakeElement(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    // For reduced motion, just flash the border color
    const originalBorder = element.style.border;
    element.style.border = '2px solid var(--error-color, #ef4444)';
    setTimeout(() => {
      element.style.border = originalBorder;
    }, 500);
    return;
  }
  
  const keyframes = [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-10px)' },
    { transform: 'translateX(10px)' },
    { transform: 'translateX(-10px)' },
    { transform: 'translateX(10px)' },
    { transform: 'translateX(0)' }
  ];
  
  element.animate(keyframes, {
    duration: 400,
    easing: 'ease-in-out'
  });
}

/**
 * Adds a success checkmark animation
 */
export function showSuccessCheckmark(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    return;
  }
  
  const checkmark = document.createElement('span');
  checkmark.innerHTML = '✓';
  checkmark.style.position = 'absolute';
  checkmark.style.right = '8px';
  checkmark.style.top = '50%';
  checkmark.style.transform = 'translateY(-50%) scale(0)';
  checkmark.style.color = 'var(--success-color, #10b981)';
  checkmark.style.fontSize = '20px';
  checkmark.style.fontWeight = 'bold';
  checkmark.style.transition = 'transform 0.3s ease-out';
  checkmark.style.pointerEvents = 'none';
  
  element.style.position = element.style.position || 'relative';
  element.appendChild(checkmark);
  
  requestAnimationFrame(() => {
    checkmark.style.transform = 'translateY(-50%) scale(1)';
    
    setTimeout(() => {
      checkmark.style.opacity = '0';
      checkmark.style.transition = 'opacity 0.2s ease-out, transform 0.3s ease-out';
      
      setTimeout(() => {
        checkmark.remove();
      }, 200);
    }, 1000);
  });
}

/**
 * Adds hover lift effect to interactive cards
 */
export function addHoverLift(element: HTMLElement): () => void {
  if (prefersReducedMotion()) {
    return () => {};
  }
  
  const onMouseEnter = () => {
    element.style.transform = 'translateY(-2px)';
    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    element.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';
  };
  
  const onMouseLeave = () => {
    element.style.transform = 'translateY(0)';
    element.style.boxShadow = '';
  };
  
  element.addEventListener('mouseenter', onMouseEnter);
  element.addEventListener('mouseleave', onMouseLeave);
  
  return () => {
    element.removeEventListener('mouseenter', onMouseEnter);
    element.removeEventListener('mouseleave', onMouseLeave);
    element.style.transform = '';
    element.style.boxShadow = '';
    element.style.transition = '';
  };
}

/**
 * Adds a loading shimmer effect to placeholders
 */
export function addShimmerEffect(element: HTMLElement): () => void {
  if (prefersReducedMotion()) {
    element.style.backgroundColor = 'var(--surface-2)';
    return () => {
      element.style.backgroundColor = '';
    };
  }
  
  element.style.background = 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)';
  element.style.backgroundSize = '200% 100%';
  element.style.animation = 'shimmer 2s infinite';
  
  // Inject keyframes if not already present
  if (!document.getElementById('shimmer-keyframes')) {
    const style = document.createElement('style');
    style.id = 'shimmer-keyframes';
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  return () => {
    element.style.background = '';
    element.style.backgroundSize = '';
    element.style.animation = '';
  };
}

/**
 * Adds a smooth expand/collapse animation
 */
export async function animateExpand(element: HTMLElement, expand: boolean): Promise<void> {
  if (prefersReducedMotion()) {
    element.style.display = expand ? '' : 'none';
    return;
  }
  
  if (expand) {
    element.style.display = '';
    element.style.overflow = 'hidden';
    const height = element.scrollHeight;
    element.style.height = '0';
    element.style.transition = 'height 0.3s ease-out';
    
    requestAnimationFrame(() => {
      element.style.height = `${height}px`;
    });
    
    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
        resolve();
      }, 300);
    });
  } else {
    element.style.overflow = 'hidden';
    const height = element.scrollHeight;
    element.style.height = `${height}px`;
    element.style.transition = 'height 0.3s ease-out';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.height = '0';
      });
    });
    
    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
        resolve();
      }, 300);
    });
  }
}

/**
 * Adds a fade in animation
 */
export async function fadeIn(element: HTMLElement, duration: number = 300): Promise<void> {
  if (prefersReducedMotion()) {
    element.style.opacity = '1';
    return;
  }
  
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ease-out`;
  
  requestAnimationFrame(() => {
    element.style.opacity = '1';
  });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Adds a fade out animation
 */
export async function fadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
  if (prefersReducedMotion()) {
    element.style.opacity = '0';
    return;
  }
  
  element.style.transition = `opacity ${duration}ms ease-out`;
  element.style.opacity = '0';
  
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}
