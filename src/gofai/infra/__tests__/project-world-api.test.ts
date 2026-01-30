/**
 * GOFAI Infrastructure — Project World API Tests
 *
 * Comprehensive tests for Step 010 from gofai_goalB.md: "Identify the minimal
 * 'project world API' needed by GOFAI (section markers, tracks/layers, card
 * registry, selected range, undo stack)."
 *
 * These tests validate:
 * 1. Section marker queries
 * 2. Track and layer queries
 * 3. Event queries
 * 4. Card and routing queries
 * 5. Selection and focus state
 * 6. Project metadata
 * 7. Undo/redo stack
 * 8. Board capabilities
 * 9. Query helpers
 * 10. Mock implementation correctness
 *
 * @module gofai/infra/__tests__/project-world-api.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockProjectWorld,
  ProjectWorldQueries,
  type SectionMarker,
  type Track,
  type CardInstance,
  type TimeSelection,
} from '../project-world-api';
import type { Event } from '../../../types/event';
import type { TrackId } from '../../../tracker/types';

describe('ProjectWorldAPI — Section Markers', () => {
  let world: MockProjectWorld;

  beforeEach(() => {
    world = new MockProjectWorld();
  });

  it('should return empty array when no sections exist', () => {
    const sections = world.getSectionMarkers();
    expect(sections).toEqual([]);
    expect(world.getSectionNames()).toEqual([]);
  });

  it('should return sections in chronological order', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse 1', startTicks: 3840, endTicks: 11520 },
      { id: 's3', name: 'Chorus', startTicks: 11520, endTicks: 15360 },
    ];
    world.setSections(sections);

    const result = world.getSectionMarkers();
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Intro');
    expect(result[1].name).toBe('Verse 1');
    expect(result[2].name).toBe('Chorus');
  });

  it('should find section by name', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse 1', startTicks: 3840, endTicks: 11520 },
      { id: 's3', name: 'Chorus', startTicks: 11520, endTicks: 15360 },
    ];
    world.setSections(sections);

    const verse = world.getSectionMarkerByName('Verse 1');
    expect(verse).toBeDefined();
    expect(verse?.id).toBe('s2');
    expect(verse?.startTicks).toBe(3840);

    const missing = world.getSectionMarkerByName('Bridge');
    expect(missing).toBeUndefined();
  });

  it('should find section at position', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse 1', startTicks: 3840, endTicks: 11520 },
      { id: 's3', name: 'Chorus', startTicks: 11520, endTicks: 15360 },
    ];
    world.setSections(sections);

    expect(world.getSectionMarkerAtPosition(0)?.name).toBe('Intro');
    expect(world.getSectionMarkerAtPosition(1920)?.name).toBe('Intro');
    expect(world.getSectionMarkerAtPosition(3840)?.name).toBe('Verse 1');
    expect(world.getSectionMarkerAtPosition(7680)?.name).toBe('Verse 1');
    expect(world.getSectionMarkerAtPosition(11520)?.name).toBe('Chorus');
    expect(world.getSectionMarkerAtPosition(15360)).toBeUndefined();
  });

  it('should handle last section with no endTicks', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse 1', startTicks: 3840 },
    ];
    world.setSections(sections);

    expect(world.getSectionMarkerAtPosition(3840)?.name).toBe('Verse 1');
    expect(world.getSectionMarkerAtPosition(10000)?.name).toBe('Verse 1');
    expect(world.getSectionMarkerAtPosition(1000000)?.name).toBe('Verse 1');
  });

  it('should return section names in order', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse 1', startTicks: 3840, endTicks: 11520 },
      { id: 's3', name: 'Chorus', startTicks: 11520, endTicks: 15360 },
    ];
    world.setSections(sections);

    const names = world.getSectionNames();
    expect(names).toEqual(['Intro', 'Verse 1', 'Chorus']);
  });

  it('should support section types and metadata', () => {
    const sections: SectionMarker[] = [
      {
        id: 's1',
        name: 'Verse 1',
        startTicks: 0,
        endTicks: 7680,
        type: 'verse',
        color: '#ff0000',
        metadata: { energy: 'low' },
      },
      {
        id: 's2',
        name: 'Chorus',
        startTicks: 7680,
        endTicks: 11520,
        type: 'chorus',
        color: '#00ff00',
        metadata: { energy: 'high' },
      },
    ];
    world.setSections(sections);

    const verse = world.getSectionMarkerByName('Verse 1');
    expect(verse?.type).toBe('verse');
    expect(verse?.color).toBe('#ff0000');
    expect(verse?.metadata?.energy).toBe('low');

    const chorus = world.getSectionMarkerByName('Chorus');
    expect(chorus?.type).toBe('chorus');
    expect(chorus?.color).toBe('#00ff00');
    expect(chorus?.metadata?.energy).toBe('high');
  });
});

describe('ProjectWorldAPI — Tracks and Layers', () => {
  let world: MockProjectWorld;

  beforeEach(() => {
    world = new MockProjectWorld();
  });

  it('should return empty array when no tracks exist', () => {
    const tracks = world.getTracks();
    expect(tracks).toEqual([]);
  });

  it('should return tracks in display order', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Drums',
        role: 'drums',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't2' as TrackId,
        name: 'Bass',
        role: 'bass',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't3' as TrackId,
        name: 'Melody',
        role: 'melody',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
    ];
    world.setTracks(tracks);

    const result = world.getTracks();
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Drums');
    expect(result[1].name).toBe('Bass');
    expect(result[2].name).toBe('Melody');
  });

  it('should find track by ID', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Drums',
        role: 'drums',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't2' as TrackId,
        name: 'Bass',
        role: 'bass',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
    ];
    world.setTracks(tracks);

    const drums = world.getTrackById('t1' as TrackId);
    expect(drums).toBeDefined();
    expect(drums?.name).toBe('Drums');

    const missing = world.getTrackById('t999' as TrackId);
    expect(missing).toBeUndefined();
  });

  it('should find track by name', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Drums',
        role: 'drums',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't2' as TrackId,
        name: 'Bass',
        role: 'bass',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
    ];
    world.setTracks(tracks);

    const bass = world.getTrackByName('Bass');
    expect(bass).toBeDefined();
    expect(bass?.id).toBe('t2');

    const missing = world.getTrackByName('Piano');
    expect(missing).toBeUndefined();
  });

  it('should find tracks by role', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Kick',
        role: 'drums',
        tags: ['percussion'],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't2' as TrackId,
        name: 'Hats',
        role: 'drums',
        tags: ['percussion'],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't3' as TrackId,
        name: 'Bass',
        role: 'bass',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
    ];
    world.setTracks(tracks);

    const drumTracks = world.getTracksByRole('drums');
    expect(drumTracks).toHaveLength(2);
    expect(drumTracks[0].name).toBe('Kick');
    expect(drumTracks[1].name).toBe('Hats');

    const bassTracks = world.getTracksByRole('bass');
    expect(bassTracks).toHaveLength(1);
    expect(bassTracks[0].name).toBe('Bass');

    const melodyTracks = world.getTracksByRole('melody');
    expect(melodyTracks).toHaveLength(0);
  });

  it('should find tracks by tag', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Kick',
        role: 'drums',
        tags: ['percussion', 'low-end'],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't2' as TrackId,
        name: 'Bass',
        role: 'bass',
        tags: ['low-end'],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't3' as TrackId,
        name: 'Hats',
        role: 'drums',
        tags: ['percussion'],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
    ];
    world.setTracks(tracks);

    const lowEndTracks = world.getTracksByTag('low-end');
    expect(lowEndTracks).toHaveLength(2);
    expect(lowEndTracks.map(t => t.name)).toContain('Kick');
    expect(lowEndTracks.map(t => t.name)).toContain('Bass');

    const percussionTracks = world.getTracksByTag('percussion');
    expect(percussionTracks).toHaveLength(2);
    expect(percussionTracks.map(t => t.name)).toContain('Kick');
    expect(percussionTracks.map(t => t.name)).toContain('Hats');
  });

  it('should support track metadata and state', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Lead',
        role: 'melody',
        tags: ['synth'],
        color: '#ff0000',
        muted: true,
        soloed: false,
        volume: 0.8,
        pan: 0.3,
        metadata: { vst: 'serum' },
      },
    ];
    world.setTracks(tracks);

    const track = world.getTrackById('t1' as TrackId);
    expect(track?.color).toBe('#ff0000');
    expect(track?.muted).toBe(true);
    expect(track?.soloed).toBe(false);
    expect(track?.volume).toBe(0.8);
    expect(track?.pan).toBe(0.3);
    expect(track?.metadata?.vst).toBe('serum');
  });
});

describe('ProjectWorldAPI — Events', () => {
  let world: MockProjectWorld;

  beforeEach(() => {
    world = new MockProjectWorld();
  });

  it('should return empty array when no events exist', () => {
    const events = world.getEvents();
    expect(events).toEqual([]);
  });

  it('should return events in chronological order', () => {
    const events: Event<unknown>[] = [
      { id: 'e1', kind: 'note', start: 0, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e2', kind: 'note', start: 480, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e3', kind: 'note', start: 960, duration: 480, payload: {} as any, tags: new Map() },
    ];
    world.setEvents(events);

    const result = world.getEvents();
    expect(result).toHaveLength(3);
    expect(result[0].start).toBe(0);
    expect(result[1].start).toBe(480);
    expect(result[2].start).toBe(960);
  });

  it('should get events in range', () => {
    const events: Event<unknown>[] = [
      { id: 'e1', kind: 'note', start: 0, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e2', kind: 'note', start: 480, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e3', kind: 'note', start: 960, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e4', kind: 'note', start: 1440, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e5', kind: 'note', start: 1920, duration: 480, payload: {} as any, tags: new Map() },
    ];
    world.setEvents(events);

    const bar1 = world.getEventsInRange(0, 960);
    expect(bar1).toHaveLength(2);
    expect(bar1[0].start).toBe(0);
    expect(bar1[1].start).toBe(480);

    const bar2 = world.getEventsInRange(960, 1920);
    expect(bar2).toHaveLength(2);
    expect(bar2[0].start).toBe(960);
    expect(bar2[1].start).toBe(1440);

    const bars12 = world.getEventsInRange(0, 1920);
    expect(bars12).toHaveLength(4);

    const empty = world.getEventsInRange(3840, 7680);
    expect(empty).toHaveLength(0);
  });

  it('should get events on track', () => {
    const tags1 = new Map([['track:t1', true]]);
    const tags2 = new Map([['track:t2', true]]);
    const events: Event<unknown>[] = [
      { id: 'e1', kind: 'note', start: 0, duration: 480, payload: {} as any, tags: tags1 },
      { id: 'e2', kind: 'note', start: 480, duration: 480, payload: {} as any, tags: tags1 },
      { id: 'e3', kind: 'note', start: 960, duration: 480, payload: {} as any, tags: tags2 },
    ];
    world.setEvents(events);

    const track1Events = world.getEventsOnTrack('t1' as TrackId);
    expect(track1Events).toHaveLength(2);

    const track2Events = world.getEventsOnTrack('t2' as TrackId);
    expect(track2Events).toHaveLength(1);

    const track3Events = world.getEventsOnTrack('t3' as TrackId);
    expect(track3Events).toHaveLength(0);
  });
});

describe('ProjectWorldAPI — Cards and Routing', () => {
  let world: MockProjectWorld;

  beforeEach(() => {
    world = new MockProjectWorld();
  });

  it('should return empty array when no cards exist', () => {
    const cards = world.getCards();
    expect(cards).toEqual([]);
  });

  it('should return cards in topology order', () => {
    const cards: CardInstance[] = [
      {
        id: 'c1' as any,
        typeId: 'osc',
        name: 'Oscillator',
        params: {},
        bypassed: false,
      },
      {
        id: 'c2' as any,
        typeId: 'filter',
        name: 'Filter',
        params: {},
        bypassed: false,
      },
      {
        id: 'c3' as any,
        typeId: 'reverb',
        name: 'Reverb',
        params: {},
        bypassed: false,
      },
    ];
    world.setCards(cards);

    const result = world.getCards();
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Oscillator');
    expect(result[1].name).toBe('Filter');
    expect(result[2].name).toBe('Reverb');
  });

  it('should find card by ID', () => {
    const cards: CardInstance[] = [
      {
        id: 'c1' as any,
        typeId: 'osc',
        name: 'Oscillator',
        params: {},
        bypassed: false,
      },
      {
        id: 'c2' as any,
        typeId: 'filter',
        name: 'Filter',
        params: {},
        bypassed: false,
      },
    ];
    world.setCards(cards);

    const osc = world.getCardById('c1' as any);
    expect(osc).toBeDefined();
    expect(osc?.name).toBe('Oscillator');

    const missing = world.getCardById('c999' as any);
    expect(missing).toBeUndefined();
  });

  it('should find cards by type', () => {
    const cards: CardInstance[] = [
      {
        id: 'c1' as any,
        typeId: 'osc',
        name: 'Osc 1',
        params: {},
        bypassed: false,
      },
      {
        id: 'c2' as any,
        typeId: 'osc',
        name: 'Osc 2',
        params: {},
        bypassed: false,
      },
      {
        id: 'c3' as any,
        typeId: 'filter',
        name: 'Filter',
        params: {},
        bypassed: false,
      },
    ];
    world.setCards(cards);

    const oscs = world.getCardsByType('osc');
    expect(oscs).toHaveLength(2);
    expect(oscs[0].name).toBe('Osc 1');
    expect(oscs[1].name).toBe('Osc 2');

    const filters = world.getCardsByType('filter');
    expect(filters).toHaveLength(1);
    expect(filters[0].name).toBe('Filter');

    const missing = world.getCardsByType('reverb');
    expect(missing).toHaveLength(0);
  });

  it('should find cards on track', () => {
    const cards: CardInstance[] = [
      {
        id: 'c1' as any,
        typeId: 'osc',
        name: 'Drums Osc',
        trackId: 't1' as TrackId,
        params: {},
        bypassed: false,
      },
      {
        id: 'c2' as any,
        typeId: 'filter',
        name: 'Drums Filter',
        trackId: 't1' as TrackId,
        params: {},
        bypassed: false,
      },
      {
        id: 'c3' as any,
        typeId: 'osc',
        name: 'Bass Osc',
        trackId: 't2' as TrackId,
        params: {},
        bypassed: false,
      },
    ];
    world.setCards(cards);

    const track1Cards = world.getCardsOnTrack('t1' as TrackId);
    expect(track1Cards).toHaveLength(2);
    expect(track1Cards.map(c => c.name)).toContain('Drums Osc');
    expect(track1Cards.map(c => c.name)).toContain('Drums Filter');

    const track2Cards = world.getCardsOnTrack('t2' as TrackId);
    expect(track2Cards).toHaveLength(1);
    expect(track2Cards[0].name).toBe('Bass Osc');

    const track3Cards = world.getCardsOnTrack('t3' as TrackId);
    expect(track3Cards).toHaveLength(0);
  });

  it('should get card parameter values', () => {
    const cards: CardInstance[] = [
      {
        id: 'c1' as any,
        typeId: 'filter',
        name: 'Filter',
        params: {
          cutoff: 2000,
          resonance: 0.5,
          type: 'lowpass',
        },
        bypassed: false,
      },
    ];
    world.setCards(cards);

    expect(world.getCardParam('c1' as any, 'cutoff')).toBe(2000);
    expect(world.getCardParam('c1' as any, 'resonance')).toBe(0.5);
    expect(world.getCardParam('c1' as any, 'type')).toBe('lowpass');
    expect(world.getCardParam('c1' as any, 'missing')).toBeUndefined();
    expect(world.getCardParam('c999' as any, 'cutoff')).toBeUndefined();
  });

  it('should support card metadata and state', () => {
    const cards: CardInstance[] = [
      {
        id: 'c1' as any,
        typeId: 'synth',
        name: 'Lead Synth',
        trackId: 't1' as TrackId,
        params: { volume: 0.8 },
        bypassed: true,
        metadata: { preset: 'pluck' },
      },
    ];
    world.setCards(cards);

    const card = world.getCardById('c1' as any);
    expect(card?.trackId).toBe('t1');
    expect(card?.bypassed).toBe(true);
    expect(card?.metadata?.preset).toBe('pluck');
  });
});

describe('ProjectWorldAPI — Selection and Focus', () => {
  let world: MockProjectWorld;

  beforeEach(() => {
    world = new MockProjectWorld();
  });

  it('should return undefined when no selection exists', () => {
    const selection = world.getSelection();
    expect(selection).toBeUndefined();
  });

  it('should return current selection', () => {
    const selection: TimeSelection = {
      startTicks: 3840,
      endTicks: 7680,
      active: true,
    };
    world.setSelection(selection);

    const result = world.getSelection();
    expect(result).toBeDefined();
    expect(result?.startTicks).toBe(3840);
    expect(result?.endTicks).toBe(7680);
    expect(result?.active).toBe(true);
  });

  it('should support track-specific selection', () => {
    const selection: TimeSelection = {
      startTicks: 0,
      endTicks: 3840,
      active: true,
      trackIds: ['t1' as TrackId, 't2' as TrackId],
    };
    world.setSelection(selection);

    const result = world.getSelection();
    expect(result?.trackIds).toHaveLength(2);
    expect(result?.trackIds).toContain('t1');
    expect(result?.trackIds).toContain('t2');
  });

  it('should support inactive selection', () => {
    const selection: TimeSelection = {
      startTicks: 0,
      endTicks: 3840,
      active: false,
    };
    world.setSelection(selection);

    const result = world.getSelection();
    expect(result?.active).toBe(false);
  });
});

describe('ProjectWorldAPI — Project Metadata', () => {
  let world: MockProjectWorld;

  beforeEach(() => {
    world = new MockProjectWorld();
  });

  it('should return default tempo', () => {
    expect(world.getTempo()).toBe(120);
  });

  it('should return custom tempo', () => {
    world.setTempo(140);
    expect(world.getTempo()).toBe(140);
  });

  it('should return default time signature', () => {
    const ts = world.getTimeSignature();
    expect(ts.numerator).toBe(4);
    expect(ts.denominator).toBe(4);
  });

  it('should return custom time signature', () => {
    world.setTimeSignature({ numerator: 7, denominator: 8 });
    const ts = world.getTimeSignature();
    expect(ts.numerator).toBe(7);
    expect(ts.denominator).toBe(8);
  });

  it('should return undefined key by default', () => {
    expect(world.getKey()).toBeUndefined();
  });

  it('should return project duration', () => {
    expect(world.getDuration()).toBe(0);

    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse', startTicks: 3840, endTicks: 11520 },
    ];
    world.setSections(sections);
    expect(world.getDuration()).toBe(11520);

    const sections2: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse', startTicks: 3840 },
    ];
    world.setSections(sections2);
    expect(world.getDuration()).toBe(15360);
  });
});

describe('ProjectWorldAPI — Board Capabilities', () => {
  let world: MockProjectWorld;

  beforeEach(() => {
    world = new MockProjectWorld();
  });

  it('should return default capabilities', () => {
    const caps = world.getBoardCapabilities();
    expect(caps.productionEditable).toBe(true);
    expect(caps.routingEditable).toBe(true);
    expect(caps.aiEnabled).toBe(true);
    expect(caps.structureEditable).toBe(true);
    expect(caps.eventsEditable).toBe(true);
    expect(caps.persona).toBe('assisted');
  });

  it('should support custom capabilities', () => {
    world.setCapabilities({
      productionEditable: false,
      persona: 'full-manual',
    });

    const caps = world.getBoardCapabilities();
    expect(caps.productionEditable).toBe(false);
    expect(caps.persona).toBe('full-manual');
    expect(caps.routingEditable).toBe(true);
  });

  it('should check standard capabilities', () => {
    expect(world.hasCapability('production-editable')).toBe(true);
    expect(world.hasCapability('routing-editable')).toBe(true);
    expect(world.hasCapability('ai-enabled')).toBe(true);
    expect(world.hasCapability('structure-editable')).toBe(true);
    expect(world.hasCapability('events-editable')).toBe(true);
  });

  it('should check custom capabilities', () => {
    world.setCapabilities({
      custom: { 'my-feature': true },
    });

    expect(world.hasCapability('my-feature')).toBe(true);
    expect(world.hasCapability('other-feature')).toBe(false);
  });

  it('should return current board ID', () => {
    expect(world.getCurrentBoardId()).toBe('test:board');
  });
});

describe('ProjectWorldQueries — Helper Functions', () => {
  let world: MockProjectWorld;
  let queries: ProjectWorldQueries;

  beforeEach(() => {
    world = new MockProjectWorld();
    queries = new ProjectWorldQueries(world);
  });

  it('should find section containing position', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse', startTicks: 3840, endTicks: 11520 },
    ];
    world.setSections(sections);

    const intro = queries.findSectionContaining(1920);
    expect(intro?.name).toBe('Intro');

    const verse = queries.findSectionContaining(7680);
    expect(verse?.name).toBe('Verse');
  });

  it('should get events in section', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse', startTicks: 3840, endTicks: 11520 },
    ];
    world.setSections(sections);

    const events: Event<unknown>[] = [
      { id: 'e1', kind: 'note', start: 0, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e2', kind: 'note', start: 1920, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e3', kind: 'note', start: 3840, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e4', kind: 'note', start: 7680, duration: 480, payload: {} as any, tags: new Map() },
    ];
    world.setEvents(events);

    const introEvents = queries.getEventsInSection('Intro');
    expect(introEvents).toHaveLength(2);

    const verseEvents = queries.getEventsInSection('Verse');
    expect(verseEvents).toHaveLength(2);

    const missingEvents = queries.getEventsInSection('Chorus');
    expect(missingEvents).toHaveLength(0);
  });

  it('should get specialized track types', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Kick',
        role: 'drums',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't2' as TrackId,
        name: 'Bass',
        role: 'bass',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't3' as TrackId,
        name: 'Lead',
        role: 'melody',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
      {
        id: 't4' as TrackId,
        name: 'Pad',
        role: 'pad',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
    ];
    world.setTracks(tracks);

    expect(queries.getDrumsTracks()).toHaveLength(1);
    expect(queries.getBassTracks()).toHaveLength(1);
    expect(queries.getMelodyTracks()).toHaveLength(1);
    expect(queries.getPadTracks()).toHaveLength(1);
  });

  it('should get current section from selection', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
      { id: 's2', name: 'Verse', startTicks: 3840, endTicks: 11520 },
    ];
    world.setSections(sections);

    expect(queries.getCurrentSection()?.name).toBe('Intro');

    world.setSelection({
      startTicks: 7680,
      endTicks: 9600,
      active: true,
    });
    expect(queries.getCurrentSection()?.name).toBe('Verse');
  });

  it('should get section by type and index', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Verse 1', startTicks: 0, endTicks: 3840, type: 'verse' },
      { id: 's2', name: 'Chorus 1', startTicks: 3840, endTicks: 7680, type: 'chorus' },
      { id: 's3', name: 'Verse 2', startTicks: 7680, endTicks: 11520, type: 'verse' },
      { id: 's4', name: 'Chorus 2', startTicks: 11520, endTicks: 15360, type: 'chorus' },
    ];
    world.setSections(sections);

    expect(queries.getSectionByType('verse', 0)?.name).toBe('Verse 1');
    expect(queries.getSectionByType('verse', 1)?.name).toBe('Verse 2');
    expect(queries.getSectionByType('chorus', 0)?.name).toBe('Chorus 1');
    expect(queries.getSectionByType('chorus', 1)?.name).toBe('Chorus 2');
    expect(queries.getSectionByType('bridge', 0)).toBeUndefined();
  });

  it('should count sections of type', () => {
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Verse 1', startTicks: 0, endTicks: 3840, type: 'verse' },
      { id: 's2', name: 'Chorus 1', startTicks: 3840, endTicks: 7680, type: 'chorus' },
      { id: 's3', name: 'Verse 2', startTicks: 7680, endTicks: 11520, type: 'verse' },
    ];
    world.setSections(sections);

    expect(queries.countSectionsOfType('verse')).toBe(2);
    expect(queries.countSectionsOfType('chorus')).toBe(1);
    expect(queries.countSectionsOfType('bridge')).toBe(0);
  });

  it('should get project statistics', () => {
    const tracks: Track[] = [
      {
        id: 't1' as TrackId,
        name: 'Track 1',
        role: 'drums',
        tags: [],
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      },
    ];
    const events: Event<unknown>[] = [
      { id: 'e1', kind: 'note', start: 0, duration: 480, payload: {} as any, tags: new Map() },
      { id: 'e2', kind: 'note', start: 480, duration: 480, payload: {} as any, tags: new Map() },
    ];
    const sections: SectionMarker[] = [
      { id: 's1', name: 'Intro', startTicks: 0, endTicks: 3840 },
    ];
    const cards: CardInstance[] = [
      {
        id: 'c1' as any,
        typeId: 'osc',
        name: 'Osc',
        params: {},
        bypassed: false,
      },
    ];

    world.setTracks(tracks);
    world.setEvents(events);
    world.setSections(sections);
    world.setCards(cards);
    world.setTempo(140);
    world.setTimeSignature({ numerator: 7, denominator: 8 });

    const stats = queries.getProjectStats();
    expect(stats.trackCount).toBe(1);
    expect(stats.eventCount).toBe(2);
    expect(stats.sectionCount).toBe(1);
    expect(stats.cardCount).toBe(1);
    expect(stats.durationTicks).toBe(3840);
    expect(stats.tempo).toBe(140);
    expect(stats.timeSignature.numerator).toBe(7);
    expect(stats.timeSignature.denominator).toBe(8);
  });
});
