/**
 * @fileoverview Missing Pack Placeholder UI
 * 
 * Change 416: Runtime "missing pack" placeholder UI showing provenance
 * and error information without crashing.
 * 
 * @module @cardplay/ui/components/missing-pack-placeholder
 */

import type { PackNotFoundError } from '../../extensions/errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Information about a missing pack.
 */
export interface MissingPackInfo {
  /** Pack ID that was not found */
  packId: string;
  /** Error that occurred */
  error?: PackNotFoundError;
  /** Where this pack was referenced (for debugging) */
  referencedBy?: string;
  /** Expected provenance (if known) */
  expectedProvenance?: string;
  /** Suggested action for the user */
  suggestedAction: string;
}

// ============================================================================
// PLACEHOLDER CREATION
// ============================================================================

/**
 * Creates info about a missing pack.
 */
export function createMissingPackInfo(
  packId: string,
  error?: PackNotFoundError,
  context?: {
    referencedBy?: string;
    expectedProvenance?: string;
  }
): MissingPackInfo {
  const info: MissingPackInfo = {
    packId,
    suggestedAction: getSuggestedAction(packId, error),
  };
  
  if (error !== undefined) {
    info.error = error;
  }
  if (context?.referencedBy !== undefined) {
    info.referencedBy = context.referencedBy;
  }
  if (context?.expectedProvenance !== undefined) {
    info.expectedProvenance = context.expectedProvenance;
  }
  
  return info;
}

/**
 * Gets a suggested action for a missing pack.
 */
function getSuggestedAction(packId: string, _error?: PackNotFoundError): string {
  // Built-in packs should never be missing
  if (!packId.includes(':')) {
    return 'This is a built-in pack and should not be missing. Please report this bug.';
  }

  // Third-party packs
  return `Install the "${packId}" pack or remove references to it from your project.`;
}

/**
 * Creates a placeholder DOM element for a missing pack.
 * 
 * This shows the pack ID, error information, and suggested actions
 * without crashing the application.
 */
export function createMissingPackPlaceholder(info: MissingPackInfo): HTMLElement {
  const container = document.createElement('div');
  container.className = 'missing-pack-placeholder';
  container.setAttribute('data-pack-id', info.packId);
  
  // Title
  const title = document.createElement('div');
  title.className = 'missing-pack-placeholder__title';
  title.textContent = '⚠️ Missing Pack';
  container.appendChild(title);
  
  // Pack ID
  const packIdEl = document.createElement('div');
  packIdEl.className = 'missing-pack-placeholder__pack-id';
  packIdEl.textContent = info.packId;
  container.appendChild(packIdEl);
  
  // Error message
  if (info.error) {
    const errorEl = document.createElement('div');
    errorEl.className = 'missing-pack-placeholder__error';
    errorEl.textContent = info.error.toUserMessage();
    container.appendChild(errorEl);
  }
  
  // Provenance
  if (info.expectedProvenance) {
    const provenanceEl = document.createElement('div');
    provenanceEl.className = 'missing-pack-placeholder__provenance';
    provenanceEl.textContent = `Expected source: ${info.expectedProvenance}`;
    container.appendChild(provenanceEl);
  }
  
  // Referenced by
  if (info.referencedBy) {
    const refEl = document.createElement('div');
    refEl.className = 'missing-pack-placeholder__referenced-by';
    refEl.textContent = `Used by: ${info.referencedBy}`;
    container.appendChild(refEl);
  }
  
  // Suggested action
  if (info.suggestedAction) {
    const actionEl = document.createElement('div');
    actionEl.className = 'missing-pack-placeholder__action';
    actionEl.textContent = info.suggestedAction;
    container.appendChild(actionEl);
  }
  
  return container;
}

/**
 * Creates an inline placeholder for a missing pack (compact version).
 */
export function createInlineMissingPackPlaceholder(packId: string): HTMLElement {
  const container = document.createElement('span');
  container.className = 'missing-pack-placeholder--inline';
  container.setAttribute('data-pack-id', packId);
  container.setAttribute('title', `Pack "${packId}" not found`);
  container.textContent = `⚠️ ${packId}`;
  return container;
}

// ============================================================================
// LOADING WITH PLACEHOLDER FALLBACK
// ============================================================================

/**
 * Attempts to load a pack, returning a placeholder on failure.
 */
export async function loadPackWithPlaceholder<T>(
  packId: string,
  loader: () => Promise<T>,
  context?: {
    referencedBy?: string;
    expectedProvenance?: string;
  }
): Promise<{ success: true; value: T } | { success: false; placeholder: HTMLElement; info: MissingPackInfo }> {
  try {
    const value = await loader();
    return { success: true, value };
  } catch (error) {
    const packError = error instanceof Error 
      ? error as PackNotFoundError
      : undefined;
    
    const info = createMissingPackInfo(packId, packError, context);
    const placeholder = createMissingPackPlaceholder(info);
    
    console.warn(`[MissingPackPlaceholder] Pack "${packId}" not found`, {
      error,
      context,
    });
    
    return { success: false, placeholder, info };
  }
}

/**
 * Synchronous version that returns placeholder immediately.
 */
export function getPackOrPlaceholder<T>(
  packId: string,
  getter: () => T | undefined,
  context?: {
    referencedBy?: string;
    expectedProvenance?: string;
  }
): { success: true; value: T } | { success: false; placeholder: HTMLElement; info: MissingPackInfo } {
  try {
    const value = getter();
    if (value !== undefined) {
      return { success: true, value };
    }
    
    // Pack not found
    const info = createMissingPackInfo(packId, undefined, context);
    const placeholder = createMissingPackPlaceholder(info);
    
    console.warn(`[MissingPackPlaceholder] Pack "${packId}" not found`, context);
    
    return { success: false, placeholder, info };
  } catch (error) {
    const packError = error instanceof Error 
      ? error as PackNotFoundError
      : undefined;
    
    const info = createMissingPackInfo(packId, packError, context);
    const placeholder = createMissingPackPlaceholder(info);
    
    console.error(`[MissingPackPlaceholder] Error accessing pack "${packId}"`, {
      error,
      context,
    });
    
    return { success: false, placeholder, info };
  }
}
