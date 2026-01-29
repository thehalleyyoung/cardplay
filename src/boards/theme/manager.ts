/**
 * @fileoverview Board Theme Manager (J037-J039)
 * 
 * Manages theme variants and settings per board.
 * 
 * @module @cardplay/boards/theme/manager
 */

export type ThemeVariant = 'dark' | 'light' | 'high-contrast';

export interface BoardThemeSettings {
  boardId: string;
  variant: ThemeVariant;
  showControlIndicators: boolean;
  customColors?: Record<string, string>;
}

/**
 * Theme manager for per-board theme configuration
 */
export class BoardThemeManager {
  private settings: Map<string, BoardThemeSettings> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Get theme variant for a board
   * J037: Theme picker persisted per board
   */
  getThemeVariant(boardId: string): ThemeVariant {
    return this.settings.get(boardId)?.variant ?? 'dark';
  }

  /**
   * Set theme variant for a board
   * J038: Persist theme choice per board
   */
  setThemeVariant(boardId: string, variant: ThemeVariant): void {
    const current = this.settings.get(boardId) ?? {
      boardId,
      variant,
      showControlIndicators: true,
    };
    
    this.settings.set(boardId, { ...current, variant });
    this.persist();
    this.notifyListeners();
  }

  /**
   * Get whether to show control level indicators
   */
  getShowControlIndicators(boardId: string): boolean {
    return this.settings.get(boardId)?.showControlIndicators ?? true;
  }

  /**
   * Set whether to show control level indicators
   */
  setShowControlIndicators(boardId: string, show: boolean): void {
    const current = this.settings.get(boardId) ?? {
      boardId,
      variant: 'dark',
      showControlIndicators: show,
    };
    
    this.settings.set(boardId, { ...current, showControlIndicators: show });
    this.persist();
    this.notifyListeners();
  }

  /**
   * Get custom colors for a board
   */
  getCustomColors(boardId: string): Record<string, string> | undefined {
    return this.settings.get(boardId)?.customColors;
  }

  /**
   * Set custom colors for a board
   */
  setCustomColors(boardId: string, colors: Record<string, string>): void {
    const current = this.settings.get(boardId) ?? {
      boardId,
      variant: 'dark',
      showControlIndicators: true,
    };
    
    this.settings.set(boardId, { ...current, customColors: colors });
    this.persist();
    this.notifyListeners();
  }

  /**
   * Subscribe to theme changes
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
    
    const data = Array.from(this.settings.entries());
    localStorage.setItem('cardplay.board-themes.v1', JSON.stringify(data));
  }

  private load(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const data = localStorage.getItem('cardplay.board-themes.v1');
      if (!data) return;
      
      const entries = JSON.parse(data) as [string, BoardThemeSettings][];
      this.settings = new Map(entries);
    } catch (err) {
      console.warn('Failed to load board theme settings:', err);
    }
  }

  constructor() {
    this.load();
  }
}

let instance: BoardThemeManager | null = null;

/**
 * Get the global board theme manager
 */
export function getBoardThemeManager(): BoardThemeManager {
  if (!instance) {
    instance = new BoardThemeManager();
  }
  return instance;
}
