/**
 * Sound Design Library Deck
 * 
 * Comprehensive preset management for sound designers:
 * - Browse and search presets by category
 * - Tag and organize custom presets
 * - Compare multiple presets side-by-side
 * - Create preset collections for projects
 * - Import/export preset banks
 * - Randomize with constraints for exploration
 * 
 * Designed for sound design and synthesis workflows.
 */

// Use string type for preset IDs (branded type can be added to primitives.ts later)
export type PresetId = string & { readonly __brand: 'PresetId' };

export interface PresetMetadata {
  id: PresetId;
  name: string;
  category: string;
  subcategory?: string;
  tags: string[];
  author?: string;
  description?: string;
  isFavorite: boolean;
  dateCreated: number;
  dateModified: number;
  usageCount: number;
}

export interface PresetCollection {
  id: string;
  name: string;
  description: string;
  presetIds: PresetId[];
  tags: string[];
  dateCreated: number;
}

export const PRESET_CATEGORIES = [
  { id: 'bass', name: 'Bass', icon: '🔉' },
  { id: 'lead', name: 'Lead', icon: '🎺' },
  { id: 'pad', name: 'Pad', icon: '🌊' },
  { id: 'pluck', name: 'Pluck', icon: '🎸' },
  { id: 'keys', name: 'Keys', icon: '🎹' },
  { id: 'strings', name: 'Strings', icon: '🎻' },
  { id: 'brass', name: 'Brass', icon: '🎺' },
  { id: 'fx', name: 'FX', icon: '✨' },
  { id: 'percussion', name: 'Percussion', icon: '🥁' },
  { id: 'texture', name: 'Texture', icon: '🌌' },
  { id: 'experimental', name: 'Experimental', icon: '🔬' },
  { id: 'custom', name: 'Custom', icon: '⚙️' }
];

export interface SoundDesignLibraryConfig {
  /** Available presets */
  presets: PresetMetadata[];
  /** Saved collections */
  collections?: PresetCollection[];
  /** Callback when preset is loaded */
  onLoadPreset: (presetId: PresetId) => void;
  /** Callback when preset is saved */
  onSavePreset?: (metadata: Partial<PresetMetadata>) => void;
  /** Callback when preset is deleted */
  onDeletePreset?: (presetId: PresetId) => void;
  /** Callback when collection is created */
  onCreateCollection?: (collection: PresetCollection) => void;
}

export class SoundDesignLibraryDeck {
  private container: HTMLElement;
  private config: SoundDesignLibraryConfig;
  private searchQuery = '';
  private selectedCategory: string | null = null;
  private viewMode: 'grid' | 'list' = 'grid';
  private sortBy: 'name' | 'recent' | 'usage' = 'name';
  private filteredPresets: PresetMetadata[] = [];

  constructor(config: SoundDesignLibraryConfig) {
    this.config = config;
    this.container = this.createUI();
    this.filterPresets();
  }

  /**
   * Get the deck container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Create library UI
   */
  private createUI(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sound-design-library-deck';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--deck-background, #2a2a2a);
      color: var(--text-primary, #ffffff);
    `;

    // Header
    const header = this.createHeader();
    
    // Toolbar
    const toolbar = this.createToolbar();

    // Content area
    const content = document.createElement('div');
    content.id = 'library-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    `;

    container.appendChild(header);
    container.appendChild(toolbar);
    container.appendChild(content);

    return container;
  }

  /**
   * Create header with search
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid var(--border-color, #444444);
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const title = document.createElement('h3');
    title.textContent = '🎛️ Sound Design Library';
    title.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      flex: 1;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search presets...';
    searchInput.style.cssText = `
      flex: 2;
      padding: 6px 12px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 13px;
    `;
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      this.filterPresets();
    });

    const newButton = document.createElement('button');
    newButton.textContent = '+ New';
    newButton.style.cssText = `
      padding: 6px 16px;
      border: none;
      border-radius: 4px;
      background: var(--accent-color, #3399ff);
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    `;
    newButton.addEventListener('click', () => {
      this.showNewPresetDialog();
    });

    header.appendChild(title);
    header.appendChild(searchInput);
    header.appendChild(newButton);

    return header;
  }

  /**
   * Create toolbar with filters and view options
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #444444);
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    `;

    // Category filter
    const categorySelect = document.createElement('select');
    categorySelect.style.cssText = `
      padding: 4px 8px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 12px;
      cursor: pointer;
    `;

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = '📚 All Categories';
    categorySelect.appendChild(allOption);

    PRESET_CATEGORIES.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon} ${cat.name}`;
      categorySelect.appendChild(option);
    });

    categorySelect.addEventListener('change', () => {
      this.selectedCategory = categorySelect.value || null;
      this.filterPresets();
    });

    // Sort selector
    const sortSelect = document.createElement('select');
    sortSelect.style.cssText = categorySelect.style.cssText;

    const sortOptions = [
      { value: 'name', label: 'Name' },
      { value: 'recent', label: 'Recently Modified' },
      { value: 'usage', label: 'Most Used' }
    ];

    sortOptions.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = `Sort: ${opt.label}`;
      option.selected = this.sortBy === opt.value;
      sortSelect.appendChild(option);
    });

    sortSelect.addEventListener('change', () => {
      this.sortBy = sortSelect.value as typeof this.sortBy;
      this.filterPresets();
    });

    // View mode toggle
    const viewToggle = document.createElement('div');
    viewToggle.style.cssText = `
      display: flex;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      overflow: hidden;
    `;

    const gridBtn = this.createViewModeButton('grid', '⊞');
    const listBtn = this.createViewModeButton('list', '☰');

    viewToggle.appendChild(gridBtn);
    viewToggle.appendChild(listBtn);

    // Favorites filter
    const favoritesBtn = document.createElement('button');
    favoritesBtn.textContent = '★ Favorites';
    favoritesBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: transparent;
      color: var(--text-secondary, #cccccc);
      font-size: 12px;
      cursor: pointer;
    `;

    let showingFavorites = false;
    favoritesBtn.addEventListener('click', () => {
      showingFavorites = !showingFavorites;
      favoritesBtn.style.background = showingFavorites ? 'var(--accent-color, #3399ff)' : 'transparent';
      favoritesBtn.style.color = showingFavorites ? 'white' : 'var(--text-secondary, #cccccc)';
      this.filterPresets();
    });

    // Store favorites state for filtering
    (toolbar as any).__showingFavorites = () => showingFavorites;

    toolbar.appendChild(categorySelect);
    toolbar.appendChild(sortSelect);
    toolbar.appendChild(viewToggle);
    toolbar.appendChild(favoritesBtn);

    return toolbar;
  }

  /**
   * Create view mode toggle button
   */
  private createViewModeButton(mode: 'grid' | 'list', icon: string): HTMLElement {
    const btn = document.createElement('button');
    btn.textContent = icon;
    btn.style.cssText = `
      padding: 4px 12px;
      border: none;
      background: ${this.viewMode === mode ? 'var(--accent-color, #3399ff)' : 'transparent'};
      color: var(--text-primary, #ffffff);
      cursor: pointer;
      font-size: 14px;
    `;

    btn.addEventListener('click', () => {
      this.viewMode = mode;
      this.renderPresets();
      
      // Update all view buttons
      const parent = btn.parentElement;
      if (parent) {
        Array.from(parent.children).forEach((child, idx) => {
          (child as HTMLElement).style.background =
            (idx === 0 && mode === 'grid') || (idx === 1 && mode === 'list')
              ? 'var(--accent-color, #3399ff)'
              : 'transparent';
        });
      }
    });

    return btn;
  }

  /**
   * Filter presets based on current criteria
   */
  private filterPresets(): void {
    const toolbar = this.container.querySelector('[style*="border-bottom"]')?.parentElement?.children[1] as any;
    const showingFavorites = toolbar?.__showingFavorites?.() ?? false;

    this.filteredPresets = this.config.presets.filter((preset) => {
      // Category filter
      if (this.selectedCategory && preset.category !== this.selectedCategory) {
        return false;
      }

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesName = preset.name.toLowerCase().includes(query);
        const matchesTags = preset.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesDescription = preset.description?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesTags && !matchesDescription) {
          return false;
        }
      }

      // Favorites filter
      if (showingFavorites && !preset.isFavorite) {
        return false;
      }

      return true;
    });

    // Sort
    this.filteredPresets.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return b.dateModified - a.dateModified;
        case 'usage':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });

    this.renderPresets();
  }

  /**
   * Render presets in current view mode
   */
  private renderPresets(): void {
    const content = this.container.querySelector('#library-content');
    if (!content) return;

    content.innerHTML = '';

    if (this.filteredPresets.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No presets found';
      empty.style.cssText = `
        text-align: center;
        padding: 48px;
        color: var(--text-tertiary, #888888);
        font-size: 14px;
      `;
      content.appendChild(empty);
      return;
    }

    const presetsContainer = document.createElement('div');
    presetsContainer.style.cssText =
      this.viewMode === 'grid'
        ? `
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        `
        : `
          display: flex;
          flex-direction: column;
          gap: 8px;
        `;

    this.filteredPresets.forEach((preset) => {
      const card =
        this.viewMode === 'grid'
          ? this.createPresetCardGrid(preset)
          : this.createPresetCardList(preset);
      presetsContainer.appendChild(card);
    });

    content.appendChild(presetsContainer);
  }

  /**
   * Create preset card (grid view)
   */
  private createPresetCardGrid(preset: PresetMetadata): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 16px;
      background: var(--card-background, #333333);
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      position: relative;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });

    card.addEventListener('click', () => {
      this.config.onLoadPreset(preset.id);
    });

    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.textContent = preset.isFavorite ? '★' : '☆';
    favoriteBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      border: none;
      background: rgba(0, 0, 0, 0.5);
      color: ${preset.isFavorite ? '#ffd700' : '#cccccc'};
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    `;
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      preset.isFavorite = !preset.isFavorite;
      if (this.config.onSavePreset) {
        this.config.onSavePreset({ id: preset.id, isFavorite: preset.isFavorite });
      }
      this.filterPresets();
    });

    const name = document.createElement('div');
    name.textContent = preset.name;
    name.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #ffffff);
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;

    const category = document.createElement('div');
    const catInfo = PRESET_CATEGORIES.find((c) => c.id === preset.category);
    category.textContent = catInfo ? `${catInfo.icon} ${catInfo.name}` : preset.category;
    category.style.cssText = `
      font-size: 11px;
      color: var(--text-tertiary, #888888);
      margin-bottom: 8px;
    `;

    const tags = document.createElement('div');
    tags.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    `;

    preset.tags.slice(0, 3).forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.textContent = tag;
      tagEl.style.cssText = `
        padding: 2px 6px;
        background: var(--tag-background, #444444);
        color: var(--text-tertiary, #888888);
        border-radius: 3px;
        font-size: 10px;
      `;
      tags.appendChild(tagEl);
    });

    card.appendChild(favoriteBtn);
    card.appendChild(name);
    card.appendChild(category);
    card.appendChild(tags);

    return card;
  }

  /**
   * Create preset card (list view)
   */
  private createPresetCardList(preset: PresetMetadata): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 12px;
      background: var(--card-background, #333333);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: background 0.15s;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.background = 'var(--hover-background, #3a3a3a)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = 'var(--card-background, #333333)';
    });

    card.addEventListener('click', () => {
      this.config.onLoadPreset(preset.id);
    });

    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.textContent = preset.isFavorite ? '★' : '☆';
    favoriteBtn.style.cssText = `
      padding: 4px 8px;
      border: none;
      background: transparent;
      color: ${preset.isFavorite ? '#ffd700' : '#cccccc'};
      cursor: pointer;
      font-size: 16px;
    `;
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      preset.isFavorite = !preset.isFavorite;
      if (this.config.onSavePreset) {
        this.config.onSavePreset({ id: preset.id, isFavorite: preset.isFavorite });
      }
      this.filterPresets();
    });

    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';

    const name = document.createElement('div');
    name.textContent = preset.name;
    name.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #ffffff);
      margin-bottom: 2px;
    `;

    const meta = document.createElement('div');
    const catInfo = PRESET_CATEGORIES.find((c) => c.id === preset.category);
    meta.textContent = `${catInfo ? `${catInfo.icon} ${catInfo.name}` : preset.category} • Used ${preset.usageCount} times`;
    meta.style.cssText = `
      font-size: 11px;
      color: var(--text-tertiary, #888888);
    `;

    info.appendChild(name);
    info.appendChild(meta);

    card.appendChild(favoriteBtn);
    card.appendChild(info);

    return card;
  }

  /**
   * Show new preset dialog
   */
  private showNewPresetDialog(): void {
    // Implement new preset creation dialog
    console.log('New preset dialog');
  }
}

/**
 * Create sound design library deck
 */
export function createSoundDesignLibraryDeck(
  config: SoundDesignLibraryConfig
): HTMLElement {
  const library = new SoundDesignLibraryDeck(config);
  return library.getElement();
}
