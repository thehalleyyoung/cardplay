/**
 * Template Browser Component
 *
 * UI for browsing and loading project templates
 */

import { getTemplateRegistry } from '../../boards/templates/registry';
import { loadTemplate } from '../../boards/templates/loader';
import type {
  TemplatePreview,
  TemplateGenre,
  TemplateDifficulty,
} from '../../boards/templates/types';

const DIFFICULTY_COLORS: Record<TemplateDifficulty, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
  expert: '#9C27B0',
};

/**
 * Template browser component
 */
export class TemplateBrowser {
  private container: HTMLElement;
  private searchInput: HTMLInputElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  private filterState: {
    searchText?: string;
    genre?: TemplateGenre;
    difficulty?: TemplateDifficulty;
    tags?: readonly string[];
  } = {};
  private onCloseCallback?: () => void;
  private onLoadCallback?: () => void;

  constructor(
    container: HTMLElement,
    options?: {
      onClose?: () => void;
      onLoad?: () => void;
    }
  ) {
    this.container = container;
    if (options?.onClose) {
      this.onCloseCallback = options.onClose;
    }
    if (options?.onLoad) {
      this.onLoadCallback = options.onLoad;
    }
    this.render();
  }

  private render(): void {
    const registry = getTemplateRegistry();
    const templates = registry.search(this.filterState);

    this.container.innerHTML = '';
    this.container.className = 'template-browser';

    // Header
    const header = document.createElement('div');
    header.className = 'template-browser__header';
    header.innerHTML = `
      <h2>Project Templates</h2>
      <button class="template-browser__close" aria-label="Close template browser">×</button>
    `;
    this.container.appendChild(header);

    // Search and filters
    const searchBar = document.createElement('div');
    searchBar.className = 'template-browser__search';
    searchBar.innerHTML = `
      <input
        type="text"
        placeholder="Search templates..."
        class="template-browser__search-input"
        value="${this.filterState.searchText || ''}"
      />
      <div class="template-browser__filters">
        <select class="template-browser__genre-filter">
          <option value="">All Genres</option>
          <option value="electronic">Electronic</option>
          <option value="hip-hop">Hip Hop</option>
          <option value="ambient">Ambient</option>
          <option value="orchestral">Orchestral</option>
          <option value="jazz">Jazz</option>
          <option value="rock">Rock</option>
        </select>
        <select class="template-browser__difficulty-filter">
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>
    `;
    this.container.appendChild(searchBar);

    // Results
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'template-browser__results';

    if (templates.length === 0) {
      this.resultsContainer.innerHTML = '<div class="template-browser__empty">No templates found</div>';
    } else {
      templates.forEach((template) => {
        const card = this.createTemplateCard(template);
        this.resultsContainer!.appendChild(card);
      });
    }

    this.container.appendChild(this.resultsContainer);

    // Wire up events
    this.searchInput = searchBar.querySelector('.template-browser__search-input');
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.filterState.searchText = this.searchInput!.value;
        this.render();
      });
    }

    const genreFilter = searchBar.querySelector('.template-browser__genre-filter') as HTMLSelectElement;
    if (genreFilter) {
      genreFilter.value = this.filterState.genre || '';
      genreFilter.addEventListener('change', () => {
        this.filterState.genre = genreFilter.value as TemplateGenre || undefined;
        this.render();
      });
    }

    const difficultyFilter = searchBar.querySelector('.template-browser__difficulty-filter') as HTMLSelectElement;
    if (difficultyFilter) {
      difficultyFilter.value = this.filterState.difficulty || '';
      difficultyFilter.addEventListener('change', () => {
        this.filterState.difficulty = difficultyFilter.value as TemplateDifficulty || undefined;
        this.render();
      });
    }

    const closeButton = header.querySelector('.template-browser__close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      });
    }
  }

  private createTemplateCard(template: TemplatePreview): HTMLElement {
    const card = document.createElement('div');
    card.className = 'template-card';

    const difficultyColor = DIFFICULTY_COLORS[template.metadata.difficulty];

    card.innerHTML = `
      <div class="template-card__header">
        <h3>${template.metadata.name}</h3>
        <span class="template-card__difficulty" style="background-color: ${difficultyColor}">
          ${template.metadata.difficulty}
        </span>
      </div>
      <p class="template-card__description">${template.metadata.description}</p>
      <div class="template-card__meta">
        <span class="template-card__genre">${template.metadata.genre}</span>
        <span class="template-card__time">⏱ ${template.metadata.estimatedTime}</span>
      </div>
      <div class="template-card__stats">
        <span>🎵 ${template.streamCount} streams</span>
        <span>📎 ${template.clipCount} clips</span>
      </div>
      <div class="template-card__tags">
        ${template.metadata.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
      </div>
      <button class="template-card__load-button" data-template-id="${template.metadata.id}">
        Load Template
      </button>
    `;

    const loadButton = card.querySelector('.template-card__load-button');
    if (loadButton) {
      loadButton.addEventListener('click', () => {
        this.handleLoadTemplate(template.metadata.id);
      });
    }

    return card;
  }

  private async handleLoadTemplate(templateId: string): Promise<void> {
    const registry = getTemplateRegistry();
    const template = registry.get(templateId);

    if (!template) {
      console.error(`Template ${templateId} not found`);
      return;
    }

    const result = await loadTemplate(template);

    if (result.success) {
      console.log('Template loaded successfully');
      if (this.onLoadCallback) {
        this.onLoadCallback();
      }
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    } else {
      console.error('Failed to load template:', result.error);
      alert(`Failed to load template: ${result.error}`);
    }
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * Inject template browser styles
 */
export function injectTemplateBrowserStyles(): void {
  if (document.getElementById('template-browser-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'template-browser-styles';
  style.textContent = `
    .template-browser {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 1200px;
      height: 80vh;
      background-color: var(--color-surface, #1e1e1e);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 1000;
    }

    .template-browser__header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-border, #333);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .template-browser__header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--color-text-primary, #fff);
    }

    .template-browser__close {
      background: none;
      border: none;
      font-size: 2rem;
      color: var(--color-text-secondary, #aaa);
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      line-height: 1;
    }

    .template-browser__close:hover {
      color: var(--color-text-primary, #fff);
    }

    .template-browser__search {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--color-border, #333);
    }

    .template-browser__search-input {
      width: 100%;
      padding: 0.75rem;
      background-color: var(--color-surface-raised, #2a2a2a);
      border: 1px solid var(--color-border, #333);
      border-radius: 4px;
      color: var(--color-text-primary, #fff);
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    .template-browser__filters {
      display: flex;
      gap: 1rem;
    }

    .template-browser__filters select {
      flex: 1;
      padding: 0.5rem;
      background-color: var(--color-surface-raised, #2a2a2a);
      border: 1px solid var(--color-border, #333);
      border-radius: 4px;
      color: var(--color-text-primary, #fff);
    }

    .template-browser__results {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      align-content: start;
    }

    .template-browser__empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary, #aaa);
    }

    .template-card {
      background-color: var(--color-surface-raised, #2a2a2a);
      border: 1px solid var(--color-border, #333);
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .template-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .template-card__header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--color-text-primary, #fff);
    }

    .template-card__difficulty {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
      color: white;
      flex-shrink: 0;
    }

    .template-card__description {
      margin: 0;
      color: var(--color-text-secondary, #aaa);
      line-height: 1.5;
    }

    .template-card__meta {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #aaa);
    }

    .template-card__genre {
      text-transform: capitalize;
    }

    .template-card__stats {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #aaa);
    }

    .template-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .template-card__tags .tag {
      padding: 0.25rem 0.5rem;
      background-color: var(--color-surface, #1e1e1e);
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--color-text-secondary, #aaa);
    }

    .template-card__load-button {
      padding: 0.75rem;
      background-color: var(--color-primary, #007bff);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .template-card__load-button:hover {
      background-color: var(--color-primary-hover, #0056b3);
    }
  `;

  document.head.appendChild(style);
}
