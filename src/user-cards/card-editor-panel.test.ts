/**
 * @fileoverview Tests for Card Editor Panel.
 * 
 * @module @cardplay/user-cards/card-editor-panel.test
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Mock DOM for UI tests
const { JSDOM } = await import('jsdom');

let dom: any;
beforeAll(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  (global as any).document = dom.window.document;
  (global as any).window = dom.window;
  (global as any).HTMLElement = dom.window.HTMLElement;
});

// Import functions after DOM is set up
const {
  createEditorState,
  updateCode,
  updateMetadata,
  setLayoutMode,
  setActiveTab,
  loadTemplate,
  undo,
  redo,
  markSaved,
  addParameter,
  removeParameter,
  updateParameter,
  addInputPort,
  removeInputPort,
  addOutputPort,
  removeOutputPort,
  exportCard,
  CARD_TEMPLATES,
  createTestRunnerUI,
  createBuildConsoleUI,
  createExportPublishUI,
  createTemplatePickerUI,
  createUndoRedoToolbar,
} = await import('./card-editor-panel');

import type { CardEditorState, ParameterUIConfig, PortUIConfig } from './card-editor-panel';

describe('Card Editor State', () => {
  describe('createEditorState', () => {
    it('should create initial state with default card', () => {
      const state = createEditorState();
      
      expect(state.isDirty).toBe(false);
      expect(state.layoutMode).toBe('split-horizontal');
      expect(state.activeTab).toBe('code');
      expect(state.buildErrors).toHaveLength(0);
      expect(state.testResults).toHaveLength(0);
      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });
    
    it('should use provided card definition', () => {
      const customDef = {
        id: 'test-card',
        name: 'Test Card',
        description: 'Test',
        version: '1.0.0',
        category: 'custom' as const,
        author: 'Tester',
        license: 'MIT',
        icon: '🧪',
        color: '#00ff00',
        tags: ['test'],
        parameters: [],
        inputs: [],
        outputs: [],
        source: 'card TestCard {}',
      };
      
      const state = createEditorState(customDef);
      
      expect(state.cardDef.id).toBe('test-card');
      expect(state.cardDef.name).toBe('Test Card');
      expect(state.cardDef.icon).toBe('🧪');
    });
  });
  
  describe('updateCode', () => {
    it('should update code and add to history', () => {
      const state = createEditorState();
      const newCode = 'card MyCard { process(input) { return input * 2; } }';
      
      const updated = updateCode(state, newCode);
      
      expect(updated.code).toBe(newCode);
      expect(updated.isDirty).toBe(true);
      expect(updated.history).toHaveLength(2);
      expect(updated.historyIndex).toBe(1);
    });
    
    it('should detect syntax errors', () => {
      const state = createEditorState();
      const badCode = 'card MyCard { this is not valid }';
      
      const updated = updateCode(state, badCode);
      
      expect(updated.buildErrors.length).toBeGreaterThan(0);
      expect(updated.buildErrors[0].type).toBe('syntax');
    });
  });
  
  describe('updateMetadata', () => {
    it('should update card metadata', () => {
      const state = createEditorState();
      
      const updated = updateMetadata(state, 'name', 'New Card Name');
      
      expect(updated.cardDef.name).toBe('New Card Name');
      expect(updated.isDirty).toBe(true);
      expect(updated.history).toHaveLength(2);
    });
    
    it('should update icon', () => {
      const state = createEditorState();
      
      const updated = updateMetadata(state, 'icon', '🎸');
      
      expect(updated.cardDef.icon).toBe('🎸');
    });
    
    it('should update color', () => {
      const state = createEditorState();
      
      const updated = updateMetadata(state, 'color', '#ff0000');
      
      expect(updated.cardDef.color).toBe('#ff0000');
    });
  });
  
  describe('Layout and Tabs', () => {
    it('should change layout mode', () => {
      const state = createEditorState();
      
      const updated = setLayoutMode(state, 'split-vertical');
      
      expect(updated.layoutMode).toBe('split-vertical');
      expect(updated.isDirty).toBe(false); // Layout change doesn't dirty state
    });
    
    it('should change active tab', () => {
      const state = createEditorState();
      
      const updated = setActiveTab(state, 'parameters');
      
      expect(updated.activeTab).toBe('parameters');
    });
  });
  
  describe('Templates', () => {
    it('should load empty template', () => {
      const state = createEditorState();
      
      const updated = loadTemplate(state, 'empty');
      
      expect(updated.code).toBe(CARD_TEMPLATES[0].code);
      expect(updated.isDirty).toBe(true);
    });
    
    it('should load generator template', () => {
      const state = createEditorState();
      
      const updated = loadTemplate(state, 'generator');
      
      expect(updated.code).toContain('MyGenerator');
      expect(updated.cardDef.icon).toBe('🎵');
    });
    
    it('should ignore unknown template', () => {
      const state = createEditorState();
      
      const updated = loadTemplate(state, 'nonexistent');
      
      expect(updated).toBe(state); // No change
    });
  });
  
  describe('Undo/Redo', () => {
    it('should undo code change', () => {
      let state = createEditorState();
      const originalCode = state.code;
      
      state = updateCode(state, 'new code');
      state = undo(state);
      
      expect(state.code).toBe(originalCode);
      expect(state.historyIndex).toBe(0);
    });
    
    it('should redo code change', () => {
      let state = createEditorState();
      const newCode = 'new code';
      
      state = updateCode(state, newCode);
      state = undo(state);
      state = redo(state);
      
      expect(state.code).toBe(newCode);
      expect(state.historyIndex).toBe(1);
    });
    
    it('should not undo past beginning', () => {
      let state = createEditorState();
      
      state = undo(state);
      state = undo(state);
      
      expect(state.historyIndex).toBe(0);
    });
    
    it('should not redo past end', () => {
      let state = createEditorState();
      state = updateCode(state, 'new code');
      
      state = redo(state);
      state = redo(state);
      
      expect(state.historyIndex).toBe(1);
    });
    
    it('should branch history on edit after undo', () => {
      let state = createEditorState();
      
      state = updateCode(state, 'version 1');
      state = updateCode(state, 'version 2');
      state = undo(state);
      state = updateCode(state, 'version 3');
      
      expect(state.history).toHaveLength(3);
      expect(state.historyIndex).toBe(2);
      expect(state.code).toBe('version 3');
    });
  });
  
  describe('Parameters', () => {
    it('should add parameter', () => {
      const state = createEditorState();
      const param: ParameterUIConfig = {
        id: 'gain',
        name: 'Gain',
        type: 'float',
        defaultValue: 1.0,
        range: [0, 2],
        unit: 'linear',
      };
      
      const updated = addParameter(state, param);
      
      expect(updated.cardDef.parameters).toHaveLength(1);
      expect(updated.cardDef.parameters[0].id).toBe('gain');
    });
    
    it('should remove parameter', () => {
      let state = createEditorState();
      const param: ParameterUIConfig = {
        id: 'gain',
        name: 'Gain',
        type: 'float',
        defaultValue: 1.0,
      };
      
      state = addParameter(state, param);
      state = removeParameter(state, 'gain');
      
      expect(state.cardDef.parameters).toHaveLength(0);
    });
    
    it('should update parameter', () => {
      let state = createEditorState();
      const param: ParameterUIConfig = {
        id: 'gain',
        name: 'Gain',
        type: 'float',
        defaultValue: 1.0,
      };
      
      state = addParameter(state, param);
      state = updateParameter(state, 'gain', { name: 'Volume' });
      
      expect(state.cardDef.parameters[0].name).toBe('Volume');
    });
  });
  
  describe('Ports', () => {
    it('should add input port', () => {
      const state = createEditorState();
      const port: PortUIConfig = {
        id: 'audio-in',
        name: 'Audio In',
        direction: 'input',
        type: 'audio',
        required: true,
      };
      
      const updated = addInputPort(state, port);
      
      expect(updated.cardDef.inputs).toHaveLength(1);
      expect(updated.cardDef.inputs[0].id).toBe('audio-in');
    });
    
    it('should remove input port', () => {
      let state = createEditorState();
      const port: PortUIConfig = {
        id: 'audio-in',
        name: 'Audio In',
        direction: 'input',
        type: 'audio',
        required: true,
      };
      
      state = addInputPort(state, port);
      state = removeInputPort(state, 'audio-in');
      
      expect(state.cardDef.inputs).toHaveLength(0);
    });
    
    it('should add output port', () => {
      const state = createEditorState();
      const port: PortUIConfig = {
        id: 'audio-out',
        name: 'Audio Out',
        direction: 'output',
        type: 'audio',
        required: true,
      };
      
      const updated = addOutputPort(state, port);
      
      expect(updated.cardDef.outputs).toHaveLength(1);
      expect(updated.cardDef.outputs[0].id).toBe('audio-out');
    });
    
    it('should remove output port', () => {
      let state = createEditorState();
      const port: PortUIConfig = {
        id: 'audio-out',
        name: 'Audio Out',
        direction: 'output',
        type: 'audio',
        required: true,
      };
      
      state = addOutputPort(state, port);
      state = removeOutputPort(state, 'audio-out');
      
      expect(state.cardDef.outputs).toHaveLength(0);
    });
  });
  
  describe('Save Management', () => {
    it('should mark as saved', () => {
      let state = createEditorState();
      
      state = updateCode(state, 'new code');
      expect(state.isDirty).toBe(true);
      
      state = markSaved(state);
      expect(state.isDirty).toBe(false);
    });
  });
  
  describe('Export', () => {
    it('should export card as manifest', () => {
      const state = createEditorState();
      
      const manifest = exportCard(state);
      
      expect(manifest.manifestVersion).toBe('1.0.0');
      expect(manifest.cards).toHaveLength(1);
      expect(manifest.cards[0].file).toBe(state.cardDef.id + '.cardscript');
    });
  });
  
  describe('UI Components', () => {
    it('should create test runner UI with empty state', () => {
      const state = createEditorState();
      const onRunTests = () => {};
      const ui = createTestRunnerUI(state, onRunTests);
      
      expect(ui).toBeInstanceOf(dom.window.HTMLElement);
      expect(ui.textContent).toContain('Tests');
      expect(ui.textContent).toContain('Run Tests');
    });
    
    it('should create test runner UI with test results', () => {
      let state = createEditorState();
      state = Object.freeze({
        ...state,
        testResults: [
          { name: 'Test 1', passed: true, duration: 10 },
          { name: 'Test 2', passed: false, duration: 20, message: 'Failed' },
        ],
      });
      
      const ui = createTestRunnerUI(state, () => {});
      
      expect(ui.textContent).toContain('Test 1');
      expect(ui.textContent).toContain('Test 2');
      expect(ui.textContent).toContain('1/2 tests passed');
    });
    
    it('should create build console UI with errors', () => {
      let state = createEditorState();
      state = Object.freeze({
        ...state,
        buildErrors: [
          { line: 5, column: 10, message: 'Syntax error' },
        ],
      });
      
      const ui = createBuildConsoleUI(state);
      
      expect(ui).toBeInstanceOf(dom.window.HTMLElement);
      expect(ui.textContent).toContain('Build Output');
      expect(ui.textContent).toContain('Syntax error');
    });
    
    it('should create build console UI with success', () => {
      let state = createEditorState();
      state = Object.freeze({
        ...state,
        typeCheckResult: { errors: [], types: new Map(), success: true },
      });
      const ui = createBuildConsoleUI(state);
      
      expect(ui.textContent).toContain('Build successful');
    });
    
    it('should create export/publish UI', () => {
      const state = createEditorState();
      const onExport = () => {};
      const onPublish = () => {};
      const ui = createExportPublishUI(state, onExport, onPublish);
      
      expect(ui).toBeInstanceOf(dom.window.HTMLElement);
      expect(ui.textContent).toContain('Export Card');
      expect(ui.textContent).toContain('Publish to Marketplace');
    });
    
    it('should disable export/publish when dirty', () => {
      let state = createEditorState();
      state = updateCode(state, 'modified code');
      
      const ui = createExportPublishUI(state, () => {}, () => {});
      
      expect(ui.textContent).toContain('Save changes before exporting');
    });
    
    it('should create template picker UI', () => {
      const onSelect = () => {};
      const ui = createTemplatePickerUI(onSelect);
      
      expect(ui).toBeInstanceOf(dom.window.HTMLElement);
      expect(ui.textContent).toContain('Choose a Card Template');
      
      for (const template of CARD_TEMPLATES) {
        expect(ui.textContent).toContain(template.name);
      }
    });
    
    it('should create undo/redo toolbar', () => {
      const state = createEditorState();
      const ui = createUndoRedoToolbar(state, () => {}, () => {});
      
      expect(ui).toBeInstanceOf(dom.window.HTMLElement);
      expect(ui.textContent).toContain('Undo');
      expect(ui.textContent).toContain('Redo');
      expect(ui.textContent).toContain('1/1');
    });
    
    it('should enable undo after changes', () => {
      let state = createEditorState();
      state = updateCode(state, 'modified');
      
      const ui = createUndoRedoToolbar(state, () => {}, () => {});
      
      expect(ui.textContent).toContain('2/2');
    });
  });
});
