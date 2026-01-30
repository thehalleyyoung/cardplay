#!/usr/bin/env ts-node
/**
 * verify-public-exports.ts
 * Ensures src/index.ts exports only canonical types
 * Legacy types must be explicitly aliased
 * 
 * Change 037 from to_fix_repo_plan_500.md
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const INDEX_PATH = join(process.cwd(), 'src/index.ts');

// Types that should NOT be exported directly without qualification
const AMBIGUOUS_TYPES = [
  'Card',
  'Deck', 
  'Stack',
  'Track',
  'PortType',
  'HostAction',
  'CardDefinition',
  'CardState',
  'CardCategory',
];

// Allowed qualified exports
const ALLOWED_QUALIFIED = [
  'CoreCard',
  'AudioModuleCard',
  'UICardComponent',
  'CardSurface',
  'TheoryCard',
  'DeckType',
  'DeckId',
  'DeckFactory',
  'ArrangementTrack',
  'FreezeTrackModel',
];

interface Issue {
  line: number;
  export: string;
  reason: string;
}

function checkExports(): Issue[] {
  const issues: Issue[] = [];
  
  try {
    const content = readFileSync(INDEX_PATH, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      // Check for export statements
      if (line.match(/^\s*export/)) {
        for (const ambiguous of AMBIGUOUS_TYPES) {
          // Check for direct export of ambiguous type
          const pattern = new RegExp(`\\b${ambiguous}\\b`);
          if (pattern.test(line)) {
            // Check if it's qualified
            const isQualified = ALLOWED_QUALIFIED.some(q => line.includes(q));
            if (!isQualified && !line.includes('Legacy') && !line.includes('UI')) {
              issues.push({
                line: idx + 1,
                export: line.trim(),
                reason: `Ambiguous type '${ambiguous}' exported without qualification`,
              });
            }
          }
        }
      }
    });
  } catch (err) {
    console.error(`Error reading ${INDEX_PATH}:`, err);
    process.exit(1);
  }
  
  return issues;
}

// Main execution
console.log('Verifying public exports in src/index.ts...\n');

const issues = checkExports();

if (issues.length === 0) {
  console.log('✓ All exports are properly qualified');
  process.exit(0);
} else {
  console.log(`✗ Found ${issues.length} export issues:\n`);
  
  issues.forEach(issue => {
    console.log(`Line ${issue.line}: ${issue.export}`);
    console.log(`  → ${issue.reason}\n`);
  });
  
  console.log('Legacy types must be explicitly aliased (e.g., export { Card as LegacyCard })');
  process.exit(1);
}
