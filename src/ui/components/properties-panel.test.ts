/**
 * @fileoverview Properties Panel Tests
 * 
 * @module @cardplay/ui/components/properties-panel.test
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PropertiesPanel } from './properties-panel';
import { getSelectionStore } from '../../state/selection-state';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { createEvent } from '../../types/event';
import { asTick, asTickDuration } from '../../types/primitives';
import { asEventStreamId } from '../../state/types';

describe('PropertiesPanel', () => {
  let panel: PropertiesPanel | null;
  
  beforeEach(() => {
    panel = null;
  });
  
  afterEach(() => {
    if (panel) {
      panel.destroy();
      panel = null;
    }
  });

  it('should create a panel element', () => {
    panel = new PropertiesPanel();
    const element = panel.getElement();
    expect(element).toBeDefined();
    expect(element.className).toBe('properties-panel');
  });

  it('should show empty state when nothing is selected', () => {
    panel = new PropertiesPanel();
    const element = panel.getElement();
    expect(element.textContent).toContain('No selection');
  });

  it('should update when an event is selected', () => {
    panel = new PropertiesPanel();
    
    // Create a test stream with an event
    const eventStore = getSharedEventStore();
    const streamId = asEventStreamId('test-stream');
    
    eventStore.createStream({ id: streamId, name: 'Test Stream', events: [] });
    
    const event = createEvent({
      kind: 'note',
      start: asTick(0),
      duration: asTickDuration(100),
      payload: { note: 60, velocity: 100 }
    });
    
    eventStore.addEvent(streamId, event);
    
    // Select the event
    const selectionStore = getSelectionStore();
    selectionStore.select([event.id], streamId);
    
    // Panel should update to show event properties
    const element = panel.getElement();
    expect(element.textContent).toContain('Event Properties');
    expect(element.textContent).toContain(event.id);
  });

  it('should show multi-event selection count', () => {
    panel = new PropertiesPanel();
    
    // Clear any previous selection
    const selectionStore = getSelectionStore();
    selectionStore.clearSelection();
    
    // Create a test stream with multiple events
    const eventStore = getSharedEventStore();
    const streamId = asEventStreamId('test-stream-multi');
    
    eventStore.createStream({ id: streamId, name: 'Test Stream Multi', events: [] });
    
    const event1 = createEvent({
      kind: 'note',
      start: asTick(0),
      duration: asTickDuration(100),
      payload: { note: 60, velocity: 100 }
    });
    
    const event2 = createEvent({
      kind: 'note',
      start: asTick(100),
      duration: asTickDuration(100),
      payload: { note: 62, velocity: 100 }
    });
    
    eventStore.addEvent(streamId, event1);
    eventStore.addEvent(streamId, event2);
    
    // Select both events
    selectionStore.select([event1.id, event2.id], streamId);
    
    // Panel should show multi-selection count
    const element = panel.getElement();
    expect(element.textContent).toContain('2 events selected');
  });

  it('should allow config to disable editing', () => {
    const readOnlyPanel = new PropertiesPanel({ allowEditing: false });
    const element = readOnlyPanel.getElement();
    
    expect(element).toBeDefined();
    
    readOnlyPanel.destroy();
  });
});
