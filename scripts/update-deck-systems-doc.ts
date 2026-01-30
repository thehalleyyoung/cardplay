#!/usr/bin/env tsx
/**
 * Syncs cardplay/docs/canon/deck-systems.md with code symbols
 * Tracks Deck type exports and DeckType values
 */

import * as fs from 'fs';
import * as path from 'path';

interface DeckSystemExport {
  name: string;
  type: 'type' | 'interface' | 'factory' | 'value';
  location: string;
  description: string;
}

function findTsFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.includes('node_modules')) {
      findTsFiles(filePath, fileList);
    } else if (file.name.endsWith('.ts') && !file.name.endsWith('.test.ts')) {
      fileList.push(filePath.replace(process.cwd() + '/', ''));
    }
  }
  
  return fileList;
}

async function scanDeckSystems(): Promise<DeckSystemExport[]> {
  const exports: DeckSystemExport[] = [];
  
  // Scan types
  const typeFiles = findTsFiles(path.join(process.cwd(), 'src/boards'));
  
  for (const file of typeFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for Deck-related exports
      if (line.match(/export\s+(type|interface)\s+\w*Deck\w*/)) {
        const match = line.match(/export\s+(type|interface)\s+(\w*Deck\w*)/);
        if (match) {
          exports.push({
            name: match[2],
            type: match[1] as 'type' | 'interface',
            location: file,
            description: extractDescription(lines, i)
          });
        }
      }
    }
  }

  // Scan factories
  const factoryDir = path.join(process.cwd(), 'src/boards/decks/factories');
  if (fs.existsSync(factoryDir)) {
    const factoryFiles = fs.readdirSync(factoryDir).filter(f => f.endsWith('.ts'));
  
  for (const file of factoryFiles) {
    const content = fs.readFileSync(path.join(factoryDir, file), 'utf-8');
    const nameMatch = file.match(/(\w+)-factory\.ts$/);
    if (nameMatch) {
      exports.push({
        name: nameMatch[1],
        type: 'factory',
        location: `src/boards/decks/factories/${file}`,
        description: `Factory for ${nameMatch[1]} deck`
      });
    }
  }
  }

  // Extract DeckType union
  const typesPath = path.join(process.cwd(), 'src/boards/types.ts');
  if (fs.existsSync(typesPath)) {
    const content = fs.readFileSync(typesPath, 'utf-8');
    const deckTypeMatch = content.match(/export\s+type\s+DeckType\s*=\s*([^;]+);/);
    if (deckTypeMatch) {
      const values = deckTypeMatch[1]
        .split('|')
        .map(v => v.trim().replace(/['"]/g, ''))
        .filter(v => v && !v.includes('$'));
      
      for (const value of values) {
        exports.push({
          name: value,
          type: 'value',
          location: 'src/boards/types.ts',
          description: `DeckType value: ${value}`
        });
      }
    }
  }

  return exports;
}

function extractDescription(lines: string[], index: number): string {
  if (index > 0 && lines[index - 1].includes('/**')) {
    for (let j = index - 1; j >= 0 && j > index - 5; j--) {
      if (lines[j].includes('*/')) break;
      const comment = lines[j].replace(/^\s*\*\s*/, '').trim();
      if (comment && !comment.startsWith('/**')) {
        return comment;
      }
    }
  }
  return '';
}

function generateMarkdown(exports: DeckSystemExport[]): string {
  const types = exports.filter(e => e.type === 'type' || e.type === 'interface');
  const factories = exports.filter(e => e.type === 'factory');
  const values = exports.filter(e => e.type === 'value');

  let md = `# Deck Systems

**Status:** Maintained (auto-generated)
**Last Updated:** ${new Date().toISOString().split('T')[0]}

This document tracks Deck-related types, factories, and DeckType values.

---

## DeckType Values

The canonical \`DeckType\` union defines all builtin deck types:

| Value | Factory | Status |
|-------|---------|--------|
`;

  for (const value of values.sort((a, b) => a.name.localeCompare(b.name))) {
    const factory = factories.find(f => f.name === value.name.replace('-deck', ''));
    const status = factory ? '✓ Implemented' : '⚠ Missing Factory';
    md += `| \`${value.name}\` | \`${factory?.location || 'N/A'}\` | ${status} |\n`;
  }

  md += `\n## Deck Type Exports

| Name | Type | Location | Description |
|------|------|----------|-------------|
`;

  for (const exp of types.sort((a, b) => a.name.localeCompare(b.name))) {
    md += `| \`${exp.name}\` | ${exp.type} | \`${exp.location}\` | ${exp.description || 'N/A'} |\n`;
  }

  md += `\n## Deck Factories

| Name | Location | Implements |
|------|----------|-----------|
`;

  for (const factory of factories.sort((a, b) => a.name.localeCompare(b.name))) {
    const deckType = factory.name + '-deck';
    md += `| \`${factory.name}\` | \`${factory.location}\` | \`${deckType}\` |\n`;
  }

  md += `\n---

## Guidelines

1. **DeckType** is a closed union of builtin deck types (not extensible)
2. **DeckId** is a branded instance identifier (distinct from DeckType)
3. **BoardDeck** combines DeckType, DeckId, and panelId
4. Each DeckType must have a corresponding factory registered

To regenerate this document: \`npm run docs:sync-deck-systems\`
`;

  return md;
}

async function main() {
  console.log('Scanning deck systems...');
  const exports = await scanDeckSystems();
  console.log(`Found ${exports.length} Deck-related exports`);

  const markdown = generateMarkdown(exports);
  const docPath = path.join(process.cwd(), 'docs/canon/deck-systems.md');
  
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, markdown, 'utf-8');
  
  console.log(`✓ Updated ${docPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
