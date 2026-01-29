/**
 * @fileoverview Generator Deck Component (Phase G)
 * 
 * On-demand phrase/part generators for assisted boards.
 * Implements G072-G081 functionality for Session + Generators board.
 * 
 * @module @cardplay/ui/components/generator-deck
 */

import { getSharedEventStore } from '../../state/event-store';
import { getBoardContextStore } from '../../boards/context/store';
import { getUndoStack } from '../../state/undo-stack';
import { createGeneratorEmptyState, injectEmptyStateStyles } from './empty-states';
import { asTick, asTickDuration } from '../../types/index';
import type { Event } from '../../types/index';
import type { EventStreamId, ClipId } from '../../state/types';

/**
 * Generator type for different musical parts
 */
export type GeneratorType = 'melody' | 'bass' | 'drums' | 'arp' | 'pad' | 'chord';

/**
 * Generator configuration options (G080: persisted per track/slot)
 */
export interface GeneratorSettings {
  seed?: number;
  style?: 'minimal' | 'moderate' | 'dense';
  density?: number;        // 0-1
  swing?: number;          // -1 to 1
  humanize?: number;       // 0-1
  followChords?: boolean;  // G079: Chord track integration
}

/**
 * Generator deck component
 */
export class GeneratorDeck {
  private container: HTMLElement;
  private activeSlot: { streamId: EventStreamId; clipId: ClipId } | null = null;
  private settings: Map<string, GeneratorSettings> = new Map();
  
  constructor(parent: HTMLElement) {
    injectEmptyStateStyles();
    injectGeneratorDeckStyles();
    
    this.container = this.createContainer();
    parent.appendChild(this.container);
    
    // Subscribe to active context changes
    getBoardContextStore().subscribe(() => {
      this.updateActiveSlot();
    });
    
    this.updateActiveSlot();
  }
  
  /**
   * Create the generator deck container (G072)
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'generator-deck';
    return container;
  }
  
  /**
   * Update active slot from context store (G081)
   */
  private updateActiveSlot(): void {
    const context = getBoardContextStore().getContext();
    
    if (context.activeStreamId && context.activeClipId) {
      this.activeSlot = {
        streamId: context.activeStreamId,
        clipId: context.activeClipId
      };
      this.render();
    } else {
      this.activeSlot = null;
      this.renderEmpty();
    }
  }
  
  /**
   * Render empty state when no slot selected
   */
  private renderEmpty(): void {
    this.container.innerHTML = '';
    const emptyState = createGeneratorEmptyState(() => {
      // TODO: Open session grid and prompt slot selection
      console.log('Select slot requested');
    });
    this.container.appendChild(emptyState);
  }
  
  /**
   * Render generator controls (G072)
   */
  private render(): void {
    if (!this.activeSlot) {
      this.renderEmpty();
      return;
    }
    
    this.container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'generator-deck__header';
    
    const title = document.createElement('h3');
    title.className = 'generator-deck__title';
    title.textContent = 'Generators';
    header.appendChild(title);
    
    this.container.appendChild(header);
    
    // Generator list
    const generatorList = this.createGeneratorList();
    this.container.appendChild(generatorList);
    
    // Settings panel
    const settingsPanel = this.createSettingsPanel();
    this.container.appendChild(settingsPanel);
  }
  
  /**
   * Create list of available generators (G072)
   */
  private createGeneratorList(): HTMLElement {
    const list = document.createElement('div');
    list.className = 'generator-deck__list';
    
    const generators: Array<{ type: GeneratorType; label: string; icon: string }> = [
      { type: 'melody', label: 'Melody', icon: '🎵' },
      { type: 'bass', label: 'Bass', icon: '🎸' },
      { type: 'drums', label: 'Drums', icon: '🥁' },
      { type: 'arp', label: 'Arpeggio', icon: '🎹' },
      { type: 'pad', label: 'Pad', icon: '🌊' },
      { type: 'chord', label: 'Chords', icon: '🎼' }
    ];
    
    for (const gen of generators) {
      const item = this.createGeneratorItem(gen.type, gen.label, gen.icon);
      list.appendChild(item);
    }
    
    return list;
  }
  
  /**
   * Create a generator item with generate button (G072)
   */
  private createGeneratorItem(type: GeneratorType, label: string, icon: string): HTMLElement {
    const item = document.createElement('div');
    item.className = 'generator-deck__item';
    
    const iconEl = document.createElement('span');
    iconEl.className = 'generator-deck__icon';
    iconEl.textContent = icon;
    item.appendChild(iconEl);
    
    const labelEl = document.createElement('span');
    labelEl.className = 'generator-deck__label';
    labelEl.textContent = label;
    item.appendChild(labelEl);
    
    const generateBtn = document.createElement('button');
    generateBtn.className = 'generator-deck__generate-btn';
    generateBtn.textContent = 'Generate';
    generateBtn.onclick = () => this.generate(type);
    item.appendChild(generateBtn);
    
    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'generator-deck__regenerate-btn';
    regenerateBtn.textContent = '↻';
    regenerateBtn.title = 'Regenerate (Cmd+Shift+G)';
    regenerateBtn.onclick = () => this.regenerate(type);
    item.appendChild(regenerateBtn);
    
    return item;
  }
  
  /**
   * Create settings panel (G080: persist per track/slot)
   */
  private createSettingsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'generator-deck__settings';
    
    const title = document.createElement('h4');
    title.textContent = 'Settings';
    panel.appendChild(title);
    
    // Get current settings
    const settings = this.getSettings();
    
    // Density slider
    panel.appendChild(this.createSlider('Density', 'density', settings.density ?? 0.5));
    
    // Swing slider
    panel.appendChild(this.createSlider('Swing', 'swing', (settings.swing ?? 0) * 0.5 + 0.5));
    
    // Humanize slider
    panel.appendChild(this.createSlider('Humanize', 'humanize', settings.humanize ?? 0.2));
    
    // Follow chords checkbox (G079)
    const followChords = this.createCheckbox('Follow Chord Track', 'followChords', settings.followChords ?? false);
    panel.appendChild(followChords);
    
    return panel;
  }
  
  /**
   * Create a slider control
   */
  private createSlider(label: string, key: keyof GeneratorSettings, value: number): HTMLElement {
    const container = document.createElement('div');
    container.className = 'generator-deck__control';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    container.appendChild(labelEl);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = value.toString();
    slider.oninput = () => {
      this.updateSetting(key, parseFloat(slider.value));
    };
    container.appendChild(slider);
    
    const valueLabel = document.createElement('span');
    valueLabel.textContent = Math.round(value * 100) + '%';
    slider.oninput = () => {
      const val = parseFloat(slider.value);
      valueLabel.textContent = Math.round(val * 100) + '%';
      this.updateSetting(key, val);
    };
    container.appendChild(valueLabel);
    
    return container;
  }
  
  /**
   * Create a checkbox control
   */
  private createCheckbox(label: string, key: keyof GeneratorSettings, checked: boolean): HTMLElement {
    const container = document.createElement('div');
    container.className = 'generator-deck__control generator-deck__control--checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.onchange = () => {
      this.updateSetting(key, checkbox.checked);
    };
    container.appendChild(checkbox);
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    container.appendChild(labelEl);
    
    return container;
  }
  
  /**
   * Get settings for active slot (G080)
   */
  private getSettings(): GeneratorSettings {
    if (!this.activeSlot) return {};
    const key = `${this.activeSlot.streamId}-${this.activeSlot.clipId}`;
    return this.settings.get(key) || {};
  }
  
  /**
   * Update setting (G080: persist per track/slot)
   */
  private updateSetting(key: keyof GeneratorSettings, value: any): void {
    if (!this.activeSlot) return;
    
    const slotKey = `${this.activeSlot.streamId}-${this.activeSlot.clipId}`;
    const current = this.settings.get(slotKey) || {};
    this.settings.set(slotKey, { ...current, [key]: value });
  }
  
  /**
   * Generate into new clip (G073, G075)
   */
  private generate(type: GeneratorType): void {
    if (!this.activeSlot) return;
    
    const settings = this.getSettings();
    const events = this.generateEvents(type, settings);
    
    // Write events to stream with undo (G074)
    const eventStore = getSharedEventStore();
    getUndoStack().push({
      type: 'batch',
      description: `Generate ${type}`,
      redo: () => {
        eventStore.addEvents(this.activeSlot!.streamId, events);
      },
      undo: () => {
        const eventIds = events.map(e => e.id);
        eventStore.removeEvents(this.activeSlot!.streamId, eventIds);
      }
    });
    
    console.log(`Generated ${type} into ${this.activeSlot.streamId}`);
  }
  
  /**
   * Regenerate (G076: replace generated events)
   */
  private regenerate(type: GeneratorType): void {
    if (!this.activeSlot) return;
    
    // TODO: Track which events were generated by this generator
    // For now, just generate new events
    this.generate(type);
  }
  
  /**
   * Generate events based on type and settings
   * 
   * Simplified generator - real implementation would use
   * more sophisticated algorithms, possibly Prolog KB queries
   */
  private generateEvents(type: GeneratorType, settings: GeneratorSettings): Array<Event<any>> {
    const events: Array<Event<any>> = [];
    const density = settings.density ?? 0.5;
    const humanize = settings.humanize ?? 0.2;
    const eventCount = Math.floor(8 + density * 24); // 8-32 events
    
    for (let i = 0; i < eventCount; i++) {
      const baseStart = i * 120; // 8th notes at 120 PPQN
      const humanizeOffset = (Math.random() - 0.5) * humanize * 30;
      const start = asTick(Math.floor(baseStart + humanizeOffset));
      
      const baseDuration = 100;
      const humanizeDuration = (Math.random() - 0.5) * humanize * 20;
      const duration = asTickDuration(Math.floor(baseDuration + humanizeDuration));
      
      const baseVelocity = type === 'drums' ? 100 : 80;
      const velocityVariation = (Math.random() - 0.5) * humanize * 40;
      const velocity = Math.max(40, Math.min(127, Math.floor(baseVelocity + velocityVariation)));
      
      const pitch = this.getPitchForType(type, i, eventCount);
      
      events.push({
        id: `gen-${type}-${Date.now()}-${i}` as any, // Will be reassigned by store
        kind: 'note',
        start,
        duration,
        payload: {
          pitch,
          velocity
        }
      } as Event<any>);
    }
    
    return events;
  }
  
  /**
   * Get appropriate pitch for generator type
   */
  private getPitchForType(type: GeneratorType, index: number, _total: number): number {
    switch (type) {
      case 'melody':
        return 60 + Math.floor(Math.random() * 12); // C4-C5
      case 'bass':
        return 36 + Math.floor(Math.random() * 12); // C2-C3
      case 'drums':
        return [36, 38, 42, 46][index % 4] ?? 36; // Kick, snare, closed hat, open hat
      case 'arp':
        return 60 + (index % 12); // Arpeggio pattern
      case 'pad':
        return 48 + Math.floor(Math.random() * 24); // C3-C5
      case 'chord':
        return [60, 64, 67][index % 3] ?? 60; // C major triad
      default:
        return 60;
    }
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.container.remove();
  }
}

/**
 * Inject generator deck styles
 */
function injectGeneratorDeckStyles(): void {
  const styleId = 'generator-deck-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .generator-deck {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--spacing-md, 16px);
      background: var(--color-bg-secondary, #1a1a1a);
      overflow-y: auto;
    }
    
    .generator-deck__header {
      margin-bottom: var(--spacing-lg, 24px);
    }
    
    .generator-deck__title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary, #fff);
    }
    
    .generator-deck__list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm, 8px);
      margin-bottom: var(--spacing-lg, 24px);
    }
    
    .generator-deck__item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 8px);
      padding: var(--spacing-sm, 8px);
      background: var(--color-bg-tertiary, #2a2a2a);
      border-radius: var(--border-radius, 4px);
      transition: background 0.2s ease;
    }
    
    .generator-deck__item:hover {
      background: var(--color-bg-hover, rgba(255, 255, 255, 0.05));
    }
    
    .generator-deck__icon {
      font-size: 20px;
    }
    
    .generator-deck__label {
      flex: 1;
      font-size: 14px;
      color: var(--color-text-primary, #fff);
    }
    
    .generator-deck__generate-btn,
    .generator-deck__regenerate-btn {
      padding: 4px 12px;
      border: 1px solid var(--color-border, #444);
      background: var(--color-primary, #3b82f6);
      color: white;
      border-radius: var(--border-radius, 4px);
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    }
    
    .generator-deck__regenerate-btn {
      padding: 4px 8px;
      background: transparent;
      color: var(--color-text-secondary, #888);
    }
    
    .generator-deck__generate-btn:hover {
      background: var(--color-primary-hover, #2563eb);
    }
    
    .generator-deck__regenerate-btn:hover {
      background: var(--color-bg-hover, rgba(255, 255, 255, 0.1));
      color: var(--color-text-primary, #fff);
    }
    
    .generator-deck__settings {
      padding-top: var(--spacing-lg, 24px);
      border-top: 1px solid var(--color-border, #444);
    }
    
    .generator-deck__settings h4 {
      margin: 0 0 var(--spacing-md, 16px) 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary, #fff);
    }
    
    .generator-deck__control {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 8px);
      margin-bottom: var(--spacing-md, 16px);
    }
    
    .generator-deck__control label {
      font-size: 12px;
      color: var(--color-text-secondary, #888);
      min-width: 80px;
    }
    
    .generator-deck__control input[type="range"] {
      flex: 1;
    }
    
    .generator-deck__control span {
      font-size: 12px;
      color: var(--color-text-secondary, #888);
      min-width: 40px;
      text-align: right;
    }
    
    .generator-deck__control--checkbox {
      gap: var(--spacing-xs, 4px);
    }
    
    .generator-deck__control--checkbox label {
      min-width: auto;
      flex: 1;
    }
  `;
  
  document.head.appendChild(style);
}
