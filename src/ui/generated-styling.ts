/**
 * @fileoverview Generated Content Styling (J009)
 * 
 * Visual distinction between manually-created and AI-generated content.
 * Provides CSS classes and variables for consistent styling across all views.
 * 
 * @module @cardplay/ui/generated-styling
 */

/**
 * CSS classes for generated content
 */
export const GENERATED_CLASSES = {
  /** Apply to generated events (lighter, semi-transparent) */
  generatedEvent: 'content-generated',
  /** Apply to manually created events (full opacity) */
  manualEvent: 'content-manual',
  /** Apply to frozen events (generated but now manual) */
  frozenEvent: 'content-frozen',
} as const;

/**
 * Gets CSS variables for generated content styling.
 * J009: Generated events use lighter alpha for visual distinction.
 */
export function getGeneratedContentVars(): Record<string, string> {
  return {
    // Generated content (lighter, semi-transparent)
    '--generated-opacity': '0.7',
    '--generated-border-opacity': '0.5',
    '--generated-bg-overlay': 'rgba(100, 100, 255, 0.1)', // Subtle blue tint
    
    // Manual content (full opacity)
    '--manual-opacity': '1.0',
    '--manual-border-opacity': '1.0',
    '--manual-bg-overlay': 'transparent',
    
    // Frozen content (was generated, now manual)
    '--frozen-opacity': '1.0',
    '--frozen-border-opacity': '1.0',
    '--frozen-bg-overlay': 'rgba(100, 200, 100, 0.05)', // Subtle green tint
    
    // Badge colors
    '--generated-badge-bg': 'rgba(100, 100, 255, 0.15)',
    '--generated-badge-text': '#6b7bff',
    '--manual-badge-bg': 'transparent',
    '--manual-badge-text': 'var(--color-on-surface)',
    '--frozen-badge-bg': 'rgba(100, 200, 100, 0.15)',
    '--frozen-badge-text': '#10b981',
  };
}

/**
 * Injects CSS for generated content styling into document.
 * Call once at app startup or when board system initializes.
 */
export function injectGeneratedContentStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'generated-content-styles';
  if (document.getElementById(styleId)) return;
  
  const vars = getGeneratedContentVars();
  const cssText = `
/* Generated Content Styling Variables (J009) */
:root {
${Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`).join('\n')}
}

/* Generated Event Styling */
.content-generated {
  opacity: var(--generated-opacity);
  border-style: dashed !important;
  border-opacity: var(--generated-border-opacity);
  position: relative;
}

.content-generated::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--generated-bg-overlay);
  pointer-events: none;
  border-radius: inherit;
}

/* Manual Event Styling (default, full opacity) */
.content-manual {
  opacity: var(--manual-opacity);
  border-style: solid;
}

/* Frozen Event Styling (was generated, now manual) */
.content-frozen {
  opacity: var(--frozen-opacity);
  border-style: solid;
  position: relative;
}

.content-frozen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--frozen-bg-overlay);
  pointer-events: none;
  border-radius: inherit;
}

/* Generated Badge (small indicator) */
.generated-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--generated-badge-bg);
  color: var(--generated-badge-text);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.manual-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--manual-badge-bg);
  color: var(--manual-badge-text);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.frozen-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--frozen-badge-bg);
  color: var(--frozen-badge-text);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Hover states */
.content-generated:hover {
  opacity: 0.85;
}

.content-frozen:hover {
  opacity: 1.0;
}

/* Selection states */
.content-generated.selected {
  opacity: 1.0;
  border-style: solid !important;
}

.content-frozen.selected {
  opacity: 1.0;
}

/* Track/Clip header badges */
.track-header .generated-badge,
.clip-header .generated-badge {
  margin-left: 0.5rem;
}

/* Accessibility: ensure sufficient contrast */
@media (prefers-contrast: more) {
  .content-generated {
    opacity: 0.85;
  }
  
  .content-generated::before {
    background: rgba(100, 100, 255, 0.2);
  }
}

/* Reduced motion: disable overlay animations */
@media (prefers-reduced-motion: reduce) {
  .content-generated::before,
  .content-frozen::before {
    transition: none;
  }
}
`;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = cssText;
  document.head.appendChild(style);
}

/**
 * Determines the content class for an event based on generation state.
 * 
 * @param isGenerated Whether the event was AI-generated
 * @param isFrozen Whether the event was generated but is now frozen (manual)
 * @returns CSS class name
 */
export function getContentClass(isGenerated: boolean, isFrozen: boolean): string {
  if (isFrozen) return GENERATED_CLASSES.frozenEvent;
  if (isGenerated) return GENERATED_CLASSES.generatedEvent;
  return GENERATED_CLASSES.manualEvent;
}

/**
 * Creates a badge element for content type.
 * 
 * @param type Content type ('generated', 'manual', or 'frozen')
 * @returns HTML element for the badge
 */
export function createContentBadge(type: 'generated' | 'manual' | 'frozen'): HTMLElement {
  const badge = document.createElement('span');
  
  switch (type) {
    case 'generated':
      badge.className = 'generated-badge';
      badge.textContent = 'AI';
      badge.title = 'Generated by AI - click to freeze';
      break;
    case 'frozen':
      badge.className = 'frozen-badge';
      badge.textContent = 'Frozen';
      badge.title = 'Was generated, now manual';
      break;
    case 'manual':
      // Manual content typically doesn't need a badge
      // But include for completeness
      badge.className = 'manual-badge';
      badge.textContent = 'Manual';
      badge.title = 'Manually created';
      badge.style.display = 'none'; // Hidden by default
      break;
  }
  
  return badge;
}

/**
 * Event metadata for tracking generation state.
 * This should be stored in event.meta or similar field.
 */
export interface GenerationMetadata {
  /** Was this event AI-generated? */
  generated: boolean;
  /** Generator that created this event (if generated) */
  generatorType?: 'melody' | 'bass' | 'drums' | 'arp' | 'fill' | 'chord';
  /** Generation timestamp */
  generatedAt?: number;
  /** Was this event frozen (generated → manual)? */
  frozen?: boolean;
  /** Freeze timestamp */
  frozenAt?: number;
}

/**
 * Gets default generation metadata for a manual event.
 */
export function getManualMetadata(): GenerationMetadata {
  return {
    generated: false,
  };
}

/**
 * Gets generation metadata for a newly generated event.
 * 
 * @param generatorType Type of generator used
 * @returns Generation metadata
 */
export function getGeneratedMetadata(
  generatorType?: GenerationMetadata['generatorType']
): GenerationMetadata {
  if (generatorType === undefined) {
    return {
      generated: true,
      generatedAt: Date.now(),
    };
  }
  
  return {
    generated: true,
    generatorType,
    generatedAt: Date.now(),
  };
}

/**
 * Freezes a generated event, making it manual.
 * 
 * @param metadata Existing generation metadata
 * @returns Updated metadata with frozen state
 */
export function freezeGenerated(metadata: GenerationMetadata): GenerationMetadata {
  return {
    ...metadata,
    frozen: true,
    frozenAt: Date.now(),
  };
}
