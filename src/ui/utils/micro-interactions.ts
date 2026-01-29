/**
 * Micro-interactions and Visual Feedback
 *
 * Subtle animations and feedback for user actions to improve UI feel.
 * All animations respect prefers-reduced-motion.
 */

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Pulse animation for buttons on click
 */
export function addPulseOnClick(element: HTMLElement): void {
  element.addEventListener('click', (e) => {
    if (prefersReducedMotion()) return;
    
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      target.style.transform = 'scale(1)';
    }, 100);
  });
}

/**
 * Ripple effect for interactive elements
 */
export function addRippleEffect(element: HTMLElement, color = 'rgba(255, 255, 255, 0.3)'): void {
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  
  element.addEventListener('click', (e) => {
    if (prefersReducedMotion()) return;
    
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = color;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple 600ms ease-out';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
  
  // Inject ripple animation if not already present
  if (!document.querySelector('#ripple-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation-styles';
    style.textContent = `
      @keyframes ripple {
        from {
          transform: scale(0);
          opacity: 1;
        }
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Add subtle hover lift effect
 */
export function addHoverLift(element: HTMLElement): void {
  if (prefersReducedMotion()) return;
  
  element.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
  
  element.addEventListener('mouseenter', () => {
    element.style.transform = 'translateY(-2px)';
    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  });
  
  element.addEventListener('mouseleave', () => {
    element.style.transform = 'translateY(0)';
    element.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
  });
}

/**
 * Shake animation for errors/invalid actions
 */
export function shake(element: HTMLElement): void {
  if (prefersReducedMotion()) return;
  
  element.style.animation = 'shake 0.5s ease';
  
  setTimeout(() => {
    element.style.animation = '';
  }, 500);
  
  // Inject shake animation if not already present
  if (!document.querySelector('#shake-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'shake-animation-styles';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Success checkmark animation
 */
export function showSuccessCheckmark(container: HTMLElement, duration = 2000): void {
  const checkmark = document.createElement('div');
  checkmark.className = 'success-checkmark';
  checkmark.innerHTML = '✓';
  checkmark.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 48px;
    color: var(--success-color, #4caf50);
    font-weight: bold;
    pointer-events: none;
    z-index: 1000;
  `;
  
  container.style.position = 'relative';
  container.appendChild(checkmark);
  
  if (!prefersReducedMotion()) {
    checkmark.style.animation = 'checkmark-bounce 0.5s ease';
    checkmark.style.transform = 'translate(-50%, -50%) scale(1)';
  } else {
    checkmark.style.transform = 'translate(-50%, -50%) scale(1)';
  }
  
  setTimeout(() => {
    checkmark.style.transition = 'opacity 0.3s ease';
    checkmark.style.opacity = '0';
    setTimeout(() => checkmark.remove(), 300);
  }, duration);
  
  // Inject checkmark animation if not already present
  if (!document.querySelector('#checkmark-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'checkmark-animation-styles';
    style.textContent = `
      @keyframes checkmark-bounce {
        0% { transform: translate(-50%, -50%) scale(0); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Highlight flash for drawing attention
 */
export function highlightFlash(element: HTMLElement, color = '#ffd700'): void {
  if (prefersReducedMotion()) return;
  
  const originalBackground = element.style.background || '';
  element.style.transition = 'background 0.3s ease';
  element.style.background = color;
  
  setTimeout(() => {
    element.style.background = originalBackground;
  }, 600);
}

/**
 * Loading spinner element
 */
export function createLoadingSpinner(size = 20): HTMLElement {
  const spinner = document.createElement('div');
  spinner.className = 'micro-spinner';
  spinner.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border: 2px solid var(--border-color, #e0e0e0);
    border-top-color: var(--primary-color, #007bff);
    border-radius: 50%;
    display: inline-block;
  `;
  
  if (!prefersReducedMotion()) {
    spinner.style.animation = 'spinner-rotate 0.8s linear infinite';
  }
  
  // Inject spinner animation if not already present
  if (!document.querySelector('#spinner-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-animation-styles';
    style.textContent = `
      @keyframes spinner-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  return spinner;
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    element.scrollIntoView();
  } else {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Count-up animation for numbers
 */
export function animateNumber(
  element: HTMLElement,
  from: number,
  to: number,
  duration = 1000
): void {
  if (prefersReducedMotion()) {
    element.textContent = to.toString();
    return;
  }
  
  const startTime = performance.now();
  const diff = to - from;
  
  function update(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = Math.round(from + diff * eased);
    
    element.textContent = current.toString();
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Easing function for smooth animations
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Add entrance animation to element
 */
export function fadeIn(element: HTMLElement, duration = 300): void {
  if (prefersReducedMotion()) {
    element.style.opacity = '1';
    return;
  }
  
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ease`;
  
  requestAnimationFrame(() => {
    element.style.opacity = '1';
  });
}

/**
 * Add exit animation to element
 */
export function fadeOut(element: HTMLElement, duration = 300): Promise<void> {
  return new Promise((resolve) => {
    if (prefersReducedMotion()) {
      element.style.opacity = '0';
      resolve();
      return;
    }
    
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    
    setTimeout(resolve, duration);
  });
}

/**
 * Slide in from direction
 */
export function slideIn(
  element: HTMLElement,
  direction: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
  distance = 20,
  duration = 300
): void {
  if (prefersReducedMotion()) return;
  
  const transforms: Record<typeof direction, string> = {
    top: `translateY(-${distance}px)`,
    bottom: `translateY(${distance}px)`,
    left: `translateX(-${distance}px)`,
    right: `translateX(${distance}px)`,
  };
  
  element.style.transform = transforms[direction];
  element.style.opacity = '0';
  element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
  
  requestAnimationFrame(() => {
    element.style.transform = 'translate(0, 0)';
    element.style.opacity = '1';
  });
}
