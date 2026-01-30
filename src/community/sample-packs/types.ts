/**
 * Sample Pack System - Type Definitions
 * 
 * Provides bundled audio samples for quick project setup.
 * Complements deck packs by providing content for sampler/instrument decks.
 */

export type SampleCategory = 
  | 'drums'
  | 'bass'
  | 'leads'
  | 'pads'
  | 'fx'
  | 'percussion'
  | 'orchestral'
  | 'vocals'
  | 'ambience'
  | 'foley';

export type SamplePackDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SampleMetadata {
  /** Unique sample identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** File path or URL */
  path: string;
  
  /** Category for organization */
  category: SampleCategory;
  
  /** Tags for search */
  tags: string[];
  
  /** BPM (if rhythmic) */
  bpm?: number;
  
  /** Musical key (if tonal) */
  key?: string;
  
  /** Duration in seconds */
  duration?: number;
  
  /** File size in bytes */
  size?: number;
}

export interface SamplePack {
  /** Unique pack identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Short description */
  description: string;
  
  /** Primary category */
  category: SampleCategory;
  
  /** Difficulty level */
  difficulty: SamplePackDifficulty;
  
  /** Search tags */
  tags: string[];
  
  /** Creator information */
  author?: string;
  
  /** Version string */
  version: string;
  
  /** Icon/thumbnail path */
  icon?: string;
  
  /** Sample files in this pack */
  samples: SampleMetadata[];
  
  /** Total size of all samples */
  totalSize: number;
  
  /** Creation date */
  createdAt: string;
  
  /** Last update date */
  updatedAt: string;
}

export interface SamplePackInstallation {
  /** Pack that was installed */
  packId: string;
  
  /** When installed */
  installedAt: string;
  
  /** Installation path/location */
  installPath: string;
  
  /** Sample IDs that were installed */
  installedSamples: string[];
  
  /** Any installation notes/warnings */
  notes?: string;
}

export interface SamplePackRegistry {
  /** Get all available packs */
  getAllPacks(): SamplePack[];
  
  /** Get pack by ID */
  getPack(id: string): SamplePack | undefined;
  
  /** Search packs by text */
  search(query: string): SamplePack[];
  
  /** Filter by category */
  filterByCategory(category: SampleCategory): SamplePack[];
  
  /** Filter by difficulty */
  filterByDifficulty(difficulty: SamplePackDifficulty): SamplePack[];
  
  /** Filter by tags */
  filterByTags(tags: string[]): SamplePack[];
  
  /** Register a new pack */
  register(pack: SamplePack): void;
  
  /** Get installation history */
  getInstallations(): SamplePackInstallation[];
  
  /** Check if pack is installed */
  isInstalled(packId: string): boolean;
  
  /** Record installation */
  recordInstallation(installation: SamplePackInstallation): void;
}
