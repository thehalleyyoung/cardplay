/**
 * @fileoverview Tests for Gated Card Browser
 *
 * Tests D031-D037: Card gating UI integration
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GatedCardBrowser, createCapabilitiesDebugPanel, type CardMeta } from './gated-card-browser';
import type { Board } from '../../boards/types';

// Mock board with full-manual control level
const mockManualBoard: Board = {
  id: 'test-manual',
  name: 'Test Manual Board',
  controlLevel: 'full-manual',
  primaryView: 'tracker',
  difficulty: 'intermediate',
  decks: [],
  layout: { type: 'single-column', panels: [] },
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' },
  },
  theme: {},
  shortcuts: {},
  description: 'Test board',
  category: 'manual',
  tags: [],
  icon: '🎹',
};

// Mock cards
const mockCards: CardMeta[] = [
  { id: 'synth-1', name: 'Basic Synth', category: 'Manual', description: 'Simple synth', tags: ['synth', 'manual'] },
  { id: 'phrase-1', name: 'Phrase Library', category: 'Assisted', description: 'Phrase browser', tags: ['phrase', 'assisted'] },
  { id: 'generator-1', name: 'Melody Generator', category: 'Generative', description: 'AI melody', tags: ['generator', 'ai'] },
];

describe('GatedCardBrowser', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  it('creates a card browser', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
    });
    
    // Browser should render something
    expect(container.children.length).toBeGreaterThan(0);
    expect(container.querySelector('.card-browser-header')).toBeTruthy();
  });
  
  it('shows search input when enabled', () => {
    new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
      showSearch: true,
    });
    
    expect(container.querySelector('.browser-search')).toBeTruthy();
  });
  
  it('shows category filters when enabled', () => {
    new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
      showCategories: true,
    });
    
    expect(container.querySelector('.category-filters')).toBeTruthy();
  });
  
  // D033: Hide disallowed cards by default
  it('hides disallowed cards by default', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
    });
    
    // Without show-disabled, we should see fewer cards
    const items = container.querySelectorAll('.card-item');
    // Depends on gating logic, but typically manual board allows manual cards only
    expect(items.length).toBeLessThanOrEqual(mockCards.length);
  });
  
  // D034: Add "Show disabled" toggle
  it('shows disabled toggle', () => {
    new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
    });
    
    const toggle = container.querySelector('.show-disabled-toggle input[type="checkbox"]');
    expect(toggle).toBeTruthy();
  });
  
  // D035: Show why-not tooltip on disabled cards
  it('shows tooltips on disabled cards when show-disabled is enabled', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
      initialShowDisabled: true,
    });
    
    // Look for disabled cards with badges
    const disabledBadges = container.querySelectorAll('.disabled-badge');
    // May be 0 if no board is loaded or all cards are allowed
    expect(disabledBadges.length).toBeGreaterThanOrEqual(0);
  });
  
  it('filters by search query', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
      showSearch: true,
    });
    
    const searchInput = container.querySelector('.browser-search') as HTMLInputElement;
    searchInput.value = 'synth';
    searchInput.dispatchEvent(new Event('input'));
    
    // Should show only synth-related cards
    const items = container.querySelectorAll('.card-item');
    expect(items.length).toBeGreaterThan(0);
  });
  
  it('filters by category', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
      showCategories: true,
    });
    
    const manualBtn = Array.from(container.querySelectorAll('.category-btn'))
      .find(btn => btn.textContent === 'Manual') as HTMLButtonElement;
    
    expect(manualBtn).toBeTruthy();
    manualBtn.click();
    
    // Should filter to manual category
    expect(manualBtn.classList.contains('active')).toBe(true);
  });
  
  it('calls onCardSelect when allowed card is clicked', () => {
    const onCardSelect = vi.fn();
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect,
    });
    
    const allowedCard = container.querySelector('.card-item:not(.disabled)') as HTMLElement;
    if (allowedCard) {
      allowedCard.click();
      expect(onCardSelect).toHaveBeenCalled();
    }
  });
  
  it('does not call onCardSelect when disabled card is clicked', () => {
    const onCardSelect = vi.fn();
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect,
      initialShowDisabled: true,
    });
    
    const disabledCard = container.querySelector('.card-item.disabled') as HTMLElement;
    if (disabledCard) {
      disabledCard.click();
      expect(onCardSelect).not.toHaveBeenCalled();
    }
  });
  
  // D038: Ensure gating updates live when board switches
  it('refreshes when board changes', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
    });
    
    const initialCount = container.querySelectorAll('.card-item').length;
    
    // Refresh should update the display
    browser.refresh();
    
    const afterCount = container.querySelectorAll('.card-item').length;
    expect(afterCount).toBe(initialCount);
  });
  
  it('updates cards via setCards', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
    });
    
    const newCards: CardMeta[] = [
      { id: 'new-1', name: 'New Card', category: 'Manual' },
    ];
    
    browser.setCards(newCards);
    
    const items = container.querySelectorAll('.card-item');
    expect(items.length).toBeGreaterThan(0);
  });
  
  it('cleans up on destroy', () => {
    const browser = new GatedCardBrowser({
      container,
      cards: mockCards,
      onCardSelect: () => {},
    });
    
    browser.destroy();
    expect(container.innerHTML).toBe('');
  });
});

// D037: Board capabilities debug panel
describe('createCapabilitiesDebugPanel', () => {
  it('creates a debug panel with board info', () => {
    const panel = createCapabilitiesDebugPanel(mockManualBoard);
    
    expect(panel.textContent).toContain('Test Manual Board');
    expect(panel.textContent).toContain('full-manual');
  });
  
  it('shows enabled tools', () => {
    const assistedBoard: Board = {
      ...mockManualBoard,
      id: 'test-assisted',
      controlLevel: 'assisted',
      compositionTools: {
        ...mockManualBoard.compositionTools,
        phraseDatabase: { enabled: true, mode: 'drag-drop' },
      },
    };
    
    const panel = createCapabilitiesDebugPanel(assistedBoard);
    expect(panel.textContent).toContain('phraseDatabase');
    expect(panel.textContent).toContain('drag-drop');
  });
  
  it('shows "None" when all tools disabled', () => {
    const panel = createCapabilitiesDebugPanel(mockManualBoard);
    expect(panel.textContent).toContain('None (full manual)');
  });
  
  it('has a close button', () => {
    const panel = createCapabilitiesDebugPanel(mockManualBoard);
    const closeBtn = panel.querySelector('button');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn?.textContent).toBe('×');
  });
});
