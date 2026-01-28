/**
 * @fileoverview Prolog Adapter - Tau Prolog Engine Wrapper
 * 
 * Provides a TypeScript-friendly API for interacting with Tau Prolog.
 * Supports:
 * - Loading Prolog programs (consult)
 * - Querying with single/multiple/all solutions
 * - Error handling and timeouts
 * - Term conversion between Prolog and JavaScript
 * 
 * @module @cardplay/ai/engine/prolog-adapter
 */

// Import Tau Prolog
import pl from 'tau-prolog';

// Load commonly used modules - must be invoked with pl to register
import listsModule from 'tau-prolog/modules/lists.js';
import randomModule from 'tau-prolog/modules/random.js';
import formatModule from 'tau-prolog/modules/format.js';

// Register modules with the pl object
listsModule(pl);
randomModule(pl);
formatModule(pl);

// ============================================================================
// TYPES
// ============================================================================

/**
 * Prolog term representation.
 */
export type PrologTerm =
  | PrologAtom
  | PrologNumber
  | PrologVariable
  | PrologList
  | PrologCompound;

/**
 * Prolog atom (string constant).
 */
export interface PrologAtom {
  readonly type: 'atom';
  readonly value: string;
}

/**
 * Prolog number (integer or float).
 */
export interface PrologNumber {
  readonly type: 'number';
  readonly value: number;
}

/**
 * Prolog variable.
 */
export interface PrologVariable {
  readonly type: 'variable';
  readonly name: string;
}

/**
 * Prolog list.
 */
export interface PrologList {
  readonly type: 'list';
  readonly elements: readonly PrologTerm[];
}

/**
 * Prolog compound term (functor with arguments).
 */
export interface PrologCompound {
  readonly type: 'compound';
  readonly functor: string;
  readonly args: readonly PrologTerm[];
}

/**
 * Solution from a Prolog query (variable bindings).
 */
export type PrologSolution = Record<string, unknown>;

/**
 * Query result.
 */
export interface QueryResult {
  /** Whether the query succeeded */
  readonly success: boolean;
  /** All solutions found */
  readonly solutions: readonly PrologSolution[];
  /** Error message if failed */
  readonly error?: string;
  /** Time taken in milliseconds */
  readonly timeMs: number;
}

// ============================================================================
// HOST ACTION TYPES
// ============================================================================

/**
 * HostAction represents an action that can be performed on a card or the host.
 * This is the canonical encoding for Prolog to communicate actions back to JS.
 * 
 * In Prolog, these are represented as compound terms:
 * - set_param(CardId, ParamName, Value)
 * - invoke_method(CardId, MethodName, Args)
 * - add_card(DeckId, CardType, InitParams)
 * - remove_card(CardId)
 * - move_card(CardId, FromDeck, ToDeck)
 */
export type HostAction =
  | HostActionSetParam
  | HostActionInvokeMethod
  | HostActionAddCard
  | HostActionRemoveCard
  | HostActionMoveCard;

export interface HostActionSetParam {
  readonly action: 'set_param';
  readonly cardId: string;
  readonly paramName: string;
  readonly value: unknown;
}

export interface HostActionInvokeMethod {
  readonly action: 'invoke_method';
  readonly cardId: string;
  readonly methodName: string;
  readonly args: readonly unknown[];
}

export interface HostActionAddCard {
  readonly action: 'add_card';
  readonly deckId: string;
  readonly cardType: string;
  readonly initParams: Record<string, unknown>;
}

export interface HostActionRemoveCard {
  readonly action: 'remove_card';
  readonly cardId: string;
}

export interface HostActionMoveCard {
  readonly action: 'move_card';
  readonly cardId: string;
  readonly fromDeck: string;
  readonly toDeck: string;
}

// ============================================================================
// QUERY OPTIONS
// ============================================================================

/**
 * Query options.
 */
export interface QueryOptions {
  /** Maximum number of solutions to return */
  readonly maxSolutions?: number;
  /** Timeout in milliseconds */
  readonly timeoutMs?: number;
  /** Whether to format answers as strings */
  readonly formatAnswers?: boolean;
}

/**
 * Default query options.
 */
export const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  maxSolutions: 100,
  timeoutMs: 5000,
  formatAnswers: false,
};

/**
 * Prolog adapter configuration.
 */
export interface PrologAdapterConfig {
  /** Default query timeout */
  readonly defaultTimeoutMs: number;
  /** Maximum solutions per query */
  readonly maxSolutionsPerQuery: number;
  /** Enable query caching */
  readonly enableCache: boolean;
  /** Cache TTL in milliseconds */
  readonly cacheTtlMs: number;
}

/**
 * Default adapter configuration.
 */
export const DEFAULT_ADAPTER_CONFIG: PrologAdapterConfig = {
  defaultTimeoutMs: 5000,
  maxSolutionsPerQuery: 1000,
  enableCache: true,
  cacheTtlMs: 60000,
};

// ============================================================================
// PROLOG ADAPTER CLASS
// ============================================================================

/**
 * Prolog adapter wrapping Tau Prolog engine.
 */
export class PrologAdapter {
  private session: ReturnType<typeof pl.create>;
  private config: PrologAdapterConfig;
  private loadedPrograms: Set<string> = new Set();
  private cache: Map<string, { result: QueryResult; timestamp: number }> = new Map();
  private initialized: boolean = false;
  
  constructor(config: Partial<PrologAdapterConfig> = {}) {
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
    this.session = pl.create();
  }
  
  /**
   * Initialize the session with standard modules.
   * Called automatically on first query if not called explicitly.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load standard library modules
    await this.loadProgram(':- use_module(library(lists)).', 'stdlib_lists');
    await this.loadProgram(':- use_module(library(random)).', 'stdlib_random');
    this.initialized = true;
  }
  
  /**
   * Load a Prolog program.
   */
  async loadProgram(prologCode: string, programId?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const id = programId || this.hashCode(prologCode);
      
      // Skip if already loaded
      if (this.loadedPrograms.has(id)) {
        resolve(true);
        return;
      }
      
      this.session.consult(prologCode, {
        success: () => {
          this.loadedPrograms.add(id);
          this.clearCache(); // Invalidate cache on program change
          resolve(true);
        },
        error: (err: unknown) => {
          reject(new Error(`Failed to load Prolog program: ${this.formatError(err)}`));
        },
      });
    });
  }
  
  /**
   * Load a Prolog file from URL or path.
   */
  async loadFile(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.loadedPrograms.has(url)) {
        resolve(true);
        return;
      }
      
      this.session.consult(url, {
        file: true,
        success: () => {
          this.loadedPrograms.add(url);
          this.clearCache();
          resolve(true);
        },
        error: (err: unknown) => {
          reject(new Error(`Failed to load Prolog file: ${this.formatError(err)}`));
        },
      });
    });
  }
  
  /**
   * Execute a query and return the first solution.
   */
  async querySingle(
    queryString: string,
    options: QueryOptions = {}
  ): Promise<PrologSolution | null> {
    const result = await this.query(queryString, { ...options, maxSolutions: 1 });
    return result.solutions[0] ?? null;
  }
  
  /**
   * Execute a query and return all solutions.
   */
  async queryAll(
    queryString: string,
    options: QueryOptions = {}
  ): Promise<readonly PrologSolution[]> {
    const result = await this.query(queryString, options);
    return result.solutions;
  }
  
  /**
   * Execute a query and return the full result.
   */
  async query(
    queryString: string,
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    // Ensure initialized
    await this.initialize();
    
    const opts = { ...DEFAULT_QUERY_OPTIONS, ...options };
    const startTime = performance.now();
    
    // Check cache
    if (this.config.enableCache) {
      const cached = this.getCached(queryString);
      if (cached) {
        return cached;
      }
    }
    
    // Normalize query (ensure it ends with period)
    const normalizedQuery = queryString.trim().endsWith('.')
      ? queryString.trim()
      : queryString.trim() + '.';
    
    return new Promise((resolve) => {
      const solutions: PrologSolution[] = [];
      let error: string | undefined;
      
      // Create timeout
      const timeoutId = setTimeout(() => {
        const timeMs = performance.now() - startTime;
        const result: QueryResult = {
          success: solutions.length > 0,
          solutions,
          error: 'Query timed out',
          timeMs,
        };
        this.setCached(queryString, result);
        resolve(result);
      }, opts.timeoutMs);
      
      // Execute query
      this.session.query(normalizedQuery, {
        success: () => {
          // Query parsed successfully, now get answers
          this.collectAnswers(
            solutions,
            opts.maxSolutions ?? this.config.maxSolutionsPerQuery,
            opts.formatAnswers ?? false,
            () => {
	              clearTimeout(timeoutId);
	              const timeMs = performance.now() - startTime;
	              const result: QueryResult = {
	                success: solutions.length > 0,
	                solutions,
	                ...(error === undefined ? {} : { error }),
	                timeMs,
	              };
	              this.setCached(queryString, result);
	              resolve(result);
            }
          );
	        },
	        error: (err: unknown) => {
	          clearTimeout(timeoutId);
	          const message = this.formatError(err);
	          const timeMs = performance.now() - startTime;
	          resolve({
	            success: false,
	            solutions: [],
	            error: message,
	            timeMs,
	          });
	        },
      });
    });
  }
  
  /**
   * Assert a fact or rule dynamically.
   */
  async assertz(clause: string): Promise<boolean> {
    const queryStr = clause.trim().endsWith('.')
      ? `assertz((${clause.slice(0, -1)}))`
      : `assertz((${clause}))`;
    
    const result = await this.query(queryStr + '.');
    this.clearCache();
    return result.success;
  }
  
  /**
   * Assert a fact at the beginning.
   */
  async asserta(clause: string): Promise<boolean> {
    const queryStr = clause.trim().endsWith('.')
      ? `asserta((${clause.slice(0, -1)}))`
      : `asserta((${clause}))`;
    
    const result = await this.query(queryStr + '.');
    this.clearCache();
    return result.success;
  }
  
  /**
   * Retract a fact or rule.
   */
  async retract(clause: string): Promise<boolean> {
    const queryStr = clause.trim().endsWith('.')
      ? `retract((${clause.slice(0, -1)}))`
      : `retract((${clause}))`;
    
    const result = await this.query(queryStr + '.');
    this.clearCache();
    return result.success;
  }
  
  /**
   * Retract all matching clauses.
   */
  async retractAll(head: string): Promise<boolean> {
    const queryStr = `retractall(${head})`;
    const result = await this.query(queryStr + '.');
    this.clearCache();
    return result.success;
  }
  
  /**
   * Check if a goal succeeds (without caring about bindings).
   */
  async succeeds(goal: string): Promise<boolean> {
    const result = await this.querySingle(goal);
    return result !== null;
  }
  
  /**
   * Get all values for a variable in a query.
   */
  async findAll<T = unknown>(
    template: string,
    goal: string
  ): Promise<T[]> {
    // Wrap goal in parentheses to ensure compound goals work correctly
    const queryStr = `findall(${template}, (${goal}), Results).`;
    const result = await this.querySingle(queryStr);
    
    if (!result || !result['Results']) {
      return [];
    }
    
    return this.termToJS(result['Results']) as T[];
  }
  
  /**
   * Reset the Prolog session.
   */
  reset(): void {
    this.session = pl.create();
    this.loadedPrograms.clear();
    this.clearCache();
    
    // Reload standard library
    this.session.consult(':- use_module(library(lists)).');
    this.session.consult(':- use_module(library(random)).');
  }
  
  /**
   * Clear the query cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get statistics about the adapter.
   */
  getStats(): {
    loadedPrograms: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      loadedPrograms: this.loadedPrograms.size,
      cacheSize: this.cache.size,
      cacheHitRate: 0, // TODO: Track hit rate
    };
  }
  
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  
  /**
   * Collect answers from the session.
   */
  private collectAnswers(
    solutions: PrologSolution[],
    maxSolutions: number,
    formatAnswers: boolean,
    onComplete: () => void
  ): void {
    if (solutions.length >= maxSolutions) {
      onComplete();
      return;
    }
    
    this.session.answer({
      success: (answer: unknown) => {
        if (formatAnswers) {
          solutions.push({
            _formatted: this.session.format_answer(answer),
          });
        } else {
          solutions.push(this.answerToSolution(answer));
        }
        
        // Get next answer
        this.collectAnswers(solutions, maxSolutions, formatAnswers, onComplete);
      },
      fail: () => {
        // No more answers
        onComplete();
      },
      error: (err: unknown) => {
        // Error getting answer, stop
        console.error('Error getting answer:', this.formatError(err));
        onComplete();
      },
      limit: () => {
        // Reached limit
        onComplete();
      },
    });
  }
  
  /**
   * Convert a Tau Prolog answer to a solution object.
   */
  private answerToSolution(answer: unknown): PrologSolution {
    if (!answer || typeof answer !== 'object') {
      return {};
    }
    
    const solution: Record<string, unknown> = {};
    
    // Tau Prolog answer has links property with variable bindings
    const links = (answer as { links?: Record<string, unknown> }).links;
    if (links) {
      for (const [varName, term] of Object.entries(links)) {
        solution[varName] = this.termToJS(term);
      }
    }
    
    return solution;
  }
  
  /**
   * Convert a Prolog term to JavaScript value.
   */
  termToJS(term: unknown): unknown {
    if (term === null || term === undefined) {
      return null;
    }
    
    // Already a primitive
    if (typeof term === 'string' || typeof term === 'number' || typeof term === 'boolean') {
      return term;
    }
    
    // Tau Prolog term object
    if (typeof term === 'object') {
      const t = term as { 
        id?: string; 
        args?: unknown[]; 
        value?: unknown; 
        toJavaScript?: () => unknown;
        is_float?: boolean;
      };
      
      // Check if it's a Tau Prolog Num (has is_float property)
      if ('is_float' in t && 'value' in t) {
        return t.value as number;
      }
      
      // No id means it's not a Prolog term
      if (!('id' in t) || t.id === undefined) {
        // Try built-in conversion if not a Prolog term structure
        if (typeof t.toJavaScript === 'function') {
          return t.toJavaScript();
        }
        return term;
      }
      
      switch (t.id) {
        case 'atom':
        case 'var':
          return t.value ?? String(t);
          
        case 'number':
          return t.value as number;
          
        case '.': // List cons cell
          return this.listToArray(term);
          
        case '[]': // Empty list
          return [];
          
        default:
          // Compound term - return as object with functor and args
          // (Don't use toJavaScript() here as it just stringifies)
          if (t.args && t.args.length > 0) {
            return {
              functor: t.id,
              args: t.args.map(arg => this.termToJS(arg)),
            };
          }
          // Atom
          return t.id;
      }
    }
    
    // Array (already converted)
    if (Array.isArray(term)) {
      return term.map(item => this.termToJS(item));
    }
    
    // Object with values
    if (typeof term === 'object') {
      return term;
    }
    
    return term;
  }
  
  /**
   * Convert a JavaScript value to Prolog term string.
   */
  jsToTermString(value: unknown): string {
    if (value === null || value === undefined) {
      return '[]';
    }
    
    if (typeof value === 'number') {
      return String(value);
    }
    
    if (typeof value === 'string') {
      // Quote if contains special characters
      if (/^[a-z][a-zA-Z0-9_]*$/.test(value)) {
        return value; // Valid atom
      }
      return `'${value.replace(/'/g, "''")}'`;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'fail';
    }
    
    if (Array.isArray(value)) {
      const elements = value.map(v => this.jsToTermString(v));
      return `[${elements.join(', ')}]`;
    }
    
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      
      // Compound term representation
      if ('functor' in obj && 'args' in obj) {
        const args = (obj['args'] as unknown[]).map(a => this.jsToTermString(a));
        return `${obj['functor']}(${args.join(', ')})`;
      }
      
      // Convert object to list of key-value pairs
      const pairs = Object.entries(obj).map(
        ([k, v]) => `${k}-${this.jsToTermString(v)}`
      );
      return `[${pairs.join(', ')}]`;
    }
    
    return String(value);
  }
  
  /**
   * Convert a HostAction to Prolog term string.
   * 
   * HostActions are represented as compound terms:
   * - set_param(CardId, ParamName, Value)
   * - invoke_method(CardId, MethodName, Args)
   * - add_card(DeckId, CardType, InitParams)
   * - remove_card(CardId)
   * - move_card(CardId, FromDeck, ToDeck)
   */
  hostActionToTermString(action: HostAction): string {
    switch (action.action) {
      case 'set_param':
        return `set_param(${this.jsToTermString(action.cardId)}, ${this.jsToTermString(action.paramName)}, ${this.jsToTermString(action.value)})`;
        
      case 'invoke_method':
        return `invoke_method(${this.jsToTermString(action.cardId)}, ${this.jsToTermString(action.methodName)}, ${this.jsToTermString([...action.args])})`;
        
      case 'add_card':
        return `add_card(${this.jsToTermString(action.deckId)}, ${this.jsToTermString(action.cardType)}, ${this.jsToTermString(action.initParams)})`;
        
      case 'remove_card':
        return `remove_card(${this.jsToTermString(action.cardId)})`;
        
      case 'move_card':
        return `move_card(${this.jsToTermString(action.cardId)}, ${this.jsToTermString(action.fromDeck)}, ${this.jsToTermString(action.toDeck)})`;
    }
  }
  
  /**
   * Parse a Prolog compound term as a HostAction.
   * Returns null if the term is not a valid HostAction.
   */
  termToHostAction(term: unknown): HostAction | null {
    if (!term || typeof term !== 'object') {
      return null;
    }
    
    // First convert to JS representation
    const jsValue = this.termToJS(term);
    
    if (typeof jsValue !== 'object' || !jsValue) {
      return null;
    }
    
    const compound = jsValue as { functor?: string; args?: unknown[] };
    
    if (!compound.functor || !Array.isArray(compound.args)) {
      return null;
    }
    
    switch (compound.functor) {
      case 'set_param':
        if (compound.args.length === 3) {
          return {
            action: 'set_param',
            cardId: String(compound.args[0]),
            paramName: String(compound.args[1]),
            value: compound.args[2],
          };
        }
        break;
        
      case 'invoke_method':
        if (compound.args.length === 3) {
          return {
            action: 'invoke_method',
            cardId: String(compound.args[0]),
            methodName: String(compound.args[1]),
            args: Array.isArray(compound.args[2]) ? compound.args[2] : [],
          };
        }
        break;
        
      case 'add_card':
        if (compound.args.length === 3) {
          return {
            action: 'add_card',
            deckId: String(compound.args[0]),
            cardType: String(compound.args[1]),
            initParams: typeof compound.args[2] === 'object' && compound.args[2] !== null
              ? compound.args[2] as Record<string, unknown>
              : {},
          };
        }
        break;
        
      case 'remove_card':
        if (compound.args.length === 1) {
          return {
            action: 'remove_card',
            cardId: String(compound.args[0]),
          };
        }
        break;
        
      case 'move_card':
        if (compound.args.length === 3) {
          return {
            action: 'move_card',
            cardId: String(compound.args[0]),
            fromDeck: String(compound.args[1]),
            toDeck: String(compound.args[2]),
          };
        }
        break;
    }
    
    return null;
  }
  
  /**
   * Query for HostActions and parse the results.
   */
  async queryHostActions(queryString: string, actionVar = 'Action'): Promise<HostAction[]> {
    const solutions = await this.queryAll(queryString);
    const actions: HostAction[] = [];
    
    for (const solution of solutions) {
      const actionTerm = solution[actionVar];
      const hostAction = this.termToHostAction(actionTerm);
      if (hostAction) {
        actions.push(hostAction);
      }
    }
    
    return actions;
  }
  
  /**
   * Convert Prolog list to JavaScript array.
   */
  private listToArray(term: unknown): unknown[] {
    const result: unknown[] = [];
    let current = term;
    
    while (current && typeof current === 'object') {
      const c = current as { id: string; args?: unknown[] };
      
      if (c.id === '[]') {
        break;
      }
      
      if (c.id === '.' && c.args && c.args.length >= 2) {
        result.push(this.termToJS(c.args[0]));
        current = c.args[1];
      } else {
        break;
      }
    }
    
    return result;
  }
  
  /**
   * Format a Prolog error.
   */
  private formatError(err: unknown): string {
    if (!err) return 'Unknown error';
    
    if (typeof err === 'string') return err;
    
    if (typeof err === 'object') {
      const e = err as { args?: unknown[]; message?: string };
      if (e.args && e.args.length > 0) {
        return `${e.args.map(a => this.termToJS(a)).join(': ')}`;
      }
      if (e.message) return e.message;
    }
    
    return String(err);
  }
  
  /**
   * Get cached result.
   */
  private getCached(queryString: string): QueryResult | null {
    const cached = this.cache.get(queryString);
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.config.cacheTtlMs) {
      this.cache.delete(queryString);
      return null;
    }
    
    return cached.result;
  }
  
  /**
   * Set cached result.
   */
  private setCached(queryString: string, result: QueryResult): void {
    if (!this.config.enableCache) return;
    
    this.cache.set(queryString, {
      result,
      timestamp: Date.now(),
    });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      // Remove oldest entries
      const entries = [...this.cache.entries()];
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 100; i++) {
        this.cache.delete(entries[i]![0]);
      }
    }
  }
  
  /**
   * Simple hash function for program deduplication.
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `program_${hash}`;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let prologAdapterInstance: PrologAdapter | null = null;

/**
 * Get the Prolog adapter singleton.
 */
export function getPrologAdapter(): PrologAdapter {
  if (!prologAdapterInstance) {
    prologAdapterInstance = new PrologAdapter();
  }
  return prologAdapterInstance;
}

/**
 * Reset the Prolog adapter (for testing).
 */
export function resetPrologAdapter(): void {
  if (prologAdapterInstance) {
    prologAdapterInstance.reset();
  }
  prologAdapterInstance = null;
}

/**
 * Create a new isolated Prolog adapter instance.
 */
export function createPrologAdapter(config?: Partial<PrologAdapterConfig>): PrologAdapter {
  return new PrologAdapter(config);
}
