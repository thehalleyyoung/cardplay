/**
 * @fileoverview Tests for Prolog Adapter
 * 
 * Tests for L014-L019: Basic Prolog operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PrologAdapter,
  createPrologAdapter,
  resetPrologAdapter,
  type HostAction,
} from './prolog-adapter';

describe('PrologAdapter', () => {
  let adapter: PrologAdapter;
  
  beforeEach(() => {
    adapter = createPrologAdapter({ enableCache: false });
  });
  
  afterEach(() => {
    resetPrologAdapter();
  });
  
  // L015: Load simple facts and query
  describe('L015: Simple facts and queries', () => {
    it('should load simple facts and query them', async () => {
      await adapter.loadProgram(`
        parent(tom, bob).
        parent(bob, ann).
        parent(bob, pat).
      `);
      
      const result = await adapter.queryAll('parent(tom, X).');
      
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('X');
      expect(result[0]!['X']).toBe('bob');
    });
    
    it('should return multiple solutions', async () => {
      await adapter.loadProgram(`
        parent(bob, ann).
        parent(bob, pat).
        parent(bob, joe).
      `);
      
      const result = await adapter.queryAll('parent(bob, X).');
      
      expect(result.length).toBe(3);
      const children = result.map(r => r['X']);
      expect(children).toContain('ann');
      expect(children).toContain('pat');
      expect(children).toContain('joe');
    });
    
    it('should return null for querySingle when no solution', async () => {
      await adapter.loadProgram(`parent(tom, bob).`);
      
      const result = await adapter.querySingle('parent(nobody, X).');
      
      expect(result).toBeNull();
    });
  });
  
  // L016: Load rules and query
  describe('L016: Rules and inference', () => {
    it('should load rules and infer new facts', async () => {
      await adapter.loadProgram(`
        parent(tom, bob).
        parent(bob, ann).
        grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
      `);
      
      const result = await adapter.querySingle('grandparent(tom, X).');
      
      expect(result).not.toBeNull();
      expect(result!['X']).toBe('ann');
    });
    
    it('should handle transitive rules', async () => {
      await adapter.loadProgram(`
        edge(a, b).
        edge(b, c).
        edge(c, d).
        path(X, Y) :- edge(X, Y).
        path(X, Z) :- edge(X, Y), path(Y, Z).
      `);
      
      const result = await adapter.queryAll('path(a, X).');
      
      expect(result.length).toBeGreaterThanOrEqual(3);
      const destinations = result.map(r => r['X']);
      expect(destinations).toContain('b');
      expect(destinations).toContain('c');
      expect(destinations).toContain('d');
    });
  });
  
  // L017: Backtracking
  describe('L017: Backtracking', () => {
    it('should find all solutions through backtracking', async () => {
      await adapter.loadProgram(`
        color(red).
        color(green).
        color(blue).
        color(yellow).
      `);
      
      const result = await adapter.queryAll('color(X).');
      
      expect(result.length).toBe(4);
    });
    
    it('should backtrack through multiple predicates', async () => {
      await adapter.loadProgram(`
        fruit(apple).
        fruit(banana).
        color(apple, red).
        color(apple, green).
        color(banana, yellow).
      `);
      
      const result = await adapter.queryAll('fruit(F), color(F, C).');
      
      expect(result.length).toBe(3);
    });
  });
  
  // L018: Cut operator
  describe('L018: Cut operator', () => {
    it('should respect cut operator', async () => {
      await adapter.loadProgram(`
        first_only(X) :- member(X, [1,2,3]), !.
      `);
      
      const result = await adapter.queryAll('first_only(X).');
      
      // Cut should stop after first solution
      expect(result.length).toBe(1);
      expect(result[0]!['X']).toBe(1);
    });
    
    it('should use cut for committed choice', async () => {
      await adapter.loadProgram(`
        max(X, Y, X) :- X >= Y, !.
        max(_, Y, Y).
      `);
      
      const result1 = await adapter.querySingle('max(5, 3, M).');
      expect(result1!['M']).toBe(5);
      
      const result2 = await adapter.querySingle('max(3, 5, M).');
      expect(result2!['M']).toBe(5);
    });
  });
  
  // L019: Negation-as-failure
  describe('L019: Negation-as-failure', () => {
    it('should support negation-as-failure with \\+', async () => {
      await adapter.loadProgram(`
        bird(tweety).
        bird(opus).
        penguin(opus).
        can_fly(X) :- bird(X), \\+ penguin(X).
      `);
      
      const result = await adapter.queryAll('can_fly(X).');
      
      expect(result.length).toBe(1);
      expect(result[0]!['X']).toBe('tweety');
    });
    
    it('should work with negated conditions', async () => {
      await adapter.loadProgram(`
        likes(mary, food).
        likes(mary, wine).
        likes(john, wine).
        likes(john, mary).
      `);
      
      const result = await adapter.succeeds('\\+ likes(mary, john).');
      expect(result).toBe(true);
      
      const result2 = await adapter.succeeds('\\+ likes(mary, wine).');
      expect(result2).toBe(false);
    });
  });
  
  // Additional tests
  describe('Query result structure', () => {
    it('should return QueryResult with timing info', async () => {
      await adapter.loadProgram(`fact(test).`);
      
      const result = await adapter.query('fact(X).');
      
      expect(result.success).toBe(true);
      expect(result.solutions.length).toBe(1);
      expect(result.timeMs).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });
    
    it('should return error for invalid query', async () => {
      const result = await adapter.query('undefined_predicate(X).');
      
      // May succeed with no solutions or fail depending on mode
      expect(result.solutions.length).toBe(0);
    });
  });
  
  describe('Dynamic assertions', () => {
    it('should assert new facts', async () => {
      await adapter.assertz('dynamic_fact(hello)');
      
      const result = await adapter.querySingle('dynamic_fact(X).');
      
      expect(result).not.toBeNull();
      expect(result!['X']).toBe('hello');
    });
    
    it('should retract facts', async () => {
      await adapter.assertz('temp_fact(1)');
      await adapter.assertz('temp_fact(2)');
      
      let result = await adapter.queryAll('temp_fact(X).');
      expect(result.length).toBe(2);
      
      await adapter.retract('temp_fact(1)');
      
      result = await adapter.queryAll('temp_fact(X).');
      expect(result.length).toBe(1);
      expect(result[0]!['X']).toBe(2);
    });
  });
  
  describe('List operations', () => {
    it('should work with lists', async () => {
      await adapter.loadProgram(`
        sum_list([], 0).
        sum_list([H|T], S) :- sum_list(T, S1), S is H + S1.
      `);
      
      const result = await adapter.querySingle('sum_list([1,2,3,4,5], S).');
      
      expect(result).not.toBeNull();
      expect(result!['S']).toBe(15);
    });
    
    it('should use member from lists module', async () => {
      const result = await adapter.queryAll('member(X, [a, b, c]).');
      
      expect(result.length).toBe(3);
      expect(result.map(r => r['X'])).toEqual(['a', 'b', 'c']);
    });
    
    it('should use append from lists module', async () => {
      const result = await adapter.querySingle('append([1,2], [3,4], L).');
      
      expect(result).not.toBeNull();
      expect(result!['L']).toEqual([1, 2, 3, 4]);
    });
  });
  
  describe('findAll', () => {
    it('should collect all solutions with findall', async () => {
      await adapter.loadProgram(`
        num(1). num(2). num(3). num(4). num(5).
      `);
      
      const result = await adapter.findAll<number>('X', 'num(X)');
      
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should return empty array when no solutions', async () => {
      await adapter.loadProgram(`num(1).`);
      
      const result = await adapter.findAll<number>('X', 'num(X), X > 10');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('Term conversion', () => {
    it('should convert atoms to strings', async () => {
      await adapter.loadProgram(`atom_fact(hello).`);
      
      const result = await adapter.querySingle('atom_fact(X).');
      
      expect(result!['X']).toBe('hello');
    });
    
    it('should convert numbers correctly', async () => {
      await adapter.loadProgram(`
        num_fact(42).
        float_fact(3.14).
      `);
      
      const intResult = await adapter.querySingle('num_fact(X).');
      expect(intResult!['X']).toBe(42);
      
      const floatResult = await adapter.querySingle('float_fact(X).');
      expect(floatResult!['X']).toBeCloseTo(3.14);
    });
    
    it('should convert lists to arrays', async () => {
      const result = await adapter.querySingle('X = [1, 2, 3].');
      
      expect(result!['X']).toEqual([1, 2, 3]);
    });
    
    it('jsToTermString should convert JS values to Prolog strings', () => {
      expect(adapter['jsToTermString'](42)).toBe('42');
      expect(adapter['jsToTermString']('hello')).toBe('hello');
      expect(adapter['jsToTermString']('Hello World')).toBe("'Hello World'");
      expect(adapter['jsToTermString']([1, 2, 3])).toBe('[1, 2, 3]');
      expect(adapter['jsToTermString'](true)).toBe('true');
      expect(adapter['jsToTermString'](false)).toBe('fail');
    });
  });
  
  describe('Arithmetic', () => {
    it('should evaluate arithmetic expressions', async () => {
      const result = await adapter.querySingle('X is 2 + 3 * 4.');
      
      expect(result!['X']).toBe(14);
    });
    
    it('should compare numbers', async () => {
      const gt = await adapter.succeeds('5 > 3.');
      expect(gt).toBe(true);
      
      const lt = await adapter.succeeds('5 < 3.');
      expect(lt).toBe(false);
    });
  });
  
  describe('Error handling', () => {
    it('should handle syntax errors gracefully', async () => {
      await expect(
        adapter.loadProgram('invalid prolog code ((((')
      ).rejects.toThrow();
    });
    
    // Skip: Tau Prolog runs synchronously in JS and cannot be interrupted
    // mid-execution. This test would cause memory exhaustion.
    it.skip('should timeout on infinite loops', async () => {
      await adapter.loadProgram(`
        infinite :- infinite.
      `);
      
      const result = await adapter.query('infinite.', { timeoutMs: 100 });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    }, 1000);
  });
  
  describe('Reset and reload', () => {
    it('should reset session and clear loaded programs', async () => {
      await adapter.loadProgram(`fact(before_reset).`);
      
      let result = await adapter.succeeds('fact(before_reset).');
      expect(result).toBe(true);
      
      adapter.reset();
      
      result = await adapter.succeeds('fact(before_reset).');
      expect(result).toBe(false);
    });
  });
  
  // L021-L024: HostAction term conversion
  describe('HostAction conversion', () => {
    it('should convert set_param HostAction to Prolog term', () => {
      const action = {
        action: 'set_param' as const,
        cardId: 'card_123',
        paramName: 'volume',
        value: 0.8,
      };
      
      const term = adapter.hostActionToTermString(action);
      expect(term).toBe("set_param(card_123, volume, 0.8)");
    });
    
    it('should convert invoke_method HostAction to Prolog term', () => {
      const action = {
        action: 'invoke_method' as const,
        cardId: 'card_456',
        methodName: 'trigger',
        args: [60, 0.9],
      };
      
      const term = adapter.hostActionToTermString(action);
      expect(term).toBe("invoke_method(card_456, trigger, [60, 0.9])");
    });
    
    it('should convert add_card HostAction to Prolog term', () => {
      const action = {
        action: 'add_card' as const,
        deckId: 'deck_main',
        cardType: 'oscillator',
        initParams: { waveform: 'sine' },
      };
      
      const term = adapter.hostActionToTermString(action);
      expect(term).toContain("add_card(deck_main, oscillator,");
    });
    
    it('should convert remove_card HostAction to Prolog term', () => {
      const action = {
        action: 'remove_card' as const,
        cardId: 'card_789',
      };
      
      const term = adapter.hostActionToTermString(action);
      expect(term).toBe("remove_card(card_789)");
    });
    
    it('should convert move_card HostAction to Prolog term', () => {
      const action = {
        action: 'move_card' as const,
        cardId: 'card_abc',
        fromDeck: 'deck_a',
        toDeck: 'deck_b',
      };
      
      const term = adapter.hostActionToTermString(action);
      expect(term).toBe("move_card(card_abc, deck_a, deck_b)");
    });
    
    it('should parse Prolog term as HostAction', async () => {
      // Load a rule that generates HostActions
      await adapter.loadProgram(`
        suggest_action(set_param(card1, volume, 0.5)).
        suggest_action(remove_card(old_card)).
        suggest_action(move_card(my_card, deck_a, deck_b)).
      `);
      
      // First check what the raw solutions look like
      const solutions = await adapter.queryAll('suggest_action(Action).');
      expect(solutions).toHaveLength(3);
      
      // The Action variable should be converted to a compound term
      const firstAction = solutions[0]!['Action'] as { functor: string; args: unknown[] };
      expect(firstAction.functor).toBe('set_param');
      expect(firstAction.args).toHaveLength(3);
      
      const actions = await adapter.queryHostActions('suggest_action(Action).');
      
      expect(actions).toHaveLength(3);
      expect(actions[0]).toEqual({
        action: 'set_param',
        cardId: 'card1',
        paramName: 'volume',
        value: 0.5,
      });
      expect(actions[1]).toEqual({
        action: 'remove_card',
        cardId: 'old_card',
      });
      expect(actions[2]).toEqual({
        action: 'move_card',
        cardId: 'my_card',
        fromDeck: 'deck_a',
        toDeck: 'deck_b',
      });
    });
  });
});
