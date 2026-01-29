/**
 * @fileoverview Tests for Session Grid Panel
 *
 * E078: Unit tests for session-grid panel: slot selection sets active clip context.
 *
 * @module @cardplay/ui/components/session-grid-panel.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSessionGridPanel } from './session-grid-panel';
import type { SessionSlot, SessionGridConfig } from './session-grid-panel';
import { getBoardContextStore } from '../../boards/context/store';
import { getClipRegistry } from '../../state/clip-registry';

describe('SessionGridPanel', () => {
  let mockGetSlot: (trackIndex: number, sceneIndex: number) => SessionSlot;
  let config: SessionGridConfig;
  let contextStore: ReturnType<typeof getBoardContextStore>;
  let clipRegistry: ReturnType<typeof getClipRegistry>;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="test-root"></div>';

    // Mock getSlot function
    mockGetSlot = (trackIndex: number, sceneIndex: number): SessionSlot => ({
      trackIndex,
      sceneIndex,
      clipId: `clip-${trackIndex}-${sceneIndex}`,
      clipName: `Clip ${trackIndex},${sceneIndex}`,
      clipColor: '#4287f5',
      playState: 'stopped',
    });

    config = {
      trackCount: 4,
      sceneCount: 8,
      getSlot: mockGetSlot,
    };

    // Get singleton instances
    contextStore = getBoardContextStore();
    clipRegistry = getClipRegistry();
  });

  describe('Grid Rendering', () => {
    it('should create a session grid with correct dimensions', () => {
      const panel = createSessionGridPanel(config);

      expect(panel.classList.contains('session-grid-panel')).toBe(true);
      expect(panel.getAttribute('role')).toBe('grid');
    });

    it('should render track headers', () => {
      const panel = createSessionGridPanel(config);

      const trackHeaders = panel.querySelectorAll('.session-track-header');
      expect(trackHeaders.length).toBe(config.trackCount);
      expect(trackHeaders[0]?.textContent).toBe('Track 1');
      expect(trackHeaders[3]?.textContent).toBe('Track 4');
    });

    it('should render scene headers', () => {
      const panel = createSessionGridPanel(config);

      const sceneHeaders = panel.querySelectorAll('.session-scene-header');
      expect(sceneHeaders.length).toBe(config.sceneCount);
      expect(sceneHeaders[0]?.textContent).toBe('Scene 1');
      expect(sceneHeaders[7]?.textContent).toBe('Scene 8');
    });

    it('should render all clip slots', () => {
      const panel = createSessionGridPanel(config);

      const slots = panel.querySelectorAll('.session-slot');
      const expectedSlots = config.trackCount * config.sceneCount;
      expect(slots.length).toBe(expectedSlots);
    });

    it('should render slot names from config', () => {
      const panel = createSessionGridPanel(config);

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]');
      expect(firstSlot?.textContent).toContain('Clip 0,0');
    });

    it('should apply clip colors to slots', () => {
      const panel = createSessionGridPanel(config);

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      expect(firstSlot?.style.borderLeftColor).toBeTruthy();
    });
  });

  describe('Slot Selection', () => {
    it('should call onSlotClick when slot is clicked', () => {
      const onSlotClick = vi.fn();
      const panel = createSessionGridPanel({
        ...config,
        onSlotClick,
      });

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      firstSlot.click();

      expect(onSlotClick).toHaveBeenCalledWith({
        trackIndex: 0,
        sceneIndex: 0,
        clipId: 'clip-0-0',
        clipName: 'Clip 0,0',
        clipColor: '#4287f5',
        playState: 'stopped',
      });
    });

    it('should call onSlotDoubleClick when slot is double-clicked', () => {
      const onSlotDoubleClick = vi.fn();
      const panel = createSessionGridPanel({
        ...config,
        onSlotDoubleClick,
      });

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      firstSlot.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      expect(onSlotDoubleClick).toHaveBeenCalledWith({
        trackIndex: 0,
        sceneIndex: 0,
        clipId: 'clip-0-0',
        clipName: 'Clip 0,0',
        clipColor: '#4287f5',
        playState: 'stopped',
      });
    });

    it('should set active clip context when slot is selected', () => {
      const panel = createSessionGridPanel({
        ...config,
        onSlotClick: (slot) => {
          // E078: Slot selection sets active clip context
          if (slot.clipId) {
            contextStore.setContext({
              activeClipId: slot.clipId as any, // Cast to branded type
              activeStreamId: null, // Will be set by clip resolution
            });
          }
        },
      });

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      firstSlot.click();

      const context = contextStore.getContext();
      expect(context.activeClipId).toBe('clip-0-0' as any);
    });

    it('should update selection indicator when slot is clicked', () => {
      const panel = createSessionGridPanel(config);

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      const secondSlot = panel.querySelector('[data-track="1"][data-scene="0"]') as HTMLElement;

      // Click first slot
      firstSlot.click();
      expect(firstSlot.classList.contains('session-slot--selected')).toBe(true);

      // Click second slot
      secondSlot.click();
      expect(firstSlot.classList.contains('session-slot--selected')).toBe(false);
      expect(secondSlot.classList.contains('session-slot--selected')).toBe(true);
    });
  });

  describe('Play State Display', () => {
    it('should show stopped state styling', () => {
      const panel = createSessionGridPanel(config);

      const slot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      expect(slot.classList.contains('session-slot--stopped')).toBe(true);
    });

    it('should show playing state styling', () => {
      mockGetSlot = (trackIndex: number, sceneIndex: number): SessionSlot => ({
        trackIndex,
        sceneIndex,
        clipId: `clip-${trackIndex}-${sceneIndex}`,
        clipName: `Clip ${trackIndex},${sceneIndex}`,
        clipColor: '#4287f5',
        playState: trackIndex === 0 && sceneIndex === 0 ? 'playing' : 'stopped',
      });

      const panel = createSessionGridPanel({
        ...config,
        getSlot: mockGetSlot,
      });

      const playingSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      expect(playingSlot.classList.contains('session-slot--playing')).toBe(true);
    });

    it('should show queued state styling', () => {
      mockGetSlot = (trackIndex: number, sceneIndex: number): SessionSlot => ({
        trackIndex,
        sceneIndex,
        clipId: `clip-${trackIndex}-${sceneIndex}`,
        clipName: `Clip ${trackIndex},${sceneIndex}`,
        clipColor: '#4287f5',
        playState: trackIndex === 1 && sceneIndex === 0 ? 'queued' : 'stopped',
      });

      const panel = createSessionGridPanel({
        ...config,
        getSlot: mockGetSlot,
      });

      const queuedSlot = panel.querySelector('[data-track="1"][data-scene="0"]') as HTMLElement;
      expect(queuedSlot.classList.contains('session-slot--queued')).toBe(true);
    });

    it('should handle empty slots', () => {
      mockGetSlot = (trackIndex: number, sceneIndex: number): SessionSlot => ({
        trackIndex,
        sceneIndex,
        clipId: trackIndex === 0 && sceneIndex === 0 ? null : `clip-${trackIndex}-${sceneIndex}`,
        playState: 'stopped',
      });

      const panel = createSessionGridPanel({
        ...config,
        getSlot: mockGetSlot,
      });

      const emptySlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      expect(emptySlot.classList.contains('session-slot--empty')).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate slots with arrow keys', () => {
      const panel = createSessionGridPanel(config);

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      firstSlot.focus();

      // Press right arrow
      const rightArrow = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      firstSlot.dispatchEvent(rightArrow);

      const secondSlot = panel.querySelector('[data-track="1"][data-scene="0"]') as HTMLElement;
      expect(document.activeElement).toBe(secondSlot);
    });

    it('should activate slot with Enter key', () => {
      const onSlotClick = vi.fn();
      const panel = createSessionGridPanel({
        ...config,
        onSlotClick,
      });

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      firstSlot.focus();

      // Press Enter
      const enterKey = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      firstSlot.dispatchEvent(enterKey);

      expect(onSlotClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const panel = createSessionGridPanel(config);

      expect(panel.getAttribute('role')).toBe('grid');
      
      const trackHeaders = panel.querySelectorAll('.session-track-header');
      expect(trackHeaders[0]?.getAttribute('role')).toBe('columnheader');

      const sceneHeaders = panel.querySelectorAll('.session-scene-header');
      expect(sceneHeaders[0]?.getAttribute('role')).toBe('rowheader');
    });

    it('should have proper ARIA labels', () => {
      const panel = createSessionGridPanel(config);

      expect(panel.getAttribute('aria-label')).toBe('Session clip grid');

      const firstSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      expect(firstSlot.getAttribute('aria-label')).toContain('Clip');
    });

    it('should update aria-pressed for play state', () => {
      mockGetSlot = (trackIndex: number, sceneIndex: number): SessionSlot => ({
        trackIndex,
        sceneIndex,
        clipId: `clip-${trackIndex}-${sceneIndex}`,
        clipName: `Clip ${trackIndex},${sceneIndex}`,
        clipColor: '#4287f5',
        playState: trackIndex === 0 && sceneIndex === 0 ? 'playing' : 'stopped',
      });

      const panel = createSessionGridPanel({
        ...config,
        getSlot: mockGetSlot,
      });

      const playingSlot = panel.querySelector('[data-track="0"][data-scene="0"]') as HTMLElement;
      expect(playingSlot.getAttribute('aria-pressed')).toBe('true');

      const stoppedSlot = panel.querySelector('[data-track="1"][data-scene="0"]') as HTMLElement;
      expect(stoppedSlot.getAttribute('aria-pressed')).toBe('false');
    });
  });
});
