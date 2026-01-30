/**
 * speech-acts.ts -- Steps 226-230: Pragmatic speech acts, hedging, intention,
 * confirmation, and counterfactual exploration.
 *
 * Step 226: Speech Act Modeling — detect and classify speech acts
 * Step 227: Politeness/Hedging Handling — confidence modifiers
 * Step 228: Intention Recognition — multi-turn editing intentions
 * Step 229: Plan Confirmation Moves — gate execution on user confirmation
 * Step 230: Counterfactual Exploration — "what if" without mutation
 *
 * All types are locally defined (no external imports).
 */

// ===================== STEP 226: SPEECH ACT MODELING =====================

// ---- 226 Types ----

/** Enumeration of speech act types. */
export type SpeechActType =
  | 'request'
  | 'command'
  | 'suggestion'
  | 'question'
  | 'meta-question'
  | 'inform'
  | 'confirm'
  | 'deny'
  | 'promise'
  | 'warn'
  | 'apologize'
  | 'thank'
  | 'greet'
  | 'farewell'
  | 'exclaim';

/** Illocutionary force categories. */
export type IllocutionaryForce =
  | 'directive'
  | 'commissive'
  | 'assertive'
  | 'expressive'
  | 'declarative';

/** Perlocutionary effect — what the speech act aims to achieve. */
export type PerlocutionaryEffect =
  | 'change-state'
  | 'provide-info'
  | 'seek-confirmation'
  | 'seek-info'
  | 'express-emotion'
  | 'establish-rapport'
  | 'close-interaction'
  | 'elicit-action'
  | 'commit-speaker'
  | 'alert-danger'
  | 'express-regret'
  | 'acknowledge-favor'
  | 'open-interaction'
  | 'modify-state'
  | 'undo-state';

/** A single speech act detection pattern. */
export interface SpeechActPattern {
  readonly id: string;
  readonly regex: RegExp;
  readonly actType: SpeechActType;
  readonly force: IllocutionaryForce;
  readonly effect: PerlocutionaryEffect;
  readonly confidence: number;
  readonly description: string;
}

/** Result of detecting a speech act on an utterance. */
export interface SpeechActDetection {
  readonly utterance: string;
  readonly detectedAct: SpeechActType;
  readonly force: IllocutionaryForce;
  readonly effect: PerlocutionaryEffect;
  readonly confidence: number;
  readonly matchedPatterns: readonly string[];
  readonly timestamp: number;
}

/** Full speech act representation. */
export interface SpeechAct {
  readonly id: string;
  readonly actType: SpeechActType;
  readonly force: IllocutionaryForce;
  readonly effect: PerlocutionaryEffect;
  readonly content: string;
  readonly confidence: number;
  readonly speaker: string;
  readonly addressee: string;
  readonly timestamp: number;
  readonly metadata: Record<string, string>;
}

/** CPL intent mapping result. */
export interface CPLIntentMapping {
  readonly speechAct: SpeechActType;
  readonly cplIntent: string;
  readonly parameters: Record<string, string>;
  readonly confidence: number;
}

/** Expected response type for a given speech act. */
export interface ExpectedResponseSpec {
  readonly speechAct: SpeechActType;
  readonly expectedResponseType: SpeechActType;
  readonly urgency: 'low' | 'medium' | 'high';
  readonly optional: boolean;
  readonly description: string;
}

/** Analysis format for speech acts. */
export interface SpeechActAnalysis {
  readonly detection: SpeechActDetection;
  readonly cplMapping: CPLIntentMapping;
  readonly expectedResponse: ExpectedResponseSpec;
  readonly summary: string;
}

// ---- 226 Constants ----

/** Mapping from speech act types to illocutionary force. */
const SPEECH_ACT_FORCE_MAP: ReadonlyMap<SpeechActType, IllocutionaryForce> = new Map<SpeechActType, IllocutionaryForce>([
  ['request', 'directive'],
  ['command', 'directive'],
  ['suggestion', 'directive'],
  ['question', 'directive'],
  ['meta-question', 'directive'],
  ['inform', 'assertive'],
  ['confirm', 'assertive'],
  ['deny', 'assertive'],
  ['promise', 'commissive'],
  ['warn', 'expressive'],
  ['apologize', 'expressive'],
  ['thank', 'expressive'],
  ['greet', 'expressive'],
  ['farewell', 'expressive'],
  ['exclaim', 'expressive'],
]);

/** Mapping from speech act types to perlocutionary effects. */
const SPEECH_ACT_EFFECT_MAP: ReadonlyMap<SpeechActType, PerlocutionaryEffect> = new Map<SpeechActType, PerlocutionaryEffect>([
  ['request', 'elicit-action'],
  ['command', 'change-state'],
  ['suggestion', 'elicit-action'],
  ['question', 'seek-info'],
  ['meta-question', 'seek-info'],
  ['inform', 'provide-info'],
  ['confirm', 'seek-confirmation'],
  ['deny', 'change-state'],
  ['promise', 'commit-speaker'],
  ['warn', 'alert-danger'],
  ['apologize', 'express-regret'],
  ['thank', 'acknowledge-favor'],
  ['greet', 'open-interaction'],
  ['farewell', 'close-interaction'],
  ['exclaim', 'express-emotion'],
]);

/** All 44 speech act detection patterns. */
const SPEECH_ACT_PATTERNS: readonly SpeechActPattern[] = [
  // -- Requests (8) --
  { id: 'sa-req-make-it', regex: /\bmake\s+it\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.9, description: '"make it X" -> request' },
  { id: 'sa-req-i-want', regex: /\bi\s+want\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.85, description: '"I want X" -> request' },
  { id: 'sa-req-i-need', regex: /\bi\s+need\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.85, description: '"I need X" -> request' },
  { id: 'sa-req-please', regex: /\bplease\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.8, description: '"please X" -> request' },
  { id: 'sa-req-id-like', regex: /\bi'd\s+like\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.8, description: '"I\'d like X" -> request' },
  { id: 'sa-req-can-you', regex: /\bcan\s+you\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.75, description: '"can you X" -> request' },
  { id: 'sa-req-lets', regex: /\blet's\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.8, description: '"let\'s X" -> request' },
  { id: 'sa-req-give-me', regex: /\bgive\s+me\s+(.+)/i, actType: 'request', force: 'directive', effect: 'elicit-action', confidence: 0.85, description: '"give me X" -> request' },
  // -- Suggestions (5) --
  { id: 'sa-sug-could-you', regex: /\bcould\s+you\s+(.+)/i, actType: 'suggestion', force: 'directive', effect: 'elicit-action', confidence: 0.7, description: '"could you X" -> suggestion' },
  { id: 'sa-sug-how-about', regex: /\bhow\s+about\s+(.+)/i, actType: 'suggestion', force: 'directive', effect: 'elicit-action', confidence: 0.7, description: '"how about X" -> suggestion' },
  { id: 'sa-sug-maybe-try', regex: /\bmaybe\s+try\s+(.+)/i, actType: 'suggestion', force: 'directive', effect: 'elicit-action', confidence: 0.65, description: '"maybe try X" -> suggestion' },
  { id: 'sa-sug-would-you', regex: /\bwould\s+you\s+(.+)/i, actType: 'suggestion', force: 'directive', effect: 'elicit-action', confidence: 0.7, description: '"would you X" -> suggestion' },
  { id: 'sa-sug-what-about', regex: /\bwhat\s+about\s+(.+)/i, actType: 'suggestion', force: 'directive', effect: 'elicit-action', confidence: 0.65, description: '"what about X" -> suggestion' },
  // -- Questions (8) --
  { id: 'sa-q-what-is', regex: /\bwhat\s+is\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.9, description: '"what is X" -> question' },
  { id: 'sa-q-how-do', regex: /\bhow\s+do\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.9, description: '"how do X" -> question' },
  { id: 'sa-q-where-is', regex: /\bwhere\s+is\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.9, description: '"where is X" -> question' },
  { id: 'sa-q-when-did', regex: /\bwhen\s+did\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.85, description: '"when did X" -> question' },
  { id: 'sa-q-show-me', regex: /\bshow\s+me\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.8, description: '"show me X" -> question/command' },
  { id: 'sa-q-is-there', regex: /\bis\s+there\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.85, description: '"is there X" -> question' },
  { id: 'sa-q-does-it', regex: /\bdoes\s+it\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.85, description: '"does it X" -> question' },
  { id: 'sa-q-which', regex: /\bwhich\s+(.+)/i, actType: 'question', force: 'directive', effect: 'seek-info', confidence: 0.85, description: '"which X" -> question' },
  // -- Meta-questions (4) --
  { id: 'sa-mq-why-did', regex: /\bwhy\s+did\s+you\s+(.+)/i, actType: 'meta-question', force: 'directive', effect: 'seek-info', confidence: 0.9, description: '"why did you X" -> meta-question' },
  { id: 'sa-mq-why-is', regex: /\bwhy\s+is\s+(.+)/i, actType: 'meta-question', force: 'directive', effect: 'seek-info', confidence: 0.85, description: '"why is X" -> meta-question' },
  { id: 'sa-mq-how-come', regex: /\bhow\s+come\s+(.+)/i, actType: 'meta-question', force: 'directive', effect: 'seek-info', confidence: 0.85, description: '"how come X" -> meta-question' },
  { id: 'sa-mq-explain', regex: /\bexplain\s+(.+)/i, actType: 'meta-question', force: 'directive', effect: 'seek-info', confidence: 0.8, description: '"explain X" -> meta-question' },
  // -- Commands (9) --
  { id: 'sa-cmd-undo', regex: /\bundo\b/i, actType: 'command', force: 'directive', effect: 'undo-state', confidence: 0.95, description: '"undo" -> command' },
  { id: 'sa-cmd-redo', regex: /\bredo\b/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.95, description: '"redo" -> command' },
  { id: 'sa-cmd-delete', regex: /\bdelete\s+(.+)/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.9, description: '"delete X" -> command' },
  { id: 'sa-cmd-remove', regex: /\bremove\s+(.+)/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.9, description: '"remove X" -> command' },
  { id: 'sa-cmd-add', regex: /\badd\s+(.+)/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.85, description: '"add X" -> command' },
  { id: 'sa-cmd-set', regex: /\bset\s+(.+)\s+to\s+(.+)/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.9, description: '"set X to Y" -> command' },
  { id: 'sa-cmd-change', regex: /\bchange\s+(.+)\s+to\s+(.+)/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.9, description: '"change X to Y" -> command' },
  { id: 'sa-cmd-move', regex: /\bmove\s+(.+)\s+to\s+(.+)/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.9, description: '"move X to Y" -> command' },
  { id: 'sa-cmd-copy', regex: /\bcopy\s+(.+)/i, actType: 'command', force: 'directive', effect: 'change-state', confidence: 0.85, description: '"copy X" -> command' },
  // -- Inform (2) --
  { id: 'sa-inf-it-is', regex: /\bit\s+is\s+(.+)/i, actType: 'inform', force: 'assertive', effect: 'provide-info', confidence: 0.6, description: '"it is X" -> inform' },
  { id: 'sa-inf-i-think', regex: /\bi\s+think\s+(.+)/i, actType: 'inform', force: 'assertive', effect: 'provide-info', confidence: 0.6, description: '"I think X" -> inform' },
  // -- Confirm/Deny (2) --
  { id: 'sa-conf-yes', regex: /^\s*(yes|yeah|yep|yup|ok|okay|sure|right|correct|exactly|affirmative)\b/i, actType: 'confirm', force: 'assertive', effect: 'seek-confirmation', confidence: 0.9, description: '"yes/ok" -> confirm' },
  { id: 'sa-deny-no', regex: /^\s*(no|nope|nah|wrong|incorrect|negative)\b/i, actType: 'deny', force: 'assertive', effect: 'change-state', confidence: 0.9, description: '"no/nope" -> deny' },
  // -- Promise (1) --
  { id: 'sa-prom-i-will', regex: /\bi\s+will\s+(.+)/i, actType: 'promise', force: 'commissive', effect: 'commit-speaker', confidence: 0.7, description: '"I will X" -> promise' },
  // -- Warn (1) --
  { id: 'sa-warn-careful', regex: /\b(careful|warning|caution|watch\s+out|be\s+aware)\b/i, actType: 'warn', force: 'expressive', effect: 'alert-danger', confidence: 0.8, description: '"careful/warning" -> warn' },
  // -- Apologize (1) --
  { id: 'sa-apol-sorry', regex: /\b(sorry|apolog|my\s+bad)\b/i, actType: 'apologize', force: 'expressive', effect: 'express-regret', confidence: 0.85, description: '"sorry" -> apologize' },
  // -- Thank (1) --
  { id: 'sa-thank-thanks', regex: /\b(thanks|thank\s+you|thx|ty|appreciate)\b/i, actType: 'thank', force: 'expressive', effect: 'acknowledge-favor', confidence: 0.9, description: '"thanks" -> thank' },
  // -- Greet (1) --
  { id: 'sa-greet-hello', regex: /^\s*(hello|hi|hey|greetings|howdy|good\s+(morning|afternoon|evening))\b/i, actType: 'greet', force: 'expressive', effect: 'open-interaction', confidence: 0.9, description: '"hello/hi" -> greet' },
  // -- Farewell (1) --
  { id: 'sa-bye-goodbye', regex: /\b(goodbye|bye|see\s+you|later|farewell|take\s+care)\b/i, actType: 'farewell', force: 'expressive', effect: 'close-interaction', confidence: 0.85, description: '"goodbye/bye" -> farewell' },
  // -- Exclaim (1) --
  { id: 'sa-excl-wow', regex: /\b(wow|amazing|awesome|great|fantastic|incredible|oh\s+no|whoa)\b/i, actType: 'exclaim', force: 'expressive', effect: 'express-emotion', confidence: 0.75, description: '"wow/amazing" -> exclaim' },
];

/** Default expected responses for each speech act type. */
const EXPECTED_RESPONSE_MAP: ReadonlyMap<SpeechActType, ExpectedResponseSpec> = new Map<SpeechActType, ExpectedResponseSpec>([
  ['request', { speechAct: 'request', expectedResponseType: 'confirm', urgency: 'high', optional: false, description: 'Request expects confirmation or execution' }],
  ['command', { speechAct: 'command', expectedResponseType: 'confirm', urgency: 'high', optional: false, description: 'Command expects execution report' }],
  ['suggestion', { speechAct: 'suggestion', expectedResponseType: 'confirm', urgency: 'medium', optional: true, description: 'Suggestion expects acceptance or alternative' }],
  ['question', { speechAct: 'question', expectedResponseType: 'inform', urgency: 'high', optional: false, description: 'Question expects informative answer' }],
  ['meta-question', { speechAct: 'meta-question', expectedResponseType: 'inform', urgency: 'medium', optional: false, description: 'Meta-question expects explanation' }],
  ['inform', { speechAct: 'inform', expectedResponseType: 'confirm', urgency: 'low', optional: true, description: 'Inform expects acknowledgment' }],
  ['confirm', { speechAct: 'confirm', expectedResponseType: 'inform', urgency: 'low', optional: true, description: 'Confirm closes a sequence' }],
  ['deny', { speechAct: 'deny', expectedResponseType: 'question', urgency: 'medium', optional: false, description: 'Deny may trigger clarification' }],
  ['promise', { speechAct: 'promise', expectedResponseType: 'confirm', urgency: 'low', optional: true, description: 'Promise expects acknowledgment' }],
  ['warn', { speechAct: 'warn', expectedResponseType: 'confirm', urgency: 'high', optional: false, description: 'Warning expects acknowledgment' }],
  ['apologize', { speechAct: 'apologize', expectedResponseType: 'confirm', urgency: 'low', optional: true, description: 'Apology expects acceptance' }],
  ['thank', { speechAct: 'thank', expectedResponseType: 'confirm', urgency: 'low', optional: true, description: 'Thanks expects acknowledgment' }],
  ['greet', { speechAct: 'greet', expectedResponseType: 'greet', urgency: 'medium', optional: false, description: 'Greeting expects greeting' }],
  ['farewell', { speechAct: 'farewell', expectedResponseType: 'farewell', urgency: 'low', optional: true, description: 'Farewell expects farewell' }],
  ['exclaim', { speechAct: 'exclaim', expectedResponseType: 'confirm', urgency: 'low', optional: true, description: 'Exclamation needs no specific response' }],
]);

/** CPL intent mapping from speech act type. */
const CPL_INTENT_MAP: ReadonlyMap<SpeechActType, string> = new Map<SpeechActType, string>([
  ['request', 'cpl:edit'],
  ['command', 'cpl:execute'],
  ['suggestion', 'cpl:suggest'],
  ['question', 'cpl:query'],
  ['meta-question', 'cpl:explain'],
  ['inform', 'cpl:assert'],
  ['confirm', 'cpl:confirm'],
  ['deny', 'cpl:reject'],
  ['promise', 'cpl:commit'],
  ['warn', 'cpl:alert'],
  ['apologize', 'cpl:repair'],
  ['thank', 'cpl:acknowledge'],
  ['greet', 'cpl:open-session'],
  ['farewell', 'cpl:close-session'],
  ['exclaim', 'cpl:express'],
]);

// ---- 226 Functions ----

/** Generate a unique identifier string. */
function generateId(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/** Detect the primary speech act from an utterance. */
export function detectSpeechAct(utterance: string): SpeechActDetection {
  const lower = utterance.toLowerCase().trim();
  let bestAct: SpeechActType = 'inform';
  let bestForce: IllocutionaryForce = 'assertive';
  let bestEffect: PerlocutionaryEffect = 'provide-info';
  let bestConfidence = 0;
  const matchedIds: string[] = [];

  for (const pattern of SPEECH_ACT_PATTERNS) {
    if (pattern.regex.test(lower)) {
      matchedIds.push(pattern.id);
      if (pattern.confidence > bestConfidence) {
        bestConfidence = pattern.confidence;
        bestAct = pattern.actType;
        bestForce = pattern.force;
        bestEffect = pattern.effect;
      }
    }
  }

  if (matchedIds.length === 0) {
    if (lower.endsWith('?')) {
      bestAct = 'question';
      bestForce = 'directive';
      bestEffect = 'seek-info';
      bestConfidence = 0.6;
      matchedIds.push('heuristic-question-mark');
    } else {
      bestConfidence = 0.3;
    }
  }

  return {
    utterance,
    detectedAct: bestAct,
    force: bestForce,
    effect: bestEffect,
    confidence: bestConfidence,
    matchedPatterns: matchedIds,
    timestamp: Date.now(),
  };
}

/** Classify a speech act from explicit type and content. */
export function classifySpeechAct(
  actType: SpeechActType,
  content: string,
  speaker: string,
  addressee: string,
): SpeechAct {
  const force = getIllocutionaryForce(actType);
  const effect = getPerlocutionaryEffect(actType);
  return {
    id: generateId('sa'),
    actType,
    force,
    effect,
    content,
    confidence: 1.0,
    speaker,
    addressee,
    timestamp: Date.now(),
    metadata: {},
  };
}

/** Get the illocutionary force for a speech act type. */
export function getIllocutionaryForce(actType: SpeechActType): IllocutionaryForce {
  return SPEECH_ACT_FORCE_MAP.get(actType) ?? 'assertive';
}

/** Get the perlocutionary effect for a speech act type. */
export function getPerlocutionaryEffect(actType: SpeechActType): PerlocutionaryEffect {
  return SPEECH_ACT_EFFECT_MAP.get(actType) ?? 'provide-info';
}

/** Check whether a speech act is a directive (request/command/suggestion/question). */
export function isDirective(actType: SpeechActType): boolean {
  return getIllocutionaryForce(actType) === 'directive';
}

/** Check whether a speech act is an interrogative (question/meta-question). */
export function isInterrogative(actType: SpeechActType): boolean {
  return actType === 'question' || actType === 'meta-question';
}

/** Check whether a speech act is assertive (inform/confirm/deny). */
export function isAssertive(actType: SpeechActType): boolean {
  return getIllocutionaryForce(actType) === 'assertive';
}

/** Format speech act analysis into a structured summary. */
export function formatSpeechActAnalysis(detection: SpeechActDetection): SpeechActAnalysis {
  const cplMapping = mapSpeechActToCPLIntent(detection.detectedAct, detection.utterance);
  const expectedResponse = getExpectedResponse(detection.detectedAct);
  const lines: string[] = [
    'Speech Act: ' + detection.detectedAct + ' (' + detection.force + ')',
    'Confidence: ' + (detection.confidence * 100).toFixed(0) + '%',
    'Effect: ' + detection.effect,
    'Patterns matched: ' + (detection.matchedPatterns.length > 0 ? detection.matchedPatterns.join(', ') : 'none'),
    'CPL Intent: ' + cplMapping.cplIntent,
    'Expected response: ' + expectedResponse.expectedResponseType,
  ];
  return { detection, cplMapping, expectedResponse, summary: lines.join('\n') };
}

/** Detect speech acts for a batch of utterances. */
export function batchDetectSpeechActs(utterances: readonly string[]): readonly SpeechActDetection[] {
  const results: SpeechActDetection[] = [];
  for (const u of utterances) {
    results.push(detectSpeechAct(u));
  }
  return results;
}

/** Return all speech act patterns (read-only). */
export function getSpeechActPatterns(): readonly SpeechActPattern[] {
  return SPEECH_ACT_PATTERNS;
}

/** Map a speech act type to a CPL intent. */
export function mapSpeechActToCPLIntent(actType: SpeechActType, utterance: string): CPLIntentMapping {
  const cplIntent = CPL_INTENT_MAP.get(actType) ?? 'cpl:unknown';
  return {
    speechAct: actType,
    cplIntent,
    parameters: { rawUtterance: utterance },
    confidence: actType === 'inform' ? 0.5 : 0.8,
  };
}

/** Get the expected response for a speech act type. */
export function getExpectedResponse(actType: SpeechActType): ExpectedResponseSpec {
  return EXPECTED_RESPONSE_MAP.get(actType) ?? {
    speechAct: actType,
    expectedResponseType: 'confirm' as SpeechActType,
    urgency: 'low' as const,
    optional: true,
    description: 'Default: acknowledge',
  };
}


// ===================== STEP 227: POLITENESS / HEDGING HANDLING =====================

// ---- 227 Types ----

/** Types of hedging constructions. */
export type HedgeType =
  | 'modal-hedge'
  | 'epistemic-hedge'
  | 'approximator'
  | 'shield'
  | 'downtoner'
  | 'understater'
  | 'politeness-marker'
  | 'tentativeness-marker';

/** Politeness level affecting clarification tone. */
export type PolitenessLevel = 'casual' | 'polite' | 'formal' | 'deferential';

/** A single hedge detection pattern. */
export interface HedgePattern {
  readonly id: string;
  readonly regex: RegExp;
  readonly hedgeType: HedgeType;
  readonly confidenceModifier: number;
  readonly politenessEffect: number;
  readonly description: string;
}

/** Result of detecting hedges in an utterance. */
export interface HedgeDetection {
  readonly utterance: string;
  readonly hedgesFound: readonly HedgeMatch[];
  readonly totalConfidenceModifier: number;
  readonly politenessLevel: PolitenessLevel;
  readonly strippedUtterance: string;
  readonly timestamp: number;
}

/** A single matched hedge with its properties. */
export interface HedgeMatch {
  readonly patternId: string;
  readonly hedgeType: HedgeType;
  readonly matchedText: string;
  readonly confidenceModifier: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

/** Effect of hedges on a speech act. */
export interface HedgeEffect {
  readonly originalConfidence: number;
  readonly adjustedConfidence: number;
  readonly totalModifier: number;
  readonly hedgeCount: number;
  readonly actTypePreserved: boolean;
  readonly politenessLevel: PolitenessLevel;
}

/** Configuration for hedge processing. */
export interface HedgeConfig {
  readonly minConfidence: number;
  readonly maxCumulativeModifier: number;
  readonly preserveActType: boolean;
  readonly politenessWeights: Record<PolitenessLevel, number>;
}

/** Hedge analysis result combining detection and effect. */
export interface HedgeAnalysis {
  readonly detection: HedgeDetection;
  readonly effect: HedgeEffect;
  readonly summary: string;
}

/** Clarification tone adjustments based on politeness. */
export interface ClarificationToneResult {
  readonly politenessLevel: PolitenessLevel;
  readonly tonePrefix: string;
  readonly toneSuffix: string;
  readonly formality: number;
  readonly directness: number;
}

// ---- 227 Constants ----

/** All 38 hedge detection patterns. */
const HEDGE_PATTERNS: readonly HedgePattern[] = [
  // Modal hedges
  { id: 'hg-modal-could', regex: /\bcould\s+you\b/i, hedgeType: 'modal-hedge', confidenceModifier: -0.10, politenessEffect: 0.2, description: '"could you" -> modal hedge' },
  { id: 'hg-modal-would', regex: /\bwould\s+you\b/i, hedgeType: 'modal-hedge', confidenceModifier: -0.10, politenessEffect: 0.2, description: '"would you" -> modal hedge' },
  { id: 'hg-modal-might', regex: /\bmight\b/i, hedgeType: 'modal-hedge', confidenceModifier: -0.15, politenessEffect: 0.1, description: '"might" -> modal hedge' },
  { id: 'hg-modal-may', regex: /\bmay\b/i, hedgeType: 'modal-hedge', confidenceModifier: -0.12, politenessEffect: 0.15, description: '"may" -> modal hedge' },
  { id: 'hg-modal-should', regex: /\bshould\b/i, hedgeType: 'modal-hedge', confidenceModifier: -0.08, politenessEffect: 0.1, description: '"should" -> modal hedge' },
  // Epistemic hedges
  { id: 'hg-epist-maybe', regex: /\bmaybe\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.15, politenessEffect: 0.05, description: '"maybe" -> epistemic hedge' },
  { id: 'hg-epist-perhaps', regex: /\bperhaps\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.15, politenessEffect: 0.1, description: '"perhaps" -> epistemic hedge' },
  { id: 'hg-epist-possibly', regex: /\bpossibly\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.15, politenessEffect: 0.1, description: '"possibly" -> epistemic hedge' },
  { id: 'hg-epist-i-think', regex: /\bi\s+think\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.20, politenessEffect: 0.05, description: '"I think" -> epistemic hedge' },
  { id: 'hg-epist-i-guess', regex: /\bi\s+guess\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.25, politenessEffect: 0.0, description: '"I guess" -> epistemic hedge' },
  { id: 'hg-epist-i-believe', regex: /\bi\s+believe\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.15, politenessEffect: 0.1, description: '"I believe" -> epistemic hedge' },
  { id: 'hg-epist-probably', regex: /\bprobably\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.12, politenessEffect: 0.05, description: '"probably" -> epistemic hedge' },
  { id: 'hg-epist-seemingly', regex: /\bseemingly\b/i, hedgeType: 'epistemic-hedge', confidenceModifier: -0.18, politenessEffect: 0.1, description: '"seemingly" -> epistemic hedge' },
  // Approximators
  { id: 'hg-approx-roughly', regex: /\broughly\b/i, hedgeType: 'approximator', confidenceModifier: -0.10, politenessEffect: 0.0, description: '"roughly" -> approximator' },
  { id: 'hg-approx-approximately', regex: /\bapproximately\b/i, hedgeType: 'approximator', confidenceModifier: -0.05, politenessEffect: 0.05, description: '"approximately" -> approximator' },
  { id: 'hg-approx-around', regex: /\baround\b/i, hedgeType: 'approximator', confidenceModifier: -0.10, politenessEffect: 0.0, description: '"around" -> approximator' },
  { id: 'hg-approx-about', regex: /\babout\b/i, hedgeType: 'approximator', confidenceModifier: -0.08, politenessEffect: 0.0, description: '"about" -> approximator' },
  { id: 'hg-approx-more-or-less', regex: /\bmore\s+or\s+less\b/i, hedgeType: 'approximator', confidenceModifier: -0.12, politenessEffect: 0.0, description: '"more or less" -> approximator' },
  // Shields
  { id: 'hg-shield-sort-of', regex: /\bsort\s+of\b/i, hedgeType: 'shield', confidenceModifier: -0.20, politenessEffect: 0.0, description: '"sort of" -> shield' },
  { id: 'hg-shield-kind-of', regex: /\bkind\s+of\b/i, hedgeType: 'shield', confidenceModifier: -0.20, politenessEffect: 0.0, description: '"kind of" -> shield' },
  { id: 'hg-shield-like', regex: /\blike\b/i, hedgeType: 'shield', confidenceModifier: -0.05, politenessEffect: 0.0, description: '"like" -> mild shield' },
  { id: 'hg-shield-basically', regex: /\bbasically\b/i, hedgeType: 'shield', confidenceModifier: -0.08, politenessEffect: 0.0, description: '"basically" -> shield' },
  // Downtoners
  { id: 'hg-down-a-little', regex: /\ba\s+little\b/i, hedgeType: 'downtoner', confidenceModifier: -0.10, politenessEffect: 0.0, description: '"a little" -> downtoner' },
  { id: 'hg-down-a-bit', regex: /\ba\s+bit\b/i, hedgeType: 'downtoner', confidenceModifier: -0.10, politenessEffect: 0.0, description: '"a bit" -> downtoner' },
  { id: 'hg-down-slightly', regex: /\bslightly\b/i, hedgeType: 'downtoner', confidenceModifier: -0.08, politenessEffect: 0.0, description: '"slightly" -> downtoner' },
  { id: 'hg-down-somewhat', regex: /\bsomewhat\b/i, hedgeType: 'downtoner', confidenceModifier: -0.12, politenessEffect: 0.0, description: '"somewhat" -> downtoner' },
  { id: 'hg-down-fairly', regex: /\bfairly\b/i, hedgeType: 'downtoner', confidenceModifier: -0.08, politenessEffect: 0.0, description: '"fairly" -> downtoner' },
  // Understaters
  { id: 'hg-under-not-very', regex: /\bnot\s+very\b/i, hedgeType: 'understater', confidenceModifier: -0.15, politenessEffect: 0.05, description: '"not very" -> understater' },
  { id: 'hg-under-not-really', regex: /\bnot\s+really\b/i, hedgeType: 'understater', confidenceModifier: -0.18, politenessEffect: 0.05, description: '"not really" -> understater' },
  { id: 'hg-under-not-quite', regex: /\bnot\s+quite\b/i, hedgeType: 'understater', confidenceModifier: -0.15, politenessEffect: 0.05, description: '"not quite" -> understater' },
  // Politeness markers (no confidence effect, only politeness)
  { id: 'hg-pol-please', regex: /\bplease\b/i, hedgeType: 'politeness-marker', confidenceModifier: 0, politenessEffect: 0.3, description: '"please" -> politeness marker' },
  { id: 'hg-pol-if-you-dont-mind', regex: /\bif\s+you\s+don't\s+mind\b/i, hedgeType: 'politeness-marker', confidenceModifier: -0.05, politenessEffect: 0.4, description: '"if you don\'t mind" -> politeness marker' },
  { id: 'hg-pol-if-possible', regex: /\bif\s+possible\b/i, hedgeType: 'politeness-marker', confidenceModifier: -0.08, politenessEffect: 0.25, description: '"if possible" -> politeness marker' },
  { id: 'hg-pol-when-you-can', regex: /\bwhen\s+you\s+can\b/i, hedgeType: 'politeness-marker', confidenceModifier: -0.05, politenessEffect: 0.2, description: '"when you can" -> politeness marker' },
  { id: 'hg-pol-kindly', regex: /\bkindly\b/i, hedgeType: 'politeness-marker', confidenceModifier: 0, politenessEffect: 0.35, description: '"kindly" -> politeness marker' },
  // Tentativeness markers
  { id: 'hg-tent-wondering', regex: /\bwondering\b/i, hedgeType: 'tentativeness-marker', confidenceModifier: -0.15, politenessEffect: 0.15, description: '"wondering" -> tentativeness marker' },
  { id: 'hg-tent-just', regex: /\bjust\b/i, hedgeType: 'tentativeness-marker', confidenceModifier: -0.05, politenessEffect: 0.1, description: '"just" -> tentativeness marker' },
  { id: 'hg-tent-was-thinking', regex: /\bwas\s+thinking\b/i, hedgeType: 'tentativeness-marker', confidenceModifier: -0.18, politenessEffect: 0.1, description: '"was thinking" -> tentativeness marker' },
];

/** Default hedge configuration. */
const DEFAULT_HEDGE_CONFIG: HedgeConfig = {
  minConfidence: 0.1,
  maxCumulativeModifier: -0.6,
  preserveActType: true,
  politenessWeights: {
    casual: 0.0,
    polite: 0.3,
    formal: 0.6,
    deferential: 1.0,
  },
};

/** Clarification tone templates by politeness level. */
const CLARIFICATION_TONES: ReadonlyMap<PolitenessLevel, ClarificationToneResult> = new Map<PolitenessLevel, ClarificationToneResult>([
  ['casual', { politenessLevel: 'casual', tonePrefix: '', toneSuffix: '', formality: 0.1, directness: 0.9 }],
  ['polite', { politenessLevel: 'polite', tonePrefix: 'Could you clarify: ', toneSuffix: '?', formality: 0.4, directness: 0.6 }],
  ['formal', { politenessLevel: 'formal', tonePrefix: 'I would like to confirm: ', toneSuffix: '. Could you elaborate?', formality: 0.7, directness: 0.4 }],
  ['deferential', { politenessLevel: 'deferential', tonePrefix: 'If I may ask, ', toneSuffix: '. I want to make sure I understand correctly.', formality: 0.9, directness: 0.2 }],
]);

// ---- 227 Functions ----

/** Detect all hedges in an utterance. */
export function detectHedges(utterance: string): HedgeDetection {
  const lower = utterance.toLowerCase();
  const matches: HedgeMatch[] = [];
  let totalModifier = 0;
  let totalPoliteness = 0;

  for (const pattern of HEDGE_PATTERNS) {
    const match = pattern.regex.exec(lower);
    if (match !== null) {
      matches.push({
        patternId: pattern.id,
        hedgeType: pattern.hedgeType,
        matchedText: match[0] ?? '',
        confidenceModifier: pattern.confidenceModifier,
        startIndex: match.index,
        endIndex: match.index + (match[0] ?? '').length,
      });
      totalModifier += pattern.confidenceModifier;
      totalPoliteness += pattern.politenessEffect;
    }
  }

  // Clamp cumulative modifier
  const clampedModifier = Math.max(DEFAULT_HEDGE_CONFIG.maxCumulativeModifier, totalModifier);
  const politenessLevel = computePolitenessFromScore(totalPoliteness);
  const stripped = stripHedges(utterance);

  return {
    utterance,
    hedgesFound: matches,
    totalConfidenceModifier: clampedModifier,
    politenessLevel,
    strippedUtterance: stripped,
    timestamp: Date.now(),
  };
}

/** Compute cumulative confidence modifier from detected hedges. */
export function computeConfidenceModifier(hedges: readonly HedgeMatch[]): number {
  let total = 0;
  for (const h of hedges) {
    total += h.confidenceModifier;
  }
  return Math.max(DEFAULT_HEDGE_CONFIG.maxCumulativeModifier, total);
}

/** Apply hedge effects to a speech act detection, adjusting confidence but preserving act type. */
export function applyHedgeEffects(
  speechAct: SpeechActDetection,
  hedgeDetection: HedgeDetection,
): HedgeEffect {
  const modifier = hedgeDetection.totalConfidenceModifier;
  const adjusted = Math.max(
    DEFAULT_HEDGE_CONFIG.minConfidence,
    speechAct.confidence + modifier,
  );
  return {
    originalConfidence: speechAct.confidence,
    adjustedConfidence: adjusted,
    totalModifier: modifier,
    hedgeCount: hedgeDetection.hedgesFound.length,
    actTypePreserved: true,
    politenessLevel: hedgeDetection.politenessLevel,
  };
}

/** Determine politeness level from an utterance. */
export function getPolitenessLevel(utterance: string): PolitenessLevel {
  const detection = detectHedges(utterance);
  return detection.politenessLevel;
}

/** Check if an utterance contains any hedging. */
export function isHedged(utterance: string): boolean {
  const detection = detectHedges(utterance);
  return detection.hedgesFound.length > 0;
}

/** Strip hedge words from an utterance, returning the core content. */
export function stripHedges(utterance: string): string {
  let result = utterance;
  for (const pattern of HEDGE_PATTERNS) {
    result = result.replace(pattern.regex, '');
  }
  // Collapse multiple spaces
  return result.replace(/\s{2,}/g, ' ').trim();
}

/** Return all hedge patterns (read-only). */
export function getHedgePatterns(): readonly HedgePattern[] {
  return HEDGE_PATTERNS;
}

/** Format hedge analysis into a structured summary. */
export function formatHedgeAnalysis(detection: HedgeDetection): HedgeAnalysis {
  const dummySpeechAct: SpeechActDetection = {
    utterance: detection.utterance,
    detectedAct: 'inform',
    force: 'assertive',
    effect: 'provide-info',
    confidence: 1.0,
    matchedPatterns: [],
    timestamp: Date.now(),
  };
  const effect = applyHedgeEffects(dummySpeechAct, detection);
  const hedgeNames = detection.hedgesFound.map(h => h.matchedText);
  const lines: string[] = [
    'Hedges found: ' + (hedgeNames.length > 0 ? hedgeNames.join(', ') : 'none'),
    'Total confidence modifier: ' + detection.totalConfidenceModifier.toFixed(2),
    'Politeness level: ' + detection.politenessLevel,
    'Stripped utterance: "' + detection.strippedUtterance + '"',
    'Act type preserved: ' + String(effect.actTypePreserved),
  ];
  return { detection, effect, summary: lines.join('\n') };
}

/** Detect hedges for a batch of utterances. */
export function batchDetectHedges(utterances: readonly string[]): readonly HedgeDetection[] {
  const results: HedgeDetection[] = [];
  for (const u of utterances) {
    results.push(detectHedges(u));
  }
  return results;
}

/** Adjust clarification tone based on detected politeness level. */
export function adjustClarificationTone(
  message: string,
  politenessLevel: PolitenessLevel,
): ClarificationToneResult {
  const tone = CLARIFICATION_TONES.get(politenessLevel);
  if (tone !== undefined) {
    return {
      politenessLevel: tone.politenessLevel,
      tonePrefix: tone.tonePrefix,
      toneSuffix: tone.toneSuffix,
      formality: tone.formality,
      directness: tone.directness,
    };
  }
  // Default to polite — message parameter available for future context-aware tone
  void message;
  return {
    politenessLevel: 'polite',
    tonePrefix: 'Could you clarify: ',
    toneSuffix: '?',
    formality: 0.4,
    directness: 0.6,
  };
}

/** Get effective confidence after applying hedges to a base confidence. */
export function getEffectiveConfidence(baseConfidence: number, utterance: string): number {
  const detection = detectHedges(utterance);
  const adjusted = baseConfidence + detection.totalConfidenceModifier;
  return Math.max(DEFAULT_HEDGE_CONFIG.minConfidence, Math.min(1.0, adjusted));
}

/** Categorize a hedge match into its general category. */
export function categorizeHedge(hedgeType: HedgeType): string {
  switch (hedgeType) {
    case 'modal-hedge': return 'modality';
    case 'epistemic-hedge': return 'epistemics';
    case 'approximator': return 'precision';
    case 'shield': return 'commitment';
    case 'downtoner': return 'intensity';
    case 'understater': return 'intensity';
    case 'politeness-marker': return 'social';
    case 'tentativeness-marker': return 'commitment';
  }
}

/** Internal: compute politeness level from raw score. */
function computePolitenessFromScore(score: number): PolitenessLevel {
  if (score >= 0.7) return 'deferential';
  if (score >= 0.4) return 'formal';
  if (score >= 0.15) return 'polite';
  return 'casual';
}


// ===================== STEP 228: INTENTION RECOGNITION =====================

// ---- 228 Types ----

/** Types of user intentions across multi-turn dialogue. */
export type IntentionType =
  | 'single-edit'
  | 'iterative-refinement'
  | 'exploration'
  | 'comparison'
  | 'workflow'
  | 'troubleshooting'
  | 'learning'
  | 'configuration';

/** A piece of evidence for an intention type. */
export interface IntentionEvidence {
  readonly evidenceId: string;
  readonly intentionType: IntentionType;
  readonly pattern: RegExp;
  readonly weight: number;
  readonly description: string;
  readonly turnBased: boolean;
}

/** A recognized user intention. */
export interface UserIntention {
  readonly id: string;
  readonly intentionType: IntentionType;
  readonly confidence: number;
  readonly evidence: readonly string[];
  readonly scope: string;
  readonly startTurn: number;
  readonly lastTurn: number;
  readonly turnCount: number;
  readonly metadata: Record<string, string>;
}

/** State of intention tracking across dialogue. */
export interface IntentionState {
  readonly currentIntention: UserIntention | null;
  readonly history: readonly UserIntention[];
  readonly turnCounter: number;
  readonly scopeEdits: Record<string, number>;
  readonly lastUpdated: number;
}

/** Configuration for intention recognition. */
export interface IntentionConfig {
  readonly iterativeThreshold: number;
  readonly explorationPatterns: readonly string[];
  readonly comparisonPatterns: readonly string[];
  readonly scopeStabilityTurns: number;
  readonly maxHistoryLength: number;
}

/** Intention analysis result. */
export interface IntentionAnalysis {
  readonly intention: UserIntention;
  readonly shouldMaintainScope: boolean;
  readonly shouldShowAlternatives: boolean;
  readonly predictedNextAction: string;
  readonly summary: string;
}

/** Evidence match result. */
export interface EvidenceMatchResult {
  readonly evidenceId: string;
  readonly matched: boolean;
  readonly weight: number;
  readonly matchedText: string;
}

/** Predicted next action based on intention. */
export interface PredictedAction {
  readonly intentionType: IntentionType;
  readonly actionLabel: string;
  readonly confidence: number;
  readonly description: string;
}

// ---- 228 Constants ----

/** Default intention configuration. */
const DEFAULT_INTENTION_CONFIG: IntentionConfig = {
  iterativeThreshold: 3,
  explorationPatterns: ['what if', 'try', 'explore', 'alternative'],
  comparisonPatterns: ['compare', 'versus', 'vs', 'or', 'which is better'],
  scopeStabilityTurns: 5,
  maxHistoryLength: 50,
};

/** All 32 intention evidence patterns. */
const INTENTION_EVIDENCE: readonly IntentionEvidence[] = [
  // Single edit evidence
  { evidenceId: 'ie-se-direct-cmd', intentionType: 'single-edit', pattern: /\b(change|set|make|add|remove|delete)\b/i, weight: 0.6, description: 'Direct edit command', turnBased: false },
  { evidenceId: 'ie-se-one-thing', intentionType: 'single-edit', pattern: /\b(just|only|simply)\b/i, weight: 0.4, description: 'Qualifier suggesting single action', turnBased: false },
  { evidenceId: 'ie-se-this-one', intentionType: 'single-edit', pattern: /\b(this|that)\s+(one|part|section)\b/i, weight: 0.5, description: 'Specific target reference', turnBased: false },
  // Iterative refinement evidence
  { evidenceId: 'ie-ir-more', intentionType: 'iterative-refinement', pattern: /\b(more|less|bigger|smaller|louder|quieter|faster|slower)\b/i, weight: 0.7, description: 'Degree modification suggests refinement', turnBased: false },
  { evidenceId: 'ie-ir-again', intentionType: 'iterative-refinement', pattern: /\b(again|still|yet|not enough|too much)\b/i, weight: 0.8, description: 'Repetition/continuation signal', turnBased: false },
  { evidenceId: 'ie-ir-tweak', intentionType: 'iterative-refinement', pattern: /\b(tweak|adjust|refine|fine-tune|polish)\b/i, weight: 0.9, description: 'Explicit refinement language', turnBased: false },
  { evidenceId: 'ie-ir-almost', intentionType: 'iterative-refinement', pattern: /\b(almost|close|nearly|getting there)\b/i, weight: 0.8, description: 'Near-completion signal', turnBased: false },
  { evidenceId: 'ie-ir-but', intentionType: 'iterative-refinement', pattern: /\b(but|however|except|although)\b.*\b(change|make|adjust)\b/i, weight: 0.7, description: 'Contrast with further edit', turnBased: false },
  { evidenceId: 'ie-ir-keep-going', intentionType: 'iterative-refinement', pattern: /\b(keep\s+going|continue|keep\s+at\s+it)\b/i, weight: 0.85, description: 'Explicit continuation', turnBased: false },
  // Exploration evidence
  { evidenceId: 'ie-ex-what-if', intentionType: 'exploration', pattern: /\bwhat\s+if\b/i, weight: 0.9, description: '"what if" -> exploration', turnBased: false },
  { evidenceId: 'ie-ex-try', intentionType: 'exploration', pattern: /\b(try|experiment|test)\b/i, weight: 0.6, description: 'Experimental language', turnBased: false },
  { evidenceId: 'ie-ex-wonder', intentionType: 'exploration', pattern: /\b(wonder|curious|what\s+would)\b/i, weight: 0.7, description: 'Curiosity expression', turnBased: false },
  { evidenceId: 'ie-ex-alternative', intentionType: 'exploration', pattern: /\b(alternative|another\s+way|different\s+approach)\b/i, weight: 0.8, description: 'Seeking alternatives', turnBased: false },
  { evidenceId: 'ie-ex-possibilities', intentionType: 'exploration', pattern: /\b(possibilities|options|choices)\b/i, weight: 0.7, description: 'Exploring option space', turnBased: false },
  // Comparison evidence
  { evidenceId: 'ie-co-compare', intentionType: 'comparison', pattern: /\b(compare|versus|vs\.?|side\s+by\s+side)\b/i, weight: 0.9, description: 'Explicit comparison', turnBased: false },
  { evidenceId: 'ie-co-which', intentionType: 'comparison', pattern: /\bwhich\s+(is|sounds|looks)\s+(better|best|nicer)\b/i, weight: 0.85, description: 'Evaluative comparison', turnBased: false },
  { evidenceId: 'ie-co-or', intentionType: 'comparison', pattern: /\bshould\s+i\s+.+\s+or\s+/i, weight: 0.7, description: 'Disjunctive question', turnBased: false },
  { evidenceId: 'ie-co-try-then', intentionType: 'comparison', pattern: /\btry\s+.+\s+then\s+.+/i, weight: 0.75, description: '"try X then Y" -> comparison', turnBased: false },
  { evidenceId: 'ie-co-both', intentionType: 'comparison', pattern: /\b(both|either|a\s+and\s+b)\b/i, weight: 0.6, description: 'Both/either signal', turnBased: false },
  // Workflow evidence
  { evidenceId: 'ie-wf-step', intentionType: 'workflow', pattern: /\b(step|first|then|next|after\s+that|finally)\b/i, weight: 0.7, description: 'Sequential language', turnBased: false },
  { evidenceId: 'ie-wf-workflow', intentionType: 'workflow', pattern: /\b(workflow|process|pipeline|procedure)\b/i, weight: 0.9, description: 'Explicit workflow term', turnBased: false },
  { evidenceId: 'ie-wf-batch', intentionType: 'workflow', pattern: /\b(batch|all\s+of|every|each)\b/i, weight: 0.6, description: 'Batch operation language', turnBased: false },
  // Troubleshooting evidence
  { evidenceId: 'ie-ts-broken', intentionType: 'troubleshooting', pattern: /\b(broken|wrong|bug|issue|problem|error|doesn't\s+work)\b/i, weight: 0.85, description: 'Problem indication', turnBased: false },
  { evidenceId: 'ie-ts-fix', intentionType: 'troubleshooting', pattern: /\b(fix|repair|solve|resolve|debug)\b/i, weight: 0.8, description: 'Fix language', turnBased: false },
  { evidenceId: 'ie-ts-why-not', intentionType: 'troubleshooting', pattern: /\bwhy\s+(isn't|doesn't|won't|can't)\b/i, weight: 0.8, description: 'Diagnostic question', turnBased: false },
  // Learning evidence
  { evidenceId: 'ie-ln-explain', intentionType: 'learning', pattern: /\b(explain|teach|show\s+me\s+how|what\s+does)\b/i, weight: 0.8, description: 'Explanation request', turnBased: false },
  { evidenceId: 'ie-ln-understand', intentionType: 'learning', pattern: /\b(understand|learn|meaning|concept)\b/i, weight: 0.7, description: 'Understanding language', turnBased: false },
  { evidenceId: 'ie-ln-example', intentionType: 'learning', pattern: /\b(example|demo|demonstration|tutorial)\b/i, weight: 0.75, description: 'Example request', turnBased: false },
  // Configuration evidence
  { evidenceId: 'ie-cf-settings', intentionType: 'configuration', pattern: /\b(settings?|config|configure|preference|option)\b/i, weight: 0.85, description: 'Configuration language', turnBased: false },
  { evidenceId: 'ie-cf-default', intentionType: 'configuration', pattern: /\b(default|always|every\s+time|permanently)\b/i, weight: 0.7, description: 'Permanence indicator', turnBased: false },
  { evidenceId: 'ie-cf-setup', intentionType: 'configuration', pattern: /\b(setup|initialize|install|enable|disable)\b/i, weight: 0.75, description: 'Setup language', turnBased: false },
  { evidenceId: 'ie-cf-toggle', intentionType: 'configuration', pattern: /\b(toggle|switch|turn\s+(on|off))\b/i, weight: 0.8, description: 'Toggle language', turnBased: false },
];

/** Predicted actions by intention type. */
const PREDICTED_ACTIONS: ReadonlyMap<IntentionType, PredictedAction> = new Map<IntentionType, PredictedAction>([
  ['single-edit', { intentionType: 'single-edit', actionLabel: 'apply-edit', confidence: 0.8, description: 'User will apply a single edit and move on' }],
  ['iterative-refinement', { intentionType: 'iterative-refinement', actionLabel: 'refine-again', confidence: 0.75, description: 'User will continue refining the same scope' }],
  ['exploration', { intentionType: 'exploration', actionLabel: 'explore-variant', confidence: 0.7, description: 'User will explore another variant' }],
  ['comparison', { intentionType: 'comparison', actionLabel: 'select-preferred', confidence: 0.65, description: 'User will select a preferred variant' }],
  ['workflow', { intentionType: 'workflow', actionLabel: 'next-step', confidence: 0.7, description: 'User will proceed to the next workflow step' }],
  ['troubleshooting', { intentionType: 'troubleshooting', actionLabel: 'diagnose-further', confidence: 0.6, description: 'User will provide more diagnostic info' }],
  ['learning', { intentionType: 'learning', actionLabel: 'ask-followup', confidence: 0.7, description: 'User will ask a follow-up question' }],
  ['configuration', { intentionType: 'configuration', actionLabel: 'set-preference', confidence: 0.75, description: 'User will finalize a configuration' }],
]);

// ---- 228 Functions ----

/** Recognize user intention from an utterance and current state. */
export function recognizeIntention(
  utterance: string,
  state: IntentionState,
): UserIntention {
  const scores: Record<string, number> = {};
  const evidenceIds: string[] = [];

  for (const ev of INTENTION_EVIDENCE) {
    if (ev.pattern.test(utterance)) {
      const typeKey = ev.intentionType;
      const prev = scores[typeKey];
      scores[typeKey] = (prev !== undefined ? prev : 0) + ev.weight;
      evidenceIds.push(ev.evidenceId);
    }
  }

  // Turn-based heuristic: repeated edits to same scope -> iterative refinement
  const currentScope = state.currentIntention !== null ? state.currentIntention.scope : 'global';
  const scopeEditCount = state.scopeEdits[currentScope];
  if (scopeEditCount !== undefined && scopeEditCount >= DEFAULT_INTENTION_CONFIG.iterativeThreshold) {
    const prevIR = scores['iterative-refinement'];
    scores['iterative-refinement'] = (prevIR !== undefined ? prevIR : 0) + 1.0;
    evidenceIds.push('turn-based-repetition');
  }

  // Find best intention
  let bestType: IntentionType = 'single-edit';
  let bestScore = 0;
  const intentionTypes: IntentionType[] = [
    'single-edit', 'iterative-refinement', 'exploration', 'comparison',
    'workflow', 'troubleshooting', 'learning', 'configuration',
  ];
  for (const it of intentionTypes) {
    const s = scores[it];
    if (s !== undefined && s > bestScore) {
      bestScore = s;
      bestType = it;
    }
  }

  const confidence = Math.min(1.0, bestScore / 2.0);

  return {
    id: generateId('int'),
    intentionType: bestType,
    confidence,
    evidence: evidenceIds,
    scope: currentScope,
    startTurn: state.currentIntention !== null ? state.currentIntention.startTurn : state.turnCounter,
    lastTurn: state.turnCounter,
    turnCount: state.currentIntention !== null
      ? state.currentIntention.turnCount + 1
      : 1,
    metadata: {},
  };
}

/** Update the intention state with a new recognized intention. */
export function updateIntentionState(
  state: IntentionState,
  intention: UserIntention,
): IntentionState {
  const newHistory = state.history.length >= DEFAULT_INTENTION_CONFIG.maxHistoryLength
    ? [...state.history.slice(1), intention]
    : [...state.history, intention];

  const newScopeEdits: Record<string, number> = { ...state.scopeEdits };
  const prev = newScopeEdits[intention.scope];
  newScopeEdits[intention.scope] = (prev !== undefined ? prev : 0) + 1;

  return {
    currentIntention: intention,
    history: newHistory,
    turnCounter: state.turnCounter + 1,
    scopeEdits: newScopeEdits,
    lastUpdated: Date.now(),
  };
}

/** Get the intention type from a user intention. */
export function getIntentionType(intention: UserIntention): IntentionType {
  return intention.intentionType;
}

/** Get evidence details for a user intention. */
export function getIntentionEvidence(intention: UserIntention): readonly string[] {
  return intention.evidence;
}

/** Check whether the user is in an iterative refinement loop. */
export function isIterativeRefinement(intention: UserIntention): boolean {
  return intention.intentionType === 'iterative-refinement';
}

/** Check whether the user is in exploration mode. */
export function isExploration(intention: UserIntention): boolean {
  return intention.intentionType === 'exploration';
}

/** Whether the system should maintain stable scope (no re-clarification). */
export function shouldMaintainScope(intention: UserIntention): boolean {
  return intention.intentionType === 'iterative-refinement'
    || intention.intentionType === 'workflow';
}

/** Format intention analysis into a structured summary. */
export function formatIntentionAnalysis(intention: UserIntention): IntentionAnalysis {
  const maintainScope = shouldMaintainScope(intention);
  const showAlternatives = isExploration(intention) || intention.intentionType === 'comparison';
  const predicted = predictNextAction(intention);
  const lines: string[] = [
    'Intention: ' + intention.intentionType,
    'Confidence: ' + (intention.confidence * 100).toFixed(0) + '%',
    'Scope: ' + intention.scope,
    'Turn count: ' + String(intention.turnCount),
    'Maintain scope: ' + String(maintainScope),
    'Show alternatives: ' + String(showAlternatives),
    'Predicted next: ' + predicted.actionLabel,
    'Evidence: ' + (intention.evidence.length > 0 ? intention.evidence.join(', ') : 'none'),
  ];
  return {
    intention,
    shouldMaintainScope: maintainScope,
    shouldShowAlternatives: showAlternatives,
    predictedNextAction: predicted.actionLabel,
    summary: lines.join('\n'),
  };
}

/** Get intention history from state. */
export function getIntentionHistory(state: IntentionState): readonly UserIntention[] {
  return state.history;
}

/** Predict the user's next action based on their current intention. */
export function predictNextAction(intention: UserIntention): PredictedAction {
  return PREDICTED_ACTIONS.get(intention.intentionType) ?? {
    intentionType: intention.intentionType,
    actionLabel: 'unknown',
    confidence: 0.3,
    description: 'Unable to predict next action',
  };
}

/** Recognize intentions for a batch of utterances. */
export function batchRecognizeIntentions(
  utterances: readonly string[],
  initialState: IntentionState,
): readonly UserIntention[] {
  let state = initialState;
  const results: UserIntention[] = [];
  for (const u of utterances) {
    const intention = recognizeIntention(u, state);
    results.push(intention);
    state = updateIntentionState(state, intention);
  }
  return results;
}

/** Reset intention state to a clean state. */
export function resetIntentionState(): IntentionState {
  return {
    currentIntention: null,
    history: [],
    turnCounter: 0,
    scopeEdits: {},
    lastUpdated: Date.now(),
  };
}


// ===================== STEP 229: PLAN CONFIRMATION MOVES =====================

// ---- 229 Types ----

/** Confirmation state for a proposed plan. */
export type ConfirmationState = 'pending' | 'confirmed' | 'rejected' | 'modified' | 'expired';

/** Confirmation policy governing auto-confirmation behavior. */
export type ConfirmationPolicy =
  | 'always-confirm'
  | 'confirm-if-risky'
  | 'auto-confirm-safe'
  | 'never-auto-confirm';

/** A confirmation move detected in user input. */
export interface ConfirmationMove {
  readonly id: string;
  readonly moveType: ConfirmationState;
  readonly utterance: string;
  readonly matchedPattern: string;
  readonly confidence: number;
  readonly modification: string | null;
  readonly timestamp: number;
}

/** Pattern for detecting confirmation moves. */
export interface ConfirmationPattern {
  readonly id: string;
  readonly regex: RegExp;
  readonly moveType: ConfirmationState;
  readonly confidence: number;
  readonly description: string;
}

/** A gated plan awaiting confirmation. */
export interface ConfirmationGate {
  readonly gateId: string;
  readonly planId: string;
  readonly planDescription: string;
  readonly state: ConfirmationState;
  readonly policy: ConfirmationPolicy;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly createdAt: number;
  readonly expiresAfterTurns: number;
  readonly turnsSinceCreation: number;
  readonly confirmationMove: ConfirmationMove | null;
  readonly metadata: Record<string, string>;
}

/** Configuration for confirmation behavior. */
export interface ConfirmationConfig {
  readonly defaultPolicy: ConfirmationPolicy;
  readonly expiryTurns: number;
  readonly autoConfirmRiskThreshold: 'low' | 'medium' | 'high';
  readonly requireExplicitForDestructive: boolean;
}

/** Confirmation history entry. */
export interface ConfirmationHistoryEntry {
  readonly gateId: string;
  readonly planId: string;
  readonly finalState: ConfirmationState;
  readonly turnCount: number;
  readonly timestamp: number;
}

/** Confirmation status report. */
export interface ConfirmationStatus {
  readonly gate: ConfirmationGate;
  readonly isActionable: boolean;
  readonly statusMessage: string;
  readonly remainingTurns: number;
}

// ---- 229 Constants ----

/** All 27 confirmation detection patterns. */
const CONFIRMATION_PATTERNS: readonly ConfirmationPattern[] = [
  // Confirm patterns (12)
  { id: 'cp-yes', regex: /^\s*(yes)\b/i, moveType: 'confirmed', confidence: 0.95, description: '"yes" -> confirm' },
  { id: 'cp-yeah', regex: /^\s*(yeah|yep|yup)\b/i, moveType: 'confirmed', confidence: 0.9, description: '"yeah/yep" -> confirm' },
  { id: 'cp-do-it', regex: /\b(do\s+it)\b/i, moveType: 'confirmed', confidence: 0.95, description: '"do it" -> confirm' },
  { id: 'cp-go-ahead', regex: /\b(go\s+ahead)\b/i, moveType: 'confirmed', confidence: 0.95, description: '"go ahead" -> confirm' },
  { id: 'cp-apply', regex: /\b(apply)\b/i, moveType: 'confirmed', confidence: 0.9, description: '"apply" -> confirm' },
  { id: 'cp-confirm', regex: /\b(confirm)\b/i, moveType: 'confirmed', confidence: 0.95, description: '"confirm" -> confirm' },
  { id: 'cp-execute', regex: /\b(execute)\b/i, moveType: 'confirmed', confidence: 0.9, description: '"execute" -> confirm' },
  { id: 'cp-run-it', regex: /\b(run\s+it)\b/i, moveType: 'confirmed', confidence: 0.9, description: '"run it" -> confirm' },
  { id: 'cp-ok', regex: /^\s*(ok|okay|sure|alright|fine)\b/i, moveType: 'confirmed', confidence: 0.85, description: '"ok/sure" -> confirm' },
  { id: 'cp-proceed', regex: /\b(proceed|continue|accept)\b/i, moveType: 'confirmed', confidence: 0.9, description: '"proceed" -> confirm' },
  { id: 'cp-looks-good', regex: /\b(looks?\s+good|sounds?\s+good|perfect)\b/i, moveType: 'confirmed', confidence: 0.85, description: '"looks good" -> confirm' },
  { id: 'cp-thats-right', regex: /\b(that'?s?\s+right|correct|exactly)\b/i, moveType: 'confirmed', confidence: 0.9, description: '"that\'s right" -> confirm' },
  // Reject patterns (8)
  { id: 'cp-no', regex: /^\s*(no)\b/i, moveType: 'rejected', confidence: 0.9, description: '"no" -> reject' },
  { id: 'cp-nope', regex: /^\s*(nope|nah)\b/i, moveType: 'rejected', confidence: 0.9, description: '"nope" -> reject' },
  { id: 'cp-cancel', regex: /\b(cancel)\b/i, moveType: 'rejected', confidence: 0.95, description: '"cancel" -> reject' },
  { id: 'cp-stop', regex: /\b(stop)\b/i, moveType: 'rejected', confidence: 0.9, description: '"stop" -> reject' },
  { id: 'cp-abort', regex: /\b(abort)\b/i, moveType: 'rejected', confidence: 0.95, description: '"abort" -> reject' },
  { id: 'cp-wait', regex: /^\s*(wait)\b/i, moveType: 'rejected', confidence: 0.7, description: '"wait" -> reject (soft)' },
  { id: 'cp-dont', regex: /\b(don'?t|do\s+not)\b/i, moveType: 'rejected', confidence: 0.85, description: '"don\'t" -> reject' },
  { id: 'cp-never-mind', regex: /\b(never\s+mind|forget\s+it)\b/i, moveType: 'rejected', confidence: 0.9, description: '"never mind" -> reject' },
  // Modify patterns (4)
  { id: 'cp-but-change', regex: /\bbut\s+(change|modify|adjust|update)\b/i, moveType: 'modified', confidence: 0.85, description: '"but change X" -> modify' },
  { id: 'cp-except', regex: /\b(except|but\s+first|however)\b/i, moveType: 'modified', confidence: 0.7, description: '"except/but first" -> modify' },
  { id: 'cp-almost', regex: /\b(almost|close\s+but|not\s+quite)\b/i, moveType: 'modified', confidence: 0.75, description: '"almost" -> modify' },
  { id: 'cp-instead', regex: /\b(instead)\b/i, moveType: 'modified', confidence: 0.8, description: '"instead" -> modify' },
  // Re-present / pending patterns (3)
  { id: 'cp-show-again', regex: /\b(show\s+me\s+again|repeat|re-?show)\b/i, moveType: 'pending', confidence: 0.8, description: '"show me again" -> re-present' },
  { id: 'cp-what-was', regex: /\b(what\s+was\s+(that|it)|remind\s+me)\b/i, moveType: 'pending', confidence: 0.75, description: '"what was that" -> re-present' },
  { id: 'cp-let-me-see', regex: /\b(let\s+me\s+see|show\s+me)\b/i, moveType: 'pending', confidence: 0.7, description: '"let me see" -> re-present' },
];

/** Default confirmation configuration. */
const DEFAULT_CONFIRMATION_CONFIG: ConfirmationConfig = {
  defaultPolicy: 'confirm-if-risky',
  expiryTurns: 5,
  autoConfirmRiskThreshold: 'low',
  requireExplicitForDestructive: true,
};

/** Risk level order for comparison. */
const RISK_ORDER: ReadonlyMap<string, number> = new Map<string, number>([
  ['low', 0],
  ['medium', 1],
  ['high', 2],
]);

// ---- 229 Functions ----

/** Detect a confirmation move in user input. */
export function detectConfirmationMove(utterance: string): ConfirmationMove {
  const lower = utterance.toLowerCase().trim();
  let bestMove: ConfirmationState = 'pending';
  let bestConfidence = 0;
  let bestPatternId = 'none';
  let modification: string | null = null;

  for (const pattern of CONFIRMATION_PATTERNS) {
    if (pattern.regex.test(lower)) {
      if (pattern.confidence > bestConfidence) {
        bestConfidence = pattern.confidence;
        bestMove = pattern.moveType;
        bestPatternId = pattern.id;
      }
    }
  }

  // Extract modification text if move is 'modified'
  if (bestMove === 'modified') {
    const modMatch = /\b(?:but|except|instead)\s+(.+)/i.exec(lower);
    if (modMatch !== null) {
      const captured = modMatch[1];
      if (captured !== undefined) {
        modification = captured.trim();
      }
    }
  }

  return {
    id: generateId('cm'),
    moveType: bestMove,
    utterance,
    matchedPattern: bestPatternId,
    confidence: bestConfidence,
    ...(modification !== null ? { modification } : { modification: null }),
    timestamp: Date.now(),
  };
}

/** Process a confirmation move against a pending gate. */
export function processConfirmation(
  gate: ConfirmationGate,
  move: ConfirmationMove,
): ConfirmationGate {
  if (gate.state !== 'pending') {
    return gate;
  }

  return {
    gateId: gate.gateId,
    planId: gate.planId,
    planDescription: gate.planDescription,
    state: move.moveType,
    policy: gate.policy,
    riskLevel: gate.riskLevel,
    createdAt: gate.createdAt,
    expiresAfterTurns: gate.expiresAfterTurns,
    turnsSinceCreation: gate.turnsSinceCreation,
    confirmationMove: move,
    metadata: gate.metadata,
  };
}

/** Check if a gate is in confirmed state. */
export function isConfirmed(gate: ConfirmationGate): boolean {
  return gate.state === 'confirmed';
}

/** Check if a gate is in rejected state. */
export function isRejected(gate: ConfirmationGate): boolean {
  return gate.state === 'rejected';
}

/** Check if a gate is still pending. */
export function isPending(gate: ConfirmationGate): boolean {
  return gate.state === 'pending';
}

/** Get the confirmation state of a gate. */
export function getConfirmationState(gate: ConfirmationGate): ConfirmationState {
  return gate.state;
}

/** Set the confirmation policy on a gate. */
export function setConfirmationPolicy(
  gate: ConfirmationGate,
  policy: ConfirmationPolicy,
): ConfirmationGate {
  return {
    gateId: gate.gateId,
    planId: gate.planId,
    planDescription: gate.planDescription,
    state: gate.state,
    policy,
    riskLevel: gate.riskLevel,
    createdAt: gate.createdAt,
    expiresAfterTurns: gate.expiresAfterTurns,
    turnsSinceCreation: gate.turnsSinceCreation,
    confirmationMove: gate.confirmationMove,
    metadata: gate.metadata,
  };
}

/** Check whether a gate allows execution (confirmed or auto-confirmed). */
export function checkGate(gate: ConfirmationGate): boolean {
  if (gate.state === 'confirmed') return true;
  if (gate.state === 'rejected' || gate.state === 'expired') return false;
  if (gate.state === 'modified') return false;

  // Auto-confirm logic
  return autoConfirmCheck(gate, DEFAULT_CONFIRMATION_CONFIG);
}

/** Expire stale confirmations that have exceeded their turn limit. */
export function expireStaleConfirmations(
  gates: readonly ConfirmationGate[],
  currentTurn: number,
): readonly ConfirmationGate[] {
  const results: ConfirmationGate[] = [];
  for (const gate of gates) {
    if (gate.state === 'pending') {
      const elapsed = currentTurn - gate.turnsSinceCreation;
      if (elapsed >= gate.expiresAfterTurns) {
        results.push({
          gateId: gate.gateId,
          planId: gate.planId,
          planDescription: gate.planDescription,
          state: 'expired',
          policy: gate.policy,
          riskLevel: gate.riskLevel,
          createdAt: gate.createdAt,
          expiresAfterTurns: gate.expiresAfterTurns,
          turnsSinceCreation: elapsed,
          confirmationMove: gate.confirmationMove,
          metadata: gate.metadata,
        });
      } else {
        results.push({
          gateId: gate.gateId,
          planId: gate.planId,
          planDescription: gate.planDescription,
          state: gate.state,
          policy: gate.policy,
          riskLevel: gate.riskLevel,
          createdAt: gate.createdAt,
          expiresAfterTurns: gate.expiresAfterTurns,
          turnsSinceCreation: elapsed,
          confirmationMove: gate.confirmationMove,
          metadata: gate.metadata,
        });
      }
    } else {
      results.push(gate);
    }
  }
  return results;
}

/** Format confirmation status for display. */
export function formatConfirmationStatus(gate: ConfirmationGate): ConfirmationStatus {
  const remaining = gate.expiresAfterTurns - gate.turnsSinceCreation;
  let message: string;
  let actionable: boolean;

  switch (gate.state) {
    case 'pending':
      message = 'Plan "' + gate.planDescription + '" is awaiting confirmation (' + String(remaining) + ' turns remaining)';
      actionable = true;
      break;
    case 'confirmed':
      message = 'Plan "' + gate.planDescription + '" has been confirmed and is ready to execute';
      actionable = true;
      break;
    case 'rejected':
      message = 'Plan "' + gate.planDescription + '" was rejected';
      actionable = false;
      break;
    case 'modified':
      message = 'Plan "' + gate.planDescription + '" requires modification before execution';
      actionable = false;
      break;
    case 'expired':
      message = 'Plan "' + gate.planDescription + '" has expired without confirmation';
      actionable = false;
      break;
  }

  return {
    gate,
    isActionable: actionable,
    statusMessage: message,
    remainingTurns: Math.max(0, remaining),
  };
}

/** Process confirmations for a batch of gates with the same move. */
export function batchProcessConfirmations(
  gates: readonly ConfirmationGate[],
  move: ConfirmationMove,
): readonly ConfirmationGate[] {
  const results: ConfirmationGate[] = [];
  for (const gate of gates) {
    results.push(processConfirmation(gate, move));
  }
  return results;
}

/** Get confirmation history from a list of gates. */
export function getConfirmationHistory(
  gates: readonly ConfirmationGate[],
): readonly ConfirmationHistoryEntry[] {
  const entries: ConfirmationHistoryEntry[] = [];
  for (const gate of gates) {
    if (gate.state !== 'pending') {
      entries.push({
        gateId: gate.gateId,
        planId: gate.planId,
        finalState: gate.state,
        turnCount: gate.turnsSinceCreation,
        timestamp: gate.createdAt,
      });
    }
  }
  return entries;
}

/** Check whether a plan requires explicit confirmation based on policy and risk. */
export function requiresExplicitConfirmation(
  policy: ConfirmationPolicy,
  riskLevel: 'low' | 'medium' | 'high',
): boolean {
  switch (policy) {
    case 'always-confirm':
      return true;
    case 'never-auto-confirm':
      return true;
    case 'confirm-if-risky':
      return riskLevel === 'medium' || riskLevel === 'high';
    case 'auto-confirm-safe':
      return riskLevel !== 'low';
  }
}

/** Check whether a gate can be auto-confirmed based on policy and risk. */
export function autoConfirmCheck(
  gate: ConfirmationGate,
  config: ConfirmationConfig,
): boolean {
  if (gate.state !== 'pending') return false;

  switch (gate.policy) {
    case 'always-confirm':
      return false;
    case 'never-auto-confirm':
      return false;
    case 'auto-confirm-safe': {
      const gateRisk = RISK_ORDER.get(gate.riskLevel) ?? 2;
      const threshold = RISK_ORDER.get(config.autoConfirmRiskThreshold) ?? 0;
      return gateRisk <= threshold;
    }
    case 'confirm-if-risky': {
      const gateRisk2 = RISK_ORDER.get(gate.riskLevel) ?? 2;
      return gateRisk2 === 0;
    }
  }
}

/** Create a new confirmation gate for a plan. */
export function createConfirmationGate(
  planId: string,
  planDescription: string,
  riskLevel: 'low' | 'medium' | 'high',
  policy?: ConfirmationPolicy,
): ConfirmationGate {
  const effectivePolicy = policy !== undefined ? policy : DEFAULT_CONFIRMATION_CONFIG.defaultPolicy;
  return {
    gateId: generateId('cg'),
    planId,
    planDescription,
    state: 'pending',
    policy: effectivePolicy,
    riskLevel,
    createdAt: Date.now(),
    expiresAfterTurns: DEFAULT_CONFIRMATION_CONFIG.expiryTurns,
    turnsSinceCreation: 0,
    confirmationMove: null,
    metadata: {},
  };
}

/** Advance a gate's turn counter. */
export function advanceGateTurn(gate: ConfirmationGate): ConfirmationGate {
  const newTurns = gate.turnsSinceCreation + 1;
  const newState: ConfirmationState = newTurns >= gate.expiresAfterTurns ? 'expired' : gate.state;
  return {
    gateId: gate.gateId,
    planId: gate.planId,
    planDescription: gate.planDescription,
    state: newState,
    policy: gate.policy,
    riskLevel: gate.riskLevel,
    createdAt: gate.createdAt,
    expiresAfterTurns: gate.expiresAfterTurns,
    turnsSinceCreation: newTurns,
    confirmationMove: gate.confirmationMove,
    metadata: gate.metadata,
  };
}


// ===================== STEP 230: COUNTERFACTUAL EXPLORATION =====================

// ---- 230 Types ----

/** Exploration mode for counterfactual reasoning. */
export type ExplorationMode =
  | 'what-if'
  | 'try-this'
  | 'compare'
  | 'rollback'
  | 'branch'
  | 'preview';

/** A counterfactual request from the user. */
export interface CounterfactualRequest {
  readonly id: string;
  readonly mode: ExplorationMode;
  readonly utterance: string;
  readonly description: string;
  readonly confidence: number;
  readonly matchedPattern: string;
  readonly timestamp: number;
}

/** A counterfactual plan result. */
export interface CounterfactualResult {
  readonly id: string;
  readonly requestId: string;
  readonly planDescription: string;
  readonly changes: readonly CounterfactualChange[];
  readonly isApplied: boolean;
  readonly isDiscarded: boolean;
  readonly rollbackPointId: string | null;
  readonly createdAt: number;
  readonly metadata: Record<string, string>;
}

/** A single change within a counterfactual plan. */
export interface CounterfactualChange {
  readonly changeId: string;
  readonly target: string;
  readonly property: string;
  readonly oldValue: string;
  readonly newValue: string;
  readonly description: string;
}

/** Comparison between two counterfactual results. */
export interface CounterfactualComparison {
  readonly id: string;
  readonly resultA: CounterfactualResult;
  readonly resultB: CounterfactualResult;
  readonly differences: readonly ComparisonDifference[];
  readonly summary: string;
  readonly recommendation: string;
}

/** A single difference in a comparison. */
export interface ComparisonDifference {
  readonly target: string;
  readonly property: string;
  readonly valueA: string;
  readonly valueB: string;
  readonly significance: 'low' | 'medium' | 'high';
}

/** A rollback point for counterfactual exploration. */
export interface RollbackPoint {
  readonly id: string;
  readonly label: string;
  readonly createdAt: number;
  readonly stateSnapshot: Record<string, string>;
  readonly isActive: boolean;
}

/** Pattern for detecting counterfactual requests. */
export interface CounterfactualPattern {
  readonly id: string;
  readonly regex: RegExp;
  readonly mode: ExplorationMode;
  readonly confidence: number;
  readonly description: string;
}

/** Configuration for counterfactual exploration. */
export interface CounterfactualConfig {
  readonly maxActivePlans: number;
  readonly maxRollbackPoints: number;
  readonly autoDiscardAfterTurns: number;
  readonly enableBranching: boolean;
}

/** Exploration history entry. */
export interface ExplorationHistoryEntry {
  readonly requestId: string;
  readonly mode: ExplorationMode;
  readonly outcome: 'applied' | 'discarded' | 'pending';
  readonly timestamp: number;
}

// ---- 230 Constants ----

/** All 28 counterfactual detection patterns. */
const COUNTERFACTUAL_PATTERNS: readonly CounterfactualPattern[] = [
  // What-if patterns (7)
  { id: 'cf-whatif-we', regex: /\bwhat\s+if\s+we\b/i, mode: 'what-if', confidence: 0.95, description: '"what if we X" -> what-if' },
  { id: 'cf-whatif-i', regex: /\bwhat\s+if\s+i\b/i, mode: 'what-if', confidence: 0.9, description: '"what if I X" -> what-if' },
  { id: 'cf-whatif-general', regex: /\bwhat\s+if\b/i, mode: 'what-if', confidence: 0.85, description: '"what if" -> what-if' },
  { id: 'cf-whatwould', regex: /\bwhat\s+would\s+happen\b/i, mode: 'what-if', confidence: 0.9, description: '"what would happen" -> what-if' },
  { id: 'cf-suppose', regex: /\b(suppose|assuming)\s+/i, mode: 'what-if', confidence: 0.8, description: '"suppose/assuming X" -> what-if' },
  { id: 'cf-imagine', regex: /\bimagine\s+/i, mode: 'what-if', confidence: 0.75, description: '"imagine X" -> what-if' },
  { id: 'cf-hypothetically', regex: /\bhypothetically\b/i, mode: 'what-if', confidence: 0.85, description: '"hypothetically" -> what-if' },
  // Try-this patterns (5)
  { id: 'cf-try-lets', regex: /\blet'?s\s+try\b/i, mode: 'try-this', confidence: 0.85, description: '"let\'s try X" -> try-this' },
  { id: 'cf-try-can-we', regex: /\bcan\s+we\s+try\b/i, mode: 'try-this', confidence: 0.85, description: '"can we try X" -> try-this' },
  { id: 'cf-try-experiment', regex: /\b(experiment|test\s+out)\b/i, mode: 'try-this', confidence: 0.7, description: '"experiment" -> try-this' },
  { id: 'cf-try-howabout', regex: /\bhow\s+about\s+trying\b/i, mode: 'try-this', confidence: 0.8, description: '"how about trying" -> try-this' },
  { id: 'cf-try-without-commit', regex: /\btry\s+.+\s+without\s+(committing|applying|saving)\b/i, mode: 'try-this', confidence: 0.9, description: '"try X without applying" -> try-this' },
  // Compare patterns (5)
  { id: 'cf-compare', regex: /\bcompare\b/i, mode: 'compare', confidence: 0.9, description: '"compare X and Y" -> compare' },
  { id: 'cf-versus', regex: /\b(versus|vs\.?)\b/i, mode: 'compare', confidence: 0.85, description: '"X versus Y" -> compare' },
  { id: 'cf-side-by-side', regex: /\bside\s+by\s+side\b/i, mode: 'compare', confidence: 0.9, description: '"side by side" -> compare' },
  { id: 'cf-difference', regex: /\bwhat'?s?\s+the\s+difference\b/i, mode: 'compare', confidence: 0.85, description: '"what\'s the difference" -> compare' },
  { id: 'cf-better', regex: /\bwhich\s+(is|sounds|looks)\s+(better|best)\b/i, mode: 'compare', confidence: 0.8, description: '"which is better" -> compare' },
  // Rollback patterns (4)
  { id: 'cf-rollback', regex: /\b(rollback|roll\s+back|revert)\b/i, mode: 'rollback', confidence: 0.95, description: '"rollback" -> rollback' },
  { id: 'cf-goback', regex: /\bgo\s+back\s+to\b/i, mode: 'rollback', confidence: 0.85, description: '"go back to" -> rollback' },
  { id: 'cf-restore', regex: /\brestore\b/i, mode: 'rollback', confidence: 0.8, description: '"restore" -> rollback' },
  { id: 'cf-undo-last', regex: /\bundo\s+(the\s+)?last\b/i, mode: 'rollback', confidence: 0.9, description: '"undo last" -> rollback' },
  // Branch patterns (3)
  { id: 'cf-branch', regex: /\b(branch|fork|split)\b/i, mode: 'branch', confidence: 0.85, description: '"branch/fork" -> branch' },
  { id: 'cf-variant', regex: /\b(variant|version|copy)\b/i, mode: 'branch', confidence: 0.7, description: '"variant/version" -> branch' },
  { id: 'cf-separate', regex: /\bseparate\s+(copy|version)\b/i, mode: 'branch', confidence: 0.8, description: '"separate copy" -> branch' },
  // Preview patterns (4)
  { id: 'cf-preview', regex: /\bpreview\b/i, mode: 'preview', confidence: 0.9, description: '"preview X" -> preview' },
  { id: 'cf-show-without', regex: /\bshow\s+.+\s+without\s+(applying|executing|running)\b/i, mode: 'preview', confidence: 0.9, description: '"show X without applying" -> preview' },
  { id: 'cf-dry-run', regex: /\b(dry\s+run|simulate|mock)\b/i, mode: 'preview', confidence: 0.85, description: '"dry run" -> preview' },
  { id: 'cf-can-preview', regex: /\bcan\s+(i|we)\s+preview\b/i, mode: 'preview', confidence: 0.9, description: '"can we preview" -> preview' },
];

/** Default counterfactual configuration. */
const DEFAULT_CF_CONFIG: CounterfactualConfig = {
  maxActivePlans: 5,
  maxRollbackPoints: 10,
  autoDiscardAfterTurns: 10,
  enableBranching: true,
};

// ---- 230 State ----

/** In-memory store of rollback points. */
let rollbackPoints: RollbackPoint[] = [];

/** In-memory store of active counterfactual results. */
let activeCounterfactuals: CounterfactualResult[] = [];

/** In-memory exploration history. */
let explorationHistory: ExplorationHistoryEntry[] = [];

// ---- 230 Functions ----

/** Detect a counterfactual request from an utterance. */
export function detectCounterfactual(utterance: string): CounterfactualRequest | null {
  const lower = utterance.toLowerCase().trim();
  let bestMode: ExplorationMode | null = null;
  let bestConfidence = 0;
  let bestPatternId = '';

  for (const pattern of COUNTERFACTUAL_PATTERNS) {
    if (pattern.regex.test(lower)) {
      if (pattern.confidence > bestConfidence) {
        bestConfidence = pattern.confidence;
        bestMode = pattern.mode;
        bestPatternId = pattern.id;
      }
    }
  }

  if (bestMode === null) {
    return null;
  }

  return {
    id: generateId('cfr'),
    mode: bestMode,
    utterance,
    description: 'Counterfactual: ' + bestMode + ' from "' + utterance + '"',
    confidence: bestConfidence,
    matchedPattern: bestPatternId,
    timestamp: Date.now(),
  };
}

/** Create a counterfactual plan from a request, without executing it. */
export function createCounterfactualPlan(
  request: CounterfactualRequest,
  changes: readonly CounterfactualChange[],
  planDescription: string,
): CounterfactualResult {
  const result: CounterfactualResult = {
    id: generateId('cfp'),
    requestId: request.id,
    planDescription,
    changes,
    isApplied: false,
    isDiscarded: false,
    rollbackPointId: null,
    createdAt: Date.now(),
    metadata: {},
  };

  // Track in active list, respecting max
  if (activeCounterfactuals.length >= DEFAULT_CF_CONFIG.maxActivePlans) {
    activeCounterfactuals = activeCounterfactuals.slice(1);
  }
  activeCounterfactuals.push(result);

  explorationHistory.push({
    requestId: request.id,
    mode: request.mode,
    outcome: 'pending',
    timestamp: Date.now(),
  });

  return result;
}

/** Compare two counterfactual results and produce a diff. */
export function compareCounterfactuals(
  resultA: CounterfactualResult,
  resultB: CounterfactualResult,
): CounterfactualComparison {
  const differences: ComparisonDifference[] = [];

  // Build maps of changes by target+property
  const mapA = new Map<string, CounterfactualChange>();
  for (const c of resultA.changes) {
    mapA.set(c.target + '::' + c.property, c);
  }

  const mapB = new Map<string, CounterfactualChange>();
  for (const c of resultB.changes) {
    mapB.set(c.target + '::' + c.property, c);
  }

  // Find differences
  const allKeys = new Set<string>([...mapA.keys(), ...mapB.keys()]);
  for (const key of allKeys) {
    const changeA = mapA.get(key);
    const changeB = mapB.get(key);

    if (changeA !== undefined && changeB !== undefined) {
      if (changeA.newValue !== changeB.newValue) {
        differences.push({
          target: changeA.target,
          property: changeA.property,
          valueA: changeA.newValue,
          valueB: changeB.newValue,
          significance: 'medium',
        });
      }
    } else if (changeA !== undefined && changeB === undefined) {
      differences.push({
        target: changeA.target,
        property: changeA.property,
        valueA: changeA.newValue,
        valueB: '(not changed)',
        significance: 'high',
      });
    } else if (changeA === undefined && changeB !== undefined) {
      differences.push({
        target: changeB.target,
        property: changeB.property,
        valueA: '(not changed)',
        valueB: changeB.newValue,
        significance: 'high',
      });
    }
  }

  const diffCount = differences.length;
  const summary = 'Comparison: ' + String(diffCount) + ' difference(s) between plans "' + resultA.planDescription + '" and "' + resultB.planDescription + '"';
  const recommendation = diffCount === 0
    ? 'Both plans are identical.'
    : 'Review ' + String(diffCount) + ' difference(s) to choose the preferred plan.';

  return {
    id: generateId('cfc'),
    resultA,
    resultB,
    differences,
    summary,
    recommendation,
  };
}

/** Check whether an utterance is a counterfactual request. */
export function isCounterfactualRequest(utterance: string): boolean {
  return detectCounterfactual(utterance) !== null;
}

/** Format a counterfactual result for display. */
export function formatCounterfactualResult(result: CounterfactualResult): string {
  const lines: string[] = [
    'Counterfactual Plan: ' + result.planDescription,
    'Status: ' + (result.isApplied ? 'APPLIED' : result.isDiscarded ? 'DISCARDED' : 'PENDING'),
    'Changes (' + String(result.changes.length) + '):',
  ];
  for (const change of result.changes) {
    lines.push('  - ' + change.target + '.' + change.property + ': ' + change.oldValue + ' -> ' + change.newValue);
    lines.push('    ' + change.description);
  }
  if (result.rollbackPointId !== null) {
    lines.push('Rollback point: ' + result.rollbackPointId);
  }
  return lines.join('\n');
}

/** Apply a counterfactual plan (mark it as applied). */
export function applyCounterfactual(resultId: string): CounterfactualResult | null {
  const idx = activeCounterfactuals.findIndex(r => r.id === resultId);
  if (idx < 0) return null;

  const existing = activeCounterfactuals[idx];
  if (existing === undefined) return null;

  const applied: CounterfactualResult = {
    id: existing.id,
    requestId: existing.requestId,
    planDescription: existing.planDescription,
    changes: existing.changes,
    isApplied: true,
    isDiscarded: false,
    rollbackPointId: existing.rollbackPointId,
    createdAt: existing.createdAt,
    metadata: existing.metadata,
  };

  activeCounterfactuals[idx] = applied;

  // Update history
  const histIdx = explorationHistory.findIndex(h => h.requestId === existing.requestId);
  if (histIdx >= 0) {
    const histEntry = explorationHistory[histIdx];
    if (histEntry !== undefined) {
      explorationHistory[histIdx] = {
        requestId: histEntry.requestId,
        mode: histEntry.mode,
        outcome: 'applied',
        timestamp: Date.now(),
      };
    }
  }

  return applied;
}

/** Discard a counterfactual plan without applying. */
export function discardCounterfactual(resultId: string): CounterfactualResult | null {
  const idx = activeCounterfactuals.findIndex(r => r.id === resultId);
  if (idx < 0) return null;

  const existing = activeCounterfactuals[idx];
  if (existing === undefined) return null;

  const discarded: CounterfactualResult = {
    id: existing.id,
    requestId: existing.requestId,
    planDescription: existing.planDescription,
    changes: existing.changes,
    isApplied: false,
    isDiscarded: true,
    rollbackPointId: existing.rollbackPointId,
    createdAt: existing.createdAt,
    metadata: existing.metadata,
  };

  activeCounterfactuals[idx] = discarded;

  // Update history
  const histIdx = explorationHistory.findIndex(h => h.requestId === existing.requestId);
  if (histIdx >= 0) {
    const histEntry = explorationHistory[histIdx];
    if (histEntry !== undefined) {
      explorationHistory[histIdx] = {
        requestId: histEntry.requestId,
        mode: histEntry.mode,
        outcome: 'discarded',
        timestamp: Date.now(),
      };
    }
  }

  return discarded;
}

/** Get the exploration mode from a counterfactual request. */
export function getExplorationMode(request: CounterfactualRequest): ExplorationMode {
  return request.mode;
}

/** Get the exploration history. */
export function getExplorationHistory(): readonly ExplorationHistoryEntry[] {
  return explorationHistory;
}

/** Mark the current state as a rollback point. */
export function markRollbackPoint(
  label: string,
  stateSnapshot: Record<string, string>,
): RollbackPoint {
  const point: RollbackPoint = {
    id: generateId('rbp'),
    label,
    createdAt: Date.now(),
    stateSnapshot,
    isActive: true,
  };

  // Enforce max rollback points
  if (rollbackPoints.length >= DEFAULT_CF_CONFIG.maxRollbackPoints) {
    rollbackPoints = rollbackPoints.slice(1);
  }
  rollbackPoints.push(point);

  return point;
}

/** Rollback to a specific rollback point by ID. */
export function rollbackToPoint(pointId: string): RollbackPoint | null {
  const idx = rollbackPoints.findIndex(p => p.id === pointId);
  if (idx < 0) return null;

  const point = rollbackPoints[idx];
  if (point === undefined) return null;

  // Deactivate all points after this one
  for (let i = idx + 1; i < rollbackPoints.length; i++) {
    const later = rollbackPoints[i];
    if (later !== undefined) {
      rollbackPoints[i] = {
        id: later.id,
        label: later.label,
        createdAt: later.createdAt,
        stateSnapshot: later.stateSnapshot,
        isActive: false,
      };
    }
  }

  // Discard any active counterfactuals created after this point
  const pointTime = point.createdAt;
  for (let i = 0; i < activeCounterfactuals.length; i++) {
    const cf = activeCounterfactuals[i];
    if (cf !== undefined && cf.createdAt > pointTime && !cf.isDiscarded) {
      activeCounterfactuals[i] = {
        id: cf.id,
        requestId: cf.requestId,
        planDescription: cf.planDescription,
        changes: cf.changes,
        isApplied: false,
        isDiscarded: true,
        rollbackPointId: cf.rollbackPointId,
        createdAt: cf.createdAt,
        metadata: cf.metadata,
      };
    }
  }

  return point;
}

/** Explore a batch of counterfactual requests and produce results. */
export function batchExploreCounterfactuals(
  utterances: readonly string[],
): readonly (CounterfactualRequest | null)[] {
  const results: (CounterfactualRequest | null)[] = [];
  for (const u of utterances) {
    results.push(detectCounterfactual(u));
  }
  return results;
}

/** Format a comparison between two counterfactual results for display. */
export function formatComparison(comparison: CounterfactualComparison): string {
  const lines: string[] = [
    '=== Counterfactual Comparison ===',
    'Plan A: ' + comparison.resultA.planDescription,
    'Plan B: ' + comparison.resultB.planDescription,
    '',
    'Differences (' + String(comparison.differences.length) + '):',
  ];

  for (const diff of comparison.differences) {
    lines.push('  [' + diff.significance.toUpperCase() + '] ' + diff.target + '.' + diff.property);
    lines.push('    A: ' + diff.valueA);
    lines.push('    B: ' + diff.valueB);
  }

  lines.push('');
  lines.push('Summary: ' + comparison.summary);
  lines.push('Recommendation: ' + comparison.recommendation);

  return lines.join('\n');
}

/** Merge a counterfactual result into the main state by applying it and clearing exploration. */
export function mergeCounterfactualIntoMain(resultId: string): boolean {
  const applied = applyCounterfactual(resultId);
  if (applied === null) return false;

  // Remove from active list
  activeCounterfactuals = activeCounterfactuals.filter(r => r.id !== resultId);

  return true;
}

/** Get all active (non-discarded, non-applied) counterfactual results. */
export function getActiveCounterfactuals(): readonly CounterfactualResult[] {
  return activeCounterfactuals.filter(r => !r.isApplied && !r.isDiscarded);
}

/** Get all rollback points. */
export function getRollbackPoints(): readonly RollbackPoint[] {
  return rollbackPoints.filter(p => p.isActive);
}

/** Clear all exploration state (for testing / reset). */
export function clearExplorationState(): void {
  rollbackPoints = [];
  activeCounterfactuals = [];
  explorationHistory = [];
}

/** Get the counterfactual configuration (read-only). */
export function getCounterfactualConfig(): CounterfactualConfig {
  return DEFAULT_CF_CONFIG;
}

/** Create a counterfactual change descriptor. */
export function createCounterfactualChange(
  target: string,
  property: string,
  oldValue: string,
  newValue: string,
  description: string,
): CounterfactualChange {
  return {
    changeId: generateId('cch'),
    target,
    property,
    oldValue,
    newValue,
    description,
  };
}

/** Get a specific counterfactual result by ID. */
export function getCounterfactualById(resultId: string): CounterfactualResult | null {
  const found = activeCounterfactuals.find(r => r.id === resultId);
  return found !== undefined ? found : null;
}

/** Get a rollback point by ID. */
export function getRollbackPointById(pointId: string): RollbackPoint | null {
  const found = rollbackPoints.find(p => p.id === pointId);
  return found !== undefined ? found : null;
}

/** Check if there are any pending counterfactuals. */
export function hasPendingCounterfactuals(): boolean {
  return activeCounterfactuals.some(r => !r.isApplied && !r.isDiscarded);
}

/** Count active counterfactuals. */
export function countActiveCounterfactuals(): number {
  return activeCounterfactuals.filter(r => !r.isApplied && !r.isDiscarded).length;
}

/** Count active rollback points. */
export function countActiveRollbackPoints(): number {
  return rollbackPoints.filter(p => p.isActive).length;
}


// ===================== CROSS-STEP INTEGRATION UTILITIES =====================

// ---- Combined Analysis Types ----

/** Full pragmatic analysis combining speech act, hedge, intention, and confirmation. */
export interface PragmaticAnalysis {
  readonly utterance: string;
  readonly speechAct: SpeechActDetection;
  readonly hedgeAnalysis: HedgeDetection;
  readonly effectiveConfidence: number;
  readonly intention: UserIntention | null;
  readonly confirmationMove: ConfirmationMove | null;
  readonly counterfactual: CounterfactualRequest | null;
  readonly summary: string;
  readonly timestamp: number;
}

/** Dialogue turn with full pragmatic annotation. */
export interface AnnotatedDialogueTurn {
  readonly turnNumber: number;
  readonly rawText: string;
  readonly pragmaticAnalysis: PragmaticAnalysis;
  readonly isActionable: boolean;
  readonly requiresResponse: boolean;
  readonly suggestedResponseType: SpeechActType;
}

/** Aggregated statistics across multiple turns. */
export interface PragmaticStatistics {
  readonly totalTurns: number;
  readonly speechActDistribution: Record<string, number>;
  readonly averageConfidence: number;
  readonly hedgeFrequency: number;
  readonly mostCommonIntention: IntentionType;
  readonly confirmationRate: number;
  readonly counterfactualRate: number;
}

/** Configuration for the full pragmatic pipeline. */
export interface PragmaticPipelineConfig {
  readonly enableHedgeDetection: boolean;
  readonly enableIntentionTracking: boolean;
  readonly enableConfirmationGating: boolean;
  readonly enableCounterfactualDetection: boolean;
  readonly hedgeConfig: HedgeConfig;
  readonly intentionConfig: IntentionConfig;
  readonly confirmationConfig: ConfirmationConfig;
  readonly counterfactualConfig: CounterfactualConfig;
}

/** Result of a multi-turn batch analysis. */
export interface BatchAnalysisResult {
  readonly analyses: readonly PragmaticAnalysis[];
  readonly statistics: PragmaticStatistics;
  readonly intentionState: IntentionState;
  readonly pendingGates: readonly ConfirmationGate[];
}

// ---- Combined Analysis Functions ----

/** Run full pragmatic analysis on a single utterance. */
export function analyzePragmatics(
  utterance: string,
  intentionState: IntentionState | null,
): PragmaticAnalysis {
  const speechAct = detectSpeechAct(utterance);
  const hedgeAnalysis = detectHedges(utterance);
  const hedgeEffect = applyHedgeEffects(speechAct, hedgeAnalysis);
  const effective = hedgeEffect.adjustedConfidence;

  let intention: UserIntention | null = null;
  if (intentionState !== null) {
    intention = recognizeIntention(utterance, intentionState);
  }

  const confirmationMove = detectConfirmationMove(utterance);
  const hasConfirm = confirmationMove.confidence > 0.5 ? confirmationMove : null;

  const counterfactual = detectCounterfactual(utterance);

  const summaryParts: string[] = [
    'Act: ' + speechAct.detectedAct,
    'Confidence: ' + (effective * 100).toFixed(0) + '%',
    'Hedged: ' + String(hedgeAnalysis.hedgesFound.length > 0),
    'Politeness: ' + hedgeAnalysis.politenessLevel,
  ];
  if (intention !== null) {
    summaryParts.push('Intention: ' + intention.intentionType);
  }
  if (hasConfirm !== null) {
    summaryParts.push('Confirmation: ' + hasConfirm.moveType);
  }
  if (counterfactual !== null) {
    summaryParts.push('Counterfactual: ' + counterfactual.mode);
  }

  return {
    utterance,
    speechAct,
    hedgeAnalysis,
    effectiveConfidence: effective,
    intention,
    confirmationMove: hasConfirm,
    counterfactual,
    summary: summaryParts.join(' | '),
    timestamp: Date.now(),
  };
}

/** Annotate a dialogue turn with full pragmatic information. */
export function annotateDialogueTurn(
  turnNumber: number,
  rawText: string,
  intentionState: IntentionState | null,
): AnnotatedDialogueTurn {
  const analysis = analyzePragmatics(rawText, intentionState);
  const isActionable = analysis.speechAct.detectedAct !== 'inform'
    && analysis.speechAct.detectedAct !== 'greet'
    && analysis.speechAct.detectedAct !== 'farewell'
    && analysis.speechAct.detectedAct !== 'exclaim'
    && analysis.speechAct.detectedAct !== 'thank';
  const requiresResponse = analysis.speechAct.detectedAct === 'question'
    || analysis.speechAct.detectedAct === 'meta-question'
    || analysis.speechAct.detectedAct === 'request'
    || analysis.speechAct.detectedAct === 'command';
  const expectedResp = getExpectedResponse(analysis.speechAct.detectedAct);

  return {
    turnNumber,
    rawText,
    pragmaticAnalysis: analysis,
    isActionable,
    requiresResponse,
    suggestedResponseType: expectedResp.expectedResponseType,
  };
}

/** Run full pragmatic analysis on a batch of utterances across turns. */
export function analyzePragmaticBatch(
  utterances: readonly string[],
  initialIntentionState?: IntentionState,
): BatchAnalysisResult {
  let intState = initialIntentionState !== undefined ? initialIntentionState : resetIntentionState();
  const analyses: PragmaticAnalysis[] = [];
  const actCounts: Record<string, number> = {};
  let totalConfidence = 0;
  let hedgedCount = 0;
  let confirmCount = 0;
  let cfCount = 0;
  const intentionCounts: Record<string, number> = {};
  const pendingGates: ConfirmationGate[] = [];

  for (const u of utterances) {
    const analysis = analyzePragmatics(u, intState);
    analyses.push(analysis);

    // Update intention state
    if (analysis.intention !== null) {
      intState = updateIntentionState(intState, analysis.intention);
      const itKey = analysis.intention.intentionType;
      const prevIC = intentionCounts[itKey];
      intentionCounts[itKey] = (prevIC !== undefined ? prevIC : 0) + 1;
    }

    // Accumulate statistics
    const actKey = analysis.speechAct.detectedAct;
    const prevAC = actCounts[actKey];
    actCounts[actKey] = (prevAC !== undefined ? prevAC : 0) + 1;
    totalConfidence += analysis.effectiveConfidence;

    if (analysis.hedgeAnalysis.hedgesFound.length > 0) {
      hedgedCount++;
    }
    if (analysis.confirmationMove !== null) {
      confirmCount++;
    }
    if (analysis.counterfactual !== null) {
      cfCount++;
    }

    // Create confirmation gates for actionable plans
    if (analysis.speechAct.detectedAct === 'command' || analysis.speechAct.detectedAct === 'request') {
      const riskLevel = analysis.speechAct.detectedAct === 'command' ? 'medium' as const : 'low' as const;
      const gate = createConfirmationGate(
        generateId('plan'),
        'Plan from: "' + u.slice(0, 50) + '"',
        riskLevel,
      );
      pendingGates.push(gate);
    }
  }

  // Find most common intention
  let mostCommonIntention: IntentionType = 'single-edit';
  let maxIntCount = 0;
  const intentionTypes: IntentionType[] = [
    'single-edit', 'iterative-refinement', 'exploration', 'comparison',
    'workflow', 'troubleshooting', 'learning', 'configuration',
  ];
  for (const it of intentionTypes) {
    const cnt = intentionCounts[it];
    if (cnt !== undefined && cnt > maxIntCount) {
      maxIntCount = cnt;
      mostCommonIntention = it;
    }
  }

  const totalTurns = utterances.length;
  const statistics: PragmaticStatistics = {
    totalTurns,
    speechActDistribution: actCounts,
    averageConfidence: totalTurns > 0 ? totalConfidence / totalTurns : 0,
    hedgeFrequency: totalTurns > 0 ? hedgedCount / totalTurns : 0,
    mostCommonIntention,
    confirmationRate: totalTurns > 0 ? confirmCount / totalTurns : 0,
    counterfactualRate: totalTurns > 0 ? cfCount / totalTurns : 0,
  };

  return {
    analyses,
    statistics,
    intentionState: intState,
    pendingGates,
  };
}

/** Format a full pragmatic analysis for display. */
export function formatPragmaticAnalysis(analysis: PragmaticAnalysis): string {
  const lines: string[] = [
    '=== Pragmatic Analysis ===',
    'Utterance: "' + analysis.utterance + '"',
    '',
    '--- Speech Act ---',
    'Type: ' + analysis.speechAct.detectedAct,
    'Force: ' + analysis.speechAct.force,
    'Effect: ' + analysis.speechAct.effect,
    'Raw confidence: ' + (analysis.speechAct.confidence * 100).toFixed(0) + '%',
    'Effective confidence: ' + (analysis.effectiveConfidence * 100).toFixed(0) + '%',
    '',
    '--- Hedging ---',
    'Hedges found: ' + String(analysis.hedgeAnalysis.hedgesFound.length),
    'Politeness: ' + analysis.hedgeAnalysis.politenessLevel,
    'Confidence modifier: ' + analysis.hedgeAnalysis.totalConfidenceModifier.toFixed(2),
    'Stripped: "' + analysis.hedgeAnalysis.strippedUtterance + '"',
  ];

  if (analysis.intention !== null) {
    lines.push('');
    lines.push('--- Intention ---');
    lines.push('Type: ' + analysis.intention.intentionType);
    lines.push('Confidence: ' + (analysis.intention.confidence * 100).toFixed(0) + '%');
    lines.push('Scope: ' + analysis.intention.scope);
    lines.push('Turn count: ' + String(analysis.intention.turnCount));
  }

  if (analysis.confirmationMove !== null) {
    lines.push('');
    lines.push('--- Confirmation ---');
    lines.push('Move: ' + analysis.confirmationMove.moveType);
    lines.push('Confidence: ' + (analysis.confirmationMove.confidence * 100).toFixed(0) + '%');
    if (analysis.confirmationMove.modification !== null) {
      lines.push('Modification: ' + analysis.confirmationMove.modification);
    }
  }

  if (analysis.counterfactual !== null) {
    lines.push('');
    lines.push('--- Counterfactual ---');
    lines.push('Mode: ' + analysis.counterfactual.mode);
    lines.push('Confidence: ' + (analysis.counterfactual.confidence * 100).toFixed(0) + '%');
    lines.push('Pattern: ' + analysis.counterfactual.matchedPattern);
  }

  return lines.join('\n');
}

/** Format pragmatic statistics for display. */
export function formatPragmaticStatistics(stats: PragmaticStatistics): string {
  const lines: string[] = [
    '=== Pragmatic Statistics ===',
    'Total turns: ' + String(stats.totalTurns),
    'Average confidence: ' + (stats.averageConfidence * 100).toFixed(0) + '%',
    'Hedge frequency: ' + (stats.hedgeFrequency * 100).toFixed(0) + '%',
    'Most common intention: ' + stats.mostCommonIntention,
    'Confirmation rate: ' + (stats.confirmationRate * 100).toFixed(0) + '%',
    'Counterfactual rate: ' + (stats.counterfactualRate * 100).toFixed(0) + '%',
    '',
    'Speech act distribution:',
  ];

  const actKeys = Object.keys(stats.speechActDistribution);
  for (const key of actKeys) {
    const count = stats.speechActDistribution[key];
    if (count !== undefined) {
      lines.push('  ' + key + ': ' + String(count));
    }
  }

  return lines.join('\n');
}

/** Check whether a speech act + hedge combination requires clarification. */
export function requiresClarification(analysis: PragmaticAnalysis): boolean {
  // Low effective confidence suggests ambiguity
  if (analysis.effectiveConfidence < 0.4) return true;
  // Modified confirmation needs clarification
  if (analysis.confirmationMove !== null && analysis.confirmationMove.moveType === 'modified') return true;
  // Multiple competing speech act patterns with low confidence
  if (analysis.speechAct.matchedPatterns.length > 3 && analysis.effectiveConfidence < 0.6) return true;
  return false;
}

/** Generate a clarification prompt based on analysis and politeness level. */
export function generateClarificationPrompt(analysis: PragmaticAnalysis): string {
  const tone = adjustClarificationTone('', analysis.hedgeAnalysis.politenessLevel);
  const actType = analysis.speechAct.detectedAct;

  if (actType === 'question' || actType === 'meta-question') {
    return tone.tonePrefix + 'what specifically would you like to know' + tone.toneSuffix;
  }
  if (actType === 'request' || actType === 'command') {
    return tone.tonePrefix + 'what exactly would you like me to change' + tone.toneSuffix;
  }
  if (actType === 'suggestion') {
    return tone.tonePrefix + 'would you like me to go ahead with that suggestion' + tone.toneSuffix;
  }
  return tone.tonePrefix + 'I want to make sure I understand your request' + tone.toneSuffix;
}

/** Determine the appropriate system response mode based on pragmatic analysis. */
export function determineResponseMode(
  analysis: PragmaticAnalysis,
): 'execute' | 'clarify' | 'present-plan' | 'explore' | 'acknowledge' {
  // Counterfactual -> explore
  if (analysis.counterfactual !== null) return 'explore';

  // Confirmation -> execute if confirmed
  if (analysis.confirmationMove !== null) {
    if (analysis.confirmationMove.moveType === 'confirmed') return 'execute';
    if (analysis.confirmationMove.moveType === 'rejected') return 'acknowledge';
    if (analysis.confirmationMove.moveType === 'modified') return 'clarify';
  }

  // Low confidence -> clarify
  if (analysis.effectiveConfidence < 0.4) return 'clarify';

  // Commands with high confidence -> present plan (not direct execute)
  if (analysis.speechAct.detectedAct === 'command' && analysis.effectiveConfidence >= 0.7) {
    return 'present-plan';
  }

  // Questions -> acknowledge (provide answer)
  if (isInterrogative(analysis.speechAct.detectedAct)) return 'acknowledge';

  // Requests -> present plan
  if (analysis.speechAct.detectedAct === 'request') return 'present-plan';

  return 'acknowledge';
}

/** Get the default pipeline configuration. */
export function getDefaultPipelineConfig(): PragmaticPipelineConfig {
  return {
    enableHedgeDetection: true,
    enableIntentionTracking: true,
    enableConfirmationGating: true,
    enableCounterfactualDetection: true,
    hedgeConfig: DEFAULT_HEDGE_CONFIG,
    intentionConfig: DEFAULT_INTENTION_CONFIG,
    confirmationConfig: DEFAULT_CONFIRMATION_CONFIG,
    counterfactualConfig: DEFAULT_CF_CONFIG,
  };
}

/** Validate that a pragmatic analysis is well-formed. */
export function validatePragmaticAnalysis(analysis: PragmaticAnalysis): readonly string[] {
  const errors: string[] = [];

  if (analysis.utterance.trim().length === 0) {
    errors.push('Empty utterance');
  }
  if (analysis.effectiveConfidence < 0 || analysis.effectiveConfidence > 1) {
    errors.push('Effective confidence out of range: ' + String(analysis.effectiveConfidence));
  }
  if (analysis.speechAct.matchedPatterns.length === 0 && analysis.speechAct.confidence > 0.5) {
    errors.push('High confidence with no matched patterns');
  }

  return errors;
}

/** Summarize a sequence of annotated turns into a session narrative. */
export function summarizeSession(turns: readonly AnnotatedDialogueTurn[]): string {
  if (turns.length === 0) return 'No turns in session.';

  const actionableCount = turns.filter(t => t.isActionable).length;
  const responseNeeded = turns.filter(t => t.requiresResponse).length;

  const lines: string[] = [
    'Session Summary (' + String(turns.length) + ' turns)',
    'Actionable turns: ' + String(actionableCount),
    'Turns requiring response: ' + String(responseNeeded),
    '',
  ];

  for (const turn of turns) {
    const act = turn.pragmaticAnalysis.speechAct.detectedAct;
    const conf = (turn.pragmaticAnalysis.effectiveConfidence * 100).toFixed(0);
    lines.push('  T' + String(turn.turnNumber) + ': [' + act + ' ' + conf + '%] "' + turn.rawText.slice(0, 60) + '"');
  }

  return lines.join('\n');
}

/** Map an exploration mode to a user-friendly description. */
export function describeExplorationMode(mode: ExplorationMode): string {
  switch (mode) {
    case 'what-if': return 'Hypothetical scenario: produce a plan without executing';
    case 'try-this': return 'Trial mode: preview changes without committing';
    case 'compare': return 'Comparison mode: show two plans side by side';
    case 'rollback': return 'Rollback mode: return to a previous state';
    case 'branch': return 'Branch mode: create a separate version to explore';
    case 'preview': return 'Preview mode: show results without applying changes';
  }
}

/** Map a confirmation state to a user-friendly description. */
export function describeConfirmationState(state: ConfirmationState): string {
  switch (state) {
    case 'pending': return 'Awaiting your confirmation to proceed';
    case 'confirmed': return 'Confirmed and ready to execute';
    case 'rejected': return 'Rejected; no changes will be made';
    case 'modified': return 'Accepted with modifications; needs re-confirmation';
    case 'expired': return 'Expired without confirmation; plan discarded';
  }
}

/** Map an intention type to a user-friendly description. */
export function describeIntentionType(intentionType: IntentionType): string {
  switch (intentionType) {
    case 'single-edit': return 'Making a single, specific change';
    case 'iterative-refinement': return 'Iteratively refining a section through repeated edits';
    case 'exploration': return 'Exploring possibilities and alternatives';
    case 'comparison': return 'Comparing different options or approaches';
    case 'workflow': return 'Following a multi-step workflow';
    case 'troubleshooting': return 'Diagnosing and fixing an issue';
    case 'learning': return 'Learning about the system or a concept';
    case 'configuration': return 'Configuring settings or preferences';
  }
}

/** Get all confirmation patterns (read-only). */
export function getConfirmationPatterns(): readonly ConfirmationPattern[] {
  return CONFIRMATION_PATTERNS;
}

/** Get all counterfactual patterns (read-only). */
export function getCounterfactualPatterns(): readonly CounterfactualPattern[] {
  return COUNTERFACTUAL_PATTERNS;
}

/** Get all intention evidence patterns (read-only). */
export function getIntentionEvidencePatterns(): readonly IntentionEvidence[] {
  return INTENTION_EVIDENCE;
}

/** Create an initial empty intention state. */
export function createInitialIntentionState(): IntentionState {
  return resetIntentionState();
}
