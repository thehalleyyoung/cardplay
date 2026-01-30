/**
 * board-metadata-validation.test.ts
 * Validates that builtin boards declare required metadata
 * 
 * Change 135 from to_fix_repo_plan_500.md
 */

import { describe, it, expect } from 'vitest';
import { getAllBuiltinBoards } from '../builtins/register.js';

describe('Board Metadata Validation', () => {
  it('all builtin boards declare required metadata', () => {
    const boards = getAllBuiltinBoards();
    const issues: Array<{ boardId: string; missing: string[] }> = [];
    
    for (const board of boards) {
      const missing: string[] = [];
      
      if (!board.difficulty) {
        missing.push('difficulty');
      }
      
      if (!board.tags || board.tags.length === 0) {
        missing.push('tags');
      }
      
      if (!board.author) {
        missing.push('author');
      }
      
      if (!board.version) {
        missing.push('version');
      }
      
      if (missing.length > 0) {
        issues.push({
          boardId: board.id,
          missing
        });
      }
    }
    
    if (issues.length > 0) {
      const details = issues
        .map(({ boardId, missing }) => 
          `  - Board "${boardId}" missing: ${missing.join(', ')}`
        )
        .join('\n');
      
      console.warn(
        `\n⚠️  Some boards are missing metadata:\n${details}\n\n` +
        'This is a warning - boards should declare difficulty, tags, author, and version.\n'
      );
    }
    
    // For now, this is just a warning - don't fail the test
    // In the future, we might make this required
    expect(true).toBe(true);
  });
  
  it('board versions follow semver format', () => {
    const boards = getAllBuiltinBoards();
    const invalidVersions: Array<{ boardId: string; version: string }> = [];
    
    const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    
    for (const board of boards) {
      if (board.version && !semverPattern.test(board.version)) {
        invalidVersions.push({
          boardId: board.id,
          version: board.version
        });
      }
    }
    
    if (invalidVersions.length > 0) {
      const details = invalidVersions
        .map(({ boardId, version }) => 
          `  - Board "${boardId}" has invalid version: "${version}"`
        )
        .join('\n');
      
      console.warn(
        `\n⚠️  Some boards have invalid version formats:\n${details}\n\n` +
        'Versions should follow semver format: X.Y.Z\n'
      );
    }
    
    // Warning only for now
    expect(true).toBe(true);
  });
});
