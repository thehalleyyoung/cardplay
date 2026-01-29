/**
 * @fileoverview Arranger System - Auto-Accompaniment Engine
 * 
 * The Arranger transforms chord input streams into multi-voice arrangements.
 * Inspired by EZ Keys, LiquidNotes, and professional arranger keyboards
 * (Yamaha Genos, Korg Pa5X, Roland E-A7).
 * 
 * 🎹 UI Rendering: Full arranger panel with style browser, variation buttons,
 *    fill triggers, real-time controls, voice mixer, and chord display
 * 
 * 🎛️ Behavior: Chord recognition → Voice allocation → Pattern playback →
 *    Multi-voice output with per-voice articulation and expression
 * 
 * @module @cardplay/core/cards/arranger
 */

import type {
  Parameter,
} from './parameters';
import {
  createFloatParameter,
  createIntParameter,
  createEnumParameter,
  createBoolParameter,
} from './parameters';

// ============================================================================
// SONG PART / SCENE INTEGRATION
// ============================================================================

/**
 * Song part types that map to scenes
 * Each song part becomes a scene in the arrangement view
 */
export type SongPartType = 
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'post-chorus'
  | 'bridge'
  | 'breakdown'
  | 'drop'
  | 'solo'
  | 'instrumental'
  | 'outro'
  | 'tag'
  | 'interlude'
  | 'vamp'
  | 'custom';

/**
 * A song part represents a section of the song
 * Each song part corresponds to a scene in the UI
 */
export interface SongPart {
  /** Unique identifier */
  readonly id: string;
  /** Song part type */
  readonly type: SongPartType;
  /** Display name (e.g., "Verse 1", "Chorus 2") */
  readonly name: string;
  /** Number/index of this part type (e.g., Verse 1, Verse 2) */
  readonly number: number;
  /** Length in bars */
  readonly lengthBars: number;
  /** Arranger variation to use (A, B, C, D) */
  readonly variationIndex: number;
  /** Energy level for this part (1-5) */
  readonly energy: number;
  /** Complexity level for this part (1-5) */
  readonly complexity: number;
  /** Optional chord progression override */
  readonly chordProgression?: readonly string[];
  /** Color for UI */
  readonly color: string;
  /** Emoji icon */
  readonly icon: string;
  /** Whether to play fill at end */
  readonly fillAtEnd: boolean;
  /** Whether this part repeats */
  readonly repeat: number;
  /** Tempo override (null = use song tempo) */
  readonly tempoOverride: number | null;
  /** Notes/description */
  readonly notes: string;
}

/**
 * Song structure as a sequence of parts (scenes)
 */
export interface SongStructure {
  /** Song title */
  readonly title: string;
  /** Song key */
  readonly key: string;
  /** Song tempo */
  readonly tempo: number;
  /** Time signature */
  readonly timeSignature: { numerator: number; denominator: number };
  /** Ordered list of song parts */
  readonly parts: readonly SongPart[];
  /** Total length in bars */
  readonly totalBars: number;
  /** Arranger style ID */
  readonly styleId: string;
}

/**
 * Song part visual theme
 */
export const SONG_PART_THEMES: Record<SongPartType, { color: string; icon: string; shortName: string }> = {
  'intro':        { color: '#10b981', icon: '🚀', shortName: 'INT' },
  'verse':        { color: '#3b82f6', icon: '📝', shortName: 'VRS' },
  'pre-chorus':   { color: '#8b5cf6', icon: '⬆️', shortName: 'PRE' },
  'chorus':       { color: '#f59e0b', icon: '🎤', shortName: 'CHO' },
  'post-chorus':  { color: '#f97316', icon: '⬇️', shortName: 'PST' },
  'bridge':       { color: '#ec4899', icon: '🌉', shortName: 'BRG' },
  'breakdown':    { color: '#6366f1', icon: '💥', shortName: 'BRK' },
  'drop':         { color: '#ef4444', icon: '🔥', shortName: 'DRP' },
  'solo':         { color: '#14b8a6', icon: '🎸', shortName: 'SOL' },
  'instrumental': { color: '#06b6d4', icon: '🎹', shortName: 'INS' },
  'outro':        { color: '#6b7280', icon: '🏁', shortName: 'OUT' },
  'tag':          { color: '#a855f7', icon: '🏷️', shortName: 'TAG' },
  'interlude':    { color: '#0ea5e9', icon: '🔄', shortName: 'ILU' },
  'vamp':         { color: '#eab308', icon: '🔁', shortName: 'VMP' },
  'custom':       { color: '#71717a', icon: '✨', shortName: 'CUS' },
};

/**
 * Create a song part
 */
export function createSongPart(
  type: SongPartType,
  number: number = 1,
  opts: Partial<Omit<SongPart, 'id' | 'type' | 'number'>> = {}
): SongPart {
  const theme = SONG_PART_THEMES[type];
  const defaultName = `${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} ${number}`;
  
  return Object.freeze({
    id: `${type}-${number}-${Date.now()}`,
    type,
    number,
    name: opts.name ?? defaultName,
    lengthBars: opts.lengthBars ?? getDefaultLengthForPart(type),
    variationIndex: opts.variationIndex ?? getDefaultVariationForPart(type),
    energy: opts.energy ?? getDefaultEnergyForPart(type),
    complexity: opts.complexity ?? 3,
    ...(opts.chordProgression !== undefined ? { chordProgression: opts.chordProgression } : {}),
    color: opts.color ?? theme.color,
    icon: opts.icon ?? theme.icon,
    fillAtEnd: opts.fillAtEnd ?? true,
    repeat: opts.repeat ?? 1,
    tempoOverride: opts.tempoOverride ?? null,
    notes: opts.notes ?? '',
  });
}

/**
 * Default bar lengths for each part type
 */
function getDefaultLengthForPart(type: SongPartType): number {
  switch (type) {
    case 'intro': return 4;
    case 'verse': return 8;
    case 'pre-chorus': return 4;
    case 'chorus': return 8;
    case 'post-chorus': return 4;
    case 'bridge': return 8;
    case 'breakdown': return 8;
    case 'drop': return 8;
    case 'solo': return 8;
    case 'instrumental': return 8;
    case 'outro': return 4;
    case 'tag': return 2;
    case 'interlude': return 4;
    case 'vamp': return 4;
    case 'custom': return 8;
  }
}

/**
 * Default variation (A=0, B=1, C=2, D=3) for each part type
 */
function getDefaultVariationForPart(type: SongPartType): number {
  switch (type) {
    case 'intro': return 0;      // A - sparse
    case 'verse': return 0;      // A - laid back
    case 'pre-chorus': return 1; // B - building
    case 'chorus': return 2;     // C - full
    case 'post-chorus': return 2;// C - maintain energy
    case 'bridge': return 1;     // B - different
    case 'breakdown': return 0;  // A - stripped
    case 'drop': return 3;       // D - maximum
    case 'solo': return 2;       // C - energetic
    case 'instrumental': return 1;// B - medium
    case 'outro': return 0;      // A - winding down
    case 'tag': return 2;        // C - punchy
    case 'interlude': return 0;  // A - sparse
    case 'vamp': return 1;       // B - groove
    case 'custom': return 1;     // B - default
  }
}

/**
 * Default energy level for each part type
 */
function getDefaultEnergyForPart(type: SongPartType): number {
  switch (type) {
    case 'intro': return 2;
    case 'verse': return 2;
    case 'pre-chorus': return 3;
    case 'chorus': return 4;
    case 'post-chorus': return 4;
    case 'bridge': return 3;
    case 'breakdown': return 2;
    case 'drop': return 5;
    case 'solo': return 4;
    case 'instrumental': return 3;
    case 'outro': return 2;
    case 'tag': return 4;
    case 'interlude': return 2;
    case 'vamp': return 3;
    case 'custom': return 3;
  }
}

/**
 * Create a typical pop song structure
 */
export function createPopSongStructure(styleId: string, tempo: number = 120): SongStructure {
  return {
    title: 'Untitled',
    key: 'C',
    tempo,
    timeSignature: { numerator: 4, denominator: 4 },
    styleId,
    parts: [
      createSongPart('intro', 1, { lengthBars: 4 }),
      createSongPart('verse', 1, { lengthBars: 8 }),
      createSongPart('pre-chorus', 1, { lengthBars: 4 }),
      createSongPart('chorus', 1, { lengthBars: 8 }),
      createSongPart('verse', 2, { lengthBars: 8 }),
      createSongPart('pre-chorus', 2, { lengthBars: 4 }),
      createSongPart('chorus', 2, { lengthBars: 8 }),
      createSongPart('bridge', 1, { lengthBars: 8 }),
      createSongPart('chorus', 3, { lengthBars: 8, repeat: 2 }),
      createSongPart('outro', 1, { lengthBars: 4 }),
    ],
    totalBars: 72,
  };
}

/**
 * Create an EDM song structure
 */
export function createEDMSongStructure(styleId: string, tempo: number = 128): SongStructure {
  return {
    title: 'Untitled',
    key: 'Am',
    tempo,
    timeSignature: { numerator: 4, denominator: 4 },
    styleId,
    parts: [
      createSongPart('intro', 1, { lengthBars: 8, energy: 1 }),
      createSongPart('verse', 1, { lengthBars: 16, name: 'Build 1' }),
      createSongPart('drop', 1, { lengthBars: 16 }),
      createSongPart('breakdown', 1, { lengthBars: 8 }),
      createSongPart('verse', 2, { lengthBars: 16, name: 'Build 2' }),
      createSongPart('drop', 2, { lengthBars: 16 }),
      createSongPart('outro', 1, { lengthBars: 8, energy: 1 }),
    ],
    totalBars: 88,
  };
}

/**
 * Create a jazz song structure (AABA form)
 */
export function createJazzAABASongStructure(styleId: string, tempo: number = 140): SongStructure {
  return {
    title: 'Untitled',
    key: 'Bb',
    tempo,
    timeSignature: { numerator: 4, denominator: 4 },
    styleId,
    parts: [
      createSongPart('intro', 1, { lengthBars: 4 }),
      createSongPart('verse', 1, { lengthBars: 8, name: 'A Section' }),
      createSongPart('verse', 2, { lengthBars: 8, name: 'A Section' }),
      createSongPart('bridge', 1, { lengthBars: 8, name: 'B Section' }),
      createSongPart('verse', 3, { lengthBars: 8, name: 'A Section' }),
      createSongPart('solo', 1, { lengthBars: 32, name: 'Solo (AABA)' }),
      createSongPart('verse', 4, { lengthBars: 8, name: 'A Section (Out)' }),
      createSongPart('outro', 1, { lengthBars: 4, name: 'Tag' }),
    ],
    totalBars: 80,
  };
}

// ============================================================================
// VISUAL REPRESENTATION 🎨
// ============================================================================

/**
 * Emoji-based visual representation for arranger UI elements
 */
export const ARRANGER_VISUALS = {
  // Voice icons
  bass: '🎸',
  drums: '🥁',
  piano: '🎹',
  guitar: '🎸',
  strings: '🎻',
  brass: '🎺',
  synth: '🎛️',
  pad: '☁️',
  percussion: '🪘',
  choir: '🎤',
  organ: '⛪',
  
  // Section icons
  intro: '🚀',
  main: '🎵',
  fill: '✨',
  break: '⏸️',
  ending: '🏁',
  
  // Control icons
  play: '▶️',
  stop: '⏹️',
  sync: '🔄',
  tap: '👆',
  variation: '🔀',
  
  // Energy levels
  energy: ['😴', '🙂', '😊', '😃', '🔥'],
  
  // Style categories
  pop: '🎤',
  rock: '🎸',
  jazz: '🎷',
  latin: '💃',
  electronic: '🎛️',
  world: '🌍',
  classical: '🎼',
  country: '🤠',
  rnb: '🎙️',
  ballroom: '💃',
} as const;

/**
 * CSS-in-JS style definitions for arranger UI
 */
export const ARRANGER_UI_STYLES = {
  panel: {
    display: 'grid',
    gridTemplateAreas: `
      "style style style controls"
      "voices voices mixer mixer"
      "chord chord pattern pattern"
    `,
    gap: '8px',
    padding: '12px',
    background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%)',
    borderRadius: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  styleBrowser: {
    gridArea: 'style',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  styleButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: '#3a3a5e',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': { background: '#4a4a7e' },
    '&.active': { background: '#6366f1', boxShadow: '0 0 12px rgba(99,102,241,0.5)' },
  },
  variationBar: {
    display: 'flex',
    gap: '4px',
  },
  variationButton: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  voiceMixer: {
    gridArea: 'voices',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
    gap: '8px',
  },
  voiceStrip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    background: '#252540',
    borderRadius: '8px',
  },
  chordDisplay: {
    gridArea: 'chord',
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '16px',
    background: '#1a1a2e',
    borderRadius: '8px',
    color: '#fff',
    textShadow: '0 0 20px rgba(99,102,241,0.5)',
  },
} as const;

// ============================================================================
// CHORD RECOGNITION TYPES
// ============================================================================

/**
 * Recognized chord quality
 */
export type ChordQuality = 
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'dom7' | 'maj7' | 'min7' | 'dim7' | 'hdim7' | 'aug7'
  | 'sus2' | 'sus4' | 'add9' | 'add11'
  | '6' | 'min6' | '9' | 'min9' | 'maj9'
  | '11' | 'min11' | '13' | 'min13'
  | 'power';

/**
 * Recognized chord with all components
 */
export interface RecognizedChord {
  /** Root note (0-11, C=0) */
  readonly root: number;
  /** Chord quality */
  readonly quality: ChordQuality;
  /** Bass note if different from root (slash chord) */
  readonly bass?: number;
  /** Extensions (9, 11, 13) */
  readonly extensions: readonly number[];
  /** Alterations (#5, b9, etc.) */
  readonly alterations: readonly string[];
  /** Original MIDI notes that formed this chord */
  readonly sourceNotes: readonly number[];
  /** Chord symbol string (e.g., "Cmaj7", "F#m9") */
  readonly symbol: string;
  /** Roman numeral in current key */
  readonly romanNumeral?: string;
}

/**
 * Chord recognition configuration
 */
export interface ChordRecognizerConfig {
  /** Minimum notes to recognize (2-3) */
  readonly minNotes: number;
  /** Split point for left-hand detection */
  readonly splitPoint: number;
  /** Whether to detect inversions */
  readonly detectInversions: boolean;
  /** Whether to detect slash chords */
  readonly detectSlashChords: boolean;
  /** Tolerance for near-simultaneous notes (ms) */
  readonly tolerance: number;
}

/**
 * Default chord recognizer config
 */
export const DEFAULT_RECOGNIZER_CONFIG: ChordRecognizerConfig = {
  minNotes: 3,
  splitPoint: 60, // Middle C
  detectInversions: true,
  detectSlashChords: true,
  tolerance: 50,
};

/**
 * Note names for chord symbol generation
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Interval patterns for chord quality detection
 */
const CHORD_PATTERNS: Record<string, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim7: [0, 3, 6, 9],
  hdim7: [0, 3, 6, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  power: [0, 7],
  '6': [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  min9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
};

/**
 * Recognize chord from MIDI notes
 */
export function recognizeChord(
  notes: readonly number[],
  config: ChordRecognizerConfig = DEFAULT_RECOGNIZER_CONFIG
): RecognizedChord | null {
  if (notes.length < config.minNotes) return null;
  
  // Normalize to pitch classes
  const pitchClasses = [...new Set(notes.map(n => n % 12))].sort((a, b) => a - b);
  if (pitchClasses.length < 2) return null;
  
  // Try each pitch class as potential root
  let bestMatch: { quality: ChordQuality; root: number; score: number } | null = null;
  
  for (const candidateRoot of pitchClasses) {
    const intervals = pitchClasses.map(pc => (pc - candidateRoot + 12) % 12).sort((a, b) => a - b);
    
    for (const [quality, pattern] of Object.entries(CHORD_PATTERNS)) {
      if (pattern.every(interval => intervals.includes(interval))) {
        const score = pattern.length + (intervals.length === pattern.length ? 10 : 0);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { quality: quality as ChordQuality, root: candidateRoot, score };
        }
      }
    }
  }
  
  if (!bestMatch) {
    // Default to major if no pattern matches
    const firstPitchClass = pitchClasses[0];
    if (firstPitchClass === undefined) return null;
    bestMatch = { quality: 'major', root: firstPitchClass, score: 0 };
  }
  
  // Detect bass note (lowest)
  const lowestNote = Math.min(...notes);
  const bassPC = lowestNote % 12;
  const bass = bassPC !== bestMatch.root ? bassPC : undefined;
  
  // Generate chord symbol
  const rootName = NOTE_NAMES[bestMatch.root];
  let qualitySymbol = '';
  switch (bestMatch.quality) {
    case 'major': qualitySymbol = ''; break;
    case 'minor': qualitySymbol = 'm'; break;
    case 'diminished': qualitySymbol = 'dim'; break;
    case 'augmented': qualitySymbol = 'aug'; break;
    case 'dom7': qualitySymbol = '7'; break;
    case 'maj7': qualitySymbol = 'maj7'; break;
    case 'min7': qualitySymbol = 'm7'; break;
    case 'dim7': qualitySymbol = 'dim7'; break;
    case 'hdim7': qualitySymbol = 'm7b5'; break;
    case 'sus2': qualitySymbol = 'sus2'; break;
    case 'sus4': qualitySymbol = 'sus4'; break;
    case 'power': qualitySymbol = '5'; break;
    default: qualitySymbol = bestMatch.quality;
  }
  
  const bassSymbol = bass !== undefined ? `/${NOTE_NAMES[bass]}` : '';
  
  return {
    root: bestMatch.root,
    quality: bestMatch.quality,
    ...(bass !== undefined ? { bass } : {}),
    extensions: [],
    alterations: [],
    sourceNotes: notes,
    symbol: `${rootName}${qualitySymbol}${bassSymbol}`,
  };
}

// ============================================================================
// VOICE TYPES
// ============================================================================

/**
 * Voice type in arrangement
 */
export type VoiceType = 
  | 'bass'
  | 'drums'
  | 'percussion'
  | 'piano'
  | 'guitar'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'synth'
  | 'pad'
  | 'lead'
  | 'choir'
  | 'organ'
  // Extended instrument types used in styles
  | 'electronic'
  | 'accordion'
  | 'keys'
  | 'mallet'
  | 'sitar'
  | 'oud'
  | 'qanun'
  | 'clarinet'
  | 'violin'
  | 'saxophone'
  | 'viola'
  | 'cello'
  | 'harp'
  | 'cello-bass'
  | 'harpsichord'
  | 'grand-piano'
  | 'french-horn'
  | 'power-bass'
  | 'power-kit'
  | 'distortion-guitar'
  | 'power-chord-pad'
  | 'rock-bass'
  | 'room-kit'
  | 'crunch-guitar'
  | 'melodic-bass'
  | 'warm-strings'
  | 'sustain-bass'
  | 'orchestral-strings'
  | 'slap-bass'
  | 'funk-kit'
  | 'rhodes'
  | 'funk-horns'
  | 'walking-bebop'
  | 'bebop-kit'
  | 'bebop-piano'
  | 'acid-bass'
  | 'tr-909'
  | 'techno-lead'
  | 'dark-pad'
  | 'trance-bass'
  | 'trance-kit'
  | 'supersaw'
  | 'trance-pad'
  | 'reese-bass'
  | 'dnb-breaks'
  | 'dnb-lead'
  | 'atmosphere'
  | 'wobble-bass'
  | 'dubstep-kit'
  | 'growl-synth'
  | 'dark-atmosphere'
  | 'motown-bass'
  | 'motown-kit'
  | 'soul-strings'
  | 'neo-soul-bass'
  | 'neo-kit'
  | 'neo-rhodes'
  | 'warm-pad'
  | 'acoustic-bass'
  | 'folk-kit'
  | 'acoustic-strum'
  | 'upright-bass'
  | 'banjo'
  | 'fiddle'
  | 'mandolin'
  | 'bodhran'
  | 'celtic-fiddle'
  | 'tin-whistle'
  | 'brush-kit'
  | 'acoustic-piano'
  | 'pedal-steel'
  | 'country-kit'
  | 'honky-tonk-piano'
  | 'electric-guitar-clean'
  | 'synth-bass'
  | 'modern-country-kit'
  | 'acoustic-guitar-steel'
  | 'modern-pad'
  | 'jazz-kit'
  | 'acoustic-kit'
  | 'electric-bass'
  | 'highlife-kit'
  | 'palm-wine-guitar'
  | 'brass-section'
  | 'zouk-kit'
  | 'synth-pad'
  | 'calypso-kit'
  | 'steel-drum'
  | 'acoustic-guitar-nylon'
  | 'electronic-kit'
  | 'synth-lead'
  | 'bass-guitar'
  | 'indie-kit'
  | 'jangle-guitar'
  | 'clean-guitar'
  | 'prog-kit'
  | 'prog-guitar'
  | 'prog-synth'
  | 'punk-bass'
  | 'punk-kit'
  | 'grunge-bass'
  | 'grunge-kit'
  | 'heavy-distortion'
  | 'alt-bass'
  | 'alt-kit'
  | 'alt-guitar'
  | 'texture-pad'
  | 'jazz-piano'
  | 'string-section'
  | 'latin-bass'
  | 'latin-kit'
  | 'latin-piano'
  | 'latin-percussion'
  // Blues, Latin & World style types
  | 'walking-blues'
  | 'blues-piano'
  | 'clean-blues'
  | 'slow-blues'
  | 'brushes-kit'
  | 'brushes'
  | 'organ-pad'
  | 'tumbao'
  | 'piano-montuno'
  | 'congas-guiro'
  | 'tango-bass'
  | 'tango-strings'
  | 'bandoneon'
  | 'tango-piano'
  | 'mambo-bass'
  | 'mambo-kit'
  | 'mambo-brass'
  | 'montuno'
  | 'bolero-percussion'
  | 'nylon-guitar'
  | 'romantic-piano'
  | 'rumba-bass'
  | 'rumba-percussion'
  | 'conga-set'
  | 'son-bass'
  | 'son-percussion'
  | 'cuban-tres'
  | 'son-trumpet'
  | 'guaracha-bass'
  | 'guaracha-percussion'
  | 'ballad-bass'
  | 'ballad-piano'
  // Soul/R&B/Funk voice types
  | 'vintage-kit'
  | 'electric-piano'
  | '808-bass'
  | '90s-kit'
  | 'njs-kit'
  | 'synth-brass'
  | 'vocal-pad'
  | 'smooth-bass'
  | 'lush-strings'
  | 'funk-bass'
  | 'clavinet'
  | 'lead-synth'
  | 'brass-stabs'
  | 'rock-kit'
  | 'funk-guitar'
  | 'classic-funk-kit'
  | 'brass-hits'
  // Disco/80s voice types
  | 'disco-bass'
  | 'disco-kit'
  | 'rhythm-guitar'
  | 'disco-strings'
  | 'filtered-guitar'
  | 'linn-drum'
  | 'dx7-rhodes'
  | 'poly-synth'
  | 'string-synth'
  // Gospel/Choir voice types
  | 'hammond-organ'
  | 'choir-pad'
  | 'modern-kit'
  | 'gospel-choir'
  | 'choir-soprano'
  | 'choir-alto'
  | 'choir-tenor'
  | 'choir-bass'
  // Soul/R&B extended voice types
  | 'soul-kit'
  | 'string-ensemble'
  | 'vibraphone'
  | 'wah-guitar'
  | 'wurlitzer'
  | 'dx7-keys'
  | 'analog-pad'
  | 'sax'
  // African voice types
  | 'soukous-kit'
  | 'sebene-guitar-lead'
  | 'sebene-guitar-rhythm'
  // Rock/Blues extended voice types
  | 'dry-kit'
  | 'analog-synth'
  | 'power-guitar'
  | 'fuzz-guitar'
  | 'phaser-guitar'
  | 'slide-guitar'
  // Jazz extended voice types
  | 'hard-bop-kit'
  | 'hard-bop-piano'
  | 'trumpet'
  | 'free-kit'
  | 'prepared-piano'
  | 'gypsy-guitar'
  | 'breakbeat-kit'
  | 'fusion-kit'
  // Blues/Folk voice types
  | 'blues-kit'
  | 'blues-guitar'
  | 'harmonica'
  | 'acoustic-guitar'
  | 'voice'
  | 'swing-kit'
  | 'hollow-body-guitar'
  | 'jump-kit'
  | 'distorted-guitar'
  // Additional instrument types
  | 'light-kit'
  | 'light-jazz-kit'
  | 'minimal-kit'
  | 'alto-sax'
  | 'tenor-sax'
  | 'woodwind-section'
  | 'fingerstyle-guitar'
  | 'electric-guitar'
  | 'electric-clean'
  | 'washboard'
  | 'zydeco-kit'
  | 'sample';

/**
 * Voice output event
 */
export interface VoiceEvent {
  /** Voice identifier */
  readonly voiceId: string;
  /** Voice type */
  readonly voiceType: VoiceType;
  /** MIDI note number */
  readonly note: number;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Start time in ticks */
  readonly startTick: number;
  /** Duration in ticks */
  readonly durationTicks: number;
  /** Articulation */
  readonly articulation: 'normal' | 'staccato' | 'legato' | 'accent' | 'ghost' | 'slap' | 'pop';
  /** Voice-specific channel for multi-timbral */
  readonly channel: number;
}

/**
 * Voice configuration within a style
 */
export interface VoiceConfig {
  /** Voice identifier */
  readonly id: string;
  /** Voice type */
  readonly type: VoiceType;
  /** Display name */
  readonly name: string;
  /** Default instrument/patch */
  readonly instrument: string;
  /** Volume (0-1) */
  readonly volume: number;
  /** Pan (-1 to 1) */
  readonly pan: number;
  /** Octave offset */
  readonly octaveOffset: number;
  /** Whether voice is enabled */
  readonly enabled: boolean;
  /** MIDI channel */
  readonly channel: number;
  /** Emoji icon */
  readonly icon: string;
}

// ============================================================================
// PATTERN TYPES
// ============================================================================

/**
 * A single pattern step
 */
export interface PatternStep {
  /** Position within pattern (0-based beat fraction) */
  readonly position: number;
  /** Chord degree (1=root, 3=third, 5=fifth, 7=seventh, etc.) or absolute offset */
  readonly degree: number | 'root' | 'second' | 'third' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'ninth' | 'octave' | 'flatninth' | 'thirteenth' | 'eleventh';
  /** Octave offset from voice default */
  readonly octaveOffset: number;
  /** Duration as fraction of beat */
  readonly duration: number;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Articulation */
  readonly articulation: 'normal' | 'staccato' | 'legato' | 'accent' | 'ghost' | 'slap' | 'pop';
  /** Probability of playing (0-1) */
  readonly probability: number;
}

/**
 * Pattern for a voice within a style variation
 */
export interface VoicePattern {
  /** Voice ID this pattern applies to */
  readonly voiceId: string;
  /** Pattern length in beats */
  readonly lengthBeats: number;
  /** Pattern steps */
  readonly steps: readonly PatternStep[];
  /** Whether pattern loops */
  readonly loop: boolean;
  /** Swing amount (0-1) */
  readonly swing: number;
  /** Humanize amount (0-1) */
  readonly humanize: number;
}

/**
 * Drum pattern step (different from melodic)
 */
export interface DrumStep {
  /** Position within pattern */
  readonly position: number;
  /** Drum sound ID (kick, snare, hihat, etc.) */
  readonly sound: string;
  /** Velocity */
  readonly velocity: number;
  /** Flam offset */
  readonly flam?: number;
}

/**
 * Drum pattern
 */
export interface DrumPattern {
  /** Pattern length in beats */
  readonly lengthBeats: number;
  /** Steps by sound */
  readonly steps: readonly DrumStep[];
  /** Swing amount */
  readonly swing: number;
}

// ============================================================================
// STYLE TYPES
// ============================================================================

/**
 * Style variation (A, B, C, D, etc.)
 * Supports two formats:
 * 1. Legacy format with patterns/drumPattern arrays
 * 2. New format with embedded voices object
 */
export interface StyleVariation {
  /** Variation ID (optional for new format where name is used) */
  readonly id?: string;
  /** Display name */
  readonly name: string;
  /** Description of this variation */
  readonly description?: string;
  /** Intensity level (1-5) - optional for new format */
  readonly intensity?: number;
  /** Voice patterns for this variation (legacy format) */
  readonly patterns?: readonly VoicePattern[];
  /** Drum pattern for this variation (legacy format) */
  readonly drumPattern?: DrumPattern;
  /** Fill pattern to play when switching to this variation */
  readonly fillPattern?: DrumPattern;
  /** Voice configurations (new style format with embedded patterns) */
  readonly voices?: Record<string, { steps: readonly (PatternStep | DrumStep)[]; swing: number }>;
}

/**
 * Style section type
 */
export type SectionType = 'intro' | 'main' | 'fill' | 'break' | 'ending';

/**
 * Style section (intro, main, fill, ending)
 */
export interface StyleSection {
  /** Section type */
  readonly type: SectionType;
  /** Section ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Length in bars */
  readonly lengthBars: number;
  /** Patterns for this section */
  readonly patterns: readonly VoicePattern[];
  /** Drum pattern */
  readonly drumPattern: DrumPattern;
  /** Whether this section auto-transitions */
  readonly autoTransition: boolean;
  /** Section to transition to */
  readonly transitionTo?: string;
}

/**
 * Complete arranger style
 */
export interface ArrangerStyle {
  /** Style ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Category */
  readonly category: string;
  /** Subcategory */
  readonly subcategory?: string;
  /** Description */
  readonly description: string;
  /** Tempo range */
  readonly tempoRange: { min: number; max: number };
  /** Default tempo */
  readonly defaultTempo: number;
  /** Time signature */
  readonly timeSignature: { numerator: number; denominator: number };
  /** Voice configurations */
  readonly voices: readonly VoiceConfig[];
  /** Main variations (A, B, C, D) */
  readonly variations: readonly StyleVariation[];
  /** Intro sections */
  readonly intros: readonly StyleSection[];
  /** Ending sections */
  readonly endings: readonly StyleSection[];
  /** Fill patterns */
  readonly fills: readonly StyleSection[];
  /** Break pattern */
  readonly breaks: readonly StyleSection[];
  /** Tags for search */
  readonly tags: readonly string[];
  /** Emoji icon */
  readonly icon: string;
  /** Preview audio URL */
  readonly previewUrl?: string;
}

// ============================================================================
// ARRANGER STATE
// ============================================================================

/**
 * Current arranger playback state
 */
export interface ArrangerState {
  /** Is arranger running */
  readonly isPlaying: boolean;
  /** Current tempo */
  readonly tempo: number;
  /** Current position in ticks */
  readonly positionTicks: number;
  /** Currently loaded style */
  readonly styleId: string | null;
  /** Current variation index (0-3 for A-D) */
  readonly variationIndex: number;
  /** Currently recognized chord */
  readonly currentChord: RecognizedChord | null;
  /** Previous chord (for voice leading) */
  readonly previousChord: RecognizedChord | null;
  /** Current section being played */
  readonly currentSection: SectionType;
  /** Whether fill is queued */
  readonly fillQueued: boolean;
  /** Whether ending is queued */
  readonly endingQueued: boolean;
  /** Sync start enabled */
  readonly syncStart: boolean;
  /** Sync stop enabled */
  readonly syncStop: boolean;
  /** Chord memory (hold chord after release) */
  readonly chordMemory: boolean;
  /** Voice mute states */
  readonly voiceMutes: ReadonlyMap<string, boolean>;
  /** Voice solo states */
  readonly voiceSolos: ReadonlyMap<string, boolean>;
  /** Voice volumes (overrides) */
  readonly voiceVolumes: ReadonlyMap<string, number>;
  /** Energy level (1-5) */
  readonly energyLevel: number;
  /** Complexity level (1-5) */
  readonly complexityLevel: number;
  /** Sync to external DAW/Transport */
  readonly syncToDAW: boolean;
  /** External tempo (when syncing to DAW) */
  readonly externalTempo: number | null;
  /** External position in ticks (when syncing to DAW) */
  readonly externalPositionTicks: number | null;
}

/**
 * Create initial arranger state
 */
export function createArrangerState(): ArrangerState {
  return Object.freeze({
    isPlaying: false,
    tempo: 120,
    positionTicks: 0,
    styleId: null,
    variationIndex: 0,
    currentChord: null,
    previousChord: null,
    currentSection: 'main' as const,
    fillQueued: false,
    endingQueued: false,
    syncStart: true,
    syncStop: false,
    chordMemory: false,
    voiceMutes: new Map(),
    voiceSolos: new Map(),
    voiceVolumes: new Map(),
    energyLevel: 3,
    complexityLevel: 3,
    syncToDAW: false,
    externalTempo: null,
    externalPositionTicks: null,
  });
}

// ============================================================================
// ARRANGER PARAMETERS
// ============================================================================

/**
 * Create arranger parameters for UI rendering
 */
export function createArrangerParameters(): Parameter[] {
  return [
    // Transport
    createBoolParameter({
      id: 'playing',
      name: 'Playing',
      default: false,
      group: 'transport',
      description: 'Arranger playback state',
    }),
    createFloatParameter({
      id: 'tempo',
      name: 'Tempo',
      min: 40,
      max: 240,
      default: 120,
      step: 0.1,
      unit: 'BPM',
      group: 'transport',
      description: 'Playback tempo',
    }),
    
    // Sync controls
    createBoolParameter({
      id: 'syncStart',
      name: 'Sync Start',
      default: true,
      group: 'sync',
      description: 'Start on first chord',
    }),
    createBoolParameter({
      id: 'syncStop',
      name: 'Sync Stop',
      default: false,
      group: 'sync',
      description: 'Stop when keys released',
    }),
    createBoolParameter({
      id: 'chordMemory',
      name: 'Chord Memory',
      default: false,
      group: 'sync',
      description: 'Hold chord after release',
    }),
    createBoolParameter({
      id: 'syncToDAW',
      name: 'Sync to DAW',
      default: false,
      group: 'sync',
      description: 'Sync tempo and position to external DAW/transport',
    }),
    
    // Split point
    createIntParameter({
      id: 'splitPoint',
      name: 'Split Point',
      min: 36,
      max: 84,
      default: 60,
      group: 'detection',
      description: 'Left-hand chord detection zone',
    }),
    
    // Energy & complexity
    createIntParameter({
      id: 'energyLevel',
      name: 'Energy',
      min: 1,
      max: 5,
      default: 3,
      group: 'expression',
      description: 'Arrangement intensity (1-5)',
    }),
    createIntParameter({
      id: 'complexityLevel',
      name: 'Complexity',
      min: 1,
      max: 5,
      default: 3,
      group: 'expression',
      description: 'Rhythmic complexity (1-5)',
    }),
    
    // Voice mix
    createFloatParameter({
      id: 'bassVolume',
      name: 'Bass',
      min: 0,
      max: 1,
      default: 0.8,
      group: 'mix',
    }),
    createFloatParameter({
      id: 'drumsVolume',
      name: 'Drums',
      min: 0,
      max: 1,
      default: 0.8,
      group: 'mix',
    }),
    createFloatParameter({
      id: 'chordsVolume',
      name: 'Chords',
      min: 0,
      max: 1,
      default: 0.7,
      group: 'mix',
    }),
    createFloatParameter({
      id: 'padVolume',
      name: 'Pad',
      min: 0,
      max: 1,
      default: 0.5,
      group: 'mix',
    }),
    
    // Humanization
    createFloatParameter({
      id: 'swing',
      name: 'Swing',
      min: 0,
      max: 1,
      default: 0,
      group: 'feel',
      description: 'Swing amount',
    }),
    createFloatParameter({
      id: 'humanize',
      name: 'Humanize',
      min: 0,
      max: 1,
      default: 0.1,
      group: 'feel',
      description: 'Timing variation',
    }),
    
    // Voice leading
    createEnumParameter({
      id: 'voicingStyle',
      name: 'Voicing',
      options: ['close', 'open', 'drop2', 'drop3', 'rootless', 'spread'],
      default: 'close',
      group: 'harmony',
      description: 'Chord voicing style',
    }),
    createBoolParameter({
      id: 'smoothVoiceLeading',
      name: 'Smooth Voice Leading',
      default: true,
      group: 'harmony',
      description: 'Minimize voice movement',
    }),
  ];
}

// ============================================================================
// ARRANGER INPUT COMMANDS
// ============================================================================

/**
 * Commands that can be sent to the arranger
 */
export type ArrangerCommand =
  | { type: 'loadStyle'; styleId: string }
  | { type: 'play' }
  | { type: 'stop' }
  | { type: 'setVariation'; index: number }
  | { type: 'triggerFill' }
  | { type: 'triggerIntro'; introId?: string }
  | { type: 'triggerEnding'; endingId?: string }
  | { type: 'triggerBreak' }
  | { type: 'setChord'; notes: readonly number[] }
  | { type: 'releaseChord' }
  | { type: 'setTempo'; tempo: number }
  | { type: 'tapTempo'; timestamp: number }
  | { type: 'setEnergy'; level: number }
  | { type: 'setComplexity'; level: number }
  | { type: 'muteVoice'; voiceId: string; muted: boolean }
  | { type: 'soloVoice'; voiceId: string; soloed: boolean }
  | { type: 'setVoiceVolume'; voiceId: string; volume: number }
  | { type: 'setSyncStart'; enabled: boolean }
  | { type: 'setSyncStop'; enabled: boolean }
  | { type: 'setChordMemory'; enabled: boolean }
  | { type: 'setSplitPoint'; note: number }
  | { type: 'setSwing'; amount: number }
  | { type: 'setHumanize'; amount: number }
  | { type: 'setSyncToDAW'; enabled: boolean }
  | { type: 'syncFromDAW'; tempo: number; positionTicks: number };

// ============================================================================
// VOICE ALLOCATION
// ============================================================================

/**
 * Voice leading state for smooth transitions
 */
export interface VoiceLeadingState {
  /** Current voice positions (note numbers) */
  readonly positions: readonly number[];
  /** Voice leading preference (-1 to 1, negative = prefer lower) */
  readonly bias: number;
}

/**
 * Allocate chord tones to voices with smooth voice leading
 */
export function allocateVoices(
  chord: RecognizedChord,
  previousPositions: readonly number[],
  numVoices: number,
  voicingStyle: 'close' | 'open' | 'drop2' | 'drop3' | 'rootless' | 'spread'
): readonly number[] {
  const { root, quality } = chord;
  
  // Get chord tones based on quality
  const pattern = CHORD_PATTERNS[quality] ?? CHORD_PATTERNS.major;
  if (!pattern) {
    return [];
  }
  const chordTones = pattern.map(interval => root + interval);
  
  // Base octave (middle register)
  const baseMidi = 48 + root; // C3 + root
  
  // Generate voicing based on style
  let voicing: number[] = [];
  
  switch (voicingStyle) {
    case 'close':
      // Tight voicing within an octave
      voicing = chordTones.slice(0, numVoices).map((tone, i) => 
        baseMidi + (tone % 12) + Math.floor(i / 4) * 12
      );
      break;
      
    case 'open':
      // Spread voicing across octaves
      voicing = chordTones.slice(0, numVoices).map((tone, i) => 
        baseMidi + (tone % 12) + (i % 2) * 12
      );
      break;
      
    case 'drop2':
      // Drop second voice down an octave
      if (chordTones.length >= 4) {
        const tone0 = chordTones[0];
        const tone1 = chordTones[1];
        const tone2 = chordTones[2];
        const tone3 = chordTones[3];
        if (tone0 !== undefined && tone1 !== undefined && tone2 !== undefined && tone3 !== undefined) {
          voicing = [
            baseMidi + tone0 % 12,
            baseMidi + tone1 % 12 - 12, // Dropped
            baseMidi + tone2 % 12,
            baseMidi + tone3 % 12,
          ].slice(0, numVoices);
        }
      } else {
        voicing = chordTones.slice(0, numVoices).map(tone => baseMidi + tone % 12);
      }
      break;
      
    case 'drop3':
      // Drop third voice down an octave
      if (chordTones.length >= 4) {
        const tone0 = chordTones[0];
        const tone1 = chordTones[1];
        const tone2 = chordTones[2];
        const tone3 = chordTones[3];
        if (tone0 !== undefined && tone1 !== undefined && tone2 !== undefined && tone3 !== undefined) {
          voicing = [
            baseMidi + tone0 % 12,
            baseMidi + tone1 % 12,
            baseMidi + tone2 % 12 - 12, // Dropped
            baseMidi + tone3 % 12,
          ].slice(0, numVoices);
        }
      } else {
        voicing = chordTones.slice(0, numVoices).map(tone => baseMidi + tone % 12);
      }
      break;
      
    case 'rootless':
      // Omit root, use 3-7-9-13 for jazz voicing
      if (chordTones.length >= 3) {
        voicing = chordTones.slice(1, numVoices + 1).map(tone => baseMidi + tone % 12);
      } else {
        voicing = chordTones.slice(0, numVoices).map(tone => baseMidi + tone % 12);
      }
      break;
      
    case 'spread':
      // Wide spread across 2+ octaves
      voicing = chordTones.slice(0, numVoices).map((tone, i) => 
        baseMidi + (tone % 12) + Math.floor(i / 2) * 12 - 12
      );
      break;
  }
  
  // Apply voice leading if we have previous positions
  if (previousPositions.length > 0 && voicing.length === previousPositions.length) {
    // Minimize total movement
    voicing = minimizeVoiceMovement(voicing, previousPositions);
  }
  
  return voicing.slice(0, numVoices);
}

/**
 * Minimize voice movement between voicings
 */
function minimizeVoiceMovement(newVoicing: number[], previousPositions: readonly number[]): number[] {
  // Simple greedy algorithm: for each new voice, find closest previous position
  const result = [...newVoicing];
  const used = new Set<number>();
  
  for (let i = 0; i < result.length; i++) {
    const currentNote = result[i];
    if (currentNote === undefined) continue;
    
    let bestOffset = 0;
    let bestDistance = Infinity;
    
    // Try octave transpositions to find closest voice
    for (let octave = -2; octave <= 2; octave++) {
      const transposed = currentNote + octave * 12;
      for (let j = 0; j < previousPositions.length; j++) {
        if (used.has(j)) continue;
        const prevPos = previousPositions[j];
        if (prevPos === undefined) continue;
        const distance = Math.abs(transposed - prevPos);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestOffset = octave * 12;
        }
      }
    }
    
    result[i] = currentNote + bestOffset;
    // Mark closest previous voice as used
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let j = 0; j < previousPositions.length; j++) {
      if (used.has(j)) continue;
      const prevPos = previousPositions[j];
      const resultI = result[i];
      if (prevPos === undefined || resultI === undefined) continue;
      const dist = Math.abs(resultI - prevPos);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = j;
      }
    }
    used.add(closestIdx);
  }
  
  return result;
}

// ============================================================================
// STYLE PRESETS
// ============================================================================

/**
 * Extended options for voice configuration (used in newer style format)
 */
interface ExtendedVoiceOpts {
  octave?: number;
  velocityRange?: number[];
  volume?: number;
  pan?: number;
  octaveOffset?: number;
  enabled?: boolean;
  channel?: number;
  instrument?: string;
}

/**
 * Create a basic voice configuration
 * Supports both old format: voice(id, type, name, opts) 
 * and new format: voice(id, type, opts)
 */
function voice(
  id: string,
  type: VoiceType,
  nameOrOpts?: string | ExtendedVoiceOpts,
  opts?: Partial<VoiceConfig>
): VoiceConfig {
  // Determine if using old or new format
  const isNewFormat = typeof nameOrOpts === 'object' || nameOrOpts === undefined;
  const name = isNewFormat ? id : nameOrOpts;
  const options: ExtendedVoiceOpts = isNewFormat 
    ? (nameOrOpts as ExtendedVoiceOpts ?? {})
    : (opts ?? {});
  
  // Get icon from ARRANGER_VISUALS if available, otherwise use generic icon
  const visualsWithIndex = ARRANGER_VISUALS as Record<string, string | readonly string[]>;
  const icon = typeof visualsWithIndex[type] === 'string' ? visualsWithIndex[type] as string : '🎵';
  
  return {
    id,
    type,
    name,
    instrument: options.instrument ?? id,
    volume: options.volume ?? 0.8,
    pan: options.pan ?? 0,
    octaveOffset: options.octaveOffset ?? options.octave ?? 0,
    enabled: options.enabled ?? true,
    channel: options.channel ?? 0,
    icon,
  };
}

/**
 * Create a pattern step
 */
function step(
  position: number,
  degree: PatternStep['degree'],
  duration: number = 0.25,
  velocity: number = 100,
  opts: Partial<PatternStep> = {}
): PatternStep {
  return {
    position,
    degree,
    octaveOffset: opts.octaveOffset ?? 0,
    duration,
    velocity,
    articulation: opts.articulation ?? 'normal',
    probability: opts.probability ?? 1,
  };
}

/**
 * Create a drum step
 */
function drum(position: number, sound: string, velocity: number = 100): DrumStep {
  return { position, sound, velocity };
}

// ============================================================================
// VOICE ROLE PATTERN LIBRARIES
// ============================================================================

/**
 * Melody Voice Patterns - Counter-melodies, fills, and responses
 * 
 * Use these patterns for melodic lines that complement the main melody.
 * Examples include:
 * - Counter-melodies (parallel or contrary motion)
 * - Call-and-response phrases
 * - Fills between vocal phrases
 * - Instrumental hooks
 */
export const MELODY_VOICE_PATTERNS = {
  /** Simple counter-melody moving in contrary motion */
  counterMelody: [
    step(0, 'fifth', 1, 70),
    step(1, 'third', 1, 68),
    step(2, 'root', 1, 72),
    step(3, 'third', 1, 70),
  ],
  /** Response phrase (answers the call) */
  response: [
    step(0, 'root', 0.5, 65),
    step(0.5, 'third', 0.5, 68),
    step(1, 'fifth', 1, 72),
    step(2, 'third', 1, 70),
  ],
  /** Fill between phrases */
  fill: [
    step(0, 'fifth', 0.25, 75),
    step(0.25, 'seventh', 0.25, 78),
    step(0.5, 'root', 0.5, 80),
  ],
};

/**
 * Percussion Voice Patterns - Congas, shakers, tambourines
 * 
 * Use these patterns for auxiliary percussion that adds rhythmic color.
 * Common sounds:
 * - Congas (open, mute, slap)
 * - Shakers (continuous eighth or sixteenth notes)
 * - Tambourine (accents on beats)
 * - Cowbell, claves, wood blocks
 */
export const PERCUSSION_VOICE_PATTERNS = {
  /** Basic conga pattern */
  congaBasic: [
    drum(0, 'conga-open', 85),
    drum(1, 'conga-mute', 70),
    drum(2, 'conga-slap', 90),
    drum(3, 'conga-mute', 65),
  ],
  /** Continuous shaker */
  shakerSixteenths: Array.from({ length: 16 }, (_, i) => 
    drum(i * 0.25, 'shaker', i % 2 === 0 ? 60 : 50)
  ),
  /** Tambourine accents */
  tambourineAccents: [
    drum(0, 'tambourine', 70),
    drum(2, 'tambourine', 75),
  ],
  /** Clave pattern (son clave) */
  clave32: [
    drum(0, 'clave', 80),
    drum(1.5, 'clave', 80),
    drum(3, 'clave', 80),
    drum(4.5, 'clave', 80),
    drum(6, 'clave', 80),
  ],
};

/**
 * Brass Voice Patterns - Horn hits, stabs, and lines
 * 
 * Use these patterns for brass sections (trumpet, trombone, sax).
 * Typical uses:
 * - Stabs (short accented chords)
 * - Swells (long crescendo notes)
 * - Horn lines (melodic or harmonic phrases)
 * - Hits on strong beats
 */
export const BRASS_VOICE_PATTERNS = {
  /** Classic horn stabs */
  hornStabs: [
    step(0, 'root', 0.5, 95, { articulation: 'accent' }),
    step(1.5, 'fifth', 0.5, 95, { articulation: 'accent' }),
    step(3, 'third', 0.5, 95, { articulation: 'accent' }),
  ],
  /** Sustained swell */
  swell: [
    step(0, 'root', 4, 65),
  ],
  /** Horn line (melodic) */
  hornLine: [
    step(0, 'root', 1, 80),
    step(1, 'third', 1, 82),
    step(2, 'fifth', 1, 85),
    step(3, 'seventh', 1, 88),
  ],
  /** Punchy hits */
  hits: [
    step(0, 'root', 0.25, 100, { articulation: 'staccato' }),
    step(2, 'fifth', 0.25, 105, { articulation: 'staccato' }),
  ],
};

/**
 * Strings Voice Patterns - Legato lines, pizzicato, tremolo
 * 
 * Use these patterns for string sections (violin, viola, cello).
 * Articulations:
 * - Legato (smooth, connected notes)
 * - Pizzicato (plucked)
 * - Staccato (short, detached)
 * - Tremolo (rapid repetition)
 */
export const STRINGS_VOICE_PATTERNS = {
  /** Legato line (smooth) */
  legatoLine: [
    step(0, 'root', 2, 70, { articulation: 'legato' }),
    step(2, 'third', 2, 72, { articulation: 'legato' }),
  ],
  /** Pizzicato (plucked) */
  pizzicato: [
    step(0, 'root', 0.5, 75, { articulation: 'staccato' }),
    step(0.5, 'third', 0.5, 73, { articulation: 'staccato' }),
    step(1, 'fifth', 0.5, 77, { articulation: 'staccato' }),
    step(1.5, 'third', 0.5, 74, { articulation: 'staccato' }),
  ],
  /** Tremolo (rapid) */
  tremolo: Array.from({ length: 16 }, (_, i) => 
    step(i * 0.125, 'root', 0.125, 65 + (i % 2) * 5)
  ),
  /** Sustained pad */
  pad: [
    step(0, 'root', 8, 65, { articulation: 'legato' }),
  ],
};

// ============================================================================
// FACTORY STYLE PRESETS
// ============================================================================

/**
 * Pop 8-Beat style
 */
export const POP_8BEAT_STYLE: ArrangerStyle = {
  id: 'pop-8beat',
  name: 'Pop 8 Beat',
  category: 'pop',
  subcategory: 'pop-rock',
  description: 'Standard pop with piano comp, bass, drums, and strings pad',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Electric Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Acoustic Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Acoustic Piano', { volume: 0.7, pan: -0.2, channel: 2 }),
    voice('pad', 'pad', 'String Pad', { volume: 0.5, pan: 0.2, channel: 3 }),
    voice('guitar', 'guitar', 'Acoustic Guitar', { volume: 0.6, pan: 0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Verse',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 100),
            step(1, 'root', 0.5, 80),
            step(2, 'fifth', 0.5, 90),
            step(3, 'root', 0.5, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'piano',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 80),
            step(0.5, 'third', 0.25, 70),
            step(1, 'fifth', 0.25, 75),
            step(1.5, 'third', 0.25, 70),
            step(2, 'root', 0.25, 80),
            step(2.5, 'fifth', 0.25, 70),
            step(3, 'third', 0.25, 75),
            step(3.5, 'root', 0.25, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 110),
          drum(0.5, 'hihat', 60),
          drum(1, 'snare', 100),
          drum(1.5, 'hihat', 65),
          drum(2, 'kick', 105),
          drum(2.5, 'hihat', 60),
          drum(3, 'snare', 100),
          drum(3.5, 'hihat', 65),
        ],
        swing: 0,
      },
    },
    {
      id: 'B',
      name: 'Chorus',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 110),
            step(0.5, 'root', 0.25, 90),
            step(1, 'root', 0.25, 95),
            step(1.5, 'fifth', 0.25, 85),
            step(2, 'root', 0.25, 105),
            step(2.5, 'root', 0.25, 90),
            step(3, 'fifth', 0.25, 95),
            step(3.5, 'root', 0.25, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 120),
          drum(0.25, 'hihat', 50),
          drum(0.5, 'hihat', 70),
          drum(0.75, 'hihat', 50),
          drum(1, 'snare', 110),
          drum(1.25, 'hihat', 50),
          drum(1.5, 'hihat', 70),
          drum(1.75, 'hihat', 50),
          drum(2, 'kick', 115),
          drum(2.25, 'hihat', 50),
          drum(2.5, 'kick', 100),
          drum(2.75, 'hihat', 50),
          drum(3, 'snare', 110),
          drum(3.25, 'hihat', 50),
          drum(3.5, 'hihat', 70),
          drum(3.75, 'hihat', 50),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop', '8beat', 'rock', 'mainstream'],
  icon: '🎤',
};

/**
 * Jazz Swing Medium style
 */
export const JAZZ_SWING_STYLE: ArrangerStyle = {
  id: 'jazz-swing-medium',
  name: 'Medium Swing',
  category: 'jazz',
  subcategory: 'swing',
  description: 'Classic 4-beat swing with walking bass and ride cymbal',
  tempoRange: { min: 100, max: 180 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Jazz Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Jazz Piano', { volume: 0.7, pan: -0.1, channel: 2 }),
    voice('guitar', 'guitar', 'Jazz Guitar', { volume: 0.5, pan: 0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Head',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 100),
            step(1, 'third', 1, 95),
            step(2, 'fifth', 1, 90),
            step(3, 'seventh', 1, 85, { articulation: 'legato' }),
          ],
          loop: true,
          swing: 0.6,
          humanize: 0.08,
        },
        {
          voiceId: 'piano',
          lengthBeats: 8,
          steps: [
            step(0.5, 'root', 0.5, 70, { articulation: 'staccato' }),
            step(2.5, 'third', 0.5, 65),
            step(4.5, 'fifth', 0.5, 70),
            step(6.5, 'root', 0.5, 65),
          ],
          loop: true,
          swing: 0.6,
          humanize: 0.1,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'ride', 90),
          drum(0.67, 'ride', 60),
          drum(1, 'ride', 85),
          drum(1.67, 'ride', 55),
          drum(2, 'ride', 90),
          drum(2.67, 'ride', 60),
          drum(3, 'ride', 85),
          drum(3.67, 'ride', 55),
          // Hi-hat on 2 and 4
          drum(1, 'hihat-foot', 80),
          drum(3, 'hihat-foot', 80),
        ],
        swing: 0.6,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'swing', 'bebop', 'standards'],
  icon: '🎷',
};

/**
 * Bossa Nova style
 */
export const BOSSA_NOVA_STYLE: ArrangerStyle = {
  id: 'bossa-nova',
  name: 'Bossa Nova',
  category: 'latin',
  subcategory: 'brazilian',
  description: 'Brazilian bossa nova with nylon guitar and light percussion',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Acoustic Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Bossa Percussion', { volume: 0.6, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Nylon Guitar', { volume: 0.85, pan: 0.2, channel: 2 }),
    voice('piano', 'piano', 'Electric Piano', { volume: 0.5, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Suave',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 90),
            step(2, 'fifth', 1.5, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 4,
          steps: [
            // Bossa rhythm: syncopated comping
            step(0, 'root', 0.25, 70),
            step(0.75, 'third', 0.25, 65),
            step(1.5, 'fifth', 0.25, 60),
            step(2, 'root', 0.25, 70),
            step(2.75, 'third', 0.25, 65),
            step(3.5, 'fifth', 0.25, 60),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Cross-stick on 2 and 4
          drum(1, 'cross-stick', 70),
          drum(3, 'cross-stick', 70),
          // Shaker pattern
          drum(0, 'shaker', 40),
          drum(0.5, 'shaker', 50),
          drum(1, 'shaker', 40),
          drum(1.5, 'shaker', 50),
          drum(2, 'shaker', 40),
          drum(2.5, 'shaker', 50),
          drum(3, 'shaker', 40),
          drum(3.5, 'shaker', 50),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['bossa', 'latin', 'brazilian', 'jazz', 'mellow'],
  icon: '💃',
};

/**
 * Bossa Modern - Updated bossa nova with synthesizers and electronic elements
 */
export const BOSSA_MODERN_STYLE: ArrangerStyle = {
  id: 'bossa-modern',
  name: 'Bossa Modern',
  category: 'latin',
  subcategory: 'brazilian',
  description: 'Modern bossa nova fusion with synth pads, electronic beats, and traditional guitar',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Synth Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'electronic', 'Electronic Kit', { volume: 0.7, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Nylon Guitar', { volume: 0.75, pan: 0.2, channel: 2 }),
    voice('pad', 'synth', 'Warm Pad', { volume: 0.5, pan: -0.1, channel: 3 }),
    voice('keys', 'synth', 'Electric Piano', { volume: 0.6, pan: 0.15, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Electronic Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Modern synth bass with slight sub-bass
            step(0, 'root', 0.5, 100),
            step(0.75, 'fifth', 0.25, 85),
            step(1.5, 'root', 0.25, 90),
            step(2, 'root', 0.5, 95),
            step(2.75, 'third', 0.25, 80),
            step(3.5, 'fifth', 0.25, 85),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.02,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 4,
          steps: [
            // Classic bossa guitar rhythm
            step(0, 'root', 0.25, 70),
            step(0.75, 'third', 0.25, 65),
            step(1.5, 'fifth', 0.25, 68),
            step(2, 'root', 0.25, 72),
            step(2.75, 'third', 0.25, 65),
            step(3.5, 'fifth', 0.25, 67),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.03,
        },
        {
          voiceId: 'pad',
          lengthBeats: 8,
          steps: [
            // Long sustained pad chords
            step(0, 'root', 8, 55),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            // Electric piano Rhodes-style comping
            step(0.5, 'root', 0.25, 60),
            step(1, 'third', 0.25, 58),
            step(2, 'fifth', 0.25, 62),
            step(2.5, 'root', 0.25, 60),
            step(3, 'third', 0.25, 58),
            step(3.75, 'fifth', 0.125, 55),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Electronic kick with soft side-chain feel
          drum(0, 'kick-electronic', 90),
          drum(2, 'kick-electronic', 85),
          
          // Soft clap/rim on 2 and 4
          drum(1, 'clap', 70),
          drum(3, 'clap', 72),
          
          // Hi-hat pattern (16ths with accents)
          drum(0, 'hihat-closed', 55),
          drum(0.25, 'hihat-closed', 45),
          drum(0.5, 'hihat-closed', 60),
          drum(0.75, 'hihat-closed', 45),
          drum(1, 'hihat-closed', 55),
          drum(1.25, 'hihat-closed', 45),
          drum(1.5, 'hihat-open', 65),
          drum(1.75, 'hihat-closed', 45),
          drum(2, 'hihat-closed', 55),
          drum(2.25, 'hihat-closed', 45),
          drum(2.5, 'hihat-closed', 60),
          drum(2.75, 'hihat-closed', 45),
          drum(3, 'hihat-closed', 55),
          drum(3.25, 'hihat-closed', 45),
          drum(3.5, 'hihat-open', 62),
          drum(3.75, 'hihat-closed', 45),
          
          // Shaker for traditional flavor
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'shaker', 40 + (i % 2 === 0 ? 8 : 0))),
        ],
        swing: 0.03,
      },
    },
    {
      id: 'B',
      name: 'Ambient Wave',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Smoother, more sparse bass
            step(0, 'root', 1.5, 85),
            step(2, 'fifth', 1.5, 80),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.02,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 4,
          steps: [
            // More sparse guitar
            step(0, 'root', 0.5, 65),
            step(1.5, 'third', 0.5, 62),
            step(2, 'fifth', 0.5, 68),
            step(3.5, 'root', 0.5, 65),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.03,
        },
        {
          voiceId: 'pad',
          lengthBeats: 8,
          steps: [
            // Evolving pad with slight movement
            step(0, 'root', 4, 60),
            step(4, 'third', 4, 58),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Minimal electronic drums
          drum(0, 'kick-electronic', 75),
          drum(2, 'kick-electronic', 70),
          drum(1, 'clap', 60),
          drum(3, 'clap', 62),
          
          // Sparse hi-hats
          drum(0.5, 'hihat-closed', 50),
          drum(1.5, 'hihat-open', 55),
          drum(2.5, 'hihat-closed', 50),
          drum(3.5, 'hihat-open', 52),
          
          // Shaker
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'shaker', 35 + (i % 2 === 0 ? 5 : 0))),
        ],
        swing: 0.02,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['bossa', 'latin', 'brazilian', 'electronic', 'modern', 'chill'],
  icon: '🌴',
};

/**
 * Cool Jazz - Laid-back West Coast feel
 * Relaxed, understated jazz with smooth voicings and minimal swing
 */
export const COOL_JAZZ_STYLE: ArrangerStyle = {
  id: 'cool-jazz',
  name: 'Cool Jazz',
  category: 'jazz',
  subcategory: 'cool',
  description: 'Laid-back West Coast jazz with subtle swing and smooth voicings',
  tempoRange: { min: 80, max: 140 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.75, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Jazz Brushes', { volume: 0.6, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Jazz Piano', { volume: 0.65, pan: -0.15, channel: 2 }),
    voice('trumpet', 'brass', 'Muted Trumpet', { volume: 0.55, pan: 0.2, channel: 3 }),
    voice('sax', 'brass', 'Alto Sax', { volume: 0.5, pan: 0.15, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Laid Back',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 85),
            step(1, 'fifth', 0.75, 75),
            step(2, 'third', 0.75, 80),
            step(3, 'seventh', 1, 75, { articulation: 'legato' }),
          ],
          loop: true,
          swing: 0.5,
          humanize: 0.06,
        },
        {
          voiceId: 'piano',
          lengthBeats: 8,
          steps: [
            // Sparse block chords with cool jazz voicings
            step(0.75, 'root', 0.5, 60, { articulation: 'staccato' }),
            step(3, 'third', 0.5, 55),
            step(5.5, 'fifth', 0.5, 58),
            step(7, 'root', 0.5, 56),
          ],
          loop: true,
          swing: 0.5,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Brushes on snare - light swing pattern
          drum(0, 'ride', 65),
          drum(0.67, 'ride', 45),
          drum(1, 'ride', 70),
          drum(1.67, 'ride', 40),
          drum(2, 'ride', 68),
          drum(2.67, 'ride', 45),
          drum(3, 'ride', 70),
          drum(3.67, 'ride', 42),
          // Very subtle hi-hat on 2 and 4
          drum(1, 'hihat-foot', 50),
          drum(3, 'hihat-foot', 50),
        ],
        swing: 0.5,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'cool', 'west-coast', 'relaxed', 'smooth', 'mellow'],
  icon: '🎺',
};

/**
 * Modal Jazz - Quartal voicings, sparse arrangement
 * Modal approach with quartal harmony and open spacing
 */
export const MODAL_JAZZ_STYLE: ArrangerStyle = {
  id: 'modal-jazz',
  name: 'Modal Jazz',
  category: 'jazz',
  subcategory: 'modal',
  description: 'Modal jazz with quartal voicings and sparse, atmospheric texture',
  tempoRange: { min: 70, max: 150 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Jazz Kit', { volume: 0.65, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Electric Piano', { volume: 0.7, pan: -0.2, channel: 2 }),
    voice('sax', 'brass', 'Tenor Sax', { volume: 0.6, pan: 0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Modal Vamp',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 8,
          steps: [
            // Pedal-based modal bass line
            step(0, 'root', 1.5, 90),
            step(2, 'root', 1, 85),
            step(4, 'fifth', 1, 85),
            step(6, 'root', 1, 80),
          ],
          loop: true,
          swing: 0.55,
          humanize: 0.07,
        },
        {
          voiceId: 'piano',
          lengthBeats: 8,
          steps: [
            // Quartal harmony stacks (fourths not thirds)
            step(1, 'root', 1.5, 65, { octaveOffset: 1 }),
            step(4, 'fifth', 1.5, 60, { octaveOffset: 1 }),
            step(7, 'third', 0.5, 62, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0.55,
          humanize: 0.09,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Open ride cymbal pattern
          drum(0, 'ride', 75),
          drum(0.67, 'ride', 55),
          drum(1, 'ride', 80),
          drum(1.67, 'ride', 50),
          drum(2, 'ride', 78),
          drum(2.67, 'ride', 55),
          drum(3, 'ride', 80),
          drum(3.67, 'ride', 50),
          // Sparse snare ghosting
          drum(1.5, 'snare', 35),
          drum(3.25, 'snare', 30),
        ],
        swing: 0.55,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'modal', 'quartal', 'atmospheric', 'miles-davis', 'so-what'],
  icon: '🎷',
};

/**
 * Smooth Jazz - Contemporary jazz with synth pads
 * Modern smooth jazz with electronic elements and R&B influence
 */
export const SMOOTH_JAZZ_STYLE: ArrangerStyle = {
  id: 'smooth-jazz',
  name: 'Smooth Jazz',
  category: 'jazz',
  subcategory: 'smooth',
  description: 'Contemporary smooth jazz with synth pads and R&B grooves',
  tempoRange: { min: 90, max: 130 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Fretless Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Modern Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('keys', 'piano', 'Electric Piano', { volume: 0.7, pan: -0.15, channel: 2 }),
    voice('pad', 'pad', 'Warm Synth Pad', { volume: 0.6, pan: 0, channel: 3 }),
    voice('sax', 'brass', 'Soprano Sax', { volume: 0.65, pan: 0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 95),
            step(1, 'fifth', 0.5, 85),
            step(2, 'root', 0.5, 90),
            step(2.75, 'third', 0.25, 80),
            step(3, 'fifth', 0.75, 88),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.04,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            // Smooth Rhodes comping
            step(0.5, 'root', 0.5, 70),
            step(1.5, 'third', 0.5, 65),
            step(2.5, 'fifth', 0.5, 68),
            step(3.5, 'root', 0.5, 66),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.05,
        },
        {
          voiceId: 'pad',
          lengthBeats: 8,
          steps: [
            // Sustained synth pad
            step(0, 'root', 8, 55, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Smooth R&B-influenced groove
          drum(0, 'kick', 100),
          drum(2, 'kick', 95),
          drum(1, 'snare', 90),
          drum(3, 'snare', 90),
          // Tight hi-hats with slight swing
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60 + (i % 2 === 0 ? 10 : 0))),
          drum(1.5, 'hihat-open', 70),
          drum(3.5, 'hihat-open', 70),
        ],
        swing: 0.15,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'smooth', 'contemporary', 'r&b', 'fusion', 'mellow'],
  icon: '🎷',
};

/**
 * Jazz Waltz - 3/4 swing feel
 * Sophisticated 3/4 time with walking bass and elegant comping
 */
export const JAZZ_WALTZ_STYLE: ArrangerStyle = {
  id: 'jazz-waltz',
  name: 'Jazz Waltz',
  category: 'jazz',
  subcategory: 'waltz',
  description: 'Elegant 3/4 time jazz waltz with walking bass and light swing',
  tempoRange: { min: 100, max: 180 },
  defaultTempo: 140,
  timeSignature: { numerator: 3, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Jazz Kit', { volume: 0.7, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Jazz Piano', { volume: 0.75, pan: -0.15, channel: 2 }),
    voice('strings', 'strings', 'String Section', { volume: 0.5, pan: 0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Waltz',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 3,
          steps: [
            step(0, 'root', 0.9, 95),
            step(1, 'fifth', 0.9, 85),
            step(2, 'third', 0.9, 88),
          ],
          loop: true,
          swing: 0.55,
          humanize: 0.07,
        },
        {
          voiceId: 'piano',
          lengthBeats: 6,
          steps: [
            // Waltz comping - accent on 1, light on 2&3
            step(0.5, 'root', 0.4, 75, { articulation: 'staccato' }),
            step(1.5, 'third', 0.3, 58),
            step(2.5, 'fifth', 0.3, 60),
            step(3.5, 'root', 0.4, 72),
            step(4.5, 'third', 0.3, 56),
            step(5.5, 'fifth', 0.3, 58),
          ],
          loop: true,
          swing: 0.55,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 3,
        steps: [
          // Waltz ride pattern - 1 strong, 2-3 lighter
          drum(0, 'ride', 85),
          drum(0.67, 'ride', 55),
          drum(1, 'ride', 70),
          drum(1.67, 'ride', 50),
          drum(2, 'ride', 72),
          drum(2.67, 'ride', 52),
          // Bass drum on 1
          drum(0, 'kick', 65),
          // Hi-hat foot on 2
          drum(1, 'hihat-foot', 70),
        ],
        swing: 0.55,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'waltz', '3/4', 'elegant', 'sophisticated', 'standards'],
  icon: '🎷',
};

/**
 * Dixieland - New Orleans traditional jazz
 * Classic New Orleans jazz with collective improvisation feel
 */
export const DIXIELAND_STYLE: ArrangerStyle = {
  id: 'dixieland',
  name: 'Dixieland',
  category: 'jazz',
  subcategory: 'traditional',
  description: 'New Orleans traditional jazz with banjo, tuba, and collective polyphony',
  tempoRange: { min: 140, max: 220 },
  defaultTempo: 180,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Tuba', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Marching Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('banjo', 'guitar', 'Banjo', { volume: 0.75, pan: -0.2, channel: 2 }),
    voice('trumpet', 'brass', 'Trumpet', { volume: 0.7, pan: 0.15, channel: 3 }),
    voice('clarinet', 'brass', 'Clarinet', { volume: 0.65, pan: 0.25, channel: 4 }),
    voice('trombone', 'brass', 'Trombone', { volume: 0.6, pan: -0.15, channel: 5 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Traditional',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Tuba two-beat pattern
            step(0, 'root', 0.9, 110, { octaveOffset: -1 }),
            step(2, 'fifth', 0.9, 105, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.65,
          humanize: 0.08,
        },
        {
          voiceId: 'banjo',
          lengthBeats: 4,
          steps: [
            // Energetic banjo strumming pattern
            step(0, 'root', 0.25, 85, { articulation: 'staccato' }),
            step(0.5, 'third', 0.25, 75),
            step(1, 'fifth', 0.25, 88),
            step(1.5, 'root', 0.25, 78),
            step(2, 'third', 0.25, 90),
            step(2.5, 'fifth', 0.25, 75),
            step(3, 'root', 0.25, 85),
            step(3.5, 'third', 0.25, 80),
          ],
          loop: true,
          swing: 0.65,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Marching band-style drum pattern
          drum(0, 'snare', 95),
          drum(0.5, 'snare', 70),
          drum(1, 'snare', 100),
          drum(1.5, 'snare', 72),
          drum(2, 'snare', 95),
          drum(2.5, 'snare', 70),
          drum(3, 'snare', 100),
          drum(3.5, 'snare', 72),
          // Bass drum on 1 and 3
          drum(0, 'kick', 100),
          drum(2, 'kick', 100),
          // Cymbal crashes for excitement
          drum(1, 'crash', 75),
          drum(3, 'crash', 75),
        ],
        swing: 0.65,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'dixieland', 'new-orleans', 'traditional', 'ragtime', 'trad-jazz'],
  icon: '🎺',
};

/**
 * Big Band Swing - Full orchestra arrangement
 * Classic big band with brass sections, saxes, and strong swing feel
 */
export const BIG_BAND_SWING_STYLE: ArrangerStyle = {
  id: 'big-band-swing',
  name: 'Big Band Swing',
  category: 'jazz',
  subcategory: 'big-band',
  description: 'Full big band with brass sections, saxes, and powerful swing',
  tempoRange: { min: 120, max: 220 },
  defaultTempo: 160,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Big Band Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Jazz Piano', { volume: 0.7, pan: -0.25, channel: 2 }),
    voice('brass', 'brass', 'Brass Section', { volume: 0.85, pan: 0.1, channel: 3 }),
    voice('saxes', 'brass', 'Sax Section', { volume: 0.8, pan: -0.1, channel: 4 }),
    voice('guitar', 'guitar', 'Jazz Guitar', { volume: 0.55, pan: 0.3, channel: 5 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Shout Chorus',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Energetic walking bass
            step(0, 'root', 0.9, 105),
            step(1, 'third', 0.9, 98),
            step(2, 'fifth', 0.9, 102),
            step(3, 'seventh', 0.9, 95),
          ],
          loop: true,
          swing: 0.65,
          humanize: 0.06,
        },
        {
          voiceId: 'piano',
          lengthBeats: 4,
          steps: [
            // Comping chords on 2 and 4 (backbeat emphasis)
            step(1, 'root', 0.25, 75, { articulation: 'staccato' }),
            step(3, 'root', 0.25, 78, { articulation: 'staccato' }),
          ],
          loop: true,
          swing: 0.65,
          humanize: 0.07,
        },
        {
          voiceId: 'brass',
          lengthBeats: 8,
          steps: [
            // Brass hits and sustained notes
            step(0, 'root', 0.5, 100, { octaveOffset: 1 }),
            step(2, 'fifth', 1, 95, { octaveOffset: 1 }),
            step(4, 'third', 0.5, 98, { octaveOffset: 1 }),
            step(6, 'root', 1.5, 100, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0.65,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Strong swing ride pattern
          drum(0, 'ride', 95),
          drum(0.67, 'ride', 65),
          drum(1, 'ride', 100),
          drum(1.67, 'ride', 62),
          drum(2, 'ride', 95),
          drum(2.67, 'ride', 65),
          drum(3, 'ride', 100),
          drum(3.67, 'ride', 62),
          // Backbeat on 2 and 4
          drum(1, 'snare', 105),
          drum(3, 'snare', 105),
          // Hi-hat foot
          drum(1, 'hihat-foot', 85),
          drum(3, 'hihat-foot', 85),
          // Occasional bass drum
          drum(0, 'kick', 85),
          drum(2.5, 'kick', 75),
        ],
        swing: 0.65,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'big-band', 'swing', 'brass', 'orchestral', 'glenn-miller', 'count-basie'],
  icon: '🎺',
};

/**
 * Merengue - Fast 2-beat Dominican style
 * Energetic Dominican dance music with driving 2/4 feel
 */
export const MERENGUE_STYLE: ArrangerStyle = {
  id: 'merengue',
  name: 'Merengue',
  category: 'latin',
  subcategory: 'dominican',
  description: 'Fast Dominican merengue with driving 2-beat pattern',
  tempoRange: { min: 120, max: 160 },
  defaultTempo: 140,
  timeSignature: { numerator: 2, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Electric Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Merengue Percussion', { volume: 0.8, pan: 0, channel: 10 }),
    voice('accordion', 'accordion', 'Accordion', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('sax', 'brass', 'Tenor Sax', { volume: 0.7, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Típico',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            // Strong on 1, lighter on 2
            step(0, 'root', 0.45, 110, { octaveOffset: -1 }),
            step(1, 'fifth', 0.45, 95, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'accordion',
          lengthBeats: 2,
          steps: [
            // Accordion comping pattern
            step(0, 'root', 0.2, 85),
            step(0.5, 'third', 0.2, 75),
            step(1, 'fifth', 0.2, 88),
            step(1.5, 'root', 0.2, 78),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 2,
        steps: [
          // Tambora pattern (merengue drum)
          drum(0, 'tom-high', 100),
          drum(0.5, 'tom-low', 85),
          drum(1, 'tom-high', 95),
          drum(1.5, 'tom-low', 80),
          // Güira (metal scraper) - constant 16ths
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.25, 'shaker', 70 + (i % 2 === 0 ? 10 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['latin', 'merengue', 'dominican', 'dance', 'fast', 'accordion'],
  icon: '🪗',
};

/**
 * Cumbia - Colombian cumbia pattern
 * Traditional Colombian cumbia with distinctive rhythmic pattern
 */
export const CUMBIA_STYLE: ArrangerStyle = {
  id: 'cumbia',
  name: 'Cumbia',
  category: 'latin',
  subcategory: 'colombian',
  description: 'Colombian cumbia with guacharaca and accordion',
  tempoRange: { min: 90, max: 120 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Electric Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Cumbia Percussion', { volume: 0.75, pan: 0, channel: 10 }),
    voice('accordion', 'accordion', 'Accordion', { volume: 0.8, pan: 0.2, channel: 2 }),
    voice('flute', 'brass', 'Flute', { volume: 0.65, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Traditional',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Cumbia bass pattern
            step(0, 'root', 0.75, 100, { octaveOffset: -1 }),
            step(1, 'root', 0.5, 85, { octaveOffset: -1 }),
            step(2, 'fifth', 0.75, 95, { octaveOffset: -1 }),
            step(3, 'root', 0.5, 88, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.05,
        },
        {
          voiceId: 'accordion',
          lengthBeats: 4,
          steps: [
            // Accordion melody pattern
            step(0.5, 'root', 0.5, 80),
            step(1.5, 'third', 0.5, 75),
            step(2, 'fifth', 0.75, 82),
            step(3.5, 'root', 0.5, 78),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Tambora (drum) pattern
          drum(0, 'tom-low', 95),
          drum(2, 'tom-low', 90),
          // Guacharaca (scraper) pattern
          drum(0, 'shaker', 75),
          drum(0.5, 'shaker', 85),
          drum(1, 'shaker', 75),
          drum(1.5, 'shaker', 85),
          drum(2, 'shaker', 75),
          drum(2.5, 'shaker', 85),
          drum(3, 'shaker', 75),
          drum(3.5, 'shaker', 85),
          // Llamador (calling drum) accents
          drum(1.5, 'tom-high', 80),
          drum(3.5, 'tom-high', 75),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['latin', 'cumbia', 'colombian', 'accordion', 'traditional'],
  icon: '🪘',
};

/**
 * Bachata - Romantic guitar-based Dominican style
 * Romantic bachata with fingerpicked guitar and bongo pattern
 */
export const BACHATA_STYLE: ArrangerStyle = {
  id: 'bachata',
  name: 'Bachata',
  category: 'latin',
  subcategory: 'dominican',
  description: 'Romantic Dominican bachata with fingerpicked guitar',
  tempoRange: { min: 110, max: 140 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Electric Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Bongo & Güira', { volume: 0.7, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Nylon Guitar', { volume: 0.85, pan: 0.15, channel: 2 }),
    voice('keys', 'piano', 'Electric Piano', { volume: 0.5, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Romantic',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Bachata bass pattern (bolero influenced)
            step(0, 'root', 0.75, 90, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.5, 75, { octaveOffset: -1 }),
            step(2, 'root', 0.75, 88, { octaveOffset: -1 }),
            step(3.5, 'third', 0.5, 72, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.06,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 4,
          steps: [
            // Fingerpicked arpeggio pattern
            step(0, 'root', 0.25, 70),
            step(0.5, 'third', 0.25, 65),
            step(1, 'fifth', 0.25, 68),
            step(1.5, 'root', 0.25, 62, { octaveOffset: 1 }),
            step(2, 'third', 0.25, 70, { octaveOffset: 1 }),
            step(2.5, 'fifth', 0.25, 65),
            step(3, 'root', 0.25, 68),
            step(3.5, 'third', 0.25, 62),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Bongo pattern
          drum(0, 'bongo-high', 75),
          drum(0.5, 'bongo-low', 65),
          drum(1, 'bongo-high', 80),
          drum(1.5, 'bongo-low', 62),
          drum(2, 'bongo-high', 78),
          drum(2.5, 'bongo-low', 65),
          drum(3, 'bongo-high', 80),
          drum(3.5, 'bongo-low', 60),
          // Güira (scraper) steady 8ths
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'shaker', 60 + (i % 2 === 0 ? 8 : 0))),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['latin', 'bachata', 'dominican', 'romantic', 'guitar', 'bolero'],
  icon: '💕',
};

/**
 * Reggaeton - Dembow rhythm, urban Latin
 * Modern urban Latin with distinctive dembow rhythm
 */
export const REGGAETON_STYLE: ArrangerStyle = {
  id: 'reggaeton',
  name: 'Reggaeton',
  category: 'latin',
  subcategory: 'urban',
  description: 'Modern urban reggaeton with dembow rhythm',
  tempoRange: { min: 85, max: 105 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', '808 Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Trap Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Reggaeton Lead', { volume: 0.7, pan: 0.15, channel: 2 }),
    voice('pad', 'pad', 'Atmospheric Pad', { volume: 0.5, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Dembow',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // 808 bass dembow pattern
            step(0, 'root', 0.5, 120, { octaveOffset: -1 }),
            step(0.75, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(1.5, 'root', 0.25, 110, { octaveOffset: -1 }),
            step(2, 'root', 0.5, 115, { octaveOffset: -1 }),
            step(3, 'root', 0.25, 105, { octaveOffset: -1 }),
            step(3.5, 'fifth', 0.25, 100, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'synth',
          lengthBeats: 8,
          steps: [
            // Synth melody stabs
            step(2, 'root', 0.5, 85, { octaveOffset: 1 }),
            step(4, 'third', 0.5, 80, { octaveOffset: 1 }),
            step(6, 'fifth', 0.5, 82, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Iconic dembow rhythm
          drum(0, 'kick', 120),
          drum(0.75, 'kick', 100),
          drum(1, 'snare', 110),
          drum(1.5, 'kick', 95),
          drum(2, 'kick', 115),
          drum(2.75, 'snare', 105),
          drum(3, 'snare', 100),
          drum(3.5, 'kick', 95),
          // Hi-hat pattern
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4 === 0 ? 15 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['latin', 'reggaeton', 'urban', 'dembow', 'trap', 'perreo'],
  icon: '🔥',
};

/**
 * House style
 */
export const HOUSE_STYLE: ArrangerStyle = {
  id: 'house',
  name: 'House',
  category: 'electronic',
  subcategory: 'house',
  description: '4-on-the-floor house with offbeat hi-hats and deep bass',
  tempoRange: { min: 118, max: 130 },
  defaultTempo: 124,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Deep House Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'House Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('pad', 'pad', 'House Pad', { volume: 0.6, pan: 0, channel: 2 }),
    voice('synth', 'synth', 'House Stab', { volume: 0.5, pan: 0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 110, { octaveOffset: -1 }),
            step(1, 'root', 0.25, 90, { octaveOffset: -1 }),
            step(2, 'root', 0.5, 105, { octaveOffset: -1 }),
            step(3, 'fifth', 0.25, 85, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'pad',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 8, 60),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // 4-on-the-floor kick
          drum(0, 'kick', 120),
          drum(1, 'kick', 115),
          drum(2, 'kick', 120),
          drum(3, 'kick', 115),
          // Offbeat hi-hats
          drum(0.5, 'hihat-open', 80),
          drum(1.5, 'hihat-open', 75),
          drum(2.5, 'hihat-open', 80),
          drum(3.5, 'hihat-open', 75),
          // Clap on 2 and 4
          drum(1, 'clap', 100),
          drum(3, 'clap', 100),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['house', 'electronic', 'dance', 'edm', '4otf'],
  icon: '🎛️',
};

/**
 * Deep House - Soulful house with chords and warm basslines
 */
export const DEEP_HOUSE_STYLE: ArrangerStyle = {
  id: 'deep-house',
  name: 'Deep House',
  category: 'electronic',
  subcategory: 'house',
  description: 'Soulful deep house with jazzy chords, warm bass, and smooth grooves',
  tempoRange: { min: 118, max: 125 },
  defaultTempo: 122,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Deep Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Deep House Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('chords', 'pad', 'Electric Piano', { volume: 0.65, pan: 0, channel: 2 }),
    voice('pad', 'pad', 'Warm Pad', { volume: 0.5, pan: 0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Smooth Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 105, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.5, 90, { octaveOffset: -1 }),
            step(2, 'root', 0.75, 100, { octaveOffset: -1 }),
            step(3.5, 'third', 0.5, 85, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.03,
        },
        {
          voiceId: 'chords',
          lengthBeats: 4,
          steps: [
            step(0.5, 'root', 0.25, 70),
            step(2, 'root', 0.25, 75),
            step(3.5, 'root', 0.25, 68),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Softer 4-on-the-floor
          drum(0, 'kick', 110),
          drum(1, 'kick', 105),
          drum(2, 'kick', 110),
          drum(3, 'kick', 105),
          // Smooth hi-hats
          drum(0.5, 'hihat-closed', 65),
          drum(1, 'hihat-closed', 60),
          drum(1.5, 'hihat-open', 70),
          drum(2, 'hihat-closed', 65),
          drum(2.5, 'hihat-closed', 60),
          drum(3, 'hihat-closed', 65),
          drum(3.5, 'hihat-open', 68),
          // Soft clap
          drum(1, 'clap', 85),
          drum(3, 'clap', 85),
        ],
        swing: 0.03,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['deep-house', 'electronic', 'soulful', 'smooth', 'jazzy'],
  icon: '🎹',
};

/**
 * Tech House - Minimal techno-house hybrid with driving rhythm
 */
export const TECH_HOUSE_STYLE: ArrangerStyle = {
  id: 'tech-house',
  name: 'Tech House',
  category: 'electronic',
  subcategory: 'house',
  description: 'Minimal tech house with driving grooves, crisp percussion, and tight basslines',
  tempoRange: { min: 124, max: 130 },
  defaultTempo: 127,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Tech Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Tech Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('perc', 'percussion', 'Percussion', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('stab', 'synth', 'Minimal Stab', { volume: 0.5, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Minimal Groove',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.125, 110, { octaveOffset: -1 }),
            step(0.25, 'root', 0.125, 90, { octaveOffset: -1 }),
            step(0.75, 'root', 0.125, 95, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.125, 85, { octaveOffset: -1 }),
            step(2, 'root', 0.125, 105, { octaveOffset: -1 }),
            step(2.25, 'root', 0.125, 90, { octaveOffset: -1 }),
            step(2.75, 'third', 0.125, 95, { octaveOffset: -1 }),
            step(3.5, 'root', 0.125, 85, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.01,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Tight 4-on-the-floor
          drum(0, 'kick', 120),
          drum(1, 'kick', 118),
          drum(2, 'kick', 120),
          drum(3, 'kick', 118),
          // Closed hi-hats (16ths)
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4 === 0 ? 20 : i % 2 === 0 ? 10 : 0))),
          // Clap/rim
          drum(1, 'rim', 95),
          drum(3, 'rim', 95),
          // Percussion accents
          drum(0.75, 'shaker', 70),
          drum(1.75, 'conga-high', 75),
          drum(2.75, 'shaker', 70),
          drum(3.75, 'conga-high', 75),
        ],
        swing: 0.01,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['tech-house', 'electronic', 'minimal', 'driving', 'techno'],
  icon: '⚡',
};

/**
 * Progressive House - Long builds, atmospheric breakdowns
 */
export const PROGRESSIVE_HOUSE_STYLE: ArrangerStyle = {
  id: 'progressive-house',
  name: 'Progressive House',
  category: 'electronic',
  subcategory: 'house',
  description: 'Progressive house with building energy, sweeping synths, and dramatic drops',
  tempoRange: { min: 125, max: 130 },
  defaultTempo: 128,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Progressive Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Progressive Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('lead', 'synth', 'Pluck Lead', { volume: 0.75, pan: 0, channel: 2 }),
    voice('pad', 'pad', 'Sweep Pad', { volume: 0.6, pan: 0, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Build',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 110, { octaveOffset: -1 }),
            step(1, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.25, 90, { octaveOffset: -1 }),
            step(2, 'root', 0.5, 105, { octaveOffset: -1 }),
            step(3, 'third', 0.5, 95, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'lead',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 0.5, 85),
            step(1, 'third', 0.5, 80),
            step(2, 'fifth', 0.5, 85),
            step(3, 'root', 0.5, 80),
            step(4, 'third', 0.5, 90),
            step(5, 'fifth', 0.5, 85),
            step(6, 'seventh', 0.5, 88),
            step(7, 'fifth', 0.5, 82),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Powerful 4-on-the-floor
          drum(0, 'kick', 125),
          drum(1, 'kick', 120),
          drum(2, 'kick', 125),
          drum(3, 'kick', 120),
          // Open hi-hats on offbeats
          drum(0.5, 'hihat-open', 85),
          drum(1.5, 'hihat-open', 80),
          drum(2.5, 'hihat-open', 85),
          drum(3.5, 'hihat-open', 80),
          // Clap/snare
          drum(1, 'clap', 110),
          drum(3, 'clap', 110),
          // Ride for energy
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'ride', 60 + (i % 2 === 0 ? 10 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['progressive-house', 'electronic', 'building', 'euphoric', 'melodic'],
  icon: '🌅',
};

/**
 * Electro Pop - Synth-pop with electronic drums and catchy hooks
 */
export const ELECTRO_POP_STYLE: ArrangerStyle = {
  id: 'electro-pop',
  name: 'Electro Pop',
  category: 'electronic',
  subcategory: 'pop',
  description: 'Synth-pop with bright electronic drums, catchy basslines, and pop hooks',
  tempoRange: { min: 115, max: 130 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Synth Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Electronic Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Bright Synth', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('pad', 'pad', 'Synth Pad', { volume: 0.55, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Pop Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 100),
            step(0.75, 'fifth', 0.25, 85),
            step(1.5, 'root', 0.25, 90),
            step(2, 'root', 0.5, 95),
            step(2.75, 'third', 0.25, 80),
            step(3.5, 'fifth', 0.25, 85),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.02,
        },
        {
          voiceId: 'synth',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 80),
            step(0.5, 'third', 0.25, 75),
            step(1, 'fifth', 0.25, 80),
            step(2, 'root', 0.25, 85),
            step(2.5, 'third', 0.25, 78),
            step(3, 'fifth', 0.25, 82),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Electronic kick
          drum(0, 'kick-electronic', 110),
          drum(2, 'kick-electronic', 105),
          // Clap/snare
          drum(1, 'clap', 95),
          drum(3, 'clap', 95),
          // Hi-hats (16ths)
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          // Shaker
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'shaker', 50 + (i % 2 === 0 ? 10 : 0))),
        ],
        swing: 0.02,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electro-pop', 'electronic', 'synth-pop', 'catchy', 'bright'],
  icon: '✨',
};

/**
 * Synthwave - 80s retro electronic with analog synths and gated reverb
 */
export const SYNTHWAVE_STYLE: ArrangerStyle = {
  id: 'synthwave',
  name: 'Synthwave',
  category: 'electronic',
  subcategory: 'retro',
  description: '80s retro electronic with warm analog synths, gated drums, and nostalgic atmosphere',
  tempoRange: { min: 105, max: 130 },
  defaultTempo: 116,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Analog Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Gated Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('lead', 'synth', 'Retro Lead', { volume: 0.7, pan: 0.15, channel: 2 }),
    voice('pad', 'pad', 'Warm Pad', { volume: 0.6, pan: -0.1, channel: 3 }),
    voice('arp', 'synth', 'Arp Synth', { volume: 0.55, pan: 0.25, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Retro Drive',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 105),
            step(1, 'root', 0.5, 100),
            step(2, 'fifth', 0.5, 95),
            step(3, 'third', 0.5, 100),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'arp',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.25, 75),
            step(0.25, 'third', 0.25, 70),
            step(0.5, 'fifth', 0.25, 75),
            step(0.75, 'root', 0.25, 70, { octaveOffset: 1 }),
            step(1, 'fifth', 0.25, 75),
            step(1.25, 'third', 0.25, 70),
            step(1.5, 'root', 0.25, 75),
            step(1.75, 'fifth', 0.25, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Gated kick
          drum(0, 'kick-electronic', 115),
          drum(1, 'kick-electronic', 110),
          drum(2, 'kick-electronic', 115),
          drum(3, 'kick-electronic', 110),
          // Gated snare
          drum(1, 'snare-gated', 100),
          drum(3, 'snare-gated', 100),
          // Hi-hats (16ths with accents)
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 20 : 0))),
          // Synth toms
          drum(2.5, 'tom-synth-mid', 80),
          drum(3.75, 'tom-synth-low', 75),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['synthwave', 'electronic', '80s', 'retro', 'nostalgic', 'analog'],
  icon: '🌆',
};

/**
 * Future Bass - Modern EDM with sidechain chords, wonky basses, and vocal chops
 */
export const FUTURE_BASS_STYLE: ArrangerStyle = {
  id: 'future-bass',
  name: 'Future Bass',
  category: 'electronic',
  subcategory: 'bass',
  description: 'Modern EDM with sidechain chords, detuned supersaws, and energetic drops',
  tempoRange: { min: 135, max: 175 },
  defaultTempo: 150,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Wobble Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Trap Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('chords', 'synth', 'Supersaw', { volume: 0.75, pan: 0, channel: 2 }),
    voice('pluck', 'synth', 'Pluck Lead', { volume: 0.7, pan: 0.2, channel: 3 }),
    voice('pad', 'pad', 'Vocal Chops', { volume: 0.6, pan: -0.15, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Future Drop',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 115),
            step(0.5, 'root', 0.125, 100),
            step(1, 'fifth', 0.25, 110),
            step(2, 'root', 0.5, 115),
            step(3, 'third', 0.25, 105),
            step(3.5, 'fifth', 0.25, 100),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.04,
        },
        {
          voiceId: 'chords',
          lengthBeats: 4,
          steps: [
            // Sidechain rhythm - chords on offbeats
            step(0.25, 'root', 0.25, 85),
            step(0.75, 'third', 0.25, 80),
            step(1.25, 'fifth', 0.25, 85),
            step(1.75, 'root', 0.25, 80, { octaveOffset: 1 }),
            step(2.25, 'root', 0.25, 85),
            step(2.75, 'third', 0.25, 80),
            step(3.25, 'fifth', 0.25, 85),
            step(3.75, 'root', 0.25, 80, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Heavy kick
          drum(0, 'kick-808', 120),
          drum(2, 'kick-808', 118),
          // Layered snare
          drum(1, 'snare-clap', 105),
          drum(3, 'snare-clap', 105),
          // Trap hi-hats (fast rolls)
          ...Array.from({ length: 16 }, (_, i) => {
            const vel = i % 4 === 0 ? 75 : i % 2 === 0 ? 60 : 45;
            return drum(i * 0.25, 'hihat-closed', vel);
          }),
          // Hi-hat rolls
          drum(2.75, 'hihat-closed', 70),
          drum(2.875, 'hihat-closed', 75),
          drum(3.875, 'hihat-open', 65),
          // Rim clicks
          drum(0.5, 'rim', 55),
          drum(1.5, 'rim', 55),
        ],
        swing: 0.03,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['future-bass', 'electronic', 'edm', 'bass', 'modern', 'energetic'],
  icon: '🔮',
};

/**
 * Modern R&B - Contemporary R&B with trap influences and smooth vocals
 */
export const MODERN_RNB_STYLE: ArrangerStyle = {
  id: 'modern-rnb',
  name: 'Modern R&B',
  category: 'rnb',
  subcategory: 'contemporary',
  description: 'Contemporary R&B with trap-influenced drums, 808 bass, and smooth chord progressions',
  tempoRange: { min: 65, max: 95 },
  defaultTempo: 78,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', '808 Sub', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Trap Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('keys', 'keys', 'Rhodes', { volume: 0.7, pan: 0.1, channel: 2 }),
    voice('synth', 'synth', 'Warm Synth', { volume: 0.65, pan: -0.1, channel: 3 }),
    voice('pad', 'pad', 'Vocal Pad', { volume: 0.5, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Smooth Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 105),
            step(1, 'root', 0.5, 95),
            step(2, 'fifth', 0.75, 100),
            step(3.25, 'third', 0.5, 90),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.03,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 75),
            step(0.5, 'third', 0.5, 70),
            step(1.5, 'fifth', 0.75, 72),
            step(2.5, 'root', 0.5, 75, { octaveOffset: 1 }),
            step(3.25, 'third', 0.5, 70),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // 808 kick
          drum(0, 'kick-808', 115),
          drum(2, 'kick-808', 110),
          drum(3.5, 'kick-808', 100),
          // Snare/clap
          drum(1, 'snare-clap', 95),
          drum(3, 'snare-clap', 95),
          // Trap hi-hats
          ...Array.from({ length: 8 }, (_, i) => {
            const pos = i * 0.5;
            const vel = i % 2 === 0 ? 65 : 50;
            return drum(pos, 'hihat-closed', vel);
          }),
          // Hi-hat rolls
          drum(1.75, 'hihat-closed', 60),
          drum(1.875, 'hihat-closed', 65),
          drum(3.75, 'hihat-closed', 60),
          drum(3.875, 'hihat-open', 70),
          // Rim
          drum(2.5, 'rim', 50),
        ],
        swing: 0.08,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['modern-rnb', 'rnb', 'contemporary', 'trap', 'smooth', '808'],
  icon: '💫',
};

/**
 * Slow Jam - Romantic R&B ballad with lush chords and sensual groove
 */
export const SLOW_JAM_STYLE: ArrangerStyle = {
  id: 'slow-jam',
  name: 'Slow Jam',
  category: 'rnb',
  subcategory: 'ballad',
  description: 'Romantic R&B ballad with lush chord voicings and sensual groove',
  tempoRange: { min: 55, max: 75 },
  defaultTempo: 63,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Finger Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Soft Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('keys', 'keys', 'Rhodes', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('strings', 'pad', 'Strings', { volume: 0.7, pan: -0.15, channel: 3 }),
    voice('pad', 'pad', 'Vocal Pad', { volume: 0.6, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Sensual',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 90),
            step(1.5, 'fifth', 0.75, 85),
            step(2.5, 'root', 1, 88),
            step(3.75, 'third', 0.5, 80),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.04,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 70),
            step(1, 'third', 1, 68),
            step(2, 'fifth', 1.5, 72),
            step(3, 'root', 0.75, 70, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Soft kick
          drum(0, 'kick-acoustic', 85),
          drum(2, 'kick-acoustic', 80),
          // Snare
          drum(1, 'snare-brush', 75),
          drum(3, 'snare-brush', 75),
          // Hi-hats
          ...Array.from({ length: 16 }, (_, i) => {
            const vel = i % 4 === 0 ? 60 : i % 2 === 0 ? 50 : 40;
            return drum(i * 0.25, 'hihat-closed', vel);
          }),
          // Ride bell
          drum(1.5, 'ride-bell', 55),
          drum(3.5, 'ride-bell', 55),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['slow-jam', 'rnb', 'ballad', 'romantic', 'sensual', 'smooth'],
  icon: '🌹',
};

/**
 * Gospel Ballad - Emotional gospel with building dynamics and choir voicings
 */
export const GOSPEL_BALLAD_STYLE: ArrangerStyle = {
  id: 'gospel-ballad',
  name: 'Gospel Ballad',
  category: 'gospel',
  subcategory: 'ballad',
  description: 'Emotional gospel ballad with rich harmonies, building dynamics, and powerful crescendos',
  tempoRange: { min: 60, max: 80 },
  defaultTempo: 68,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Gospel Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('organ', 'keys', 'Hammond B3', { volume: 0.8, pan: 0.1, channel: 2 }),
    voice('piano', 'keys', 'Grand Piano', { volume: 0.7, pan: -0.1, channel: 3 }),
    voice('choir', 'pad', 'Choir Pad', { volume: 0.7, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Powerful',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 95),
            step(1, 'fifth', 0.75, 90),
            step(2, 'root', 1, 95),
            step(3, 'third', 0.75, 90),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.04,
        },
        {
          voiceId: 'organ',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 80),
            step(0.25, 'third', 2, 78),
            step(0.5, 'fifth', 2, 82),
            step(2, 'root', 2, 85, { octaveOffset: 1 }),
            step(2.25, 'third', 2, 83),
            step(2.5, 'fifth', 2, 87),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Kick
          drum(0, 'kick-acoustic', 90),
          drum(2, 'kick-acoustic', 85),
          // Snare
          drum(1, 'snare-acoustic', 85),
          drum(3, 'snare-acoustic', 85),
          // Hi-hats
          ...Array.from({ length: 8 }, (_, i) => {
            const vel = i % 2 === 0 ? 60 : 50;
            return drum(i * 0.5, 'hihat-closed', vel);
          }),
          // Ride
          drum(0, 'ride', 55),
          drum(2, 'ride', 55),
          // Crash
          drum(0, 'crash', 70),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['gospel', 'ballad', 'emotional', 'powerful', 'choir', 'uplifting'],
  icon: '🙏',
};

/**
 * Soul Ballad - Classic soul slow jam with emotional delivery
 */
export const SOUL_BALLAD_STYLE: ArrangerStyle = {
  id: 'soul-ballad',
  name: 'Soul Ballad',
  category: 'soul',
  subcategory: 'ballad',
  description: 'Classic soul ballad with emotional delivery, warm Rhodes, and heartfelt strings',
  tempoRange: { min: 55, max: 75 },
  defaultTempo: 65,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Finger Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Vintage Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('rhodes', 'keys', 'Rhodes', { volume: 0.8, pan: 0.1, channel: 2 }),
    voice('strings', 'pad', 'Strings', { volume: 0.75, pan: -0.1, channel: 3 }),
    voice('pad', 'pad', 'Vocal Pad', { volume: 0.6, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Heartfelt',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 90),
            step(1, 'fifth', 0.75, 85),
            step(2, 'root', 1, 90),
            step(3, 'third', 0.75, 85),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.05,
        },
        {
          voiceId: 'rhodes',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 75),
            step(0.5, 'third', 1.5, 72),
            step(1.5, 'fifth', 1, 78),
            step(2.5, 'root', 1.5, 75, { octaveOffset: 1 }),
            step(3.5, 'third', 0.75, 72),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.07,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Kick
          drum(0, 'kick-vintage', 85),
          drum(2, 'kick-vintage', 80),
          // Snare
          drum(1, 'snare-vintage', 80),
          drum(3, 'snare-vintage', 80),
          // Hi-hats
          ...Array.from({ length: 16 }, (_, i) => {
            const vel = i % 4 === 0 ? 65 : i % 2 === 0 ? 55 : 45;
            return drum(i * 0.25, 'hihat-closed', vel);
          }),
          // Ride
          drum(2.5, 'ride', 50),
        ],
        swing: 0.08,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['soul', 'ballad', 'classic', 'emotional', 'heartfelt', 'rhodes'],
  icon: '💝',
};

/**
 * P-Funk - Parliament-style deep funk with heavy groove and synth bass
 */
export const PFUNK_STYLE: ArrangerStyle = {
  id: 'pfunk',
  name: 'P-Funk',
  category: 'funk',
  subcategory: 'parliament',
  description: 'Parliament-style deep funk with heavy synth bass, clav, and cosmic atmosphere',
  tempoRange: { min: 95, max: 115 },
  defaultTempo: 103,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Moog Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Funk Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('clav', 'guitar', 'Clavinet', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('synth', 'synth', 'Funky Synth', { volume: 0.7, pan: -0.15, channel: 3 }),
    voice('pad', 'pad', 'Space Pad', { volume: 0.6, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Deep Groove',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.125, 115),
            step(0.25, 'root', 0.125, 95),
            step(0.5, 'fifth', 0.125, 105),
            step(1, 'root', 0.125, 110),
            step(1.25, 'root', 0.125, 90),
            step(1.75, 'third', 0.125, 100),
            step(2, 'root', 0.125, 115),
            step(2.5, 'fifth', 0.125, 105),
            step(3, 'root', 0.125, 110),
            step(3.5, 'third', 0.125, 100),
            step(3.75, 'fifth', 0.125, 95),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.06,
        },
        {
          voiceId: 'clav',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.125, 85),
            step(0.5, 'third', 0.125, 80),
            step(1, 'fifth', 0.125, 85),
            step(1.5, 'root', 0.125, 80, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Heavy kick
          drum(0, 'kick-deep', 120),
          drum(2, 'kick-deep', 115),
          drum(3.5, 'kick-deep', 105),
          // Snare
          drum(1, 'snare-funk', 105),
          drum(3, 'snare-funk', 105),
          // Hi-hats (16ths)
          ...Array.from({ length: 16 }, (_, i) => {
            const vel = i % 4 === 0 ? 75 : i % 2 === 0 ? 65 : 55;
            return drum(i * 0.25, 'hihat-closed', vel);
          }),
          // Open hi-hat
          drum(1.75, 'hihat-open', 70),
          drum(3.75, 'hihat-open', 65),
          // Ghost notes
          drum(0.5, 'snare-ghost', 40),
          drum(1.5, 'snare-ghost', 45),
          drum(2.5, 'snare-ghost', 40),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pfunk', 'funk', 'parliament', 'groove', 'deep', 'synth-bass'],
  icon: '🛸',
};

/**
 * Synth Funk - 80s electronic funk with vocoders and synth basslines
 */
export const SYNTH_FUNK_STYLE: ArrangerStyle = {
  id: 'synth-funk',
  name: 'Synth Funk',
  category: 'funk',
  subcategory: '80s',
  description: '80s electronic funk with synth basslines, vocoder stabs, and funky rhythms',
  tempoRange: { min: 105, max: 125 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Synth Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Electronic Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('stab', 'synth', 'Vocoder Stab', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('synth', 'synth', 'Lead Synth', { volume: 0.7, pan: -0.15, channel: 3 }),
    voice('pad', 'pad', 'Synth Pad', { volume: 0.55, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Funky Synth',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 110),
            step(0.5, 'root', 0.125, 95),
            step(0.75, 'fifth', 0.125, 100),
            step(1, 'root', 0.25, 105),
            step(1.75, 'third', 0.125, 95),
            step(2, 'root', 0.25, 110),
            step(2.5, 'fifth', 0.25, 100),
            step(3, 'root', 0.25, 105),
            step(3.75, 'third', 0.125, 95),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.04,
        },
        {
          voiceId: 'stab',
          lengthBeats: 4,
          steps: [
            step(0.75, 'root', 0.125, 90),
            step(1.75, 'third', 0.125, 85),
            step(2.5, 'fifth', 0.125, 90),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Electronic kick
          drum(0, 'kick-electronic', 115),
          drum(2, 'kick-electronic', 110),
          drum(3.5, 'kick-electronic', 100),
          // Clap
          drum(1, 'clap', 100),
          drum(3, 'clap', 100),
          // Hi-hats
          ...Array.from({ length: 16 }, (_, i) => {
            const vel = i % 4 === 0 ? 70 : i % 2 === 0 ? 60 : 50;
            return drum(i * 0.25, 'hihat-closed', vel);
          }),
          // Open hi-hat
          drum(1.75, 'hihat-open', 65),
          // Cowbell
          drum(2, 'cowbell', 75),
          // Tom fills
          drum(3.75, 'tom-synth-mid', 80),
        ],
        swing: 0.03,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['synth-funk', 'funk', '80s', 'electronic', 'vocoder', 'synth'],
  icon: '🎛️',
};

/**
 * Country Rock - Driving country rock with electric guitars and strong backbeat
 */
export const COUNTRY_ROCK_STYLE: ArrangerStyle = {
  id: 'country-rock',
  name: 'Country Rock',
  category: 'country',
  subcategory: 'rock',
  description: 'Driving country rock with electric guitars, strong backbeat, and Southern energy',
  tempoRange: { min: 115, max: 145 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Electric Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Rock Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Electric Guitar', { volume: 0.8, pan: 0.2, channel: 2 }),
    voice('organ', 'keys', 'Hammond B3', { volume: 0.65, pan: -0.2, channel: 3 }),
    voice('strings', 'pad', 'String Section', { volume: 0.5, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Driving',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 105),
            step(0.5, 'root', 0.25, 95),
            step(1, 'fifth', 0.5, 100),
            step(2, 'root', 0.5, 105),
            step(2.5, 'third', 0.25, 95),
            step(3, 'fifth', 0.5, 100),
            step(3.5, 'root', 0.25, 95),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.05,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.5, 85),
            step(0.5, 'third', 0.5, 80),
            step(1, 'fifth', 0.5, 85),
            step(1.5, 'root', 0.5, 80, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Kick
          drum(0, 'kick-rock', 110),
          drum(2, 'kick-rock', 110),
          drum(3.5, 'kick-rock', 100),
          // Snare (strong backbeat)
          drum(1, 'snare-rock', 110),
          drum(3, 'snare-rock', 110),
          // Hi-hats
          ...Array.from({ length: 8 }, (_, i) => {
            const vel = i % 2 === 0 ? 75 : 65;
            return drum(i * 0.5, 'hihat-closed', vel);
          }),
          // Ride
          drum(0, 'ride', 60),
          drum(2, 'ride', 60),
          // Crash
          drum(0, 'crash', 85),
        ],
        swing: 0.02,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country-rock', 'country', 'rock', 'driving', 'electric', 'southern'],
  icon: '🤘',
};

// ----------------------------------------------------------------------------
// Additional Style Presets
// ----------------------------------------------------------------------------

/**
 * Pop 16-Beat - Funky 16th feel with syncopated bass
 */
export const POP_16BEAT_STYLE: ArrangerStyle = {
  id: 'pop-16beat',
  name: 'Pop 16 Beat',
  category: 'pop',
  subcategory: 'pop-funk',
  description: 'Funky 16th feel with syncopated bass and clavinet',
  tempoRange: { min: 95, max: 125 },
  defaultTempo: 108,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Slap Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Tight Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('clav', 'guitar', 'Clavinet', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('synth', 'synth', 'Synth Brass', { volume: 0.6, pan: -0.2, channel: 3 }),
    voice('pad', 'pad', 'String Pad', { volume: 0.4, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 100),
            step(0.75, 'root', 0.25, 70),
            step(1.5, 'fifth', 0.25, 85),
            step(2, 'root', 0.25, 95),
            step(2.5, 'third', 0.25, 80),
            step(3, 'fifth', 0.25, 90),
            step(3.75, 'root', 0.25, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'clav',
          lengthBeats: 2,
          steps: [
            step(0.5, 'root', 0.125, 70),
            step(1, 'third', 0.125, 75),
            step(1.5, 'fifth', 0.125, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 110),
          drum(0.75, 'kick', 80),
          drum(1, 'snare', 100),
          drum(2, 'kick', 105),
          drum(2.5, 'kick', 75),
          drum(3, 'snare', 100),
          // 16th hi-hats
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4 === 0 ? 20 : i % 2 === 0 ? 10 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop', '16beat', 'funky', 'syncopated'],
  icon: '🎵',
};

/**
 * Pop Ballad - Slow emotional with arpeggiated piano
 */
export const POP_BALLAD_STYLE: ArrangerStyle = {
  id: 'pop-ballad',
  name: 'Pop Ballad',
  category: 'pop',
  subcategory: 'ballad',
  description: 'Slow emotional ballad with arpeggiated piano and strings',
  tempoRange: { min: 60, max: 85 },
  defaultTempo: 72,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Soft Bass', { volume: 0.7, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Brush Kit', { volume: 0.5, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Grand Piano', { volume: 0.85, pan: 0, channel: 2 }),
    voice('strings', 'strings', 'String Orchestra', { volume: 0.7, pan: 0, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Verse',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 70),
            step(2, 'fifth', 2, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.1,
        },
        {
          voiceId: 'piano',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 60),
            step(0.5, 'third', 0.5, 55),
            step(1, 'fifth', 0.5, 60),
            step(1.5, 'root', 0.5, 55),
            step(2, 'third', 0.5, 60),
            step(2.5, 'fifth', 0.5, 55),
            step(3, 'root', 0.5, 58),
            step(3.5, 'third', 0.5, 55),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'strings',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 8, 45),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 70),
          drum(2, 'kick', 65),
          drum(1, 'snare', 50),
          drum(3, 'snare', 55),
          // Light brush hi-hat
          drum(0, 'hihat-closed', 40),
          drum(1, 'hihat-closed', 35),
          drum(2, 'hihat-closed', 40),
          drum(3, 'hihat-closed', 35),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop', 'ballad', 'slow', 'emotional', 'piano'],
  icon: '💕',
};

/**
 * Funk - Syncopated, groovy
 */
export const FUNK_STYLE: ArrangerStyle = {
  id: 'funk',
  name: 'Funk',
  category: 'rnb',
  subcategory: 'funk',
  description: 'Classic funk with syncopated bass and chicken scratch guitar',
  tempoRange: { min: 95, max: 120 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Funk Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Funk Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Funk Guitar', { volume: 0.7, pan: -0.2, channel: 2 }),
    voice('clav', 'guitar', 'Clavinet', { volume: 0.65, pan: 0.2, channel: 3 }),
    voice('brass', 'brass', 'Horn Section', { volume: 0.6, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Groove',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 110),
            step(0.75, 'root', 0.125, 70),
            step(1, 'third', 0.25, 90),
            step(1.5, 'fifth', 0.25, 85),
            step(2, 'root', 0.25, 105),
            step(2.75, 'fifth', 0.125, 75),
            step(3, 'third', 0.25, 95),
            step(3.5, 'root', 0.25, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            step(0.5, 'root', 0.0625, 80),
            step(1, 'root', 0.0625, 85),
            step(1.5, 'root', 0.0625, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 110),
          drum(0.75, 'kick', 80),
          drum(1.5, 'kick', 90),
          drum(2.5, 'kick', 85),
          drum(3.25, 'kick', 75),
          drum(1, 'snare', 100),
          drum(3, 'snare', 105),
          // Ghost notes
          drum(0.5, 'snare', 40),
          drum(2, 'snare', 35),
          drum(3.5, 'snare', 40),
          // 16th hats
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 50 + (i % 4 === 0 ? 25 : i % 2 === 0 ? 15 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['funk', 'rnb', 'syncopated', 'groovy', 'slap'],
  icon: '🕺',
};

/**
 * Reggae - One drop with offbeat skank
 */
export const REGGAE_STYLE: ArrangerStyle = {
  id: 'reggae',
  name: 'Reggae One Drop',
  category: 'world',
  subcategory: 'reggae',
  description: 'Classic reggae one-drop with offbeat guitar and organ bubble',
  tempoRange: { min: 70, max: 95 },
  defaultTempo: 80,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Reggae Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Reggae Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Skank Guitar', { volume: 0.7, pan: 0.3, channel: 2 }),
    voice('organ', 'organ', 'Bubble Organ', { volume: 0.6, pan: -0.2, channel: 3 }),
    voice('keys', 'piano', 'Melodica', { volume: 0.5, pan: 0.1, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'One Drop',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 95),
            step(2, 'fifth', 0.5, 80),
            step(2.5, 'root', 0.5, 85),
            step(3, 'third', 0.5, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.1,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            step(0.5, 'root', 0.25, 70),
            step(1.5, 'root', 0.25, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'organ',
          lengthBeats: 2,
          steps: [
            step(0.5, 'root', 0.125, 55),
            step(1, 'root', 0.125, 50),
            step(1.5, 'root', 0.125, 55),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // One drop - kick and snare on 3
          drum(2, 'kick', 100),
          drum(2, 'snare', 90),
          // Rim click
          drum(2, 'rim', 80),
          // Hi-hat on offbeats
          drum(0.5, 'hihat-closed', 75),
          drum(1.5, 'hihat-closed', 75),
          drum(2.5, 'hihat-closed', 75),
          drum(3.5, 'hihat-closed', 75),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['reggae', 'world', 'one-drop', 'jamaica', 'dub'],
  icon: '🇯🇲',
};

/**
 * Dub - Heavy bass and delay-drenched reggae
 */
export const DUB_STYLE: ArrangerStyle = {
  id: 'dub',
  name: 'Dub',
  category: 'world',
  subcategory: 'reggae',
  description: 'Dub reggae with heavy bass, echo, and minimal sparse arrangement',
  tempoRange: { min: 60, max: 80 },
  defaultTempo: 70,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Dub Bass', { volume: 1.0, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Dub Kit', { volume: 0.7, pan: 0, channel: 10 }),
    voice('keys', 'organ', 'Echo Keys', { volume: 0.5, pan: 0.2, channel: 2 }),
    voice('percussion', 'percussion', 'Shaker', { volume: 0.4, pan: -0.3, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Deep',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2.0, 100, { octaveOffset: -1 }),
            step(2.5, 'fifth', 0.5, 85, { octaveOffset: -1 }),
            step(3, 'root', 0.75, 90, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'keys',
          lengthBeats: 8,
          steps: [
            step(1, 'root', 0.5, 50),
            step(5, 'fifth', 0.5, 48),
          ],
          loop: true,
          swing: 0,
          humanize: 0.1,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Minimal one-drop
          drum(2, 'kick', 95),
          drum(2, 'snare', 85),
          // Sparse hi-hat
          drum(0.5, 'hihat-open', 65),
          drum(2.5, 'hihat-closed', 60),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['dub', 'world', 'reggae', 'jamaica', 'delay', 'bass-heavy'],
  icon: '🔊',
};

/**
 * Dancehall - Riddim-based modern reggae
 */
export const DANCEHALL_STYLE: ArrangerStyle = {
  id: 'dancehall',
  name: 'Dancehall',
  category: 'world',
  subcategory: 'reggae',
  description: 'Modern dancehall with digital riddim and syncopated patterns',
  tempoRange: { min: 85, max: 105 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Dancehall Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Dancehall Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Riddim Synth', { volume: 0.7, pan: -0.15, channel: 2 }),
    voice('keys', 'piano', 'Stab Keys', { volume: 0.65, pan: 0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Riddim',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 100, { octaveOffset: -1 }),
            step(1, 'fifth', 0.25, 85, { octaveOffset: -1 }),
            step(1.5, 'root', 0.5, 90, { octaveOffset: -1 }),
            step(2, 'third', 0.25, 80, { octaveOffset: -1 }),
            step(2.5, 'root', 0.5, 95, { octaveOffset: -1 }),
            step(3.5, 'fifth', 0.25, 82, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'synth',
          lengthBeats: 4,
          steps: [
            step(0.5, 'root', 0.25, 70, { octaveOffset: 1 }),
            step(2, 'third', 0.25, 68, { octaveOffset: 1 }),
            step(2.5, 'fifth', 0.25, 72, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'keys',
          lengthBeats: 8,
          steps: [
            step(3, 'root', 0.125, 75),
            step(7, 'third', 0.125, 73),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Dancehall kick pattern
          drum(0, 'kick', 100),
          drum(1, 'kick', 90),
          drum(2, 'snare', 95),
          drum(2.5, 'kick', 85),
          drum(3, 'kick', 92),
          drum(3.75, 'kick', 80),
          // Hi-hat with syncopation
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          // Snare hits
          drum(0.75, 'snare', 70),
          drum(1.75, 'snare', 72),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['dancehall', 'world', 'reggae', 'riddim', 'jamaica', 'digital'],
  icon: '🎤',
};

/**
 * Ska - Upstroke guitar and walking bass
 */
export const SKA_STYLE: ArrangerStyle = {
  id: 'ska',
  name: 'Ska',
  category: 'world',
  subcategory: 'reggae',
  description: 'Uptempo ska with upstroke guitar, walking bass, and brass',
  tempoRange: { min: 140, max: 170 },
  defaultTempo: 155,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Walking Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Ska Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Ska Guitar', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('brass', 'brass', 'Brass Section', { volume: 0.75, pan: -0.1, channel: 3 }),
    voice('organ', 'organ', 'Hammond', { volume: 0.6, pan: -0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Uptempo',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 95),
            step(0.5, 'second', 0.5, 85),
            step(1, 'third', 0.5, 90),
            step(1.5, 'fourth', 0.5, 87),
            step(2, 'fifth', 0.5, 92),
            step(2.5, 'sixth', 0.5, 88),
            step(3, 'seventh', 0.5, 90),
            step(3.5, 'root', 0.5, 85, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            step(0.5, 'root', 0.125, 75),
            step(1.5, 'root', 0.125, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
        {
          voiceId: 'brass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 80, { octaveOffset: 1 }),
            step(0.5, 'third', 0.25, 78, { octaveOffset: 1 }),
            step(1, 'fifth', 0.25, 82, { octaveOffset: 1 }),
            step(2, 'root', 0.5, 85, { octaveOffset: 1 }),
            step(3, 'third', 0.25, 80, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'organ',
          lengthBeats: 2,
          steps: [
            step(0.5, 'root', 0.125, 65),
            step(1.5, 'root', 0.125, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Four on the floor with accents
          drum(0, 'kick', 100),
          drum(1, 'kick', 95),
          drum(2, 'kick', 100),
          drum(3, 'kick', 95),
          // Backbeat snare
          drum(1, 'snare', 90),
          drum(3, 'snare', 90),
          // Offbeat hi-hat
          drum(0.5, 'hihat-open', 80),
          drum(1.5, 'hihat-open', 80),
          drum(2.5, 'hihat-open', 80),
          drum(3.5, 'hihat-open', 80),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['ska', 'world', 'upbeat', 'jamaica', 'brass', 'two-tone'],
  icon: '🎺',
};

/**
 * Samba - Brazilian carnival with surdo, tamborim, and cuica
 */
export const SAMBA_STYLE: ArrangerStyle = {
  id: 'samba',
  name: 'Samba',
  category: 'latin',
  subcategory: 'brazilian',
  description: 'Brazilian samba with surdo bass drum, tamborim, cuica, and syncopated guitar',
  tempoRange: { min: 150, max: 200 },
  defaultTempo: 170,
  timeSignature: { numerator: 2, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Samba Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Samba Percussion', { volume: 0.8, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Nylon Guitar', { volume: 0.75, pan: -0.2, channel: 2 }),
    voice('cavaquinho', 'guitar', 'Cavaquinho', { volume: 0.7, pan: 0.3, channel: 3 }),
    voice('horn', 'brass', 'Brass Section', { volume: 0.65, pan: 0.1, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Batucada',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            // Syncopated samba bass
            step(0, 'root', 0.25, 100),
            step(0.5, 'fifth', 0.125, 85),
            step(0.75, 'root', 0.125, 80),
            step(1, 'root', 0.25, 95),
            step(1.5, 'third', 0.25, 85),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.03,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            // Samba guitar comping
            step(0, 'root', 0.125, 75),
            step(0.25, 'third', 0.125, 70),
            step(0.5, 'fifth', 0.125, 75),
            step(0.75, 'root', 0.125, 70),
            step(1, 'root', 0.125, 80),
            step(1.25, 'third', 0.125, 75),
            step(1.5, 'fifth', 0.125, 80),
            step(1.75, 'root', 0.125, 70),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.04,
        },
        {
          voiceId: 'cavaquinho',
          lengthBeats: 2,
          steps: [
            // Fast strum pattern
            step(0, 'root', 0.0625, 70),
            step(0.125, 'third', 0.0625, 65),
            step(0.25, 'fifth', 0.0625, 70),
            step(0.5, 'root', 0.0625, 75),
            step(0.625, 'third', 0.0625, 70),
            step(0.75, 'fifth', 0.0625, 72),
            step(1, 'root', 0.0625, 75),
            step(1.125, 'third', 0.0625, 70),
            step(1.25, 'fifth', 0.0625, 73),
            step(1.5, 'root', 0.0625, 78),
            step(1.625, 'third', 0.0625, 72),
            step(1.75, 'fifth', 0.0625, 70),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 2,
        steps: [
          // Surdo (bass drum) - provides low end pulse
          drum(0, 'surdo-low', 100),
          drum(0.5, 'surdo-high', 85),
          drum(1, 'surdo-low', 95),
          drum(1.5, 'surdo-high', 85),
          
          // Tamborim - high pitched 16th note patterns
          drum(0, 'tamborim', 80),
          drum(0.25, 'tamborim', 70),
          drum(0.375, 'tamborim', 75),
          drum(0.5, 'tamborim', 85),
          drum(0.75, 'tamborim', 72),
          drum(0.875, 'tamborim', 78),
          drum(1, 'tamborim', 82),
          drum(1.25, 'tamborim', 73),
          drum(1.375, 'tamborim', 77),
          drum(1.5, 'tamborim', 88),
          drum(1.75, 'tamborim', 75),
          drum(1.875, 'tamborim', 80),
          
          // Agogô - two-tone bell
          drum(0, 'agogo-high', 75),
          drum(0.5, 'agogo-low', 70),
          drum(1, 'agogo-high', 78),
          drum(1.5, 'agogo-low', 72),
          
          // Cuíca - sliding friction drum
          drum(0.75, 'cuica-high', 85),
          drum(1.25, 'cuica-low', 80),
          drum(1.875, 'cuica-high', 82),
          
          // Caixa (snare) - light backbeat
          drum(0.5, 'snare', 75),
          drum(1.5, 'snare', 78),
          
          // Ganzá (shaker) - continuous 16ths
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.25, 'shaker', 55 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
        ],
        swing: 0.04,
      },
    },
    {
      id: 'B',
      name: 'Partido Alto',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            // Partido alto bass variation
            step(0, 'root', 0.25, 95),
            step(0.375, 'fifth', 0.125, 80),
            step(0.75, 'root', 0.25, 90),
            step(1.25, 'third', 0.125, 75),
            step(1.5, 'fifth', 0.25, 85),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.03,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            // More relaxed guitar pattern
            step(0, 'root', 0.25, 70),
            step(0.5, 'third', 0.25, 68),
            step(1, 'fifth', 0.25, 72),
            step(1.5, 'root', 0.25, 70),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 2,
        steps: [
          // Partido alto rhythm (samba variation with more space)
          drum(0, 'surdo-low', 100),
          drum(1, 'surdo-low', 95),
          drum(0.5, 'surdo-high', 80),
          drum(1.5, 'surdo-high', 80),
          
          // Pandeiro pattern
          drum(0, 'pandeiro-bass', 85),
          drum(0.5, 'pandeiro-slap', 75),
          drum(0.75, 'pandeiro-thumb', 70),
          drum(1, 'pandeiro-bass', 88),
          drum(1.25, 'pandeiro-thumb', 72),
          drum(1.5, 'pandeiro-slap', 78),
          drum(1.75, 'pandeiro-thumb', 70),
          
          // Tamborim accents
          drum(0, 'tamborim', 85),
          drum(0.5, 'tamborim', 80),
          drum(1, 'tamborim', 87),
          drum(1.5, 'tamborim', 83),
          
          // Agogô
          drum(0.25, 'agogo-high', 73),
          drum(0.75, 'agogo-low', 68),
          drum(1.25, 'agogo-high', 75),
          drum(1.75, 'agogo-low', 70),
        ],
        swing: 0.06,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['samba', 'latin', 'brazilian', 'carnival', 'batucada', 'partido-alto'],
  icon: '🇧🇷',
};

/**
 * MPB (Música Popular Brasileira) - Contemporary Brazilian pop
 */
export const MPB_STYLE: ArrangerStyle = {
  id: 'mpb',
  name: 'MPB',
  category: 'latin',
  subcategory: 'brazilian',
  description: 'Música Popular Brasileira - sophisticated Brazilian pop with jazz influences',
  tempoRange: { min: 80, max: 110 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Fretless Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Brushes Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Nylon Guitar', { volume: 0.8, pan: -0.2, channel: 2 }),
    voice('piano', 'piano', 'Electric Piano', { volume: 0.7, pan: 0.2, channel: 3 }),
    voice('strings', 'strings', 'String Ensemble', { volume: 0.6, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 90),
            step(0.75, 'fifth', 0.25, 75),
            step(1.5, 'third', 0.25, 80),
            step(2, 'root', 0.5, 85),
            step(2.75, 'seventh', 0.25, 70),
            step(3.5, 'fifth', 0.25, 78),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.04,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.375, 75),
            step(0.5, 'third', 0.125, 70),
            step(1, 'fifth', 0.375, 73),
            step(1.5, 'seventh', 0.125, 68),
            step(2, 'root', 0.375, 75),
            step(2.5, 'third', 0.125, 72),
            step(3, 'fifth', 0.375, 78),
            step(3.5, 'root', 0.125, 70),
          ],
          loop: true,
          swing: 0.06,
          humanize: 0.05,
        },
        {
          voiceId: 'piano',
          lengthBeats: 4,
          steps: [
            step(0.25, 'root', 0.25, 65),
            step(0.75, 'third', 0.25, 68),
            step(1.25, 'fifth', 0.25, 63),
            step(2.25, 'root', 0.25, 67),
            step(2.75, 'seventh', 0.25, 64),
            step(3.25, 'fifth', 0.25, 66),
          ],
          loop: true,
          swing: 0.04,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 85),
          drum(1, 'snare', 75),
          drum(2, 'kick', 80),
          drum(2.75, 'kick', 70),
          drum(3, 'snare', 78),
          drum(3.75, 'kick', 72),
          // Brush ride pattern
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'ride', 50 + (i % 2 === 0 ? 8 : 0))),
          // Hi-hat on quarter notes
          drum(0, 'hihat-closed', 58),
          drum(1, 'hihat-closed', 60),
          drum(2, 'hihat-closed', 57),
          drum(3, 'hihat-closed', 59),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['mpb', 'latin', 'brazilian', 'pop', 'jazz', 'bossa-influenced'],
  icon: '🎵',
};

/**
 * Forró - Accordion-driven dance from Northeast Brazil
 */
export const FORRO_STYLE: ArrangerStyle = {
  id: 'forro',
  name: 'Forró',
  category: 'latin',
  subcategory: 'brazilian',
  description: 'Accordion-driven forró dance from Northeast Brazil with zabumba and triangle',
  tempoRange: { min: 110, max: 140 },
  defaultTempo: 125,
  timeSignature: { numerator: 2, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Acoustic Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Forró Percussion', { volume: 0.8, pan: 0, channel: 10 }),
    voice('accordion', 'accordion', 'Forró Accordion', { volume: 0.9, pan: 0, channel: 2 }),
    voice('triangle', 'percussion', 'Triangle', { volume: 0.7, pan: 0.3, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Baile',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.5, 100),
            step(0.5, 'fifth', 0.25, 85),
            step(1, 'root', 0.5, 95),
            step(1.5, 'third', 0.25, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'accordion',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.125, 80),
            step(0.125, 'third', 0.125, 75),
            step(0.25, 'fifth', 0.125, 78),
            step(0.5, 'root', 0.125, 82),
            step(0.75, 'third', 0.125, 77),
            step(1, 'fifth', 0.125, 85),
            step(1.125, 'root', 0.125, 75),
            step(1.25, 'third', 0.125, 80),
            step(1.5, 'root', 0.125, 83),
            step(1.75, 'fifth', 0.125, 78),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 2,
        steps: [
          // Zabumba (bass drum with stick on one side)
          drum(0, 'zabumba-bass', 100),
          drum(0.5, 'zabumba-stick', 75),
          drum(1, 'zabumba-bass', 95),
          drum(1.5, 'zabumba-stick', 78),
          // Triangle - continuous 8th notes
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.25, 'triangle', 65 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          // Snare accents
          drum(0.75, 'snare', 70),
          drum(1.75, 'snare', 72),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['forro', 'latin', 'brazilian', 'northeast', 'accordion', 'dance'],
  icon: '🪗',
};

/**
 * Baião - Traditional Northeast Brazilian rhythm
 */
export const BAIAO_STYLE: ArrangerStyle = {
  id: 'baiao',
  name: 'Baião',
  category: 'latin',
  subcategory: 'brazilian',
  description: 'Traditional baião rhythm from Northeast Brazil with syncopated zabumba pattern',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 2, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Acoustic Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Baião Percussion', { volume: 0.8, pan: 0, channel: 10 }),
    voice('accordion', 'accordion', 'Baião Accordion', { volume: 0.85, pan: -0.1, channel: 2 }),
    voice('guitar', 'guitar', 'Acoustic Guitar', { volume: 0.75, pan: 0.2, channel: 3 }),
    voice('triangle', 'percussion', 'Triangle', { volume: 0.7, pan: 0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Classic',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.375, 95),
            step(0.5, 'fifth', 0.25, 80),
            step(1, 'root', 0.375, 90),
            step(1.5, 'third', 0.25, 78),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.03,
        },
        {
          voiceId: 'accordion',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.25, 75),
            step(0.25, 'third', 0.125, 70),
            step(0.5, 'fifth', 0.25, 78),
            step(0.75, 'root', 0.125, 72),
            step(1, 'third', 0.25, 80),
            step(1.25, 'fifth', 0.125, 73),
            step(1.5, 'root', 0.25, 82),
            step(1.75, 'third', 0.125, 75),
          ],
          loop: true,
          swing: 0.04,
          humanize: 0.04,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.125, 70),
            step(0.25, 'fifth', 0.125, 68),
            step(0.5, 'root', 0.125, 72),
            step(1, 'third', 0.125, 75),
            step(1.25, 'fifth', 0.125, 70),
            step(1.5, 'root', 0.125, 73),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 2,
        steps: [
          // Characteristic baião zabumba pattern
          drum(0, 'zabumba-bass', 100),
          drum(0.5, 'zabumba-stick', 80),
          drum(0.75, 'zabumba-bass', 75),
          drum(1, 'zabumba-stick', 85),
          drum(1.5, 'zabumba-bass', 90),
          // Triangle
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.25, 'triangle', 60 + (i % 4 === 0 ? 18 : i % 2 === 0 ? 10 : 0))),
          // Ganzá (shaker)
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.25, 'shaker', 55 + (i % 2 === 0 ? 8 : 0))),
        ],
        swing: 0.02,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['baiao', 'latin', 'brazilian', 'northeast', 'traditional', 'luiz-gonzaga'],
  icon: '🌵',
};

/**
 * Salsa - Montuno with clave
 */
export const SALSA_STYLE: ArrangerStyle = {
  id: 'salsa',
  name: 'Salsa',
  category: 'latin',
  subcategory: 'cuban',
  description: 'Cuban salsa with piano montuno, tumbao bass, and full percussion',
  tempoRange: { min: 160, max: 210 },
  defaultTempo: 185,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Tumbao Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Salsa Percussion', { volume: 0.8, pan: 0, channel: 10 }),
    voice('piano', 'piano', 'Montuno Piano', { volume: 0.75, pan: -0.1, channel: 2 }),
    voice('brass', 'brass', 'Brass Section', { volume: 0.7, pan: 0.1, channel: 3 }),
    voice('conga', 'percussion', 'Congas', { volume: 0.65, pan: 0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Montuno',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Tumbao pattern (anticipated)
            step(0.5, 'fifth', 0.25, 90),
            step(2, 'root', 0.25, 100),
            step(2.5, 'root', 0.25, 85),
            step(3.5, 'fifth', 0.25, 90),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'piano',
          lengthBeats: 4,
          steps: [
            // Classic montuno
            step(0.5, 'root', 0.125, 75),
            step(1, 'third', 0.125, 80),
            step(1.5, 'fifth', 0.125, 75),
            step(2, 'root', 0.125, 85),
            step(2.5, 'third', 0.125, 75),
            step(3, 'fifth', 0.125, 80),
            step(3.5, 'root', 0.125, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 8,
        steps: [
          // 2-3 Son Clave
          drum(1, 'clave', 90),
          drum(2, 'clave', 90),
          drum(4, 'clave', 90),
          drum(5.5, 'clave', 90),
          drum(7, 'clave', 90),
          // Cowbell cascara pattern
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'cowbell', 60 + (i % 4 === 0 ? 20 : i % 2 === 0 ? 10 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['salsa', 'latin', 'cuban', 'montuno', 'clave'],
  icon: '💃',
};

/**
 * Son Cubano - Traditional Cuban son
 */
export const SON_CUBANO_STYLE: ArrangerStyle = {
  id: 'son-cubano',
  name: 'Son Cubano',
  category: 'latin',
  subcategory: 'cuban',
  description: 'Traditional Cuban son with tres, clave, bongos, and marimbula bass',
  tempoRange: { min: 80, max: 110 },
  defaultTempo: 90,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Marimbula Bass', { volume: 0.80, pan: 0, channel: 1 }),
    voice('tres', 'guitar', 'Tres Guitar', { volume: 0.75, pan: -0.15, channel: 2 }),
    voice('drums', 'percussion', 'Bongos & Clave', { volume: 0.70, pan: 0, channel: 10 }),
    voice('trumpet', 'brass', 'Trumpet', { volume: 0.65, pan: 0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 0.5, 90),
            step(2, 'fifth', 0.5, 85),
            step(4, 'root', 0.5, 90),
            step(6, 'third', 0.5, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'tres',
          lengthBeats: 4,
          steps: [
            step(0.5, 'root', 0.125, 70),
            step(1, 'fifth', 0.125, 75),
            step(2, 'third', 0.25, 80),
            step(3, 'root', 0.125, 75),
            step(3.5, 'fifth', 0.125, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['son', 'cuban', 'traditional', 'tres', 'clave'],
  icon: '🎺',
};

/**
 * Mambo - Big band Latin with brass hits
 */
export const MAMBO_STYLE: ArrangerStyle = {
  id: 'mambo',
  name: 'Mambo',
  category: 'latin',
  subcategory: 'cuban',
  description: 'Energetic mambo with brass section, timbales, and syncopated piano',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Walking Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('piano', 'piano', 'Syncopated Piano', { volume: 0.75, pan: -0.1, channel: 2 }),
    voice('brass', 'brass', 'Brass Hits', { volume: 0.80, pan: 0.1, channel: 3 }),
    voice('drums', 'percussion', 'Timbales & Conga', { volume: 0.75, pan: 0, channel: 10 }),
    voice('bongos', 'percussion', 'Bongos', { volume: 0.60, pan: 0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 95),
            step(1, 'fifth', 0.25, 85),
            step(1.5, 'root', 0.25, 90),
            step(2, 'third', 0.5, 95),
            step(3, 'root', 0.5, 90),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'brass',
          lengthBeats: 4,
          steps: [
            step(0.5, 'root', 0.25, 100),
            step(2.5, 'fifth', 0.25, 100),
            step(3.5, 'third', 0.25, 95),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['mambo', 'latin', 'brass', 'big-band', 'cuban'],
  icon: '🎺',
};

/**
 * Cha-Cha-Cha - Classic Cuban dance rhythm
 */
export const CHA_CHA_CHA_STYLE: ArrangerStyle = {
  id: 'cha-cha-cha',
  name: 'Cha-Cha-Cha',
  category: 'latin',
  subcategory: 'cuban',
  description: 'Smooth cha-cha-cha rhythm with characteristic syncopation',
  tempoRange: { min: 110, max: 130 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Cha-Cha Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('piano', 'piano', 'Guajeo Piano', { volume: 0.70, pan: -0.1, channel: 2 }),
    voice('drums', 'percussion', 'Cha-Cha Rhythm', { volume: 0.75, pan: 0, channel: 10 }),
    voice('brass', 'brass', 'Brass Accents', { volume: 0.65, pan: 0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Cha-cha-cha pattern (1-2-3-cha-cha)
            step(0, 'root', 0.5, 90),
            step(1, 'root', 0.5, 85),
            step(2, 'root', 0.5, 90),
            step(3, 'fifth', 0.25, 80),
            step(3.5, 'fifth', 0.25, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['cha-cha', 'cuban', 'dance', 'ballroom'],
  icon: '💃',
};

/**
 * Bolero - Romantic slow Latin ballad
 */
export const BOLERO_STYLE: ArrangerStyle = {
  id: 'bolero',
  name: 'Bolero',
  category: 'latin',
  subcategory: 'romantic',
  description: 'Romantic bolero with lush strings, acoustic guitar, and gentle percussion',
  tempoRange: { min: 60, max: 80 },
  defaultTempo: 70,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Bolero Bass', { volume: 0.70, pan: 0, channel: 1 }),
    voice('guitar', 'guitar', 'Nylon Guitar', { volume: 0.75, pan: -0.15, channel: 2 }),
    voice('strings', 'strings', 'String Section', { volume: 0.65, pan: 0, channel: 3 }),
    voice('drums', 'percussion', 'Soft Percussion', { volume: 0.55, pan: 0, channel: 10 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 1, 75),
            step(2, 'fifth', 1, 70),
            step(4, 'third', 1, 75),
            step(6, 'root', 1, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 65),
            step(1, 'third', 0.5, 70),
            step(2, 'fifth', 0.5, 65),
            step(3, 'root', 0.5, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['bolero', 'romantic', 'ballad', 'latin'],
  icon: '🌹',
};

/**
 * Tango - Argentine tango with bandoneón feel
 */
export const TANGO_STYLE: ArrangerStyle = {
  id: 'tango',
  name: 'Tango',
  category: 'latin',
  subcategory: 'argentine',
  description: 'Dramatic Argentine tango with bandoneón, violin, and staccato accents',
  tempoRange: { min: 55, max: 75 },
  defaultTempo: 65,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Marcato Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('accordion', 'accordion', 'Bandoneón', { volume: 0.80, pan: -0.1, channel: 2 }),
    voice('violin', 'strings', 'Tango Violin', { volume: 0.75, pan: 0.1, channel: 3 }),
    voice('piano', 'piano', 'Staccato Piano', { volume: 0.70, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 0.25, 95, { articulation: 'staccato' }),
            step(1, 'root', 0.25, 90, { articulation: 'staccato' }),
            step(2, 'fifth', 0.5, 85),
            step(4, 'root', 0.25, 95, { articulation: 'staccato' }),
            step(5, 'third', 0.25, 90, { articulation: 'staccato' }),
            step(6, 'root', 1, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['tango', 'argentine', 'dramatic', 'bandoneón'],
  icon: '🎭',
};

/**
 * Milonga - Faster tango variation
 */
export const MILONGA_STYLE: ArrangerStyle = {
  id: 'milonga',
  name: 'Milonga',
  category: 'latin',
  subcategory: 'argentine',
  description: 'Uptempo milonga with habanera rhythm and dancing feel',
  tempoRange: { min: 75, max: 95 },
  defaultTempo: 85,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Habanera Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('guitar', 'guitar', 'Guitar', { volume: 0.75, pan: -0.1, channel: 2 }),
    voice('accordion', 'accordion', 'Bandoneón', { volume: 0.75, pan: 0.1, channel: 3 }),
    voice('drums', 'percussion', 'Percussion', { volume: 0.65, pan: 0, channel: 10 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Habanera rhythm
            step(0, 'root', 0.5, 90),
            step(0.75, 'root', 0.25, 75),
            step(1.5, 'fifth', 0.5, 85),
            step(2, 'root', 0.5, 90),
            step(3, 'fifth', 0.5, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['milonga', 'argentine', 'tango', 'habanera'],
  icon: '💃',
};

/**
 * Country Pop - Modern country with strings
 */
export const COUNTRY_POP_STYLE: ArrangerStyle = {
  id: 'country-pop',
  name: 'Country Pop',
  category: 'country',
  subcategory: 'modern',
  description: 'Modern country pop with acoustic guitar, pedal steel, and strings',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Country Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Country Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('acoustic', 'guitar', 'Acoustic Guitar', { volume: 0.8, pan: -0.3, channel: 2 }),
    voice('steel', 'guitar', 'Pedal Steel', { volume: 0.6, pan: 0.3, channel: 3 }),
    voice('piano', 'piano', 'Honky Tonk Piano', { volume: 0.55, pan: 0.1, channel: 4 }),
    voice('strings', 'strings', 'Nashville Strings', { volume: 0.5, pan: 0, channel: 5 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Verse',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 85),
            step(2, 'fifth', 1, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'acoustic',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 70),
            step(1, 'root', 0.5, 65),
            step(2, 'root', 0.5, 70),
            step(3, 'root', 0.5, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 100),
          drum(2, 'kick', 95),
          drum(1, 'snare', 90),
          drum(3, 'snare', 95),
          // Train beat hi-hat
          drum(0, 'hihat-closed', 65),
          drum(0.5, 'hihat-closed', 55),
          drum(1, 'hihat-closed', 65),
          drum(1.5, 'hihat-closed', 55),
          drum(2, 'hihat-closed', 65),
          drum(2.5, 'hihat-closed', 55),
          drum(3, 'hihat-closed', 65),
          drum(3.5, 'hihat-closed', 55),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'pop', 'modern', 'nashville', 'acoustic'],
  icon: '🤠',
};

/**
 * ChillOut - Ambient electronic
 */
export const CHILLOUT_STYLE: ArrangerStyle = {
  id: 'chillout',
  name: 'Chill Out',
  category: 'electronic',
  subcategory: 'ambient',
  description: 'Downtempo ambient with lush pads and subtle rhythms',
  tempoRange: { min: 70, max: 100 },
  defaultTempo: 85,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Sub Bass', { volume: 0.7, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Electronic Kit', { volume: 0.5, pan: 0, channel: 10 }),
    voice('pad', 'pad', 'Ambient Pad', { volume: 0.75, pan: 0, channel: 2 }),
    voice('keys', 'piano', 'Electric Piano', { volume: 0.6, pan: -0.2, channel: 3 }),
    voice('synth', 'synth', 'Arp Synth', { volume: 0.45, pan: 0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Flow',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 4, 60),
            step(4, 'fifth', 4, 55),
          ],
          loop: true,
          swing: 0,
          humanize: 0.1,
        },
        {
          voiceId: 'pad',
          lengthBeats: 16,
          steps: [
            step(0, 'root', 16, 50),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
        {
          voiceId: 'keys',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 1, 45),
            step(2, 'third', 1, 40),
            step(4, 'fifth', 1, 45),
            step(6, 'third', 1, 40),
          ],
          loop: true,
          swing: 0,
          humanize: 0.15,
        },
      ],
      drumPattern: {
        lengthBeats: 8,
        steps: [
          drum(0, 'kick', 70),
          drum(4, 'kick', 65),
          drum(2, 'snare', 50),
          drum(6, 'snare', 55),
          // Subtle shaker
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'shaker', 30)),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electronic', 'chillout', 'ambient', 'downtempo', 'lounge'],
  icon: '🌙',
};

/**
 * LoFi Hip Hop - Jazzy samples with vinyl crackle
 */
export const LOFI_HIPHOP_STYLE: ArrangerStyle = {
  id: 'lofi-hiphop',
  name: 'Lo-Fi Hip Hop',
  category: 'electronic',
  subcategory: 'hiphop',
  description: 'Jazzy lo-fi beats with vinyl texture and mellow vibes',
  tempoRange: { min: 70, max: 95 },
  defaultTempo: 82,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Muted Bass', { volume: 0.75, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Lo-Fi Kit', { volume: 0.7, pan: 0, channel: 10 }),
    voice('keys', 'piano', 'Rhodes', { volume: 0.8, pan: -0.1, channel: 2 }),
    voice('guitar', 'guitar', 'Jazz Guitar', { volume: 0.5, pan: 0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Study',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 70),
            step(2, 'fifth', 1, 65),
            step(3, 'third', 0.5, 60),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.1,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 55),
            step(1, 'third', 0.5, 50),
            step(2, 'fifth', 0.75, 55),
            step(3, 'root', 0.5, 50),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 85),
          drum(1.5, 'kick', 70),
          drum(2.75, 'kick', 75),
          drum(1, 'snare', 75),
          drum(3, 'snare', 80),
          // Off-kilter hi-hats
          drum(0, 'hihat-closed', 50),
          drum(0.75, 'hihat-closed', 45),
          drum(1.5, 'hihat-closed', 50),
          drum(2.25, 'hihat-closed', 45),
          drum(3, 'hihat-closed', 50),
          drum(3.5, 'hihat-closed', 45),
        ],
        swing: 0.2,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electronic', 'lofi', 'hiphop', 'jazzy', 'study', 'chill'],
  icon: '📚',
};

/**
 * Gospel - Church feel with choir voicings
 */
export const GOSPEL_STYLE: ArrangerStyle = {
  id: 'gospel',
  name: 'Gospel',
  category: 'rnb',
  subcategory: 'gospel',
  description: 'Contemporary gospel with Hammond organ, choir, and powerful drums',
  tempoRange: { min: 85, max: 130 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Gospel Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Gospel Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('organ', 'organ', 'Hammond B3', { volume: 0.8, pan: 0, channel: 2 }),
    voice('piano', 'piano', 'Grand Piano', { volume: 0.7, pan: -0.2, channel: 3 }),
    voice('choir', 'pad', 'Choir Ahh', { volume: 0.6, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Praise',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 95),
            step(0.5, 'root', 0.5, 75),
            step(1, 'fifth', 0.5, 85),
            step(2, 'root', 0.5, 90),
            step(2.5, 'third', 0.5, 80),
            step(3, 'fifth', 0.5, 85),
            step(3.5, 'root', 0.5, 75),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.05,
        },
        {
          voiceId: 'organ',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 70),
            step(0.5, 'third', 0.25, 60),
            step(1, 'fifth', 0.5, 70),
            step(2, 'root', 0.5, 75),
            step(3, 'third', 0.5, 70),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 110),
          drum(0.5, 'kick', 80),
          drum(1, 'snare', 100),
          drum(2, 'kick', 105),
          drum(2.5, 'kick', 85),
          drum(3, 'snare', 105),
          // Gospel hi-hat pattern
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60 + (i % 2 === 0 ? 15 : 0))),
          drum(3.75, 'hihat-open', 70),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['gospel', 'rnb', 'church', 'organ', 'choir', 'praise'],
  icon: '⛪',
};

/**
 * Trap Beat - 808s with hi-hat rolls
 */
export const TRAP_STYLE: ArrangerStyle = {
  id: 'trap',
  name: 'Trap',
  category: 'electronic',
  subcategory: 'hiphop',
  description: 'Modern trap with 808 bass, hi-hat rolls, and hard snares',
  tempoRange: { min: 130, max: 160 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', '808 Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Trap Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Trap Lead', { volume: 0.6, pan: 0, channel: 2 }),
    voice('pad', 'pad', 'Dark Pad', { volume: 0.4, pan: 0, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Hard',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 120),
            step(2.5, 'fifth', 0.5, 100),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(2.75, 'kick', 110),
          drum(2, 'snare', 120),
          // Hi-hat rolls
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.25, 'hihat-closed', 50 + (i % 2) * 15)),
          // Rolls before snare
          drum(1.75, 'hihat-closed', 80),
          drum(1.875, 'hihat-closed', 90),
          drum(3.5, 'hihat-closed', 75),
          drum(3.625, 'hihat-closed', 85),
          drum(3.75, 'hihat-closed', 95),
          drum(3.875, 'hihat-closed', 100),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['trap', 'electronic', 'hiphop', '808', 'urban'],
  icon: '🔥',
};

/**
 * Tropical House - Sunny, uplifting house with organic sounds
 */
export const TROPICAL_HOUSE_STYLE: ArrangerStyle = {
  id: 'tropical-house',
  name: 'Tropical House',
  category: 'electronic',
  subcategory: 'house',
  description: 'Sunny tropical house with steel drums, flutes, and relaxed grooves',
  tempoRange: { min: 100, max: 115 },
  defaultTempo: 108,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Tropical Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Tropical Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('melody', 'synth', 'Steel Drums', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('pad', 'pad', 'Warm Pad', { volume: 0.5, pan: -0.1, channel: 3 }),
    voice('flute', 'synth', 'Pan Flute', { volume: 0.6, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Sunny',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 100, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.5, 90, { octaveOffset: -1 }),
            step(2, 'root', 0.75, 105, { octaveOffset: -1 }),
            step(3.5, 'third', 0.5, 85, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.1,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 100),
          drum(1, 'kick', 95),
          drum(2, 'kick', 105),
          drum(3, 'kick', 90),
          drum(1, 'snare', 85),
          drum(3, 'snare', 80),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-open', 45 + (i % 2) * 10)),
          drum(0.5, 'percussion', 70),
          drum(2.5, 'percussion', 65),
        ],
        swing: 0.15,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['tropical-house', 'electronic', 'house', 'summer', 'uplifting'],
  icon: '🌴',
};

/**
 * Future House - Punchy house with bouncy basslines
 */
export const FUTURE_HOUSE_STYLE: ArrangerStyle = {
  id: 'future-house',
  name: 'Future House',
  category: 'electronic',
  subcategory: 'house',
  description: 'Punchy future house with bouncy basslines and crisp drums',
  tempoRange: { min: 124, max: 130 },
  defaultTempo: 126,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Future Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Future Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('lead', 'synth', 'Future Lead', { volume: 0.65, pan: 0.1, channel: 2 }),
    voice('pad', 'pad', 'Bright Pad', { volume: 0.5, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Bouncy',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.125, 120, { octaveOffset: -1 }),
            step(0.25, 'root', 0.125, 100, { octaveOffset: -1 }),
            step(0.5, 'fifth', 0.125, 110, { octaveOffset: -1 }),
            step(1, 'root', 0.125, 115, { octaveOffset: -1 }),
            step(1.5, 'third', 0.125, 95, { octaveOffset: -1 }),
            step(2, 'root', 0.125, 125, { octaveOffset: -1 }),
            step(2.5, 'fifth', 0.125, 105, { octaveOffset: -1 }),
            step(3, 'third', 0.125, 100, { octaveOffset: -1 }),
            step(3.5, 'root', 0.125, 90, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(1, 'kick', 120),
          drum(2, 'kick', 127),
          drum(3, 'kick', 115),
          drum(1, 'snare', 110),
          drum(3, 'snare', 105),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 2) * 15)),
          drum(0.75, 'percussion', 75),
          drum(2.75, 'percussion', 70),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['future-house', 'electronic', 'house', 'bouncy', 'energetic'],
  icon: '🚀',
};

/**
 * Electro House - Aggressive house with heavy synths
 */
export const ELECTRO_HOUSE_STYLE: ArrangerStyle = {
  id: 'electro-house',
  name: 'Electro House',
  category: 'electronic',
  subcategory: 'house',
  description: 'Aggressive electro house with heavy synths and driving energy',
  tempoRange: { min: 126, max: 135 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Electro Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Electro Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('lead', 'synth', 'Electro Lead', { volume: 0.75, pan: 0, channel: 2 }),
    voice('synth', 'synth', 'Electro Stab', { volume: 0.7, pan: 0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Aggressive',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 127, { octaveOffset: -1 }),
            step(0.5, 'root', 0.25, 115, { octaveOffset: -1 }),
            step(1, 'root', 0.25, 127, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.25, 110, { octaveOffset: -1 }),
            step(2, 'root', 0.25, 127, { octaveOffset: -1 }),
            step(2.5, 'root', 0.25, 115, { octaveOffset: -1 }),
            step(3, 'root', 0.25, 127, { octaveOffset: -1 }),
            step(3.5, 'third', 0.25, 110, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(1, 'kick', 127),
          drum(2, 'kick', 127),
          drum(3, 'kick', 127),
          drum(1, 'snare', 120),
          drum(3, 'snare', 120),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 70 + (i % 4) * 10)),
          drum(1.5, 'crash', 90),
          drum(3.5, 'crash', 85),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electro-house', 'electronic', 'house', 'aggressive', 'energetic'],
  icon: '⚡',
};

/**
 * Minimal Techno - Stripped-down techno groove
 */
export const MINIMAL_TECHNO_STYLE: ArrangerStyle = {
  id: 'minimal-techno',
  name: 'Minimal Techno',
  category: 'electronic',
  subcategory: 'techno',
  description: 'Minimal techno with hypnotic grooves and subtle variations',
  tempoRange: { min: 125, max: 135 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Minimal Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Minimal Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('perc', 'percussion', 'Minimal Perc', { volume: 0.65, pan: 0.2, channel: 2 }),
    voice('synth', 'synth', 'Minimal Blip', { volume: 0.5, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Hypnotic',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.125, 105, { octaveOffset: -1 }),
            step(1, 'root', 0.125, 100, { octaveOffset: -1 }),
            step(2, 'fifth', 0.125, 95, { octaveOffset: -1 }),
            step(3, 'root', 0.125, 90, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 110),
          drum(1, 'kick', 105),
          drum(2, 'kick', 110),
          drum(3, 'kick', 100),
          drum(2, 'snare', 75),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 50 + (i % 4) * 8)),
          drum(0.5, 'percussion', 60),
          drum(1.5, 'percussion', 55),
          drum(2.5, 'percussion', 65),
          drum(3.5, 'percussion', 55),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['minimal-techno', 'electronic', 'techno', 'hypnotic', 'minimal'],
  icon: '▪️',
};

/**
 * Detroit Techno - Soulful, futuristic techno
 */
export const DETROIT_TECHNO_STYLE: ArrangerStyle = {
  id: 'detroit-techno',
  name: 'Detroit Techno',
  category: 'electronic',
  subcategory: 'techno',
  description: 'Soulful Detroit techno with emotional chords and driving rhythms',
  tempoRange: { min: 130, max: 140 },
  defaultTempo: 135,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Detroit Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Detroit Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('chords', 'pad', 'Detroit Chords', { volume: 0.65, pan: 0, channel: 2 }),
    voice('pad', 'pad', 'Emotional Pad', { volume: 0.55, pan: 0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Soulful',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 110, { octaveOffset: -1 }),
            step(0.5, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(1, 'fifth', 0.25, 105, { octaveOffset: -1 }),
            step(1.5, 'root', 0.25, 95, { octaveOffset: -1 }),
            step(2, 'root', 0.25, 115, { octaveOffset: -1 }),
            step(2.5, 'third', 0.25, 100, { octaveOffset: -1 }),
            step(3, 'root', 0.25, 110, { octaveOffset: -1 }),
            step(3.5, 'fifth', 0.25, 95, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.1,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 115),
          drum(1, 'kick', 110),
          drum(2, 'kick', 120),
          drum(3, 'kick', 105),
          drum(2, 'snare', 95),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 3) * 10)),
          drum(1.5, 'hihat-open', 70),
          drum(3.5, 'hihat-open', 65),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['detroit-techno', 'electronic', 'techno', 'soulful', 'emotional'],
  icon: '🏭',
};

/**
 * Industrial Techno - Dark, hard-hitting techno
 */
export const INDUSTRIAL_TECHNO_STYLE: ArrangerStyle = {
  id: 'industrial-techno',
  name: 'Industrial Techno',
  category: 'electronic',
  subcategory: 'techno',
  description: 'Dark industrial techno with distorted drums and relentless energy',
  tempoRange: { min: 135, max: 145 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Industrial Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Industrial Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('noise', 'synth', 'Industrial Noise', { volume: 0.6, pan: 0.2, channel: 2 }),
    voice('synth', 'synth', 'Dark Synth', { volume: 0.5, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Relentless',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.125, 125, { octaveOffset: -1 }),
            step(0.25, 'root', 0.125, 120, { octaveOffset: -1 }),
            step(1, 'root', 0.125, 127, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.125, 115, { octaveOffset: -1 }),
            step(2, 'root', 0.125, 125, { octaveOffset: -1 }),
            step(2.25, 'root', 0.125, 120, { octaveOffset: -1 }),
            step(3, 'root', 0.125, 127, { octaveOffset: -1 }),
            step(3.5, 'root', 0.125, 110, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(0.5, 'kick', 110),
          drum(1, 'kick', 127),
          drum(1.5, 'kick', 105),
          drum(2, 'kick', 127),
          drum(2.5, 'kick', 110),
          drum(3, 'kick', 127),
          drum(3.5, 'kick', 105),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 80 + (i % 2) * 15)),
          drum(2, 'snare', 120),
          drum(3.75, 'snare', 100),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['industrial-techno', 'electronic', 'techno', 'dark', 'hard'],
  icon: '⚙️',
};

/**
 * Melodic Techno - Emotional techno with melodic elements
 */
export const MELODIC_TECHNO_STYLE: ArrangerStyle = {
  id: 'melodic-techno',
  name: 'Melodic Techno',
  category: 'electronic',
  subcategory: 'techno',
  description: 'Emotional melodic techno with beautiful arpeggios and deep basslines',
  tempoRange: { min: 118, max: 126 },
  defaultTempo: 122,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Melodic Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Melodic Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('arp', 'synth', 'Arpeggio', { volume: 0.7, pan: 0.1, channel: 2 }),
    voice('pad', 'pad', 'Emotional Pad', { volume: 0.6, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Emotional',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 105, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.5, 95, { octaveOffset: -1 }),
            step(2, 'root', 1, 100, { octaveOffset: -1 }),
            step(3.5, 'third', 0.5, 90, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.15,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 110),
          drum(1, 'kick', 105),
          drum(2, 'kick', 110),
          drum(3, 'kick', 100),
          drum(2, 'snare', 85),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 50 + (i % 4) * 12)),
          drum(1.5, 'hihat-open', 65),
          drum(3.5, 'hihat-open', 60),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['melodic-techno', 'electronic', 'techno', 'melodic', 'emotional'],
  icon: '🎹',
};

/**
 * Drum and Bass - Fast breakbeats with heavy bass
 */
export const DRUM_AND_BASS_STYLE: ArrangerStyle = {
  id: 'drum-and-bass',
  name: 'Drum and Bass',
  category: 'electronic',
  subcategory: 'dnb',
  description: 'Fast drum and bass with complex breakbeats and heavy sub bass',
  tempoRange: { min: 170, max: 180 },
  defaultTempo: 174,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Sub Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'DnB Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('pad', 'pad', 'Atmospheric Pad', { volume: 0.55, pan: 0, channel: 2 }),
    voice('synth', 'synth', 'DnB Stab', { volume: 0.6, pan: 0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Breakbeat',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 120, { octaveOffset: -1 }),
            step(0.75, 'fifth', 0.25, 100, { octaveOffset: -1 }),
            step(1.5, 'root', 0.5, 115, { octaveOffset: -1 }),
            step(2, 'root', 0.75, 125, { octaveOffset: -1 }),
            step(3, 'third', 0.5, 105, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(0.5, 'kick', 110),
          drum(1.5, 'kick', 105),
          drum(2, 'kick', 125),
          drum(3, 'kick', 115),
          drum(1, 'snare', 120),
          drum(3, 'snare', 115),
          // Complex hi-hat pattern
          ...Array.from({ length: 32 }, (_, i) => {
            const vel = i % 4 === 0 ? 70 : i % 2 === 0 ? 55 : 40;
            return drum(i * 0.125, 'hihat-closed', vel);
          }),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['drum-and-bass', 'electronic', 'dnb', 'breakbeat', 'fast'],
  icon: '💨',
};

/**
 * Liquid DnB - Smooth, melodic drum and bass
 */
export const LIQUID_DNB_STYLE: ArrangerStyle = {
  id: 'liquid-dnb',
  name: 'Liquid DnB',
  category: 'electronic',
  subcategory: 'dnb',
  description: 'Smooth liquid drum and bass with jazzy chords and rolling breaks',
  tempoRange: { min: 170, max: 178 },
  defaultTempo: 174,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Liquid Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Liquid Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('chords', 'pad', 'Jazzy Chords', { volume: 0.65, pan: 0, channel: 2 }),
    voice('pad', 'pad', 'Smooth Pad', { volume: 0.6, pan: 0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Rolling',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 110, { octaveOffset: -1 }),
            step(1, 'fifth', 0.5, 95, { octaveOffset: -1 }),
            step(1.75, 'third', 0.25, 90, { octaveOffset: -1 }),
            step(2, 'root', 1, 105, { octaveOffset: -1 }),
            step(3.5, 'fifth', 0.5, 100, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.15,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 115),
          drum(0.75, 'kick', 100),
          drum(1.5, 'kick', 110),
          drum(2, 'kick', 120),
          drum(3, 'kick', 105),
          drum(1, 'snare', 100),
          drum(3, 'snare', 95),
          // Rolling hi-hats
          ...Array.from({ length: 32 }, (_, i) => {
            const vel = 45 + (i % 4) * 10;
            return drum(i * 0.125, 'hihat-closed', vel);
          }),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['liquid-dnb', 'electronic', 'dnb', 'smooth', 'jazzy'],
  icon: '💧',
};

/**
 * Jungle - Ragga-influenced DnB with chopped breaks
 */
export const JUNGLE_STYLE: ArrangerStyle = {
  id: 'jungle',
  name: 'Jungle',
  category: 'electronic',
  subcategory: 'dnb',
  description: 'Classic jungle with chopped Amen breaks and reggae basslines',
  tempoRange: { min: 160, max: 170 },
  defaultTempo: 165,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Jungle Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Jungle Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Jungle Stab', { volume: 0.65, pan: 0.1, channel: 2 }),
    voice('pad', 'pad', 'Dark Pad', { volume: 0.5, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Amen',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 120, { octaveOffset: -1 }),
            step(0.75, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(1, 'fifth', 0.25, 90, { octaveOffset: -1 }),
            step(1.5, 'root', 0.5, 115, { octaveOffset: -1 }),
            step(2, 'root', 0.75, 125, { octaveOffset: -1 }),
            step(3, 'root', 0.5, 110, { octaveOffset: -1 }),
            step(3.75, 'fifth', 0.25, 95, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(0.375, 'kick', 95),
          drum(1, 'kick', 110),
          drum(1.5, 'kick', 100),
          drum(2, 'kick', 125),
          drum(2.75, 'kick', 105),
          drum(3.5, 'kick', 115),
          drum(0.5, 'snare', 120),
          drum(1.5, 'snare', 110),
          drum(2.5, 'snare', 115),
          drum(3, 'snare', 105),
          // Chaotic hi-hats
          ...Array.from({ length: 32 }, (_, i) => {
            const vel = 50 + (i % 5) * 12;
            return drum(i * 0.125, 'hihat-closed', vel);
          }),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jungle', 'electronic', 'dnb', 'ragga', 'amen'],
  icon: '🌿',
};

/**
 * Dubstep - Half-time wobble bass
 */
export const DUBSTEP_STYLE: ArrangerStyle = {
  id: 'dubstep',
  name: 'Dubstep',
  category: 'electronic',
  subcategory: 'bass-music',
  description: 'Dubstep with half-time drums, wobble bass, and aggressive sound design',
  tempoRange: { min: 135, max: 145 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Wobble Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Dubstep Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Lead Synth', { volume: 0.65, pan: 0.1, channel: 2 }),
    voice('pad', 'pad', 'Dark Atmosphere', { volume: 0.55, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Wobble',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.5, 127, { octaveOffset: -1 }),
            step(0.5, 'root', 0.125, 110, { octaveOffset: -1 }),
            step(0.75, 'root', 0.125, 105, { octaveOffset: -1 }),
            step(1, 'fifth', 0.5, 120, { octaveOffset: -1 }),
            step(1.5, 'root', 0.25, 100, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Half-time kick pattern
          drum(0, 'kick', 127),
          drum(2, 'snare', 127),
          // Sparse hi-hats
          drum(1, 'hihat-open', 80),
          drum(3, 'hihat-open', 75),
          // Percussion accents
          drum(1.75, 'clap', 90),
          drum(3.5, 'clap', 85),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['dubstep', 'electronic', 'bass-music', 'wobble', 'half-time'],
  icon: '🔊',
};

/**
 * Trap - 808s and hi-hat rolls
 */
export const TRAP_BEAT_STYLE: ArrangerStyle = {
  id: 'trap-beat',
  name: 'Trap Beat',
  category: 'electronic',
  subcategory: 'hip-hop',
  description: 'Trap with booming 808s, snappy snares, and rapid hi-hat rolls',
  tempoRange: { min: 135, max: 145 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', '808 Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Trap Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Trap Lead', { volume: 0.6, pan: 0.2, channel: 2 }),
    voice('pad', 'pad', 'Dark Pad', { volume: 0.5, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: '808 Bounce',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.75, 127, { octaveOffset: -1 }),
            step(1, 'fifth', 0.5, 115, { octaveOffset: -1 }),
            step(1.75, 'root', 0.25, 105, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(1.5, 'kick', 110),
          drum(2.5, 'kick', 120),
          drum(1, 'snare', 125),
          drum(3, 'snare', 127),
          // Hi-hat rolls
          ...Array.from({ length: 32 }, (_, i) => {
            const vel = i % 8 < 4 ? 70 : 40;
            return drum(i * 0.125, 'hihat-closed', vel);
          }),
          // Triplet rolls at end
          drum(3.667, 'hihat-closed', 90),
          drum(3.833, 'hihat-closed', 95),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['trap', 'electronic', 'hip-hop', '808', 'hi-hat-rolls'],
  icon: '🔥',
};

/**
 * Lo-Fi Hip Hop - Chill beats with vinyl crackle
 */
export const LOFI_BEAT_STYLE: ArrangerStyle = {
  id: 'lofi-beat',
  name: 'Lo-Fi Hip Hop',
  category: 'electronic',
  subcategory: 'hip-hop',
  description: 'Lo-fi hip hop with jazzy samples, dusty drums, and vinyl warmth',
  tempoRange: { min: 75, max: 95 },
  defaultTempo: 85,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Lo-Fi Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Dusty Kit', { volume: 0.75, pan: 0, channel: 10 }),
    voice('keys', 'piano', 'Lo-Fi Piano', { volume: 0.7, pan: 0.1, channel: 2 }),
    voice('pad', 'pad', 'Vinyl Pad', { volume: 0.55, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Chill',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 75, { octaveOffset: -1 }),
            step(1, 'third', 0.5, 70, { octaveOffset: -1 }),
            step(2, 'fifth', 0.5, 72, { octaveOffset: -1 }),
            step(3, 'root', 0.5, 68, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.1,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 60),
            step(0, 'third', 1.5, 58),
            step(0, 'seventh', 1.5, 55),
            step(2, 'fifth', 1.5, 62),
            step(2, 'seventh', 1.5, 60),
            step(2, 'ninth', 1.5, 57),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.12,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 85),
          drum(2.5, 'kick', 75),
          drum(1, 'snare', 80),
          drum(3, 'snare', 78),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 45 + (i % 3) * 8)),
        ],
        swing: 0.15,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['lofi', 'electronic', 'hip-hop', 'chill', 'jazzy'],
  icon: '🎧',
};

/**
 * Vaporwave - Slowed, aesthetic electronic
 */
export const VAPORWAVE_STYLE: ArrangerStyle = {
  id: 'vaporwave',
  name: 'Vaporwave',
  category: 'electronic',
  subcategory: 'ambient',
  description: 'Vaporwave with slowed samples, reverb-drenched pads, and retro aesthetic',
  tempoRange: { min: 80, max: 100 },
  defaultTempo: 90,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Smooth Bass', { volume: 0.75, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Vaporwave Kit', { volume: 0.65, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Slowed Synth', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('pad', 'pad', 'Aesthetic Pad', { volume: 0.6, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Aesthetic',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 70, { octaveOffset: -1 }),
            step(2, 'fifth', 2, 68, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 75),
          drum(2, 'kick', 70),
          drum(1, 'snare', 65),
          drum(3, 'snare', 63),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 35 + (i % 3) * 8)),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['vaporwave', 'electronic', 'ambient', 'aesthetic', 'slowed'],
  icon: '🌸',
};

/**
 * Chillwave - Dreamy synths and laid-back beats
 */
export const CHILLWAVE_STYLE: ArrangerStyle = {
  id: 'chillwave',
  name: 'Chillwave',
  category: 'electronic',
  subcategory: 'ambient',
  description: 'Chillwave with dreamy synths, reverb washes, and relaxed grooves',
  tempoRange: { min: 90, max: 110 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Chill Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Chill Kit', { volume: 0.7, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Dreamy Synth', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('pad', 'pad', 'Reverb Pad', { volume: 0.65, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Dreamy',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 75, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.5, 70, { octaveOffset: -1 }),
            step(2, 'root', 1, 72, { octaveOffset: -1 }),
            step(3.5, 'third', 0.5, 68, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.07,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 80),
          drum(2, 'kick', 75),
          drum(1, 'snare', 70),
          drum(3, 'snare', 68),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 40 + (i % 3) * 10)),
        ],
        swing: 0.08,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['chillwave', 'electronic', 'ambient', 'dreamy', 'relaxed'],
  icon: '☁️',
};

/**
 * Dark Ambient - Ominous drones and textures
 */
export const DARK_AMBIENT_STYLE: ArrangerStyle = {
  id: 'dark-ambient',
  name: 'Dark Ambient',
  category: 'experimental',
  subcategory: 'ambient',
  description: 'Ominous drones, deep textures, and unsettling atmospheres',
  tempoRange: { min: 50, max: 70 },
  defaultTempo: 60,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Sub Drone', { volume: 0.85, pan: 0, channel: 1 }),
    voice('pad', 'pad', 'Dark Pad', { volume: 0.75, pan: 0, channel: 2 }),
    voice('texture', 'synth', 'Noise Texture', { volume: 0.4, pan: 0.15, channel: 3 }),
    voice('fx', 'synth', 'FX Layer', { volume: 0.3, pan: -0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Ominous',
      intensity: 1,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 32,
          steps: [
            step(0, 'root', 32, 40, { octaveOffset: -2 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'pad',
          lengthBeats: 16,
          steps: [
            step(0, 'root', 16, 35),
            step(0, 'fifth', 16, 30),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 16,
        steps: [
          // Sparse industrial hits
          drum(0, 'tom-low', 45),
          drum(8, 'tom-mid', 40),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['dark', 'ambient', 'experimental', 'drone', 'atmospheric'],
  icon: '🌑',
};

/**
 * Space Ambient - Cosmic pads and ethereal textures
 */
export const SPACE_AMBIENT_STYLE: ArrangerStyle = {
  id: 'space-ambient',
  name: 'Space Ambient',
  category: 'experimental',
  subcategory: 'ambient',
  description: 'Cosmic pads, ethereal textures, and interstellar atmospheres',
  tempoRange: { min: 60, max: 80 },
  defaultTempo: 70,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Space Bass', { volume: 0.7, pan: 0, channel: 1 }),
    voice('pad', 'pad', 'Cosmic Pad', { volume: 0.8, pan: 0, channel: 2 }),
    voice('lead', 'synth', 'Star Synth', { volume: 0.5, pan: 0.3, channel: 3 }),
    voice('fx', 'synth', 'Nebula FX', { volume: 0.4, pan: -0.25, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Cosmic',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 16,
          steps: [
            step(0, 'root', 8, 50, { octaveOffset: -1 }),
            step(8, 'fifth', 8, 48, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'pad',
          lengthBeats: 32,
          steps: [
            step(0, 'root', 32, 45),
            step(0, 'third', 32, 42),
            step(0, 'fifth', 32, 40),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'lead',
          lengthBeats: 16,
          steps: [
            step(0, 'fifth', 4, 35, { octaveOffset: 1 }),
            step(8, 'seventh', 4, 32, { octaveOffset: 1 }),
            step(12, 'ninth', 4, 30, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 16,
        steps: [
          // Very sparse percussion
          drum(0, 'tom-low', 30),
          drum(12, 'crash', 25),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['space', 'ambient', 'experimental', 'cosmic', 'ethereal'],
  icon: '🌌',
};

/**
 * New Age - Healing vibes with gentle melodies
 */
export const NEW_AGE_STYLE: ArrangerStyle = {
  id: 'new-age',
  name: 'New Age',
  category: 'experimental',
  subcategory: 'ambient',
  description: 'Healing vibes with gentle melodies and soothing textures',
  tempoRange: { min: 65, max: 85 },
  defaultTempo: 75,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Soft Bass', { volume: 0.65, pan: 0, channel: 1 }),
    voice('keys', 'piano', 'Gentle Piano', { volume: 0.75, pan: -0.15, channel: 2 }),
    voice('pad', 'pad', 'Healing Pad', { volume: 0.7, pan: 0.15, channel: 3 }),
    voice('bells', 'synth', 'Crystal Bells', { volume: 0.5, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Healing',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 4, 55, { octaveOffset: -1 }),
            step(4, 'fifth', 4, 52, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'keys',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 1, 50),
            step(1.5, 'third', 1, 48),
            step(3, 'fifth', 1, 52),
            step(4.5, 'seventh', 1, 50),
            step(6, 'ninth', 1, 48),
          ],
          loop: true,
          swing: 0,
          humanize: 0.1,
        },
        {
          voiceId: 'pad',
          lengthBeats: 16,
          steps: [
            step(0, 'root', 16, 45),
            step(0, 'third', 16, 43),
            step(0, 'fifth', 16, 42),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 8,
        steps: [
          // Very subtle percussion
          drum(0, 'shaker', 25),
          drum(2, 'shaker', 22),
          drum(4, 'shaker', 25),
          drum(6, 'shaker', 23),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['new-age', 'ambient', 'healing', 'meditation', 'gentle'],
  icon: '🧘',
};

/**
 * Drone - Sustained tones with minimal movement
 */
export const DRONE_STYLE: ArrangerStyle = {
  id: 'drone',
  name: 'Drone',
  category: 'experimental',
  subcategory: 'ambient',
  description: 'Sustained tones with minimal harmonic movement',
  tempoRange: { min: 40, max: 60 },
  defaultTempo: 50,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Deep Drone', { volume: 0.85, pan: 0, channel: 1 }),
    voice('pad', 'pad', 'Drone Pad', { volume: 0.75, pan: 0, channel: 2 }),
    voice('high', 'synth', 'High Drone', { volume: 0.5, pan: 0, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Sustained',
      intensity: 1,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 64,
          steps: [
            step(0, 'root', 64, 45, { octaveOffset: -2 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'pad',
          lengthBeats: 32,
          steps: [
            step(0, 'root', 32, 40),
            step(0, 'fifth', 32, 38),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'high',
          lengthBeats: 16,
          steps: [
            step(0, 'fifth', 16, 30, { octaveOffset: 2 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 32,
        steps: [],  // No drums in drone
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['drone', 'ambient', 'experimental', 'minimal', 'sustained'],
  icon: '〜',
};

/**
 * Glitch - Broken beats and stuttered textures
 */
export const GLITCH_STYLE: ArrangerStyle = {
  id: 'glitch',
  name: 'Glitch',
  category: 'experimental',
  subcategory: 'electronic',
  description: 'Broken beats, stuttered textures, and digital artifacts',
  tempoRange: { min: 110, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Glitch Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('synth', 'synth', 'Stutter Synth', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('texture', 'synth', 'Digital Noise', { volume: 0.5, pan: -0.25, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Broken',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 85, { octaveOffset: -1 }),
            step(0.25, 'root', 0.125, 70, { octaveOffset: -1 }),
            step(0.375, 'root', 0.125, 75, { octaveOffset: -1 }),
            step(1, 'fifth', 0.5, 80, { octaveOffset: -1 }),
            step(2, 'root', 0.25, 85, { octaveOffset: -1 }),
            step(2.5, 'third', 0.25, 75, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.15,
        },
        {
          voiceId: 'synth',
          lengthBeats: 2,
          steps: [
            step(0, 'third', 0.0625, 60, { probability: 0.7 }),
            step(0.125, 'fifth', 0.0625, 55, { probability: 0.6 }),
            step(0.25, 'seventh', 0.0625, 65, { probability: 0.8 }),
            step(0.5, 'ninth', 0.125, 70, { probability: 0.5 }),
            step(1, 'root', 0.0625, 60, { probability: 0.7 }),
            step(1.5, 'third', 0.125, 65, { probability: 0.6 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.2,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 95),
          drum(0.75, 'kick', 70),
          drum(1, 'snare', 85),
          drum(1.875, 'snare', 60),
          drum(2, 'kick', 90),
          drum(2.625, 'kick', 65),
          drum(3, 'snare', 85),
          // Irregular hi-hats
          ...Array.from({ length: 32 }, (_, i) => drum(i * 0.125, 'hihat-closed', 40 + Math.random() * 30)),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['glitch', 'experimental', 'electronic', 'broken', 'stutter'],
  icon: '⚡',
};

/**
 * IDM - Aphex Twin style intricate electronic music
 */
export const IDM_STYLE: ArrangerStyle = {
  id: 'idm',
  name: 'IDM',
  category: 'experimental',
  subcategory: 'electronic',
  description: 'Intelligent Dance Music with complex rhythms and textures (Aphex Twin style)',
  tempoRange: { min: 120, max: 150 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'IDM Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('lead', 'synth', 'Acid Lead', { volume: 0.7, pan: 0.15, channel: 2 }),
    voice('pad', 'pad', 'Micro Pad', { volume: 0.6, pan: -0.2, channel: 3 }),
    voice('arp', 'synth', 'Fast Arp', { volume: 0.55, pan: 0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Complex',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 90, { octaveOffset: -1 }),
            step(1, 'fifth', 0.5, 85, { octaveOffset: -1 }),
            step(1.75, 'third', 0.25, 80, { octaveOffset: -1 }),
            step(2.5, 'seventh', 0.5, 88, { octaveOffset: -1 }),
            step(3.25, 'ninth', 0.25, 82, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.12,
        },
        {
          voiceId: 'lead',
          lengthBeats: 8,
          steps: [
            step(0, 'third', 0.25, 75),
            step(0.75, 'fifth', 0.125, 70),
            step(1.25, 'seventh', 0.5, 78),
            step(2, 'ninth', 0.25, 72),
            step(3, 'root', 0.5, 80, { octaveOffset: 1 }),
            step(4, 'fifth', 0.25, 75, { octaveOffset: 1 }),
            step(5.5, 'third', 0.375, 73),
            step(6.25, 'seventh', 0.25, 70),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.15,
        },
        {
          voiceId: 'arp',
          lengthBeats: 2,
          steps: [
            ...Array.from({ length: 16 }, (_, i) => 
              step(i * 0.125, ['root', 'third', 'fifth', 'seventh'][i % 4] as any, 0.0625, 50 + (i % 3) * 10)
            ),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.1,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 100),
          drum(0.625, 'kick', 75),
          drum(1, 'snare', 90),
          drum(1.875, 'kick', 70),
          drum(2, 'kick', 95),
          drum(2.375, 'snare', 65),
          drum(3, 'snare', 88),
          drum(3.5, 'kick', 78),
          // Complex hi-hat pattern
          ...Array.from({ length: 16 }, (_, i) => {
            const pattern = [1, 0.7, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7];
            return drum(i * 0.25, 'hihat-closed', 45 + (pattern[i % 8] ?? 0.5) * 35);
          }),
        ],
        swing: 0.07,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['idm', 'experimental', 'electronic', 'complex', 'aphex-twin'],
  icon: '🧠',
};

/**
 * Noise - Harsh textures and industrial sounds
 */
export const NOISE_STYLE: ArrangerStyle = {
  id: 'noise',
  name: 'Noise',
  category: 'experimental',
  subcategory: 'industrial',
  description: 'Harsh textures, industrial sounds, and aggressive noise',
  tempoRange: { min: 90, max: 120 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Noise Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('texture', 'synth', 'Harsh Texture', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('fx', 'synth', 'Industrial FX', { volume: 0.6, pan: -0.25, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Harsh',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 2, 100, { octaveOffset: -1 }),
            step(2, 'root', 1, 95, { octaveOffset: -1 }),
            step(3.5, 'fifth', 0.5, 90, { octaveOffset: -1 }),
            step(4, 'root', 2, 100, { octaveOffset: -1 }),
            step(6, 'third', 1, 92, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'texture',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 4, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.1,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(0.5, 'kick', 110),
          drum(1, 'snare', 120),
          drum(2, 'kick', 127),
          drum(2.75, 'kick', 105),
          drum(3, 'snare', 115),
          drum(3.5, 'tom-low', 110),
          // Industrial hi-hats
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 80 + Math.random() * 40)),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['noise', 'experimental', 'industrial', 'harsh', 'aggressive'],
  icon: '⚠️',
};

/**
 * Field Recording - Environmental sounds and found audio
 */
export const FIELD_RECORDING_STYLE: ArrangerStyle = {
  id: 'field-recording',
  name: 'Field Recording',
  category: 'experimental',
  subcategory: 'ambient',
  description: 'Environmental sounds, found audio, and natural textures',
  tempoRange: { min: 0, max: 0 },
  defaultTempo: 0,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('texture', 'sample', 'Environment', { volume: 0.75, pan: 0, channel: 1 }),
    voice('fx', 'sample', 'Found Sounds', { volume: 0.5, pan: 0.3, channel: 2 }),
    voice('ambient', 'pad', 'Nature Drone', { volume: 0.6, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Environmental',
      intensity: 1,
      patterns: [
        {
          voiceId: 'texture',
          lengthBeats: 64,
          steps: [
            step(0, 'root', 64, 50),
          ],
          loop: true,
          swing: 0,
          humanize: 0,
        },
        {
          voiceId: 'ambient',
          lengthBeats: 32,
          steps: [
            step(0, 'root', 32, 40),
            step(0, 'fifth', 32, 38),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 16,
        steps: [],  // No traditional drums
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['field-recording', 'experimental', 'ambient', 'environmental', 'found-sounds'],
  icon: '🎤',
};

/**
 * Musique Concrète - Tape splice techniques and manipulated sounds
 */
export const MUSIQUE_CONCRETE_STYLE: ArrangerStyle = {
  id: 'musique-concrete',
  name: 'Musique Concrète',
  category: 'experimental',
  subcategory: 'avant-garde',
  description: 'Tape splice techniques, manipulated sounds, and concrete music',
  tempoRange: { min: 70, max: 95 },
  defaultTempo: 80,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('sample1', 'sample', 'Tape Loop 1', { volume: 0.8, pan: -0.3, channel: 1 }),
    voice('sample2', 'sample', 'Tape Loop 2', { volume: 0.7, pan: 0.3, channel: 2 }),
    voice('texture', 'synth', 'Manipulated', { volume: 0.6, pan: 0, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Splice',
      intensity: 3,
      patterns: [
        {
          voiceId: 'sample1',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 1.5, 75),
            step(2, 'fifth', 1, 70),
            step(3.5, 'third', 0.5, 65),
            step(5, 'seventh', 1.5, 72),
          ],
          loop: true,
          swing: 0,
          humanize: 0.15,
        },
        {
          voiceId: 'sample2',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 2, 70),
            step(3, 'fifth', 1.5, 68),
            step(4.5, 'third', 1, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.18,
        },
      ],
      drumPattern: {
        lengthBeats: 8,
        steps: [
          // Irregular percussive elements
          drum(0, 'tom-low', 85),
          drum(2.75, 'tom-mid', 70),
          drum(4, 'rim', 65),
          drum(6.5, 'tom-high', 75),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['musique-concrete', 'experimental', 'avant-garde', 'tape-splice', 'manipulated'],
  icon: '📼',
};

/**
 * Generative - Algorithmic and procedural music
 */
export const GENERATIVE_STYLE: ArrangerStyle = {
  id: 'generative',
  name: 'Generative',
  category: 'experimental',
  subcategory: 'algorithmic',
  description: 'Algorithmic and procedural music with evolving patterns',
  tempoRange: { min: 80, max: 110 },
  defaultTempo: 90,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Algo Bass', { volume: 0.75, pan: 0, channel: 1 }),
    voice('synth', 'synth', 'Generative Synth', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('pad', 'pad', 'Evolving Pad', { volume: 0.65, pan: -0.15, channel: 3 }),
    voice('arp', 'synth', 'Procedural Arp', { volume: 0.5, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Algorithmic',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 7,  // Prime number for variation
          steps: [
            step(0, 'root', 1.5, 70, { octaveOffset: -1 }),
            step(2, 'fifth', 1, 68, { octaveOffset: -1 }),
            step(3.5, 'third', 1.5, 72, { octaveOffset: -1 }),
            step(5.5, 'seventh', 1, 65, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.12,
        },
        {
          voiceId: 'synth',
          lengthBeats: 5,  // Prime number for variation
          steps: [
            step(0, 'root', 0.75, 60, { probability: 0.9 }),
            step(1, 'third', 0.5, 58, { probability: 0.85 }),
            step(2, 'fifth', 0.75, 62, { probability: 0.8 }),
            step(3, 'seventh', 0.5, 57, { probability: 0.75 }),
            step(4, 'ninth', 0.5, 60, { probability: 0.85 }),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.15,
        },
        {
          voiceId: 'arp',
          lengthBeats: 3,  // Prime number for variation
          steps: [
            ...Array.from({ length: 12 }, (_, i) => 
              step(i * 0.25, ['root', 'third', 'fifth', 'seventh', 'ninth'][i % 5] as any, 0.125, 45 + (i % 4) * 8, { probability: 0.7 + (i % 3) * 0.1 })
            ),
          ],
          loop: true,
          swing: 0.04,
          humanize: 0.2,
        },
      ],
      drumPattern: {
        lengthBeats: 11,  // Prime number for variation
        steps: [
          drum(0, 'kick', 80),
          drum(2.75, 'kick', 75),
          drum(5.5, 'snare', 75),
          drum(8.25, 'kick', 78),
          // Irregular hi-hats
          ...Array.from({ length: 11 }, (_, i) => drum(i, 'hihat-closed', 40 + (i % 4) * 12)),
        ],
        swing: 0.06,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['generative', 'experimental', 'algorithmic', 'procedural', 'evolving'],
  icon: '🔄',
};

/**
 * Boom Bap - Classic East Coast hip hop with breakbeat drums and jazzy samples
 */
export const BOOM_BAP_STYLE: ArrangerStyle = {
  id: 'boom-bap',
  name: 'Boom Bap',
  category: 'hiphop',
  subcategory: 'east-coast',
  description: 'Classic East Coast hip hop with hard-hitting breakbeat drums, jazzy samples, and dusty loops',
  tempoRange: { min: 85, max: 100 },
  defaultTempo: 92,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Breakbeat Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('keys', 'piano', 'Rhodes', { volume: 0.65, pan: -0.15, channel: 2 }),
    voice('sample', 'sample', 'Jazz Loop', { volume: 0.55, pan: 0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 95, { octaveOffset: -1 }),
            step(1, 'root', 0.5, 85, { octaveOffset: -1 }),
            step(2, 'fifth', 0.5, 90, { octaveOffset: -1 }),
            step(3, 'third', 0.5, 88, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.08,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 70),
            step(0, 'third', 0.5, 68),
            step(0, 'seventh', 0.5, 65),
            step(2, 'fifth', 0.5, 72),
            step(2, 'seventh', 0.5, 70),
            step(2, 'ninth', 0.5, 67),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.1,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 110),
          drum(1, 'snare', 105),
          drum(2, 'kick', 108),
          drum(3, 'snare', 103),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60 + (i % 2 === 0 ? 10 : 0))),
          drum(1.5, 'rim', 50),
          drum(3.5, 'rim', 48),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['boom-bap', 'hip-hop', 'east-coast', 'breakbeat', 'jazzy'],
  icon: '🎤',
};

/**
 * West Coast G-Funk - Synth-heavy West Coast style with funky bass and Parliament influence
 */
export const WEST_COAST_GFUNK_STYLE: ArrangerStyle = {
  id: 'west-coast-gfunk',
  name: 'West Coast G-Funk',
  category: 'hiphop',
  subcategory: 'west-coast',
  description: 'West Coast G-Funk with synthesizer leads, deep funk bass, and smooth grooves',
  tempoRange: { min: 88, max: 105 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Synth Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'West Coast Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('lead', 'synth', 'Whine Lead', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('keys', 'piano', 'Electric Piano', { volume: 0.6, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'G-Funk Groove',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 100, { octaveOffset: -1 }),
            step(0.75, 'root', 0.25, 85, { octaveOffset: -1 }),
            step(1, 'third', 0.5, 95, { octaveOffset: -1 }),
            step(2, 'root', 0.5, 98, { octaveOffset: -1 }),
            step(2.75, 'fifth', 0.25, 88, { octaveOffset: -1 }),
            step(3.5, 'third', 0.5, 92, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.05,
        },
        {
          voiceId: 'lead',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.5, 75, { octaveOffset: 1 }),
            step(0.5, 'third', 0.5, 72),
            step(1, 'fifth', 0.5, 78, { octaveOffset: 1 }),
            step(1.5, 'seventh', 0.5, 75),
          ],
          loop: true,
          swing: 0.08,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 105),
          drum(2, 'kick', 103),
          drum(1, 'snare', 98),
          drum(3, 'snare', 96),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          drum(1.5, 'clap', 50),
          drum(3.5, 'clap', 48),
        ],
        swing: 0.08,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['g-funk', 'hip-hop', 'west-coast', 'funky', 'synthesizer'],
  icon: '🌴',
};

/**
 * Trap Atlanta - Modern trap with hi-hat rolls and 808 bass
 */
export const TRAP_ATLANTA_STYLE: ArrangerStyle = {
  id: 'trap-atlanta',
  name: 'Trap Atlanta',
  category: 'hiphop',
  subcategory: 'trap',
  description: 'Modern Atlanta trap with hi-hat rolls, deep 808s, and aggressive energy',
  tempoRange: { min: 135, max: 155 },
  defaultTempo: 145,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', '808 Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Trap Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Dark Synth', { volume: 0.65, pan: 0.15, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Trap Flow',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 110, { octaveOffset: -1 }),
            step(1.5, 'root', 0.5, 105, { octaveOffset: -1 }),
            step(2.5, 'fifth', 0.75, 108, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'synth',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 4, 60),
            step(0, 'fifth', 4, 58),
            step(4, 'third', 4, 62),
            step(4, 'seventh', 4, 60),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 115),
          drum(1, 'snare', 100),
          drum(2, 'kick', 112),
          drum(3, 'snare', 98),
          // Hi-hat rolls (32nd notes)
          ...Array.from({ length: 32 }, (_, i) => drum(i * 0.125, 'hihat-closed', 50 + (i % 8 === 0 ? 25 : i % 4 === 0 ? 15 : i % 2 === 0 ? 10 : 0))),
          drum(0.75, 'rim', 45),
          drum(2.75, 'rim', 43),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['trap', 'hip-hop', 'atlanta', 'modern', '808', 'hi-hat-roll'],
  icon: '💎',
};

/**
 * Drill - Dark sliding 808 bass with aggressive UK/Chicago drill drums
 */
export const DRILL_STYLE: ArrangerStyle = {
  id: 'drill',
  name: 'Drill',
  category: 'hiphop',
  subcategory: 'drill',
  description: 'Dark drill style with sliding 808s, aggressive snares, and menacing atmosphere',
  tempoRange: { min: 130, max: 150 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Sliding 808', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Drill Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Dark Pad', { volume: 0.6, pan: 0.1, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Drill Pattern',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 115, { octaveOffset: -1 }),
            step(0.75, 'third', 0.25, 108, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.5, 110, { octaveOffset: -1 }),
            step(2, 'root', 0.75, 112, { octaveOffset: -1 }),
            step(3, 'seventh', 0.5, 105, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'synth',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 4, 55),
            step(0, 'third', 4, 53),
            step(0, 'fifth', 4, 50),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 118),
          drum(0.5, 'kick', 100),
          drum(1, 'snare', 110),
          drum(1.5, 'rim', 70),
          drum(2, 'kick', 115),
          drum(2.5, 'kick', 98),
          drum(3, 'snare', 108),
          drum(3.75, 'snare', 95),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4 === 0 ? 20 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['drill', 'hip-hop', 'dark', 'aggressive', 'sliding-808'],
  icon: '🔪',
};

/**
 * UK Drill - British drill with syncopated drums and sliding bass
 */
export const UK_DRILL_STYLE: ArrangerStyle = {
  id: 'uk-drill',
  name: 'UK Drill',
  category: 'hiphop',
  subcategory: 'drill',
  description: 'UK drill with syncopated rhythms, sliding 808s, and gritty UK sound',
  tempoRange: { min: 135, max: 145 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'UK 808', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'UK Drill Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Icy Synth', { volume: 0.65, pan: -0.1, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'UK Pattern',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 113, { octaveOffset: -1 }),
            step(0.75, 'fifth', 0.25, 105, { octaveOffset: -1 }),
            step(1.25, 'third', 0.25, 108, { octaveOffset: -1 }),
            step(2, 'root', 0.75, 115, { octaveOffset: -1 }),
            step(3, 'seventh', 0.5, 110, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 116),
          drum(0.75, 'kick', 95),
          drum(1.25, 'snare', 108),
          drum(2, 'kick', 114),
          drum(2.5, 'rim', 75),
          drum(3, 'snare', 106),
          drum(3.5, 'kick', 100),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 58 + (i % 3 === 0 ? 18 : 0))),
        ],
        swing: 0.03,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['uk-drill', 'drill', 'hip-hop', 'uk', 'syncopated'],
  icon: '🇬🇧',
};

/**
 * Cloud Rap - Ethereal, atmospheric hip hop with dreamy production
 */
export const CLOUD_RAP_STYLE: ArrangerStyle = {
  id: 'cloud-rap',
  name: 'Cloud Rap',
  category: 'hiphop',
  subcategory: 'alternative',
  description: 'Ethereal cloud rap with atmospheric pads, reverb-drenched production, and dreamy vibes',
  tempoRange: { min: 65, max: 80 },
  defaultTempo: 70,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Sub Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Cloud Kit', { volume: 0.7, pan: 0, channel: 10 }),
    voice('pad', 'pad', 'Ethereal Pad', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('synth', 'synth', 'Dream Synth', { volume: 0.65, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Cloud Drift',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 85, { octaveOffset: -1 }),
            step(2, 'third', 2, 80, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'pad',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 8, 65),
            step(0, 'third', 8, 63),
            step(0, 'fifth', 8, 60),
            step(0, 'seventh', 8, 58),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 90),
          drum(2, 'kick', 85),
          drum(1, 'snare', 75),
          drum(3, 'snare', 72),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 45 + (i % 2) * 10)),
          drum(1.5, 'rim', 40),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['cloud-rap', 'hip-hop', 'atmospheric', 'ethereal', 'dreamy'],
  icon: '☁️',
};

/**
 * Memphis Phonk - Cowbell-heavy Memphis-style with dark samples
 */
export const MEMPHIS_PHONK_STYLE: ArrangerStyle = {
  id: 'memphis-phonk',
  name: 'Memphis Phonk',
  category: 'hiphop',
  subcategory: 'phonk',
  description: 'Memphis phonk with heavy cowbells, dark samples, and underground vibe',
  tempoRange: { min: 120, max: 145 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Heavy Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Memphis Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('sample', 'sample', 'Dark Sample', { volume: 0.7, pan: 0.1, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Phonk Groove',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 105, { octaveOffset: -1 }),
            step(1, 'root', 0.25, 95, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.25, 98, { octaveOffset: -1 }),
            step(2, 'third', 0.5, 100, { octaveOffset: -1 }),
            step(3, 'root', 0.5, 103, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.06,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 115),
          drum(1, 'snare', 105),
          drum(2, 'kick', 112),
          drum(3, 'snare', 103),
          // Heavy cowbell pattern
          drum(0, 'cowbell', 100),
          drum(0.5, 'cowbell', 90),
          drum(1, 'cowbell', 105),
          drum(1.5, 'cowbell', 95),
          drum(2, 'cowbell', 100),
          drum(2.5, 'cowbell', 90),
          drum(3, 'cowbell', 105),
          drum(3.5, 'cowbell', 95),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60 + (i % 2) * 12)),
        ],
        swing: 0.06,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['phonk', 'hip-hop', 'memphis', 'cowbell', 'dark'],
  icon: '🔔',
};

/**
 * Old School Hip Hop - Classic breakbeat-based hip hop from the golden era
 */
export const OLD_SCHOOL_HIPHOP_STYLE: ArrangerStyle = {
  id: 'old-school-hiphop',
  name: 'Old School Hip Hop',
  category: 'hiphop',
  subcategory: 'classic',
  description: 'Old school hip hop with breakbeats, simple bass, and classic drum machine sounds',
  tempoRange: { min: 92, max: 105 },
  defaultTempo: 98,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Classic Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', '808 Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('scratch', 'sample', 'DJ Scratch', { volume: 0.65, pan: 0.2, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Old School',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 100, { octaveOffset: -1 }),
            step(1, 'root', 0.5, 95, { octaveOffset: -1 }),
            step(2, 'fifth', 0.5, 98, { octaveOffset: -1 }),
            step(3, 'root', 0.5, 97, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick-808', 110),
          drum(1, 'snare-808', 105),
          drum(2, 'kick-808', 108),
          drum(3, 'snare-808', 103),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-808', 65 + (i % 2) * 15)),
          drum(0.75, 'clap', 60),
          drum(2.75, 'clap', 58),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['old-school', 'hip-hop', 'breakbeat', 'classic', 'golden-era'],
  icon: '📻',
};

/**
 * Conscious Hip Hop - Jazzy, introspective hip hop with live instrumentation feel
 */
export const CONSCIOUS_HIPHOP_STYLE: ArrangerStyle = {
  id: 'conscious-hiphop',
  name: 'Conscious Hip Hop',
  category: 'hiphop',
  subcategory: 'conscious',
  description: 'Conscious hip hop with jazzy samples, live bass, and introspective vibes',
  tempoRange: { min: 85, max: 98 },
  defaultTempo: 90,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Upright Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Jazz Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('keys', 'piano', 'Rhodes', { volume: 0.7, pan: -0.15, channel: 2 }),
    voice('sample', 'sample', 'Jazz Sample', { volume: 0.6, pan: 0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Conscious Flow',
      intensity: 2,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 90, { octaveOffset: -1 }),
            step(1, 'third', 0.5, 85, { octaveOffset: -1 }),
            step(2, 'fifth', 0.75, 88, { octaveOffset: -1 }),
            step(3, 'third', 0.5, 86, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.12,
          humanize: 0.12,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 68),
            step(0, 'third', 0.5, 66),
            step(0, 'seventh', 0.5, 63),
            step(0, 'ninth', 0.5, 61),
            step(2, 'fifth', 0.5, 70),
            step(2, 'seventh', 0.5, 68),
            step(2, 'ninth', 0.5, 65),
            step(2, 'eleventh', 0.5, 63),
          ],
          loop: true,
          swing: 0.12,
          humanize: 0.15,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 95),
          drum(1, 'snare', 90),
          drum(2, 'kick', 93),
          drum(3, 'snare', 88),
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'ride', 55 + (i % 2) * 10)),
          drum(1.5, 'rim', 45),
        ],
        swing: 0.12,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['conscious', 'hip-hop', 'jazzy', 'introspective', 'samples'],
  icon: '🎓',
};

/**
 * Southern Crunk - Aggressive Southern hip hop with chant-style energy
 */
export const SOUTHERN_CRUNK_STYLE: ArrangerStyle = {
  id: 'southern-crunk',
  name: 'Southern Crunk',
  category: 'hiphop',
  subcategory: 'southern',
  description: 'Aggressive Southern crunk with heavy drums, synthesized leads, and high-energy chants',
  tempoRange: { min: 70, max: 85 },
  defaultTempo: 75,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Crunk Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Crunk Kit', { volume: 0.95, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Lead Synth', { volume: 0.75, pan: 0.15, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Crunk Energy',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 115, { octaveOffset: -1 }),
            step(1.5, 'root', 0.5, 108, { octaveOffset: -1 }),
            step(2.5, 'fifth', 0.5, 110, { octaveOffset: -1 }),
            step(3.5, 'third', 0.5, 105, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'synth',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.25, 95, { octaveOffset: 1 }),
            step(0.5, 'fifth', 0.25, 92, { octaveOffset: 1 }),
            step(1, 'root', 0.25, 98, { octaveOffset: 1 }),
            step(1.5, 'third', 0.25, 95, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 120),
          drum(1, 'snare', 115),
          drum(2, 'kick', 118),
          drum(3, 'snare', 113),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 70 + (i % 4 === 0 ? 25 : 0))),
          drum(1.5, 'clap', 80),
          drum(3.5, 'clap', 78),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['crunk', 'hip-hop', 'southern', 'aggressive', 'high-energy'],
  icon: '⚡',
};

/**
 * Hyphy - Bay Area hyphy with high-energy synths and vocal chops
 */
export const HYPHY_STYLE: ArrangerStyle = {
  id: 'hyphy',
  name: 'Hyphy',
  category: 'hiphop',
  subcategory: 'bay-area',
  description: 'Bay Area hyphy with high-energy synths, fast hi-hats, and vocal chops',
  tempoRange: { min: 95, max: 110 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Hyphy Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Hyphy Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Lead Synth', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('chops', 'synth', 'Vocal Chops', { volume: 0.65, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Hyphy Energy',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 110, { octaveOffset: -1 }),
            step(1, 'root', 0.5, 105, { octaveOffset: -1 }),
            step(2, 'fifth', 0.75, 108, { octaveOffset: -1 }),
            step(3, 'root', 0.5, 105, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'synth',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 100, { octaveOffset: 1 }),
            step(0.75, 'third', 0.25, 95, { octaveOffset: 1 }),
            step(1.5, 'fifth', 0.25, 98, { octaveOffset: 1 }),
            step(2, 'root', 0.25, 100, { octaveOffset: 1 }),
            step(2.75, 'third', 0.25, 95, { octaveOffset: 1 }),
            step(3.5, 'fifth', 0.25, 98, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 118),
          drum(2, 'kick', 115),
          drum(1, 'snare', 110),
          drum(3, 'snare', 108),
          ...Array.from({ length: 32 }, (_, i) => drum(i * 0.125, 'hihat-closed', 65 + (i % 8 === 0 ? 30 : 0))),
          drum(0.75, 'clap', 75),
          drum(2.75, 'clap', 73),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['hyphy', 'hip-hop', 'bay-area', 'energetic', 'synths'],
  icon: '🌉',
};

/**
 * Trip Hop - Downtempo atmospheric hip-hop with jazz influences
 */
export const TRIP_HOP_STYLE: ArrangerStyle = {
  id: 'trip-hop',
  name: 'Trip Hop',
  category: 'hiphop',
  subcategory: 'alternative',
  description: 'Downtempo atmospheric trip-hop with jazz samples, breakbeats, and dark mood',
  tempoRange: { min: 70, max: 90 },
  defaultTempo: 80,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Deep Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Breakbeat Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('pad', 'pad', 'Atmospheric Pad', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('keys', 'electric-piano', 'Rhodes', { volume: 0.65, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Atmospheric',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1.5, 95, { octaveOffset: -1 }),
            step(2, 'fifth', 1.5, 90, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.03,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0.5, 'third', 0.5, 75, { octaveOffset: 0 }),
            step(1.5, 'fifth', 0.75, 70, { octaveOffset: 0 }),
            step(3, 'root', 0.5, 72, { octaveOffset: 0 }),
          ],
          loop: true,
          swing: 0.15,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 100),
          drum(0.75, 'kick', 85),
          drum(2.5, 'kick', 95),
          drum(1, 'snare', 105),
          drum(3, 'snare', 100),
          drum(0, 'hihat-open', 60),
          drum(0.5, 'hihat-closed', 55),
          drum(1, 'hihat-closed', 65),
          drum(1.5, 'hihat-closed', 55),
          drum(2, 'hihat-open', 60),
          drum(2.5, 'hihat-closed', 55),
          drum(3, 'hihat-closed', 65),
          drum(3.5, 'hihat-closed', 55),
        ],
        swing: 0.15,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['trip-hop', 'hip-hop', 'downtempo', 'atmospheric', 'jazz', 'dark'],
  icon: '🌙',
};

/**
 * UK Garage - Two-step garage with syncopated rhythms and sub-bass
 */
export const UK_GARAGE_STYLE: ArrangerStyle = {
  id: 'uk-garage',
  name: 'UK Garage',
  category: 'hiphop',
  subcategory: 'uk',
  description: 'UK garage with two-step rhythm, shuffled percussion, and deep sub-bass',
  tempoRange: { min: 125, max: 135 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Sub Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Garage Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('reese', 'synth', 'Reese Bass', { volume: 0.75, pan: 0, channel: 2 }),
    voice('vocal', 'synth', 'Vocal Stab', { volume: 0.7, pan: 0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Two-Step',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 115, { octaveOffset: -1 }),
            step(0.5, 'root', 0.25, 108, { octaveOffset: -1 }),
            step(1, 'fifth', 0.5, 112, { octaveOffset: -1 }),
            step(2, 'root', 0.5, 115, { octaveOffset: -1 }),
            step(2.5, 'root', 0.25, 108, { octaveOffset: -1 }),
            step(3, 'third', 0.5, 112, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.2,
          humanize: 0.02,
        },
        {
          voiceId: 'reese',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.25, 90, { octaveOffset: 0 }),
            step(0.75, 'fifth', 0.25, 88, { octaveOffset: 0 }),
            step(1.5, 'third', 0.25, 85, { octaveOffset: 0 }),
          ],
          loop: true,
          swing: 0.2,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 120),
          drum(1, 'snare', 115),
          drum(3, 'kick', 118),
          drum(3.75, 'snare', 110),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 70 + (i % 4 === 0 ? 20 : 0))),
          drum(0.5, 'rim', 65),
          drum(2.5, 'rim', 63),
        ],
        swing: 0.2,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['uk-garage', 'garage', 'two-step', 'electronic', 'sub-bass'],
  icon: '🇬🇧',
};

/**
 * Grime - UK grime with aggressive synths and rapid hi-hats
 */
export const GRIME_STYLE: ArrangerStyle = {
  id: 'grime',
  name: 'Grime',
  category: 'hiphop',
  subcategory: 'uk',
  description: 'UK grime with aggressive square-wave synths, rapid hi-hats, and heavy sub-bass',
  tempoRange: { min: 135, max: 145 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Sub Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Grime Kit', { volume: 0.95, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Square Lead', { volume: 0.8, pan: 0, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Aggressive',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 120, { octaveOffset: -1 }),
            step(0.75, 'root', 0.25, 112, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.5, 118, { octaveOffset: -1 }),
            step(2, 'root', 0.5, 120, { octaveOffset: -1 }),
            step(2.75, 'third', 0.25, 115, { octaveOffset: -1 }),
            step(3.5, 'fifth', 0.5, 118, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'synth',
          lengthBeats: 1,
          steps: [
            step(0, 'root', 0.125, 105, { octaveOffset: 1 }),
            step(0.25, 'fifth', 0.125, 100, { octaveOffset: 1 }),
            step(0.5, 'third', 0.125, 103, { octaveOffset: 1 }),
            step(0.75, 'root', 0.125, 105, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 122),
          drum(1, 'snare', 118),
          drum(2, 'kick', 120),
          drum(3, 'snare', 115),
          ...Array.from({ length: 32 }, (_, i) => drum(i * 0.125, 'hihat-closed', 75 + (i % 8 === 0 ? 25 : 0))),
          drum(1.5, 'rim', 85),
          drum(3.5, 'rim', 83),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['grime', 'hip-hop', 'uk', 'aggressive', 'electronic'],
  icon: '⚔️',
};

/**
 * Abstract Hip Hop - Experimental hip-hop with unusual samples and rhythms
 */
export const ABSTRACT_HIPHOP_STYLE: ArrangerStyle = {
  id: 'abstract-hiphop',
  name: 'Abstract Hip Hop',
  category: 'hiphop',
  subcategory: 'experimental',
  description: 'Experimental abstract hip-hop with unusual samples, off-kilter rhythms, and lo-fi textures',
  tempoRange: { min: 80, max: 95 },
  defaultTempo: 85,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Abstract Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Lo-Fi Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('texture', 'pad', 'Textural Pad', { volume: 0.65, pan: 0.25, channel: 2 }),
    voice('keys', 'electric-piano', 'Dusty Keys', { volume: 0.6, pan: -0.25, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Off-Kilter',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 90, { octaveOffset: -1 }),
            step(1.25, 'fifth', 0.5, 85, { octaveOffset: -1 }),
            step(2.5, 'third', 0.75, 88, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.25,
          humanize: 0.06,
        },
        {
          voiceId: 'keys',
          lengthBeats: 4,
          steps: [
            step(0.75, 'third', 0.5, 70, { octaveOffset: 0 }),
            step(2, 'fifth', 0.75, 68, { octaveOffset: 0 }),
            step(3.25, 'root', 0.5, 65, { octaveOffset: 0 }),
          ],
          loop: true,
          swing: 0.25,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 95),
          drum(0.75, 'kick', 80),
          drum(2.25, 'kick', 90),
          drum(1, 'snare', 100),
          drum(3.25, 'snare', 95),
          drum(0.5, 'hihat-closed', 60),
          drum(1.25, 'hihat-open', 65),
          drum(2, 'hihat-closed', 55),
          drum(2.75, 'hihat-closed', 58),
          drum(3.5, 'hihat-open', 62),
        ],
        swing: 0.25,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['abstract', 'hip-hop', 'experimental', 'lo-fi', 'avant-garde'],
  icon: '🎨',
};

/**
 * Trance - Uplifting arpeggios and euphoric builds
 */
export const TRANCE_STYLE: ArrangerStyle = {
  id: 'trance',
  name: 'Trance',
  category: 'electronic',
  subcategory: 'dance',
  description: 'Trance with uplifting arpeggios, rolling basslines, and euphoric energy',
  tempoRange: { min: 132, max: 144 },
  defaultTempo: 138,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Trance Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Trance Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('arp', 'synth', 'Uplifting Arp', { volume: 0.75, pan: 0.2, channel: 2 }),
    voice('pad', 'pad', 'Euphoric Pad', { volume: 0.7, pan: -0.2, channel: 3 }),
    voice('lead', 'synth', 'Trance Lead', { volume: 0.65, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Uplifting',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(0.25, 'root', 0.25, 95, { octaveOffset: -1 }),
            step(0.5, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(0.75, 'root', 0.25, 95, { octaveOffset: -1 }),
            step(1, 'fifth', 0.25, 98, { octaveOffset: -1 }),
            step(1.25, 'fifth', 0.25, 92, { octaveOffset: -1 }),
            step(1.5, 'fifth', 0.25, 98, { octaveOffset: -1 }),
            step(1.75, 'fifth', 0.25, 92, { octaveOffset: -1 }),
            step(2, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(2.25, 'root', 0.25, 95, { octaveOffset: -1 }),
            step(2.5, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(2.75, 'root', 0.25, 95, { octaveOffset: -1 }),
            step(3, 'third', 0.25, 98, { octaveOffset: -1 }),
            step(3.25, 'third', 0.25, 92, { octaveOffset: -1 }),
            step(3.5, 'third', 0.25, 98, { octaveOffset: -1 }),
            step(3.75, 'third', 0.25, 92, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'arp',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.125, 75, { octaveOffset: 1 }),
            step(0.25, 'fifth', 0.125, 72, { octaveOffset: 1 }),
            step(0.5, 'root', 0.125, 78, { octaveOffset: 2 }),
            step(0.75, 'third', 0.125, 75, { octaveOffset: 2 }),
            step(1, 'root', 0.125, 73, { octaveOffset: 1 }),
            step(1.25, 'fifth', 0.125, 70, { octaveOffset: 1 }),
            step(1.5, 'root', 0.125, 76, { octaveOffset: 2 }),
            step(1.75, 'third', 0.125, 73, { octaveOffset: 2 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'kick', 115)),
          drum(1, 'snare', 90),
          drum(3, 'snare', 88),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4) * 12)),
          drum(0, 'clap', 85),
          drum(2, 'clap', 83),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['trance', 'electronic', 'dance', 'uplifting', 'euphoric'],
  icon: '🎆',
};

/**
 * Psytrance - Driving 16ths and psychedelic energy
 */
export const PSYTRANCE_STYLE: ArrangerStyle = {
  id: 'psytrance',
  name: 'Psytrance',
  category: 'electronic',
  subcategory: 'trance',
  description: 'Psytrance with driving 16th basslines, hypnotic leads, and psychedelic textures',
  tempoRange: { min: 140, max: 150 },
  defaultTempo: 145,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Psy Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Psy Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('lead', 'synth', 'Psy Lead', { volume: 0.7, pan: 0.2, channel: 2 }),
    voice('fx', 'synth', 'Psy FX', { volume: 0.6, pan: -0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Driving',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 1,
          steps: [
            step(0, 'root', 0.0625, 110, { octaveOffset: -1 }),
            step(0.125, 'root', 0.0625, 105, { octaveOffset: -1 }),
            step(0.25, 'root', 0.0625, 115, { octaveOffset: -1 }),
            step(0.375, 'root', 0.0625, 108, { octaveOffset: -1 }),
            step(0.5, 'fifth', 0.0625, 112, { octaveOffset: -1 }),
            step(0.625, 'fifth', 0.0625, 107, { octaveOffset: -1 }),
            step(0.75, 'root', 0.0625, 113, { octaveOffset: -1 }),
            step(0.875, 'root', 0.0625, 106, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'kick', 120)),
          drum(1, 'snare', 85),
          drum(3, 'snare', 83),
          ...Array.from({ length: 32 }, (_, i) => drum(i * 0.125, 'hihat-closed', 50 + (i % 5) * 10)),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['psytrance', 'electronic', 'trance', 'psychedelic', 'driving'],
  icon: '🌀',
};

/**
 * Goa Trance - Acid sequences and melodic journeys
 */
export const GOA_TRANCE_STYLE: ArrangerStyle = {
  id: 'goa-trance',
  name: 'Goa Trance',
  category: 'electronic',
  subcategory: 'trance',
  description: 'Goa trance with acid sequences, ethnic samples, and spiritual energy',
  tempoRange: { min: 138, max: 148 },
  defaultTempo: 142,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Goa Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Goa Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('acid', 'synth', 'Acid Line', { volume: 0.75, pan: 0.15, channel: 2 }),
    voice('pad', 'pad', 'Goa Pad', { volume: 0.65, pan: -0.15, channel: 3 }),
    voice('lead', 'synth', 'Goa Lead', { volume: 0.7, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Acidic',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.25, 105, { octaveOffset: -1 }),
            step(0.5, 'root', 0.25, 100, { octaveOffset: -1 }),
            step(1, 'fifth', 0.25, 103, { octaveOffset: -1 }),
            step(1.5, 'root', 0.25, 98, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'acid',
          lengthBeats: 1,
          steps: [
            step(0, 'root', 0.0625, 80, { octaveOffset: 1 }),
            step(0.125, 'third', 0.0625, 75, { octaveOffset: 1 }),
            step(0.25, 'fifth', 0.0625, 85, { octaveOffset: 1 }),
            step(0.375, 'seventh', 0.0625, 78, { octaveOffset: 1 }),
            step(0.5, 'root', 0.0625, 82, { octaveOffset: 2 }),
            step(0.625, 'fifth', 0.0625, 76, { octaveOffset: 1 }),
            step(0.75, 'third', 0.0625, 83, { octaveOffset: 1 }),
            step(0.875, 'root', 0.0625, 77, { octaveOffset: 1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'kick', 115)),
          drum(2, 'snare', 90),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4) * 15)),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['goa-trance', 'electronic', 'trance', 'acid', 'psychedelic'],
  icon: '🕉️',
};

/**
 * Hardstyle - Hard kick and euphoric melodies
 */
export const HARDSTYLE_STYLE: ArrangerStyle = {
  id: 'hardstyle',
  name: 'Hardstyle',
  category: 'electronic',
  subcategory: 'hard-dance',
  description: 'Hardstyle with distorted kicks, reverse bass, and euphoric leads',
  tempoRange: { min: 145, max: 155 },
  defaultTempo: 150,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Hardstyle Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Hardstyle Kit', { volume: 0.9, pan: 0, channel: 10 }),
    voice('lead', 'synth', 'Hardstyle Lead', { volume: 0.75, pan: 0.1, channel: 2 }),
    voice('pad', 'pad', 'Euphoric Pad', { volume: 0.65, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Hard',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 1,
          steps: [
            step(0, 'root', 0.25, 127, { octaveOffset: -1 }),
            step(0.5, 'root', 0.25, 120, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 127),
          drum(0.5, 'kick', 120),
          drum(1, 'kick', 127),
          drum(1.5, 'kick', 120),
          drum(2, 'kick', 127),
          drum(2.5, 'kick', 120),
          drum(3, 'kick', 127),
          drum(3.5, 'kick', 120),
          drum(1, 'clap', 110),
          drum(3, 'clap', 108),
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4) * 15)),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['hardstyle', 'electronic', 'hard-dance', 'kick', 'euphoric'],
  icon: '⚡',
};

/**
 * Gabber - Extreme tempo hardcore
 */
export const GABBER_STYLE: ArrangerStyle = {
  id: 'gabber',
  name: 'Gabber',
  category: 'electronic',
  subcategory: 'hardcore',
  description: 'Gabber hardcore with extreme tempo, distorted kicks, and aggressive energy',
  tempoRange: { min: 170, max: 190 },
  defaultTempo: 180,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Gabber Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Gabber Kit', { volume: 0.95, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Hoover Synth', { volume: 0.7, pan: 0.2, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Extreme',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 1,
          steps: [
            step(0, 'root', 0.25, 127, { octaveOffset: -1 }),
            step(0.5, 'root', 0.25, 125, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'kick', 127)),
          drum(1, 'snare', 115),
          drum(3, 'snare', 113),
          ...Array.from({ length: 32 }, (_, i) => drum(i * 0.125, 'hihat-closed', 70 + (i % 3) * 10)),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['gabber', 'electronic', 'hardcore', 'extreme', 'distorted'],
  icon: '💥',
};

/**
 * Breakbeat - Funky breaks and syncopated grooves
 */
export const BREAKBEAT_STYLE: ArrangerStyle = {
  id: 'breakbeat',
  name: 'Breakbeat',
  category: 'electronic',
  subcategory: 'breaks',
  description: 'Breakbeat with funky breaks, syncopated basslines, and energetic grooves',
  tempoRange: { min: 125, max: 135 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth', 'Break Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Break Kit', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Break Synth', { volume: 0.7, pan: 0.15, channel: 2 }),
    voice('pad', 'pad', 'Break Pad', { volume: 0.6, pan: -0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Funky',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.25, 105, { octaveOffset: -1 }),
            step(0.5, 'fifth', 0.25, 95, { octaveOffset: -1 }),
            step(0.75, 'root', 0.125, 90, { octaveOffset: -1 }),
            step(1, 'third', 0.25, 100, { octaveOffset: -1 }),
            step(1.5, 'root', 0.5, 110, { octaveOffset: -1 }),
          ],
          loop: true,
          swing: 0.1,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'kick', 115),
          drum(0.75, 'kick', 95),
          drum(1.5, 'kick', 105),
          drum(2, 'kick', 120),
          drum(2.875, 'kick', 100),
          drum(3.5, 'kick', 110),
          drum(1, 'snare', 110),
          drum(2.5, 'snare', 105),
          drum(3, 'snare', 95),
          drum(3.75, 'snare', 100),
          ...Array.from({ length: 16 }, (_, i) => {
            const vel = 55 + (i % 5) * 12;
            return drum(i * 0.25, 'hihat-closed', vel);
          }),
        ],
        swing: 0.1,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['breakbeat', 'electronic', 'breaks', 'funky', 'syncopated'],
  icon: '🔨',
};

/**
 * Afrobeat - Nigerian polyrhythm
 */
export const AFROBEAT_STYLE: ArrangerStyle = {
  id: 'afrobeat',
  name: 'Afrobeat',
  category: 'world',
  subcategory: 'african',
  description: 'Nigerian Afrobeat with Tony Allen-style drums and Fela-inspired horns',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Afro Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Afrobeat Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Afro Guitar', { volume: 0.75, pan: -0.2, channel: 2 }),
    voice('keys', 'piano', 'Electric Piano', { volume: 0.65, pan: 0.1, channel: 3 }),
    voice('brass', 'brass', 'Afro Horns', { volume: 0.7, pan: 0.2, channel: 4 }),
    voice('perc', 'percussion', 'Shekere', { volume: 0.5, pan: 0.3, channel: 5 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Groove',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 90),
            step(0.75, 'root', 0.25, 70),
            step(1.5, 'fifth', 0.5, 85),
            step(2, 'root', 0.5, 95),
            step(2.75, 'third', 0.25, 75),
            step(3, 'fifth', 0.5, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            step(0, 'root', 0.125, 65),
            step(0.5, 'root', 0.125, 70),
            step(1, 'root', 0.125, 65),
            step(1.5, 'root', 0.125, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 8,
        steps: [
          drum(0, 'kick', 100),
          drum(2.75, 'kick', 85),
          drum(3.5, 'kick', 90),
          drum(4, 'kick', 100),
          drum(6.5, 'kick', 85),
          drum(7.75, 'kick', 90),
          drum(2, 'snare', 95),
          drum(6, 'snare', 95),
          // Complex hi-hat pattern
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 50 + (i % 4 === 0 ? 20 : i % 2 === 0 ? 10 : 0))),
          drum(2.5, 'hihat-open', 70),
          drum(6.5, 'hihat-open', 70),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['afrobeat', 'world', 'african', 'nigerian', 'fela', 'polyrhythm'],
  icon: '🌍',
};

/**
 * Soca - Fast calypso variant
 * Energetic Trinidad carnival music with syncopated brass and driving rhythm
 */
export const SOCA_STYLE: ArrangerStyle = {
  id: 'soca',
  name: 'Soca',
  category: 'world',
  subcategory: 'caribbean',
  description: 'Fast Trinidad soca with syncopated brass, driving kick, and steel pan melodies',
  tempoRange: { min: 130, max: 145 },
  defaultTempo: 135,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Soca Bass', { volume: 0.9, pan: 0, channel: 1 }),
    voice('drums', 'percussion', 'Soca Drums', { volume: 0.85, pan: 0, channel: 10 }),
    voice('brass', 'brass', 'Brass Section', { volume: 0.8, pan: 0, channel: 2 }),
    voice('steelpan', 'mallet', 'Steel Pan', { volume: 0.75, pan: 0.2, channel: 3 }),
    voice('synth', 'synth', 'Soca Synth', { volume: 0.7, pan: -0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Power Soca',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Driving soca bass
            step(0, 'root', 0.5, 100),
            step(0.5, 'root', 0.25, 85),
            step(1, 'root', 0.5, 95),
            step(1.75, 'fifth', 0.25, 80),
            step(2, 'root', 0.5, 100),
            step(2.5, 'root', 0.25, 85),
            step(3, 'root', 0.5, 95),
            step(3.75, 'third', 0.25, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'brass',
          lengthBeats: 4,
          steps: [
            // Syncopated brass hits
            step(0.5, 'root', 0.25, 95),
            step(1.5, 'third', 0.25, 90),
            step(2.5, 'fifth', 0.25, 95),
            step(3, 'root', 0.5, 100),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'steelpan',
          lengthBeats: 2,
          steps: [
            // Fast steel pan melody
            step(0, 'root', 0.25, 75),
            step(0.25, 'third', 0.25, 70),
            step(0.5, 'fifth', 0.25, 78),
            step(0.75, 'root', 0.25, 72),
            step(1, 'third', 0.25, 80),
            step(1.25, 'fifth', 0.25, 75),
            step(1.5, 'root', 0.25, 78),
            step(1.75, 'third', 0.25, 72),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Driving 4-on-floor with syncopation
          drum(0, 'kick', 100),
          drum(1, 'kick', 100),
          drum(2, 'kick', 100),
          drum(3, 'kick', 100),
          
          // Snare on 2 and 4
          drum(1, 'snare', 95),
          drum(3, 'snare', 95),
          
          // Cowbell pattern
          drum(0, 'cowbell', 85),
          drum(0.5, 'cowbell', 70),
          drum(1, 'cowbell', 90),
          drum(1.5, 'cowbell', 75),
          drum(2, 'cowbell', 85),
          drum(2.5, 'cowbell', 70),
          drum(3, 'cowbell', 90),
          drum(3.5, 'cowbell', 75),
          
          // Shaker continuous
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'shaker', 55 + (i % 4 === 0 ? 12 : 0))),
          
          // Timbale hits
          drum(1.75, 'timbale-high', 80),
          drum(3.75, 'timbale-high', 85),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['soca', 'world', 'caribbean', 'trinidad', 'carnival', 'fast'],
  icon: '🇹🇹',
};

/**
 * Brazilian Funk (Baile Funk) - Brazilian favela funk with heavy bass and rolling snares
 */
export const BRAZILIAN_FUNK_STYLE: ArrangerStyle = {
  id: 'brazilian-funk',
  name: 'Brazilian Funk',
  category: 'world',
  subcategory: 'brazilian',
  description: 'Baile funk with Miami bass influence, tamborzão drums, and vocal-focused arrangement',
  tempoRange: { min: 125, max: 135 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', '808 Bass', { volume: 0.95, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Tamborzão', { volume: 0.85, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Funk Synth', { volume: 0.7, pan: 0.1, channel: 2 }),
    voice('perc', 'percussion', 'Funk Perc', { volume: 0.65, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Tamborzão',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Sub-heavy bass
            step(0, 'root', 1, 100),
            step(1.5, 'root', 0.25, 85),
            step(2, 'root', 1, 100),
            step(3.5, 'fifth', 0.25, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'synth',
          lengthBeats: 4,
          steps: [
            // Simple stab pattern
            step(0.5, 'root', 0.25, 85),
            step(1.5, 'third', 0.25, 80),
            step(2.5, 'fifth', 0.25, 85),
            step(3.5, 'root', 0.25, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Iconic rolling snare pattern
          drum(0, 'kick', 100),
          drum(1, 'snare', 90),
          drum(1.25, 'snare', 75),
          drum(1.5, 'snare', 85),
          drum(1.75, 'snare', 70),
          drum(2, 'kick', 100),
          drum(3, 'snare', 95),
          drum(3.25, 'snare', 80),
          drum(3.5, 'snare', 90),
          drum(3.75, 'snare', 75),
          
          // Hi-hat
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 50 + (i % 2 === 0 ? 15 : 0))),
          
          // Timbale accents
          drum(1.5, 'timbale-high', 85),
          drum(3.5, 'timbale-low', 80),
          
          // Whistle samples (represented as hi percussion)
          drum(2.5, 'whistle', 75),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['brazilian-funk', 'baile-funk', 'world', 'brazilian', 'favela', 'electronic'],
  icon: '🇧🇷',
};

/**
 * K-Pop - Korean pop production with intricate rhythm changes and polished production
 */
export const KPOP_STYLE: ArrangerStyle = {
  id: 'kpop',
  name: 'K-Pop',
  category: 'pop',
  subcategory: 'asian',
  description: 'Korean pop with complex arrangements, tight harmonies, and EDM influences',
  tempoRange: { min: 110, max: 140 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Synth Bass', { volume: 0.85, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'Hybrid Kit', { volume: 0.8, pan: 0, channel: 10 }),
    voice('synth', 'synth', 'Lead Synth', { volume: 0.75, pan: 0.1, channel: 2 }),
    voice('pad', 'pad', 'Vocal Pad', { volume: 0.65, pan: -0.1, channel: 3 }),
    voice('pluck', 'synth', 'Pluck Synth', { volume: 0.7, pan: 0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Verse',
      intensity: 3,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Syncopated synth bass
            step(0, 'root', 0.5, 90),
            step(0.75, 'fifth', 0.25, 75),
            step(1.5, 'root', 0.5, 85),
            step(2, 'root', 0.5, 90),
            step(2.75, 'third', 0.25, 70),
            step(3.5, 'fifth', 0.5, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'pluck',
          lengthBeats: 2,
          steps: [
            // Staccato pluck pattern
            step(0, 'root', 0.125, 70),
            step(0.25, 'third', 0.125, 65),
            step(0.5, 'fifth', 0.125, 72),
            step(0.75, 'root', 0.125, 68),
            step(1, 'third', 0.125, 75),
            step(1.25, 'fifth', 0.125, 70),
            step(1.5, 'root', 0.125, 73),
            step(1.75, 'third', 0.125, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'pad',
          lengthBeats: 4,
          steps: [
            // Sustained harmony
            step(0, 'root', 4, 60),
            step(0, 'third', 4, 58),
            step(0, 'fifth', 4, 56),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Tight electronic drums
          drum(0, 'kick', 100),
          drum(1, 'kick', 95),
          drum(2, 'kick', 100),
          drum(2.75, 'kick', 85),
          drum(3, 'kick', 95),
          
          drum(1, 'snare', 100),
          drum(3, 'snare', 100),
          
          // Hi-hat pattern with triplets
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4 === 0 ? 18 : i % 2 === 0 ? 10 : 0))),
          drum(1.5, 'hihat-open', 75),
          drum(3.5, 'hihat-open', 75),
          
          // Rim click accents
          drum(0.5, 'rimshot', 70),
          drum(2.5, 'rimshot', 72),
          
          // Synth percussion
          drum(1.75, 'clap', 85),
          drum(3.75, 'clap', 85),
        ],
        swing: 0,
      },
    },
    {
      id: 'B',
      name: 'Chorus',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Driving bass
            step(0, 'root', 0.5, 95),
            step(0.5, 'root', 0.25, 80),
            step(1, 'root', 0.5, 100),
            step(1.5, 'fifth', 0.25, 85),
            step(2, 'root', 0.5, 95),
            step(2.5, 'root', 0.25, 80),
            step(3, 'fifth', 0.5, 90),
            step(3.5, 'third', 0.5, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'synth',
          lengthBeats: 4,
          steps: [
            // Lead synth melody
            step(0, 'root', 0.5, 85),
            step(0.5, 'third', 0.5, 80),
            step(1, 'fifth', 1, 90),
            step(2, 'root', 0.5, 85),
            step(2.5, 'fifth', 0.5, 78),
            step(3, 'third', 1, 88),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // EDM-influenced drop
          drum(0, 'kick', 100),
          drum(0.5, 'kick', 100),
          drum(1, 'kick', 100),
          drum(1.5, 'kick', 100),
          drum(2, 'kick', 100),
          drum(2.5, 'kick', 100),
          drum(3, 'kick', 100),
          drum(3.5, 'kick', 100),
          
          drum(1, 'snare', 100),
          drum(3, 'snare', 100),
          
          drum(1, 'clap', 95),
          drum(3, 'clap', 95),
          
          // Rapid hi-hats
          ...Array.from({ length: 32 }, (_, i) => drum(i * 0.125, 'hihat-closed', 50 + (i % 8 === 0 ? 25 : i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          
          // Crash on downbeats
          drum(0, 'crash', 90),
          drum(2, 'crash', 85),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['kpop', 'pop', 'korean', 'asian', 'edm', 'modern'],
  icon: '🇰🇷',
};

/**
 * J-Pop - Japanese pop with sophisticated chord progressions and bright production
 */
export const JPOP_STYLE: ArrangerStyle = {
  id: 'jpop',
  name: 'J-Pop',
  category: 'pop',
  subcategory: 'asian',
  description: 'Japanese pop with lush arrangements, bright tones, and emotional delivery',
  tempoRange: { min: 115, max: 140 },
  defaultTempo: 128,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', 'Electric Bass', { volume: 0.8, pan: 0, channel: 1 }),
    voice('drums', 'drums', 'J-Pop Kit', { volume: 0.78, pan: 0, channel: 10 }),
    voice('guitar', 'guitar', 'Clean Guitar', { volume: 0.75, pan: -0.15, channel: 2 }),
    voice('keys', 'piano', 'Electric Piano', { volume: 0.72, pan: 0.15, channel: 3 }),
    voice('strings', 'strings', 'String Section', { volume: 0.65, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Bright Pop',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Melodic bass line
            step(0, 'root', 0.5, 85),
            step(0.5, 'third', 0.25, 75),
            step(1, 'fifth', 0.5, 80),
            step(1.5, 'root', 0.25, 70),
            step(2, 'root', 0.5, 85),
            step(2.5, 'fifth', 0.25, 75),
            step(3, 'third', 0.5, 80),
            step(3.5, 'root', 0.25, 75),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.03,
        },
        {
          voiceId: 'guitar',
          lengthBeats: 2,
          steps: [
            // Arpeggiated pattern
            step(0, 'root', 0.25, 70),
            step(0.25, 'third', 0.25, 68),
            step(0.5, 'fifth', 0.25, 72),
            step(0.75, 'root', 0.25, 68),
            step(1, 'third', 0.25, 73),
            step(1.25, 'fifth', 0.25, 70),
            step(1.5, 'root', 0.25, 72),
            step(1.75, 'third', 0.25, 68),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.04,
        },
        {
          voiceId: 'strings',
          lengthBeats: 4,
          steps: [
            // Lush string pad
            step(0, 'root', 4, 65),
            step(0, 'third', 4, 63),
            step(0, 'fifth', 4, 60),
            step(0, 'seventh', 4, 58),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Upbeat pop drums
          drum(0, 'kick', 95),
          drum(1, 'kick', 90),
          drum(2, 'kick', 95),
          drum(2.5, 'kick', 80),
          drum(3, 'kick', 90),
          
          drum(1, 'snare', 100),
          drum(3, 'snare', 100),
          
          // Bright hi-hats
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60 + (i % 2 === 0 ? 15 : 0))),
          drum(1.5, 'hihat-open', 78),
          drum(3.5, 'hihat-open', 78),
          
          // Tambourine
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'tambourine', 55 + (i % 2 === 0 ? 10 : 0))),
          
          // Crash on downbeats
          drum(0, 'crash', 85),
        ],
        swing: 0.02,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jpop', 'pop', 'japanese', 'asian', 'bright', 'lush'],
  icon: '🇯🇵',
};

/**
 * Bollywood - Indian film music with tabla, sitar, and orchestral elements
 */
export const BOLLYWOOD_STYLE: ArrangerStyle = {
  id: 'bollywood',
  name: 'Bollywood',
  category: 'world',
  subcategory: 'indian',
  description: 'Indian film music combining traditional instruments with modern production',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 118,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('tabla', 'percussion', 'Tabla', { volume: 0.8, pan: 0, channel: 10 }),
    voice('sitar', 'sitar', 'Sitar', { volume: 0.75, pan: -0.2, channel: 1 }),
    voice('strings', 'strings', 'String Section', { volume: 0.7, pan: 0.15, channel: 2 }),
    voice('keys', 'piano', 'Piano/Synth', { volume: 0.68, pan: 0, channel: 3 }),
    voice('bass', 'bass', 'Bass', { volume: 0.82, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Classical Fusion',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Modal bass line
            step(0, 'root', 1, 85),
            step(1, 'fifth', 0.5, 75),
            step(1.5, 'root', 0.5, 80),
            step(2, 'root', 1, 85),
            step(3, 'fourth', 0.5, 75),
            step(3.5, 'fifth', 0.5, 80),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.04,
        },
        {
          voiceId: 'sitar',
          lengthBeats: 4,
          steps: [
            // Characteristic sitar phrases with bends
            step(0, 'root', 0.5, 75),
            step(0.75, 'second', 0.25, 70),
            step(1, 'third', 0.75, 80),
            step(2, 'fifth', 0.5, 78),
            step(2.75, 'fourth', 0.25, 72),
            step(3, 'third', 0.5, 75),
            step(3.5, 'root', 0.5, 80),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.06,
        },
        {
          voiceId: 'strings',
          lengthBeats: 4,
          steps: [
            // Sweeping string lines
            step(0, 'root', 2, 68),
            step(0, 'third', 2, 66),
            step(0, 'fifth', 2, 64),
            step(2, 'third', 2, 70),
            step(2, 'fifth', 2, 68),
            step(2, 'seventh', 2, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Tabla pattern (dha-dhin-dhin-dha rhythm)
          drum(0, 'tabla-dha', 100),    // Dha (bass + treble)
          drum(0.5, 'tabla-ge', 75),    // Ge (treble muted)
          drum(1, 'tabla-dhin', 95),    // Dhin (bass open)
          drum(1.5, 'tabla-ge', 70),
          drum(2, 'tabla-dhin', 95),
          drum(2.5, 'tabla-ge', 75),
          drum(3, 'tabla-dha', 100),
          drum(3.5, 'tabla-te', 80),    // Te (treble sharp)
          
          // Dholak (barrel drum) accents
          drum(0, 'dholak-bass', 90),
          drum(1, 'dholak-treble', 85),
          drum(2, 'dholak-treble', 85),
          drum(3, 'dholak-bass', 92),
          
          // Manjira (finger cymbals)
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'manjira', 50 + (i % 2 === 0 ? 15 : 0))),
          
          // Modern kick
          drum(0, 'kick', 85),
          drum(2, 'kick', 85),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['bollywood', 'world', 'indian', 'tabla', 'sitar', 'film-music'],
  icon: '🇮🇳',
};

/**
 * Arabic Pop - Middle Eastern pop with oud, qanun, and modern production
 */
export const ARABIC_POP_STYLE: ArrangerStyle = {
  id: 'arabic-pop',
  name: 'Arabic Pop',
  category: 'world',
  subcategory: 'middle-eastern',
  description: 'Contemporary Arabic pop blending traditional maqam with modern production',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('oud', 'oud', 'Oud', { volume: 0.78, pan: -0.15, channel: 1 }),
    voice('qanun', 'qanun', 'Qanun', { volume: 0.72, pan: 0.15, channel: 2 }),
    voice('strings', 'strings', 'String Section', { volume: 0.68, pan: 0, channel: 3 }),
    voice('bass', 'bass', 'Bass', { volume: 0.82, pan: 0, channel: 4 }),
    voice('keys', 'synth', 'Synth Pad', { volume: 0.65, pan: 0, channel: 5 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Modern Tarab',
      intensity: 4,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Characteristic Middle Eastern bass
            step(0, 'root', 0.5, 85),
            step(0.75, 'fifth', 0.25, 75),
            step(1, 'root', 0.5, 80),
            step(1.5, 'fourth', 0.25, 70),
            step(2, 'root', 0.5, 85),
            step(2.5, 'fifth', 0.25, 75),
            step(3, 'root', 0.5, 83),
            step(3.5, 'third', 0.5, 78),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.04,
        },
        {
          voiceId: 'oud',
          lengthBeats: 4,
          steps: [
            // Oud taqsim-inspired phrases
            step(0, 'root', 0.25, 75),
            step(0.375, 'second', 0.125, 68),
            step(0.5, 'third', 0.5, 78),
            step(1.25, 'fourth', 0.25, 72),
            step(1.5, 'fifth', 0.5, 80),
            step(2, 'fifth', 0.25, 75),
            step(2.5, 'fourth', 0.25, 70),
            step(3, 'third', 0.5, 78),
            step(3.5, 'root', 0.5, 82),
          ],
          loop: true,
          swing: 0.03,
          humanize: 0.05,
        },
        {
          voiceId: 'qanun',
          lengthBeats: 2,
          steps: [
            // Qanun arpeggios
            step(0, 'root', 0.125, 68),
            step(0.125, 'third', 0.125, 65),
            step(0.25, 'fifth', 0.125, 70),
            step(0.375, 'root', 0.125, 65),
            step(0.5, 'third', 0.125, 72),
            step(0.625, 'fifth', 0.125, 68),
            step(0.75, 'root', 0.125, 70),
            step(0.875, 'third', 0.125, 66),
            step(1, 'fifth', 0.125, 73),
            step(1.125, 'root', 0.125, 68),
            step(1.25, 'third', 0.125, 70),
            step(1.375, 'fifth', 0.125, 66),
            step(1.5, 'root', 0.125, 72),
            step(1.625, 'third', 0.125, 68),
            step(1.75, 'fifth', 0.125, 70),
            step(1.875, 'root', 0.125, 66),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Tabla baladi / Arabic pop rhythm
          drum(0, 'darbuka-dum', 100),   // Dum (bass center)
          drum(0.75, 'darbuka-tak', 75), // Tak (rim)
          drum(1, 'darbuka-tak', 80),
          drum(1.5, 'darbuka-dum', 95),
          drum(2, 'darbuka-dum', 100),
          drum(2.5, 'darbuka-tak', 78),
          drum(3, 'darbuka-tak', 85),
          drum(3.5, 'darbuka-ka', 72),   // Ka (slap)
          
          // Riq (tambourine) pattern
          ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'riq', 50 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          
          // Modern kick support
          drum(0, 'kick', 80),
          drum(2, 'kick', 78),
          
          // Finger cymbals
          drum(1, 'zills', 70),
          drum(3, 'zills', 72),
        ],
        swing: 0.03,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['arabic', 'world', 'middle-eastern', 'oud', 'maqam', 'tarab'],
  icon: '🪕',
};

/**
 * Flamenco - Spanish flamenco with palmas, castanets, and guitar rasgueado
 */
export const FLAMENCO_STYLE: ArrangerStyle = {
  id: 'flamenco',
  name: 'Flamenco',
  category: 'world',
  subcategory: 'spanish',
  description: 'Passionate Spanish flamenco with hand claps, foot stomps, and nylon guitar',
  tempoRange: { min: 100, max: 180 },
  defaultTempo: 120,
  timeSignature: { numerator: 12, denominator: 8 },
  voices: [
    voice('guitar', 'guitar', 'Flamenco Guitar', { volume: 0.85, pan: 0, channel: 1 }),
    voice('palmas', 'percussion', 'Palmas', { volume: 0.75, pan: -0.1, channel: 10 }),
    voice('cajon', 'percussion', 'Cajón', { volume: 0.78, pan: 0, channel: 11 }),
    voice('bass', 'bass', 'Upright Bass', { volume: 0.72, pan: 0, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Bulería',
      intensity: 5,
      patterns: [
        {
          voiceId: 'guitar',
          lengthBeats: 12,
          steps: [
            // Bulería compás with rasgueado strums
            step(0, 'root', 0.25, 90),
            step(0.25, 'third', 0.25, 85),
            step(0.5, 'fifth', 0.25, 88),
            step(3, 'root', 0.5, 95),
            step(3.5, 'third', 0.25, 80),
            step(4, 'fifth', 0.5, 88),
            step(6, 'root', 0.5, 92),
            step(7, 'third', 0.5, 85),
            step(8, 'fifth', 0.5, 90),
            step(9, 'root', 0.25, 82),
            step(10, 'root', 0.5, 95),
            step(10.5, 'fifth', 0.5, 88),
          ],
          loop: true,
          swing: 0,
          humanize: 0.06,
        },
        {
          voiceId: 'bass',
          lengthBeats: 12,
          steps: [
            // Walking bass following compás
            step(0, 'root', 2, 80),
            step(3, 'fifth', 1.5, 75),
            step(6, 'root', 2, 82),
            step(10, 'third', 2, 78),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 12,
        steps: [
          // Cajón pattern emphasizing bulería accents (3, 6, 8, 10, 12)
          drum(3, 'cajon-bass', 100),
          drum(6, 'cajon-bass', 95),
          drum(8, 'cajon-slap', 90),
          drum(10, 'cajon-bass', 100),
          drum(11, 'cajon-slap', 85),
          
          // Palmas pattern (hand claps) - sorda (muted) and clara (sharp)
          drum(3, 'palmas-clara', 95),
          drum(6, 'palmas-clara', 90),
          drum(8, 'palmas-sorda', 75),
          drum(10, 'palmas-clara', 100),
          drum(11, 'palmas-sorda', 80),
          
          // Zapateado (foot stomps)
          drum(3, 'stomp', 90),
          drum(8, 'stomp', 85),
          drum(10, 'stomp', 95),
          
          // Castanets - continuous triplets
          ...Array.from({ length: 24 }, (_, i) => drum(i * 0.5, 'castanets', 55 + (i % 6 === 0 ? 20 : i % 3 === 0 ? 10 : 0))),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['flamenco', 'world', 'spanish', 'guitar', 'palmas', 'buleria'],
  icon: '💃',
};

/**
 * Flamenco Rumba - Flamenco rumba gitana with palmas and 4/4 rhythm
 */
export const FLAMENCO_RUMBA_STYLE: ArrangerStyle = {
  id: 'flamenco-rumba',
  name: 'Flamenco Rumba',
  category: 'world',
  subcategory: 'spanish',
  description: 'Flamenco rumba style with rumba rhythm pattern and hand claps',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('guitar', 'guitar', 'Flamenco Guitar', { volume: 0.88, pan: 0, channel: 1 }),
    voice('palmas', 'percussion', 'Palmas', { volume: 0.72, pan: -0.1, channel: 10 }),
    voice('cajon', 'percussion', 'Cajón', { volume: 0.75, pan: 0, channel: 11 }),
    voice('bass', 'bass', 'Upright Bass', { volume: 0.70, pan: 0, channel: 2 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Rumba Gitana',
      intensity: 4,
      patterns: [
        {
          voiceId: 'guitar',
          lengthBeats: 4,
          steps: [
            // Rumba strum pattern - down-down-up-up-down-up
            step(0, 'root', 0.25, 92),
            step(0.25, 'third', 0.125, 80),
            step(0.375, 'fifth', 0.125, 82),
            step(0.5, 'root', 0.125, 88),
            step(0.625, 'third', 0.125, 80),
            step(0.75, 'fifth', 0.25, 90),
            step(1, 'root', 0.125, 85),
            step(1.125, 'fifth', 0.125, 78),
            step(1.5, 'third', 0.5, 88),
            step(2, 'root', 0.25, 94),
            step(2.25, 'third', 0.125, 82),
            step(2.375, 'fifth', 0.125, 84),
            step(2.5, 'root', 0.125, 90),
            step(2.625, 'third', 0.125, 82),
            step(2.75, 'fifth', 0.25, 92),
            step(3, 'root', 0.125, 87),
            step(3.125, 'fifth', 0.125, 80),
            step(3.5, 'third', 0.5, 90),
          ],
          loop: true,
          swing: 0.02,
          humanize: 0.05,
        },
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Bass following rumba groove
            step(0, 'root', 1, 82),
            step(1, 'fifth', 0.75, 75),
            step(2, 'root', 1, 84),
            step(3, 'third', 1, 76),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Rumba pattern on cajón
          drum(0, 'cajon-bass', 95),
          drum(0.5, 'cajon-slap', 70),
          drum(1, 'cajon-bass', 90),
          drum(1.5, 'cajon-slap', 75),
          drum(2, 'cajon-bass', 100),
          drum(2.5, 'cajon-slap', 72),
          drum(3, 'cajon-bass', 88),
          drum(3.5, 'cajon-slap', 78),
          
          // Palmas pattern (hand claps)
          drum(0, 'palmas-clara', 90),
          drum(0.5, 'palmas-sorda', 70),
          drum(1, 'palmas-clara', 85),
          drum(1.5, 'palmas-sorda', 68),
          drum(2, 'palmas-clara', 95),
          drum(2.5, 'palmas-sorda', 72),
          drum(3, 'palmas-clara', 88),
          drum(3.5, 'palmas-sorda', 70),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['flamenco', 'world', 'spanish', 'guitar', 'palmas', 'rumba'],
  icon: '💃',
};

/**
 * Klezmer - Jewish dance music with clarinet, accordion, and energetic rhythms
 */
export const KLEZMER_STYLE: ArrangerStyle = {
  id: 'klezmer',
  name: 'Klezmer',
  category: 'world',
  subcategory: 'jewish',
  description: 'Traditional Jewish celebration music with clarinet, violin, and accordion',
  tempoRange: { min: 120, max: 180 },
  defaultTempo: 145,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('clarinet', 'clarinet', 'Clarinet', { volume: 0.82, pan: 0, channel: 1 }),
    voice('violin', 'violin', 'Violin', { volume: 0.78, pan: -0.15, channel: 2 }),
    voice('accordion', 'accordion', 'Accordion', { volume: 0.75, pan: 0.15, channel: 3 }),
    voice('bass', 'bass', 'Upright Bass', { volume: 0.8, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Freylekhs',
      intensity: 5,
      patterns: [
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            // Walking bass in Freylekhs style
            step(0, 'root', 0.5, 90),
            step(0.5, 'fifth', 0.5, 80),
            step(1, 'root', 0.5, 88),
            step(1.5, 'third', 0.5, 78),
            step(2, 'fifth', 0.5, 85),
            step(2.5, 'root', 0.5, 82),
            step(3, 'third', 0.5, 80),
            step(3.5, 'fifth', 0.5, 85),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.05,
        },
        {
          voiceId: 'clarinet',
          lengthBeats: 4,
          steps: [
            // Characteristic klezmer clarinet licks with ornaments
            step(0, 'root', 0.25, 85),
            step(0.25, 'third', 0.125, 80),
            step(0.375, 'root', 0.125, 75),
            step(0.5, 'fifth', 0.5, 90),
            step(1, 'fifth', 0.25, 82),
            step(1.25, 'sixth', 0.25, 78),
            step(1.5, 'seventh', 0.5, 88),
            step(2, 'root', 0.5, 95),
            step(2.75, 'seventh', 0.25, 80),
            step(3, 'sixth', 0.5, 85),
            step(3.5, 'fifth', 0.5, 90),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.07,
        },
        {
          voiceId: 'accordion',
          lengthBeats: 2,
          steps: [
            // Accordion oom-pah pattern
            step(0, 'root', 0.5, 75),
            step(0, 'fifth', 0.5, 72),
            step(0.5, 'third', 0.25, 68),
            step(0.5, 'fifth', 0.25, 65),
            step(1, 'root', 0.5, 78),
            step(1, 'fifth', 0.5, 75),
            step(1.5, 'third', 0.25, 70),
            step(1.5, 'fifth', 0.25, 68),
          ],
          loop: true,
          swing: 0.05,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          // Energetic dance rhythm
          drum(0, 'kick', 95),
          drum(1, 'kick', 90),
          drum(2, 'kick', 95),
          drum(3, 'kick', 90),
          
          drum(1, 'snare', 85),
          drum(3, 'snare', 85),
          
          // Cymbal on downbeats
          drum(0, 'cymbal', 75),
          drum(2, 'cymbal', 72),
          
          // Tambourine
          ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'tambourine', 55 + (i % 2 === 0 ? 12 : 0))),
          
          // Hand claps
          drum(1, 'clap', 70),
          drum(3, 'clap', 72),
        ],
        swing: 0.05,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['klezmer', 'world', 'jewish', 'clarinet', 'freylekhs', 'celebration'],
  icon: '🎺',
};

/**
 * Balkan Brass - Eastern European brass band with energetic rhythms
 */
export const BALKAN_BRASS_STYLE: ArrangerStyle = {
  id: 'balkan-brass',
  name: 'Balkan Brass',
  category: 'world',
  subcategory: 'balkan',
  description: 'High-energy Balkan brass band music with complex rhythms and infectious melodies',
  tempoRange: { min: 130, max: 180 },
  defaultTempo: 150,
  timeSignature: { numerator: 7, denominator: 8 },
  voices: [
    voice('trumpet', 'brass', 'Trumpet', { volume: 0.85, pan: -0.1, channel: 1 }),
    voice('trombone', 'brass', 'Trombone', { volume: 0.78, pan: 0.1, channel: 2 }),
    voice('sax', 'saxophone', 'Tenor Sax', { volume: 0.8, pan: 0, channel: 3 }),
    voice('tuba', 'brass', 'Tuba', { volume: 0.88, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Cocek',
      intensity: 5,
      patterns: [
        {
          voiceId: 'tuba',
          lengthBeats: 7,
          steps: [
            // Tuba bass pattern in 7/8 (grouped as 2+2+3)
            step(0, 'root', 1, 95),
            step(1, 'fifth', 1, 85),
            step(2, 'root', 1, 90),
            step(3, 'fifth', 1, 83),
            step(4, 'root', 1.5, 95),
            step(5.5, 'third', 0.5, 80),
            step(6, 'fifth', 1, 88),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'trumpet',
          lengthBeats: 7,
          steps: [
            // Fast trumpet melody
            step(0, 'root', 0.5, 90),
            step(0.5, 'third', 0.5, 85),
            step(1, 'fifth', 1, 95),
            step(2, 'fifth', 0.5, 82),
            step(2.5, 'sixth', 0.5, 80),
            step(3, 'seventh', 1, 88),
            step(4, 'root', 1, 100),
            step(5, 'seventh', 0.5, 85),
            step(5.5, 'sixth', 0.5, 80),
            step(6, 'fifth', 1, 90),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'sax',
          lengthBeats: 7,
          steps: [
            // Saxophone harmony
            step(0, 'third', 0.5, 85),
            step(0.5, 'fifth', 0.5, 80),
            step(1, 'root', 1, 90),
            step(2, 'root', 0.5, 78),
            step(2.5, 'third', 0.5, 75),
            step(3, 'fourth', 1, 83),
            step(4, 'fifth', 1, 95),
            step(5, 'fourth', 0.5, 80),
            step(5.5, 'third', 0.5, 78),
            step(6, 'root', 1, 85),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 7,
        steps: [
          // Balkan 7/8 rhythm (2+2+3 grouping)
          drum(0, 'kick', 100),
          drum(2, 'kick', 95),
          drum(4, 'kick', 100),
          
          drum(1, 'snare', 85),
          drum(3, 'snare', 85),
          drum(5, 'snare', 90),
          drum(6, 'snare', 82),
          
          // Tapan (large drum) accents
          drum(0, 'tapan-bass', 95),
          drum(4, 'tapan-bass', 95),
          
          // Davul rim shots
          drum(2, 'rimshot', 80),
          drum(6, 'rimshot', 78),
          
          // Continuous cymbal pattern
          ...Array.from({ length: 14 }, (_, i) => drum(i * 0.5, 'hihat-closed', 50 + (i % 4 === 0 ? 18 : i % 2 === 0 ? 10 : 0))),
          
          // Crash accents
          drum(0, 'crash', 85),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['balkan', 'world', 'brass', 'cocek', '7/8', 'energetic'],
  icon: '🎺',
};

/**
 * String Quartet - Classical chamber music voicing with four-part harmony
 */
export const STRING_QUARTET_STYLE: ArrangerStyle = {
  id: 'string-quartet',
  name: 'String Quartet',
  category: 'classical',
  subcategory: 'chamber',
  description: 'Classical string quartet with soprano, alto, tenor, and bass voice leading',
  tempoRange: { min: 60, max: 140 },
  defaultTempo: 96,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('violin1', 'violin', 'Violin I (Soprano)', { volume: 0.75, pan: -0.3, channel: 1 }),
    voice('violin2', 'violin', 'Violin II (Alto)', { volume: 0.72, pan: -0.1, channel: 2 }),
    voice('viola', 'viola', 'Viola (Tenor)', { volume: 0.7, pan: 0.1, channel: 3 }),
    voice('cello', 'cello', 'Cello (Bass)', { volume: 0.78, pan: 0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Allegro',
      intensity: 3,
      patterns: [
        {
          voiceId: 'violin1',
          lengthBeats: 4,
          steps: [
            // Soprano line - melody
            step(0, 'root', 1, 75),
            step(1, 'third', 1, 72),
            step(2, 'fifth', 1, 78),
            step(3, 'third', 1, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'violin2',
          lengthBeats: 4,
          steps: [
            // Alto line - harmony
            step(0, 'third', 1, 70),
            step(1, 'root', 1, 68),
            step(2, 'third', 1, 72),
            step(3, 'root', 1, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'viola',
          lengthBeats: 4,
          steps: [
            // Tenor line - inner voice
            step(0, 'fifth', 2, 68),
            step(2, 'root', 2, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
        {
          voiceId: 'cello',
          lengthBeats: 4,
          steps: [
            // Bass line - foundation
            step(0, 'root', 2, 78),
            step(2, 'fifth', 2, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],  // No drums in classical quartet
        swing: 0,
      },
    },
    {
      id: 'B',
      name: 'Andante',
      intensity: 2,
      patterns: [
        {
          voiceId: 'violin1',
          lengthBeats: 4,
          steps: [
            // Slower, more lyrical melody
            step(0, 'root', 2, 72),
            step(2, 'third', 2, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.06,
        },
        {
          voiceId: 'violin2',
          lengthBeats: 4,
          steps: [
            // Sustained harmony
            step(0, 'third', 2, 68),
            step(2, 'fifth', 2, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'viola',
          lengthBeats: 4,
          steps: [
            // Long notes
            step(0, 'fifth', 4, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
        {
          voiceId: 'cello',
          lengthBeats: 4,
          steps: [
            // Pizzicato bass
            step(0, 'root', 1, 75),
            step(2, 'fifth', 1, 72),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],  // No drums
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'chamber', 'strings', 'quartet', 'voice-leading', 'formal'],
  icon: '🎻',
};

/**
 * Orchestral Ballad - Full orchestra slow
 */
const ORCHESTRAL_BALLAD_STYLE: ArrangerStyle = {
  id: 'orchestral-ballad',
  name: 'Orchestral Ballad',
  category: 'classical',
  subcategory: 'orchestral',
  description: 'Full orchestra slow ballad with strings, brass, woodwinds, and harp',
  tempoRange: { min: 50, max: 80 },
  defaultTempo: 65,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('strings', 'strings', 'String Section', { volume: 0.8, pan: 0, channel: 1 }),
    voice('brass', 'brass', 'Brass Section', { volume: 0.7, pan: -0.2, channel: 2 }),
    voice('woodwinds', 'woodwinds', 'Woodwind Section', { volume: 0.65, pan: 0.2, channel: 3 }),
    voice('harp', 'harp', 'Concert Harp', { volume: 0.6, pan: 0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 2,
      patterns: [
        {
          voiceId: 'strings',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 4, 70),
            step(4, 'third', 4, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'brass',
          lengthBeats: 8,
          steps: [
            step(2, 'fifth', 2, 65),
            step(6, 'root', 2, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.07,
        },
        {
          voiceId: 'woodwinds',
          lengthBeats: 8,
          steps: [
            step(1, 'third', 1, 60),
            step(3, 'fifth', 1, 62),
            step(5, 'root', 1, 64),
            step(7, 'third', 1, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.09,
        },
        {
          voiceId: 'harp',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 0.5, 55),
            step(0.5, 'third', 0.5, 52),
            step(1, 'fifth', 0.5, 58),
            step(4, 'root', 0.5, 55),
            step(4.5, 'third', 0.5, 52),
            step(5, 'fifth', 0.5, 58),
          ],
          loop: true,
          swing: 0,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 8,
        steps: [
          drum(0, 'timpani', 50),
          drum(4, 'timpani', 55),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'orchestral', 'ballad', 'slow', 'emotional', 'film-score'],
  icon: '🎼',
};

/**
 * Cinematic Epic - Film score style
 */
const CINEMATIC_EPIC_STYLE: ArrangerStyle = {
  id: 'cinematic-epic',
  name: 'Cinematic Epic',
  category: 'classical',
  subcategory: 'cinematic',
  description: 'Epic film score style with dramatic orchestration and powerful crescendos',
  tempoRange: { min: 80, max: 140 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('strings', 'strings', 'String Orchestra', { volume: 0.85, pan: 0, channel: 1 }),
    voice('brass', 'brass', 'Brass Ensemble', { volume: 0.8, pan: -0.3, channel: 2 }),
    voice('choir', 'choir', 'Epic Choir', { volume: 0.75, pan: 0, channel: 3 }),
    voice('percussion', 'percussion', 'Orchestral Percussion', { volume: 0.7, pan: 0.3, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Build',
      intensity: 4,
      patterns: [
        {
          voiceId: 'strings',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 85),
            step(1, 'third', 1, 88),
            step(2, 'fifth', 1, 90),
            step(3, 'root', 1, 92),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'brass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 95),
            step(2, 'fifth', 2, 98),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
        {
          voiceId: 'choir',
          lengthBeats: 4,
          steps: [
            step(0, 'third', 4, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.06,
        },
        {
          voiceId: 'percussion',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 100),
            step(2, 'root', 0.5, 105),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'timpani', 100),
          drum(1, 'bass-drum', 110),
          drum(2, 'timpani', 105),
          drum(3, 'bass-drum', 115),
          drum(1.5, 'cymbal-crash', 95),
          drum(3.5, 'cymbal-crash', 100),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'cinematic', 'epic', 'film-score', 'dramatic', 'powerful'],
  icon: '🎬',
};

/**
 * Cinematic Tense - Suspense underscore
 */
const CINEMATIC_TENSE_STYLE: ArrangerStyle = {
  id: 'cinematic-tense',
  name: 'Cinematic Tense',
  category: 'classical',
  subcategory: 'cinematic',
  description: 'Suspenseful underscore with dissonant strings and sparse textures',
  tempoRange: { min: 60, max: 100 },
  defaultTempo: 75,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('strings-high', 'strings', 'High Strings', { volume: 0.7, pan: -0.2, channel: 1 }),
    voice('strings-low', 'cello-bass', 'Low Strings', { volume: 0.75, pan: 0.2, channel: 2 }),
    voice('piano', 'piano', 'Prepared Piano', { volume: 0.6, pan: 0, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Main',
      intensity: 2,
      patterns: [
        {
          voiceId: 'strings-high',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 4, 60),
            step(4, 'seventh', 4, 62),
          ],
          loop: true,
          swing: 0,
          humanize: 0.1,
        },
        {
          voiceId: 'strings-low',
          lengthBeats: 8,
          steps: [
            step(0, 'root', 8, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'piano',
          lengthBeats: 8,
          steps: [
            step(2, 'ninth', 0.25, 55),
            step(5, 'seventh', 0.25, 58),
            step(6.5, 'flatninth', 0.25, 60),
          ],
          loop: true,
          swing: 0,
          humanize: 0.12,
        },
      ],
      drumPattern: {
        lengthBeats: 8,
        steps: [
          drum(3, 'timpani', 45),
          drum(7, 'timpani', 48),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'cinematic', 'suspense', 'tense', 'underscore', 'dissonant'],
  icon: '😰',
};

/**
 * Baroque - Harpsichord, strings
 */
const BAROQUE_STYLE: ArrangerStyle = {
  id: 'baroque',
  name: 'Baroque',
  category: 'classical',
  subcategory: 'period',
  description: 'Baroque period style with harpsichord, strings, and contrapuntal texture',
  tempoRange: { min: 90, max: 140 },
  defaultTempo: 116,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('harpsichord', 'harpsichord', 'Harpsichord', { volume: 0.8, pan: 0, channel: 1 }),
    voice('violin1', 'violin', 'Violin I', { volume: 0.7, pan: -0.3, channel: 2 }),
    voice('violin2', 'violin', 'Violin II', { volume: 0.68, pan: -0.1, channel: 3 }),
    voice('cello', 'cello', 'Cello', { volume: 0.72, pan: 0.2, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Allegro',
      intensity: 3,
      patterns: [
        {
          voiceId: 'harpsichord',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 75),
            step(0.5, 'third', 0.5, 72),
            step(1, 'fifth', 0.5, 78),
            step(1.5, 'third', 0.5, 74),
            step(2, 'root', 0.5, 76),
            step(2.5, 'fifth', 0.5, 73),
            step(3, 'third', 0.5, 77),
            step(3.5, 'root', 0.5, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
        {
          voiceId: 'violin1',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 70),
            step(1, 'third', 0.5, 68),
            step(1.5, 'fifth', 0.5, 72),
            step(2, 'third', 1, 70),
            step(3, 'root', 1, 71),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'violin2',
          lengthBeats: 4,
          steps: [
            step(0, 'third', 1, 68),
            step(1, 'root', 1, 66),
            step(2, 'fifth', 1, 70),
            step(3, 'third', 1, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'cello',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 72),
            step(0.5, 'fifth', 0.5, 70),
            step(1, 'root', 0.5, 73),
            step(1.5, 'third', 0.5, 71),
            step(2, 'root', 0.5, 72),
            step(2.5, 'fifth', 0.5, 70),
            step(3, 'root', 0.5, 74),
            step(3.5, 'third', 0.5, 71),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],  // No drums in Baroque
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'baroque', 'period', 'harpsichord', 'contrapuntal', 'ornate'],
  icon: '🎹',
};

/**
 * Romantic - 19th century piano style
 */
const ROMANTIC_STYLE: ArrangerStyle = {
  id: 'romantic',
  name: 'Romantic',
  category: 'classical',
  subcategory: 'period',
  description: '19th century romantic style with expressive piano and lush orchestration',
  tempoRange: { min: 60, max: 120 },
  defaultTempo: 85,
  timeSignature: { numerator: 3, denominator: 4 },
  voices: [
    voice('piano', 'grand-piano', 'Grand Piano', { volume: 0.82, pan: 0, channel: 1 }),
    voice('strings', 'strings', 'String Orchestra', { volume: 0.7, pan: -0.2, channel: 2 }),
    voice('horn', 'french-horn', 'French Horn', { volume: 0.65, pan: 0.2, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Andante',
      intensity: 2,
      patterns: [
        {
          voiceId: 'piano',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 1, 75),
            step(1, 'third', 1, 72),
            step(2, 'fifth', 1, 78),
            step(3, 'third', 1, 74),
            step(4, 'root', 1, 76),
            step(5, 'seventh', 1, 73),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'strings',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 3, 68),
            step(3, 'fifth', 3, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.07,
        },
        {
          voiceId: 'horn',
          lengthBeats: 6,
          steps: [
            step(1, 'third', 2, 65),
            step(4, 'fifth', 2, 67),
          ],
          loop: true,
          swing: 0,
          humanize: 0.06,
        },
      ],
      drumPattern: {
        lengthBeats: 6,
        steps: [],  // No drums in Romantic
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'romantic', '19th-century', 'expressive', 'lush', 'waltz'],
  icon: '🌹',
};

/**
 * Minimalist Piano - Philip Glass-inspired
 */
const MINIMALIST_PIANO_STYLE: ArrangerStyle = {
  id: 'minimalist-piano',
  name: 'Minimalist Piano',
  category: 'classical',
  subcategory: 'contemporary',
  description: 'Minimalist style with repetitive piano arpeggios and subtle harmonic shifts',
  tempoRange: { min: 100, max: 160 },
  defaultTempo: 132,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('piano1', 'piano', 'Piano (High)', { volume: 0.75, pan: -0.2, channel: 1 }),
    voice('piano2', 'piano', 'Piano (Mid)', { volume: 0.73, pan: 0.2, channel: 2 }),
    voice('bass', 'bass', 'Bass', { volume: 0.7, pan: 0, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Pattern 1',
      intensity: 2,
      patterns: [
        {
          voiceId: 'piano1',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 70),
            step(0.5, 'fifth', 0.5, 68),
            step(1, 'third', 0.5, 72),
            step(1.5, 'fifth', 0.5, 69),
            step(2, 'root', 0.5, 71),
            step(2.5, 'fifth', 0.5, 68),
            step(3, 'third', 0.5, 73),
            step(3.5, 'fifth', 0.5, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'piano2',
          lengthBeats: 4,
          steps: [
            step(0.25, 'third', 0.5, 65),
            step(0.75, 'root', 0.5, 63),
            step(1.25, 'fifth', 0.5, 67),
            step(1.75, 'third', 0.5, 64),
            step(2.25, 'root', 0.5, 66),
            step(2.75, 'fifth', 0.5, 63),
            step(3.25, 'third', 0.5, 68),
            step(3.75, 'root', 0.5, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 75),
            step(2, 'fifth', 2, 73),
          ],
          loop: true,
          swing: 0,
          humanize: 0.02,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],  // Minimal or no drums
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'minimalist', 'contemporary', 'repetitive', 'arpeggios', 'philip-glass'],
  icon: '🔁',
};

/**
 * Baroque Continuo - Harpsichord with basso continuo
 */
const BAROQUE_CONTINUO_STYLE: ArrangerStyle = {
  id: 'baroque-continuo',
  name: 'Baroque Continuo',
  category: 'classical',
  subcategory: 'period',
  description: 'Baroque period with harpsichord and basso continuo accompaniment',
  tempoRange: { min: 60, max: 90 },
  defaultTempo: 70,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('harpsichord', 'harpsichord', 'Harpsichord', { volume: 0.78, pan: 0, channel: 1 }),
    voice('cello', 'cello', 'Cello (Bass)', { volume: 0.72, pan: 0.1, channel: 2 }),
    voice('bassoon', 'woodwinds', 'Bassoon', { volume: 0.68, pan: -0.1, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Continuo',
      intensity: 2,
      patterns: [
        {
          voiceId: 'harpsichord',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 72),
            step(0.5, 'third', 0.5, 70),
            step(1, 'fifth', 0.5, 74),
            step(1.5, 'root', 0.5, 71),
            step(2, 'third', 0.5, 73),
            step(2.5, 'fifth', 0.5, 70),
            step(3, 'root', 0.5, 75),
            step(3.5, 'third', 0.5, 72),
          ],
          loop: true,
          swing: 0,
          humanize: 0.03,
        },
        {
          voiceId: 'cello',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 70),
            step(1, 'fifth', 1, 68),
            step(2, 'root', 1, 72),
            step(3, 'third', 1, 69),
          ],
          loop: true,
          swing: 0,
          humanize: 0.04,
        },
        {
          voiceId: 'bassoon',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 65),
            step(2, 'fifth', 2, 67),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'baroque', 'continuo', 'harpsichord', 'chamber'],
  icon: '🎹',
};

/**
 * Classical Period - Mozart-style elegance
 */
const CLASSICAL_PERIOD_STYLE: ArrangerStyle = {
  id: 'classical-period',
  name: 'Classical Period',
  category: 'classical',
  subcategory: 'period',
  description: 'Classical period style with balanced phrasing and elegant accompaniment',
  tempoRange: { min: 80, max: 120 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('piano', 'piano', 'Fortepiano', { volume: 0.8, pan: 0, channel: 1 }),
    voice('strings', 'strings', 'String Section', { volume: 0.7, pan: -0.15, channel: 2 }),
    voice('woodwinds', 'woodwinds', 'Woodwinds', { volume: 0.65, pan: 0.15, channel: 3 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Allegro Moderato',
      intensity: 3,
      patterns: [
        {
          voiceId: 'piano',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 75),
            step(0.5, 'third', 0.25, 72),
            step(0.75, 'fifth', 0.25, 78),
            step(1, 'third', 0.5, 74),
            step(1.5, 'root', 0.5, 76),
            step(2, 'fifth', 0.5, 73),
            step(2.5, 'third', 0.25, 77),
            step(2.75, 'root', 0.25, 75),
            step(3, 'third', 0.5, 74),
            step(3.5, 'fifth', 0.5, 76),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
        {
          voiceId: 'strings',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 68),
            step(1, 'third', 1, 70),
            step(2, 'fifth', 1, 69),
            step(3, 'third', 1, 71),
          ],
          loop: true,
          swing: 0,
          humanize: 0.06,
        },
        {
          voiceId: 'woodwinds',
          lengthBeats: 4,
          steps: [
            step(0.5, 'fifth', 0.5, 66),
            step(2.5, 'third', 0.5, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.07,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'mozart', 'elegant', 'balanced', '18th-century'],
  icon: '🎼',
};

/**
 * Romantic Era - Expressive Chopin-style with rubato
 */
const ROMANTIC_ERA_STYLE: ArrangerStyle = {
  id: 'romantic-era',
  name: 'Romantic Era',
  category: 'classical',
  subcategory: 'period',
  description: 'Romantic period with expressive phrasing, rubato, and rich harmonies',
  tempoRange: { min: 70, max: 110 },
  defaultTempo: 85,
  timeSignature: { numerator: 3, denominator: 4 },
  voices: [
    voice('piano', 'grand-piano', 'Grand Piano', { volume: 0.83, pan: 0, channel: 1 }),
    voice('strings', 'strings', 'String Orchestra', { volume: 0.72, pan: -0.25, channel: 2 }),
    voice('horn', 'french-horn', 'French Horn', { volume: 0.68, pan: 0.25, channel: 3 }),
    voice('cello', 'cello', 'Cello Solo', { volume: 0.7, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Andante Espressivo',
      intensity: 2,
      patterns: [
        {
          voiceId: 'piano',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 1.2, 78),
            step(1.2, 'third', 0.8, 74),
            step(2, 'fifth', 1, 80),
            step(3, 'seventh', 1, 76),
            step(4, 'third', 0.8, 78),
            step(4.8, 'root', 1.2, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.12,
        },
        {
          voiceId: 'strings',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 2, 70),
            step(2, 'fifth', 2, 72),
            step(4, 'third', 2, 71),
          ],
          loop: true,
          swing: 0,
          humanize: 0.10,
        },
        {
          voiceId: 'horn',
          lengthBeats: 6,
          steps: [
            step(1, 'third', 2, 66),
            step(4, 'fifth', 2, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.09,
        },
        {
          voiceId: 'cello',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 3, 72),
            step(3, 'fifth', 3, 74),
          ],
          loop: true,
          swing: 0,
          humanize: 0.11,
        },
      ],
      drumPattern: {
        lengthBeats: 6,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'romantic', 'chopin', 'rubato', 'expressive', '19th-century'],
  icon: '🌹',
};

/**
 * Impressionist - Debussy-style colors and atmosphere
 */
const IMPRESSIONIST_STYLE: ArrangerStyle = {
  id: 'impressionist',
  name: 'Impressionist',
  category: 'classical',
  subcategory: 'period',
  description: 'Impressionist style with colorful harmonies, whole-tone scales, and atmospheric textures',
  tempoRange: { min: 60, max: 100 },
  defaultTempo: 75,
  timeSignature: { numerator: 3, denominator: 4 },
  voices: [
    voice('piano', 'grand-piano', 'Grand Piano', { volume: 0.78, pan: 0, channel: 1 }),
    voice('harp', 'harp', 'Harp', { volume: 0.72, pan: -0.3, channel: 2 }),
    voice('flute', 'woodwinds', 'Flute', { volume: 0.68, pan: 0.3, channel: 3 }),
    voice('strings', 'strings', 'Strings (Pad)', { volume: 0.65, pan: 0, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Rêveusement',
      intensity: 2,
      patterns: [
        {
          voiceId: 'piano',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 0.75, 70),
            step(0.75, 'ninth', 0.75, 68),
            step(1.5, 'fifth', 0.75, 72),
            step(2.25, 'seventh', 0.75, 69),
            step(3, 'third', 0.75, 71),
            step(3.75, 'eleventh', 0.75, 67),
            step(4.5, 'root', 0.75, 73),
            step(5.25, 'ninth', 0.75, 70),
          ],
          loop: true,
          swing: 0,
          humanize: 0.10,
        },
        {
          voiceId: 'harp',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 0.5, 65),
            step(1, 'ninth', 0.5, 63),
            step(2, 'fifth', 0.5, 67),
            step(3, 'seventh', 0.5, 64),
            step(4, 'third', 0.5, 66),
            step(5, 'ninth', 0.5, 63),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'flute',
          lengthBeats: 6,
          steps: [
            step(1, 'fifth', 2, 64),
            step(4, 'ninth', 2, 66),
          ],
          loop: true,
          swing: 0,
          humanize: 0.12,
        },
        {
          voiceId: 'strings',
          lengthBeats: 6,
          steps: [
            step(0, 'root', 6, 60),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
      ],
      drumPattern: {
        lengthBeats: 6,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'impressionist', 'debussy', 'colorful', 'atmospheric', 'whole-tone'],
  icon: '🌊',
};

/**
 * Minimalist - Reich/Glass repetitive patterns
 */
const MINIMALIST_STYLE: ArrangerStyle = {
  id: 'minimalist',
  name: 'Minimalist',
  category: 'classical',
  subcategory: 'contemporary',
  description: 'Minimalist style with phasing patterns and gradual transformations',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('piano1', 'piano', 'Piano 1', { volume: 0.74, pan: -0.4, channel: 1 }),
    voice('piano2', 'piano', 'Piano 2', { volume: 0.74, pan: -0.15, channel: 2 }),
    voice('piano3', 'piano', 'Piano 3', { volume: 0.74, pan: 0.15, channel: 3 }),
    voice('piano4', 'piano', 'Piano 4', { volume: 0.74, pan: 0.4, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Phase 1',
      intensity: 2,
      patterns: [
        {
          voiceId: 'piano1',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.25, 68),
            step(0.25, 'fifth', 0.25, 66),
            step(0.5, 'third', 0.25, 70),
            step(0.75, 'fifth', 0.25, 67),
            step(1, 'root', 0.25, 69),
            step(1.25, 'fifth', 0.25, 66),
            step(1.5, 'third', 0.25, 71),
            step(1.75, 'fifth', 0.25, 68),
            step(2, 'root', 0.25, 68),
            step(2.25, 'fifth', 0.25, 66),
            step(2.5, 'third', 0.25, 70),
            step(2.75, 'fifth', 0.25, 67),
            step(3, 'root', 0.25, 69),
            step(3.25, 'fifth', 0.25, 66),
            step(3.5, 'third', 0.25, 71),
            step(3.75, 'fifth', 0.25, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'piano2',
          lengthBeats: 4,
          steps: [
            step(0.0625, 'root', 0.25, 65),
            step(0.3125, 'fifth', 0.25, 63),
            step(0.5625, 'third', 0.25, 67),
            step(0.8125, 'fifth', 0.25, 64),
            step(1.0625, 'root', 0.25, 66),
            step(1.3125, 'fifth', 0.25, 63),
            step(1.5625, 'third', 0.25, 68),
            step(1.8125, 'fifth', 0.25, 65),
            step(2.0625, 'root', 0.25, 65),
            step(2.3125, 'fifth', 0.25, 63),
            step(2.5625, 'third', 0.25, 67),
            step(2.8125, 'fifth', 0.25, 64),
            step(3.0625, 'root', 0.25, 66),
            step(3.3125, 'fifth', 0.25, 63),
            step(3.5625, 'third', 0.25, 68),
            step(3.8125, 'fifth', 0.25, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'piano3',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 70),
            step(1, 'third', 1, 68),
            step(2, 'fifth', 1, 72),
            step(3, 'root', 1, 69),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
        {
          voiceId: 'piano4',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 72),
            step(2, 'fifth', 2, 74),
          ],
          loop: true,
          swing: 0,
          humanize: 0.01,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'minimalist', 'reich', 'glass', 'phasing', 'repetitive'],
  icon: '🔁',
};

/**
 * Film Score Epic - Hans Zimmer-style cinematic
 */
const FILM_SCORE_EPIC_STYLE: ArrangerStyle = {
  id: 'film-score-epic',
  name: 'Film Score Epic',
  category: 'classical',
  subcategory: 'cinematic',
  description: 'Epic cinematic score with massive orchestral forces and driving rhythms',
  tempoRange: { min: 80, max: 120 },
  defaultTempo: 90,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('strings-low', 'strings', 'Low Strings', { volume: 0.82, pan: -0.2, channel: 1 }),
    voice('strings-high', 'strings', 'High Strings', { volume: 0.78, pan: 0.2, channel: 2 }),
    voice('brass', 'brass', 'Brass Section', { volume: 0.85, pan: 0, channel: 3 }),
    voice('percussion', 'percussion', 'Percussion', { volume: 0.8, pan: 0, channel: 4 }),
    voice('choir', 'choir', 'Choir', { volume: 0.75, pan: 0, channel: 5 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Epic Main',
      intensity: 4,
      patterns: [
        {
          voiceId: 'strings-low',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.5, 90),
            step(0.5, 'root', 0.5, 95),
            step(1, 'root', 0.5, 92),
            step(1.5, 'fifth', 0.5, 88),
            step(2, 'root', 0.5, 93),
            step(2.5, 'root', 0.5, 97),
            step(3, 'root', 0.5, 94),
            step(3.5, 'fifth', 0.5, 90),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'strings-high',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 85),
            step(2, 'fifth', 2, 88),
          ],
          loop: true,
          swing: 0,
          humanize: 0.10,
        },
        {
          voiceId: 'brass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 100),
            step(1.5, 'fifth', 0.5, 95),
            step(2, 'third', 1, 98),
            step(3.5, 'root', 0.5, 92),
          ],
          loop: true,
          swing: 0,
          humanize: 0.07,
        },
        {
          voiceId: 'choir',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 4, 80),
          ],
          loop: true,
          swing: 0,
          humanize: 0.12,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [
          drum(0, 'bass-drum', 110),
          drum(0.5, 'bass-drum', 105),
          drum(1, 'snare', 100),
          drum(1.5, 'bass-drum', 108),
          drum(2, 'bass-drum', 112),
          drum(2.5, 'bass-drum', 106),
          drum(3, 'snare', 102),
          drum(3.5, 'taiko', 95),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'cinematic', 'epic', 'film-score', 'zimmer', 'orchestral'],
  icon: '🎬',
};

/**
 * Film Score Emotional - Strings-focused emotional underscore
 */
const FILM_SCORE_EMOTIONAL_STYLE: ArrangerStyle = {
  id: 'film-score-emotional',
  name: 'Film Score Emotional',
  category: 'classical',
  subcategory: 'cinematic',
  description: 'Emotional film score with lush strings and tender melodies',
  tempoRange: { min: 55, max: 80 },
  defaultTempo: 65,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('strings', 'strings', 'String Orchestra', { volume: 0.82, pan: 0, channel: 1 }),
    voice('piano', 'grand-piano', 'Grand Piano', { volume: 0.75, pan: -0.2, channel: 2 }),
    voice('solo-violin', 'violin', 'Solo Violin', { volume: 0.72, pan: 0.25, channel: 3 }),
    voice('woodwinds', 'woodwinds', 'Woodwinds', { volume: 0.68, pan: 0.1, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Tender',
      intensity: 2,
      patterns: [
        {
          voiceId: 'strings',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 72),
            step(2, 'third', 2, 75),
          ],
          loop: true,
          swing: 0,
          humanize: 0.15,
        },
        {
          voiceId: 'piano',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 68),
            step(1, 'fifth', 0.5, 65),
            step(1.5, 'third', 0.5, 70),
            step(2, 'seventh', 1, 67),
            step(3, 'fifth', 1, 69),
          ],
          loop: true,
          swing: 0,
          humanize: 0.12,
        },
        {
          voiceId: 'solo-violin',
          lengthBeats: 4,
          steps: [
            step(0.5, 'third', 1.5, 70),
            step(2.5, 'fifth', 1.5, 73),
          ],
          loop: true,
          swing: 0,
          humanize: 0.18,
        },
        {
          voiceId: 'woodwinds',
          lengthBeats: 4,
          steps: [
            step(1, 'root', 1, 64),
            step(3, 'third', 1, 66),
          ],
          loop: true,
          swing: 0,
          humanize: 0.16,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'cinematic', 'emotional', 'film-score', 'strings', 'tender'],
  icon: '💔',
};

/**
 * Chamber Music - String quartet intimate setting
 */
const CHAMBER_MUSIC_STYLE: ArrangerStyle = {
  id: 'chamber-music',
  name: 'Chamber Music',
  category: 'classical',
  subcategory: 'ensemble',
  description: 'Intimate chamber music for string quartet with refined interplay',
  tempoRange: { min: 70, max: 100 },
  defaultTempo: 80,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('violin1', 'violin', 'Violin I', { volume: 0.78, pan: -0.35, channel: 1 }),
    voice('violin2', 'violin', 'Violin II', { volume: 0.76, pan: -0.1, channel: 2 }),
    voice('viola', 'viola', 'Viola', { volume: 0.74, pan: 0.1, channel: 3 }),
    voice('cello', 'cello', 'Cello', { volume: 0.76, pan: 0.35, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Andante',
      intensity: 2,
      patterns: [
        {
          voiceId: 'violin1',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 0.75, 72),
            step(0.75, 'third', 0.5, 70),
            step(1.25, 'fifth', 0.75, 74),
            step(2, 'third', 1, 71),
            step(3, 'root', 1, 73),
          ],
          loop: true,
          swing: 0,
          humanize: 0.09,
        },
        {
          voiceId: 'violin2',
          lengthBeats: 4,
          steps: [
            step(0, 'third', 1, 68),
            step(1, 'root', 1, 66),
            step(2, 'fifth', 1, 70),
            step(3, 'third', 1, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'viola',
          lengthBeats: 4,
          steps: [
            step(0, 'fifth', 2, 65),
            step(2, 'root', 2, 67),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'cello',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 70),
            step(1, 'fifth', 1, 68),
            step(2, 'root', 1, 72),
            step(3, 'third', 1, 69),
          ],
          loop: true,
          swing: 0,
          humanize: 0.07,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'chamber', 'string-quartet', 'intimate', 'refined'],
  icon: '🎻',
};

/**
 * Choral - Sacred choir with organ
 */
const CHORAL_STYLE: ArrangerStyle = {
  id: 'choral',
  name: 'Choral',
  category: 'classical',
  subcategory: 'sacred',
  description: 'Sacred choral music with organ accompaniment and four-part harmony',
  tempoRange: { min: 50, max: 80 },
  defaultTempo: 60,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('soprano', 'choir', 'Soprano', { volume: 0.75, pan: -0.3, channel: 1 }),
    voice('alto', 'choir', 'Alto', { volume: 0.73, pan: -0.1, channel: 2 }),
    voice('tenor', 'choir', 'Tenor', { volume: 0.73, pan: 0.1, channel: 3 }),
    voice('bass', 'choir', 'Bass', { volume: 0.75, pan: 0.3, channel: 4 }),
    voice('organ', 'organ', 'Organ', { volume: 0.70, pan: 0, channel: 5 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Hymn',
      intensity: 2,
      patterns: [
        {
          voiceId: 'soprano',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 70),
            step(1, 'third', 1, 72),
            step(2, 'fifth', 1, 74),
            step(3, 'third', 1, 71),
          ],
          loop: true,
          swing: 0,
          humanize: 0.10,
        },
        {
          voiceId: 'alto',
          lengthBeats: 4,
          steps: [
            step(0, 'third', 1, 68),
            step(1, 'root', 1, 69),
            step(2, 'third', 1, 70),
            step(3, 'root', 1, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.09,
        },
        {
          voiceId: 'tenor',
          lengthBeats: 4,
          steps: [
            step(0, 'fifth', 1, 65),
            step(1, 'fifth', 1, 66),
            step(2, 'root', 1, 67),
            step(3, 'fifth', 1, 65),
          ],
          loop: true,
          swing: 0,
          humanize: 0.09,
        },
        {
          voiceId: 'bass',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 1, 70),
            step(1, 'fifth', 1, 68),
            step(2, 'root', 1, 72),
            step(3, 'third', 1, 69),
          ],
          loop: true,
          swing: 0,
          humanize: 0.08,
        },
        {
          voiceId: 'organ',
          lengthBeats: 4,
          steps: [
            step(0, 'root', 2, 65),
            step(2, 'fifth', 2, 67),
          ],
          loop: true,
          swing: 0,
          humanize: 0.05,
        },
      ],
      drumPattern: {
        lengthBeats: 4,
        steps: [],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'choral', 'sacred', 'hymn', 'organ', 'four-part-harmony'],
  icon: '⛪',
};

/**
 * Contemporary Classical - Modern contemporary composition
 */
const CONTEMPORARY_CLASSICAL_STYLE: ArrangerStyle = {
  id: 'contemporary-classical',
  name: 'Contemporary Classical',
  category: 'classical',
  subcategory: 'contemporary',
  description: 'Modern contemporary classical with extended techniques and rich textures',
  tempoRange: { min: 80, max: 130 },
  defaultTempo: 100,
  timeSignature: { numerator: 7, denominator: 8 },
  voices: [
    voice('strings', 'strings', 'String Section', { volume: 0.78, pan: -0.2, channel: 1 }),
    voice('piano', 'piano', 'Prepared Piano', { volume: 0.75, pan: 0.2, channel: 2 }),
    voice('percussion', 'percussion', 'Percussion', { volume: 0.72, pan: 0, channel: 3 }),
    voice('woodwinds', 'woodwinds', 'Woodwinds', { volume: 0.70, pan: 0.15, channel: 4 }),
  ],
  variations: [
    {
      id: 'A',
      name: 'Modern',
      intensity: 3,
      patterns: [
        {
          voiceId: 'strings',
          lengthBeats: 7,
          steps: [
            step(0, 'root', 1.5, 75),
            step(1.5, 'ninth', 1, 72),
            step(2.5, 'eleventh', 1.5, 78),
            step(4, 'seventh', 1, 74),
            step(5, 'third', 2, 76),
          ],
          loop: true,
          swing: 0,
          humanize: 0.11,
        },
        {
          voiceId: 'piano',
          lengthBeats: 7,
          steps: [
            step(0, 'root', 0.75, 70),
            step(0.75, 'eleventh', 0.75, 68),
            step(2, 'ninth', 0.5, 73),
            step(3, 'seventh', 1, 71),
            step(4.5, 'third', 0.75, 74),
            step(5.5, 'fifth', 1, 72),
          ],
          loop: true,
          swing: 0,
          humanize: 0.09,
        },
        {
          voiceId: 'woodwinds',
          lengthBeats: 7,
          steps: [
            step(1, 'ninth', 2, 66),
            step(4, 'eleventh', 2, 68),
          ],
          loop: true,
          swing: 0,
          humanize: 0.13,
        },
      ],
      drumPattern: {
        lengthBeats: 7,
        steps: [
          drum(0, 'snare', 80),
          drum(2.5, 'tom-mid', 75),
          drum(4, 'bass-drum', 85),
          drum(5.5, 'cymbal', 70),
        ],
        swing: 0,
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['classical', 'contemporary', 'modern', 'experimental', 'extended-techniques'],
  icon: '🎵',
};

// ============================================================================
// ROCK STYLES
// ============================================================================

/**
 * Hard Rock style - heavy, powerful
 */
const HARD_ROCK_STYLE: ArrangerStyle = {
  id: 'hard-rock',
  name: 'Hard Rock',
  category: 'Rock',
  subcategory: 'Hard',
  description: 'Heavy, powerful rock with driving rhythms',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'power-bass', { octave: 2, velocityRange: [85, 127] }),
    voice('drums', 'power-kit', { velocityRange: [90, 127] }),
    voice('guitar', 'distortion-guitar', { octave: 3, velocityRange: [85, 115] }),
    voice('pad', 'power-chord-pad', { octave: 3, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 4, 100), step(2, 'fifth', 1, 85),
            step(4, 'root', 4, 100), step(6, 'fifth', 1, 85),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 110), drum(1, 'kick', 95),
            drum(2, 'snare', 120), drum(3, 'kick', 90),
            drum(4, 'kick', 110), drum(5, 'kick', 95),
            drum(6, 'snare', 120), drum(7, 'kick', 90),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 70)),
            drum(3.5, 'hihat-open', 85),
            drum(7.5, 'hihat-open', 85),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'hard', 'heavy', 'power', 'guitar'],
  icon: '🎸',
};

/**
 * Classic Rock style - 70s inspired
 */
const CLASSIC_ROCK_STYLE: ArrangerStyle = {
  id: 'classic-rock',
  name: 'Classic Rock',
  category: 'Rock',
  subcategory: 'Classic',
  description: '70s inspired rock with groove',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 112,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'rock-bass', { octave: 2, velocityRange: [75, 105] }),
    voice('drums', 'room-kit', { velocityRange: [80, 110] }),
    voice('keys', 'organ', { octave: 4, velocityRange: [70, 95] }),
    voice('guitar', 'crunch-guitar', { octave: 3, velocityRange: [75, 100] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 2, 95), step(2, 'fifth', 1, 80),
            step(3, 'root', 1, 85), step(4, 'root', 2, 95),
            step(6, 'third', 1, 75), step(7, 'fifth', 1, 80),
          ],
          swing: 0.1,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(2, 'snare', 105),
            drum(4, 'kick', 100), drum(4.5, 'kick', 80),
            drum(6, 'snare', 105),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 65)),
          ],
          swing: 0.1,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'classic', '70s', 'vintage', 'groove'],
  icon: '🎸',
};

/**
 * Soft Rock style - melodic and smooth
 */
const SOFT_ROCK_STYLE: ArrangerStyle = {
  id: 'soft-rock',
  name: 'Soft Rock',
  category: 'Rock',
  subcategory: 'Soft',
  description: 'Melodic, smooth rock ballad style',
  tempoRange: { min: 70, max: 100 },
  defaultTempo: 84,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'melodic-bass', { octave: 2, velocityRange: [60, 85] }),
    voice('drums', 'room-kit', { velocityRange: [60, 90] }),
    voice('keys', 'piano', { octave: 4, velocityRange: [55, 80] }),
    voice('pad', 'warm-strings', { octave: 4, velocityRange: [50, 75] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 4, 75), step(4, 'fifth', 2, 65),
            step(6, 'third', 2, 60),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 75), drum(2, 'snare', 70),
            drum(4, 'kick', 70), drum(6, 'snare', 70),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 45)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'soft', 'ballad', 'melodic', 'smooth'],
  icon: '🎸',
};

/**
 * Power Ballad style - emotional rock ballad
 */
const POWER_BALLAD_STYLE: ArrangerStyle = {
  id: 'power-ballad',
  name: 'Power Ballad',
  category: 'Rock',
  subcategory: 'Ballad',
  description: 'Emotional rock ballad with building dynamics',
  tempoRange: { min: 60, max: 90 },
  defaultTempo: 76,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'sustain-bass', { octave: 2, velocityRange: [55, 90] }),
    voice('drums', 'room-kit', { velocityRange: [50, 100] }),
    voice('keys', 'piano', { octave: 4, velocityRange: [45, 85] }),
    voice('pad', 'orchestral-strings', { octave: 4, velocityRange: [50, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Intro/Verse',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 8, 65),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 60), drum(4, 'snare', 55),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 40)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'ballad', 'power', 'emotional', '80s'],
  icon: '🎸',
};

// ============================================================================
// BLUES STYLES
// ============================================================================

/**
 * Blues Shuffle style - classic 12-bar blues
 */
const BLUES_SHUFFLE_STYLE: ArrangerStyle = {
  id: 'blues-shuffle',
  name: 'Blues Shuffle',
  category: 'Blues',
  subcategory: 'Traditional',
  description: 'Classic 12-bar blues with shuffle feel',
  tempoRange: { min: 80, max: 130 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'walking-blues', { octave: 2, velocityRange: [75, 100] }),
    voice('drums', 'jazz-kit', { velocityRange: [70, 100] }),
    voice('keys', 'blues-piano', { octave: 4, velocityRange: [70, 95] }),
    voice('guitar', 'clean-blues', { octave: 3, velocityRange: [70, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main shuffle',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1.5, 90), step(1.5, 'third', 0.5, 75),
            step(2, 'fifth', 1.5, 85), step(3.5, 'sixth', 0.5, 75),
            step(4, 'root', 1.5, 90), step(5.5, 'third', 0.5, 75),
            step(6, 'fifth', 1.5, 85), step(7.5, 'sixth', 0.5, 75),
          ],
          swing: 0.25,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(2, 'snare', 95),
            drum(4, 'kick', 90), drum(6, 'snare', 95),
            ...Array.from({ length: 8 }, (_, i) => [
              drum(i, 'hihat-closed', 60),
              drum(i + 0.67, 'hihat-closed', 70),
            ]).flat(),
          ],
          swing: 0.33,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'shuffle', '12-bar', 'traditional', 'swing'],
  icon: '🎷',
};

/**
 * Slow Blues style - emotional and expressive
 */
const SLOW_BLUES_STYLE: ArrangerStyle = {
  id: 'slow-blues',
  name: 'Slow Blues',
  category: 'Blues',
  subcategory: 'Slow',
  description: 'Deep, emotional slow blues',
  tempoRange: { min: 50, max: 80 },
  defaultTempo: 65,
  timeSignature: { numerator: 6, denominator: 8 },
  voices: [
    voice('bass', 'slow-blues', { octave: 2, velocityRange: [65, 90] }),
    voice('drums', 'brushes-kit', { velocityRange: [55, 85] }),
    voice('keys', 'blues-piano', { octave: 4, velocityRange: [60, 85] }),
    voice('pad', 'organ-pad', { octave: 4, velocityRange: [50, 75] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 3, 80), step(3, 'fifth', 1.5, 70),
            step(4.5, 'third', 1.5, 65),
          ],
          swing: 0.1,
        },
        drums: {
          steps: [
            drum(0, 'kick', 75), drum(3, 'snare', 70),
            ...Array.from({ length: 6 }, (_, i) => drum(i, 'hihat-closed', 50)),
          ],
          swing: 0.1,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'slow', 'emotional', '6/8', 'expressive'],
  icon: '🎷',
};

// ============================================================================
// LATIN STYLES (Extended)
// ============================================================================

/**
 * Cha Cha style - Cuban dance
 */
export const CHA_CHA_STYLE: ArrangerStyle = {
  id: 'cha-cha',
  name: 'Cha Cha',
  category: 'Latin',
  subcategory: 'Cuban',
  description: 'Classic Cuban cha cha rhythm',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'tumbao', { octave: 2, velocityRange: [80, 105] }),
    voice('drums', 'latin-kit', { velocityRange: [80, 105] }),
    voice('keys', 'piano-montuno', { octave: 4, velocityRange: [80, 100] }),
    voice('percussion', 'congas-guiro', { velocityRange: [75, 100] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main cha-cha',
      voices: {
        bass: {
          steps: [
            step(0.5, 'fifth', 1, 85), step(2, 'root', 0.5, 95),
            step(2.5, 'root', 0.5, 80), step(3, 'root', 0.5, 75),
            step(4.5, 'fifth', 1, 85), step(6, 'root', 0.5, 95),
            step(6.5, 'root', 0.5, 80), step(7, 'root', 0.5, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(2, 'snare', 95), drum(6, 'snare', 95),
            // Cha-cha-cha rhythm on cowbell
            drum(2.5, 'cowbell', 85), drum(3, 'cowbell', 80), drum(3.5, 'cowbell', 75),
            drum(6.5, 'cowbell', 85), drum(7, 'cowbell', 80), drum(7.5, 'cowbell', 75),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 55)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['latin', 'cha-cha', 'cuban', 'dance', 'mambo'],
  icon: '💃',
};

/**
 * Rumba - Cuban rumba clave pattern
 */
const RUMBA_STYLE: ArrangerStyle = {
  id: 'rumba',
  name: 'Rumba',
  category: 'Latin',
  subcategory: 'Cuban',
  description: 'Cuban rumba with 3-2 rumba clave and polyrhythmic percussion',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'rumba-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'rumba-percussion', { velocityRange: [75, 95] }),
    voice('piano', 'montuno', { octave: 4, velocityRange: [70, 90] }),
    voice('conga', 'conga-set', { velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Rumba groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 90), step(1, 'fifth', 0.5, 80),
            step(2, 'root', 0.75, 85), step(3, 'third', 0.5, 75),
          ],
          swing: 0,
        },
        piano: {
          steps: [
            step(0.5, 'root', 0.25, 75), step(1, 'third', 0.25, 70),
            step(1.5, 'fifth', 0.25, 75), step(2.5, 'root', 0.25, 70),
            step(3, 'third', 0.25, 75), step(3.5, 'fifth', 0.25, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            // 3-2 rumba clave
            drum(0, 'clave', 90), drum(1, 'clave', 90), drum(2, 'clave', 90),
            drum(5.5, 'clave', 90), drum(7, 'clave', 90),
            // Conga pattern
            drum(0, 'conga-low', 85), drum(0.75, 'conga-slap', 80),
            drum(1.5, 'conga-open', 75), drum(2, 'conga-low', 85),
            drum(2.75, 'conga-slap', 80), drum(3.5, 'conga-open', 75),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'shaker', 55 + (i % 4 === 0 ? 10 : 0))),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['latin', 'rumba', 'cuban', 'clave', 'percussion'],
  icon: '🥁',
};

/**
 * Guaracha - Fast Cuban dance
 */
const GUARACHA_STYLE: ArrangerStyle = {
  id: 'guaracha',
  name: 'Guaracha',
  category: 'Latin',
  subcategory: 'Cuban',
  description: 'Fast upbeat Cuban dance music with energetic brass and rhythm',
  tempoRange: { min: 180, max: 220 },
  defaultTempo: 200,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'guaracha-bass', { octave: 2, velocityRange: [90, 110] }),
    voice('drums', 'guaracha-percussion', { velocityRange: [85, 105] }),
    voice('piano', 'montuno', { octave: 4, velocityRange: [80, 100] }),
    voice('brass', 'brass-section', { octave: 4, velocityRange: [85, 110] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Fast guaracha',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.5, 'fifth', 0.5, 85),
            step(1, 'octave', 0.5, 90), step(1.5, 'third', 0.5, 80),
            step(2, 'fifth', 0.5, 95), step(2.5, 'root', 0.5, 85),
            step(3, 'third', 0.5, 90), step(3.5, 'fifth', 0.5, 85),
          ],
          swing: 0,
        },
        piano: {
          steps: [
            // Fast montuno
            step(0, 'root', 0.125, 80), step(0.25, 'third', 0.125, 75),
            step(0.5, 'fifth', 0.125, 80), step(0.75, 'root', 0.125, 75),
            step(1, 'third', 0.125, 85), step(1.25, 'fifth', 0.125, 80),
            step(1.5, 'root', 0.125, 82), step(1.75, 'third', 0.125, 78),
            step(2, 'fifth', 0.125, 80), step(2.25, 'root', 0.125, 75),
            step(2.5, 'third', 0.125, 80), step(2.75, 'fifth', 0.125, 75),
            step(3, 'root', 0.125, 85), step(3.25, 'third', 0.125, 80),
            step(3.5, 'fifth', 0.125, 82), step(3.75, 'root', 0.125, 78),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            // 2-3 son clave
            drum(0, 'clave', 95), drum(1, 'clave', 95), drum(3, 'clave', 95),
            drum(5.5, 'clave', 95), drum(7, 'clave', 95),
            // Fast timbales
            drum(0, 'timbale-low', 90), drum(0.5, 'timbale-high', 85),
            drum(1, 'timbale-rim', 95), drum(1.5, 'timbale-high', 85),
            drum(2, 'timbale-low', 90), drum(2.5, 'timbale-high', 85),
            drum(3, 'timbale-rim', 95), drum(3.5, 'timbale-high', 85),
            // Cowbell
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'cowbell', 75 + (i % 2 === 0 ? 15 : 0))),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['latin', 'guaracha', 'cuban', 'fast', 'dance'],
  icon: '💃',
};

// ============================================================================
// JAZZ STYLES (Extended)
// ============================================================================

/**
 * Jazz Ballad style - romantic slow jazz
 */
const JAZZ_BALLAD_STYLE: ArrangerStyle = {
  id: 'jazz-ballad',
  name: 'Jazz Ballad',
  category: 'Jazz',
  subcategory: 'Ballad',
  description: 'Romantic slow jazz ballad',
  tempoRange: { min: 50, max: 80 },
  defaultTempo: 65,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'ballad-bass', { octave: 2, velocityRange: [55, 80] }),
    voice('drums', 'brushes', { velocityRange: [45, 70] }),
    voice('keys', 'ballad-piano', { octave: 4, velocityRange: [50, 75] }),
    voice('pad', 'strings', { octave: 4, velocityRange: [45, 70] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Ballad feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 4, 70), step(4, 'fifth', 2, 60),
            step(6, 'third', 2, 55),
          ],
          swing: 0.15,
        },
        drums: {
          steps: [
            drum(0, 'kick', 55), drum(4, 'kick', 50),
            drum(2, 'hihat-closed', 45), drum(6, 'hihat-closed', 45),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'brushes-sweep', 35)),
          ],
          swing: 0.15,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'ballad', 'romantic', 'slow', 'brushes'],
  icon: '🎹',
};

/**
 * Jazz Funk style - groove-heavy
 */
const JAZZ_FUNK_STYLE: ArrangerStyle = {
  id: 'jazz-funk',
  name: 'Jazz Funk',
  category: 'Jazz',
  subcategory: 'Fusion',
  description: 'Groove-heavy jazz funk fusion',
  tempoRange: { min: 90, max: 130 },
  defaultTempo: 108,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'slap-bass', { octave: 2, velocityRange: [85, 115] }),
    voice('drums', 'funk-kit', { velocityRange: [85, 115] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [80, 105] }),
    voice('brass', 'funk-horns', { octave: 4, velocityRange: [85, 110] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 100), step(0.75, 'octave', 0.25, 75),
            step(1.5, 'fifth', 0.5, 90), step(2.5, 'third', 0.5, 85),
            step(3.5, 'root', 0.5, 95),
            step(4, 'root', 0.5, 100), step(4.75, 'octave', 0.25, 75),
            step(5.5, 'fifth', 0.5, 90), step(6.5, 'third', 0.5, 85),
            step(7.5, 'root', 0.5, 95),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 105), drum(2.5, 'kick', 90),
            drum(2, 'snare', 100), drum(6, 'snare', 100),
            drum(3.75, 'snare', 70), drum(7.75, 'snare', 70),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60 + (i % 2 === 0 ? 15 : 0))),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'funk', 'fusion', 'groove', 'slap'],
  icon: '🎷',
};

/**
 * Bebop style - fast, complex
 */
const BEBOP_STYLE: ArrangerStyle = {
  id: 'bebop',
  name: 'Bebop',
  category: 'Jazz',
  subcategory: 'Bebop',
  description: 'Fast, complex bebop jazz',
  tempoRange: { min: 180, max: 280 },
  defaultTempo: 220,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'walking-bebop', { octave: 2, velocityRange: [80, 105] }),
    voice('drums', 'bebop-kit', { velocityRange: [75, 100] }),
    voice('keys', 'bebop-piano', { octave: 4, velocityRange: [80, 105] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main swing',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 95), step(1, 'second', 1, 85),
            step(2, 'third', 1, 90), step(3, 'fifth', 1, 85),
            step(4, 'root', 1, 95), step(5, 'seventh', 1, 85),
            step(6, 'sixth', 1, 90), step(7, 'fifth', 1, 85),
          ],
          swing: 0.2,
        },
        drums: {
          steps: [
            drum(0, 'ride', 80), drum(1, 'ride', 70), drum(1.67, 'ride', 75),
            drum(2, 'ride', 80), drum(3, 'ride', 70), drum(3.67, 'ride', 75),
            drum(4, 'ride', 80), drum(5, 'ride', 70), drum(5.67, 'ride', 75),
            drum(6, 'ride', 80), drum(7, 'ride', 70), drum(7.67, 'ride', 75),
            drum(2, 'hihat-foot', 65), drum(6, 'hihat-foot', 65),
          ],
          swing: 0.25,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'bebop', 'fast', 'complex', 'parker'],
  icon: '🎷',
};

// ============================================================================
// ELECTRONIC STYLES (Extended)
// ============================================================================

/**
 * Techno style - driving electronic
 */
const TECHNO_STYLE: ArrangerStyle = {
  id: 'techno',
  name: 'Techno',
  category: 'Electronic',
  subcategory: 'Techno',
  description: 'Driving, hypnotic techno',
  tempoRange: { min: 125, max: 150 },
  defaultTempo: 135,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acid-bass', { octave: 2, velocityRange: [90, 120] }),
    voice('drums', 'tr-909', { velocityRange: [95, 127] }),
    voice('synth', 'techno-lead', { octave: 3, velocityRange: [85, 110] }),
    voice('pad', 'dark-pad', { octave: 3, velocityRange: [70, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main loop',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 110), step(1, 'root', 0.25, 85),
            step(2, 'root', 0.5, 105), step(3.5, 'fifth', 0.5, 95),
            step(4, 'root', 0.5, 110), step(5, 'root', 0.25, 85),
            step(6, 'root', 0.5, 105), step(7.5, 'fifth', 0.5, 95),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 120), drum(1, 'kick', 120),
            drum(2, 'kick', 120), drum(3, 'kick', 120),
            drum(4, 'kick', 120), drum(5, 'kick', 120),
            drum(6, 'kick', 120), drum(7, 'kick', 120),
            drum(2, 'clap', 105), drum(6, 'clap', 105),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 65)),
            drum(1.5, 'hihat-open', 80), drum(5.5, 'hihat-open', 80),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electronic', 'techno', 'driving', '909', 'hypnotic'],
  icon: '🔊',
};

/**
 * Trance style - euphoric electronic (old placeholder)
 */
export const TRANCE_STYLE_OLD: ArrangerStyle = {
  id: 'trance-old',
  name: 'Trance (Old)',
  category: 'Electronic',
  subcategory: 'Trance',
  description: 'Euphoric, uplifting trance',
  tempoRange: { min: 130, max: 145 },
  defaultTempo: 138,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'trance-bass', { octave: 2, velocityRange: [85, 115] }),
    voice('drums', 'trance-kit', { velocityRange: [90, 120] }),
    voice('synth', 'supersaw', { octave: 4, velocityRange: [85, 115] }),
    voice('pad', 'trance-pad', { octave: 4, velocityRange: [70, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main progression',
      voices: {
        bass: {
          steps: Array.from({ length: 16 }, (_, i) => 
            step(i * 0.5, 'root', 0.25, 95 + (i % 4 === 0 ? 15 : 0))
          ),
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 115), drum(1, 'kick', 115),
            drum(2, 'kick', 115), drum(3, 'kick', 115),
            drum(4, 'kick', 115), drum(5, 'kick', 115),
            drum(6, 'kick', 115), drum(7, 'kick', 115),
            drum(2, 'clap', 100), drum(6, 'clap', 100),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60)),
            ...Array.from({ length: 4 }, (_, i) => drum(i * 2 + 1.5, 'hihat-open', 75)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electronic', 'trance', 'euphoric', 'uplifting', 'supersaw'],
  icon: '🔊',
};

/**
 * Dubstep style - heavy bass drops (old placeholder)
 */
export const DUBSTEP_STYLE_OLD: ArrangerStyle = {
  id: 'dubstep-old',
  name: 'Dubstep (Old)',
  category: 'Electronic',
  subcategory: 'Bass',
  description: 'Heavy bass wobbles and drops',
  tempoRange: { min: 138, max: 150 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'wobble-bass', { octave: 1, velocityRange: [100, 127] }),
    voice('drums', 'dubstep-kit', { velocityRange: [100, 127] }),
    voice('synth', 'growl-synth', { octave: 2, velocityRange: [90, 127] }),
    voice('pad', 'dark-atmosphere', { octave: 3, velocityRange: [60, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Drop section',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 127), step(1, 'root', 0.5, 110),
            step(2, 'root', 0.5, 115), step(2.5, 'fifth', 0.5, 100),
            step(3, 'root', 1, 120),
            step(4, 'root', 1, 127), step(5, 'root', 0.5, 110),
            step(6, 'fifth', 0.5, 115), step(6.5, 'root', 0.5, 100),
            step(7, 'root', 1, 120),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 127), drum(4, 'kick', 127),
            drum(2, 'snare', 120), drum(6, 'snare', 120),
            drum(1.5, 'kick', 100), drum(5.5, 'kick', 100),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 60)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electronic', 'dubstep', 'bass', 'wobble', 'drop'],
  icon: '🔊',
};

// ============================================================================
// SOUL/R&B STYLES
// ============================================================================

/**
 * Classic Soul style - Motown inspired
 */
export const CLASSIC_SOUL_STYLE: ArrangerStyle = {
  id: 'classic-soul',
  name: 'Classic Soul',
  category: 'R&B',
  subcategory: 'Soul',
  description: 'Motown-inspired classic soul',
  tempoRange: { min: 95, max: 130 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'motown-bass', { octave: 2, velocityRange: [80, 105] }),
    voice('drums', 'motown-kit', { velocityRange: [80, 105] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [75, 95] }),
    voice('strings', 'soul-strings', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 95), step(1, 'fifth', 0.5, 80),
            step(2, 'root', 1, 90), step(3, 'third', 0.5, 75),
            step(4, 'root', 1, 95), step(5, 'fifth', 0.5, 80),
            step(6, 'octave', 1, 90), step(7.5, 'fifth', 0.5, 85),
          ],
          swing: 0.1,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(2, 'snare', 100),
            drum(4, 'kick', 95), drum(6, 'snare', 100),
            drum(3.5, 'kick', 75), drum(7.5, 'kick', 75),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 60)),
            drum(1.5, 'tambourine', 70), drum(3.5, 'tambourine', 70),
            drum(5.5, 'tambourine', 70), drum(7.5, 'tambourine', 70),
          ],
          swing: 0.1,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rnb', 'soul', 'motown', 'classic', '60s'],
  icon: '🎤',
};

/**
 * Neo-Soul style - modern soul jazz
 */
export const NEO_SOUL_STYLE: ArrangerStyle = {
  id: 'neo-soul',
  name: 'Neo-Soul',
  category: 'R&B',
  subcategory: 'Neo-Soul',
  description: 'Modern jazz-influenced soul',
  tempoRange: { min: 75, max: 105 },
  defaultTempo: 88,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'neo-soul-bass', { octave: 2, velocityRange: [70, 95] }),
    voice('drums', 'neo-kit', { velocityRange: [65, 90] }),
    voice('keys', 'neo-rhodes', { octave: 4, velocityRange: [65, 90] }),
    voice('pad', 'warm-pad', { octave: 4, velocityRange: [55, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 2, 85), step(2.5, 'fifth', 0.5, 70),
            step(3, 'third', 1, 75),
            step(4, 'root', 1.5, 85), step(5.5, 'seventh', 0.5, 70),
            step(6, 'sixth', 1, 75), step(7.5, 'fifth', 0.5, 70),
          ],
          swing: 0.15,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(2.5, 'kick', 70),
            drum(2, 'snare', 75), drum(6, 'snare', 75),
            drum(4.5, 'kick', 65), drum(7, 'kick', 65),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 45 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          ],
          swing: 0.15,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rnb', 'neo-soul', 'modern', 'jazz', 'erykah'],
  icon: '🎤',
};

/**
 * Northern Soul style - uptempo soul with driving rhythm
 */
export const NORTHERN_SOUL_STYLE: ArrangerStyle = {
  id: 'northern-soul',
  name: 'Northern Soul',
  category: 'R&B',
  subcategory: 'Soul',
  description: 'Uptempo Northern Soul with energetic beat',
  tempoRange: { min: 120, max: 145 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'motown-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'vintage-kit', { velocityRange: [75, 95] }),
    voice('piano', 'electric-piano', { octave: 4, velocityRange: [70, 90] }),
    voice('strings', 'string-section', { octave: 5, velocityRange: [65, 85] }),
    voice('brass', 'brass-section', { octave: 4, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Northern Soul groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'fifth', 0.25, 80),
            step(0.75, 'root', 0.25, 85), step(1, 'third', 0.5, 88),
            step(1.5, 'fifth', 0.25, 82), step(1.75, 'root', 0.25, 80),
            step(2, 'root', 0.5, 92), step(2.5, 'fifth', 0.25, 82),
            step(2.75, 'third', 0.25, 78), step(3, 'fifth', 0.5, 85),
            step(3.5, 'root', 0.5, 88),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(1, 'snare', 95),
            drum(2, 'kick', 88), drum(3, 'snare', 95),
            drum(0, 'hihat-closed', 70), drum(0.5, 'hihat-closed', 65),
            drum(1, 'hihat-closed', 72), drum(1.5, 'hihat-closed', 68),
            drum(2, 'hihat-closed', 70), drum(2.5, 'hihat-closed', 65),
            drum(3, 'hihat-closed', 72), drum(3.5, 'hihat-closed', 75),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rnb', 'soul', 'northern-soul', 'uptempo', 'motown'],
  icon: '🎤',
};

/**
 * 90s R&B style - New Jack Swing influenced with hip-hop beats
 */
export const NINETIES_RNB_STYLE: ArrangerStyle = {
  id: '90s-rnb',
  name: '90s R&B',
  category: 'R&B',
  subcategory: 'Contemporary',
  description: '90s R&B with new jack swing lite feel',
  tempoRange: { min: 75, max: 95 },
  defaultTempo: 85,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', '808-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', '90s-kit', { velocityRange: [70, 90] }),
    voice('keys', 'electric-piano', { octave: 4, velocityRange: [65, 85] }),
    voice('pad', 'synth-pad', { octave: 5, velocityRange: [60, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: '90s R&B groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 85), step(0.75, 'fifth', 0.25, 75),
            step(1, 'third', 0.5, 80), step(1.75, 'root', 0.25, 70),
            step(2, 'root', 0.75, 88), step(2.75, 'fifth', 0.25, 78),
            step(3.5, 'third', 0.5, 82),
          ],
          swing: 0.05,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.5, 'kick', 70),
            drum(1, 'snare', 90), drum(1.75, 'kick', 65),
            drum(2, 'kick', 85), drum(2.75, 'kick', 70),
            drum(3, 'snare', 90), drum(3.5, 'snare', 75),
            drum(0, 'hihat-closed', 60), drum(0.25, 'hihat-closed', 55),
            drum(0.5, 'hihat-closed', 62), drum(0.75, 'hihat-closed', 58),
            drum(1, 'hihat-open', 65), drum(1.5, 'hihat-closed', 60),
            drum(1.75, 'hihat-closed', 55), drum(2, 'hihat-closed', 62),
            drum(2.25, 'hihat-closed', 58), drum(2.5, 'hihat-closed', 60),
            drum(2.75, 'hihat-closed', 55), drum(3, 'hihat-open', 65),
            drum(3.5, 'hihat-closed', 60), drum(3.75, 'hihat-closed', 58),
          ],
          swing: 0.05,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rnb', '90s', 'new-jack-swing', 'hip-hop', 'r-kelly'],
  icon: '🎤',
};

/**
 * New Jack Swing - 90s R&B/Hip-Hop hybrid (Teddy Riley style)
 */
export const NEW_JACK_SWING_STYLE: ArrangerStyle = {
  id: 'new-jack-swing',
  name: 'New Jack Swing',
  category: 'R&B',
  subcategory: 'Funk',
  description: '90s R&B/Hip-Hop hybrid with swung 16th notes (Teddy Riley)',
  tempoRange: { min: 95, max: 115 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', '808-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'njs-kit', { velocityRange: [75, 95] }),
    voice('keys', 'electric-piano', { octave: 4, velocityRange: [70, 90] }),
    voice('synth', 'synth-brass', { octave: 4, velocityRange: [75, 95] }),
    voice('pad', 'vocal-pad', { octave: 5, velocityRange: [60, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'New Jack Swing groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 90), step(0.75, 'fifth', 0.25, 80),
            step(1, 'third', 0.5, 85), step(1.625, 'fifth', 0.125, 75),
            step(1.75, 'root', 0.25, 82),
            step(2, 'root', 0.875, 92), step(2.875, 'seventh', 0.125, 78),
            step(3, 'fifth', 0.5, 88), step(3.625, 'third', 0.125, 75),
            step(3.75, 'root', 0.25, 80),
          ],
          swing: 0.12,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(0.5, 'kick', 75),
            drum(1, 'snare', 95), drum(1.625, 'kick', 70),
            drum(2, 'kick', 92), drum(2.75, 'kick', 75),
            drum(3, 'snare', 95), drum(3.375, 'snare', 70),
            drum(3.625, 'kick', 68),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 55 + (i % 4 === 0 ? 12 : i % 2 === 0 ? 6 : 0))),
            drum(1, 'hihat-open', 70), drum(3, 'hihat-open', 70),
            drum(0.75, 'clap', 60), drum(1.75, 'clap', 58), drum(2.75, 'clap', 60),
          ],
          swing: 0.12,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rnb', 'new-jack-swing', '90s', 'teddy-riley', 'bobby-brown', 'janet-jackson'],
  icon: '🎤',
};

/**
 * Quiet Storm - slow romantic R&B ballad
 */
export const QUIET_STORM_STYLE: ArrangerStyle = {
  id: 'quiet-storm',
  name: 'Quiet Storm',
  category: 'R&B',
  subcategory: 'Ballad',
  description: 'Slow romantic R&B ballad with lush instrumentation',
  tempoRange: { min: 60, max: 80 },
  defaultTempo: 70,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'smooth-bass', { octave: 2, velocityRange: [65, 85] }),
    voice('drums', 'brushes-kit', { velocityRange: [55, 75] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [60, 80] }),
    voice('strings', 'lush-strings', { octave: 4, velocityRange: [65, 85] }),
    voice('pad', 'warm-pad', { octave: 5, velocityRange: [55, 75] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Quiet Storm groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 2, 75), step(2, 'fifth', 1, 70),
            step(3, 'third', 0.5, 68), step(3.5, 'seventh', 0.5, 65),
            step(4, 'root', 1.5, 78), step(5.5, 'fifth', 0.5, 70),
            step(6, 'sixth', 1, 72), step(7, 'fifth', 1, 68),
          ],
          swing: 0.08,
        },
        drums: {
          steps: [
            drum(0, 'kick', 65), drum(2, 'snare', 70),
            drum(4, 'kick', 68), drum(6, 'snare', 72),
            drum(3.5, 'kick', 55), drum(7.75, 'kick', 58),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'brush-ride', 45 + (i % 4 === 0 ? 10 : 0))),
            drum(0, 'tambourine', 50), drum(2, 'tambourine', 52),
            drum(4, 'tambourine', 50), drum(6, 'tambourine', 52),
          ],
          swing: 0.08,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rnb', 'ballad', 'quiet-storm', 'romantic', 'smooth', 'luther-vandross'],
  icon: '🌙',
};

/**
 * P-Funk - Parliament-style deep groove funk
 */
export const P_FUNK_STYLE: ArrangerStyle = {
  id: 'p-funk',
  name: 'P-Funk',
  category: 'Funk',
  subcategory: 'Classic Funk',
  description: 'Parliament-style deep groove with synthesizers and horns',
  tempoRange: { min: 100, max: 120 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'funk-bass', { octave: 2, velocityRange: [85, 105] }),
    voice('drums', 'funk-kit', { velocityRange: [80, 100] }),
    voice('keys', 'clavinet', { octave: 4, velocityRange: [75, 95] }),
    voice('synth', 'lead-synth', { octave: 4, velocityRange: [70, 90] }),
    voice('brass', 'brass-stabs', { octave: 4, velocityRange: [80, 100] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'P-Funk groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 95), step(0.375, 'root', 0.125, 85),
            step(0.5, 'octave', 0.25, 90), step(0.75, 'root', 0.125, 80),
            step(0.875, 'fifth', 0.125, 78), step(1, 'third', 0.25, 88),
            step(1.25, 'root', 0.25, 85), step(1.625, 'seventh', 0.125, 75),
            step(1.75, 'fifth', 0.125, 73), step(2, 'root', 0.5, 92),
            step(2.5, 'octave', 0.25, 88), step(2.75, 'fifth', 0.125, 80),
            step(2.875, 'third', 0.125, 78), step(3, 'root', 0.375, 90),
            step(3.375, 'fifth', 0.125, 82), step(3.5, 'seventh', 0.25, 85),
            step(3.75, 'fifth', 0.125, 80), step(3.875, 'root', 0.125, 78),
          ],
          swing: 0.05,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(0.5, 'kick', 80),
            drum(1, 'snare', 100), drum(1.5, 'kick', 75),
            drum(2, 'kick', 95), drum(2.5, 'kick', 80),
            drum(3, 'snare', 100), drum(3.375, 'snare', 85),
            drum(3.5, 'kick', 78), drum(3.75, 'kick', 75),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 10 : i % 2 === 0 ? 5 : 0))),
            drum(1, 'hihat-open', 75), drum(3, 'hihat-open', 75),
            drum(0.5, 'cowbell', 70), drum(2.5, 'cowbell', 68),
          ],
          swing: 0.05,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['funk', 'p-funk', 'parliament', 'george-clinton', 'mothership'],
  icon: '🛸',
};

/**
 * Funk Rock - Red Hot Chili Peppers style funk-rock hybrid
 */
export const FUNK_ROCK_STYLE: ArrangerStyle = {
  id: 'funk-rock',
  name: 'Funk Rock',
  category: 'Funk',
  subcategory: 'Rock',
  description: 'Aggressive funk-rock with slap bass and distorted guitar (RHCP style)',
  tempoRange: { min: 105, max: 125 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'slap-bass', { octave: 2, velocityRange: [85, 110] }),
    voice('drums', 'rock-kit', { velocityRange: [85, 105] }),
    voice('guitar', 'funk-guitar', { octave: 3, velocityRange: [80, 100] }),
    voice('keys', 'organ', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Funk Rock groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 100, { articulation: 'slap' }),
            step(0.25, 'octave', 0.125, 95, { articulation: 'slap' }),
            step(0.375, 'root', 0.125, 85, { articulation: 'pop' }),
            step(0.5, 'fifth', 0.125, 90, { articulation: 'slap' }),
            step(0.625, 'root', 0.125, 80, { articulation: 'pop' }),
            step(0.75, 'third', 0.25, 88, { articulation: 'slap' }),
            step(1, 'root', 0.25, 95, { articulation: 'slap' }),
            step(1.375, 'fifth', 0.125, 82, { articulation: 'pop' }),
            step(1.5, 'seventh', 0.125, 85, { articulation: 'slap' }),
            step(1.75, 'octave', 0.125, 88, { articulation: 'slap' }),
            step(1.875, 'root', 0.125, 78, { articulation: 'pop' }),
            step(2, 'root', 0.375, 98, { articulation: 'slap' }),
            step(2.5, 'fifth', 0.25, 85, { articulation: 'slap' }),
            step(2.75, 'third', 0.125, 80, { articulation: 'pop' }),
            step(2.875, 'root', 0.125, 75, { articulation: 'pop' }),
            step(3, 'root', 0.25, 92, { articulation: 'slap' }),
            step(3.5, 'octave', 0.125, 88, { articulation: 'slap' }),
            step(3.625, 'fifth', 0.125, 82, { articulation: 'pop' }),
            step(3.75, 'third', 0.125, 85, { articulation: 'slap' }),
            step(3.875, 'root', 0.125, 80, { articulation: 'pop' }),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(0.5, 'kick', 85),
            drum(1, 'snare', 105), drum(1.75, 'kick', 78),
            drum(2, 'kick', 100), drum(2.5, 'kick', 85),
            drum(3, 'snare', 105), drum(3.5, 'snare', 90),
            drum(3.75, 'kick', 82),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 65 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
            drum(1, 'hihat-open', 80), drum(3, 'hihat-open', 80),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['funk', 'rock', 'funk-rock', 'rhcp', 'slap-bass', 'flea'],
  icon: '🌶️',
};

/**
 * Funk Classic - James Brown style tight funk
 */
export const FUNK_CLASSIC_STYLE: ArrangerStyle = {
  id: 'funk-classic',
  name: 'Funk Classic',
  category: 'Funk',
  subcategory: 'Classic Funk',
  description: 'James Brown style tight funk with syncopated 16th notes',
  tempoRange: { min: 95, max: 115 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'funk-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'classic-funk-kit', { velocityRange: [80, 100] }),
    voice('guitar', 'funk-guitar', { octave: 3, velocityRange: [75, 95] }),
    voice('keys', 'organ', { octave: 4, velocityRange: [70, 90] }),
    voice('brass', 'brass-hits', { octave: 4, velocityRange: [85, 105] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'JB funk groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.125, 95), step(0.125, 'octave', 0.125, 85),
            step(0.25, 'root', 0.125, 90), step(0.5, 'fifth', 0.125, 88),
            step(0.625, 'root', 0.125, 82), step(0.75, 'third', 0.125, 85),
            step(1, 'root', 0.25, 92), step(1.375, 'seventh', 0.125, 80),
            step(1.5, 'fifth', 0.125, 85), step(1.75, 'octave', 0.125, 88),
            step(2, 'root', 0.125, 95), step(2.125, 'octave', 0.125, 85),
            step(2.25, 'root', 0.125, 90), step(2.5, 'fifth', 0.125, 88),
            step(2.625, 'third', 0.125, 82), step(2.75, 'root', 0.125, 80),
            step(3, 'root', 0.25, 92), step(3.375, 'fifth', 0.125, 85),
            step(3.5, 'seventh', 0.125, 88), step(3.75, 'octave', 0.125, 90),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(0.5, 'kick', 80),
            drum(1, 'snare', 100), drum(1.375, 'snare', 75),
            drum(2, 'kick', 95), drum(2.5, 'kick', 80),
            drum(3, 'snare', 100), drum(3.375, 'snare', 85),
            drum(3.75, 'kick', 78),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 2 === 0 ? 10 : 5))),
            drum(0.875, 'hihat-open', 70), drum(2.875, 'hihat-open', 70),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['funk', 'classic', 'james-brown', 'tight', 'syncopated', 'the-one'],
  icon: '🎺',
};

/**
 * Disco - classic four-on-the-floor dance
 */
export const DISCO_STYLE: ArrangerStyle = {
  id: 'disco',
  name: 'Disco',
  category: 'Funk',
  subcategory: 'Disco',
  description: 'Classic disco with four-on-the-floor and string orchestration',
  tempoRange: { min: 110, max: 130 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'disco-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'disco-kit', { velocityRange: [85, 105] }),
    voice('guitar', 'rhythm-guitar', { octave: 3, velocityRange: [70, 90] }),
    voice('strings', 'disco-strings', { octave: 4, velocityRange: [75, 95] }),
    voice('synth', 'synth-pad', { octave: 5, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Disco groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'octave', 0.25, 85),
            step(0.75, 'fifth', 0.25, 80), step(1, 'root', 0.5, 92),
            step(1.5, 'fifth', 0.25, 82), step(1.75, 'third', 0.25, 78),
            step(2, 'root', 0.5, 90), step(2.5, 'octave', 0.25, 85),
            step(2.75, 'fifth', 0.25, 80), step(3, 'root', 0.5, 92),
            step(3.5, 'seventh', 0.25, 82), step(3.75, 'fifth', 0.25, 78),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(1, 'kick', 100),
            drum(2, 'kick', 100), drum(3, 'kick', 100),
            drum(1, 'snare', 90), drum(3, 'snare', 90),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-open', 75 + (i % 2 === 0 ? 10 : 0))),
            drum(0, 'crash', 85), drum(2, 'crash', 82),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['disco', 'dance', 'four-on-floor', '70s', 'bee-gees', 'donna-summer'],
  icon: '🕺',
};

/**
 * Nu Disco - modern disco with electronic elements
 */
export const NU_DISCO_STYLE: ArrangerStyle = {
  id: 'nu-disco',
  name: 'Nu Disco',
  category: 'Funk',
  subcategory: 'Disco',
  description: 'Modern disco with electronic production and filtered samples',
  tempoRange: { min: 110, max: 126 },
  defaultTempo: 118,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'electronic-kit', { velocityRange: [80, 100] }),
    voice('guitar', 'filtered-guitar', { octave: 3, velocityRange: [70, 90] }),
    voice('synth', 'lead-synth', { octave: 4, velocityRange: [75, 95] }),
    voice('pad', 'warm-pad', { octave: 5, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Nu Disco groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 90), step(0.75, 'octave', 0.25, 85),
            step(1, 'fifth', 0.5, 88), step(1.5, 'root', 0.25, 82),
            step(1.75, 'third', 0.25, 78), step(2, 'root', 0.75, 92),
            step(2.75, 'fifth', 0.25, 85), step(3, 'octave', 0.5, 90),
            step(3.5, 'seventh', 0.25, 82), step(3.75, 'fifth', 0.25, 78),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(1, 'kick', 95),
            drum(2, 'kick', 95), drum(3, 'kick', 95),
            drum(1, 'snare', 85), drum(3, 'snare', 85),
            drum(0.5, 'clap', 75), drum(2.5, 'clap', 75),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 12 : i % 2 === 0 ? 6 : 0))),
            drum(1.5, 'hihat-open', 70), drum(3.5, 'hihat-open', 70),
            drum(0, 'shaker', 55), drum(0.5, 'shaker', 52),
            drum(1, 'shaker', 55), drum(1.5, 'shaker', 52),
            drum(2, 'shaker', 55), drum(2.5, 'shaker', 52),
            drum(3, 'shaker', 55), drum(3.5, 'shaker', 52),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['nu-disco', 'dance', 'electronic', 'modern', 'filtered', 'daft-punk'],
  icon: '💃',
};

/**
 * Boogie - synth funk/electro-funk from early 80s
 */
export const BOOGIE_STYLE: ArrangerStyle = {
  id: 'boogie',
  name: 'Boogie',
  category: 'Funk',
  subcategory: 'Synth Funk',
  description: 'Early 80s synth funk with electronic drums and slap bass',
  tempoRange: { min: 100, max: 120 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'linn-drum', { velocityRange: [75, 95] }),
    voice('keys', 'dx7-rhodes', { octave: 4, velocityRange: [70, 90] }),
    voice('synth', 'poly-synth', { octave: 4, velocityRange: [75, 95] }),
    voice('pad', 'string-synth', { octave: 5, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Boogie groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 92), step(0.25, 'octave', 0.125, 85),
            step(0.5, 'fifth', 0.25, 88), step(0.75, 'root', 0.125, 80),
            step(1, 'third', 0.25, 85), step(1.375, 'fifth', 0.125, 78),
            step(1.5, 'root', 0.25, 90), step(1.75, 'octave', 0.125, 82),
            step(2, 'root', 0.25, 95), step(2.25, 'fifth', 0.125, 85),
            step(2.5, 'seventh', 0.25, 88), step(2.75, 'root', 0.125, 80),
            step(3, 'octave', 0.25, 90), step(3.375, 'fifth', 0.125, 82),
            step(3.5, 'third', 0.25, 85), step(3.75, 'root', 0.125, 78),
          ],
          swing: 0.03,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(0.5, 'kick', 75),
            drum(1, 'snare', 95), drum(1.75, 'kick', 70),
            drum(2, 'kick', 90), drum(2.5, 'kick', 75),
            drum(3, 'snare', 95), drum(3.5, 'snare', 80),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 10 : i % 2 === 0 ? 5 : 0))),
            drum(1, 'hihat-open', 70), drum(3, 'hihat-open', 70),
            drum(0.5, 'clap', 65), drum(2.5, 'clap', 65),
          ],
          swing: 0.03,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['boogie', 'synth-funk', 'electro-funk', '80s', 'linn-drum', 'zapp'],
  icon: '🎹',
};

/**
 * Gospel Traditional - church organ and choir
 */
export const GOSPEL_TRADITIONAL_STYLE: ArrangerStyle = {
  id: 'gospel-traditional',
  name: 'Gospel Traditional',
  category: 'R&B',
  subcategory: 'Gospel',
  description: 'Traditional gospel with church organ, choir voicings, and swing feel',
  tempoRange: { min: 70, max: 90 },
  defaultTempo: 80,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'brushes-kit', { velocityRange: [70, 90] }),
    voice('organ', 'hammond-organ', { octave: 4, velocityRange: [75, 95] }),
    voice('choir', 'choir-pad', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Traditional gospel groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 85), step(1, 'fifth', 0.5, 80),
            step(1.5, 'octave', 0.5, 78), step(2, 'root', 1, 88),
            step(3, 'third', 0.5, 82), step(3.5, 'fifth', 0.5, 78),
            step(4, 'root', 1.5, 90), step(5.5, 'seventh', 0.5, 80),
            step(6, 'fifth', 1, 85), step(7, 'third', 1, 80),
          ],
          swing: 0.15,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(2, 'snare', 85),
            drum(4, 'kick', 82), drum(6, 'snare', 88),
            drum(3.5, 'kick', 65), drum(7.5, 'kick', 68),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'brush-ride', 55 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
            drum(0, 'tambourine', 60), drum(2, 'tambourine', 65),
            drum(4, 'tambourine', 60), drum(6, 'tambourine', 65),
          ],
          swing: 0.15,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['gospel', 'traditional', 'church', 'organ', 'choir', 'mahalia-jackson'],
  icon: '⛪',
};

/**
 * Gospel Contemporary - Kirk Franklin style modern gospel
 */
export const GOSPEL_CONTEMPORARY_STYLE: ArrangerStyle = {
  id: 'gospel-contemporary',
  name: 'Gospel Contemporary',
  category: 'R&B',
  subcategory: 'Gospel',
  description: 'Contemporary gospel with R&B and hip-hop influences (Kirk Franklin style)',
  tempoRange: { min: 90, max: 110 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', '808-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'modern-kit', { velocityRange: [80, 100] }),
    voice('organ', 'hammond-organ', { octave: 4, velocityRange: [75, 95] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [70, 90] }),
    voice('choir', 'gospel-choir', { octave: 4, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Contemporary gospel groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 90), step(0.75, 'fifth', 0.25, 82),
            step(1, 'third', 0.5, 88), step(1.5, 'root', 0.25, 80),
            step(1.75, 'octave', 0.25, 85), step(2, 'root', 0.75, 92),
            step(2.75, 'seventh', 0.25, 82), step(3, 'fifth', 0.5, 88),
            step(3.5, 'third', 0.25, 85), step(3.75, 'root', 0.25, 80),
          ],
          swing: 0.08,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(0.5, 'kick', 80),
            drum(1, 'snare', 100), drum(1.75, 'kick', 75),
            drum(2, 'kick', 95), drum(2.5, 'kick', 80),
            drum(3, 'snare', 100), drum(3.375, 'snare', 85),
            drum(3.625, 'kick', 72),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 12 : i % 2 === 0 ? 6 : 0))),
            drum(1, 'hihat-open', 75), drum(3, 'hihat-open', 75),
            drum(0.5, 'clap', 70), drum(2.5, 'clap', 70),
            drum(0, 'tambourine', 65), drum(0.5, 'tambourine', 60),
            drum(1, 'tambourine', 65), drum(1.5, 'tambourine', 60),
            drum(2, 'tambourine', 65), drum(2.5, 'tambourine', 60),
            drum(3, 'tambourine', 65), drum(3.5, 'tambourine', 60),
          ],
          swing: 0.08,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['gospel', 'contemporary', 'modern', 'kirk-franklin', 'rnb', 'hip-hop'],
  icon: '🙏',
};

/**
 * Gospel Choir - full choir backing
 */
export const GOSPEL_CHOIR_STYLE: ArrangerStyle = {
  id: 'gospel-choir',
  name: 'Gospel Choir',
  category: 'R&B',
  subcategory: 'Gospel',
  description: 'Full choir backing with rich harmonies and call-response',
  tempoRange: { min: 85, max: 105 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [70, 90] }),
    voice('drums', 'brushes-kit', { velocityRange: [65, 85] }),
    voice('organ', 'hammond-organ', { octave: 4, velocityRange: [70, 90] }),
    voice('choir-soprano', 'choir-soprano', { octave: 5, velocityRange: [75, 95] }),
    voice('choir-alto', 'choir-alto', { octave: 4, velocityRange: [75, 95] }),
    voice('choir-tenor', 'choir-tenor', { octave: 4, velocityRange: [75, 95] }),
    voice('choir-bass', 'choir-bass', { octave: 3, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Full choir harmony',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 80), step(1, 'fifth', 0.5, 75),
            step(1.5, 'octave', 0.5, 72), step(2, 'root', 1, 82),
            step(3, 'third', 0.5, 77), step(3.5, 'fifth', 0.5, 75),
            step(4, 'root', 1.5, 85), step(5.5, 'seventh', 0.5, 75),
            step(6, 'fifth', 1, 80), step(7, 'third', 1, 75),
          ],
          swing: 0.12,
        },
        drums: {
          steps: [
            drum(0, 'kick', 75), drum(2, 'snare', 80),
            drum(4, 'kick', 77), drum(6, 'snare', 82),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'brush-ride', 50 + (i % 4 === 0 ? 12 : i % 2 === 0 ? 6 : 0))),
            drum(0, 'tambourine', 60), drum(2, 'tambourine', 65),
            drum(4, 'tambourine', 60), drum(6, 'tambourine', 65),
          ],
          swing: 0.12,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['gospel', 'choir', 'harmony', 'church', 'call-response', 'vocal'],
  icon: '👨‍👩‍👧‍👦',
};

/**
 * Philly Soul - lush strings and orchestral arrangements
 */
export const PHILLY_SOUL_STYLE: ArrangerStyle = {
  id: 'philly-soul',
  name: 'Philly Soul',
  category: 'R&B',
  subcategory: 'Soul',
  description: 'Lush string arrangements and sophisticated production (Philadelphia International)',
  tempoRange: { min: 95, max: 115 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'soul-kit', { velocityRange: [70, 90] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [65, 85] }),
    voice('strings', 'string-ensemble', { octave: 4, velocityRange: [70, 90] }),
    voice('vibes', 'vibraphone', { octave: 4, velocityRange: [60, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Lush and smooth',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 85), step(0.75, 'fifth', 0.25, 78),
            step(1, 'third', 0.5, 82), step(1.5, 'root', 0.5, 80),
            step(2, 'root', 0.75, 85), step(2.75, 'seventh', 0.25, 78),
            step(3, 'fifth', 0.75, 82), step(3.75, 'third', 0.25, 75),
          ],
          swing: 0.1,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(2, 'snare', 85),
            drum(4, 'kick', 80), drum(6, 'snare', 85),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 55 + (i % 4 === 0 ? 10 : i % 2 === 0 ? 5 : 0))),
            drum(0, 'shaker', 55), drum(0.5, 'shaker', 50),
            drum(1, 'shaker', 55), drum(1.5, 'shaker', 50),
            drum(2, 'shaker', 55), drum(2.5, 'shaker', 50),
            drum(3, 'shaker', 55), drum(3.5, 'shaker', 50),
          ],
          swing: 0.1,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['soul', 'philly', 'strings', 'orchestral', 'gamble-huff', 'sophisticated'],
  icon: '🎻',
};

/**
 * Memphis Soul - Stax sound with horns
 */
export const MEMPHIS_SOUL_STYLE: ArrangerStyle = {
  id: 'memphis-soul',
  name: 'Memphis Soul',
  category: 'R&B',
  subcategory: 'Soul',
  description: 'Stax Records sound with punchy horns and tight groove',
  tempoRange: { min: 85, max: 105 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'soul-kit', { velocityRange: [75, 95] }),
    voice('organ', 'hammond-organ', { octave: 4, velocityRange: [70, 90] }),
    voice('guitar', 'clean-guitar', { octave: 3, velocityRange: [65, 85] }),
    voice('horns', 'brass-section', { octave: 4, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Stax groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'fifth', 0.5, 82),
            step(1, 'octave', 0.5, 85), step(1.5, 'root', 0.5, 80),
            step(2, 'root', 0.5, 90), step(2.5, 'third', 0.5, 82),
            step(3, 'fifth', 0.5, 85), step(3.5, 'seventh', 0.5, 78),
          ],
          swing: 0.08,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(2, 'snare', 95),
            drum(4, 'kick', 90), drum(6, 'snare', 95),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60 + (i % 4 === 0 ? 12 : i % 2 === 0 ? 6 : 0))),
            drum(2, 'hihat-open', 70), drum(6, 'hihat-open', 70),
          ],
          swing: 0.08,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['soul', 'memphis', 'stax', 'horns', 'otis-redding', 'booker-t'],
  icon: '🎺',
};

/**
 * Chicago Soul - Curtis Mayfield style
 */
export const CHICAGO_SOUL_STYLE: ArrangerStyle = {
  id: 'chicago-soul',
  name: 'Chicago Soul',
  category: 'R&B',
  subcategory: 'Soul',
  description: 'Curtis Mayfield-style sophisticated soul with jazzy chords',
  tempoRange: { min: 90, max: 110 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'soul-kit', { velocityRange: [70, 90] }),
    voice('guitar', 'wah-guitar', { octave: 3, velocityRange: [70, 90] }),
    voice('keys', 'wurlitzer', { octave: 4, velocityRange: [65, 85] }),
    voice('strings', 'string-ensemble', { octave: 4, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Smooth Chicago groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 85), step(0.75, 'octave', 0.25, 78),
            step(1, 'fifth', 0.5, 82), step(1.5, 'third', 0.25, 75),
            step(1.75, 'root', 0.25, 72), step(2, 'root', 0.75, 85),
            step(2.75, 'seventh', 0.25, 78), step(3, 'fifth', 0.75, 82),
            step(3.75, 'third', 0.25, 75),
          ],
          swing: 0.12,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(1.5, 'kick', 70),
            drum(2, 'snare', 85), drum(4, 'kick', 80),
            drum(5.5, 'kick', 70), drum(6, 'snare', 85),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 55 + (i % 4 === 0 ? 10 : i % 2 === 0 ? 5 : 0))),
            drum(0, 'shaker', 50), drum(0.5, 'shaker', 45),
            drum(1, 'shaker', 50), drum(1.5, 'shaker', 45),
            drum(2, 'shaker', 50), drum(2.5, 'shaker', 45),
            drum(3, 'shaker', 50), drum(3.5, 'shaker', 45),
          ],
          swing: 0.12,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['soul', 'chicago', 'curtis-mayfield', 'wah', 'sophisticated', 'jazzy'],
  icon: '🎸',
};

/**
 * Blue-Eyed Soul - Hall & Oates style white soul
 */
export const BLUE_EYED_SOUL_STYLE: ArrangerStyle = {
  id: 'blue-eyed-soul',
  name: 'Blue-Eyed Soul',
  category: 'R&B',
  subcategory: 'Soul',
  description: 'White soul sound with pop sensibility (Hall & Oates, Simply Red)',
  tempoRange: { min: 85, max: 105 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'modern-kit', { velocityRange: [70, 90] }),
    voice('keys', 'dx7-keys', { octave: 4, velocityRange: [70, 90] }),
    voice('synth', 'analog-pad', { octave: 4, velocityRange: [60, 80] }),
    voice('saxophone', 'sax', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Pop-soul groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'fifth', 0.5, 78),
            step(1, 'octave', 0.5, 82), step(1.5, 'third', 0.5, 75),
            step(2, 'root', 0.5, 85), step(2.5, 'fifth', 0.5, 78),
            step(3, 'seventh', 0.5, 80), step(3.5, 'fifth', 0.5, 75),
          ],
          swing: 0.08,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(1.5, 'kick', 72),
            drum(2, 'snare', 88), drum(3.75, 'snare', 75),
            drum(4, 'kick', 85), drum(5.5, 'kick', 72),
            drum(6, 'snare', 88), drum(7.5, 'snare', 78),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 58 + (i % 4 === 0 ? 10 : i % 2 === 0 ? 5 : 0))),
            drum(2, 'hihat-open', 65), drum(6, 'hihat-open', 65),
          ],
          swing: 0.08,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['soul', 'blue-eyed', 'pop', 'hall-oates', 'simply-red', 'white-soul'],
  icon: '👀',
};

// ============================================================================
// FOLK/ACOUSTIC STYLES
// ============================================================================

/**
 * Folk Rock style - acoustic rock
 */
const FOLK_ROCK_STYLE: ArrangerStyle = {
  id: 'folk-rock',
  name: 'Folk Rock',
  category: 'Folk',
  subcategory: 'Rock',
  description: 'Acoustic guitar-driven folk rock',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [70, 95] }),
    voice('drums', 'folk-kit', { velocityRange: [70, 95] }),
    voice('guitar', 'acoustic-strum', { octave: 3, velocityRange: [70, 95] }),
    voice('keys', 'piano', { octave: 4, velocityRange: [60, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main strum',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 2, 85), step(2, 'fifth', 2, 75),
            step(4, 'root', 2, 85), step(6, 'third', 2, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(2, 'snare', 80),
            drum(4, 'kick', 85), drum(6, 'snare', 80),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 55)),
            drum(2, 'tambourine', 60), drum(6, 'tambourine', 60),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['folk', 'rock', 'acoustic', 'guitar', 'singer-songwriter'],
  icon: '🪕',
};

/**
 * Bluegrass style - fast acoustic
 */
const BLUEGRASS_STYLE: ArrangerStyle = {
  id: 'bluegrass',
  name: 'Bluegrass',
  category: 'Folk',
  subcategory: 'Bluegrass',
  description: 'Fast-paced acoustic bluegrass',
  tempoRange: { min: 120, max: 180 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [80, 105] }),
    voice('banjo', 'banjo', { octave: 4, velocityRange: [85, 110] }),
    voice('fiddle', 'fiddle', { octave: 4, velocityRange: [80, 105] }),
    voice('mandolin', 'mandolin', { octave: 4, velocityRange: [80, 105] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main drive',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 95), step(1, 'fifth', 1, 80),
            step(2, 'root', 1, 90), step(3, 'fifth', 1, 80),
            step(4, 'root', 1, 95), step(5, 'fifth', 1, 80),
            step(6, 'root', 1, 90), step(7, 'fifth', 1, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            // Bluegrass doesn't use drums, this is percussion-like
            drum(0, 'kick', 80), drum(2, 'snare', 75),
            drum(4, 'kick', 80), drum(6, 'snare', 75),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['folk', 'bluegrass', 'acoustic', 'banjo', 'fiddle'],
  icon: '🪕',
};

/**
 * Celtic style - Irish/Scottish traditional
 */
const CELTIC_STYLE: ArrangerStyle = {
  id: 'celtic',
  name: 'Celtic',
  category: 'Folk',
  subcategory: 'Celtic',
  description: 'Irish/Scottish traditional music',
  tempoRange: { min: 100, max: 150 },
  defaultTempo: 125,
  timeSignature: { numerator: 6, denominator: 8 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [70, 95] }),
    voice('drums', 'bodhran', { velocityRange: [70, 95] }),
    voice('fiddle', 'celtic-fiddle', { octave: 4, velocityRange: [75, 100] }),
    voice('whistle', 'tin-whistle', { octave: 5, velocityRange: [75, 100] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Jig feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1.5, 85), step(1.5, 'third', 1.5, 70),
            step(3, 'fifth', 1.5, 80), step(4.5, 'root', 1.5, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(3, 'kick', 75),
            ...Array.from({ length: 6 }, (_, i) => drum(i, 'hihat-closed', 55)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['folk', 'celtic', 'irish', 'scottish', 'jig', '6/8'],
  icon: '☘️',
};

/**
 * Country Ballad style - slow, emotional with pedal steel and piano
 */
const COUNTRY_BALLAD_STYLE: ArrangerStyle = {
  id: 'country-ballad',
  name: 'Country Ballad',
  category: 'Country',
  subcategory: 'Ballad',
  description: 'Slow emotional country ballad with pedal steel and piano',
  tempoRange: { min: 60, max: 80 },
  defaultTempo: 75,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [60, 80] }),
    voice('drums', 'brush-kit', { velocityRange: [50, 70] }),
    voice('piano', 'acoustic-piano', { octave: 4, velocityRange: [60, 85] }),
    voice('pedal-steel', 'pedal-steel', { octave: 4, velocityRange: [65, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main ballad feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 2, 70), step(2, 'fifth', 2, 65),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 60), drum(2, 'snare', 55),
            drum(0, 'hihat-closed', 50), drum(0.5, 'hihat-closed', 45),
            drum(1, 'hihat-closed', 50), drum(1.5, 'hihat-closed', 45),
            drum(2, 'hihat-closed', 50), drum(2.5, 'hihat-closed', 45),
            drum(3, 'hihat-closed', 50), drum(3.5, 'hihat-closed', 45),
          ],
          swing: 0,
        },
        piano: {
          steps: [
            step(0, 'root', 0.5, 65), step(0.5, 'third', 0.5, 60),
            step(1, 'fifth', 1, 70),
            step(2, 'third', 0.5, 65), step(2.5, 'root', 0.5, 60),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'ballad', 'slow', 'pedal-steel', 'emotional'],
  icon: '🤠',
};

/**
 * Country Waltz style - 3/4 with fiddle and steel guitar
 */
const COUNTRY_WALTZ_STYLE: ArrangerStyle = {
  id: 'country-waltz',
  name: 'Country Waltz',
  category: 'Country',
  subcategory: 'Waltz',
  description: '3/4 country waltz with fiddle and steel guitar',
  tempoRange: { min: 80, max: 120 },
  defaultTempo: 100,
  timeSignature: { numerator: 3, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'country-kit', { velocityRange: [70, 90] }),
    voice('fiddle', 'fiddle', { octave: 4, velocityRange: [75, 100] }),
    voice('steel', 'pedal-steel', { octave: 4, velocityRange: [70, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Classic waltz',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 85), step(1, 'fifth', 1, 70), step(2, 'third', 1, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(1, 'snare', 65), drum(2, 'snare', 65),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'waltz', '3/4', 'fiddle', 'steel-guitar'],
  icon: '🎻',
};

/**
 * Honky Tonk style - classic twangy country with upbeat feel
 */
const HONKY_TONK_STYLE: ArrangerStyle = {
  id: 'honky-tonk',
  name: 'Honky Tonk',
  category: 'Country',
  subcategory: 'Honky Tonk',
  description: 'Classic twangy honky tonk piano with driving rhythm',
  tempoRange: { min: 110, max: 160 },
  defaultTempo: 135,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'country-kit', { velocityRange: [75, 95] }),
    voice('piano', 'honky-tonk-piano', { octave: 4, velocityRange: [80, 105] }),
    voice('guitar', 'electric-guitar-clean', { octave: 3, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Driving honky tonk',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'fifth', 0.5, 80),
            step(1, 'root', 0.5, 85), step(1.5, 'fifth', 0.5, 80),
            step(2, 'root', 0.5, 90), step(2.5, 'fifth', 0.5, 80),
            step(3, 'root', 0.5, 85), step(3.5, 'fifth', 0.5, 80),
          ],
          swing: 0.1,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.5, 'snare', 70), drum(1, 'kick', 80),
            drum(1.5, 'snare', 75), drum(2, 'kick', 85), drum(2.5, 'snare', 70),
            drum(3, 'kick', 80), drum(3.5, 'snare', 75),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60)),
          ],
          swing: 0.1,
        },
        piano: {
          steps: [
            step(0, 'root', 0.25, 90), step(0.25, 'third', 0.25, 85),
            step(0.5, 'fifth', 0.25, 80), step(0.75, 'octave', 0.25, 85),
            step(1, 'root', 0.25, 85), step(1.25, 'fifth', 0.25, 80),
            step(1.5, 'third', 0.25, 85), step(1.75, 'root', 0.25, 80),
          ],
          swing: 0.1,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'honky-tonk', 'piano', 'twang', 'upbeat'],
  icon: '🎹',
};

/**
 * Modern Country style - pop-influenced contemporary country
 */
const MODERN_COUNTRY_STYLE: ArrangerStyle = {
  id: 'modern-country',
  name: 'Modern Country',
  category: 'Country',
  subcategory: 'Contemporary',
  description: 'Pop-influenced modern country with big production',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 118,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'modern-country-kit', { velocityRange: [80, 100] }),
    voice('guitar', 'acoustic-guitar-steel', { octave: 3, velocityRange: [75, 95] }),
    voice('synth', 'modern-pad', { octave: 4, velocityRange: [60, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Modern groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 90), step(0.75, 'fifth', 0.25, 80),
            step(1, 'root', 0.5, 85),
            step(2, 'third', 0.75, 85), step(2.75, 'root', 0.25, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(1, 'snare', 85), drum(2, 'kick', 90),
            drum(2.5, 'kick', 75), drum(3, 'snare', 85),
            drum(0, 'hihat-closed', 70), drum(0.5, 'hihat-closed', 60),
            drum(1, 'hihat-open', 65), drum(1.5, 'hihat-closed', 60),
            drum(2, 'hihat-closed', 70), drum(2.5, 'hihat-closed', 60),
            drum(3, 'hihat-closed', 70), drum(3.5, 'hihat-closed', 60),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'modern', 'pop', 'contemporary', 'production'],
  icon: '🌟',
};

/**
 * Country Swing style - Western swing with jazz influences
 */
const COUNTRY_SWING_STYLE: ArrangerStyle = {
  id: 'country-swing',
  name: 'Country Swing',
  category: 'Country',
  subcategory: 'Western Swing',
  description: 'Western swing with jazz-influenced swing feel',
  tempoRange: { min: 120, max: 180 },
  defaultTempo: 150,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'jazz-kit', { velocityRange: [70, 90] }),
    voice('fiddle', 'fiddle', { octave: 4, velocityRange: [75, 100] }),
    voice('piano', 'acoustic-piano', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Swing groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 85), step(1, 'fifth', 0.5, 75), step(1.5, 'third', 0.5, 80),
            step(2, 'root', 1, 85), step(3, 'fifth', 0.5, 75), step(3.5, 'sixth', 0.5, 80),
          ],
          swing: 0.3,
        },
        drums: {
          steps: [
            drum(0, 'ride', 75), drum(0.5, 'ride', 60), drum(1, 'ride', 70), drum(1.5, 'ride', 60),
            drum(2, 'ride', 75), drum(2.5, 'ride', 60), drum(3, 'ride', 70), drum(3.5, 'ride', 60),
            drum(1, 'snare', 65), drum(3, 'snare', 65),
          ],
          swing: 0.3,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'swing', 'western', 'jazz', 'fiddle'],
  icon: '🎻',
};

/**
 * Americana style - folk-influenced modern country/folk blend
 */
const AMERICANA_STYLE: ArrangerStyle = {
  id: 'americana',
  name: 'Americana',
  category: 'Folk',
  subcategory: 'Americana',
  description: 'Folk-influenced country with organic feel',
  tempoRange: { min: 85, max: 125 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [65, 85] }),
    voice('drums', 'acoustic-kit', { velocityRange: [60, 80] }),
    voice('guitar', 'acoustic-guitar-steel', { octave: 3, velocityRange: [70, 90] }),
    voice('mandolin', 'mandolin', { octave: 4, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Organic groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 75), step(1, 'fifth', 0.5, 65), step(1.5, 'third', 0.5, 70),
            step(2, 'root', 1, 75), step(3, 'fifth', 1, 65),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 70), drum(2, 'snare', 65), drum(3.5, 'snare', 60),
            drum(0, 'hihat-closed', 60), drum(0.5, 'hihat-closed', 50),
            drum(1, 'hihat-closed', 55), drum(1.5, 'hihat-closed', 50),
            drum(2, 'hihat-closed', 60), drum(2.5, 'hihat-closed', 50),
            drum(3, 'hihat-closed', 55), drum(3.5, 'hihat-closed', 50),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['folk', 'americana', 'country', 'organic', 'acoustic'],
  icon: '🏞️',
};

/**
 * Country Train Beat style - boom-chicka pattern
 */
const COUNTRY_TRAIN_BEAT_STYLE: ArrangerStyle = {
  id: 'country-train-beat',
  name: 'Country Train Beat',
  category: 'Country',
  subcategory: 'Train Beat',
  description: 'Classic boom-chicka country train rhythm',
  tempoRange: { min: 110, max: 150 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'country-kit', { velocityRange: [75, 95] }),
    voice('guitar', 'acoustic-guitar-steel', { octave: 3, velocityRange: [75, 95] }),
    voice('banjo', 'banjo', { octave: 4, velocityRange: [80, 100] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Train rhythm',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90, { articulation: 'staccato' }),
            step(0.5, 'fifth', 0.5, 75, { articulation: 'staccato' }),
            step(1, 'root', 0.5, 85, { articulation: 'staccato' }),
            step(1.5, 'fifth', 0.5, 75, { articulation: 'staccato' }),
            step(2, 'root', 0.5, 90, { articulation: 'staccato' }),
            step(2.5, 'fifth', 0.5, 75, { articulation: 'staccato' }),
            step(3, 'root', 0.5, 85, { articulation: 'staccato' }),
            step(3.5, 'fifth', 0.5, 75, { articulation: 'staccato' }),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            // Train beat: kick on beat, snare on offbeat
            drum(0, 'kick', 90), drum(0.5, 'snare', 75),
            drum(1, 'kick', 85), drum(1.5, 'snare', 75),
            drum(2, 'kick', 90), drum(2.5, 'snare', 75),
            drum(3, 'kick', 85), drum(3.5, 'snare', 75),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'train', 'boom-chicka', 'rhythmic', 'driving'],
  icon: '🚂',
};

/**
 * Outlaw Country - Willie Nelson, Waylon Jennings style
 */
const OUTLAW_COUNTRY_STYLE: ArrangerStyle = {
  id: 'outlaw-country',
  name: 'Outlaw Country',
  category: 'Country',
  subcategory: 'Outlaw',
  description: 'Outlaw country with rebellious attitude (Willie, Waylon)',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'country-kit', { velocityRange: [70, 90] }),
    voice('guitar', 'acoustic-guitar', { octave: 3, velocityRange: [75, 95] }),
    voice('piano', 'piano', { octave: 4, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Outlaw groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 85), step(1, 'fifth', 1, 75),
            step(2, 'root', 1, 85), step(3, 'third', 1, 75),
          ],
          swing: 0.1,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(2, 'snare', 80),
            drum(4, 'kick', 85), drum(6, 'snare', 80),
            ...Array.from({ length: 8 }, (_, i) => drum(i, 'hihat-closed', 60)),
            drum(3, 'rim', 55), drum(7, 'rim', 55),
          ],
          swing: 0.1,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'outlaw', 'willie-nelson', 'waylon-jennings', 'rebellious'],
  icon: '🤠',
};

/**
 * Old-Time - Appalachian traditional music
 */
const OLD_TIME_STYLE: ArrangerStyle = {
  id: 'old-time',
  name: 'Old-Time',
  category: 'Folk',
  subcategory: 'Appalachian',
  description: 'Appalachian old-time music with fiddle and banjo',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [70, 90] }),
    voice('fiddle', 'fiddle', { octave: 4, velocityRange: [75, 95] }),
    voice('banjo', 'banjo', { octave: 3, velocityRange: [70, 90] }),
    voice('guitar', 'acoustic-guitar', { octave: 3, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Old-time shuffle',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 80), step(1, 'fifth', 1, 70),
            step(2, 'root', 1, 80), step(3, 'third', 1, 70),
          ],
          swing: 0.15,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['folk', 'old-time', 'appalachian', 'fiddle', 'banjo', 'traditional'],
  icon: '🪕',
};

/**
 * Alt Country - indie country with alternative rock influence
 */
const ALT_COUNTRY_STYLE: ArrangerStyle = {
  id: 'alt-country',
  name: 'Alt Country',
  category: 'Country',
  subcategory: 'Alternative',
  description: 'Alternative country with indie rock sensibility',
  tempoRange: { min: 95, max: 125 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'indie-kit', { velocityRange: [70, 90] }),
    voice('guitar', 'electric-clean', { octave: 3, velocityRange: [70, 90] }),
    voice('keys', 'organ', { octave: 4, velocityRange: [60, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Indie country groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 82), step(1, 'fifth', 0.5, 75),
            step(1.5, 'third', 0.5, 78), step(2, 'root', 1, 82),
            step(3, 'seventh', 1, 75),
          ],
          swing: 0.05,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(2, 'snare', 78),
            drum(4, 'kick', 80), drum(6, 'snare', 78),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.5, 'hihat-closed', 55 + (i % 4 === 0 ? 8 : 0))),
            drum(2, 'hihat-open', 60), drum(6, 'hihat-open', 60),
          ],
          swing: 0.05,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['country', 'alternative', 'indie', 'twangy', 'uncle-tupelo'],
  icon: '🎸',
};

/**
 * Folk Acoustic - fingerpicking guitar style
 */
const FOLK_ACOUSTIC_STYLE: ArrangerStyle = {
  id: 'folk-acoustic',
  name: 'Folk Acoustic',
  category: 'Folk',
  subcategory: 'Acoustic',
  description: 'Acoustic folk with fingerpicking guitar patterns',
  tempoRange: { min: 80, max: 110 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [65, 85] }),
    voice('guitar', 'fingerstyle-guitar', { octave: 3, velocityRange: [70, 90] }),
    voice('vocals', 'vocal-pad', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Fingerpicking pattern',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 2, 75), step(2, 'fifth', 2, 70),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['folk', 'acoustic', 'fingerpicking', 'singer-songwriter', 'intimate'],
  icon: '🎸',
};

/**
 * Cajun - Louisiana accordion and fiddle music
 */
const CAJUN_STYLE: ArrangerStyle = {
  id: 'cajun',
  name: 'Cajun',
  category: 'Folk',
  subcategory: 'Cajun',
  description: 'Louisiana Cajun with accordion and fiddle',
  tempoRange: { min: 110, max: 150 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'upright-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('accordion', 'accordion', { octave: 3, velocityRange: [80, 100] }),
    voice('fiddle', 'fiddle', { octave: 4, velocityRange: [75, 95] }),
    voice('guitar', 'acoustic-guitar', { octave: 3, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Cajun two-step',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'fifth', 0.5, 75),
            step(1, 'root', 0.5, 85), step(1.5, 'fifth', 0.5, 75),
            step(2, 'root', 0.5, 85), step(2.5, 'third', 0.5, 75),
            step(3, 'root', 0.5, 85), step(3.5, 'fifth', 0.5, 75),
          ],
          swing: 0.08,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(1, 'snare', 75),
            drum(2, 'kick', 80), drum(3, 'snare', 75),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60)),
          ],
          swing: 0.08,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['cajun', 'louisiana', 'accordion', 'fiddle', 'two-step'],
  icon: '🪗',
};

/**
 * Zydeco - upbeat Creole music with rubboard
 */
const ZYDECO_STYLE: ArrangerStyle = {
  id: 'zydeco',
  name: 'Zydeco',
  category: 'Folk',
  subcategory: 'Zydeco',
  description: 'Upbeat Louisiana Creole music with rubboard groove',
  tempoRange: { min: 120, max: 160 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'zydeco-kit', { velocityRange: [75, 95] }),
    voice('accordion', 'accordion', { octave: 3, velocityRange: [85, 105] }),
    voice('rubboard', 'washboard', { octave: 3, velocityRange: [70, 90] }),
    voice('guitar', 'electric-guitar', { octave: 3, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Zydeco shuffle',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'fifth', 0.25, 80),
            step(0.75, 'octave', 0.25, 85), step(1, 'root', 0.5, 90),
            step(1.5, 'third', 0.5, 80), step(2, 'root', 0.5, 90),
            step(2.5, 'fifth', 0.25, 80), step(2.75, 'third', 0.25, 78),
            step(3, 'root', 0.5, 90), step(3.5, 'seventh', 0.5, 80),
          ],
          swing: 0.12,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(1, 'snare', 85),
            drum(2, 'kick', 90), drum(3, 'snare', 85),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 65)),
          ],
          swing: 0.12,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['zydeco', 'creole', 'louisiana', 'accordion', 'rubboard', 'upbeat'],
  icon: '🪗',
};

/**
 * Highlife style - Ghanaian dance music with guitar and horns
 */
const HIGHLIFE_STYLE: ArrangerStyle = {
  id: 'highlife',
  name: 'Highlife',
  category: 'World',
  subcategory: 'West African',
  description: 'Ghanaian highlife with palm wine guitar and brass',
  tempoRange: { min: 110, max: 140 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'highlife-kit', { velocityRange: [75, 95] }),
    voice('guitar', 'palm-wine-guitar', { octave: 3, velocityRange: [70, 90] }),
    voice('horns', 'brass-section', { octave: 4, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'fifth', 0.25, 75),
            step(0.75, 'third', 0.25, 80), step(1, 'root', 0.5, 85),
            step(1.5, 'fifth', 0.5, 75),
            step(2, 'third', 0.5, 80), step(2.5, 'root', 0.5, 85),
            step(3, 'fifth', 0.5, 75), step(3.5, 'third', 0.5, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(1, 'snare', 75), drum(2, 'kick', 80),
            drum(2.5, 'kick', 70), drum(3, 'snare', 75), drum(3.5, 'snare', 70),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 65)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['world', 'african', 'highlife', 'ghana', 'guitar', 'brass'],
  icon: '🌍',
};

/**
 * Soukous - Congolese guitar-driven dance music
 */
const SOUKOUS_STYLE: ArrangerStyle = {
  id: 'soukous',
  name: 'Soukous',
  category: 'World',
  subcategory: 'Central African',
  description: 'Congolese soukous with intricate guitar sebene and driving bass',
  tempoRange: { min: 130, max: 160 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'soukous-kit', { velocityRange: [75, 95] }),
    voice('guitar-lead', 'sebene-guitar-lead', { octave: 4, velocityRange: [75, 95] }),
    voice('guitar-rhythm', 'sebene-guitar-rhythm', { octave: 3, velocityRange: [70, 90] }),
    voice('horns', 'brass-section', { octave: 4, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Sebene groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 90), step(0.25, 'fifth', 0.25, 85),
            step(0.5, 'root', 0.25, 88), step(0.75, 'third', 0.25, 82),
            step(1, 'fifth', 0.25, 90), step(1.25, 'root', 0.25, 85),
            step(1.5, 'third', 0.25, 88), step(1.75, 'fifth', 0.25, 82),
            step(2, 'root', 0.25, 90), step(2.25, 'fifth', 0.25, 85),
            step(2.5, 'root', 0.25, 88), step(2.75, 'third', 0.25, 82),
            step(3, 'fifth', 0.25, 90), step(3.25, 'root', 0.25, 85),
            step(3.5, 'third', 0.25, 88), step(3.75, 'fifth', 0.25, 82),
          ],
          swing: 0,
        },
        'guitar-lead': {
          steps: [
            step(0, 'root', 0.125, 80, { octaveOffset: 1 }),
            step(0.125, 'third', 0.125, 75, { octaveOffset: 1 }),
            step(0.25, 'fifth', 0.125, 78, { octaveOffset: 1 }),
            step(0.375, 'root', 0.125, 82, { octaveOffset: 2 }),
            step(0.5, 'third', 0.125, 85, { octaveOffset: 1 }),
            step(0.625, 'fifth', 0.125, 80, { octaveOffset: 1 }),
            step(0.75, 'root', 0.125, 83, { octaveOffset: 1 }),
            step(0.875, 'third', 0.125, 78, { octaveOffset: 1 }),
            step(1, 'fifth', 0.125, 80, { octaveOffset: 1 }),
            step(1.125, 'root', 0.125, 85, { octaveOffset: 2 }),
            step(1.25, 'third', 0.125, 82, { octaveOffset: 1 }),
            step(1.375, 'fifth', 0.125, 78, { octaveOffset: 1 }),
            step(1.5, 'root', 0.125, 83, { octaveOffset: 1 }),
            step(1.625, 'third', 0.125, 80, { octaveOffset: 1 }),
            step(1.75, 'fifth', 0.125, 85, { octaveOffset: 1 }),
            step(1.875, 'root', 0.125, 82, { octaveOffset: 1 }),
          ],
          swing: 0,
        },
        'guitar-rhythm': {
          steps: [
            step(0, 'root', 0.25, 75), step(0.5, 'third', 0.25, 70),
            step(1, 'fifth', 0.25, 73), step(1.5, 'root', 0.25, 75),
            step(2, 'third', 0.25, 72), step(2.5, 'fifth', 0.25, 70),
            step(3, 'root', 0.25, 75), step(3.5, 'third', 0.25, 73),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(0.5, 'snare', 75),
            drum(1, 'kick', 88), drum(1.5, 'snare', 78),
            drum(2, 'kick', 90), drum(2.5, 'snare', 75),
            drum(3, 'kick', 88), drum(3.5, 'snare', 78),
            // Fast hi-hat pattern
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60 + (i % 4 === 0 ? 15 : i % 2 === 0 ? 8 : 0))),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['world', 'african', 'soukous', 'congo', 'guitar', 'sebene', 'rumba-congolaise'],
  icon: '🎸',
};

/**
 * Zouk style - Caribbean dance music with syncopated rhythm
 */
export const ZOUK_STYLE: ArrangerStyle = {
  id: 'zouk',
  name: 'Zouk',
  category: 'World',
  subcategory: 'Caribbean',
  description: 'Caribbean zouk with syncopated rhythm and smooth feel',
  tempoRange: { min: 110, max: 135 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'zouk-kit', { velocityRange: [75, 95] }),
    voice('synth', 'synth-pad', { octave: 4, velocityRange: [65, 85] }),
    voice('guitar', 'electric-guitar-clean', { octave: 3, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Zouk groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 90), step(0.75, 'fifth', 0.25, 80),
            step(1, 'third', 0.5, 85), step(1.5, 'root', 0.5, 80),
            step(2, 'root', 0.75, 90), step(2.75, 'fifth', 0.25, 80),
            step(3.5, 'third', 0.5, 85),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.75, 'kick', 75),
            drum(1, 'snare', 80), drum(2, 'kick', 85),
            drum(2.5, 'kick', 70), drum(3, 'snare', 80),
            drum(0.5, 'hihat-closed', 65), drum(1.5, 'hihat-closed', 65),
            drum(2.5, 'hihat-closed', 65), drum(3.5, 'hihat-closed', 65),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['world', 'caribbean', 'zouk', 'dance', 'syncopated'],
  icon: '🏝️',
};

/**
 * Calypso style - Trinidad carnival music with steel drums
 */
export const CALYPSO_STYLE: ArrangerStyle = {
  id: 'calypso',
  name: 'Calypso',
  category: 'World',
  subcategory: 'Caribbean',
  description: 'Trinidad calypso with steel drums and carnival rhythm',
  tempoRange: { min: 140, max: 180 },
  defaultTempo: 160,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'calypso-kit', { velocityRange: [75, 95] }),
    voice('steel-drum', 'steel-drum', { octave: 4, velocityRange: [80, 100] }),
    voice('guitar', 'acoustic-guitar-nylon', { octave: 3, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Carnival groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'fifth', 0.5, 75),
            step(1, 'third', 0.5, 80), step(1.5, 'root', 0.5, 85),
            step(2, 'fifth', 0.5, 75), step(2.5, 'root', 0.5, 85),
            step(3, 'third', 0.5, 80), step(3.5, 'fifth', 0.5, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.5, 'kick', 75), drum(1, 'snare', 80),
            drum(1.5, 'kick', 70), drum(2, 'kick', 85), drum(2.5, 'kick', 75),
            drum(3, 'snare', 80), drum(3.5, 'kick', 70),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['world', 'caribbean', 'calypso', 'trinidad', 'steel-drum', 'carnival'],
  icon: '🥁',
};

/**
 * Acoustic Pop style - organic acoustic guitar strumming patterns
 */
const ACOUSTIC_POP_STYLE: ArrangerStyle = {
  id: 'acoustic-pop',
  name: 'Acoustic Pop',
  category: 'Pop',
  subcategory: 'Acoustic',
  description: 'Organic pop with acoustic guitar strumming patterns',
  tempoRange: { min: 80, max: 130 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [70, 90] }),
    voice('drums', 'acoustic-kit', { velocityRange: [65, 85] }),
    voice('guitar', 'acoustic-guitar-steel', { octave: 3, velocityRange: [75, 95] }),
    voice('piano', 'acoustic-piano', { octave: 4, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse strumming',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 75), step(2, 'fifth', 0.5, 65),
            step(2.5, 'root', 0.5, 70),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.25, 80), step(0.5, 'third', 0.25, 75),
            step(1, 'fifth', 0.25, 80), step(1.5, 'third', 0.25, 70),
            step(2, 'root', 0.25, 85), step(2.5, 'fifth', 0.25, 75),
            step(3, 'third', 0.25, 80), step(3.5, 'root', 0.25, 70),
          ],
          swing: 0.05,
        },
        drums: {
          steps: [
            drum(0, 'kick', 75), drum(2, 'snare', 70),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 55)),
          ],
          swing: 0,
        },
      },
    },
    {
      name: 'B',
      description: 'Chorus upstrokes',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'root', 0.5, 75),
            step(1, 'fifth', 0.5, 80), step(1.5, 'root', 0.5, 75),
            step(2, 'root', 0.5, 85), step(2.5, 'fifth', 0.5, 80),
            step(3, 'third', 0.5, 80), step(3.5, 'root', 0.5, 75),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0.25, 'root', 0.125, 75), step(0.75, 'third', 0.125, 70),
            step(1.25, 'fifth', 0.125, 75), step(1.75, 'root', 0.125, 70),
            step(2.25, 'root', 0.125, 80), step(2.75, 'fifth', 0.125, 75),
            step(3.25, 'third', 0.125, 80), step(3.75, 'root', 0.125, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.5, 'kick', 70),
            drum(1, 'snare', 80), drum(1.75, 'kick', 65),
            drum(2, 'kick', 85), drum(2.5, 'kick', 70),
            drum(3, 'snare', 80), drum(3.5, 'hihat-open', 70),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 60)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop', 'acoustic', 'organic', 'guitar', 'strumming'],
  icon: '🎸',
};

/**
 * Modern Pop style - EDM-influenced with sidechain pumping
 */
const MODERN_POP_STYLE: ArrangerStyle = {
  id: 'modern-pop',
  name: 'Modern Pop',
  category: 'Pop',
  subcategory: 'Modern',
  description: 'EDM-influenced pop with sidechain pumping and electronic elements',
  tempoRange: { min: 100, max: 140 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [85, 110] }),
    voice('drums', 'electronic-kit', { velocityRange: [90, 120] }),
    voice('synth', 'synth-lead', { octave: 4, velocityRange: [80, 105] }),
    voice('pad', 'synth-pad', { octave: 3, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse minimal',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.875, 95), step(1, 'root', 0.875, 85),
            step(2, 'root', 0.875, 95), step(3, 'root', 0.875, 85),
          ],
          swing: 0,
        },
        synth: {
          steps: [
            step(0.5, 'fifth', 0.25, 75), step(2.5, 'third', 0.25, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 110), drum(1, 'kick', 95),
            drum(2, 'snare', 105), drum(3, 'kick', 95),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 70)),
          ],
          swing: 0,
        },
      },
    },
    {
      name: 'B',
      description: 'Chorus full',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 110), step(0.5, 'root', 0.25, 95),
            step(1, 'root', 0.25, 105), step(1.5, 'root', 0.25, 90),
            step(2, 'root', 0.25, 110), step(2.5, 'fifth', 0.25, 100),
            step(3, 'root', 0.25, 105), step(3.5, 'root', 0.25, 95),
          ],
          swing: 0,
        },
        synth: {
          steps: [
            step(0, 'root', 0.5, 90), step(1, 'third', 0.5, 85),
            step(2, 'fifth', 0.5, 90), step(3, 'third', 0.5, 80),
          ],
          swing: 0,
        },
        pad: {
          steps: [
            step(0, 'root', 4, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 120), drum(0.5, 'clap', 80),
            drum(1, 'kick', 110), drum(1.5, 'snare', 115),
            drum(2, 'kick', 120), drum(2.5, 'kick', 100),
            drum(3, 'snare', 115), drum(3.75, 'clap', 75),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 75)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop', 'modern', 'edm', 'electronic', 'sidechain'],
  icon: '🎧',
};

/**
 * Indie Rock style - jangly guitars, driving drums
 */
const INDIE_ROCK_STYLE: ArrangerStyle = {
  id: 'indie-rock',
  name: 'Indie Rock',
  category: 'Rock',
  subcategory: 'Indie',
  description: 'Jangly guitars with driving drums and indie sensibility',
  tempoRange: { min: 110, max: 160 },
  defaultTempo: 135,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass-guitar', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'indie-kit', { velocityRange: [80, 105] }),
    voice('guitar', 'jangle-guitar', { octave: 4, velocityRange: [70, 90] }),
    voice('guitar2', 'clean-guitar', { octave: 3, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse jangle',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'fifth', 0.5, 75),
            step(1, 'root', 0.5, 85), step(1.5, 'third', 0.5, 75),
            step(2, 'root', 0.5, 85), step(2.5, 'fifth', 0.5, 80),
            step(3, 'root', 0.5, 85), step(3.5, 'octave', 0.5, 75),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.125, 75), step(0.25, 'third', 0.125, 70),
            step(0.5, 'fifth', 0.125, 75), step(0.75, 'octave', 0.125, 70),
            step(1, 'root', 0.125, 80), step(1.25, 'third', 0.125, 70),
            step(1.5, 'fifth', 0.125, 75), step(1.75, 'root', 0.125, 70),
            step(2, 'root', 0.125, 75), step(2.25, 'fifth', 0.125, 70),
            step(2.5, 'third', 0.125, 75), step(2.75, 'root', 0.125, 70),
            step(3, 'root', 0.125, 80), step(3.25, 'third', 0.125, 70),
            step(3.5, 'fifth', 0.125, 75), step(3.75, 'octave', 0.125, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(1, 'snare', 90),
            drum(2, 'kick', 90), drum(3, 'snare', 95),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-open', 65)),
          ],
          swing: 0,
        },
      },
    },
    {
      name: 'B',
      description: 'Chorus drive',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 95), step(0.5, 'root', 0.25, 85),
            step(1, 'fifth', 0.25, 90), step(1.5, 'root', 0.25, 85),
            step(2, 'root', 0.25, 95), step(2.5, 'octave', 0.25, 90),
            step(3, 'fifth', 0.25, 90), step(3.5, 'root', 0.25, 85),
          ],
          swing: 0,
        },
        guitar2: {
          steps: [
            step(0, 'root', 1, 85), step(1, 'third', 1, 80),
            step(2, 'fifth', 1, 85), step(3, 'octave', 1, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 105), drum(0.5, 'kick', 90),
            drum(1, 'snare', 100), drum(1.75, 'kick', 85),
            drum(2, 'kick', 105), drum(2.5, 'kick', 90),
            drum(3, 'snare', 100), drum(3.5, 'hihat-open', 75),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'indie', 'jangle', 'alternative', 'guitar'],
  icon: '🎸',
};

/**
 * Progressive Rock style - odd meters, complex arrangements
 */
const PROGRESSIVE_ROCK_STYLE: ArrangerStyle = {
  id: 'progressive-rock',
  name: 'Progressive Rock',
  category: 'Rock',
  subcategory: 'Progressive',
  description: 'Complex arrangements with odd meters and intricate patterns',
  tempoRange: { min: 100, max: 180 },
  defaultTempo: 140,
  timeSignature: { numerator: 7, denominator: 8 },
  voices: [
    voice('bass', 'bass-guitar', { octave: 2, velocityRange: [80, 105] }),
    voice('drums', 'prog-kit', { velocityRange: [85, 110] }),
    voice('guitar', 'prog-guitar', { octave: 3, velocityRange: [80, 100] }),
    voice('synth', 'prog-synth', { octave: 4, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main 7/8 groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.5, 'fifth', 0.5, 85),
            step(1, 'octave', 0.5, 90), step(1.5, 'root', 0.5, 85),
            step(2, 'third', 0.5, 90), step(2.5, 'root', 0.5, 85),
            step(3, 'fifth', 0.5, 90),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 85), step(1, 'third', 1, 80),
            step(2, 'fifth', 1, 85), step(3, 'octave', 0.5, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(0.5, 'hihat-closed', 65),
            drum(1, 'snare', 95), drum(1.5, 'hihat-closed', 65),
            drum(2, 'kick', 95), drum(2.5, 'hihat-closed', 70),
            drum(3, 'snare', 100), drum(3.5, 'hihat-open', 75),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'progressive', 'prog', 'odd-meter', '7/8', 'complex'],
  icon: '🎹',
};

/**
 * Punk Rock style - fast, simple, aggressive
 */
const PUNK_ROCK_STYLE: ArrangerStyle = {
  id: 'punk-rock',
  name: 'Punk Rock',
  category: 'Rock',
  subcategory: 'Punk',
  description: 'Fast, simple, aggressive punk rock energy',
  tempoRange: { min: 160, max: 220 },
  defaultTempo: 180,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'punk-bass', { octave: 2, velocityRange: [100, 127] }),
    voice('drums', 'punk-kit', { velocityRange: [105, 127] }),
    voice('guitar', 'distortion-guitar', { octave: 3, velocityRange: [100, 120] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Full throttle',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 110), step(0.25, 'root', 0.25, 105),
            step(0.5, 'root', 0.25, 110), step(0.75, 'root', 0.25, 105),
            step(1, 'root', 0.25, 110), step(1.25, 'root', 0.25, 105),
            step(1.5, 'root', 0.25, 110), step(1.75, 'root', 0.25, 105),
            step(2, 'root', 0.25, 110), step(2.25, 'root', 0.25, 105),
            step(2.5, 'root', 0.25, 110), step(2.75, 'root', 0.25, 105),
            step(3, 'root', 0.25, 110), step(3.25, 'root', 0.25, 105),
            step(3.5, 'root', 0.25, 110), step(3.75, 'root', 0.25, 105),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 115), step(0.5, 'root', 0.5, 110),
            step(1, 'fifth', 0.5, 115), step(1.5, 'fifth', 0.5, 110),
            step(2, 'root', 0.5, 115), step(2.5, 'root', 0.5, 110),
            step(3, 'fifth', 0.5, 115), step(3.5, 'fifth', 0.5, 110),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 120), drum(0.5, 'snare', 115),
            drum(1, 'kick', 120), drum(1.5, 'snare', 115),
            drum(2, 'kick', 120), drum(2.5, 'snare', 115),
            drum(3, 'kick', 120), drum(3.5, 'snare', 115),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 90)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'punk', 'fast', 'aggressive', 'simple'],
  icon: '⚡',
};

/**
 * Grunge Rock style - distorted, angsty
 */
const GRUNGE_ROCK_STYLE: ArrangerStyle = {
  id: 'grunge-rock',
  name: 'Grunge Rock',
  category: 'Rock',
  subcategory: 'Grunge',
  description: 'Distorted, angsty grunge with heavy dynamics',
  tempoRange: { min: 80, max: 130 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'grunge-bass', { octave: 2, velocityRange: [85, 110] }),
    voice('drums', 'grunge-kit', { velocityRange: [90, 120] }),
    voice('guitar', 'heavy-distortion', { octave: 3, velocityRange: [90, 115] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse quiet-loud',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 75), step(1, 'fifth', 0.5, 70),
            step(1.5, 'root', 0.5, 75), step(2, 'root', 1, 75),
            step(3, 'third', 1, 70),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 2, 85), step(2, 'fifth', 2, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(2, 'snare', 90),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'ride', 65)),
          ],
          swing: 0,
        },
      },
    },
    {
      name: 'B',
      description: 'Chorus explosive',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 105), step(0.5, 'root', 0.5, 95),
            step(1, 'fifth', 0.5, 100), step(1.5, 'root', 0.5, 95),
            step(2, 'root', 0.5, 105), step(2.5, 'octave', 0.5, 100),
            step(3, 'fifth', 0.5, 100), step(3.5, 'root', 0.5, 95),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 110), step(0.5, 'root', 0.5, 100),
            step(1, 'fifth', 0.5, 110), step(1.5, 'fifth', 0.5, 100),
            step(2, 'third', 0.5, 110), step(2.5, 'third', 0.5, 100),
            step(3, 'root', 0.5, 110), step(3.5, 'root', 0.5, 100),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 115), drum(0.5, 'kick', 100),
            drum(1, 'snare', 120), drum(1.5, 'kick', 95),
            drum(2, 'kick', 115), drum(2.5, 'crash', 110),
            drum(3, 'snare', 120), drum(3.5, 'kick', 95),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 85)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'grunge', 'distorted', 'alternative', '90s'],
  icon: '🎸',
};

/**
 * Alternative Rock style - modern alt with dynamics
 */
const ALTERNATIVE_ROCK_STYLE: ArrangerStyle = {
  id: 'alternative-rock',
  name: 'Alternative Rock',
  category: 'Rock',
  subcategory: 'Alternative',
  description: 'Modern alternative rock with dynamic contrasts',
  tempoRange: { min: 100, max: 150 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'alt-bass', { octave: 2, velocityRange: [75, 100] }),
    voice('drums', 'alt-kit', { velocityRange: [80, 105] }),
    voice('guitar', 'alt-guitar', { octave: 3, velocityRange: [75, 100] }),
    voice('synth', 'texture-pad', { octave: 4, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse atmospheric',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 80), step(1, 'fifth', 1, 75),
            step(2, 'root', 1, 80), step(3, 'third', 1, 75),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 75), step(1, 'third', 0.5, 70),
            step(2, 'fifth', 0.5, 75), step(3, 'octave', 0.5, 70),
          ],
          swing: 0,
        },
        synth: {
          steps: [
            step(0, 'root', 4, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(2, 'snare', 80),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60)),
          ],
          swing: 0,
        },
      },
    },
    {
      name: 'B',
      description: 'Chorus powerful',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.5, 'root', 0.5, 85),
            step(1, 'fifth', 0.5, 90), step(1.5, 'root', 0.5, 85),
            step(2, 'root', 0.5, 95), step(2.5, 'octave', 0.5, 90),
            step(3, 'fifth', 0.5, 90), step(3.5, 'root', 0.5, 85),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 1, 95), step(1, 'third', 1, 90),
            step(2, 'fifth', 1, 95), step(3, 'octave', 1, 90),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(0.5, 'kick', 85),
            drum(1, 'snare', 105), drum(1.75, 'kick', 80),
            drum(2, 'kick', 100), drum(2.5, 'crash', 95),
            drum(3, 'snare', 105), drum(3.5, 'hihat-open', 80),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'alternative', 'modern', 'dynamic'],
  icon: '🎸',
};

/**
 * Pop Rock Anthem style - uplifting anthemic pop rock
 */
const POP_ROCK_ANTHEM_STYLE: ArrangerStyle = {
  id: 'pop-rock-anthem',
  name: 'Pop Rock Anthem',
  category: 'Pop',
  subcategory: 'Pop-Rock',
  description: '4/4 driving beat with anthem-quality hooks and energy',
  tempoRange: { min: 115, max: 135 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'rock-bass', { octave: 2, velocityRange: [80, 105] }),
    voice('drums', 'room-kit', { velocityRange: [85, 110] }),
    voice('guitar', 'crunch-guitar', { octave: 3, velocityRange: [80, 105] }),
    voice('keys', 'pad', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Building verse',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'root', 0.5, 80),
            step(1, 'fifth', 0.5, 85), step(1.5, 'fifth', 0.5, 80),
            step(2, 'root', 0.5, 85), step(2.5, 'octave', 0.5, 82),
            step(3, 'fifth', 0.5, 85), step(3.5, 'root', 0.5, 80),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 85), step(1, 'third', 0.5, 82),
            step(2, 'fifth', 0.5, 85), step(3, 'octave', 0.5, 82),
          ],
          swing: 0,
        },
        keys: {
          steps: [
            step(0, 'root', 4, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(1, 'snare', 100),
            drum(2, 'kick', 95), drum(3, 'snare', 100),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 70)),
          ],
          swing: 0,
        },
      },
    },
    {
      name: 'B',
      description: 'Anthemic chorus',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 100), step(0.5, 'root', 0.25, 90),
            step(1, 'fifth', 0.25, 95), step(1.5, 'octave', 0.25, 92),
            step(2, 'root', 0.25, 100), step(2.5, 'fifth', 0.25, 92),
            step(3, 'octave', 0.25, 95), step(3.5, 'fifth', 0.25, 90),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 1, 100), step(1, 'third', 1, 95),
            step(2, 'fifth', 1, 100), step(3, 'octave', 1, 95),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 110), drum(0.5, 'kick', 85),
            drum(1, 'snare', 110), drum(1.5, 'tom-hi', 85),
            drum(2, 'kick', 110), drum(2.5, 'crash', 105),
            drum(3, 'snare', 110), drum(3.5, 'tom-lo', 90),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 75)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop', 'rock', 'anthem', 'uplifting', 'driving'],
  icon: '🎸',
};

/**
 * Pop Shuffle style - shuffled 8th note pop feel
 */
const POP_SHUFFLE_STYLE: ArrangerStyle = {
  id: 'pop-shuffle',
  name: 'Pop Shuffle',
  category: 'Pop',
  subcategory: 'Shuffle',
  description: 'Shuffled 8th notes with groove and swing feel',
  tempoRange: { min: 95, max: 125 },
  defaultTempo: 110,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'brush-kit', { velocityRange: [70, 95] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [70, 90] }),
    voice('guitar', 'guitar', { octave: 3, velocityRange: [65, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.333, 80), step(0.667, 'fifth', 0.333, 75),
            step(1.333, 'root', 0.333, 78), step(2, 'third', 0.333, 80),
            step(2.667, 'root', 0.333, 75), step(3.333, 'fifth', 0.333, 78),
          ],
          swing: 0.67,
        },
        keys: {
          steps: [
            step(0, 'root', 0.333, 75), step(0.667, 'third', 0.333, 70),
            step(1.333, 'fifth', 0.333, 72), step(2, 'third', 0.333, 75),
            step(2.667, 'root', 0.333, 70), step(3.333, 'fifth', 0.333, 72),
          ],
          swing: 0.67,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(1, 'snare', 80),
            drum(2, 'kick', 82), drum(3, 'snare', 80),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.333, 'hihat-closed', 65)),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop', 'shuffle', 'groove', 'swing'],
  icon: '🎹',
};

/**
 * Power Ballad style - emotional slow rock with build
 */
const POWER_BALLAD_NEW_STYLE: ArrangerStyle = {
  id: 'power-ballad-new',
  name: 'Power Ballad',
  category: 'Rock',
  subcategory: 'Ballad',
  description: 'Slow emotional ballad with big drums and pad-heavy arrangement',
  tempoRange: { min: 58, max: 78 },
  defaultTempo: 68,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'rock-bass', { octave: 2, velocityRange: [70, 95] }),
    voice('drums', 'power-kit', { velocityRange: [75, 100] }),
    voice('guitar', 'guitar', { octave: 3, velocityRange: [65, 85] }),
    voice('pad', 'strings', { octave: 4, velocityRange: [60, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Intimate verse',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 75), step(1, 'fifth', 1, 70),
            step(2, 'root', 1, 75), step(3, 'third', 1, 70),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 1, 70), step(1, 'third', 1, 68),
            step(2, 'fifth', 1, 70), step(3, 'root', 1, 68),
          ],
          swing: 0,
        },
        pad: {
          steps: [
            step(0, 'root', 4, 65),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(1, 'snare', 75),
            drum(2, 'kick', 78), drum(3, 'snare', 75),
            ...Array.from({ length: 4 }, (_, i) => drum(i, 'hihat-closed', 60)),
          ],
          swing: 0,
        },
      },
    },
    {
      name: 'B',
      description: 'Powerful chorus',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.5, 'root', 0.5, 85),
            step(1, 'fifth', 0.5, 90), step(1.5, 'octave', 0.5, 87),
            step(2, 'root', 0.5, 95), step(2.5, 'fifth', 0.5, 87),
            step(3, 'octave', 0.5, 90), step(3.5, 'third', 0.5, 85),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 1, 85), step(1, 'third', 1, 82),
            step(2, 'fifth', 1, 85), step(3, 'octave', 1, 82),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(0.5, 'kick', 80),
            drum(1, 'snare', 105), drum(1.5, 'crash', 90),
            drum(2, 'kick', 100), drum(2.5, 'tom-hi', 85),
            drum(3, 'snare', 105), drum(3.5, 'tom-lo', 90),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['rock', 'ballad', 'power', 'emotional', 'slow'],
  icon: '💔',
};

/**
 * Indie Rock style - jangly guitars with modern indie feel
 */
const INDIE_ROCK_NEW_STYLE: ArrangerStyle = {
  id: 'indie-rock-new',
  name: 'Indie Rock',
  category: 'Rock',
  subcategory: 'Indie',
  description: 'Jangly guitars and driving indie rock feel',
  tempoRange: { min: 120, max: 145 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'melodic-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'room-kit', { velocityRange: [75, 100] }),
    voice('guitar1', 'guitar', { octave: 4, velocityRange: [75, 92] }),
    voice('guitar2', 'guitar', { octave: 3, velocityRange: [70, 88] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Verse jangle',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 80), step(0.5, 'fifth', 0.5, 75),
            step(1, 'octave', 0.5, 82), step(1.5, 'root', 0.5, 75),
            step(2, 'third', 0.5, 80), step(2.5, 'root', 0.5, 75),
            step(3, 'fifth', 0.5, 82), step(3.5, 'root', 0.5, 75),
          ],
          swing: 0,
        },
        guitar1: {
          steps: [
            step(0, 'root', 0.25, 80), step(0.25, 'third', 0.25, 75),
            step(0.5, 'fifth', 0.25, 78), step(0.75, 'octave', 0.25, 75),
            step(1, 'third', 0.25, 80), step(1.25, 'fifth', 0.25, 75),
            step(1.5, 'root', 0.25, 78), step(1.75, 'third', 0.25, 75),
          ],
          swing: 0,
        },
        guitar2: {
          steps: [
            step(0, 'root', 1, 75), step(1, 'third', 1, 73),
            step(2, 'fifth', 1, 75), step(3, 'root', 1, 73),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(1, 'snare', 90),
            drum(2, 'kick', 82), drum(3, 'snare', 90),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['indie', 'rock', 'jangle', 'modern'],
  icon: '🎸',
};

/**
 * Alt Rock Grunge style - heavy distorted grunge feel
 */
const ALT_ROCK_GRUNGE_STYLE: ArrangerStyle = {
  id: 'alt-rock-grunge',
  name: 'Alt Rock Grunge',
  category: 'Rock',
  subcategory: 'Grunge',
  description: 'Heavy distorted guitars with angsty grunge feel',
  tempoRange: { min: 95, max: 120 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'power-bass', { octave: 1, velocityRange: [85, 105] }),
    voice('drums', 'power-kit', { velocityRange: [85, 110] }),
    voice('guitar', 'distortion-guitar', { octave: 2, velocityRange: [90, 110] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Heavy groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.5, 'root', 0.5, 88),
            step(1, 'root', 0.5, 92), step(1.5, 'fifth', 0.5, 88),
            step(2, 'root', 0.5, 95), step(2.5, 'root', 0.5, 88),
            step(3, 'octave', 0.5, 92), step(3.5, 'root', 0.5, 88),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 1, 100), step(1, 'root', 0.5, 95),
            step(1.5, 'fifth', 0.5, 92), step(2, 'root', 1, 100),
            step(3, 'third', 0.5, 95), step(3.5, 'root', 0.5, 92),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(0.5, 'snare', 75),
            drum(1, 'snare', 105), drum(1.5, 'kick', 80),
            drum(2, 'kick', 100), drum(2.5, 'snare', 75),
            drum(3, 'snare', 105), drum(3.5, 'kick', 80),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['grunge', 'alternative', 'heavy', 'distorted'],
  icon: '🎸',
};

/**
 * Soft Rock 70s style - mellow 70s soft rock groove
 */
const SOFT_ROCK_70S_STYLE: ArrangerStyle = {
  id: 'soft-rock-70s',
  name: 'Soft Rock 70s',
  category: 'Rock',
  subcategory: 'Soft Rock',
  description: 'Mellow 70s soft rock with warm groove',
  tempoRange: { min: 85, max: 105 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', { octave: 2, velocityRange: [70, 88] }),
    voice('drums', 'brush-kit', { velocityRange: [65, 85] }),
    voice('guitar', 'guitar', { octave: 3, velocityRange: [68, 85] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [65, 82] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Laid-back groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 75), step(0.5, 'fifth', 0.5, 70),
            step(1, 'root', 0.5, 75), step(1.5, 'third', 0.5, 72),
            step(2, 'fifth', 0.5, 75), step(2.5, 'root', 0.5, 70),
            step(3, 'third', 0.5, 73), step(3.5, 'root', 0.5, 70),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 72), step(0.5, 'third', 0.5, 68),
            step(1, 'fifth', 0.5, 70), step(1.5, 'root', 0.5, 68),
            step(2, 'third', 0.5, 72), step(2.5, 'fifth', 0.5, 68),
            step(3, 'root', 0.5, 70), step(3.5, 'third', 0.5, 68),
          ],
          swing: 0,
        },
        keys: {
          steps: [
            step(0, 'root', 1, 70), step(1, 'third', 1, 68),
            step(2, 'fifth', 1, 70), step(3, 'root', 1, 68),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 75), drum(1, 'snare', 70),
            drum(2, 'kick', 73), drum(3, 'snare', 70),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 60)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['soft-rock', '70s', 'mellow', 'laid-back'],
  icon: '🎸',
};

/**
 * Arena Rock style - anthemic stadium rock
 */
const ARENA_ROCK_STYLE: ArrangerStyle = {
  id: 'arena-rock',
  name: 'Arena Rock',
  category: 'Rock',
  subcategory: 'Arena',
  description: 'Anthemic stadium rock with huge energy',
  tempoRange: { min: 130, max: 155 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'rock-bass', { octave: 2, velocityRange: [90, 110] }),
    voice('drums', 'power-kit', { velocityRange: [95, 115] }),
    voice('guitar', 'distortion-guitar', { octave: 3, velocityRange: [90, 110] }),
    voice('lead', 'lead', { octave: 4, velocityRange: [85, 105] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Driving power',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 100), step(0.5, 'root', 0.25, 92),
            step(1, 'fifth', 0.25, 97), step(1.5, 'root', 0.25, 92),
            step(2, 'root', 0.25, 100), step(2.5, 'octave', 0.25, 95),
            step(3, 'fifth', 0.25, 97), step(3.5, 'root', 0.25, 92),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 1, 100), step(1, 'third', 1, 97),
            step(2, 'fifth', 1, 100), step(3, 'octave', 1, 97),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 110), drum(0.25, 'kick', 85),
            drum(0.5, 'kick', 95), drum(1, 'snare', 110),
            drum(2, 'kick', 110), drum(2.5, 'crash', 105),
            drum(3, 'snare', 110), drum(3.5, 'tom-lo', 95),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 75)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['arena', 'rock', 'anthemic', 'stadium', 'energetic'],
  icon: '⚡',
};

/**
 * Britpop style - UK guitar pop feel
 */
const BRITPOP_STYLE: ArrangerStyle = {
  id: 'britpop',
  name: 'Britpop',
  category: 'Rock',
  subcategory: 'Britpop',
  description: 'UK guitar pop with jangly melodic feel',
  tempoRange: { min: 110, max: 135 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'melodic-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'room-kit', { velocityRange: [75, 100] }),
    voice('guitar1', 'guitar', { octave: 4, velocityRange: [75, 92] }),
    voice('guitar2', 'guitar', { octave: 3, velocityRange: [72, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Melodic verse',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 80), step(0.5, 'third', 0.5, 75),
            step(1, 'fifth', 0.5, 82), step(1.5, 'root', 0.5, 75),
            step(2, 'octave', 0.5, 80), step(2.5, 'fifth', 0.5, 75),
            step(3, 'third', 0.5, 82), step(3.5, 'root', 0.5, 75),
          ],
          swing: 0,
        },
        guitar1: {
          steps: [
            step(0, 'root', 0.25, 80), step(0.25, 'third', 0.25, 75),
            step(0.5, 'fifth', 0.25, 78), step(0.75, 'root', 0.25, 75),
            step(1, 'third', 0.25, 80), step(1.25, 'fifth', 0.25, 75),
            step(1.5, 'octave', 0.25, 78), step(1.75, 'third', 0.25, 75),
          ],
          swing: 0,
        },
        guitar2: {
          steps: [
            step(0, 'root', 0.5, 75), step(1, 'third', 0.5, 73),
            step(2, 'fifth', 0.5, 75), step(3, 'root', 0.5, 73),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(1, 'snare', 90),
            drum(2, 'kick', 82), drum(3, 'snare', 90),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['britpop', 'uk', 'guitar-pop', 'melodic'],
  icon: '🇬🇧',
};

/**
 * Surf Rock style - reverb-heavy surf guitar rock
 */
const SURF_ROCK_STYLE: ArrangerStyle = {
  id: 'surf-rock',
  name: 'Surf Rock',
  category: 'Rock',
  subcategory: 'Surf',
  description: 'Reverb-heavy surf rock with driving beat',
  tempoRange: { min: 145, max: 170 },
  defaultTempo: 155,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'room-kit', { velocityRange: [80, 105] }),
    voice('guitar', 'guitar', { octave: 4, velocityRange: [82, 100] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Surf groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 90), step(0.5, 'root', 0.25, 85),
            step(1, 'fifth', 0.25, 90), step(1.5, 'root', 0.25, 85),
            step(2, 'root', 0.25, 90), step(2.5, 'octave', 0.25, 85),
            step(3, 'fifth', 0.25, 90), step(3.5, 'root', 0.25, 85),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.125, 85), step(0.125, 'third', 0.125, 80),
            step(0.25, 'fifth', 0.125, 82), step(0.375, 'octave', 0.125, 80),
            step(0.5, 'fifth', 0.125, 85), step(0.625, 'third', 0.125, 80),
            step(0.75, 'root', 0.125, 82), step(0.875, 'fifth', 0.125, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(0.5, 'snare', 75),
            drum(1, 'snare', 100), drum(1.5, 'kick', 80),
            drum(2, 'kick', 95), drum(2.5, 'snare', 75),
            drum(3, 'snare', 100), drum(3.5, 'kick', 80),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['surf', 'rock', 'reverb', 'guitar', '60s'],
  icon: '🏄',
};

/**
 * Punk Rock style - fast aggressive punk
 */
const PUNK_ROCK_NEW_STYLE: ArrangerStyle = {
  id: 'punk-rock-new',
  name: 'Punk Rock',
  category: 'Rock',
  subcategory: 'Punk',
  description: 'Fast aggressive 4/4 punk rock',
  tempoRange: { min: 165, max: 190 },
  defaultTempo: 175,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'power-bass', { octave: 2, velocityRange: [95, 115] }),
    voice('drums', 'power-kit', { velocityRange: [100, 120] }),
    voice('guitar', 'distortion-guitar', { octave: 2, velocityRange: [100, 115] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Aggressive drive',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 105), step(0.25, 'root', 0.25, 100),
            step(0.5, 'root', 0.25, 105), step(0.75, 'root', 0.25, 100),
            step(1, 'root', 0.25, 105), step(1.25, 'fifth', 0.25, 100),
            step(1.5, 'root', 0.25, 105), step(1.75, 'root', 0.25, 100),
            step(2, 'root', 0.25, 105), step(2.25, 'root', 0.25, 100),
            step(2.5, 'octave', 0.25, 105), step(2.75, 'root', 0.25, 100),
            step(3, 'fifth', 0.25, 105), step(3.25, 'root', 0.25, 100),
            step(3.5, 'root', 0.25, 105), step(3.75, 'root', 0.25, 100),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 110), step(0.5, 'root', 0.5, 105),
            step(1, 'root', 0.5, 110), step(1.5, 'fifth', 0.5, 105),
            step(2, 'root', 0.5, 110), step(2.5, 'root', 0.5, 105),
            step(3, 'octave', 0.5, 110), step(3.5, 'fifth', 0.5, 105),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            ...Array.from({ length: 4 }, (_, i) => drum(i, 'kick', 110)),
            drum(1, 'snare', 110), drum(3, 'snare', 110),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 85)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['punk', 'rock', 'fast', 'aggressive'],
  icon: '🤘',
};

/**
 * Fast Swing style - up-tempo bebop
 */
const SWING_FAST_STYLE: ArrangerStyle = {
  id: 'swing-fast',
  name: 'Fast Swing',
  category: 'Jazz',
  subcategory: 'Bebop',
  description: 'Up-tempo bebop swing feel',
  tempoRange: { min: 200, max: 280 },
  defaultTempo: 240,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [70, 95] }),
    voice('drums', 'bebop-kit', { velocityRange: [65, 90] }),
    voice('piano', 'bebop-piano', { octave: 4, velocityRange: [70, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Main groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'fifth', 0.5, 75),
            step(1, 'octave', 0.5, 80), step(1.5, 'third', 0.5, 75),
            step(2, 'fifth', 0.5, 85), step(2.5, 'root', 0.5, 75),
            step(3, 'seventh', 0.5, 80), step(3.5, 'third', 0.5, 75),
          ],
          swing: 0.67,
        },
        piano: {
          steps: [
            step(0.5, 'root', 0.125, 75), step(1.5, 'third', 0.125, 70),
            step(2.5, 'fifth', 0.125, 75), step(3.5, 'seventh', 0.125, 70),
          ],
          swing: 0.67,
        },
        drums: {
          steps: [
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'ride', 65 + (i % 2) * 10)),
            drum(1, 'hihat-foot', 70), drum(3, 'hihat-foot', 70),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'swing', 'bebop', 'fast', 'up-tempo'],
  icon: '🎷',
};

/**
 * Slow Swing style - ballad swing
 */
const SWING_SLOW_STYLE: ArrangerStyle = {
  id: 'swing-slow',
  name: 'Slow Swing',
  category: 'Jazz',
  subcategory: 'Ballad',
  description: 'Slow ballad swing with brushes',
  tempoRange: { min: 50, max: 90 },
  defaultTempo: 65,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [60, 80] }),
    voice('drums', 'brush-kit', { velocityRange: [50, 70] }),
    voice('piano', 'jazz-piano', { octave: 4, velocityRange: [65, 85] }),
    voice('strings', 'string-section', { octave: 4, velocityRange: [60, 75] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Ballad feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 70), step(1, 'third', 1, 65),
            step(2, 'fifth', 1, 70), step(3, 'seventh', 1, 65),
          ],
          swing: 0.6,
        },
        piano: {
          steps: [
            step(0, 'root', 0.5, 75), step(1, 'third', 0.5, 70),
            step(2, 'fifth', 0.5, 75), step(3, 'seventh', 0.5, 70),
          ],
          swing: 0.6,
        },
        strings: {
          steps: [
            step(0, 'root', 4, 65),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'brush-sweep', 55 + (i % 2) * 5)),
            drum(1, 'hihat-foot', 60), drum(3, 'hihat-foot', 60),
          ],
          swing: 0.6,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'swing', 'ballad', 'slow', 'brushes'],
  icon: '🎹',
};

/**
 * Latin Jazz style - montuno piano, tumbao bass
 */
const LATIN_JAZZ_STYLE: ArrangerStyle = {
  id: 'latin-jazz',
  name: 'Latin Jazz',
  category: 'Jazz',
  subcategory: 'Latin',
  description: 'Latin jazz with montuno piano and tumbao bass',
  tempoRange: { min: 140, max: 200 },
  defaultTempo: 165,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'latin-bass', { octave: 2, velocityRange: [75, 100] }),
    voice('drums', 'latin-kit', { velocityRange: [70, 95] }),
    voice('piano', 'latin-piano', { octave: 4, velocityRange: [75, 95] }),
    voice('percussion', 'latin-percussion', { octave: 0, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Montuno pattern',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'fifth', 0.25, 75),
            step(0.75, 'root', 0.25, 80), step(1, 'octave', 0.5, 85),
            step(1.5, 'third', 0.5, 75), step(2, 'root', 0.5, 90),
            step(2.5, 'fifth', 0.25, 75), step(2.75, 'octave', 0.25, 80),
            step(3, 'third', 0.5, 85), step(3.5, 'root', 0.5, 75),
          ],
          swing: 0,
        },
        piano: {
          steps: [
            step(0, 'root', 0.25, 85), step(0.5, 'third', 0.25, 75),
            step(1, 'fifth', 0.25, 80), step(1.5, 'seventh', 0.25, 75),
            step(2, 'root', 0.25, 85), step(2.5, 'third', 0.25, 75),
            step(3, 'fifth', 0.25, 80), step(3.5, 'root', 0.25, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.5, 'conga-low', 75),
            drum(1, 'snare', 80), drum(1.5, 'conga-high', 70),
            drum(2, 'kick', 85), drum(2.5, 'conga-low', 75),
            drum(3, 'snare', 80), drum(3.5, 'conga-high', 70),
          ],
          swing: 0,
        },
        percussion: {
          steps: [
            drum(0, 'cowbell', 75), drum(0.5, 'cowbell', 65),
            drum(1, 'cowbell', 70), drum(1.5, 'cowbell', 65),
            drum(2, 'cowbell', 75), drum(2.5, 'cowbell', 65),
            drum(3, 'cowbell', 70), drum(3.5, 'cowbell', 65),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'latin', 'montuno', 'tumbao', 'afro-cuban'],
  icon: '🎺',
};

/**
 * Post-Punk style - angular rhythms, nervous energy
 */
const POST_PUNK_STYLE: ArrangerStyle = {
  id: 'post-punk',
  name: 'Post-Punk',
  category: 'Rock',
  subcategory: 'Post-Punk',
  description: 'Angular rhythms and nervous energy',
  tempoRange: { min: 120, max: 150 },
  defaultTempo: 135,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', { octave: 2, velocityRange: [85, 105] }),
    voice('drums', 'dry-kit', { velocityRange: [80, 100] }),
    voice('guitar', 'guitar', { octave: 3, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Angular groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.375, 95), step(0.5, 'fifth', 0.125, 80),
            step(0.75, 'root', 0.25, 90), step(1.25, 'octave', 0.375, 85),
            step(1.75, 'third', 0.25, 80), step(2, 'root', 0.375, 95),
            step(2.5, 'seventh', 0.125, 80), step(2.75, 'fifth', 0.25, 90),
            step(3.25, 'root', 0.375, 85), step(3.75, 'octave', 0.25, 80),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0.25, 'root', 0.125, 80), step(0.75, 'third', 0.125, 75),
            step(1.25, 'fifth', 0.125, 80), step(1.75, 'seventh', 0.125, 75),
            step(2.25, 'root', 0.125, 80), step(2.75, 'third', 0.125, 75),
            step(3.25, 'fifth', 0.125, 80), step(3.75, 'octave', 0.125, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(0.5, 'hihat', 70),
            drum(1, 'snare', 95), drum(1.5, 'hihat', 65),
            drum(2, 'kick', 85), drum(2.25, 'kick', 80),
            drum(2.5, 'hihat', 70), drum(3, 'snare', 95),
            drum(3.5, 'hihat', 65), drum(3.75, 'kick', 75),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['post-punk', 'angular', 'nervous', 'dark', 'minimal'],
  icon: '🖤',
};

/**
 * New Wave style - synth-driven 80s pop rock
 */
const NEW_WAVE_STYLE: ArrangerStyle = {
  id: 'new-wave',
  name: 'New Wave',
  category: 'Rock',
  subcategory: 'New Wave',
  description: 'Synth-driven 80s pop rock',
  tempoRange: { min: 110, max: 140 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'electronic-kit', { velocityRange: [75, 95] }),
    voice('synth', 'analog-synth', { octave: 4, velocityRange: [75, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Synth groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 90), step(0.25, 'root', 0.25, 80),
            step(0.5, 'fifth', 0.25, 85), step(0.75, 'octave', 0.25, 75),
            step(1, 'root', 0.25, 90), step(1.25, 'third', 0.25, 80),
            step(1.5, 'fifth', 0.25, 85), step(1.75, 'root', 0.25, 75),
            step(2, 'root', 0.25, 90), step(2.25, 'octave', 0.25, 80),
            step(2.5, 'fifth', 0.25, 85), step(2.75, 'third', 0.25, 75),
            step(3, 'root', 0.25, 90), step(3.25, 'fifth', 0.25, 80),
            step(3.5, 'octave', 0.25, 85), step(3.75, 'root', 0.25, 75),
          ],
          swing: 0,
        },
        synth: {
          steps: [
            step(0, 'root', 0.5, 80), step(0.5, 'third', 0.25, 75),
            step(1, 'fifth', 0.5, 80), step(1.5, 'seventh', 0.25, 75),
            step(2, 'octave', 0.5, 80), step(2.5, 'fifth', 0.25, 75),
            step(3, 'third', 0.5, 80), step(3.5, 'root', 0.25, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.5, 'hihat', 70),
            drum(1, 'snare', 90), drum(1.5, 'hihat', 70),
            drum(2, 'kick', 85), drum(2.5, 'hihat', 70),
            drum(3, 'snare', 90), drum(3.5, 'hihat', 70),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat', 60)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['new-wave', '80s', 'synth', 'pop-rock', 'electronic'],
  icon: '🎹',
};

/**
 * Glam Rock style - stomping beat, theatrical
 */
const GLAM_ROCK_STYLE: ArrangerStyle = {
  id: 'glam-rock',
  name: 'Glam Rock',
  category: 'Rock',
  subcategory: 'Glam',
  description: 'Stomping beat with theatrical energy',
  tempoRange: { min: 120, max: 145 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'power-bass', { octave: 2, velocityRange: [85, 105] }),
    voice('drums', 'room-kit', { velocityRange: [90, 110] }),
    voice('guitar', 'power-guitar', { octave: 2, velocityRange: [85, 100] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Stomp groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 100), step(0.5, 'root', 0.5, 90),
            step(1, 'fifth', 0.5, 95), step(1.5, 'octave', 0.5, 85),
            step(2, 'root', 0.5, 100), step(2.5, 'third', 0.5, 90),
            step(3, 'fifth', 0.5, 95), step(3.5, 'root', 0.5, 85),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 95), step(1, 'fifth', 0.5, 90),
            step(2, 'octave', 0.5, 95), step(3, 'third', 0.5, 90),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 105), drum(0, 'clap', 100),
            drum(1, 'snare', 110), drum(1.5, 'kick', 85),
            drum(2, 'kick', 105), drum(2, 'clap', 100),
            drum(3, 'snare', 110), drum(3.5, 'kick', 85),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat', 75)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['glam', 'rock', 'stomp', 'theatrical', '70s'],
  icon: '⭐',
};

/**
 * Garage Rock style - raw energetic rock
 */
const GARAGE_ROCK_STYLE: ArrangerStyle = {
  id: 'garage-rock',
  name: 'Garage Rock',
  category: 'Rock',
  subcategory: 'Garage',
  description: 'Raw energetic garage rock',
  tempoRange: { min: 135, max: 160 },
  defaultTempo: 145,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', { octave: 2, velocityRange: [90, 110] }),
    voice('drums', 'room-kit', { velocityRange: [95, 115] }),
    voice('guitar', 'fuzz-guitar', { octave: 2, velocityRange: [95, 110] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Raw drive',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 105), step(0.5, 'fifth', 0.25, 90),
            step(0.75, 'root', 0.25, 95), step(1, 'octave', 0.5, 100),
            step(1.5, 'root', 0.5, 90), step(2, 'fifth', 0.5, 105),
            step(2.5, 'third', 0.25, 90), step(2.75, 'root', 0.25, 95),
            step(3, 'octave', 0.5, 100), step(3.5, 'fifth', 0.5, 90),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.25, 100), step(0.5, 'fifth', 0.25, 90),
            step(1, 'octave', 0.25, 100), step(1.5, 'third', 0.25, 90),
            step(2, 'root', 0.25, 100), step(2.5, 'fifth', 0.25, 90),
            step(3, 'octave', 0.25, 100), step(3.5, 'root', 0.25, 90),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 110), drum(0.5, 'hihat', 80),
            drum(1, 'snare', 115), drum(1.5, 'kick', 90),
            drum(2, 'kick', 110), drum(2.5, 'hihat', 80),
            drum(3, 'snare', 115), drum(3.5, 'kick', 90),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 75)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['garage', 'rock', 'raw', 'energetic', 'fuzz'],
  icon: '🚗',
};

/**
 * Psychedelic Rock style - spacey, experimental
 */
const PSYCHEDELIC_ROCK_STYLE: ArrangerStyle = {
  id: 'psychedelic-rock',
  name: 'Psychedelic Rock',
  category: 'Rock',
  subcategory: 'Psychedelic',
  description: 'Spacey experimental rock',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', { octave: 2, velocityRange: [70, 90] }),
    voice('drums', 'vintage-kit', { velocityRange: [65, 85] }),
    voice('guitar', 'phaser-guitar', { octave: 4, velocityRange: [70, 85] }),
    voice('keys', 'organ', { octave: 4, velocityRange: [65, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Spacey groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 80), step(1, 'fifth', 0.5, 70),
            step(1.5, 'third', 0.5, 75), step(2, 'octave', 1, 80),
            step(3, 'seventh', 1, 75),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 75), step(0.75, 'third', 0.25, 70),
            step(1.25, 'fifth', 0.5, 75), step(1.75, 'seventh', 0.25, 70),
            step(2.25, 'ninth', 0.5, 75), step(2.75, 'fifth', 0.25, 70),
            step(3.25, 'third', 0.5, 75), step(3.75, 'root', 0.25, 70),
          ],
          swing: 0,
        },
        keys: {
          steps: [
            step(0, 'root', 2, 70), step(2, 'fifth', 2, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 75), drum(0.5, 'hihat', 60),
            drum(1, 'snare', 80), drum(1.5, 'hihat', 60),
            drum(2, 'kick', 75), drum(2.5, 'hihat', 60),
            drum(3, 'snare', 80), drum(3.5, 'hihat', 60),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'ride', 55)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['psychedelic', 'rock', 'spacey', 'experimental', '60s'],
  icon: '🌀',
};

/**
 * Southern Rock style - shuffle feel with blues
 */
const SOUTHERN_ROCK_STYLE: ArrangerStyle = {
  id: 'southern-rock',
  name: 'Southern Rock',
  category: 'Rock',
  subcategory: 'Southern',
  description: 'Shuffle feel with blues influence',
  tempoRange: { min: 105, max: 135 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'room-kit', { velocityRange: [75, 95] }),
    voice('guitar', 'slide-guitar', { octave: 3, velocityRange: [75, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Shuffle groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.67, 'fifth', 0.33, 75),
            step(1, 'octave', 0.5, 85), step(1.67, 'third', 0.33, 75),
            step(2, 'fifth', 0.5, 90), step(2.67, 'root', 0.33, 75),
            step(3, 'seventh', 0.5, 85), step(3.67, 'third', 0.33, 75),
          ],
          swing: 0.67,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 80), step(0.5, 'third', 0.25, 70),
            step(1, 'fifth', 0.5, 80), step(1.5, 'seventh', 0.25, 70),
            step(2, 'root', 0.5, 80), step(2.5, 'fourth', 0.25, 70),
            step(3, 'third', 0.5, 80), step(3.5, 'root', 0.25, 70),
          ],
          swing: 0.67,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.67, 'snare', 70),
            drum(1, 'snare', 90), drum(1.5, 'kick', 75),
            drum(2, 'kick', 85), drum(2.67, 'snare', 70),
            drum(3, 'snare', 90), drum(3.5, 'kick', 75),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'ride', 65)),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['southern', 'rock', 'shuffle', 'blues', 'slide-guitar'],
  icon: '🤠',
};

/**
 * Pop Punk style - upbeat energetic punk pop
 */
const POP_PUNK_STYLE: ArrangerStyle = {
  id: 'pop-punk',
  name: 'Pop Punk',
  category: 'Rock',
  subcategory: 'Pop Punk',
  description: 'Upbeat energetic punk with pop hooks',
  tempoRange: { min: 160, max: 185 },
  defaultTempo: 170,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'power-bass', { octave: 2, velocityRange: [90, 110] }),
    voice('drums', 'power-kit', { velocityRange: [95, 115] }),
    voice('guitar', 'distortion-guitar', { octave: 2, velocityRange: [90, 105] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Energetic drive',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 100), step(0.25, 'root', 0.25, 95),
            step(0.5, 'fifth', 0.25, 100), step(0.75, 'octave', 0.25, 90),
            step(1, 'root', 0.25, 100), step(1.25, 'third', 0.25, 95),
            step(1.5, 'fifth', 0.25, 100), step(1.75, 'root', 0.25, 90),
            step(2, 'octave', 0.25, 100), step(2.25, 'fifth', 0.25, 95),
            step(2.5, 'root', 0.25, 100), step(2.75, 'third', 0.25, 90),
            step(3, 'fifth', 0.25, 100), step(3.25, 'octave', 0.25, 95),
            step(3.5, 'root', 0.25, 100), step(3.75, 'fifth', 0.25, 90),
          ],
          swing: 0,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.5, 'fifth', 0.5, 90),
            step(1, 'octave', 0.5, 95), step(1.5, 'third', 0.5, 90),
            step(2, 'root', 0.5, 95), step(2.5, 'fifth', 0.5, 90),
            step(3, 'octave', 0.5, 95), step(3.5, 'root', 0.5, 90),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 110), drum(0.5, 'hihat', 85),
            drum(1, 'snare', 115), drum(1.5, 'hihat', 85),
            drum(2, 'kick', 110), drum(2.5, 'hihat', 85),
            drum(3, 'snare', 115), drum(3.5, 'hihat', 85),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 75)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['pop-punk', 'punk', 'pop', 'energetic', 'upbeat', 'fast'],
  icon: '🎸',
};

/**
 * Hard Bop style - funky blues-influenced bebop
 */
const HARD_BOP_STYLE: ArrangerStyle = {
  id: 'hard-bop',
  name: 'Hard Bop',
  category: 'Jazz',
  subcategory: 'Hard Bop',
  description: 'Funky blues-influenced bebop',
  tempoRange: { min: 140, max: 180 },
  defaultTempo: 160,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [75, 100] }),
    voice('drums', 'hard-bop-kit', { velocityRange: [80, 105] }),
    voice('piano', 'hard-bop-piano', { octave: 4, velocityRange: [75, 95] }),
    voice('brass', 'trumpet', { octave: 4, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Funky groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'fifth', 0.25, 75),
            step(0.75, 'third', 0.25, 80), step(1, 'octave', 0.5, 85),
            step(1.5, 'seventh', 0.25, 75), step(1.75, 'fourth', 0.25, 80),
            step(2, 'fifth', 0.5, 90), step(2.5, 'root', 0.25, 75),
            step(2.75, 'third', 0.25, 80), step(3, 'seventh', 0.5, 85),
            step(3.5, 'fifth', 0.5, 75),
          ],
          swing: 0.6,
        },
        piano: {
          steps: [
            step(0.5, 'root', 0.125, 80), step(1.5, 'third', 0.125, 75),
            step(2.5, 'fifth', 0.125, 80), step(3.5, 'seventh', 0.125, 75),
          ],
          swing: 0.6,
        },
        drums: {
          steps: [
            drum(0, 'ride', 85), drum(0.5, 'snare', 75),
            drum(1, 'ride', 90), drum(1.5, 'kick', 80),
            drum(2, 'ride', 85), drum(2.5, 'snare', 75),
            drum(3, 'ride', 90), drum(3.5, 'kick', 80),
            drum(1, 'hihat-foot', 70), drum(3, 'hihat-foot', 70),
          ],
          swing: 0.6,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'hard-bop', 'funky', 'blues', 'bebop'],
  icon: '🎺',
};

/**
 * Free Jazz style - open improvisation
 */
const FREE_JAZZ_STYLE: ArrangerStyle = {
  id: 'free-jazz',
  name: 'Free Jazz',
  category: 'Jazz',
  subcategory: 'Free',
  description: 'Open improvisation with loose structure',
  tempoRange: { min: 120, max: 160 },
  defaultTempo: 140,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [60, 95] }),
    voice('drums', 'free-kit', { velocityRange: [55, 90] }),
    voice('piano', 'prepared-piano', { octave: 4, velocityRange: [60, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Free groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.75, 75), step(0.875, 'seventh', 0.125, 65),
            step(1.25, 'third', 0.5, 80), step(2, 'fifth', 0.625, 70),
            step(2.75, 'ninth', 0.25, 75), step(3.25, 'root', 0.75, 80),
          ],
          swing: 0,
        },
        piano: {
          steps: [
            step(0.5, 'root', 0.25, 70), step(1.25, 'ninth', 0.125, 65),
            step(2, 'fifth', 0.375, 75), step(2.75, 'thirteenth', 0.125, 65),
            step(3.5, 'seventh', 0.25, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'ride', 70), drum(0.75, 'cymbal-splash', 60),
            drum(1.5, 'snare', 65), drum(2.25, 'kick', 70),
            drum(3, 'ride', 75), drum(3.625, 'hihat', 55),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'free', 'avant-garde', 'experimental', 'improvisation'],
  icon: '🎨',
};

/**
 * Gypsy Jazz style - Django Reinhardt manouche
 */
const GYPSY_JAZZ_STYLE: ArrangerStyle = {
  id: 'gypsy-jazz',
  name: 'Gypsy Jazz',
  category: 'Jazz',
  subcategory: 'Gypsy',
  description: 'Django Reinhardt-style manouche jazz',
  tempoRange: { min: 160, max: 200 },
  defaultTempo: 180,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('guitar', 'gypsy-guitar', { octave: 4, velocityRange: [80, 100] }),
    voice('violin', 'violin', { octave: 5, velocityRange: [75, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'La pompe rhythm',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.5, 'fifth', 0.5, 80),
            step(1, 'octave', 0.5, 85), step(1.5, 'third', 0.5, 80),
            step(2, 'fifth', 0.5, 90), step(2.5, 'root', 0.5, 80),
            step(3, 'seventh', 0.5, 85), step(3.5, 'third', 0.5, 80),
          ],
          swing: 0.55,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.125, 90), step(0.5, 'root', 0.125, 70),
            step(1, 'third', 0.125, 85), step(1.5, 'third', 0.125, 65),
            step(2, 'fifth', 0.125, 90), step(2.5, 'fifth', 0.125, 70),
            step(3, 'seventh', 0.125, 85), step(3.5, 'seventh', 0.125, 65),
          ],
          swing: 0.55,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'gypsy', 'manouche', 'django', 'french'],
  icon: '🎻',
};

/**
 * Acid Jazz style - funk fusion with jazz
 */
const ACID_JAZZ_STYLE: ArrangerStyle = {
  id: 'acid-jazz',
  name: 'Acid Jazz',
  category: 'Jazz',
  subcategory: 'Acid',
  description: 'Funk fusion with jazz harmonies',
  tempoRange: { min: 100, max: 130 },
  defaultTempo: 115,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'breakbeat-kit', { velocityRange: [75, 95] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [70, 85] }),
    voice('brass', 'brass-section', { octave: 4, velocityRange: [75, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Funky groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 95), step(0.375, 'fifth', 0.125, 75),
            step(0.5, 'octave', 0.25, 85), step(0.875, 'third', 0.125, 75),
            step(1, 'root', 0.25, 90), step(1.375, 'seventh', 0.125, 75),
            step(1.5, 'fifth', 0.25, 85), step(1.875, 'root', 0.125, 75),
            step(2, 'octave', 0.25, 95), step(2.375, 'fifth', 0.125, 75),
            step(2.5, 'third', 0.25, 85), step(2.875, 'root', 0.125, 75),
            step(3, 'seventh', 0.25, 90), step(3.5, 'fifth', 0.5, 80),
          ],
          swing: 0,
        },
        keys: {
          steps: [
            step(0.5, 'root', 0.25, 75), step(1.5, 'third', 0.25, 70),
            step(2.5, 'fifth', 0.25, 75), step(3.5, 'seventh', 0.25, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(0.375, 'snare', 60),
            drum(0.5, 'hihat', 70), drum(1, 'snare', 95),
            drum(1.5, 'kick', 75), drum(2, 'kick', 90),
            drum(2.5, 'hihat', 70), drum(3, 'snare', 95),
            drum(3.75, 'kick', 70),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'acid-jazz', 'funk', 'fusion', 'groove'],
  icon: '🎹',
};

/**
 * Nu Jazz style - electronic elements with jazz
 */
const NU_JAZZ_STYLE: ArrangerStyle = {
  id: 'nu-jazz',
  name: 'Nu Jazz',
  category: 'Jazz',
  subcategory: 'Nu Jazz',
  description: 'Electronic elements with jazz harmonies',
  tempoRange: { min: 90, max: 120 },
  defaultTempo: 105,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'electronic-kit', { velocityRange: [70, 90] }),
    voice('keys', 'electric-piano', { octave: 4, velocityRange: [70, 85] }),
    voice('pad', 'synth-pad', { octave: 4, velocityRange: [60, 75] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Electronic groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'fifth', 0.25, 70),
            step(0.75, 'octave', 0.25, 75), step(1, 'third', 0.5, 80),
            step(1.5, 'seventh', 0.5, 70), step(2, 'fifth', 0.5, 85),
            step(2.5, 'root', 0.25, 70), step(2.75, 'ninth', 0.25, 75),
            step(3, 'seventh', 0.5, 80), step(3.5, 'third', 0.5, 70),
          ],
          swing: 0,
        },
        keys: {
          steps: [
            step(0, 'root', 0.75, 75), step(1, 'third', 0.75, 70),
            step(2, 'fifth', 0.75, 75), step(3, 'seventh', 0.75, 70),
          ],
          swing: 0,
        },
        pad: {
          steps: [
            step(0, 'root', 4, 65),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.5, 'hihat', 65),
            drum(1, 'snare', 90), drum(1.5, 'hihat', 65),
            drum(2, 'kick', 85), drum(2.5, 'hihat', 65),
            drum(3, 'snare', 90), drum(3.5, 'hihat', 65),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'nu-jazz', 'electronic', 'downtempo', 'modern'],
  icon: '🎛️',
};

/**
 * Jazz Fusion style - rock-influenced jazz
 */
const JAZZ_FUSION_STYLE: ArrangerStyle = {
  id: 'jazz-fusion',
  name: 'Jazz Fusion',
  category: 'Jazz',
  subcategory: 'Fusion',
  description: 'Rock-influenced jazz with electric instruments',
  tempoRange: { min: 115, max: 145 },
  defaultTempo: 130,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [80, 105] }),
    voice('drums', 'fusion-kit', { velocityRange: [80, 100] }),
    voice('keys', 'rhodes', { octave: 4, velocityRange: [75, 90] }),
    voice('guitar', 'clean-guitar', { octave: 4, velocityRange: [75, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Fusion groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 95), step(0.25, 'fifth', 0.125, 80),
            step(0.5, 'octave', 0.25, 90), step(0.75, 'third', 0.125, 75),
            step(1, 'seventh', 0.25, 85), step(1.5, 'root', 0.25, 95),
            step(1.75, 'fifth', 0.125, 80), step(2, 'octave', 0.25, 90),
            step(2.375, 'ninth', 0.125, 75), step(2.5, 'third', 0.25, 85),
            step(3, 'seventh', 0.25, 95), step(3.5, 'fifth', 0.5, 85),
          ],
          swing: 0,
        },
        keys: {
          steps: [
            step(0.5, 'root', 0.25, 80), step(1.5, 'third', 0.25, 75),
            step(2.5, 'fifth', 0.25, 80), step(3.5, 'seventh', 0.25, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(0.5, 'hihat', 75),
            drum(1, 'snare', 100), drum(1.5, 'kick', 80),
            drum(2, 'kick', 95), drum(2.5, 'hihat', 75),
            drum(3, 'snare', 100), drum(3.75, 'kick', 80),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'ride', 70)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'fusion', 'rock', 'electric', 'funk'],
  icon: '⚡',
};

/**
 * Chicago Blues style - shuffle 12/8 blues
 */
const CHICAGO_BLUES_STYLE: ArrangerStyle = {
  id: 'chicago-blues',
  name: 'Chicago Blues',
  category: 'Blues',
  subcategory: 'Chicago',
  description: 'Shuffle 12/8 electric blues',
  tempoRange: { min: 70, max: 100 },
  defaultTempo: 85,
  timeSignature: { numerator: 12, denominator: 8 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [75, 95] }),
    voice('drums', 'blues-kit', { velocityRange: [70, 90] }),
    voice('guitar', 'blues-guitar', { octave: 3, velocityRange: [75, 90] }),
    voice('harp', 'harmonica', { octave: 5, velocityRange: [70, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Shuffle groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 90), step(0.67, 'third', 0.33, 75),
            step(1, 'fifth', 0.5, 85), step(1.67, 'root', 0.33, 75),
            step(2, 'root', 0.5, 90), step(2.67, 'octave', 0.33, 75),
            step(3, 'seventh', 0.5, 85), step(3.67, 'fifth', 0.33, 75),
          ],
          swing: 0.67,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.33, 80), step(0.67, 'third', 0.33, 70),
            step(1.33, 'fifth', 0.33, 75), step(2, 'root', 0.33, 80),
            step(2.67, 'fourth', 0.33, 70), step(3.33, 'third', 0.33, 75),
          ],
          swing: 0.67,
        },
        drums: {
          steps: [
            drum(0, 'kick', 85), drum(0.67, 'snare', 70),
            drum(1.33, 'kick', 75), drum(2, 'snare', 90),
            drum(2.67, 'kick', 75), drum(3.33, 'snare', 80),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'ride', 65)),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'chicago', 'shuffle', 'electric', '12-bar'],
  icon: '🎸',
};

/**
 * Delta Blues style - acoustic sparse blues
 */
const DELTA_BLUES_STYLE: ArrangerStyle = {
  id: 'delta-blues',
  name: 'Delta Blues',
  category: 'Blues',
  subcategory: 'Delta',
  description: 'Acoustic sparse Mississippi Delta blues',
  tempoRange: { min: 60, max: 90 },
  defaultTempo: 75,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('guitar', 'acoustic-guitar', { octave: 3, velocityRange: [65, 85] }),
    voice('vocal', 'voice', { octave: 4, velocityRange: [70, 90] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Fingerpicking pattern',
      voices: {
        guitar: {
          steps: [
            step(0, 'root', 0.5, 80), step(0.5, 'third', 0.25, 65),
            step(0.75, 'fifth', 0.25, 70), step(1, 'root', 0.5, 75),
            step(1.5, 'seventh', 0.25, 65), step(1.75, 'third', 0.25, 70),
            step(2, 'fifth', 0.5, 80), step(2.5, 'root', 0.25, 65),
            step(2.75, 'fourth', 0.25, 70), step(3, 'third', 0.5, 75),
            step(3.5, 'root', 0.5, 70),
          ],
          swing: 0.6,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'delta', 'acoustic', 'mississippi', 'folk'],
  icon: '🎸',
};

/**
 * Texas Blues style - T-Bone Walker swing blues
 */
const TEXAS_BLUES_STYLE: ArrangerStyle = {
  id: 'texas-blues',
  name: 'Texas Blues',
  category: 'Blues',
  subcategory: 'Texas',
  description: 'T-Bone Walker style swing blues',
  tempoRange: { min: 80, max: 110 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [70, 90] }),
    voice('drums', 'swing-kit', { velocityRange: [65, 85] }),
    voice('guitar', 'hollow-body-guitar', { octave: 4, velocityRange: [75, 95] }),
    voice('piano', 'honky-tonk-piano', { octave: 4, velocityRange: [70, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Swing shuffle',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.67, 'fifth', 0.33, 70),
            step(1, 'octave', 0.5, 80), step(1.67, 'third', 0.33, 70),
            step(2, 'fifth', 0.5, 85), step(2.67, 'root', 0.33, 70),
            step(3, 'seventh', 0.5, 80), step(3.67, 'third', 0.33, 70),
          ],
          swing: 0.67,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.33, 85), step(0.67, 'third', 0.25, 70),
            step(1, 'fifth', 0.33, 80), step(1.67, 'seventh', 0.25, 70),
            step(2, 'root', 0.33, 85), step(2.67, 'fourth', 0.25, 70),
            step(3, 'third', 0.33, 80), step(3.67, 'root', 0.25, 70),
          ],
          swing: 0.67,
        },
        piano: {
          steps: [
            step(0.5, 'root', 0.25, 75), step(1.5, 'third', 0.25, 70),
            step(2.5, 'fifth', 0.25, 75), step(3.5, 'seventh', 0.25, 70),
          ],
          swing: 0.67,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(0.67, 'snare', 65),
            drum(1.33, 'kick', 70), drum(2, 'snare', 85),
            drum(2.67, 'kick', 70), drum(3.33, 'snare', 75),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'ride', 60)),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'texas', 'swing', 't-bone', 'shuffle'],
  icon: '🤠',
};

/**
 * Jump Blues style - uptempo swing blues
 */
const JUMP_BLUES_STYLE: ArrangerStyle = {
  id: 'jump-blues',
  name: 'Jump Blues',
  category: 'Blues',
  subcategory: 'Jump',
  description: 'Uptempo swing blues with brass',
  tempoRange: { min: 135, max: 165 },
  defaultTempo: 150,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'jump-kit', { velocityRange: [75, 95] }),
    voice('piano', 'honky-tonk-piano', { octave: 4, velocityRange: [75, 90] }),
    voice('brass', 'brass-section', { octave: 4, velocityRange: [80, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Jump groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.67, 'fifth', 0.33, 80),
            step(1, 'octave', 0.5, 90), step(1.67, 'third', 0.33, 80),
            step(2, 'fifth', 0.5, 95), step(2.67, 'root', 0.33, 80),
            step(3, 'seventh', 0.5, 90), step(3.67, 'third', 0.33, 80),
          ],
          swing: 0.67,
        },
        piano: {
          steps: [
            step(0, 'root', 0.25, 85), step(0.5, 'third', 0.25, 75),
            step(1, 'fifth', 0.25, 85), step(1.5, 'seventh', 0.25, 75),
            step(2, 'root', 0.25, 85), step(2.5, 'fourth', 0.25, 75),
            step(3, 'third', 0.25, 85), step(3.5, 'root', 0.25, 75),
          ],
          swing: 0.67,
        },
        brass: {
          steps: [
            step(0.5, 'root', 0.25, 90), step(2.5, 'fifth', 0.25, 85),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 90), drum(0.67, 'snare', 75),
            drum(1.33, 'kick', 80), drum(2, 'snare', 95),
            drum(2.67, 'kick', 80), drum(3.33, 'snare', 85),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'ride', 70)),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'jump', 'uptempo', 'swing', 'brass'],
  icon: '🎺',
};

/**
 * Blues Rock style - rock shuffle
 */
const BLUES_ROCK_STYLE: ArrangerStyle = {
  id: 'blues-rock',
  name: 'Blues Rock',
  category: 'Blues',
  subcategory: 'Rock',
  description: 'Rock shuffle with blues feel',
  tempoRange: { min: 105, max: 135 },
  defaultTempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [80, 100] }),
    voice('drums', 'rock-kit', { velocityRange: [80, 100] }),
    voice('guitar', 'distorted-guitar', { octave: 3, velocityRange: [85, 105] }),
    voice('organ', 'hammond-organ', { octave: 4, velocityRange: [70, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Shuffle groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 95), step(0.67, 'fifth', 0.33, 85),
            step(1, 'octave', 0.5, 100), step(1.67, 'third', 0.33, 85),
            step(2, 'fifth', 0.5, 95), step(2.67, 'root', 0.33, 85),
            step(3, 'seventh', 0.5, 100), step(3.67, 'third', 0.33, 85),
          ],
          swing: 0.67,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.75, 100), step(1, 'fifth', 0.75, 95),
            step(2, 'root', 0.75, 100), step(3, 'third', 0.75, 95),
          ],
          swing: 0.67,
        },
        organ: {
          steps: [
            step(0, 'root', 2, 80), step(2, 'fifth', 2, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 95), drum(0.67, 'snare', 85),
            drum(1.33, 'kick', 85), drum(2, 'snare', 100),
            drum(2.67, 'kick', 85), drum(3.33, 'snare', 90),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'hihat', 75)),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'rock', 'shuffle', 'guitar', 'hammond'],
  icon: '🎸',
};

/**
 * Electric Blues style - BB King influenced
 */
const ELECTRIC_BLUES_STYLE: ArrangerStyle = {
  id: 'electric-blues',
  name: 'Electric Blues',
  category: 'Blues',
  subcategory: 'Electric',
  description: 'BB King style with expressive guitar',
  tempoRange: { min: 75, max: 105 },
  defaultTempo: 90,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'electric-bass', { octave: 2, velocityRange: [70, 85] }),
    voice('drums', 'blues-kit', { velocityRange: [60, 80] }),
    voice('guitar', 'blues-guitar', { octave: 4, velocityRange: [75, 95] }),
    voice('keys', 'electric-piano', { octave: 4, velocityRange: [65, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Slow blues feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 80), step(0.67, 'fifth', 0.33, 70),
            step(1, 'octave', 0.5, 85), step(1.67, 'third', 0.33, 70),
            step(2, 'fifth', 0.5, 80), step(2.67, 'root', 0.33, 70),
            step(3, 'seventh', 0.5, 85), step(3.67, 'fifth', 0.33, 70),
          ],
          swing: 0.67,
        },
        guitar: {
          steps: [
            step(0, 'root', 0.5, 90), step(1, 'third', 0.5, 85),
            step(2, 'fifth', 0.5, 90), step(3, 'root', 0.5, 85),
          ],
          swing: 0.67,
        },
        keys: {
          steps: [
            step(0.5, 'third', 0.5, 75), step(2, 'fifth', 0.5, 70),
            step(3.5, 'root', 0.5, 75),
          ],
          swing: 0.67,
        },
        drums: {
          steps: [
            drum(0, 'kick', 75), drum(0.67, 'snare', 70),
            drum(1.33, 'kick', 70), drum(2, 'snare', 80),
            drum(2.67, 'kick', 70), drum(3.33, 'snare', 75),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'ride', 65)),
          ],
          swing: 0.67,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'electric', 'bb-king', 'guitar', 'slow'],
  icon: '🎸',
};

/**
 * Boogie Woogie style - rolling bass pattern
 */
const BOOGIE_WOOGIE_STYLE: ArrangerStyle = {
  id: 'boogie-woogie',
  name: 'Boogie Woogie',
  category: 'Blues',
  subcategory: 'Piano',
  description: 'Rolling bass piano style',
  tempoRange: { min: 145, max: 175 },
  defaultTempo: 160,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('piano-bass', 'piano', { octave: 2, velocityRange: [85, 100] }),
    voice('piano-treble', 'piano', { octave: 5, velocityRange: [75, 90] }),
    voice('drums', 'light-kit', { velocityRange: [60, 75] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Rolling bass',
      voices: {
        'piano-bass': {
          steps: [
            step(0, 'root', 0.25, 95), step(0.25, 'third', 0.25, 85),
            step(0.5, 'fifth', 0.25, 90), step(0.75, 'sixth', 0.25, 85),
            step(1, 'seventh', 0.25, 95), step(1.25, 'sixth', 0.25, 85),
            step(1.5, 'fifth', 0.25, 90), step(1.75, 'third', 0.25, 85),
            step(2, 'root', 0.25, 95), step(2.25, 'third', 0.25, 85),
            step(2.5, 'fifth', 0.25, 90), step(2.75, 'sixth', 0.25, 85),
            step(3, 'seventh', 0.25, 95), step(3.25, 'sixth', 0.25, 85),
            step(3.5, 'fifth', 0.25, 90), step(3.75, 'third', 0.25, 85),
          ],
          swing: 0,
        },
        'piano-treble': {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'third', 0.5, 80),
            step(1, 'fifth', 0.5, 85), step(1.5, 'third', 0.5, 80),
            step(2, 'root', 0.5, 85), step(2.5, 'seventh', 0.5, 80),
            step(3, 'fifth', 0.5, 85), step(3.5, 'third', 0.5, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 70), drum(1, 'kick', 65), 
            drum(2, 'kick', 70), drum(3, 'kick', 65),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 60)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['blues', 'piano', 'boogie-woogie', 'rolling', 'uptempo'],
  icon: '🎹',
};

/**
 * Stride Piano style - left-hand stride
 */
const STRIDE_PIANO_STYLE: ArrangerStyle = {
  id: 'stride-piano',
  name: 'Stride Piano',
  category: 'Jazz',
  subcategory: 'Piano',
  description: 'Ragtime-influenced stride piano',
  tempoRange: { min: 160, max: 190 },
  defaultTempo: 175,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('piano-bass', 'piano', { octave: 2, velocityRange: [90, 105] }),
    voice('piano-treble', 'piano', { octave: 5, velocityRange: [80, 95] }),
    voice('drums', 'minimal-kit', { velocityRange: [55, 70] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Stride pattern',
      voices: {
        'piano-bass': {
          steps: [
            step(0, 'root', 0.5, 100), step(0.5, 'fifth', 0.5, 90),
            step(1, 'root', 0.5, 100), step(1.5, 'third', 0.5, 90),
            step(2, 'root', 0.5, 100), step(2.5, 'fifth', 0.5, 90),
            step(3, 'root', 0.5, 100), step(3.5, 'seventh', 0.5, 90),
          ],
          swing: 0,
        },
        'piano-treble': {
          steps: [
            step(0, 'root', 0.25, 90), step(0.25, 'third', 0.25, 85),
            step(0.5, 'fifth', 0.25, 90), step(0.75, 'octave', 0.25, 85),
            step(1, 'seventh', 0.25, 90), step(1.25, 'fifth', 0.25, 85),
            step(1.5, 'third', 0.25, 90), step(1.75, 'root', 0.25, 85),
            step(2, 'root', 0.25, 90), step(2.25, 'third', 0.25, 85),
            step(2.5, 'fifth', 0.25, 90), step(2.75, 'seventh', 0.25, 85),
            step(3, 'octave', 0.25, 90), step(3.25, 'seventh', 0.25, 85),
            step(3.5, 'fifth', 0.25, 90), step(3.75, 'third', 0.25, 85),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 65), drum(2, 'snare', 60),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat', 55)),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'piano', 'stride', 'ragtime', 'virtuosic'],
  icon: '🎹',
};

/**
 * Third Stream style - classical/jazz fusion
 */
const THIRD_STREAM_STYLE: ArrangerStyle = {
  id: 'third-stream',
  name: 'Third Stream',
  category: 'Jazz',
  subcategory: 'Fusion',
  description: 'Classical-jazz fusion',
  tempoRange: { min: 80, max: 110 },
  defaultTempo: 95,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [65, 80] }),
    voice('drums', 'brushes-kit', { velocityRange: [50, 65] }),
    voice('strings', 'string-ensemble', { octave: 4, velocityRange: [70, 85] }),
    voice('woodwinds', 'woodwind-section', { octave: 4, velocityRange: [65, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Chamber jazz feel',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 75), step(1, 'third', 1, 70),
            step(2, 'fifth', 1, 75), step(3, 'seventh', 1, 70),
          ],
          swing: 0,
        },
        strings: {
          steps: [
            step(0, 'root', 2, 80), step(2, 'third', 2, 75),
          ],
          swing: 0,
        },
        woodwinds: {
          steps: [
            step(0.5, 'fifth', 1, 75), step(2, 'seventh', 1.5, 70),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 60), drum(1, 'snare', 55),
            drum(2, 'kick', 60), drum(3, 'snare', 55),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 50)),
          ],
          swing: 0.6,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'classical', 'third-stream', 'fusion', 'chamber'],
  icon: '🎻',
};

/**
 * West Coast Jazz style - cool relaxed
 */
const WEST_COAST_JAZZ_STYLE: ArrangerStyle = {
  id: 'west-coast-jazz',
  name: 'West Coast Jazz',
  category: 'Jazz',
  subcategory: 'Cool',
  description: 'Cool, laid-back West Coast style',
  tempoRange: { min: 120, max: 150 },
  defaultTempo: 135,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [65, 80] }),
    voice('drums', 'light-jazz-kit', { velocityRange: [60, 75] }),
    voice('piano', 'piano', { octave: 4, velocityRange: [70, 85] }),
    voice('sax', 'alto-sax', { octave: 4, velocityRange: [70, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Cool swing',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 75), step(0.5, 'fifth', 0.5, 70),
            step(1, 'third', 0.5, 75), step(1.5, 'root', 0.5, 70),
            step(2, 'seventh', 0.5, 75), step(2.5, 'fifth', 0.5, 70),
            step(3, 'third', 0.5, 75), step(3.5, 'root', 0.5, 70),
          ],
          swing: 0.6,
        },
        piano: {
          steps: [
            step(0, 'root', 0.5, 80), step(1, 'third', 0.5, 75),
            step(2, 'fifth', 0.5, 80), step(3, 'seventh', 0.5, 75),
          ],
          swing: 0.6,
        },
        sax: {
          steps: [
            step(0.5, 'third', 1, 80), step(2, 'fifth', 1.5, 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 70), drum(0.67, 'snare', 65),
            drum(1.33, 'kick', 65), drum(2, 'snare', 70),
            drum(2.67, 'kick', 65), drum(3.33, 'snare', 68),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'ride', 65)),
          ],
          swing: 0.6,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'west-coast', 'cool', 'relaxed', 'mulligan'],
  icon: '🎷',
};

/**
 * Post-Bop style - modern harmony
 */
const POST_BOP_STYLE: ArrangerStyle = {
  id: 'post-bop',
  name: 'Post-Bop',
  category: 'Jazz',
  subcategory: 'Modern',
  description: 'Modern jazz with complex harmony',
  tempoRange: { min: 140, max: 170 },
  defaultTempo: 155,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [75, 90] }),
    voice('drums', 'jazz-kit', { velocityRange: [70, 85] }),
    voice('piano', 'piano', { octave: 4, velocityRange: [75, 90] }),
    voice('sax', 'tenor-sax', { octave: 4, velocityRange: [80, 95] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Modern swing',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 85), step(0.5, 'third', 0.5, 80),
            step(1, 'fifth', 0.5, 85), step(1.5, 'seventh', 0.5, 80),
            step(2, 'ninth', 0.5, 85), step(2.5, 'fifth', 0.5, 80),
            step(3, 'third', 0.5, 85), step(3.5, 'root', 0.5, 80),
          ],
          swing: 0.65,
        },
        piano: {
          steps: [
            step(0, 'root', 0.33, 85), step(0.67, 'third', 0.33, 80),
            step(1, 'seventh', 0.33, 85), step(1.67, 'ninth', 0.33, 80),
            step(2, 'fifth', 0.33, 85), step(2.67, 'root', 0.33, 80),
            step(3, 'third', 0.33, 85), step(3.67, 'seventh', 0.33, 80),
          ],
          swing: 0.65,
        },
        sax: {
          steps: [
            step(0.5, 'fifth', 0.5, 90), step(1.5, 'seventh', 1, 85),
            step(3, 'ninth', 0.5, 90),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 80), drum(0.67, 'snare', 75),
            drum(1.33, 'kick', 75), drum(2, 'snare', 85),
            drum(2.67, 'kick', 75), drum(3.33, 'snare', 80),
            ...Array.from({ length: 12 }, (_, i) => drum(i * 0.33, 'ride', 75)),
          ],
          swing: 0.65,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'post-bop', 'modern', 'complex', 'coltrane'],
  icon: '🎷',
};

/**
 * Vocal Jazz Trio style - intimate backing
 */
const VOCAL_JAZZ_TRIO_STYLE: ArrangerStyle = {
  id: 'vocal-jazz-trio',
  name: 'Vocal Jazz Trio',
  category: 'Jazz',
  subcategory: 'Vocal',
  description: 'Intimate trio backing for vocals',
  tempoRange: { min: 85, max: 115 },
  defaultTempo: 100,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'acoustic-bass', { octave: 2, velocityRange: [60, 75] }),
    voice('drums', 'brushes-kit', { velocityRange: [50, 65] }),
    voice('piano', 'piano', { octave: 4, velocityRange: [65, 80] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Sparse accompaniment',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 1, 70), step(1, 'fifth', 1, 65),
            step(2, 'third', 1, 70), step(3, 'seventh', 1, 65),
          ],
          swing: 0.6,
        },
        piano: {
          steps: [
            step(0.5, 'root', 0.75, 75), step(2, 'fifth', 1, 70),
            step(3.5, 'third', 0.5, 75),
          ],
          swing: 0.6,
        },
        drums: {
          steps: [
            drum(0, 'kick', 60), drum(2, 'kick', 55),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'ride', 55)),
          ],
          swing: 0.6,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['jazz', 'vocal', 'trio', 'intimate', 'sparse'],
  icon: '🎤',
};

/**
 * Tech House style - minimal groove
 */
const TECH_HOUSE_NEW_STYLE: ArrangerStyle = {
  id: 'tech-house-new',
  name: 'Tech House Minimal',
  category: 'Electronic',
  subcategory: 'House',
  description: 'Minimal groovy tech house',
  tempoRange: { min: 120, max: 130 },
  defaultTempo: 125,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [85, 100] }),
    voice('drums', 'electronic-kit', { velocityRange: [90, 105] }),
    voice('perc', 'percussion', { velocityRange: [70, 85] }),
    voice('keys', 'synth-pad', { octave: 4, velocityRange: [60, 75] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Minimal groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.25, 95), step(0.75, 'fifth', 0.25, 85),
            step(2, 'root', 0.25, 95), step(2.75, 'third', 0.25, 85),
          ],
          swing: 0,
        },
        keys: {
          steps: [
            step(0, 'root', 4, 70),
          ],
          swing: 0,
        },
        perc: {
          steps: [
            drum(0.5, 'shaker', 75), drum(1, 'shaker', 70),
            drum(1.5, 'shaker', 75), drum(2, 'shaker', 70),
            drum(2.5, 'shaker', 75), drum(3, 'shaker', 70),
            drum(3.5, 'shaker', 75),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 100), drum(1, 'kick', 95), 
            drum(2, 'kick', 100), drum(3, 'kick', 95),
            drum(0.5, 'clap', 90), drum(2.5, 'clap', 90),
            ...Array.from({ length: 8 }, (_, i) => drum(i * 0.5, 'hihat-closed', 80)),
            drum(1.5, 'hihat-open', 85), drum(3.5, 'hihat-open', 85),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electronic', 'tech-house', 'minimal', 'groove', 'club'],
  icon: '🎛️',
};

/**
 * Progressive House style - building pads
 */
const PROGRESSIVE_HOUSE_NEW_STYLE: ArrangerStyle = {
  id: 'progressive-house-new',
  name: 'Progressive House Modern',
  category: 'Electronic',
  subcategory: 'House',
  description: 'Modern progressive house with builds',
  tempoRange: { min: 124, max: 132 },
  defaultTempo: 128,
  timeSignature: { numerator: 4, denominator: 4 },
  voices: [
    voice('bass', 'synth-bass', { octave: 2, velocityRange: [90, 105] }),
    voice('drums', 'electronic-kit', { velocityRange: [95, 110] }),
    voice('lead', 'synth-lead', { octave: 5, velocityRange: [85, 100] }),
    voice('pad', 'synth-pad', { octave: 4, velocityRange: [70, 85] }),
  ],
  variations: [
    {
      name: 'A',
      description: 'Progressive groove',
      voices: {
        bass: {
          steps: [
            step(0, 'root', 0.5, 100), step(0.5, 'fifth', 0.5, 90),
            step(1, 'root', 0.5, 100), step(1.5, 'octave', 0.5, 90),
            step(2, 'root', 0.5, 100), step(2.5, 'fifth', 0.5, 90),
            step(3, 'root', 0.5, 100), step(3.5, 'third', 0.5, 90),
          ],
          swing: 0,
        },
        lead: {
          steps: [
            step(0, 'root', 0.25, 95), step(0.5, 'third', 0.25, 90),
            step(1, 'fifth', 0.5, 95), step(2, 'seventh', 0.75, 90),
            step(3, 'octave', 0.5, 95),
          ],
          swing: 0,
        },
        pad: {
          steps: [
            step(0, 'root', 4, 80),
          ],
          swing: 0,
        },
        drums: {
          steps: [
            drum(0, 'kick', 105), drum(1, 'kick', 100), 
            drum(2, 'kick', 105), drum(3, 'kick', 100),
            drum(1, 'clap', 95), drum(3, 'clap', 95),
            ...Array.from({ length: 16 }, (_, i) => drum(i * 0.25, 'hihat-closed', 85)),
            drum(1.75, 'hihat-open', 90), drum(3.75, 'hihat-open', 90),
          ],
          swing: 0,
        },
      },
    },
  ],
  intros: [],
  endings: [],
  fills: [],
  breaks: [],
  tags: ['electronic', 'progressive-house', 'building', 'pads', 'melodic'],
  icon: '🎹',
};

// ============================================================================
// STYLE REGISTRY
// ============================================================================

/**
 * All built-in arranger styles
 */
export const ARRANGER_STYLES: readonly ArrangerStyle[] = [
  // Classical/Orchestral styles
  STRING_QUARTET_STYLE,
  ORCHESTRAL_BALLAD_STYLE,
  CINEMATIC_EPIC_STYLE,
  CINEMATIC_TENSE_STYLE,
  BAROQUE_STYLE,
  BAROQUE_CONTINUO_STYLE,
  CLASSICAL_PERIOD_STYLE,
  ROMANTIC_STYLE,
  ROMANTIC_ERA_STYLE,
  IMPRESSIONIST_STYLE,
  MINIMALIST_STYLE,
  MINIMALIST_PIANO_STYLE,
  FILM_SCORE_EPIC_STYLE,
  FILM_SCORE_EMOTIONAL_STYLE,
  CHAMBER_MUSIC_STYLE,
  CHORAL_STYLE,
  CONTEMPORARY_CLASSICAL_STYLE,
  
  // Pop styles
  POP_8BEAT_STYLE,
  POP_16BEAT_STYLE,
  POP_BALLAD_STYLE,
  ACOUSTIC_POP_STYLE,
  MODERN_POP_STYLE,
  POP_ROCK_ANTHEM_STYLE,
  POP_SHUFFLE_STYLE,
  
  // Rock styles
  HARD_ROCK_STYLE,
  CLASSIC_ROCK_STYLE,
  SOFT_ROCK_STYLE,
  SOFT_ROCK_70S_STYLE,
  POWER_BALLAD_STYLE,
  POWER_BALLAD_NEW_STYLE,
  INDIE_ROCK_STYLE,
  INDIE_ROCK_NEW_STYLE,
  PROGRESSIVE_ROCK_STYLE,
  PUNK_ROCK_STYLE,
  PUNK_ROCK_NEW_STYLE,
  GRUNGE_ROCK_STYLE,
  ALT_ROCK_GRUNGE_STYLE,
  ALTERNATIVE_ROCK_STYLE,
  ARENA_ROCK_STYLE,
  BRITPOP_STYLE,
  SURF_ROCK_STYLE,
  POST_PUNK_STYLE,
  NEW_WAVE_STYLE,
  GLAM_ROCK_STYLE,
  GARAGE_ROCK_STYLE,
  PSYCHEDELIC_ROCK_STYLE,
  SOUTHERN_ROCK_STYLE,
  POP_PUNK_STYLE,
  
  // Blues styles
  BLUES_SHUFFLE_STYLE,
  SLOW_BLUES_STYLE,
  CHICAGO_BLUES_STYLE,
  DELTA_BLUES_STYLE,
  TEXAS_BLUES_STYLE,
  JUMP_BLUES_STYLE,
  BLUES_ROCK_STYLE,
  ELECTRIC_BLUES_STYLE,
  BOOGIE_WOOGIE_STYLE,
  
  // Jazz styles
  JAZZ_SWING_STYLE,
  JAZZ_BALLAD_STYLE,
  JAZZ_FUNK_STYLE,
  BEBOP_STYLE,
  BOSSA_NOVA_STYLE,
  BOSSA_MODERN_STYLE,
  SWING_FAST_STYLE,
  SWING_SLOW_STYLE,
  LATIN_JAZZ_STYLE,
  HARD_BOP_STYLE,
  FREE_JAZZ_STYLE,
  GYPSY_JAZZ_STYLE,
  ACID_JAZZ_STYLE,
  NU_JAZZ_STYLE,
  JAZZ_FUSION_STYLE,
  STRIDE_PIANO_STYLE,
  THIRD_STREAM_STYLE,
  WEST_COAST_JAZZ_STYLE,
  POST_BOP_STYLE,
  VOCAL_JAZZ_TRIO_STYLE,
  
  // Latin styles
  SALSA_STYLE,
  SON_CUBANO_STYLE,
  MAMBO_STYLE,
  CHA_CHA_CHA_STYLE,
  BOLERO_STYLE,
  TANGO_STYLE,
  MILONGA_STYLE,
  SAMBA_STYLE,
  MPB_STYLE,
  FORRO_STYLE,
  BAIAO_STYLE,
  RUMBA_STYLE,
  GUARACHA_STYLE,
  REGGAE_STYLE,
  DUB_STYLE,
  DANCEHALL_STYLE,
  SKA_STYLE,
  
  // Electronic styles
  HOUSE_STYLE,
  DEEP_HOUSE_STYLE,
  TECH_HOUSE_STYLE,
  TECH_HOUSE_NEW_STYLE,
  PROGRESSIVE_HOUSE_STYLE,
  PROGRESSIVE_HOUSE_NEW_STYLE,
  TROPICAL_HOUSE_STYLE,
  FUTURE_HOUSE_STYLE,
  ELECTRO_HOUSE_STYLE,
  ELECTRO_POP_STYLE,
  SYNTHWAVE_STYLE,
  FUTURE_BASS_STYLE,
  TECHNO_STYLE,
  MINIMAL_TECHNO_STYLE,
  DETROIT_TECHNO_STYLE,
  INDUSTRIAL_TECHNO_STYLE,
  MELODIC_TECHNO_STYLE,
  TRANCE_STYLE,
  PSYTRANCE_STYLE,
  GOA_TRANCE_STYLE,
  HARDSTYLE_STYLE,
  GABBER_STYLE,
  DRUM_AND_BASS_STYLE,
  LIQUID_DNB_STYLE,
  JUNGLE_STYLE,
  DUBSTEP_STYLE,
  BREAKBEAT_STYLE,
  CHILLOUT_STYLE,
  VAPORWAVE_STYLE,
  CHILLWAVE_STYLE,
  
  // Ambient/Experimental styles
  DARK_AMBIENT_STYLE,
  SPACE_AMBIENT_STYLE,
  NEW_AGE_STYLE,
  DRONE_STYLE,
  GLITCH_STYLE,
  IDM_STYLE,
  NOISE_STYLE,
  FIELD_RECORDING_STYLE,
  MUSIQUE_CONCRETE_STYLE,
  GENERATIVE_STYLE,
  
  LOFI_HIPHOP_STYLE,
  LOFI_BEAT_STYLE,
  TRAP_STYLE,
  TRAP_BEAT_STYLE,
  
  // Hip Hop/Urban styles
  BOOM_BAP_STYLE,
  WEST_COAST_GFUNK_STYLE,
  TRAP_ATLANTA_STYLE,
  DRILL_STYLE,
  UK_DRILL_STYLE,
  CLOUD_RAP_STYLE,
  MEMPHIS_PHONK_STYLE,
  OLD_SCHOOL_HIPHOP_STYLE,
  CONSCIOUS_HIPHOP_STYLE,
  SOUTHERN_CRUNK_STYLE,
  HYPHY_STYLE,
  TRIP_HOP_STYLE,
  UK_GARAGE_STYLE,
  GRIME_STYLE,
  ABSTRACT_HIPHOP_STYLE,
  
  // R&B/Soul styles
  CLASSIC_SOUL_STYLE,
  NORTHERN_SOUL_STYLE,
  NEO_SOUL_STYLE,
  NINETIES_RNB_STYLE,
  MODERN_RNB_STYLE,
  SLOW_JAM_STYLE,
  NEW_JACK_SWING_STYLE,
  QUIET_STORM_STYLE,
  GOSPEL_STYLE,
  GOSPEL_BALLAD_STYLE,
  GOSPEL_TRADITIONAL_STYLE,
  GOSPEL_CONTEMPORARY_STYLE,
  GOSPEL_CHOIR_STYLE,
  PHILLY_SOUL_STYLE,
  MEMPHIS_SOUL_STYLE,
  CHICAGO_SOUL_STYLE,
  BLUE_EYED_SOUL_STYLE,
  SOUL_BALLAD_STYLE,
  FUNK_STYLE,
  PFUNK_STYLE,
  P_FUNK_STYLE,
  FUNK_ROCK_STYLE,
  FUNK_CLASSIC_STYLE,
  DISCO_STYLE,
  NU_DISCO_STYLE,
  BOOGIE_STYLE,
  SYNTH_FUNK_STYLE,
  
  // Country/Folk styles
  COUNTRY_POP_STYLE,
  COUNTRY_ROCK_STYLE,
  COUNTRY_BALLAD_STYLE,
  COUNTRY_WALTZ_STYLE,
  HONKY_TONK_STYLE,
  MODERN_COUNTRY_STYLE,
  OUTLAW_COUNTRY_STYLE,
  COUNTRY_SWING_STYLE,
  AMERICANA_STYLE,
  COUNTRY_TRAIN_BEAT_STYLE,
  OLD_TIME_STYLE,
  ALT_COUNTRY_STYLE,
  FOLK_ACOUSTIC_STYLE,
  FOLK_ROCK_STYLE,
  BLUEGRASS_STYLE,
  CELTIC_STYLE,
  CAJUN_STYLE,
  ZYDECO_STYLE,
  
  // World styles
  AFROBEAT_STYLE,
  HIGHLIFE_STYLE,
  SOUKOUS_STYLE,
  ZOUK_STYLE,
  CALYPSO_STYLE,
  FLAMENCO_STYLE,
  FLAMENCO_RUMBA_STYLE,
];

/**
 * Get style by ID
 */
export function getArrangerStyle(id: string): ArrangerStyle | undefined {
  return ARRANGER_STYLES.find(s => s.id === id);
}

/**
 * Get styles by category
 */
export function getStylesByCategory(category: string): readonly ArrangerStyle[] {
  return ARRANGER_STYLES.filter(s => s.category === category);
}

/**
 * Search styles by name or tags
 */
export function searchStyles(query: string): readonly ArrangerStyle[] {
  const lowerQuery = query.toLowerCase();
  return ARRANGER_STYLES.filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
    s.category.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// EZ KEYS-INSPIRED FEATURES
// ============================================================================

/**
 * Song part type (EZ Keys-style presets)
 */
export type SongPartPreset = 
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'post-chorus'
  | 'bridge'
  | 'breakdown'
  | 'buildup'
  | 'drop'
  | 'outro'
  | 'solo'
  | 'instrumental';

/**
 * Song part configuration
 */
export interface SongPartConfig {
  /** Part type */
  readonly type: SongPartPreset;
  /** Energy level 1-5 */
  readonly energy: 1 | 2 | 3 | 4 | 5;
  /** Rhythmic complexity (0-1) */
  readonly complexity: number;
  /** Which voices are active */
  readonly activeVoices: readonly string[];
  /** Variation to use (A/B/C/D) */
  readonly variation: 'A' | 'B' | 'C' | 'D';
}

/**
 * Default song part configurations
 */
export const SONG_PART_CONFIGS: Record<SongPartPreset, SongPartConfig> = {
  'intro': { type: 'intro', energy: 2, complexity: 0.3, activeVoices: ['piano', 'pad'], variation: 'A' },
  'verse': { type: 'verse', energy: 2, complexity: 0.4, activeVoices: ['bass', 'drums', 'piano'], variation: 'A' },
  'pre-chorus': { type: 'pre-chorus', energy: 3, complexity: 0.5, activeVoices: ['bass', 'drums', 'piano', 'pad'], variation: 'B' },
  'chorus': { type: 'chorus', energy: 4, complexity: 0.6, activeVoices: ['bass', 'drums', 'piano', 'pad', 'strings'], variation: 'C' },
  'post-chorus': { type: 'post-chorus', energy: 4, complexity: 0.5, activeVoices: ['bass', 'drums', 'piano', 'pad'], variation: 'C' },
  'bridge': { type: 'bridge', energy: 3, complexity: 0.4, activeVoices: ['bass', 'piano', 'strings'], variation: 'B' },
  'breakdown': { type: 'breakdown', energy: 1, complexity: 0.2, activeVoices: ['pad'], variation: 'A' },
  'buildup': { type: 'buildup', energy: 3, complexity: 0.7, activeVoices: ['drums', 'synth', 'pad'], variation: 'B' },
  'drop': { type: 'drop', energy: 5, complexity: 0.8, activeVoices: ['bass', 'drums', 'synth', 'pad'], variation: 'D' },
  'outro': { type: 'outro', energy: 2, complexity: 0.3, activeVoices: ['piano', 'pad', 'strings'], variation: 'A' },
  'solo': { type: 'solo', energy: 4, complexity: 0.5, activeVoices: ['bass', 'drums', 'piano'], variation: 'C' },
  'instrumental': { type: 'instrumental', energy: 3, complexity: 0.5, activeVoices: ['bass', 'drums', 'piano', 'pad'], variation: 'B' },
};

/**
 * Energy level configuration (1-5 intensity)
 */
export interface EnergyLevelConfig {
  /** Level number 1-5 */
  readonly level: number;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Velocity multiplier */
  readonly velocityMultiplier: number;
  /** Note density multiplier */
  readonly densityMultiplier: number;
  /** Voices to include at this level */
  readonly voiceCount: number;
}

/**
 * Energy level presets
 */
export const ENERGY_LEVELS: readonly EnergyLevelConfig[] = [
  { level: 1, name: 'Minimal', description: 'Sparse, quiet', velocityMultiplier: 0.5, densityMultiplier: 0.3, voiceCount: 2 },
  { level: 2, name: 'Light', description: 'Gentle, understated', velocityMultiplier: 0.7, densityMultiplier: 0.5, voiceCount: 3 },
  { level: 3, name: 'Medium', description: 'Balanced, moderate', velocityMultiplier: 0.85, densityMultiplier: 0.7, voiceCount: 4 },
  { level: 4, name: 'Full', description: 'Strong, driving', velocityMultiplier: 1.0, densityMultiplier: 0.9, voiceCount: 5 },
  { level: 5, name: 'Maximum', description: 'Intense, powerful', velocityMultiplier: 1.15, densityMultiplier: 1.0, voiceCount: 6 },
];

/**
 * Voicing style (chord voicing configuration)
 */
export type VoicingStyleType = 
  | 'close'       // Close position (all notes within octave)
  | 'open'        // Open position (spread across octaves)
  | 'drop2'       // Drop 2 voicing (2nd voice dropped octave)
  | 'drop3'       // Drop 3 voicing (3rd voice dropped octave)
  | 'drop24'      // Drop 2+4 voicing
  | 'rootless'    // Rootless voicing (no root, common in jazz)
  | 'quartal'     // Quartal harmony (stacked 4ths)
  | 'shell'       // Shell voicing (root, 3rd, 7th only)
  | 'spread';     // Wide spread across keyboard

/**
 * Voicing style configuration
 */
export interface VoicingStyleConfig {
  /** Style type */
  readonly type: VoicingStyleType;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Minimum spread in semitones */
  readonly minSpread: number;
  /** Maximum spread in semitones */
  readonly maxSpread: number;
  /** Whether to include bass note */
  readonly includeBass: boolean;
  /** Which extensions to include */
  readonly extensions: readonly ('7th' | '9th' | '11th' | '13th')[];
}

/**
 * Voicing style presets
 */
export const VOICING_STYLES: Record<VoicingStyleType, VoicingStyleConfig> = {
  'close': { type: 'close', name: 'Close', description: 'Compact voicing', minSpread: 3, maxSpread: 12, includeBass: true, extensions: [] },
  'open': { type: 'open', name: 'Open', description: 'Spread voicing', minSpread: 12, maxSpread: 24, includeBass: true, extensions: [] },
  'drop2': { type: 'drop2', name: 'Drop 2', description: 'Jazz drop 2', minSpread: 10, maxSpread: 19, includeBass: true, extensions: ['7th'] },
  'drop3': { type: 'drop3', name: 'Drop 3', description: 'Jazz drop 3', minSpread: 12, maxSpread: 22, includeBass: true, extensions: ['7th'] },
  'drop24': { type: 'drop24', name: 'Drop 2+4', description: 'Wide jazz voicing', minSpread: 15, maxSpread: 26, includeBass: true, extensions: ['7th', '9th'] },
  'rootless': { type: 'rootless', name: 'Rootless', description: 'No root, jazz piano', minSpread: 7, maxSpread: 14, includeBass: false, extensions: ['7th', '9th'] },
  'quartal': { type: 'quartal', name: 'Quartal', description: 'Stacked 4ths', minSpread: 10, maxSpread: 20, includeBass: false, extensions: [] },
  'shell': { type: 'shell', name: 'Shell', description: 'Root, 3rd, 7th', minSpread: 6, maxSpread: 14, includeBass: true, extensions: ['7th'] },
  'spread': { type: 'spread', name: 'Spread', description: 'Very wide', minSpread: 20, maxSpread: 36, includeBass: true, extensions: ['7th', '9th'] },
};

/**
 * Bass line style (LiquidNotes-inspired)
 */
export type BassLineStyle = 
  | 'root'           // Simple root notes
  | 'walking'        // Jazz walking bass
  | 'pedal'          // Pedal point (sustained note)
  | 'counterpoint'   // Countermelody
  | 'octave'         // Octave jumps
  | 'arpeggiated'    // Arpeggio patterns
  | 'syncopated'     // Funk-style syncopation
  | 'slap';          // Slap bass patterns

/**
 * Bass line style configuration
 */
export interface BassLineStyleConfig {
  /** Style type */
  readonly type: BassLineStyle;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Typical note density (notes per bar) */
  readonly density: number;
  /** Uses chord tones only */
  readonly chordTonesOnly: boolean;
  /** Typical genres */
  readonly genres: readonly string[];
}

/**
 * Bass line style presets
 */
export const BASS_LINE_STYLES: Record<BassLineStyle, BassLineStyleConfig> = {
  'root': { type: 'root', name: 'Root', description: 'Simple root notes on downbeats', density: 2, chordTonesOnly: true, genres: ['pop', 'rock', 'country'] },
  'walking': { type: 'walking', name: 'Walking', description: 'Quarter note walking bass', density: 4, chordTonesOnly: false, genres: ['jazz', 'swing', 'blues'] },
  'pedal': { type: 'pedal', name: 'Pedal', description: 'Sustained pedal point', density: 1, chordTonesOnly: true, genres: ['classical', 'ambient', 'drone'] },
  'counterpoint': { type: 'counterpoint', name: 'Counterpoint', description: 'Melodic counterpoint', density: 4, chordTonesOnly: false, genres: ['baroque', 'jazz'] },
  'octave': { type: 'octave', name: 'Octave', description: 'Root-octave pattern', density: 4, chordTonesOnly: true, genres: ['rock', 'pop', 'dance'] },
  'arpeggiated': { type: 'arpeggiated', name: 'Arpeggiated', description: 'Arpeggio patterns', density: 8, chordTonesOnly: true, genres: ['electronic', 'new-wave'] },
  'syncopated': { type: 'syncopated', name: 'Syncopated', description: 'Funk syncopation', density: 6, chordTonesOnly: false, genres: ['funk', 'rnb', 'disco'] },
  'slap': { type: 'slap', name: 'Slap', description: 'Slap bass technique', density: 8, chordTonesOnly: false, genres: ['funk', 'disco', 'rock'] },
};

// ============================================================================
// ARRANGER REAL-TIME CONTROLS
// ============================================================================

/**
 * Real-time arranger control types
 */
export type ArrangerControlType = 
  | 'syncStart'
  | 'syncStop'
  | 'tapTempo'
  | 'variationUp'
  | 'variationDown'
  | 'fillNow'
  | 'intro'
  | 'ending'
  | 'break'
  | 'bassInversion'
  | 'octaveUp'
  | 'octaveDown'
  | 'tempoLock'
  | 'chordMemory'
  | 'splitPoint';

/**
 * Real-time control configuration
 */
export interface ArrangerControl {
  /** Control type */
  readonly type: ArrangerControlType;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Default keyboard shortcut */
  readonly shortcut?: string;
  /** Is momentary (held) or toggle */
  readonly momentary: boolean;
  /** Icon emoji */
  readonly icon: string;
}

/**
 * All arranger real-time controls
 */
export const ARRANGER_CONTROLS: Record<ArrangerControlType, ArrangerControl> = {
  'syncStart': { type: 'syncStart', name: 'Sync Start', description: 'Start on first chord played', shortcut: 'Space', momentary: false, icon: '▶️' },
  'syncStop': { type: 'syncStop', name: 'Sync Stop', description: 'Stop when keys released', shortcut: 'Shift+Space', momentary: false, icon: '⏹️' },
  'tapTempo': { type: 'tapTempo', name: 'Tap Tempo', description: 'Set tempo by tapping', shortcut: 'T', momentary: true, icon: '👆' },
  'variationUp': { type: 'variationUp', name: 'Variation +', description: 'Next variation (A→B→C→D)', shortcut: 'Up', momentary: true, icon: '⬆️' },
  'variationDown': { type: 'variationDown', name: 'Variation -', description: 'Previous variation (D→C→B→A)', shortcut: 'Down', momentary: true, icon: '⬇️' },
  'fillNow': { type: 'fillNow', name: 'Fill', description: 'Trigger fill immediately', shortcut: 'F', momentary: true, icon: '🥁' },
  'intro': { type: 'intro', name: 'Intro', description: 'Trigger intro section', shortcut: 'I', momentary: true, icon: '🎬' },
  'ending': { type: 'ending', name: 'Ending', description: 'Trigger ending section', shortcut: 'E', momentary: true, icon: '🔚' },
  'break': { type: 'break', name: 'Break', description: 'Stop rhythm, hold chord', shortcut: 'B', momentary: true, icon: '⏸️' },
  'bassInversion': { type: 'bassInversion', name: 'Bass Note', description: 'Force specific bass note', shortcut: 'Shift+B', momentary: true, icon: '🎸' },
  'octaveUp': { type: 'octaveUp', name: 'Octave +', description: 'Transpose up one octave', shortcut: 'Shift+Up', momentary: true, icon: '🔼' },
  'octaveDown': { type: 'octaveDown', name: 'Octave -', description: 'Transpose down one octave', shortcut: 'Shift+Down', momentary: true, icon: '🔽' },
  'tempoLock': { type: 'tempoLock', name: 'Tempo Lock', description: 'Prevent tempo changes', momentary: false, icon: '🔒' },
  'chordMemory': { type: 'chordMemory', name: 'Chord Hold', description: 'Hold chord after release', shortcut: 'H', momentary: false, icon: '📌' },
  'splitPoint': { type: 'splitPoint', name: 'Split Point', description: 'Set chord detection zone', shortcut: 'S', momentary: true, icon: '✂️' },
};

/**
 * Arranger control state
 */
export interface ArrangerControlState {
  /** Sync start enabled */
  readonly syncStart: boolean;
  /** Sync stop enabled */
  readonly syncStop: boolean;
  /** Tempo lock enabled */
  readonly tempoLock: boolean;
  /** Chord memory enabled */
  readonly chordMemory: boolean;
  /** Current split point (MIDI note) */
  readonly splitPoint: number;
  /** Current octave offset */
  readonly octaveOffset: number;
  /** Forced bass note (MIDI note or null) */
  readonly forcedBassNote: number | null;
  /** Current held chord notes */
  readonly heldChordNotes: readonly number[];
  /** Tap tempo timestamps */
  readonly tapTimestamps: readonly number[];
}

/**
 * Create default control state
 */
export function createArrangerControlState(): ArrangerControlState {
  return Object.freeze({
    syncStart: true,
    syncStop: false,
    tempoLock: false,
    chordMemory: false,
    splitPoint: 60, // Middle C
    octaveOffset: 0,
    forcedBassNote: null,
    heldChordNotes: [],
    tapTimestamps: [],
  });
}

/**
 * Control command for real-time interaction
 */
export type ArrangerControlCommand = 
  | { type: 'toggleSyncStart' }
  | { type: 'toggleSyncStop' }
  | { type: 'toggleTempoLock' }
  | { type: 'toggleChordMemory' }
  | { type: 'tapTempo'; timestamp: number }
  | { type: 'variationUp' }
  | { type: 'variationDown' }
  | { type: 'triggerFill' }
  | { type: 'triggerIntro' }
  | { type: 'triggerEnding' }
  | { type: 'triggerBreak' }
  | { type: 'setSplitPoint'; note: number }
  | { type: 'octaveUp' }
  | { type: 'octaveDown' }
  | { type: 'forceBassNote'; note: number | null }
  | { type: 'updateHeldNotes'; notes: readonly number[] };

/**
 * Process control command
 */
export function processArrangerControlCommand(
  state: ArrangerControlState,
  command: ArrangerControlCommand
): ArrangerControlState {
  switch (command.type) {
    case 'toggleSyncStart':
      return { ...state, syncStart: !state.syncStart };
    case 'toggleSyncStop':
      return { ...state, syncStop: !state.syncStop };
    case 'toggleTempoLock':
      return { ...state, tempoLock: !state.tempoLock };
    case 'toggleChordMemory':
      return { ...state, chordMemory: !state.chordMemory };
    case 'tapTempo': {
      const taps = [...state.tapTimestamps, command.timestamp].slice(-4);
      return { ...state, tapTimestamps: taps };
    }
    case 'variationUp':
    case 'variationDown':
    case 'triggerFill':
    case 'triggerIntro':
    case 'triggerEnding':
    case 'triggerBreak':
      // These affect ArrangerState, not control state
      return state;
    case 'setSplitPoint':
      return { ...state, splitPoint: Math.max(0, Math.min(127, command.note)) };
    case 'octaveUp':
      return { ...state, octaveOffset: Math.min(2, state.octaveOffset + 1) };
    case 'octaveDown':
      return { ...state, octaveOffset: Math.max(-2, state.octaveOffset - 1) };
    case 'forceBassNote':
      return { ...state, forcedBassNote: command.note };
    case 'updateHeldNotes':
      return { ...state, heldChordNotes: command.notes };
    default:
      return state;
  }
}

/**
 * Calculate tempo from tap timestamps
 */
export function calculateTapTempo(timestamps: readonly number[]): number | null {
  if (timestamps.length < 2) return null;
  
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const current = timestamps[i];
    const prev = timestamps[i - 1];
    if (current !== undefined && prev !== undefined) {
      intervals.push(current - prev);
    }
  }
  
  if (intervals.length === 0) return null;
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = 60000 / avgInterval;
  
  // Clamp to reasonable range
  return Math.max(40, Math.min(240, Math.round(bpm)));
}

// ============================================================================
// INSTRUMENT SWITCHER
// ============================================================================

/**
 * Instrument category for switching
 */
export type InstrumentCategory = 
  | 'bass'
  | 'drums'
  | 'piano'
  | 'organ'
  | 'guitar'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'synth'
  | 'pad'
  | 'lead'
  | 'percussion';

/**
 * Instrument definition for switching
 */
export interface InstrumentOption {
  /** Unique ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Category */
  readonly category: InstrumentCategory;
  /** MIDI program number (0-127) */
  readonly program: number;
  /** MIDI bank MSB */
  readonly bankMSB?: number;
  /** MIDI bank LSB */
  readonly bankLSB?: number;
  /** Description */
  readonly description: string;
  /** Icon emoji */
  readonly icon: string;
  /** Tags for search */
  readonly tags: readonly string[];
}

/**
 * Factory instrument options per category
 */
export const INSTRUMENT_OPTIONS: Record<InstrumentCategory, readonly InstrumentOption[]> = {
  bass: [
    { id: 'acoustic-bass', name: 'Acoustic Bass', category: 'bass', program: 32, description: 'Upright acoustic bass', icon: '🎻', tags: ['acoustic', 'jazz', 'classical'] },
    { id: 'fingered-bass', name: 'Fingered Bass', category: 'bass', program: 33, description: 'Electric fingered bass', icon: '🎸', tags: ['electric', 'rock', 'pop'] },
    { id: 'picked-bass', name: 'Picked Bass', category: 'bass', program: 34, description: 'Electric picked bass', icon: '🎸', tags: ['electric', 'rock', 'punk'] },
    { id: 'fretless-bass', name: 'Fretless Bass', category: 'bass', program: 35, description: 'Fretless electric bass', icon: '🎸', tags: ['electric', 'jazz', 'fusion'] },
    { id: 'slap-bass', name: 'Slap Bass', category: 'bass', program: 36, description: 'Slap bass technique', icon: '🎸', tags: ['electric', 'funk', 'disco'] },
    { id: 'synth-bass', name: 'Synth Bass', category: 'bass', program: 38, description: 'Synthesizer bass', icon: '🎹', tags: ['synth', 'electronic', 'edm'] },
  ],
  drums: [
    { id: 'standard-kit', name: 'Standard Kit', category: 'drums', program: 0, bankMSB: 120, description: 'Standard acoustic drum kit', icon: '🥁', tags: ['acoustic', 'pop', 'rock'] },
    { id: 'room-kit', name: 'Room Kit', category: 'drums', program: 8, bankMSB: 120, description: 'Room ambience kit', icon: '🥁', tags: ['acoustic', 'rock'] },
    { id: 'power-kit', name: 'Power Kit', category: 'drums', program: 16, bankMSB: 120, description: 'Power rock kit', icon: '🥁', tags: ['acoustic', 'rock', 'metal'] },
    { id: 'electronic-kit', name: 'Electronic Kit', category: 'drums', program: 24, bankMSB: 120, description: 'Electronic drum kit', icon: '🎛️', tags: ['electronic', 'edm'] },
    { id: 'jazz-kit', name: 'Jazz Kit', category: 'drums', program: 32, bankMSB: 120, description: 'Jazz brush kit', icon: '🥁', tags: ['acoustic', 'jazz'] },
    { id: 'orchestral-kit', name: 'Orchestral', category: 'drums', program: 48, bankMSB: 120, description: 'Orchestral percussion', icon: '🎼', tags: ['orchestral', 'classical'] },
  ],
  piano: [
    { id: 'acoustic-grand', name: 'Acoustic Grand', category: 'piano', program: 0, description: 'Concert grand piano', icon: '🎹', tags: ['acoustic', 'classical', 'pop'] },
    { id: 'bright-acoustic', name: 'Bright Acoustic', category: 'piano', program: 1, description: 'Bright acoustic piano', icon: '🎹', tags: ['acoustic', 'pop'] },
    { id: 'electric-grand', name: 'Electric Grand', category: 'piano', program: 2, description: 'Electric grand piano', icon: '🎹', tags: ['electric', 'pop', 'jazz'] },
    { id: 'honky-tonk', name: 'Honky Tonk', category: 'piano', program: 3, description: 'Honky tonk piano', icon: '🎹', tags: ['acoustic', 'country', 'blues'] },
    { id: 'rhodes', name: 'Rhodes', category: 'piano', program: 4, description: 'Fender Rhodes', icon: '🎹', tags: ['electric', 'jazz', 'soul'] },
    { id: 'dx-piano', name: 'DX Piano', category: 'piano', program: 5, description: 'FM electric piano', icon: '🎹', tags: ['electric', 'synth', '80s'] },
  ],
  organ: [
    { id: 'drawbar-organ', name: 'Drawbar Organ', category: 'organ', program: 16, description: 'Hammond-style organ', icon: '🎹', tags: ['electric', 'jazz', 'gospel'] },
    { id: 'percussive-organ', name: 'Percussive Organ', category: 'organ', program: 17, description: 'Percussive attack organ', icon: '🎹', tags: ['electric', 'pop'] },
    { id: 'rock-organ', name: 'Rock Organ', category: 'organ', program: 18, description: 'Rock organ with distortion', icon: '🎹', tags: ['electric', 'rock'] },
    { id: 'church-organ', name: 'Church Organ', category: 'organ', program: 19, description: 'Pipe organ', icon: '⛪', tags: ['acoustic', 'classical', 'church'] },
  ],
  guitar: [
    { id: 'nylon-guitar', name: 'Nylon Guitar', category: 'guitar', program: 24, description: 'Classical nylon string', icon: '🎸', tags: ['acoustic', 'classical', 'latin'] },
    { id: 'steel-guitar', name: 'Steel Guitar', category: 'guitar', program: 25, description: 'Acoustic steel string', icon: '🎸', tags: ['acoustic', 'folk', 'country'] },
    { id: 'jazz-guitar', name: 'Jazz Guitar', category: 'guitar', program: 26, description: 'Jazz hollow body', icon: '🎸', tags: ['electric', 'jazz'] },
    { id: 'clean-guitar', name: 'Clean Guitar', category: 'guitar', program: 27, description: 'Clean electric', icon: '🎸', tags: ['electric', 'pop', 'funk'] },
    { id: 'overdriven-guitar', name: 'Overdriven', category: 'guitar', program: 29, description: 'Overdriven electric', icon: '🎸', tags: ['electric', 'rock'] },
    { id: 'distortion-guitar', name: 'Distortion', category: 'guitar', program: 30, description: 'Distorted electric', icon: '🎸', tags: ['electric', 'rock', 'metal'] },
  ],
  strings: [
    { id: 'string-ensemble', name: 'String Ensemble', category: 'strings', program: 48, description: 'Full string section', icon: '🎻', tags: ['orchestral', 'classical', 'pop'] },
    { id: 'slow-strings', name: 'Slow Strings', category: 'strings', program: 49, description: 'Slow attack strings', icon: '🎻', tags: ['orchestral', 'ambient'] },
    { id: 'synth-strings', name: 'Synth Strings', category: 'strings', program: 50, description: 'Synthesized strings', icon: '🎹', tags: ['synth', 'pop', '80s'] },
    { id: 'pizzicato', name: 'Pizzicato', category: 'strings', program: 45, description: 'Plucked strings', icon: '🎻', tags: ['orchestral', 'classical'] },
  ],
  brass: [
    { id: 'trumpet', name: 'Trumpet', category: 'brass', program: 56, description: 'Solo trumpet', icon: '🎺', tags: ['brass', 'jazz', 'orchestral'] },
    { id: 'trombone', name: 'Trombone', category: 'brass', program: 57, description: 'Solo trombone', icon: '🎺', tags: ['brass', 'jazz', 'orchestral'] },
    { id: 'french-horn', name: 'French Horn', category: 'brass', program: 60, description: 'French horn', icon: '📯', tags: ['brass', 'orchestral', 'classical'] },
    { id: 'brass-section', name: 'Brass Section', category: 'brass', program: 61, description: 'Full brass section', icon: '🎺', tags: ['brass', 'jazz', 'funk'] },
    { id: 'synth-brass', name: 'Synth Brass', category: 'brass', program: 62, description: 'Synthesized brass', icon: '🎹', tags: ['synth', 'electronic', '80s'] },
  ],
  woodwinds: [
    { id: 'soprano-sax', name: 'Soprano Sax', category: 'woodwinds', program: 64, description: 'Soprano saxophone', icon: '🎷', tags: ['woodwind', 'jazz'] },
    { id: 'alto-sax', name: 'Alto Sax', category: 'woodwinds', program: 65, description: 'Alto saxophone', icon: '🎷', tags: ['woodwind', 'jazz', 'pop'] },
    { id: 'tenor-sax', name: 'Tenor Sax', category: 'woodwinds', program: 66, description: 'Tenor saxophone', icon: '🎷', tags: ['woodwind', 'jazz', 'rnb'] },
    { id: 'clarinet', name: 'Clarinet', category: 'woodwinds', program: 71, description: 'Clarinet', icon: '🎵', tags: ['woodwind', 'classical', 'jazz'] },
    { id: 'flute', name: 'Flute', category: 'woodwinds', program: 73, description: 'Flute', icon: '🎵', tags: ['woodwind', 'classical', 'world'] },
  ],
  synth: [
    { id: 'lead-square', name: 'Square Lead', category: 'synth', program: 80, description: 'Square wave lead', icon: '🎹', tags: ['synth', 'electronic', 'chiptune'] },
    { id: 'lead-sawtooth', name: 'Sawtooth Lead', category: 'synth', program: 81, description: 'Sawtooth wave lead', icon: '🎹', tags: ['synth', 'electronic', 'trance'] },
    { id: 'lead-calliope', name: 'Calliope', category: 'synth', program: 82, description: 'Calliope lead', icon: '🎹', tags: ['synth', 'electronic'] },
    { id: 'lead-chiff', name: 'Chiff Lead', category: 'synth', program: 83, description: 'Chiff lead', icon: '🎹', tags: ['synth', 'electronic'] },
    { id: 'lead-charang', name: 'Charang', category: 'synth', program: 84, description: 'Charang lead', icon: '🎹', tags: ['synth', 'electronic'] },
  ],
  pad: [
    { id: 'pad-new-age', name: 'New Age', category: 'pad', program: 88, description: 'New age pad', icon: '☁️', tags: ['synth', 'ambient', 'new-age'] },
    { id: 'pad-warm', name: 'Warm Pad', category: 'pad', program: 89, description: 'Warm analog pad', icon: '☁️', tags: ['synth', 'ambient'] },
    { id: 'pad-polysynth', name: 'Polysynth', category: 'pad', program: 90, description: 'Polysynth pad', icon: '☁️', tags: ['synth', 'electronic'] },
    { id: 'pad-choir', name: 'Choir Pad', category: 'pad', program: 91, description: 'Choir voices', icon: '👼', tags: ['synth', 'ambient', 'choir'] },
    { id: 'pad-bowed', name: 'Bowed Pad', category: 'pad', program: 92, description: 'Bowed glass pad', icon: '☁️', tags: ['synth', 'ambient'] },
    { id: 'pad-metallic', name: 'Metallic', category: 'pad', program: 93, description: 'Metallic pad', icon: '☁️', tags: ['synth', 'electronic'] },
  ],
  lead: [
    { id: 'lead-voice', name: 'Voice Lead', category: 'lead', program: 85, description: 'Synth voice lead', icon: '🎤', tags: ['synth', 'vocal'] },
    { id: 'lead-fifths', name: 'Fifths', category: 'lead', program: 86, description: 'Parallel fifths lead', icon: '🎹', tags: ['synth', 'electronic'] },
    { id: 'lead-bass', name: 'Bass & Lead', category: 'lead', program: 87, description: 'Bass and lead combo', icon: '🎹', tags: ['synth', 'electronic'] },
  ],
  percussion: [
    { id: 'timpani', name: 'Timpani', category: 'percussion', program: 47, description: 'Orchestral timpani', icon: '🥁', tags: ['orchestral', 'classical'] },
    { id: 'steel-drums', name: 'Steel Drums', category: 'percussion', program: 114, description: 'Caribbean steel drums', icon: '🪘', tags: ['world', 'caribbean'] },
    { id: 'woodblock', name: 'Woodblock', category: 'percussion', program: 115, description: 'Woodblock', icon: '🪵', tags: ['percussion'] },
    { id: 'taiko-drum', name: 'Taiko', category: 'percussion', program: 116, description: 'Japanese taiko', icon: '🥁', tags: ['world', 'japanese'] },
  ],
};

/**
 * Get instrument options for a category
 */
export function getInstrumentOptions(category: InstrumentCategory): readonly InstrumentOption[] {
  return INSTRUMENT_OPTIONS[category] ?? [];
}

/**
 * Search instruments by name or tag
 */
export function searchInstruments(query: string): readonly InstrumentOption[] {
  const lowerQuery = query.toLowerCase();
  const results: InstrumentOption[] = [];
  
  for (const options of Object.values(INSTRUMENT_OPTIONS)) {
    for (const option of options) {
      if (option.name.toLowerCase().includes(lowerQuery) ||
          option.tags.some(t => t.includes(lowerQuery))) {
        results.push(option);
      }
    }
  }
  
  return results;
}

// ============================================================================
// ARRANGER CARD DEFINITION
// ============================================================================

/**
 * Arranger card metadata for UI rendering
 */
export const ARRANGER_CARD_META = {
  id: 'arranger',
  name: 'Arranger',
  category: 'generators',
  description: 'Auto-accompaniment engine that transforms chords into full arrangements',
  icon: '🎹',
  color: '#6366f1',
  tags: ['arranger', 'accompaniment', 'backing', 'band'],
  
  // UI layout hints
  ui: {
    minWidth: 600,
    minHeight: 400,
    defaultWidth: 800,
    defaultHeight: 500,
    resizable: true,
    panels: ['style', 'controls', 'mixer', 'chord'],
  },
  
  // Port definitions
  ports: {
    inputs: [
      { id: 'midi-in', name: 'MIDI In', type: 'midi', description: 'Chord input from keyboard' },
      { id: 'clock', name: 'Clock', type: 'clock', description: 'Transport sync' },
    ],
    outputs: [
      { id: 'bass-out', name: 'Bass', type: 'midi', description: 'Bass voice output' },
      { id: 'drums-out', name: 'Drums', type: 'midi', description: 'Drum voice output' },
      { id: 'piano-out', name: 'Piano', type: 'midi', description: 'Piano/chord voice output' },
      { id: 'pad-out', name: 'Pad', type: 'midi', description: 'Pad voice output' },
      { id: 'all-out', name: 'All', type: 'midi', description: 'All voices mixed' },
    ],
  },
} as const;

/**
 * Process arranger input command
 */
export function processArrangerCommand(
  state: ArrangerState,
  command: ArrangerCommand,
  styles: readonly ArrangerStyle[] = ARRANGER_STYLES
): ArrangerState {
  switch (command.type) {
    case 'loadStyle': {
      const style = styles.find(s => s.id === command.styleId);
      if (!style) return state;
      return Object.freeze({
        ...state,
        styleId: command.styleId,
        tempo: style.defaultTempo,
        variationIndex: 0,
      });
    }
    
    case 'play':
      return Object.freeze({ ...state, isPlaying: true });
      
    case 'stop':
      return Object.freeze({ ...state, isPlaying: false, positionTicks: 0 });
      
    case 'setVariation':
      return Object.freeze({ ...state, variationIndex: command.index });
      
    case 'triggerFill':
      return Object.freeze({ ...state, fillQueued: true });
      
    case 'triggerEnding':
      return Object.freeze({ ...state, endingQueued: true, currentSection: 'ending' });
      
    case 'triggerBreak':
      return Object.freeze({ ...state, currentSection: 'break' });
      
    case 'setChord': {
      const chord = recognizeChord(command.notes);
      return Object.freeze({
        ...state,
        previousChord: state.currentChord,
        currentChord: chord,
        isPlaying: state.syncStart ? true : state.isPlaying,
      });
    }
    
    case 'releaseChord':
      if (state.chordMemory) return state;
      if (state.syncStop) {
        return Object.freeze({ ...state, isPlaying: false, currentChord: null });
      }
      return Object.freeze({ ...state, currentChord: null });
      
    case 'setTempo':
      return Object.freeze({ ...state, tempo: Math.max(40, Math.min(240, command.tempo)) });
      
    case 'setEnergy':
      return Object.freeze({ ...state, energyLevel: Math.max(1, Math.min(5, command.level)) });
      
    case 'setComplexity':
      return Object.freeze({ ...state, complexityLevel: Math.max(1, Math.min(5, command.level)) });
      
    case 'muteVoice': {
      const voiceMutes = new Map(state.voiceMutes);
      voiceMutes.set(command.voiceId, command.muted);
      return Object.freeze({ ...state, voiceMutes });
    }
    
    case 'soloVoice': {
      const voiceSolos = new Map(state.voiceSolos);
      voiceSolos.set(command.voiceId, command.soloed);
      return Object.freeze({ ...state, voiceSolos });
    }
    
    case 'setVoiceVolume': {
      const voiceVolumes = new Map(state.voiceVolumes);
      voiceVolumes.set(command.voiceId, command.volume);
      return Object.freeze({ ...state, voiceVolumes });
    }
    
    case 'setSyncStart':
      return Object.freeze({ ...state, syncStart: command.enabled });
      
    case 'setSyncStop':
      return Object.freeze({ ...state, syncStop: command.enabled });
      
    case 'setChordMemory':
      return Object.freeze({ ...state, chordMemory: command.enabled });
      
    case 'setSyncToDAW':
      return Object.freeze({ ...state, syncToDAW: command.enabled });
      
    case 'syncFromDAW':
      // When syncing from DAW, update both tempo and position
      if (!state.syncToDAW) return state;
      return Object.freeze({
        ...state,
        externalTempo: command.tempo,
        externalPositionTicks: command.positionTicks,
        tempo: command.tempo, // Use external tempo when synced
        positionTicks: command.positionTicks, // Use external position when synced
      });
      
    default:
      return state;
  }
}

// ============================================================================
// DAW SYNC HELPERS
// ============================================================================

/**
 * Interface for DAW transport data
 */
export interface DAWTransportData {
  /** Whether DAW is playing */
  readonly isPlaying: boolean;
  /** Current tempo in BPM */
  readonly tempo: number;
  /** Current position in beats (fractional) */
  readonly positionBeats: number;
  /** Time signature numerator */
  readonly timeSignatureNumerator: number;
  /** Time signature denominator */
  readonly timeSignatureDenominator: number;
}

/**
 * Convert beats to ticks (assumes 960 ticks per quarter note)
 */
export function beatsToTicks(beats: number): number {
  return Math.floor(beats * 960);
}

/**
 * Convert ticks to beats (assumes 960 ticks per quarter note)
 */
export function ticksToBeats(ticks: number): number {
  return ticks / 960;
}

/**
 * Create a syncFromDAW command from external transport data
 */
export function createSyncFromDAWCommand(transport: DAWTransportData): ArrangerCommand {
  return {
    type: 'syncFromDAW',
    tempo: transport.tempo,
    positionTicks: beatsToTicks(transport.positionBeats),
  };
}

/**
 * Get effective tempo (external if syncing, otherwise internal)
 */
export function getEffectiveTempo(state: ArrangerState): number {
  return state.syncToDAW && state.externalTempo !== null 
    ? state.externalTempo 
    : state.tempo;
}

/**
 * Get effective position (external if syncing, otherwise internal)
 */
export function getEffectivePosition(state: ArrangerState): number {
  return state.syncToDAW && state.externalPositionTicks !== null 
    ? state.externalPositionTicks 
    : state.positionTicks;
}

/**
 * Check if arranger should be playing based on DAW sync state
 */
export function shouldPlayWithDAWSync(
  state: ArrangerState, 
  dawIsPlaying: boolean
): boolean {
  if (!state.syncToDAW) {
    return state.isPlaying;
  }
  return dawIsPlaying;
}

// ============================================================================
// SCENE VIEW - SONG STRUCTURE VISUALIZATION
// ============================================================================

/**
 * Scene view state for rendering song structure
 */
export interface SceneViewState {
  /** Currently playing part index */
  readonly currentPartIndex: number;
  /** Position within current part (in bars) */
  readonly positionInPart: number;
  /** Whether we're in a fill */
  readonly inFill: boolean;
  /** Queued part index (next part to play) */
  readonly queuedPartIndex: number | null;
  /** Whether loop mode is active */
  readonly loopMode: boolean;
  /** Loop range [start, end] part indices */
  readonly loopRange: [number, number] | null;
  /** Selected parts for editing */
  readonly selectedParts: readonly number[];
  /** Zoom level for timeline */
  readonly zoom: number;
  /** Scroll position */
  readonly scrollX: number;
}

/**
 * Create initial scene view state
 */
export function createSceneViewState(): SceneViewState {
  return Object.freeze({
    currentPartIndex: 0,
    positionInPart: 0,
    inFill: false,
    queuedPartIndex: null,
    loopMode: false,
    loopRange: null,
    selectedParts: [],
    zoom: 1,
    scrollX: 0,
  });
}

/**
 * Scene view CSS styles
 */
export const SCENE_VIEW_STYLES = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '80px',
    padding: '8px',
    gap: '4px',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  partBlock: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '80px',
    position: 'relative',
    '&:hover': {
      filter: 'brightness(1.1)',
    },
    '&.active': {
      boxShadow: '0 0 0 2px #fff, 0 0 20px rgba(255,255,255,0.3)',
    },
    '&.queued': {
      boxShadow: '0 0 0 2px #fbbf24',
    },
  },
  partName: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  partInfo: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.7)',
  },
  partProgress: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    height: '3px',
    background: '#fff',
    borderRadius: '0 0 6px 6px',
    transition: 'width 0.1s linear',
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    padding: '8px',
    borderTop: '1px solid #2a2a4e',
  },
  toolbarButton: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: '#3a3a5e',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    '&:hover': {
      background: '#4a4a7e',
    },
    '&.active': {
      background: '#6366f1',
    },
  },
} as const;

/**
 * Render data for a single song part in the scene view
 */
export interface PartRenderData {
  /** Part index */
  readonly index: number;
  /** The song part */
  readonly part: SongPart;
  /** Pixel width based on bar length */
  readonly width: number;
  /** Start position in bars */
  readonly startBar: number;
  /** End position in bars */
  readonly endBar: number;
  /** Whether this is the current part */
  readonly isCurrent: boolean;
  /** Whether this is queued */
  readonly isQueued: boolean;
  /** Whether this is selected */
  readonly isSelected: boolean;
  /** Progress through this part (0-1) if current */
  readonly progress: number;
  /** CSS class names */
  readonly className: string;
  /** Inline styles */
  readonly style: Record<string, string | number>;
}

/**
 * Generate render data for song structure
 */
export function generateSceneViewRenderData(
  structure: SongStructure,
  viewState: SceneViewState,
  pixelsPerBar: number = 20
): readonly PartRenderData[] {
  let currentBar = 0;
  
  return structure.parts.map((part, index) => {
    const startBar = currentBar;
    const endBar = currentBar + part.lengthBars * part.repeat;
    currentBar = endBar;
    
    const isCurrent = index === viewState.currentPartIndex;
    const isQueued = index === viewState.queuedPartIndex;
    const isSelected = viewState.selectedParts.includes(index);
    const progress = isCurrent ? viewState.positionInPart / (part.lengthBars * part.repeat) : 0;
    
    const classNames = ['part-block'];
    if (isCurrent) classNames.push('active');
    if (isQueued) classNames.push('queued');
    if (isSelected) classNames.push('selected');
    
    return {
      index,
      part,
      width: part.lengthBars * part.repeat * pixelsPerBar * viewState.zoom,
      startBar,
      endBar,
      isCurrent,
      isQueued,
      isSelected,
      progress,
      className: classNames.join(' '),
      style: {
        background: part.color,
        width: `${part.lengthBars * part.repeat * pixelsPerBar * viewState.zoom}px`,
      },
    };
  });
}

/**
 * Commands for scene view interaction
 */
export type SceneViewCommand =
  | { type: 'selectPart'; index: number; addToSelection?: boolean }
  | { type: 'queuePart'; index: number }
  | { type: 'jumpToPart'; index: number }
  | { type: 'setLoopRange'; start: number; end: number }
  | { type: 'clearLoopRange' }
  | { type: 'toggleLoopMode' }
  | { type: 'setZoom'; zoom: number }
  | { type: 'scroll'; scrollX: number }
  | { type: 'addPart'; partType: SongPartType; afterIndex?: number }
  | { type: 'removePart'; index: number }
  | { type: 'movePart'; fromIndex: number; toIndex: number }
  | { type: 'duplicatePart'; index: number }
  | { type: 'updatePart'; index: number; updates: Partial<SongPart> }
  | { type: 'tick'; deltaMs: number };

/**
 * Process scene view command
 */
export function processSceneViewCommand(
  viewState: SceneViewState,
  structure: SongStructure,
  command: SceneViewCommand
): { viewState: SceneViewState; structure: SongStructure } {
  switch (command.type) {
    case 'selectPart': {
      let selectedParts: readonly number[];
      if (command.addToSelection) {
        if (viewState.selectedParts.includes(command.index)) {
          selectedParts = viewState.selectedParts.filter(i => i !== command.index);
        } else {
          selectedParts = [...viewState.selectedParts, command.index];
        }
      } else {
        selectedParts = [command.index];
      }
      return {
        viewState: Object.freeze({ ...viewState, selectedParts }),
        structure,
      };
    }
    
    case 'queuePart':
      return {
        viewState: Object.freeze({ ...viewState, queuedPartIndex: command.index }),
        structure,
      };
      
    case 'jumpToPart':
      return {
        viewState: Object.freeze({
          ...viewState,
          currentPartIndex: command.index,
          positionInPart: 0,
          queuedPartIndex: null,
        }),
        structure,
      };
      
    case 'setLoopRange':
      return {
        viewState: Object.freeze({
          ...viewState,
          loopRange: [command.start, command.end] as [number, number],
          loopMode: true,
        }),
        structure,
      };
      
    case 'clearLoopRange':
      return {
        viewState: Object.freeze({
          ...viewState,
          loopRange: null,
          loopMode: false,
        }),
        structure,
      };
      
    case 'toggleLoopMode':
      return {
        viewState: Object.freeze({
          ...viewState,
          loopMode: !viewState.loopMode,
        }),
        structure,
      };
      
    case 'setZoom':
      return {
        viewState: Object.freeze({
          ...viewState,
          zoom: Math.max(0.25, Math.min(4, command.zoom)),
        }),
        structure,
      };
      
    case 'scroll':
      return {
        viewState: Object.freeze({
          ...viewState,
          scrollX: Math.max(0, command.scrollX),
        }),
        structure,
      };
      
    case 'addPart': {
      const newPart = createSongPart(command.partType);
      const insertAt = command.afterIndex !== undefined ? command.afterIndex + 1 : structure.parts.length;
      const newParts = [
        ...structure.parts.slice(0, insertAt),
        newPart,
        ...structure.parts.slice(insertAt),
      ];
      const newTotalBars = newParts.reduce((sum, p) => sum + p.lengthBars * p.repeat, 0);
      return {
        viewState,
        structure: Object.freeze({
          ...structure,
          parts: newParts,
          totalBars: newTotalBars,
        }),
      };
    }
    
    case 'removePart': {
      if (structure.parts.length <= 1) return { viewState, structure };
      const newParts = structure.parts.filter((_, i) => i !== command.index);
      const newTotalBars = newParts.reduce((sum, p) => sum + p.lengthBars * p.repeat, 0);
      const newCurrentIndex = Math.min(viewState.currentPartIndex, newParts.length - 1);
      return {
        viewState: Object.freeze({
          ...viewState,
          currentPartIndex: newCurrentIndex,
          selectedParts: viewState.selectedParts
            .filter(i => i !== command.index)
            .map(i => i > command.index ? i - 1 : i),
        }),
        structure: Object.freeze({
          ...structure,
          parts: newParts,
          totalBars: newTotalBars,
        }),
      };
    }
    
    case 'movePart': {
      const parts = [...structure.parts];
      const [movedPart] = parts.splice(command.fromIndex, 1);
      if (!movedPart) return { viewState, structure };
      parts.splice(command.toIndex, 0, movedPart);
      return {
        viewState: Object.freeze({
          ...viewState,
          currentPartIndex: viewState.currentPartIndex === command.fromIndex
            ? command.toIndex
            : viewState.currentPartIndex,
        }),
        structure: Object.freeze({ ...structure, parts }),
      };
    }
    
    case 'duplicatePart': {
      const partToDuplicate = structure.parts[command.index];
      if (!partToDuplicate) return { viewState, structure };
      const duplicated = createSongPart(partToDuplicate.type, partToDuplicate.number + 1, {
        ...partToDuplicate,
        name: `${partToDuplicate.name} (copy)`,
      });
      const newParts = [
        ...structure.parts.slice(0, command.index + 1),
        duplicated,
        ...structure.parts.slice(command.index + 1),
      ];
      const newTotalBars = newParts.reduce((sum, p) => sum + p.lengthBars * p.repeat, 0);
      return {
        viewState,
        structure: Object.freeze({
          ...structure,
          parts: newParts,
          totalBars: newTotalBars,
        }),
      };
    }
    
    case 'updatePart': {
      const newParts = structure.parts.map((p, i) =>
        i === command.index
          ? Object.freeze({ ...p, ...command.updates })
          : p
      );
      const newTotalBars = newParts.reduce((sum, p) => sum + p.lengthBars * p.repeat, 0);
      return {
        viewState,
        structure: Object.freeze({
          ...structure,
          parts: newParts,
          totalBars: newTotalBars,
        }),
      };
    }
    
    default:
      return { viewState, structure };
  }
}

// ============================================================================
// ARRANGER + SCENE VIEW INTEGRATION
// ============================================================================

/**
 * Combined arranger and scene view state
 */
export interface ArrangerSceneState {
  /** Arranger playback state */
  readonly arranger: ArrangerState;
  /** Scene view state */
  readonly sceneView: SceneViewState;
  /** Song structure */
  readonly songStructure: SongStructure;
}

/**
 * Create initial combined state
 */
export function createArrangerSceneState(
  styleId: string = 'pop-8beat',
  structureTemplate: 'pop' | 'edm' | 'jazz' = 'pop'
): ArrangerSceneState {
  const style = getArrangerStyle(styleId);
  const tempo = style?.defaultTempo ?? 120;
  
  let songStructure: SongStructure;
  switch (structureTemplate) {
    case 'edm':
      songStructure = createEDMSongStructure(styleId, tempo);
      break;
    case 'jazz':
      songStructure = createJazzAABASongStructure(styleId, tempo);
      break;
    default:
      songStructure = createPopSongStructure(styleId, tempo);
  }
  
  const arranger = {
    ...createArrangerState(),
    styleId,
    tempo,
  };
  
  return Object.freeze({
    arranger: Object.freeze(arranger),
    sceneView: createSceneViewState(),
    songStructure,
  });
}

/**
 * Combined command type
 */
export type ArrangerSceneCommand =
  | { type: 'arranger'; command: ArrangerCommand }
  | { type: 'sceneView'; command: SceneViewCommand }
  | { type: 'sync' }; // Sync arranger state with current scene

/**
 * Process combined command
 */
export function processArrangerSceneCommand(
  state: ArrangerSceneState,
  command: ArrangerSceneCommand
): ArrangerSceneState {
  switch (command.type) {
    case 'arranger': {
      const newArranger = processArrangerCommand(state.arranger, command.command);
      return Object.freeze({ ...state, arranger: newArranger });
    }
    
    case 'sceneView': {
      const { viewState, structure } = processSceneViewCommand(
        state.sceneView,
        state.songStructure,
        command.command
      );
      
      // Auto-sync arranger when jumping to a new part
      if (command.command.type === 'jumpToPart') {
        const part = structure.parts[command.command.index];
        if (part) {
          const syncedArranger = Object.freeze({
            ...state.arranger,
            variationIndex: part.variationIndex,
            energyLevel: part.energy,
            complexityLevel: part.complexity,
            tempo: part.tempoOverride ?? structure.tempo,
          });
          return Object.freeze({
            arranger: syncedArranger,
            sceneView: viewState,
            songStructure: structure,
          });
        }
      }
      
      return Object.freeze({
        ...state,
        sceneView: viewState,
        songStructure: structure,
      });
    }
    
    case 'sync': {
      const currentPart = state.songStructure.parts[state.sceneView.currentPartIndex];
      if (!currentPart) return state;
      
      return Object.freeze({
        ...state,
        arranger: Object.freeze({
          ...state.arranger,
          variationIndex: currentPart.variationIndex,
          energyLevel: currentPart.energy,
          complexityLevel: currentPart.complexity,
          tempo: currentPart.tempoOverride ?? state.songStructure.tempo,
        }),
      });
    }
  }
}

/**
 * Get current part info for display
 */
export function getCurrentPartInfo(state: ArrangerSceneState): {
  part: SongPart;
  nextPart: SongPart | null;
  progress: number;
  barsRemaining: number;
} | null {
  const { sceneView, songStructure } = state;
  const currentPart = songStructure.parts[sceneView.currentPartIndex];
  if (!currentPart) return null;
  
  const nextPart = songStructure.parts[sceneView.currentPartIndex + 1] ?? null;
  const totalBars = currentPart.lengthBars * currentPart.repeat;
  const progress = sceneView.positionInPart / totalBars;
  const barsRemaining = totalBars - sceneView.positionInPart;
  
  return { part: currentPart, nextPart, progress, barsRemaining };
}

/**
 * Emoji-based mini scene view for compact display
 */
export function renderMiniSceneView(state: ArrangerSceneState): string {
  const { sceneView, songStructure } = state;
  const parts = songStructure.parts;
  
  let result = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const theme = SONG_PART_THEMES[part.type];
    
    if (i === sceneView.currentPartIndex) {
      result += `[${theme.icon}]`;
    } else if (i === sceneView.queuedPartIndex) {
      result += `(${theme.icon})`;
    } else {
      result += ` ${theme.icon} `;
    }
  }
  
  return result;
}

/**
 * Generate ASCII art timeline for debugging/simple display
 */
export function renderAsciiTimeline(state: ArrangerSceneState): string {
  const { sceneView, songStructure } = state;
  const parts = songStructure.parts;
  
  const lines: string[] = [];
  
  // Part names row
  let nameRow = '';
  let barRow = '';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const theme = SONG_PART_THEMES[part.type];
    const width = part.lengthBars * part.repeat;
    
    const marker = i === sceneView.currentPartIndex ? '▶' : 
                   i === sceneView.queuedPartIndex ? '◆' : ' ';
    
    const label = `${marker}${theme.shortName}${part.number}`;
    nameRow += label.padEnd(width, '─');
    
    if (i === sceneView.currentPartIndex) {
      const progress = Math.floor(sceneView.positionInPart);
      barRow += '█'.repeat(progress) + '░'.repeat(width - progress);
    } else {
      barRow += '░'.repeat(width);
    }
  }
  
  lines.push('┌' + '─'.repeat(nameRow.length) + '┐');
  lines.push('│' + nameRow + '│');
  lines.push('│' + barRow + '│');
  lines.push('└' + '─'.repeat(nameRow.length) + '┘');
  
  return lines.join('\n');
}

// ============================================================================
// VOICE LEADING ENGINE
// ============================================================================

/**
 * Voice leading configuration
 */
export interface VoiceLeadingConfig {
  /** Maximum interval movement per voice (semitones) */
  readonly maxMovement: number;
  /** Prefer common tones */
  readonly preferCommonTones: boolean;
  /** Prefer contrary motion */
  readonly preferContraryMotion: boolean;
  /** Avoid parallel fifths/octaves */
  readonly avoidParallels: boolean;
  /** Voice range constraints */
  readonly voiceRanges: {
    soprano: { min: number; max: number };
    alto: { min: number; max: number };
    tenor: { min: number; max: number };
    bass: { min: number; max: number };
  };
}

/**
 * Default voice leading config
 */
export const DEFAULT_VOICE_LEADING_CONFIG: VoiceLeadingConfig = {
  maxMovement: 7, // Perfect fifth
  preferCommonTones: true,
  preferContraryMotion: true,
  avoidParallels: true,
  voiceRanges: {
    soprano: { min: 60, max: 84 }, // C4-C6
    alto: { min: 55, max: 77 },    // G3-F5
    tenor: { min: 48, max: 69 },   // C3-A4
    bass: { min: 36, max: 60 },    // C2-C4
  },
};

/**
 * Four-part voicing result
 */
export interface FourPartVoicing {
  readonly soprano: number;
  readonly alto: number;
  readonly tenor: number;
  readonly bass: number;
}

/**
 * Get chord tones for a recognized chord
 */
export function getChordTones(chord: RecognizedChord): readonly number[] {
  const pattern = CHORD_PATTERNS[chord.quality] ?? CHORD_PATTERNS.major;
  if (!pattern) {
    return [chord.root, chord.root + 4, chord.root + 7]; // Default major triad
  }
  return pattern.map(interval => chord.root + interval);
}

/**
 * Apply voice leading from previous voicing to new chord
 */
export function applyVoiceLeading(
  previousVoicing: FourPartVoicing | null,
  chord: RecognizedChord,
  config: VoiceLeadingConfig = DEFAULT_VOICE_LEADING_CONFIG
): FourPartVoicing {
  const chordTones = getChordTones(chord);
  
  if (!previousVoicing) {
    // First voicing - use close position from root
    return createInitialVoicing(chord, config);
  }
  
  // Find best voice leading
  const result: Record<string, number> = {};
  const usedPitchClasses = new Set<number>();
  
  // Bass moves to root or specified bass note
  const targetBass = (chord.bass ?? chord.root) + 36; // Octave 2
  result.bass = findClosestInRange(previousVoicing.bass, targetBass, config.voiceRanges.bass);
  usedPitchClasses.add(result.bass % 12);
  
  // Other voices find closest chord tones
  for (const voice of ['tenor', 'alto', 'soprano'] as const) {
    const prev = previousVoicing[voice];
    let bestPitch = prev;
    let bestDistance = Infinity;
    
    for (const tone of chordTones) {
      // Try various octaves
      for (let octave = 2; octave <= 6; octave++) {
        const pitch = tone + (octave * 12);
        const range = config.voiceRanges[voice];
        
        if (pitch < range.min || pitch > range.max) continue;
        
        const distance = Math.abs(pitch - prev);
        
        if (distance < bestDistance && distance <= config.maxMovement) {
          // Prefer unused pitch classes if we have enough chord tones
          const pc = pitch % 12;
          const bonus = !usedPitchClasses.has(pc) ? -2 : 0;
          
          if (distance + bonus < bestDistance) {
            bestDistance = distance + bonus;
            bestPitch = pitch;
          }
        }
      }
    }
    
    result[voice] = bestPitch;
    usedPitchClasses.add(bestPitch % 12);
  }
  
  return result as unknown as FourPartVoicing;
}

/**
 * Create initial voicing for a chord (no previous context)
 */
function createInitialVoicing(
  chord: RecognizedChord,
  config: VoiceLeadingConfig
): FourPartVoicing {
  const tones = getChordTones(chord);
  
  // Close position from root
  const bass = (chord.bass ?? chord.root) + 36;
  const tenorTone = tones[0 % tones.length];
  const altoTone = tones[1 % tones.length];
  const sopranoTone = tones[2 % tones.length];
  
  const tenor = (tenorTone ?? chord.root) + 48;
  const alto = (altoTone ?? chord.root) + 60;
  const soprano = (sopranoTone ?? chord.root) + 60;
  
  return {
    bass: clampToRange(bass, config.voiceRanges.bass),
    tenor: clampToRange(tenor, config.voiceRanges.tenor),
    alto: clampToRange(alto, config.voiceRanges.alto),
    soprano: clampToRange(soprano, config.voiceRanges.soprano),
  };
}

/**
 * Find closest pitch to target within range
 */
function findClosestInRange(
  current: number,
  target: number,
  range: { min: number; max: number }
): number {
  // Try target and octave variants
  const candidates = [
    target,
    target + 12,
    target - 12,
    target + 24,
    target - 24,
  ].filter(p => p >= range.min && p <= range.max);
  
  if (candidates.length === 0) {
    return clampToRange(target, range);
  }
  
  return candidates.reduce((best, p) => 
    Math.abs(p - current) < Math.abs(best - current) ? p : best
  );
}

/**
 * Clamp pitch to range
 */
function clampToRange(pitch: number, range: { min: number; max: number }): number {
  while (pitch < range.min) pitch += 12;
  while (pitch > range.max) pitch -= 12;
  return Math.max(range.min, Math.min(range.max, pitch));
}

// ============================================================================
// FILL & ENDING GENERATORS
// ============================================================================

/**
 * Fill generation style
 */
export type FillStyle = 
  | 'simple'
  | 'building'
  | 'breakdown'
  | 'tom-roll'
  | 'snare-roll'
  | 'crash'
  | 'syncopated'
  | 'polyrhythmic';

/**
 * Fill configuration
 */
export interface FillConfig {
  /** Fill style */
  readonly style: FillStyle;
  /** Length in beats */
  readonly lengthBeats: number;
  /** Intensity (1-5) */
  readonly intensity: number;
  /** Whether to include crash at end */
  readonly crashAtEnd: boolean;
  /** Density (0-1) */
  readonly density: number;
}

/**
 * Generate a drum fill pattern
 */
export function generateFill(config: FillConfig): DrumPattern {
  const steps: DrumStep[] = [];
  const { lengthBeats, style, density } = config;
  
  switch (style) {
    case 'simple':
      // Simple snare hits leading to downbeat
      for (let i = 0; i < lengthBeats; i++) {
        if (i >= lengthBeats - 2) {
          steps.push({ position: i, sound: 'snare', velocity: 80 + (i * 10) });
        }
      }
      break;
      
    case 'building':
      // Accelerating hits
      const subdivisions = [1, 0.5, 0.25];
      let pos = 0;
      let subIdx = 0;
      while (pos < lengthBeats) {
        const sub = subdivisions[Math.min(subIdx, subdivisions.length - 1)] ?? 0.25;
        steps.push({
          position: pos,
          sound: subIdx % 2 === 0 ? 'snare' : 'tom-high',
          velocity: 70 + (pos / lengthBeats * 30),
        });
        pos += sub;
        if (pos > lengthBeats * 0.5) subIdx = 1;
        if (pos > lengthBeats * 0.75) subIdx = 2;
      }
      break;
      
    case 'tom-roll':
      // Descending tom pattern
      const toms = ['tom-high', 'tom-mid', 'tom-low', 'tom-floor'];
      for (let i = 0; i < lengthBeats * 2; i++) {
        const tomIdx = Math.floor(i / 2) % toms.length;
        const tomSound = toms[tomIdx] ?? 'tom-high';
        steps.push({
          position: i * 0.5,
          sound: tomSound,
          velocity: 90 - (i * 3),
        });
      }
      break;
      
    case 'snare-roll':
      // Buzz roll on snare
      for (let i = 0; i < lengthBeats * 4; i++) {
        steps.push({
          position: i * 0.25,
          sound: 'snare',
          velocity: 60 + (i / (lengthBeats * 4) * 40),
        });
      }
      break;
      
    case 'crash':
      // Single crash hit
      steps.push({ position: 0, sound: 'crash', velocity: 127 });
      break;
      
    case 'syncopated':
      // Syncopated fill with offbeats
      for (let i = 0; i < lengthBeats; i++) {
        if (Math.random() < density) {
          steps.push({ position: i + 0.5, sound: 'snare', velocity: 80 });
        }
        if (i % 2 === 1) {
          steps.push({ position: i + 0.25, sound: 'tom-high', velocity: 70 });
        }
      }
      break;
      
    default:
      // Default simple fill
      steps.push({ position: lengthBeats - 1, sound: 'snare', velocity: 100 });
  }
  
  // Add crash at end if configured
  if (config.crashAtEnd) {
    steps.push({ position: lengthBeats, sound: 'crash', velocity: 127 });
  }
  
  return { lengthBeats, steps, swing: 0 };
}

/**
 * Ending style
 */
export type EndingStyle = 
  | 'ritardando'
  | 'fermata'
  | 'tag'
  | 'cold'
  | 'fade'
  | 'big-finish'
  | 'vamp-out';

/**
 * Ending configuration
 */
export interface EndingConfig {
  /** Ending style */
  readonly style: EndingStyle;
  /** Length in bars */
  readonly lengthBars: number;
  /** Final chord */
  readonly finalChord: RecognizedChord | null;
  /** Include drum fill before end */
  readonly includeFill: boolean;
}

/**
 * Generate ending events
 */
export function generateEnding(config: EndingConfig): {
  drumPattern: DrumPattern;
  tempoMultiplier: number;
  dynamics: number;
} {
  const { style, lengthBars, includeFill } = config;
  
  let tempoMultiplier = 1;
  let dynamics = 1;
  const steps: DrumStep[] = [];
  
  switch (style) {
    case 'ritardando':
      tempoMultiplier = 0.7; // Slow down
      dynamics = 0.6;
      if (includeFill) {
        steps.push({ position: 0, sound: 'crash', velocity: 100 });
      }
      break;
      
    case 'fermata':
      tempoMultiplier = 0.3; // Very slow final beat
      dynamics = 0.8;
      steps.push({ position: 0, sound: 'crash', velocity: 127 });
      break;
      
    case 'tag':
      tempoMultiplier = 1;
      // Repeat last phrase 2-3 times
      for (let i = 0; i < 3; i++) {
        steps.push({ position: i * 4, sound: 'crash', velocity: 100 - (i * 10) });
      }
      break;
      
    case 'cold':
      // Sudden stop
      tempoMultiplier = 1;
      dynamics = 0;
      break;
      
    case 'fade':
      tempoMultiplier = 1;
      dynamics = 0.3; // Fade out
      break;
      
    case 'big-finish':
      tempoMultiplier = 0.9;
      dynamics = 1.3; // Louder
      steps.push({ position: 0, sound: 'crash', velocity: 127 });
      steps.push({ position: 0.5, sound: 'crash', velocity: 127 });
      steps.push({ position: 1, sound: 'crash', velocity: 127 });
      break;
      
    case 'vamp-out':
      tempoMultiplier = 1;
      // Keep vamping until fade
      for (let i = 0; i < lengthBars * 4; i++) {
        steps.push({ position: i, sound: 'hihat-closed', velocity: 60 });
      }
      break;
  }
  
  return {
    drumPattern: { lengthBeats: lengthBars * 4, steps, swing: 0 },
    tempoMultiplier,
    dynamics,
  };
}

// ============================================================================
// TEXTURE GENERATOR
// ============================================================================

/**
 * Musical texture type
 */
export type TextureType = 
  | 'monophonic'     // Single melody line
  | 'homophonic'     // Melody with chord accompaniment
  | 'polyphonic'     // Multiple independent voices
  | 'heterophonic'   // Same melody with variations
  | 'fugal'          // Imitative counterpoint
  | 'ostinato'       // Repeated pattern with melody
  | 'antiphonal'     // Call and response
  | 'unison'         // All voices in unison/octaves
  | 'drone';         // Sustained tone with melody

/**
 * Texture configuration
 */
export interface TextureConfig {
  /** Texture type */
  readonly type: TextureType;
  /** Number of voices */
  readonly voiceCount: number;
  /** Density (0-1) */
  readonly density: number;
  /** Rhythmic variation (0-1) */
  readonly rhythmVariation: number;
  /** Pitch spread in octaves */
  readonly spread: number;
}

/**
 * Default texture config
 */
export const DEFAULT_TEXTURE_CONFIG: TextureConfig = {
  type: 'homophonic',
  voiceCount: 4,
  density: 0.5,
  rhythmVariation: 0.3,
  spread: 2,
};

/**
 * Transform chord input into textured voice events
 */
export function applyTexture(
  chord: RecognizedChord,
  startTick: number,
  durationTicks: number,
  config: TextureConfig = DEFAULT_TEXTURE_CONFIG
): readonly VoiceEvent[] {
  const events: VoiceEvent[] = [];
  const chordTones = getChordTones(chord);
  
  // Helper to safely get chord tone with fallback
  const getTone = (index: number): number => chordTones[index % chordTones.length] ?? chord.root;
  const getLastTone = (): number => chordTones[chordTones.length - 1] ?? chord.root;
  const getFirstTone = (): number => chordTones[0] ?? chord.root;
  
  switch (config.type) {
    case 'monophonic':
      // Single top note
      events.push(createVoiceEvent(
        'melody',
        'lead',
        getLastTone() + 60,
        startTick,
        durationTicks,
        100
      ));
      break;
      
    case 'homophonic':
      // All notes together
      for (let i = 0; i < Math.min(config.voiceCount, chordTones.length); i++) {
        const octave = i === 0 ? 36 : 48 + (i * 12 / config.voiceCount);
        events.push(createVoiceEvent(
          `voice-${i}`,
          i === 0 ? 'bass' : 'piano',
          getTone(i) + octave,
          startTick,
          durationTicks,
          i === 0 ? 90 : 70
        ));
      }
      break;
      
    case 'polyphonic':
      // Staggered entries
      for (let i = 0; i < config.voiceCount; i++) {
        const offset = (i * durationTicks * config.rhythmVariation) / config.voiceCount;
        events.push(createVoiceEvent(
          `voice-${i}`,
          'strings',
          getTone(i) + 48 + (i * 4),
          startTick + offset,
          durationTicks - offset,
          80 - (i * 5)
        ));
      }
      break;
      
    case 'heterophonic':
      // Same melody with embellishments
      const melody = getLastTone() + 60;
      for (let i = 0; i < config.voiceCount; i++) {
        const variation = Math.floor((Math.random() - 0.5) * 2);
        events.push(createVoiceEvent(
          `voice-${i}`,
          'woodwinds',
          melody + variation,
          startTick + (i * 10),
          durationTicks,
          90 - (i * 10)
        ));
      }
      break;
      
    case 'ostinato':
      // Repeated pattern with sustained melody
      const patternLength = durationTicks / 4;
      for (let i = 0; i < 4; i++) {
        events.push(createVoiceEvent(
          'ostinato',
          'piano',
          getFirstTone() + 48,
          startTick + (i * patternLength),
          patternLength * 0.8,
          70
        ));
      }
      events.push(createVoiceEvent(
        'melody',
        'strings',
        getLastTone() + 72,
        startTick,
        durationTicks,
        85
      ));
      break;
      
    case 'antiphonal':
      // Call and response
      const halfDuration = durationTicks / 2;
      events.push(createVoiceEvent('call', 'brass', getFirstTone() + 60, startTick, halfDuration * 0.9, 90));
      events.push(createVoiceEvent('response', 'woodwinds', getTone(2) + 60, startTick + halfDuration, halfDuration * 0.9, 85));
      break;
      
    case 'unison':
      // All voices on same pitch (octaves)
      for (let i = 0; i < config.voiceCount; i++) {
        events.push(createVoiceEvent(
          `voice-${i}`,
          'strings',
          getFirstTone() + 36 + (i * 12),
          startTick,
          durationTicks,
          100 - (i * 5)
        ));
      }
      break;
      
    case 'drone':
      // Sustained bass with melody
      events.push(createVoiceEvent('drone', 'organ', chord.root + 36, startTick, durationTicks, 60));
      events.push(createVoiceEvent('drone-5th', 'organ', chord.root + 43, startTick, durationTicks, 55));
      events.push(createVoiceEvent('melody', 'lead', getLastTone() + 60, startTick, durationTicks * 0.5, 80));
      break;
      
    default:
      // Default to homophonic
      for (let i = 0; i < chordTones.length; i++) {
        events.push(createVoiceEvent(`voice-${i}`, 'piano', getTone(i) + 48, startTick, durationTicks, 70));
      }
  }
  
  return events;
}

/**
 * Helper to create a voice event
 */
function createVoiceEvent(
  voiceId: string,
  voiceType: VoiceType,
  note: number,
  startTick: number,
  durationTicks: number,
  velocity: number
): VoiceEvent {
  return {
    voiceId,
    voiceType,
    note,
    velocity: Math.max(1, Math.min(127, Math.round(velocity))),
    startTick,
    durationTicks,
    articulation: 'normal',
    channel: 1,
  };
}

// ============================================================================
// DRUM PATTERN LIBRARY INTEGRATION
// ============================================================================

import {
  type DrumPattern as AudioDrumPattern,
  type DrumHit,
  DRUM,
  ROCK_BASIC,
  ROCK_DRIVING,
  FUNK_BASIC,
  FUNK_JAMES_BROWN,
  JAZZ_SWING,
  JAZZ_BOSSA,
  LATIN_SONGO,
  ELECTRONIC_FOUR_FLOOR,
  ELECTRONIC_BREAKBEAT,
  ELECTRONIC_TRAP,
  WORLD_AFROBEAT,
  WORLD_REGGAE,
  getPatternById,
  getPatternsByCategory,
  getPatternsByTag,
} from '../audio/drum-patterns';

/**
 * Drum sound name to MIDI note mapping (reverse of DRUM constant)
 */
const DRUM_SOUND_TO_NAME: Record<number, string> = {
  [DRUM.KICK]: 'kick',
  [DRUM.KICK_ACOUSTIC]: 'kick',
  [DRUM.SNARE]: 'snare',
  [DRUM.SNARE_ELECTRIC]: 'snare',
  [DRUM.RIMSHOT]: 'rim',
  [DRUM.HIHAT_CLOSED]: 'hihat-closed',
  [DRUM.HIHAT_PEDAL]: 'hihat-foot',
  [DRUM.HIHAT_OPEN]: 'hihat-open',
  [DRUM.TOM_LOW]: 'tom-low',
  [DRUM.TOM_MID]: 'tom-mid',
  [DRUM.TOM_HIGH]: 'tom-high',
  [DRUM.TOM_FLOOR]: 'tom-floor',
  [DRUM.CRASH_1]: 'crash',
  [DRUM.CRASH_2]: 'crash',
  [DRUM.RIDE]: 'ride',
  [DRUM.RIDE_BELL]: 'ride-bell',
  [DRUM.CLAP]: 'clap',
  [DRUM.COWBELL]: 'cowbell',
  [DRUM.SHAKER]: 'shaker',
  [DRUM.TAMBOURINE]: 'tambourine',
  [DRUM.CONGA_HIGH]: 'conga-high',
  [DRUM.CONGA_LOW]: 'conga-low',
  [DRUM.BONGO_HIGH]: 'bongo-high',
  [DRUM.BONGO_LOW]: 'bongo-low',
  [DRUM.CLAVE]: 'clave',
};

/**
 * Convert a drum hit from audio/drum-patterns format to arranger DrumStep format
 */
function convertDrumHit(hit: DrumHit): DrumStep {
  return {
    position: hit.beat - 1, // Convert from 1-based to 0-based
    sound: DRUM_SOUND_TO_NAME[hit.note] ?? 'kick',
    velocity: hit.velocity,
  };
}

/**
 * Convert an audio drum pattern to arranger DrumPattern format
 */
export function convertAudioDrumPattern(pattern: AudioDrumPattern): DrumPattern {
  return {
    lengthBeats: pattern.lengthBeats,
    steps: pattern.hits.map(convertDrumHit),
    swing: (pattern.groove.swing - 50) / 100, // Convert from 50-67 range to 0-0.17
  };
}

/**
 * Pre-converted drum patterns from the audio library for use in arranger styles
 */
export const LIBRARY_DRUM_PATTERNS = {
  // Rock patterns
  'rock-basic': convertAudioDrumPattern(ROCK_BASIC),
  'rock-driving': convertAudioDrumPattern(ROCK_DRIVING),
  
  // Funk patterns
  'funk-basic': convertAudioDrumPattern(FUNK_BASIC),
  'funk-james-brown': convertAudioDrumPattern(FUNK_JAMES_BROWN),
  
  // Jazz patterns
  'jazz-swing': convertAudioDrumPattern(JAZZ_SWING),
  'jazz-bossa': convertAudioDrumPattern(JAZZ_BOSSA),
  
  // Latin patterns
  'latin-songo': convertAudioDrumPattern(LATIN_SONGO),
  
  // Electronic patterns
  'electronic-four-floor': convertAudioDrumPattern(ELECTRONIC_FOUR_FLOOR),
  'electronic-breakbeat': convertAudioDrumPattern(ELECTRONIC_BREAKBEAT),
  'electronic-trap': convertAudioDrumPattern(ELECTRONIC_TRAP),
  
  // World patterns
  'world-afrobeat': convertAudioDrumPattern(WORLD_AFROBEAT),
  'world-reggae': convertAudioDrumPattern(WORLD_REGGAE),
} as const;

/**
 * Get a drum pattern from the library by ID
 */
export function getLibraryDrumPattern(patternId: string): DrumPattern | undefined {
  // First check pre-converted patterns
  if (patternId in LIBRARY_DRUM_PATTERNS) {
    return LIBRARY_DRUM_PATTERNS[patternId as keyof typeof LIBRARY_DRUM_PATTERNS];
  }
  
  // Fall back to converting on-demand from audio library
  const audioPattern = getPatternById(patternId);
  if (audioPattern) {
    return convertAudioDrumPattern(audioPattern);
  }
  
  return undefined;
}

/**
 * Get drum patterns from the library by category
 */
export function getLibraryDrumPatternsByCategory(category: string): DrumPattern[] {
  return getPatternsByCategory(category).map(convertAudioDrumPattern);
}

/**
 * Get drum patterns from the library by tag
 */
export function getLibraryDrumPatternsByTag(tag: string): DrumPattern[] {
  return getPatternsByTag(tag).map(convertAudioDrumPattern);
}

/**
 * Create a variation with a library drum pattern
 */
export function createVariationWithLibraryPattern(
  variationId: string,
  name: string,
  intensity: number,
  drumPatternId: string,
  voicePatterns: readonly VoicePattern[] = []
): StyleVariation {
  const drumPattern = getLibraryDrumPattern(drumPatternId);
  if (!drumPattern) {
    throw new Error(`Drum pattern not found: ${drumPatternId}`);
  }
  
  return {
    id: variationId,
    name,
    intensity,
    patterns: voicePatterns,
    drumPattern,
  };
}

// ============================================================================
// ARRANGER CARD DEFINITION
// ============================================================================

import type {
  CardDefinition,
  CardVisuals,
  CardBehavior,
  CardUIConfig,
  CardPanel,
  CardControl,
  ParameterDefinition,
  PresetDefinition,
} from './card-visuals';

import {
  createKnobControl,
  createSliderControl,
  createToggleControl,
  createButtonControl,
  createDropdownControl,
  createPanel,
  createDefaultUIConfig,
  buildCardDefinition,
  DEFAULT_DARK_THEME,
} from './card-visuals';

/**
 * Arranger card visuals - meta-card appearance
 */
export const ARRANGER_CARD_VISUALS: CardVisuals = {
  emoji: '🎼',
  emojiSecondary: '🎹',
  color: '#673AB7', // Deep Purple - meta/AI card
  colorSecondary: '#512DA8',
  gradient: 'radial',
  gradientAngle: 0,
  glow: '#9575CD',
  glowIntensity: 0.6, // Higher glow for meta-card
  badgePosition: 'top-right',
  animation: {
    name: 'arranger-pulse',
    duration: '2s',
    timing: 'ease-in-out',
    iterationCount: 'infinite',
    keyframes: `
      0%, 100% { box-shadow: 0 0 10px #9575CD; }
      50% { box-shadow: 0 0 25px #B39DDB; }
    `,
  },
};

/**
 * Arranger card behavior - event-based meta-card
 */
export const ARRANGER_CARD_BEHAVIOR: CardBehavior = {
  mode: 'event',
  pure: false,
  stateful: true,
  stochastic: false,
  realtime: false,
  cacheable: false,
  latency: { samples: 10, ms: 0.2, lookahead: 0, reportedToHost: false },
  cpuIntensity: 'medium',
  memoryFootprint: {
    estimatedMB: 2,
    sampleBufferMB: 0,
    wavetablesMB: 0,
    stateKB: 50,
    dynamicAllocation: false,
  },
  sideEffects: [],
  threadSafety: 'main-only',
  hotReloadable: true,
  stateSerializable: true,
};

/**
 * Arranger UI controls - main UI elements
 */
const ARRANGER_UI_CONTROLS: readonly CardControl[] = [
  // Row 0: Transport & Style Selection
  createButtonControl('play', 'Play', { row: 0, col: 0, tooltip: 'Start arranger playback' }),
  createButtonControl('stop', 'Stop', { row: 0, col: 1, tooltip: 'Stop playback' }),
  createDropdownControl('style-select', 'style', 'Style', { row: 0, col: 2, colSpan: 2, tooltip: 'Select arranger style' }),
  
  // Row 1: Global controls
  createKnobControl('tempo', 'tempo', 'Tempo', { row: 1, col: 0, tooltip: 'Master tempo (BPM)' }),
  createKnobControl('energy', 'energy', 'Energy', { row: 1, col: 1, tooltip: 'Arrangement intensity' }),
  createKnobControl('complexity', 'complexity', 'Complexity', { row: 1, col: 2, tooltip: 'Pattern complexity' }),
  createKnobControl('variation', 'variation', 'Variation', { row: 1, col: 3, tooltip: 'Auto-variation amount' }),
  
  // Row 2: Part controls
  createButtonControl('intro', 'Intro', { row: 2, col: 0, tooltip: 'Queue intro' }),
  createButtonControl('verse', 'Verse', { row: 2, col: 1, tooltip: 'Queue verse' }),
  createButtonControl('chorus', 'Chorus', { row: 2, col: 2, tooltip: 'Queue chorus' }),
  createButtonControl('ending', 'Ending', { row: 2, col: 3, tooltip: 'Queue ending' }),
  
  // Row 3: Voice mix
  createSliderControl('drums-vol', 'drumsVolume', 'Drums', { row: 3, col: 0, tooltip: 'Drums volume' }),
  createSliderControl('bass-vol', 'bassVolume', 'Bass', { row: 3, col: 1, tooltip: 'Bass volume' }),
  createSliderControl('keys-vol', 'keysVolume', 'Keys', { row: 3, col: 2, tooltip: 'Keys/piano volume' }),
  createSliderControl('pad-vol', 'padVolume', 'Pad', { row: 3, col: 3, tooltip: 'Pad/strings volume' }),
];

/**
 * Arranger panels
 */
const ARRANGER_PANELS: readonly CardPanel[] = [
  createPanel('transport', 'Transport', 'header', [
    ARRANGER_UI_CONTROLS[0]!,
    ARRANGER_UI_CONTROLS[1]!,
    ARRANGER_UI_CONTROLS[2]!,
    ARRANGER_UI_CONTROLS[3]!,
  ], { columns: 4 }),
  
  createPanel('master', 'Master Controls', 'main', [
    ARRANGER_UI_CONTROLS[4]!,
    ARRANGER_UI_CONTROLS[5]!,
    ARRANGER_UI_CONTROLS[6]!,
    ARRANGER_UI_CONTROLS[7]!,
  ], { columns: 4 }),
  
  createPanel('parts', 'Parts', 'main', [
    ARRANGER_UI_CONTROLS[8]!,
    ARRANGER_UI_CONTROLS[9]!,
    ARRANGER_UI_CONTROLS[10]!,
    ARRANGER_UI_CONTROLS[11]!,
    // Additional song part buttons
    createButtonControl('bridge', 'Bridge', { row: 0, col: 0, tooltip: 'Queue bridge' }),
    createButtonControl('breakdown', 'Breakdown', { row: 0, col: 1, tooltip: 'Queue breakdown' }),
    createButtonControl('buildup', 'Build-up', { row: 0, col: 2, tooltip: 'Queue buildup' }),
    createButtonControl('fill', 'Fill', { row: 0, col: 3, tooltip: 'Trigger fill' }),
  ], { columns: 4 }),
  
  createPanel('timeline', 'Timeline', 'main', [
    { id: 'song-timeline', type: 'graph', style: { size: 'md', variant: 'timeline' }, colSpan: 4, rowSpan: 2 },
  ], { columns: 4 }),
  
  createPanel('voices', 'Voice Mixer', 'sidebar', [
    ARRANGER_UI_CONTROLS[12]!,
    ARRANGER_UI_CONTROLS[13]!,
    ARRANGER_UI_CONTROLS[14]!,
    ARRANGER_UI_CONTROLS[15]!,
    createToggleControl('drums-mute', 'drumsMute', 'M', { row: 0, col: 0, tooltip: 'Mute drums' }),
    createToggleControl('bass-mute', 'bassMute', 'M', { row: 0, col: 1, tooltip: 'Mute bass' }),
    createToggleControl('keys-mute', 'keysMute', 'M', { row: 0, col: 2, tooltip: 'Mute keys' }),
    createToggleControl('pad-mute', 'padMute', 'M', { row: 0, col: 3, tooltip: 'Mute pad' }),
  ], { columns: 4 }),
  
  createPanel('chord-input', 'Chord Input', 'sidebar', [
    { id: 'chord-display', type: 'label', label: 'Current Chord', style: { size: 'lg', variant: 'chord-name' }, colSpan: 4 },
    createDropdownControl('key', 'key', 'Key', { row: 1, col: 0, colSpan: 2 }),
    createDropdownControl('mode', 'mode', 'Mode', { row: 1, col: 2, colSpan: 2 }),
  ], { columns: 4 }),
  
  createPanel('voice-leading', 'Voice Leading', 'footer', [
    createToggleControl('vl-enable', 'voiceLeading', 'Voice Leading'),
    createKnobControl('vl-max', 'maxMovement', 'Max Movement'),
    createToggleControl('common-tone', 'preferCommonTones', 'Common Tones'),
    createToggleControl('contrary', 'preferContrary', 'Contrary Motion'),
  ], { columns: 4 }),
  
  createPanel('texture', 'Texture', 'footer', [
    createDropdownControl('texture', 'textureType', 'Texture Type'),
    createKnobControl('density', 'textureDensity', 'Density'),
    createKnobControl('spread', 'textureSpread', 'Spread'),
  ], { columns: 3 }),
];

/**
 * Arranger UI configuration
 */
export const ARRANGER_UI_CONFIG: CardUIConfig = {
  ...createDefaultUIConfig('grid'),
  panels: ARRANGER_PANELS,
  minWidth: 500,
  minHeight: 450,
  maxWidth: 800,
  maxHeight: 700,
  resizable: true,
  theme: {
    ...DEFAULT_DARK_THEME,
    accent: '#673AB7',
  },
};

/**
 * Arranger parameter definitions
 */
export const ARRANGER_PARAMETERS: readonly ParameterDefinition[] = [
  // Master
  { id: 'tempo', type: 'float', label: 'Tempo', default: 120, min: 40, max: 240, unit: 'BPM', group: 'Master', automatable: true },
  { id: 'energy', type: 'float', label: 'Energy', default: 0.5, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'complexity', type: 'float', label: 'Complexity', default: 0.5, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'variation', type: 'float', label: 'Variation', default: 0.3, min: 0, max: 1, group: 'Master', automatable: true },
  
  // Style
  { id: 'style', type: 'enum', label: 'Style', default: 'pop-8beat', options: ['pop-8beat', 'jazz-swing-medium', 'cool-jazz', 'modal-jazz', 'smooth-jazz', 'jazz-waltz', 'dixieland', 'big-band-swing', 'bossa-nova', 'merengue', 'cumbia', 'bachata', 'reggaeton', 'deep-house'], group: 'Style' },
  { id: 'key', type: 'enum', label: 'Key', default: 'C', options: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], group: 'Style' },
  { id: 'mode', type: 'enum', label: 'Mode', default: 'major', options: ['major', 'minor', 'dorian', 'mixolydian', 'lydian', 'phrygian'], group: 'Style' },
  
  // Voice volumes
  { id: 'drumsVolume', type: 'float', label: 'Drums Volume', default: 0.8, min: 0, max: 1, group: 'Voices', automatable: true },
  { id: 'bassVolume', type: 'float', label: 'Bass Volume', default: 0.75, min: 0, max: 1, group: 'Voices', automatable: true },
  { id: 'keysVolume', type: 'float', label: 'Keys Volume', default: 0.7, min: 0, max: 1, group: 'Voices', automatable: true },
  { id: 'padVolume', type: 'float', label: 'Pad Volume', default: 0.5, min: 0, max: 1, group: 'Voices', automatable: true },
  
  // Voice mutes
  { id: 'drumsMute', type: 'bool', label: 'Drums Mute', default: false, group: 'Voices' },
  { id: 'bassMute', type: 'bool', label: 'Bass Mute', default: false, group: 'Voices' },
  { id: 'keysMute', type: 'bool', label: 'Keys Mute', default: false, group: 'Voices' },
  { id: 'padMute', type: 'bool', label: 'Pad Mute', default: false, group: 'Voices' },
  
  // Voice leading
  { id: 'voiceLeading', type: 'bool', label: 'Voice Leading', default: true, group: 'Voice Leading' },
  { id: 'maxMovement', type: 'int', label: 'Max Movement', default: 7, min: 1, max: 12, unit: 'st', group: 'Voice Leading' },
  { id: 'preferCommonTones', type: 'bool', label: 'Prefer Common Tones', default: true, group: 'Voice Leading' },
  { id: 'preferContrary', type: 'bool', label: 'Prefer Contrary Motion', default: true, group: 'Voice Leading' },
  
  // Texture
  { id: 'textureType', type: 'enum', label: 'Texture', default: 'homophonic', options: ['monophonic', 'homophonic', 'polyphonic', 'heterophonic', 'ostinato', 'antiphonal', 'unison', 'drone'], group: 'Texture' },
  { id: 'textureDensity', type: 'float', label: 'Texture Density', default: 0.5, min: 0, max: 1, group: 'Texture', automatable: true },
  { id: 'textureSpread', type: 'float', label: 'Texture Spread', default: 2, min: 1, max: 4, unit: 'oct', group: 'Texture' },
  
  // Fill & Ending
  { id: 'fillStyle', type: 'enum', label: 'Fill Style', default: 'simple', options: ['simple', 'building', 'breakdown', 'tom-roll', 'snare-roll', 'crash', 'syncopated'], group: 'Fill' },
  { id: 'endingStyle', type: 'enum', label: 'Ending Style', default: 'ritardando', options: ['ritardando', 'fermata', 'tag', 'cold', 'fade', 'big-finish', 'vamp-out'], group: 'Ending' },
];

/**
 * Arranger preset definitions
 */
export const ARRANGER_PRESETS: readonly PresetDefinition[] = [
  // Pop
  { id: 'pop-ballad', name: 'Pop Ballad', category: 'Pop', params: { style: 'pop-8beat', tempo: 72, energy: 0.4, complexity: 0.3 } },
  { id: 'pop-driving', name: 'Pop Driving', category: 'Pop', params: { style: 'pop-8beat', tempo: 128, energy: 0.8, complexity: 0.5 } },
  { id: 'pop-acoustic', name: 'Acoustic Pop', category: 'Pop', params: { style: 'pop-8beat', tempo: 95, energy: 0.5, padVolume: 0.2 } },
  
  // Jazz
  { id: 'jazz-medium', name: 'Medium Swing', category: 'Jazz', params: { style: 'jazz-swing-medium', tempo: 140, energy: 0.5 } },
  { id: 'jazz-uptempo', name: 'Up-Tempo Swing', category: 'Jazz', params: { style: 'jazz-swing-medium', tempo: 180, energy: 0.7 } },
  { id: 'jazz-ballad', name: 'Jazz Ballad', category: 'Jazz', params: { style: 'jazz-swing-medium', tempo: 65, energy: 0.3 } },
  { id: 'cool-jazz-mellow', name: 'Cool Jazz', category: 'Jazz', params: { style: 'cool-jazz', tempo: 110, energy: 0.35, complexity: 0.4 } },
  { id: 'modal-jazz-vamp', name: 'Modal Vamp', category: 'Jazz', params: { style: 'modal-jazz', tempo: 100, energy: 0.4, complexity: 0.3 } },
  { id: 'smooth-jazz-groove', name: 'Smooth Groove', category: 'Jazz', params: { style: 'smooth-jazz', tempo: 105, energy: 0.5, padVolume: 0.7 } },
  { id: 'jazz-waltz-elegant', name: 'Jazz Waltz', category: 'Jazz', params: { style: 'jazz-waltz', tempo: 140, energy: 0.55 } },
  { id: 'dixieland-traditional', name: 'Dixieland', category: 'Jazz', params: { style: 'dixieland', tempo: 180, energy: 0.8, complexity: 0.6 } },
  { id: 'big-band-swing-shout', name: 'Big Band Swing', category: 'Jazz', params: { style: 'big-band-swing', tempo: 160, energy: 0.85, complexity: 0.7 } },
  
  // Latin
  { id: 'bossa-classic', name: 'Classic Bossa', category: 'Latin', params: { style: 'bossa-nova', tempo: 120, energy: 0.4 } },
  { id: 'bossa-light', name: 'Light Bossa', category: 'Latin', params: { style: 'bossa-nova', tempo: 110, energy: 0.3, drumsVolume: 0.5 } },
  { id: 'merengue-fast', name: 'Merengue', category: 'Latin', params: { style: 'merengue', tempo: 140, energy: 0.75 } },
  { id: 'cumbia-traditional', name: 'Cumbia', category: 'Latin', params: { style: 'cumbia', tempo: 105, energy: 0.6 } },
  { id: 'bachata-romantic', name: 'Bachata', category: 'Latin', params: { style: 'bachata', tempo: 125, energy: 0.45, padVolume: 0.6 } },
  { id: 'reggaeton-dembow', name: 'Reggaeton', category: 'Latin', params: { style: 'reggaeton', tempo: 95, energy: 0.8, bassVolume: 0.95 } },
  { id: 'salsa-dura', name: 'Salsa Dura', category: 'Latin', params: { style: 'salsa', tempo: 105, energy: 0.8, complexity: 0.7 } },
  { id: 'salsa-romantica', name: 'Salsa Romantica', category: 'Latin', params: { style: 'salsa', tempo: 95, energy: 0.55, padVolume: 0.7, complexity: 0.5 } },
  { id: 'son-cubano', name: 'Son Cubano', category: 'Latin', params: { style: 'son-cubano', tempo: 90, energy: 0.6, complexity: 0.5 } },
  { id: 'mambo-big-band', name: 'Mambo', category: 'Latin', params: { style: 'mambo', tempo: 115, energy: 0.85, complexity: 0.7 } },
  { id: 'cha-cha-cha', name: 'Cha-Cha-Cha', category: 'Latin', params: { style: 'cha-cha-cha', tempo: 120, energy: 0.65 } },
  { id: 'bolero-romantic', name: 'Bolero', category: 'Latin', params: { style: 'bolero', tempo: 70, energy: 0.35, padVolume: 0.8 } },
  { id: 'tango-dramatic', name: 'Tango', category: 'Latin', params: { style: 'tango', tempo: 65, energy: 0.5, complexity: 0.6 } },
  { id: 'milonga-uptempo', name: 'Milonga', category: 'Latin', params: { style: 'milonga', tempo: 85, energy: 0.6 } },
  { id: 'samba-carnival', name: 'Samba', category: 'Latin', params: { style: 'samba', tempo: 100, energy: 0.75, complexity: 0.6 } },
  { id: 'samba-funk', name: 'Samba Funk', category: 'Latin', params: { style: 'samba', tempo: 110, energy: 0.8, complexity: 0.7, bassVolume: 0.9 } },
  
  // Electronic
  { id: 'house-deep', name: 'Deep House', category: 'Electronic', params: { style: 'deep-house', tempo: 122, energy: 0.6 } },
  { id: 'house-chill', name: 'Chill House', category: 'Electronic', params: { style: 'deep-house', tempo: 118, energy: 0.4, padVolume: 0.7 } },
  { id: 'house-driving', name: 'Driving House', category: 'Electronic', params: { style: 'deep-house', tempo: 128, energy: 0.9 } },
  
  // Texture-focused
  { id: 'orchestral-pad', name: 'Orchestral Pad', category: 'Orchestral', params: { textureType: 'polyphonic', textureDensity: 0.8, textureSpread: 3 } },
  { id: 'ambient-drone', name: 'Ambient Drone', category: 'Ambient', params: { textureType: 'drone', textureDensity: 0.3, padVolume: 0.9 } },
  { id: 'minimalist', name: 'Minimalist', category: 'Ambient', params: { textureType: 'ostinato', complexity: 0.2, variation: 0.1 } },
];

/**
 * Complete Arranger Card Definition
 */
export const ARRANGER_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'arranger',
    name: 'Auto-Arranger',
    category: 'meta',
    description: 'Intelligent arrangement generator with style presets, voice leading, and song structure',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['arranger', 'style', 'accompaniment', 'chord', 'voice-leading', 'meta', 'generator'],
  },
  {
    visuals: ARRANGER_CARD_VISUALS,
    behavior: ARRANGER_CARD_BEHAVIOR,
    ui: ARRANGER_UI_CONFIG,
    ports: {
      inputs: [
        { name: 'chord-in', type: 'Event<Note>', label: 'Chord Input', description: 'Chord/harmony input from keyboard or sequencer', optional: true },
        { name: 'trigger', type: 'trigger', label: 'Part Trigger', description: 'Trigger song parts', optional: true },
        { name: 'clock', type: 'Event<Clock>', label: 'Clock', description: 'External clock sync', optional: true },
      ],
      outputs: [
        { name: 'drums', type: 'Event<Note>', label: 'Drums Out', description: 'Drum voice output' },
        { name: 'bass', type: 'Event<Note>', label: 'Bass Out', description: 'Bass voice output' },
        { name: 'keys', type: 'Event<Note>', label: 'Keys Out', description: 'Keys/piano voice output' },
        { name: 'pad', type: 'Event<Note>', label: 'Pad Out', description: 'Pad/strings voice output' },
        { name: 'all', type: 'Event<Note>', label: 'All Out', description: 'Combined output' },
      ],
    },
    parameters: ARRANGER_PARAMETERS,
    presets: ARRANGER_PRESETS,
  }
);

// ============================================================================
// CHORD SUBSTITUTION & REHARMONIZATION
// ============================================================================

/**
 * Chord substitution type
 */
export type SubstitutionType = 
  | 'tritone' // Tritone substitution (V7 → bII7)
  | 'relative' // Relative major/minor
  | 'parallel' // Parallel major/minor
  | 'secondary' // Secondary dominants (V7/X)
  | 'diminished' // Diminished passing chords
  | 'modal-interchange' // Modal interchange (borrowed chords)
  | 'coltrane' // Coltrane changes (III7 → bIII7 → I)
  | 'extended' // Extended harmony (9th, 11th, 13th)
  | 'simplified'; // Simplify to triads

/**
 * Chord substitution configuration
 */
export interface ChordSubstitutionConfig {
  /** Type of substitution */
  readonly type: SubstitutionType;
  /** Strength 0-1 (how adventurous) */
  readonly strength: number;
  /** Whether to preserve bass line */
  readonly preserveBass: boolean;
  /** Whether to preserve voice leading */
  readonly preserveVoiceLeading: boolean;
  /** Target complexity (triads, 7ths, 9ths, etc.) */
  readonly targetComplexity: 'triads' | '7ths' | '9ths' | '11ths' | '13ths';
}

/**
 * Apply chord substitution to a chord
 */
export function substituteChord(
  chord: RecognizedChord,
  _key: number,
  config: ChordSubstitutionConfig
): RecognizedChord[] {
  const alternatives: RecognizedChord[] = [];
  
  switch (config.type) {
    case 'tritone':
      // Tritone substitution: bII7 for V7
      if (chord.quality === 'dom7') {
        const newRoot = (chord.root + 6) % 12; // Up a tritone
        alternatives.push({
          root: newRoot,
          quality: 'dom7',
          ...(config.preserveBass && chord.bass !== undefined ? { bass: chord.bass } : {}),
          extensions: chord.extensions,
          alterations: [],
          sourceNotes: [],
          symbol: `${NOTE_NAMES[newRoot]}7`,
        });
      }
      break;
      
    case 'relative':
      // Relative major/minor substitution
      if (chord.quality === 'major') {
        const relativeMinor = (chord.root + 9) % 12; // Up a major 6th
        alternatives.push({
          root: relativeMinor,
          quality: 'minor',
          ...(config.preserveBass && chord.bass !== undefined ? { bass: chord.bass } : {}),
          extensions: [],
          alterations: [],
          sourceNotes: [],
          symbol: `${NOTE_NAMES[relativeMinor]}m`,
        });
      } else if (chord.quality === 'minor') {
        const relativeMajor = (chord.root + 3) % 12; // Up a minor 3rd
        alternatives.push({
          root: relativeMajor,
          quality: 'major',
          ...(config.preserveBass && chord.bass !== undefined ? { bass: chord.bass } : {}),
          extensions: [],
          alterations: [],
          sourceNotes: [],
          symbol: NOTE_NAMES[relativeMajor] ?? 'C',
        });
      }
      break;
      
    case 'secondary':
      // Secondary dominant (V7 of target chord)
      const targetRoot = (chord.root + 7) % 12; // Perfect 5th up
      alternatives.push({
        root: targetRoot,
        quality: 'dom7',
        extensions: [],
        alterations: [],
        sourceNotes: [],
        symbol: `${NOTE_NAMES[targetRoot]}7`,
      });
      break;
      
    case 'diminished':
      // Diminished passing chord
      const dimRoot = (chord.root + 1) % 12; // Half step up
      alternatives.push({
        root: dimRoot,
        quality: 'dim7',
        extensions: [],
        alterations: [],
        sourceNotes: [],
        symbol: `${NOTE_NAMES[dimRoot]}dim7`,
      });
      break;
      
    case 'modal-interchange':
      // Borrow from parallel mode
      if (chord.quality === 'major') {
        alternatives.push({
          root: chord.root,
          quality: 'minor',
          ...(chord.bass !== undefined ? { bass: chord.bass } : {}),
          extensions: chord.extensions,
          alterations: [],
          sourceNotes: [],
          symbol: `${NOTE_NAMES[chord.root]}m`,
        });
      }
      break;
      
    case 'extended':
      // Add extensions based on target complexity
      const newQuality: ChordQuality = 
        config.targetComplexity === '9ths' ? (chord.quality === 'minor' ? 'min9' : '9') :
        config.targetComplexity === '13ths' ? (chord.quality === 'minor' ? 'min13' : '13') :
        chord.quality === 'minor' ? 'min7' : 'maj7';
      
      alternatives.push({
        root: chord.root,
        quality: newQuality,
        ...(chord.bass !== undefined ? { bass: chord.bass } : {}),
        extensions: config.targetComplexity === '9ths' ? [9] : 
                   config.targetComplexity === '13ths' ? [9, 11, 13] : [],
        alterations: chord.alterations,
        sourceNotes: [],
        symbol: `${NOTE_NAMES[chord.root]}${newQuality}`,
      });
      break;
      
    case 'simplified':
      // Simplify to basic triad
      const basicQuality: ChordQuality = 
        chord.quality.includes('min') ? 'minor' : 
        chord.quality.includes('dim') ? 'diminished' :
        chord.quality.includes('aug') ? 'augmented' : 'major';
      
      alternatives.push({
        root: chord.root,
        quality: basicQuality,
        ...(chord.bass !== undefined ? { bass: chord.bass } : {}),
        extensions: [],
        alterations: [],
        sourceNotes: [],
        symbol: `${NOTE_NAMES[chord.root]}${basicQuality === 'minor' ? 'm' : basicQuality === 'major' ? '' : basicQuality}`,
      });
      break;
  }
  
  return alternatives;
}

// ============================================================================
// PASSING CHORDS
// ============================================================================

/**
 * Passing chord configuration
 */
export interface PassingChordConfig {
  /** Chromatic vs diatonic passing chords */
  readonly type: 'chromatic' | 'diatonic';
  /** Density: how many passing chords to add (0-1) */
  readonly density: number;
  /** Where to place: 'between' | 'before' | 'after' */
  readonly placement: 'between' | 'before' | 'after';
  /** Duration of passing chord relative to target (0.25 = quarter duration) */
  readonly duration: number;
}

/**
 * Generate passing chords between two chords
 */
export function generatePassingChords(
  fromChord: RecognizedChord,
  toChord: RecognizedChord,
  config: PassingChordConfig
): RecognizedChord[] {
  const passingChords: RecognizedChord[] = [];
  
  if (config.density === 0) {
    return passingChords;
  }
  
  // Calculate chromatic distance
  const distance = Math.abs(toChord.root - fromChord.root);
  const direction = toChord.root > fromChord.root ? 1 : -1;
  
  if (config.type === 'chromatic') {
    // Add chromatic passing chords (half-step approaches)
    if (distance > 1) {
      const passingRoot = (toChord.root - direction + 12) % 12;
      passingChords.push({
        root: passingRoot,
        quality: 'dim7', // Diminished 7th is common passing chord
        extensions: [],
        alterations: [],
        sourceNotes: [],
        symbol: `${NOTE_NAMES[passingRoot]}dim7`,
      });
    }
  } else {
    // Diatonic passing chord
    // Use the V7 of the target as a common diatonic approach
    const dominantRoot = (toChord.root + 7) % 12;
    passingChords.push({
      root: dominantRoot,
      quality: 'dom7',
      extensions: [],
      alterations: [],
      sourceNotes: [],
      symbol: `${NOTE_NAMES[dominantRoot]}7`,
    });
  }
  
  return passingChords;
}

// ============================================================================
// PEDAL TONES
// ============================================================================

/**
 * Pedal tone configuration
 */
export interface PedalToneConfig {
  /** Pedal note (0-11, C=0) */
  readonly note: number;
  /** Duration in beats */
  readonly duration: number;
  /** Whether pedal is in bass (true) or soprano (false) */
  readonly inBass: boolean;
  /** Rhythm pattern for pedal */
  readonly rhythm: 'sustained' | 'repeated' | 'pulsing';
}

/**
 * Apply pedal tone to a chord progression
 */
export function applyPedalTone(
  chord: RecognizedChord,
  config: PedalToneConfig
): RecognizedChord {
  if (config.inBass) {
    // Pedal in bass - set bass note to pedal, keep upper structure
    return {
      ...chord,
      bass: config.note,
      symbol: `${chord.symbol}/${NOTE_NAMES[config.note]}`,
    };
  } else {
    // Pedal in soprano - add pedal to extensions
    return chord; // Upper pedal tones are handled at voice level
  }
}

// ============================================================================
// ANTICIPATION
// ============================================================================

/**
 * Anticipation configuration
 */
export interface AnticipationConfig {
  /** How many beats early to anticipate (0.25 = sixteenth note early) */
  readonly amount: number;
  /** Probability of anticipation (0-1) */
  readonly probability: number;
  /** Whether to anticipate chord changes */
  readonly chordChanges: boolean;
  /** Whether to anticipate melody notes */
  readonly melodyNotes: boolean;
}

/**
 * Apply anticipation to timing
 */
export function applyAnticipation(
  originalTick: number,
  config: AnticipationConfig,
  random: () => number = Math.random
): number {
  if (random() > config.probability) {
    return originalTick;
  }
  
  // Anticipate by the specified amount (in beats, convert to ticks)
  const ticksPerBeat = 480; // Standard PPQ
  const anticipationTicks = config.amount * ticksPerBeat;
  
  return Math.max(0, originalTick - anticipationTicks);
}

// ============================================================================
// HARMONIC TENSION
// ============================================================================

/**
 * Harmonic tension control
 */
export interface HarmonicTensionConfig {
  /** Target tension level (0 = consonant, 1 = very dissonant) */
  readonly targetTension: number;
  /** Whether to resolve tension at phrase ends */
  readonly resolveAtEnds: boolean;
  /** Tension curve shape */
  readonly curve: 'linear' | 'rising' | 'falling' | 'arch' | 'trough';
}

/**
 * Calculate tension score for a chord (0 = consonant, 1 = dissonant)
 */
export function calculateChordTension(chord: RecognizedChord): number {
  let tension = 0;
  
  // Base tension from quality
  const qualityTension: Record<ChordQuality, number> = {
    'major': 0, 'minor': 0.1, 'power': 0,
    'dom7': 0.3, 'maj7': 0.1, 'min7': 0.15,
    'sus2': 0.2, 'sus4': 0.25,
    'diminished': 0.6, 'dim7': 0.7, 'hdim7': 0.5,
    'augmented': 0.55, 'aug7': 0.65,
    '6': 0.05, 'min6': 0.1,
    '9': 0.35, 'min9': 0.3, 'maj9': 0.2,
    '11': 0.4, 'min11': 0.35,
    '13': 0.45, 'min13': 0.4,
    'add9': 0.15, 'add11': 0.3,
  };
  
  tension = qualityTension[chord.quality] || 0;
  
  // Add tension for extensions
  tension += chord.extensions.length * 0.1;
  
  // Add tension for alterations
  tension += chord.alterations.length * 0.15;
  
  // Add tension for slash chords (inversions)
  if (chord.bass !== undefined && chord.bass !== chord.root) {
    tension += 0.1;
  }
  
  return Math.min(1, tension);
}

/**
 * Adjust chord to match target tension
 */
export function adjustChordTension(
  chord: RecognizedChord,
  targetTension: number
): RecognizedChord {
  const currentTension = calculateChordTension(chord);
  
  if (Math.abs(currentTension - targetTension) < 0.1) {
    return chord; // Close enough
  }
  
  if (targetTension > currentTension) {
    // Increase tension: add extensions or alterations
    const newExtensions = [...chord.extensions];
    if (targetTension > 0.3 && !newExtensions.includes(9)) {
      newExtensions.push(9);
    }
    if (targetTension > 0.5 && !newExtensions.includes(11)) {
      newExtensions.push(11);
    }
    
    return { ...chord, extensions: newExtensions };
  } else {
    // Decrease tension: simplify
    return {
      ...chord,
      extensions: [],
      alterations: [],
      quality: chord.quality.includes('min') ? 'minor' : 'major',
    };
  }
}

// ============================================================================
// CHORD COMPLEXITY
// ============================================================================

/**
 * Adjust chord complexity (triads → 13ths)
 */
export function adjustChordComplexity(
  chord: RecognizedChord,
  targetComplexity: 'triads' | '7ths' | '9ths' | '11ths' | '13ths'
): RecognizedChord {
  switch (targetComplexity) {
    case 'triads':
      return {
        ...chord,
        quality: chord.quality.includes('min') ? 'minor' : 'major',
        extensions: [],
        alterations: [],
      };
      
    case '7ths':
      const seventh: ChordQuality = 
        chord.quality.includes('maj') ? 'maj7' :
        chord.quality.includes('min') ? 'min7' :
        chord.quality.includes('dim') ? 'dim7' : 'dom7';
      return {
        ...chord,
        quality: seventh,
        extensions: [],
      };
      
    case '9ths':
      const ninth: ChordQuality = 
        chord.quality.includes('maj') ? 'maj9' :
        chord.quality.includes('min') ? 'min9' : '9';
      return {
        ...chord,
        quality: ninth,
        extensions: [9],
      };
      
    case '11ths':
      const eleventh: ChordQuality = 
        chord.quality.includes('min') ? 'min11' : '11';
      return {
        ...chord,
        quality: eleventh,
        extensions: [9, 11],
      };
      
    case '13ths':
      const thirteenth: ChordQuality = 
        chord.quality.includes('min') ? 'min13' : '13';
      return {
        ...chord,
        quality: thirteenth,
        extensions: [9, 11, 13],
      };
      
    default:
      return chord;
  }
}

// ============================================================================
// CHORD COLOR (MAJOR/MINOR/MODAL SUGGESTIONS)
// ============================================================================

/**
 * Chord color mode for recoloring suggestions
 */
export type ChordColorMode = 
  | 'major'       // Brighten to major
  | 'minor'       // Darken to minor
  | 'dorian'      // Modal minor with major 6th
  | 'mixolydian'  // Modal major with minor 7th
  | 'lydian'      // Modal major with raised 4th
  | 'phrygian'    // Modal minor with lowered 2nd
  | 'locrian';    // Diminished color

/**
 * Chord color configuration
 */
export interface ChordColorConfig {
  /** Target color mode */
  readonly mode: ChordColorMode;
  /** Preserve bass note */
  readonly preserveBass: boolean;
  /** Preserve chord function (tonic/dominant/etc) */
  readonly preserveFunction: boolean;
}

/**
 * Suggest chord color variations (major/minor/modal)
 * Returns array of alternative chord colors
 */
export function suggestChordColors(
  chord: RecognizedChord,
  _key: number,
  config: ChordColorConfig
): readonly RecognizedChord[] {
  const suggestions: RecognizedChord[] = [];
  const root = chord.root;
  const bass = config.preserveBass ? chord.bass : root;
  
  switch (config.mode) {
    case 'major':
      // Brighten to major variants
      if (chord.quality.includes('min')) {
        suggestions.push({
          root,
          quality: 'major',
          ...(bass !== undefined ? { bass } : {}),
          extensions: [],
          alterations: [],
          sourceNotes: [],
          symbol: NOTE_NAMES[root] ?? 'C',
        });
        suggestions.push({
          root,
          quality: 'maj7',
          ...(bass !== undefined ? { bass } : {}),
          extensions: [7],
          alterations: [],
          sourceNotes: [],
          symbol: (NOTE_NAMES[root] ?? 'C') + 'maj7',
        });
      }
      break;
      
    case 'minor':
      // Darken to minor variants
      if (!chord.quality.includes('min') && !chord.quality.includes('dim')) {
        suggestions.push({
          root,
          quality: 'minor',
          ...(bass !== undefined ? { bass } : {}),
          extensions: [],
          alterations: [],
          sourceNotes: [],
          symbol: (NOTE_NAMES[root] ?? 'C') + 'm',
        });
        suggestions.push({
          root,
          quality: 'min7',
          ...(bass !== undefined ? { bass } : {}),
          extensions: [7],
          alterations: [],
          sourceNotes: [],
          symbol: (NOTE_NAMES[root] ?? 'C') + 'm7',
        });
      }
      break;
      
    case 'dorian':
      // Dorian: minor with major 6th
      suggestions.push({
        root,
        quality: 'min6',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [6],
        alterations: [],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'm6',
      });
      suggestions.push({
        root,
        quality: 'min7',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [6, 9],
        alterations: [],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'm9(add6)',
      });
      break;
      
    case 'mixolydian':
      // Mixolydian: major with minor 7th
      suggestions.push({
        root,
        quality: 'dom7',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [7],
        alterations: [],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + '7',
      });
      suggestions.push({
        root,
        quality: '9',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [7, 9],
        alterations: [],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + '9',
      });
      break;
      
    case 'lydian':
      // Lydian: major with raised 4th (sharp 11)
      suggestions.push({
        root,
        quality: 'maj7',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [7],
        alterations: ['#11'],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'maj7(#11)',
      });
      suggestions.push({
        root,
        quality: 'maj9',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [7, 9],
        alterations: ['#11'],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'maj9(#11)',
      });
      break;
      
    case 'phrygian':
      // Phrygian: minor with lowered 2nd (flat 9)
      suggestions.push({
        root,
        quality: 'minor',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [],
        alterations: ['b9'],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'm(b9)',
      });
      suggestions.push({
        root,
        quality: 'min7',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [7],
        alterations: ['b9'],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'm7(b9)',
      });
      break;
      
    case 'locrian':
      // Locrian: diminished quality
      suggestions.push({
        root,
        quality: 'diminished',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [],
        alterations: [],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'dim',
      });
      suggestions.push({
        root,
        quality: 'dim7',
        ...(bass !== undefined ? { bass } : {}),
        extensions: [7],
        alterations: [],
        sourceNotes: [],
        symbol: (NOTE_NAMES[root] ?? 'C') + 'dim7',
      });
      break;
  }
  
  return suggestions;
}

/**
 * Auto-suggest best chord colors based on context
 * Analyzes preceding and following chords to suggest appropriate colors
 */
export function autoSuggestChordColors(
  chord: RecognizedChord,
  precedingChord: RecognizedChord | null,
  _followingChord: RecognizedChord | null,
  key: number
): readonly RecognizedChord[] {
  const suggestions: RecognizedChord[] = [];
  
  // If currently major and following a minor, suggest lydian (bright)
  if (precedingChord?.quality.includes('min') && !chord.quality.includes('min')) {
    suggestions.push(...suggestChordColors(chord, key, {
      mode: 'lydian',
      preserveBass: true,
      preserveFunction: true,
    }));
  }
  
  // If currently minor and following a major, suggest dorian (less dark)
  if (precedingChord && !precedingChord.quality.includes('min') && chord.quality.includes('min')) {
    suggestions.push(...suggestChordColors(chord, key, {
      mode: 'dorian',
      preserveBass: true,
      preserveFunction: true,
    }));
  }
  
  // If dominant-function chord (V), suggest mixolydian colors
  const degreeFromKey = (chord.root - key + 12) % 12;
  if (degreeFromKey === 7) { // Perfect 5th above key = dominant
    suggestions.push(...suggestChordColors(chord, key, {
      mode: 'mixolydian',
      preserveBass: true,
      preserveFunction: true,
    }));
  }
  
  // If no specific context, suggest both brightening and darkening
  if (suggestions.length === 0) {
    if (chord.quality.includes('min')) {
      suggestions.push(...suggestChordColors(chord, key, {
        mode: 'major',
        preserveBass: true,
        preserveFunction: false,
      }));
      suggestions.push(...suggestChordColors(chord, key, {
        mode: 'dorian',
        preserveBass: true,
        preserveFunction: true,
      }));
    } else {
      suggestions.push(...suggestChordColors(chord, key, {
        mode: 'minor',
        preserveBass: true,
        preserveFunction: false,
      }));
      suggestions.push(...suggestChordColors(chord, key, {
        mode: 'mixolydian',
        preserveBass: true,
        preserveFunction: true,
      }));
    }
  }
  
  // Remove duplicates and limit to top 4 suggestions
  const unique = suggestions.filter((s, i, arr) => 
    arr.findIndex(t => t.symbol === s.symbol) === i
  );
  
  return unique.slice(0, 4);
}

// ============================================================================
// TENSION RESOLVER
// ============================================================================

/**
 * Resolve suspended or tension chords
 */
export function resolveTensionChord(chord: RecognizedChord): RecognizedChord {
  // Resolve sus4 → major
  if (chord.quality === 'sus4') {
    return {
      ...chord,
      quality: 'major',
      symbol: NOTE_NAMES[chord.root] ?? 'C',
    };
  }
  
  // Resolve sus2 → major
  if (chord.quality === 'sus2') {
    return {
      ...chord,
      quality: 'major',
      symbol: NOTE_NAMES[chord.root] ?? 'C',
    };
  }
  
  // Resolve dominant 7 → tonic (down a perfect 5th)
  if (chord.quality === 'dom7') {
    const tonicRoot = (chord.root + 5) % 12;
    return {
      root: tonicRoot,
      quality: 'major',
      extensions: [],
      alterations: [],
      sourceNotes: [],
      symbol: NOTE_NAMES[tonicRoot] ?? 'C',
    };
  }
  
  // Resolve diminished → nearby major/minor
  if (chord.quality === 'dim7' || chord.quality === 'diminished') {
    const resolvedRoot = (chord.root + 1) % 12; // Up half step
    return {
      root: resolvedRoot,
      quality: 'minor',
      extensions: [],
      alterations: [],
      sourceNotes: [],
      symbol: `${NOTE_NAMES[resolvedRoot] ?? 'C'}m`,
    };
  }
  
  return chord; // No tension to resolve
}

// ============================================================================
// MELODY HARMONIZER
// ============================================================================

/**
 * Harmony type for melody harmonization
 */
export type HarmonyType = 
  | 'thirds' // Parallel thirds (common in pop)
  | 'sixths' // Parallel sixths (common in country)
  | 'fourths' // Parallel fourths (modern sound)
  | 'fifths' // Parallel fifths (power chord sound)
  | 'octaves' // Parallel octaves (doubling)
  | 'diatonic-thirds' // Scale-aware thirds
  | 'chromatic' // Chromatic harmony
  | 'four-part'; // Four-part harmony (SATB)

/**
 * Melody harmonization configuration
 */
export interface MelodyHarmonizerConfig {
  /** Type of harmony */
  readonly type: HarmonyType;
  /** Number of harmony voices (1-3) */
  readonly voices: number;
  /** Scale context for diatonic harmonies */
  readonly scale?: readonly number[];
  /** Current chord for chord-tone harmony */
  readonly chord?: RecognizedChord;
  /** Whether to stay below melody (true) or above (false) */
  readonly below: boolean;
}

/**
 * Harmonize a melody note
 */
export function harmonizeMelody(
  melodyNote: number,
  config: MelodyHarmonizerConfig
): readonly number[] {
  const harmony: number[] = [];
  
  switch (config.type) {
    case 'thirds':
      // Parallel thirds (3 or 4 semitones)
      for (let i = 0; i < config.voices; i++) {
        const interval = config.below ? -3 : 3;
        harmony.push(melodyNote + interval * (i + 1));
      }
      break;
      
    case 'sixths':
      // Parallel sixths (8 or 9 semitones)
      for (let i = 0; i < config.voices; i++) {
        const interval = config.below ? -9 : 9;
        harmony.push(melodyNote + interval * (i + 1));
      }
      break;
      
    case 'fourths':
      // Parallel fourths (5 semitones)
      for (let i = 0; i < config.voices; i++) {
        const interval = config.below ? -5 : 5;
        harmony.push(melodyNote + interval * (i + 1));
      }
      break;
      
    case 'fifths':
      // Parallel fifths (7 semitones)
      for (let i = 0; i < config.voices; i++) {
        const interval = config.below ? -7 : 7;
        harmony.push(melodyNote + interval * (i + 1));
      }
      break;
      
    case 'octaves':
      // Parallel octaves (12 semitones)
      for (let i = 0; i < config.voices; i++) {
        const interval = config.below ? -12 : 12;
        harmony.push(melodyNote + interval * (i + 1));
      }
      break;
      
    case 'diatonic-thirds':
      // Scale-aware thirds
      if (config.scale && config.scale.length > 0) {
        const melodyPc = melodyNote % 12;
        const scaleIndex = config.scale.indexOf(melodyPc);
        if (scaleIndex >= 0) {
          // Third above/below in scale
          const thirdIndex = config.below ? 
            (scaleIndex - 2 + config.scale.length) % config.scale.length :
            (scaleIndex + 2) % config.scale.length;
          const thirdPc = config.scale[thirdIndex] ?? 0;
          const octaveAdjust = config.below && thirdPc > melodyPc ? -12 : 
                              !config.below && thirdPc < melodyPc ? 12 : 0;
          harmony.push(melodyNote - melodyPc + thirdPc + octaveAdjust);
        }
      }
      break;
      
    case 'four-part':
      // Four-part harmony using chord tones
      if (config.chord) {
        const chordTones = getChordTones(config.chord);
        // Find closest chord tones below melody
        for (let i = 0; i < Math.min(3, config.voices); i++) {
          const baseNote = melodyNote - (i + 1) * 3; // Start 3 semitones below
          const closestChordTone = chordTones.reduce((closest, tone) => {
            const candidate = baseNote - (baseNote % 12) + tone;
            return Math.abs(candidate - baseNote) < Math.abs(closest - baseNote) ? candidate : closest;
          }, melodyNote);
          harmony.push(closestChordTone);
        }
      }
      break;
  }
  
  return harmony;
}

// ============================================================================
// SCHEMA-BASED ACCOMPANIMENT (C309)
// ============================================================================

/**
 * Schema accompaniment pattern definition
 */
export interface SchemaAccompanimentPattern {
  /** Schema name this pattern is for */
  readonly schemaName: string;
  /** Bass pattern (scale degrees relative to chord root) */
  readonly bassPattern: readonly number[];
  /** Bass rhythm (beat positions in bar) */
  readonly bassRhythm: readonly number[];
  /** Chord voicing pattern */
  readonly chordVoicings: readonly ChordVoicing[];
  /** Chord rhythm (beat positions) */
  readonly chordRhythm: readonly number[];
  /** Optional arpeggiation pattern */
  readonly arpPattern?: readonly number[];
  /** Style compatibility */
  readonly styles: readonly ArrangerStyle[];
}

/**
 * Chord voicing type
 */
export interface ChordVoicing {
  readonly intervals: readonly number[]; // From bass
  readonly spread: 'close' | 'open' | 'drop2' | 'drop3';
  readonly inversion: 0 | 1 | 2 | 3;
}

/**
 * Schema accompaniment library - common galant schema patterns
 */
export const SCHEMA_ACCOMPANIMENT_PATTERNS: readonly SchemaAccompanimentPattern[] = [
  // Romanesca (I-V-vi-III) 
  {
    schemaName: 'romanesca',
    bassPattern: [0, 4, 5, 2], // 1-5-6-3 scale degrees
    bassRhythm: [0, 1, 2, 3], // One per beat
    chordVoicings: [
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 1 },
      { intervals: [0, 3, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
    ],
    chordRhythm: [0, 1, 2, 3],
    styles: ['pop', 'classical', 'baroque'],
  },
  // Monte (ascending sequence)
  {
    schemaName: 'monte',
    bassPattern: [0, 4, 2, 5], // Ascending bass
    bassRhythm: [0, 1, 2, 3],
    chordVoicings: [
      { intervals: [0, 3, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 3, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
    ],
    chordRhythm: [0, 1, 2, 3],
    styles: ['classical', 'baroque'],
  },
  // Prinner (descending 6-5 sequence)
  {
    schemaName: 'prinner',
    bassPattern: [5, 4, 3, 2], // 6-5-4-3 descending
    bassRhythm: [0, 1, 2, 3],
    chordVoicings: [
      { intervals: [0, 4, 7], spread: 'close', inversion: 1 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 3, 7], spread: 'close', inversion: 1 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
    ],
    chordRhythm: [0, 1, 2, 3],
    styles: ['classical', 'baroque'],
  },
  // Fonte (modulating sequence)
  {
    schemaName: 'fonte',
    bassPattern: [1, 4, 0, 3], // Modulating pattern
    bassRhythm: [0, 1, 2, 3],
    chordVoicings: [
      { intervals: [0, 3, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 3, 7], spread: 'close', inversion: 0 },
      { intervals: [0, 4, 7], spread: 'close', inversion: 0 },
    ],
    chordRhythm: [0, 1, 2, 3],
    styles: ['classical', 'baroque'],
  },
];

/**
 * Get accompaniment pattern for a schema
 */
export function getSchemaAccompanimentPattern(
  schemaName: string,
  style?: ArrangerStyle
): SchemaAccompanimentPattern | undefined {
  const patterns = SCHEMA_ACCOMPANIMENT_PATTERNS.filter(p => 
    p.schemaName.toLowerCase() === schemaName.toLowerCase()
  );
  
  if (style) {
    const styleMatch = patterns.find(p => p.styles.includes(style));
    if (styleMatch) return styleMatch;
  }
  
  return patterns[0];
}

/**
 * Generate accompaniment from schema constraint.
 * 
 * This is the C309 integration: arranger uses schema to generate accompaniment patterns.
 */
export function generateSchemaAccompaniment(
  schemaName: string,
  key: number,
  style: ArrangerStyle,
  energy: number
): {
  readonly bassNotes: readonly { note: number; beat: number; velocity: number }[];
  readonly chordNotes: readonly { notes: readonly number[]; beat: number; velocity: number }[];
} {
  const pattern = getSchemaAccompanimentPattern(schemaName, style);
  
  if (!pattern) {
    return { bassNotes: [], chordNotes: [] };
  }
  
  // Generate bass notes from pattern
  const bassNotes = pattern.bassPattern.map((degree, idx) => {
    const scaleDegreeToSemitone = [0, 2, 4, 5, 7, 9, 11]; // Major scale
    const semitone = scaleDegreeToSemitone[degree % 7] ?? 0;
    return {
      note: key + semitone + 36, // Bass octave (C2 = 36)
      beat: pattern.bassRhythm[idx] ?? 0,
      velocity: Math.round(80 + energy * 40), // 80-120 velocity range
    };
  });
  
  // Generate chord voicings from pattern
  const chordNotes = pattern.chordVoicings.map((voicing, idx) => {
    const bassNote = bassNotes[idx]?.note ?? key + 48;
    const notes = voicing.intervals.map(interval => bassNote + 12 + interval); // Chord octave above bass
    return {
      notes,
      beat: pattern.chordRhythm[idx] ?? 0,
      velocity: Math.round(60 + energy * 30), // 60-90 velocity range
    };
  });
  
  return { bassNotes, chordNotes };
}

// ============================================================================
// SCENE ARC TEMPLATES (C453)
// ============================================================================

/**
 * Scene arc template - maps song parts to dramatic arcs
 */
export interface SceneArcTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Song parts to arc intensity mapping */
  readonly partIntensity: ReadonlyMap<SongPartType, number>;
  /** Suggested mood for each part */
  readonly partMoods: ReadonlyMap<SongPartType, string>;
  /** Style compatibility */
  readonly genres: readonly string[];
}

/**
 * Predefined scene arc templates
 */
export const SCENE_ARC_TEMPLATES: readonly SceneArcTemplate[] = [
  {
    id: 'hero-journey',
    name: 'Hero Journey',
    description: 'Classic 3-act structure with rising action and climax',
    partIntensity: new Map([
      ['intro', 0.2],
      ['verse', 0.4],
      ['pre-chorus', 0.6],
      ['chorus', 0.9],
      ['bridge', 0.7],
      ['outro', 0.3],
    ]),
    partMoods: new Map([
      ['intro', 'wonder'],
      ['verse', 'tender'],
      ['pre-chorus', 'mystery'],
      ['chorus', 'heroic'],
      ['bridge', 'ominous'],
      ['outro', 'tender'],
    ]),
    genres: ['film', 'orchestral', 'pop'],
  },
  {
    id: 'tension-release',
    name: 'Tension & Release',
    description: 'Building tension with cathartic release',
    partIntensity: new Map([
      ['intro', 0.3],
      ['verse', 0.5],
      ['pre-chorus', 0.7],
      ['chorus', 1.0],
      ['breakdown', 0.3],
      ['drop', 1.0],
      ['outro', 0.4],
    ]),
    partMoods: new Map([
      ['intro', 'mystery'],
      ['verse', 'ominous'],
      ['pre-chorus', 'action'],
      ['chorus', 'heroic'],
      ['breakdown', 'tender'],
      ['drop', 'action'],
      ['outro', 'wonder'],
    ]),
    genres: ['edm', 'trailer', 'action'],
  },
  {
    id: 'emotional-arc',
    name: 'Emotional Arc',
    description: 'Slow build to emotional peak',
    partIntensity: new Map([
      ['intro', 0.1],
      ['verse', 0.3],
      ['pre-chorus', 0.5],
      ['chorus', 0.7],
      ['bridge', 0.9],
      ['outro', 0.2],
    ]),
    partMoods: new Map([
      ['intro', 'tender'],
      ['verse', 'sorrow'],
      ['pre-chorus', 'tender'],
      ['chorus', 'wonder'],
      ['bridge', 'heroic'],
      ['outro', 'tender'],
    ]),
    genres: ['ballad', 'drama', 'film'],
  },
];

/**
 * Get scene arc template by ID
 */
export function getSceneArcTemplate(id: string): SceneArcTemplate | undefined {
  return SCENE_ARC_TEMPLATES.find(t => t.id === id);
}

/**
 * Map song parts to scene arc intensity.
 * 
 * This is the C453 integration: arranger song parts map to scene arc templates.
 */
export function mapSongPartsToSceneArc(
  parts: readonly SongPart[],
  template: SceneArcTemplate
): readonly { part: SongPart; intensity: number; mood: string }[] {
  return parts.map(part => ({
    part,
    intensity: template.partIntensity.get(part.type) ?? 0.5,
    mood: template.partMoods.get(part.type) ?? 'neutral',
  }));
}

// ============================================================================
// ORCHESTRATION BUDGET MODEL (C454)
// ============================================================================

/**
 * Orchestration budget - CPU/voice constraints
 */
export interface OrchestrationBudget {
  /** Maximum simultaneous voices */
  readonly maxVoices: number;
  /** Maximum CPU usage (0-1) */
  readonly maxCpuPercent: number;
  /** Budget per voice type */
  readonly voiceBudgets: ReadonlyMap<string, number>;
  /** Priority order for voice types */
  readonly voicePriority: readonly string[];
}

/**
 * Orchestration budget presets
 */
export const ORCHESTRATION_BUDGETS: Record<string, OrchestrationBudget> = {
  'minimal': {
    maxVoices: 4,
    maxCpuPercent: 0.2,
    voiceBudgets: new Map([
      ['bass', 1], ['drums', 1], ['piano', 1], ['melody', 1]
    ]),
    voicePriority: ['bass', 'drums', 'piano', 'melody'],
  },
  'standard': {
    maxVoices: 8,
    maxCpuPercent: 0.5,
    voiceBudgets: new Map([
      ['bass', 1], ['drums', 2], ['piano', 1], ['guitar', 1],
      ['strings', 1], ['melody', 1], ['pad', 1]
    ]),
    voicePriority: ['bass', 'drums', 'melody', 'piano', 'guitar', 'strings', 'pad'],
  },
  'full': {
    maxVoices: 16,
    maxCpuPercent: 0.8,
    voiceBudgets: new Map([
      ['bass', 1], ['drums', 3], ['piano', 2], ['guitar', 2],
      ['strings', 4], ['brass', 2], ['melody', 1], ['pad', 1]
    ]),
    voicePriority: ['bass', 'drums', 'melody', 'strings', 'brass', 'piano', 'guitar', 'pad'],
  },
};

/**
 * Voice allocation result
 */
export interface VoiceAllocation {
  readonly voice: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly reason?: string;
}

/**
 * Allocate voices within orchestration budget.
 * 
 * This is the C454 integration: orchestration budget model to keep arrangements feasible.
 */
export function allocateVoicesWithinBudget(
  requestedVoices: readonly string[],
  budget: OrchestrationBudget
): VoiceAllocation[] {
  const allocations: VoiceAllocation[] = [];
  let usedVoices = 0;
  
  // Sort by priority
  const sortedVoices = [...requestedVoices].sort((a, b) => {
    const aPriority = budget.voicePriority.indexOf(a);
    const bPriority = budget.voicePriority.indexOf(b);
    return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
  });
  
  for (const voice of sortedVoices) {
    const voiceCost = budget.voiceBudgets.get(voice) ?? 1;
    const priority = budget.voicePriority.indexOf(voice);
    
    if (usedVoices + voiceCost <= budget.maxVoices) {
      allocations.push({
        voice,
        enabled: true,
        priority: priority === -1 ? 999 : priority,
      });
      usedVoices += voiceCost;
    } else {
      allocations.push({
        voice,
        enabled: false,
        priority: priority === -1 ? 999 : priority,
        reason: `Voice budget exceeded (${usedVoices}/${budget.maxVoices})`,
      });
    }
  }
  
  return allocations;
}

// ============================================================================
// CARNATIC ENSEMBLE SUPPORT (C509)
// ============================================================================

/**
 * Carnatic ensemble role
 */
export type CarnaticRole = 
  | 'drone'       // Tambura/sruti box
  | 'melodist'    // Main vocalist or instrumentalist
  | 'mridangam'   // Main percussion
  | 'ghatam'      // Secondary percussion (clay pot)
  | 'kanjira'     // Secondary percussion (frame drum)
  | 'violin'      // Melodic accompaniment
  | 'veena'       // String accompaniment
  | 'flute'       // Wind accompaniment
  | 'chorus';     // Background vocalists

/**
 * Carnatic ensemble configuration
 */
export interface CarnaticEnsembleConfig {
  /** Active roles in the ensemble */
  readonly roles: readonly CarnaticRole[];
  /** Raga for melodic parts */
  readonly raga: string;
  /** Tala for rhythmic parts */
  readonly tala: string;
  /** Jati (beats per laghu) */
  readonly jati: 3 | 4 | 5 | 7 | 9;
  /** Tempo in aksharas per minute */
  readonly tempo: number;
  /** Drone tones (relative to Sa) */
  readonly droneTones: readonly number[];
}

/**
 * Carnatic ensemble voice assignment
 */
export interface CarnaticVoiceAssignment {
  readonly role: CarnaticRole;
  readonly trackId: string;
  readonly midiChannel: number;
  readonly instrument?: string;
  readonly octave: number;
}

/**
 * Default Carnatic ensemble configurations
 */
export const CARNATIC_ENSEMBLE_PRESETS: Record<string, CarnaticEnsembleConfig> = {
  'vocal-concert': {
    roles: ['drone', 'melodist', 'violin', 'mridangam', 'ghatam'],
    raga: 'shankarabharanam',
    tala: 'adi',
    jati: 4,
    tempo: 80,
    droneTones: [0, 7], // Sa, Pa
  },
  'instrumental': {
    roles: ['drone', 'veena', 'flute', 'mridangam', 'kanjira'],
    raga: 'kalyani',
    tala: 'adi',
    jati: 4,
    tempo: 100,
    droneTones: [0, 7],
  },
  'minimal': {
    roles: ['drone', 'melodist', 'mridangam'],
    raga: 'mohanam',
    tala: 'rupaka',
    jati: 4,
    tempo: 60,
    droneTones: [0, 7],
  },
};

/**
 * Get Carnatic ensemble preset
 */
export function getCarnaticEnsemblePreset(name: string): CarnaticEnsembleConfig | undefined {
  return CARNATIC_ENSEMBLE_PRESETS[name];
}

/**
 * Generate voice assignments for Carnatic ensemble.
 * 
 * This is the C509 integration: arranger supports drone + percussion roles for Carnatic ensemble.
 */
export function generateCarnaticVoiceAssignments(
  config: CarnaticEnsembleConfig
): CarnaticVoiceAssignment[] {
  const assignments: CarnaticVoiceAssignment[] = [];
  let channel = 0;
  
  for (const role of config.roles) {
    let octave = 4;
    let instrument: string | undefined;
    
    switch (role) {
      case 'drone':
        octave = 3;
        instrument = 'tambura';
        break;
      case 'melodist':
        octave = 4;
        instrument = 'vocal';
        break;
      case 'mridangam':
        octave = 2;
        instrument = 'mridangam';
        break;
      case 'ghatam':
        octave = 3;
        instrument = 'ghatam';
        break;
      case 'kanjira':
        octave = 3;
        instrument = 'kanjira';
        break;
      case 'violin':
        octave = 4;
        instrument = 'violin';
        break;
      case 'veena':
        octave = 3;
        instrument = 'veena';
        break;
      case 'flute':
        octave = 5;
        instrument = 'flute';
        break;
      case 'chorus':
        octave = 4;
        instrument = 'choir';
        break;
    }
    
    assignments.push({
      role,
      trackId: `carnatic-${role}`,
      midiChannel: channel,
      instrument,
      octave,
    });
    
    channel = (channel + 1) % 16;
    if (channel === 9) channel++; // Skip percussion channel for melodic parts
  }
  
  return assignments;
}

/**
 * Generate drone pattern for Carnatic ensemble
 */
export function generateCarnaticDronePattern(
  config: CarnaticEnsembleConfig,
  rootNote: number,
  durationTicks: number
): { notes: readonly number[]; velocities: readonly number[] } {
  const notes: number[] = [];
  const velocities: number[] = [];
  
  for (const tone of config.droneTones) {
    const note = rootNote + tone;
    notes.push(note);
    notes.push(note + 12); // Octave doubling
    velocities.push(60);
    velocities.push(40); // Softer octave
  }
  
  return { notes, velocities };
}

/**
 * Generate mridangam pattern for Carnatic ensemble
 */
export function generateMridangamPattern(
  tala: string,
  jati: number,
  density: number
): { beats: readonly number[]; strokes: readonly string[] } {
  // Simplified mridangam patterns - each stroke type has a characteristic sound
  const STROKE_PATTERNS: Record<string, { beats: number[]; strokes: string[] }> = {
    'adi': {
      beats: [0, 2, 4, 5, 6, 7],
      strokes: ['tha', 'ka', 'dhin', 'na', 'tha', 'ka'],
    },
    'rupaka': {
      beats: [0, 2, 3, 4, 5],
      strokes: ['tha', 'dhin', 'na', 'tha', 'ka'],
    },
    'misra_chapu': {
      beats: [0, 1, 2, 3, 4, 5, 6],
      strokes: ['tha', 'ka', 'dhin', 'na', 'tha', 'ka', 'dhin'],
    },
  };
  
  const pattern = STROKE_PATTERNS[tala] ?? STROKE_PATTERNS['adi']!;
  
  // Filter beats based on density
  const filteredBeats: number[] = [];
  const filteredStrokes: string[] = [];
  
  for (let i = 0; i < pattern.beats.length; i++) {
    if (Math.random() < density || i === 0) {
      filteredBeats.push(pattern.beats[i]!);
      filteredStrokes.push(pattern.strokes[i]!);
    }
  }
  
  return { beats: filteredBeats, strokes: filteredStrokes };
}


