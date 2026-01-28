/**
 * @fileoverview CardScript Syntax Highlighting.
 * 
 * Provides syntax highlighting for CardScript with support for:
 * - Multiple output formats (HTML, ANSI, Monaco, CodeMirror)
 * - Customizable themes
 * - Semantic tokens
 * - Bracket matching
 * 
 * @module @cardplay/user-cards/cardscript/highlight
 */

import { tokenize } from './lexer';
import type { Token, SourceSpan, TokenType } from './grammar';
import { TokenType as TT } from './grammar';

// ============================================================================
// HIGHLIGHT TYPES
// ============================================================================

/**
 * Token classification for highlighting.
 */
export type TokenClass =
  | 'keyword'
  | 'keyword.control'
  | 'keyword.declaration'
  | 'keyword.modifier'
  | 'identifier'
  | 'identifier.function'
  | 'identifier.type'
  | 'identifier.card'
  | 'identifier.parameter'
  | 'identifier.property'
  | 'operator'
  | 'operator.arithmetic'
  | 'operator.comparison'
  | 'operator.logical'
  | 'operator.assignment'
  | 'punctuation'
  | 'punctuation.bracket'
  | 'punctuation.delimiter'
  | 'literal'
  | 'literal.number'
  | 'literal.string'
  | 'literal.boolean'
  | 'literal.null'
  | 'comment'
  | 'comment.line'
  | 'comment.block'
  | 'comment.doc'
  | 'string'
  | 'string.escape'
  | 'string.interpolation'
  | 'type'
  | 'type.primitive'
  | 'type.builtin'
  | 'type.parameter'
  | 'invalid'
  | 'whitespace'
  ;

/**
 * A highlighted token.
 */
export interface HighlightToken {
  /** Token text */
  text: string;
  /** Token class for styling */
  class: TokenClass;
  /** Source span */
  span: SourceSpan;
  /** Additional modifiers */
  modifiers?: string[];
}

/**
 * Color theme for syntax highlighting.
 */
export interface HighlightTheme {
  name: string;
  colors: Partial<Record<TokenClass, string>> & {
    background?: string;
    foreground?: string;
  };
  styles?: Partial<Record<TokenClass, {
    fontStyle?: 'normal' | 'italic' | 'bold' | 'bold italic';
    textDecoration?: string;
  }>>;
}

/**
 * Highlighted line.
 */
export interface HighlightLine {
  lineNumber: number;
  tokens: HighlightToken[];
  html?: string;
}

/**
 * Highlight result.
 */
export interface HighlightResult {
  lines: HighlightLine[];
  html?: string;
  ansi?: string;
}

// ============================================================================
// BUILT-IN THEMES
// ============================================================================

/**
 * Default dark theme (VSCode Dark+).
 */
export const DARK_THEME: HighlightTheme = {
  name: 'dark',
  colors: {
    'background': '#1e1e1e',
    'foreground': '#d4d4d4',
    'keyword': '#569cd6',
    'keyword.control': '#c586c0',
    'keyword.declaration': '#569cd6',
    'keyword.modifier': '#569cd6',
    'identifier': '#9cdcfe',
    'identifier.function': '#dcdcaa',
    'identifier.type': '#4ec9b0',
    'identifier.card': '#4ec9b0',
    'identifier.parameter': '#9cdcfe',
    'identifier.property': '#9cdcfe',
    'operator': '#d4d4d4',
    'operator.arithmetic': '#d4d4d4',
    'operator.comparison': '#d4d4d4',
    'operator.logical': '#569cd6',
    'operator.assignment': '#d4d4d4',
    'punctuation': '#d4d4d4',
    'punctuation.bracket': '#ffd700',
    'punctuation.delimiter': '#d4d4d4',
    'literal': '#b5cea8',
    'literal.number': '#b5cea8',
    'literal.string': '#ce9178',
    'literal.boolean': '#569cd6',
    'literal.null': '#569cd6',
    'comment': '#6a9955',
    'comment.line': '#6a9955',
    'comment.block': '#6a9955',
    'comment.doc': '#608b4e',
    'string': '#ce9178',
    'string.escape': '#d7ba7d',
    'string.interpolation': '#569cd6',
    'type': '#4ec9b0',
    'type.primitive': '#4ec9b0',
    'type.builtin': '#4ec9b0',
    'type.parameter': '#4ec9b0',
    'invalid': '#f44747',
    'whitespace': 'transparent',
  },
  styles: {
    'keyword.control': { fontStyle: 'italic' },
    'comment': { fontStyle: 'italic' },
    'comment.doc': { fontStyle: 'italic' },
  },
};

/**
 * Default light theme (VSCode Light+).
 */
export const LIGHT_THEME: HighlightTheme = {
  name: 'light',
  colors: {
    'background': '#ffffff',
    'foreground': '#000000',
    'keyword': '#0000ff',
    'keyword.control': '#af00db',
    'keyword.declaration': '#0000ff',
    'keyword.modifier': '#0000ff',
    'identifier': '#001080',
    'identifier.function': '#795e26',
    'identifier.type': '#267f99',
    'identifier.card': '#267f99',
    'identifier.parameter': '#001080',
    'identifier.property': '#001080',
    'operator': '#000000',
    'operator.arithmetic': '#000000',
    'operator.comparison': '#000000',
    'operator.logical': '#0000ff',
    'operator.assignment': '#000000',
    'punctuation': '#000000',
    'punctuation.bracket': '#0431fa',
    'punctuation.delimiter': '#000000',
    'literal': '#098658',
    'literal.number': '#098658',
    'literal.string': '#a31515',
    'literal.boolean': '#0000ff',
    'literal.null': '#0000ff',
    'comment': '#008000',
    'comment.line': '#008000',
    'comment.block': '#008000',
    'comment.doc': '#008000',
    'string': '#a31515',
    'string.escape': '#ee0000',
    'string.interpolation': '#0000ff',
    'type': '#267f99',
    'type.primitive': '#267f99',
    'type.builtin': '#267f99',
    'type.parameter': '#267f99',
    'invalid': '#cd3131',
    'whitespace': 'transparent',
  },
  styles: {
    'keyword.control': { fontStyle: 'italic' },
    'comment': { fontStyle: 'italic' },
    'comment.doc': { fontStyle: 'italic' },
  },
};

/**
 * Monokai theme.
 */
export const MONOKAI_THEME: HighlightTheme = {
  name: 'monokai',
  colors: {
    'background': '#272822',
    'foreground': '#f8f8f2',
    'keyword': '#f92672',
    'keyword.control': '#f92672',
    'keyword.declaration': '#66d9ef',
    'keyword.modifier': '#f92672',
    'identifier': '#f8f8f2',
    'identifier.function': '#a6e22e',
    'identifier.type': '#66d9ef',
    'identifier.card': '#66d9ef',
    'identifier.parameter': '#fd971f',
    'identifier.property': '#f8f8f2',
    'operator': '#f92672',
    'punctuation': '#f8f8f2',
    'punctuation.bracket': '#f8f8f2',
    'literal': '#ae81ff',
    'literal.number': '#ae81ff',
    'literal.string': '#e6db74',
    'literal.boolean': '#ae81ff',
    'literal.null': '#ae81ff',
    'comment': '#75715e',
    'string': '#e6db74',
    'string.escape': '#ae81ff',
    'type': '#66d9ef',
    'invalid': '#f92672',
    'whitespace': 'transparent',
  },
  styles: {
    'identifier.type': { fontStyle: 'italic' },
    'keyword.declaration': { fontStyle: 'italic' },
    'comment': { fontStyle: 'italic' },
  },
};

// ============================================================================
// TOKEN CLASSIFICATION
// ============================================================================

/** Control flow token types */
const CONTROL_TOKENS = new Set<TokenType>([
  TT.IF, TT.ELSE, TT.FOR, TT.WHILE, TT.RETURN, TT.BREAK, TT.CONTINUE, TT.AWAIT, TT.YIELD,
]);

/** Declaration token types */
const DECLARATION_TOKENS = new Set<TokenType>([
  TT.LET, TT.CONST, TT.CARD, TT.FN, TT.TYPE, TT.IMPORT, TT.EXPORT, TT.FROM, TT.AS,
]);

/** Type token types */
const TYPE_TOKENS = new Set<TokenType>([
  TT.NUMBER_TYPE, TT.STRING_TYPE, TT.BOOLEAN_TYPE, TT.VOID_TYPE,
  TT.AUDIO_TYPE, TT.MIDI_TYPE, TT.EVENT_TYPE, TT.STREAM_TYPE,
]);

/** Operator token types */
const OPERATOR_TOKENS = new Set<TokenType>([
  TT.PLUS, TT.MINUS, TT.STAR, TT.SLASH, TT.PERCENT, TT.CARET,
  TT.EQUAL, TT.EQUAL_EQUAL, TT.BANG_EQUAL, TT.LESS, TT.LESS_EQUAL,
  TT.GREATER, TT.GREATER_EQUAL, TT.AND, TT.OR, TT.BANG,
  TT.PLUS_EQUAL, TT.MINUS_EQUAL, TT.STAR_EQUAL, TT.SLASH_EQUAL,
]);

/** Bracket token types */
const BRACKET_TOKENS = new Set<TokenType>([
  TT.LEFT_PAREN, TT.RIGHT_PAREN, TT.LEFT_BRACE, TT.RIGHT_BRACE,
  TT.LEFT_BRACKET, TT.RIGHT_BRACKET,
]);

/** Delimiter token types */
const DELIMITER_TOKENS = new Set<TokenType>([
  TT.COMMA, TT.DOT, TT.COLON, TT.SEMICOLON, TT.ARROW, TT.FAT_ARROW, TT.QUESTION,
]);

/**
 * Classifies a token for highlighting.
 */
export function classifyToken(token: Token, context: ClassificationContext): TokenClass {
  const type = token.type;
  const value = String(token.value);
  
  // Control flow keywords
  if (CONTROL_TOKENS.has(type)) {
    return 'keyword.control';
  }
  
  // Declaration keywords
  if (DECLARATION_TOKENS.has(type)) {
    return 'keyword.declaration';
  }
  
  // Type keywords
  if (TYPE_TOKENS.has(type)) {
    return 'type.primitive';
  }
  
  // Literals
  if (type === TT.NUMBER) {
    return 'literal.number';
  }
  if (type === TT.STRING) {
    return 'literal.string';
  }
  if (type === TT.TRUE || type === TT.FALSE) {
    return 'literal.boolean';
  }
  if (type === TT.NULL) {
    return 'literal.null';
  }
  
  // Identifiers
  if (type === TT.IDENTIFIER) {
    // Check context for classification
    const isNextParenOpen = context.nextToken?.type === TT.LEFT_PAREN;
    if (context.afterKeyword === 'fn' || context.afterKeyword === 'function' || isNextParenOpen) {
      return 'identifier.function';
    }
    if (context.afterKeyword === 'card' || context.afterKeyword === 'type') {
      return 'identifier.type';
    }
    if (context.afterDot) {
      // Already checked isNextParenOpen above, so here it's always false
      return 'identifier.property';
    }
    if (context.inTypePosition) {
      return 'type';
    }
    if (context.afterColon && context.inParamList) {
      return 'type';
    }
    if (context.inParamList && !context.afterColon) {
      return 'identifier.parameter';
    }
    return 'identifier';
  }
  
  // Operators
  if (OPERATOR_TOKENS.has(type)) {
    if (type === TT.PLUS || type === TT.MINUS || type === TT.STAR || type === TT.SLASH || type === TT.PERCENT) {
      return 'operator.arithmetic';
    }
    if (type === TT.EQUAL_EQUAL || type === TT.BANG_EQUAL || type === TT.LESS || type === TT.LESS_EQUAL || type === TT.GREATER || type === TT.GREATER_EQUAL) {
      return 'operator.comparison';
    }
    if (type === TT.AND || type === TT.OR || type === TT.BANG) {
      return 'operator.logical';
    }
    if (type === TT.EQUAL || type === TT.PLUS_EQUAL || type === TT.MINUS_EQUAL || type === TT.STAR_EQUAL || type === TT.SLASH_EQUAL) {
      return 'operator.assignment';
    }
    return 'operator';
  }
  
  // Brackets
  if (BRACKET_TOKENS.has(type)) {
    return 'punctuation.bracket';
  }
  
  // Delimiters
  if (DELIMITER_TOKENS.has(type)) {
    return 'punctuation.delimiter';
  }
  
  // Comments
  if (type === TT.COMMENT) {
    if (value.startsWith('/**')) return 'comment.doc';
    if (value.startsWith('/*')) return 'comment.block';
    return 'comment.line';
  }
  
  // Whitespace
  if (type === TT.NEWLINE) {
    return 'whitespace';
  }
  
  // Error
  if (type === TT.ERROR) {
    return 'invalid';
  }
  
  // Default - other keywords
  return 'keyword';
}

/**
 * Context for token classification.
 */
interface ClassificationContext {
  /** Previous non-whitespace token */
  prevToken?: Token;
  /** Next non-whitespace token */
  nextToken?: Token;
  /** Keyword before this token */
  afterKeyword?: string;
  /** Is after a dot */
  afterDot: boolean;
  /** Is in type position (after :, <, extends) */
  inTypePosition: boolean;
  /** Is in parameter list */
  inParamList: boolean;
  /** Is after colon (type annotation) */
  afterColon: boolean;
  /** Bracket depth */
  bracketDepth: number;
  /** Paren depth */
  parenDepth: number;
  /** Brace depth */
  braceDepth: number;
}

// ============================================================================
// HIGHLIGHTER
// ============================================================================

/**
 * CardScript syntax highlighter.
 */
export class SyntaxHighlighter {
  private theme: HighlightTheme;
  
  constructor(theme: HighlightTheme = DARK_THEME) {
    this.theme = theme;
  }
  
  /**
   * Sets the color theme.
   */
  setTheme(theme: HighlightTheme): void {
    this.theme = theme;
  }
  
  /**
   * Highlights source code.
   */
  highlight(source: string): HighlightResult {
    const result = tokenize(source);
    const highlightTokens = this.classifyTokens(result.tokens);
    const lines = this.groupByLine(highlightTokens, source);
    
    return {
      lines,
      html: this.toHTML(lines),
      ansi: this.toANSI(lines),
    };
  }
  
  /**
   * Classifies all tokens.
   */
  private classifyTokens(tokens: readonly Token[]): HighlightToken[] {
    const results: HighlightToken[] = [];
    const context: ClassificationContext = {
      afterDot: false,
      inTypePosition: false,
      inParamList: false,
      afterColon: false,
      bracketDepth: 0,
      parenDepth: 0,
      braceDepth: 0,
    };
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const prevToken = this.findPrevNonWhitespace(tokens, i);
      const nextToken = this.findNextNonWhitespace(tokens, i);
      
      // Update context
      if (prevToken) {
        context.prevToken = prevToken;
      } else {
        delete context.prevToken;
      }
      if (nextToken) {
        context.nextToken = nextToken;
      } else {
        delete context.nextToken;
      }
      context.afterDot = prevToken?.type === TT.DOT;
      
      // Track keyword context
      if (prevToken && DECLARATION_TOKENS.has(prevToken.type)) {
        context.afterKeyword = String(prevToken.value);
      } else if (token && token.type !== TT.NEWLINE && token.type !== TT.EOF) {
        delete context.afterKeyword;
      }
      
      // Track type position
      if (prevToken?.type === TT.COLON || prevToken?.type === TT.LESS) {
        context.inTypePosition = true;
      }
      if (token && (token.type === TT.GREATER || token.type === TT.EQUAL || 
          token.type === TT.RIGHT_PAREN || token.type === TT.COMMA || 
          token.type === TT.LEFT_BRACE)) {
        context.inTypePosition = false;
      }
      
      // Track param list
      if (token && token.type === TT.LEFT_PAREN) {
        context.parenDepth++;
        // Check if this is a function param list
        if (prevToken?.type === TT.IDENTIFIER || prevToken?.type === TT.FN) {
          context.inParamList = true;
        }
      }
      if (token && token.type === TT.RIGHT_PAREN) {
        context.parenDepth--;
        if (context.parenDepth === 0) {
          context.inParamList = false;
        }
      }
      
      // Track after colon
      context.afterColon = prevToken?.type === TT.COLON;
      
      // Classify
      if (token) {
        const tokenClass = classifyToken(token, context);
        
        results.push({
          text: String(token.value),
          class: tokenClass,
          span: token.span,
        });
      }
    }
    
    return results;
  }
  
  /**
   * Finds previous non-whitespace token.
   */
  private findPrevNonWhitespace(tokens: readonly Token[], index: number): Token | undefined {
    for (let i = index - 1; i >= 0; i--) {
      const t = tokens[i];
      if (t && t.type !== TT.NEWLINE && t.type !== TT.EOF) {
        return t;
      }
    }
    return undefined;
  }
  
  /**
   * Finds next non-whitespace token.
   */
  private findNextNonWhitespace(tokens: readonly Token[], index: number): Token | undefined {
    for (let i = index + 1; i < tokens.length; i++) {
      const t = tokens[i];
      if (t && t.type !== TT.NEWLINE && t.type !== TT.EOF) {
        return t;
      }
    }
    return undefined;
  }
  
  /**
   * Groups tokens by line.
   */
  private groupByLine(tokens: HighlightToken[], _source: string): HighlightLine[] {
    const lines: HighlightLine[] = [];
    let currentLine: HighlightToken[] = [];
    let lineNumber = 1;
    
    for (const token of tokens) {
      // Handle newlines in token
      const parts = token.text.split('\n');
      
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          // New line
          lines.push({
            lineNumber,
            tokens: currentLine,
            html: this.lineToHTML(currentLine),
          });
          lineNumber++;
          currentLine = [];
        }
        
        const part = parts[i];
        if (part && part.length > 0) {
          currentLine.push({
            ...token,
            text: part,
          });
        }
      }
    }
    
    // Final line
    if (currentLine.length > 0) {
      lines.push({
        lineNumber,
        tokens: currentLine,
        html: this.lineToHTML(currentLine),
      });
    }
    
    return lines;
  }
  
  /**
   * Converts a line to HTML.
   */
  private lineToHTML(tokens: HighlightToken[]): string {
    return tokens.map(token => {
      const color = this.theme.colors[token.class] || this.theme.colors.identifier;
      const style = this.theme.styles?.[token.class];
      
      let styleStr = `color: ${color};`;
      if (style?.fontStyle) {
        if (style.fontStyle.includes('italic')) styleStr += ' font-style: italic;';
        if (style.fontStyle.includes('bold')) styleStr += ' font-weight: bold;';
      }
      if (style?.textDecoration) {
        styleStr += ` text-decoration: ${style.textDecoration};`;
      }
      
      const escapedText = this.escapeHTML(token.text);
      return `<span class="cs-${token.class.replace(/\./g, '-')}" style="${styleStr}">${escapedText}</span>`;
    }).join('');
  }
  
  /**
   * Converts all lines to HTML.
   */
  private toHTML(lines: HighlightLine[]): string {
    const lineHTML = lines.map((line) => {
      const num = String(line.lineNumber).padStart(4);
      return `<div class="cs-line" data-line="${line.lineNumber}"><span class="cs-line-number">${num}</span><span class="cs-line-content">${line.html}</span></div>`;
    }).join('\n');
    
    return `<pre class="cs-highlight cs-theme-${this.theme.name}"><code>${lineHTML}</code></pre>`;
  }
  
  /**
   * Escapes HTML special characters.
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Converts to ANSI colored output.
   */
  private toANSI(lines: HighlightLine[]): string {
    return lines.map(line => {
      return line.tokens.map(token => {
        const ansiCode = this.getANSICode(token.class);
        return ansiCode ? `\x1b[${ansiCode}m${token.text}\x1b[0m` : token.text;
      }).join('');
    }).join('\n');
  }
  
  /**
   * Gets ANSI color code for token class.
   */
  private getANSICode(tokenClass: TokenClass): string {
    const codes: Partial<Record<TokenClass, string>> = {
      'keyword': '34',           // Blue
      'keyword.control': '35',   // Magenta
      'keyword.declaration': '34', // Blue
      'identifier.function': '33', // Yellow
      'identifier.type': '36',   // Cyan
      'literal.number': '32',    // Green
      'literal.string': '33',    // Yellow
      'literal.boolean': '34',   // Blue
      'comment': '90',           // Gray
      'comment.line': '90',
      'comment.block': '90',
      'operator': '35',          // Magenta
      'invalid': '31',           // Red
      'string': '33',            // Yellow
      'type': '36',              // Cyan
    };
    return codes[tokenClass] || '';
  }
  
  /**
   * Generates CSS for the theme.
   */
  generateCSS(): string {
    const rules: string[] = [
      `.cs-highlight { background: ${this.theme.name === 'dark' ? '#1e1e1e' : '#ffffff'}; padding: 1em; border-radius: 4px; overflow: auto; }`,
      `.cs-line { display: flex; }`,
      `.cs-line-number { user-select: none; opacity: 0.5; min-width: 3em; margin-right: 1em; text-align: right; }`,
      `.cs-line-content { flex: 1; white-space: pre; }`,
    ];
    
    for (const [tokenClass, color] of Object.entries(this.theme.colors)) {
      const className = `.cs-${tokenClass.replace(/\./g, '-')}`;
      const style = this.theme.styles?.[tokenClass as TokenClass];
      let css = `${className} { color: ${color};`;
      if (style?.fontStyle) {
        if (style.fontStyle.includes('italic')) css += ' font-style: italic;';
        if (style.fontStyle.includes('bold')) css += ' font-weight: bold;';
      }
      if (style?.textDecoration) {
        css += ` text-decoration: ${style.textDecoration};`;
      }
      css += ' }';
      rules.push(css);
    }
    
    return rules.join('\n');
  }
}

// ============================================================================
// BRACKET MATCHING
// ============================================================================

/**
 * Bracket pair.
 */
export interface BracketPair {
  open: { position: SourceSpan; char: string };
  close: { position: SourceSpan; char: string };
}

/**
 * Finds matching brackets in source code.
 */
export function findMatchingBrackets(source: string): BracketPair[] {
  const result = tokenize(source);
  const pairs: BracketPair[] = [];
  const stacks: { [key: string]: Array<{ position: SourceSpan; char: string }> } = {
    '(': [],
    '[': [],
    '{': [],
  };
  
  const tokenToChar: Partial<Record<TokenType, string>> = {
    [TT.LEFT_PAREN]: '(',
    [TT.RIGHT_PAREN]: ')',
    [TT.LEFT_BRACKET]: '[',
    [TT.RIGHT_BRACKET]: ']',
    [TT.LEFT_BRACE]: '{',
    [TT.RIGHT_BRACE]: '}',
  };
  
  const matchingOpen: { [key: string]: string } = {
    ')': '(',
    ']': '[',
    '}': '{',
  };
  
  for (const token of result.tokens) {
    const char = tokenToChar[token.type];
    if (char) {
      if (stacks[char]) {
        // Opening bracket
        stacks[char].push({ position: token.span, char });
      } else if (matchingOpen[char]) {
        // Closing bracket
        const openChar = matchingOpen[char];
        const stack = stacks[openChar];
        if (stack && stack.length > 0) {
          const open = stack.pop()!;
          pairs.push({
            open,
            close: { position: token.span, char },
          });
        }
      }
    }
  }
  
  return pairs;
}

/**
 * Finds the matching bracket for a position.
 */
export function findMatchingBracket(
  source: string, 
  position: SourceSpan
): SourceSpan | null {
  const pairs = findMatchingBrackets(source);
  
  for (const pair of pairs) {
    if (spansEqual(pair.open.position, position)) {
      return pair.close.position;
    }
    if (spansEqual(pair.close.position, position)) {
      return pair.open.position;
    }
  }
  
  return null;
}

/**
 * Checks if two spans are equal.
 */
function spansEqual(a: SourceSpan, b: SourceSpan): boolean {
  return a.start.line === b.start.line &&
         a.start.column === b.start.column &&
         a.end.line === b.end.line &&
         a.end.column === b.end.column;
}

// ============================================================================
// MONACO EDITOR INTEGRATION
// ============================================================================

/**
 * Monaco editor token definition.
 */
export interface MonacoToken {
  startIndex: number;
  scopes: string;
}

/**
 * Converts highlight tokens to Monaco format.
 */
export function toMonacoTokens(source: string): MonacoToken[][] {
  const highlighter = new SyntaxHighlighter();
  const result = highlighter.highlight(source);
  
  return result.lines.map(line => {
    let offset = 0;
    return line.tokens.map(token => {
      const monacoToken: MonacoToken = {
        startIndex: offset,
        scopes: tokenClassToMonacoScope(token.class),
      };
      offset += token.text.length;
      return monacoToken;
    });
  });
}

/**
 * Maps token class to Monaco scope.
 */
function tokenClassToMonacoScope(tokenClass: TokenClass): string {
  const mapping: Partial<Record<TokenClass, string>> = {
    'keyword': 'keyword',
    'keyword.control': 'keyword.control',
    'keyword.declaration': 'keyword',
    'identifier': 'identifier',
    'identifier.function': 'entity.name.function',
    'identifier.type': 'entity.name.type',
    'identifier.parameter': 'variable.parameter',
    'identifier.property': 'variable.property',
    'literal.number': 'constant.numeric',
    'literal.string': 'string',
    'literal.boolean': 'constant.language',
    'literal.null': 'constant.language',
    'comment': 'comment',
    'comment.line': 'comment.line',
    'comment.block': 'comment.block',
    'comment.doc': 'comment.documentation',
    'string': 'string',
    'operator': 'keyword.operator',
    'punctuation': 'punctuation',
    'type': 'entity.name.type',
    'invalid': 'invalid',
  };
  return mapping[tokenClass] || 'source';
}

// ============================================================================
// LANGUAGE DEFINITION FOR MONACO
// ============================================================================

/**
 * Monaco language definition for CardScript.
 */
export const CARDSCRIPT_LANGUAGE_DEFINITION = {
  id: 'cardscript',
  extensions: ['.cs', '.cardscript'],
  aliases: ['CardScript', 'cs'],
  mimeTypes: ['text/x-cardscript'],
  
  // Monarch tokenizer rules
  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      
      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      [/`/, 'string', '@string_backtick'],
      
      // Numbers
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/0[bB][01]+/, 'number.binary'],
      [/\d+/, 'number'],
      
      // Keywords
      [/\b(if|else|for|while|do|switch|case|default|break|continue|return|throw|try|catch|finally|await|yield)\b/, 'keyword.control'],
      [/\b(let|const|var|function|class|interface|type|enum|card|import|export|from|as|default)\b/, 'keyword'],
      [/\b(async|static|readonly|private|public|protected|abstract|extends|implements|new)\b/, 'keyword'],
      [/\b(true|false|null|undefined)\b/, 'constant.language'],
      
      // Types
      [/\b(number|string|boolean|void|any|unknown|never|object)\b/, 'type'],
      [/\b(Array|Promise|Map|Set|Event|Stream|Card|Audio|MIDI|Control)\b/, 'type'],
      
      // Identifiers
      [/[a-zA-Z_$][\w$]*(?=\s*\()/, 'entity.name.function'],
      [/[A-Z][\w$]*/, 'entity.name.type'],
      [/[a-zA-Z_$][\w$]*/, 'identifier'],
      
      // Operators
      [/[<>]=?|[!=]=?=?|[+\-*/%]=?|\?\?=?|&&|\|\||[&|^~]/, 'operator'],
      [/[{}()\[\]]/, '@brackets'],
      [/[;,.:?]/, 'delimiter'],
    ],
    
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],
    
    string_double: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],
    
    string_single: [
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],
    
    string_backtick: [
      [/\$\{/, 'delimiter.bracket', '@bracketCounting'],
      [/[^\\`$]+/, 'string'],
      [/\\./, 'string.escape'],
      [/`/, 'string', '@pop'],
    ],
    
    bracketCounting: [
      [/\{/, 'delimiter.bracket', '@bracketCounting'],
      [/\}/, 'delimiter.bracket', '@pop'],
      { include: 'root' },
    ],
  },
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a highlighter with the specified theme.
 */
export function createHighlighter(theme: 'dark' | 'light' | 'monokai' | HighlightTheme = 'dark'): SyntaxHighlighter {
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
  return new SyntaxHighlighter(themeObj);
}

/**
 * Highlights source code with default theme.
 */
export function highlight(source: string, theme?: 'dark' | 'light' | 'monokai'): string {
  const highlighter = createHighlighter(theme);
  return highlighter.highlight(source).html || '';
}
