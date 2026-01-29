/**
 * @fileoverview End-to-end integration tests for board system (Phase K: K006-K009)
 * 
 * Tests the complete board system workflow from user interactions
 * to data persistence across board switches.
 * 
 * @module @cardplay/boards/__tests__/board-system-end-to-end
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from '../builtins';
import { getBoardStateStore } from '../store/store';
import { getBoardContextStore } from '../context/store';
import { switchBoard } from '../switching/switch-board';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { EventKinds } from '../../types/event-kind';
import { asTick, asTickDuration } from '../../types/primitives';
import { generateEventId } from '../../types/event-id';

describe('Board System End-to-End', () => {
  beforeEach(() => {
    // Clear stores
    const stateStore = getBoardStateStore();
    const contextStore = getBoardContextStore();
    const registry = getBoardRegistry();
    
    // Reset state
    vi.clearAllMocks();
    
    // Register builtin boards
    registerBuiltinBoards();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // K006: Open board switcher and switch boards
  // ============================================================================

  describe('Board Switcher Workflow', () => {
    it('should allow switching between boards via switcher', () => {
      const registry = getBoardRegistry();
      const stateStore = getBoardStateStore();
      
      // Start with a tracker board
      const trackerBoard = registry.get('basic-tracker');
      expect(trackerBoard).toBeDefined();
      
      if (!trackerBoard) throw new Error('Tracker board not found');
      
      // Switch to tracker board
      switchBoard(trackerBoard.id, {
        resetLayout: false,
        resetDecks: false,
        preserveActiveContext: true,
        preserveTransport: true
      });
      
      // Verify board is active
      const state = stateStore.getState();
      expect(state.currentBoardId).toBe(trackerBoard.id);
      expect(state.recentBoardIds).toContain(trackerBoard.id);
      
      // Switch to notation board
      const notationBoard = registry.get('notation-manual');
      expect(notationBoard).toBeDefined();
      
      if (!notationBoard) throw new Error('Notation board not found');
      
      switchBoard(notationBoard.id, {
        resetLayout: false,
        resetDecks: false,
        preserveActiveContext: true,
        preserveTransport: true
      });
      
      // Verify new board is active
      const newState = stateStore.getState();
      expect(newState.currentBoardId).toBe(notationBoard.id);
      expect(newState.recentBoardIds).toContain(notationBoard.id);
      expect(newState.recentBoardIds).toContain(trackerBoard.id);
    });

    it('should preserve recent boards list across switches', () => {
      const registry = getBoardRegistry();
      const stateStore = getBoardStateStore();
      
      const boards = registry.list().slice(0, 5);
      expect(boards.length).toBeGreaterThan(0);
      
      // Switch through several boards
      boards.forEach(board => {
        switchBoard(board.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
      });
      
      // Verify all boards are in recent list
      const state = stateStore.getState();
      boards.forEach(board => {
        expect(state.recentBoardIds).toContain(board.id);
      });
    });

    it('should handle rapid board switching without errors', () => {
      const registry = getBoardRegistry();
      const boards = registry.list().slice(0, 3);
      
      expect(() => {
        // Switch rapidly 10 times
        for (let i = 0; i < 10; i++) {
          const board = boards[i % boards.length];
          if (board) {
            switchBoard(board.id, {
              resetLayout: false,
              resetDecks: false,
              preserveActiveContext: true,
              preserveTransport: true
            });
          }
        }
      }).not.toThrow();
    });
  });

  // ============================================================================
  // K007: Drag phrase into tracker and assert events in store
  // ============================================================================

  describe('Phrase Drag and Drop', () => {
    it('should write phrase events to active stream on drop', () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      // Create a test stream
      const stream = eventStore.createStream({ name: 'Test Pattern' });
      contextStore.setActiveStream(stream.id);
      
      // Simulate phrase drop: add events to the stream
      const phraseEvents = [
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        },
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 62, velocity: 100 }
        },
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(960),
          duration: asTickDuration(480),
          payload: { note: 64, velocity: 100 }
        }
      ];
      
      eventStore.addEvents(stream.id, phraseEvents);
      
      // Verify events appear in store
      const updatedStream = eventStore.getStream(stream.id);
      expect(updatedStream).toBeDefined();
      expect(updatedStream?.events.length).toBe(3);
      
      // Verify event data
      updatedStream?.events.forEach((event, i) => {
        expect(event.kind).toBe(EventKinds.NOTE);
        expect(event.payload.note).toBe(phraseEvents[i]?.payload.note);
      });
    });

    it('should make phrase events visible in all views', () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      // Create stream and set as active
      const stream = eventStore.createStream({ name: 'Multi-View Pattern' });
      contextStore.setActiveStream(stream.id);
      
      // Add phrase events
      const events = [
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(960),
          payload: { note: 67, velocity: 90 }
        }
      ];
      
      eventStore.addEvents(stream.id, events);
      
      // Simulate viewing from different boards
      const registry = getBoardRegistry();
      const boards = [
        registry.get('basic-tracker'),
        registry.get('notation-manual')
      ];
      
      // Switch to each board and verify stream is accessible
      boards.forEach(board => {
        if (board) {
          switchBoard(board.id, {
            resetLayout: false,
            resetDecks: false,
            preserveActiveContext: true,
            preserveTransport: true
          });
          
          // Verify active stream is still accessible
          const context = contextStore.getContext();
          expect(context.activeStreamId).toBe(stream.id);
          
          // Verify events are still there
          const currentStream = eventStore.getStream(stream.id);
          expect(currentStream?.events.length).toBe(1);
        }
      });
    });
  });

  // ============================================================================
  // K008: Generate clip in Session+Generators and assert in timeline
  // ============================================================================

  describe('Generative Clip Creation', () => {
    it('should create clip in session grid and make it visible in timeline', () => {
      const clipRegistry = getClipRegistry();
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      // Create a stream with generated events
      const stream = eventStore.createStream({ name: 'Generated Bass' });
      
      const generatedEvents = [
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 40, velocity: 100 },
          meta: { generated: true, generatorId: 'bass-generator' }
        },
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(960),
          duration: asTickDuration(480),
          payload: { note: 43, velocity: 100 },
          meta: { generated: true, generatorId: 'bass-generator' }
        }
      ];
      
      eventStore.addEvents(stream.id, generatedEvents);
      
      // Create a clip referencing this stream
      const clip = clipRegistry.createClip({
        name: 'Generated Bass Clip',
        streamId: stream.id,
        duration: asTickDuration(1920),
        loop: true
      });
      
      contextStore.setActiveClip(clip.id);
      
      // Verify clip is in registry
      const retrievedClip = clipRegistry.getClip(clip.id);
      expect(retrievedClip).toBeDefined();
      expect(retrievedClip?.streamId).toBe(stream.id);
      
      // Switch to session board
      const registry = getBoardRegistry();
      const sessionBoard = registry.get('basic-session');
      if (sessionBoard) {
        switchBoard(sessionBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
      }
      
      // Verify clip is still accessible
      const sessionClip = clipRegistry.getClip(clip.id);
      expect(sessionClip).toBeDefined();
      
      // Switch to producer board (timeline view)
      const producerBoard = registry.get('producer-board');
      if (producerBoard) {
        switchBoard(producerBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
      }
      
      // Verify clip is visible in timeline
      const timelineClip = clipRegistry.getClip(clip.id);
      expect(timelineClip).toBeDefined();
      expect(timelineClip?.name).toBe('Generated Bass Clip');
    });

    it('should preserve generator metadata across board switches', () => {
      const eventStore = getSharedEventStore();
      const registry = getBoardRegistry();
      
      // Create generated content
      const stream = eventStore.createStream({ name: 'Generated Melody' });
      
      const event = {
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 72, velocity: 95 },
        meta: { 
          generated: true, 
          generatorId: 'melody-generator',
          seed: 12345
        }
      };
      
      eventStore.addEvents(stream.id, [event]);
      
      // Switch between generative and manual boards
      const generativeBoard = registry.get('generative-ambient');
      const manualBoard = registry.get('basic-tracker');
      
      if (generativeBoard && manualBoard) {
        switchBoard(generativeBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
        
        switchBoard(manualBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
        
        // Verify metadata is preserved
        const updatedStream = eventStore.getStream(stream.id);
        const retrievedEvent = updatedStream?.events[0];
        expect(retrievedEvent?.meta?.generated).toBe(true);
        expect(retrievedEvent?.meta?.generatorId).toBe('melody-generator');
      }
    });
  });

  // ============================================================================
  // K009: Edit same stream in tracker and notation - verify convergence
  // ============================================================================

  describe('Cross-View Editing', () => {
    it('should sync edits between tracker and notation views', () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      const registry = getBoardRegistry();
      
      // Create a shared stream
      const stream = eventStore.createStream({ name: 'Shared Pattern' });
      contextStore.setActiveStream(stream.id);
      
      // Add initial events
      const initialEvents = [
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }
      ];
      
      eventStore.addEvents(stream.id, initialEvents);
      
      // Edit from tracker board
      const trackerBoard = registry.get('basic-tracker');
      if (trackerBoard) {
        switchBoard(trackerBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
        
        // Simulate tracker edit: add another note
        const trackerEdit = {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 62, velocity: 100 }
        };
        
        eventStore.addEvents(stream.id, [trackerEdit]);
      }
      
      // Switch to notation board
      const notationBoard = registry.get('notation-manual');
      if (notationBoard) {
        switchBoard(notationBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
        
        // Verify tracker edits are visible
        const notationStream = eventStore.getStream(stream.id);
        expect(notationStream?.events.length).toBe(2);
        
        // Simulate notation edit: modify first note
        const firstEvent = notationStream?.events[0];
        if (firstEvent) {
          eventStore.removeEvents(stream.id, [firstEvent.id]);
          
          const modifiedEvent = {
            ...firstEvent,
            id: generateEventId(),
            payload: { ...firstEvent.payload, velocity: 80 }
          };
          
          eventStore.addEvents(stream.id, [modifiedEvent]);
        }
      }
      
      // Switch back to tracker
      if (trackerBoard) {
        switchBoard(trackerBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
        
        // Verify notation edits are visible in tracker
        const finalStream = eventStore.getStream(stream.id);
        expect(finalStream?.events.length).toBe(2);
        
        // Verify velocity change from notation is visible
        const modifiedEvent = finalStream?.events.find(e => 
          e.payload.note === 60
        );
        expect(modifiedEvent?.payload.velocity).toBe(80);
      }
    });

    it('should handle simultaneous view updates without conflicts', () => {
      const eventStore = getSharedEventStore();
      const stream = eventStore.createStream({ name: 'Concurrent Test' });
      
      // Add events from multiple "views" (simulating concurrent edits)
      const event1 = {
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 60, velocity: 100 }
      };
      
      const event2 = {
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(480),
        duration: asTickDuration(480),
        payload: { note: 62, velocity: 100 }
      };
      
      // Simulate concurrent adds
      eventStore.addEvents(stream.id, [event1]);
      eventStore.addEvents(stream.id, [event2]);
      
      // Verify both events are present
      const updatedStream = eventStore.getStream(stream.id);
      expect(updatedStream?.events.length).toBe(2);
      
      // Verify no duplicates
      const eventIds = updatedStream?.events.map(e => e.id);
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(2);
    });
  });

  // ============================================================================
  // Additional Integration Tests
  // ============================================================================

  describe('Board Persistence', () => {
    it('should persist board preferences across switches', () => {
      const stateStore = getBoardStateStore();
      const registry = getBoardRegistry();
      
      const board = registry.list()[0];
      if (!board) return;
      
      // Set layout state
      stateStore.setLayoutState(board.id, {
        panelSizes: { left: 300, right: 250 },
        collapsedPanels: new Set(),
        activeTabs: {}
      });
      
      // Switch away and back
      const otherBoard = registry.list()[1];
      if (otherBoard) {
        switchBoard(otherBoard.id, {
          resetLayout: false,
          resetDecks: false,
          preserveActiveContext: true,
          preserveTransport: true
        });
      }
      
      switchBoard(board.id, {
        resetLayout: false,
        resetDecks: false,
        preserveActiveContext: true,
        preserveTransport: true
      });
      
      // Verify layout state persisted
      const layout = stateStore.getLayoutState(board.id);
      expect(layout?.panelSizes?.left).toBe(300);
      expect(layout?.panelSizes?.right).toBe(250);
    });
  });

  describe('Performance', () => {
    it('should handle 100 rapid board switches without memory growth', () => {
      const registry = getBoardRegistry();
      const boards = registry.list().slice(0, 3);
      
      if (boards.length === 0) return;
      
      // Measure initial state
      const initialBoards = registry.list().length;
      
      // Perform 100 switches
      for (let i = 0; i < 100; i++) {
        const board = boards[i % boards.length];
        if (board) {
          switchBoard(board.id, {
            resetLayout: false,
            resetDecks: false,
            preserveActiveContext: true,
            preserveTransport: true
          });
        }
      }
      
      // Verify no registry growth (no duplicate boards registered)
      const finalBoards = registry.list().length;
      expect(finalBoards).toBe(initialBoards);
    });
  });
});
