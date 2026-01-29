/**
 * @fileoverview Persona KB Loaders
 *
 * Loaders for user-persona-specific Prolog knowledge bases.
 * Each persona (notation-composer, tracker-user, producer, etc.)
 * has a dedicated Prolog file defining workflows, conventions, and rules.
 *
 * M001-M320: Persona-specific knowledge bases.
 *
 * @module @cardplay/ai/knowledge/persona-loader
 */

import { getPrologAdapter, type PrologAdapter } from '../engine/prolog-adapter';

// Persona KBs (loaded at build time via ?raw)
import notationComposerKB from './persona-notation-composer.pl?raw';
import trackerUserKB from './persona-tracker-user.pl?raw';
import soundDesignerKB from './persona-sound-designer.pl?raw';
import producerKB from './persona-producer.pl?raw';
import personaTransitionsKB from './persona-transitions.pl?raw';

// ============================================================================
// PERSONA TYPES
// ============================================================================

/**
 * Available persona identifiers.
 */
export type PersonaId =
  | 'notation-composer'
  | 'tracker-user'
  | 'producer'
  | 'live-performer'
  | 'sound-designer'
  | 'ai-explorer'
  | 'beginner';

/**
 * Persona load status.
 */
export interface PersonaLoadStatus {
  readonly personaId: PersonaId;
  readonly loaded: boolean;
}

// ============================================================================
// STATE
// ============================================================================

const loadedPersonas = new Set<PersonaId>();
const loadPromises = new Map<PersonaId, Promise<void>>();

// ============================================================================
// PERSONA KB MAP
// ============================================================================

const PERSONA_KB_MAP: Partial<Record<PersonaId, string>> = {
  'notation-composer': notationComposerKB,
  'tracker-user': trackerUserKB,
  'sound-designer': soundDesignerKB,
  'producer': producerKB,
};

/**
 * Cross-persona transition KB source.
 * Loaded separately since it spans all personas.
 */
const TRANSITIONS_KB = personaTransitionsKB;
let transitionsLoaded = false;
let transitionsLoadPromise: Promise<void> | null = null;

// ============================================================================
// LOADERS
// ============================================================================

/**
 * Load a persona-specific KB into the Prolog engine.
 *
 * @param personaId - Which persona to load
 * @param adapter - Prolog adapter instance
 */
export async function loadPersonaKB(
  personaId: PersonaId,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (loadedPersonas.has(personaId)) return;

  const existing = loadPromises.get(personaId);
  if (existing) return existing;

  const source = PERSONA_KB_MAP[personaId];
  if (!source) {
    // Persona not yet implemented — silently skip
    return;
  }

  const promise = adapter
    .loadProgram(source, `persona-${personaId}`)
    .then(() => {
      loadedPersonas.add(personaId);
    });

  loadPromises.set(personaId, promise);
  await promise;
}

/**
 * Check if a persona KB is loaded.
 */
export function isPersonaLoaded(personaId: PersonaId): boolean {
  return loadedPersonas.has(personaId);
}

/**
 * Get load status for all personas.
 */
export function getPersonaLoadStatus(): PersonaLoadStatus[] {
  const allPersonas: PersonaId[] = [
    'notation-composer',
    'tracker-user',
    'producer',
    'live-performer',
    'sound-designer',
    'ai-explorer',
    'beginner',
  ];

  return allPersonas.map((id) => ({
    personaId: id,
    loaded: loadedPersonas.has(id),
  }));
}

/**
 * Load the cross-persona transitions KB.
 *
 * @param adapter - Prolog adapter instance
 */
export async function loadPersonaTransitionsKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (transitionsLoaded) return;
  if (transitionsLoadPromise) return transitionsLoadPromise;

  transitionsLoadPromise = adapter
    .loadProgram(TRANSITIONS_KB, 'persona-transitions')
    .then(() => {
      transitionsLoaded = true;
    });

  await transitionsLoadPromise;
}

/**
 * Check if the transitions KB is loaded.
 */
export function isTransitionsLoaded(): boolean {
  return transitionsLoaded;
}

/**
 * Load all available persona KBs (including transitions).
 */
export async function loadAllPersonaKBs(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  for (const personaId of Object.keys(PERSONA_KB_MAP) as PersonaId[]) {
    await loadPersonaKB(personaId, adapter);
  }
  await loadPersonaTransitionsKB(adapter);
}

/**
 * Reset all persona loaders (for testing).
 */
export function resetPersonaLoaders(): void {
  loadedPersonas.clear();
  loadPromises.clear();
  transitionsLoaded = false;
  transitionsLoadPromise = null;
}
