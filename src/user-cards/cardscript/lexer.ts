/**
 * @fileoverview CardScript Lexer (Tokenizer).
 * 
 * Converts CardScript source code into a stream of tokens.
 * Handles all lexical analysis including string escapes, numbers, comments.
 * 
 * @module @cardplay/user-cards/cardscript/lexer
 */

import {
  Token,
  TokenType,
  KEYWORDS,
  SourcePosition,
  SourceSpan,
  createToken,
  createPosition,
  createSpan,
} from './grammar';

// ============================================================================
// LEXER ERROR
// ============================================================================

/**
 * Error during lexical analysis.
 */
export class LexerError extends Error {
  constructor(
    message: string,
    public readonly position: SourcePosition,
    public readonly file?: string
  ) {
    super(`[${position.line}:${position.column}] ${message}`);
    this.name = 'LexerError';
  }
}

// ============================================================================
// LEXER
// ============================================================================

/**
 * CardScript lexer options.
 */
export interface LexerOptions {
  /** Source file name for error reporting */
  file?: string;
  /** Whether to include whitespace/newline tokens */
  includeWhitespace?: boolean;
  /** Whether to include comment tokens */
  includeComments?: boolean;
}

/**
 * CardScript lexer state.
 */
interface LexerState {
  /** Source code */
  source: string;
  /** Current position */
  current: number;
  /** Start of current token */
  start: number;
  /** Current line */
  line: number;
  /** Current column */
  column: number;
  /** Start column of current token */
  startColumn: number;
  /** Tokens produced */
  tokens: Token[];
  /** Errors encountered */
  errors: LexerError[];
  /** Options */
  options: LexerOptions;
}

/**
 * Creates initial lexer state.
 */
function createLexerState(source: string, options: LexerOptions = {}): LexerState {
  return {
    source,
    current: 0,
    start: 0,
    line: 1,
    column: 1,
    startColumn: 1,
    tokens: [],
    errors: [],
    options,
  };
}

/**
 * Checks if at end of source.
 */
function isAtEnd(state: LexerState): boolean {
  return state.current >= state.source.length;
}

/**
 * Gets current character without advancing.
 */
function peek(state: LexerState): string {
  if (isAtEnd(state)) return '\0';
  return state.source[state.current]!;
}

/**
 * Gets next character without advancing.
 */
function peekNext(state: LexerState): string {
  if (state.current + 1 >= state.source.length) return '\0';
  return state.source[state.current + 1]!;
}

/**
 * Advances and returns current character.
 */
function advance(state: LexerState): string {
  const char = state.source[state.current]!;
  state.current++;
  if (char === '\n') {
    state.line++;
    state.column = 1;
  } else {
    state.column++;
  }
  return char;
}

/**
 * Conditionally advances if next char matches.
 */
function match(state: LexerState, expected: string): boolean {
  if (isAtEnd(state)) return false;
  if (state.source[state.current] !== expected) return false;
  advance(state);
  return true;
}

/**
 * Creates a span from start to current position.
 */
function makeSpan(state: LexerState): SourceSpan {
  return createSpan(
    createPosition(state.line, state.startColumn, state.start),
    createPosition(state.line, state.column, state.current),
    state.options.file
  );
}

/**
 * Adds a token to the stream.
 */
function addToken(state: LexerState, type: TokenType, value?: unknown): void {
  const lexeme = state.source.slice(state.start, state.current);
  state.tokens.push(createToken(type, lexeme, makeSpan(state), value));
}

/**
 * Reports a lexer error.
 */
function reportError(state: LexerState, message: string): void {
  const error = new LexerError(
    message,
    createPosition(state.line, state.column, state.current),
    state.options.file
  );
  state.errors.push(error);
  // Add error token for recovery
  addToken(state, TokenType.ERROR, message);
}

/**
 * Checks if character is a digit.
 */
function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

/**
 * Checks if character is alphabetic.
 */
function isAlpha(char: string): boolean {
  return (char >= 'a' && char <= 'z') ||
         (char >= 'A' && char <= 'Z') ||
         char === '_';
}

/**
 * Checks if character is alphanumeric.
 */
function isAlphaNumeric(char: string): boolean {
  return isAlpha(char) || isDigit(char);
}

/**
 * Scans a string literal.
 */
function scanString(state: LexerState, quote: string): void {
  const chars: string[] = [];
  
  while (!isAtEnd(state) && peek(state) !== quote) {
    const char = peek(state);
    
    // Handle newline in string
    if (char === '\n') {
      reportError(state, 'Unterminated string - newline in string literal');
      return;
    }
    
    // Handle escape sequences
    if (char === '\\') {
      advance(state);
      if (isAtEnd(state)) {
        reportError(state, 'Unterminated string - escape at end');
        return;
      }
      
      const escaped = advance(state);
      switch (escaped) {
        case 'n': chars.push('\n'); break;
        case 't': chars.push('\t'); break;
        case 'r': chars.push('\r'); break;
        case '\\': chars.push('\\'); break;
        case '"': chars.push('"'); break;
        case "'": chars.push("'"); break;
        case '`': chars.push('`'); break;
        case '0': chars.push('\0'); break;
        case 'x': {
          // Hex escape \xHH
          const hex = state.source.slice(state.current, state.current + 2);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            chars.push(String.fromCharCode(parseInt(hex, 16)));
            state.current += 2;
            state.column += 2;
          } else {
            reportError(state, `Invalid hex escape: \\x${hex}`);
          }
          break;
        }
        case 'u': {
          // Unicode escape \uHHHH or \u{H...}
          if (peek(state) === '{') {
            advance(state);
            let hex = '';
            while (!isAtEnd(state) && peek(state) !== '}') {
              hex += advance(state);
            }
            if (isAtEnd(state)) {
              reportError(state, 'Unterminated unicode escape');
              return;
            }
            advance(state); // consume '}'
            const codePoint = parseInt(hex, 16);
            if (isNaN(codePoint) || codePoint > 0x10FFFF) {
              reportError(state, `Invalid unicode escape: \\u{${hex}}`);
            } else {
              chars.push(String.fromCodePoint(codePoint));
            }
          } else {
            const hex = state.source.slice(state.current, state.current + 4);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              chars.push(String.fromCharCode(parseInt(hex, 16)));
              state.current += 4;
              state.column += 4;
            } else {
              reportError(state, `Invalid unicode escape: \\u${hex}`);
            }
          }
          break;
        }
        default:
          reportError(state, `Unknown escape sequence: \\${escaped}`);
          chars.push(escaped);
      }
    } else {
      chars.push(advance(state));
    }
  }
  
  if (isAtEnd(state)) {
    reportError(state, 'Unterminated string');
    return;
  }
  
  // Consume closing quote
  advance(state);
  
  addToken(state, TokenType.STRING, chars.join(''));
}

/**
 * Scans a number literal.
 */
function scanNumber(state: LexerState): void {
  // Check for hex, binary, octal prefixes
  if (peek(state) === 'x' || peek(state) === 'X') {
    advance(state);
    while (isHexDigit(peek(state))) advance(state);
    const hex = state.source.slice(state.start + 2, state.current);
    addToken(state, TokenType.NUMBER, parseInt(hex, 16));
    return;
  }
  
  if (peek(state) === 'b' || peek(state) === 'B') {
    advance(state);
    while (peek(state) === '0' || peek(state) === '1') advance(state);
    const bin = state.source.slice(state.start + 2, state.current);
    addToken(state, TokenType.NUMBER, parseInt(bin, 2));
    return;
  }
  
  if (peek(state) === 'o' || peek(state) === 'O') {
    advance(state);
    while (peek(state) >= '0' && peek(state) <= '7') advance(state);
    const oct = state.source.slice(state.start + 2, state.current);
    addToken(state, TokenType.NUMBER, parseInt(oct, 8));
    return;
  }
  
  // Decimal number
  while (isDigit(peek(state))) advance(state);
  
  // Fractional part
  if (peek(state) === '.' && isDigit(peekNext(state))) {
    advance(state); // consume '.'
    while (isDigit(peek(state))) advance(state);
  }
  
  // Exponent part
  if (peek(state) === 'e' || peek(state) === 'E') {
    advance(state);
    if (peek(state) === '+' || peek(state) === '-') advance(state);
    if (!isDigit(peek(state))) {
      reportError(state, 'Invalid number: expected digit after exponent');
      return;
    }
    while (isDigit(peek(state))) advance(state);
  }
  
  const numStr = state.source.slice(state.start, state.current);
  addToken(state, TokenType.NUMBER, parseFloat(numStr));
}

/**
 * Checks if character is a hex digit.
 */
function isHexDigit(char: string): boolean {
  return isDigit(char) || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
}

/**
 * Scans an identifier or keyword.
 */
function scanIdentifier(state: LexerState): void {
  while (isAlphaNumeric(peek(state))) advance(state);
  
  const text = state.source.slice(state.start, state.current);
  const type = KEYWORDS[text] ?? TokenType.IDENTIFIER;
  addToken(state, type, type === TokenType.IDENTIFIER ? text : undefined);
}

/**
 * Skips whitespace and comments.
 */
function skipWhitespace(state: LexerState): void {
  while (!isAtEnd(state)) {
    const char = peek(state);
    
    switch (char) {
      case ' ':
      case '\t':
      case '\r':
        advance(state);
        break;
        
      case '\n':
        if (state.options.includeWhitespace) {
          state.start = state.current;
          state.startColumn = state.column;
          advance(state);
          addToken(state, TokenType.NEWLINE);
        } else {
          advance(state);
        }
        break;
        
      case '/':
        if (peekNext(state) === '/') {
          // Line comment
          const commentStart = state.current;
          while (!isAtEnd(state) && peek(state) !== '\n') advance(state);
          if (state.options.includeComments) {
            const comment = state.source.slice(commentStart, state.current);
            state.tokens.push(createToken(
              TokenType.COMMENT,
              comment,
              createSpan(
                createPosition(state.line, state.startColumn, commentStart),
                createPosition(state.line, state.column, state.current),
                state.options.file
              ),
              comment.slice(2).trim()
            ));
          }
        } else if (peekNext(state) === '*') {
          // Block comment
          const commentStart = state.current;
          advance(state); // /
          advance(state); // *
          while (!isAtEnd(state) && !(peek(state) === '*' && peekNext(state) === '/')) {
            advance(state);
          }
          if (isAtEnd(state)) {
            reportError(state, 'Unterminated block comment');
            return;
          }
          advance(state); // *
          advance(state); // /
          if (state.options.includeComments) {
            const comment = state.source.slice(commentStart, state.current);
            state.tokens.push(createToken(
              TokenType.COMMENT,
              comment,
              createSpan(
                createPosition(state.line, state.startColumn, commentStart),
                createPosition(state.line, state.column, state.current),
                state.options.file
              ),
              comment.slice(2, -2).trim()
            ));
          }
        } else {
          return; // Not a comment, let scanToken handle it
        }
        break;
        
      default:
        return;
    }
  }
}

/**
 * Scans a single token.
 */
function scanToken(state: LexerState): void {
  skipWhitespace(state);
  if (isAtEnd(state)) return;
  
  state.start = state.current;
  state.startColumn = state.column;
  
  const char = advance(state);
  
  // Single-character tokens
  switch (char) {
    case '(': addToken(state, TokenType.LEFT_PAREN); return;
    case ')': addToken(state, TokenType.RIGHT_PAREN); return;
    case '{': addToken(state, TokenType.LEFT_BRACE); return;
    case '}': addToken(state, TokenType.RIGHT_BRACE); return;
    case '[': addToken(state, TokenType.LEFT_BRACKET); return;
    case ']': addToken(state, TokenType.RIGHT_BRACKET); return;
    case ',': addToken(state, TokenType.COMMA); return;
    case ';': addToken(state, TokenType.SEMICOLON); return;
    case '~': addToken(state, TokenType.TILDE); return;
    case '?': addToken(state, TokenType.QUESTION); return;
    
    // One or two character tokens
    case '+':
      addToken(state, match(state, '=') ? TokenType.PLUS_EQUAL : TokenType.PLUS);
      return;
    case '-':
      if (match(state, '>')) addToken(state, TokenType.ARROW);
      else if (match(state, '=')) addToken(state, TokenType.MINUS_EQUAL);
      else addToken(state, TokenType.MINUS);
      return;
    case '*':
      addToken(state, match(state, '=') ? TokenType.STAR_EQUAL : TokenType.STAR);
      return;
    case '/':
      addToken(state, match(state, '=') ? TokenType.SLASH_EQUAL : TokenType.SLASH);
      return;
    case '%':
      addToken(state, TokenType.PERCENT);
      return;
    case '^':
      addToken(state, TokenType.CARET);
      return;
    case '&':
      addToken(state, TokenType.AMPERSAND);
      return;
    case '|':
      addToken(state, TokenType.PIPE);
      return;
    case '!':
      addToken(state, match(state, '=') ? TokenType.BANG_EQUAL : TokenType.BANG);
      return;
    case '=':
      if (match(state, '=')) addToken(state, TokenType.EQUAL_EQUAL);
      else if (match(state, '>')) addToken(state, TokenType.FAT_ARROW);
      else addToken(state, TokenType.EQUAL);
      return;
    case '<':
      addToken(state, match(state, '=') ? TokenType.LESS_EQUAL : TokenType.LESS);
      return;
    case '>':
      addToken(state, match(state, '=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
      return;
    case '.':
      if (match(state, '.')) addToken(state, TokenType.DOT_DOT);
      else addToken(state, TokenType.DOT);
      return;
    case ':':
      if (match(state, ':')) addToken(state, TokenType.COLON_COLON);
      else addToken(state, TokenType.COLON);
      return;
      
    // String literals
    case '"':
    case "'":
      scanString(state, char);
      return;
      
    // Number literals
    default:
      if (isDigit(char)) {
        // Need to reset current to re-read the digit
        state.current--;
        state.column--;
        scanNumber(state);
      } else if (isAlpha(char)) {
        // Need to reset current to re-read the first character
        state.current--;
        state.column--;
        scanIdentifier(state);
      } else {
        reportError(state, `Unexpected character: '${char}'`);
      }
      return;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Result of lexical analysis.
 */
export interface LexerResult {
  /** Tokens produced */
  readonly tokens: readonly Token[];
  /** Errors encountered */
  readonly errors: readonly LexerError[];
  /** Whether lexing succeeded without errors */
  readonly success: boolean;
}

/**
 * Tokenizes CardScript source code.
 */
export function tokenize(source: string, options: LexerOptions = {}): LexerResult {
  const state = createLexerState(source, options);
  
  while (!isAtEnd(state)) {
    scanToken(state);
  }
  
  // Add EOF token
  state.start = state.current;
  state.startColumn = state.column;
  addToken(state, TokenType.EOF);
  
  return Object.freeze({
    tokens: Object.freeze(state.tokens),
    errors: Object.freeze(state.errors),
    success: state.errors.length === 0,
  });
}

/**
 * Creates a lexer that produces tokens on demand.
 */
export function createLexer(source: string, options: LexerOptions = {}) {
  const state = createLexerState(source, options);
  
  return {
    /**
     * Gets the next token.
     */
    next(): Token {
      if (state.tokens.length > 0) {
        return state.tokens.shift()!;
      }
      
      if (isAtEnd(state)) {
        state.start = state.current;
        state.startColumn = state.column;
        return createToken(
          TokenType.EOF,
          '',
          makeSpan(state)
        );
      }
      
      scanToken(state);
      return state.tokens.shift()!;
    },
    
    /**
     * Peeks at the next token without consuming it.
     */
    peek(): Token {
      if (state.tokens.length > 0) {
        return state.tokens[0]!;
      }
      
      if (isAtEnd(state)) {
        state.start = state.current;
        state.startColumn = state.column;
        return createToken(
          TokenType.EOF,
          '',
          makeSpan(state)
        );
      }
      
      scanToken(state);
      return state.tokens[0]!;
    },
    
    /**
     * Gets all errors so far.
     */
    getErrors(): readonly LexerError[] {
      return state.errors;
    },
  };
}
