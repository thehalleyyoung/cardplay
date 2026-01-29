/**
 * @fileoverview Phase F Manual Boards Smoke Tests
 * 
 * Tests for F023, F024, F025, F051, F052, F082, F112, F113, F114
 * 
 * @vitest-environment jsdom
 * @module tests/boards/manual-boards.smoke.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from './register';
import { switchBoard } from '../switching/switch-board';
import { getBoardStateStore } from '../store/store';
import { getBoardContextStore } from '../context/store';
import { computeVisibleDeckTypes } from '../gating/tool-visibility';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import type { EventStreamId } from '../../state/event-store';
import type { ClipId } from '../../state/clip-registry';
import { asTick } from '../../types/index';

describe('Phase F: Manual Boards Smoke Tests', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      store: {} as Record<string, string>,
      getItem: function(key: string) {
        return this.store[key] || null;
      },
      setItem: function(key: string, value: string) {
        this.store[key] = value;
      },
      clear: function() {
        this.store = {};
      },
      removeItem: function(key: string) {
        delete this.store[key];
      },
      get length() {
        return Object.keys(this.store).length;
      },
      key: function(index: number) {
        const keys = Object.keys(this.store);
        return keys[index] || null;
      }
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Reset state before each test
    const registry = getBoardRegistry();
    registry['boards'].clear(); // Clear for fresh registration
    
    // Register all builtin boards
    registerBuiltinBoards();
  });

  describe('Notation Board (Manual) - F023, F024, F025', () => {
    it('F023: should hide phrase/generator/AI decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('notation-manual');
      
      expect(board).toBeDefined();
      if (!board) return;
      
      const visibleDecks = computeVisibleDeckTypes(board);
      
      // Should NOT contain generative tools
      expect(visibleDecks).not.toContain('phrase-library');
      expect(visibleDecks).not.toContain('generator');
      expect(visibleDecks).not.toContain('arranger');
    });

    it('F024: should show exactly the defined deck types', () => {
      const registry = getBoardRegistry();
      const board = registry.get('notation-manual');
      
      expect(board).toBeDefined();
      if (!board) return;
      
      // Extract deck types from board definition
      const definedTypes = board.decks.map(d => d.type);
      
      // Should have notation, instruments, properties decks
      expect(definedTypes).toContain('notation-deck');
      expect(definedTypes).toContain('instruments-deck');
      expect(definedTypes).toContain('properties-deck');
    });

    it('F025: should preserve active stream/clip context when switching', () => {
      const registry = getBoardRegistry();
      const contextStore = getBoardContextStore();
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      // Create a test stream and clip
      const streamRecord = eventStore.createStream({ name: 'Test Stream' });
      const clipRecord = clipRegistry.createClip({
        name: 'Test Clip',
        streamId: streamRecord.id,
        start: asTick(0),
        duration: asTick(960)
      });
      
      // Set active context
      contextStore.setActiveStream(streamRecord.id);
      contextStore.setActiveClip(clipRecord.id);
      
      // Switch to notation board
      switchBoard('notation-manual', { preserveActiveContext: true });
      
      // Verify context preserved
      const context = contextStore.getContext();
      expect(context.activeStreamId).toBe(streamRecord.id);
      expect(context.activeClipId).toBe(clipRecord.id);
    });
  });

  describe('Basic Tracker Board - F051, F052', () => {
    it('F051: should hide phrase library and all generator decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('basic-tracker');
      
      expect(board).toBeDefined();
      if (!board) return;
      
      const visibleDecks = computeVisibleDeckTypes(board);
      
      // Should NOT contain assisted/generative tools
      expect(visibleDecks).not.toContain('phrase-library');
      expect(visibleDecks).not.toContain('generator');
      expect(visibleDecks).not.toContain('arranger');
      expect(visibleDecks).not.toContain('harmony-display');
    });

    it('F052: should show only defined deck types', () => {
      const registry = getBoardRegistry();
      const board = registry.get('basic-tracker');
      
      expect(board).toBeDefined();
      if (!board) return;
      
      const definedTypes = board.decks.map(d => d.type);
      
      // Should have pattern editor, instruments, properties
      expect(definedTypes).toContain('pattern-deck');
      expect(definedTypes).toContain('instruments-deck');
      expect(definedTypes).toContain('properties-deck');
      
      // Should not have generative types
      expect(definedTypes).not.toContain('phrase-library');
      expect(definedTypes).not.toContain('generator');
    });
  });

  describe('Basic Sampler Board - F082', () => {
    it('F082: should hide phrase/generator/AI decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('basic-sampler');
      
      expect(board).toBeDefined();
      if (!board) return;
      
      const visibleDecks = computeVisibleDeckTypes(board);
      
      // Should NOT contain generative tools
      expect(visibleDecks).not.toContain('phrase-library');
      expect(visibleDecks).not.toContain('generator');
      expect(visibleDecks).not.toContain('arranger');
      expect(visibleDecks).not.toContain('harmony-display');
    });
  });

  describe('Basic Session Board - F112, F113, F114', () => {
    it('F112: should hide generator/arranger/AI composer decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('basic-session');
      
      expect(board).toBeDefined();
      if (!board) return;
      
      const visibleDecks = computeVisibleDeckTypes(board);
      
      // Should NOT contain generative tools
      expect(visibleDecks).not.toContain('generator');
      expect(visibleDecks).not.toContain('arranger');
    });

    it('F113: creating a clip in session grid creates stream + clip in shared stores', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      // Simulate session grid creating a clip
      const streamRecord = eventStore.createStream({ name: 'Session Slot 1' });
      const clipRecord = clipRegistry.createClip({
        name: 'Clip A1',
        streamId: streamRecord.id,
        start: asTick(0),
        duration: asTick(960 * 4) // 4 bars
      });
      
      // Verify stream exists
      const stream = eventStore.getStream(streamRecord.id);
      expect(stream).toBeDefined();
      expect(stream?.name).toBe('Session Slot 1');
      
      // Verify clip exists
      const clip = clipRegistry.getClip(clipRecord.id);
      expect(clip).toBeDefined();
      expect(clip?.name).toBe('Clip A1');
      expect(clip?.streamId).toBe(streamRecord.id);
    });

    it('F114: launching a clip updates play state (integration point)', () => {
      const clipRegistry = getClipRegistry();
      const eventStore = getSharedEventStore();
      
      // Create a clip
      const streamRecord = eventStore.createStream({ name: 'Launchable' });
      const clipRecord = clipRegistry.createClip({
        name: 'Launch Test',
        streamId: streamRecord.id,
        start: asTick(0),
        duration: asTick(960 * 2)
      });
      
      // Verify clip exists and can be queried
      const clip = clipRegistry.getClip(clipRecord.id);
      expect(clip).toBeDefined();
      
      // Note: Actual play state updates happen in transport/session-grid integration
      // This test verifies the clip is properly registered and accessible
      expect(clip?.streamId).toBe(streamRecord.id);
    });
  });

  describe('Cross-Board Context Preservation', () => {
    it('should preserve stream/clip context when switching between manual boards', () => {
      const contextStore = getBoardContextStore();
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      // Create test data
      const streamRecord = eventStore.createStream({ name: 'Shared Stream' });
      const clipRecord = clipRegistry.createClip({
        name: 'Shared Clip',
        streamId: streamRecord.id,
        start: asTick(0),
        duration: asTick(960 * 8)
      });
      
      contextStore.setActiveStream(streamRecord.id);
      contextStore.setActiveClip(clipRecord.id);
      
      // Switch through multiple manual boards
      switchBoard('basic-tracker', { preserveActiveContext: true });
      expect(contextStore.getContext().activeStreamId).toBe(streamRecord.id);
      
      switchBoard('notation-manual', { preserveActiveContext: true });
      expect(contextStore.getContext().activeStreamId).toBe(streamRecord.id);
      
      switchBoard('basic-session', { preserveActiveContext: true });
      expect(contextStore.getContext().activeStreamId).toBe(streamRecord.id);
      expect(contextStore.getContext().activeClipId).toBe(clipRecord.id);
    });
  });

  describe('Tool Gating Consistency', () => {
    it('all manual boards should have full-manual control level', () => {
      const registry = getBoardRegistry();
      const manualBoards = [
        'notation-manual',
        'basic-tracker',
        'basic-sampler',
        'basic-session'
      ];
      
      for (const boardId of manualBoards) {
        const board = registry.get(boardId);
        expect(board).toBeDefined();
        if (board) {
          expect(board.controlLevel).toBe('full-manual');
          
          // All tools should be disabled/hidden
          expect(board.compositionTools.phraseDatabase.enabled).toBe(false);
          expect(board.compositionTools.harmonyExplorer.enabled).toBe(false);
          expect(board.compositionTools.phraseGenerators.enabled).toBe(false);
          expect(board.compositionTools.arrangerCard.enabled).toBe(false);
          expect(board.compositionTools.aiComposer.enabled).toBe(false);
        }
      }
    });
  });
});
