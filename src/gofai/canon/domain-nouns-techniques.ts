/**
 * GOFAI Domain Nouns — Musical Techniques and Performance Styles
 * 
 * Comprehensive vocabulary of musical techniques, articulations, ornaments,
 * and performance styles that can be referenced in natural language commands.
 * 
 * Part of Phase 1 vocabulary expansion (Steps 051-100) from gofai_goalB.md.
 * 
 * @module gofai/canon/domain-nouns-techniques
 */

import type { Lexeme, LexemeId } from './types';

/**
 * Technique category classifications
 */
export type TechniqueCategory =
  | 'articulation'
  | 'dynamics'
  | 'ornament'
  | 'rhythmic-technique'
  | 'harmonic-technique'
  | 'production-technique'
  | 'mixing-technique'
  | 'compositional-technique';

/**
 * Technique lexeme with extended metadata
 */
export interface TechniqueLexeme extends Omit<Lexeme, 'description' | 'examples'> {
  readonly techniqueCategory: TechniqueCategory;
  readonly applicableToInstruments: readonly string[];  // Which instruments can use this
  readonly affectsAspects: readonly string[];           // What aspects it modifies
  readonly typicalParameters?: Record<string, number | number[] | boolean | string>;  // Default parameter values
  readonly description?: string;  // Optional, can be derived from lemma
  readonly examples?: readonly string[];  // Optional usage examples
}

// =============================================================================
// ARTICULATIONS
// =============================================================================

export const NOUN_STACCATO: TechniqueLexeme = {
  id: 'lex:noun:staccato' as LexemeId,
  lemma: 'staccato',
  variants: ['staccato', 'detached', 'short notes', 'clipped'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['all'],
  affectsAspects: ['duration', 'envelope', 'separation'],
  typicalParameters: { duration: 0.3, separation: 0.7 }
};

export const NOUN_LEGATO: TechniqueLexeme = {
  id: 'lex:noun:legato' as LexemeId,
  lemma: 'legato',
  variants: ['legato', 'smooth', 'connected', 'flowing'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['all'],
  affectsAspects: ['duration', 'envelope', 'connection'],
  typicalParameters: { overlap: 0.95, smoothness: 0.9 }
};

export const NOUN_MARCATO: TechniqueLexeme = {
  id: 'lex:noun:marcato' as LexemeId,
  lemma: 'marcato',
  variants: ['marcato', 'accented', 'marked', 'stressed'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['all'],
  affectsAspects: ['velocity', 'accent', 'attack'],
  typicalParameters: { accentAmount: 1.3, attackSharpness: 1.2 }
};

export const NOUN_TENUTO: TechniqueLexeme = {
  id: 'lex:noun:tenuto' as LexemeId,
  lemma: 'tenuto',
  variants: ['tenuto', 'held', 'sustained', 'full value'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['all'],
  affectsAspects: ['duration', 'sustain'],
  typicalParameters: { durationMultiplier: 1.0, separation: 0 }
};

export const NOUN_PORTAMENTO: TechniqueLexeme = {
  id: 'lex:noun:portamento' as LexemeId,
  lemma: 'portamento',
  variants: ['portamento', 'glide', 'slide', 'glissando'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['string', 'wind', 'voice', 'synthesizer'],
  affectsAspects: ['pitch', 'transition', 'connection'],
  typicalParameters: { glideTime: 0.1, curvature: 0.5 }
};

export const NOUN_PIZZICATO: TechniqueLexeme = {
  id: 'lex:noun:pizzicato' as LexemeId,
  lemma: 'pizzicato',
  variants: ['pizzicato', 'pizz', 'plucked'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['string'],
  affectsAspects: ['timbre', 'attack', 'duration'],
  typicalParameters: { pluckSharpness: 0.8, sustainReduction: 0.5 }
};

export const NOUN_TREMOLO: TechniqueLexeme = {
  id: 'lex:noun:tremolo' as LexemeId,
  lemma: 'tremolo',
  variants: ['tremolo', 'rapid repetition', 'shaking'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['all'],
  affectsAspects: ['rhythm', 'texture', 'intensity'],
  typicalParameters: { rate: 16, depth: 0.3 }
};

export const NOUN_VIBRATO: TechniqueLexeme = {
  id: 'lex:noun:vibrato' as LexemeId,
  lemma: 'vibrato',
  variants: ['vibrato', 'vibrato effect', 'pitch modulation'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['string', 'wind', 'voice', 'synthesizer'],
  affectsAspects: ['pitch', 'expression', 'warmth'],
  typicalParameters: { rate: 5, depth: 0.5, delay: 0.2 }
};

export const NOUN_FLUTTER_TONGUE: TechniqueLexeme = {
  id: 'lex:noun:flutter-tongue' as LexemeId,
  lemma: 'flutter tongue',
  variants: ['flutter tongue', 'flutter tonguing', 'fluttertongue'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['wind', 'brass'],
  affectsAspects: ['timbre', 'texture', 'color'],
  typicalParameters: { rate: 20, intensity: 0.6 }
};

export const NOUN_SPICCATO: TechniqueLexeme = {
  id: 'lex:noun:spiccato' as LexemeId,
  lemma: 'spiccato',
  variants: ['spiccato', 'bouncing bow', 'light staccato'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'articulation',
  applicableToInstruments: ['string'],
  affectsAspects: ['articulation', 'bounce', 'lightness'],
  typicalParameters: { bounceHeight: 0.6, separation: 0.5 }
};

// =============================================================================
// ORNAMENTS
// =============================================================================

export const NOUN_TRILL: TechniqueLexeme = {
  id: 'lex:noun:trill' as LexemeId,
  lemma: 'trill',
  variants: ['trill', 'trills', 'trill ornament'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'ornament',
  applicableToInstruments: ['all-melodic'],
  affectsAspects: ['pitch', 'rhythm', 'ornamentation'],
  typicalParameters: { interval: 1, rate: 8, alternations: 8 }
};

export const NOUN_MORDENT: TechniqueLexeme = {
  id: 'lex:noun:mordent' as LexemeId,
  lemma: 'mordent',
  variants: ['mordent', 'inverted mordent', 'pralltriller'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'ornament',
  applicableToInstruments: ['all-melodic'],
  affectsAspects: ['pitch', 'ornamentation', 'embellishment'],
  typicalParameters: { interval: 1, alternations: 2 }
};

export const NOUN_TURN: TechniqueLexeme = {
  id: 'lex:noun:turn' as LexemeId,
  lemma: 'turn',
  variants: ['turn', 'gruppetto', 'double turn'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'ornament',
  applicableToInstruments: ['all-melodic'],
  affectsAspects: ['pitch', 'ornamentation', 'flourish'],
  typicalParameters: { intervals: [1, 0, -1], duration: 0.25 }
};

export const NOUN_GRACE_NOTE: TechniqueLexeme = {
  id: 'lex:noun:grace-note' as LexemeId,
  lemma: 'grace note',
  variants: ['grace note', 'acciaccatura', 'appoggiatura', 'grace'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'ornament',
  applicableToInstruments: ['all'],
  affectsAspects: ['pitch', 'timing', 'ornamentation'],
  typicalParameters: { offset: -0.05, velocityReduction: 0.7 }
};

export const NOUN_APPOGGIATURA: TechniqueLexeme = {
  id: 'lex:noun:appoggiatura' as LexemeId,
  lemma: 'appoggiatura',
  variants: ['appoggiatura', 'long grace note', 'leaning note'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'ornament',
  applicableToInstruments: ['all-melodic'],
  affectsAspects: ['pitch', 'timing', 'expression'],
  typicalParameters: { duration: 0.5, intervalUp: true }
};

export const NOUN_SLIDE: TechniqueLexeme = {
  id: 'lex:noun:slide' as LexemeId,
  lemma: 'slide',
  variants: ['slide', 'pitch bend', 'scoop', 'doit'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'ornament',
  applicableToInstruments: ['all'],
  affectsAspects: ['pitch', 'expression', 'transition'],
  typicalParameters: { distance: 2, duration: 0.1 }
};

// =============================================================================
// RHYTHMIC TECHNIQUES
// =============================================================================

export const NOUN_SWING: TechniqueLexeme = {
  id: 'lex:noun:swing' as LexemeId,
  lemma: 'swing',
  variants: ['swing', 'swing feel', 'triplet feel', 'shuffle'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['timing', 'groove', 'feel'],
  typicalParameters: { swingAmount: 0.66, strength: 0.7 }
};

export const NOUN_SYNCOPATION: TechniqueLexeme = {
  id: 'lex:noun:syncopation' as LexemeId,
  lemma: 'syncopation',
  variants: ['syncopation', 'syncopated', 'offbeat', 'off-beat'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['timing', 'rhythm', 'accent'],
  typicalParameters: { offbeatEmphasis: 1.2, onbeatReduction: 0.8 }
};

export const NOUN_HEMIOLA: TechniqueLexeme = {
  id: 'lex:noun:hemiola' as LexemeId,
  lemma: 'hemiola',
  variants: ['hemiola', 'hemiolia', 'three-over-two', '3:2'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['meter', 'grouping', 'accent'],
  typicalParameters: { ratio: 1.5, accentPattern: [1, 0, 0, 1, 0, 0] }
};

export const NOUN_POLYRHYTHM: TechniqueLexeme = {
  id: 'lex:noun:polyrhythm' as LexemeId,
  lemma: 'polyrhythm',
  variants: ['polyrhythm', 'cross rhythm', 'polymeter'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['rhythm', 'independence', 'complexity'],
  typicalParameters: { ratio: [3, 4], complexity: 0.7 }
};

export const NOUN_RUBATO: TechniqueLexeme = {
  id: 'lex:noun:rubato' as LexemeId,
  lemma: 'rubato',
  variants: ['rubato', 'tempo rubato', 'flexible tempo'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['tempo', 'timing', 'expression'],
  typicalParameters: { flexibility: 0.15, recovery: 0.9 }
};

export const NOUN_RITARDANDO: TechniqueLexeme = {
  id: 'lex:noun:ritardando' as LexemeId,
  lemma: 'ritardando',
  variants: ['ritardando', 'rit', 'slowing down', 'rallentando'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['tempo', 'timing', 'deceleration'],
  typicalParameters: { rate: -0.1, curvature: 0.5 }
};

export const NOUN_ACCELERANDO: TechniqueLexeme = {
  id: 'lex:noun:accelerando' as LexemeId,
  lemma: 'accelerando',
  variants: ['accelerando', 'accel', 'speeding up'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['tempo', 'timing', 'acceleration'],
  typicalParameters: { rate: 0.1, curvature: 0.5 }
};

export const NOUN_FERMATA: TechniqueLexeme = {
  id: 'lex:noun:fermata' as LexemeId,
  lemma: 'fermata',
  variants: ['fermata', 'pause', 'hold', 'bird\'s eye'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'rhythmic-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['duration', 'timing', 'pause'],
  typicalParameters: { extensionFactor: 1.5, decay: 0.8 }
};

// =============================================================================
// HARMONIC TECHNIQUES
// =============================================================================

export const NOUN_ARPEGGIATION: TechniqueLexeme = {
  id: 'lex:noun:arpeggiation' as LexemeId,
  lemma: 'arpeggiation',
  variants: ['arpeggiation', 'arpeggio', 'arpeggiated', 'broken chord'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'harmonic-technique',
  applicableToInstruments: ['keyboard', 'guitar', 'harp', 'synthesizer'],
  affectsAspects: ['harmony', 'timing', 'texture'],
  typicalParameters: { rate: 8, direction: 'up', spread: 0.05 }
};

export const NOUN_VOICING: TechniqueLexeme = {
  id: 'lex:noun:voicing' as LexemeId,
  lemma: 'voicing',
  variants: ['voicing', 'chord voicing', 'voice leading'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'harmonic-technique',
  applicableToInstruments: ['all-harmonic'],
  affectsAspects: ['harmony', 'register', 'spacing'],
  typicalParameters: { openness: 0.6, smoothness: 0.8 }
};

export const NOUN_INVERSION: TechniqueLexeme = {
  id: 'lex:noun:inversion' as LexemeId,
  lemma: 'inversion',
  variants: ['inversion', 'inverted chord', 'bass inversion'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'harmonic-technique',
  applicableToInstruments: ['all-harmonic'],
  affectsAspects: ['harmony', 'bass', 'stability'],
  typicalParameters: { inversionNumber: 1 }
};

export const NOUN_SUSPENSION: TechniqueLexeme = {
  id: 'lex:noun:suspension' as LexemeId,
  lemma: 'suspension',
  variants: ['suspension', 'suspended note', 'sus'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'harmonic-technique',
  applicableToInstruments: ['all-harmonic'],
  affectsAspects: ['harmony', 'tension', 'resolution'],
  typicalParameters: { interval: 4, resolutionDelay: 0.5 }
};

export const NOUN_PEDAL_POINT: TechniqueLexeme = {
  id: 'lex:noun:pedal-point' as LexemeId,
  lemma: 'pedal point',
  variants: ['pedal point', 'pedal tone', 'sustained bass', 'drone'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'harmonic-technique',
  applicableToInstruments: ['bass', 'organ', 'synthesizer'],
  affectsAspects: ['harmony', 'foundation', 'continuity'],
  typicalParameters: { sustainDuration: 4.0 }
};

export const NOUN_COUNTERPOINT: TechniqueLexeme = {
  id: 'lex:noun:counterpoint' as LexemeId,
  lemma: 'counterpoint',
  variants: ['counterpoint', 'contrapuntal', 'countermelody'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'harmonic-technique',
  applicableToInstruments: ['all-melodic'],
  affectsAspects: ['melody', 'harmony', 'independence'],
  typicalParameters: { independence: 0.8, intervalConsonance: 0.7 }
};

export const NOUN_CHORD_SUBSTITUTION: TechniqueLexeme = {
  id: 'lex:noun:chord-substitution' as LexemeId,
  lemma: 'chord substitution',
  variants: ['chord substitution', 'reharmonization', 'chord replacement'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'harmonic-technique',
  applicableToInstruments: ['all-harmonic'],
  affectsAspects: ['harmony', 'color', 'sophistication'],
  typicalParameters: { complexity: 0.6, functionalPreservation: 0.7 }
};

// =============================================================================
// PRODUCTION TECHNIQUES
// =============================================================================

export const NOUN_REVERB: TechniqueLexeme = {
  id: 'lex:noun:reverb' as LexemeId,
  lemma: 'reverb',
  variants: ['reverb', 'reverberation', 'room sound', 'ambience'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['space', 'depth', 'atmosphere'],
  typicalParameters: { size: 0.5, decay: 0.6, mix: 0.3 }
};

export const NOUN_DELAY: TechniqueLexeme = {
  id: 'lex:noun:delay' as LexemeId,
  lemma: 'delay',
  variants: ['delay', 'echo', 'slapback', 'repeat'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['time', 'space', 'repetition'],
  typicalParameters: { time: 0.375, feedback: 0.4, mix: 0.25 }
};

export const NOUN_DISTORTION: TechniqueLexeme = {
  id: 'lex:noun:distortion' as LexemeId,
  lemma: 'distortion',
  variants: ['distortion', 'overdrive', 'saturation', 'drive'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['guitar', 'bass', 'synthesizer', 'vocal'],
  affectsAspects: ['timbre', 'harshness', 'intensity'],
  typicalParameters: { amount: 0.5, tone: 0.5, mix: 0.8 }
};

export const NOUN_COMPRESSION: TechniqueLexeme = {
  id: 'lex:noun:compression' as LexemeId,
  lemma: 'compression',
  variants: ['compression', 'dynamic control', 'leveling'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['dynamics', 'consistency', 'punch'],
  typicalParameters: { ratio: 4, threshold: -20, attack: 0.01, release: 0.1 }
};

export const NOUN_EQ: TechniqueLexeme = {
  id: 'lex:noun:eq' as LexemeId,
  lemma: 'eq',
  variants: ['eq', 'equalization', 'tone shaping', 'frequency balance'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['timbre', 'frequency', 'balance'],
  typicalParameters: { lowGain: 0, midGain: 0, highGain: 0 }
};

export const NOUN_PANNING: TechniqueLexeme = {
  id: 'lex:noun:panning' as LexemeId,
  lemma: 'panning',
  variants: ['panning', 'stereo placement', 'pan position'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['stereo', 'width', 'space'],
  typicalParameters: { position: 0, width: 1.0 }
};

export const NOUN_SIDECHAIN: TechniqueLexeme = {
  id: 'lex:noun:sidechain' as LexemeId,
  lemma: 'sidechain',
  variants: ['sidechain', 'sidechain compression', 'ducking', 'pumping'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['dynamics', 'interaction', 'groove'],
  typicalParameters: { amount: 0.5, attack: 0.01, release: 0.15 }
};

export const NOUN_AUTOMATION: TechniqueLexeme = {
  id: 'lex:noun:automation' as LexemeId,
  lemma: 'automation',
  variants: ['automation', 'parameter automation', 'modulation'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'production-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['dynamics', 'motion', 'evolution'],
  typicalParameters: { rate: 1.0, depth: 0.5 }
};

// =============================================================================
// COMPOSITIONAL TECHNIQUES
// =============================================================================

export const NOUN_SEQUENCE: TechniqueLexeme = {
  id: 'lex:noun:sequence' as LexemeId,
  lemma: 'sequence',
  variants: ['sequence', 'melodic sequence', 'repetition', 'pattern'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'compositional-technique',
  applicableToInstruments: ['all-melodic'],
  affectsAspects: ['melody', 'repetition', 'development'],
  typicalParameters: { transposition: 2, repetitions: 3 }
};

export const NOUN_OSTINATO: TechniqueLexeme = {
  id: 'lex:noun:ostinato' as LexemeId,
  lemma: 'ostinato',
  variants: ['ostinato', 'riff', 'repeating pattern', 'loop'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'compositional-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['repetition', 'groove', 'foundation'],
  typicalParameters: { duration: 2.0, variation: 0.2 }
};

export const NOUN_RETROGRADE: TechniqueLexeme = {
  id: 'lex:noun:retrograde' as LexemeId,
  lemma: 'retrograde',
  variants: ['retrograde', 'reverse', 'backwards', 'crab'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'compositional-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['melody', 'order', 'transformation'],
  typicalParameters: {}
};

export const NOUN_AUGMENTATION: TechniqueLexeme = {
  id: 'lex:noun:augmentation' as LexemeId,
  lemma: 'augmentation',
  variants: ['augmentation', 'rhythmic expansion', 'lengthening'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'compositional-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['rhythm', 'duration', 'time-scale'],
  typicalParameters: { factor: 2.0 }
};

export const NOUN_DIMINUTION: TechniqueLexeme = {
  id: 'lex:noun:diminution' as LexemeId,
  lemma: 'diminution',
  variants: ['diminution', 'rhythmic compression', 'shortening'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'compositional-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['rhythm', 'duration', 'time-scale'],
  typicalParameters: { factor: 0.5 }
};

export const NOUN_IMITATION: TechniqueLexeme = {
  id: 'lex:noun:imitation' as LexemeId,
  lemma: 'imitation',
  variants: ['imitation', 'canon', 'fugue', 'call and response'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  techniqueCategory: 'compositional-technique',
  applicableToInstruments: ['all'],
  affectsAspects: ['melody', 'texture', 'dialogue'],
  typicalParameters: { delay: 1.0, transposition: 0 }
};

/**
 * Complete technique vocabulary table
 */
export const TECHNIQUE_NOUNS: readonly TechniqueLexeme[] = [
  // Articulations
  NOUN_STACCATO,
  NOUN_LEGATO,
  NOUN_MARCATO,
  NOUN_TENUTO,
  NOUN_PORTAMENTO,
  NOUN_PIZZICATO,
  NOUN_TREMOLO,
  NOUN_VIBRATO,
  NOUN_FLUTTER_TONGUE,
  NOUN_SPICCATO,
  
  // Ornaments
  NOUN_TRILL,
  NOUN_MORDENT,
  NOUN_TURN,
  NOUN_GRACE_NOTE,
  NOUN_APPOGGIATURA,
  NOUN_SLIDE,
  
  // Rhythmic
  NOUN_SWING,
  NOUN_SYNCOPATION,
  NOUN_HEMIOLA,
  NOUN_POLYRHYTHM,
  NOUN_RUBATO,
  NOUN_RITARDANDO,
  NOUN_ACCELERANDO,
  NOUN_FERMATA,
  
  // Harmonic
  NOUN_ARPEGGIATION,
  NOUN_VOICING,
  NOUN_INVERSION,
  NOUN_SUSPENSION,
  NOUN_PEDAL_POINT,
  NOUN_COUNTERPOINT,
  NOUN_CHORD_SUBSTITUTION,
  
  // Production
  NOUN_REVERB,
  NOUN_DELAY,
  NOUN_DISTORTION,
  NOUN_COMPRESSION,
  NOUN_EQ,
  NOUN_PANNING,
  NOUN_SIDECHAIN,
  NOUN_AUTOMATION,
  
  // Compositional
  NOUN_SEQUENCE,
  NOUN_OSTINATO,
  NOUN_RETROGRADE,
  NOUN_AUGMENTATION,
  NOUN_DIMINUTION,
  NOUN_IMITATION,
];

/**
 * Get technique by normalized name
 */
export function getTechniqueByName(name: string): TechniqueLexeme | undefined {
  const normalized = name.toLowerCase().trim();
  return TECHNIQUE_NOUNS.find(tech =>
    tech.lemma === normalized ||
    tech.variants.some(v => v.toLowerCase() === normalized)
  );
}

/**
 * Get techniques by category
 */
export function getTechniquesByCategory(
  category: TechniqueCategory
): readonly TechniqueLexeme[] {
  return TECHNIQUE_NOUNS.filter(tech => tech.techniqueCategory === category);
}

/**
 * Get techniques applicable to an instrument
 */
export function getTechniquesForInstrument(instrument: string): readonly TechniqueLexeme[] {
  const normalized = instrument.toLowerCase();
  return TECHNIQUE_NOUNS.filter(tech =>
    tech.applicableToInstruments.includes('all') ||
    tech.applicableToInstruments.includes('all-melodic') ||
    tech.applicableToInstruments.includes('all-harmonic') ||
    tech.applicableToInstruments.some(inst => inst.toLowerCase() === normalized)
  );
}

/**
 * Get techniques that affect a specific aspect
 */
export function getTechniquesByAspect(aspect: string): readonly TechniqueLexeme[] {
  const normalized = aspect.toLowerCase();
  return TECHNIQUE_NOUNS.filter(tech =>
    tech.affectsAspects.some(asp => asp.toLowerCase() === normalized)
  );
}
