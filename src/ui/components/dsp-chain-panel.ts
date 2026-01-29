/**
 * @fileoverview DSP Chain Panel (E042-E043)
 * 
 * Effect stack panel using StackComponent for effect cards.
 * Integrates with routing graph for audio connections.
 * 
 * @module @cardplay/ui/components/dsp-chain-panel
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EffectSlot {
  id: string;
  effectType: string;
  effectName: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface DSPChainConfig {
  chainId: string;
  effects: EffectSlot[];
  onAddEffect?: () => void;
  onRemoveEffect?: (effectId: string) => void;
  onToggleEffect?: (effectId: string, enabled: boolean) => void;
  onReorderEffects?: (fromIndex: number, toIndex: number) => void;
}

// ============================================================================
// DSP CHAIN PANEL
// ============================================================================

/**
 * Creates a DSP chain panel for audio effects.
 * E042-E043: Effect stack with routing graph integration.
 */
export function createDSPChainPanel(config: DSPChainConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'dsp-chain-panel';
  container.setAttribute('data-chain-id', config.chainId);
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Audio effect chain');
  
  // Apply styles
  injectDSPChainStyles();
  
  // Render chain
  renderChain(container, config);
  
  return container;
}

function renderChain(container: HTMLElement, config: DSPChainConfig): void {
  container.innerHTML = '';
  
  // Header
  const header = document.createElement('div');
  header.className = 'dsp-chain-header';
  
  const title = document.createElement('h3');
  title.textContent = 'Effect Chain';
  header.appendChild(title);
  
  const addButton = document.createElement('button');
  addButton.className = 'dsp-chain-add-button';
  addButton.textContent = '+ Add Effect';
  addButton.setAttribute('aria-label', 'Add effect to chain');
  addButton.addEventListener('click', () => {
    if (config.onAddEffect) {
      config.onAddEffect();
    }
  });
  header.appendChild(addButton);
  
  container.appendChild(header);
  
  // Effect slots
  const slotsContainer = document.createElement('div');
  slotsContainer.className = 'dsp-chain-slots';
  
  if (config.effects.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'dsp-chain-empty';
    emptyState.textContent = 'No effects — click "Add Effect" to start';
    slotsContainer.appendChild(emptyState);
  } else {
    config.effects.forEach((effect, index) => {
      const slotEl = createEffectSlot(effect, index, config);
      slotsContainer.appendChild(slotEl);
      
      // Add arrow between effects (except after last)
      if (index < config.effects.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'dsp-chain-arrow';
        arrow.textContent = '↓';
        slotsContainer.appendChild(arrow);
      }
    });
  }
  
  container.appendChild(slotsContainer);
}

function createEffectSlot(
  effect: EffectSlot,
  index: number,
  config: DSPChainConfig
): HTMLElement {
  const slot = document.createElement('div');
  slot.className = 'dsp-effect-slot';
  slot.setAttribute('data-effect-id', effect.id);
  slot.setAttribute('data-index', index.toString());
  
  if (!effect.enabled) {
    slot.classList.add('dsp-effect-slot--disabled');
  }
  
  // Effect header
  const slotHeader = document.createElement('div');
  slotHeader.className = 'dsp-effect-slot-header';
  
  const slotTitle = document.createElement('div');
  slotTitle.className = 'dsp-effect-slot-title';
  slotTitle.textContent = effect.effectName;
  slotHeader.appendChild(slotTitle);
  
  const controls = document.createElement('div');
  controls.className = 'dsp-effect-slot-controls';
  
  // Power button
  const powerBtn = document.createElement('button');
  powerBtn.className = 'dsp-effect-power-button';
  powerBtn.textContent = effect.enabled ? '●' : '○';
  powerBtn.setAttribute('aria-label', effect.enabled ? 'Disable effect' : 'Enable effect');
  powerBtn.title = effect.enabled ? 'Disable' : 'Enable';
  powerBtn.addEventListener('click', () => {
    if (config.onToggleEffect) {
      config.onToggleEffect(effect.id, !effect.enabled);
    }
  });
  controls.appendChild(powerBtn);
  
  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'dsp-effect-remove-button';
  removeBtn.textContent = '×';
  removeBtn.setAttribute('aria-label', 'Remove effect');
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', () => {
    if (config.onRemoveEffect) {
      config.onRemoveEffect(effect.id);
    }
  });
  controls.appendChild(removeBtn);
  
  slotHeader.appendChild(controls);
  slot.appendChild(slotHeader);
  
  // Effect type
  const typeLabel = document.createElement('div');
  typeLabel.className = 'dsp-effect-type';
  typeLabel.textContent = effect.effectType;
  slot.appendChild(typeLabel);
  
  // Parameters (preview)
  if (Object.keys(effect.parameters).length > 0) {
    const params = document.createElement('div');
    params.className = 'dsp-effect-params';
    
    const paramCount = Object.keys(effect.parameters).length;
    params.textContent = `${paramCount} parameter${paramCount !== 1 ? 's' : ''}`;
    slot.appendChild(params);
  }
  
  return slot;
}

// ============================================================================
// STYLES
// ============================================================================

let stylesInjected = false;

function injectDSPChainStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .dsp-chain-panel {
      width: 100%;
      height: 100%;
      background: var(--surface-base, #1a1a1a);
      padding: 16px;
      overflow-y: auto;
    }
    
    .dsp-chain-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-base, #333);
    }
    
    .dsp-chain-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #fff);
    }
    
    .dsp-chain-add-button {
      padding: 6px 12px;
      background: var(--accent-primary, #00ff88);
      color: var(--text-on-accent, #000);
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .dsp-chain-add-button:hover {
      background: var(--accent-primary-hover, #00dd77);
      transform: translateY(-1px);
    }
    
    .dsp-chain-add-button:active {
      transform: translateY(0);
    }
    
    .dsp-chain-add-button:focus-visible {
      outline: 2px solid var(--accent-primary, #00ff88);
      outline-offset: 2px;
    }
    
    .dsp-chain-slots {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .dsp-chain-empty {
      padding: 32px;
      text-align: center;
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
      background: var(--surface-sunken, #0a0a0a);
      border: 1px dashed var(--border-base, #333);
      border-radius: 4px;
    }
    
    .dsp-chain-arrow {
      text-align: center;
      color: var(--text-tertiary, #444);
      font-size: 1.25rem;
      user-select: none;
    }
    
    .dsp-effect-slot {
      background: var(--surface-raised, #2a2a2a);
      border: 1px solid var(--border-base, #444);
      border-radius: 4px;
      padding: 12px;
      transition: all 0.15s ease;
    }
    
    .dsp-effect-slot:hover {
      border-color: var(--border-hover, #666);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .dsp-effect-slot--disabled {
      opacity: 0.5;
    }
    
    .dsp-effect-slot-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .dsp-effect-slot-title {
      font-weight: 600;
      color: var(--text-primary, #fff);
      font-size: 0.875rem;
    }
    
    .dsp-effect-slot-controls {
      display: flex;
      gap: 8px;
    }
    
    .dsp-effect-power-button,
    .dsp-effect-remove-button {
      width: 24px;
      height: 24px;
      padding: 0;
      background: var(--surface-base, #1a1a1a);
      border: 1px solid var(--border-base, #444);
      border-radius: 4px;
      color: var(--text-primary, #fff);
      cursor: pointer;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    
    .dsp-effect-power-button:hover,
    .dsp-effect-remove-button:hover {
      background: var(--surface-raised, #2a2a2a);
      border-color: var(--border-hover, #666);
    }
    
    .dsp-effect-remove-button {
      color: var(--accent-danger, #ff4444);
    }
    
    .dsp-effect-type {
      font-size: 0.75rem;
      color: var(--text-secondary, #999);
      margin-bottom: 4px;
    }
    
    .dsp-effect-params {
      font-size: 0.75rem;
      color: var(--text-tertiary, #666);
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .dsp-chain-add-button,
      .dsp-effect-slot,
      .dsp-effect-power-button,
      .dsp-effect-remove-button {
        transition: none;
      }
      
      .dsp-chain-add-button:hover {
        transform: none;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Types exported at top of file
