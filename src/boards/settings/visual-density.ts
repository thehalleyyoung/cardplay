/**
 * @fileoverview Visual Density Settings (J052-J053)
 * 
 * Per-board visual density settings for tracker/session views.
 * Supports compact vs comfortable row heights.
 * 
 * @module @cardplay/boards/settings/visual-density
 */

export type VisualDensity = 'compact' | 'comfortable' | 'spacious';

/**
 * Visual density presets with row heights and spacing values
 */
export interface DensityPreset {
  /** Row height for tracker/session views */
  rowHeight: number;
  
  /** Padding inside cells */
  cellPadding: number;
  
  /** Font size for content */
  fontSize: number;
  
  /** Spacing between sections */
  sectionSpacing: number;
}

/**
 * J052: Visual density presets for different view types
 */
export const DENSITY_PRESETS: Record<VisualDensity, DensityPreset> = {
  compact: {
    rowHeight: 20,
    cellPadding: 4,
    fontSize: 11,
    sectionSpacing: 8,
  },
  comfortable: {
    rowHeight: 28,
    cellPadding: 8,
    fontSize: 13,
    sectionSpacing: 12,
  },
  spacious: {
    rowHeight: 36,
    cellPadding: 12,
    fontSize: 14,
    sectionSpacing: 16,
  },
};

/**
 * Visual density settings per board
 */
export interface BoardDensitySettings {
  /** Board ID */
  boardId: string;
  
  /** Global density for this board */
  density: VisualDensity;
  
  /** Per-deck overrides */
  deckOverrides?: Record<string, VisualDensity>;
}

/**
 * Density settings manager
 */
export class VisualDensityManager {
  private settings: Map<string, BoardDensitySettings> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Get density setting for a board
   */
  getDensity(boardId: string): VisualDensity {
    return this.settings.get(boardId)?.density ?? 'comfortable';
  }

  /**
   * Get density preset for a board
   */
  getPreset(boardId: string): DensityPreset {
    const density = this.getDensity(boardId);
    return DENSITY_PRESETS[density];
  }

  /**
   * Set density for a board
   * J053: Persist per board
   */
  setDensity(boardId: string, density: VisualDensity): void {
    const current = this.settings.get(boardId) ?? { boardId, density };
    this.settings.set(boardId, { ...current, density });
    this.persist();
    this.notifyListeners();
  }

  /**
   * Get density for a specific deck
   */
  getDeckDensity(boardId: string, deckId: string): VisualDensity {
    const settings = this.settings.get(boardId);
    return settings?.deckOverrides?.[deckId] ?? this.getDensity(boardId);
  }

  /**
   * Set density override for a specific deck
   */
  setDeckDensity(boardId: string, deckId: string, density: VisualDensity): void {
    const current = this.settings.get(boardId) ?? { boardId, density: 'comfortable' };
    const deckOverrides = current.deckOverrides ?? {};
    
    this.settings.set(boardId, {
      ...current,
      deckOverrides: {
        ...deckOverrides,
        [deckId]: density,
      },
    });
    
    this.persist();
    this.notifyListeners();
  }

  /**
   * Clear deck override (use board default)
   */
  clearDeckDensity(boardId: string, deckId: string): void {
    const current = this.settings.get(boardId);
    if (!current?.deckOverrides) return;

    const { [deckId]: _, ...remaining } = current.deckOverrides;
    
    this.settings.set(boardId, {
      ...current,
      deckOverrides: remaining,
    });
    
    this.persist();
    this.notifyListeners();
  }

  /**
   * Get CSS variables for a board's density
   */
  getCSSVariables(boardId: string): Record<string, string> {
    const preset = this.getPreset(boardId);
    
    return {
      '--density-row-height': `${preset.rowHeight}px`,
      '--density-cell-padding': `${preset.cellPadding}px`,
      '--density-font-size': `${preset.fontSize}px`,
      '--density-section-spacing': `${preset.sectionSpacing}px`,
    };
  }

  /**
   * Apply density CSS variables to an element
   */
  applyCSSVariables(element: HTMLElement, boardId: string): void {
    const vars = this.getCSSVariables(boardId);
    
    for (const [key, value] of Object.entries(vars)) {
      element.style.setProperty(key, value);
    }
  }

  /**
   * Subscribe to density changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    
    const data = Array.from(this.settings.entries()).map(([id, settings]) => [id, settings]);
    localStorage.setItem('cardplay.visual-density.v1', JSON.stringify(data));
  }

  private load(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const data = localStorage.getItem('cardplay.visual-density.v1');
      if (!data) return;
      
      const entries = JSON.parse(data) as [string, BoardDensitySettings][];
      this.settings = new Map(entries);
    } catch (err) {
      console.warn('Failed to load visual density settings:', err);
    }
  }

  constructor() {
    this.load();
  }
}

let instance: VisualDensityManager | null = null;

/**
 * Get the global visual density manager
 */
export function getVisualDensityManager(): VisualDensityManager {
  if (!instance) {
    instance = new VisualDensityManager();
  }
  return instance;
}
