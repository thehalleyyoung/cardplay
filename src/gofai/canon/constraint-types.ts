/**
 * GOFAI Constraint Types — Constraint Vocabulary
 *
 * This module defines the canonical set of constraint types that can
 * appear in GOFAI CPL. Constraints specify what must be preserved
 * or avoided during edits.
 *
 * @module gofai/canon/constraint-types
 */

import {
  type ConstraintType,
  type ConstraintTypeId,
  type VocabularyTable,
  createConstraintTypeId,
  createLexemeId,
  createVocabularyTable,
} from './types';

// =============================================================================
// Preservation Constraints
// =============================================================================

const CONSTRAINT_PRESERVE: ConstraintType = {
  id: createConstraintTypeId('preserve'),
  name: 'Preserve',
  description: 'Preserve a musical element unchanged (or recognizably similar).',
  params: [
    {
      name: 'target',
      type: 'entity_ref',
      required: true,
      description: 'What to preserve (melody, chords, rhythm, etc.)',
    },
    {
      name: 'mode',
      type: 'enum',
      required: false,
      defaultValue: 'exact',
      enumValues: ['exact', 'functional', 'recognizable'],
      description: 'Preservation strictness',
    },
  ],
  defaultHard: true,
  verifier: 'verifyPreservation',
  relatedLexemes: [
    createLexemeId('verb', 'keep'),
    createLexemeId('adv', 'dont'),
  ],
};

const CONSTRAINT_PRESERVE_MELODY: ConstraintType = {
  id: createConstraintTypeId('preserve_melody'),
  name: 'Preserve Melody',
  description: 'Preserve the melodic content.',
  params: [
    {
      name: 'mode',
      type: 'enum',
      required: false,
      defaultValue: 'exact',
      enumValues: ['exact', 'contour', 'recognizable'],
      description: 'Preservation strictness',
    },
    {
      name: 'layer',
      type: 'entity_ref',
      required: false,
      description: 'Specific layer (if not auto-detected)',
    },
  ],
  defaultHard: true,
  verifier: 'verifyMelodyPreservation',
  relatedLexemes: [createLexemeId('verb', 'keep')],
};

const CONSTRAINT_PRESERVE_HARMONY: ConstraintType = {
  id: createConstraintTypeId('preserve_harmony'),
  name: 'Preserve Harmony',
  description: 'Preserve the harmonic content.',
  params: [
    {
      name: 'mode',
      type: 'enum',
      required: false,
      defaultValue: 'functional',
      enumValues: ['exact', 'functional', 'quality'],
      description: 'Preservation strictness',
    },
  ],
  defaultHard: true,
  verifier: 'verifyHarmonyPreservation',
  relatedLexemes: [createLexemeId('verb', 'keep')],
};

const CONSTRAINT_PRESERVE_RHYTHM: ConstraintType = {
  id: createConstraintTypeId('preserve_rhythm'),
  name: 'Preserve Rhythm',
  description: 'Preserve the rhythmic patterns.',
  params: [
    {
      name: 'mode',
      type: 'enum',
      required: false,
      defaultValue: 'exact',
      enumValues: ['exact', 'grid', 'feel'],
      description: 'Preservation strictness',
    },
    {
      name: 'tolerance',
      type: 'number',
      required: false,
      description: 'Timing tolerance in ticks',
    },
  ],
  defaultHard: true,
  verifier: 'verifyRhythmPreservation',
  relatedLexemes: [createLexemeId('verb', 'keep')],
};

// =============================================================================
// Scope Constraints
// =============================================================================

const CONSTRAINT_ONLY_CHANGE: ConstraintType = {
  id: createConstraintTypeId('only_change'),
  name: 'Only Change',
  description: 'Restrict changes to specific targets only.',
  params: [
    {
      name: 'targets',
      type: 'entity_ref',
      required: true,
      description: 'What can be changed',
    },
  ],
  defaultHard: true,
  verifier: 'verifyOnlyChange',
  relatedLexemes: [createLexemeId('adv', 'only')],
};

const CONSTRAINT_EXCLUDE: ConstraintType = {
  id: createConstraintTypeId('exclude'),
  name: 'Exclude',
  description: 'Exclude specific targets from changes.',
  params: [
    {
      name: 'targets',
      type: 'entity_ref',
      required: true,
      description: 'What to exclude',
    },
  ],
  defaultHard: true,
  verifier: 'verifyExclude',
  relatedLexemes: [createLexemeId('prep', 'without')],
};

// =============================================================================
// Musical Constraints
// =============================================================================

const CONSTRAINT_TEMPO: ConstraintType = {
  id: createConstraintTypeId('tempo'),
  name: 'Tempo',
  description: 'Constrain tempo to a specific value or range.',
  params: [
    {
      name: 'bpm',
      type: 'number',
      required: true,
      description: 'Target tempo in BPM',
    },
    {
      name: 'tolerance',
      type: 'number',
      required: false,
      defaultValue: 0,
      description: 'Tolerance in BPM',
    },
  ],
  defaultHard: false,
  verifier: 'verifyTempo',
  relatedLexemes: [],
};

const CONSTRAINT_KEY: ConstraintType = {
  id: createConstraintTypeId('key'),
  name: 'Key',
  description: 'Constrain to a specific key.',
  params: [
    {
      name: 'root',
      type: 'string',
      required: true,
      description: 'Root note (C, D, E, etc.)',
    },
    {
      name: 'mode',
      type: 'string',
      required: false,
      defaultValue: 'major',
      description: 'Mode (major, minor, dorian, etc.)',
    },
  ],
  defaultHard: false,
  verifier: 'verifyKey',
  relatedLexemes: [],
};

const CONSTRAINT_METER: ConstraintType = {
  id: createConstraintTypeId('meter'),
  name: 'Meter',
  description: 'Constrain to a specific time signature.',
  params: [
    {
      name: 'numerator',
      type: 'number',
      required: true,
      description: 'Beats per bar',
    },
    {
      name: 'denominator',
      type: 'number',
      required: true,
      description: 'Beat unit',
    },
  ],
  defaultHard: true,
  verifier: 'verifyMeter',
  relatedLexemes: [],
};

const CONSTRAINT_RANGE_LIMIT: ConstraintType = {
  id: createConstraintTypeId('range_limit'),
  name: 'Range Limit',
  description: 'Constrain notes to a specific pitch range.',
  params: [
    {
      name: 'layer',
      type: 'entity_ref',
      required: false,
      description: 'Layer to constrain',
    },
    {
      name: 'midiMin',
      type: 'number',
      required: true,
      description: 'Minimum MIDI note',
    },
    {
      name: 'midiMax',
      type: 'number',
      required: true,
      description: 'Maximum MIDI note',
    },
  ],
  defaultHard: true,
  verifier: 'verifyRangeLimit',
  relatedLexemes: [],
};

// =============================================================================
// Structural Constraints
// =============================================================================

const CONSTRAINT_NO_NEW_LAYERS: ConstraintType = {
  id: createConstraintTypeId('no_new_layers'),
  name: 'No New Layers',
  description: 'Do not add any new tracks or layers.',
  params: [],
  defaultHard: false,
  verifier: 'verifyNoNewLayers',
  relatedLexemes: [],
};

const CONSTRAINT_NO_NEW_CHORDS: ConstraintType = {
  id: createConstraintTypeId('no_new_chords'),
  name: 'No New Chords',
  description: 'Do not introduce new chord types.',
  params: [],
  defaultHard: false,
  verifier: 'verifyNoNewChords',
  relatedLexemes: [],
};

const CONSTRAINT_NO_STRUCTURAL_CHANGE: ConstraintType = {
  id: createConstraintTypeId('no_structural_change'),
  name: 'No Structural Change',
  description: 'Do not change song structure (sections, form).',
  params: [],
  defaultHard: true,
  verifier: 'verifyNoStructuralChange',
  relatedLexemes: [],
};

// =============================================================================
// Preference Constraints (Soft)
// =============================================================================

const CONSTRAINT_LEAST_CHANGE: ConstraintType = {
  id: createConstraintTypeId('least_change'),
  name: 'Least Change',
  description: 'Prefer minimal changes to achieve the goal.',
  params: [],
  defaultHard: false,
  verifier: 'verifyLeastChange',
  relatedLexemes: [],
};

const CONSTRAINT_PREFER_LAYER: ConstraintType = {
  id: createConstraintTypeId('prefer_layer'),
  name: 'Prefer Layer',
  description: 'Prefer changes on a specific layer.',
  params: [
    {
      name: 'layer',
      type: 'entity_ref',
      required: true,
      description: 'Preferred layer',
    },
  ],
  defaultHard: false,
  verifier: 'verifyPreferLayer',
  relatedLexemes: [],
};

// =============================================================================
// Constraint Table
// =============================================================================

/**
 * All core constraint types.
 */
export const CORE_CONSTRAINT_TYPES: readonly ConstraintType[] = [
  // Preservation
  CONSTRAINT_PRESERVE,
  CONSTRAINT_PRESERVE_MELODY,
  CONSTRAINT_PRESERVE_HARMONY,
  CONSTRAINT_PRESERVE_RHYTHM,
  // Scope
  CONSTRAINT_ONLY_CHANGE,
  CONSTRAINT_EXCLUDE,
  // Musical
  CONSTRAINT_TEMPO,
  CONSTRAINT_KEY,
  CONSTRAINT_METER,
  CONSTRAINT_RANGE_LIMIT,
  // Structural
  CONSTRAINT_NO_NEW_LAYERS,
  CONSTRAINT_NO_NEW_CHORDS,
  CONSTRAINT_NO_STRUCTURAL_CHANGE,
  // Preference
  CONSTRAINT_LEAST_CHANGE,
  CONSTRAINT_PREFER_LAYER,
];

/**
 * Constraint vocabulary table.
 */
export const CONSTRAINT_TYPES_TABLE: VocabularyTable<ConstraintType> =
  createVocabularyTable(CORE_CONSTRAINT_TYPES);

// =============================================================================
// Constraint Utilities
// =============================================================================

/**
 * Get a constraint type by ID.
 */
export function getConstraintTypeById(id: ConstraintTypeId): ConstraintType | undefined {
  return CONSTRAINT_TYPES_TABLE.byId.get(id);
}

/**
 * Get a constraint type by name.
 */
export function getConstraintTypeByName(name: string): ConstraintType | undefined {
  return CONSTRAINT_TYPES_TABLE.byVariant.get(name.toLowerCase());
}

/**
 * Get all hard constraints.
 */
export function getHardConstraintTypes(): readonly ConstraintType[] {
  return CORE_CONSTRAINT_TYPES.filter(c => c.defaultHard);
}

/**
 * Get all soft constraints (preferences).
 */
export function getSoftConstraintTypes(): readonly ConstraintType[] {
  return CORE_CONSTRAINT_TYPES.filter(c => !c.defaultHard);
}

// =============================================================================
// Preservation Modes
// =============================================================================

/**
 * Preservation mode for melody.
 */
export type MelodyPreservationMode =
  | 'exact' // Exact pitch and rhythm
  | 'contour' // Same contour, may transpose
  | 'recognizable'; // Recognizable as the same melody

/**
 * Preservation mode for harmony.
 */
export type HarmonyPreservationMode =
  | 'exact' // Exact chord voicings
  | 'functional' // Same functional harmony (can revoice)
  | 'quality'; // Same chord qualities (can substitute)

/**
 * Preservation mode for rhythm.
 */
export type RhythmPreservationMode =
  | 'exact' // Exact timing
  | 'grid' // Same grid positions, may swing
  | 'feel'; // Same rhythmic feel, may vary

/**
 * Get the verification requirements for a preservation mode.
 */
export function getPreservationVerificationLevel(
  mode: MelodyPreservationMode | HarmonyPreservationMode | RhythmPreservationMode
): 'strict' | 'moderate' | 'loose' {
  switch (mode) {
    case 'exact':
      return 'strict';
    case 'contour':
    case 'functional':
    case 'grid':
      return 'moderate';
    case 'recognizable':
    case 'quality':
    case 'feel':
      return 'loose';
    default:
      return 'strict';
  }
}

// =============================================================================
// Constraint Conflict Detection
// =============================================================================

/**
 * Check if two constraints potentially conflict.
 */
export function constraintsConflict(
  a: ConstraintType,
  b: ConstraintType
): boolean {
  // Preserve and only_change can conflict if targets overlap
  if (
    (a.id === createConstraintTypeId('preserve') &&
      b.id === createConstraintTypeId('only_change')) ||
    (b.id === createConstraintTypeId('preserve') &&
      a.id === createConstraintTypeId('only_change'))
  ) {
    return true; // Needs runtime check based on params
  }

  // Preserve and exclude can conflict
  if (
    (a.id === createConstraintTypeId('preserve') &&
      b.id === createConstraintTypeId('exclude')) ||
    (b.id === createConstraintTypeId('preserve') &&
      a.id === createConstraintTypeId('exclude'))
  ) {
    return true; // Needs runtime check based on params
  }

  return false;
}

/**
 * Get constraints that are commonly used together.
 */
export function getRelatedConstraints(
  constraintId: ConstraintTypeId
): readonly ConstraintTypeId[] {
  const related: Record<string, readonly ConstraintTypeId[]> = {
    [createConstraintTypeId('preserve_melody')]: [
      createConstraintTypeId('preserve_rhythm'),
      createConstraintTypeId('range_limit'),
    ],
    [createConstraintTypeId('preserve_harmony')]: [
      createConstraintTypeId('key'),
      createConstraintTypeId('no_new_chords'),
    ],
    [createConstraintTypeId('only_change')]: [createConstraintTypeId('least_change')],
  };

  return related[constraintId] ?? [];
}
