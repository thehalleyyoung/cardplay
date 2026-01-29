/**
 * @fileoverview Board Switching Types
 *
 * Types for board switching options and behavior.
 *
 * B078-B079: Define board switch options.
 *
 * @module @cardplay/boards/switching/types
 */

// ============================================================================
// BOARD SWITCH OPTIONS
// ============================================================================

/**
 * Options for switching boards.
 */
export interface BoardSwitchOptions {
  /**
   * Whether to reset layout to board defaults.
   * If false, preserves persisted layout state.
   */
  resetLayout?: boolean;

  /**
   * Whether to reset deck states (tabs, scroll positions, etc.).
   * If false, preserves persisted deck state.
   */
  resetDecks?: boolean;

  /**
   * Whether to preserve active context (stream, clip, selection, etc.).
   * If false, active context may be reset based on board defaults.
   */
  preserveActiveContext?: boolean;

  /**
   * Whether to preserve transport state (playing, position, tempo).
   * If false, transport may be reset.
   */
  preserveTransport?: boolean;
  
  /**
   * Whether to clear selection on board switch.
   * If true, clears all selected events/clips.
   * Default: false
   */
  clearSelection?: boolean;

  /**
   * Whether to call board lifecycle hooks (onDeactivate, onActivate).
   * Default: true
   */
  callLifecycleHooks?: boolean;
}

/**
 * Default board switch options.
 */
export const DEFAULT_SWITCH_OPTIONS: Required<BoardSwitchOptions> = {
  resetLayout: false,
  resetDecks: false,
  preserveActiveContext: true,
  preserveTransport: true,
  clearSelection: false,
  callLifecycleHooks: true,
};
