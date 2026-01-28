/**
 * @fileoverview CardScript Compiler - Compiles CardScript to native Card<A,B>.
 * 
 * This is a thin layer that translates CardScript definitions into
 * the existing card infrastructure with minimal overhead for low latency.
 * 
 * @module @cardplay/user-cards/cardscript/compiler
 */

import type { Program, CardDeclaration, Expression, Statement } from './ast';
import type {
  Card,
  CardMeta,
  CardSignature,
  CardContext,
  CardResult,
  CardState,
  Port,
  PortType,
  CardParam,
  ParamType,
  CardCategory,
} from '../../cards/card';
import {
  createCard,
  createCardMeta,
  createSignature,
  createPort,
  createParam,
  // Reserved for future use
  // createCardState,
  // updateCardState,
  PortTypes,
} from '../../cards/card';

// ============================================================================
// COMPILED CARD VALUE TYPES
// ============================================================================

/** Runtime value types */
export type CardValue = number | string | boolean | null | CardValue[] | { [key: string]: CardValue };

/** Compiled function */
export type CompiledFunction = (args: CardValue[], ctx: RuntimeContext) => CardValue;

// ============================================================================
// RUNTIME CONTEXT - PREALLOCATED FOR LOW LATENCY
// ============================================================================

/**
 * Preallocated runtime context to avoid allocations in process loop.
 */
export interface RuntimeContext {
  /** Variable storage (preallocated) */
  readonly vars: Map<string, CardValue>;
  /** Card context reference */
  cardCtx: CardContext;
  /** Current state */
  state: Map<string, CardValue>;
  /** Output accumulator */
  output: CardValue;
  /** Parameter values */
  readonly params: Map<string, CardValue>;
  /** Input value */
  input: CardValue;
  /** Stdlib functions */
  readonly stdlib: Map<string, CompiledFunction>;
}

/**
 * Creates a preallocated runtime context.
 */
export function createRuntimeContext(): RuntimeContext {
  const stdlib = new Map<string, CompiledFunction>();
  
  // Math functions - inlined for performance
  stdlib.set('abs', (args) => Math.abs(args[0] as number));
  stdlib.set('sin', (args) => Math.sin(args[0] as number));
  stdlib.set('cos', (args) => Math.cos(args[0] as number));
  stdlib.set('tan', (args) => Math.tan(args[0] as number));
  stdlib.set('floor', (args) => Math.floor(args[0] as number));
  stdlib.set('ceil', (args) => Math.ceil(args[0] as number));
  stdlib.set('round', (args) => Math.round(args[0] as number));
  stdlib.set('sqrt', (args) => Math.sqrt(args[0] as number));
  stdlib.set('pow', (args) => Math.pow(args[0] as number, args[1] as number));
  stdlib.set('min', (args) => Math.min(args[0] as number, args[1] as number));
  stdlib.set('max', (args) => Math.max(args[0] as number, args[1] as number));
  stdlib.set('clamp', (args) => Math.max(args[1] as number, Math.min(args[2] as number, args[0] as number)));
  stdlib.set('random', () => Math.random());
  stdlib.set('log', (args) => Math.log(args[0] as number));
  stdlib.set('exp', (args) => Math.exp(args[0] as number));
  
  // Audio-specific
  stdlib.set('mtof', (args) => 440 * Math.pow(2, ((args[0] as number) - 69) / 12));
  stdlib.set('ftom', (args) => 69 + 12 * Math.log2((args[0] as number) / 440));
  stdlib.set('dbtoa', (args) => Math.pow(10, (args[0] as number) / 20));
  stdlib.set('atodb', (args) => 20 * Math.log10(args[0] as number));
  
  // Utility
  stdlib.set('len', (args) => (args[0] as CardValue[]).length);
  stdlib.set('print', (args) => { console.log(...args); return null; });
  
  return {
    vars: new Map(),
    cardCtx: null!,
    state: new Map(),
    output: null,
    params: new Map(),
    input: null,
    stdlib,
  };
}

// ============================================================================
// EXPRESSION COMPILER - GENERATES FAST CLOSURES
// ============================================================================

type ExprEvaluator = (ctx: RuntimeContext) => CardValue;

/**
 * Compiles an expression to a fast evaluator function.
 * Uses closure-based compilation for low overhead.
 */
export function compileExpression(expr: Expression): ExprEvaluator {
  switch (expr.kind) {
    case 'NumberLiteral':
      return () => expr.value;
      
    case 'StringLiteral':
      return () => expr.value;
      
    case 'BooleanLiteral':
      return () => expr.value;
      
    case 'NullLiteral':
      return () => null;
      
    case 'Identifier': {
      const name = expr.name;
      // Check special identifiers first
      if (name === 'input') {
        return (ctx) => ctx.input;
      }
      if (name === 'output') {
        return (ctx) => ctx.output;
      }
      // Check params, then state, then vars
      return (ctx) => {
        if (ctx.params.has(name)) return ctx.params.get(name)!;
        if (ctx.state.has(name)) return ctx.state.get(name)!;
        return ctx.vars.get(name) ?? null;
      };
    }
    
    case 'ArrayLiteral': {
      const elemEvals = expr.elements.map(compileExpression);
      return (ctx) => elemEvals.map(e => e(ctx));
    }
    
    case 'ObjectLiteral': {
      const propEvals = expr.properties.map(p => ({
        key: typeof p.key === 'string' ? p.key :
             p.key.kind === 'StringLiteral' ? p.key.value :
             p.key.kind === 'Identifier' ? p.key.name : 'unknown',
        value: compileExpression(p.value),
      }));
      return (ctx) => {
        const obj: { [key: string]: CardValue } = {};
        for (const prop of propEvals) {
          obj[prop.key] = prop.value(ctx);
        }
        return obj;
      };
    }
    
    case 'BinaryExpression': {
      const left = compileExpression(expr.left);
      const right = compileExpression(expr.right);
      
      // Generate specialized operator functions
      switch (expr.operator) {
        case '+': return (ctx) => (left(ctx) as number) + (right(ctx) as number);
        case '-': return (ctx) => (left(ctx) as number) - (right(ctx) as number);
        case '*': return (ctx) => (left(ctx) as number) * (right(ctx) as number);
        case '/': return (ctx) => (left(ctx) as number) / (right(ctx) as number);
        case '%': return (ctx) => (left(ctx) as number) % (right(ctx) as number);
        case '^': return (ctx) => Math.pow(left(ctx) as number, right(ctx) as number);
        case '&': return (ctx) => (left(ctx) as number) & (right(ctx) as number);
        case '|': return (ctx) => (left(ctx) as number) | (right(ctx) as number);
        case '<<': return (ctx) => (left(ctx) as number) << (right(ctx) as number);
        case '>>': return (ctx) => (left(ctx) as number) >> (right(ctx) as number);
        case '==': return (ctx) => left(ctx) === right(ctx);
        case '!=': return (ctx) => left(ctx) !== right(ctx);
        case '<': return (ctx) => (left(ctx) as number) < (right(ctx) as number);
        case '<=': return (ctx) => (left(ctx) as number) <= (right(ctx) as number);
        case '>': return (ctx) => (left(ctx) as number) > (right(ctx) as number);
        case '>=': return (ctx) => (left(ctx) as number) >= (right(ctx) as number);
        case 'and': return (ctx) => left(ctx) && right(ctx);
        case 'or': return (ctx) => left(ctx) || right(ctx);
        default: return () => null;
      }
    }
    
    case 'UnaryExpression': {
      const operand = compileExpression(expr.operand);
      switch (expr.operator) {
        case '-': return (ctx) => -(operand(ctx) as number);
        case '!': return (ctx) => !operand(ctx);
        case '~': return (ctx) => ~(operand(ctx) as number);
        default: return operand;
      }
    }
    
    case 'TernaryExpression': {
      const cond = compileExpression(expr.condition);
      const cons = compileExpression(expr.consequent);
      const alt = compileExpression(expr.alternate);
      return (ctx) => cond(ctx) ? cons(ctx) : alt(ctx);
    }
    
    case 'CallExpression': {
      const args = expr.arguments.map(compileExpression);
      
      // Handle identifier calls (stdlib or user functions)
      if (expr.callee.kind === 'Identifier') {
        const name = expr.callee.name;
        return (ctx) => {
          const fn = ctx.stdlib.get(name);
          if (fn) {
            const argVals = args.map(a => a(ctx));
            return fn(argVals, ctx);
          }
          return null;
        };
      }
      
      // Handle member calls
      if (expr.callee.kind === 'MemberExpression') {
        const obj = compileExpression(expr.callee.object);
        const prop = expr.callee.property;
        return (ctx) => {
          const objVal = obj(ctx);
          const argVals = args.map(a => a(ctx));
          if (Array.isArray(objVal)) {
            switch (prop) {
              case 'push': objVal.push(argVals[0]!); return objVal.length;
              case 'pop': return objVal.pop() ?? null;
              case 'slice': return objVal.slice(argVals[0] as number, argVals[1] as number);
              case 'map': return objVal; // Simplified
              case 'filter': return objVal; // Simplified
            }
          }
          return null;
        };
      }
      
      return () => null;
    }
    
    case 'MemberExpression': {
      const obj = compileExpression(expr.object);
      const prop = expr.property;
      return (ctx) => {
        const objVal = obj(ctx);
        if (objVal && typeof objVal === 'object' && !Array.isArray(objVal)) {
          return (objVal as { [key: string]: CardValue })[prop] ?? null;
        }
        if (Array.isArray(objVal) && prop === 'length') {
          return objVal.length;
        }
        return null;
      };
    }
    
    case 'IndexExpression': {
      const obj = compileExpression(expr.object);
      const idx = compileExpression(expr.index);
      return (ctx) => {
        const objVal = obj(ctx);
        const idxVal = idx(ctx);
        if (Array.isArray(objVal)) {
          return objVal[idxVal as number] ?? null;
        }
        if (objVal && typeof objVal === 'object') {
          return (objVal as { [key: string]: CardValue })[idxVal as string] ?? null;
        }
        return null;
      };
    }
    
    case 'AssignmentExpression': {
      const value = compileExpression(expr.value);
      if (expr.target.kind === 'Identifier') {
        const name = expr.target.name;
        if (name === 'output') {
          return (ctx) => { ctx.output = value(ctx); return ctx.output; };
        }
        return (ctx) => {
          const v = value(ctx);
          // Assign to state if it exists there, otherwise vars
          if (ctx.state.has(name)) {
            ctx.state.set(name, v);
          } else {
            ctx.vars.set(name, v);
          }
          return v;
        };
      }
      return value;
    }
    
    default:
      return () => null;
  }
}

// ============================================================================
// STATEMENT COMPILER
// ============================================================================

type StmtExecutor = (ctx: RuntimeContext) => void;

/**
 * Compiles a statement to an executor function.
 */
export function compileStatement(stmt: Statement): StmtExecutor {
  switch (stmt.kind) {
    case 'ExpressionStatement': {
      const expr = compileExpression(stmt.expression);
      return (ctx) => { expr(ctx); };
    }
    
    case 'BlockStatement': {
      const stmts = stmt.body.map(compileStatement);
      return (ctx) => {
        for (const s of stmts) s(ctx);
      };
    }
    
    case 'IfStatement': {
      const cond = compileExpression(stmt.condition);
      const cons = compileStatement(stmt.consequent);
      const alt = stmt.alternate ? compileStatement(stmt.alternate) : null;
      return (ctx) => {
        if (cond(ctx)) {
          cons(ctx);
        } else if (alt) {
          alt(ctx);
        }
      };
    }
    
    case 'ForStatement': {
      const iter = compileExpression(stmt.iterable);
      const body = compileStatement(stmt.body);
      const varName = stmt.variable;
      return (ctx) => {
        const iterVal = iter(ctx) as CardValue[];
        if (Array.isArray(iterVal)) {
          for (const item of iterVal) {
            ctx.vars.set(varName, item);
            body(ctx);
          }
        }
      };
    }
    
    case 'WhileStatement': {
      const cond = compileExpression(stmt.condition);
      const body = compileStatement(stmt.body);
      return (ctx) => {
        let iterations = 0;
        const maxIterations = 10000; // Safety limit
        while (cond(ctx) && iterations < maxIterations) {
          body(ctx);
          iterations++;
        }
      };
    }
    
    case 'ReturnStatement': {
      if (stmt.argument) {
        const arg = compileExpression(stmt.argument);
        return (ctx) => { ctx.output = arg(ctx); };
      }
      return () => {};
    }
    
    case 'EmitStatement': {
      const val = compileExpression(stmt.value);
      return (ctx) => { ctx.output = val(ctx); };
    }
    
    case 'LetDeclaration':
    case 'ConstDeclaration': {
      const name = stmt.name;
      if (stmt.initializer) {
        const init = compileExpression(stmt.initializer);
        return (ctx) => { ctx.vars.set(name, init(ctx)); };
      }
      return (ctx) => { ctx.vars.set(name, null); };
    }
    
    default:
      return () => {};
  }
}

// ============================================================================
// CARD COMPILER
// ============================================================================

/**
 * Port type mapping from CardScript types.
 */
function mapPortType(typeName: string): PortType {
  switch (typeName.toLowerCase()) {
    case 'audio': return PortTypes.AUDIO;
    case 'midi': return PortTypes.MIDI;
    case 'notes': return PortTypes.NOTES;
    case 'number': return PortTypes.NUMBER;
    case 'string': return PortTypes.STRING;
    case 'boolean': return PortTypes.BOOLEAN;
    case 'trigger': return PortTypes.TRIGGER;
    case 'control': return PortTypes.CONTROL;
    case 'pattern': return PortTypes.PATTERN;
    default: return PortTypes.ANY;
  }
}

/**
 * Param type mapping.
 */
function mapParamType(typeName: string): ParamType {
  switch (typeName.toLowerCase()) {
    case 'number': return 'number';
    case 'integer': return 'integer';
    case 'boolean': return 'boolean';
    case 'string': return 'string';
    case 'note': return 'note';
    case 'scale': return 'scale';
    case 'chord': return 'chord';
    default: return 'number';
  }
}

/**
 * Extracts type name from AST type node.
 */
function getTypeName(typeNode: { kind: string; name?: string }): string {
  if (typeNode.kind === 'TypeReference' && typeNode.name) {
    return typeNode.name;
  }
  return 'any';
}

/**
 * Compiled card definition.
 */
export interface CompiledCardDef {
  readonly meta: CardMeta;
  readonly signature: CardSignature;
  readonly initialState: Map<string, CardValue>;
  readonly processExecutor: StmtExecutor;
  readonly runtimeContext: RuntimeContext;
}

/**
 * Compiles a CardDeclaration to card components.
 */
export function compileCardDeclaration(decl: CardDeclaration): CompiledCardDef {
  const inputs: Port[] = [];
  const outputs: Port[] = [];
  const params: CardParam[] = [];
  const initialState = new Map<string, CardValue>();
  let processExecutor: StmtExecutor = () => {};
  
  // Extract card metadata from meta block
  let category: CardCategory = 'custom';
  let description: string | undefined;
  let author: string | undefined;
  let version: string | undefined;
  let tags: string[] = [];
  
  // Process all card members
  for (const member of decl.members) {
    switch (member.kind) {
      case 'MetaBlock':
        for (const field of member.fields) {
          switch (field.name) {
            case 'category':
              category = (field.value.kind === 'StringLiteral' ? field.value.value : 'custom') as CardCategory;
              break;
            case 'description':
              description = field.value.kind === 'StringLiteral' ? field.value.value : undefined;
              break;
            case 'author':
              author = field.value.kind === 'StringLiteral' ? field.value.value : undefined;
              break;
            case 'version':
              version = field.value.kind === 'StringLiteral' ? field.value.value : undefined;
              break;
            case 'tags':
              if (field.value.kind === 'ArrayLiteral') {
                tags = field.value.elements
                  .filter(e => e.kind === 'StringLiteral')
                  .map(e => (e as { value: string }).value);
              }
              break;
          }
        }
        break;
        
      case 'InputsBlock':
        for (const port of member.ports) {
          inputs.push(createPort(
            port.name,
            mapPortType(getTypeName(port.type)),
            {
              label: port.name,
              optional: false,
            }
          ));
        }
        break;
        
      case 'OutputsBlock':
        for (const port of member.ports) {
          outputs.push(createPort(
            port.name,
            mapPortType(getTypeName(port.type)),
            {
              label: port.name,
            }
          ));
        }
        break;
        
      case 'ParamsBlock':
        for (const param of member.params) {
          const defaultVal = compileExpression(param.defaultValue)({ vars: new Map(), params: new Map(), state: new Map(), cardCtx: null!, output: null, input: null, stdlib: new Map() });
          const paramOpts: { label: string; min?: number; max?: number } = { label: param.name };
          if (param.options?.min !== undefined) paramOpts.min = param.options.min;
          if (param.options?.max !== undefined) paramOpts.max = param.options.max;
          params.push(createParam(
            param.name,
            mapParamType(getTypeName(param.type)),
            defaultVal as number | string | boolean,
            paramOpts
          ));
        }
        break;
        
      case 'StateBlock':
        for (const field of member.fields) {
          if (field.initializer) {
            const initVal = compileExpression(field.initializer)({ vars: new Map(), params: new Map(), state: new Map(), cardCtx: null!, output: null, input: null, stdlib: new Map() });
            initialState.set(field.name, initVal);
          } else {
            initialState.set(field.name, null);
          }
        }
        break;
        
      case 'ProcessBlock':
        processExecutor = compileStatement(member.body);
        break;
    }
  }
  
  // Create metadata
  const metaOpts: { description?: string; author?: string; version?: string; tags: string[] } = { tags };
  if (description !== undefined) metaOpts.description = description;
  if (author !== undefined) metaOpts.author = author;
  if (version !== undefined) metaOpts.version = version;
  const meta = createCardMeta(
    `user.${decl.name.toLowerCase()}`,
    decl.name,
    category,
    metaOpts
  );
  
  // Create signature
  const signature = createSignature(inputs, outputs, params);
  
  return {
    meta,
    signature,
    initialState,
    processExecutor,
    runtimeContext: createRuntimeContext(),
  };
}

/**
 * Compiles a CardScript program to native Card instances.
 */
export function compileProgram(program: Program): Card<unknown, unknown>[] {
  const cards: Card<unknown, unknown>[] = [];
  
  for (const decl of program.body) {
    if (decl.kind === 'CardDeclaration') {
      const compiled = compileCardDeclaration(decl);
      
      // Create the native card with the compiled process function
      const card = createCard({
        meta: compiled.meta,
        signature: compiled.signature,
        initialState: Object.fromEntries(compiled.initialState),
        process: (input: unknown, cardCtx: CardContext, stateContainer?: CardState<unknown>): CardResult<unknown> => {
          // Reuse preallocated context
          const ctx = compiled.runtimeContext;
          ctx.cardCtx = cardCtx;
          ctx.input = input as CardValue;
          ctx.output = null;
          
          // Load state
          ctx.state.clear();
          if (stateContainer?.value && typeof stateContainer.value === 'object') {
            for (const [k, v] of Object.entries(stateContainer.value)) {
              ctx.state.set(k, v as CardValue);
            }
          } else {
            // Use initial state
            const initEntries = Array.from(compiled.initialState.entries());
            for (const [k, v] of initEntries) {
              ctx.state.set(k, v);
            }
          }
          
          // Load params
          ctx.params.clear();
          for (const param of compiled.signature.params) {
            ctx.params.set(param.name, param.default as CardValue);
          }
          
          // Clear vars
          ctx.vars.clear();
          
          // Execute process block
          compiled.processExecutor(ctx);
          
          // Return result
          return {
            output: ctx.output,
            ...(stateContainer ? {
              state: {
                value: Object.fromEntries(ctx.state),
                version: stateContainer.version + 1,
              }
            } : {}),
          } as CardResult<unknown>;
        },
      });
      
      cards.push(card);
    }
  }
  
  return cards;
}

// ============================================================================
// HIGH-LEVEL API
// ============================================================================

import { parse } from './parser';

/**
 * Compiles CardScript source code to native Card instances.
 * 
 * @example
 * ```typescript
 * const source = `
 *   card Gain {
 *     meta {
 *       category: "effects"
 *       description: "Simple gain control"
 *     }
 *     
 *     inputs {
 *       signal: audio
 *     }
 *     
 *     outputs {
 *       signal: audio
 *     }
 *     
 *     params {
 *       gain: number = 1.0 [0.0, 2.0]
 *     }
 *     
 *     process(input) {
 *       emit input * gain
 *     }
 *   }
 * `;
 * 
 * const cards = compile(source);
 * // cards[0] is a native Card<audio, audio>
 * ```
 */
export function compile(source: string): Card<unknown, unknown>[] {
  const result = parse(source);
  if (!result.success) {
    throw new Error(`Parse errors: ${result.errors.map(e => e.message).join(', ')}`);
  }
  return compileProgram(result.ast);
}

/**
 * Compiles a single card from source.
 */
export function compileCard(source: string): Card<unknown, unknown> {
  const cards = compile(source);
  if (cards.length === 0) {
    throw new Error('No card definition found in source');
  }
  return cards[0]!;
}
