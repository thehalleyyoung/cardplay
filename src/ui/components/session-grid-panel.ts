/**
 * @fileoverview Session Grid Panel (E035-E038)
 * 
 * Renders an Ableton-like session grid for clip launching.
 * Wired to SessionViewStoreBridge and ClipRegistry.
 * 
 * @module @cardplay/ui/components/session-grid-panel
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SessionSlot {
  trackIndex: number;
  sceneIndex: number;
  clipId: string | null;
  clipName?: string;
  clipColor?: string;
  playState: 'stopped' | 'playing' | 'queued';
}

export interface SessionGridConfig {
  trackCount: number;
  sceneCount: number;
  onSlotClick?: (slot: SessionSlot) => void;
  onSlotDoubleClick?: (slot: SessionSlot) => void;
  getSlot: (trackIndex: number, sceneIndex: number) => SessionSlot;
}

// ============================================================================
// SESSION GRID PANEL
// ============================================================================

/**
 * Creates a session grid panel component.
 * E035-E038: Session grid with clip launch state and selection.
 */
export function createSessionGridPanel(config: SessionGridConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'session-grid-panel';
  container.setAttribute('role', 'grid');
  container.setAttribute('aria-label', 'Session clip grid');
  
  // Apply styles
  injectSessionGridStyles();
  
  // Render grid
  renderGrid(container, config);
  
  return container;
}

function renderGrid(container: HTMLElement, config: SessionGridConfig): void {
  container.innerHTML = '';
  
  // Create grid structure
  const gridWrapper = document.createElement('div');
  gridWrapper.className = 'session-grid-wrapper';
  
  // Scene headers (left column)
  const sceneColumn = document.createElement('div');
  sceneColumn.className = 'session-scene-column';
  
  for (let sceneIndex = 0; sceneIndex < config.sceneCount; sceneIndex++) {
    const sceneHeader = document.createElement('div');
    sceneHeader.className = 'session-scene-header';
    sceneHeader.textContent = `Scene ${sceneIndex + 1}`;
    sceneHeader.setAttribute('role', 'rowheader');
    sceneColumn.appendChild(sceneHeader);
  }
  
  // Track grid
  const trackGrid = document.createElement('div');
  trackGrid.className = 'session-track-grid';
  trackGrid.style.gridTemplateColumns = `repeat(${config.trackCount}, 1fr)`;
  
  // Track headers (top row)
  for (let trackIndex = 0; trackIndex < config.trackCount; trackIndex++) {
    const trackHeader = document.createElement('div');
    trackHeader.className = 'session-track-header';
    trackHeader.textContent = `Track ${trackIndex + 1}`;
    trackHeader.setAttribute('role', 'columnheader');
    trackGrid.appendChild(trackHeader);
  }
  
  // Clip slots
  for (let sceneIndex = 0; sceneIndex < config.sceneCount; sceneIndex++) {
    for (let trackIndex = 0; trackIndex < config.trackCount; trackIndex++) {
      const slot = config.getSlot(trackIndex, sceneIndex);
      const slotElement = createSlotElement(slot, config);
      trackGrid.appendChild(slotElement);
    }
  }
  
  gridWrapper.appendChild(sceneColumn);
  gridWrapper.appendChild(trackGrid);
  container.appendChild(gridWrapper);
}

function createSlotElement(slot: SessionSlot, config: SessionGridConfig): HTMLElement {
  const slotEl = document.createElement('button');
  slotEl.className = 'session-slot';
  slotEl.setAttribute('role', 'gridcell');
  slotEl.setAttribute('data-track', slot.trackIndex.toString());
  slotEl.setAttribute('data-scene', slot.sceneIndex.toString());
  slotEl.setAttribute('data-play-state', slot.playState);
  
  // Style based on play state
  if (slot.playState === 'playing') {
    slotEl.classList.add('session-slot--playing');
  } else if (slot.playState === 'queued') {
    slotEl.classList.add('session-slot--queued');
  }
  
  // Empty vs filled slot
  if (slot.clipId) {
    slotEl.classList.add('session-slot--filled');
    slotEl.style.backgroundColor = slot.clipColor || '#444';
    
    const label = document.createElement('span');
    label.className = 'session-slot-label';
    label.textContent = slot.clipName || 'Clip';
    slotEl.appendChild(label);
    
    slotEl.setAttribute('aria-label', `Clip: ${slot.clipName || 'Unnamed'}, ${slot.playState}`);
  } else {
    slotEl.classList.add('session-slot--empty');
    slotEl.setAttribute('aria-label', `Empty slot Track ${slot.trackIndex + 1} Scene ${slot.sceneIndex + 1}`);
  }
  
  // Click handlers
  slotEl.addEventListener('click', () => {
    if (config.onSlotClick) {
      config.onSlotClick(slot);
    }
  });
  
  slotEl.addEventListener('dblclick', () => {
    if (config.onSlotDoubleClick) {
      config.onSlotDoubleClick(slot);
    }
  });
  
  return slotEl;
}

// ============================================================================
// STYLES
// ============================================================================

let stylesInjected = false;

function injectSessionGridStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .session-grid-panel {
      width: 100%;
      height: 100%;
      overflow: auto;
      background: var(--surface-base, #1a1a1a);
      padding: 8px;
    }
    
    .session-grid-wrapper {
      display: flex;
      gap: 4px;
    }
    
    .session-scene-column {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-top: 32px; /* Align with track headers */
    }
    
    .session-scene-header {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-raised, #2a2a2a);
      color: var(--text-primary, #fff);
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 2px;
      padding: 0 8px;
      writing-mode: horizontal-tb;
      white-space: nowrap;
    }
    
    .session-track-grid {
      display: grid;
      gap: 2px;
      flex: 1;
    }
    
    .session-track-header {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-raised, #2a2a2a);
      color: var(--text-primary, #fff);
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 2px;
    }
    
    .session-slot {
      height: 64px;
      border: 1px solid var(--border-base, #444);
      border-radius: 2px;
      background: var(--surface-sunken, #0a0a0a);
      color: var(--text-primary, #fff);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      padding: 4px;
      position: relative;
    }
    
    .session-slot--empty {
      border-style: dashed;
      opacity: 0.6;
    }
    
    .session-slot--empty:hover {
      opacity: 1;
      background: var(--surface-base, #1a1a1a);
    }
    
    .session-slot--filled:hover {
      filter: brightness(1.2);
      transform: scale(1.02);
    }
    
    .session-slot--playing {
      border-color: var(--accent-primary, #00ff88);
      box-shadow: 0 0 8px var(--accent-primary, #00ff88);
      animation: pulse 1s ease-in-out infinite;
    }
    
    .session-slot--queued {
      border-color: var(--accent-warning, #ffaa00);
      opacity: 0.8;
    }
    
    .session-slot-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .session-slot:focus-visible {
      outline: 2px solid var(--accent-primary, #00ff88);
      outline-offset: 2px;
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .session-slot {
        transition: none;
      }
      
      .session-slot--playing {
        animation: none;
      }
      
      .session-slot--filled:hover {
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
