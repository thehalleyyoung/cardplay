/**
 * @fileoverview Snapshot test for ClipRegistry output
 * 
 * Ensures clip registry state changes are intentional and tracked.
 * Part of Change 490: Add snapshot tests for critical registries.
 * 
 * @module @cardplay/state/__tests__/clip-registry.snapshot
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createClipRegistry, type ClipRegistry } from '../clip-registry';
import { asEventStreamId } from '../types';
import { asTick } from '../../types/primitives';

describe('ClipRegistry Snapshot', () => {
  let registry: ClipRegistry;

  beforeEach(() => {
    registry = createClipRegistry();
  });

  it('should match snapshot for empty registry', () => {
    const snapshot = {
      clips: registry.getAllClips(),
      count: registry.getAllClips().length,
    };
    
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot after adding clips', () => {
    const streamId = asEventStreamId('track-1');

    const clip1 = registry.createClip({
      name: 'Clip 1',
      streamId,
      duration: asTick(480),
    });

    const clip2 = registry.createClip({
      name: 'Clip 2',
      streamId,
      duration: asTick(960),
    });

    const snapshot = {
      clips: registry.getAllClips().map(clip => ({
        name: clip.name,
        streamId: clip.streamId,
        duration: clip.duration,
        loop: clip.loop,
        speed: clip.speed,
        pitchShift: clip.pitchShift,
      })),
      count: registry.getAllClips().length,
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot after modifications', () => {
    const streamId = asEventStreamId('track-1');
    const clip1 = registry.createClip({
      name: 'Original',
      streamId,
      duration: asTick(480),
    });

    // Update clip
    registry.updateClip(clip1.id, {
      name: 'Modified',
      duration: asTick(960),
      loop: true,
    });

    const snapshot = {
      clips: registry.getAllClips().map(clip => ({
        name: clip.name,
        streamId: clip.streamId,
        duration: clip.duration,
        loop: clip.loop,
      })),
      count: registry.getAllClips().length,
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for clip metadata', () => {
    const streamId = asEventStreamId('track-1');
    const clip = registry.createClip({
      name: 'Test Clip',
      streamId,
      duration: asTick(480),
      color: '#ff0000',
      speed: 1.5,
      pitchShift: 2,
    });

    const snapshot = {
      clip: {
        name: clip.name,
        streamId: clip.streamId,
        duration: clip.duration,
        color: clip.color,
        speed: clip.speed,
        pitchShift: clip.pitchShift,
        loop: clip.loop,
      },
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('should have stable clip ID format', () => {
    const streamId = asEventStreamId('track-1');
    const clip = registry.createClip({
      name: 'Test',
      streamId,
      duration: asTick(480),
    });

    // Clip IDs should follow a stable format
    expect(clip.id).toMatch(/^clip_\d+_\w+$/);
  });
});
