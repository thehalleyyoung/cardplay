#!/usr/bin/env tsx
/**
 * Syncs cardplay/docs/canon/ids.md with code after canonicalization
 * Extracts ID constants, unions, and enums from the codebase
 */

import * as fs from 'fs';
import * as path from 'path';

interface IdCategory {
  name: string;
  values: string[];
  source: string;
  description: string;
  constantValue?: number;  // For numeric constants like PPQ
}

function extractIdsFromFile(filePath: string, content: string): IdCategory[] {
  const categories: IdCategory[] = [];

  // Extract union types
  const unionMatches = content.matchAll(/export\s+type\s+(\w+)\s*=\s*([^;]+);/g);
  for (const match of unionMatches) {
    const name = match[1];
    const unionBody = match[2];
    
    if (unionBody.includes('|')) {
      const values = unionBody
        .split('|')
        .map(v => v.trim())
        // Remove comments
        .map(v => v.replace(/\/\/.*$/, '').trim())
        .map(v => v.replace(/['"]/g, ''))
        .filter(v => v && !v.includes('${') && v !== 'string' && !v.startsWith('//'));
      
      if (values.length > 0) {
        categories.push({
          name,
          values,
          source: filePath,
          description: `Union type defining ${name} values`
        });
      }
    }
  }

  // Extract enums
  const enumMatches = content.matchAll(/export\s+enum\s+(\w+)\s*{([^}]+)}/g);
  for (const match of enumMatches) {
    const name = match[1];
    const enumBody = match[2];
    
    const values = enumBody
      .split(',')
      .map(line => {
        const valueMatch = line.match(/=\s*['"]([^'"]+)['"]/);
        return valueMatch ? valueMatch[1] : null;
      })
      .filter(Boolean) as string[];
    
    if (values.length > 0) {
      categories.push({
        name,
        values,
        source: filePath,
        description: `Enum defining ${name} values`
      });
    }
  }

  // Extract const arrays of IDs
  const arrayMatches = content.matchAll(/export\s+const\s+(\w+)\s*=\s*\[([^\]]+)\]\s*(?:as const)?/g);
  for (const match of unionMatches) {
    const name = match[1];
    if (name.toUpperCase() === name || name.endsWith('_IDS') || name.endsWith('_TYPES')) {
      const arrayBody = match[2];
      const values = arrayBody
        .split(',')
        .map(v => v.trim().replace(/['"]/g, ''))
        .filter(v => v);
      
      if (values.length > 0) {
        categories.push({
          name,
          values,
          source: filePath,
          description: `Constant array defining ${name}`
        });
      }
    }
  }

  // Extract PPQ constant
  const ppqMatch = content.match(/export\s+const\s+PPQ\s*=\s*(\d+)/);
  if (ppqMatch) {
    categories.push({
      name: 'PPQ',
      values: [],
      source: filePath,
      description: 'Pulses Per Quarter note (timebase resolution)',
      constantValue: parseInt(ppqMatch[1], 10)
    });
  }

  return categories;
}

function scanForIds(): IdCategory[] {
  const allCategories: IdCategory[] = [];
  
  // Key files to scan
  const filesToScan = [
    'src/canon/ids.ts',
    'src/boards/types.ts',
    'src/types/primitives.ts',
    'src/cards/card.ts',
    'src/types/event-kind.ts',
    'src/ai/theory/music-spec.ts',
  ];

  for (const file of filesToScan) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      allCategories.push(...extractIdsFromFile(file, content));
    }
  }

  return allCategories;
}

function generateMarkdown(categories: IdCategory[]): string {
  let md = `# Canonical IDs

**Status:** Maintained (auto-generated)
**Last Updated:** ${new Date().toISOString().split('T')[0]}

This document enumerates all canonical ID spaces used in CardPlay.

---

`;

  // Group by category type
  const groups = {
    'Board & Deck': categories.filter(c => 
      c.name.includes('Deck') || c.name.includes('Board') || c.name.includes('Panel')
    ),
    'Cards & Ports': categories.filter(c => 
      c.name.includes('Card') || c.name.includes('Port')
    ),
    'Events & Time': categories.filter(c => 
      c.name.includes('Event') || c.name.includes('Tick') || c.name.includes('PPQ')
    ),
    'Music Theory': categories.filter(c => 
      c.name.includes('Mode') || c.name.includes('Scale') || c.name.includes('Cadence') || 
      c.name.includes('Tonality') || c.name.includes('Constraint')
    ),
    'Control & Policy': categories.filter(c => 
      c.name.includes('Control') || c.name.includes('Level') || c.name.includes('Tool')
    ),
    'Other': [] as IdCategory[]
  };

  // Catch-all for ungrouped
  const grouped = new Set<IdCategory>();
  Object.values(groups).forEach(g => g.forEach(c => grouped.add(c)));
  groups['Other'] = categories.filter(c => !grouped.has(c));

  for (const [groupName, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    
    md += `## ${groupName}\n\n`;
    
    for (const category of items) {
      md += `### \`${category.name}\`

**Source:** \`${category.source}\`  
**Description:** ${category.description}

`;
      
      if (category.constantValue !== undefined) {
        // Numeric constant like PPQ
        md += `**TypeScript Definition:**
\`\`\`typescript
export const ${category.name} = ${category.constantValue};
\`\`\`

`;
      } else {
        // Union type or enum
        md += `**TypeScript Definition:**
\`\`\`typescript
type ${category.name} = ${category.values.map(v => `'${v}'`).join(' | ')};
\`\`\`

**Values:**
`;
        for (const value of category.values.sort()) {
          md += `- \`${value}\`\n`;
        }
        md += '\n';
      }
    }
  }

  md += `---

## ID Naming Conventions

1. **Builtin IDs**: No namespace prefix (e.g., \`audio\`, \`midi\`)
2. **Extension IDs**: Must use \`namespace:name\` format (e.g., \`acme:custom-synth\`)
3. **Branded Types**: IDs use branded types for type safety (e.g., \`DeckId\`, \`CardId\`)

To regenerate this document: \`npm run docs:sync-ids\`
`;

  return md;
}

async function main() {
  console.log('Scanning codebase for ID definitions...');
  const categories = scanForIds();
  console.log(`Found ${categories.length} ID categories`);

  const markdown = generateMarkdown(categories);
  const docPath = path.join(process.cwd(), 'docs/canon/ids.md');
  
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, markdown, 'utf-8');
  
  console.log(`✓ Updated ${docPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
