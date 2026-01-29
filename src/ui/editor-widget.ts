/**
 * @fileoverview Editor Widget Interface
 * 
 * Defines the interface for UI editor widgets (tracker, piano roll, notation, etc.)
 * that bind to EventContainers and provide editing surfaces.
 * 
 * ## Architecture Note (cardplay2.md Part VI)
 * 
 * The CardPlay system distinguishes between:
 * 
 * 1. **Card<A, B>**: A typed morphism that transforms streams (input A → output B).
 *    These are the functional building blocks: generators, effects, transforms.
 * 
 * 2. **EditorWidget**: A UI surface that binds to an EventContainer for editing.
 *    These are views: tracker, piano roll, notation, session view.
 * 
 * All editor widgets share these invariants (per cardplay2.md §6.1.1):
 * - They read from the same EventContainer
 * - They write through the same event CRUD operations
 * - They never store separate event lists
 * - Edits are immediately visible across all other views
 * 
 * This interface captures the lifecycle and behavior of editor widgets,
 * which is fundamentally different from Card<A,B> stream processing.
 * 
 * @module @cardplay/ui/editor-widget
 */

import type { EventStreamId } from '../state/types';

// =============================================================================
// EDITOR WIDGET METADATA
// =============================================================================

/**
 * Editor widget category for grouping in the UI.
 */
export type EditorCategory =
  | 'sequencer'     // Tracker, piano roll, step sequencer
  | 'notation'      // Score, tablature, lead sheet
  | 'arrangement'   // Timeline, clip arrangement
  | 'session'       // Clip launching, scene control
  | 'browser'       // Sample browser, preset browser
  | 'mixer'         // Channel strips, master
  | 'utility';      // Meters, analyzers, settings

/**
 * Metadata for an editor widget type.
 */
export interface EditorWidgetMeta {
  /** Unique identifier for this widget type */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Description */
  readonly description?: string;
  /** Category for grouping */
  readonly category: EditorCategory;
  /** Tags for search */
  readonly tags?: readonly string[];
  /** Author */
  readonly author?: string;
  /** Version */
  readonly version?: string;
  
  /** Visual identity */
  readonly visuals?: {
    readonly emoji?: string;
    readonly color?: string;
    readonly icon?: string;
  };
  
  /** Default dimensions */
  readonly defaultWidth?: number;
  readonly defaultHeight?: number;
  readonly minWidth?: number;
  readonly minHeight?: number;
  
  /** Behavior hints */
  readonly resizable?: boolean;
  readonly collapsible?: boolean;
  readonly closable?: boolean;
}

// =============================================================================
// EDITOR WIDGET STATE
// =============================================================================

/**
 * Base state interface for editor widgets.
 * Widgets extend this with their specific state needs.
 */
export interface EditorWidgetState {
  /** The stream this editor is bound to (if any) */
  readonly boundStreamId?: EventStreamId;
  /** Whether the widget is in playing mode */
  readonly isPlaying?: boolean;
  /** Whether the widget is in recording mode */
  readonly isRecording?: boolean;
}

// =============================================================================
// EDITOR WIDGET INTERFACE
// =============================================================================

/**
 * Context provided to editor widgets during lifecycle operations.
 */
export interface EditorWidgetContext {
  /** Current time position in ticks */
  readonly currentTick: number;
  /** Whether transport is playing */
  readonly isPlaying: boolean;
  /** Whether transport is recording */
  readonly isRecording: boolean;
  /** Current tempo in BPM */
  readonly tempo: number;
}

/**
 * Result of a widget update operation.
 */
export interface EditorWidgetResult<S extends EditorWidgetState> {
  /** Updated state */
  readonly state: S;
  /** Whether a re-render is needed */
  readonly needsRender?: boolean;
}

/**
 * Interface for editor widgets (UI surfaces bound to EventContainers).
 * 
 * Unlike Card<A,B> which transforms streams, EditorWidget provides
 * an interactive editing surface for events within a container.
 * 
 * @typeParam S - The widget-specific state type
 */
export interface EditorWidget<S extends EditorWidgetState = EditorWidgetState> {
  /** Unique instance ID */
  readonly id: string;
  
  /** Widget type metadata */
  readonly meta: EditorWidgetMeta;
  
  /**
   * Initialize the widget.
   * Called once when the widget is first created.
   */
  init(context: EditorWidgetContext): Promise<void>;
  
  /**
   * Bind the widget to an event stream.
   * The widget will display and edit events from this stream.
   * 
   * @param streamId - The stream to bind to
   */
  bindStream(streamId: EventStreamId): void;
  
  /**
   * Unbind from the current stream.
   */
  unbindStream(): void;
  
  /**
   * Update the widget state in response to context changes.
   * Called on transport changes, tempo changes, etc.
   */
  update(context: EditorWidgetContext, state: S): EditorWidgetResult<S>;
  
  /**
   * Mount the widget UI to a DOM container.
   */
  mount(container: HTMLElement): void;
  
  /**
   * Unmount the widget UI.
   */
  unmount(): void;
  
  /**
   * Get current widget state.
   */
  getState(): S;
  
  /**
   * Serialize widget state for persistence.
   */
  serialize(): unknown;
  
  /**
   * Restore widget state from serialized data.
   */
  deserialize(data: unknown): void;
  
  /**
   * Destroy the widget and clean up resources.
   */
  destroy(): void;
}

// =============================================================================
// EDITOR WIDGET FACTORY
// =============================================================================

/**
 * Factory function for creating editor widgets.
 */
export type EditorWidgetFactory<S extends EditorWidgetState = EditorWidgetState> = 
  (id?: string) => EditorWidget<S>;

/**
 * Registry for editor widget factories.
 */
export class EditorWidgetRegistry {
  private factories = new Map<string, EditorWidgetFactory<any>>();
  
  /**
   * Register a widget factory.
   */
  register<S extends EditorWidgetState>(
    widgetType: string,
    factory: EditorWidgetFactory<S>
  ): void {
    if (this.factories.has(widgetType)) {
      throw new Error(`Widget type already registered: ${widgetType}`);
    }
    this.factories.set(widgetType, factory);
  }
  
  /**
   * Create a widget instance.
   */
  create<S extends EditorWidgetState>(
    widgetType: string,
    id?: string
  ): EditorWidget<S> | undefined {
    const factory = this.factories.get(widgetType);
    if (!factory) return undefined;
    return factory(id) as EditorWidget<S>;
  }
  
  /**
   * Check if a widget type is registered.
   */
  has(widgetType: string): boolean {
    return this.factories.has(widgetType);
  }
  
  /**
   * List all registered widget types.
   */
  list(): string[] {
    return Array.from(this.factories.keys());
  }
}

// Singleton registry
let registryInstance: EditorWidgetRegistry | null = null;

/**
 * Get the global editor widget registry.
 */
export function getEditorWidgetRegistry(): EditorWidgetRegistry {
  if (!registryInstance) {
    registryInstance = new EditorWidgetRegistry();
  }
  return registryInstance;
}
