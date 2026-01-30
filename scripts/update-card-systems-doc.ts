#!/usr/bin/env tsx
/**
 * Syncs cardplay/docs/canon/card-systems.md with code symbols
 * Tracks Card type exports across different subsystems
 */

import * as fs from 'fs';
import * as path from 'path';

interface CardSystemExport {
  name: string;
  type: 'interface' | 'type' | 'class';
  location: string;
  system: 'core' | 'audio' | 'ui' | 'editor' | 'theory';
  description: string;
}

function findMatchingFiles(patterns: string[]): string[] {
  const results: string[] = [];
  
  for (const pattern of patterns) {
    const fullPath = path.join(process.cwd(), pattern);
    if (pattern.includes('**')) {
      // Handle glob patterns by walking directory
      const baseDir = pattern.split('**')[0];
      const findInDir = (dir: string) => {
        try {
          const files = fs.readdirSync(dir, { withFileTypes: true });
          for (const file of files) {
            const filePath = path.join(dir, file.name);
            if (file.isDirectory()) {
              findInDir(filePath);
            } else if (file.name.endsWith('.ts') && !file.name.endsWith('.test.ts')) {
              results.push(filePath.replace(process.cwd() + '/', ''));
            }
          }
        } catch (e) {
          // Directory doesn't exist
        }
      };
      findInDir(path.join(process.cwd(), baseDir));
    } else if (fs.existsSync(fullPath)) {
      results.push(pattern);
    }
  }
  
  return results;
}

async function scanCardSystems(): Promise<CardSystemExport[]> {
  const exports: CardSystemExport[] = [];
  
  const patterns = [
    { patterns: ['src/cards'], system: 'core' as const },
    { patterns: ['src/audio/instrument-cards.ts'], system: 'audio' as const },
    { patterns: ['src/ui/components/card-component.ts', 'src/ui/cards.ts'], system: 'ui' as const },
    { patterns: ['src/user-cards/card-editor-panel.ts'], system: 'editor' as const },
    { patterns: ['src/ai/theory/theory-cards.ts'], system: 'theory' as const }
  ];

  for (const { patterns: patternList, system } of patterns) {
    const files = findMatchingFiles(patternList);
    
    for (const file of files) {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for Card-related exports
        const interfaceMatch = line.match(/export\s+interface\s+(\w*Card\w*)/);
        const typeMatch = line.match(/export\s+type\s+(\w*Card\w*)\s*=/);
        const classMatch = line.match(/export\s+class\s+(\w*Card\w*)/);

        if (interfaceMatch || typeMatch || classMatch) {
          const name = (interfaceMatch || typeMatch || classMatch)![1];
          const type = interfaceMatch ? 'interface' : typeMatch ? 'type' : 'class';
          
          // Get description from preceding comment
          let description = '';
          if (i > 0 && lines[i - 1].includes('/**')) {
            for (let j = i - 1; j >= 0 && j > i - 5; j--) {
              if (lines[j].includes('*/')) break;
              const comment = lines[j].replace(/^\s*\*\s*/, '').trim();
              if (comment && !comment.startsWith('/**')) {
                description = comment;
                break;
              }
            }
          }

          exports.push({ name, type, location: file, system, description });
        }
      }
    }
  }

  return exports;
}

function generateMarkdown(exports: CardSystemExport[]): string {
  let md = `# Card Systems

**Status:** Maintained (auto-generated)
**Last Updated:** ${new Date().toISOString().split('T')[0]}

This document tracks Card-related type exports across different subsystems.
CardPlay has multiple "Card" concepts that serve different purposes.

---

## Overview

The term "Card" appears in five distinct subsystems:

1. **Core Cards** (\`src/cards/\`): Composable card computation system
2. **Audio Module Cards** (\`src/audio/\`): Audio processing modules
3. **UI Card Surfaces** (\`src/ui/\`): Visual card rendering components
4. **Editor Card Definitions** (\`src/user-cards/\`): User-editable card metadata
5. **Theory Cards** (\`src/ai/theory/\`): Music theory constraint generators

---

`;

  const systems = ['core', 'audio', 'ui', 'editor', 'theory'] as const;
  
  for (const system of systems) {
    const systemExports = exports.filter(e => e.system === system);
    if (systemExports.length === 0) continue;

    const systemNames = {
      core: 'Core Cards',
      audio: 'Audio Module Cards',
      ui: 'UI Card Surfaces',
      editor: 'Editor Card Definitions',
      theory: 'Theory Cards'
    };

    md += `## ${systemNames[system]}\n\n`;
    md += `| Name | Type | Location | Description |\n`;
    md += `|------|------|----------|-------------|\n`;

    for (const exp of systemExports.sort((a, b) => a.name.localeCompare(b.name))) {
      md += `| \`${exp.name}\` | ${exp.type} | \`${exp.location}\` | ${exp.description || 'N/A'} |\n`;
    }
    md += '\n';
  }

  md += `---

## Disambiguation Rules

1. Use \`CoreCard<A,B>\` or \`Card<A,B>\` for composition system
2. Use \`AudioModuleCard\` for audio processing
3. Use \`UICardComponent\` for rendering components
4. Use \`EditorCardDefinition\` for user-editable metadata
5. Use \`TheoryCard\` for music constraint generation

Avoid exporting bare \`Card\` from barrel files to prevent ambiguity.

To regenerate this document: \`npm run docs:sync-card-systems\`
`;

  return md;
}

async function main() {
  console.log('Scanning card systems...');
  const exports = await scanCardSystems();
  console.log(`Found ${exports.length} Card-related exports`);

  const markdown = generateMarkdown(exports);
  const docPath = path.join(process.cwd(), 'docs/canon/card-systems.md');
  
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, markdown, 'utf-8');
  
  console.log(`✓ Updated ${docPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
