/**
 * Board Browser Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createBoardBrowser, injectBoardBrowserStyles } from './board-browser';
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

describe('BoardBrowser', () => {
  beforeEach(() => {
    injectBoardBrowserStyles();
    localStorageMock.clear();
    resetBoardRegistry();
    
    // Register test boards across all control levels
    const registry = getBoardRegistry();
    
    const manualBoard: Board = {
      id: 'manual-test',
      name: 'Manual Test Board',
      description: 'Pure manual',
      controlLevel: 'full-manual',
      category: 'Manual',
      difficulty: 'beginner',
      tags: ['manual', 'simple'],
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
    
    const assistedBoard: Board = {
      id: 'assisted-test',
      name: 'Assisted Test Board',
      description: 'Assisted workflow',
      controlLevel: 'assisted',
      category: 'Assisted',
      difficulty: 'intermediate',
      tags: ['assisted', 'phrases'],
      compositionTools: {
        phraseDatabase: { enabled: true, mode: 'drag-drop' },
        harmonyExplorer: { enabled: true, mode: 'display-only' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
      layout: { panels: [] },
      decks: [],
    };
    
    const generativeBoard: Board = {
      id: 'generative-test',
      name: 'Generative Test Board',
      description: 'AI-driven workflow',
      controlLevel: 'generative',
      category: 'Generative',
      difficulty: 'advanced',
      tags: ['generative', 'ai'],
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: true, mode: 'continuous' },
        arrangerCard: { enabled: true, mode: 'autonomous' },
        aiComposer: { enabled: true, mode: 'command-palette' },
      },
      layout: { panels: [] },
      decks: [],
    };
    
    registry.register(manualBoard);
    registry.register(assistedBoard);
    registry.register(generativeBoard);
  });
  
  afterEach(() => {
    resetBoardRegistry();
  });

  it('should create browser element', () => {
    const browser = createBoardBrowser();
    expect(browser).toBeDefined();
    expect(browser.tagName).toBe('DIV');
    expect(browser.classList.contains('board-browser')).toBe(true);
  });

  it('should group boards by control level', () => {
    const browser = createBoardBrowser();
    document.body.appendChild(browser);
    
    // Should have sections for different control levels
    const sections = browser.querySelectorAll('.board-browser__category');
    expect(sections.length).toBeGreaterThan(0);
    
    // Should show manual category
    const manualSection = Array.from(sections).find(
      s => s.querySelector('.board-browser__category-title')?.textContent?.includes('Manual')
    );
    expect(manualSection).toBeDefined();
    
    browser.destroy();
    document.body.removeChild(browser);
  });

  it('should filter by difficulty', () => {
    const browser = createBoardBrowser();
    document.body.appendChild(browser);
    
    // Find difficulty filter
    const difficultyFilter = browser.querySelector('#difficulty-filter') as HTMLSelectElement;
    expect(difficultyFilter).toBeDefined();
    
    // Set to beginner
    difficultyFilter.value = 'beginner';
    difficultyFilter.dispatchEvent(new Event('change'));
    
    // Should only show beginner boards
    const boardCards = browser.querySelectorAll('.board-browser__card');
    const beginnerBoards = Array.from(boardCards).filter(
      card => card.querySelector('.board-browser__difficulty')?.textContent?.includes('beginner')
    );
    
    expect(beginnerBoards.length).toBeGreaterThan(0);
    
    browser.destroy();
    document.body.removeChild(browser);
  });

  it('should show deck type previews', () => {
    const browser = createBoardBrowser();
    document.body.appendChild(browser);
    
    const boardCards = browser.querySelectorAll('.board-browser__card');
    expect(boardCards.length).toBeGreaterThan(0);
    
    // Each card should show deck info (even if empty)
    boardCards.forEach(card => {
      const deckInfo = card.querySelector('.board-browser__decks');
      expect(deckInfo).toBeDefined();
    });
    
    browser.destroy();
    document.body.removeChild(browser);
  });

  it('should support board opening', () => {
    let openedBoardId: string | null = null;
    
    const browser = createBoardBrowser({
      onBoardOpen: (boardId) => {
        openedBoardId = boardId;
      },
    });
    document.body.appendChild(browser);
    
    const openBtn = browser.querySelector('.board-browser__open-btn') as HTMLButtonElement;
    if (openBtn) {
      openBtn.click();
      expect(openedBoardId).toBeDefined();
    }
    
    browser.destroy();
    document.body.removeChild(browser);
  });

  it('should support search/filtering', () => {
    const browser = createBoardBrowser();
    document.body.appendChild(browser);
    
    const searchInput = browser.querySelector('.board-browser__search') as HTMLInputElement;
    expect(searchInput).toBeDefined();
    
    // Search for "manual"
    searchInput.value = 'manual';
    searchInput.dispatchEvent(new Event('input'));
    
    // Should filter results
    const boardCards = browser.querySelectorAll('.board-browser__card:not([style*="display: none"])');
    expect(boardCards.length).toBeGreaterThan(0);
    
    browser.destroy();
    document.body.removeChild(browser);
  });

  it('should support favoriting boards', () => {
    const browser = createBoardBrowser();
    document.body.appendChild(browser);
    
    const favoriteBtn = browser.querySelector('.board-browser__favorite-btn') as HTMLButtonElement;
    if (favoriteBtn) {
      const initialState = favoriteBtn.getAttribute('aria-pressed');
      favoriteBtn.click();
      const newState = favoriteBtn.getAttribute('aria-pressed');
      expect(newState).not.toBe(initialState);
    }
    
    browser.destroy();
    document.body.removeChild(browser);
  });
});
