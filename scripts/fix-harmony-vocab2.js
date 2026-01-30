#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const filePath = join(rootDir, 'src/gofai/canon/domain-vocab-batch42-harmony.ts');

let content = readFileSync(filePath, 'utf-8');

// Remove unused GofaiId import
content = content.replace(/import type \{ GofaiId, Lexeme, LexemeId \}/, 'import type { Lexeme, LexemeId }');

// Fix chord-extension types
content = content.replace(
  /type: 'chord-extension',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'chord-extension',"
);

// Fix chord-alteration types
content = content.replace(
  /type: 'chord-alteration',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'chord-alteration',"
);

// Fix harmonic-function types
content = content.replace(
  /type: 'harmonic-function',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'harmonic-function',"
);

// Fix chord-voicing types
content = content.replace(
  /type: 'chord-voicing',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'chord-voicing',"
);

// Fix progression types
content = content.replace(
  /type: 'progression',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'progression',"
);

// Fix voice-leading types
content = content.replace(
  /type: 'voice-leading',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'voice-leading',"
);

// Fix tension types
content = content.replace(
  /type: 'tension',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'tension',"
);

// Fix modulation types
content = content.replace(
  /type: 'modulation',/g,
  "type: 'concept',\n      domain: 'harmony',\n      aspect: 'modulation',"
);

writeFileSync(filePath, content, 'utf-8');
console.log('Fixed remaining harmony vocab semantic types');
