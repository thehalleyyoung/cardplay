/**
 * @fileoverview Command Palette Tests
 *
 * M329-M336: Tests for command registry, context-aware suggestions,
 * recently-used tracking, fuzzy search, and undo support.
 *
 * @module @cardplay/ui/components/command-palette.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerCommand,
  unregisterCommand,
  getAllCommands,
  clearCommands,
  getContextAwareCommands,
  recordRecentCommand,
  getRecentCommandIds,
  getRecentCommands,
  pushUndoEntry,
  undoLastCommand,
  getUndoStack,
  type Command,
  type CommandContext,
} from './command-palette';

/** Helper to create a test command. */
function makeCommand(id: string, opts?: Partial<Command>): Command {
  return {
    id,
    label: opts?.label ?? `Command ${id}`,
    category: opts?.category,
    keywords: opts?.keywords,
    shortcut: opts?.shortcut,
    action: opts?.action ?? (() => {}),
    enabled: opts?.enabled,
    icon: opts?.icon,
  };
}

describe('CommandPalette', () => {
  beforeEach(() => {
    clearCommands();
  });

  // ===========================================================================
  // M329: Command registry
  // ===========================================================================

  describe('command registry (M329)', () => {
    it('registers and retrieves commands', () => {
      registerCommand(makeCommand('cmd1'));
      registerCommand(makeCommand('cmd2'));
      expect(getAllCommands()).toHaveLength(2);
    });

    it('unregisters commands', () => {
      registerCommand(makeCommand('cmd1'));
      unregisterCommand('cmd1');
      expect(getAllCommands()).toHaveLength(0);
    });

    it('clears all commands, recents, and undo', () => {
      registerCommand(makeCommand('cmd1'));
      recordRecentCommand('cmd1');
      pushUndoEntry({
        commandId: 'cmd1',
        label: 'Cmd 1',
        timestamp: new Date().toISOString(),
        undo: () => {},
      });
      clearCommands();
      expect(getAllCommands()).toHaveLength(0);
      expect(getRecentCommandIds()).toHaveLength(0);
      expect(getUndoStack()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // M330: Context-aware suggestions
  // ===========================================================================

  describe('context-aware suggestions (M330)', () => {
    beforeEach(() => {
      registerCommand(makeCommand('mix-volume', { label: 'Adjust mixer volume', category: 'Mixer', keywords: ['mixer', 'volume', 'gain'] }));
      registerCommand(makeCommand('add-note', { label: 'Add note', category: 'Notation', keywords: ['notation', 'note', 'score'] }));
      registerCommand(makeCommand('pattern-double', { label: 'Double pattern length', category: 'Tracker', keywords: ['tracker', 'pattern', 'length'] }));
      registerCommand(makeCommand('general-save', { label: 'Save project', category: 'General', keywords: ['save', 'project'] }));
    });

    it('returns all commands with no context', () => {
      const commands = getContextAwareCommands();
      expect(commands).toHaveLength(4);
    });

    it('ranks mixer commands higher when mixer deck is active', () => {
      const context: CommandContext = { deckTypes: ['mixer-deck'] };
      const commands = getContextAwareCommands(context);
      // Mixer-related command should be first
      expect(commands[0].id).toBe('mix-volume');
    });

    it('ranks notation commands higher when notation board is active', () => {
      const context: CommandContext = { boardType: 'notation', deckTypes: ['notation-deck'] };
      const commands = getContextAwareCommands(context);
      expect(commands[0].id).toBe('add-note');
    });

    it('ranks tracker commands higher for tracker context', () => {
      const context: CommandContext = { deckTypes: ['pattern-deck'] };
      const commands = getContextAwareCommands(context);
      expect(commands[0].id).toBe('pattern-double');
    });

    it('boosts recently used commands', () => {
      recordRecentCommand('general-save');
      const context: CommandContext = {};
      const commands = getContextAwareCommands(context);
      // Recently used gets a bonus
      expect(commands[0].id).toBe('general-save');
    });
  });

  // ===========================================================================
  // M331: Recently-used commands
  // ===========================================================================

  describe('recently-used commands (M331)', () => {
    beforeEach(() => {
      registerCommand(makeCommand('a'));
      registerCommand(makeCommand('b'));
      registerCommand(makeCommand('c'));
    });

    it('records recently used commands', () => {
      recordRecentCommand('a');
      recordRecentCommand('b');
      expect(getRecentCommandIds()).toEqual(['b', 'a']);
    });

    it('moves re-used commands to front', () => {
      recordRecentCommand('a');
      recordRecentCommand('b');
      recordRecentCommand('a'); // Re-use 'a'
      expect(getRecentCommandIds()).toEqual(['a', 'b']);
    });

    it('caps at max recent entries', () => {
      for (let i = 0; i < 25; i++) {
        registerCommand(makeCommand(`cmd${i}`));
        recordRecentCommand(`cmd${i}`);
      }
      expect(getRecentCommandIds().length).toBeLessThanOrEqual(20);
    });

    it('resolves recent IDs to command objects', () => {
      recordRecentCommand('a');
      recordRecentCommand('b');
      const commands = getRecentCommands();
      expect(commands).toHaveLength(2);
      expect(commands[0].id).toBe('b');
    });

    it('filters out unregistered commands from recents', () => {
      recordRecentCommand('a');
      recordRecentCommand('deleted');
      const commands = getRecentCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].id).toBe('a');
    });
  });

  // ===========================================================================
  // M332: Fuzzy search (already existed, verify it works)
  // ===========================================================================

  describe('fuzzy search (M332)', () => {
    it('registers commands with searchable keywords', () => {
      registerCommand(makeCommand('fx-reverb', {
        label: 'Add Reverb Effect',
        keywords: ['reverb', 'effects', 'fx', 'spatial'],
      }));
      const cmd = getAllCommands().find(c => c.id === 'fx-reverb');
      expect(cmd).toBeDefined();
      expect(cmd!.keywords).toContain('reverb');
    });
  });

  // ===========================================================================
  // M333: Undo support
  // ===========================================================================

  describe('undo support (M333)', () => {
    it('pushes undo entries', () => {
      pushUndoEntry({
        commandId: 'cmd1',
        label: 'Do something',
        timestamp: new Date().toISOString(),
        undo: () => {},
      });
      expect(getUndoStack()).toHaveLength(1);
    });

    it('undoes the last command', async () => {
      let undone = false;
      pushUndoEntry({
        commandId: 'cmd1',
        label: 'Do something',
        timestamp: new Date().toISOString(),
        undo: () => { undone = true; },
      });

      const entry = await undoLastCommand();
      expect(entry).not.toBeNull();
      expect(entry!.commandId).toBe('cmd1');
      expect(undone).toBe(true);
      expect(getUndoStack()).toHaveLength(0);
    });

    it('returns null when undo stack is empty', async () => {
      expect(await undoLastCommand()).toBeNull();
    });

    it('undoes in LIFO order', async () => {
      const order: string[] = [];
      pushUndoEntry({
        commandId: 'first',
        label: 'First',
        timestamp: new Date().toISOString(),
        undo: () => { order.push('first'); },
      });
      pushUndoEntry({
        commandId: 'second',
        label: 'Second',
        timestamp: new Date().toISOString(),
        undo: () => { order.push('second'); },
      });

      await undoLastCommand();
      await undoLastCommand();
      expect(order).toEqual(['second', 'first']);
    });

    it('caps undo stack at max entries', () => {
      for (let i = 0; i < 60; i++) {
        pushUndoEntry({
          commandId: `cmd${i}`,
          label: `Command ${i}`,
          timestamp: new Date().toISOString(),
          undo: () => {},
        });
      }
      expect(getUndoStack().length).toBeLessThanOrEqual(50);
    });
  });
});
