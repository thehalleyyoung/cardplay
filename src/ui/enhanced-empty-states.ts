/**
 * Enhanced empty state components with helpful guidance
 * Provides context-specific suggestions and actions
 */

export interface EmptyStateConfig {
  icon?: string;
  title: string;
  description: string;
  actions?: Array<{
    label: string;
    primary?: boolean;
    onClick: () => void;
  }>;
  learnMore?: {
    label: string;
    url: string;
  };
}

/**
 * Create an empty state component
 */
export function createEmptyState(config: EmptyStateConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'empty-state';
  
  let html = '<div class="empty-state-content">';
  
  if (config.icon) {
    html += `<div class="empty-state-icon">${config.icon}</div>`;
  }
  
  html += `
    <h3 class="empty-state-title">${config.title}</h3>
    <p class="empty-state-description">${config.description}</p>
  `;
  
  if (config.actions && config.actions.length > 0) {
    html += '<div class="empty-state-actions">';
    config.actions.forEach((action, index) => {
      const className = action.primary ? 'button-primary' : 'button-secondary';
      html += `<button class="${className}" data-action="${index}">${action.label}</button>`;
    });
    html += '</div>';
  }
  
  if (config.learnMore) {
    html += `
      <div class="empty-state-learn-more">
        <a href="${config.learnMore.url}" target="_blank" rel="noopener">${config.learnMore.label}</a>
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
  
  // Attach action handlers
  if (config.actions) {
    config.actions.forEach((action, index) => {
      const button = container.querySelector(`[data-action="${index}"]`);
      button?.addEventListener('click', action.onClick);
    });
  }
  
  return container;
}

/**
 * Pre-configured empty states for common scenarios
 */
export const EMPTY_STATES = {
  // Project-level empty states
  newProject: (): EmptyStateConfig => ({
    icon: '🎵',
    title: 'Welcome to Your New Project',
    description: 'Start by adding notes, importing MIDI, or choosing a template to get going quickly.',
    actions: [],
    learnMore: {
      label: 'View Getting Started Guide →',
      url: '/docs/guides/getting-started.md'
    }
  }),

  // Stream/pattern empty states
  emptyStream: (streamName: string): EmptyStateConfig => ({
    icon: '🎼',
    title: `${streamName} is Empty`,
    description: 'Click to add notes, drag phrases from the library, or generate a pattern.',
    actions: []
  }),

  // Clip session empty states
  emptyClipSlot: (): EmptyStateConfig => ({
    icon: '⬜',
    title: 'Empty Clip Slot',
    description: 'Click to create a new clip, or drag an existing clip here.',
    actions: []
  }),

  // Browser empty states
  noSearchResults: (query: string): EmptyStateConfig => ({
    icon: '🔍',
    title: 'No Results Found',
    description: `No items match "${query}". Try different search terms or browse all items.`,
    actions: [
      {
        label: 'Clear Search',
        primary: true,
        onClick: () => {
          const searchInput = document.querySelector('[data-search]') as HTMLInputElement;
          if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
          }
        }
      }
    ]
  }),

  noSamples: (): EmptyStateConfig => ({
    icon: '🎙️',
    title: 'No Samples Yet',
    description: 'Import audio files or install sample packs to get started with sampling.',
    actions: [],
    learnMore: {
      label: 'Learn about Sample Management →',
      url: '/docs/guides/sample-management.md'
    }
  }),

  noInstruments: (): EmptyStateConfig => ({
    icon: '🎹',
    title: 'No Instruments',
    description: 'Add instruments to your track to start making music.',
    actions: []
  }),

  // Phrase library empty states
  noPhrases: (): EmptyStateConfig => ({
    icon: '📚',
    title: 'Phrase Library is Empty',
    description: 'Save your melodies and patterns as reusable phrases, or import phrase packs.',
    actions: [],
    learnMore: {
      label: 'Learn about Phrase Library →',
      url: '/docs/guides/phrase-library.md'
    }
  }),

  // Routing empty states
  noConnections: (): EmptyStateConfig => ({
    icon: '🔌',
    title: 'No Audio Routing',
    description: 'Connect instruments and effects to create your signal chain.',
    actions: [],
    learnMore: {
      label: 'Learn about Audio Routing →',
      url: '/docs/guides/audio-routing.md'
    }
  }),

  // Board-specific empty states
  noDecksOpen: (): EmptyStateConfig => ({
    icon: '📦',
    title: 'No Decks Open',
    description: 'Add decks to your board to access different tools and editors.',
    actions: []
  }),

  // Mixer empty states
  noTracks: (): EmptyStateConfig => ({
    icon: '🎚️',
    title: 'No Tracks',
    description: 'Create streams and clips to see them appear in the mixer.',
    actions: []
  }),

  // History empty states
  noHistory: (): EmptyStateConfig => ({
    icon: '⏱️',
    title: 'No Undo History',
    description: 'Edit your project to build up undo/redo history.',
    actions: []
  }),

  // Selection empty states
  noSelection: (): EmptyStateConfig => ({
    icon: '🎯',
    title: 'No Selection',
    description: 'Select notes, clips, or other elements to view their properties here.',
    actions: []
  })
};

/**
 * Render an empty state into a container
 */
export function renderEmptyState(
  container: HTMLElement,
  configOrFactory: EmptyStateConfig | (() => EmptyStateConfig)
): void {
  const config = typeof configOrFactory === 'function' ? configOrFactory() : configOrFactory;
  const emptyState = createEmptyState(config);
  
  // Clear container
  container.innerHTML = '';
  container.appendChild(emptyState);
  
  // Add data attribute for testing
  container.setAttribute('data-empty-state', 'true');
}

/**
 * Check if container should show empty state
 */
export function shouldShowEmptyState(itemCount: number): boolean {
  return itemCount === 0;
}

/**
 * Helper to wrap content with empty state fallback
 */
export function withEmptyStateFallback(
  container: HTMLElement,
  items: any[],
  emptyStateConfig: EmptyStateConfig,
  renderContent: () => void
): void {
  if (items.length === 0) {
    renderEmptyState(container, emptyStateConfig);
  } else {
    // Remove empty state if present
    container.removeAttribute('data-empty-state');
    renderContent();
  }
}
