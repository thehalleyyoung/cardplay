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
