#!/usr/bin/env ts-node
/**
 * codemod-runner.ts
 * Shared codemod runner for bulk renames and transformations
 * 
 * Change 021 from to_fix_repo_plan_500.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface CodemodContext {
  filePath: string;
  content: string;
  modified: boolean;
}

export type CodemodFunction = (ctx: CodemodContext) => CodemodContext;

export interface CodemodOptions {
  dryRun?: boolean;
  extensions?: string[];
  exclude?: string[];
}

export class CodemodRunner {
  private filesModified = 0;
  private filesScanned = 0;
  
  constructor(private options: CodemodOptions = {}) {
    this.options.extensions = options.extensions || ['.ts', '.tsx'];
    this.options.exclude = options.exclude || ['node_modules', 'dist', 'coverage', '.git'];
    this.options.dryRun = options.dryRun ?? false;
  }
  
  run(directory: string, codemod: CodemodFunction): void {
    console.log(`Running codemod on ${directory}...`);
    if (this.options.dryRun) {
      console.log('(DRY RUN - no files will be modified)\n');
    }
    
    this.scanDirectory(directory, codemod);
    
    console.log(`\nScanned: ${this.filesScanned} files`);
    console.log(`Modified: ${this.filesModified} files`);
  }
  
  private scanDirectory(dir: string, codemod: CodemodFunction): void {
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!this.options.exclude!.includes(entry)) {
            this.scanDirectory(fullPath, codemod);
          }
        } else if (stat.isFile()) {
          const ext = entry.substring(entry.lastIndexOf('.'));
          if (this.options.extensions!.includes(ext)) {
            this.processFile(fullPath, codemod);
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning directory ${dir}:`, err);
    }
  }
  
  private processFile(filePath: string, codemod: CodemodFunction): void {
    this.filesScanned++;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const ctx: CodemodContext = {
        filePath,
        content,
        modified: false,
      };
      
      const result = codemod(ctx);
      
      if (result.modified) {
        this.filesModified++;
        console.log(`✓ ${filePath}`);
        
        if (!this.options.dryRun) {
          writeFileSync(filePath, result.content, 'utf-8');
        }
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }
}

// Helper functions for common transformations
export function replaceExport(
  ctx: CodemodContext,
  oldName: string,
  newName: string
): CodemodContext {
  const pattern = new RegExp(`\\bexport\\s+(?:interface|type|class|const|function)\\s+${oldName}\\b`, 'g');
  const newContent = ctx.content.replace(pattern, match => match.replace(oldName, newName));
  
  return {
    ...ctx,
    content: newContent,
    modified: newContent !== ctx.content,
  };
}

export function replaceImport(
  ctx: CodemodContext,
  oldName: string,
  newName: string
): CodemodContext {
  const patterns = [
    new RegExp(`\\bimport\\s+{([^}]*\\b)${oldName}(\\b[^}]*)}`, 'g'),
    new RegExp(`\\bimport\\s+${oldName}\\b`, 'g'),
  ];
  
  let newContent = ctx.content;
  for (const pattern of patterns) {
    newContent = newContent.replace(pattern, match => match.replace(oldName, newName));
  }
  
  return {
    ...ctx,
    content: newContent,
    modified: newContent !== ctx.content,
  };
}

export function replaceUsage(
  ctx: CodemodContext,
  oldName: string,
  newName: string
): CodemodContext {
  // Replace usages (but not in strings or comments)
  const pattern = new RegExp(`\\b${oldName}\\b(?!['"'])`, 'g');
  const newContent = ctx.content.replace(pattern, newName);
  
  return {
    ...ctx,
    content: newContent,
    modified: newContent !== ctx.content,
  };
}
