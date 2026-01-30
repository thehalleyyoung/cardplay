/**
 * @fileoverview Tests for Undo History Browser Component
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UndoHistoryBrowser } from './undo-history-browser';
import { getUndoStack, resetUndoStack, type UndoStack } from '../../state/undo-stack';

describe('UndoHistoryBrowser', () => {
  let container: HTMLElement;
  let browser: UndoHistoryBrowser;
  let undoStack: UndoStack;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    resetUndoStack(); // Reset before getting fresh instance
    undoStack = getUndoStack();
  });

  afterEach(() => {
    if (browser) {
      browser.destroy();
    }
    document.body.removeChild(container);
    
    // Clean up styles
    const styles = document.getElementById('undo-history-browser-styles');
    if (styles) {
      styles.remove();
    }
  });

  it('should create and render undo history browser', () => {
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.className).toBe('undo-history-browser');
  });

  it('should display header with title', () => {
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    const header = element.querySelector('.undo-history-header h2');
    expect(header).not.toBeNull();
    expect(header?.textContent).toBe('Undo History');
  });

  it('should display empty state when no actions', () => {
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    const emptyState = element.querySelector('.undo-history-empty');
    expect(emptyState).not.toBeNull();
    expect(emptyState?.textContent).toContain('No actions in history');
  });

  it('should display stats correctly', () => {
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    const stats = element.querySelector('.undo-history-stats');
    expect(stats).not.toBeNull();
  });

  it('should render control buttons', () => {
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    const clearBtn = element.querySelector('[data-action="clear-history"]');
    const exportBtn = element.querySelector('[data-action="export-history"]');
    
    expect(clearBtn).not.toBeNull();
    expect(exportBtn).not.toBeNull();
  });

  it('should display actions in timeline', () => {
    // Add some actions to undo stack
    undoStack.push({
      type: 'TEST_ACTION',
      description: 'Test action 1',
      undo: vi.fn(),
      redo: vi.fn(),
    });
    
    undoStack.push({
      type: 'TEST_ACTION_2',
      description: 'Test action 2',
      undo: vi.fn(),
      redo: vi.fn(),
    });
    
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    const items = element.querySelectorAll('.undo-history-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should mark current action', () => {
    undoStack.push({
      type: 'ACTION_1',
      description: 'Action 1',
      undo: vi.fn(),
      redo: vi.fn(),
    });
    
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    const currentItem = element.querySelector('.undo-history-item.current');
    expect(currentItem).not.toBeNull();
  });

  it('should distinguish past and future actions', () => {
    undoStack.push({
      type: 'PAST_ACTION',
      description: 'Past action',
      undo: vi.fn(),
      redo: vi.fn(),
    });
    
    undoStack.push({
      type: 'CURRENT_ACTION',
      description: 'Current action',
      undo: vi.fn(),
      redo: vi.fn(),
    });
    
    undoStack.undo(); // Move back one
    
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    const pastItems = element.querySelectorAll('.undo-history-item.past');
    const futureItems = element.querySelectorAll('.undo-history-item.future');
    
    expect(pastItems.length).toBeGreaterThan(0);
    expect(futureItems.length).toBeGreaterThan(0);
  });

  it('should have proper ARIA attributes', () => {
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    expect(element.getAttribute('role')).toBe('region');
    expect(element.getAttribute('aria-label')).toBe('Undo History');
  });

  it('should inject styles only once', () => {
    browser = new UndoHistoryBrowser({ undoStack });
    
    const styles1 = document.getElementById('undo-history-browser-styles');
    expect(styles1).not.toBeNull();
    
    // Create another instance
    const browser2 = new UndoHistoryBrowser({ undoStack });
    
    const styles2 = document.querySelectorAll('#undo-history-browser-styles');
    expect(styles2.length).toBe(1);
    
    browser2.destroy();
  });

  it('should auto-update timeline periodically', async () => {
    vi.useFakeTimers();
    
    browser = new UndoHistoryBrowser({ undoStack });
    const element = browser.getElement();
    
    // Add action after creation
    undoStack.push({
      type: 'NEW_ACTION',
      description: 'New action',
      undo: vi.fn(),
      redo: vi.fn(),
    });
    
    // Fast-forward time to trigger update
    vi.advanceTimersByTime(1000);
    
    // Timeline should be updated
    const items = element.querySelectorAll('.undo-history-item');
    expect(items.length).toBeGreaterThan(0);
    
    vi.useRealTimers();
  });
});
