/**
 * @fileoverview Phrase Cards Component
 * 
 * Beautiful card-based phrase browser with:
 * - Visual waveform/piano roll preview
 * - Drag-and-drop support
 * - Tag filtering
 * - Favorites
 * - Search
 * 
 * Implements G042-G044: phrase library UI for assisted boards
 * 
 * @module @cardplay/ui/components/phrase-cards
 */

/**
 * Phrase metadata for display
 */
export interface PhraseCardData {
  /** Unique phrase ID */
  id: string;
  
  /** Phrase name */
  name: string;
  
  /** Phrase description */
  description?: string;
  
  /** Tags (genre, mood, instrument) */
  tags: string[];
  
  /** Duration in beats */
  duration: number;
  
  /** Number of notes */
  noteCount: number;
  
  /** Preview image data URL (optional) */
  preview?: string;
  
  /** Whether phrase is favorited */
  isFavorite?: boolean;
  
  /** BPM (for timing context) */
  bpm?: number;
}

/**
 * Options for phrase cards component
 */
export interface PhraseCardsOptions {
  /** Phrases to display */
  phrases: PhraseCardData[];
  
  /** Current search text */
  searchText?: string;
  
  /** Active filters (tags) */
  activeFilters?: string[];
  
  /** Show only favorites */
  showOnlyFavorites?: boolean;
  
  /** Callback when phrase is selected */
  onPhraseSelect?: (phrase: PhraseCardData) => void;
  
  /** Callback when phrase drag starts */
  onPhraseDragStart?: (phrase: PhraseCardData) => void;
  
  /** Callback when favorite is toggled */
  onFavoriteToggle?: (phraseId: string, isFavorite: boolean) => void;
  
  /** Callback when preview is requested */
  onPreview?: (phraseId: string) => void;
}

/**
 * Creates a beautiful phrase cards browser
 */
export function createPhraseCards(options: PhraseCardsOptions): HTMLElement {
  const {
    phrases = [],
    searchText = '',
    activeFilters = [],
    showOnlyFavorites = false,
    onPhraseSelect,
    onPhraseDragStart,
    onFavoriteToggle,
    onPreview,
  } = options;

  const container = document.createElement('div');
  container.className = 'phrase-cards-container';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-surface, #1a1a1a);
  `;

  // Search and filter bar
  const toolbar = createToolbar({
    searchText,
    activeFilters,
    showOnlyFavorites,
    allTags: getAllTags(phrases),
    onSearchChange: (text) => {
      // Re-render with new search
      const newContainer = createPhraseCards({
        ...options,
        searchText: text,
      });
      container.parentElement?.replaceChild(newContainer, container);
    },
    onFilterChange: (filters) => {
      const newContainer = createPhraseCards({
        ...options,
        activeFilters: filters,
      });
      container.parentElement?.replaceChild(newContainer, container);
    },
    onFavoritesToggle: (show) => {
      const newContainer = createPhraseCards({
        ...options,
        showOnlyFavorites: show,
      });
      container.parentElement?.replaceChild(newContainer, container);
    },
  });
  container.appendChild(toolbar);

  // Filter phrases
  const filteredPhrases = filterPhrases(phrases, {
    searchText,
    activeFilters,
    showOnlyFavorites,
  });

  // Cards grid
  const grid = document.createElement('div');
  grid.className = 'phrase-cards-grid';
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
    padding: 1rem;
    overflow-y: auto;
    flex: 1;
  `;

  if (filteredPhrases.length === 0) {
    const emptyState = createEmptyState(searchText, activeFilters, showOnlyFavorites);
    grid.appendChild(emptyState);
  } else {
    filteredPhrases.forEach(phrase => {
      const card = createPhraseCard(phrase, {
        onSelect: () => onPhraseSelect?.(phrase),
        onDragStart: () => onPhraseDragStart?.(phrase),
        onFavoriteToggle: (isFavorite) => onFavoriteToggle?.(phrase.id, isFavorite),
        onPreview: () => onPreview?.(phrase.id),
      });
      grid.appendChild(card);
    });
  }

  container.appendChild(grid);

  return container;
}

/**
 * Creates the toolbar with search and filters
 */
function createToolbar(options: {
  searchText: string;
  activeFilters: string[];
  showOnlyFavorites: boolean;
  allTags: string[];
  onSearchChange: (text: string) => void;
  onFilterChange: (filters: string[]) => void;
  onFavoritesToggle: (show: boolean) => void;
}): HTMLElement {
  const toolbar = document.createElement('div');
  toolbar.className = 'phrase-toolbar';
  toolbar.style.cssText = `
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-surface-elevated, #222);
    border-bottom: 1px solid var(--color-border, #333);
  `;

  // Search input
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search phrases...';
  searchInput.value = options.searchText;
  searchInput.style.cssText = `
    flex: 1;
    padding: 0.5rem 0.75rem;
    background: var(--color-input-bg, #2a2a2a);
    border: 1px solid var(--color-border, #444);
    border-radius: 6px;
    color: var(--color-text, #fff);
    font-size: 0.875rem;
  `;
  searchInput.addEventListener('input', (e) => {
    options.onSearchChange((e.target as HTMLInputElement).value);
  });
  toolbar.appendChild(searchInput);

  // Favorites toggle
  const favButton = document.createElement('button');
  favButton.className = 'fav-toggle';
  favButton.innerHTML = options.showOnlyFavorites ? '⭐ Favorites' : '☆ All';
  favButton.style.cssText = `
    padding: 0.5rem 0.75rem;
    background: ${options.showOnlyFavorites ? 'var(--color-primary, #00a6ff)' : 'var(--color-button-bg, #333)'};
    border: 1px solid var(--color-border, #444);
    border-radius: 6px;
    color: var(--color-text, #fff);
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap;
    transition: all 0.2s ease;
  `;
  favButton.addEventListener('click', () => {
    options.onFavoritesToggle(!options.showOnlyFavorites);
  });
  toolbar.appendChild(favButton);

  // Filter dropdown (simplified)
  if (options.allTags.length > 0) {
    const filterButton = document.createElement('button');
    filterButton.textContent = `Filters (${options.activeFilters.length})`;
    filterButton.style.cssText = `
      padding: 0.5rem 0.75rem;
      background: ${options.activeFilters.length > 0 ? 'var(--color-accent, #ff8c00)' : 'var(--color-button-bg, #333)'};
      border: 1px solid var(--color-border, #444);
      border-radius: 6px;
      color: var(--color-text, #fff);
      cursor: pointer;
      font-size: 0.875rem;
      white-space: nowrap;
    `;
    // TODO: Add dropdown menu for tag filtering
    toolbar.appendChild(filterButton);
  }

  return toolbar;
}

/**
 * Creates a single phrase card
 */
function createPhraseCard(
  phrase: PhraseCardData,
  callbacks: {
    onSelect: () => void;
    onDragStart: () => void;
    onFavoriteToggle: (isFavorite: boolean) => void;
    onPreview: () => void;
  }
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'phrase-card';
  card.draggable = true;
  card.style.cssText = `
    position: relative;
    background: var(--color-surface-elevated, #222);
    border: 2px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `;

  // Hover effect
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = 'var(--color-primary, #00a6ff)';
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 166, 255, 0.2)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.borderColor = 'var(--color-border, #333)';
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
  });

  // Drag events
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer!.effectAllowed = 'copy';
    e.dataTransfer!.setData('application/json', JSON.stringify({
      type: 'phrase',
      phraseId: phrase.id,
    }));
    callbacks.onDragStart();
  });

  // Click event
  card.addEventListener('click', callbacks.onSelect);

  // Preview image or generated visualization
  const preview = document.createElement('div');
  preview.className = 'phrase-preview';
  preview.style.cssText = `
    width: 100%;
    height: 60px;
    background: linear-gradient(135deg, rgba(0, 166, 255, 0.1), rgba(255, 140, 0, 0.1));
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  `;

  if (phrase.preview) {
    preview.style.backgroundImage = `url(${phrase.preview})`;
    preview.style.backgroundSize = 'cover';
  } else {
    // Generate simple note visualization
    const viz = generateNoteVisualization(phrase.noteCount, phrase.duration);
    preview.appendChild(viz);
  }

  card.appendChild(preview);

  // Favorite button overlay
  const favButton = document.createElement('button');
  favButton.className = 'phrase-fav-btn';
  favButton.innerHTML = phrase.isFavorite ? '⭐' : '☆';
  favButton.style.cssText = `
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    border: none;
    color: ${phrase.isFavorite ? '#ffd700' : '#fff'};
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.2s ease;
  `;
  favButton.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onFavoriteToggle(!phrase.isFavorite);
  });
  favButton.addEventListener('mouseenter', () => {
    favButton.style.transform = 'scale(1.2)';
  });
  favButton.addEventListener('mouseleave', () => {
    favButton.style.transform = 'scale(1)';
  });
  card.appendChild(favButton);

  // Phrase name
  const name = document.createElement('div');
  name.className = 'phrase-name';
  name.textContent = phrase.name;
  name.style.cssText = `
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text, #fff);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  card.appendChild(name);

  // Metadata
  const meta = document.createElement('div');
  meta.className = 'phrase-meta';
  meta.innerHTML = `
    <span style="font-size: 0.75rem; color: var(--color-text-muted, #999);">
      ${phrase.noteCount} notes · ${phrase.duration} beats
    </span>
  `;
  card.appendChild(meta);

  // Tags
  if (phrase.tags.length > 0) {
    const tags = document.createElement('div');
    tags.className = 'phrase-tags';
    tags.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    `;

    phrase.tags.slice(0, 3).forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'phrase-tag';
      tagEl.textContent = tag;
      tagEl.style.cssText = `
        font-size: 0.65rem;
        padding: 0.15rem 0.4rem;
        background: rgba(0, 166, 255, 0.2);
        border-radius: 3px;
        color: var(--color-primary, #00a6ff);
      `;
      tags.appendChild(tagEl);
    });

    card.appendChild(tags);
  }

  // Preview button
  const previewBtn = document.createElement('button');
  previewBtn.className = 'phrase-preview-btn';
  previewBtn.innerHTML = '▶ Preview';
  previewBtn.style.cssText = `
    margin-top: 0.25rem;
    padding: 0.35rem;
    background: rgba(0, 166, 255, 0.1);
    border: 1px solid rgba(0, 166, 255, 0.3);
    border-radius: 4px;
    color: var(--color-primary, #00a6ff);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  previewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onPreview();
  });
  previewBtn.addEventListener('mouseenter', () => {
    previewBtn.style.background = 'rgba(0, 166, 255, 0.2)';
  });
  previewBtn.addEventListener('mouseleave', () => {
    previewBtn.style.background = 'rgba(0, 166, 255, 0.1)';
  });
  card.appendChild(previewBtn);

  return card;
}

/**
 * Generates a simple note visualization
 */
function generateNoteVisualization(noteCount: number, _duration: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.opacity = '0.6';

  // Generate random-looking but consistent bars
  const barCount = Math.min(12, noteCount);
  const spacing = 100 / (barCount + 1);

  for (let i = 0; i < barCount; i++) {
    const x = (i + 1) * spacing;
    const height = 30 + (Math.sin(i * 0.7) * 15 + 15);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', `${x - 1}%`);
    rect.setAttribute('y', `${50 - height / 2}%`);
    rect.setAttribute('width', '2%');
    rect.setAttribute('height', `${height}%`);
    rect.setAttribute('fill', 'var(--color-primary, #00a6ff)');
    rect.setAttribute('opacity', '0.7');
    svg.appendChild(rect);
  }

  return svg;
}

/**
 * Gets all unique tags from phrases
 */
function getAllTags(phrases: PhraseCardData[]): string[] {
  const tags = new Set<string>();
  phrases.forEach(phrase => {
    phrase.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Filters phrases based on criteria
 */
function filterPhrases(
  phrases: PhraseCardData[],
  criteria: {
    searchText: string;
    activeFilters: string[];
    showOnlyFavorites: boolean;
  }
): PhraseCardData[] {
  return phrases.filter(phrase => {
    // Favorites filter
    if (criteria.showOnlyFavorites && !phrase.isFavorite) {
      return false;
    }

    // Search text filter
    if (criteria.searchText) {
      const search = criteria.searchText.toLowerCase();
      const matchesName = phrase.name.toLowerCase().includes(search);
      const matchesDesc = phrase.description?.toLowerCase().includes(search);
      const matchesTags = phrase.tags.some(tag => tag.toLowerCase().includes(search));
      if (!matchesName && !matchesDesc && !matchesTags) {
        return false;
      }
    }

    // Tag filters
    if (criteria.activeFilters.length > 0) {
      const hasAllTags = criteria.activeFilters.every(filter =>
        phrase.tags.includes(filter)
      );
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Creates empty state message
 */
function createEmptyState(
  searchText: string,
  activeFilters: string[],
  showOnlyFavorites: boolean
): HTMLElement {
  const empty = document.createElement('div');
  empty.className = 'phrase-empty-state';
  empty.style.cssText = `
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    color: var(--color-text-muted, #999);
  `;

  let message = 'No phrases found';
  if (searchText) {
    message = `No phrases match "${searchText}"`;
  } else if (showOnlyFavorites) {
    message = 'No favorite phrases yet';
  } else if (activeFilters.length > 0) {
    message = 'No phrases match the selected filters';
  }

  empty.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">🎵</div>
    <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
      ${message}
    </div>
    <div style="font-size: 0.875rem; opacity: 0.7;">
      Try adjusting your search or filters
    </div>
  `;

  return empty;
}

/**
 * Inject CSS styles
 */
function injectPhraseCardsStyles(): void {
  if (document.getElementById('phrase-cards-styles')) return;

  const style = document.createElement('style');
  style.id = 'phrase-cards-styles';
  style.textContent = `
    .phrase-cards-container {
      --color-primary: #00a6ff;
      --color-accent: #ff8c00;
    }

    .phrase-card {
      will-change: transform;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .phrase-card,
      .phrase-fav-btn,
      .phrase-preview-btn {
        transition: none !important;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .phrase-card {
        border-width: 3px;
      }
    }
  `;

  document.head.appendChild(style);
}

// Initialize styles
if (typeof document !== 'undefined') {
  injectPhraseCardsStyles();
}
