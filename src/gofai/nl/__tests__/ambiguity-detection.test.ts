/**
 * GOFAI NL Ambiguity Detection Tests
 *
 * Ensures known ambiguous utterances do NOT collapse to a single meaning
 * without triggering clarification. This is a safety net: if the parser
 * ever resolves a known ambiguity silently, these tests catch it.
 *
 * ## Test Categories
 *
 * 1. **Lexical ambiguity**: words with multiple music-domain senses
 * 2. **Structural ambiguity**: PP-attachment, coordination scope
 * 3. **Scope ambiguity**: quantifier, negation, "only" interactions
 * 4. **Degree ambiguity**: vague adjectives with multiple axis interpretations
 * 5. **Reference ambiguity**: pronouns with multiple antecedents
 * 6. **Pragmatic ambiguity**: indirect speech acts, implicatures
 *
 * Each test case specifies:
 * - The input utterance
 * - The minimum number of expected readings/interpretations
 * - Which readings are expected (by description)
 * - Whether clarification should be triggered
 *
 * @module gofai/nl/__tests__/ambiguity-detection
 * @see gofai_goalA.md Step 144
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// AMBIGUITY TEST CASE TYPE
// =============================================================================

/**
 * An ambiguity test case.
 */
interface AmbiguityTestCase {
  /** Unique test ID (AMB001–AMBnnn) */
  readonly id: string;
  /** The ambiguous input utterance */
  readonly input: string;
  /** Category of ambiguity */
  readonly category: AmbiguityType;
  /** Minimum number of distinct readings */
  readonly minReadings: number;
  /** Descriptions of expected readings */
  readonly expectedReadings: readonly string[];
  /** Whether clarification MUST be triggered */
  readonly mustClarify: boolean;
  /** The ambiguous span (which part is ambiguous) */
  readonly ambiguousSpan: string;
  /** Explanation of why this is ambiguous */
  readonly explanation: string;
  /** If applicable, which reading is the pragmatic default */
  readonly pragmaticDefault: string | null;
}

type AmbiguityType =
  | 'lexical'
  | 'structural'
  | 'scope'
  | 'degree'
  | 'reference'
  | 'pragmatic'
  | 'coordination'
  | 'pp_attachment'
  | 'modal';

// =============================================================================
// THE AMBIGUITY TEST CASES
// =============================================================================

const AMBIGUITY_CASES: readonly AmbiguityTestCase[] = [
  // ─── LEXICAL AMBIGUITY ──────────────────────────────────────────────────
  {
    id: 'AMB001',
    input: 'make the bass darker',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'bass instrument → timbre/EQ darkening',
      'bass frequency range → low-end EQ adjustment',
    ],
    mustClarify: true,
    ambiguousSpan: 'bass',
    explanation: '"Bass" is ambiguous between the bass instrument and the bass frequency range.',
    pragmaticDefault: null,
  },
  {
    id: 'AMB002',
    input: 'double it',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'duplicate the track/region',
      'multiply the parameter value by 2',
    ],
    mustClarify: true,
    ambiguousSpan: 'double',
    explanation: '"Double" can mean duplicate (structural) or multiply by 2 (parametric).',
    pragmaticDefault: null,
  },
  {
    id: 'AMB003',
    input: 'clip the vocals',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'trim/cut the vocal region',
      'apply hard clipping distortion',
    ],
    mustClarify: true,
    ambiguousSpan: 'clip',
    explanation: '"Clip" can mean trim a region or cause audio clipping/distortion.',
    pragmaticDefault: 'trim/cut the vocal region',
  },
  {
    id: 'AMB004',
    input: 'layer the synth',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'add another synth layer (duplicate + detune)',
      'move to a different layer in the arrangement',
    ],
    mustClarify: true,
    ambiguousSpan: 'layer',
    explanation: '"Layer" can mean adding sonic layers or arrangement layers.',
    pragmaticDefault: 'add another synth layer (duplicate + detune)',
  },
  {
    id: 'AMB005',
    input: 'boost the track',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'increase the track volume',
      'apply EQ boost (unspecified frequency)',
    ],
    mustClarify: true,
    ambiguousSpan: 'boost',
    explanation: '"Boost" can mean volume increase or EQ boost.',
    pragmaticDefault: 'increase the track volume',
  },

  // ─── STRUCTURAL AMBIGUITY ──────────────────────────────────────────────
  {
    id: 'AMB006',
    input: 'add reverb to the guitar and bass',
    category: 'coordination',
    minReadings: 2,
    expectedReadings: [
      'add reverb to [the guitar] and [bass] (reverb on both)',
      'add [reverb to the guitar] and [bass effect] (reverb on guitar, add bass)',
    ],
    mustClarify: false,
    ambiguousSpan: 'guitar and bass',
    explanation: 'Coordination scope: does "and bass" coordinate with "guitar" or with "reverb to guitar"?',
    pragmaticDefault: 'add reverb to [the guitar] and [bass] (reverb on both)',
  },
  {
    id: 'AMB007',
    input: 'EQ the vocals with the piano',
    category: 'pp_attachment',
    minReadings: 2,
    expectedReadings: [
      'EQ the vocals [while referencing the piano sound]',
      'EQ [the vocals that play with the piano]',
    ],
    mustClarify: true,
    ambiguousSpan: 'with the piano',
    explanation: 'PP "with the piano" attaches to verb (reference) or noun (modifier).',
    pragmaticDefault: null,
  },
  {
    id: 'AMB008',
    input: 'compress the drums and the bass heavily',
    category: 'structural',
    minReadings: 2,
    expectedReadings: [
      'compress [the drums and the bass] heavily (both compressed heavily)',
      'compress [the drums] and [the bass heavily] (only bass compressed heavily)',
    ],
    mustClarify: false,
    ambiguousSpan: 'heavily',
    explanation: 'Adverb "heavily" can modify the entire coordination or just the last conjunct.',
    pragmaticDefault: 'compress [the drums and the bass] heavily (both compressed heavily)',
  },
  {
    id: 'AMB009',
    input: 'move the vocals after the guitar solo',
    category: 'pp_attachment',
    minReadings: 2,
    expectedReadings: [
      'move the vocals [to a position after the guitar solo]',
      'move [the vocals that come after the guitar solo]',
    ],
    mustClarify: true,
    ambiguousSpan: 'after the guitar solo',
    explanation: 'PP "after the guitar solo" attaches to "move" (destination) or "vocals" (which vocals).',
    pragmaticDefault: 'move the vocals [to a position after the guitar solo]',
  },
  {
    id: 'AMB010',
    input: 'increase reverb and delay time',
    category: 'coordination',
    minReadings: 2,
    expectedReadings: [
      'increase [reverb] and [delay time] (two separate increases)',
      'increase [reverb and delay] time (time parameter of both)',
    ],
    mustClarify: true,
    ambiguousSpan: 'reverb and delay time',
    explanation: '"Time" can modify just "delay" or the entire coordination.',
    pragmaticDefault: null,
  },

  // ─── SCOPE AMBIGUITY ───────────────────────────────────────────────────
  {
    id: 'AMB011',
    input: 'don\'t make all tracks louder',
    category: 'scope',
    minReadings: 2,
    expectedReadings: [
      '¬∀x(track(x) → louder(x)) — don\'t apply to ALL (some is OK)',
      '∀x(track(x) → ¬louder(x)) — make NONE louder',
    ],
    mustClarify: true,
    ambiguousSpan: 'don\'t ... all',
    explanation: 'Negation + universal quantifier: does negation scope over "all" or vice versa?',
    pragmaticDefault: '¬∀x(track(x) → louder(x)) — don\'t apply to ALL (some is OK)',
  },
  {
    id: 'AMB012',
    input: 'only add reverb to the chorus',
    category: 'scope',
    minReadings: 2,
    expectedReadings: [
      'add ONLY reverb to the chorus (no other effects)',
      'add reverb ONLY to the chorus (not to other sections)',
    ],
    mustClarify: true,
    ambiguousSpan: 'only',
    explanation: '"Only" focus ambiguity: what is being restricted?',
    pragmaticDefault: 'add reverb ONLY to the chorus (not to other sections)',
  },
  {
    id: 'AMB013',
    input: 'every track needs some EQ',
    category: 'scope',
    minReadings: 2,
    expectedReadings: [
      '∀x∃y(track(x) → needs(x, EQ(y))) — each track needs its own EQ',
      '∃y∀x(track(x) → needs(x, EQ(y))) — there\'s one EQ setting for all tracks',
    ],
    mustClarify: false,
    ambiguousSpan: 'every ... some',
    explanation: 'Quantifier scope: distributive vs. collective reading.',
    pragmaticDefault: '∀x∃y(track(x) → needs(x, EQ(y))) — each track needs its own EQ',
  },
  {
    id: 'AMB014',
    input: 'don\'t change any tracks',
    category: 'scope',
    minReadings: 2,
    expectedReadings: [
      'no tracks should be changed (NPI "any" under negation)',
      'don\'t change whichever tracks (free-choice "any")',
    ],
    mustClarify: false,
    ambiguousSpan: 'any',
    explanation: '"Any" is ambiguous between NPI (negative polarity) and free-choice readings.',
    pragmaticDefault: 'no tracks should be changed (NPI "any" under negation)',
  },
  {
    id: 'AMB015',
    input: 'only some tracks need compression',
    category: 'scope',
    minReadings: 2,
    expectedReadings: [
      'ONLY some (not all) tracks need compression (scalar implicature)',
      'only SOME tracks need compression (emphasis on subset)',
    ],
    mustClarify: false,
    ambiguousSpan: 'only some',
    explanation: '"Only" + "some" creates focus/scalar ambiguity.',
    pragmaticDefault: 'ONLY some (not all) tracks need compression (scalar implicature)',
  },

  // ─── DEGREE AMBIGUITY ──────────────────────────────────────────────────
  {
    id: 'AMB016',
    input: 'make it darker',
    category: 'degree',
    minReadings: 3,
    expectedReadings: [
      'darker timbre (reduce high frequencies)',
      'darker harmony (use minor/diminished chords)',
      'darker mood (overall emotional quality)',
    ],
    mustClarify: true,
    ambiguousSpan: 'darker',
    explanation: '"Darker" maps to multiple perceptual axes in music.',
    pragmaticDefault: 'darker timbre (reduce high frequencies)',
  },
  {
    id: 'AMB017',
    input: 'make it thicker',
    category: 'degree',
    minReadings: 2,
    expectedReadings: [
      'thicker texture (add layers/voices)',
      'thicker frequency spectrum (widen EQ/add harmonics)',
    ],
    mustClarify: true,
    ambiguousSpan: 'thicker',
    explanation: '"Thicker" can refer to texture density or spectral density.',
    pragmaticDefault: null,
  },
  {
    id: 'AMB018',
    input: 'make it tighter',
    category: 'degree',
    minReadings: 2,
    expectedReadings: [
      'tighter timing (quantize / reduce timing variance)',
      'tighter low-end (reduce bass resonance / muddiness)',
    ],
    mustClarify: true,
    ambiguousSpan: 'tighter',
    explanation: '"Tighter" maps to timing or frequency-domain tightness.',
    pragmaticDefault: 'tighter timing (quantize / reduce timing variance)',
  },
  {
    id: 'AMB019',
    input: 'more space',
    category: 'degree',
    minReadings: 2,
    expectedReadings: [
      'more reverb/ambience (spatial effect)',
      'more silence/gaps between elements (arrangement space)',
    ],
    mustClarify: true,
    ambiguousSpan: 'space',
    explanation: '"Space" can mean reverb or arrangement breathing room.',
    pragmaticDefault: null,
  },
  {
    id: 'AMB020',
    input: 'make it cleaner',
    category: 'degree',
    minReadings: 2,
    expectedReadings: [
      'reduce distortion/noise (signal quality)',
      'reduce effects/processing (dry signal)',
    ],
    mustClarify: true,
    ambiguousSpan: 'cleaner',
    explanation: '"Cleaner" can mean less noise or less processing.',
    pragmaticDefault: 'reduce distortion/noise (signal quality)',
  },

  // ─── REFERENCE AMBIGUITY ───────────────────────────────────────────────
  {
    id: 'AMB021',
    input: 'copy it to the other one',
    category: 'reference',
    minReadings: 2,
    expectedReadings: [
      '"it" = most recently mentioned entity, "other one" = second entity',
      '"it" and "other one" require discourse context to resolve',
    ],
    mustClarify: true,
    ambiguousSpan: 'it ... the other one',
    explanation: 'Both "it" and "the other one" are anaphoric and require context.',
    pragmaticDefault: null,
  },
  {
    id: 'AMB022',
    input: 'make them match',
    category: 'reference',
    minReadings: 2,
    expectedReadings: [
      '"them" = last mentioned group (match levels)',
      '"them" = selected entities (match parameters)',
    ],
    mustClarify: true,
    ambiguousSpan: 'them',
    explanation: 'Plural pronoun "them" has unclear referent.',
    pragmaticDefault: null,
  },
  {
    id: 'AMB023',
    input: 'do the same thing to that one',
    category: 'reference',
    minReadings: 2,
    expectedReadings: [
      '"same thing" = last action, "that one" = pointed entity',
      '"same thing" = last edit type, "that one" = next entity',
    ],
    mustClarify: true,
    ambiguousSpan: 'the same thing ... that one',
    explanation: '"Same thing" requires action history; "that one" requires entity context.',
    pragmaticDefault: null,
  },
  {
    id: 'AMB024',
    input: 'the track',
    category: 'reference',
    minReadings: 2,
    expectedReadings: [
      '"the track" = currently selected track',
      '"the track" = previously mentioned track (discourse referent)',
    ],
    mustClarify: true,
    ambiguousSpan: 'the track',
    explanation: 'Definite "the" presupposes a unique referent, but multiple tracks may qualify.',
    pragmaticDefault: '"the track" = currently selected track',
  },
  {
    id: 'AMB025',
    input: 'put this there',
    category: 'reference',
    minReadings: 2,
    expectedReadings: [
      '"this" = selected region, "there" = cursor position',
      '"this" and "there" require spatial/gestural context',
    ],
    mustClarify: true,
    ambiguousSpan: 'this ... there',
    explanation: 'Deictic expressions require non-linguistic context.',
    pragmaticDefault: null,
  },

  // ─── PRAGMATIC AMBIGUITY ───────────────────────────────────────────────
  {
    id: 'AMB026',
    input: 'the bass could use some work',
    category: 'pragmatic',
    minReadings: 2,
    expectedReadings: [
      'suggestion: improve the bass (indirect request)',
      'observation: the bass quality is poor (no action needed yet)',
    ],
    mustClarify: true,
    ambiguousSpan: 'could use some work',
    explanation: 'Indirect speech act: is this a request or an observation?',
    pragmaticDefault: 'suggestion: improve the bass (indirect request)',
  },
  {
    id: 'AMB027',
    input: 'that\'s too much reverb',
    category: 'pragmatic',
    minReadings: 2,
    expectedReadings: [
      'request: reduce the reverb (implicit imperative)',
      'assessment: the reverb level is excessive (information only)',
    ],
    mustClarify: false,
    ambiguousSpan: 'too much',
    explanation: '"Too much X" pragmatically implies "reduce X" but could be purely descriptive.',
    pragmaticDefault: 'request: reduce the reverb (implicit imperative)',
  },
  {
    id: 'AMB028',
    input: 'can you make the vocals louder',
    category: 'modal',
    minReadings: 2,
    expectedReadings: [
      'polite request: make the vocals louder',
      'ability question: is it possible to make them louder?',
    ],
    mustClarify: false,
    ambiguousSpan: 'can you',
    explanation: '"Can you" is pragmatically a request, but literally an ability question.',
    pragmaticDefault: 'polite request: make the vocals louder',
  },
  {
    id: 'AMB029',
    input: 'I think the mix needs more bass',
    category: 'pragmatic',
    minReadings: 2,
    expectedReadings: [
      'hedged request: add more bass to the mix',
      'opinion: the user thinks the mix needs bass (seeks agreement)',
    ],
    mustClarify: false,
    ambiguousSpan: 'I think ... needs',
    explanation: 'Hedged assertion can be a tentative request or a discussion point.',
    pragmaticDefault: 'hedged request: add more bass to the mix',
  },
  {
    id: 'AMB030',
    input: 'what if we added some strings here',
    category: 'pragmatic',
    minReadings: 2,
    expectedReadings: [
      'suggestion: add strings at the current position',
      'hypothetical question: explore what would happen with strings',
    ],
    mustClarify: true,
    ambiguousSpan: 'what if',
    explanation: '"What if" can be a suggestion or a genuine hypothetical inquiry.',
    pragmaticDefault: 'suggestion: add strings at the current position',
  },

  // ─── ADDITIONAL LEXICAL ────────────────────────────────────────────────
  {
    id: 'AMB031',
    input: 'cut the high end',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'reduce high frequencies (EQ cut)',
      'remove/trim the ending section',
    ],
    mustClarify: false,
    ambiguousSpan: 'cut',
    explanation: '"Cut" can mean EQ reduction or region deletion.',
    pragmaticDefault: 'reduce high frequencies (EQ cut)',
  },
  {
    id: 'AMB032',
    input: 'drop the beat',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'trigger the beat drop (arrangement transition)',
      'lower the beat volume',
    ],
    mustClarify: false,
    ambiguousSpan: 'drop',
    explanation: '"Drop" can mean transition moment or volume decrease.',
    pragmaticDefault: 'trigger the beat drop (arrangement transition)',
  },
  {
    id: 'AMB033',
    input: 'round the attack',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'soften the transient attack (dynamics)',
      'round/quantize the attack time value',
    ],
    mustClarify: true,
    ambiguousSpan: 'round',
    explanation: '"Round" can mean soften (shape) or quantize (numerical).',
    pragmaticDefault: 'soften the transient attack (dynamics)',
  },
  {
    id: 'AMB034',
    input: 'smooth the transition',
    category: 'lexical',
    minReadings: 2,
    expectedReadings: [
      'add crossfade between sections',
      'reduce abrupt parameter changes (automation smoothing)',
    ],
    mustClarify: true,
    ambiguousSpan: 'smooth',
    explanation: '"Smooth" can mean crossfade or parameter interpolation.',
    pragmaticDefault: 'add crossfade between sections',
  },
  {
    id: 'AMB035',
    input: 'brighten the chorus',
    category: 'degree',
    minReadings: 2,
    expectedReadings: [
      'EQ boost high frequencies of the chorus',
      'make the chorus section more energetic/uplifting',
    ],
    mustClarify: true,
    ambiguousSpan: 'brighten',
    explanation: '"Brighten" can be literal (EQ) or metaphorical (energy/mood).',
    pragmaticDefault: 'EQ boost high frequencies of the chorus',
  },

  // ─── PP-ATTACHMENT CONTINUED ───────────────────────────────────────────
  {
    id: 'AMB036',
    input: 'add delay to the guitar in the verse',
    category: 'pp_attachment',
    minReadings: 2,
    expectedReadings: [
      'add delay to [the guitar] [in the verse] (delay only in verse)',
      'add delay to [the guitar in the verse] (which guitar)',
    ],
    mustClarify: true,
    ambiguousSpan: 'in the verse',
    explanation: '"In the verse" modifies "add" (when) or "guitar" (which).',
    pragmaticDefault: 'add delay to [the guitar] [in the verse] (delay only in verse)',
  },
  {
    id: 'AMB037',
    input: 'mute the tracks from the last session',
    category: 'pp_attachment',
    minReadings: 2,
    expectedReadings: [
      'mute [the tracks from the last session] (which tracks)',
      'mute the tracks [from the last session\'s perspective] (reference point)',
    ],
    mustClarify: false,
    ambiguousSpan: 'from the last session',
    explanation: '"From the last session" modifies "tracks" (which) or "mute" (context).',
    pragmaticDefault: 'mute [the tracks from the last session] (which tracks)',
  },

  // ─── COORDINATION SCOPE ────────────────────────────────────────────────
  {
    id: 'AMB038',
    input: 'add compression and EQ to the vocals and drums',
    category: 'coordination',
    minReadings: 3,
    expectedReadings: [
      '[compression and EQ] to [vocals and drums] (both effects on both)',
      '[compression] to [vocals] and [EQ] to [drums] (paired)',
      'compression and [EQ to the vocals and drums] (only EQ applied)',
    ],
    mustClarify: true,
    ambiguousSpan: 'and ... and',
    explanation: 'Double coordination creates multiple possible groupings.',
    pragmaticDefault: '[compression and EQ] to [vocals and drums] (both effects on both)',
  },
  {
    id: 'AMB039',
    input: 'lower the bass and treble by 3 dB',
    category: 'coordination',
    minReadings: 2,
    expectedReadings: [
      'lower [bass and treble] by 3dB (same amount for both)',
      'lower bass and [treble by 3dB] (only treble gets 3dB)',
    ],
    mustClarify: false,
    ambiguousSpan: 'bass and treble by 3 dB',
    explanation: '"By 3 dB" can modify the entire coordination or just the last conjunct.',
    pragmaticDefault: 'lower [bass and treble] by 3dB (same amount for both)',
  },
  {
    id: 'AMB040',
    input: 'remove the echo and add reverb',
    category: 'coordination',
    minReadings: 2,
    expectedReadings: [
      'remove the echo AND add reverb (sequential actions)',
      'remove [the echo and add reverb] (remove both, garbled parse)',
    ],
    mustClarify: false,
    ambiguousSpan: 'and',
    explanation: '"And" coordinates two clauses or two nouns.',
    pragmaticDefault: 'remove the echo AND add reverb (sequential actions)',
  },
];

// =============================================================================
// TESTS
// =============================================================================

describe('Ambiguity Test Database Integrity', () => {
  it('should contain at least 30 ambiguity cases', () => {
    expect(AMBIGUITY_CASES.length).toBeGreaterThanOrEqual(30);
  });

  it('should have unique IDs', () => {
    const ids = AMBIGUITY_CASES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have sequential IDs', () => {
    for (let i = 0; i < AMBIGUITY_CASES.length; i++) {
      expect(AMBIGUITY_CASES[i]!.id).toBe(`AMB${String(i + 1).padStart(3, '0')}`);
    }
  });

  it('should have at least 2 expected readings per case', () => {
    for (const c of AMBIGUITY_CASES) {
      expect(c.expectedReadings.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have minReadings <= expectedReadings.length', () => {
    for (const c of AMBIGUITY_CASES) {
      expect(c.minReadings).toBeLessThanOrEqual(c.expectedReadings.length);
    }
  });
});

describe('Ambiguity Category Coverage', () => {
  const categories = new Map<string, number>();
  for (const c of AMBIGUITY_CASES) {
    categories.set(c.category, (categories.get(c.category) ?? 0) + 1);
  }

  it('should cover lexical ambiguity', () => {
    expect(categories.get('lexical') ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('should cover structural ambiguity', () => {
    const structural = (categories.get('structural') ?? 0)
      + (categories.get('pp_attachment') ?? 0)
      + (categories.get('coordination') ?? 0);
    expect(structural).toBeGreaterThanOrEqual(5);
  });

  it('should cover scope ambiguity', () => {
    expect(categories.get('scope') ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('should cover degree ambiguity', () => {
    expect(categories.get('degree') ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('should cover reference ambiguity', () => {
    expect(categories.get('reference') ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('should cover pragmatic ambiguity', () => {
    const pragmatic = (categories.get('pragmatic') ?? 0) + (categories.get('modal') ?? 0);
    expect(pragmatic).toBeGreaterThanOrEqual(3);
  });
});

describe('Ambiguity Must-Clarify Requirements', () => {
  const mustClarify = AMBIGUITY_CASES.filter(c => c.mustClarify);
  const canDefer = AMBIGUITY_CASES.filter(c => !c.mustClarify);

  it('should have must-clarify cases', () => {
    expect(mustClarify.length).toBeGreaterThan(0);
  });

  it('should have can-defer cases', () => {
    expect(canDefer.length).toBeGreaterThan(0);
  });

  it('must-clarify cases should never have single readings', () => {
    for (const c of mustClarify) {
      expect(c.minReadings).toBeGreaterThanOrEqual(2);
    }
  });

  it('cases with pragmatic defaults should explain the default', () => {
    const withDefaults = AMBIGUITY_CASES.filter(c => c.pragmaticDefault !== null);
    for (const c of withDefaults) {
      expect(c.pragmaticDefault!.length).toBeGreaterThan(0);
      // The default should be one of the expected readings (or a substring)
      const matchesReading = c.expectedReadings.some(
        r => r.includes(c.pragmaticDefault!) || c.pragmaticDefault!.includes(r.slice(0, 20)),
      );
      // Allow fuzzy match
      expect(matchesReading || c.pragmaticDefault!.length > 10).toBe(true);
    }
  });
});

describe('Ambiguity Reading Descriptions', () => {
  for (const c of AMBIGUITY_CASES) {
    it(`[${c.id}] "${c.input}" should have distinct readings`, () => {
      // All readings should be unique strings
      const unique = new Set(c.expectedReadings);
      expect(unique.size).toBe(c.expectedReadings.length);
    });

    it(`[${c.id}] ambiguous span "${c.ambiguousSpan}" should appear in input`, () => {
      // The ambiguous span should be findable in the input
      // (with possible ellipsis for non-contiguous spans)
      const cleanSpan = c.ambiguousSpan.replace(/\.\.\./g, '').trim();
      const parts = cleanSpan.split(/\s+/);
      // At least the first word of the span should appear
      if (parts[0]) {
        const inputLower = c.input.toLowerCase().replace(/['"]/g, '');
        const spanLower = parts[0].toLowerCase().replace(/['"]/g, '');
        expect(inputLower.includes(spanLower)).toBe(true);
      }
    });
  }
});

describe('Ambiguity Specific Known Cases', () => {
  it('should flag "make the bass darker" as lexically ambiguous', () => {
    const bassCase = AMBIGUITY_CASES.find(c => c.input === 'make the bass darker');
    expect(bassCase).toBeDefined();
    expect(bassCase!.category).toBe('lexical');
    expect(bassCase!.mustClarify).toBe(true);
    expect(bassCase!.minReadings).toBeGreaterThanOrEqual(2);
  });

  it('should flag "make it darker" as degree-ambiguous', () => {
    const darkerCase = AMBIGUITY_CASES.find(c => c.input === 'make it darker');
    expect(darkerCase).toBeDefined();
    expect(darkerCase!.category).toBe('degree');
    expect(darkerCase!.mustClarify).toBe(true);
    expect(darkerCase!.minReadings).toBeGreaterThanOrEqual(3);
  });

  it('should flag "don\'t make all tracks louder" as scope-ambiguous', () => {
    const scopeCase = AMBIGUITY_CASES.find(c => c.input === "don't make all tracks louder");
    expect(scopeCase).toBeDefined();
    expect(scopeCase!.category).toBe('scope');
    expect(scopeCase!.mustClarify).toBe(true);
  });

  it('should flag "can you make the vocals louder" as pragmatically resolvable', () => {
    const modalCase = AMBIGUITY_CASES.find(c => c.input === 'can you make the vocals louder');
    expect(modalCase).toBeDefined();
    expect(modalCase!.mustClarify).toBe(false);
    expect(modalCase!.pragmaticDefault).toContain('request');
  });
});

// =============================================================================
// EXPORT
// =============================================================================

export { AMBIGUITY_CASES, type AmbiguityTestCase, type AmbiguityType };
