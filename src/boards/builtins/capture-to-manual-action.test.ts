/**
 * @fileoverview Tests for Capture to Manual Board Action (H021)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  captureToManualBoard,
  getRecommendedManualBoard,
  canCaptureToManual,
  getCaptureButtonText
} from './capture-to-manual-action';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from './register';

describe('captureToManualBoard', () => {
  beforeEach(() => {
    // Register all builtin boards
    registerBuiltinBoards();
  });

  it('should recommend session board for ai-arranger', () => {
    const recommended = getRecommendedManualBoard('ai-arranger' as any);
    expect(recommended).toBe('basic-session');
  });

  it('should recommend notation board for ai-composition', () => {
    const recommended = getRecommendedManualBoard('ai-composition' as any);
    expect(recommended).toBe('notation-manual');
  });

  it('should recommend tracker board for session-generators', () => {
    const recommended = getRecommendedManualBoard('session-generators' as any);
    expect(recommended).toBe('basic-tracker');
  });

  it('should return null for unknown board', () => {
    const recommended = getRecommendedManualBoard('unknown-board' as any);
    expect(recommended).toBeNull();
  });

  it('should support capture for directed boards', () => {
    expect(canCaptureToManual('ai-arranger' as any)).toBe(true);
    expect(canCaptureToManual('ai-composition' as any)).toBe(true);
  });

  it('should support capture for generative boards', () => {
    expect(canCaptureToManual('generative-ambient' as any)).toBe(true);
  });

  it('should not support capture for manual boards', () => {
    expect(canCaptureToManual('basic-tracker' as any)).toBe(false);
    expect(canCaptureToManual('notation-board-manual' as any)).toBe(false);
  });

  it('should provide button text for supported boards', () => {
    const text = getCaptureButtonText('ai-arranger' as any);
    expect(text).toContain('Session');
    expect(text).toContain('Manually');
  });

  it('should return null button text for unsupported boards', () => {
    const text = getCaptureButtonText('basic-tracker' as any);
    expect(text).toBeNull();
  });

  it('should preserve active context when capturing', () => {
    const result = captureToManualBoard('ai-arranger' as any);
    
    expect(result.success).toBe(true);
    expect(result.targetBoardId).toBe('basic-session');
  });

  it('should switch to recommended board', () => {
    const result = captureToManualBoard('ai-composition' as any);
    
    expect(result.success).toBe(true);
    expect(result.targetBoardId).toBe('notation-manual');
  });

  it('should allow explicit target board', () => {
    const result = captureToManualBoard('ai-arranger' as any, 'basic-tracker' as any);
    
    expect(result.success).toBe(true);
    expect(result.targetBoardId).toBe('basic-tracker');
  });

  it('should fail if current board not found', () => {
    const result = captureToManualBoard('nonexistent' as any);
    
    expect(result.success).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('should fail if target is not manual', () => {
    const result = captureToManualBoard('ai-arranger' as any, 'ai-composition' as any);
    
    expect(result.success).toBe(false);
    expect(result.reason).toContain('not a manual board');
  });

  it('should log capture for user awareness', () => {
    const consoleSpy = vi.spyOn(console, 'info');
    
    captureToManualBoard('ai-arranger' as any);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Capture]'),
      expect.anything()
    );
  });
});

describe('Manual Board Recommendations', () => {
  it('should cover all generative boards', () => {
    const registry = getBoardRegistry();
    const generativeBoards = registry.list().filter(
      board => board.controlLevel === 'generative' || board.controlLevel === 'directed'
    );
    
    for (const board of generativeBoards) {
      const hasRecommendation = getRecommendedManualBoard(board.id as any) !== null;
      
      if (!hasRecommendation) {
        console.warn(`Board ${board.id} (${board.controlLevel}) has no manual board recommendation`);
      }
    }
  });

  it('should recommend only existing boards', () => {
    const registry = getBoardRegistry();
    const recommendations = [
      getRecommendedManualBoard('ai-arranger' as any),
      getRecommendedManualBoard('ai-composition' as any),
      getRecommendedManualBoard('generative-ambient' as any)
    ];
    
    for (const rec of recommendations) {
      if (rec) {
        const board = registry.get(rec);
        expect(board).toBeDefined();
        expect(board?.controlLevel).toBe('full-manual');
      }
    }
  });
});
