/**
 * GOFAI Canon — Timbral and Textural Vocabulary (Batch 56)
 *
 * Comprehensive vocabulary for describing timbre, texture, sonic character,
 * and sound quality. These descriptors are essential for production, mixing,
 * and sound design conversations.
 *
 * Categories:
 * 1. Timbral qualities (rich, thin, hollow, full, metallic, organic)
 * 2. Textural density (dense, sparse, thick, thin, layered, minimal)
 * 3. Surface qualities (smooth, rough, grainy, glassy, silky, gritty)
 * 4. Warmth and color (warm, cold, colored, neutral, vintage, modern)
 * 5. Resonance and sustain (resonant, dead, ringing, dampened)
 * 6. Harmonic content (rich, pure, complex, simple, overtone-laden)
 * 7. Distortion and saturation (clean, dirty, saturated, pristine)
 * 8. Spatial texture (wide, narrow, deep, shallow, layered, flat)
 *
 * Connects natural language like "make it more organic", "thicken the texture",
 * "add some grit" to concrete audio transformations.
 *
 * @module gofai/canon/timbre-texture-batch56
 */

import type { Lexeme } from './types';
import { createLexemeId, createAxisId } from './types';

// =============================================================================
// 1. Timbral Qualities
// =============================================================================

export const TIMBRAL_QUALITIES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'rich_timbre'),
    lemma: 'rich',
    variants: ['rich', 'full', 'lush', 'opulent', 'luxurious', 'abundant'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('richness'),
      direction: 'increase',
    },
    description: 'Full, harmonically rich timbre',
    examples: ['make it richer', 'add richness', 'lush sound'],
  },
  {
    id: createLexemeId('adj', 'thin_timbre'),
    lemma: 'thin',
    variants: ['thin', 'lean', 'sparse', 'anemic', 'weak'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('richness'),
      direction: 'decrease',
    },
    description: 'Thin, lacking harmonic content',
    examples: ['make it thinner', 'lean sound', 'sparse timbre'],
  },
  {
    id: createLexemeId('adj', 'hollow'),
    lemma: 'hollow',
    variants: ['hollow', 'empty', 'scooped', 'gutless'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('body'),
      direction: 'decrease',
    },
    description: 'Hollow, lacking midrange body',
    examples: ['make it hollow', 'scoop the mids', 'empty sound'],
  },
  {
    id: createLexemeId('adj', 'full_bodied'),
    lemma: 'full_bodied',
    variants: ['full', 'substantial', 'meaty', 'solid', 'weighty'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('body'),
      direction: 'increase',
    },
    description: 'Full-bodied, substantial presence',
    examples: ['make it fuller', 'more substantial', 'solid sound'],
  },
  {
    id: createLexemeId('adj', 'metallic'),
    lemma: 'metallic',
    variants: ['metallic', 'tinny', 'steely', 'brassy', 'clangy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('brightness'),
      direction: 'increase',
    },
    description: 'Metallic, inharmonic overtones',
    examples: ['make it more metallic', 'add metallic sheen', 'steely quality'],
  },
  {
    id: createLexemeId('adj', 'organic'),
    lemma: 'organic',
    variants: ['organic', 'natural', 'acoustic', 'earthy', 'wooden'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('naturalness'),
      direction: 'increase',
    },
    description: 'Organic, natural sound',
    examples: ['make it more organic', 'natural timbre', 'earthy quality'],
  },
  {
    id: createLexemeId('adj', 'synthetic'),
    lemma: 'synthetic',
    variants: ['synthetic', 'artificial', 'electronic', 'digital', 'processed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('naturalness'),
      direction: 'decrease',
    },
    description: 'Synthetic, electronic sound',
    examples: ['make it more synthetic', 'electronic quality', 'digital sound'],
  },
  {
    id: createLexemeId('adj', 'nasal'),
    lemma: 'nasal',
    variants: ['nasal', 'honky', 'boxy', 'resonant_peak'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'increase',
    },
    description: 'Nasal, midrange resonance',
    examples: ['reduce the nasal quality', 'honky sound', 'boxy resonance'],
  },
  {
    id: createLexemeId('adj', 'crystalline'),
    lemma: 'crystalline',
    variants: ['crystalline', 'glassy', 'bell_like', 'clear', 'pristine'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('clarity'),
      direction: 'increase',
    },
    description: 'Clear, bell-like timbre',
    examples: ['crystalline quality', 'glassy sound', 'bell-like tone'],
  },
  {
    id: createLexemeId('adj', 'woody'),
    lemma: 'woody',
    variants: ['woody', 'warm_wood', 'acoustic_wood', 'wooden'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'increase',
    },
    description: 'Warm, wooden timbre',
    examples: ['woody character', 'warm wood tone', 'acoustic quality'],
  },
];

// =============================================================================
// 2. Textural Density
// =============================================================================

export const TEXTURAL_DENSITY: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'dense_texture'),
    lemma: 'dense',
    variants: ['dense', 'thick', 'heavy', 'packed', 'crowded'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('density'),
      direction: 'increase',
    },
    description: 'Dense, thick texture',
    examples: ['make it denser', 'thicken the texture', 'more packed'],
  },
  {
    id: createLexemeId('adj', 'sparse_texture'),
    lemma: 'sparse',
    variants: ['sparse', 'thin_texture', 'light', 'airy', 'open'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('density'),
      direction: 'decrease',
    },
    description: 'Sparse, open texture',
    examples: ['make it sparser', 'thin out the texture', 'more open'],
  },
  {
    id: createLexemeId('adj', 'layered'),
    lemma: 'layered',
    variants: ['layered', 'multi_layered', 'stacked', 'stratified'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('complexity'),
      direction: 'increase',
    },
    description: 'Multiple distinct layers',
    examples: ['more layered', 'add layers', 'multi-layered sound'],
  },
  {
    id: createLexemeId('adj', 'minimal_texture'),
    lemma: 'minimal',
    variants: ['minimal', 'simple', 'bare', 'stripped', 'reduced'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('complexity'),
      direction: 'decrease',
    },
    description: 'Minimal, simple texture',
    examples: ['make it minimal', 'strip it down', 'simpler texture'],
  },
  {
    id: createLexemeId('adj', 'busy'),
    lemma: 'busy',
    variants: ['busy', 'cluttered', 'hectic', 'chaotic', 'frantic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('busyness'),
      direction: 'increase',
    },
    description: 'Busy, active texture',
    examples: ['make it less busy', 'reduce clutter', 'calm it down'],
  },
  {
    id: createLexemeId('adj', 'spacious'),
    lemma: 'spacious',
    variants: ['spacious', 'roomy', 'breathable', 'uncluttered'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('busyness'),
      direction: 'decrease',
    },
    description: 'Spacious, uncluttered',
    examples: ['make it more spacious', 'add breathing room', 'open it up'],
  },
  {
    id: createLexemeId('adj', 'complex'),
    lemma: 'complex',
    variants: ['complex', 'intricate', 'detailed', 'elaborate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('complexity'),
      direction: 'increase',
    },
    description: 'Complex, detailed texture',
    examples: ['make it more complex', 'add detail', 'intricate texture'],
  },
  {
    id: createLexemeId('adj', 'monolithic'),
    lemma: 'monolithic',
    variants: ['monolithic', 'massive', 'wall_of_sound', 'overwhelming'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('density'),
      direction: 'increase',
    },
    description: 'Massive, monolithic sound',
    examples: ['monolithic sound', 'wall of sound', 'massive texture'],
  },
];

// =============================================================================
// 3. Surface Qualities
// =============================================================================

export const SURFACE_QUALITIES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'smooth_surface'),
    lemma: 'smooth',
    variants: ['smooth', 'silky', 'polished', 'refined', 'sleek'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('smoothness'),
      direction: 'increase',
    },
    description: 'Smooth, polished surface',
    examples: ['make it smoother', 'silky texture', 'polished sound'],
  },
  {
    id: createLexemeId('adj', 'rough_surface'),
    lemma: 'rough',
    variants: ['rough', 'coarse', 'raw', 'unpolished', 'edgy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('smoothness'),
      direction: 'decrease',
    },
    description: 'Rough, edgy surface',
    examples: ['make it rougher', 'add edge', 'raw sound'],
  },
  {
    id: createLexemeId('adj', 'grainy'),
    lemma: 'grainy',
    variants: ['grainy', 'gritty', 'sandy', 'granular', 'textured'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('grain'),
      direction: 'increase',
    },
    description: 'Grainy, textured surface',
    examples: ['add grain', 'gritty texture', 'grainy quality'],
  },
  {
    id: createLexemeId('adj', 'glassy'),
    lemma: 'glassy',
    variants: ['glassy', 'glass_like', 'transparent', 'vitreous'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('clarity'),
      direction: 'increase',
    },
    description: 'Glassy, transparent quality',
    examples: ['glassy sound', 'transparent texture', 'glass-like clarity'],
  },
  {
    id: createLexemeId('adj', 'velvety'),
    lemma: 'velvety',
    variants: ['velvety', 'plush', 'soft_texture', 'luxurious'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('smoothness'),
      direction: 'increase',
    },
    description: 'Soft, velvety texture',
    examples: ['velvety sound', 'plush texture', 'soft quality'],
  },
  {
    id: createLexemeId('adj', 'crispy'),
    lemma: 'crispy',
    variants: ['crispy', 'crunchy', 'crackling', 'brittle_texture'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('transients'),
      direction: 'increase',
    },
    description: 'Crispy, crunchy transients',
    examples: ['crispy sound', 'crunchy texture', 'crackling quality'],
  },
  {
    id: createLexemeId('adj', 'fuzzy'),
    lemma: 'fuzzy',
    variants: ['fuzzy', 'blurred', 'soft_focus', 'diffuse'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('clarity'),
      direction: 'decrease',
    },
    description: 'Fuzzy, soft focus',
    examples: ['fuzzy sound', 'blurred quality', 'diffuse texture'],
  },
  {
    id: createLexemeId('adj', 'glistening'),
    lemma: 'glistening',
    variants: ['glistening', 'shimmering', 'sparkling_texture', 'lustrous'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('brightness'),
      direction: 'increase',
    },
    description: 'Glistening, sparkling quality',
    examples: ['glistening highs', 'shimmering texture', 'sparkling sound'],
  },
];

// =============================================================================
// 4. Warmth and Color
// =============================================================================

export const WARMTH_AND_COLOR: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'warm_color'),
    lemma: 'warm',
    variants: ['warm', 'warmer', 'cozy', 'inviting', 'homey'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'increase',
    },
    description: 'Warm, inviting tone',
    examples: ['make it warmer', 'add warmth', 'cozy sound'],
  },
  {
    id: createLexemeId('adj', 'cold_color'),
    lemma: 'cold',
    variants: ['cold', 'cool', 'icy', 'chilly', 'frigid'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'decrease',
    },
    description: 'Cold, icy tone',
    examples: ['make it colder', 'cool it down', 'icy sound'],
  },
  {
    id: createLexemeId('adj', 'colored'),
    lemma: 'colored',
    variants: ['colored', 'tinted', 'flavored', 'character_rich'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('coloration'),
      direction: 'increase',
    },
    description: 'Colored, characterful',
    examples: ['add color', 'give it character', 'tinted sound'],
  },
  {
    id: createLexemeId('adj', 'neutral_color'),
    lemma: 'neutral',
    variants: ['neutral', 'uncolored', 'transparent_color', 'clinical'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('coloration'),
      direction: 'decrease',
    },
    description: 'Neutral, uncolored',
    examples: ['make it neutral', 'remove color', 'transparent sound'],
  },
  {
    id: createLexemeId('adj', 'vintage'),
    lemma: 'vintage',
    variants: ['vintage', 'retro', 'old_school', 'classic', 'analog'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('vintage_quality'),
      direction: 'increase',
    },
    description: 'Vintage, analog character',
    examples: ['add vintage character', 'retro sound', 'analog quality'],
  },
  {
    id: createLexemeId('adj', 'modern_sound'),
    lemma: 'modern',
    variants: ['modern', 'contemporary', 'current', 'hi_fi', 'digital'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('vintage_quality'),
      direction: 'decrease',
    },
    description: 'Modern, hi-fi sound',
    examples: ['modern sound', 'contemporary quality', 'digital clarity'],
  },
  {
    id: createLexemeId('adj', 'golden'),
    lemma: 'golden',
    variants: ['golden', 'honey_toned', 'amber', 'glowing'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'increase',
    },
    description: 'Golden, glowing warmth',
    examples: ['golden tone', 'honey-toned sound', 'glowing quality'],
  },
  {
    id: createLexemeId('adj', 'silvery'),
    lemma: 'silvery',
    variants: ['silvery', 'platinum', 'moonlit', 'sheen'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('brightness'),
      direction: 'increase',
    },
    description: 'Silvery, bright sheen',
    examples: ['silvery quality', 'platinum sound', 'bright sheen'],
  },
];

// =============================================================================
// 5. Resonance and Sustain
// =============================================================================

export const RESONANCE_SUSTAIN: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'resonant'),
    lemma: 'resonant',
    variants: ['resonant', 'ringing', 'sonorous', 'vibrant'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'increase',
    },
    description: 'Resonant, ringing quality',
    examples: ['make it more resonant', 'add resonance', 'ringing tone'],
  },
  {
    id: createLexemeId('adj', 'dead_sound'),
    lemma: 'dead',
    variants: ['dead', 'dampened', 'muted_resonance', 'lifeless'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'decrease',
    },
    description: 'Dead, dampened sound',
    examples: ['deaden the sound', 'dampen the resonance', 'make it less lively'],
  },
  {
    id: createLexemeId('adj', 'sustained'),
    lemma: 'sustained',
    variants: ['sustained', 'lingering', 'long_sustain', 'hanging'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('sustain'),
      direction: 'increase',
    },
    description: 'Long sustain time',
    examples: ['increase sustain', 'let it linger', 'longer decay'],
  },
  {
    id: createLexemeId('adj', 'transient'),
    lemma: 'transient',
    variants: ['transient', 'immediate', 'instantaneous', 'attack_focused'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('transients'),
      direction: 'increase',
    },
    description: 'Transient-focused, immediate',
    examples: ['emphasize transients', 'immediate attack', 'punchy hits'],
  },
  {
    id: createLexemeId('adj', 'boomy'),
    lemma: 'boomy',
    variants: ['boomy', 'tubby', 'woofy', 'low_resonance'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'increase',
    },
    description: 'Excessive low-frequency resonance',
    examples: ['reduce boom', 'less tubby', 'control low resonance'],
  },
  {
    id: createLexemeId('adj', 'tight_sound'),
    lemma: 'tight',
    variants: ['tight', 'controlled', 'focused', 'precise'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tightness'),
      direction: 'increase',
    },
    description: 'Tight, controlled sound',
    examples: ['tighten it up', 'more controlled', 'precise sound'],
  },
  {
    id: createLexemeId('adj', 'loose_sound'),
    lemma: 'loose',
    variants: ['loose', 'relaxed', 'uncontrolled', 'sloppy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tightness'),
      direction: 'decrease',
    },
    description: 'Loose, relaxed sound',
    examples: ['loosen it up', 'more relaxed', 'less tight'],
  },
];

// =============================================================================
// 6. Harmonic Content
// =============================================================================

export const HARMONIC_CONTENT: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'harmonically_rich'),
    lemma: 'harmonically_rich',
    variants: ['rich_harmonics', 'overtone_rich', 'harmonic_full'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_richness'),
      direction: 'increase',
    },
    description: 'Rich harmonic content',
    examples: ['add harmonics', 'make it richer', 'more overtones'],
  },
  {
    id: createLexemeId('adj', 'pure_tone'),
    lemma: 'pure',
    variants: ['pure', 'sine_like', 'fundamental_only', 'simple_tone'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_richness'),
      direction: 'decrease',
    },
    description: 'Pure, simple tone',
    examples: ['purify the tone', 'sine-like quality', 'fundamental only'],
  },
  {
    id: createLexemeId('adj', 'complex_harmonics'),
    lemma: 'complex_harmonics',
    variants: ['complex', 'intricate_harmonics', 'multifaceted'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_complexity'),
      direction: 'increase',
    },
    description: 'Complex harmonic structure',
    examples: ['complex harmonics', 'intricate overtones', 'multifaceted sound'],
  },
  {
    id: createLexemeId('adj', 'simple_harmonics'),
    lemma: 'simple_harmonics',
    variants: ['simple', 'plain_harmonics', 'straightforward'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_complexity'),
      direction: 'decrease',
    },
    description: 'Simple harmonic structure',
    examples: ['simplify harmonics', 'plain tone', 'straightforward sound'],
  },
  {
    id: createLexemeId('adj', 'odd_harmonics'),
    lemma: 'odd_harmonics',
    variants: ['odd', 'hollow_harmonics', 'square_like'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_balance'),
      direction: 'increase',
    },
    description: 'Odd harmonic emphasis',
    examples: ['odd harmonics', 'hollow character', 'square-wave quality'],
  },
  {
    id: createLexemeId('adj', 'even_harmonics'),
    lemma: 'even_harmonics',
    variants: ['even', 'full_harmonics', 'sawtooth_like'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_balance'),
      direction: 'decrease',
    },
    description: 'Even harmonic content',
    examples: ['even harmonics', 'full spectrum', 'sawtooth quality'],
  },
];

// =============================================================================
// 7. Distortion and Saturation
// =============================================================================

export const DISTORTION_SATURATION: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'clean_sound'),
    lemma: 'clean',
    variants: ['clean', 'pristine', 'pure_signal', 'undistorted'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('distortion'),
      direction: 'decrease',
    },
    description: 'Clean, undistorted',
    examples: ['make it cleaner', 'pristine sound', 'remove distortion'],
  },
  {
    id: createLexemeId('adj', 'dirty_sound'),
    lemma: 'dirty',
    variants: ['dirty', 'gritty', 'distorted', 'grungy', 'filthy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('distortion'),
      direction: 'increase',
    },
    description: 'Distorted, gritty sound',
    examples: ['make it dirtier', 'add grit', 'grungy sound'],
  },
  {
    id: createLexemeId('adj', 'saturated'),
    lemma: 'saturated',
    variants: ['saturated', 'driven', 'overdriven', 'pushed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('saturation'),
      direction: 'increase',
    },
    description: 'Saturated, driven sound',
    examples: ['saturate it', 'drive it harder', 'push it'],
  },
  {
    id: createLexemeId('adj', 'pristine_signal'),
    lemma: 'pristine',
    variants: ['pristine', 'untouched', 'virgin', 'unprocessed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('processing'),
      direction: 'decrease',
    },
    description: 'Pristine, unprocessed',
    examples: ['keep it pristine', 'untouched quality', 'natural signal'],
  },
  {
    id: createLexemeId('adj', 'crunchy_distortion'),
    lemma: 'crunchy',
    variants: ['crunchy', 'brittle_distortion', 'crushing'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('distortion'),
      direction: 'increase',
    },
    description: 'Crunchy, brittle distortion',
    examples: ['add crunch', 'crunchy distortion', 'crushing sound'],
  },
  {
    id: createLexemeId('adj', 'fuzzy_distortion'),
    lemma: 'fuzzy_distortion',
    variants: ['fuzzy_dist', 'wooly', 'fuzzy_overdrive'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('distortion'),
      direction: 'increase',
    },
    description: 'Fuzzy, wooly distortion',
    examples: ['fuzzy distortion', 'wooly sound', 'fuzz tone'],
  },
];

// =============================================================================
// 8. Spatial Texture
// =============================================================================

export const SPATIAL_TEXTURE: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'wide_spatial'),
    lemma: 'wide',
    variants: ['wide', 'expansive', 'broad', 'panoramic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('width'),
      direction: 'increase',
    },
    description: 'Wide stereo image',
    examples: ['make it wider', 'expand the stereo', 'panoramic sound'],
  },
  {
    id: createLexemeId('adj', 'narrow_spatial'),
    lemma: 'narrow',
    variants: ['narrow', 'focused_spatial', 'centered', 'mono_like'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('width'),
      direction: 'decrease',
    },
    description: 'Narrow stereo image',
    examples: ['make it narrower', 'focus the stereo', 'center it'],
  },
  {
    id: createLexemeId('adj', 'deep_spatial'),
    lemma: 'deep',
    variants: ['deep', 'dimensional', 'three_dimensional', 'depthful'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('depth'),
      direction: 'increase',
    },
    description: 'Deep, three-dimensional',
    examples: ['add depth', 'make it deeper', 'three-dimensional sound'],
  },
  {
    id: createLexemeId('adj', 'flat_spatial'),
    lemma: 'flat',
    variants: ['flat', 'two_dimensional', 'shallow', 'depthless'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('depth'),
      direction: 'decrease',
    },
    description: 'Flat, two-dimensional',
    examples: ['flatten it', 'reduce depth', 'two-dimensional sound'],
  },
  {
    id: createLexemeId('adj', 'layered_spatial'),
    lemma: 'layered_spatial',
    variants: ['spatial_layers', 'stratified_depth', 'planes'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('depth'),
      direction: 'increase',
    },
    description: 'Distinct spatial layers',
    examples: ['create spatial layers', 'stratified depth', 'separate planes'],
  },
  {
    id: createLexemeId('adj', 'immersive'),
    lemma: 'immersive',
    variants: ['immersive', 'enveloping', 'surrounding', 'encompassing'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('spatiality'),
      direction: 'increase',
    },
    description: 'Immersive, enveloping',
    examples: ['make it immersive', 'enveloping sound', 'surround quality'],
  },
];

// =============================================================================
// Exports
// =============================================================================

/**
 * All timbral and textural vocabulary entries in batch 56.
 */
export const TIMBRE_TEXTURE_VOCABULARY: readonly Lexeme[] = [
  ...TIMBRAL_QUALITIES,
  ...TEXTURAL_DENSITY,
  ...SURFACE_QUALITIES,
  ...WARMTH_AND_COLOR,
  ...RESONANCE_SUSTAIN,
  ...HARMONIC_CONTENT,
  ...DISTORTION_SATURATION,
  ...SPATIAL_TEXTURE,
];

/**
 * Count of entries in this batch.
 */
export const BATCH_56_COUNT = TIMBRE_TEXTURE_VOCABULARY.length;
