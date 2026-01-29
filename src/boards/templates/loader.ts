/**
 * Template Loader
 *
 * Loads project templates into the application state (event store, clip registry, etc.)
 */

import type { ProjectTemplate, TemplateLoadResult } from './types';
import type { BoardId } from '../types';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getBoardContextStore } from '../context/store';
import { asEventId } from '../../types/event-id';
import { EventKinds } from '../../types/event-kind';

/**
 * Load a project template into the current state
 */
export async function loadTemplate(
  template: ProjectTemplate
): Promise<TemplateLoadResult> {
  try {
    const eventStore = getSharedEventStore();
    const clipRegistry = getClipRegistry();
    const contextStore = getBoardContextStore();

    const streamIds: string[] = [];
    const clipIds: string[] = [];

    // Create streams
    for (const templateStream of template.streams) {
      const stream = eventStore.createStream({
        name: templateStream.name,
        events: templateStream.events.map((e: any) => ({
          ...e,
          id: asEventId(e.id || `evt_${Date.now()}_${Math.random()}`),
          kind: e.kind || EventKinds.NOTE,
        })),
      });
      streamIds.push(stream.id);
    }

    // Create clips
    for (const templateClip of template.clips) {
      // Find matching stream ID
      const templateStreamIndex = template.streams.findIndex(
        (s) => s.id === templateClip.streamId
      );
      if (templateStreamIndex === -1) {
        console.warn(
          `Template clip ${templateClip.id} references unknown stream ${templateClip.streamId}`
        );
        continue;
      }
      const actualStreamId = streamIds[templateStreamIndex];
      if (!actualStreamId) {
        console.warn(
          `Template clip ${templateClip.id} references stream at invalid index ${templateStreamIndex}`
        );
        continue;
      }

      const clip = clipRegistry.createClip({
        name: templateClip.name,
        streamId: actualStreamId,
        ...(templateClip.color !== undefined ? { color: templateClip.color } : {}),
        loop: templateClip.loop ?? false,
      });
      clipIds.push(clip.id);
    }

    // Set active context to first stream/clip
    if (streamIds.length > 0 && streamIds[0]) {
      contextStore.setActiveStream(streamIds[0]);
    }
    if (clipIds.length > 0 && clipIds[0]) {
      contextStore.setActiveClip(clipIds[0]);
    }

    return {
      success: true,
      streamIds,
      clipIds,
    };
  } catch (error) {
    console.error('Failed to load template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export current project as a template
 */
export async function exportAsTemplate(
  metadata: ProjectTemplate['metadata']
): Promise<ProjectTemplate> {
  const eventStore = getSharedEventStore();
  const clipRegistry = getClipRegistry();
  const boardStateStore = (await import('../store/store')).getBoardStateStore();

  const state = boardStateStore.getState();
  const allStreams = eventStore.getAllStreams();
  const allClips = clipRegistry.getAllClips();

  const templateStreams: ProjectTemplate['streams'] = allStreams.map((stream) => ({
    id: stream.id,
    name: stream.name,
    events: stream.events,
    ...(stream.color !== undefined ? { color: stream.color } : {}),
  }));

  const templateClips: ProjectTemplate['clips'] = allClips.map((clip) => ({
    id: clip.id,
    name: clip.name,
    streamId: clip.streamId,
    ...(clip.color !== undefined ? { color: clip.color } : {}),
    ...(clip.loop !== undefined ? { loop: clip.loop } : {}),
  }));

  const currentBoardId = state.currentBoardId ?? ('basic-tracker' as BoardId);
  
  return {
    metadata,
    streams: templateStreams,
    clips: templateClips,
    board: {
      boardId: currentBoardId,
      layoutState: state.perBoardLayout[currentBoardId],
      deckState: state.perBoardDeckState[currentBoardId],
    },
    readme: `# ${metadata.name}\n\n${metadata.description}`,
  };
}
