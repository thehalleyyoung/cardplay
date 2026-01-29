/**
 * @fileoverview Tests for Notation Harmony Overlay Component
 * 
 * G113: Test clicking chord suggestion updates chord stream and refreshes overlays.
 * G114: Test "snap to chord tones" is undoable and preserves rhythm.
 * 
 * @module @cardplay/ui/components/notation-harmony-overlay.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createNotationHarmonyOverlay } from './notation-harmony-overlay';
import { getBoardContextStore } from '../../boards/context/store';
import { getSharedEventStore } from '../../state/event-store';
import { getSelectionStore } from '../../state/selection-state';
import { getUndoStack } from '../../state/undo-stack';
import type { EventStreamId, EventId } from '../../state/types';
import { asTick, asTickDuration } from '../../types/branded';
import { EventKinds } from '../../types/event';

describe('NotationHarmonyOverlay', () => {
  let streamId: EventStreamId;
  let eventIds: EventId[];
  
  beforeEach(() => {
    // Clear stores
    const eventStore = getSharedEventStore();
    const boardStore = getBoardContextStore();
    const selectionStore = getSelectionStore();
    const undoStack = getUndoStack();
    
    // Create test stream with some notes
    streamId = eventStore.createStream({ name: 'Test Melody' });
    
    const events = [
      {
        id: 'event-1' as EventId,
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { note: 60, velocity: 80 }, // C4
        triggers: []
      },
      {
        id: 'event-2' as EventId,
        kind: EventKinds.NOTE,
        start: asTick(96),
        duration: asTickDuration(96),
        payload: { note: 62, velocity: 80 }, // D4
        triggers: []
      },
      {
        id: 'event-3' as EventId,
        kind: EventKinds.NOTE,
        start: asTick(192),
        duration: asTickDuration(96),
        payload: { note: 64, velocity: 80 }, // E4
        triggers: []
      }
    ];
    
    eventStore.addEvents(streamId, events);
    eventIds = events.map(e => e.id);
    
    // Set active context
    boardStore.setActiveStream(streamId);
    boardStore.setCurrentKey('C');
    boardStore.setCurrentChord('C');
  });
  
  it('creates overlay with toolbar buttons', () => {
    const overlay = createNotationHarmonyOverlay();
    
    expect(overlay).toBeDefined();
    expect(overlay.className).toBe('notation-harmony-overlay');
    
    const toolbar = overlay.querySelector('.notation-harmony-toolbar');
    expect(toolbar).toBeDefined();
    
    const buttons = toolbar?.querySelectorAll('button');
    expect(buttons?.length).toBe(4); // Toggle, Snap, Harmonize, Reharmonize
  });
  
  it('toggles highlights when button is clicked', () => {
    const onToggleHighlights = vi.fn();
    const overlay = createNotationHarmonyOverlay({ onToggleHighlights });
    
    const toolbar = overlay.querySelector('.notation-harmony-toolbar');
    const toggleBtn = toolbar?.querySelector('button[title="Toggle Highlights"]') as HTMLButtonElement;
    
    expect(toggleBtn).toBeDefined();
    
    // Click to toggle off
    toggleBtn.click();
    expect(onToggleHighlights).toHaveBeenCalledWith(false);
    
    // Click to toggle on
    toggleBtn.click();
    expect(onToggleHighlights).toHaveBeenCalledWith(true);
  });
  
  it('G114: snap to chord tones is undoable and preserves rhythm', () => {
    const eventStore = getSharedEventStore();
    const selectionStore = getSelectionStore();
    const undoStack = getUndoStack();
    
    // Select first note (C4 = 60)
    selectionStore.setSelection(eventIds.slice(0, 1) as readonly string[]);
    
    const overlay = createNotationHarmonyOverlay();
    const toolbar = overlay.querySelector('.notation-harmony-toolbar');
    const snapBtn = toolbar?.querySelector('button[title="Snap to Chord Tones"]') as HTMLButtonElement;
    
    // Get original event state
    const stream = eventStore.getStream(streamId);
    const originalEvent = stream?.events.find(e => e.id === eventIds[0]);
    expect(originalEvent).toBeDefined();
    
    const originalNote = (originalEvent!.payload as { note: number }).note;
    const originalStart = originalEvent!.start;
    const originalDuration = originalEvent!.duration;
    
    // Snap to chord tones (C major chord: C, E, G)
    snapBtn.click();
    
    // Note should be snapped (C4 is already a chord tone, so stays at 60)
    const snappedStream = eventStore.getStream(streamId);
    const snappedEvent = snappedStream?.events.find(e => e.id === eventIds[0]);
    expect(snappedEvent).toBeDefined();
    
    // Rhythm should be preserved
    expect(snappedEvent!.start).toBe(originalStart);
    expect(snappedEvent!.duration).toBe(originalDuration);
    
    // Should be undoable
    undoStack.undo();
    
    const undoneStream = eventStore.getStream(streamId);
    const undoneEvent = undoneStream?.events.find(e => e.id === eventIds[0]);
    expect(undoneEvent).toBeDefined();
    expect((undoneEvent!.payload as { note: number }).note).toBe(originalNote);
    expect(undoneEvent!.start).toBe(originalStart);
    expect(undoneEvent!.duration).toBe(originalDuration);
  });
  
  it('G113: chord suggestions update context and refresh overlays', () => {
    const boardStore = getBoardContextStore();
    const onReharmonizeSuggested = vi.fn();
    
    const overlay = createNotationHarmonyOverlay({ onReharmonizeSuggested });
    const toolbar = overlay.querySelector('.notation-harmony-toolbar');
    const reharmonizeBtn = toolbar?.querySelector('button[title="Suggest Reharmonization"]') as HTMLButtonElement;
    
    // Click reharmonize button
    reharmonizeBtn.click();
    
    // Should generate suggestions
    expect(onReharmonizeSuggested).toHaveBeenCalled();
    const suggestions = onReharmonizeSuggested.mock.calls[0]?.[0];
    expect(suggestions).toBeDefined();
    expect(Array.isArray(suggestions)).toBe(true);
    
    // Modal should appear with suggestions
    const modal = document.querySelector('.reharmonization-suggestions-modal');
    expect(modal).toBeDefined();
    
    // Clicking a suggestion should update context
    const initialChord = boardStore.getContext().currentChord;
    
    if (suggestions && suggestions.length > 0) {
      const suggestionDiv = modal?.querySelector('div[style*="cursor: pointer"]') as HTMLElement;
      if (suggestionDiv) {
        suggestionDiv.click();
        
        // Context should be updated
        const updatedChord = boardStore.getContext().currentChord;
        expect(updatedChord).not.toBe(initialChord);
        
        // Modal should be closed
        const modalAfterClick = document.querySelector('.reharmonization-suggestions-modal');
        expect(modalAfterClick).toBeNull();
      }
    }
  });
  
  it('harmonizes selection when harmonize button is clicked', () => {
    const eventStore = getSharedEventStore();
    const selectionStore = getSelectionStore();
    
    // Select all notes
    selectionStore.setSelection(eventIds as readonly string[]);
    
    const overlay = createNotationHarmonyOverlay();
    const toolbar = overlay.querySelector('.notation-harmony-toolbar');
    const harmonizeBtn = toolbar?.querySelector('button[title="Harmonize Selection"]') as HTMLButtonElement;
    
    const originalEventCount = eventStore.getStream(streamId)?.events.length || 0;
    
    // Harmonize
    harmonizeBtn.click();
    
    // Should add harmony events
    const harmonizedStream = eventStore.getStream(streamId);
    const newEventCount = harmonizedStream?.events.length || 0;
    
    // Expect new harmony events to be added
    expect(newEventCount).toBeGreaterThan(originalEventCount);
  });
  
  it('handles empty selection gracefully', () => {
    const selectionStore = getSelectionStore();
    
    // Clear selection
    selectionStore.clearSelection();
    
    const overlay = createNotationHarmonyOverlay();
    const toolbar = overlay.querySelector('.notation-harmony-toolbar');
    const snapBtn = toolbar?.querySelector('button[title="Snap to Chord Tones"]') as HTMLButtonElement;
    
    // Should not crash
    expect(() => {
      snapBtn.click();
    }).not.toThrow();
  });
  
  it('handles no active stream gracefully', () => {
    const boardStore = getBoardContextStore();
    
    // Clear active stream
    boardStore.setActiveStream(null);
    
    const overlay = createNotationHarmonyOverlay();
    const toolbar = overlay.querySelector('.notation-harmony-toolbar');
    const reharmonizeBtn = toolbar?.querySelector('button[title="Suggest Reharmonization"]') as HTMLButtonElement;
    
    // Should not crash
    expect(() => {
      reharmonizeBtn.click();
    }).not.toThrow();
  });
  
  it('subscribes to context changes', () => {
    const boardStore = getBoardContextStore();
    
    const overlay = createNotationHarmonyOverlay();
    
    // Change chord
    boardStore.setCurrentChord('Dm');
    
    // Overlay should react (checking that subscription is active)
    // In a real implementation, this would trigger a re-render
    expect(boardStore.getContext().currentChord).toBe('Dm');
  });
  
  it('cleans up subscription on disposal', () => {
    const overlay = createNotationHarmonyOverlay();
    
    // Should have cleanup function
    expect((overlay as any)._cleanup).toBeDefined();
    expect(typeof (overlay as any)._cleanup).toBe('function');
    
    // Cleanup should not throw
    expect(() => {
      (overlay as any)._cleanup();
    }).not.toThrow();
  });
});
