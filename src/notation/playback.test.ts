/**
 * @fileoverview Tests for Notation Playback Integration.
 * 
 * @module @cardplay/core/notation/playback.test
 */

import { describe, it, expect } from 'vitest';
import {
  createPlaybackContext,
  notationNoteToEvent,
  playNotationNote,
  extractEventsFromSelection,
  createSelectionPlaybackContext,
  calculatePlayheadPosition,
  shouldScrollToPlayhead,
  calculateScrollToPlayhead,
  updateActiveNotes,
  isNotePlaying,
  applyDynamic,
  interpretTempoMarking,
  createRepeatPlaybackState,
  advanceWithRepeats,
  calculateGraceNoteTiming,
  DEFAULT_GRACE_NOTE_TIMING,
  realizeOrnament,
  applySwing,
  SWING_PRESETS,
  // New imports for Phase 11.5 enhancements
  applyRubato,
  applyFermata,
  hasFermata,
  isCueNote,
  processCueNote,
  selectOssiaOrMain,
  shouldShowCautionaryAccidental,
  shouldShowCourtesyAccidental,
  checkNoteRange,
  checkIntervalSpacing,
  proofReadMeasure,
  parseTextDirection,
  applyTextDirection,
} from './playback';
import { asTick, asTickDuration } from '../types/primitives';
import type { NotationNote, NotationMeasure, NoteDuration, NotationEvent } from './types';

describe('NotationPlaybackContext', () => {
  it('creates default playback context', () => {
    const context = createPlaybackContext();
    
    expect(context.playheadTick).toBe(0);
    expect(context.isPlaying).toBe(false);
    expect(context.tempo).toBe(120);
    expect(context.ticksPerQuarter).toBe(480);
    expect(context.activeNotes.size).toBe(0);
  });
  
  it('creates context with custom values', () => {
    const context = createPlaybackContext(140, 960);
    
    expect(context.tempo).toBe(140);
    expect(context.ticksPerQuarter).toBe(960);
  });
});

describe('Click-to-Play Note', () => {
  const testNote: NotationNote = {
    id: 'note-1',
    pitch: 60, // Middle C
  };
  
  const quarterNoteDuration: NoteDuration = {
    base: 'quarter',
    dots: 0,
  };
  
  it('converts notation note to event', () => {
    const event = notationNoteToEvent(testNote, quarterNoteDuration, 80, 480);
    
    expect(event.payload.pitch.value).toBe(60);
    expect(event.payload.velocity).toBe(80);
    expect(event.duration).toBe(480); // One quarter note at 480 TPQ
  });
  
  it('handles dotted durations', () => {
    const dottedQuarter: NoteDuration = {
      base: 'quarter',
      dots: 1,
    };
    
    const event = notationNoteToEvent(testNote, dottedQuarter, 80, 480);
    
    expect(event.duration).toBe(720); // 480 * 1.5
  });
  
  it('handles double-dotted durations', () => {
    const doubleDottedQuarter: NoteDuration = {
      base: 'quarter',
      dots: 2,
    };
    
    const event = notationNoteToEvent(testNote, doubleDottedQuarter, 80, 480);
    
    expect(event.duration).toBe(840); // 480 * 1.75
  });
  
  it('plays notation note at playhead position', () => {
    const context = createPlaybackContext();
    const event = playNotationNote(testNote, quarterNoteDuration, context, 80);
    
    expect(event.start).toBe(context.playheadTick);
    expect(event.payload.pitch.value).toBe(60);
  });
});

describe('Playback from Selection', () => {
  const measures: NotationMeasure[] = [
    {
      number: 1,
      startTick: 0,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { root: 'C', mode: 'major', accidentals: 0 },
      events: [
        {
          id: 'event-1',
          beat: 0,
          duration: { base: 'quarter', dots: 0 },
          notes: [{ id: 'note-1', pitch: 60 }],
          velocity: 80,
          voice: 1,
        },
        {
          id: 'event-2',
          beat: 2,
          duration: { base: 'quarter', dots: 0 },
          notes: [{ id: 'note-2', pitch: 64 }],
          velocity: 90,
          voice: 1,
        },
      ],
    },
    {
      number: 2,
      startTick: 1920,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { root: 'C', mode: 'major', accidentals: 0 },
      events: [
        {
          id: 'event-3',
          beat: 0,
          duration: { base: 'half', dots: 0 },
          notes: [{ id: 'note-3', pitch: 67 }],
          velocity: 85,
          voice: 1,
        },
      ],
    },
  ];
  
  it('extracts events from full selection', () => {
    const events = extractEventsFromSelection(
      measures,
      asTick(0),
      asTick(4000),
      480
    );
    
    expect(events.length).toBe(3);
    expect(events[0].payload.pitch.value).toBe(60);
    expect(events[1].payload.pitch.value).toBe(64);
    expect(events[2].payload.pitch.value).toBe(67);
  });
  
  it('extracts events from partial selection', () => {
    // Select only first measure
    const events = extractEventsFromSelection(
      measures,
      asTick(0),
      asTick(1920),
      480
    );
    
    expect(events.length).toBe(2);
    expect(events[0].payload.pitch.value).toBe(60);
    expect(events[1].payload.pitch.value).toBe(64);
  });
  
  it('returns empty array for selection outside measures', () => {
    const events = extractEventsFromSelection(
      measures,
      asTick(10000),
      asTick(12000),
      480
    );
    
    expect(events.length).toBe(0);
  });
  
  it('creates selection playback context', () => {
    const baseContext = createPlaybackContext();
    const selectionContext = createSelectionPlaybackContext(
      measures,
      asTick(1000),
      asTick(3000),
      baseContext
    );
    
    expect(selectionContext.selection).toBeDefined();
    expect(selectionContext.selection!.startTick).toBe(1000);
    expect(selectionContext.selection!.endTick).toBe(3000);
    expect(selectionContext.playheadTick).toBe(1000);
  });
});

describe('Playhead Visualization', () => {
  const measures: NotationMeasure[] = [
    {
      number: 1,
      startTick: 0,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { root: 'C', mode: 'major', accidentals: 0 },
      events: [],
    },
    {
      number: 2,
      startTick: 1920,
      timeSignature: { numerator: 3, denominator: 4 },
      keySignature: { root: 'C', mode: 'major', accidentals: 0 },
      events: [],
    },
    {
      number: 3,
      startTick: 3360,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { root: 'C', mode: 'major', accidentals: 0 },
      events: [],
    },
  ];
  
  it('calculates playhead position in first measure', () => {
    const position = calculatePlayheadPosition(measures, asTick(480), 480);
    
    expect(position).toBeDefined();
    expect(position!.measureIndex).toBe(0);
    expect(position!.beat).toBe(1);
  });
  
  it('calculates playhead position in second measure', () => {
    const position = calculatePlayheadPosition(measures, asTick(2400), 480);
    
    expect(position).toBeDefined();
    expect(position!.measureIndex).toBe(1);
    expect(position!.beat).toBe(1);
  });
  
  it('returns null for playhead beyond measures', () => {
    const position = calculatePlayheadPosition(measures, asTick(10000), 480);
    
    expect(position).toBeNull();
  });
  
  it('determines when to scroll to playhead', () => {
    const position = { measureIndex: 5, beat: 0, xPosition: 0 };
    const visibleRange = { start: 0, end: 4 };
    
    expect(shouldScrollToPlayhead(position, visibleRange)).toBe(true);
  });
  
  it('determines when not to scroll', () => {
    const position = { measureIndex: 2, beat: 0, xPosition: 0 };
    const visibleRange = { start: 0, end: 4 };
    
    expect(shouldScrollToPlayhead(position, visibleRange)).toBe(false);
  });
  
  it('calculates scroll position to center playhead', () => {
    const position = { measureIndex: 10, beat: 0, xPosition: 0 };
    const scrollPosition = calculateScrollToPlayhead(position, 8);
    
    expect(scrollPosition).toBe(6); // 10 - 8/2
  });
  
  it('prevents negative scroll position', () => {
    const position = { measureIndex: 1, beat: 0, xPosition: 0 };
    const scrollPosition = calculateScrollToPlayhead(position, 8);
    
    expect(scrollPosition).toBe(0);
  });
});

describe('Playing Notes Highlighting', () => {
  const measures: NotationMeasure[] = [
    {
      number: 1,
      startTick: 0,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { root: 'C', mode: 'major', accidentals: 0 },
      events: [
        {
          id: 'event-1',
          beat: 0,
          duration: { base: 'half', dots: 0 }, // 960 ticks
          notes: [{ id: 'note-1', pitch: 60 }],
          velocity: 80,
          voice: 1,
        },
        {
          id: 'event-2',
          beat: 2,
          duration: { base: 'quarter', dots: 0 }, // 480 ticks
          notes: [{ id: 'note-2', pitch: 64 }],
          velocity: 80,
          voice: 1,
        },
      ],
    },
  ];
  
  it('identifies active notes at playhead', () => {
    // Playhead at beat 0.5 - first note should be active
    const activeNotes = updateActiveNotes(measures, asTick(240), 480);
    
    expect(activeNotes.has('note-1')).toBe(true);
    expect(activeNotes.has('note-2')).toBe(false);
  });
  
  it('identifies multiple active notes', () => {
    // Playhead at beat 2.25 - second note should be active
    const activeNotes = updateActiveNotes(measures, asTick(1080), 480);
    
    expect(activeNotes.has('note-1')).toBe(false);
    expect(activeNotes.has('note-2')).toBe(true);
  });
  
  it('checks if specific note is playing', () => {
    const context = createPlaybackContext();
    const activeNotes = new Set(['note-1', 'note-3']);
    const updatedContext = { ...context, activeNotes };
    
    expect(isNotePlaying('note-1', updatedContext)).toBe(true);
    expect(isNotePlaying('note-2', updatedContext)).toBe(false);
  });
});

describe('Expression Playback', () => {
  it('applies dynamic markings to velocity', () => {
    expect(applyDynamic(80, 'pp')).toBe(35);
    expect(applyDynamic(80, 'mf')).toBe(80);
    expect(applyDynamic(80, 'ff')).toBe(110);
  });
  
  it('returns base velocity for undefined dynamic', () => {
    expect(applyDynamic(80, undefined)).toBe(80);
  });
  
  it('clamps velocity to MIDI range', () => {
    expect(applyDynamic(200, 'ffff')).toBe(127);
    expect(applyDynamic(5, 'pppp')).toBe(10);
  });
  
  it('interprets tempo markings', () => {
    expect(interpretTempoMarking('andante')).toBe(90);
    expect(interpretTempoMarking('allegro')).toBe(132);
    expect(interpretTempoMarking('presto')).toBe(180);
  });
  
  it('returns default tempo for unknown marking', () => {
    expect(interpretTempoMarking('unknown')).toBe(120);
  });
  
  it('interprets tempo marking case-insensitively', () => {
    expect(interpretTempoMarking('ALLEGRO')).toBe(132);
    expect(interpretTempoMarking('Andante')).toBe(90);
  });
});

describe('Repeat Structure Playback', () => {
  const simpleRepeat = {
    startMeasure: 2,
    endMeasure: 5,
    repeatCount: 2,
  };
  
  const nestedRepeat = {
    startMeasure: 3,
    endMeasure: 4,
    repeatCount: 3,
  };
  
  it('creates initial repeat playback state', () => {
    const state = createRepeatPlaybackState();
    
    expect(state.currentMeasure).toBe(0);
    expect(state.repeatStack.length).toBe(0);
  });
  
  it('enters repeat region', () => {
    const state = createRepeatPlaybackState();
    const advanced = advanceWithRepeats({ ...state, currentMeasure: 1 }, [simpleRepeat]);
    
    expect(advanced.currentMeasure).toBe(2);
    expect(advanced.repeatStack.length).toBe(1);
    expect(advanced.repeatStack[0].structure).toBe(simpleRepeat);
    expect(advanced.repeatStack[0].iterationCount).toBe(0);
  });
  
  it('repeats from end to start', () => {
    const state = {
      currentMeasure: 5,
      repeatStack: [{ structure: simpleRepeat, iterationCount: 0 }],
    };
    
    const advanced = advanceWithRepeats(state, [simpleRepeat]);
    
    expect(advanced.currentMeasure).toBe(2); // Jump back to start
    expect(advanced.repeatStack[0].iterationCount).toBe(1);
  });
  
  it('exits repeat after enough iterations', () => {
    const state = {
      currentMeasure: 5,
      repeatStack: [{ structure: simpleRepeat, iterationCount: 1 }],
    };
    
    const advanced = advanceWithRepeats(state, [simpleRepeat]);
    
    expect(advanced.currentMeasure).toBe(6); // Continue past repeat
    expect(advanced.repeatStack.length).toBe(0);
  });
  
  it('advances normally outside repeat regions', () => {
    const state = createRepeatPlaybackState();
    const advanced = advanceWithRepeats(state, [simpleRepeat]);
    
    expect(advanced.currentMeasure).toBe(1);
    expect(advanced.repeatStack.length).toBe(0);
  });
});

describe('Grace Note Timing', () => {
  it('calculates grace note timing stealing time', () => {
    const mainNoteStart = asTick(1000);
    const timing = { duration: asTickDuration(50), stealsTime: true };
    
    const startTimes = calculateGraceNoteTiming(mainNoteStart, 2, timing);
    
    expect(startTimes.length).toBe(2);
    expect(startTimes[0]).toBe(900); // 1000 - 2*50
    expect(startTimes[1]).toBe(950); // 900 + 50
  });
  
  it('calculates grace note timing on-beat', () => {
    const mainNoteStart = asTick(1000);
    const timing = { duration: asTickDuration(50), stealsTime: false };
    
    const startTimes = calculateGraceNoteTiming(mainNoteStart, 3, timing);
    
    expect(startTimes.length).toBe(3);
    expect(startTimes[0]).toBe(850); // 1000 - 3*50
    expect(startTimes[1]).toBe(900);
    expect(startTimes[2]).toBe(950);
  });
  
  it('uses default timing', () => {
    const mainNoteStart = asTick(1000);
    const startTimes = calculateGraceNoteTiming(mainNoteStart, 1);
    
    expect(startTimes.length).toBe(1);
    expect(startTimes[0]).toBe(960); // 1000 - 40
  });
});

describe('Ornament Realization', () => {
  const testNote: NotationNote = {
    id: 'note-1',
    pitch: 60, // Middle C
  };
  
  it('realizes trill ornament', () => {
    const events = realizeOrnament(
      testNote,
      'trill',
      asTick(0),
      asTickDuration(960),
      80,
      480
    );
    
    expect(events.length).toBe(8);
    expect(events[0].payload.pitch.value).toBe(60);
    expect(events[1].payload.pitch.value).toBe(61);
    expect(events[2].payload.pitch.value).toBe(60);
  });
  
  it('realizes mordent ornament', () => {
    const events = realizeOrnament(
      testNote,
      'mordent',
      asTick(0),
      asTickDuration(480),
      80,
      480
    );
    
    expect(events.length).toBe(3);
    expect(events[0].payload.pitch.value).toBe(60);
    expect(events[1].payload.pitch.value).toBe(61);
    expect(events[2].payload.pitch.value).toBe(60);
  });
  
  it('realizes inverted mordent', () => {
    const events = realizeOrnament(
      testNote,
      'inverted-mordent',
      asTick(0),
      asTickDuration(480),
      80,
      480
    );
    
    expect(events.length).toBe(3);
    expect(events[0].payload.pitch.value).toBe(60);
    expect(events[1].payload.pitch.value).toBe(59);
    expect(events[2].payload.pitch.value).toBe(60);
  });
  
  it('realizes turn ornament', () => {
    const events = realizeOrnament(
      testNote,
      'turn',
      asTick(0),
      asTickDuration(480),
      80,
      480
    );
    
    expect(events.length).toBe(4);
    expect(events[0].payload.pitch.value).toBe(61);
    expect(events[1].payload.pitch.value).toBe(60);
    expect(events[2].payload.pitch.value).toBe(59);
    expect(events[3].payload.pitch.value).toBe(60);
  });
  
  it('realizes appoggiatura', () => {
    const events = realizeOrnament(
      testNote,
      'appoggiatura',
      asTick(0),
      asTickDuration(480),
      80,
      480
    );
    
    expect(events.length).toBe(2);
    expect(events[0].payload.pitch.value).toBe(61);
    expect(events[1].payload.pitch.value).toBe(60);
  });
  
  it('realizes acciaccatura without replacing main note', () => {
    const events = realizeOrnament(
      testNote,
      'acciaccatura',
      asTick(0),
      asTickDuration(480),
      80,
      480
    );
    
    expect(events.length).toBe(2); // Grace note + main note
    expect(events[0].payload.pitch.value).toBe(61);
    expect(events[1].payload.pitch.value).toBe(60);
  });
  
  it('applies velocity reduction to ornament notes', () => {
    const events = realizeOrnament(
      testNote,
      'trill',
      asTick(0),
      asTickDuration(480),
      100,
      480
    );
    
    expect(events[0].payload.velocity).toBe(90); // 100 * 0.9
  });
});

describe('Swing Interpretation', () => {
  it('applies no swing to straight timing', () => {
    const swung = applySwing(
      asTick(480), // First eighth note offbeat
      asTick(0),   // Beat start
      8,
      0.5,         // Straight
      480
    );
    
    expect(swung).toBe(480);
  });
  
  it('applies triplet swing to eighth notes', () => {
    const swung = applySwing(
      asTick(480), // First eighth note offbeat (would be at 240 straight)
      asTick(0),   // Beat start
      8,
      0.67,        // Triplet swing
      480
    );
    
    expect(swung).toBeGreaterThan(240);
  });
  
  it('applies heavy swing', () => {
    const swung = applySwing(
      asTick(480),
      asTick(0),
      8,
      0.75,
      480
    );
    
    expect(swung).toBeGreaterThan(240);
  });
  
  it('does not swing onbeat notes', () => {
    const swung = applySwing(
      asTick(0),   // Onbeat
      asTick(0),
      8,
      0.67,
      480
    );
    
    expect(swung).toBe(0); // No swing applied
  });
  
  it('uses swing presets', () => {
    expect(SWING_PRESETS.straight.ratio).toBe(0.5);
    expect(SWING_PRESETS.triplet.ratio).toBe(0.67);
    expect(SWING_PRESETS.heavy.ratio).toBe(0.75);
  });
});

// ============================================================================
// NEW TESTS FOR PHASE 11.5 ENHANCEMENTS
// ============================================================================

describe('Rubato Option', () => {
  it('applies no rubato when amount is 0', () => {
    const { start, duration } = applyRubato(
      asTick(0),
      asTickDuration(480),
      0.5, // Middle of phrase
      { amount: 0.0, style: 'subtle', tempoLocked: true },
      480
    );
    
    expect(start).toBe(0);
    expect(duration).toBe(480);
  });
  
  it('applies subtle rubato timing variation', () => {
    const { duration } = applyRubato(
      asTick(0),
      asTickDuration(480),
      0.5,
      { amount: 0.15, style: 'subtle', tempoLocked: true },
      480
    );
    
    // Duration should be slightly different from 480
    expect(duration).not.toBe(480);
  });
  
  it('applies dramatic rubato variation', () => {
    const { duration } = applyRubato(
      asTick(0),
      asTickDuration(480),
      0.5,
      { amount: 0.75, style: 'dramatic', tempoLocked: false },
      480
    );
    
    // Dramatic should have larger variation
    expect(Math.abs(duration - 480)).toBeGreaterThan(0);
  });
  
  it('varies timing based on phrase position', () => {
    const config = { amount: 0.50, style: 'expressive' as const, tempoLocked: false };
    
    const phraseStart = applyRubato(asTick(0), asTickDuration(480), 0.0, config, 480);
    const phraseMiddle = applyRubato(asTick(0), asTickDuration(480), 0.5, config, 480);
    const phraseEnd = applyRubato(asTick(0), asTickDuration(480), 1.0, config, 480);
    
    // Middle should have most variation (sine curve peaks at 0.5)
    expect(phraseMiddle.duration).not.toBe(phraseStart.duration);
    expect(phraseMiddle.duration).not.toBe(phraseEnd.duration);
  });
});

describe('Fermata Handling', () => {
  it('extends note duration with short fermata', () => {
    const { duration, pauseAfter } = applyFermata(
      asTickDuration(480),
      { lengthMultiplier: 1.5, style: 'short', addPause: false }
    );
    
    expect(duration).toBe(720); // 480 * 1.5
    expect(pauseAfter).toBeUndefined();
  });
  
  it('extends note duration with medium fermata', () => {
    const { duration } = applyFermata(
      asTickDuration(480),
      { lengthMultiplier: 2.0, style: 'medium', addPause: false }
    );
    
    expect(duration).toBe(960); // 480 * 2.0
  });
  
  it('adds pause after long fermata', () => {
    const { duration, pauseAfter } = applyFermata(
      asTickDuration(480),
      { lengthMultiplier: 2.5, style: 'long', addPause: true, pauseDuration: asTickDuration(240) }
    );
    
    expect(duration).toBe(1200); // 480 * 2.5
    expect(pauseAfter).toBe(240);
  });
  
  it('checks for fermata articulation', () => {
    const withFermata = hasFermata(['staccato', 'fermata', 'accent']);
    const withoutFermata = hasFermata(['staccato', 'accent']);
    const noArticulations = hasFermata(undefined);
    
    expect(withFermata).toBe(true);
    expect(withoutFermata).toBe(false);
    expect(noArticulations).toBe(false);
  });
});

describe('Cue Notes (Non-Playing)', () => {
  it('identifies cue note from voice config', () => {
    const cueVoice = { id: 99, defaultStemDirection: 'up' as const, label: 'Cue' };
    const normalVoice = { id: 1, defaultStemDirection: 'up' as const, label: 'Voice 1' };
    
    const dummyEvent: NotationEvent = {
      id: 'ev-1',
      notes: [],
      duration: { base: 'quarter', dots: 0 },
      tick: 0,
      voice: 99,
      staff: 0,
      isRest: false,
    };
    
    expect(isCueNote(dummyEvent, cueVoice)).toBe(true);
    expect(isCueNote(dummyEvent, normalVoice)).toBe(false);
  });
  
  it('does not play cue notes by default', () => {
    const event = {
      id: 'test-event',
      start: asTick(0),
      duration: asTickDuration(480),
      payload: { pitch: { value: 60 } as any, velocity: 80 },
      kind: 'note' as const,
    };
    
    const result = processCueNote(event);
    
    expect(result).toBeNull();
  });
  
  it('plays cue notes with reduced velocity when enabled', () => {
    const event = {
      id: 'test-event',
      start: asTick(0),
      duration: asTickDuration(480),
      payload: { pitch: { value: 60 } as any, velocity: 80 },
      kind: 'note' as const,
    };
    
    const result = processCueNote(event, { playback: true, velocityReduction: 0.5, isVisualOnly: false });
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.payload.velocity).toBe(40); // 80 * 0.5
    }
  });
});

describe('Ossia Staves', () => {
  it('selects main staff events when no ossia active', () => {
    const mainEvents: NotationEvent[] = [
      {
        id: 'main-1',
        notes: [{ id: 'n1', pitch: 60 }],
        duration: { base: 'quarter', dots: 0 },
        tick: 0,
        voice: 1,
        staff: 0,
        isRest: false,
      },
    ];
    
    const selected = selectOssiaOrMain(mainEvents, [], 1, 'staff-1');
    
    expect(selected).toBe(mainEvents);
  });
  
  it('selects ossia events when active in range', () => {
    const mainEvents: NotationEvent[] = [
      {
        id: 'main-1',
        notes: [{ id: 'n1', pitch: 60 }],
        duration: { base: 'quarter', dots: 0 },
        tick: 0,
        voice: 1,
        staff: 0,
        isRest: false,
      },
    ];
    
    const ossiaEvents: NotationEvent[] = [
      {
        id: 'ossia-1',
        notes: [{ id: 'on1', pitch: 72 }],
        duration: { base: 'quarter', dots: 0 },
        tick: 0,
        voice: 1,
        staff: 0,
        isRest: false,
      },
    ];
    
    const ossiaStaves = [
      {
        id: 'ossia-1',
        parentStaffId: 'staff-1',
        startMeasure: 1,
        endMeasure: 3,
        events: ossiaEvents,
        active: true,
      },
    ];
    
    const selected = selectOssiaOrMain(mainEvents, ossiaStaves, 2, 'staff-1');
    
    expect(selected).toBe(ossiaEvents);
  });
  
  it('ignores inactive ossia', () => {
    const mainEvents: NotationEvent[] = [
      {
        id: 'main-1',
        notes: [{ id: 'n1', pitch: 60 }],
        duration: { base: 'quarter', dots: 0 },
        tick: 0,
        voice: 1,
        staff: 0,
        isRest: false,
      },
    ];
    
    const ossiaStaves = [
      {
        id: 'ossia-1',
        parentStaffId: 'staff-1',
        startMeasure: 1,
        endMeasure: 3,
        events: [],
        active: false,
      },
    ];
    
    const selected = selectOssiaOrMain(mainEvents, ossiaStaves, 2, 'staff-1');
    
    expect(selected).toBe(mainEvents);
  });
});

describe('Cautionary & Courtesy Accidentals', () => {
  it('shows cautionary accidental after key change', () => {
    const note: NotationNote = { id: 'n1', pitch: 63, accidental: 'sharp' };
    const keySignature = { root: 'C' as const, mode: 'major' as const, accidentals: 0 };
    const policy = { showCautionary: true, showCourtesy: true, courtesyRange: 1 };
    
    const shouldShow = shouldShowCautionaryAccidental(note, keySignature, policy, true);
    
    expect(shouldShow).toBe(true);
  });
  
  it('does not show cautionary when policy disabled', () => {
    const note: NotationNote = { id: 'n1', pitch: 63, accidental: 'sharp' };
    const keySignature = { root: 'C' as const, mode: 'major' as const, accidentals: 0 };
    const policy = { showCautionary: false, showCourtesy: true, courtesyRange: 1 };
    
    const shouldShow = shouldShowCautionaryAccidental(note, keySignature, policy, true);
    
    expect(shouldShow).toBe(false);
  });
  
  it('shows courtesy accidental for recent accidental', () => {
    const note: NotationNote = { id: 'n1', pitch: 63 };
    const previousAccidentals = new Set([63, 64]);
    const policy = { showCautionary: true, showCourtesy: true, courtesyRange: 1 };
    
    const shouldShow = shouldShowCourtesyAccidental(note, previousAccidentals, policy);
    
    expect(shouldShow).toBe(true);
  });
  
  it('does not show courtesy when policy disabled', () => {
    const note: NotationNote = { id: 'n1', pitch: 63 };
    const previousAccidentals = new Set([63]);
    const policy = { showCautionary: true, showCourtesy: false, courtesyRange: 1 };
    
    const shouldShow = shouldShowCourtesyAccidental(note, previousAccidentals, policy);
    
    expect(shouldShow).toBe(false);
  });
});

describe('Proof-Reading Mode', () => {
  it('checks for out-of-range notes', () => {
    const note: NotationNote = { id: 'n1', pitch: 100 }; // Very high
    const instrumentRange = { min: 40, max: 84 }; // Typical piano range
    
    const issue = checkNoteRange(note, instrumentRange, 1);
    
    expect(issue).not.toBeNull();
    if (issue) {
      expect(issue.type).toBe('range');
      expect(issue.severity).toBe('warning');
    }
  });
  
  it('passes in-range notes', () => {
    const note: NotationNote = { id: 'n1', pitch: 60 };
    const instrumentRange = { min: 40, max: 84 };
    
    const issue = checkNoteRange(note, instrumentRange, 1);
    
    expect(issue).toBeNull();
  });
  
  it('checks for large intervals', () => {
    const note1: NotationNote = { id: 'n1', pitch: 60 };
    const note2: NotationNote = { id: 'n2', pitch: 84 }; // Two octaves up
    
    const issue = checkIntervalSpacing(note1, note2, 1);
    
    expect(issue).not.toBeNull();
    if (issue) {
      expect(issue.type).toBe('spacing');
    }
  });
  
  it('passes reasonable intervals', () => {
    const note1: NotationNote = { id: 'n1', pitch: 60 };
    const note2: NotationNote = { id: 'n2', pitch: 64 }; // Perfect fourth
    
    const issue = checkIntervalSpacing(note1, note2, 1);
    
    expect(issue).toBeNull();
  });
  
  it('performs complete measure proof-reading', () => {
    const measure: NotationMeasure = {
      number: 1,
      events: new Map([
        [1, [
          {
            id: 'ev1',
            notes: [{ id: 'n1', pitch: 100 }], // Out of range
            duration: { base: 'quarter', dots: 0 },
            tick: 0,
            voice: 1,
            staff: 0,
            isRest: false,
          },
          {
            id: 'ev2',
            notes: [{ id: 'n2', pitch: 40 }], // Large jump
            duration: { base: 'quarter', dots: 0 },
            tick: 480,
            voice: 1,
            staff: 0,
            isRest: false,
          },
        ]],
      ]),
    };
    
    const config = {
      highlightErrors: true,
      checks: ['range' as const, 'spacing' as const],
      severityThreshold: 'info' as const,
    };
    
    const issues = proofReadMeasure(measure, config, { min: 40, max: 84 });
    
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe('Text Direction DSL', () => {
  it('parses crescendo marking', () => {
    const direction = parseTextDirection('cresc.', 1, 4, 'p', 120);
    
    expect(direction).not.toBeNull();
    if (direction) {
      expect(direction.action.type).toBe('crescendo');
      if (direction.action.type === 'crescendo') {
        expect(direction.action.startDynamic).toBe('p');
      }
    }
  });
  
  it('parses diminuendo marking', () => {
    const direction = parseTextDirection('dim.', 1, 4, 'f', 120);
    
    expect(direction).not.toBeNull();
    if (direction) {
      expect(direction.action.type).toBe('diminuendo');
      if (direction.action.type === 'diminuendo') {
        expect(direction.action.startDynamic).toBe('f');
      }
    }
  });
  
  it('parses ritardando marking', () => {
    const direction = parseTextDirection('rit.', 1, 4, 'mf', 120);
    
    expect(direction).not.toBeNull();
    if (direction) {
      expect(direction.action.type).toBe('ritardando');
      if (direction.action.type === 'ritardando') {
        expect(direction.action.startTempo).toBe(120);
        expect(direction.action.endTempo).toBe(90); // 120 * 0.75
      }
    }
  });
  
  it('parses accelerando marking', () => {
    const direction = parseTextDirection('accel.', 1, 4, 'mf', 100);
    
    expect(direction).not.toBeNull();
    if (direction) {
      expect(direction.action.type).toBe('accelerando');
      if (direction.action.type === 'accelerando') {
        expect(direction.action.startTempo).toBe(100);
        expect(direction.action.endTempo).toBe(125); // 100 * 1.25
      }
    }
  });
  
  it('returns null for unknown marking', () => {
    const direction = parseTextDirection('unknown marking', 1, 4, 'mf', 120);
    
    expect(direction).toBeNull();
  });
  
  it('applies text direction to playback', () => {
    const action = {
      type: 'ritardando' as const,
      startTempo: 120,
      endTempo: 90,
    };
    
    const result = applyTextDirection(action, asTick(480), asTick(0), asTick(1920));
    
    expect(result.tempo).toBeDefined();
    if (result.tempo !== undefined) {
      expect(result.tempo).toBeLessThan(120);
      expect(result.tempo).toBeGreaterThanOrEqual(90);
    }
  });
});
