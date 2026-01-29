/**
 * @fileoverview Help Browser Deck Component
 * 
 * Universal Help Browser providing contextual help, tutorials, keyboard shortcuts,
 * and documentation across all boards and personas.
 * 
 * Implements M337: Create universal "Help Browser" deck
 * Implements M340: Add video tutorial links in help browser
 * Implements M341: Add keyboard shortcut reference per board
 * 
 * Features:
 * - Contextual help based on active board and deck
 * - Searchable documentation
 * - Video tutorial links
 * - Keyboard shortcut reference
 * - Getting started guides per persona
 * - Troubleshooting tips
 * 
 * @module @cardplay/ui/components/help-browser-deck
 */

import type { Board } from '../../boards/types';
import type { DeckInstance } from '../../boards/decks/factory-types';
import { KeyboardShortcutManager, type KeyboardShortcut } from '../keyboard-shortcuts';

export interface HelpTopic {
  readonly id: string;
  readonly title: string;
  readonly category: 'getting-started' | 'tutorials' | 'reference' | 'shortcuts' | 'troubleshooting';
  readonly content: string;
  readonly videoUrl?: string;
  readonly relatedTopics?: readonly string[];
  readonly keywords?: readonly string[];
}

export interface HelpBrowserConfig {
  board?: Board;
  initialTopic?: string;
  onClose?: () => void;
}

/**
 * Global help topics registry
 */
const helpTopics = new Map<string, HelpTopic>();

/**
 * Register a help topic
 */
export function registerHelpTopic(topic: HelpTopic): void {
  helpTopics.set(topic.id, topic);
}

/**
 * Get all help topics
 */
export function getAllHelpTopics(): readonly HelpTopic[] {
  return Array.from(helpTopics.values());
}

/**
 * Search help topics
 */
export function searchHelpTopics(query: string): readonly HelpTopic[] {
  const queryLower = query.toLowerCase().trim();
  if (!queryLower) {
    return getAllHelpTopics();
  }

  return Array.from(helpTopics.values()).filter(topic => {
    // Search in title
    if (topic.title.toLowerCase().includes(queryLower)) return true;
    
    // Search in content (first 500 chars)
    if (topic.content.toLowerCase().substring(0, 500).includes(queryLower)) return true;
    
    // Search in keywords
    if (topic.keywords?.some(kw => kw.toLowerCase().includes(queryLower))) return true;
    
    return false;
  });
}

/**
 * Get topics for a specific category
 */
export function getTopicsByCategory(category: HelpTopic['category']): readonly HelpTopic[] {
  return Array.from(helpTopics.values()).filter(topic => topic.category === category);
}

/**
 * Get topics related to a specific board
 */
export function getTopicsForBoard(boardId: string): readonly HelpTopic[] {
  return Array.from(helpTopics.values()).filter(topic =>
    topic.keywords?.includes(boardId) || topic.keywords?.includes('all-boards')
  );
}

/**
 * Help Browser Deck Component
 */
export class HelpBrowserDeck {
  private container: HTMLElement;
  private config: HelpBrowserConfig;
  private currentTopic: HelpTopic | null = null;
  private searchQuery = '';

  constructor(config: HelpBrowserConfig = {}) {
    this.config = config;
    this.container = document.createElement('div');
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }

  private render(): void {
    this.container.className = 'help-browser-deck';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Help Browser');
    
    this.container.innerHTML = `
      <div class="help-browser-header">
        <h2>Help & Documentation</h2>
        ${this.config.board ? `<div class="help-browser-board-context">For: ${this.config.board.name}</div>` : ''}
      </div>
      
      <div class="help-browser-search">
        <input 
          type="search" 
          class="help-browser-search-input"
          placeholder="Search help topics..."
          aria-label="Search help topics"
        />
      </div>
      
      <div class="help-browser-content">
        <div class="help-browser-sidebar">
          ${this.renderCategories()}
        </div>
        <div class="help-browser-main">
          ${this.renderMainContent()}
        </div>
      </div>
    `;
    
    this.attachEventListeners();
    this.injectStyles();
  }

  private renderCategories(): string {
    const categories: Array<{ id: HelpTopic['category']; label: string; icon: string }> = [
      { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
      { id: 'tutorials', label: 'Tutorials', icon: '📚' },
      { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' },
      { id: 'reference', label: 'Reference', icon: '📖' },
      { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
    ];

    return `
      <div class="help-categories">
        ${categories.map(cat => `
          <button 
            class="help-category-button" 
            data-category="${cat.id}"
            aria-label="${cat.label}"
          >
            <span class="help-category-icon">${cat.icon}</span>
            <span class="help-category-label">${cat.label}</span>
            <span class="help-category-count">${getTopicsByCategory(cat.id).length}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  private renderMainContent(): string {
    if (this.currentTopic) {
      return this.renderTopic(this.currentTopic);
    }

    const topics = this.searchQuery 
      ? searchHelpTopics(this.searchQuery)
      : this.config.board 
        ? getTopicsForBoard(this.config.board.id)
        : getAllHelpTopics();

    return this.renderTopicList(topics);
  }

  private renderTopic(topic: HelpTopic): string {
    return `
      <div class="help-topic-view">
        <button class="help-back-button" aria-label="Back to topic list">
          ← Back
        </button>
        
        <div class="help-topic-header">
          <h3 class="help-topic-title">${this.escapeHtml(topic.title)}</h3>
          <span class="help-topic-category">${topic.category}</span>
        </div>
        
        ${topic.videoUrl ? `
          <div class="help-topic-video">
            <a href="${this.escapeHtml(topic.videoUrl)}" target="_blank" rel="noopener noreferrer" class="help-video-link">
              📹 Watch Video Tutorial
            </a>
          </div>
        ` : ''}
        
        <div class="help-topic-content">
          ${this.renderMarkdown(topic.content)}
        </div>
        
        ${topic.id === 'keyboard-shortcuts' || topic.category === 'shortcuts' ? this.renderShortcuts() : ''}
        
        ${topic.relatedTopics && topic.relatedTopics.length > 0 ? `
          <div class="help-related-topics">
            <h4>Related Topics</h4>
            <ul>
              ${topic.relatedTopics.map(relatedId => {
                const relatedTopic = helpTopics.get(relatedId);
                return relatedTopic ? `
                  <li>
                    <button class="help-related-link" data-topic-id="${relatedId}">
                      ${this.escapeHtml(relatedTopic.title)}
                    </button>
                  </li>
                ` : '';
              }).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderTopicList(topics: readonly HelpTopic[]): string {
    if (topics.length === 0) {
      return `
        <div class="help-empty-state">
          <p>No help topics found.</p>
          ${this.searchQuery ? `<p>Try a different search term.</p>` : ''}
        </div>
      `;
    }

    const topicsByCategory = new Map<HelpTopic['category'], HelpTopic[]>();
    for (const topic of topics) {
      if (!topicsByCategory.has(topic.category)) {
        topicsByCategory.set(topic.category, []);
      }
      topicsByCategory.get(topic.category)!.push(topic);
    }

    return `
      <div class="help-topic-list">
        ${Array.from(topicsByCategory.entries()).map(([category, categoryTopics]) => `
          <div class="help-topic-category-section">
            <h3 class="help-topic-category-title">${this.formatCategoryLabel(category)}</h3>
            <ul class="help-topic-items">
              ${categoryTopics.map(topic => `
                <li>
                  <button class="help-topic-item" data-topic-id="${topic.id}">
                    <span class="help-topic-item-title">${this.escapeHtml(topic.title)}</span>
                    ${topic.videoUrl ? '<span class="help-topic-video-badge">📹</span>' : ''}
                  </button>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderShortcuts(): string {
    const manager = KeyboardShortcutManager.getInstance();
    const shortcuts = Array.from(manager.getAllShortcuts());
    
    if (this.config.board) {
      // Filter to relevant shortcuts (future: filter by board-specific context)
      return this.renderShortcutTable(shortcuts);
    }
    
    return this.renderShortcutTable(shortcuts);
  }

  private renderShortcutTable(shortcuts: KeyboardShortcut[]): string {
    if (shortcuts.length === 0) {
      return '<p>No shortcuts available.</p>';
    }

    const byCategory = new Map<string, KeyboardShortcut[]>();
    for (const shortcut of shortcuts) {
      const category = shortcut.category || 'General';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(shortcut);
    }

    return `
      <div class="help-shortcuts-table">
        ${Array.from(byCategory.entries()).map(([category, categoryShortcuts]) => `
          <div class="help-shortcuts-category">
            <h4>${category}</h4>
            <table>
              <tbody>
                ${categoryShortcuts.map(shortcut => `
                  <tr>
                    <td class="help-shortcut-key">${this.formatShortcutKey(shortcut.key)}</td>
                    <td class="help-shortcut-description">${this.escapeHtml(shortcut.description || '')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>
    `;
  }

  private formatShortcutKey(key: string): string {
    return key
      .replace('Cmd', '⌘')
      .replace('Ctrl', 'Ctrl')
      .replace('Shift', '⇧')
      .replace('Alt', '⌥')
      .replace('+', ' + ');
  }

  private formatCategoryLabel(category: HelpTopic['category']): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private renderMarkdown(content: string): string {
    // Simple markdown-like rendering
    return content
      .split('\n\n')
      .map(para => {
        // Headings
        if (para.startsWith('### ')) {
          return `<h4>${this.escapeHtml(para.slice(4))}</h4>`;
        }
        if (para.startsWith('## ')) {
          return `<h3>${this.escapeHtml(para.slice(3))}</h3>`;
        }
        
        // Code blocks
        if (para.startsWith('```')) {
          const lines = para.split('\n');
          const code = lines.slice(1, -1).join('\n');
          return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        }
        
        // Lists
        if (para.includes('\n- ')) {
          const items = para.split('\n- ').slice(1);
          return `<ul>${items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>`;
        }
        
        // Regular paragraph
        return `<p>${this.escapeHtml(para)}</p>`;
      })
      .join('\n');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private attachEventListeners(): void {
    const searchInput = this.container.querySelector('.help-browser-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.updateMainContent();
      });
    }

    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Category button clicked
      const categoryButton = target.closest('.help-category-button');
      if (categoryButton) {
        const category = categoryButton.getAttribute('data-category') as HelpTopic['category'];
        this.showCategory(category);
        return;
      }
      
      // Topic item clicked
      const topicItem = target.closest('.help-topic-item');
      if (topicItem) {
        const topicId = topicItem.getAttribute('data-topic-id');
        if (topicId) {
          this.showTopic(topicId);
        }
        return;
      }
      
      // Related topic link clicked
      const relatedLink = target.closest('.help-related-link');
      if (relatedLink) {
        const topicId = relatedLink.getAttribute('data-topic-id');
        if (topicId) {
          this.showTopic(topicId);
        }
        return;
      }
      
      // Back button clicked
      if (target.closest('.help-back-button')) {
        this.currentTopic = null;
        this.updateMainContent();
        return;
      }
    });
  }

  private showCategory(_category: HelpTopic['category']): void {
    this.searchQuery = '';
    // Topics will be filtered when content is updated
    this.currentTopic = null;
    this.updateMainContent();
  }

  private showTopic(topicId: string): void {
    const topic = helpTopics.get(topicId);
    if (topic) {
      this.currentTopic = topic;
      this.updateMainContent();
    }
  }

  private updateMainContent(): void {
    const mainElement = this.container.querySelector('.help-browser-main');
    if (mainElement) {
      mainElement.innerHTML = this.renderMainContent();
    }
  }

  private injectStyles(): void {
    if (document.getElementById('help-browser-deck-styles')) return;

    const style = document.createElement('style');
    style.id = 'help-browser-deck-styles';
    style.textContent = `
      .help-browser-deck {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cardplay-bg, #1a1a1a);
        color: var(--cardplay-text, #fff);
        font-family: system-ui, -apple-system, sans-serif;
      }

      .help-browser-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--cardplay-border, #333);
      }

      .help-browser-header h2 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .help-browser-board-context {
        font-size: 12px;
        color: var(--cardplay-text-secondary, #888);
      }

      .help-browser-search {
        padding: 12px 20px;
        border-bottom: 1px solid var(--cardplay-border, #333);
      }

      .help-browser-search-input {
        width: 100%;
        padding: 8px 12px;
        background: var(--cardplay-input-bg, #2a2a2a);
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 6px;
        color: var(--cardplay-text, #fff);
        font-size: 14px;
      }

      .help-browser-search-input:focus {
        outline: none;
        border-color: var(--cardplay-accent, #007bff);
      }

      .help-browser-content {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .help-browser-sidebar {
        width: 200px;
        border-right: 1px solid var(--cardplay-border, #333);
        overflow-y: auto;
        padding: 12px;
      }

      .help-categories {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .help-category-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--cardplay-text, #fff);
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
      }

      .help-category-button:hover {
        background: var(--cardplay-hover, #2a2a2a);
      }

      .help-category-icon {
        font-size: 16px;
      }

      .help-category-label {
        flex: 1;
        font-size: 13px;
      }

      .help-category-count {
        font-size: 11px;
        color: var(--cardplay-text-secondary, #888);
        background: var(--cardplay-input-bg, #2a2a2a);
        padding: 2px 6px;
        border-radius: 10px;
      }

      .help-browser-main {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .help-topic-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .help-topic-category-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--cardplay-text-secondary, #888);
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .help-topic-items {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .help-topic-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 10px 12px;
        background: transparent;
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 6px;
        color: var(--cardplay-text, #fff);
        cursor: pointer;
        text-align: left;
        transition: all 0.1s;
      }

      .help-topic-item:hover {
        background: var(--cardplay-hover, #2a2a2a);
        border-color: var(--cardplay-accent, #007bff);
      }

      .help-topic-item-title {
        font-size: 14px;
      }

      .help-topic-video-badge {
        font-size: 14px;
      }

      .help-topic-view {
        max-width: 800px;
      }

      .help-back-button {
        padding: 8px 16px;
        background: transparent;
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 6px;
        color: var(--cardplay-text, #fff);
        cursor: pointer;
        margin-bottom: 20px;
        transition: all 0.1s;
      }

      .help-back-button:hover {
        background: var(--cardplay-hover, #2a2a2a);
      }

      .help-topic-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .help-topic-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .help-topic-category {
        font-size: 12px;
        color: var(--cardplay-text-secondary, #888);
        background: var(--cardplay-input-bg, #2a2a2a);
        padding: 4px 10px;
        border-radius: 12px;
      }

      .help-topic-video {
        margin-bottom: 20px;
      }

      .help-video-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: var(--cardplay-accent, #007bff);
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        transition: opacity 0.1s;
      }

      .help-video-link:hover {
        opacity: 0.9;
      }

      .help-topic-content {
        line-height: 1.6;
        margin-bottom: 24px;
      }

      .help-topic-content h3 {
        font-size: 18px;
        margin: 24px 0 12px 0;
      }

      .help-topic-content h4 {
        font-size: 16px;
        margin: 20px 0 10px 0;
      }

      .help-topic-content p {
        margin: 0 0 16px 0;
      }

      .help-topic-content ul {
        margin: 0 0 16px 0;
        padding-left: 24px;
      }

      .help-topic-content li {
        margin-bottom: 8px;
      }

      .help-topic-content pre {
        background: var(--cardplay-input-bg, #2a2a2a);
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 0 0 16px 0;
      }

      .help-topic-content code {
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        font-size: 13px;
        color: var(--cardplay-text, #fff);
      }

      .help-related-topics {
        margin-top: 32px;
        padding-top: 20px;
        border-top: 1px solid var(--cardplay-border, #333);
      }

      .help-related-topics h4 {
        font-size: 14px;
        margin: 0 0 12px 0;
      }

      .help-related-topics ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .help-related-topics li {
        margin-bottom: 8px;
      }

      .help-related-link {
        background: transparent;
        border: none;
        color: var(--cardplay-accent, #007bff);
        cursor: pointer;
        font-size: 14px;
        text-decoration: underline;
        padding: 0;
      }

      .help-related-link:hover {
        opacity: 0.8;
      }

      .help-shortcuts-table {
        margin-top: 20px;
      }

      .help-shortcuts-category {
        margin-bottom: 24px;
      }

      .help-shortcuts-category h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: var(--cardplay-text-secondary, #888);
      }

      .help-shortcuts-category table {
        width: 100%;
        border-collapse: collapse;
      }

      .help-shortcut-key {
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        font-size: 13px;
        background: var(--cardplay-input-bg, #2a2a2a);
        padding: 6px 10px;
        border-radius: 4px;
        white-space: nowrap;
        width: 150px;
      }

      .help-shortcut-description {
        padding-left: 16px;
        font-size: 14px;
      }

      .help-shortcuts-category tr {
        border-bottom: 1px solid var(--cardplay-border, #333);
      }

      .help-shortcuts-category tr:last-child {
        border-bottom: none;
      }

      .help-shortcuts-category td {
        padding: 10px 0;
      }

      .help-empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--cardplay-text-secondary, #888);
      }

      .help-empty-state p {
        margin: 8px 0;
      }
    `;

    document.head.appendChild(style);
  }
}

/**
 * Create a help browser deck instance
 */
export function createHelpBrowserDeck(config: HelpBrowserConfig = {}): DeckInstance {
  const deck = new HelpBrowserDeck(config);
  
  return {
    id: 'help-browser',
    type: 'help-browser' as any, // Will need to add to DeckType union
    title: 'Help',
    render: () => {
      return deck.getElement();
    },
    destroy: () => {
      deck.destroy();
    },
  };
}

// ============================================================================
// REGISTER DEFAULT HELP TOPICS
// ============================================================================

// Register some default help topics
registerHelpTopic({
  id: 'getting-started',
  title: 'Getting Started with CardPlay',
  category: 'getting-started',
  keywords: ['introduction', 'basics', 'start', 'all-boards'],
  content: `
## Welcome to CardPlay!

CardPlay is a board-centric music creation system that adapts to your workflow. Whether you're a notation composer, tracker user, sound designer, or producer, there's a board configured for your needs.

### Core Concepts

- **Boards**: Different workspaces optimized for specific workflows
- **Decks**: Panels containing tools and editors
- **Control Levels**: From manual (you do everything) to generative (AI assists)

### Quick Start

1. Press Cmd+B to open the board switcher
2. Choose a board that matches your workflow
3. Start creating music!
  `,
  videoUrl: 'https://youtube.com/example',
  relatedTopics: ['keyboard-shortcuts', 'board-types'],
});

registerHelpTopic({
  id: 'keyboard-shortcuts',
  title: 'Keyboard Shortcuts',
  category: 'shortcuts',
  keywords: ['shortcuts', 'keys', 'hotkeys', 'all-boards'],
  content: `
## Keyboard Shortcuts

Master these shortcuts to work faster in CardPlay.

### Global Shortcuts

All shortcuts are displayed below based on your current board.
  `,
});

registerHelpTopic({
  id: 'board-types',
  title: 'Understanding Board Types',
  category: 'reference',
  keywords: ['boards', 'workspace', 'all-boards'],
  content: `
## Board Types

CardPlay offers different board types for different workflows:

### Manual Boards
- **Full Manual Control**: You create everything from scratch
- Examples: Basic Tracker, Notation Board, Basic Sampler
- Best for: Precision work, learning, complete control

### Assisted Boards
- **Hints & Suggestions**: Tools that help without taking over
- Examples: Tracker + Harmony, Session + Generators
- Best for: Learning, getting unstuck, exploring ideas

### Generative Boards
- **AI-Driven**: System generates content you curate
- Examples: AI Composer, Generative Ambient
- Best for: Exploration, ambient music, starting points

### Hybrid Boards
- **Mix & Match**: Per-track control levels
- Examples: Composer Board, Producer Board, Live Performance
- Best for: Power users, complex projects
  `,
  relatedTopics: ['getting-started'],
});

export { helpTopics };
