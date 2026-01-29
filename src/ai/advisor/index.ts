/**
 * @fileoverview Advisor module barrel exports
 * @module @cardplay/ai/advisor
 */

export {
  AIAdvisor,
  createAIAdvisor,
  type AdvisorContext,
  type AdvisorAnswer,
  type HostAction,
  type FollowUp,
  type QuestionCategory
} from './advisor-interface.js';

export {
  ConversationManager,
  createConversationManager,
  type ConversationTurn,
  type Bookmark,
  type ConversationSession
} from './conversation-manager.js';

export {
  handleBoardSpecificQuery,
  queryScoreLayout,
  queryDoublings,
  queryPageBreaks,
  queryPatternLength,
  querySampleSuggestion,
  querySwingInTracker,
  queryCreateSound,
  queryModulationForEffect,
  queryLayering,
  queryTrackStructure,
  queryMixBalance,
  queryMasteringLoudness,
  type BoardQueryContext,
} from './board-specific-queries.js';

// L311-L314: Advisor telemetry & feedback
export {
  enableAdvisorTelemetry,
  disableAdvisorTelemetry,
  isAdvisorTelemetryEnabled,
  recordAdvisorQuestion,
  reportIncorrectAnswer,
  getAdvisorCategoryStats,
  deriveAdvisorPatternWeights,
  getAdvisorFeedbackLog,
  getAdvisorFeedbackPriorities,
  getAdvisorTelemetrySummary,
  exportAdvisorTelemetry,
  importAdvisorTelemetry,
  resetAdvisorTelemetry,
  type QuestionEvent,
  type CategoryStats,
  type AnswerFeedback,
  type PatternWeight,
  type TelemetrySummary,
} from './advisor-telemetry.js';
