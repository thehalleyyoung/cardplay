/**
 * Board Browser (Full Library View)
 * 
 * Comprehensive board library with filtering and metadata.
 */

import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry } from '../../boards/registry';
import { switchBoard } from '../../boards/switching/switch-board';
import type { Board, ControlLevel, BoardDifficulty } from '../../boards/types';

export interface BoardBrowserOptions {
  onClose?: () => void;
  onSwitch?: (boardId: string) => void;
}

export function createBoardBrowser(options: BoardBrowserOptions = {}): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'board-browser-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'board-browser';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'board-browser-title');
  modal.setAttribute('aria-modal', 'true');
  overlay.appendChild(modal);
  
  const store = getBoardStateStore();
  const registry = getBoardRegistry();
  const state = store.getState();
  
  let previousFocus: HTMLElement | null = document.activeElement as HTMLElement;
  let filterControlLevel: ControlLevel | 'all' = 'all';
  let filterDifficulty: BoardDifficulty | 'all' = 'all';
  let searchQuery = '';
  
  function getFilteredBoards(): Map<string, Board[]> {
    let boards = registry.list();
    
    // Apply search
    if (searchQuery.trim()) {
      boards = registry.search(searchQuery);
    }
    
    // Apply control level filter
    if (filterControlLevel !== 'all') {
      boards = boards.filter(b => b.controlLevel === filterControlLevel);
    }
    
    // Apply difficulty filter
    if (filterDifficulty !== 'all') {
      boards = boards.filter(b => b.difficulty === filterDifficulty);
    }
    
    // Group by control level
    const grouped = new Map<string, Board[]>();
    for (const board of boards) {
      const category = board.controlLevel;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(board);
    }
    
    return grouped;
  }
  
  function toggleFavorite(boardId: string) {
    store.toggleFavorite(boardId);
    render();
  }
  
  function handleOpenBoard(boardId: string) {
    switchBoard(boardId, {
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
    const groupedBoards = getFilteredBoards();
    const isFavorite = (boardId: string) => state.favoriteBoardIds.includes(boardId);
    const isCurrent = (boardId: string) => boardId === state.currentBoardId;
    
    const controlLevelLabels: Record<ControlLevel, string> = {
      'full-manual': 'Manual',
      'manual-with-hints': 'Hints',
      'assisted': 'Assisted',
      'directed': 'Directed',
      'generative': 'Generative',
      'collaborative': 'Collaborative',
    };
    
    modal.innerHTML = `
      <div class="board-browser__header">
        <h2 id="board-browser-title" class="board-browser__title">Board Library</h2>
        <button class="board-browser__close" data-action="close" aria-label="Close">×</button>
      </div>
      
      <div class="board-browser__filters">
        <div class="board-browser__filter-group">
          <label>Control Level:</label>
          <select class="board-browser__select" data-filter="control-level">
            <option value="all" ${filterControlLevel === 'all' ? 'selected' : ''}>All</option>
            <option value="full-manual" ${filterControlLevel === 'full-manual' ? 'selected' : ''}>Manual</option>
            <option value="manual-with-hints" ${filterControlLevel === 'manual-with-hints' ? 'selected' : ''}>Hints</option>
            <option value="assisted" ${filterControlLevel === 'assisted' ? 'selected' : ''}>Assisted</option>
            <option value="directed" ${filterControlLevel === 'directed' ? 'selected' : ''}>Directed</option>
            <option value="generative" ${filterControlLevel === 'generative' ? 'selected' : ''}>Generative</option>
            <option value="collaborative" ${filterControlLevel === 'collaborative' ? 'selected' : ''}>Collaborative</option>
          </select>
        </div>
        
        <div class="board-browser__filter-group">
          <label>Difficulty:</label>
          <select class="board-browser__select" data-filter="difficulty">
            <option value="all" ${filterDifficulty === 'all' ? 'selected' : ''}>All</option>
            <option value="beginner" ${filterDifficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
            <option value="intermediate" ${filterDifficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
            <option value="advanced" ${filterDifficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
            <option value="expert" ${filterDifficulty === 'expert' ? 'selected' : ''}>Expert</option>
          </select>
        </div>
        
        <div class="board-browser__filter-group board-browser__filter-group--grow">
          <input
            type="text"
            class="board-browser__search"
            placeholder="Search boards..."
            value="${searchQuery}"
            data-filter="search"
          />
        </div>
      </div>
      
      <div class="board-browser__content">
        ${groupedBoards.size === 0 ? `
          <div class="board-browser__empty">No boards found</div>
        ` : Array.from(groupedBoards.entries()).map(([category, boards]) => `
          <div class="board-browser__category">
            <h3 class="board-browser__category-title">${controlLevelLabels[category as ControlLevel] || category}</h3>
            <div class="board-browser__boards">
              ${boards.map(board => `
                <div class="board-browser__board ${isCurrent(board.id) ? 'board-browser__board--current' : ''}">
                  <div class="board-browser__board-header">
                    ${board.icon ? `<span class="board-browser__board-icon">${board.icon}</span>` : ''}
                    <div class="board-browser__board-info">
                      <h4 class="board-browser__board-name">${board.name}</h4>
                      ${board.difficulty ? `<span class="board-browser__board-difficulty">${board.difficulty}</span>` : ''}
                    </div>
                    <button
                      class="board-browser__favorite ${isFavorite(board.id) ? 'board-browser__favorite--active' : ''}"
                      data-action="toggle-favorite"
                      data-board-id="${board.id}"
                      title="${isFavorite(board.id) ? 'Remove from favorites' : 'Add to favorites'}"
                    >
                      ${isFavorite(board.id) ? '★' : '☆'}
                    </button>
                  </div>
                  
                  <p class="board-browser__board-desc">${board.description || ''}</p>
                  
                  <div class="board-browser__board-meta">
                    <span class="board-browser__board-decks">${board.decks.length} decks</span>
                    ${board.tags ? `<span class="board-browser__board-tags">${board.tags.join(', ')}</span>` : ''}
                  </div>
                  
                  <div class="board-browser__board-actions">
                    <button
                      class="board-browser__btn board-browser__btn--primary"
                      data-action="open"
                      data-board-id="${board.id}"
                    >
                      ${isCurrent(board.id) ? 'Current' : 'Open'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Bind events
    modal.querySelectorAll('[data-filter]').forEach(input => {
      input.addEventListener('change', (e) => {
        const filterType = (input as HTMLElement).dataset.filter;
        const value = (e.target as HTMLInputElement | HTMLSelectElement).value;
        
        if (filterType === 'control-level') {
          filterControlLevel = value as ControlLevel | 'all';
        } else if (filterType === 'difficulty') {
          filterDifficulty = value as BoardDifficulty | 'all';
        } else if (filterType === 'search') {
          searchQuery = value;
        }
        
        render();
      });
      
      if (input.tagName === 'INPUT') {
        input.addEventListener('input', (e) => {
          searchQuery = (e.target as HTMLInputElement).value;
          render();
        });
      }
    });
    
    modal.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const boardId = (btn as HTMLElement).dataset.boardId;
        if (boardId) {
          toggleFavorite(boardId);
        }
      });
    });
    
    modal.querySelectorAll('[data-action="open"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const boardId = (btn as HTMLElement).dataset.boardId;
        if (boardId && !isCurrent(boardId)) {
          handleOpenBoard(boardId);
        }
      });
    });
    
    modal.querySelector('[data-action="close"]')?.addEventListener('click', close);
  }
  
  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });
  
  // Initial render
  render();
  
  return overlay;
}

// Inject styles
let stylesInjected = false;

export function injectBoardBrowserStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .board-browser-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      overflow: auto;
      padding: 2rem;
    }
    
    .board-browser {
      background: var(--surface-color, #2a2a2a);
      border-radius: 0.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      width: 100%;
      max-width: 1200px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .board-browser__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color, #444);
    }
    
    .board-browser__title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .board-browser__close {
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
    
    .board-browser__close:hover {
      background: var(--hover-bg, #444);
    }
    
    .board-browser__filters {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #444);
      flex-wrap: wrap;
    }
    
    .board-browser__filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .board-browser__filter-group--grow {
      flex: 1;
      min-width: 200px;
    }
    
    .board-browser__select,
    .board-browser__search {
      padding: 0.375rem 0.75rem;
      background: var(--input-bg, #1e1e1e);
      border: 1px solid var(--border-color, #555);
      border-radius: 0.25rem;
      color: var(--text-color, #fff);
    }
    
    .board-browser__search {
      width: 100%;
    }
    
    .board-browser__content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }
    
    .board-browser__category {
      margin-bottom: 2rem;
    }
    
    .board-browser__category-title {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--border-color, #444);
    }
    
    .board-browser__boards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .board-browser__board {
      background: var(--card-bg, #333);
      border: 1px solid var(--border-color, #444);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .board-browser__board--current {
      border-color: var(--accent-color, #4a90e2);
      border-width: 2px;
    }
    
    .board-browser__board-header {
      display: flex;
      align-items: start;
      gap: 0.75rem;
    }
    
    .board-browser__board-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .board-browser__board-info {
      flex: 1;
      min-width: 0;
    }
    
    .board-browser__board-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .board-browser__board-difficulty {
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      background: var(--badge-bg, #444);
      margin-top: 0.25rem;
      display: inline-block;
    }
    
    .board-browser__favorite {
      background: none;
      border: none;
      color: var(--text-muted, #999);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      flex-shrink: 0;
    }
    
    .board-browser__favorite:hover {
      color: var(--favorite-color, #ffd700);
    }
    
    .board-browser__favorite--active {
      color: var(--favorite-color, #ffd700);
    }
    
    .board-browser__board-desc {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-muted, #ccc);
      line-height: 1.4;
    }
    
    .board-browser__board-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-muted, #999);
    }
    
    .board-browser__board-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
    }
    
    .board-browser__btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color, #555);
      border-radius: 0.25rem;
      background: var(--button-bg, #444);
      color: var(--text-color, #fff);
      cursor: pointer;
      font-size: 0.875rem;
      flex: 1;
    }
    
    .board-browser__btn--primary {
      background: var(--primary-bg, #4a90e2);
      border-color: var(--primary-bg, #4a90e2);
    }
    
    .board-browser__btn:hover {
      opacity: 0.9;
    }
    
    .board-browser__empty {
      padding: 4rem;
      text-align: center;
      color: var(--text-muted, #999);
      font-size: 1.125rem;
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}
