/**
 * @fileoverview Keyboard Shortcuts - Unified keyboard handling for CardPlay.
 * 
 * Provides:
 * - Global keyboard shortcut registry
 * - Undo/redo bindings (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
 * - Transport controls (Space, Enter)
 * - Navigation shortcuts
 * - Configurable key bindings
 * 
 * @module @cardplay/ui/keyboard-shortcuts
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase G.4
 */

import { getUndoStack } from '../state';
import { getTransport } from '../audio/transport';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Keyboard shortcut definition.
 */
export interface KeyboardShortcut {
  readonly id: string;
  readonly key: string;
  readonly modifiers: {
    readonly ctrl?: boolean;
    readonly shift?: boolean;
    readonly alt?: boolean;
    readonly meta?: boolean;
  };
  readonly description: string;
  readonly category: ShortcutCategory;
  readonly action: () => void;
  readonly enabled?: () => boolean;
}

/**
 * Shortcut categories.
 */
export type ShortcutCategory =
  | 'edit'
  | 'transport'
  | 'navigation'
  | 'selection'
  | 'view'
  | 'file'
  | 'custom';

/**
 * Key event data.
 */
export interface KeyEventData {
  readonly key: string;
  readonly code: string;
  readonly ctrl: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
}

/**
 * Shortcut handler callback.
 */
export type ShortcutHandler = () => void;

// ============================================================================
// KEYBOARD SHORTCUT MANAGER
// ============================================================================

/**
 * KeyboardShortcutManager handles global keyboard shortcuts.
 */
export class KeyboardShortcutManager {
  private static instance: KeyboardShortcutManager;

  private shortcuts = new Map<string, KeyboardShortcut>();
  private enabled = true;
  private paused = false;
  private boundHandler: ((e: KeyboardEvent) => void) | null = null;

  private constructor() {
    this.registerBuiltinShortcuts();
  }

  static getInstance(): KeyboardShortcutManager {
    if (!KeyboardShortcutManager.instance) {
      KeyboardShortcutManager.instance = new KeyboardShortcutManager();
    }
    return KeyboardShortcutManager.instance;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Starts listening for keyboard events.
   */
  start(): void {
    if (this.boundHandler) return;

    this.boundHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    document.addEventListener('keydown', this.boundHandler);
  }

  /**
   * Stops listening for keyboard events.
   */
  stop(): void {
    if (this.boundHandler) {
      document.removeEventListener('keydown', this.boundHandler);
      this.boundHandler = null;
    }
  }

  /**
   * Pauses shortcut handling (e.g., when in text input).
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resumes shortcut handling.
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Sets enabled state.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // ==========================================================================
  // SHORTCUT REGISTRATION
  // ==========================================================================

  /**
   * Registers a keyboard shortcut.
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.makeKey(shortcut.key, shortcut.modifiers);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregisters a shortcut.
   */
  unregister(id: string): void {
    for (const [key, shortcut] of this.shortcuts) {
      if (shortcut.id === id) {
        this.shortcuts.delete(key);
        break;
      }
    }
  }

  /**
   * Gets all registered shortcuts.
   */
  getShortcuts(): readonly KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Gets shortcuts by category.
   */
  getShortcutsByCategory(category: ShortcutCategory): readonly KeyboardShortcut[] {
    return this.getShortcuts().filter(s => s.category === category);
  }

  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled || this.paused) return;

    // Skip if in input element
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow some shortcuts even in inputs
      const key = this.makeKey(event.key, {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      });

      const shortcut = this.shortcuts.get(key);
      if (shortcut && (shortcut.id === 'undo' || shortcut.id === 'redo')) {
        // Allow undo/redo in inputs
      } else {
        return;
      }
    }

    const key = this.makeKey(event.key, {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    });

    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      // Check if shortcut is enabled
      if (shortcut.enabled && !shortcut.enabled()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      try {
        shortcut.action();
      } catch (e) {
        console.error(`Shortcut "${shortcut.id}" error:`, e);
      }
    }
  }

  private makeKey(
    key: string,
    modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
  ): string {
    const parts: string[] = [];

    if (modifiers.ctrl) parts.push('ctrl');
    if (modifiers.shift) parts.push('shift');
    if (modifiers.alt) parts.push('alt');
    if (modifiers.meta) parts.push('meta');

    parts.push(key.toLowerCase());

    return parts.join('+');
  }

  // ==========================================================================
  // BUILT-IN SHORTCUTS
  // ==========================================================================

  private registerBuiltinShortcuts(): void {
    // Platform detection
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    const cmdKey = isMac ? 'meta' : 'ctrl';

    // ========== EDIT ==========

    // Undo (Cmd/Ctrl+Z)
    this.register({
      id: 'undo',
      key: 'z',
      modifiers: { [cmdKey]: true },
      description: 'Undo last action',
      category: 'edit',
      action: () => {
        const stack = getUndoStack();
        if (stack.canUndo()) {
          stack.undo();
        }
      },
      enabled: () => getUndoStack().canUndo(),
    });

    // Redo (Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y)
    this.register({
      id: 'redo',
      key: 'z',
      modifiers: { [cmdKey]: true, shift: true },
      description: 'Redo last undone action',
      category: 'edit',
      action: () => {
        const stack = getUndoStack();
        if (stack.canRedo()) {
          stack.redo();
        }
      },
      enabled: () => getUndoStack().canRedo(),
    });

    // Alternative redo (Cmd/Ctrl+Y)
    this.register({
      id: 'redo-alt',
      key: 'y',
      modifiers: { [cmdKey]: true },
      description: 'Redo last undone action',
      category: 'edit',
      action: () => {
        const stack = getUndoStack();
        if (stack.canRedo()) {
          stack.redo();
        }
      },
      enabled: () => getUndoStack().canRedo(),
    });

    // Select all (Cmd/Ctrl+A)
    this.register({
      id: 'select-all',
      key: 'a',
      modifiers: { [cmdKey]: true },
      description: 'Select all',
      category: 'selection',
      action: () => {
        // Dispatch custom event for views to handle
        document.dispatchEvent(new CustomEvent('cardplay:select-all'));
      },
    });

    // Cut (Cmd/Ctrl+X)
    this.register({
      id: 'cut',
      key: 'x',
      modifiers: { [cmdKey]: true },
      description: 'Cut selection',
      category: 'edit',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:cut'));
      },
    });

    // Copy (Cmd/Ctrl+C)
    this.register({
      id: 'copy',
      key: 'c',
      modifiers: { [cmdKey]: true },
      description: 'Copy selection',
      category: 'edit',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:copy'));
      },
    });

    // Paste (Cmd/Ctrl+V)
    this.register({
      id: 'paste',
      key: 'v',
      modifiers: { [cmdKey]: true },
      description: 'Paste',
      category: 'edit',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:paste'));
      },
    });

    // Duplicate (Cmd/Ctrl+D)
    this.register({
      id: 'duplicate',
      key: 'd',
      modifiers: { [cmdKey]: true },
      description: 'Duplicate selection',
      category: 'edit',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:duplicate'));
      },
    });

    // Delete
    this.register({
      id: 'delete',
      key: 'Delete',
      modifiers: {},
      description: 'Delete selection',
      category: 'edit',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:delete'));
      },
    });

    this.register({
      id: 'delete-backspace',
      key: 'Backspace',
      modifiers: {},
      description: 'Delete selection',
      category: 'edit',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:delete'));
      },
    });

    // ========== TRANSPORT ==========

    // Play/Pause (Space)
    this.register({
      id: 'play-pause',
      key: ' ',
      modifiers: {},
      description: 'Play/Pause',
      category: 'transport',
      action: () => {
        getTransport().togglePlayPause();
      },
    });

    // Stop (Enter)
    this.register({
      id: 'stop',
      key: 'Enter',
      modifiers: {},
      description: 'Stop and return to start',
      category: 'transport',
      action: () => {
        getTransport().stop();
      },
    });

    // Record (R)
    this.register({
      id: 'record',
      key: 'r',
      modifiers: {},
      description: 'Start recording',
      category: 'transport',
      action: () => {
        const transport = getTransport();
        if (transport.isRecording()) {
          transport.stop();
        } else {
          transport.record();
        }
      },
    });

    // Toggle loop (L)
    this.register({
      id: 'toggle-loop',
      key: 'l',
      modifiers: {},
      description: 'Toggle loop',
      category: 'transport',
      action: () => {
        getTransport().toggleLoop();
      },
    });

    // Toggle metronome (M)
    this.register({
      id: 'toggle-metronome',
      key: 'm',
      modifiers: {},
      description: 'Toggle metronome',
      category: 'transport',
      action: () => {
        getTransport().toggleMetronome();
      },
    });

    // ========== NAVIGATION ==========

    // Go to start (Home)
    this.register({
      id: 'go-to-start',
      key: 'Home',
      modifiers: {},
      description: 'Go to start',
      category: 'navigation',
      action: () => {
        getTransport().setPosition(0 as any);
      },
    });

    // Go to end (End)
    this.register({
      id: 'go-to-end',
      key: 'End',
      modifiers: {},
      description: 'Go to end',
      category: 'navigation',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:go-to-end'));
      },
    });

    // ========== VIEW ==========

    // Zoom in (Cmd/Ctrl+=)
    this.register({
      id: 'zoom-in',
      key: '=',
      modifiers: { [cmdKey]: true },
      description: 'Zoom in',
      category: 'view',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:zoom-in'));
      },
    });

    // Zoom out (Cmd/Ctrl+-)
    this.register({
      id: 'zoom-out',
      key: '-',
      modifiers: { [cmdKey]: true },
      description: 'Zoom out',
      category: 'view',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:zoom-out'));
      },
    });

    // Zoom to fit (Cmd/Ctrl+0)
    this.register({
      id: 'zoom-fit',
      key: '0',
      modifiers: { [cmdKey]: true },
      description: 'Zoom to fit',
      category: 'view',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:zoom-fit'));
      },
    });

    // Open AI Advisor (Cmd/Ctrl+/) - L308
    this.register({
      id: 'open-ai-advisor',
      key: '/',
      modifiers: { [cmdKey]: true },
      description: 'Open AI Advisor',
      category: 'view',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:open-ai-advisor'));
      },
    });

    // ========== FILE ==========

    // Save (Cmd/Ctrl+S)
    this.register({
      id: 'save',
      key: 's',
      modifiers: { [cmdKey]: true },
      description: 'Save project',
      category: 'file',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:save'));
      },
    });

    // Export (Cmd/Ctrl+Shift+E)
    this.register({
      id: 'export',
      key: 'e',
      modifiers: { [cmdKey]: true, shift: true },
      description: 'Export audio',
      category: 'file',
      action: () => {
        document.dispatchEvent(new CustomEvent('cardplay:export'));
      },
    });
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Gets the display string for a shortcut.
   */
  getShortcutDisplayString(shortcut: KeyboardShortcut): string {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    const parts: string[] = [];

    if (shortcut.modifiers.ctrl) {
      parts.push(isMac ? '⌃' : 'Ctrl');
    }
    if (shortcut.modifiers.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.modifiers.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.modifiers.meta) {
      parts.push(isMac ? '⌘' : 'Win');
    }

    // Format key name
    let keyDisplay = shortcut.key;
    if (shortcut.key === ' ') keyDisplay = 'Space';
    if (shortcut.key === 'Delete') keyDisplay = isMac ? '⌫' : 'Del';
    if (shortcut.key === 'Backspace') keyDisplay = isMac ? '⌫' : 'Backspace';
    if (shortcut.key === 'Enter') keyDisplay = isMac ? '↵' : 'Enter';
    if (shortcut.key.length === 1) keyDisplay = shortcut.key.toUpperCase();

    parts.push(keyDisplay);

    return isMac ? parts.join('') : parts.join('+');
  }

  /**
   * Gets help text for all shortcuts.
   */
  getHelpText(): string {
    const categories: ShortcutCategory[] = ['edit', 'transport', 'navigation', 'selection', 'view', 'file', 'custom'];
    const lines: string[] = ['# Keyboard Shortcuts\n'];

    for (const category of categories) {
      const shortcuts = this.getShortcutsByCategory(category);
      if (shortcuts.length === 0) continue;

      lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`);

      for (const shortcut of shortcuts) {
        const keyStr = this.getShortcutDisplayString(shortcut);
        lines.push(`- **${keyStr}**: ${shortcut.description}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Gets the keyboard shortcut manager singleton.
 */
export function getKeyboardShortcuts(): KeyboardShortcutManager {
  return KeyboardShortcutManager.getInstance();
}

/**
 * Starts keyboard shortcut handling.
 */
export function initializeKeyboardShortcuts(): void {
  getKeyboardShortcuts().start();
}
