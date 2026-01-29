export interface Modal {
  id: string;
  element: HTMLElement;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}

export class ModalRoot {
  private container: HTMLElement;
  private backdrop: HTMLElement;
  private modals: Map<string, Modal> = new Map();
  private modalStack: string[] = [];
  private focusStack: (HTMLElement | null)[] = [];

  constructor() {
    this.container = this.createContainer();
    this.backdrop = this.createBackdrop();
    this.container.appendChild(this.backdrop);
    
    document.body.appendChild(this.container);
    injectModalRootStyles();
    
    this.setupEventListeners();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'modal-root';
    container.setAttribute('role', 'presentation');
    return container;
  }

  private createBackdrop(): HTMLElement {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    return backdrop;
  }

  private setupEventListeners(): void {
    this.backdrop.addEventListener('click', () => {
      this.handleBackdropClick();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
    });
  }

  private handleBackdropClick(): void {
    const topModalId = this.modalStack[this.modalStack.length - 1];
    if (!topModalId) return;

    const modal = this.modals.get(topModalId);
    if (modal && modal.closeOnBackdrop !== false) {
      this.closeModal(topModalId);
    }
  }

  private handleEscapeKey(): void {
    const topModalId = this.modalStack[this.modalStack.length - 1];
    if (!topModalId) return;

    const modal = this.modals.get(topModalId);
    if (modal && modal.closeOnEscape !== false) {
      this.closeModal(topModalId);
    }
  }

  private updateVisibility(): void {
    const hasModals = this.modalStack.length > 0;
    
    if (hasModals) {
      this.container.classList.add('modal-root--visible');
      this.backdrop.classList.add('modal-backdrop--visible');
      document.body.style.overflow = 'hidden';
    } else {
      this.container.classList.remove('modal-root--visible');
      this.backdrop.classList.remove('modal-backdrop--visible');
      document.body.style.overflow = '';
    }
  }

  private setupFocusTrap(modalElement: HTMLElement): void {
    const focusableElements = modalElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          if (lastElement) lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          if (firstElement) firstElement.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener('keydown', handleTabKey);
    if (firstElement) firstElement.focus();
  }

  public openModal(modal: Modal): void {
    if (this.modals.has(modal.id)) {
      console.warn(`Modal ${modal.id} is already open`);
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    this.focusStack.push(previousFocus);

    this.modals.set(modal.id, modal);
    this.modalStack.push(modal.id);

    modal.element.classList.add('modal');
    modal.element.setAttribute('role', 'dialog');
    modal.element.setAttribute('aria-modal', 'true');
    modal.element.style.zIndex = String(1000 + this.modalStack.length);

    this.container.appendChild(modal.element);
    this.updateVisibility();
    
    requestAnimationFrame(() => {
      modal.element.classList.add('modal--visible');
      this.setupFocusTrap(modal.element);
    });
  }

  public closeModal(modalId: string): void {
    const modal = this.modals.get(modalId);
    if (!modal) return;

    const stackIndex = this.modalStack.indexOf(modalId);
    if (stackIndex === -1) return;

    modal.element.classList.remove('modal--visible');

    setTimeout(() => {
      modal.element.remove();
      this.modals.delete(modalId);
      this.modalStack.splice(stackIndex, 1);
      
      const previousFocus = this.focusStack.pop();
      if (previousFocus) {
        previousFocus.focus();
      }

      this.updateVisibility();

      if (modal.onClose) {
        modal.onClose();
      }
    }, 200);
  }

  public closeAllModals(): void {
    const modalIds = [...this.modalStack];
    modalIds.forEach((id) => this.closeModal(id));
  }

  public isModalOpen(modalId: string): boolean {
    return this.modals.has(modalId);
  }

  public getTopModal(): Modal | undefined {
    const topModalId = this.modalStack[this.modalStack.length - 1];
    return topModalId ? this.modals.get(topModalId) : undefined;
  }

  public destroy(): void {
    this.closeAllModals();
    this.container.remove();
    document.body.style.overflow = '';
  }
}

let modalRootInstance: ModalRoot | null = null;

export function getModalRoot(): ModalRoot {
  if (!modalRootInstance) {
    modalRootInstance = new ModalRoot();
  }
  return modalRootInstance;
}

let stylesInjected = false;

function injectModalRootStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'modal-root-styles';
  style.textContent = `
    .modal-root {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1000;
    }

    .modal-root--visible {
      pointer-events: auto;
    }

    .modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .modal-backdrop--visible {
      opacity: 1;
    }

    .modal {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      background: var(--surface-elevated);
      border-radius: 0.5rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal--visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    @media (prefers-reduced-motion: reduce) {
      .modal-backdrop,
      .modal {
        transition: none;
      }

      .modal {
        transform: translate(-50%, -50%);
      }

      .modal--visible {
        transform: translate(-50%, -50%);
      }
    }
  `;
  
  document.head.appendChild(style);
}
