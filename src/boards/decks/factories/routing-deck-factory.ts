/**
 * @fileoverview Routing/Modular Deck Factory (E061-E062, M121)
 *
 * E061-E062: Implement routing deck for graph visualization + edit UI.
 * M121: Wire in routing suggestions from workflow-queries.
 *
 * @module @cardplay/boards/decks/factories/routing-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { suggestRouting } from '../../../ai/queries/workflow-queries';
import { getRoutingGraph } from '../../../state/routing-graph';
import { RoutingOverlay, injectRoutingOverlayStyles } from '../../../ui/components/routing-overlay';
import { ConnectionInspector, injectConnectionInspectorStyles } from '../../../ui/components/connection-inspector';

/**
 * Routing/modular deck factory.
 *
 * Provides routing graph visualization and editing:
 * - Node visualization (instruments, effects, busses)
 * - Connection visualization (audio, MIDI, modulation)
 * - Drag-to-connect interface
 * - Connection validation
 *
 * E062: Uses ui/components/routing-overlay.ts for rendering.
 * Change 248: Reads/writes only SSOT RoutingGraphStore (no parallel graph).
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

        // Change 248: Inject required styles
        injectRoutingOverlayStyles();
        injectConnectionInspectorStyles();

        // Change 248: Use RoutingOverlay component reading from SSOT RoutingGraphStore
        const overlay = new RoutingOverlay(container);
        overlay.setVisible(true);

        // Change 248: Use ConnectionInspector for selected connection details
        const inspector = new ConnectionInspector(container);

        // Overlay controls
        const controls = document.createElement('div');
        controls.style.cssText = `
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
          z-index: 1001;
        `;

        // Add Node button
        const addNodeBtn = document.createElement('button');
        addNodeBtn.style.cssText = `
          padding: 0.5rem 1rem;
          border: none;
          background: var(--color-primary);
          color: var(--color-on-primary);
          border-radius: var(--radius-sm);
          cursor: pointer;
        `;
        addNodeBtn.textContent = 'Add Node';
        addNodeBtn.addEventListener('click', () => {
          // Change 248: Use SSOT routing graph to add node
          const graph = getRoutingGraph();
          const nodeId = `node-${Date.now()}`;
          graph.addNode({
            id: nodeId,
            type: 'deck',
            name: `Node ${graph.getState().nodes.size + 1}`,
            inputs: [{ id: 'input', name: 'Input', type: 'audio' }],
            outputs: [{ id: 'output', name: 'Output', type: 'audio' }],
            bypassed: false,
          });
        });
        controls.appendChild(addNodeBtn);

        // Clear button
        const clearBtn = document.createElement('button');
        clearBtn.style.cssText = `
          padding: 0.5rem 1rem;
          border: none;
          background: var(--color-surface-variant);
          color: var(--color-on-surface);
          border-radius: var(--radius-sm);
          cursor: pointer;
        `;
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => {
          // Change 248: Use SSOT routing graph to clear
          const graph = getRoutingGraph();
          const state = graph.getState();
          state.edges.forEach(edge => graph.disconnect(edge.id));
        });
        controls.appendChild(clearBtn);

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
            // M121: Get AI routing suggestions
            const suggestedGraph = await suggestRouting('tracker_mixing', ['pattern_editor', 'mixer', 'effect_chain', 'master']);
            if (suggestedGraph.connections.length === 0) {
              suggestionOverlay.innerHTML = '<strong>Nodes:</strong> ' + suggestedGraph.nodes.join(', ') + '<br><em>No connections suggested.</em>';
            } else {
              suggestionOverlay.innerHTML = '<strong>Suggested Routing:</strong><br>' +
                suggestedGraph.connections.map(c => `${c.from} → ${c.to} <small>(${c.type})</small>`).join('<br>');
              
              // Change 248: Apply suggestions to SSOT routing graph
              const graph = getRoutingGraph();
              suggestedGraph.connections.forEach(conn => {
                // Map connection type to EdgeType
                // conn.type from suggestRouting is 'audio' or 'control'
                const edgeType: 'audio' | 'midi' | 'cv' | 'trigger' = 
                  conn.type === 'control' ? 'cv' : 'audio';
                graph.connect(conn.from, 'output', conn.to, 'input', edgeType);
              });
            }
          } catch {
            suggestionOverlay.innerHTML = '<em style="color: var(--danger-base, red);">Failed to generate suggestion.</em>';
          }
        });

        container.appendChild(controls);
        container.appendChild(suggestionOverlay);

        // Change 248: Cleanup function to destroy overlay and inspector
        const cleanup = () => {
          overlay.destroy();
          inspector.destroy();
        };

        // Store cleanup for deck destruction
        (container as any)._cleanup = cleanup;

        return container;
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
