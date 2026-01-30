/**
 * @fileoverview Spec Event Bus — Publish/Subscribe for MusicSpec changes (C915)
 *
 * Provides a typed event bus that cards and boards use to communicate
 * MusicSpec changes. When one card modifies a constraint, dependent cards
 * receive notifications and can update their recommendations accordingly.
 *
 * Architecture:
 * - Cards publish constraint changes via `specBus.publish()`
 * - Dependent cards subscribe to specific constraint types via `specBus.on()`
 * - The bus also supports full-spec change events for cross-cutting concerns
 *
 * Change 363: Event bus instances are now created per SpecContextId (not global).
 * Access via MusicSpecStore.getEventBus(contextId).
 *
 * Implements: C913 (parameter linking), C914 (linking layer), C915 (event bus)
 *
 * @module @cardplay/ai/theory/spec-event-bus
 */

import type { MusicSpec, MusicConstraint } from './music-spec';

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * A spec change event emitted when any part of the MusicSpec changes.
 */
export interface SpecChangeEvent {
  /** The constraint type that changed (or 'spec' for full-spec changes) */
  readonly source: MusicConstraint['type'] | 'spec';
  /** The card ID that initiated the change */
  readonly cardId: string;
  /** The updated spec (after the change) */
  readonly spec: MusicSpec;
  /** The specific constraints that were added/changed */
  readonly changedConstraints: readonly MusicConstraint[];
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * A parameter link definition: when sourceParam changes, trigger an update
 * on targetCard's targetParam.
 */
export interface ParamLink {
  /** Source card ID */
  readonly sourceCardId: string;
  /** Source constraint type that triggers the link */
  readonly sourceConstraintType: MusicConstraint['type'];
  /** Target card ID */
  readonly targetCardId: string;
  /** Description of what the link does */
  readonly description: string;
}

// ============================================================================
// EVENT BUS
// ============================================================================

export type SpecChangeHandler = (event: SpecChangeEvent) => void;

/**
 * C915: Spec Event Bus — central publish/subscribe hub for MusicSpec changes.
 *
 * Usage:
 * ```ts
 * // Subscribe to all spec changes
 * specBus.on('*', (event) => { ... });
 *
 * // Subscribe to specific constraint type changes
 * specBus.on('tonality_model', (event) => { ... });
 *
 * // Publish a change
 * specBus.publish({
 *   source: 'tonality_model',
 *   cardId: 'theory:tonality_model',
 *   spec: updatedSpec,
 *   changedConstraints: [{ type: 'tonality_model', ... }],
 *   timestamp: Date.now(),
 * });
 * ```
 */
export class SpecEventBus {
  private readonly listeners = new Map<string, Set<SpecChangeHandler>>();
  private readonly links: ParamLink[] = [];
  private paused = false;

  /**
   * Subscribe to spec change events.
   * @param constraintType - The constraint type to listen for, or '*' for all changes.
   * @param handler - Callback invoked when a matching event is published.
   * @returns An unsubscribe function.
   */
  on(constraintType: MusicConstraint['type'] | '*', handler: SpecChangeHandler): () => void {
    const key = constraintType;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(handler);

    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(handler);
        if (set.size === 0) this.listeners.delete(key);
      }
    };
  }

  /**
   * Publish a spec change event.
   * Notifies all handlers subscribed to the specific constraint type
   * and all handlers subscribed to '*'.
   */
  publish(event: SpecChangeEvent): void {
    if (this.paused) return;

    // Notify specific constraint type listeners
    const specific = this.listeners.get(event.source);
    if (specific) {
      for (const handler of specific) {
        try { handler(event); } catch (e) { console.warn('SpecEventBus handler error:', e); }
      }
    }

    // Notify wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      for (const handler of wildcard) {
        try { handler(event); } catch (e) { console.warn('SpecEventBus handler error:', e); }
      }
    }
  }

  /**
   * Register a parameter link between cards.
   * When a constraint of sourceConstraintType is published from sourceCardId,
   * the link is recorded for UI to query.
   */
  addLink(link: ParamLink): void {
    this.links.push(link);
  }

  /**
   * Get all links where the given constraint type is the source.
   */
  getLinksFrom(constraintType: MusicConstraint['type']): readonly ParamLink[] {
    return this.links.filter(l => l.sourceConstraintType === constraintType);
  }

  /**
   * Get all links where the given card is the target.
   */
  getLinksTo(cardId: string): readonly ParamLink[] {
    return this.links.filter(l => l.targetCardId === cardId);
  }

  /**
   * Get all registered links.
   */
  getAllLinks(): readonly ParamLink[] {
    return [...this.links];
  }

  /**
   * Pause event delivery (useful during batch updates).
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume event delivery and optionally flush a final state event.
   */
  resume(flushEvent?: SpecChangeEvent): void {
    this.paused = false;
    if (flushEvent) {
      this.publish(flushEvent);
    }
  }

  /**
   * Remove all listeners and links. Used for testing/cleanup.
   */
  clear(): void {
    this.listeners.clear();
    this.links.length = 0;
    this.paused = false;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global spec event bus instance shared across the application.
 */
export const specBus = new SpecEventBus();

// ============================================================================
// DEFAULT PARAMETER LINKS (C913-C914)
// ============================================================================

/**
 * Register the default parameter links between theory cards.
 * These define the dependency relationships between card parameters.
 */
export function registerDefaultLinks(bus: SpecEventBus = specBus): void {
  // Tonality model → Harmony suggestions
  bus.addLink({
    sourceCardId: 'theory:tonality_model',
    sourceConstraintType: 'tonality_model',
    targetCardId: 'analysis:tonality',
    description: 'Tonality model change re-runs key detection with new model',
  });

  // Schema → Phrase generator
  bus.addLink({
    sourceCardId: 'theory:schema',
    sourceConstraintType: 'schema',
    targetCardId: 'theory:grouping',
    description: 'Schema change constrains phrase generator output',
  });

  // Carnatic raga → Melody pitch set
  bus.addLink({
    sourceCardId: 'theory:carnatic_raga_tala',
    sourceConstraintType: 'raga',
    targetCardId: 'theory:drone',
    description: 'Raga change updates drone tones to match',
  });

  // Carnatic tala → Mridangam pattern
  bus.addLink({
    sourceCardId: 'theory:carnatic_raga_tala',
    sourceConstraintType: 'tala',
    targetCardId: 'theory:mridangam_pattern',
    description: 'Tala change updates mridangam pattern',
  });

  // Celtic tune → Ornament generator
  bus.addLink({
    sourceCardId: 'theory:celtic_tune',
    sourceConstraintType: 'celtic_tune',
    targetCardId: 'theory:ornament_generator',
    description: 'Tune type change updates ornament generator presets',
  });

  // Celtic tune → Bodhrán
  bus.addLink({
    sourceCardId: 'theory:celtic_tune',
    sourceConstraintType: 'celtic_tune',
    targetCardId: 'theory:bodhran',
    description: 'Tune type change updates bodhrán pattern',
  });

  // Chinese mode → Heterophony
  bus.addLink({
    sourceCardId: 'theory:chinese_mode',
    sourceConstraintType: 'chinese_mode',
    targetCardId: 'theory:heterophony',
    description: 'Mode change constrains heterophony pitch set',
  });

  // Chinese mode → Guzheng
  bus.addLink({
    sourceCardId: 'theory:chinese_mode',
    sourceConstraintType: 'chinese_mode',
    targetCardId: 'theory:guzheng_gliss',
    description: 'Mode change constrains guzheng glissando pitch set',
  });

  // Film mood → Film device suggestions
  bus.addLink({
    sourceCardId: 'theory:film_scoring',
    sourceConstraintType: 'film_mood',
    targetCardId: 'theory:trailer_build',
    description: 'Film mood change may suggest trailer build parameters',
  });

  // Film device → Leitmotif
  bus.addLink({
    sourceCardId: 'theory:film_scoring',
    sourceConstraintType: 'film_device',
    targetCardId: 'theory:leitmotif_library',
    description: 'Film device change may suggest leitmotif transformations',
  });
}
