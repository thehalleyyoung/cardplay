/**
 * Confirmation Dialog Component
 *
 * Modal dialog for confirming destructive actions
 */

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Confirmation dialog manager
 */
export class ConfirmationDialog {
  private overlay: HTMLElement | null = null;
  private container: HTMLElement | null = null;

  /**
   * Show confirmation dialog
   */
  show(options: ConfirmationOptions): void {
    this.create(options);
  }

  /**
   * Hide confirmation dialog
   */
  hide(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.container = null;
  }

  private create(options: ConfirmationOptions): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'confirmation-overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.handleCancel(options);
      }
    });

    // Create container
    this.container = document.createElement('div');
    this.container.className = `confirmation-dialog confirmation-dialog--${options.variant || 'info'}`;

    // Title
    const title = document.createElement('h3');
    title.className = 'confirmation-dialog__title';
    title.textContent = options.title;
    this.container.appendChild(title);

    // Message
    const message = document.createElement('p');
    message.className = 'confirmation-dialog__message';
    message.textContent = options.message;
    this.container.appendChild(message);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'confirmation-dialog__actions';

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'confirmation-dialog__button confirmation-dialog__button--cancel';
    cancelBtn.textContent = options.cancelLabel || 'Cancel';
    cancelBtn.addEventListener('click', () => this.handleCancel(options));
    actions.appendChild(cancelBtn);

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = `confirmation-dialog__button confirmation-dialog__button--confirm confirmation-dialog__button--${options.variant || 'info'}`;
    confirmBtn.textContent = options.confirmLabel || 'Confirm';
    confirmBtn.addEventListener('click', () => this.handleConfirm(options));
    actions.appendChild(confirmBtn);

    this.container.appendChild(actions);
    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);

    // Focus confirm button
    confirmBtn.focus();

    // Handle keyboard
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleCancel(options);
      } else if (e.key === 'Enter') {
        this.handleConfirm(options);
      }
    });
  }

  private handleConfirm(options: ConfirmationOptions): void {
    options.onConfirm();
    this.hide();
  }

  private handleCancel(options: ConfirmationOptions): void {
    if (options.onCancel) {
      options.onCancel();
    }
    this.hide();
  }
}

// Singleton instance
let confirmationDialogInstance: ConfirmationDialog | undefined;

/**
 * Get the global confirmation dialog instance
 */
export function getConfirmationDialog(): ConfirmationDialog {
  if (!confirmationDialogInstance) {
    confirmationDialogInstance = new ConfirmationDialog();
  }
  return confirmationDialogInstance;
}

/**
 * Show a confirmation dialog
 */
export function confirm(options: ConfirmationOptions): void {
  getConfirmationDialog().show(options);
}

/**
 * Common confirmation presets
 */
export const Confirmations = {
  /**
   * Delete project
   */
  deleteProject: (projectName: string, onConfirm: () => void): ConfirmationOptions => ({
    title: 'Delete Project?',
    message: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm,
  }),

  /**
   * Delete template
   */
  deleteTemplate: (templateName: string, onConfirm: () => void): ConfirmationOptions => ({
    title: 'Delete Template?',
    message: `Are you sure you want to delete the template "${templateName}"?`,
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm,
  }),

  /**
   * Clear all data
   */
  clearAll: (onConfirm: () => void): ConfirmationOptions => ({
    title: 'Clear All Data?',
    message: 'This will delete all your projects, templates, and settings. This action cannot be undone.',
    confirmLabel: 'Clear All',
    variant: 'danger',
    onConfirm,
  }),

  /**
   * Overwrite existing
   */
  overwrite: (itemName: string, onConfirm: () => void): ConfirmationOptions => ({
    title: 'Overwrite Existing?',
    message: `"${itemName}" already exists. Do you want to overwrite it?`,
    confirmLabel: 'Overwrite',
    variant: 'warning',
    onConfirm,
  }),

  /**
   * Discard changes
   */
  discardChanges: (onConfirm: () => void): ConfirmationOptions => ({
    title: 'Discard Changes?',
    message: 'You have unsaved changes. Do you want to discard them?',
    confirmLabel: 'Discard',
    variant: 'warning',
    onConfirm,
  }),

  /**
   * Reset to defaults
   */
  resetDefaults: (onConfirm: () => void): ConfirmationOptions => ({
    title: 'Reset to Defaults?',
    message: 'This will reset all settings to their default values.',
    confirmLabel: 'Reset',
    variant: 'warning',
    onConfirm,
  }),
};

/**
 * Inject confirmation dialog styles
 */
export function injectConfirmationStyles(): void {
  if (document.getElementById('confirmation-dialog-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'confirmation-dialog-styles';
  style.textContent = `
    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
      animation: confirmation-overlay-fade-in 0.2s ease-out;
    }

    @keyframes confirmation-overlay-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .confirmation-dialog {
      background-color: var(--color-surface, #1e1e1e);
      border-radius: 8px;
      padding: 2rem;
      min-width: 400px;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      animation: confirmation-dialog-slide-in 0.2s ease-out;
    }

    @keyframes confirmation-dialog-slide-in {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .confirmation-dialog__title {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-primary, #fff);
    }

    .confirmation-dialog--danger .confirmation-dialog__title {
      color: var(--color-danger, #dc3545);
    }

    .confirmation-dialog--warning .confirmation-dialog__title {
      color: var(--color-warning, #ffc107);
    }

    .confirmation-dialog__message {
      margin: 0 0 2rem 0;
      line-height: 1.5;
      color: var(--color-text-secondary, #aaa);
    }

    .confirmation-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .confirmation-dialog__button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .confirmation-dialog__button--cancel {
      background-color: var(--color-surface-raised, #2a2a2a);
      color: var(--color-text-primary, #fff);
      border: 1px solid var(--color-border, #333);
    }

    .confirmation-dialog__button--cancel:hover {
      background-color: var(--color-surface-hover, #333);
      border-color: var(--color-border-hover, #444);
    }

    .confirmation-dialog__button--confirm {
      background-color: var(--color-primary, #007bff);
      color: white;
    }

    .confirmation-dialog__button--confirm:hover {
      background-color: var(--color-primary-hover, #0056b3);
    }

    .confirmation-dialog__button--confirm.confirmation-dialog__button--danger {
      background-color: var(--color-danger, #dc3545);
    }

    .confirmation-dialog__button--confirm.confirmation-dialog__button--danger:hover {
      background-color: var(--color-danger-hover, #c82333);
    }

    .confirmation-dialog__button--confirm.confirmation-dialog__button--warning {
      background-color: var(--color-warning, #ffc107);
      color: #000;
    }

    .confirmation-dialog__button--confirm.confirmation-dialog__button--warning:hover {
      background-color: var(--color-warning-hover, #e0a800);
    }
  `;

  document.head.appendChild(style);
}
