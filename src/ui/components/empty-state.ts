/**
 * @fileoverview Empty State Components (F055, F056, F086, F116)
 * 
 * Reusable empty state UI components for boards and decks.
 * Provides consistent messaging and call-to-action buttons.
 * 
 * @module @cardplay/ui/components/empty-state
 */

/**
 * Empty state configuration.
 */
export interface EmptyStateConfig {
  /** Icon to display (emoji or icon name) */
  icon?: string;
  /** Title of the empty state */
  title: string;
  /** Description/message to the user */
  message: string;
  /** Optional call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Creates an empty state UI element.
 * 
 * @param config - Empty state configuration
 * @returns DOM element with empty state UI
 */
export function createEmptyState(config: EmptyStateConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'empty-state';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    color: var(--color-on-surface-variant, #666);
    min-height: 200px;
  `;

  // Icon (if provided)
  if (config.icon) {
    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = config.icon;
    icon.style.cssText = `
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    `;
    container.appendChild(icon);
  }

  // Title
  const title = document.createElement('h3');
  title.className = 'empty-state-title';
  title.textContent = config.title;
  title.style.cssText = `
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--color-on-surface, #222);
  `;
  container.appendChild(title);

  // Message
  const message = document.createElement('p');
  message.className = 'empty-state-message';
  message.textContent = config.message;
  message.style.cssText = `
    font-size: 0.875rem;
    margin: 0 0 1.5rem 0;
    max-width: 400px;
    line-height: 1.5;
  `;
  container.appendChild(message);

  // Action buttons container
  if (config.action || config.secondaryAction) {
    const actions = document.createElement('div');
    actions.className = 'empty-state-actions';
    actions.style.cssText = `
      display: flex;
      gap: 0.75rem;
      align-items: center;
    `;

    // Primary action
    if (config.action) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'empty-state-action';
      actionBtn.textContent = config.action.label;
      actionBtn.onclick = config.action.onClick;
      actionBtn.style.cssText = `
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: var(--color-primary, #0066cc);
        color: var(--color-on-primary, white);
        border: none;
        border-radius: var(--radius-md, 4px);
        cursor: pointer;
        transition: opacity 0.2s;
      `;
      actionBtn.onmouseenter = () => {
        actionBtn.style.opacity = '0.9';
      };
      actionBtn.onmouseleave = () => {
        actionBtn.style.opacity = '1';
      };
      actions.appendChild(actionBtn);
    }

    // Secondary action
    if (config.secondaryAction) {
      const secondaryBtn = document.createElement('button');
      secondaryBtn.className = 'empty-state-secondary-action';
      secondaryBtn.textContent = config.secondaryAction.label;
      secondaryBtn.onclick = config.secondaryAction.onClick;
      secondaryBtn.style.cssText = `
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: transparent;
        color: var(--color-primary, #0066cc);
        border: 1px solid var(--color-outline, #ccc);
        border-radius: var(--radius-md, 4px);
        cursor: pointer;
        transition: background 0.2s;
      `;
      secondaryBtn.onmouseenter = () => {
        secondaryBtn.style.background = 'var(--color-surface-variant, #f5f5f5)';
      };
      secondaryBtn.onmouseleave = () => {
        secondaryBtn.style.background = 'transparent';
      };
      actions.appendChild(secondaryBtn);
    }

    container.appendChild(actions);
  }

  return container;
}

/**
 * Pre-configured empty states for common scenarios.
 */
export const EmptyStates = {
  // F055: Tracker board - no pattern
  noPattern: (): HTMLElement => createEmptyState({
    icon: '🎹',
    title: 'No Pattern',
    message: 'Press + to create stream/pattern',
    action: {
      label: 'Create Pattern',
      onClick: () => {
        console.log('Create pattern action');
        // In real implementation, would call pattern creation logic
      }
    }
  }),

  // Tracker board - no instruments
  noInstruments: (): HTMLElement => createEmptyState({
    icon: '🎸',
    title: 'No Instruments',
    message: 'Add instruments from the browser to start composing',
    secondaryAction: {
      label: 'Open Browser',
      onClick: () => {
        console.log('Open instrument browser');
      }
    }
  }),

  // Tracker board - no effects
  noEffects: (): HTMLElement => createEmptyState({
    icon: '🎛️',
    title: 'No Effects',
    message: 'Drag effects into the DSP chain to process audio',
    secondaryAction: {
      label: 'Browse Effects',
      onClick: () => {
        console.log('Open effects browser');
      }
    }
  }),

  // F086: Sampler board - no samples
  noSamples: (): HTMLElement => createEmptyState({
    icon: '🎵',
    title: 'No Samples',
    message: 'Import WAV/AIFF files to get started',
    action: {
      label: 'Import Sample',
      onClick: () => {
        console.log('Import sample action');
      }
    },
    secondaryAction: {
      label: 'Browse Library',
      onClick: () => {
        console.log('Browse sample library');
      }
    }
  }),

  // F086: Sampler board - no arrangement
  noArrangement: (): HTMLElement => createEmptyState({
    icon: '📊',
    title: 'No Arrangement',
    message: 'Drag clips from the sample pool to the timeline',
  }),

  // F116: Session board - no clips
  noClips: (): HTMLElement => createEmptyState({
    icon: '🎬',
    title: 'No Clips',
    message: 'Click an empty slot to create one',
    action: {
      label: 'Create Clip',
      onClick: () => {
        console.log('Create clip action');
      }
    }
  }),

  // Session board - no scenes
  noScenes: (): HTMLElement => createEmptyState({
    icon: '🎭',
    title: 'No Scenes',
    message: 'Create scenes to organize your clips',
    action: {
      label: 'Create Scene',
      onClick: () => {
        console.log('Create scene action');
      }
    }
  }),

  // Notation board - no score
  noScore: (): HTMLElement => createEmptyState({
    icon: '🎼',
    title: 'No Score',
    message: 'Add notes or import MIDI to get started',
    action: {
      label: 'Add Notes',
      onClick: () => {
        console.log('Add notes action');
      }
    },
    secondaryAction: {
      label: 'Import MIDI',
      onClick: () => {
        console.log('Import MIDI action');
      }
    }
  }),

  // Generic empty state for missing content
  noContent: (title: string, message: string): HTMLElement => createEmptyState({
    icon: '📭',
    title,
    message
  }),

  // No selection state
  noSelection: (): HTMLElement => createEmptyState({
    icon: '👆',
    title: 'No Selection',
    message: 'Select an item to view its properties',
  }),

  // No results from search/filter
  noResults: (searchTerm?: string): HTMLElement => createEmptyState({
    icon: '🔍',
    title: 'No Results',
    message: searchTerm 
      ? `No results found for "${searchTerm}"`
      : 'Try adjusting your search or filters',
  })
};
