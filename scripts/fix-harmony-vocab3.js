#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const filePath = join(rootDir, 'src/gofai/canon/domain-vocab-batch42-harmony.ts');

let content = readFileSync(filePath, 'utf-8');

// Fix voicing types
content = content.replace(
  /type: 'voicing',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'voicing',"
);

// Fix chord-progression types
content = content.replace(
  /type: 'chord-progression',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'chord-progression',"
);

// Fix resolution types
content = content.replace(
  /type: 'resolution',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'resolution',"
);

// Fix harmonic-motion types
content = content.replace(
  /type: 'harmonic-motion',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'harmonic-motion',"
);

// Fix harmonic-rhythm types
content = content.replace(
  /type: 'harmonic-rhythm',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'harmonic-rhythm',"
);

writeFileSync(filePath, content, 'utf-8');
console.log('Fixed additional harmony vocab semantic types');
