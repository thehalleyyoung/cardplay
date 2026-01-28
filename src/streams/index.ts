/**
 * @fileoverview Streams barrel export.
 * 
 * @module @cardplay/core/streams
 */

export {
  // Types
  type Stream,
  type StreamMeta,
  type EventStream,
  // Factories
  createStream,
  emptyStream,
  // Basic operations
  streamAppend,
  streamInsert,
  streamRemove,
  streamUpdate,
  streamFilter,
  streamMap,
  streamFlatMap,
  // Temporal operations
  streamSlice,
  streamMerge,
  streamSplit,
  streamQuantize,
  streamShift,
  streamStretch,
  streamReverse,
  // Pitch operations
  streamRetrograde,
  streamInvert,
  streamTranspose,
  // Query operations
  streamBounds,
  streamDuration,
  streamEventsAt,
  streamFindOverlapping,
  streamGetById,
  streamIsEmpty,
  streamLength,
  // Trimming and normalization
  streamTrim,
  streamNormalize,
  // Grouping
  streamGroupBy,
  streamGroupByKind,
} from './stream';
