/**
 * @fileoverview Keyboard Navigation System
 * 
 * Comprehensive keyboard navigation for CardPlay UI.
 * Bridges Phase 4 keyboard shortcuts with Phase 43 components.
 * 
 * Features:
 * - Card focus management (arrow keys)
 * - Stack navigation (Tab)
 * - Quick actions (shortcuts)
 * - Search/command palette (Cmd+K)
 * - Accessibility landmarks
 * - Focus trapping for modals
 * 
 * Complements: cardplayui.md Section 12 (Accessibility)
 * Used by: card-component.ts, stack-component.ts, reveal-panel.ts
 * 
 * @module @cardplay/ui/keyboard-navigation
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Focusable element types
 */
export type FocusableType = 
  | 'card' 
  | 'stack' 
  | 'connection' 
  | 'port' 
  | 'control' 
  | 'panel' 
  | 'tab' 
  | 'menu-item';

/**
 * Navigation direction
 */
export type NavDirection = 'up' | 'down' | 'left' | 'right' | 'next' | 'prev';

/**
 * Focus target
 */
export interface FocusTarget {
  id: string;
  type: FocusableType;
  element: HTMLElement;
  stackId?: string;
  cardId?: string;
  position: { x: number; y: number };
  bounds: { width: number; height: number };
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  description: string;
  category: ShortcutCategory;
  action: () => void;
  when?: () => boolean;  // Condition for enabling
}

/**
 * Shortcut categories
 */
export type ShortcutCategory = 
  | 'navigation'
  | 'editing'
  | 'transport'
  | 'view'
  | 'file'
  | 'selection'
  | 'tools'
  | 'help';

/**
 * Focus manager options
 */
export interface FocusManagerOptions {
  container: HTMLElement;
  wrapNavigation?: boolean;
  enableSearch?: boolean;
  announceChanges?: boolean;
  persistFocus?: boolean;
}

// ============================================================================
// FOCUS MANAGER
// ============================================================================

/**
 * Manages focus and keyboard navigation across the CardPlay UI
 */
export class FocusManager {
  private container: HTMLElement;
  private options: Required<FocusManagerOptions>;
  
  // Focus state
  private focusTargets: Map<string, FocusTarget> = new Map();
  private currentFocus: FocusTarget | null = null;
  private focusHistory: string[] = [];
  
  // Group tracking
  private stackGroups: Map<string, string[]> = new Map();  // stackId -> cardIds
  
  // Screen reader announcer
  private announcer: HTMLElement | null = null;
  
  constructor(options: FocusManagerOptions) {
    this.container = options.container;
    this.options = {
      wrapNavigation: options.wrapNavigation ?? true,
      enableSearch: options.enableSearch ?? true,
      announceChanges: options.announceChanges ?? true,
      persistFocus: options.persistFocus ?? true,
      container: options.container,
    };
    
    this.setupKeyboardListeners();
    this.setupAnnouncer();
  }
  
  // ===========================================================================
  // REGISTRATION
  // ===========================================================================
  
  /**
   * Register a focusable element
   */
  register(target: FocusTarget): void {
    this.focusTargets.set(target.id, target);
    
    // Track in stack group
    if (target.stackId) {
      const group = this.stackGroups.get(target.stackId) ?? [];
      if (!group.includes(target.id)) {
        group.push(target.id);
        this.stackGroups.set(target.stackId, group);
      }
    }
    
    // Setup element attributes
    target.element.setAttribute('tabindex', '0');
    target.element.setAttribute('data-focusable', 'true');
    target.element.setAttribute('data-focusable-id', target.id);
    target.element.setAttribute('data-focusable-type', target.type);
  }
  
  /**
   * Unregister a focusable element
   */
  unregister(id: string): void {
    const target = this.focusTargets.get(id);
    if (!target) return;
    
    // Remove from stack group
    if (target.stackId) {
      const group = this.stackGroups.get(target.stackId);
      if (group) {
        const index = group.indexOf(id);
        if (index >= 0) group.splice(index, 1);
      }
    }
    
    // Clear if current focus
    if (this.currentFocus?.id === id) {
      this.currentFocus = null;
    }
    
    this.focusTargets.delete(id);
  }
  
  /**
   * Update target position (after layout changes)
   */
  updatePosition(id: string, position: { x: number; y: number }, bounds: { width: number; height: number }): void {
    const target = this.focusTargets.get(id);
    if (target) {
      target.position = position;
      target.bounds = bounds;
    }
  }
  
  // ===========================================================================
  // FOCUS CONTROL
  // ===========================================================================
  
  /**
   * Focus a specific target
   */
  focusTarget(id: string): boolean {
    const target = this.focusTargets.get(id);
    if (!target) return false;
    
    // Update history
    if (this.currentFocus) {
      this.focusHistory.push(this.currentFocus.id);
      if (this.focusHistory.length > 20) {
        this.focusHistory.shift();
      }
    }
    
    // Set focus
    this.currentFocus = target;
    target.element.focus();
    
    // Announce
    if (this.options.announceChanges) {
      this.announce(`${target.type}: ${this.getLabel(target)}`);
    }
    
    // Dispatch event
    this.container.dispatchEvent(new CustomEvent('focus-change', {
      bubbles: true,
      detail: { target }
    }));
    
    return true;
  }
  
  /**
   * Focus previous element in history
   */
  focusPrevious(): boolean {
    const prevId = this.focusHistory.pop();
    if (prevId) {
      return this.focusTarget(prevId);
    }
    return false;
  }
  
  /**
   * Get current focused target
   */
  getCurrentFocus(): FocusTarget | null {
    return this.currentFocus;
  }
  
  /**
   * Clear focus
   */
  clearFocus(): void {
    if (this.currentFocus) {
      this.currentFocus.element.blur();
      this.currentFocus = null;
    }
  }
  
  // ===========================================================================
  // NAVIGATION
  // ===========================================================================
  
  /**
   * Navigate in direction
   */
  navigate(direction: NavDirection): boolean {
    if (!this.currentFocus) {
      // Focus first element
      const first = this.getFirstTarget();
      if (first) return this.focusTarget(first.id);
      return false;
    }
    
    let nextTarget: FocusTarget | null = null;
    
    switch (direction) {
      case 'next':
        nextTarget = this.getNextInSequence();
        break;
      case 'prev':
        nextTarget = this.getPrevInSequence();
        break;
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        nextTarget = this.getSpatialNeighbor(direction);
        break;
    }
    
    if (nextTarget) {
      return this.focusTarget(nextTarget.id);
    } else if (this.options.wrapNavigation) {
      // Wrap around
      const targets = Array.from(this.focusTargets.values());
      if (targets.length > 0) {
        const index = direction === 'next' || direction === 'right' || direction === 'down' 
          ? 0 
          : targets.length - 1;
        const target = targets[index];
        if (target) {
          return this.focusTarget(target.id);
        }
      }
    }
    
    return false;
  }
  
  /**
   * Navigate within stack
   */
  navigateInStack(stackId: string, direction: 'next' | 'prev'): boolean {
    const group = this.stackGroups.get(stackId);
    if (!group || group.length === 0) return false;
    
    const currentId = this.currentFocus?.id;
    const currentIndex = currentId ? group.indexOf(currentId) : -1;
    
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % group.length;
    } else {
      nextIndex = currentIndex < 0 ? group.length - 1 : (currentIndex - 1 + group.length) % group.length;
    }
    
    const targetId = group[nextIndex];
    return targetId ? this.focusTarget(targetId) : false;
  }
  
  /**
   * Navigate to next stack
   */
  navigateToStack(direction: 'next' | 'prev'): boolean {
    const stacks = Array.from(this.stackGroups.keys());
    if (stacks.length === 0) return false;
    
    const currentStackId = this.currentFocus?.stackId;
    const currentIndex = currentStackId ? stacks.indexOf(currentStackId) : -1;
    
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % stacks.length;
    } else {
      nextIndex = currentIndex < 0 ? stacks.length - 1 : (currentIndex - 1 + stacks.length) % stacks.length;
    }
    
    const nextStackId = stacks[nextIndex];
    if (!nextStackId) return false;
    const group = this.stackGroups.get(nextStackId);
    if (group && group.length > 0) {
      const targetId = group[0];
      if (targetId) {
        return this.focusTarget(targetId);
      }
    }
    
    return false;
  }
  
  private getFirstTarget(): FocusTarget | null {
    const targets = Array.from(this.focusTargets.values());
    if (targets.length === 0) return null;
    
    // Sort by position
    targets.sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });
    
    return targets[0] ?? null;
  }
  
  private getNextInSequence(): FocusTarget | null {
    const targets = Array.from(this.focusTargets.values());
    targets.sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });
    
    const currentIndex = targets.findIndex(t => t.id === this.currentFocus?.id);
    if (currentIndex >= 0 && currentIndex < targets.length - 1) {
      return targets[currentIndex + 1] ?? null;
    }
    return null;
  }
  
  private getPrevInSequence(): FocusTarget | null {
    const targets = Array.from(this.focusTargets.values());
    targets.sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });
    
    const currentIndex = targets.findIndex(t => t.id === this.currentFocus?.id);
    if (currentIndex > 0) {
      return targets[currentIndex - 1] ?? null;
    }
    return null;
  }
  
  private getSpatialNeighbor(direction: 'up' | 'down' | 'left' | 'right'): FocusTarget | null {
    if (!this.currentFocus) return null;
    
    const current = this.currentFocus;
    const candidates = Array.from(this.focusTargets.values()).filter(t => t.id !== current.id);
    
    // Filter by direction
    const filtered = candidates.filter(t => {
      switch (direction) {
        case 'up':
          return t.position.y + t.bounds.height < current.position.y + current.bounds.height / 2;
        case 'down':
          return t.position.y > current.position.y + current.bounds.height / 2;
        case 'left':
          return t.position.x + t.bounds.width < current.position.x + current.bounds.width / 2;
        case 'right':
          return t.position.x > current.position.x + current.bounds.width / 2;
      }
    });
    
    if (filtered.length === 0) return null;
    
    // Find closest
    filtered.sort((a, b) => {
      const distA = this.getDistance(current, a);
      const distB = this.getDistance(current, b);
      return distA - distB;
    });
    
    return filtered[0] ?? null;
  }
  
  private getDistance(a: FocusTarget, b: FocusTarget): number {
    const ax = a.position.x + a.bounds.width / 2;
    const ay = a.position.y + a.bounds.height / 2;
    const bx = b.position.x + b.bounds.width / 2;
    const by = b.position.y + b.bounds.height / 2;
    
    return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
  }
  
  private getLabel(target: FocusTarget): string {
    return target.element.getAttribute('aria-label') 
      ?? target.element.textContent?.slice(0, 50) 
      ?? target.id;
  }
  
  // ===========================================================================
  // KEYBOARD HANDLING
  // ===========================================================================
  
  private setupKeyboardListeners(): void {
    this.container.addEventListener('keydown', this.handleKeyDown);
    this.container.addEventListener('focusin', this.handleFocusIn);
  }
  
  private handleKeyDown = (e: KeyboardEvent): void => {
    // Navigation keys
    switch (e.key) {
      case 'ArrowUp':
        if (this.navigate('up')) e.preventDefault();
        break;
      case 'ArrowDown':
        if (this.navigate('down')) e.preventDefault();
        break;
      case 'ArrowLeft':
        if (this.navigate('left')) e.preventDefault();
        break;
      case 'ArrowRight':
        if (this.navigate('right')) e.preventDefault();
        break;
      case 'Tab':
        if (e.shiftKey) {
          if (this.navigateToStack('prev')) e.preventDefault();
        } else {
          if (this.navigateToStack('next')) e.preventDefault();
        }
        break;
      case 'Home':
        if (e.ctrlKey || e.metaKey) {
          const first = this.getFirstTarget();
          if (first) {
            this.focusTarget(first.id);
            e.preventDefault();
          }
        }
        break;
      case 'End':
        if (e.ctrlKey || e.metaKey) {
          const targets = Array.from(this.focusTargets.values());
          const lastTarget = targets[targets.length - 1];
          if (lastTarget) {
            this.focusTarget(lastTarget.id);
            e.preventDefault();
          }
        }
        break;
      case 'Escape':
        this.focusPrevious();
        break;
    }
  };
  
  private handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as HTMLElement;
    const id = target.dataset.focusableId;
    
    if (id && this.focusTargets.has(id)) {
      this.currentFocus = this.focusTargets.get(id)!;
    }
  };
  
  // ===========================================================================
  // SCREEN READER ANNOUNCER
  // ===========================================================================
  
  private setupAnnouncer(): void {
    if (!this.options.announceChanges) return;
    
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    this.container.appendChild(this.announcer);
  }
  
  private announce(message: string): void {
    if (this.announcer) {
      this.announcer.textContent = message;
    }
  }
  
  // ===========================================================================
  // CLEANUP
  // ===========================================================================
  
  dispose(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    this.container.removeEventListener('focusin', this.handleFocusIn);
    this.announcer?.remove();
    this.focusTargets.clear();
    this.stackGroups.clear();
  }
}

// ============================================================================
// SHORTCUT MANAGER
// ============================================================================

/**
 * Manages keyboard shortcuts
 */
export class ShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled: boolean = true;
  
  constructor() {
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Register a shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }
  
  /**
   * Unregister a shortcut
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
   * Enable/disable all shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
  
  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return this.getAllShortcuts().filter(s => s.category === category);
  }
  
  /**
   * Get shortcut display string
   */
  getShortcutDisplayString(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.modifiers.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers.alt) parts.push('Alt');
    if (shortcut.modifiers.shift) parts.push('Shift');
    if (shortcut.modifiers.meta) parts.push('⌘');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join('+');
  }
  
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.modifiers.ctrl) parts.push('ctrl');
    if (shortcut.modifiers.alt) parts.push('alt');
    if (shortcut.modifiers.shift) parts.push('shift');
    if (shortcut.modifiers.meta) parts.push('meta');
    
    parts.push(shortcut.key.toLowerCase());
    
    return parts.join('+');
  }
  
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    
    // Don't capture when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const pressedKey = this.getShortcutKey({
      id: '',
      key: e.key,
      modifiers: {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      },
      description: '',
      category: 'navigation',
      action: () => {},
    });
    
    const shortcut = this.shortcuts.get(pressedKey);
    if (shortcut) {
      // Check condition
      if (shortcut.when && !shortcut.when()) {
        return;
      }
      
      e.preventDefault();
      shortcut.action();
    }
  };
  
  dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  }
}

// ============================================================================
// DEFAULT SHORTCUTS
// ============================================================================

export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action' | 'when'>[] = [
  // Navigation
  { id: 'focus-next', key: 'Tab', modifiers: {}, description: 'Focus next element', category: 'navigation' },
  { id: 'focus-prev', key: 'Tab', modifiers: { shift: true }, description: 'Focus previous element', category: 'navigation' },
  { id: 'focus-up', key: 'ArrowUp', modifiers: {}, description: 'Focus above', category: 'navigation' },
  { id: 'focus-down', key: 'ArrowDown', modifiers: {}, description: 'Focus below', category: 'navigation' },
  { id: 'focus-left', key: 'ArrowLeft', modifiers: {}, description: 'Focus left', category: 'navigation' },
  { id: 'focus-right', key: 'ArrowRight', modifiers: {}, description: 'Focus right', category: 'navigation' },
  
  // Selection
  { id: 'select-all', key: 'a', modifiers: { meta: true }, description: 'Select all cards', category: 'selection' },
  { id: 'deselect', key: 'Escape', modifiers: {}, description: 'Deselect all', category: 'selection' },
  { id: 'select-extend', key: ' ', modifiers: { shift: true }, description: 'Extend selection', category: 'selection' },
  
  // Editing
  { id: 'delete', key: 'Backspace', modifiers: {}, description: 'Delete selected', category: 'editing' },
  { id: 'duplicate', key: 'd', modifiers: { meta: true }, description: 'Duplicate selected', category: 'editing' },
  { id: 'copy', key: 'c', modifiers: { meta: true }, description: 'Copy', category: 'editing' },
  { id: 'paste', key: 'v', modifiers: { meta: true }, description: 'Paste', category: 'editing' },
  { id: 'cut', key: 'x', modifiers: { meta: true }, description: 'Cut', category: 'editing' },
  { id: 'undo', key: 'z', modifiers: { meta: true }, description: 'Undo', category: 'editing' },
  { id: 'redo', key: 'z', modifiers: { meta: true, shift: true }, description: 'Redo', category: 'editing' },
  
  // Transport
  { id: 'play-pause', key: ' ', modifiers: {}, description: 'Play/Pause', category: 'transport' },
  { id: 'stop', key: '.', modifiers: {}, description: 'Stop', category: 'transport' },
  { id: 'record', key: 'r', modifiers: {}, description: 'Record', category: 'transport' },
  { id: 'loop', key: 'l', modifiers: {}, description: 'Toggle loop', category: 'transport' },
  
  // Markers (Step 2815)
  { id: 'add-marker', key: 'm', modifiers: { meta: true }, description: 'Add marker at playhead', category: 'transport' },
  { id: 'next-marker', key: 'ArrowRight', modifiers: { meta: true, shift: true }, description: 'Jump to next marker', category: 'navigation' },
  { id: 'prev-marker', key: 'ArrowLeft', modifiers: { meta: true, shift: true }, description: 'Jump to previous marker', category: 'navigation' },
  { id: 'delete-marker', key: 'Backspace', modifiers: { shift: true }, description: 'Delete selected marker', category: 'editing' },
  { id: 'rename-marker', key: 'F2', modifiers: {}, description: 'Rename selected marker', category: 'editing' },
  
  // Locators (Step 2815)
  { id: 'set-left-locator', key: '[', modifiers: { meta: true }, description: 'Set left locator', category: 'transport' },
  { id: 'set-right-locator', key: ']', modifiers: { meta: true }, description: 'Set right locator', category: 'transport' },
  { id: 'jump-left-locator', key: '[', modifiers: { meta: true, shift: true }, description: 'Jump to left locator', category: 'navigation' },
  { id: 'jump-right-locator', key: ']', modifiers: { meta: true, shift: true }, description: 'Jump to right locator', category: 'navigation' },
  { id: 'select-locator-region', key: 'l', modifiers: { meta: true, shift: true }, description: 'Select region between locators', category: 'selection' },
  { id: 'loop-locators', key: 'l', modifiers: { meta: true, alt: true }, description: 'Set loop region from locators', category: 'transport' },
  
  // View
  { id: 'zoom-in', key: '=', modifiers: { meta: true }, description: 'Zoom in', category: 'view' },
  { id: 'zoom-out', key: '-', modifiers: { meta: true }, description: 'Zoom out', category: 'view' },
  { id: 'zoom-fit', key: '0', modifiers: { meta: true }, description: 'Fit to view', category: 'view' },
  { id: 'toggle-reveal', key: 'Enter', modifiers: {}, description: 'Toggle reveal panel', category: 'view' },
  { id: 'toggle-sidebar', key: 'b', modifiers: { meta: true }, description: 'Toggle sidebar', category: 'view' },
  
  // Tools
  { id: 'command-palette', key: 'k', modifiers: { meta: true }, description: 'Command palette', category: 'tools' },
  { id: 'quick-add', key: 'n', modifiers: { meta: true }, description: 'Quick add card', category: 'tools' },
  { id: 'search', key: 'f', modifiers: { meta: true }, description: 'Search', category: 'tools' },
  
  // File
  { id: 'save', key: 's', modifiers: { meta: true }, description: 'Save', category: 'file' },
  { id: 'save-as', key: 's', modifiers: { meta: true, shift: true }, description: 'Save as', category: 'file' },
  { id: 'export', key: 'e', modifiers: { meta: true }, description: 'Export', category: 'file' },
  
  // Help
  { id: 'shortcuts-help', key: '?', modifiers: { shift: true }, description: 'Show shortcuts', category: 'help' },
];

// ============================================================================
// FOCUS TRAP (for modals)
// ============================================================================

/**
 * Trap focus within a container (for modals/dialogs)
 */
export class FocusTrap {
  private container: HTMLElement;
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previousFocus: HTMLElement | null = null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.setup();
  }
  
  private setup(): void {
    this.previousFocus = document.activeElement as HTMLElement;
    
    const focusables = this.getFocusableElements();
    if (focusables.length > 0) {
      this.firstFocusable = focusables[0] ?? null;
      this.lastFocusable = focusables[focusables.length - 1] ?? null;
      this.firstFocusable?.focus();
    }
    
    this.container.addEventListener('keydown', this.handleKeyDown);
  }
  
  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    
    return Array.from(this.container.querySelectorAll<HTMLElement>(selector));
  }
  
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
  
  release(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    this.previousFocus?.focus();
  }
}

// ============================================================================
// ARIA HELPERS
// ============================================================================

/**
 * Set up ARIA attributes for a card
 */
export function setupCardAria(element: HTMLElement, config: {
  id: string;
  label: string;
  description?: string;
  selected?: boolean;
  expanded?: boolean;
  hasPopup?: 'menu' | 'dialog' | 'listbox';
}): void {
  element.setAttribute('role', 'article');
  element.setAttribute('aria-label', config.label);
  element.id = `card-${config.id}`;
  
  if (config.description) {
    element.setAttribute('aria-describedby', `card-desc-${config.id}`);
  }
  if (config.selected !== undefined) {
    element.setAttribute('aria-selected', String(config.selected));
  }
  if (config.expanded !== undefined) {
    element.setAttribute('aria-expanded', String(config.expanded));
  }
  if (config.hasPopup) {
    element.setAttribute('aria-haspopup', config.hasPopup);
  }
}

/**
 * Set up ARIA attributes for a stack
 */
export function setupStackAria(element: HTMLElement, config: {
  id: string;
  label: string;
  orientation: 'horizontal' | 'vertical';
  itemCount: number;
}): void {
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', config.label);
  element.setAttribute('aria-orientation', config.orientation);
  element.id = `stack-${config.id}`;
  
  // Live region for changes
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.className = 'sr-only';
  element.appendChild(liveRegion);
}

/**
 * Announce a change to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.getElementById('cardplay-announcer') 
    ?? createAnnouncer();
  
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'cardplay-announcer';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);
  return announcer;
}
