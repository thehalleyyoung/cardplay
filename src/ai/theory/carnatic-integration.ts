/**
 * @fileoverview Carnatic Music Integration
 * 
 * Carnatic-specific theory integrations including:
 * - Mridangam syllable mapping (C628)
 * - Korvai arithmetic helpers (C630)
 * - Gamaka MIDI rendering (C635, C636)
 * - Eduppu support for tracker grid (C623)
 * 
 * @module @cardplay/ai/theory/carnatic-integration
 */

// ============================================================================
// MRIDANGAM SYLLABLES MAPPING (C628)
// ============================================================================

/**
 * Mridangam syllable definition
 */
export interface MridangamSyllable {
  /** The syllable (bol) */
  readonly bol: string;
  /** MIDI note number for sampler */
  readonly midiNote: number;
  /** Hand: left (thoppi), right (valanthalai), or both */
  readonly hand: 'left' | 'right' | 'both';
  /** Stroke type */
  readonly strokeType: 'open' | 'closed' | 'resonant' | 'muted';
  /** Relative dynamic level (0-1) */
  readonly dynamicLevel: number;
  /** Duration category */
  readonly duration: 'short' | 'medium' | 'long';
  /** Description */
  readonly description: string;
}

/**
 * Complete mridangam syllable (bol) mapping
 */
export const MRIDANGAM_SYLLABLES: ReadonlyMap<string, MridangamSyllable> = new Map([
  // Right hand (Valanthalai) strokes
  ['tha', {
    bol: 'tha',
    midiNote: 112,
    hand: 'right',
    strokeType: 'closed',
    dynamicLevel: 0.7,
    duration: 'short',
    description: 'Basic right-hand closed stroke',
  }],
  ['thom', {
    bol: 'thom',
    midiNote: 113,
    hand: 'right',
    strokeType: 'open',
    dynamicLevel: 0.9,
    duration: 'long',
    description: 'Open bass stroke on right head',
  }],
  ['nam', {
    bol: 'nam',
    midiNote: 114,
    hand: 'right',
    strokeType: 'resonant',
    dynamicLevel: 0.8,
    duration: 'medium',
    description: 'Resonant stroke on rim',
  }],
  ['din', {
    bol: 'din',
    midiNote: 115,
    hand: 'right',
    strokeType: 'closed',
    dynamicLevel: 0.6,
    duration: 'short',
    description: 'Muted stroke with finger',
  }],
  ['chapu', {
    bol: 'chapu',
    midiNote: 116,
    hand: 'right',
    strokeType: 'muted',
    dynamicLevel: 0.5,
    duration: 'short',
    description: 'Slap stroke',
  }],
  ['dheem', {
    bol: 'dheem',
    midiNote: 117,
    hand: 'both',
    strokeType: 'resonant',
    dynamicLevel: 1.0,
    duration: 'long',
    description: 'Combined resonant stroke on both heads',
  }],
  // Left hand (Thoppi) strokes
  ['ki', {
    bol: 'ki',
    midiNote: 118,
    hand: 'left',
    strokeType: 'closed',
    dynamicLevel: 0.4,
    duration: 'short',
    description: 'Light left-hand tap',
  }],
  ['ta', {
    bol: 'ta',
    midiNote: 119,
    hand: 'left',
    strokeType: 'open',
    dynamicLevel: 0.7,
    duration: 'medium',
    description: 'Open left-hand stroke',
  }],
  // Combined strokes
  ['thaka', {
    bol: 'thaka',
    midiNote: 112,
    hand: 'both',
    strokeType: 'closed',
    dynamicLevel: 0.7,
    duration: 'short',
    description: 'Quick alternating tha-ka',
  }],
  ['dhinna', {
    bol: 'dhinna',
    midiNote: 115,
    hand: 'both',
    strokeType: 'resonant',
    dynamicLevel: 0.8,
    duration: 'medium',
    description: 'Combined din-na pattern',
  }],
]);

/**
 * Get mridangam syllable by bol name
 */
export function getMridangamSyllable(bol: string): MridangamSyllable | undefined {
  return MRIDANGAM_SYLLABLES.get(bol.toLowerCase());
}

/**
 * Convert mridangam syllable sequence to MIDI notes
 */
export function syllablesToMidi(
  syllables: readonly string[],
  baseVelocity: number = 80
): { note: number; velocity: number }[] {
  return syllables.map(bol => {
    const syllable = getMridangamSyllable(bol);
    if (!syllable) {
      return { note: 113, velocity: baseVelocity }; // Default to thom
    }
    return {
      note: syllable.midiNote,
      velocity: Math.round(baseVelocity * syllable.dynamicLevel),
    };
  });
}

// ============================================================================
// KORVAI ARITHMETIC HELPERS (C630)
// ============================================================================

/**
 * Korvai definition - rhythmic composition fitting tala cycle
 */
export interface KorvaiDefinition {
  /** Total aksharas (beats) to fill */
  readonly totalAksharas: number;
  /** Number of repetitions of main phrase */
  readonly repetitions: number;
  /** Phrase length in aksharas */
  readonly phraseLength: number;
  /** Gap (karvai) length between phrases */
  readonly gapLength: number;
  /** Calculated total: repetitions * (phraseLength + gapLength) */
  readonly calculatedTotal: number;
  /** Whether it fits exactly */
  readonly fitsExactly: boolean;
}

/**
 * Calculate korvai arithmetic - find phrase/gap combinations that fill a cycle
 */
export function calculateKorvai(
  totalAksharas: number,
  repetitions: number,
  phraseLength: number
): KorvaiDefinition {
  // Total = reps * phrase + (reps - 1) * gap + final phrase
  // Total = reps * phrase + (reps - 1) * gap
  // gap = (total - reps * phrase) / (reps - 1)
  
  const remainingAfterPhrases = totalAksharas - (repetitions * phraseLength);
  const gapLength = repetitions > 1 ? 
    Math.floor(remainingAfterPhrases / (repetitions - 1)) : 0;
  
  const calculatedTotal = repetitions > 1 ?
    (repetitions * phraseLength) + ((repetitions - 1) * gapLength) :
    phraseLength;
  
  return {
    totalAksharas,
    repetitions,
    phraseLength,
    gapLength,
    calculatedTotal,
    fitsExactly: calculatedTotal === totalAksharas,
  };
}

/**
 * Find all valid korvai combinations for a given cycle length
 */
export function findKorvaiCombinations(
  totalAksharas: number,
  minPhraseLength: number = 2,
  maxPhraseLength: number = 8,
  allowedReps: readonly number[] = [3, 5, 7]
): KorvaiDefinition[] {
  const combinations: KorvaiDefinition[] = [];
  
  for (const reps of allowedReps) {
    for (let phraseLen = minPhraseLength; phraseLen <= maxPhraseLength; phraseLen++) {
      const korvai = calculateKorvai(totalAksharas, reps, phraseLen);
      if (korvai.fitsExactly && korvai.gapLength >= 0) {
        combinations.push(korvai);
      }
    }
  }
  
  return combinations;
}

/**
 * Calculate total aksharas for a tala cycle
 */
export function getTalaCycleLength(
  talaName: string,
  jati: number = 4
): number {
  const talaStructures: Record<string, { laghuCount: number; drutamCount: number; anudrutamCount: number }> = {
    'adi': { laghuCount: 1, drutamCount: 2, anudrutamCount: 0 }, // L + D + D
    'rupaka': { laghuCount: 1, drutamCount: 1, anudrutamCount: 0 }, // D + L
    'triputa': { laghuCount: 1, drutamCount: 2, anudrutamCount: 0 }, // L + D + D
    'jhampa': { laghuCount: 1, drutamCount: 0, anudrutamCount: 1 }, // L + A + D
    'ata': { laghuCount: 2, drutamCount: 2, anudrutamCount: 0 }, // L + L + D + D
    'eka': { laghuCount: 1, drutamCount: 0, anudrutamCount: 0 }, // L only
    'dhruva': { laghuCount: 3, drutamCount: 1, anudrutamCount: 0 }, // L + D + L + L
  };
  
  const structure = talaStructures[talaName.toLowerCase()];
  if (!structure) return 8; // Default to adi tala chatusra jati
  
  const laghuBeats = structure.laghuCount * jati;
  const drutamBeats = structure.drutamCount * 2;
  const anudrutamBeats = structure.anudrutamCount * 1;
  
  return laghuBeats + drutamBeats + anudrutamBeats;
}

// ============================================================================
// EDUPPU SUPPORT (C623)
// ============================================================================

/**
 * Eduppu (pickup/anacrusis) configuration
 */
export interface EduppuConfig {
  /** Offset from sam (downbeat) in aksharas */
  readonly offset: number;
  /** Type of eduppu */
  readonly type: 'sama' | 'vishama' | 'atita' | 'anagata';
  /** Description */
  readonly description: string;
}

/**
 * Predefined eduppu types
 */
export const EDUPPU_TYPES: ReadonlyMap<string, EduppuConfig> = new Map([
  ['sama', {
    offset: 0,
    type: 'sama',
    description: 'Starting on sam (the first beat of the cycle)',
  }],
  ['vishama', {
    offset: 0.5,
    type: 'vishama',
    description: 'Starting on the off-beat (half akshara before sam)',
  }],
  ['atita', {
    offset: -1,
    type: 'atita',
    description: 'Starting one akshara before sam (anticipation)',
  }],
  ['anagata', {
    offset: 1,
    type: 'anagata',
    description: 'Starting one akshara after sam (delayed entry)',
  }],
]);

/**
 * Get eduppu configuration by type
 */
export function getEduppuConfig(type: string): EduppuConfig | undefined {
  return EDUPPU_TYPES.get(type.toLowerCase());
}

/**
 * Calculate phrase start position with eduppu offset
 */
export function calculatePhraseStartWithEduppu(
  cycleStart: number,
  eduppuType: string,
  rowsPerAkshara: number
): number {
  const config = getEduppuConfig(eduppuType);
  if (!config) return cycleStart;
  
  return cycleStart + Math.floor(config.offset * rowsPerAkshara);
}

// ============================================================================
// GAMAKA MIDI RENDERING (C635, C636)
// ============================================================================

/**
 * Gamaka type definition
 */
export type GamakaType = 
  | 'kampita'    // Oscillation around a note
  | 'janta'      // Stressed repeated note
  | 'spurita'    // Grace note from below
  | 'pratyahata' // Grace note from above
  | 'nokku'      // Hammered note
  | 'orikkai'    // Slide up
  | 'irakka'     // Slide down
  | 'ravai'      // Shake/trill
  | 'khandippu'  // Cutting off a note
  | 'odukkal';   // Quick release

/**
 * Gamaka rendering configuration
 */
export interface GamakaConfig {
  /** Gamaka type */
  readonly type: GamakaType;
  /** Pitch bend depth in cents */
  readonly bendDepth: number;
  /** Duration of bend as ratio of note duration (0-1) */
  readonly bendDurationRatio: number;
  /** Number of oscillations (for kampita, ravai) */
  readonly oscillations?: number;
  /** Attack curve type */
  readonly curve: 'linear' | 'exponential' | 'sine';
  /** Whether to use modwheel instead of pitch bend */
  readonly useModWheel: boolean;
}

/**
 * Predefined gamaka configurations
 */
export const GAMAKA_CONFIGS: ReadonlyMap<GamakaType, GamakaConfig> = new Map([
  ['kampita', {
    type: 'kampita',
    bendDepth: 50, // cents
    bendDurationRatio: 0.8,
    oscillations: 3,
    curve: 'sine',
    useModWheel: false,
  }],
  ['janta', {
    type: 'janta',
    bendDepth: 0,
    bendDurationRatio: 0.5,
    curve: 'linear',
    useModWheel: true,
  }],
  ['spurita', {
    type: 'spurita',
    bendDepth: -100, // Start from below
    bendDurationRatio: 0.2,
    curve: 'exponential',
    useModWheel: false,
  }],
  ['pratyahata', {
    type: 'pratyahata',
    bendDepth: 100, // Start from above
    bendDurationRatio: 0.2,
    curve: 'exponential',
    useModWheel: false,
  }],
  ['orikkai', {
    type: 'orikkai',
    bendDepth: -200, // Slide from 2 semitones below
    bendDurationRatio: 0.4,
    curve: 'linear',
    useModWheel: false,
  }],
  ['irakka', {
    type: 'irakka',
    bendDepth: 200, // Slide down by 2 semitones
    bendDurationRatio: 0.4,
    curve: 'linear',
    useModWheel: false,
  }],
  ['ravai', {
    type: 'ravai',
    bendDepth: 30,
    bendDurationRatio: 0.9,
    oscillations: 6,
    curve: 'sine',
    useModWheel: false,
  }],
  ['nokku', {
    type: 'nokku',
    bendDepth: 0,
    bendDurationRatio: 0.1,
    curve: 'exponential',
    useModWheel: true, // Use velocity/modwheel for emphasis
  }],
  ['khandippu', {
    type: 'khandippu',
    bendDepth: 0,
    bendDurationRatio: 0.7, // Cut short
    curve: 'linear',
    useModWheel: false,
  }],
  ['odukkal', {
    type: 'odukkal',
    bendDepth: 50,
    bendDurationRatio: 0.1, // Very quick release
    curve: 'exponential',
    useModWheel: false,
  }],
]);

/**
 * Get gamaka configuration by type
 */
export function getGamakaConfig(type: GamakaType): GamakaConfig | undefined {
  return GAMAKA_CONFIGS.get(type);
}

/**
 * MIDI pitch bend value
 */
export interface PitchBendPoint {
  /** Time offset from note start (0-1 normalized) */
  readonly time: number;
  /** Pitch bend value (-8192 to 8191, 0 = center) */
  readonly value: number;
}

/**
 * Generate pitch bend curve for a gamaka.
 * 
 * This is the C636 integration: gamaka to MIDI mapping rules.
 */
export function generateGamakaPitchBend(
  gamakaType: GamakaType,
  _noteDuration: number, // in ticks (kept for API compatibility)
  samplePoints: number = 10
): PitchBendPoint[] {
  const config = GAMAKA_CONFIGS.get(gamakaType);
  if (!config) return [{ time: 0, value: 0 }];
  
  const points: PitchBendPoint[] = [];
  
  // Convert cents to pitch bend value (8192 = 200 cents typically)
  const centsToBend = (cents: number) => Math.round((cents / 200) * 8192);
  
  const bendValue = centsToBend(config.bendDepth);
  
  for (let i = 0; i <= samplePoints; i++) {
    const t = i / samplePoints;
    const normalizedT = t / config.bendDurationRatio; // Compress to duration ratio
    
    if (normalizedT > 1) {
      // After gamaka ends, return to center
      points.push({ time: t, value: 0 });
      continue;
    }
    
    let value: number;
    
    switch (config.curve) {
      case 'sine':
        if (config.oscillations) {
          // Oscillating bend (kampita, ravai)
          const oscillation = Math.sin(normalizedT * config.oscillations * 2 * Math.PI);
          const envelope = 1 - normalizedT * 0.3; // Slight decay
          value = Math.round(bendValue * oscillation * envelope);
        } else {
          value = Math.round(bendValue * Math.sin(normalizedT * Math.PI / 2));
        }
        break;
        
      case 'exponential':
        // Fast approach to target (spurita, pratyahata)
        const expT = 1 - Math.exp(-3 * normalizedT);
        value = Math.round(bendValue * (1 - expT));
        break;
        
      case 'linear':
      default:
        // Linear slide (orikkai, irakka)
        value = Math.round(bendValue * (1 - normalizedT));
        break;
    }
    
    points.push({ time: t, value: Math.max(-8192, Math.min(8191, value)) });
  }
  
  return points;
}

/**
 * Gamaka MIDI output
 */
export interface GamakaMidiOutput {
  /** Original note */
  readonly note: number;
  /** Velocity */
  readonly velocity: number;
  /** Note duration in ticks */
  readonly duration: number;
  /** Pitch bend curve */
  readonly pitchBend: readonly PitchBendPoint[];
  /** Modwheel values (if applicable) */
  readonly modWheel?: readonly { time: number; value: number }[];
}

/**
 * Render a note with gamaka to MIDI output.
 * 
 * This is the C635 integration: gamaka renderer placeholder for MIDI.
 */
export function renderNoteWithGamaka(
  note: number,
  velocity: number,
  duration: number,
  gamakaType: GamakaType,
  intensity: number = 1.0
): GamakaMidiOutput {
  const config = GAMAKA_CONFIGS.get(gamakaType);
  const pitchBend = generateGamakaPitchBend(gamakaType, duration);
  
  // Scale pitch bend by intensity
  const scaledPitchBend = pitchBend.map(p => ({
    ...p,
    value: Math.round(p.value * intensity),
  }));
  
  const output: GamakaMidiOutput = {
    note,
    velocity,
    duration: config?.type === 'khandippu' ? 
      Math.round(duration * config.bendDurationRatio) : duration,
    pitchBend: scaledPitchBend,
  };
  
  // Add modwheel for certain gamakas
  if (config?.useModWheel) {
    const modWheel = [
      { time: 0, value: Math.round(127 * intensity) },
      { time: 0.5, value: Math.round(80 * intensity) },
      { time: 1, value: 0 },
    ];
    return { ...output, modWheel };
  }
  
  return output;
}

// ============================================================================
// SHRUTI (MICROTONAL) PLACEHOLDER (C626)
// ============================================================================

/**
 * Shruti definition - microtonal offset in cents
 */
export interface ShrutiOffset {
  /** Swara (note) name */
  readonly swara: string;
  /** Cents offset from 12-TET */
  readonly centsOffset: number;
  /** Whether this is a standard (prakruti) or variant (vikruti) swara */
  readonly variant: 'prakruti' | 'vikruti';
}

/**
 * Common shruti offsets for major swaras
 * These are approximate values - actual values vary by tradition and raga
 */
export const SHRUTI_OFFSETS: ReadonlyMap<string, ShrutiOffset[]> = new Map([
  ['Sa', [
    { swara: 'Sa', centsOffset: 0, variant: 'prakruti' },
  ]],
  ['Ri', [
    { swara: 'Ri1', centsOffset: -22, variant: 'vikruti' }, // Shuddha (lowered)
    { swara: 'Ri2', centsOffset: 0, variant: 'prakruti' },  // Chatushruti
    { swara: 'Ri3', centsOffset: +22, variant: 'vikruti' }, // Shatshruti
  ]],
  ['Ga', [
    { swara: 'Ga1', centsOffset: -22, variant: 'vikruti' },
    { swara: 'Ga2', centsOffset: 0, variant: 'prakruti' },
    { swara: 'Ga3', centsOffset: +22, variant: 'vikruti' },
  ]],
  ['Ma', [
    { swara: 'Ma1', centsOffset: 0, variant: 'prakruti' },  // Shuddha
    { swara: 'Ma2', centsOffset: +22, variant: 'vikruti' }, // Prati
  ]],
  ['Pa', [
    { swara: 'Pa', centsOffset: 0, variant: 'prakruti' },
  ]],
  ['Da', [
    { swara: 'Da1', centsOffset: -22, variant: 'vikruti' },
    { swara: 'Da2', centsOffset: 0, variant: 'prakruti' },
    { swara: 'Da3', centsOffset: +22, variant: 'vikruti' },
  ]],
  ['Ni', [
    { swara: 'Ni1', centsOffset: -22, variant: 'vikruti' },
    { swara: 'Ni2', centsOffset: 0, variant: 'prakruti' },
    { swara: 'Ni3', centsOffset: +22, variant: 'vikruti' },
  ]],
]);

/**
 * Get shruti offset for a swara
 */
export function getShrutiOffset(swara: string, variant: number = 2): ShrutiOffset | undefined {
  const offsets = SHRUTI_OFFSETS.get(swara);
  if (!offsets) return undefined;
  return offsets.find(o => o.swara.endsWith(String(variant))) ?? offsets[0];
}
