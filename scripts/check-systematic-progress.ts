#!/usr/bin/env ts-node
/**
 * Generate a progress report on the systematic changes plan.
 * Scans to_fix_repo_plan_500.md and counts completed vs remaining changes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAN_FILE = path.resolve(__dirname, '../to_fix_repo_plan_500.md');

interface PhaseStats {
  name: string;
  total: number;
  completed: number;
  percentage: number;
}

function analyzePlan(): void {
  const content = fs.readFileSync(PLAN_FILE, 'utf-8');
  const lines = content.split('\n');
  
  let currentPhase = '';
  const phases = new Map<string, PhaseStats>();
  let totalCompleted = 0;
  let totalChanges = 0;
  
  for (const line of lines) {
    // Detect phase headers
    if (line.match(/^## Phase \d+/)) {
      currentPhase = line.replace(/^## /, '').trim();
      if (!phases.has(currentPhase)) {
        phases.set(currentPhase, { name: currentPhase, total: 0, completed: 0, percentage: 0 });
      }
    }
    
    // Count changes
    if (line.match(/^- \[(x| )\] Change \d+/)) {
      totalChanges++;
      const stats = phases.get(currentPhase);
      if (stats) {
        stats.total++;
        if (line.startsWith('- [x]')) {
          stats.completed++;
          totalCompleted++;
        }
      }
    }
  }
  
  // Calculate percentages
  for (const [_, stats] of phases) {
    stats.percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  }
  
  // Print report
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SYSTEMATIC CHANGES PROGRESS REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`Total Progress: ${totalCompleted}/${totalChanges} changes (${Math.round((totalCompleted/totalChanges)*100)}%)\n`);
  
  const barLength = 50;
  const completedBars = Math.round((totalCompleted / totalChanges) * barLength);
  const bar = '█'.repeat(completedBars) + '░'.repeat(barLength - completedBars);
  console.log(`[${bar}]\n`);
  
  console.log('Phase Breakdown:');
  console.log('───────────────────────────────────────────────────────────────');
  
  for (const [_, stats] of phases) {
    const phaseName = stats.name.padEnd(55);
    const progress = `${stats.completed}/${stats.total}`.padStart(8);
    const pct = `${stats.percentage}%`.padStart(5);
    
    let icon = '○';
    if (stats.percentage === 100) icon = '✓';
    else if (stats.percentage >= 75) icon = '◐';
    else if (stats.percentage >= 50) icon = '◑';
    else if (stats.percentage >= 25) icon = '◔';
    
    console.log(`${icon} ${phaseName} ${progress}  ${pct}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  
  // Identify next priorities
  console.log('\nNext Priorities (uncompleted changes in Phase 0-1):');
  console.log('───────────────────────────────────────────────────────────────');
  
  let foundPriority = false;
  currentPhase = '';
  for (const line of lines) {
    if (line.match(/^## Phase [01]/)) {
      currentPhase = line;
    }
    if (currentPhase && line.match(/^- \[ \] Change \d+/)) {
      const changeNum = line.match(/Change (\d+)/)?.[1];
      const desc = line.replace(/^- \[ \] Change \d+ — /, '').substring(0, 70);
      console.log(`  • Change ${changeNum}: ${desc}...`);
      foundPriority = true;
    }
  }
  
  if (!foundPriority) {
    console.log('  All Phase 0-1 changes complete! ✓');
  }
  
  console.log('\n');
}

analyzePlan();
