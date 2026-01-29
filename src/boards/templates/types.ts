/**
 * Project Template System Types
 *
 * Defines structure for project templates that can be loaded as starting points
 * for new projects. Templates include board configurations, initial streams/clips,
 * and metadata.
 */

import type { BoardId } from '../types';
import type { EventStreamId } from '../../state/event-store';
import type { ClipId } from '../../state/clip-registry';

/**
 * Template difficulty level
 */
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Template genre/category
 */
export type TemplateGenre =
  | 'electronic'
  | 'hip-hop'
  | 'ambient'
  | 'orchestral'
  | 'jazz'
  | 'rock'
  | 'experimental'
  | 'sound-design'
  | 'general';

/**
 * Template metadata
 */
export interface TemplateMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly genre: TemplateGenre;
  readonly difficulty: TemplateDifficulty;
  readonly estimatedTime: string; // e.g., "30min", "1-2hrs"
  readonly tags: readonly string[];
  readonly author?: string;
  readonly version: string;
  readonly createdAt: string; // ISO date string
  readonly thumbnail?: string; // base64 or URL
}

/**
 * Stream definition in template
 */
export interface TemplateStream {
  readonly id: string;
  readonly name: string;
  readonly events: readonly any[]; // Event objects
  readonly color?: string;
}

/**
 * Clip definition in template
 */
export interface TemplateClip {
  readonly id: string;
  readonly name: string;
  readonly streamId: string; // References TemplateStream.id
  readonly color?: string;
  readonly loop?: boolean;
  readonly startOffset?: number;
  readonly endOffset?: number;
}

/**
 * Board configuration in template
 */
export interface TemplateBoardConfig {
  readonly boardId: BoardId;
  readonly layoutState?: any;
  readonly deckState?: any;
}

/**
 * Complete project template
 */
export interface ProjectTemplate {
  readonly metadata: TemplateMetadata;
  readonly streams: readonly TemplateStream[];
  readonly clips: readonly TemplateClip[];
  readonly board: TemplateBoardConfig;
  readonly readme?: string; // Markdown content explaining the template
}

/**
 * Template preview information (lightweight for browsing)
 */
export interface TemplatePreview {
  readonly metadata: TemplateMetadata;
  readonly streamCount: number;
  readonly clipCount: number;
  readonly boardId: BoardId;
}

/**
 * Template search filters
 */
export interface TemplateSearchFilters {
  readonly genre?: TemplateGenre;
  readonly difficulty?: TemplateDifficulty;
  readonly tags?: readonly string[];
  readonly searchText?: string;
}

/**
 * Result of template loading
 */
export interface TemplateLoadResult {
  readonly success: boolean;
  readonly streamIds?: readonly EventStreamId[];
  readonly clipIds?: readonly ClipId[];
  readonly error?: string;
}
