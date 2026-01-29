/**
 * Board Switcher Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBoardSwitcher, injectBoardSwitcherStyles } from './board-switcher';
import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry, resetBoardRegistry } from '../../boards/registry';

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

describe('BoardSwitcher', () => {
  beforeEach(() => {
    injectBoardSwitcherStyles();
    localStorageMock.clear();
    resetBoardRegistry();
    
    // Register some test boards
    const registry = getBoardRegistry();
    registry.register({
      id: 'board-1',
      name: 'Board One',
      description: 'First board',
      category: 'Testing',
      controlLevel: 'full-manual',
      primaryView: 'tracker',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
      layout: { panels: [] },
      decks: [],
    });
    
    registry.register({
      id: 'board-2',
      name: 'Board Two',
      description: 'Second board',
      category: 'Testing',
      controlLevel: 'assisted',
      primaryView: 'notation',
      compositionTools: {
        phraseDatabase: { enabled: true, mode: 'drag-drop' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
      layout: { panels: [] },
      decks: [],
    });
  });
  
  afterEach(() => {
    localStorageMock.clear();
    resetBoardRegistry();
    document.body.innerHTML = '';
  });
  
  it('should create a board switcher modal', () => {
    const switcher = createBoardSwitcher();
    expect(switcher).toBeInstanceOf(HTMLElement);
    expect(switcher.className).toBe('board-switcher-overlay');
  });
  
  it('should have search input', () => {
    const switcher = createBoardSwitcher();
    const input = switcher.querySelector('.board-switcher__search-input');
    expect(input).toBeInstanceOf(HTMLInputElement);
  });
  
  it('should show results', () => {
    const store = getBoardStateStore();
    store.addRecentBoard('board-1');
    store.addRecentBoard('board-2');
    
    const switcher = createBoardSwitcher();
    document.body.appendChild(switcher);
    
    const results = switcher.querySelectorAll('.board-switcher__result');
    expect(results.length).toBeGreaterThan(0);
  });
  
  it('should filter results on search', () => {
    const store = getBoardStateStore();
    store.addRecentBoard('board-1');
    store.addRecentBoard('board-2');
    
    const switcher = createBoardSwitcher();
    document.body.appendChild(switcher);
    
    const input = switcher.querySelector('.board-switcher__search-input') as HTMLInputElement;
    input.value = 'One';
    input.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
      const results = switcher.querySelectorAll('.board-switcher__result');
      const names = Array.from(results).map(r => r.querySelector('.board-switcher__result-name')?.textContent);
      expect(names).toContain('Board One');
      expect(names).not.toContain('Board Two');
    }, 0);
  });
  
  it('should toggle favorites', () => {
    const store = getBoardStateStore();
    store.addRecentBoard('board-1');
    
    const switcher = createBoardSwitcher();
    document.body.appendChild(switcher);
    
    const favoriteBtn = switcher.querySelector('[data-action="toggle-favorite"]') as HTMLButtonElement;
    expect(favoriteBtn).toBeInstanceOf(HTMLElement);
    
    favoriteBtn.click();
    
    const state = store.getState();
    expect(state.favoriteBoardIds).toContain('board-1');
  });
  
  it('should close on Escape', () => {
    let closed = false;
    const switcher = createBoardSwitcher({
      onClose: () => { closed = true; }
    });
    document.body.appendChild(switcher);
    
    const input = switcher.querySelector('.board-switcher__search-input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    
    expect(closed).toBe(true);
  });
  
  it('should close on outside click', () => {
    let closed = false;
    const switcher = createBoardSwitcher({
      onClose: () => { closed = true; }
    });
    document.body.appendChild(switcher);
    
    switcher.click();
    
    expect(closed).toBe(true);
  });
  
  it('should navigate with arrow keys', () => {
    const store = getBoardStateStore();
    store.addRecentBoard('board-1');
    store.addRecentBoard('board-2');
    
    const switcher = createBoardSwitcher();
    document.body.appendChild(switcher);
    
    const input = switcher.querySelector('.board-switcher__search-input') as HTMLInputElement;
    
    // Initial state: first result selected
    let selected = switcher.querySelector('.board-switcher__result--selected');
    expect(selected).toBeTruthy();
    
    // Press down arrow
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    
    setTimeout(() => {
      selected = switcher.querySelector('.board-switcher__result--selected');
      expect(selected).toBeTruthy();
    }, 0);
  });
});
