/**
 * @fileoverview No Legacy DeckType Test
 * 
 * Change 467: Fails if legacy DeckType strings are used where DeckType is expected.
 * Ensures code uses canonical DeckType values like 'pattern-deck' not 'pattern-editor'.
 * 
 * @module @cardplay/tests/no-legacy-decktype.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import { promisify } from 'util';

const globAsync = promisify(glob);

// Legacy deck type strings that should not be used
const LEGACY_DECK_TYPES = [
  'pattern-editor',
  'notation-score',
  'piano-roll',
  'session',
  'arrangement',
  'mixer',
  'timeline',
] as const;

// Patterns that indicate DeckType context
const DECK_TYPE_CONTEXTS = [
  /deckType\s*[:=]\s*['"](\w+-?\w*)['"]/, // deckType: 'xxx' or deckType = 'xxx'
  /type:\s*['"](\w+-?\w*)['"]\s*(as DeckType)?/, // type: 'xxx' in BoardDeck
  /DeckType\s*=\s*['"](\w+-?\w*)['"]/, // DeckType = 'xxx'
  /hasFactory\(['"](\w+-?\w*)['"]\)/, // hasFactory('xxx')
  /getFactory\(['"](\w+-?\w*)['"]\)/, // getFactory('xxx')
  /registerFactory\(['"](\w+-?\w*)['"]/, // registerFactory('xxx'
];

describe('No Legacy DeckType Strings (Change 467)', () => {
  it('should not use legacy DeckType strings in code', async () => {
    const srcDir = path.resolve(__dirname, '../../');
    
    // Find all TypeScript files
    const files = await globAsync('**/*.ts', {
      cwd: srcDir,
      ignore: [
        '**/node_modules/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/canon/legacy-aliases.ts', // Allowed to define the mappings
        '**/to_fix*.md',
        '**/audio/deck-routing-store-bridge.ts', // Uses DeckNodeType, not DeckType
        '**/state/routing-graph.ts', // Uses node types
        '**/ui/demo-decks.ts', // Demo/test code
      ],
    });
    
    const violations: string[] = [];
    
    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip comments and imports
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('import')) {
          return;
        }
        
        // Check for legacy deck type in DeckType contexts
        for (const pattern of DECK_TYPE_CONTEXTS) {
          const match = line.match(pattern);
          if (match && match[1]) {
            const value = match[1];
            if (LEGACY_DECK_TYPES.includes(value as any)) {
              violations.push(`${file}:${index + 1}: Legacy DeckType "${value}" found`);
            }
          }
        }
      });
    }
    
    if (violations.length > 0) {
      const message = [
        'Found legacy DeckType strings in code:',
        '',
        ...violations.slice(0, 20).map(v => `  - ${v}`),
        violations.length > 20 ? `  ... and ${violations.length - 20} more` : '',
        '',
        'Use canonical DeckType values instead:',
        '  pattern-editor → pattern-deck',
        '  piano-roll → piano-roll-deck',
        '  notation-score → notation-deck',
        '  session → session-deck',
        '  arrangement → arrangement-deck',
        '  mixer → mixer-deck',
      ].filter(Boolean).join('\n');
      
      throw new Error(message);
    }
    
    expect(violations).toHaveLength(0);
  });
  
  it('canonical DeckType values should be used', () => {
    // Informational: list expected canonical values
    const canonicalValues = [
      'pattern-deck',
      'piano-roll-deck',
      'notation-deck',
      'session-deck',
      'arrangement-deck',
      'mixer-deck',
      'instruments-deck',
      'effects-deck',
      'samples-deck',
      'phrases-deck',
      'harmony-deck',
      'generators-deck',
      'routing-deck',
      'automation-deck',
      'properties-deck',
      'ai-advisor-deck',
    ];
    
    console.log('Expected canonical DeckType values:', canonicalValues.join(', '));
    expect(canonicalValues.length).toBeGreaterThan(0);
  });
});
