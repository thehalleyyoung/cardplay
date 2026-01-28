/**
 * @fileoverview Tests for template preview and editor.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TemplatePreviewGenerator,
  TemplateEditor,
  createTemplateEditor,
  type DeckTemplate,
} from './template-preview';

describe('TemplatePreviewGenerator', () => {
  let generator: TemplatePreviewGenerator;
  
  beforeEach(() => {
    generator = new TemplatePreviewGenerator();
  });
  
  const createTestTemplate = (): DeckTemplate => ({
    id: 'test-template',
    name: 'Test Template',
    category: 'synth',
    description: 'A test template',
    version: '1.0.0',
    tags: ['test'],
    params: [],
    slots: [
      {
        id: 'slot1',
        label: 'Slot 1',
        position: { x: 0, y: 0 },
      },
      {
        id: 'slot2',
        label: 'Slot 2',
        position: { x: 2, y: 0 },
      },
    ],
    connections: [
      {
        from: 'slot1',
        fromPort: 'out',
        to: 'slot2',
        toPort: 'in',
      },
    ],
  });
  
  it('should generate preview', () => {
    const template = createTestTemplate();
    const preview = generator.generatePreview(template);
    
    expect(preview.templateId).toBe('test-template');
    expect(preview.width).toBeGreaterThan(0);
    expect(preview.height).toBeGreaterThan(0);
    expect(preview.elements.length).toBeGreaterThan(0);
  });
  
  it('should export to SVG', async () => {
    const template = createTestTemplate();
    const preview = generator.generatePreview(template);
    
    const svg = await generator.exportPreview(preview, { format: 'svg' });
    
    expect(typeof svg).toBe('string');
    expect((svg as string).includes('<svg')).toBe(true);
  });
  
  it('should include slots and connections in preview', () => {
    const template = createTestTemplate();
    const preview = generator.generatePreview(template);
    
    const slots = preview.elements.filter(e => e.type === 'slot');
    const connections = preview.elements.filter(e => e.type === 'connection');
    
    expect(slots.length).toBe(2);
    expect(connections.length).toBe(1);
  });
});

describe('TemplateEditor', () => {
  let editor: TemplateEditor;
  
  beforeEach(() => {
    const template: DeckTemplate = {
      id: 'test-template',
      name: 'Test Template',
      category: 'synth',
      description: 'A test template',
      version: '1.0.0',
      tags: ['test'],
      params: [],
      slots: [
        {
          id: 'slot1',
          label: 'Slot 1',
          position: { x: 0, y: 0 },
        },
      ],
      connections: [],
    };
    
    editor = createTemplateEditor(template);
  });
  
  it('should add a slot', () => {
    editor.dispatch({
      type: 'add-slot',
      slot: {
        id: 'slot2',
        label: 'Slot 2',
        position: { x: 1, y: 0 },
      },
    });
    
    const template = editor.getTemplate();
    expect(template.slots.length).toBe(2);
  });
  
  it('should remove a slot', () => {
    editor.dispatch({
      type: 'remove-slot',
      slotId: 'slot1',
    });
    
    const template = editor.getTemplate();
    expect(template.slots.length).toBe(0);
  });
  
  it('should move a slot', () => {
    editor.dispatch({
      type: 'move-slot',
      slotId: 'slot1',
      position: { x: 100, y: 100 },
    });
    
    const template = editor.getTemplate();
    const slot = template.slots.find(s => s.id === 'slot1');
    
    expect(slot?.position.x).toBe(100);
    expect(slot?.position.y).toBe(100);
  });
  
  it('should add a connection', () => {
    editor.dispatch({
      type: 'add-slot',
      slot: {
        id: 'slot2',
        label: 'Slot 2',
        position: { x: 1, y: 0 },
      },
    });
    
    editor.dispatch({
      type: 'add-connection',
      connection: {
        from: 'slot1',
        fromPort: 'out',
        to: 'slot2',
        toPort: 'in',
      },
    });
    
    const template = editor.getTemplate();
    expect(template.connections.length).toBe(1);
  });
  
  it('should support undo/redo', () => {
    const originalTemplate = editor.getTemplate();
    
    editor.dispatch({
      type: 'add-slot',
      slot: {
        id: 'slot2',
        label: 'Slot 2',
        position: { x: 1, y: 0 },
      },
    });
    
    expect(editor.getTemplate().slots.length).toBe(2);
    
    editor.dispatch({ type: 'undo' });
    expect(editor.getTemplate().slots.length).toBe(1);
    
    editor.dispatch({ type: 'redo' });
    expect(editor.getTemplate().slots.length).toBe(2);
  });
  
  it('should copy and paste slots', () => {
    editor.dispatch({
      type: 'select-slots',
      slotIds: ['slot1'],
    });
    
    editor.dispatch({ type: 'copy' });
    
    editor.dispatch({
      type: 'paste',
      position: { x: 200, y: 200 },
    });
    
    const template = editor.getTemplate();
    expect(template.slots.length).toBe(2);
  });
  
  it('should add and remove parameters', () => {
    editor.dispatch({
      type: 'add-param',
      param: {
        name: 'testParam',
        label: 'Test Parameter',
        type: 'number',
        default: 0,
      },
    });
    
    expect(editor.getTemplate().params.length).toBe(1);
    
    editor.dispatch({
      type: 'remove-param',
      paramName: 'testParam',
    });
    
    expect(editor.getTemplate().params.length).toBe(0);
  });
  
  it('should notify listeners on state changes', () => {
    let notified = false;
    
    editor.subscribe(() => {
      notified = true;
    });
    
    editor.dispatch({
      type: 'add-slot',
      slot: {
        id: 'slot2',
        label: 'Slot 2',
        position: { x: 1, y: 0 },
      },
    });
    
    expect(notified).toBe(true);
  });
});
