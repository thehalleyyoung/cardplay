/**
 * @fileoverview Routing/Modular Deck Factory (E061-E062, M121)
 *
 * E061-E062: Implement routing deck for graph visualization + edit UI.
 * M121: Wire in routing suggestions from workflow-queries.
 *
 * @module @cardplay/boards/decks/factories/routing-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { suggestRouting } from '../../../ai/queries/workflow-queries';

/**
 * Routing/modular deck factory.
 *
 * Provides routing graph visualization and editing:
 * - Node visualization (instruments, effects, busses)
 * - Connection visualization (audio, MIDI, modulation)
 * - Drag-to-connect interface
 * - Connection validation
 *
 * E062: Reuses ui/components/connection-router.ts for rendering.
 */
export const routingFactory: DeckFactory = {
  deckType: 'routing-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Routing',
      render: () => {
        const container = document.createElement('div');
        container.className = 'deck-routing';
        container.setAttribute('data-deck-id', deckDef.id);
        container.style.cssText = `
          position: relative;
          width: 100%;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        `;

        // Canvas for routing visualization
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
          width: 100%;
          height: 100%;
          display: block;
        `;

        // Overlay controls
        const controls = document.createElement('div');
        controls.style.cssText = `
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
        `;
        controls.innerHTML = `
          <button style="padding: 0.5rem 1rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer;">Add Node</button>
          <button style="padding: 0.5rem 1rem; border: none; background: var(--color-surface-variant); color: var(--color-on-surface); border-radius: var(--radius-sm); cursor: pointer;">Clear</button>
        `;

        // M121: Routing suggestion button
        const suggestBtn = document.createElement('button');
        suggestBtn.style.cssText = `
          padding: 0.5rem 1rem;
          border: none;
          background: var(--color-secondary, #10b981);
          color: var(--color-on-primary, white);
          border-radius: var(--radius-sm, 4px);
          cursor: pointer;
        `;
        suggestBtn.textContent = 'Suggest Routing';
        controls.appendChild(suggestBtn);

        // M121: Routing suggestion results overlay
        const suggestionOverlay = document.createElement('div');
        suggestionOverlay.className = 'routing-suggestion-overlay';
        suggestionOverlay.style.cssText = `
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          padding: 8px 12px;
          background: var(--color-surface, rgba(255,255,255,0.95));
          border: 1px solid var(--border-base, #ccc);
          border-radius: var(--radius-sm, 4px);
          font-size: 0.8125rem;
          display: none;
          max-height: 120px;
          overflow-y: auto;
        `;

        suggestBtn.addEventListener('click', async () => {
          const isVisible = suggestionOverlay.style.display !== 'none';
          if (isVisible) {
            suggestionOverlay.style.display = 'none';
            return;
          }
          suggestionOverlay.style.display = 'block';
          suggestionOverlay.innerHTML = '<em>Generating routing suggestion&hellip;</em>';
          try {
            const graph = await suggestRouting('tracker_mixing', ['pattern_editor', 'mixer', 'effect_chain', 'master']);
            if (graph.connections.length === 0) {
              suggestionOverlay.innerHTML = '<strong>Nodes:</strong> ' + graph.nodes.join(', ') + '<br><em>No connections suggested.</em>';
            } else {
              suggestionOverlay.innerHTML = '<strong>Suggested Routing:</strong><br>' +
                graph.connections.map(c => `${c.from} → ${c.to} <small>(${c.type})</small>`).join('<br>');
            }
          } catch {
            suggestionOverlay.innerHTML = '<em style="color: var(--danger-base, red);">Failed to generate suggestion.</em>';
          }
        });

        container.appendChild(canvas);
        container.appendChild(controls);
        container.appendChild(suggestionOverlay);

        // TODO: E062 - Wire up connection-router.ts
        // TODO: Load routing graph from routing-graph store
        // TODO: Implement drag-to-connect UI
        // TODO: Implement connection validation (Phase D rules)
        // TODO: Add undo support for routing changes

        // Resize canvas to fill container
        const resizeCanvas = () => {
          const rect = container.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          
          // Simple placeholder visualization
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Routing Graph Visualization', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText('(Connection Router Integration Pending)', canvas.width / 2, canvas.height / 2 + 20);
          }
        };

        // Initial resize
        setTimeout(resizeCanvas, 0);

        return container;
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
