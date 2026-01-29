/**
 * @fileoverview Focus Ring Standards (J050)
 * 
 * Provides consistent focus indicators across all interactive elements
 * for accessibility and keyboard navigation.
 * 
 * Features:
 * - WCAG 2.4.7 compliant focus indicators
 * - Theme-aware (respects high-contrast mode)
 * - Reduced-motion support
 * - Skip-to-content links
 * 
 * @module @cardplay/ui/focus-ring
 */

// ============================================================================
// FOCUS RING CSS
// ============================================================================

/**
 * Standard focus ring styles (J050)
 * 
 * Provides consistent, accessible focus indicators:
 * - 2px solid outline (WCAG 2.4.7)
 * - Theme-aware accent color
 * - 2px offset for visibility
 * - Respects prefers-contrast
 */
export const focusRingCSS = `
  /* Base focus ring */
  :focus-visible {
    outline: 2px solid var(--focus-ring-color, #4a9eff);
    outline-offset: 2px;
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    :focus-visible {
      outline-width: 3px;
      outline-offset: 3px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    :focus-visible {
      transition: none;
    }
  }

  /* Remove default browser outline */
  :focus {
    outline: none;
  }
`;

/**
 * Focus ring CSS custom properties
 */
export const focusRingTokens = `
  :root {
    --focus-ring-color: #4a9eff;
    --focus-ring-width: 2px;
    --focus-ring-offset: 2px;
    --focus-ring-transition: outline-color 0.15s ease, outline-offset 0.15s ease;
  }

  :root[data-theme="dark"] {
    --focus-ring-color: #6bb6ff;
  }

  :root[data-theme="high-contrast"] {
    --focus-ring-color: #ffffff;
    --focus-ring-width: 3px;
    --focus-ring-offset: 3px;
  }

  @media (prefers-contrast: high) {
    :root {
      --focus-ring-width: 3px;
      --focus-ring-offset: 3px;
    }
  }
`;

/**
 * Apply focus ring styles to an element
 */
export function applyFocusRing(element: HTMLElement): void {
  element.style.outline = `var(--focus-ring-width) solid var(--focus-ring-color)`;
  element.style.outlineOffset = `var(--focus-ring-offset)`;
}

/**
 * Remove focus ring (for programmatic focus that shouldn't show ring)
 */
export function removeFocusRing(element: HTMLElement): void {
  element.style.outline = 'none';
}

/**
 * Check if focus ring should be visible (keyboard navigation vs mouse)
 */
let isKeyboardNavigating = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    isKeyboardNavigating = true;
  }
});

document.addEventListener('mousedown', () => {
  isKeyboardNavigating = false;
});

export function shouldShowFocusRing(): boolean {
  return isKeyboardNavigating;
}

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Focus management for modals and overlays
 */
export class FocusTrap {
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previousFocus: HTMLElement | null = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Activate focus trap (J051)
   */
  activate(): void {
    // Save current focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Find focusable elements
    const focusableElements = this.container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), ' +
      'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    this.firstFocusable = focusableElements[0] ?? null;
    this.lastFocusable = focusableElements[focusableElements.length - 1] ?? null;

    // Focus first element
    this.firstFocusable?.focus();

    // Add event listener for tab trapping
    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Deactivate focus trap
   */
  deactivate(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);

    // Restore previous focus
    if (this.previousFocus && document.contains(this.previousFocus)) {
      this.previousFocus.focus();
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift+Tab: going backwards
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * Skip to content link (accessibility)
 */
export function createSkipLink(targetId: string, label: string = 'Skip to main content'): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = label;
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
  `;

  // Show on focus
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  return skipLink;
}

// ============================================================================
// ARIA HELPERS
// ============================================================================

/**
 * Set ARIA live region for announcements
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const liveRegion = document.getElementById('aria-live-region') || createLiveRegion();
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

function createLiveRegion(): HTMLElement {
  const region = document.createElement('div');
  region.id = 'aria-live-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  document.body.appendChild(region);
  return region;
}

/**
 * Ensure element has proper ARIA role
 */
export function ensureAccessible(element: HTMLElement, role: string, label?: string): void {
  if (!element.hasAttribute('role')) {
    element.setAttribute('role', role);
  }

  if (label && !element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
    element.setAttribute('aria-label', label);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const focusRingStandard = {
  css: focusRingCSS,
  tokens: focusRingTokens,
  apply: applyFocusRing,
  remove: removeFocusRing,
  shouldShow: shouldShowFocusRing,
  FocusTrap,
  createSkipLink,
  announceToScreenReader,
  ensureAccessible,
};

export default focusRingStandard;
