/**
 * @fileoverview Sampler Core Module - Advanced Zone and Voice Architecture
 * 
 * Extends the base sampler with:
 * - Tempo detection for rhythmic samples
 * - Random and Sequence layer selection
 * - Zone crossfades (velocity and key)
 * - Advanced trigger modes
 * - Voice architecture with unison, legato, glide
 * - Drum kit auto-mapping (GM standard)
 * 
 * @module @cardplay/core/audio/sampler-core
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** GM Drum Map - Standard General MIDI drum assignments (notes 27-87) */
export const GM_DRUM_MAP: Record<number, string> = {
  // Extended low range
  27: 'High Q',
  28: 'Slap',
  29: 'Scratch Push',
  30: 'Scratch Pull',
  31: 'Sticks',
  32: 'Square Click',
  33: 'Metronome Click',
  34: 'Metronome Bell',
  // Standard GM Drums (35-81)
  35: 'Acoustic Bass Drum',
  36: 'Bass Drum 1',
  37: 'Side Stick',
  38: 'Acoustic Snare',
  39: 'Hand Clap',
  40: 'Electric Snare',
  41: 'Low Floor Tom',
  42: 'Closed Hi-Hat',
  43: 'High Floor Tom',
  44: 'Pedal Hi-Hat',
  45: 'Low Tom',
  46: 'Open Hi-Hat',
  47: 'Low-Mid Tom',
  48: 'Hi-Mid Tom',
  49: 'Crash Cymbal 1',
  50: 'High Tom',
  51: 'Ride Cymbal 1',
  52: 'Chinese Cymbal',
  53: 'Ride Bell',
  54: 'Tambourine',
  55: 'Splash Cymbal',
  56: 'Cowbell',
  57: 'Crash Cymbal 2',
  58: 'Vibraslap',
  59: 'Ride Cymbal 2',
  60: 'Hi Bongo',
  61: 'Low Bongo',
  62: 'Mute Hi Conga',
  63: 'Open Hi Conga',
  64: 'Low Conga',
  65: 'High Timbale',
  66: 'Low Timbale',
  67: 'High Agogo',
  68: 'Low Agogo',
  69: 'Cabasa',
  70: 'Maracas',
  71: 'Short Whistle',
  72: 'Long Whistle',
  73: 'Short Guiro',
  74: 'Long Guiro',
  75: 'Claves',
  76: 'Hi Wood Block',
  77: 'Low Wood Block',
  78: 'Mute Cuica',
  79: 'Open Cuica',
  80: 'Mute Triangle',
  81: 'Open Triangle',
  // Extended range (82-87)
  82: 'Shaker',
  83: 'Jingle Bell',
  84: 'Bell Tree',
  85: 'Castanets',
  86: 'Mute Surdo',
  87: 'Open Surdo',
};

/** Extended Percussion Map - World percussion including Tabla */
export const EXTENDED_PERCUSSION_MAP: Record<number, string> = {
  // Tabla (88-99)
  88: 'Tabla Na',
  89: 'Tabla Tin',
  90: 'Tabla Tun',
  91: 'Tabla Ta',
  92: 'Tabla Ti',
  93: 'Tabla Ge',
  94: 'Tabla Ke',
  95: 'Tabla Ghe',
  96: 'Tabla Dha',
  97: 'Tabla Dhin',
  98: 'Tabla Dhage',
  99: 'Tabla Tirakita',
  // Baya (left hand tabla) (100-105)
  100: 'Baya Ge',
  101: 'Baya Ka',
  102: 'Baya Ghe',
  103: 'Baya Slide',
  104: 'Baya Mute',
  105: 'Baya Open',
  // Dholak (106-111)
  106: 'Dholak Na',
  107: 'Dholak Ge',
  108: 'Dholak Ta',
  109: 'Dholak Dha',
  110: 'Dholak Tun',
  111: 'Dholak Rim',
  // Mridangam (112-117)
  112: 'Mridangam Tha',
  113: 'Mridangam Thom',
  114: 'Mridangam Nam',
  115: 'Mridangam Din',
  116: 'Mridangam Chapu',
  117: 'Mridangam Dheem',
  // Djembe (118-123)
  118: 'Djembe Bass',
  119: 'Djembe Tone',
  120: 'Djembe Slap',
  121: 'Djembe Mute',
  122: 'Djembe Flam',
  123: 'Djembe Roll',
  // Cajon (124-127)
  124: 'Cajon Bass',
  125: 'Cajon Snare',
  126: 'Cajon Slap',
  127: 'Cajon Ghost',
};

/** Combined full drum map */
export const FULL_DRUM_MAP: Record<number, string> = {
  ...GM_DRUM_MAP,
  ...EXTENDED_PERCUSSION_MAP,
};

/** Drum name patterns for auto-detection */
export const DRUM_PATTERNS: Record<string, number> = {
  // =========================================================================
  // KICKS / BASS DRUMS
  // =========================================================================
  'acoustic bass drum': 35,
  'acoustic_bass_drum': 35,
  'bass drum 1': 36,
  'bass_drum_1': 36,
  'bass drum': 36,
  'bass_drum': 36,
  'bassdrum': 36,
  'kick': 36,
  'kik': 36,
  'bd': 36,
  
  // =========================================================================
  // SNARES
  // =========================================================================
  'acoustic snare': 38,
  'acoustic_snare': 38,
  'electric snare': 40,
  'electric_snare': 40,
  'snare': 38,
  'snr': 38,
  'sd': 38,
  'sidestick': 37,
  'side stick': 37,
  'side_stick': 37,
  'rimshot': 37,
  'rim shot': 37,
  'rim_shot': 37,
  'rim': 37,
  
  // =========================================================================
  // HI-HATS
  // =========================================================================
  // Open hi-hats (check first - longer patterns)
  'open hi-hat': 46,
  'open hi hat': 46,
  'open_hi_hat': 46,
  'open hihat': 46,
  'open_hihat': 46,
  'openhat': 46,
  'open hat': 46,
  'open_hat': 46,
  'ohh': 46,
  'oh': 46,
  // Pedal hi-hats
  'pedal hi-hat': 44,
  'pedal hi hat': 44,
  'pedal_hi_hat': 44,
  'pedal hihat': 44,
  'pedal_hihat': 44,
  'pedalhat': 44,
  'pedal hat': 44,
  'pedal_hat': 44,
  'foot hat': 44,
  'foot_hat': 44,
  'phh': 44,
  'ph': 44,
  // Closed hi-hats (general patterns last)
  'closed hi-hat': 42,
  'closed hi hat': 42,
  'closed_hi_hat': 42,
  'closed hihat': 42,
  'closed_hihat': 42,
  'closedhat': 42,
  'closed hat': 42,
  'closed_hat': 42,
  'chh': 42,
  'ch': 42,
  'hihat': 42,
  'hi-hat': 42,
  'hi hat': 42,
  'hi_hat': 42,
  'hh': 42,
  
  // =========================================================================
  // TOMS
  // =========================================================================
  'low floor tom': 41,
  'low_floor_tom': 41,
  'high floor tom': 43,
  'high_floor_tom': 43,
  'floor tom': 43,
  'floor_tom': 43,
  'low tom': 45,
  'low_tom': 45,
  'low-mid tom': 47,
  'low_mid_tom': 47,
  'mid tom': 47,
  'mid_tom': 47,
  'hi-mid tom': 48,
  'hi_mid_tom': 48,
  'high tom': 50,
  'high_tom': 50,
  'rack tom': 48,
  'rack_tom': 48,
  'tom': 47,
  
  // =========================================================================
  // CYMBALS
  // =========================================================================
  'crash cymbal 1': 49,
  'crash_cymbal_1': 49,
  'crash cymbal 2': 57,
  'crash_cymbal_2': 57,
  'crash 1': 49,
  'crash_1': 49,
  'crash 2': 57,
  'crash_2': 57,
  'crash': 49,
  'ride cymbal 1': 51,
  'ride_cymbal_1': 51,
  'ride cymbal 2': 59,
  'ride_cymbal_2': 59,
  'ride bell': 53,
  'ride_bell': 53,
  'ride': 51,
  'chinese cymbal': 52,
  'chinese_cymbal': 52,
  'china cymbal': 52,
  'china_cymbal': 52,
  'china': 52,
  'splash cymbal': 55,
  'splash_cymbal': 55,
  'splash': 55,
  
  // =========================================================================
  // CLAPS & SNAPS
  // =========================================================================
  'hand clap': 39,
  'hand_clap': 39,
  'handclap': 39,
  'clap': 39,
  'snap': 39,
  'finger snap': 39,
  'finger_snap': 39,
  
  // =========================================================================
  // LATIN PERCUSSION
  // =========================================================================
  // Bongos
  'hi bongo': 60,
  'hi_bongo': 60,
  'high bongo': 60,
  'high_bongo': 60,
  'low bongo': 61,
  'low_bongo': 61,
  'bongo': 60,
  
  // Congas
  'mute hi conga': 62,
  'mute_hi_conga': 62,
  'mute high conga': 62,
  'mute_high_conga': 62,
  'open hi conga': 63,
  'open_hi_conga': 63,
  'open high conga': 63,
  'open_high_conga': 63,
  'low conga': 64,
  'low_conga': 64,
  'hi conga': 63,
  'hi_conga': 63,
  'high conga': 63,
  'high_conga': 63,
  'conga': 63,
  'tumba': 64,
  'quinto': 63,
  
  // Timbales
  'high timbale': 65,
  'high_timbale': 65,
  'hi timbale': 65,
  'hi_timbale': 65,
  'low timbale': 66,
  'low_timbale': 66,
  'timbale': 65,
  'paila': 65,
  'cascara': 65,
  
  // Agogo
  'high agogo': 67,
  'high_agogo': 67,
  'hi agogo': 67,
  'hi_agogo': 67,
  'low agogo': 68,
  'low_agogo': 68,
  'agogo': 67,
  
  // Other Latin
  'cabasa': 69,
  'cabaza': 69,
  'maracas': 70,
  'maraca': 70,
  'shaker': 82,
  'shekere': 82,
  'short guiro': 73,
  'short_guiro': 73,
  'long guiro': 74,
  'long_guiro': 74,
  'guiro': 73,
  'guira': 73,
  'claves': 75,
  'clave': 75,
  
  // Cuica
  'mute cuica': 78,
  'mute_cuica': 78,
  'open cuica': 79,
  'open_cuica': 79,
  'cuica': 78,
  
  // =========================================================================
  // WOOD & METAL
  // =========================================================================
  'hi wood block': 76,
  'hi_wood_block': 76,
  'high wood block': 76,
  'high_wood_block': 76,
  'low wood block': 77,
  'low_wood_block': 77,
  'wood block': 76,
  'wood_block': 76,
  'woodblock': 76,
  
  'mute triangle': 80,
  'mute_triangle': 80,
  'open triangle': 81,
  'open_triangle': 81,
  'triangle': 81,
  
  'cowbell': 56,
  'cow bell': 56,
  'cow_bell': 56,
  'bell': 56,
  
  'tambourine': 54,
  'tamb': 54,
  
  'vibraslap': 58,
  'vibra slap': 58,
  'vibra_slap': 58,
  
  'castanets': 85,
  'castanet': 85,
  
  'jingle bell': 83,
  'jingle_bell': 83,
  'jingle': 83,
  'sleigh bell': 83,
  'sleigh_bell': 83,
  
  'bell tree': 84,
  'bell_tree': 84,
  
  // =========================================================================
  // WHISTLES
  // =========================================================================
  'short whistle': 71,
  'short_whistle': 71,
  'long whistle': 72,
  'long_whistle': 72,
  'whistle': 71,
  'samba whistle': 71,
  'samba_whistle': 71,
  
  // =========================================================================
  // SURDO (BRAZILIAN)
  // =========================================================================
  'mute surdo': 86,
  'mute_surdo': 86,
  'open surdo': 87,
  'open_surdo': 87,
  'surdo': 87,
  
  // =========================================================================
  // METRONOME & FX
  // =========================================================================
  'metronome click': 33,
  'metronome_click': 33,
  'metronome bell': 34,
  'metronome_bell': 34,
  'metronome': 33,
  'click': 33,
  'sticks': 31,
  'stick': 31,
  'high q': 27,
  'high_q': 27,
  'slap': 28,
  'scratch push': 29,
  'scratch_push': 29,
  'scratch pull': 30,
  'scratch_pull': 30,
  'scratch': 29,
  'square click': 32,
  'square_click': 32,
  
  // =========================================================================
  // TABLA (INDIAN)
  // =========================================================================
  // Right hand (Dayan/Tabla) strokes
  'tabla na': 88,
  'tabla_na': 88,
  'dayan na': 88,
  'dayan_na': 88,
  'tabla tin': 89,
  'tabla_tin': 89,
  'dayan tin': 89,
  'dayan_tin': 89,
  'tabla tun': 90,
  'tabla_tun': 90,
  'dayan tun': 90,
  'dayan_tun': 90,
  'tabla ta': 91,
  'tabla_ta': 91,
  'dayan ta': 91,
  'dayan_ta': 91,
  'tabla ti': 92,
  'tabla_ti': 92,
  'dayan ti': 92,
  'dayan_ti': 92,
  'tabla te': 92,
  'tabla_te': 92,
  'tabla tete': 92,
  'tabla_tete': 92,
  
  // Left hand (Baya/Dagga) strokes
  'tabla ge': 93,
  'tabla_ge': 93,
  'baya ge': 100,
  'baya_ge': 100,
  'dagga ge': 100,
  'dagga_ge': 100,
  'tabla ke': 94,
  'tabla_ke': 94,
  'baya ka': 101,
  'baya_ka': 101,
  'dagga ka': 101,
  'dagga_ka': 101,
  'tabla ghe': 95,
  'tabla_ghe': 95,
  'baya ghe': 102,
  'baya_ghe': 102,
  'dagga ghe': 102,
  'dagga_ghe': 102,
  
  // Combined strokes
  'tabla dha': 96,
  'tabla_dha': 96,
  'tabla dhin': 97,
  'tabla_dhin': 97,
  'tabla dhage': 98,
  'tabla_dhage': 98,
  'tabla tirakita': 99,
  'tabla_tirakita': 99,
  'tabla trkt': 99,
  'tabla_trkt': 99,
  
  // Baya special
  'baya slide': 103,
  'baya_slide': 103,
  'baya meend': 103,
  'baya_meend': 103,
  'baya mute': 104,
  'baya_mute': 104,
  'baya open': 105,
  'baya_open': 105,
  
  // Generic tabla (defaults to dha)
  'tabla': 96,
  'dayan': 88,
  'baya': 100,
  'dagga': 100,
  
  // =========================================================================
  // DHOLAK (INDIAN)
  // =========================================================================
  'dholak na': 106,
  'dholak_na': 106,
  'dholak ge': 107,
  'dholak_ge': 107,
  'dholak ta': 108,
  'dholak_ta': 108,
  'dholak dha': 109,
  'dholak_dha': 109,
  'dholak tun': 110,
  'dholak_tun': 110,
  'dholak rim': 111,
  'dholak_rim': 111,
  'dholak': 109,
  'dholki': 109,
  
  // =========================================================================
  // MRIDANGAM (SOUTH INDIAN)
  // =========================================================================
  'mridangam tha': 112,
  'mridangam_tha': 112,
  'mridangam thom': 113,
  'mridangam_thom': 113,
  'mridangam nam': 114,
  'mridangam_nam': 114,
  'mridangam din': 115,
  'mridangam_din': 115,
  'mridangam chapu': 116,
  'mridangam_chapu': 116,
  'mridangam dheem': 117,
  'mridangam_dheem': 117,
  'mridangam': 113,
  'mrudangam': 113,
  'pakhawaj': 113,
  
  // =========================================================================
  // DJEMBE (WEST AFRICAN)
  // =========================================================================
  'djembe bass': 118,
  'djembe_bass': 118,
  'djembe gun': 118,
  'djembe_gun': 118,
  'djembe tone': 119,
  'djembe_tone': 119,
  'djembe go': 119,
  'djembe_go': 119,
  'djembe do': 119,
  'djembe_do': 119,
  'djembe slap': 120,
  'djembe_slap': 120,
  'djembe pa': 120,
  'djembe_pa': 120,
  'djembe mute': 121,
  'djembe_mute': 121,
  'djembe flam': 122,
  'djembe_flam': 122,
  'djembe roll': 123,
  'djembe_roll': 123,
  'djembe': 119,
  'jembe': 119,
  
  // =========================================================================
  // CAJON (PERUVIAN/FLAMENCO)
  // =========================================================================
  'cajon bass': 124,
  'cajon_bass': 124,
  'cajon low': 124,
  'cajon_low': 124,
  'cajon snare': 125,
  'cajon_snare': 125,
  'cajon high': 125,
  'cajon_high': 125,
  'cajon slap': 126,
  'cajon_slap': 126,
  'cajon ghost': 127,
  'cajon_ghost': 127,
  'cajon tap': 127,
  'cajon_tap': 127,
  'cajon': 125,
  'cajón': 125,
  
  // =========================================================================
  // OTHER WORLD PERCUSSION
  // =========================================================================
  // Frame drums
  'bodhran': 36,
  'bodhrán': 36,
  'frame drum': 36,
  'frame_drum': 36,
  'tar': 36,
  'riq': 54,
  'bendir': 36,
  'pandeiro': 54,
  'pandero': 54,
  
  // Middle Eastern
  'darbuka': 119,
  'doumbek': 119,
  'dumbek': 119,
  'doumbek tek': 119,
  'doumbek_tek': 119,
  'doumbek dum': 118,
  'doumbek_dum': 118,
  'doumbek ka': 120,
  'doumbek_ka': 120,
  'tombak': 119,
  'zarb': 119,
  
  // East Asian
  'taiko': 36,
  'odaiko': 35,
  'shime daiko': 38,
  'shime_daiko': 38,
  'tsuzumi': 38,
  'changgo': 38,
  'janggu': 38,
  'pungmul': 38,
  
  // Steel drum / Pan
  'steel drum': 47,
  'steel_drum': 47,
  'steel pan': 47,
  'steel_pan': 47,
  'steelpan': 47,
  
  // Udu
  'udu': 64,
  'udu drum': 64,
  'udu_drum': 64,
  
  // Talking drum
  'talking drum': 47,
  'talking_drum': 47,
  'tama': 47,
  'dundun': 36,
  'dunun': 36,
  'sangban': 47,
  'kenkeni': 50,
  
  // Hang / Handpan
  'hang': 47,
  'hang drum': 47,
  'hang_drum': 47,
  'handpan': 47,
};

/** Default tempo for rhythmic samples */
export const DEFAULT_TEMPO = 120;

/** Minimum tempo detection confidence */
export const TEMPO_CONFIDENCE_THRESHOLD = 0.5;

// ============================================================================
// TYPES - LAYER SELECTION
// ============================================================================

/**
 * Layer selection mode for zones.
 */
export type LayerSelectionMode = 
  | 'velocity'    // Select by velocity
  | 'roundRobin'  // Rotate through layers
  | 'random'      // Random selection
  | 'sequence'    // Scripted sequence
  | 'keySwitch';  // Select by key switch

/**
 * Random layer configuration.
 */
export interface RandomLayerConfig {
  /** Selection mode */
  mode: 'random';
  /** Seed for reproducibility (null = truly random) */
  seed: number | null;
  /** Probability weights for each layer (sum to 1) */
  weights: number[];
  /** Avoid repeating last N selections */
  noRepeatCount: number;
  /** History of recent selections */
  history: number[];
}

/**
 * Sequence layer configuration.
 */
export interface SequenceLayerConfig {
  /** Selection mode */
  mode: 'sequence';
  /** Sequence of layer indices */
  sequence: number[];
  /** Current position in sequence */
  position: number;
  /** Loop the sequence */
  loop: boolean;
  /** Reset on note-off */
  resetOnRelease: boolean;
  /** Reset on key switch */
  resetOnKeySwitch: boolean;
}

/**
 * Round-robin layer configuration.
 */
export interface RoundRobinLayerConfig {
  /** Selection mode */
  mode: 'roundRobin';
  /** Current index */
  currentIndex: number;
  /** Reset on specific interval (ms, 0 = never) */
  resetInterval: number;
  /** Last trigger time */
  lastTriggerTime: number;
}

/**
 * Union type for layer configuration.
 */
export type LayerConfig = 
  | RandomLayerConfig 
  | SequenceLayerConfig 
  | RoundRobinLayerConfig;

// ============================================================================
// TYPES - ZONE CROSSFADES
// ============================================================================

/**
 * Crossfade curve type.
 */
export type CrossfadeCurve = 'linear' | 'equalPower' | 'sCurve';

/**
 * Velocity crossfade configuration.
 */
export interface VelocityCrossfade {
  /** Enable velocity crossfading */
  enabled: boolean;
  /** Crossfade range in velocity units */
  range: number;
  /** Curve type */
  curve: CrossfadeCurve;
}

/**
 * Key crossfade configuration.
 */
export interface KeyCrossfade {
  /** Enable key crossfading */
  enabled: boolean;
  /** Crossfade range in semitones */
  range: number;
  /** Curve type */
  curve: CrossfadeCurve;
}

// ============================================================================
// TYPES - TRIGGER MODES
// ============================================================================

/**
 * Zone trigger mode.
 */
export type ZoneTriggerMode = 
  | 'attack'      // Trigger on note-on
  | 'release'     // Trigger on note-off
  | 'legato'      // Only first note in legato phrase
  | 'firstNote'   // Only when no other notes held
  | 'arpUp'       // Ascending arp order
  | 'arpDown';    // Descending arp order

/**
 * Extended sample zone with advanced features.
 */
export interface ExtendedSampleZone {
  /** Base zone ID */
  id: string;
  /** Key range low */
  keyLow: number;
  /** Key range high */
  keyHigh: number;
  /** Root key */
  rootKey: number;
  /** Velocity range low */
  velocityLow: number;
  /** Velocity range high */
  velocityHigh: number;
  /** Sample reference */
  sampleId: string;
  /** Alternative samples for layers */
  layerSamples: string[];
  /** Layer selection configuration */
  layerConfig: LayerConfig | null;
  /** Velocity crossfade */
  velocityCrossfade: VelocityCrossfade;
  /** Key crossfade */
  keyCrossfade: KeyCrossfade;
  /** Trigger mode */
  triggerMode: ZoneTriggerMode;
  /** Output bus routing */
  outputBus: number;
  /** Zone offset timing in ms */
  offsetMs: number;
  /** Pitch tracking enabled */
  pitchTracking: boolean;
  /** Tune in cents */
  tuneCents: number;
  /** Tune in semitones */
  tuneSemitones: number;
  /** Pan position -1 to 1 */
  pan: number;
  /** Gain in dB */
  gainDb: number;
  /** Reverse playback */
  reverse: boolean;
  /** Loop enabled */
  loopEnabled: boolean;
  /** Loop start sample */
  loopStart: number;
  /** Loop end sample */
  loopEnd: number;
  /** Loop crossfade samples */
  loopCrossfade: number;
  /** Exclusive group */
  exclusiveGroup: number | null;
  /** Muted */
  muted: boolean;
  /** Solo */
  solo: boolean;
  /** Locked (prevent edits) */
  locked: boolean;
}

// ============================================================================
// TYPES - TEMPO DETECTION
// ============================================================================

/**
 * Tempo detection result.
 */
export interface TempoDetectionResult {
  /** Detected BPM */
  bpm: number;
  /** Confidence 0-1 */
  confidence: number;
  /** Beat positions in samples */
  beats: number[];
  /** Downbeat positions */
  downbeats: number[];
  /** Time signature guess */
  timeSignature: { numerator: number; denominator: number };
  /** Duration in bars */
  bars: number;
}

// ============================================================================
// TYPES - VOICE ARCHITECTURE
// ============================================================================

/**
 * Voice state.
 */
export type VoiceState = 
  | 'idle'
  | 'attack'
  | 'hold'
  | 'decay'
  | 'sustain'
  | 'release'
  | 'stealing';

/**
 * Voice priority for stealing.
 */
export type VoicePriority = 
  | 'newest'
  | 'oldest'
  | 'lowest'
  | 'highest'
  | 'quietest';

/**
 * Glide curve type.
 */
export type GlideCurve = 'linear' | 'exponential' | 'sCurve';

/**
 * Unison configuration.
 */
export interface UnisonConfig {
  /** Number of unison voices (1 = no unison) */
  voices: number;
  /** Detune spread in cents */
  detuneCents: number;
  /** Stereo spread 0-1 */
  stereoSpread: number;
  /** Phase randomization 0-1 */
  phaseRandom: number;
}

/**
 * Glide/portamento configuration.
 */
export interface GlideConfig {
  /** Glide enabled */
  enabled: boolean;
  /** Glide time in seconds */
  time: number;
  /** Glide curve */
  curve: GlideCurve;
  /** Legato only (glide only when overlapping) */
  legatoOnly: boolean;
  /** Glide range limit in semitones (0 = unlimited) */
  rangeLimit: number;
}

/**
 * Extended sampler voice with full state.
 */
export interface ExtendedSamplerVoice {
  /** Voice ID */
  id: string;
  /** Current state */
  state: VoiceState;
  /** MIDI note */
  note: number;
  /** Velocity 0-127 */
  velocity: number;
  /** Zone ID */
  zoneId: string;
  /** Sample ID */
  sampleId: string;
  /** Playhead position */
  playhead: number;
  /** Start time */
  startTime: number;
  /** Current pitch (for glide) */
  currentPitch: number;
  /** Target pitch */
  targetPitch: number;
  /** Envelope value 0-1 */
  envelopeValue: number;
  /** Envelope stage time */
  envelopeStageTime: number;
  /** Filter envelope value */
  filterEnvValue: number;
  /** LFO phases */
  lfoPhases: number[];
  /** Output gain */
  outputGain: number;
  /** Pan position */
  pan: number;
  /** Is unison sub-voice */
  isUnisonVoice: boolean;
  /** Parent voice ID (for unison) */
  parentVoiceId: string | null;
  /** Unison voice index */
  unisonIndex: number;
  /** Loop direction (for pingpong) */
  loopDirection: 1 | -1;
}

// ============================================================================
// LAYER SELECTION ALGORITHMS
// ============================================================================

/**
 * Simple PRNG for reproducible random selection.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Select a random layer based on weights.
 */
export function selectRandomLayer(
  config: RandomLayerConfig,
  numLayers: number,
  time: number = Date.now()
): { index: number; config: RandomLayerConfig } {
  const rand = config.seed !== null 
    ? seededRandom(config.seed + time)() 
    : Math.random();
  
  // Apply weights
  let weights = config.weights.length === numLayers 
    ? config.weights 
    : new Array(numLayers).fill(1 / numLayers);
  
  // Zero out recently used layers to avoid repeats
  if (config.noRepeatCount > 0) {
    const avoidSet = new Set(config.history.slice(-config.noRepeatCount));
    weights = weights.map((w, i) => avoidSet.has(i) ? 0 : w);
    
    // Renormalize
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      weights = weights.map(w => w / sum);
    } else {
      // All layers in history, reset
      weights = new Array(numLayers).fill(1 / numLayers);
    }
  }
  
  // Cumulative distribution
  let cumulative = 0;
  for (let i = 0; i < numLayers; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      // Update history
      const newHistory = [...config.history, i].slice(-config.noRepeatCount - 1);
      return {
        index: i,
        config: { ...config, history: newHistory },
      };
    }
  }
  
  // Fallback
  return { 
    index: numLayers - 1, 
    config: { ...config, history: [...config.history, numLayers - 1] },
  };
}

/**
 * Select the next layer in a sequence.
 */
export function selectSequenceLayer(
  config: SequenceLayerConfig,
  numLayers: number
): { index: number; config: SequenceLayerConfig } {
  const sequence = config.sequence.length > 0 
    ? config.sequence 
    : Array.from({ length: numLayers }, (_, i) => i);
  
  const indexValue = sequence[config.position % sequence.length];
  const index = indexValue !== undefined ? indexValue : 0;
  let nextPosition = config.position + 1;
  
  if (!config.loop && nextPosition >= sequence.length) {
    nextPosition = sequence.length - 1; // Stay on last
  } else {
    nextPosition = nextPosition % sequence.length;
  }
  
  return {
    index: Math.min(index, numLayers - 1),
    config: { ...config, position: nextPosition },
  };
}

/**
 * Select the next round-robin layer.
 */
export function selectRoundRobinLayer(
  config: RoundRobinLayerConfig,
  numLayers: number,
  currentTime: number = Date.now()
): { index: number; config: RoundRobinLayerConfig } {
  let currentIndex = config.currentIndex;
  
  // Check reset interval
  if (config.resetInterval > 0) {
    const timeSinceLast = currentTime - config.lastTriggerTime;
    if (timeSinceLast > config.resetInterval) {
      currentIndex = 0;
    }
  }
  
  const index = currentIndex % numLayers;
  const nextIndex = (currentIndex + 1) % numLayers;
  
  return {
    index,
    config: {
      ...config,
      currentIndex: nextIndex,
      lastTriggerTime: currentTime,
    },
  };
}

// ============================================================================
// CROSSFADE CALCULATIONS
// ============================================================================

/**
 * Calculate crossfade gain based on curve type.
 */
export function calculateCrossfadeGain(
  position: number, // 0-1, where 0 = full first, 1 = full second
  curve: CrossfadeCurve
): { gain1: number; gain2: number } {
  let gain1: number;
  let gain2: number;
  
  switch (curve) {
    case 'linear':
      gain1 = 1 - position;
      gain2 = position;
      break;
      
    case 'equalPower':
      // Equal power crossfade maintains constant loudness
      gain1 = Math.cos(position * Math.PI / 2);
      gain2 = Math.sin(position * Math.PI / 2);
      break;
      
    case 'sCurve':
      // Smooth S-curve transition
      const s = position * position * (3 - 2 * position);
      gain1 = 1 - s;
      gain2 = s;
      break;
  }
  
  return { gain1, gain2 };
}

/**
 * Calculate velocity crossfade position.
 */
export function getVelocityCrossfadePosition(
  velocity: number,
  zone1VelHigh: number,
  zone2VelLow: number,
  crossfadeRange: number
): number {
  // Crossfade region is centered on the boundary
  const boundary = (zone1VelHigh + zone2VelLow) / 2;
  const halfRange = crossfadeRange / 2;
  
  if (velocity <= boundary - halfRange) return 0; // Full zone 1
  if (velocity >= boundary + halfRange) return 1; // Full zone 2
  
  // In crossfade region
  return (velocity - (boundary - halfRange)) / crossfadeRange;
}

/**
 * Calculate key crossfade position.
 */
export function getKeyCrossfadePosition(
  note: number,
  zone1KeyHigh: number,
  zone2KeyLow: number,
  crossfadeRange: number
): number {
  const boundary = (zone1KeyHigh + zone2KeyLow) / 2;
  const halfRange = crossfadeRange / 2;
  
  if (note <= boundary - halfRange) return 0;
  if (note >= boundary + halfRange) return 1;
  
  return (note - (boundary - halfRange)) / crossfadeRange;
}

// ============================================================================
// TEMPO DETECTION
// ============================================================================

/**
 * Detect tempo from audio samples using onset detection and autocorrelation.
 */
export function detectTempo(
  samples: Float32Array,
  sampleRate: number,
  options: {
    minBpm?: number;
    maxBpm?: number;
    hopSize?: number;
  } = {}
): TempoDetectionResult {
  const {
    minBpm = 60,
    maxBpm = 200,
    hopSize = 512,
  } = options;
  
  // Calculate onset strength envelope
  const numFrames = Math.floor(samples.length / hopSize);
  const onsetStrength = new Float32Array(numFrames);
  
  let prevEnergy = 0;
  for (let i = 0; i < numFrames; i++) {
    let energy = 0;
    const start = i * hopSize;
    for (let j = 0; j < hopSize && start + j < samples.length; j++) {
      const sample = samples[start + j];
      if (sample !== undefined) {
        energy += sample * sample;
      }
    }
    energy = Math.sqrt(energy / hopSize);
    
    // Onset is positive energy change
    onsetStrength[i] = Math.max(0, energy - prevEnergy);
    prevEnergy = energy;
  }
  
  // Autocorrelation on onset strength to find periodicity
  const minLag = Math.floor((60 / maxBpm) * sampleRate / hopSize);
  const maxLag = Math.floor((60 / minBpm) * sampleRate / hopSize);
  
  let bestLag = minLag;
  let bestCorr = 0;
  
  for (let lag = minLag; lag <= maxLag && lag < numFrames; lag++) {
    let correlation = 0;
    let count = 0;
    
    for (let i = 0; i < numFrames - lag; i++) {
      const val1 = onsetStrength[i] ?? 0;
      const val2 = onsetStrength[i + lag] ?? 0;
      correlation += val1 * val2;
      count++;
    }
    
    if (count > 0) {
      correlation /= count;
      if (correlation > bestCorr) {
        bestCorr = correlation;
        bestLag = lag;
      }
    }
  }
  
  // Calculate BPM from lag
  const beatPeriodSamples = bestLag * hopSize;
  const beatPeriodSeconds = beatPeriodSamples / sampleRate;
  const bpm = 60 / beatPeriodSeconds;
  
  // Find beat positions using peak picking
  const beats: number[] = [];
  const threshold = 0.3 * Math.max(...onsetStrength);
  
  for (let i = 1; i < numFrames - 1; i++) {
    if (onsetStrength[i]! > threshold &&
        onsetStrength[i]! > onsetStrength[i - 1]! &&
        onsetStrength[i]! > onsetStrength[i + 1]!) {
      beats.push(i * hopSize);
    }
  }
  
  // Estimate downbeats (every 4 beats assuming 4/4)
  const downbeats = beats.filter((_, i) => i % 4 === 0);
  
  // Calculate confidence based on autocorrelation strength
  const maxPossibleCorr = onsetStrength.reduce((a, b) => a + b * b, 0) / numFrames;
  const confidence = maxPossibleCorr > 0 
    ? Math.min(1, bestCorr / (maxPossibleCorr * 0.5)) 
    : 0;
  
  // Estimate bars
  const durationSeconds = samples.length / sampleRate;
  const beatsTotal = (bpm / 60) * durationSeconds;
  const bars = beatsTotal / 4;
  
  return {
    bpm: Math.round(bpm * 10) / 10,
    confidence,
    beats,
    downbeats,
    timeSignature: { numerator: 4, denominator: 4 },
    bars: Math.round(bars * 10) / 10,
  };
}

// ============================================================================
// DRUM KIT AUTO-MAPPING
// ============================================================================

/**
 * Detect drum type from filename.
 * Checks longer/more specific patterns before shorter ones.
 */
export function detectDrumType(filename: string): number | null {
  const lower = filename.toLowerCase();
  
  // Sort patterns by length (longest first) to match specific before general
  const sortedPatterns = Object.entries(DRUM_PATTERNS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, note] of sortedPatterns) {
    if (lower.includes(pattern)) {
      return note;
    }
  }
  
  return null;
}

/**
 * Auto-map samples to GM drum kit positions.
 */
export function autoMapDrumKit(
  samples: Array<{ id: string; filename: string }>
): Map<number, string[]> {
  const mapping = new Map<number, string[]>();
  
  for (const sample of samples) {
    const note = detectDrumType(sample.filename);
    if (note !== null) {
      const existing = mapping.get(note) || [];
      existing.push(sample.id);
      mapping.set(note, existing);
    }
  }
  
  return mapping;
}

/**
 * Create drum kit zones from sample mapping.
 */
export function createDrumKitZones(
  mapping: Map<number, string[]>,
  layerMode: LayerSelectionMode = 'roundRobin'
): ExtendedSampleZone[] {
  const zones: ExtendedSampleZone[] = [];
  
  for (const [note, sampleIds] of mapping.entries()) {
    const primarySample = sampleIds[0];
    const layerSamples = sampleIds.slice(1);
    
    let layerConfig: LayerConfig | null = null;
    if (layerSamples.length > 0) {
      switch (layerMode) {
        case 'roundRobin':
          layerConfig = {
            mode: 'roundRobin',
            currentIndex: 0,
            resetInterval: 0,
            lastTriggerTime: 0,
          };
          break;
        case 'random':
          layerConfig = {
            mode: 'random',
            seed: null,
            weights: new Array(sampleIds.length).fill(1 / sampleIds.length),
            noRepeatCount: 1,
            history: [],
          };
          break;
      }
    }
    
    zones.push({
      id: `drum-zone-${note}`,
      keyLow: note,
      keyHigh: note,
      rootKey: note,
      velocityLow: 0,
      velocityHigh: 127,
      sampleId: primarySample ?? '',
      layerSamples,
      layerConfig,
      velocityCrossfade: { enabled: false, range: 0, curve: 'linear' },
      keyCrossfade: { enabled: false, range: 0, curve: 'linear' },
      triggerMode: 'attack',
      outputBus: 0,
      offsetMs: 0,
      pitchTracking: false, // Drums don't pitch track
      tuneCents: 0,
      tuneSemitones: 0,
      pan: 0,
      gainDb: 0,
      reverse: false,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      loopCrossfade: 0,
      exclusiveGroup: note === 42 || note === 44 || note === 46 ? 1 : null, // Hi-hats share group
      muted: false,
      solo: false,
      locked: false,
    });
  }
  
  return zones;
}

// ============================================================================
// VOICE MANAGEMENT
// ============================================================================

/**
 * Create a new voice.
 */
export function createVoice(
  id: string,
  note: number,
  velocity: number,
  zoneId: string,
  sampleId: string,
  startTime: number
): ExtendedSamplerVoice {
  return {
    id,
    state: 'attack',
    note,
    velocity,
    zoneId,
    sampleId,
    playhead: 0,
    startTime,
    currentPitch: note,
    targetPitch: note,
    envelopeValue: 0,
    envelopeStageTime: 0,
    filterEnvValue: 0,
    lfoPhases: [0, 0, 0, 0],
    outputGain: velocity / 127,
    pan: 0,
    isUnisonVoice: false,
    parentVoiceId: null,
    unisonIndex: 0,
    loopDirection: 1,
  };
}

/**
 * Create unison voices for a note.
 */
export function createUnisonVoices(
  baseVoice: ExtendedSamplerVoice,
  config: UnisonConfig,
  idGenerator: () => string
): ExtendedSamplerVoice[] {
  if (config.voices <= 1) {
    return [baseVoice];
  }
  
  const voices: ExtendedSamplerVoice[] = [];
  const detuneStep = config.detuneCents / (config.voices - 1);
  const panStep = config.stereoSpread * 2 / (config.voices - 1);
  
  for (let i = 0; i < config.voices; i++) {
    const detune = -config.detuneCents / 2 + detuneStep * i;
    const pan = -config.stereoSpread + panStep * i;
    const phaseOffset = config.phaseRandom * Math.random();
    
    voices.push({
      ...baseVoice,
      id: i === 0 ? baseVoice.id : idGenerator(),
      currentPitch: baseVoice.currentPitch + detune / 100,
      pan: Math.max(-1, Math.min(1, baseVoice.pan + pan)),
      isUnisonVoice: i > 0,
      parentVoiceId: i > 0 ? baseVoice.id : null,
      unisonIndex: i,
      lfoPhases: baseVoice.lfoPhases.map(p => p + phaseOffset),
    });
  }
  
  return voices;
}

/**
 * Find voices to steal based on priority.
 */
export function findVoicesToSteal(
  voices: ExtendedSamplerVoice[],
  priority: VoicePriority,
  count: number
): ExtendedSamplerVoice[] {
  const activeVoices = voices.filter(v => v.state !== 'idle' && v.state !== 'stealing');
  
  if (activeVoices.length <= count) {
    return [];
  }
  
  // Sort by priority
  const sorted = [...activeVoices].sort((a, b) => {
    switch (priority) {
      case 'oldest':
        return a.startTime - b.startTime;
      case 'newest':
        return b.startTime - a.startTime;
      case 'lowest':
        return a.note - b.note;
      case 'highest':
        return b.note - a.note;
      case 'quietest':
        return a.envelopeValue - b.envelopeValue;
    }
  });
  
  return sorted.slice(0, count);
}

/**
 * Calculate glide pitch at time t.
 */
export function calculateGlidePitch(
  startPitch: number,
  endPitch: number,
  progress: number, // 0-1
  curve: GlideCurve
): number {
  let t: number;
  
  switch (curve) {
    case 'linear':
      t = progress;
      break;
    case 'exponential':
      t = progress * progress;
      break;
    case 'sCurve':
      t = progress * progress * (3 - 2 * progress);
      break;
  }
  
  return startPitch + (endPitch - startPitch) * t;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create default layer configuration.
 */
export function createDefaultLayerConfig(mode: LayerSelectionMode): LayerConfig | null {
  switch (mode) {
    case 'roundRobin':
      return {
        mode: 'roundRobin',
        currentIndex: 0,
        resetInterval: 0,
        lastTriggerTime: 0,
      };
    case 'random':
      return {
        mode: 'random',
        seed: null,
        weights: [],
        noRepeatCount: 1,
        history: [],
      };
    case 'sequence':
      return {
        mode: 'sequence',
        sequence: [],
        position: 0,
        loop: true,
        resetOnRelease: false,
        resetOnKeySwitch: true,
      };
    default:
      return null;
  }
}

/**
 * Create default unison configuration.
 */
export function createDefaultUnisonConfig(): UnisonConfig {
  return {
    voices: 1,
    detuneCents: 0,
    stereoSpread: 0,
    phaseRandom: 0,
  };
}

/**
 * Create default glide configuration.
 */
export function createDefaultGlideConfig(): GlideConfig {
  return {
    enabled: false,
    time: 0.1,
    curve: 'linear',
    legatoOnly: true,
    rangeLimit: 0,
  };
}

/**
 * Create default velocity crossfade.
 */
export function createDefaultVelocityCrossfade(): VelocityCrossfade {
  return {
    enabled: false,
    range: 10,
    curve: 'equalPower',
  };
}

/**
 * Create default key crossfade.
 */
export function createDefaultKeyCrossfade(): KeyCrossfade {
  return {
    enabled: false,
    range: 2,
    curve: 'equalPower',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Layer selection
  selectRandomLayer,
  selectSequenceLayer,
  selectRoundRobinLayer,
  
  // Crossfades
  calculateCrossfadeGain,
  getVelocityCrossfadePosition,
  getKeyCrossfadePosition,
  
  // Tempo detection
  detectTempo,
  
  // Drum kit
  detectDrumType,
  autoMapDrumKit,
  createDrumKitZones,
  
  // Voice management
  createVoice,
  createUnisonVoices,
  findVoicesToSteal,
  calculateGlidePitch,
  
  // Factory functions
  createDefaultLayerConfig,
  createDefaultUnisonConfig,
  createDefaultGlideConfig,
  createDefaultVelocityCrossfade,
  createDefaultKeyCrossfade,
};
