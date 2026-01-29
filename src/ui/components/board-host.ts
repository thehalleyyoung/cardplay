/**
 * Board Host Component
 * 
 * Mounts the active board workspace and manages board lifecycle.
 * Subscribes to BoardStateStore and re-renders on board changes.
 * Enhanced with beautiful visual effects and smooth animations.
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
import { fadeIn, duration } from '../animations';
import { shadows } from '../visual-effects';

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
    
    // Add subtle hover effect to button
    browseBtn.style.transition = 'all 0.2s ease';
    browseBtn.addEventListener('mouseenter', () => {
      browseBtn.style.transform = 'translateY(-1px)';
      browseBtn.style.boxShadow = shadows.sm;
    });
    browseBtn.addEventListener('mouseleave', () => {
      browseBtn.style.transform = 'translateY(0)';
      browseBtn.style.boxShadow = 'none';
    });
    
    actions.appendChild(browseBtn);
    
    const switchBtn = document.createElement('button');
    switchBtn.className = 'board-host__btn board-host__btn--primary';
    switchBtn.textContent = 'Switch Board';
    switchBtn.title = 'Switch Board (Cmd+B)';
    switchBtn.onclick = () => openBoardSwitcher();
    
    // Add subtle hover effect to primary button
    switchBtn.style.transition = 'all 0.2s ease';
    switchBtn.addEventListener('mouseenter', () => {
      switchBtn.style.transform = 'translateY(-1px)';
      switchBtn.style.boxShadow = shadows.md;
    });
    switchBtn.addEventListener('mouseleave', () => {
      switchBtn.style.transform = 'translateY(0)';
      switchBtn.style.boxShadow = shadows.sm;
    });
    
    actions.appendChild(switchBtn);
    
    chrome.appendChild(actions);
    header.appendChild(chrome);
    
    // Animate header entrance
    fadeIn(header, duration.normal);
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
    
    // Check if board actually changed
    const newBoard = boardId ? registry.get(boardId) : null;
    const boardChanged = currentBoard?.id !== newBoard?.id;
    
    if (newBoard) {
      currentBoard = newBoard;
    } else {
      currentBoard = null;
    }
    
    renderBoardChrome(currentBoard);
    
    // C076: Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const transitionMs = prefersReducedMotion ? 0 : 200;
    
    // E020: Render decks/panels in workspace with transition
    if (deckPanelHost && boardChanged) {
      // C076: Fade out old board before destroying (if transitions enabled)
      if (transitionMs > 0) {
        workspace.style.opacity = '0';
        workspace.style.transition = `opacity ${transitionMs}ms ease-out`;
      }
      
      setTimeout(() => {
        if (deckPanelHost) {
          deckPanelHost.destroy();
          deckPanelHost = null;
        }
        
        renderNewBoard(transitionMs);
      }, transitionMs);
    } else if (!deckPanelHost) {
      renderNewBoard(transitionMs);
    }
    
    function renderNewBoard(durationMs: number) {
      if (currentBoard) {
        // Get active context
        const contextStore = getBoardContextStore();
        const activeContext = contextStore.getContext();
        
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
        
        // C076: Fade in new board (respecting reduced motion)
        if (durationMs > 0) {
          workspace.style.opacity = '0';
          requestAnimationFrame(() => {
            workspace.style.transition = `opacity ${durationMs}ms ease-in`;
            workspace.style.opacity = '1';
          });
        } else {
          workspace.style.opacity = '1';
        }
      } else {
        workspace.innerHTML = `
          <div class="board-host__placeholder">
            <p>No board selected</p>
          </div>
        `;
        workspace.style.opacity = '1';
      }
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
      background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
    }
    
    .board-host__header {
      flex-shrink: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(42, 42, 42, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .board-host__chrome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      gap: 1rem;
    }
    
    .board-host__info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .board-host__icon {
      font-size: 1.5rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    
    .board-host__name {
      font-weight: 600;
      font-size: 1.125rem;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .board-host__control-level {
      font-size: 0.75rem;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      background: linear-gradient(135deg, #4a6fa5 0%, #3a5f95 100%);
      color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    
    .control-level--full-manual .board-host__control-level {
      background: linear-gradient(135deg, #4a6fa5 0%, #3a5f95 100%);
    }
    
    .control-level--manual-with-hints .board-host__control-level {
      background: linear-gradient(135deg, #5a8fbb 0%, #4a7fab 100%);
    }
    
    .control-level--assisted .board-host__control-level {
      background: linear-gradient(135deg, #6aafcc 0%, #5a9fbc 100%);
    }
    
    .control-level--directed .board-host__control-level {
      background: linear-gradient(135deg, #7acfdd 0%, #6abfcd 100%);
    }
    
    .control-level--generative .board-host__control-level {
      background: linear-gradient(135deg, #8aefee 0%, #7adfde 100%);
      color: #000;
    }
    
    .board-host__actions {
      display: flex;
      gap: 0.625rem;
    }
    
    .board-host__btn {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: rgba(51, 51, 51, 0.8);
      color: #e0e0e0;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    
    .board-host__btn:hover {
      background: rgba(68, 68, 68, 0.9);
      border-color: rgba(255, 255, 255, 0.25);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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
