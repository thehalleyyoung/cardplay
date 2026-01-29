/**
 * @fileoverview Tests for Arranger Deck (Phase H)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createArrangerDeck } from './arranger-deck';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';

describe('Arranger Deck', () => {
  let deck: ReturnType<typeof createArrangerDeck>;

  beforeEach(() => {
    deck = createArrangerDeck();
  });

  describe('Section Management', () => {
    it('adds a section', () => {
      const id = deck.addSection({
        name: 'Intro',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: true, pad: false, melody: false },
        style: 'lofi',
        energy: 0.5
      });

      expect(deck.state.sections).toHaveLength(1);
      expect(deck.state.sections[0]?.id).toBe(id);
      expect(deck.state.sections[0]?.name).toBe('Intro');
    });

    it('removes a section', () => {
      const id = deck.addSection({
        name: 'Verse',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: false, pad: false, melody: false },
        style: 'house',
        energy: 0.7
      });

      deck.removeSection(id);
      expect(deck.state.sections).toHaveLength(0);
    });

    it('updates section properties', () => {
      const id = deck.addSection({
        name: 'Chorus',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: true, pad: true, melody: false },
        style: 'techno',
        energy: 0.8
      });

      deck.updateSection(id, { name: 'Chorus v2', energy: 0.9 });

      expect(deck.state.sections[0]?.name).toBe('Chorus v2');
      expect(deck.state.sections[0]?.energy).toBe(0.9);
    });

    it('toggles parts', () => {
      const id = deck.addSection({
        name: 'Bridge',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: true, pad: false, melody: false },
        style: 'ambient',
        energy: 0.4
      });

      deck.togglePart(id, 'pad');
      expect(deck.state.sections[0]?.parts.pad).toBe(true);

      deck.togglePart(id, 'drums');
      expect(deck.state.sections[0]?.parts.drums).toBe(false);
    });
  });

  describe('Generation', () => {
    it('generates section events (H014)', () => {
      const id = deck.addSection({
        name: 'Test Section',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: false, pad: false, melody: false },
        style: 'lofi',
        energy: 0.5
      });

      deck.generateSection(id);

      // Check that streams and clips were created
      expect(deck.state.parts.length).toBeGreaterThan(0);
      
      const drumPart = deck.state.parts.find(p => p.type === 'drums');
      expect(drumPart).toBeDefined();

      // Check that events were written to store (H014)
      const store = getSharedEventStore();
      const stream = store.getStream(drumPart!.streamId);
      expect(stream?.events.length).toBeGreaterThan(0);

      // Check that clip was created (H015)
      const registry = getClipRegistry();
      const clips = Array.from(registry.getAllClips().values()).filter(
        c => c.streamId === drumPart!.streamId
      );
      expect(clips.length).toBeGreaterThan(0);
    });

    it('regenerates section (H016)', () => {
      const id = deck.addSection({
        name: 'Test Section',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: false, pad: false, melody: false },
        style: 'house',
        energy: 0.6
      });

      deck.generateSection(id);
      const drumPart = deck.state.parts.find(p => p.type === 'drums');
      const store = getSharedEventStore();
      const stream1 = store.getStream(drumPart!.streamId);
      const eventCount1 = stream1?.events.length ?? 0;

      deck.regenerateSection(id);
      const stream2 = store.getStream(drumPart!.streamId);
      const eventCount2 = stream2?.events.length ?? 0;

      // Should have regenerated (may have same count but different events)
      expect(eventCount2).toBeGreaterThan(0);
    });

    it('freezes section (H017)', () => {
      const id = deck.addSection({
        name: 'Test Section',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: false, pad: false, melody: false },
        style: 'ambient',
        energy: 0.3
      });

      deck.generateSection(id);
      deck.freezeSection(id);

      const drumPart = deck.state.parts.find(p => p.type === 'drums');
      expect(drumPart?.frozen).toBe(true);
      expect(drumPart?.controlLevel).toBe('manual'); // H020: control level indicator
    });

    it('respects frozen state during regeneration (H023)', () => {
      const id = deck.addSection({
        name: 'Test Section',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: false, pad: false, melody: false },
        style: 'lofi',
        energy: 0.5
      });

      deck.generateSection(id);
      const drumPart = deck.state.parts.find(p => p.type === 'drums');
      const store = getSharedEventStore();
      const stream1 = store.getStream(drumPart!.streamId);
      const eventIds1 = stream1?.events.map(e => e.id) ?? [];

      deck.freezeSection(id);
      deck.regenerateSection(id);

      // Events should be unchanged (frozen)
      const stream2 = store.getStream(drumPart!.streamId);
      const eventIds2 = stream2?.events.map(e => e.id) ?? [];
      expect(eventIds2).toEqual(eventIds1);
    });
  });

  describe('Energy and Style', () => {
    it('sets energy level (H018)', () => {
      const id = deck.addSection({
        name: 'Test',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: false, pad: false, melody: false },
        style: 'lofi',
        energy: 0.5
      });

      deck.setEnergy(id, 0.8);
      expect(deck.state.sections[0]?.energy).toBe(0.8);

      // Clamps to valid range
      deck.setEnergy(id, 1.5);
      expect(deck.state.sections[0]?.energy).toBe(1);

      deck.setEnergy(id, -0.2);
      expect(deck.state.sections[0]?.energy).toBe(0);
    });

    it('sets style preset (H019)', () => {
      const id = deck.addSection({
        name: 'Test',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: false, pad: false, melody: false },
        style: 'lofi',
        energy: 0.5
      });

      deck.setStyle(id, 'house');
      expect(deck.state.sections[0]?.style).toBe('house');

      deck.setStyle(id, 'ambient');
      expect(deck.state.sections[0]?.style).toBe('ambient');
    });
  });

  describe('Control Level Indicators (H020)', () => {
    it('tracks control level per part', () => {
      const id = deck.addSection({
        name: 'Test',
        length: 384 * 4,
        chords: [],
        parts: { drums: true, bass: true, pad: false, melody: false },
        style: 'techno',
        energy: 0.7
      });

      deck.generateSection(id);

      const drumPart = deck.state.parts.find(p => p.type === 'drums');
      expect(drumPart?.controlLevel).toBe('generated');

      deck.freezeSection(id);
      expect(drumPart?.controlLevel).toBe('manual');

      deck.unfreezeSection(id);
      expect(drumPart?.controlLevel).toBe('generated');
    });
  });
});
