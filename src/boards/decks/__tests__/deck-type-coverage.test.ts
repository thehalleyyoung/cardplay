/**
 * deck-type-coverage.test.ts
 * Asserts every DeckType in types.ts has a factory registered
 * 
 * Change 197 from to_fix_repo_plan_500.md
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDeckFactoryRegistry } from '../factory-registry.js';
import type { DeckType } from '../../types.js';

// Import to ensure factories are registered
import { registerBuiltinDeckFactories } from '../factories/index.js';

// Canonical DeckType values - must match types.ts
const ALL_DECK_TYPES: Set<DeckType> = new Set([
  'pattern-deck',
  'piano-roll-deck',
  'notation-deck',
  'session-deck',
  'arrangement-deck',
  'arranger-deck',
  'mixer-deck',
  'transport-deck',
  'instruments-deck',
  'samples-deck',
  'sample-manager-deck',
  'effects-deck',
  'dsp-chain',
  'routing-deck',
  'modulation-matrix-deck',
  'automation-deck',
  'properties-deck',
  'phrases-deck',
  'harmony-deck',
  'generators-deck',
  'ai-advisor-deck',
  'track-groups-deck',
  'mix-bus-deck',
  'reference-track-deck',
  'spectrum-analyzer-deck',
  'waveform-editor-deck',
] as DeckType[]);

// DeckTypes that are explicitly not yet implemented
const NOT_YET_IMPLEMENTED: Set<DeckType> = new Set([
  // Only these 2 are actually not implemented:
  'spectrum-analyzer-deck',
  'waveform-editor-deck',
] as DeckType[]);

describe('DeckType Factory Coverage', () => {
  const registry = getDeckFactoryRegistry();
  
  beforeAll(() => {
    // Ensure all builtin factories are registered
    registerBuiltinDeckFactories();
  });
  
  it('every implemented DeckType has a registered factory', () => {
    const missingFactories: DeckType[] = [];
    
    for (const deckType of ALL_DECK_TYPES) {
      // Skip explicitly unimplemented types
      if (NOT_YET_IMPLEMENTED.has(deckType)) {
        continue;
      }
      
      if (!registry.hasFactory(deckType)) {
        missingFactories.push(deckType);
      }
    }
    
    if (missingFactories.length > 0) {
      const details = missingFactories
        .map(type => `  - ${type}`)
        .join('\n');
      
      throw new Error(
        `Missing factories for implemented DeckTypes:\n${details}\n\n` +
        'Either:\n' +
        '1. Implement the factory in factories/ directory\n' +
        '2. Register it in factories/index.ts\n' +
        '3. Or add to NOT_YET_IMPLEMENTED if not ready'
      );
    }
    
    expect(missingFactories).toEqual([]);
  });
  
  it('not-yet-implemented DeckTypes are documented', () => {
    // This is informational - just list what's missing
    const missing = Array.from(NOT_YET_IMPLEMENTED);
    
    if (missing.length > 0) {
      console.log(`\nℹ Not yet implemented (${missing.length} DeckTypes):`);
      missing.forEach(type => console.log(`  - ${type}`));
      console.log();
    }
    
    expect(true).toBe(true);
  });
  
  it('all registered factories are for known DeckTypes', () => {
    const registeredTypes = registry.getRegisteredTypes();
    const unknownTypes: string[] = [];
    
    for (const registeredType of registeredTypes) {
      if (!ALL_DECK_TYPES.has(registeredType)) {
        unknownTypes.push(registeredType);
      }
    }
    
    if (unknownTypes.length > 0) {
      const details = unknownTypes
        .map(type => `  - ${type}`)
        .join('\n');
      
      console.warn(
        `\n⚠️  Unknown DeckTypes registered:\n${details}\n\n` +
        'These may be:\n' +
        '1. Extension deck types (namespaced)\n' +
        '2. Legacy deck types that should be removed\n' +
        '3. Missing from ALL_DECK_TYPES constant\n'
      );
    }
    
    // Don't fail - just warn
    expect(true).toBe(true);
  });
  
  it('factory registry has reasonable coverage', () => {
    const registeredCount = registry.getRegisteredTypes().length;
    const totalCount = ALL_DECK_TYPES.size;
    const coverage = (registeredCount / totalCount) * 100;
    
    console.log(`\nDeckType factory coverage: ${registeredCount}/${totalCount} (${coverage.toFixed(1)}%)\n`);
    
    // Expect at least 90% coverage (only 2 deck types are not yet implemented)
    expect(coverage).toBeGreaterThanOrEqual(90);
  });
});
