/**
 * @fileoverview AI Advisor Deck Factory
 * 
 * Factory for AI advisor deck - provides intelligent suggestions and workflow guidance.
 * Phase L299 implementation - Prolog-based AI advisor interface.
 * Change 362: Display confidence and reasons for HostAction suggestions.
 * 
 * @module @cardplay/boards/decks/factories/ai-advisor-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import type { HostAction } from '../../../ai/theory/host-actions';

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
 * Change 362: Creates the suggestions section showing current recommendations
 * with confidence scores and reasons.
 */
function createSuggestionsSection(): HTMLElement {
  const section = document.createElement('div');
  section.className = 'advisor-section suggestions-section';
  
  // Mock HostAction suggestions with confidence and reasons
  // In production, these would come from queryHostActionsWithEnvelope
  const mockSuggestions = [
    {
      action: { action: 'add_deck' as const, deckType: 'phrase-library' },
      confidence: 0.85,
      reasons: ['Frequent phrase editing detected', 'Phrase library improves workflow efficiency']
    },
    {
      action: { action: 'set_key' as const, root: 'c' as const, mode: 'major' as const },
      confidence: 0.92,
      reasons: ['Most notes are in C major scale', 'Key center detected with high confidence']
    },
    {
      action: { action: 'show_hint' as const, hintId: 'keyboard-shortcuts' },
      confidence: 0.70,
      reasons: ['Many mouse-based actions', 'Keyboard shortcuts available for common operations']
    }
  ];
  
  const headerEl = document.createElement('h4');
  headerEl.textContent = 'Current Suggestions';
  section.appendChild(headerEl);
  
  const listEl = document.createElement('div');
  listEl.className = 'suggestion-list';
  
  mockSuggestions.forEach(suggestion => {
    const item = createSuggestionItem(
      suggestion.action,
      suggestion.confidence,
      suggestion.reasons
    );
    listEl.appendChild(item);
  });
  
  section.appendChild(listEl);
  
  return section;
}

/**
 * Change 362: Creates a single suggestion item with confidence and reasons.
 */
function createSuggestionItem(
  action: HostAction | { action: string; [key: string]: unknown },
  confidence: number,
  reasons: readonly string[]
): HTMLElement {
  const item = document.createElement('div');
  item.className = 'suggestion-item';
  
  // Confidence badge with color coding
  const confidenceBadge = document.createElement('div');
  confidenceBadge.className = 'confidence-badge';
  const confidencePercent = Math.round(confidence * 100);
  confidenceBadge.textContent = `${confidencePercent}%`;
  
  // Color code by confidence level
  if (confidence >= 0.8) {
    confidenceBadge.classList.add('high-confidence');
  } else if (confidence >= 0.6) {
    confidenceBadge.classList.add('medium-confidence');
  } else {
    confidenceBadge.classList.add('low-confidence');
  }
  
  // Icon based on action type
  const iconEl = document.createElement('span');
  iconEl.className = 'suggestion-icon';
  iconEl.textContent = getActionIcon(action.action);
  
  // Content container
  const contentEl = document.createElement('div');
  contentEl.className = 'suggestion-content';
  
  // Action title
  const titleEl = document.createElement('strong');
  titleEl.textContent = getActionTitle(action);
  contentEl.appendChild(titleEl);
  
  // Reasons list
  const reasonsEl = document.createElement('ul');
  reasonsEl.className = 'suggestion-reasons';
  reasons.forEach(reason => {
    const li = document.createElement('li');
    li.textContent = reason;
    reasonsEl.appendChild(li);
  });
  contentEl.appendChild(reasonsEl);
  
  // Action button
  const actionBtn = document.createElement('button');
  actionBtn.className = 'suggestion-action-btn';
  actionBtn.textContent = 'Apply';
  actionBtn.onclick = () => applyAction(action);
  
  item.appendChild(confidenceBadge);
  item.appendChild(iconEl);
  item.appendChild(contentEl);
  item.appendChild(actionBtn);
  
  return item;
}

/**
 * Get icon for action type.
 */
function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    add_deck: '📚',
    set_key: '🎵',
    set_tempo: '⏱️',
    add_constraint: '🔧',
    show_hint: '💡',
    apply_pack: '📦',
    set_param: '⚙️',
  };
  return icons[actionType] || '✨';
}

/**
 * Get human-readable title for action.
 */
function getActionTitle(action: HostAction | { action: string; [key: string]: unknown }): string {
  const actionType = action.action;
  switch (actionType) {
    case 'add_deck':
      return `Add ${(action as any).deckType || 'Deck'}`;
    case 'set_key':
      return `Set Key to ${(action as any).root} ${(action as any).mode}`;
    case 'set_tempo':
      return `Set Tempo to ${(action as any).bpm} BPM`;
    case 'add_constraint':
      return 'Add Music Constraint';
    case 'show_hint':
      return 'View Hint';
    case 'apply_pack':
      return `Apply ${(action as any).packId} Pack`;
    case 'set_param':
      return `Set ${(action as any).paramId}`;
    default:
      return actionType;
  }
}

/**
 * Apply a suggested action (stub - would integrate with apply-host-action).
 */
function applyAction(action: unknown): void {
  console.log('Applying action:', action);
  // TODO: Wire to applyHostAction from apply-host-action.ts
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
      align-items: flex-start;
    }
    
    .suggestion-item:hover {
      background: var(--color-surface-hover, #2a2a2a);
    }
    
    /* Change 362: Confidence badge styling */
    .confidence-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 45px;
      height: 24px;
      padding: 0 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .confidence-badge.high-confidence {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    
    .confidence-badge.medium-confidence {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }
    
    .confidence-badge.low-confidence {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .suggestion-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .suggestion-content {
      flex: 1;
      min-width: 0;
    }
    
    .suggestion-content strong {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--color-text, #e0e0e0);
    }
    
    /* Change 362: Reasons list styling */
    .suggestion-reasons {
      margin: 0;
      padding-left: 1.25rem;
      list-style-type: disc;
    }
    
    .suggestion-reasons li {
      margin: 0.25rem 0;
      font-size: 0.8125rem;
      color: var(--color-text-secondary, #999);
      line-height: 1.4;
    }
    
    /* Change 362: Action button styling */
    .suggestion-action-btn {
      padding: 0.5rem 1rem;
      background: var(--color-primary, #6366f1);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    
    .suggestion-action-btn:hover {
      background: var(--color-primary-hover, #4f46e5);
      transform: translateY(-1px);
    }
    
    .suggestion-action-btn:active {
      transform: translateY(0);
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
