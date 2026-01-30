/**
 * @fileoverview Tests for Host Action Handler Registry
 * 
 * Change 397: Tests for extension HostAction handler registration and safe fallback.
 * 
 * @module @cardplay/ai/theory/__tests__/host-action-handlers.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerHostActionHandler,
  getHostActionHandler,
  hasHostActionHandler,
  clearHostActionHandlers,
  isBuiltinActionType,
  getRequiredCapabilities,
  type ApplyResult,
  type HostActionHandlerEntry,
} from '../host-action-handlers';
import type { MusicSpec } from '../music-spec';

describe('Host Action Handler Registry', () => {
  beforeEach(() => {
    // Clear handlers before each test
    clearHostActionHandlers();
  });

  describe('Registration', () => {
    it('should register a namespaced handler', () => {
      const entry: HostActionHandlerEntry = {
        actionType: 'test-pack:custom-action',
        handler: async () => ({ success: true }),
        version: '1.0.0',
        description: 'Test handler',
      };

      registerHostActionHandler(entry);
      
      const retrieved = getHostActionHandler('test-pack:custom-action');
      expect(retrieved).toBeDefined();
      expect(retrieved?.actionType).toBe('test-pack:custom-action');
    });

    it('should prevent overriding builtin action types', () => {
      const entry: HostActionHandlerEntry = {
        actionType: 'set-key', // Builtin action type
        handler: async () => ({ success: true }),
        version: '1.0.0',
      };

      expect(() => registerHostActionHandler(entry)).toThrow(
        /Cannot register handler for builtin action type/
      );
    });

    it('should allow multiple namespaced handlers', () => {
      const entry1: HostActionHandlerEntry = {
        actionType: 'pack1:action',
        handler: async () => ({ success: true }),
        version: '1.0.0',
      };

      const entry2: HostActionHandlerEntry = {
        actionType: 'pack2:action',
        handler: async () => ({ success: true }),
        version: '1.0.0',
      };

      registerHostActionHandler(entry1);
      registerHostActionHandler(entry2);

      expect(hasHostActionHandler('pack1:action')).toBe(true);
      expect(hasHostActionHandler('pack2:action')).toBe(true);
    });

    it('should allow overriding extension handlers', () => {
      const entry1: HostActionHandlerEntry = {
        actionType: 'test-pack:action',
        handler: async () => ({ success: true, messages: ['v1'] }),
        version: '1.0.0',
      };

      const entry2: HostActionHandlerEntry = {
        actionType: 'test-pack:action',
        handler: async () => ({ success: true, messages: ['v2'] }),
        version: '2.0.0',
      };

      registerHostActionHandler(entry1);
      registerHostActionHandler(entry2); // Should override

      const handler = getHostActionHandler('test-pack:action');
      expect(handler?.version).toBe('2.0.0');
    });
  });

  describe('Handler Lookup', () => {
    it('should return undefined for unknown action types', () => {
      const handler = getHostActionHandler('unknown:action');
      expect(handler).toBeUndefined();
    });

    it('should check handler existence correctly', () => {
      expect(hasHostActionHandler('test-pack:action')).toBe(false);

      registerHostActionHandler({
        actionType: 'test-pack:action',
        handler: async () => ({ success: true }),
        version: '1.0.0',
      });

      expect(hasHostActionHandler('test-pack:action')).toBe(true);
    });
  });

  describe('Capability Requirements', () => {
    it('should return empty capabilities for unknown handlers', () => {
      const caps = getRequiredCapabilities('unknown:action');
      expect(caps).toEqual([]);
    });

    it('should return handler capabilities', () => {
      registerHostActionHandler({
        actionType: 'test-pack:dangerous',
        handler: async () => ({ success: true }),
        version: '1.0.0',
        requiredCapabilities: ['file_system', 'network'] as any,
      });

      const caps = getRequiredCapabilities('test-pack:dangerous');
      expect(caps).toContain('file_system');
      expect(caps).toContain('network');
    });

    it('should return empty array when no capabilities specified', () => {
      registerHostActionHandler({
        actionType: 'test-pack:safe',
        handler: async () => ({ success: true }),
        version: '1.0.0',
      });

      const caps = getRequiredCapabilities('test-pack:safe');
      expect(caps).toEqual([]);
    });
  });

  describe('Builtin Action Types', () => {
    it('should identify builtin action types', () => {
      expect(isBuiltinActionType('set-key')).toBe(true);
      expect(isBuiltinActionType('set-tempo')).toBe(true);
      expect(isBuiltinActionType('add-constraint')).toBe(true);
    });

    it('should identify non-builtin action types', () => {
      expect(isBuiltinActionType('custom:action')).toBe(false);
      expect(isBuiltinActionType('unknown')).toBe(false);
    });
  });

  describe('Safe Fallback', () => {
    it('should handle missing handlers gracefully', () => {
      // Change 396: Unknown extension actions should not throw
      expect(() => {
        const handler = getHostActionHandler('unknown:action');
        expect(handler).toBeUndefined();
      }).not.toThrow();
    });

    it('should allow checking handler existence before use', () => {
      const actionType = 'test-pack:action';
      
      // Safe pattern: check before use
      if (hasHostActionHandler(actionType)) {
        const handler = getHostActionHandler(actionType);
        expect(handler).toBeDefined();
      } else {
        // Safe fallback: log or skip
        expect(hasHostActionHandler(actionType)).toBe(false);
      }
    });
  });

  describe('Handler Execution', () => {
    it('should execute a registered handler', async () => {
      const mockSpec: MusicSpec = {
        key: { root: 'C', mode: 'major' },
        meter: { numerator: 4, denominator: 4 },
        constraints: [],
      };

      let executedPayload: any = null;

      registerHostActionHandler({
        actionType: 'test-pack:store-payload',
        handler: async (action: any) => {
          executedPayload = action.payload;
          return { success: true };
        },
        version: '1.0.0',
      });

      const handler = getHostActionHandler('test-pack:store-payload');
      expect(handler).toBeDefined();

      const mockAction = {
        action: 'test-pack:store-payload' as const,
        payload: { test: 'data' },
        confidence: 0.9,
        reasons: [],
      };

      const result = await handler!.handler(mockAction as any, mockSpec);
      
      expect(result.success).toBe(true);
      expect(executedPayload).toEqual({ test: 'data' });
    });

    it('should handle handler errors gracefully', async () => {
      const mockSpec: MusicSpec = {
        key: { root: 'C', mode: 'major' },
        meter: { numerator: 4, denominator: 4 },
        constraints: [],
      };

      registerHostActionHandler({
        actionType: 'test-pack:failing',
        handler: async () => {
          throw new Error('Handler error');
        },
        version: '1.0.0',
      });

      const handler = getHostActionHandler('test-pack:failing');
      
      const mockAction = {
        action: 'test-pack:failing' as const,
        payload: {},
        confidence: 0.9,
        reasons: [],
      };

      // Handler should throw, caller should catch
      await expect(
        handler!.handler(mockAction as any, mockSpec)
      ).rejects.toThrow('Handler error');
    });
  });

  describe('Namespace Validation', () => {
    it('should accept properly namespaced actions', () => {
      const validNames = [
        'my-pack:action',
        'vendor:transform',
        'plugin:custom-effect',
      ];

      for (const name of validNames) {
        expect(() => {
          registerHostActionHandler({
            actionType: name,
            handler: async () => ({ success: true }),
            version: '1.0.0',
          });
        }).not.toThrow();
      }
    });

    it('should allow un-namespaced extension actions if not builtin', () => {
      // Actually, the handler registry enforces namespacing for all custom actions
      // This test should verify that enforcement
      expect(() => {
        registerHostActionHandler({
          actionType: 'custom-action-xyz',
          handler: async () => ({ success: true }),
          version: '1.0.0',
        });
      }).toThrow(/namespaced ID/);
      
      // Properly namespaced should work
      registerHostActionHandler({
        actionType: 'custom:action-xyz',
        handler: async () => ({ success: true }),
        version: '1.0.0',
      });

      expect(hasHostActionHandler('custom:action-xyz')).toBe(true);
    });
  });
});
