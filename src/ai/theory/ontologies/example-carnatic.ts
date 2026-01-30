/**
 * @fileoverview Example: Carnatic Music Ontology Constraints
 * 
 * Demonstrates how to use namespaced custom constraints for non-Western ontologies.
 * This is an example/documentation file showing the pattern for extension packs.
 * 
 * In a real Carnatic music extension pack, custom constraints would use
 * the `carnatic:` namespace prefix.
 * 
 * @module @cardplay/ai/theory/ontologies/example-carnatic
 * @see to_fix_repo_plan_500.md Change 423
 */

import type { CustomConstraintDefinition, CustomConstraint } from '../custom-constraints';
import { constraintRegistry } from '../custom-constraints';
import type { OntologyPack, OntologyId } from './index';
import { ontologyRegistry } from './index';

// ============================================================================
// CARNATIC ONTOLOGY DEFINITION (Example)
// ============================================================================

/**
 * Example: Carnatic music ontology pack.
 * A real implementation would come from an extension pack.
 */
export const CARNATIC_ONTOLOGY: OntologyPack = {
  id: 'carnatic:core' as OntologyId,
  name: 'Carnatic Music Theory',
  description: 'South Indian classical music system with 72 melakarta ragas',
  pitchSystem: '12-tet', // Uses 12 notes but with different ornamentation
  divisionsPerOctave: 12,
  usesWesternNoteNames: false,
  compatibility: {
    bridges12TET: true,
    bridgeWarning: 'Carnatic gamakas (ornaments) may not translate to Western notation',
    requiresBridging: ['western' as OntologyId],
  },
  prologModules: [
    // Would load carnatic-specific KB modules
    'carnatic/melakarta.pl',
    'carnatic/gamakas.pl',
  ],
};

// ============================================================================
// CARNATIC CONSTRAINT TYPES (Namespaced)
// ============================================================================

/**
 * Example: Melakarta (parent scale) constraint.
 * Uses namespace `carnatic:melakarta` to avoid collision with builtin constraints.
 */
export interface CarnaticMelakartaConstraint extends CustomConstraint {
  readonly type: 'carnatic:melakarta';
  readonly melakartaNumber: number; // 1-72
  readonly name?: string; // Optional ragam name
}

/**
 * Example: Gamaka (ornament) constraint.
 * Uses namespace `carnatic:gamaka`.
 */
export interface CarnaticGamakaConstraint extends CustomConstraint {
  readonly type: 'carnatic:gamaka';
  readonly gamakaType: 'kampita' | 'nokku' | 'sphuritam' | 'pratyahata' | 'other';
  readonly applicableNotes?: readonly string[]; // Swara names
}

// ============================================================================
// CONSTRAINT DEFINITIONS (Implementing CustomConstraintDefinition)
// ============================================================================

/**
 * Example: Melakarta constraint definition.
 * This shows how to register a custom constraint for a non-Western ontology.
 */
const melakartaConstraintDef: CustomConstraintDefinition<CarnaticMelakartaConstraint> = {
  type: 'carnatic:melakarta',
  displayName: 'Melakarta Raga',
  description: 'Specifies one of the 72 melakarta (parent) ragas in Carnatic music',
  category: 'pitch', // Scale/pitch category

  toPrologFact(constraint, specId) {
    const name = constraint.name || `melakarta_${constraint.melakartaNumber}`;
    return `constraint(${specId}, melakarta(${constraint.melakartaNumber}, '${name}')).`;
  },

  toPrologTerm(constraint) {
    const name = constraint.name || `melakarta_${constraint.melakartaNumber}`;
    return `melakarta(${constraint.melakartaNumber}, '${name}')`;
  },

  validate(constraint) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (constraint.melakartaNumber < 1 || constraint.melakartaNumber > 72) {
      errors.push('Melakarta number must be between 1 and 72');
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  getConflicts(constraint, others) {
    const conflicts = [];
    
    // Check for conflicts with Western key constraints (which include mode)
    for (const other of others) {
      if (other.type === 'key') {
        conflicts.push({
          conflictingType: 'key',
          reason: 'Melakarta raga conflicts with Western key/mode. Use one or the other.',
          severity: 'error' as const,
        });
      }
    }

    // Check for multiple melakarta constraints
    for (const other of others) {
      if (other.type === 'carnatic:melakarta' && other !== constraint) {
        conflicts.push({
          conflictingType: 'carnatic:melakarta',
          reason: 'Only one melakarta raga can be specified at a time',
          severity: 'warning' as const,
        });
      }
    }

    return conflicts;
  },
};

/**
 * Example: Gamaka constraint definition.
 */
const gamakaConstraintDef: CustomConstraintDefinition<CarnaticGamakaConstraint> = {
  type: 'carnatic:gamaka',
  displayName: 'Gamaka (Ornament)',
  description: 'Specifies Carnatic ornamentation style',
  category: 'ornament',

  toPrologFact(constraint, specId) {
    const notes = constraint.applicableNotes?.join(', ') || 'all';
    return `constraint(${specId}, gamaka('${constraint.gamakaType}', [${notes}])).`;
  },

  toPrologTerm(constraint) {
    const notes = constraint.applicableNotes?.join(', ') || 'all';
    return `gamaka('${constraint.gamakaType}', [${notes}])`;
  },

  validate(constraint) {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validTypes = ['kampita', 'nokku', 'sphuritam', 'pratyahata', 'other'];
    if (!validTypes.includes(constraint.gamakaType)) {
      errors.push(`gamakaType must be one of: ${validTypes.join(', ')}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  },
};

// ============================================================================
// REGISTRATION (Would be called by extension pack loader)
// ============================================================================

/**
 * Example: How an extension pack would register Carnatic constraints.
 * This would be called by the extension system when loading the pack.
 */
export function registerCarnaticConstraints(): void {
  // Register ontology
  ontologyRegistry.register(
    CARNATIC_ONTOLOGY,
    'carnatic-pack', // Pack ID
    '1.0.0'          // Pack version
  );

  // Register custom constraints with namespaced IDs
  constraintRegistry.register(melakartaConstraintDef);
  constraintRegistry.register(gamakaConstraintDef);
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example: Using Carnatic constraints in a MusicSpec.
 * 
 * ```typescript
 * import type { MusicSpec } from '@cardplay/ai/theory/music-spec';
 * 
 * const carnaticSpec: MusicSpec = {
 *   key: { tonic: 'C', mode: 'major' }, // Bridging to Western key
 *   constraints: [
 *     {
 *       type: 'carnatic:melakarta',
 *       melakartaNumber: 29, // Dheerashankarabharanam
 *       name: 'Dheerashankarabharanam'
 *     },
 *     {
 *       type: 'carnatic:gamaka',
 *       gamakaType: 'kampita',
 *       applicableNotes: ['Ga', 'Ma', 'Dha']
 *     }
 *   ]
 * };
 * ```
 * 
 * The AI engine would:
 * 1. Recognize the `carnatic:` prefix
 * 2. Look up the constraint definition in the custom registry
 * 3. Use the custom toPrologFact() to encode for Prolog
 * 4. Load carnatic-specific KB modules when this ontology is active
 * 5. Validate conflicts (e.g., can't mix melakarta with Western mode)
 */
