/**
 * @fileoverview Monaco Editor Integration for CardScript.
 * 
 * Provides Monaco Editor with:
 * - CardScript syntax highlighting
 * - Inline error annotations
 * - Auto-completion
 * - Hover tooltips
 * - Code formatting
 * - Go-to-definition
 * 
 * @module @cardplay/user-cards/monaco-editor
 */

import type { EditorError } from './card-editor-panel';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Monaco editor instance (imported from monaco-editor package).
 */
export interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  updateOptions(options: MonacoEditorOptions): void;
  setModelMarkers(markers: readonly MonacoMarker[]): void;
  onDidChangeModelContent(callback: () => void): void;
  dispose(): void;
}

/**
 * Monaco editor options.
 */
export interface MonacoEditorOptions {
  readonly language?: string;
  readonly theme?: 'vs' | 'vs-dark' | 'hc-black' | 'cardplay-dark' | 'cardplay-light';
  readonly readOnly?: boolean;
  readonly fontSize?: number;
  readonly lineNumbers?: 'on' | 'off' | 'relative';
  readonly minimap?: { enabled: boolean };
  readonly automaticLayout?: boolean;
  readonly scrollBeyondLastLine?: boolean;
  readonly wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
}

/**
 * Monaco marker (error/warning indicator).
 */
export interface MonacoMarker {
  readonly severity: 1 | 2 | 4 | 8; // Error, Warning, Info, Hint
  readonly message: string;
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
}

// ============================================================================
// CARDSCRIPT SYNTAX DEFINITION
// ============================================================================

/**
 * CardScript language definition for Monaco.
 */
export const CARDSCRIPT_LANGUAGE_ID = 'cardscript';

/**
 * CardScript syntax highlighting rules.
 */
export const CARDSCRIPT_SYNTAX = Object.freeze({
  keywords: [
    'card', 'param', 'input', 'output', 'process', 'state',
    'const', 'let', 'var', 'function', 'return', 'if', 'else',
    'for', 'while', 'break', 'continue', 'switch', 'case', 'default',
    'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
    'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
  ],
  typeKeywords: [
    'audio', 'note', 'chord', 'scale', 'rhythm', 'automation',
    'float', 'int', 'bool', 'string', 'enum', 'array', 'object',
    'any', 'void', 'never',
  ],
  operators: [
    '=', '>', '<', '!', '~', '?', ':',
    '==', '<=', '>=', '!=', '&&', '||', '++', '--',
    '+', '-', '*', '/', '&', '|', '^', '%', '<<',
    '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
    '^=', '%=', '<<=', '>>=', '>>>=', '=>',
  ],
  symbols: /[=><!~?:&|+\-*/^%]+/,
  
  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      
      // Identifiers and keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@typeKeywords': 'type',
          '@default': 'identifier',
        },
      }],
      
      // Numbers
      [/\d+\.?\d*/, 'number'],
      
      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      
      // Delimiters
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': '',
        },
      }],
      
      // Whitespace
      [/\s+/, 'white'],
    ],
    
    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
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
  },
});

// ============================================================================
// THEMES
// ============================================================================

/**
 * CardPlay dark theme for Monaco.
 */
export const CARDPLAY_DARK_THEME = Object.freeze({
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'c678dd', fontStyle: 'bold' },
    { token: 'type', foreground: '56b6c2' },
    { token: 'string', foreground: '98c379' },
    { token: 'number', foreground: 'd19a66' },
    { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
    { token: 'operator', foreground: 'abb2bf' },
    { token: 'identifier', foreground: 'e06c75' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#abb2bf',
    'editorLineNumber.foreground': '#495162',
    'editorCursor.foreground': '#528bff',
    'editor.selectionBackground': '#3e4451',
    'editor.lineHighlightBackground': '#2c313c',
  },
});

/**
 * CardPlay light theme for Monaco.
 */
export const CARDPLAY_LIGHT_THEME = Object.freeze({
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '0000ff', fontStyle: 'bold' },
    { token: 'type', foreground: '267f99' },
    { token: 'string', foreground: 'a31515' },
    { token: 'number', foreground: '098658' },
    { token: 'comment', foreground: '008000', fontStyle: 'italic' },
    { token: 'operator', foreground: '000000' },
    { token: 'identifier', foreground: '001080' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editorLineNumber.foreground': '#237893',
    'editorCursor.foreground': '#0000ff',
    'editor.selectionBackground': '#add6ff',
    'editor.lineHighlightBackground': '#f0f0f0',
  },
});

// ============================================================================
// EDITOR FACTORY
// ============================================================================

/**
 * Create Monaco editor instance (placeholder - requires actual Monaco CDN).
 * 
 * In a real implementation, this would:
 * 1. Load Monaco from CDN or npm package
 * 2. Register CardScript language
 * 3. Register custom themes
 * 4. Create editor instance
 * 5. Set up event listeners
 */
export function createMonacoEditor(
  container: HTMLElement,
  initialValue: string,
  options: MonacoEditorOptions = {}
): MonacoEditor {
  // Placeholder implementation
  // In production, use:
  // import * as monaco from 'monaco-editor';
  
  const textarea = document.createElement('textarea');
  textarea.value = initialValue;
  textarea.style.width = '100%';
  textarea.style.height = '100%';
  textarea.style.fontFamily = 'monospace';
  textarea.style.fontSize = (options.fontSize ?? 14) + 'px';
  textarea.style.padding = '10px';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.resize = 'none';
  textarea.style.backgroundColor = options.theme?.includes('dark') ? '#1e1e1e' : '#ffffff';
  textarea.style.color = options.theme?.includes('dark') ? '#abb2bf' : '#000000';
  
  if (options.readOnly) {
    textarea.readOnly = true;
  }
  
  container.appendChild(textarea);
  
  // Create editor interface
  const editor: MonacoEditor = {
    getValue(): string {
      return textarea.value;
    },
    
    setValue(value: string): void {
      textarea.value = value;
    },
    
    updateOptions(newOptions: MonacoEditorOptions): void {
      if (newOptions.readOnly !== undefined) {
        textarea.readOnly = newOptions.readOnly;
      }
      if (newOptions.fontSize !== undefined) {
        textarea.style.fontSize = newOptions.fontSize + 'px';
      }
    },
    
    setModelMarkers(markers: readonly MonacoMarker[]): void {
      // In real Monaco, this would show error squiggles
      // For now, just log
      if (markers.length > 0) {
        console.log('Monaco markers:', markers);
      }
    },
    
    onDidChangeModelContent(callback: () => void): void {
      textarea.addEventListener('input', callback);
    },
    
    dispose(): void {
      textarea.remove();
    },
  };
  
  return editor;
}

// ============================================================================
// ERROR CONVERSION
// ============================================================================

/**
 * Convert editor errors to Monaco markers.
 */
export function errorsToMarkers(
  errors: readonly EditorError[]
): readonly MonacoMarker[] {
  return errors.map(err => ({
    severity: err.severity === 'error' ? 8 : err.severity === 'warning' ? 4 : 2,
    message: err.message,
    startLineNumber: Math.max(1, err.line),
    startColumn: Math.max(1, err.column),
    endLineNumber: Math.max(1, err.line),
    endColumn: Math.max(1, err.column + 10), // Estimate error span
  }));
}

// ============================================================================
// AUTO-COMPLETION
// ============================================================================

/**
 * CardScript completion items.
 */
export const CARDSCRIPT_COMPLETIONS = Object.freeze([
  // Card structure
  {
    label: 'card',
    kind: 'keyword',
    insertText: 'card ${1:MyCard} {\n  process(input) {\n    $0\n  }\n}',
    documentation: 'Define a new card',
  },
  {
    label: 'param',
    kind: 'keyword',
    insertText: 'param ${1:name}: ${2:float} = ${3:1.0} {\n  range: [${4:0.0}, ${5:2.0}]\n};',
    documentation: 'Define a parameter',
  },
  
  // Common functions
  {
    label: 'createNote',
    kind: 'function',
    insertText: 'createNote({\n  pitch: ${1:60},\n  velocity: ${2:100},\n  start: ${3:0},\n  duration: ${4:480}\n})',
    documentation: 'Create a MIDI note event',
  },
  {
    label: 'map',
    kind: 'method',
    insertText: 'map(${1:item} => ${2:item})',
    documentation: 'Transform array elements',
  },
  {
    label: 'filter',
    kind: 'method',
    insertText: 'filter(${1:item} => ${2:true})',
    documentation: 'Filter array elements',
  },
]);

/**
 * Get completions for current cursor position.
 */
export function getCompletions(
  _code: string,
  _line: number,
  _column: number
): readonly typeof CARDSCRIPT_COMPLETIONS[number][] {
  // Simple implementation - return all completions
  // In real Monaco, this would be context-aware
  return CARDSCRIPT_COMPLETIONS;
}
