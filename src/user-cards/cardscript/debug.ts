/**
 * @fileoverview CardScript Debugging Hooks.
 * 
 * Provides debugging support for CardScript with:
 * - Breakpoints
 * - Step execution
 * - Variable inspection
 * - Call stack tracing
 * - Expression evaluation
 * - Execution logging
 * 
 * @module @cardplay/user-cards/cardscript/debug
 */

import type { ASTNode } from './ast';

// ============================================================================
// DEBUG TYPES
// ============================================================================

/**
 * Source location for debugging.
 */
export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

/**
 * Breakpoint definition.
 */
export interface Breakpoint {
  readonly id: string;
  readonly location: SourceLocation;
  enabled: boolean;
  condition?: string;
  hitCount: number;
  logMessage?: string;
}

/**
 * Stack frame.
 */
export interface StackFrame {
  readonly id: number;
  readonly name: string;
  readonly location: SourceLocation;
  readonly scopes: Scope[];
  readonly isAsync: boolean;
}

/**
 * Variable scope.
 */
export interface Scope {
  readonly type: 'local' | 'closure' | 'global' | 'card';
  readonly name: string;
  readonly variables: Variable[];
}

/**
 * Debug variable.
 */
export interface Variable {
  readonly name: string;
  readonly value: unknown;
  readonly type: string;
  readonly writable: boolean;
  readonly children?: Variable[];
}

/**
 * Debug event types.
 */
export type DebugEvent =
  | { type: 'break'; frame: StackFrame; breakpoint?: Breakpoint }
  | { type: 'step'; frame: StackFrame }
  | { type: 'exception'; error: Error; frame: StackFrame }
  | { type: 'log'; message: string; level: 'info' | 'warn' | 'error' }
  | { type: 'output'; text: string }
  | { type: 'started' }
  | { type: 'stopped' };

/**
 * Debug listener.
 */
export type DebugListener = (event: DebugEvent) => void;

/**
 * Step mode.
 */
export type StepMode = 'continue' | 'step-over' | 'step-into' | 'step-out';

// ============================================================================
// DEBUGGER
// ============================================================================

/**
 * CardScript debugger.
 */
export class CardScriptDebugger {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private breakpointIdCounter = 0;
  private callStack: StackFrame[] = [];
  private frameIdCounter = 0;
  private listeners: DebugListener[] = [];
  private stepMode: StepMode = 'continue';
  private stepDepth = 0;
  private isPaused = false;
  private isRunning = false;
  
  // -------------------------------------------------------------------------
  // BREAKPOINT MANAGEMENT
  // -------------------------------------------------------------------------
  
  /**
   * Sets a breakpoint at a location.
   */
  setBreakpoint(location: SourceLocation, options: {
    condition?: string;
    logMessage?: string;
  } = {}): Breakpoint {
    const id = `bp_${++this.breakpointIdCounter}`;
    const breakpoint: Breakpoint = {
      id,
      location,
      enabled: true,
      ...(options.condition !== undefined ? { condition: options.condition } : {}),
      hitCount: 0,
      ...(options.logMessage !== undefined ? { logMessage: options.logMessage } : {}),
    };
    
    this.breakpoints.set(id, breakpoint);
    return breakpoint;
  }
  
  /**
   * Removes a breakpoint.
   */
  removeBreakpoint(id: string): boolean {
    return this.breakpoints.delete(id);
  }
  
  /**
   * Clears all breakpoints.
   */
  clearBreakpoints(): void {
    this.breakpoints.clear();
  }
  
  /**
   * Gets all breakpoints.
   */
  getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }
  
  /**
   * Toggles a breakpoint.
   */
  toggleBreakpoint(id: string): boolean {
    const bp = this.breakpoints.get(id);
    if (bp) {
      bp.enabled = !bp.enabled;
      return bp.enabled;
    }
    return false;
  }
  
  /**
   * Finds breakpoints at a location.
   */
  private findBreakpointsAt(location: SourceLocation): Breakpoint[] {
    return Array.from(this.breakpoints.values()).filter(bp =>
      bp.enabled &&
      bp.location.file === location.file &&
      bp.location.line === location.line
    );
  }
  
  // -------------------------------------------------------------------------
  // EXECUTION CONTROL
  // -------------------------------------------------------------------------
  
  /**
   * Continues execution.
   */
  continue(): void {
    this.stepMode = 'continue';
    this.isPaused = false;
  }
  
  /**
   * Steps over the current statement.
   */
  stepOver(): void {
    this.stepMode = 'step-over';
    this.stepDepth = this.callStack.length;
    this.isPaused = false;
  }
  
  /**
   * Steps into the current function call.
   */
  stepInto(): void {
    this.stepMode = 'step-into';
    this.isPaused = false;
  }
  
  /**
   * Steps out of the current function.
   */
  stepOut(): void {
    this.stepMode = 'step-out';
    this.stepDepth = this.callStack.length - 1;
    this.isPaused = false;
  }
  
  /**
   * Pauses execution.
   */
  pause(): void {
    this.isPaused = true;
  }
  
  /**
   * Stops execution.
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.callStack = [];
    this.emit({ type: 'stopped' });
  }
  
  /**
   * Starts a debug session.
   */
  start(): void {
    this.isRunning = true;
    this.isPaused = false;
    this.callStack = [];
    this.stepMode = 'continue';
    this.emit({ type: 'started' });
  }
  
  // -------------------------------------------------------------------------
  // DEBUG HOOKS
  // -------------------------------------------------------------------------
  
  /**
   * Called before executing a statement.
   * Returns true if execution should pause.
   */
  beforeStatement(node: ASTNode, context: ExecutionContext): boolean {
    if (!this.isRunning) return false;
    
    const location = this.nodeToLocation(node, context.file);
    
    // Check for breakpoints
    const breakpoints = this.findBreakpointsAt(location);
    for (const bp of breakpoints) {
      // Check condition
      if (bp.condition) {
        try {
          const result = context.evaluate(bp.condition);
          if (!result) continue;
        } catch {
          continue;
        }
      }
      
      bp.hitCount++;
      
      // Log message breakpoint
      if (bp.logMessage) {
        const message = this.interpolateLogMessage(bp.logMessage, context);
        this.emit({ type: 'log', message, level: 'info' });
        continue;
      }
      
      // Break
      this.isPaused = true;
      const frame = this.getCurrentFrame()!;
      this.emit({ type: 'break', frame, breakpoint: bp });
      return true;
    }
    
    // Check step mode
    if (this.shouldStopForStep()) {
      this.isPaused = true;
      const frame = this.getCurrentFrame()!;
      this.emit({ type: 'step', frame });
      return true;
    }
    
    return this.isPaused;
  }
  
  /**
   * Called when entering a function.
   */
  enterFunction(
    name: string,
    location: SourceLocation,
    args: Record<string, unknown>,
    isAsync = false
  ): void {
    if (!this.isRunning) return;
    
    const frame: StackFrame = {
      id: ++this.frameIdCounter,
      name,
      location,
      scopes: [
        {
          type: 'local',
          name: 'Local',
          variables: Object.entries(args).map(([n, v]) => ({
            name: n,
            value: v,
            type: typeof v,
            writable: true,
          })),
        },
      ],
      isAsync,
    };
    
    this.callStack.push(frame);
  }
  
  /**
   * Called when exiting a function.
   */
  exitFunction(): void {
    if (!this.isRunning) return;
    this.callStack.pop();
  }
  
  /**
   * Called when an exception is thrown.
   */
  onException(error: Error): void {
    if (!this.isRunning) return;
    
    const frame = this.getCurrentFrame();
    if (frame) {
      this.isPaused = true;
      this.emit({ type: 'exception', error, frame });
    }
  }
  
  /**
   * Updates variables in the current frame.
   */
  updateVariables(variables: Record<string, unknown>): void {
    const frame = this.getCurrentFrame();
    if (!frame || frame.scopes.length === 0) return;
    
    const localScope = frame.scopes.find(s => s.type === 'local');
    if (localScope) {
      const newVars = Object.entries(variables).map(([name, value]) => ({
        name,
        value,
        type: typeof value,
        writable: true,
      }));
      
      // Update existing or add new
      for (const newVar of newVars) {
        const existing = localScope.variables.find(v => v.name === newVar.name);
        if (existing) {
          (existing as { value: unknown }).value = newVar.value;
        } else {
          localScope.variables.push(newVar);
        }
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // INSPECTION
  // -------------------------------------------------------------------------
  
  /**
   * Gets the call stack.
   */
  getCallStack(): StackFrame[] {
    return [...this.callStack];
  }
  
  /**
   * Gets the current frame.
   */
  getCurrentFrame(): StackFrame | undefined {
    return this.callStack[this.callStack.length - 1];
  }
  
  /**
   * Gets a specific frame by ID.
   */
  getFrame(frameId: number): StackFrame | undefined {
    return this.callStack.find(f => f.id === frameId);
  }
  
  /**
   * Gets variables from a scope.
   */
  getVariables(frameId: number, scopeType?: Scope['type']): Variable[] {
    const frame = this.getFrame(frameId);
    if (!frame) return [];
    
    if (scopeType) {
      const scope = frame.scopes.find(s => s.type === scopeType);
      return scope?.variables ?? [];
    }
    
    return frame.scopes.flatMap(s => s.variables);
  }
  
  /**
   * Evaluates an expression in the current context.
   */
  evaluate(_expression: string, _frameId?: number): {
    success: boolean;
    result?: unknown;
    error?: string;
  } {
    // This would integrate with the CardScript evaluator
    // For now, return a placeholder
    return {
      success: false,
      error: 'Expression evaluation not implemented',
    };
  }
  
  // -------------------------------------------------------------------------
  // LISTENERS
  // -------------------------------------------------------------------------
  
  /**
   * Adds a debug event listener.
   */
  addListener(listener: DebugListener): () => void {
    this.listeners.push(listener);
    return () => this.removeListener(listener);
  }
  
  /**
   * Removes a debug event listener.
   */
  removeListener(listener: DebugListener): void {
    const idx = this.listeners.indexOf(listener);
    if (idx >= 0) this.listeners.splice(idx, 1);
  }
  
  /**
   * Emits a debug event.
   */
  private emit(event: DebugEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Debug listener error:', e);
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------
  
  /**
   * Converts an AST node to a source location.
   */
  private nodeToLocation(node: ASTNode, file: string): SourceLocation {
    return {
      file,
      line: node.span?.start.line ?? 0,
      column: node.span?.start.column ?? 0,
    };
  }
  
  /**
   * Checks if execution should stop for the current step mode.
   */
  private shouldStopForStep(): boolean {
    switch (this.stepMode) {
      case 'step-into':
        return true;
      case 'step-over':
        return this.callStack.length <= this.stepDepth;
      case 'step-out':
        return this.callStack.length < this.stepDepth;
      default:
        return false;
    }
  }
  
  /**
   * Interpolates a log message with variable values.
   */
  private interpolateLogMessage(
    message: string,
    context: ExecutionContext
  ): string {
    return message.replace(/\{([^}]+)\}/g, (_, expr) => {
      try {
        const value = context.evaluate(expr);
        return String(value);
      } catch {
        return `{${expr}}`;
      }
    });
  }
  
  /**
   * Gets debug state.
   */
  getState(): {
    isRunning: boolean;
    isPaused: boolean;
    stepMode: StepMode;
    stackDepth: number;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      stepMode: this.stepMode,
      stackDepth: this.callStack.length,
    };
  }
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

/**
 * Execution context for debugging.
 */
export interface ExecutionContext {
  file: string;
  evaluate(expression: string): unknown;
  getVariable(name: string): unknown;
  setVariable(name: string, value: unknown): void;
}

/**
 * Creates a basic execution context.
 */
export function createExecutionContext(
  file: string,
  variables: Record<string, unknown> = {}
): ExecutionContext {
  const vars = { ...variables };
  
  return {
    file,
    evaluate(expression: string): unknown {
      // Simple variable lookup for now
      if (expression in vars) {
        return vars[expression];
      }
      throw new Error(`Unknown variable: ${expression}`);
    },
    getVariable(name: string): unknown {
      return vars[name];
    },
    setVariable(name: string, value: unknown): void {
      vars[name] = value;
    },
  };
}

// ============================================================================
// EXECUTION TRACER
// ============================================================================

/**
 * Trace entry.
 */
export interface TraceEntry {
  timestamp: number;
  type: 'enter' | 'exit' | 'statement' | 'expression';
  location: SourceLocation;
  name?: string;
  value?: unknown;
  duration?: number;
}

/**
 * Execution tracer for profiling and logging.
 */
export class ExecutionTracer {
  private entries: TraceEntry[] = [];
  private maxEntries: number;
  private enabled = true;
  
  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
  }
  
  /**
   * Enables/disables tracing.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Traces function entry.
   */
  enter(name: string, location: SourceLocation): void {
    if (!this.enabled) return;
    this.addEntry({
      timestamp: performance.now(),
      type: 'enter',
      location,
      name,
    });
  }
  
  /**
   * Traces function exit.
   */
  exit(name: string, location: SourceLocation, duration: number, value?: unknown): void {
    if (!this.enabled) return;
    this.addEntry({
      timestamp: performance.now(),
      type: 'exit',
      location,
      name,
      value,
      duration,
    });
  }
  
  /**
   * Traces a statement.
   */
  statement(location: SourceLocation): void {
    if (!this.enabled) return;
    this.addEntry({
      timestamp: performance.now(),
      type: 'statement',
      location,
    });
  }
  
  /**
   * Traces an expression evaluation.
   */
  expression(location: SourceLocation, value: unknown): void {
    if (!this.enabled) return;
    this.addEntry({
      timestamp: performance.now(),
      type: 'expression',
      location,
      value,
    });
  }
  
  /**
   * Adds a trace entry.
   */
  private addEntry(entry: TraceEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }
  
  /**
   * Gets all trace entries.
   */
  getEntries(): TraceEntry[] {
    return [...this.entries];
  }
  
  /**
   * Gets entries for a specific file.
   */
  getEntriesForFile(file: string): TraceEntry[] {
    return this.entries.filter(e => e.location.file === file);
  }
  
  /**
   * Clears all trace entries.
   */
  clear(): void {
    this.entries = [];
  }
  
  /**
   * Gets profiling summary.
   */
  getProfilingSummary(): Map<string, {
    calls: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  }> {
    const summary = new Map<string, {
      calls: number;
      totalTime: number;
      avgTime: number;
      minTime: number;
      maxTime: number;
    }>();
    
    for (const entry of this.entries) {
      if (entry.type === 'exit' && entry.name && entry.duration !== undefined) {
        const existing = summary.get(entry.name);
        if (existing) {
          existing.calls++;
          existing.totalTime += entry.duration;
          existing.avgTime = existing.totalTime / existing.calls;
          existing.minTime = Math.min(existing.minTime, entry.duration);
          existing.maxTime = Math.max(existing.maxTime, entry.duration);
        } else {
          summary.set(entry.name, {
            calls: 1,
            totalTime: entry.duration,
            avgTime: entry.duration,
            minTime: entry.duration,
            maxTime: entry.duration,
          });
        }
      }
    }
    
    return summary;
  }
}

// ============================================================================
// SINGLETON DEBUGGER
// ============================================================================

let defaultDebugger: CardScriptDebugger | null = null;

/**
 * Gets the default debugger.
 */
export function getDebugger(): CardScriptDebugger {
  if (!defaultDebugger) {
    defaultDebugger = new CardScriptDebugger();
  }
  return defaultDebugger;
}

/**
 * Sets a breakpoint using the default debugger.
 */
export function setBreakpoint(
  file: string,
  line: number,
  column = 0,
  condition?: string
): Breakpoint {
  return getDebugger().setBreakpoint({ file, line, column }, condition !== undefined ? { condition } : {});
}

/**
 * Removes a breakpoint using the default debugger.
 */
export function removeBreakpoint(id: string): boolean {
  return getDebugger().removeBreakpoint(id);
}
