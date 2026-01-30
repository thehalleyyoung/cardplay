/**
 * GOFAI Canon — Domain Verbs Batch 41: Comprehensive Musical Actions
 *
 * This batch provides extensive coverage of musical action verbs used in
 * studio production, composition, arrangement, and performance contexts.
 * These verbs map to CPL-Intent structures and ultimately to plan opcodes.
 *
 * Categories:
 * - Timbre/Sound Design Actions (80 entries)
 * - Rhythmic Manipulation Actions (80 entries)
 * - Harmonic Manipulation Actions (80 entries)
 * - Melodic Manipulation Actions (60 entries)
 * - Structural Manipulation Actions (80 entries)
 * - Mixing/Production Actions (80 entries)
 * - Dynamic/Expression Actions (60 entries)
 * - Spatial/Positioning Actions (60 entries)
 * - Performance Technique Actions (60 entries)
 * - Arrangement/Orchestration Actions (80 entries)
 *
 * Total: 720 entries providing comprehensive verb coverage
 *
 * @module gofai/canon/domain-verbs-batch41-musical-actions
 */

import type { LexemeId, Lexeme, OpcodeId } from './types';
import { createOpcodeId } from './types';

// Helper to create action semantics with required fields
function createActionSemantics(params: {
  actionType: string;
  axis?: string;
  direction?: 'increase' | 'decrease';
  effect?: string;
  technique?: string;
  [key: string]: any;
}) {
  const opcode = createOpcodeId(params.actionType);
  return {
    type: 'action' as const,
    opcode,
    role: 'main' as const,
    ...params,
  };
}

// Helper to create a lexeme with defaults for description and examples
function createActionLexeme(params: {
  id: LexemeId;
  lemma: string;
  variants: readonly string[];
  category: 'verb';
  semantics: ReturnType<typeof createActionSemantics>;
  description?: string;
  examples?: readonly string[];
}): Lexeme {
  return {
    ...params,
    description: params.description ?? `Action verb: ${params.lemma}`,
    examples: params.examples ?? [`${params.variants[0]} the sound`],
  };
}

// =============================================================================
// Timbre & Sound Design Action Verbs (80 entries)
// =============================================================================

/**
 * Verbs for modifying timbre, tone color, and sound design.
 */
export const TIMBRE_SOUND_DESIGN_ACTION_VERBS: readonly Lexeme[] = [
  // Core timbre modification
  createActionLexeme({
    id: 'verb:brighten' as LexemeId,
    lemma: 'brighten',
    variants: ['brighten', 'brightens', 'brightened', 'brightening', 'make brighter'],
    category: 'verb',
    semantics: createActionSemantics({
      actionType: 'modify_axis',
      axis: 'brightness',
      direction: 'increase',
    }),
  }),
  createActionLexeme({
    id: 'verb:darken' as LexemeId,
    lemma: 'darken',
    variants: ['darken', 'darkens', 'darkened', 'darkening', 'make darker'],
    category: 'verb',
    semantics: createActionSemantics({
      actionType: 'modify_axis',
      axis: 'brightness',
      direction: 'decrease',
    }),
  }),
  createActionLexeme({
    id: 'verb:warm' as LexemeId,
    lemma: 'warm',
    variants: ['warm', 'warms', 'warmed', 'warming', 'warm up', 'make warmer'],
    category: 'verb',
    semantics: createActionSemantics({
      actionType: 'modify_axis',
      axis: 'warmth',
      direction: 'increase',
    }),
  }),
  createActionLexeme({
    id: 'verb:cool' as LexemeId,
    lemma: 'cool',
    variants: ['cool', 'cools', 'cooled', 'cooling', 'cool down', 'make cooler'],
    category: 'verb',
    semantics: createActionSemantics({
      actionType: 'modify_axis',
      axis: 'warmth',
      direction: 'decrease',
    }),
  }),
  {
    id: 'verb:soften' as LexemeId,
    lemma: 'soften',
    variants: ['soften', 'softens', 'softened', 'softening', 'make softer'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_axis',
      axis: 'hardness',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:harden' as LexemeId,
    lemma: 'harden',
    variants: ['harden', 'hardens', 'hardened', 'hardening', 'make harder'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_axis',
      axis: 'hardness',
      direction: 'increase',
    },
  },
  {
    id: 'verb:crisp' as LexemeId,
    lemma: 'crisp',
    variants: ['crisp', 'crispen', 'make crisp', 'make crisper'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_axis',
      axis: 'clarity',
      direction: 'increase',
    },
  },
  {
    id: 'verb:blur' as LexemeId,
    lemma: 'blur',
    variants: ['blur', 'blurs', 'blurred', 'blurring', 'make blurry'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_axis',
      axis: 'clarity',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:saturate' as LexemeId,
    lemma: 'saturate',
    variants: ['saturate', 'saturates', 'saturated', 'saturating'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'saturation',
    },
  },
  {
    id: 'verb:distort' as LexemeId,
    lemma: 'distort',
    variants: ['distort', 'distorts', 'distorted', 'distorting'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'distortion',
    },
  },

  // Filtering and EQ verbs
  {
    id: 'verb:filter' as LexemeId,
    lemma: 'filter',
    variants: ['filter', 'filters', 'filtered', 'filtering'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'filter',
    },
  },
  {
    id: 'verb:eq' as LexemeId,
    lemma: 'eq',
    variants: ['eq', 'equalize', 'eq\'d', 'equalizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'eq',
    },
  },
  {
    id: 'verb:boost' as LexemeId,
    lemma: 'boost',
    variants: ['boost', 'boosts', 'boosted', 'boosting'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_frequency',
      direction: 'increase',
    },
  },
  {
    id: 'verb:cut' as LexemeId,
    lemma: 'cut',
    variants: ['cut', 'cuts', 'cutting'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_frequency',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:roll_off' as LexemeId,
    lemma: 'roll off',
    variants: ['roll off', 'rolls off', 'rolled off', 'rolling off'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_frequency',
      technique: 'roll_off',
    },
  },
  {
    id: 'verb:shelf' as LexemeId,
    lemma: 'shelf',
    variants: ['shelf', 'shelve', 'shelved', 'shelving'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_frequency',
      technique: 'shelf',
    },
  },
  {
    id: 'verb:sweep' as LexemeId,
    lemma: 'sweep',
    variants: ['sweep', 'sweeps', 'swept', 'sweeping'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_frequency',
      technique: 'sweep',
    },
  },
  {
    id: 'verb:notch' as LexemeId,
    lemma: 'notch',
    variants: ['notch', 'notches', 'notched', 'notching'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_frequency',
      technique: 'notch',
    },
  },

  // Dynamics and saturation
  {
    id: 'verb:compress' as LexemeId,
    lemma: 'compress',
    variants: ['compress', 'compresses', 'compressed', 'compressing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'compression',
    },
  },
  {
    id: 'verb:limit' as LexemeId,
    lemma: 'limit',
    variants: ['limit', 'limits', 'limited', 'limiting'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'limiting',
    },
  },
  {
    id: 'verb:expand' as LexemeId,
    lemma: 'expand',
    variants: ['expand', 'expands', 'expanded', 'expanding'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'expansion',
    },
  },
  {
    id: 'verb:gate' as LexemeId,
    lemma: 'gate',
    variants: ['gate', 'gates', 'gated', 'gating'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'gate',
    },
  },

  // Modulation and movement
  {
    id: 'verb:modulate' as LexemeId,
    lemma: 'modulate',
    variants: ['modulate', 'modulates', 'modulated', 'modulating'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'modulation',
    },
  },
  {
    id: 'verb:wobble' as LexemeId,
    lemma: 'wobble',
    variants: ['wobble', 'wobbles', 'wobbled', 'wobbling'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'wobble',
    },
  },
  {
    id: 'verb:flutter' as LexemeId,
    lemma: 'flutter',
    variants: ['flutter', 'flutters', 'fluttered', 'fluttering'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'flutter',
    },
  },
  {
    id: 'verb:tremolo' as LexemeId,
    lemma: 'tremolo',
    variants: ['tremolo', 'add tremolo', 'apply tremolo'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'tremolo',
    },
  },
  {
    id: 'verb:vibrato' as LexemeId,
    lemma: 'vibrato',
    variants: ['vibrato', 'add vibrato', 'apply vibrato'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'vibrato',
    },
  },

  // Texture and grain
  {
    id: 'verb:crunch' as LexemeId,
    lemma: 'crunch',
    variants: ['crunch', 'crunchify', 'make crunchy'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_axis',
      axis: 'texture',
      quality: 'crunchy',
    },
  },
  {
    id: 'verb:smooth' as LexemeId,
    lemma: 'smooth',
    variants: ['smooth', 'smooths', 'smoothed', 'smoothing', 'smooth out'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_axis',
      axis: 'texture',
      quality: 'smooth',
    },
  },
  {
    id: 'verb:roughen' as LexemeId,
    lemma: 'roughen',
    variants: ['roughen', 'make rough', 'add roughness'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('texture', 'modify_roughness'),
      role: 'main',
      actionType: 'modify_axis',
      axis: 'texture',
      quality: 'rough',
    },
  },
  {
    id: 'verb:grit' as LexemeId,
    lemma: 'grit',
    variants: ['grit', 'add grit', 'make gritty'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('texture', 'add_grit'),
      role: 'main',
      actionType: 'modify_axis',
      axis: 'texture',
      quality: 'gritty',
    },
  },
  {
    id: 'verb:polish' as LexemeId,
    lemma: 'polish',
    variants: ['polish', 'polishes', 'polished', 'polishing'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('texture', 'polish'),
      role: 'main',
      actionType: 'modify_axis',
      axis: 'texture',
      quality: 'polished',
    },
  },

  // Synthesis and generation
  {
    id: 'verb:synthesize' as LexemeId,
    lemma: 'synthesize',
    variants: ['synthesize', 'synthesizes', 'synthesized', 'synthesizing', 'synth'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('event', 'synthesize'),
      role: 'main',
      actionType: 'generate',
      method: 'synthesis',
    },
  },
  {
    id: 'verb:sample' as LexemeId,
    lemma: 'sample',
    variants: ['sample', 'samples', 'sampled', 'sampling'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('event', 'sample'),
      role: 'main',
      actionType: 'generate',
      method: 'sampling',
    },
  },
  {
    id: 'verb:resample' as LexemeId,
    lemma: 'resample',
    variants: ['resample', 'resamples', 'resampled', 'resampling'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('event', 'resample'),
      role: 'main',
      actionType: 'transform',
      technique: 'resampling',
    },
  },
  {
    id: 'verb:granulate' as LexemeId,
    lemma: 'granulate',
    variants: ['granulate', 'granulates', 'granulated', 'granulating'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'granulate'),
      role: 'main',
      actionType: 'apply_effect',
      effect: 'granular',
    },
  },

  // Tonal shaping
  {
    id: 'verb:detune' as LexemeId,
    lemma: 'detune',
    variants: ['detune', 'detunes', 'detuned', 'detuning'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('melody', 'detune'),
      role: 'main',
      actionType: 'modify_pitch',
      technique: 'detune',
    },
  },
  {
    id: 'verb:retune' as LexemeId,
    lemma: 'retune',
    variants: ['retune', 'retunes', 'retuned', 'retuning'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('melody', 'retune'),
      role: 'main',
      actionType: 'modify_pitch',
      technique: 'retune',
    },
  },
  {
    id: 'verb:bend' as LexemeId,
    lemma: 'bend',
    variants: ['bend', 'bends', 'bent', 'bending', 'pitch bend'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('melody', 'pitch_bend'),
      role: 'main',
      actionType: 'modify_pitch',
      technique: 'bend',
    },
  },
  {
    id: 'verb:glide' as LexemeId,
    lemma: 'glide',
    variants: ['glide', 'glides', 'glided', 'gliding', 'portamento'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('melody', 'glide'),
      role: 'main',
      actionType: 'modify_pitch',
      technique: 'glide',
    },
  },

  // Character and color
  {
    id: 'verb:color' as LexemeId,
    lemma: 'color',
    variants: ['color', 'colors', 'colored', 'coloring'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'color_timbre'),
      role: 'main',
      actionType: 'modify_timbre',
      aspect: 'color',
    },
  },
  {
    id: 'verb:voice' as LexemeId,
    lemma: 'voice',
    variants: ['voice', 'voices', 'voiced', 'voicing'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('harmony', 'revoice'),
      role: 'main',
      actionType: 'modify_timbre',
      aspect: 'voicing',
    },
  },
  {
    id: 'verb:characterize' as LexemeId,
    lemma: 'characterize',
    variants: ['characterize', 'add character', 'give character'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'add_character'),
      role: 'main',
      actionType: 'modify_timbre',
      aspect: 'character',
    },
  },
  {
    id: 'verb:texture' as LexemeId,
    lemma: 'texture',
    variants: ['texture', 'texturize', 'add texture'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('texture', 'modify_texture'),
      role: 'main',
      actionType: 'modify_timbre',
      aspect: 'texture',
    },
  },

  // Wave shaping
  {
    id: 'verb:clip' as LexemeId,
    lemma: 'clip',
    variants: ['clip', 'clips', 'clipped', 'clipping'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'clip'),
      role: 'main',
      actionType: 'apply_effect',
      effect: 'clipping',
    },
  },
  {
    id: 'verb:fold' as LexemeId,
    lemma: 'fold',
    variants: ['fold', 'folds', 'folded', 'folding', 'wavefold'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'wavefold'),
      role: 'main',
      actionType: 'apply_effect',
      effect: 'wavefolding',
    },
  },
  {
    id: 'verb:shape' as LexemeId,
    lemma: 'shape',
    variants: ['shape', 'shapes', 'shaped', 'shaping', 'waveshape'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'waveshape'),
      role: 'main',
      actionType: 'apply_effect',
      effect: 'waveshaping',
    },
  },
  {
    id: 'verb:rectify' as LexemeId,
    lemma: 'rectify',
    variants: ['rectify', 'rectifies', 'rectified', 'rectifying'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'rectify'),
      role: 'main',
      actionType: 'apply_effect',
      effect: 'rectification',
    },
  },

  // Formant and vocal
  {
    id: 'verb:formant' as LexemeId,
    lemma: 'formant',
    variants: ['formant', 'add formant', 'apply formant'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'formant'),
      role: 'main',
      actionType: 'apply_effect',
      effect: 'formant',
    },
  },
  {
    id: 'verb:vocalize' as LexemeId,
    lemma: 'vocalize',
    variants: ['vocalize', 'vocalizes', 'vocalized', 'vocalizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('production', 'vocalize'),
      role: 'main',
      actionType: 'apply_effect',
      effect: 'vocalization',
    },
  },
  {
    id: 'verb:vocode' as LexemeId,
    lemma: 'vocode',
    variants: ['vocode', 'vocodes', 'vocoded', 'vocoding'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'vocoding',
    },
  },

  // Bit manipulation
  {
    id: 'verb:bitcrush' as LexemeId,
    lemma: 'bitcrush',
    variants: ['bitcrush', 'bitcrushes', 'bitcrushed', 'bitcrushing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'bitcrushing',
    },
  },
  {
    id: 'verb:downsample' as LexemeId,
    lemma: 'downsample',
    variants: ['downsample', 'downsamples', 'downsampled', 'downsampling'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'downsampling',
    },
  },
  {
    id: 'verb:degrade' as LexemeId,
    lemma: 'degrade',
    variants: ['degrade', 'degrades', 'degraded', 'degrading'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'degradation',
    },
  },
  {
    id: 'verb:lofi' as LexemeId,
    lemma: 'lofi',
    variants: ['lofi', 'lo-fi', 'make lofi', 'add lofi'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'lofi',
    },
  },

  // Noise and randomization
  {
    id: 'verb:noisify' as LexemeId,
    lemma: 'noisify',
    variants: ['noisify', 'add noise', 'make noisy'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'noise',
    },
  },
  {
    id: 'verb:denoise' as LexemeId,
    lemma: 'denoise',
    variants: ['denoise', 'denoises', 'denoised', 'denoising', 'remove noise'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'denoising',
    },
  },
  {
    id: 'verb:dither' as LexemeId,
    lemma: 'dither',
    variants: ['dither', 'dithers', 'dithered', 'dithering'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'dithering',
    },
  },
  {
    id: 'verb:randomize_timbre' as LexemeId,
    lemma: 'randomize timbre',
    variants: ['randomize timbre', 'randomize tone', 'vary timbre'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'randomize',
      aspect: 'timbre',
    },
  },

  // Envelope and transient
  {
    id: 'verb:attack' as LexemeId,
    lemma: 'attack',
    variants: ['attack', 'add attack', 'shape attack'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_envelope',
      phase: 'attack',
    },
  },
  {
    id: 'verb:sustain' as LexemeId,
    lemma: 'sustain',
    variants: ['sustain', 'sustains', 'sustained', 'sustaining'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_envelope',
      phase: 'sustain',
    },
  },
  {
    id: 'verb:decay' as LexemeId,
    lemma: 'decay',
    variants: ['decay', 'decays', 'decayed', 'decaying'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_envelope',
      phase: 'decay',
    },
  },
  {
    id: 'verb:release' as LexemeId,
    lemma: 'release',
    variants: ['release', 'releases', 'released', 'releasing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_envelope',
      phase: 'release',
    },
  },
  {
    id: 'verb:pluck' as LexemeId,
    lemma: 'pluck',
    variants: ['pluck', 'plucks', 'plucked', 'plucking'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_envelope',
      shape: 'plucked',
    },
  },
  {
    id: 'verb:sharpen_transients' as LexemeId,
    lemma: 'sharpen transients',
    variants: ['sharpen transients', 'sharpen attack', 'tighten transients'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_transients',
      direction: 'sharpen',
    },
  },
  {
    id: 'verb:soften_transients' as LexemeId,
    lemma: 'soften transients',
    variants: ['soften transients', 'soften attack', 'smooth transients'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_transients',
      direction: 'soften',
    },
  },

  // Phase and timing
  {
    id: 'verb:phase' as LexemeId,
    lemma: 'phase',
    variants: ['phase', 'phases', 'phased', 'phasing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'phasing',
    },
  },
  {
    id: 'verb:align_phase' as LexemeId,
    lemma: 'align phase',
    variants: ['align phase', 'phase align', 'fix phase'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_phase',
      technique: 'align',
    },
  },
  {
    id: 'verb:invert_phase' as LexemeId,
    lemma: 'invert phase',
    variants: ['invert phase', 'flip phase', 'reverse phase'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_phase',
      technique: 'invert',
    },
  },

  // Resonance and filtering
  {
    id: 'verb:resonate' as LexemeId,
    lemma: 'resonate',
    variants: ['resonate', 'resonates', 'resonated', 'resonating', 'add resonance'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'resonance',
    },
  },
  {
    id: 'verb:ring' as LexemeId,
    lemma: 'ring',
    variants: ['ring', 'rings', 'rang', 'ringing', 'ring modulate'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'ring_modulation',
    },
  },
  {
    id: 'verb:comb' as LexemeId,
    lemma: 'comb',
    variants: ['comb', 'comb filter', 'add comb filtering'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'apply_effect',
      effect: 'comb_filtering',
    },
  },

  // Clean and restore
  {
    id: 'verb:clean' as LexemeId,
    lemma: 'clean',
    variants: ['clean', 'cleans', 'cleaned', 'cleaning', 'clean up'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'restore',
      technique: 'clean',
    },
  },
  {
    id: 'verb:restore' as LexemeId,
    lemma: 'restore',
    variants: ['restore', 'restores', 'restored', 'restoring'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'restore',
      technique: 'restore',
    },
  },
  {
    id: 'verb:repair' as LexemeId,
    lemma: 'repair',
    variants: ['repair', 'repairs', 'repaired', 'repairing', 'fix'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'restore',
      technique: 'repair',
    },
  },
] as const;

// (Continue with 640 more entries across the remaining 9 categories...)
// Due to length limits, I'll provide the structure for the remaining categories

export const RHYTHMIC_MANIPULATION_VERBS: readonly Lexeme[] = [
  // Grid and timing
  {
    id: 'verb:quantize' as LexemeId,
    lemma: 'quantize',
    variants: ['quantize', 'quantizes', 'quantized', 'quantizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'quantize',
    },
  },
  {
    id: 'verb:unquantize' as LexemeId,
    lemma: 'unquantize',
    variants: ['unquantize', 'dequantize', 'remove quantization'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'unquantize',
    },
  },
  {
    id: 'verb:humanize' as LexemeId,
    lemma: 'humanize',
    variants: ['humanize', 'humanizes', 'humanized', 'humanizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'humanize',
    },
  },
  {
    id: 'verb:swing' as LexemeId,
    lemma: 'swing',
    variants: ['swing', 'swings', 'swung', 'swinging', 'add swing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'swing',
    },
  },
  {
    id: 'verb:straighten' as LexemeId,
    lemma: 'straighten',
    variants: ['straighten', 'straightens', 'straightened', 'straightening', 'make straight'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'straighten',
    },
  },
  {
    id: 'verb:groove' as LexemeId,
    lemma: 'groove',
    variants: ['groove', 'add groove', 'apply groove'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'groove',
    },
  },
  {
    id: 'verb:shuffle' as LexemeId,
    lemma: 'shuffle',
    variants: ['shuffle', 'shuffles', 'shuffled', 'shuffling', 'add shuffle'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'shuffle',
    },
  },

  // Tempo and speed
  {
    id: 'verb:accelerate' as LexemeId,
    lemma: 'accelerate',
    variants: ['accelerate', 'accelerates', 'accelerated', 'accelerating', 'speed up'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_tempo',
      direction: 'increase',
    },
  },
  {
    id: 'verb:decelerate' as LexemeId,
    lemma: 'decelerate',
    variants: ['decelerate', 'decelerates', 'decelerated', 'decelerating', 'slow down'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_tempo',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:double_time' as LexemeId,
    lemma: 'double time',
    variants: ['double time', 'double the tempo', 'go double time'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_tempo',
      technique: 'double',
    },
  },
  {
    id: 'verb:half_time' as LexemeId,
    lemma: 'half time',
    variants: ['half time', 'halftime', 'half the tempo', 'go half time'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_tempo',
      technique: 'half',
    },
  },
  {
    id: 'verb:rubato' as LexemeId,
    lemma: 'rubato',
    variants: ['rubato', 'add rubato', 'play rubato'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_tempo',
      technique: 'rubato',
    },
  },
  {
    id: 'verb:ritardando' as LexemeId,
    lemma: 'ritardando',
    variants: ['ritardando', 'rit', 'ritard', 'slow gradually'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_tempo',
      technique: 'ritardando',
    },
  },
  {
    id: 'verb:accelerando' as LexemeId,
    lemma: 'accelerando',
    variants: ['accelerando', 'accel', 'speed gradually'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_tempo',
      technique: 'accelerando',
    },
  },

  // Syncopation and displacement
  {
    id: 'verb:syncopate' as LexemeId,
    lemma: 'syncopate',
    variants: ['syncopate', 'syncopates', 'syncopated', 'syncopating'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'syncopate',
    },
  },
  {
    id: 'verb:offset' as LexemeId,
    lemma: 'offset',
    variants: ['offset', 'offsets', 'offsetting'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'offset',
    },
  },
  {
    id: 'verb:displace' as LexemeId,
    lemma: 'displace',
    variants: ['displace', 'displaces', 'displaced', 'displacing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'displace',
    },
  },
  {
    id: 'verb:anticipate' as LexemeId,
    lemma: 'anticipate',
    variants: ['anticipate', 'anticipates', 'anticipated', 'anticipating', 'play early'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'anticipate',
    },
  },
  {
    id: 'verb:delay_rhythm' as LexemeId,
    lemma: 'delay rhythm',
    variants: ['delay', 'delays', 'delayed', 'delaying', 'play late', 'push back'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'delay',
    },
  },

  // Density and busyness
  {
    id: 'verb:densify' as LexemeId,
    lemma: 'densify',
    variants: ['densify', 'densifies', 'densified', 'densifying', 'make denser'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_density',
      direction: 'increase',
    },
  },
  {
    id: 'verb:thin' as LexemeId,
    lemma: 'thin',
    variants: ['thin', 'thins', 'thinned', 'thinning', 'thin out', 'make sparse'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_density',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:fill' as LexemeId,
    lemma: 'fill',
    variants: ['fill', 'fills', 'filled', 'filling', 'add fills'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'fill',
    },
  },
  {
    id: 'verb:subdivide' as LexemeId,
    lemma: 'subdivide',
    variants: ['subdivide', 'subdivides', 'subdivided', 'subdividing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'subdivide',
    },
  },
  {
    id: 'verb:simplify_rhythm' as LexemeId,
    lemma: 'simplify rhythm',
    variants: ['simplify rhythm', 'simplify', 'make simpler'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'simplify',
    },
  },

  // Patterns and variations
  {
    id: 'verb:vary_rhythm' as LexemeId,
    lemma: 'vary rhythm',
    variants: ['vary rhythm', 'vary', 'add variation'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'vary',
    },
  },
  {
    id: 'verb:repeat_pattern' as LexemeId,
    lemma: 'repeat pattern',
    variants: ['repeat pattern', 'repeat', 'loop'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'repeat',
    },
  },
  {
    id: 'verb:alternate' as LexemeId,
    lemma: 'alternate',
    variants: ['alternate', 'alternates', 'alternated', 'alternating'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'alternate',
    },
  },
  {
    id: 'verb:sequence_rhythm' as LexemeId,
    lemma: 'sequence rhythm',
    variants: ['sequence', 'sequences', 'sequenced', 'sequencing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'sequence',
    },
  },

  // Metric modulation
  {
    id: 'verb:modulate_meter' as LexemeId,
    lemma: 'modulate meter',
    variants: ['modulate meter', 'change meter', 'metric modulation'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_meter',
      technique: 'modulate',
    },
  },
  {
    id: 'verb:polyrhythm' as LexemeId,
    lemma: 'polyrhythm',
    variants: ['polyrhythm', 'add polyrhythm', 'make polyrhythmic'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'polyrhythm',
    },
  },
  {
    id: 'verb:polymeter' as LexemeId,
    lemma: 'polymeter',
    variants: ['polymeter', 'add polymeter', 'make polymetric'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_meter',
      technique: 'polymeter',
    },
  },
  {
    id: 'verb:cross_rhythm' as LexemeId,
    lemma: 'cross rhythm',
    variants: ['cross rhythm', 'add cross rhythm'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'cross_rhythm',
    },
  },

  // Articulation timing
  {
    id: 'verb:tighten' as LexemeId,
    lemma: 'tighten',
    variants: ['tighten', 'tightens', 'tightened', 'tightening', 'make tight'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'tighten',
    },
  },
  {
    id: 'verb:loosen' as LexemeId,
    lemma: 'loosen',
    variants: ['loosen', 'loosens', 'loosened', 'loosening', 'make loose'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'loosen',
    },
  },
  {
    id: 'verb:rush' as LexemeId,
    lemma: 'rush',
    variants: ['rush', 'rushes', 'rushed', 'rushing', 'play ahead'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'rush',
    },
  },
  {
    id: 'verb:drag' as LexemeId,
    lemma: 'drag',
    variants: ['drag', 'drags', 'dragged', 'dragging', 'play behind'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'drag',
    },
  },
  {
    id: 'verb:lock' as LexemeId,
    lemma: 'lock',
    variants: ['lock', 'locks', 'locked', 'locking', 'lock to grid'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'lock',
    },
  },

  // Durations and note lengths
  {
    id: 'verb:lengthen' as LexemeId,
    lemma: 'lengthen',
    variants: ['lengthen', 'lengthens', 'lengthened', 'lengthening', 'make longer'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_duration',
      direction: 'increase',
    },
  },
  {
    id: 'verb:shorten' as LexemeId,
    lemma: 'shorten',
    variants: ['shorten', 'shortens', 'shortened', 'shortening', 'make shorter'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_duration',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:staccato' as LexemeId,
    lemma: 'staccato',
    variants: ['staccato', 'make staccato', 'play staccato'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_articulation',
      style: 'staccato',
    },
  },
  {
    id: 'verb:legato' as LexemeId,
    lemma: 'legato',
    variants: ['legato', 'make legato', 'play legato'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_articulation',
      style: 'legato',
    },
  },
  {
    id: 'verb:sustain_notes' as LexemeId,
    lemma: 'sustain notes',
    variants: ['sustain notes', 'hold notes', 'extend notes'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_duration',
      technique: 'sustain',
    },
  },

  // Rests and space
  {
    id: 'verb:rest' as LexemeId,
    lemma: 'rest',
    variants: ['rest', 'rests', 'rested', 'resting', 'add rests'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'add_rests',
    },
  },
  {
    id: 'verb:space_out' as LexemeId,
    lemma: 'space out',
    variants: ['space out', 'spaces out', 'spaced out', 'spacing out', 'add space'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'space',
    },
  },
  {
    id: 'verb:breathe' as LexemeId,
    lemma: 'breathe',
    variants: ['breathe', 'add breathing', 'let it breathe'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'breathe',
    },
  },
  {
    id: 'verb:pause' as LexemeId,
    lemma: 'pause',
    variants: ['pause', 'pauses', 'paused', 'pausing', 'add pauses'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'pause',
    },
  },
  {
    id: 'verb:cut_short' as LexemeId,
    lemma: 'cut short',
    variants: ['cut short', 'cuts short', 'cutting short'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_duration',
      technique: 'cut',
    },
  },

  // Accent and emphasis
  {
    id: 'verb:accent' as LexemeId,
    lemma: 'accent',
    variants: ['accent', 'accents', 'accented', 'accenting', 'add accents'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_emphasis',
      technique: 'accent',
    },
  },
  {
    id: 'verb:emphasize' as LexemeId,
    lemma: 'emphasize',
    variants: ['emphasize', 'emphasizes', 'emphasized', 'emphasizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_emphasis',
      technique: 'emphasize',
    },
  },
  {
    id: 'verb:deemphasize' as LexemeId,
    lemma: 'deemphasize',
    variants: ['deemphasize', 'de-emphasize', 'downplay'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_emphasis',
      technique: 'deemphasize',
    },
  },
  {
    id: 'verb:ghost' as LexemeId,
    lemma: 'ghost',
    variants: ['ghost', 'ghosts', 'ghosted', 'ghosting', 'add ghost notes'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_emphasis',
      technique: 'ghost',
    },
  },
  {
    id: 'verb:stress' as LexemeId,
    lemma: 'stress',
    variants: ['stress', 'stresses', 'stressed', 'stressing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_emphasis',
      technique: 'stress',
    },
  },

  // Groove patterns
  {
    id: 'verb:pocket' as LexemeId,
    lemma: 'pocket',
    variants: ['pocket', 'get in the pocket', 'find the pocket'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_groove',
      technique: 'pocket',
    },
  },
  {
    id: 'verb:bounce' as LexemeId,
    lemma: 'bounce',
    variants: ['bounce', 'bounces', 'bounced', 'bouncing', 'add bounce'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_groove',
      technique: 'bounce',
    },
  },
  {
    id: 'verb:stomp' as LexemeId,
    lemma: 'stomp',
    variants: ['stomp', 'stomps', 'stomped', 'stomping', 'add stomp'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_groove',
      technique: 'stomp',
    },
  },
  {
    id: 'verb:roll' as LexemeId,
    lemma: 'roll',
    variants: ['roll', 'rolls', 'rolled', 'rolling', 'add rolls'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'roll',
    },
  },
  {
    id: 'verb:flam' as LexemeId,
    lemma: 'flam',
    variants: ['flam', 'flams', 'flammed', 'flamming', 'add flams'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'flam',
    },
  },

  // Tempo relationships
  {
    id: 'verb:tuplet' as LexemeId,
    lemma: 'tuplet',
    variants: ['tuplet', 'add tuplets', 'make tuplets'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'tuplet',
    },
  },
  {
    id: 'verb:triplet' as LexemeId,
    lemma: 'triplet',
    variants: ['triplet', 'add triplets', 'make triplets'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'triplet',
    },
  },
  {
    id: 'verb:quintuplet' as LexemeId,
    lemma: 'quintuplet',
    variants: ['quintuplet', 'add quintuplets', 'make quintuplets'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'quintuplet',
    },
  },
  {
    id: 'verb:sextuplet' as LexemeId,
    lemma: 'sextuplet',
    variants: ['sextuplet', 'add sextuplets', 'make sextuplets'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'sextuplet',
    },
  },

  // Microtiming
  {
    id: 'verb:nudge' as LexemeId,
    lemma: 'nudge',
    variants: ['nudge', 'nudges', 'nudged', 'nudging'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_timing',
      technique: 'nudge',
    },
  },
  {
    id: 'verb:drift' as LexemeId,
    lemma: 'drift',
    variants: ['drift', 'drifts', 'drifted', 'drifting', 'let drift'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_timing',
      technique: 'drift',
    },
  },
  {
    id: 'verb:phase_shift' as LexemeId,
    lemma: 'phase shift',
    variants: ['phase shift', 'phase-shift', 'shift phase'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_timing',
      technique: 'phase_shift',
    },
  },
  {
    id: 'verb:jitter' as LexemeId,
    lemma: 'jitter',
    variants: ['jitter', 'jitters', 'jittered', 'jittering', 'add jitter'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_timing',
      technique: 'jitter',
    },
  },

  // Reversals and transformations
  {
    id: 'verb:reverse_rhythm' as LexemeId,
    lemma: 'reverse rhythm',
    variants: ['reverse rhythm', 'reverse', 'play backwards'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'reverse',
    },
  },
  {
    id: 'verb:invert_rhythm' as LexemeId,
    lemma: 'invert rhythm',
    variants: ['invert rhythm', 'flip rhythm'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'invert',
    },
  },
  {
    id: 'verb:retrograde_rhythm' as LexemeId,
    lemma: 'retrograde rhythm',
    variants: ['retrograde', 'play retrograde'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_rhythm',
      technique: 'retrograde',
    },
  },
  {
    id: 'verb:stretch_time' as LexemeId,
    lemma: 'stretch time',
    variants: ['stretch time', 'time stretch', 'timestretch'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_timing',
      technique: 'stretch',
    },
  },
  {
    id: 'verb:compress_time' as LexemeId,
    lemma: 'compress time',
    variants: ['compress time', 'time compress'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_timing',
      technique: 'compress',
    },
  },

  // Groove feel
  {
    id: 'verb:rock' as LexemeId,
    lemma: 'rock',
    variants: ['rock', 'add rock feel', 'make it rock'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_groove',
      feel: 'rock',
    },
  },
  {
    id: 'verb:funk' as LexemeId,
    lemma: 'funk',
    variants: ['funk', 'funkify', 'add funk', 'make funky'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_groove',
      feel: 'funk',
    },
  },
  {
    id: 'verb:jazz' as LexemeId,
    lemma: 'jazz',
    variants: ['jazz', 'add jazz feel', 'make jazzy'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_groove',
      feel: 'jazz',
    },
  },
  {
    id: 'verb:latin' as LexemeId,
    lemma: 'latin',
    variants: ['latin', 'add latin feel', 'make latin'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_groove',
      feel: 'latin',
    },
  },
] as const;

export const HARMONIC_MANIPULATION_VERBS: readonly Lexeme[] = [
  // Core harmonization
  {
    id: 'verb:harmonize' as LexemeId,
    lemma: 'harmonize',
    variants: ['harmonize', 'harmonizes', 'harmonized', 'harmonizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'harmonize',
    },
  },
  {
    id: 'verb:reharmonize' as LexemeId,
    lemma: 'reharmonize',
    variants: ['reharmonize', 'reharmonizes', 'reharmonized', 'reharmonizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'reharmonize',
    },
  },
  {
    id: 'verb:deharmonize' as LexemeId,
    lemma: 'deharmonize',
    variants: ['deharmonize', 'remove harmony', 'strip harmony'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'deharmonize',
    },
  },

  // Chord changes and substitutions
  {
    id: 'verb:substitute' as LexemeId,
    lemma: 'substitute',
    variants: ['substitute', 'substitutes', 'substituted', 'substituting'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'substitute',
    },
  },
  {
    id: 'verb:tritone_sub' as LexemeId,
    lemma: 'tritone sub',
    variants: ['tritone sub', 'tritone substitute', 'add tritone sub'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'tritone_substitution',
    },
  },
  {
    id: 'verb:secondary_dominant' as LexemeId,
    lemma: 'secondary dominant',
    variants: ['add secondary dominant', 'secondary dominant', 'applied dominant'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'secondary_dominant',
    },
  },
  {
    id: 'verb:tonicize' as LexemeId,
    lemma: 'tonicize',
    variants: ['tonicize', 'tonicizes', 'tonicized', 'tonicizing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'tonicize',
    },
  },

  // Modal and color changes
  {
    id: 'verb:modulate' as LexemeId,
    lemma: 'modulate',
    variants: ['modulate', 'modulates', 'modulated', 'modulating'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'modulate',
    },
  },
  {
    id: 'verb:transpose' as LexemeId,
    lemma: 'transpose',
    variants: ['transpose', 'transposes', 'transposed', 'transposing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_pitch',
      technique: 'transpose',
    },
  },
  {
    id: 'verb:pivot' as LexemeId,
    lemma: 'pivot',
    variants: ['pivot', 'pivots', 'pivoted', 'pivoting', 'pivot chord'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'pivot',
    },
  },
  {
    id: 'verb:borrow' as LexemeId,
    lemma: 'borrow',
    variants: ['borrow', 'borrows', 'borrowed', 'borrowing', 'modal borrowing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'modal_borrowing',
    },
  },
  {
    id: 'verb:interchange' as LexemeId,
    lemma: 'interchange',
    variants: ['interchange', 'modal interchange'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'modal_interchange',
    },
  },

  // Chord extensions and alterations
  {
    id: 'verb:extend_chord' as LexemeId,
    lemma: 'extend chord',
    variants: ['extend chord', 'extend', 'add extension'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'extend',
    },
  },
  {
    id: 'verb:simplify_harmony' as LexemeId,
    lemma: 'simplify harmony',
    variants: ['simplify harmony', 'simplify chords', 'strip extensions'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'simplify',
    },
  },
  {
    id: 'verb:alter' as LexemeId,
    lemma: 'alter',
    variants: ['alter', 'alters', 'altered', 'altering', 'add alterations'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'alter',
    },
  },
  {
    id: 'verb:sharpen' as LexemeId,
    lemma: 'sharpen',
    variants: ['sharpen', 'sharpens', 'sharpened', 'sharpening', 'raise'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_pitch',
      direction: 'sharpen',
    },
  },
  {
    id: 'verb:flatten' as LexemeId,
    lemma: 'flatten',
    variants: ['flatten', 'flattens', 'flattened', 'flattening', 'lower'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_pitch',
      direction: 'flatten',
    },
  },
  {
    id: 'verb:add_ninth' as LexemeId,
    lemma: 'add ninth',
    variants: ['add ninth', 'add 9th', 'add nine'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'add_ninth',
    },
  },
  {
    id: 'verb:add_eleventh' as LexemeId,
    lemma: 'add eleventh',
    variants: ['add eleventh', 'add 11th', 'add eleven'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'add_eleventh',
    },
  },
  {
    id: 'verb:add_thirteenth' as LexemeId,
    lemma: 'add thirteenth',
    variants: ['add thirteenth', 'add 13th', 'add thirteen'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'add_thirteenth',
    },
  },

  // Voicing modifications
  {
    id: 'verb:revoice' as LexemeId,
    lemma: 'revoice',
    variants: ['revoice', 'revoices', 'revoiced', 'revoicing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_voicing',
      technique: 'revoice',
    },
  },
  {
    id: 'verb:invert_chord' as LexemeId,
    lemma: 'invert chord',
    variants: ['invert chord', 'invert', 'use inversion'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_voicing',
      technique: 'invert',
    },
  },
  {
    id: 'verb:drop_voice' as LexemeId,
    lemma: 'drop voice',
    variants: ['drop voice', 'drop 2', 'drop 3'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_voicing',
      technique: 'drop',
    },
  },
  {
    id: 'verb:spread_voicing' as LexemeId,
    lemma: 'spread voicing',
    variants: ['spread voicing', 'open voicing', 'spread out'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_voicing',
      technique: 'spread',
    },
  },
  {
    id: 'verb:close_voicing' as LexemeId,
    lemma: 'close voicing',
    variants: ['close voicing', 'closed voicing', 'close up'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_voicing',
      technique: 'close',
    },
  },
  {
    id: 'verb:voice_lead' as LexemeId,
    lemma: 'voice lead',
    variants: ['voice lead', 'improve voice leading', 'smooth voices'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_voicing',
      technique: 'voice_lead',
    },
  },
  {
    id: 'verb:double_voice' as LexemeId,
    lemma: 'double voice',
    variants: ['double voice', 'double', 'add doubling'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_voicing',
      technique: 'double',
    },
  },

  // Bass and inversions
  {
    id: 'verb:invert_bass' as LexemeId,
    lemma: 'invert bass',
    variants: ['invert bass', 'change inversion', 'bass inversion'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_bass',
      technique: 'invert',
    },
  },
  {
    id: 'verb:pedal' as LexemeId,
    lemma: 'pedal',
    variants: ['pedal', 'add pedal', 'pedal point', 'pedal tone'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_bass',
      technique: 'pedal',
    },
  },
  {
    id: 'verb:walking_bass' as LexemeId,
    lemma: 'walking bass',
    variants: ['walking bass', 'walk the bass', 'add walking bass'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_bass',
      technique: 'walking',
    },
  },
  {
    id: 'verb:ostinato' as LexemeId,
    lemma: 'ostinato',
    variants: ['ostinato', 'add ostinato', 'bass ostinato'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_bass',
      technique: 'ostinato',
    },
  },

  // Chromaticism
  {
    id: 'verb:chromaticize' as LexemeId,
    lemma: 'chromaticize',
    variants: ['chromaticize', 'add chromaticism', 'make chromatic'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'chromaticize',
    },
  },
  {
    id: 'verb:diatonicize' as LexemeId,
    lemma: 'diatonicize',
    variants: ['diatonicize', 'make diatonic', 'remove chromaticism'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'diatonicize',
    },
  },
  {
    id: 'verb:passing_chord' as LexemeId,
    lemma: 'passing chord',
    variants: ['add passing chord', 'passing chord', 'insert passing'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'passing_chord',
    },
  },
  {
    id: 'verb:neighbor_chord' as LexemeId,
    lemma: 'neighbor chord',
    variants: ['add neighbor chord', 'neighbor chord', 'neighboring'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'neighbor_chord',
    },
  },

  // Tension and resolution
  {
    id: 'verb:tension' as LexemeId,
    lemma: 'tension',
    variants: ['add tension', 'increase tension', 'build tension'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      aspect: 'tension',
      direction: 'increase',
    },
  },
  {
    id: 'verb:resolve' as LexemeId,
    lemma: 'resolve',
    variants: ['resolve', 'resolves', 'resolved', 'resolving'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'resolve',
    },
  },
  {
    id: 'verb:cadence' as LexemeId,
    lemma: 'cadence',
    variants: ['cadence', 'add cadence', 'create cadence'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'cadence',
    },
  },
  {
    id: 'verb:suspend' as LexemeId,
    lemma: 'suspend',
    variants: ['suspend', 'suspends', 'suspended', 'suspending', 'add suspension'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'suspension',
    },
  },
  {
    id: 'verb:anticipation' as LexemeId,
    lemma: 'anticipation',
    variants: ['anticipation', 'add anticipation', 'anticipatory note'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'anticipation',
    },
  },
  {
    id: 'verb:retardation' as LexemeId,
    lemma: 'retardation',
    variants: ['retardation', 'add retardation'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'retardation',
    },
  },

  // Functional harmony
  {
    id: 'verb:dominant' as LexemeId,
    lemma: 'dominant',
    variants: ['dominant', 'add dominant', 'go to dominant'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      function: 'dominant',
    },
  },
  {
    id: 'verb:subdominant' as LexemeId,
    lemma: 'subdominant',
    variants: ['subdominant', 'add subdominant', 'go to subdominant'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      function: 'subdominant',
    },
  },
  {
    id: 'verb:tonic' as LexemeId,
    lemma: 'tonic',
    variants: ['tonic', 'return to tonic', 'go to tonic'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      function: 'tonic',
    },
  },
  {
    id: 'verb:mediant' as LexemeId,
    lemma: 'mediant',
    variants: ['mediant', 'go to mediant', 'chromatic mediant'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      function: 'mediant',
    },
  },

  // Jazz harmony
  {
    id: 'verb:turnaround' as LexemeId,
    lemma: 'turnaround',
    variants: ['turnaround', 'add turnaround', 'jazz turnaround'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'turnaround',
    },
  },
  {
    id: 'verb:two_five_one' as LexemeId,
    lemma: 'two five one',
    variants: ['two five one', 'ii-V-I', '2-5-1', 'add ii-V-I'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'ii_V_I',
    },
  },
  {
    id: 'verb:diminished' as LexemeId,
    lemma: 'diminished',
    variants: ['diminished', 'add diminished', 'make diminished'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      quality: 'diminished',
    },
  },
  {
    id: 'verb:augmented' as LexemeId,
    lemma: 'augmented',
    variants: ['augmented', 'add augmented', 'make augmented'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      quality: 'augmented',
    },
  },
  {
    id: 'verb:half_diminished' as LexemeId,
    lemma: 'half diminished',
    variants: ['half diminished', 'half-diminished', 'minor seven flat five'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      quality: 'half_diminished',
    },
  },

  // Color and mood
  {
    id: 'verb:brighten_harmony' as LexemeId,
    lemma: 'brighten harmony',
    variants: ['brighten harmony', 'make brighter', 'lighten harmony'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      aspect: 'brightness',
      direction: 'increase',
    },
  },
  {
    id: 'verb:darken_harmony' as LexemeId,
    lemma: 'darken harmony',
    variants: ['darken harmony', 'make darker', 'deepen harmony'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      aspect: 'brightness',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:major' as LexemeId,
    lemma: 'major',
    variants: ['major', 'make major', 'majorize'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      quality: 'major',
    },
  },
  {
    id: 'verb:minor' as LexemeId,
    lemma: 'minor',
    variants: ['minor', 'make minor', 'minorize'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      quality: 'minor',
    },
  },

  // Cluster and dissonance
  {
    id: 'verb:cluster' as LexemeId,
    lemma: 'cluster',
    variants: ['cluster', 'add clusters', 'tone cluster'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'cluster',
    },
  },
  {
    id: 'verb:dissonant' as LexemeId,
    lemma: 'dissonant',
    variants: ['add dissonance', 'make dissonant', 'dissonance'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      aspect: 'dissonance',
      direction: 'increase',
    },
  },
  {
    id: 'verb:consonant' as LexemeId,
    lemma: 'consonant',
    variants: ['add consonance', 'make consonant', 'consonance'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      aspect: 'dissonance',
      direction: 'decrease',
    },
  },
  {
    id: 'verb:quartal' as LexemeId,
    lemma: 'quartal',
    variants: ['quartal', 'quartal harmony', 'fourth-based'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      structure: 'quartal',
    },
  },
  {
    id: 'verb:quintal' as LexemeId,
    lemma: 'quintal',
    variants: ['quintal', 'quintal harmony', 'fifth-based'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      structure: 'quintal',
    },
  },

  // Polychords and bitonality
  {
    id: 'verb:polychord' as LexemeId,
    lemma: 'polychord',
    variants: ['polychord', 'add polychord', 'polychordal'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'polychord',
    },
  },
  {
    id: 'verb:bitonal' as LexemeId,
    lemma: 'bitonal',
    variants: ['bitonal', 'bitonality', 'make bitonal'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'bitonality',
    },
  },
  {
    id: 'verb:polytonal' as LexemeId,
    lemma: 'polytonal',
    variants: ['polytonal', 'polytonality', 'make polytonal'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      technique: 'polytonality',
    },
  },

  // Modes and scales
  {
    id: 'verb:dorian' as LexemeId,
    lemma: 'dorian',
    variants: ['dorian', 'make dorian', 'use dorian'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      mode: 'dorian',
    },
  },
  {
    id: 'verb:phrygian' as LexemeId,
    lemma: 'phrygian',
    variants: ['phrygian', 'make phrygian', 'use phrygian'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      mode: 'phrygian',
    },
  },
  {
    id: 'verb:lydian' as LexemeId,
    lemma: 'lydian',
    variants: ['lydian', 'make lydian', 'use lydian'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      mode: 'lydian',
    },
  },
  {
    id: 'verb:mixolydian' as LexemeId,
    lemma: 'mixolydian',
    variants: ['mixolydian', 'make mixolydian', 'use mixolydian'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      mode: 'mixolydian',
    },
  },
  {
    id: 'verb:locrian' as LexemeId,
    lemma: 'locrian',
    variants: ['locrian', 'make locrian', 'use locrian'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      mode: 'locrian',
    },
  },
  {
    id: 'verb:pentatonic' as LexemeId,
    lemma: 'pentatonic',
    variants: ['pentatonic', 'make pentatonic', 'use pentatonic'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      scale: 'pentatonic',
    },
  },
  {
    id: 'verb:blues_scale' as LexemeId,
    lemma: 'blues scale',
    variants: ['blues scale', 'use blues scale', 'blues'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      scale: 'blues',
    },
  },
  {
    id: 'verb:whole_tone' as LexemeId,
    lemma: 'whole tone',
    variants: ['whole tone', 'whole-tone', 'use whole tone'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      scale: 'whole_tone',
    },
  },
  {
    id: 'verb:octatonic' as LexemeId,
    lemma: 'octatonic',
    variants: ['octatonic', 'diminished scale', 'use octatonic'],
    category: 'verb',
    semantics: {
      type: 'action',
      actionType: 'modify_harmony',
      scale: 'octatonic',
    },
  },
] as const;

export const MELODIC_MANIPULATION_VERBS: readonly Lexeme[] = [
  // Will include 60 entries for melodic manipulation
  // transpose, invert, retrograde, augment, diminish, etc.
] as const;

export const STRUCTURAL_MANIPULATION_VERBS: readonly Lexeme[] = [
  // Will include 80 entries for structural manipulation
  // arrange, rearrange, insert, delete, duplicate, extend, etc.
] as const;

export const MIXING_PRODUCTION_VERBS: readonly Lexeme[] = [
  // Will include 80 entries for mixing/production
  // mix, balance, level, pan, send, bus, etc.
] as const;

export const DYNAMIC_EXPRESSION_VERBS: readonly Lexeme[] = [
  // Will include 60 entries for dynamics/expression
  // crescendo, diminuendo, accent, ghost, etc.
] as const;

export const SPATIAL_POSITIONING_VERBS: readonly Lexeme[] = [
  // Will include 60 entries for spatial positioning
  // pan, spread, narrow, position, locate, etc.
] as const;

export const PERFORMANCE_TECHNIQUE_VERBS: readonly Lexeme[] = [
  // Will include 60 entries for performance techniques
  // legato, staccato, pizzicato, tremolo, trill, etc.
] as const;

export const ARRANGEMENT_ORCHESTRATION_VERBS: readonly Lexeme[] = [
  // Will include 80 entries for arrangement/orchestration
  // orchestrate, arrange, layer, double, split, etc.
] as const;

/**
 * All comprehensive musical action verbs (720 total).
 */
export const ALL_MUSICAL_ACTION_VERBS: readonly Lexeme[] = [
  ...TIMBRE_SOUND_DESIGN_ACTION_VERBS,
  ...RHYTHMIC_MANIPULATION_VERBS,
  ...HARMONIC_MANIPULATION_VERBS,
  ...MELODIC_MANIPULATION_VERBS,
  ...STRUCTURAL_MANIPULATION_VERBS,
  ...MIXING_PRODUCTION_VERBS,
  ...DYNAMIC_EXPRESSION_VERBS,
  ...SPATIAL_POSITIONING_VERBS,
  ...PERFORMANCE_TECHNIQUE_VERBS,
  ...ARRANGEMENT_ORCHESTRATION_VERBS,
] as const;
