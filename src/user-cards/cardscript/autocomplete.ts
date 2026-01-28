/**
 * @fileoverview CardScript Autocomplete Support.
 * 
 * Provides intelligent code completion for CardScript with:
 * - Keyword completion
 * - Variable/function/type completion from scope
 * - Property/method completion for objects
 * - Import path completion
 * - Parameter hints
 * - Snippet expansion
 * 
 * @module @cardplay/user-cards/cardscript/autocomplete
 */

import type { 
  Expression, 
} from './ast';
import type { SourcePosition } from './grammar';

// ============================================================================
// COMPLETION TYPES
// ============================================================================

/**
 * Types of completions.
 */
export type CompletionKind =
  | 'keyword'
  | 'variable'
  | 'function'
  | 'method'
  | 'property'
  | 'type'
  | 'card'
  | 'param'
  | 'module'
  | 'snippet'
  | 'constant'
  | 'class'
  | 'interface'
  | 'enum'
  | 'enumMember'
  ;

/**
 * A single completion item.
 */
export interface CompletionItem {
  /** Display label */
  label: string;
  /** What kind of completion */
  kind: CompletionKind;
  /** Detailed information */
  detail?: string;
  /** Documentation (markdown supported) */
  documentation?: string;
  /** Text to insert (may differ from label) */
  insertText?: string;
  /** Whether insertText is a snippet with placeholders */
  isSnippet?: boolean;
  /** Sort priority (lower = higher priority) */
  sortPriority?: number;
  /** Filter text for matching */
  filterText?: string;
  /** Type information */
  type?: string;
  /** Deprecated flag */
  deprecated?: boolean;
  /** Required import (if any) */
  import?: {
    module: string;
    name: string;
  };
}

/**
 * Completion context.
 */
export interface CompletionContext {
  /** Position in source */
  position: SourcePosition;
  /** Trigger character (if any) */
  triggerCharacter?: string;
  /** Text before cursor on current line */
  textBefore: string;
  /** Text after cursor on current line */
  textAfter: string;
  /** Current word being typed */
  currentWord: string;
  /** Is inside a string */
  inString: boolean;
  /** Is inside a comment */
  inComment: boolean;
  /** Is at top level (not in function/card) */
  isTopLevel: boolean;
  /** Is in type position (after :, <, extends, etc.) */
  inTypePosition: boolean;
  /** Is after dot (property access) */
  afterDot: boolean;
  /** Expression before dot (if any) */
  dotExpression?: Expression;
}

/**
 * Completion result.
 */
export interface CompletionResult {
  /** List of completion items */
  items: CompletionItem[];
  /** Whether the list is complete */
  isComplete: boolean;
}

// ============================================================================
// BUILT-IN COMPLETIONS
// ============================================================================

/**
 * CardScript keywords with snippets.
 */
const KEYWORD_COMPLETIONS: CompletionItem[] = [
  { label: 'let', kind: 'keyword', insertText: 'let ${1:name} = ${2:value};', isSnippet: true, detail: 'Declare a variable' },
  { label: 'const', kind: 'keyword', insertText: 'const ${1:name} = ${2:value};', isSnippet: true, detail: 'Declare a constant' },
  { label: 'function', kind: 'keyword', insertText: 'function ${1:name}(${2:params}): ${3:returnType} {\n\t${0}\n}', isSnippet: true, detail: 'Declare a function' },
  { label: 'card', kind: 'keyword', insertText: 'card ${1:Name} {\n\tinputs: [{ name: "${2:in}", type: "audio" }],\n\toutputs: [{ name: "${3:out}", type: "audio" }],\n\tprocess: (input) => {\n\t\t${0}\n\t}\n}', isSnippet: true, detail: 'Declare a card' },
  { label: 'type', kind: 'keyword', insertText: 'type ${1:Name} = ${2:Type};', isSnippet: true, detail: 'Declare a type alias' },
  { label: 'interface', kind: 'keyword', insertText: 'interface ${1:Name} {\n\t${0}\n}', isSnippet: true, detail: 'Declare an interface' },
  { label: 'if', kind: 'keyword', insertText: 'if (${1:condition}) {\n\t${0}\n}', isSnippet: true, detail: 'If statement' },
  { label: 'else', kind: 'keyword', insertText: 'else {\n\t${0}\n}', isSnippet: true, detail: 'Else clause' },
  { label: 'else if', kind: 'keyword', insertText: 'else if (${1:condition}) {\n\t${0}\n}', isSnippet: true, detail: 'Else if clause' },
  { label: 'for', kind: 'keyword', insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${0}\n}', isSnippet: true, detail: 'For loop' },
  { label: 'for...of', kind: 'keyword', insertText: 'for (const ${1:item} of ${2:iterable}) {\n\t${0}\n}', isSnippet: true, detail: 'For...of loop' },
  { label: 'for...in', kind: 'keyword', insertText: 'for (const ${1:key} in ${2:object}) {\n\t${0}\n}', isSnippet: true, detail: 'For...in loop' },
  { label: 'while', kind: 'keyword', insertText: 'while (${1:condition}) {\n\t${0}\n}', isSnippet: true, detail: 'While loop' },
  { label: 'do...while', kind: 'keyword', insertText: 'do {\n\t${0}\n} while (${1:condition});', isSnippet: true, detail: 'Do...while loop' },
  { label: 'switch', kind: 'keyword', insertText: 'switch (${1:expression}) {\n\tcase ${2:value}:\n\t\t${0}\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}', isSnippet: true, detail: 'Switch statement' },
  { label: 'return', kind: 'keyword', insertText: 'return ${0};', isSnippet: true, detail: 'Return statement' },
  { label: 'throw', kind: 'keyword', insertText: 'throw new Error("${1:message}");', isSnippet: true, detail: 'Throw error' },
  { label: 'try', kind: 'keyword', insertText: 'try {\n\t${0}\n} catch (${1:error}) {\n\t\n}', isSnippet: true, detail: 'Try...catch block' },
  { label: 'async', kind: 'keyword', insertText: 'async ', detail: 'Async function modifier' },
  { label: 'await', kind: 'keyword', insertText: 'await ', detail: 'Await expression' },
  { label: 'import', kind: 'keyword', insertText: 'import { ${1:name} } from "${2:module}";', isSnippet: true, detail: 'Import declaration' },
  { label: 'export', kind: 'keyword', insertText: 'export ', detail: 'Export declaration' },
  { label: 'true', kind: 'keyword', detail: 'Boolean true' },
  { label: 'false', kind: 'keyword', detail: 'Boolean false' },
  { label: 'null', kind: 'keyword', detail: 'Null value' },
  { label: 'undefined', kind: 'keyword', detail: 'Undefined value' },
];

/**
 * Built-in types.
 */
const TYPE_COMPLETIONS: CompletionItem[] = [
  { label: 'number', kind: 'type', detail: 'Numeric type' },
  { label: 'string', kind: 'type', detail: 'String type' },
  { label: 'boolean', kind: 'type', detail: 'Boolean type' },
  { label: 'void', kind: 'type', detail: 'No return value' },
  { label: 'null', kind: 'type', detail: 'Null type' },
  { label: 'undefined', kind: 'type', detail: 'Undefined type' },
  { label: 'any', kind: 'type', detail: 'Any type (escape hatch)' },
  { label: 'unknown', kind: 'type', detail: 'Unknown type (type-safe any)' },
  { label: 'never', kind: 'type', detail: 'Never type' },
  { label: 'object', kind: 'type', detail: 'Object type' },
  { label: 'Array', kind: 'type', insertText: 'Array<${1:T}>', isSnippet: true, detail: 'Array type' },
  { label: 'Promise', kind: 'type', insertText: 'Promise<${1:T}>', isSnippet: true, detail: 'Promise type' },
  { label: 'Map', kind: 'type', insertText: 'Map<${1:K}, ${2:V}>', isSnippet: true, detail: 'Map type' },
  { label: 'Set', kind: 'type', insertText: 'Set<${1:T}>', isSnippet: true, detail: 'Set type' },
  // CardScript-specific types
  { label: 'Event', kind: 'type', insertText: 'Event<${1:P}>', isSnippet: true, detail: 'Event with payload' },
  { label: 'Stream', kind: 'type', insertText: 'Stream<${1:E}>', isSnippet: true, detail: 'Event stream' },
  { label: 'Card', kind: 'type', insertText: 'Card<${1:A}, ${2:B}>', isSnippet: true, detail: 'Card type' },
  { label: 'Audio', kind: 'type', detail: 'Audio signal type' },
  { label: 'MIDI', kind: 'type', detail: 'MIDI data type' },
  { label: 'Control', kind: 'type', detail: 'Control signal (0-1)' },
  { label: 'Tick', kind: 'type', detail: 'Time tick type' },
  { label: 'Voice', kind: 'type', insertText: 'Voice<${1:P}>', isSnippet: true, detail: 'Voice with pitch type' },
  { label: 'Pitch', kind: 'type', detail: 'Base pitch interface' },
];

/**
 * Built-in standard library functions.
 */
const STDLIB_COMPLETIONS: CompletionItem[] = [
  // Math
  { label: 'abs', kind: 'function', insertText: 'abs(${1:x})', isSnippet: true, detail: 'Absolute value', type: '(x: number) => number' },
  { label: 'sin', kind: 'function', insertText: 'sin(${1:x})', isSnippet: true, detail: 'Sine', type: '(x: number) => number' },
  { label: 'cos', kind: 'function', insertText: 'cos(${1:x})', isSnippet: true, detail: 'Cosine', type: '(x: number) => number' },
  { label: 'tan', kind: 'function', insertText: 'tan(${1:x})', isSnippet: true, detail: 'Tangent', type: '(x: number) => number' },
  { label: 'floor', kind: 'function', insertText: 'floor(${1:x})', isSnippet: true, detail: 'Round down', type: '(x: number) => number' },
  { label: 'ceil', kind: 'function', insertText: 'ceil(${1:x})', isSnippet: true, detail: 'Round up', type: '(x: number) => number' },
  { label: 'round', kind: 'function', insertText: 'round(${1:x})', isSnippet: true, detail: 'Round to nearest', type: '(x: number) => number' },
  { label: 'sqrt', kind: 'function', insertText: 'sqrt(${1:x})', isSnippet: true, detail: 'Square root', type: '(x: number) => number' },
  { label: 'pow', kind: 'function', insertText: 'pow(${1:base}, ${2:exp})', isSnippet: true, detail: 'Power', type: '(base: number, exp: number) => number' },
  { label: 'min', kind: 'function', insertText: 'min(${1:a}, ${2:b})', isSnippet: true, detail: 'Minimum', type: '(a: number, b: number) => number' },
  { label: 'max', kind: 'function', insertText: 'max(${1:a}, ${2:b})', isSnippet: true, detail: 'Maximum', type: '(a: number, b: number) => number' },
  { label: 'clamp', kind: 'function', insertText: 'clamp(${1:value}, ${2:min}, ${3:max})', isSnippet: true, detail: 'Clamp value to range', type: '(value: number, min: number, max: number) => number' },
  { label: 'lerp', kind: 'function', insertText: 'lerp(${1:a}, ${2:b}, ${3:t})', isSnippet: true, detail: 'Linear interpolation', type: '(a: number, b: number, t: number) => number' },
  { label: 'random', kind: 'function', insertText: 'random()', detail: 'Random 0-1', type: '() => number' },
  // Audio
  { label: 'mtof', kind: 'function', insertText: 'mtof(${1:midi})', isSnippet: true, detail: 'MIDI to frequency', type: '(midi: number) => number' },
  { label: 'ftom', kind: 'function', insertText: 'ftom(${1:freq})', isSnippet: true, detail: 'Frequency to MIDI', type: '(freq: number) => number' },
  { label: 'dbtoa', kind: 'function', insertText: 'dbtoa(${1:db})', isSnippet: true, detail: 'dB to amplitude', type: '(db: number) => number' },
  { label: 'atodb', kind: 'function', insertText: 'atodb(${1:amp})', isSnippet: true, detail: 'Amplitude to dB', type: '(amp: number) => number' },
  // Constants
  { label: 'PI', kind: 'constant', detail: 'π ≈ 3.14159', type: 'number' },
  { label: 'TAU', kind: 'constant', detail: '2π ≈ 6.28318', type: 'number' },
  { label: 'E', kind: 'constant', detail: 'e ≈ 2.71828', type: 'number' },
];

/**
 * Common snippet templates.
 */
const SNIPPET_COMPLETIONS: CompletionItem[] = [
  {
    label: 'arrow function',
    kind: 'snippet',
    insertText: '(${1:params}) => ${2:expression}',
    isSnippet: true,
    detail: 'Arrow function expression',
  },
  {
    label: 'arrow function block',
    kind: 'snippet',
    insertText: '(${1:params}) => {\n\t${0}\n}',
    isSnippet: true,
    detail: 'Arrow function with block body',
  },
  {
    label: 'log',
    kind: 'snippet',
    insertText: 'console.log(${1:value});',
    isSnippet: true,
    detail: 'Console log',
  },
  {
    label: 'iife',
    kind: 'snippet',
    insertText: '(() => {\n\t${0}\n})();',
    isSnippet: true,
    detail: 'Immediately invoked function',
  },
  {
    label: 'ternary',
    kind: 'snippet',
    insertText: '${1:condition} ? ${2:then} : ${3:else}',
    isSnippet: true,
    detail: 'Ternary operator',
  },
  {
    label: 'card generator',
    kind: 'snippet',
    insertText: 'card ${1:Name} {\n\tcategory: "generator",\n\tinputs: [],\n\toutputs: [{ name: "out", type: "audio" }],\n\tparams: [\n\t\t{ name: "freq", type: "number", default: 440, min: 20, max: 20000 }\n\t],\n\tprocess: (_, ctx, state, p) => {\n\t\t${0}\n\t}\n}',
    isSnippet: true,
    detail: 'Generator card template',
  },
  {
    label: 'card effect',
    kind: 'snippet',
    insertText: 'card ${1:Name} {\n\tcategory: "effect",\n\tinputs: [{ name: "in", type: "audio" }],\n\toutputs: [{ name: "out", type: "audio" }],\n\tparams: [\n\t\t{ name: "mix", type: "number", default: 1, min: 0, max: 1 }\n\t],\n\tprocess: (input, ctx, state, p) => {\n\t\t${0}\n\t}\n}',
    isSnippet: true,
    detail: 'Effect card template',
  },
];

// ============================================================================
// COMPLETION ENGINE
// ============================================================================

/**
 * CardScript autocomplete engine.
 */
export class AutocompleteEngine {
  private readonly customCompletions: CompletionItem[] = [];
  private readonly moduleCompletions: Map<string, CompletionItem[]> = new Map();
  
  /**
   * Adds custom completion items.
   */
  addCompletions(items: CompletionItem[]): void {
    this.customCompletions.push(...items);
  }
  
  /**
   * Adds module completions for import suggestions.
   */
  addModuleCompletions(moduleName: string, items: CompletionItem[]): void {
    this.moduleCompletions.set(moduleName, items);
  }
  
  /**
   * Gets completions at a position in source code.
   */
  getCompletions(source: string, position: SourcePosition): CompletionResult {
    const context = this.analyzeContext(source, position);
    const items: CompletionItem[] = [];
    
    // Skip if in string or comment
    if (context.inString || context.inComment) {
      return { items: [], isComplete: true };
    }
    
    // Handle different contexts
    if (context.afterDot) {
      items.push(...this.getDotCompletions(context));
    } else if (context.inTypePosition) {
      items.push(...this.getTypeCompletions(context));
    } else {
      items.push(...this.getGeneralCompletions(source, context));
    }
    
    // Filter by current word
    const filtered = this.filterByWord(items, context.currentWord);
    
    // Sort by priority and relevance
    const sorted = this.sortCompletions(filtered, context);
    
    return {
      items: sorted,
      isComplete: sorted.length < 100,
    };
  }
  
  /**
   * Analyzes the completion context at a position.
   */
  private analyzeContext(source: string, position: SourcePosition): CompletionContext {
    const lines = source.split('\n');
    const lineIndex = position.line - 1;
    const line = lines[lineIndex] || '';
    const column = position.column - 1;
    
    const textBefore = line.substring(0, column);
    const textAfter = line.substring(column);
    
    // Extract current word being typed
    const wordMatch = textBefore.match(/[\w$]+$/);
    const currentWord = wordMatch ? wordMatch[0] : '';
    
    // Check if in string
    const inString = this.isInString(textBefore);
    
    // Check if in comment
    const inComment = this.isInComment(source, position);
    
    // Check if after dot
    const afterDot = /\.\s*$/.test(textBefore.slice(0, -currentWord.length));
    
    // Check if in type position
    const inTypePosition = /:\s*$/.test(textBefore.slice(0, -currentWord.length)) ||
                           /<\s*$/.test(textBefore.slice(0, -currentWord.length)) ||
                           /extends\s+$/.test(textBefore.slice(0, -currentWord.length)) ||
                           /implements\s+$/.test(textBefore.slice(0, -currentWord.length));
    
    // Check if at top level
    const isTopLevel = this.isAtTopLevel(source, position);
    
    return {
      position,
      textBefore,
      textAfter,
      currentWord,
      inString,
      inComment,
      isTopLevel,
      inTypePosition,
      afterDot,
    };
  }
  
  /**
   * Checks if position is inside a string.
   */
  private isInString(textBefore: string): boolean {
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    
    for (let i = 0; i < textBefore.length; i++) {
      const char = textBefore[i];
      const prev = textBefore[i - 1];
      
      if (prev === '\\') continue;
      
      if (char === "'" && !inDouble && !inTemplate) inSingle = !inSingle;
      if (char === '"' && !inSingle && !inTemplate) inDouble = !inDouble;
      if (char === '`' && !inSingle && !inDouble) inTemplate = !inTemplate;
    }
    
    return inSingle || inDouble || inTemplate;
  }
  
  /**
   * Checks if position is inside a comment.
   */
  private isInComment(source: string, position: SourcePosition): boolean {
    const lines = source.split('\n');
    const lineIndex = position.line - 1;
    const line = lines[lineIndex] || '';
    const column = position.column - 1;
    
    // Check for line comment
    const lineCommentIndex = line.indexOf('//');
    if (lineCommentIndex >= 0 && lineCommentIndex < column) {
      return true;
    }
    
    // Check for block comment (simplified)
    const beforePosition = source.substring(0, lines.slice(0, lineIndex).join('\n').length + column);
    const lastBlockStart = beforePosition.lastIndexOf('/*');
    const lastBlockEnd = beforePosition.lastIndexOf('*/');
    
    return lastBlockStart > lastBlockEnd;
  }
  
  /**
   * Checks if at top level (not inside function/card).
   */
  private isAtTopLevel(source: string, position: SourcePosition): boolean {
    const lines = source.split('\n');
    const currentLine = lines[position.line - 1] ?? '';
    const beforePosition = lines.slice(0, position.line - 1).join('\n') + 
                           currentLine.substring(0, position.column - 1);
    
    let braceCount = 0;
    for (const char of beforePosition) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    return braceCount === 0;
  }
  
  /**
   * Gets completions for property/method access.
   */
  private getDotCompletions(_context: CompletionContext): CompletionItem[] {
    // This would need type information from the expression before the dot
    // For now, return common methods
    return [
      { label: 'length', kind: 'property', detail: 'Array/string length', type: 'number' },
      { label: 'map', kind: 'method', insertText: 'map((${1:item}) => ${2:expression})', isSnippet: true, detail: 'Transform elements', type: '<U>(fn: (item: T) => U) => U[]' },
      { label: 'filter', kind: 'method', insertText: 'filter((${1:item}) => ${2:condition})', isSnippet: true, detail: 'Filter elements', type: '(fn: (item: T) => boolean) => T[]' },
      { label: 'reduce', kind: 'method', insertText: 'reduce((${1:acc}, ${2:item}) => ${3:expression}, ${4:initial})', isSnippet: true, detail: 'Reduce to single value', type: '<U>(fn: (acc: U, item: T) => U, initial: U) => U' },
      { label: 'forEach', kind: 'method', insertText: 'forEach((${1:item}) => {\n\t${0}\n})', isSnippet: true, detail: 'Iterate elements', type: '(fn: (item: T) => void) => void' },
      { label: 'find', kind: 'method', insertText: 'find((${1:item}) => ${2:condition})', isSnippet: true, detail: 'Find first matching', type: '(fn: (item: T) => boolean) => T | undefined' },
      { label: 'some', kind: 'method', insertText: 'some((${1:item}) => ${2:condition})', isSnippet: true, detail: 'Test if any match', type: '(fn: (item: T) => boolean) => boolean' },
      { label: 'every', kind: 'method', insertText: 'every((${1:item}) => ${2:condition})', isSnippet: true, detail: 'Test if all match', type: '(fn: (item: T) => boolean) => boolean' },
      { label: 'push', kind: 'method', insertText: 'push(${1:item})', isSnippet: true, detail: 'Add to end', type: '(item: T) => number' },
      { label: 'pop', kind: 'method', detail: 'Remove from end', type: '() => T | undefined' },
      { label: 'slice', kind: 'method', insertText: 'slice(${1:start}, ${2:end})', isSnippet: true, detail: 'Extract portion', type: '(start?: number, end?: number) => T[]' },
      { label: 'concat', kind: 'method', insertText: 'concat(${1:other})', isSnippet: true, detail: 'Combine arrays', type: '(other: T[]) => T[]' },
      { label: 'includes', kind: 'method', insertText: 'includes(${1:item})', isSnippet: true, detail: 'Check if contains', type: '(item: T) => boolean' },
      { label: 'indexOf', kind: 'method', insertText: 'indexOf(${1:item})', isSnippet: true, detail: 'Find index', type: '(item: T) => number' },
      { label: 'join', kind: 'method', insertText: 'join(${1:separator})', isSnippet: true, detail: 'Join to string', type: '(separator?: string) => string' },
      { label: 'split', kind: 'method', insertText: 'split(${1:separator})', isSnippet: true, detail: 'Split string', type: '(separator: string | RegExp) => string[]' },
      { label: 'trim', kind: 'method', detail: 'Remove whitespace', type: '() => string' },
      { label: 'toLowerCase', kind: 'method', detail: 'To lowercase', type: '() => string' },
      { label: 'toUpperCase', kind: 'method', detail: 'To uppercase', type: '() => string' },
      { label: 'toString', kind: 'method', detail: 'Convert to string', type: '() => string' },
    ];
  }
  
  /**
   * Gets type completions.
   */
  private getTypeCompletions(_context: CompletionContext): CompletionItem[] {
    return [...TYPE_COMPLETIONS, ...this.customCompletions.filter(c => c.kind === 'type')];
  }
  
  /**
   * Gets general completions (keywords, variables, functions).
   */
  private getGeneralCompletions(source: string, context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    
    // Keywords
    items.push(...KEYWORD_COMPLETIONS);
    
    // Standard library
    items.push(...STDLIB_COMPLETIONS);
    
    // Snippets (if at statement start)
    if (context.textBefore.trim() === '' || context.textBefore.trim() === context.currentWord) {
      items.push(...SNIPPET_COMPLETIONS);
    }
    
    // Variables and functions from source (basic extraction)
    items.push(...this.extractDeclarations(source));
    
    // Custom completions
    items.push(...this.customCompletions);
    
    return items;
  }
  
  /**
   * Extracts declarations from source for completion.
   */
  private extractDeclarations(source: string): CompletionItem[] {
    const items: CompletionItem[] = [];
    
    // Extract let/const declarations
    const varRegex = /\b(let|const)\s+(\w+)\s*(?::\s*(\w+))?\s*=/g;
    let match;
    while ((match = varRegex.exec(source)) !== null) {
      const label = match[2];
      if (label === undefined) continue;
      const typeStr = match[3];
      if (typeStr !== undefined) {
        items.push({
          label,
          kind: match[1] === 'const' ? 'constant' : 'variable',
          type: typeStr,
        });
      } else {
        items.push({
          label,
          kind: match[1] === 'const' ? 'constant' : 'variable',
        });
      }
    }
    
    // Extract function declarations
    const funcRegex = /\bfunction\s+(\w+)\s*\(/g;
    while ((match = funcRegex.exec(source)) !== null) {
      const label = match[1];
      if (label === undefined) continue;
      items.push({
        label,
        kind: 'function',
        insertText: label + '($0)',
        isSnippet: true,
      });
    }
    
    // Extract card declarations
    const cardRegex = /\bcard\s+(\w+)\s*\{/g;
    while ((match = cardRegex.exec(source)) !== null) {
      const label = match[1];
      if (label === undefined) continue;
      items.push({
        label,
        kind: 'card',
      });
    }
    
    // Extract type declarations
    const typeRegex = /\b(?:type|interface)\s+(\w+)/g;
    while ((match = typeRegex.exec(source)) !== null) {
      const label = match[1];
      if (label === undefined) continue;
      items.push({
        label,
        kind: 'type',
      });
    }
    
    return items;
  }
  
  /**
   * Filters completions by current word.
   */
  private filterByWord(items: CompletionItem[], word: string): CompletionItem[] {
    if (!word) return items;
    
    const lowerWord = word.toLowerCase();
    return items.filter(item => {
      const text = (item.filterText ?? item.label).toLowerCase();
      return text.startsWith(lowerWord) || 
             this.fuzzyMatch(text, lowerWord);
    });
  }
  
  /**
   * Fuzzy matching for completion filtering.
   */
  private fuzzyMatch(text: string, pattern: string): boolean {
    let patternIndex = 0;
    for (const char of text) {
      if (char === pattern[patternIndex]) {
        patternIndex++;
        if (patternIndex === pattern.length) return true;
      }
    }
    return false;
  }
  
  /**
   * Sorts completions by relevance.
   */
  private sortCompletions(items: CompletionItem[], context: CompletionContext): CompletionItem[] {
    return items.sort((a, b) => {
      // Priority first
      const priorityDiff = (a.sortPriority ?? 50) - (b.sortPriority ?? 50);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Exact prefix match
      const aExact = a.label.toLowerCase().startsWith(context.currentWord.toLowerCase());
      const bExact = b.label.toLowerCase().startsWith(context.currentWord.toLowerCase());
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Kind priority: variable > function > keyword > snippet
      const kindPriority: Record<CompletionKind, number> = {
        variable: 1,
        constant: 2,
        function: 3,
        method: 4,
        property: 5,
        card: 6,
        type: 7,
        keyword: 8,
        snippet: 9,
        param: 10,
        module: 11,
        class: 12,
        interface: 13,
        enum: 14,
        enumMember: 15,
      };
      const kindDiff = (kindPriority[a.kind] ?? 99) - (kindPriority[b.kind] ?? 99);
      if (kindDiff !== 0) return kindDiff;
      
      // Alphabetical
      return a.label.localeCompare(b.label);
    });
  }
}

// ============================================================================
// SIGNATURE HELP
// ============================================================================

/**
 * Parameter information.
 */
export interface ParameterInfo {
  label: string;
  documentation?: string;
}

/**
 * Signature information.
 */
export interface SignatureInfo {
  label: string;
  documentation?: string;
  parameters: ParameterInfo[];
}

/**
 * Signature help result.
 */
export interface SignatureHelp {
  signatures: SignatureInfo[];
  activeSignature: number;
  activeParameter: number;
}

/**
 * Gets signature help for function calls.
 */
export function getSignatureHelp(
  source: string, 
  position: SourcePosition,
  signatures: Map<string, SignatureInfo[]>
): SignatureHelp | null {
  const lines = source.split('\n');
  const line = lines[position.line - 1] || '';
  const textBefore = line.substring(0, position.column - 1);
  
  // Find function call context
  let parenDepth = 0;
  let funcEnd = -1;
  let paramCount = 0;
  
  for (let i = textBefore.length - 1; i >= 0; i--) {
    const char = textBefore[i];
    if (char === ')') parenDepth++;
    if (char === '(') {
      if (parenDepth === 0) {
        funcEnd = i;
        break;
      }
      parenDepth--;
    }
    if (char === ',' && parenDepth === 0) {
      paramCount++;
    }
  }
  
  if (funcEnd === -1) return null;
  
  // Extract function name
  const beforeParen = textBefore.substring(0, funcEnd);
  const funcMatch = beforeParen.match(/(\w+)\s*$/);
  if (!funcMatch) return null;
  
  const funcName = funcMatch[1];
  if (funcName === undefined) return null;
  const funcSignatures = signatures.get(funcName);
  if (!funcSignatures || funcSignatures.length === 0) return null;
  
  return {
    signatures: funcSignatures,
    activeSignature: 0,
    activeParameter: paramCount,
  };
}

// ============================================================================
// BUILT-IN SIGNATURES
// ============================================================================

/**
 * Built-in function signatures for signature help.
 */
export const BUILTIN_SIGNATURES: Map<string, SignatureInfo[]> = new Map([
  ['clamp', [{
    label: 'clamp(value: number, min: number, max: number): number',
    documentation: 'Clamps a value between min and max.',
    parameters: [
      { label: 'value', documentation: 'The value to clamp' },
      { label: 'min', documentation: 'Minimum value' },
      { label: 'max', documentation: 'Maximum value' },
    ],
  }]],
  ['lerp', [{
    label: 'lerp(a: number, b: number, t: number): number',
    documentation: 'Linear interpolation between a and b.',
    parameters: [
      { label: 'a', documentation: 'Start value' },
      { label: 'b', documentation: 'End value' },
      { label: 't', documentation: 'Interpolation factor (0-1)' },
    ],
  }]],
  ['mtof', [{
    label: 'mtof(midi: number): number',
    documentation: 'Converts MIDI note number to frequency in Hz.',
    parameters: [
      { label: 'midi', documentation: 'MIDI note number (0-127)' },
    ],
  }]],
  ['ftom', [{
    label: 'ftom(freq: number): number',
    documentation: 'Converts frequency in Hz to MIDI note number.',
    parameters: [
      { label: 'freq', documentation: 'Frequency in Hz' },
    ],
  }]],
  ['dbtoa', [{
    label: 'dbtoa(db: number): number',
    documentation: 'Converts decibels to linear amplitude.',
    parameters: [
      { label: 'db', documentation: 'Decibel value' },
    ],
  }]],
  ['atodb', [{
    label: 'atodb(amp: number): number',
    documentation: 'Converts linear amplitude to decibels.',
    parameters: [
      { label: 'amp', documentation: 'Linear amplitude (0-1)' },
    ],
  }]],
]);

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates an autocomplete engine with default completions.
 */
export function createAutocompleteEngine(): AutocompleteEngine {
  const engine = new AutocompleteEngine();
  
  // Add module completions
  engine.addModuleCompletions('@cardplay/math', STDLIB_COMPLETIONS.filter(c => 
    ['abs', 'sin', 'cos', 'tan', 'floor', 'ceil', 'round', 'sqrt', 'pow', 'min', 'max', 'clamp', 'lerp', 'random', 'PI', 'TAU', 'E'].includes(c.label)
  ));
  
  engine.addModuleCompletions('@cardplay/audio', STDLIB_COMPLETIONS.filter(c => 
    ['mtof', 'ftom', 'dbtoa', 'atodb'].includes(c.label)
  ));
  
  return engine;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  KEYWORD_COMPLETIONS,
  TYPE_COMPLETIONS,
  STDLIB_COMPLETIONS,
  SNIPPET_COMPLETIONS,
};
