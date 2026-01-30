/**
 * @fileoverview Snapshot test for ClipRegistry output
 * 
 * Ensures clip registry state changes are intentional and tracked.
 * Part of Change 490: Add snapshot tests for critical registries.
 * 
 * @module @cardplay/state/__tests__/clip-registry.snapshot
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClipRegistry } from '../clip-registry';
import { createNoteEvent } from '../../types/event';

describe('ClipRegistry Snapshot', () => {
  let registry: ClipRegistry;

  beforeEach(() => {
    registry = new ClipRegistry();
  });

  it('should match snapshot for empty registry', () => {
    const snapshot = {
      clips: registry.getAllClips(),
      count: registry.getAllClips().length,
    };
    
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot after adding clips', () => {
    const event1 = createNoteEvent({ start: 0, duration: 480, pitch: 60 });
    const event2 = createNoteEvent({ start: 480, duration: 480, pitch: 64 });

    const clip1 = registry.createClip('track-1', [event1]);
    const clip2 = registry.createClip('track-1', [event2]);

    const snapshot = {
      clips: registry.getAllClips().map(clip => ({
        id: clip.id,
        trackId: clip.trackId,
        eventCount: clip.events.length,
        // Note: Not including actual events to keep snapshot stable
        // across event implementation changes
      })),
      count: registry.getAllClips().length,
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot after modifications', () => {
    const event1 = createNoteEvent({ start: 0, duration: 480, pitch: 60 });
    const clip1 = registry.createClip('track-1', [event1]);

    // Update clip
    const event2 = createNoteEvent({ start: 480, duration: 480, pitch: 64 });
    registry.updateClip(clip1.id, { events: [event1, event2] });

    const snapshot = {
      clips: registry.getAllClips().map(clip => ({
        id: clip.id,
        trackId: clip.trackId,
        eventCount: clip.events.length,
      })),
      count: registry.getAllClips().length,
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for clip metadata', () => {
    const event = createNoteEvent({ start: 0, duration: 480, pitch: 60 });
    const clip = registry.createClip('track-1', [event]);

    const snapshot = {
      clip: {
        id: clip.id,
        trackId: clip.trackId,
        eventCount: clip.events.length,
        hasMetadata: !!clip.metadata,
      },
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('should have stable clip ID format', () => {
    const event = createNoteEvent({ start: 0, duration: 480, pitch: 60 });
    const clip = registry.createClip('track-1', [event]);

    // Clip IDs should follow a stable format
    expect(clip.id).toMatch(/^clip-\d+-\w+$/);
  });
});
