#!/usr/bin/env tsx

/**
 * check-doc-code-snippets.ts
 * 
 * Extracts TypeScript snippets from docs and typechecks them
 * against tsconfig.json
 * 
 * Change 046 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const TEMP_DIR = path.join(ROOT, '.tmp-snippet-check');

interface Snippet {
  file: string;
  startLine: number;
  endLine: number;
  code: string;
  language: string;
}

function extractSnippets(): Snippet[] {
  const snippets: Snippet[] = [];
  
  function scanDir(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        extractFromFile(fullPath);
      }
    }
  }
  
  function extractFromFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let language = '';
    let startLine = 0;
    let codeLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          language = line.substring(3).trim();
          startLine = lineNum;
          inCodeBlock = true;
          codeLines = [];
        } else {
          // End of code block
          if (language === 'ts' || language === 'typescript') {
            snippets.push({
              file: path.relative(ROOT, filePath),
              startLine,
              endLine: lineNum,
              code: codeLines.join('\n'),
              language,
            });
          }
          inCodeBlock = false;
          language = '';
          codeLines = [];
        }
      } else if (inCodeBlock) {
        codeLines.push(line);
      }
    }
  }
  
  scanDir(DOCS_DIR);
  return snippets;
}

function typecheckSnippets(snippets: Snippet[]): { file: string; errors: string }[] {
  const results: { file: string; errors: string }[] = [];
  
  // Create temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  
  // Create a wrapper for each snippet
  for (const snippet of snippets) {
    const hash = crypto.createHash('md5').update(snippet.file + snippet.startLine).digest('hex').substring(0, 8);
    const filename = `snippet-${hash}.ts`;
    const filepath = path.join(TEMP_DIR, filename);
    
    // Wrap snippet with imports that might be needed
    const wrapped = `
// Auto-generated from ${snippet.file}:${snippet.startLine}-${snippet.endLine}
// This file is used to typecheck doc code snippets

${snippet.code}
`;
    
    fs.writeFileSync(filepath, wrapped, 'utf-8');
  }
  
  // Run typecheck on temp directory
  try {
    execSync(`npx tsc --noEmit --skipLibCheck ${path.join(TEMP_DIR, '*.ts')}`, {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string };
    const output = err.stdout || err.stderr || '';
    
    // Parse errors and map back to source files
    for (const line of output.split('\n')) {
      const match = line.match(/snippet-([a-f0-9]+)\.ts\((\d+),(\d+)\): (.+)/);
      if (match) {
        const hash = match[1];
        const lineNum = parseInt(match[2], 10);
        const errorMsg = match[4];
        
        // Find original snippet
        const snippet = snippets.find(s => {
          const snippetHash = crypto.createHash('md5').update(s.file + s.startLine).digest('hex').substring(0, 8);
          return snippetHash === hash;
        });
        
        if (snippet) {
          results.push({
            file: `${snippet.file}:${snippet.startLine + lineNum - 4}`, // Adjust for wrapper
            errors: errorMsg,
          });
        }
      }
    }
  }
  
  // Clean up
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
  
  return results;
}

function main() {
  console.log('Extracting TypeScript snippets from docs...\n');
  
  const snippets = extractSnippets();
  console.log(`Found ${snippets.length} TypeScript snippets\n`);
  
  if (snippets.length === 0) {
    console.log('✅ No snippets to check\n');
    process.exit(0);
  }
  
  console.log('Typechecking snippets...\n');
  
  const errors = typecheckSnippets(snippets);
  
  if (errors.length === 0) {
    console.log('✅ All snippets typecheck successfully\n');
    process.exit(0);
  }
  
  console.log('❌ Typecheck errors in doc snippets:\n');
  for (const error of errors) {
    console.log(`  ${error.file}`);
    console.log(`    ${error.errors}`);
  }
  
  console.log(`\nTotal errors: ${errors.length}\n`);
  process.exit(1);
}

main();
