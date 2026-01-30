/**
 * @fileoverview Project Exchange - Combined Export/Import API
 * 
 * Re-exports project exchange functionality from project-export and project-import.
 * 
 * @module @cardplay/export/project-exchange
 */

export {
  exportProject,
  type ProjectArchive,
  type ProjectExportOptions,
  type ExportProgress,
  type ProjectMetadata,
  type ProjectSample,
  type ProjectPreset,
  type ProjectAudioFile
} from './project-export';

export {
  importProject,
  type ImportResult,
  type ImportConflict,
  type ProjectImportOptions,
  type ImportProgress
} from './project-import';

// Re-export with unified names for convenience
export type { ImportResult as ProjectImportResult } from './project-import';
export type { ImportConflict as ImportConflictResolution } from './project-import';
export type { ProjectImportOptions as ImportOptions } from './project-import';

