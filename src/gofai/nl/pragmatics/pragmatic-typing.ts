/**
 * GOFAI NL Pragmatics — Pragmatic Typing (Steps 221–225)
 *
 * Step 221: Typecheck Pragmatic Bindings
 * Step 222: Structured Clarification Object
 * Step 223: Clarification Minimality
 * Step 224: Clarification Batching
 * Step 225: User Preference Learning
 *
 * @module gofai/nl/pragmatics/pragmatic-typing
 */

// ============================================================================
// STEP 221 — Typecheck Pragmatic Bindings
// ============================================================================

/**
 * The 15 semantic roles a referent can fill within a pragmatic binding.
 */
export type SemanticRole =
  | 'agent'
  | 'patient'
  | 'instrument'
  | 'location'
  | 'temporal'
  | 'source'
  | 'goal'
  | 'beneficiary'
  | 'manner'
  | 'extent'
  | 'cause'
  | 'result'
  | 'theme'
  | 'experiencer'
  | 'stimulus';

/**
 * Entity types that can appear as referents in a music-production domain.
 */
export type EntityType =
  | 'track'
  | 'section'
  | 'timeRange'
  | 'marker'
  | 'instrument'
  | 'effect'
  | 'parameter'
  | 'value'
  | 'note'
  | 'chord'
  | 'scale'
  | 'tempo'
  | 'dynamics'
  | 'automation'
  | 'bus'
  | 'send'
  | 'region'
  | 'clip'
  | 'pattern'
  | 'user'
  | 'project'
  | 'preset'
  | 'genre'
  | 'emotion';

/** Severity for binding diagnostics. */
export type BindingDiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

/** A single pragmatic binding that pairs a referent with a semantic role. */
export interface PragmaticBinding {
  readonly bindingId: string;
  readonly referentId: string;
  readonly referentLabel: string;
  readonly entityType: EntityType;
  readonly role: SemanticRole;
  readonly confidence: number;
  readonly source: 'anaphora' | 'deixis' | 'definite' | 'demonstrative' | 'explicit' | 'inferred';
  readonly utteranceSpan: readonly [number, number];
}

/** Result of type-checking a single pragmatic binding. */
export interface BindingTypeCheck {
  readonly binding: PragmaticBinding;
  readonly compatible: boolean;
  readonly compatibilityScore: number;
  readonly requiredTypes: ReadonlyArray<EntityType>;
  readonly actualType: EntityType;
  readonly diagnostics: ReadonlyArray<BindingDiagnostic>;
  readonly suggestedAlternatives: ReadonlyArray<AlternativeBinding>;
}

/** A diagnostic message produced during binding type-check. */
export interface BindingDiagnostic {
  readonly diagnosticId: string;
  readonly bindingId: string;
  readonly severity: BindingDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly hint: string;
  readonly role: SemanticRole;
  readonly entityType: EntityType;
}

/** An alternative binding suggestion when the original is incompatible. */
export interface AlternativeBinding {
  readonly referentId: string;
  readonly referentLabel: string;
  readonly entityType: EntityType;
  readonly score: number;
  readonly reason: string;
}

/** Requirements for a given semantic role. */
export interface RoleRequirements {
  readonly role: SemanticRole;
  readonly compatibleTypes: ReadonlyArray<EntityType>;
  readonly preferredTypes: ReadonlyArray<EntityType>;
  readonly description: string;
  readonly examples: ReadonlyArray<string>;
}

/** Compatibility entry in the role-entity matrix. */
export interface RoleCompatibility {
  readonly role: SemanticRole;
  readonly entityType: EntityType;
  readonly compatible: boolean;
  readonly score: number;
  readonly notes: string;
}

/** Report summarising a batch of binding checks. */
export interface BindingReport {
  readonly totalBindings: number;
  readonly compatibleCount: number;
  readonly incompatibleCount: number;
  readonly warningCount: number;
  readonly checks: ReadonlyArray<BindingTypeCheck>;
  readonly summary: string;
}

/** A chain of bindings that must be checked in sequence. */
export interface BindingChain {
  readonly chainId: string;
  readonly bindings: ReadonlyArray<PragmaticBinding>;
  readonly valid: boolean;
  readonly diagnostics: ReadonlyArray<BindingDiagnostic>;
}

// ---- 221 Compatibility Matrix Data ----

const ROLE_COMPATIBILITY_MAP: Record<SemanticRole, ReadonlyArray<EntityType>> = {
  agent: ['user', 'automation', 'instrument'],
  patient: ['track', 'section', 'region', 'clip', 'pattern', 'note', 'chord', 'parameter', 'effect', 'bus', 'send'],
  instrument: ['instrument', 'effect', 'preset', 'automation'],
  location: ['section', 'timeRange', 'marker', 'region', 'track', 'bus'],
  temporal: ['timeRange', 'marker', 'tempo', 'section'],
  source: ['track', 'section', 'region', 'clip', 'bus', 'send', 'preset', 'instrument'],
  goal: ['track', 'section', 'region', 'clip', 'bus', 'send', 'parameter'],
  beneficiary: ['track', 'section', 'bus', 'user', 'project'],
  manner: ['dynamics', 'tempo', 'scale', 'genre', 'emotion', 'preset'],
  extent: ['parameter', 'value', 'dynamics', 'tempo', 'timeRange'],
  cause: ['automation', 'effect', 'parameter', 'note', 'chord', 'pattern', 'user'],
  result: ['value', 'parameter', 'dynamics', 'tempo', 'effect', 'emotion'],
  theme: ['track', 'section', 'note', 'chord', 'scale', 'pattern', 'clip', 'region', 'genre', 'emotion', 'preset'],
  experiencer: ['user'],
  stimulus: ['note', 'chord', 'pattern', 'effect', 'dynamics', 'tempo', 'emotion', 'genre'],
};

const ROLE_PREFERRED_MAP: Record<SemanticRole, ReadonlyArray<EntityType>> = {
  agent: ['user'],
  patient: ['track', 'section', 'region'],
  instrument: ['instrument', 'effect'],
  location: ['section', 'timeRange', 'marker'],
  temporal: ['timeRange', 'marker'],
  source: ['track', 'section', 'preset'],
  goal: ['track', 'section', 'bus'],
  beneficiary: ['track', 'user'],
  manner: ['dynamics', 'preset'],
  extent: ['parameter', 'value'],
  cause: ['automation', 'effect'],
  result: ['value', 'parameter'],
  theme: ['track', 'section', 'pattern'],
  experiencer: ['user'],
  stimulus: ['note', 'chord', 'effect'],
};

const ROLE_DESCRIPTIONS: Record<SemanticRole, string> = {
  agent: 'The entity performing the action (typically the user or an automation lane)',
  patient: 'The entity being acted upon (a track, section, region, etc.)',
  instrument: 'The tool or means used to perform the action (instrument, effect, preset)',
  location: 'Where the action takes place (section, time range, marker, track)',
  temporal: 'When the action occurs or applies (time range, marker, tempo point)',
  source: 'The origin or starting point (source track, section, bus)',
  goal: 'The destination or end point (target track, section, parameter)',
  beneficiary: 'The entity that benefits from the action (track, user, project)',
  manner: 'How the action is performed (dynamics, tempo, style)',
  extent: 'How much or to what degree (parameter value, dynamics level)',
  cause: 'What triggered the action (automation, effect, user input)',
  result: 'The outcome or resulting state (parameter value, dynamics level)',
  theme: 'The subject matter or content (notes, patterns, genres)',
  experiencer: 'The entity experiencing a percept or state (the user)',
  stimulus: 'What is experienced (a note, chord, effect, emotion)',
};

const ROLE_EXAMPLES: Record<SemanticRole, ReadonlyArray<string>> = {
  agent: ['the user', 'the automation', 'the arpeggiator'],
  patient: ['the chorus track', 'bar 12', 'the kick pattern'],
  instrument: ['the reverb', 'the compressor', 'the piano'],
  location: ['in the chorus', 'at bar 8', 'on the bass track'],
  temporal: ['from bar 4 to bar 8', 'at the drop', 'during the bridge'],
  source: ['from the intro', 'from the piano track', 'from preset X'],
  goal: ['to the outro', 'onto the master bus', 'to 80%'],
  beneficiary: ['for the bass track', 'for the project', 'for the mix'],
  manner: ['smoothly', 'with reverb', 'using staccato'],
  extent: ['by 10 dB', 'a lot', 'slightly'],
  cause: ['because of clipping', 'from the sidechain', 'triggered by note C4'],
  result: ['resulting in silence', 'becoming 120 bpm', 'reaching -6 dB'],
  theme: ['the melody', 'the chord progression', 'the groove'],
  experiencer: ['the listener', 'the producer'],
  stimulus: ['the bass drop', 'the dissonant chord', 'the snare hit'],
};

// ---- 221 Compatibility Rules ----

interface CompatibilityRule {
  readonly ruleId: string;
  readonly role: SemanticRole;
  readonly entityType: EntityType;
  readonly compatible: boolean;
  readonly score: number;
  readonly reason: string;
}

/** Get all compatibility rules for inspection or testing. */
export function getCompatibilityRules(): ReadonlyArray<CompatibilityRule> {
  return COMPATIBILITY_RULES;
}

const COMPATIBILITY_RULES: ReadonlyArray<CompatibilityRule> = [
  // Agent rules (1-3)
  { ruleId: 'cr-001', role: 'agent', entityType: 'user', compatible: true, score: 1.0, reason: 'Users are canonical agents' },
  { ruleId: 'cr-002', role: 'agent', entityType: 'automation', compatible: true, score: 0.8, reason: 'Automation lanes can act as agents' },
  { ruleId: 'cr-003', role: 'agent', entityType: 'value', compatible: false, score: 0.0, reason: 'Values cannot be agents' },
  // Patient rules (4-7)
  { ruleId: 'cr-004', role: 'patient', entityType: 'track', compatible: true, score: 1.0, reason: 'Tracks are common patients of edits' },
  { ruleId: 'cr-005', role: 'patient', entityType: 'section', compatible: true, score: 0.95, reason: 'Sections are common targets' },
  { ruleId: 'cr-006', role: 'patient', entityType: 'user', compatible: false, score: 0.0, reason: 'Users are not targets of edits' },
  { ruleId: 'cr-007', role: 'patient', entityType: 'genre', compatible: false, score: 0.0, reason: 'Genres cannot be edited directly' },
  // Instrument rules (8-10)
  { ruleId: 'cr-008', role: 'instrument', entityType: 'instrument', compatible: true, score: 1.0, reason: 'Instruments are canonical instruments' },
  { ruleId: 'cr-009', role: 'instrument', entityType: 'effect', compatible: true, score: 0.9, reason: 'Effects can serve as instruments' },
  { ruleId: 'cr-010', role: 'instrument', entityType: 'section', compatible: false, score: 0.0, reason: 'Sections cannot be instruments' },
  // Location rules (11-14)
  { ruleId: 'cr-011', role: 'location', entityType: 'section', compatible: true, score: 1.0, reason: 'Sections are canonical locations' },
  { ruleId: 'cr-012', role: 'location', entityType: 'timeRange', compatible: true, score: 0.95, reason: 'Time ranges denote locations' },
  { ruleId: 'cr-013', role: 'location', entityType: 'marker', compatible: true, score: 0.9, reason: 'Markers denote positions' },
  { ruleId: 'cr-014', role: 'location', entityType: 'instrument', compatible: false, score: 0.0, reason: 'Instruments are not locations' },
  // Temporal rules (15-17)
  { ruleId: 'cr-015', role: 'temporal', entityType: 'timeRange', compatible: true, score: 1.0, reason: 'Time ranges are canonical temporal referents' },
  { ruleId: 'cr-016', role: 'temporal', entityType: 'marker', compatible: true, score: 0.9, reason: 'Markers indicate temporal points' },
  { ruleId: 'cr-017', role: 'temporal', entityType: 'effect', compatible: false, score: 0.0, reason: 'Effects are not temporal referents' },
  // Source rules (18-19)
  { ruleId: 'cr-018', role: 'source', entityType: 'track', compatible: true, score: 1.0, reason: 'Tracks can be copy/move sources' },
  { ruleId: 'cr-019', role: 'source', entityType: 'emotion', compatible: false, score: 0.0, reason: 'Emotions are not sources' },
  // Goal rules (20-21)
  { ruleId: 'cr-020', role: 'goal', entityType: 'track', compatible: true, score: 1.0, reason: 'Tracks can be copy/move targets' },
  { ruleId: 'cr-021', role: 'goal', entityType: 'emotion', compatible: false, score: 0.0, reason: 'Emotions are not goals' },
  // Beneficiary rules (22-23)
  { ruleId: 'cr-022', role: 'beneficiary', entityType: 'user', compatible: true, score: 1.0, reason: 'Users benefit from actions' },
  { ruleId: 'cr-023', role: 'beneficiary', entityType: 'note', compatible: false, score: 0.0, reason: 'Notes do not benefit' },
  // Manner rules (24-25)
  { ruleId: 'cr-024', role: 'manner', entityType: 'dynamics', compatible: true, score: 1.0, reason: 'Dynamics describe manner of execution' },
  { ruleId: 'cr-025', role: 'manner', entityType: 'track', compatible: false, score: 0.0, reason: 'Tracks cannot describe manner' },
  // Extent rules (26-27)
  { ruleId: 'cr-026', role: 'extent', entityType: 'value', compatible: true, score: 1.0, reason: 'Values describe extent' },
  { ruleId: 'cr-027', role: 'extent', entityType: 'section', compatible: false, score: 0.0, reason: 'Sections are not extents' },
  // Cause / Result / Theme / Experiencer / Stimulus (28-34)
  { ruleId: 'cr-028', role: 'cause', entityType: 'automation', compatible: true, score: 1.0, reason: 'Automation causes changes' },
  { ruleId: 'cr-029', role: 'cause', entityType: 'genre', compatible: false, score: 0.0, reason: 'Genres do not cause events' },
  { ruleId: 'cr-030', role: 'result', entityType: 'value', compatible: true, score: 1.0, reason: 'Values can be results' },
  { ruleId: 'cr-031', role: 'result', entityType: 'track', compatible: false, score: 0.0, reason: 'Tracks are not result values' },
  { ruleId: 'cr-032', role: 'theme', entityType: 'pattern', compatible: true, score: 1.0, reason: 'Patterns are canonical themes' },
  { ruleId: 'cr-033', role: 'experiencer', entityType: 'user', compatible: true, score: 1.0, reason: 'Users are canonical experiencers' },
  { ruleId: 'cr-034', role: 'stimulus', entityType: 'note', compatible: true, score: 1.0, reason: 'Notes are canonical stimuli' },
];

// ---- 221 Helper Counters ----

let _diagnosticCounter = 0;
function nextDiagnosticId(): string {
  _diagnosticCounter += 1;
  return `bd-${_diagnosticCounter.toString().padStart(4, '0')}`;
}

// ---- 221 Functions ----

/** Retrieve requirements for a semantic role. */
export function getRoleRequirements(role: SemanticRole): RoleRequirements {
  const compatibleTypes = ROLE_COMPATIBILITY_MAP[role];
  const preferredTypes = ROLE_PREFERRED_MAP[role];
  const description = ROLE_DESCRIPTIONS[role];
  const examples = ROLE_EXAMPLES[role];
  return { role, compatibleTypes, preferredTypes, description, examples };
}

/** Return compatible entity types for a semantic role. */
export function getCompatibleTypes(role: SemanticRole): ReadonlyArray<EntityType> {
  return ROLE_COMPATIBILITY_MAP[role];
}

/** Determine the most likely semantic role from a binding label. */
export function getSemanticRole(label: string): SemanticRole {
  const lower = label.toLowerCase().trim();
  const agentPatterns = ['user', 'producer', 'composer', 'arranger', 'musician', 'performer'];
  const locationPatterns = ['section', 'bar', 'measure', 'position', 'location', 'place', 'area', 'region of'];
  const temporalPatterns = ['time', 'moment', 'when', 'during', 'before', 'after', 'at bar', 'beat'];
  const instrumentPatterns = ['using', 'with', 'via', 'through', 'instrument', 'synth', 'plugin'];
  const mannerPatterns = ['smoothly', 'gently', 'loudly', 'softly', 'staccato', 'legato', 'style'];
  const extentPatterns = ['amount', 'level', 'degree', 'by', 'percent', 'db', 'semitone', 'step'];
  const sourcePatterns = ['from', 'source', 'origin', 'copy from', 'move from'];
  const goalPatterns = ['to', 'target', 'destination', 'copy to', 'move to', 'onto'];
  const beneficiaryPatterns = ['for', 'benefit', 'in service of'];
  const causePatterns = ['because', 'cause', 'trigger', 'due to', 'since'];
  const resultPatterns = ['result', 'outcome', 'becoming', 'reaching', 'yielding'];
  const themePatterns = ['melody', 'chord', 'progression', 'groove', 'pattern', 'riff', 'motif'];
  const experiencerPatterns = ['listener', 'audience', 'hearer'];
  const stimulusPatterns = ['stimulus', 'percept', 'sound', 'noise', 'tone'];

  if (agentPatterns.some(p => lower.includes(p))) return 'agent';
  if (locationPatterns.some(p => lower.includes(p))) return 'location';
  if (temporalPatterns.some(p => lower.includes(p))) return 'temporal';
  if (instrumentPatterns.some(p => lower.includes(p))) return 'instrument';
  if (mannerPatterns.some(p => lower.includes(p))) return 'manner';
  if (extentPatterns.some(p => lower.includes(p))) return 'extent';
  if (sourcePatterns.some(p => lower.includes(p))) return 'source';
  if (goalPatterns.some(p => lower.includes(p))) return 'goal';
  if (beneficiaryPatterns.some(p => lower.includes(p))) return 'beneficiary';
  if (causePatterns.some(p => lower.includes(p))) return 'cause';
  if (resultPatterns.some(p => lower.includes(p))) return 'result';
  if (themePatterns.some(p => lower.includes(p))) return 'theme';
  if (experiencerPatterns.some(p => lower.includes(p))) return 'experiencer';
  if (stimulusPatterns.some(p => lower.includes(p))) return 'stimulus';
  return 'patient';
}

/** Check whether an entity type is compatible with a semantic role. */
export function isRoleCompatible(role: SemanticRole, entityType: EntityType): boolean {
  const compatible = ROLE_COMPATIBILITY_MAP[role];
  return compatible.includes(entityType);
}

/** Generate a diagnostic when a binding is incompatible. */
export function generateBindingDiagnostic(
  binding: PragmaticBinding,
  requiredTypes: ReadonlyArray<EntityType>,
): BindingDiagnostic {
  const compatible = requiredTypes.includes(binding.entityType);
  const severity: BindingDiagnosticSeverity = compatible ? 'info' : 'error';
  const code = compatible ? 'BINDING_OK' : 'BINDING_TYPE_MISMATCH';
  const message = compatible
    ? `Binding "${binding.referentLabel}" (${binding.entityType}) is compatible with role "${binding.role}".`
    : `Binding "${binding.referentLabel}" (${binding.entityType}) is incompatible with role "${binding.role}". Expected one of: ${requiredTypes.join(', ')}.`;
  const hint = compatible
    ? 'No action needed.'
    : `Consider re-resolving the referent to one of: ${requiredTypes.join(', ')}. ` +
      `The entity type "${binding.entityType}" cannot fill the "${binding.role}" role.`;
  return {
    diagnosticId: nextDiagnosticId(),
    bindingId: binding.bindingId,
    severity,
    code,
    message,
    hint,
    role: binding.role,
    entityType: binding.entityType,
  };
}

/** Suggest an alternative binding when the original is incompatible. */
export function suggestAlternativeBinding(
  binding: PragmaticBinding,
  availableReferents: ReadonlyArray<{ id: string; label: string; entityType: EntityType }>,
): ReadonlyArray<AlternativeBinding> {
  const compatibleTypes = ROLE_COMPATIBILITY_MAP[binding.role];
  const preferredTypes = ROLE_PREFERRED_MAP[binding.role];
  const candidates: AlternativeBinding[] = [];

  for (const ref of availableReferents) {
    if (!compatibleTypes.includes(ref.entityType)) continue;
    if (ref.id === binding.referentId) continue;
    const isPreferred = preferredTypes.includes(ref.entityType);
    const baseScore = isPreferred ? 0.9 : 0.6;
    const labelSimilarity = computeLabelSimilarity(binding.referentLabel, ref.label);
    const finalScore = baseScore * 0.7 + labelSimilarity * 0.3;
    candidates.push({
      referentId: ref.id,
      referentLabel: ref.label,
      entityType: ref.entityType,
      score: Math.round(finalScore * 1000) / 1000,
      reason: isPreferred
        ? `Preferred type "${ref.entityType}" for role "${binding.role}"`
        : `Compatible type "${ref.entityType}" for role "${binding.role}"`,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 5);
}

/** Compute a rough label similarity score between 0 and 1. */
function computeLabelSimilarity(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return 1.0;
  if (la.includes(lb) || lb.includes(la)) return 0.7;
  const wordsA = la.split(/\s+/);
  const wordsB = lb.split(/\s+/);
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.includes(w)) overlap += 1;
  }
  const maxLen = Math.max(wordsA.length, wordsB.length);
  return maxLen > 0 ? overlap / maxLen : 0;
}

/** Type-check a single pragmatic binding. */
export function checkPragmaticBinding(
  binding: PragmaticBinding,
  availableReferents?: ReadonlyArray<{ id: string; label: string; entityType: EntityType }>,
): BindingTypeCheck {
  const requiredTypes = ROLE_COMPATIBILITY_MAP[binding.role];
  const compatible = requiredTypes.includes(binding.entityType);
  const preferredTypes = ROLE_PREFERRED_MAP[binding.role];
  const isPreferred = preferredTypes.includes(binding.entityType);
  const compatibilityScore = compatible ? (isPreferred ? 1.0 : 0.7) : 0.0;

  const diagnostics: BindingDiagnostic[] = [];
  diagnostics.push(generateBindingDiagnostic(binding, requiredTypes));

  if (!compatible && binding.confidence < 0.5) {
    diagnostics.push({
      diagnosticId: nextDiagnosticId(),
      bindingId: binding.bindingId,
      severity: 'warning',
      code: 'BINDING_LOW_CONFIDENCE',
      message: `Low confidence (${binding.confidence}) on an incompatible binding — likely a resolution error.`,
      hint: 'Re-resolve the referent or ask for clarification.',
      role: binding.role,
      entityType: binding.entityType,
    });
  }

  if (compatible && !isPreferred) {
    diagnostics.push({
      diagnosticId: nextDiagnosticId(),
      bindingId: binding.bindingId,
      severity: 'hint',
      code: 'BINDING_NOT_PREFERRED',
      message: `Type "${binding.entityType}" is compatible but not preferred for role "${binding.role}".`,
      hint: `Preferred types are: ${preferredTypes.join(', ')}.`,
      role: binding.role,
      entityType: binding.entityType,
    });
  }

  const suggestedAlternatives = availableReferents
    ? suggestAlternativeBinding(binding, availableReferents)
    : [];

  return {
    binding,
    compatible,
    compatibilityScore,
    requiredTypes,
    actualType: binding.entityType,
    diagnostics,
    suggestedAlternatives,
  };
}

/** Batch-check multiple bindings. */
export function batchCheckBindings(
  bindings: ReadonlyArray<PragmaticBinding>,
  availableReferents?: ReadonlyArray<{ id: string; label: string; entityType: EntityType }>,
): ReadonlyArray<BindingTypeCheck> {
  return bindings.map(b => checkPragmaticBinding(b, availableReferents));
}

/** Format a binding report from a set of checks. */
export function formatBindingReport(checks: ReadonlyArray<BindingTypeCheck>): BindingReport {
  let compatibleCount = 0;
  let incompatibleCount = 0;
  let warningCount = 0;

  for (const c of checks) {
    if (c.compatible) {
      compatibleCount += 1;
    } else {
      incompatibleCount += 1;
    }
    for (const d of c.diagnostics) {
      if (d.severity === 'warning') warningCount += 1;
    }
  }

  const totalBindings = checks.length;
  const pct = totalBindings > 0 ? Math.round((compatibleCount / totalBindings) * 100) : 100;
  const summary = `Checked ${totalBindings} binding(s): ${compatibleCount} compatible, ${incompatibleCount} incompatible, ${warningCount} warning(s). Compatibility rate: ${pct}%.`;

  return { totalBindings, compatibleCount, incompatibleCount, warningCount, checks, summary };
}

/** Validate a chain of bindings ensuring sequential consistency. */
export function validateBindingChain(
  chainId: string,
  bindings: ReadonlyArray<PragmaticBinding>,
): BindingChain {
  const diagnostics: BindingDiagnostic[] = [];
  let valid = true;

  // Check each binding individually
  for (const binding of bindings) {
    const requiredTypes = ROLE_COMPATIBILITY_MAP[binding.role];
    if (!requiredTypes.includes(binding.entityType)) {
      valid = false;
      diagnostics.push({
        diagnosticId: nextDiagnosticId(),
        bindingId: binding.bindingId,
        severity: 'error',
        code: 'CHAIN_BINDING_MISMATCH',
        message: `Chain "${chainId}": binding "${binding.referentLabel}" (${binding.entityType}) incompatible with role "${binding.role}".`,
        hint: `Expected one of: ${requiredTypes.join(', ')}.`,
        role: binding.role,
        entityType: binding.entityType,
      });
    }
  }

  // Check sequential consistency: source before goal, cause before result
  const roleList = bindings.map(b => b.role);
  const sourceIdx = roleList.indexOf('source');
  const goalIdx = roleList.indexOf('goal');
  if (sourceIdx >= 0 && goalIdx >= 0 && sourceIdx > goalIdx) {
    valid = false;
    const goalBinding = bindings[goalIdx];
    if (goalBinding) {
      diagnostics.push({
        diagnosticId: nextDiagnosticId(),
        bindingId: goalBinding.bindingId,
        severity: 'warning',
        code: 'CHAIN_ORDER_SOURCE_GOAL',
        message: `Chain "${chainId}": "goal" binding appears before "source" binding — unusual ordering.`,
        hint: 'Source should typically precede goal in a binding chain.',
        role: 'goal',
        entityType: goalBinding.entityType,
      });
    }
  }

  const causeIdx = roleList.indexOf('cause');
  const resultIdx = roleList.indexOf('result');
  if (causeIdx >= 0 && resultIdx >= 0 && causeIdx > resultIdx) {
    valid = false;
    const resultBinding = bindings[resultIdx];
    if (resultBinding) {
      diagnostics.push({
        diagnosticId: nextDiagnosticId(),
        bindingId: resultBinding.bindingId,
        severity: 'warning',
        code: 'CHAIN_ORDER_CAUSE_RESULT',
        message: `Chain "${chainId}": "result" binding appears before "cause" binding — unusual ordering.`,
        hint: 'Cause should typically precede result in a binding chain.',
        role: 'result',
        entityType: resultBinding.entityType,
      });
    }
  }

  // Detect duplicate roles (e.g., two agents)
  const roleCounts = new Map<SemanticRole, number>();
  for (const role of roleList) {
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  }
  for (const [role, count] of roleCounts) {
    if (count > 1 && (role === 'agent' || role === 'experiencer')) {
      valid = false;
      const firstBinding = bindings.find(b => b.role === role);
      if (firstBinding) {
        diagnostics.push({
          diagnosticId: nextDiagnosticId(),
          bindingId: firstBinding.bindingId,
          severity: 'warning',
          code: 'CHAIN_DUPLICATE_UNIQUE_ROLE',
          message: `Chain "${chainId}": role "${role}" appears ${count} times but should be unique.`,
          hint: `Only one "${role}" is expected per binding chain.`,
          role,
          entityType: firstBinding.entityType,
        });
      }
    }
  }

  return { chainId, bindings, valid, diagnostics };
}


// ============================================================================
// STEP 222 — Structured Clarification Object
// ============================================================================

/** Safety levels for clarification options. */
export type SafetyLevel = 'safe' | 'caution' | 'warning' | 'danger';

/** UI hint for how to render the clarification. */
export type ClarificationUIHint =
  | 'radio'
  | 'checkbox'
  | 'dropdown'
  | 'text-input'
  | 'slider'
  | 'toggle';

/** Category of clarification. */
export type ClarificationCategory =
  | 'scope'
  | 'entity'
  | 'amount'
  | 'target'
  | 'timing'
  | 'style'
  | 'confirmation'
  | 'preference'
  | 'safety';

/** Priority level for clarifications. */
export type ClarificationPriority = 'critical' | 'important' | 'minor' | 'cosmetic';

/** A safety note attached to a clarification or its options. */
export interface SafetyNote {
  readonly noteId: string;
  readonly level: SafetyLevel;
  readonly message: string;
  readonly appliesTo: string;
  readonly recommendation: string;
}

/** The effect that selecting a clarification option has on the CPL output. */
export interface ClarificationEffect {
  readonly effectId: string;
  readonly cplPath: string;
  readonly operation: 'set' | 'append' | 'remove' | 'replace' | 'merge';
  readonly value: string;
  readonly description: string;
}

/** A single option in a clarification object. */
export interface ClarificationOption {
  readonly optionId: string;
  readonly label: string;
  readonly description: string;
  readonly effects: ReadonlyArray<ClarificationEffect>;
  readonly safetyLevel: SafetyLevel;
  readonly isDefault: boolean;
  readonly shortcut: string;
}

/** Conditions under which a clarification expires and default is used. */
export interface ExpiryCondition {
  readonly conditionId: string;
  readonly type: 'timeout' | 'context-change' | 'superseded' | 'answered';
  readonly value: string;
  readonly description: string;
}

/** A structured clarification object. */
export interface ClarificationObject {
  readonly id: string;
  readonly question: string;
  readonly options: ReadonlyArray<ClarificationOption>;
  readonly defaultOptionId: string;
  readonly safetyNotes: ReadonlyArray<SafetyNote>;
  readonly priority: ClarificationPriority;
  readonly category: ClarificationCategory;
  readonly uiHint: ClarificationUIHint;
  readonly expiryConditions: ReadonlyArray<ExpiryCondition>;
  readonly createdAt: number;
  readonly active: boolean;
  readonly context: string;
}

/** Template for creating common clarification types. */
export interface ClarificationTemplate {
  readonly templateId: string;
  readonly name: string;
  readonly category: ClarificationCategory;
  readonly questionPattern: string;
  readonly defaultUIHint: ClarificationUIHint;
  readonly defaultPriority: ClarificationPriority;
  readonly optionPatterns: ReadonlyArray<{ label: string; descriptionPattern: string; safetyLevel: SafetyLevel }>;
  readonly safetyNotePatterns: ReadonlyArray<{ level: SafetyLevel; messagePattern: string }>;
  readonly description: string;
}

/** Serialized form of a clarification. */
export interface SerializedClarification {
  readonly version: number;
  readonly data: string;
}

// ---- 222 Template Data ----

const CLARIFICATION_TEMPLATES: ReadonlyArray<ClarificationTemplate> = [
  {
    templateId: 'ct-scope-section',
    name: 'Section Scope Disambiguation',
    category: 'scope',
    questionPattern: 'Which section should "{action}" apply to?',
    defaultUIHint: 'radio',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Just the {section}', descriptionPattern: 'Apply only to the {section}', safetyLevel: 'safe' },
      { label: 'All similar sections', descriptionPattern: 'Apply to all {section}s in the song', safetyLevel: 'caution' },
      { label: 'Entire song', descriptionPattern: 'Apply to the entire arrangement', safetyLevel: 'warning' },
    ],
    safetyNotePatterns: [
      { level: 'caution', messagePattern: 'Applying to all sections affects multiple regions.' },
    ],
    description: 'Used when scope of a section-level edit is ambiguous',
  },
  {
    templateId: 'ct-entity-disambiguation',
    name: 'Entity Disambiguation',
    category: 'entity',
    questionPattern: 'Which "{entity}" do you mean?',
    defaultUIHint: 'radio',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: '{entity_a}', descriptionPattern: 'The {entity_a} on {location_a}', safetyLevel: 'safe' },
      { label: '{entity_b}', descriptionPattern: 'The {entity_b} on {location_b}', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when multiple entities match a vague reference',
  },
  {
    templateId: 'ct-amount-vague',
    name: 'Vague Amount Clarification',
    category: 'amount',
    questionPattern: 'How much should "{parameter}" change?',
    defaultUIHint: 'slider',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'A little', descriptionPattern: 'Change by about 10-15%', safetyLevel: 'safe' },
      { label: 'Moderate', descriptionPattern: 'Change by about 25-40%', safetyLevel: 'safe' },
      { label: 'A lot', descriptionPattern: 'Change by about 50-75%', safetyLevel: 'caution' },
      { label: 'Maximum', descriptionPattern: 'Change to extreme value', safetyLevel: 'warning' },
    ],
    safetyNotePatterns: [
      { level: 'warning', messagePattern: 'Large changes may clip or distort.' },
    ],
    description: 'Used when a vague amount like "a bit" or "more" is used',
  },
  {
    templateId: 'ct-target-track',
    name: 'Target Track Selection',
    category: 'target',
    questionPattern: 'Which track should receive the change?',
    defaultUIHint: 'dropdown',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: 'Selected track', descriptionPattern: 'Apply to currently selected track', safetyLevel: 'safe' },
      { label: 'All tracks', descriptionPattern: 'Apply to every track in the project', safetyLevel: 'warning' },
    ],
    safetyNotePatterns: [
      { level: 'warning', messagePattern: 'Applying to all tracks is a large-scope change.' },
    ],
    description: 'Used when target track is ambiguous',
  },
  {
    templateId: 'ct-timing-position',
    name: 'Timing Position',
    category: 'timing',
    questionPattern: 'At what point should this happen?',
    defaultUIHint: 'radio',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Beginning', descriptionPattern: 'At the start of the region', safetyLevel: 'safe' },
      { label: 'Current position', descriptionPattern: 'At the playhead position', safetyLevel: 'safe' },
      { label: 'End', descriptionPattern: 'At the end of the region', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when temporal position is unclear',
  },
  {
    templateId: 'ct-style-genre',
    name: 'Style / Genre',
    category: 'style',
    questionPattern: 'Which style or genre should guide "{action}"?',
    defaultUIHint: 'dropdown',
    defaultPriority: 'minor',
    optionPatterns: [
      { label: 'Current genre', descriptionPattern: 'Use the project genre setting', safetyLevel: 'safe' },
      { label: 'Rock', descriptionPattern: 'Apply rock conventions', safetyLevel: 'safe' },
      { label: 'Electronic', descriptionPattern: 'Apply electronic conventions', safetyLevel: 'safe' },
      { label: 'Jazz', descriptionPattern: 'Apply jazz conventions', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when genre/style context is needed',
  },
  {
    templateId: 'ct-confirm-destructive',
    name: 'Destructive Action Confirmation',
    category: 'confirmation',
    questionPattern: 'This will {action}. Are you sure?',
    defaultUIHint: 'toggle',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: 'Yes, proceed', descriptionPattern: 'Execute the destructive action', safetyLevel: 'danger' },
      { label: 'No, cancel', descriptionPattern: 'Cancel and keep current state', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [
      { level: 'danger', messagePattern: 'This action cannot be undone.' },
    ],
    description: 'Used to confirm destructive or irreversible actions',
  },
  {
    templateId: 'ct-confirm-large-scope',
    name: 'Large Scope Confirmation',
    category: 'confirmation',
    questionPattern: 'This affects {count} items. Continue?',
    defaultUIHint: 'toggle',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Yes, apply to all', descriptionPattern: 'Apply change to all {count} items', safetyLevel: 'caution' },
      { label: 'No, narrow scope', descriptionPattern: 'Let me specify which items', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [
      { level: 'caution', messagePattern: 'Large-scope changes can have unexpected interactions.' },
    ],
    description: 'Used when an operation affects many items',
  },
  {
    templateId: 'ct-preference-default',
    name: 'Preference Default',
    category: 'preference',
    questionPattern: 'You usually choose "{default}". Use that?',
    defaultUIHint: 'toggle',
    defaultPriority: 'minor',
    optionPatterns: [
      { label: 'Yes, use default', descriptionPattern: 'Apply your usual preference', safetyLevel: 'safe' },
      { label: 'No, let me choose', descriptionPattern: 'Show me other options', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when a learned preference can be applied',
  },
  {
    templateId: 'ct-safety-clipping',
    name: 'Clipping Safety',
    category: 'safety',
    questionPattern: 'This change may cause clipping on "{target}". Proceed?',
    defaultUIHint: 'radio',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: 'Proceed anyway', descriptionPattern: 'Apply change, risk clipping', safetyLevel: 'warning' },
      { label: 'Apply with limiter', descriptionPattern: 'Add a limiter to prevent clipping', safetyLevel: 'safe' },
      { label: 'Reduce amount', descriptionPattern: 'Apply a smaller change to stay safe', safetyLevel: 'safe' },
      { label: 'Cancel', descriptionPattern: 'Do not apply this change', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [
      { level: 'warning', messagePattern: 'Clipping distorts audio and may damage speakers at high volume.' },
    ],
    description: 'Used when a gain change risks clipping',
  },
  {
    templateId: 'ct-safety-overwrite',
    name: 'Overwrite Safety',
    category: 'safety',
    questionPattern: 'This will overwrite existing content in "{target}". Proceed?',
    defaultUIHint: 'radio',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: 'Overwrite', descriptionPattern: 'Replace existing content', safetyLevel: 'danger' },
      { label: 'Merge', descriptionPattern: 'Blend new content with existing', safetyLevel: 'caution' },
      { label: 'Append', descriptionPattern: 'Add after existing content', safetyLevel: 'safe' },
      { label: 'Cancel', descriptionPattern: 'Keep existing content', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [
      { level: 'danger', messagePattern: 'Overwriting replaces content permanently.' },
    ],
    description: 'Used when an action would overwrite existing data',
  },
  {
    templateId: 'ct-scope-tracks',
    name: 'Track Scope Disambiguation',
    category: 'scope',
    questionPattern: 'Which tracks should be affected?',
    defaultUIHint: 'checkbox',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Current track', descriptionPattern: 'Only the selected track', safetyLevel: 'safe' },
      { label: 'All tracks in group', descriptionPattern: 'All tracks in the same group', safetyLevel: 'caution' },
      { label: 'All tracks', descriptionPattern: 'Every track in the project', safetyLevel: 'warning' },
    ],
    safetyNotePatterns: [
      { level: 'caution', messagePattern: 'Multi-track changes are harder to undo individually.' },
    ],
    description: 'Used when track scope is ambiguous',
  },
  {
    templateId: 'ct-entity-param',
    name: 'Parameter Disambiguation',
    category: 'entity',
    questionPattern: 'Which parameter do you mean by "{term}"?',
    defaultUIHint: 'radio',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: 'Volume', descriptionPattern: 'The track volume fader', safetyLevel: 'safe' },
      { label: 'Gain', descriptionPattern: 'The input gain', safetyLevel: 'safe' },
      { label: 'Send level', descriptionPattern: 'A send amount', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when a vague parameter reference like "level" is ambiguous',
  },
  {
    templateId: 'ct-amount-direction',
    name: 'Direction Clarification',
    category: 'amount',
    questionPattern: 'Should "{parameter}" go up or down?',
    defaultUIHint: 'radio',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Increase', descriptionPattern: 'Make it higher/louder/brighter', safetyLevel: 'safe' },
      { label: 'Decrease', descriptionPattern: 'Make it lower/quieter/darker', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when direction of change is ambiguous',
  },
  {
    templateId: 'ct-target-bus',
    name: 'Bus / Send Target',
    category: 'target',
    questionPattern: 'Which bus or send should receive this signal?',
    defaultUIHint: 'dropdown',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Master bus', descriptionPattern: 'The master output bus', safetyLevel: 'safe' },
      { label: 'Reverb send', descriptionPattern: 'The reverb auxiliary send', safetyLevel: 'safe' },
      { label: 'Delay send', descriptionPattern: 'The delay auxiliary send', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when bus/send target is ambiguous',
  },
  {
    templateId: 'ct-timing-quantize',
    name: 'Quantize Grid',
    category: 'timing',
    questionPattern: 'What quantize grid should be used?',
    defaultUIHint: 'dropdown',
    defaultPriority: 'minor',
    optionPatterns: [
      { label: '1/4 note', descriptionPattern: 'Quarter note grid', safetyLevel: 'safe' },
      { label: '1/8 note', descriptionPattern: 'Eighth note grid', safetyLevel: 'safe' },
      { label: '1/16 note', descriptionPattern: 'Sixteenth note grid', safetyLevel: 'safe' },
      { label: '1/32 note', descriptionPattern: 'Thirty-second note grid', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when quantize resolution is unspecified',
  },
  {
    templateId: 'ct-style-articulation',
    name: 'Articulation Style',
    category: 'style',
    questionPattern: 'What articulation style should be applied?',
    defaultUIHint: 'radio',
    defaultPriority: 'minor',
    optionPatterns: [
      { label: 'Legato', descriptionPattern: 'Smooth, connected notes', safetyLevel: 'safe' },
      { label: 'Staccato', descriptionPattern: 'Short, detached notes', safetyLevel: 'safe' },
      { label: 'Normal', descriptionPattern: 'Default articulation', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when articulation style is unclear',
  },
  {
    templateId: 'ct-confirm-batch',
    name: 'Batch Operation Confirmation',
    category: 'confirmation',
    questionPattern: 'Apply this to {count} selected items?',
    defaultUIHint: 'toggle',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Apply to all', descriptionPattern: 'Proceed with batch operation', safetyLevel: 'caution' },
      { label: 'Cancel', descriptionPattern: 'Cancel batch operation', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [
      { level: 'caution', messagePattern: 'Batch operations affect multiple items simultaneously.' },
    ],
    description: 'Used when confirming a batch operation',
  },
  {
    templateId: 'ct-preference-save',
    name: 'Save Preference',
    category: 'preference',
    questionPattern: 'Want to remember "{choice}" as your default for "{term}"?',
    defaultUIHint: 'toggle',
    defaultPriority: 'cosmetic',
    optionPatterns: [
      { label: 'Yes, remember', descriptionPattern: 'Save this preference for future use', safetyLevel: 'safe' },
      { label: 'No, just this time', descriptionPattern: 'Use this choice only now', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when offering to save a user preference',
  },
  {
    templateId: 'ct-safety-feedback',
    name: 'Feedback Safety',
    category: 'safety',
    questionPattern: 'This routing may create a feedback loop. Continue?',
    defaultUIHint: 'radio',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: 'Proceed with caution', descriptionPattern: 'Apply routing, monitor for feedback', safetyLevel: 'danger' },
      { label: 'Add safety limiter', descriptionPattern: 'Add feedback protection limiter', safetyLevel: 'caution' },
      { label: 'Cancel', descriptionPattern: 'Do not apply this routing', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [
      { level: 'danger', messagePattern: 'Feedback loops can cause extremely loud output and damage hearing or equipment.' },
    ],
    description: 'Used when routing may cause audio feedback',
  },
  {
    templateId: 'ct-scope-time-range',
    name: 'Time Range Scope',
    category: 'scope',
    questionPattern: 'What time range should this cover?',
    defaultUIHint: 'radio',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Selection only', descriptionPattern: 'Only the current time selection', safetyLevel: 'safe' },
      { label: 'Current section', descriptionPattern: 'The entire current section', safetyLevel: 'safe' },
      { label: 'Entire song', descriptionPattern: 'From start to finish', safetyLevel: 'caution' },
    ],
    safetyNotePatterns: [],
    description: 'Used when time range is not specified',
  },
  {
    templateId: 'ct-entity-effect',
    name: 'Effect Disambiguation',
    category: 'entity',
    questionPattern: 'Which effect do you mean?',
    defaultUIHint: 'radio',
    defaultPriority: 'critical',
    optionPatterns: [
      { label: 'Reverb', descriptionPattern: 'Reverb effect plugin', safetyLevel: 'safe' },
      { label: 'Delay', descriptionPattern: 'Delay effect plugin', safetyLevel: 'safe' },
      { label: 'Distortion', descriptionPattern: 'Distortion effect plugin', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when effect type is ambiguous',
  },
  {
    templateId: 'ct-amount-relative',
    name: 'Relative Amount',
    category: 'amount',
    questionPattern: 'How much relative to current value?',
    defaultUIHint: 'slider',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Subtle (5-10%)', descriptionPattern: 'A barely noticeable change', safetyLevel: 'safe' },
      { label: 'Noticeable (20-30%)', descriptionPattern: 'A clearly audible change', safetyLevel: 'safe' },
      { label: 'Dramatic (50%+)', descriptionPattern: 'A major change', safetyLevel: 'caution' },
    ],
    safetyNotePatterns: [],
    description: 'Used when amount is given as a vague relative term',
  },
  {
    templateId: 'ct-safety-phase',
    name: 'Phase Cancellation Warning',
    category: 'safety',
    questionPattern: 'This may cause phase cancellation on "{target}". Proceed?',
    defaultUIHint: 'radio',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Proceed', descriptionPattern: 'Apply change, accept phase risk', safetyLevel: 'caution' },
      { label: 'Flip polarity', descriptionPattern: 'Invert phase to avoid cancellation', safetyLevel: 'safe' },
      { label: 'Cancel', descriptionPattern: 'Do not apply this change', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [
      { level: 'caution', messagePattern: 'Phase cancellation can make audio sound thin or hollow.' },
    ],
    description: 'Used when an operation may cause phase issues',
  },
  {
    templateId: 'ct-target-layer',
    name: 'Layer Target',
    category: 'target',
    questionPattern: 'Which layer should this apply to?',
    defaultUIHint: 'radio',
    defaultPriority: 'important',
    optionPatterns: [
      { label: 'Top layer', descriptionPattern: 'The topmost / most recent layer', safetyLevel: 'safe' },
      { label: 'All layers', descriptionPattern: 'Every layer in the stack', safetyLevel: 'caution' },
      { label: 'Merged result', descriptionPattern: 'The merged output of all layers', safetyLevel: 'safe' },
    ],
    safetyNotePatterns: [],
    description: 'Used when layer target is ambiguous in a multi-layer context',
  },
];

// ---- 222 ID Counters ----

let _clarificationCounter = 0;
function nextClarificationId(): string {
  _clarificationCounter += 1;
  return `clr-${_clarificationCounter.toString().padStart(5, '0')}`;
}

let _optionCounter = 0;
function nextOptionId(): string {
  _optionCounter += 1;
  return `opt-${_optionCounter.toString().padStart(5, '0')}`;
}

let _effectCounter = 0;
function nextEffectId(): string {
  _effectCounter += 1;
  return `eff-${_effectCounter.toString().padStart(5, '0')}`;
}

let _safetyNoteCounter = 0;
function nextSafetyNoteId(): string {
  _safetyNoteCounter += 1;
  return `sn-${_safetyNoteCounter.toString().padStart(5, '0')}`;
}

let _expiryCounter = 0;
function nextExpiryId(): string {
  _expiryCounter += 1;
  return `exp-${_expiryCounter.toString().padStart(5, '0')}`;
}

// ---- 222 Functions ----

/** Create an expiry condition for a clarification. */
export function createExpiryCondition(
  type: ExpiryCondition['type'],
  value: string,
  description: string,
): ExpiryCondition {
  return { conditionId: nextExpiryId(), type, value, description };
}

/** Add an expiry condition to a clarification object. */
export function addExpiryCondition(
  clarification: ClarificationObject,
  condition: ExpiryCondition,
): ClarificationObject {
  return Object.assign({}, clarification, {
    expiryConditions: [...clarification.expiryConditions, condition],
  });
}

/** Create a new clarification object. */
export function createClarificationObject(
  question: string,
  category: ClarificationCategory,
  priority: ClarificationPriority,
  uiHint: ClarificationUIHint,
  context: string,
): ClarificationObject {
  return {
    id: nextClarificationId(),
    question,
    options: [],
    defaultOptionId: '',
    safetyNotes: [],
    priority,
    category,
    uiHint,
    expiryConditions: [],
    createdAt: Date.now(),
    active: true,
    context,
  };
}

/** Add an option to a clarification object. Returns a new object. */
export function addOption(
  clarification: ClarificationObject,
  label: string,
  description: string,
  effects: ReadonlyArray<ClarificationEffect>,
  safetyLevel: SafetyLevel,
): ClarificationObject {
  const newOption: ClarificationOption = {
    optionId: nextOptionId(),
    label,
    description,
    effects,
    safetyLevel,
    isDefault: clarification.options.length === 0,
    shortcut: String.fromCharCode(97 + (clarification.options.length % 26)),
  };

  const newOptions = [...clarification.options, newOption];
  const defaultId = clarification.defaultOptionId !== ''
    ? clarification.defaultOptionId
    : newOption.optionId;

  return Object.assign({}, clarification, {
    options: newOptions,
    defaultOptionId: defaultId,
  });
}

/** Set the default option by optionId. */
export function setDefault(
  clarification: ClarificationObject,
  optionId: string,
): ClarificationObject {
  const found = clarification.options.find(o => o.optionId === optionId);
  if (!found) return clarification;

  const updatedOptions = clarification.options.map(o =>
    Object.assign({}, o, { isDefault: o.optionId === optionId }),
  );

  return Object.assign({}, clarification, {
    options: updatedOptions,
    defaultOptionId: optionId,
  });
}

/** Add a safety note. */
export function addSafetyNote(
  clarification: ClarificationObject,
  level: SafetyLevel,
  message: string,
  appliesTo: string,
  recommendation: string,
): ClarificationObject {
  const note: SafetyNote = {
    noteId: nextSafetyNoteId(),
    level,
    message,
    appliesTo,
    recommendation,
  };
  return Object.assign({}, clarification, {
    safetyNotes: [...clarification.safetyNotes, note],
  });
}

/** Create a clarification effect. */
export function createEffect(
  cplPath: string,
  operation: ClarificationEffect['operation'],
  value: string,
  description: string,
): ClarificationEffect {
  return {
    effectId: nextEffectId(),
    cplPath,
    operation,
    value,
    description,
  };
}

/** Validate a clarification object for completeness and consistency. */
export function validateClarificationObject(
  clarification: ClarificationObject,
): ReadonlyArray<string> {
  const errors: string[] = [];

  if (clarification.question.trim().length === 0) {
    errors.push('Clarification must have a non-empty question.');
  }
  if (clarification.options.length === 0) {
    errors.push('Clarification must have at least one option.');
  }
  if (clarification.options.length > 0 && clarification.defaultOptionId === '') {
    errors.push('Clarification with options must have a default option.');
  }
  if (clarification.defaultOptionId !== '') {
    const defaultExists = clarification.options.some(o => o.optionId === clarification.defaultOptionId);
    if (!defaultExists) {
      errors.push(`Default option ID "${clarification.defaultOptionId}" does not match any option.`);
    }
  }

  const dangerOptions = clarification.options.filter(o => o.safetyLevel === 'danger');
  if (dangerOptions.length > 0 && clarification.safetyNotes.length === 0) {
    errors.push('Options with "danger" safety level should have at least one safety note.');
  }

  const defaultOptions = clarification.options.filter(o => o.isDefault);
  if (defaultOptions.length > 1) {
    errors.push('Only one option should be marked as default.');
  }

  const defaultOption = clarification.options.find(o => o.isDefault);
  if (defaultOption && (defaultOption.safetyLevel === 'danger' || defaultOption.safetyLevel === 'warning')) {
    errors.push('Default option should not have "danger" or "warning" safety level.');
  }

  for (const opt of clarification.options) {
    if (opt.label.trim().length === 0) {
      errors.push(`Option "${opt.optionId}" has an empty label.`);
    }
  }

  if (clarification.priority === 'critical' && clarification.uiHint === 'slider') {
    errors.push('Critical clarifications should not use slider UI — use radio or toggle for clarity.');
  }

  return errors;
}

/** Apply a user's choice to produce CPL effects. */
export function applyClarificationChoice(
  clarification: ClarificationObject,
  chosenOptionId: string,
): ReadonlyArray<ClarificationEffect> {
  const chosen = clarification.options.find(o => o.optionId === chosenOptionId);
  if (!chosen) return [];
  return chosen.effects;
}

/** Format a clarification for UI rendering. */
export function formatForUI(
  clarification: ClarificationObject,
): { question: string; options: ReadonlyArray<{ id: string; label: string; description: string; shortcut: string; isSafe: boolean }>; uiHint: ClarificationUIHint; hasDanger: boolean } {
  const options = clarification.options.map(o => ({
    id: o.optionId,
    label: o.label,
    description: o.description,
    shortcut: o.shortcut,
    isSafe: o.safetyLevel === 'safe',
  }));
  const hasDanger = clarification.options.some(o => o.safetyLevel === 'danger');
  return { question: clarification.question, options, uiHint: clarification.uiHint, hasDanger };
}

/** Serialize a clarification object to a portable string format. */
export function serializeClarification(clarification: ClarificationObject): SerializedClarification {
  return { version: 1, data: JSON.stringify(clarification) };
}

/** Deserialize a clarification from its serialized form. */
export function deserializeClarification(serialized: SerializedClarification): ClarificationObject | null {
  if (serialized.version !== 1) return null;
  try {
    const parsed: unknown = JSON.parse(serialized.data);
    if (parsed && typeof parsed === 'object' && 'id' in parsed) {
      return parsed as ClarificationObject;
    }
    return null;
  } catch {
    return null;
  }
}

/** Merge two clarification objects with non-overlapping options. */
export function mergeClarifications(
  a: ClarificationObject,
  b: ClarificationObject,
): ClarificationObject {
  const existingIds = new Set(a.options.map(o => o.optionId));
  const newOptions = b.options.filter(o => !existingIds.has(o.optionId));
  const mergedOptions = [...a.options, ...newOptions];
  const mergedNotes = [...a.safetyNotes, ...b.safetyNotes];
  const mergedExpiry = [...a.expiryConditions, ...b.expiryConditions];

  const mergedQuestion = a.question === b.question
    ? a.question
    : `${a.question} / ${b.question}`;

  const higherPriority = comparePriority(a.priority, b.priority) >= 0 ? a.priority : b.priority;

  return Object.assign({}, a, {
    question: mergedQuestion,
    options: mergedOptions,
    safetyNotes: mergedNotes,
    expiryConditions: mergedExpiry,
    priority: higherPriority,
  });
}

/** Compare priorities: returns positive if a >= b. */
function comparePriority(a: ClarificationPriority, b: ClarificationPriority): number {
  const order: Record<ClarificationPriority, number> = {
    critical: 4,
    important: 3,
    minor: 2,
    cosmetic: 1,
  };
  return order[a] - order[b];
}

/** Mark a clarification as expired. */
export function expireClarification(clarification: ClarificationObject): ClarificationObject {
  return Object.assign({}, clarification, { active: false });
}

/** Filter clarifications by category. */
export function getClarificationsByCategory(
  clarifications: ReadonlyArray<ClarificationObject>,
  category: ClarificationCategory,
): ReadonlyArray<ClarificationObject> {
  return clarifications.filter(c => c.category === category);
}

/** Look up a clarification template by ID. */
export function getTemplate(templateId: string): ClarificationTemplate | undefined {
  return CLARIFICATION_TEMPLATES.find(t => t.templateId === templateId);
}

/** Get all available templates. */
export function getAllTemplates(): ReadonlyArray<ClarificationTemplate> {
  return CLARIFICATION_TEMPLATES;
}


// ============================================================================
// STEP 223 — Clarification Minimality
// ============================================================================

/** Requirement level: how critical is this piece of information? */
export type RequirementLevel = 'hard' | 'soft' | 'cosmetic';

/** An execution requirement — something the system needs to know before acting. */
export interface ExecutionRequirement {
  readonly requirementId: string;
  readonly description: string;
  readonly level: RequirementLevel;
  readonly relatedClarificationId: string;
  readonly resolved: boolean;
  readonly defaultAvailable: boolean;
  readonly defaultValue: string;
  readonly defaultCoverage: number;
}

/** Safety threshold configuration. */
export interface SafetyThreshold {
  readonly thresholdId: string;
  readonly name: string;
  readonly maxAcceptableAmbiguity: number;
  readonly requireConfirmationAbove: SafetyLevel;
  readonly alwaysAskForDestructive: boolean;
  readonly alwaysAskForLargeScope: boolean;
  readonly largeScopeThreshold: number;
}

/** Configuration for minimality checking. */
export interface MinimalityConfig {
  readonly maxQuestionsPerTurn: number;
  readonly attentionBudget: number;
  readonly defaultCoverageThreshold: number;
  readonly skipCosmeticByDefault: boolean;
  readonly skipSoftWhenDefaultAvailable: boolean;
  readonly safetyThreshold: SafetyThreshold;
  readonly preferDefaults: boolean;
}

/** Result of a minimality check on a single clarification. */
export interface MinimalityCheck {
  readonly clarificationId: string;
  readonly necessary: boolean;
  readonly reason: string;
  readonly requirementLevel: RequirementLevel;
  readonly attentionCost: number;
  readonly canUseDefault: boolean;
  readonly suggestedDefault: string;
  readonly safetyRisk: number;
}

/** Report summarising a minimality analysis. */
export interface MinimalityReport {
  readonly totalClarifications: number;
  readonly necessaryCount: number;
  readonly skippableCount: number;
  readonly totalAttentionCost: number;
  readonly minimalAttentionCost: number;
  readonly checks: ReadonlyArray<MinimalityCheck>;
  readonly minimalSet: ReadonlyArray<string>;
  readonly summary: string;
  readonly savedQuestions: number;
}

// ---- 223 Minimality Rules ----

interface MinimalityRule {
  readonly ruleId: string;
  readonly name: string;
  readonly description: string;
  readonly applies: (check: MinimalityCheckInput) => boolean;
  readonly action: 'keep' | 'skip' | 'defer';
  readonly reason: string;
}

interface MinimalityCheckInput {
  readonly clarification: ClarificationObject;
  readonly requirement: ExecutionRequirement;
  readonly config: MinimalityConfig;
  readonly contextHints: ReadonlyArray<string>;
}

const MINIMALITY_RULES: ReadonlyArray<MinimalityRule> = [
  {
    ruleId: 'mr-001',
    name: 'Single Hard Ambiguity',
    description: 'If only one hard ambiguity exists, ask only that one.',
    applies: (input) => input.requirement.level === 'hard' && !input.requirement.resolved,
    action: 'keep',
    reason: 'Hard requirements must always be resolved.',
  },
  {
    ruleId: 'mr-002',
    name: 'Default Covers 90%+',
    description: 'If the default covers 90%+ of cases, use it silently.',
    applies: (input) => input.requirement.defaultAvailable && input.requirement.defaultCoverage >= 0.9 && input.requirement.level !== 'hard',
    action: 'skip',
    reason: 'Default covers vast majority of cases.',
  },
  {
    ruleId: 'mr-003',
    name: 'Cosmetic Skip',
    description: 'Skip cosmetic clarifications by default.',
    applies: (input) => input.requirement.level === 'cosmetic' && input.config.skipCosmeticByDefault,
    action: 'skip',
    reason: 'Cosmetic questions are skipped to minimize user burden.',
  },
  {
    ruleId: 'mr-004',
    name: 'Soft With Default Available',
    description: 'Skip soft requirements when a default is available and config allows.',
    applies: (input) => input.requirement.level === 'soft' && input.requirement.defaultAvailable && input.config.skipSoftWhenDefaultAvailable,
    action: 'skip',
    reason: 'Soft requirement has a suitable default.',
  },
  {
    ruleId: 'mr-005',
    name: 'Scope Clear From Context',
    description: 'If context hints indicate scope is already determined, skip scope questions.',
    applies: (input) => input.clarification.category === 'scope' && input.contextHints.includes('scope-determined'),
    action: 'skip',
    reason: 'Scope is already determined from context.',
  },
  {
    ruleId: 'mr-006',
    name: 'Safety Always Ask',
    description: 'Always ask safety-critical clarifications.',
    applies: (input) => input.clarification.category === 'safety' && input.clarification.priority === 'critical',
    action: 'keep',
    reason: 'Safety-critical questions must always be asked.',
  },
  {
    ruleId: 'mr-007',
    name: 'Destructive Confirmation',
    description: 'Always confirm destructive actions.',
    applies: (input) => input.clarification.category === 'confirmation' && input.config.safetyThreshold.alwaysAskForDestructive && input.clarification.options.some(o => o.safetyLevel === 'danger'),
    action: 'keep',
    reason: 'Destructive actions require explicit confirmation.',
  },
  {
    ruleId: 'mr-008',
    name: 'Large Scope Confirmation',
    description: 'Always ask for large-scope changes.',
    applies: (input) => input.config.safetyThreshold.alwaysAskForLargeScope && input.contextHints.includes('large-scope'),
    action: 'keep',
    reason: 'Large-scope changes require explicit confirmation.',
  },
  {
    ruleId: 'mr-009',
    name: 'Attention Budget Exceeded',
    description: 'Defer if asking would exceed the attention budget.',
    applies: (_input) => false, // evaluated externally after cost computation
    action: 'defer',
    reason: 'Question deferred to respect attention budget.',
  },
  {
    ruleId: 'mr-010',
    name: 'Already Answered In Session',
    description: 'Skip if the same question was already answered this session.',
    applies: (input) => input.contextHints.includes('already-answered'),
    action: 'skip',
    reason: 'Question was already answered earlier in this session.',
  },
  {
    ruleId: 'mr-011',
    name: 'User Preference Available',
    description: 'Skip if a learned user preference covers this question.',
    applies: (input) => input.contextHints.includes('preference-available'),
    action: 'skip',
    reason: 'A learned user preference resolves this question.',
  },
  {
    ruleId: 'mr-012',
    name: 'Entity Unambiguous',
    description: 'Skip entity disambiguation when only one candidate exists.',
    applies: (input) => input.clarification.category === 'entity' && input.clarification.options.length <= 1,
    action: 'skip',
    reason: 'Only one entity candidate — no ambiguity.',
  },
  {
    ruleId: 'mr-013',
    name: 'Amount Has Context Norm',
    description: 'Skip amount questions when genre norm provides a reasonable default.',
    applies: (input) => input.clarification.category === 'amount' && input.contextHints.includes('genre-norm-available'),
    action: 'skip',
    reason: 'Genre norm provides a reasonable default for amount.',
  },
  {
    ruleId: 'mr-014',
    name: 'Timing Implied By Selection',
    description: 'Skip timing questions when a time selection is active.',
    applies: (input) => input.clarification.category === 'timing' && input.contextHints.includes('time-selection-active'),
    action: 'skip',
    reason: 'Active time selection implies timing.',
  },
  {
    ruleId: 'mr-015',
    name: 'Style Matches Project',
    description: 'Skip style questions when project style is defined and matches.',
    applies: (input) => input.clarification.category === 'style' && input.contextHints.includes('project-style-set'),
    action: 'skip',
    reason: 'Project style setting covers this question.',
  },
  {
    ruleId: 'mr-016',
    name: 'Critical Priority Always Kept',
    description: 'Never skip critical-priority clarifications.',
    applies: (input) => input.clarification.priority === 'critical' && !input.requirement.resolved,
    action: 'keep',
    reason: 'Critical-priority clarifications are never skipped.',
  },
  {
    ruleId: 'mr-017',
    name: 'Target Implied By Focus',
    description: 'Skip target questions when a focused track/region is selected.',
    applies: (input) => input.clarification.category === 'target' && input.contextHints.includes('focus-target-available'),
    action: 'skip',
    reason: 'Focused target is available — no need to ask.',
  },
  {
    ruleId: 'mr-018',
    name: 'Default Too Risky',
    description: 'Keep if the default carries a safety warning or higher.',
    applies: (input) => {
      if (!input.requirement.defaultAvailable) return false;
      const defOpt = input.clarification.options.find(o => o.isDefault);
      return defOpt !== undefined && (defOpt.safetyLevel === 'warning' || defOpt.safetyLevel === 'danger');
    },
    action: 'keep',
    reason: 'Default option carries safety risk — must ask explicitly.',
  },
  {
    ruleId: 'mr-019',
    name: 'Low Coverage Default',
    description: 'Keep if default coverage is below threshold.',
    applies: (input) => input.requirement.defaultAvailable && input.requirement.defaultCoverage < input.config.defaultCoverageThreshold && input.requirement.level === 'hard',
    action: 'keep',
    reason: 'Default coverage too low for a hard requirement.',
  },
  {
    ruleId: 'mr-020',
    name: 'Preference Overridden Recently',
    description: 'Keep if the user recently overrode the applicable preference.',
    applies: (input) => input.contextHints.includes('preference-recently-overridden'),
    action: 'keep',
    reason: 'User recently overrode this preference — ask again.',
  },
];

// ---- 223 Defaults ----

const DEFAULT_SAFETY_THRESHOLD: SafetyThreshold = {
  thresholdId: 'st-default',
  name: 'Default Safety Threshold',
  maxAcceptableAmbiguity: 0.3,
  requireConfirmationAbove: 'caution',
  alwaysAskForDestructive: true,
  alwaysAskForLargeScope: true,
  largeScopeThreshold: 10,
};

const DEFAULT_MINIMALITY_CONFIG: MinimalityConfig = {
  maxQuestionsPerTurn: 3,
  attentionBudget: 100,
  defaultCoverageThreshold: 0.75,
  skipCosmeticByDefault: true,
  skipSoftWhenDefaultAvailable: true,
  safetyThreshold: DEFAULT_SAFETY_THRESHOLD,
  preferDefaults: true,
};

// ---- 223 Attention Cost Model ----

const ATTENTION_COST_BASE: Record<ClarificationUIHint, number> = {
  radio: 15,
  checkbox: 20,
  dropdown: 12,
  'text-input': 30,
  slider: 18,
  toggle: 8,
};

const ATTENTION_COST_PER_OPTION: Record<ClarificationUIHint, number> = {
  radio: 4,
  checkbox: 5,
  dropdown: 2,
  'text-input': 0,
  slider: 0,
  toggle: 0,
};

const PRIORITY_COST_MULTIPLIER: Record<ClarificationPriority, number> = {
  critical: 0.5,
  important: 0.8,
  minor: 1.2,
  cosmetic: 1.5,
};

// ---- 223 Functions ----

/** Compute the user-attention cost of asking a clarification question. */
export function computeAttentionCost(clarification: ClarificationObject): number {
  const baseCost = ATTENTION_COST_BASE[clarification.uiHint];
  const perOption = ATTENTION_COST_PER_OPTION[clarification.uiHint];
  const optionCost = perOption * clarification.options.length;
  const multiplier = PRIORITY_COST_MULTIPLIER[clarification.priority];
  const safetySurcharge = clarification.safetyNotes.length * 5;
  return Math.round((baseCost + optionCost + safetySurcharge) * multiplier);
}

/** Determine whether a specific question should be asked. */
export function shouldAskQuestion(
  clarification: ClarificationObject,
  requirement: ExecutionRequirement,
  contextHints: ReadonlyArray<string>,
  config?: MinimalityConfig,
): boolean {
  const cfg = config ?? DEFAULT_MINIMALITY_CONFIG;
  const input: MinimalityCheckInput = { clarification, requirement, config: cfg, contextHints };

  // Apply rules in order; first match wins
  for (const rule of MINIMALITY_RULES) {
    if (rule.applies(input)) {
      if (rule.action === 'skip') return false;
      if (rule.action === 'keep') return true;
      // 'defer' => treat as skip for shouldAsk
      return false;
    }
  }

  // No rule matched: ask if unresolved and hard, skip if cosmetic
  if (!requirement.resolved && requirement.level === 'hard') return true;
  if (requirement.level === 'cosmetic') return false;
  return !requirement.defaultAvailable;
}

/** Estimate safety risk of proceeding without asking a clarification (0..1). */
export function estimateSafetyRisk(
  clarification: ClarificationObject,
  requirement: ExecutionRequirement,
): number {
  let risk = 0;

  if (requirement.level === 'hard' && !requirement.resolved) risk += 0.4;
  if (clarification.priority === 'critical') risk += 0.3;
  if (clarification.category === 'safety') risk += 0.2;
  if (clarification.options.some(o => o.safetyLevel === 'danger')) risk += 0.15;
  if (clarification.options.some(o => o.safetyLevel === 'warning')) risk += 0.08;
  if (!requirement.defaultAvailable) risk += 0.1;

  const defaultOption = clarification.options.find(o => o.isDefault);
  if (defaultOption && (defaultOption.safetyLevel === 'danger' || defaultOption.safetyLevel === 'warning')) {
    risk += 0.15;
  }

  return Math.min(1.0, Math.round(risk * 100) / 100);
}

/** Get execution requirements from a set of clarifications. */
export function getExecutionRequirements(
  clarifications: ReadonlyArray<ClarificationObject>,
): ReadonlyArray<ExecutionRequirement> {
  return clarifications.map((c, idx) => {
    const level: RequirementLevel = c.priority === 'critical'
      ? 'hard'
      : c.priority === 'important'
        ? 'soft'
        : 'cosmetic';

    const defaultOption = c.options.find(o => o.isDefault);
    const defaultAvailable = defaultOption !== undefined;
    const defaultSafe = defaultOption !== undefined && (defaultOption.safetyLevel === 'safe' || defaultOption.safetyLevel === 'caution');
    const defaultCoverage = defaultAvailable && defaultSafe ? 0.85 : defaultAvailable ? 0.5 : 0;

    return {
      requirementId: `req-${(idx + 1).toString().padStart(4, '0')}`,
      description: c.question,
      level,
      relatedClarificationId: c.id,
      resolved: false,
      defaultAvailable,
      defaultValue: defaultOption ? defaultOption.label : '',
      defaultCoverage,
    };
  });
}

/** Check minimality of a single clarification. */
export function checkMinimality(
  clarification: ClarificationObject,
  requirement: ExecutionRequirement,
  contextHints: ReadonlyArray<string>,
  config?: MinimalityConfig,
): MinimalityCheck {
  const cfg = config ?? DEFAULT_MINIMALITY_CONFIG;
  const necessary = shouldAskQuestion(clarification, requirement, contextHints, cfg);
  const cost = computeAttentionCost(clarification);
  const safetyRisk = estimateSafetyRisk(clarification, requirement);

  let reason = 'No specific rule matched; using defaults.';
  const input: MinimalityCheckInput = { clarification, requirement, config: cfg, contextHints };
  for (const rule of MINIMALITY_RULES) {
    if (rule.applies(input)) {
      reason = rule.reason;
      break;
    }
  }

  return {
    clarificationId: clarification.id,
    necessary,
    reason,
    requirementLevel: requirement.level,
    attentionCost: cost,
    canUseDefault: requirement.defaultAvailable,
    suggestedDefault: requirement.defaultValue,
    safetyRisk,
  };
}

/** Determine if a given set of clarifications is already minimal. */
export function isMinimalSet(
  clarifications: ReadonlyArray<ClarificationObject>,
  requirements: ReadonlyArray<ExecutionRequirement>,
  contextHints: ReadonlyArray<string>,
  config?: MinimalityConfig,
): boolean {
  const cfg = config ?? DEFAULT_MINIMALITY_CONFIG;
  for (let i = 0; i < clarifications.length; i++) {
    const clr = clarifications[i];
    const req = requirements[i];
    if (!clr || !req) continue;
    const needed = shouldAskQuestion(clr, req, contextHints, cfg);
    if (!needed) return false;
  }
  return true;
}

/** Filter a list of clarifications to the minimal set that must be asked. */
export function filterToMinimal(
  clarifications: ReadonlyArray<ClarificationObject>,
  requirements: ReadonlyArray<ExecutionRequirement>,
  contextHints: ReadonlyArray<string>,
  config?: MinimalityConfig,
): ReadonlyArray<ClarificationObject> {
  const cfg = config ?? DEFAULT_MINIMALITY_CONFIG;
  const result: ClarificationObject[] = [];
  let budgetRemaining = cfg.attentionBudget;

  // Pair and sort by priority
  const paired = clarifications.map((c, i) => ({
    clarification: c,
    requirement: requirements[i],
  }));

  paired.sort((a, b) => {
    const pa = comparePriority(a.clarification.priority, b.clarification.priority);
    return -pa; // higher priority first
  });

  for (const item of paired) {
    if (!item.requirement) continue;
    const needed = shouldAskQuestion(item.clarification, item.requirement, contextHints, cfg);
    if (!needed) continue;

    const cost = computeAttentionCost(item.clarification);
    if (budgetRemaining - cost < 0 && result.length >= 1) {
      // Would exceed budget and we have at least one question
      continue;
    }

    result.push(item.clarification);
    budgetRemaining -= cost;

    if (result.length >= cfg.maxQuestionsPerTurn) break;
  }

  return result;
}

/** Prioritize clarifications by necessity: hard first, then soft, then cosmetic. */
export function prioritizeByNecessity(
  clarifications: ReadonlyArray<ClarificationObject>,
  requirements: ReadonlyArray<ExecutionRequirement>,
): ReadonlyArray<ClarificationObject> {
  const paired = clarifications.map((c, i) => ({
    clarification: c,
    requirement: requirements[i],
  }));

  const levelOrder: Record<RequirementLevel, number> = { hard: 0, soft: 1, cosmetic: 2 };

  paired.sort((a, b) => {
    const la = a.requirement ? levelOrder[a.requirement.level] : 2;
    const lb = b.requirement ? levelOrder[b.requirement.level] : 2;
    if (la !== lb) return la - lb;
    return comparePriority(b.clarification.priority, a.clarification.priority);
  });

  return paired.map(p => p.clarification);
}

/** Determine if we can execute with defaults (no questions at all). */
export function canExecuteWithDefaults(
  clarifications: ReadonlyArray<ClarificationObject>,
  requirements: ReadonlyArray<ExecutionRequirement>,
  contextHints: ReadonlyArray<string>,
  config?: MinimalityConfig,
): boolean {
  const cfg = config ?? DEFAULT_MINIMALITY_CONFIG;
  for (let i = 0; i < clarifications.length; i++) {
    const clr = clarifications[i];
    const req = requirements[i];
    if (!clr || !req) continue;
    if (shouldAskQuestion(clr, req, contextHints, cfg)) return false;
  }
  return true;
}

/** Get the minimal question set with full analysis. */
export function getMinimalQuestionSet(
  clarifications: ReadonlyArray<ClarificationObject>,
  requirements: ReadonlyArray<ExecutionRequirement>,
  contextHints: ReadonlyArray<string>,
  config?: MinimalityConfig,
): ReadonlyArray<MinimalityCheck> {
  const cfg = config ?? DEFAULT_MINIMALITY_CONFIG;
  return clarifications.map((c, i) => {
    const req = requirements[i];
    if (!req) {
      return {
        clarificationId: c.id,
        necessary: false,
        reason: 'No matching requirement found.',
        requirementLevel: 'cosmetic' as RequirementLevel,
        attentionCost: computeAttentionCost(c),
        canUseDefault: false,
        suggestedDefault: '',
        safetyRisk: 0,
      };
    }
    return checkMinimality(c, req, contextHints, cfg);
  });
}

/** Suggest defaults for skippable clarifications. */
export function suggestDefaultsForSkippable(
  checks: ReadonlyArray<MinimalityCheck>,
): ReadonlyArray<{ clarificationId: string; suggestedDefault: string }> {
  return checks
    .filter(ch => !ch.necessary && ch.canUseDefault)
    .map(ch => ({
      clarificationId: ch.clarificationId,
      suggestedDefault: ch.suggestedDefault,
    }));
}

/** Format a minimality report from a set of checks. */
export function formatMinimalityReport(checks: ReadonlyArray<MinimalityCheck>): MinimalityReport {
  const totalClarifications = checks.length;
  const necessaryCount = checks.filter(c => c.necessary).length;
  const skippableCount = totalClarifications - necessaryCount;
  const totalAttentionCost = checks.reduce((acc, c) => acc + c.attentionCost, 0);
  const minimalAttentionCost = checks.filter(c => c.necessary).reduce((acc, c) => acc + c.attentionCost, 0);
  const minimalSet = checks.filter(c => c.necessary).map(c => c.clarificationId);
  const savedQuestions = skippableCount;
  const summary = `Minimality analysis: ${necessaryCount} necessary, ${skippableCount} skippable out of ${totalClarifications}. ` +
    `Total attention cost: ${totalAttentionCost}, minimal cost: ${minimalAttentionCost}. Saved ${savedQuestions} question(s).`;

  return {
    totalClarifications,
    necessaryCount,
    skippableCount,
    totalAttentionCost,
    minimalAttentionCost,
    checks,
    minimalSet,
    summary,
    savedQuestions,
  };
}


// ============================================================================
// STEP 224 — Clarification Batching
// ============================================================================

/** Strategy for how clarifications are batched. */
export type BatchStrategyKind =
  | 'group-by-scope'
  | 'group-by-type'
  | 'group-by-dependency'
  | 'group-by-priority'
  | 'sequential'
  | 'parallel'
  | 'mixed';

/** Configuration for batch processing. */
export interface BatchConfig {
  readonly maxBatchSize: number;
  readonly maxBatches: number;
  readonly allowCrossCategoryBatching: boolean;
  readonly preferParallel: boolean;
  readonly respectDependencies: boolean;
  readonly priorityCriticalFirst: boolean;
  readonly groupingPreference: BatchStrategyKind;
}

/** A batching rule that controls how clarifications are grouped. */
export interface BatchingRule {
  readonly ruleId: string;
  readonly name: string;
  readonly description: string;
  readonly priority: number;
  readonly condition: (a: ClarificationObject, b: ClarificationObject) => boolean;
  readonly groupKey: (c: ClarificationObject) => string;
  readonly strategyKind: BatchStrategyKind;
}

/** A dependency between two clarifications. */
export interface ClarificationDependency {
  readonly fromId: string;
  readonly toId: string;
  readonly type: 'answer-affects-options' | 'answer-affects-relevance' | 'sequential-only' | 'mutual';
  readonly description: string;
}

/** A group of clarifications that can be presented together. */
export interface BatchGroup {
  readonly groupId: string;
  readonly label: string;
  readonly clarifications: ReadonlyArray<ClarificationObject>;
  readonly strategy: BatchStrategyKind;
  readonly dependencies: ReadonlyArray<ClarificationDependency>;
  readonly estimatedAttentionCost: number;
  readonly priority: ClarificationPriority;
}

/** Result of a batching operation. */
export interface BatchResult {
  readonly batches: ReadonlyArray<BatchGroup>;
  readonly unbatched: ReadonlyArray<ClarificationObject>;
  readonly totalBatches: number;
  readonly totalClarifications: number;
  readonly efficiency: number;
  readonly summary: string;
}

/** Presentation-ready batch for UI. */
export interface BatchForUI {
  readonly groupId: string;
  readonly title: string;
  readonly questions: ReadonlyArray<{
    id: string;
    question: string;
    uiHint: ClarificationUIHint;
    options: ReadonlyArray<{ id: string; label: string; description: string; isSafe: boolean }>;
  }>;
  readonly safetyWarnings: ReadonlyArray<string>;
  readonly isSequential: boolean;
}

/** A batching strategy combining multiple rules. */
export interface ClarificationBatchStrategy {
  readonly strategyId: string;
  readonly name: string;
  readonly rules: ReadonlyArray<BatchingRule>;
  readonly config: BatchConfig;
  readonly description: string;
}

// ---- 224 Batching Rules Data ----

let _batchGroupCounter = 0;
function nextBatchGroupId(): string {
  _batchGroupCounter += 1;
  return `bg-${_batchGroupCounter.toString().padStart(4, '0')}`;
}

const BATCHING_RULES: ReadonlyArray<BatchingRule> = [
  {
    ruleId: 'br-001',
    name: 'Same Scope Category',
    description: 'Group clarifications about the same scope together.',
    priority: 10,
    condition: (a, b) => a.category === 'scope' && b.category === 'scope',
    groupKey: (c) => `scope-${c.category}`,
    strategyKind: 'group-by-scope',
  },
  {
    ruleId: 'br-002',
    name: 'Same Entity Category',
    description: 'Group entity disambiguations together.',
    priority: 9,
    condition: (a, b) => a.category === 'entity' && b.category === 'entity',
    groupKey: (c) => `entity-${c.category}`,
    strategyKind: 'group-by-type',
  },
  {
    ruleId: 'br-003',
    name: 'Same Amount Category',
    description: 'Group amount clarifications together.',
    priority: 7,
    condition: (a, b) => a.category === 'amount' && b.category === 'amount',
    groupKey: (c) => `amount-${c.category}`,
    strategyKind: 'group-by-type',
  },
  {
    ruleId: 'br-004',
    name: 'Critical Priority First',
    description: 'Always present critical clarifications first.',
    priority: 15,
    condition: (a, _b) => a.priority === 'critical',
    groupKey: (c) => `priority-${c.priority}`,
    strategyKind: 'group-by-priority',
  },
  {
    ruleId: 'br-005',
    name: 'Safety Together',
    description: 'Group all safety-related clarifications together.',
    priority: 14,
    condition: (a, b) => a.category === 'safety' && b.category === 'safety',
    groupKey: (c) => `safety-${c.category}`,
    strategyKind: 'group-by-type',
  },
  {
    ruleId: 'br-006',
    name: 'Confirmation Together',
    description: 'Group confirmation prompts together.',
    priority: 8,
    condition: (a, b) => a.category === 'confirmation' && b.category === 'confirmation',
    groupKey: (c) => `confirm-${c.category}`,
    strategyKind: 'group-by-type',
  },
  {
    ruleId: 'br-007',
    name: 'Target Disambiguation',
    description: 'Group target-related clarifications.',
    priority: 8,
    condition: (a, b) => a.category === 'target' && b.category === 'target',
    groupKey: (c) => `target-${c.category}`,
    strategyKind: 'group-by-scope',
  },
  {
    ruleId: 'br-008',
    name: 'Timing Together',
    description: 'Group timing-related clarifications.',
    priority: 6,
    condition: (a, b) => a.category === 'timing' && b.category === 'timing',
    groupKey: (c) => `timing-${c.category}`,
    strategyKind: 'group-by-type',
  },
  {
    ruleId: 'br-009',
    name: 'Style / Preference Together',
    description: 'Group style and preference clarifications.',
    priority: 4,
    condition: (a, b) =>
      (a.category === 'style' || a.category === 'preference') &&
      (b.category === 'style' || b.category === 'preference'),
    groupKey: (c) => `style-pref-${c.category}`,
    strategyKind: 'group-by-type',
  },
  {
    ruleId: 'br-010',
    name: 'Same Context Token',
    description: 'Group clarifications that share the same context substring.',
    priority: 5,
    condition: (a, b) => {
      const aCtx = a.context.toLowerCase();
      const bCtx = b.context.toLowerCase();
      if (aCtx.length === 0 || bCtx.length === 0) return false;
      return aCtx.includes(bCtx) || bCtx.includes(aCtx);
    },
    groupKey: (c) => `ctx-${c.context.toLowerCase().slice(0, 20)}`,
    strategyKind: 'group-by-scope',
  },
  {
    ruleId: 'br-011',
    name: 'Dependent Sequential',
    description: 'Force sequential presentation when dependencies exist.',
    priority: 12,
    condition: (_a, _b) => false, // evaluated by dependency analysis
    groupKey: (_c) => 'dep-sequential',
    strategyKind: 'group-by-dependency',
  },
  {
    ruleId: 'br-012',
    name: 'UI Hint Compatible',
    description: 'Group clarifications with the same UI hint for consistent rendering.',
    priority: 3,
    condition: (a, b) => a.uiHint === b.uiHint,
    groupKey: (c) => `ui-${c.uiHint}`,
    strategyKind: 'group-by-type',
  },
  {
    ruleId: 'br-013',
    name: 'Danger Options Isolated',
    description: 'Isolate clarifications with danger-level options into their own batch.',
    priority: 13,
    condition: (a, _b) => a.options.some(o => o.safetyLevel === 'danger'),
    groupKey: (c) => c.options.some(o => o.safetyLevel === 'danger') ? `danger-${c.id}` : `no-danger-${c.id}`,
    strategyKind: 'group-by-priority',
  },
  {
    ruleId: 'br-014',
    name: 'Small Batch Preference',
    description: 'Prefer batches of 2-4 items for cognitive manageability.',
    priority: 2,
    condition: (_a, _b) => true, // always applicable, used as tiebreaker
    groupKey: (_c) => 'general',
    strategyKind: 'parallel',
  },
  {
    ruleId: 'br-015',
    name: 'Cross-Category Merge',
    description: 'Allow merging across categories if both are low-priority.',
    priority: 1,
    condition: (a, b) =>
      (a.priority === 'minor' || a.priority === 'cosmetic') &&
      (b.priority === 'minor' || b.priority === 'cosmetic'),
    groupKey: (c) => `low-pri-${c.priority}`,
    strategyKind: 'mixed',
  },
];

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 5,
  maxBatches: 4,
  allowCrossCategoryBatching: false,
  preferParallel: true,
  respectDependencies: true,
  priorityCriticalFirst: true,
  groupingPreference: 'group-by-scope',
};

// ---- 224 Functions ----

/** Detect dependencies between clarifications. */
export function detectDependencies(
  clarifications: ReadonlyArray<ClarificationObject>,
): ReadonlyArray<ClarificationDependency> {
  const deps: ClarificationDependency[] = [];

  for (let i = 0; i < clarifications.length; i++) {
    const a = clarifications[i];
    if (!a) continue;
    for (let j = i + 1; j < clarifications.length; j++) {
      const b = clarifications[j];
      if (!b) continue;

      // Scope affects entity: if scope narrows, entity options may change
      if (a.category === 'scope' && b.category === 'entity') {
        deps.push({
          fromId: a.id,
          toId: b.id,
          type: 'answer-affects-options',
          description: `Scope "${a.question}" affects entity options in "${b.question}"`,
        });
      }
      if (b.category === 'scope' && a.category === 'entity') {
        deps.push({
          fromId: b.id,
          toId: a.id,
          type: 'answer-affects-options',
          description: `Scope "${b.question}" affects entity options in "${a.question}"`,
        });
      }

      // Target affects amount: if target changes, amount range may differ
      if (a.category === 'target' && b.category === 'amount') {
        deps.push({
          fromId: a.id,
          toId: b.id,
          type: 'answer-affects-options',
          description: `Target "${a.question}" affects amount range in "${b.question}"`,
        });
      }
      if (b.category === 'target' && a.category === 'amount') {
        deps.push({
          fromId: b.id,
          toId: a.id,
          type: 'answer-affects-options',
          description: `Target "${b.question}" affects amount range in "${a.question}"`,
        });
      }

      // Confirmation depends on everything else being resolved
      if (b.category === 'confirmation' && a.category !== 'confirmation') {
        deps.push({
          fromId: a.id,
          toId: b.id,
          type: 'answer-affects-relevance',
          description: `Confirmation "${b.question}" depends on resolution of "${a.question}"`,
        });
      }
      if (a.category === 'confirmation' && b.category !== 'confirmation') {
        deps.push({
          fromId: b.id,
          toId: a.id,
          type: 'answer-affects-relevance',
          description: `Confirmation "${a.question}" depends on resolution of "${b.question}"`,
        });
      }

      // Entity disambiguation may be mutual
      if (a.category === 'entity' && b.category === 'entity' && a.context === b.context) {
        deps.push({
          fromId: a.id,
          toId: b.id,
          type: 'mutual',
          description: `Entity questions "${a.question}" and "${b.question}" share context and may be mutually dependent`,
        });
      }

      // Timing affects scope
      if (a.category === 'timing' && b.category === 'scope') {
        deps.push({
          fromId: a.id,
          toId: b.id,
          type: 'answer-affects-options',
          description: `Timing "${a.question}" constrains scope in "${b.question}"`,
        });
      }
      if (b.category === 'timing' && a.category === 'scope') {
        deps.push({
          fromId: b.id,
          toId: a.id,
          type: 'answer-affects-options',
          description: `Timing "${b.question}" constrains scope in "${a.question}"`,
        });
      }
    }
  }

  return deps;
}

/** Group clarifications by scope (same section / same region). */
export function groupByScope(
  clarifications: ReadonlyArray<ClarificationObject>,
): ReadonlyArray<ReadonlyArray<ClarificationObject>> {
  const groups = new Map<string, ClarificationObject[]>();

  for (const c of clarifications) {
    const key = c.context.length > 0 ? c.context.toLowerCase() : `singleton-${c.id}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(c);
    } else {
      groups.set(key, [c]);
    }
  }

  return Array.from(groups.values());
}

/** Group clarifications by category type. */
export function groupByType(
  clarifications: ReadonlyArray<ClarificationObject>,
): ReadonlyArray<ReadonlyArray<ClarificationObject>> {
  const groups = new Map<ClarificationCategory, ClarificationObject[]>();

  for (const c of clarifications) {
    const existing = groups.get(c.category);
    if (existing) {
      existing.push(c);
    } else {
      groups.set(c.category, [c]);
    }
  }

  return Array.from(groups.values());
}

/** Check if two clarifications can be batched together. */
export function isBatchable(
  a: ClarificationObject,
  b: ClarificationObject,
  dependencies: ReadonlyArray<ClarificationDependency>,
  config?: BatchConfig,
): boolean {
  const cfg = config ?? DEFAULT_BATCH_CONFIG;

  // Cannot batch if one depends on the other with answer-affects-options
  if (cfg.respectDependencies) {
    const hasBlockingDep = dependencies.some(d =>
      ((d.fromId === a.id && d.toId === b.id) || (d.fromId === b.id && d.toId === a.id)) &&
      d.type === 'answer-affects-options',
    );
    if (hasBlockingDep) return false;
  }

  // Cannot batch across categories unless config allows
  if (!cfg.allowCrossCategoryBatching && a.category !== b.category) {
    return false;
  }

  // Cannot batch danger-level items with non-danger items
  const aDanger = a.options.some(o => o.safetyLevel === 'danger');
  const bDanger = b.options.some(o => o.safetyLevel === 'danger');
  if (aDanger !== bDanger) return false;

  return true;
}

/** Split dependent questions into sequential groups. */
export function splitDependentQuestions(
  clarifications: ReadonlyArray<ClarificationObject>,
  dependencies: ReadonlyArray<ClarificationDependency>,
): ReadonlyArray<ReadonlyArray<ClarificationObject>> {
  if (clarifications.length === 0) return [];
  if (dependencies.length === 0) return [clarifications];

  // Build adjacency list for topological ordering
  const idToClr = new Map<string, ClarificationObject>();
  for (const c of clarifications) {
    idToClr.set(c.id, c);
  }

  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();
  for (const c of clarifications) {
    inDegree.set(c.id, 0);
    outEdges.set(c.id, []);
  }

  for (const dep of dependencies) {
    if (!idToClr.has(dep.fromId) || !idToClr.has(dep.toId)) continue;
    if (dep.type === 'answer-affects-options' || dep.type === 'answer-affects-relevance') {
      const edges = outEdges.get(dep.fromId);
      if (edges) edges.push(dep.toId);
      inDegree.set(dep.toId, (inDegree.get(dep.toId) ?? 0) + 1);
    }
  }

  // Kahn's algorithm for topological sort, grouping by level
  const levels: ClarificationObject[][] = [];
  const queue: string[] = [];

  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const currentLevel: ClarificationObject[] = [];
    const nextQueue: string[] = [];

    for (const id of queue) {
      const clr = idToClr.get(id);
      if (clr) currentLevel.push(clr);
      const edges = outEdges.get(id);
      if (edges) {
        for (const toId of edges) {
          const newDeg = (inDegree.get(toId) ?? 1) - 1;
          inDegree.set(toId, newDeg);
          if (newDeg === 0) nextQueue.push(toId);
        }
      }
    }

    if (currentLevel.length > 0) levels.push(currentLevel);
    queue.length = 0;
    for (const item of nextQueue) queue.push(item);
  }

  // Add any remaining (cyclic) clarifications to a final level
  const placed = new Set(levels.flat().map(c => c.id));
  const remaining = clarifications.filter(c => !placed.has(c.id));
  if (remaining.length > 0) levels.push([...remaining]);

  return levels;
}

/** Order batches: critical first, then important, then by topic. */
export function orderBatches(
  batches: ReadonlyArray<BatchGroup>,
): ReadonlyArray<BatchGroup> {
  const priorityOrder: Record<ClarificationPriority, number> = {
    critical: 0,
    important: 1,
    minor: 2,
    cosmetic: 3,
  };

  const sorted = [...batches];
  sorted.sort((a, b) => {
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    // Within same priority, prefer smaller batches (easier to process)
    return a.clarifications.length - b.clarifications.length;
  });

  return sorted;
}

/** Main batching function: organize clarifications into presentation groups. */
export function batchClarifications(
  clarifications: ReadonlyArray<ClarificationObject>,
  config?: BatchConfig,
): BatchResult {
  const cfg = config ?? DEFAULT_BATCH_CONFIG;

  if (clarifications.length === 0) {
    return {
      batches: [],
      unbatched: [],
      totalBatches: 0,
      totalClarifications: 0,
      efficiency: 1.0,
      summary: 'No clarifications to batch.',
    };
  }

  const dependencies = detectDependencies(clarifications);

  // Split by dependency levels first
  const depLevels = splitDependentQuestions(clarifications, dependencies);

  const allBatches: BatchGroup[] = [];
  const unbatched: ClarificationObject[] = [];

  for (const level of depLevels) {
    // Within each dependency level, group by category
    const categoryGroups = groupByType(level);

    for (const group of categoryGroups) {
      if (group.length === 0) continue;

      // Subdivide into batches respecting maxBatchSize
      for (let start = 0; start < group.length; start += cfg.maxBatchSize) {
        const slice = group.slice(start, start + cfg.maxBatchSize);
        if (slice.length === 0) continue;

        const firstItem = slice[0];
        if (!firstItem) continue;

        const groupDeps = dependencies.filter(d =>
          slice.some(c => c.id === d.fromId || c.id === d.toId),
        );

        const highestPriority = slice.reduce<ClarificationPriority>((best, c) => {
          return comparePriority(c.priority, best) > 0 ? c.priority : best;
        }, 'cosmetic');

        const totalCost = slice.reduce((acc, c) => acc + computeAttentionCost(c), 0);

        const batchGroup: BatchGroup = {
          groupId: nextBatchGroupId(),
          label: `${firstItem.category} clarifications`,
          clarifications: slice,
          strategy: cfg.groupingPreference,
          dependencies: groupDeps,
          estimatedAttentionCost: totalCost,
          priority: highestPriority,
        };

        if (allBatches.length < cfg.maxBatches) {
          allBatches.push(batchGroup);
        } else {
          for (const c of slice) unbatched.push(c);
        }
      }
    }
  }

  const orderedBatches = orderBatches(allBatches);
  const totalClarifications = clarifications.length;
  const batchedCount = orderedBatches.reduce((acc, b) => acc + b.clarifications.length, 0);
  const efficiency = totalClarifications > 0
    ? Math.round((batchedCount / totalClarifications) * 100) / 100
    : 1.0;

  const summary = `Batched ${batchedCount} of ${totalClarifications} clarification(s) into ${orderedBatches.length} batch(es). ` +
    `${unbatched.length} unbatched. Efficiency: ${(efficiency * 100).toFixed(0)}%.`;

  return {
    batches: orderedBatches,
    unbatched,
    totalBatches: orderedBatches.length,
    totalClarifications,
    efficiency,
    summary,
  };
}

/** Format a batch group for UI presentation. */
export function formatBatchForUI(batch: BatchGroup): BatchForUI {
  const questions = batch.clarifications.map(c => ({
    id: c.id,
    question: c.question,
    uiHint: c.uiHint,
    options: c.options.map(o => ({
      id: o.optionId,
      label: o.label,
      description: o.description,
      isSafe: o.safetyLevel === 'safe',
    })),
  }));

  const safetyWarnings: string[] = [];
  for (const c of batch.clarifications) {
    for (const n of c.safetyNotes) {
      safetyWarnings.push(`[${n.level.toUpperCase()}] ${n.message}`);
    }
  }

  const isSequential = batch.dependencies.some(
    d => d.type === 'answer-affects-options' || d.type === 'answer-affects-relevance',
  );

  return {
    groupId: batch.groupId,
    title: batch.label,
    questions,
    safetyWarnings,
    isSequential,
  };
}

/** Apply answers to a batch of clarifications. */
export function applyBatchAnswers(
  batch: BatchGroup,
  answers: ReadonlyArray<{ clarificationId: string; chosenOptionId: string }>,
): ReadonlyArray<{ clarificationId: string; effects: ReadonlyArray<ClarificationEffect> }> {
  const results: { clarificationId: string; effects: ReadonlyArray<ClarificationEffect> }[] = [];

  for (const answer of answers) {
    const clr = batch.clarifications.find(c => c.id === answer.clarificationId);
    if (!clr) continue;
    const effects = applyClarificationChoice(clr, answer.chosenOptionId);
    results.push({ clarificationId: answer.clarificationId, effects });
  }

  return results;
}

/** Compute efficiency of a batch result. */
export function computeBatchEfficiency(result: BatchResult): {
  questionsPerBatch: number;
  attentionSaved: number;
  batchRatio: number;
} {
  const totalInBatches = result.batches.reduce((acc, b) => acc + b.clarifications.length, 0);
  const questionsPerBatch = result.totalBatches > 0
    ? Math.round((totalInBatches / result.totalBatches) * 10) / 10
    : 0;

  // Attention saved: overhead of asking individually vs. batched
  const overheadPerQuestion = 10; // cognitive switch cost
  const individualCost = result.totalClarifications * overheadPerQuestion;
  const batchedCost = result.totalBatches * overheadPerQuestion;
  const attentionSaved = Math.max(0, individualCost - batchedCost);

  const batchRatio = result.totalClarifications > 0
    ? Math.round((result.totalBatches / result.totalClarifications) * 100) / 100
    : 1.0;

  return { questionsPerBatch, attentionSaved, batchRatio };
}

/** Get all batching rules. */
export function getBatchingRules(): ReadonlyArray<BatchingRule> {
  return BATCHING_RULES;
}

/** Optimize batch order for minimal context-switching. */
export function optimizeBatchOrder(
  batches: ReadonlyArray<BatchGroup>,
): ReadonlyArray<BatchGroup> {
  // Group adjacent batches with same category
  const sorted = [...batches];

  // First pass: order by priority
  sorted.sort((a, b) => {
    const priorityOrder: Record<ClarificationPriority, number> = {
      critical: 0,
      important: 1,
      minor: 2,
      cosmetic: 3,
    };
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;

    // Same priority: group same categories together
    const catA = a.clarifications.length > 0 ? (a.clarifications[0]?.category ?? '') : '';
    const catB = b.clarifications.length > 0 ? (b.clarifications[0]?.category ?? '') : '';
    return catA.localeCompare(catB);
  });

  return sorted;
}


// ============================================================================
// STEP 225 — User Preference Learning
// ============================================================================

/** Source of a learned preference. */
export type PreferenceSource =
  | 'explicit'
  | 'implicit'
  | 'calibration'
  | 'import'
  | 'default';

/** Type of preference being learned. */
export type PreferenceType =
  | 'term-mapping'
  | 'default-scope'
  | 'default-amount'
  | 'behavior'
  | 'vocabulary';

/** Confidence level for a preference. */
export interface PreferenceConfidence {
  readonly level: number;
  readonly source: PreferenceSource;
  readonly observations: number;
  readonly lastConfirmed: number;
  readonly decayRate: number;
}

/** A single learned preference. */
export interface LearnedPreference {
  readonly preferenceId: string;
  readonly type: PreferenceType;
  readonly key: string;
  readonly value: string;
  readonly description: string;
  readonly source: PreferenceSource;
  readonly confidence: PreferenceConfidence;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly active: boolean;
  readonly scope: string;
  readonly tags: ReadonlyArray<string>;
}

/** A record of a preference being applied. */
export interface PreferenceApplication {
  readonly applicationId: string;
  readonly preferenceId: string;
  readonly appliedAt: number;
  readonly context: string;
  readonly provenanceMessage: string;
  readonly wasOverridden: boolean;
}

/** History of preference operations. */
export interface PreferenceHistory {
  readonly preferenceId: string;
  readonly events: ReadonlyArray<PreferenceHistoryEvent>;
}

/** A single event in preference history. */
export interface PreferenceHistoryEvent {
  readonly eventId: string;
  readonly type: 'created' | 'updated' | 'applied' | 'overridden' | 'reset' | 'imported' | 'expired';
  readonly timestamp: number;
  readonly details: string;
  readonly previousValue: string;
  readonly newValue: string;
}

/** A conflict between two preferences. */
export interface PreferenceConflict {
  readonly conflictId: string;
  readonly preferenceA: LearnedPreference;
  readonly preferenceB: LearnedPreference;
  readonly conflictType: 'contradictory' | 'overlapping' | 'ambiguous';
  readonly resolution: 'a-wins' | 'b-wins' | 'merge' | 'unresolved';
  readonly reason: string;
}

/** A detected learning opportunity. */
export interface LearningOpportunity {
  readonly opportunityId: string;
  readonly type: PreferenceType;
  readonly key: string;
  readonly proposedValue: string;
  readonly context: string;
  readonly confidence: number;
  readonly prompt: string;
}

/** Calibration suggestion for preferences. */
export interface CalibrationSuggestion {
  readonly suggestionId: string;
  readonly preferenceId: string;
  readonly currentValue: string;
  readonly suggestedPrompt: string;
  readonly reason: string;
}

/** The preference learner that manages all preferences. */
export interface PreferenceLearner {
  readonly preferences: ReadonlyArray<LearnedPreference>;
  readonly history: ReadonlyArray<PreferenceHistory>;
  readonly applications: ReadonlyArray<PreferenceApplication>;
}

/** Serialized preferences for export/import. */
export interface SerializedPreferences {
  readonly version: number;
  readonly exportedAt: number;
  readonly preferences: ReadonlyArray<LearnedPreference>;
}

// ---- 225 ID Counters ----

let _preferenceCounter = 0;
function nextPreferenceId(): string {
  _preferenceCounter += 1;
  return `pref-${_preferenceCounter.toString().padStart(5, '0')}`;
}

let _applicationCounter = 0;
function nextApplicationId(): string {
  _applicationCounter += 1;
  return `app-${_applicationCounter.toString().padStart(5, '0')}`;
}

let _opportunityCounter = 0;
function nextOpportunityId(): string {
  _opportunityCounter += 1;
  return `opp-${_opportunityCounter.toString().padStart(5, '0')}`;
}

let _eventCounter = 0;
function nextEventId(): string {
  _eventCounter += 1;
  return `evt-${_eventCounter.toString().padStart(5, '0')}`;
}

let _conflictCounter = 0;
function nextConflictId(): string {
  _conflictCounter += 1;
  return `cnf-${_conflictCounter.toString().padStart(5, '0')}`;
}

let _calibrationCounter = 0;
function nextCalibrationId(): string {
  _calibrationCounter += 1;
  return `cal-${_calibrationCounter.toString().padStart(5, '0')}`;
}

// ---- 225 Confidence Model ----

const SOURCE_CONFIDENCE_BASE: Record<PreferenceSource, number> = {
  explicit: 0.95,
  calibration: 0.85,
  implicit: 0.6,
  import: 0.5,
  default: 0.3,
};

const SOURCE_PRIORITY: Record<PreferenceSource, number> = {
  explicit: 5,
  calibration: 4,
  implicit: 3,
  import: 2,
  default: 1,
};

// ---- 225 Learning Patterns ----

interface LearningPattern {
  readonly patternId: string;
  readonly type: PreferenceType;
  readonly description: string;
  readonly keyExtractor: (utterance: string) => string | null;
  readonly valueExtractor: (utterance: string) => string | null;
  readonly promptTemplate: string;
}

const LEARNING_PATTERNS: ReadonlyArray<LearningPattern> = [
  {
    patternId: 'lp-term-mapping-dark',
    type: 'term-mapping',
    description: 'Detect when user clarifies "dark" as a specific axis.',
    keyExtractor: (u) => /\bdark\b/i.test(u) ? 'dark' : null,
    valueExtractor: (u) => {
      if (/low.?brightness/i.test(u)) return 'low-brightness';
      if (/minor/i.test(u)) return 'minor-key';
      if (/low.?pass/i.test(u)) return 'low-pass-filter';
      if (/heavy|distort/i.test(u)) return 'heavy-distortion';
      return null;
    },
    promptTemplate: 'Want to remember "dark" as "{value}" for future use?',
  },
  {
    patternId: 'lp-term-mapping-bright',
    type: 'term-mapping',
    description: 'Detect when user clarifies "bright" as a specific axis.',
    keyExtractor: (u) => /\bbright\b/i.test(u) ? 'bright' : null,
    valueExtractor: (u) => {
      if (/high.?frequency|treble/i.test(u)) return 'high-frequency-boost';
      if (/major/i.test(u)) return 'major-key';
      if (/high.?pass/i.test(u)) return 'high-pass-filter';
      if (/gain|volume/i.test(u)) return 'high-gain';
      return null;
    },
    promptTemplate: 'Want to remember "bright" as "{value}" for future use?',
  },
  {
    patternId: 'lp-term-mapping-warm',
    type: 'term-mapping',
    description: 'Detect when user clarifies "warm" as a specific axis.',
    keyExtractor: (u) => /\bwarm\b/i.test(u) ? 'warm' : null,
    valueExtractor: (u) => {
      if (/saturation|tube|analog/i.test(u)) return 'analog-saturation';
      if (/low.?mid|mid.?boost/i.test(u)) return 'low-mid-boost';
      if (/reverb/i.test(u)) return 'warm-reverb';
      return null;
    },
    promptTemplate: 'Want to remember "warm" as "{value}" for future use?',
  },
  {
    patternId: 'lp-default-scope',
    type: 'default-scope',
    description: 'Detect when user consistently starts with a particular section.',
    keyExtractor: (u) => /\b(always|usually|typically)\s+(start|begin)\s+with\b/i.test(u) ? 'start-section' : null,
    valueExtractor: (u) => {
      const match = u.match(/\b(chorus|verse|intro|bridge|outro|hook|drop)\b/i);
      return match ? (match[1]?.toLowerCase() ?? null) : null;
    },
    promptTemplate: 'Want to remember to always start with "{value}"?',
  },
  {
    patternId: 'lp-default-amount-little',
    type: 'default-amount',
    description: 'Detect when user specifies what "a little" means numerically.',
    keyExtractor: (u) => /\ba\s+(little|bit)\b/i.test(u) ? 'a-little' : null,
    valueExtractor: (u) => {
      const match = u.match(/(\d+)\s*%/);
      return match ? (match[1] ?? null) : null;
    },
    promptTemplate: 'Want to remember "a little" as {value}%?',
  },
  {
    patternId: 'lp-default-amount-lot',
    type: 'default-amount',
    description: 'Detect when user specifies what "a lot" means numerically.',
    keyExtractor: (u) => /\ba\s+lot\b/i.test(u) ? 'a-lot' : null,
    valueExtractor: (u) => {
      const match = u.match(/(\d+)\s*%/);
      return match ? (match[1] ?? null) : null;
    },
    promptTemplate: 'Want to remember "a lot" as {value}%?',
  },
  {
    patternId: 'lp-behavior-confirm',
    type: 'behavior',
    description: 'Detect when user expresses confirmation preference.',
    keyExtractor: (u) => /\b(always|never)\s+(ask|confirm|check)\b/i.test(u) ? 'confirm-behavior' : null,
    valueExtractor: (u) => {
      if (/always\s+(ask|confirm)/i.test(u)) return 'always-confirm';
      if (/never\s+(ask|confirm)/i.test(u)) return 'never-confirm';
      if (/only\s+(ask|confirm).*(large|big|major)/i.test(u)) return 'confirm-large-only';
      return null;
    },
    promptTemplate: 'Want to remember your confirmation preference: "{value}"?',
  },
  {
    patternId: 'lp-vocabulary-genre',
    type: 'vocabulary',
    description: 'Detect genre-specific vocabulary usage.',
    keyExtractor: (u) => {
      const genreMatch = u.match(/\bin\s+(rock|jazz|electronic|pop|hip.?hop|classical|metal|folk|blues|r&b)\b/i);
      return genreMatch ? (genreMatch[1]?.toLowerCase() ?? null) : null;
    },
    valueExtractor: (u) => {
      // Extract the term being defined in genre context
      const termMatch = u.match(/["'](\w+(?:\s+\w+)*)["']\s+means/i);
      return termMatch ? (termMatch[1] ?? null) : null;
    },
    promptTemplate: 'Want to remember this {key} vocabulary: "{value}"?',
  },
  {
    patternId: 'lp-term-mapping-heavy',
    type: 'term-mapping',
    description: 'Detect when user clarifies "heavy" as a specific axis.',
    keyExtractor: (u) => /\bheavy\b/i.test(u) ? 'heavy' : null,
    valueExtractor: (u) => {
      if (/compress/i.test(u)) return 'heavy-compression';
      if (/distort|overdrive|fuzz/i.test(u)) return 'heavy-distortion';
      if (/bass|low.?end/i.test(u)) return 'heavy-bass';
      if (/reverb/i.test(u)) return 'heavy-reverb';
      return null;
    },
    promptTemplate: 'Want to remember "heavy" as "{value}" for future use?',
  },
  {
    patternId: 'lp-term-mapping-smooth',
    type: 'term-mapping',
    description: 'Detect when user clarifies "smooth" as a specific axis.',
    keyExtractor: (u) => /\bsmooth\b/i.test(u) ? 'smooth' : null,
    valueExtractor: (u) => {
      if (/legato/i.test(u)) return 'legato-articulation';
      if (/fade|crossfade/i.test(u)) return 'smooth-crossfade';
      if (/low.?pass|roll.?off/i.test(u)) return 'gentle-rolloff';
      if (/compress|limit/i.test(u)) return 'gentle-compression';
      return null;
    },
    promptTemplate: 'Want to remember "smooth" as "{value}" for future use?',
  },
];

// ---- 225 Functions ----

/** Detect a learning opportunity from a user utterance. */
export function detectLearningOpportunity(
  utterance: string,
  existingPreferences: ReadonlyArray<LearnedPreference>,
): LearningOpportunity | null {
  for (const pattern of LEARNING_PATTERNS) {
    const key = pattern.keyExtractor(utterance);
    if (key === null) continue;
    const value = pattern.valueExtractor(utterance);
    if (value === null) continue;

    // Check if preference already exists
    const existing = existingPreferences.find(
      p => p.type === pattern.type && p.key === key && p.value === value,
    );
    if (existing && existing.active) continue;

    const prompt = pattern.promptTemplate
      .replace('{key}', key)
      .replace('{value}', value);

    return {
      opportunityId: nextOpportunityId(),
      type: pattern.type,
      key,
      proposedValue: value,
      context: utterance,
      confidence: 0.7,
      prompt,
    };
  }
  return null;
}

/** Propose a preference from a learning opportunity. */
export function proposePreference(
  opportunity: LearningOpportunity,
  source: PreferenceSource,
): LearnedPreference {
  const now = Date.now();
  const baseConfidence = SOURCE_CONFIDENCE_BASE[source];

  return {
    preferenceId: nextPreferenceId(),
    type: opportunity.type,
    key: opportunity.key,
    value: opportunity.proposedValue,
    description: `Learned from: "${opportunity.context}"`,
    source,
    confidence: {
      level: baseConfidence,
      source,
      observations: 1,
      lastConfirmed: now,
      decayRate: 0.01,
    },
    createdAt: now,
    updatedAt: now,
    active: true,
    scope: 'global',
    tags: [opportunity.type],
  };
}

/** Store a preference in the learner state. */
export function storePreference(
  learner: PreferenceLearner,
  preference: LearnedPreference,
): PreferenceLearner {
  // Check for existing preference with same key and type
  const existingIdx = learner.preferences.findIndex(
    p => p.type === preference.type && p.key === preference.key,
  );

  let updatedPreferences: LearnedPreference[];
  const updatedHistory = [...learner.history];

  if (existingIdx >= 0) {
    // Update existing
    updatedPreferences = [...learner.preferences];
    const existing = updatedPreferences[existingIdx];
    if (existing) {
      const updated = Object.assign({}, preference, {
        preferenceId: existing.preferenceId,
        confidence: Object.assign({}, preference.confidence, {
          observations: existing.confidence.observations + 1,
        }),
      });
      updatedPreferences[existingIdx] = updated;

      // Record history event
      const historyEntry = updatedHistory.find(h => h.preferenceId === existing.preferenceId);
      const event: PreferenceHistoryEvent = {
        eventId: nextEventId(),
        type: 'updated',
        timestamp: Date.now(),
        details: `Updated value from "${existing.value}" to "${preference.value}"`,
        previousValue: existing.value,
        newValue: preference.value,
      };
      if (historyEntry) {
        const idx = updatedHistory.indexOf(historyEntry);
        updatedHistory[idx] = {
          preferenceId: historyEntry.preferenceId,
          events: [...historyEntry.events, event],
        };
      } else {
        updatedHistory.push({
          preferenceId: existing.preferenceId,
          events: [event],
        });
      }
    }
  } else {
    updatedPreferences = [...learner.preferences, preference];

    // Record creation event
    updatedHistory.push({
      preferenceId: preference.preferenceId,
      events: [{
        eventId: nextEventId(),
        type: 'created',
        timestamp: Date.now(),
        details: `Created preference: ${preference.key} = ${preference.value}`,
        previousValue: '',
        newValue: preference.value,
      }],
    });
  }

  return {
    preferences: updatedPreferences,
    history: updatedHistory,
    applications: learner.applications,
  };
}

/** Look up a preference by type and key. */
export function lookupPreference(
  learner: PreferenceLearner,
  type: PreferenceType,
  key: string,
): LearnedPreference | null {
  const found = learner.preferences.find(
    p => p.type === type && p.key === key && p.active,
  );
  return found ?? null;
}

/** Apply a preference with provenance annotation. */
export function applyPreferenceWithProvenance(
  learner: PreferenceLearner,
  preferenceId: string,
  context: string,
): { learner: PreferenceLearner; application: PreferenceApplication | null; provenanceMessage: string } {
  const pref = learner.preferences.find(p => p.preferenceId === preferenceId && p.active);
  if (!pref) {
    return { learner, application: null, provenanceMessage: '' };
  }

  const provenanceMessage = `Using your default for "${pref.key}": ${pref.value} (source: ${pref.source}, confidence: ${(pref.confidence.level * 100).toFixed(0)}%)`;

  const application: PreferenceApplication = {
    applicationId: nextApplicationId(),
    preferenceId: pref.preferenceId,
    appliedAt: Date.now(),
    context,
    provenanceMessage,
    wasOverridden: false,
  };

  const updatedApplications = [...learner.applications, application];

  // Update history
  const updatedHistory = [...learner.history];
  const historyEntry = updatedHistory.find(h => h.preferenceId === pref.preferenceId);
  const event: PreferenceHistoryEvent = {
    eventId: nextEventId(),
    type: 'applied',
    timestamp: Date.now(),
    details: `Applied in context: ${context}`,
    previousValue: pref.value,
    newValue: pref.value,
  };
  if (historyEntry) {
    const idx = updatedHistory.indexOf(historyEntry);
    updatedHistory[idx] = {
      preferenceId: historyEntry.preferenceId,
      events: [...historyEntry.events, event],
    };
  } else {
    updatedHistory.push({
      preferenceId: pref.preferenceId,
      events: [event],
    });
  }

  const updatedLearner: PreferenceLearner = {
    preferences: learner.preferences,
    history: updatedHistory,
    applications: updatedApplications,
  };

  return { learner: updatedLearner, application, provenanceMessage };
}

/** Get full history for a preference. */
export function getPreferenceHistory(
  learner: PreferenceLearner,
  preferenceId: string,
): PreferenceHistory | null {
  return learner.history.find(h => h.preferenceId === preferenceId) ?? null;
}

/** Detect conflicts between two preferences. */
export function detectPreferenceConflict(
  a: LearnedPreference,
  b: LearnedPreference,
): PreferenceConflict | null {
  // Same key, same type, different values
  if (a.type === b.type && a.key === b.key && a.value !== b.value) {
    const aPriority = SOURCE_PRIORITY[a.source];
    const bPriority = SOURCE_PRIORITY[b.source];

    let resolution: PreferenceConflict['resolution'];
    let reason: string;

    if (aPriority > bPriority) {
      resolution = 'a-wins';
      reason = `Source "${a.source}" has higher priority than "${b.source}".`;
    } else if (bPriority > aPriority) {
      resolution = 'b-wins';
      reason = `Source "${b.source}" has higher priority than "${a.source}".`;
    } else if (a.updatedAt > b.updatedAt) {
      resolution = 'a-wins';
      reason = 'Same source priority; preference A is newer.';
    } else if (b.updatedAt > a.updatedAt) {
      resolution = 'b-wins';
      reason = 'Same source priority; preference B is newer.';
    } else {
      resolution = 'unresolved';
      reason = 'Same source, same timestamp — cannot resolve automatically.';
    }

    return {
      conflictId: nextConflictId(),
      preferenceA: a,
      preferenceB: b,
      conflictType: 'contradictory',
      resolution,
      reason,
    };
  }

  // Overlapping scope: same type, different keys but one is more specific
  if (a.type === b.type && a.key !== b.key) {
    const aIsMoreSpecific = a.scope.length > b.scope.length && a.scope.includes(b.scope);
    const bIsMoreSpecific = b.scope.length > a.scope.length && b.scope.includes(a.scope);

    if (aIsMoreSpecific || bIsMoreSpecific) {
      return {
        conflictId: nextConflictId(),
        preferenceA: a,
        preferenceB: b,
        conflictType: 'overlapping',
        resolution: aIsMoreSpecific ? 'a-wins' : 'b-wins',
        reason: aIsMoreSpecific
          ? 'Preference A has a more specific scope.'
          : 'Preference B has a more specific scope.',
      };
    }
  }

  return null;
}

/** Resolve a preference conflict. */
export function resolveConflict(
  conflict: PreferenceConflict,
  learner: PreferenceLearner,
): PreferenceLearner {
  if (conflict.resolution === 'unresolved') return learner;

  const loserId = conflict.resolution === 'a-wins'
    ? conflict.preferenceB.preferenceId
    : conflict.resolution === 'b-wins'
      ? conflict.preferenceA.preferenceId
      : null;

  if (loserId === null) return learner;

  // Deactivate the losing preference
  const updatedPreferences = learner.preferences.map(p => {
    if (p.preferenceId === loserId) {
      return Object.assign({}, p, { active: false });
    }
    return p;
  });

  return {
    preferences: updatedPreferences,
    history: learner.history,
    applications: learner.applications,
  };
}

/** Export all preferences for external storage. */
export function exportPreferences(
  learner: PreferenceLearner,
): SerializedPreferences {
  return {
    version: 1,
    exportedAt: Date.now(),
    preferences: learner.preferences.filter(p => p.active),
  };
}

/** Import preferences from external storage. */
export function importPreferences(
  learner: PreferenceLearner,
  serialized: SerializedPreferences,
): PreferenceLearner {
  if (serialized.version !== 1) return learner;

  let updated = learner;
  for (const pref of serialized.preferences) {
    const imported = Object.assign({}, pref, {
      preferenceId: nextPreferenceId(),
      source: 'import' as PreferenceSource,
      confidence: Object.assign({}, pref.confidence, {
        source: 'import' as PreferenceSource,
        level: Math.min(pref.confidence.level, SOURCE_CONFIDENCE_BASE['import']),
      }),
      updatedAt: Date.now(),
    });
    updated = storePreference(updated, imported);
  }

  return updated;
}

/** Reset (deactivate) a specific preference. */
export function resetPreference(
  learner: PreferenceLearner,
  preferenceId: string,
): PreferenceLearner {
  const updatedPreferences = learner.preferences.map(p => {
    if (p.preferenceId === preferenceId) {
      return Object.assign({}, p, { active: false, updatedAt: Date.now() });
    }
    return p;
  });

  // Record reset event
  const updatedHistory = [...learner.history];
  const pref = learner.preferences.find(p => p.preferenceId === preferenceId);
  if (pref) {
    const historyEntry = updatedHistory.find(h => h.preferenceId === preferenceId);
    const event: PreferenceHistoryEvent = {
      eventId: nextEventId(),
      type: 'reset',
      timestamp: Date.now(),
      details: `Preference "${pref.key}" was reset/deactivated.`,
      previousValue: pref.value,
      newValue: '',
    };
    if (historyEntry) {
      const idx = updatedHistory.indexOf(historyEntry);
      updatedHistory[idx] = {
        preferenceId: historyEntry.preferenceId,
        events: [...historyEntry.events, event],
      };
    } else {
      updatedHistory.push({
        preferenceId,
        events: [event],
      });
    }
  }

  return {
    preferences: updatedPreferences,
    history: updatedHistory,
    applications: learner.applications,
  };
}

/** Get computed confidence for a preference (accounts for decay). */
export function getPreferenceConfidence(
  preference: LearnedPreference,
): number {
  const now = Date.now();
  const ageMs = now - preference.confidence.lastConfirmed;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const decayed = preference.confidence.level * Math.exp(-preference.confidence.decayRate * ageDays);
  const observationBoost = Math.min(0.1, preference.confidence.observations * 0.02);
  return Math.min(1.0, Math.max(0.0, Math.round((decayed + observationBoost) * 100) / 100));
}

/** Suggest calibration for a preference that may be stale or low-confidence. */
export function suggestCalibration(
  learner: PreferenceLearner,
): ReadonlyArray<CalibrationSuggestion> {
  const suggestions: CalibrationSuggestion[] = [];

  for (const pref of learner.preferences) {
    if (!pref.active) continue;
    const currentConf = getPreferenceConfidence(pref);

    if (currentConf < 0.4) {
      suggestions.push({
        suggestionId: nextCalibrationId(),
        preferenceId: pref.preferenceId,
        currentValue: pref.value,
        suggestedPrompt: `Your preference for "${pref.key}" (= "${pref.value}") has low confidence (${(currentConf * 100).toFixed(0)}%). Would you like to confirm or update it?`,
        reason: 'Confidence has decayed below threshold.',
      });
    }

    if (pref.source === 'implicit' && pref.confidence.observations < 3) {
      suggestions.push({
        suggestionId: nextCalibrationId(),
        preferenceId: pref.preferenceId,
        currentValue: pref.value,
        suggestedPrompt: `We inferred "${pref.key}" = "${pref.value}" from context. Is that correct?`,
        reason: 'Implicit preference with few observations needs confirmation.',
      });
    }

    if (pref.source === 'import') {
      const apps = learner.applications.filter(a => a.preferenceId === pref.preferenceId);
      if (apps.length === 0) {
        suggestions.push({
          suggestionId: nextCalibrationId(),
          preferenceId: pref.preferenceId,
          currentValue: pref.value,
          suggestedPrompt: `Imported preference "${pref.key}" = "${pref.value}" has never been used. Does it still apply?`,
          reason: 'Imported preference never applied — may be stale.',
        });
      }
    }
  }

  return suggestions;
}

/** Batch-apply preferences to a set of clarification objects, returning provenance annotations. */
export function batchApplyPreferences(
  learner: PreferenceLearner,
  clarifications: ReadonlyArray<ClarificationObject>,
): {
  updatedLearner: PreferenceLearner;
  resolved: ReadonlyArray<{ clarificationId: string; preferenceId: string; provenanceMessage: string }>;
  unresolved: ReadonlyArray<string>;
} {
  let currentLearner = learner;
  const resolved: { clarificationId: string; preferenceId: string; provenanceMessage: string }[] = [];
  const unresolved: string[] = [];

  for (const clr of clarifications) {
    // Try to find a preference that covers this clarification
    let matched = false;

    for (const pref of currentLearner.preferences) {
      if (!pref.active) continue;

      // Check if preference key appears in the clarification question or context
      const questionLower = clr.question.toLowerCase();
      const contextLower = clr.context.toLowerCase();
      const keyLower = pref.key.toLowerCase();

      if (questionLower.includes(keyLower) || contextLower.includes(keyLower)) {
        const confidence = getPreferenceConfidence(pref);
        if (confidence < 0.3) continue;

        const result = applyPreferenceWithProvenance(currentLearner, pref.preferenceId, clr.context);
        currentLearner = result.learner;
        if (result.application) {
          resolved.push({
            clarificationId: clr.id,
            preferenceId: pref.preferenceId,
            provenanceMessage: result.provenanceMessage,
          });
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      unresolved.push(clr.id);
    }
  }

  return { updatedLearner: currentLearner, resolved, unresolved };
}

/** Create an empty preference learner. */
export function createPreferenceLearner(): PreferenceLearner {
  return {
    preferences: [],
    history: [],
    applications: [],
  };
}
