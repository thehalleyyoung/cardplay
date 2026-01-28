/**
 * @fileoverview Tests for Generator Cards.
 * 
 * Comprehensive tests covering:
 * - Drum machine (pads, patterns, step toggling)
 * - Bassline generator (styles, patterns)
 * - Chord progression (qualities, voicings, voice leading)
 * - Melody generator (contours, scales)
 * - Arpeggiator (patterns, octaves)
 * - Step sequencer (directions, steps)
 * - Loop player (slicing, tempo sync)
 * - Sampler (zones, key mapping)
 * - Synth presets (pad, lead, bass)
 * - Orchestral arrangement (voice distribution)
 */

import { describe, it, expect } from 'vitest';
import {
  // Drum Machine
  DrumPad,
  DrumMachineState,
  DEFAULT_DRUM_PAD_NAMES,
  DEFAULT_DRUM_PAD_NOTES,
  createDrumPad,
  createDrumMachineState,
  toggleDrumStep,
  setDrumPadVelocity,
  clearDrumPadPattern,
  clearDrumPattern,
  getActiveDrumPads,
  
  // Bassline
  BasslineState,
  BasslineNote,
  BasslineStyle,
  DEFAULT_BASSLINE_STATE,
  BASS_SCALE_INTERVALS,
  generateBassline,
  
  // Chord Progression
  ChordQuality,
  VoicingType,
  ChordDefinition,
  ChordProgressionState,
  CHORD_INTERVALS,
  DEFAULT_CHORD_PROGRESSION_STATE,
  getChordNotes,
  applyVoiceLeading,
  
  // Melody
  MelodyContour,
  MelodyRhythm,
  MelodyNote,
  MelodyState,
  DEFAULT_MELODY_STATE,
  getScaleNotes,
  generateMelody,
  
  // Arpeggiator
  ArpPattern,
  ArpeggiatorState,
  DEFAULT_ARPEGGIATOR_STATE,
  generateArpSequence,
  arpNoteOn,
  arpNoteOff,
  
  // Sequencer
  SequencerStep,
  SequencerState,
  DEFAULT_SEQUENCER_STEP,
  createSequencerState,
  setSequencerStepNote,
  toggleSequencerStep,
  getNextSequencerStep,
  
  // Loop Player
  LoopSlice,
  LoopPlayerState,
  DEFAULT_LOOP_PLAYER_STATE,
  calculateSyncedPlaybackRate,
  autoSliceLoop,
  
  // Sampler
  SamplerZone,
  SamplerState,
  DEFAULT_SAMPLER_STATE,
  findSamplerZones,
  addSamplerZone,
  
  // Synth Presets
  SynthParams,
  PAD_SYNTH_DEFAULTS,
  LEAD_SYNTH_DEFAULTS,
  BASS_SYNTH_DEFAULTS,
  
  // Orchestral
  OrchestraSection,
  VoiceDistribution,
  OrchestralArrangement,
  STRING_ARRANGEMENTS,
  BRASS_ARRANGEMENTS,
  arrangeForOrchestra,
} from './generators';

// ============================================================================
// DRUM MACHINE TESTS
// ============================================================================

describe('Drum Machine', () => {
  describe('Drum Pad Creation', () => {
    it('should create pad with default values', () => {
      const pad = createDrumPad(0);
      expect(pad.index).toBe(0);
      expect(pad.note).toBe(36); // Kick
      expect(pad.name).toBe('Kick');
      expect(pad.velocity).toBe(100);
      expect(pad.pan).toBe(0);
      expect(pad.volume).toBe(1);
      expect(pad.muted).toBe(false);
      expect(pad.solo).toBe(false);
    });
    
    it('should create pad with correct MIDI note mapping', () => {
      expect(createDrumPad(0).note).toBe(36);  // Kick
      expect(createDrumPad(1).note).toBe(38);  // Snare
      expect(createDrumPad(2).note).toBe(42);  // Closed HH
      expect(createDrumPad(3).note).toBe(46);  // Open HH
    });
    
    it('should create pad with correct names', () => {
      expect(createDrumPad(0).name).toBe('Kick');
      expect(createDrumPad(1).name).toBe('Snare');
      expect(createDrumPad(7).name).toBe('Crash');
      expect(createDrumPad(8).name).toBe('Ride');
    });
    
    it('should handle pad indices beyond defaults', () => {
      const pad = createDrumPad(20);
      expect(pad.index).toBe(20);
      expect(pad.note).toBe(56); // 36 + 20
      expect(pad.name).toBe('Pad 21');
    });
    
    it('should have default MIDI note constants', () => {
      expect(DEFAULT_DRUM_PAD_NOTES.length).toBe(16);
      expect(DEFAULT_DRUM_PAD_NOTES[0]).toBe(36);
      expect(DEFAULT_DRUM_PAD_NAMES.length).toBe(16);
      expect(DEFAULT_DRUM_PAD_NAMES[0]).toBe('Kick');
    });
  });
  
  describe('Drum Machine State', () => {
    it('should create initial state with 16 pads', () => {
      const state = createDrumMachineState();
      expect(state.pads.length).toBe(16);
      expect(state.patternLength).toBe(16);
      expect(state.currentStep).toBe(0);
      expect(state.swing).toBe(0);
      expect(state.volume).toBe(1);
      expect(state.playing).toBe(false);
    });
    
    it('should create empty pattern', () => {
      const state = createDrumMachineState();
      expect(state.pattern.length).toBe(16);
      expect(state.pattern[0]!.length).toBe(16);
      expect(state.pattern.every(row => row.every(step => step === false))).toBe(true);
    });
    
    it('should toggle step on', () => {
      const state = createDrumMachineState();
      const updated = toggleDrumStep(state, 0, 0);
      expect(updated.pattern[0]![0]).toBe(true);
    });
    
    it('should toggle step off', () => {
      let state = createDrumMachineState();
      state = toggleDrumStep(state, 0, 0);
      state = toggleDrumStep(state, 0, 0);
      expect(state.pattern[0]![0]).toBe(false);
    });
    
    it('should toggle multiple steps independently', () => {
      let state = createDrumMachineState();
      state = toggleDrumStep(state, 0, 0);
      state = toggleDrumStep(state, 0, 4);
      state = toggleDrumStep(state, 1, 2);
      expect(state.pattern[0]![0]).toBe(true);
      expect(state.pattern[0]![4]).toBe(true);
      expect(state.pattern[0]![1]).toBe(false);
      expect(state.pattern[1]![2]).toBe(true);
    });
  });
  
  describe('Pad Velocity', () => {
    it('should set pad velocity', () => {
      const state = createDrumMachineState();
      const updated = setDrumPadVelocity(state, 0, 127);
      expect(updated.pads[0]!.velocity).toBe(127);
    });
    
    it('should clamp velocity to 0-127', () => {
      const state = createDrumMachineState();
      const tooHigh = setDrumPadVelocity(state, 0, 200);
      expect(tooHigh.pads[0]!.velocity).toBe(127);
      
      const tooLow = setDrumPadVelocity(state, 0, -10);
      expect(tooLow.pads[0]!.velocity).toBe(0);
    });
  });
  
  describe('Pattern Clearing', () => {
    it('should clear single pad pattern', () => {
      let state = createDrumMachineState();
      state = toggleDrumStep(state, 0, 0);
      state = toggleDrumStep(state, 0, 4);
      state = toggleDrumStep(state, 1, 2);
      state = clearDrumPadPattern(state, 0);
      
      expect(state.pattern[0]!.every(s => s === false)).toBe(true);
      expect(state.pattern[1]![2]).toBe(true);
    });
    
    it('should clear entire pattern', () => {
      let state = createDrumMachineState();
      state = toggleDrumStep(state, 0, 0);
      state = toggleDrumStep(state, 1, 4);
      state = toggleDrumStep(state, 2, 8);
      state = clearDrumPattern(state);
      
      expect(state.pattern.every(row => row.every(step => step === false))).toBe(true);
    });
  });
  
  describe('Active Pads', () => {
    it('should return active pads for a step', () => {
      let state = createDrumMachineState();
      state = toggleDrumStep(state, 0, 0);
      state = toggleDrumStep(state, 1, 0);
      state = toggleDrumStep(state, 4, 0);
      
      const active = getActiveDrumPads(state, 0);
      expect(active).toEqual([0, 1, 4]);
    });
    
    it('should return empty array for inactive step', () => {
      const state = createDrumMachineState();
      const active = getActiveDrumPads(state, 5);
      expect(active).toEqual([]);
    });
  });
});

// ============================================================================
// BASSLINE GENERATOR TESTS
// ============================================================================

describe('Bassline Generator', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_BASSLINE_STATE.rootNote).toBe(36);
      expect(DEFAULT_BASSLINE_STATE.scale).toBe('minor');
      expect(DEFAULT_BASSLINE_STATE.style).toBe('root-fifth');
      expect(DEFAULT_BASSLINE_STATE.patternLength).toBe(16);
    });
  });
  
  describe('Scale Intervals', () => {
    it('should have major scale intervals', () => {
      expect(BASS_SCALE_INTERVALS.major).toEqual([0, 2, 4, 5, 7, 9, 11]);
    });
    
    it('should have minor scale intervals', () => {
      expect(BASS_SCALE_INTERVALS.minor).toEqual([0, 2, 3, 5, 7, 8, 10]);
    });
    
    it('should have pentatonic scale intervals', () => {
      expect(BASS_SCALE_INTERVALS.pentatonic).toEqual([0, 3, 5, 7, 10]);
    });
    
    it('should have blues scale intervals', () => {
      expect(BASS_SCALE_INTERVALS.blues).toEqual([0, 3, 5, 6, 7, 10]);
    });
  });
  
  describe('Pattern Generation', () => {
    it('should generate root-fifth pattern', () => {
      const state: BasslineState = { ...DEFAULT_BASSLINE_STATE, style: 'root-fifth' };
      const pattern = generateBassline(state);
      
      // Should have notes on beats 0, 2, 4, 6... (every other beat on quarter notes)
      expect(pattern.length).toBeGreaterThan(0);
      const firstNote = pattern[0]!;
      expect(firstNote.note).toBe(36); // Root
    });
    
    it('should generate octave pattern', () => {
      const state: BasslineState = { ...DEFAULT_BASSLINE_STATE, style: 'octave' };
      const pattern = generateBassline(state);
      
      expect(pattern.length).toBe(16);
      expect(pattern[0]!.note).toBe(36);
      expect(pattern[1]!.note).toBe(48); // Octave up
    });
    
    it('should generate walking bass pattern', () => {
      const state: BasslineState = { ...DEFAULT_BASSLINE_STATE, style: 'walking' };
      const pattern = generateBassline(state);
      
      expect(pattern.length).toBe(16);
      // Walking bass uses scale intervals
      const notes = pattern.map(n => n.note);
      expect(notes.every(n => n >= 36)).toBe(true);
    });
    
    it('should generate disco pattern', () => {
      const state: BasslineState = { ...DEFAULT_BASSLINE_STATE, style: 'disco' };
      const pattern = generateBassline(state);
      
      expect(pattern.length).toBe(16);
      // Alternating root and octave
      expect(pattern[0]!.note).toBe(36);
      expect(pattern[1]!.note).toBe(48);
    });
    
    it('should apply velocity variation', () => {
      const state: BasslineState = { 
        ...DEFAULT_BASSLINE_STATE, 
        style: 'octave',
        velocityVariation: 0.5 
      };
      const pattern = generateBassline(state);
      
      // With variation, velocities should differ
      const velocities = pattern.map(n => n.velocity);
      // At least some variation should exist
      expect(Math.max(...velocities) - Math.min(...velocities)).toBeGreaterThan(0);
    });
    
    it('should handle chord progression input', () => {
      const state: BasslineState = { ...DEFAULT_BASSLINE_STATE, style: 'root-fifth' };
      const chords = [
        { root: 48, quality: 'major' },
        { root: 53, quality: 'minor' },
      ];
      const pattern = generateBassline(state, chords);
      
      expect(pattern.length).toBeGreaterThan(0);
    });
  });
  
  describe('All Styles', () => {
    const styles: BasslineStyle[] = ['walking', 'octave', 'root-fifth', 'synth', 'funky', 'pedal', 'disco', 'reggae'];
    
    it.each(styles)('should generate valid pattern for %s style', (style) => {
      const state: BasslineState = { ...DEFAULT_BASSLINE_STATE, style };
      const pattern = generateBassline(state);
      
      expect(Array.isArray(pattern)).toBe(true);
      for (const note of pattern) {
        expect(note.step).toBeGreaterThanOrEqual(0);
        expect(note.note).toBeGreaterThan(0);
        expect(note.velocity).toBeGreaterThan(0);
        expect(note.velocity).toBeLessThanOrEqual(127);
      }
    });
  });
});

// ============================================================================
// CHORD PROGRESSION TESTS
// ============================================================================

describe('Chord Progression', () => {
  describe('Chord Intervals', () => {
    it('should have major triad intervals', () => {
      expect(CHORD_INTERVALS.major).toEqual([0, 4, 7]);
    });
    
    it('should have minor triad intervals', () => {
      expect(CHORD_INTERVALS.minor).toEqual([0, 3, 7]);
    });
    
    it('should have major 7th chord intervals', () => {
      expect(CHORD_INTERVALS.major7).toEqual([0, 4, 7, 11]);
    });
    
    it('should have dominant 7th chord intervals', () => {
      expect(CHORD_INTERVALS.dominant7).toEqual([0, 4, 7, 10]);
    });
    
    it('should have all chord qualities defined', () => {
      const qualities: ChordQuality[] = [
        'major', 'minor', 'diminished', 'augmented',
        'major7', 'minor7', 'dominant7', 'dim7', 'halfDim7',
        'sus2', 'sus4', 'add9', 'power'
      ];
      
      for (const quality of qualities) {
        expect(CHORD_INTERVALS[quality]).toBeDefined();
        expect(Array.isArray(CHORD_INTERVALS[quality])).toBe(true);
      }
    });
  });
  
  describe('getChordNotes', () => {
    it('should return C major triad notes', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'major',
        inversion: 0,
        voicing: 'close',
      };
      const notes = getChordNotes(chord);
      expect(notes).toEqual([60, 64, 67]); // C E G
    });
    
    it('should return C minor triad notes', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'minor',
        inversion: 0,
        voicing: 'close',
      };
      const notes = getChordNotes(chord);
      expect(notes).toEqual([60, 63, 67]); // C Eb G
    });
    
    it('should apply first inversion', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'major',
        inversion: 1,
        voicing: 'close',
      };
      const notes = getChordNotes(chord);
      expect(notes).toEqual([64, 67, 72]); // E G C
    });
    
    it('should apply second inversion', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'major',
        inversion: 2,
        voicing: 'close',
      };
      const notes = getChordNotes(chord);
      expect(notes).toEqual([67, 72, 76]); // G C E
    });
    
    it('should return 7th chord notes', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'major7',
        inversion: 0,
        voicing: 'close',
      };
      const notes = getChordNotes(chord);
      expect(notes).toEqual([60, 64, 67, 71]); // C E G B
    });
    
    it('should apply spread voicing', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'major',
        inversion: 0,
        voicing: 'spread',
      };
      const notes = getChordNotes(chord);
      // Every other note goes up an octave
      expect(notes[0]).toBe(60);
      expect(notes[1]).toBe(76); // E + 12
      expect(notes[2]).toBe(67);
    });
    
    it('should apply shell voicing', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'major7',
        inversion: 0,
        voicing: 'shell',
      };
      const notes = getChordNotes(chord);
      // Root + 3rd + 7th only
      expect(notes.length).toBe(3);
      expect(notes).toContain(60);
      expect(notes).toContain(64);
      expect(notes).toContain(71);
    });
    
    it('should apply rootless voicing', () => {
      const chord: ChordDefinition = {
        root: 60,
        quality: 'major7',
        inversion: 0,
        voicing: 'rootless',
      };
      const notes = getChordNotes(chord);
      // No root
      expect(notes).not.toContain(60);
      expect(notes.length).toBe(3);
    });
  });
  
  describe('Voice Leading', () => {
    it('should minimize voice movement', () => {
      const prevNotes = [60, 64, 67]; // C major
      const nextChord: ChordDefinition = {
        root: 65, // F
        quality: 'major',
        inversion: 0,
        voicing: 'close',
      };
      
      const result = applyVoiceLeading(prevNotes, nextChord);
      expect(result.length).toBeGreaterThan(0);
      
      // F major notes should be close to C major
      const totalMovement = result.reduce((sum, note, i) => {
        const prevNote = prevNotes[i] ?? prevNotes[prevNotes.length - 1]!;
        return sum + Math.abs(note - prevNote);
      }, 0);
      
      // Movement should be minimal
      expect(totalMovement).toBeLessThan(20);
    });
    
    it('should handle empty previous notes', () => {
      const nextChord: ChordDefinition = {
        root: 60,
        quality: 'major',
        inversion: 0,
        voicing: 'close',
      };
      
      const result = applyVoiceLeading([], nextChord);
      expect(result).toEqual([60, 64, 67]);
    });
  });
  
  describe('Default Progression State', () => {
    it('should have 4 chords', () => {
      expect(DEFAULT_CHORD_PROGRESSION_STATE.chords.length).toBe(4);
    });
    
    it('should start at chord 0', () => {
      expect(DEFAULT_CHORD_PROGRESSION_STATE.currentChord).toBe(0);
    });
    
    it('should have voice leading enabled', () => {
      expect(DEFAULT_CHORD_PROGRESSION_STATE.voiceLeading).toBe(true);
    });
  });
});

// ============================================================================
// MELODY GENERATOR TESTS
// ============================================================================

describe('Melody Generator', () => {
  describe('getScaleNotes', () => {
    it('should generate C minor scale', () => {
      const notes = getScaleNotes(60, 'minor', 1);
      expect(notes).toEqual([60, 62, 63, 65, 67, 68, 70]);
    });
    
    it('should generate C major scale', () => {
      const notes = getScaleNotes(60, 'major', 1);
      expect(notes).toEqual([60, 62, 64, 65, 67, 69, 71]);
    });
    
    it('should generate multiple octaves', () => {
      const notes = getScaleNotes(60, 'major', 2);
      expect(notes.length).toBe(14);
      expect(notes[7]).toBe(72); // C5
    });
  });
  
  describe('generateMelody', () => {
    it('should generate melody with correct length', () => {
      const state: MelodyState = { 
        ...DEFAULT_MELODY_STATE,
        density: 1,
        restProbability: 0,
      };
      const melody = generateMelody(state);
      expect(melody.length).toBe(16);
    });
    
    it('should respect density parameter', () => {
      const state: MelodyState = { 
        ...DEFAULT_MELODY_STATE,
        density: 0.5,
        restProbability: 0,
      };
      const melody = generateMelody(state);
      // With 50% density, we expect roughly half the notes
      expect(melody.length).toBeLessThan(16);
      expect(melody.length).toBeGreaterThan(0);
    });
    
    it('should add rests based on probability', () => {
      const state: MelodyState = { 
        ...DEFAULT_MELODY_STATE,
        density: 1,
        restProbability: 0.5,
      };
      const melody = generateMelody(state);
      expect(melody.length).toBeLessThan(16);
    });
    
    it('should mark accents on downbeats', () => {
      const state: MelodyState = { 
        ...DEFAULT_MELODY_STATE,
        density: 1,
        restProbability: 0,
      };
      const melody = generateMelody(state);
      
      const downbeatNotes = melody.filter(n => n.step % 4 === 0);
      expect(downbeatNotes.every(n => n.accent)).toBe(true);
    });
    
    it('should use scale notes only', () => {
      const state: MelodyState = { 
        ...DEFAULT_MELODY_STATE,
        density: 1,
        restProbability: 0,
        scale: 'major',
        rootNote: 60,
      };
      const melody = generateMelody(state);
      const scaleNotes = getScaleNotes(60, 'major', 2);
      
      for (const note of melody) {
        expect(scaleNotes).toContain(note.note);
      }
    });
  });
  
  describe('Contours', () => {
    const contours: MelodyContour[] = ['ascending', 'descending', 'arch', 'inverted-arch', 'wave', 'random', 'static'];
    
    it.each(contours)('should generate valid melody for %s contour', (contour) => {
      const state: MelodyState = { 
        ...DEFAULT_MELODY_STATE,
        contour,
        density: 1,
        restProbability: 0,
      };
      const melody = generateMelody(state);
      
      expect(melody.length).toBe(16);
      for (const note of melody) {
        expect(note.note).toBeGreaterThan(0);
        expect(note.velocity).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// ARPEGGIATOR TESTS
// ============================================================================

describe('Arpeggiator', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_ARPEGGIATOR_STATE.heldNotes).toEqual([]);
      expect(DEFAULT_ARPEGGIATOR_STATE.pattern).toBe('up');
      expect(DEFAULT_ARPEGGIATOR_STATE.octaves).toBe(1);
      expect(DEFAULT_ARPEGGIATOR_STATE.gate).toBe(0.5);
    });
  });
  
  describe('arpNoteOn/arpNoteOff', () => {
    it('should add note on', () => {
      let state = DEFAULT_ARPEGGIATOR_STATE;
      state = arpNoteOn(state, 60);
      expect(state.heldNotes).toEqual([60]);
    });
    
    it('should not add duplicate notes', () => {
      let state = DEFAULT_ARPEGGIATOR_STATE;
      state = arpNoteOn(state, 60);
      state = arpNoteOn(state, 60);
      expect(state.heldNotes).toEqual([60]);
    });
    
    it('should add multiple notes', () => {
      let state = DEFAULT_ARPEGGIATOR_STATE;
      state = arpNoteOn(state, 60);
      state = arpNoteOn(state, 64);
      state = arpNoteOn(state, 67);
      expect(state.heldNotes).toEqual([60, 64, 67]);
    });
    
    it('should remove note on off', () => {
      let state = DEFAULT_ARPEGGIATOR_STATE;
      state = arpNoteOn(state, 60);
      state = arpNoteOn(state, 64);
      state = arpNoteOff(state, 60);
      expect(state.heldNotes).toEqual([64]);
    });
    
    it('should update sequence on note change', () => {
      let state = DEFAULT_ARPEGGIATOR_STATE;
      state = arpNoteOn(state, 60);
      state = arpNoteOn(state, 64);
      expect(state.sequence.length).toBeGreaterThan(0);
    });
  });
  
  describe('generateArpSequence', () => {
    it('should return empty for no notes', () => {
      const seq = generateArpSequence(DEFAULT_ARPEGGIATOR_STATE);
      expect(seq).toEqual([]);
    });
    
    it('should generate up pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67],
        pattern: 'up',
      };
      const seq = generateArpSequence(state);
      expect(seq).toEqual([60, 64, 67]);
    });
    
    it('should generate down pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67],
        pattern: 'down',
      };
      const seq = generateArpSequence(state);
      expect(seq).toEqual([67, 64, 60]);
    });
    
    it('should generate up-down pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67],
        pattern: 'up-down',
      };
      const seq = generateArpSequence(state);
      expect(seq).toEqual([60, 64, 67, 64]);
    });
    
    it('should generate down-up pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67],
        pattern: 'down-up',
      };
      const seq = generateArpSequence(state);
      expect(seq).toEqual([67, 64, 60, 64]);
    });
    
    it('should expand octaves', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64],
        pattern: 'up',
        octaves: 2,
      };
      const seq = generateArpSequence(state);
      expect(seq).toEqual([60, 64, 72, 76]);
    });
    
    it('should generate converge pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67, 72],
        pattern: 'converge',
      };
      const seq = generateArpSequence(state);
      expect(seq).toEqual([60, 72, 64, 67]);
    });
    
    it('should generate diverge pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67, 72],
        pattern: 'diverge',
      };
      const seq = generateArpSequence(state);
      // Starts from middle, goes outward
      expect(seq.length).toBe(4);
    });
    
    it('should generate thumb pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67],
        pattern: 'thumb',
      };
      const seq = generateArpSequence(state);
      // Lowest note repeated between others
      expect(seq).toEqual([60, 60, 64, 60, 67]);
    });
    
    it('should handle random pattern', () => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67],
        pattern: 'random',
      };
      const seq = generateArpSequence(state);
      expect(seq.length).toBe(3);
      expect(seq).toContain(60);
      expect(seq).toContain(64);
      expect(seq).toContain(67);
    });
  });
  
  describe('All Patterns', () => {
    const patterns: ArpPattern[] = ['up', 'down', 'up-down', 'down-up', 'random', 'order', 'converge', 'diverge', 'thumb'];
    
    it.each(patterns)('should generate valid sequence for %s pattern', (pattern) => {
      const state: ArpeggiatorState = {
        ...DEFAULT_ARPEGGIATOR_STATE,
        heldNotes: [60, 64, 67],
        pattern,
      };
      const seq = generateArpSequence(state);
      
      expect(seq.length).toBeGreaterThan(0);
      for (const note of seq) {
        expect([60, 64, 67]).toContain(note);
      }
    });
  });
});

// ============================================================================
// STEP SEQUENCER TESTS
// ============================================================================

describe('Step Sequencer', () => {
  describe('Default Step', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_SEQUENCER_STEP.note).toBe(60);
      expect(DEFAULT_SEQUENCER_STEP.velocity).toBe(100);
      expect(DEFAULT_SEQUENCER_STEP.gate).toBe(0.5);
      expect(DEFAULT_SEQUENCER_STEP.slide).toBe(false);
      expect(DEFAULT_SEQUENCER_STEP.accent).toBe(false);
      expect(DEFAULT_SEQUENCER_STEP.active).toBe(true);
    });
  });
  
  describe('createSequencerState', () => {
    it('should create state with default 8 steps', () => {
      const state = createSequencerState();
      expect(state.patternLength).toBe(8);
      expect(state.steps.length).toBe(32);
    });
    
    it('should create state with custom step count', () => {
      const state = createSequencerState(16);
      expect(state.patternLength).toBe(16);
    });
    
    it('should start at step 0', () => {
      const state = createSequencerState();
      expect(state.currentStep).toBe(0);
    });
    
    it('should not be playing', () => {
      const state = createSequencerState();
      expect(state.playing).toBe(false);
    });
  });
  
  describe('setSequencerStepNote', () => {
    it('should set note for a step', () => {
      const state = createSequencerState();
      const updated = setSequencerStepNote(state, 0, 72);
      expect(updated.steps[0]!.note).toBe(72);
    });
    
    it('should not affect other steps', () => {
      const state = createSequencerState();
      const updated = setSequencerStepNote(state, 0, 72);
      expect(updated.steps[1]!.note).toBe(60);
    });
  });
  
  describe('toggleSequencerStep', () => {
    it('should toggle step off', () => {
      const state = createSequencerState();
      const updated = toggleSequencerStep(state, 0);
      expect(updated.steps[0]!.active).toBe(false);
    });
    
    it('should toggle step on', () => {
      let state = createSequencerState();
      state = toggleSequencerStep(state, 0);
      state = toggleSequencerStep(state, 0);
      expect(state.steps[0]!.active).toBe(true);
    });
  });
  
  describe('getNextSequencerStep', () => {
    it('should return next step for forward direction', () => {
      const state: SequencerState = {
        ...createSequencerState(),
        currentStep: 3,
        direction: 'forward',
      };
      expect(getNextSequencerStep(state)).toBe(4);
    });
    
    it('should wrap around for forward direction', () => {
      const state: SequencerState = {
        ...createSequencerState(),
        currentStep: 7,
        patternLength: 8,
        direction: 'forward',
      };
      expect(getNextSequencerStep(state)).toBe(0);
    });
    
    it('should return previous step for backward direction', () => {
      const state: SequencerState = {
        ...createSequencerState(),
        currentStep: 3,
        direction: 'backward',
      };
      expect(getNextSequencerStep(state)).toBe(2);
    });
    
    it('should wrap around for backward direction', () => {
      const state: SequencerState = {
        ...createSequencerState(),
        currentStep: 0,
        patternLength: 8,
        direction: 'backward',
      };
      expect(getNextSequencerStep(state)).toBe(7);
    });
    
    it('should return random step for random direction', () => {
      const state: SequencerState = {
        ...createSequencerState(),
        currentStep: 0,
        patternLength: 8,
        direction: 'random',
      };
      const next = getNextSequencerStep(state);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(8);
    });
  });
});

// ============================================================================
// LOOP PLAYER TESTS
// ============================================================================

describe('Loop Player', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_LOOP_PLAYER_STATE.bufferId).toBeNull();
      expect(DEFAULT_LOOP_PLAYER_STATE.playbackRate).toBe(1);
      expect(DEFAULT_LOOP_PLAYER_STATE.loopStart).toBe(0);
      expect(DEFAULT_LOOP_PLAYER_STATE.loopEnd).toBe(1);
      expect(DEFAULT_LOOP_PLAYER_STATE.syncToTempo).toBe(true);
    });
  });
  
  describe('calculateSyncedPlaybackRate', () => {
    it('should return 1 for same tempo', () => {
      expect(calculateSyncedPlaybackRate(120, 120)).toBe(1);
    });
    
    it('should double for double tempo', () => {
      expect(calculateSyncedPlaybackRate(120, 240)).toBe(2);
    });
    
    it('should halve for half tempo', () => {
      expect(calculateSyncedPlaybackRate(120, 60)).toBe(0.5);
    });
    
    it('should apply pitch shift', () => {
      // Pitch shift of 12 semitones = 2x
      expect(calculateSyncedPlaybackRate(120, 120, 12)).toBe(2);
    });
    
    it('should combine tempo and pitch', () => {
      // 2x tempo * 2x pitch = 4x
      expect(calculateSyncedPlaybackRate(120, 240, 12)).toBe(4);
    });
  });
  
  describe('autoSliceLoop', () => {
    it('should create correct number of slices', () => {
      const slices = autoSliceLoop(44100, 4);
      expect(slices.length).toBe(4);
    });
    
    it('should create equal-sized slices', () => {
      const slices = autoSliceLoop(44100, 4);
      const sliceLength = 44100 / 4;
      
      expect(slices[0]!.startSample).toBe(0);
      expect(slices[0]!.endSample).toBe(sliceLength);
      expect(slices[1]!.startSample).toBe(sliceLength);
      expect(slices[1]!.endSample).toBe(sliceLength * 2);
    });
    
    it('should assign unique IDs', () => {
      const slices = autoSliceLoop(44100, 4);
      const ids = slices.map(s => s.id);
      expect(new Set(ids).size).toBe(4);
    });
    
    it('should set default slice parameters', () => {
      const slices = autoSliceLoop(44100, 4);
      expect(slices[0]!.pitch).toBe(0);
      expect(slices[0]!.gain).toBe(1);
      expect(slices[0]!.reverse).toBe(false);
    });
  });
});

// ============================================================================
// SAMPLER TESTS
// ============================================================================

describe('Sampler', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_SAMPLER_STATE.zones).toEqual([]);
      expect(DEFAULT_SAMPLER_STATE.volume).toBe(1);
      expect(DEFAULT_SAMPLER_STATE.polyphony).toBe(32);
      expect(DEFAULT_SAMPLER_STATE.attack).toBe(0.001);
      expect(DEFAULT_SAMPLER_STATE.release).toBe(0.1);
    });
  });
  
  describe('addSamplerZone', () => {
    it('should add zone to sampler', () => {
      const zone: SamplerZone = {
        id: 'zone-1',
        sampleId: 'sample-1',
        lowKey: 60,
        highKey: 72,
        rootKey: 66,
        lowVelocity: 0,
        highVelocity: 127,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      const state = addSamplerZone(DEFAULT_SAMPLER_STATE, zone);
      expect(state.zones.length).toBe(1);
      expect(state.zones[0]).toEqual(zone);
    });
    
    it('should add multiple zones', () => {
      const zone1: SamplerZone = {
        id: 'zone-1',
        sampleId: 'sample-1',
        lowKey: 36,
        highKey: 59,
        rootKey: 48,
        lowVelocity: 0,
        highVelocity: 127,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      const zone2: SamplerZone = {
        id: 'zone-2',
        sampleId: 'sample-2',
        lowKey: 60,
        highKey: 83,
        rootKey: 72,
        lowVelocity: 0,
        highVelocity: 127,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      let state = addSamplerZone(DEFAULT_SAMPLER_STATE, zone1);
      state = addSamplerZone(state, zone2);
      expect(state.zones.length).toBe(2);
    });
  });
  
  describe('findSamplerZones', () => {
    it('should find zone for matching note', () => {
      const zone: SamplerZone = {
        id: 'zone-1',
        sampleId: 'sample-1',
        lowKey: 60,
        highKey: 72,
        rootKey: 66,
        lowVelocity: 0,
        highVelocity: 127,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      const state = addSamplerZone(DEFAULT_SAMPLER_STATE, zone);
      const found = findSamplerZones(state, 66, 100);
      
      expect(found.length).toBe(1);
      expect(found[0]).toEqual(zone);
    });
    
    it('should not find zone for non-matching note', () => {
      const zone: SamplerZone = {
        id: 'zone-1',
        sampleId: 'sample-1',
        lowKey: 60,
        highKey: 72,
        rootKey: 66,
        lowVelocity: 0,
        highVelocity: 127,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      const state = addSamplerZone(DEFAULT_SAMPLER_STATE, zone);
      const found = findSamplerZones(state, 36, 100);
      
      expect(found.length).toBe(0);
    });
    
    it('should filter by velocity', () => {
      const softZone: SamplerZone = {
        id: 'soft',
        sampleId: 'sample-soft',
        lowKey: 60,
        highKey: 72,
        rootKey: 66,
        lowVelocity: 0,
        highVelocity: 63,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      const hardZone: SamplerZone = {
        id: 'hard',
        sampleId: 'sample-hard',
        lowKey: 60,
        highKey: 72,
        rootKey: 66,
        lowVelocity: 64,
        highVelocity: 127,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      let state = addSamplerZone(DEFAULT_SAMPLER_STATE, softZone);
      state = addSamplerZone(state, hardZone);
      
      const soft = findSamplerZones(state, 66, 50);
      expect(soft.length).toBe(1);
      expect(soft[0]!.id).toBe('soft');
      
      const hard = findSamplerZones(state, 66, 100);
      expect(hard.length).toBe(1);
      expect(hard[0]!.id).toBe('hard');
    });
    
    it('should find overlapping zones', () => {
      const zone1: SamplerZone = {
        id: 'zone-1',
        sampleId: 'sample-1',
        lowKey: 60,
        highKey: 72,
        rootKey: 66,
        lowVelocity: 0,
        highVelocity: 127,
        volume: 1,
        pan: 0,
        tuning: 0,
        loopEnabled: false,
      };
      
      const zone2: SamplerZone = {
        id: 'zone-2',
        sampleId: 'sample-2',
        lowKey: 65,
        highKey: 80,
        rootKey: 72,
        lowVelocity: 0,
        highVelocity: 127,
        volume: 0.5,
        pan: -0.5,
        tuning: 0,
        loopEnabled: false,
      };
      
      let state = addSamplerZone(DEFAULT_SAMPLER_STATE, zone1);
      state = addSamplerZone(state, zone2);
      
      const found = findSamplerZones(state, 68, 100);
      expect(found.length).toBe(2);
    });
  });
});

// ============================================================================
// SYNTH PRESETS TESTS
// ============================================================================

describe('Synth Presets', () => {
  describe('Pad Synth Defaults', () => {
    it('should have multiple oscillators', () => {
      expect(PAD_SYNTH_DEFAULTS.oscillators.length).toBe(2);
    });
    
    it('should have slow attack', () => {
      expect(PAD_SYNTH_DEFAULTS.ampEnv.attack).toBeGreaterThan(0.1);
    });
    
    it('should have high polyphony', () => {
      expect(PAD_SYNTH_DEFAULTS.polyphony).toBeGreaterThanOrEqual(8);
    });
    
    it('should have reverb', () => {
      expect(PAD_SYNTH_DEFAULTS.effects.reverbMix).toBeGreaterThan(0);
    });
    
    it('should have detuned oscillators', () => {
      const osc1 = PAD_SYNTH_DEFAULTS.oscillators[0]!;
      const osc2 = PAD_SYNTH_DEFAULTS.oscillators[1]!;
      expect(osc1.detune).not.toBe(osc2.detune);
    });
  });
  
  describe('Lead Synth Defaults', () => {
    it('should have monophonic or low polyphony', () => {
      expect(LEAD_SYNTH_DEFAULTS.polyphony).toBeLessThanOrEqual(4);
    });
    
    it('should have fast attack', () => {
      expect(LEAD_SYNTH_DEFAULTS.ampEnv.attack).toBeLessThan(0.05);
    });
    
    it('should have glide', () => {
      expect(LEAD_SYNTH_DEFAULTS.glide).toBeGreaterThan(0);
    });
    
    it('should have high filter cutoff', () => {
      expect(LEAD_SYNTH_DEFAULTS.filter.cutoff).toBeGreaterThan(0.5);
    });
  });
  
  describe('Bass Synth Defaults', () => {
    it('should have oscillators in lower octave', () => {
      expect(BASS_SYNTH_DEFAULTS.oscillators[0]!.octave).toBeLessThan(0);
    });
    
    it('should have fast attack', () => {
      expect(BASS_SYNTH_DEFAULTS.ampEnv.attack).toBeLessThan(0.05);
    });
    
    it('should have no reverb', () => {
      expect(BASS_SYNTH_DEFAULTS.effects.reverbMix).toBe(0);
    });
    
    it('should have medium filter cutoff', () => {
      expect(BASS_SYNTH_DEFAULTS.filter.cutoff).toBeLessThan(0.7);
    });
  });
  
  describe('All Presets Structure', () => {
    const presets = [PAD_SYNTH_DEFAULTS, LEAD_SYNTH_DEFAULTS, BASS_SYNTH_DEFAULTS];
    
    it.each(presets)('should have valid oscillators', (preset) => {
      expect(preset.oscillators.length).toBeGreaterThan(0);
      for (const osc of preset.oscillators) {
        expect(typeof osc.waveform).toBe('string');
        expect(typeof osc.detune).toBe('number');
        expect(typeof osc.volume).toBe('number');
      }
    });
    
    it.each(presets)('should have valid filter', (preset) => {
      expect(['lowpass', 'highpass', 'bandpass']).toContain(preset.filter.type);
      expect(preset.filter.cutoff).toBeGreaterThanOrEqual(0);
      expect(preset.filter.cutoff).toBeLessThanOrEqual(1);
      expect(preset.filter.resonance).toBeGreaterThanOrEqual(0);
    });
    
    it.each(presets)('should have valid amp envelope', (preset) => {
      expect(preset.ampEnv.attack).toBeGreaterThanOrEqual(0);
      expect(preset.ampEnv.decay).toBeGreaterThanOrEqual(0);
      expect(preset.ampEnv.sustain).toBeGreaterThanOrEqual(0);
      expect(preset.ampEnv.sustain).toBeLessThanOrEqual(1);
      expect(preset.ampEnv.release).toBeGreaterThanOrEqual(0);
    });
    
    it.each(presets)('should have valid effects', (preset) => {
      expect(preset.effects.reverbMix).toBeGreaterThanOrEqual(0);
      expect(preset.effects.reverbMix).toBeLessThanOrEqual(1);
      expect(preset.effects.delayMix).toBeGreaterThanOrEqual(0);
      expect(preset.effects.delayMix).toBeLessThanOrEqual(1);
    });
  });
});

// ============================================================================
// ORCHESTRAL ARRANGEMENT TESTS
// ============================================================================

describe('Orchestral Arrangement', () => {
  describe('String Arrangements', () => {
    it('should have string quartet arrangement', () => {
      const quartet = STRING_ARRANGEMENTS.find(a => a.name === 'String Quartet');
      expect(quartet).toBeDefined();
      expect(quartet!.voices.length).toBe(4);
    });
    
    it('should have full strings arrangement', () => {
      const full = STRING_ARRANGEMENTS.find(a => a.name === 'Full Strings');
      expect(full).toBeDefined();
      expect(full!.voices.length).toBe(5); // With bass
    });
    
    it('should have correct instruments in quartet', () => {
      const quartet = STRING_ARRANGEMENTS.find(a => a.name === 'String Quartet')!;
      const instruments = quartet.voices.map(v => v.instrument);
      expect(instruments).toContain('Violin 1');
      expect(instruments).toContain('Violin 2');
      expect(instruments).toContain('Viola');
      expect(instruments).toContain('Cello');
    });
  });
  
  describe('Brass Arrangements', () => {
    it('should have horn section arrangement', () => {
      const hornSection = BRASS_ARRANGEMENTS.find(a => a.name === 'Horn Section');
      expect(hornSection).toBeDefined();
      expect(hornSection!.voices.length).toBe(4);
    });
  });
  
  describe('arrangeForOrchestra', () => {
    it('should arrange chord for string quartet', () => {
      const chord = [60, 64, 67, 72]; // C major with octave
      const quartet = STRING_ARRANGEMENTS.find(a => a.name === 'String Quartet')!;
      
      const arranged = arrangeForOrchestra(chord, quartet, 100);
      
      expect(arranged.length).toBe(4);
      for (const voice of arranged) {
        expect(voice.note).toBeGreaterThan(0);
        expect(voice.velocity).toBeGreaterThan(0);
        expect(voice.velocity).toBeLessThanOrEqual(100);
        expect(voice.instrument).toBeDefined();
      }
    });
    
    it('should apply octave offsets', () => {
      const chord = [60, 64, 67]; // C major
      const quartet = STRING_ARRANGEMENTS.find(a => a.name === 'String Quartet')!;
      
      const arranged = arrangeForOrchestra(chord, quartet, 100);
      
      // Cello should be lower (negative octave offset)
      const cello = arranged.find(v => v.instrument === 'Cello');
      expect(cello).toBeDefined();
      expect(cello!.note).toBeLessThan(60);
    });
    
    it('should apply velocity scaling', () => {
      const chord = [60, 64, 67, 72];
      const quartet = STRING_ARRANGEMENTS.find(a => a.name === 'String Quartet')!;
      
      const arranged = arrangeForOrchestra(chord, quartet, 100);
      
      // Violin 1 has velocityScale 1.0, others less
      const violin1 = arranged.find(v => v.instrument === 'Violin 1');
      const viola = arranged.find(v => v.instrument === 'Viola');
      
      expect(violin1!.velocity).toBe(100);
      expect(viola!.velocity).toBeLessThan(100);
    });
    
    it('should handle fewer chord notes than voices', () => {
      const chord = [60, 64]; // Only 2 notes
      const quartet = STRING_ARRANGEMENTS.find(a => a.name === 'String Quartet')!;
      
      const arranged = arrangeForOrchestra(chord, quartet, 100);
      
      // Should still produce 4 voices by doubling
      expect(arranged.length).toBe(4);
    });
    
    it('should handle doubling voices', () => {
      const chord = [60, 64, 67, 72];
      const fullStrings = STRING_ARRANGEMENTS.find(a => a.name === 'Full Strings')!;
      
      const arranged = arrangeForOrchestra(chord, fullStrings, 100);
      
      // Bass doubles cello
      const bass = arranged.find(v => v.instrument === 'Bass');
      const cello = arranged.find(v => v.instrument === 'Cello');
      
      expect(bass).toBeDefined();
      expect(cello).toBeDefined();
      // Bass note should be an octave below something
      expect(bass!.note % 12).toBe(cello!.note % 12);
    });
    
    it('should assign correct MIDI channels', () => {
      const chord = [60, 64, 67, 72];
      const quartet = STRING_ARRANGEMENTS.find(a => a.name === 'String Quartet')!;
      
      const arranged = arrangeForOrchestra(chord, quartet, 100);
      
      const channels = arranged.map(v => v.channel);
      expect(channels).toEqual([1, 2, 3, 4]);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Generator Cards Integration', () => {
  it('should work together: chord + bassline', () => {
    const chords = DEFAULT_CHORD_PROGRESSION_STATE.chords.map(c => ({
      root: c.root,
      quality: c.quality,
    }));
    
    const bassline = generateBassline(DEFAULT_BASSLINE_STATE, chords);
    
    expect(bassline.length).toBeGreaterThan(0);
    // Bass notes should follow chord roots
    const bassRoots = bassline.map(n => n.note % 12);
    expect(bassRoots).toContain(0); // C
  });
  
  it('should work together: chord + arpeggiator', () => {
    const chord = getChordNotes({
      root: 60,
      quality: 'major',
      inversion: 0,
      voicing: 'close',
    });
    
    let arpState = DEFAULT_ARPEGGIATOR_STATE;
    for (const note of chord) {
      arpState = arpNoteOn(arpState, note);
    }
    
    expect(arpState.sequence).toEqual([60, 64, 67]);
  });
  
  it('should work together: melody + scale', () => {
    const melodyState: MelodyState = {
      ...DEFAULT_MELODY_STATE,
      scale: 'pentatonic',
      density: 1,
      restProbability: 0,
    };
    
    const melody = generateMelody(melodyState);
    const pentatonicNotes = getScaleNotes(60, 'pentatonic', 2);
    
    for (const note of melody) {
      expect(pentatonicNotes).toContain(note.note);
    }
  });
  
  it('should work together: drum machine + active pads', () => {
    let drumState = createDrumMachineState();
    
    // Create a basic 4-on-floor pattern
    drumState = toggleDrumStep(drumState, 0, 0);  // Kick on 1
    drumState = toggleDrumStep(drumState, 0, 4);  // Kick on 2
    drumState = toggleDrumStep(drumState, 0, 8);  // Kick on 3
    drumState = toggleDrumStep(drumState, 0, 12); // Kick on 4
    drumState = toggleDrumStep(drumState, 2, 2);  // Hi-hat
    drumState = toggleDrumStep(drumState, 2, 6);
    drumState = toggleDrumStep(drumState, 2, 10);
    drumState = toggleDrumStep(drumState, 2, 14);
    
    const beat1 = getActiveDrumPads(drumState, 0);
    expect(beat1).toContain(0); // Kick
    
    const offbeat = getActiveDrumPads(drumState, 2);
    expect(offbeat).toContain(2); // Hi-hat
  });
  
  it('should work together: sampler zones + velocity layers', () => {
    const softPiano: SamplerZone = {
      id: 'piano-soft',
      sampleId: 'piano-p',
      lowKey: 21,
      highKey: 108,
      rootKey: 60,
      lowVelocity: 0,
      highVelocity: 50,
      volume: 1,
      pan: 0,
      tuning: 0,
      loopEnabled: false,
    };
    
    const mediumPiano: SamplerZone = {
      id: 'piano-medium',
      sampleId: 'piano-mf',
      lowKey: 21,
      highKey: 108,
      rootKey: 60,
      lowVelocity: 51,
      highVelocity: 100,
      volume: 1,
      pan: 0,
      tuning: 0,
      loopEnabled: false,
    };
    
    const loudPiano: SamplerZone = {
      id: 'piano-loud',
      sampleId: 'piano-f',
      lowKey: 21,
      highKey: 108,
      rootKey: 60,
      lowVelocity: 101,
      highVelocity: 127,
      volume: 1,
      pan: 0,
      tuning: 0,
      loopEnabled: false,
    };
    
    let state = addSamplerZone(DEFAULT_SAMPLER_STATE, softPiano);
    state = addSamplerZone(state, mediumPiano);
    state = addSamplerZone(state, loudPiano);
    
    // Test velocity switching
    expect(findSamplerZones(state, 60, 30)[0]!.id).toBe('piano-soft');
    expect(findSamplerZones(state, 60, 75)[0]!.id).toBe('piano-medium');
    expect(findSamplerZones(state, 60, 120)[0]!.id).toBe('piano-loud');
  });
});
