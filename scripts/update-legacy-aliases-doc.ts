#!/usr/bin/env tsx
/**
 * Syncs cardplay/docs/canon/legacy-type-aliases.md with code
 * Scans codebase for deprecated aliases and updates the doc
 */

import * as fs from 'fs';
import * as path from 'path';

interface AliasEntry {
  canonical: string;
  legacy: string;
  location: string;
  category: 'type' | 'value' | 'function';
}

function findTsFiles(dir: string, fileList: string[] = []): string[] {
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

async function findDeprecatedAliases(): Promise<AliasEntry[]> {
  const aliases: AliasEntry[] = [];
  const srcFiles = findTsFiles(path.join(process.cwd(), 'src'));

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Find deprecated type aliases: /** @deprecated ... */ export type Legacy = Canon;
      if (line.includes('@deprecated')) {
        const nextLine = lines[i + 1] || '';
        const typeMatch = nextLine.match(/export\s+type\s+(\w+)\s*=\s*(\w+)/);
        if (typeMatch) {
          aliases.push({
            legacy: typeMatch[1],
            canonical: typeMatch[2],
            location: file,
            category: 'type'
          });
        }

        const constMatch = nextLine.match(/export\s+const\s+(\w+)\s*=\s*(\w+)/);
        if (constMatch) {
          aliases.push({
            legacy: constMatch[1],
            canonical: constMatch[2],
            location: file,
            category: 'value'
          });
        }

        const funcMatch = nextLine.match(/export\s+(?:function|const)\s+(\w+)/);
        if (funcMatch && nextLine.includes('=>')) {
          // Extract canonical from comment or function body
          const canonMatch = line.match(/@deprecated.*use\s+(\w+)/i);
          if (canonMatch) {
            aliases.push({
              legacy: funcMatch[1],
              canonical: canonMatch[1],
              location: file,
              category: 'function'
            });
          }
        }
      }
    }
  }

  return aliases;
}

function generateMarkdown(aliases: AliasEntry[]): string {
  const grouped = {
    type: aliases.filter(a => a.category === 'type'),
    value: aliases.filter(a => a.category === 'value'),
    function: aliases.filter(a => a.category === 'function')
  };

  let md = `# Legacy Type Aliases

**Status:** Maintained (auto-generated)
**Last Updated:** ${new Date().toISOString().split('T')[0]}

This document tracks deprecated type aliases, value aliases, and function aliases in the codebase.
All legacy symbols should be migrated to their canonical equivalents.

---

## Type Aliases

| Legacy Name | Canonical Name | Location |
|-------------|---------------|----------|
`;

  for (const alias of grouped.type.sort((a, b) => a.legacy.localeCompare(b.legacy))) {
    md += `| \`${alias.legacy}\` | \`${alias.canonical}\` | \`${alias.location}\` |\n`;
  }

  md += `\n## Value Aliases

| Legacy Name | Canonical Name | Location |
|-------------|---------------|----------|
`;

  for (const alias of grouped.value.sort((a, b) => a.legacy.localeCompare(b.legacy))) {
    md += `| \`${alias.legacy}\` | \`${alias.canonical}\` | \`${alias.location}\` |\n`;
  }

  md += `\n## Function Aliases

| Legacy Name | Canonical Name | Location |
|-------------|---------------|----------|
`;

  for (const alias of grouped.function.sort((a, b) => a.legacy.localeCompare(b.legacy))) {
    md += `| \`${alias.legacy}\` | \`${alias.canonical}\` | \`${alias.location}\` |\n`;
  }

  md += `\n---

## Migration Guidelines

1. Replace all uses of legacy names with canonical names
2. Run \`npm run typecheck\` to verify changes
3. Update tests to use canonical names
4. Once all uses are migrated, the deprecated exports can be removed

To regenerate this document: \`npm run docs:sync-aliases\`
`;

  return md;
}

async function main() {
  console.log('Scanning codebase for deprecated aliases...');
  const aliases = await findDeprecatedAliases();
  console.log(`Found ${aliases.length} deprecated aliases`);

  const markdown = generateMarkdown(aliases);
  const docPath = path.join(process.cwd(), 'docs/canon/legacy-type-aliases.md');
  
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, markdown, 'utf-8');
  
  console.log(`✓ Updated ${docPath}`);
  console.log(`  - ${aliases.filter(a => a.category === 'type').length} type aliases`);
  console.log(`  - ${aliases.filter(a => a.category === 'value').length} value aliases`);
  console.log(`  - ${aliases.filter(a => a.category === 'function').length} function aliases`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
