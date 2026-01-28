/**
 * @fileoverview Tracker Effect Commands
 * 
 * Implements the complete effect command system for the tracker,
 * combining classic Renoise/ProTracker effects with CardPlay-specific
 * commands for generators, events, and card integration.
 * 
 * Effect Format: XYY where X=command, YY=parameter
 * Extended Format: XXYY where XX=command, YY=parameter
 * 
 * @module @cardplay/tracker/effects
 */

import {
  asEffectCode,
  asEffectParam,
  type EffectCommand,
} from './types';

// ============================================================================
// EFFECT CODE CONSTANTS
// ============================================================================

/**
 * Standard effect codes (ProTracker/FastTracker/Renoise compatible).
 */
export const FX = {
  // ===== Volume & Panning (0x0-0x1) =====
  /** 0xy - Arpeggio */
  ARPEGGIO: 0x00,
  /** 1xx - Portamento up */
  PORTA_UP: 0x01,
  /** 2xx - Portamento down */
  PORTA_DOWN: 0x02,
  /** 3xx - Tone portamento (glide to note) */
  TONE_PORTA: 0x03,
  /** 4xy - Vibrato (x=speed, y=depth) */
  VIBRATO: 0x04,
  /** 5xy - Tone portamento + volume slide */
  TONE_PORTA_VOL: 0x05,
  /** 6xy - Vibrato + volume slide */
  VIBRATO_VOL: 0x06,
  /** 7xy - Tremolo */
  TREMOLO: 0x07,
  /** 8xx - Set panning */
  SET_PAN: 0x08,
  /** 9xx - Sample offset */
  SAMPLE_OFFSET: 0x09,
  /** Axy - Volume slide */
  VOL_SLIDE: 0x0A,
  /** Bxx - Pattern jump */
  PATTERN_JUMP: 0x0B,
  /** Cxx - Set volume */
  SET_VOLUME: 0x0C,
  /** Dxx - Pattern break */
  PATTERN_BREAK: 0x0D,
  /** Exy - Extended commands */
  EXTENDED: 0x0E,
  /** Fxx - Set tempo/speed */
  SET_TEMPO: 0x0F,
  
  // ===== Global Commands (0x10-0x1F) =====
  /** 10xx - Set global volume */
  GLOBAL_VOLUME: 0x10,
  /** 11xy - Global volume slide */
  GLOBAL_VOL_SLIDE: 0x11,
  /** 12xx - Set channel volume */
  CHANNEL_VOLUME: 0x12,
  /** 13xy - Channel volume slide */
  CHANNEL_VOL_SLIDE: 0x13,
  /** 14xx - Set channel panning */
  CHANNEL_PAN: 0x14,
  /** 15xy - Channel panning slide */
  CHANNEL_PAN_SLIDE: 0x15,
  /** 16xx - Set BPM */
  SET_BPM: 0x16,
  /** 17xy - BPM slide */
  BPM_SLIDE: 0x17,
  /** 18xx - Set ticks per row */
  SET_TPR: 0x18,
  /** 19xx - Reserved */
  RESERVED_19: 0x19,
  /** 1Axx - Reserved */
  RESERVED_1A: 0x1A,
  /** 1Bxx - Reserved */
  RESERVED_1B: 0x1B,
  /** 1Cxx - Reserved */
  RESERVED_1C: 0x1C,
  /** 1Dxx - Reserved */
  RESERVED_1D: 0x1D,
  /** 1Exx - Reserved */
  RESERVED_1E: 0x1E,
  /** 1Fxx - Reserved */
  RESERVED_1F: 0x1F,
  
  // ===== Note Commands (0x20-0x2F) =====
  /** 20xx - Note delay */
  NOTE_DELAY: 0x20,
  /** 21xx - Note cut */
  NOTE_CUT: 0x21,
  /** 22xy - Retrigger */
  RETRIGGER: 0x22,
  /** 23xx - Note release velocity */
  NOTE_RELEASE: 0x23,
  /** 24xx - Note probability (%) */
  NOTE_PROB: 0x24,
  /** 25xx - Note condition */
  NOTE_COND: 0x25,
  /** 26xx - Humanize timing */
  HUMANIZE_TIME: 0x26,
  /** 27xx - Humanize velocity */
  HUMANIZE_VEL: 0x27,
  /** 28xx - Note link to next row */
  NOTE_LINK: 0x28,
  /** 29xx - Note priority */
  NOTE_PRIORITY: 0x29,
  /** 2Axy - Note echo (x=count, y=delay) */
  NOTE_ECHO: 0x2A,
  /** 2Bxy - Note strum (x=direction, y=delay) */
  NOTE_STRUM: 0x2B,
  /** 2Cxx - Reserved */
  RESERVED_2C: 0x2C,
  /** 2Dxx - Reserved */
  RESERVED_2D: 0x2D,
  /** 2Exx - Reserved */
  RESERVED_2E: 0x2E,
  /** 2Fxx - Reserved */
  RESERVED_2F: 0x2F,
  
  // ===== Sample Commands (0x30-0x3F) =====
  /** 30xx - Sample offset (high byte) */
  SAMPLE_OFFSET_HI: 0x30,
  /** 31xx - Sample reverse */
  SAMPLE_REVERSE: 0x31,
  /** 32xx - Sample slice trigger */
  SAMPLE_SLICE: 0x32,
  /** 33xx - Sample loop point */
  SAMPLE_LOOP: 0x33,
  /** 34xx - Sample start point */
  SAMPLE_START: 0x34,
  /** 35xx - Sample end point */
  SAMPLE_END: 0x35,
  /** 36xx - Sample crossfade */
  SAMPLE_XFADE: 0x36,
  /** 37xx - Sample pitch (semitones) */
  SAMPLE_PITCH: 0x37,
  /** 38xx - Sample fine pitch (cents) */
  SAMPLE_FINE_PITCH: 0x38,
  /** 39xx - Sample formant */
  SAMPLE_FORMANT: 0x39,
  /** 3Axx - Sample stretch mode */
  SAMPLE_STRETCH: 0x3A,
  /** 3Bxx - Reserved */
  RESERVED_3B: 0x3B,
  /** 3Cxx - Reserved */
  RESERVED_3C: 0x3C,
  /** 3Dxx - Reserved */
  RESERVED_3D: 0x3D,
  /** 3Exx - Reserved */
  RESERVED_3E: 0x3E,
  /** 3Fxx - Reserved */
  RESERVED_3F: 0x3F,
  
  // ===== Pitch Commands (0x40-0x4F) =====
  /** 40xy - Fine portamento up */
  FINE_PORTA_UP: 0x40,
  /** 41xy - Fine portamento down */
  FINE_PORTA_DOWN: 0x41,
  /** 42xy - Extra fine portamento up */
  XFINE_PORTA_UP: 0x42,
  /** 43xy - Extra fine portamento down */
  XFINE_PORTA_DOWN: 0x43,
  /** 44xy - Glide curve type */
  GLIDE_CURVE: 0x44,
  /** 45xx - Set finetune */
  SET_FINETUNE: 0x45,
  /** 46xx - Pitch envelope trigger */
  PITCH_ENV: 0x46,
  /** 47xx - Pitch LFO */
  PITCH_LFO: 0x47,
  /** 48xx - Microtuning */
  MICROTUNE: 0x48,
  /** 49xx - Reserved */
  RESERVED_49: 0x49,
  /** 4Axx - Reserved */
  RESERVED_4A: 0x4A,
  /** 4Bxx - Reserved */
  RESERVED_4B: 0x4B,
  /** 4Cxx - Reserved */
  RESERVED_4C: 0x4C,
  /** 4Dxx - Reserved */
  RESERVED_4D: 0x4D,
  /** 4Exx - Reserved */
  RESERVED_4E: 0x4E,
  /** 4Fxx - Reserved */
  RESERVED_4F: 0x4F,
  
  // ===== Modulation Commands (0x50-0x5F) =====
  /** 50xy - Vibrato waveform */
  VIBRATO_WAVE: 0x50,
  /** 51xy - Tremolo waveform */
  TREMOLO_WAVE: 0x51,
  /** 52xy - Panbrello */
  PANBRELLO: 0x52,
  /** 53xy - Panbrello waveform */
  PANBRELLO_WAVE: 0x53,
  /** 54xx - Modulation wheel */
  MOD_WHEEL: 0x54,
  /** 55xx - Expression */
  EXPRESSION: 0x55,
  /** 56xx - Breath controller */
  BREATH: 0x56,
  /** 57xx - Aftertouch */
  AFTERTOUCH: 0x57,
  /** 58xy - Pitch bend */
  PITCH_BEND: 0x58,
  /** 59xx - Sustain pedal */
  SUSTAIN: 0x59,
  /** 5Axx - Soft pedal */
  SOFT_PEDAL: 0x5A,
  /** 5Bxx - Sostenuto pedal */
  SOSTENUTO: 0x5B,
  /** 5Cxx - Reserved */
  RESERVED_5C: 0x5C,
  /** 5Dxx - Reserved */
  RESERVED_5D: 0x5D,
  /** 5Exx - Reserved */
  RESERVED_5E: 0x5E,
  /** 5Fxx - Reserved */
  RESERVED_5F: 0x5F,
  
  // ===== Instrument Commands (0x60-0x6F) =====
  /** 60xx - Set instrument */
  SET_INSTR: 0x60,
  /** 61xx - Instrument transpose */
  INSTR_TRANSPOSE: 0x61,
  /** 62xx - Instrument detune */
  INSTR_DETUNE: 0x62,
  /** 63xx - Instrument envelope position */
  INSTR_ENV_POS: 0x63,
  /** 64xx - Instrument filter cutoff */
  INSTR_FILTER: 0x64,
  /** 65xx - Instrument filter resonance */
  INSTR_RESONANCE: 0x65,
  /** 66xx - Instrument attack */
  INSTR_ATTACK: 0x66,
  /** 67xx - Instrument decay */
  INSTR_DECAY: 0x67,
  /** 68xx - Instrument sustain */
  INSTR_SUSTAIN: 0x68,
  /** 69xx - Instrument release */
  INSTR_RELEASE: 0x69,
  /** 6Axx - Instrument macro */
  INSTR_MACRO: 0x6A,
  /** 6Bxx - Instrument keyswitch */
  INSTR_KEYSWITCH: 0x6B,
  /** 6Cxx - Instrument articulation */
  INSTR_ARTIC: 0x6C,
  /** 6Dxx - Reserved */
  RESERVED_6D: 0x6D,
  /** 6Exx - Reserved */
  RESERVED_6E: 0x6E,
  /** 6Fxx - Reserved */
  RESERVED_6F: 0x6F,
  
  // ===== Phrase Commands (0x70-0x7F) =====
  /** 70xx - Trigger phrase */
  PHRASE_TRIGGER: 0x70,
  /** 71xx - Stop phrase */
  PHRASE_STOP: 0x71,
  /** 72xx - Phrase transpose */
  PHRASE_TRANSPOSE: 0x72,
  /** 73xx - Phrase speed */
  PHRASE_SPEED: 0x73,
  /** 74xx - Phrase position */
  PHRASE_POSITION: 0x74,
  /** 75xx - Phrase loop mode */
  PHRASE_LOOP: 0x75,
  /** 76xx - Phrase variation */
  PHRASE_VARIATION: 0x76,
  /** 77xx - Phrase probability */
  PHRASE_PROB: 0x77,
  /** 78xx - Reserved */
  RESERVED_78: 0x78,
  /** 79xx - Reserved */
  RESERVED_79: 0x79,
  /** 7Axx - Reserved */
  RESERVED_7A: 0x7A,
  /** 7Bxx - Reserved */
  RESERVED_7B: 0x7B,
  /** 7Cxx - Reserved */
  RESERVED_7C: 0x7C,
  /** 7Dxx - Reserved */
  RESERVED_7D: 0x7D,
  /** 7Exx - Reserved */
  RESERVED_7E: 0x7E,
  /** 7Fxx - Reserved */
  RESERVED_7F: 0x7F,
  
  // ===== Generator Commands (0x80-0x8F) =====
  /** 80xx - Generator trigger */
  GEN_TRIGGER: 0x80,
  /** 81xx - Generator stop */
  GEN_STOP: 0x81,
  /** 82xx - Generator seed */
  GEN_SEED: 0x82,
  /** 83xx - Generator parameter 1 */
  GEN_PARAM1: 0x83,
  /** 84xx - Generator parameter 2 */
  GEN_PARAM2: 0x84,
  /** 85xx - Generator parameter 3 */
  GEN_PARAM3: 0x85,
  /** 86xx - Generator parameter 4 */
  GEN_PARAM4: 0x86,
  /** 87xx - Generator density */
  GEN_DENSITY: 0x87,
  /** 88xx - Generator complexity */
  GEN_COMPLEXITY: 0x88,
  /** 89xx - Generator variation */
  GEN_VARIATION: 0x89,
  /** 8Axx - Generator morph */
  GEN_MORPH: 0x8A,
  /** 8Bxx - Generator scale lock */
  GEN_SCALE: 0x8B,
  /** 8Cxx - Generator chord follow */
  GEN_CHORD: 0x8C,
  /** 8Dxx - Reserved */
  RESERVED_8D: 0x8D,
  /** 8Exx - Reserved */
  RESERVED_8E: 0x8E,
  /** 8Fxx - Reserved */
  RESERVED_8F: 0x8F,
  
  // ===== Card/Deck Commands (0x90-0x9F) =====
  /** 90xx - Card trigger */
  CARD_TRIGGER: 0x90,
  /** 91xx - Card stop */
  CARD_STOP: 0x91,
  /** 92xx - Card preset */
  CARD_PRESET: 0x92,
  /** 93xx - Card parameter */
  CARD_PARAM: 0x93,
  /** 94xx - Card bypass */
  CARD_BYPASS: 0x94,
  /** 95xx - Card wet/dry */
  CARD_MIX: 0x95,
  /** 96xx - Deck slot trigger */
  DECK_SLOT: 0x96,
  /** 97xx - Deck state save */
  DECK_SAVE: 0x97,
  /** 98xx - Deck state load */
  DECK_LOAD: 0x98,
  /** 99xx - Reserved */
  RESERVED_99: 0x99,
  /** 9Axx - Reserved */
  RESERVED_9A: 0x9A,
  /** 9Bxx - Reserved */
  RESERVED_9B: 0x9B,
  /** 9Cxx - Reserved */
  RESERVED_9C: 0x9C,
  /** 9Dxx - Reserved */
  RESERVED_9D: 0x9D,
  /** 9Exx - Reserved */
  RESERVED_9E: 0x9E,
  /** 9Fxx - Reserved */
  RESERVED_9F: 0x9F,
  
  // ===== Session/Clip Commands (0xA0-0xAF) =====
  /** A0xx - Clip launch */
  CLIP_LAUNCH: 0xA0,
  /** A1xx - Clip stop */
  CLIP_STOP: 0xA1,
  /** A2xx - Clip arm */
  CLIP_ARM: 0xA2,
  /** A3xx - Scene launch */
  SCENE_LAUNCH: 0xA3,
  /** A4xx - Scene stop */
  SCENE_STOP: 0xA4,
  /** A5xx - Clip follow action */
  CLIP_FOLLOW: 0xA5,
  /** A6xx - Clip quantization */
  CLIP_QUANT: 0xA6,
  /** A7xx - Reserved */
  RESERVED_A7: 0xA7,
  /** A8xx - Reserved */
  RESERVED_A8: 0xA8,
  /** A9xx - Reserved */
  RESERVED_A9: 0xA9,
  /** AAxx - Reserved */
  RESERVED_AA: 0xAA,
  /** ABxx - Reserved */
  RESERVED_AB: 0xAB,
  /** ACxx - Reserved */
  RESERVED_AC: 0xAC,
  /** ADxx - Reserved */
  RESERVED_AD: 0xAD,
  /** AExx - Reserved */
  RESERVED_AE: 0xAE,
  /** AFxx - Reserved */
  RESERVED_AF: 0xAF,
  
  // ===== Event Commands (0xB0-0xBF) =====
  /** B0xx - Emit event type */
  EVENT_EMIT: 0xB0,
  /** B1xx - Event value */
  EVENT_VALUE: 0xB1,
  /** B2xx - Event target (track) */
  EVENT_TARGET: 0xB2,
  /** B3xx - Event delay */
  EVENT_DELAY: 0xB3,
  /** B4xx - Event condition */
  EVENT_COND: 0xB4,
  /** B5xx - Event probability */
  EVENT_PROB: 0xB5,
  /** B6xx - Reserved */
  RESERVED_B6: 0xB6,
  /** B7xx - Reserved */
  RESERVED_B7: 0xB7,
  /** B8xx - Reserved */
  RESERVED_B8: 0xB8,
  /** B9xx - Reserved */
  RESERVED_B9: 0xB9,
  /** BAxx - Reserved */
  RESERVED_BA: 0xBA,
  /** BBxx - Reserved */
  RESERVED_BB: 0xBB,
  /** BCxx - Reserved */
  RESERVED_BC: 0xBC,
  /** BDxx - Reserved */
  RESERVED_BD: 0xBD,
  /** BExx - Reserved */
  RESERVED_BE: 0xBE,
  /** BFxx - Reserved */
  RESERVED_BF: 0xBF,
  
  // ===== MIDI Commands (0xC0-0xCF) =====
  /** C0xx - MIDI CC */
  MIDI_CC: 0xC0,
  /** C1xx - MIDI program change */
  MIDI_PC: 0xC1,
  /** C2xx - MIDI bank select MSB */
  MIDI_BANK_MSB: 0xC2,
  /** C3xx - MIDI bank select LSB */
  MIDI_BANK_LSB: 0xC3,
  /** C4xx - MIDI NRPN MSB */
  MIDI_NRPN_MSB: 0xC4,
  /** C5xx - MIDI NRPN LSB */
  MIDI_NRPN_LSB: 0xC5,
  /** C6xx - MIDI RPN MSB */
  MIDI_RPN_MSB: 0xC6,
  /** C7xx - MIDI RPN LSB */
  MIDI_RPN_LSB: 0xC7,
  /** C8xx - MIDI channel */
  MIDI_CHANNEL: 0xC8,
  /** C9xx - Reserved */
  RESERVED_C9: 0xC9,
  /** CAxx - Reserved */
  RESERVED_CA: 0xCA,
  /** CBxx - Reserved */
  RESERVED_CB: 0xCB,
  /** CCxx - Reserved */
  RESERVED_CC: 0xCC,
  /** CDxx - Reserved */
  RESERVED_CD: 0xCD,
  /** CExx - Reserved */
  RESERVED_CE: 0xCE,
  /** CFxx - Reserved */
  RESERVED_CF: 0xCF,
  
  // ===== Automation Commands (0xD0-0xDF) =====
  /** D0xx - Automation point */
  AUTO_POINT: 0xD0,
  /** D1xx - Automation curve type */
  AUTO_CURVE: 0xD1,
  /** D2xx - Automation parameter index */
  AUTO_PARAM: 0xD2,
  /** D3xx - Automation value MSB */
  AUTO_VALUE_MSB: 0xD3,
  /** D4xx - Automation value LSB */
  AUTO_VALUE_LSB: 0xD4,
  /** D5xx - Reserved */
  RESERVED_D5: 0xD5,
  /** D6xx - Reserved */
  RESERVED_D6: 0xD6,
  /** D7xx - Reserved */
  RESERVED_D7: 0xD7,
  /** D8xx - Reserved */
  RESERVED_D8: 0xD8,
  /** D9xx - Reserved */
  RESERVED_D9: 0xD9,
  /** DAxx - Reserved */
  RESERVED_DA: 0xDA,
  /** DBxx - Reserved */
  RESERVED_DB: 0xDB,
  /** DCxx - Reserved */
  RESERVED_DC: 0xDC,
  /** DDxx - Reserved */
  RESERVED_DD: 0xDD,
  /** DExx - Reserved */
  RESERVED_DE: 0xDE,
  /** DFxx - Reserved */
  RESERVED_DF: 0xDF,
  
  // ===== Extended E Commands (0xE0-0xEF) =====
  /** E0x - Set filter */
  E_FILTER: 0xE0,
  /** E1x - Fine porta up */
  E_FINE_PORTA_UP: 0xE1,
  /** E2x - Fine porta down */
  E_FINE_PORTA_DOWN: 0xE2,
  /** E3x - Glide control */
  E_GLIDE_CTRL: 0xE3,
  /** E4x - Vibrato control */
  E_VIBRATO_CTRL: 0xE4,
  /** E5x - Set finetune */
  E_FINETUNE: 0xE5,
  /** E6x - Pattern loop */
  E_PATTERN_LOOP: 0xE6,
  /** E7x - Tremolo control */
  E_TREMOLO_CTRL: 0xE7,
  /** E8x - Set panning */
  E_SET_PAN: 0xE8,
  /** E9x - Retrigger */
  E_RETRIGGER: 0xE9,
  /** EAx - Fine volume up */
  E_FINE_VOL_UP: 0xEA,
  /** EBx - Fine volume down */
  E_FINE_VOL_DOWN: 0xEB,
  /** ECx - Note cut */
  E_NOTE_CUT: 0xEC,
  /** EDx - Note delay */
  E_NOTE_DELAY: 0xED,
  /** EEx - Pattern delay */
  E_PATTERN_DELAY: 0xEE,
  /** EFx - Invert loop / set active macro */
  E_INVERT_LOOP: 0xEF,
  
  // ===== Special Commands (0xF0-0xFF) =====
  /** F0xx - MIDI macro Zxx compatible */
  MIDI_MACRO: 0xF0,
  /** F1xx - Script call */
  SCRIPT_CALL: 0xF1,
  /** F2xx - Comment/annotation (no-op) */
  COMMENT: 0xF2,
  /** F3xx - Debug output */
  DEBUG: 0xF3,
  /** F4xx - Random command */
  RANDOM: 0xF4,
  /** F5xx - Random seed */
  RANDOM_SEED: 0xF5,
  /** F6xx - Reserved */
  RESERVED_F6: 0xF6,
  /** F7xx - Reserved */
  RESERVED_F7: 0xF7,
  /** F8xx - Reserved */
  RESERVED_F8: 0xF8,
  /** F9xx - Reserved */
  RESERVED_F9: 0xF9,
  /** FAxx - Reserved */
  RESERVED_FA: 0xFA,
  /** FBxx - Reserved */
  RESERVED_FB: 0xFB,
  /** FCxx - Reserved */
  RESERVED_FC: 0xFC,
  /** FDxx - Reserved */
  RESERVED_FD: 0xFD,
  /** FExx - Reserved */
  RESERVED_FE: 0xFE,
  /** FFxx - No-op */
  NOP: 0xFF,
} as const;

// ============================================================================
// EFFECT METADATA
// ============================================================================

/**
 * Effect category for organization.
 */
export enum EffectCategory {
  Volume = 'volume',
  Pitch = 'pitch',
  Sample = 'sample',
  Timing = 'timing',
  Modulation = 'modulation',
  Instrument = 'instrument',
  Pattern = 'pattern',
  Phrase = 'phrase',
  Generator = 'generator',
  Card = 'card',
  Session = 'session',
  Event = 'event',
  MIDI = 'midi',
  Automation = 'automation',
  Special = 'special',
}

/**
 * Effect parameter format.
 */
export enum ParamFormat {
  /** Single byte value 0-FF */
  Byte = 'byte',
  /** Two nibbles X and Y (0-F each) */
  TwoNibble = 'xy',
  /** Signed value -80 to 7F */
  Signed = 'signed',
  /** Boolean (00=off, else=on) */
  Boolean = 'bool',
  /** MIDI note (00-7F) */
  Note = 'note',
  /** Percentage (00-64 = 0-100%) */
  Percent = 'percent',
  /** No parameter */
  None = 'none',
}

/**
 * Effect metadata for UI and documentation.
 */
export interface EffectMeta {
  /** Effect code */
  readonly code: number;
  /** Display name */
  readonly name: string;
  /** Short description */
  readonly description: string;
  /** Category */
  readonly category: EffectCategory;
  /** Parameter format */
  readonly paramFormat: ParamFormat;
  /** Default parameter value */
  readonly defaultParam: number;
  /** Is continuous (affects multiple rows) */
  readonly continuous: boolean;
  /** Aliases (alternative codes) */
  readonly aliases?: readonly number[];
  /** Renoise-compatible */
  readonly renoiseCompat: boolean;
  /** ProTracker-compatible */
  readonly ptCompat: boolean;
}

/**
 * Effect metadata registry.
 */
export const EFFECT_META: ReadonlyMap<number, EffectMeta> = new Map([
  [FX.ARPEGGIO, {
    code: FX.ARPEGGIO,
    name: 'Arpeggio',
    description: 'Rapidly alternate between note and +X, +Y semitones',
    category: EffectCategory.Pitch,
    paramFormat: ParamFormat.TwoNibble,
    defaultParam: 0x37,
    continuous: false,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.PORTA_UP, {
    code: FX.PORTA_UP,
    name: 'Portamento Up',
    description: 'Slide pitch up by XX units per tick',
    category: EffectCategory.Pitch,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x10,
    continuous: true,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.PORTA_DOWN, {
    code: FX.PORTA_DOWN,
    name: 'Portamento Down',
    description: 'Slide pitch down by XX units per tick',
    category: EffectCategory.Pitch,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x10,
    continuous: true,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.TONE_PORTA, {
    code: FX.TONE_PORTA,
    name: 'Tone Portamento',
    description: 'Glide to target note at speed XX',
    category: EffectCategory.Pitch,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x20,
    continuous: true,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.VIBRATO, {
    code: FX.VIBRATO,
    name: 'Vibrato',
    description: 'Pitch vibrato with speed X, depth Y',
    category: EffectCategory.Modulation,
    paramFormat: ParamFormat.TwoNibble,
    defaultParam: 0x44,
    continuous: true,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.SET_PAN, {
    code: FX.SET_PAN,
    name: 'Set Panning',
    description: 'Set panning (00=left, 80=center, FF=right)',
    category: EffectCategory.Volume,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x80,
    continuous: false,
    renoiseCompat: true,
    ptCompat: false,
  }],
  [FX.SAMPLE_OFFSET, {
    code: FX.SAMPLE_OFFSET,
    name: 'Sample Offset',
    description: 'Start sample playback at position XX00',
    category: EffectCategory.Sample,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.SET_VOLUME, {
    code: FX.SET_VOLUME,
    name: 'Set Volume',
    description: 'Set note volume (00-40 in PT, 00-80 in XM)',
    category: EffectCategory.Volume,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x40,
    continuous: false,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.PATTERN_BREAK, {
    code: FX.PATTERN_BREAK,
    name: 'Pattern Break',
    description: 'Jump to row XX in next pattern',
    category: EffectCategory.Pattern,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.SET_TEMPO, {
    code: FX.SET_TEMPO,
    name: 'Set Tempo/Speed',
    description: '01-1F=speed, 20-FF=BPM',
    category: EffectCategory.Timing,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x06,
    continuous: false,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.NOTE_DELAY, {
    code: FX.NOTE_DELAY,
    name: 'Note Delay',
    description: 'Delay note by XX ticks',
    category: EffectCategory.Timing,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x03,
    continuous: false,
    renoiseCompat: true,
    ptCompat: false,
  }],
  [FX.RETRIGGER, {
    code: FX.RETRIGGER,
    name: 'Retrigger',
    description: 'Retrigger note every Y ticks with volume change X',
    category: EffectCategory.Sample,
    paramFormat: ParamFormat.TwoNibble,
    defaultParam: 0x03,
    continuous: true,
    renoiseCompat: true,
    ptCompat: true,
  }],
  [FX.NOTE_PROB, {
    code: FX.NOTE_PROB,
    name: 'Note Probability',
    description: 'Probability XX% that note plays',
    category: EffectCategory.Timing,
    paramFormat: ParamFormat.Percent,
    defaultParam: 0x50,
    continuous: false,
    renoiseCompat: true,
    ptCompat: false,
  }],
  [FX.GEN_TRIGGER, {
    code: FX.GEN_TRIGGER,
    name: 'Generator Trigger',
    description: 'Trigger generator with preset XX',
    category: EffectCategory.Generator,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: false,
    ptCompat: false,
  }],
  [FX.GEN_SEED, {
    code: FX.GEN_SEED,
    name: 'Generator Seed',
    description: 'Set generator random seed to XX',
    category: EffectCategory.Generator,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: false,
    ptCompat: false,
  }],
  [FX.CARD_TRIGGER, {
    code: FX.CARD_TRIGGER,
    name: 'Card Trigger',
    description: 'Trigger card XX',
    category: EffectCategory.Card,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: false,
    ptCompat: false,
  }],
  [FX.CLIP_LAUNCH, {
    code: FX.CLIP_LAUNCH,
    name: 'Clip Launch',
    description: 'Launch clip XX',
    category: EffectCategory.Session,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: false,
    ptCompat: false,
  }],
  [FX.EVENT_EMIT, {
    code: FX.EVENT_EMIT,
    name: 'Emit Event',
    description: 'Emit event type XX',
    category: EffectCategory.Event,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: false,
    ptCompat: false,
  }],
  [FX.PHRASE_TRIGGER, {
    code: FX.PHRASE_TRIGGER,
    name: 'Phrase Trigger',
    description: 'Trigger phrase XX',
    category: EffectCategory.Phrase,
    paramFormat: ParamFormat.Byte,
    defaultParam: 0x00,
    continuous: false,
    renoiseCompat: true,
    ptCompat: false,
  }],
]);

// ============================================================================
// EFFECT HELPERS
// ============================================================================

/**
 * Creates an arpeggio effect command.
 */
export function arpeggio(semi1: number, semi2: number): EffectCommand {
  return { code: asEffectCode(FX.ARPEGGIO), param: asEffectParam((semi1 << 4) | semi2) };
}

/**
 * Creates a portamento up effect command.
 */
export function portaUp(speed: number): EffectCommand {
  return { code: asEffectCode(FX.PORTA_UP), param: asEffectParam(speed) };
}

/**
 * Creates a portamento down effect command.
 */
export function portaDown(speed: number): EffectCommand {
  return { code: asEffectCode(FX.PORTA_DOWN), param: asEffectParam(speed) };
}

/**
 * Creates a tone portamento effect command.
 */
export function tonePorta(speed: number): EffectCommand {
  return { code: asEffectCode(FX.TONE_PORTA), param: asEffectParam(speed) };
}

/**
 * Creates a vibrato effect command.
 */
export function vibrato(speed: number, depth: number): EffectCommand {
  return { code: asEffectCode(FX.VIBRATO), param: asEffectParam((speed << 4) | depth) };
}

/**
 * Creates a tremolo effect command.
 */
export function tremolo(speed: number, depth: number): EffectCommand {
  return { code: asEffectCode(FX.TREMOLO), param: asEffectParam((speed << 4) | depth) };
}

/**
 * Creates a set panning effect command.
 */
export function setPan(pan: number): EffectCommand {
  return { code: asEffectCode(FX.SET_PAN), param: asEffectParam(pan) };
}

/**
 * Creates a set volume effect command.
 */
export function setVolume(volume: number): EffectCommand {
  return { code: asEffectCode(FX.SET_VOLUME), param: asEffectParam(volume) };
}

/**
 * Creates a volume slide effect command.
 */
export function volSlide(up: number, down: number): EffectCommand {
  return { code: asEffectCode(FX.VOL_SLIDE), param: asEffectParam((up << 4) | down) };
}

/**
 * Creates a note delay effect command.
 */
export function noteDelay(ticks: number): EffectCommand {
  return { code: asEffectCode(FX.NOTE_DELAY), param: asEffectParam(ticks) };
}

/**
 * Creates a note cut effect command.
 */
export function noteCut(ticks: number): EffectCommand {
  return { code: asEffectCode(FX.NOTE_CUT), param: asEffectParam(ticks) };
}

/**
 * Creates a retrigger effect command.
 */
export function retrigger(volChange: number, interval: number): EffectCommand {
  return { code: asEffectCode(FX.RETRIGGER), param: asEffectParam((volChange << 4) | interval) };
}

/**
 * Creates a sample offset effect command.
 */
export function sampleOffset(position: number): EffectCommand {
  return { code: asEffectCode(FX.SAMPLE_OFFSET), param: asEffectParam(position) };
}

/**
 * Creates a set tempo effect command.
 */
export function setTempo(value: number): EffectCommand {
  return { code: asEffectCode(FX.SET_TEMPO), param: asEffectParam(value) };
}

/**
 * Creates a pattern break effect command.
 */
export function patternBreak(row: number): EffectCommand {
  return { code: asEffectCode(FX.PATTERN_BREAK), param: asEffectParam(row) };
}

/**
 * Creates a pattern jump effect command.
 */
export function patternJump(position: number): EffectCommand {
  return { code: asEffectCode(FX.PATTERN_JUMP), param: asEffectParam(position) };
}

/**
 * Creates a note probability effect command.
 */
export function noteProb(percent: number): EffectCommand {
  return { code: asEffectCode(FX.NOTE_PROB), param: asEffectParam(percent) };
}

/**
 * Creates a generator trigger effect command.
 */
export function genTrigger(preset: number): EffectCommand {
  return { code: asEffectCode(FX.GEN_TRIGGER), param: asEffectParam(preset) };
}

/**
 * Creates a generator seed effect command.
 */
export function genSeed(seed: number): EffectCommand {
  return { code: asEffectCode(FX.GEN_SEED), param: asEffectParam(seed) };
}

/**
 * Creates a card trigger effect command.
 */
export function cardTrigger(cardIndex: number): EffectCommand {
  return { code: asEffectCode(FX.CARD_TRIGGER), param: asEffectParam(cardIndex) };
}

/**
 * Creates a clip launch effect command.
 */
export function clipLaunch(clipIndex: number): EffectCommand {
  return { code: asEffectCode(FX.CLIP_LAUNCH), param: asEffectParam(clipIndex) };
}

/**
 * Creates an event emit effect command.
 */
export function eventEmit(eventType: number): EffectCommand {
  return { code: asEffectCode(FX.EVENT_EMIT), param: asEffectParam(eventType) };
}

/**
 * Creates a phrase trigger effect command.
 */
export function phraseTrigger(phraseIndex: number): EffectCommand {
  return { code: asEffectCode(FX.PHRASE_TRIGGER), param: asEffectParam(phraseIndex) };
}

// ============================================================================
// EFFECT PARSING
// ============================================================================

/**
 * Parse effect command from string (e.g., "0E37" or "A00").
 */
export function parseEffect(str: string): EffectCommand | null {
  const trimmed = str.trim().toUpperCase();
  if (trimmed.length < 3 || trimmed.length > 4) return null;
  
  const code = parseInt(trimmed.slice(0, trimmed.length === 4 ? 2 : 1), 16);
  const param = parseInt(trimmed.slice(trimmed.length === 4 ? 2 : 1), 16);
  
  if (isNaN(code) || isNaN(param)) return null;
  
  return { code: asEffectCode(code), param: asEffectParam(param) };
}

/**
 * Format effect command to string.
 */
export function formatEffect(effect: EffectCommand, pad: boolean = true): string {
  const code = effect.code.toString(16).toUpperCase();
  const param = effect.param.toString(16).toUpperCase().padStart(2, '0');
  return pad ? code.padStart(2, '0') + param : code + param;
}

/**
 * Get effect metadata.
 */
export function getEffectMeta(code: number): EffectMeta | undefined {
  return EFFECT_META.get(code);
}

/**
 * Get effect name.
 */
export function getEffectName(code: number): string {
  return EFFECT_META.get(code)?.name ?? `Unknown (${code.toString(16).toUpperCase()})`;
}

/**
 * Get all effects in a category.
 */
export function getEffectsByCategory(category: EffectCategory): EffectMeta[] {
  return Array.from(EFFECT_META.values()).filter(m => m.category === category);
}
