/**
 * Unknown Card Placeholder
 * 
 * Displays a diagnostic placeholder for missing/unknown card IDs.
 * This prevents crashes when a card pack is missing or a card ID is invalid.
 * 
 * @module ui/components/unknown-card-placeholder
 */

/**
 * Information about an unknown card.
 */
export interface UnknownCardInfo {
  /** The card ID that couldn't be found */
  readonly id: string;
  /** The context where the card was referenced (e.g., 'deck-template', 'user-board') */
  readonly context?: string;
  /** The namespace extracted from the ID (if namespaced) */
  readonly namespace?: string;
  /** Reason the card is missing */
  readonly reason?: 'not-registered' | 'pack-missing' | 'invalid-id' | 'load-error';
  /** Additional diagnostic information */
  readonly details?: string;
  /** Suggested actions */
  readonly suggestions?: readonly string[];
}

/**
 * Parses a card ID to extract namespace information.
 */
export function parseCardId(id: string): { namespace: string | undefined; name: string } {
  const colonIndex = id.indexOf(':');
  if (colonIndex === -1) {
    return { namespace: undefined, name: id };
  }
  return {
    namespace: id.slice(0, colonIndex),
    name: id.slice(colonIndex + 1),
  };
}

/**
 * Creates diagnostic information for an unknown card.
 */
export function createUnknownCardInfo(
  id: string,
  context?: string,
  reason?: UnknownCardInfo['reason'],
  details?: string
): UnknownCardInfo {
  const { namespace, name } = parseCardId(id);
  
  const suggestions: string[] = [];
  
  if (reason === 'pack-missing' && namespace) {
    suggestions.push(`Install the '${namespace}' card pack`);
    suggestions.push('Check if the pack is available in your packs folder');
  } else if (reason === 'not-registered') {
    suggestions.push('Check if the card pack is loaded');
    suggestions.push('Verify the card ID spelling');
  } else if (reason === 'invalid-id') {
    if (!namespace) {
      suggestions.push('Custom cards should use namespaced IDs like "namespace:cardname"');
    }
    suggestions.push('Check the card ID format');
  }
  
  return {
    id,
    context,
    namespace,
    reason,
    details,
    suggestions,
  };
}

/**
 * Creates a placeholder card element for an unknown card.
 * 
 * This function returns a DOM element that can be inserted into the UI
 * in place of a missing card. It shows diagnostic information to help
 * users understand and resolve the issue.
 * 
 * @param info - Information about the unknown card
 * @returns DOM element
 */
export function createUnknownCardPlaceholder(info: UnknownCardInfo): HTMLElement {
  const container = document.createElement('div');
  container.className = 'unknown-card-placeholder';
  container.setAttribute('data-card-id', info.id);
  
  // Add styling
  container.style.cssText = `
    border: 2px dashed #ff6b6b;
    border-radius: 8px;
    padding: 16px;
    margin: 8px;
    background: rgba(255, 107, 107, 0.1);
    color: #c92a2a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-width: 200px;
    max-width: 400px;
  `;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 14px;';
  header.textContent = '⚠️ Unknown Card';
  container.appendChild(header);
  
  // Card ID
  const idDiv = document.createElement('div');
  idDiv.style.cssText = 'font-family: monospace; font-size: 12px; margin-bottom: 8px; color: #862e9c;';
  idDiv.textContent = `ID: ${info.id}`;
  container.appendChild(idDiv);
  
  // Reason
  if (info.reason) {
    const reasonDiv = document.createElement('div');
    reasonDiv.style.cssText = 'font-size: 12px; margin-bottom: 8px;';
    const reasonText = {
      'not-registered': 'Card not found in registry',
      'pack-missing': 'Card pack not installed',
      'invalid-id': 'Invalid card ID format',
      'load-error': 'Error loading card',
    }[info.reason] || info.reason;
    reasonDiv.textContent = `Reason: ${reasonText}`;
    container.appendChild(reasonDiv);
  }
  
  // Context
  if (info.context) {
    const contextDiv = document.createElement('div');
    contextDiv.style.cssText = 'font-size: 11px; margin-bottom: 8px; opacity: 0.8;';
    contextDiv.textContent = `Context: ${info.context}`;
    container.appendChild(contextDiv);
  }
  
  // Details
  if (info.details) {
    const detailsDiv = document.createElement('div');
    detailsDiv.style.cssText = 'font-size: 11px; margin-bottom: 8px; opacity: 0.8;';
    detailsDiv.textContent = info.details;
    container.appendChild(detailsDiv);
  }
  
  // Suggestions
  if (info.suggestions && info.suggestions.length > 0) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.style.cssText = 'font-size: 11px; margin-top: 12px; padding-top: 8px; border-top: 1px dashed rgba(201, 42, 42, 0.3);';
    
    const suggestionsLabel = document.createElement('div');
    suggestionsLabel.style.cssText = 'font-weight: bold; margin-bottom: 4px;';
    suggestionsLabel.textContent = 'Suggestions:';
    suggestionsDiv.appendChild(suggestionsLabel);
    
    const suggestionsList = document.createElement('ul');
    suggestionsList.style.cssText = 'margin: 0; padding-left: 20px;';
    info.suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      suggestionsList.appendChild(li);
    });
    suggestionsDiv.appendChild(suggestionsList);
    
    container.appendChild(suggestionsDiv);
  }
  
  return container;
}

/**
 * Creates a minimal inline placeholder for an unknown card.
 * Useful for compact displays like lists or palettes.
 * 
 * @param info - Information about the unknown card
 * @returns DOM element
 */
export function createInlineUnknownCardPlaceholder(info: UnknownCardInfo): HTMLElement {
  const container = document.createElement('div');
  container.className = 'unknown-card-inline';
  container.setAttribute('data-card-id', info.id);
  container.title = `Unknown card: ${info.id}${info.reason ? ` (${info.reason})` : ''}`;
  
  container.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(255, 107, 107, 0.15);
    border: 1px solid #ff6b6b;
    border-radius: 4px;
    font-size: 11px;
    color: #c92a2a;
    font-family: monospace;
  `;
  
  container.textContent = `⚠️ ${info.id}`;
  
  return container;
}

/**
 * Graceful card loader that returns placeholder on failure.
 * 
 * This wrapper can be used around card loading logic to ensure
 * that missing cards don't crash the application.
 * 
 * @param cardId - Card ID to load
 * @param loader - Function that loads the card
 * @param context - Context for diagnostics
 * @returns Loaded card or placeholder info
 */
export async function loadCardWithPlaceholder<T>(
  cardId: string,
  loader: (id: string) => Promise<T>,
  context?: string
): Promise<T | UnknownCardInfo> {
  try {
    return await loader(cardId);
  } catch (error) {
    const reason: UnknownCardInfo['reason'] = 
      error instanceof Error && error.message.includes('not found') 
        ? 'not-registered'
        : 'load-error';
    
    return createUnknownCardInfo(
      cardId,
      context,
      reason,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Type guard to check if result is unknown card info.
 */
export function isUnknownCardInfo(value: unknown): value is UnknownCardInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as UnknownCardInfo).id === 'string'
  );
}
