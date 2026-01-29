/**
 * Error State Component
 *
 * Displays error messages with recovery actions
 */

export interface ErrorStateOptions {
  icon?: string;
  title: string;
  message: string;
  error?: Error | string;
  showDetails?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
}

/**
 * Create an error state element
 */
export function createErrorState(options: ErrorStateOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'error-state';

  // Icon
  const icon = document.createElement('div');
  icon.className = 'error-state__icon';
  icon.textContent = options.icon || '⚠️';
  container.appendChild(icon);

  // Title
  const title = document.createElement('h3');
  title.className = 'error-state__title';
  title.textContent = options.title;
  container.appendChild(title);

  // Message
  const message = document.createElement('p');
  message.className = 'error-state__message';
  message.textContent = options.message;
  container.appendChild(message);

  // Error details (collapsible)
  if (options.error && options.showDetails) {
    const detailsContainer = document.createElement('details');
    detailsContainer.className = 'error-state__details';

    const summary = document.createElement('summary');
    summary.textContent = 'Technical Details';
    detailsContainer.appendChild(summary);

    const pre = document.createElement('pre');
    pre.className = 'error-state__error-text';
    pre.textContent =
      typeof options.error === 'string'
        ? options.error
        : `${options.error.name}: ${options.error.message}\n\n${options.error.stack || ''}`;
    detailsContainer.appendChild(pre);

    container.appendChild(detailsContainer);
  }

  // Actions
  if (options.actions && options.actions.length > 0) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'error-state__actions';

    options.actions.forEach((action) => {
      const button = document.createElement('button');
      button.className = action.primary
        ? 'error-state__action error-state__action--primary'
        : 'error-state__action';
      button.textContent = action.label;
      button.addEventListener('click', action.onClick);
      actionsContainer.appendChild(button);
    });

    container.appendChild(actionsContainer);
  }

  return container;
}

/**
 * Common error state presets
 */
export const ErrorStates = {
  /**
   * Project load failed
   */
  projectLoadFailed: (error?: Error): ErrorStateOptions => ({
    icon: '🚫',
    title: 'Failed to Load Project',
    message: 'The project file could not be loaded. It may be corrupted or incompatible.',
    ...(error !== undefined ? { error } : {}),
    showDetails: true,
    actions: [
      {
        label: 'Try Again',
        primary: true,
        onClick: () => {
          console.log('Retry load');
        },
      },
      {
        label: 'New Project',
        onClick: () => {
          console.log('Create new project');
        },
      },
    ],
  }),

  /**
   * Template load failed
   */
  templateLoadFailed: (templateName: string, error?: Error): ErrorStateOptions => ({
    icon: '❌',
    title: 'Failed to Load Template',
    message: `Could not load template "${templateName}". Please try again.`,
    ...(error ? { error, showDetails: true } : {}),
    actions: [
      {
        label: 'Try Again',
        primary: true,
        onClick: () => {
          console.log('Retry template load');
        },
      },
      {
        label: 'Browse Other Templates',
        onClick: () => {
          console.log('Browse templates');
        },
      },
    ],
  }),

  /**
   * Save failed
   */
  saveFailed: (error?: Error): ErrorStateOptions => ({
    icon: '💾',
    title: 'Save Failed',
    message: 'Your changes could not be saved. Please try again.',
    ...(error ? { error, showDetails: true } : {}),
    actions: [
      {
        label: 'Retry Save',
        primary: true,
        onClick: () => {
          console.log('Retry save');
        },
      },
      {
        label: 'Export Backup',
        onClick: () => {
          console.log('Export backup');
        },
      },
    ],
  }),

  /**
   * Audio engine error
   */
  audioEngineFailed: (error?: Error): ErrorStateOptions => ({
    icon: '🔇',
    title: 'Audio Engine Error',
    message: 'The audio engine encountered an error. Try restarting the application.',
    ...(error ? { error, showDetails: true } : {}),
    actions: [
      {
        label: 'Restart Audio Engine',
        primary: true,
        onClick: () => {
          console.log('Restart audio');
        },
      },
    ],
  }),

  /**
   * MIDI device error
   */
  midiDeviceFailed: (error?: Error): ErrorStateOptions => ({
    icon: '🎹',
    title: 'MIDI Device Error',
    message: 'Could not connect to MIDI device. Check your connections and permissions.',
    ...(error ? { error, showDetails: true } : {}),
    actions: [
      {
        label: 'Retry Connection',
        primary: true,
        onClick: () => {
          console.log('Retry MIDI connection');
        },
      },
      {
        label: 'Continue Without MIDI',
        onClick: () => {
          console.log('Continue without MIDI');
        },
      },
    ],
  }),

  /**
   * Generic error
   */
  generic: (message: string, error?: Error): ErrorStateOptions => ({
    icon: '⚠️',
    title: 'Error',
    message,
    ...(error ? { error, showDetails: true } : {}),
    actions: [
      {
        label: 'OK',
        primary: true,
        onClick: () => {
          console.log('Dismiss error');
        },
      },
    ],
  }),
};

/**
 * Inject error state styles
 */
export function injectErrorStateStyles(): void {
  if (document.getElementById('error-state-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'error-state-styles';
  style.textContent = `
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      min-height: 200px;
    }

    .error-state__icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      filter: grayscale(0.3);
    }

    .error-state__title {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-danger, #dc3545);
    }

    .error-state__message {
      margin: 0 0 1.5rem 0;
      max-width: 500px;
      line-height: 1.5;
      color: var(--color-text-secondary, #aaa);
    }

    .error-state__details {
      margin: 1rem 0;
      max-width: 600px;
      text-align: left;
    }

    .error-state__details summary {
      cursor: pointer;
      color: var(--color-text-secondary, #aaa);
      font-size: 0.875rem;
      padding: 0.5rem;
      user-select: none;
    }

    .error-state__details summary:hover {
      color: var(--color-text-primary, #fff);
    }

    .error-state__error-text {
      margin: 0.5rem 0 0 0;
      padding: 1rem;
      background-color: var(--color-surface, #1e1e1e);
      border: 1px solid var(--color-border, #333);
      border-radius: 4px;
      font-size: 0.75rem;
      line-height: 1.4;
      color: var(--color-danger-light, #ff6b6b);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .error-state__actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .error-state__action {
      padding: 0.75rem 1.5rem;
      background-color: var(--color-surface-raised, #2a2a2a);
      color: var(--color-text-primary, #fff);
      border: 1px solid var(--color-border, #333);
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .error-state__action:hover {
      background-color: var(--color-surface-hover, #333);
      border-color: var(--color-border-hover, #444);
    }

    .error-state__action--primary {
      background-color: var(--color-danger, #dc3545);
      border-color: var(--color-danger, #dc3545);
    }

    .error-state__action--primary:hover {
      background-color: var(--color-danger-hover, #c82333);
      border-color: var(--color-danger-hover, #c82333);
    }
  `;

  document.head.appendChild(style);
}
