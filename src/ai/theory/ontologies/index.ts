/**
 * @fileoverview Ontology Pack System
 * 
 * Defines the extension surface for music ontology packs.
 * Ontology packs provide alternative music theory frameworks
 * (e.g., Western 12-TET, Carnatic, Just Intonation, Microtonal).
 * 
 * ## Ontology ID Namespacing
 * 
 * - Builtin ontologies use simple IDs: `western`, `12-tet`
 * - Extension ontologies must use namespaced IDs: `carnatic:melakarta`, `just:7-limit`
 * 
 * ## Bridging
 * 
 * When tools from different ontologies interact, bridging is required.
 * The bridge policy defines how to handle cross-ontology operations.
 * 
 * @module @cardplay/ai/theory/ontologies
 * @see to_fix_repo_plan_500.md Change 422
 * @see cardplay/docs/canon/ontologies.md
 */

import type { RegistryEntryProvenance } from '../../../extensions/validators';
import { createBuiltinProvenance, createExtensionProvenance } from '../../../extensions/validators';

// ============================================================================
// ONTOLOGY TYPES
// ============================================================================

/**
 * Ontology ID type (branded for type safety).
 */
export type OntologyId = string & { readonly __brand: 'OntologyId' };

/**
 * Pitch system type.
 */
export type PitchSystem = 
  | '12-tet'      // 12-tone equal temperament
  | 'just'        // Just intonation
  | 'pythagorean' // Pythagorean tuning
  | 'meantone'    // Meantone temperament
  | 'microtonal'  // Custom microtonal
  | 'other';

/**
 * Ontology pack definition.
 */
export interface OntologyPack {
  readonly id: OntologyId;
  readonly name: string;
  readonly description?: string;
  
  /** Base pitch system */
  readonly pitchSystem: PitchSystem;
  
  /** Number of divisions per octave (12 for 12-TET) */
  readonly divisionsPerOctave: number;
  
  /** Whether this ontology uses Western note names (C, D, E, etc.) */
  readonly usesWesternNoteNames: boolean;
  
  /** Custom scale definitions */
  readonly scales?: readonly OntologyScale[];
  
  /** Custom interval definitions */
  readonly intervals?: readonly OntologyInterval[];
  
  /** Compatibility notes */
  readonly compatibility?: OntologyCompatibility;
  
  /** Prolog KB modules for this ontology */
  readonly prologModules?: readonly string[];
}

/**
 * Scale definition within an ontology.
 */
export interface OntologyScale {
  readonly id: string;
  readonly name: string;
  readonly intervals: readonly number[]; // Cents or steps
  readonly description?: string;
}

/**
 * Interval definition within an ontology.
 */
export interface OntologyInterval {
  readonly id: string;
  readonly name: string;
  readonly cents: number;
  readonly ratio?: readonly [number, number]; // For JI
}

/**
 * Compatibility information for an ontology.
 */
export interface OntologyCompatibility {
  /** Can bridge to/from 12-TET */
  readonly bridges12TET: boolean;
  /** Warning when bridging */
  readonly bridgeWarning?: string;
  /** Ontologies this one is compatible with */
  readonly compatibleWith?: readonly OntologyId[];
  /** Ontologies that require explicit bridging */
  readonly requiresBridging?: readonly OntologyId[];
}

/**
 * Registered ontology with provenance.
 */
export interface RegisteredOntology {
  readonly pack: OntologyPack;
  readonly provenance: RegistryEntryProvenance;
}

// ============================================================================
// BUILTIN ONTOLOGIES
// ============================================================================

const WESTERN_12TET: OntologyPack = {
  id: 'western' as OntologyId,
  name: 'Western 12-TET',
  description: '12-tone equal temperament, standard Western music theory',
  pitchSystem: '12-tet',
  divisionsPerOctave: 12,
  usesWesternNoteNames: true,
  compatibility: {
    bridges12TET: true,
  },
};

const JUST_INTONATION: OntologyPack = {
  id: 'just' as OntologyId,
  name: 'Just Intonation',
  description: 'Pure interval ratios based on the harmonic series',
  pitchSystem: 'just',
  divisionsPerOctave: 12, // Variable, but often maps to 12
  usesWesternNoteNames: true,
  compatibility: {
    bridges12TET: true,
    bridgeWarning: 'Just intonation intervals may not map exactly to 12-TET',
  },
};

// ============================================================================
// ONTOLOGY REGISTRY
// ============================================================================

/**
 * Ontology registry singleton.
 */
class OntologyRegistry {
  private ontologies = new Map<string, RegisteredOntology>();
  private listeners = new Set<() => void>();
  private activeOntology: OntologyId = 'western' as OntologyId;

  constructor() {
    // Register builtin ontologies
    this.registerBuiltin(WESTERN_12TET);
    this.registerBuiltin(JUST_INTONATION);
  }

  private registerBuiltin(pack: OntologyPack): void {
    this.ontologies.set(pack.id, {
      pack,
      provenance: createBuiltinProvenance(),
    });
  }

  /**
   * Registers an extension ontology.
   */
  register(
    pack: OntologyPack,
    packId: string,
    packVersion: string
  ): void {
    // Validate namespacing for extension ontologies
    if (!pack.id.includes(':')) {
      throw new Error(
        `Extension ontology ID "${pack.id}" must be namespaced (e.g., "${packId}:${pack.id}")`
      );
    }

    this.ontologies.set(pack.id, {
      pack,
      provenance: createExtensionProvenance(packId, packVersion),
    });

    this.notifyListeners();
  }

  /**
   * Gets an ontology by ID.
   */
  get(ontologyId: OntologyId): RegisteredOntology | undefined {
    return this.ontologies.get(ontologyId);
  }

  /**
   * Gets all registered ontologies.
   */
  getAll(): readonly RegisteredOntology[] {
    return Array.from(this.ontologies.values());
  }

  /**
   * Gets the currently active ontology.
   */
  getActive(): RegisteredOntology {
    return this.ontologies.get(this.activeOntology)!;
  }

  /**
   * Sets the active ontology.
   */
  setActive(ontologyId: OntologyId): void {
    if (!this.ontologies.has(ontologyId)) {
      throw new Error(`Unknown ontology: ${ontologyId}`);
    }
    this.activeOntology = ontologyId;
    this.notifyListeners();
  }

  /**
   * Checks if two ontologies are compatible.
   */
  areCompatible(a: OntologyId, b: OntologyId): boolean {
    if (a === b) return true;

    const ontologyA = this.get(a);
    const ontologyB = this.get(b);

    if (!ontologyA || !ontologyB) return false;

    // Check if either declares compatibility
    const aCompat = ontologyA.pack.compatibility?.compatibleWith || [];
    const bCompat = ontologyB.pack.compatibility?.compatibleWith || [];

    return aCompat.includes(b) || bCompat.includes(a);
  }

  /**
   * Checks if bridging is required between two ontologies.
   */
  requiresBridging(a: OntologyId, b: OntologyId): boolean {
    if (a === b) return false;

    const ontologyA = this.get(a);
    if (!ontologyA) return true;

    const requiresBridging = ontologyA.pack.compatibility?.requiresBridging || [];
    return requiresBridging.includes(b);
  }

  /**
   * Gets the bridge warning for an ontology.
   */
  getBridgeWarning(ontologyId: OntologyId): string | undefined {
    return this.get(ontologyId)?.pack.compatibility?.bridgeWarning;
  }

  /**
   * Subscribes to registry changes.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Error in ontology registry listener:', error);
      }
    }
  }
}

/**
 * Global ontology registry instance.
 */
export const ontologyRegistry = new OntologyRegistry();

/**
 * Get ontology registry for devtools inspection.
 */
export function getOntologyRegistry(): readonly RegisteredOntology[] {
  return ontologyRegistry.getAll();
}

/**
 * Creates an ontology ID from a string.
 */
export function createOntologyId(id: string): OntologyId {
  return id as OntologyId;
}
