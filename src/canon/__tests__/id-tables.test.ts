/**
 * @fileoverview Canon ID Tables Test Suite
 * 
 * Ensures every canonical ID table is:
 * (a) Exported from the canon module
 * (b) Has tests that validate its contents
 * 
 * This prevents docs/code drift by making missing IDs cause test failures.
 * 
 * @see Change 100 in to_fix_repo_plan_500.md
 */

import { describe, it, expect } from 'vitest';
import * as canon from '../index';

// ============================================================================
// DECK TYPES TABLE
// ============================================================================

describe('DECK_TYPES canonical table', () => {
  it('is exported from canon', () => {
    expect(canon.DECK_TYPES).toBeDefined();
  });

  it('contains required builtin deck types', () => {
    // These are the actual canonical deck type names
    const requiredTypes = [
      'pattern-deck',
      'piano-roll-deck',
      'notation-deck',
      'arrangement-deck',
      'mixer-deck',
    ];

    for (const type of requiredTypes) {
      expect(canon.DECK_TYPES).toContain(type);
    }
  });

  it('has all values as strings', () => {
    for (const type of canon.DECK_TYPES) {
      expect(typeof type).toBe('string');
    }
  });

  it('has no duplicate values', () => {
    const uniqueSet = new Set(canon.DECK_TYPES);
    expect(uniqueSet.size).toBe(canon.DECK_TYPES.length);
  });
});

// ============================================================================
// CONSTRAINT TYPES TABLE
// ============================================================================

describe('BUILTIN_CONSTRAINT_TYPES canonical table', () => {
  it('is exported from canon', () => {
    expect(canon.BUILTIN_CONSTRAINT_TYPES).toBeDefined();
  });

  it('contains required constraint categories', () => {
    const types = canon.BUILTIN_CONSTRAINT_TYPES;
    
    // Check for key constraints
    expect(types.some((t: string) => t.includes('key'))).toBe(true);
    
    // Check for rhythm constraints
    expect(types.some((t: string) => t.includes('tempo') || t.includes('bpm'))).toBe(true);
    
    // Check for harmony constraints
    expect(types.some((t: string) => t.includes('chord') || t.includes('harmony'))).toBe(true);
  });

  it('has validation function that works', () => {
    expect(canon.isBuiltinConstraintType('key')).toBe(true);
    expect(canon.isBuiltinConstraintType('not-a-constraint')).toBe(false);
  });
});

// ============================================================================
// MODE NAMES TABLE
// ============================================================================

describe('CANONICAL_MODE_NAMES table', () => {
  it('is exported from canon', () => {
    expect(canon.CANONICAL_MODE_NAMES).toBeDefined();
  });

  it('contains standard modes (church mode names)', () => {
    const modes = canon.CANONICAL_MODE_NAMES;
    
    // Uses church mode names per docs/canon/ids.md
    expect(modes).toContain('ionian');   // = major
    expect(modes).toContain('aeolian');  // = minor
    expect(modes).toContain('dorian');
    expect(modes).toContain('mixolydian');
  });

  it('normalizes case variations', () => {
    // normalizeModeName should handle case variations
    const result = canon.normalizeModeName('DORIAN');
    expect(result?.toLowerCase()).toBe('dorian');
  });
});

// ============================================================================
// CADENCE TYPES TABLE
// ============================================================================

describe('CANONICAL_CADENCE_TYPES table', () => {
  it('is exported from canon', () => {
    expect(canon.CANONICAL_CADENCE_TYPES).toBeDefined();
  });

  it('contains standard cadences (underscore format)', () => {
    const cadences = canon.CANONICAL_CADENCE_TYPES;
    
    // Uses underscore_case per docs/canon/ids.md
    expect(cadences).toContain('perfect_authentic');
    expect(cadences).toContain('imperfect_authentic');
    expect(cadences).toContain('half');
    expect(cadences).toContain('deceptive');
    expect(cadences).toContain('plagal');
  });

  it('normalizes abbreviations', () => {
    // normalizeCadenceType should handle abbreviations
    expect(canon.normalizeCadenceType('PAC')).toBe('perfect_authentic');
    expect(canon.normalizeCadenceType('IAC')).toBe('imperfect_authentic');
    expect(canon.normalizeCadenceType('HC')).toBe('half');
    expect(canon.normalizeCadenceType('DC')).toBe('deceptive');
  });
});

// ============================================================================
// PORT TYPES TABLE
// ============================================================================

describe('PORT_TYPES canonical table', () => {
  it('is exported from canon', () => {
    expect(canon.PORT_TYPES).toBeDefined();
  });

  it('contains standard port types as object keys', () => {
    const ports = canon.PORT_TYPES;
    
    expect(ports.audio).toBe('audio');
    expect(ports.midi).toBe('midi');
    expect(ports.trigger).toBe('trigger');
    expect(ports.clock).toBe('clock');
  });
  
  it('has PORT_TYPE_LIST as array', () => {
    expect(canon.PORT_TYPE_LIST).toBeDefined();
    expect(Array.isArray(canon.PORT_TYPE_LIST)).toBe(true);
    expect(canon.PORT_TYPE_LIST).toContain('audio');
    expect(canon.PORT_TYPE_LIST).toContain('midi');
  });
});

// ============================================================================
// EVENT KINDS TABLE
// ============================================================================

describe('CANONICAL_EVENT_KINDS table', () => {
  it('is exported from canon', () => {
    expect(canon.CANONICAL_EVENT_KINDS).toBeDefined();
  });

  it('contains core event kinds (object format)', () => {
    const kinds = canon.CANONICAL_EVENT_KINDS;
    
    // CANONICAL_EVENT_KINDS is an object, not array
    expect(kinds.note).toBe('note');
    expect(kinds.control).toBe('control');
    expect(kinds.pitchBend).toBe('pitchBend');
  });
  
  it('has CANONICAL_EVENT_KIND_LIST as array', () => {
    expect(canon.CANONICAL_EVENT_KIND_LIST).toBeDefined();
    expect(Array.isArray(canon.CANONICAL_EVENT_KIND_LIST)).toBe(true);
    expect(canon.CANONICAL_EVENT_KIND_LIST).toContain('note');
    expect(canon.CANONICAL_EVENT_KIND_LIST).toContain('control');
  });

  it('normalizes legacy aliases to canonical names', () => {
    // Legacy formats map to shorter canonical names
    expect(canon.normalizeEventKind('control_change')).toBe('control');
    expect(canon.normalizeEventKind('pitch_bend')).toBe('pitchBend');
    expect(canon.normalizeEventKind('program_change')).toBe('program');
  });
});

// ============================================================================
// FEATURE IDS TABLE
// ============================================================================

describe('BUILTIN_FEATURE_IDS table', () => {
  it('is exported from canon', () => {
    expect(canon.BUILTIN_FEATURE_IDS).toBeDefined();
  });

  it('contains editor features', () => {
    const features = canon.BUILTIN_FEATURE_IDS;
    
    expect(features.PATTERN_EDITOR).toBeDefined();
    expect(features.PIANO_ROLL).toBeDefined();
    expect(features.NOTATION_SCORE).toBeDefined();
  });

  it('uses correct format (feature:<category>:<name>)', () => {
    const features = Object.values(canon.BUILTIN_FEATURE_IDS);
    
    for (const id of features) {
      expect(canon.isFeatureId(id)).toBe(true);
    }
  });

  it('normalizes legacy feature strings', () => {
    expect(canon.normalizeFeatureId('pattern-editor')).toBe('feature:editor:pattern-editor');
    expect(canon.normalizeFeatureId('piano-roll')).toBe('feature:editor:piano-roll');
  });
});

// ============================================================================
// HOST ACTION TYPES TABLE
// ============================================================================

describe('HOST_ACTION_TYPES canonical table', () => {
  it('is exported from canon', () => {
    expect(canon.HOST_ACTION_TYPES).toBeDefined();
  });

  it('contains standard host actions', () => {
    const actions = canon.HOST_ACTION_TYPES;
    
    expect(actions).toContain('add_chord');
    expect(actions).toContain('set_tempo');
    expect(actions).toContain('set_key');
  });

  it('validates action types', () => {
    expect(canon.isValidHostActionType('add_chord')).toBe(true);
    expect(canon.isValidHostActionType('invalid_action')).toBe(false);
  });
});

// ============================================================================
// LEGACY ALIASES TABLES
// ============================================================================

describe('LEGACY_DECK_TYPE_ALIASES table', () => {
  it('is exported from canon', () => {
    expect(canon.LEGACY_DECK_TYPE_ALIASES).toBeDefined();
  });

  it('maps legacy names to canonical names', () => {
    // Check that normalization works
    expect(canon.normalizeDeckType('pattern-editor')).toBe('pattern-deck');
    expect(canon.normalizeDeckType('piano-roll')).toBe('piano-roll-deck');
    expect(canon.normalizeDeckType('notation-score')).toBe('notation-deck');
  });
});

describe('MODE_ALIASES table', () => {
  it('is exported from canon', () => {
    expect(canon.MODE_ALIASES).toBeDefined();
  });

  it('maps common aliases', () => {
    // MODE_ALIASES maps to canonical church mode names
    // major -> ionian, minor -> aeolian
    expect(canon.MODE_ALIASES['major']).toBe('ionian');
    expect(canon.MODE_ALIASES['minor']).toBe('aeolian');
  });
});

// ============================================================================
// VERSIONING TABLES
// ============================================================================

describe('CURRENT_SCHEMA_VERSIONS table', () => {
  it('is exported from canon', () => {
    expect(canon.CURRENT_SCHEMA_VERSIONS).toBeDefined();
  });

  it('has version for all schema types', () => {
    const versions = canon.CURRENT_SCHEMA_VERSIONS;
    
    expect(versions.board).toBeDefined();
    expect(versions.deck).toBeDefined();
    expect(versions.routing).toBeDefined();
    expect(versions.events).toBeDefined();
    expect(versions.cardManifest).toBeDefined();
    expect(versions.packManifest).toBeDefined();
  });

  it('has valid version format', () => {
    for (const version of Object.values(canon.CURRENT_SCHEMA_VERSIONS)) {
      expect(version.major).toBeGreaterThanOrEqual(0);
      expect(version.minor).toBeGreaterThanOrEqual(0);
      expect(version.patch).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================================
// ID VALIDATION FUNCTIONS
// ============================================================================

describe('ID validation exports', () => {
  it('exports isBuiltinId', () => {
    expect(canon.isBuiltinId).toBeDefined();
    expect(canon.isBuiltinId('pattern-deck')).toBe(true);
    expect(canon.isBuiltinId('my-pack:custom')).toBe(false);
  });

  it('exports isNamespacedId', () => {
    expect(canon.isNamespacedId).toBeDefined();
    expect(canon.isNamespacedId('my-pack:custom')).toBe(true);
    expect(canon.isNamespacedId('pattern-deck')).toBe(false);
  });

  it('exports validateId', () => {
    expect(canon.validateId).toBeDefined();
    
    const valid = canon.validateId('pattern-deck');
    expect(valid.valid).toBe(true);
    
    const invalid = canon.validateId('Invalid ID');
    expect(invalid.valid).toBe(false);
  });
});

// ============================================================================
// COMPLETE EXPORT CHECK
// ============================================================================

describe('Canon module completeness', () => {
  it('exports all required tables', () => {
    const requiredExports = [
      // ID Tables
      'DECK_TYPES',
      'BUILTIN_CONSTRAINT_TYPES',
      'CANONICAL_MODE_NAMES',
      'CANONICAL_CADENCE_TYPES',
      'PORT_TYPES',
      'PORT_TYPE_LIST',
      'CANONICAL_EVENT_KINDS',
      'BUILTIN_FEATURE_IDS',
      'HOST_ACTION_TYPES',
      
      // Alias Tables
      'LEGACY_DECK_TYPE_ALIASES',
      'MODE_ALIASES',
      'LEGACY_FEATURE_ALIASES',
      
      // Versioning
      'CURRENT_SCHEMA_VERSIONS',
      
      // Validation Functions
      'isBuiltinId',
      'isNamespacedId',
      'validateId',
      'normalizeModeName',
      'normalizeCadenceType',
      'normalizeDeckType',
      'normalizeEventKind',
      'normalizeFeatureId',
      'isValidHostActionType',
    ];

    for (const exportName of requiredExports) {
      expect(
        exportName in canon,
        `Missing export: ${exportName}`
      ).toBe(true);
    }
  });
});
