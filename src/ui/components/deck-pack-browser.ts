/**
 * @fileoverview Deck Pack Browser Component
 * 
 * Implements O031:
 * - Browse available deck packs
 * - Filter by category, tags, difficulty
 * - Preview pack contents
 * - Install packs to current board
 * 
 * @module @cardplay/ui/components/deck-pack-browser
 */

import type { DeckPack, DeckPackSearchOptions } from '../../boards/deck-packs/types';
import { getDeckPackRegistry } from '../../boards/deck-packs/registry';
import { addDeckPackToBoard } from '../../boards/deck-packs/add-pack';
import { getBoardStateStore } from '../../boards/store/store';

// --------------------------------------------------------------------------
// Component State
// --------------------------------------------------------------------------

interface DeckPackBrowserState {
  searchQuery: string;
  selectedCategory: DeckPack['category'] | 'all';
  selectedDifficulty: DeckPack['difficulty'] | 'all';
  selectedPack: DeckPack | null;
  isInstalling: boolean;
  error: string | null;
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export class DeckPackBrowser {
  private container: HTMLElement;
  private state: DeckPackBrowserState = {
    searchQuery: '',
    selectedCategory: 'all',
    selectedDifficulty: 'all',
    selectedPack: null,
    isInstalling: false,
    error: null
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    const registry = getDeckPackRegistry();
    
    // Build search options
    const searchOptions: DeckPackSearchOptions = {};
    if (this.state.searchQuery) {
      searchOptions.query = this.state.searchQuery;
    }
    if (this.state.selectedCategory !== 'all') {
      searchOptions.category = this.state.selectedCategory;
    }
    if (this.state.selectedDifficulty !== 'all') {
      searchOptions.difficulty = this.state.selectedDifficulty;
    }

    const packs = registry.search(searchOptions);

    this.container.innerHTML = `
      <div class="deck-pack-browser">
        <div class="browser-header">
          <h2>Deck Packs</h2>
          <p class="subtitle">Add pre-configured deck sets to your board</p>
        </div>

        <div class="browser-controls">
          <div class="search-box">
            <input
              type="search"
              placeholder="Search deck packs..."
              value="${this.state.searchQuery}"
              class="search-input"
            />
          </div>
          
          <div class="filters">
            <select class="category-filter">
              <option value="all">All Categories</option>
              <option value="production" ${this.state.selectedCategory === 'production' ? 'selected' : ''}>Production</option>
              <option value="composition" ${this.state.selectedCategory === 'composition' ? 'selected' : ''}>Composition</option>
              <option value="performance" ${this.state.selectedCategory === 'performance' ? 'selected' : ''}>Performance</option>
              <option value="sound-design" ${this.state.selectedCategory === 'sound-design' ? 'selected' : ''}>Sound Design</option>
              <option value="mixing" ${this.state.selectedCategory === 'mixing' ? 'selected' : ''}>Mixing</option>
              <option value="utility" ${this.state.selectedCategory === 'utility' ? 'selected' : ''}>Utility</option>
            </select>

            <select class="difficulty-filter">
              <option value="all">All Levels</option>
              <option value="beginner" ${this.state.selectedDifficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
              <option value="intermediate" ${this.state.selectedDifficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="advanced" ${this.state.selectedDifficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
        </div>

        ${this.state.error ? `
          <div class="error-message" role="alert">
            ${this.state.error}
          </div>
        ` : ''}

        <div class="pack-list">
          ${packs.length === 0 ? `
            <div class="empty-state">
              <p>No deck packs found matching your filters.</p>
            </div>
          ` : packs.map(pack => this.renderPackCard(pack)).join('')}
        </div>

        ${this.state.selectedPack ? this.renderPackDetails(this.state.selectedPack) : ''}
      </div>
    `;

    this.attachEventListeners();
    injectDeckPackBrowserStyles();
  }

  private renderPackCard(pack: DeckPack): string {
    const boardStore = getBoardStateStore();
    const state = boardStore.getState();
    const registry = getDeckPackRegistry();
    const isInstalled = state.currentBoardId ? 
      registry.isInstalled(pack.id, state.currentBoardId) : false;

    return `
      <div class="pack-card" data-pack-id="${pack.id}">
        <div class="pack-icon">${pack.icon}</div>
        <div class="pack-info">
          <h3 class="pack-name">${pack.name}</h3>
          <p class="pack-description">${pack.description}</p>
          <div class="pack-meta">
            <span class="category-badge">${pack.category}</span>
            ${pack.difficulty ? `<span class="difficulty-badge">${pack.difficulty}</span>` : ''}
            <span class="deck-count">${pack.decks.length} decks</span>
          </div>
          <div class="pack-tags">
            ${pack.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="pack-actions">
          ${isInstalled ? `
            <span class="installed-badge">✓ Installed</span>
          ` : `
            <button class="install-button" data-pack-id="${pack.id}">
              Install
            </button>
          `}
          <button class="preview-button" data-pack-id="${pack.id}">
            Preview
          </button>
        </div>
      </div>
    `;
  }

  private renderPackDetails(pack: DeckPack): string {
    return `
      <div class="pack-details-modal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <button class="close-button" aria-label="Close">×</button>
          
          <div class="pack-details">
            <h2>${pack.name}</h2>
            <p class="description">${pack.description}</p>
            
            <div class="meta-info">
              <div class="meta-item">
                <span class="label">Category:</span>
                <span class="value">${pack.category}</span>
              </div>
              ${pack.difficulty ? `
                <div class="meta-item">
                  <span class="label">Difficulty:</span>
                  <span class="value">${pack.difficulty}</span>
                </div>
              ` : ''}
              ${pack.author ? `
                <div class="meta-item">
                  <span class="label">Author:</span>
                  <span class="value">${pack.author}</span>
                </div>
              ` : ''}
            </div>

            <div class="deck-list">
              <h3>Included Decks (${pack.decks.length})</h3>
              <ul>
                ${pack.decks.map(deck => `
                  <li>
                    <strong>${deck.type}</strong>
                    <span class="deck-layout">(${deck.cardLayout})</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="modal-actions">
              <button class="install-button-large" data-pack-id="${pack.id}">
                Install Pack
              </button>
              <button class="cancel-button">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Search input
    const searchInput = this.container.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = (e.target as HTMLInputElement).value;
        this.render();
      });
    }

    // Category filter
    const categoryFilter = this.container.querySelector('.category-filter') as HTMLSelectElement;
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.state.selectedCategory = (e.target as HTMLSelectElement).value as any;
        this.render();
      });
    }

    // Difficulty filter
    const difficultyFilter = this.container.querySelector('.difficulty-filter') as HTMLSelectElement;
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', (e) => {
        this.state.selectedDifficulty = (e.target as HTMLSelectElement).value as any;
        this.render();
      });
    }

    // Install buttons
    const installButtons = this.container.querySelectorAll('.install-button, .install-button-large');
    installButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const packId = (e.target as HTMLElement).getAttribute('data-pack-id');
        if (packId) {
          this.installPack(packId);
        }
      });
    });

    // Preview buttons
    const previewButtons = this.container.querySelectorAll('.preview-button');
    previewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const packId = (e.target as HTMLElement).getAttribute('data-pack-id');
        if (packId) {
          const registry = getDeckPackRegistry();
          const pack = registry.get(packId);
          if (pack) {
            this.state.selectedPack = pack;
            this.render();
          }
        }
      });
    });

    // Close button
    const closeButton = this.container.querySelector('.close-button, .cancel-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.state.selectedPack = null;
        this.render();
      });
    }

    // Modal overlay
    const overlay = this.container.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.state.selectedPack = null;
        this.render();
      });
    }
  }

  private async installPack(packId: string): Promise<void> {
    const boardStore = getBoardStateStore();
    const state = boardStore.getState();

    if (!state.currentBoardId) {
      this.state.error = 'No board is currently active';
      this.render();
      return;
    }

    this.state.isInstalling = true;
    this.state.error = null;
    this.render();

    try {
      const result = addDeckPackToBoard(packId, {
        boardId: state.currentBoardId,
        autoRename: true,
        activateFirst: true
      });

      if (result.success) {
        // Success - close modal and refresh
        this.state.selectedPack = null;
        this.state.isInstalling = false;
        this.render();
      } else {
        this.state.error = result.errors.join(', ');
        this.state.isInstalling = false;
        this.render();
      }
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Installation failed';
      this.state.isInstalling = false;
      this.render();
    }
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

let stylesInjected = false;

function injectDeckPackBrowserStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    .deck-pack-browser {
      padding: var(--spacing-4);
      max-width: 1200px;
      margin: 0 auto;
    }

    .browser-header {
      margin-bottom: var(--spacing-4);
    }

    .browser-header h2 {
      margin: 0 0 var(--spacing-2) 0;
      color: var(--color-text-primary);
    }

    .subtitle {
      margin: 0;
      color: var(--color-text-secondary);
    }

    .browser-controls {
      margin-bottom: var(--spacing-4);
      display: flex;
      gap: var(--spacing-2);
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 300px;
    }

    .search-input {
      width: 100%;
      padding: var(--spacing-2);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .filters {
      display: flex;
      gap: var(--spacing-2);
    }

    .filters select {
      padding: var(--spacing-2);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .error-message {
      padding: var(--spacing-3);
      background: var(--color-error-bg);
      color: var(--color-error-text);
      border-radius: var(--border-radius);
      margin-bottom: var(--spacing-3);
    }

    .pack-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: var(--spacing-3);
    }

    .pack-card {
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--spacing-3);
      background: var(--color-bg-secondary);
      display: flex;
      gap: var(--spacing-3);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .pack-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .pack-icon {
      font-size: 2em;
      flex-shrink: 0;
    }

    .pack-info {
      flex: 1;
    }

    .pack-name {
      margin: 0 0 var(--spacing-1) 0;
      color: var(--color-text-primary);
      font-size: 1.1em;
    }

    .pack-description {
      margin: 0 0 var(--spacing-2) 0;
      color: var(--color-text-secondary);
      font-size: 0.9em;
    }

    .pack-meta {
      display: flex;
      gap: var(--spacing-2);
      margin-bottom: var(--spacing-2);
      flex-wrap: wrap;
    }

    .category-badge, .difficulty-badge {
      padding: 2px var(--spacing-2);
      border-radius: var(--border-radius-sm);
      font-size: 0.8em;
      background: var(--color-primary);
      color: white;
    }

    .deck-count {
      font-size: 0.8em;
      color: var(--color-text-tertiary);
    }

    .pack-tags {
      display: flex;
      gap: var(--spacing-1);
      flex-wrap: wrap;
    }

    .tag {
      font-size: 0.75em;
      padding: 2px var(--spacing-1);
      background: var(--color-bg-tertiary);
      border-radius: var(--border-radius-sm);
      color: var(--color-text-secondary);
    }

    .pack-actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
      justify-content: center;
    }

    .install-button, .preview-button {
      padding: var(--spacing-2) var(--spacing-3);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      background: var(--color-primary);
      color: white;
      cursor: pointer;
      white-space: nowrap;
    }

    .preview-button {
      background: transparent;
      color: var(--color-text-primary);
    }

    .installed-badge {
      padding: var(--spacing-2);
      color: var(--color-success);
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-6);
      color: var(--color-text-secondary);
    }

    .pack-details-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
      position: relative;
      background: var(--color-bg-primary);
      border-radius: var(--border-radius-lg);
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      padding: var(--spacing-4);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .close-button {
      position: absolute;
      top: var(--spacing-2);
      right: var(--spacing-2);
      border: none;
      background: transparent;
      font-size: 1.5em;
      cursor: pointer;
      color: var(--color-text-secondary);
    }

    .pack-details h2 {
      margin-top: 0;
    }

    .meta-info {
      margin: var(--spacing-3) 0;
    }

    .meta-item {
      display: flex;
      gap: var(--spacing-2);
      margin-bottom: var(--spacing-1);
    }

    .meta-item .label {
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .deck-list {
      margin: var(--spacing-3) 0;
    }

    .deck-list ul {
      list-style: none;
      padding: 0;
      margin: var(--spacing-2) 0 0 0;
    }

    .deck-list li {
      padding: var(--spacing-2);
      border-bottom: 1px solid var(--color-border);
    }

    .deck-layout {
      color: var(--color-text-tertiary);
      font-size: 0.9em;
      margin-left: var(--spacing-2);
    }

    .modal-actions {
      margin-top: var(--spacing-4);
      display: flex;
      gap: var(--spacing-2);
      justify-content: flex-end;
    }

    .install-button-large {
      padding: var(--spacing-2) var(--spacing-4);
      border: none;
      border-radius: var(--border-radius);
      background: var(--color-primary);
      color: white;
      cursor: pointer;
      font-size: 1em;
    }

    .cancel-button {
      padding: var(--spacing-2) var(--spacing-4);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      background: transparent;
      color: var(--color-text-primary);
      cursor: pointer;
    }
  `;

  document.head.appendChild(style);
}
