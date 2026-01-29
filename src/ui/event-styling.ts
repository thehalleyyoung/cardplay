/**
 * @fileoverview Event Styling Utilities (J009)
 * 
 * Provides styling utilities to visually differentiate generated vs manual events.
 * Uses CSS classes and inline styles to add visual indicators.
 * 
 * @module @cardplay/ui/event-styling
 */

import type { Event } from '../types/event';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Event origin - how the event was created
 */
export type EventOrigin = 'manual' | 'generated' | 'imported' | 'adapted';

/**
 * Event styling configuration
 */
export interface EventStyling {
  /** Origin of the event */
  origin: EventOrigin;
  /** Opacity adjustment (0-1) */
  opacity: number;
  /** CSS class names */
  classes: string[];
  /** Additional CSS properties */
  styles: Partial<CSSStyleDeclaration>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default opacity values for different event origins
 */
export const DEFAULT_OPACITIES: Record<EventOrigin, number> = {
  manual: 1.0,
  generated: 0.7,
  imported: 0.85,
  adapted: 0.8,
};

/**
 * CSS class prefixes for event origins
 */
export const EVENT_ORIGIN_CLASSES: Record<EventOrigin, string> = {
  manual: 'event--manual',
  generated: 'event--generated',
  imported: 'event--imported',
  adapted: 'event--adapted',
};

// ============================================================================
// EVENT ORIGIN DETECTION
// ============================================================================

/**
 * Determine event origin from event metadata.
 * 
 * Checks event payload for origin hints:
 * - meta.generated: boolean flag
 * - meta.source: string indicating source type
 * - meta.adapted: boolean flag for phrase-adapted events
 * 
 * @param event - Event to analyze
 * @returns Event origin classification
 */
export function detectEventOrigin(event: Event<unknown>): EventOrigin {
  const payload = event.payload as Record<string, unknown> | null | undefined;
  
  if (!payload || typeof payload !== 'object') {
    return 'manual';
  }
  
  const meta = (payload as { meta?: Record<string, unknown> }).meta;
  
  if (!meta || typeof meta !== 'object') {
    return 'manual';
  }
  
  // Check for generated flag
  if (meta.generated === true) {
    return 'generated';
  }
  
  // Check for adapted flag (phrase adaptation)
  if (meta.adapted === true) {
    return 'adapted';
  }
  
  // Check for import source
  if (meta.source === 'import' || meta.imported === true) {
    return 'imported';
  }
  
  // Default to manual
  return 'manual';
}

/**
 * Get event origin from multiple events (most common).
 * 
 * @param events - Events to analyze
 * @returns Most common origin, or 'manual' if mixed
 */
export function detectOriginBulk(events: Event<unknown>[]): EventOrigin {
  if (events.length === 0) return 'manual';
  
  const origins = events.map(detectEventOrigin);
  const counts = new Map<EventOrigin, number>();
  
  for (const origin of origins) {
    counts.set(origin, (counts.get(origin) || 0) + 1);
  }
  
  let maxCount = 0;
  let maxOrigin: EventOrigin = 'manual';
  
  for (const [origin, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxOrigin = origin;
    }
  }
  
  return maxOrigin;
}

// ============================================================================
// STYLING GENERATION
// ============================================================================

/**
 * Get event styling based on origin.
 * 
 * @param event - Event to style
 * @param options - Override options
 * @returns Styling configuration
 */
export function getEventStyling(
  event: Event<unknown>,
  options?: {
    opacityOverride?: number;
    additionalClasses?: string[];
  }
): EventStyling {
  const origin = detectEventOrigin(event);
  const opacity = options?.opacityOverride ?? DEFAULT_OPACITIES[origin];
  
  const classes = [
    EVENT_ORIGIN_CLASSES[origin],
    ...(options?.additionalClasses || [])
  ];
  
  const styles: Partial<CSSStyleDeclaration> = {
    opacity: String(opacity),
  };
  
  // Add subtle visual indicator for generated content
  if (origin === 'generated') {
    styles.filter = 'brightness(0.95)';
  }
  
  return {
    origin,
    opacity,
    classes,
    styles,
  };
}

/**
 * Apply event styling to a DOM element.
 * 
 * @param element - DOM element to style
 * @param event - Event to get styling from
 * @param options - Override options
 */
export function applyEventStyling(
  element: HTMLElement | SVGElement,
  event: Event<unknown>,
  options?: {
    opacityOverride?: number;
    additionalClasses?: string[];
  }
): void {
  const styling = getEventStyling(event, options);
  
  // Add CSS classes
  for (const className of styling.classes) {
    element.classList.add(className);
  }
  
  // Apply inline styles
  for (const [prop, value] of Object.entries(styling.styles)) {
    if (value !== undefined) {
      (element.style as any)[prop] = value;
    }
  }
}

/**
 * Remove event styling from a DOM element.
 * 
 * @param element - DOM element to clean
 */
export function removeEventStyling(element: HTMLElement | SVGElement): void {
  // Remove all event origin classes
  for (const className of Object.values(EVENT_ORIGIN_CLASSES)) {
    element.classList.remove(className);
  }
  
  // Reset opacity and filter
  element.style.opacity = '';
  element.style.filter = '';
}

// ============================================================================
// CSS INJECTION
// ============================================================================

let stylesInjected = false;

/**
 * Inject event styling CSS into the document.
 * Only injects once per page load.
 */
export function injectEventStylingCSS(): void {
  if (stylesInjected || typeof document === 'undefined') {
    return;
  }
  
  const styleId = 'event-styling-css';
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Event origin styling (J009) */
    .event--manual {
      /* Manual events: full opacity, standard styling */
    }
    
    .event--generated {
      /* Generated events: slightly transparent with subtle indicator */
      opacity: 0.7;
      filter: brightness(0.95);
    }
    
    .event--generated::after {
      /* Optional: add small generated indicator */
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background: var(--color-ai-indicator, rgba(100, 150, 255, 0.6));
      pointer-events: none;
    }
    
    .event--imported {
      /* Imported events: medium opacity */
      opacity: 0.85;
    }
    
    .event--adapted {
      /* Phrase-adapted events: medium-high opacity */
      opacity: 0.8;
    }
    
    .event--adapted::after {
      /* Optional: add small adapted indicator */
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background: var(--color-adapted-indicator, rgba(150, 100, 255, 0.6));
      pointer-events: none;
    }
    
    /* High contrast mode overrides */
    @media (prefers-contrast: high) {
      .event--generated,
      .event--imported,
      .event--adapted {
        opacity: 1;
      }
      
      .event--generated {
        border: 1px dashed var(--color-ai-indicator, #66f);
      }
      
      .event--adapted {
        border: 1px dotted var(--color-adapted-indicator, #96f);
      }
    }
  `;
  
  document.head.appendChild(style);
  stylesInjected = true;
}
