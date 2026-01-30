#!/usr/bin/env tsx

/**
 * check-layer-boundaries.ts
 * 
 * Flags direct Prolog→state mutations outside HostAction application points.
 * Ensures clean layer separation.
 * 
 * Change 049 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');

interface Violation {
  file: string;
  line: number;
  violation: string;
  context: string;
}

function checkLayerBoundaries(): Violation[] {
  const violations: Violation[] = [];
  
  // Allowed mutation points
  const ALLOWED_MUTATION_FILES = new Set([
    'src/ai/theory/apply-host-action.ts',
    'src/ai/theory/host-action-applier.ts',
    'src/ai/engine/action-executor.ts',
  ]);
  
  function scanDir(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        checkFile(fullPath);
      }
    }
  }
  
  function checkFile(filePath: string): void {
    const relativePath = path.relative(ROOT, filePath);
    
    // Skip allowed mutation files
    if (ALLOWED_MUTATION_FILES.has(relativePath.replace(/\\/g, '/'))) {
      return;
    }
    
    // Only check AI/Prolog-related files
    if (!relativePath.includes('ai/') && !relativePath.includes('prolog')) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Patterns that indicate direct state mutation
      const mutationPatterns = [
        // Direct SSOT store access
        { pattern: /getSharedEventStore\(\).*\.(add|update|delete|set|modify)/i, desc: 'Direct EventStore mutation' },
        { pattern: /getClipRegistry\(\).*\.(add|update|delete|set|modify)/i, desc: 'Direct ClipRegistry mutation' },
        { pattern: /getRoutingGraphStore\(\).*\.(add|update|delete|set|modify)/i, desc: 'Direct RoutingGraphStore mutation' },
        { pattern: /getBoardStateStore\(\).*\.(set|update)/i, desc: 'Direct BoardStateStore mutation' },
        
        // MusicSpec direct mutation
        { pattern: /musicSpec\.(constraints|scale|tonality|tempo)\s*=/, desc: 'Direct MusicSpec mutation' },
        { pattern: /spec\.(constraints|scale|tonality|tempo)\s*=/, desc: 'Direct spec mutation' },
        
        // Prolog adapter calling state mutations directly
        { pattern: /prologAdapter.*eventStore\.(add|delete|update)/, desc: 'Prolog adapter mutating state' },
      ];
      
      for (const { pattern, desc } of mutationPatterns) {
        if (pattern.test(line)) {
          // Check if it's in a comment
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
            continue;
          }
          
          violations.push({
            file: relativePath,
            line: lineNum,
            violation: desc,
            context: line.trim(),
          });
        }
      }
    }
  }
  
  scanDir(SRC_DIR);
  
  return violations;
}

function main() {
  console.log('Checking layer boundaries (Prolog → State)...\n');
  
  const violations = checkLayerBoundaries();
  
  if (violations.length === 0) {
    console.log('✅ No layer boundary violations found\n');
    process.exit(0);
  }
  
  console.log('❌ Layer boundary violations:\n');
  console.log('Prolog/AI code should not directly mutate state.\n');
  console.log('Use HostAction application points instead.\n\n');
  
  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}`);
    console.log(`    ${v.violation}`);
    console.log(`    ${v.context}`);
    console.log('');
  }
  
  console.log(`Total violations: ${violations.length}\n`);
  console.log('Allowed mutation points:');
  console.log('  - src/ai/theory/apply-host-action.ts');
  console.log('  - src/ai/theory/host-action-applier.ts');
  console.log('  - src/ai/engine/action-executor.ts\n');
  
  process.exit(1);
}

main();
