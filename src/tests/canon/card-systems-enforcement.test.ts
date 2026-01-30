/**
 * @fileoverview Card Systems Enforcement Test
 * 
 * Change 300: Fail if new duplicate symbols are introduced without updating
 * legacy-type-aliases.md documentation.
 * 
 * This test detects when multiple "Card", "Deck", or "Stack" types are exported
 * and ensures they're documented in the legacy aliases doc.
 * 
 * @module @cardplay/tests/canon/card-systems-enforcement
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

/**
 * Known ambiguous symbols that have multiple definitions.
 * These must be documented in docs/canon/legacy-type-aliases.md
 */
const AMBIGUOUS_SYMBOLS = ['Card', 'Deck', 'Stack', 'Track', 'CardState', 'PortType'];

/**
 * Extract exported symbol names from a TypeScript file.
 */
function extractExportedSymbols(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const symbols: string[] = [];
  
  // Match: export interface Foo, export type Bar, export class Baz
  const exportRegex = /export\s+(interface|type|class|const|function)\s+([A-Z][A-Za-z0-9_]*)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    symbols.push(match[2]);
  }
  
  return symbols;
}

/**
 * Find all TypeScript files that export a given symbol.
 */
function findFilesExporting(symbol: string, srcDir: string): string[] {
  const files: string[] = [];
  
  function scan(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
          scan(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        const exports = extractExportedSymbols(fullPath);
        if (exports.includes(symbol)) {
          files.push(path.relative(srcDir, fullPath));
        }
      }
    }
  }
  
  scan(srcDir);
  return files;
}

/**
 * Parse legacy-type-aliases.md to extract documented ambiguous symbols.
 */
function getDocumentedAmbiguousSymbols(): Set<string> {
  const docPath = path.join(projectRoot, 'docs/canon/legacy-type-aliases.md');
  const documented = new Set<string>();
  
  if (!fs.existsSync(docPath)) {
    return documented;
  }
  
  const content = fs.readFileSync(docPath, 'utf-8');
  
  // Parse table rows like: | `Card` (audio) | `AudioModuleCard` | ...
  // or bold entries like: | **`HostAction`** | **Canonical** | ...
  const tableRowRegex = /^\|\s*\*?\*?`([A-Z][A-Za-z0-9_]*)`\*?\*?\s*\(/gm;
  let match;
  
  while ((match = tableRowRegex.exec(content)) !== null) {
    const symbol = match[1];
    documented.add(symbol);
  }
  
  return documented;
}

describe('Card Systems Enforcement (Change 300)', () => {
  const srcDir = path.join(projectRoot, 'src');
  const documented = getDocumentedAmbiguousSymbols();
  
  for (const symbol of AMBIGUOUS_SYMBOLS) {
    it(`${symbol}: multiple definitions must be documented`, () => {
      const files = findFilesExporting(symbol, srcDir);
      
      if (files.length > 1) {
        // Multiple files export this symbol - it must be documented
        const isDocumented = documented.has(symbol);
        
        if (!isDocumented) {
          const fileList = files.join('\n  - ');
          expect.fail(
            `Symbol "${symbol}" is exported from multiple files but not documented in docs/canon/legacy-type-aliases.md:\n` +
            `  - ${fileList}\n\n` +
            `Please add a section for "${symbol}" in the legacy aliases doc explaining the different uses.`
          );
        }
      }
    });
  }
  
  it('documented symbols actually have multiple definitions', () => {
    const undocumented: string[] = [];
    
    for (const symbol of documented) {
      let files = findFilesExporting(symbol, srcDir);
      
      // Special case: if looking for CardDefinition, also check for EditorCardDefinition
      // since the doc lists both as variations
      if (symbol === 'CardDefinition') {
        const editorFiles = findFilesExporting('EditorCardDefinition', srcDir);
        if (editorFiles.length > 0) {
          // Count both as part of the CardDefinition family
          files = [...new Set([...files, ...editorFiles])];
        }
      }
      
      // Symbol is documented but only has 0-1 definitions
      if (files.length <= 1) {
        undocumented.push(`${symbol} (${files.length} definition${files.length === 1 ? '' : 's'})`);
      }
    }
    
    if (undocumented.length > 0) {
      expect.fail(
        `These symbols are documented in legacy-type-aliases.md but don't have multiple definitions:\n` +
        `  - ${undocumented.join('\n  - ')}\n\n` +
        `Consider removing them from the doc if they're no longer ambiguous.`
      );
    }
  });
  
  it('all deprecated symbol exports have @deprecated JSDoc tags', () => {
    const violations: string[] = [];
    
    for (const symbol of AMBIGUOUS_SYMBOLS) {
      const files = findFilesExporting(symbol, srcDir);
      
      // Skip symbols with only one export
      if (files.length <= 1) continue;
      
      for (const file of files) {
        const fullPath = path.join(srcDir, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Find export statements for this symbol
        const exportRegex = new RegExp(
          `export\\s+(interface|type|class|const)\\s+${symbol}\\s*[<=]`,
          'g'
        );
        const hasExport = exportRegex.test(content);
        
        if (hasExport) {
          // Check if it's the canonical export or a deprecated alias
          const lines = content.split('\n');
          let foundDeprecated = false;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match export type/interface/class Foo
            if (new RegExp(`export\\s+(type|interface|class|const)\\s+${symbol}`).test(line)) {
              // Check previous 10 lines for @deprecated or "canonical" comment
              for (let j = Math.max(0, i - 10); j < i; j++) {
                if (lines[j].includes('@deprecated') || 
                    lines[j].includes('canonical name is') ||
                    lines[j].includes('Canonical') ||
                    lines[j].includes('SSOT')) {
                  foundDeprecated = true;
                  break;
                }
              }
              
              // If it's a duplicate and not marked canonical/deprecated, check if it's in the known canonical list
              if (!foundDeprecated) {
                const isCanonical = 
                  (symbol === 'Card' && file === 'cards/card.ts') ||
                  (symbol === 'CardState' && (file === 'cards/card.ts' || file === 'ui/components/card-component.ts')) || // Both are canonical for different purposes
                  (symbol === 'Deck' && file === 'boards/types.ts') ||
                  (symbol === 'Stack' && file === 'cards/stack.ts') ||
                  (symbol === 'Track' && file === 'state/types.ts') ||
                  (symbol === 'PortType' && (file === 'canon/ids.ts' || file === 'cards/card.ts')); // Both are canonical for different purposes
                
                if (!isCanonical && files.length > 1) {
                  violations.push(`${file}: exports ${symbol} without @deprecated or canonical marker`);
                }
              }
            }
          }
        }
      }
    }
    
    expect(violations).toEqual([]);
  });
});
