/**
 * @fileoverview AI Advisor Panel UI Component
 * 
 * A Lit-based web component for the AI advisor interface.
 * Provides a chat-like UI for asking musical questions.
 * 
 * L294-L300: AI Advisor Panel UI
 * 
 * @module @cardplay/ui/components/ai-advisor-panel
 */

import { LitElement, html, css, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { 
  AIAdvisor, 
  createAIAdvisor, 
  AdvisorContext, 
  FollowUp,
  HostAction
} from '../../ai/advisor/advisor-interface.js';
import { 
  ConversationManager, 
  createConversationManager,
  ConversationTurn 
} from '../../ai/advisor/conversation-manager.js';

// =============================================================================
// AI Advisor Panel Component
// =============================================================================

@customElement('ai-advisor-panel')
export class AIAdvisorPanel extends LitElement {
  // ===========================================================================
  // Static Styles
  // ===========================================================================
  
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--advisor-bg, #1e1e1e);
      color: var(--advisor-text, #e0e0e0);
      font-family: var(--advisor-font, system-ui, sans-serif);
    }
    
    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--advisor-border, #333);
      background: var(--advisor-header-bg, #252525);
    }
    
    .header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .icon-button {
      background: transparent;
      border: none;
      color: var(--advisor-icon, #888);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.15s, color 0.15s;
    }
    
    .icon-button:hover {
      background: var(--advisor-hover, #333);
      color: var(--advisor-text, #e0e0e0);
    }
    
    /* Messages Area */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .message {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 90%;
    }
    
    .message.user {
      align-self: flex-end;
    }
    
    .message.assistant {
      align-self: flex-start;
    }
    
    .message-content {
      padding: 12px 16px;
      border-radius: 12px;
      line-height: 1.5;
    }
    
    .message.user .message-content {
      background: var(--advisor-user-bg, #2563eb);
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .message.assistant .message-content {
      background: var(--advisor-assistant-bg, #333);
      border-bottom-left-radius: 4px;
    }
    
    .confidence-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--advisor-confidence-bg, #444);
      color: var(--advisor-confidence-text, #aaa);
      align-self: flex-start;
    }
    
    .confidence-high {
      background: #166534;
      color: #86efac;
    }
    
    .confidence-medium {
      background: #854d0e;
      color: #fde047;
    }
    
    .confidence-low {
      background: #7f1d1d;
      color: #fca5a5;
    }
    
    /* Actions */
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    
    .action-button {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--advisor-action-border, #555);
      background: var(--advisor-action-bg, #2a2a2a);
      color: var(--advisor-text, #e0e0e0);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .action-button:hover {
      background: var(--advisor-action-hover, #3a3a3a);
      border-color: var(--advisor-accent, #2563eb);
    }
    
    /* Follow-ups */
    .follow-ups {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    
    .follow-up-button {
      padding: 6px 12px;
      border-radius: 16px;
      border: 1px solid var(--advisor-border, #444);
      background: transparent;
      color: var(--advisor-accent, #60a5fa);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .follow-up-button:hover {
      background: var(--advisor-hover, rgba(96, 165, 250, 0.1));
    }
    
    /* Empty State */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 32px;
      color: var(--advisor-muted, #888);
    }
    
    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 18px;
      color: var(--advisor-text, #e0e0e0);
    }
    
    .empty-state p {
      margin: 0 0 24px;
      max-width: 300px;
    }
    
    .suggestions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    /* Input Area */
    .input-area {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--advisor-border, #333);
      background: var(--advisor-input-bg, #252525);
    }
    
    .input-field {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--advisor-border, #444);
      background: var(--advisor-input-field-bg, #1e1e1e);
      color: var(--advisor-text, #e0e0e0);
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
    }
    
    .input-field:focus {
      border-color: var(--advisor-accent, #2563eb);
    }
    
    .input-field::placeholder {
      color: var(--advisor-placeholder, #666);
    }
    
    .send-button {
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      background: var(--advisor-accent, #2563eb);
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    
    .send-button:hover {
      background: var(--advisor-accent-hover, #1d4ed8);
    }
    
    .send-button:disabled {
      background: var(--advisor-disabled, #444);
      cursor: not-allowed;
    }
    
    /* Loading */
    .loading {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
    }
    
    .loading-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--advisor-accent, #2563eb);
      animation: bounce 1.4s infinite ease-in-out both;
    }
    
    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    /* Bookmark indicator */
    .bookmark-icon {
      cursor: pointer;
      color: var(--advisor-muted, #666);
      transition: color 0.15s;
    }
    
    .bookmark-icon:hover {
      color: var(--advisor-accent, #2563eb);
    }
    
    .bookmark-icon.active {
      color: var(--advisor-bookmark, #f59e0b);
    }
  `;
  
  // ===========================================================================
  // Properties
  // ===========================================================================
  
  /** Current board context */
  @property({ type: Object })
  context: AdvisorContext = {};
  
  /** Placeholder text for input */
  @property({ type: String })
  placeholder = 'Ask about chords, melodies, genres...';
  
  /** Show confidence badges */
  @property({ type: Boolean })
  showConfidence = true;
  
  // ===========================================================================
  // State
  // ===========================================================================
  
  @state()
  private turns: ConversationTurn[] = [];
  
  @state()
  private inputValue = '';
  
  @state()
  private isLoading = false;
  
  @query('.messages')
  private messagesContainer!: HTMLElement;
  
  // ===========================================================================
  // Private Fields
  // ===========================================================================
  
  private advisor: AIAdvisor;
  private conversationManager: ConversationManager;
  
  // ===========================================================================
  // Lifecycle
  // ===========================================================================
  
  constructor() {
    super();
    this.advisor = createAIAdvisor();
    this.conversationManager = createConversationManager(this.advisor);
  }
  
  override connectedCallback(): void {
    super.connectedCallback();
    this.turns = this.conversationManager.getHistory();
  }
  
  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('turns')) {
      this.scrollToBottom();
    }
  }
  
  // ===========================================================================
  // Event Handlers
  // ===========================================================================
  
  private handleInputChange(e: Event): void {
    this.inputValue = (e.target as HTMLInputElement).value;
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submitQuestion();
    }
  }
  
  private async submitQuestion(): Promise<void> {
    const question = this.inputValue.trim();
    if (!question || this.isLoading) return;
    
    this.inputValue = '';
    this.isLoading = true;
    
    try {
      const turn = await this.conversationManager.ask(question, this.context);
      this.turns = [...this.conversationManager.getHistory()];
      
      // Dispatch event for host integration
      this.dispatchEvent(new CustomEvent('advisor-answer', {
        detail: { turn },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Advisor error:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private handleFollowUp(question: string): void {
    this.inputValue = question;
    this.submitQuestion();
  }
  
  private handleAction(action: HostAction): void {
    this.dispatchEvent(new CustomEvent('advisor-action', {
      detail: { action },
      bubbles: true,
      composed: true
    }));
  }
  
  private toggleBookmark(turn: ConversationTurn): void {
    if (turn.bookmarked) {
      this.conversationManager.removeBookmark(turn.id);
    } else {
      this.conversationManager.addBookmark(turn.id, turn.question.substring(0, 30));
    }
    this.turns = [...this.conversationManager.getHistory()];
  }
  
  private newConversation(): void {
    this.conversationManager.startSession(this.context);
    this.turns = [];
  }
  
  // ===========================================================================
  // Helpers
  // ===========================================================================
  
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      requestAnimationFrame(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      });
    }
  }
  
  private getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 50) return 'confidence-medium';
    return 'confidence-low';
  }
  
  // ===========================================================================
  // Render
  // ===========================================================================
  
  protected override render(): TemplateResult {
    return html`
      <div class="header">
        <h2>AI Advisor</h2>
        <div class="header-actions">
          <button 
            class="icon-button" 
            title="New conversation"
            @click=${this.newConversation}
          >
            ✨
          </button>
          <button 
            class="icon-button" 
            title="Bookmarks"
            @click=${() => this.dispatchEvent(new CustomEvent('show-bookmarks'))}
          >
            🔖
          </button>
        </div>
      </div>
      
      <div class="messages">
        ${this.turns.length === 0 
          ? this.renderEmptyState() 
          : this.turns.map(turn => this.renderTurn(turn))
        }
        ${this.isLoading ? this.renderLoading() : ''}
      </div>
      
      <div class="input-area">
        <input
          class="input-field"
          type="text"
          .value=${this.inputValue}
          placeholder=${this.placeholder}
          @input=${this.handleInputChange}
          @keydown=${this.handleKeyDown}
          ?disabled=${this.isLoading}
        />
        <button
          class="send-button"
          @click=${this.submitQuestion}
          ?disabled=${!this.inputValue.trim() || this.isLoading}
        >
          Ask
        </button>
      </div>
    `;
  }
  
  private renderEmptyState(): TemplateResult {
    return html`
      <div class="empty-state">
        <h3>🎵 How can I help?</h3>
        <p>Ask me about chords, melodies, rhythms, genres, or any music-related questions.</p>
        <div class="suggestions">
          <button 
            class="follow-up-button"
            @click=${() => this.handleFollowUp('What chord should I use next?')}
          >
            What chord should I use next?
          </button>
          <button 
            class="follow-up-button"
            @click=${() => this.handleFollowUp('How do I create a lofi beat?')}
          >
            How do I create a lofi beat?
          </button>
          <button 
            class="follow-up-button"
            @click=${() => this.handleFollowUp('Which board should I use?')}
          >
            Which board should I use?
          </button>
        </div>
      </div>
    `;
  }
  
  private renderTurn(turn: ConversationTurn): TemplateResult {
    return html`
      <!-- User message -->
      <div class="message user">
        <div class="message-content">${turn.question}</div>
      </div>
      
      <!-- Assistant message -->
      <div class="message assistant">
        <div class="message-content">${turn.answer.text}</div>
        
        ${this.showConfidence ? html`
          <span class="confidence-badge ${this.getConfidenceClass(turn.answer.confidence)}">
            ${turn.answer.confidence}% confidence
          </span>
        ` : ''}
        
        ${turn.answer.actions?.length ? html`
          <div class="actions">
            ${turn.answer.actions.map(action => html`
              <button 
                class="action-button"
                @click=${() => this.handleAction(action)}
              >
                ${action.description}
              </button>
            `)}
          </div>
        ` : ''}
        
        ${turn.answer.followUps?.length ? html`
          <div class="follow-ups">
            ${turn.answer.followUps.map((f: FollowUp) => html`
              <button 
                class="follow-up-button"
                @click=${() => this.handleFollowUp(f.question)}
              >
                ${f.question}
              </button>
            `)}
          </div>
        ` : ''}
        
        <span 
          class="bookmark-icon ${turn.bookmarked ? 'active' : ''}"
          title=${turn.bookmarked ? 'Remove bookmark' : 'Bookmark this answer'}
          @click=${() => this.toggleBookmark(turn)}
        >
          ${turn.bookmarked ? '★' : '☆'}
        </span>
      </div>
    `;
  }
  
  private renderLoading(): TemplateResult {
    return html`
      <div class="message assistant">
        <div class="loading">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      </div>
    `;
  }
}

// =============================================================================
// Declaration
// =============================================================================

declare global {
  interface HTMLElementTagNameMap {
    'ai-advisor-panel': AIAdvisorPanel;
  }
}
