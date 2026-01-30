#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const filePath = join(rootDir, 'src/gofai/canon/domain-vocab-batch42-harmony.ts');

let content = readFileSync(filePath, 'utf-8');

// Fix cadence types
content = content.replace(
  /type: 'cadence',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'cadence',"
);

// Fix harmonic-technique types
content = content.replace(
  /type: 'harmonic-technique',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'harmonic-technique',"
);

// Fix mode types
content = content.replace(
  /type: 'mode',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'mode',"
);

// Fix performance-technique types
content = content.replace(
  /type: 'performance-technique',/g,
  "type: 'concept',\n      domain: 'performance',\n      aspect: 'technique',"
);

// Fix quality types
content = content.replace(
  /type: 'quality',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'quality',"
);

// Fix scale types
content = content.replace(
  /type: 'scale',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'scale',"
);

// Fix voicing-technique types
content = content.replace(
  /type: 'voicing-technique',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'voicing-technique',"
);

// Fix category field - change from string literal to LexemeCategory
content = content.replace(
  /category: 'adjective',/g,
  "category: 'modifier',"
);

writeFileSync(filePath, content, 'utf-8');
console.log('Fixed final harmony vocab semantic types');
