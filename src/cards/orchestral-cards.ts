/**
 * @fileoverview Orchestral Instrument Cards
 * 
 * Implements professional orchestral ensemble cards that transform chord/note
 * input streams into multiple output streams with proper arranging, voice leading,
 * and articulation handling.
 * 
 * Cards included:
 * - StringsCard: Orchestral strings (violin I/II, viola, cello, bass)
 * - BrassCard: Brass section (trumpet, trombone, horn, tuba)
 * - WoodwindsCard: Woodwinds (flute, oboe, clarinet, bassoon)
 * - OrchestraCard: Full orchestral palette
 * - JazzBandCard: Jazz ensemble (trumpet, sax, trombone, rhythm section)
 * 
 * @module @cardplay/core/cards/orchestral
 */

import type { Card } from './card';
import { createSignature, PortTypes } from './card';
import type { Event } from '../types/event';

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Input: chord or note stream
 */
export interface EnsembleInput {
  readonly notes: Event<any>[];
  readonly chords?: Event<any>[];
}

/**
 * Output: multiple instrument streams
 */
export interface EnsembleOutput {
  readonly [instrumentName: string]: Event<any>[];
}

/**
 * Voice leading configuration
 */
export interface VoiceLeadingConfig {
  readonly maxMovement: number; // semitones
  readonly preferContraryMotion: boolean;
  readonly avoidParallels: boolean;
  readonly smoothing: number; // 0-1
}

/**
 * Articulation style
 */
export type ArticulationStyle =
  | 'legato'
  | 'staccato'
  | 'marcato'
  | 'tenuto'
  | 'spiccato'
  | 'pizzicato'
  | 'tremolo'
  | 'col-legno'
  | 'detache';

/**
 * Dynamic marking
 */
export type DynamicMarking = 'ppp' | 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'fff';

/**
 * Arranging preset base
 */
export interface ArrangingPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly voiceLeading: VoiceLeadingConfig;
  readonly defaultArticulation: ArticulationStyle;
  readonly defaultDynamic: DynamicMarking;
  readonly doubling: { [voice: string]: number }; // octave doubling
}

// ============================================================================
// STRINGS CARD (Item 1587)
// ============================================================================

/**
 * String section voices
 */
export type StringVoice = 'violin1' | 'violin2' | 'viola' | 'cello' | 'bass';

/**
 * Strings arranging preset
 */
export interface StringsPreset extends ArrangingPreset {
  readonly divisi: boolean; // split sections
  readonly bowingPattern: 'separate' | 'slurred' | 'detache' | 'legato';
}

/**
 * Factory string presets
 */
export const STRINGS_PRESETS: Record<string, StringsPreset> = {
  'classical-tutti': {
    id: 'classical-tutti',
    name: 'Classical Tutti',
    description: 'Full orchestra strings with traditional voicing',
    voiceLeading: {
      maxMovement: 7,
      preferContraryMotion: true,
      avoidParallels: true,
      smoothing: 0.8
    },
    defaultArticulation: 'legato',
    defaultDynamic: 'f',
    doubling: { violin1: 0, violin2: 0, viola: -12, cello: -12, bass: -24 },
    divisi: false,
    bowingPattern: 'legato'
  },
  'film-score-lush': {
    id: 'film-score-lush',
    name: 'Film Score Lush',
    description: 'Sweeping cinematic strings with rich harmony',
    voiceLeading: {
      maxMovement: 12,
      preferContraryMotion: false,
      avoidParallels: false,
      smoothing: 0.9
    },
    defaultArticulation: 'legato',
    defaultDynamic: 'mf',
    doubling: { violin1: 12, violin2: 0, viola: 0, cello: -12, bass: -24 },
    divisi: true,
    bowingPattern: 'slurred'
  },
  'baroque-chamber': {
    id: 'baroque-chamber',
    name: 'Baroque Chamber',
    description: 'Clear contrapuntal voicing for chamber ensemble',
    voiceLeading: {
      maxMovement: 5,
      preferContraryMotion: true,
      avoidParallels: true,
      smoothing: 0.6
    },
    defaultArticulation: 'detache',
    defaultDynamic: 'mp',
    doubling: { violin1: 0, violin2: 0, viola: 0, cello: 0, bass: 0 },
    divisi: false,
    bowingPattern: 'separate'
  },
  'pizzicato-playful': {
    id: 'pizzicato-playful',
    name: 'Pizzicato Playful',
    description: 'Light bouncing pizzicato texture',
    voiceLeading: {
      maxMovement: 12,
      preferContraryMotion: false,
      avoidParallels: false,
      smoothing: 0.3
    },
    defaultArticulation: 'pizzicato',
    defaultDynamic: 'mf',
    doubling: { violin1: 0, violin2: 0, viola: 0, cello: -12, bass: -24 },
    divisi: false,
    bowingPattern: 'separate'
  },
  'tremolo-tension': {
    id: 'tremolo-tension',
    name: 'Tremolo Tension',
    description: 'Sustained tremolo for building suspense',
    voiceLeading: {
      maxMovement: 3,
      preferContraryMotion: false,
      avoidParallels: true,
      smoothing: 0.95
    },
    defaultArticulation: 'tremolo',
    defaultDynamic: 'pp',
    doubling: { violin1: 12, violin2: 0, viola: 0, cello: 0, bass: -12 },
    divisi: true,
    bowingPattern: 'legato'
  }
};

/**
 * Arrange notes for string section
 */
export function arrangeForStrings(
  input: EnsembleInput,
  preset: StringsPreset
): EnsembleOutput {
  const output: EnsembleOutput = {
    violin1: [],
    violin2: [],
    viola: [],
    cello: [],
    bass: []
  };
  
  // For each input note/chord, distribute across voices
  input.notes.forEach(note => {
    const pitch = (note.payload as any).pitch || 60;
    const voices = distributeToStringVoices(pitch, preset);
    
    voices.forEach(({ voice, pitch: voicePitch }) => {
      const voiceArr = output[voice];
      if (!voiceArr) return;
      voiceArr.push({
        ...note,
        payload: {
          ...note.payload,
          pitch: voicePitch,
          articulation: preset.defaultArticulation,
          dynamic: preset.defaultDynamic
        }
      });
    });
  });
  
  return output;
}

function distributeToStringVoices(
  pitch: number,
  preset: StringsPreset
): Array<{ voice: StringVoice; pitch: number }> {
  const result: Array<{ voice: StringVoice; pitch: number }> = [];
  
  // Distribute based on register
  if (pitch >= 60) result.push({ voice: 'violin1', pitch: pitch + (preset.doubling.violin1 || 0) });
  if (pitch >= 55) result.push({ voice: 'violin2', pitch: pitch + (preset.doubling.violin2 || 0) });
  if (pitch >= 48) result.push({ voice: 'viola', pitch: pitch + (preset.doubling.viola || 0) });
  if (pitch >= 36) result.push({ voice: 'cello', pitch: pitch + (preset.doubling.cello || 0) });
  result.push({ voice: 'bass', pitch: pitch + (preset.doubling.bass || 0) });
  
  return result;
}

export const STRINGS_CARD: Card<EnsembleInput, EnsembleOutput> = {
  meta: {
    id: 'strings',
    name: 'Strings Section',
    category: 'transforms',
    description: 'Orchestral strings with professional arranging and voice leading',
    tags: ['orchestral', 'strings', 'ensemble']
  },
  signature: createSignature(
    [{ name: 'input', type: PortTypes.NOTES }],
    [{ name: 'output', type: PortTypes.NOTES }]
  ),
  process: (input: EnsembleInput, _context: any) => {
    const preset = STRINGS_PRESETS['classical-tutti'];
    if (!preset) throw new Error('Preset not found');
    return { output: arrangeForStrings(input, preset) };
  }
};

// ============================================================================
// BRASS CARD (Item 1588)
// ============================================================================

export type BrassVoice = 'trumpet' | 'horn' | 'trombone' | 'tuba';

export interface BrassPreset extends ArrangingPreset {
  readonly fanfare: boolean;
  readonly sectionSize: number; // 1-4 per voice
}

export const BRASS_PRESETS: Record<string, BrassPreset> = {
  'fanfare-heroic': {
    id: 'fanfare-heroic',
    name: 'Fanfare Heroic',
    description: 'Bold brass fanfare with trumpet lead',
    voiceLeading: {
      maxMovement: 12,
      preferContraryMotion: false,
      avoidParallels: false,
      smoothing: 0.5
    },
    defaultArticulation: 'marcato',
    defaultDynamic: 'ff',
    doubling: { trumpet: 12, horn: 0, trombone: 0, tuba: -12 },
    fanfare: true,
    sectionSize: 3
  },
  'chorale-warm': {
    id: 'chorale-warm',
    name: 'Chorale Warm',
    description: 'Rich harmonic brass chorale',
    voiceLeading: {
      maxMovement: 5,
      preferContraryMotion: true,
      avoidParallels: true,
      smoothing: 0.9
    },
    defaultArticulation: 'legato',
    defaultDynamic: 'mf',
    doubling: { trumpet: 0, horn: 0, trombone: 0, tuba: 0 },
    fanfare: false,
    sectionSize: 2
  },
  'jazz-hits': {
    id: 'jazz-hits',
    name: 'Jazz Hits',
    description: 'Punchy jazz brass stabs',
    voiceLeading: {
      maxMovement: 12,
      preferContraryMotion: false,
      avoidParallels: false,
      smoothing: 0.2
    },
    defaultArticulation: 'staccato',
    defaultDynamic: 'f',
    doubling: { trumpet: 0, horn: 0, trombone: -12, tuba: -24 },
    fanfare: false,
    sectionSize: 1
  }
};

export function arrangeForBrass(
  input: EnsembleInput,
  preset: BrassPreset
): EnsembleOutput {
  const output: EnsembleOutput = {
    trumpet: [],
    horn: [],
    trombone: [],
    tuba: []
  };
  
  input.notes.forEach(note => {
    const pitch = (note.payload as any).pitch || 60;
    const voices = distributeToBrassVoices(pitch, preset);
    
    voices.forEach(({ voice, pitch: voicePitch }) => {
      const voiceArr = output[voice];
      if (!voiceArr) return;
      voiceArr.push({
        ...note,
        payload: {
          ...note.payload,
          pitch: voicePitch,
          articulation: preset.defaultArticulation,
          dynamic: preset.defaultDynamic
        }
      });
    });
  });
  
  return output;
}

function distributeToBrassVoices(
  pitch: number,
  preset: BrassPreset
): Array<{ voice: BrassVoice; pitch: number }> {
  const result: Array<{ voice: BrassVoice; pitch: number }> = [];
  
  if (pitch >= 60) result.push({ voice: 'trumpet', pitch: pitch + (preset.doubling.trumpet || 0) });
  if (pitch >= 48) result.push({ voice: 'horn', pitch: pitch + (preset.doubling.horn || 0) });
  if (pitch >= 40) result.push({ voice: 'trombone', pitch: pitch + (preset.doubling.trombone || 0) });
  result.push({ voice: 'tuba', pitch: pitch + (preset.doubling.tuba || 0) });
  
  return result;
}

export const BRASS_CARD: Card<EnsembleInput, EnsembleOutput> = {
  meta: {
    id: 'brass',
    name: 'Brass Section',
    category: 'transforms',
    description: 'Brass ensemble with powerful arranging presets',
    tags: ['orchestral', 'brass', 'ensemble']
  },
  signature: createSignature(
    [{ name: 'input', type: PortTypes.NOTES }],
    [{ name: 'output', type: PortTypes.NOTES }]
  ),
  process: (input: EnsembleInput, _context: any) => {
    const preset = BRASS_PRESETS['chorale-warm'];
    if (!preset) throw new Error('Preset not found');
    return { output: arrangeForBrass(input, preset) };
  }
};

// ============================================================================
// WOODWINDS CARD (Item 1589)
// ============================================================================

export type WoodwindVoice = 'flute' | 'oboe' | 'clarinet' | 'bassoon';

export interface WoodwindsPreset extends ArrangingPreset {
  readonly flutter: boolean;
  readonly doubleReeds: boolean;
}

export const WOODWINDS_PRESETS: Record<string, WoodwindsPreset> = {
  'classical-quintet': {
    id: 'classical-quintet',
    name: 'Classical Quintet',
    description: 'Balanced chamber woodwind voicing',
    voiceLeading: {
      maxMovement: 7,
      preferContraryMotion: true,
      avoidParallels: true,
      smoothing: 0.8
    },
    defaultArticulation: 'legato',
    defaultDynamic: 'mp',
    doubling: { flute: 12, oboe: 0, clarinet: 0, bassoon: -12 },
    flutter: false,
    doubleReeds: true
  },
  'pastoral-gentle': {
    id: 'pastoral-gentle',
    name: 'Pastoral Gentle',
    description: 'Soft, flowing woodwind texture',
    voiceLeading: {
      maxMovement: 5,
      preferContraryMotion: false,
      avoidParallels: true,
      smoothing: 0.95
    },
    defaultArticulation: 'legato',
    defaultDynamic: 'p',
    doubling: { flute: 0, oboe: 0, clarinet: 0, bassoon: 0 },
    flutter: false,
    doubleReeds: true
  },
  'modern-flutter': {
    id: 'modern-flutter',
    name: 'Modern Flutter',
    description: 'Contemporary extended techniques',
    voiceLeading: {
      maxMovement: 12,
      preferContraryMotion: false,
      avoidParallels: false,
      smoothing: 0.3
    },
    defaultArticulation: 'staccato',
    defaultDynamic: 'mf',
    doubling: { flute: 0, oboe: 0, clarinet: -12, bassoon: -24 },
    flutter: true,
    doubleReeds: false
  }
};

export function arrangeForWoodwinds(
  input: EnsembleInput,
  preset: WoodwindsPreset
): EnsembleOutput {
  const output: EnsembleOutput = {
    flute: [],
    oboe: [],
    clarinet: [],
    bassoon: []
  };
  
  input.notes.forEach(note => {
    const pitch = (note.payload as any).pitch || 60;
    const voices = distributeToWoodwindVoices(pitch, preset);
    
    voices.forEach(({ voice, pitch: voicePitch }) => {
      const voiceArr = output[voice];
      if (!voiceArr) return;
      voiceArr.push({
        ...note,
        payload: {
          ...note.payload,
          pitch: voicePitch,
          articulation: preset.defaultArticulation,
          dynamic: preset.defaultDynamic
        }
      });
    });
  });
  
  return output;
}

function distributeToWoodwindVoices(
  pitch: number,
  preset: WoodwindsPreset
): Array<{ voice: WoodwindVoice; pitch: number }> {
  const result: Array<{ voice: WoodwindVoice; pitch: number }> = [];
  
  if (pitch >= 65) result.push({ voice: 'flute', pitch: pitch + (preset.doubling.flute || 0) });
  if (pitch >= 55) result.push({ voice: 'oboe', pitch: pitch + (preset.doubling.oboe || 0) });
  if (pitch >= 50) result.push({ voice: 'clarinet', pitch: pitch + (preset.doubling.clarinet || 0) });
  result.push({ voice: 'bassoon', pitch: pitch + (preset.doubling.bassoon || 0) });
  
  return result;
}

export const WOODWINDS_CARD: Card<EnsembleInput, EnsembleOutput> = {
  meta: {
    id: 'woodwinds',
    name: 'Woodwinds Section',
    category: 'transforms',
    description: 'Woodwind ensemble with expressive arranging',
    tags: ['orchestral', 'woodwinds', 'ensemble']
  },
  signature: createSignature(
    [{ name: 'input', type: PortTypes.NOTES }],
    [{ name: 'output', type: PortTypes.NOTES }]
  ),
  process: (input: EnsembleInput, _context: any) => {
    const preset = WOODWINDS_PRESETS['classical-quintet'];
    if (!preset) throw new Error('Preset not found');
    return { output: arrangeForWoodwinds(input, preset) };
  }
};

// ============================================================================
// ORCHESTRA CARD (Item 1590) - Full Orchestra
// ============================================================================

export const ORCHESTRA_CARD: Card<EnsembleInput, EnsembleOutput> = {
  meta: {
    id: 'orchestra',
    name: 'Full Orchestra',
    category: 'transforms',
    description: 'Complete orchestral palette with intelligent arranging',
    tags: ['orchestral', 'orchestra', 'ensemble', 'symphonic']
  },
  signature: createSignature(
    [{ name: 'input', type: PortTypes.NOTES }],
    [{ name: 'output', type: PortTypes.NOTES }]
  ),
  process: (input: EnsembleInput, _context: any) => {
    // Combine all sections
    const stringsPreset = STRINGS_PRESETS['classical-tutti'];
    const brassPreset = BRASS_PRESETS['chorale-warm'];
    const woodwindsPreset = WOODWINDS_PRESETS['classical-quintet'];
    
    if (!stringsPreset || !brassPreset || !woodwindsPreset) {
      throw new Error('Preset not found');
    }
    
    const strings = arrangeForStrings(input, stringsPreset);
    const brass = arrangeForBrass(input, brassPreset);
    const woodwinds = arrangeForWoodwinds(input, woodwindsPreset);
    
    return {
      output: {
        ...strings,
        ...brass,
        ...woodwinds
      }
    };
  }
};

// ============================================================================
// JAZZ BAND CARD (Item 1591) - Jazz Ensemble
// ============================================================================

export type JazzVoice = 'trumpet' | 'alto-sax' | 'tenor-sax' | 'trombone' | 'piano' | 'bass' | 'drums';

export const JAZZ_BAND_CARD: Card<EnsembleInput, EnsembleOutput> = {
  meta: {
    id: 'jazz-band',
    name: 'Jazz Band',
    category: 'transforms',
    description: 'Full jazz ensemble with swing feel and improvisation',
    tags: ['jazz', 'ensemble', 'swing', 'improvisation']
  },
  signature: createSignature(
    [{ name: 'input', type: PortTypes.NOTES }],
    [{ name: 'output', type: PortTypes.NOTES }]
  ),
  process: (input: EnsembleInput, _context: any) => {
    const output: EnsembleOutput = {
      'trumpet': [],
      'alto-sax': [],
      'tenor-sax': [],
      'trombone': [],
      'piano': [],
      'bass': [],
      'drums': []
    };
    
    input.notes.forEach(note => {
      const pitch = (note.payload as any).pitch || 60;
      
      // Horn section (distribute melody)
      if (pitch >= 60) {
        output['trumpet']!.push({
          ...note,
          payload: { ...note.payload, pitch, articulation: 'staccato' }
        });
      }
      if (pitch >= 55 && pitch < 72) {
        output['alto-sax']!.push({
          ...note,
          payload: { ...note.payload, pitch: pitch - 3, articulation: 'legato' }
        });
      }
      if (pitch >= 48 && pitch < 67) {
        output['tenor-sax']!.push({
          ...note,
          payload: { ...note.payload, pitch: pitch - 7, articulation: 'legato' }
        });
      }
      if (pitch < 60) {
        output['trombone']!.push({
          ...note,
          payload: { ...note.payload, pitch: pitch - 12, articulation: 'marcato' }
        });
      }
      
      // Piano comping (chords)
      output['piano']!.push(note);
      
      // Bass (root notes)
      output['bass']!.push({
        ...note,
        payload: { ...note.payload, pitch: pitch - 24 }
      });
      
      // Drums (swing pattern)
      output['drums']!.push({
        ...note,
        payload: { ...note.payload, instrument: 'ride', velocity: 0.6 }
      });
    });
    
    return { output };
  }
};
