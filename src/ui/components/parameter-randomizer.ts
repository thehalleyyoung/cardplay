/**
 * Parameter Randomizer with Constraints
 * 
 * Tool for exploring sound design parameter space with
 * intelligent constraints. Useful for:
 * - Breaking creative blocks
 * - Discovering unexpected sounds
 * - Controlled experimentation
 * - Preset variation generation
 * 
 * Features constraint types:
 * - Range constraints (min/max values)
 * - Category locks (keep certain params fixed)
 * - Relationship constraints (param A affects param B)
 * - Style profiles (bass-focused, bright, dark, etc.)
 */

export type ParameterId = string & { readonly __brand: 'ParameterId' };

export interface ParameterDescriptor {
  id: ParameterId;
  name: string;
  category: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  unit?: string;
  isDiscrete?: boolean;
  discreteValues?: number[];
}

export interface ParameterConstraint {
  parameterId: ParameterId;
  type: 'range' | 'fixed' | 'weighted';
  minValue?: number;
  maxValue?: number;
  fixedValue?: number;
  weight?: number; // 0-1, higher = more likely to be near default
}

export interface StyleProfile {
  id: string;
  name: string;
  description: string;
  constraints: ParameterConstraint[];
}

export const STYLE_PROFILES: StyleProfile[] = [
  {
    id: 'bass-heavy',
    name: 'Bass-Heavy',
    description: 'Emphasizes low frequencies and sub bass content',
    constraints: []
  },
  {
    id: 'bright',
    name: 'Bright & Airy',
    description: 'Emphasizes high frequencies and openness',
    constraints: []
  },
  {
    id: 'dark',
    name: 'Dark & Moody',
    description: 'Reduces highs, emphasizes low-mids and darkness',
    constraints: []
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'High resonance, distortion, and edge',
    constraints: []
  },
  {
    id: 'smooth',
    name: 'Smooth & Warm',
    description: 'Rounded, gentle, no harsh frequencies',
    constraints: []
  },
  {
    id: 'experimental',
    name: 'Experimental',
    description: 'Wide open parameter space, anything goes',
    constraints: []
  }
];

export interface RandomizerConfig {
  /** Available parameters */
  parameters: ParameterDescriptor[];
  /** Current parameter values */
  currentValues: Map<ParameterId, number>;
  /** Callback when new values generated */
  onValuesGenerated: (values: Map<ParameterId, number>) => void;
  /** Callback when applying values */
  onApplyValues: (values: Map<ParameterId, number>) => void;
}

export class ParameterRandomizer {
  private container: HTMLElement;
  private config: RandomizerConfig;
  private lockedParams: Set<ParameterId> = new Set();
  private selectedProfile: StyleProfile | null = null;
  private generatedValues: Map<ParameterId, number> | null = null;
  private randomnessAmount = 0.5; // 0 = very conservative, 1 = wild

  constructor(config: RandomizerConfig) {
    this.config = config;
    this.container = this.createUI();
  }

  /**
   * Get the randomizer container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Create randomizer UI
   */
  private createUI(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'parameter-randomizer';
    container.style.cssText = `
      width: 500px;
      max-height: 80vh;
      background: var(--panel-background, #2a2a2a);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--border-color, #444444);
    `;

    const title = document.createElement('h2');
    title.textContent = '🎲 Randomize Parameters';
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #ffffff);
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Explore parameter space with intelligent constraints';
    subtitle.style.cssText = `
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary, #cccccc);
    `;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Body
    const body = document.createElement('div');
    body.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // Randomness amount slider
    const randomnessSection = this.createRandomnessSlider();
    
    // Style profile selector
    const profileSection = this.createProfileSelector();

    // Parameter locks
    const locksSection = this.createParameterLocks();

    // Action buttons
    const actions = this.createActions();

    body.appendChild(randomnessSection);
    body.appendChild(profileSection);
    body.appendChild(locksSection);

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(actions);

    return container;
  }

  /**
   * Create randomness amount slider
   */
  private createRandomnessSlider(): HTMLElement {
    const section = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = 'Randomness Amount';
    label.style.cssText = `
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary, #cccccc);
      margin-bottom: 8px;
    `;

    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '50';
    slider.style.cssText = `
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--border-color, #444444);
      outline: none;
      -webkit-appearance: none;
    `;

    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = 'Medium';
    valueDisplay.style.cssText = `
      font-size: 12px;
      color: var(--text-tertiary, #888888);
      min-width: 80px;
      text-align: right;
    `;

    slider.addEventListener('input', () => {
      const value = parseInt(slider.value) / 100;
      this.randomnessAmount = value;

      if (value < 0.33) {
        valueDisplay.textContent = 'Conservative';
      } else if (value < 0.67) {
        valueDisplay.textContent = 'Medium';
      } else {
        valueDisplay.textContent = 'Wild';
      }
    });

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);

    section.appendChild(label);
    section.appendChild(sliderContainer);

    return section;
  }

  /**
   * Create style profile selector
   */
  private createProfileSelector(): HTMLElement {
    const section = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = 'Style Profile';
    label.style.cssText = `
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary, #cccccc);
      margin-bottom: 8px;
    `;

    const profiles = document.createElement('div');
    profiles.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    `;

    STYLE_PROFILES.forEach((profile) => {
      const button = document.createElement('button');
      button.textContent = profile.name;
      button.title = profile.description;
      button.style.cssText = `
        padding: 12px;
        border: 1px solid var(--border-color, #444444);
        border-radius: 6px;
        background: ${this.selectedProfile?.id === profile.id ? 'var(--accent-color, #3399ff)' : 'transparent'};
        color: var(--text-primary, #ffffff);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: left;
      `;

      button.addEventListener('click', () => {
        this.selectedProfile = this.selectedProfile?.id === profile.id ? null : profile;
        
        // Update all buttons
        Array.from(profiles.children).forEach((child) => {
          (child as HTMLElement).style.background = 'transparent';
        });
        
        if (this.selectedProfile) {
          button.style.background = 'var(--accent-color, #3399ff)';
        }
      });

      button.addEventListener('mouseenter', () => {
        if (this.selectedProfile?.id !== profile.id) {
          button.style.background = 'var(--hover-background, #333333)';
        }
      });

      button.addEventListener('mouseleave', () => {
        if (this.selectedProfile?.id !== profile.id) {
          button.style.background = 'transparent';
        }
      });

      profiles.appendChild(button);
    });

    section.appendChild(label);
    section.appendChild(profiles);

    return section;
  }

  /**
   * Create parameter locks section
   */
  private createParameterLocks(): HTMLElement {
    const section = document.createElement('div');

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    const label = document.createElement('label');
    label.textContent = 'Lock Parameters';
    label.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary, #cccccc);
    `;

    const lockAllButton = document.createElement('button');
    lockAllButton.textContent = this.lockedParams.size === this.config.parameters.length ? 'Unlock All' : 'Lock All';
    lockAllButton.style.cssText = `
      padding: 4px 12px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: transparent;
      color: var(--text-tertiary, #888888);
      font-size: 11px;
      cursor: pointer;
    `;
    lockAllButton.addEventListener('click', () => {
      if (this.lockedParams.size === this.config.parameters.length) {
        this.lockedParams.clear();
        lockAllButton.textContent = 'Lock All';
      } else {
        this.config.parameters.forEach((p) => this.lockedParams.add(p.id));
        lockAllButton.textContent = 'Unlock All';
      }
      this.refreshParameterList();
    });

    header.appendChild(label);
    header.appendChild(lockAllButton);

    const paramList = document.createElement('div');
    paramList.id = 'parameter-locks';
    paramList.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
      background: var(--card-background, #333333);
      border-radius: 6px;
      padding: 8px;
    `;

    this.renderParameterList(paramList);

    section.appendChild(header);
    section.appendChild(paramList);

    return section;
  }

  /**
   * Render parameter lock list
   */
  private renderParameterList(container: HTMLElement): void {
    container.innerHTML = '';

    // Group by category
    const byCategory = new Map<string, ParameterDescriptor[]>();
    this.config.parameters.forEach((param) => {
      if (!byCategory.has(param.category)) {
        byCategory.set(param.category, []);
      }
      byCategory.get(param.category)!.push(param);
    });

    byCategory.forEach((params, category) => {
      const categoryHeader = document.createElement('div');
      categoryHeader.textContent = category;
      categoryHeader.style.cssText = `
        font-size: 11px;
        font-weight: 600;
        color: var(--text-tertiary, #888888);
        margin: 8px 0 4px 0;
        text-transform: uppercase;
      `;
      container.appendChild(categoryHeader);

      params.forEach((param) => {
        const item = document.createElement('label');
        item.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.15s;
        `;

        item.addEventListener('mouseenter', () => {
          item.style.background = 'var(--hover-background, #2a2a2a)';
        });

        item.addEventListener('mouseleave', () => {
          item.style.background = 'transparent';
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.lockedParams.has(param.id);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            this.lockedParams.add(param.id);
          } else {
            this.lockedParams.delete(param.id);
          }
        });

        const name = document.createElement('span');
        name.textContent = param.name;
        name.style.cssText = `
          font-size: 12px;
          color: var(--text-primary, #ffffff);
          flex: 1;
        `;

        item.appendChild(checkbox);
        item.appendChild(name);
        container.appendChild(item);
      });
    });
  }

  /**
   * Refresh parameter list
   */
  private refreshParameterList(): void {
    const list = this.container.querySelector('#parameter-locks');
    if (list) {
      this.renderParameterList(list as HTMLElement);
    }
  }

  /**
   * Create action buttons
   */
  private createActions(): HTMLElement {
    const actions = document.createElement('div');
    actions.style.cssText = `
      padding: 16px;
      border-top: 1px solid var(--border-color, #444444);
      display: flex;
      gap: 8px;
    `;

    const generateButton = document.createElement('button');
    generateButton.textContent = '🎲 Generate';
    generateButton.style.cssText = `
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 6px;
      background: var(--accent-color, #3399ff);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    `;
    generateButton.addEventListener('click', () => {
      this.generateRandomValues();
    });

    const applyButton = document.createElement('button');
    applyButton.textContent = '✓ Apply';
    applyButton.style.cssText = `
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 6px;
      background: var(--success-color, #33ff99);
      color: #000;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      opacity: ${this.generatedValues ? '1' : '0.5'};
    `;
    applyButton.disabled = !this.generatedValues;
    applyButton.addEventListener('click', () => {
      if (this.generatedValues) {
        this.config.onApplyValues(this.generatedValues);
      }
    });

    actions.appendChild(generateButton);
    actions.appendChild(applyButton);

    return actions;
  }

  /**
   * Generate random parameter values
   */
  private generateRandomValues(): void {
    const newValues = new Map<ParameterId, number>();

    this.config.parameters.forEach((param) => {
      if (this.lockedParams.has(param.id)) {
        // Keep locked parameters at current value
        newValues.set(param.id, this.config.currentValues.get(param.id) ?? param.defaultValue);
      } else {
        // Generate random value with constraints
        const value = this.generateValue(param);
        newValues.set(param.id, value);
      }
    });

    this.generatedValues = newValues;
    this.config.onValuesGenerated(newValues);

    // Enable apply button
    const applyButton = this.container.querySelector('[style*="success-color"]') as HTMLButtonElement | null;
    if (applyButton) {
      applyButton.disabled = false;
      applyButton.style.opacity = '1';
    }
  }

  /**
   * Generate value for parameter
   */
  private generateValue(param: ParameterDescriptor): number {
    const { minValue, maxValue, defaultValue, isDiscrete, discreteValues } = param;
    const range = maxValue - minValue;
    
    // Apply randomness amount - blend between default and random
    const targetValue = minValue + Math.random() * range;
    const conservative = defaultValue;
    const blendFactor = this.randomnessAmount;
    
    let value = conservative * (1 - blendFactor) + targetValue * blendFactor;

    // Clamp to range
    value = Math.max(minValue, Math.min(maxValue, value));

    // Handle discrete values
    if (isDiscrete && discreteValues) {
      const closest = discreteValues.reduce((prev, curr) => {
        return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
      });
      value = closest;
    }

    return value;
  }
}

/**
 * Show parameter randomizer in a modal
 */
export function showParameterRandomizer(config: RandomizerConfig): void {
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s;
  `;

  const randomizer = new ParameterRandomizer({
    ...config,
    onApplyValues: (values) => {
      backdrop.remove();
      config.onApplyValues(values);
    }
  });

  backdrop.appendChild(randomizer.getElement());
  document.body.appendChild(backdrop);

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  });

  // Close on Escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      backdrop.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}
