/**
 * @fileoverview Project Creation
 *
 * Functions for creating new projects with default streams and clips.
 *
 * B074-B077: Implement project creation with seeded data.
 *
 * @module @cardplay/boards/project/create
 */

import type { Project } from './types';
import { DEFAULT_PROJECT } from './types';
import { getBoardContextStore } from '../context/store';

/**
 * Generates a unique ID (simple timestamp-based for now).
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates a new project with default stream and clip.
 *
 * B074-B077: Complete project creation implementation.
 *
 * @returns New project object with seeded stream/clip IDs
 */
export function createNewProject(name?: string): Project {
  const now = Date.now();
  
  // B075: Seed one stream (will be created in SharedEventStore by caller)
  const streamId = generateId('stream');
  
  // B076: Seed one clip (will be created in ClipRegistry by caller)
  const clipId = generateId('clip');

  // Create the project structure
  const project: Project = {
    ...DEFAULT_PROJECT,
    id: generateId('project'),
    name: name || `Untitled Project`,
    createdAt: now,
    modifiedAt: now,
    streamIds: [streamId],
    clipIds: [clipId],
  };

  // B077: Set active context to the seeded IDs
  const contextStore = getBoardContextStore();
  contextStore.setActiveStream(streamId);
  contextStore.setActiveClip(clipId);

  return project;
}

/**
 * Gets the stream ID and clip ID for a new project.
 * Useful for callers who need to create actual data in stores.
 */
export function getNewProjectSeedIds(project: Project): {
  streamId: string | null;
  clipId: string | null;
} {
  return {
    streamId: project.streamIds[0] || null,
    clipId: project.clipIds[0] || null,
  };
}

/**
 * Adds a stream to a project.
 */
export function addStreamToProject(project: Project, streamId: string): Project {
  if (project.streamIds.includes(streamId)) {
    return project;
  }

  return {
    ...project,
    streamIds: [...project.streamIds, streamId],
    modifiedAt: Date.now(),
  };
}

/**
 * Removes a stream from a project.
 */
export function removeStreamFromProject(project: Project, streamId: string): Project {
  const streamIds = project.streamIds.filter(id => id !== streamId);
  
  return {
    ...project,
    streamIds,
    modifiedAt: Date.now(),
  };
}

/**
 * Adds a clip to a project.
 */
export function addClipToProject(project: Project, clipId: string): Project {
  if (project.clipIds.includes(clipId)) {
    return project;
  }

  return {
    ...project,
    clipIds: [...project.clipIds, clipId],
    modifiedAt: Date.now(),
  };
}

/**
 * Removes a clip from a project.
 */
export function removeClipFromProject(project: Project, clipId: string): Project {
  const clipIds = project.clipIds.filter(id => id !== clipId);
  
  return {
    ...project,
    clipIds,
    modifiedAt: Date.now(),
  };
}
