/**
 * @fileoverview CardScript Playground UI Component.
 * 
 * Provides an interactive playground for writing and testing CardScript code:
 * - Code editor with syntax highlighting
 * - Live error checking
 * - Real-time execution
 * - Output console
 * - Example snippets
 * - Card preview
 * 
 * @module @cardplay/user-cards/cardscript/playground-ui
 */

import { parse } from './parser';
import { typeCheck } from './types';
import { highlight } from './highlight';
import type { TypeCheckResult } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Playground state.
 */
export interface PlaygroundState {
  /** Current source code */
  readonly code: string;
  /** Whether code has unsaved changes */
  readonly isDirty: boolean;
  /** Type check result */
  readonly typeCheckResult: TypeCheckResult;
  /** Execution output */
  readonly output: readonly PlaygroundOutput[];
  /** Whether code is currently running */
  readonly isRunning: boolean;
  /** Selected example (if any) */
  readonly selectedExample?: string | undefined;
}

/**
 * Playground output entry.
 */
export interface PlaygroundOutput {
  /** Output type */
  readonly type: 'log' | 'warn' | 'error' | 'result';
  /** Output message */
  readonly message: string;
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Playground example snippet.
 */
export interface PlaygroundExample {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Category */
  readonly category: string;
  /** Source code */
  readonly code: string;
}

// ============================================================================
// DEFAULT EXAMPLES
// ============================================================================

/**
 * Built-in playground examples.
 */
export const PLAYGROUND_EXAMPLES: readonly PlaygroundExample[] = Object.freeze([
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Simple "Hello, World!" card',
    category: 'basics',
    code: `card HelloWorld {
  process(input) {
    return "Hello, World!";
  }
}`,
  },
  {
    id: 'gain-card',
    name: 'Gain Card',
    description: 'Adjustable gain control',
    category: 'audio',
    code: `card Gain {
  param gain: float = 1.0 {
    range: [0.0, 2.0],
    unit: "linear"
  };
  
  process(input: audio) {
    return input * this.gain;
  }
}`,
  },
  {
    id: 'note-generator',
    name: 'Note Generator',
    description: 'Generate MIDI notes',
    category: 'midi',
    code: `card NoteGenerator {
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
  },
  {
    id: 'arpeggiator',
    name: 'Simple Arpeggiator',
    description: 'Arpeggiate incoming chords',
    category: 'transform',
    code: `card SimpleArp {
  param rate: float = 0.125 {
    range: [0.0625, 1.0],
    unit: "beats"
  };
  
  param direction: enum = "up" {
    options: ["up", "down", "updown"]
  };
  
  process(input: note[]) {
    let notes = sortByPitch(input);
    
    if (this.direction === "down") {
      notes = reverse(notes);
    }
    
    let output = [];
    let time = 0;
    
    for (let note of notes) {
      output.push({
        ...note,
        start: time,
        duration: ticksPerBeat * this.rate
      });
      time += ticksPerBeat * this.rate;
    }
    
    return output;
  }
}`,
  },
  {
    id: 'filter-card',
    name: 'Low-Pass Filter',
    description: 'Simple low-pass filter',
    category: 'audio',
    code: `card LowPassFilter {
  param cutoff: float = 1000.0 {
    range: [20.0, 20000.0],
    unit: "hz",
    curve: "log"
  };
  
  param resonance: float = 0.5 {
    range: [0.0, 1.0]
  };
  
  state: {
    buffer: float[] = []
  };
  
  process(input: audio) {
    // Simple 1-pole low-pass implementation
    let alpha = 2 * PI * this.cutoff / sampleRate;
    let output = [];
    
    for (let i = 0; i < input.length; i++) {
      if (this.state.buffer.length === 0) {
        this.state.buffer = [input[i]];
      } else {
        let prev = this.state.buffer[0];
        let current = prev + alpha * (input[i] - prev);
        this.state.buffer = [current];
      }
      output.push(this.state.buffer[0]);
    }
    
    return output;
  }
}`,
  },
]);

// ============================================================================
// PLAYGROUND STATE MANAGEMENT
// ============================================================================

export function createPlaygroundState(initialCode?: string): PlaygroundState {
  const code = initialCode ?? PLAYGROUND_EXAMPLES[0]!.code;
  const example = PLAYGROUND_EXAMPLES.find(ex => ex.code === code);
  
  return Object.freeze({
    code,
    isDirty: false,
    typeCheckResult: { errors: [], types: new Map(), success: true },
    output: [],
    isRunning: false,
    selectedExample: example?.id,
  });
}

/**
 * Update playground code.
 */
export function updatePlaygroundCode(
  state: PlaygroundState,
  code: string
): PlaygroundState {
  return Object.freeze({
    ...state,
    code,
    isDirty: true,
    selectedExample: undefined,
  });
}

export function loadPlaygroundExample(
  state: PlaygroundState,
  exampleId: string
): PlaygroundState {
  const example = PLAYGROUND_EXAMPLES.find(ex => ex.id === exampleId);
  if (!example) {
    return state;
  }
  
  return Object.freeze({
    ...state,
    code: example.code,
    isDirty: false,
    typeCheckResult: { errors: [], types: new Map(), success: true },
    output: [],
    selectedExample: exampleId,
  });
}

export function checkPlaygroundCode(state: PlaygroundState): PlaygroundState {
  try {
    const parseResult = parse(state.code);
    if (!parseResult.success) {
      return Object.freeze({
        ...state,
        typeCheckResult: {
          errors: parseResult.errors.map(err => ({
            message: err.message,
            span: err.token.span,
            severity: 'error' as const,
          })),
          types: new Map(),
          success: false,
        },
      });
    }
    
    const typeCheckResult = typeCheck(parseResult.ast);
    
    return Object.freeze({
      ...state,
      typeCheckResult,
    });
  } catch (error) {
    return Object.freeze({
      ...state,
      typeCheckResult: {
        errors: [{
          message: String(error),
          span: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 1, offset: 0 } },
          severity: 'error' as const,
        }],
        types: new Map(),
        success: false,
      },
    });
  }
}

/**
 * Run playground code (simplified - just check for now).
 */
export async function runPlaygroundCode(
  state: PlaygroundState
): Promise<PlaygroundState> {
  // Check code first
  state = checkPlaygroundCode(state);
  
  if (state.typeCheckResult.errors.length > 0) {
    return Object.freeze({
      ...state,
      output: [
        ...state.output,
        {
          type: 'error' as const,
          message: 'Code has errors, cannot run',
          timestamp: Date.now(),
        },
      ],
    });
  }
  
  // Set running state
  state = Object.freeze({
    ...state,
    isRunning: true,
  });
  
  try {
    // In a real implementation, this would execute the CardScript
    // For now, just return success
    const result = { message: 'Code checked successfully' };
    
    return Object.freeze({
      ...state,
      isRunning: false,
      output: [
        ...state.output,
        {
          type: 'result' as const,
          message: JSON.stringify(result, null, 2),
          timestamp: Date.now(),
        },
      ],
    });
  } catch (error) {
    return Object.freeze({
      ...state,
      isRunning: false,
      output: [
        ...state.output,
        {
          type: 'error' as const,
          message: String(error),
          timestamp: Date.now(),
        },
      ],
    });
  }
}

/**
 * Clear playground output.
 */
export function clearPlaygroundOutput(state: PlaygroundState): PlaygroundState {
  return Object.freeze({
    ...state,
    output: [],
  });
}

/**
 * Add log message to playground output.
 */
export function logToPlayground(
  state: PlaygroundState,
  type: 'log' | 'warn' | 'error',
  message: string
): PlaygroundState {
  return Object.freeze({
    ...state,
    output: [
      ...state.output,
      {
        type,
        message,
        timestamp: Date.now(),
      },
    ],
  });
}

// ============================================================================
// UI RENDERING (HTML Generation)
// ============================================================================

/**
 * Render playground to HTML string.
 */
export function renderPlaygroundHTML(state: PlaygroundState): string {
  const errorList = state.typeCheckResult.errors.length > 0
    ? `<div class="playground-errors">
        <h3>Errors</h3>
        <ul>
          ${state.typeCheckResult.errors.map((err) => `
            <li class="error-${err.severity}">
              <strong>Error</strong>: ${err.message}
            </li>
          `).join('')}
        </ul>
      </div>`
    : '';
  
  const outputList = state.output.length > 0
    ? `<div class="playground-output">
        <h3>Output</h3>
        <div class="output-list">
          ${state.output.map((out) => `
            <div class="output-${out.type}">
              <span class="timestamp">${new Date(out.timestamp).toLocaleTimeString()}</span>
              <pre>${out.message}</pre>
            </div>
          `).join('')}
        </div>
      </div>`
    : '';
  
  const examplesList = `<div class="playground-examples">
    <h3>Examples</h3>
    <ul>
      ${PLAYGROUND_EXAMPLES.map((ex) => `
        <li class="${state.selectedExample === ex.id ? 'selected' : ''}">
          <button data-example-id="${ex.id}">
            <strong>${ex.name}</strong>
            <span class="category">${ex.category}</span>
          </button>
          <p>${ex.description}</p>
        </li>
      `).join('')}
    </ul>
  </div>`;
  
  const highlightedCode = highlight(state.code);
  
  return `
    <div class="cardscript-playground">
      <div class="playground-header">
        <h2>CardScript Playground</h2>
        <div class="playground-actions">
          <button class="btn-run" ${state.isRunning ? 'disabled' : ''}>
            ${state.isRunning ? '⏳ Running...' : '▶️ Run'}
          </button>
          <button class="btn-clear">🗑️ Clear Output</button>
          <button class="btn-check">✓ Check</button>
        </div>
      </div>
      
      <div class="playground-layout">
        <div class="playground-sidebar">
          ${examplesList}
        </div>
        
        <div class="playground-main">
          <div class="playground-editor">
            <textarea
              class="code-editor"
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
            >${state.code}</textarea>
            <div class="code-highlight">${highlightedCode}</div>
          </div>
          
          ${errorList}
          ${outputList}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate CSS for playground.
 */
export function getPlaygroundCSS(): string {
  return `
    .cardscript-playground {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .playground-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #ccc;
      background: #f5f5f5;
    }
    
    .playground-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .playground-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .playground-actions button {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    .playground-actions button:hover:not([disabled]) {
      background: #e0e0e0;
    }
    
    .playground-actions button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .playground-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .playground-sidebar {
      width: 250px;
      border-right: 1px solid #ccc;
      overflow-y: auto;
      padding: 1rem;
      background: #fafafa;
    }
    
    .playground-sidebar h3 {
      margin-top: 0;
      font-size: 1rem;
    }
    
    .playground-sidebar ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .playground-sidebar li {
      margin-bottom: 0.5rem;
    }
    
    .playground-sidebar button {
      width: 100%;
      text-align: left;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.85rem;
    }
    
    .playground-sidebar li.selected button {
      background: #007bff;
      color: white;
      border-color: #0056b3;
    }
    
    .playground-sidebar .category {
      display: block;
      font-size: 0.75rem;
      opacity: 0.7;
      margin-top: 0.25rem;
    }
    
    .playground-sidebar p {
      font-size: 0.75rem;
      color: #666;
      margin: 0.25rem 0 0 0;
    }
    
    .playground-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .playground-editor {
      flex: 1;
      position: relative;
      overflow: auto;
      background: #1e1e1e;
    }
    
    .code-editor {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 1rem;
      border: none;
      outline: none;
      background: transparent;
      color: transparent;
      caret-color: white;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      z-index: 1;
    }
    
    .code-highlight {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 1rem;
      pointer-events: none;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre;
      overflow: auto;
    }
    
    .playground-errors,
    .playground-output {
      border-top: 1px solid #ccc;
      padding: 1rem;
      max-height: 200px;
      overflow-y: auto;
      background: #fff;
    }
    
    .playground-errors h3,
    .playground-output h3 {
      margin-top: 0;
      font-size: 1rem;
    }
    
    .playground-errors ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .playground-errors li {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-left: 3px solid #dc3545;
      background: #fff5f5;
      font-size: 0.85rem;
    }
    
    .error-warning {
      border-color: #ffc107;
      background: #fffbf0;
    }
    
    .error-info {
      border-color: #17a2b8;
      background: #f0f9fb;
    }
    
    .suggestions {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #ddd;
      font-size: 0.8rem;
    }
    
    .output-list {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.85rem;
    }
    
    .output-list > div {
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      border-left: 3px solid #28a745;
      background: #f0fff0;
    }
    
    .output-error {
      border-color: #dc3545;
      background: #fff5f5;
    }
    
    .output-warn {
      border-color: #ffc107;
      background: #fffbf0;
    }
    
    .timestamp {
      font-size: 0.75rem;
      opacity: 0.6;
      margin-right: 0.5rem;
    }
    
    .output-list pre {
      margin: 0.25rem 0 0 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `;
}
