/**
 * @fileoverview CardScript Type System.
 * 
 * Provides type checking for CardScript programs with audio/music-specific
 * types and low-latency constraints.
 * 
 * @module @cardplay/user-cards/cardscript/types
 */

import type * as AST from './ast';
import type { SourceSpan } from './grammar';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Base type interface.
 */
export interface Type {
  readonly kind: TypeKind;
}

export type TypeKind =
  | 'primitive'
  | 'array'
  | 'optional'
  | 'union'
  | 'intersection'
  | 'function'
  | 'object'
  | 'generic'
  | 'type-param'
  | 'audio'
  | 'midi'
  | 'event'
  | 'stream'
  | 'card'
  | 'unknown'
  | 'never'
  | 'any';

/**
 * Primitive types.
 */
export interface PrimitiveType extends Type {
  readonly kind: 'primitive';
  readonly name: 'number' | 'string' | 'boolean' | 'void' | 'null';
}

/**
 * Array type.
 */
export interface ArrayType extends Type {
  readonly kind: 'array';
  readonly element: Type;
}

/**
 * Optional type (T?).
 */
export interface OptionalType extends Type {
  readonly kind: 'optional';
  readonly base: Type;
}

/**
 * Union type (A | B).
 */
export interface UnionType extends Type {
  readonly kind: 'union';
  readonly members: readonly Type[];
}

/**
 * Intersection type (A & B).
 */
export interface IntersectionType extends Type {
  readonly kind: 'intersection';
  readonly members: readonly Type[];
}

/**
 * Function type.
 */
export interface FunctionType extends Type {
  readonly kind: 'function';
  readonly params: readonly Type[];
  readonly returnType: Type;
  readonly isAsync: boolean;
}

/**
 * Object type.
 */
export interface ObjectType extends Type {
  readonly kind: 'object';
  readonly properties: ReadonlyMap<string, ObjectProperty>;
}

export interface ObjectProperty {
  readonly type: Type;
  readonly optional: boolean;
  readonly readonly: boolean;
}

/**
 * Generic type instance (e.g., Array<number>).
 */
export interface GenericType extends Type {
  readonly kind: 'generic';
  readonly name: string;
  readonly typeArgs: readonly Type[];
}

/**
 * Type parameter (for generics).
 */
export interface TypeParamType extends Type {
  readonly kind: 'type-param';
  readonly name: string;
  readonly constraint?: Type;
}

/**
 * Audio buffer type.
 */
export interface AudioType extends Type {
  readonly kind: 'audio';
  readonly channels: 1 | 2;
  readonly sampleRate?: number;
}

/**
 * MIDI message type.
 */
export interface MidiType extends Type {
  readonly kind: 'midi';
}

/**
 * Event type (parameterized by payload).
 */
export interface EventType extends Type {
  readonly kind: 'event';
  readonly payload: Type;
}

/**
 * Stream type (time-ordered events).
 */
export interface StreamType extends Type {
  readonly kind: 'stream';
  readonly element: Type;
}

/**
 * Card type.
 */
export interface CardType extends Type {
  readonly kind: 'card';
  readonly inputType: Type;
  readonly outputType: Type;
  readonly params: ReadonlyMap<string, Type>;
}

/**
 * Unknown type.
 */
export interface UnknownType extends Type {
  readonly kind: 'unknown';
}

/**
 * Never type (bottom).
 */
export interface NeverType extends Type {
  readonly kind: 'never';
}

/**
 * Any type (escape hatch).
 */
export interface AnyType extends Type {
  readonly kind: 'any';
}

/**
 * All type variants.
 */
export type TypeVariant =
  | PrimitiveType
  | ArrayType
  | OptionalType
  | UnionType
  | IntersectionType
  | FunctionType
  | ObjectType
  | GenericType
  | TypeParamType
  | AudioType
  | MidiType
  | EventType
  | StreamType
  | CardType
  | UnknownType
  | NeverType
  | AnyType;

// ============================================================================
// TYPE CONSTRUCTORS
// ============================================================================

export const Types = {
  // Primitives
  number: Object.freeze({ kind: 'primitive', name: 'number' } as PrimitiveType),
  string: Object.freeze({ kind: 'primitive', name: 'string' } as PrimitiveType),
  boolean: Object.freeze({ kind: 'primitive', name: 'boolean' } as PrimitiveType),
  void: Object.freeze({ kind: 'primitive', name: 'void' } as PrimitiveType),
  null: Object.freeze({ kind: 'primitive', name: 'null' } as PrimitiveType),
  
  // Special types
  unknown: Object.freeze({ kind: 'unknown' } as UnknownType),
  never: Object.freeze({ kind: 'never' } as NeverType),
  any: Object.freeze({ kind: 'any' } as AnyType),
  
  // Audio types
  audio: Object.freeze({ kind: 'audio', channels: 2 } as AudioType),
  audioMono: Object.freeze({ kind: 'audio', channels: 1 } as AudioType),
  midi: Object.freeze({ kind: 'midi' } as MidiType),
  
  // Factory functions
  array: (element: Type): ArrayType => Object.freeze({ kind: 'array', element }),
  optional: (base: Type): OptionalType => Object.freeze({ kind: 'optional', base }),
  union: (...members: Type[]): UnionType => Object.freeze({ kind: 'union', members }),
  intersection: (...members: Type[]): IntersectionType => Object.freeze({ kind: 'intersection', members }),
  
  func: (params: Type[], returnType: Type, isAsync = false): FunctionType =>
    Object.freeze({ kind: 'function', params, returnType, isAsync }),
  
  object: (props: Record<string, Type | { type: Type; optional?: boolean; readonly?: boolean }>): ObjectType => {
    const properties = new Map<string, ObjectProperty>();
    for (const [key, value] of Object.entries(props)) {
      if ('type' in value) {
        properties.set(key, {
          type: value.type,
          optional: value.optional ?? false,
          readonly: value.readonly ?? false,
        });
      } else {
        properties.set(key, { type: value, optional: false, readonly: false });
      }
    }
    return Object.freeze({ kind: 'object', properties });
  },
  
  generic: (name: string, typeArgs: Type[]): GenericType =>
    Object.freeze({ kind: 'generic', name, typeArgs }),
  
  typeParam: (name: string, constraint?: Type): TypeParamType =>
    constraint !== undefined
      ? Object.freeze({ kind: 'type-param', name, constraint })
      : Object.freeze({ kind: 'type-param', name }) as TypeParamType,
  
  event: (payload: Type): EventType => Object.freeze({ kind: 'event', payload }),
  stream: (element: Type): StreamType => Object.freeze({ kind: 'stream', element }),
  
  card: (inputType: Type, outputType: Type, params: Record<string, Type> = {}): CardType =>
    Object.freeze({ kind: 'card', inputType, outputType, params: new Map(Object.entries(params)) }),
} as const;

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Checks if two types are equal.
 */
export function typeEquals(a: Type, b: Type): boolean {
  if (a.kind !== b.kind) return false;
  
  switch (a.kind) {
    case 'primitive':
      return (a as PrimitiveType).name === (b as PrimitiveType).name;
      
    case 'array':
      return typeEquals((a as ArrayType).element, (b as ArrayType).element);
      
    case 'optional':
      return typeEquals((a as OptionalType).base, (b as OptionalType).base);
      
    case 'union':
    case 'intersection': {
      const aMembers = (a as UnionType | IntersectionType).members;
      const bMembers = (b as UnionType | IntersectionType).members;
      if (aMembers.length !== bMembers.length) return false;
      return aMembers.every((t, i) => typeEquals(t, bMembers[i]!));
    }
    
    case 'function': {
      const af = a as FunctionType;
      const bf = b as FunctionType;
      if (af.params.length !== bf.params.length) return false;
      if (af.isAsync !== bf.isAsync) return false;
      if (!typeEquals(af.returnType, bf.returnType)) return false;
      return af.params.every((t, i) => typeEquals(t, bf.params[i]!));
    }
    
    case 'object': {
      const ao = a as ObjectType;
      const bo = b as ObjectType;
      if (ao.properties.size !== bo.properties.size) return false;
      const entries = Array.from(ao.properties.entries());
      for (const [key, prop] of entries) {
        const bProp = bo.properties.get(key);
        if (!bProp) return false;
        if (!typeEquals(prop.type, bProp.type)) return false;
        if (prop.optional !== bProp.optional) return false;
      }
      return true;
    }
    
    case 'generic': {
      const ag = a as GenericType;
      const bg = b as GenericType;
      if (ag.name !== bg.name) return false;
      if (ag.typeArgs.length !== bg.typeArgs.length) return false;
      return ag.typeArgs.every((t, i) => typeEquals(t, bg.typeArgs[i]!));
    }
    
    case 'type-param':
      return (a as TypeParamType).name === (b as TypeParamType).name;
      
    case 'audio':
      return (a as AudioType).channels === (b as AudioType).channels;
      
    case 'event':
      return typeEquals((a as EventType).payload, (b as EventType).payload);
      
    case 'stream':
      return typeEquals((a as StreamType).element, (b as StreamType).element);
      
    case 'card': {
      const ac = a as CardType;
      const bc = b as CardType;
      return typeEquals(ac.inputType, bc.inputType) && typeEquals(ac.outputType, bc.outputType);
    }
    
    case 'midi':
    case 'unknown':
    case 'never':
    case 'any':
      return true;
      
    default:
      return false;
  }
}

/**
 * Checks if type A is assignable to type B.
 */
export function isAssignableTo(a: Type, b: Type): boolean {
  // Any is assignable to/from anything
  if (a.kind === 'any' || b.kind === 'any') return true;
  
  // Never is assignable to anything
  if (a.kind === 'never') return true;
  
  // Nothing is assignable to never
  if (b.kind === 'never') return false;
  
  // Unknown accepts anything
  if (b.kind === 'unknown') return true;
  
  // Equal types are assignable
  if (typeEquals(a, b)) return true;
  
  // Null is assignable to optional
  if (a.kind === 'primitive' && (a as PrimitiveType).name === 'null' && b.kind === 'optional') {
    return true;
  }
  
  // T is assignable to T?
  if (b.kind === 'optional') {
    return isAssignableTo(a, (b as OptionalType).base);
  }
  
  // Union: A is assignable to (B | C) if A is assignable to B or C
  if (b.kind === 'union') {
    return (b as UnionType).members.some(m => isAssignableTo(a, m));
  }
  
  // A | B is assignable to C if both A and B are assignable to C
  if (a.kind === 'union') {
    return (a as UnionType).members.every(m => isAssignableTo(m, b));
  }
  
  // Function subtyping (contravariant params, covariant return)
  if (a.kind === 'function' && b.kind === 'function') {
    const af = a as FunctionType;
    const bf = b as FunctionType;
    
    // Async function is not assignable to sync function
    if (af.isAsync && !bf.isAsync) return false;
    
    // Check param count
    if (af.params.length !== bf.params.length) return false;
    
    // Contravariant params
    for (let i = 0; i < af.params.length; i++) {
      if (!isAssignableTo(bf.params[i]!, af.params[i]!)) return false;
    }
    
    // Covariant return
    return isAssignableTo(af.returnType, bf.returnType);
  }
  
  // Array subtyping (covariant)
  if (a.kind === 'array' && b.kind === 'array') {
    return isAssignableTo((a as ArrayType).element, (b as ArrayType).element);
  }
  
  // Object subtyping (width subtyping)
  if (a.kind === 'object' && b.kind === 'object') {
    const ao = a as ObjectType;
    const bo = b as ObjectType;
    
    const boEntries = Array.from(bo.properties.entries());
    for (const [key, bProp] of boEntries) {
      const aProp = ao.properties.get(key);
      if (!aProp) {
        if (!bProp.optional) return false;
        continue;
      }
      if (!isAssignableTo(aProp.type, bProp.type)) return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Gets the string representation of a type.
 */
export function typeToString(type: Type): string {
  switch (type.kind) {
    case 'primitive':
      return (type as PrimitiveType).name;
    case 'array':
      return `${typeToString((type as ArrayType).element)}[]`;
    case 'optional':
      return `${typeToString((type as OptionalType).base)}?`;
    case 'union':
      return (type as UnionType).members.map(typeToString).join(' | ');
    case 'intersection':
      return (type as IntersectionType).members.map(typeToString).join(' & ');
    case 'function': {
      const f = type as FunctionType;
      const params = f.params.map(typeToString).join(', ');
      const async = f.isAsync ? 'async ' : '';
      return `${async}fn(${params}) -> ${typeToString(f.returnType)}`;
    }
    case 'object': {
      const props = Array.from((type as ObjectType).properties.entries())
        .map(([k, v]) => `${k}${v.optional ? '?' : ''}: ${typeToString(v.type)}`)
        .join(', ');
      return `{ ${props} }`;
    }
    case 'generic': {
      const g = type as GenericType;
      return `${g.name}<${g.typeArgs.map(typeToString).join(', ')}>`;
    }
    case 'type-param':
      return (type as TypeParamType).name;
    case 'audio':
      return (type as AudioType).channels === 1 ? 'audio<mono>' : 'audio';
    case 'midi':
      return 'midi';
    case 'event':
      return `event<${typeToString((type as EventType).payload)}>`;
    case 'stream':
      return `stream<${typeToString((type as StreamType).element)}>`;
    case 'card': {
      const c = type as CardType;
      return `card<${typeToString(c.inputType)}, ${typeToString(c.outputType)}>`;
    }
    case 'unknown':
      return 'unknown';
    case 'never':
      return 'never';
    case 'any':
      return 'any';
    default:
      return 'unknown';
  }
}

// ============================================================================
// TYPE CHECKER
// ============================================================================

/**
 * Type error.
 */
export interface TypeError {
  readonly message: string;
  readonly span: SourceSpan;
  readonly severity: 'error' | 'warning';
}

/**
 * Type checking context.
 */
export interface TypeContext {
  /** Variable types */
  readonly variables: Map<string, Type>;
  /** Type aliases */
  readonly types: Map<string, Type>;
  /** Card types */
  readonly cards: Map<string, CardType>;
  /** Current function return type */
  readonly returnType?: Type;
  /** Whether we're in async context */
  readonly isAsync: boolean;
  /** Parent context for scoping */
  readonly parent?: TypeContext;
}

/**
 * Creates a new type context.
 */
export function createTypeContext(parent?: TypeContext): TypeContext {
  return {
    variables: new Map(),
    types: new Map(),
    cards: new Map(),
    isAsync: parent?.isAsync ?? false,
    ...(parent !== undefined ? { parent } : {}),
  };
}

/**
 * Looks up a variable type in the context chain.
 */
export function lookupVariable(ctx: TypeContext, name: string): Type | undefined {
  const local = ctx.variables.get(name);
  if (local) return local;
  if (ctx.parent) return lookupVariable(ctx.parent, name);
  return undefined;
}

/**
 * Looks up a type alias in the context chain.
 */
export function lookupType(ctx: TypeContext, name: string): Type | undefined {
  const local = ctx.types.get(name);
  if (local) return local;
  if (ctx.parent) return lookupType(ctx.parent, name);
  return undefined;
}

/**
 * Type checker result.
 */
export interface TypeCheckResult {
  readonly errors: readonly TypeError[];
  readonly types: ReadonlyMap<AST.ASTNode, Type>;
  readonly success: boolean;
}

/**
 * Type checks a CardScript program.
 */
export function typeCheck(program: AST.Program): TypeCheckResult {
  const errors: TypeError[] = [];
  const nodeTypes = new Map<AST.ASTNode, Type>();
  
  const globalCtx = createTypeContext();
  
  // Add built-in types
  globalCtx.types.set('number', Types.number);
  globalCtx.types.set('string', Types.string);
  globalCtx.types.set('boolean', Types.boolean);
  globalCtx.types.set('void', Types.void);
  globalCtx.types.set('audio', Types.audio);
  globalCtx.types.set('midi', Types.midi);
  
  // Add built-in functions
  globalCtx.variables.set('print', Types.func([Types.any], Types.void));
  globalCtx.variables.set('abs', Types.func([Types.number], Types.number));
  globalCtx.variables.set('sin', Types.func([Types.number], Types.number));
  globalCtx.variables.set('cos', Types.func([Types.number], Types.number));
  globalCtx.variables.set('floor', Types.func([Types.number], Types.number));
  globalCtx.variables.set('ceil', Types.func([Types.number], Types.number));
  globalCtx.variables.set('round', Types.func([Types.number], Types.number));
  globalCtx.variables.set('min', Types.func([Types.number, Types.number], Types.number));
  globalCtx.variables.set('max', Types.func([Types.number, Types.number], Types.number));
  globalCtx.variables.set('clamp', Types.func([Types.number, Types.number, Types.number], Types.number));
  globalCtx.variables.set('random', Types.func([], Types.number));
  globalCtx.variables.set('now', Types.func([], Types.number));
  globalCtx.variables.set('len', Types.func([Types.array(Types.any)], Types.number));
  
  function addError(message: string, span: SourceSpan, severity: 'error' | 'warning' = 'error'): void {
    errors.push({ message, span, severity });
  }
  
  function resolveTypeNode(node: AST.TypeNode, ctx: TypeContext): Type {
    switch (node.kind) {
      case 'TypeReference': {
        const found = lookupType(ctx, node.name);
        if (!found) {
          addError(`Unknown type '${node.name}'`, node.span);
          return Types.unknown;
        }
        return found;
      }
      
      case 'ArrayType':
        return Types.array(resolveTypeNode(node.elementType, ctx));
        
      case 'OptionalType':
        return Types.optional(resolveTypeNode(node.baseType, ctx));
        
      case 'UnionType':
        return Types.union(...node.types.map(t => resolveTypeNode(t, ctx)));
        
      case 'IntersectionType':
        return Types.intersection(...node.types.map(t => resolveTypeNode(t, ctx)));
        
      case 'FunctionType':
        return Types.func(
          node.paramTypes.map(t => resolveTypeNode(t, ctx)),
          resolveTypeNode(node.returnType, ctx),
          node.isAsync ?? false
        );
        
      case 'ObjectType': {
        const props: Record<string, { type: Type; optional: boolean }> = {};
        for (const prop of node.properties) {
          props[prop.name] = {
            type: resolveTypeNode(prop.type, ctx),
            optional: prop.optional ?? false,
          };
        }
        return Types.object(props);
      }
      
      case 'GenericType': {
        if (node.name === 'event') {
          return Types.event(resolveTypeNode(node.typeArguments[0]!, ctx));
        }
        if (node.name === 'stream') {
          return Types.stream(resolveTypeNode(node.typeArguments[0]!, ctx));
        }
        if (node.name === 'Array') {
          return Types.array(resolveTypeNode(node.typeArguments[0]!, ctx));
        }
        return Types.generic(node.name, node.typeArguments.map(t => resolveTypeNode(t, ctx)));
      }
      
      default:
        return Types.unknown;
    }
  }
  
  function checkExpression(node: AST.Expression, ctx: TypeContext): Type {
    let type: Type;
    
    switch (node.kind) {
      case 'NumberLiteral':
        type = Types.number;
        break;
        
      case 'StringLiteral':
        type = Types.string;
        break;
        
      case 'BooleanLiteral':
        type = Types.boolean;
        break;
        
      case 'NullLiteral':
        type = Types.null;
        break;
        
      case 'Identifier': {
        const varType = lookupVariable(ctx, node.name);
        if (!varType) {
          addError(`Unknown variable '${node.name}'`, node.span);
          type = Types.unknown;
        } else {
          type = varType;
        }
        break;
      }
      
      case 'ArrayLiteral': {
        if (node.elements.length === 0) {
          type = Types.array(Types.unknown);
        } else {
          const elemTypes = node.elements.map(e => checkExpression(e, ctx));
          // Use first element type (simplified)
          type = Types.array(elemTypes[0]!);
        }
        break;
      }
      
      case 'ObjectLiteral': {
        const props: Record<string, Type> = {};
        for (const prop of node.properties) {
          const key = typeof prop.key === 'string' ? prop.key : 
            (prop.key.kind === 'StringLiteral' ? prop.key.value : 
             prop.key.kind === 'Identifier' ? prop.key.name : 'unknown');
          props[key] = checkExpression(prop.value, ctx);
        }
        type = Types.object(props);
        break;
      }
      
      case 'BinaryExpression': {
        const leftType = checkExpression(node.left, ctx);
        // Ensure right side is checked for errors even if type isn't used
        checkExpression(node.right, ctx);
        
        switch (node.operator) {
          case '+':
            if (leftType.kind === 'primitive' && (leftType as PrimitiveType).name === 'string') {
              type = Types.string;
            } else {
              type = Types.number;
            }
            break;
          case '-':
          case '*':
          case '/':
          case '%':
          case '^':
          case '&':
          case '|':
            type = Types.number;
            break;
          case '==':
          case '!=':
          case '<':
          case '<=':
          case '>':
          case '>=':
          case 'and':
          case 'or':
            type = Types.boolean;
            break;
          default:
            type = Types.unknown;
        }
        break;
      }
      
      case 'UnaryExpression': {
        const operandType = checkExpression(node.operand, ctx);
        
        switch (node.operator) {
          case '!':
            type = Types.boolean;
            break;
          case '-':
          case '~':
            type = Types.number;
            break;
          default:
            type = operandType;
        }
        break;
      }
      
      case 'TernaryExpression': {
        checkExpression(node.condition, ctx);
        const consequentType = checkExpression(node.consequent, ctx);
        const alternateType = checkExpression(node.alternate, ctx);
        type = Types.union(consequentType, alternateType);
        break;
      }
      
      case 'CallExpression': {
        const calleeType = checkExpression(node.callee, ctx);
        
        if (calleeType.kind !== 'function') {
          addError(`Cannot call non-function type '${typeToString(calleeType)}'`, node.span);
          type = Types.unknown;
        } else {
          const funcType = calleeType as FunctionType;
          
          // Check argument count
          if (node.arguments.length !== funcType.params.length) {
            addError(
              `Expected ${funcType.params.length} arguments, got ${node.arguments.length}`,
              node.span
            );
          }
          
          // Check argument types
          for (let i = 0; i < Math.min(node.arguments.length, funcType.params.length); i++) {
            const argType = checkExpression(node.arguments[i]!, ctx);
            if (!isAssignableTo(argType, funcType.params[i]!)) {
              addError(
                `Argument type '${typeToString(argType)}' is not assignable to parameter type '${typeToString(funcType.params[i]!)}'`,
                node.arguments[i]!.span
              );
            }
          }
          
          type = funcType.returnType;
        }
        break;
      }
      
      case 'MemberExpression': {
        const objectType = checkExpression(node.object, ctx);
        
        if (objectType.kind === 'object') {
          const prop = (objectType as ObjectType).properties.get(node.property);
          if (!prop) {
            addError(`Property '${node.property}' does not exist on type`, node.span);
            type = Types.unknown;
          } else {
            type = prop.type;
          }
        } else if (objectType.kind === 'array') {
          // Array methods
          if (node.property === 'length') {
            type = Types.number;
          } else if (node.property === 'push' || node.property === 'pop') {
            type = Types.func([], Types.void);
          } else {
            type = Types.unknown;
          }
        } else {
          type = Types.unknown;
        }
        break;
      }
      
      case 'IndexExpression': {
        const objectType = checkExpression(node.object, ctx);
        const indexType = checkExpression(node.index, ctx);
        
        if (objectType.kind === 'array') {
          if (indexType.kind !== 'primitive' || (indexType as PrimitiveType).name !== 'number') {
            addError('Array index must be a number', node.index.span);
          }
          type = (objectType as ArrayType).element;
        } else {
          type = Types.unknown;
        }
        break;
      }
      
      case 'AssignmentExpression': {
        const valueType = checkExpression(node.value, ctx);
        
        if (node.target.kind === 'Identifier') {
          const varType = lookupVariable(ctx, node.target.name);
          if (!varType) {
            addError(`Unknown variable '${node.target.name}'`, node.target.span);
          } else if (!isAssignableTo(valueType, varType)) {
            addError(
              `Type '${typeToString(valueType)}' is not assignable to type '${typeToString(varType)}'`,
              node.span
            );
          }
        }
        
        type = valueType;
        break;
      }
      
      case 'FunctionExpression': {
        const funcCtx = createTypeContext(ctx);
        (funcCtx as { isAsync: boolean }).isAsync = node.isAsync ?? false;
        
        const paramTypes: Type[] = [];
        for (const param of node.params) {
          const paramType = resolveTypeNode(param.type, ctx);
          paramTypes.push(paramType);
          funcCtx.variables.set(param.name, paramType);
        }
        
        const returnType = node.returnType ? resolveTypeNode(node.returnType, ctx) : Types.void;
        (funcCtx as { returnType: Type }).returnType = returnType;
        
        checkStatement(node.body, funcCtx);
        
        type = Types.func(paramTypes, returnType, node.isAsync ?? false);
        break;
      }
      
      case 'AwaitExpression': {
        if (!ctx.isAsync) {
          addError("'await' can only be used inside async functions", node.span);
        }
        const argType = checkExpression(node.argument, ctx);
        // Unwrap Promise type (simplified)
        type = argType;
        break;
      }
      
      default:
        type = Types.unknown;
    }
    
    nodeTypes.set(node, type);
    return type;
  }
  
  function checkStatement(node: AST.Statement, ctx: TypeContext): void {
    switch (node.kind) {
      case 'BlockStatement':
        for (const stmt of node.body) {
          checkStatement(stmt, ctx);
        }
        break;
        
      case 'ExpressionStatement':
        checkExpression(node.expression, ctx);
        break;
        
      case 'IfStatement':
        checkExpression(node.condition, ctx);
        checkStatement(node.consequent, ctx);
        if (node.alternate) {
          checkStatement(node.alternate, ctx);
        }
        break;
        
      case 'ForStatement': {
        const iterType = checkExpression(node.iterable, ctx);
        
        const loopCtx = createTypeContext(ctx);
        if (iterType.kind === 'array') {
          loopCtx.variables.set(node.variable, (iterType as ArrayType).element);
        } else {
          loopCtx.variables.set(node.variable, Types.unknown);
        }
        
        checkStatement(node.body, loopCtx);
        break;
      }
      
      case 'WhileStatement':
        checkExpression(node.condition, ctx);
        checkStatement(node.body, ctx);
        break;
        
      case 'ReturnStatement':
        if (node.argument) {
          const returnType = checkExpression(node.argument, ctx);
          if (ctx.returnType && !isAssignableTo(returnType, ctx.returnType)) {
            addError(
              `Return type '${typeToString(returnType)}' is not assignable to '${typeToString(ctx.returnType)}'`,
              node.span
            );
          }
        }
        break;
        
      case 'EmitStatement':
        checkExpression(node.value, ctx);
        break;
        
      case 'LetDeclaration': {
        let varType: Type;
        if (node.type) {
          varType = resolveTypeNode(node.type, ctx);
        } else if (node.initializer) {
          varType = checkExpression(node.initializer, ctx);
        } else {
          varType = Types.unknown;
        }
        ctx.variables.set(node.name, varType);
        break;
      }
      
      case 'ConstDeclaration': {
        let varType: Type;
        if (node.type) {
          varType = resolveTypeNode(node.type, ctx);
        } else {
          varType = checkExpression(node.initializer, ctx);
        }
        ctx.variables.set(node.name, varType);
        break;
      }
      
      case 'FunctionDeclaration': {
        const funcCtx = createTypeContext(ctx);
        (funcCtx as { isAsync: boolean }).isAsync = node.isAsync ?? false;
        
        const paramTypes: Type[] = [];
        for (const param of node.params) {
          const paramType = resolveTypeNode(param.type, ctx);
          paramTypes.push(paramType);
          funcCtx.variables.set(param.name, paramType);
        }
        
        const returnType = node.returnType ? resolveTypeNode(node.returnType, ctx) : Types.void;
        (funcCtx as { returnType: Type }).returnType = returnType;
        
        const funcType = Types.func(paramTypes, returnType, node.isAsync ?? false);
        ctx.variables.set(node.name, funcType);
        
        checkStatement(node.body, funcCtx);
        break;
      }
      
      case 'TypeDeclaration': {
        const type = resolveTypeNode(node.type, ctx);
        ctx.types.set(node.name, type);
        break;
      }
      
      case 'CardDeclaration':
        checkCardDeclaration(node, ctx);
        break;
    }
  }
  
  function checkCardDeclaration(node: AST.CardDeclaration, ctx: TypeContext): void {
    const cardCtx = createTypeContext(ctx);
    
    // Process card members
    for (const member of node.members) {
      switch (member.kind) {
        case 'ParamsBlock':
          for (const param of member.params) {
            const paramType = resolveTypeNode(param.type, cardCtx);
            cardCtx.variables.set(param.name, paramType);
            checkExpression(param.defaultValue, cardCtx);
          }
          break;
          
        case 'StateBlock':
          for (const field of member.fields) {
            const fieldType = resolveTypeNode(field.type, cardCtx);
            cardCtx.variables.set(field.name, fieldType);
            if (field.initializer) {
              checkExpression(field.initializer, cardCtx);
            }
          }
          break;
          
        case 'ProcessBlock': {
          const processCtx = createTypeContext(cardCtx);
          for (const param of member.params) {
            const paramType = resolveTypeNode(param.type, cardCtx);
            processCtx.variables.set(param.name, paramType);
          }
          checkStatement(member.body, processCtx);
          break;
        }
        
        case 'OnBlock': {
          const onCtx = createTypeContext(cardCtx);
          if (member.params) {
            for (const param of member.params) {
              const paramType = resolveTypeNode(param.type, cardCtx);
              onCtx.variables.set(param.name, paramType);
            }
          }
          checkStatement(member.body, onCtx);
          break;
        }
        
        case 'FunctionDeclaration':
          checkStatement(member, cardCtx);
          break;
      }
    }
  }
  
  // Check all declarations in program
  for (const decl of program.body) {
    checkStatement(decl as AST.Statement, globalCtx);
  }
  
  return Object.freeze({
    errors: Object.freeze(errors),
    types: nodeTypes,
    success: errors.filter(e => e.severity === 'error').length === 0,
  });
}
