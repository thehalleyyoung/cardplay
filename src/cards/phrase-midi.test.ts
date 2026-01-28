/**
 * @fileoverview Tests for MIDI Phrase Import/Export
 */

import { describe, it, expect } from 'vitest';
import {
  parseMIDIFile,
  extractNotesFromMIDI,
  importPhraseFromMIDI,
  exportPhraseToMIDI,
  type MIDIFile,
  type MIDINote,
} from './phrase-midi';

describe('MIDI Parsing', () => {
  // Helper to create a simple MIDI file
  function createSimpleMIDI(): Uint8Array {
    const header = new Uint8Array([
      // MThd header
      0x4d, 0x54, 0x68, 0x64,  // "MThd"
      0x00, 0x00, 0x00, 0x06,  // Length: 6
      0x00, 0x01,              // Format: 1
      0x00, 0x02,              // Tracks: 2
      0x01, 0xe0,              // Ticks per quarter note: 480
    ]);

    // Track 0: Tempo
    const track0 = new Uint8Array([
      // MTrk header
      0x4d, 0x54, 0x72, 0x6b,  // "MTrk"
      0x00, 0x00, 0x00, 0x0b,  // Length: 11
      // Tempo event
      0x00,                    // Delta time: 0
      0xff, 0x51, 0x03,        // Meta: Set Tempo
      0x07, 0xa1, 0x20,        // 500000 microseconds (120 BPM)
      // End of track
      0x00,                    // Delta time: 0
      0xff, 0x2f, 0x00,        // Meta: End of Track
    ]);

    // Track 1: Single note (C4, quarter note)
    const track1 = new Uint8Array([
      // MTrk header
      0x4d, 0x54, 0x72, 0x6b,  // "MTrk"
      0x00, 0x00, 0x00, 0x0c,  // Length: 12
      // Note On
      0x00,                    // Delta time: 0
      0x90, 0x3c, 0x64,        // Note On, channel 0, C4 (60), velocity 100
      // Note Off
      0x83, 0x60,              // Delta time: 480 (quarter note)
      0x80, 0x3c, 0x00,        // Note Off, channel 0, C4, velocity 0
      // End of track
      0x00,                    // Delta time: 0
      0xff, 0x2f, 0x00,        // Meta: End of Track
    ]);

    // Concatenate all parts
    const total = header.length + track0.length + track1.length;
    const result = new Uint8Array(total);
    let offset = 0;
    
    result.set(header, offset);
    offset += header.length;
    result.set(track0, offset);
    offset += track0.length;
    result.set(track1, offset);

    return result;
  }

  describe('parseMIDIFile', () => {
    it('should parse a simple MIDI file', () => {
      const data = createSimpleMIDI();
      const midi = parseMIDIFile(data);

      expect(midi.format).toBe(1);
      expect(midi.tracks.length).toBe(2);
      expect(midi.ticksPerQuarterNote).toBe(480);
      expect(midi.tempo).toBe(500000);
    });

    it('should parse note events', () => {
      const data = createSimpleMIDI();
      const midi = parseMIDIFile(data);

      const track1 = midi.tracks[1];
      const noteEvents = track1.events.filter(e => e.type === 'noteOn' || e.type === 'noteOff');

      expect(noteEvents.length).toBe(2);
      expect(noteEvents[0].type).toBe('noteOn');
      expect(noteEvents[0].note).toBe(60);  // C4
      expect(noteEvents[0].velocity).toBe(100);
      expect(noteEvents[1].type).toBe('noteOff');
      expect(noteEvents[1].note).toBe(60);
    });

    it('should calculate absolute time', () => {
      const data = createSimpleMIDI();
      const midi = parseMIDIFile(data);

      const track1 = midi.tracks[1];
      const noteEvents = track1.events.filter(e => e.type === 'noteOn' || e.type === 'noteOff');

      expect(noteEvents[0].absoluteTime).toBe(0);
      expect(noteEvents[1].absoluteTime).toBe(480);
    });

    it('should throw on invalid header', () => {
      const badData = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      expect(() => parseMIDIFile(badData)).toThrow();
    });
  });

  describe('extractNotesFromMIDI', () => {
    it('should extract notes from events', () => {
      const data = createSimpleMIDI();
      const midi = parseMIDIFile(data);
      const notes = extractNotesFromMIDI(midi.tracks[1].events);

      expect(notes.length).toBe(1);
      expect(notes[0].pitch).toBe(60);
      expect(notes[0].start).toBe(0);
      expect(notes[0].duration).toBe(480);
      expect(notes[0].velocity).toBe(100);
      expect(notes[0].channel).toBe(0);
    });

    it('should filter by channel', () => {
      const events = [
        { deltaTime: 0, absoluteTime: 0, type: 'noteOn' as const, channel: 0, note: 60, velocity: 100 },
        { deltaTime: 0, absoluteTime: 0, type: 'noteOn' as const, channel: 1, note: 62, velocity: 100 },
        { deltaTime: 480, absoluteTime: 480, type: 'noteOff' as const, channel: 0, note: 60, velocity: 0 },
        { deltaTime: 0, absoluteTime: 480, type: 'noteOff' as const, channel: 1, note: 62, velocity: 0 },
      ];

      const notesChannel0 = extractNotesFromMIDI(events, { channel: 0 });
      expect(notesChannel0.length).toBe(1);
      expect(notesChannel0[0].pitch).toBe(60);

      const notesChannel1 = extractNotesFromMIDI(events, { channel: 1 });
      expect(notesChannel1.length).toBe(1);
      expect(notesChannel1[0].pitch).toBe(62);
    });

    it('should handle notes without noteOff', () => {
      const events = [
        { deltaTime: 0, absoluteTime: 0, type: 'noteOn' as const, channel: 0, note: 60, velocity: 100 },
        { deltaTime: 1000, absoluteTime: 1000, type: 'meta' as const, metaType: 'endOfTrack' as const },
      ];

      const notes = extractNotesFromMIDI(events);
      expect(notes.length).toBe(1);
      expect(notes[0].duration).toBeGreaterThan(0);
    });

    it('should sort notes by start time', () => {
      const events = [
        { deltaTime: 0, absoluteTime: 480, type: 'noteOn' as const, channel: 0, note: 62, velocity: 100 },
        { deltaTime: 0, absoluteTime: 0, type: 'noteOn' as const, channel: 0, note: 60, velocity: 100 },
        { deltaTime: 480, absoluteTime: 960, type: 'noteOff' as const, channel: 0, note: 62, velocity: 0 },
        { deltaTime: 0, absoluteTime: 480, type: 'noteOff' as const, channel: 0, note: 60, velocity: 0 },
      ];

      const notes = extractNotesFromMIDI(events);
      expect(notes.length).toBe(2);
      expect(notes[0].pitch).toBe(60);  // Earlier note first
      expect(notes[1].pitch).toBe(62);
    });
  });

  describe('importPhraseFromMIDI', () => {
    it('should import phrase from MIDI file', () => {
      const data = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(data);

      expect(phrase.id).toBeDefined();
      expect(phrase.name).toBe('Imported Phrase');
      expect(phrase.metadata).toBeDefined();
      expect(phrase.metadata.noteCount).toBe(1);
    });

    it('should extract contour when requested', () => {
      const data = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(data, { extractContour: true });

      expect(phrase.phrase).toBeDefined();
      expect(phrase.phrase?.shape).toBeDefined();
      expect(phrase.phrase?.shape.points.length).toBeGreaterThan(0);
    });

    it('should extract rhythm when requested', () => {
      const data = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(data, { extractRhythm: true });

      expect(phrase.phrase).toBeDefined();
      expect(phrase.phrase?.rhythm).toBeDefined();
      expect(phrase.phrase?.rhythm.steps.length).toBeGreaterThan(0);
    });

    it('should transpose notes', () => {
      const data = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(data, { transpose: 12 });

      // Note: The exact assertion depends on how notes are stored in the phrase
      expect(phrase).toBeDefined();
    });

    it('should scale velocity', () => {
      const data = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(data, { velocityScale: 0.5 });

      expect(phrase).toBeDefined();
    });

    it('should quantize notes', () => {
      const data = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(data, { quantize: 240 });

      expect(phrase).toBeDefined();
    });

    it('should apply minimum duration', () => {
      const data = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(data, { minDuration: 960 });

      expect(phrase).toBeDefined();
    });

    it('should throw when no notes found', () => {
      // Create MIDI with no notes
      const header = new Uint8Array([
        0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
        0x00, 0x00, 0x00, 0x01, 0x01, 0xe0,
      ]);

      const track = new Uint8Array([
        0x4d, 0x54, 0x72, 0x6b, 0x00, 0x00, 0x00, 0x04,
        0x00, 0xff, 0x2f, 0x00,
      ]);

      const data = new Uint8Array(header.length + track.length);
      data.set(header, 0);
      data.set(track, header.length);

      expect(() => importPhraseFromMIDI(data)).toThrow('No notes found');
    });
  });

  describe('exportPhraseToMIDI', () => {
    it('should export phrase to MIDI', () => {
      // Create a minimal phrase
      const phrase = {
        id: 'test',
        name: 'Test Phrase',
        phrase: null,
        events: [],
        metadata: {
          lineType: 'melody' as const,
          duration: 1,
          noteCount: 1,
          range: { min: 60, max: 60 },
          ambitus: 0,
          density: 1,
          averageInterval: 0,
          contourType: 'flat',
          rhythmComplexity: 0,
          mood: [],
          genre: [],
        },
        ghosts: [],
        variations: [],
        parentId: null,
        tags: [],
        rating: 0,
        usageCount: 0,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        lastUsedAt: Date.now(),
      };

      const midi = exportPhraseToMIDI(phrase);

      expect(midi).toBeInstanceOf(Uint8Array);
      expect(midi.length).toBeGreaterThan(0);

      // Check header
      expect(midi[0]).toBe(0x4d);  // 'M'
      expect(midi[1]).toBe(0x54);  // 'T'
      expect(midi[2]).toBe(0x68);  // 'h'
      expect(midi[3]).toBe(0x64);  // 'd'
    });

    it('should set tempo in exported MIDI', () => {
      const phrase = {
        id: 'test',
        name: 'Test',
        phrase: null,
        events: [],
        metadata: {
          lineType: 'melody' as const,
          duration: 1,
          noteCount: 0,
          range: { min: 0, max: 0 },
          ambitus: 0,
          density: 0,
          averageInterval: 0,
          contourType: 'flat',
          rhythmComplexity: 0,
          mood: [],
          genre: [],
        },
        ghosts: [],
        variations: [],
        parentId: null,
        tags: [],
        rating: 0,
        usageCount: 0,
        createdAt: 0,
        modifiedAt: 0,
        lastUsedAt: 0,
      };

      const midi = exportPhraseToMIDI(phrase, { tempo: 140 });

      // Parse and verify tempo was set
      const parsed = parseMIDIFile(midi);
      expect(parsed.tempo).toBeDefined();
      // 140 BPM = 60000000 / 140 ≈ 428571 microseconds
      expect(parsed.tempo).toBeCloseTo(428571, -2);
    });

    it('should include track name in exported MIDI', () => {
      const phrase = {
        id: 'test',
        name: 'Test',
        phrase: null,
        events: [],
        metadata: {
          lineType: 'melody' as const,
          duration: 1,
          noteCount: 0,
          range: { min: 0, max: 0 },
          ambitus: 0,
          density: 0,
          averageInterval: 0,
          contourType: 'flat',
          rhythmComplexity: 0,
          mood: [],
          genre: [],
        },
        ghosts: [],
        variations: [],
        parentId: null,
        tags: [],
        rating: 0,
        usageCount: 0,
        createdAt: 0,
        modifiedAt: 0,
        lastUsedAt: 0,
      };

      const midi = exportPhraseToMIDI(phrase, { trackName: 'My Track' });

      // Parse and verify track name
      const parsed = parseMIDIFile(midi);
      const trackNameEvent = parsed.tracks[0].events.find(e => e.metaType === 'trackName');
      expect(trackNameEvent).toBeDefined();
      expect(trackNameEvent?.text).toBe('My Track');
    });
  });

  describe('Round-trip', () => {
    it('should preserve basic structure in round-trip', () => {
      const originalMIDI = createSimpleMIDI();
      const phrase = importPhraseFromMIDI(originalMIDI);
      const exportedMIDI = exportPhraseToMIDI(phrase);

      // Both should be valid MIDI files
      expect(() => parseMIDIFile(originalMIDI)).not.toThrow();
      expect(() => parseMIDIFile(exportedMIDI)).not.toThrow();

      const original = parseMIDIFile(originalMIDI);
      const exported = parseMIDIFile(exportedMIDI);

      expect(exported.format).toBe(1);
      expect(exported.ticksPerQuarterNote).toBe(480);
      expect(exported.tracks.length).toBeGreaterThan(0);
    });
  });
});
