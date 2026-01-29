/**
 * @fileoverview Beautiful animation utilities for CardPlay UI
 * 
 * Provides smooth, accessible animations with respect for user preferences.
 * All animations respect prefers-reduced-motion.
 */

/**
 * Animation timing functions (easing curves)
 */
export const easing = {
  // Standard material design curves
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  
  // Smooth organic curves
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  
  // Special effects
  anticipate: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Standard animation durations (in ms)
 */
export const duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 750,
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration respecting user preference
 */
export function getAnimationDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

/**
 * Create a fade-in animation
 */
export function fadeIn(element: HTMLElement, durationMs = duration.normal): Animation {
  const dur = getAnimationDuration(durationMs);
  return element.animate(
    [
      { opacity: 0 },
      { opacity: 1 }
    ],
    {
      duration: dur,
      easing: easing.decelerate,
      fill: 'forwards'
    }
  );
}

/**
 * Create a fade-out animation
 */
export function fadeOut(element: HTMLElement, durationMs = duration.normal): Animation {
  const dur = getAnimationDuration(durationMs);
  return element.animate(
    [
      { opacity: 1 },
      { opacity: 0 }
    ],
    {
      duration: dur,
      easing: easing.accelerate,
      fill: 'forwards'
    }
  );
}

/**
 * Create a slide-in animation from a direction
 */
export function slideIn(
  element: HTMLElement, 
  direction: 'top' | 'right' | 'bottom' | 'left' = 'bottom',
  durationMs = duration.normal
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  const translations: Record<typeof direction, string> = {
    top: 'translateY(-100%)',
    right: 'translateX(100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)'
  };
  
  return element.animate(
    [
      { transform: translations[direction], opacity: 0 },
      { transform: 'translate(0, 0)', opacity: 1 }
    ],
    {
      duration: dur,
      easing: easing.decelerate,
      fill: 'forwards'
    }
  );
}

/**
 * Create a slide-out animation to a direction
 */
export function slideOut(
  element: HTMLElement,
  direction: 'top' | 'right' | 'bottom' | 'left' = 'bottom',
  durationMs = duration.normal
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  const translations: Record<typeof direction, string> = {
    top: 'translateY(-100%)',
    right: 'translateX(100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)'
  };
  
  return element.animate(
    [
      { transform: 'translate(0, 0)', opacity: 1 },
      { transform: translations[direction], opacity: 0 }
    ],
    {
      duration: dur,
      easing: easing.accelerate,
      fill: 'forwards'
    }
  );
}

/**
 * Create a scale animation (grow/shrink)
 */
export function scale(
  element: HTMLElement,
  from: number,
  to: number,
  durationMs = duration.normal
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  return element.animate(
    [
      { transform: `scale(${from})`, opacity: from === 0 ? 0 : 1 },
      { transform: `scale(${to})`, opacity: to === 0 ? 0 : 1 }
    ],
    {
      duration: dur,
      easing: to > from ? easing.decelerate : easing.accelerate,
      fill: 'forwards'
    }
  );
}

/**
 * Create a pulse animation (attention-grabbing)
 */
export function pulse(element: HTMLElement, durationMs = duration.slow): Animation {
  const dur = getAnimationDuration(durationMs);
  
  return element.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    {
      duration: dur,
      easing: easing.smooth,
      iterations: 1
    }
  );
}

/**
 * Create a shake animation (error indication)
 */
export function shake(element: HTMLElement, durationMs = duration.fast): Animation {
  const dur = getAnimationDuration(durationMs);
  
  return element.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ],
    {
      duration: dur,
      easing: easing.sharp
    }
  );
}

/**
 * Create a ripple effect animation (material design)
 */
export function ripple(
  element: HTMLElement,
  x: number,
  y: number,
  durationMs = duration.slow
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  // Create ripple element
  const rippleEl = document.createElement('span');
  rippleEl.style.position = 'absolute';
  rippleEl.style.left = `${x}px`;
  rippleEl.style.top = `${y}px`;
  rippleEl.style.width = '0';
  rippleEl.style.height = '0';
  rippleEl.style.borderRadius = '50%';
  rippleEl.style.backgroundColor = 'currentColor';
  rippleEl.style.opacity = '0.3';
  rippleEl.style.pointerEvents = 'none';
  rippleEl.style.transform = 'translate(-50%, -50%)';
  
  element.appendChild(rippleEl);
  
  const animation = rippleEl.animate(
    [
      { width: '0', height: '0', opacity: 0.3 },
      { width: '500px', height: '500px', opacity: 0 }
    ],
    {
      duration: dur,
      easing: easing.decelerate
    }
  );
  
  // Remove ripple element after animation
  animation.onfinish = () => {
    rippleEl.remove();
  };
  
  return animation;
}

/**
 * Create a highlight animation (flashing border)
 */
export function highlight(
  element: HTMLElement,
  color = 'var(--color-accent-500)',
  durationMs = duration.slow
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  const originalBoxShadow = element.style.boxShadow;
  
  const animation = element.animate(
    [
      { boxShadow: `0 0 0 0 ${color}` },
      { boxShadow: `0 0 0 4px ${color}` },
      { boxShadow: `0 0 0 0 ${color}` }
    ],
    {
      duration: dur,
      easing: easing.smooth
    }
  );
  
  animation.onfinish = () => {
    element.style.boxShadow = originalBoxShadow;
  };
  
  return animation;
}

/**
 * Stagger animations for a list of elements
 */
export function stagger(
  elements: HTMLElement[],
  animationFn: (el: HTMLElement) => Animation,
  delayMs = 50
): Animation[] {
  const adjustedDelay = getAnimationDuration(delayMs);
  
  return elements.map((el, index) => {
    setTimeout(() => animationFn(el), index * adjustedDelay);
    return animationFn(el);
  });
}

/**
 * Create a smooth height transition animation
 */
export function animateHeight(
  element: HTMLElement,
  fromHeight: number,
  toHeight: number,
  durationMs = duration.normal
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  return element.animate(
    [
      { height: `${fromHeight}px`, overflow: 'hidden' },
      { height: `${toHeight}px`, overflow: 'hidden' }
    ],
    {
      duration: dur,
      easing: easing.smooth,
      fill: 'forwards'
    }
  );
}

/**
 * Create an expand/collapse animation
 */
export function expandCollapse(
  element: HTMLElement,
  expanded: boolean,
  durationMs = duration.normal
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  if (expanded) {
    // Expanding
    const height = element.scrollHeight;
    return element.animate(
      [
        { height: '0px', opacity: 0, overflow: 'hidden' },
        { height: `${height}px`, opacity: 1, overflow: 'hidden' }
      ],
      {
        duration: dur,
        easing: easing.decelerate,
        fill: 'forwards'
      }
    );
  } else {
    // Collapsing
    return element.animate(
      [
        { height: `${element.scrollHeight}px`, opacity: 1, overflow: 'hidden' },
        { height: '0px', opacity: 0, overflow: 'hidden' }
      ],
      {
        duration: dur,
        easing: easing.accelerate,
        fill: 'forwards'
      }
    );
  }
}

/**
 * Animate color transition
 */
export function colorTransition(
  element: HTMLElement,
  property: 'color' | 'backgroundColor' | 'borderColor',
  fromColor: string,
  toColor: string,
  durationMs = duration.normal
): Animation {
  const dur = getAnimationDuration(durationMs);
  
  return element.animate(
    [
      { [property]: fromColor },
      { [property]: toColor }
    ],
    {
      duration: dur,
      easing: easing.smooth,
      fill: 'forwards'
    }
  );
}

/**
 * Create a loading spinner animation
 */
export function spin(element: HTMLElement, durationMs = 1000): Animation {
  // Spinners should always animate (even with reduced motion)
  return element.animate(
    [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ],
    {
      duration: durationMs,
      easing: 'linear',
      iterations: Infinity
    }
  );
}

/**
 * Parallax scroll effect
 */
export function parallax(
  element: HTMLElement,
  speed: number = 0.5
): () => void {
  if (prefersReducedMotion()) {
    return () => {}; // No-op cleanup
  }
  
  function updatePosition() {
    const scrollY = window.scrollY;
    const offset = scrollY * speed;
    element.style.transform = `translateY(${offset}px)`;
  }
  
  window.addEventListener('scroll', updatePosition, { passive: true });
  updatePosition(); // Initial position
  
  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', updatePosition);
  };
}

/**
 * Apply entrance animation based on intersection observer
 */
export function animateOnIntersection(
  element: HTMLElement,
  animationFn: (el: HTMLElement) => Animation,
  options: IntersectionObserverInit = { threshold: 0.1 }
): IntersectionObserver {
  if (prefersReducedMotion()) {
    animationFn(element);
    return new IntersectionObserver(() => {}); // No-op observer
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animationFn(element);
        observer.unobserve(element);
      }
    });
  }, options);
  
  observer.observe(element);
  return observer;
}
