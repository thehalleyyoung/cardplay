/**
 * GOFAI Canon — Domain Adjectives Batch 4: Texture, Spatial, and Complexity
 *
 * This module continues the comprehensive enumeration of natural language terms
 * musicians use to describe music. This batch focuses on:
 * - Textural descriptions (thick, thin, dense, sparse, layered, etc.)
 * - Spatial descriptions (wide, narrow, deep, close, distant, etc.)
 * - Complexity descriptors (simple, complex, busy, minimal, intricate, etc.)
 *
 * Part of the extensive natural language coverage requirement from gofai_goalB.md
 * Phase 1 (vocabulary enumeration). Each adjective maps to perceptual axes and
 * affects specific musical dimensions.
 *
 * @module gofai/canon/adjectives-texture-spatial-complexity
 */

import type { LexemeId, AxisId } from './types';
import { createLexemeId, createAxisId } from './types';

/**
 * Adjective lexeme for musical description.
 */
export interface AdjectiveLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'adjective';
  readonly semantics: {
    readonly axes: readonly AxisId[];
    readonly direction: 'increase' | 'decrease' | 'neutral';
    readonly intensity: 'subtle' | 'moderate' | 'strong';
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly opposites?: readonly string[];
  readonly synonyms?: readonly string[];
}

// =============================================================================
// Textural Adjectives (Density, Layering, Thickness)
// =============================================================================

export const TEXTURAL_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: createLexemeId('adj', 'thick'),
    lemma: 'thick',
    variants: ['thick', 'thicker', 'thickest', 'heavy', 'dense', 'packed'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('density'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['texture', 'arrangement', 'voicing'],
    },
    description: 'Dense texture with many simultaneous elements',
    examples: ['make it thicker', 'add thick layers', 'thicker texture in the chorus'],
    opposites: ['thin', 'sparse', 'minimal'],
    synonyms: ['dense', 'heavy', 'full', 'rich'],
  },
  {
    id: createLexemeId('adj', 'thin'),
    lemma: 'thin',
    variants: ['thin', 'thinner', 'thinnest', 'sparse', 'light'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('density'), createAxisId('intimacy')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['texture', 'arrangement', 'voicing'],
    },
    description: 'Sparse texture with few simultaneous elements',
    examples: ['thin it out', 'thinner texture', 'more thin and intimate'],
    opposites: ['thick', 'dense', 'heavy'],
    synonyms: ['sparse', 'light', 'minimal', 'stripped'],
  },
  {
    id: createLexemeId('adj', 'layered'),
    lemma: 'layered',
    variants: ['layered', 'more layered', 'multi-layered', 'stacked'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('sophistication')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['arrangement', 'texture'],
    },
    description: 'Multiple distinct layers in the arrangement',
    examples: ['more layered', 'heavily layered production', 'add layered vocals'],
    opposites: ['minimal', 'simple'],
    synonyms: ['stacked', 'multi-tracked', 'overdubbed'],
  },
  {
    id: createLexemeId('adj', 'dense'),
    lemma: 'dense',
    variants: ['dense', 'denser', 'densest', 'packed', 'crowded'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('density'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['texture', 'arrangement', 'rhythm'],
    },
    description: 'High density of events and elements',
    examples: ['make it denser', 'dense rhythm section', 'pack it more densely'],
    opposites: ['sparse', 'thin', 'spacious'],
    synonyms: ['thick', 'packed', 'crowded', 'busy'],
  },
  {
    id: createLexemeId('adj', 'sparse'),
    lemma: 'sparse',
    variants: ['sparse', 'sparser', 'sparsest', 'minimal', 'bare'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('intimacy')],
      direction: 'decrease',
      intensity: 'strong',
      affects: ['texture', 'arrangement', 'rhythm'],
    },
    description: 'Very low density with lots of space',
    examples: ['make it more sparse', 'sparse arrangement', 'keep it sparse and open'],
    opposites: ['dense', 'thick', 'busy'],
    synonyms: ['minimal', 'bare', 'stripped', 'thin'],
  },
  {
    id: createLexemeId('adj', 'busy'),
    lemma: 'busy',
    variants: ['busy', 'busier', 'busiest', 'active', 'lively'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['rhythm', 'melody', 'arrangement'],
    },
    description: 'High activity level with lots of motion',
    examples: ['too busy', 'make it busier', 'less busy in the verse'],
    opposites: ['calm', 'sparse', 'minimal'],
    synonyms: ['active', 'lively', 'hectic', 'complex'],
  },
  {
    id: createLexemeId('adj', 'calm'),
    lemma: 'calm',
    variants: ['calm', 'calmer', 'calmest', 'peaceful', 'serene'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('energy'), createAxisId('mood')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['rhythm', 'arrangement', 'dynamics'],
    },
    description: 'Low activity level, peaceful quality',
    examples: ['make it calmer', 'calm down the drums', 'more calm and spacious'],
    opposites: ['busy', 'energetic', 'hectic'],
    synonyms: ['peaceful', 'serene', 'tranquil', 'still'],
  },
  {
    id: createLexemeId('adj', 'complex'),
    lemma: 'complex',
    variants: ['complex', 'more complex', 'most complex', 'intricate', 'sophisticated'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('busyness')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['harmony', 'rhythm', 'arrangement'],
    },
    description: 'High degree of structural or harmonic complexity',
    examples: ['more complex', 'complex harmony', 'add complex rhythms'],
    opposites: ['simple', 'basic', 'minimal'],
    synonyms: ['intricate', 'sophisticated', 'elaborate', 'detailed'],
  },
  {
    id: createLexemeId('adj', 'simple'),
    lemma: 'simple',
    variants: ['simple', 'simpler', 'simplest', 'basic', 'straightforward'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('busyness')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['harmony', 'rhythm', 'arrangement'],
    },
    description: 'Low complexity, easy to follow',
    examples: ['make it simpler', 'simplify the harmony', 'keep it simple'],
    opposites: ['complex', 'intricate', 'sophisticated'],
    synonyms: ['basic', 'straightforward', 'minimal', 'plain'],
  },
  {
    id: createLexemeId('adj', 'intricate'),
    lemma: 'intricate',
    variants: ['intricate', 'more intricate', 'most intricate', 'detailed', 'elaborate'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('busyness')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['melody', 'rhythm', 'harmony', 'arrangement'],
    },
    description: 'Highly detailed with many small elements',
    examples: ['more intricate', 'intricate melody', 'add intricate details'],
    opposites: ['simple', 'basic', 'plain'],
    synonyms: ['complex', 'detailed', 'elaborate', 'ornate'],
  },

  // Additional textural terms
  {
    id: createLexemeId('adj', 'full'),
    lemma: 'full',
    variants: ['full', 'fuller', 'fullest', 'rich', 'complete'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('energy'), createAxisId('lift')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['texture', 'arrangement', 'production'],
    },
    description: 'Complete, rich texture occupying the sonic space',
    examples: ['make it fuller', 'full sound', 'fuller production'],
    opposites: ['empty', 'hollow', 'thin'],
    synonyms: ['rich', 'complete', 'thick', 'substantial'],
  },
  {
    id: createLexemeId('adj', 'empty'),
    lemma: 'empty',
    variants: ['empty', 'emptier', 'emptiest', 'hollow', 'vacant'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('intimacy')],
      direction: 'decrease',
      intensity: 'strong',
      affects: ['texture', 'arrangement'],
    },
    description: 'Lacking elements, hollow quality',
    examples: ['feels too empty', 'more empty space', 'empty in the middle'],
    opposites: ['full', 'thick', 'rich'],
    synonyms: ['hollow', 'vacant', 'bare', 'void'],
  },
  {
    id: createLexemeId('adj', 'lush'),
    lemma: 'lush',
    variants: ['lush', 'more lush', 'lushest', 'luxuriant', 'sumptuous'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('harmonic_richness'), createAxisId('busyness')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['harmony', 'texture', 'production'],
    },
    description: 'Rich, abundant harmonic texture',
    examples: ['lush harmony', 'make it more lush', 'lush string arrangement'],
    opposites: ['sparse', 'thin', 'bare'],
    synonyms: ['rich', 'sumptuous', 'luxuriant', 'opulent'],
  },
  {
    id: createLexemeId('adj', 'stripped'),
    lemma: 'stripped',
    variants: ['stripped', 'stripped-down', 'stripped-back', 'bare', 'naked'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness'), createAxisId('intimacy')],
      direction: 'decrease',
      intensity: 'strong',
      affects: ['arrangement', 'production'],
    },
    description: 'Reduced to essential elements only',
    examples: ['stripped-down version', 'strip it back', 'more stripped'],
    opposites: ['lush', 'full', 'layered'],
    synonyms: ['bare', 'minimal', 'naked', 'raw'],
  },
  {
    id: createLexemeId('adj', 'cluttered'),
    lemma: 'cluttered',
    variants: ['cluttered', 'more cluttered', 'most cluttered', 'messy', 'crowded'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('busyness')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['arrangement', 'texture'],
    },
    description: 'Too many elements competing for space (usually negative)',
    examples: ['sounds cluttered', 'less cluttered', 'declutter the arrangement'],
    opposites: ['clean', 'clear', 'sparse'],
    synonyms: ['messy', 'crowded', 'confused', 'muddy'],
  },
  {
    id: createLexemeId('adj', 'clean'),
    lemma: 'clean',
    variants: ['clean', 'cleaner', 'cleanest', 'clear', 'crisp'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('clarity'), createAxisId('tightness')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'mix', 'arrangement'],
    },
    description: 'Clear, uncluttered, well-separated elements',
    examples: ['clean mix', 'make it cleaner', 'clean production'],
    opposites: ['cluttered', 'muddy', 'messy'],
    synonyms: ['clear', 'crisp', 'pristine', 'polished'],
  },
];

// =============================================================================
// Spatial Adjectives (Width, Depth, Stereo Field)
// =============================================================================

export const SPATIAL_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: createLexemeId('adj', 'wide'),
    lemma: 'wide',
    variants: ['wide', 'wider', 'widest', 'broad', 'expansive'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('width'), createAxisId('space')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['stereo', 'production', 'space'],
    },
    description: 'Broad stereo image spreading across the field',
    examples: ['make it wider', 'wide stereo', 'widen the chorus'],
    opposites: ['narrow', 'mono', 'centered'],
    synonyms: ['broad', 'expansive', 'spread', 'spacious'],
  },
  {
    id: createLexemeId('adj', 'narrow'),
    lemma: 'narrow',
    variants: ['narrow', 'narrower', 'narrowest', 'tight', 'focused'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('width'), createAxisId('intimacy')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['stereo', 'production', 'space'],
    },
    description: 'Narrow stereo image, more centered',
    examples: ['make it narrower', 'narrow stereo field', 'tighten the width'],
    opposites: ['wide', 'broad', 'expansive'],
    synonyms: ['tight', 'focused', 'centered', 'concentrated'],
  },
  {
    id: createLexemeId('adj', 'spacious'),
    lemma: 'spacious',
    variants: ['spacious', 'more spacious', 'most spacious', 'open', 'airy'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('space'), createAxisId('width')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['reverb', 'stereo', 'arrangement'],
    },
    description: 'Sense of space and air, not claustrophobic',
    examples: ['more spacious', 'spacious reverb', 'give it space'],
    opposites: ['cramped', 'tight', 'dry'],
    synonyms: ['open', 'airy', 'roomy', 'expansive'],
  },
  {
    id: createLexemeId('adj', 'cramped'),
    lemma: 'cramped',
    variants: ['cramped', 'more cramped', 'most cramped', 'tight', 'confined'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('space'), createAxisId('intimacy')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['reverb', 'stereo', 'arrangement'],
    },
    description: 'Lacking space, claustrophobic feeling',
    examples: ['feels cramped', 'less cramped', 'too tight'],
    opposites: ['spacious', 'open', 'airy'],
    synonyms: ['tight', 'confined', 'claustrophobic', 'compressed'],
  },
  {
    id: createLexemeId('adj', 'deep'),
    lemma: 'deep',
    variants: ['deep', 'deeper', 'deepest', 'dimensional', 'three-dimensional'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('depth'), createAxisId('space')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['reverb', 'delay', 'production'],
    },
    description: 'Sense of depth and front-to-back dimension',
    examples: ['add more depth', 'deeper reverb', 'three-dimensional sound'],
    opposites: ['flat', 'shallow', 'two-dimensional'],
    synonyms: ['dimensional', 'layered', 'three-dimensional'],
  },
  {
    id: createLexemeId('adj', 'flat'),
    lemma: 'flat',
    variants: ['flat', 'flatter', 'flattest', 'one-dimensional', 'shallow'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('depth'), createAxisId('space')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['reverb', 'production'],
    },
    description: 'Lacking depth, two-dimensional',
    examples: ['sounds flat', 'less flat', 'too one-dimensional'],
    opposites: ['deep', 'dimensional', 'three-dimensional'],
    synonyms: ['one-dimensional', 'shallow', 'lifeless'],
  },
  {
    id: createLexemeId('adj', 'close'),
    lemma: 'close',
    variants: ['close', 'closer', 'closest', 'intimate', 'near'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('intimacy'), createAxisId('depth')],
      direction: 'neutral',
      intensity: 'moderate',
      affects: ['production', 'reverb'],
    },
    description: 'Sounds close to the listener, intimate',
    examples: ['bring it closer', 'close mic sound', 'more intimate and close'],
    opposites: ['distant', 'far', 'remote'],
    synonyms: ['intimate', 'near', 'immediate', 'present'],
  },
  {
    id: createLexemeId('adj', 'distant'),
    lemma: 'distant',
    variants: ['distant', 'more distant', 'most distant', 'far', 'remote'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('depth'), createAxisId('space')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['reverb', 'production'],
    },
    description: 'Sounds far away from the listener',
    examples: ['make it more distant', 'distant reverb', 'push it back'],
    opposites: ['close', 'intimate', 'present'],
    synonyms: ['far', 'remote', 'receding', 'background'],
  },
  {
    id: createLexemeId('adj', 'centered'),
    lemma: 'centered',
    variants: ['centered', 'more centered', 'most centered', 'middle', 'mono'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('width')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['stereo', 'panning'],
    },
    description: 'Positioned in the center of the stereo field',
    examples: ['center it', 'more centered', 'keep it centered'],
    opposites: ['wide', 'spread', 'panned'],
    synonyms: ['middle', 'central', 'mono', 'focused'],
  },
  {
    id: createLexemeId('adj', 'surrounding'),
    lemma: 'surrounding',
    variants: ['surrounding', 'enveloping', 'immersive', 'encompassing'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('width'), createAxisId('space'), createAxisId('depth')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['stereo', 'reverb', 'production'],
    },
    description: 'Surrounds the listener on all sides',
    examples: ['surrounding sound', 'make it enveloping', 'immersive reverb'],
    opposites: ['focused', 'narrow', 'mono'],
    synonyms: ['enveloping', 'immersive', 'encompassing', 'wraparound'],
  },
  {
    id: createLexemeId('adj', 'high'),
    lemma: 'high',
    variants: ['high', 'higher', 'highest', 'tall', 'elevated'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('brightness'), createAxisId('lift')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['register', 'eq', 'voicing'],
    },
    description: 'High in pitch register or frequency range',
    examples: ['make it higher', 'high register', 'lift it up'],
    opposites: ['low', 'deep', 'bass-heavy'],
    synonyms: ['tall', 'elevated', 'upper', 'treble'],
  },
  {
    id: createLexemeId('adj', 'low'),
    lemma: 'low',
    variants: ['low', 'lower', 'lowest', 'deep', 'bottom'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('brightness'), createAxisId('lift')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['register', 'eq', 'voicing'],
    },
    description: 'Low in pitch register or frequency range',
    examples: ['make it lower', 'low register', 'bring it down'],
    opposites: ['high', 'bright', 'treble'],
    synonyms: ['deep', 'bottom', 'bass', 'sub'],
  },
];

// =============================================================================
// Complexity and Detail Adjectives
// =============================================================================

export const COMPLEXITY_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: createLexemeId('adj', 'detailed'),
    lemma: 'detailed',
    variants: ['detailed', 'more detailed', 'most detailed', 'fine', 'precise'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('clarity')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'arrangement', 'mixing'],
    },
    description: 'High level of fine detail and precision',
    examples: ['more detailed', 'detailed production', 'add fine details'],
    opposites: ['rough', 'basic', 'crude'],
    synonyms: ['fine', 'precise', 'meticulous', 'refined'],
  },
  {
    id: createLexemeId('adj', 'rough'),
    lemma: 'rough',
    variants: ['rough', 'rougher', 'roughest', 'coarse', 'raw'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('grit')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['production', 'timbre'],
    },
    description: 'Lacking refinement, coarse texture',
    examples: ['make it rougher', 'rough production', 'more raw and rough'],
    opposites: ['smooth', 'polished', 'refined'],
    synonyms: ['coarse', 'raw', 'unpolished', 'crude'],
  },
  {
    id: createLexemeId('adj', 'polished'),
    lemma: 'polished',
    variants: ['polished', 'more polished', 'most polished', 'refined', 'pristine'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('clarity')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'mixing', 'performance'],
    },
    description: 'Highly refined and perfected',
    examples: ['polished production', 'make it more polished', 'pristine sound'],
    opposites: ['rough', 'raw', 'unfinished'],
    synonyms: ['refined', 'pristine', 'perfect', 'immaculate'],
  },
  {
    id: createLexemeId('adj', 'raw'),
    lemma: 'raw',
    variants: ['raw', 'rawer', 'rawest', 'unpolished', 'gritty'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('grit'), createAxisId('intimacy')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['production', 'timbre', 'performance'],
    },
    description: 'Unrefined, authentic, emotionally direct',
    examples: ['keep it raw', 'raw energy', 'more raw and unpolished'],
    opposites: ['polished', 'refined', 'produced'],
    synonyms: ['unpolished', 'gritty', 'authentic', 'visceral'],
  },
  {
    id: createLexemeId('adj', 'refined'),
    lemma: 'refined',
    variants: ['refined', 'more refined', 'most refined', 'elegant', 'sophisticated'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('clarity')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['harmony', 'production', 'arrangement'],
    },
    description: 'Sophisticated and carefully crafted',
    examples: ['more refined', 'refined harmony', 'elegant arrangement'],
    opposites: ['rough', 'crude', 'basic'],
    synonyms: ['elegant', 'sophisticated', 'cultivated', 'polished'],
  },
  {
    id: createLexemeId('adj', 'crude'),
    lemma: 'crude',
    variants: ['crude', 'cruder', 'crudest', 'rough', 'unrefined'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication')],
      direction: 'decrease',
      intensity: 'strong',
      affects: ['production', 'arrangement'],
    },
    description: 'Lacking refinement, basic execution',
    examples: ['too crude', 'less crude', 'crude production'],
    opposites: ['refined', 'polished', 'sophisticated'],
    synonyms: ['rough', 'unrefined', 'basic', 'rudimentary'],
  },
  {
    id: createLexemeId('adj', 'ornate'),
    lemma: 'ornate',
    variants: ['ornate', 'more ornate', 'most ornate', 'decorated', 'embellished'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('busyness')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['melody', 'harmony', 'arrangement'],
    },
    description: 'Highly decorated with embellishments',
    examples: ['ornate melody', 'more ornate', 'heavily embellished'],
    opposites: ['plain', 'simple', 'bare'],
    synonyms: ['decorated', 'embellished', 'elaborate', 'fancy'],
  },
  {
    id: createLexemeId('adj', 'plain'),
    lemma: 'plain',
    variants: ['plain', 'plainer', 'plainest', 'unadorned', 'stark'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('busyness')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['melody', 'arrangement'],
    },
    description: 'Without embellishment, straightforward',
    examples: ['keep it plain', 'plain melody', 'unadorned arrangement'],
    opposites: ['ornate', 'decorated', 'fancy'],
    synonyms: ['unadorned', 'stark', 'simple', 'austere'],
  },
  {
    id: createLexemeId('adj', 'subtle'),
    lemma: 'subtle',
    variants: ['subtle', 'more subtle', 'most subtle', 'understated', 'delicate'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('intimacy')],
      direction: 'increase',
      intensity: 'subtle',
      affects: ['dynamics', 'production', 'arrangement'],
    },
    description: 'Delicate, not obvious, understated',
    examples: ['make it more subtle', 'subtle changes', 'understated production'],
    opposites: ['obvious', 'bold', 'dramatic'],
    synonyms: ['understated', 'delicate', 'nuanced', 'refined'],
  },
  {
    id: createLexemeId('adj', 'obvious'),
    lemma: 'obvious',
    variants: ['obvious', 'more obvious', 'most obvious', 'bold', 'clear'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('clarity'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['dynamics', 'arrangement'],
    },
    description: 'Clear and unmistakable, bold',
    examples: ['make it more obvious', 'obvious changes', 'bold statement'],
    opposites: ['subtle', 'understated', 'hidden'],
    synonyms: ['bold', 'clear', 'pronounced', 'striking'],
  },
];

// Export all adjective collections
export const TEXTURE_SPATIAL_COMPLEXITY_ADJECTIVES: readonly AdjectiveLexeme[] = [
  ...TEXTURAL_ADJECTIVES,
  ...SPATIAL_ADJECTIVES,
  ...COMPLEXITY_ADJECTIVES,
];
