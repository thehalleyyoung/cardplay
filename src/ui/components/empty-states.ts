/**
 * @fileoverview Empty State Components
 * 
 * Reusable empty state components for various board/deck contexts.
 * Provides helpful guidance and CTAs for users.
 * 
 * @module @cardplay/ui/components/empty-states
 */

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  icon?: string;
  title: string;
  description: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
}

/**
 * Create an empty state component
 */
export function createEmptyState(config: EmptyStateConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'empty-state';
  
  // Icon (if provided)
  if (config.icon) {
    const icon = document.createElement('div');
    icon.className = 'empty-state__icon';
    icon.textContent = config.icon;
    container.appendChild(icon);
  }
  
  // Title
  const title = document.createElement('h3');
  title.className = 'empty-state__title';
  title.textContent = config.title;
  container.appendChild(title);
  
  // Description
  const description = document.createElement('p');
  description.className = 'empty-state__description';
  description.textContent = config.description;
  container.appendChild(description);
  
  // Actions (if provided)
  if (config.actions && config.actions.length > 0) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'empty-state__actions';
    
    for (const action of config.actions) {
      const button = document.createElement('button');
      button.className = action.primary 
        ? 'empty-state__action empty-state__action--primary'
        : 'empty-state__action';
      button.textContent = action.label;
      button.onclick = action.onClick;
      actionsContainer.appendChild(button);
    }
    
    container.appendChild(actionsContainer);
  }
  
  return container;
}

/**
 * Empty state for notation board (F027)
 */
export function createNotationEmptyState(onImport: () => void, onAddNote: () => void): HTMLElement {
  return createEmptyState({
    icon: '🎼',
    title: 'No Score Yet',
    description: 'Add notes manually or import MIDI to get started with your composition.',
    actions: [
      { label: 'Add Notes', onClick: onAddNote, primary: true },
      { label: 'Import MIDI', onClick: onImport }
    ]
  });
}

/**
 * Empty state for tracker board (F055)
 */
export function createTrackerEmptyState(onCreate: () => void): HTMLElement {
  return createEmptyState({
    icon: '🎹',
    title: 'No Pattern',
    description: 'Press + to create a stream and start tracking.',
    actions: [
      { label: 'Create Pattern', onClick: onCreate, primary: true }
    ]
  });
}

/**
 * Empty state for sampler board (F086)
 */
export function createSamplerEmptyState(onImportSample: () => void, onArrange: () => void): HTMLElement {
  return createEmptyState({
    icon: '🎚️',
    title: 'No Samples',
    description: 'Import WAV/AIFF samples to get started, then arrange them on the timeline.',
    actions: [
      { label: 'Import Sample', onClick: onImportSample, primary: true },
      { label: 'Drag to Arrange', onClick: onArrange }
    ]
  });
}

/**
 * Empty state for session board (F116)
 */
export function createSessionEmptyState(onCreate: () => void): HTMLElement {
  return createEmptyState({
    icon: '🎭',
    title: 'No Clips',
    description: 'Click an empty slot to create a clip and start your session.',
    actions: [
      { label: 'Create Clip', onClick: onCreate, primary: true }
    ]
  });
}

/**
 * Empty state for harmony board with key/chord guidance (G116)
 */
export function createHarmonyEmptyState(onSetKey: () => void): HTMLElement {
  return createEmptyState({
    icon: '🎵',
    title: 'Set Key for Harmony Hints',
    description: 'Choose a key and chord progression to see harmony suggestions.',
    actions: [
      { label: 'Set Key', onClick: onSetKey, primary: true }
    ]
  });
}

/**
 * Empty state for generator deck
 */
export function createGeneratorEmptyState(onSelectSlot: () => void): HTMLElement {
  return createEmptyState({
    icon: '✨',
    title: 'Select a Slot',
    description: 'Select a clip slot to generate musical content into it.',
    actions: [
      { label: 'Select Slot', onClick: onSelectSlot, primary: true }
    ]
  });
}

/**
 * Inject empty state styles
 */
export function injectEmptyStateStyles(): void {
  const styleId = 'empty-state-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl, 32px);
      text-align: center;
      min-height: 200px;
      color: var(--color-text-secondary, #888);
    }
    
    .empty-state__icon {
      font-size: 48px;
      margin-bottom: var(--spacing-md, 16px);
      opacity: 0.8;
    }
    
    .empty-state__title {
      margin: 0 0 var(--spacing-sm, 8px) 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary, #fff);
    }
    
    .empty-state__description {
      margin: 0 0 var(--spacing-lg, 24px) 0;
      font-size: 14px;
      line-height: 1.5;
      max-width: 400px;
    }
    
    .empty-state__actions {
      display: flex;
      gap: var(--spacing-sm, 8px);
    }
    
    .empty-state__action {
      padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
      border: 1px solid var(--color-border, #444);
      background: transparent;
      color: var(--color-text-primary, #fff);
      border-radius: var(--border-radius, 4px);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    
    .empty-state__action:hover {
      background: var(--color-bg-hover, rgba(255, 255, 255, 0.1));
      border-color: var(--color-border-hover, #666);
    }
    
    .empty-state__action--primary {
      background: var(--color-primary, #3b82f6);
      border-color: var(--color-primary, #3b82f6);
      color: white;
    }
    
    .empty-state__action--primary:hover {
      background: var(--color-primary-hover, #2563eb);
      border-color: var(--color-primary-hover, #2563eb);
    }
    
    .empty-state__action:active {
      transform: translateY(1px);
    }
  `;
  
  document.head.appendChild(style);
}
