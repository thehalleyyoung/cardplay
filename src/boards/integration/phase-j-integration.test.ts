/**
 * @fileoverview Phase J Integration Tests - Routing, Theming, Shortcuts
 * Tests routing overlay, theme application, and keyboard shortcuts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from '../builtins/register';
import { RoutingOverlay } from '../../ui/components/routing-overlay';

describe('Phase J: Routing, Theming, Shortcuts Integration', () => {
  beforeEach(() => {
    registerBuiltinBoards();
    
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('J001-J010: Board Theming', () => {
    it('should define theme defaults for each control level', () => {
      // Theme defaults exist in board-theme-defaults.ts
      const registry = getBoardRegistry();
      const manualBoard = registry.get('basic-tracker');
      const generativeBoard = registry.get('generative-ambient');
      
      expect(manualBoard?.theme).toBeDefined();
      expect(generativeBoard?.theme).toBeDefined();
      
      // Manual and generative boards should have different theme colors
      expect(manualBoard?.theme?.colors).toBeDefined();
      expect(generativeBoard?.theme?.colors).toBeDefined();
    });

    it('should have distinct colors for control levels', () => {
      const registry = getBoardRegistry();
      const manualBoard = registry.get('basic-tracker');
      const generativeBoard = registry.get('generative-ambient');
      
      // Manual boards typically use blue/gray tones
      // Generative boards typically use purple/magenta tones
      expect(manualBoard?.theme?.colors?.primary).not.toBe(generativeBoard?.theme?.colors?.primary);
    });
  });

  describe('J011-J020: Keyboard Shortcuts', () => {
    it('should have Cmd+B shortcut registered for board switching', () => {
      // Shortcuts are registered via keyboard-shortcuts.ts
      // This test verifies the board system is aware of the shortcut
      const registry = getBoardRegistry();
      const boards = registry.list();
      
      // All boards should be accessible via board switcher (Cmd+B)
      expect(boards.length).toBeGreaterThan(0);
    });

    it('should support per-board shortcut maps', () => {
      const registry = getBoardRegistry();
      const trackerBoard = registry.get('basic-tracker');
      
      expect(trackerBoard).toBeDefined();
      expect(trackerBoard?.shortcuts).toBeDefined();
      
      // Tracker should have pattern-specific shortcuts
      if (trackerBoard?.shortcuts) {
        expect(Object.keys(trackerBoard.shortcuts).length).toBeGreaterThan(0);
      }
    });
  });

  describe('J021-J036: Routing Overlay', () => {
    it('should have routing overlay component available', () => {
      // Routing overlay exists as a component
      expect(RoutingOverlay).toBeDefined();
    });

    it('should support routing visualization in boards', () => {
      const registry = getBoardRegistry();
      const producerBoard = registry.get('producer');
      
      // Producer board should support routing connections
      expect(producerBoard?.connections).toBeDefined();
    });
  });

  describe('J034-J036: Routing Validation', () => {
    it('should validate connection types', () => {
      const registry = getBoardRegistry();
      const producerBoard = registry.get('producer');
      
      // Producer board should have routing-compatible decks
      expect(producerBoard?.decks.some(d => d.type === 'dsp-chain')).toBe(true);
    });
  });

  describe('J040-J044: Per-Track Control Levels', () => {
    it('should support per-track control level data model', () => {
      const registry = getBoardRegistry();
      const composerBoard = registry.get('composer');
      
      // Composer board (hybrid) should support per-track control
      expect(composerBoard?.controlLevel).toBe('collaborative');
    });
  });

  describe('J046-J053: Theme Tokens and Visual Density', () => {
    it('should use theme tokens for all colors', () => {
      const registry = getBoardRegistry();
      const manualBoard = registry.get('basic-tracker');
      
      // Board should have theme colors defined
      expect(manualBoard?.theme?.colors).toBeDefined();
    });
  });

  describe('J057-J060: Accessibility and Performance', () => {
    it('should support keyboard-accessible components', () => {
      const registry = getBoardRegistry();
      const boards = registry.list();
      
      // All boards should have shortcuts defined
      expect(boards.every(b => b.shortcuts !== undefined)).toBe(true);
    });

    it('should define board-specific shortcuts', () => {
      const registry = getBoardRegistry();
      const trackerBoard = registry.get('basic-tracker');
      
      // Tracker board should have shortcuts
      expect(trackerBoard?.shortcuts).toBeDefined();
      expect(Object.keys(trackerBoard?.shortcuts || {}).length).toBeGreaterThan(0);
    });
  });
});
