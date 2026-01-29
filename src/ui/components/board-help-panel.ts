/**
 * @fileoverview Board Help Panel
 * 
 * C072-C075: Lists active board decks/tools/shortcuts in a help panel.
 * 
 * @module @cardplay/ui/components/board-help-panel
 */

import type { Board } from '../../boards/types';

// ============================================================================
// STYLES
// ============================================================================

const HELP_PANEL_STYLES = `
  .board-help-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-surface, #fff);
    color: var(--color-on-surface, #000);
    font-family: var(--font-family, system-ui, -apple-system, sans-serif);
    font-size: 0.875rem;
    line-height: 1.5;
    overflow-y: auto;
    max-width: 600px;
  }
  
  .board-help-panel__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--color-on-surface, #000);
  }
  
  .board-help-panel__subtitle {
    font-size: 1rem;
    font-weight: 500;
    margin: 1rem 0 0.5rem 0;
    color: var(--color-on-surface-variant, #666);
  }
  
  .board-help-panel__description {
    margin: 0 0 1rem 0;
    color: var(--color-on-surface-variant, #666);
  }
  
  .board-help-panel__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  .board-help-panel__list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-base, #e5e5e5);
  }
  
  .board-help-panel__list-item:last-child {
    border-bottom: none;
  }
  
  .board-help-panel__deck-name {
    font-weight: 500;
  }
  
  .board-help-panel__deck-type {
    color: var(--color-on-surface-variant, #666);
    font-size: 0.75rem;
  }
  
  .board-help-panel__shortcut-key {
    font-family: var(--font-family-mono, 'SF Mono', Consolas, monospace);
    background: var(--color-surface-variant, #f5f5f5);
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm, 4px);
    font-size: 0.75rem;
  }
  
  .board-help-panel__link {
    color: var(--color-primary, #3b82f6);
    text-decoration: none;
  }
  
  .board-help-panel__link:hover {
    text-decoration: underline;
  }
  
  .board-help-panel__tool-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm, 4px);
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .board-help-panel__tool-badge--enabled {
    background: var(--color-success-container, #d4edda);
    color: var(--color-on-success-container, #155724);
  }
  
  .board-help-panel__tool-badge--hidden {
    background: var(--color-surface-variant, #f5f5f5);
    color: var(--color-on-surface-variant, #666);
  }
`;

let stylesInjected = false;

function injectHelpPanelStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = HELP_PANEL_STYLES;
  document.head.appendChild(style);
}

// ============================================================================
// BOARD HELP PANEL COMPONENT
// ============================================================================

/**
 * C072: Create board help panel listing active board decks/tools/shortcuts.
 * 
 * The help panel is board-driven (C074) - all content comes from the
 * board definition, not hard-coded board IDs.
 */
export function createBoardHelpPanel(board: Board): HTMLElement {
  injectHelpPanelStyles();
  
  const container = document.createElement('div');
  container.className = 'board-help-panel';
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-labelledby', 'help-panel-title');
  
  // Title
  const title = document.createElement('h2');
  title.id = 'help-panel-title';
  title.className = 'board-help-panel__title';
  title.textContent = board.name;
  container.appendChild(title);
  
  // Description
  if (board.description) {
    const desc = document.createElement('p');
    desc.className = 'board-help-panel__description';
    desc.textContent = board.description;
    container.appendChild(desc);
  }
  
  // Control level info
  const controlInfo = document.createElement('p');
  controlInfo.className = 'board-help-panel__description';
  controlInfo.textContent = `Control Level: ${board.controlLevel}`;
  container.appendChild(controlInfo);
  
  // Decks section
  const decksSubtitle = document.createElement('h3');
  decksSubtitle.className = 'board-help-panel__subtitle';
  decksSubtitle.textContent = 'Decks';
  container.appendChild(decksSubtitle);
  
  const decksList = document.createElement('ul');
  decksList.className = 'board-help-panel__list';
  
  for (const deck of board.decks) {
    const item = document.createElement('li');
    item.className = 'board-help-panel__list-item';
    
    const deckInfo = document.createElement('div');
    const deckName = document.createElement('div');
    deckName.className = 'board-help-panel__deck-name';
    deckName.textContent = deck.id;
    deckInfo.appendChild(deckName);
    
    const deckType = document.createElement('div');
    deckType.className = 'board-help-panel__deck-type';
    deckType.textContent = deck.type;
    deckInfo.appendChild(deckType);
    
    item.appendChild(deckInfo);
    decksList.appendChild(item);
  }
  
  container.appendChild(decksList);
  
  // Tools section
  const toolsSubtitle = document.createElement('h3');
  toolsSubtitle.className = 'board-help-panel__subtitle';
  toolsSubtitle.textContent = 'Composition Tools';
  container.appendChild(toolsSubtitle);
  
  const toolsList = document.createElement('ul');
  toolsList.className = 'board-help-panel__list';
  
  const tools = [
    { name: 'Phrase Database', config: board.compositionTools.phraseDatabase },
    { name: 'Harmony Explorer', config: board.compositionTools.harmonyExplorer },
    { name: 'Phrase Generators', config: board.compositionTools.phraseGenerators },
    { name: 'Arranger', config: board.compositionTools.arrangerCard },
    { name: 'AI Composer', config: board.compositionTools.aiComposer },
  ];
  
  for (const tool of tools) {
    const item = document.createElement('li');
    item.className = 'board-help-panel__list-item';
    
    const toolName = document.createElement('div');
    toolName.textContent = tool.name;
    item.appendChild(toolName);
    
    const badge = document.createElement('span');
    badge.className = `board-help-panel__tool-badge board-help-panel__tool-badge--${tool.config.enabled ? 'enabled' : 'hidden'}`;
    badge.textContent = tool.config.enabled ? tool.config.mode : 'hidden';
    item.appendChild(badge);
    
    toolsList.appendChild(item);
  }
  
  container.appendChild(toolsList);
  
  // Shortcuts section
  if (board.shortcuts && Object.keys(board.shortcuts).length > 0) {
    const shortcutsSubtitle = document.createElement('h3');
    shortcutsSubtitle.className = 'board-help-panel__subtitle';
    shortcutsSubtitle.textContent = 'Keyboard Shortcuts';
    container.appendChild(shortcutsSubtitle);
    
    const shortcutsList = document.createElement('ul');
    shortcutsList.className = 'board-help-panel__list';
    
    for (const [key, action] of Object.entries(board.shortcuts)) {
      const item = document.createElement('li');
      item.className = 'board-help-panel__list-item';
      
      const actionName = document.createElement('div');
      actionName.textContent = typeof action === 'string' ? action : 'Action';
      item.appendChild(actionName);
      
      const shortcutKey = document.createElement('kbd');
      shortcutKey.className = 'board-help-panel__shortcut-key';
      shortcutKey.textContent = key;
      item.appendChild(shortcutKey);
      
      shortcutsList.appendChild(item);
    }
    
    container.appendChild(shortcutsList);
  }
  
  // Documentation links (C073)
  const docsSubtitle = document.createElement('h3');
  docsSubtitle.className = 'board-help-panel__subtitle';
  docsSubtitle.textContent = 'Documentation';
  container.appendChild(docsSubtitle);
  
  const docsLinks = document.createElement('ul');
  docsLinks.className = 'board-help-panel__list';
  
  const links = [
    { text: 'Board System Overview', href: 'docs/boards/board-api.md' },
    { text: 'Board UI Architecture', href: 'cardplayui.md' },
    { text: 'Deck Types Reference', href: 'docs/boards/decks.md' },
    { text: 'Keyboard Shortcuts Reference', href: 'docs/boards/shortcuts.md' },
  ];
  
  for (const link of links) {
    const item = document.createElement('li');
    item.className = 'board-help-panel__list-item';
    
    const linkEl = document.createElement('a');
    linkEl.className = 'board-help-panel__link';
    linkEl.href = link.href;
    linkEl.textContent = link.text;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
    item.appendChild(linkEl);
    
    docsLinks.appendChild(item);
  }
  
  container.appendChild(docsLinks);
  
  return container;
}

/**
 * C071: Open board help panel in a modal.
 */
export function openBoardHelp(board: Board): void {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  // Create modal container
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--color-surface, #fff);
    border-radius: var(--radius-lg, 8px);
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.2));
  `;
  
  // Add help panel
  const helpPanel = createBoardHelpPanel(board);
  modal.appendChild(helpPanel);
  
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  
  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      document.body.removeChild(backdrop);
    }
  });
  
  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      document.body.removeChild(backdrop);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Focus the modal
  helpPanel.focus();
}
