/**
 * @file Song Fixture Format for GOFAI Testing
 * @module gofai/testing/song-fixture-format
 * 
 * Implements Step 027: Define a minimal "song fixture" format for tests
 * (small project state snapshots that can be diffed deterministically).
 * 
 * A song fixture is a minimal, deterministic representation of CardPlay project
 * state designed for:
 * - Golden test inputs (NL→CPL, CPL→Plan, Plan→Diff)
 * - Regression testing (same fixture → same output)
 * - Constraint verification (check preserved aspects)
 * - Performance benchmarking (reproducible workloads)
 * - Bug reproduction (minimal repro cases)
 * 
 * Design principles:
 * - Deterministic: Binary-equivalent serialization across runs
 * - Minimal: Only essential state, no UI/cache/ephemeral data
 * - Diff-friendly: JSON with stable ordering and readable IDs
 * - Versioned: Schema versioning with migration paths
 * - Portable: Can be shared across machines/versions
 * 
 * @see gofai_goalB.md Step 027
 * @see gofaimusicplus.md §4.1 (fixtures for testing)
 */

import type { 
  EventId, 
  Tick, 
  TickDuration, 
  EventKind,
} from '../../types/index.js';

// Branded ID types for fixture format
type Branded<T, B> = T & { readonly __brand: B };

/** Track identifier */
export type TrackId = Branded<string, 'TrackId'>;

/** Section identifier */
export type SectionId = Branded<string, 'SectionId'>;

/** Card identifier */
export type CardId = Branded<string, 'CardId'>;

/** Generic CardPlay entity identifier */
export type CardPlayId = string;

// ============================================================================
// Fixture Schema Version
// ============================================================================

/**
 * Current fixture format version.
 * 
 * Version history:
 * - v1.0.0: Initial format
 */
export const FIXTURE_FORMAT_VERSION = '1.0.0';

/**
 * Minimum supported fixture version.
 */
export const MIN_FIXTURE_VERSION = '1.0.0';

/**
 * Fixture schema version.
 */
export interface FixtureVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/**
 * Parse version string into structured version.
 */
export function parseFixtureVersion(version: string): FixtureVersion {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid fixture version: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Check if a fixture version is supported.
 */
export function isFixtureVersionSupported(version: string): boolean {
  try {
    const parsed = parseFixtureVersion(version);
    const minVersion = parseFixtureVersion(MIN_FIXTURE_VERSION);
    return parsed.major === minVersion.major && parsed.minor >= minVersion.minor;
  } catch {
    return false;
  }
}

// ============================================================================
// Song Fixture Type
// ============================================================================

/**
 * A minimal, deterministic project state snapshot for testing.
 * 
 * Contains only the essential state needed for GOFAI testing:
 * - Musical structure (sections, bars, tempo)
 * - Events (notes, chords, automation)
 * - Tracks and routing (simplified)
 * - Cards and parameters (where relevant)
 * - Selection state (for context-dependent tests)
 * 
 * Excludes:
 * - UI state (viewport, zoom, panels)
 * - Cache data (waveforms, analysis)
 * - Ephemeral state (playback position, temporary selections)
 * - History/undo (tests focus on single states)
 */
export interface SongFixture {
  /** Fixture metadata */
  readonly meta: FixtureMeta;
  
  /** Musical structure */
  readonly structure: FixtureStructure;
  
  /** Events (notes, chords, etc.) */
  readonly events: readonly FixtureEvent[];
  
  /** Tracks */
  readonly tracks: readonly FixtureTrack[];
  
  /** Cards (where relevant to test) */
  readonly cards: readonly FixtureCard[];
  
  /** Routing connections (simplified) */
  readonly routing: readonly FixtureConnection[];
  
  /** Current selection state (optional) */
  readonly selection?: FixtureSelection;
  
  /** Test-specific annotations (optional) */
  readonly annotations?: FixtureAnnotations;
}

// ============================================================================
// Fixture Metadata
// ============================================================================

/**
 * Fixture metadata.
 */
export interface FixtureMeta {
  /** Fixture ID (stable, human-readable) */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description of what this fixture represents */
  readonly description: string;
  
  /** Fixture format version */
  readonly version: string;
  
  /** When this fixture was created (ISO 8601) */
  readonly createdAt: string;
  
  /** Tags for categorization */
  readonly tags: readonly string[];
  
  /** Source/origin (e.g., "minimal_chorus", "four_bar_beat") */
  readonly source?: string;
}

// ============================================================================
// Musical Structure
// ============================================================================

/**
 * Musical structure (sections, tempo, meter).
 */
export interface FixtureStructure {
  /** Total length in ticks */
  readonly lengthTicks: Tick;
  
  /** Total length in bars */
  readonly lengthBars: number;
  
  /** Tempo (BPM, constant for simplicity) */
  readonly tempoBpm: number;
  
  /** Time signature (constant for simplicity) */
  readonly timeSignature: {
    readonly numerator: number;
    readonly denominator: number;
  };
  
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
  
  /** Section markers */
  readonly sections: readonly FixtureSection[];
}

/**
 * A section marker in the fixture.
 */
export interface FixtureSection {
  /** Section ID (stable) */
  readonly id: SectionId;
  
  /** Section type (verse, chorus, bridge, etc.) */
  readonly type: string;
  
  /** Display name */
  readonly name: string;
  
  /** Start position in ticks */
  readonly startTick: Tick;
  
  /** End position in ticks */
  readonly endTick: Tick;
  
  /** Start bar number (1-indexed) */
  readonly startBar: number;
  
  /** End bar number (1-indexed) */
  readonly endBar: number;
}

// ============================================================================
// Events
// ============================================================================

/**
 * A musical event in the fixture.
 * 
 * Simplified representation focusing on data relevant to GOFAI testing.
 */
export interface FixtureEvent {
  /** Event ID (stable) */
  readonly id: EventId;
  
  /** Event kind */
  readonly kind: EventKind;
  
  /** Start position in ticks */
  readonly startTick: Tick;
  
  /** Duration in ticks */
  readonly durationTicks: TickDuration;
  
  /** Which track this event belongs to */
  readonly trackId: TrackId;
  
  /** Event payload (kind-specific) */
  readonly payload: FixtureEventPayload;
  
  /** Tags (for selection and categorization) */
  readonly tags: readonly string[];
}

/**
 * Event payload types.
 */
export type FixtureEventPayload =
  | FixtureNotePayload
  | FixtureChordPayload
  | FixtureAutomationPayload;

/**
 * Note event payload.
 */
export interface FixtureNotePayload {
  readonly type: 'note';
  
  /** MIDI pitch (0-127) */
  readonly pitch: number;
  
  /** Velocity (0-127) */
  readonly velocity: number;
  
  /** Note name (e.g., "C4", "Db3") */
  readonly noteName?: string;
}

/**
 * Chord event payload.
 */
export interface FixtureChordPayload {
  readonly type: 'chord';
  
  /** Root pitch class (0-11) */
  readonly root: number;
  
  /** Quality (major, minor, etc.) */
  readonly quality: string;
  
  /** Extensions (7, 9, 11, 13, etc.) */
  readonly extensions: readonly number[];
  
  /** Chord symbol (e.g., "Cmaj7", "Dm9") */
  readonly symbol: string;
}

/**
 * Automation event payload.
 */
export interface FixtureAutomationPayload {
  readonly type: 'automation';
  
  /** Parameter being automated */
  readonly parameter: string;
  
  /** Value at this point */
  readonly value: number;
  
  /** Interpolation curve */
  readonly curve?: 'linear' | 'exponential' | 'step';
}

// ============================================================================
// Tracks
// ============================================================================

/**
 * A track in the fixture.
 */
export interface FixtureTrack {
  /** Track ID (stable) */
  readonly id: TrackId;
  
  /** Track name */
  readonly name: string;
  
  /** Track role/instrument (drums, bass, vocals, etc.) */
  readonly role: string;
  
  /** Track type (midi, audio, automation) */
  readonly type: 'midi' | 'audio' | 'automation';
  
  /** Whether track is muted */
  readonly muted: boolean;
  
  /** Whether track is soloed */
  readonly soloed: boolean;
  
  /** Gain (0.0-1.0) */
  readonly gain: number;
  
  /** Pan (-1.0 to 1.0) */
  readonly pan: number;
  
  /** Color (hex) */
  readonly color?: string;
}

// ============================================================================
// Cards
// ============================================================================

/**
 * A card in the fixture.
 * 
 * Only includes cards relevant to the test scenario.
 */
export interface FixtureCard {
  /** Card ID (stable) */
  readonly id: CardId;
  
  /** Card type (reverb, eq, synth, etc.) */
  readonly type: string;
  
  /** Card name/label */
  readonly name: string;
  
  /** Which track this card is on */
  readonly trackId: TrackId;
  
  /** Position in track's card stack */
  readonly position: number;
  
  /** Card parameters */
  readonly parameters: readonly FixtureCardParameter[];
  
  /** Whether card is bypassed */
  readonly bypassed: boolean;
}

/**
 * A card parameter value.
 */
export interface FixtureCardParameter {
  /** Parameter ID */
  readonly id: string;
  
  /** Parameter display name */
  readonly name: string;
  
  /** Current value */
  readonly value: number | string | boolean;
  
  /** Min value (for numeric params) */
  readonly min?: number;
  
  /** Max value (for numeric params) */
  readonly max?: number;
  
  /** Unit (Hz, dB, ms, etc.) */
  readonly unit?: string;
}

// ============================================================================
// Routing
// ============================================================================

/**
 * A routing connection in the fixture.
 */
export interface FixtureConnection {
  /** Connection ID (stable) */
  readonly id: string;
  
  /** Source track ID */
  readonly sourceTrackId: TrackId;
  
  /** Source port name */
  readonly sourcePort: string;
  
  /** Target track ID */
  readonly targetTrackId: TrackId;
  
  /** Target port name */
  readonly targetPort: string;
  
  /** Signal type (audio, midi, control) */
  readonly signalType: 'audio' | 'midi' | 'control';
}

// ============================================================================
// Selection State
// ============================================================================

/**
 * Current selection state (for context-dependent tests).
 */
export interface FixtureSelection {
  /** Selected time range */
  readonly timeRange?: {
    readonly startTick: Tick;
    readonly endTick: Tick;
  };
  
  /** Selected bar range */
  readonly barRange?: {
    readonly startBar: number;
    readonly endBar: number;
  };
  
  /** Selected section IDs */
  readonly sectionIds: readonly SectionId[];
  
  /** Selected track IDs */
  readonly trackIds: readonly TrackId[];
  
  /** Selected event IDs */
  readonly eventIds: readonly EventId[];
  
  /** Selected card IDs */
  readonly cardIds: readonly CardId[];
  
  /** Focused entity (most salient) */
  readonly focused?: {
    readonly type: 'section' | 'track' | 'event' | 'card';
    readonly id: CardPlayId;
  };
}

// ============================================================================
// Test Annotations
// ============================================================================

/**
 * Test-specific annotations.
 * 
 * These provide additional context for tests without being part of the
 * core project state.
 */
export interface FixtureAnnotations {
  /** Expected constraints for this fixture */
  readonly expectedConstraints?: readonly string[];
  
  /** Known musical properties */
  readonly musicalProperties?: {
    readonly key?: string;
    readonly mode?: string;
    readonly genre?: string;
    readonly style?: string;
  };
  
  /** Test assertions */
  readonly assertions?: readonly FixtureAssertion[];
  
  /** Arbitrary test metadata */
  readonly custom?: Record<string, unknown>;
}

/**
 * A test assertion about the fixture.
 */
export interface FixtureAssertion {
  /** Assertion ID */
  readonly id: string;
  
  /** Assertion description */
  readonly description: string;
  
  /** What to assert */
  readonly assertion: string;
  
  /** Expected result */
  readonly expected: unknown;
}

// ============================================================================
// Fixture Creation and Validation
// ============================================================================

/**
 * Create a minimal fixture from scratch.
 */
export function createMinimalFixture(options: {
  id: string;
  name: string;
  description: string;
  lengthBars?: number;
  tempoBpm?: number;
  timeSignature?: { numerator: number; denominator: number };
}): SongFixture {
  const {
    id,
    name,
    description,
    lengthBars = 8,
    tempoBpm = 120,
    timeSignature = { numerator: 4, denominator: 4 },
  } = options;

  const ticksPerQuarter = 480;
  const ticksPerBar = ticksPerQuarter * timeSignature.numerator;
  const lengthTicks = (ticksPerBar * lengthBars) as Tick;

  return {
    meta: {
      id,
      name,
      description,
      version: FIXTURE_FORMAT_VERSION,
      createdAt: new Date().toISOString(),
      tags: [],
    },
    structure: {
      lengthTicks,
      lengthBars,
      tempoBpm,
      timeSignature,
      ticksPerQuarter,
      sections: [],
    },
    events: [],
    tracks: [],
    cards: [],
    routing: [],
  };
}

/**
 * Validation result for a fixture.
 */
export interface FixtureValidationResult {
  readonly valid: boolean;
  readonly errors: readonly FixtureValidationError[];
  readonly warnings: readonly FixtureValidationWarning[];
}

/**
 * A validation error.
 */
export interface FixtureValidationError {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly context?: Record<string, unknown>;
}

/**
 * A validation warning.
 */
export interface FixtureValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Validate a fixture.
 */
export function validateFixture(fixture: SongFixture): FixtureValidationResult {
  const errors: FixtureValidationError[] = [];
  const warnings: FixtureValidationWarning[] = [];

  // Validate version
  if (!isFixtureVersionSupported(fixture.meta.version)) {
    errors.push({
      code: 'UNSUPPORTED_VERSION',
      message: `Fixture version ${fixture.meta.version} is not supported`,
      path: 'meta.version',
    });
  }

  // Validate structure
  if (fixture.structure.lengthBars <= 0) {
    errors.push({
      code: 'INVALID_LENGTH',
      message: 'Length must be positive',
      path: 'structure.lengthBars',
    });
  }

  if (fixture.structure.tempoBpm <= 0 || fixture.structure.tempoBpm > 300) {
    errors.push({
      code: 'INVALID_TEMPO',
      message: 'Tempo must be between 1 and 300 BPM',
      path: 'structure.tempoBpm',
    });
  }

  // Validate events
  for (let i = 0; i < fixture.events.length; i++) {
    const event = fixture.events[i];
    
    if (event.startTick < 0 || event.startTick >= fixture.structure.lengthTicks) {
      errors.push({
        code: 'EVENT_OUT_OF_BOUNDS',
        message: `Event ${event.id} starts outside fixture bounds`,
        path: `events[${i}].startTick`,
        context: { eventId: event.id },
      });
    }

    const endTick = (event.startTick + event.durationTicks) as Tick;
    if (endTick > fixture.structure.lengthTicks) {
      warnings.push({
        code: 'EVENT_EXTENDS_PAST_END',
        message: `Event ${event.id} extends past fixture end`,
        path: `events[${i}]`,
        context: { eventId: event.id },
      });
    }

    // Validate event belongs to an existing track
    const trackExists = fixture.tracks.some(t => t.id === event.trackId);
    if (!trackExists) {
      errors.push({
        code: 'EVENT_ORPHAN',
        message: `Event ${event.id} references non-existent track ${event.trackId}`,
        path: `events[${i}].trackId`,
        context: { eventId: event.id, trackId: event.trackId },
      });
    }
  }

  // Validate tracks
  const trackIds = new Set<TrackId>();
  for (let i = 0; i < fixture.tracks.length; i++) {
    const track = fixture.tracks[i];
    
    if (trackIds.has(track.id)) {
      errors.push({
        code: 'DUPLICATE_TRACK_ID',
        message: `Duplicate track ID: ${track.id}`,
        path: `tracks[${i}].id`,
        context: { trackId: track.id },
      });
    }
    trackIds.add(track.id);

    if (track.gain < 0 || track.gain > 1) {
      errors.push({
        code: 'INVALID_GAIN',
        message: `Track ${track.id} gain must be between 0 and 1`,
        path: `tracks[${i}].gain`,
        context: { trackId: track.id },
      });
    }

    if (track.pan < -1 || track.pan > 1) {
      errors.push({
        code: 'INVALID_PAN',
        message: `Track ${track.id} pan must be between -1 and 1`,
        path: `tracks[${i}].pan`,
        context: { trackId: track.id },
      });
    }
  }

  // Validate cards
  for (let i = 0; i < fixture.cards.length; i++) {
    const card = fixture.cards[i];
    
    const trackExists = fixture.tracks.some(t => t.id === card.trackId);
    if (!trackExists) {
      errors.push({
        code: 'CARD_ORPHAN',
        message: `Card ${card.id} references non-existent track ${card.trackId}`,
        path: `cards[${i}].trackId`,
        context: { cardId: card.id, trackId: card.trackId },
      });
    }
  }

  // Validate routing
  for (let i = 0; i < fixture.routing.length; i++) {
    const conn = fixture.routing[i];
    
    const sourceExists = fixture.tracks.some(t => t.id === conn.sourceTrackId);
    if (!sourceExists) {
      errors.push({
        code: 'ROUTING_SOURCE_MISSING',
        message: `Connection ${conn.id} references non-existent source track`,
        path: `routing[${i}].sourceTrackId`,
        context: { connectionId: conn.id },
      });
    }

    const targetExists = fixture.tracks.some(t => t.id === conn.targetTrackId);
    if (!targetExists) {
      errors.push({
        code: 'ROUTING_TARGET_MISSING',
        message: `Connection ${conn.id} references non-existent target track`,
        path: `routing[${i}].targetTrackId`,
        context: { connectionId: conn.id },
      });
    }
  }

  // Validate sections
  for (let i = 0; i < fixture.structure.sections.length; i++) {
    const section = fixture.structure.sections[i];
    
    if (section.startTick >= section.endTick) {
      errors.push({
        code: 'INVALID_SECTION_RANGE',
        message: `Section ${section.id} has invalid range`,
        path: `structure.sections[${i}]`,
        context: { sectionId: section.id },
      });
    }

    if (section.startTick < 0 || section.endTick > fixture.structure.lengthTicks) {
      errors.push({
        code: 'SECTION_OUT_OF_BOUNDS',
        message: `Section ${section.id} extends outside fixture bounds`,
        path: `structure.sections[${i}]`,
        context: { sectionId: section.id },
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Fixture Serialization
// ============================================================================

/**
 * Serialize a fixture to JSON string with deterministic ordering.
 */
export function serializeFixture(fixture: SongFixture): string {
  return JSON.stringify(fixture, null, 2);
}

/**
 * Deserialize a fixture from JSON string.
 */
export function deserializeFixture(json: string): SongFixture {
  const fixture = JSON.parse(json) as SongFixture;
  
  // Validate after deserialization
  const validation = validateFixture(fixture);
  if (!validation.valid) {
    throw new Error(
      `Invalid fixture: ${validation.errors.map(e => e.message).join(', ')}`
    );
  }
  
  return fixture;
}

// ============================================================================
// Fixture Comparison and Diffing
// ============================================================================

/**
 * Compare two fixtures for equality.
 */
export function compareFixtures(a: SongFixture, b: SongFixture): boolean {
  // Deep equality check with deterministic serialization
  return serializeFixture(a) === serializeFixture(b);
}

/**
 * Generate a diff between two fixtures.
 */
export interface FixtureDiff {
  readonly changed: boolean;
  readonly changes: readonly FixtureChange[];
}

/**
 * A change between two fixtures.
 */
export interface FixtureChange {
  readonly path: string;
  readonly type: 'added' | 'removed' | 'modified';
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

/**
 * Compute diff between two fixtures.
 * 
 * This is a simplified diff for testing purposes.
 * For production use, consider a more sophisticated diff library.
 */
export function diffFixtures(oldFixture: SongFixture, newFixture: SongFixture): FixtureDiff {
  const changes: FixtureChange[] = [];
  
  // Compare structure
  if (oldFixture.structure.tempoBpm !== newFixture.structure.tempoBpm) {
    changes.push({
      path: 'structure.tempoBpm',
      type: 'modified',
      oldValue: oldFixture.structure.tempoBpm,
      newValue: newFixture.structure.tempoBpm,
    });
  }

  // Compare event counts
  if (oldFixture.events.length !== newFixture.events.length) {
    changes.push({
      path: 'events.length',
      type: 'modified',
      oldValue: oldFixture.events.length,
      newValue: newFixture.events.length,
    });
  }

  // Compare track counts
  if (oldFixture.tracks.length !== newFixture.tracks.length) {
    changes.push({
      path: 'tracks.length',
      type: 'modified',
      oldValue: oldFixture.tracks.length,
      newValue: newFixture.tracks.length,
    });
  }

  // More detailed diff would go here...

  return {
    changed: changes.length > 0,
    changes,
  };
}

// ============================================================================
// Common Fixture Builders
// ============================================================================

/**
 * Create a fixture with a simple four-bar beat.
 */
export function createFourBarBeatFixture(): SongFixture {
  const fixture = createMinimalFixture({
    id: 'four_bar_beat',
    name: 'Four Bar Beat',
    description: 'Simple four-bar drum pattern for testing',
    lengthBars: 4,
    tempoBpm: 120,
  });

  // Add drum track
  const drumTrackId = 'track:drums' as TrackId;
  const tracks: FixtureTrack[] = [
    {
      id: drumTrackId,
      name: 'Drums',
      role: 'drums',
      type: 'midi',
      muted: false,
      soloed: false,
      gain: 0.8,
      pan: 0,
      color: '#ff5722',
    },
  ];

  // Add kick and snare pattern (simplified)
  const events: FixtureEvent[] = [];
  const ticksPerQuarter = 480;
  const ticksPerBar = ticksPerQuarter * 4;
  
  // Kick on beats 1 and 3, snare on beats 2 and 4
  for (let bar = 0; bar < 4; bar++) {
    const barStart = bar * ticksPerBar;
    
    // Kick on beat 1
    events.push({
      id: `event:kick_${bar}_1` as EventId,
      kind: 'note',
      startTick: barStart as Tick,
      durationTicks: ticksPerQuarter as TickDuration,
      trackId: drumTrackId,
      payload: {
        type: 'note',
        pitch: 36, // C1 (kick)
        velocity: 100,
        noteName: 'C1',
      },
      tags: ['kick', 'downbeat'],
    });
    
    // Snare on beat 2
    events.push({
      id: `event:snare_${bar}_2` as EventId,
      kind: 'note',
      startTick: (barStart + ticksPerQuarter) as Tick,
      durationTicks: ticksPerQuarter as TickDuration,
      trackId: drumTrackId,
      payload: {
        type: 'note',
        pitch: 38, // D1 (snare)
        velocity: 95,
        noteName: 'D1',
      },
      tags: ['snare', 'backbeat'],
    });
    
    // Kick on beat 3
    events.push({
      id: `event:kick_${bar}_3` as EventId,
      kind: 'note',
      startTick: (barStart + ticksPerQuarter * 2) as Tick,
      durationTicks: ticksPerQuarter as TickDuration,
      trackId: drumTrackId,
      payload: {
        type: 'note',
        pitch: 36,
        velocity: 100,
        noteName: 'C1',
      },
      tags: ['kick'],
    });
    
    // Snare on beat 4
    events.push({
      id: `event:snare_${bar}_4` as EventId,
      kind: 'note',
      startTick: (barStart + ticksPerQuarter * 3) as Tick,
      durationTicks: ticksPerQuarter as TickDuration,
      trackId: drumTrackId,
      payload: {
        type: 'note',
        pitch: 38,
        velocity: 95,
        noteName: 'D1',
      },
      tags: ['snare', 'backbeat'],
    });
  }

  return {
    ...fixture,
    tracks,
    events,
  };
}

/**
 * Create a fixture with a simple chord progression.
 */
export function createChordProgressionFixture(): SongFixture {
  const fixture = createMinimalFixture({
    id: 'chord_progression',
    name: 'Chord Progression',
    description: 'I-V-vi-IV progression for testing harmony',
    lengthBars: 4,
    tempoBpm: 90,
  });

  const harmonyTrackId = 'track:harmony' as TrackId;
  const tracks: FixtureTrack[] = [
    {
      id: harmonyTrackId,
      name: 'Chords',
      role: 'harmony',
      type: 'midi',
      muted: false,
      soloed: false,
      gain: 0.7,
      pan: 0,
      color: '#2196f3',
    },
  ];

  const ticksPerQuarter = 480;
  const ticksPerBar = ticksPerQuarter * 4;
  
  const chords: Array<{ symbol: string; root: number; quality: string; extensions: number[] }> = [
    { symbol: 'Cmaj7', root: 0, quality: 'major', extensions: [7] },
    { symbol: 'G7', root: 7, quality: 'dominant', extensions: [7] },
    { symbol: 'Am7', root: 9, quality: 'minor', extensions: [7] },
    { symbol: 'Fmaj7', root: 5, quality: 'major', extensions: [7] },
  ];

  const events: FixtureEvent[] = chords.map((chord, i) => ({
    id: `event:chord_${i}` as EventId,
    kind: 'chord',
    startTick: (i * ticksPerBar) as Tick,
    durationTicks: ticksPerBar as TickDuration,
    trackId: harmonyTrackId,
    payload: {
      type: 'chord',
      ...chord,
    },
    tags: ['chord', 'harmony'],
  }));

  return {
    ...fixture,
    tracks,
    events,
  };
}

/**
 * Create a fixture with sections marked.
 */
export function createSectionedFixture(): SongFixture {
  const fixture = createMinimalFixture({
    id: 'sectioned',
    name: 'Sectioned Song',
    description: 'Intro-verse-chorus structure for testing sections',
    lengthBars: 16,
    tempoBpm: 120,
  });

  const ticksPerQuarter = 480;
  const ticksPerBar = ticksPerQuarter * 4;

  const sections: FixtureSection[] = [
    {
      id: 'section:intro' as SectionId,
      type: 'intro',
      name: 'Intro',
      startTick: 0 as Tick,
      endTick: (4 * ticksPerBar) as Tick,
      startBar: 1,
      endBar: 4,
    },
    {
      id: 'section:verse' as SectionId,
      type: 'verse',
      name: 'Verse',
      startTick: (4 * ticksPerBar) as Tick,
      endTick: (12 * ticksPerBar) as Tick,
      startBar: 5,
      endBar: 12,
    },
    {
      id: 'section:chorus' as SectionId,
      type: 'chorus',
      name: 'Chorus',
      startTick: (12 * ticksPerBar) as Tick,
      endTick: (16 * ticksPerBar) as Tick,
      startBar: 13,
      endBar: 16,
    },
  ];

  return {
    ...fixture,
    structure: {
      ...fixture.structure,
      sections,
    },
  };
}
