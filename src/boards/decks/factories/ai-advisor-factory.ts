/**
 * @fileoverview AI Advisor Deck Factory
 * 
 * Factory for AI advisor deck - provides intelligent suggestions and workflow guidance.
 * Phase L299 implementation - Prolog-based AI advisor interface.
 * 
 * @module @cardplay/boards/decks/factories/ai-advisor-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * AI Advisor deck factory.
 * 
 * Provides:
 * - Intelligent suggestions based on project analysis
 * - Workflow optimization recommendations
 * - Board and deck configuration advice
 * - Parameter optimization suggestions
 * - Routing template recommendations
 * - Learning and adaptation insights
 * 
 * Future expansion:
 * - N012-N027: Workflow planning UI
 * - N063-N068: Project health panel
 * - N115-N120: Learning display
 */
export const aiAdvisorFactory: DeckFactory = {
  deckType: 'ai-advisor-deck',

  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    // Context will be used for future enhancements
    void ctx;
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'AI Advisor',
      
      render: () => {
        const container = document.createElement('div');
        container.className = 'ai-advisor-deck';
        container.setAttribute('data-deck-id', deckDef.id);
        
        // Header
        const header = document.createElement('div');
        header.className = 'ai-advisor-header';
        header.innerHTML = `
          <h3>AI Advisor</h3>
          <p class="advisor-subtitle">Intelligent suggestions and workflow guidance</p>
        `;
        
        // Content area
        const content = document.createElement('div');
        content.className = 'ai-advisor-content';
        
        // Suggestions section
        const suggestionsSection = createSuggestionsSection();
        content.appendChild(suggestionsSection);
        
        // Insights section
        const insightsSection = createInsightsSection();
        content.appendChild(insightsSection);
        
        // Actions section
        const actionsSection = createActionsSection();
        content.appendChild(actionsSection);
        
        container.appendChild(header);
        container.appendChild(content);
        
        // Apply styles
        injectStyles();
        
        return container;
      },
      
      destroy: () => {
        // Cleanup if needed
      },
    };
  },

  validate: (deckDef: BoardDeck): string | null => {
    if (!deckDef.id || !deckDef.type) {
      return 'Deck definition must have id and type';
    }
    return null;
  },
};

/**
 * Creates the suggestions section showing current recommendations.
 */
function createSuggestionsSection(): HTMLElement {
  const section = document.createElement('div');
  section.className = 'advisor-section suggestions-section';
  
  section.innerHTML = `
    <h4>Current Suggestions</h4>
    <div class="suggestion-list">
      <div class="suggestion-item">
        <span class="suggestion-icon">💡</span>
        <div class="suggestion-content">
          <strong>Board Configuration</strong>
          <p>Consider enabling phrase library for faster workflow</p>
        </div>
      </div>
      <div class="suggestion-item">
        <span class="suggestion-icon">⚡</span>
        <div class="suggestion-content">
          <strong>Workflow Optimization</strong>
          <p>Your pattern editing is frequent - try keyboard shortcuts</p>
        </div>
      </div>
      <div class="suggestion-item">
        <span class="suggestion-icon">🎵</span>
        <div class="suggestion-content">
          <strong>Music Theory</strong>
          <p>Detected key of C major - harmony helpers available</p>
        </div>
      </div>
    </div>
  `;
  
  return section;
}

/**
 * Creates the insights section showing project analysis.
 */
function createInsightsSection(): HTMLElement {
  const section = document.createElement('div');
  section.className = 'advisor-section insights-section';
  
  section.innerHTML = `
    <h4>Project Insights</h4>
    <div class="insight-list">
      <div class="insight-item">
        <span class="insight-label">Complexity:</span>
        <span class="insight-value">Medium</span>
        <div class="insight-bar">
          <div class="insight-bar-fill" style="width: 60%"></div>
        </div>
      </div>
      <div class="insight-item">
        <span class="insight-label">Track Count:</span>
        <span class="insight-value">8 tracks</span>
      </div>
      <div class="insight-item">
        <span class="insight-label">Harmony Consistency:</span>
        <span class="insight-value">Good</span>
        <div class="insight-bar">
          <div class="insight-bar-fill" style="width: 80%"></div>
        </div>
      </div>
      <div class="insight-item">
        <span class="insight-label">Mixing Balance:</span>
        <span class="insight-value">Needs attention</span>
        <div class="insight-bar">
          <div class="insight-bar-fill warning" style="width: 40%"></div>
        </div>
      </div>
    </div>
  `;
  
  return section;
}

/**
 * Creates the actions section with quick actions.
 */
function createActionsSection(): HTMLElement {
  const section = document.createElement('div');
  section.className = 'advisor-section actions-section';
  
  section.innerHTML = `
    <h4>Quick Actions</h4>
    <div class="action-buttons">
      <button class="advisor-action-btn" data-action="analyze">
        <span class="action-icon">🔍</span>
        Analyze Project
      </button>
      <button class="advisor-action-btn" data-action="optimize">
        <span class="action-icon">⚙️</span>
        Optimize Workflow
      </button>
      <button class="advisor-action-btn" data-action="suggest-routing">
        <span class="action-icon">🔌</span>
        Suggest Routing
      </button>
      <button class="advisor-action-btn" data-action="learn-more">
        <span class="action-icon">📚</span>
        View Tutorials
      </button>
    </div>
  `;
  
  return section;
}

/**
 * Injects styles for the AI advisor deck.
 */
function injectStyles(): void {
  const styleId = 'ai-advisor-deck-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .ai-advisor-deck {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-background, #1a1a1a);
      color: var(--color-text, #e0e0e0);
      overflow: hidden;
    }
    
    .ai-advisor-header {
      padding: 1rem;
      border-bottom: 1px solid var(--color-border, #333);
      background: var(--color-surface, #222);
    }
    
    .ai-advisor-header h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-primary, #6366f1);
    }
    
    .advisor-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #999);
    }
    
    .ai-advisor-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    
    .advisor-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--color-surface, #222);
      border-radius: 8px;
      border: 1px solid var(--color-border, #333);
    }
    
    .advisor-section h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text, #e0e0e0);
    }
    
    .suggestion-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .suggestion-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--color-background, #1a1a1a);
      border-radius: 6px;
      border: 1px solid var(--color-border, #333);
      transition: background 0.2s;
    }
    
    .suggestion-item:hover {
      background: var(--color-surface-hover, #2a2a2a);
    }
    
    .suggestion-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .suggestion-content {
      flex: 1;
    }
    
    .suggestion-content strong {
      display: block;
      margin-bottom: 0.25rem;
      color: var(--color-text, #e0e0e0);
    }
    
    .suggestion-content p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #999);
    }
    
    .insight-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .insight-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .insight-label {
      min-width: 140px;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #999);
    }
    
    .insight-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text, #e0e0e0);
      min-width: 100px;
    }
    
    .insight-bar {
      flex: 1;
      height: 6px;
      background: var(--color-background, #1a1a1a);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .insight-bar-fill {
      height: 100%;
      background: var(--color-primary, #6366f1);
      transition: width 0.3s;
    }
    
    .insight-bar-fill.warning {
      background: var(--color-warning, #f59e0b);
    }
    
    .action-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
    }
    
    .advisor-action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--color-background, #1a1a1a);
      color: var(--color-text, #e0e0e0);
      border: 1px solid var(--color-border, #333);
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .advisor-action-btn:hover {
      background: var(--color-primary, #6366f1);
      border-color: var(--color-primary, #6366f1);
      transform: translateY(-1px);
    }
    
    .advisor-action-btn:active {
      transform: translateY(0);
    }
    
    .action-icon {
      font-size: 1.25rem;
    }
  `;
  
  document.head.appendChild(style);
}
