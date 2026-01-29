import type { ControlLevel } from '../../boards/types';

const CONTROL_LEVEL_COLORS: Record<ControlLevel, string> = {
  'full-manual': '#4a90e2',
  'manual-with-hints': '#7b68ee',
  'assisted': '#9370db',
  'collaborative': '#ba55d3',
  'directed': '#ba55d3',
  'generative': '#da70d6',
};

const CONTROL_LEVEL_LABELS: Record<ControlLevel, string> = {
  'full-manual': 'Manual',
  'manual-with-hints': 'Hints',
  'assisted': 'Assisted',
  'collaborative': 'Collaborative',
  'directed': 'Directed',
  'generative': 'Generative',
};

const CONTROL_LEVEL_DESCRIPTIONS: Record<ControlLevel, string> = {
  'full-manual': 'Pure manual control - no AI assistance or suggestions',
  'manual-with-hints': 'Manual work with visual hints and color-coding',
  'assisted': 'Manual work with drag-drop phrases and on-demand generation',
  'collaborative': 'Mix manual and AI per track - power user control',
  'directed': 'Set direction and constraints, AI fills in details',
  'generative': 'AI generates continuously, you curate and refine',
};

export interface ControlSpectrumBadgeOptions {
  controlLevel: ControlLevel;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

export class ControlSpectrumBadge {
  private element: HTMLElement;
  private controlLevel: ControlLevel;
  private showLabel: boolean;
  private size: 'small' | 'medium' | 'large';
  private interactive: boolean;

  constructor(options: ControlSpectrumBadgeOptions) {
    this.controlLevel = options.controlLevel;
    this.showLabel = options.showLabel ?? true;
    this.size = options.size ?? 'medium';
    this.interactive = options.interactive ?? true;

    this.element = this.createElement();
    injectControlSpectrumBadgeStyles();
  }

  private createElement(): HTMLElement {
    const badge = document.createElement('div');
    badge.className = `control-spectrum-badge control-spectrum-badge--${this.size}`;
    
    if (this.interactive) {
      badge.setAttribute('tabindex', '0');
      badge.setAttribute('role', 'button');
    }

    const color = CONTROL_LEVEL_COLORS[this.controlLevel];
    badge.style.setProperty('--badge-color', color);

    const dot = document.createElement('span');
    dot.className = 'control-spectrum-badge__dot';
    badge.appendChild(dot);

    if (this.showLabel) {
      const label = document.createElement('span');
      label.className = 'control-spectrum-badge__label';
      label.textContent = CONTROL_LEVEL_LABELS[this.controlLevel];
      badge.appendChild(label);
    }

    const tooltip = document.createElement('span');
    tooltip.className = 'control-spectrum-badge__tooltip';
    tooltip.textContent = CONTROL_LEVEL_DESCRIPTIONS[this.controlLevel];
    tooltip.setAttribute('role', 'tooltip');
    badge.appendChild(tooltip);

    badge.setAttribute('aria-label', `Control level: ${CONTROL_LEVEL_LABELS[this.controlLevel]}`);
    badge.setAttribute('title', CONTROL_LEVEL_DESCRIPTIONS[this.controlLevel]);

    return badge;
  }

  public updateControlLevel(controlLevel: ControlLevel): void {
    this.controlLevel = controlLevel;
    const color = CONTROL_LEVEL_COLORS[controlLevel];
    this.element.style.setProperty('--badge-color', color);
    
    const labelElement = this.element.querySelector('.control-spectrum-badge__label');
    if (labelElement) {
      labelElement.textContent = CONTROL_LEVEL_LABELS[controlLevel];
    }

    const tooltipElement = this.element.querySelector('.control-spectrum-badge__tooltip');
    if (tooltipElement) {
      tooltipElement.textContent = CONTROL_LEVEL_DESCRIPTIONS[controlLevel];
    }

    this.element.setAttribute('aria-label', `Control level: ${CONTROL_LEVEL_LABELS[controlLevel]}`);
    this.element.setAttribute('title', CONTROL_LEVEL_DESCRIPTIONS[controlLevel]);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}

let stylesInjected = false;

function injectControlSpectrumBadgeStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'control-spectrum-badge-styles';
  style.textContent = `
    .control-spectrum-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      background: var(--surface-secondary);
      position: relative;
      cursor: default;
      transition: background 0.2s ease;
    }

    .control-spectrum-badge[role="button"] {
      cursor: pointer;
    }

    .control-spectrum-badge[role="button"]:hover {
      background: var(--surface-tertiary);
    }

    .control-spectrum-badge[role="button"]:focus {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
    }

    .control-spectrum-badge--small {
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      gap: 0.25rem;
    }

    .control-spectrum-badge--medium {
      font-size: 0.875rem;
    }

    .control-spectrum-badge--large {
      font-size: 1rem;
      padding: 0.375rem 0.75rem;
      gap: 0.625rem;
    }

    .control-spectrum-badge__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--badge-color);
      box-shadow: 0 0 4px var(--badge-color);
    }

    .control-spectrum-badge--small .control-spectrum-badge__dot {
      width: 0.375rem;
      height: 0.375rem;
    }

    .control-spectrum-badge--large .control-spectrum-badge__dot {
      width: 0.625rem;
      height: 0.625rem;
    }

    .control-spectrum-badge__label {
      color: var(--text-primary);
      font-weight: 500;
      user-select: none;
    }

    .control-spectrum-badge__tooltip {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 50%;
      transform: translateX(-50%);
      background: var(--surface-elevated);
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 1000;
    }

    .control-spectrum-badge:hover .control-spectrum-badge__tooltip,
    .control-spectrum-badge:focus .control-spectrum-badge__tooltip {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .control-spectrum-badge,
      .control-spectrum-badge__tooltip {
        transition: none;
      }
    }
  `;
  
  document.head.appendChild(style);
}
