#!/usr/bin/env tsx
/**
 * Syncs cardplay/docs/canon/module-map.md with the current code tree
 * Maps canonical module names to actual file paths
 */

import * as fs from 'fs';
import * as path from 'path';

interface ModuleMapping {
  canonicalPath: string;
  actualPath: string;
  exports: string[];
  isLegacy: boolean;
}

function findTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.includes('node_modules')) {
      findTsFiles(filePath, fileList);
    } else if (file.name.endsWith('.ts') && !file.name.endsWith('.test.ts') && !file.name.endsWith('.spec.ts')) {
      fileList.push(filePath.replace(process.cwd() + '/', ''));
    }
  }
  
  return fileList;
}

async function scanModuleStructure(): Promise<ModuleMapping[]> {
  const mappings: ModuleMapping[] = [];
  const srcFiles = findTsFiles(path.join(process.cwd(), 'src'));

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Extract exports
    const exports = [];
    const exportMatches = content.matchAll(/export\s+(?:type|interface|class|function|const|enum)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }

    // Check if file has legacy markers
    const isLegacy = content.includes('@legacy') || content.includes('LEGACY:');

    // Determine canonical path (simplify common patterns)
    let canonicalPath = file;
    
    // Map common legacy patterns to canonical
    if (file.includes('src/core/')) {
      canonicalPath = file.replace('src/core/', 'src/');
    }
    if (file.includes('src/registry/')) {
      canonicalPath = file.replace('src/registry/', 'src/extensions/registry/');
    }

    mappings.push({
      canonicalPath,
      actualPath: file,
      exports,
      isLegacy
    });
  }

  return mappings;
}

function generateMarkdown(mappings: ModuleMapping[]): string {
  let md = `# Module Map

**Status:** Maintained (auto-generated)
**Last Updated:** ${new Date().toISOString().split('T')[0]}

This document maps canonical module paths (used in docs) to actual file locations in the codebase.

---

## Canonical Modules

These modules are stable and match their canonical paths:

| Canonical Path | Actual Path | Key Exports |
|---------------|-------------|-------------|
`;

  const canonical = mappings
    .filter(m => !m.isLegacy && m.canonicalPath === m.actualPath)
    .sort((a, b) => a.canonicalPath.localeCompare(b.canonicalPath));

  for (const mapping of canonical) {
    const exportList = mapping.exports.slice(0, 3).join(', ');
    const more = mapping.exports.length > 3 ? `, +${mapping.exports.length - 3}` : '';
    md += `| \`${mapping.canonicalPath}\` | \`${mapping.actualPath}\` | ${exportList}${more} |\n`;
  }

  md += `\n## Aliased Modules

These modules have been moved but maintain compatibility:

| Canonical Path | Actual Path | Status |
|---------------|-------------|--------|
`;

  const aliased = mappings
    .filter(m => !m.isLegacy && m.canonicalPath !== m.actualPath)
    .sort((a, b) => a.canonicalPath.localeCompare(b.canonicalPath));

  for (const mapping of aliased) {
    md += `| \`${mapping.canonicalPath}\` | \`${mapping.actualPath}\` | Redirected |\n`;
  }

  md += `\n## Legacy Modules

These modules are deprecated and should not be used in new code:

| Actual Path | Canonical Replacement | Status |
|-------------|----------------------|--------|
`;

  const legacy = mappings
    .filter(m => m.isLegacy)
    .sort((a, b) => a.actualPath.localeCompare(b.actualPath));

  for (const mapping of legacy) {
    md += `| \`${mapping.actualPath}\` | \`${mapping.canonicalPath}\` | Deprecated |\n`;
  }

  md += `\n---

## Guidelines

1. **New code**: Always import from canonical paths
2. **Aliased modules**: Update imports gradually during refactors
3. **Legacy modules**: Do not use in new code; migrate existing usage

To regenerate this document: \`npm run docs:sync-modules\`
`;

  return md;
}

async function main() {
  console.log('Scanning module structure...');
  const mappings = await scanModuleStructure();
  console.log(`Found ${mappings.length} modules`);

  const markdown = generateMarkdown(mappings);
  const docPath = path.join(process.cwd(), 'docs/canon/module-map.md');
  
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, markdown, 'utf-8');
  
  console.log(`✓ Updated ${docPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
