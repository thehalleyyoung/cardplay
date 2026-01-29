/**
 * @fileoverview Testing Panel Component
 * 
 * Provides manual testing controls for verifying board system integration.
 * Implements playground verification items A068-A075.
 * 
 * @module @cardplay/ui/components/test-panel
 */

import { getSharedEventStore } from '../../state/event-store';
import { getSelectionStore } from '../../state/selection-state';
import { getUndoStack } from '../../state/undo-stack';
import { getTransport } from '../../audio/transport';
import { getBoardContextStore } from '../../boards/context/store';
import { asTick, asTickDuration } from '../../types/primitives';
import { generateEventId } from '../../types/event-id';
import { EventKinds } from '../../types/event-kind';

/**
 * Creates a testing panel with manual test buttons
 */
export function createTestPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'test-panel';
  
  // Apply inline styles
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: 'rgba(42, 42, 42, 0.95)',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '16px',
    minWidth: '250px',
    maxWidth: '300px',
    zIndex: '10000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  });
  
  // Title
  const title = document.createElement('div');
  title.textContent = 'Test Controls';
  Object.assign(title.style, {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '8px',
    borderBottom: '1px solid #444',
    paddingBottom: '8px'
  });
  panel.appendChild(title);
  
  // Test buttons
  const buttons: Array<{ label: string; action: () => void; description: string }> = [
    {
      label: '+ Add Note (C4)',
      description: 'A068: Add note to active stream',
      action: addTestNote
    },
    {
      label: '✓ Select Event',
      description: 'A070: Select first event in stream',
      action: selectFirstEvent
    },
    {
      label: '↶ Undo',
      description: 'A072: Test undo operation',
      action: performUndo
    },
    {
      label: '▶ Play',
      description: 'A074: Start transport playback',
      action: togglePlayback
    },
    {
      label: '🗑 Clear Selection',
      description: 'Clear current selection',
      action: clearSelection
    }
  ];
  
  buttons.forEach(({ label, action, description }) => {
    const button = document.createElement('button');
    button.textContent = label;
    button.title = description;
    
    Object.assign(button.style, {
      background: '#444',
      border: '1px solid #555',
      borderRadius: '4px',
      color: '#fff',
      padding: '8px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      textAlign: 'left'
    });
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '#555';
      button.style.borderColor = '#666';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = '#444';
      button.style.borderColor = '#555';
    });
    
    button.addEventListener('click', () => {
      try {
        action();
        console.log(`[TestPanel] ${description} - Success`);
        button.style.borderColor = '#4a4';
        setTimeout(() => {
          button.style.borderColor = '#555';
        }, 500);
      } catch (error) {
        console.error(`[TestPanel] ${description} - Error:`, error);
        button.style.borderColor = '#a44';
        setTimeout(() => {
          button.style.borderColor = '#555';
        }, 500);
      }
    });
    
    panel.appendChild(button);
  });
  
  // Status display
  const status = document.createElement('div');
  status.className = 'test-panel__status';
  Object.assign(status.style, {
    fontSize: '11px',
    color: '#aaa',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #444',
    fontFamily: 'monospace'
  });
  updateStatus(status);
  panel.appendChild(status);
  
  // Update status every second
  setInterval(() => updateStatus(status), 1000);
  
  return panel;
}

/**
 * A068: Add a test note to the active stream
 */
function addTestNote(): void {
  const eventStore = getSharedEventStore();
  const contextStore = getBoardContextStore();
  const context = contextStore.getContext();
  
  if (!context.activeStreamId) {
    console.warn('[TestPanel] No active stream');
    return;
  }
  
  // Create a test note at C4 (MIDI note 60)
  const event = {
    id: generateEventId(),
    kind: EventKinds.NOTE,
    start: asTick(0),
    duration: asTickDuration(480), // Quarter note at 480 PPQ
    payload: {
      note: 60,
      velocity: 80
    }
  };
  
  eventStore.addEvents(context.activeStreamId, [event]);
  console.log('[TestPanel] Added test note:', event);
}

/**
 * A070: Select the first event in the active stream
 */
function selectFirstEvent(): void {
  const eventStore = getSharedEventStore();
  const selectionStore = getSelectionStore();
  const contextStore = getBoardContextStore();
  const context = contextStore.getContext();
  
  if (!context.activeStreamId) {
    console.warn('[TestPanel] No active stream');
    return;
  }
  
  const stream = eventStore.getStream(context.activeStreamId);
  if (!stream || stream.events.length === 0) {
    console.warn('[TestPanel] No events to select');
    return;
  }
  
  const firstEvent = stream.events[0];
  if (firstEvent) {
    selectionStore.setSelection([firstEvent.id], context.activeStreamId);
    console.log('[TestPanel] Selected event:', firstEvent.id);
  }
}

/**
 * Clear current selection
 */
function clearSelection(): void {
  const selectionStore = getSelectionStore();
  selectionStore.clearSelection();
  console.log('[TestPanel] Cleared selection');
}

/**
 * A072: Perform undo operation
 */
function performUndo(): void {
  const undoStack = getUndoStack();
  undoStack.undo();
  console.log('[TestPanel] Performed undo');
}

/**
 * A074: Toggle transport playback
 */
function togglePlayback(): void {
  const transport = getTransport();
  const snapshot = transport.getSnapshot();
  
  if (snapshot.state === 'playing') {
    transport.stop();
    console.log('[TestPanel] Stopped playback');
  } else {
    transport.play();
    console.log('[TestPanel] Started playback');
  }
}

/**
 * Update status display with current state
 */
function updateStatus(statusElement: HTMLElement): void {
  const eventStore = getSharedEventStore();
  const selectionStore = getSelectionStore();
  const transport = getTransport();
  const contextStore = getBoardContextStore();
  
  const context = contextStore.getContext();
  const selection = selectionStore.getState();
  const transportSnapshot = transport.getSnapshot();
  
  const stream = context.activeStreamId 
    ? eventStore.getStream(context.activeStreamId)
    : null;
  const eventCount = stream ? stream.events.length : 0;
  const selectedCount = selection.selected.size;
  
  statusElement.innerHTML = `
    Stream: ${context.activeStreamId ? '✓' : '✗'}<br>
    Events: ${eventCount}<br>
    Selected: ${selectedCount}<br>
    Playing: ${transportSnapshot.state === 'playing' ? '▶' : '⏸'}
  `;
}
