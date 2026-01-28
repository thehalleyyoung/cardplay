/**
 * CardScript Playground UI
 * 
 * An interactive development environment for writing, testing, and debugging
 * CardScript code. Features include:
 * - Live code editor with syntax highlighting
 * - Real-time compilation and error display
 * - Output panel for results
 * - Example library
 * - Settings panel
 * - Share/export functionality
 * 
 * @module cardscript/playground
 */

import type {} from './grammar';
import { parse } from './parser';
import type { Program } from './ast';
import { typeCheck, type TypeCheckResult } from './types';
import { compile } from './compiler';
import { AutocompleteEngine, type CompletionItem } from './autocomplete';
import { SyntaxHighlighter, createHighlighter, DARK_THEME, LIGHT_THEME, MONOKAI_THEME, type HighlightTheme } from './highlight';
import { ModuleLoader } from './modules';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Simplified diagnostic for the playground.
 */
export interface PlaygroundDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
}

/**
 * Compile result for the playground.
 */
export interface PlaygroundCompileResult {
  success: boolean;
  code?: string;
  errors: PlaygroundDiagnostic[];
}

/**
 * Playground configuration options.
 */
export interface PlaygroundConfig {
  /** Initial source code */
  initialCode?: string;
  /** Theme name or custom theme */
  theme?: 'dark' | 'light' | 'monokai' | HighlightTheme;
  /** Enable auto-compilation on change */
  autoCompile?: boolean;
  /** Debounce delay for auto-compile (ms) */
  compileDelay?: number;
  /** Enable autocomplete */
  autocomplete?: boolean;
  /** Enable line numbers */
  lineNumbers?: boolean;
  /** Font size (px) */
  fontSize?: number;
  /** Tab size (spaces) */
  tabSize?: number;
  /** Enable soft wrapping */
  wordWrap?: boolean;
  /** Module loader for imports */
  moduleLoader?: ModuleLoader;
  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * Playground state.
 */
export interface PlaygroundState {
  /** Current source code */
  source: string;
  /** Parsed AST (if valid) */
  ast: Program | null;
  /** Type check result */
  typeResult: TypeCheckResult | null;
  /** Compilation result */
  compileResult: PlaygroundCompileResult | null;
  /** Current diagnostics */
  diagnostics: PlaygroundDiagnostic[];
  /** Cursor position */
  cursor: { line: number; column: number };
  /** Selection range */
  selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null;
  /** Is compiling */
  isCompiling: boolean;
  /** Execution output */
  output: OutputItem[];
  /** Undo history */
  undoStack: string[];
  /** Redo history */
  redoStack: string[];
  /** Current theme */
  theme: HighlightTheme;
  /** Is modified since last save */
  isDirty: boolean;
}

/**
 * Output item from execution.
 */
export interface OutputItem {
  type: 'log' | 'warn' | 'error' | 'result' | 'info';
  timestamp: number;
  message: string;
  details?: unknown;
}

/**
 * Example code entry.
 */
export interface PlaygroundExample {
  id: string;
  title: string;
  description: string;
  code: string;
  category: 'basic' | 'audio' | 'midi' | 'composition' | 'advanced';
  tags: string[];
}

/**
 * Playground event types.
 */
export type PlaygroundEventType =
  | 'change'
  | 'compile'
  | 'execute'
  | 'error'
  | 'diagnostics'
  | 'cursor'
  | 'selection'
  | 'theme'
  | 'output';

/**
 * Playground event data.
 */
export interface PlaygroundEvent {
  type: PlaygroundEventType;
  timestamp: number;
  data: unknown;
}

/**
 * Playground event listener.
 */
export type PlaygroundEventListener = (event: PlaygroundEvent) => void;

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: Required<PlaygroundConfig> = {
  initialCode: '',
  theme: 'dark',
  autoCompile: true,
  compileDelay: 300,
  autocomplete: true,
  lineNumbers: true,
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  moduleLoader: new ModuleLoader(),
  readOnly: false,
};

// ============================================================================
// PLAYGROUND CLASS
// ============================================================================

/**
 * CardScript Playground controller.
 * 
 * Manages the state and behavior of the playground UI.
 */
export class Playground {
  private config: Required<PlaygroundConfig>;
  private state: PlaygroundState;
  private listeners: Map<PlaygroundEventType, Set<PlaygroundEventListener>>;
  private highlighter: SyntaxHighlighter;
  private autocompleteEngine: AutocompleteEngine;
  private compileTimer: ReturnType<typeof setTimeout> | null = null;
  private container: HTMLElement | null = null;
  
  constructor(config: PlaygroundConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize theme
    let theme: HighlightTheme;
    if (typeof this.config.theme === 'string') {
      switch (this.config.theme) {
        case 'light': theme = LIGHT_THEME; break;
        case 'monokai': theme = MONOKAI_THEME; break;
        default: theme = DARK_THEME;
      }
    } else {
      theme = this.config.theme;
    }
    
    this.highlighter = createHighlighter(theme);
    this.autocompleteEngine = new AutocompleteEngine();
    this.listeners = new Map();
    
    this.state = {
      source: this.config.initialCode,
      ast: null,
      typeResult: null,
      compileResult: null,
      diagnostics: [],
      cursor: { line: 1, column: 1 },
      selection: null,
      isCompiling: false,
      output: [],
      undoStack: [],
      redoStack: [],
      theme,
      isDirty: false,
    };
    
    // Initial compilation
    if (this.config.initialCode && this.config.autoCompile) {
      this.compile();
    }
  }
  
  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================
  
  /**
   * Gets the current source code.
   */
  getSource(): string {
    return this.state.source;
  }
  
  /**
   * Gets the current state.
   */
  getState(): Readonly<PlaygroundState> {
    return this.state;
  }
  
  /**
   * Gets current diagnostics.
   */
  getDiagnostics(): readonly PlaygroundDiagnostic[] {
    return this.state.diagnostics;
  }
  
  /**
   * Gets current output.
   */
  getOutput(): readonly OutputItem[] {
    return this.state.output;
  }
  
  /**
   * Gets highlighted HTML for the current source.
   */
  getHighlightedHTML(): string {
    return this.highlighter.highlight(this.state.source).html || '';
  }
  
  // ==========================================================================
  // SOURCE EDITING
  // ==========================================================================
  
  /**
   * Sets the source code.
   */
  setSource(source: string): void {
    if (this.config.readOnly) return;
    if (source === this.state.source) return;
    
    // Save to undo stack
    this.state.undoStack.push(this.state.source);
    this.state.redoStack = [];
    
    this.state.source = source;
    this.state.isDirty = true;
    
    this.emit('change', { source });
    
    // Schedule compilation
    if (this.config.autoCompile) {
      this.scheduleCompile();
    }
  }
  
  /**
   * Inserts text at the cursor position.
   */
  insertText(text: string): void {
    if (this.config.readOnly) return;
    
    const { line, column } = this.state.cursor;
    const lines = this.state.source.split('\n');
    
    if (line <= lines.length) {
      const currentLine = lines[line - 1] || '';
      const before = currentLine.slice(0, column - 1);
      const after = currentLine.slice(column - 1);
      
      const insertLines = text.split('\n');
      if (insertLines.length === 1) {
        lines[line - 1] = before + text + after;
        this.setCursor(line, column + text.length);
      } else {
        lines[line - 1] = before + insertLines[0];
        const lastInsertLine = insertLines[insertLines.length - 1];
        if (lastInsertLine) {
          lines.splice(line, 0, ...insertLines.slice(1, -1), lastInsertLine + after);
          this.setCursor(line + insertLines.length - 1, lastInsertLine.length + 1);
        }
      }
      
      this.setSource(lines.join('\n'));
    }
  }
  
  /**
   * Deletes selected text or character at cursor.
   */
  deleteText(direction: 'forward' | 'backward' = 'backward'): void {
    if (this.config.readOnly) return;
    
    if (this.state.selection) {
      // Delete selection
      const { start, end } = this.state.selection;
      const lines = this.state.source.split('\n');
      
      const beforeSelection = lines.slice(0, start.line - 1);
      const startLine = lines[start.line - 1] || '';
      const endLine = lines[end.line - 1] || '';
      const afterSelection = lines.slice(end.line);
      
      const newLine = startLine.slice(0, start.column - 1) + endLine.slice(end.column - 1);
      
      this.setSource([...beforeSelection, newLine, ...afterSelection].join('\n'));
      this.setCursor(start.line, start.column);
      this.clearSelection();
    } else {
      // Delete single character
      const { line, column } = this.state.cursor;
      const lines = this.state.source.split('\n');
      const currentLine = lines[line - 1] || '';
      
      if (direction === 'backward') {
        if (column > 1) {
          lines[line - 1] = currentLine.slice(0, column - 2) + currentLine.slice(column - 1);
          this.setSource(lines.join('\n'));
          this.setCursor(line, column - 1);
        } else if (line > 1) {
          // Merge with previous line
          const prevLine = lines[line - 2] || '';
          lines[line - 2] = prevLine + currentLine;
          lines.splice(line - 1, 1);
          this.setSource(lines.join('\n'));
          this.setCursor(line - 1, prevLine.length + 1);
        }
      } else {
        if (column <= currentLine.length) {
          lines[line - 1] = currentLine.slice(0, column - 1) + currentLine.slice(column);
          this.setSource(lines.join('\n'));
        } else if (line < lines.length) {
          // Merge with next line
          const nextLine = lines[line] || '';
          lines[line - 1] = currentLine + nextLine;
          lines.splice(line, 1);
          this.setSource(lines.join('\n'));
        }
      }
    }
  }
  
  /**
   * Undoes the last change.
   */
  undo(): boolean {
    if (this.state.undoStack.length === 0) return false;
    
    this.state.redoStack.push(this.state.source);
    const previous = this.state.undoStack.pop()!;
    this.state.source = previous;
    
    this.emit('change', { source: previous, isUndo: true });
    
    if (this.config.autoCompile) {
      this.scheduleCompile();
    }
    
    return true;
  }
  
  /**
   * Redoes the last undone change.
   */
  redo(): boolean {
    if (this.state.redoStack.length === 0) return false;
    
    this.state.undoStack.push(this.state.source);
    const next = this.state.redoStack.pop()!;
    this.state.source = next;
    
    this.emit('change', { source: next, isRedo: true });
    
    if (this.config.autoCompile) {
      this.scheduleCompile();
    }
    
    return true;
  }
  
  // ==========================================================================
  // CURSOR & SELECTION
  // ==========================================================================
  
  /**
   * Sets the cursor position.
   */
  setCursor(line: number, column: number): void {
    this.state.cursor = { line, column };
    this.emit('cursor', { line, column });
  }
  
  /**
   * Sets the selection range.
   */
  setSelection(
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number
  ): void {
    this.state.selection = {
      start: { line: startLine, column: startColumn },
      end: { line: endLine, column: endColumn },
    };
    this.emit('selection', this.state.selection);
  }
  
  /**
   * Clears the selection.
   */
  clearSelection(): void {
    this.state.selection = null;
    this.emit('selection', null);
  }
  
  /**
   * Selects all text.
   */
  selectAll(): void {
    const lines = this.state.source.split('\n');
    const lastLine = lines[lines.length - 1] || '';
    this.setSelection(1, 1, lines.length, lastLine.length + 1);
  }
  
  // ==========================================================================
  // COMPILATION
  // ==========================================================================
  
  /**
   * Schedules compilation with debounce.
   */
  private scheduleCompile(): void {
    if (this.compileTimer) {
      clearTimeout(this.compileTimer);
    }
    this.compileTimer = setTimeout(() => {
      this.compile();
    }, this.config.compileDelay);
  }
  
  /**
   * Compiles the current source code.
   */
  compile(): PlaygroundCompileResult | null {
    this.state.isCompiling = true;
    this.state.diagnostics = [];
    
    try {
      // Parse
      const parseResult = parse(this.state.source);
      if (!parseResult.success) {
        const diagnostics: PlaygroundDiagnostic[] = parseResult.errors.map((e) => ({
          severity: 'error' as const,
          message: e.message,
          line: e.token?.span?.start.line || 1,
          column: e.token?.span?.start.column || 1,
        }));
        
        this.state.diagnostics = diagnostics;
        this.state.ast = null;
        this.state.typeResult = null;
        this.state.compileResult = { success: false, errors: diagnostics };
        this.emit('diagnostics', diagnostics);
        this.emit('compile', { success: false, errors: diagnostics });
        return null;
      }
      
      this.state.ast = parseResult.ast;
      
      // Type check
      const typeResult = typeCheck(parseResult.ast);
      this.state.typeResult = typeResult;
      
      if (!typeResult.success) {
        const diagnostics: PlaygroundDiagnostic[] = typeResult.errors.map((e) => ({
          severity: 'error' as const,
          message: e.message,
          line: e.span?.start.line || 1,
          column: e.span?.start.column || 1,
        }));
        
        this.state.diagnostics = diagnostics;
        this.state.compileResult = { success: false, errors: diagnostics };
        this.emit('diagnostics', diagnostics);
        this.emit('compile', { success: false, errors: diagnostics });
        return null;
      }
      
      // Compile - compile() takes source string, not AST
      try {
        const cards = compile(this.state.source);
        const compileResult: PlaygroundCompileResult = {
          success: true,
          // Store the source as "code" for execution
          code: this.state.source,
          errors: [],
        };
        this.state.compileResult = compileResult;
        this.emit('compile', { success: true, result: compileResult, cards });
        return compileResult;
      } catch (compileError) {
        const diagnostic: PlaygroundDiagnostic = {
          severity: 'error',
          message: compileError instanceof Error ? compileError.message : String(compileError),
          line: 1,
          column: 1,
        };
        this.state.diagnostics = [diagnostic];
        this.state.compileResult = { success: false, errors: [diagnostic] };
        this.emit('diagnostics', [diagnostic]);
        this.emit('compile', { success: false, errors: [diagnostic] });
        return null;
      }
      
    } catch (error) {
      const diagnostic: PlaygroundDiagnostic = {
        severity: 'error',
        message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        line: 1,
        column: 1,
      };
      
      this.state.diagnostics = [diagnostic];
      this.state.compileResult = { success: false, errors: [diagnostic] };
      this.emit('diagnostics', [diagnostic]);
      this.emit('error', error);
      return null;
    } finally {
      this.state.isCompiling = false;
    }
  }
  
  /**
   * Formats the current source code.
   * Note: Formatting not yet implemented, does nothing.
   */
  format(): void {
    // Format not yet implemented
  }
  
  // ==========================================================================
  // EXECUTION
  // ==========================================================================
  
  /**
   * Executes the compiled code.
   */
  async execute(): Promise<unknown> {
    if (!this.state.compileResult?.success || !this.state.compileResult.code) {
      this.addOutput('error', 'Cannot execute: code has errors');
      return undefined;
    }
    
    try {
      // Create sandboxed execution context
      const consoleProxy = {
        log: (...args: unknown[]) => this.addOutput('log', args.map(String).join(' ')),
        warn: (...args: unknown[]) => this.addOutput('warn', args.map(String).join(' ')),
        error: (...args: unknown[]) => this.addOutput('error', args.map(String).join(' ')),
        info: (...args: unknown[]) => this.addOutput('info', args.map(String).join(' ')),
      };
      
      // Execute in sandbox
      const fn = new Function('console', this.state.compileResult.code);
      const result = await fn(consoleProxy);
      
      if (result !== undefined) {
        this.addOutput('result', JSON.stringify(result, null, 2));
      }
      
      this.emit('execute', { success: true, result });
      return result;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addOutput('error', `Execution error: ${message}`);
      this.emit('execute', { success: false, error });
      throw error;
    }
  }
  
  /**
   * Clears the output panel.
   */
  clearOutput(): void {
    this.state.output = [];
    this.emit('output', []);
  }
  
  /**
   * Adds an output item.
   */
  private addOutput(type: OutputItem['type'], message: string, details?: unknown): void {
    const item: OutputItem = {
      type,
      timestamp: Date.now(),
      message,
      details,
    };
    
    this.state.output.push(item);
    this.emit('output', this.state.output);
  }
  
  // ==========================================================================
  // AUTOCOMPLETE
  // ==========================================================================
  
  /**
   * Gets autocomplete suggestions at the cursor.
   */
  getCompletions(): CompletionItem[] {
    if (!this.config.autocomplete) return [];
    
    const { line, column } = this.state.cursor;
    // Calculate offset from line and column
    const lines = this.state.source.split('\n');
    let offset = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      offset += (lines[i]?.length ?? 0) + 1; // +1 for newline
    }
    offset += column - 1;
    
    return this.autocompleteEngine.getCompletions(this.state.source, { line, column, offset }).items;
  }
  
  /**
   * Applies a completion item.
   */
  applyCompletion(item: CompletionItem): void {
    if (this.config.readOnly) return;
    
    // Find the word to replace
    const lines = this.state.source.split('\n');
    const currentLine = lines[this.state.cursor.line - 1] || '';
    const beforeCursor = currentLine.slice(0, this.state.cursor.column - 1);
    
    // Find word start
    const wordMatch = beforeCursor.match(/[\w$]*$/);
    const wordStart = wordMatch ? this.state.cursor.column - wordMatch[0].length : this.state.cursor.column;
    
    // Replace word with completion
    const text = item.insertText || item.label;
    const newLine = currentLine.slice(0, wordStart - 1) + text + currentLine.slice(this.state.cursor.column - 1);
    lines[this.state.cursor.line - 1] = newLine;
    
    this.setSource(lines.join('\n'));
    this.setCursor(this.state.cursor.line, wordStart + text.length);
  }
  
  // ==========================================================================
  // THEME
  // ==========================================================================
  
  /**
   * Sets the theme.
   */
  setTheme(theme: 'dark' | 'light' | 'monokai' | HighlightTheme): void {
    let themeObj: HighlightTheme;
    if (typeof theme === 'string') {
      switch (theme) {
        case 'light': themeObj = LIGHT_THEME; break;
        case 'monokai': themeObj = MONOKAI_THEME; break;
        default: themeObj = DARK_THEME;
      }
    } else {
      themeObj = theme;
    }
    
    this.state.theme = themeObj;
    this.highlighter = createHighlighter(themeObj);
    this.emit('theme', themeObj);
  }
  
  /**
   * Gets the current theme.
   */
  getTheme(): HighlightTheme {
    return this.state.theme;
  }
  
  // ==========================================================================
  // EXAMPLES
  // ==========================================================================
  
  /**
   * Loads an example.
   */
  loadExample(example: PlaygroundExample): void {
    this.state.undoStack.push(this.state.source);
    this.state.redoStack = [];
    this.state.source = example.code;
    this.state.isDirty = false;
    
    this.emit('change', { source: example.code, example });
    
    if (this.config.autoCompile) {
      this.compile();
    }
  }
  
  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================
  
  /**
   * Exports the current state to JSON.
   */
  exportState(): string {
    return JSON.stringify({
      source: this.state.source,
      theme: this.state.theme.name,
      cursor: this.state.cursor,
      version: '1.0.0',
    });
  }
  
  /**
   * Imports state from JSON.
   */
  importState(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.source) {
        this.setSource(data.source);
      }
      if (data.theme) {
        this.setTheme(data.theme);
      }
      if (data.cursor) {
        this.setCursor(data.cursor.line, data.cursor.column);
      }
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Generates a shareable URL.
   */
  getShareURL(baseURL: string = 'https://cardscript.dev/playground'): string {
    const encoded = btoa(encodeURIComponent(this.state.source));
    return `${baseURL}?code=${encoded}`;
  }
  
  /**
   * Loads from a share URL.
   */
  loadFromURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      if (code) {
        const decoded = decodeURIComponent(atob(code));
        this.setSource(decoded);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  
  // ==========================================================================
  // EVENTS
  // ==========================================================================
  
  /**
   * Adds an event listener.
   */
  on(event: PlaygroundEventType, listener: PlaygroundEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }
  
  /**
   * Removes an event listener.
   */
  off(event: PlaygroundEventType, listener: PlaygroundEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }
  
  /**
   * Emits an event.
   */
  private emit(event: PlaygroundEventType, data: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const playgroundEvent: PlaygroundEvent = {
        type: event,
        timestamp: Date.now(),
        data,
      };
      
      listeners.forEach(listener => {
        try {
          listener(playgroundEvent);
        } catch (error) {
          console.error('Playground event listener error:', error);
        }
      });
    }
  }
  
  // ==========================================================================
  // DOM RENDERING
  // ==========================================================================
  
  /**
   * Mounts the playground to a DOM element.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }
  
  /**
   * Unmounts the playground.
   */
  unmount(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    
    if (this.compileTimer) {
      clearTimeout(this.compileTimer);
      this.compileTimer = null;
    }
  }
  
  /**
   * Renders the playground UI.
   */
  private render(): void {
    if (!this.container) return;
    
    const theme = this.state.theme;
    
    this.container.innerHTML = `
      <div class="cardscript-playground" style="
        display: flex;
        flex-direction: column;
        height: 100%;
        background: ${theme.colors['background']};
        color: ${theme.colors['foreground']};
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        font-size: ${this.config.fontSize}px;
      ">
        <div class="playground-toolbar" style="
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background: ${adjustBrightness(theme.colors['background'] || '#1e1e1e', -10)};
          border-bottom: 1px solid ${theme.colors['punctuation'] || '#666'};
          gap: 8px;
        ">
          <button class="btn-run" style="${buttonStyle(theme)}">▶ Run</button>
          <button class="btn-format" style="${buttonStyle(theme)}">Format</button>
          <button class="btn-clear" style="${buttonStyle(theme)}">Clear Output</button>
          <div style="flex: 1;"></div>
          <select class="theme-select" style="${selectStyle(theme)}">
            <option value="dark" ${theme.name === 'CardScript Dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${theme.name === 'CardScript Light' ? 'selected' : ''}>Light</option>
            <option value="monokai" ${theme.name === 'Monokai' ? 'selected' : ''}>Monokai</option>
          </select>
          <button class="btn-share" style="${buttonStyle(theme)}">Share</button>
        </div>
        
        <div class="playground-main" style="
          display: flex;
          flex: 1;
          overflow: hidden;
        ">
          <div class="editor-panel" style="
            flex: 1;
            display: flex;
            flex-direction: column;
            border-right: 1px solid ${theme.colors['punctuation'] || '#666'};
          ">
            <div class="editor-header" style="
              padding: 8px 16px;
              background: ${adjustBrightness(theme.colors['background'] || '#1e1e1e', -5)};
              border-bottom: 1px solid ${theme.colors['punctuation'] || '#666'};
            ">
              <span>Editor</span>
              ${this.state.isDirty ? '<span style="color: orange;"> ●</span>' : ''}
            </div>
            <div class="editor-content" style="
              flex: 1;
              overflow: auto;
              padding: 16px;
            ">
              <pre class="code-display" style="
                margin: 0;
                white-space: ${this.config.wordWrap ? 'pre-wrap' : 'pre'};
                line-height: 1.5;
              ">${this.getHighlightedHTML()}</pre>
            </div>
          </div>
          
          <div class="output-panel" style="
            flex: 1;
            display: flex;
            flex-direction: column;
          ">
            <div class="output-header" style="
              padding: 8px 16px;
              background: ${adjustBrightness(theme.colors['background'] || '#1e1e1e', -5)};
              border-bottom: 1px solid ${theme.colors['punctuation'] || '#666'};
            ">
              <span>Output</span>
              ${this.state.diagnostics.length > 0 
                ? `<span style="color: ${theme.colors['invalid'] || '#f00'}; margin-left: 8px;">${this.state.diagnostics.length} error(s)</span>` 
                : ''}
            </div>
            <div class="output-content" style="
              flex: 1;
              overflow: auto;
              padding: 16px;
            ">
              ${this.renderDiagnostics()}
              ${this.renderOutput()}
            </div>
          </div>
        </div>
        
        <div class="playground-statusbar" style="
          display: flex;
          padding: 4px 16px;
          background: ${adjustBrightness(theme.colors['background'] || '#1e1e1e', -10)};
          border-top: 1px solid ${theme.colors['punctuation'] || '#666'};
          font-size: 12px;
        ">
          <span>Ln ${this.state.cursor.line}, Col ${this.state.cursor.column}</span>
          <div style="flex: 1;"></div>
          <span>${this.state.isCompiling ? 'Compiling...' : 'Ready'}</span>
        </div>
      </div>
    `;
    
    // Attach event handlers
    this.attachEventHandlers();
  }
  
  /**
   * Renders diagnostics.
   */
  private renderDiagnostics(): string {
    if (this.state.diagnostics.length === 0) return '';
    
    const theme = this.state.theme;
    
    return `
      <div class="diagnostics" style="margin-bottom: 16px;">
        ${this.state.diagnostics.map(d => `
          <div class="diagnostic" style="
            padding: 8px;
            margin-bottom: 4px;
            background: ${d.severity === 'error' 
              ? 'rgba(255, 0, 0, 0.1)' 
              : d.severity === 'warning' 
                ? 'rgba(255, 200, 0, 0.1)' 
                : 'rgba(100, 100, 255, 0.1)'};
            border-left: 3px solid ${d.severity === 'error' 
              ? theme.colors['invalid'] || '#f00' 
              : d.severity === 'warning' 
                ? '#fc0' 
                : '#66f'};
            border-radius: 0 4px 4px 0;
          ">
            <strong>${d.severity.toUpperCase()}</strong> ${escapeHtml(d.message)}
            <span style="opacity: 0.7;"> at line ${d.line}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  /**
   * Renders output items.
   */
  private renderOutput(): string {
    if (this.state.output.length === 0) return '<div style="opacity: 0.5;">No output yet. Click "Run" to execute your code.</div>';
    
    const theme = this.state.theme;
    
    const typeColors: Record<string, string> = {
      log: theme.colors['foreground'] || '#d4d4d4',
      info: theme.colors['type'] || '#66f',
      warn: '#fc0',
      error: theme.colors['invalid'] || '#f00',
      result: theme.colors['literal.string'] || '#0f0',
    };
    
    return `
      <div class="output-items">
        ${this.state.output.map(item => `
          <div class="output-item" style="
            padding: 4px 0;
            color: ${typeColors[item.type] || theme.colors['foreground']};
            border-bottom: 1px solid ${theme.colors['punctuation'] || '#333'}33;
          ">
            <span style="opacity: 0.5; font-size: 10px;">[${formatTime(item.timestamp)}]</span>
            <span style="margin-left: 8px;">${escapeHtml(item.message)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  /**
   * Attaches DOM event handlers.
   */
  private attachEventHandlers(): void {
    if (!this.container) return;
    
    // Run button
    const runBtn = this.container.querySelector('.btn-run');
    runBtn?.addEventListener('click', () => {
      this.compile();
      this.execute().catch(() => {});
    });
    
    // Format button
    const formatBtn = this.container.querySelector('.btn-format');
    formatBtn?.addEventListener('click', () => this.format());
    
    // Clear button
    const clearBtn = this.container.querySelector('.btn-clear');
    clearBtn?.addEventListener('click', () => this.clearOutput());
    
    // Share button
    const shareBtn = this.container.querySelector('.btn-share');
    shareBtn?.addEventListener('click', () => {
      const url = this.getShareURL();
      navigator.clipboard?.writeText(url).then(() => {
        this.addOutput('info', `Share URL copied to clipboard: ${url}`);
      });
    });
    
    // Theme select
    const themeSelect = this.container.querySelector('.theme-select') as HTMLSelectElement;
    themeSelect?.addEventListener('change', () => {
      this.setTheme(themeSelect.value as 'dark' | 'light' | 'monokai');
      this.render();
    });
  }
  
  /**
   * Destroys the playground and cleans up resources.
   */
  dispose(): void {
    this.unmount();
    this.listeners.clear();
  }
}

// ============================================================================
// EXAMPLE LIBRARY
// ============================================================================

/**
 * Built-in examples for the playground.
 */
export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: 'A simple CardScript program',
    category: 'basic',
    tags: ['beginner', 'introduction'],
    code: `// Hello World in CardScript
card HelloWorld {
  output greeting: String

  process() {
    emit greeting("Hello, CardScript!")
  }
}
`,
  },
  {
    id: 'simple-gain',
    title: 'Simple Gain',
    description: 'Audio gain control card',
    category: 'audio',
    tags: ['audio', 'gain', 'basic'],
    code: `// Simple gain card
card Gain {
  input audio: Audio
  output out: Audio
  param gain: Number = 1.0

  process(input) {
    emit out(input.audio * this.gain)
  }
}
`,
  },
  {
    id: 'midi-transpose',
    title: 'MIDI Transpose',
    description: 'Transposes MIDI notes',
    category: 'midi',
    tags: ['midi', 'transpose', 'transform'],
    code: `// MIDI transposer
card Transpose {
  input midi: Midi
  output out: Midi
  param semitones: Number = 0

  process(input) {
    for (let note of input.midi.notes) {
      emit out({
        ...note,
        pitch: note.pitch + this.semitones
      })
    }
  }
}
`,
  },
  {
    id: 'arpeggiator',
    title: 'Arpeggiator',
    description: 'Creates arpeggios from chords',
    category: 'composition',
    tags: ['midi', 'arpeggio', 'generator'],
    code: `// Simple arpeggiator
card Arpeggiator {
  input chord: Midi
  output notes: Midi
  param rate: Number = 0.25  // quarter notes
  param pattern: String = "up"

  state notes: Midi[] = []
  state index: Number = 0
  state lastTime: Number = 0

  process(input, time) {
    // Collect chord notes
    if (input.chord) {
      this.notes = input.chord.notes
      this.index = 0
    }

    // Output arpeggiated notes
    if (time - this.lastTime >= this.rate) {
      if (this.notes.length > 0) {
        let idx = this.pattern === "down" 
          ? this.notes.length - 1 - this.index 
          : this.index
        emit notes(this.notes[idx % this.notes.length])
        this.index = (this.index + 1) % this.notes.length
      }
      this.lastTime = time
    }
  }
}
`,
  },
  {
    id: 'delay-effect',
    title: 'Delay Effect',
    description: 'Audio delay with feedback',
    category: 'audio',
    tags: ['audio', 'delay', 'effect', 'advanced'],
    code: `// Delay effect with feedback
card Delay {
  input audio: Audio
  output out: Audio
  param time: Number = 0.5    // delay time in seconds
  param feedback: Number = 0.5
  param mix: Number = 0.5

  state buffer: Audio[] = []
  state writePos: Number = 0

  process(input, sampleRate) {
    let bufferSize = Math.floor(this.time * sampleRate)
    
    // Ensure buffer is correct size
    while (this.buffer.length < bufferSize) {
      this.buffer.push(0)
    }

    // Read delayed signal
    let readPos = (this.writePos - bufferSize + this.buffer.length) % this.buffer.length
    let delayed = this.buffer[readPos]

    // Write to buffer with feedback
    this.buffer[this.writePos] = input.audio + delayed * this.feedback
    this.writePos = (this.writePos + 1) % this.buffer.length

    // Mix dry and wet
    emit out(input.audio * (1 - this.mix) + delayed * this.mix)
  }
}
`,
  },
  {
    id: 'card-composition',
    title: 'Card Composition',
    description: 'Composing cards with deck',
    category: 'advanced',
    tags: ['deck', 'composition', 'advanced'],
    code: `// Card composition example
card LowpassFilter {
  input audio: Audio
  output out: Audio
  param cutoff: Number = 1000
  param resonance: Number = 0.7

  state y1: Number = 0
  state y2: Number = 0

  process(input, sampleRate) {
    let w0 = 2 * Math.PI * this.cutoff / sampleRate
    let alpha = Math.sin(w0) / (2 * this.resonance)
    
    let b0 = (1 - Math.cos(w0)) / 2
    let b1 = 1 - Math.cos(w0)
    let b2 = (1 - Math.cos(w0)) / 2
    let a0 = 1 + alpha
    let a1 = -2 * Math.cos(w0)
    let a2 = 1 - alpha

    let x = input.audio
    let y = (b0/a0)*x + (b1/a0)*this.y1 + (b2/a0)*this.y2
                      - (a1/a0)*this.y1 - (a2/a0)*this.y2
    
    this.y2 = this.y1
    this.y1 = y
    
    emit out(y)
  }
}

// Deck combining multiple effects
deck EffectChain {
  cards: [Gain, LowpassFilter, Delay]
  
  routing {
    input -> Gain -> LowpassFilter -> Delay -> output
  }
}
`,
  },
];

/**
 * Gets an example by ID.
 */
export function getExample(id: string): PlaygroundExample | undefined {
  return PLAYGROUND_EXAMPLES.find(e => e.id === id);
}

/**
 * Gets examples by category.
 */
export function getExamplesByCategory(category: PlaygroundExample['category']): PlaygroundExample[] {
  return PLAYGROUND_EXAMPLES.filter(e => e.category === category);
}

/**
 * Searches examples by query.
 */
export function searchExamples(query: string): PlaygroundExample[] {
  const lower = query.toLowerCase();
  return PLAYGROUND_EXAMPLES.filter(e => 
    e.title.toLowerCase().includes(lower) ||
    e.description.toLowerCase().includes(lower) ||
    e.tags.some(t => t.toLowerCase().includes(lower))
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escapes HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats a timestamp.
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Adjusts color brightness.
 */
function adjustBrightness(color: string, amount: number): string {
  // Simple brightness adjustment for hex colors
  const match = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return color;
  
  const r = Math.max(0, Math.min(255, parseInt(match[1]!, 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(match[2]!, 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(match[3]!, 16) + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Creates button style string.
 */
function buttonStyle(theme: HighlightTheme): string {
  return `
    padding: 6px 12px;
    background: ${theme.colors['keyword'] || '#569cd6'};
    color: ${theme.colors['foreground']};
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
  `;
}

/**
 * Creates select style string.
 */
function selectStyle(theme: HighlightTheme): string {
  return `
    padding: 6px 8px;
    background: ${theme.colors['background']};
    color: ${theme.colors['foreground']};
    border: 1px solid ${theme.colors['punctuation'] || '#666'};
    border-radius: 4px;
    font-family: inherit;
    font-size: 13px;
  `;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a new playground instance.
 */
export function createPlayground(config?: PlaygroundConfig): Playground {
  return new Playground(config);
}

/**
 * Creates and mounts a playground to a DOM element.
 */
export function mountPlayground(
  container: HTMLElement | string,
  config?: PlaygroundConfig
): Playground {
  const element = typeof container === 'string'
    ? document.querySelector<HTMLElement>(container)
    : container;
    
  if (!element) {
    throw new Error(`Container not found: ${container}`);
  }
  
  const playground = createPlayground(config);
  playground.mount(element);
  return playground;
}
