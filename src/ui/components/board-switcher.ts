/**
 * Board Switcher Modal (Cmd+B)
 * 
 * Quick-switch modal for discovering and switching between boards.
 * Shows recent boards, favorites, and search functionality.
 */

import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry } from '../../boards/registry';
import { switchBoard } from '../../boards/switching/switch-board';
import type { Board } from '../../boards/types';
import { getUIEventBus } from '../ui-event-bus';

export interface BoardSwitcherOptions {
  onClose?: () => void;
  onSwitch?: (boardId: string) => void;
}

export function createBoardSwitcher(options: BoardSwitcherOptions = {}): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'board-switcher-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'board-switcher';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'board-switcher-title');
  modal.setAttribute('aria-modal', 'true');
  overlay.appendChild(modal);
  
  const store = getBoardStateStore();
  const registry = getBoardRegistry();
  const state = store.getState();
  
  let searchQuery = '';
  let selectedIndex = 0;
  let results: Board[] = [];
  let previousFocus: HTMLElement | null = document.activeElement as HTMLElement;
  
  // Options
  let resetLayout = false;
  let resetDecks = false;
  
  function updateResults() {
    if (searchQuery.trim()) {
      results = registry.search(searchQuery);
    } else {
      // Show recents + favorites
      const recentIds = state.recentBoardIds.slice(0, 5);
      const favoriteIds = state.favoriteBoardIds;
      
      const recentBoards = recentIds.map(id => registry.get(id)).filter(Boolean) as Board[];
      const favoriteBoards = favoriteIds.map(id => registry.get(id)).filter(Boolean) as Board[];
      
      // Combine and dedupe
      const seen = new Set<string>();
      results = [...favoriteBoards, ...recentBoards].filter(board => {
        if (seen.has(board.id)) return false;
        seen.add(board.id);
        return true;
      });
    }
    
    selectedIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));
    render();
  }
  
  function toggleFavorite(boardId: string) {
    store.toggleFavorite(boardId);
    updateResults();
  }
  
  function handleSwitch(boardId: string) {
    switchBoard(boardId, {
      resetLayout,
      resetDecks,
      preserveActiveContext: true,
      preserveTransport: true,
    });
    
    if (options.onSwitch) {
      options.onSwitch(boardId);
    }
    
    close();
  }
  
  function close() {
    overlay.remove();
    
    if (previousFocus) {
      previousFocus.focus();
    }
    
    if (options.onClose) {
      options.onClose();
    }
  }
  
  function render() {
    const isFavorite = (boardId: string) => state.favoriteBoardIds.includes(boardId);
    
    modal.innerHTML = `
      <div class="board-switcher__header">
        <h2 id="board-switcher-title" class="board-switcher__title">Switch Board</h2>
        <button class="board-switcher__close" data-action="close" aria-label="Close">×</button>
      </div>
      
      <div class="board-switcher__search">
        <input
          type="text"
          class="board-switcher__search-input"
          placeholder="Search boards..."
          value="${searchQuery}"
          aria-label="Search boards"
        />
      </div>
      
      <div class="board-switcher__results" role="listbox" aria-label="Board results">
        ${results.length === 0 ? `
          <div class="board-switcher__empty">
            ${searchQuery ? 'No boards found' : 'No recent or favorite boards'}
          </div>
        ` : results.map((board, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = board.id === state.currentBoardId;
          const favorite = isFavorite(board.id);
          
          return `
            <div
              class="board-switcher__result ${isSelected ? 'board-switcher__result--selected' : ''} ${isCurrent ? 'board-switcher__result--current' : ''}"
              data-board-id="${board.id}"
              data-index="${index}"
              role="option"
              aria-selected="${isSelected}"
            >
              <div class="board-switcher__result-info">
                ${board.icon ? `<span class="board-switcher__icon">${board.icon}</span>` : ''}
                <div class="board-switcher__result-text">
                  <div class="board-switcher__result-name">${board.name}</div>
                  <div class="board-switcher__result-desc">${board.description || ''}</div>
                </div>
              </div>
              <div class="board-switcher__result-actions">
                <button
                  class="board-switcher__favorite ${favorite ? 'board-switcher__favorite--active' : ''}"
                  data-action="toggle-favorite"
                  data-board-id="${board.id}"
                  aria-label="${favorite ? 'Remove from favorites' : 'Add to favorites'}"
                  title="${favorite ? 'Remove from favorites' : 'Add to favorites'}"
                >
                  ${favorite ? '★' : '☆'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="board-switcher__options">
        <label class="board-switcher__option">
          <input type="checkbox" ${resetLayout ? 'checked' : ''} data-option="reset-layout" />
          <span>Reset layout on switch</span>
        </label>
        <label class="board-switcher__option">
          <input type="checkbox" ${resetDecks ? 'checked' : ''} data-option="reset-decks" />
          <span>Reset deck tabs</span>
        </label>
      </div>
      
      <div class="board-switcher__footer">
        <kbd>↑/↓</kbd> Navigate
        <kbd>Enter</kbd> Switch
        <kbd>Esc</kbd> Close
      </div>
    `;
    
    // Bind events
    const searchInput = modal.querySelector('.board-switcher__search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.addEventListener('input', (e) => {
        searchQuery = (e.target as HTMLInputElement).value;
        selectedIndex = 0;
        updateResults();
      });
      
      searchInput.addEventListener('keydown', handleKeyDown);
    }
    
    modal.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const boardId = (btn as HTMLElement).dataset.boardId;
        if (boardId) {
          toggleFavorite(boardId);
        }
      });
    });
    
    modal.querySelectorAll('[data-board-id]').forEach(result => {
      if (result.hasAttribute('data-index')) {
        result.addEventListener('click', () => {
          const boardId = (result as HTMLElement).dataset.boardId;
          if (boardId) {
            handleSwitch(boardId);
          }
        });
      }
    });
    
    modal.querySelector('[data-action="close"]')?.addEventListener('click', close);
    
    modal.querySelectorAll('[data-option]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const option = (checkbox as HTMLElement).dataset.option;
        const checked = (e.target as HTMLInputElement).checked;
        if (option === 'reset-layout') resetLayout = checked;
        if (option === 'reset-decks') resetDecks = checked;
      });
    });
    
    // Focus trap
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 1) {
      const firstFocusable = focusableElements[0]!;
      const lastFocusable = focusableElements[focusableElements.length - 1]!;
      
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable.focus();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable.focus();
            }
          }
        }
      });
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        render();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        render();
        break;
        
      case 'Enter':
        e.preventDefault();
        const selectedBoard = results[selectedIndex];
        if (selectedBoard) {
          handleSwitch(selectedBoard.id);
        }
        break;
    }
  }
  
  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });
  
  // Initial render
  updateResults();
  
  return overlay;
}

/**
 * Initialize board switcher to listen for keyboard shortcuts (C051)
 */
export function initBoardSwitcher(): () => void {
  const eventBus = getUIEventBus();
  let currentSwitcher: HTMLElement | null = null;
  
  const unsubOpen = eventBus.on('board-switcher:open', () => {
    if (!currentSwitcher) {
      currentSwitcher = createBoardSwitcher({
        onClose: () => {
          currentSwitcher = null;
        },
      });
      document.body.appendChild(currentSwitcher);
    }
  });
  
  const unsubClose = eventBus.on('board-switcher:close', () => {
    if (currentSwitcher) {
      currentSwitcher.remove();
      currentSwitcher = null;
    }
  });
  
  return () => {
    unsubOpen();
    unsubClose();
  };
}

// Inject styles
let stylesInjected = false;

export function injectBoardSwitcherStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .board-switcher-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    
    .board-switcher {
      background: var(--surface-color, #2a2a2a);
      border-radius: 0.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .board-switcher__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color, #444);
    }
    
    .board-switcher__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .board-switcher__close {
      background: none;
      border: none;
      color: var(--text-color, #fff);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
    }
    
    .board-switcher__close:hover {
      background: var(--hover-bg, #444);
    }
    
    .board-switcher__search {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color, #444);
    }
    
    .board-switcher__search-input {
      width: 100%;
      padding: 0.5rem;
      background: var(--input-bg, #1e1e1e);
      border: 1px solid var(--border-color, #555);
      border-radius: 0.25rem;
      color: var(--text-color, #fff);
      font-size: 1rem;
    }
    
    .board-switcher__search-input:focus {
      outline: 2px solid var(--focus-color, #4a90e2);
      outline-offset: 0;
    }
    
    .board-switcher__results {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }
    
    .board-switcher__result {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border-radius: 0.25rem;
      cursor: pointer;
      gap: 0.5rem;
    }
    
    .board-switcher__result:hover {
      background: var(--hover-bg, #333);
    }
    
    .board-switcher__result--selected {
      background: var(--selected-bg, #444);
    }
    
    .board-switcher__result--current {
      border-left: 3px solid var(--accent-color, #4a90e2);
    }
    
    .board-switcher__result-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }
    
    .board-switcher__icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .board-switcher__result-text {
      flex: 1;
      min-width: 0;
    }
    
    .board-switcher__result-name {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .board-switcher__result-desc {
      font-size: 0.875rem;
      color: var(--text-muted, #999);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .board-switcher__result-actions {
      display: flex;
      gap: 0.25rem;
    }
    
    .board-switcher__favorite {
      background: none;
      border: none;
      color: var(--text-muted, #999);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
    }
    
    .board-switcher__favorite:hover {
      color: var(--favorite-color, #ffd700);
    }
    
    .board-switcher__favorite--active {
      color: var(--favorite-color, #ffd700);
    }
    
    .board-switcher__empty {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted, #999);
    }
    
    .board-switcher__options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid var(--border-color, #444);
      font-size: 0.875rem;
    }
    
    .board-switcher__option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    
    .board-switcher__footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--border-color, #444);
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-muted, #999);
    }
    
    .board-switcher__footer kbd {
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      background: var(--kbd-bg, #333);
      border: 1px solid var(--kbd-border, #555);
      font-family: monospace;
      font-size: 0.75rem;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .board-switcher__modal {
        animation: none;
      }
    }
  `;
  
  document.head.appendChild(style);
}
