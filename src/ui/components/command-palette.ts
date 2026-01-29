/**
 * @fileoverview Command Palette Component
 *
 * A Cmd+K-style command palette for quick access to actions and features.
 * Provides fuzzy search, keyboard navigation, and command categorization.
 *
 * @module @cardplay/ui/components/command-palette
 * @see Phase L - L300: Command palette integration
 */

import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Command definition for the palette.
 */
export interface Command {
  /** Unique command ID */
  readonly id: string;

  /** Display label */
  readonly label: string;

  /** Optional icon (emoji or symbol) */
  readonly icon?: string;

  /** Command category for grouping */
  readonly category?: string;

  /** Keywords for search */
  readonly keywords?: readonly string[];

  /** Command action */
  readonly action: (context?: CommandContext) => void | Promise<void>;

  /** Whether command is currently enabled */
  readonly enabled?: () => boolean;

  /** Optional keyboard shortcut hint */
  readonly shortcut?: string;
}

/**
 * Context passed to command actions.
 */
export interface CommandContext {
  /** Currently active board type */
  readonly boardType?: string;

  /** Currently active deck types */
  readonly deckTypes?: readonly string[];

  /** Current musical key */
  readonly key?: { root: string; mode: string };

  /** Current chords in focus */
  readonly chords?: readonly string[];

  /** Any other contextual data */
  readonly [key: string]: unknown;
}

// ============================================================================
// COMMAND REGISTRY
// ============================================================================

/** Global command registry */
const commandRegistry = new Map<string, Command>();

/**
 * M331: Recently-used command IDs, most-recent first (capped at 20).
 */
const recentCommandIds: string[] = [];
const MAX_RECENT_COMMANDS = 20;

/**
 * M333: Undo stack for command palette actions.
 * Each entry stores the undo function from the last executed command.
 */
const undoStack: UndoEntry[] = [];
const MAX_UNDO_ENTRIES = 50;

/** An undo entry from a command execution. */
export interface UndoEntry {
  readonly commandId: string;
  readonly label: string;
  readonly timestamp: string;
  readonly undo: () => void | Promise<void>;
}

/**
 * Registers a command in the global registry.
 */
export function registerCommand(command: Command): void {
  commandRegistry.set(command.id, command);
}

/**
 * Unregisters a command from the global registry.
 */
export function unregisterCommand(id: string): void {
  commandRegistry.delete(id);
}

/**
 * Gets all registered commands.
 */
export function getAllCommands(): readonly Command[] {
  return Array.from(commandRegistry.values());
}

/**
 * M330: Gets context-aware commands based on active deck context.
 * Ranks commands relevant to the current context higher.
 */
export function getContextAwareCommands(context?: CommandContext): readonly Command[] {
  const all = getAllCommands();
  const hasContext = context && (context.boardType || (context.deckTypes && context.deckTypes.length > 0));
  const hasRecents = recentCommandIds.length > 0;

  if (!hasContext && !hasRecents) {
    return all;
  }

  // Score commands by context relevance (includes recent-use bonus)
  return [...all].sort((a, b) => {
    const scoreA = getContextRelevanceScore(a, context ?? {});
    const scoreB = getContextRelevanceScore(b, context ?? {});
    return scoreB - scoreA;
  });
}

/**
 * M330: Calculate how relevant a command is to the current context.
 */
function getContextRelevanceScore(command: Command, context: CommandContext): number {
  let score = 0;
  const keywords = command.keywords ?? [];
  const label = command.label.toLowerCase();
  const category = (command.category ?? '').toLowerCase();

  // Board type match
  if (context.boardType) {
    const bt = context.boardType.toLowerCase();
    if (label.includes(bt) || keywords.some(k => k.toLowerCase().includes(bt))) score += 100;
    if (category.includes(bt)) score += 50;
  }

  // Deck type match
  if (context.deckTypes) {
    for (const dt of context.deckTypes) {
      const dtLower = dt.toLowerCase().replace(/-/g, ' ').replace('deck', '').trim();
      if (label.includes(dtLower)) score += 80;
      if (keywords.some(k => k.toLowerCase().includes(dtLower))) score += 60;
      if (category.includes(dtLower)) score += 40;
    }
  }

  // Recently used bonus
  const recentIndex = recentCommandIds.indexOf(command.id);
  if (recentIndex >= 0) {
    score += Math.max(0, 30 - recentIndex * 3); // More recent = higher bonus
  }

  return score;
}

/**
 * M331: Record a command as recently used.
 */
export function recordRecentCommand(commandId: string): void {
  const idx = recentCommandIds.indexOf(commandId);
  if (idx >= 0) recentCommandIds.splice(idx, 1);
  recentCommandIds.unshift(commandId);
  if (recentCommandIds.length > MAX_RECENT_COMMANDS) {
    recentCommandIds.length = MAX_RECENT_COMMANDS;
  }
}

/**
 * M331: Get recently used command IDs.
 */
export function getRecentCommandIds(): readonly string[] {
  return [...recentCommandIds];
}

/**
 * M331: Get recently used commands (resolved from registry).
 */
export function getRecentCommands(): readonly Command[] {
  return recentCommandIds
    .map(id => commandRegistry.get(id))
    .filter((cmd): cmd is Command => cmd != null);
}

/**
 * M333: Push an undo entry onto the stack.
 */
export function pushUndoEntry(entry: UndoEntry): void {
  undoStack.unshift(entry);
  if (undoStack.length > MAX_UNDO_ENTRIES) {
    undoStack.length = MAX_UNDO_ENTRIES;
  }
}

/**
 * M333: Undo the last command palette action.
 */
export async function undoLastCommand(): Promise<UndoEntry | null> {
  const entry = undoStack.shift();
  if (!entry) return null;
  await entry.undo();
  return entry;
}

/**
 * M333: Get the undo stack (most recent first).
 */
export function getUndoStack(): readonly UndoEntry[] {
  return [...undoStack];
}

/**
 * Clears all registered commands (useful for testing).
 */
export function clearCommands(): void {
  commandRegistry.clear();
  recentCommandIds.length = 0;
  undoStack.length = 0;
}

// ============================================================================
// FUZZY SEARCH
// ============================================================================

function fuzzyMatch(search: string, text: string): boolean {
  const searchLower = search.toLowerCase();
  const textLower = text.toLowerCase();

  let searchIndex = 0;
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      searchIndex++;
    }
  }

  return searchIndex === searchLower.length;
}

function calculateScore(search: string, command: Command): number {
  const searchLower = search.toLowerCase();

  // Exact match in label gets highest score
  if (command.label.toLowerCase() === searchLower) return 1000;

  // Starts with search term
  if (command.label.toLowerCase().startsWith(searchLower)) return 900;

  // Contains search term
  if (command.label.toLowerCase().includes(searchLower)) return 800;

  // Fuzzy match in label
  if (fuzzyMatch(search, command.label)) return 700;

  // Match in keywords
  for (const keyword of command.keywords || []) {
    if (keyword.toLowerCase().includes(searchLower)) return 600;
    if (fuzzyMatch(search, keyword)) return 500;
  }

  return 0;
}

function filterAndSortCommands(search: string, commands: readonly Command[]): Command[] {
  if (!search.trim()) {
    return [...commands].filter(cmd => !cmd.enabled || cmd.enabled());
  }

  return commands
    .map(cmd => ({ cmd, score: calculateScore(search, cmd) }))
    .filter(({ score, cmd }) => score > 0 && (!cmd.enabled || cmd.enabled()))
    .sort((a, b) => b.score - a.score)
    .map(({ cmd }) => cmd);
}

// ============================================================================
// COMMAND PALETTE COMPONENT
// ============================================================================

/**
 * Command Palette Web Component.
 *
 * Usage:
 * ```html
 * <command-palette></command-palette>
 * ```
 *
 * Or programmatically:
 * ```typescript
 * const palette = document.createElement('command-palette');
 * palette.open();
 * ```
 */
@customElement('command-palette')
export class CommandPalette extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      align-items: flex-start;
      justify-content: center;
      padding-top: 20vh;
    }

    :host([open]) {
      display: flex;
    }

    .palette-container {
      width: 90%;
      max-width: 640px;
      background: var(--cardplay-surface, #1e1e1e);
      border: 1px solid var(--cardplay-border, #333);
      border-radius: 8px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      animation: palette-appear 0.15s ease-out;
    }

    @keyframes palette-appear {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .search-container {
      padding: 16px;
      border-bottom: 1px solid var(--cardplay-border, #333);
    }

    input {
      width: 100%;
      padding: 12px 16px;
      background: var(--cardplay-input-bg, #2a2a2a);
      border: 1px solid var(--cardplay-border, #444);
      border-radius: 6px;
      color: var(--cardplay-text, #fff);
      font-size: 16px;
      font-family: inherit;
      outline: none;
    }

    input::placeholder {
      color: var(--cardplay-text-secondary, #888);
    }

    input:focus {
      border-color: var(--cardplay-accent, #6366f1);
    }

    .results-container {
      max-height: 400px;
      overflow-y: auto;
      padding: 8px;
    }

    .command-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.1s;
    }

    .command-item:hover,
    .command-item.selected {
      background: var(--cardplay-hover, #333);
    }

    .command-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .command-content {
      flex: 1;
      min-width: 0;
    }

    .command-label {
      color: var(--cardplay-text, #fff);
      font-size: 14px;
      font-weight: 500;
    }

    .command-category {
      color: var(--cardplay-text-secondary, #888);
      font-size: 12px;
      margin-top: 2px;
    }

    .command-shortcut {
      color: var(--cardplay-text-secondary, #888);
      font-size: 12px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      background: var(--cardplay-input-bg, #2a2a2a);
      padding: 4px 8px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: var(--cardplay-text-secondary, #888);
    }

    .category-header {
      padding: 8px 12px 4px;
      color: var(--cardplay-text-secondary, #888);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Object })
  context: CommandContext = {};

  @state()
  private search = '';

  @state()
  private selectedIndex = 0;

  @query('input')
  private input!: HTMLInputElement;

  private get filteredCommands(): Command[] {
    // M330: Use context-aware commands when no search query
    const commands = this.search
      ? getAllCommands()
      : getContextAwareCommands(this.context);
    return filterAndSortCommands(this.search, commands);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this.handleBackdropClick);
    document.addEventListener('keydown', this.handleGlobalKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleBackdropClick);
    document.removeEventListener('keydown', this.handleGlobalKeydown);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open') && this.open) {
      // Focus input when opened
      this.updateComplete.then(() => {
        this.input?.focus();
      });
    }
  }

  private handleBackdropClick = (e: MouseEvent): void => {
    if (e.target === this) {
      this.close();
    }
  };

  private handleGlobalKeydown = (e: KeyboardEvent): void => {
    if (!this.open) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  };

  private handleSearchInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.search = input.value;
    this.selectedIndex = 0;
  }

  private handleKeydown(e: KeyboardEvent): void {
    const commands = this.filteredCommands;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, commands.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = commands[this.selectedIndex];
      if (command) {
        this.executeCommand(command);
      }
    }
  }

  private async executeCommand(command: Command): Promise<void> {
    try {
      // M333: Execute and capture potential undo function
      const result = await command.action(this.context);

      // M331: Record as recently used
      recordRecentCommand(command.id);

      // M333: If action returned an undo function, push onto undo stack
      if (typeof result === 'function') {
        pushUndoEntry({
          commandId: command.id,
          label: command.label,
          timestamp: new Date().toISOString(),
          undo: result as () => void | Promise<void>,
        });
      }

      this.close();
    } catch (error) {
      console.error(`[CommandPalette] Error executing command "${command.id}":`, error);
    }
  }

  private groupByCategory(commands: Command[]): Map<string, Command[]> {
    const groups = new Map<string, Command[]>();

    for (const cmd of commands) {
      const category = cmd.category || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(cmd);
    }

    return groups;
  }

  /** Opens the command palette */
  public openPalette(): void {
    this.open = true;
    this.search = '';
    this.selectedIndex = 0;
  }

  /** Closes the command palette */
  public close(): void {
    this.open = false;
  }

  protected override render(): TemplateResult {
    const commands = this.filteredCommands;
    const grouped = this.groupByCategory(commands);

    return html`
      <div class="palette-container" @click=${(e: Event) => e.stopPropagation()}>
        <div class="search-container">
          <input
            type="text"
            placeholder="Type a command or search..."
            .value=${this.search}
            @input=${this.handleSearchInput}
            @keydown=${this.handleKeydown}
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div class="results-container">
          ${commands.length === 0
            ? html`<div class="empty-state">
                ${this.search ? 'No commands found' : 'No commands available'}
              </div>`
            : this.search
            ? this.renderCommands(commands)
            : this.renderGrouped(grouped)}
        </div>
      </div>
    `;
  }

  private renderCommands(commands: Command[]): TemplateResult {
    return html`
      ${commands.map(
        (cmd, index) => html`
          <div
            class="command-item ${index === this.selectedIndex ? 'selected' : ''}"
            @click=${() => this.executeCommand(cmd)}
            @mouseenter=${() => (this.selectedIndex = index)}
          >
            ${cmd.icon ? html`<div class="command-icon">${cmd.icon}</div>` : ''}
            <div class="command-content">
              <div class="command-label">${cmd.label}</div>
              ${cmd.category
                ? html`<div class="command-category">${cmd.category}</div>`
                : ''}
            </div>
            ${cmd.shortcut
              ? html`<div class="command-shortcut">${cmd.shortcut}</div>`
              : ''}
          </div>
        `
      )}
    `;
  }

  private renderGrouped(grouped: Map<string, Command[]>): TemplateResult {
    const entries = Array.from(grouped.entries());

    return html`
      ${entries.map(([category, commands]) => {
        const startIndex = this.getGroupStartIndex(entries, category);
        return html`
          <div class="category-header">${category}</div>
          ${commands.map((cmd, localIndex) => {
            const globalIndex = startIndex + localIndex;
            return html`
              <div
                class="command-item ${globalIndex === this.selectedIndex ? 'selected' : ''}"
                @click=${() => this.executeCommand(cmd)}
                @mouseenter=${() => (this.selectedIndex = globalIndex)}
              >
                ${cmd.icon ? html`<div class="command-icon">${cmd.icon}</div>` : ''}
                <div class="command-content">
                  <div class="command-label">${cmd.label}</div>
                </div>
                ${cmd.shortcut
                  ? html`<div class="command-shortcut">${cmd.shortcut}</div>`
                  : ''}
              </div>
            `;
          })}
        `;
      })}
    `;
  }

  private getGroupStartIndex(entries: [string, Command[]][], targetCategory: string): number {
    let index = 0;
    for (const [category, commands] of entries) {
      if (category === targetCategory) {
        return index;
      }
      index += commands.length;
    }
    return 0;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/** Singleton palette instance */
let paletteInstance: CommandPalette | null = null;

/**
 * Gets or creates the global command palette instance.
 */
export function getCommandPalette(): CommandPalette {
  if (!paletteInstance) {
    paletteInstance = document.createElement('command-palette');
    document.body.appendChild(paletteInstance);
  }
  return paletteInstance;
}

/**
 * Opens the command palette.
 */
export function openCommandPalette(context?: CommandContext): void {
  const palette = getCommandPalette();
  if (context) {
    palette.context = context;
  }
  palette.openPalette();
}

/**
 * Initializes the command palette and registers the Cmd+K shortcut.
 */
export function initializeCommandPalette(): void {
  // Ensure palette exists
  getCommandPalette();

  // Register Cmd+K shortcut
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const isMac = navigator.platform.includes('Mac');
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === 'k' && modKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      openCommandPalette();
    }
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'command-palette': CommandPalette;
  }
}
