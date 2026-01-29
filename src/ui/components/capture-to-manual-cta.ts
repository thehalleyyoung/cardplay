/**
 * @fileoverview Capture to Manual Board CTA Component
 * 
 * A call-to-action button that appears in generative/directed boards,
 * allowing users to switch to a manual board with their generated content.
 * 
 * @module @cardplay/ui/components/capture-to-manual-cta
 */

import {
  captureToManualBoard,
  shouldShowCaptureToManualCTA,
  getCaptureTargetBoardName
} from '../../boards/switching/capture-to-manual';

/**
 * Capture to Manual CTA component.
 */
export class CaptureToManualCTA {
  private element: HTMLElement;
  private visible: boolean = false;
  
  constructor() {
    this.element = this.createElement();
    this.updateVisibility();
  }
  
  /**
   * Create the CTA element.
   */
  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'capture-to-manual-cta';
    container.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 24px;
      z-index: 1000;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      display: none;
    `;
    
    const targetBoard = getCaptureTargetBoardName();
    
    container.innerHTML = `
      <div style="
        background: linear-gradient(135deg, var(--primary, #3B82F6) 0%, var(--primary-dark, #2563EB) 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        max-width: 320px;
      ">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="font-size: 24px; flex-shrink: 0;">✨</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">
              Like what you've generated?
            </div>
            <div style="font-size: 13px; opacity: 0.9; margin-bottom: 12px; line-height: 1.4;">
              Switch to ${targetBoard || 'Manual Mode'} to edit it manually
            </div>
            <button
              class="capture-cta-button"
              style="
                width: 100%;
                padding: 10px 16px;
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='translateY(-1px)'"
              onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='translateY(0)'"
            >
              Capture & Edit Manually →
            </button>
          </div>
          <button
            class="capture-cta-dismiss"
            aria-label="Dismiss"
            style="
              background: transparent;
              border: none;
              color: rgba(255, 255, 255, 0.7);
              font-size: 18px;
              cursor: pointer;
              padding: 0;
              width: 24px;
              height: 24px;
              flex-shrink: 0;
              transition: color 0.2s ease;
            "
            onmouseover="this.style.color='white'"
            onmouseout="this.style.color='rgba(255, 255, 255, 0.7)'"
          >
            ×
          </button>
        </div>
      </div>
    `;
    
    // Bind events
    const captureButton = container.querySelector('.capture-cta-button') as HTMLButtonElement;
    if (captureButton) {
      captureButton.addEventListener('click', () => this.onCapture());
    }
    
    const dismissButton = container.querySelector('.capture-cta-dismiss') as HTMLButtonElement;
    if (dismissButton) {
      dismissButton.addEventListener('click', () => this.dismiss());
    }
    
    return container;
  }
  
  /**
   * Handle capture button click.
   */
  private onCapture(): void {
    const result = captureToManualBoard({
      freezeGeneratedLayers: true,
      preserveDeckTabs: true
    });
    
    if (result.success) {
      console.info('Successfully captured to manual board:', result.targetBoardId);
      this.hide();
    } else {
      console.error('Failed to capture to manual board:', result.error);
      // TODO: Show error toast
    }
  }
  
  /**
   * Dismiss the CTA (hide for this session).
   */
  private dismiss(): void {
    this.hide();
    // TODO: Persist dismissal preference per session
  }
  
  /**
   * Update visibility based on context.
   */
  private updateVisibility(): void {
    const shouldShow = shouldShowCaptureToManualCTA();
    
    if (shouldShow && !this.visible) {
      this.show();
    } else if (!shouldShow && this.visible) {
      this.hide();
    }
  }
  
  /**
   * Show the CTA with animation.
   */
  private show(): void {
    this.visible = true;
    this.element.style.display = 'block';
    
    // Trigger reflow
    this.element.offsetHeight;
    
    // Animate in
    this.element.style.opacity = '1';
    this.element.style.transform = 'translateY(0)';
  }
  
  /**
   * Hide the CTA with animation.
   */
  private hide(): void {
    this.visible = false;
    this.element.style.opacity = '0';
    this.element.style.transform = 'translateY(20px)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (!this.visible) {
        this.element.style.display = 'none';
      }
    }, 300);
  }
  
  /**
   * Mount to DOM.
   */
  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.element);
    
    // Update visibility on board context changes
    // TODO: Subscribe to board state store and context store
    setInterval(() => this.updateVisibility(), 5000); // Poll for now
  }
  
  /**
   * Destroy and clean up.
   */
  public destroy(): void {
    this.element.remove();
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let instance: CaptureToManualCTA | null = null;

/**
 * Get the singleton CTA instance.
 */
export function getCaptureToManualCTA(): CaptureToManualCTA {
  if (!instance) {
    instance = new CaptureToManualCTA();
  }
  return instance;
}

/**
 * Initialize the CTA (mount to DOM).
 */
export function initCaptureToManualCTA(): void {
  const cta = getCaptureToManualCTA();
  cta.mount();
}
