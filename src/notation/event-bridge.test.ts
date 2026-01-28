/**
 * @fileoverview Tests for Event Bridge and Ornaments/Dynamics.
 * 
 * Phase 11.2: Notation Event Display
 */

import { describe, it, expect } from 'vitest';
import {
  eventToNotation,
  eventsToNotation,
  quantizeEventToNotationGrid,
  inferAccidental,
  groupEventsIntoMeasures,
  NotationEventBridge,
  renderOrnament,
  renderDynamic,
  renderHairpin,
  renderExpression,
  renderTempo,
  renderRehearsalMark,
} from './index';
import { createNote, createMIDIPitch, Articulation } from '../voices/voice';
import { asTick, asTickDuration } from '../types/primitives';
import type { NotationUpdateSubscriber } from './event-bridge';
import { DEFAULT_STAFF_DIMENSIONS } from './staff';

describe('Event Bridge', () => {
  describe('eventToNotation', () => {
    it('should convert a single note event to notation', () => {
      const pitch = createMIDIPitch(60); // C4
      const note = createNote({
        pitch,
        start: asTick(0),
        duration: asTickDuration(480), // Quarter note at 480 TPQ
        velocity: 100,
      });
      
      const notation = eventToNotation(note, {
        ticksPerQuarter: 480,
        voice: 1,
        staff: 0,
      });
      
      expect(notation.notes).toHaveLength(1);
      expect(notation.notes[0].pitch).toBe(60);
      expect(notation.duration.base).toBe('quarter');
      expect(notation.tick).toBe(0);
      expect(notation.voice).toBe(1);
      expect(notation.staff).toBe(0);
      expect(notation.isRest).toBe(false);
    });
    
    it('should map articulations correctly', () => {
      const pitch = createMIDIPitch(60);
      const note = createNote({
        pitch,
        start: asTick(0),
        duration: asTickDuration(480),
        velocity: 100,
        articulation: Articulation.Staccato,
      });
      
      const notation = eventToNotation(note);
      
      expect(notation.articulations).toContain('staccato');
    });
    
    it('should quantize duration to nearest notation value', () => {
      const pitch = createMIDIPitch(60);
      const note = createNote({
        pitch,
        start: asTick(0),
        duration: asTickDuration(500), // Slightly longer than quarter
        velocity: 100,
      });
      
      const notation = eventToNotation(note, { ticksPerQuarter: 480 });
      
      // Should round to quarter note
      expect(notation.duration.base).toBe('quarter');
    });
  });
  
  describe('eventsToNotation', () => {
    it('should combine simultaneous notes into chords', () => {
      const pitches = [60, 64, 67].map(createMIDIPitch); // C major chord
      const notes = pitches.map(pitch =>
        createNote({
          pitch,
          start: asTick(0),
          duration: asTickDuration(480),
          velocity: 100,
        })
      );
      
      const notation = eventsToNotation(notes, { ticksPerQuarter: 480 });
      
      expect(notation).toHaveLength(1);
      expect(notation[0].notes).toHaveLength(3);
      expect(notation[0].notes.map(n => n.pitch)).toEqual([60, 64, 67]);
    });
    
    it('should keep separate notes at different times', () => {
      const pitch1 = createMIDIPitch(60);
      const pitch2 = createMIDIPitch(62);
      
      const note1 = createNote({
        pitch: pitch1,
        start: asTick(0),
        duration: asTickDuration(480),
        velocity: 100,
      });
      
      const note2 = createNote({
        pitch: pitch2,
        start: asTick(480),
        duration: asTickDuration(480),
        velocity: 100,
      });
      
      const notation = eventsToNotation([note1, note2], { ticksPerQuarter: 480 });
      
      expect(notation).toHaveLength(2);
      expect(notation[0].notes[0].pitch).toBe(60);
      expect(notation[1].notes[0].pitch).toBe(62);
    });
  });
  
  describe('quantizeEventToNotationGrid', () => {
    it('should quantize start and duration to grid', () => {
      const pitch = createMIDIPitch(60);
      const note = createNote({
        pitch,
        start: asTick(125), // Slightly off from 120 (16th at 480 TPQ)
        duration: asTickDuration(470), // Slightly off from 480
        velocity: 100,
      });
      
      const quantized = quantizeEventToNotationGrid(note, 480, '16th');
      
      expect(quantized.start).toBe(120); // Nearest 16th
      expect(quantized.duration).toBe(480); // Nearest 16th (quarter note)
    });
  });
  
  describe('inferAccidental', () => {
    it('should not show accidental for notes in key', () => {
      const keyC = { root: 'C' as const, mode: 'major' as const, accidentals: 0 };
      
      // C, D, E, F, G, A, B are all in C major
      expect(inferAccidental(60, keyC)).toBeUndefined(); // C
      expect(inferAccidental(62, keyC)).toBeUndefined(); // D
      expect(inferAccidental(64, keyC)).toBeUndefined(); // E
    });
    
    it('should show sharp for black keys in sharp keys', () => {
      const keyG = { root: 'G' as const, mode: 'major' as const, accidentals: 1 };
      
      expect(inferAccidental(61, keyG)).toBe('sharp'); // C#
    });
    
    it('should show flat for black keys in flat keys', () => {
      const keyF = { root: 'F' as const, mode: 'major' as const, accidentals: -1 };
      
      // C# (61) is not in F major - should show as Db (flat)
      expect(inferAccidental(61, keyF)).toBe('flat'); // Db
    });
    
    it('should show natural for white keys outside of key', () => {
      const keyG = { root: 'G' as const, mode: 'major' as const, accidentals: 1 };
      
      // F natural is outside of G major (which has F#)
      expect(inferAccidental(65, keyG)).toBe('natural');
    });
  });
  
  describe('groupEventsIntoMeasures', () => {
    it('should group events by measure', () => {
      const pitches = [60, 62, 64, 65].map(createMIDIPitch);
      const notes = pitches.map((pitch, i) =>
        createNote({
          pitch,
          start: asTick(i * 480),
          duration: asTickDuration(480),
          velocity: 100,
        })
      );
      
      const notation = eventsToNotation(notes);
      const timeSignature = { numerator: 4, denominator: 4 };
      
      const measures = groupEventsIntoMeasures(notation, timeSignature, 480);
      
      expect(measures).toHaveLength(1); // All 4 quarters fit in one 4/4 measure
      expect(measures[0].number).toBe(1);
      expect(measures[0].events.get(1)).toHaveLength(4);
    });
    
    it('should split events across multiple measures', () => {
      const pitches = Array(8).fill(0).map((_, i) => createMIDIPitch(60 + i));
      const notes = pitches.map((pitch, i) =>
        createNote({
          pitch,
          start: asTick(i * 480),
          duration: asTickDuration(480),
          velocity: 100,
        })
      );
      
      const notation = eventsToNotation(notes);
      const timeSignature = { numerator: 4, denominator: 4 };
      
      const measures = groupEventsIntoMeasures(notation, timeSignature, 480);
      
      expect(measures).toHaveLength(2); // 8 quarters = 2 measures of 4/4
    });
  });
  
  describe('NotationEventBridge', () => {
    it('should notify subscribers of new events', () => {
      const bridge = new NotationEventBridge();
      
      const addedEvents: any[] = [];
      const subscriber: NotationUpdateSubscriber = {
        onEventsAdded: (events) => { addedEvents.push(...events); },
        onEventsRemoved: () => {},
        onEventsModified: () => {},
      };
      
      bridge.subscribe(subscriber);
      
      const pitch = createMIDIPitch(60);
      const note = createNote({ pitch, start: 0, duration: 480, velocity: 100 });
      
      bridge.processEvents([note]);
      
      expect(addedEvents).toHaveLength(1);
      expect(addedEvents[0].notes[0].pitch).toBe(60);
    });
    
    it('should notify subscribers of modified events', () => {
      const bridge = new NotationEventBridge();
      
      const modifiedEvents: any[] = [];
      const subscriber: NotationUpdateSubscriber = {
        onEventsAdded: () => {},
        onEventsRemoved: () => {},
        onEventsModified: (events) => { modifiedEvents.push(...events); },
      };
      
      bridge.subscribe(subscriber);
      
      const pitch1 = createMIDIPitch(60);
      const note1 = createNote({ pitch: pitch1, start: 0, duration: 480, velocity: 100 });
      
      // First event
      bridge.processEvents([note1]);
      
      // Same ID, different pitch
      const pitch2 = createMIDIPitch(62);
      const note2 = { ...note1, payload: { ...note1.payload, pitch: pitch2 } };
      
      bridge.processEvents([note2 as any]);
      
      expect(modifiedEvents).toHaveLength(1);
      expect(modifiedEvents[0].notes[0].pitch).toBe(62);
    });
    
    it('should notify subscribers of removed events', () => {
      const bridge = new NotationEventBridge();
      
      const removedIds: string[] = [];
      const subscriber: NotationUpdateSubscriber = {
        onEventsAdded: () => {},
        onEventsRemoved: (ids) => { removedIds.push(...ids); },
        onEventsModified: () => {},
      };
      
      bridge.subscribe(subscriber);
      
      const pitch = createMIDIPitch(60);
      const note = createNote({ pitch, start: 0, duration: 480, velocity: 100 });
      
      bridge.processEvents([note]);
      bridge.removeEvents([note.id]);
      
      expect(removedIds).toContain(note.id);
    });
  });
});

describe('Ornaments, Dynamics, and Expression', () => {
  const dimensions = DEFAULT_STAFF_DIMENSIONS;
  
  describe('renderOrnament', () => {
    it('should render a trill', () => {
      const ornament = {
        type: 'trill' as const,
        noteId: 'note1',
        tick: 0,
      };
      
      const rendered = renderOrnament(ornament, 100, 100, dimensions);
      
      expect(rendered.type).toBe('trill');
      expect(rendered.svg).toContain('text');
      expect(rendered.svg).toContain('\uE566'); // Trill glyph
    });
    
    it('should render a mordent', () => {
      const ornament = {
        type: 'mordent' as const,
        noteId: 'note1',
        tick: 0,
      };
      
      const rendered = renderOrnament(ornament, 100, 100, dimensions);
      
      expect(rendered.type).toBe('mordent');
      expect(rendered.svg).toContain('text');
    });
  });
  
  describe('renderDynamic', () => {
    it('should render a piano marking', () => {
      const dynamic = {
        level: 'p' as const,
        tick: 0,
        voice: 1,
        staff: 0,
      };
      
      const rendered = renderDynamic(dynamic, 100, 100, dimensions);
      
      expect(rendered.level).toBe('p');
      expect(rendered.svg).toContain('text');
      expect(rendered.svg).toContain('italic');
    });
    
    it('should render a forte marking', () => {
      const dynamic = {
        level: 'f' as const,
        tick: 0,
        voice: 1,
        staff: 0,
      };
      
      const rendered = renderDynamic(dynamic, 100, 100, dimensions);
      
      expect(rendered.level).toBe('f');
      expect(rendered.svg).toContain('text');
    });
  });
  
  describe('renderHairpin', () => {
    it('should render a crescendo', () => {
      const hairpin = {
        type: 'crescendo' as const,
        startTick: 0,
        endTick: 1920,
        voice: 1,
        staff: 0,
      };
      
      const rendered = renderHairpin(hairpin, 100, 200, 100, dimensions);
      
      expect(rendered.type).toBe('crescendo');
      expect(rendered.svg).toContain('path');
    });
    
    it('should render a decrescendo', () => {
      const hairpin = {
        type: 'decrescendo' as const,
        startTick: 0,
        endTick: 1920,
        voice: 1,
        staff: 0,
      };
      
      const rendered = renderHairpin(hairpin, 100, 200, 100, dimensions);
      
      expect(rendered.type).toBe('decrescendo');
      expect(rendered.svg).toContain('path');
    });
  });
  
  describe('renderExpression', () => {
    it('should render expression text', () => {
      const expression = {
        text: 'rit.' as const,
        tick: 0,
        voice: 1,
        staff: 0,
      };
      
      const rendered = renderExpression(expression, 100, 100, dimensions);
      
      expect(rendered.text).toBe('rit.');
      expect(rendered.svg).toContain('text');
      expect(rendered.svg).toContain('italic');
    });
    
    it('should position expression above staff', () => {
      const expression = {
        text: 'dolce',
        tick: 0,
        voice: 1,
        staff: 0,
        position: 'above' as const,
      };
      
      const rendered = renderExpression(expression, 100, 100, dimensions);
      
      expect(rendered.y).toBeLessThan(100);
    });
    
    it('should position expression below staff', () => {
      const expression = {
        text: 'pizz.',
        tick: 0,
        voice: 1,
        staff: 0,
        position: 'below' as const,
      };
      
      const rendered = renderExpression(expression, 100, 100, dimensions);
      
      expect(rendered.y).toBeGreaterThan(100);
    });
  });
  
  describe('renderTempo', () => {
    it('should render tempo marking with text', () => {
      const tempo = {
        marking: 'Allegro',
        bpm: 120,
        tick: 0,
      };
      
      const rendered = renderTempo(tempo, 100, 100, dimensions);
      
      expect(rendered.marking).toBe('Allegro');
      expect(rendered.bpm).toBe(120);
      expect(rendered.svg).toContain('Allegro');
    });
    
    it('should render metronome marking when requested', () => {
      const tempo = {
        bpm: 120,
        tick: 0,
        showMetronome: true,
        beatUnit: 'quarter' as const,
      };
      
      const rendered = renderTempo(tempo, 100, 100, dimensions);
      
      expect(rendered.svg).toContain('= 120');
      expect(rendered.svg).toContain('\uE1D5'); // Quarter note glyph
    });
  });
  
  describe('renderRehearsalMark', () => {
    it('should render rehearsal mark with box', () => {
      const mark = {
        label: 'A',
        tick: 0,
        measure: 1,
        shape: 'box' as const,
      };
      
      const rendered = renderRehearsalMark(mark, 100, 100, dimensions);
      
      expect(rendered.label).toBe('A');
      expect(rendered.svg).toContain('rect');
      expect(rendered.svg).toContain('A');
    });
    
    it('should render rehearsal mark with circle', () => {
      const mark = {
        label: 'B',
        tick: 0,
        measure: 5,
        shape: 'circle' as const,
      };
      
      const rendered = renderRehearsalMark(mark, 100, 100, dimensions);
      
      expect(rendered.label).toBe('B');
      expect(rendered.svg).toContain('circle');
    });
    
    it('should render rehearsal mark without shape', () => {
      const mark = {
        label: 'Intro',
        tick: 0,
        measure: 1,
        shape: 'none' as const,
      };
      
      const rendered = renderRehearsalMark(mark, 100, 100, dimensions);
      
      expect(rendered.label).toBe('Intro');
      expect(rendered.svg).not.toContain('rect');
      expect(rendered.svg).not.toContain('circle');
      expect(rendered.svg).toContain('Intro');
    });
  });
});
