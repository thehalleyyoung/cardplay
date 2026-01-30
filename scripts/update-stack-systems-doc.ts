#!/usr/bin/env tsx
/**
 * Syncs cardplay/docs/canon/stack-systems.md with code symbols
 * Tracks Stack type exports across composition and UI systems
 */

import * as fs from 'fs';
import * as path from 'path';

interface StackSystemExport {
  name: string;
  type: 'interface' | 'type' | 'class' | 'function';
  location: string;
  system: 'core' | 'ui';
  description: string;
}

async function scanStackSystems(): Promise<StackSystemExport[]> {
  const exports: StackSystemExport[] = [];
  
  const patterns = [
    { file: 'src/cards/stack.ts', system: 'core' as const },
    { file: 'src/ui/components/stack-component.ts', system: 'ui' as const }
  ];

  for (const { file, system } of patterns) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for Stack-related exports
      const interfaceMatch = line.match(/export\s+interface\s+(\w*Stack\w*)/);
      const typeMatch = line.match(/export\s+type\s+(\w*Stack\w*)\s*=/);
      const classMatch = line.match(/export\s+class\s+(\w*Stack\w*)/);
      const funcMatch = line.match(/export\s+function\s+(\w*[Ss]tack\w*)/);

      if (interfaceMatch || typeMatch || classMatch || funcMatch) {
        const name = (interfaceMatch || typeMatch || classMatch || funcMatch)![1];
        const type = interfaceMatch ? 'interface' : 
                    typeMatch ? 'type' : 
                    classMatch ? 'class' : 'function';
        
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

  return exports;
}

function generateMarkdown(exports: StackSystemExport[]): string {
  let md = `# Stack Systems

**Status:** Maintained (auto-generated)
**Last Updated:** ${new Date().toISOString().split('T')[0]}

This document tracks Stack-related type exports across composition and UI systems.
CardPlay has two distinct "Stack" concepts that serve different purposes.

---

## Overview

The term "Stack" appears in two subsystems:

1. **Core Stacks** (\`src/cards/stack.ts\`): Composable card stacks
2. **UI Layout Stacks** (\`src/ui/components/stack-component.ts\`): Visual stacking layouts

---

## Core Stacks (Composition)

These types support card composition and signal flow:

| Name | Type | Description |
|------|------|-------------|
`;

  const coreExports = exports.filter(e => e.system === 'core');
  for (const exp of coreExports.sort((a, b) => a.name.localeCompare(b.name))) {
    md += `| \`${exp.name}\` | ${exp.type} | ${exp.description || 'N/A'} |\n`;
  }

  md += `\n**Location:** \`src/cards/stack.ts\`

## UI Layout Stacks

These types support visual layout and arrangement:

| Name | Type | Description |
|------|------|-------------|
`;

  const uiExports = exports.filter(e => e.system === 'ui');
  for (const exp of uiExports.sort((a, b) => a.name.localeCompare(b.name))) {
    md += `| \`${exp.name}\` | ${exp.type} | ${exp.description || 'N/A'} |\n`;
  }

  md += `\n**Location:** \`src/ui/components/stack-component.ts\`

---

## Disambiguation Rules

1. Composition stacks use \`Stack<A,B>\` (from \`src/cards/stack.ts\`)
2. UI layout stacks use \`UIStackComponent\` or \`UILayoutStackMode\`
3. Avoid exporting bare \`Stack\` from barrel files

To regenerate this document: \`npm run docs:sync-stack-systems\`
`;

  return md;
}

async function main() {
  console.log('Scanning stack systems...');
  const exports = await scanStackSystems();
  console.log(`Found ${exports.length} Stack-related exports`);

  const markdown = generateMarkdown(exports);
  const docPath = path.join(process.cwd(), 'docs/canon/stack-systems.md');
  
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, markdown, 'utf-8');
  
  console.log(`✓ Updated ${docPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
