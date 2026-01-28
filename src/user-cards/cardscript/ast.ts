/**
 * @fileoverview CardScript Abstract Syntax Tree (AST) Definitions.
 * 
 * Defines all AST node types for the CardScript language.
 * 
 * @module @cardplay/user-cards/cardscript/ast
 */

import type { SourceSpan } from './grammar';

// ============================================================================
// BASE NODE
// ============================================================================

/**
 * AST node kinds.
 */
export type NodeKind =
  // Program
  | 'Program'
  // Declarations
  | 'CardDeclaration'
  | 'FunctionDeclaration'
  | 'ConstDeclaration'
  | 'LetDeclaration'
  | 'TypeDeclaration'
  | 'ImportDeclaration'
  | 'ExportDeclaration'
  // Card members
  | 'MetaBlock'
  | 'InputsBlock'
  | 'OutputsBlock'
  | 'ParamsBlock'
  | 'StateBlock'
  | 'ProcessBlock'
  | 'OnBlock'
  | 'PortDeclaration'
  | 'ParamDeclaration'
  | 'StateFieldDeclaration'
  | 'MetaField'
  // Statements
  | 'BlockStatement'
  | 'IfStatement'
  | 'ForStatement'
  | 'WhileStatement'
  | 'ReturnStatement'
  | 'BreakStatement'
  | 'ContinueStatement'
  | 'EmitStatement'
  | 'ExpressionStatement'
  // Expressions
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'TernaryExpression'
  | 'CallExpression'
  | 'MemberExpression'
  | 'IndexExpression'
  | 'AssignmentExpression'
  | 'Identifier'
  | 'NumberLiteral'
  | 'StringLiteral'
  | 'BooleanLiteral'
  | 'NullLiteral'
  | 'ArrayLiteral'
  | 'ObjectLiteral'
  | 'FunctionExpression'
  | 'AwaitExpression'
  // Types
  | 'TypeReference'
  | 'ArrayType'
  | 'OptionalType'
  | 'UnionType'
  | 'IntersectionType'
  | 'FunctionType'
  | 'ObjectType'
  | 'GenericType';

/**
 * Base AST node.
 */
export interface BaseNode {
  /** Node kind discriminator */
  readonly kind: NodeKind;
  /** Source location */
  readonly span: SourceSpan;
}

// ============================================================================
// TYPE NODES
// ============================================================================

/**
 * Type reference (e.g., `number`, `MyType`).
 */
export interface TypeReference extends BaseNode {
  readonly kind: 'TypeReference';
  readonly name: string;
}

/**
 * Array type (e.g., `number[]`).
 */
export interface ArrayType extends BaseNode {
  readonly kind: 'ArrayType';
  readonly elementType: TypeNode;
}

/**
 * Optional type (e.g., `number?`).
 */
export interface OptionalType extends BaseNode {
  readonly kind: 'OptionalType';
  readonly baseType: TypeNode;
}

/**
 * Union type (e.g., `number | string`).
 */
export interface UnionType extends BaseNode {
  readonly kind: 'UnionType';
  readonly types: readonly TypeNode[];
}

/**
 * Intersection type (e.g., `A & B`).
 */
export interface IntersectionType extends BaseNode {
  readonly kind: 'IntersectionType';
  readonly types: readonly TypeNode[];
}

/**
 * Function type (e.g., `fn(number, string) -> boolean`).
 */
export interface FunctionType extends BaseNode {
  readonly kind: 'FunctionType';
  readonly paramTypes: readonly TypeNode[];
  readonly returnType: TypeNode;
  readonly isAsync?: boolean;
}

/**
 * Object type (e.g., `{ x: number, y: string }`).
 */
export interface ObjectType extends BaseNode {
  readonly kind: 'ObjectType';
  readonly properties: readonly ObjectTypeProperty[];
}

export interface ObjectTypeProperty {
  readonly name: string;
  readonly type: TypeNode;
  readonly optional?: boolean;
}

/**
 * Generic type (e.g., `Array<number>`, `event<NotePayload>`).
 */
export interface GenericType extends BaseNode {
  readonly kind: 'GenericType';
  readonly name: string;
  readonly typeArguments: readonly TypeNode[];
}

/**
 * All type nodes.
 */
export type TypeNode =
  | TypeReference
  | ArrayType
  | OptionalType
  | UnionType
  | IntersectionType
  | FunctionType
  | ObjectType
  | GenericType;

// ============================================================================
// EXPRESSION NODES
// ============================================================================

/**
 * Identifier (e.g., `foo`, `myVar`).
 */
export interface Identifier extends BaseNode {
  readonly kind: 'Identifier';
  readonly name: string;
}

/**
 * Number literal (e.g., `42`, `3.14`, `0xFF`).
 */
export interface NumberLiteral extends BaseNode {
  readonly kind: 'NumberLiteral';
  readonly value: number;
}

/**
 * String literal (e.g., `"hello"`, `'world'`).
 */
export interface StringLiteral extends BaseNode {
  readonly kind: 'StringLiteral';
  readonly value: string;
}

/**
 * Boolean literal (`true` or `false`).
 */
export interface BooleanLiteral extends BaseNode {
  readonly kind: 'BooleanLiteral';
  readonly value: boolean;
}

/**
 * Null literal (`null`).
 */
export interface NullLiteral extends BaseNode {
  readonly kind: 'NullLiteral';
}

/**
 * Array literal (e.g., `[1, 2, 3]`).
 */
export interface ArrayLiteral extends BaseNode {
  readonly kind: 'ArrayLiteral';
  readonly elements: readonly Expression[];
}

/**
 * Object literal (e.g., `{ x: 1, y: 2 }`).
 */
export interface ObjectLiteral extends BaseNode {
  readonly kind: 'ObjectLiteral';
  readonly properties: readonly ObjectProperty[];
}

export interface ObjectProperty {
  readonly key: string | Expression;
  readonly value: Expression;
  readonly computed?: boolean;
}

/**
 * Binary expression (e.g., `a + b`, `x == y`).
 */
export interface BinaryExpression extends BaseNode {
  readonly kind: 'BinaryExpression';
  readonly operator: string;
  readonly left: Expression;
  readonly right: Expression;
}

/**
 * Unary expression (e.g., `!x`, `-y`).
 */
export interface UnaryExpression extends BaseNode {
  readonly kind: 'UnaryExpression';
  readonly operator: string;
  readonly operand: Expression;
  readonly prefix: boolean;
}

/**
 * Ternary expression (e.g., `a ? b : c`).
 */
export interface TernaryExpression extends BaseNode {
  readonly kind: 'TernaryExpression';
  readonly condition: Expression;
  readonly consequent: Expression;
  readonly alternate: Expression;
}

/**
 * Call expression (e.g., `foo(1, 2)`).
 */
export interface CallExpression extends BaseNode {
  readonly kind: 'CallExpression';
  readonly callee: Expression;
  readonly arguments: readonly Expression[];
}

/**
 * Member expression (e.g., `obj.prop`).
 */
export interface MemberExpression extends BaseNode {
  readonly kind: 'MemberExpression';
  readonly object: Expression;
  readonly property: string;
}

/**
 * Index expression (e.g., `arr[0]`).
 */
export interface IndexExpression extends BaseNode {
  readonly kind: 'IndexExpression';
  readonly object: Expression;
  readonly index: Expression;
}

/**
 * Assignment expression (e.g., `x = 1`, `a += b`).
 */
export interface AssignmentExpression extends BaseNode {
  readonly kind: 'AssignmentExpression';
  readonly operator: string;
  readonly target: Expression;
  readonly value: Expression;
}

/**
 * Function expression (e.g., `fn(x) -> number { return x * 2 }`).
 */
export interface FunctionExpression extends BaseNode {
  readonly kind: 'FunctionExpression';
  readonly params: readonly Parameter[];
  readonly returnType?: TypeNode;
  readonly body: BlockStatement;
  readonly isAsync?: boolean;
}

/**
 * Await expression (e.g., `await fetchData()`).
 */
export interface AwaitExpression extends BaseNode {
  readonly kind: 'AwaitExpression';
  readonly argument: Expression;
}

/**
 * All expression nodes.
 */
export type Expression =
  | Identifier
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayLiteral
  | ObjectLiteral
  | BinaryExpression
  | UnaryExpression
  | TernaryExpression
  | CallExpression
  | MemberExpression
  | IndexExpression
  | AssignmentExpression
  | FunctionExpression
  | AwaitExpression;

// ============================================================================
// STATEMENT NODES
// ============================================================================

/**
 * Block statement (e.g., `{ ... }`).
 */
export interface BlockStatement extends BaseNode {
  readonly kind: 'BlockStatement';
  readonly body: readonly Statement[];
}

/**
 * If statement.
 */
export interface IfStatement extends BaseNode {
  readonly kind: 'IfStatement';
  readonly condition: Expression;
  readonly consequent: BlockStatement;
  readonly alternate?: BlockStatement | IfStatement;
}

/**
 * For-in loop statement.
 */
export interface ForStatement extends BaseNode {
  readonly kind: 'ForStatement';
  readonly variable: string;
  readonly iterable: Expression;
  readonly body: BlockStatement;
}

/**
 * While loop statement.
 */
export interface WhileStatement extends BaseNode {
  readonly kind: 'WhileStatement';
  readonly condition: Expression;
  readonly body: BlockStatement;
}

/**
 * Return statement.
 */
export interface ReturnStatement extends BaseNode {
  readonly kind: 'ReturnStatement';
  readonly argument?: Expression;
}

/**
 * Break statement.
 */
export interface BreakStatement extends BaseNode {
  readonly kind: 'BreakStatement';
}

/**
 * Continue statement.
 */
export interface ContinueStatement extends BaseNode {
  readonly kind: 'ContinueStatement';
}

/**
 * Emit statement (e.g., `emit output(value);`).
 */
export interface EmitStatement extends BaseNode {
  readonly kind: 'EmitStatement';
  readonly port: string;
  readonly value: Expression;
}

/**
 * Expression statement.
 */
export interface ExpressionStatement extends BaseNode {
  readonly kind: 'ExpressionStatement';
  readonly expression: Expression;
}

/**
 * All statement nodes.
 */
export type Statement =
  | BlockStatement
  | IfStatement
  | ForStatement
  | WhileStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | EmitStatement
  | ExpressionStatement
  | Declaration;

// ============================================================================
// DECLARATION NODES
// ============================================================================

/**
 * Function parameter.
 */
export interface Parameter {
  readonly name: string;
  readonly type: TypeNode;
  readonly defaultValue?: Expression;
}

/**
 * Type parameter (for generics).
 */
export interface TypeParameter {
  readonly name: string;
  readonly constraint?: TypeNode;
  readonly defaultType?: TypeNode;
}

/**
 * Function declaration.
 */
export interface FunctionDeclaration extends BaseNode {
  readonly kind: 'FunctionDeclaration';
  readonly name: string;
  readonly typeParams?: readonly TypeParameter[];
  readonly params: readonly Parameter[];
  readonly returnType?: TypeNode;
  readonly body: BlockStatement;
  readonly isAsync?: boolean;
  readonly exported?: boolean;
}

/**
 * Const declaration (immutable binding).
 */
export interface ConstDeclaration extends BaseNode {
  readonly kind: 'ConstDeclaration';
  readonly name: string;
  readonly type?: TypeNode;
  readonly initializer: Expression;
  readonly exported?: boolean;
}

/**
 * Let declaration (mutable binding).
 */
export interface LetDeclaration extends BaseNode {
  readonly kind: 'LetDeclaration';
  readonly name: string;
  readonly type?: TypeNode;
  readonly initializer?: Expression;
}

/**
 * Type declaration (type alias).
 */
export interface TypeDeclaration extends BaseNode {
  readonly kind: 'TypeDeclaration';
  readonly name: string;
  readonly typeParams?: readonly TypeParameter[];
  readonly type: TypeNode;
  readonly exported?: boolean;
}

/**
 * Import specifier.
 */
export interface ImportSpecifier {
  readonly imported: string;
  readonly local: string;
}

/**
 * Import declaration.
 */
export interface ImportDeclaration extends BaseNode {
  readonly kind: 'ImportDeclaration';
  readonly specifiers: readonly ImportSpecifier[];
  readonly source: string;
  readonly isNamespace?: boolean;
  readonly namespaceAlias?: string;
}

/**
 * Export specifier.
 */
export interface ExportSpecifier {
  readonly local: string;
  readonly exported: string;
}

/**
 * Export declaration.
 */
export interface ExportDeclaration extends BaseNode {
  readonly kind: 'ExportDeclaration';
  readonly declaration?: Declaration;
  readonly specifiers?: readonly ExportSpecifier[];
  readonly source?: string;
}

// ============================================================================
// CARD DECLARATION NODES
// ============================================================================

/**
 * Meta field in card meta block.
 */
export interface MetaField extends BaseNode {
  readonly kind: 'MetaField';
  readonly name: string;
  readonly value: Expression;
}

/**
 * Meta block in card declaration.
 */
export interface MetaBlock extends BaseNode {
  readonly kind: 'MetaBlock';
  readonly fields: readonly MetaField[];
}

/**
 * Port declaration in inputs/outputs block.
 */
export interface PortDeclaration extends BaseNode {
  readonly kind: 'PortDeclaration';
  readonly name: string;
  readonly type: TypeNode;
  readonly defaultValue?: Expression;
  readonly optional?: boolean;
  readonly label?: string;
  readonly description?: string;
}

/**
 * Inputs block in card declaration.
 */
export interface InputsBlock extends BaseNode {
  readonly kind: 'InputsBlock';
  readonly ports: readonly PortDeclaration[];
}

/**
 * Outputs block in card declaration.
 */
export interface OutputsBlock extends BaseNode {
  readonly kind: 'OutputsBlock';
  readonly ports: readonly PortDeclaration[];
}

/**
 * Parameter options.
 */
export interface ParamOptions {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;
  readonly label?: string;
  readonly description?: string;
  readonly automatable?: boolean;
  readonly group?: string;
  readonly options?: readonly Expression[];
}

/**
 * Parameter declaration in params block.
 */
export interface ParamDeclaration extends BaseNode {
  readonly kind: 'ParamDeclaration';
  readonly name: string;
  readonly type: TypeNode;
  readonly defaultValue: Expression;
  readonly options?: ParamOptions;
}

/**
 * Params block in card declaration.
 */
export interface ParamsBlock extends BaseNode {
  readonly kind: 'ParamsBlock';
  readonly params: readonly ParamDeclaration[];
}

/**
 * State field declaration in state block.
 */
export interface StateFieldDeclaration extends BaseNode {
  readonly kind: 'StateFieldDeclaration';
  readonly name: string;
  readonly type: TypeNode;
  readonly initializer?: Expression;
}

/**
 * State block in card declaration.
 */
export interface StateBlock extends BaseNode {
  readonly kind: 'StateBlock';
  readonly fields: readonly StateFieldDeclaration[];
}

/**
 * Process block in card declaration.
 */
export interface ProcessBlock extends BaseNode {
  readonly kind: 'ProcessBlock';
  readonly params: readonly Parameter[];
  readonly body: BlockStatement;
}

/**
 * On block (event handler) in card declaration.
 */
export interface OnBlock extends BaseNode {
  readonly kind: 'OnBlock';
  readonly event: string;
  readonly params?: readonly Parameter[];
  readonly body: BlockStatement;
}

/**
 * Card member types.
 */
export type CardMember =
  | MetaBlock
  | InputsBlock
  | OutputsBlock
  | ParamsBlock
  | StateBlock
  | ProcessBlock
  | OnBlock
  | FunctionDeclaration;

/**
 * Card declaration.
 */
export interface CardDeclaration extends BaseNode {
  readonly kind: 'CardDeclaration';
  readonly name: string;
  readonly typeParams?: readonly TypeParameter[];
  readonly members: readonly CardMember[];
  readonly exported?: boolean;
}

/**
 * All declaration nodes.
 */
export type Declaration =
  | CardDeclaration
  | FunctionDeclaration
  | ConstDeclaration
  | LetDeclaration
  | TypeDeclaration
  | ImportDeclaration
  | ExportDeclaration;

// ============================================================================
// PROGRAM NODE
// ============================================================================

/**
 * Program (root node).
 */
export interface Program extends BaseNode {
  readonly kind: 'Program';
  readonly body: readonly (Declaration | Statement)[];
  readonly sourceFile?: string;
}

/**
 * All AST nodes.
 */
export type ASTNode =
  | Program
  | Declaration
  | Statement
  | Expression
  | TypeNode
  | CardMember
  | MetaField
  | PortDeclaration
  | ParamDeclaration
  | StateFieldDeclaration;

// ============================================================================
// AST UTILITIES
// ============================================================================

/**
 * Visitor function type.
 */
export type Visitor<T = void> = {
  [K in NodeKind]?: (node: Extract<ASTNode, { kind: K }>) => T;
};

/**
 * Traverses the AST depth-first, calling visitor functions.
 */
export function traverse(node: ASTNode, visitor: Visitor): void {
  const visit = visitor[node.kind as keyof Visitor];
  if (visit) {
    (visit as (node: ASTNode) => void)(node);
  }
  
  // Visit children based on node kind
  switch (node.kind) {
    case 'Program':
      for (const child of node.body) {
        traverse(child, visitor);
      }
      break;
      
    case 'CardDeclaration':
      for (const member of node.members) {
        traverse(member as ASTNode, visitor);
      }
      break;
      
    case 'FunctionDeclaration':
    case 'FunctionExpression':
      if ('returnType' in node && node.returnType) traverse(node.returnType, visitor);
      traverse(node.body, visitor);
      break;
      
    case 'BlockStatement':
      for (const stmt of node.body) {
        traverse(stmt, visitor);
      }
      break;
      
    case 'IfStatement':
      traverse(node.condition, visitor);
      traverse(node.consequent, visitor);
      if (node.alternate) traverse(node.alternate, visitor);
      break;
      
    case 'ForStatement':
    case 'WhileStatement':
      if ('iterable' in node) traverse(node.iterable, visitor);
      if ('condition' in node) traverse(node.condition, visitor);
      traverse(node.body, visitor);
      break;
      
    case 'ReturnStatement':
      if (node.argument) traverse(node.argument, visitor);
      break;
      
    case 'EmitStatement':
      traverse(node.value, visitor);
      break;
      
    case 'ExpressionStatement':
      traverse(node.expression, visitor);
      break;
      
    case 'BinaryExpression':
      traverse(node.left, visitor);
      traverse(node.right, visitor);
      break;
      
    case 'UnaryExpression':
      traverse(node.operand, visitor);
      break;
      
    case 'TernaryExpression':
      traverse(node.condition, visitor);
      traverse(node.consequent, visitor);
      traverse(node.alternate, visitor);
      break;
      
    case 'CallExpression':
      traverse(node.callee, visitor);
      for (const arg of node.arguments) {
        traverse(arg, visitor);
      }
      break;
      
    case 'MemberExpression':
      traverse(node.object, visitor);
      break;
      
    case 'IndexExpression':
      traverse(node.object, visitor);
      traverse(node.index, visitor);
      break;
      
    case 'AssignmentExpression':
      traverse(node.target, visitor);
      traverse(node.value, visitor);
      break;
      
    case 'ArrayLiteral':
      for (const elem of node.elements) {
        traverse(elem, visitor);
      }
      break;
      
    case 'ObjectLiteral':
      for (const prop of node.properties) {
        if (typeof prop.key !== 'string') traverse(prop.key, visitor);
        traverse(prop.value, visitor);
      }
      break;
      
    case 'AwaitExpression':
      traverse(node.argument, visitor);
      break;
      
    case 'ConstDeclaration':
    case 'LetDeclaration':
      if (node.type) traverse(node.type, visitor);
      if ('initializer' in node && node.initializer) traverse(node.initializer, visitor);
      break;
      
    case 'ArrayType':
      traverse(node.elementType, visitor);
      break;
      
    case 'OptionalType':
      traverse(node.baseType, visitor);
      break;
      
    case 'UnionType':
    case 'IntersectionType':
      for (const t of node.types) {
        traverse(t, visitor);
      }
      break;
      
    case 'FunctionType':
      for (const t of node.paramTypes) {
        traverse(t, visitor);
      }
      traverse(node.returnType, visitor);
      break;
      
    case 'GenericType':
      for (const t of node.typeArguments) {
        traverse(t, visitor);
      }
      break;
      
    // Leaf nodes - no children to visit
    case 'Identifier':
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'TypeReference':
    case 'BreakStatement':
    case 'ContinueStatement':
      break;
  }
}

/**
 * Transforms the AST by calling transformer functions.
 */
export function transform<T extends ASTNode>(
  node: T,
  transformer: Visitor<ASTNode | null>
): T | null {
  const visit = transformer[node.kind as keyof Visitor<ASTNode | null>];
  if (visit) {
    const result = (visit as (node: T) => ASTNode | null)(node);
    if (result === null) return null;
    return result as T;
  }
  return node;
}

/**
 * Pretty-prints an AST node.
 */
export function printAST(node: ASTNode, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  let result = `${pad}${node.kind}`;
  
  switch (node.kind) {
    case 'Identifier':
      result += ` "${node.name}"`;
      break;
    case 'NumberLiteral':
      result += ` ${node.value}`;
      break;
    case 'StringLiteral':
      result += ` "${node.value}"`;
      break;
    case 'BooleanLiteral':
      result += ` ${node.value}`;
      break;
    case 'BinaryExpression':
      result += ` (${node.operator})`;
      break;
    case 'UnaryExpression':
      result += ` (${node.operator})`;
      break;
    case 'TypeReference':
      result += ` "${node.name}"`;
      break;
    case 'CardDeclaration':
    case 'FunctionDeclaration':
      result += ` "${node.name}"`;
      break;
  }
  
  result += '\n';
  
  // Print children
  switch (node.kind) {
    case 'Program':
      for (const child of node.body) {
        result += printAST(child, indent + 1);
      }
      break;
    case 'BinaryExpression':
      result += printAST(node.left, indent + 1);
      result += printAST(node.right, indent + 1);
      break;
    case 'UnaryExpression':
      result += printAST(node.operand, indent + 1);
      break;
    case 'CallExpression':
      result += printAST(node.callee, indent + 1);
      for (const arg of node.arguments) {
        result += printAST(arg, indent + 1);
      }
      break;
    case 'BlockStatement':
      for (const stmt of node.body) {
        result += printAST(stmt, indent + 1);
      }
      break;
    case 'ArrayLiteral':
      for (const elem of node.elements) {
        result += printAST(elem, indent + 1);
      }
      break;
  }
  
  return result;
}
