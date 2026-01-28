/**
 * @fileoverview CardScript Parser.
 * 
 * Parses a stream of tokens into an Abstract Syntax Tree (AST).
 * Uses recursive descent with Pratt parsing for expressions.
 * 
 * @module @cardplay/user-cards/cardscript/parser
 */

import {
  Token,
  TokenType,
  SourceSpan,
  Precedence,
  getBinaryPrecedence,
  createSpan,
} from './grammar';
import { tokenize, LexerError } from './lexer';
import * as AST from './ast';

// ============================================================================
// PARSER ERROR
// ============================================================================

/**
 * Error during parsing.
 */
export class ParserError extends Error {
  constructor(
    message: string,
    public readonly token: Token,
    public readonly expected?: string
  ) {
    super(`[${token.span.start.line}:${token.span.start.column}] ${message}`);
    this.name = 'ParserError';
  }
}

// ============================================================================
// PARSER STATE
// ============================================================================

interface ParserState {
  tokens: readonly Token[];
  current: number;
  errors: ParserError[];
}

function createParserState(tokens: readonly Token[]): ParserState {
  return { tokens, current: 0, errors: [] };
}

// ============================================================================
// HELPER - omits undefined values for exactOptionalPropertyTypes
// ============================================================================
// HELPER - strips undefined properties at runtime (for exactOptionalPropertyTypes)
// ============================================================================

/**
 * Creates an object with optional properties omitted when undefined.
 * This satisfies exactOptionalPropertyTypes by never assigning undefined to optional fields.
 */
function makeNode<T>(obj: { [K in keyof T]: T[K] | undefined }): T {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      result[key] = obj[key] as T[keyof T];
    }
  }
  return result as T;
}

// ============================================================================
// TOKEN HELPERS
// ============================================================================

function isAtEnd(state: ParserState): boolean {
  return peek(state).type === TokenType.EOF;
}

function peek(state: ParserState): Token {
  return state.tokens[state.current]!;
}

/** Peeks at the next token (exported for testing/debugging) */
export function peekNext(state: ParserState): Token {
  if (state.current + 1 >= state.tokens.length) {
    return state.tokens[state.tokens.length - 1]!;
  }
  return state.tokens[state.current + 1]!;
}

function previous(state: ParserState): Token {
  return state.tokens[state.current - 1]!;
}

function advance(state: ParserState): Token {
  if (!isAtEnd(state)) state.current++;
  return previous(state);
}

function check(state: ParserState, type: TokenType): boolean {
  if (isAtEnd(state)) return false;
  return peek(state).type === type;
}

function match(state: ParserState, ...types: TokenType[]): boolean {
  for (const type of types) {
    if (check(state, type)) {
      advance(state);
      return true;
    }
  }
  return false;
}

function consume(state: ParserState, type: TokenType, message: string): Token {
  if (check(state, type)) return advance(state);
  throw error(state, peek(state), message);
}

function error(state: ParserState, token: Token, message: string): ParserError {
  const err = new ParserError(message, token);
  state.errors.push(err);
  return err;
}

function synchronize(state: ParserState): void {
  advance(state);
  
  while (!isAtEnd(state)) {
    if (previous(state).type === TokenType.SEMICOLON) return;
    
    switch (peek(state).type) {
      case TokenType.CARD:
      case TokenType.FN:
      case TokenType.CONST:
      case TokenType.LET:
      case TokenType.TYPE:
      case TokenType.IMPORT:
      case TokenType.EXPORT:
      case TokenType.IF:
      case TokenType.FOR:
      case TokenType.WHILE:
      case TokenType.RETURN:
        return;
    }
    
    advance(state);
  }
}

function makeSpan(start: Token, end: Token): SourceSpan {
  return createSpan(start.span.start, end.span.end, start.span.file);
}

// ============================================================================
// TYPE PARSING
// ============================================================================

function parseType(state: ParserState): AST.TypeNode {
  return parseUnionType(state);
}

function parseUnionType(state: ParserState): AST.TypeNode {
  let left = parseIntersectionType(state);
  
  while (match(state, TokenType.PIPE)) {
    const right = parseIntersectionType(state);
    left = {
      kind: 'UnionType',
      types: left.kind === 'UnionType' ? [...left.types, right] : [left, right],
      span: makeSpan(state.tokens[state.current - 2]!, previous(state)),
    };
  }
  
  return left;
}

function parseIntersectionType(state: ParserState): AST.TypeNode {
  let left = parsePostfixType(state);
  
  while (match(state, TokenType.AMPERSAND)) {
    const right = parsePostfixType(state);
    left = {
      kind: 'IntersectionType',
      types: left.kind === 'IntersectionType' ? [...left.types, right] : [left, right],
      span: makeSpan(state.tokens[state.current - 2]!, previous(state)),
    };
  }
  
  return left;
}

function parsePostfixType(state: ParserState): AST.TypeNode {
  let type = parsePrimaryType(state);
  
  while (true) {
    if (match(state, TokenType.LEFT_BRACKET)) {
      consume(state, TokenType.RIGHT_BRACKET, "Expected ']' after '['");
      type = {
        kind: 'ArrayType',
        elementType: type,
        span: makeSpan(state.tokens[state.current - 3]!, previous(state)),
      };
    } else if (match(state, TokenType.QUESTION)) {
      type = {
        kind: 'OptionalType',
        baseType: type,
        span: makeSpan(state.tokens[state.current - 2]!, previous(state)),
      };
    } else {
      break;
    }
  }
  
  return type;
}

function parsePrimaryType(state: ParserState): AST.TypeNode {
  const start = peek(state);
  
  // Function type: fn(T, U) -> R
  if (match(state, TokenType.FN)) {
    consume(state, TokenType.LEFT_PAREN, "Expected '(' after 'fn' in type");
    
    const paramTypes: AST.TypeNode[] = [];
    if (!check(state, TokenType.RIGHT_PAREN)) {
      do {
        paramTypes.push(parseType(state));
      } while (match(state, TokenType.COMMA));
    }
    
    consume(state, TokenType.RIGHT_PAREN, "Expected ')' after function parameter types");
    consume(state, TokenType.ARROW, "Expected '->' after function parameters in type");
    
    const returnType = parseType(state);
    
    return {
      kind: 'FunctionType',
      paramTypes,
      returnType,
      span: makeSpan(start, previous(state)),
    };
  }
  
  // Object type: { x: T, y: U }
  if (match(state, TokenType.LEFT_BRACE)) {
    const properties: AST.ObjectTypeProperty[] = [];
    
    if (!check(state, TokenType.RIGHT_BRACE)) {
      do {
        const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected property name');
        const optional = match(state, TokenType.QUESTION);
        consume(state, TokenType.COLON, "Expected ':' after property name");
        const propType = parseType(state);
        
        properties.push({
          name: nameToken.lexeme,
          type: propType,
          optional,
        });
      } while (match(state, TokenType.COMMA));
    }
    
    consume(state, TokenType.RIGHT_BRACE, "Expected '}' after object type");
    
    return {
      kind: 'ObjectType',
      properties,
      span: makeSpan(start, previous(state)),
    };
  }
  
  // Parenthesized type
  if (match(state, TokenType.LEFT_PAREN)) {
    const inner = parseType(state);
    consume(state, TokenType.RIGHT_PAREN, "Expected ')' after type");
    return inner;
  }
  
  // Built-in types and identifiers
  if (match(state, TokenType.NUMBER_TYPE, TokenType.STRING_TYPE, TokenType.BOOLEAN_TYPE,
            TokenType.VOID_TYPE, TokenType.AUDIO_TYPE, TokenType.MIDI_TYPE)) {
    return {
      kind: 'TypeReference',
      name: previous(state).lexeme,
      span: previous(state).span,
    };
  }
  
  // Generic types: event<T>, stream<T>
  if (match(state, TokenType.EVENT_TYPE, TokenType.STREAM_TYPE)) {
    const name = previous(state).lexeme;
    
    if (match(state, TokenType.LESS)) {
      const typeArgs: AST.TypeNode[] = [];
      do {
        typeArgs.push(parseType(state));
      } while (match(state, TokenType.COMMA));
      consume(state, TokenType.GREATER, "Expected '>' after type arguments");
      
      return {
        kind: 'GenericType',
        name,
        typeArguments: typeArgs,
        span: makeSpan(start, previous(state)),
      };
    }
    
    return {
      kind: 'TypeReference',
      name,
      span: previous(state).span,
    };
  }
  
  // Identifier (custom type)
  if (match(state, TokenType.IDENTIFIER)) {
    const name = previous(state).lexeme;
    
    // Check for generic type: MyType<T>
    if (match(state, TokenType.LESS)) {
      const typeArgs: AST.TypeNode[] = [];
      do {
        typeArgs.push(parseType(state));
      } while (match(state, TokenType.COMMA));
      consume(state, TokenType.GREATER, "Expected '>' after type arguments");
      
      return {
        kind: 'GenericType',
        name,
        typeArguments: typeArgs,
        span: makeSpan(start, previous(state)),
      };
    }
    
    return {
      kind: 'TypeReference',
      name,
      span: previous(state).span,
    };
  }
  
  throw error(state, peek(state), 'Expected type');
}

// ============================================================================
// EXPRESSION PARSING (PRATT PARSER)
// ============================================================================

function parseExpression(state: ParserState): AST.Expression {
  return parseAssignment(state);
}

function parseAssignment(state: ParserState): AST.Expression {
  const expr = parseTernary(state);
  
  if (match(state, TokenType.EQUAL, TokenType.PLUS_EQUAL, TokenType.MINUS_EQUAL,
            TokenType.STAR_EQUAL, TokenType.SLASH_EQUAL)) {
    const operator = previous(state).lexeme;
    const value = parseAssignment(state);
    
    return {
      kind: 'AssignmentExpression',
      operator,
      target: expr,
      value,
      span: makeSpan(state.tokens[state.current - 2]!, previous(state)),
    };
  }
  
  return expr;
}

function parseTernary(state: ParserState): AST.Expression {
  let expr = parseBinaryExpression(state, Precedence.NONE);
  
  if (match(state, TokenType.QUESTION)) {
    const consequent = parseExpression(state);
    consume(state, TokenType.COLON, "Expected ':' in ternary expression");
    const alternate = parseTernary(state);
    
    return {
      kind: 'TernaryExpression',
      condition: expr,
      consequent,
      alternate,
      span: makeSpan(state.tokens[state.current - 4]!, previous(state)),
    };
  }
  
  return expr;
}

function parseBinaryExpression(state: ParserState, minPrecedence: Precedence): AST.Expression {
  let left = parseUnary(state);
  
  while (true) {
    const opToken = peek(state);
    const precedence = getBinaryPrecedence(opToken.type);
    
    if (precedence <= minPrecedence) break;
    
    advance(state);
    const operator = opToken.lexeme;
    const right = parseBinaryExpression(state, precedence);
    
    left = {
      kind: 'BinaryExpression',
      operator,
      left,
      right,
      span: makeSpan(state.tokens[state.current - 2]!, previous(state)),
    };
  }
  
  return left;
}

function parseUnary(state: ParserState): AST.Expression {
  if (match(state, TokenType.BANG, TokenType.MINUS, TokenType.TILDE)) {
    const operator = previous(state).lexeme;
    const start = previous(state);
    const operand = parseUnary(state);
    
    return {
      kind: 'UnaryExpression',
      operator,
      operand,
      prefix: true,
      span: makeSpan(start, previous(state)),
    };
  }
  
  return parsePostfix(state);
}

function parsePostfix(state: ParserState): AST.Expression {
  let expr = parsePrimary(state);
  
  while (true) {
    if (match(state, TokenType.LEFT_PAREN)) {
      // Function call
      const args: AST.Expression[] = [];
      
      if (!check(state, TokenType.RIGHT_PAREN)) {
        do {
          args.push(parseExpression(state));
        } while (match(state, TokenType.COMMA));
      }
      
      consume(state, TokenType.RIGHT_PAREN, "Expected ')' after arguments");
      
      expr = {
        kind: 'CallExpression',
        callee: expr,
        arguments: args,
        span: makeSpan(state.tokens[state.current - args.length - 2]!, previous(state)),
      };
    } else if (match(state, TokenType.DOT)) {
      // Member access
      const propToken = consume(state, TokenType.IDENTIFIER, 'Expected property name after "."');
      
      expr = {
        kind: 'MemberExpression',
        object: expr,
        property: propToken.lexeme,
        span: makeSpan(state.tokens[state.current - 3]!, previous(state)),
      };
    } else if (match(state, TokenType.LEFT_BRACKET)) {
      // Index access
      const index = parseExpression(state);
      consume(state, TokenType.RIGHT_BRACKET, "Expected ']' after index");
      
      expr = {
        kind: 'IndexExpression',
        object: expr,
        index,
        span: makeSpan(state.tokens[state.current - 3]!, previous(state)),
      };
    } else {
      break;
    }
  }
  
  return expr;
}

function parsePrimary(state: ParserState): AST.Expression {
  const token = peek(state);
  
  // Literals
  if (match(state, TokenType.NUMBER)) {
    return {
      kind: 'NumberLiteral',
      value: token.value as number,
      span: token.span,
    };
  }
  
  if (match(state, TokenType.STRING)) {
    return {
      kind: 'StringLiteral',
      value: token.value as string,
      span: token.span,
    };
  }
  
  if (match(state, TokenType.TRUE)) {
    return {
      kind: 'BooleanLiteral',
      value: true,
      span: token.span,
    };
  }
  
  if (match(state, TokenType.FALSE)) {
    return {
      kind: 'BooleanLiteral',
      value: false,
      span: token.span,
    };
  }
  
  if (match(state, TokenType.NULL)) {
    return {
      kind: 'NullLiteral',
      span: token.span,
    };
  }
  
  // Identifier
  if (match(state, TokenType.IDENTIFIER)) {
    return {
      kind: 'Identifier',
      name: token.lexeme,
      span: token.span,
    };
  }
  
  // Parenthesized expression
  if (match(state, TokenType.LEFT_PAREN)) {
    const expr = parseExpression(state);
    consume(state, TokenType.RIGHT_PAREN, "Expected ')' after expression");
    return expr;
  }
  
  // Array literal
  if (match(state, TokenType.LEFT_BRACKET)) {
    const start = previous(state);
    const elements: AST.Expression[] = [];
    
    if (!check(state, TokenType.RIGHT_BRACKET)) {
      do {
        elements.push(parseExpression(state));
      } while (match(state, TokenType.COMMA));
    }
    
    consume(state, TokenType.RIGHT_BRACKET, "Expected ']' after array elements");
    
    return {
      kind: 'ArrayLiteral',
      elements,
      span: makeSpan(start, previous(state)),
    };
  }
  
  // Object literal
  if (match(state, TokenType.LEFT_BRACE)) {
    const start = previous(state);
    const properties: AST.ObjectProperty[] = [];
    
    if (!check(state, TokenType.RIGHT_BRACE)) {
      do {
        let key: string | AST.Expression;
        let computed = false;
        
        if (match(state, TokenType.LEFT_BRACKET)) {
          key = parseExpression(state);
          consume(state, TokenType.RIGHT_BRACKET, "Expected ']' after computed property");
          computed = true;
        } else if (check(state, TokenType.STRING)) {
          key = advance(state).value as string;
        } else {
          key = consume(state, TokenType.IDENTIFIER, 'Expected property name').lexeme;
        }
        
        consume(state, TokenType.COLON, "Expected ':' after property name");
        const value = parseExpression(state);
        
        properties.push({ key, value, computed });
      } while (match(state, TokenType.COMMA));
    }
    
    consume(state, TokenType.RIGHT_BRACE, "Expected '}' after object properties");
    
    return {
      kind: 'ObjectLiteral',
      properties,
      span: makeSpan(start, previous(state)),
    };
  }
  
  // Await expression
  if (match(state, TokenType.AWAIT)) {
    const start = previous(state);
    const argument = parseUnary(state);
    
    return {
      kind: 'AwaitExpression',
      argument,
      span: makeSpan(start, previous(state)),
    };
  }
  
  // Function expression
  if (match(state, TokenType.FN)) {
    return parseFunctionExpression(state, previous(state));
  }
  
  throw error(state, token, 'Expected expression');
}

function parseFunctionExpression(state: ParserState, start: Token): AST.FunctionExpression {
  consume(state, TokenType.LEFT_PAREN, "Expected '(' after 'fn'");
  
  const params: AST.Parameter[] = [];
  if (!check(state, TokenType.RIGHT_PAREN)) {
    do {
      const paramName = consume(state, TokenType.IDENTIFIER, 'Expected parameter name');
      consume(state, TokenType.COLON, "Expected ':' after parameter name");
      const paramType = parseType(state);
      
      let defaultValue: AST.Expression | undefined;
      if (match(state, TokenType.EQUAL)) {
        defaultValue = parseExpression(state);
      }
      
      params.push(makeNode({ name: paramName.lexeme, type: paramType, defaultValue }));
    } while (match(state, TokenType.COMMA));
  }
  
  consume(state, TokenType.RIGHT_PAREN, "Expected ')' after parameters");
  
  let returnType: AST.TypeNode | undefined;
  if (match(state, TokenType.ARROW)) {
    returnType = parseType(state);
  }
  
  const body = parseBlock(state);
  
  return makeNode({
    kind: 'FunctionExpression' as const,
    params,
    returnType,
    body,
    span: makeSpan(start, previous(state)),
  });
}

// ============================================================================
// STATEMENT PARSING
// ============================================================================

function parseStatement(state: ParserState): AST.Statement {
  if (check(state, TokenType.LEFT_BRACE)) return parseBlock(state);
  if (match(state, TokenType.IF)) return parseIfStatement(state);
  if (match(state, TokenType.FOR)) return parseForStatement(state);
  if (match(state, TokenType.WHILE)) return parseWhileStatement(state);
  if (match(state, TokenType.RETURN)) return parseReturnStatement(state);
  if (match(state, TokenType.BREAK)) return parseBreakStatement(state);
  if (match(state, TokenType.CONTINUE)) return parseContinueStatement(state);
  if (match(state, TokenType.EMIT)) return parseEmitStatement(state);
  if (match(state, TokenType.LET)) return parseLetDeclaration(state);
  if (match(state, TokenType.CONST)) return parseConstDeclaration(state, false);
  
  return parseExpressionStatement(state);
}

function parseBlock(state: ParserState): AST.BlockStatement {
  const start = consume(state, TokenType.LEFT_BRACE, "Expected '{'");
  const body: AST.Statement[] = [];
  
  while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
    try {
      body.push(parseStatement(state));
    } catch (e) {
      synchronize(state);
    }
  }
  
  consume(state, TokenType.RIGHT_BRACE, "Expected '}'");
  
  return {
    kind: 'BlockStatement',
    body,
    span: makeSpan(start, previous(state)),
  };
}

function parseIfStatement(state: ParserState): AST.IfStatement {
  const start = previous(state);
  const condition = parseExpression(state);
  const consequent = parseBlock(state);
  
  let alternate: AST.BlockStatement | AST.IfStatement | undefined;
  if (match(state, TokenType.ELSE)) {
    if (check(state, TokenType.IF)) {
      advance(state);
      alternate = parseIfStatement(state);
    } else {
      alternate = parseBlock(state);
    }
  }
  
  return makeNode({
    kind: 'IfStatement' as const,
    condition,
    consequent,
    alternate,
    span: makeSpan(start, previous(state)),
  });
}

function parseForStatement(state: ParserState): AST.ForStatement {
  const start = previous(state);
  const varToken = consume(state, TokenType.IDENTIFIER, 'Expected variable name');
  consume(state, TokenType.IDENTIFIER, "Expected 'in' after variable"); // 'in' keyword
  const iterable = parseExpression(state);
  const body = parseBlock(state);
  
  return {
    kind: 'ForStatement',
    variable: varToken.lexeme,
    iterable,
    body,
    span: makeSpan(start, previous(state)),
  };
}

function parseWhileStatement(state: ParserState): AST.WhileStatement {
  const start = previous(state);
  const condition = parseExpression(state);
  const body = parseBlock(state);
  
  return {
    kind: 'WhileStatement',
    condition,
    body,
    span: makeSpan(start, previous(state)),
  };
}

function parseReturnStatement(state: ParserState): AST.ReturnStatement {
  const start = previous(state);
  
  let argument: AST.Expression | undefined;
  if (!check(state, TokenType.SEMICOLON) && !check(state, TokenType.RIGHT_BRACE)) {
    argument = parseExpression(state);
  }
  
  match(state, TokenType.SEMICOLON);
  
  return makeNode({
    kind: 'ReturnStatement' as const,
    argument,
    span: makeSpan(start, previous(state)),
  });
}

function parseBreakStatement(state: ParserState): AST.BreakStatement {
  const start = previous(state);
  match(state, TokenType.SEMICOLON);
  
  return {
    kind: 'BreakStatement',
    span: start.span,
  };
}

function parseContinueStatement(state: ParserState): AST.ContinueStatement {
  const start = previous(state);
  match(state, TokenType.SEMICOLON);
  
  return {
    kind: 'ContinueStatement',
    span: start.span,
  };
}

function parseEmitStatement(state: ParserState): AST.EmitStatement {
  const start = previous(state);
  const portToken = consume(state, TokenType.IDENTIFIER, 'Expected port name');
  consume(state, TokenType.LEFT_PAREN, "Expected '(' after port name");
  const value = parseExpression(state);
  consume(state, TokenType.RIGHT_PAREN, "Expected ')' after emit value");
  match(state, TokenType.SEMICOLON);
  
  return {
    kind: 'EmitStatement',
    port: portToken.lexeme,
    value,
    span: makeSpan(start, previous(state)),
  };
}

function parseExpressionStatement(state: ParserState): AST.ExpressionStatement {
  const start = peek(state);
  const expression = parseExpression(state);
  match(state, TokenType.SEMICOLON);
  
  return {
    kind: 'ExpressionStatement',
    expression,
    span: makeSpan(start, previous(state)),
  };
}

// ============================================================================
// DECLARATION PARSING
// ============================================================================

function parseLetDeclaration(state: ParserState): AST.LetDeclaration {
  const start = previous(state);
  const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected variable name');
  
  let type: AST.TypeNode | undefined;
  if (match(state, TokenType.COLON)) {
    type = parseType(state);
  }
  
  let initializer: AST.Expression | undefined;
  if (match(state, TokenType.EQUAL)) {
    initializer = parseExpression(state);
  }
  
  match(state, TokenType.SEMICOLON);
  
  return makeNode({
    kind: 'LetDeclaration' as const,
    name: nameToken.lexeme,
    type,
    initializer,
    span: makeSpan(start, previous(state)),
  });
}

function parseConstDeclaration(state: ParserState, exported: boolean): AST.ConstDeclaration {
  const start = previous(state);
  const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected constant name');
  
  let type: AST.TypeNode | undefined;
  if (match(state, TokenType.COLON)) {
    type = parseType(state);
  }
  
  consume(state, TokenType.EQUAL, "Expected '=' after constant name");
  const initializer = parseExpression(state);
  match(state, TokenType.SEMICOLON);
  
  return makeNode({
    kind: 'ConstDeclaration' as const,
    name: nameToken.lexeme,
    type,
    initializer,
    exported,
    span: makeSpan(start, previous(state)),
  });
}

function parseFunctionDeclaration(state: ParserState, exported: boolean): AST.FunctionDeclaration {
  const start = previous(state);
  const isAsync = match(state, TokenType.ASYNC);
  
  const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected function name');
  
  // Type parameters
  let typeParams: AST.TypeParameter[] | undefined;
  if (match(state, TokenType.LESS)) {
    typeParams = [];
    do {
      const paramName = consume(state, TokenType.IDENTIFIER, 'Expected type parameter name');
      typeParams.push({ name: paramName.lexeme });
    } while (match(state, TokenType.COMMA));
    consume(state, TokenType.GREATER, "Expected '>' after type parameters");
  }
  
  consume(state, TokenType.LEFT_PAREN, "Expected '(' after function name");
  
  const params: AST.Parameter[] = [];
  if (!check(state, TokenType.RIGHT_PAREN)) {
    do {
      const paramName = consume(state, TokenType.IDENTIFIER, 'Expected parameter name');
      consume(state, TokenType.COLON, "Expected ':' after parameter name");
      const paramType = parseType(state);
      
      let defaultValue: AST.Expression | undefined;
      if (match(state, TokenType.EQUAL)) {
        defaultValue = parseExpression(state);
      }
      
      params.push(makeNode({ name: paramName.lexeme, type: paramType, defaultValue }));
    } while (match(state, TokenType.COMMA));
  }
  
  consume(state, TokenType.RIGHT_PAREN, "Expected ')' after parameters");
  
  let returnType: AST.TypeNode | undefined;
  if (match(state, TokenType.ARROW)) {
    returnType = parseType(state);
  }
  
  const body = parseBlock(state);
  
  return makeNode({
    kind: 'FunctionDeclaration' as const,
    name: nameToken.lexeme,
    typeParams,
    params,
    returnType,
    body,
    isAsync,
    exported,
    span: makeSpan(start, previous(state)),
  });
}

function parseTypeDeclaration(state: ParserState, exported: boolean): AST.TypeDeclaration {
  const start = previous(state);
  const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected type name');
  
  // Type parameters
  let typeParams: AST.TypeParameter[] | undefined;
  if (match(state, TokenType.LESS)) {
    typeParams = [];
    do {
      const paramName = consume(state, TokenType.IDENTIFIER, 'Expected type parameter name');
      typeParams.push({ name: paramName.lexeme });
    } while (match(state, TokenType.COMMA));
    consume(state, TokenType.GREATER, "Expected '>' after type parameters");
  }
  
  consume(state, TokenType.EQUAL, "Expected '=' after type name");
  const type = parseType(state);
  match(state, TokenType.SEMICOLON);
  
  return makeNode({
    kind: 'TypeDeclaration' as const,
    name: nameToken.lexeme,
    typeParams,
    type,
    exported,
    span: makeSpan(start, previous(state)),
  });
}

function parseImportDeclaration(state: ParserState): AST.ImportDeclaration {
  const start = previous(state);
  const specifiers: AST.ImportSpecifier[] = [];
  let isNamespace = false;
  let namespaceAlias: string | undefined;
  
  if (match(state, TokenType.STAR)) {
    consume(state, TokenType.AS, "Expected 'as' after '*'");
    namespaceAlias = consume(state, TokenType.IDENTIFIER, 'Expected namespace alias').lexeme;
    isNamespace = true;
  } else if (match(state, TokenType.LEFT_BRACE)) {
    do {
      const imported = consume(state, TokenType.IDENTIFIER, 'Expected import name').lexeme;
      let local = imported;
      if (match(state, TokenType.AS)) {
        local = consume(state, TokenType.IDENTIFIER, 'Expected local alias').lexeme;
      }
      specifiers.push({ imported, local });
    } while (match(state, TokenType.COMMA));
    consume(state, TokenType.RIGHT_BRACE, "Expected '}' after imports");
  } else {
    const imported = consume(state, TokenType.IDENTIFIER, 'Expected import name').lexeme;
    specifiers.push({ imported, local: imported });
  }
  
  consume(state, TokenType.FROM, "Expected 'from' after import specifiers");
  const source = consume(state, TokenType.STRING, 'Expected module path').value as string;
  match(state, TokenType.SEMICOLON);
  
  return makeNode({
    kind: 'ImportDeclaration' as const,
    specifiers,
    source,
    isNamespace,
    namespaceAlias,
    span: makeSpan(start, previous(state)),
  });
}

// ============================================================================
// CARD DECLARATION PARSING
// ============================================================================

function parseCardDeclaration(state: ParserState, exported: boolean): AST.CardDeclaration {
  const start = previous(state);
  const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected card name');
  
  // Type parameters
  let typeParams: AST.TypeParameter[] | undefined;
  if (match(state, TokenType.LESS)) {
    typeParams = [];
    do {
      const paramName = consume(state, TokenType.IDENTIFIER, 'Expected type parameter name');
      typeParams.push({ name: paramName.lexeme });
    } while (match(state, TokenType.COMMA));
    consume(state, TokenType.GREATER, "Expected '>' after type parameters");
  }
  
  consume(state, TokenType.LEFT_BRACE, "Expected '{' after card name");
  
  const members: AST.CardMember[] = [];
  
  while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
    try {
      if (match(state, TokenType.META)) {
        members.push(parseMetaBlock(state));
      } else if (match(state, TokenType.INPUTS)) {
        members.push(parseInputsBlock(state));
      } else if (match(state, TokenType.OUTPUTS)) {
        members.push(parseOutputsBlock(state));
      } else if (match(state, TokenType.PARAMS)) {
        members.push(parseParamsBlock(state));
      } else if (match(state, TokenType.STATE)) {
        members.push(parseStateBlock(state));
      } else if (match(state, TokenType.PROCESS)) {
        members.push(parseProcessBlock(state));
      } else if (match(state, TokenType.ON)) {
        members.push(parseOnBlock(state));
      } else if (match(state, TokenType.FN)) {
        members.push(parseFunctionDeclaration(state, false));
      } else {
        throw error(state, peek(state), 'Expected card member (meta, inputs, outputs, params, state, process, on, fn)');
      }
    } catch (e) {
      synchronize(state);
    }
  }
  
  consume(state, TokenType.RIGHT_BRACE, "Expected '}' after card body");
  
  return makeNode({
    kind: 'CardDeclaration' as const,
    name: nameToken.lexeme,
    typeParams,
    members,
    exported,
    span: makeSpan(start, previous(state)),
  });
}

function parseMetaBlock(state: ParserState): AST.MetaBlock {
  const start = previous(state);
  consume(state, TokenType.LEFT_BRACE, "Expected '{' after 'meta'");
  
  const fields: AST.MetaField[] = [];
  
  while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
    const fieldName = consume(state, TokenType.IDENTIFIER, 'Expected field name');
    consume(state, TokenType.COLON, "Expected ':' after field name");
    const value = parseExpression(state);
    match(state, TokenType.SEMICOLON);
    match(state, TokenType.COMMA);
    
    fields.push({
      kind: 'MetaField',
      name: fieldName.lexeme,
      value,
      span: makeSpan(fieldName, previous(state)),
    });
  }
  
  consume(state, TokenType.RIGHT_BRACE, "Expected '}' after meta block");
  
  return {
    kind: 'MetaBlock',
    fields,
    span: makeSpan(start, previous(state)),
  };
}

function parseInputsBlock(state: ParserState): AST.InputsBlock {
  const start = previous(state);
  consume(state, TokenType.LEFT_BRACE, "Expected '{' after 'inputs'");
  
  const ports: AST.PortDeclaration[] = [];
  
  while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
    ports.push(parsePortDeclaration(state));
  }
  
  consume(state, TokenType.RIGHT_BRACE, "Expected '}' after inputs block");
  
  return {
    kind: 'InputsBlock',
    ports,
    span: makeSpan(start, previous(state)),
  };
}

function parseOutputsBlock(state: ParserState): AST.OutputsBlock {
  const start = previous(state);
  consume(state, TokenType.LEFT_BRACE, "Expected '{' after 'outputs'");
  
  const ports: AST.PortDeclaration[] = [];
  
  while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
    ports.push(parsePortDeclaration(state));
  }
  
  consume(state, TokenType.RIGHT_BRACE, "Expected '}' after outputs block");
  
  return {
    kind: 'OutputsBlock',
    ports,
    span: makeSpan(start, previous(state)),
  };
}

function parsePortDeclaration(state: ParserState): AST.PortDeclaration {
  const start = peek(state);
  const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected port name');
  consume(state, TokenType.COLON, "Expected ':' after port name");
  const type = parseType(state);
  
  let defaultValue: AST.Expression | undefined;
  if (match(state, TokenType.EQUAL)) {
    defaultValue = parseExpression(state);
  }
  
  match(state, TokenType.SEMICOLON);
  match(state, TokenType.COMMA);
  
  return makeNode({
    kind: 'PortDeclaration' as const,
    name: nameToken.lexeme,
    type,
    defaultValue,
    span: makeSpan(start, previous(state)),
  });
}

function parseParamsBlock(state: ParserState): AST.ParamsBlock {
  const start = previous(state);
  consume(state, TokenType.LEFT_BRACE, "Expected '{' after 'params'");
  
  const params: AST.ParamDeclaration[] = [];
  
  while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
    params.push(parseParamDeclaration(state));
  }
  
  consume(state, TokenType.RIGHT_BRACE, "Expected '}' after params block");
  
  return {
    kind: 'ParamsBlock',
    params,
    span: makeSpan(start, previous(state)),
  };
}

function parseParamDeclaration(state: ParserState): AST.ParamDeclaration {
  const start = peek(state);
  const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected parameter name');
  consume(state, TokenType.COLON, "Expected ':' after parameter name");
  const type = parseType(state);
  consume(state, TokenType.EQUAL, "Expected '=' for default value");
  const defaultValue = parseExpression(state);
  
  // Optional param options block
  let options: AST.ParamOptions | undefined;
  if (match(state, TokenType.LEFT_BRACE)) {
    options = {};
    
    while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
      const optName = consume(state, TokenType.IDENTIFIER, 'Expected option name').lexeme;
      consume(state, TokenType.COLON, "Expected ':' after option name");
      const optValue = parseExpression(state);
      match(state, TokenType.COMMA);
      
      // Extract option value
      if (optName === 'min' && optValue.kind === 'NumberLiteral') {
        (options as { min: number }).min = optValue.value;
      } else if (optName === 'max' && optValue.kind === 'NumberLiteral') {
        (options as { max: number }).max = optValue.value;
      } else if (optName === 'step' && optValue.kind === 'NumberLiteral') {
        (options as { step: number }).step = optValue.value;
      } else if (optName === 'unit' && optValue.kind === 'StringLiteral') {
        (options as { unit: string }).unit = optValue.value;
      } else if (optName === 'label' && optValue.kind === 'StringLiteral') {
        (options as { label: string }).label = optValue.value;
      } else if (optName === 'description' && optValue.kind === 'StringLiteral') {
        (options as { description: string }).description = optValue.value;
      } else if (optName === 'automatable' && optValue.kind === 'BooleanLiteral') {
        (options as { automatable: boolean }).automatable = optValue.value;
      } else if (optName === 'group' && optValue.kind === 'StringLiteral') {
        (options as { group: string }).group = optValue.value;
      } else if (optName === 'options' && optValue.kind === 'ArrayLiteral') {
        (options as { options: readonly AST.Expression[] }).options = optValue.elements;
      }
    }
    
    consume(state, TokenType.RIGHT_BRACE, "Expected '}' after param options");
  }
  
  match(state, TokenType.SEMICOLON);
  match(state, TokenType.COMMA);
  
  return makeNode({
    kind: 'ParamDeclaration' as const,
    name: nameToken.lexeme,
    type,
    defaultValue,
    options,
    span: makeSpan(start, previous(state)),
  });
}

function parseStateBlock(state: ParserState): AST.StateBlock {
  const start = previous(state);
  consume(state, TokenType.LEFT_BRACE, "Expected '{' after 'state'");
  
  const fields: AST.StateFieldDeclaration[] = [];
  
  while (!check(state, TokenType.RIGHT_BRACE) && !isAtEnd(state)) {
    const fieldStart = peek(state);
    const nameToken = consume(state, TokenType.IDENTIFIER, 'Expected field name');
    consume(state, TokenType.COLON, "Expected ':' after field name");
    const type = parseType(state);
    
    let initializer: AST.Expression | undefined;
    if (match(state, TokenType.EQUAL)) {
      initializer = parseExpression(state);
    }
    
    match(state, TokenType.SEMICOLON);
    match(state, TokenType.COMMA);
    
    fields.push(makeNode({
      kind: 'StateFieldDeclaration' as const,
      name: nameToken.lexeme,
      type,
      initializer,
      span: makeSpan(fieldStart, previous(state)),
    }));
  }
  
  consume(state, TokenType.RIGHT_BRACE, "Expected '}' after state block");
  
  return {
    kind: 'StateBlock',
    fields,
    span: makeSpan(start, previous(state)),
  };
}

function parseProcessBlock(state: ParserState): AST.ProcessBlock {
  const start = previous(state);
  consume(state, TokenType.LEFT_PAREN, "Expected '(' after 'process'");
  
  const params: AST.Parameter[] = [];
  if (!check(state, TokenType.RIGHT_PAREN)) {
    do {
      const paramName = consume(state, TokenType.IDENTIFIER, 'Expected parameter name');
      consume(state, TokenType.COLON, "Expected ':' after parameter name");
      const paramType = parseType(state);
      params.push({ name: paramName.lexeme, type: paramType });
    } while (match(state, TokenType.COMMA));
  }
  
  consume(state, TokenType.RIGHT_PAREN, "Expected ')' after process parameters");
  const body = parseBlock(state);
  
  return {
    kind: 'ProcessBlock',
    params,
    body,
    span: makeSpan(start, previous(state)),
  };
}

function parseOnBlock(state: ParserState): AST.OnBlock {
  const start = previous(state);
  
  let event: string;
  if (check(state, TokenType.STRING)) {
    event = advance(state).value as string;
  } else {
    event = consume(state, TokenType.IDENTIFIER, 'Expected event name').lexeme;
  }
  
  let params: AST.Parameter[] | undefined;
  if (match(state, TokenType.LEFT_PAREN)) {
    params = [];
    if (!check(state, TokenType.RIGHT_PAREN)) {
      do {
        const paramName = consume(state, TokenType.IDENTIFIER, 'Expected parameter name');
        consume(state, TokenType.COLON, "Expected ':' after parameter name");
        const paramType = parseType(state);
        params.push({ name: paramName.lexeme, type: paramType });
      } while (match(state, TokenType.COMMA));
    }
    consume(state, TokenType.RIGHT_PAREN, "Expected ')' after event parameters");
  }
  
  const body = parseBlock(state);
  
  return makeNode({
    kind: 'OnBlock' as const,
    event,
    params,
    body,
    span: makeSpan(start, previous(state)),
  });
}

// ============================================================================
// PROGRAM PARSING
// ============================================================================

function parseDeclaration(state: ParserState): AST.Declaration | AST.Statement {
  try {
    if (match(state, TokenType.EXPORT)) {
      if (match(state, TokenType.CARD)) {
        return parseCardDeclaration(state, true);
      } else if (match(state, TokenType.FN)) {
        return parseFunctionDeclaration(state, true);
      } else if (match(state, TokenType.CONST)) {
        return parseConstDeclaration(state, true);
      } else if (match(state, TokenType.TYPE)) {
        return parseTypeDeclaration(state, true);
      } else {
        throw error(state, peek(state), "Expected 'card', 'fn', 'const', or 'type' after 'export'");
      }
    }
    
    if (match(state, TokenType.CARD)) {
      return parseCardDeclaration(state, false);
    }
    
    if (match(state, TokenType.FN)) {
      return parseFunctionDeclaration(state, false);
    }
    
    if (match(state, TokenType.CONST)) {
      return parseConstDeclaration(state, false);
    }
    
    if (match(state, TokenType.TYPE)) {
      return parseTypeDeclaration(state, false);
    }
    
    if (match(state, TokenType.IMPORT)) {
      return parseImportDeclaration(state);
    }
    
    return parseStatement(state);
  } catch (e) {
    synchronize(state);
    throw e;
  }
}

function parseProgram(state: ParserState, sourceFile?: string): AST.Program {
  const start = peek(state);
  const body: (AST.Declaration | AST.Statement)[] = [];
  
  while (!isAtEnd(state)) {
    try {
      body.push(parseDeclaration(state));
    } catch (e) {
      // Error already recorded, continue parsing
    }
  }
  
  return makeNode({
    kind: 'Program' as const,
    body,
    sourceFile,
    span: makeSpan(start, previous(state)),
  });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Parser result.
 */
export interface ParseResult {
  /** Parsed AST */
  readonly ast: AST.Program;
  /** Parser errors */
  readonly errors: readonly ParserError[];
  /** Lexer errors */
  readonly lexerErrors: readonly LexerError[];
  /** Whether parsing succeeded */
  readonly success: boolean;
}

/**
 * Parses CardScript source code into an AST.
 */
export function parse(source: string, file?: string): ParseResult {
  // Tokenize
  const lexResult = tokenize(source, file !== undefined ? { file } : {});
  
  // Parse
  const state = createParserState(lexResult.tokens);
  const ast = parseProgram(state, file);
  
  return Object.freeze({
    ast,
    errors: Object.freeze(state.errors),
    lexerErrors: lexResult.errors,
    success: state.errors.length === 0 && lexResult.errors.length === 0,
  });
}

/**
 * Parses a single expression.
 */
export function parseExpressionString(source: string): AST.Expression | null {
  const lexResult = tokenize(source);
  if (!lexResult.success) return null;
  
  const state = createParserState(lexResult.tokens);
  try {
    return parseExpression(state);
  } catch {
    return null;
  }
}

/**
 * Parses a single type.
 */
export function parseTypeString(source: string): AST.TypeNode | null {
  const lexResult = tokenize(source);
  if (!lexResult.success) return null;
  
  const state = createParserState(lexResult.tokens);
  try {
    return parseType(state);
  } catch {
    return null;
  }
}
