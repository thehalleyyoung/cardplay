/**
 * @fileoverview Tool Configuration Validation
 * 
 * Validates that tool configurations are consistent with board control levels
 * and warns about potential misconfigurations.
 * 
 * @module @cardplay/boards/validate-tool-config
 */

import type { Board, ToolKind, ControlLevel } from './types';

/**
 * Tool config validation warning.
 */
export interface ToolConfigWarning {
  readonly toolKind: ToolKind;
  readonly issue: string;
  readonly recommendation: string;
}

/**
 * Expected tool modes per control level.
 */
const EXPECTED_TOOL_MODES: Record<ControlLevel, Partial<Record<ToolKind, string[]>>> = {
  'full-manual': {
    phraseDatabase: ['hidden'],
    harmonyExplorer: ['hidden'],
    phraseGenerators: ['hidden'],
    arrangerCard: ['hidden'],
    aiComposer: ['hidden'],
  },
  'manual-with-hints': {
    phraseDatabase: ['hidden'],
    harmonyExplorer: ['display-only'],
    phraseGenerators: ['hidden'],
    arrangerCard: ['hidden'],
    aiComposer: ['hidden'],
  },
  'assisted': {
    phraseDatabase: ['browse-only', 'drag-drop'],
    harmonyExplorer: ['display-only', 'suggest'],
    phraseGenerators: ['hidden', 'on-demand'],
    arrangerCard: ['hidden'],
    aiComposer: ['hidden'],
  },
  'directed': {
    phraseDatabase: ['drag-drop'],
    harmonyExplorer: ['suggest'],
    phraseGenerators: ['on-demand'],
    arrangerCard: ['manual-trigger', 'chord-follow'],
    aiComposer: ['command-palette'],
  },
  'collaborative': {
    phraseDatabase: ['drag-drop'],
    harmonyExplorer: ['suggest'],
    phraseGenerators: ['on-demand'],
    arrangerCard: ['chord-follow'],
    aiComposer: ['command-palette', 'inline-suggest'],
  },
  'generative': {
    phraseDatabase: ['drag-drop', 'auto-suggest'],
    harmonyExplorer: ['suggest', 'auto-apply'],
    phraseGenerators: ['continuous'],
    arrangerCard: ['chord-follow', 'autonomous'],
    aiComposer: ['inline-suggest', 'autonomous'],
  },
};

/**
 * Validates tool configuration against board control level.
 * 
 * Returns warnings if tool modes are inconsistent with the control level.
 * 
 * @param board - The board to validate
 * @returns Array of warnings (empty if valid)
 * 
 * @example
 * ```ts
 * const board = { controlLevel: 'full-manual', ... };
 * const warnings = validateToolConfig(board);
 * 
 * if (warnings.length > 0) {
 *   console.warn('Tool config issues:', warnings);
 * }
 * ```
 */
export function validateToolConfig(board: Board): ToolConfigWarning[] {
  const warnings: ToolConfigWarning[] = [];
  const { controlLevel, compositionTools } = board;
  
  const expected = EXPECTED_TOOL_MODES[controlLevel];
  
  // Check each tool
  const tools: Array<{ kind: ToolKind; config: any }> = [
    { kind: 'phraseDatabase', config: compositionTools.phraseDatabase },
    { kind: 'harmonyExplorer', config: compositionTools.harmonyExplorer },
    { kind: 'phraseGenerators', config: compositionTools.phraseGenerators },
    { kind: 'arrangerCard', config: compositionTools.arrangerCard },
    { kind: 'aiComposer', config: compositionTools.aiComposer },
  ];
  
  for (const { kind, config } of tools) {
    if (!config) {
      warnings.push({
        toolKind: kind,
        issue: `Tool config missing for ${kind}`,
        recommendation: `Add default config for ${kind}`,
      });
      continue;
    }
    
    const { enabled, mode } = config;
    const expectedModes = expected[kind] || [];
    
    // Enabled but hidden is redundant
    if (enabled && mode === 'hidden') {
      warnings.push({
        toolKind: kind,
        issue: `${kind} is enabled but mode is 'hidden'`,
        recommendation: `Set enabled: false or change mode`,
      });
    }
    
    // Disabled but non-hidden is confusing
    if (!enabled && mode !== 'hidden') {
      warnings.push({
        toolKind: kind,
        issue: `${kind} is disabled but mode is '${mode}'`,
        recommendation: `Set mode: 'hidden' or enabled: true`,
      });
    }
    
    // Mode not typical for control level
    if (enabled && expectedModes.length > 0 && !expectedModes.includes(mode)) {
      warnings.push({
        toolKind: kind,
        issue: `${kind} mode '${mode}' is unusual for control level '${controlLevel}'`,
        recommendation: `Typical modes: ${expectedModes.join(', ')}`,
      });
    }
    
    // Full manual with any enabled tools
    if (controlLevel === 'full-manual' && enabled) {
      warnings.push({
        toolKind: kind,
        issue: `${kind} is enabled in full-manual board`,
        recommendation: `Full-manual boards typically disable all tools`,
      });
    }
    
    // Generative with all hidden
    if (controlLevel === 'generative' && mode === 'hidden') {
      warnings.push({
        toolKind: kind,
        issue: `${kind} is hidden in generative board`,
        recommendation: `Generative boards typically enable generation tools`,
      });
    }
  }
  
  return warnings;
}

/**
 * Checks if a board has any tool config warnings.
 * 
 * @param board - The board to check
 * @returns True if there are warnings
 */
export function hasToolConfigWarnings(board: Board): boolean {
  return validateToolConfig(board).length > 0;
}

/**
 * Gets a summary of tool config warnings.
 * 
 * @param board - The board
 * @returns Human-readable summary
 * 
 * @example
 * ```ts
 * const summary = getToolConfigSummary(board);
 * // "3 warnings: phraseDatabase (enabled but hidden), ..."
 * ```
 */
export function getToolConfigSummary(board: Board): string {
  const warnings = validateToolConfig(board);
  
  if (warnings.length === 0) {
    return 'No tool config warnings';
  }
  
  const count = warnings.length;
  const toolNames = warnings.map(w => w.toolKind).join(', ');
  
  return `${count} warning${count > 1 ? 's' : ''}: ${toolNames}`;
}

/**
 * Applies safe defaults for missing tool config fields.
 * 
 * Returns a new board with safe defaults filled in.
 * Does not mutate the input board.
 * 
 * @param board - The board with potentially missing config
 * @returns Board with safe defaults applied
 * 
 * @example
 * ```ts
 * const fixedBoard = applySafeToolDefaults(board);
 * // Missing tools are set to { enabled: false, mode: 'hidden' }
 * ```
 */
export function applySafeToolDefaults(board: Board): Board {
  const { compositionTools } = board;
  
  const safeTools = {
    phraseDatabase: compositionTools.phraseDatabase || {
      enabled: false,
      mode: 'hidden' as const,
    },
    harmonyExplorer: compositionTools.harmonyExplorer || {
      enabled: false,
      mode: 'hidden' as const,
    },
    phraseGenerators: compositionTools.phraseGenerators || {
      enabled: false,
      mode: 'hidden' as const,
    },
    arrangerCard: compositionTools.arrangerCard || {
      enabled: false,
      mode: 'hidden' as const,
    },
    aiComposer: compositionTools.aiComposer || {
      enabled: false,
      mode: 'hidden' as const,
    },
  };
  
  return {
    ...board,
    compositionTools: safeTools,
  };
}
