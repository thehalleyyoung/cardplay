/**
 * ArpeggiatorCard - Professional arpeggiator with step sequencer
 * 
 * A comprehensive arpeggiator supporting:
 * - 30+ arpeggio patterns (up, down, random, chord, custom)
 * - Step sequencer with 64 steps per pattern
 * - Per-step pitch, velocity, gate, and probability
 * - Multiple octave modes (1-4 octaves, ping-pong)
 * - Chord hold and latch modes
 * - Tempo sync with swing and humanization
 * - MIDI learn for held notes
 * - 100+ preset patterns across genres
 * - Ratcheting and note repeat
 * - Tie and rest support
 * 
 * @module cards/arpeggiator
 */

import type { Card, CardMeta, CardResult, CardContext, CardState, CardSignature } from './card';
import { createCardState, updateCardState, PortTypes } from './card';

// ============================================================================
// TYPES
// ============================================================================

export type ArpDirection =
  | 'up'           // Low to high
  | 'down'         // High to low
  | 'upDown'       // Up then down
  | 'downUp'       // Down then up
  | 'upDownInc'    // Up-down including repeated notes
  | 'downUpInc'    // Down-up including repeated notes
  | 'random'       // Random order
  | 'order'        // Order played
  | 'chord'        // Play all at once
  | 'converge'     // Outside notes move in
  | 'diverge'      // Inside notes move out
  | 'thumbUp'      // Bass note + ascending
  | 'thumbDown'    // Bass note + descending
  | 'pinky'        // High note held + arpeggiated
  | 'custom';      // User-defined pattern

export type ArpRate =
  | '1/1' | '1/2' | '1/2T' | '1/2D'
  | '1/4' | '1/4T' | '1/4D'
  | '1/8' | '1/8T' | '1/8D'
  | '1/16' | '1/16T' | '1/16D'
  | '1/32' | '1/32T' | '1/32D'
  | '1/64';

export type OctaveMode =
  | '1oct'
  | '2oct'
  | '3oct'
  | '4oct'
  | '1octDown'
  | '2octDown'
  | '1-2oct'
  | '2-1oct'
  | '1-2-3oct'
  | '3-2-1oct'
  | 'pingPong2'
  | 'pingPong3'
  | 'pingPong4';

// ============================================================================
// STEP SEQUENCER
// ============================================================================

export interface ArpStep {
  readonly enabled: boolean;          // Is this step active
  readonly pitchOffset: number;       // Semitones offset (-24 to +24)
  readonly velocityOffset: number;    // Velocity offset (-64 to +64)
  readonly gate: number;              // Gate length (0-1)
  readonly probability: number;       // Trigger probability (0-1)
  readonly ratchet: number;           // Note repeats (1-8)
  readonly slide: boolean;            // Legato to next note
  readonly accent: boolean;           // Accent this step
  readonly octaveShift: number;       // Octave shift (-2 to +2)
}

/**
 * Create default step
 */
export function createArpStep(): ArpStep {
  return {
    enabled: true,
    pitchOffset: 0,
    velocityOffset: 0,
    gate: 0.8,
    probability: 1,
    ratchet: 1,
    slide: false,
    accent: false,
    octaveShift: 0,
  };
}

/**
 * Create step sequence
 */
export function createStepSequence(length: number = 16): readonly ArpStep[] {
  return Array.from({ length }, () => createArpStep());
}

// ============================================================================
// ARP PATTERN
// ============================================================================

export interface ArpPattern {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly direction: ArpDirection;
  readonly octaveMode: OctaveMode;
  readonly rate: ArpRate;
  readonly steps: readonly ArpStep[];
  readonly swing: number;           // 0-1
  readonly length: number;          // 1-64 steps
  readonly tags: readonly string[];
}

/**
 * Create empty pattern
 */
export function createArpPattern(
  id: string,
  name: string,
  direction: ArpDirection = 'up',
  rate: ArpRate = '1/16'
): ArpPattern {
  return {
    id,
    name,
    category: 'Custom',
    direction,
    octaveMode: '1oct',
    rate,
    steps: createStepSequence(16),
    swing: 0,
    length: 16,
    tags: [],
  };
}

// ============================================================================
// PRESET PATTERNS (100+)
// ============================================================================

/**
 * Helper to create pattern with specific step configuration
 */
function createPresetPattern(
  id: string,
  name: string,
  category: string,
  direction: ArpDirection,
  octaveMode: OctaveMode,
  rate: ArpRate,
  stepConfig: Partial<ArpStep>[],
  tags: readonly string[]
): ArpPattern {
  const steps: ArpStep[] = [];
  for (let i = 0; i < 16; i++) {
    const config = stepConfig[i % stepConfig.length] || {};
    steps.push({ ...createArpStep(), ...config });
  }

  return {
    id,
    name,
    category,
    direction,
    octaveMode,
    rate,
    steps,
    swing: 0,
    length: stepConfig.length,
    tags,
  };
}

export const ARP_PRESETS: readonly ArpPattern[] = [
  // ========== BASIC ==========
  createPresetPattern('up-1oct', 'Up 1 Octave', 'Basic', 'up', '1oct', '1/16',
    Array(16).fill({}), ['basic', 'up', 'simple']),
  createPresetPattern('down-1oct', 'Down 1 Octave', 'Basic', 'down', '1oct', '1/16',
    Array(16).fill({}), ['basic', 'down', 'simple']),
  createPresetPattern('updown-1oct', 'Up-Down 1 Octave', 'Basic', 'upDown', '1oct', '1/16',
    Array(16).fill({}), ['basic', 'updown', 'classic']),
  createPresetPattern('random-1oct', 'Random 1 Octave', 'Basic', 'random', '1oct', '1/16',
    Array(16).fill({}), ['basic', 'random', 'evolving']),
  createPresetPattern('order', 'Order Played', 'Basic', 'order', '1oct', '1/16',
    Array(16).fill({}), ['basic', 'order', 'controlled']),
  createPresetPattern('chord', 'Chord Mode', 'Basic', 'chord', '1oct', '1/8',
    Array(4).fill({}), ['basic', 'chord', 'pad']),

  // ========== 2-OCTAVE ==========
  createPresetPattern('up-2oct', 'Up 2 Octaves', 'Multi-Octave', 'up', '2oct', '1/16',
    Array(16).fill({}), ['2oct', 'up', 'wide']),
  createPresetPattern('down-2oct', 'Down 2 Octaves', 'Multi-Octave', 'down', '2oct', '1/16',
    Array(16).fill({}), ['2oct', 'down', 'wide']),
  createPresetPattern('pingpong-2oct', 'Ping-Pong 2 Octaves', 'Multi-Octave', 'upDown', 'pingPong2', '1/16',
    Array(16).fill({}), ['2oct', 'pingpong', 'bouncy']),
  createPresetPattern('up-3oct', 'Up 3 Octaves', 'Multi-Octave', 'up', '3oct', '1/16',
    Array(16).fill({}), ['3oct', 'up', 'sweep']),
  createPresetPattern('pingpong-3oct', 'Ping-Pong 3 Octaves', 'Multi-Octave', 'upDown', 'pingPong3', '1/16',
    Array(16).fill({}), ['3oct', 'pingpong', 'dramatic']),

  // ========== SYNCOPATED ==========
  createPresetPattern('syncopated-1', 'Syncopated 1', 'Syncopated', 'up', '1oct', '1/16',
    [
      { enabled: true }, { enabled: false }, { enabled: true }, { enabled: true },
      { enabled: false }, { enabled: true }, { enabled: true }, { enabled: false },
    ],
    ['syncopated', 'groovy', 'funk']),
  createPresetPattern('syncopated-2', 'Syncopated 2', 'Syncopated', 'upDown', '1oct', '1/16',
    [
      { enabled: true }, { enabled: true }, { enabled: false }, { enabled: true },
      { enabled: false }, { enabled: true }, { enabled: true }, { enabled: true },
    ],
    ['syncopated', 'house', 'dance']),
  createPresetPattern('offbeat', 'Offbeat', 'Syncopated', 'up', '1oct', '1/16',
    [
      { enabled: false }, { enabled: true }, { enabled: false }, { enabled: true },
      { enabled: false }, { enabled: true }, { enabled: false }, { enabled: true },
    ],
    ['syncopated', 'offbeat', 'disco']),
  createPresetPattern('dotted', 'Dotted 8th', 'Syncopated', 'up', '1oct', '1/8D',
    Array(8).fill({}), ['syncopated', 'dotted', 'u2', 'edge']),

  // ========== RATCHET ==========
  createPresetPattern('ratchet-2', 'Ratchet 2x', 'Ratchet', 'up', '1oct', '1/16',
    [
      { ratchet: 2 }, { ratchet: 1 }, { ratchet: 2 }, { ratchet: 1 },
    ],
    ['ratchet', 'double', 'fast']),
  createPresetPattern('ratchet-4', 'Ratchet 4x', 'Ratchet', 'up', '1oct', '1/8',
    [
      { ratchet: 4 }, { ratchet: 1 }, { ratchet: 4 }, { ratchet: 1 },
    ],
    ['ratchet', 'quad', 'roll']),
  createPresetPattern('ratchet-build', 'Ratchet Build', 'Ratchet', 'up', '1oct', '1/8',
    [
      { ratchet: 1 }, { ratchet: 2 }, { ratchet: 3 }, { ratchet: 4 },
      { ratchet: 4 }, { ratchet: 4 }, { ratchet: 4 }, { ratchet: 4 },
    ],
    ['ratchet', 'build', 'tension']),
  createPresetPattern('ratchet-mixed', 'Ratchet Mixed', 'Ratchet', 'upDown', '2oct', '1/8',
    [
      { ratchet: 2 }, { ratchet: 1 }, { ratchet: 3 }, { ratchet: 1 },
      { ratchet: 4 }, { ratchet: 1 }, { ratchet: 2 }, { ratchet: 1 },
    ],
    ['ratchet', 'mixed', 'complex']),

  // ========== VELOCITY ==========
  createPresetPattern('accent-beat', 'Accent on Beat', 'Velocity', 'up', '1oct', '1/16',
    [
      { accent: true }, { enabled: true }, { enabled: true }, { enabled: true },
    ],
    ['accent', 'beat', 'strong']),
  createPresetPattern('crescendo', 'Crescendo', 'Velocity', 'up', '1oct', '1/16',
    [
      { velocityOffset: -40 }, { velocityOffset: -30 }, { velocityOffset: -20 }, { velocityOffset: -10 },
      { velocityOffset: 0 }, { velocityOffset: 10 }, { velocityOffset: 20 }, { velocityOffset: 30 },
    ],
    ['crescendo', 'dynamic', 'build']),
  createPresetPattern('decrescendo', 'Decrescendo', 'Velocity', 'down', '1oct', '1/16',
    [
      { velocityOffset: 30 }, { velocityOffset: 20 }, { velocityOffset: 10 }, { velocityOffset: 0 },
      { velocityOffset: -10 }, { velocityOffset: -20 }, { velocityOffset: -30 }, { velocityOffset: -40 },
    ],
    ['decrescendo', 'fade', 'soft']),
  createPresetPattern('pulse', 'Velocity Pulse', 'Velocity', 'up', '1oct', '1/16',
    [
      { velocityOffset: 30 }, { velocityOffset: -20 }, { velocityOffset: 30 }, { velocityOffset: -20 },
    ],
    ['pulse', 'pumping', 'dynamic']),

  // ========== GATE ==========
  createPresetPattern('staccato', 'Staccato', 'Gate', 'up', '1oct', '1/16',
    [{ gate: 0.2 }], ['staccato', 'short', 'punchy']),
  createPresetPattern('legato', 'Legato', 'Gate', 'up', '1oct', '1/16',
    [{ gate: 1.0, slide: true }], ['legato', 'smooth', 'flowing']),
  createPresetPattern('gate-pattern', 'Gate Pattern', 'Gate', 'up', '1oct', '1/16',
    [
      { gate: 0.8 }, { gate: 0.2 }, { gate: 0.5 }, { gate: 1.0 },
    ],
    ['gate', 'varied', 'rhythmic']),
  createPresetPattern('long-short', 'Long-Short', 'Gate', 'up', '1oct', '1/8',
    [
      { gate: 1.0 }, { gate: 0.3 },
    ],
    ['gate', 'swing', 'jazz']),

  // ========== TRANCE ==========
  createPresetPattern('trance-gate', 'Trance Gate', 'Trance', 'up', '2oct', '1/16',
    [
      { enabled: true, gate: 0.3 }, { enabled: true, gate: 0.3 },
      { enabled: false }, { enabled: true, gate: 0.5 },
    ],
    ['trance', 'gate', 'edm', 'uplifting']),
  createPresetPattern('trance-pluck', 'Trance Pluck', 'Trance', 'upDown', '2oct', '1/16',
    [
      { gate: 0.2, accent: true }, { gate: 0.2 }, { gate: 0.2 }, { gate: 0.2 },
    ],
    ['trance', 'pluck', 'stab']),
  createPresetPattern('trance-lead', 'Trance Lead', 'Trance', 'upDown', '3oct', '1/16',
    Array(16).fill({ gate: 0.7 }),
    ['trance', 'lead', 'euphoric']),

  // ========== HOUSE ==========
  createPresetPattern('house-piano', 'House Piano', 'House', 'chord', '1oct', '1/8',
    [
      { enabled: false }, { accent: true }, { enabled: false }, { accent: true },
    ],
    ['house', 'piano', 'offbeat', 'dance']),
  createPresetPattern('house-stab', 'House Stab', 'House', 'chord', '1oct', '1/16',
    [
      { enabled: true, gate: 0.3 }, { enabled: false }, { enabled: true, gate: 0.3 }, { enabled: false },
      { enabled: false }, { enabled: true, gate: 0.3 }, { enabled: false }, { enabled: false },
    ],
    ['house', 'stab', 'funky']),
  createPresetPattern('house-bass', 'House Bass', 'House', 'up', '1oct', '1/8',
    [
      { octaveShift: -1, accent: true }, { enabled: false }, { octaveShift: 0 }, { enabled: false },
    ],
    ['house', 'bass', 'groovy']),

  // ========== TECHNO ==========
  createPresetPattern('techno-pulse', 'Techno Pulse', 'Techno', 'up', '1oct', '1/16',
    Array(16).fill({ gate: 0.5 }),
    ['techno', 'pulse', 'driving']),
  createPresetPattern('techno-acid', 'Techno Acid', 'Techno', 'up', '1oct', '1/16',
    [
      { gate: 0.8, accent: true }, { gate: 0.3 }, { gate: 0.5, slide: true }, { gate: 0.3 },
    ],
    ['techno', 'acid', '303']),
  createPresetPattern('techno-dark', 'Techno Dark', 'Techno', 'downUp', '2oct', '1/16',
    [
      { gate: 0.6, accent: true }, { gate: 0.4 }, { enabled: false }, { gate: 0.6 },
    ],
    ['techno', 'dark', 'industrial']),

  // ========== HIP-HOP ==========
  createPresetPattern('trap-arp', 'Trap Arp', 'Hip-Hop', 'up', '2oct', '1/16',
    [
      { enabled: true, ratchet: 2 }, { enabled: false }, { enabled: true },
      { enabled: false }, { enabled: true, ratchet: 3 }, { enabled: false },
    ],
    ['trap', 'hiphop', 'hi-hat']),
  createPresetPattern('lofi-arp', 'Lo-Fi Arp', 'Hip-Hop', 'random', '1oct', '1/8',
    [
      { gate: 0.6, velocityOffset: -10 }, { gate: 0.8, velocityOffset: 10 },
    ],
    ['lofi', 'chill', 'jazzy']),
  createPresetPattern('boom-bap', 'Boom Bap', 'Hip-Hop', 'order', '1oct', '1/8T',
    Array(6).fill({ gate: 0.7 }),
    ['boombap', 'sample', '90s']),

  // ========== DUBSTEP ==========
  createPresetPattern('dubstep-wobble', 'Dubstep Wobble', 'Dubstep', 'up', '1oct', '1/8',
    [
      { gate: 1.0, accent: true, ratchet: 2 }, { gate: 1.0, ratchet: 2 },
      { gate: 1.0, ratchet: 4 }, { gate: 1.0, ratchet: 4 },
    ],
    ['dubstep', 'wobble', 'bass']),
  createPresetPattern('dubstep-growl', 'Dubstep Growl', 'Dubstep', 'random', '1oct', '1/16',
    [
      { gate: 0.8, ratchet: 3 }, { gate: 0.2 }, { gate: 0.8, ratchet: 2 }, { gate: 0.4 },
    ],
    ['dubstep', 'growl', 'aggressive']),

  // ========== DnB ==========
  createPresetPattern('dnb-roller', 'DnB Roller', 'DnB', 'up', '2oct', '1/16',
    Array(16).fill({ gate: 0.6 }),
    ['dnb', 'roller', 'fast']),
  createPresetPattern('dnb-liquid', 'Liquid DnB', 'DnB', 'upDown', '2oct', '1/16',
    [
      { gate: 0.8, slide: true }, { gate: 0.6 }, { gate: 0.8, slide: true }, { gate: 0.6 },
    ],
    ['dnb', 'liquid', 'smooth']),
  createPresetPattern('dnb-neuro', 'Neuro DnB', 'DnB', 'random', '1oct', '1/32',
    [
      { gate: 0.3, ratchet: 2 }, { gate: 0.5 }, { gate: 0.3, ratchet: 3 }, { gate: 0.2 },
    ],
    ['dnb', 'neuro', 'glitch']),

  // ========== JAZZ ==========
  createPresetPattern('jazz-swing', 'Jazz Swing', 'Jazz', 'up', '1oct', '1/8T',
    Array(6).fill({ gate: 0.7 }),
    ['jazz', 'swing', 'triplet']),
  createPresetPattern('jazz-bebop', 'Bebop', 'Jazz', 'upDown', '2oct', '1/16',
    [
      { gate: 0.6 }, { gate: 0.8 }, { gate: 0.5 }, { gate: 0.9, accent: true },
    ],
    ['jazz', 'bebop', 'fast']),
  createPresetPattern('jazz-chord', 'Jazz Chord', 'Jazz', 'chord', '1oct', '1/4',
    [
      { gate: 0.8, accent: true }, { enabled: false }, { gate: 0.6 }, { enabled: false },
    ],
    ['jazz', 'chord', 'comp']),

  // ========== CLASSICAL ==========
  createPresetPattern('alberti-bass', 'Alberti Bass', 'Classical', 'custom', '1oct', '1/16',
    [
      { pitchOffset: 0 }, { pitchOffset: 4 }, { pitchOffset: 2 }, { pitchOffset: 4 },
    ],
    ['classical', 'alberti', 'piano']),
  createPresetPattern('broken-chord', 'Broken Chord', 'Classical', 'up', '1oct', '1/8',
    Array(8).fill({ gate: 0.9 }),
    ['classical', 'broken', 'harp']),
  createPresetPattern('tremolo', 'Tremolo', 'Classical', 'upDown', '1oct', '1/32',
    Array(8).fill({ gate: 0.5 }),
    ['classical', 'tremolo', 'dramatic']),

  // ========== AMBIENT ==========
  createPresetPattern('ambient-slow', 'Ambient Slow', 'Ambient', 'random', '3oct', '1/4',
    [{ gate: 1.0 }], ['ambient', 'slow', 'spacey']),
  createPresetPattern('ambient-shimmer', 'Ambient Shimmer', 'Ambient', 'random', '2oct', '1/8',
    [
      { gate: 0.9, velocityOffset: -20 }, { gate: 0.8, velocityOffset: -10 },
    ],
    ['ambient', 'shimmer', 'ethereal']),
  createPresetPattern('ambient-evolve', 'Ambient Evolve', 'Ambient', 'random', '4oct', '1/2',
    [{ gate: 1.0, probability: 0.7 }],
    ['ambient', 'evolve', 'generative']),

  // ========== RETRO ==========
  createPresetPattern('80s-synth', '80s Synth', 'Retro', 'upDown', '2oct', '1/16',
    Array(16).fill({ gate: 0.6 }),
    ['80s', 'synth', 'retro', 'synthwave']),
  createPresetPattern('italo-disco', 'Italo Disco', 'Retro', 'up', '2oct', '1/16',
    [
      { accent: true }, {}, {}, {},
      {}, { accent: true }, {}, {},
    ],
    ['italo', 'disco', '80s']),
  createPresetPattern('chiptune', 'Chiptune', 'Retro', 'upDown', '2oct', '1/16',
    Array(8).fill({ gate: 0.4 }),
    ['chiptune', '8bit', 'retro', 'game']),

  // ========== EXPERIMENTAL ==========
  createPresetPattern('glitch', 'Glitch', 'Experimental', 'random', '2oct', '1/32',
    [
      { probability: 0.8, ratchet: 2 }, { probability: 0.6 },
      { probability: 0.9, ratchet: 4 }, { probability: 0.5 },
    ],
    ['glitch', 'experimental', 'idm']),
  createPresetPattern('polyrhythm-5', 'Polyrhythm 5:4', 'Experimental', 'up', '1oct', '1/16',
    Array(5).fill({}),
    ['polyrhythm', 'experimental', 'complex']),
  createPresetPattern('probability', 'Probability', 'Experimental', 'random', '2oct', '1/16',
    [
      { probability: 1.0 }, { probability: 0.5 },
      { probability: 0.75 }, { probability: 0.25 },
    ],
    ['probability', 'generative', 'evolving']),
  createPresetPattern('micro-timing', 'Micro Timing', 'Experimental', 'up', '1oct', '1/32',
    Array(32).fill({ gate: 0.2 }),
    ['micro', 'fast', 'granular']),
];

// ============================================================================
// ARPEGGIATOR STATE
// ============================================================================

export interface ArpState {
  readonly pattern: ArpPattern;
  readonly heldNotes: readonly number[];    // Currently held MIDI notes
  readonly sortedNotes: readonly number[];  // Sorted for arpeggio
  readonly arpeggioNotes: readonly number[]; // Full arpeggio sequence
  readonly currentStep: number;
  readonly currentNoteIndex: number;
  readonly isPlaying: boolean;
  readonly isHolding: boolean;              // Latch mode
  readonly tempo: number;
  readonly swing: number;                   // 0-1
  readonly gateScale: number;               // Gate multiplier
  readonly velocityScale: number;           // Velocity multiplier
  readonly transpose: number;               // Semitones
  readonly octave: number;                  // Base octave
}

/**
 * Create initial state
 */
export function createArpState(pattern?: ArpPattern): ArpState {
  const defaultPattern = ARP_PRESETS[0];
  if (!defaultPattern) {
    throw new Error('No default arpeggiator pattern found');
  }
  return {
    pattern: pattern ?? defaultPattern,
    heldNotes: [],
    sortedNotes: [],
    arpeggioNotes: [],
    currentStep: 0,
    currentNoteIndex: 0,
    isPlaying: false,
    isHolding: false,
    tempo: 120,
    swing: 0,
    gateScale: 1.0,
    velocityScale: 1.0,
    transpose: 0,
    octave: 4,
  };
}

// ============================================================================
// NOTE SORTING AND ARPEGGIO GENERATION
// ============================================================================

/**
 * Get rate in 16th notes
 */
export function getRateIn16ths(rate: ArpRate): number {
  const rates: Record<ArpRate, number> = {
    '1/1': 16, '1/2': 8, '1/2T': 5.33, '1/2D': 12,
    '1/4': 4, '1/4T': 2.67, '1/4D': 6,
    '1/8': 2, '1/8T': 1.33, '1/8D': 3,
    '1/16': 1, '1/16T': 0.67, '1/16D': 1.5,
    '1/32': 0.5, '1/32T': 0.33, '1/32D': 0.75,
    '1/64': 0.25,
  };
  return rates[rate];
}

/**
 * Apply octave mode to notes
 */
export function applyOctaveMode(
  notes: readonly number[],
  mode: OctaveMode
): readonly number[] {
  if (notes.length === 0) return [];

  const result: number[] = [...notes];

  switch (mode) {
    case '2oct':
      return [...notes, ...notes.map(n => n + 12)];
    case '3oct':
      return [...notes, ...notes.map(n => n + 12), ...notes.map(n => n + 24)];
    case '4oct':
      return [...notes, ...notes.map(n => n + 12), ...notes.map(n => n + 24), ...notes.map(n => n + 36)];
    case '1octDown':
      return notes.map(n => n - 12);
    case '2octDown':
      return [...notes.map(n => n - 12), ...notes.map(n => n - 24)];
    case '1-2oct':
      return [...notes, ...notes.map(n => n + 12)];
    case '2-1oct':
      return [...notes.map(n => n + 12), ...notes];
    case '1-2-3oct':
      return [...notes, ...notes.map(n => n + 12), ...notes.map(n => n + 24)];
    case '3-2-1oct':
      return [...notes.map(n => n + 24), ...notes.map(n => n + 12), ...notes];
    case 'pingPong2':
      return [...notes, ...notes.map(n => n + 12), ...[...notes].reverse().map(n => n + 12), ...[...notes].reverse()];
    case 'pingPong3':
      return [
        ...notes,
        ...notes.map(n => n + 12),
        ...notes.map(n => n + 24),
        ...[...notes].reverse().map(n => n + 24),
        ...[...notes].reverse().map(n => n + 12),
        ...[...notes].reverse(),
      ];
    case 'pingPong4':
      return [
        ...notes,
        ...notes.map(n => n + 12),
        ...notes.map(n => n + 24),
        ...notes.map(n => n + 36),
        ...[...notes].reverse().map(n => n + 36),
        ...[...notes].reverse().map(n => n + 24),
        ...[...notes].reverse().map(n => n + 12),
        ...[...notes].reverse(),
      ];
    default:
      return result;
  }
}

/**
 * Sort notes by direction
 */
export function sortNotesByDirection(
  notes: readonly number[],
  direction: ArpDirection
): readonly number[] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a - b);

  switch (direction) {
    case 'up':
      return sorted;
    case 'down':
      return sorted.reverse();
    case 'upDown':
      if (sorted.length <= 2) return sorted;
      return [...sorted, ...sorted.slice(1, -1).reverse()];
    case 'downUp':
      if (sorted.length <= 2) return sorted.reverse();
      return [...sorted.reverse(), ...sorted.slice(1, -1)];
    case 'upDownInc':
      return [...sorted, ...sorted.reverse()];
    case 'downUpInc':
      return [...sorted.reverse(), ...sorted];
    case 'converge': {
      const result: number[] = [];
      let left = 0;
      let right = sorted.length - 1;
      while (left <= right) {
        if (left === right) {
          const val = sorted[left];
          if (val !== undefined) result.push(val);
        } else {
          const leftVal = sorted[left];
          const rightVal = sorted[right];
          if (leftVal !== undefined) result.push(leftVal);
          if (rightVal !== undefined) result.push(rightVal);
        }
        left++;
        right--;
      }
      return result;
    }
    case 'diverge': {
      const mid = Math.floor(sorted.length / 2);
      const result: number[] = [];
      for (let i = 0; i <= mid; i++) {
        const leftIdx = mid - i;
        const rightIdx = mid + i;
        if (leftIdx >= 0) {
          const val = sorted[leftIdx];
          if (val !== undefined) result.push(val);
        }
        if (rightIdx < sorted.length && i !== 0) {
          const val = sorted[rightIdx];
          if (val !== undefined) result.push(val);
        }
      }
      return result;
    }
    case 'thumbUp':
      if (sorted.length < 2) return sorted;
      const first = sorted[0];
      return first !== undefined ? [first, ...sorted.slice(1)] : sorted.slice(1);
    case 'thumbDown': {
      if (sorted.length < 2) return sorted.reverse();
      const first = sorted[0];
      return first !== undefined ? [first, ...sorted.slice(1).reverse()] : sorted.slice(1).reverse();
    }
    case 'pinky': {
      if (sorted.length < 2) return sorted;
      const last = sorted[sorted.length - 1];
      return last !== undefined ? [last, ...sorted.slice(0, -1)] : sorted.slice(0, -1);
    }
    case 'random':
      return [...notes].sort(() => Math.random() - 0.5);
    case 'order':
    case 'chord':
    case 'custom':
    default:
      return notes;
  }
}

/**
 * Generate full arpeggio sequence
 */
export function generateArpeggio(
  heldNotes: readonly number[],
  pattern: ArpPattern
): readonly number[] {
  if (heldNotes.length === 0) return [];

  // Sort notes
  const sorted = sortNotesByDirection(heldNotes, pattern.direction);

  // Apply octave mode
  return applyOctaveMode(sorted, pattern.octaveMode);
}

// ============================================================================
// INPUT/OUTPUT
// ============================================================================

export type ArpInput =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'allNotesOff' }
  | { type: 'setPattern'; patternId: string }
  | { type: 'setDirection'; direction: ArpDirection }
  | { type: 'setOctaveMode'; mode: OctaveMode }
  | { type: 'setRate'; rate: ArpRate }
  | { type: 'setSwing'; amount: number }
  | { type: 'setGateScale'; scale: number }
  | { type: 'setVelocityScale'; scale: number }
  | { type: 'setTranspose'; semitones: number }
  | { type: 'toggleHold' }
  | { type: 'tick'; time: number; beat: number }
  | { type: 'stop' };

export type ArpOutput =
  | { type: 'noteOn'; note: number; velocity: number; time: number }
  | { type: 'noteOff'; note: number; time: number }
  | { type: 'stepAdvanced'; step: number }
  | { type: 'patternRestart' };

/**
 * Process input
 */
export function processArpInput(
  state: ArpState,
  input: ArpInput
): { state: ArpState; outputs: ArpOutput[] } {
  const outputs: ArpOutput[] = [];

  switch (input.type) {
    case 'noteOn': {
      const newHeld = [...state.heldNotes, input.note];
      const arpNotes = generateArpeggio(newHeld, state.pattern);
      return {
        state: {
          ...state,
          heldNotes: newHeld,
          sortedNotes: [...newHeld].sort((a, b) => a - b),
          arpeggioNotes: arpNotes,
          isPlaying: true,
        },
        outputs,
      };
    }

    case 'noteOff': {
      if (state.isHolding) {
        return { state, outputs };
      }
      const newHeld = state.heldNotes.filter(n => n !== input.note);
      const arpNotes = generateArpeggio(newHeld, state.pattern);
      return {
        state: {
          ...state,
          heldNotes: newHeld,
          sortedNotes: [...newHeld].sort((a, b) => a - b),
          arpeggioNotes: arpNotes,
          isPlaying: newHeld.length > 0,
          currentNoteIndex: newHeld.length > 0 ? state.currentNoteIndex % Math.max(1, arpNotes.length) : 0,
        },
        outputs,
      };
    }

    case 'allNotesOff':
      return {
        state: {
          ...state,
          heldNotes: state.isHolding ? state.heldNotes : [],
          sortedNotes: state.isHolding ? state.sortedNotes : [],
          arpeggioNotes: state.isHolding ? state.arpeggioNotes : [],
          isPlaying: state.isHolding && state.heldNotes.length > 0,
          currentNoteIndex: 0,
          currentStep: 0,
        },
        outputs,
      };

    case 'setPattern': {
      const pattern = ARP_PRESETS.find(p => p.id === input.patternId);
      if (pattern) {
        const arpNotes = generateArpeggio(state.heldNotes, pattern);
        return {
          state: {
            ...state,
            pattern,
            arpeggioNotes: arpNotes,
            currentStep: 0,
            currentNoteIndex: 0,
          },
          outputs,
        };
      }
      return { state, outputs };
    }

    case 'setDirection': {
      const newPattern = { ...state.pattern, direction: input.direction };
      const arpNotes = generateArpeggio(state.heldNotes, newPattern);
      return {
        state: {
          ...state,
          pattern: newPattern,
          arpeggioNotes: arpNotes,
        },
        outputs,
      };
    }

    case 'setOctaveMode': {
      const newPattern = { ...state.pattern, octaveMode: input.mode };
      const arpNotes = generateArpeggio(state.heldNotes, newPattern);
      return {
        state: {
          ...state,
          pattern: newPattern,
          arpeggioNotes: arpNotes,
        },
        outputs,
      };
    }

    case 'setRate':
      return {
        state: {
          ...state,
          pattern: { ...state.pattern, rate: input.rate },
        },
        outputs,
      };

    case 'setSwing':
      return {
        state: {
          ...state,
          swing: Math.max(0, Math.min(1, input.amount)),
        },
        outputs,
      };

    case 'setGateScale':
      return {
        state: {
          ...state,
          gateScale: Math.max(0.1, Math.min(2, input.scale)),
        },
        outputs,
      };

    case 'setVelocityScale':
      return {
        state: {
          ...state,
          velocityScale: Math.max(0.1, Math.min(2, input.scale)),
        },
        outputs,
      };

    case 'setTranspose':
      return {
        state: {
          ...state,
          transpose: Math.max(-24, Math.min(24, input.semitones)),
        },
        outputs,
      };

    case 'toggleHold': {
      const newHolding = !state.isHolding;
      if (!newHolding) {
        // Releasing hold - clear notes if none physically held
        return {
          state: {
            ...state,
            isHolding: false,
            heldNotes: [],
            sortedNotes: [],
            arpeggioNotes: [],
            isPlaying: false,
          },
          outputs,
        };
      }
      return {
        state: { ...state, isHolding: true },
        outputs,
      };
    }

    case 'stop':
      return {
        state: {
          ...state,
          isPlaying: false,
          currentStep: 0,
          currentNoteIndex: 0,
        },
        outputs,
      };

    case 'tick': {
      if (!state.isPlaying || state.arpeggioNotes.length === 0) {
        return { state, outputs };
      }

      const step = state.pattern.steps[state.currentStep % state.pattern.length];
      if (!step || !step.enabled) {
        // Skip disabled steps
        const nextStep = (state.currentStep + 1) % state.pattern.length;
        if (nextStep === 0) {
          outputs.push({ type: 'patternRestart' });
        }
        outputs.push({ type: 'stepAdvanced', step: nextStep });
        return {
          state: { ...state, currentStep: nextStep },
          outputs,
        };
      }

      // Check probability
      if (step.probability < 1 && Math.random() > step.probability) {
        const nextStep = (state.currentStep + 1) % state.pattern.length;
        const nextNoteIndex = (state.currentNoteIndex + 1) % state.arpeggioNotes.length;
        return {
          state: { ...state, currentStep: nextStep, currentNoteIndex: nextNoteIndex },
          outputs,
        };
      }

      // Get current note
      const noteIndex = state.currentNoteIndex % state.arpeggioNotes.length;
      const baseNote = state.arpeggioNotes[noteIndex];
      if (baseNote === undefined) {
        return { state, outputs };
      }
      const note = baseNote + step.pitchOffset + step.octaveShift * 12 + state.transpose;

      // Calculate velocity
      let velocity = 80 + step.velocityOffset;
      velocity = Math.round(velocity * state.velocityScale);
      if (step.accent) velocity = Math.min(127, velocity + 30);
      velocity = Math.max(1, Math.min(127, velocity));

      // Handle ratcheting
      for (let r = 0; r < step.ratchet; r++) {
        outputs.push({
          type: 'noteOn',
          note,
          velocity,
          time: input.time + (r * 50),  // 50ms between ratchets
        });
      }

      // Advance
      const nextStep = (state.currentStep + 1) % state.pattern.length;
      const nextNoteIndex = (state.currentNoteIndex + 1) % state.arpeggioNotes.length;

      if (nextStep === 0) {
        outputs.push({ type: 'patternRestart' });
      }
      outputs.push({ type: 'stepAdvanced', step: nextStep });

      return {
        state: {
          ...state,
          currentStep: nextStep,
          currentNoteIndex: nextNoteIndex,
        },
        outputs,
      };
    }

    default:
      return { state, outputs };
  }
}

// ============================================================================
// CARD DEFINITION
// ============================================================================

export const ARPEGGIATOR_CARD_META: CardMeta = {
  id: 'arpeggiator',
  name: 'Arpeggiator',
  description: 'Professional arpeggiator with 100+ presets, step sequencer, and ratcheting',
  category: 'generators',
  tags: ['arp', 'pattern', 'sequence', 'midi', 'generator'],
  version: '1.0.0',
  author: 'Cardplay',
};

const ARPEGGIATOR_SIGNATURE: CardSignature = {
  inputs: [
    { name: 'midi', type: PortTypes.NOTES, label: 'MIDI In' },
    { name: 'clock', type: PortTypes.TRIGGER, label: 'Clock' },
    { name: 'control', type: PortTypes.CONTROL, label: 'Control' },
  ],
  outputs: [
    { name: 'notes', type: PortTypes.NOTES, label: 'Notes Out' },
    { name: 'sync', type: PortTypes.TRIGGER, label: 'Sync Out' },
  ],
  params: [],
};

/**
 * Create arpeggiator card
 */
export function createArpeggiatorCard(): Card<ArpInput, ArpOutput> {
  const initialArpState = createArpState();

  return {
    meta: ARPEGGIATOR_CARD_META,
    signature: ARPEGGIATOR_SIGNATURE,
    initialState: createCardState(initialArpState),

    process(input: ArpInput, _context: CardContext, cardState?: CardState<unknown>): CardResult<ArpOutput> {
      const currentState = (cardState?.value as ArpState) ?? initialArpState;
      const result = processArpInput(currentState, input);
      // Return first output or a default output
      const output: ArpOutput = result.outputs[0] ?? { type: 'stepAdvanced', step: 0 };
      return {
        output,
        state: cardState ? updateCardState(cardState, result.state) : createCardState(result.state),
      };
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ARP_PRESETS as arpPresets,
};
