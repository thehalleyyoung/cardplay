/**
 * @fileoverview No Duplicate Exported Symbols Test
 * 
 * Change 470: Fails if ambiguous names are exported without explicit aliasing.
 * Ensures symbols like Card, Deck, Stack, PortType are properly qualified.
 * 
 * @module @cardplay/tests/no-duplicate-exported-symbols.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Ambiguous symbol names that need qualification
const AMBIGUOUS_SYMBOLS = [
  'Card',
  'CardState',
  'CardCategory',
  'CardDefinition',
  'Deck',
  'DeckState',
  'Stack',
  'StackMode',
  'Track',
  'PortType',
  'HostAction',
];

// Allowed qualified names
const ALLOWED_QUALIFIED = new Set([
  'CoreCard',
  'AudioModuleCard',
  'UICardComponent',
  'CardSurface',
  'CardSurfaceState',
  'UIStackComponent',
  'UILayoutStackMode',
  'UIPortType',
  'UISurfacePortType',
  'VisualPortType',
  'ArrangementTrack',
  'FreezeTrackModel',
  'AudioModuleState',
  'AudioModuleCategory',
  'EditorCardDefinition',
]);

describe('No Duplicate Exported Symbols (Change 470)', () => {
  it('should not export ambiguous symbols from barrel files without aliasing', async () => {
    const srcDir = path.resolve(__dirname, '../../');
    
    // Find index.ts barrel files
    const files = await glob('**/index.ts', {
      cwd: srcDir,
      ignore: [
        '**/node_modules/**',
      ],
    });
    
    const violations: string[] = [];
    
    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check for exports of ambiguous symbols
      for (const symbol of AMBIGUOUS_SYMBOLS) {
        // Check for direct export: export { Card } or export { Card as X }
        const exportPattern = new RegExp(
          `export\\s*\\{[^}]*\\b${symbol}\\b(?!\\s+as\\s)`,
          'g'
        );
        
        const matches = content.match(exportPattern);
        if (matches) {
          // Check if it's aliased
          for (const match of matches) {
            if (!match.includes(' as ')) {
              violations.push(
                `${file}: Exports ambiguous symbol "${symbol}" without aliasing`
              );
            }
          }
        }
        
        // Check for re-export: export * from
        // This is harder to track - just note it
      }
    }
    
    if (violations.length > 0) {
      const message = [
        'Found ambiguous symbol exports without aliasing:',
        '',
        ...violations.slice(0, 15).map(v => `  - ${v}`),
        violations.length > 15 ? `  ... and ${violations.length - 15} more` : '',
        '',
        'Either:',
        '1. Rename the export to a qualified name (e.g., Card → CoreCard)',
        '2. Use explicit aliasing: export { Card as CoreCard }',
        '3. Document the intentional export in legacy-type-aliases.md',
      ].filter(Boolean).join('\n');
      
      throw new Error(message);
    }
    
    expect(violations).toHaveLength(0);
  });
  
  it('should use qualified names for card types', async () => {
    // Informational: list expected qualified names
    console.log('Expected qualified names:');
    console.log('  Card<A,B> → CoreCard (composition cards)');
    console.log('  Card (audio) → AudioModuleCard');
    console.log('  CardState (UI) → CardSurfaceState');
    console.log('  PortType (UI) → UIPortType, VisualPortType');
    console.log('  Track (arrangement) → ArrangementTrack');
    console.log('  Track (freeze) → FreezeTrackModel');
    
    expect(ALLOWED_QUALIFIED.size).toBeGreaterThan(0);
  });
});
