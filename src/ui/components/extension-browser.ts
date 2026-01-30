/**
 * @fileoverview Extension Browser UI Component
 * 
 * Provides a beautiful browser interface for discovering, installing, and managing
 * extensions. Shows installed extensions, available extensions (local discovery),
 * and allows enable/disable/uninstall actions.
 * 
 * Implements O125-O132 from roadmap:
 * - O125: Extension browser UI
 * - O126: Installed extensions list
 * - O127: Available extensions list (local discovery)
 * - O128: "Install Extension" action (from file)
 * - O129: "Uninstall Extension" action
 * - O130: "Enable/Disable Extension" toggle
 * 
 * @module @cardplay/ui/components/extension-browser
 */

import type {
  ExtensionManifest,
  ExtensionCategory,
  ExtensionState,
} from '../../extensions/types';
import { extensionRegistry } from '../../extensions/registry';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtensionBrowserConfig {
  readonly onInstall?: (extensionPath: string) => Promise<void>;
  readonly onUninstall?: (extensionId: string) => Promise<void>;
  readonly onEnable?: (extensionId: string) => Promise<void>;
  readonly onDisable?: (extensionId: string) => Promise<void>;
  readonly onRefresh?: () => Promise<void>;
}

interface ExtensionListItem {
  readonly manifest: ExtensionManifest;
  readonly state: ExtensionState;
  readonly installedAt?: Date;
  readonly error?: string;
}

type ExtensionFilter = 'all' | ExtensionCategory;
type ExtensionSort = 'name' | 'author' | 'date' | 'category';

// ============================================================================
// EXTENSION BROWSER COMPONENT
// ============================================================================

export class ExtensionBrowser {
  private container: HTMLElement;
  private config: ExtensionBrowserConfig;
  private currentFilter: ExtensionFilter = 'all';
  private currentSort: ExtensionSort = 'name';
  private searchQuery = '';
  private registry = extensionRegistry;

  constructor(container: HTMLElement, config: ExtensionBrowserConfig = {}) {
    this.container = container;
    this.config = config;
    this.render();
  }

  destroy(): void {
    this.container.innerHTML = '';
  }

  refresh(): void {
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'extension-browser';

    // Header with search and filters
    const header = this.createHeader();
    this.container.appendChild(header);

    // Tabs: Installed | Available
    const tabs = this.createTabs();
    this.container.appendChild(tabs);

    // Extension list
    const list = this.createExtensionList();
    this.container.appendChild(list);

    // Actions
    const actions = this.createActions();
    this.container.appendChild(actions);

    this.applyStyles();
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'extension-browser-header';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Extensions';
    title.className = 'extension-browser-title';
    header.appendChild(title);

    // Search bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'extension-browser-search';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search extensions...';
    searchInput.className = 'extension-browser-search-input';
    searchInput.value = this.searchQuery;
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.refresh();
    });
    searchContainer.appendChild(searchInput);

    const searchIcon = document.createElement('span');
    searchIcon.textContent = '🔍';
    searchIcon.className = 'extension-browser-search-icon';
    searchContainer.appendChild(searchIcon);

    header.appendChild(searchContainer);

    // Filter dropdown
    const filterContainer = document.createElement('div');
    filterContainer.className = 'extension-browser-filter';

    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Category: ';
    filterLabel.className = 'extension-browser-filter-label';
    filterContainer.appendChild(filterLabel);

    const filterSelect = document.createElement('select');
    filterSelect.className = 'extension-browser-filter-select';
    const categories: ExtensionFilter[] = ['all', 'card', 'deck', 'board', 'generator', 'effect', 'prolog', 'theme', 'utility'];
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1);
      option.selected = cat === this.currentFilter;
      filterSelect.appendChild(option);
    });
    filterSelect.addEventListener('change', (e) => {
      this.currentFilter = (e.target as HTMLSelectElement).value as ExtensionFilter;
      this.refresh();
    });
    filterContainer.appendChild(filterSelect);

    header.appendChild(filterContainer);

    // Sort dropdown
    const sortContainer = document.createElement('div');
    sortContainer.className = 'extension-browser-sort';

    const sortLabel = document.createElement('label');
    sortLabel.textContent = 'Sort: ';
    sortLabel.className = 'extension-browser-sort-label';
    sortContainer.appendChild(sortLabel);

    const sortSelect = document.createElement('select');
    sortSelect.className = 'extension-browser-sort-select';
    const sortOptions: Array<{ value: ExtensionSort; label: string }> = [
      { value: 'name', label: 'Name' },
      { value: 'author', label: 'Author' },
      { value: 'date', label: 'Date' },
      { value: 'category', label: 'Category' },
    ];
    sortOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = opt.value === this.currentSort;
      sortSelect.appendChild(option);
    });
    sortSelect.addEventListener('change', (e) => {
      this.currentSort = (e.target as HTMLSelectElement).value as ExtensionSort;
      this.refresh();
    });
    sortContainer.appendChild(sortSelect);

    header.appendChild(sortContainer);

    return header;
  }

  private createTabs(): HTMLElement {
    const tabs = document.createElement('div');
    tabs.className = 'extension-browser-tabs';
    tabs.setAttribute('role', 'tablist');

    const installedTab = document.createElement('button');
    installedTab.textContent = `Installed (${this.getInstalledExtensions().length})`;
    installedTab.className = 'extension-browser-tab extension-browser-tab-active';
    installedTab.setAttribute('role', 'tab');
    installedTab.setAttribute('aria-selected', 'true');
    tabs.appendChild(installedTab);

    const availableTab = document.createElement('button');
    availableTab.textContent = 'Available';
    availableTab.className = 'extension-browser-tab';
    availableTab.setAttribute('role', 'tab');
    availableTab.setAttribute('aria-selected', 'false');
    tabs.appendChild(availableTab);

    return tabs;
  }

  private createExtensionList(): HTMLElement {
    const list = document.createElement('div');
    list.className = 'extension-browser-list';
    list.setAttribute('role', 'list');

    const extensions = this.getFilteredExtensions();

    if (extensions.length === 0) {
      const empty = this.createEmptyState();
      list.appendChild(empty);
      return list;
    }

    extensions.forEach(ext => {
      const item = this.createExtensionItem(ext);
      list.appendChild(item);
    });

    return list;
  }

  private createEmptyState(): HTMLElement {
    const empty = document.createElement('div');
    empty.className = 'extension-browser-empty';

    const icon = document.createElement('div');
    icon.textContent = '📦';
    icon.className = 'extension-browser-empty-icon';
    empty.appendChild(icon);

    const message = document.createElement('p');
    message.textContent = this.searchQuery
      ? 'No extensions found matching your search.'
      : 'No extensions installed yet. Install extensions to add custom functionality.';
    message.className = 'extension-browser-empty-message';
    empty.appendChild(message);

    return empty;
  }

  private createExtensionItem(ext: ExtensionListItem): HTMLElement {
    const item = document.createElement('div');
    item.className = 'extension-browser-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('data-extension-id', ext.manifest.id);

    // Icon and category badge
    const iconContainer = document.createElement('div');
    iconContainer.className = 'extension-browser-item-icon';
    
    const icon = document.createElement('span');
    icon.textContent = this.getCategoryIcon(ext.manifest.category);
    icon.className = 'extension-browser-item-icon-emoji';
    iconContainer.appendChild(icon);

    const categoryBadge = document.createElement('span');
    categoryBadge.textContent = ext.manifest.category;
    categoryBadge.className = 'extension-browser-item-category';
    iconContainer.appendChild(categoryBadge);

    item.appendChild(iconContainer);

    // Info section
    const info = document.createElement('div');
    info.className = 'extension-browser-item-info';

    const nameRow = document.createElement('div');
    nameRow.className = 'extension-browser-item-name-row';

    const name = document.createElement('h3');
    name.textContent = ext.manifest.name;
    name.className = 'extension-browser-item-name';
    nameRow.appendChild(name);

    const version = document.createElement('span');
    version.textContent = `v${ext.manifest.version}`;
    version.className = 'extension-browser-item-version';
    nameRow.appendChild(version);

    info.appendChild(nameRow);

    const author = document.createElement('p');
    author.textContent = `by ${ext.manifest.author}`;
    author.className = 'extension-browser-item-author';
    info.appendChild(author);

    const description = document.createElement('p');
    description.textContent = ext.manifest.description;
    description.className = 'extension-browser-item-description';
    info.appendChild(description);

    // Tags
    if (ext.manifest.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'extension-browser-item-tags';
      ext.manifest.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.textContent = tag;
        tagSpan.className = 'extension-browser-item-tag';
        tagsContainer.appendChild(tagSpan);
      });
      info.appendChild(tagsContainer);
    }

    item.appendChild(info);

    // State and actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'extension-browser-item-actions';

    const stateBadge = this.createStateBadge(ext.state);
    actionsContainer.appendChild(stateBadge);

    if (ext.error) {
      const errorMsg = document.createElement('p');
      errorMsg.textContent = ext.error;
      errorMsg.className = 'extension-browser-item-error';
      actionsContainer.appendChild(errorMsg);
    }

    const buttons = this.createItemButtons(ext);
    actionsContainer.appendChild(buttons);

    item.appendChild(actionsContainer);

    return item;
  }

  private createStateBadge(state: ExtensionState): HTMLElement {
    const badge = document.createElement('span');
    badge.className = `extension-browser-state-badge extension-browser-state-${state}`;
    badge.textContent = state.charAt(0).toUpperCase() + state.slice(1);
    return badge;
  }

  private createItemButtons(ext: ExtensionListItem): HTMLElement {
    const buttons = document.createElement('div');
    buttons.className = 'extension-browser-item-buttons';

    if (ext.state === 'enabled') {
      const disableBtn = document.createElement('button');
      disableBtn.textContent = 'Disable';
      disableBtn.className = 'extension-browser-btn extension-browser-btn-secondary';
      disableBtn.onclick = async () => {
        if (this.config.onDisable) {
          await this.config.onDisable(ext.manifest.id);
          this.refresh();
        }
      };
      buttons.appendChild(disableBtn);
    }

    if (ext.state === 'disabled' || ext.state === 'installed') {
      const enableBtn = document.createElement('button');
      enableBtn.textContent = 'Enable';
      enableBtn.className = 'extension-browser-btn extension-browser-btn-primary';
      enableBtn.onclick = async () => {
        if (this.config.onEnable) {
          await this.config.onEnable(ext.manifest.id);
          this.refresh();
        }
      };
      buttons.appendChild(enableBtn);
    }

    if (ext.state !== 'uninstalled' && ext.state !== 'installing') {
      const uninstallBtn = document.createElement('button');
      uninstallBtn.textContent = 'Uninstall';
      uninstallBtn.className = 'extension-browser-btn extension-browser-btn-danger';
      uninstallBtn.onclick = async () => {
        if (confirm(`Are you sure you want to uninstall ${ext.manifest.name}?`)) {
          if (this.config.onUninstall) {
            await this.config.onUninstall(ext.manifest.id);
            this.refresh();
          }
        }
      };
      buttons.appendChild(uninstallBtn);
    }

    return buttons;
  }

  private createActions(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'extension-browser-actions';

    const installBtn = document.createElement('button');
    installBtn.textContent = '+ Install from File';
    installBtn.className = 'extension-browser-btn extension-browser-btn-primary';
    installBtn.onclick = () => this.openInstallDialog();
    actions.appendChild(installBtn);

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄 Refresh';
    refreshBtn.className = 'extension-browser-btn extension-browser-btn-secondary';
    refreshBtn.onclick = async () => {
      if (this.config.onRefresh) {
        await this.config.onRefresh();
        this.refresh();
      }
    };
    actions.appendChild(refreshBtn);

    return actions;
  }

  private openInstallDialog(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zip';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && this.config.onInstall) {
        try {
          await this.config.onInstall(file.name);
          this.refresh();
        } catch (error) {
          alert(`Failed to install extension: ${error}`);
        }
      }
    };
    input.click();
  }

  private getInstalledExtensions(): ExtensionListItem[] {
    return this.registry.listExtensions().map((ext: any) => ({
      manifest: ext.manifest,
      state: ext.state,
      installedAt: ext.installedAt,
      error: ext.error,
    }));
  }

  private getFilteredExtensions(): ExtensionListItem[] {
    let extensions = this.getInstalledExtensions();

    // Apply category filter
    if (this.currentFilter !== 'all') {
      extensions = extensions.filter((ext: ExtensionListItem) => ext.manifest.category === this.currentFilter);
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      extensions = extensions.filter(ext =>
        ext.manifest.name.toLowerCase().includes(query) ||
        ext.manifest.author.toLowerCase().includes(query) ||
        ext.manifest.description.toLowerCase().includes(query) ||
        ext.manifest.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sort
    extensions.sort((a, b) => {
      switch (this.currentSort) {
        case 'name':
          return a.manifest.name.localeCompare(b.manifest.name);
        case 'author':
          return a.manifest.author.localeCompare(b.manifest.author);
        case 'date':
          return (b.installedAt?.getTime() ?? 0) - (a.installedAt?.getTime() ?? 0);
        case 'category':
          return a.manifest.category.localeCompare(b.manifest.category);
        default:
          return 0;
      }
    });

    return extensions;
  }

  private getCategoryIcon(category: ExtensionCategory): string {
    const icons: Record<ExtensionCategory, string> = {
      card: '🃏',
      deck: '🎴',
      board: '🎛️',
      generator: '🎵',
      effect: '🎚️',
      prolog: '🧠',
      theme: '🎨',
      utility: '🔧',
    };
    return icons[category] || '📦';
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .extension-browser {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 16px);
        padding: var(--spacing-lg, 24px);
        background: var(--color-bg, #1a1a1a);
        color: var(--color-text, #e0e0e0);
        border-radius: var(--radius-lg, 8px);
        max-height: 600px;
        overflow: hidden;
      }

      .extension-browser-header {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-md, 16px);
        align-items: center;
      }

      .extension-browser-title {
        font-size: var(--font-size-xl, 24px);
        font-weight: var(--font-weight-bold, 700);
        margin: 0;
      }

      .extension-browser-search {
        position: relative;
        flex: 1;
        min-width: 200px;
      }

      .extension-browser-search-input {
        width: 100%;
        padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
        padding-left: 36px;
        border: 1px solid var(--color-border, #333);
        border-radius: var(--radius-md, 4px);
        background: var(--color-bg-elevated, #2a2a2a);
        color: var(--color-text, #e0e0e0);
        font-size: var(--font-size-md, 14px);
      }

      .extension-browser-search-input:focus {
        outline: 2px solid var(--color-primary, #4a9eff);
        outline-offset: 2px;
      }

      .extension-browser-search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
      }

      .extension-browser-filter,
      .extension-browser-sort {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
      }

      .extension-browser-filter-label,
      .extension-browser-sort-label {
        font-size: var(--font-size-sm, 12px);
        color: var(--color-text-secondary, #888);
      }

      .extension-browser-filter-select,
      .extension-browser-sort-select {
        padding: var(--spacing-sm, 8px);
        border: 1px solid var(--color-border, #333);
        border-radius: var(--radius-md, 4px);
        background: var(--color-bg-elevated, #2a2a2a);
        color: var(--color-text, #e0e0e0);
        font-size: var(--font-size-sm, 12px);
      }

      .extension-browser-tabs {
        display: flex;
        gap: var(--spacing-xs, 4px);
        border-bottom: 1px solid var(--color-border, #333);
      }

      .extension-browser-tab {
        padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
        border: none;
        background: transparent;
        color: var(--color-text-secondary, #888);
        cursor: pointer;
        font-size: var(--font-size-md, 14px);
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }

      .extension-browser-tab:hover {
        color: var(--color-text, #e0e0e0);
      }

      .extension-browser-tab-active {
        color: var(--color-primary, #4a9eff);
        border-bottom-color: var(--color-primary, #4a9eff);
      }

      .extension-browser-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 16px);
      }

      .extension-browser-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-xl, 32px);
        text-align: center;
      }

      .extension-browser-empty-icon {
        font-size: 48px;
        margin-bottom: var(--spacing-md, 16px);
      }

      .extension-browser-empty-message {
        color: var(--color-text-secondary, #888);
        font-size: var(--font-size-md, 14px);
      }

      .extension-browser-item {
        display: flex;
        gap: var(--spacing-md, 16px);
        padding: var(--spacing-md, 16px);
        background: var(--color-bg-elevated, #2a2a2a);
        border: 1px solid var(--color-border, #333);
        border-radius: var(--radius-md, 4px);
        transition: border-color 0.2s;
      }

      .extension-browser-item:hover {
        border-color: var(--color-primary, #4a9eff);
      }

      .extension-browser-item-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        min-width: 80px;
      }

      .extension-browser-item-icon-emoji {
        font-size: 32px;
      }

      .extension-browser-item-category {
        font-size: var(--font-size-xs, 10px);
        padding: 2px 6px;
        background: var(--color-primary-alpha, rgba(74, 158, 255, 0.2));
        color: var(--color-primary, #4a9eff);
        border-radius: var(--radius-sm, 2px);
        text-transform: uppercase;
      }

      .extension-browser-item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs, 4px);
      }

      .extension-browser-item-name-row {
        display: flex;
        align-items: baseline;
        gap: var(--spacing-sm, 8px);
      }

      .extension-browser-item-name {
        font-size: var(--font-size-lg, 16px);
        font-weight: var(--font-weight-bold, 700);
        margin: 0;
      }

      .extension-browser-item-version {
        font-size: var(--font-size-sm, 12px);
        color: var(--color-text-secondary, #888);
      }

      .extension-browser-item-author {
        font-size: var(--font-size-sm, 12px);
        color: var(--color-text-secondary, #888);
        margin: 0;
      }

      .extension-browser-item-description {
        font-size: var(--font-size-md, 14px);
        color: var(--color-text, #e0e0e0);
        margin: 0;
      }

      .extension-browser-item-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs, 4px);
        margin-top: var(--spacing-xs, 4px);
      }

      .extension-browser-item-tag {
        font-size: var(--font-size-xs, 10px);
        padding: 2px 6px;
        background: var(--color-bg, #1a1a1a);
        border: 1px solid var(--color-border, #333);
        border-radius: var(--radius-sm, 2px);
        color: var(--color-text-secondary, #888);
      }

      .extension-browser-item-actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm, 8px);
        align-items: flex-end;
      }

      .extension-browser-state-badge {
        font-size: var(--font-size-xs, 10px);
        padding: 4px 8px;
        border-radius: var(--radius-sm, 2px);
        font-weight: var(--font-weight-bold, 700);
        text-transform: uppercase;
      }

      .extension-browser-state-enabled {
        background: var(--color-success-alpha, rgba(76, 175, 80, 0.2));
        color: var(--color-success, #4caf50);
      }

      .extension-browser-state-disabled {
        background: var(--color-warning-alpha, rgba(255, 152, 0, 0.2));
        color: var(--color-warning, #ff9800);
      }

      .extension-browser-state-error {
        background: var(--color-error-alpha, rgba(244, 67, 54, 0.2));
        color: var(--color-error, #f44336);
      }

      .extension-browser-state-installing {
        background: var(--color-info-alpha, rgba(33, 150, 243, 0.2));
        color: var(--color-info, #2196f3);
      }

      .extension-browser-item-error {
        font-size: var(--font-size-xs, 10px);
        color: var(--color-error, #f44336);
        margin: 0;
        max-width: 200px;
      }

      .extension-browser-item-buttons {
        display: flex;
        gap: var(--spacing-xs, 4px);
      }

      .extension-browser-btn {
        padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        border: none;
        border-radius: var(--radius-sm, 2px);
        font-size: var(--font-size-sm, 12px);
        font-weight: var(--font-weight-medium, 500);
        cursor: pointer;
        transition: all 0.2s;
      }

      .extension-browser-btn-primary {
        background: var(--color-primary, #4a9eff);
        color: white;
      }

      .extension-browser-btn-primary:hover {
        background: var(--color-primary-hover, #3a8eef);
      }

      .extension-browser-btn-secondary {
        background: var(--color-bg, #1a1a1a);
        color: var(--color-text, #e0e0e0);
        border: 1px solid var(--color-border, #333);
      }

      .extension-browser-btn-secondary:hover {
        border-color: var(--color-primary, #4a9eff);
      }

      .extension-browser-btn-danger {
        background: var(--color-error, #f44336);
        color: white;
      }

      .extension-browser-btn-danger:hover {
        background: var(--color-error-hover, #e43326);
      }

      .extension-browser-actions {
        display: flex;
        gap: var(--spacing-md, 16px);
        padding-top: var(--spacing-md, 16px);
        border-top: 1px solid var(--color-border, #333);
      }
    `;
    if (!document.head.querySelector('style[data-extension-browser]')) {
      style.setAttribute('data-extension-browser', '');
      document.head.appendChild(style);
    }
  }
}
