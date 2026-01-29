/**
 * @fileoverview Board Settings Store (G019-G020)
 * 
 * Manages per-board settings with persistence to localStorage.
 * Settings like harmony colors, roman numerals, visual density, etc.
 * 
 * @module @cardplay/boards/settings/store
 */

import type { BoardSettings, HarmonySettings } from './types';
import { DEFAULT_HARMONY_SETTINGS, DEFAULT_VISUAL_DENSITY, DEFAULT_GENERATOR_SETTINGS } from './types';

const STORAGE_KEY = 'cardplay.boardSettings.v1';

/**
 * Checks if localStorage is available (guards against test environment)
 */
function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

const STORAGE_AVAILABLE = isStorageAvailable();

/**
 * In-memory cache of board settings
 */
const settingsCache = new Map<string, BoardSettings>();

/**
 * Settings change listeners
 */
type SettingsListener = (boardId: string, settings: BoardSettings) => void;
const listeners = new Set<SettingsListener>();

/**
 * Loads all board settings from localStorage
 */
function loadFromStorage(): Map<string, BoardSettings> {
  if (!STORAGE_AVAILABLE) return new Map();
  
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return new Map();
    
    const data = JSON.parse(json) as Record<string, BoardSettings>;
    return new Map(Object.entries(data));
  } catch (error) {
    console.warn('Failed to load board settings:', error);
    return new Map();
  }
}

/**
 * Saves all board settings to localStorage
 */
function saveToStorage(): void {
  if (!STORAGE_AVAILABLE) return;
  
  try {
    const data = Object.fromEntries(settingsCache.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save board settings:', error);
  }
}

/**
 * Notifies all listeners of a settings change
 */
function notifyListeners(boardId: string, settings: BoardSettings): void {
  listeners.forEach(listener => {
    try {
      listener(boardId, settings);
    } catch (error) {
      console.error('Settings listener error:', error);
    }
  });
}

/**
 * Board Settings Store API
 */
export const BoardSettingsStore = {
  /**
   * Gets settings for a board (creates defaults if not found)
   */
  getSettings(boardId: string): BoardSettings {
    // Initialize cache if empty
    if (settingsCache.size === 0) {
      const loaded = loadFromStorage();
      loaded.forEach((value, key) => settingsCache.set(key, value));
    }
    
    // Return cached or create default
    let settings = settingsCache.get(boardId);
    if (!settings) {
      settings = {
        boardId,
        harmony: { ...DEFAULT_HARMONY_SETTINGS },
        visualDensity: { ...DEFAULT_VISUAL_DENSITY },
        generator: { ...DEFAULT_GENERATOR_SETTINGS }
      };
      settingsCache.set(boardId, settings);
    }
    
    return settings;
  },
  
  /**
   * Updates settings for a board
   */
  updateSettings(boardId: string, partial: Partial<Omit<BoardSettings, 'boardId'>>): void {
    const current = this.getSettings(boardId);
    const updated: BoardSettings = {
      ...current,
      ...partial,
      boardId // Ensure boardId is not overwritten
    };
    
    settingsCache.set(boardId, updated);
    saveToStorage();
    notifyListeners(boardId, updated);
  },
  
  /**
   * Updates harmony settings for a board (G019-G020)
   */
  updateHarmonySettings(boardId: string, partial: Partial<HarmonySettings>): void {
    const current = this.getSettings(boardId);
    const updated: BoardSettings = {
      ...current,
      harmony: {
        ...current.harmony,
        ...partial
      } as HarmonySettings
    };
    
    settingsCache.set(boardId, updated);
    saveToStorage();
    notifyListeners(boardId, updated);
  },
  
  /**
   * Toggles harmony colors on/off (G019)
   */
  toggleHarmonyColors(boardId: string): boolean {
    const current = this.getSettings(boardId);
    const newValue = !current.harmony?.showHarmonyColors;
    
    this.updateHarmonySettings(boardId, { showHarmonyColors: newValue });
    return newValue;
  },
  
  /**
   * Toggles roman numerals on/off (G020)
   */
  toggleRomanNumerals(boardId: string): boolean {
    const current = this.getSettings(boardId);
    const newValue = !current.harmony?.showRomanNumerals;
    
    this.updateHarmonySettings(boardId, { showRomanNumerals: newValue });
    return newValue;
  },
  
  /**
   * Sets the current key for a board
   */
  setCurrentKey(boardId: string, key: string | null): void {
    this.updateHarmonySettings(boardId, { currentKey: key });
  },
  
  /**
   * Sets the current chord for a board
   */
  setCurrentChord(boardId: string, chord: string | null): void {
    this.updateHarmonySettings(boardId, { currentChord: chord });
  },
  
  /**
   * Subscribes to settings changes
   */
  subscribe(listener: SettingsListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  
  /**
   * Resets settings for a board to defaults
   */
  resetSettings(boardId: string): void {
    settingsCache.delete(boardId);
    saveToStorage();
    notifyListeners(boardId, this.getSettings(boardId));
  },
  
  /**
   * Clears all settings (for testing)
   */
  clearAll(): void {
    settingsCache.clear();
    if (STORAGE_AVAILABLE) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

/**
 * Singleton getter for convenience
 */
export function getBoardSettingsStore() {
  return BoardSettingsStore;
}

// ============================================================================
// CONVENIENCE EXPORTS (G019-G020)
// ============================================================================

/**
 * Gets settings for a board
 */
export function getBoardSettings(boardId: string): BoardSettings {
  return BoardSettingsStore.getSettings(boardId);
}

/**
 * Updates harmony settings for a board
 */
export function updateHarmonySettings(boardId: string, partial: Partial<HarmonySettings>): void {
  BoardSettingsStore.updateHarmonySettings(boardId, partial);
}

/**
 * Subscribes to board settings changes
 */
export function subscribeBoardSettings(listener: SettingsListener): () => void {
  return BoardSettingsStore.subscribe(listener);
}

/**
 * Clear all settings (for testing)
 */
export function clearAllSettings(): void {
  BoardSettingsStore.clearAll();
}
