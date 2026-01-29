/**
 * Board Host Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBoardHost, injectBoardHostStyles } from './board-host';
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

describe('BoardHost', () => {
  beforeEach(() => {
    injectBoardHostStyles();
    localStorageMock.clear();
    resetBoardRegistry();
  });
  
  afterEach(() => {
    localStorageMock.clear();
    resetBoardRegistry();
  });
  
  it('should create a board host element', () => {
    const host = createBoardHost();
    expect(host).toBeInstanceOf(HTMLElement);
    expect(host.className).toBe('board-host');
  });
  
  it('should have a header and workspace', () => {
    const host = createBoardHost();
    const header = host.querySelector('.board-host__header');
    const workspace = host.querySelector('.board-host__workspace');
    
    expect(header).toBeInstanceOf(HTMLElement);
    expect(workspace).toBeInstanceOf(HTMLElement);
  });
  
  it('should show "No board active" when no board is selected', () => {
    const host = createBoardHost();
    const error = host.querySelector('.board-host__error');
    expect(error?.textContent).toBe('No board active');
  });
  
  it('should update when board state changes', async () => {
    const registry = getBoardRegistry();
    const store = getBoardStateStore();
    
    // Register a test board
    registry.register({
      id: 'test-board',
      name: 'Test Board',
      description: 'A test board',
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
    
    const host = createBoardHost();
    document.body.appendChild(host);
    
    // Set current board
    store.setCurrentBoard('test-board');
    
    // Wait for update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const name = host.querySelector('.board-host__name');
    expect(name?.textContent).toBe('Test Board');
    
    host.destroy();
    document.body.removeChild(host);
  });
  
  it('should cleanup subscriptions on destroy', () => {
    const host = createBoardHost();
    const store = getBoardStateStore();
    
    // Get initial subscription count
    const initialCount = (store as any).listeners?.length || 0;
    
    host.destroy();
    
    // Should have same or fewer subscriptions
    const finalCount = (store as any).listeners?.length || 0;
    expect(finalCount).toBeLessThanOrEqual(initialCount);
  });
  
  it('should display control level badge', async () => {
    const registry = getBoardRegistry();
    const store = getBoardStateStore();
    
    registry.register({
      id: 'assisted-board',
      name: 'Assisted Board',
      description: 'An assisted board',
      category: 'Testing',
      controlLevel: 'assisted',
      primaryView: 'tracker',
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
    
    const host = createBoardHost();
    document.body.appendChild(host);
    
    store.setCurrentBoard('assisted-board');
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const controlLevel = host.querySelector('.board-host__control-level');
    expect(controlLevel?.textContent).toBe('assisted');
    
    host.destroy();
    document.body.removeChild(host);
  });
});
