/**
 * Board Host Component
 * 
 * Mounts the active board workspace and manages board lifecycle.
 * Subscribes to BoardStateStore and re-renders on board changes.
 */

import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry } from '../../boards/registry';
import type { Board } from '../../boards/types';
import { ControlSpectrumBadge } from './control-spectrum-badge';
import { getModalRoot } from './modal-root';
import { createBoardSwitcher } from './board-switcher';
import { createBoardBrowser } from './board-browser';
import { createDeckInstances, registerStubFactories } from '../../boards/decks/deck-factories';
import { createDeckPanelHost, type DeckPanelHost } from './deck-panel-host';
import { getBoardContextStore } from '../../boards/context/store';

export interface BoardHostElement extends HTMLElement {
  destroy(): void;
}

export function createBoardHost(): BoardHostElement {
  const container = Object.assign(document.createElement('div'), {
    destroy: () => {}
  }) as BoardHostElement;
  container.className = 'board-host';
  
  const store = getBoardStateStore();
  const registry = getBoardRegistry();
  
  let currentBoard: Board | null = null;
  let unsubscribe: (() => void) | null = null;
  let controlBadge: ControlSpectrumBadge | null = null;
  let deckPanelHost: DeckPanelHost | null = null;
  
  // E020: Register stub factories for testing
  registerStubFactories();
  
  // Chrome header
  const header = document.createElement('div');
  header.className = 'board-host__header';
  container.appendChild(header);
  
  // Workspace slot (where decks/panels will be rendered in Phase E)
  const workspace = document.createElement('div');
  workspace.className = 'board-host__workspace';
  container.appendChild(workspace);
  
  function renderBoardChrome(board: Board | null) {
    if (controlBadge) {
      controlBadge.destroy();
      controlBadge = null;
    }
    
    if (!board) {
      header.innerHTML = `
        <div class="board-host__chrome">
          <span class="board-host__error">No board active</span>
        </div>
      `;
      return;
    }
    
    header.innerHTML = '';
    const chrome = document.createElement('div');
    chrome.className = 'board-host__chrome';
    
    const info = document.createElement('div');
    info.className = 'board-host__info';
    
    if (board.icon) {
      const icon = document.createElement('span');
      icon.className = 'board-host__icon';
      icon.textContent = board.icon;
      info.appendChild(icon);
    }
    
    const name = document.createElement('span');
    name.className = 'board-host__name';
    name.textContent = board.name;
    info.appendChild(name);
    
    controlBadge = new ControlSpectrumBadge({
      controlLevel: board.controlLevel,
      showLabel: true,
      size: 'small',
      interactive: false,
    });
    info.appendChild(controlBadge.getElement());
    
    chrome.appendChild(info);
    
    const actions = document.createElement('div');
    actions.className = 'board-host__actions';
    
    const browseBtn = document.createElement('button');
    browseBtn.className = 'board-host__btn';
    browseBtn.textContent = 'Browse Boards';
    browseBtn.title = 'Open board browser';
    browseBtn.onclick = () => openBoardBrowser();
    actions.appendChild(browseBtn);
    
    const switchBtn = document.createElement('button');
    switchBtn.className = 'board-host__btn board-host__btn--primary';
    switchBtn.textContent = 'Switch Board';
    switchBtn.title = 'Switch Board (Cmd+B)';
    switchBtn.onclick = () => openBoardSwitcher();
    actions.appendChild(switchBtn);
    
    chrome.appendChild(actions);
    header.appendChild(chrome);
  }
  
  function openBoardSwitcher() {
    const modalRoot = getModalRoot();
    const switcherElement = createBoardSwitcher({
      onClose: () => modalRoot.closeModal('board-switcher'),
    });
    
    modalRoot.openModal({
      id: 'board-switcher',
      element: switcherElement,
      closeOnEscape: true,
      closeOnBackdrop: true,
    });
  }
  
  function openBoardBrowser() {
    const modalRoot = getModalRoot();
    const browserElement = createBoardBrowser({
      onClose: () => modalRoot.closeModal('board-browser'),
    });
    
    modalRoot.openModal({
      id: 'board-browser',
      element: browserElement,
      closeOnEscape: true,
      closeOnBackdrop: true,
    });
  }
  
  function render() {
    const state = store.getState();
    const boardId = state.currentBoardId;
    
    if (boardId) {
      currentBoard = registry.get(boardId) || null;
    } else {
      currentBoard = null;
    }
    
    renderBoardChrome(currentBoard);
    
    // E020: Render decks/panels in workspace
    if (deckPanelHost) {
      deckPanelHost.destroy();
      deckPanelHost = null;
    }
    
    if (currentBoard) {
      // Get active context
      const contextStore = getBoardContextStore();
      const activeContext = contextStore.getState();
      
      // Create deck instances
      const instances = createDeckInstances(currentBoard, activeContext);
      
      // Create deck panel host
      deckPanelHost = createDeckPanelHost({
        board: currentBoard,
        instances,
        onDeckClose: (deckId) => {
          console.log(`Deck closed: ${deckId}`);
        },
      });
      
      workspace.innerHTML = '';
      workspace.appendChild(deckPanelHost.getElement());
    } else {
      workspace.innerHTML = `
        <div class="board-host__placeholder">
          <p>No board selected</p>
        </div>
      `;
    }
  }
  
  // Subscribe to store changes
  unsubscribe = store.subscribe(() => {
    render();
  });
  
  // Initial render
  render();
  
  // Keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      openBoardSwitcher();
    }
  }
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Cleanup
  container.destroy = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (controlBadge) {
      controlBadge.destroy();
      controlBadge = null;
    }
    if (deckPanelHost) {
      deckPanelHost.destroy();
      deckPanelHost = null;
    }
    document.removeEventListener('keydown', handleKeyDown);
  };
  
  return container;
}

// Inject styles
let stylesInjected = false;

export function injectBoardHostStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .board-host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    
    .board-host__header {
      flex-shrink: 0;
      border-bottom: 1px solid var(--border-color, #444);
      background: var(--surface-color, #2a2a2a);
    }
    
    .board-host__chrome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      gap: 1rem;
    }
    
    .board-host__info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .board-host__icon {
      font-size: 1.25rem;
    }
    
    .board-host__name {
      font-weight: 600;
      font-size: 1rem;
    }
    
    .board-host__control-level {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      background: var(--control-level-bg, #444);
      color: var(--control-level-fg, #fff);
    }
    
    .control-level--full-manual .board-host__control-level {
      background: #4a6fa5;
    }
    
    .control-level--manual-with-hints .board-host__control-level {
      background: #5a8fbb;
    }
    
    .control-level--assisted .board-host__control-level {
      background: #6aafcc;
    }
    
    .control-level--directed .board-host__control-level {
      background: #7acfdd;
    }
    
    .control-level--generative .board-host__control-level {
      background: #8aefee;
      color: #000;
    }
    
    .board-host__actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .board-host__btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border-color, #555);
      border-radius: 0.25rem;
      background: var(--button-bg, #333);
      color: var(--button-fg, #fff);
      cursor: pointer;
      font-size: 0.875rem;
    }
    
    .board-host__btn:hover {
      background: var(--button-hover-bg, #444);
    }
    
    .board-host__btn:active {
      background: var(--button-active-bg, #555);
    }
    
    .board-host__btn--primary {
      background: var(--primary-color, #4a90e2);
      border-color: var(--primary-color, #4a90e2);
    }
    
    .board-host__btn--primary:hover {
      background: var(--primary-hover, #357abd);
    }
    
    .board-host__btn--primary:active {
      background: var(--primary-active, #2a5a8a);
    }
    
    .board-host__workspace {
      flex: 1;
      overflow: auto;
      background: var(--workspace-bg, #1e1e1e);
    }
    
    .board-host__placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #999);
      gap: 0.5rem;
    }
    
    .board-host__error {
      color: var(--error-color, #ff6b6b);
    }
  `;
  
  document.head.appendChild(style);
}
