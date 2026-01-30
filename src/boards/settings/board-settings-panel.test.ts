/**
 * @fileoverview Tests for Board Settings Panel
 * 
 * @module @cardplay/boards/settings/board-settings-panel.test
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoardSettingsPanel, VisualDensity, defaultDisplaySettings } from './board-settings-panel';
import { getBoardRegistry } from '../registry';
import { basicTrackerBoard } from '../builtins/basic-tracker-board';

describe('BoardSettingsPanel', () => {
  beforeEach(() => {
    // Register test board as builtin (if not already registered)
    const registry = getBoardRegistry();
    if (!registry.get('basic-tracker')) {
      registry.register(basicTrackerBoard, { isBuiltin: true });
    }
    
    // Setup DOM
    document.body.innerHTML = '<div id="test-container"></div>';
  });
  
  it('should create panel with board settings', () => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
    });
    
    expect(panel.getElement()).toBeDefined();
    expect(panel.getElement().className).toBe('board-settings-panel');
  });
  
  it('should show board name in header', () => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
    });
    
    const boardName = panel.getElement().querySelector('.board-name');
    expect(boardName?.textContent).toContain('Basic Tracker');
  });
  
  it('should have default display settings', () => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
    });
    
    const settings = panel.getDisplaySettings();
    expect(settings.density).toBe(VisualDensity.Comfortable);
    expect(settings.trackerBase).toBe('hex');
    expect(settings.showDeckHeaders).toBe(true);
    expect(settings.showControlIndicators).toBe(true);
    expect(settings.animationSpeed).toBe(1);
  });
  
  it('should show display section', () => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
      sections: { display: true },
    });
    
    const displaySection = panel.getElement().querySelector('.settings-section');
    expect(displaySection).toBeDefined();
    expect(displaySection?.textContent).toContain('Display');
  });
  
  it('should show tracker base selector for tracker boards', () => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
    });
    
    const trackerBaseSelect = panel.getElement().querySelector('#trackerBase');
    expect(trackerBaseSelect).toBeDefined();
  });
  
  it('should emit event when settings applied', (done) => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
    });
    
    panel.on('settings-applied', (settings) => {
      expect(settings).toBeDefined();
      expect(settings.density).toBe(VisualDensity.Comfortable);
      done();
    });
    
    // Trigger apply (would require UI interaction in real usage)
    const applyButton = panel.getElement().querySelector('.btn-apply') as HTMLButtonElement;
    if (applyButton) {
      applyButton.click();
    }
  });
  
  it('should be read-only when configured', () => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
      readOnly: true,
    });
    
    const densitySelect = panel.getElement().querySelector('#density') as HTMLSelectElement;
    expect(densitySelect?.disabled).toBe(true);
    
    const applyButton = panel.getElement().querySelector('.btn-apply') as HTMLButtonElement;
    expect(applyButton?.disabled).toBe(true);
  });
  
  it('should destroy cleanly', () => {
    const panel = new BoardSettingsPanel({
      boardId: 'basic-tracker',
    });
    
    const element = panel.getElement();
    document.body.appendChild(element);
    
    panel.destroy();
    
    expect(document.body.contains(element)).toBe(false);
  });
});

describe('defaultDisplaySettings', () => {
  it('should return valid defaults', () => {
    const settings = defaultDisplaySettings();
    
    expect(settings.density).toBe(VisualDensity.Comfortable);
    expect(settings.trackerBase).toBe('hex');
    expect(settings.showDeckHeaders).toBe(true);
    expect(settings.showControlIndicators).toBe(true);
    expect(settings.animationSpeed).toBe(1);
  });
});
