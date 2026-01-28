/**
 * @fileoverview CardScript Grammar Specification.
 * 
 * CardScript is a domain-specific language for defining user cards.
 * It provides a safe, sandboxed environment for audio/music processing.
 * 
 * Grammar (EBNF):
 * 
 * program       = declaration* EOF ;
 * declaration   = cardDecl | funcDecl | constDecl | typeDecl | importDecl | exportDecl ;
 * 
 * cardDecl      = "card" IDENTIFIER "<" typeParams ">" cardBlock ;
 * cardBlock     = "{" cardMember* "}" ;
 * cardMember    = metaDecl | portsDecl | paramsDecl | stateDecl | processDecl ;
 * 
 * funcDecl      = "fn" IDENTIFIER "(" params? ")" returnType? block ;
 * constDecl     = "const" IDENTIFIER ":" type "=" expression ";" ;
 * typeDecl      = "type" IDENTIFIER "=" type ";" ;
 * importDecl    = "import" importSpec "from" STRING ";" ;
 * exportDecl    = "export" (cardDecl | funcDecl | constDecl | typeDecl) ;
 * 
 * @module @cardplay/user-cards/cardscript
 */

// ============================================================================
// TOKEN TYPES
// ============================================================================

/**
 * CardScript token types.
 */
export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NULL = 'NULL',
  
  // Keywords
  CARD = 'CARD',
  FN = 'FN',
  CONST = 'CONST',
  LET = 'LET',
  TYPE = 'TYPE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  AS = 'AS',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  RETURN = 'RETURN',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  AWAIT = 'AWAIT',
  ASYNC = 'ASYNC',
  YIELD = 'YIELD',
  
  // Card-specific keywords
  META = 'META',
  INPUTS = 'INPUTS',
  OUTPUTS = 'OUTPUTS',
  PARAMS = 'PARAMS',
  STATE = 'STATE',
  PROCESS = 'PROCESS',
  ON = 'ON',
  EMIT = 'EMIT',
  
  // Types
  NUMBER_TYPE = 'NUMBER_TYPE',
  STRING_TYPE = 'STRING_TYPE',
  BOOLEAN_TYPE = 'BOOLEAN_TYPE',
  AUDIO_TYPE = 'AUDIO_TYPE',
  MIDI_TYPE = 'MIDI_TYPE',
  EVENT_TYPE = 'EVENT_TYPE',
  STREAM_TYPE = 'STREAM_TYPE',
  VOID_TYPE = 'VOID_TYPE',
  
  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  CARET = 'CARET',
  AMPERSAND = 'AMPERSAND',
  PIPE = 'PIPE',
  TILDE = 'TILDE',
  BANG = 'BANG',
  QUESTION = 'QUESTION',
  
  // Comparison
  EQUAL = 'EQUAL',
  EQUAL_EQUAL = 'EQUAL_EQUAL',
  BANG_EQUAL = 'BANG_EQUAL',
  LESS = 'LESS',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER = 'GREATER',
  GREATER_EQUAL = 'GREATER_EQUAL',
  
  // Logical
  AND = 'AND',
  OR = 'OR',
  
  // Assignment
  PLUS_EQUAL = 'PLUS_EQUAL',
  MINUS_EQUAL = 'MINUS_EQUAL',
  STAR_EQUAL = 'STAR_EQUAL',
  SLASH_EQUAL = 'SLASH_EQUAL',
  
  // Delimiters
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  COMMA = 'COMMA',
  DOT = 'DOT',
  DOT_DOT = 'DOT_DOT',
  COLON = 'COLON',
  COLON_COLON = 'COLON_COLON',
  SEMICOLON = 'SEMICOLON',
  ARROW = 'ARROW',
  FAT_ARROW = 'FAT_ARROW',
  
  // Special
  EOF = 'EOF',
  ERROR = 'ERROR',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
}

/**
 * Reserved keywords mapping.
 */
export const KEYWORDS: Record<string, TokenType> = {
  // Core keywords
  'card': TokenType.CARD,
  'fn': TokenType.FN,
  'const': TokenType.CONST,
  'let': TokenType.LET,
  'type': TokenType.TYPE,
  'import': TokenType.IMPORT,
  'export': TokenType.EXPORT,
  'from': TokenType.FROM,
  'as': TokenType.AS,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'for': TokenType.FOR,
  'while': TokenType.WHILE,
  'return': TokenType.RETURN,
  'break': TokenType.BREAK,
  'continue': TokenType.CONTINUE,
  'await': TokenType.AWAIT,
  'async': TokenType.ASYNC,
  'yield': TokenType.YIELD,
  
  // Card keywords
  'meta': TokenType.META,
  'inputs': TokenType.INPUTS,
  'outputs': TokenType.OUTPUTS,
  'params': TokenType.PARAMS,
  'state': TokenType.STATE,
  'process': TokenType.PROCESS,
  'on': TokenType.ON,
  'emit': TokenType.EMIT,
  
  // Literals
  'true': TokenType.TRUE,
  'false': TokenType.FALSE,
  'null': TokenType.NULL,
  
  // Types
  'number': TokenType.NUMBER_TYPE,
  'string': TokenType.STRING_TYPE,
  'boolean': TokenType.BOOLEAN_TYPE,
  'audio': TokenType.AUDIO_TYPE,
  'midi': TokenType.MIDI_TYPE,
  'event': TokenType.EVENT_TYPE,
  'stream': TokenType.STREAM_TYPE,
  'void': TokenType.VOID_TYPE,
  
  // Logical
  'and': TokenType.AND,
  'or': TokenType.OR,
};

// ============================================================================
// SOURCE LOCATION
// ============================================================================

/**
 * Position in source code.
 */
export interface SourcePosition {
  /** Line number (1-indexed) */
  readonly line: number;
  /** Column number (1-indexed) */
  readonly column: number;
  /** Character offset from start */
  readonly offset: number;
}

/**
 * Span in source code.
 */
export interface SourceSpan {
  /** Start position */
  readonly start: SourcePosition;
  /** End position */
  readonly end: SourcePosition;
  /** Source file name */
  readonly file?: string;
}

/**
 * Creates a source position.
 */
export function createPosition(line: number, column: number, offset: number): SourcePosition {
  return Object.freeze({ line, column, offset });
}

/**
 * Creates a source span.
 */
export function createSpan(start: SourcePosition, end: SourcePosition, file?: string): SourceSpan {
  const span: SourceSpan = { start, end };
  if (file) (span as { file: string }).file = file;
  return Object.freeze(span);
}

// ============================================================================
// TOKENS
// ============================================================================

/**
 * A token from the lexer.
 */
export interface Token {
  /** Token type */
  readonly type: TokenType;
  /** Raw lexeme */
  readonly lexeme: string;
  /** Parsed value (for literals) */
  readonly value?: unknown;
  /** Source location */
  readonly span: SourceSpan;
}

/**
 * Creates a token.
 */
export function createToken(
  type: TokenType,
  lexeme: string,
  span: SourceSpan,
  value?: unknown
): Token {
  const token: Token = { type, lexeme, span };
  if (value !== undefined) (token as { value: unknown }).value = value;
  return Object.freeze(token);
}

// ============================================================================
// GRAMMAR RULES (for documentation)
// ============================================================================

/**
 * CardScript grammar rules in string form for documentation.
 */
export const GRAMMAR_RULES = `
// CardScript Grammar (EBNF notation)

// Program structure
program         → declaration* EOF

// Declarations
declaration     → cardDecl
                | funcDecl
                | constDecl
                | letDecl
                | typeDecl
                | importDecl
                | exportDecl
                | statement

// Card declaration
cardDecl        → "card" IDENTIFIER typeParamList? cardBody
cardBody        → "{" cardMember* "}"
cardMember      → metaBlock
                | inputsBlock
                | outputsBlock
                | paramsBlock
                | stateBlock
                | processBlock
                | onBlock
                | funcDecl

// Card blocks
metaBlock       → "meta" "{" metaField* "}"
metaField       → IDENTIFIER ":" expression ";"

inputsBlock     → "inputs" "{" portDecl* "}"
outputsBlock    → "outputs" "{" portDecl* "}"
portDecl        → IDENTIFIER ":" portType ("=" expression)? ";"
portType        → "audio" | "midi" | "event" "<" type ">" | "stream" "<" type ">"

paramsBlock     → "params" "{" paramDecl* "}"
paramDecl       → IDENTIFIER ":" paramType paramOptions? ";"
paramType       → "number" | "string" | "boolean" | "enum" "<" enumLiterals ">"
paramOptions    → "{" paramOption* "}"
paramOption     → IDENTIFIER ":" expression ","?

stateBlock      → "state" "{" stateDecl* "}"
stateDecl       → IDENTIFIER ":" type ("=" expression)? ";"

processBlock    → "process" "(" processParams ")" block
processParams   → IDENTIFIER ":" type ("," IDENTIFIER ":" type)*

onBlock         → "on" eventPattern block
eventPattern    → IDENTIFIER | STRING

// Functions
funcDecl        → "async"? "fn" IDENTIFIER typeParamList? "(" paramList? ")" returnType? block
paramList       → param ("," param)*
param           → IDENTIFIER ":" type ("=" expression)?
returnType      → "->" type
typeParamList   → "<" IDENTIFIER ("," IDENTIFIER)* ">"

// Types
type            → primaryType
                | type "[]"
                | type "?"
                | "(" type ")"
                | type "|" type
                | type "&" type
                | "{" objectType "}"
                | "fn" "(" typeList? ")" "->" type

primaryType     → IDENTIFIER
                | "number"
                | "string"
                | "boolean"
                | "void"
                | "audio"
                | "midi"
                | "event" "<" type ">"
                | "stream" "<" type ">"

// Statements
statement       → block
                | ifStmt
                | forStmt
                | whileStmt
                | returnStmt
                | breakStmt
                | continueStmt
                | emitStmt
                | exprStmt

block           → "{" declaration* "}"
ifStmt          → "if" expression block ("else" (ifStmt | block))?
forStmt         → "for" IDENTIFIER "in" expression block
whileStmt       → "while" expression block
returnStmt      → "return" expression? ";"
breakStmt       → "break" ";"
continueStmt    → "continue" ";"
emitStmt        → "emit" IDENTIFIER "(" expression ")" ";"
exprStmt        → expression ";"

// Expressions
expression      → assignment
assignment      → (IDENTIFIER "=")* ternary
ternary         → logicOr ("?" expression ":" expression)?
logicOr         → logicAnd ("or" logicAnd)*
logicAnd        → equality ("and" equality)*
equality        → comparison (("==" | "!=") comparison)*
comparison      → term (("<" | "<=" | ">" | ">=") term)*
term            → factor (("+" | "-") factor)*
factor          → unary (("*" | "/" | "%") unary)*
unary           → ("!" | "-" | "~") unary | postfix
postfix         → primary (call | index | member)*
call            → "(" arguments? ")"
index           → "[" expression "]"
member          → "." IDENTIFIER

primary         → NUMBER | STRING | "true" | "false" | "null"
                | IDENTIFIER
                | "(" expression ")"
                | "[" arguments? "]"
                | "{" objectLiteral "}"
                | "fn" "(" paramList? ")" "->" type block
                | "await" expression

arguments       → expression ("," expression)*
objectLiteral   → (objectEntry ("," objectEntry)*)?
objectEntry     → (IDENTIFIER | STRING) ":" expression

// Import/Export
importDecl      → "import" importSpec "from" STRING ";"
importSpec      → "{" importItem ("," importItem)* "}"
                | IDENTIFIER
                | "*" "as" IDENTIFIER
importItem      → IDENTIFIER ("as" IDENTIFIER)?

exportDecl      → "export" declaration
                | "export" "{" exportItem ("," exportItem)* "}" ("from" STRING)? ";"
exportItem      → IDENTIFIER ("as" IDENTIFIER)?

// Comments
COMMENT         → "//" [^\\n]* | "/*" .*? "*/"
`;

// ============================================================================
// PRECEDENCE LEVELS
// ============================================================================

/**
 * Operator precedence levels (higher = tighter binding).
 */
export enum Precedence {
  NONE = 0,
  ASSIGNMENT = 1,    // =
  TERNARY = 2,       // ?:
  OR = 3,            // or
  AND = 4,           // and
  EQUALITY = 5,      // == !=
  COMPARISON = 6,    // < > <= >=
  BITWISE_OR = 7,    // |
  BITWISE_XOR = 8,   // ^
  BITWISE_AND = 9,   // &
  SHIFT = 10,        // << >>
  TERM = 11,         // + -
  FACTOR = 12,       // * / %
  UNARY = 13,        // ! - ~
  CALL = 14,         // () [] .
  PRIMARY = 15,
}

/**
 * Gets the precedence for a binary operator token.
 */
export function getBinaryPrecedence(type: TokenType): Precedence {
  switch (type) {
    case TokenType.OR: return Precedence.OR;
    case TokenType.AND: return Precedence.AND;
    case TokenType.EQUAL_EQUAL:
    case TokenType.BANG_EQUAL: return Precedence.EQUALITY;
    case TokenType.LESS:
    case TokenType.LESS_EQUAL:
    case TokenType.GREATER:
    case TokenType.GREATER_EQUAL: return Precedence.COMPARISON;
    case TokenType.PIPE: return Precedence.BITWISE_OR;
    case TokenType.CARET: return Precedence.BITWISE_XOR;
    case TokenType.AMPERSAND: return Precedence.BITWISE_AND;
    case TokenType.PLUS:
    case TokenType.MINUS: return Precedence.TERM;
    case TokenType.STAR:
    case TokenType.SLASH:
    case TokenType.PERCENT: return Precedence.FACTOR;
    default: return Precedence.NONE;
  }
}
