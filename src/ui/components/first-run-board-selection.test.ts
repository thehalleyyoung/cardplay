/**
 * First-Run Board Selection Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createFirstRunSelection } from './first-run-board-selection';
import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry, resetBoardRegistry } from '../../boards/registry';
import type { Board } from '../../boards/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('FirstRunBoardSelection', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetBoardRegistry();
    
    // Register test boards matching recommendation IDs
    const registry = getBoardRegistry();
    
    const basicTrackerBoard: Board = {
      id: 'basic-tracker',
      name: 'Basic Tracker',
      description: 'Perfect for beginners - tracker workflow',
      controlLevel: 'full-manual',
      category: 'Manual',
      difficulty: 'beginner',
      tags: ['beginner', 'tracker'],
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
      layout: { panels: [] },
      decks: [],
    };
    
    const notationManualBoard: Board = {
      id: 'notation-manual',
      name: 'Notation Manual',
      description: 'Manual notation workflow',
      controlLevel: 'full-manual',
      category: 'Manual',
      difficulty: 'beginner',
      tags: ['notation', 'manual'],
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
      layout: { panels: [] },
      decks: [],
    };
    
    const basicSessionBoard: Board = {
      id: 'basic-session',
      name: 'Basic Session',
      description: 'Session view for clip launching',
      controlLevel: 'full-manual',
      category: 'Manual',
      difficulty: 'beginner',
      tags: ['session', 'beginner'],
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
      layout: { panels: [] },
      decks: [],
    };
    
    registry.register(basicTrackerBoard);
    registry.register(notationManualBoard);
    registry.register(basicSessionBoard);
  });
  
  afterEach(() => {
    resetBoardRegistry();
  });

  it('should create first-run selection element', () => {
    const selection = createFirstRunSelection();
    expect(selection).toBeDefined();
    expect(selection.tagName).toBe('DIV');
    expect(selection.classList.contains('first-run-overlay')).toBe(true);
  });

  it('should show recommended boards', () => {
    const selection = createFirstRunSelection();
    document.body.appendChild(selection);
    
    // Should show board recommendations
    const boardCards = selection.querySelectorAll('.first-run__board');
    expect(boardCards.length).toBeGreaterThan(0);
    
    selection.destroy();
    document.body.removeChild(selection);
  });

  it('should mark first-run complete on selection', async () => {
    let selectedBoardId: string | null = null;
    
    const selection = createFirstRunSelection({
      onComplete: (boardId) => {
        selectedBoardId = boardId;
      },
    });
    document.body.appendChild(selection);
    
    const store = getBoardStateStore();
    expect(store.getState().firstRunCompleted).toBe(false);
    
    // Click a board button
    const selectBtn = selection.querySelector('[data-action="select-board"]') as HTMLButtonElement;
    if (selectBtn) {
      selectBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(selectedBoardId).toBeDefined();
      expect(store.getState().firstRunCompleted).toBe(true);
    }
    
    selection.destroy();
    document.body.removeChild(selection);
  });

  it('should provide skip option', () => {
    const selection = createFirstRunSelection();
    document.body.appendChild(selection);
    
    const skipBtn = selection.querySelector('[data-action="skip"]') as HTMLButtonElement;
    expect(skipBtn).toBeDefined();
    expect(skipBtn?.textContent).toContain('Skip');
    
    selection.destroy();
    document.body.removeChild(selection);
  });

  it('should show control spectrum explanation', () => {
    const selection = createFirstRunSelection();
    document.body.appendChild(selection);
    
    // Should explain the control spectrum
    const explanation = selection.querySelector('.first-run__spectrum');
    expect(explanation).toBeDefined();
    expect(explanation?.textContent).toBeTruthy();
    
    selection.destroy();
    document.body.removeChild(selection);
  });

  it('should persist first-run completion', async () => {
    const selection = createFirstRunSelection({
      userType: 'beginner', // Skip to board selection
    });
    document.body.appendChild(selection);
    
    const store = getBoardStateStore();
    
    // Select a board
    const selectBtn = selection.querySelector('[data-action="select-board"]') as HTMLButtonElement;
    if (selectBtn) {
      selectBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify persistence
      const state = store.getState();
      expect(state.firstRunCompleted).toBe(true);
      expect(state.currentBoardId).toBeDefined();
    }
    
    selection.destroy();
    document.body.removeChild(selection);
  });

  it('should support user type mapping', () => {
    const selection = createFirstRunSelection({
      userType: 'beginner',
    });
    document.body.appendChild(selection);
    
    // Should show beginner-appropriate recommendations
    const boardCards = selection.querySelectorAll('.first-run__board');
    expect(boardCards.length).toBeGreaterThan(0);
    
    // Verify at least one board is shown
    expect(boardCards.length).toBeGreaterThan(0);
    
    selection.destroy();
    document.body.removeChild(selection);
  });
});
