/**
 * @fileoverview Card Editor Panel Component.
 * 
 * Comprehensive editor for creating and modifying CardPlay cards:
 * - Monaco-based code editor with CardScript syntax highlighting
 * - Live preview with error annotations
 * - Parameter and port definition UI
 * - Visual metadata editor (icon, color, category)
 * - Integrated test runner
 * - Template system for quick starts
 * - Full undo/redo support
 * 
 * @module @cardplay/user-cards/card-editor-panel
 */

import type { CardManifest, CardEntry } from './manifest';
import type { TypeCheckResult } from './cardscript/types';
import { typeCheck } from './cardscript/types';
import type { ParseResult } from './cardscript/parser';
import { parse } from './cardscript/parser';
import { compile } from './cardscript/compiler';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Editor layout mode.
 */
export type EditorLayoutMode = 
  | 'split-horizontal'   // Code left, preview right
  | 'split-vertical'     // Code top, preview bottom
  | 'code-only'          // Just code editor
  | 'preview-only'       // Just preview
  | 'tabbed';            // Tabs between code/preview/metadata

/**
 * Editor tab type.
 */
export type EditorTab = 
  | 'code'               // CardScript code editor
  | 'parameters'         // Parameter definition UI
  | 'ports'              // Port definition UI
  | 'metadata'           // Name, icon, color, tags
  | 'tests'              // Test runner
  | 'preview'            // Live card preview
  | 'console';           // Build output

/**
 * Simple card definition for the editor (not from manifest).
 * 
 * Change 269: Renamed from CardDefinition to EditorCardDefinition
 * to avoid collision with canonical CardDefinition in card-visuals.ts.
 */
export interface EditorCardDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: string;
  readonly author: string;
  readonly license: string;
  readonly icon: string;
  readonly color: string;
  readonly tags: readonly string[];
  readonly parameters: readonly ParameterUIConfig[];
  readonly inputs: readonly PortUIConfig[];
  readonly outputs: readonly PortUIConfig[];
  readonly source: string;
}

/**
 * Card editor state.
 */
export interface CardEditorState {
  /** Current card definition being edited - Change 270 */
  readonly cardDef: EditorCardDefinition;
  /** CardScript source code */
  readonly code: string;
  /** Current layout mode */
  readonly layoutMode: EditorLayoutMode;
  /** Active tab (for tabbed mode) */
  readonly activeTab: EditorTab;
  /** Whether editor has unsaved changes */
  readonly isDirty: boolean;
  /** Type check result */
  readonly typeCheckResult: TypeCheckResult | null;
  /** Build/compile errors */
  readonly buildErrors: readonly EditorError[];
  /** Test results */
  readonly testResults: readonly TestResult[];
  /** Whether tests are running */
  readonly isTestRunning: boolean;
  /** Undo history */
  readonly history: readonly CardEditorHistoryEntry[];
  /** Current position in history */
  readonly historyIndex: number;
}

/**
 * Editor error with location.
 */
export interface EditorError {
  readonly type: 'syntax' | 'type' | 'lint' | 'build';
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly severity: 'error' | 'warning' | 'info';
}

/**
 * Test result.
 */
export interface TestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly message?: string;
  readonly duration: number;
}

/**
 * History entry for undo/redo.
 */
export interface CardEditorHistoryEntry {
  readonly cardDef: EditorCardDefinition;
  readonly code: string;
  readonly timestamp: number;
  readonly description: string;
}

/**
 * Parameter UI definition.
 */
export interface ParameterUIConfig {
  readonly id: string;
  readonly name: string;
  readonly type: 'float' | 'int' | 'bool' | 'enum' | 'string';
  readonly defaultValue: unknown;
  readonly range?: readonly [number, number];
  readonly options?: readonly string[];
  readonly unit?: string;
  readonly description?: string;
  readonly group?: string;
}

/**
 * Port UI definition.
 */
export interface PortUIConfig {
  readonly id: string;
  readonly name: string;
  readonly direction: 'input' | 'output';
  readonly type: string;
  readonly required: boolean;
  readonly description?: string;
}

/**
 * Card template for quick start.
 */
export interface CardTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly code: string;
  readonly icon?: string;
  readonly tags?: readonly string[];
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

/**
 * Built-in card templates.
 */
export const CARD_TEMPLATES: readonly CardTemplate[] = Object.freeze([
  {
    id: 'empty',
    name: 'Empty Card',
    description: 'Minimal starting template',
    category: 'basic',
    code: `card MyCard {
  process(input) {
    return input;
  }
}`,
    icon: '📄',
  },
  {
    id: 'generator',
    name: 'Generator Card',
    description: 'Generate events from parameters',
    category: 'generator',
    code: `card MyGenerator {
  param pitch: int = 60 {
    range: [0, 127],
    unit: "midi"
  };
  
  param velocity: int = 100 {
    range: [0, 127]
  };
  
  process() {
    return createNote({
      pitch: this.pitch,
      velocity: this.velocity,
      start: 0,
      duration: 480
    });
  }
}`,
    icon: '🎵',
  },
  {
    id: 'transform',
    name: 'Transform Card',
    description: 'Transform incoming events',
    category: 'transform',
    code: `card MyTransform {
  param amount: float = 1.0 {
    range: [0.0, 2.0]
  };
  
  process(input: note[]) {
    return input.map(note => ({
      ...note,
      velocity: Math.min(127, note.velocity * this.amount)
    }));
  }
}`,
    icon: '🔄',
  },
  {
    id: 'effect',
    name: 'Audio Effect Card',
    description: 'Process audio with parameters',
    category: 'effect',
    code: `card MyEffect {
  param mix: float = 1.0 {
    range: [0.0, 1.0],
    unit: "percent"
  };
  
  param gain: float = 1.0 {
    range: [0.0, 2.0],
    unit: "linear"
  };
  
  process(input: audio) {
    const wet = input * this.gain;
    const dry = input;
    return wet * this.mix + dry * (1.0 - this.mix);
  }
}`,
    icon: '🎚️',
  },
  {
    id: 'analyzer',
    name: 'Analyzer Card',
    description: 'Analyze input and generate data',
    category: 'analyzer',
    code: `card MyAnalyzer {
  process(input: audio) {
    const rms = calculateRMS(input);
    const peak = calculatePeak(input);
    
    return {
      type: "analysis",
      data: {
        rms,
        peak,
        clipping: peak > 0.99
      }
    };
  }
}`,
    icon: '📊',
  },
]);

// ============================================================================
// DEFAULT STATE
// ============================================================================

/**
 * Create default card definition.
 */
export function createDefaultCardDefinition(): EditorCardDefinition {
  const template = CARD_TEMPLATES[0];
  if (!template) {
    throw new Error('No default template found');
  }
  return Object.freeze({
    id: 'my-card',
    name: 'My Card',
    description: 'A new CardPlay card',
    version: '1.0.0',
    category: 'custom',
    author: '',
    license: 'MIT',
    icon: '⚡',
    color: '#3b82f6',
    tags: [],
    parameters: [],
    inputs: [],
    outputs: [],
    source: template.code,
  });
}

/**
 * Create initial editor state.
 */
export function createEditorState(
  initialDef?: EditorCardDefinition
): CardEditorState {
  const cardDef = initialDef ?? createDefaultCardDefinition();
  const template = CARD_TEMPLATES[0];
  if (!template) {
    throw new Error('No default template found');
  }
  const code = cardDef.source || template.code;
  
  return Object.freeze({
    cardDef,
    code,
    layoutMode: 'split-horizontal',
    activeTab: 'code',
    isDirty: false,
    typeCheckResult: null,
    buildErrors: [],
    testResults: [],
    isTestRunning: false,
    history: [
      {
        cardDef,
        code,
        timestamp: Date.now(),
        description: 'Initial state',
      },
    ],
    historyIndex: 0,
  });
}

// ============================================================================
// STATE UPDATES
// ============================================================================

/**
 * Update code and revalidate.
 */
export function updateCode(
  state: CardEditorState,
  code: string
): CardEditorState {
  // Parse and type check
  let typeCheckResult: TypeCheckResult | null = null;
  let buildErrors: readonly EditorError[] = [];
  
  try {
    const parseResult: ParseResult = parse(code);
    if (parseResult.success) {
      typeCheckResult = typeCheck(parseResult.ast);
      
      // Convert type errors to editor errors
      if (!typeCheckResult.success) {
        buildErrors = typeCheckResult.errors.map(err => ({
          type: 'type' as const,
          message: err.message,
          line: err.span?.start.line ?? 0,
          column: err.span?.start.column ?? 0,
          severity: 'error' as const,
        }));
      }
    } else {
      // Parse errors
      buildErrors = parseResult.errors.map(err => ({
        type: 'syntax' as const,
        message: err.message,
        line: err.token.span.start.line,
        column: err.token.span.start.column,
        severity: 'error' as const,
      }));
    }
  } catch (err) {
    buildErrors = [{
      type: 'syntax',
      message: String(err),
      line: 0,
      column: 0,
      severity: 'error',
    }];
  }
  
  // Update card definition source
  const cardDef: EditorCardDefinition = Object.freeze({
    ...state.cardDef,
    source: code,
  });
  
  // Add to history
  const newHistory = [
    ...state.history.slice(0, state.historyIndex + 1),
    {
      cardDef,
      code,
      timestamp: Date.now(),
      description: 'Code edit',
    },
  ];
  
  return Object.freeze({
    ...state,
    code,
    cardDef,
    isDirty: true,
    typeCheckResult,
    buildErrors,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  });
}

/**
 * Update card metadata.
 */
export function updateMetadata<K extends keyof EditorCardDefinition>(
  state: CardEditorState,
  field: K,
  value: EditorCardDefinition[K]
): CardEditorState {
  const cardDef: EditorCardDefinition = Object.freeze({
    ...state.cardDef,
    [field]: value,
  });
  
  // Add to history
  const newHistory = [
    ...state.history.slice(0, state.historyIndex + 1),
    {
      cardDef,
      code: state.code,
      timestamp: Date.now(),
      description: `Update ${String(field)}`,
    },
  ];
  
  return Object.freeze({
    ...state,
    cardDef,
    isDirty: true,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  });
}

/**
 * Change layout mode.
 */
export function setLayoutMode(
  state: CardEditorState,
  mode: EditorLayoutMode
): CardEditorState {
  return Object.freeze({
    ...state,
    layoutMode: mode,
  });
}

/**
 * Change active tab.
 */
export function setActiveTab(
  state: CardEditorState,
  tab: EditorTab
): CardEditorState {
  return Object.freeze({
    ...state,
    activeTab: tab,
  });
}

/**
 * Load template.
 */
export function loadTemplate(
  state: CardEditorState,
  templateId: string
): CardEditorState {
  const template = CARD_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    return state;
  }
  
  const cardDef: EditorCardDefinition = Object.freeze({
    ...state.cardDef,
    source: template.code,
    icon: template.icon ?? state.cardDef.icon,
    tags: (template.tags ? [...template.tags] : state.cardDef.tags) as readonly string[],
  });
  
  return updateCode(
    Object.freeze({ ...state, cardDef }),
    template.code
  );
}

/**
 * Undo last change.
 */
export function undo(state: CardEditorState): CardEditorState {
  if (state.historyIndex <= 0) {
    return state;
  }
  
  const newIndex = state.historyIndex - 1;
  const entry = state.history[newIndex];
  if (!entry) {
    return state;
  }
  
  return Object.freeze({
    ...state,
    cardDef: entry.cardDef,
    code: entry.code,
    historyIndex: newIndex,
    isDirty: newIndex > 0,
  });
}

/**
 * Redo last undone change.
 */
export function redo(state: CardEditorState): CardEditorState {
  if (state.historyIndex >= state.history.length - 1) {
    return state;
  }
  
  const newIndex = state.historyIndex + 1;
  const entry = state.history[newIndex];
  if (!entry) {
    return state;
  }
  
  return Object.freeze({
    ...state,
    cardDef: entry.cardDef,
    code: entry.code,
    historyIndex: newIndex,
    isDirty: true,
  });
}

/**
 * Mark as saved (clear dirty flag).
 */
export function markSaved(state: CardEditorState): CardEditorState {
  return Object.freeze({
    ...state,
    isDirty: false,
  });
}

// ============================================================================
// PARAMETER MANAGEMENT
// ============================================================================

/**
 * Add parameter to card definition.
 */
export function addParameter(
  state: CardEditorState,
  param: ParameterUIConfig
): CardEditorState {
  const parameters = [...state.cardDef.parameters, param];
  return updateMetadata(state, 'parameters', parameters);
}

/**
 * Remove parameter from card definition.
 */
export function removeParameter(
  state: CardEditorState,
  paramId: string
): CardEditorState {
  const parameters = state.cardDef.parameters.filter((p: ParameterUIConfig) => p.id !== paramId);
  return updateMetadata(state, 'parameters', parameters);
}

/**
 * Update parameter in card definition.
 */
export function updateParameter(
  state: CardEditorState,
  paramId: string,
  updates: Partial<ParameterUIConfig>
): CardEditorState {
  const parameters = state.cardDef.parameters.map((p: ParameterUIConfig) =>
    p.id === paramId ? Object.freeze({ ...p, ...updates }) : p
  );
  return updateMetadata(state, 'parameters', parameters);
}

// ============================================================================
// PORT MANAGEMENT
// ============================================================================

/**
 * Add input port to card definition.
 */
export function addInputPort(
  state: CardEditorState,
  port: PortUIConfig
): CardEditorState {
  const inputs = [...state.cardDef.inputs, port];
  return updateMetadata(state, 'inputs', inputs);
}

/**
 * Remove input port from card definition.
 */
export function removeInputPort(
  state: CardEditorState,
  portId: string
): CardEditorState {
  const inputs = state.cardDef.inputs.filter((p: PortUIConfig) => p.id !== portId);
  return updateMetadata(state, 'inputs', inputs);
}

/**
 * Add output port to card definition.
 */
export function addOutputPort(
  state: CardEditorState,
  port: PortUIConfig
): CardEditorState {
  const outputs = [...state.cardDef.outputs, port];
  return updateMetadata(state, 'outputs', outputs);
}

/**
 * Remove output port from card definition.
 */
export function removeOutputPort(
  state: CardEditorState,
  portId: string
): CardEditorState {
  const outputs = state.cardDef.outputs.filter((p: PortUIConfig) => p.id !== portId);
  return updateMetadata(state, 'outputs', outputs);
}

// ============================================================================
// BUILD & TEST
// ============================================================================

/**
 * Build card from current code.
 */
export async function buildCard(
  state: CardEditorState
): Promise<CardEditorState> {
  let buildErrors: readonly EditorError[] = [];
  
  try {
    const parseResult: ParseResult = parse(state.code);
    if (!parseResult.success) {
      buildErrors = parseResult.errors.map(err => ({
        type: 'syntax' as const,
        message: err.message,
        line: err.token.span.start.line,
        column: err.token.span.start.column,
        severity: 'error' as const,
      }));
    } else {
      const typeCheckResult = typeCheck(parseResult.ast);
      
      if (!typeCheckResult.success) {
        buildErrors = typeCheckResult.errors.map(err => ({
          type: 'type' as const,
          message: err.message,
          line: err.span?.start.line ?? 0,
          column: err.span?.start.column ?? 0,
          severity: 'error' as const,
        }));
      } else {
        // Compile to JavaScript
        await compile(state.code);
      }
    }
  } catch (err) {
    buildErrors = [{
      type: 'build',
      message: String(err),
      line: 0,
      column: 0,
      severity: 'error',
    }];
  }
  
  return Object.freeze({
    ...state,
    buildErrors,
  });
}

/**
 * Run tests for card.
 */
export async function runTests(
  state: CardEditorState
): Promise<CardEditorState> {
  // Build card first
  const builtState = await buildCard(state);
  
  if (builtState.buildErrors.length > 0) {
    return Object.freeze({
      ...builtState,
      testResults: [{
        name: 'Build',
        passed: false,
        message: 'Card failed to build',
        duration: 0,
      }],
      isTestRunning: false,
    });
  }
  
  // TODO: Implement actual test execution
  // For now, return placeholder
  const testResults: readonly TestResult[] = Object.freeze([
    {
      name: 'Syntax check',
      passed: true,
      duration: 10,
    },
    {
      name: 'Type check',
      passed: true,
      duration: 15,
    },
  ]);
  
  return Object.freeze({
    ...builtState,
    testResults,
    isTestRunning: false,
  });
}

/**
 * Start test run.
 */
export function startTests(state: CardEditorState): CardEditorState {
  return Object.freeze({
    ...state,
    isTestRunning: true,
    testResults: [],
  });
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export card as manifest.
 */
export function exportCard(state: CardEditorState): CardManifest {
  return Object.freeze({
    manifestVersion: '1.0.0',
    name: state.cardDef.id,
    version: state.cardDef.version,
    displayName: state.cardDef.name,
    description: state.cardDef.description,
    category: state.cardDef.category,
    keywords: state.cardDef.tags as string[],
    cards: [{
      id: state.cardDef.id,
      file: state.cardDef.id + '.cardscript',
    }] as CardEntry[],
  });
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

/**
 * Create test runner UI panel.
 */
export function createTestRunnerUI(
  state: CardEditorState,
  onRunTests: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.padding = '16px';
  container.style.backgroundColor = '#f9fafb';
  container.style.borderRadius = '8px';
  container.style.border = '1px solid #e5e7eb';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '16px';
  
  const title = document.createElement('h3');
  title.textContent = 'Tests';
  title.style.margin = '0';
  title.style.fontSize = '16px';
  title.style.fontWeight = '600';
  header.appendChild(title);
  
  const runButton = document.createElement('button');
  runButton.textContent = state.isTestRunning ? 'Running...' : 'Run Tests';
  runButton.disabled = state.isTestRunning;
  runButton.style.padding = '6px 16px';
  runButton.style.backgroundColor = '#3b82f6';
  runButton.style.color = '#ffffff';
  runButton.style.border = 'none';
  runButton.style.borderRadius = '6px';
  runButton.style.cursor = state.isTestRunning ? 'not-allowed' : 'pointer';
  runButton.style.fontSize = '14px';
  runButton.style.fontWeight = '500';
  runButton.onclick = onRunTests;
  header.appendChild(runButton);
  
  container.appendChild(header);
  
  // Test results list
  const results = document.createElement('div');
  results.style.display = 'flex';
  results.style.flexDirection = 'column';
  results.style.gap = '8px';
  
  if (state.testResults.length === 0 && !state.isTestRunning) {
    const empty = document.createElement('div');
    empty.textContent = 'No tests run yet';
    empty.style.color = '#6b7280';
    empty.style.fontSize = '14px';
    empty.style.textAlign = 'center';
    empty.style.padding = '32px';
    results.appendChild(empty);
  } else {
    for (const result of state.testResults) {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '12px';
      item.style.backgroundColor = '#ffffff';
      item.style.borderRadius = '6px';
      item.style.border = `1px solid ${result.passed ? '#86efac' : '#fca5a5'}`;
      
      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '8px';
      
      const icon = document.createElement('span');
      icon.textContent = result.passed ? '✓' : '✗';
      icon.style.fontSize = '18px';
      icon.style.color = result.passed ? '#16a34a' : '#dc2626';
      left.appendChild(icon);
      
      const name = document.createElement('span');
      name.textContent = result.name;
      name.style.fontSize = '14px';
      name.style.fontWeight = '500';
      left.appendChild(name);
      
      item.appendChild(left);
      
      const right = document.createElement('div');
      right.style.fontSize = '12px';
      right.style.color = '#6b7280';
      right.textContent = `${result.duration}ms`;
      item.appendChild(right);
      
      if (result.message) {
        const message = document.createElement('div');
        message.textContent = result.message;
        message.style.fontSize = '12px';
        message.style.color = '#6b7280';
        message.style.marginTop = '4px';
        item.appendChild(message);
      }
      
      results.appendChild(item);
    }
    
    // Summary
    const summary = document.createElement('div');
    summary.style.marginTop = '16px';
    summary.style.padding = '12px';
    summary.style.backgroundColor = '#ffffff';
    summary.style.borderRadius = '6px';
    summary.style.fontSize = '14px';
    const passed = state.testResults.filter(r => r.passed).length;
    const total = state.testResults.length;
    summary.textContent = `${passed}/${total} tests passed`;
    summary.style.fontWeight = '500';
    summary.style.color = passed === total ? '#16a34a' : '#dc2626';
    results.appendChild(summary);
  }
  
  container.appendChild(results);
  
  return container;
}

/**
 * Create build output console UI.
 */
export function createBuildConsoleUI(state: CardEditorState): HTMLElement {
  const container = document.createElement('div');
  container.style.padding = '16px';
  container.style.backgroundColor = '#1f2937';
  container.style.borderRadius = '8px';
  container.style.border = '1px solid #374151';
  container.style.fontFamily = 'monospace';
  container.style.fontSize = '13px';
  container.style.maxHeight = '400px';
  container.style.overflowY = 'auto';
  
  const title = document.createElement('div');
  title.textContent = 'Build Output';
  title.style.color = '#9ca3af';
  title.style.marginBottom = '12px';
  title.style.fontSize = '14px';
  title.style.fontWeight = '600';
  container.appendChild(title);
  
  if (state.buildErrors.length === 0 && state.typeCheckResult?.errors.length === 0) {
    const success = document.createElement('div');
    success.textContent = '✓ Build successful';
    success.style.color = '#10b981';
    container.appendChild(success);
  } else {
    // Type errors
    if (state.typeCheckResult && state.typeCheckResult.errors.length > 0) {
      const typeHeader = document.createElement('div');
      typeHeader.textContent = '❌ Type Errors:';
      typeHeader.style.color = '#ef4444';
      typeHeader.style.marginBottom = '8px';
      container.appendChild(typeHeader);
      
      for (const err of state.typeCheckResult.errors) {
        const errDiv = document.createElement('div');
        errDiv.style.marginLeft = '16px';
        errDiv.style.marginBottom = '8px';
        errDiv.style.color = '#fca5a5';
        errDiv.textContent = `Line ${err.span.start.line}: ${err.message}`;
        container.appendChild(errDiv);
      }
    }
    
    // Build errors
    if (state.buildErrors.length > 0) {
      const buildHeader = document.createElement('div');
      buildHeader.textContent = '❌ Build Errors:';
      buildHeader.style.color = '#ef4444';
      buildHeader.style.marginTop = '12px';
      buildHeader.style.marginBottom = '8px';
      container.appendChild(buildHeader);
      
      for (const err of state.buildErrors) {
        const errDiv = document.createElement('div');
        errDiv.style.marginLeft = '16px';
        errDiv.style.marginBottom = '8px';
        errDiv.style.color = '#fca5a5';
        errDiv.textContent = err.line 
          ? `Line ${err.line}, Col ${err.column}: ${err.message}`
          : err.message;
        container.appendChild(errDiv);
      }
    }
  }
  
  return container;
}

/**
 * Create export/publish button UI.
 */
export function createExportPublishUI(
  state: CardEditorState,
  onExport: () => void,
  onPublish: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.gap = '12px';
  container.style.padding = '16px';
  container.style.backgroundColor = '#f9fafb';
  container.style.borderRadius = '8px';
  container.style.border = '1px solid #e5e7eb';
  
  const exportButton = document.createElement('button');
  exportButton.textContent = '📦 Export Card';
  exportButton.disabled = state.buildErrors.length > 0 || state.isDirty;
  exportButton.style.flex = '1';
  exportButton.style.padding = '10px 20px';
  exportButton.style.backgroundColor = state.buildErrors.length > 0 || state.isDirty ? '#e5e7eb' : '#3b82f6';
  exportButton.style.color = state.buildErrors.length > 0 || state.isDirty ? '#6b7280' : '#ffffff';
  exportButton.style.border = 'none';
  exportButton.style.borderRadius = '6px';
  exportButton.style.cursor = state.buildErrors.length > 0 || state.isDirty ? 'not-allowed' : 'pointer';
  exportButton.style.fontSize = '14px';
  exportButton.style.fontWeight = '500';
  exportButton.onclick = onExport;
  
  const publishButton = document.createElement('button');
  publishButton.textContent = '🚀 Publish to Marketplace';
  publishButton.disabled = state.buildErrors.length > 0 || state.isDirty;
  publishButton.style.flex = '1';
  publishButton.style.padding = '10px 20px';
  publishButton.style.backgroundColor = state.buildErrors.length > 0 || state.isDirty ? '#e5e7eb' : '#10b981';
  publishButton.style.color = state.buildErrors.length > 0 || state.isDirty ? '#6b7280' : '#ffffff';
  publishButton.style.border = 'none';
  publishButton.style.borderRadius = '6px';
  publishButton.style.cursor = state.buildErrors.length > 0 || state.isDirty ? 'not-allowed' : 'pointer';
  publishButton.style.fontSize = '14px';
  publishButton.style.fontWeight = '500';
  publishButton.onclick = onPublish;
  
  container.appendChild(exportButton);
  container.appendChild(publishButton);
  
  if (state.isDirty) {
    const hint = document.createElement('div');
    hint.textContent = 'Save changes before exporting';
    hint.style.fontSize = '12px';
    hint.style.color = '#6b7280';
    hint.style.textAlign = 'center';
    hint.style.width = '100%';
    hint.style.marginTop = '8px';
    container.appendChild(hint);
  }
  
  return container;
}

/**
 * Create template starter picker UI.
 */
export function createTemplatePickerUI(
  onSelectTemplate: (template: CardTemplate) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.padding = '24px';
  
  const title = document.createElement('h2');
  title.textContent = 'Choose a Card Template';
  title.style.margin = '0 0 16px';
  title.style.fontSize = '20px';
  title.style.fontWeight = '600';
  container.appendChild(title);
  
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
  grid.style.gap = '16px';
  
  for (const template of CARD_TEMPLATES) {
    const card = document.createElement('div');
    card.style.padding = '20px';
    card.style.backgroundColor = '#ffffff';
    card.style.border = '2px solid #e5e7eb';
    card.style.borderRadius = '12px';
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.2s';
    
    card.onmouseenter = () => {
      card.style.borderColor = '#3b82f6';
      card.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
    };
    
    card.onmouseleave = () => {
      card.style.borderColor = '#e5e7eb';
      card.style.boxShadow = 'none';
    };
    
    card.onclick = () => {
      onSelectTemplate(template);
    };
    
    const icon = document.createElement('div');
    icon.textContent = template.icon || '📦';
    icon.style.fontSize = '32px';
    icon.style.marginBottom = '12px';
    card.appendChild(icon);
    
    const name = document.createElement('div');
    name.textContent = template.name;
    name.style.fontSize = '16px';
    name.style.fontWeight = '600';
    name.style.marginBottom = '8px';
    card.appendChild(name);
    
    const desc = document.createElement('div');
    desc.textContent = template.description;
    desc.style.fontSize = '13px';
    desc.style.color = '#6b7280';
    desc.style.lineHeight = '1.5';
    card.appendChild(desc);
    
    grid.appendChild(card);
  }
  
  container.appendChild(grid);
  
  return container;
}

/**
 * Create undo/redo toolbar UI.
 */
export function createUndoRedoToolbar(
  state: CardEditorState,
  onUndo: () => void,
  onRedo: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.gap = '8px';
  container.style.padding = '8px';
  container.style.backgroundColor = '#f9fafb';
  container.style.borderRadius = '6px';
  
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  
  const undoButton = document.createElement('button');
  undoButton.textContent = '↶ Undo';
  undoButton.disabled = !canUndo;
  undoButton.style.padding = '6px 12px';
  undoButton.style.backgroundColor = canUndo ? '#ffffff' : '#e5e7eb';
  undoButton.style.color = canUndo ? '#374151' : '#9ca3af';
  undoButton.style.border = '1px solid #d1d5db';
  undoButton.style.borderRadius = '4px';
  undoButton.style.cursor = canUndo ? 'pointer' : 'not-allowed';
  undoButton.style.fontSize = '13px';
  undoButton.onclick = onUndo;
  
  const redoButton = document.createElement('button');
  redoButton.textContent = 'Redo ↷';
  redoButton.disabled = !canRedo;
  redoButton.style.padding = '6px 12px';
  redoButton.style.backgroundColor = canRedo ? '#ffffff' : '#e5e7eb';
  redoButton.style.color = canRedo ? '#374151' : '#9ca3af';
  redoButton.style.border = '1px solid #d1d5db';
  redoButton.style.borderRadius = '4px';
  redoButton.style.cursor = canRedo ? 'pointer' : 'not-allowed';
  redoButton.style.fontSize = '13px';
  redoButton.onclick = onRedo;
  
  const historyInfo = document.createElement('span');
  historyInfo.textContent = `${state.historyIndex + 1}/${state.history.length}`;
  historyInfo.style.fontSize = '12px';
  historyInfo.style.color = '#6b7280';
  historyInfo.style.alignSelf = 'center';
  historyInfo.style.marginLeft = '4px';
  
  container.appendChild(undoButton);
  container.appendChild(redoButton);
  container.appendChild(historyInfo);
  
  return container;
}
