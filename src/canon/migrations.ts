/**
 * @fileoverview State Migrations
 * 
 * Migration functions for upgrading persisted CardPlay state between
 * schema versions.
 * 
 * @module @cardplay/canon/migrations
 */

import {
  registerMigration,
  createSchemaVersion,
  type SchemaVersion,
} from './versioning';

// ============================================================================
// BOARD MIGRATIONS
// ============================================================================

/**
 * Board v1.0.0 → v2.0.0: Add panelId to BoardDeck
 * 
 * In v1, BoardDeck didn't have panelId, making deck-to-panel mapping implicit.
 * In v2, each BoardDeck must specify which panel it belongs to.
 */
interface BoardDeckV1 {
  deckType: string;
  label?: string;
  portConnections?: unknown[];
  initialCards?: unknown[];
}

interface BoardDeckV2 extends BoardDeckV1 {
  panelId: string;
}

interface BoardStateV1 {
  id: string;
  name: string;
  decks: BoardDeckV1[];
  layout?: {
    panels?: Array<{ id: string; deckTypes?: string[] }>;
  };
}

interface BoardStateV2 {
  id: string;
  name: string;
  decks: BoardDeckV2[];
  layout?: {
    panels?: Array<{ id: string; deckTypes?: string[] }>;
  };
}

function migrateBoardV1ToV2(data: unknown, _fromVersion: SchemaVersion): BoardStateV2 {
  const board = data as BoardStateV1;
  
  // Build a map from deckType to panelId based on layout.panels
  const deckTypeToPanel = new Map<string, string>();
  if (board.layout?.panels) {
    for (const panel of board.layout.panels) {
      if (panel.deckTypes) {
        for (const deckType of panel.deckTypes) {
          deckTypeToPanel.set(deckType, panel.id);
        }
      }
    }
  }
  
  // Migrate decks to include panelId
  const migratedDecks: BoardDeckV2[] = board.decks.map((deck, index) => {
    const panelId = deckTypeToPanel.get(deck.deckType) ?? `panel-${index}`;
    return {
      ...deck,
      panelId,
    };
  });
  
  return {
    ...board,
    decks: migratedDecks,
  };
}

// ============================================================================
// ROUTING MIGRATIONS
// ============================================================================

/**
 * Routing v1.0.0 → v1.1.0: Normalize port type vocabulary
 * 
 * Normalizes port types to canonical names (audio, midi, cv, trigger, clock).
 */
interface PortConnectionV1 {
  sourcePort: { type: string; name: string };
  targetPort: { type: string; name: string };
}

interface RoutingStateV1 {
  connections: PortConnectionV1[];
}

const PORT_TYPE_ALIASES: Record<string, string> = {
  'audio-stereo': 'audio',
  'audio-mono': 'audio',
  'stereo': 'audio',
  'mono': 'audio',
  'note': 'midi',
  'midi-note': 'midi',
  'gate': 'trigger',
  'sync': 'clock',
  'tempo': 'clock',
};

function normalizePortType(type: string): string {
  return PORT_TYPE_ALIASES[type] ?? type;
}

function migrateRoutingV1ToV1_1(data: unknown, _fromVersion: SchemaVersion): RoutingStateV1 {
  const routing = data as RoutingStateV1;
  
  return {
    connections: routing.connections.map(conn => ({
      sourcePort: {
        ...conn.sourcePort,
        type: normalizePortType(conn.sourcePort.type),
      },
      targetPort: {
        ...conn.targetPort,
        type: normalizePortType(conn.targetPort.type),
      },
    })),
  };
}

// ============================================================================
// EVENT MIGRATIONS
// ============================================================================

/**
 * Events v1.0.0 → v1.1.0: Normalize EventKind names
 * 
 * Normalizes event kinds from snake_case to camelCase.
 */
interface EventV1 {
  kind: string;
  tick: number;
  data?: unknown;
}

interface EventHistoryV1 {
  events: EventV1[];
}

const EVENT_KIND_ALIASES: Record<string, string> = {
  'note_on': 'noteOn',
  'note_off': 'noteOff',
  'control_change': 'controlChange',
  'pitch_bend': 'pitchBend',
  'program_change': 'programChange',
  'after_touch': 'afterTouch',
  'poly_pressure': 'polyPressure',
};

function normalizeEventKind(kind: string): string {
  return EVENT_KIND_ALIASES[kind] ?? kind;
}

function migrateEventsV1ToV1_1(data: unknown, _fromVersion: SchemaVersion): EventHistoryV1 {
  const history = data as EventHistoryV1;
  
  return {
    events: history.events.map(event => ({
      ...event,
      kind: normalizeEventKind(event.kind),
    })),
  };
}

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register all standard migrations.
 * Call this once at application startup.
 */
export function registerStandardMigrations(): void {
  // Board migrations
  registerMigration(
    'board',
    createSchemaVersion(1, 0, 0),
    createSchemaVersion(2, 0, 0),
    migrateBoardV1ToV2
  );
  
  // Routing migrations
  registerMigration(
    'routing',
    createSchemaVersion(1, 0, 0),
    createSchemaVersion(1, 1, 0),
    migrateRoutingV1ToV1_1
  );
  
  // Event migrations
  registerMigration(
    'events',
    createSchemaVersion(1, 0, 0),
    createSchemaVersion(1, 1, 0),
    migrateEventsV1ToV1_1
  );
}

// ============================================================================
// MIGRATION RUNNER
// ============================================================================

import {
  type VersionedState,
  parseSchemaVersion,
  formatSchemaVersion,
  compareVersions,
  getMigrations,
  CURRENT_SCHEMA_VERSIONS,
} from './versioning';

/**
 * Apply migrations to bring state up to current version.
 */
export function migrateState<T>(state: VersionedState<T>): VersionedState<T> {
  const sourceVersion = parseSchemaVersion(state.schemaVersion);
  if (!sourceVersion) {
    throw new Error(`Invalid schema version: ${state.schemaVersion}`);
  }
  
  const targetVersion = CURRENT_SCHEMA_VERSIONS[state.schemaType];
  if (compareVersions(sourceVersion, targetVersion) >= 0) {
    // Already at or beyond current version
    return state;
  }
  
  // Find applicable migrations
  const migrations = getMigrations(state.schemaType);
  const applicableMigrations = migrations
    .filter(m => 
      compareVersions(m.from, sourceVersion) >= 0 &&
      compareVersions(m.to, targetVersion) <= 0
    )
    .sort((a, b) => compareVersions(a.from, b.from));
  
  // Apply migrations in order
  let currentData = state.data as unknown;
  let currentVersion = sourceVersion;
  
  for (const migration of applicableMigrations) {
    if (compareVersions(migration.from, currentVersion) === 0) {
      currentData = migration.migrate(currentData, currentVersion);
      currentVersion = migration.to;
    }
  }
  
  return {
    ...state,
    schemaVersion: formatSchemaVersion(currentVersion),
    data: currentData as T,
    timestamp: new Date().toISOString(),
  };
}
