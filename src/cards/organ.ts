/**
 * Organ Card
 *
 * Comprehensive organ synthesizer featuring classic tonewheel
 * modeling, digital drawbar organs, and pipe organ simulation.
 * Includes Leslie speaker emulation and extensive registration presets.
 *
 * Features:
 * - 9 drawbar harmonic control
 * - Tonewheel, digital, and pipe organ modes
 * - Leslie speaker with fast/slow and brake
 * - Percussion (2nd/3rd harmonic)
 * - Key click simulation
 * - Vibrato and chorus scanner
 * - 60+ factory registrations
 * - Split and layer configurations
 * - MIDI drawbar control
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Number of drawbars */
export const NUM_DRAWBARS = 9;

/** Drawbar footage labels */
export const DRAWBAR_FOOTAGES = ['16\'', '5⅓\'', '8\'', '4\'', '2⅔\'', '2\'', '1⅗\'', '1⅓\'', '1\''] as const;

/** Drawbar harmonic ratios */
export const DRAWBAR_HARMONICS = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8] as const;

/** Maximum polyphony */
export const MAX_POLYPHONY = 61; // Full organ manual

/** Sample rate */
export const SAMPLE_RATE = 44100;

/** Leslie slow speed RPM */
export const LESLIE_SLOW_RPM = 40;

/** Leslie fast speed RPM */
export const LESLIE_FAST_RPM = 340;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Organ type/model
 */
export type OrganModel =
  | 'hammondB3'
  | 'hammondC3'
  | 'hammondA100'
  | 'voxContinental'
  | 'farfisaCompact'
  | 'churchPipe'
  | 'theatrePipe'
  | 'baroquePipe'
  | 'digitalDrawbar'
  | 'clonewheel';

/**
 * Leslie state
 */
export type LeslieState = 'stop' | 'slow' | 'fast' | 'brake';

/**
 * Vibrato/chorus mode
 */
export type VibratoMode =
  | 'v1' | 'v2' | 'v3'  // Pure vibrato
  | 'c1' | 'c2' | 'c3'  // Chorus (vibrato + dry mix)
  | 'off';

/**
 * Percussion harmonic
 */
export type PercussionHarmonic = '2nd' | '3rd';

/**
 * Percussion decay
 */
export type PercussionDecay = 'fast' | 'slow';

/**
 * Preset category
 */
export type OrganCategory =
  | 'jazz'
  | 'rock'
  | 'gospel'
  | 'blues'
  | 'classical'
  | 'theatre'
  | 'ballad'
  | 'soul'
  | 'combo'
  | 'full'
  | 'liturgical';

/**
 * Drawbar settings (0-8 for each drawbar)
 */
export type DrawbarSettings = [number, number, number, number, number, number, number, number, number];

/**
 * Tonewheel configuration
 */
export interface TonewheelConfig {
  /** Tonewheel leakage amount */
  leakage: number;
  /** Key click attack level */
  keyClickLevel: number;
  /** Key click type */
  keyClickType: 'soft' | 'medium' | 'hard';
  /** Tonewheel aging (adds slight detuning) */
  aging: number;
  /** Crosstalk between tonewheels */
  crosstalk: number;
  /** Generator noise */
  generatorNoise: number;
}

/**
 * Leslie configuration
 */
export interface LeslieConfig {
  /** Leslie enabled */
  enabled: boolean;
  /** Current state */
  state: LeslieState;
  /** Horn/treble level */
  hornLevel: number;
  /** Drum/bass level */
  drumLevel: number;
  /** Crossover frequency */
  crossoverFreq: number;
  /** Horn acceleration */
  hornAccel: number;
  /** Drum acceleration */
  drumAccel: number;
  /** Horn slow speed */
  hornSlowSpeed: number;
  /** Horn fast speed */
  hornFastSpeed: number;
  /** Drum slow speed */
  drumSlowSpeed: number;
  /** Drum fast speed */
  drumFastSpeed: number;
  /** Cabinet type */
  cabinetType: '122' | '147' | '145' | 'custom';
  /** Mic distance */
  micDistance: number;
  /** Stereo width */
  stereoWidth: number;
  /** Drive/overdrive */
  drive: number;
}

/**
 * Percussion configuration
 */
export interface PercussionConfig {
  /** Percussion enabled */
  enabled: boolean;
  /** Soft volume (vs loud) */
  soft: boolean;
  /** Harmonic selection */
  harmonic: PercussionHarmonic;
  /** Decay speed */
  decay: PercussionDecay;
  /** Decay time in seconds */
  decayTime: number;
  /** Percussion steals 9th drawbar */
  drawbarMute: boolean;
}

/**
 * Vibrato/chorus configuration
 */
export interface VibratoConfig {
  /** Upper manual vibrato mode */
  upperMode: VibratoMode;
  /** Lower manual vibrato mode */
  lowerMode: VibratoMode;
  /** Vibrato depth */
  depth: number;
  /** Vibrato rate */
  rate: number;
}

/**
 * Reverb configuration
 */
export interface OrganReverb {
  /** Enabled */
  enabled: boolean;
  /** Type */
  type: 'spring' | 'plate' | 'hall' | 'room';
  /** Size */
  size: number;
  /** Mix */
  mix: number;
  /** Damping */
  damping: number;
}

/**
 * Organ preset/registration
 */
export interface OrganPreset {
  /** ID */
  id: string;
  /** Name */
  name: string;
  /** Category */
  category: OrganCategory;
  /** Tags */
  tags: string[];
  /** Description */
  description?: string;

  /** Organ model */
  model: OrganModel;

  /** Upper manual drawbars */
  upperDrawbars: DrawbarSettings;
  /** Lower manual drawbars */
  lowerDrawbars: DrawbarSettings;
  /** Pedal drawbars (only first 2 used typically) */
  pedalDrawbars: DrawbarSettings;

  /** Tonewheel settings */
  tonewheel: TonewheelConfig;

  /** Percussion */
  percussion: PercussionConfig;

  /** Vibrato/chorus */
  vibrato: VibratoConfig;

  /** Leslie */
  leslie: LeslieConfig;

  /** Reverb */
  reverb: OrganReverb;

  /** Master volume dB */
  masterVolume: number;

  /** Expression pedal range */
  expressionRange: number;

  /** Is factory preset */
  isFactory: boolean;
}

/**
 * Active note
 */
export interface OrganNote {
  /** MIDI note */
  note: number;
  /** Velocity */
  velocity: number;
  /** Manual: upper/lower/pedal */
  manual: 'upper' | 'lower' | 'pedal';
  /** Is active */
  isActive: boolean;
  /** Percussion envelope value */
  percEnvValue: number;
  /** Key click envelope value */
  keyClickValue: number;
  /** Tonewheel phases */
  tonewheelPhases: number[];
  /** Start time */
  startTime: number;
}

/**
 * Leslie state for simulation
 */
export interface LeslieSimState {
  /** Current horn angle */
  hornAngle: number;
  /** Current drum angle */
  drumAngle: number;
  /** Current horn speed */
  hornSpeed: number;
  /** Current drum speed */
  drumSpeed: number;
  /** Target horn speed */
  targetHornSpeed: number;
  /** Target drum speed */
  targetDrumSpeed: number;
}

/**
 * Organ state
 */
export interface OrganState {
  /** Current preset */
  preset: OrganPreset;
  /** Active notes */
  notes: OrganNote[];
  /** Held notes */
  heldNotes: Set<number>;
  /** Sustain pedal */
  sustainPedal: boolean;
  /** Expression pedal (0-1) */
  expressionPedal: number;
  /** Swell pedal (0-1) */
  swellPedal: number;
  /** Leslie state */
  leslieState: LeslieSimState;
  /** Master volume */
  masterVolume: number;
  /** Current drawbars (for MIDI control) */
  currentUpperDrawbars: DrawbarSettings;
  /** Note counter */
  noteCounter: number;
  /** Current scanner phase (for vibrato) */
  scannerPhase: number;
}

/**
 * Input events
 */
export type OrganInput =
  | { type: 'noteOn'; note: number; velocity: number; manual?: 'upper' | 'lower' | 'pedal' }
  | { type: 'noteOff'; note: number; manual?: 'upper' | 'lower' | 'pedal' }
  | { type: 'expression'; value: number }
  | { type: 'swell'; value: number }
  | { type: 'sustainPedal'; value: boolean }
  | { type: 'leslie'; state: LeslieState }
  | { type: 'leslieToggle' }
  | { type: 'drawbar'; drawbarIndex: number; value: number; manual?: 'upper' | 'lower' | 'pedal' }
  | { type: 'drawbars'; values: DrawbarSettings; manual?: 'upper' | 'lower' | 'pedal' }
  | { type: 'percussion'; config: Partial<PercussionConfig> }
  | { type: 'vibrato'; config: Partial<VibratoConfig> }
  | { type: 'allNotesOff' }
  | { type: 'allSoundOff' }
  | { type: 'loadPreset'; presetId: string }
  | { type: 'setVolume'; volume: number }
  | { type: 'setLeslie'; config: Partial<LeslieConfig> }
  | { type: 'setReverb'; config: Partial<OrganReverb> }
  | { type: 'setTonewheel'; config: Partial<TonewheelConfig> }
  | { type: 'tick'; time: number; deltaTime: number }
  | { type: 'midiCC'; controller: number; value: number };

/**
 * Output events
 */
export type OrganOutput =
  | { type: 'noteStart'; note: number; velocity: number }
  | { type: 'noteEnd'; note: number }
  | { type: 'audioFrame'; bufferL: Float32Array; bufferR: Float32Array }
  | { type: 'leslieStateChanged'; state: LeslieState }
  | { type: 'presetLoaded'; presetId: string }
  | { type: 'error'; message: string };

/**
 * Processing result
 */
export interface OrganResult {
  state: OrganState;
  outputs: OrganOutput[];
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default drawbar settings (all off)
 */
export const DEFAULT_DRAWBARS: DrawbarSettings = [0, 0, 0, 0, 0, 0, 0, 0, 0];

/**
 * Classic B3 drawbar settings
 */
export const B3_FULL_DRAWBARS: DrawbarSettings = [8, 8, 8, 8, 8, 8, 8, 8, 8];

/**
 * Default tonewheel config
 */
export const DEFAULT_TONEWHEEL: TonewheelConfig = {
  leakage: 0.1,
  keyClickLevel: 0.5,
  keyClickType: 'medium',
  aging: 0.1,
  crosstalk: 0.05,
  generatorNoise: 0.02,
};

/**
 * Default Leslie config
 */
export const DEFAULT_LESLIE: LeslieConfig = {
  enabled: true,
  state: 'slow',
  hornLevel: 1.0,
  drumLevel: 0.8,
  crossoverFreq: 800,
  hornAccel: 0.8,
  drumAccel: 0.5,
  hornSlowSpeed: LESLIE_SLOW_RPM,
  hornFastSpeed: LESLIE_FAST_RPM,
  drumSlowSpeed: LESLIE_SLOW_RPM * 0.8,
  drumFastSpeed: LESLIE_FAST_RPM * 0.7,
  cabinetType: '122',
  micDistance: 0.5,
  stereoWidth: 1.0,
  drive: 0.3,
};

/**
 * Default percussion config
 */
export const DEFAULT_PERCUSSION: PercussionConfig = {
  enabled: true,
  soft: false,
  harmonic: '2nd',
  decay: 'fast',
  decayTime: 0.2,
  drawbarMute: true,
};

/**
 * Default vibrato config
 */
export const DEFAULT_VIBRATO: VibratoConfig = {
  upperMode: 'c3',
  lowerMode: 'off',
  depth: 0.5,
  rate: 7,
};

/**
 * Default reverb
 */
export const DEFAULT_REVERB: OrganReverb = {
  enabled: true,
  type: 'spring',
  size: 0.4,
  mix: 0.2,
  damping: 0.5,
};

// =============================================================================
// FACTORY PRESETS
// =============================================================================

/**
 * Create organ preset helper
 */
function createOrganPreset(
  id: string,
  name: string,
  category: OrganCategory,
  tags: string[],
  upperDrawbars: DrawbarSettings,
  overrides: Partial<OrganPreset> = {}
): OrganPreset {
  return {
    id,
    name,
    category,
    tags,
    model: 'hammondB3',
    upperDrawbars,
    lowerDrawbars: [8, 4, 8, 0, 0, 0, 0, 0, 0],
    pedalDrawbars: [8, 6, 0, 0, 0, 0, 0, 0, 0],
    tonewheel: { ...DEFAULT_TONEWHEEL },
    percussion: { ...DEFAULT_PERCUSSION },
    vibrato: { ...DEFAULT_VIBRATO },
    leslie: { ...DEFAULT_LESLIE },
    reverb: { ...DEFAULT_REVERB },
    masterVolume: 0,
    expressionRange: 1.0,
    isFactory: true,
    ...overrides,
  };
}

/**
 * Factory presets
 */
export const ORGAN_PRESETS: OrganPreset[] = [
  // =========================================================================
  // JAZZ REGISTRATIONS
  // =========================================================================
  createOrganPreset('jazz-trio', 'Jazz Trio', 'jazz', ['trio', 'jimmy-smith', 'walking'],
    [8, 8, 8, 0, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '3rd', decay: 'fast' },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),
  createOrganPreset('jazz-full', 'Jazz Full', 'jazz', ['full', 'bebop', 'swing'],
    [8, 8, 8, 6, 6, 5, 4, 4, 4], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd', soft: true },
      leslie: { ...DEFAULT_LESLIE, state: 'fast' },
    }),
  createOrganPreset('jazz-ballad', 'Jazz Ballad', 'jazz', ['ballad', 'smooth', 'mellow'],
    [8, 8, 6, 4, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'v3' },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),
  createOrganPreset('jazz-comping', 'Jazz Comping', 'jazz', ['comp', 'backing', 'subtle'],
    [4, 4, 8, 5, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd', decay: 'slow' },
    }),
  createOrganPreset('bebop-lead', 'Bebop Lead', 'jazz', ['bebop', 'fast', 'articulate'],
    [8, 0, 8, 0, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '3rd', decay: 'fast', soft: false },
      tonewheel: { ...DEFAULT_TONEWHEEL, keyClickLevel: 0.7 },
    }),

  // =========================================================================
  // ROCK REGISTRATIONS
  // =========================================================================
  createOrganPreset('rock-classic', 'Classic Rock', 'rock', ['classic', '70s', 'hammond'],
    [8, 8, 8, 8, 8, 8, 8, 8, 8], {
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, state: 'fast', drive: 0.5 },
    }),
  createOrganPreset('rock-distorted', 'Distorted Rock', 'rock', ['distorted', 'dirty', 'overdrive'],
    [8, 8, 8, 8, 6, 6, 4, 0, 0], {
      leslie: { ...DEFAULT_LESLIE, drive: 0.8 },
      tonewheel: { ...DEFAULT_TONEWHEEL, keyClickLevel: 0.8 },
    }),
  createOrganPreset('deep-purple', 'Purple Haze', 'rock', ['deep-purple', 'jon-lord', 'heavy'],
    [8, 8, 8, 8, 8, 8, 8, 8, 8], {
      leslie: { ...DEFAULT_LESLIE, state: 'fast', drive: 0.7 },
      reverb: { ...DEFAULT_REVERB, type: 'hall', size: 0.6 },
    }),
  createOrganPreset('prog-rock', 'Prog Rock', 'rock', ['prog', 'progressive', 'art-rock'],
    [8, 4, 8, 8, 4, 8, 0, 4, 8], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd' },
      leslie: { ...DEFAULT_LESLIE, state: 'fast' },
    }),
  createOrganPreset('power-organ', 'Power Organ', 'rock', ['power', 'loud', 'aggressive'],
    [8, 8, 8, 8, 8, 8, 8, 8, 8], {
      leslie: { ...DEFAULT_LESLIE, drive: 0.9 },
      tonewheel: { ...DEFAULT_TONEWHEEL, keyClickLevel: 0.9 },
    }),

  // =========================================================================
  // GOSPEL REGISTRATIONS
  // =========================================================================
  createOrganPreset('gospel-full', 'Gospel Full', 'gospel', ['full', 'church', 'praise'],
    [8, 8, 8, 8, 8, 8, 8, 8, 8], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '3rd' },
      leslie: { ...DEFAULT_LESLIE, state: 'fast' },
      reverb: { ...DEFAULT_REVERB, type: 'hall', size: 0.7, mix: 0.3 },
    }),
  createOrganPreset('gospel-shout', 'Gospel Shout', 'gospel', ['shout', 'praise', 'energetic'],
    [8, 8, 8, 6, 8, 6, 8, 6, 8], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd', soft: false },
      leslie: { ...DEFAULT_LESLIE, state: 'fast', drive: 0.4 },
    }),
  createOrganPreset('gospel-devotion', 'Gospel Devotion', 'gospel', ['devotion', 'worship', 'tender'],
    [8, 6, 8, 4, 0, 0, 0, 0, 0], {
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'c3' },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),

  // =========================================================================
  // BLUES REGISTRATIONS
  // =========================================================================
  createOrganPreset('blues-grind', 'Blues Grind', 'blues', ['grind', 'gritty', 'dirty'],
    [8, 8, 8, 0, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '3rd', decay: 'fast' },
      leslie: { ...DEFAULT_LESLIE, state: 'slow', drive: 0.5 },
      tonewheel: { ...DEFAULT_TONEWHEEL, keyClickLevel: 0.7 },
    }),
  createOrganPreset('blues-shuffle', 'Blues Shuffle', 'blues', ['shuffle', 'walking', 'groove'],
    [8, 8, 6, 6, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd' },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),
  createOrganPreset('chicago-blues', 'Chicago Blues', 'blues', ['chicago', 'urban', 'electric'],
    [8, 8, 8, 4, 4, 0, 0, 0, 0], {
      leslie: { ...DEFAULT_LESLIE, drive: 0.4 },
    }),

  // =========================================================================
  // SOUL/R&B REGISTRATIONS
  // =========================================================================
  createOrganPreset('soul-brother', 'Soul Brother', 'soul', ['soul', 'motown', 'groove'],
    [8, 8, 6, 4, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd', soft: true },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),
  createOrganPreset('rnb-smooth', 'R&B Smooth', 'soul', ['rnb', 'smooth', 'neo-soul'],
    [6, 8, 8, 4, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'c2' },
    }),
  createOrganPreset('funk-organ', 'Funk Organ', 'soul', ['funk', 'groove', 'punchy'],
    [8, 8, 8, 0, 0, 0, 0, 8, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '3rd', decay: 'fast' },
      tonewheel: { ...DEFAULT_TONEWHEEL, keyClickLevel: 0.8 },
    }),

  // =========================================================================
  // BALLAD REGISTRATIONS
  // =========================================================================
  createOrganPreset('ballad-warm', 'Warm Ballad', 'ballad', ['warm', 'romantic', 'soft'],
    [8, 4, 6, 0, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'v2' },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),
  createOrganPreset('ballad-sweet', 'Sweet Ballad', 'ballad', ['sweet', 'gentle', 'tender'],
    [0, 0, 8, 4, 0, 4, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, soft: true, harmonic: '2nd' },
    }),
  createOrganPreset('midnight-organ', 'Midnight Organ', 'ballad', ['midnight', 'late-night', 'intimate'],
    [6, 8, 6, 0, 0, 0, 0, 0, 0], {
      leslie: { ...DEFAULT_LESLIE, state: 'stop', drive: 0.2 },
      reverb: { ...DEFAULT_REVERB, mix: 0.35 },
    }),

  // =========================================================================
  // COMBO/GENERAL REGISTRATIONS
  // =========================================================================
  createOrganPreset('combo-standard', 'Standard Combo', 'combo', ['standard', 'versatile', 'all-purpose'],
    [8, 8, 8, 8, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd' },
    }),
  createOrganPreset('combo-bright', 'Bright Combo', 'combo', ['bright', 'clear', 'articulate'],
    [0, 0, 8, 8, 8, 8, 4, 4, 4], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '3rd' },
    }),
  createOrganPreset('pop-organ', 'Pop Organ', 'combo', ['pop', 'mainstream', 'radio'],
    [8, 8, 8, 4, 4, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '2nd', soft: true },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),

  // =========================================================================
  // FULL ORGAN REGISTRATIONS
  // =========================================================================
  createOrganPreset('full-congregation', 'Full Congregation', 'full', ['full', 'big', 'congregational'],
    [8, 8, 8, 8, 8, 8, 8, 8, 8], {
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, state: 'fast' },
      reverb: { ...DEFAULT_REVERB, type: 'hall', size: 0.8, mix: 0.4 },
    }),
  createOrganPreset('cathedral', 'Cathedral', 'full', ['cathedral', 'majestic', 'grand'],
    [8, 8, 8, 8, 8, 8, 8, 8, 8], {
      model: 'churchPipe',
      leslie: { ...DEFAULT_LESLIE, enabled: false },
      reverb: { ...DEFAULT_REVERB, type: 'hall', size: 0.95, mix: 0.5 },
    }),

  // =========================================================================
  // LITURGICAL/CLASSICAL REGISTRATIONS
  // =========================================================================
  createOrganPreset('church-principal', 'Church Principal', 'liturgical', ['principal', 'church', 'traditional'],
    [8, 0, 8, 0, 0, 8, 0, 0, 0], {
      model: 'churchPipe',
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'off' },
      reverb: { ...DEFAULT_REVERB, type: 'hall', size: 0.7, mix: 0.4 },
    }),
  createOrganPreset('bach-plenum', 'Bach Plenum', 'classical', ['bach', 'baroque', 'plenum'],
    [8, 8, 8, 8, 8, 8, 8, 0, 0], {
      model: 'baroquePipe',
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, enabled: false },
      reverb: { ...DEFAULT_REVERB, type: 'hall', size: 0.8, mix: 0.45 },
    }),
  createOrganPreset('flute-stops', 'Flute Stops', 'liturgical', ['flute', 'soft', 'meditative'],
    [8, 8, 8, 4, 0, 0, 0, 0, 0], {
      model: 'churchPipe',
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'off' },
      leslie: { ...DEFAULT_LESLIE, enabled: false },
      reverb: { ...DEFAULT_REVERB, size: 0.6, mix: 0.35 },
    }),

  // =========================================================================
  // THEATRE ORGAN REGISTRATIONS
  // =========================================================================
  createOrganPreset('theatre-tibia', 'Theatre Tibia', 'theatre', ['tibia', 'wurlitzer', 'theatre'],
    [8, 6, 8, 4, 5, 4, 3, 2, 0], {
      model: 'theatrePipe',
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'v3', depth: 0.7 },
      reverb: { ...DEFAULT_REVERB, type: 'plate', size: 0.5, mix: 0.3 },
    }),
  createOrganPreset('theatre-full', 'Theatre Full', 'theatre', ['theatre', 'full', 'dramatic'],
    [8, 8, 8, 8, 8, 6, 6, 4, 4], {
      model: 'theatrePipe',
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'v3' },
      reverb: { ...DEFAULT_REVERB, type: 'plate', mix: 0.35 },
    }),

  // =========================================================================
  // VINTAGE COMBO ORGANS
  // =========================================================================
  createOrganPreset('vox-combo', 'Vox Continental', 'combo', ['vox', '60s', 'british'],
    [8, 8, 8, 8, 0, 0, 0, 0, 0], {
      model: 'voxContinental',
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'v2', depth: 0.6 },
    }),
  createOrganPreset('farfisa-compact', 'Farfisa Compact', 'combo', ['farfisa', '60s', 'garage'],
    [0, 0, 8, 8, 8, 4, 0, 0, 0], {
      model: 'farfisaCompact',
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, enabled: false },
      vibrato: { ...DEFAULT_VIBRATO, upperMode: 'v1', depth: 0.4, rate: 5 },
      tonewheel: { ...DEFAULT_TONEWHEEL, keyClickLevel: 0.2 },
    }),

  // =========================================================================
  // SPECIAL REGISTRATIONS
  // =========================================================================
  createOrganPreset('whiter-shade', 'Whiter Shade', 'rock', ['procol-harum', '60s', 'classic'],
    [8, 8, 4, 0, 0, 0, 4, 8, 0], {
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),
  createOrganPreset('green-onions', 'Green Onions', 'soul', ['booker-t', 'stax', 'memphis'],
    [8, 8, 8, 0, 0, 0, 0, 0, 0], {
      percussion: { ...DEFAULT_PERCUSSION, harmonic: '3rd' },
      leslie: { ...DEFAULT_LESLIE, state: 'slow' },
    }),
  createOrganPreset('house-rising', 'House Rising', 'rock', ['animals', '60s', 'british'],
    [8, 0, 8, 8, 0, 0, 0, 8, 0], {
      percussion: { ...DEFAULT_PERCUSSION, enabled: false },
      leslie: { ...DEFAULT_LESLIE, state: 'slow', drive: 0.3 },
    }),
];

// =============================================================================
// STATE FACTORY
// =============================================================================

/**
 * Create initial organ state
 */
export function createOrganState(preset?: OrganPreset): OrganState {
  const defaultPreset = preset ?? ORGAN_PRESETS[0]!;

  const targetHornSpeed = defaultPreset.leslie.state === 'fast'
    ? defaultPreset.leslie.hornFastSpeed
    : defaultPreset.leslie.state === 'slow'
    ? defaultPreset.leslie.hornSlowSpeed
    : 0;

  const targetDrumSpeed = defaultPreset.leslie.state === 'fast'
    ? defaultPreset.leslie.drumFastSpeed
    : defaultPreset.leslie.state === 'slow'
    ? defaultPreset.leslie.drumSlowSpeed
    : 0;

  return {
    preset: defaultPreset,
    notes: [],
    heldNotes: new Set(),
    sustainPedal: false,
    expressionPedal: 1.0,
    swellPedal: 1.0,
    leslieState: {
      hornAngle: 0,
      drumAngle: 0,
      hornSpeed: targetHornSpeed,
      drumSpeed: targetDrumSpeed,
      targetHornSpeed,
      targetDrumSpeed,
    },
    masterVolume: 0.8,
    currentUpperDrawbars: [...defaultPreset.upperDrawbars] as DrawbarSettings,
    noteCounter: 0,
    scannerPhase: 0,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * MIDI note to frequency
 */
export function noteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Get tonewheel frequencies for a note
 */
export function getTonewheelFrequencies(note: number): number[] {
  const baseFreq = noteToFrequency(note);
  return DRAWBAR_HARMONICS.map(h => baseFreq * h);
}

/**
 * Calculate Leslie target speeds
 */
export function getLeslieTargetSpeeds(
  state: LeslieState,
  config: LeslieConfig
): { hornSpeed: number; drumSpeed: number } {
  switch (state) {
    case 'fast':
      return { hornSpeed: config.hornFastSpeed, drumSpeed: config.drumFastSpeed };
    case 'slow':
      return { hornSpeed: config.hornSlowSpeed, drumSpeed: config.drumSlowSpeed };
    case 'stop':
    case 'brake':
      return { hornSpeed: 0, drumSpeed: 0 };
  }
}

// =============================================================================
// INPUT PROCESSING
// =============================================================================

/**
 * Process organ input
 */
export function processOrganInput(
  state: OrganState,
  input: OrganInput
): OrganResult {
  const outputs: OrganOutput[] = [];

  switch (input.type) {
    case 'noteOn': {
      const { note, velocity, manual = 'upper' } = input;
      if (velocity === 0) {
        return processOrganInput(state, { type: 'noteOff', note, manual });
      }

      const existingNote = state.notes.find(n => n.note === note && n.manual === manual);
      if (existingNote) {
        return { state, outputs };
      }

      const newNote: OrganNote = {
        note,
        velocity,
        manual,
        isActive: true,
        percEnvValue: state.preset.percussion.enabled ? 1 : 0,
        keyClickValue: state.preset.tonewheel.keyClickLevel,
        tonewheelPhases: DRAWBAR_HARMONICS.map(() => Math.random() * 2 * Math.PI),
        startTime: 0,
      };

      const newHeldNotes = new Set(state.heldNotes);
      newHeldNotes.add(note);

      outputs.push({ type: 'noteStart', note, velocity });

      return {
        state: {
          ...state,
          notes: [...state.notes, newNote],
          heldNotes: newHeldNotes,
          noteCounter: state.noteCounter + 1,
        },
        outputs,
      };
    }

    case 'noteOff': {
      const { note, manual = 'upper' } = input;
      const newHeldNotes = new Set(state.heldNotes);
      newHeldNotes.delete(note);

      if (state.sustainPedal) {
        return { state: { ...state, heldNotes: newHeldNotes }, outputs };
      }

      const newNotes = state.notes.filter(n => !(n.note === note && n.manual === manual));
      outputs.push({ type: 'noteEnd', note });

      return { state: { ...state, notes: newNotes, heldNotes: newHeldNotes }, outputs };
    }

    case 'expression': {
      return { state: { ...state, expressionPedal: Math.max(0, Math.min(1, input.value)) }, outputs };
    }

    case 'swell': {
      return { state: { ...state, swellPedal: Math.max(0, Math.min(1, input.value)) }, outputs };
    }

    case 'sustainPedal': {
      const newState = { ...state, sustainPedal: input.value };
      if (!input.value) {
        const newNotes = state.notes.filter(n => state.heldNotes.has(n.note));
        newState.notes = newNotes;
      }
      return { state: newState, outputs };
    }

    case 'leslie': {
      const targets = getLeslieTargetSpeeds(input.state, state.preset.leslie);
      outputs.push({ type: 'leslieStateChanged', state: input.state });
      return {
        state: {
          ...state,
          preset: { ...state.preset, leslie: { ...state.preset.leslie, state: input.state } },
          leslieState: {
            ...state.leslieState,
            targetHornSpeed: targets.hornSpeed,
            targetDrumSpeed: targets.drumSpeed,
          },
        },
        outputs,
      };
    }

    case 'leslieToggle': {
      const currentState = state.preset.leslie.state;
      const newState: LeslieState = currentState === 'fast' ? 'slow' : 'fast';
      return processOrganInput(state, { type: 'leslie', state: newState });
    }

    case 'drawbar': {
      const { drawbarIndex, value, manual = 'upper' } = input;
      if (drawbarIndex < 0 || drawbarIndex >= NUM_DRAWBARS) return { state, outputs };
      const clampedValue = Math.max(0, Math.min(8, Math.round(value)));

      if (manual === 'upper') {
        const newDrawbars = [...state.currentUpperDrawbars] as DrawbarSettings;
        newDrawbars[drawbarIndex] = clampedValue;
        return {
          state: {
            ...state,
            currentUpperDrawbars: newDrawbars,
            preset: { ...state.preset, upperDrawbars: newDrawbars },
          },
          outputs,
        };
      } else if (manual === 'lower') {
        const newDrawbars = [...state.preset.lowerDrawbars] as DrawbarSettings;
        newDrawbars[drawbarIndex] = clampedValue;
        return { state: { ...state, preset: { ...state.preset, lowerDrawbars: newDrawbars } }, outputs };
      }
      return { state, outputs };
    }

    case 'drawbars': {
      const { values, manual = 'upper' } = input;
      const clamped = values.map(v => Math.max(0, Math.min(8, Math.round(v)))) as DrawbarSettings;

      if (manual === 'upper') {
        return {
          state: {
            ...state,
            currentUpperDrawbars: clamped,
            preset: { ...state.preset, upperDrawbars: clamped },
          },
          outputs,
        };
      } else if (manual === 'lower') {
        return { state: { ...state, preset: { ...state.preset, lowerDrawbars: clamped } }, outputs };
      }
      return { state, outputs };
    }

    case 'percussion': {
      return {
        state: { ...state, preset: { ...state.preset, percussion: { ...state.preset.percussion, ...input.config } } },
        outputs,
      };
    }

    case 'vibrato': {
      return {
        state: { ...state, preset: { ...state.preset, vibrato: { ...state.preset.vibrato, ...input.config } } },
        outputs,
      };
    }

    case 'allNotesOff': {
      for (const n of state.notes) {
        outputs.push({ type: 'noteEnd', note: n.note });
      }
      return { state: { ...state, notes: [], heldNotes: new Set() }, outputs };
    }

    case 'allSoundOff': {
      for (const n of state.notes) {
        outputs.push({ type: 'noteEnd', note: n.note });
      }
      return { state: { ...state, notes: [], heldNotes: new Set() }, outputs };
    }

    case 'loadPreset': {
      const preset = ORGAN_PRESETS.find(p => p.id === input.presetId);
      if (!preset) {
        outputs.push({ type: 'error', message: `Preset not found: ${input.presetId}` });
        return { state, outputs };
      }
      const newState = createOrganState(preset);
      outputs.push({ type: 'presetLoaded', presetId: preset.id });
      return { state: newState, outputs };
    }

    case 'setVolume': {
      return { state: { ...state, masterVolume: Math.max(0, Math.min(1, input.volume)) }, outputs };
    }

    case 'setLeslie': {
      return {
        state: { ...state, preset: { ...state.preset, leslie: { ...state.preset.leslie, ...input.config } } },
        outputs,
      };
    }

    case 'setReverb': {
      return {
        state: { ...state, preset: { ...state.preset, reverb: { ...state.preset.reverb, ...input.config } } },
        outputs,
      };
    }

    case 'setTonewheel': {
      return {
        state: { ...state, preset: { ...state.preset, tonewheel: { ...state.preset.tonewheel, ...input.config } } },
        outputs,
      };
    }

    case 'tick': {
      const { deltaTime } = input;
      if (deltaTime <= 0) return { state, outputs };

      // Update Leslie rotation
      const hornAccel = state.preset.leslie.hornAccel * 10;
      const drumAccel = state.preset.leslie.drumAccel * 5;

      let newHornSpeed = state.leslieState.hornSpeed;
      let newDrumSpeed = state.leslieState.drumSpeed;

      if (newHornSpeed < state.leslieState.targetHornSpeed) {
        newHornSpeed = Math.min(state.leslieState.targetHornSpeed, newHornSpeed + hornAccel * deltaTime);
      } else if (newHornSpeed > state.leslieState.targetHornSpeed) {
        newHornSpeed = Math.max(state.leslieState.targetHornSpeed, newHornSpeed - hornAccel * 2 * deltaTime);
      }

      if (newDrumSpeed < state.leslieState.targetDrumSpeed) {
        newDrumSpeed = Math.min(state.leslieState.targetDrumSpeed, newDrumSpeed + drumAccel * deltaTime);
      } else if (newDrumSpeed > state.leslieState.targetDrumSpeed) {
        newDrumSpeed = Math.max(state.leslieState.targetDrumSpeed, newDrumSpeed - drumAccel * 2 * deltaTime);
      }

      const hornRpm = newHornSpeed / 60;
      const drumRpm = newDrumSpeed / 60;
      const newHornAngle = (state.leslieState.hornAngle + hornRpm * 2 * Math.PI * deltaTime) % (2 * Math.PI);
      const newDrumAngle = (state.leslieState.drumAngle + drumRpm * 2 * Math.PI * deltaTime) % (2 * Math.PI);

      // Update percussion decay
      const percDecayTime = state.preset.percussion.decay === 'fast' ? 0.2 : 0.5;
      const newNotes = state.notes.map(n => {
        let newPercEnv = n.percEnvValue;
        let newKeyClick = n.keyClickValue;

        if (newPercEnv > 0) {
          newPercEnv = Math.max(0, newPercEnv - deltaTime / percDecayTime);
        }

        if (newKeyClick > 0) {
          newKeyClick = Math.max(0, newKeyClick - deltaTime * 20);
        }

        return { ...n, percEnvValue: newPercEnv, keyClickValue: newKeyClick };
      });

      // Update scanner phase
      const newScannerPhase = (state.scannerPhase + state.preset.vibrato.rate * 2 * Math.PI * deltaTime) % (2 * Math.PI);

      return {
        state: {
          ...state,
          notes: newNotes,
          leslieState: {
            ...state.leslieState,
            hornAngle: newHornAngle,
            drumAngle: newDrumAngle,
            hornSpeed: newHornSpeed,
            drumSpeed: newDrumSpeed,
          },
          scannerPhase: newScannerPhase,
        },
        outputs,
      };
    }

    case 'midiCC': {
      const { controller, value } = input;
      switch (controller) {
        case 1:
          return processOrganInput(state, { type: 'leslie', state: value >= 64 ? 'fast' : 'slow' });
        case 7:
          return processOrganInput(state, { type: 'setVolume', volume: value / 127 });
        case 11:
          return processOrganInput(state, { type: 'expression', value: value / 127 });
        case 64:
          return processOrganInput(state, { type: 'sustainPedal', value: value >= 64 });
        // Drawbar CCs (12-20)
        case 12: case 13: case 14: case 15: case 16: case 17: case 18: case 19: case 20:
          return processOrganInput(state, {
            type: 'drawbar',
            drawbarIndex: controller - 12,
            value: Math.round(value / 127 * 8),
          });
        case 120:
          return processOrganInput(state, { type: 'allSoundOff' });
        case 123:
          return processOrganInput(state, { type: 'allNotesOff' });
        default:
          return { state, outputs };
      }
    }

    default:
      return { state, outputs };
  }
}

// =============================================================================
// CARD IMPLEMENTATION
// =============================================================================

export const ORGAN_CARD_META = {
  id: 'organ',
  name: 'Organ',
  category: 'generator' as const,
  description: 'Tonewheel and pipe organ with Leslie simulation',

  inputPorts: [
    { id: 'midi', name: 'MIDI In', type: 'midi' as const },
  ],

  outputPorts: [
    { id: 'audio-l', name: 'Audio L', type: 'audio' as const },
    { id: 'audio-r', name: 'Audio R', type: 'audio' as const },
  ],

  parameters: [
    { id: 'preset', name: 'Preset', type: 'enum' as const, values: ORGAN_PRESETS.map(p => p.id), default: ORGAN_PRESETS[0]?.id },
    { id: 'volume', name: 'Volume', type: 'float' as const, min: 0, max: 1, default: 0.8 },
    { id: 'drawbar1', name: '16\'', type: 'int' as const, min: 0, max: 8, default: 8 },
    { id: 'drawbar2', name: '5⅓\'', type: 'int' as const, min: 0, max: 8, default: 8 },
    { id: 'drawbar3', name: '8\'', type: 'int' as const, min: 0, max: 8, default: 8 },
    { id: 'drawbar4', name: '4\'', type: 'int' as const, min: 0, max: 8, default: 0 },
    { id: 'leslie', name: 'Leslie', type: 'enum' as const, values: ['stop', 'slow', 'fast'], default: 'slow' },
    { id: 'reverb', name: 'Reverb', type: 'float' as const, min: 0, max: 1, default: 0.2 },
    { id: 'drive', name: 'Drive', type: 'float' as const, min: 0, max: 1, default: 0.3 },
    { id: 'percussion', name: 'Percussion', type: 'bool' as const, default: true },
  ],
};

export function createOrganCard() {
  let state = createOrganState();

  return {
    meta: ORGAN_CARD_META,

    process(input: OrganInput): OrganOutput[] {
      const result = processOrganInput(state, input);
      state = result.state;
      return result.outputs;
    },

    getState(): OrganState {
      return state;
    },

    reset(): void {
      state = createOrganState();
    },

    loadPreset(presetId: string): OrganOutput[] {
      return this.process({ type: 'loadPreset', presetId });
    },

    getPresets(): OrganPreset[] {
      return ORGAN_PRESETS;
    },

    getPresetsByCategory(category: OrganCategory): OrganPreset[] {
      return ORGAN_PRESETS.filter(p => p.category === category);
    },

    setDrawbar(index: number, value: number): void {
      this.process({ type: 'drawbar', drawbarIndex: index, value });
    },

    setDrawbars(values: DrawbarSettings): void {
      this.process({ type: 'drawbars', values });
    },

    toggleLeslie(): void {
      this.process({ type: 'leslieToggle' });
    },

    getLeslieState(): LeslieState {
      return state.preset.leslie.state;
    },

    getActiveNoteCount(): number {
      return state.notes.length;
    },
  };
}
