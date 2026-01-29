/**
 * @fileoverview Visual Density Settings - J052, J053
 * 
 * Configurable visual density for tracker and session views.
 * Persisted per-board for optimal workflow customization.
 * 
 * @module @cardplay/ui/visual-density
 */

/**
 * Visual density options.
 * 
 * - compact: Tighter spacing, more content visible
 * - comfortable: Default spacing, balanced
 * - spacious: Wider spacing, easier targeting
 */
export type VisualDensity = 'compact' | 'comfortable' | 'spacious';

/**
 * Density configuration per view type.
 */
export interface DensityConfig {
  /** Row height in pixels */
  readonly rowHeight: number;
  
  /** Column padding in pixels */
  readonly columnPadding: number;
  
  /** Font size in pixels */
  readonly fontSize: number;
  
  /** Line height multiplier */
  readonly lineHeight: number;
  
  /** Cell padding in pixels */
  readonly cellPadding: number;
}

/**
 * Density presets for different views.
 */
export const DENSITY_PRESETS: Record<VisualDensity, {
  tracker: DensityConfig;
  session: DensityConfig;
  pianoRoll: DensityConfig;
  timeline: DensityConfig;
}> = {
  compact: {
    tracker: {
      rowHeight: 18,
      columnPadding: 4,
      fontSize: 11,
      lineHeight: 1.2,
      cellPadding: 2
    },
    session: {
      rowHeight: 32,
      columnPadding: 6,
      fontSize: 12,
      lineHeight: 1.3,
      cellPadding: 4
    },
    pianoRoll: {
      rowHeight: 12,
      columnPadding: 2,
      fontSize: 10,
      lineHeight: 1.2,
      cellPadding: 2
    },
    timeline: {
      rowHeight: 28,
      columnPadding: 8,
      fontSize: 11,
      lineHeight: 1.3,
      cellPadding: 4
    }
  },
  
  comfortable: {
    tracker: {
      rowHeight: 24,
      columnPadding: 8,
      fontSize: 13,
      lineHeight: 1.4,
      cellPadding: 4
    },
    session: {
      rowHeight: 44,
      columnPadding: 10,
      fontSize: 13,
      lineHeight: 1.4,
      cellPadding: 6
    },
    pianoRoll: {
      rowHeight: 16,
      columnPadding: 4,
      fontSize: 12,
      lineHeight: 1.3,
      cellPadding: 3
    },
    timeline: {
      rowHeight: 36,
      columnPadding: 12,
      fontSize: 13,
      lineHeight: 1.4,
      cellPadding: 6
    }
  },
  
  spacious: {
    tracker: {
      rowHeight: 32,
      columnPadding: 12,
      fontSize: 14,
      lineHeight: 1.6,
      cellPadding: 6
    },
    session: {
      rowHeight: 56,
      columnPadding: 14,
      fontSize: 14,
      lineHeight: 1.5,
      cellPadding: 8
    },
    pianoRoll: {
      rowHeight: 20,
      columnPadding: 6,
      fontSize: 13,
      lineHeight: 1.4,
      cellPadding: 4
    },
    timeline: {
      rowHeight: 44,
      columnPadding: 16,
      fontSize: 14,
      lineHeight: 1.5,
      cellPadding: 8
    }
  }
};

/**
 * Per-board density settings (persisted).
 */
export interface BoardDensitySettings {
  /** Board ID */
  readonly boardId: string;
  
  /** Global density setting for board */
  readonly globalDensity: VisualDensity;
  
  /** Per-view density overrides */
  readonly overrides?: {
    readonly tracker?: VisualDensity;
    readonly session?: VisualDensity;
    readonly pianoRoll?: VisualDensity;
    readonly timeline?: VisualDensity;
  };
}

/**
 * Storage key for density settings.
 */
const STORAGE_KEY = 'cardplay.density.v1';

/**
 * Visual density manager.
 * 
 * Manages density settings per board with localStorage persistence.
 * 
 * @example
 * ```typescript
 * const manager = VisualDensityManager.getInstance();
 * 
 * // Set board density
 * manager.setBoardDensity('basic-tracker', 'compact');
 * 
 * // Get density config
 * const config = manager.getConfig('basic-tracker', 'tracker');
 * trackerPanel.setRowHeight(config.rowHeight);
 * ```
 */
export class VisualDensityManager {
  private static instance: VisualDensityManager;
  
  private settings = new Map<string, BoardDensitySettings>();
  private listeners = new Set<() => void>();
  
  private constructor() {
    this.loadSettings();
  }
  
  static getInstance(): VisualDensityManager {
    if (!VisualDensityManager.instance) {
      VisualDensityManager.instance = new VisualDensityManager();
    }
    return VisualDensityManager.instance;
  }
  
  /**
   * Get density configuration for a board and view.
   * 
   * @param boardId - Board ID
   * @param viewType - View type
   * @returns Density configuration
   */
  getConfig(boardId: string, viewType: 'tracker' | 'session' | 'pianoRoll' | 'timeline'): DensityConfig {
    const settings = this.settings.get(boardId);
    if (!settings) {
      // Default to comfortable
      return DENSITY_PRESETS.comfortable[viewType];
    }
    
    // Check for view-specific override
    const override = settings.overrides?.[viewType];
    const density = override ?? settings.globalDensity;
    
    return DENSITY_PRESETS[density][viewType];
  }
  
  /**
   * Set global density for a board (J052).
   * 
   * @param boardId - Board ID
   * @param density - Density setting
   */
  setBoardDensity(boardId: string, density: VisualDensity): void {
    const existing = this.settings.get(boardId);
    
    const newSettings: BoardDensitySettings = existing?.overrides
      ? { boardId, globalDensity: density, overrides: existing.overrides }
      : { boardId, globalDensity: density };
    
    this.settings.set(boardId, newSettings);
    
    this.saveSettings();
    this.notifyListeners();
  }
  
  /**
   * Set density for a specific view in a board.
   * 
   * @param boardId - Board ID
   * @param viewType - View type
   * @param density - Density setting
   */
  setViewDensity(
    boardId: string,
    viewType: 'tracker' | 'session' | 'pianoRoll' | 'timeline',
    density: VisualDensity
  ): void {
    const existing = this.settings.get(boardId);
    const globalDensity = existing?.globalDensity ?? 'comfortable';
    
    this.settings.set(boardId, {
      boardId,
      globalDensity,
      overrides: {
        ...existing?.overrides,
        [viewType]: density
      }
    });
    
    this.saveSettings();
    this.notifyListeners();
  }
  
  /**
   * Get current density setting for a board.
   * 
   * @param boardId - Board ID
   * @returns Current density setting
   */
  getBoardDensity(boardId: string): VisualDensity {
    return this.settings.get(boardId)?.globalDensity ?? 'comfortable';
  }
  
  /**
   * Reset density to default for a board.
   * 
   * @param boardId - Board ID
   */
  resetBoardDensity(boardId: string): void {
    this.settings.delete(boardId);
    this.saveSettings();
    this.notifyListeners();
  }
  
  /**
   * Subscribe to density changes.
   * 
   * @param listener - Change listener
   * @returns Unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Apply density to CSS custom properties.
   * 
   * @param boardId - Board ID
   * @param viewType - View type
   * @param element - Target element
   */
  applyCSSVariables(
    boardId: string,
    viewType: 'tracker' | 'session' | 'pianoRoll' | 'timeline',
    element: HTMLElement
  ): void {
    const config = this.getConfig(boardId, viewType);
    
    element.style.setProperty('--row-height', `${config.rowHeight}px`);
    element.style.setProperty('--column-padding', `${config.columnPadding}px`);
    element.style.setProperty('--font-size', `${config.fontSize}px`);
    element.style.setProperty('--line-height', `${config.lineHeight}`);
    element.style.setProperty('--cell-padding', `${config.cellPadding}px`);
  }
  
  // ============================================================================
  // PRIVATE
  // ============================================================================
  
  private loadSettings(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return;
      
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        data.forEach(settings => {
          this.settings.set(settings.boardId, settings);
        });
      }
    } catch (error) {
      console.error('Failed to load density settings:', error);
    }
  }
  
  private saveSettings(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const data = Array.from(this.settings.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save density settings:', error);
    }
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

/**
 * Get the visual density manager singleton.
 */
export function getVisualDensityManager(): VisualDensityManager {
  return VisualDensityManager.getInstance();
}

/**
 * Hook for reactive density updates.
 * 
 * @param boardId - Board ID
 * @param viewType - View type
 * @returns Current density config
 */
export function useDensityConfig(
  boardId: string,
  viewType: 'tracker' | 'session' | 'pianoRoll' | 'timeline'
): DensityConfig {
  const manager = getVisualDensityManager();
  return manager.getConfig(boardId, viewType);
}
