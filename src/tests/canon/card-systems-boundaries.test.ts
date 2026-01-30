/**
 * @fileoverview Card Systems Boundaries Test
 * 
 * Change 298: Ensure each card system stays in its lane:
 * - Core card system doesn't import UI
 * - UI doesn't redefine core ports
 * - Audio cards don't collide with core cards
 * 
 * @module @cardplay/tests/canon/card-systems-boundaries
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../../');

/**
 * Get all TypeScript files in a directory recursively.
 */
function getTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...getTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Check if a file contains an import from a given module pattern.
 */
function fileImportsFrom(filePath: string, pattern: RegExp): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /^import\s+.*?from\s+['"]([^'"]+)['"]/gm;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (pattern.test(importPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a file exports a symbol matching a pattern.
 */
function fileExports(filePath: string, pattern: RegExp): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return pattern.test(content);
}

describe('Card Systems Boundaries (Change 298)', () => {
  it('core card system does not import UI modules', () => {
    const coreCardFiles = getTsFiles(path.join(srcDir, 'cards'));
    const violations: string[] = [];
    
    for (const file of coreCardFiles) {
      // Allow test files and specific documented adapters
      if (file.includes('__tests__') || file.includes('.test.')) continue;
      if (file.includes('adapter') && file.includes('ui')) continue; // Documented adapter layer
      
      // Check for UI imports
      if (fileImportsFrom(file, /['"](\.\.\/)*ui\//)) {
        violations.push(path.relative(srcDir, file));
      }
    }
    
    expect(violations).toEqual([]);
  });
  
  it('UI does not redefine canonical PortType without explicit renaming', () => {
    const uiFiles = getTsFiles(path.join(srcDir, 'ui'));
    const violations: string[] = [];
    
    for (const file of uiFiles) {
      if (file.includes('__tests__') || file.includes('.test.')) continue;
      
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for "export type PortType" without UIPortType/VisualPortType prefix
      // Allow: export type UIPortType, export type VisualPortType
      // Disallow: export type PortType (unless it's a deprecated alias)
      const exportPortTypeRegex = /export\s+type\s+PortType\s*=/;
      if (exportPortTypeRegex.test(content)) {
        // Check if there's a deprecation comment nearby
        const lines = content.split('\n');
        let foundExport = false;
        let hasDeprecation = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (exportPortTypeRegex.test(lines[i])) {
            foundExport = true;
            // Check previous 5 lines for @deprecated
            for (let j = Math.max(0, i - 5); j < i; j++) {
              if (lines[j].includes('@deprecated')) {
                hasDeprecation = true;
                break;
              }
            }
          }
        }
        
        if (foundExport && !hasDeprecation) {
          violations.push(path.relative(srcDir, file));
        }
      }
    }
    
    expect(violations).toEqual([]);
  });
  
  it('audio module cards do not collide with core Card type', () => {
    const audioCardFile = path.join(srcDir, 'audio/instrument-cards.ts');
    
    if (fs.existsSync(audioCardFile)) {
      const content = fs.readFileSync(audioCardFile, 'utf-8');
      
      // Should export AudioModuleCard, not bare "Card"
      const exportCardRegex = /export\s+(interface|type)\s+Card\s+/;
      const hasViolation = exportCardRegex.test(content);
      
      // Check if it's a deprecated alias
      if (hasViolation) {
        const hasDeprecation = content.includes('@deprecated');
        expect(hasDeprecation).toBe(true);
      }
    }
  });
  
  it('audio module does not import core card registry', () => {
    const audioFiles = getTsFiles(path.join(srcDir, 'audio'));
    const violations: string[] = [];
    
    for (const file of audioFiles) {
      if (file.includes('__tests__') || file.includes('.test.')) continue;
      
      // Audio system should not import from core cards/registry
      // (it has its own module card system)
      if (fileImportsFrom(file, /['"](\.\.\/)*cards\/registry/)) {
        violations.push(path.relative(srcDir, file));
      }
    }
    
    expect(violations).toEqual([]);
  });
  
  it('theory cards do not import UI components', () => {
    const theoryFiles = getTsFiles(path.join(srcDir, 'ai/theory'));
    const violations: string[] = [];
    
    for (const file of theoryFiles) {
      if (file.includes('__tests__') || file.includes('.test.')) continue;
      if (file.includes('ui-adapter')) continue; // Documented adapter layer
      
      // Theory cards should not import UI
      if (fileImportsFrom(file, /['"](\.\.\/)*ui\//)) {
        violations.push(path.relative(srcDir, file));
      }
    }
    
    expect(violations).toEqual([]);
  });
  
  it('core cards module has no ambiguous Stack export colliding with UI', () => {
    const cardStackFile = path.join(srcDir, 'cards/stack.ts');
    const uiStackFile = path.join(srcDir, 'ui/components/stack-component.ts');
    
    if (fs.existsSync(cardStackFile) && fs.existsSync(uiStackFile)) {
      const coreContent = fs.readFileSync(cardStackFile, 'utf-8');
      const uiContent = fs.readFileSync(uiStackFile, 'utf-8');
      
      // Core should export Stack (for composition)
      expect(coreContent).toMatch(/export.*Stack/);
      
      // UI should export UIStack* or similar (not bare Stack)
      const uiBareStackExport = /export\s+(class|interface|type)\s+Stack\s+/.test(uiContent);
      const hasDeprecation = uiContent.includes('@deprecated');
      
      if (uiBareStackExport) {
        // If UI exports bare Stack, it must be deprecated
        expect(hasDeprecation).toBe(true);
      }
    }
  });
});
