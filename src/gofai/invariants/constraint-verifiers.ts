/**
 * GOFAI Constraint Verifiers — Executable Verification Functions
 *
 * This module provides verifier implementations for each constraint type.
 * Every constraint in the system has a corresponding verifier that can
 * check whether a plan satisfies the constraint.
 *
 * @module gofai/invariants/constraint-verifiers
 */

import {
  constraintSatisfied,
  constraintViolated,
  type ConstraintVerificationResult,
} from './types';

// =============================================================================
// State Snapshot Types
// =============================================================================

/**
 * Represents a note event in the project.
 */
export interface NoteEvent {
  readonly id: string;
  readonly pitch: number;
  readonly velocity: number;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly layerId: string;
}

/**
 * Represents a chord in the project.
 */
export interface ChordEvent {
  readonly id: string;
  readonly root: number;
  readonly quality: string;
  readonly extensions: readonly string[];
  readonly startTick: number;
  readonly durationTicks: number;
}

/**
 * Represents a section in the project.
 */
export interface SectionMarker {
  readonly id: string;
  readonly type: string;
  readonly startTick: number;
  readonly endTick: number;
  readonly name: string;
}

/**
 * Represents a layer/track in the project.
 */
export interface LayerSnapshot {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly notes: readonly NoteEvent[];
  readonly muted: boolean;
  readonly volume: number;
  readonly pan: number;
}

/**
 * Simplified project state for constraint verification.
 */
export interface ProjectStateSnapshot {
  readonly tempo: number;
  readonly timeSignatureNumerator: number;
  readonly timeSignatureDenominator: number;
  readonly keySignature: string;
  readonly sections: readonly SectionMarker[];
  readonly layers: readonly LayerSnapshot[];
  readonly chords: readonly ChordEvent[];
}

// =============================================================================
// Melody Preservation Verifier
// =============================================================================

/**
 * Extract melody signature from notes (pitch sequence).
 */
function extractMelodySignature(notes: readonly NoteEvent[]): string {
  // Sort by start time, then by pitch descending (top voice)
  const sorted = [...notes].sort((a, b) => {
    const timeDiff = a.startTick - b.startTick;
    if (timeDiff !== 0) return timeDiff;
    return b.pitch - a.pitch;
  });

  // Extract pitch sequence (intervals)
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevNote = sorted[i - 1];
    const currNote = sorted[i];
    if (prevNote && currNote) {
      intervals.push(currNote.pitch - prevNote.pitch);
    }
  }

  return intervals.join(',');
}

/**
 * Extract rhythm signature from notes (relative timing).
 */
function extractRhythmSignature(notes: readonly NoteEvent[]): string {
  const sorted = [...notes].sort((a, b) => a.startTick - b.startTick);

  if (sorted.length < 2) return '';

  const firstNote = sorted[0];
  if (!firstNote) return '';
  
  const firstStart = firstNote.startTick;
  const relativeOnsets = sorted.map((n) => n.startTick - firstStart);

  // Normalize to beat fractions
  const ticksPerBeat = 480; // Standard PPQN
  const normalized = relativeOnsets.map((t) => Math.round((t / ticksPerBeat) * 4) / 4);

  return normalized.join(',');
}

/**
 * Verifier for preserve_melody constraint.
 */
export function verifyMelodyPreserved(
  targetLayerId: string,
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const layerBefore = before.layers.find((l) => l.id === targetLayerId);
  const layerAfter = after.layers.find((l) => l.id === targetLayerId);

  if (!layerBefore) {
    return constraintViolated(`Layer ${targetLayerId} not found in before state`);
  }

  if (!layerAfter) {
    return constraintViolated(`Layer ${targetLayerId} was deleted`, {
      layerId: targetLayerId,
    });
  }

  const melodyBefore = extractMelodySignature(layerBefore.notes);
  const melodyAfter = extractMelodySignature(layerAfter.notes);

  if (melodyBefore !== melodyAfter) {
    return constraintViolated(
      `Melody was modified on layer ${targetLayerId}`,
      {
        before: melodyBefore,
        after: melodyAfter,
      }
    );
  }

  const rhythmBefore = extractRhythmSignature(layerBefore.notes);
  const rhythmAfter = extractRhythmSignature(layerAfter.notes);

  if (rhythmBefore !== rhythmAfter) {
    return constraintViolated(
      `Melody rhythm was modified on layer ${targetLayerId}`,
      {
        before: rhythmBefore,
        after: rhythmAfter,
      }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Harmony Preservation Verifier
// =============================================================================

/**
 * Extract chord progression signature.
 */
function extractChordSignature(chords: readonly ChordEvent[]): string {
  const sorted = [...chords].sort((a, b) => a.startTick - b.startTick);

  return sorted
    .map((c) => `${c.root % 12}:${c.quality}`)
    .join(',');
}

/**
 * Verifier for preserve_harmony constraint.
 */
export function verifyHarmonyPreserved(
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const harmonyBefore = extractChordSignature(before.chords);
  const harmonyAfter = extractChordSignature(after.chords);

  if (harmonyBefore !== harmonyAfter) {
    return constraintViolated(
      'Chord progression was modified',
      {
        before: harmonyBefore,
        after: harmonyAfter,
      }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Rhythm Preservation Verifier
// =============================================================================

/**
 * Extract drum pattern signature.
 */
function extractDrumPatternSignature(layers: readonly LayerSnapshot[]): string {
  const drumLayers = layers.filter((l) => l.role === 'rhythm');
  const allDrumNotes = drumLayers.flatMap((l) => l.notes);

  const sorted = [...allDrumNotes].sort((a, b) => a.startTick - b.startTick);

  if (sorted.length === 0) return '';

  const firstNote = sorted[0];
  if (!firstNote) return '';
  
  const firstTick = firstNote.startTick;
  const pattern = sorted.map((n) => `${n.startTick - firstTick}:${n.pitch}`);

  return pattern.join(',');
}

/**
 * Verifier for preserve_rhythm constraint.
 */
export function verifyRhythmPreserved(
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const patternBefore = extractDrumPatternSignature(before.layers);
  const patternAfter = extractDrumPatternSignature(after.layers);

  if (patternBefore !== patternAfter) {
    return constraintViolated(
      'Rhythm pattern was modified',
      {
        before: patternBefore,
        after: patternAfter,
      }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Structure Preservation Verifier
// =============================================================================

/**
 * Extract structure signature from sections.
 */
function extractStructureSignature(sections: readonly SectionMarker[]): string {
  const sorted = [...sections].sort((a, b) => a.startTick - b.startTick);
  return sorted.map((s) => `${s.type}:${s.endTick - s.startTick}`).join(',');
}

/**
 * Verifier for no_structural_change constraint.
 */
export function verifyStructurePreserved(
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const structureBefore = extractStructureSignature(before.sections);
  const structureAfter = extractStructureSignature(after.sections);

  if (structureBefore !== structureAfter) {
    return constraintViolated(
      'Song structure was modified',
      {
        before: structureBefore,
        after: structureAfter,
      }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Tempo Constraint Verifier
// =============================================================================

/**
 * Verifier for tempo constraints.
 */
export function verifyTempoConstraint(
  constraint: { min?: number; max?: number; exact?: number },
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const tempo = after.tempo;

  if (constraint.exact !== undefined && tempo !== constraint.exact) {
    return constraintViolated(
      `Tempo must be exactly ${constraint.exact} BPM`,
      { expected: constraint.exact, actual: tempo }
    );
  }

  if (constraint.min !== undefined && tempo < constraint.min) {
    return constraintViolated(
      `Tempo must be at least ${constraint.min} BPM`,
      { expected: constraint.min, actual: tempo }
    );
  }

  if (constraint.max !== undefined && tempo > constraint.max) {
    return constraintViolated(
      `Tempo must be at most ${constraint.max} BPM`,
      { expected: constraint.max, actual: tempo }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Key Constraint Verifier
// =============================================================================

/**
 * Verifier for key constraints.
 */
export function verifyKeyConstraint(
  expectedKey: string,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  if (after.keySignature !== expectedKey) {
    return constraintViolated(
      `Key must be ${expectedKey}`,
      { expected: expectedKey, actual: after.keySignature }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Meter/Time Signature Verifier
// =============================================================================

/**
 * Verifier for meter constraints.
 */
export function verifyMeterConstraint(
  expectedNum: number,
  expectedDenom: number,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  if (
    after.timeSignatureNumerator !== expectedNum ||
    after.timeSignatureDenominator !== expectedDenom
  ) {
    return constraintViolated(
      `Time signature must be ${expectedNum}/${expectedDenom}`,
      {
        expected: `${expectedNum}/${expectedDenom}`,
        actual: `${after.timeSignatureNumerator}/${after.timeSignatureDenominator}`,
      }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Range Limit Verifier
// =============================================================================

/**
 * Verifier for pitch range constraints.
 */
export function verifyRangeLimit(
  targetLayerId: string,
  minPitch: number,
  maxPitch: number,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const layer = after.layers.find((l) => l.id === targetLayerId);

  if (!layer) {
    return constraintSatisfied(); // Layer doesn't exist, constraint is vacuously true
  }

  for (const note of layer.notes) {
    if (note.pitch < minPitch) {
      return constraintViolated(
        `Note ${note.id} pitch ${note.pitch} is below minimum ${minPitch}`,
        { noteId: note.id, pitch: note.pitch, minPitch }
      );
    }

    if (note.pitch > maxPitch) {
      return constraintViolated(
        `Note ${note.id} pitch ${note.pitch} is above maximum ${maxPitch}`,
        { noteId: note.id, pitch: note.pitch, maxPitch }
      );
    }
  }

  return constraintSatisfied();
}

// =============================================================================
// No New Layers Verifier
// =============================================================================

/**
 * Verifier for no_new_layers constraint.
 */
export function verifyNoNewLayers(
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const beforeIds = new Set(before.layers.map((l) => l.id));
  const newLayers = after.layers.filter((l) => !beforeIds.has(l.id));

  if (newLayers.length > 0) {
    return constraintViolated(
      `${newLayers.length} new layer(s) were added`,
      { newLayerIds: newLayers.map((l) => l.id) }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// No New Chords Verifier
// =============================================================================

/**
 * Verifier for no_new_chords constraint.
 */
export function verifyNoNewChords(
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const beforeIds = new Set(before.chords.map((c) => c.id));
  const newChords = after.chords.filter((c) => !beforeIds.has(c.id));

  if (newChords.length > 0) {
    return constraintViolated(
      `${newChords.length} new chord(s) were added`,
      { newChordIds: newChords.map((c) => c.id) }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// Only Change Verifier
// =============================================================================

/**
 * Verifier for only_change constraint (only specified layers may change).
 */
export function verifyOnlyChange(
  allowedLayerIds: readonly string[],
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const allowedSet = new Set(allowedLayerIds);

  for (const layerBefore of before.layers) {
    if (allowedSet.has(layerBefore.id)) continue;

    const layerAfter = after.layers.find((l) => l.id === layerBefore.id);

    if (!layerAfter) {
      return constraintViolated(
        `Layer ${layerBefore.id} was deleted but is not in allowed list`,
        { layerId: layerBefore.id, allowed: allowedLayerIds }
      );
    }

    // Check if notes changed
    const notesBefore = JSON.stringify(layerBefore.notes);
    const notesAfter = JSON.stringify(layerAfter.notes);

    if (notesBefore !== notesAfter) {
      return constraintViolated(
        `Layer ${layerBefore.id} was modified but is not in allowed list`,
        { layerId: layerBefore.id, allowed: allowedLayerIds }
      );
    }
  }

  // Check for new layers that weren't in the allowed list
  for (const layerAfter of after.layers) {
    if (allowedSet.has(layerAfter.id)) continue;
    
    const layerBefore = before.layers.find((l) => l.id === layerAfter.id);
    
    if (!layerBefore) {
      return constraintViolated(
        `Layer ${layerAfter.id} was added but is not in allowed list`,
        { layerId: layerAfter.id, allowed: allowedLayerIds }
      );
    }
  }

  return constraintSatisfied();
}

// =============================================================================
// Exclude Verifier
// =============================================================================

/**
 * Verifier for exclude constraint (specified layers must not change).
 */
export function verifyExclude(
  excludedLayerIds: readonly string[],
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  for (const layerId of excludedLayerIds) {
    const layerBefore = before.layers.find((l) => l.id === layerId);
    const layerAfter = after.layers.find((l) => l.id === layerId);

    if (!layerBefore && !layerAfter) continue; // Layer doesn't exist

    if (layerBefore && !layerAfter) {
      return constraintViolated(
        `Excluded layer ${layerId} was deleted`,
        { layerId }
      );
    }

    if (!layerBefore && layerAfter) {
      // Layer was created - this is allowed as long as it wasn't supposed to exist
      continue;
    }

    // Both exist - check for changes
    const snapshotBefore = JSON.stringify(layerBefore);
    const snapshotAfter = JSON.stringify(layerAfter);

    if (snapshotBefore !== snapshotAfter) {
      return constraintViolated(
        `Excluded layer ${layerId} was modified`,
        { layerId }
      );
    }
  }

  return constraintSatisfied();
}

// =============================================================================
// Least Change Verifier
// =============================================================================

/**
 * Calculate edit distance between two states.
 */
function calculateEditCost(
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): number {
  let cost = 0;

  // Count layer changes
  const beforeLayerIds = new Set(before.layers.map((l) => l.id));
  const afterLayerIds = new Set(after.layers.map((l) => l.id));

  for (const id of beforeLayerIds) {
    if (!afterLayerIds.has(id)) cost += 100; // Layer deletion is expensive
  }

  for (const id of afterLayerIds) {
    if (!beforeLayerIds.has(id)) cost += 100; // Layer addition is expensive
  }

  // Count note changes per layer
  for (const layerBefore of before.layers) {
    const layerAfter = after.layers.find((l) => l.id === layerBefore.id);
    if (!layerAfter) continue;

    const beforeNoteIds = new Set(layerBefore.notes.map((n) => n.id));
    const afterNoteIds = new Set(layerAfter.notes.map((n) => n.id));

    for (const id of beforeNoteIds) {
      if (!afterNoteIds.has(id)) cost += 1;
    }

    for (const id of afterNoteIds) {
      if (!beforeNoteIds.has(id)) cost += 1;
    }
  }

  // Tempo change
  if (before.tempo !== after.tempo) cost += 10;

  // Key change
  if (before.keySignature !== after.keySignature) cost += 10;

  return cost;
}

/**
 * Verifier for least_change constraint.
 * Note: This verifier is informational - it reports cost but doesn't enforce a limit.
 */
export function verifyLeastChange(
  maxCost: number | undefined,
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const cost = calculateEditCost(before, after);

  if (maxCost !== undefined && cost > maxCost) {
    return constraintViolated(
      `Edit cost ${cost} exceeds maximum ${maxCost}`,
      { cost, maxCost }
    );
  }

  return constraintSatisfied();
}

// =============================================================================
// General Preserve Verifier
// =============================================================================

/**
 * Verifier for general preserve constraint.
 */
export function verifyPreserve(
  targetLayerId: string,
  aspects: readonly ('melody' | 'harmony' | 'rhythm' | 'all')[],
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
): ConstraintVerificationResult {
  const shouldPreserve = (aspect: string) =>
    aspects.includes('all') || aspects.includes(aspect as 'melody' | 'harmony' | 'rhythm');

  if (shouldPreserve('melody')) {
    const melodyResult = verifyMelodyPreserved(targetLayerId, before, after);
    if (!melodyResult.satisfied) return melodyResult;
  }

  if (shouldPreserve('harmony')) {
    const harmonyResult = verifyHarmonyPreserved(before, after);
    if (!harmonyResult.satisfied) return harmonyResult;
  }

  if (shouldPreserve('rhythm')) {
    const rhythmResult = verifyRhythmPreserved(before, after);
    if (!rhythmResult.satisfied) return rhythmResult;
  }

  return constraintSatisfied();
}

// =============================================================================
// Constraint Verifier Registry
// =============================================================================

/**
 * Registry of all constraint verifiers.
 */
export interface ConstraintVerifierRegistry {
  /**
   * Get verifier for a constraint type.
   */
  getVerifier(constraintTypeId: string): ConstraintVerifierFunction | undefined;

  /**
   * Verify a constraint against before/after states.
   */
  verify(
    constraint: { typeId: string; params: Record<string, unknown> },
    before: ProjectStateSnapshot,
    after: ProjectStateSnapshot
  ): ConstraintVerificationResult;
}

/**
 * Type of a constraint verifier function.
 */
export type ConstraintVerifierFunction = (
  params: Record<string, unknown>,
  before: ProjectStateSnapshot,
  after: ProjectStateSnapshot
) => ConstraintVerificationResult;

/**
 * Create the constraint verifier registry.
 */
export function createConstraintVerifierRegistry(): ConstraintVerifierRegistry {
  const verifiers = new Map<string, ConstraintVerifierFunction>();

  // Register built-in verifiers
  verifiers.set('preserve_melody', (params, before, after) => {
    const targetLayerId = params.target as string;
    return verifyMelodyPreserved(targetLayerId, before, after);
  });

  verifiers.set('preserve_harmony', (_params, before, after) => {
    return verifyHarmonyPreserved(before, after);
  });

  verifiers.set('preserve_rhythm', (_params, before, after) => {
    return verifyRhythmPreserved(before, after);
  });

  verifiers.set('preserve', (params, before, after) => {
    const targetLayerId = params.target as string;
    const aspects = (params.aspects as string[]) ?? ['all'];
    return verifyPreserve(targetLayerId, aspects as ('melody' | 'harmony' | 'rhythm' | 'all')[], before, after);
  });

  verifiers.set('no_structural_change', (_params, before, after) => {
    return verifyStructurePreserved(before, after);
  });

  verifiers.set('tempo', (params, _before, after) => {
    return verifyTempoConstraint(params as { min?: number; max?: number; exact?: number }, after);
  });

  verifiers.set('key', (params, _before, after) => {
    return verifyKeyConstraint(params.key as string, after);
  });

  verifiers.set('meter', (params, _before, after) => {
    return verifyMeterConstraint(
      params.numerator as number,
      params.denominator as number,
      after
    );
  });

  verifiers.set('range_limit', (params, _before, after) => {
    return verifyRangeLimit(
      params.target as string,
      params.minPitch as number,
      params.maxPitch as number,
      after
    );
  });

  verifiers.set('no_new_layers', (_params, before, after) => {
    return verifyNoNewLayers(before, after);
  });

  verifiers.set('no_new_chords', (_params, before, after) => {
    return verifyNoNewChords(before, after);
  });

  verifiers.set('only_change', (params, before, after) => {
    return verifyOnlyChange(params.layers as string[], before, after);
  });

  verifiers.set('exclude', (params, before, after) => {
    return verifyExclude(params.layers as string[], before, after);
  });

  verifiers.set('least_change', (params, before, after) => {
    return verifyLeastChange(params.maxCost as number | undefined, before, after);
  });

  return {
    getVerifier(constraintTypeId) {
      return verifiers.get(constraintTypeId);
    },

    verify(constraint, before, after) {
      const verifier = verifiers.get(constraint.typeId);

      if (!verifier) {
        return constraintViolated(
          `No verifier registered for constraint type: ${constraint.typeId}`,
          { constraintTypeId: constraint.typeId }
        );
      }

      return verifier(constraint.params, before, after);
    },
  };
}

/**
 * Default constraint verifier registry.
 */
export const CONSTRAINT_VERIFIERS = createConstraintVerifierRegistry();
