#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const files = [
  'domain-vocab-batch43-expression-performance.ts',
  'domain-vocab-batch44-production-mixing.ts',
  'domain-vocab-batch45-rhythm-groove-comprehensive.ts',
  'harmony-melody-vocabulary-batch34.ts',
  'rhythm-groove-vocabulary-batch35.ts',
  'production-mixing-vocabulary-batch36.ts',
  'perceptual-axes-extended-batch1.ts'
];

files.forEach(filename => {
  const filePath = join(rootDir, 'src/gofai/canon', filename);
  let content = readFileSync(filePath, 'utf-8');
  
  // Fix "axis-modifier" -> "axis_modifier" (hyphen to underscore)
  content = content.replace(/type: 'axis-modifier',/g, "type: 'axis_modifier',");
  
  // Fix "noun-phrase" category -> "construction"
  content = content.replace(/category: 'noun-phrase',/g, "category: 'construction',");
  
  // Fix any "verb-phrase" -> "construction"
  content = content.replace(/category: 'verb-phrase',/g, "category: 'construction',");
  
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed edge cases in ${filename}`);
});

console.log('Done!');
