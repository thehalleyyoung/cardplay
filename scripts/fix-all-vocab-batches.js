#!/usr/bin/env node
/**
 * Generalized vocab batch fixer
 * Applies systematic fixes to vocabulary batch files
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function fixVocabFile(filename) {
  const filePath = join(rootDir, 'src/gofai/canon', filename);
  console.log(`\nFixing ${filename}...`);
  
  let content = readFileSync(filePath, 'utf-8');
  
  // 1. Convert lexeme -> lemma
  content = content.replace(/(\s+)lexeme: '([^']+)'/g, '$1lemma: \'$2\'');
  
  // 2. Convert synonyms -> variants
  content = content.replace(/(\s+)synonyms: (\[[^\]]+\])/g, '$1variants: $2');
  
  // 3. Remove subcategory lines
  content = content.replace(/\s+subcategory: '[^']+',?\n/g, '');
  
  // 4. Fix imports - remove unused types, add needed ones
  content = content.replace(
    /import type \{ GofaiId, LexemeEntry, LexemeSemantics \}/,
    'import type { Lexeme, LexemeId, OpcodeId }'
  );
  content = content.replace(
    /import type \{ GofaiId, Lexeme, LexemeSemantics \}/,
    'import type { Lexeme, LexemeId, OpcodeId }'
  );
  content = content.replace(
    /import type \{ Lexeme, LexemeId, LexemeSemantics \}/,
    'import type { Lexeme, LexemeId, OpcodeId }'
  );
  
  // 5. Fix export type
  content = content.replace(/readonly LexemeEntry\[\]/g, 'readonly Lexeme[]');
  
  // 6. Fix all semantic types to use 'concept' with domain/aspect
  const semanticTypes = [
    'chord-quality', 'chord-extension', 'chord-alteration', 'harmonic-function',
    'voicing', 'progression', 'voice-leading', 'tension', 'modulation', 'cadence',
    'harmonic-technique', 'mode', 'performance-technique', 'quality', 'scale',
    'voicing-technique', 'resolution', 'harmonic-motion', 'harmonic-rhythm',
    'chord-progression', 'chord-voicing',
    // Expression/performance types
    'dynamic-marking', 'articulation', 'phrasing', 'expression-technique',
    'ornament', 'vibrato', 'bowing', 'tonguing', 'breath-control',
    // Production/mixing types  
    'effect', 'eq-technique', 'compression-technique', 'reverb-technique',
    'spatial-technique', 'mastering-technique', 'mixing-technique',
    // Rhythm/groove types
    'groove-pattern', 'rhythmic-feel', 'syncopation', 'subdivision',
    'time-signature', 'meter', 'polyrhythm', 'metric-modulation'
  ];
  
  semanticTypes.forEach(type => {
    const domain = type.includes('dynamic') || type.includes('articulation') || 
                   type.includes('phrasing') || type.includes('expression') ||
                   type.includes('ornament') || type.includes('vibrato') ||
                   type.includes('bowing') || type.includes('tonguing') ||
                   type.includes('breath') ? 'expression' :
                   type.includes('effect') || type.includes('eq') || 
                   type.includes('compression') || type.includes('reverb') ||
                   type.includes('spatial') || type.includes('mastering') ||
                   type.includes('mixing') ? 'production' :
                   type.includes('groove') || type.includes('rhythm') || 
                   type.includes('syncopation') || type.includes('subdivision') ||
                   type.includes('meter') || type.includes('polyrhythm') ||
                   type.includes('time-signature') || type.includes('metric') ? 'rhythm' :
                   'harmony';
    
    const regex = new RegExp(`type: '${type}',`, 'g');
    content = content.replace(regex, `type: 'concept',\n      domain: '${domain}',\n      aspect: '${type}',`);
  });
  
  // 7. Remove "as LexemeSemantics" casts
  content = content.replace(/\} as LexemeSemantics,/g, '},');
  
  // 8. Fix category 'adjective' -> 'adj', 'modifier' -> 'adj'
  content = content.replace(/category: 'adjective',/g, "category: 'adj',");
  content = content.replace(/category: 'modifier',/g, "category: 'adj',");
  
  // 9. Fix opcode casts
  content = content.replace(/opcode: '([^']*)' as LexemeId,/g, "opcode: '$1' as OpcodeId,");
  
  // 10. Fix id casts from GofaiId to LexemeId
  content = content.replace(/as GofaiId/g, 'as LexemeId');
  
  // 11. Add description field after semantics if missing
  content = content.replace(
    /(\s+semantics: \{[^}]+\},)\n(\s+)(variants|examples): /g,
    '$1\n$2description: \'Vocabulary term\',\n$2$3: '
  );
  
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${filename}`);
}

// Fix all vocabulary batch files
const files = [
  'domain-vocab-batch43-expression-performance.ts',
  'domain-vocab-batch44-production-mixing.ts',
  'domain-vocab-batch45-rhythm-groove-comprehensive.ts',
  'harmony-melody-vocabulary-batch34.ts',
  'rhythm-groove-vocabulary-batch35.ts',
  'production-mixing-vocabulary-batch36.ts',
  'perceptual-axes-extended-batch1.ts'
];

files.forEach(file => {
  try {
    fixVocabFile(file);
  } catch (err) {
    console.log(`✗ Error fixing ${file}: ${err.message}`);
  }
});

console.log('\nDone! Fixed all vocabulary batch files.');
