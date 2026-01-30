#!/usr/bin/env ts-node
/**
 * ci-smoke.ts
 * Runs minimal "canon + typecheck + key tests" locally
 * 
 * Change 030 from to_fix_repo_plan_500.md
 */

import { spawn } from 'child_process';

const COMMANDS = [
  { name: 'TypeCheck', cmd: 'npm', args: ['run', 'typecheck'] },
  { name: 'Canon Tests', cmd: 'npm', args: ['run', 'test:canon'] },
  { name: 'Canon Check', cmd: 'npm', args: ['run', 'canon:check'] },
];

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
}

async function runCommand(name: string, cmd: string, args: string[]): Promise<TestResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    console.log(`\n▶ Running ${name}...`);
    
    const proc = spawn(cmd, args, { 
      stdio: 'inherit',
      shell: true,
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const passed = code === 0;
      
      if (passed) {
        console.log(`✓ ${name} passed (${(duration / 1000).toFixed(2)}s)`);
      } else {
        console.log(`✗ ${name} failed (${(duration / 1000).toFixed(2)}s)`);
      }
      
      resolve({ name, passed, duration });
    });
    
    proc.on('error', (err) => {
      console.error(`Error running ${name}:`, err);
      resolve({ name, passed: false, duration: Date.now() - startTime });
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  CI Smoke Test Suite');
  console.log('═══════════════════════════════════════');
  
  const results: TestResult[] = [];
  
  for (const { name, cmd, args } of COMMANDS) {
    const result = await runCommand(name, cmd, args);
    results.push(result);
    
    // Stop on first failure
    if (!result.passed) {
      break;
    }
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('  Results');
  console.log('═══════════════════════════════════════\n');
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const allPassed = results.every(r => r.passed);
  
  results.forEach(result => {
    const icon = result.passed ? '✓' : '✗';
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`  ${icon} ${result.name}: ${status} (${(result.duration / 1000).toFixed(2)}s)`);
  });
  
  console.log(`\n  Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  
  if (allPassed) {
    console.log('\n  ✓ All smoke tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n  ✗ Some tests failed\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
