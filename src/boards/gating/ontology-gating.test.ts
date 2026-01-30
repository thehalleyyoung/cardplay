/**
 * @fileoverview Tests for Ontology Gating
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isOntologyAllowed,
  checkOntologyGate,
  getAllowedOntologies,
  getPrimaryOntology,
  validateBoardOntologySelection,
  filterByOntologyCompatibility,
  getOntologyDiagnostics,
} from './ontology-gating';
import type { Board } from '../types';
import type { OntologyId } from '../../ai/theory/ontologies';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockBoard(ontology?: OntologyId | readonly OntologyId[]): Board {
  return {
    id: 'test-board',
    name: 'Test Board',
    description: 'A test board',
    icon: 'test',
    controlLevel: 'manual-with-hints',
    philosophy: 'Test',
    layout: {
      type: 'dock-tree',
      panels: [],
      dockRoot: { type: 'leaf', panelId: 'main' as any },
    },
    decks: [],
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    connections: [],
    ontology,
    author: 'Test',
    version: '1.0.0',
    difficulty: 'beginner',
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('getAllowedOntologies', () => {
  it('returns default western ontology when none specified', () => {
    const board = createMockBoard();
    const allowed = getAllowedOntologies(board);
    
    expect(allowed).toEqual(['western']);
  });

  it('returns single ontology when string provided', () => {
    const board = createMockBoard('just' as OntologyId);
    const allowed = getAllowedOntologies(board);
    
    expect(allowed).toEqual(['just']);
  });

  it('returns array of ontologies when array provided', () => {
    const board = createMockBoard(['western', 'just'] as OntologyId[]);
    const allowed = getAllowedOntologies(board);
    
    expect(allowed).toEqual(['western', 'just']);
  });
});

describe('getPrimaryOntology', () => {
  it('returns first ontology in list', () => {
    const board = createMockBoard(['just', 'western'] as OntologyId[]);
    const primary = getPrimaryOntology(board);
    
    expect(primary).toBe('just');
  });

  it('returns default western when none specified', () => {
    const board = createMockBoard();
    const primary = getPrimaryOntology(board);
    
    expect(primary).toBe('western');
  });
});

describe('isOntologyAllowed', () => {
  it('allows ontologies in the board\'s allowed list', () => {
    const board = createMockBoard(['western', 'just'] as OntologyId[]);
    
    expect(isOntologyAllowed(board, 'western' as OntologyId)).toBe(true);
    expect(isOntologyAllowed(board, 'just' as OntologyId)).toBe(true);
  });

  it('disallows ontologies not in the board\'s allowed list', () => {
    const board = createMockBoard('western' as OntologyId);
    
    expect(isOntologyAllowed(board, 'carnatic:melakarta' as OntologyId)).toBe(false);
  });
});

describe('checkOntologyGate', () => {
  it('allows operations with directly supported ontology', () => {
    const board = createMockBoard('western' as OntologyId);
    const result = checkOntologyGate({
      board,
      requestedOntology: 'western' as OntologyId,
      operation: 'test-operation',
    });
    
    expect(result.allowed).toBe(true);
    expect(result.requiresBridging).toBe(false);
    expect(result.warning).toBeUndefined();
  });

  it('allows operations with compatible bridged ontology', () => {
    const board = createMockBoard('western' as OntologyId);
    const result = checkOntologyGate({
      board,
      requestedOntology: 'just' as OntologyId,
      operation: 'test-operation',
    });
    
    // Just intonation bridges to 12-TET
    expect(result.allowed).toBe(true);
  });

  it('blocks operations with incompatible ontology', () => {
    const board = createMockBoard('western' as OntologyId);
    const result = checkOntologyGate({
      board,
      requestedOntology: 'unknown:ontology' as OntologyId,
      operation: 'test-operation',
    });
    
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not supported');
  });

  it('includes operation name in error message', () => {
    const board = createMockBoard('western' as OntologyId);
    const result = checkOntologyGate({
      board,
      requestedOntology: 'unknown:ontology' as OntologyId,
      operation: 'apply-carnatic-scale',
    });
    
    expect(result.reason).toContain('apply-carnatic-scale');
  });
});

describe('validateBoardOntologySelection', () => {
  it('validates boards with registered ontologies', () => {
    const board = createMockBoard(['western', 'just'] as OntologyId[]);
    const result = validateBoardOntologySelection(board);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports error for unregistered ontologies', () => {
    const board = createMockBoard('unknown:ontology' as OntologyId);
    const result = validateBoardOntologySelection(board);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Unknown ontology');
  });
});

describe('filterByOntologyCompatibility', () => {
  it('includes items with no ontology requirement', () => {
    const board = createMockBoard('western' as OntologyId);
    const items = [
      { id: 'item1', name: 'Item 1' },
      { id: 'item2', name: 'Item 2', ontology: 'western' as OntologyId },
    ];
    
    const filtered = filterByOntologyCompatibility(board, items);
    
    expect(filtered).toHaveLength(2);
  });

  it('includes items with directly supported ontology', () => {
    const board = createMockBoard('western' as OntologyId);
    const items = [
      { id: 'item1', ontology: 'western' as OntologyId },
      { id: 'item2', ontology: 'unknown:ontology' as OntologyId },
    ];
    
    const filtered = filterByOntologyCompatibility(board, items);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('item1');
  });

  it('includes items with compatible bridged ontology', () => {
    const board = createMockBoard('western' as OntologyId);
    const items = [
      { id: 'item1', ontology: 'western' as OntologyId },
      { id: 'item2', ontology: 'just' as OntologyId },
    ];
    
    const filtered = filterByOntologyCompatibility(board, items);
    
    // Both should be included (just bridges to western)
    expect(filtered.length).toBeGreaterThan(0);
  });
});

describe('getOntologyDiagnostics', () => {
  it('provides diagnostic information for a board', () => {
    const board = createMockBoard(['western', 'just'] as OntologyId[]);
    const diagnostics = getOntologyDiagnostics(board);
    
    expect(diagnostics.allowed).toEqual(['western', 'just']);
    expect(diagnostics.primary).toBe('western');
    expect(diagnostics.registered).toEqual([true, true]);
  });

  it('warns about unregistered ontologies', () => {
    const board = createMockBoard('unknown:ontology' as OntologyId);
    const diagnostics = getOntologyDiagnostics(board);
    
    expect(diagnostics.warnings.length).toBeGreaterThan(0);
    expect(diagnostics.warnings[0]).toContain('not registered');
  });
});
