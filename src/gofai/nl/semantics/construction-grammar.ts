/**
 * GOFAI NL Semantics — Construction Grammar Templates
 *
 * Implements "construction grammar" style templates for music-specific
 * phrasings that don't decompose well into standard syntax + semantics.
 *
 * Examples:
 * - "make it hit harder"   → increase(impact/punch, degree=large)
 * - "bring it in earlier"  → shift(entry, direction=earlier)
 * - "open it up"           → increase(width/brightness)
 * - "tighten up the drums" → increase(groove_tightness, target=drums)
 * - "beef up the bass"     → increase(low_end + punch, target=bass)
 * - "warm it up"           → increase(warmth)
 * - "thin it out"          → decrease(density/body)
 * - "dial it back"         → decrease(amount/intensity, degree=moderate)
 * - "strip it down"        → remove(non-essential, target=all)
 * - "push the tempo"       → increase(tempo)
 * - "pull back the reverb" → decrease(reverb.amount)
 * - "let it breathe"       → increase(space/dynamics)
 * - "fatten up the snare"  → increase(body/saturation, target=snare)
 * - "smooth out the vocals" → decrease(harshness, target=vocal)
 *
 * ## Construction Grammar Approach
 *
 * Unlike compositional semantics (where meaning = function(child meanings)),
 * constructions are **form–meaning pairs**: a surface pattern directly maps
 * to a meaning template, bypassing compositional assembly.
 *
 * This is appropriate for idiomatic/metaphorical music production phrases
 * where the meaning is conventionalized and not derivable from parts.
 *
 * ## Template Matching
 *
 * Templates are matched against tokenized input using a pattern language:
 * - Literal tokens: "make", "it", "up"
 * - Wildcard slots: {ENTITY}, {DEGREE}, {AXIS}
 * - Optional elements: [DEGREE]
 * - Particle positions: "open ... up", "bring ... in"
 *
 * @module gofai/nl/semantics/construction-grammar
 * @see gofai_goalA.md Step 134
 */

// Note: SemanticType available from './representation' for future pattern type constraints

// =============================================================================
// CONSTRUCTION TYPES — form–meaning pairs
// =============================================================================

/**
 * A construction: a form–meaning pair.
 */
export interface Construction {
  /** Unique construction ID */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** The form pattern */
  readonly pattern: ConstructionPattern;

  /** The meaning template */
  readonly meaning: MeaningTemplate;

  /** How idiomatic this construction is (0 = compositional, 1 = fully idiomatic) */
  readonly idiomaticity: number;

  /** Frequency/conventionality (higher = more commonly used in music production) */
  readonly conventionality: number;

  /** Whether this construction can be used literally (non-idiomatically) too */
  readonly hasLiteralReading: boolean;

  /** Example usages */
  readonly examples: readonly string[];

  /** Tags for categorization */
  readonly tags: readonly string[];

  /** Human-readable description */
  readonly description: string;
}

// =============================================================================
// CONSTRUCTION PATTERNS — the form side
// =============================================================================

/**
 * A construction pattern: the surface form to match.
 */
export interface ConstructionPattern {
  /** Pattern elements in sequence */
  readonly elements: readonly PatternElement[];

  /** Whether the pattern allows intervening words between elements */
  readonly allowsInterleaving: boolean;

  /** Maximum distance (in tokens) between non-adjacent elements */
  readonly maxGap: number;
}

/**
 * An element in a construction pattern.
 */
export type PatternElement =
  | LiteralElement
  | SlotElement
  | OptionElement
  | AlternativeElement
  | ParticleElement;

/**
 * A literal token that must appear.
 */
export interface LiteralElement {
  readonly kind: 'literal';
  /** The token text (case-insensitive) */
  readonly text: string;
  /** Whether this is the head of the construction (e.g., the verb) */
  readonly isHead: boolean;
}

/**
 * A slot that captures a phrase.
 */
export interface SlotElement {
  readonly kind: 'slot';
  /** Slot name (used in the meaning template) */
  readonly name: string;
  /** Expected semantic type */
  readonly type: SlotType;
  /** Whether this slot is required */
  readonly required: boolean;
}

export type SlotType =
  | 'entity'     // A noun phrase / entity reference
  | 'degree'     // A degree expression
  | 'axis'       // A perceptual axis
  | 'location'   // A location/scope expression
  | 'value'      // A numeric or categorical value
  | 'any';       // Any phrase

/**
 * An optional element (may or may not be present).
 */
export interface OptionElement {
  readonly kind: 'option';
  /** The optional inner element */
  readonly inner: PatternElement;
}

/**
 * An alternative: one of several possible elements.
 */
export interface AlternativeElement {
  readonly kind: 'alternative';
  /** The alternatives */
  readonly choices: readonly PatternElement[];
}

/**
 * A verbal particle (can be separated from the verb: "open X up").
 */
export interface ParticleElement {
  readonly kind: 'particle';
  /** The particle text */
  readonly text: string;
  /** Whether the particle can be separated from the verb */
  readonly separable: boolean;
}

// =============================================================================
// MEANING TEMPLATES — the meaning side
// =============================================================================

/**
 * A meaning template: parameterized semantic output.
 */
export interface MeaningTemplate {
  /** The primary action type */
  readonly action: TemplateAction;

  /** Axis/parameter mappings */
  readonly axisMappings: readonly AxisMapping[];

  /** Default degree (if no degree slot is filled) */
  readonly defaultDegree: DefaultDegree | null;

  /** Constraints implied by the construction */
  readonly impliedConstraints: readonly ImpliedConstraint[];

  /** How to fill the target from pattern slots */
  readonly targetSlot: string | null;

  /** Additional semantic features */
  readonly features: ReadonlyMap<string, string>;
}

export type TemplateAction =
  | 'increase'
  | 'decrease'
  | 'set'
  | 'add'
  | 'remove'
  | 'shift'
  | 'transform';

/**
 * An axis mapping: what perceptual axes this construction affects.
 */
export interface AxisMapping {
  /** The axis name */
  readonly axisName: string;

  /** Direction of change */
  readonly direction: 'increase' | 'decrease';

  /** Weight (when multiple axes are affected) */
  readonly weight: number;

  /** Whether this is the primary axis */
  readonly primary: boolean;
}

/**
 * Default degree when not explicitly specified.
 */
export interface DefaultDegree {
  /** The default intensity (0–1) */
  readonly intensity: number;

  /** The default level name */
  readonly level: string;
}

/**
 * A constraint implied by the construction.
 */
export interface ImpliedConstraint {
  /** Constraint type */
  readonly type: string;

  /** What is constrained */
  readonly target: string;

  /** Description */
  readonly description: string;
}

// =============================================================================
// PATTERN MATCHING — matching constructions against input
// =============================================================================

/**
 * An input token for matching (minimal interface).
 */
export interface MatchToken {
  readonly text: string;
  readonly type: string;
  readonly index: number;
  readonly start: number;
  readonly end: number;
}

/**
 * Result of matching a construction against input.
 */
export interface ConstructionMatch {
  /** The construction that matched */
  readonly construction: Construction;

  /** Confidence of the match (0–1) */
  readonly confidence: number;

  /** How many tokens the match consumed */
  readonly tokensConsumed: number;

  /** Slot fillers: slot name → captured tokens */
  readonly slotFillers: ReadonlyMap<string, readonly MatchToken[]>;

  /** Which tokens were matched (by index) */
  readonly matchedIndices: ReadonlySet<number>;

  /** Span of the match */
  readonly start: number;
  readonly end: number;
}

/**
 * Match a construction pattern against a sequence of tokens.
 */
export function matchConstruction(
  construction: Construction,
  tokens: readonly MatchToken[],
  startIndex: number = 0,
): ConstructionMatch | null {
  const pattern = construction.pattern;
  const elements = pattern.elements;

  let tokenIdx = startIndex;
  const slotFillers = new Map<string, MatchToken[]>();
  const matchedIndices = new Set<number>();
  let allLiteralsMatched = true;

  for (const element of elements) {
    if (tokenIdx >= tokens.length) {
      // Check if remaining elements are optional
      if (isRequired(element)) {
        allLiteralsMatched = false;
        break;
      }
      continue;
    }

    const result = matchElement(element, tokens, tokenIdx, pattern.maxGap, pattern.allowsInterleaving);
    if (result === null) {
      if (isRequired(element)) {
        allLiteralsMatched = false;
        break;
      }
      continue;
    }

    for (const idx of result.matched) {
      matchedIndices.add(idx);
    }
    if (result.slotName && result.captured.length > 0) {
      slotFillers.set(result.slotName, result.captured);
    }
    tokenIdx = result.nextIndex;
  }

  if (!allLiteralsMatched) {
    return null;
  }

  // Calculate confidence based on match coverage
  const literalCount = elements.filter(e => e.kind === 'literal' || e.kind === 'particle').length;
  const matchedLiteralCount = elements.filter(e =>
    (e.kind === 'literal' || e.kind === 'particle') &&
    [...matchedIndices].some(idx => {
      const token = tokens[idx];
      return token && token.text.toLowerCase() === ((e as LiteralElement).text ?? (e as ParticleElement).text).toLowerCase();
    })
  ).length;

  const confidence = literalCount > 0
    ? (matchedLiteralCount / literalCount) * construction.conventionality
    : construction.conventionality;

  const matchStart = tokens[startIndex]?.start ?? 0;
  const lastMatchedIdx = Math.max(...matchedIndices, startIndex);
  const matchEnd = tokens[lastMatchedIdx]?.end ?? matchStart;

  return {
    construction,
    confidence: Math.min(1, confidence),
    tokensConsumed: tokenIdx - startIndex,
    slotFillers,
    matchedIndices,
    start: matchStart,
    end: matchEnd,
  };
}

/**
 * Check whether a pattern element is required.
 */
function isRequired(element: PatternElement): boolean {
  switch (element.kind) {
    case 'literal': return true;
    case 'slot': return element.required;
    case 'option': return false;
    case 'alternative': return true;
    case 'particle': return true;
  }
}

/**
 * Result of matching a single element.
 */
interface ElementMatchResult {
  readonly matched: readonly number[];
  readonly nextIndex: number;
  readonly slotName: string | null;
  readonly captured: MatchToken[];
}

/**
 * Match a single pattern element against tokens.
 */
function matchElement(
  element: PatternElement,
  tokens: readonly MatchToken[],
  startIdx: number,
  maxGap: number,
  _allowsInterleaving: boolean,
): ElementMatchResult | null {
  switch (element.kind) {
    case 'literal': {
      // Look for the literal within maxGap tokens
      for (let i = startIdx; i < Math.min(startIdx + maxGap + 1, tokens.length); i++) {
        if (tokens[i]!.text.toLowerCase() === element.text.toLowerCase()) {
          return {
            matched: [i],
            nextIndex: i + 1,
            slotName: null,
            captured: [],
          };
        }
      }
      return null;
    }

    case 'particle': {
      // Particle: similar to literal but can be separated
      if (element.separable) {
        // Search further ahead
        const searchLimit = Math.min(startIdx + maxGap + 3, tokens.length);
        for (let i = startIdx; i < searchLimit; i++) {
          if (tokens[i]!.text.toLowerCase() === element.text.toLowerCase()) {
            return {
              matched: [i],
              nextIndex: i + 1,
              slotName: null,
              captured: [],
            };
          }
        }
      } else {
        // Non-separable: must be adjacent
        if (startIdx < tokens.length && tokens[startIdx]!.text.toLowerCase() === element.text.toLowerCase()) {
          return {
            matched: [startIdx],
            nextIndex: startIdx + 1,
            slotName: null,
            captured: [],
          };
        }
      }
      return null;
    }

    case 'slot': {
      // Capture tokens until we hit the next literal/particle or end
      const captured: MatchToken[] = [];
      const matched: number[] = [];
      let i = startIdx;
      // Capture at most 5 tokens for a slot
      while (i < tokens.length && captured.length < 5) {
        captured.push(tokens[i]!);
        matched.push(i);
        i++;
        // Stop if we see a common function word that might start a new phrase
        if (i < tokens.length) {
          const nextText = tokens[i]!.text.toLowerCase();
          if (SLOT_BOUNDARY_WORDS.has(nextText)) break;
        }
      }
      if (captured.length === 0 && element.required) return null;
      return {
        matched,
        nextIndex: i,
        slotName: element.name,
        captured,
      };
    }

    case 'option': {
      const inner = matchElement(element.inner, tokens, startIdx, maxGap, _allowsInterleaving);
      if (inner) return inner;
      // Optional — return empty match
      return {
        matched: [],
        nextIndex: startIdx,
        slotName: null,
        captured: [],
      };
    }

    case 'alternative': {
      for (const choice of element.choices) {
        const result = matchElement(choice, tokens, startIdx, maxGap, _allowsInterleaving);
        if (result) return result;
      }
      return null;
    }
  }
}

/**
 * Words that typically mark the boundary of a slot capture.
 */
const SLOT_BOUNDARY_WORDS: ReadonlySet<string> = new Set([
  'up', 'down', 'in', 'out', 'on', 'off', 'back',
  'to', 'from', 'by', 'at', 'for', 'with',
  'and', 'but', 'or',
  'more', 'less', 'much', 'very',
]);

// =============================================================================
// CONSTRUCTION LIBRARY — built-in music production constructions
// =============================================================================

// Helper to create literal, slot, and particle elements
function lit(text: string, isHead: boolean = false): LiteralElement {
  return { kind: 'literal', text, isHead };
}

function slot(name: string, type: SlotType, required: boolean = false): SlotElement {
  return { kind: 'slot', name, type, required };
}

function particle(text: string, separable: boolean = true): ParticleElement {
  return { kind: 'particle', text, separable };
}

function optional(inner: PatternElement): OptionElement {
  return { kind: 'option', inner };
}

/**
 * Built-in construction library for music production idioms.
 */
export const CONSTRUCTION_LIBRARY: readonly Construction[] = [
  // ── "make it hit harder" ──────────────────────────────────────────────
  {
    id: 'cx:make-hit-harder',
    name: 'Make Hit Harder',
    pattern: {
      elements: [
        lit('make', true),
        slot('TARGET', 'entity'),
        lit('hit'),
        optional(slot('DEGREE', 'degree')),
        lit('harder'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'punch', direction: 'increase', weight: 0.6, primary: true },
        { axisName: 'loudness', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'attack', direction: 'increase', weight: 0.1, primary: false },
      ],
      defaultDegree: { intensity: 0.6, level: 'large' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.9,
    conventionality: 0.85,
    hasLiteralReading: false,
    examples: ['make it hit harder', 'make the drums hit harder', 'make it hit much harder'],
    tags: ['dynamics', 'impact', 'idiomatic'],
    description: 'Increase perceived impact/punch of an element',
  },

  // ── "bring it in" ────────────────────────────────────────────────────
  {
    id: 'cx:bring-in',
    name: 'Bring In',
    pattern: {
      elements: [
        lit('bring', true),
        slot('TARGET', 'entity'),
        particle('in'),
        optional(slot('TIME', 'location')),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'add',
      axisMappings: [],
      defaultDegree: null,
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map([['entry_timing', 'earlier']]),
    },
    idiomaticity: 0.7,
    conventionality: 0.9,
    hasLiteralReading: false,
    examples: ['bring the bass in', 'bring it in at bar 8', 'bring in the strings'],
    tags: ['arrangement', 'timing', 'idiomatic'],
    description: 'Introduce an element at a point in the arrangement',
  },

  // ── "open it up" ────────────────────────────────────────────────────
  {
    id: 'cx:open-up',
    name: 'Open Up',
    pattern: {
      elements: [
        lit('open', true),
        slot('TARGET', 'entity'),
        particle('up'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'width', direction: 'increase', weight: 0.4, primary: true },
        { axisName: 'brightness', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'clarity', direction: 'increase', weight: 0.3, primary: false },
      ],
      defaultDegree: { intensity: 0.5, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.85,
    conventionality: 0.8,
    hasLiteralReading: false,
    examples: ['open it up', 'open up the mix', 'open the chorus up'],
    tags: ['mix', 'width', 'brightness', 'idiomatic'],
    description: 'Increase openness/airiness of a mix element',
  },

  // ── "tighten up" ───────────────────────────────────────────────────
  {
    id: 'cx:tighten-up',
    name: 'Tighten Up',
    pattern: {
      elements: [
        lit('tighten', true),
        particle('up'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'groove_tightness', direction: 'increase', weight: 0.7, primary: true },
        { axisName: 'punch', direction: 'increase', weight: 0.3, primary: false },
      ],
      defaultDegree: { intensity: 0.5, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.8,
    conventionality: 0.85,
    hasLiteralReading: false,
    examples: ['tighten up the drums', 'tighten up the groove', 'tighten it up'],
    tags: ['rhythm', 'groove', 'idiomatic'],
    description: 'Increase rhythmic precision/tightness',
  },

  // ── "beef up" ──────────────────────────────────────────────────────
  {
    id: 'cx:beef-up',
    name: 'Beef Up',
    pattern: {
      elements: [
        lit('beef', true),
        particle('up'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'warmth', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'saturation', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'loudness', direction: 'increase', weight: 0.2, primary: false },
        { axisName: 'punch', direction: 'increase', weight: 0.2, primary: true },
      ],
      defaultDegree: { intensity: 0.5, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.95,
    conventionality: 0.8,
    hasLiteralReading: false,
    examples: ['beef up the bass', 'beef it up', 'beef up the low end'],
    tags: ['body', 'punch', 'idiomatic'],
    description: 'Add body, weight, and presence to an element',
  },

  // ── "warm up" ──────────────────────────────────────────────────────
  {
    id: 'cx:warm-up',
    name: 'Warm Up',
    pattern: {
      elements: [
        lit('warm', true),
        slot('TARGET', 'entity'),
        particle('up'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'warmth', direction: 'increase', weight: 1.0, primary: true },
      ],
      defaultDegree: { intensity: 0.4, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.6,
    conventionality: 0.9,
    hasLiteralReading: true,
    examples: ['warm it up', 'warm up the synths', 'warm the mix up'],
    tags: ['tone', 'warmth', 'semi-idiomatic'],
    description: 'Increase warmth/analog character',
  },

  // ── "thin out" ─────────────────────────────────────────────────────
  {
    id: 'cx:thin-out',
    name: 'Thin Out',
    pattern: {
      elements: [
        lit('thin', true),
        slot('TARGET', 'entity'),
        particle('out'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'decrease',
      axisMappings: [
        { axisName: 'density', direction: 'decrease', weight: 0.5, primary: true },
        { axisName: 'warmth', direction: 'decrease', weight: 0.3, primary: false },
        { axisName: 'loudness', direction: 'decrease', weight: 0.2, primary: false },
      ],
      defaultDegree: { intensity: 0.4, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.75,
    conventionality: 0.75,
    hasLiteralReading: true,
    examples: ['thin it out', 'thin out the arrangement', 'thin the texture out'],
    tags: ['density', 'arrangement', 'semi-idiomatic'],
    description: 'Reduce density/body of an arrangement element',
  },

  // ── "dial back" ────────────────────────────────────────────────────
  {
    id: 'cx:dial-back',
    name: 'Dial Back',
    pattern: {
      elements: [
        lit('dial', true),
        particle('back'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'decrease',
      axisMappings: [], // Generic decrease — the target determines the axis
      defaultDegree: { intensity: 0.3, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map([['precision', 'controlled']]),
    },
    idiomaticity: 0.85,
    conventionality: 0.8,
    hasLiteralReading: false,
    examples: ['dial back the reverb', 'dial it back', 'dial back the highs'],
    tags: ['decrease', 'control', 'idiomatic'],
    description: 'Reduce a parameter in a controlled manner',
  },

  // ── "strip down" ──────────────────────────────────────────────────
  {
    id: 'cx:strip-down',
    name: 'Strip Down',
    pattern: {
      elements: [
        lit('strip', true),
        slot('TARGET', 'entity'),
        particle('down'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'remove',
      axisMappings: [
        { axisName: 'density', direction: 'decrease', weight: 1.0, primary: true },
      ],
      defaultDegree: { intensity: 0.8, level: 'large' },
      impliedConstraints: [
        { type: 'preserve', target: 'core_elements', description: 'Keep essential/core elements' },
      ],
      targetSlot: 'TARGET',
      features: new Map([['scope', 'non-essential']]),
    },
    idiomaticity: 0.9,
    conventionality: 0.8,
    hasLiteralReading: false,
    examples: ['strip it down', 'strip down the arrangement', 'strip the verse down'],
    tags: ['arrangement', 'minimalism', 'idiomatic'],
    description: 'Remove non-essential elements for a minimal arrangement',
  },

  // ── "push the tempo" ──────────────────────────────────────────────
  {
    id: 'cx:push-tempo',
    name: 'Push The Tempo',
    pattern: {
      elements: [
        lit('push', true),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: false,
      maxGap: 1,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'energy', direction: 'increase', weight: 0.5, primary: true },
        { axisName: 'tempo', direction: 'increase', weight: 0.5, primary: false },
      ],
      defaultDegree: { intensity: 0.4, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.7,
    conventionality: 0.75,
    hasLiteralReading: true,
    examples: ['push the tempo', 'push it', 'push the energy'],
    tags: ['tempo', 'energy', 'semi-idiomatic'],
    description: 'Increase tempo or energy',
  },

  // ── "pull back" ───────────────────────────────────────────────────
  {
    id: 'cx:pull-back',
    name: 'Pull Back',
    pattern: {
      elements: [
        lit('pull', true),
        particle('back'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'decrease',
      axisMappings: [],
      defaultDegree: { intensity: 0.3, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map([['subtlety', 'yes']]),
    },
    idiomaticity: 0.8,
    conventionality: 0.8,
    hasLiteralReading: false,
    examples: ['pull back the reverb', 'pull it back', 'pull back the vocals'],
    tags: ['decrease', 'subtle', 'idiomatic'],
    description: 'Reduce/attenuate an element subtly',
  },

  // ── "let it breathe" ──────────────────────────────────────────────
  {
    id: 'cx:let-breathe',
    name: 'Let It Breathe',
    pattern: {
      elements: [
        lit('let', true),
        slot('TARGET', 'entity'),
        lit('breathe'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'width', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'clarity', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'density', direction: 'decrease', weight: 0.4, primary: true },
      ],
      defaultDegree: { intensity: 0.4, level: 'moderate' },
      impliedConstraints: [
        { type: 'dynamics', target: 'dynamic_range', description: 'Increase dynamic range' },
      ],
      targetSlot: 'TARGET',
      features: new Map([['space', 'yes'], ['dynamics', 'more_range']]),
    },
    idiomaticity: 0.95,
    conventionality: 0.8,
    hasLiteralReading: false,
    examples: ['let it breathe', 'let the mix breathe', 'let the drums breathe'],
    tags: ['dynamics', 'space', 'idiomatic'],
    description: 'Add space and dynamic range to avoid over-compression',
  },

  // ── "fatten up" ───────────────────────────────────────────────────
  {
    id: 'cx:fatten-up',
    name: 'Fatten Up',
    pattern: {
      elements: [
        lit('fatten', true),
        particle('up'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'warmth', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'saturation', direction: 'increase', weight: 0.4, primary: true },
        { axisName: 'loudness', direction: 'increase', weight: 0.3, primary: false },
      ],
      defaultDegree: { intensity: 0.5, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.9,
    conventionality: 0.75,
    hasLiteralReading: false,
    examples: ['fatten up the snare', 'fatten it up', 'fatten up the bass'],
    tags: ['body', 'saturation', 'idiomatic'],
    description: 'Add body and harmonic saturation',
  },

  // ── "smooth out" ──────────────────────────────────────────────────
  {
    id: 'cx:smooth-out',
    name: 'Smooth Out',
    pattern: {
      elements: [
        lit('smooth', true),
        particle('out'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'decrease',
      axisMappings: [
        { axisName: 'brightness', direction: 'decrease', weight: 0.4, primary: false },
        { axisName: 'attack', direction: 'decrease', weight: 0.3, primary: false },
        { axisName: 'clarity', direction: 'increase', weight: 0.3, primary: true },
      ],
      defaultDegree: { intensity: 0.4, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map([['harshness', 'reduce']]),
    },
    idiomaticity: 0.75,
    conventionality: 0.8,
    hasLiteralReading: true,
    examples: ['smooth out the vocals', 'smooth it out', 'smooth out the high end'],
    tags: ['tone', 'smoothness', 'semi-idiomatic'],
    description: 'Reduce harshness and smooth transients',
  },

  // ── "crank up" ────────────────────────────────────────────────────
  {
    id: 'cx:crank-up',
    name: 'Crank Up',
    pattern: {
      elements: [
        lit('crank', true),
        particle('up'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [],
      defaultDegree: { intensity: 0.8, level: 'large' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map([['emphasis', 'strong']]),
    },
    idiomaticity: 0.85,
    conventionality: 0.7,
    hasLiteralReading: false,
    examples: ['crank up the bass', 'crank it up', 'crank up the volume'],
    tags: ['increase', 'extreme', 'idiomatic'],
    description: 'Strongly increase a parameter',
  },

  // ── "fill out" ────────────────────────────────────────────────────
  {
    id: 'cx:fill-out',
    name: 'Fill Out',
    pattern: {
      elements: [
        lit('fill', true),
        particle('out'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'density', direction: 'increase', weight: 0.5, primary: true },
        { axisName: 'width', direction: 'increase', weight: 0.3, primary: false },
        { axisName: 'warmth', direction: 'increase', weight: 0.2, primary: false },
      ],
      defaultDegree: { intensity: 0.5, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.7,
    conventionality: 0.75,
    hasLiteralReading: true,
    examples: ['fill out the chorus', 'fill it out', 'fill out the low end'],
    tags: ['density', 'arrangement', 'semi-idiomatic'],
    description: 'Add fullness and density to an arrangement element',
  },

  // ── "brighten up" ─────────────────────────────────────────────────
  {
    id: 'cx:brighten-up',
    name: 'Brighten Up',
    pattern: {
      elements: [
        lit('brighten', true),
        particle('up'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'brightness', direction: 'increase', weight: 1.0, primary: true },
      ],
      defaultDegree: { intensity: 0.4, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map(),
    },
    idiomaticity: 0.5,
    conventionality: 0.85,
    hasLiteralReading: true,
    examples: ['brighten up the mix', 'brighten it up', 'brighten up the highs'],
    tags: ['tone', 'brightness', 'compositional'],
    description: 'Increase brightness/high-frequency content',
  },

  // ── "clean up" ────────────────────────────────────────────────────
  {
    id: 'cx:clean-up',
    name: 'Clean Up',
    pattern: {
      elements: [
        lit('clean', true),
        particle('up'),
        slot('TARGET', 'entity'),
      ],
      allowsInterleaving: true,
      maxGap: 2,
    },
    meaning: {
      action: 'increase',
      axisMappings: [
        { axisName: 'clarity', direction: 'increase', weight: 0.5, primary: true },
        { axisName: 'saturation', direction: 'decrease', weight: 0.3, primary: false },
        { axisName: 'density', direction: 'decrease', weight: 0.2, primary: false },
      ],
      defaultDegree: { intensity: 0.4, level: 'moderate' },
      impliedConstraints: [],
      targetSlot: 'TARGET',
      features: new Map([['noise', 'reduce'], ['mudiness', 'reduce']]),
    },
    idiomaticity: 0.6,
    conventionality: 0.85,
    hasLiteralReading: true,
    examples: ['clean up the mix', 'clean it up', 'clean up the low end'],
    tags: ['clarity', 'mix', 'semi-idiomatic'],
    description: 'Reduce noise, muddiness, and improve clarity',
  },
];

// =============================================================================
// CONSTRUCTION MATCHER — finding the best construction for input
// =============================================================================

/**
 * Match all constructions against an input and return ranked results.
 */
export function matchAllConstructions(
  tokens: readonly MatchToken[],
  library: readonly Construction[] = CONSTRUCTION_LIBRARY,
): readonly ConstructionMatch[] {
  const matches: ConstructionMatch[] = [];

  for (const construction of library) {
    // Try matching at the beginning
    const match = matchConstruction(construction, tokens, 0);
    if (match && match.confidence > 0.3) {
      matches.push(match);
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Get the best construction match (if any exceeds the threshold).
 */
export function bestConstructionMatch(
  tokens: readonly MatchToken[],
  threshold: number = 0.5,
  library: readonly Construction[] = CONSTRUCTION_LIBRARY,
): ConstructionMatch | null {
  const matches = matchAllConstructions(tokens, library);
  if (matches.length === 0) return null;
  const best = matches[0]!;
  return best.confidence >= threshold ? best : null;
}

// =============================================================================
// CONSTRUCTION REGISTRY — managing custom constructions
// =============================================================================

/**
 * Registry for custom constructions (extensions can add their own).
 */
export class ConstructionRegistry {
  private readonly constructions: Map<string, Construction> = new Map();
  private readonly byTag: Map<string, Set<string>> = new Map();

  constructor() {
    // Load built-in constructions
    for (const c of CONSTRUCTION_LIBRARY) {
      this.register(c);
    }
  }

  /**
   * Register a construction.
   */
  register(construction: Construction): void {
    this.constructions.set(construction.id, construction);
    for (const tag of construction.tags) {
      if (!this.byTag.has(tag)) {
        this.byTag.set(tag, new Set());
      }
      this.byTag.get(tag)!.add(construction.id);
    }
  }

  /**
   * Get a construction by ID.
   */
  get(id: string): Construction | undefined {
    return this.constructions.get(id);
  }

  /**
   * Get all constructions.
   */
  all(): readonly Construction[] {
    return [...this.constructions.values()];
  }

  /**
   * Get constructions by tag.
   */
  byTagName(tag: string): readonly Construction[] {
    const ids = this.byTag.get(tag);
    if (!ids) return [];
    return [...ids].map(id => this.constructions.get(id)!).filter(Boolean);
  }

  /**
   * Match against all registered constructions.
   */
  match(tokens: readonly MatchToken[]): readonly ConstructionMatch[] {
    return matchAllConstructions(tokens, this.all());
  }

  /**
   * Get the number of registered constructions.
   */
  size(): number {
    return this.constructions.size;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let _globalConstructionRegistry: ConstructionRegistry | null = null;

/**
 * Get the global construction registry (singleton).
 */
export function getConstructionRegistry(): ConstructionRegistry {
  if (!_globalConstructionRegistry) {
    _globalConstructionRegistry = new ConstructionRegistry();
  }
  return _globalConstructionRegistry;
}

// =============================================================================
// DIAGNOSTICS
// =============================================================================

/**
 * Format a construction match as a diagnostic string.
 */
export function formatConstructionMatch(match: ConstructionMatch): string {
  const lines: string[] = [];
  lines.push(`Construction: ${match.construction.name} (${match.construction.id})`);
  lines.push(`  Confidence: ${(match.confidence * 100).toFixed(0)}%`);
  lines.push(`  Tokens consumed: ${match.tokensConsumed}`);
  lines.push(`  Action: ${match.construction.meaning.action}`);

  if (match.construction.meaning.axisMappings.length > 0) {
    lines.push('  Axis mappings:');
    for (const m of match.construction.meaning.axisMappings) {
      lines.push(`    ${m.axisName}: ${m.direction} (weight: ${m.weight}${m.primary ? ', PRIMARY' : ''})`);
    }
  }

  if (match.slotFillers.size > 0) {
    lines.push('  Slots:');
    for (const [name, tokens] of match.slotFillers) {
      lines.push(`    ${name}: "${tokens.map(t => t.text).join(' ')}"`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the construction grammar module.
 */
export function getConstructionGrammarStats(): {
  builtInConstructions: number;
  idiomaticCount: number;
  semiIdiomaticCount: number;
  tagCount: number;
  uniqueAxes: number;
} {
  const axes = new Set<string>();
  let idiomaticCount = 0;
  let semiIdiomaticCount = 0;

  for (const c of CONSTRUCTION_LIBRARY) {
    if (c.idiomaticity >= 0.8) idiomaticCount++;
    else if (c.idiomaticity >= 0.5) semiIdiomaticCount++;

    for (const m of c.meaning.axisMappings) {
      axes.add(m.axisName);
    }
  }

  const tags = new Set<string>();
  for (const c of CONSTRUCTION_LIBRARY) {
    for (const t of c.tags) tags.add(t);
  }

  return {
    builtInConstructions: CONSTRUCTION_LIBRARY.length,
    idiomaticCount,
    semiIdiomaticCount,
    tagCount: tags.size,
    uniqueAxes: axes.size,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetConstructionGrammar(): void {
  _globalConstructionRegistry = null;
}
