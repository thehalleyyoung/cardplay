#!/usr/bin/env node
/**
 * Fix domain-vocab-batch42-harmony.ts to use proper Lexeme structure
 * Converts old format to new format with proper semantics
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const filePath = join(rootDir, 'src/gofai/canon/domain-vocab-batch42-harmony.ts');

let content = readFileSync(filePath, 'utf-8');

// Convert lexeme -> lemma
content = content.replace(/(\s+)lexeme: '([^']+)'/g, '$1lemma: \'$2\'');

// Convert synonyms -> variants
content = content.replace(/(\s+)synonyms: (\[[^\]]+\])/g, '$1variants: $2');

// Remove subcategory lines
content = content.replace(/\s+subcategory: '[^']+',?\n/g, '');

// Convert semantics type 'chord-quality' to 'concept' with domain/aspect
content = content.replace(
  /semantics: \{([^}]*?)type: 'chord-quality',/g,
  'semantics: {$1type: \'concept\',\n      domain: \'harmony\',\n      aspect: \'chord-quality\','
);

// Remove "as LexemeSemantics" casts
content = content.replace(/\} as LexemeSemantics,/g, '},');

// Add description field after semantics for entries that don't have it
// This is a simple heuristic - add description after closing semantics brace
content = content.replace(
  /(\s+semantics: \{[^}]+\},)\n(\s+)(variants|examples): /g,
  '$1\n$2description: \'Harmony vocabulary term\',\n$2$3: '
);

writeFileSync(filePath, content, 'utf-8');
console.log('Fixed domain-vocab-batch42-harmony.ts');
console.log('- Converted lexeme -> lemma');
console.log('- Converted synonyms -> variants');
console.log('- Removed subcategory fields');
console.log('- Fixed semantics type from chord-quality to concept');
console.log('- Removed type casts');
console.log('- Added description fields where missing');
