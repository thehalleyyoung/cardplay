/**
 * @fileoverview Deck Panel Host Component
 *
 * Renders panels with multiple decks based on BoardLayoutRuntime.
 *
 * E017-E020: Deck panel host to render panels with decks.
 *
 * @module @cardplay/ui/components/deck-panel-host
 */

import type { Board } from '../../boards/types';
import type { DeckInstance } from '../../boards/decks/factory-types';
import { DeckContainer, type DeckContainerOptions } from '../../boards/decks/deck-container';
import { createDefaultDeckRuntimeState } from '../../boards/decks/runtime-types';

// ============================================================================
// TYPES
// ============================================================================

export interface DeckPanelHostOptions {
  board: Board;
  instances: DeckInstance[];
  onDeckClose?: (deckId: string) => void;
}

// ============================================================================
// DECK PANEL HOST
// ============================================================================

/**
 * Renders decks in panels.
 *
 * E017: Render panels with multiple decks.
 */
export class DeckPanelHost {
  private element: HTMLElement;
  private options: DeckPanelHostOptions;
  private deckContainers: Map<string, DeckContainer>;

  constructor(options: DeckPanelHostOptions) {
    this.options = options;
    this.deckContainers = new Map();

    // Create root element
    this.element = document.createElement('div');
    this.element.className = 'deck-panel-host';

    // E018: Render decks in panels
    this.renderPanels();

    // Apply styles
    this.injectStyles();
  }

  private renderPanels(): void {
    // E018: Render decks based on BoardLayoutRuntime
    // For now, simple layout: all decks in a grid
    // const layout = this.options.board.layout;

    // Create panel container
    const panelContainer = document.createElement('div');
    panelContainer.className = 'deck-panels';

    // Group decks by panel position
    const decksByPanel = new Map<string, DeckInstance[]>();
    
    for (const instance of this.options.instances) {
      // Find deck definition
      const deckDef = this.options.board.decks.find(d => d.id === instance.id);
      if (!deckDef) continue;

      // Find panel for this deck (stub - would use layout.panels)
      const panelId = 'main-panel';
      
      if (!decksByPanel.has(panelId)) {
        decksByPanel.set(panelId, []);
      }
      decksByPanel.get(panelId)!.push(instance);
    }

    // Render panels
    for (const [panelId, decks] of decksByPanel) {
      const panel = this.createPanel(panelId, decks);
      panelContainer.appendChild(panel);
    }

    this.element.appendChild(panelContainer);
  }

  private createPanel(panelId: string, decks: DeckInstance[]): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'deck-panel';
    panel.setAttribute('data-panel-id', panelId);

    // Render each deck in the panel
    for (const instance of decks) {
      const deckDef = this.options.board.decks.find(d => d.id === instance.id);
      if (!deckDef) continue;

      // Create deck container
      const state = createDefaultDeckRuntimeState(instance.id, deckDef.type);
      const containerOptions: DeckContainerOptions = {
        deck: deckDef,
        instance,
        state,
        onClose: () => this.handleDeckClose(instance.id),
      };

      const container = new DeckContainer(containerOptions);
      this.deckContainers.set(instance.id, container);

      panel.appendChild(container.getElement());
    }

    return panel;
  }

  private handleDeckClose(deckId: string): void {
    // E019: Support moving/closing decks
    const container = this.deckContainers.get(deckId);
    if (container) {
      container.destroy();
      this.deckContainers.delete(deckId);
    }

    if (this.options.onDeckClose) {
      this.options.onDeckClose(deckId);
    }

    // Notify user
    console.log(`Deck closed: ${deckId}`);
  }

  private injectStyles(): void {
    const styleId = 'deck-panel-host-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .deck-panel-host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .deck-panels {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 8px;
        padding: 8px;
        height: 100%;
        overflow: auto;
      }

      .deck-panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 200px;
      }

      @media (max-width: 768px) {
        .deck-panels {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    // Destroy all deck containers
    for (const container of this.deckContainers.values()) {
      container.destroy();
    }
    this.deckContainers.clear();

    // Remove element
    this.element.remove();
  }

  public addDeck(instance: DeckInstance): void {
    // E019: Support adding decks dynamically
    const deckDef = this.options.board.decks.find(d => d.id === instance.id);
    if (!deckDef) {
      console.warn(`Deck definition not found: ${instance.id}`);
      return;
    }

    // Find panel to add to
    const panel = this.element.querySelector('.deck-panel');
    if (!panel) {
      console.warn('No panel found to add deck');
      return;
    }

    // Create deck container
    const state = createDefaultDeckRuntimeState(instance.id, deckDef.type);
    const containerOptions: DeckContainerOptions = {
      deck: deckDef,
      instance,
      state,
      onClose: () => this.handleDeckClose(instance.id),
    };

    const container = new DeckContainer(containerOptions);
    this.deckContainers.set(instance.id, container);

    panel.appendChild(container.getElement());
  }

  public removeDeck(deckId: string): void {
    this.handleDeckClose(deckId);
  }
}

/**
 * Creates a deck panel host.
 */
export function createDeckPanelHost(options: DeckPanelHostOptions): DeckPanelHost {
  return new DeckPanelHost(options);
}
