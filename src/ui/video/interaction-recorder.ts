/**
 * @fileoverview Interaction Recording & Playback System.
 * 
 * This module provides tools for recording, defining, and replaying user
 * interaction sequences for video generation and behavioral testing.
 * 
 * Key features:
 * - Define scripted interaction sequences
 * - Record live user interactions
 * - Interpolate between keyframes for smooth playback
 * - Support for persona-specific interaction patterns
 * - Timeline-based action scheduling
 * 
 * @see cardplayui.md Section 10: Interaction Patterns
 * @see beginner-bridge.ts for user personas
 * @see layout-bridge.ts for deck layouts
 */

import type { UserPersona } from '../beginner-bridge';
import type { DeckLayout, CardPosition } from '../layout-bridge';

// ============================================================================
// INTERACTION ACTION TYPES
// ============================================================================

/**
 * Types of user interactions.
 */
export type InteractionType =
  | 'mouse-move'      // Move cursor
  | 'mouse-down'      // Press mouse button
  | 'mouse-up'        // Release mouse button
  | 'click'           // Click (down + up)
  | 'double-click'    // Double click
  | 'right-click'     // Context menu
  | 'drag-start'      // Begin drag operation
  | 'drag-move'       // Continue dragging
  | 'drag-end'        // End drag operation
  | 'scroll'          // Mouse wheel scroll
  | 'key-down'        // Key press
  | 'key-up'          // Key release
  | 'key-press'       // Key press (down + up)
  | 'hover'           // Hover over element
  | 'focus'           // Focus element
  | 'blur'            // Blur element
  | 'touch-start'     // Touch begin
  | 'touch-move'      // Touch move
  | 'touch-end'       // Touch end
  | 'pinch'           // Pinch gesture
  | 'pan'             // Pan gesture
  | 'wait'            // Wait/pause
  | 'annotation';     // Add annotation overlay

/**
 * Easing function type.
 */
export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-out-quad'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'spring';

/**
 * Mouse button type.
 */
export type MouseButton = 'left' | 'right' | 'middle';

/**
 * Modifier keys state.
 */
export interface ModifierKeys {
  readonly shift: boolean;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
}

/**
 * Default modifier keys (all false).
 */
export const NO_MODIFIERS: ModifierKeys = {
  shift: false,
  ctrl: false,
  alt: false,
  meta: false,
};

// ============================================================================
// INTERACTION ACTION DEFINITIONS
// ============================================================================

/**
 * Base interaction action.
 */
export interface BaseAction {
  readonly id: string;
  readonly type: InteractionType;
  readonly timestamp: number;         // ms from sequence start
  readonly duration: number;          // action duration in ms
  readonly target?: ActionTarget;     // optional target element
  readonly annotation?: string;       // description for tooltips
}

/**
 * Target for an action.
 */
export interface ActionTarget {
  readonly type: 'card' | 'stack' | 'connection' | 'port' | 'toolbar' | 'reveal' | 'menu' | 'position';
  readonly cardId?: string;
  readonly stackId?: string;
  readonly connectionId?: string;
  readonly portId?: string;
  readonly selector?: string;
  readonly position?: { x: number; y: number };
}

/**
 * Mouse move action.
 */
export interface MouseMoveAction extends BaseAction {
  readonly type: 'mouse-move';
  readonly from: { x: number; y: number };
  readonly to: { x: number; y: number };
  readonly easing: EasingFunction;
  readonly showTrail: boolean;
}

/**
 * Mouse click action.
 */
export interface ClickAction extends BaseAction {
  readonly type: 'click' | 'double-click' | 'right-click';
  readonly position: { x: number; y: number };
  readonly button: MouseButton;
  readonly modifiers: ModifierKeys;
  readonly showRipple: boolean;
}

/**
 * Mouse down/up action.
 */
export interface MouseButtonAction extends BaseAction {
  readonly type: 'mouse-down' | 'mouse-up';
  readonly position: { x: number; y: number };
  readonly button: MouseButton;
  readonly modifiers: ModifierKeys;
}

/**
 * Drag action.
 */
export interface DragAction extends BaseAction {
  readonly type: 'drag-start' | 'drag-move' | 'drag-end';
  readonly position: { x: number; y: number };
  readonly button: MouseButton;
  readonly modifiers: ModifierKeys;
}

/**
 * Complete drag sequence (convenience).
 */
export interface DragSequenceAction extends BaseAction {
  readonly type: 'drag-start';  // We use drag-start as the base
  readonly from: { x: number; y: number };
  readonly to: { x: number; y: number };
  readonly waypoints?: readonly { x: number; y: number; time: number }[];
  readonly easing: EasingFunction;
  readonly button: MouseButton;
  readonly modifiers: ModifierKeys;
  readonly showGhost: boolean;
}

/**
 * Scroll action.
 */
export interface ScrollAction extends BaseAction {
  readonly type: 'scroll';
  readonly position: { x: number; y: number };
  readonly deltaX: number;
  readonly deltaY: number;
  readonly smooth: boolean;
}

/**
 * Keyboard action.
 */
export interface KeyAction extends BaseAction {
  readonly type: 'key-down' | 'key-up' | 'key-press';
  readonly key: string;
  readonly code: string;
  readonly modifiers: ModifierKeys;
  readonly showIndicator: boolean;
}

/**
 * Hover action.
 */
export interface HoverAction extends BaseAction {
  readonly type: 'hover';
  readonly position: { x: number; y: number };
  readonly showTooltip: boolean;
}

/**
 * Touch action.
 */
export interface TouchAction extends BaseAction {
  readonly type: 'touch-start' | 'touch-move' | 'touch-end';
  readonly touches: readonly { id: number; x: number; y: number }[];
}

/**
 * Pinch gesture action.
 */
export interface PinchAction extends BaseAction {
  readonly type: 'pinch';
  readonly center: { x: number; y: number };
  readonly startScale: number;
  readonly endScale: number;
  readonly easing: EasingFunction;
}

/**
 * Wait/pause action.
 */
export interface WaitAction extends BaseAction {
  readonly type: 'wait';
  readonly showPauseIndicator: boolean;
}

/**
 * Annotation overlay action.
 */
export interface AnnotationAction extends BaseAction {
  readonly type: 'annotation';
  readonly text: string;
  readonly position: { x: number; y: number };
  readonly style: 'tooltip' | 'callout' | 'highlight' | 'arrow';
  readonly targetPosition?: { x: number; y: number };
}

/**
 * Union of all action types.
 */
export type InteractionAction =
  | MouseMoveAction
  | ClickAction
  | MouseButtonAction
  | DragAction
  | DragSequenceAction
  | ScrollAction
  | KeyAction
  | HoverAction
  | TouchAction
  | PinchAction
  | WaitAction
  | AnnotationAction;

// ============================================================================
// INTERACTION SEQUENCE
// ============================================================================

/**
 * Complete interaction sequence for recording/playback.
 */
export interface InteractionSequence {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly persona: UserPersona | null;
  readonly layout: DeckLayout;
  readonly initialState: SequenceInitialState;
  readonly actions: readonly InteractionAction[];
  readonly totalDuration: number;       // Total duration in ms
  readonly metadata: SequenceMetadata;
}

/**
 * Initial state for sequence playback.
 */
export interface SequenceInitialState {
  readonly cards: readonly CardPosition[];
  readonly collapsedStacks: readonly string[];
  readonly selectedCardIds: readonly string[];
  readonly revealedCardId: string | null;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly cursorPosition: { x: number; y: number };
}

/**
 * Sequence metadata.
 */
export interface SequenceMetadata {
  readonly author: string;
  readonly createdAt: number;
  readonly version: string;
  readonly tags: readonly string[];
  readonly frameRate: number;
  readonly resolution: { width: number; height: number };
}

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Easing function implementations.
 */
export const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  'linear': (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in-quad': (t) => t * t,
  'ease-out-quad': (t) => t * (2 - t),
  'ease-in-out-quad': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in-cubic': (t) => t * t * t,
  'ease-out-cubic': (t) => (--t) * t * t + 1,
  'ease-in-out-cubic': (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  'spring': (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Apply easing function.
 */
export function applyEasing(t: number, easing: EasingFunction): number {
  return EASING_FUNCTIONS[easing](Math.max(0, Math.min(1, t)));
}

/**
 * Interpolate between two values with easing.
 */
export function interpolate(
  from: number,
  to: number,
  t: number,
  easing: EasingFunction = 'linear'
): number {
  const easedT = applyEasing(t, easing);
  return from + (to - from) * easedT;
}

/**
 * Interpolate between two points with easing.
 */
export function interpolatePoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
  easing: EasingFunction = 'linear'
): { x: number; y: number } {
  return {
    x: interpolate(from.x, to.x, t, easing),
    y: interpolate(from.y, to.y, t, easing),
  };
}

// ============================================================================
// SEQUENCE BUILDER
// ============================================================================

/**
 * Helper for building interaction sequences.
 */
export class SequenceBuilder {
  private actions: InteractionAction[] = [];
  private currentTime: number = 0;
  private actionId: number = 0;

  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly layout: DeckLayout,
    private readonly persona: UserPersona | null = null
  ) {}

  /**
   * Generate unique action ID.
   */
  private nextId(): string {
    return `${this.id}-action-${++this.actionId}`;
  }

  /**
   * Add wait/pause.
   */
  wait(duration: number, showIndicator: boolean = false): this {
    this.actions.push({
      id: this.nextId(),
      type: 'wait',
      timestamp: this.currentTime,
      duration,
      showPauseIndicator: showIndicator,
    });
    this.currentTime += duration;
    return this;
  }

  /**
   * Move cursor to position.
   */
  moveTo(
    x: number,
    y: number,
    duration: number = 300,
    options: { easing?: EasingFunction; showTrail?: boolean } = {}
  ): this {
    const lastPosition = this.getLastCursorPosition();
    this.actions.push({
      id: this.nextId(),
      type: 'mouse-move',
      timestamp: this.currentTime,
      duration,
      from: lastPosition,
      to: { x, y },
      easing: options.easing ?? 'ease-out',
      showTrail: options.showTrail ?? false,
    });
    this.currentTime += duration;
    return this;
  }

  /**
   * Click at current position.
   */
  click(options: {
    button?: MouseButton;
    modifiers?: Partial<ModifierKeys>;
    showRipple?: boolean;
  } = {}): this {
    const position = this.getLastCursorPosition();
    this.actions.push({
      id: this.nextId(),
      type: 'click',
      timestamp: this.currentTime,
      duration: 100,
      position,
      button: options.button ?? 'left',
      modifiers: { ...NO_MODIFIERS, ...options.modifiers },
      showRipple: options.showRipple ?? true,
    });
    this.currentTime += 100;
    return this;
  }

  /**
   * Double click at current position.
   */
  doubleClick(options: {
    modifiers?: Partial<ModifierKeys>;
    showRipple?: boolean;
  } = {}): this {
    const position = this.getLastCursorPosition();
    this.actions.push({
      id: this.nextId(),
      type: 'double-click',
      timestamp: this.currentTime,
      duration: 200,
      position,
      button: 'left',
      modifiers: { ...NO_MODIFIERS, ...options.modifiers },
      showRipple: options.showRipple ?? true,
    });
    this.currentTime += 200;
    return this;
  }

  /**
   * Right click at current position.
   */
  rightClick(options: {
    modifiers?: Partial<ModifierKeys>;
    showRipple?: boolean;
  } = {}): this {
    const position = this.getLastCursorPosition();
    this.actions.push({
      id: this.nextId(),
      type: 'right-click',
      timestamp: this.currentTime,
      duration: 100,
      position,
      button: 'right',
      modifiers: { ...NO_MODIFIERS, ...options.modifiers },
      showRipple: options.showRipple ?? true,
    });
    this.currentTime += 100;
    return this;
  }

  /**
   * Drag from current position to target.
   */
  dragTo(
    toX: number,
    toY: number,
    duration: number = 500,
    options: {
      easing?: EasingFunction;
      modifiers?: Partial<ModifierKeys>;
      showGhost?: boolean;
      waypoints?: readonly { x: number; y: number; time: number }[];
    } = {}
  ): this {
    const from = this.getLastCursorPosition();
    this.actions.push({
      id: this.nextId(),
      type: 'drag-start',
      timestamp: this.currentTime,
      duration,
      from,
      to: { x: toX, y: toY },
      waypoints: options.waypoints,
      easing: options.easing ?? 'ease-in-out',
      button: 'left',
      modifiers: { ...NO_MODIFIERS, ...options.modifiers },
      showGhost: options.showGhost ?? true,
      position: from,
    } as DragSequenceAction);
    this.currentTime += duration;
    return this;
  }

  /**
   * Press a key.
   */
  pressKey(
    key: string,
    options: {
      modifiers?: Partial<ModifierKeys>;
      showIndicator?: boolean;
      hold?: number;
    } = {}
  ): this {
    const duration = options.hold ?? 100;
    this.actions.push({
      id: this.nextId(),
      type: 'key-press',
      timestamp: this.currentTime,
      duration,
      key,
      code: key,
      modifiers: { ...NO_MODIFIERS, ...options.modifiers },
      showIndicator: options.showIndicator ?? true,
    });
    this.currentTime += duration;
    return this;
  }

  /**
   * Type a string of text.
   */
  typeText(text: string, delayPerChar: number = 50): this {
    for (const char of text) {
      this.pressKey(char, { showIndicator: false });
      this.wait(delayPerChar);
    }
    return this;
  }

  /**
   * Hover over position (shows tooltip).
   */
  hover(duration: number = 1000, showTooltip: boolean = true): this {
    const position = this.getLastCursorPosition();
    this.actions.push({
      id: this.nextId(),
      type: 'hover',
      timestamp: this.currentTime,
      duration,
      position,
      showTooltip,
    });
    this.currentTime += duration;
    return this;
  }

  /**
   * Scroll at current position.
   */
  scroll(
    deltaY: number,
    duration: number = 200,
    options: { deltaX?: number; smooth?: boolean } = {}
  ): this {
    const position = this.getLastCursorPosition();
    this.actions.push({
      id: this.nextId(),
      type: 'scroll',
      timestamp: this.currentTime,
      duration,
      position,
      deltaX: options.deltaX ?? 0,
      deltaY,
      smooth: options.smooth ?? true,
    });
    this.currentTime += duration;
    return this;
  }

  /**
   * Add annotation overlay.
   */
  annotate(
    text: string,
    duration: number = 2000,
    options: {
      style?: 'tooltip' | 'callout' | 'highlight' | 'arrow';
      position?: { x: number; y: number };
      targetPosition?: { x: number; y: number };
    } = {}
  ): this {
    const cursorPos = this.getLastCursorPosition();
    const action: AnnotationAction = {
      id: this.nextId(),
      type: 'annotation',
      timestamp: this.currentTime,
      duration,
      text,
      position: options.position ?? cursorPos,
      style: options.style ?? 'tooltip',
    };
    if (options.targetPosition) {
      (action as { targetPosition: { x: number; y: number } }).targetPosition = options.targetPosition;
    }
    this.actions.push(action);
    this.currentTime += duration;
    return this;
  }

  /**
   * Move to a card and click it.
   */
  clickCard(_cardId: string, cardPosition: { x: number; y: number }, options: {
    moveDuration?: number;
    annotation?: string;
  } = {}): this {
    this.moveTo(cardPosition.x, cardPosition.y, options.moveDuration ?? 400);
    if (options.annotation) {
      this.annotate(options.annotation, 1500, { style: 'callout' });
    }
    this.click({ showRipple: true });
    return this;
  }

  /**
   * Drag a card to new position.
   */
  dragCard(
    fromPosition: { x: number; y: number },
    toPosition: { x: number; y: number },
    options: { annotation?: string; duration?: number } = {}
  ): this {
    this.moveTo(fromPosition.x, fromPosition.y, 300);
    this.wait(100);
    if (options.annotation) {
      this.annotate(options.annotation, 1000, { style: 'tooltip' });
    }
    this.dragTo(toPosition.x, toPosition.y, options.duration ?? 600, { showGhost: true });
    return this;
  }

  /**
   * Open reveal panel for a card.
   */
  revealCard(cardPosition: { x: number; y: number }): this {
    this.moveTo(cardPosition.x, cardPosition.y, 300);
    this.doubleClick();
    this.wait(500); // Wait for reveal animation
    return this;
  }

  /**
   * Perform keyboard shortcut.
   */
  shortcut(keys: string, annotation?: string): this {
    const parts = keys.split('+');
    let meta = false;
    let ctrl = false;
    let shift = false;
    let alt = false;
    let mainKey = keys;

    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower === 'cmd' || lower === 'meta') meta = true;
      else if (lower === 'ctrl') ctrl = true;
      else if (lower === 'shift') shift = true;
      else if (lower === 'alt') alt = true;
      else mainKey = part;
    }

    const modifiers: ModifierKeys = { shift, ctrl, alt, meta };

    if (annotation) {
      this.annotate(annotation, 1500, { style: 'callout', position: { x: 100, y: 50 } });
    }
    this.pressKey(mainKey, { modifiers, showIndicator: true });
    return this;
  }

  /**
   * Get the last known cursor position.
   */
  private getLastCursorPosition(): { x: number; y: number } {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      const action = this.actions[i];
      if (action && 'to' in action && action.to) return action.to;
      if (action && 'position' in action && action.position) return action.position;
    }
    return { x: 0, y: 0 };
  }

  /**
   * Build the final sequence.
   */
  build(options: {
    description?: string;
    initialState?: Partial<SequenceInitialState>;
    metadata?: Partial<SequenceMetadata>;
  } = {}): InteractionSequence {
    return {
      id: this.id,
      name: this.name,
      description: options.description ?? '',
      persona: this.persona,
      layout: this.layout,
      initialState: {
        cards: [],
        collapsedStacks: [],
        selectedCardIds: [],
        revealedCardId: null,
        zoom: 1,
        panX: 0,
        panY: 0,
        cursorPosition: { x: 0, y: 0 },
        ...options.initialState,
      },
      actions: this.actions,
      totalDuration: this.currentTime,
      metadata: {
        author: 'CardPlay',
        createdAt: Date.now(),
        version: '1.0.0',
        tags: [],
        frameRate: 30,
        resolution: { width: 1920, height: 1080 },
        ...options.metadata,
      },
    };
  }
}

// ============================================================================
// SEQUENCE PLAYER
// ============================================================================

/**
 * Playback state.
 */
export interface PlaybackState {
  readonly sequence: InteractionSequence;
  readonly currentTime: number;
  readonly isPlaying: boolean;
  readonly isPaused: boolean;
  readonly playbackRate: number;
  readonly currentActionIndex: number;
  readonly cursorPosition: { x: number; y: number };
  readonly activeAnnotations: readonly AnnotationAction[];
  readonly visualEffects: readonly VisualEffect[];
}

/**
 * Visual effect during playback.
 */
export interface VisualEffect {
  readonly id: string;
  readonly type: 'click-ripple' | 'drag-ghost' | 'cursor-trail' | 'key-indicator' | 'hover-glow';
  readonly position: { x: number; y: number };
  readonly startTime: number;
  readonly duration: number;
  readonly data: Record<string, unknown>;
}

/**
 * Playback event types.
 */
export type PlaybackEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'seek'
  | 'action-start'
  | 'action-end'
  | 'frame'
  | 'complete';

/**
 * Playback event listener.
 */
export type PlaybackEventListener = (
  event: PlaybackEventType,
  state: PlaybackState,
  action?: InteractionAction
) => void;

/**
 * Sequence player for playback control.
 */
export class SequencePlayer {
  private state: PlaybackState;
  private listeners: Set<PlaybackEventListener> = new Set();
  private animationFrame: number | null = null;
  private lastFrameTime: number = 0;

  constructor(sequence: InteractionSequence) {
    this.state = {
      sequence,
      currentTime: 0,
      isPlaying: false,
      isPaused: false,
      playbackRate: 1,
      currentActionIndex: 0,
      cursorPosition: sequence.initialState.cursorPosition,
      activeAnnotations: [],
      visualEffects: [],
    };
  }

  /**
   * Add event listener.
   */
  addEventListener(listener: PlaybackEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event to listeners.
   */
  private emit(event: PlaybackEventType, action?: InteractionAction): void {
    for (const listener of this.listeners) {
      listener(event, this.state, action);
    }
  }

  /**
   * Start playback.
   */
  play(): void {
    if (this.state.isPlaying) return;

    this.state = { ...this.state, isPlaying: true, isPaused: false };
    this.lastFrameTime = performance.now();
    this.emit('play');
    this.scheduleFrame();
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;

    this.state = { ...this.state, isPaused: true };
    this.cancelFrame();
    this.emit('pause');
  }

  /**
   * Resume from pause.
   */
  resume(): void {
    if (!this.state.isPaused) return;

    this.state = { ...this.state, isPaused: false };
    this.lastFrameTime = performance.now();
    this.emit('play');
    this.scheduleFrame();
  }

  /**
   * Stop playback and reset.
   */
  stop(): void {
    this.cancelFrame();
    this.state = {
      ...this.state,
      currentTime: 0,
      isPlaying: false,
      isPaused: false,
      currentActionIndex: 0,
      cursorPosition: this.state.sequence.initialState.cursorPosition,
      activeAnnotations: [],
      visualEffects: [],
    };
    this.emit('stop');
  }

  /**
   * Seek to specific time.
   */
  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this.state.sequence.totalDuration));
    this.state = { ...this.state, currentTime: clampedTime };
    this.updateState();
    this.emit('seek');
  }

  /**
   * Set playback rate.
   */
  setPlaybackRate(rate: number): void {
    this.state = { ...this.state, playbackRate: Math.max(0.1, Math.min(4, rate)) };
  }

  /**
   * Get current state.
   */
  getState(): PlaybackState {
    return this.state;
  }

  /**
   * Get state at specific time (for frame rendering).
   */
  getStateAtTime(time: number): PlaybackState {
    const clampedTime = Math.max(0, Math.min(time, this.state.sequence.totalDuration));
    
    // Find active actions and calculate interpolated state
    const cursorPosition = this.calculateCursorPosition(clampedTime);
    const activeAnnotations = this.getActiveAnnotations(clampedTime);
    const visualEffects = this.getActiveEffects(clampedTime);

    return {
      ...this.state,
      currentTime: clampedTime,
      cursorPosition,
      activeAnnotations,
      visualEffects,
    };
  }

  /**
   * Calculate cursor position at given time.
   */
  private calculateCursorPosition(time: number): { x: number; y: number } {
    const { actions } = this.state.sequence;
    let position = this.state.sequence.initialState.cursorPosition;

    for (const action of actions) {
      if (action.timestamp > time) break;

      const actionEnd = action.timestamp + action.duration;

      if (action.type === 'mouse-move') {
        const moveAction = action as MouseMoveAction;
        if (time >= actionEnd) {
          position = moveAction.to;
        } else {
          const progress = (time - action.timestamp) / action.duration;
          position = interpolatePoint(moveAction.from, moveAction.to, progress, moveAction.easing);
        }
      } else if (action.type === 'drag-start' && 'to' in action) {
        const dragAction = action as DragSequenceAction;
        if (time >= actionEnd) {
          position = dragAction.to;
        } else {
          const progress = (time - action.timestamp) / action.duration;
          position = interpolatePoint(dragAction.from, dragAction.to, progress, dragAction.easing);
        }
      } else if ('position' in action && action.position) {
        position = action.position;
      }
    }

    return position;
  }

  /**
   * Get active annotations at given time.
   */
  private getActiveAnnotations(time: number): readonly AnnotationAction[] {
    return this.state.sequence.actions.filter(
      (action): action is AnnotationAction =>
        action.type === 'annotation' &&
        time >= action.timestamp &&
        time < action.timestamp + action.duration
    );
  }

  /**
   * Get active visual effects at given time.
   */
  private getActiveEffects(time: number): readonly VisualEffect[] {
    const effects: VisualEffect[] = [];
    const { actions } = this.state.sequence;

    for (const action of actions) {
      if (action.timestamp > time) break;

      // Click ripples
      if ((action.type === 'click' || action.type === 'double-click') && 'showRipple' in action) {
        const clickAction = action as ClickAction;
        if (clickAction.showRipple) {
          const rippleStart = action.timestamp;
          const rippleDuration = 400;
          if (time >= rippleStart && time < rippleStart + rippleDuration) {
            effects.push({
              id: `ripple-${action.id}`,
              type: 'click-ripple',
              position: clickAction.position,
              startTime: rippleStart,
              duration: rippleDuration,
              data: { progress: (time - rippleStart) / rippleDuration },
            });
          }
        }
      }

      // Key indicators
      if (action.type === 'key-press' && 'showIndicator' in action) {
        const keyAction = action as KeyAction;
        if (keyAction.showIndicator) {
          const indicatorEnd = action.timestamp + action.duration + 300;
          if (time >= action.timestamp && time < indicatorEnd) {
            effects.push({
              id: `key-${action.id}`,
              type: 'key-indicator',
              position: { x: 100, y: 50 },
              startTime: action.timestamp,
              duration: action.duration + 300,
              data: { 
                key: keyAction.key, 
                modifiers: keyAction.modifiers,
                progress: (time - action.timestamp) / (action.duration + 300),
              },
            });
          }
        }
      }
    }

    return effects;
  }

  /**
   * Schedule next animation frame.
   */
  private scheduleFrame(): void {
    this.animationFrame = requestAnimationFrame((now) => this.frame(now));
  }

  /**
   * Cancel scheduled frame.
   */
  private cancelFrame(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Process animation frame.
   */
  private frame(now: number): void {
    if (!this.state.isPlaying || this.state.isPaused) return;

    const deltaTime = (now - this.lastFrameTime) * this.state.playbackRate;
    this.lastFrameTime = now;

    const newTime = this.state.currentTime + deltaTime;

    if (newTime >= this.state.sequence.totalDuration) {
      this.state = { ...this.state, currentTime: this.state.sequence.totalDuration };
      this.updateState();
      this.emit('frame');
      this.emit('complete');
      this.stop();
      return;
    }

    this.state = { ...this.state, currentTime: newTime };
    this.updateState();
    this.emit('frame');
    this.scheduleFrame();
  }

  /**
   * Update state based on current time.
   */
  private updateState(): void {
    const { currentTime } = this.state;

    this.state = {
      ...this.state,
      cursorPosition: this.calculateCursorPosition(currentTime),
      activeAnnotations: this.getActiveAnnotations(currentTime),
      visualEffects: this.getActiveEffects(currentTime),
    };
  }

  /**
   * Dispose player.
   */
  dispose(): void {
    this.cancelFrame();
    this.listeners.clear();
  }
}

// ============================================================================
// DEMO SEQUENCE FACTORIES
// ============================================================================

/**
 * Create a demo sequence showing basic card operations.
 */
export function createBasicDemoSequence(layout: DeckLayout): InteractionSequence {
  const builder = new SequenceBuilder('basic-demo', 'Basic Operations Demo', layout);

  return builder
    .wait(500)
    .annotate('Welcome to CardPlay!', 2000, { style: 'callout', position: { x: 960, y: 100 } })
    .wait(500)
    
    // Move to card browser
    .moveTo(100, 50, 500)
    .annotate('Click here to browse cards', 1500, { style: 'tooltip' })
    .click()
    .wait(800)
    
    // Select a drum machine
    .moveTo(200, 200, 400)
    .annotate('Select Drum Machine', 1000)
    .click()
    .wait(500)
    
    // Drag to deck
    .dragTo(400, 300, 800, { showGhost: true })
    .annotate('Card added to deck!', 1500, { style: 'callout', position: { x: 400, y: 200 } })
    .wait(1000)
    
    // Double-click to reveal
    .moveTo(400, 300, 300)
    .doubleClick()
    .annotate('Double-click to open editor', 1500)
    .wait(2000)
    
    // Press play
    .shortcut('Space', 'Press Space to play')
    .wait(3000)
    
    .annotate('🎉 You made a beat!', 2000, { style: 'callout', position: { x: 960, y: 540 } })
    
    .build({
      description: 'Demonstrates adding a card and playing a beat',
      metadata: { tags: ['beginner', 'tutorial', 'demo'] },
    });
}

/**
 * Create a demo showing drag-and-drop operations.
 */
export function createDragDropDemoSequence(layout: DeckLayout): InteractionSequence {
  const builder = new SequenceBuilder('drag-drop-demo', 'Drag & Drop Demo', layout);

  return builder
    .wait(500)
    .annotate('Drag & Drop Demo', 2000, { style: 'callout', position: { x: 960, y: 100 } })
    
    // Show card dragging
    .moveTo(200, 300, 400)
    .wait(200)
    .annotate('Drag cards to reposition', 1500)
    .dragTo(600, 300, 1000, { showGhost: true })
    .wait(500)
    
    // Show connection dragging
    .moveTo(650, 300, 300)
    .annotate('Drag from output port...', 1500)
    .wait(500)
    .dragTo(850, 400, 800, { showGhost: true })
    .annotate('...to input port to connect', 1500)
    .wait(1000)
    
    // Show copy with modifier
    .moveTo(600, 300, 300)
    .annotate('Hold Alt while dragging to copy', 2000)
    .dragTo(800, 500, 800, { modifiers: { alt: true }, showGhost: true })
    .wait(1000)
    
    .build({
      description: 'Shows drag and drop operations including card moving and connecting',
      metadata: { tags: ['intermediate', 'tutorial', 'connections'] },
    });
}

/**
 * Create a persona-specific demo sequence.
 */
export function createPersonaDemoSequence(
  persona: UserPersona,
  layout: DeckLayout
): InteractionSequence {
  const builder = new SequenceBuilder(
    `${persona.id}-demo`,
    `${persona.name} Workflow Demo`,
    layout,
    persona
  );

  // Add persona-specific actions based on background
  builder
    .wait(500)
    .annotate(`${persona.name} Workflow`, 2000, { style: 'callout', position: { x: 960, y: 100 } });

  switch (persona.background) {
    case 'renoise':
      builder
        .annotate('Tracker-style workflow', 1500)
        .wait(500)
        .moveTo(300, 400, 400)
        .annotate('Pattern editor on the left', 1500)
        .wait(500)
        .shortcut('F1', 'Use hex note entry');
      break;

    case 'ableton':
      builder
        .annotate('Session view workflow', 1500)
        .wait(500)
        .moveTo(200, 300, 400)
        .annotate('Launch clips from the grid', 1500)
        .click()
        .wait(500)
        .shortcut('Tab', 'Tab to switch views');
      break;

    case 'cubase':
      builder
        .annotate('Arrangement workflow', 1500)
        .wait(500)
        .moveTo(400, 200, 400)
        .annotate('Timeline at the top', 1500)
        .wait(500)
        .shortcut('P', 'Set locators');
      break;

    default:
      builder
        .annotate('Getting started...', 1500)
        .wait(500)
        .moveTo(400, 300, 400)
        .click();
  }

  return builder.build({
    description: `Workflow demonstration for ${persona.name} users`,
    metadata: { tags: [persona.id, 'persona', 'workflow'] },
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SequenceBuilder as InteractionSequenceBuilder };
