/**
 * GOFAI Domain Nouns — Dynamics, Articulation, and Expression (Batch 10)
 *
 * Comprehensive vocabulary for dynamics, articulations, and expressive markings.
 * Enables natural language commands about volume, attack, sustain, and expression.
 *
 * @module gofai/canon/domain-nouns-batch10
 */

import {
  type Lexeme,
  type LexemeId,
  createLexemeId,
} from './types';

// =============================================================================
// Extended Lexeme Type for Dynamics/Articulation Nouns
// =============================================================================

/**
 * Extended lexeme for dynamics and articulation domain nouns.
 */
export interface DynamicsArticulationLexeme extends Lexeme {
  readonly dynamicsCategory:
    | 'dynamic-level'
    | 'dynamic-change'
    | 'articulation'
    | 'attack'
    | 'envelope'
    | 'expression'
    | 'tempo-marking';
  readonly affects?: 'volume' | 'timing' | 'timbre' | 'multiple';
  readonly notation?: string;
  readonly typicalRange?: string;
}

// =============================================================================
// Dynamic Levels
// =============================================================================

const DYNAMIC_PIANISSIMO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'pianissimo'),
  lemma: 'pianissimo',
  variants: ['pp', 'very soft', 'very quiet'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-level', level: 'pp' },
  description: 'Very soft dynamic level.',
  examples: ['Play it pianissimo', 'pp dynamics', 'Very soft section'],
  dynamicsCategory: 'dynamic-level',
  affects: 'volume',
  notation: 'pp',
  typicalRange: 'MIDI velocity 20-40',
};

const DYNAMIC_PIANO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'piano'),
  lemma: 'piano',
  variants: ['p', 'soft', 'quiet', 'gentle'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-level', level: 'p' },
  description: 'Soft dynamic level.',
  examples: ['Play it piano', 'p dynamics', 'Soft and gentle'],
  dynamicsCategory: 'dynamic-level',
  affects: 'volume',
  notation: 'p',
  typicalRange: 'MIDI velocity 40-60',
};

const DYNAMIC_MEZZO_PIANO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'mezzo-piano'),
  lemma: 'mezzo piano',
  variants: ['mp', 'moderately soft', 'medium soft'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-level', level: 'mp' },
  description: 'Moderately soft dynamic level.',
  examples: ['mp section', 'Moderately soft', 'Medium quiet'],
  dynamicsCategory: 'dynamic-level',
  affects: 'volume',
  notation: 'mp',
  typicalRange: 'MIDI velocity 55-75',
};

const DYNAMIC_MEZZO_FORTE: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'mezzo-forte'),
  lemma: 'mezzo forte',
  variants: ['mf', 'moderately loud', 'medium loud'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-level', level: 'mf' },
  description: 'Moderately loud dynamic level.',
  examples: ['mf dynamics', 'Moderately loud', 'Medium strong'],
  dynamicsCategory: 'dynamic-level',
  affects: 'volume',
  notation: 'mf',
  typicalRange: 'MIDI velocity 75-95',
};

const DYNAMIC_FORTE: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'forte'),
  lemma: 'forte',
  variants: ['f', 'loud', 'strong'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-level', level: 'f' },
  description: 'Loud dynamic level.',
  examples: ['Play it forte', 'f dynamics', 'Loud and strong'],
  dynamicsCategory: 'dynamic-level',
  affects: 'volume',
  notation: 'f',
  typicalRange: 'MIDI velocity 95-115',
};

const DYNAMIC_FORTISSIMO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'fortissimo'),
  lemma: 'fortissimo',
  variants: ['ff', 'very loud', 'very strong'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-level', level: 'ff' },
  description: 'Very loud dynamic level.',
  examples: ['Play it fortissimo', 'ff dynamics', 'Very loud climax'],
  dynamicsCategory: 'dynamic-level',
  affects: 'volume',
  notation: 'ff',
  typicalRange: 'MIDI velocity 115-127',
};

const DYNAMIC_FORTISSISSIMO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'fortississimo'),
  lemma: 'fortississimo',
  variants: ['fff', 'extremely loud', 'as loud as possible'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-level', level: 'fff' },
  description: 'Extremely loud dynamic level.',
  examples: ['fff peak', 'Maximum volume', 'As loud as possible'],
  dynamicsCategory: 'dynamic-level',
  affects: 'volume',
  notation: 'fff',
  typicalRange: 'MIDI velocity 127 (maximum)',
};

// =============================================================================
// Dynamic Changes
// =============================================================================

const CRESCENDO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'crescendo'),
  lemma: 'crescendo',
  variants: ['cresc', 'getting louder', 'building', 'swell'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-change', direction: 'increase' },
  description: 'Gradually getting louder.',
  examples: ['Add a crescendo', 'Build to forte', 'Gradual swell'],
  dynamicsCategory: 'dynamic-change',
  affects: 'volume',
  notation: '< or cresc.',
};

const DECRESCENDO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'decrescendo'),
  lemma: 'decrescendo',
  variants: ['decresc', 'diminuendo', 'dim', 'getting softer', 'fading'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-change', direction: 'decrease' },
  description: 'Gradually getting softer.',
  examples: ['Add a decrescendo', 'Fade to piano', 'Diminuendo ending'],
  dynamicsCategory: 'dynamic-change',
  affects: 'volume',
  notation: '> or dim.',
};

const SFORZANDO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'sforzando'),
  lemma: 'sforzando',
  variants: ['sfz', 'sf', 'accent', 'sudden emphasis'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-change', subType: 'sudden-accent' },
  description: 'Sudden strong accent on a note or chord.',
  examples: ['Sforzando accent', 'Sudden emphasis', 'Add sfz markings'],
  dynamicsCategory: 'dynamic-change',
  affects: 'volume',
  notation: 'sfz or sf',
};

const FORTE_PIANO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'forte-piano'),
  lemma: 'forte-piano',
  variants: ['fp', 'loud then soft'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'dynamic-change', subType: 'loud-then-soft' },
  description: 'Loud attack immediately followed by soft.',
  examples: ['fp articulation', 'Forte-piano notes', 'Accent then soft'],
  dynamicsCategory: 'dynamic-change',
  affects: 'volume',
  notation: 'fp',
};

const SUBITO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'subito'),
  lemma: 'subito',
  variants: ['suddenly', 'immediately', 'abrupt change'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'dynamic-change', quality: 'sudden' },
  description: 'Suddenly, immediately (used with dynamic markings).',
  examples: ['Subito piano', 'Suddenly loud', 'Abrupt dynamic shift'],
  dynamicsCategory: 'dynamic-change',
  affects: 'volume',
  notation: 'sub.',
};

// =============================================================================
// Articulations
// =============================================================================

const STACCATO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'staccato'),
  lemma: 'staccato',
  variants: ['stacc', 'short', 'detached', 'choppy'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'staccato' },
  description: 'Short, detached notes with space between.',
  examples: ['Play it staccato', 'Short choppy notes', 'Detached articulation'],
  dynamicsCategory: 'articulation',
  affects: 'timing',
  notation: 'dot above/below note',
};

const STACCATISSIMO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'staccatissimo'),
  lemma: 'staccatissimo',
  variants: ['very staccato', 'extremely short', 'very detached'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'staccatissimo' },
  description: 'Extremely short, sharply detached notes.',
  examples: ['Staccatissimo articulation', 'Very short notes', 'Sharp detachment'],
  dynamicsCategory: 'articulation',
  affects: 'timing',
  notation: 'wedge above/below note',
};

const LEGATO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'legato'),
  lemma: 'legato',
  variants: ['smooth', 'connected', 'flowing'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'legato' },
  description: 'Smooth, connected notes with no space between.',
  examples: ['Play it legato', 'Smooth and connected', 'Flowing line'],
  dynamicsCategory: 'articulation',
  affects: 'timing',
  notation: 'slur or "legato"',
};

const TENUTO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'tenuto'),
  lemma: 'tenuto',
  variants: ['ten', 'held', 'sustained'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'tenuto' },
  description: 'Hold the note for its full value, slightly emphasized.',
  examples: ['Tenuto articulation', 'Hold each note', 'Sustained emphasis'],
  dynamicsCategory: 'articulation',
  affects: 'timing',
  notation: 'horizontal line above/below note',
};

const MARCATO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'marcato'),
  lemma: 'marcato',
  variants: ['marc', 'marked', 'hammered', 'heavy accent'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'marcato' },
  description: 'Strongly accented and marked, hammered attack.',
  examples: ['Marcato accents', 'Heavy hammered notes', 'Strongly marked'],
  dynamicsCategory: 'articulation',
  affects: 'multiple',
  notation: 'inverted wedge above/below note',
};

const PORTATO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'portato'),
  lemma: 'portato',
  variants: ['mezzo-staccato', 'half-detached', 'slightly separated'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'portato' },
  description: 'Between legato and staccato, slightly separated but connected.',
  examples: ['Portato articulation', 'Half-detached notes', 'Mezzo-staccato style'],
  dynamicsCategory: 'articulation',
  affects: 'timing',
  notation: 'dot and slur',
};

const PORTAMENTO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'portamento'),
  lemma: 'portamento',
  variants: ['port', 'glide', 'slide between notes'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'portamento' },
  description: 'Continuous slide from one pitch to another.',
  examples: ['Portamento slide', 'Glide between notes', 'Smooth pitch bend'],
  dynamicsCategory: 'articulation',
  affects: 'timbre',
  notation: 'curved line between notes',
};

const ACCENT: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'accent'),
  lemma: 'accent',
  variants: ['accents', 'accented', 'emphasis', 'stressed'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'articulation', style: 'accent' },
  description: 'Note played with emphasis, louder than surrounding notes.',
  examples: ['Add accents', 'Accented notes', 'Emphasize the downbeats'],
  dynamicsCategory: 'articulation',
  affects: 'volume',
  notation: '> above/below note',
};

// =============================================================================
// Attack and Envelope
// =============================================================================

const ATTACK: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'attack'),
  lemma: 'attack',
  variants: ['onset', 'initial transient', 'note start'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'timbre', aspect: 'attack' },
  description: 'The beginning or onset of a sound, how quickly it reaches full volume.',
  examples: ['Sharp attack', 'Slow attack', 'Soft attack'],
  dynamicsCategory: 'attack',
  affects: 'timbre',
  typicalRange: '0-1000ms',
};

const DECAY: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'decay'),
  lemma: 'decay',
  variants: ['initial decay', 'decay time'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'timbre', aspect: 'decay' },
  description: 'Time for sound to drop from peak to sustain level after attack.',
  examples: ['Long decay', 'Short decay', 'Fast decay time'],
  dynamicsCategory: 'envelope',
  affects: 'timbre',
  typicalRange: '0-2000ms',
};

const SUSTAIN: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'sustain'),
  lemma: 'sustain',
  variants: ['sustained level', 'hold level'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'timbre', aspect: 'sustain' },
  description: 'The level maintained after decay while note is held.',
  examples: ['Long sustain', 'High sustain level', 'Sustaining notes'],
  dynamicsCategory: 'envelope',
  affects: 'timbre',
  typicalRange: '0-100%',
};

const RELEASE: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'release'),
  lemma: 'release',
  variants: ['release time', 'tail', 'fade-out'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'timbre', aspect: 'release' },
  description: 'Time for sound to fade after note is released.',
  examples: ['Long release', 'Short release', 'Quick release time'],
  dynamicsCategory: 'envelope',
  affects: 'timbre',
  typicalRange: '0-5000ms',
};

const ENVELOPE: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'envelope'),
  lemma: 'envelope',
  variants: ['ADSR', 'amplitude envelope', 'volume envelope'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'timbre', aspect: 'envelope' },
  description: 'The overall shape of a sound\'s amplitude over time (Attack, Decay, Sustain, Release).',
  examples: ['Shape the envelope', 'ADSR settings', 'Envelope curve'],
  dynamicsCategory: 'envelope',
  affects: 'timbre',
};

const TRANSIENT: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'transient'),
  lemma: 'transient',
  variants: ['transients', 'initial spike', 'attack transient'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'timbre', aspect: 'transient' },
  description: 'The very beginning of a sound, the initial spike or impact.',
  examples: ['Sharp transients', 'Preserve the transients', 'Transient detail'],
  dynamicsCategory: 'attack',
  affects: 'timbre',
  typicalRange: '0-50ms',
};

// =============================================================================
// Expression and Tempo Markings
// =============================================================================

const ESPRESSIVO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'espressivo'),
  lemma: 'espressivo',
  variants: ['espr', 'expressive', 'expressively', 'with expression'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'expressive' },
  description: 'Expressively, with feeling and nuance.',
  examples: ['Play espressivo', 'Expressively performed', 'With deep expression'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'espr.',
};

const DOLCE: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'dolce'),
  lemma: 'dolce',
  variants: ['sweetly', 'gently', 'tenderly'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'sweet' },
  description: 'Sweetly, gently, tenderly.',
  examples: ['Play dolce', 'Sweet melody', 'Gentle expression'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'dolce',
};

const AGITATO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'agitato'),
  lemma: 'agitato',
  variants: ['agitated', 'restless', 'excited'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'agitated' },
  description: 'Agitated, restless, excited.',
  examples: ['Play agitato', 'Restless energy', 'Agitated section'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'agitato',
};

const CANTABILE: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'cantabile'),
  lemma: 'cantabile',
  variants: ['singing', 'lyrical', 'in a singing style'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'singing' },
  description: 'In a singing style, lyrical and flowing.',
  examples: ['Play cantabile', 'Singing melody', 'Lyrical line'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'cantabile',
};

const APPASSIONATO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'appassionato'),
  lemma: 'appassionato',
  variants: ['passionate', 'passionately', 'with passion'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'passionate' },
  description: 'Passionately, with deep feeling.',
  examples: ['Play appassionato', 'Passionate performance', 'Deep emotion'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'appassionato',
};

const MAESTOSO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'maestoso'),
  lemma: 'maestoso',
  variants: ['majestic', 'majestically', 'stately'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'majestic' },
  description: 'Majestically, with grandeur and dignity.',
  examples: ['Play maestoso', 'Majestic opening', 'Stately character'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'maestoso',
};

const RISOLUTO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'risoluto'),
  lemma: 'risoluto',
  variants: ['resolute', 'resolutely', 'with determination'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'resolute' },
  description: 'Resolutely, with determination and boldness.',
  examples: ['Play risoluto', 'Determined character', 'Bold and resolute'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'risoluto',
};

const GIOCOSO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'giocoso'),
  lemma: 'giocoso',
  variants: ['playful', 'playfully', 'jovially'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'playful' },
  description: 'Playfully, jovially, with humor.',
  examples: ['Play giocoso', 'Playful mood', 'Jovial character'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'giocoso',
};

const MISTERIOSO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'misterioso'),
  lemma: 'misterioso',
  variants: ['mysterious', 'mysteriously', 'enigmatic'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'mysterious' },
  description: 'Mysteriously, enigmatically.',
  examples: ['Play misterioso', 'Mysterious atmosphere', 'Enigmatic quality'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'misterioso',
};

const BRILLANTE: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'brillante'),
  lemma: 'brillante',
  variants: ['brilliant', 'brilliantly', 'sparkling'],
  category: 'noun',
  semantics: { type: 'modifier', modifies: 'performance', quality: 'brilliant' },
  description: 'Brilliantly, with sparkle and virtuosity.',
  examples: ['Play brillante', 'Brilliant passage', 'Sparkling technique'],
  dynamicsCategory: 'expression',
  affects: 'multiple',
  notation: 'brillante',
};

// =============================================================================
// Tempo-related expressions
// =============================================================================

const ACCELERANDO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'accelerando'),
  lemma: 'accelerando',
  variants: ['accel', 'speeding up', 'getting faster'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'tempo-change', direction: 'faster' },
  description: 'Gradually speeding up.',
  examples: ['Add an accelerando', 'Speed up gradually', 'Getting faster'],
  dynamicsCategory: 'tempo-marking',
  affects: 'timing',
  notation: 'accel.',
};

const RITARDANDO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'ritardando'),
  lemma: 'ritardando',
  variants: ['ritard', 'rit', 'rallentando', 'rall', 'slowing down'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'tempo-change', direction: 'slower' },
  description: 'Gradually slowing down.',
  examples: ['Add a ritardando', 'Slow down gradually', 'Rallentando ending'],
  dynamicsCategory: 'tempo-marking',
  affects: 'timing',
  notation: 'rit. or rall.',
};

const A_TEMPO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'a-tempo'),
  lemma: 'a tempo',
  variants: ['in tempo', 'tempo primo', 'back to tempo'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'tempo-marking', instruction: 'return-to-tempo' },
  description: 'Return to the original tempo.',
  examples: ['Return a tempo', 'Back to original speed', 'Resume tempo'],
  dynamicsCategory: 'tempo-marking',
  affects: 'timing',
  notation: 'a tempo',
};

const RUBATO: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'rubato'),
  lemma: 'rubato',
  variants: ['tempo rubato', 'flexible tempo', 'stolen time'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'tempo-marking', instruction: 'flexible' },
  description: 'Flexible, expressive tempo with rhythmic freedom.',
  examples: ['Play with rubato', 'Tempo rubato', 'Expressive timing'],
  dynamicsCategory: 'tempo-marking',
  affects: 'timing',
  notation: 'rubato',
};

const FERMATA: DynamicsArticulationLexeme = {
  id: createLexemeId('noun', 'fermata'),
  lemma: 'fermata',
  variants: ['hold', 'pause', 'bird\'s eye'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'tempo-marking', instruction: 'hold' },
  description: 'Hold the note or rest longer than its written value.',
  examples: ['Add a fermata', 'Hold the note', 'Pause on the fermata'],
  dynamicsCategory: 'tempo-marking',
  affects: 'timing',
  notation: '𝄐 (fermata symbol)',
};

// Export all lexemes
export const DYNAMICS_ARTICULATION_LEXEMES: readonly DynamicsArticulationLexeme[] = [
  // Dynamic levels (7)
  DYNAMIC_PIANISSIMO, DYNAMIC_PIANO, DYNAMIC_MEZZO_PIANO, DYNAMIC_MEZZO_FORTE,
  DYNAMIC_FORTE, DYNAMIC_FORTISSIMO, DYNAMIC_FORTISSISSIMO,
  
  // Dynamic changes (5)
  CRESCENDO, DECRESCENDO, SFORZANDO, FORTE_PIANO, SUBITO,
  
  // Articulations (8)
  STACCATO, STACCATISSIMO, LEGATO, TENUTO, MARCATO, PORTATO, PORTAMENTO, ACCENT,
  
  // Attack and envelope (6)
  ATTACK, DECAY, SUSTAIN, RELEASE, ENVELOPE, TRANSIENT,
  
  // Expression markings (10)
  ESPRESSIVO, DOLCE, AGITATO, CANTABILE, APPASSIONATO, MAESTOSO,
  RISOLUTO, GIOCOSO, MISTERIOSO, BRILLANTE,
  
  // Tempo markings (5)
  ACCELERANDO, RITARDANDO, A_TEMPO, RUBATO, FERMATA,
] as const;

// Helper functions
export function getDynamicLevelByName(name: string): DynamicsArticulationLexeme | undefined {
  return DYNAMICS_ARTICULATION_LEXEMES.find(
    lex => lex.dynamicsCategory === 'dynamic-level' &&
           (lex.lemma.toLowerCase() === name.toLowerCase() ||
            lex.variants.some(v => v.toLowerCase() === name.toLowerCase()))
  );
}

export function getArticulationByName(name: string): DynamicsArticulationLexeme | undefined {
  return DYNAMICS_ARTICULATION_LEXEMES.find(
    lex => lex.dynamicsCategory === 'articulation' &&
           (lex.lemma.toLowerCase() === name.toLowerCase() ||
            lex.variants.some(v => v.toLowerCase() === name.toLowerCase()))
  );
}

export function getExpressionMarkings(): readonly DynamicsArticulationLexeme[] {
  return DYNAMICS_ARTICULATION_LEXEMES.filter(lex => lex.dynamicsCategory === 'expression');
}

export function getTempoMarkings(): readonly DynamicsArticulationLexeme[] {
  return DYNAMICS_ARTICULATION_LEXEMES.filter(lex => lex.dynamicsCategory === 'tempo-marking');
}

export function getEnvelopeComponents(): readonly DynamicsArticulationLexeme[] {
  return DYNAMICS_ARTICULATION_LEXEMES.filter(
    lex => lex.dynamicsCategory === 'envelope' || lex.dynamicsCategory === 'attack'
  );
}

/**
 * Vocabulary summary statistics.
 */
export const DYNAMICS_ARTICULATION_STATS = {
  totalLexemes: DYNAMICS_ARTICULATION_LEXEMES.length,
  dynamicLevels: 7,
  dynamicChanges: 5,
  articulations: 8,
  envelopeComponents: 6,
  expressionMarkings: 10,
  tempoMarkings: 5,
} as const;
