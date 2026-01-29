/**
 * @fileoverview Tests for Conversation Manager
 * 
 * @module @cardplay/ai/advisor/conversation-manager.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ConversationManager, 
  createConversationManager,
  ConversationSession,
  ConversationTurn
} from './conversation-manager';

describe('ConversationManager', () => {
  let manager: ConversationManager;
  
  beforeEach(() => {
    manager = createConversationManager();
  });
  
  // ===========================================================================
  // Session Management
  // ===========================================================================
  
  describe('session management', () => {
    it('should create manager instance', () => {
      expect(manager).toBeInstanceOf(ConversationManager);
    });
    
    it('should start a new session', () => {
      const session = manager.startSession();
      
      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.turns).toEqual([]);
      expect(session.bookmarks).toEqual([]);
    });
    
    it('should start session with initial context', () => {
      const context = { key: { root: 'c', mode: 'major' } };
      const session = manager.startSession(context);
      
      expect(session.initialContext).toEqual(context);
    });
    
    it('should auto-create session on getActiveSession', () => {
      const session = manager.getActiveSession();
      
      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
    });
    
    it('should set active session', () => {
      const session1 = manager.startSession();
      const session2 = manager.startSession();
      
      expect(manager.getActiveSession().id).toBe(session2.id);
      
      manager.setActiveSession(session1.id);
      expect(manager.getActiveSession().id).toBe(session1.id);
    });
    
    it('should return false for invalid session', () => {
      const result = manager.setActiveSession('nonexistent');
      expect(result).toBe(false);
    });
    
    it('should get session by ID', () => {
      const session = manager.startSession();
      const retrieved = manager.getSession(session.id);
      
      expect(retrieved).toEqual(session);
    });
    
    it('should list sessions', () => {
      manager.startSession();
      manager.startSession();
      
      const list = manager.listSessions();
      
      expect(list.length).toBe(2);
      expect(list[0].turnCount).toBe(0);
    });
    
    it('should set session title', () => {
      const session = manager.startSession();
      manager.setSessionTitle(session.id, 'My Session');
      
      expect(manager.getSession(session.id)?.title).toBe('My Session');
    });
    
    it('should delete session', () => {
      const session = manager.startSession();
      manager.startSession(); // Create another to remain active
      
      const result = manager.deleteSession(session.id);
      
      expect(result).toBe(true);
      expect(manager.getSession(session.id)).toBeUndefined();
    });
  });
  
  // ===========================================================================
  // Conversation
  // ===========================================================================
  
  describe('conversation', () => {
    it('should ask a question and get answer', async () => {
      const turn = await manager.ask('What chord should I use?');
      
      expect(turn).toBeDefined();
      expect(turn.question).toBe('What chord should I use?');
      expect(turn.answer).toBeDefined();
      expect(turn.timestamp).toBeGreaterThan(0);
    });
    
    it('should store turns in session', async () => {
      await manager.ask('Question 1');
      await manager.ask('Question 2');
      
      const history = manager.getHistory();
      
      expect(history.length).toBe(2);
      expect(history[0].question).toBe('Question 1');
      expect(history[1].question).toBe('Question 2');
    });
    
    it('should merge context', async () => {
      manager.startSession({ genre: 'jazz' });
      const turn = await manager.ask('What tempo?', { key: { root: 'c', mode: 'major' } });
      
      expect(turn.context.genre).toBe('jazz');
      expect(turn.context.key).toEqual({ root: 'c', mode: 'major' });
    });
    
    it('should auto-generate title from first question', async () => {
      await manager.ask('What chord should I use next?');
      
      const session = manager.getActiveSession();
      expect(session.title).not.toBe('New Conversation');
      expect(session.title).toMatch(/chord/i);
    });
    
    it('should get recent turns', async () => {
      await manager.ask('Q1');
      await manager.ask('Q2');
      await manager.ask('Q3');
      
      const recent = manager.getRecentTurns(2);
      
      expect(recent.length).toBe(2);
      expect(recent[0].question).toBe('Q2');
      expect(recent[1].question).toBe('Q3');
    });
    
    it('should search history', async () => {
      await manager.ask('What chord works here?');
      await manager.ask('How do drums work?');
      await manager.ask('Tell me about chords');
      
      const results = manager.searchHistory('chord');
      
      expect(results.length).toBe(2);
    });
  });
  
  // ===========================================================================
  // Bookmarks
  // ===========================================================================
  
  describe('bookmarks', () => {
    let turn: ConversationTurn;
    
    beforeEach(async () => {
      turn = await manager.ask('Important question');
    });
    
    it('should add bookmark', () => {
      const bookmark = manager.addBookmark(turn.id, 'My Bookmark');
      
      expect(bookmark).toBeDefined();
      expect(bookmark!.turnId).toBe(turn.id);
      expect(bookmark!.label).toBe('My Bookmark');
    });
    
    it('should add bookmark with notes', () => {
      const bookmark = manager.addBookmark(turn.id, 'Bookmark', 'Some notes');
      
      expect(bookmark!.notes).toBe('Some notes');
    });
    
    it('should return null for invalid turn', () => {
      const bookmark = manager.addBookmark('nonexistent', 'Label');
      expect(bookmark).toBeNull();
    });
    
    it('should mark turn as bookmarked', () => {
      manager.addBookmark(turn.id, 'Bookmark');
      
      const history = manager.getHistory();
      expect(history[0].bookmarked).toBe(true);
    });
    
    it('should remove bookmark', () => {
      manager.addBookmark(turn.id, 'Bookmark');
      const result = manager.removeBookmark(turn.id);
      
      expect(result).toBe(true);
      expect(manager.getBookmarks().length).toBe(0);
    });
    
    it('should get all bookmarks', async () => {
      const turn2 = await manager.ask('Another question');
      
      manager.addBookmark(turn.id, 'B1');
      manager.addBookmark(turn2.id, 'B2');
      
      const bookmarks = manager.getBookmarks();
      
      expect(bookmarks.length).toBe(2);
    });
    
    it('should get bookmarked turns', async () => {
      const turn2 = await manager.ask('Regular question');
      await manager.ask('Another regular');
      
      manager.addBookmark(turn.id, 'Important');
      manager.addBookmark(turn2.id, 'Also important');
      
      const bookmarked = manager.getBookmarkedTurns();
      
      expect(bookmarked.length).toBe(2);
      expect(bookmarked[0].id).toBe(turn.id);
    });
  });
  
  // ===========================================================================
  // Persistence
  // ===========================================================================
  
  describe('persistence', () => {
    it('should export session to JSON', async () => {
      await manager.ask('Test question');
      
      const json = manager.exportSession();
      const parsed = JSON.parse(json);
      
      expect(parsed.id).toBeTruthy();
      expect(parsed.turns.length).toBe(1);
    });
    
    it('should import session from JSON', async () => {
      await manager.ask('Original question');
      const json = manager.exportSession();
      
      // Create new manager
      const newManager = createConversationManager();
      const imported = newManager.importSession(json);
      
      expect(imported.turns.length).toBe(1);
      expect(imported.turns[0].question).toBe('Original question');
    });
    
    it('should throw on invalid session format', () => {
      expect(() => manager.importSession('{}')).toThrow('Invalid session format');
    });
    
    it('should export all sessions', async () => {
      manager.startSession();
      await manager.ask('Q1');
      
      manager.startSession();
      await manager.ask('Q2');
      
      const json = manager.exportAll();
      const parsed = JSON.parse(json);
      
      expect(parsed.version).toBe(1);
      expect(parsed.sessions.length).toBe(2);
    });
    
    it('should import all sessions', async () => {
      manager.startSession();
      await manager.ask('Q1');
      manager.startSession();
      await manager.ask('Q2');
      
      const json = manager.exportAll();
      
      const newManager = createConversationManager();
      newManager.importAll(json);
      
      expect(newManager.listSessions().length).toBe(2);
    });
    
    it('should throw on invalid export format', () => {
      expect(() => manager.importAll('{}')).toThrow('Invalid export format');
    });
  });
  
  // ===========================================================================
  // Factory Function
  // ===========================================================================
  
  describe('factory function', () => {
    it('should create manager with createConversationManager', () => {
      const manager = createConversationManager();
      expect(manager).toBeInstanceOf(ConversationManager);
    });
  });
});
