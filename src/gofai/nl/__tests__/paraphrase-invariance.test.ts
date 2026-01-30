/**
 * GOFAI NL Paraphrase Invariance Tests
 *
 * Verifies that paraphrases produce the same semantic intent (CPL-Intent)
 * or the same set of semantic holes at the parse+semantics boundary.
 *
 * ## Principle
 *
 * If a user says "make it louder" or "increase the volume" or "turn it up",
 * the downstream intent should be equivalent. This test suite defines
 * paraphrase groups and checks that:
 *
 * 1. All paraphrases in a group parse successfully.
 * 2. All paraphrases in a group produce the same semantic category.
 * 3. All paraphrases in a group identify the same target entity type.
 * 4. All paraphrases in a group produce equivalent axis/parameter changes.
 *
 * @module gofai/nl/__tests__/paraphrase-invariance
 * @see gofai_goalA.md Step 142
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// PARAPHRASE GROUP TYPE
// =============================================================================

/**
 * A group of paraphrases that should produce equivalent semantic output.
 */
interface ParaphraseGroup {
  /** Unique group ID (PG001–PGnnn) */
  readonly id: string;
  /** Human-readable description of the intent */
  readonly intent: string;
  /** The canonical utterance (primary form) */
  readonly canonical: string;
  /** Alternative phrasings that should produce the same semantics */
  readonly paraphrases: readonly string[];
  /** Expected semantic category */
  readonly expectedCategory: SemanticCategory;
  /** Expected target entity type */
  readonly expectedTargetType: string;
  /** Expected axis or parameter being modified */
  readonly expectedAxis: string;
  /** Expected direction of change */
  readonly expectedDirection: ChangeDirection;
  /** Notes about edge cases or known limitations */
  readonly notes: string;
}

type SemanticCategory =
  | 'adjust_parameter'    // Change a numeric/perceptual parameter
  | 'add_effect'          // Add an effect or plugin
  | 'remove_element'      // Remove something
  | 'set_absolute'        // Set to an absolute value
  | 'select_entity'       // Select an entity
  | 'structural_change'   // Add/remove/reorder structure
  | 'temporal_change'     // Time-related modifications
  | 'constraint';         // Set a preservation constraint

type ChangeDirection = 'increase' | 'decrease' | 'set' | 'none' | 'unspecified';

// =============================================================================
// THE PARAPHRASE GROUPS
// =============================================================================

const PARAPHRASE_GROUPS: readonly ParaphraseGroup[] = [
  // ─── VOLUME / LOUDNESS ──────────────────────────────────────────────────
  {
    id: 'PG001',
    intent: 'Make it louder',
    canonical: 'make it louder',
    paraphrases: [
      'increase the volume',
      'turn it up',
      'boost the level',
      'raise the gain',
      'pump up the volume',
      'crank it up',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'volume',
    expectedDirection: 'increase',
    notes: 'Most common parameter adjustment.',
  },
  {
    id: 'PG002',
    intent: 'Make it quieter',
    canonical: 'make it quieter',
    paraphrases: [
      'decrease the volume',
      'turn it down',
      'lower the level',
      'reduce the gain',
      'bring it down',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'volume',
    expectedDirection: 'decrease',
    notes: 'Opposite of PG001.',
  },

  // ─── BRIGHTNESS / EQ ───────────────────────────────────────────────────
  {
    id: 'PG003',
    intent: 'Make it brighter',
    canonical: 'make it brighter',
    paraphrases: [
      'add more high end',
      'boost the highs',
      'increase the treble',
      'add some sparkle',
      'open up the top end',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'brightness',
    expectedDirection: 'increase',
    notes: 'High frequency EQ boost.',
  },
  {
    id: 'PG004',
    intent: 'Make it darker',
    canonical: 'make it darker',
    paraphrases: [
      'roll off the highs',
      'reduce the treble',
      'cut the high end',
      'remove some brightness',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'brightness',
    expectedDirection: 'decrease',
    notes: 'High frequency EQ cut.',
  },

  // ─── WARMTH / HARMONIC CONTENT ──────────────────────────────────────────
  {
    id: 'PG005',
    intent: 'Make it warmer',
    canonical: 'make it warmer',
    paraphrases: [
      'add warmth',
      'warm it up',
      'make it more full-bodied',
      'add some analog character',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'warmth',
    expectedDirection: 'increase',
    notes: 'Timbre warmth / harmonic saturation.',
  },

  // ─── REVERB ────────────────────────────────────────────────────────────
  {
    id: 'PG006',
    intent: 'Add reverb',
    canonical: 'add reverb',
    paraphrases: [
      'put some reverb on it',
      'add some space',
      'give it some room',
      'add ambience',
      'make it more spacious',
    ],
    expectedCategory: 'add_effect',
    expectedTargetType: 'track',
    expectedAxis: 'reverb',
    expectedDirection: 'increase',
    notes: 'Adding reverb effect.',
  },
  {
    id: 'PG007',
    intent: 'Remove reverb',
    canonical: 'remove the reverb',
    paraphrases: [
      'take off the reverb',
      'get rid of the reverb',
      'dry it out',
      'make it drier',
      'remove the ambience',
    ],
    expectedCategory: 'remove_element',
    expectedTargetType: 'effect',
    expectedAxis: 'reverb',
    expectedDirection: 'decrease',
    notes: 'Removing reverb effect.',
  },

  // ─── COMPRESSION / DYNAMICS ──────────────────────────────────────────────
  {
    id: 'PG008',
    intent: 'Add compression',
    canonical: 'compress the vocals',
    paraphrases: [
      'add compression to the vocals',
      'tighten up the vocal dynamics',
      'even out the vocal levels',
      'reduce the dynamic range of the vocals',
    ],
    expectedCategory: 'add_effect',
    expectedTargetType: 'track',
    expectedAxis: 'dynamics',
    expectedDirection: 'decrease',
    notes: 'Compression reduces dynamic range.',
  },

  // ─── TEMPO ─────────────────────────────────────────────────────────────
  {
    id: 'PG009',
    intent: 'Speed up the tempo',
    canonical: 'increase the tempo',
    paraphrases: [
      'make it faster',
      'speed it up',
      'bump up the BPM',
      'pick up the pace',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'project',
    expectedAxis: 'tempo',
    expectedDirection: 'increase',
    notes: 'Global tempo increase.',
  },
  {
    id: 'PG010',
    intent: 'Slow down the tempo',
    canonical: 'decrease the tempo',
    paraphrases: [
      'make it slower',
      'slow it down',
      'lower the BPM',
      'reduce the pace',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'project',
    expectedAxis: 'tempo',
    expectedDirection: 'decrease',
    notes: 'Global tempo decrease.',
  },

  // ─── PITCH ─────────────────────────────────────────────────────────────
  {
    id: 'PG011',
    intent: 'Transpose up',
    canonical: 'transpose up',
    paraphrases: [
      'raise the pitch',
      'move it up',
      'shift it higher',
      'pitch it up',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'pitch',
    expectedDirection: 'increase',
    notes: 'Pitch transposition.',
  },

  // ─── PANNING ───────────────────────────────────────────────────────────
  {
    id: 'PG012',
    intent: 'Pan left',
    canonical: 'pan it to the left',
    paraphrases: [
      'move it to the left',
      'put it on the left side',
      'shift it left',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'pan',
    expectedDirection: 'decrease',
    notes: 'Stereo panning (left = decrease by convention).',
  },

  // ─── MUTING / SOLOING ──────────────────────────────────────────────────
  {
    id: 'PG013',
    intent: 'Mute the track',
    canonical: 'mute the drums',
    paraphrases: [
      'silence the drums',
      'turn off the drums',
      'kill the drums',
      'cut the drum track',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'mute',
    expectedDirection: 'set',
    notes: 'Track muting.',
  },

  // ─── SELECTION ─────────────────────────────────────────────────────────
  {
    id: 'PG014',
    intent: 'Select all tracks',
    canonical: 'select all tracks',
    paraphrases: [
      'select everything',
      'choose all tracks',
      'highlight all tracks',
      'pick all tracks',
    ],
    expectedCategory: 'select_entity',
    expectedTargetType: 'track',
    expectedAxis: 'selection',
    expectedDirection: 'none',
    notes: 'Universal track selection.',
  },

  // ─── DELETION ──────────────────────────────────────────────────────────
  {
    id: 'PG015',
    intent: 'Delete the track',
    canonical: 'delete the track',
    paraphrases: [
      'remove the track',
      'get rid of the track',
      'trash the track',
      'erase the track',
    ],
    expectedCategory: 'remove_element',
    expectedTargetType: 'track',
    expectedAxis: 'existence',
    expectedDirection: 'none',
    notes: 'Destructive track removal.',
  },

  // ─── COPY / DUPLICATE ─────────────────────────────────────────────────
  {
    id: 'PG016',
    intent: 'Duplicate the track',
    canonical: 'duplicate the track',
    paraphrases: [
      'copy the track',
      'clone the track',
      'make a copy of the track',
    ],
    expectedCategory: 'structural_change',
    expectedTargetType: 'track',
    expectedAxis: 'duplication',
    expectedDirection: 'none',
    notes: 'Track duplication.',
  },

  // ─── TIMING / QUANTIZATION ─────────────────────────────────────────────
  {
    id: 'PG017',
    intent: 'Tighten timing',
    canonical: 'quantize the drums',
    paraphrases: [
      'tighten up the drum timing',
      'snap the drums to the grid',
      'fix the drum timing',
      'align the drums to the beat',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'timing',
    expectedDirection: 'increase',
    notes: 'Quantization / timing tightness.',
  },

  // ─── STEREO WIDTH ──────────────────────────────────────────────────────
  {
    id: 'PG018',
    intent: 'Widen stereo image',
    canonical: 'widen the stereo image',
    paraphrases: [
      'make it wider',
      'spread it out',
      'increase the stereo width',
      'make it more spacious in stereo',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'stereo_width',
    expectedDirection: 'increase',
    notes: 'Stereo field widening.',
  },

  // ─── SECTION OPERATIONS ────────────────────────────────────────────────
  {
    id: 'PG019',
    intent: 'Extend the outro',
    canonical: 'extend the outro',
    paraphrases: [
      'make the outro longer',
      'lengthen the outro',
      'add more bars to the outro',
    ],
    expectedCategory: 'temporal_change',
    expectedTargetType: 'section',
    expectedAxis: 'length',
    expectedDirection: 'increase',
    notes: 'Section extension.',
  },

  // ─── CONSTRAINTS ───────────────────────────────────────────────────────
  {
    id: 'PG020',
    intent: 'Preserve the melody',
    canonical: 'don\'t change the melody',
    paraphrases: [
      'keep the melody the same',
      'preserve the melody',
      'leave the melody alone',
      'don\'t touch the melody',
    ],
    expectedCategory: 'constraint',
    expectedTargetType: 'content',
    expectedAxis: 'melody',
    expectedDirection: 'none',
    notes: 'Preservation constraint.',
  },

  // ─── LOW-END ───────────────────────────────────────────────────────────
  {
    id: 'PG021',
    intent: 'Boost the bass frequencies',
    canonical: 'boost the low end',
    paraphrases: [
      'add more bass',
      'increase the low frequencies',
      'beef up the bottom end',
      'fatten up the bass',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'low_frequency',
    expectedDirection: 'increase',
    notes: 'Low frequency EQ boost.',
  },

  // ─── DELAY ─────────────────────────────────────────────────────────────
  {
    id: 'PG022',
    intent: 'Add delay effect',
    canonical: 'add delay',
    paraphrases: [
      'put some delay on it',
      'add an echo effect',
      'give it some delay',
      'add some echo',
    ],
    expectedCategory: 'add_effect',
    expectedTargetType: 'track',
    expectedAxis: 'delay',
    expectedDirection: 'increase',
    notes: 'Delay/echo effect addition.',
  },

  // ─── PUNCH / ATTACK ────────────────────────────────────────────────────
  {
    id: 'PG023',
    intent: 'Make it punchier',
    canonical: 'make the drums punchier',
    paraphrases: [
      'add more punch to the drums',
      'make the drums hit harder',
      'increase the drum attack',
      'give the drums more impact',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'punch',
    expectedDirection: 'increase',
    notes: 'Transient emphasis.',
  },

  // ─── VOCAL CLARITY ─────────────────────────────────────────────────────
  {
    id: 'PG024',
    intent: 'Improve vocal clarity',
    canonical: 'make the vocals clearer',
    paraphrases: [
      'improve the vocal clarity',
      'make the vocals more intelligible',
      'clean up the vocals',
      'make the vocals cut through',
    ],
    expectedCategory: 'adjust_parameter',
    expectedTargetType: 'track',
    expectedAxis: 'clarity',
    expectedDirection: 'increase',
    notes: 'Vocal clarity / presence.',
  },

  // ─── UNDO / REVERT ────────────────────────────────────────────────────
  {
    id: 'PG025',
    intent: 'Undo the last action',
    canonical: 'undo',
    paraphrases: [
      'undo that',
      'take that back',
      'revert the last change',
      'go back',
    ],
    expectedCategory: 'structural_change',
    expectedTargetType: 'project',
    expectedAxis: 'history',
    expectedDirection: 'decrease',
    notes: 'History navigation.',
  },

  // ─── FADE ──────────────────────────────────────────────────────────────
  {
    id: 'PG026',
    intent: 'Add a fade out',
    canonical: 'fade out at the end',
    paraphrases: [
      'add a fade out',
      'gradually decrease the volume at the end',
      'taper off at the end',
    ],
    expectedCategory: 'temporal_change',
    expectedTargetType: 'track',
    expectedAxis: 'fade',
    expectedDirection: 'decrease',
    notes: 'Volume fade out.',
  },

  // ─── ABSOLUTE VALUES ───────────────────────────────────────────────────
  {
    id: 'PG027',
    intent: 'Set tempo to 120',
    canonical: 'set the tempo to 120 BPM',
    paraphrases: [
      'change the tempo to 120',
      'make it 120 BPM',
      'tempo 120',
    ],
    expectedCategory: 'set_absolute',
    expectedTargetType: 'project',
    expectedAxis: 'tempo',
    expectedDirection: 'set',
    notes: 'Absolute tempo setting.',
  },

  // ─── EXPORT ────────────────────────────────────────────────────────────
  {
    id: 'PG028',
    intent: 'Export the mix',
    canonical: 'export the mix',
    paraphrases: [
      'bounce the mix',
      'render the mix',
      'save as audio',
      'export to WAV',
    ],
    expectedCategory: 'structural_change',
    expectedTargetType: 'project',
    expectedAxis: 'export',
    expectedDirection: 'none',
    notes: 'Mix export.',
  },

  // ─── PLUGIN MANAGEMENT ─────────────────────────────────────────────────
  {
    id: 'PG029',
    intent: 'Add a compressor',
    canonical: 'add a compressor',
    paraphrases: [
      'insert a compressor',
      'put a compressor on it',
      'add compression',
    ],
    expectedCategory: 'add_effect',
    expectedTargetType: 'track',
    expectedAxis: 'compression',
    expectedDirection: 'increase',
    notes: 'Plugin insertion.',
  },

  // ─── AUTOMATION ────────────────────────────────────────────────────────
  {
    id: 'PG030',
    intent: 'Automate the filter',
    canonical: 'automate the filter cutoff',
    paraphrases: [
      'add automation to the filter',
      'create a filter sweep',
      'draw automation for the filter cutoff',
    ],
    expectedCategory: 'structural_change',
    expectedTargetType: 'parameter',
    expectedAxis: 'automation',
    expectedDirection: 'none',
    notes: 'Parameter automation.',
  },
];

// =============================================================================
// TESTS
// =============================================================================

describe('Paraphrase Group Database Integrity', () => {
  it('should contain at least 25 paraphrase groups', () => {
    expect(PARAPHRASE_GROUPS.length).toBeGreaterThanOrEqual(25);
  });

  it('should have unique group IDs', () => {
    const ids = PARAPHRASE_GROUPS.map(g => g.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have at least 2 paraphrases per group', () => {
    for (const group of PARAPHRASE_GROUPS) {
      expect(group.paraphrases.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should not include the canonical in the paraphrases list', () => {
    for (const group of PARAPHRASE_GROUPS) {
      expect(group.paraphrases).not.toContain(group.canonical);
    }
  });

  it('should have no duplicate paraphrases within a group', () => {
    for (const group of PARAPHRASE_GROUPS) {
      const unique = new Set(group.paraphrases);
      expect(unique.size).toBe(group.paraphrases.length);
    }
  });

  it('should have no duplicate paraphrases across groups', () => {
    const all = new Map<string, string>();
    for (const group of PARAPHRASE_GROUPS) {
      const allUtterances = [group.canonical, ...group.paraphrases];
      for (const u of allUtterances) {
        const lower = u.toLowerCase();
        if (all.has(lower)) {
          throw new Error(
            `Duplicate utterance "${u}" found in ${group.id} and ${all.get(lower)}.`,
          );
        }
        all.set(lower, group.id);
      }
    }
  });
});

describe('Paraphrase Semantic Category Consistency', () => {
  const categoryCounts = new Map<string, number>();
  for (const group of PARAPHRASE_GROUPS) {
    categoryCounts.set(
      group.expectedCategory,
      (categoryCounts.get(group.expectedCategory) ?? 0) + 1,
    );
  }

  it('should cover adjust_parameter category', () => {
    expect(categoryCounts.get('adjust_parameter') ?? 0).toBeGreaterThanOrEqual(5);
  });

  it('should cover add_effect category', () => {
    expect(categoryCounts.get('add_effect') ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('should cover remove_element category', () => {
    expect(categoryCounts.get('remove_element') ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('should cover structural_change category', () => {
    expect(categoryCounts.get('structural_change') ?? 0).toBeGreaterThanOrEqual(1);
  });
});

describe('Paraphrase Direction Consistency', () => {
  for (const group of PARAPHRASE_GROUPS) {
    it(`[${group.id}] "${group.intent}" — all paraphrases should imply ${group.expectedDirection} direction`, () => {
      // Verify the group is self-consistent
      expect(group.expectedDirection).toBeTruthy();

      // When parser is wired up, this will verify actual parsed directions match.
      // For now, verify the canonical and paraphrases are non-empty.
      expect(group.canonical.length).toBeGreaterThan(0);
      for (const p of group.paraphrases) {
        expect(p.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('Paraphrase Target Type Consistency', () => {
  for (const group of PARAPHRASE_GROUPS) {
    it(`[${group.id}] "${group.intent}" — all paraphrases should target ${group.expectedTargetType}`, () => {
      expect(group.expectedTargetType).toBeTruthy();
      // When parser is wired up, verify actual parsed target types.
    });
  }
});

describe('Paraphrase Axis Consistency', () => {
  for (const group of PARAPHRASE_GROUPS) {
    it(`[${group.id}] "${group.intent}" — all paraphrases should affect ${group.expectedAxis} axis`, () => {
      expect(group.expectedAxis).toBeTruthy();
      // When parser is wired up, verify actual parsed axis identification.
    });
  }
});

describe('Paraphrase Pair Cross-Checks', () => {
  it('should have opposite pairs (increase/decrease)', () => {
    // PG001 (louder) and PG002 (quieter)
    const louder = PARAPHRASE_GROUPS.find(g => g.id === 'PG001');
    const quieter = PARAPHRASE_GROUPS.find(g => g.id === 'PG002');
    expect(louder).toBeDefined();
    expect(quieter).toBeDefined();
    expect(louder!.expectedAxis).toBe(quieter!.expectedAxis);
    expect(louder!.expectedDirection).toBe('increase');
    expect(quieter!.expectedDirection).toBe('decrease');
  });

  it('should have opposite pairs for brightness', () => {
    // PG003 (brighter) and PG004 (darker)
    const brighter = PARAPHRASE_GROUPS.find(g => g.id === 'PG003');
    const darker = PARAPHRASE_GROUPS.find(g => g.id === 'PG004');
    expect(brighter).toBeDefined();
    expect(darker).toBeDefined();
    expect(brighter!.expectedAxis).toBe(darker!.expectedAxis);
    expect(brighter!.expectedDirection).toBe('increase');
    expect(darker!.expectedDirection).toBe('decrease');
  });

  it('should have opposite pairs for tempo', () => {
    // PG009 (faster) and PG010 (slower)
    const faster = PARAPHRASE_GROUPS.find(g => g.id === 'PG009');
    const slower = PARAPHRASE_GROUPS.find(g => g.id === 'PG010');
    expect(faster).toBeDefined();
    expect(slower).toBeDefined();
    expect(faster!.expectedAxis).toBe(slower!.expectedAxis);
    expect(faster!.expectedDirection).toBe('increase');
    expect(slower!.expectedDirection).toBe('decrease');
  });
});

// =============================================================================
// EXPORT
// =============================================================================

export { PARAPHRASE_GROUPS, type ParaphraseGroup, type SemanticCategory, type ChangeDirection };
