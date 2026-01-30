/**
 * GOFAI Vocabulary — Structural and Formal Descriptors (Batch 64)
 *
 * Comprehensive vocabulary for describing musical form, structure, architecture,
 * and compositional organization. Covers section types, transitions, formal
 * patterns, developmental techniques, and architectural principles.
 *
 * This batch enables users to describe and manipulate large-scale musical structure
 * in natural language.
 *
 * @module gofai/canon/structural-formal-batch64
 */

import { type Lexeme, type LexemeId, type AxisId, type OpcodeId, createLexemeId, createAxisId, createOpcodeId } from './types';

// =============================================================================
// Category 1: Section Types and Form Labels (8 entries)
// =============================================================================
// Formal section labels beyond basic intro/verse/chorus

const SECTION_FORM_LABELS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'prelude'),
    lemma: 'prelude',
    variants: ['prelude', 'prologue', 'preface'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'prelude' as const,
    },
    description: 'Opening section that introduces themes or establishes mood before main content',
    examples: ['add a prelude', 'create a prologue section', 'insert preface before verse'] as const,
  },
  {
    id: createLexemeId('noun', 'interlude'),
    lemma: 'interlude',
    variants: ['interlude', 'intermezzo', 'link'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'interlude' as const,
    },
    description: 'Transitional section between major parts',
    examples: ['add an interlude', 'insert intermezzo', 'create link section'] as const,
  },
  {
    id: createLexemeId('noun', 'coda'),
    lemma: 'coda',
    variants: ['coda', 'tail', 'tag', 'outro tag'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'coda' as const,
    },
    description: 'Concluding section after the main ending',
    examples: ['add a coda', 'extend with tail section', 'append tag ending'] as const,
  },
  {
    id: createLexemeId('noun', 'refrain'),
    lemma: 'refrain',
    variants: ['refrain', 'hook section', 'recurring part'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'refrain' as const,
    },
    description: 'Recurring melodic/lyrical phrase, distinct from full chorus',
    examples: ['emphasize the refrain', 'repeat hook section', 'strengthen recurring part'] as const,
  },
  {
    id: createLexemeId('noun', 'episode'),
    lemma: 'episode',
    variants: ['episode', 'contrasting section', 'digression'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'episode' as const,
    },
    description: 'Contrasting section in rondo or fugue form',
    examples: ['add an episode', 'insert contrasting section', 'create digression'] as const,
  },
  {
    id: createLexemeId('noun', 'development'),
    lemma: 'development',
    variants: ['development', 'development section', 'working out'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'development' as const,
    },
    description: 'Section where themes are fragmented, modulated, and transformed',
    examples: ['expand the development', 'elaborate in development section', 'extend working out'] as const,
  },
  {
    id: createLexemeId('noun', 'recapitulation'),
    lemma: 'recapitulation',
    variants: ['recapitulation', 'recap', 'reprise', 'return'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'recapitulation' as const,
    },
    description: 'Return of opening themes, often in home key',
    examples: ['begin recapitulation', 'enter recap', 'reprise main theme'] as const,
  },
  {
    id: createLexemeId('noun', 'cadenza'),
    lemma: 'cadenza',
    variants: ['cadenza', 'solo break', 'virtuoso passage'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'section_type' as const,
      value: 'cadenza' as const,
    },
    description: 'Improvisatory or virtuosic solo section',
    examples: ['insert cadenza', 'add solo break', 'create virtuoso passage'] as const,
  },
] as const;

// =============================================================================
// Category 2: Transitions and Connectives (8 entries)
// =============================================================================
// Ways to connect sections and create flow

const TRANSITION_CONNECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'segue'),
    lemma: 'segue',
    variants: ['segue', 'transition', 'flow into'] as const,
    category: 'verb' as const,
    semantics: {
      type: 'action' as const,
      opcode: createOpcodeId('segue_transition'),
      role: 'main' as const,
      actionType: 'structural' as const,
      technique: 'seamless_transition' as const,
    },
    description: 'Connect sections smoothly without pause',
    examples: ['segue into chorus', 'transition smoothly', 'flow into bridge'] as const,
  },
  {
    id: createLexemeId('noun', 'break'),
    lemma: 'break',
    variants: ['break', 'breakdown', 'drop out', 'cut'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'transition_type' as const,
      value: 'break' as const,
    },
    description: 'Sudden reduction or halt in texture/energy',
    examples: ['add a break', 'insert breakdown', 'create drop out moment'] as const,
  },
  {
    id: createLexemeId('noun', 'build'),
    lemma: 'build',
    variants: ['build', 'buildup', 'riser', 'crescendo section'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'transition_type' as const,
      value: 'build' as const,
    },
    description: 'Gradual increase in energy or intensity toward a climax',
    examples: ['create a build', 'extend buildup', 'add riser section'] as const,
  },
  {
    id: createLexemeId('noun', 'drop'),
    lemma: 'drop',
    variants: ['drop', 'the drop', 'climax', 'peak moment'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'transition_type' as const,
      value: 'drop' as const,
    },
    description: 'High-energy arrival point after buildup, common in EDM',
    examples: ['intensify the drop', 'emphasize climax', 'maximize peak moment'] as const,
  },
  {
    id: createLexemeId('noun', 'turnaround'),
    lemma: 'turnaround',
    variants: ['turnaround', 'turnback', 'pickup', 'lead-in'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'transition_type' as const,
      value: 'turnaround' as const,
    },
    description: 'Short harmonic/rhythmic pattern leading back to start',
    examples: ['add turnaround', 'insert pickup bars', 'create lead-in'] as const,
  },
  {
    id: createLexemeId('noun', 'elision'),
    lemma: 'elision',
    variants: ['elision', 'overlap', 'dovetail'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'transition_type' as const,
      value: 'elision' as const,
    },
    description: 'Overlap where end of one section becomes start of next',
    examples: ['create elision', 'overlap sections', 'dovetail transitions'] as const,
  },
  {
    id: createLexemeId('adv', 'attacca'),
    lemma: 'attacca',
    variants: ['attacca', 'no pause', 'directly into'] as const,
    category: 'adv' as const,
    semantics: {
      type: 'modifier' as const,
      modifies: 'transition' as const,
      quality: 'immediate' as const,
    },
    description: 'Proceed to next section without pause',
    examples: ['attacca into finale', 'continue without pause', 'go directly into chorus'] as const,
  },
  {
    id: createLexemeId('noun', 'caesura'),
    lemma: 'caesura',
    variants: ['caesura', 'grand pause', 'silence', 'break point'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'transition_type' as const,
      value: 'caesura' as const,
    },
    description: 'Dramatic pause or silence between sections',
    examples: ['insert caesura', 'add grand pause', 'create moment of silence'] as const,
  },
] as const;

// =============================================================================
// Category 3: Formal Patterns and Structures (8 entries)
// =============================================================================
// Named formal architectures

const FORMAL_PATTERNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'binary-form'),
    lemma: 'binary form',
    variants: ['binary form', 'AB form', 'two-part form'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'formal_pattern' as const,
      value: 'binary' as const,
    },
    description: 'Two contrasting sections (AB)',
    examples: ['structure as binary form', 'use AB form', 'arrange in two-part form'] as const,
  },
  {
    id: createLexemeId('noun', 'ternary-form'),
    lemma: 'ternary form',
    variants: ['ternary form', 'ABA form', 'three-part form', 'song form'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'formal_pattern' as const,
      value: 'ternary' as const,
    },
    description: 'Statement, contrast, return (ABA)',
    examples: ['structure as ternary form', 'use ABA form', 'arrange in song form'] as const,
  },
  {
    id: createLexemeId('noun', 'rondo-form'),
    lemma: 'rondo',
    variants: ['rondo', 'rondo form', 'ABACA form'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'formal_pattern' as const,
      value: 'rondo' as const,
    },
    description: 'Recurring refrain alternating with contrasting episodes',
    examples: ['structure as rondo', 'use rondo form', 'create ABACA pattern'] as const,
  },
  {
    id: createLexemeId('noun', 'strophic-form'),
    lemma: 'strophic',
    variants: ['strophic', 'strophic form', 'verse form', 'AAA form'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'formal_pattern' as const,
      value: 'strophic' as const,
    },
    description: 'Repeated verses with same music, different lyrics',
    examples: ['arrange strophically', 'use verse form', 'structure as AAA'] as const,
  },
  {
    id: createLexemeId('adj', 'through-composed'),
    lemma: 'through-composed',
    variants: ['through-composed', 'non-repeating', 'continuous form'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'modifier' as const,
      modifies: 'form' as const,
      quality: 'continuously_developing' as const,
    },
    description: 'Form with no repeated sections, continuously new material',
    examples: ['make it through-composed', 'create non-repeating structure', 'use continuous form'] as const,
  },
  {
    id: createLexemeId('noun', 'arch-form'),
    lemma: 'arch form',
    variants: ['arch form', 'palindrome', 'mirror form', 'ABCBA'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'formal_pattern' as const,
      value: 'arch' as const,
    },
    description: 'Symmetrical form mirrored around central section',
    examples: ['structure as arch form', 'create palindromic structure', 'use mirror form'] as const,
  },
  {
    id: createLexemeId('noun', 'sonata-form'),
    lemma: 'sonata form',
    variants: ['sonata form', 'sonata-allegro', 'first-movement form'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'formal_pattern' as const,
      value: 'sonata' as const,
    },
    description: 'Exposition, development, recapitulation structure',
    examples: ['structure in sonata form', 'use sonata-allegro', 'follow first-movement form'] as const,
  },
  {
    id: createLexemeId('noun', 'theme-and-variations'),
    lemma: 'theme and variations',
    variants: ['theme and variations', 'variation form', 'variational structure'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'formal_pattern' as const,
      value: 'variations' as const,
    },
    description: 'Statement of theme followed by elaborated versions',
    examples: ['arrange as variations', 'use variation form', 'create variational structure'] as const,
  },
] as const;

// =============================================================================
// Category 4: Developmental Techniques (8 entries)
// =============================================================================
// Ways to transform and develop musical material

const DEVELOPMENTAL_TECHNIQUES: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'sequence'),
    lemma: 'sequence',
    variants: ['sequence', 'sequential pattern', 'repeated pattern'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'development' as const,
      aspect: 'technique' as const,
      value: 'sequence' as const,
    },
    description: 'Musical pattern repeated at different pitch levels',
    examples: ['create a sequence', 'add sequential pattern', 'develop through repetition'] as const,
  },
  {
    id: createLexemeId('noun', 'fragmentation'),
    lemma: 'fragmentation',
    variants: ['fragmentation', 'fragment', 'break apart', 'motivic cells'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'action' as const,
      opcode: createOpcodeId('fragment_theme'),
      role: 'main' as const,
      actionType: 'developmental' as const,
      technique: 'fragmentation' as const,
    },
    description: 'Breaking theme into smaller motivic fragments',
    examples: ['apply fragmentation', 'fragment the theme', 'break into motivic cells'] as const,
  },
  {
    id: createLexemeId('noun', 'augmentation'),
    lemma: 'augmentation',
    variants: ['augmentation', 'stretched', 'slower version', 'broadened'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'action' as const,
      opcode: createOpcodeId('augment_rhythm'),
      role: 'main' as const,
      actionType: 'developmental' as const,
      technique: 'augmentation' as const,
    },
    description: 'Theme presented with longer note values',
    examples: ['apply augmentation', 'stretch rhythms', 'create slower version'] as const,
  },
  {
    id: createLexemeId('noun', 'diminution'),
    lemma: 'diminution',
    variants: ['diminution', 'compressed', 'faster version', 'shortened'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'action' as const,
      opcode: createOpcodeId('diminish_rhythm'),
      role: 'main' as const,
      actionType: 'developmental' as const,
      technique: 'diminution' as const,
    },
    description: 'Theme presented with shorter note values',
    examples: ['apply diminution', 'compress rhythms', 'create faster version'] as const,
  },
  {
    id: createLexemeId('noun', 'inversion'),
    lemma: 'inversion',
    variants: ['inversion', 'inverted', 'upside-down', 'mirror inversion'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'action' as const,
      opcode: createOpcodeId('invert_melody'),
      role: 'main' as const,
      actionType: 'developmental' as const,
      technique: 'melodic_inversion' as const,
    },
    description: 'Theme with intervals inverted (ascending becomes descending)',
    examples: ['create inversion', 'invert the melody', 'apply mirror inversion'] as const,
  },
  {
    id: createLexemeId('noun', 'retrograde'),
    lemma: 'retrograde',
    variants: ['retrograde', 'backwards', 'reversed', 'crab motion'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'action' as const,
      opcode: createOpcodeId('reverse_melody'),
      role: 'main' as const,
      actionType: 'developmental' as const,
      technique: 'retrograde' as const,
    },
    description: 'Theme played backwards',
    examples: ['apply retrograde', 'play backwards', 'reverse the theme'] as const,
  },
  {
    id: createLexemeId('noun', 'imitation'),
    lemma: 'imitation',
    variants: ['imitation', 'canon', 'echo', 'following voice'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'texture' as const,
      aspect: 'technique' as const,
      value: 'imitation' as const,
    },
    description: 'One voice repeats melody of another at a delay',
    examples: ['add imitation', 'create canon', 'introduce echo voices'] as const,
  },
  {
    id: createLexemeId('noun', 'ostinato'),
    lemma: 'ostinato',
    variants: ['ostinato', 'repeating pattern', 'ground bass', 'loop'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'texture' as const,
      aspect: 'technique' as const,
      value: 'ostinato' as const,
    },
    description: 'Persistently repeated musical pattern',
    examples: ['add ostinato', 'create repeating pattern', 'establish ground bass'] as const,
  },
] as const;

// =============================================================================
// Category 5: Proportions and Balance (8 entries)
// =============================================================================
// Architectural relationships and proportional structure

const PROPORTIONS_BALANCE: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'symmetrical'),
    lemma: 'symmetrical',
    variants: ['symmetrical', 'balanced', 'even', 'mirrored'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: createAxisId('formal_symmetry'),
      direction: 'increase' as const,
    },
    description: 'Balanced proportions with matching sections',
    examples: ['make it symmetrical', 'create balanced structure', 'establish even proportions'] as const,
  },
  {
    id: createLexemeId('adj', 'asymmetrical'),
    lemma: 'asymmetrical',
    variants: ['asymmetrical', 'unbalanced', 'irregular', 'uneven'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: createAxisId('formal_symmetry'),
      direction: 'decrease' as const,
    },
    description: 'Unbalanced proportions with contrasting section lengths',
    examples: ['make it asymmetrical', 'create unbalanced structure', 'use irregular proportions'] as const,
  },
  {
    id: createLexemeId('noun', 'golden-ratio'),
    lemma: 'golden ratio',
    variants: ['golden ratio', 'golden section', 'phi proportion'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'proportion' as const,
      value: 'golden_ratio' as const,
    },
    description: 'Proportions based on 1.618:1 ratio',
    examples: ['apply golden ratio', 'structure by golden section', 'use phi proportions'] as const,
  },
  {
    id: createLexemeId('adj', 'compact'),
    lemma: 'compact',
    variants: ['compact', 'tight', 'concise', 'concentrated'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: createAxisId('formal_density'),
      direction: 'increase' as const,
    },
    description: 'Dense, concentrated structure with no excess',
    examples: ['make it compact', 'create tight structure', 'condense the form'] as const,
  },
  {
    id: createLexemeId('adj', 'expansive'),
    lemma: 'expansive',
    variants: ['expansive', 'spacious', 'extended', 'broad'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: createAxisId('formal_density'),
      direction: 'decrease' as const,
    },
    description: 'Spacious structure with room to breathe',
    examples: ['make it expansive', 'create spacious form', 'extend the sections'] as const,
  },
  {
    id: createLexemeId('noun', 'climax'),
    lemma: 'climax',
    variants: ['climax', 'peak', 'high point', 'apex'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'culmination' as const,
      value: 'climax' as const,
    },
    description: 'Point of highest tension or intensity',
    examples: ['build to climax', 'reach the peak', 'intensify toward apex'] as const,
  },
  {
    id: createLexemeId('noun', 'anticlimax'),
    lemma: 'anticlimax',
    variants: ['anticlimax', 'deflation', 'release', 'letdown'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'culmination' as const,
      value: 'anticlimax' as const,
    },
    description: 'Deliberate reduction after buildup, subverting expectation',
    examples: ['create anticlimax', 'deflate after buildup', 'release tension suddenly'] as const,
  },
  {
    id: createLexemeId('noun', 'trajectory'),
    lemma: 'trajectory',
    variants: ['trajectory', 'arc', 'dramatic curve', 'narrative path'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'form' as const,
      aspect: 'overall_shape' as const,
      value: 'trajectory' as const,
    },
    description: 'Overall shape and direction of energy across the piece',
    examples: ['shape the trajectory', 'define the arc', 'establish dramatic curve'] as const,
  },
] as const;

// =============================================================================
// Exports and Summary
// =============================================================================

/**
 * All structural and formal descriptor lexemes (Batch 64).
 */
export const STRUCTURAL_FORMAL_BATCH64: readonly Lexeme[] = [
  ...SECTION_FORM_LABELS,
  ...TRANSITION_CONNECTIVES,
  ...FORMAL_PATTERNS,
  ...DEVELOPMENTAL_TECHNIQUES,
  ...PROPORTIONS_BALANCE,
] as const;

/**
 * Count of entries in Batch 64.
 */
export const BATCH_64_COUNT = STRUCTURAL_FORMAL_BATCH64.length;

/**
 * Category summary for Batch 64.
 * 
 * Axes introduced:
 * - formal_symmetry (balance and proportion)
 * - formal_density (compact vs expansive)
 * 
 * Categories covered:
 * 1. Section Types and Form Labels (8 entries)
 * 2. Transitions and Connectives (8 entries)
 * 3. Formal Patterns and Structures (8 entries)
 * 4. Developmental Techniques (8 entries)
 * 5. Proportions and Balance (8 entries)
 * 
 * Total: 40 lexemes covering comprehensive structural and formal vocabulary
 */
