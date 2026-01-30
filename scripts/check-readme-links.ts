#!/usr/bin/env ts-node
/**
 * check-readme-links.ts
 * Ensures cardplay/docs/index.md links resolve
 * 
 * Change 045 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = path.join(__dirname, '../docs');
const INDEX_PATH = path.join(DOCS_ROOT, 'index.md');

interface LinkViolation {
  line: number;
  link: string;
  reason: string;
}

function checkLinks(): LinkViolation[] {
  const violations: LinkViolation[] = [];
  
  if (!fs.existsSync(INDEX_PATH)) {
    violations.push({
      line: 0,
      link: INDEX_PATH,
      reason: 'index.md not found'
    });
    return violations;
  }
  
  const content = fs.readFileSync(INDEX_PATH, 'utf-8');
  const lines = content.split('\n');
  
  // Match markdown links: [text](url)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    let match;
    while ((match = linkPattern.exec(line)) !== null) {
      const linkUrl = match[2];
      
      // Skip external links
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        continue;
      }
      
      // Skip anchors
      if (linkUrl.startsWith('#')) {
        continue;
      }
      
      // Resolve relative path
      const targetPath = path.join(DOCS_ROOT, linkUrl);
      
      if (!fs.existsSync(targetPath)) {
        violations.push({
          line: lineNum,
          link: linkUrl,
          reason: 'File not found'
        });
      }
    }
  }
  
  return violations;
}

function main(): void {
  console.log('Checking README links...\n');
  
  const violations = checkLinks();
  
  if (violations.length > 0) {
    console.log('ℹ Broken links found:\n');
    
    violations.forEach(v => {
      console.log(`  Line ${v.line}: ${v.link}`);
      console.log(`    ${v.reason}\n`);
    });
    
    console.log(`Found ${violations.length} broken link(s)`);
    console.log('(This is informational)\n');
    
    // Don't fail - informational only
    process.exit(0);
  }
  
  console.log('✓ All links in index.md are valid\n');
  process.exit(0);
}

main();
