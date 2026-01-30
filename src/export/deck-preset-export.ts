/**
 * Deck preset export system
 * Allows sharing deck configurations (parameters + routing + clips)
 */

import type { DeckType } from '../boards/types';
import type { DeckRuntimeState } from '../boards/decks/runtime-types';
import type { ClipId } from '../state/types';
import type { RoutingConnection } from '../state/types';

export interface DeckPresetManifest {
  version: '1.0';
  type: 'deck-preset';
  exportedAt: string;
  cardplayVersion: string;
}

export interface DeckPresetData {
  manifest: DeckPresetManifest;
  deckType: DeckType;
  deckState: DeckRuntimeState;
  clips?: ClipId[];
  routing?: RoutingConnection[];
  parameters?: Record<string, unknown>;
  metadata: {
    name: string;
    description?: string;
    author?: string;
    tags?: readonly string[];
    category?: string;
    createdAt: string;
  };
}

export interface DeckPresetImportOptions {
  preserveClipIds?: boolean;
  preserveRouting?: boolean;
  validateOnly?: boolean;
}

export interface DeckPresetImportResult {
  success: boolean;
  deckType?: DeckType;
  deckState?: DeckRuntimeState;
  clips?: ClipId[];
  routing?: RoutingConnection[];
  parameters?: Record<string, unknown>;
  errors?: readonly string[];
  warnings?: readonly string[];
}

/**
 * Export a deck preset to JSON
 */
export function exportDeckPreset(
  deckType: DeckType,
  deckState: DeckRuntimeState,
  options: {
    clips?: ClipId[];
    routing?: RoutingConnection[];
    parameters?: Record<string, unknown>;
    metadata?: Partial<DeckPresetData['metadata']>;
  } = {}
): DeckPresetData {
  const now = new Date().toISOString();
  
  const result: DeckPresetData = {
    manifest: {
      version: '1.0',
      type: 'deck-preset',
      exportedAt: now,
      cardplayVersion: '1.0.0'
    },
    deckType,
    deckState,
    metadata: {
      name: options.metadata?.name || `${deckType} Preset`,
      createdAt: options.metadata?.createdAt || now
    }
  };

  if (options.clips) result.clips = options.clips;
  if (options.routing) result.routing = options.routing;
  if (options.parameters) result.parameters = options.parameters;
  if (options.metadata?.description) result.metadata.description = options.metadata.description;
  if (options.metadata?.author) result.metadata.author = options.metadata.author;
  if (options.metadata?.tags) result.metadata.tags = options.metadata.tags;
  if (options.metadata?.category) result.metadata.category = options.metadata.category;

  return result;
}

/**
 * Import a deck preset from JSON
 */
export function importDeckPreset(
  data: DeckPresetData,
  options: DeckPresetImportOptions = {}
): DeckPresetImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate manifest
  if (data.manifest.type !== 'deck-preset') {
    errors.push(`Invalid export type: ${data.manifest.type}`);
    return { success: false, errors };
  }

  if (data.manifest.version !== '1.0') {
    warnings.push(`Preset was exported with version ${data.manifest.version}, may have compatibility issues`);
  }

  // Validate preset structure
  if (!data.deckType) {
    errors.push('Missing deck type');
    return { success: false, errors };
  }

  if (!data.deckState) {
    errors.push('Missing deck state');
    return { success: false, errors };
  }

  if (options.validateOnly) {
    return { success: true, warnings };
  }

  // Clone data
  const result: DeckPresetImportResult = {
    success: true,
    deckType: data.deckType,
    deckState: { ...data.deckState }
  };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  // Handle clips
  if (data.clips && options.preserveClipIds) {
    result.clips = [...data.clips];
  } else if (data.clips) {
    warnings.push('Clip IDs will not be preserved');
  }

  // Handle routing
  if (data.routing && options.preserveRouting) {
    result.routing = data.routing.map(conn => ({ ...conn }));
  }

  // Handle parameters
  if (data.parameters) {
    result.parameters = { ...data.parameters };
  }

  return result;
}

/**
 * Serialize deck preset to JSON string
 */
export function serializeDeckPreset(data: DeckPresetData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse deck preset from JSON string
 */
export function parseDeckPreset(json: string): DeckPresetData {
  return JSON.parse(json);
}

/**
 * Create a downloadable deck preset file
 */
export function downloadDeckPreset(
  deckType: DeckType,
  deckState: DeckRuntimeState,
  options: Parameters<typeof exportDeckPreset>[2] = {}
): void {
  const data = exportDeckPreset(deckType, deckState, options);
  const json = serializeDeckPreset(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.metadata.name.replace(/\s+/g, '-').toLowerCase()}.cardplay-deck.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Check if a deck preset is compatible with current version
 */
export function checkDeckPresetCompatibility(data: DeckPresetData): {
  compatible: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check version
  if (data.manifest.version !== '1.0') {
    warnings.push(`Preset uses version ${data.manifest.version}, current version is 1.0`);
  }

  // Check required fields
  if (!data.deckType) {
    issues.push('Missing deck type');
  }

  if (!data.deckState) {
    issues.push('Missing deck state');
  }

  // Check deck state structure
  if (data.deckState) {
    // DeckRuntimeState uses activeTabId not activeCards
    if (typeof data.deckState !== 'object') {
      issues.push('Invalid deckState structure');
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
    warnings
  };
}
