/**
 * @fileoverview MusicSpec ⇄ Prolog Encoder/Decoder
 * 
 * Provides bidirectional conversion between TypeScript `MusicSpec` and
 * Prolog facts/terms. This is the core bridge for Branch C theory features.
 * 
 * Implements:
 * - C053: specToPrologFacts - encode MusicSpec to Prolog assertions
 * - C054: factsToSpec - decode Prolog bindings back to MusicSpec
 * - C055: per-board context slice encoding
 * - Custom constraint integration via constraintRegistry
 * 
 * @module @cardplay/ai/theory/spec-prolog-bridge
 */

import {
  MusicSpec,
  MusicConstraint,
  RootName,
  ModeName,
  TonalityModel,
  StyleTag,
  CultureTag,
  createMusicSpec,
} from './music-spec';

import {
  constraintRegistry,
  isCustomConstraint,
  type CustomConstraint,
  generateCustomPrologLoader,
} from './custom-constraints';

// ============================================================================
// PROLOG FACT ENCODING (C053)
// ============================================================================

/**
 * Convert a RootName to its Prolog atom representation.
 * Note names are already Prolog-compatible (lowercase atoms).
 */
function rootToProlog(root: RootName): string {
  return root;
}

/**
 * Convert a ModeName to its Prolog atom representation.
 */
function modeToProlog(mode: ModeName): string {
  return mode;
}

/**
 * C053: Encode a MusicSpec to Prolog fact assertions.
 * 
 * Generates a list of Prolog fact strings that can be asserted into
 * the Prolog database to represent the current spec.
 * 
 * Uses the `spec_` prefix for all generated facts to avoid conflicts.
 */
export function specToPrologFacts(spec: MusicSpec, specId = 'current'): string[] {
  const facts: string[] = [];
  const id = specId;
  
  // Core spec properties
  facts.push(`spec_key(${id}, ${rootToProlog(spec.keyRoot)}, ${modeToProlog(spec.mode)}).`);
  facts.push(`spec_meter(${id}, ${spec.meterNumerator}, ${spec.meterDenominator}).`);
  facts.push(`spec_tempo(${id}, ${spec.tempo}).`);
  facts.push(`spec_tonality_model(${id}, ${spec.tonalityModel}).`);
  facts.push(`spec_style(${id}, ${spec.style}).`);
  facts.push(`spec_culture(${id}, ${spec.culture}).`);
  
  // Encode each constraint
  for (const constraint of spec.constraints) {
    const constraintFact = constraintToPrologFact(constraint, id);
    if (constraintFact) {
      facts.push(constraintFact);
    }
  }
  
  return facts;
}

/**
 * Encode a single constraint to a Prolog fact string.
 */
function constraintToPrologFact(constraint: MusicConstraint, specId: string): string | null {
  // Check if it's a custom constraint first (before switch)
  if (isCustomConstraint(constraint as MusicConstraint | CustomConstraint)) {
    return constraintRegistry.constraintToPrologFact(
      constraint as unknown as CustomConstraint,
      specId
    );
  }

  const hard = constraint.hard ? 'hard' : 'soft';
  const weight = constraint.weight ?? 1.0;

  switch (constraint.type) {
    case 'key':
      return `spec_constraint(${specId}, key(${constraint.root}, ${constraint.mode}), ${hard}, ${weight}).`;

    case 'tempo':
      return `spec_constraint(${specId}, tempo(${constraint.bpm}), ${hard}, ${weight}).`;

    case 'meter':
      return `spec_constraint(${specId}, meter(${constraint.numerator}, ${constraint.denominator}), ${hard}, ${weight}).`;

    case 'tonality_model':
      return `spec_constraint(${specId}, tonality_model(${constraint.model}), ${hard}, ${weight}).`;

    case 'style':
      return `spec_constraint(${specId}, style(${constraint.style}), ${hard}, ${weight}).`;

    case 'culture':
      return `spec_constraint(${specId}, culture(${constraint.culture}), ${hard}, ${weight}).`;

    case 'schema':
      return `spec_constraint(${specId}, schema(${constraint.schema}), ${hard}, ${weight}).`;

    case 'raga':
      return `spec_constraint(${specId}, raga(${constraint.raga}), ${hard}, ${weight}).`;

    case 'tala':
      const jatiArg = constraint.jati ? `, ${constraint.jati}` : '';
      return `spec_constraint(${specId}, tala(${constraint.tala}${jatiArg}), ${hard}, ${weight}).`;

    case 'celtic_tune':
      return `spec_constraint(${specId}, celtic_tune(${constraint.tuneType}), ${hard}, ${weight}).`;

    case 'chinese_mode':
      const bianArg = constraint.includeBian ? ', with_bian' : '';
      return `spec_constraint(${specId}, chinese_mode(${constraint.mode}${bianArg}), ${hard}, ${weight}).`;

    case 'film_mood':
      return `spec_constraint(${specId}, film_mood(${constraint.mood}), ${hard}, ${weight}).`;

    case 'film_device':
      return `spec_constraint(${specId}, film_device(${constraint.device}), ${hard}, ${weight}).`;

    case 'phrase_density':
      return `spec_constraint(${specId}, phrase_density(${constraint.density}), ${hard}, ${weight}).`;

    case 'contour':
      return `spec_constraint(${specId}, contour(${constraint.contour}), ${hard}, ${weight}).`;

    case 'grouping':
      return `spec_constraint(${specId}, grouping(${constraint.sensitivity}), ${hard}, ${weight}).`;

    case 'accent':
      return `spec_constraint(${specId}, accent_model(${constraint.model}), ${hard}, ${weight}).`;

    case 'gamaka_density':
      return `spec_constraint(${specId}, gamaka_density(${constraint.density}), ${hard}, ${weight}).`;

    case 'ornament_budget':
      return `spec_constraint(${specId}, ornament_budget(${constraint.maxPerBeat}), ${hard}, ${weight}).`;

    case 'harmonic_rhythm':
      return `spec_constraint(${specId}, harmonic_rhythm(${constraint.changesPerBar}), ${hard}, ${weight}).`;

    case 'cadence':
      return `spec_constraint(${specId}, cadence(${constraint.cadenceType}), ${hard}, ${weight}).`;

    case 'trailer_build':
      return `spec_constraint(${specId}, trailer_build(${constraint.buildBars}, ${constraint.hitCount}, ${constraint.percussionDensity}), ${hard}, ${weight}).`;

    case 'leitmotif':
      return constraint.transformOp
        ? `spec_constraint(${specId}, leitmotif(${constraint.motifId}, ${constraint.transformOp}), ${hard}, ${weight}).`
        : `spec_constraint(${specId}, leitmotif(${constraint.motifId}), ${hard}, ${weight}).`;

    case 'drone': {
      const tonesList = (constraint.droneTones as readonly string[]).join(', ');
      return `spec_constraint(${specId}, drone([${tonesList}], ${constraint.droneStyle}), ${hard}, ${weight}).`;
    }

    case 'pattern_role':
      return `spec_constraint(${specId}, pattern_role(${constraint.role}), ${hard}, ${weight}).`;

    case 'swing':
      return `spec_constraint(${specId}, swing(${constraint.amount}), ${hard}, ${weight}).`;

    case 'heterophony':
      return `spec_constraint(${specId}, heterophony(${constraint.voiceCount}, ${constraint.variationDepth}, ${constraint.timingSpread}), ${hard}, ${weight}).`;

    case 'max_interval':
      return `spec_constraint(${specId}, max_interval(${constraint.semitones}), ${hard}, ${weight}).`;

    case 'arranger_style':
      return `spec_constraint(${specId}, arranger_style(${constraint.style}), ${hard}, ${weight}).`;

    case 'scene_arc':
      return `spec_constraint(${specId}, scene_arc(${constraint.arcType}), ${hard}, ${weight}).`;

    default:
      // Should never reach here - custom constraints are handled before the switch (line 89)
      // and all built-in constraint types are handled in cases above
      console.warn(`Unhandled constraint type: ${(constraint as any).type}`);
      return null;
  }
}

/**
 * Generate a single composite Prolog term representing the spec.
 * This is the Prolog `music_spec/7` format from the roadmap.
 */
export function specToPrologTerm(spec: MusicSpec): string {
  const constraintsList = spec.constraints.map(c => constraintToTerm(c)).join(', ');
  
  return `music_spec(
    key(${rootToProlog(spec.keyRoot)}, ${modeToProlog(spec.mode)}),
    meter(${spec.meterNumerator}, ${spec.meterDenominator}),
    tempo(${spec.tempo}),
    tonality_model(${spec.tonalityModel}),
    style(${spec.style}),
    culture(${spec.culture}),
    constraints([${constraintsList}])
  )`;
}

/**
 * Convert a constraint to a Prolog term (without trailing period).
 */
function constraintToTerm(constraint: MusicConstraint): string {
  // Handle custom constraints first
  if (isCustomConstraint(constraint as MusicConstraint | CustomConstraint)) {
    const customFact = constraintRegistry.constraintToPrologFact(
      constraint as unknown as CustomConstraint,
      'spec'
    );
    if (customFact) {
      // Strip the wrapping spec_constraint(...) and trailing period if present
      const match = customFact.match(/spec_constraint\(spec,\s*(.+?),\s*(?:hard|soft),\s*[\d.]+\)\.?/);
      return (match && match[1]) ? match[1] : `custom(${(constraint as any).type})`;
    }
    return `custom(${(constraint as any).type})`;
  }

  switch (constraint.type) {
    case 'key':
      return `key(${constraint.root}, ${constraint.mode})`;
    case 'tempo':
      return `tempo(${constraint.bpm})`;
    case 'meter':
      return `meter(${constraint.numerator}, ${constraint.denominator})`;
    case 'schema':
      return `schema(${constraint.schema})`;
    case 'raga':
      return `raga(${constraint.raga})`;
    case 'tala':
      return constraint.jati ? `tala(${constraint.tala}, ${constraint.jati})` : `tala(${constraint.tala})`;
    case 'celtic_tune':
      return `celtic_tune(${constraint.tuneType})`;
    case 'chinese_mode':
      return constraint.includeBian ? `chinese_mode(${constraint.mode}, with_bian)` : `chinese_mode(${constraint.mode})`;
    case 'film_mood':
      return `film_mood(${constraint.mood})`;
    case 'film_device':
      return `film_device(${constraint.device})`;
    case 'phrase_density':
      return `phrase_density(${constraint.density})`;
    case 'contour':
      return `contour(${constraint.contour})`;
    case 'grouping':
      return `grouping(${constraint.sensitivity})`;
    case 'accent':
      return `accent_model(${constraint.model})`;
    case 'gamaka_density':
      return `gamaka_density(${constraint.density})`;
    case 'ornament_budget':
      return `ornament_budget(${constraint.maxPerBeat})`;
    case 'harmonic_rhythm':
      return `harmonic_rhythm(${constraint.changesPerBar})`;
    case 'cadence':
      return `cadence(${constraint.cadenceType})`;
    case 'tonality_model':
      return `tonality_model(${constraint.model})`;
    case 'style':
      return `style(${constraint.style})`;
    case 'culture':
      return `culture(${constraint.culture})`;
    case 'trailer_build':
      return `trailer_build(${constraint.buildBars}, ${constraint.hitCount}, ${constraint.percussionDensity})`;
    case 'leitmotif':
      return constraint.transformOp
        ? `leitmotif(${constraint.motifId}, ${constraint.transformOp})`
        : `leitmotif(${constraint.motifId})`;
    case 'drone': {
      const tonesList = (constraint.droneTones as readonly string[]).join(', ');
      return `drone([${tonesList}], ${constraint.droneStyle})`;
    }
    case 'pattern_role':
      return `pattern_role(${constraint.role})`;
    case 'swing':
      return `swing(${constraint.amount})`;
    case 'heterophony':
      return `heterophony(${constraint.voiceCount}, ${constraint.variationDepth}, ${constraint.timingSpread})`;
    case 'max_interval':
      return `max_interval(${constraint.semitones})`;
    case 'arranger_style':
      return `arranger_style(${constraint.style})`;
    case 'scene_arc':
      return `scene_arc(${constraint.arcType})`;
    default:
      // Should never reach here - all built-in types handled above, custom types handled before switch
      console.warn(`Unhandled constraint type in term conversion: ${(constraint as any).type}`);
      return '';
  }
}

// ============================================================================
// PROLOG BINDINGS DECODING (C054)
// ============================================================================

/**
 * Type for Prolog query result bindings.
 */
export interface PrologBindings {
  [key: string]: string | number | PrologBindings | Array<string | number | PrologBindings>;
}

/**
 * C054: Decode Prolog bindings back to a MusicSpec.
 * 
 * Used when Prolog inference produces a modified or recommended spec.
 * Handles partial bindings gracefully, using defaults for missing values.
 */
export function factsToSpec(bindings: PrologBindings): MusicSpec {
  const spec = createMusicSpec();
  
  // Parse key
  const keyRoot = parseRoot(bindings['KeyRoot'] || bindings['keyRoot']);
  const mode = parseMode(bindings['Mode'] || bindings['mode']);
  
  // Parse meter
  const meterNum = parseNumber(bindings['MeterNum'] || bindings['meterNum']);
  const meterDen = parseNumber(bindings['MeterDen'] || bindings['meterDen']);
  
  // Parse tempo
  const tempo = parseNumber(bindings['Tempo'] || bindings['tempo']);
  
  // Parse tonality model
  const tonalityModel = parseTonalityModel(bindings['TonalityModel'] || bindings['tonalityModel']);
  
  // Parse style
  const style = parseStyle(bindings['Style'] || bindings['style']);
  
  // Parse culture
  const culture = parseCulture(bindings['Culture'] || bindings['culture']);
  
  // Parse constraints if present
  const constraints = parseConstraints(bindings['Constraints'] || bindings['constraints']);
  
  return {
    keyRoot: keyRoot || spec.keyRoot,
    mode: mode || spec.mode,
    meterNumerator: meterNum || spec.meterNumerator,
    meterDenominator: meterDen || spec.meterDenominator,
    tempo: tempo || spec.tempo,
    tonalityModel: tonalityModel || spec.tonalityModel,
    style: style || spec.style,
    culture: culture || spec.culture,
    constraints: constraints || spec.constraints,
  };
}

// ============================================================================
// PARSING HELPERS
// ============================================================================

const VALID_ROOTS: readonly RootName[] = [
  'c', 'csharp', 'd', 'dsharp', 'e', 'f', 'fsharp', 'g', 'gsharp', 'a', 'asharp', 'b',
  'dflat', 'eflat', 'gflat', 'aflat', 'bflat'
];

const VALID_MODES: readonly ModeName[] = [
  'major', 'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian',
  'natural_minor', 'harmonic_minor', 'melodic_minor',
  'pentatonic_major', 'pentatonic_minor', 'blues',
  'whole_tone', 'chromatic', 'octatonic'
];

const VALID_TONALITY_MODELS: readonly TonalityModel[] = ['ks_profile', 'dft_phase', 'spiral_array'];

const VALID_STYLES: readonly StyleTag[] = [
  'galant', 'baroque', 'classical', 'romantic',
  'cinematic', 'trailer', 'underscore',
  'edm', 'pop', 'jazz', 'lofi', 'custom'
];

const VALID_CULTURES: readonly CultureTag[] = ['western', 'carnatic', 'celtic', 'chinese', 'hybrid'];

function parseRoot(value: unknown): RootName | undefined {
  if (typeof value === 'string' && VALID_ROOTS.includes(value as RootName)) {
    return value as RootName;
  }
  return undefined;
}

function parseMode(value: unknown): ModeName | undefined {
  if (typeof value === 'string' && VALID_MODES.includes(value as ModeName)) {
    return value as ModeName;
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
  }
  return undefined;
}

function parseTonalityModel(value: unknown): TonalityModel | undefined {
  if (typeof value === 'string' && VALID_TONALITY_MODELS.includes(value as TonalityModel)) {
    return value as TonalityModel;
  }
  return undefined;
}

function parseStyle(value: unknown): StyleTag | undefined {
  if (typeof value === 'string' && VALID_STYLES.includes(value as StyleTag)) {
    return value as StyleTag;
  }
  return undefined;
}

function parseCulture(value: unknown): CultureTag | undefined {
  if (typeof value === 'string' && VALID_CULTURES.includes(value as CultureTag)) {
    return value as CultureTag;
  }
  return undefined;
}

function parseConstraints(_value: unknown): readonly MusicConstraint[] | undefined {
  // TODO: Implement full constraint parsing from Prolog list format
  // For now, return undefined to use defaults
  return undefined;
}

// ============================================================================
// CONTEXT SLICE (C055)
// ============================================================================

/**
 * C055: Board context information to add to Prolog session.
 */
export interface BoardContext {
  readonly boardId: string;
  readonly boardType: 'arranger' | 'tracker' | 'notation' | 'phrase';
  readonly selectedDeckId?: string;
  readonly selectedCardId?: string;
}

/**
 * Generate Prolog facts for board context.
 */
export function boardContextToPrologFacts(context: BoardContext): string[] {
  const facts: string[] = [];
  
  facts.push(`board_context(${context.boardId}, ${context.boardType}).`);
  
  if (context.selectedDeckId) {
    facts.push(`selected_deck(${context.boardId}, '${context.selectedDeckId}').`);
  }
  
  if (context.selectedCardId) {
    facts.push(`selected_card(${context.boardId}, '${context.selectedCardId}').`);
  }
  
  return facts;
}

/**
 * Generate a Prolog query goal for the current spec.
 */
export function currentSpecGoal(): string {
  return 'current_spec(Spec)';
}

/**
 * Generate Prolog fact to set current spec.
 */
export function setCurrentSpecFact(spec: MusicSpec): string {
  return `current_spec(${specToPrologTerm(spec)}).`;
}

// ============================================================================
// CUSTOM CONSTRAINT PROLOG INTEGRATION
// ============================================================================

/**
 * Generate complete Prolog loader including custom constraints.
 * This should be loaded after the base KB modules.
 */
export function generateCompleteSpecProlog(spec: MusicSpec): string {
  const lines: string[] = [];
  
  // Add custom constraint predicates
  lines.push(generateCustomPrologLoader());
  
  // Add current spec facts
  lines.push('%% Current spec facts');
  for (const fact of specToPrologFacts(spec)) {
    lines.push(fact);
  }
  
  return lines.join('\n');
}

/**
 * Re-export for convenience.
 */
export { constraintRegistry, generateCustomPrologLoader } from './custom-constraints';
