#!/usr/bin/env tsx
/**
 * Generates cardplay/docs/canon/implementation-status.md
 * Enumerates which canon docs are fully implemented vs partial
 */

import * as fs from 'fs';
import * as path from 'path';

interface CanonDocStatus {
  docPath: string;
  status: 'implemented' | 'partial' | 'aspirational' | 'unknown';
  testCoverage: string[];
  codeModules: string[];
  notes: string;
}

function findMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.name.endsWith('.md')) {
      fileList.push(filePath.replace(process.cwd() + '/', ''));
    }
  }
  
  return fileList;
}

function findTestFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.name.endsWith('.test.ts')) {
      fileList.push(filePath.replace(process.cwd() + '/', ''));
    }
  }
  
  return fileList;
}

async function scanCanonDocs(): Promise<CanonDocStatus[]> {
  const statuses: CanonDocStatus[] = [];
  const docsPath = path.join(process.cwd(), 'docs/canon');
  
  if (!fs.existsSync(docsPath)) {
    return statuses;
  }

  const docFiles = findMarkdownFiles(docsPath);

  for (const docPath of docFiles) {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Extract status from doc
    let status: 'implemented' | 'partial' | 'aspirational' | 'unknown' = 'unknown';
    const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/i);
    if (statusMatch) {
      const s = statusMatch[1].toLowerCase();
      if (s.includes('implement') || s.includes('maintain')) status = 'implemented';
      else if (s.includes('partial')) status = 'partial';
      else if (s.includes('aspiration')) status = 'aspirational';
    }

    // Find referenced code modules
    const codeModules: string[] = [];
    const codeRefs = content.matchAll(/`(src\/[^`]+\.ts)`/g);
    for (const match of codeRefs) {
      if (!codeModules.includes(match[1])) {
        codeModules.push(match[1]);
      }
    }

    // Find test files that reference this doc
    const testCoverage: string[] = [];
    const docName = path.basename(docPath, '.md');
    const testFiles = findTestFiles(path.join(process.cwd(), 'src'));
    
    for (const testFile of testFiles) {
      const testContent = fs.readFileSync(testFile, 'utf-8');
      if (testContent.includes(docName) || testContent.includes(docPath)) {
        testCoverage.push(testFile);
      }
    }

    // Extract notes
    let notes = '';
    const notesMatch = content.match(/\*\*Notes?:\*\*\s*([^\n]+)/i);
    if (notesMatch) {
      notes = notesMatch[1];
    }

    statuses.push({
      docPath,
      status,
      testCoverage,
      codeModules,
      notes
    });
  }

  return statuses;
}

function generateMarkdown(statuses: CanonDocStatus[]): string {
  const implemented = statuses.filter(s => s.status === 'implemented');
  const partial = statuses.filter(s => s.status === 'partial');
  const aspirational = statuses.filter(s => s.status === 'aspirational');
  const unknown = statuses.filter(s => s.status === 'unknown');

  let md = `# Canon Implementation Status

**Status:** Maintained (auto-generated)
**Generated:** ${new Date().toISOString().split('T')[0]}

This document tracks implementation status of canonical documentation.

---

## Summary

- ✅ **${implemented.length} Implemented** - Fully implemented with tests
- 🟡 **${partial.length} Partial** - Partially implemented
- 🔵 **${aspirational.length} Aspirational** - Design documents, not yet implemented
- ❓ **${unknown.length} Unknown** - Status not documented

---

## Implemented (${implemented.length})

These canon docs are fully implemented and tested:

| Document | Test Coverage | Code Modules |
|----------|--------------|--------------|
`;

  for (const doc of implemented.sort((a, b) => a.docPath.localeCompare(b.docPath))) {
    const tests = doc.testCoverage.length > 0 ? `${doc.testCoverage.length} test(s)` : 'No tests';
    const modules = doc.codeModules.length > 0 ? `${doc.codeModules.length} module(s)` : 'No modules';
    md += `| \`${doc.docPath}\` | ${tests} | ${modules} |\n`;
  }

  md += `\n## Partial Implementation (${partial.length})

These canon docs are partially implemented:

| Document | Test Coverage | Code Modules | Notes |
|----------|--------------|--------------|-------|
`;

  for (const doc of partial.sort((a, b) => a.docPath.localeCompare(b.docPath))) {
    const tests = doc.testCoverage.length > 0 ? `${doc.testCoverage.length} test(s)` : 'No tests';
    const modules = doc.codeModules.length > 0 ? `${doc.codeModules.length} module(s)` : 'No modules';
    md += `| \`${doc.docPath}\` | ${tests} | ${modules} | ${doc.notes || 'N/A'} |\n`;
  }

  md += `\n## Aspirational (${aspirational.length})

These canon docs describe future features:

| Document | Notes |
|----------|-------|
`;

  for (const doc of aspirational.sort((a, b) => a.docPath.localeCompare(b.docPath))) {
    md += `| \`${doc.docPath}\` | ${doc.notes || 'Future feature'} |\n`;
  }

  if (unknown.length > 0) {
    md += `\n## Unknown Status (${unknown.length})

These canon docs need status annotation:

| Document |
|----------|
`;

    for (const doc of unknown.sort((a, b) => a.docPath.localeCompare(b.docPath))) {
      md += `| \`${doc.docPath}\` |\n`;
    }
  }

  md += `\n---

## Guidelines

- All canon docs should have a \`**Status:**\` header
- Implemented features should have corresponding tests
- Code modules should reference their canon docs
- Aspirational features should be clearly marked

To regenerate this document: \`npm run docs:implementation-status\`
`;

  return md;
}

async function main() {
  console.log('Scanning canon documentation...');
  const statuses = await scanCanonDocs();
  console.log(`Found ${statuses.length} canon documents`);

  const markdown = generateMarkdown(statuses);
  const docPath = path.join(process.cwd(), 'docs/canon/implementation-status.md');
  
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, markdown, 'utf-8');
  
  console.log(`✓ Updated ${docPath}`);
  console.log(`  - ${statuses.filter(s => s.status === 'implemented').length} implemented`);
  console.log(`  - ${statuses.filter(s => s.status === 'partial').length} partial`);
  console.log(`  - ${statuses.filter(s => s.status === 'aspirational').length} aspirational`);
  console.log(`  - ${statuses.filter(s => s.status === 'unknown').length} unknown`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
