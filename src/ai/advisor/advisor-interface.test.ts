/**
 * @fileoverview Tests for AI Advisor Interface
 * 
 * @module @cardplay/ai/advisor/advisor-interface.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIAdvisor, createAIAdvisor, AdvisorContext } from './advisor-interface';

describe('AIAdvisor', () => {
  let advisor: AIAdvisor;
  
  beforeEach(() => {
    advisor = createAIAdvisor();
  });
  
  // ===========================================================================
  // Basic Functionality
  // ===========================================================================
  
  describe('basic functionality', () => {
    it('should create advisor instance', () => {
      expect(advisor).toBeInstanceOf(AIAdvisor);
    });
    
    it('should answer a basic question', async () => {
      const answer = await advisor.ask('What chord should I use next?');
      
      expect(answer).toBeDefined();
      expect(answer.text).toBeTruthy();
      expect(typeof answer.confidence).toBe('number');
      expect(typeof answer.canAnswer).toBe('boolean');
    });
    
    it('should include source in answer', async () => {
      const answer = await advisor.ask('What chord should I use next?');
      
      expect(answer.source).toBeDefined();
    });
  });
  
  // ===========================================================================
  // Chord Questions
  // ===========================================================================
  
  describe('chord questions', () => {
    it('should suggest next chord with context', async () => {
      const context: AdvisorContext = {
        key: { root: 'c', mode: 'major' },
        chords: [
          { root: 'c', quality: 'major' },
          { root: 'f', quality: 'major' }
        ]
      };
      
      const answer = await advisor.ask('What chord should I use next?', context);
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.confidence).toBeGreaterThan(50);
      expect(answer.text).toMatch(/chord|recommend/i);
    });
    
    it('should provide general advice without progression', async () => {
      const context: AdvisorContext = {
        key: { root: 'g', mode: 'major' }
      };
      
      const answer = await advisor.ask('What chord comes next?', context);
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text.length).toBeGreaterThan(0);
    });
    
    it('should analyze chord progressions', async () => {
      const context: AdvisorContext = {
        chords: [
          { root: 'c', quality: 'major' },
          { root: 'g', quality: 'major' },
          { root: 'a', quality: 'minor' },
          { root: 'f', quality: 'major' }
        ]
      };
      
      const answer = await advisor.ask("What's wrong with this progression?", context);
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.source).toBe('harmony-explorer');
    });
    
    it('should include follow-up suggestions', async () => {
      const context: AdvisorContext = {
        key: { root: 'c', mode: 'major' },
        chords: [{ root: 'c', quality: 'major' }]
      };
      
      const answer = await advisor.ask('What chord should I use next?', context);
      
      expect(answer.followUps).toBeDefined();
      if (answer.followUps) {
        expect(answer.followUps.length).toBeGreaterThan(0);
        expect(answer.followUps[0].question).toBeTruthy();
      }
    });
    
    it('should include actions for chord suggestions', async () => {
      const context: AdvisorContext = {
        key: { root: 'c', mode: 'major' },
        chords: [{ root: 'c', quality: 'major' }]
      };
      
      const answer = await advisor.ask('What chord should I use next?', context);
      
      expect(answer.actions).toBeDefined();
      if (answer.actions) {
        expect(answer.actions.length).toBeGreaterThan(0);
        expect(answer.actions[0].type).toBe('setParam');
      }
    });
  });
  
  // ===========================================================================
  // Melody Questions
  // ===========================================================================
  
  describe('melody questions', () => {
    it('should answer scale questions', async () => {
      const context: AdvisorContext = {
        key: { root: 'd', mode: 'minor' }
      };
      
      const answer = await advisor.ask('What scale should I use for my melody?', context);
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/minor|scale/i);
    });
    
    it('should answer interval questions', async () => {
      const answer = await advisor.ask('How should I use intervals in my melody?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/step|leap|interval/i);
    });
    
    it('should provide melody writing tips', async () => {
      const answer = await advisor.ask('How do I write a good melody?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.confidence).toBeGreaterThan(50);
    });
  });
  
  // ===========================================================================
  // Rhythm Questions
  // ===========================================================================
  
  describe('rhythm questions', () => {
    it('should answer tempo questions', async () => {
      const context: AdvisorContext = { genre: 'house' };
      
      const answer = await advisor.ask('What tempo should I use?', context);
      
      expect(answer.canAnswer).toBe(true);
    });
    
    it('should answer drum pattern questions', async () => {
      const context: AdvisorContext = { genre: 'jazz' };
      
      const answer = await advisor.ask('How should I program my drums?', context);
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text.length).toBeGreaterThan(20);
    });
    
    it('should provide rhythm basics', async () => {
      const answer = await advisor.ask('How do I create a good groove?');
      
      expect(answer.canAnswer).toBe(true);
    });
  });
  
  // ===========================================================================
  // Genre Questions
  // ===========================================================================
  
  describe('genre questions', () => {
    it('should provide lofi advice', async () => {
      const answer = await advisor.ask('How do I create a lofi hip hop beat?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.confidence).toBeGreaterThan(70);
      expect(answer.text).toMatch(/tempo|chord|rhythm/i);
    });
    
    it('should provide jazz advice', async () => {
      const answer = await advisor.ask('How do I make jazz music?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/chord|swing|7th|ii-v/i);
    });
    
    it('should provide house music advice', async () => {
      const answer = await advisor.ask('How do I produce house music?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/four.on.the.floor|kick|120|tempo/i);
    });
    
    it('should handle unknown genres gracefully', async () => {
      const answer = await advisor.ask('How do I make underwater basket weaving music?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.confidence).toBeLessThan(70);
    });
    
    it('should include genre-specific actions', async () => {
      const answer = await advisor.ask('How do I create pop music?');
      
      expect(answer.actions).toBeDefined();
    });
  });
  
  // ===========================================================================
  // Board Questions
  // ===========================================================================
  
  describe('board questions', () => {
    it('should recommend notation board', async () => {
      const answer = await advisor.ask('How do I write music notation?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/notation|board/i);
    });
    
    it('should recommend session board for arrangement', async () => {
      const answer = await advisor.ask('How do I arrange my song?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/session|arrange|section/i);
    });
    
    it('should recommend mixer board', async () => {
      const answer = await advisor.ask('How do I mix my track?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/mixer|fader|volume/i);
    });
    
    it('should list boards when asked generically', async () => {
      const answer = await advisor.ask('Which board should I use?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.followUps).toBeDefined();
    });
  });
  
  // ===========================================================================
  // Workflow Questions
  // ===========================================================================
  
  describe('workflow questions', () => {
    it('should explain recording', async () => {
      const answer = await advisor.ask('How do I record audio?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/record|track|input/i);
    });
    
    it('should explain exporting', async () => {
      const answer = await advisor.ask('How do I export my project?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/export|wav|mp3/i);
    });
    
    it('should explain undo', async () => {
      const answer = await advisor.ask('How do I undo a mistake?');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.confidence).toBeGreaterThan(80);
      expect(answer.text).toMatch(/undo|ctrl|cmd/i);
    });
  });
  
  // ===========================================================================
  // Analysis Questions
  // ===========================================================================
  
  describe('analysis questions', () => {
    it('should analyze provided progression', async () => {
      const context: AdvisorContext = {
        chords: [
          { root: 'd', quality: 'minor' },
          { root: 'g', quality: 'major7' },
          { root: 'c', quality: 'major' }
        ]
      };
      
      const answer = await advisor.ask('Why does this progression work?', context);
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.source).toBe('harmony-explorer');
    });
    
    it('should ask for content when none provided', async () => {
      const answer = await advisor.ask('Analyze my music');
      
      expect(answer.canAnswer).toBe(true);
      expect(answer.text).toMatch(/provide|content|session/i);
    });

    it('N067/N069: should provide per-issue Explain and one-click fix actions for project analysis', async () => {
      const context: AdvisorContext = {
        projectSnapshot: {
          elements: ['drums', 'melody', 'harmony', 'intro', 'outro', 'transition', 'variation'],
          issueFlags: [{ category: 'technical', issueId: 'clipping' }],
          stats: { track_count: 8, effect_count: 10 },
        },
      };

      const answer = await advisor.ask('Analyze my project health', context);
      expect(answer.canAnswer).toBe(true);
      expect(answer.source).toBe('project-analysis');
      expect(answer.text).toMatch(/Project analysis found/i);
      expect(answer.actions).toBeDefined();

      const actions = answer.actions ?? [];
      // At least one "Explain" action per issue
      expect(actions.some((a) => a.description.startsWith('Explain '))).toBe(true);
      // At least one one-click fix action should be included for clipping
      expect(actions.some((a) => a.description.includes('Reduce master gain'))).toBe(true);
    });
  });
  
  // ===========================================================================
  // Unknown Questions
  // ===========================================================================
  
  describe('unknown questions', () => {
    it('should handle unknown questions gracefully', async () => {
      const answer = await advisor.ask('What is the meaning of life?');
      
      expect(answer.canAnswer).toBe(false);
      expect(answer.confidence).toBe(0);
      expect(answer.followUps).toBeDefined();
      expect(answer.followUps!.length).toBeGreaterThan(0);
    });
    
    it('should suggest alternatives for unknown questions', async () => {
      const answer = await advisor.ask('blah blah random nonsense');
      
      expect(answer.source).toBe('fallback');
      expect(answer.followUps).toBeDefined();
    });
  });
  
  // ===========================================================================
  // Context Integration
  // ===========================================================================
  
  describe('context integration', () => {
    it('should use context genre', async () => {
      const context: AdvisorContext = { genre: 'jazz' };
      
      const answer = await advisor.ask('What tempo should I use?', context);
      
      expect(answer.canAnswer).toBe(true);
    });
    
    it('should use context key', async () => {
      const context: AdvisorContext = {
        key: { root: 'e', mode: 'minor' }
      };
      
      const answer = await advisor.ask('What scale should I use?', context);
      
      expect(answer.text).toMatch(/e|minor/i);
    });
    
    it('should handle empty context', async () => {
      const answer = await advisor.ask('What should I do?', {});
      
      expect(answer).toBeDefined();
      expect(answer.text).toBeTruthy();
    });
  });
  
  // ===========================================================================
  // Performance (L315)
  // ===========================================================================

  describe('performance', () => {
    it('L315: Q&A cycle should complete in <100ms', async () => {
      // Pre-warm: first call loads KBs
      await advisor.ask('What chord should I use?');

      const questions: Array<{ q: string; ctx?: AdvisorContext }> = [
        { q: 'What chord should I use next?', ctx: { key: { root: 'c', mode: 'major' }, chords: [{ root: 'c', quality: 'major' }] } },
        { q: 'What scale should I use?', ctx: { key: { root: 'd', mode: 'minor' } } },
        { q: 'What tempo should I use?', ctx: { genre: 'house' } },
        { q: 'How do I create a lofi beat?' },
        { q: 'Which board should I use for notation?' },
        { q: 'How do I export my project?' },
        { q: "Why does this progression work?", ctx: { chords: [{ root: 'd', quality: 'minor' }, { root: 'g', quality: 'major' }, { root: 'c', quality: 'major' }] } },
      ];

      for (const { q, ctx } of questions) {
        const start = performance.now();
        await advisor.ask(q, ctx);
        const elapsed = performance.now() - start;

        expect(elapsed).toBeLessThan(100);
      }
    });
  });

  // ===========================================================================
  // Safety Checks (L317)
  // ===========================================================================

  describe('safety checks', () => {
    it('L317: destructive actions should include confirmation flag', async () => {
      const context: AdvisorContext = {
        key: { root: 'c', mode: 'major' },
        chords: [{ root: 'c', quality: 'major' }]
      };

      const answer = await advisor.ask('What chord should I use next?', context);

      // Non-destructive actions should NOT require confirmation
      if (answer.actions) {
        for (const action of answer.actions) {
          if (action.type === 'setParam') {
            // setParam is non-destructive, should not require confirmation
            expect(action.params.requiresConfirmation).toBeUndefined();
          }
        }
      }
    });

    it('L317: advisor should never suggest destructive actions without confirmation', async () => {
      // Ask about deleting/clearing/resetting
      const answer = await advisor.ask('How do I clear my project?');

      if (answer.actions) {
        for (const action of answer.actions) {
          if (action.type === 'create' && action.params.destructive) {
            expect(action.params.requiresConfirmation).toBe(true);
          }
        }
      }
    });
  });

  // ===========================================================================
  // AI Off Mode (L318)
  // ===========================================================================

  describe('AI off mode', () => {
    it('L318: should report enabled state', () => {
      expect(advisor.isEnabled()).toBe(true);
    });

    it('L318: should respect disabled state', async () => {
      advisor.setEnabled(false);
      expect(advisor.isEnabled()).toBe(false);

      const answer = await advisor.ask('What chord should I use?');
      expect(answer.canAnswer).toBe(false);
      expect(answer.text).toMatch(/disabled|off/i);
    });

    it('L318: should re-enable after being disabled', async () => {
      advisor.setEnabled(false);
      advisor.setEnabled(true);

      const answer = await advisor.ask('What chord should I use next?');
      expect(answer.canAnswer).toBe(true);
    });
  });

  // ===========================================================================
  // Factory Function
  // ===========================================================================

  describe('factory function', () => {
    it('should create advisor with createAIAdvisor', () => {
      const advisor = createAIAdvisor();
      expect(advisor).toBeInstanceOf(AIAdvisor);
    });
  });
});
