/**
 * @fileoverview Drum Pattern Library
 * 
 * Professional drum patterns with music notation representation:
 * - Standard notation timing (whole, half, quarter, eighth, sixteenth, triplets)
 * - Swing/shuffle groove quantization
 * - Velocity dynamics (ghost notes, accents)
 * - Genre-specific patterns (rock, jazz, funk, latin, electronic, world)
 * - Pattern variations (intro, verse, chorus, fill, breakdown)
 * 
 * Notation System:
 * - Beat positions: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5 (quarter note grid)
 * - Subdivisions: 1e+a = 1, 1.25, 1.5, 1.75 (sixteenth note grid)
 * - Triplets: 1, 1.33, 1.67 (eighth note triplet grid)
 * - Velocities: ppp(16), pp(32), p(48), mp(64), mf(80), f(96), ff(112), fff(127)
 * 
 * @module @cardplay/core/audio/drum-patterns
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Standard MIDI drum mapping (GM) */
export const DRUM = {
  // Kicks
  KICK: 36,
  KICK_ACOUSTIC: 35,
  // Snares
  SNARE: 38,
  SNARE_ELECTRIC: 40,
  RIMSHOT: 37,
  // Hi-hats
  HIHAT_CLOSED: 42,
  HIHAT_PEDAL: 44,
  HIHAT_OPEN: 46,
  // Toms
  TOM_LOW: 41,
  TOM_MID_LOW: 45,
  TOM_MID: 47,
  TOM_MID_HIGH: 48,
  TOM_HIGH: 50,
  TOM_FLOOR: 43,
  // Cymbals
  CRASH_1: 49,
  CRASH_2: 57,
  RIDE: 51,
  RIDE_BELL: 53,
  SPLASH: 55,
  CHINA: 52,
  // Percussion
  CLAP: 39,
  TAMBOURINE: 54,
  COWBELL: 56,
  SHAKER: 82,
  // Latin
  CONGA_HIGH: 63,
  CONGA_LOW: 64,
  BONGO_HIGH: 60,
  BONGO_LOW: 61,
  TIMBALE_HIGH: 65,
  TIMBALE_LOW: 66,
  CLAVE: 75,
  GUIRO: 73,
  MARACAS: 70,
  CABASA: 69,
  // Tabla
  TABLA_NA: 88,
  TABLA_TIN: 89,
  TABLA_DHA: 96,
  BAYA_GE: 100,
} as const;

/** Velocity levels in music notation style */
export const VEL = {
  ppp: 16,   // pianississimo (ghost note)
  pp: 32,    // pianissimo
  p: 48,     // piano
  mp: 64,    // mezzo-piano
  mf: 80,    // mezzo-forte
  f: 96,     // forte
  ff: 112,   // fortissimo
  fff: 127,  // fortississimo (accent)
} as const;

/** Swing percentages */
export const SWING = {
  STRAIGHT: 50,      // No swing
  LIGHT: 55,         // Subtle swing
  MEDIUM: 58,        // Standard swing
  HEAVY: 62,         // Strong swing
  SHUFFLE: 67,       // Full shuffle (2:1 ratio)
  TRIPLET: 67,       // Same as shuffle
  HARD_SWING: 70,    // Exaggerated swing
} as const;

/** Pattern length presets (in beats) */
export const PATTERN_LENGTH = {
  HALF_BAR: 2,
  ONE_BAR: 4,
  TWO_BARS: 8,
  FOUR_BARS: 16,
  EIGHT_BARS: 32,
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single drum hit.
 */
export interface DrumHit {
  /** MIDI note number */
  note: number;
  /** Position in beats (1-based, e.g., 1, 1.5, 2, 2.25) */
  beat: number;
  /** Velocity (0-127) */
  velocity: number;
  /** Duration in beats (optional, defaults to short hit) */
  duration?: number;
  /** Flam offset in beats (optional) */
  flam?: number;
  /** Drag/roll info (optional) */
  roll?: { count: number; interval: number };
}

/**
 * Groove settings for pattern playback.
 */
export interface GrooveSettings {
  /** Swing amount (50 = straight, 67 = shuffle) */
  swing: number;
  /** Which subdivisions swing affects ('8th' | '16th') */
  swingTarget: '8th' | '16th';
  /** Velocity scaling (ghost notes vs accents) */
  velocityScale: number;
  /** Humanize timing randomness (0-1) */
  humanize: number;
  /** Push/pull timing offset in ms */
  feel: number;
  /** Template groove name (optional) */
  template?: string;
}

/**
 * A complete drum pattern.
 */
export interface DrumPattern {
  /** Pattern ID */
  id: string;
  /** Display name */
  name: string;
  /** Genre/style category */
  category: string;
  /** Time signature numerator */
  timeSignatureNumerator: number;
  /** Time signature denominator */
  timeSignatureDenominator: number;
  /** Pattern length in beats */
  lengthBeats: number;
  /** Suggested tempo (BPM) */
  suggestedTempo: number;
  /** Tempo range [min, max] */
  tempoRange: [number, number];
  /** Groove settings */
  groove: GrooveSettings;
  /** Drum hits */
  hits: DrumHit[];
  /** Text notation representation */
  notation: string;
  /** Pattern variations (keyed by name) */
  variations?: Record<string, DrumHit[]>;
  /** Tags for search */
  tags: string[];
}

// ============================================================================
// NOTATION HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a simple beat string like "1 2 3 4" into beat numbers.
 */
export function parseBeats(beatString: string): number[] {
  return beatString.trim().split(/\s+/).map(b => parseFloat(b));
}

/**
 * Create hits for a drum on given beats with uniform velocity.
 */
export function hitsOnBeats(
  note: number,
  beats: number[],
  velocity: number = VEL.mf
): DrumHit[] {
  return beats.map(beat => ({ note, beat, velocity }));
}

/**
 * Apply swing to beat positions.
 */
export function applySwing(
  beat: number,
  swing: number,
  target: '8th' | '16th' = '8th'
): number {
  const swingFactor = swing / 100;
  
  // Determine the subdivision
  const subdivision = target === '8th' ? 0.5 : 0.25;
  const beatInBar = ((beat - 1) % 1);
  
  // Only swing off-beat positions
  const isOffBeat = target === '8th' 
    ? (beatInBar % 0.5 >= 0.25 && beatInBar % 0.5 < 0.5)
    : (beatInBar % 0.25 >= 0.125);
  
  if (isOffBeat) {
    const offset = (swingFactor - 0.5) * subdivision;
    return beat + offset;
  }
  
  return beat;
}

/**
 * Generate text notation for a pattern.
 */
export function generateNotation(
  hits: DrumHit[],
  lengthBeats: number,
  resolution: 16 | 8 = 16
): string {
  const stepsPerBeat = resolution === 16 ? 4 : 2;
  const totalSteps = lengthBeats * stepsPerBeat;
  
  // Group hits by drum
  const hitsByDrum = new Map<number, DrumHit[]>();
  for (const hit of hits) {
    const existing = hitsByDrum.get(hit.note) || [];
    existing.push(hit);
    hitsByDrum.set(hit.note, existing);
  }
  
  // Get drum names
  const drumNames: Record<number, string> = {
    [DRUM.KICK]: 'Kick  ',
    [DRUM.SNARE]: 'Snare ',
    [DRUM.HIHAT_CLOSED]: 'HH-Cl ',
    [DRUM.HIHAT_OPEN]: 'HH-Op ',
    [DRUM.HIHAT_PEDAL]: 'HH-Pd ',
    [DRUM.RIDE]: 'Ride  ',
    [DRUM.CRASH_1]: 'Crash ',
    [DRUM.TOM_HIGH]: 'TomHi ',
    [DRUM.TOM_MID]: 'TomMd ',
    [DRUM.TOM_LOW]: 'TomLo ',
    [DRUM.CLAP]: 'Clap  ',
    [DRUM.RIMSHOT]: 'Rim   ',
  };
  
  // Build notation for each drum
  const result: string[] = [];
  const stepMarkers = Array.from({ length: totalSteps }, (_, i) => {
    const beat = i / stepsPerBeat + 1;
    if (i % stepsPerBeat === 0) return beat.toString();
    if (resolution === 16) {
      const sub = i % stepsPerBeat;
      return sub === 1 ? 'e' : sub === 2 ? '+' : 'a';
    }
    return '+';
  });
  
  // Header
  result.push('       |' + stepMarkers.join('|') + '|');
  result.push('       +' + '-'.repeat(totalSteps * 2 - 1) + '+');
  
  // Each drum line
  for (const [note, drumHits] of hitsByDrum) {
    const name = drumNames[note] || `N${note}  `.slice(0, 6);
    const line: string[] = new Array(totalSteps).fill('.');
    
    for (const hit of drumHits) {
      const step = Math.round((hit.beat - 1) * stepsPerBeat);
      if (step >= 0 && step < totalSteps) {
        // Velocity indication
        if (hit.velocity >= VEL.ff) line[step] = 'X'; // Accent
        else if (hit.velocity >= VEL.f) line[step] = 'x';
        else if (hit.velocity >= VEL.mf) line[step] = 'o';
        else if (hit.velocity >= VEL.mp) line[step] = '-';
        else line[step] = 'g'; // Ghost
      }
    }
    
    result.push(`${name}|${line.join('|')}|`);
  }
  
  result.push('       +' + '-'.repeat(totalSteps * 2 - 1) + '+');
  result.push('');
  result.push('Legend: X=accent(ff+) x=forte o=mezzo g=ghost .=rest');
  
  return result.join('\n');
}

// ============================================================================
// ROCK PATTERNS
// ============================================================================

export const ROCK_BASIC: DrumPattern = {
  id: 'rock-basic',
  name: 'Basic Rock',
  category: 'Rock',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 120,
  tempoRange: [90, 140],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '8th',
    velocityScale: 1,
    humanize: 0.1,
    feel: 0,
  },
  hits: [
    // Kick on 1 and 3
    { note: DRUM.KICK, beat: 1, velocity: VEL.f },
    { note: DRUM.KICK, beat: 3, velocity: VEL.f },
    // Snare on 2 and 4 (backbeat)
    { note: DRUM.SNARE, beat: 2, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 4, velocity: VEL.f },
    // Hi-hat eighth notes
    { note: DRUM.HIHAT_CLOSED, beat: 1, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 1.5, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 2, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 2.5, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 3, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 3.5, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 4, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 4.5, velocity: VEL.mp },
  ],
  notation: `
Basic Rock Beat (4/4) - 120 BPM
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |x|.|.|.|.|.|.|.|x|.|.|.|.|.|.|.|
Snare |.|.|.|.|x|.|.|.|.|.|.|.|x|.|.|.|
HH-Cl |o|.|-|.|o|.|-|.|o|.|-|.|o|.|-|.|
       +-------------------------------+
`,
  tags: ['rock', 'basic', 'backbeat', 'beginner'],
};

export const ROCK_DRIVING: DrumPattern = {
  id: 'rock-driving',
  name: 'Driving Rock',
  category: 'Rock',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 130,
  tempoRange: [110, 160],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '8th',
    velocityScale: 1.1,
    humanize: 0.05,
    feel: 0,
  },
  hits: [
    // Kick pattern - driving eighths on beats
    { note: DRUM.KICK, beat: 1, velocity: VEL.f },
    { note: DRUM.KICK, beat: 1.5, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 2.5, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 3, velocity: VEL.f },
    { note: DRUM.KICK, beat: 3.5, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 4.5, velocity: VEL.mf },
    // Snare backbeat
    { note: DRUM.SNARE, beat: 2, velocity: VEL.ff },
    { note: DRUM.SNARE, beat: 4, velocity: VEL.ff },
    // Hi-hat all eighths
    ...hitsOnBeats(DRUM.HIHAT_CLOSED, [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5], VEL.mf),
  ],
  notation: `
Driving Rock (4/4) - 130 BPM
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |x|.|-|.|.|.|-|.|x|.|-|.|.|.|-|.|
Snare |.|.|.|.|X|.|.|.|.|.|.|.|X|.|.|.|
HH-Cl |o|.|o|.|o|.|o|.|o|.|o|.|o|.|o|.|
       +-------------------------------+
`,
  tags: ['rock', 'driving', 'energetic', 'eighth-notes'],
};

export const ROCK_HALFTIME: DrumPattern = {
  id: 'rock-halftime',
  name: 'Half-Time Rock',
  category: 'Rock',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 80,
  tempoRange: [60, 100],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '8th',
    velocityScale: 1,
    humanize: 0.15,
    feel: 0,
  },
  hits: [
    { note: DRUM.KICK, beat: 1, velocity: VEL.f },
    { note: DRUM.KICK, beat: 2.5, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 3, velocity: VEL.ff },
    // Slower hi-hat pattern
    { note: DRUM.HIHAT_CLOSED, beat: 1, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 2, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 3, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 4, velocity: VEL.mf },
  ],
  notation: `
Half-Time Rock (4/4) - 80 BPM
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |x|.|.|.|.|.|-|.|.|.|.|.|.|.|.|.|
Snare |.|.|.|.|.|.|.|.|X|.|.|.|.|.|.|.|
HH-Cl |o|.|.|.|o|.|.|.|o|.|.|.|o|.|.|.|
       +-------------------------------+
`,
  tags: ['rock', 'halftime', 'heavy', 'slow'],
};

// ============================================================================
// FUNK PATTERNS
// ============================================================================

export const FUNK_BASIC: DrumPattern = {
  id: 'funk-basic',
  name: 'Basic Funk',
  category: 'Funk',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 100,
  tempoRange: [85, 115],
  groove: {
    swing: SWING.LIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0.1,
    feel: -5, // Slightly ahead
  },
  hits: [
    // Syncopated kick
    { note: DRUM.KICK, beat: 1, velocity: VEL.f },
    { note: DRUM.KICK, beat: 2.75, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 3.5, velocity: VEL.f },
    // Snare with ghost notes
    { note: DRUM.SNARE, beat: 1.75, velocity: VEL.pp }, // Ghost
    { note: DRUM.SNARE, beat: 2, velocity: VEL.ff },    // Accent
    { note: DRUM.SNARE, beat: 2.5, velocity: VEL.pp },  // Ghost
    { note: DRUM.SNARE, beat: 3.25, velocity: VEL.pp }, // Ghost
    { note: DRUM.SNARE, beat: 4, velocity: VEL.ff },    // Accent
    { note: DRUM.SNARE, beat: 4.5, velocity: VEL.pp },  // Ghost
    // Hi-hat sixteenths with accents
    { note: DRUM.HIHAT_CLOSED, beat: 1, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 1.25, velocity: VEL.p },
    { note: DRUM.HIHAT_CLOSED, beat: 1.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 1.75, velocity: VEL.p },
    { note: DRUM.HIHAT_CLOSED, beat: 2, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 2.25, velocity: VEL.p },
    { note: DRUM.HIHAT_CLOSED, beat: 2.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 2.75, velocity: VEL.p },
    { note: DRUM.HIHAT_CLOSED, beat: 3, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 3.25, velocity: VEL.p },
    { note: DRUM.HIHAT_CLOSED, beat: 3.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 3.75, velocity: VEL.p },
    { note: DRUM.HIHAT_CLOSED, beat: 4, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 4.25, velocity: VEL.p },
    { note: DRUM.HIHAT_CLOSED, beat: 4.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 4.75, velocity: VEL.p },
  ],
  notation: `
Basic Funk (4/4) - 100 BPM - Light 16th swing
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |x|.|.|.|.|.|.|o|.|.|x|.|.|.|.|.|
Snare |.|.|.|g|X|.|g|.|.|g|.|.|X|.|g|.|
HH-Cl |x|-|o|-|x|-|o|-|x|-|o|-|x|-|o|-|
       +-------------------------------+
g=ghost note (pp), X=accent (ff)
`,
  tags: ['funk', 'ghost-notes', 'syncopated', '16th-notes'],
};

export const FUNK_JAMES_BROWN: DrumPattern = {
  id: 'funk-james-brown',
  name: 'JB Funk (The One)',
  category: 'Funk',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 8,
  suggestedTempo: 108,
  tempoRange: [100, 120],
  groove: {
    swing: SWING.LIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0.08,
    feel: -3,
  },
  hits: [
    // Bar 1 - Heavy on "The One"
    { note: DRUM.KICK, beat: 1, velocity: VEL.fff },
    { note: DRUM.KICK, beat: 2.75, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 2, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 2.5, velocity: VEL.pp },
    { note: DRUM.SNARE, beat: 4, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 4.5, velocity: VEL.pp },
    // Bar 2 - Variation
    { note: DRUM.KICK, beat: 5, velocity: VEL.f },
    { note: DRUM.KICK, beat: 6.5, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 7.75, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 6, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 6.5, velocity: VEL.pp },
    { note: DRUM.SNARE, beat: 8, velocity: VEL.ff },
    // Hi-hat throughout
    ...hitsOnBeats(DRUM.HIHAT_CLOSED, 
      [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5].filter(b => b <= 8), 
      VEL.mf),
  ],
  notation: `
JB Funk - "The One" (4/4) - 108 BPM - 2 bars
Bar 1:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |X|.|.|.|.|.|.|o|.|.|.|.|.|.|.|.|
Snare  |.|.|.|.|x|.|g|.|.|.|.|.|x|.|g|.|
HH-Cl  |o|.|o|.|o|.|o|.|o|.|o|.|o|.|o|.|
        +-------------------------------+
Bar 2:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |x|.|.|.|.|.|o|.|.|.|.|.|.|.|o|.|
Snare  |.|.|.|.|x|.|g|.|.|.|.|.|.|.|X|.|
HH-Cl  |o|.|o|.|o|.|o|.|o|.|o|.|o|.|o|.|
        +-------------------------------+
X=fff (THE ONE), x=f, o=mf, g=ghost
`,
  tags: ['funk', 'james-brown', 'the-one', 'classic'],
};

// ============================================================================
// JAZZ PATTERNS
// ============================================================================

export const JAZZ_SWING: DrumPattern = {
  id: 'jazz-swing',
  name: 'Jazz Swing',
  category: 'Jazz',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 140,
  tempoRange: [100, 200],
  groove: {
    swing: SWING.SHUFFLE,
    swingTarget: '8th',
    velocityScale: 0.9,
    humanize: 0.2,
    feel: 0,
  },
  hits: [
    // Ride cymbal jazz pattern (spang-a-lang)
    { note: DRUM.RIDE, beat: 1, velocity: VEL.f },
    { note: DRUM.RIDE, beat: 2, velocity: VEL.mf },
    { note: DRUM.RIDE, beat: 2.67, velocity: VEL.mp }, // Triplet skip-beat
    { note: DRUM.RIDE, beat: 3, velocity: VEL.f },
    { note: DRUM.RIDE, beat: 4, velocity: VEL.mf },
    { note: DRUM.RIDE, beat: 4.67, velocity: VEL.mp }, // Triplet skip-beat
    // Hi-hat foot on 2 and 4
    { note: DRUM.HIHAT_PEDAL, beat: 2, velocity: VEL.mf },
    { note: DRUM.HIHAT_PEDAL, beat: 4, velocity: VEL.mf },
    // Light kick feathering
    { note: DRUM.KICK, beat: 1, velocity: VEL.p },
    { note: DRUM.KICK, beat: 2, velocity: VEL.pp },
    { note: DRUM.KICK, beat: 3, velocity: VEL.p },
    { note: DRUM.KICK, beat: 4, velocity: VEL.pp },
  ],
  notation: `
Jazz Swing (4/4) - 140 BPM - Triplet feel (shuffle)
       |1 |  |2 |  |3 |  |4 |  |
       | t| t| t| t| t| t| t| t|  (triplet subdivisions)
       +------------------------+
Ride   |x |  |o | -|x |  |o | -|  "spang-a-lang"
HH-Pd  |  |  |o |  |  |  |o |  |  2 and 4
Kick   |- |  |g |  |- |  |g |  |  feathered
       +------------------------+
t=triplet position, swing applies to "skip-beat"
`,
  tags: ['jazz', 'swing', 'triplet', 'ride', 'brush'],
};

export const JAZZ_BOSSA: DrumPattern = {
  id: 'jazz-bossa',
  name: 'Bossa Nova',
  category: 'Jazz',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 8,
  suggestedTempo: 140,
  tempoRange: [110, 160],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '8th',
    velocityScale: 0.85,
    humanize: 0.15,
    feel: 0,
  },
  hits: [
    // Cross-stick pattern
    { note: DRUM.RIMSHOT, beat: 2, velocity: VEL.mf },
    { note: DRUM.RIMSHOT, beat: 3.5, velocity: VEL.mf },
    { note: DRUM.RIMSHOT, beat: 6, velocity: VEL.mf },
    { note: DRUM.RIMSHOT, beat: 7.5, velocity: VEL.mf },
    // Kick - classic bossa pattern
    { note: DRUM.KICK, beat: 1, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 1.75, velocity: VEL.mp },
    { note: DRUM.KICK, beat: 3, velocity: VEL.mp },
    { note: DRUM.KICK, beat: 5, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 5.75, velocity: VEL.mp },
    { note: DRUM.KICK, beat: 7, velocity: VEL.mp },
    // Hi-hat maintaining pulse
    ...hitsOnBeats(DRUM.HIHAT_CLOSED, [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5].filter(b => b <= 8), VEL.mp),
  ],
  notation: `
Bossa Nova (4/4) - 140 BPM - 2 bars, straight 8ths
Bar 1:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |o|.|.|-|.|.|.|.|o|.|.|.|.|.|.|.|
Rim    |.|.|.|.|o|.|.|.|.|.|o|.|.|.|.|.|
HH-Cl  |-|.|-|.|-|.|-|.|-|.|-|.|-|.|-|.|
        +-------------------------------+
Bar 2:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |o|.|.|-|.|.|.|.|o|.|.|.|.|.|.|.|
Rim    |.|.|.|.|o|.|.|.|.|.|o|.|.|.|.|.|
HH-Cl  |-|.|-|.|-|.|-|.|-|.|-|.|-|.|-|.|
        +-------------------------------+
`,
  tags: ['jazz', 'bossa', 'brazilian', 'latin'],
};

// ============================================================================
// LATIN PATTERNS
// ============================================================================

export const LATIN_SONGO: DrumPattern = {
  id: 'latin-songo',
  name: 'Songo',
  category: 'Latin',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 8,
  suggestedTempo: 105,
  tempoRange: [90, 120],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0.12,
    feel: 0,
  },
  hits: [
    // Bar 1
    { note: DRUM.KICK, beat: 1, velocity: VEL.f },
    { note: DRUM.KICK, beat: 2.75, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 3.5, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 2.5, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 4.25, velocity: VEL.mf },
    // Bar 2
    { note: DRUM.KICK, beat: 5, velocity: VEL.f },
    { note: DRUM.KICK, beat: 6.5, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 7.75, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 6.5, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 8.25, velocity: VEL.mf },
    // Cowbell - cascara-like pattern
    { note: DRUM.COWBELL, beat: 1, velocity: VEL.f },
    { note: DRUM.COWBELL, beat: 1.5, velocity: VEL.mp },
    { note: DRUM.COWBELL, beat: 2.5, velocity: VEL.mf },
    { note: DRUM.COWBELL, beat: 3, velocity: VEL.f },
    { note: DRUM.COWBELL, beat: 4, velocity: VEL.mf },
    { note: DRUM.COWBELL, beat: 4.5, velocity: VEL.mp },
    { note: DRUM.COWBELL, beat: 5, velocity: VEL.f },
    { note: DRUM.COWBELL, beat: 5.5, velocity: VEL.mp },
    { note: DRUM.COWBELL, beat: 6.5, velocity: VEL.mf },
    { note: DRUM.COWBELL, beat: 7, velocity: VEL.f },
    { note: DRUM.COWBELL, beat: 8, velocity: VEL.mf },
    { note: DRUM.COWBELL, beat: 8.5, velocity: VEL.mp },
    // Hi-hat pedal keeping time
    ...hitsOnBeats(DRUM.HIHAT_PEDAL, [2, 4, 6, 8], VEL.mp),
  ],
  notation: `
Songo (4/4) - 105 BPM - 2 bars, Cuban
Bar 1:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |x|.|.|.|.|.|.|o|.|.|o|.|.|.|.|.|
Snare  |.|.|.|.|.|.|x|.|.|.|.|.|.|o|.|.|
Cowbel |x|.|-|.|.|.|o|.|x|.|.|.|o|.|-|.|
HH-Pd  |.|.|.|.|o|.|.|.|.|.|.|.|o|.|.|.|
        +-------------------------------+
Bar 2:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |x|.|.|.|.|.|o|.|.|.|.|.|.|.|o|.|
Snare  |.|.|.|.|.|.|x|.|.|.|.|.|.|o|.|.|
Cowbel |x|.|-|.|.|.|o|.|x|.|.|.|o|.|-|.|
HH-Pd  |.|.|.|.|o|.|.|.|.|.|.|.|o|.|.|.|
        +-------------------------------+
`,
  tags: ['latin', 'cuban', 'songo', 'afro-cuban'],
};

export const LATIN_TUMBAO: DrumPattern = {
  id: 'latin-tumbao',
  name: 'Tumbao (Salsa)',
  category: 'Latin',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 8,
  suggestedTempo: 190,
  tempoRange: [160, 220],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '8th',
    velocityScale: 1,
    humanize: 0.08,
    feel: 0,
  },
  hits: [
    // Clave 2-3 (implied in pattern)
    // Congas - tumbao pattern
    { note: DRUM.CONGA_HIGH, beat: 2.5, velocity: VEL.f },
    { note: DRUM.CONGA_LOW, beat: 3, velocity: VEL.f },
    { note: DRUM.CONGA_HIGH, beat: 4, velocity: VEL.mf },
    { note: DRUM.CONGA_HIGH, beat: 4.5, velocity: VEL.mf },
    { note: DRUM.CONGA_HIGH, beat: 6.5, velocity: VEL.f },
    { note: DRUM.CONGA_LOW, beat: 7, velocity: VEL.f },
    { note: DRUM.CONGA_HIGH, beat: 8, velocity: VEL.mf },
    { note: DRUM.CONGA_HIGH, beat: 8.5, velocity: VEL.mf },
    // Clave - 2-3 son clave
    { note: DRUM.CLAVE, beat: 2, velocity: VEL.f },
    { note: DRUM.CLAVE, beat: 3, velocity: VEL.f },
    { note: DRUM.CLAVE, beat: 5, velocity: VEL.f },
    { note: DRUM.CLAVE, beat: 6.5, velocity: VEL.f },
    { note: DRUM.CLAVE, beat: 8, velocity: VEL.f },
    // Cowbell - keeping time
    ...hitsOnBeats(DRUM.COWBELL, [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5].filter(b => b <= 8), VEL.mf),
  ],
  notation: `
Salsa Tumbao with 2-3 Son Clave (4/4) - 190 BPM - 2 bars
Bar 1 (2-side):  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
                 +-------------------------------+
Conga-H         |.|.|.|.|.|.|x|.|.|.|.|.|o|.|o|.|
Conga-L         |.|.|.|.|.|.|.|.|x|.|.|.|.|.|.|.|
Clave           |.|.|.|.|x|.|.|.|x|.|.|.|.|.|.|.|
Cowbell         |o|.|o|.|o|.|o|.|o|.|o|.|o|.|o|.|
                 +-------------------------------+
Bar 2 (3-side):  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
                 +-------------------------------+
Conga-H         |.|.|.|.|.|.|x|.|.|.|.|.|o|.|o|.|
Conga-L         |.|.|.|.|.|.|.|.|x|.|.|.|.|.|.|.|
Clave           |x|.|.|.|.|.|o|.|.|.|.|.|x|.|.|.|
Cowbell         |o|.|o|.|o|.|o|.|o|.|o|.|o|.|o|.|
                 +-------------------------------+
`,
  tags: ['latin', 'salsa', 'tumbao', 'clave', 'congas'],
};

// ============================================================================
// ELECTRONIC PATTERNS
// ============================================================================

export const ELECTRONIC_FOUR_FLOOR: DrumPattern = {
  id: 'electronic-four-floor',
  name: 'Four on the Floor',
  category: 'Electronic',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 128,
  tempoRange: [120, 140],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0,
    feel: 0,
  },
  hits: [
    // Kick on every beat
    { note: DRUM.KICK, beat: 1, velocity: VEL.ff },
    { note: DRUM.KICK, beat: 2, velocity: VEL.ff },
    { note: DRUM.KICK, beat: 3, velocity: VEL.ff },
    { note: DRUM.KICK, beat: 4, velocity: VEL.ff },
    // Clap/Snare on 2 and 4
    { note: DRUM.CLAP, beat: 2, velocity: VEL.f },
    { note: DRUM.CLAP, beat: 4, velocity: VEL.f },
    // Hi-hat offbeats
    { note: DRUM.HIHAT_CLOSED, beat: 1.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 2.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 3.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 4.5, velocity: VEL.mf },
    // Open hat on upbeats
    { note: DRUM.HIHAT_OPEN, beat: 1.5, velocity: VEL.mp },
  ],
  notation: `
Four on the Floor (House/Techno) (4/4) - 128 BPM
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |X|.|.|.|X|.|.|.|X|.|.|.|X|.|.|.|
Clap  |.|.|.|.|x|.|.|.|.|.|.|.|x|.|.|.|
HH-Cl |.|.|o|.|.|.|o|.|.|.|o|.|.|.|o|.|
HH-Op |.|.|-|.|.|.|.|.|.|.|.|.|.|.|.|.|
       +-------------------------------+
Classic house/techno pattern
`,
  tags: ['electronic', 'house', 'techno', 'four-on-floor', 'dance'],
};

export const ELECTRONIC_BREAKBEAT: DrumPattern = {
  id: 'electronic-breakbeat',
  name: 'Classic Breakbeat',
  category: 'Electronic',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 140,
  tempoRange: [130, 160],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0.05,
    feel: 0,
  },
  hits: [
    // Amen-style break
    { note: DRUM.KICK, beat: 1, velocity: VEL.ff },
    { note: DRUM.KICK, beat: 2.5, velocity: VEL.f },
    { note: DRUM.KICK, beat: 4, velocity: VEL.f },
    // Snare
    { note: DRUM.SNARE, beat: 2, velocity: VEL.ff },
    { note: DRUM.SNARE, beat: 3.75, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 4.25, velocity: VEL.f },
    // Hi-hat pattern
    { note: DRUM.HIHAT_CLOSED, beat: 1, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 1.25, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 1.5, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 1.75, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 2, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 2.5, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 3, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 3.25, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 3.5, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 3.75, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 4, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 4.5, velocity: VEL.f },
  ],
  notation: `
Classic Breakbeat (Amen-style) (4/4) - 140 BPM
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |X|.|.|.|.|.|x|.|.|.|.|.|x|.|.|.|
Snare |.|.|.|.|X|.|.|.|.|.|.|o|.|x|.|.|
HH-Cl |o|-|x|-|o|.|x|.|o|-|x|-|o|.|x|.|
       +-------------------------------+
Based on classic break samples
`,
  tags: ['electronic', 'breakbeat', 'dnb', 'jungle', 'amen'],
};

export const ELECTRONIC_TRAP: DrumPattern = {
  id: 'electronic-trap',
  name: 'Trap Beat',
  category: 'Electronic',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 140,
  tempoRange: [130, 160],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0,
    feel: 0,
  },
  hits: [
    // 808 kick
    { note: DRUM.KICK, beat: 1, velocity: VEL.fff },
    { note: DRUM.KICK, beat: 2.75, velocity: VEL.f },
    // Snare on 3
    { note: DRUM.SNARE, beat: 3, velocity: VEL.ff },
    // Hi-hat rolls
    { note: DRUM.HIHAT_CLOSED, beat: 1, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 1.25, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 1.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 1.75, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 2, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 2.25, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 2.5, velocity: VEL.mf },
    // Hi-hat roll into snare
    { note: DRUM.HIHAT_CLOSED, beat: 2.75, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 2.875, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 3.25, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 3.5, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 3.75, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 4, velocity: VEL.mf },
    { note: DRUM.HIHAT_CLOSED, beat: 4.25, velocity: VEL.mp },
    { note: DRUM.HIHAT_CLOSED, beat: 4.5, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 4.625, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 4.75, velocity: VEL.ff },
    { note: DRUM.HIHAT_CLOSED, beat: 4.875, velocity: VEL.ff },
  ],
  notation: `
Trap Beat (4/4) - 140 BPM - With hi-hat rolls
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |X|.|.|.|.|.|.|x|.|.|.|.|.|.|.|.|
Snare |.|.|.|.|.|.|.|.|X|.|.|.|.|.|.|.|
HH-Cl |o|-|o|-|o|-|o|x|R|.|-|o|-|o|X|R|R|
       +-------------------------------+
R=roll (32nd notes), X=accent
`,
  tags: ['electronic', 'trap', 'hip-hop', '808', 'rolls'],
};

// ============================================================================
// WORLD PATTERNS
// ============================================================================

export const WORLD_AFROBEAT: DrumPattern = {
  id: 'world-afrobeat',
  name: 'Afrobeat',
  category: 'World',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 8,
  suggestedTempo: 110,
  tempoRange: [95, 125],
  groove: {
    swing: SWING.LIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0.15,
    feel: 0,
  },
  hits: [
    // Tony Allen-style pattern
    // Bar 1
    { note: DRUM.KICK, beat: 1, velocity: VEL.f },
    { note: DRUM.KICK, beat: 2.75, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 3.5, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 3, velocity: VEL.f },
    // Bar 2
    { note: DRUM.KICK, beat: 5, velocity: VEL.f },
    { note: DRUM.KICK, beat: 6.5, velocity: VEL.mf },
    { note: DRUM.KICK, beat: 7.75, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 7, velocity: VEL.f },
    // Hi-hat - intricate 16th pattern
    ...hitsOnBeats(DRUM.HIHAT_CLOSED, 
      [1, 1.5, 2, 2.5, 3, 3.25, 3.5, 3.75, 4, 4.5, 
       5, 5.5, 6, 6.5, 7, 7.25, 7.5, 7.75, 8, 8.5].filter(b => b <= 8),
      VEL.mf),
    // Open hi-hat accents
    { note: DRUM.HIHAT_OPEN, beat: 2.5, velocity: VEL.f },
    { note: DRUM.HIHAT_OPEN, beat: 6.5, velocity: VEL.f },
  ],
  notation: `
Afrobeat (Tony Allen style) (4/4) - 110 BPM - 2 bars
Bar 1:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |x|.|.|.|.|.|.|o|.|.|o|.|.|.|.|.|
Snare  |.|.|.|.|.|.|.|.|x|.|.|.|.|.|.|.|
HH-Cl  |o|.|o|.|o|.|O|.|o|o|o|o|o|.|o|.|
        +-------------------------------+
Bar 2:  |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
        +-------------------------------+
Kick   |x|.|.|.|.|.|o|.|.|.|.|.|.|.|o|.|
Snare  |.|.|.|.|.|.|.|.|.|.|x|.|.|.|.|.|
HH-Cl  |o|.|o|.|o|.|O|.|o|o|o|o|o|.|o|.|
        +-------------------------------+
O=open hi-hat
`,
  tags: ['world', 'afrobeat', 'nigeria', 'tony-allen', 'fela'],
};

export const WORLD_REGGAE: DrumPattern = {
  id: 'world-reggae',
  name: 'One Drop Reggae',
  category: 'World',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 4,
  suggestedTempo: 75,
  tempoRange: [65, 90],
  groove: {
    swing: SWING.LIGHT,
    swingTarget: '8th',
    velocityScale: 0.95,
    humanize: 0.2,
    feel: 10, // Laid back
  },
  hits: [
    // One drop - kick and snare on 3 only
    { note: DRUM.KICK, beat: 3, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 3, velocity: VEL.f },
    // Cross-stick
    { note: DRUM.RIMSHOT, beat: 3, velocity: VEL.mf },
    // Hi-hat offbeat
    { note: DRUM.HIHAT_CLOSED, beat: 1.5, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 2.5, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 3.5, velocity: VEL.f },
    { note: DRUM.HIHAT_CLOSED, beat: 4.5, velocity: VEL.f },
  ],
  notation: `
One Drop Reggae (4/4) - 75 BPM - Laid back feel
       |1|e|+|a|2|e|+|a|3|e|+|a|4|e|+|a|
       +-------------------------------+
Kick  |.|.|.|.|.|.|.|.|x|.|.|.|.|.|.|.|
Snare |.|.|.|.|.|.|.|.|x|.|.|.|.|.|.|.|
Rim   |.|.|.|.|.|.|.|.|o|.|.|.|.|.|.|.|
HH-Cl |.|.|x|.|.|.|x|.|.|.|x|.|.|.|x|.|
       +-------------------------------+
One Drop = everything lands on beat 3
`,
  tags: ['world', 'reggae', 'one-drop', 'jamaica', 'ska'],
};

export const WORLD_TABLA_TEENTAL: DrumPattern = {
  id: 'world-tabla-teental',
  name: 'Teental (16 beats)',
  category: 'World',
  timeSignatureNumerator: 16,
  timeSignatureDenominator: 4,
  lengthBeats: 16,
  suggestedTempo: 60,
  tempoRange: [40, 100],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '8th',
    velocityScale: 1,
    humanize: 0.1,
    feel: 0,
  },
  hits: [
    // Sam (1) - emphasized
    { note: DRUM.TABLA_DHA, beat: 1, velocity: VEL.ff },
    // Basic theka pattern
    { note: DRUM.TABLA_DHA, beat: 2, velocity: VEL.mf },
    { note: DRUM.TABLA_DHA, beat: 3, velocity: VEL.mf },
    { note: DRUM.TABLA_DHA, beat: 4, velocity: VEL.mf },
    // Khali (5) - empty/lighter
    { note: DRUM.TABLA_TIN, beat: 5, velocity: VEL.f },
    { note: DRUM.TABLA_TIN, beat: 6, velocity: VEL.mf },
    { note: DRUM.TABLA_TIN, beat: 7, velocity: VEL.mf },
    { note: DRUM.TABLA_TIN, beat: 8, velocity: VEL.mf },
    // Tali (9)
    { note: DRUM.TABLA_DHA, beat: 9, velocity: VEL.f },
    { note: DRUM.TABLA_DHA, beat: 10, velocity: VEL.mf },
    { note: DRUM.TABLA_DHA, beat: 11, velocity: VEL.mf },
    { note: DRUM.TABLA_DHA, beat: 12, velocity: VEL.mf },
    // Tali (13)
    { note: DRUM.TABLA_DHA, beat: 13, velocity: VEL.f },
    { note: DRUM.TABLA_TIN, beat: 14, velocity: VEL.mf },
    { note: DRUM.TABLA_TIN, beat: 15, velocity: VEL.mf },
    { note: DRUM.TABLA_NA, beat: 16, velocity: VEL.f },
    // Baya maintaining pulse
    ...hitsOnBeats(DRUM.BAYA_GE, [1, 3, 5, 7, 9, 11, 13, 15], VEL.mp),
  ],
  notation: `
Teental (16 matra = 4+4+4+4) - Hindustani classical
Sam=1, Khali=5, Tali=9,13

Matra: |1 |2 |3 |4 |5 |6 |7 |8 |9 |10|11|12|13|14|15|16|
       |X         |0         |2         |3         |
       +-----------------------------------------------+
Tabla |Dha|Dha|Dha|Dha|Tin|Tin|Tin|Tin|Dha|Dha|Dha|Dha|Dha|Tin|Tin|Na |
Baya  |Ge |   |Ge |   |Ge |   |Ge |   |Ge |   |Ge |   |Ge |   |   |   |
       +-----------------------------------------------+

X=Sam (beat 1, clap)
0=Khali (empty, wave)
2,3=Tali (clap)

Theka: Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha
`,
  tags: ['world', 'indian', 'tabla', 'teental', 'hindustani', 'classical'],
};

// ============================================================================
// FILLS
// ============================================================================

export const FILL_BASIC_TOM: DrumPattern = {
  id: 'fill-basic-tom',
  name: 'Basic Tom Fill',
  category: 'Fill',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 1,
  suggestedTempo: 120,
  tempoRange: [80, 160],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0.05,
    feel: 0,
  },
  hits: [
    { note: DRUM.TOM_HIGH, beat: 1, velocity: VEL.f },
    { note: DRUM.TOM_MID, beat: 1.25, velocity: VEL.f },
    { note: DRUM.TOM_LOW, beat: 1.5, velocity: VEL.f },
    { note: DRUM.TOM_FLOOR, beat: 1.75, velocity: VEL.ff },
  ],
  notation: `
Basic Tom Fill (1 beat = beat 4 of bar)
       |1|e|+|a|
       +-------+
TomHi |x|.|.|.|
TomMd |.|x|.|.|
TomLo |.|.|x|.|
TomFl |.|.|.|X|
       +-------+
`,
  tags: ['fill', 'tom', 'basic', '16th'],
};

export const FILL_SNARE_ROLL: DrumPattern = {
  id: 'fill-snare-roll',
  name: 'Snare Roll Fill',
  category: 'Fill',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  lengthBeats: 1,
  suggestedTempo: 120,
  tempoRange: [80, 140],
  groove: {
    swing: SWING.STRAIGHT,
    swingTarget: '16th',
    velocityScale: 1,
    humanize: 0.02,
    feel: 0,
  },
  hits: [
    { note: DRUM.SNARE, beat: 1, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 1.125, velocity: VEL.mp },
    { note: DRUM.SNARE, beat: 1.25, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 1.375, velocity: VEL.mp },
    { note: DRUM.SNARE, beat: 1.5, velocity: VEL.f },
    { note: DRUM.SNARE, beat: 1.625, velocity: VEL.mf },
    { note: DRUM.SNARE, beat: 1.75, velocity: VEL.ff },
    { note: DRUM.SNARE, beat: 1.875, velocity: VEL.f },
    { note: DRUM.CRASH_1, beat: 2, velocity: VEL.ff },
  ],
  notation: `
Snare Roll Fill (1 beat with crash on downbeat)
       |1|e|+|a|2|
       +--------+
Snare |o|o|o|o|x|x|X|x|.|
Crash |.|.|.|.|.|.|.|.|X|
       +--------+
32nd note roll building to crash
`,
  tags: ['fill', 'snare', 'roll', '32nd'],
};

// ============================================================================
// PATTERN LIBRARY
// ============================================================================

export const ALL_PATTERNS: DrumPattern[] = [
  // Rock
  ROCK_BASIC,
  ROCK_DRIVING,
  ROCK_HALFTIME,
  // Funk
  FUNK_BASIC,
  FUNK_JAMES_BROWN,
  // Jazz
  JAZZ_SWING,
  JAZZ_BOSSA,
  // Latin
  LATIN_SONGO,
  LATIN_TUMBAO,
  // Electronic
  ELECTRONIC_FOUR_FLOOR,
  ELECTRONIC_BREAKBEAT,
  ELECTRONIC_TRAP,
  // World
  WORLD_AFROBEAT,
  WORLD_REGGAE,
  WORLD_TABLA_TEENTAL,
  // Fills
  FILL_BASIC_TOM,
  FILL_SNARE_ROLL,
];

/**
 * Get patterns by category.
 */
export function getPatternsByCategory(category: string): DrumPattern[] {
  return ALL_PATTERNS.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get patterns by tag.
 */
export function getPatternsByTag(tag: string): DrumPattern[] {
  return ALL_PATTERNS.filter(p => p.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
}

/**
 * Get pattern by ID.
 */
export function getPatternById(id: string): DrumPattern | undefined {
  return ALL_PATTERNS.find(p => p.id === id);
}

/**
 * Get all category names.
 */
export function getAllCategories(): string[] {
  return [...new Set(ALL_PATTERNS.map(p => p.category))];
}

/**
 * Get all tags.
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const pattern of ALL_PATTERNS) {
    for (const tag of pattern.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  DRUM,
  VEL,
  SWING,
  PATTERN_LENGTH,
  
  // All patterns
  ALL_PATTERNS,
  
  // Rock
  ROCK_BASIC,
  ROCK_DRIVING,
  ROCK_HALFTIME,
  
  // Funk
  FUNK_BASIC,
  FUNK_JAMES_BROWN,
  
  // Jazz
  JAZZ_SWING,
  JAZZ_BOSSA,
  
  // Latin
  LATIN_SONGO,
  LATIN_TUMBAO,
  
  // Electronic
  ELECTRONIC_FOUR_FLOOR,
  ELECTRONIC_BREAKBEAT,
  ELECTRONIC_TRAP,
  
  // World
  WORLD_AFROBEAT,
  WORLD_REGGAE,
  WORLD_TABLA_TEENTAL,
  
  // Fills
  FILL_BASIC_TOM,
  FILL_SNARE_ROLL,
  
  // Functions
  parseBeats,
  hitsOnBeats,
  applySwing,
  generateNotation,
  getPatternsByCategory,
  getPatternsByTag,
  getPatternById,
  getAllCategories,
  getAllTags,
};
