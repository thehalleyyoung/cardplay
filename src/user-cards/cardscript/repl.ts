/**
 * @fileoverview CardScript REPL (Read-Eval-Print Loop).
 * 
 * Provides an interactive REPL for testing CardScript with:
 * - Command-line interface
 * - History navigation
 * - Multi-line input
 * - Auto-completion
 * - Live card evaluation
 * 
 * @module @cardplay/user-cards/cardscript/repl
 */

import { tokenize } from './lexer';
import { parse } from './parser';
import { typeCheck } from './types';
import { compileProgram, createRuntimeContext, RuntimeContext } from './compiler';
import { CardScriptDebugger, getDebugger } from './debug';
import type { Program } from './ast';

// ============================================================================
// REPL TYPES
// ============================================================================

/**
 * REPL command.
 */
export interface ReplCommand {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  execute: (args: string[], repl: CardScriptRepl) => string | Promise<string>;
}

/**
 * REPL options.
 */
export interface ReplOptions {
  prompt?: string;
  multilinePrompt?: string;
  historySize?: number;
  verbose?: boolean;
  debug?: boolean;
}

/**
 * REPL state.
 */
export interface ReplState {
  variables: Record<string, unknown>;
  cards: Map<string, unknown>;
  history: string[];
  historyIndex: number;
  multilineBuffer: string[];
  isMultiline: boolean;
}

/**
 * REPL output.
 */
export interface ReplOutput {
  type: 'result' | 'error' | 'info' | 'warning' | 'help';
  text: string;
  value?: unknown;
}

// ============================================================================
// REPL IMPLEMENTATION
// ============================================================================

/**
 * CardScript REPL.
 */
export class CardScriptRepl {
  private options: Required<ReplOptions>;
  private state: ReplState;
  private context: RuntimeContext;
  /** Debugger instance for step-through debugging */
  readonly debuggerInstance: CardScriptDebugger;
  private commands: Map<string, ReplCommand> = new Map();
  private outputListeners: Array<(output: ReplOutput) => void> = [];
  
  constructor(options: ReplOptions = {}) {
    this.options = {
      prompt: '> ',
      multilinePrompt: '... ',
      historySize: 1000,
      verbose: false,
      debug: false,
      ...options,
    };
    
    this.state = {
      variables: {},
      cards: new Map(),
      history: [],
      historyIndex: 0,
      multilineBuffer: [],
      isMultiline: false,
    };
    
    this.context = createRuntimeContext();
    this.debuggerInstance = getDebugger();
    
    this.registerBuiltinCommands();
  }
  
  // -------------------------------------------------------------------------
  // EVALUATION
  // -------------------------------------------------------------------------
  
  /**
   * Evaluates a line of input.
   */
  async eval(input: string): Promise<ReplOutput> {
    const trimmed = input.trim();
    
    // Empty input
    if (!trimmed) {
      return { type: 'result', text: '' };
    }
    
    // Add to history
    if (this.state.history[this.state.history.length - 1] !== trimmed) {
      this.state.history.push(trimmed);
      if (this.state.history.length > this.options.historySize) {
        this.state.history.shift();
      }
    }
    this.state.historyIndex = this.state.history.length;
    
    // Check for commands
    if (trimmed.startsWith(':')) {
      return this.executeCommand(trimmed.slice(1));
    }
    
    // Check for multiline continuation
    if (this.state.isMultiline) {
      if (trimmed === '') {
        // End multiline input
        const fullInput = this.state.multilineBuffer.join('\n');
        this.state.multilineBuffer = [];
        this.state.isMultiline = false;
        return this.evalCode(fullInput);
      }
      this.state.multilineBuffer.push(input);
      return { type: 'info', text: '' };
    }
    
    // Check if input needs multiline
    if (this.needsMultiline(trimmed)) {
      this.state.isMultiline = true;
      this.state.multilineBuffer = [input];
      return { type: 'info', text: '' };
    }
    
    // Evaluate as code
    return this.evalCode(trimmed);
  }
  
  /**
   * Evaluates CardScript code.
   */
  private async evalCode(code: string): Promise<ReplOutput> {
    try {
      // Tokenize for verbose output
      if (this.options.verbose) {
        const lexResult = tokenize(code);
        this.output({
          type: 'info',
          text: `Tokens: ${lexResult.tokens.map(t => t.type).join(', ')}`,
        });
      }
      
      // Parse
      const parseResult = parse(code);
      
      if (!parseResult.success) {
        const errors = [...parseResult.lexerErrors, ...parseResult.errors];
        const errorText = errors.map(e => e.message).join('\n');
        return { type: 'error', text: `Parse errors:\n${errorText}` };
      }
      
      if (this.options.verbose) {
        this.output({
          type: 'info',
          text: `AST: ${JSON.stringify(parseResult.ast, null, 2)}`,
        });
      }
      
      // Type check
      const typeResult = typeCheck(parseResult.ast);
      if (typeResult.errors.length > 0) {
        const errorText = typeResult.errors.map(e => 
          `${e.message} at line ${e.span?.start.line ?? '?'}`
        ).join('\n');
        return { type: 'error', text: `Type errors:\n${errorText}` };
      }
      
      // Compile and execute
      const result = await this.execute(parseResult.ast);
      
      // Store result in special variable
      if (result !== undefined) {
        this.state.variables['_'] = result;
        this.state.variables[`_${this.state.history.length}`] = result;
      }
      
      return {
        type: 'result',
        text: this.formatValue(result),
        value: result,
      };
      
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      return {
        type: 'error',
        text: `Error: ${error.message}`,
      };
    }
  }
  
  /**
   * Executes a parsed AST.
   */
  private async execute(ast: Program): Promise<unknown> {
    const compiledCards = compileProgram(ast);
    
    // Merge REPL variables into context
    for (const [name, value] of Object.entries(this.state.variables)) {
      (this.context as unknown as Record<string, unknown>)[name] = value;
    }
    
    // If there are cards, return the first one's info
    // In a real REPL, we'd execute expressions and statements too
    if (compiledCards.length > 0) {
      return compiledCards.map(c => ({
        id: c.meta.id,
        name: c.meta.name,
        category: c.meta.category,
      }));
    }
    
    // For non-card expressions, return undefined for now
    // A full implementation would evaluate arbitrary expressions
    return undefined;
  }
  
  // -------------------------------------------------------------------------
  // COMMANDS
  // -------------------------------------------------------------------------
  
  /**
   * Registers built-in REPL commands.
   */
  private registerBuiltinCommands(): void {
    this.registerCommand({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show help for commands',
      usage: ':help [command]',
      execute: (args) => {
        if (args.length > 0) {
          const cmd = this.commands.get(args[0]!);
          if (cmd) {
            return `${cmd.name}: ${cmd.description}\nUsage: ${cmd.usage}`;
          }
          return `Unknown command: ${args[0]}`;
        }
        
        const lines = ['CardScript REPL Commands:', ''];
        for (const cmd of Array.from(this.commands.values())) {
          const aliases = cmd.aliases.length > 0 
            ? ` (${cmd.aliases.join(', ')})` 
            : '';
          lines.push(`  :${cmd.name}${aliases} - ${cmd.description}`);
        }
        return lines.join('\n');
      },
    });
    
    this.registerCommand({
      name: 'clear',
      aliases: ['cls'],
      description: 'Clear the REPL state',
      usage: ':clear',
      execute: () => {
        this.state.variables = {};
        this.state.cards.clear();
        this.context = createRuntimeContext();
        return 'State cleared';
      },
    });
    
    this.registerCommand({
      name: 'vars',
      aliases: ['v'],
      description: 'List all variables',
      usage: ':vars',
      execute: () => {
        const entries = Object.entries(this.state.variables);
        if (entries.length === 0) {
          return 'No variables defined';
        }
        return entries.map(([name, value]) => 
          `  ${name}: ${this.formatValue(value)}`
        ).join('\n');
      },
    });
    
    this.registerCommand({
      name: 'cards',
      aliases: ['c'],
      description: 'List all defined cards',
      usage: ':cards',
      execute: () => {
        if (this.state.cards.size === 0) {
          return 'No cards defined';
        }
        return Array.from(this.state.cards.keys())
          .map(name => `  ${name}`)
          .join('\n');
      },
    });
    
    this.registerCommand({
      name: 'type',
      aliases: ['t'],
      description: 'Show the type of an expression',
      usage: ':type <expression>',
      execute: (args) => {
        if (args.length === 0) {
          return 'Usage: :type <expression>';
        }
        const expr = args.join(' ');
        try {
          const parseResult = parse(expr);
          if (!parseResult.success) {
            return `Parse error: ${parseResult.errors[0]?.message ?? 'unknown'}`;
          }
          const result = typeCheck(parseResult.ast);
          // Return inferred type (simplified)
          return `Type: ${result.errors.length === 0 ? 'valid' : 'invalid'}`;
        } catch (e) {
          return `Error: ${e instanceof Error ? e.message : String(e)}`;
        }
      },
    });
    
    this.registerCommand({
      name: 'ast',
      aliases: [],
      description: 'Show the AST of an expression',
      usage: ':ast <expression>',
      execute: (args) => {
        if (args.length === 0) {
          return 'Usage: :ast <expression>';
        }
        const expr = args.join(' ');
        try {
          const parseResult = parse(expr);
          return JSON.stringify(parseResult.ast, null, 2);
        } catch (e) {
          return `Error: ${e instanceof Error ? e.message : String(e)}`;
        }
      },
    });
    
    this.registerCommand({
      name: 'tokens',
      aliases: [],
      description: 'Show the tokens of an expression',
      usage: ':tokens <expression>',
      execute: (args) => {
        if (args.length === 0) {
          return 'Usage: :tokens <expression>';
        }
        const expr = args.join(' ');
        try {
          const lexResult = tokenize(expr);
          return lexResult.tokens.map(t => `${t.type}${t.value !== undefined ? `(${t.value})` : ''}`).join(' ');
        } catch (e) {
          return `Error: ${e instanceof Error ? e.message : String(e)}`;
        }
      },
    });
    
    this.registerCommand({
      name: 'history',
      aliases: ['hist'],
      description: 'Show command history',
      usage: ':history [n]',
      execute: (args) => {
        const count = args[0] ? parseInt(args[0], 10) : 10;
        const start = Math.max(0, this.state.history.length - count);
        return this.state.history.slice(start)
          .map((h, i) => `  ${start + i + 1}: ${h}`)
          .join('\n');
      },
    });
    
    this.registerCommand({
      name: 'debug',
      aliases: ['d'],
      description: 'Toggle debug mode',
      usage: ':debug [on|off]',
      execute: (args) => {
        if (args[0] === 'on') {
          this.options.debug = true;
        } else if (args[0] === 'off') {
          this.options.debug = false;
        } else {
          this.options.debug = !this.options.debug;
        }
        return `Debug mode: ${this.options.debug ? 'on' : 'off'}`;
      },
    });
    
    this.registerCommand({
      name: 'verbose',
      aliases: [],
      description: 'Toggle verbose mode',
      usage: ':verbose [on|off]',
      execute: (args) => {
        if (args[0] === 'on') {
          this.options.verbose = true;
        } else if (args[0] === 'off') {
          this.options.verbose = false;
        } else {
          this.options.verbose = !this.options.verbose;
        }
        return `Verbose mode: ${this.options.verbose ? 'on' : 'off'}`;
      },
    });
    
    this.registerCommand({
      name: 'load',
      aliases: ['l'],
      description: 'Load a CardScript file',
      usage: ':load <filename>',
      execute: async (args) => {
        if (args.length === 0) {
          return 'Usage: :load <filename>';
        }
        // File loading would need to be implemented with actual file system access
        return `File loading not available in this environment`;
      },
    });
    
    this.registerCommand({
      name: 'save',
      aliases: ['s'],
      description: 'Save session to a file',
      usage: ':save <filename>',
      execute: async (args) => {
        if (args.length === 0) {
          return 'Usage: :save <filename>';
        }
        // File saving would need to be implemented with actual file system access
        return `File saving not available in this environment`;
      },
    });
    
    this.registerCommand({
      name: 'reset',
      aliases: [],
      description: 'Reset REPL to initial state',
      usage: ':reset',
      execute: () => {
        this.state = {
          variables: {},
          cards: new Map(),
          history: [],
          historyIndex: 0,
          multilineBuffer: [],
          isMultiline: false,
        };
        this.context = createRuntimeContext();
        return 'REPL reset';
      },
    });
    
    this.registerCommand({
      name: 'quit',
      aliases: ['q', 'exit'],
      description: 'Exit the REPL',
      usage: ':quit',
      execute: () => {
        return '__QUIT__';
      },
    });
  }
  
  /**
   * Registers a custom command.
   */
  registerCommand(command: ReplCommand): void {
    this.commands.set(command.name, command);
    for (const alias of command.aliases) {
      this.commands.set(alias, command);
    }
  }
  
  /**
   * Executes a REPL command.
   */
  private async executeCommand(input: string): Promise<ReplOutput> {
    const parts = input.trim().split(/\s+/);
    const cmdName = parts[0]!;
    const args = parts.slice(1);
    
    const command = this.commands.get(cmdName);
    if (!command) {
      return {
        type: 'error',
        text: `Unknown command: ${cmdName}. Type :help for available commands.`,
      };
    }
    
    const result = await command.execute(args, this);
    
    if (result === '__QUIT__') {
      return { type: 'info', text: 'Goodbye!' };
    }
    
    return { type: 'help', text: result };
  }
  
  // -------------------------------------------------------------------------
  // AUTO-COMPLETION
  // -------------------------------------------------------------------------
  
  /**
   * Gets completions for input.
   */
  complete(input: string): string[] {
    const trimmed = input.trim();
    
    // Command completion
    if (trimmed.startsWith(':')) {
      const partial = trimmed.slice(1).toLowerCase();
      return Array.from(this.commands.keys())
        .filter(name => name.startsWith(partial))
        .map(name => `:${name}`);
    }
    
    // Get the last token for completion
    const parts = trimmed.split(/\s+/);
    const lastPart = parts[parts.length - 1] ?? '';
    
    const completions: string[] = [];
    
    // Variable completion
    for (const name of Object.keys(this.state.variables)) {
      if (name.startsWith(lastPart)) {
        completions.push(name);
      }
    }
    
    // Card completion
    for (const name of Array.from(this.state.cards.keys())) {
      if (name.startsWith(lastPart)) {
        completions.push(name);
      }
    }
    
    // Keyword completion
    const keywords = [
      'card', 'let', 'const', 'fn', 'if', 'else', 'for', 'while',
      'return', 'true', 'false', 'null', 'import', 'export', 'async', 'await',
    ];
    for (const kw of keywords) {
      if (kw.startsWith(lastPart)) {
        completions.push(kw);
      }
    }
    
    return completions;
  }
  
  // -------------------------------------------------------------------------
  // HISTORY
  // -------------------------------------------------------------------------
  
  /**
   * Gets the previous history entry.
   */
  historyPrev(): string | null {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      return this.state.history[this.state.historyIndex] ?? null;
    }
    return null;
  }
  
  /**
   * Gets the next history entry.
   */
  historyNext(): string | null {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      return this.state.history[this.state.historyIndex] ?? null;
    }
    this.state.historyIndex = this.state.history.length;
    return '';
  }
  
  // -------------------------------------------------------------------------
  // OUTPUT
  // -------------------------------------------------------------------------
  
  /**
   * Adds an output listener.
   */
  onOutput(listener: (output: ReplOutput) => void): () => void {
    this.outputListeners.push(listener);
    return () => {
      const idx = this.outputListeners.indexOf(listener);
      if (idx >= 0) this.outputListeners.splice(idx, 1);
    };
  }
  
  /**
   * Outputs a message.
   */
  private output(output: ReplOutput): void {
    for (const listener of this.outputListeners) {
      listener(output);
    }
  }
  
  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------
  
  /**
   * Checks if input needs multiline entry.
   */
  private needsMultiline(input: string): boolean {
    // Count braces
    let braces = 0;
    let parens = 0;
    let brackets = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i]!;
      const prev = i > 0 ? input[i - 1] : '';
      
      if (inString) {
        if (char === stringChar && prev !== '\\') {
          inString = false;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          braces++;
        } else if (char === '}') {
          braces--;
        } else if (char === '(') {
          parens++;
        } else if (char === ')') {
          parens--;
        } else if (char === '[') {
          brackets++;
        } else if (char === ']') {
          brackets--;
        }
      }
    }
    
    return braces > 0 || parens > 0 || brackets > 0 || inString;
  }
  
  /**
   * Formats a value for display.
   */
  private formatValue(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (value.length <= 10) {
        return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
      }
      return `[Array(${value.length})]`;
    }
    
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      if (keys.length <= 5) {
        const pairs = keys.map(k => `${k}: ${this.formatValue(obj[k])}`);
        return `{ ${pairs.join(', ')} }`;
      }
      return `{Object with ${keys.length} keys}`;
    }
    
    return String(value);
  }
  
  /**
   * Gets the current prompt.
   */
  getPrompt(): string {
    return this.state.isMultiline
      ? this.options.multilinePrompt
      : this.options.prompt;
  }
  
  /**
   * Gets REPL state.
   */
  getState(): ReplState {
    return { ...this.state };
  }
  
  /**
   * Sets a variable.
   */
  setVariable(name: string, value: unknown): void {
    this.state.variables[name] = value;
  }
  
  /**
   * Gets a variable.
   */
  getVariable(name: string): unknown {
    return this.state.variables[name];
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a new REPL instance.
 */
export function createRepl(options?: ReplOptions): CardScriptRepl {
  return new CardScriptRepl(options);
}

/**
 * Evaluates a single expression.
 */
export async function evalExpr(expr: string): Promise<unknown> {
  const repl = new CardScriptRepl();
  const result = await repl.eval(expr);
  if (result.type === 'error') {
    throw new Error(result.text);
  }
  return result.value;
}

/**
 * Runs a REPL session with console I/O.
 */
export function runConsoleRepl(): void {
  // Console REPL would need Node.js readline
  console.log('Console REPL not available in browser environment');
}

// ============================================================================
// BROWSER REPL
// ============================================================================

/**
 * Browser REPL UI options.
 */
export interface BrowserReplOptions extends ReplOptions {
  /** Container element or selector */
  container: HTMLElement | string;
  /** Theme */
  theme?: 'light' | 'dark';
  /** Font size */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Max output lines */
  maxOutputLines?: number;
}

/**
 * Browser-based REPL UI.
 */
export class BrowserRepl {
  private repl: CardScriptRepl;
  private container: HTMLElement;
  private options: Required<BrowserReplOptions>;
  private outputEl: HTMLElement;
  private inputEl: HTMLTextAreaElement;
  private promptEl: HTMLElement;
  private historyEl: HTMLElement;
  
  constructor(options: BrowserReplOptions) {
    const container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    
    if (!container) {
      throw new Error('REPL container not found');
    }
    
    this.container = container as HTMLElement;
    this.options = {
      prompt: '> ',
      multilinePrompt: '... ',
      historySize: 1000,
      verbose: false,
      debug: false,
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      lineNumbers: false,
      maxOutputLines: 1000,
      ...options,
      container: this.container,
    };
    
    this.repl = new CardScriptRepl(this.options);
    this.outputEl = document.createElement('div');
    this.inputEl = document.createElement('textarea');
    this.promptEl = document.createElement('span');
    this.historyEl = document.createElement('div');
    
    this.setupUI();
    this.setupEventListeners();
  }
  
  /**
   * Sets up the REPL UI.
   */
  private setupUI(): void {
    this.container.innerHTML = '';
    this.container.className = 'cardscript-repl';
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.container.appendChild(style);
    
    // Output area
    this.outputEl.className = 'repl-output';
    this.container.appendChild(this.outputEl);
    
    // History display
    this.historyEl.className = 'repl-history';
    this.outputEl.appendChild(this.historyEl);
    
    // Input area
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'repl-input-wrapper';
    
    this.promptEl.className = 'repl-prompt';
    this.promptEl.textContent = this.options.prompt;
    inputWrapper.appendChild(this.promptEl);
    
    this.inputEl.className = 'repl-input';
    this.inputEl.rows = 1;
    this.inputEl.placeholder = 'Enter CardScript code...';
    this.inputEl.spellcheck = false;
    this.inputEl.autocomplete = 'off';
    inputWrapper.appendChild(this.inputEl);
    
    this.container.appendChild(inputWrapper);
    
    // Welcome message
    this.appendOutput('info', 'CardScript REPL v1.0.0');
    this.appendOutput('info', 'Type :help for available commands\n');
    
    // Focus input
    this.inputEl.focus();
  }
  
  /**
   * Sets up event listeners.
   */
  private setupEventListeners(): void {
    // Input handling
    this.inputEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await this.executeInput();
      } else if (e.key === 'ArrowUp' && this.inputEl.selectionStart === 0) {
        e.preventDefault();
        const prev = this.repl.historyPrev();
        if (prev !== null) {
          this.inputEl.value = prev;
        }
      } else if (e.key === 'ArrowDown' && this.inputEl.selectionStart === this.inputEl.value.length) {
        e.preventDefault();
        const next = this.repl.historyNext();
        if (next !== null) {
          this.inputEl.value = next;
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleCompletion();
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        this.clear();
      }
    });
    
    // Auto-resize input
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = `${this.inputEl.scrollHeight}px`;
    });
    
    // Click to focus
    this.container.addEventListener('click', () => {
      this.inputEl.focus();
    });
  }
  
  /**
   * Executes the current input.
   */
  private async executeInput(): Promise<void> {
    const input = this.inputEl.value;
    
    // Show input in history
    this.appendOutput('input', `${this.repl.getPrompt()}${input}`);
    
    // Clear input
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    
    // Update prompt for multiline
    this.promptEl.textContent = this.repl.getPrompt();
    
    // Execute
    const result = await this.repl.eval(input);
    
    // Show result
    if (result.text) {
      this.appendOutput(result.type, result.text);
    }
    
    // Update prompt
    this.promptEl.textContent = this.repl.getPrompt();
    
    // Scroll to bottom
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  /**
   * Handles tab completion.
   */
  private handleCompletion(): void {
    const input = this.inputEl.value;
    const completions = this.repl.complete(input);
    
    if (completions.length === 0) {
      return;
    }
    
    if (completions.length === 1) {
      // Single completion - apply it
      const parts = input.split(/\s+/);
      parts[parts.length - 1] = completions[0]!;
      this.inputEl.value = parts.join(' ');
    } else {
      // Multiple completions - show them
      this.appendOutput('info', completions.join('  '));
    }
  }
  
  /**
   * Appends output to the display.
   */
  private appendOutput(type: string, text: string): void {
    const line = document.createElement('div');
    line.className = `repl-line repl-${type}`;
    line.textContent = text;
    this.historyEl.appendChild(line);
    
    // Limit output lines
    while (this.historyEl.children.length > this.options.maxOutputLines) {
      this.historyEl.removeChild(this.historyEl.firstChild!);
    }
    
    // Scroll to bottom
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  /**
   * Clears the output.
   */
  clear(): void {
    this.historyEl.innerHTML = '';
  }
  
  /**
   * Gets the underlying REPL instance.
   */
  getRepl(): CardScriptRepl {
    return this.repl;
  }
  
  /**
   * Evaluates code programmatically.
   */
  async eval(code: string): Promise<ReplOutput> {
    this.appendOutput('input', `${this.repl.getPrompt()}${code}`);
    const result = await this.repl.eval(code);
    if (result.text) {
      this.appendOutput(result.type, result.text);
    }
    return result;
  }
  
  /**
   * Gets CSS styles for the REPL.
   */
  private getStyles(): string {
    const isDark = this.options.theme === 'dark';
    const bg = isDark ? '#1e1e1e' : '#ffffff';
    const fg = isDark ? '#d4d4d4' : '#333333';
    const inputBg = isDark ? '#252526' : '#f5f5f5';
    const resultColor = isDark ? '#4ec9b0' : '#0070c1';
    const errorColor = isDark ? '#f44747' : '#c50f1f';
    const infoColor = isDark ? '#6a9955' : '#098658';
    const helpColor = isDark ? '#569cd6' : '#0000ff';
    
    return `
      .cardscript-repl {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: ${bg};
        color: ${fg};
        font-family: ${this.options.fontFamily};
        font-size: ${this.options.fontSize}px;
        line-height: 1.5;
        padding: 8px;
        box-sizing: border-box;
      }
      
      .repl-output {
        flex: 1;
        overflow-y: auto;
        padding-bottom: 8px;
      }
      
      .repl-history {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      .repl-line {
        margin: 2px 0;
      }
      
      .repl-input-wrapper {
        display: flex;
        align-items: flex-start;
        background: ${inputBg};
        border-radius: 4px;
        padding: 4px 8px;
      }
      
      .repl-prompt {
        color: ${resultColor};
        user-select: none;
        padding-right: 4px;
      }
      
      .repl-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: ${fg};
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        resize: none;
        padding: 0;
        margin: 0;
      }
      
      .repl-result {
        color: ${resultColor};
      }
      
      .repl-error {
        color: ${errorColor};
      }
      
      .repl-info {
        color: ${infoColor};
      }
      
      .repl-help {
        color: ${helpColor};
      }
      
      .repl-input-line {
        color: ${fg};
        opacity: 0.8;
      }
      
      .repl-warning {
        color: #dcdcaa;
      }
    `;
  }
  
  /**
   * Destroys the REPL UI.
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * Creates a browser REPL in the specified container.
 */
export function createBrowserRepl(options: BrowserReplOptions): BrowserRepl {
  return new BrowserRepl(options);
}

/**
 * Mounts a REPL to a DOM element by ID.
 */
export function mountRepl(elementId: string, options?: Partial<BrowserReplOptions>): BrowserRepl {
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`Element with id "${elementId}" not found`);
  }
  return new BrowserRepl({ container, ...options });
}