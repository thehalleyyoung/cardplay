/**
 * @fileoverview Ontology Gating for Boards
 * 
 * Change 420: Gating rules - boards declare which ontology packs they allow;
 * AI tools must respect the gate.
 * 
 * This module enforces that:
 * - Boards declare their supported ontologies
 * - AI tools/decks only use compatible ontologies
 * - Cross-ontology operations emit warnings and require explicit bridging
 * 
 * @module @cardplay/boards/gating/ontology-gating
 */

import type { Board, OntologySelection } from '../types';
import type { OntologyId } from '../../ai/theory/ontologies';
import { ontologyRegistry } from '../../ai/theory/ontologies';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of an ontology gate check.
 */
export interface OntologyGateResult {
  /** Whether the operation is allowed */
  readonly allowed: boolean;
  /** Reason if not allowed */
  readonly reason?: string;
  /** Warning message if allowed but requires attention */
  readonly warning?: string;
  /** Whether bridging is required */
  readonly requiresBridging: boolean;
}

/**
 * Context for ontology gating decisions.
 */
export interface OntologyGateContext {
  /** The board being operated on */
  readonly board: Board;
  /** The ontology being requested */
  readonly requestedOntology: OntologyId;
  /** Operation being performed (for diagnostics) */
  readonly operation?: string;
}

// ============================================================================
// ONTOLOGY SELECTION HELPERS
// ============================================================================

/**
 * Normalizes OntologySelection to an array of IDs.
 */
export function normalizeOntologySelection(selection?: OntologySelection): readonly OntologyId[] {
  if (!selection) {
    // Default to Western 12-TET
    return ['western' as OntologyId];
  }
  
  if (Array.isArray(selection)) {
    return selection;
  }
  
  return [selection];
}

/**
 * Gets the allowed ontologies for a board.
 */
export function getAllowedOntologies(board: Board): readonly OntologyId[] {
  return normalizeOntologySelection(board.ontology);
}

/**
 * Gets the primary (first) ontology for a board.
 */
export function getPrimaryOntology(board: Board): OntologyId {
  const allowed = getAllowedOntologies(board);
  return allowed[0] || ('western' as OntologyId);
}

// ============================================================================
// GATING LOGIC
// ============================================================================

/**
 * Checks if an ontology is allowed on a board.
 */
export function isOntologyAllowed(
  board: Board,
  ontologyId: OntologyId
): boolean {
  const allowed = getAllowedOntologies(board);
  return allowed.includes(ontologyId);
}

/**
 * Checks if an operation requiring a specific ontology is allowed.
 */
export function checkOntologyGate(
  context: OntologyGateContext
): OntologyGateResult {
  const { board, requestedOntology, operation } = context;
  const allowedOntologies = getAllowedOntologies(board);
  
  // Check if directly allowed
  if (allowedOntologies.includes(requestedOntology)) {
    return {
      allowed: true,
      requiresBridging: false,
    };
  }
  
  // Check if any allowed ontology can bridge to the requested one
  for (const allowedOntology of allowedOntologies) {
    const compatible = ontologyRegistry.areCompatible(allowedOntology, requestedOntology);
    
    if (compatible) {
      const requiresBridging = ontologyRegistry.requiresBridging(allowedOntology, requestedOntology);
      const warning = requiresBridging
        ? ontologyRegistry.getBridgeWarning(requestedOntology)
        : undefined;
      
      const result: OntologyGateResult = {
        allowed: true,
        requiresBridging,
      };
      
      const finalWarning = warning || (requiresBridging
        ? `Bridging required from ${allowedOntology} to ${requestedOntology}`
        : undefined);
      
      if (finalWarning) {
        return { ...result, warning: finalWarning };
      }
      
      return result;
    }
  }
  
  // Not allowed
  return {
    allowed: false,
    requiresBridging: false,
    reason: operation
      ? `Operation "${operation}" requires ontology "${requestedOntology}" which is not supported by board "${board.name}". Allowed: ${allowedOntologies.join(', ')}`
      : `Ontology "${requestedOntology}" is not supported by board "${board.name}". Allowed: ${allowedOntologies.join(', ')}`,
  };
}

/**
 * Validates that a board's ontology selection is valid.
 */
export function validateBoardOntologySelection(board: Board): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const ontologies = normalizeOntologySelection(board.ontology);
  
  if (ontologies.length === 0) {
    errors.push('Board must support at least one ontology');
  }
  
  // Check that all referenced ontologies are registered
  for (const ontologyId of ontologies) {
    if (!ontologyRegistry.get(ontologyId)) {
      errors.push(`Unknown ontology: ${ontologyId}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Filters operations/cards/tools by ontology compatibility.
 */
export function filterByOntologyCompatibility<T extends { ontology?: OntologyId }>(
  board: Board,
  items: readonly T[]
): readonly T[] {
  const allowed = getAllowedOntologies(board);
  
  return items.filter(item => {
    if (!item.ontology) {
      // Items without ontology requirement are allowed
      return true;
    }
    
    // Check if item's ontology is directly allowed
    if (allowed.includes(item.ontology)) {
      return true;
    }
    
    // Check if compatible via bridging
    return allowed.some(allowedOntology =>
      ontologyRegistry.areCompatible(allowedOntology, item.ontology!)
    );
  });
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

/**
 * Gets diagnostic information about ontology support for a board.
 */
export function getOntologyDiagnostics(board: Board): {
  allowed: readonly OntologyId[];
  primary: OntologyId;
  registered: boolean[];
  warnings: string[];
} {
  const allowed = getAllowedOntologies(board);
  const primary = getPrimaryOntology(board);
  const warnings: string[] = [];
  
  const registered = allowed.map(ontologyId => {
    const reg = ontologyRegistry.get(ontologyId);
    if (!reg) {
      warnings.push(`Ontology "${ontologyId}" is not registered`);
      return false;
    }
    return true;
  });
  
  // Check for cross-ontology compatibility warnings
  if (allowed.length > 1) {
    for (let i = 0; i < allowed.length; i++) {
      for (let j = i + 1; j < allowed.length; j++) {
        if (!ontologyRegistry.areCompatible(allowed[i], allowed[j])) {
          warnings.push(
            `Ontologies "${allowed[i]}" and "${allowed[j]}" may require bridging`
          );
        }
      }
    }
  }
  
  return {
    allowed,
    primary,
    registered,
    warnings,
  };
}

/**
 * Logs ontology gate violations (for debugging).
 */
export function logOntologyGateViolation(
  context: OntologyGateContext,
  result: OntologyGateResult
): void {
  if (!result.allowed) {
    console.warn('[OntologyGating] Operation blocked:', {
      board: context.board.name,
      requestedOntology: context.requestedOntology,
      operation: context.operation,
      reason: result.reason,
    });
  } else if (result.warning) {
    console.warn('[OntologyGating] Warning:', {
      board: context.board.name,
      requestedOntology: context.requestedOntology,
      operation: context.operation,
      warning: result.warning,
      requiresBridging: result.requiresBridging,
    });
  }
}
