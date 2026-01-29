/**
 * @fileoverview Conversation Manager for AI Advisor
 * 
 * Manages conversation history, bookmarks, and session persistence
 * for the AI advisor interface.
 * 
 * L301-L310: Conversation history and bookmarks
 * 
 * @module @cardplay/ai/advisor/conversation-manager
 */

import { AIAdvisor, AdvisorContext, AdvisorAnswer, createAIAdvisor } from './advisor-interface.js';

// =============================================================================
// Types
// =============================================================================

/**
 * A single turn in a conversation.
 */
export interface ConversationTurn {
  /** Unique turn ID */
  readonly id: string;
  /** User's question */
  readonly question: string;
  /** AI's answer */
  readonly answer: AdvisorAnswer;
  /** Context at time of question */
  readonly context: AdvisorContext;
  /** Timestamp */
  readonly timestamp: number;
  /** Whether this turn is bookmarked */
  readonly bookmarked: boolean;
}

/**
 * A bookmark for easy reference.
 */
export interface Bookmark {
  /** Turn ID this references */
  readonly turnId: string;
  /** User-assigned label */
  readonly label: string;
  /** Optional notes */
  readonly notes?: string;
  /** When bookmarked */
  readonly createdAt: number;
}

/**
 * A conversation session.
 */
export interface ConversationSession {
  /** Session ID */
  readonly id: string;
  /** Session title (auto-generated or user-set) */
  title: string;
  /** All turns in this session */
  readonly turns: ConversationTurn[];
  /** Bookmarks in this session */
  readonly bookmarks: Bookmark[];
  /** Session creation time */
  readonly createdAt: number;
  /** Last update time */
  readonly updatedAt: number;
  /** Initial context for the session */
  readonly initialContext?: AdvisorContext;
}

/**
 * Summary of a session (for listing).
 */
export interface SessionSummary {
  readonly id: string;
  readonly title: string;
  readonly turnCount: number;
  readonly bookmarkCount: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly firstQuestion?: string;
}

// =============================================================================
// Conversation Manager
// =============================================================================

/**
 * Manages conversation history and bookmarks for the AI advisor.
 */
export class ConversationManager {
  private advisor: AIAdvisor;
  private sessions: Map<string, ConversationSession> = new Map();
  private activeSessionId: string | null = null;
  
  constructor(advisor: AIAdvisor = createAIAdvisor()) {
    this.advisor = advisor;
  }
  
  // ===========================================================================
  // Session Management
  // ===========================================================================
  
  /**
   * Start a new conversation session.
   */
  startSession(initialContext?: AdvisorContext): ConversationSession {
    const session = {
      id: this.generateId(),
      title: 'New Conversation',
      turns: [],
      bookmarks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...(initialContext !== undefined ? { initialContext } : {})
    } as ConversationSession;
    
    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    
    return session;
  }
  
  /**
   * Get the active session, creating one if none exists.
   */
  getActiveSession(): ConversationSession {
    if (this.activeSessionId) {
      const session = this.sessions.get(this.activeSessionId);
      if (session) return session;
    }
    
    return this.startSession();
  }
  
  /**
   * Set the active session.
   */
  setActiveSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      return true;
    }
    return false;
  }
  
  /**
   * Get a session by ID.
   */
  getSession(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * List all sessions.
   */
  listSessions(): SessionSummary[] {
    return Array.from(this.sessions.values())
      .map(s => {
        const firstQuestion = s.turns[0]?.question;
        return {
          id: s.id,
          title: s.title,
          turnCount: s.turns.length,
          bookmarkCount: s.bookmarks.length,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          ...(firstQuestion !== undefined ? { firstQuestion } : {})
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * Set session title.
   */
  setSessionTitle(sessionId: string, title: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.title = title;
    return true;
  }
  
  /**
   * Delete a session.
   */
  deleteSession(sessionId: string): boolean {
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    return this.sessions.delete(sessionId);
  }
  
  // ===========================================================================
  // Conversation
  // ===========================================================================
  
  /**
   * Ask a question in the current session.
   */
  async ask(question: string, context?: AdvisorContext): Promise<ConversationTurn> {
    const session = this.getActiveSession();
    const mergedContext = { ...session.initialContext, ...context };
    
    const answer = await this.advisor.ask(question, mergedContext);
    
    const turn: ConversationTurn = {
      id: this.generateId(),
      question,
      answer,
      context: mergedContext,
      timestamp: Date.now(),
      bookmarked: false
    };
    
    session.turns.push(turn);
    (session as { updatedAt: number }).updatedAt = Date.now();
    
    // Auto-generate title from first question
    if (session.turns.length === 1 && session.title === 'New Conversation') {
      session.title = this.generateTitle(question);
    }
    
    return turn;
  }
  
  /**
   * Get conversation history for current session.
   */
  getHistory(): ConversationTurn[] {
    return this.getActiveSession().turns;
  }
  
  /**
   * Get the last N turns.
   */
  getRecentTurns(count: number): ConversationTurn[] {
    const turns = this.getActiveSession().turns;
    return turns.slice(-count);
  }
  
  /**
   * Find turns matching a query.
   */
  searchHistory(query: string, sessionId?: string): ConversationTurn[] {
    const pattern = new RegExp(query, 'i');
    const sessions = sessionId 
      ? [this.sessions.get(sessionId)].filter(Boolean)
      : Array.from(this.sessions.values());
    
    const results: ConversationTurn[] = [];
    
    for (const session of sessions) {
      if (!session) continue;
      for (const turn of session.turns) {
        if (pattern.test(turn.question) || pattern.test(turn.answer.text)) {
          results.push(turn);
        }
      }
    }
    
    return results;
  }
  
  // ===========================================================================
  // Bookmarks
  // ===========================================================================
  
  /**
   * Bookmark a turn.
   */
  addBookmark(turnId: string, label: string, notes?: string): Bookmark | null {
    const session = this.getActiveSession();
    const turn = session.turns.find(t => t.id === turnId);
    
    if (!turn) return null;
    
    // Mark turn as bookmarked
    (turn as { bookmarked: boolean }).bookmarked = true;
    
    const bookmark: Bookmark = {
      turnId,
      label,
      ...(notes !== undefined ? { notes } : {}),
      createdAt: Date.now()
    };
    
    session.bookmarks.push(bookmark);
    return bookmark;
  }
  
  /**
   * Remove a bookmark.
   */
  removeBookmark(turnId: string): boolean {
    const session = this.getActiveSession();
    const index = session.bookmarks.findIndex(b => b.turnId === turnId);
    
    if (index === -1) return false;
    
    session.bookmarks.splice(index, 1);
    
    // Unmark turn
    const turn = session.turns.find(t => t.id === turnId);
    if (turn) {
      (turn as { bookmarked: boolean }).bookmarked = false;
    }
    
    return true;
  }
  
  /**
   * Get all bookmarks in current session.
   */
  getBookmarks(): Bookmark[] {
    return this.getActiveSession().bookmarks;
  }
  
  /**
   * Get bookmarked turns.
   */
  getBookmarkedTurns(): ConversationTurn[] {
    const session = this.getActiveSession();
    return session.turns.filter(t => t.bookmarked);
  }
  
  // ===========================================================================
  // Persistence
  // ===========================================================================
  
  /**
   * Export session to JSON.
   */
  exportSession(sessionId?: string): string {
    const session = sessionId 
      ? this.sessions.get(sessionId)
      : this.getActiveSession();
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    return JSON.stringify(session, null, 2);
  }
  
  /**
   * Import session from JSON.
   */
  importSession(json: string): ConversationSession {
    const data = JSON.parse(json) as ConversationSession;
    
    // Validate structure
    if (!data.id || !data.turns || !Array.isArray(data.turns)) {
      throw new Error('Invalid session format');
    }
    
    // Generate new ID to avoid conflicts
    const session: ConversationSession = {
      ...data,
      id: this.generateId()
    };
    
    this.sessions.set(session.id, session);
    return session;
  }
  
  /**
   * Export all sessions.
   */
  exportAll(): string {
    const data = {
      version: 1,
      activeSessionId: this.activeSessionId,
      sessions: Array.from(this.sessions.values())
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Import all sessions.
   */
  importAll(json: string): void {
    const data = JSON.parse(json) as {
      version: number;
      activeSessionId: string | null;
      sessions: ConversationSession[];
    };
    
    if (!data.sessions || !Array.isArray(data.sessions)) {
      throw new Error('Invalid export format');
    }
    
    this.sessions.clear();
    
    for (const session of data.sessions) {
      this.sessions.set(session.id, session);
    }
    
    if (data.activeSessionId && this.sessions.has(data.activeSessionId)) {
      this.activeSessionId = data.activeSessionId;
    }
  }
  
  // ===========================================================================
  // Helpers
  // ===========================================================================
  
  /**
   * Generate a unique ID.
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Generate a title from a question.
   */
  private generateTitle(question: string): string {
    // Remove punctuation, trim, and take first few words
    const cleaned = question
      .replace(/[?!.,]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join(' ');
    
    return cleaned.length > 50 
      ? cleaned.substring(0, 47) + '...'
      : cleaned;
  }
}

/**
 * Create a new conversation manager.
 */
export function createConversationManager(
  advisor?: AIAdvisor
): ConversationManager {
  return new ConversationManager(advisor);
}
