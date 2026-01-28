/**
 * @fileoverview Containers barrel export.
 * 
 * @module @cardplay/core/containers
 */

export {
  // Types
  type ContainerId,
  type ContainerKind,
  type ContainerMeta,
  type LoopSettings,
  type Container,
  type Pattern,
  type Scene,
  type Clip,
  type Score,
  type Take,
  type Phrase,
  type Ref,
  type CreateContainerOptions,
  type ContainerJSON,
  // ID utilities
  generateContainerId,
  asContainerId,
  // Factories
  createContainer,
  createPattern,
  createClip,
  createScene,
  createPhrase,
  // Operations
  cloneContainer,
  containerDuration,
  containerBounds,
  resolveRef,
  resolveContainerRefs,
  // Serialization
  containerToJSON,
  containerFromJSON,
  // Merging and slicing
  mergeContainers,
  sliceContainer,
  loopContainer,
  // Pattern operations
  duplicatePattern,
  deletePattern,
  resizePattern,
  updatePatternProperties,
  assignPatternColor,
  namePattern,
  transposePattern,
  stretchPattern,
  doubleSpeedPattern,
  halfSpeedPattern,
  reversePattern,
  rotatePattern,
  shiftPattern,
  expandShrinkPattern,
  mergePatterns,
  splitPattern,
  clonePatternToNewTrack,
  exportPatternToMIDI,
  importPatternFromMIDI,
} from './container';
