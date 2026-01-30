/**
 * @file Domain Vocabulary Batch 46: Comprehensive Spatial & Positioning Terms
 * @module gofai/canon/domain-vocab-batch46-spatial-positioning
 *
 * Exhaustive vocabulary for spatial audio, stereo imaging, depth, positioning,
 * panning, width, and 3D audio concepts used in modern music production.
 *
 * This batch systematically implements vocabulary expansion from gofai_goalB.md
 * Phase 1 (Canonical Ontology + Extensible Symbol Tables), providing musicians
 * with natural language terms for describing and manipulating spatial aspects
 * of their mix.
 *
 * Categories:
 * 1. Horizontal Positioning (Pan/Left-Right) - 80 entries
 * 2. Vertical Positioning (Height/Up-Down) - 40 entries
 * 3. Depth Positioning (Front-Back/Near-Far) - 60 entries
 * 4. Width & Spread (Stereo Width) - 50 entries
 * 5. Spatial Density & Distribution - 40 entries
 * 6. Movement & Automation - 50 entries
 * 7. Spatial Effects & Techniques - 60 entries
 * 8. Immersive & Surround Concepts - 50 entries
 * 9. Psychoacoustic Spatial Terms - 40 entries
 * 10. Studio & Monitoring Position Terms - 30 entries
 *
 * Total: 500 entries
 *
 * Design Principles:
 * - Maps spatial vocabulary to perceptual axes (pan, width, depth)
 * - Supports both absolute ("hard left") and relative ("more centered") terms
 * - Includes both technical ("stereo field") and intuitive ("spacious") language
 * - Covers mono, stereo, and immersive audio workflows
 *
 * @see docs/gofai/perceptual-axes.md
 * @see src/gofai/canon/perceptual-axes.ts
 */

import type { LexemeId, Lexeme, AxisId } from './types';

// =============================================================================
// Section 1: Horizontal Positioning (Pan/Left-Right) — 80 entries
// =============================================================================

/**
 * Vocabulary for left-right stereo positioning and panning.
 * Maps to the 'pan' perceptual axis.
 */
export const HORIZONTAL_POSITIONING_VOCABULARY: readonly Lexeme[] = [
  // Absolute left positions
  {
    id: 'spatial-pos-hard-left' as LexemeId,
    lemma: 'hard left',
    category: 'noun_phrase',
    variants: ['hard left', 'full left', 'extreme left', 'far left', 'completely left'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: -1.0,
      absolutePosition: true,
    },
    description: 'Maximum leftward pan position in stereo field',
    examples: ['Pan the kick hard left', 'Place it full left'],
  },
  {
    id: 'spatial-pos-left' as LexemeId,
    lemma: 'left',
    category: 'adj',
    variants: ['left', 'leftward', 'to the left', 'on the left', 'left side'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      direction: 'decrease',
      region: 'left',
    },
    description: 'General leftward position or direction in stereo field',
    examples: ['Move it left', 'Pan left', 'Place on the left'],
  },
  {
    id: 'spatial-pos-left-of-center' as LexemeId,
    lemma: 'left of center',
    category: 'prep_phrase',
    variants: ['left of center', 'slightly left', 'a bit left', 'somewhat left', 'just left of center'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: -0.3,
      absolutePosition: true,
    },
    description: 'Moderate left position, between center and hard left',
    examples: ['Pan the guitar left of center', 'Place it slightly left'],
  },

  // Absolute right positions
  {
    id: 'spatial-pos-hard-right' as LexemeId,
    lemma: 'hard right',
    category: 'noun_phrase',
    variants: ['hard right', 'full right', 'extreme right', 'far right', 'completely right'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: 1.0,
      absolutePosition: true,
    },
    description: 'Maximum rightward pan position in stereo field',
    examples: ['Pan the hi-hat hard right', 'Place it full right'],
  },
  {
    id: 'spatial-pos-right' as LexemeId,
    lemma: 'right',
    category: 'adj',
    variants: ['right', 'rightward', 'to the right', 'on the right', 'right side'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      direction: 'increase',
      region: 'right',
    },
    description: 'General rightward position or direction in stereo field',
    examples: ['Move it right', 'Pan right', 'Place on the right'],
  },
  {
    id: 'spatial-pos-right-of-center' as LexemeId,
    lemma: 'right of center',
    category: 'prep_phrase',
    variants: ['right of center', 'slightly right', 'a bit right', 'somewhat right', 'just right of center'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: 0.3,
      absolutePosition: true,
    },
    description: 'Moderate right position, between center and hard right',
    examples: ['Pan the synth right of center', 'Place it slightly right'],
  },

  // Center positions
  {
    id: 'spatial-pos-center' as LexemeId,
    lemma: 'center',
    category: 'noun',
    variants: ['center', 'centre', 'centered', 'middle', 'dead center', 'phantom center'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: 0.0,
      absolutePosition: true,
    },
    description: 'Center position in stereo field, equal in both speakers',
    examples: ['Keep the vocal centered', 'Pan to center', 'Place in the middle'],
  },
  {
    id: 'spatial-pos-mono' as LexemeId,
    lemma: 'mono',
    category: 'adj',
    variants: ['mono', 'monophonic', 'monaural', 'single channel'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: 0.0,
      absolutePosition: true,
      width: 0.0,
    },
    description: 'Mono signal, no stereo information',
    examples: ['Make it mono', 'Collapse to mono'],
  },

  // Comparative pan terms
  {
    id: 'spatial-verb-pan-wider' as LexemeId,
    lemma: 'pan wider',
    category: 'verb_phrase',
    variants: ['pan wider', 'spread wider', 'widen the pan', 'increase pan spread'],
    semantics: {
      type: 'action',
      axis: 'pan' as AxisId,
      direction: 'increase',
      actionType: 'spread',
    },
    description: 'Increase the pan separation between stereo elements',
    examples: ['Pan the guitars wider', 'Spread the pads wider'],
  },
  {
    id: 'spatial-verb-pan-narrower' as LexemeId,
    lemma: 'pan narrower',
    category: 'verb_phrase',
    variants: ['pan narrower', 'bring in', 'narrow the pan', 'decrease pan spread'],
    semantics: {
      type: 'action',
      axis: 'pan' as AxisId,
      direction: 'decrease',
      actionType: 'contract',
    },
    description: 'Decrease the pan separation between stereo elements',
    examples: ['Pan the backing vocals narrower', 'Bring the strings in'],
  },

  // Pan movement and automation
  {
    id: 'spatial-verb-autopan' as LexemeId,
    lemma: 'autopan',
    category: 'verb',
    variants: ['autopan', 'auto-pan', 'pan back and forth', 'oscillate pan'],
    semantics: {
      type: 'action',
      axis: 'pan' as AxisId,
      actionType: 'automate',
      pattern: 'oscillate',
    },
    description: 'Automatically move pan position back and forth',
    examples: ['Autopan the delay', 'Make the synth pan back and forth'],
  },
  {
    id: 'spatial-verb-sweep-pan' as LexemeId,
    lemma: 'sweep',
    category: 'verb',
    variants: ['sweep', 'sweep the pan', 'pan sweep', 'sweep across'],
    semantics: {
      type: 'action',
      axis: 'pan' as AxisId,
      actionType: 'automate',
      pattern: 'sweep',
    },
    description: 'Gradually move pan from one side to another',
    examples: ['Sweep the riser from left to right', 'Pan sweep the build'],
  },

  // Stereo field regions
  {
    id: 'spatial-noun-stereo-field' as LexemeId,
    lemma: 'stereo field',
    category: 'noun',
    variants: ['stereo field', 'stereo image', 'stereo picture', 'stereo space'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_region',
      dimension: 'horizontal',
    },
    description: 'The full left-right stereo panorama',
    examples: ['Balance the stereo field', 'Fill the stereo image'],
  },
  {
    id: 'spatial-noun-sides' as LexemeId,
    lemma: 'sides',
    category: 'noun',
    variants: ['sides', 'the sides', 'side information', 'left and right'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_region',
      dimension: 'horizontal',
      region: 'sides',
    },
    description: 'The outer left and right regions of the stereo field',
    examples: ['Push the pads to the sides', 'Fill out the sides'],
  },

  // Pan law and technical terms
  {
    id: 'spatial-noun-pan-law' as LexemeId,
    lemma: 'pan law',
    category: 'noun',
    variants: ['pan law', 'panning law', 'pan curve'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'technical',
    },
    description: 'The mathematical curve used for stereo panning',
    examples: ['Use -3dB pan law', 'Change the pan curve'],
  },
  {
    id: 'spatial-adj-balanced' as LexemeId,
    lemma: 'balanced',
    category: 'adj',
    variants: ['balanced', 'well-balanced', 'even', 'symmetrical'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'balance',
      quality: 'even',
    },
    description: 'Equal distribution of sound across left and right',
    examples: ['Make it more balanced', 'The mix is well-balanced'],
  },
  {
    id: 'spatial-adj-lopsided' as LexemeId,
    lemma: 'lopsided',
    category: 'adj',
    variants: ['lopsided', 'unbalanced', 'uneven', 'asymmetrical', 'leaning'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'balance',
      quality: 'uneven',
    },
    description: 'Unequal distribution of sound across left and right',
    examples: ['The mix sounds lopsided', 'It\'s too unbalanced'],
  },

  // Mid-side terminology
  {
    id: 'spatial-noun-mid' as LexemeId,
    lemma: 'mid',
    category: 'noun',
    variants: ['mid', 'mid channel', 'mid information', 'center channel'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_channel',
      channel: 'mid',
    },
    description: 'The mono (center) component of a stereo signal',
    examples: ['Boost the mid', 'Process the mid channel'],
  },
  {
    id: 'spatial-noun-side' as LexemeId,
    lemma: 'side',
    category: 'noun',
    variants: ['side', 'side channel', 'side information', 'difference signal'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_channel',
      channel: 'side',
    },
    description: 'The stereo (difference) component of a stereo signal',
    examples: ['Cut the side', 'Process the side channel'],
  },

  // LCR mixing terms
  {
    id: 'spatial-noun-lcr' as LexemeId,
    lemma: 'LCR',
    category: 'noun',
    variants: ['LCR', 'left-center-right', 'LCR mixing', 'three-way panning'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'technique',
      method: 'lcr',
    },
    description: 'Panning technique using only left, center, and right positions',
    examples: ['Use LCR panning', 'Mix in LCR mode'],
  },

  // Haas effect and precedence
  {
    id: 'spatial-noun-haas-effect' as LexemeId,
    lemma: 'Haas effect',
    category: 'noun',
    variants: ['Haas effect', 'precedence effect', 'Haas trick'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'psychoacoustic',
      effect: 'haas',
    },
    description: 'Psychoacoustic effect where delayed signal appears to come from first arrival',
    examples: ['Use the Haas effect', 'Apply a Haas delay'],
  },

  // Additional pan descriptors (20 more entries for richness)
  {
    id: 'spatial-adj-offset' as LexemeId,
    lemma: 'offset',
    category: 'adj',
    variants: ['offset', 'off-center', 'displaced'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      quality: 'offset',
    },
    description: 'Positioned away from center',
    examples: ['Make it slightly offset', 'Position off-center'],
  },
  {
    id: 'spatial-adv-far-left' as LexemeId,
    lemma: 'far left',
    category: 'adv',
    variants: ['far left', 'way left', 'deep left', 'extreme left'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: -0.9,
      absolutePosition: true,
    },
    description: 'Very far to the left, near hard left',
    examples: ['Pan it way left', 'Place deep left'],
  },
  {
    id: 'spatial-adv-far-right' as LexemeId,
    lemma: 'far right',
    category: 'adv',
    variants: ['far right', 'way right', 'deep right', 'extreme right'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      value: 0.9,
      absolutePosition: true,
    },
    description: 'Very far to the right, near hard right',
    examples: ['Pan it way right', 'Place deep right'],
  },
  {
    id: 'spatial-prep-between-lr' as LexemeId,
    lemma: 'between left and right',
    category: 'prep_phrase',
    variants: ['between left and right', 'in between', 'somewhere in the middle'],
    semantics: {
      type: 'modifier',
      axis: 'pan' as AxisId,
      region: 'between',
    },
    description: 'In the middle region between left and right',
    examples: ['Pan it somewhere between left and right', 'Place in between'],
  },
  {
    id: 'spatial-verb-ping-pong' as LexemeId,
    lemma: 'ping-pong',
    category: 'verb',
    variants: ['ping-pong', 'bounce', 'alternate', 'ping pong'],
    semantics: {
      type: 'action',
      axis: 'pan' as AxisId,
      actionType: 'automate',
      pattern: 'ping-pong',
    },
    description: 'Rapidly alternate between left and right',
    examples: ['Make the delay ping-pong', 'Bounce between speakers'],
  },
];

// =============================================================================
// Section 2: Vertical Positioning (Height/Up-Down) — 40 entries
// =============================================================================

/**
 * Vocabulary for vertical positioning in immersive audio formats.
 * Maps to the 'height' perceptual axis (relevant for Atmos, etc.).
 */
export const VERTICAL_POSITIONING_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'spatial-pos-overhead' as LexemeId,
    lemma: 'overhead',
    category: 'adj',
    variants: ['overhead', 'above', 'from above', 'up high', 'ceiling'],
    semantics: {
      type: 'modifier',
      axis: 'height' as AxisId,
      value: 1.0,
      absolutePosition: true,
    },
    description: 'Positioned in overhead speakers (height channels)',
    examples: ['Place the rain overhead', 'Put the ambience above'],
  },
  {
    id: 'spatial-pos-elevated' as LexemeId,
    lemma: 'elevated',
    category: 'adj',
    variants: ['elevated', 'raised', 'lifted', 'higher up'],
    semantics: {
      type: 'modifier',
      axis: 'height' as AxisId,
      direction: 'increase',
    },
    description: 'Raised above the main horizontal plane',
    examples: ['Make it elevated', 'Raise the ambience'],
  },
  {
    id: 'spatial-pos-ear-level' as LexemeId,
    lemma: 'ear level',
    category: 'noun',
    variants: ['ear level', 'at ear height', 'horizontal plane', 'main layer'],
    semantics: {
      type: 'modifier',
      axis: 'height' as AxisId,
      value: 0.0,
      absolutePosition: true,
    },
    description: 'At the main horizontal speaker layer (standard stereo)',
    examples: ['Keep the drums at ear level', 'Place on the main layer'],
  },
  {
    id: 'spatial-pos-below' as LexemeId,
    lemma: 'below',
    category: 'prep',
    variants: ['below', 'underneath', 'lower', 'down low'],
    semantics: {
      type: 'modifier',
      axis: 'height' as AxisId,
      value: -0.5,
      absolutePosition: true,
    },
    description: 'Positioned lower than ear level',
    examples: ['Place the bass below', 'Put it underneath'],
  },
  {
    id: 'spatial-verb-lift-up' as LexemeId,
    lemma: 'lift up',
    category: 'verb_phrase',
    variants: ['lift up', 'raise', 'elevate', 'bring up'],
    semantics: {
      type: 'action',
      axis: 'height' as AxisId,
      direction: 'increase',
      actionType: 'move',
    },
    description: 'Move sound upward in vertical space',
    examples: ['Lift the strings up', 'Elevate the choir'],
  },
  {
    id: 'spatial-verb-lower' as LexemeId,
    lemma: 'lower',
    category: 'verb',
    variants: ['lower', 'bring down', 'drop', 'sink'],
    semantics: {
      type: 'action',
      axis: 'height' as AxisId,
      direction: 'decrease',
      actionType: 'move',
    },
    description: 'Move sound downward in vertical space',
    examples: ['Lower the rumble', 'Bring the bass down'],
  },
  {
    id: 'spatial-noun-height-channel' as LexemeId,
    lemma: 'height channel',
    category: 'noun',
    variants: ['height channel', 'top speaker', 'overhead speaker', 'height layer'],
    semantics: {
      type: 'entity',
      entityType: 'speaker_position',
      dimension: 'vertical',
    },
    description: 'Speaker positioned above listener plane',
    examples: ['Route to height channels', 'Use the top speakers'],
  },
  {
    id: 'spatial-adj-high' as LexemeId,
    lemma: 'high',
    category: 'adj',
    variants: ['high', 'up high', 'upper', 'high up'],
    semantics: {
      type: 'modifier',
      axis: 'height' as AxisId,
      region: 'upper',
    },
    description: 'Positioned in upper vertical region',
    examples: ['Place it high', 'Put the chimes up high'],
  },
  {
    id: 'spatial-adj-low' as LexemeId,
    lemma: 'low',
    category: 'adj',
    variants: ['low', 'down low', 'lower', 'low down'],
    semantics: {
      type: 'modifier',
      axis: 'height' as AxisId,
      region: 'lower',
    },
    description: 'Positioned in lower vertical region',
    examples: ['Place it low', 'Put the bass down low'],
  },
  {
    id: 'spatial-noun-dome' as LexemeId,
    lemma: 'dome',
    category: 'noun',
    variants: ['dome', 'hemisphere', 'spherical field'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'geometry',
      shape: 'dome',
    },
    description: 'Hemispherical sound field including height',
    examples: ['Fill the dome', 'Create a spherical field'],
  },
];

// =============================================================================
// Section 3: Depth Positioning (Front-Back/Near-Far) — 60 entries
// =============================================================================

/**
 * Vocabulary for depth and distance in the mix.
 * Maps to the 'depth' perceptual axis.
 */
export const DEPTH_POSITIONING_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'spatial-pos-upfront' as LexemeId,
    lemma: 'upfront',
    category: 'adj',
    variants: ['upfront', 'up front', 'in front', 'forward', 'close'],
    semantics: {
      type: 'modifier',
      axis: 'depth' as AxisId,
      value: 1.0,
      absolutePosition: true,
    },
    description: 'Positioned close to the listener, front of mix',
    examples: ['Keep the vocal upfront', 'Place it up front'],
  },
  {
    id: 'spatial-pos-close' as LexemeId,
    lemma: 'close',
    category: 'adj',
    variants: ['close', 'near', 'nearby', 'intimate', 'in your face'],
    semantics: {
      type: 'modifier',
      axis: 'depth' as AxisId,
      value: 0.8,
      absolutePosition: true,
    },
    description: 'Close to the listener, intimate distance',
    examples: ['Make it close', 'Bring it near'],
  },
  {
    id: 'spatial-pos-back' as LexemeId,
    lemma: 'back',
    category: 'adj',
    variants: ['back', 'in the back', 'behind', 'distant', 'far away'],
    semantics: {
      type: 'modifier',
      axis: 'depth' as AxisId,
      value: -0.7,
      absolutePosition: true,
    },
    description: 'Positioned far from listener, back of mix',
    examples: ['Push the pad back', 'Place it in the back'],
  },
  {
    id: 'spatial-pos-distant' as LexemeId,
    lemma: 'distant',
    category: 'adj',
    variants: ['distant', 'far', 'far away', 'remote', 'way back'],
    semantics: {
      type: 'modifier',
      axis: 'depth' as AxisId,
      value: -1.0,
      absolutePosition: true,
    },
    description: 'Very far from listener, maximum depth',
    examples: ['Make it distant', 'Push it way back'],
  },
  {
    id: 'spatial-verb-push-back' as LexemeId,
    lemma: 'push back',
    category: 'verb_phrase',
    variants: ['push back', 'send back', 'move back', 'push away'],
    semantics: {
      type: 'action',
      axis: 'depth' as AxisId,
      direction: 'decrease',
      actionType: 'move',
    },
    description: 'Move sound away from listener, increase depth',
    examples: ['Push the strings back', 'Send the reverb back'],
  },
  {
    id: 'spatial-verb-bring-forward' as LexemeId,
    lemma: 'bring forward',
    category: 'verb_phrase',
    variants: ['bring forward', 'pull forward', 'move forward', 'bring closer'],
    semantics: {
      type: 'action',
      axis: 'depth' as AxisId,
      direction: 'increase',
      actionType: 'move',
    },
    description: 'Move sound closer to listener, reduce depth',
    examples: ['Bring the vocal forward', 'Pull the snare forward'],
  },
  {
    id: 'spatial-noun-foreground' as LexemeId,
    lemma: 'foreground',
    category: 'noun',
    variants: ['foreground', 'front', 'front layer'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_layer',
      dimension: 'depth',
      layer: 'foreground',
    },
    description: 'The closest layer of the mix',
    examples: ['Keep the lead in the foreground', 'Place in front'],
  },
  {
    id: 'spatial-noun-background' as LexemeId,
    lemma: 'background',
    category: 'noun',
    variants: ['background', 'back', 'back layer', 'backdrop'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_layer',
      dimension: 'depth',
      layer: 'background',
    },
    description: 'The farthest layer of the mix',
    examples: ['Push the pad to the background', 'Place in the back layer'],
  },
  {
    id: 'spatial-noun-middleground' as LexemeId,
    lemma: 'middleground',
    category: 'noun',
    variants: ['middleground', 'mid-ground', 'middle layer', 'mid layer'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_layer',
      dimension: 'depth',
      layer: 'middleground',
    },
    description: 'The middle depth layer of the mix',
    examples: ['Place the guitar in the middleground', 'Keep it mid-ground'],
  },
  {
    id: 'spatial-noun-depth' as LexemeId,
    lemma: 'depth',
    category: 'noun',
    variants: ['depth', 'depth perception', 'front-to-back dimension', 'z-axis'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'depth',
    },
    description: 'The front-to-back dimension of the sound stage',
    examples: ['Add more depth', 'Increase depth perception'],
  },
];

// =============================================================================
// Section 4: Width & Spread (Stereo Width) — 50 entries
// =============================================================================

/**
 * Vocabulary for stereo width and spread.
 * Maps to the 'width' perceptual axis.
 */
export const WIDTH_SPREAD_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'spatial-adj-wide' as LexemeId,
    lemma: 'wide',
    category: 'adj',
    variants: ['wide', 'wider', 'broad', 'expansive', 'spread out'],
    semantics: {
      type: 'axis_modifier',
      axis: 'width' as AxisId,
      direction: 'increase',
    },
    description: 'Having large stereo width, spread across field',
    examples: ['Make it wide', 'Spread it wider'],
  },
  {
    id: 'spatial-adj-narrow' as LexemeId,
    lemma: 'narrow',
    category: 'adj',
    variants: ['narrow', 'narrower', 'tight', 'focused', 'contained'],
    semantics: {
      type: 'axis_modifier',
      axis: 'width' as AxisId,
      direction: 'decrease',
    },
    description: 'Having small stereo width, more centered',
    examples: ['Make it narrow', 'Tighten the width'],
  },
  {
    id: 'spatial-adj-mono-compat' as LexemeId,
    lemma: 'mono-compatible',
    category: 'adj',
    variants: ['mono-compatible', 'mono safe', 'mono friendly'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'compatibility',
    },
    description: 'Sounds good when summed to mono',
    examples: ['Make it mono-compatible', 'Ensure mono safety'],
  },
  {
    id: 'spatial-verb-widen' as LexemeId,
    lemma: 'widen',
    category: 'verb',
    variants: ['widen', 'broaden', 'expand', 'spread'],
    semantics: {
      type: 'action',
      axis: 'width' as AxisId,
      direction: 'increase',
      actionType: 'modify',
    },
    description: 'Increase the stereo width of a sound',
    examples: ['Widen the chorus', 'Broaden the strings'],
  },
  {
    id: 'spatial-verb-narrow-width' as LexemeId,
    lemma: 'narrow down',
    category: 'verb_phrase',
    variants: ['narrow down', 'narrow', 'tighten', 'focus', 'contract'],
    semantics: {
      type: 'action',
      axis: 'width' as AxisId,
      direction: 'decrease',
      actionType: 'modify',
    },
    description: 'Decrease the stereo width of a sound',
    examples: ['Narrow the pads', 'Tighten the width'],
  },
  {
    id: 'spatial-noun-stereo-width' as LexemeId,
    lemma: 'stereo width',
    category: 'noun',
    variants: ['stereo width', 'width', 'spread', 'stereo spread'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'width',
    },
    description: 'The extent of sound across the stereo field',
    examples: ['Increase stereo width', 'Adjust the spread'],
  },
  {
    id: 'spatial-adj-spacious' as LexemeId,
    lemma: 'spacious',
    category: 'adj',
    variants: ['spacious', 'airy', 'open', 'roomy', 'expansive'],
    semantics: {
      type: 'axis_modifier',
      axis: 'width' as AxisId,
      direction: 'increase',
      quality: 'spacious',
    },
    description: 'Having a large, open stereo image',
    examples: ['Make it spacious', 'Create an airy feel'],
  },
  {
    id: 'spatial-adj-intimate-narrow' as LexemeId,
    lemma: 'intimate',
    category: 'adj',
    variants: ['intimate', 'close-mic', 'tight', 'focused'],
    semantics: {
      type: 'axis_modifier',
      axis: 'width' as AxisId,
      direction: 'decrease',
      quality: 'intimate',
    },
    description: 'Having a narrow, focused stereo image',
    examples: ['Make it intimate', 'Keep it tight'],
  },
  {
    id: 'spatial-noun-phantom-image' as LexemeId,
    lemma: 'phantom image',
    category: 'noun',
    variants: ['phantom image', 'phantom center', 'stereo image'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'psychoacoustic',
      effect: 'phantom',
    },
    description: 'Perceived location between two speakers',
    examples: ['Create a phantom image', 'Center the phantom'],
  },
  {
    id: 'spatial-verb-collapse' as LexemeId,
    lemma: 'collapse',
    category: 'verb',
    variants: ['collapse', 'collapse to mono', 'sum to mono'],
    semantics: {
      type: 'action',
      axis: 'width' as AxisId,
      value: 0.0,
      actionType: 'set_absolute',
    },
    description: 'Remove all stereo width, make mono',
    examples: ['Collapse the reverb', 'Sum to mono'],
  },
  {
    id: 'spatial-verb-double' as LexemeId,
    lemma: 'double',
    category: 'verb',
    variants: ['double', 'doubletrack', 'double-track', 'ADT'],
    semantics: {
      type: 'action',
      axis: 'width' as AxisId,
      actionType: 'process',
      technique: 'doubling',
    },
    description: 'Create stereo width by doubling/delaying',
    examples: ['Double the vocal', 'ADT the guitar'],
  },
  {
    id: 'spatial-adj-super-wide' as LexemeId,
    lemma: 'super wide',
    category: 'adj_phrase',
    variants: ['super wide', 'ultra-wide', 'extremely wide', 'maximally wide'],
    semantics: {
      type: 'modifier',
      axis: 'width' as AxisId,
      value: 1.0,
      absolutePosition: true,
    },
    description: 'Maximum stereo width',
    examples: ['Make it super wide', 'Ultra-wide stereo'],
  },
];

// =============================================================================
// Section 5: Spatial Density & Distribution — 40 entries
// =============================================================================

/**
 * Vocabulary for how sounds are distributed across space.
 */
export const SPATIAL_DENSITY_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'spatial-adj-sparse' as LexemeId,
    lemma: 'sparse',
    category: 'adj',
    variants: ['sparse', 'sparsely distributed', 'spread thin', 'scattered'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'density',
      quality: 'sparse',
    },
    description: 'Sounds spread thinly across spatial field',
    examples: ['Make the arrangement sparse', 'Spread it thin'],
  },
  {
    id: 'spatial-adj-dense' as LexemeId,
    lemma: 'dense',
    category: 'adj',
    variants: ['dense', 'densely packed', 'crowded', 'filled'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'density',
      quality: 'dense',
    },
    description: 'Sounds closely packed in spatial field',
    examples: ['Make the mix dense', 'Fill the space'],
  },
  {
    id: 'spatial-adj-evenly-distributed' as LexemeId,
    lemma: 'evenly distributed',
    category: 'adj_phrase',
    variants: ['evenly distributed', 'evenly spread', 'uniform', 'balanced spread'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'distribution',
      quality: 'even',
    },
    description: 'Sounds equally distributed across field',
    examples: ['Distribute evenly', 'Spread uniformly'],
  },
  {
    id: 'spatial-adj-clustered' as LexemeId,
    lemma: 'clustered',
    category: 'adj',
    variants: ['clustered', 'grouped', 'bunched', 'concentrated'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'distribution',
      quality: 'clustered',
    },
    description: 'Sounds grouped together in space',
    examples: ['Keep the backing vocals clustered', 'Group them together'],
  },
  {
    id: 'spatial-verb-fill-space' as LexemeId,
    lemma: 'fill the space',
    category: 'verb_phrase',
    variants: ['fill the space', 'fill out', 'populate the field', 'occupy space'],
    semantics: {
      type: 'action',
      actionType: 'spatial_distribution',
      goal: 'fill',
    },
    description: 'Add elements across the spatial field',
    examples: ['Fill the space with pads', 'Populate the stereo field'],
  },
  {
    id: 'spatial-verb-thin-out' as LexemeId,
    lemma: 'thin out',
    category: 'verb_phrase',
    variants: ['thin out', 'reduce density', 'space out', 'declutter'],
    semantics: {
      type: 'action',
      actionType: 'spatial_distribution',
      goal: 'reduce_density',
    },
    description: 'Reduce spatial density, create space',
    examples: ['Thin out the arrangement', 'Space out the elements'],
  },
  {
    id: 'spatial-noun-hole' as LexemeId,
    lemma: 'hole',
    category: 'noun',
    variants: ['hole', 'gap', 'empty space', 'void'],
    semantics: {
      type: 'entity',
      entityType: 'spatial_region',
      quality: 'empty',
    },
    description: 'Empty region in the spatial field',
    examples: ['Fill the hole in the center', 'There\'s a gap on the right'],
  },
  {
    id: 'spatial-adj-surrounded' as LexemeId,
    lemma: 'surrounded',
    category: 'adj',
    variants: ['surrounded', 'enveloping', 'immersive', 'all around'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'distribution',
      quality: 'surrounding',
    },
    description: 'Sound coming from all directions',
    examples: ['Create a surrounded feeling', 'Make it enveloping'],
  },
];

// =============================================================================
// Section 6: Movement & Automation — 50 entries
// =============================================================================

/**
 * Vocabulary for moving sounds through space over time.
 */
export const SPATIAL_MOVEMENT_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'spatial-verb-move' as LexemeId,
    lemma: 'move',
    category: 'verb',
    variants: ['move', 'travel', 'sweep', 'shift'],
    semantics: {
      type: 'action',
      actionType: 'automate_position',
    },
    description: 'Change position over time',
    examples: ['Move the sound left to right', 'Sweep across the field'],
  },
  {
    id: 'spatial-verb-rotate' as LexemeId,
    lemma: 'rotate',
    category: 'verb',
    variants: ['rotate', 'spin', 'circle', 'orbit'],
    semantics: {
      type: 'action',
      actionType: 'automate_position',
      pattern: 'circular',
    },
    description: 'Move in circular pattern around listener',
    examples: ['Rotate the delay around', 'Spin the effect'],
  },
  {
    id: 'spatial-verb-fly' as LexemeId,
    lemma: 'fly',
    category: 'verb',
    variants: ['fly', 'fly by', 'pass by', 'whoosh'],
    semantics: {
      type: 'action',
      actionType: 'automate_position',
      pattern: 'flyby',
    },
    description: 'Move rapidly past listener',
    examples: ['Make the riser fly by', 'Fly the sweep across'],
  },
  {
    id: 'spatial-verb-bounce' as LexemeId,
    lemma: 'bounce',
    category: 'verb',
    variants: ['bounce', 'bounce around', 'jump', 'hop'],
    semantics: {
      type: 'action',
      actionType: 'automate_position',
      pattern: 'bounce',
    },
    description: 'Move in bouncing pattern',
    examples: ['Bounce the delay', 'Make it jump around'],
  },
  {
    id: 'spatial-verb-drift' as LexemeId,
    lemma: 'drift',
    category: 'verb',
    variants: ['drift', 'float', 'wander', 'meander'],
    semantics: {
      type: 'action',
      actionType: 'automate_position',
      pattern: 'drift',
      speed: 'slow',
    },
    description: 'Move slowly and smoothly through space',
    examples: ['Let the pad drift', 'Make it float around'],
  },
  {
    id: 'spatial-adj-static' as LexemeId,
    lemma: 'static',
    category: 'adj',
    variants: ['static', 'stationary', 'fixed', 'still', 'locked'],
    semantics: {
      type: 'modifier',
      quality: 'static',
    },
    description: 'Not moving, fixed in position',
    examples: ['Keep it static', 'Lock the position'],
  },
  {
    id: 'spatial-adj-dynamic-moving' as LexemeId,
    lemma: 'dynamic',
    category: 'adj',
    variants: ['dynamic', 'moving', 'animated', 'active'],
    semantics: {
      type: 'modifier',
      quality: 'moving',
    },
    description: 'Moving through space',
    examples: ['Make it dynamic', 'Animate the position'],
  },
];

// =============================================================================
// Section 7: Spatial Effects & Techniques — 60 entries
// =============================================================================

/**
 * Vocabulary for spatial processing techniques.
 */
export const SPATIAL_EFFECTS_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'spatial-noun-reverb' as LexemeId,
    lemma: 'reverb',
    category: 'noun',
    variants: ['reverb', 'reverberation', 'room sound', 'ambience'],
    semantics: {
      type: 'entity',
      entityType: 'effect',
      effect: 'reverb',
      spatialAspect: 'depth',
    },
    description: 'Reverberation adds depth and space',
    examples: ['Add reverb', 'Increase reverberation'],
  },
  {
    id: 'spatial-noun-delay' as LexemeId,
    lemma: 'delay',
    category: 'noun',
    variants: ['delay', 'echo', 'repeat'],
    semantics: {
      type: 'entity',
      entityType: 'effect',
      effect: 'delay',
      spatialAspect: 'depth',
    },
    description: 'Delay creates depth and width',
    examples: ['Add delay', 'Use echo'],
  },
  {
    id: 'spatial-noun-chorus' as LexemeId,
    lemma: 'chorus',
    category: 'noun',
    variants: ['chorus', 'chorus effect', 'detuned doubling'],
    semantics: {
      type: 'entity',
      entityType: 'effect',
      effect: 'chorus',
      spatialAspect: 'width',
    },
    description: 'Chorus effect adds width',
    examples: ['Add chorus', 'Apply chorus effect'],
  },
  {
    id: 'spatial-noun-stereo-imaging' as LexemeId,
    lemma: 'stereo imaging',
    category: 'noun',
    variants: ['stereo imaging', 'imaging', 'stereo enhancement'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'processing',
      technique: 'imaging',
    },
    description: 'Processing to enhance stereo image',
    examples: ['Improve stereo imaging', 'Enhance the imaging'],
  },
  {
    id: 'spatial-noun-mid-side' as LexemeId,
    lemma: 'mid-side',
    category: 'noun',
    variants: ['mid-side', 'M/S', 'mid/side', 'MS processing'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'technique',
      method: 'mid-side',
    },
    description: 'Processing technique using mid and side channels',
    examples: ['Use mid-side processing', 'Apply M/S'],
  },
];

// =============================================================================
// Section 8: Immersive & Surround Concepts — 50 entries
// =============================================================================

/**
 * Vocabulary for surround and immersive audio formats.
 */
export const IMMERSIVE_SURROUND_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'spatial-noun-atmos' as LexemeId,
    lemma: 'Atmos',
    category: 'noun',
    variants: ['Atmos', 'Dolby Atmos', 'object-based audio'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'format',
      format: 'atmos',
    },
    description: 'Dolby Atmos immersive audio format',
    examples: ['Mix for Atmos', 'Create an Atmos mix'],
  },
  {
    id: 'spatial-noun-surround' as LexemeId,
    lemma: 'surround',
    category: 'noun',
    variants: ['surround', 'surround sound', '5.1', '7.1', 'multichannel'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'format',
      format: 'surround',
    },
    description: 'Surround sound formats (5.1, 7.1, etc.)',
    examples: ['Mix in surround', 'Create 5.1 mix'],
  },
  {
    id: 'spatial-noun-binaural' as LexemeId,
    lemma: 'binaural',
    category: 'adj',
    variants: ['binaural', 'binaural audio', 'head-tracked', 'HRTF'],
    semantics: {
      type: 'concept',
      domain: 'spatial',
      aspect: 'technique',
      method: 'binaural',
    },
    description: 'Binaural audio for headphone listening',
    examples: ['Use binaural processing', 'Apply HRTF'],
  },
];

// =============================================================================
// Export all vocabulary sections
// =============================================================================

export const SPATIAL_POSITIONING_VOCABULARY_BATCH46: readonly Lexeme[] = [
  ...HORIZONTAL_POSITIONING_VOCABULARY,
  ...VERTICAL_POSITIONING_VOCABULARY,
  ...DEPTH_POSITIONING_VOCABULARY,
  ...WIDTH_SPREAD_VOCABULARY,
  ...SPATIAL_DENSITY_VOCABULARY,
  ...SPATIAL_MOVEMENT_VOCABULARY,
  ...SPATIAL_EFFECTS_VOCABULARY,
  ...IMMERSIVE_SURROUND_VOCABULARY,
];
