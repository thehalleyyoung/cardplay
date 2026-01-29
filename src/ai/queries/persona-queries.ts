/**
 * @fileoverview Persona-Specific Query Functions
 *
 * TypeScript wrappers around Prolog queries for persona-specific knowledge:
 *   - Notation composer: score layout, engraving, orchestration, counterpoint
 *   - Tracker user: pattern suggestions, effects, groove, routing
 *   - Sound designer: synthesis, modulation, layering, macros, presets
 *   - Producer: arrangement, mixing, mastering, track organisation
 *   - Cross-persona: transitions, workflow bridges, learning paths
 *
 * @module @cardplay/ai/queries/persona-queries
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import {
  loadPersonaKB,
  loadPersonaTransitionsKB,
  type PersonaId,
} from '../knowledge/persona-loader';
import { loadAdaptationKB } from '../knowledge/adaptation-loader';

// =============================================================================
// Shared Types
// =============================================================================

/** Priority / importance level used by multiple personas. */
export type Importance = 'required' | 'recommended' | 'optional';

/** A deck entry with role and size. */
export interface DeckEntry {
  readonly deckType: string;
  readonly importance: Importance;
  readonly sizePercent?: number | undefined;
}

/** A board preset. */
export interface BoardPreset {
  readonly id: string;
  readonly name: string;
  readonly decks: string[];
}

// =============================================================================
// Notation Composer Types (M011–M057)
// =============================================================================

/** Engraving quality issue. */
export interface EngravingIssue {
  readonly ruleId: string;
  readonly description: string;
}

/** Orchestration guideline for an instrument. */
export interface OrchestrationGuideline {
  readonly instrument: string;
  readonly rangeLow: number;
  readonly rangeHigh: number;
  readonly difficulty: string;
}

/** Counterpoint voice-independence issue. */
export interface CounterpointIssue {
  readonly ruleId: string;
  readonly description: string;
}

/** Cadence suggestion. */
export interface CadenceSuggestion {
  readonly type: string;
  readonly description: string;
}

/** Modulation path step. */
export interface ModulationStep {
  readonly type: string;
  readonly rarity: string;
}

/** Classical form section. */
export interface FormSection {
  readonly formType: string;
  readonly sections: string[];
}

/** A form template entry. */
export interface FormTemplate {
  readonly formType: string;
  readonly sections: string[];
  readonly description: string;
}

/** A form deviation detected during analysis. */
export interface FormDeviation {
  readonly expected: string;
  readonly actual: string;
  readonly position: number;
  readonly severity: 'info' | 'warning';
}

/** Development technique for sonata form. */
export interface DevelopmentTechnique {
  readonly id: string;
  readonly description: string;
}

/** Fugue writing rule. */
export interface FugueRule {
  readonly id: string;
  readonly description: string;
}

/** An instrument part extracted from a score. */
export interface ExtractedPart {
  readonly instrument: string;
  readonly partName: string;
  readonly transposition: number; // semitones (0 = concert pitch)
  readonly clef: string;
  readonly includesPageBreaks: boolean;
}

/** Export parts workflow plan. */
export interface ExportPartsWorkflow {
  readonly instruments: string[];
  readonly parts: ExtractedPart[];
  readonly steps: string[];
  readonly totalPages: number;
}

// =============================================================================
// Tracker User Types (M093–M148)
// =============================================================================

/** Suggested pattern length. */
export interface PatternLengthSuggestion {
  readonly genre: string;
  readonly lengths: number[];
}

/** Effect chain preset. */
export interface EffectChainPreset {
  readonly trackType: string;
  readonly style: string;
  readonly effects: string[];
}

/** Groove template. */
export interface GrooveTemplate {
  readonly id: string;
  readonly offsets: number[];
}

/** Pattern variation technique (tracker-specific). */
export interface TrackerVariationTechnique {
  readonly id: string;
  readonly description: string;
}

/** A pattern note for variation/groove operations. */
export interface PatternNote {
  readonly tick: number;
  readonly note: number;
  readonly velocity: number;
  readonly duration: number;
}

/** Result of a pattern operation. */
export interface PatternOperationResult {
  readonly notes: PatternNote[];
  readonly technique: string;
  readonly description: string;
}

/** M138: Tracker macro assignment for a track type. */
export interface TrackerMacroAssignment {
  readonly macroIndex: number;
  readonly name: string;
  readonly targets: string[];
}

/** M138: Macro layout for a tracker track type. */
export interface TrackerMacroLayout {
  readonly trackType: string;
  readonly macros: TrackerMacroAssignment[];
}

/** M139: Automation recording mode. */
export interface AutomationRecordingMode {
  readonly id: string;
  readonly description: string;
}

/** M139: Automation recording event (from macro tweak). */
export interface AutomationEvent {
  readonly tick: number;
  readonly paramName: string;
  readonly value: number;
}

/** M139: Recorded automation lane from a macro tweak session. */
export interface AutomationLane {
  readonly trackType: string;
  readonly macroName: string;
  readonly paramName: string;
  readonly events: AutomationEvent[];
  readonly recordingMode: string;
}

/** M148: Scene launch control action. */
export interface SceneLaunchControl {
  readonly action: string;
  readonly description: string;
  readonly quantizationDefault: string;
}

/** M148: Scene transition rule. */
export interface SceneTransitionRule {
  readonly id: string;
  readonly description: string;
  readonly bars: number;
}

// =============================================================================
// Sound Designer Types (M170–M227)
// =============================================================================

/** Synthesis recommendation. */
export interface SynthesisRecommendation {
  readonly soundType: string;
  readonly techniques: string[];
}

/** Modulation routing suggestion. */
export interface ModulationRouting {
  readonly name: string;
  readonly source: string;
  readonly targets: string[];
}

/** Effect chain for a sound type + style. */
export interface SoundEffectChain {
  readonly soundType: string;
  readonly style: string;
  readonly effects: string[];
}

/** Layering suggestion. */
export interface LayeringSuggestion {
  readonly targetCharacter: string;
  readonly roles: string[];
  readonly notes: string;
}

/** Macro assignment. */
export interface MacroAssignment {
  readonly macroIndex: number;
  readonly name: string;
  readonly targets: string[];
}

/** Macro layout for a sound type. */
export interface MacroLayout {
  readonly soundType: string;
  readonly macros: MacroAssignment[];
}

/** Randomization constraint. */
export interface RandomizationConstraint {
  readonly paramGroup: string;
  readonly minFraction: number;
  readonly maxFraction: number;
}

/** A frequency balance issue. */
export interface FrequencyBalanceIssue {
  readonly range: string;
  readonly description: string;
  readonly severity: 'info' | 'warning';
}

/** Stereo placement suggestion. */
export interface StereoPlacement {
  readonly trackName: string;
  readonly pan: number;        // -1.0 (left) to 1.0 (right)
  readonly width: number;      // 0.0 (mono) to 1.0 (full stereo)
  readonly technique: string;
}

/** M210: MIDI controller mapping. */
export interface MIDIControllerMapping {
  readonly controller: string;
  readonly soundType: string;
  readonly targets: string[];
}

/** M212: MIDI learn state transition. */
export interface MIDILearnTransition {
  readonly fromState: string;
  readonly event: string;
  readonly toState: string;
}

/** M212: MIDI CC type mapping. */
export interface MIDICCType {
  readonly ccNumber: number;
  readonly typicalUse: string;
}

// =============================================================================
// Sample Organization & Preset Types (M100, M215–M219)
// =============================================================================

/** Sample organization scheme. */
export interface SampleOrganizationScheme {
  readonly scheme: string;
  readonly categories: string[];
}

/** Sample category entry. */
export interface SampleCategory {
  readonly category: string;
  readonly subcategories: string[];
}

/** Preset metadata field definition. */
export interface PresetMetadataField {
  readonly field: string;
  readonly importance: Importance;
}

/** Preset tag entry. */
export interface PresetTag {
  readonly id: string;
  readonly name: string;
  readonly category: string;
}

/** Preset with tags and metadata. */
export interface TaggedPreset {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly author: string;
  readonly genre?: string;
  readonly mood?: string;
  readonly character?: string;
  readonly favorite: boolean;
  readonly rating: number;
}

/** Preset search criteria. */
export interface PresetSearchCriteria {
  readonly query?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly genre?: string;
  readonly mood?: string;
  readonly character?: string;
  readonly favoritesOnly?: boolean;
  readonly minRating?: number;
}

// =============================================================================
// Producer Types (M250–M292)
// =============================================================================

/** Genre production template. */
export interface GenreTemplate {
  readonly genre: string;
  readonly bpmMin: number;
  readonly bpmMax: number;
  readonly instruments: string[];
}

/** Arrangement structure. */
export interface ArrangementStructure {
  readonly genre: string;
  readonly sections: string[];
}

/** Mixing checklist. */
export interface MixChecklist {
  readonly genre: string;
  readonly steps: string[];
}

/** Mastering target. */
export interface MasteringTarget {
  readonly genre: string;
  readonly targetLUFS: number;
  readonly dynamicRangeDB: number;
}

/** Track color assignment. */
export interface TrackColorAssignment {
  readonly groupType: string;
  readonly color: string;
}

/** Performance mode deck entry. */
export interface PerformanceModeDeck {
  readonly deckType: string;
  readonly sizePercent: number;
}

/** Performance mode deck property. */
export interface PerformanceModeDeckProperty {
  readonly deckType: string;
  readonly property: string;
  readonly value: string;
}

/** Pattern launch quantization mode. */
export interface LaunchQuantizationMode {
  readonly mode: string;
  readonly description: string;
}

/** M102: Pattern resize rule (double/halve). */
export interface PatternResizeRule {
  readonly operation: string;
  readonly description: string;
  readonly noteAdjustment: string;
}

/** M102: Note adjustment strategy when resizing a pattern. */
export interface ResizeNoteAdjustment {
  readonly strategy: string;
  readonly description: string;
}

/** M103: Quantization preset (grid division). */
export interface QuantizationPreset {
  readonly id: string;
  readonly stepDivision: number;
  readonly description: string;
}

/** M103: Swing preset. */
export interface SwingPreset {
  readonly id: string;
  readonly swingPercent: number;
  readonly description: string;
}

/** M103: Combined quantization + swing suggestion. */
export interface QuantizationSuggestion {
  readonly grid: string;
  readonly swing: string;
}

/** Bus configuration for a track setup. */
export interface BusConfig {
  readonly setupType: string;
  readonly buses: BusEntry[];
}

/** A single bus entry in a routing config. */
export interface BusEntry {
  readonly name: string;
  readonly effects: string[];
  readonly busType: string;
}

/** Automation lane suggestion for a track type. */
export interface AutomationLaneSuggestion {
  readonly trackType: string;
  readonly parameter: string;
  readonly priority: number;
}

/** Collaboration workflow. */
export interface CollaborationWorkflow {
  readonly id: string;
  readonly description: string;
}

/** Collaboration role definition. */
export interface CollaborationRole {
  readonly role: string;
  readonly responsibilities: string[];
}

/** Collaboration handoff recommendation. */
export interface CollaborationHandoff {
  readonly fromRole: string;
  readonly toRole: string;
  readonly method: string;
}

/** M287: Reference matching technique. */
export interface ReferenceMatchingTechnique {
  readonly technique: string;
  readonly description: string;
}

/** M288: Platform loudness target. */
export interface LoudnessTarget {
  readonly platform: string;
  readonly targetLUFS: number;
  readonly description: string;
}

/** M289: Dynamic range target per genre. */
export interface DynamicRangeTarget {
  readonly genre: string;
  readonly targetDR: number;
  readonly description: string;
}

/** M290: Loudness diagnosis result. */
export interface LoudnessDiagnosis {
  readonly platform: string;
  readonly measuredLUFS: number;
  readonly status: 'too_loud' | 'too_quiet' | 'on_target';
  readonly targetLUFS: number;
  readonly description: string;
}

/** M292: Dynamics processing suggestion. */
export interface DynamicsSuggestion {
  readonly genre: string;
  readonly currentDR: number;
  readonly action: string;
  readonly targetDR: number;
  readonly description: string;
}

// =============================================================================
// Cross-Persona Types (M321–M358)
// =============================================================================

/** Transition path between personas. */
export interface PersonaTransition {
  readonly from: string;
  readonly to: string;
  readonly sharedNeeds: string[];
}

/** Workflow bridge action. */
export interface WorkflowBridge {
  readonly fromWorkflow: string;
  readonly toWorkflow: string;
  readonly bridgeAction: string;
}

/** Learning path for a persona at a skill level. */
export interface LearningPath {
  readonly persona: string;
  readonly skillLevel: string;
  readonly steps: string[];
}

// =============================================================================
// Helper: ensure persona KB loaded
// =============================================================================

async function ensurePersona(
  personaId: PersonaId,
  adapter: PrologAdapter
): Promise<void> {
  await loadPersonaKB(personaId, adapter);
}

async function ensureTransitions(adapter: PrologAdapter): Promise<void> {
  await loadPersonaTransitionsKB(adapter);
}

// =============================================================================
// Notation Composer Queries (M011–M057)
// =============================================================================

/**
 * Get engraving rules from the notation-composer KB.
 * M014: checkEngravingQuality proxy.
 */
export async function getEngravingRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<EngravingIssue[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll('engraving_rule(Id, Description)');
  return results.map((r) => ({
    ruleId: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * Get orchestration guidelines for all instruments.
 * M028–M030.
 */
export async function getOrchestrationGuidelines(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<OrchestrationGuideline[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'orchestration_guideline(Instrument, Low, High, Difficulty)'
  );
  return results.map((r) => ({
    instrument: String(r.Instrument),
    rangeLow: Number(r.Low),
    rangeHigh: Number(r.High),
    difficulty: String(r.Difficulty),
  }));
}

/**
 * M012: Suggest score layout based on instrumentation.
 */
export async function suggestScoreLayout(
  instruments: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<OrchestrationGuideline[]> {
  await ensurePersona('notation-composer', adapter);
  // Query guidelines for each requested instrument
  const guidelines: OrchestrationGuideline[] = [];
  for (const inst of instruments) {
    const results = await adapter.queryAll(
      `orchestration_guideline(${inst}, Low, High, Difficulty)`
    );
    for (const r of results) {
      guidelines.push({
        instrument: inst,
        rangeLow: Number(r.Low),
        rangeHigh: Number(r.High),
        difficulty: String(r.Difficulty),
      });
    }
  }
  return guidelines;
}

/**
 * M033: Check if notes are within instrument range.
 */
export async function checkInstrumentRange(
  instrument: string,
  midiNotes: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ note: number; inRange: boolean }[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    `orchestration_guideline(${instrument}, Low, High, _)`
  );
  if (results.length === 0) {
    return midiNotes.map((n) => ({ note: n, inRange: true })); // unknown instrument = allow all
  }
  const low = Number(results[0]?.Low ?? 0);
  const high = Number(results[0]?.High ?? 127);
  return midiNotes.map((n) => ({ note: n, inRange: n >= low && n <= high }));
}

/**
 * M051–M054: Get counterpoint / voice-independence rules.
 */
export async function getVoiceIndependenceRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CounterpointIssue[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'voice_independence_rule(Id, Description)'
  );
  return results.map((r) => ({
    ruleId: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * M053: Get cadence placement rules.
 */
export async function getCadencePlacementRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CadenceSuggestion[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'cadence_placement_rule(Type, Description)'
  );
  return results.map((r) => ({
    type: String(r.Type),
    description: String(r.Description),
  }));
}

/**
 * M054: Get modulation appropriateness rules.
 */
export async function getModulationRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ModulationStep[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'modulation_appropriateness(Type, _, Rarity)'
  );
  return results.map((r) => ({
    type: String(r.Type),
    rarity: String(r.Rarity),
  }));
}

/**
 * M069–M071: Get classical form sections.
 */
export async function getFormSections(
  formType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    `form_section_rule(${formType}, Sections, _)`
  );
  if (results.length === 0) return [];
  const raw = results[0]?.Sections;
  if (Array.isArray(raw)) return raw.map(String);
  return raw != null ? [String(raw)] : [];
}

/**
 * M065: Get all form templates from the notation-composer KB.
 * Queries form_section_rule(FormType, Sections, Description) for every form type.
 */
export async function getFormTemplates(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<FormTemplate[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'form_section_rule(FormType, Sections, Description)'
  );
  return results.map((r) => ({
    formType: String(r.FormType),
    sections: Array.isArray(r.Sections) ? r.Sections.map(String) : [String(r.Sections)],
    description: String(r.Description),
  }));
}

/**
 * M066: Get all orchestration guidelines grouped by instrument.
 * Queries orchestration_guideline/4 facts from the notation-composer KB.
 */
export async function getOrchestrationGuides(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<OrchestrationGuideline[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'orchestration_guideline(Instrument, range(Low, High), Difficulty)'
  );
  return results.map((r) => ({
    instrument: String(r.Instrument),
    rangeLow: Number(r.Low),
    rangeHigh: Number(r.High),
    difficulty: String(r.Difficulty),
  }));
}

/**
 * M067: Apply a form template to a given number of measures.
 * Retrieves the form template sections for the given form type, then
 * distributes measures evenly across sections.
 */
export async function applyFormTemplate(
  formType: string,
  totalMeasures: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Array<{ section: string; startMeasure: number; endMeasure: number }>> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    `form_section_rule(${formType}, Sections, _)`
  );
  if (results.length === 0) return [];

  // Collect all sections across all matching rules into a flat list
  const allSections: string[] = [];
  for (const r of results) {
    const secs = Array.isArray(r.Sections) ? r.Sections.map(String) : [String(r.Sections)];
    allSections.push(...secs);
  }

  if (allSections.length === 0) return [];

  const measuresPerSection = Math.floor(totalMeasures / allSections.length);
  const remainder = totalMeasures % allSections.length;
  let currentMeasure = 1;

  return allSections.map((section, i) => {
    const extra = i < remainder ? 1 : 0;
    const sectionLength = measuresPerSection + extra;
    const start = currentMeasure;
    const end = currentMeasure + sectionLength - 1;
    currentMeasure = end + 1;
    return { section, startMeasure: start, endMeasure: end };
  });
}

/**
 * M068: Check actual sections against a form template and report deviations.
 * Compares each position in actualSections against the template sections.
 */
export async function checkAgainstForm(
  formType: string,
  actualSections: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<FormDeviation[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    `form_section_rule(${formType}, Sections, _)`
  );
  if (results.length === 0) return [];

  // Build expected section list from all matching rules
  const expectedSections: string[] = [];
  for (const r of results) {
    const secs = Array.isArray(r.Sections) ? r.Sections.map(String) : [String(r.Sections)];
    expectedSections.push(...secs);
  }

  const deviations: FormDeviation[] = [];
  const maxLen = Math.max(expectedSections.length, actualSections.length);

  for (let i = 0; i < maxLen; i++) {
    const expected = expectedSections[i];
    const actual = actualSections[i];

    if (expected == null && actual != null) {
      deviations.push({
        expected: '(none)',
        actual,
        position: i,
        severity: 'info',
      });
    } else if (expected != null && actual == null) {
      deviations.push({
        expected,
        actual: '(missing)',
        position: i,
        severity: 'warning',
      });
    } else if (expected != null && actual != null && expected !== actual) {
      deviations.push({
        expected,
        actual,
        position: i,
        severity: 'warning',
      });
    }
  }

  return deviations;
}

/**
 * M072: Suggest form-aware composition guidance.
 * Finds the next section after currentSection in the form template, and
 * queries development_technique/2 if the current section is a development section.
 */
export async function suggestFormAwareComposition(
  formType: string,
  currentSection: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ nextSection: string; techniques: DevelopmentTechnique[] }> {
  await ensurePersona('notation-composer', adapter);

  // Gather all sections for this form type in order
  const results = await adapter.queryAll(
    `form_section_rule(${formType}, Sections, _)`
  );
  const allSections: string[] = [];
  for (const r of results) {
    const secs = Array.isArray(r.Sections) ? r.Sections.map(String) : [String(r.Sections)];
    allSections.push(...secs);
  }

  // Find the current section and determine the next one
  const idx = allSections.indexOf(currentSection);
  const nextSection = idx >= 0 && idx < allSections.length - 1
    ? allSections[idx + 1]!
    : '(end)';

  // If currently in a development-related section, fetch development techniques
  let techniques: DevelopmentTechnique[] = [];
  const isDevelopment = currentSection === 'development'
    || currentSection === 'fragmentation'
    || currentSection === 'sequence'
    || currentSection === 'modulation'
    || currentSection === 'retransition';

  if (isDevelopment) {
    const techResults = await adapter.queryAll(
      'development_technique(Id, Description)'
    );
    techniques = techResults.map((r) => ({
      id: String(r.Id),
      description: String(r.Description),
    }));
  }

  return { nextSection, techniques };
}

/**
 * M073: Get all development techniques from the notation-composer KB.
 * Queries development_technique(Id, Description).
 */
export async function getDevelopmentTechniques(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DevelopmentTechnique[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'development_technique(Id, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * M074: Get all fugue subject rules from the notation-composer KB.
 * Queries fugue_subject_rule(Id, Description).
 */
export async function getFugueRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<FugueRule[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'fugue_subject_rule(Id, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * M009: Get notation board deck configuration.
 */
export async function getNotationBoardDecks(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckEntry[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'notation_board_deck(Deck, Importance, Size)'
  );
  return results.map((r) => ({
    deckType: String(r.Deck),
    importance: String(r.Importance) as Importance,
    ...(r.Size != null && { sizePercent: Number(r.Size) }),
  }));
}

/**
 * M023: Plan "Export parts" workflow extracting individual instrument parts.
 * Uses orchestration guidelines from KB to determine transposition and clef.
 */
export async function planExportParts(
  instruments: string[],
  totalMeasures: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ExportPartsWorkflow> {
  await ensurePersona('notation-composer', adapter);

  // Standard transpositions in semitones (concert pitch offset)
  const transpositionMap: Record<string, number> = {
    clarinet: -2,
    trumpet: -2,
    french_horn: -7,
    english_horn: -7,
  };

  const parts: ExtractedPart[] = [];
  for (const inst of instruments) {
    // Query orchestration guideline for range info
    const results = await adapter.queryAll(
      `orchestration_guideline(${inst}, range(Low, High), Difficulty)`
    );

    const rangeLow = results.length > 0 ? Number(results[0]?.Low ?? 60) : 60;

    // Determine transposition from standard map
    const transposition = transpositionMap[inst] ?? 0;

    // Determine clef based on range
    let clef: string;
    if (rangeLow < 48) {
      clef = 'bass';
    } else if (rangeLow < 60) {
      clef = 'tenor';
    } else {
      clef = 'treble';
    }

    // Capitalize instrument name for part header
    const partName = inst.charAt(0).toUpperCase() + inst.slice(1).replace(/_/g, ' ');

    parts.push({
      instrument: inst,
      partName,
      transposition,
      clef,
      includesPageBreaks: true,
    });
  }

  const steps: string[] = [
    'Extract individual parts',
    'Apply transpositions',
    'Set clefs',
    'Add page breaks',
    'Generate part headers',
    'Export to PDF',
  ];

  const totalPages = instruments.length * Math.ceil(totalMeasures / 32);

  return {
    instruments,
    parts,
    steps,
    totalPages,
  };
}

// =============================================================================
// Tracker User Queries (M093–M136)
// =============================================================================

/**
 * M090: Suggest pattern lengths for a genre.
 */
export async function suggestPatternLengths(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    `pattern_length_convention(${genre}, Length)`
  );
  return results.map((r) => Number(r.Length));
}

/**
 * M092: Suggest effect chain for track type.
 */
export async function suggestTrackerEffectChain(
  trackType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<EffectChainPreset[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    `effect_chain_preset(${trackType}, Style, Effects)`
  );
  return results.map((r) => ({
    trackType,
    style: String(r.Style),
    effects: Array.isArray(r.Effects) ? r.Effects.map(String) : [String(r.Effects)],
  }));
}

/**
 * M126: Get all groove templates.
 */
export async function getGrooveTemplates(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<GrooveTemplate[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll('groove_template(Id, Offsets)');
  return results.map((r) => ({
    id: String(r.Id),
    offsets: Array.isArray(r.Offsets) ? r.Offsets.map(Number) : [],
  }));
}

/**
 * M125: Get all pattern variation techniques.
 */
export async function getTrackerVariationTechniques(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TrackerVariationTechnique[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'pattern_variation_technique(Id, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * M127: Get humanization amount for a genre.
 */
export async function getHumanizationAmount(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `humanization_amount(${genre}, Amount)`
  );
  return result ? Number(result.Amount) : 0;
}

/**
 * M107–M109: Get tracker board presets.
 */
export async function getTrackerBoardPresets(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<BoardPreset[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'tracker_board_preset(Id, Name, Decks)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    name: String(r.Name),
    decks: Array.isArray(r.Decks) ? r.Decks.map(String) : [String(r.Decks)],
  }));
}

/**
 * M087: Get tracker board deck configuration.
 */
export async function getTrackerBoardDecks(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckEntry[]> {
  await ensurePersona('tracker-user', adapter);
  const deckResults = await adapter.queryAll(
    'tracker_board_deck(Deck, Importance)'
  );
  const sizeResults = await adapter.queryAll(
    'tracker_board_deck_size(Deck, Size)'
  );
  const sizeMap = new Map(sizeResults.map((r) => [String(r.Deck), Number(r.Size)]));
  return deckResults.map((r) => {
    const size = sizeMap.get(String(r.Deck));
    return {
      deckType: String(r.Deck),
      importance: String(r.Importance) as Importance,
      ...(size != null && { sizePercent: size }),
    };
  });
}

// =============================================================================
// Tracker Routing Types & Queries (M118–M124)
// =============================================================================

/** Routing suggestion for a track type. */
export interface TrackerRoutingSuggestion {
  readonly trackType: string;
  readonly route: string[];
}

/** Feedback loop detection result. */
export interface FeedbackLoopResult {
  readonly hasFeedback: boolean;
  readonly loop?: string[];
}

/** Optimized routing edge. */
export interface OptimizedRoute {
  readonly from: string;
  readonly to: string;
  readonly purpose: string;
}

/**
 * M118: Suggest tracker routing for a set of track types.
 * Queries tracker_effect_routing/2 from the tracker-user KB.
 */
export async function suggestTrackerRouting(
  trackSetup: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TrackerRoutingSuggestion[]> {
  await ensurePersona('tracker-user', adapter);
  const suggestions: TrackerRoutingSuggestion[] = [];
  for (const trackType of trackSetup) {
    const results = await adapter.queryAll(
      `tracker_effect_routing(${trackType}, Routes)`
    );
    for (const r of results) {
      const rawRoutes = r.Routes;
      const route: string[] = Array.isArray(rawRoutes)
        ? rawRoutes.map(String)
        : rawRoutes != null
          ? [String(rawRoutes)]
          : [];
      suggestions.push({ trackType, route });
    }
  }
  // If no track-specific routing found, fall back to standard routing
  if (suggestions.length === 0) {
    const fallback = await adapter.queryAll(
      'tracker_effect_routing(standard, Routes)'
    );
    for (const trackType of trackSetup) {
      for (const r of fallback) {
        const rawRoutes = r.Routes;
        const route: string[] = Array.isArray(rawRoutes)
          ? rawRoutes.map(String)
          : rawRoutes != null
            ? [String(rawRoutes)]
            : [];
        suggestions.push({ trackType, route });
      }
    }
  }
  return suggestions;
}

/**
 * M119: Detect feedback loops in a directed routing graph.
 * Pure TypeScript cycle detection (DFS-based).
 */
export function detectFeedbackLoop(
  routingPairs: Array<{ from: string; to: string }>
): FeedbackLoopResult {
  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const { from, to } of routingPairs) {
    const existing = adj.get(from);
    if (existing) {
      existing.push(to);
    } else {
      adj.set(from, [to]);
    }
  }

  const allNodes = new Set<string>();
  for (const { from, to } of routingPairs) {
    allNodes.add(from);
    allNodes.add(to);
  }

  // DFS cycle detection with path tracking
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const parent = new Map<string, string>();

  function dfs(node: string): string[] | null {
    visited.add(node);
    inStack.add(node);

    const neighbors = adj.get(node) ?? [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        parent.set(next, node);
        const cycle = dfs(next);
        if (cycle) return cycle;
      } else if (inStack.has(next)) {
        // Found cycle – reconstruct path
        const loop: string[] = [next];
        let cur = node;
        while (cur !== next) {
          loop.push(cur);
          cur = parent.get(cur) ?? next;
        }
        loop.push(next);
        loop.reverse();
        return loop;
      }
    }

    inStack.delete(node);
    return null;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      const loop = dfs(node);
      if (loop) {
        return { hasFeedback: true, loop };
      }
    }
  }

  return { hasFeedback: false };
}

/**
 * M120: Optimize tracker routing by querying routing rules and deduplicating
 * redundant sends into a simplified routing graph.
 */
export async function optimizeTrackerRouting(
  trackSetup: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<OptimizedRoute[]> {
  await ensurePersona('tracker-user', adapter);

  // Gather all routing rules
  const routingResults = await adapter.queryAll(
    'tracker_effect_routing(standard, Routes)'
  );
  const sendResults = await adapter.queryAll(
    'send_return_configuration(Effect, _Config)'
  );
  const sidechainResults = await adapter.queryAll(
    'sidechain_routing(Name, Config)'
  );

  const routes: OptimizedRoute[] = [];
  const seen = new Set<string>();

  // Extract standard routing edges
  for (const r of routingResults) {
    const rawRoutes = Array.isArray(r.Routes) ? r.Routes : [];
    for (const entry of rawRoutes) {
      if (typeof entry === 'object' && entry !== null && 'args' in entry) {
        const args = (entry as { args: unknown[] }).args;
        const from = String(args[0]);
        const to = String(args[1]);
        const key = `${from}->${to}`;
        if (!seen.has(key)) {
          seen.add(key);
          routes.push({ from, to, purpose: 'signal_flow' });
        }
      }
    }
  }

  // Add send/return routes for tracks that benefit from them
  for (const sr of sendResults) {
    const effect = String(sr.Effect);
    for (const trackType of trackSetup) {
      const key = `${trackType}->${effect}_bus`;
      if (!seen.has(key)) {
        seen.add(key);
        routes.push({ from: trackType, to: `${effect}_bus`, purpose: `send_${effect}` });
      }
    }
  }

  // Add sidechain routes
  for (const sc of sidechainResults) {
    const config = Array.isArray(sc.Config) ? sc.Config : [];
    let source: string | undefined;
    let target: string | undefined;
    for (const item of config) {
      if (typeof item === 'object' && item !== null && 'args' in item) {
        const compound = item as { functor?: string; args: unknown[] };
        const functor = compound.functor ?? String(compound.args[0] ?? '');
        if (functor === 'source' || String(item).includes('source')) {
          source = String(compound.args[0]);
        }
        if (functor === 'target' || String(item).includes('target')) {
          target = String(compound.args[0]);
        }
      }
    }
    if (source && target) {
      const key = `${source}->${target}`;
      if (!seen.has(key)) {
        seen.add(key);
        routes.push({ from: source, to: target, purpose: `sidechain_${String(sc.Name)}` });
      }
    }
  }

  return routes;
}

/**
 * M128: Generate a variation of a pattern using the specified technique.
 * Techniques are validated against the KB's pattern_variation_technique/2.
 * Core transformations are implemented in TypeScript.
 */
export async function generateVariation(
  pattern: PatternNote[],
  technique: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PatternOperationResult> {
  await ensurePersona('tracker-user', adapter);

  // Verify technique exists in KB (informational; we proceed regardless)
  const knownTechniques = await adapter.queryAll(
    'pattern_variation_technique(Id, _)'
  );
  const techniqueIds = knownTechniques.map((r) => String(r.Id));
  const isKnown = techniqueIds.some((id) => id === technique);

  let notes: PatternNote[];
  let description: string;

  switch (technique) {
    case 'reverse': {
      // Reverse note order while keeping ticks relative
      notes = pattern
        .slice()
        .reverse()
        .map((n, i) => ({
          ...n,
          tick: i === 0 ? 0 : pattern[pattern.length - 1 - i]!.tick,
        }));
      // Reassign ticks based on reversed ordering with original spacing
      const originalTicks = pattern.map((n) => n.tick);
      notes = pattern
        .slice()
        .reverse()
        .map((n, i) => ({
          ...n,
          tick: originalTicks[i]!,
        }));
      description = 'Reversed note order while preserving timing grid';
      break;
    }
    case 'invert': {
      // Invert intervals around the first note
      if (pattern.length === 0) {
        notes = [];
        description = 'Inversion of empty pattern';
        break;
      }
      const axis = pattern[0]!.note;
      notes = pattern.map((n) => ({
        ...n,
        note: axis - (n.note - axis),
      }));
      description = `Inverted intervals around MIDI note ${axis}`;
      break;
    }
    case 'retrograde': {
      // Reverse and invert combined
      if (pattern.length === 0) {
        notes = [];
        description = 'Retrograde inversion of empty pattern';
        break;
      }
      const axisNote = pattern[0]!.note;
      const originalTicks = pattern.map((n) => n.tick);
      notes = pattern
        .slice()
        .reverse()
        .map((n, i) => ({
          ...n,
          tick: originalTicks[i]!,
          note: axisNote - (n.note - axisNote),
        }));
      description = `Retrograde inversion around MIDI note ${axisNote}`;
      break;
    }
    case 'shift': {
      // Shift all notes up by 2 semitones
      notes = pattern.map((n) => ({
        ...n,
        note: n.note + 2,
      }));
      description = 'Shifted all notes up by 2 semitones';
      break;
    }
    case 'rotate': {
      // Rotate note array by 1 position
      if (pattern.length <= 1) {
        notes = [...pattern];
        description = 'Rotation (no change for single/empty pattern)';
        break;
      }
      const originalTicks = pattern.map((n) => n.tick);
      const rotated = [...pattern.slice(1), pattern[0]!];
      notes = rotated.map((n, i) => ({
        ...n,
        tick: originalTicks[i]!,
      }));
      description = 'Rotated note sequence by 1 position';
      break;
    }
    case 'octave_shift': {
      // Shift all notes up by 12 semitones (1 octave)
      notes = pattern.map((n) => ({
        ...n,
        note: n.note + 12,
      }));
      description = 'Shifted all notes up by 1 octave (12 semitones)';
      break;
    }
    case 'double': {
      // Double all durations
      notes = pattern.map((n) => ({
        ...n,
        duration: n.duration * 2,
      }));
      description = 'Doubled all note durations';
      break;
    }
    case 'halve': {
      // Halve all durations
      notes = pattern.map((n) => ({
        ...n,
        duration: Math.max(1, Math.floor(n.duration / 2)),
      }));
      description = 'Halved all note durations';
      break;
    }
    case 'random_swap': {
      // Deterministic swap of first two notes
      if (pattern.length < 2) {
        notes = [...pattern];
        description = 'Random swap (no change for single/empty pattern)';
        break;
      }
      const originalTicks = pattern.map((n) => n.tick);
      notes = [...pattern];
      const swapped0 = { ...notes[1]!, tick: originalTicks[0]! };
      const swapped1 = { ...notes[0]!, tick: originalTicks[1]! };
      notes[0] = swapped0;
      notes[1] = swapped1;
      description = 'Swapped first two notes (deterministic pseudo-random)';
      break;
    }
    default: {
      notes = [...pattern];
      description = isKnown
        ? `Technique '${technique}' recognized but not yet implemented`
        : `Unknown technique '${technique}'; returning original pattern`;
      break;
    }
  }

  return { notes, technique, description };
}

/**
 * M129: Apply a groove template to a pattern.
 * Queries groove_template/2 for the template's timing offsets, then applies
 * them cyclically to pattern note ticks.
 */
export async function applyGroove(
  pattern: PatternNote[],
  templateId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PatternOperationResult> {
  await ensurePersona('tracker-user', adapter);

  const result = await adapter.querySingle(
    `groove_template(${templateId}, Offsets)`
  );

  if (!result) {
    return {
      notes: [...pattern],
      technique: templateId,
      description: `Groove template '${templateId}' not found; returning original pattern`,
    };
  }

  const offsets: number[] = Array.isArray(result.Offsets)
    ? result.Offsets.map(Number)
    : [];

  if (offsets.length === 0) {
    return {
      notes: [...pattern],
      technique: templateId,
      description: `Groove template '${templateId}' has no offsets; returning original pattern`,
    };
  }

  const notes = pattern.map((n, i) => ({
    ...n,
    tick: n.tick + offsets[i % offsets.length]!,
  }));

  return {
    notes,
    technique: templateId,
    description: `Applied groove template '${templateId}' with ${offsets.length}-step offset cycle`,
  };
}

/**
 * M130: Humanize a pattern by adding deterministic pseudo-random timing
 * and velocity offsets based on the genre's humanization amount.
 * Uses humanization_amount/2 from the KB.
 */
export async function humanize(
  pattern: PatternNote[],
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PatternOperationResult> {
  await ensurePersona('tracker-user', adapter);

  const result = await adapter.querySingle(
    `humanization_amount(${genre}, Amount)`
  );
  const amount = result ? Number(result.Amount) : 0;

  if (amount === 0) {
    return {
      notes: [...pattern],
      technique: 'humanize',
      description: `No humanization for genre '${genre}' (amount=0)`,
    };
  }

  const notes = pattern.map((n) => {
    const timingOffset = (n.tick * 7 + n.note * 13) % amount;
    const velocityOffset = (n.tick * 11 + n.note * 3) % amount;
    return {
      ...n,
      tick: n.tick + timingOffset,
      velocity: Math.min(127, Math.max(0, n.velocity + velocityOffset)),
    };
  });

  return {
    notes,
    technique: 'humanize',
    description: `Humanized with amount=${amount} for genre '${genre}'`,
  };
}

// =============================================================================
// Sound Designer Queries (M170–M227)
// =============================================================================

/**
 * M170: Suggest synthesis technique for a sound type.
 */
export async function suggestSynthesis(
  soundType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    `synthesis_for_sound_type(${soundType}, Technique)`
  );
  return results.map((r) => String(r.Technique));
}

/**
 * M171: Suggest effect chain for a sound type + style.
 */
export async function suggestSoundEffectChain(
  soundType: string,
  style?: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SoundEffectChain[]> {
  await ensurePersona('sound-designer', adapter);
  const query = style
    ? `effect_chain_for_sound_type(${soundType}, ${style}, Effects)`
    : `effect_chain_for_sound_type(${soundType}, Style, Effects)`;
  const results = await adapter.queryAll(query);
  return results.map((r) => ({
    soundType,
    style: style ?? String(r.Style),
    effects: Array.isArray(r.Effects) ? r.Effects.map(String) : [String(r.Effects)],
  }));
}

/**
 * M164: Suggest modulation routing for a character/effect.
 */
export async function suggestModulationRouting(
  character?: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ModulationRouting[]> {
  await ensurePersona('sound-designer', adapter);
  const query = character
    ? `modulation_routing_pattern(${character}, Source, Targets)`
    : 'modulation_routing_pattern(Name, Source, Targets)';
  const results = await adapter.queryAll(query);
  return results.map((r) => ({
    name: character ?? String(r.Name),
    source: String(r.Source),
    targets: Array.isArray(r.Targets) ? r.Targets.map(String) : [String(r.Targets)],
  }));
}

/**
 * M195: Suggest layering structure for a target character.
 */
export async function suggestLayering(
  targetCharacter: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LayeringSuggestion | null> {
  await ensurePersona('sound-designer', adapter);
  const result = await adapter.querySingle(
    `layering_rule(${targetCharacter}, Roles, Notes)`
  );
  if (!result) return null;
  return {
    targetCharacter,
    roles: Array.isArray(result.Roles) ? result.Roles.map(String) : [String(result.Roles)],
    notes: String(result.Notes),
  };
}

/**
 * M207: Get macro assignment layout for a sound type.
 */
export async function suggestMacroLayout(
  soundType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MacroLayout | null> {
  await ensurePersona('sound-designer', adapter);
  const result = await adapter.querySingle(
    `macro_assignment_pattern(${soundType}, Macros)`
  );
  if (!result) return null;
  const rawMacros = Array.isArray(result.Macros) ? result.Macros : [];
  // Parse macro(Index, Name, Targets) compound terms
  const macros: MacroAssignment[] = rawMacros.map((m: unknown) => {
    if (typeof m === 'object' && m !== null && 'args' in m) {
      const args = (m as { args: unknown[] }).args;
      return {
        macroIndex: Number(args[0]),
        name: String(args[1]),
        targets: Array.isArray(args[2]) ? args[2].map(String) : [String(args[2])],
      };
    }
    return { macroIndex: 0, name: String(m), targets: [] };
  });
  return { soundType, macros };
}

/**
 * M226: Get randomization constraints.
 */
export async function getRandomizationConstraints(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<RandomizationConstraint[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    'randomization_constraint(ParamGroup, MinFrac, MaxFrac)'
  );
  return results.map((r) => ({
    paramGroup: String(r.ParamGroup),
    minFraction: Number(r.MinFrac),
    maxFraction: Number(r.MaxFrac),
  }));
}

/**
 * M210: Map a MIDI controller to parameters for a given sound type.
 *
 * Queries performance_control_mapping/3 and returns the parameter
 * targets assigned to the given controller for the given sound type.
 */
export async function mapMIDIController(
  controller: string,
  soundType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MIDIControllerMapping | null> {
  await ensurePersona('sound-designer', adapter);
  const result = await adapter.querySingle(
    `performance_control_mapping(${controller}, ${soundType}, Targets)`
  );
  if (!result) return null;
  return {
    controller,
    soundType,
    targets: Array.isArray(result.Targets)
      ? result.Targets.map(String)
      : [String(result.Targets)],
  };
}

/**
 * M210: Get all MIDI controller mappings for a sound type.
 */
export async function getAllMIDIControllerMappings(
  soundType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MIDIControllerMapping[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    `performance_control_mapping(Controller, ${soundType}, Targets)`
  );
  return results.map((r) => ({
    controller: String(r.Controller),
    soundType,
    targets: Array.isArray(r.Targets)
      ? r.Targets.map(String)
      : [String(r.Targets)],
  }));
}

/**
 * M212: Get all MIDI learn state transitions.
 *
 * Returns the state machine for MIDI learn mode (idle → awaiting_controller
 * → awaiting_parameter → mapping_confirmed → idle).
 */
export async function getMIDILearnTransitions(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MIDILearnTransition[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    'midi_learn_mode(FromState, Event, ToState)'
  );
  return results.map((r) => ({
    fromState: String(r.FromState),
    event: String(r.Event),
    toState: String(r.ToState),
  }));
}

/**
 * M212: Get the next state in MIDI learn mode given current state and event.
 */
export async function getMIDILearnNextState(
  currentState: string,
  event: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string | null> {
  await ensurePersona('sound-designer', adapter);
  const result = await adapter.querySingle(
    `midi_learn_mode(${currentState}, ${event}, NextState)`
  );
  return result ? String(result.NextState) : null;
}

/**
 * M212: Get all known MIDI CC types.
 */
export async function getMIDICCTypes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MIDICCType[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    'midi_learn_cc_type(CCNum, TypicalUse)'
  );
  return results.map((r) => ({
    ccNumber: Number(r.CCNum),
    typicalUse: String(r.TypicalUse),
  }));
}

/**
 * M186–M188: Get sound designer board presets.
 */
export async function getSoundDesignerBoardPresets(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<BoardPreset[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    'sound_designer_board_preset(Id, Name, Decks)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    name: String(r.Name),
    decks: Array.isArray(r.Decks) ? r.Decks.map(String) : [String(r.Decks)],
  }));
}

/**
 * M167: Get sound designer board deck configuration.
 */
export async function getSoundDesignerBoardDecks(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckEntry[]> {
  await ensurePersona('sound-designer', adapter);
  const deckResults = await adapter.queryAll(
    'sound_designer_board_deck(Deck, Importance)'
  );
  const sizeResults = await adapter.queryAll(
    'sound_designer_board_deck_size(Deck, Size)'
  );
  const sizeMap = new Map(sizeResults.map((r) => [String(r.Deck), Number(r.Size)]));
  return deckResults.map((r) => {
    const size = sizeMap.get(String(r.Deck));
    return {
      deckType: String(r.Deck),
      importance: String(r.Importance) as Importance,
      ...(size != null && { sizePercent: size }),
    };
  });
}

/**
 * M100: Get sample organization schemes from the sound-designer KB.
 * Returns available schemes (by_category, by_mood, by_genre, by_character).
 */
export async function getSampleOrganizationSchemes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SampleOrganizationScheme[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    'preset_organization_scheme(Scheme, Categories)'
  );
  return results.map((r) => ({
    scheme: String(r.Scheme),
    categories: Array.isArray(r.Categories) ? r.Categories.map(String) : [String(r.Categories)],
  }));
}

/**
 * M100: Get sample categories for a given organization scheme.
 */
export async function getSampleCategories(
  scheme: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensurePersona('sound-designer', adapter);
  const result = await adapter.querySingle(
    `preset_organization_scheme(${scheme}, Categories)`
  );
  if (!result) return [];
  return Array.isArray(result.Categories) ? result.Categories.map(String) : [String(result.Categories)];
}

/**
 * M215: Get preset metadata standard (required/recommended/optional fields).
 */
export async function getPresetMetadataStandard(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PresetMetadataField[]> {
  await ensurePersona('sound-designer', adapter);
  const results = await adapter.queryAll(
    'preset_metadata_standard(Field, Importance)'
  );
  return results.map((r) => ({
    field: String(r.Field),
    importance: String(r.Importance) as Importance,
  }));
}

/**
 * M199: Analyze frequency balance for a set of track types.
 * Queries frequency_balance_rule/2 from the sound-designer KB and returns
 * applicable rules as issues.  For each track type the function maps to
 * relevant frequency-range concerns:
 *   - 'bass'       → sub_bass, bass_clarity
 *   - 'lead'       → presence, harshness
 *   - 'pad'        → mid_scoop
 *   - 'vocal'      → presence, harshness
 *   - 'keys'       → mid_scoop, presence
 *   - 'drum'/'kick'→ sub_bass, bass_clarity
 *   - (any)        → masking, air
 */
export async function analyzeFrequencyBalance(
  trackTypes: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<FrequencyBalanceIssue[]> {
  await ensurePersona('sound-designer', adapter);

  // Fetch all frequency balance rules from the KB
  const allRules = await adapter.queryAll(
    'frequency_balance_rule(Range, Description)'
  );
  const ruleMap = new Map<string, string>(
    allRules.map((r) => [String(r.Range), String(r.Description)])
  );

  // Define which rules apply to which track types
  const trackToRanges: Record<string, string[]> = {
    bass:       ['sub_bass', 'bass_clarity'],
    kick:       ['sub_bass', 'bass_clarity'],
    drum:       ['sub_bass', 'bass_clarity'],
    lead:       ['presence', 'harshness'],
    vocal:      ['presence', 'harshness'],
    pad:        ['mid_scoop'],
    keys:       ['mid_scoop', 'presence'],
    strings:    ['mid_scoop', 'presence'],
    guitar:     ['mid_scoop', 'presence'],
  };

  // Rules that apply universally when multiple track types are present
  const universalRanges = ['masking', 'air'];

  const seenRanges = new Set<string>();
  const issues: FrequencyBalanceIssue[] = [];

  for (const trackType of trackTypes) {
    const ranges = trackToRanges[trackType] ?? [];
    for (const range of ranges) {
      if (!seenRanges.has(range)) {
        seenRanges.add(range);
        const desc = ruleMap.get(range);
        if (desc != null) {
          const severity: 'info' | 'warning' =
            range === 'harshness' || range === 'masking' ? 'warning' : 'info';
          issues.push({ range, description: desc, severity });
        }
      }
    }
  }

  // Add universal rules when there are multiple tracks
  if (trackTypes.length > 1) {
    for (const range of universalRanges) {
      if (!seenRanges.has(range)) {
        seenRanges.add(range);
        const desc = ruleMap.get(range);
        if (desc != null) {
          issues.push({ range, description: desc, severity: range === 'masking' ? 'warning' : 'info' });
        }
      }
    }
  }

  return issues;
}

/**
 * M200: Suggest stereo placement for a list of named tracks.
 * Assigns stereo positions based on standard mixing conventions and
 * queries stereo_imaging_technique/2 from the sound-designer KB for
 * the technique name associated with each placement strategy.
 */
export async function suggestStereoPlacement(
  tracks: Array<{ name: string; type: string }>,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<StereoPlacement[]> {
  await ensurePersona('sound-designer', adapter);

  // Fetch stereo imaging techniques from the KB for technique labels
  const techniqueResults = await adapter.queryAll(
    'stereo_imaging_technique(Id, Description)'
  );
  const techniqueMap = new Map<string, string>(
    techniqueResults.map((r) => [String(r.Id), String(r.Description)])
  );

  // Standard mixing placement conventions
  const placements: StereoPlacement[] = [];
  let guitarSide = 1;   // alternate L/R for guitars
  let keysSide = -1;    // alternate opposite for keys

  for (const track of tracks) {
    let pan: number;
    let width: number;
    let technique: string;

    switch (track.type) {
      case 'kick':
      case 'bass':
        pan = 0;
        width = 0.0;
        technique = techniqueMap.get('mono_below_200') ?? 'mono_below_200';
        break;

      case 'vocal':
        pan = 0;
        width = 0.2;
        technique = techniqueMap.get('mid_side_eq') ?? 'mid_side_eq';
        break;

      case 'snare':
        pan = -0.1;
        width = 0.2;
        technique = techniqueMap.get('mid_side_eq') ?? 'mid_side_eq';
        break;

      case 'hat':
      case 'percussion':
        pan = 0.4;
        width = 0.3;
        technique = techniqueMap.get('pan_automation') ?? 'pan_automation';
        break;

      case 'guitar': {
        pan = 0.55 * guitarSide;
        width = 0.5;
        technique = techniqueMap.get('haas_effect') ?? 'haas_effect';
        guitarSide *= -1;
        break;
      }

      case 'keys': {
        pan = 0.5 * keysSide;
        width = 0.5;
        technique = techniqueMap.get('stereo_chorus') ?? 'stereo_chorus';
        keysSide *= -1;
        break;
      }

      case 'pad':
      case 'strings':
        pan = 0;
        width = 0.9;
        technique = techniqueMap.get('stereo_chorus') ?? 'stereo_chorus';
        break;

      case 'fx':
        pan = 0.6;
        width = 0.7;
        technique = techniqueMap.get('pan_automation') ?? 'pan_automation';
        break;

      default:
        pan = 0;
        width = 0.3;
        technique = techniqueMap.get('mid_side_eq') ?? 'mid_side_eq';
        break;
    }

    placements.push({
      trackName: track.name,
      pan: Math.round(pan * 100) / 100,
      width: Math.round(width * 100) / 100,
      technique,
    });
  }

  return placements;
}

// =============================================================================
// Sound Designer Sample Analysis Types (M172–M175)
// =============================================================================

/** Characteristics of an audio sample. */
export interface SampleCharacteristics {
  readonly estimatedKey: string | null;
  readonly estimatedTempo: number | null;
  readonly type: 'one-shot' | 'loop' | 'pad' | 'unknown';
  readonly suggestedUse: string[];
  readonly transientDensity: 'sparse' | 'medium' | 'dense';
}

/** Sample analysis input metadata. */
export interface SampleMetadata {
  readonly name: string;
  readonly durationMs: number;
  readonly sampleRate: number;
  readonly channels: 1 | 2;
  readonly peakAmplitude: number; // 0.0 - 1.0
  readonly rmsAmplitude: number;  // 0.0 - 1.0
  readonly zeroCrossingRate: number; // crossings per second
}

// =============================================================================
// Sound Designer Sample Analysis Queries (M172–M175)
// =============================================================================

/**
 * M172: Analyze a sample based on metadata heuristics.
 *
 * Since we operate in a Prolog/TypeScript context without Web Audio, actual
 * audio processing is not available. Instead this function infers sample
 * characteristics from file metadata and naming conventions:
 *   - Type detection based on duration thresholds.
 *   - Transient density estimated from zero-crossing rate.
 *   - Suggested use derived from name keywords.
 *   - estimatedKey/Tempo are null (would require spectral analysis).
 */
export async function analyzeSample(
  meta: SampleMetadata,
  _adapter: PrologAdapter = getPrologAdapter()
): Promise<SampleCharacteristics> {
  // --- Type detection from duration ---
  let type: SampleCharacteristics['type'];
  if (meta.durationMs < 500) {
    type = 'one-shot';
  } else if (meta.durationMs < 2000) {
    type = 'loop';
  } else if (meta.durationMs < 10000) {
    type = 'pad';
  } else {
    type = 'unknown';
  }

  // --- Transient density from zero-crossing rate ---
  let transientDensity: SampleCharacteristics['transientDensity'];
  if (meta.zeroCrossingRate < 1000) {
    transientDensity = 'sparse';
  } else if (meta.zeroCrossingRate < 5000) {
    transientDensity = 'medium';
  } else {
    transientDensity = 'dense';
  }

  // --- Suggested use from name keywords ---
  const nameLower = meta.name.toLowerCase();
  const suggestedUse: string[] = [];

  if (/kick|snare|hat|clap/.test(nameLower)) {
    suggestedUse.push('percussion');
  }
  if (/bass/.test(nameLower)) {
    suggestedUse.push('bass');
  }
  if (/pad|ambient/.test(nameLower)) {
    suggestedUse.push('atmosphere');
  }
  if (/vocal|voice/.test(nameLower)) {
    suggestedUse.push('vocals');
  }
  if (suggestedUse.length === 0) {
    suggestedUse.push('general');
  }

  return {
    estimatedKey: null,
    estimatedTempo: null,
    type,
    suggestedUse,
    transientDensity,
  };
}

/**
 * M173: Suggest sample manipulation techniques based on sample characteristics.
 *
 * Queries the sound designer KB predicate `sample_manipulation_technique/2`
 * and filters results to techniques appropriate for the given sample type.
 * Falls back to a built-in technique table when the KB does not contain
 * the predicate (graceful degradation).
 */
export async function suggestSampleManipulations(
  characteristics: SampleCharacteristics,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Array<{ technique: string; description: string }>> {
  await ensurePersona('sound-designer', adapter);

  // Attempt KB query first
  const results = await adapter.queryAll(
    'sample_manipulation_technique(Technique, Description)'
  );

  if (results.length > 0) {
    // Filter techniques based on sample type suitability
    return results
      .map((r) => ({
        technique: String(r.Technique),
        description: String(r.Description),
      }))
      .filter(({ technique }) => isTechniqueSuitableForType(technique, characteristics.type));
  }

  // Fallback: built-in technique recommendations per sample type
  return getBuiltinManipulations(characteristics.type);
}

/**
 * Check whether a manipulation technique name is suitable for a sample type.
 * Uses keyword heuristics on the technique name.
 */
function isTechniqueSuitableForType(
  technique: string,
  sampleType: SampleCharacteristics['type']
): boolean {
  const t = technique.toLowerCase();

  switch (sampleType) {
    case 'one-shot':
      // One-shots benefit from envelope shaping, layering, transient design
      return !/loop|sustain|evolving/.test(t);
    case 'loop':
      // Loops benefit from slicing, time-stretching, beat manipulation
      return !/one_shot|transient_only/.test(t);
    case 'pad':
      // Pads benefit from granular, spectral, modulation-based processing
      return !/transient|slice|chop/.test(t);
    default:
      // Unknown type: allow all techniques
      return true;
  }
}

/**
 * Built-in fallback manipulation techniques keyed by sample type.
 */
function getBuiltinManipulations(
  sampleType: SampleCharacteristics['type']
): Array<{ technique: string; description: string }> {
  const common: Array<{ technique: string; description: string }> = [
    { technique: 'pitch_shift', description: 'Shift pitch without changing duration' },
    { technique: 'reverse', description: 'Reverse the sample playback' },
    { technique: 'filter_sweep', description: 'Apply a resonant filter sweep' },
  ];

  switch (sampleType) {
    case 'one-shot':
      return [
        ...common,
        { technique: 'envelope_shape', description: 'Reshape amplitude envelope for punchier or softer attack' },
        { technique: 'layer', description: 'Layer with complementary one-shots for thicker sound' },
        { technique: 'transient_design', description: 'Enhance or soften the transient' },
      ];
    case 'loop':
      return [
        ...common,
        { technique: 'time_stretch', description: 'Time-stretch to match project tempo' },
        { technique: 'slice', description: 'Slice into individual hits for rearrangement' },
        { technique: 'stutter', description: 'Create rhythmic stutter/glitch effects' },
      ];
    case 'pad':
      return [
        ...common,
        { technique: 'granular', description: 'Granular synthesis for evolving textures' },
        { technique: 'spectral_freeze', description: 'Freeze spectral content for sustained drones' },
        { technique: 'modulated_delay', description: 'Apply modulated delay for movement' },
      ];
    default:
      return common;
  }
}

/**
 * M175: Classify a sample into a category using name patterns and audio
 * characteristics.
 *
 * Categories: 'drum', 'bass', 'lead', 'pad', 'fx', 'vocal', 'texture'.
 * Confidence is a heuristic score from 0.0 to 1.0 reflecting how many
 * signals agree on the classification.
 */
export async function classifySample(
  meta: SampleMetadata,
  _adapter: PrologAdapter = getPrologAdapter()
): Promise<{ category: string; confidence: number }> {
  const nameLower = meta.name.toLowerCase();

  // Weighted votes: name patterns carry most weight, audio characteristics add confidence
  const votes = new Map<string, number>([
    ['drum', 0], ['bass', 0], ['lead', 0], ['pad', 0],
    ['fx', 0], ['vocal', 0], ['texture', 0],
  ]);

  const addVote = (cat: string, weight: number): void => {
    votes.set(cat, (votes.get(cat) ?? 0) + weight);
  };

  // --- Name-based classification (strong signal, +3) ---
  if (/kick|snare|hi[\s_-]?hat|clap|tom|cymbal|perc|rim|shaker/.test(nameLower)) addVote('drum', 3);
  if (/bass|sub|808/.test(nameLower)) addVote('bass', 3);
  if (/lead|pluck|arp|stab/.test(nameLower)) addVote('lead', 3);
  if (/pad|ambient|drone|atmos/.test(nameLower)) addVote('pad', 3);
  if (/fx|riser|sweep|impact|down[\s_-]?lifter|noise/.test(nameLower)) addVote('fx', 3);
  if (/vocal|voice|vox|choir|sing/.test(nameLower)) addVote('vocal', 3);
  if (/texture|grain|foley|field/.test(nameLower)) addVote('texture', 3);

  // --- Duration-based hints (+1) ---
  if (meta.durationMs < 300) addVote('drum', 1);
  else if (meta.durationMs < 1000) addVote('lead', 1);
  else if (meta.durationMs >= 2000 && meta.durationMs < 10000) addVote('pad', 1);
  else if (meta.durationMs >= 10000) addVote('texture', 1);

  // --- Transient characteristics (+1) ---
  if (meta.zeroCrossingRate >= 5000) {
    addVote('drum', 1);
    addVote('fx', 1);
  } else if (meta.zeroCrossingRate < 500) {
    addVote('bass', 1);
    addVote('pad', 1);
  }

  // --- Amplitude characteristics (+1) ---
  if (meta.peakAmplitude > 0.9 && meta.rmsAmplitude > 0.3) addVote('drum', 1);
  if (meta.peakAmplitude < 0.5 && meta.rmsAmplitude < 0.15) addVote('texture', 1);

  // --- Find the category with the highest vote ---
  let bestCategory = 'texture';
  let bestScore = 0;
  let totalVotes = 0;

  for (const [category, score] of votes.entries()) {
    totalVotes += score;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Confidence: proportion of votes for the winning category relative to
  // the maximum achievable score (name match + all heuristics = ~5).
  // Clamped to [0.0, 1.0].
  const maxPossible = 5;
  const confidence = Math.min(1.0, totalVotes > 0 ? bestScore / maxPossible : 0);

  return { category: bestCategory, confidence: Math.round(confidence * 100) / 100 };
}

// =============================================================================
// Producer Queries (M250–M292)
// =============================================================================

/**
 * M250: Suggest arrangement structure for a genre.
 */
export async function suggestArrangementStructure(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `arrangement_structure(${genre}, Sections)`
  );
  if (!result) return [];
  return Array.isArray(result.Sections)
    ? result.Sections.map(String)
    : [String(result.Sections)];
}

/**
 * M243: Get genre production template.
 */
export async function getGenreTemplate(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<GenreTemplate | null> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `genre_production_template(${genre}, bpm(Min, Max), Instruments)`
  );
  if (!result) return null;
  return {
    genre,
    bpmMin: Number(result.Min),
    bpmMax: Number(result.Max),
    instruments: Array.isArray(result.Instruments)
      ? result.Instruments.map(String)
      : [String(result.Instruments)],
  };
}

/**
 * M251: Suggest mixing checklist for a genre category.
 */
export async function suggestMixChecklist(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `suggest_mix_checklist(${genre}, Checklist)`
  );
  if (!result) return [];
  return Array.isArray(result.Checklist)
    ? result.Checklist.map(String)
    : [String(result.Checklist)];
}

/**
 * M252: Check mastering readiness by getting target values.
 */
export async function getMasteringTarget(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MasteringTarget | null> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `mastering_target(${genre}, LUFS, DR)`
  );
  if (!result) return null;
  return {
    genre,
    targetLUFS: Number(result.LUFS),
    dynamicRangeDB: Number(result.DR),
  };
}

/**
 * M278: Suggest track colors for all group types.
 */
export async function suggestTrackColors(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TrackColorAssignment[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll('track_color_scheme(GroupType, Color)');
  return results.map((r) => ({
    groupType: String(r.GroupType),
    color: String(r.Color),
  }));
}

/**
 * M249: Get track organization for a genre.
 */
export async function getTrackOrganization(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ groupName: string; tracks: string[] }[]> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `track_organization(${genre}, Groups)`
  );
  if (!result) return [];
  const rawGroups = Array.isArray(result.Groups) ? result.Groups : [];
  return rawGroups.map((g: unknown) => {
    if (typeof g === 'object' && g !== null && 'args' in g) {
      const args = (g as { args: unknown[] }).args;
      return {
        groupName: String(args[0]),
        tracks: Array.isArray(args[1]) ? args[1].map(String) : [String(args[1])],
      };
    }
    return { groupName: String(g), tracks: [] };
  });
}

/**
 * M266–M268: Get producer board presets.
 */
export async function getProducerBoardPresets(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<BoardPreset[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    'producer_board_preset(Id, Name, Decks)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    name: String(r.Name),
    decks: Array.isArray(r.Decks) ? r.Decks.map(String) : [String(r.Decks)],
  }));
}

/**
 * M247: Get producer board deck configuration.
 */
export async function getProducerBoardDecks(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckEntry[]> {
  await ensurePersona('producer', adapter);
  const deckResults = await adapter.queryAll(
    'producer_board_deck(Deck, Importance)'
  );
  const sizeResults = await adapter.queryAll(
    'producer_board_deck_size(Deck, Size)'
  );
  const sizeMap = new Map(sizeResults.map((r) => [String(r.Deck), Number(r.Size)]));
  return deckResults.map((r) => {
    const size = sizeMap.get(String(r.Deck));
    return {
      deckType: String(r.Deck),
      importance: String(r.Importance) as Importance,
      ...(size != null && { sizePercent: size }),
    };
  });
}

// =============================================================================
// Cross-Persona Queries (M321–M358)
// =============================================================================

/**
 * M322: Get transition path between two personas.
 */
export async function getPersonaTransition(
  from: string,
  to: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PersonaTransition | null> {
  await ensureTransitions(adapter);
  const result = await adapter.querySingle(
    `persona_transition_path(${from}, ${to}, SharedNeeds)`
  );
  if (!result) return null;
  return {
    from,
    to,
    sharedNeeds: Array.isArray(result.SharedNeeds)
      ? result.SharedNeeds.map(String)
      : [String(result.SharedNeeds)],
  };
}

/**
 * M323: Get boards compatible with multiple personas.
 */
export async function getBoardsForPersonas(
  personas: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureTransitions(adapter);
  const results = await adapter.queryAll(
    'board_compatibility(Board, Personas)'
  );
  return results
    .filter((r) => {
      const boardPersonas = Array.isArray(r.Personas)
        ? r.Personas.map(String)
        : [String(r.Personas)];
      return personas.every((p) => boardPersonas.includes(p));
    })
    .map((r) => String(r.Board));
}

/**
 * M324: Get workflow bridges between two workflow types.
 */
export async function getWorkflowBridges(
  fromWorkflow?: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<WorkflowBridge[]> {
  await ensureTransitions(adapter);
  const query = fromWorkflow
    ? `workflow_bridge(${fromWorkflow}, ToWorkflow, Action)`
    : 'workflow_bridge(FromWorkflow, ToWorkflow, Action)';
  const results = await adapter.queryAll(query);
  return results.map((r) => ({
    fromWorkflow: fromWorkflow ?? String(r.FromWorkflow),
    toWorkflow: String(r.ToWorkflow),
    bridgeAction: String(r.Action),
  }));
}

/**
 * M350: Get learning path for a persona at a given skill level.
 */
export async function getLearningPath(
  persona: string,
  skillLevel: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LearningPath | null> {
  await ensureTransitions(adapter);
  const result = await adapter.querySingle(
    `learning_path(${persona}, ${skillLevel}, Steps)`
  );
  if (!result) return null;
  return {
    persona,
    skillLevel,
    steps: Array.isArray(result.Steps) ? result.Steps.map(String) : [String(result.Steps)],
  };
}

/**
 * M358: Get quick-start flow for a persona.
 */
export async function getQuickStartFlow(
  persona: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureTransitions(adapter);
  const result = await adapter.querySingle(
    `quick_start_flow(${persona}, Steps)`
  );
  if (!result) return [];
  return Array.isArray(result.Steps) ? result.Steps.map(String) : [String(result.Steps)];
}

// =============================================================================
// Adaptive Tutorial Queries (L349)
// =============================================================================

/** Adaptive tutorial steps. */
export interface AdaptiveTutorial {
  readonly tutorialId: string;
  readonly skillLevel: string;
  readonly steps: string[];
}

/**
 * L349: Get adaptive tutorial sequence for a given topic and skill level.
 */
export async function getAdaptiveTutorial(
  tutorialId: string,
  skillLevel: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<AdaptiveTutorial | null> {
  await loadAdaptationKB(adapter);
  const result = await adapter.querySingle(
    `adaptive_tutorial_for_user(${tutorialId}, ${skillLevel}, Steps)`
  );
  if (!result) return null;
  return {
    tutorialId,
    skillLevel,
    steps: Array.isArray(result.Steps) ? result.Steps.map(String) : [String(result.Steps)],
  };
}

/**
 * Get all available adaptive tutorial IDs.
 */
export async function getAvailableTutorials(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await loadAdaptationKB(adapter);
  const results = await adapter.queryAll(
    'adaptive_tutorial(Id, _, _)'
  );
  const ids = results.map((r) => String(r.Id));
  return [...new Set(ids)];
}

// =============================================================================
// Notation Composer Implementations (M012–M015)
// =============================================================================

/** Score layout parameters based on instrumentation. */
export interface ScoreLayoutParams {
  readonly instruments: OrchestrationGuideline[];
  readonly staveOrder: string[];
  readonly totalStaves: number;
}

/**
 * M012: Suggest score layout based on instrumentation.
 * Queries orchestration guidelines and orders instruments by
 * standard orchestral score order (winds, brass, percussion, strings).
 */
export async function suggestScoreLayoutFull(
  instruments: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ScoreLayoutParams> {
  await ensurePersona('notation-composer', adapter);
  const guidelines: OrchestrationGuideline[] = [];
  for (const inst of instruments) {
    const results = await adapter.queryAll(
      `orchestration_guideline(${inst}, range(Low, High), Difficulty)`
    );
    for (const r of results) {
      guidelines.push({
        instrument: inst,
        rangeLow: Number(r.Low),
        rangeHigh: Number(r.High),
        difficulty: String(r.Difficulty),
      });
    }
  }

  // Standard orchestral score order (top to bottom)
  const scoreOrder = [
    'piccolo', 'flute', 'oboe', 'clarinet', 'bassoon',
    'french_horn', 'trumpet', 'trombone', 'tuba',
    'timpani', 'percussion',
    'harp', 'piano',
    'violin', 'viola', 'cello', 'double_bass',
  ];
  const staveOrder = instruments.slice().sort((a, b) => {
    const ai = scoreOrder.indexOf(a);
    const bi = scoreOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return {
    instruments: guidelines,
    staveOrder,
    totalStaves: instruments.length,
  };
}

/** Page break suggestion. */
export interface PageBreakSuggestion {
  readonly measureNumber: number;
  readonly reason: string;
}

/**
 * M013: Suggest page breaks based on system break rules from the KB.
 * Uses phrase boundary and rest rules to determine ideal break points.
 */
export async function suggestPageBreaks(
  totalMeasures: number,
  measuresPerSystem: number,
  phraseBoundaries: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PageBreakSuggestion[]> {
  await ensurePersona('notation-composer', adapter);
  // Load system break rules into engine (ensures KB is available for logic)
  void adapter.queryAll('system_break_rule(Id, Description)');
  void adapter.queryAll('page_turn_rule(Id, Description)');

  const systemsPerPage = 4; // standard
  const suggestions: PageBreakSuggestion[] = [];
  const systemBreakInterval = measuresPerSystem * systemsPerPage;

  for (let m = systemBreakInterval; m < totalMeasures; m += systemBreakInterval) {
    // Prefer a phrase boundary near the target
    const nearestBoundary = phraseBoundaries.reduce((best, b) => {
      return Math.abs(b - m) < Math.abs(best - m) ? b : best;
    }, m);

    const atBoundary = phraseBoundaries.includes(nearestBoundary) && Math.abs(nearestBoundary - m) <= measuresPerSystem;
    suggestions.push({
      measureNumber: atBoundary ? nearestBoundary : m,
      reason: atBoundary
        ? 'Phrase boundary (preferred per system_break_rule: phrase_boundary)'
        : 'Even distribution (per system_break_rule: even_distribution)',
    });
  }

  return suggestions;
}

/** Intelligent page layout result. */
export interface IntelligentPageLayout {
  readonly totalPages: number;
  readonly systemsPerPage: number[];
  readonly pageBreaks: number[];
  readonly systemBreaks: number[];
  readonly notes: string[];
}

/**
 * M039: Implement intelligent page layout using Prolog rules.
 * Combines system break rules, page turn rules, and phrase boundaries
 * to produce an optimal page layout.
 */
export async function planIntelligentPageLayout(
  totalMeasures: number,
  measuresPerSystem: number,
  phraseBoundaries: number[],
  instrumentCount: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<IntelligentPageLayout> {
  await ensurePersona('notation-composer', adapter);

  // Query system break and page turn rules from the KB
  const sysBreakResults = await adapter.queryAll(
    'system_break_rule(Id, Description)'
  );
  const pageTurnResults = await adapter.queryAll(
    'page_turn_rule(Id, Description)'
  );

  const kbNotes: string[] = [];
  for (const r of sysBreakResults) {
    kbNotes.push(`system_break_rule: ${String(r.Id)} – ${String(r.Description)}`);
  }
  for (const r of pageTurnResults) {
    kbNotes.push(`page_turn_rule: ${String(r.Id)} – ${String(r.Description)}`);
  }

  // Calculate total number of systems
  const totalSystems = Math.ceil(totalMeasures / measuresPerSystem);

  // Determine systems per page based on instrument count
  let baseSysPerPage: number;
  if (instrumentCount <= 2) {
    baseSysPerPage = 6;
  } else if (instrumentCount <= 5) {
    baseSysPerPage = 4;
  } else if (instrumentCount <= 10) {
    baseSysPerPage = 3;
  } else {
    baseSysPerPage = 2;
  }

  // Walk through systems and assign page breaks, preferring phrase boundaries
  const systemBreaks: number[] = [];
  for (let s = 1; s <= totalSystems; s++) {
    systemBreaks.push(s * measuresPerSystem);
  }

  const pageBreaks: number[] = [];
  const systemsPerPage: number[] = [];
  let systemsOnCurrentPage = 0;

  for (let s = 0; s < totalSystems; s++) {
    systemsOnCurrentPage++;
    const atPageCapacity = systemsOnCurrentPage >= baseSysPerPage;
    const isLastSystem = s === totalSystems - 1;

    if (atPageCapacity && !isLastSystem) {
      // Target measure for page break is end of this system
      const targetMeasure = (s + 1) * measuresPerSystem;

      // Snap to nearest phrase boundary within 2 measures if possible
      let bestBreak = targetMeasure;
      let bestDist = Infinity;
      for (const boundary of phraseBoundaries) {
        const dist = Math.abs(boundary - targetMeasure);
        if (dist <= 2 && dist < bestDist) {
          bestDist = dist;
          bestBreak = boundary;
        }
      }

      pageBreaks.push(bestBreak);
      systemsPerPage.push(systemsOnCurrentPage);
      systemsOnCurrentPage = 0;
    }
  }

  // Push the final page's system count
  if (systemsOnCurrentPage > 0) {
    systemsPerPage.push(systemsOnCurrentPage);
  }

  const totalPages = systemsPerPage.length;

  return {
    totalPages,
    systemsPerPage,
    pageBreaks,
    systemBreaks,
    notes: kbNotes,
  };
}

/** Engraving quality check result. */
export interface EngravingCheckResult {
  readonly ruleId: string;
  readonly description: string;
  readonly severity: 'info' | 'warning';
}

/**
 * M014: Check engraving quality by returning all applicable rules.
 */
export async function checkEngravingQuality(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<EngravingCheckResult[]> {
  await ensurePersona('notation-composer', adapter);
  const rules = await adapter.queryAll('engraving_rule(Id, Description)');
  return rules.map((r) => ({
    ruleId: String(r.Id),
    description: String(r.Description),
    severity: 'info' as const,
  }));
}

/** Articulation suggestion. */
export interface ArticulationSuggestion {
  readonly name: string;
  readonly notation: string;
}

/**
 * M015: Suggest articulations by querying articulation consistency rules.
 */
export async function suggestArticulations(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ArticulationSuggestion[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'articulation_consistency(Name, Description)'
  );
  return results.map((r) => ({
    name: String(r.Name),
    notation: String(r.Description),
  }));
}

// =============================================================================
// Orchestration Implementations (M032–M034)
// =============================================================================

/** Orchestration assignment. */
export interface OrchestrationAssignment {
  readonly instrument: string;
  readonly rangeLow: number;
  readonly rangeHigh: number;
  readonly difficulty: string;
  readonly suitable: boolean;
}

/**
 * M032: Suggest orchestration for a melody (MIDI notes) given available instruments.
 * Returns instruments sorted by suitability (range coverage).
 */
export async function suggestOrchestration(
  melodyMidiRange: { low: number; high: number },
  instruments: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<OrchestrationAssignment[]> {
  await ensurePersona('notation-composer', adapter);
  const assignments: OrchestrationAssignment[] = [];
  for (const inst of instruments) {
    const results = await adapter.queryAll(
      `orchestration_guideline(${inst}, range(Low, High), Difficulty)`
    );
    for (const r of results) {
      const low = Number(r.Low);
      const high = Number(r.High);
      const suitable = melodyMidiRange.low >= low && melodyMidiRange.high <= high;
      assignments.push({
        instrument: inst,
        rangeLow: low,
        rangeHigh: high,
        difficulty: String(r.Difficulty),
        suitable,
      });
    }
  }
  // Sort: suitable first, then by difficulty
  const diffOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  return assignments.sort((a, b) => {
    if (a.suitable !== b.suitable) return a.suitable ? -1 : 1;
    return (diffOrder[a.difficulty] ?? 2) - (diffOrder[b.difficulty] ?? 2);
  });
}

/** Range check result for a single note. */
export interface RangeCheckResult {
  readonly note: number;
  readonly inRange: boolean;
  readonly instrument: string;
}

/**
 * M033: Check instrument range for a set of MIDI notes.
 * Uses orchestration_guideline/3 with compound range term.
 */
export async function checkInstrumentRangeFull(
  instrument: string,
  midiNotes: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<RangeCheckResult[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    `orchestration_guideline(${instrument}, range(Low, High), _)`
  );
  if (results.length === 0) {
    return midiNotes.map((n) => ({ note: n, inRange: true, instrument }));
  }
  const low = Number(results[0]?.Low ?? 0);
  const high = Number(results[0]?.High ?? 127);
  return midiNotes.map((n) => ({
    note: n,
    inRange: n >= low && n <= high,
    instrument,
  }));
}

/** Dynamic balance suggestion. */
export interface DynamicBalanceSuggestion {
  readonly instrument: string;
  readonly role: 'melody' | 'harmony' | 'bass' | 'accompaniment';
  readonly suggestedDynamic: string;
}

/**
 * M034: Suggest dynamic balance for a set of instruments and their roles.
 * Based on standard orchestration practice.
 */
export async function suggestDynamicBalance(
  instrumentRoles: Array<{ instrument: string; role: 'melody' | 'harmony' | 'bass' | 'accompaniment' }>,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DynamicBalanceSuggestion[]> {
  await ensurePersona('notation-composer', adapter);
  // Standard dynamic balance: melody loudest, bass/harmony support, accompaniment softest
  const dynamicMap: Record<string, string> = {
    melody: 'mf-f (prominent)',
    harmony: 'mp-mf (supportive)',
    bass: 'mf (foundational)',
    accompaniment: 'p-mp (background)',
  };
  return instrumentRoles.map((ir) => ({
    instrument: ir.instrument,
    role: ir.role,
    suggestedDynamic: dynamicMap[ir.role] ?? 'mf',
  }));
}

// =============================================================================
// Counterpoint / Cadence / Modulation Implementations (M055–M057)
// =============================================================================

/** Counterpoint analysis result. */
export interface CounterpointAnalysis {
  readonly rules: CounterpointIssue[];
  readonly applicable: string[];
}

/**
 * M055: Analyze counterpoint by returning applicable voice independence rules.
 */
export async function analyzeCounterpoint(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CounterpointAnalysis> {
  await ensurePersona('notation-composer', adapter);
  const rules = await adapter.queryAll(
    'voice_independence_rule(Id, Description)'
  );
  const issues = rules.map((r) => ({
    ruleId: String(r.Id),
    description: String(r.Description),
  }));
  return {
    rules: issues,
    applicable: issues.map((i) => i.ruleId),
  };
}

/** Cadence position suggestion. */
export interface CadencePosition {
  readonly cadenceType: string;
  readonly description: string;
  readonly placement: string;
}

/**
 * M056: Suggest cadence types and their appropriate placement.
 */
export async function suggestCadences(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CadencePosition[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'cadence_placement_rule(Type, Description)'
  );
  return results.map((r) => ({
    cadenceType: String(r.Type),
    description: String(r.Description),
    placement: String(r.Description),
  }));
}

/** Modulation plan step. */
export interface ModulationPlan {
  readonly modulationType: string;
  readonly rarity: string;
  readonly description: string;
}

/**
 * M057: Plan modulation by querying modulation appropriateness rules.
 */
export async function planModulation(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ModulationPlan[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'modulation_appropriateness(Type, Rarity, Description)'
  );
  return results.map((r) => ({
    modulationType: String(r.Type),
    rarity: String(r.Rarity),
    description: String(r.Description),
  }));
}

// =============================================================================
// Notation Shortcut Queries (M011)
// =============================================================================

/** A keyboard shortcut entry. */
export interface NotationShortcut {
  readonly action: string;
  readonly description: string;
}

/**
 * M011: Get notation-specific keyboard shortcuts.
 */
export async function getNotationShortcuts(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<NotationShortcut[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'notation_shortcut(Action, Description)'
  );
  return results.map((r) => ({
    action: String(r.Action),
    description: String(r.Description),
  }));
}

// =============================================================================
// Notation Score Metadata & System Break Queries (M036-M038)
// =============================================================================

/** Score metadata field. */
export interface ScoreMetadataField {
  readonly field: string;
  readonly importance: string;
}

/**
 * M036: Get score metadata fields and their importance.
 */
export async function getScoreMetadataFields(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ScoreMetadataField[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'score_metadata_field(Field, Importance)'
  );
  return results.map((r) => ({
    field: String(r.Field),
    importance: String(r.Importance),
  }));
}

/** A typesetting rule. */
export interface TypesettingRule {
  readonly id: string;
  readonly description: string;
}

/**
 * M037: Get rehearsal letter placement rules.
 */
export async function getRehearsalLetterRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TypesettingRule[]> {
  await ensurePersona('notation-composer', adapter);
  const results = await adapter.queryAll(
    'rehearsal_letter_rule(Id, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * M038: Get system break and page turn rules.
 */
export async function getSystemBreakRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TypesettingRule[]> {
  await ensurePersona('notation-composer', adapter);
  const sysResults = await adapter.queryAll(
    'system_break_rule(Id, Description)'
  );
  const pageResults = await adapter.queryAll(
    'page_turn_rule(Id, Description)'
  );
  return [
    ...sysResults.map((r) => ({ id: String(r.Id), description: String(r.Description) })),
    ...pageResults.map((r) => ({ id: String(r.Id), description: String(r.Description) })),
  ];
}

// =============================================================================
// N126-N128: Skill Estimation, Adaptive Suggestions, Feature Visibility
// =============================================================================

/** Skill level type. */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** A skill profile across multiple areas. */
export interface SkillProfile {
  readonly overall: SkillLevel;
  readonly areas: ReadonlyMap<string, SkillLevel>;
}

/** An adapted suggestion. */
export interface AdaptedSuggestion {
  readonly type: string;
  readonly adjustment: string;
}

/**
 * N126: Estimate skill level from action counts per area.
 *
 * Uses the `skill_estimation/3` Prolog predicate to map action counts
 * to skill levels. Returns an overall level (from total actions) plus
 * per-area breakdowns.
 *
 * @param actionCounts - Map of area names to action counts.
 */
export async function estimateSkillLevel(
  actionCounts: Record<string, number>,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SkillProfile> {
  await loadAdaptationKB(adapter);

  const areas = new Map<string, SkillLevel>();
  let totalActions = 0;

  for (const [area, count] of Object.entries(actionCounts)) {
    totalActions += count;

    // Try area-specific estimation first, then generic
    const areaResult = await adapter.querySingle(
      `skill_estimation_area(${area}, ${count}, Level)`
    );
    if (areaResult) {
      areas.set(area, String(areaResult.Level) as SkillLevel);
    } else {
      const genericResult = await adapter.querySingle(
        `skill_estimation(${area}, ${count}, Level)`
      );
      if (genericResult) {
        areas.set(area, String(genericResult.Level) as SkillLevel);
      }
    }
  }

  // Overall level from total actions
  const overallResult = await adapter.querySingle(
    `skill_estimation(overall, ${totalActions}, Level)`
  );
  const overall: SkillLevel = overallResult
    ? (String(overallResult.Level) as SkillLevel)
    : 'beginner';

  return { overall, areas };
}

/**
 * N127: Adapt a list of suggestion types based on skill level.
 *
 * For each suggestion type, queries `adaptive_suggestion_rule/3` to get
 * the concrete adjustment that should be applied.
 *
 * @param suggestionTypes - Array of suggestion type names (e.g., 'chord_suggestion').
 * @param skillLevel - The user's current skill level.
 */
export async function adaptSuggestions(
  suggestionTypes: string[],
  skillLevel: SkillLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<AdaptedSuggestion[]> {
  await loadAdaptationKB(adapter);

  const results: AdaptedSuggestion[] = [];

  for (const type of suggestionTypes) {
    const result = await adapter.querySingle(
      `adaptive_suggestion_rule(${skillLevel}, ${type}, Adjustment)`
    );
    if (result) {
      results.push({
        type,
        adjustment: String(result.Adjustment),
      });
    }
  }

  return results;
}

/**
 * N128: Decide if a feature should be visible at the given skill level.
 *
 * Queries `should_disclose/2` which compares the feature's minimum
 * required level against the user's level via `skill_level_order`.
 *
 * @param feature - The feature identifier (must match a `progressive_disclosure_rule` fact).
 * @param skillLevel - The user's current skill level.
 * @returns `true` if the feature should be shown.
 */
export async function decideFeatureVisibility(
  feature: string,
  skillLevel: SkillLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await loadAdaptationKB(adapter);

  const result = await adapter.querySingle(
    `should_disclose(${feature}, ${skillLevel})`
  );
  return result !== null;
}

/**
 * N128: Get all features visible at a given skill level.
 *
 * Returns the list of features that `should_disclose/2` succeeds for.
 */
export async function getVisibleFeatures(
  skillLevel: SkillLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await loadAdaptationKB(adapter);

  const results = await adapter.queryAll(
    `should_disclose(Feature, ${skillLevel})`
  );
  return results.map((r) => String(r.Feature));
}

// =============================================================================
// N130: Advanced Features Override Toggle
// =============================================================================

/** Whether the advanced features override is active (module-level state). */
let advancedFeaturesOverride = false;

/**
 * N130: Enable the "Show Advanced Features" override.
 *
 * When active, `decideFeatureVisibilityWithOverride()` returns `true`
 * for all features regardless of skill level. Also asserts the
 * `advanced_override_active` fact in Prolog for KB-side override.
 */
export async function enableAdvancedFeaturesOverride(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  advancedFeaturesOverride = true;
  await loadAdaptationKB(adapter);
  try {
    await adapter.loadProgram(':- assertz(advanced_override_active).', 'advanced-override');
  } catch {
    // Prolog engine may not support dynamic assert — TypeScript flag still works
  }
}

/**
 * N130: Disable the "Show Advanced Features" override.
 */
export async function disableAdvancedFeaturesOverride(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  advancedFeaturesOverride = false;
  await loadAdaptationKB(adapter);
  try {
    await adapter.loadProgram(':- retract(advanced_override_active).', 'advanced-override-off');
  } catch {
    // Graceful fallback
  }
}

/**
 * N130: Check if the advanced features override is currently active.
 */
export function isAdvancedFeaturesOverrideActive(): boolean {
  return advancedFeaturesOverride;
}

/**
 * N130: Decide feature visibility, respecting the override toggle.
 *
 * When the override is active, always returns `true`.
 * Otherwise delegates to the standard `decideFeatureVisibility`.
 */
export async function decideFeatureVisibilityWithOverride(
  feature: string,
  skillLevel: SkillLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  if (advancedFeaturesOverride) return true;
  return decideFeatureVisibility(feature, skillLevel, adapter);
}

/**
 * N130: Get all visible features, respecting the override toggle.
 *
 * When the override is active, returns ALL features defined in the KB.
 */
export async function getVisibleFeaturesWithOverride(
  skillLevel: SkillLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  if (advancedFeaturesOverride) {
    // Return all features, regardless of level
    await loadAdaptationKB(adapter);
    const results = await adapter.queryAll(
      'feature_complexity(Feature, _)'
    );
    return results.map((r) => String(r.Feature));
  }
  return getVisibleFeatures(skillLevel, adapter);
}

// =============================================================================
// Tracker: Performance Mode Queries (M145–M146)
// =============================================================================

/**
 * M145: Get performance mode layout for live tracker use.
 *
 * Returns deck types with their size percentages for the performance layout.
 */
export async function getPerformanceModeLayout(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PerformanceModeDeck[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'performance_mode_layout(DeckType, SizePercent)'
  );
  return results.map((r) => ({
    deckType: String(r.DeckType),
    sizePercent: Number(r.SizePercent),
  }));
}

/**
 * M145: Get performance mode deck properties (features, priorities).
 */
export async function getPerformanceModeDeckProperties(
  deckType?: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PerformanceModeDeckProperty[]> {
  await ensurePersona('tracker-user', adapter);
  const query = deckType
    ? `performance_mode_deck_property(${deckType}, Prop, Val)`
    : 'performance_mode_deck_property(Deck, Prop, Val)';
  const results = await adapter.queryAll(query);
  return results.map((r) => ({
    deckType: deckType ?? String(r.Deck),
    property: String(r.Prop),
    value: String(r.Val),
  }));
}

/**
 * M146: Get available pattern launch quantization modes.
 */
export async function getLaunchQuantizationModes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LaunchQuantizationMode[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'pattern_launch_quantization(Mode, Description)'
  );
  return results.map((r) => ({
    mode: String(r.Mode),
    description: String(r.Description),
  }));
}

/**
 * M146: Get suggested launch quantization for a genre.
 */
export async function getSuggestedLaunchQuantization(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `suggest_launch_quantization(${genre}, Mode)`
  );
  return result ? String(result.Mode) : 'bar';
}

// =============================================================================
// Tracker: Pattern Resize Queries (M102)
// =============================================================================

/**
 * M102: Get all pattern resize rules (double/halve operations).
 */
export async function getPatternResizeRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<PatternResizeRule[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'pattern_resize_rule(Op, Description, NoteAdj)'
  );
  return results.map((r) => ({
    operation: String(r.Op),
    description: String(r.Description),
    noteAdjustment: String(r.NoteAdj),
  }));
}

/**
 * M102: Get the note adjustment strategy for a resize operation.
 */
export async function getResizeNoteAdjustment(
  strategy: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ResizeNoteAdjustment | null> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `resize_note_adjustment(${strategy}, Description)`
  );
  if (!result) return null;
  return {
    strategy,
    description: String(result.Description),
  };
}

/**
 * M102: Suggest the best resize operation for a genre.
 */
export async function suggestResizeOperation(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `suggest_resize_operation(${genre}, Op)`
  );
  return result ? String(result.Op) : 'double';
}

/**
 * M102: Resize a pattern's notes according to a given operation.
 *
 * This is a pure-TypeScript helper that applies the resize logic
 * described by the Prolog KB rules. It operates on an array of
 * note events with `position` (in steps) and `duration` (in steps).
 */
export function resizePatternNotes(
  notes: Array<{ position: number; duration: number; pitch: number; velocity: number }>,
  patternLength: number,
  operation: 'double' | 'halve' | 'double_repeat' | 'halve_truncate'
): { notes: Array<{ position: number; duration: number; pitch: number; velocity: number }>; newLength: number } {
  switch (operation) {
    case 'double': {
      // Spread positions: multiply positions and durations by 2
      return {
        notes: notes.map((n) => ({
          ...n,
          position: n.position * 2,
          duration: n.duration * 2,
        })),
        newLength: patternLength * 2,
      };
    }
    case 'halve': {
      // Compress positions: divide by 2, halve durations, clamp overlaps
      const halved = notes
        .map((n) => ({
          ...n,
          position: Math.floor(n.position / 2),
          duration: Math.max(1, Math.floor(n.duration / 2)),
        }))
        .filter((n) => n.position < Math.floor(patternLength / 2));

      // Merge overlapping notes (same position + pitch)
      const seen = new Map<string, typeof halved[0]>();
      for (const n of halved) {
        const key = `${n.position}:${n.pitch}`;
        if (!seen.has(key)) {
          seen.set(key, n);
        }
        // else: skip duplicate — keep first occurrence
      }
      return {
        notes: [...seen.values()],
        newLength: Math.floor(patternLength / 2),
      };
    }
    case 'double_repeat': {
      // Repeat content: original notes + shifted copies
      const repeated = [
        ...notes,
        ...notes.map((n) => ({ ...n, position: n.position + patternLength })),
      ];
      return {
        notes: repeated,
        newLength: patternLength * 2,
      };
    }
    case 'halve_truncate': {
      // Truncate: keep only notes in the first half
      const halfLen = Math.floor(patternLength / 2);
      return {
        notes: notes.filter((n) => n.position < halfLen),
        newLength: halfLen,
      };
    }
  }
}

// =============================================================================
// Tracker: Pattern Quantization & Swing Queries (M103)
// =============================================================================

/**
 * M103: Get all available quantization presets.
 */
export async function getQuantizationPresets(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<QuantizationPreset[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'quantization_preset(Id, StepDiv, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    stepDivision: Number(r.StepDiv),
    description: String(r.Description),
  }));
}

/**
 * M103: Get all available swing presets.
 */
export async function getSwingPresets(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SwingPreset[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'swing_preset(Id, SwingPct, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    swingPercent: Number(r.SwingPct),
    description: String(r.Description),
  }));
}

/**
 * M103: Get the recommended quantization + swing for a genre.
 */
export async function suggestQuantization(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<QuantizationSuggestion> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `suggest_quantization(${genre}, Grid, Swing)`
  );
  return result
    ? { grid: String(result.Grid), swing: String(result.Swing) }
    : { grid: 'q_1_16', swing: 'straight' };
}

/**
 * M103: Quantize a set of note positions to the nearest grid step,
 * then apply a swing offset.
 *
 * @param positions - Raw note positions (in ticks or fractional steps).
 * @param stepsPerBar - How many grid steps per bar.
 * @param swingPercent - Swing amount (50 = straight, 67 = triplet swing).
 *   Swing offsets every other grid line.
 */
export function quantizeWithSwing(
  positions: number[],
  stepsPerBar: number,
  swingPercent: number
): number[] {
  if (stepsPerBar <= 0) return positions;

  const gridSize = 1 / stepsPerBar;

  // Swing amount: 0 = straight (50%), 1.0 = full offset at 75%
  const swingFraction = Math.max(0, Math.min(1, (swingPercent - 50) / 25));

  return positions.map((pos) => {
    // Snap to nearest grid point
    const gridIndex = Math.round(pos / gridSize);
    let snapped = gridIndex * gridSize;

    // Apply swing to every other grid point (odd indices)
    if (gridIndex % 2 === 1) {
      snapped += gridSize * swingFraction * 0.5;
    }

    return snapped;
  });
}

// =============================================================================
// Tracker: Macro Assignments & Automation Recording (M138–M139)
// =============================================================================

/**
 * M138: Get macro assignments for a tracker track type.
 *
 * Queries tracker_macro_assignment/3 from persona-tracker-user.pl and
 * returns structured macro slots with parameter targets.
 */
export async function getTrackerMacroAssignments(
  trackType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TrackerMacroLayout | null> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    `tracker_macro_assignment(${trackType}, Idx, macro(Name, Targets))`
  );
  if (results.length === 0) return null;
  const macros: TrackerMacroAssignment[] = results.map((r) => ({
    macroIndex: Number(r.Idx),
    name: String(r.Name),
    targets: Array.isArray(r.Targets) ? r.Targets.map(String) : [String(r.Targets)],
  }));
  macros.sort((a, b) => a.macroIndex - b.macroIndex);
  return { trackType, macros };
}

/**
 * M138: Get all available tracker track types that have macro assignments.
 */
export async function getTrackerMacroTrackTypes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'tracker_macro_assignment(TrackType, _, _)'
  );
  const types = new Set(results.map((r) => String(r.TrackType)));
  return Array.from(types);
}

/**
 * M139: Get all automation recording modes.
 */
export async function getAutomationRecordingModes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<AutomationRecordingMode[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'automation_recording_mode(Id, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * M139: Get the suggested automation recording mode for a parameter.
 */
export async function suggestAutomationMode(
  paramName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `suggest_automation_mode(${paramName}, Mode)`
  );
  return result ? String(result.Mode) : 'latch';
}

/**
 * M139: Get the automatable parameters from a macro assignment.
 *
 * Given a track type and macro name, returns the underlying parameter
 * names that would be recorded during an automation pass.
 */
export async function getAutomationTargets(
  trackType: string,
  macroName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `tracker_automation_target(${trackType}, ${macroName}, Params)`
  );
  if (!result) return [];
  return Array.isArray(result.Params)
    ? result.Params.map(String)
    : [String(result.Params)];
}

/**
 * M139: Record automation events from macro tweaks.
 *
 * Pure function that captures a sequence of value changes as automation
 * events. The caller provides timestamped value snapshots and this
 * function structures them into an AutomationLane ready for storage.
 */
export function recordMacroAutomation(
  trackType: string,
  macroName: string,
  paramName: string,
  recordingMode: string,
  snapshots: ReadonlyArray<{ tick: number; value: number }>,
): AutomationLane {
  const events: AutomationEvent[] = snapshots.map((s) => ({
    tick: s.tick,
    paramName,
    value: s.value,
  }));
  return {
    trackType,
    macroName,
    paramName,
    events,
    recordingMode,
  };
}

// =============================================================================
// Tracker: Scene Launch Controls (M148)
// =============================================================================

/**
 * M148: Get all scene launch control actions.
 */
export async function getSceneLaunchControls(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SceneLaunchControl[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'scene_launch_control(Action, Description, QuantDefault)'
  );
  return results.map((r) => ({
    action: String(r.Action),
    description: String(r.Description),
    quantizationDefault: String(r.QuantDefault),
  }));
}

/**
 * M148: Get all scene transition rules.
 */
export async function getSceneTransitionRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SceneTransitionRule[]> {
  await ensurePersona('tracker-user', adapter);
  const results = await adapter.queryAll(
    'scene_transition_rule(Id, Description, Bars)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
    bars: Number(r.Bars),
  }));
}

/**
 * M148: Get the suggested scene transition style for a genre.
 */
export async function suggestSceneTransition(
  genre: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string> {
  await ensurePersona('tracker-user', adapter);
  const result = await adapter.querySingle(
    `suggest_scene_transition(${genre}, Transition)`
  );
  return result ? String(result.Transition) : 'cut';
}

// =============================================================================
// Producer: Bus Routing & Automation Queries (M279–M280)
// =============================================================================

/**
 * M279: Set up bus routing for a given track setup type.
 *
 * Returns a BusConfig with all buses, their effects, and types.
 */
export async function setupBusRouting(
  setupType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<BusConfig | null> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `bus_routing_setup(${setupType}, Config)`
  );
  if (!result) return null;
  const rawBuses = Array.isArray(result.Config) ? result.Config : [];
  const buses: BusEntry[] = rawBuses.map((b: unknown) => {
    if (typeof b === 'object' && b !== null && 'args' in b) {
      const args = (b as { args: unknown[] }).args;
      return {
        name: String(args[0]),
        effects: Array.isArray(args[1]) ? args[1].map(String) : [String(args[1])],
        busType: String(args[2]),
      };
    }
    return { name: String(b), effects: [], busType: 'group' };
  });
  return { setupType, buses };
}

/**
 * M280: Suggest automation lanes for a track type, sorted by priority.
 */
export async function suggestAutomationLanes(
  trackType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<AutomationLaneSuggestion[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    `automation_lane_suggestion(${trackType}, Param, Priority)`
  );
  return results
    .map((r) => ({
      trackType,
      parameter: String(r.Param),
      priority: Number(r.Priority),
    }))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * M280: Get all automation lane suggestions across all track types.
 */
export async function getAllAutomationLaneSuggestions(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<AutomationLaneSuggestion[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    'automation_lane_suggestion(TrackType, Param, Priority)'
  );
  return results
    .map((r) => ({
      trackType: String(r.TrackType),
      parameter: String(r.Param),
      priority: Number(r.Priority),
    }))
    .sort((a, b) => a.priority - b.priority);
}

// =============================================================================
// Producer: Collaboration Queries (M307)
// =============================================================================

/**
 * M307: Get collaboration workflows for multi-user projects.
 */
export async function getCollaborationWorkflows(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CollaborationWorkflow[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    'collaboration_workflow(Id, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * M307: Get collaboration roles and their responsibilities.
 */
export async function getCollaborationRoles(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CollaborationRole[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    'collaboration_role(Role, Responsibilities)'
  );
  return results.map((r) => ({
    role: String(r.Role),
    responsibilities: Array.isArray(r.Responsibilities)
      ? r.Responsibilities.map(String)
      : [String(r.Responsibilities)],
  }));
}

/**
 * M307: Get recommended handoff method between collaboration roles.
 */
export async function getCollaborationHandoff(
  fromRole: string,
  toRole: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CollaborationHandoff | null> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `suggest_collaboration_handoff(${fromRole}, ${toRole}, Method)`
  );
  if (!result) return null;
  return {
    fromRole,
    toRole,
    method: String(result.Method),
  };
}

// =============================================================================
// Producer: Reference Matching, Loudness & Dynamics (M287–M292)
// =============================================================================

/**
 * M287: Get available reference matching techniques.
 */
export async function getReferenceMatchingTechniques(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ReferenceMatchingTechnique[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    'reference_matching_technique(Technique, Description)'
  );
  return results.map((r) => ({
    technique: String(r.Technique),
    description: String(r.Description),
  }));
}

/**
 * M288: Get loudness targets for all platforms.
 */
export async function getLoudnessTargets(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LoudnessTarget[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    'loudness_target(Platform, LUFS, Description)'
  );
  return results.map((r) => ({
    platform: String(r.Platform),
    targetLUFS: Number(r.LUFS),
    description: String(r.Description),
  }));
}

/**
 * M288: Get the loudness target for a specific platform.
 */
export async function getLoudnessTargetForPlatform(
  platform: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LoudnessTarget | null> {
  await ensurePersona('producer', adapter);
  const result = await adapter.querySingle(
    `loudness_target(${platform}, LUFS, Description)`
  );
  if (!result) return null;
  return {
    platform,
    targetLUFS: Number(result.LUFS),
    description: String(result.Description),
  };
}

/**
 * M289: Get dynamic range targets for all genres.
 */
export async function getDynamicRangeTargets(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DynamicRangeTarget[]> {
  await ensurePersona('producer', adapter);
  const results = await adapter.queryAll(
    'dynamic_range_target(Genre, DR, Description)'
  );
  return results.map((r) => ({
    genre: String(r.Genre),
    targetDR: Number(r.DR),
    description: String(r.Description),
  }));
}

/**
 * M290: Diagnose loudness for a platform given a measured LUFS value.
 *
 * Queries the Prolog `loudness_diagnosis/3` rule to determine whether
 * the mix is too loud, too quiet, or on target.
 */
export async function diagnoseLoudness(
  platform: string,
  measuredLUFS: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LoudnessDiagnosis | null> {
  await ensurePersona('producer', adapter);

  // Get the target for context
  const target = await getLoudnessTargetForPlatform(platform, adapter);
  if (!target) return null;

  const result = await adapter.querySingle(
    `loudness_diagnosis(${platform}, ${measuredLUFS}, Status)`
  );

  const status = result ? String(result.Status) : 'on_target';
  const validStatus = (
    status === 'too_loud' || status === 'too_quiet' || status === 'on_target'
  ) ? status : 'on_target';

  return {
    platform,
    measuredLUFS,
    status: validStatus,
    targetLUFS: target.targetLUFS,
    description: target.description,
  };
}

/**
 * M291: Analyze loudness across multiple platforms.
 *
 * Returns a diagnosis for each platform, allowing the user to see
 * how their mix measures up for different delivery targets.
 */
export async function analyzeLoudnessMultiPlatform(
  measuredLUFS: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LoudnessDiagnosis[]> {
  const targets = await getLoudnessTargets(adapter);
  const results: LoudnessDiagnosis[] = [];

  for (const target of targets) {
    const diff = measuredLUFS - target.targetLUFS;
    let status: LoudnessDiagnosis['status'];
    if (diff > 2) {
      status = 'too_loud';
    } else if (diff < -2) {
      status = 'too_quiet';
    } else {
      status = 'on_target';
    }
    results.push({
      platform: target.platform,
      measuredLUFS,
      status,
      targetLUFS: target.targetLUFS,
      description: target.description,
    });
  }

  return results;
}

/**
 * M292: Suggest dynamics processing based on genre and current dynamic range.
 *
 * Queries the Prolog `dynamics_suggestion/3` rule.
 */
export async function suggestDynamicsProcessing(
  genre: string,
  currentDR: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DynamicsSuggestion[]> {
  await ensurePersona('producer', adapter);

  // Get the genre target for context
  const targetResult = await adapter.querySingle(
    `dynamic_range_target(${genre}, TargetDR, Desc)`
  );
  const targetDR = targetResult ? Number(targetResult.TargetDR) : 10;
  const description = targetResult ? String(targetResult.Desc) : `Target ~${targetDR} dB`;

  // Query dynamics suggestions
  const results = await adapter.queryAll(
    `dynamics_suggestion(${genre}, ${currentDR}, Action)`
  );

  const suggestions: DynamicsSuggestion[] = results
    .map((r) => ({
      genre,
      currentDR,
      action: String(r.Action),
      targetDR,
      description,
    }))
    // Deduplicate actions (Prolog may return multiple due to fallback rules)
    .filter((s, i, arr) => arr.findIndex((x) => x.action === s.action) === i)
    // Filter out generic "check_ok" if more specific action exists
    .filter((s, _, arr) =>
      s.action !== 'check_ok' || arr.length === 1
    );

  return suggestions;
}

// =============================================================================
// M399: Persona Feature Matrix
// =============================================================================

/** Feature availability per persona. */
export type FeatureAvailability = 'available' | 'limited' | 'not-available';

/** A feature entry in the persona feature matrix. */
export interface PersonaFeatureEntry {
  readonly featureId: string;
  readonly featureName: string;
  readonly category: string;
  readonly notationComposer: FeatureAvailability;
  readonly trackerUser: FeatureAvailability;
  readonly soundDesigner: FeatureAvailability;
  readonly producer: FeatureAvailability;
}

/**
 * M399: Get the complete persona feature matrix.
 *
 * Returns a structured matrix indicating which features are available,
 * limited, or unavailable for each persona.
 */
export function getPersonaFeatureMatrix(): readonly PersonaFeatureEntry[] {
  return PERSONA_FEATURE_MATRIX;
}

/**
 * M399: Get features available for a specific persona.
 */
export function getFeaturesForPersona(
  persona: 'notation-composer' | 'tracker-user' | 'sound-designer' | 'producer',
): readonly PersonaFeatureEntry[] {
  const key = PERSONA_KEY_MAP[persona];
  return PERSONA_FEATURE_MATRIX.filter(f => f[key] !== 'not-available');
}

/**
 * M399: Get features in a specific category.
 */
export function getFeaturesByCategory(category: string): readonly PersonaFeatureEntry[] {
  return PERSONA_FEATURE_MATRIX.filter(f => f.category === category);
}

const PERSONA_KEY_MAP = {
  'notation-composer': 'notationComposer',
  'tracker-user': 'trackerUser',
  'sound-designer': 'soundDesigner',
  'producer': 'producer',
} as const;

/** M399: Complete persona feature matrix (static data). */
const PERSONA_FEATURE_MATRIX: readonly PersonaFeatureEntry[] = [
  // === Composition ===
  { featureId: 'score-layout', featureName: 'Score Layout & Engraving', category: 'Composition', notationComposer: 'available', trackerUser: 'not-available', soundDesigner: 'not-available', producer: 'limited' },
  { featureId: 'counterpoint-analysis', featureName: 'Counterpoint Analysis', category: 'Composition', notationComposer: 'available', trackerUser: 'not-available', soundDesigner: 'not-available', producer: 'not-available' },
  { featureId: 'form-templates', featureName: 'Classical Form Templates', category: 'Composition', notationComposer: 'available', trackerUser: 'limited', soundDesigner: 'not-available', producer: 'limited' },
  { featureId: 'harmony-explorer', featureName: 'Harmony Explorer', category: 'Composition', notationComposer: 'available', trackerUser: 'limited', soundDesigner: 'limited', producer: 'available' },
  { featureId: 'cadence-suggestions', featureName: 'Cadence & Modulation Suggestions', category: 'Composition', notationComposer: 'available', trackerUser: 'not-available', soundDesigner: 'not-available', producer: 'limited' },
  { featureId: 'orchestration', featureName: 'Orchestration Guides', category: 'Composition', notationComposer: 'available', trackerUser: 'not-available', soundDesigner: 'limited', producer: 'limited' },
  // === Pattern Editing ===
  { featureId: 'pattern-editor', featureName: 'Pattern Editor', category: 'Pattern Editing', notationComposer: 'not-available', trackerUser: 'available', soundDesigner: 'limited', producer: 'available' },
  { featureId: 'pattern-resize', featureName: 'Pattern Resize (Double/Halve)', category: 'Pattern Editing', notationComposer: 'not-available', trackerUser: 'available', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'groove-templates', featureName: 'Groove & Swing Templates', category: 'Pattern Editing', notationComposer: 'not-available', trackerUser: 'available', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'pattern-variations', featureName: 'Pattern Variation Techniques', category: 'Pattern Editing', notationComposer: 'limited', trackerUser: 'available', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'quantization', featureName: 'Quantization & Swing', category: 'Pattern Editing', notationComposer: 'limited', trackerUser: 'available', soundDesigner: 'not-available', producer: 'available' },
  // === Sound Design ===
  { featureId: 'synthesis-recommendations', featureName: 'Synthesis Recommendations', category: 'Sound Design', notationComposer: 'not-available', trackerUser: 'limited', soundDesigner: 'available', producer: 'limited' },
  { featureId: 'modulation-routing', featureName: 'Modulation Routing Suggestions', category: 'Sound Design', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'available', producer: 'not-available' },
  { featureId: 'effect-chains', featureName: 'Effect Chain Presets', category: 'Sound Design', notationComposer: 'not-available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'layering', featureName: 'Sound Layering Suggestions', category: 'Sound Design', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'available', producer: 'limited' },
  { featureId: 'frequency-balance', featureName: 'Frequency Balance Analysis', category: 'Sound Design', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'macro-assignments', featureName: 'Macro Assignments', category: 'Sound Design', notationComposer: 'not-available', trackerUser: 'limited', soundDesigner: 'available', producer: 'limited' },
  { featureId: 'randomization', featureName: 'Parameter Randomization', category: 'Sound Design', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'available', producer: 'not-available' },
  // === Production ===
  { featureId: 'arrangement-structure', featureName: 'Arrangement Structure Suggestions', category: 'Production', notationComposer: 'limited', trackerUser: 'limited', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'mix-checklist', featureName: 'Mixing Checklist', category: 'Production', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'limited', producer: 'available' },
  { featureId: 'mastering-targets', featureName: 'Mastering Targets (LUFS)', category: 'Production', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'track-colors', featureName: 'Track Color Coding', category: 'Production', notationComposer: 'not-available', trackerUser: 'limited', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'bus-routing', featureName: 'Bus Routing Setup', category: 'Production', notationComposer: 'not-available', trackerUser: 'limited', soundDesigner: 'available', producer: 'available' },
  { featureId: 'automation-lanes', featureName: 'Automation Lane Suggestions', category: 'Production', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'limited', producer: 'available' },
  { featureId: 'loudness-analysis', featureName: 'Loudness & Dynamics Analysis', category: 'Production', notationComposer: 'not-available', trackerUser: 'not-available', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'collaboration', featureName: 'Collaboration Workflows', category: 'Production', notationComposer: 'limited', trackerUser: 'limited', soundDesigner: 'limited', producer: 'available' },
  // === AI & Learning ===
  { featureId: 'ai-advisor', featureName: 'AI Advisor Panel', category: 'AI & Learning', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'adaptive-tutorials', featureName: 'Adaptive Tutorials', category: 'AI & Learning', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'skill-estimation', featureName: 'Skill Level Estimation', category: 'AI & Learning', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'progressive-disclosure', featureName: 'Progressive Feature Disclosure', category: 'AI & Learning', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'error-detection', featureName: 'Error Pattern Detection', category: 'AI & Learning', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  // === Workflow ===
  { featureId: 'workspace-templates', featureName: 'Workspace Templates', category: 'Workflow', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'session-notes', featureName: 'Session Notes', category: 'Workflow', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'project-metadata', featureName: 'Project Metadata & Search', category: 'Workflow', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'undo-branching', featureName: 'Undo History Branching', category: 'Workflow', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'project-versioning', featureName: 'Project Versioning', category: 'Workflow', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  { featureId: 'command-palette', featureName: 'Command Palette (Cmd+K)', category: 'Workflow', notationComposer: 'available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
  // === Performance ===
  { featureId: 'performance-mode', featureName: 'Performance Mode Layout', category: 'Performance', notationComposer: 'not-available', trackerUser: 'available', soundDesigner: 'limited', producer: 'available' },
  { featureId: 'launch-quantization', featureName: 'Pattern Launch Quantization', category: 'Performance', notationComposer: 'not-available', trackerUser: 'available', soundDesigner: 'not-available', producer: 'available' },
  { featureId: 'routing-feedback-detection', featureName: 'Routing Feedback Loop Detection', category: 'Performance', notationComposer: 'not-available', trackerUser: 'available', soundDesigner: 'available', producer: 'available' },
];
