/**
 * @fileoverview Control Spectrum UI Element (J040)
 * 
 * Per-track control level slider for hybrid boards (collaborative control level).
 * Allows users to set different control levels (manual, assisted, directed, generative)
 * for each track independently.
 * 
 * @module @cardplay/ui/components/control-spectrum-slider
 */

import type { ControlLevel } from '../../boards/types';

/**
 * Control spectrum levels in order.
 */
const CONTROL_LEVELS: readonly ControlLevel[] = [
  'full-manual',
  'manual-with-hints',
  'assisted',
  'directed',
  'generative'
] as const;

/**
 * Control level colors (from Phase J theming).
 */
const CONTROL_COLORS: Record<ControlLevel, string> = {
  'full-manual': 'var(--control-manual, #64748B)',
  'manual-with-hints': 'var(--control-hints, #8B5CF6)',
  'assisted': 'var(--control-assisted, #3B82F6)',
  'directed': 'var(--control-directed, #10B981)',
  'generative': 'var(--control-generative, #F59E0B)',
  'collaborative': 'var(--control-collaborative, #EC4899)' // Hybrid/mixed
};

/**
 * Control level labels (short).
 */
const CONTROL_LABELS: Record<ControlLevel, string> = {
  'full-manual': 'Manual',
  'manual-with-hints': 'Hints',
  'assisted': 'Assisted',
  'directed': 'Directed',
  'generative': 'Generative',
  'collaborative': 'Hybrid'
};

/**
 * Control level descriptions.
 */
const CONTROL_DESCRIPTIONS: Record<ControlLevel, string> = {
  'full-manual': 'Full manual control - no AI assistance',
  'manual-with-hints': 'Manual with visual hints and suggestions',
  'assisted': 'Assisted - drag phrases and trigger generators on demand',
  'directed': 'Directed - AI generates based on your guidance',
  'generative': 'Generative - AI continuously generates, you curate',
  'collaborative': 'Collaborative - mix manual and AI per track'
};

/**
 * Options for control spectrum slider.
 */
export interface ControlSpectrumOptions {
  /** Track ID this slider controls */
  trackId: string;
  
  /** Initial control level */
  initialLevel: ControlLevel;
  
  /** Allowed control levels (subset of all levels) */
  allowedLevels?: readonly ControlLevel[];
  
  /** Callback when level changes */
  onChange?: (level: ControlLevel) => void;
  
  /** Show labels below slider */
  showLabels?: boolean;
  
  /** Compact mode (smaller size) */
  compact?: boolean;
}

/**
 * Control spectrum slider component.
 * 
 * J040: Visual slider for setting per-track control level in hybrid boards.
 */
export class ControlSpectrumSlider {
  private element: HTMLElement;
  // private trackId: string; // Reserved for future per-track state persistence
  private currentLevel: ControlLevel;
  private allowedLevels: readonly ControlLevel[];
  private onChange: ((level: ControlLevel) => void) | undefined;
  
  constructor(options: ControlSpectrumOptions) {
    // this.trackId = options.trackId; // Store for future use
    this.currentLevel = options.initialLevel;
    this.allowedLevels = options.allowedLevels ?? CONTROL_LEVELS;
    this.onChange = options.onChange;
    
    this.element = this.createElement(options);
    this.updateVisuals();
  }
  
  /**
   * Create the slider element.
   */
  private createElement(options: ControlSpectrumOptions): HTMLElement {
    const { showLabels = true, compact = false } = options;
    
    const container = document.createElement('div');
    container.className = 'control-spectrum-slider';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: ${compact ? '4px' : '8px'};
      min-width: ${compact ? '120px' : '200px'};
    `;
    
    // Slider track
    const track = document.createElement('div');
    track.className = 'control-spectrum-track';
    track.style.cssText = `
      position: relative;
      height: ${compact ? '24px' : '32px'};
      background: linear-gradient(
        to right,
        ${CONTROL_COLORS['full-manual']},
        ${CONTROL_COLORS['manual-with-hints']},
        ${CONTROL_COLORS['assisted']},
        ${CONTROL_COLORS['directed']},
        ${CONTROL_COLORS['generative']}
      );
      border-radius: ${compact ? '12px' : '16px'};
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    `;
    
    // Hover effect
    track.addEventListener('mouseenter', () => {
      track.style.opacity = '1';
    });
    
    track.addEventListener('mouseleave', () => {
      track.style.opacity = '0.7';
    });
    
    // Slider thumb
    const thumb = document.createElement('div');
    thumb.className = 'control-spectrum-thumb';
    thumb.style.cssText = `
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: ${compact ? '16px' : '20px'};
      height: ${compact ? '16px' : '20px'};
      background: white;
      border: ${compact ? '2px' : '3px'} solid currentColor;
      border-radius: 50%;
      cursor: grab;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    
    thumb.addEventListener('mousedown', () => {
      thumb.style.cursor = 'grabbing';
      thumb.style.transform = 'translate(-50%, -50%) scale(1.2)';
    });
    
    thumb.addEventListener('mouseup', () => {
      thumb.style.cursor = 'grab';
      thumb.style.transform = 'translate(-50%, -50%)';
    });
    
    track.appendChild(thumb);
    
    // Click to set level
    track.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      
      // Map percent to control level
      const levelIndex = Math.round(percent * (this.allowedLevels.length - 1));
      const newLevel = this.allowedLevels[levelIndex];
      
      if (newLevel) {
        this.setLevel(newLevel);
      }
    });
    
    // Drag to set level
    let dragging = false;
    
    thumb.addEventListener('mousedown', (e) => {
      dragging = true;
      e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      
      const levelIndex = Math.round(percent * (this.allowedLevels.length - 1));
      const newLevel = this.allowedLevels[levelIndex];
      
      if (newLevel) {
        this.setLevel(newLevel);
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        thumb.style.cursor = 'grab';
        thumb.style.transform = 'translate(-50%, -50%)';
      }
    });
    
    container.appendChild(track);
    
    // Level indicator
    const indicator = document.createElement('div');
    indicator.className = 'control-spectrum-indicator';
    indicator.style.cssText = `
      font-size: ${compact ? '11px' : '12px'};
      font-weight: 600;
      color: var(--text-primary, #1F2937);
      text-align: center;
      min-height: ${compact ? '16px' : '20px'};
    `;
    container.appendChild(indicator);
    
    // Labels (optional)
    if (showLabels) {
      const labels = document.createElement('div');
      labels.className = 'control-spectrum-labels';
      labels.style.cssText = `
        display: flex;
        justify-content: space-between;
        font-size: ${compact ? '9px' : '10px'};
        color: var(--text-secondary, #6B7280);
        margin-top: -4px;
      `;
      
      labels.innerHTML = `
        <span>Manual</span>
        <span>AI</span>
      `;
      
      container.appendChild(labels);
    }
    
    return container;
  }
  
  /**
   * Set control level.
   */
  public setLevel(level: ControlLevel): void {
    if (!this.allowedLevels.includes(level)) {
      console.warn('Level not allowed:', level);
      return;
    }
    
    this.currentLevel = level;
    this.updateVisuals();
    
    if (this.onChange) {
      this.onChange(level);
    }
  }
  
  /**
   * Get current level.
   */
  public getLevel(): ControlLevel {
    return this.currentLevel;
  }
  
  /**
   * Update visual state.
   */
  private updateVisuals(): void {
    const thumb = this.element.querySelector('.control-spectrum-thumb') as HTMLElement;
    const indicator = this.element.querySelector('.control-spectrum-indicator') as HTMLElement;
    
    if (!thumb || !indicator) return;
    
    // Calculate position
    const levelIndex = this.allowedLevels.indexOf(this.currentLevel);
    const percent = levelIndex / (this.allowedLevels.length - 1);
    
    // Update thumb position and color
    thumb.style.left = `${percent * 100}%`;
    thumb.style.color = CONTROL_COLORS[this.currentLevel];
    
    // Update indicator text
    indicator.textContent = CONTROL_LABELS[this.currentLevel];
    indicator.style.color = CONTROL_COLORS[this.currentLevel];
    indicator.title = CONTROL_DESCRIPTIONS[this.currentLevel];
  }
  
  /**
   * Get DOM element.
   */
  public getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * Mount to parent element.
   */
  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }
  
  /**
   * Destroy and clean up.
   */
  public destroy(): void {
    this.element.remove();
  }
}

/**
 * Create a control spectrum slider.
 * 
 * Convenience factory function.
 */
export function createControlSpectrumSlider(
  options: ControlSpectrumOptions
): ControlSpectrumSlider {
  return new ControlSpectrumSlider(options);
}
