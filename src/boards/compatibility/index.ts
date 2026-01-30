/**
 * @fileoverview Board Compatibility Module
 * 
 * Handles project compatibility checking and migration paths when
 * loading projects that use tools/cards disabled in the current board.
 */

export {
  type CompatibilityIssue,
  type CompatibilityCheckResult,
  type ProjectMetadata,
  checkProjectCompatibility,
  extractProjectMetadata,
  createWarningMessage,
} from './project-compatibility';

export {
  showCompatibilityWarning,
  hideCompatibilityWarning,
} from './warning-banner';
