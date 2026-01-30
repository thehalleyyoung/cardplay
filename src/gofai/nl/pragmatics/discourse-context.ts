/**
 * discourse-context.ts -- Steps 211-215: Discourse Context and Pragmatic Resolution
 *
 * Step 211: Ellipsis Resolution — "same but bigger" antecedent recovery
 * Step 212: Modal Subordination — "if possible" conditional intent storage
 * Step 213: Common Ground Model — mutual establishment tracking
 * Step 214: SDRT Discourse Relations — "but/so/then/also" plan shaping
 * Step 215: Repair Moves — "no, not that chorus" referent rebinding
 *
 * All types are locally defined (no external imports).
 */

// ===================== STEP 211: ELLIPSIS RESOLUTION =====================

// ---- 211 Types ----

/** Classification of ellipsis phenomena. */
export type EllipsisType =
  | 'vp-ellipsis'
  | 'sluice'
  | 'fragment'
  | 'comparative-deletion'
  | 'stripping'
  | 'subdeletion'
  | 'null-complement'
  | 'gapping';

/** Modification operation applied to an antecedent during ellipsis resolution. */
export type EllipsisModificationKind =
  | 'scale-up'
  | 'scale-down'
  | 'replace-target'
  | 'replace-parameter'
  | 'extend-scope'
  | 'narrow-scope'
  | 'repeat-exact'
  | 'reverse-action'
  | 'recall-state'
  | 'add-constraint'
  | 'remove-constraint'
  | 'shift-direction'
  | 'toggle-property'
  | 'merge-action';

/** Confidence bracket for ellipsis detection. */
export type EllipsisConfidenceBracket = 'high' | 'medium' | 'low' | 'speculative';

/** A detected ellipsis in an utterance. */
export interface EllipsisDetection {
  readonly detectionId: string;
  readonly utterance: string;
  readonly ellipsisType: EllipsisType;
  readonly matchedPattern: string;
  readonly fragmentText: string;
  readonly confidence: number;
  readonly confidenceBracket: EllipsisConfidenceBracket;
  readonly modificationHint: string;
  readonly offsetStart: number;
  readonly offsetEnd: number;
}

/** A candidate antecedent from dialogue history. */
export interface EllipsisAntecedent {
  readonly antecedentId: string;
  readonly turnNumber: number;
  readonly rawText: string;
  readonly action: string;
  readonly target: string;
  readonly parameters: Record<string, string>;
  readonly salience: number;
  readonly recency: number;
  readonly matchScore: number;
}

/** Result of resolving an ellipsis against an antecedent. */
export interface EllipsisResolution {
  readonly resolutionId: string;
  readonly detection: EllipsisDetection;
  readonly antecedent: EllipsisAntecedent;
  readonly resolvedAction: string;
  readonly resolvedTarget: string;
  readonly resolvedParameters: Record<string, string>;
  readonly modification: EllipsisModificationKind;
  readonly modificationDetail: string;
  readonly explanation: string;
  readonly confidence: number;
  readonly warnings: readonly string[];
}

/** Template for matching and resolving ellipsis patterns. */
export interface EllipsisTemplate {
  readonly templateId: string;
  readonly label: string;
  readonly pattern: string;
  readonly ellipsisType: EllipsisType;
  readonly modificationKind: EllipsisModificationKind;
  readonly description: string;
  readonly exampleUtterance: string;
  readonly exampleAntecedent: string;
  readonly exampleResolution: string;
  readonly captureGroups: readonly string[];
  readonly priority: number;
}

/** A turn in simplified dialogue history for antecedent search. */
export interface EllipsisDialogueTurn {
  readonly turnNumber: number;
  readonly rawText: string;
  readonly action: string;
  readonly target: string;
  readonly parameters: Record<string, string>;
  readonly timestamp: number;
  readonly turnType: string;
}

/** Configuration for the ellipsis resolution engine. */
export interface EllipsisConfig {
  readonly maxLookback: number;
  readonly minConfidence: number;
  readonly preferRecency: boolean;
  readonly allowSpeculative: boolean;
  readonly maxCandidates: number;
  readonly recencyDecayFactor: number;
}

/** Batch result for processing multiple elliptical utterances. */
export interface EllipsisBatchResult {
  readonly results: readonly EllipsisResolution[];
  readonly unresolved: readonly EllipsisDetection[];
  readonly totalDetected: number;
  readonly totalResolved: number;
  readonly averageConfidence: number;
}

// ---- 211 Ellipsis Templates (30+) ----

const ELLIPSIS_TEMPLATE_DEFS: readonly {
  readonly id: string;
  readonly label: string;
  readonly pat: string;
  readonly typ: EllipsisType;
  readonly mod: EllipsisModificationKind;
  readonly desc: string;
  readonly exU: string;
  readonly exA: string;
  readonly exR: string;
  readonly caps: readonly string[];
  readonly pri: number;
}[] = [
  {
    id: 'el-same-but',
    label: 'Same but X',
    pat: '\\bsame\\s+but\\s+(.+)',
    typ: 'vp-ellipsis',
    mod: 'replace-parameter',
    desc: 'Repeat last action with a modified parameter',
    exU: 'same but bigger',
    exA: 'increase the reverb by 10%',
    exR: 'increase the reverb by a bigger amount',
    caps: ['modifier'],
    pri: 100,
  },
  {
    id: 'el-do-that-again',
    label: 'Do that again',
    pat: '\\b(?:do\\s+(?:that|it)\\s+again|again|repeat(?:\\s+that)?)\\b',
    typ: 'vp-ellipsis',
    mod: 'repeat-exact',
    desc: 'Repeat the last action exactly',
    exU: 'do that again',
    exA: 'transpose up 2 semitones',
    exR: 'transpose up 2 semitones',
    caps: [],
    pri: 95,
  },
  {
    id: 'el-but-louder',
    label: 'But louder',
    pat: '\\bbut\\s+(louder|quieter|softer|faster|slower|higher|lower|bigger|smaller|longer|shorter|wider|narrower|brighter|darker|warmer|cooler|sharper|flatter)\\b',
    typ: 'stripping',
    mod: 'scale-up',
    desc: 'Keep action, change amount by comparative adjective',
    exU: 'but louder',
    exA: 'set volume to 80%',
    exR: 'set volume higher than 80%',
    caps: ['comparative'],
    pri: 90,
  },
  {
    id: 'el-the-chorus-too',
    label: 'The X too',
    pat: '\\b(?:the\\s+)?(.+?)\\s+too\\b',
    typ: 'fragment',
    mod: 'replace-target',
    desc: 'Apply the same action to a new scope/target',
    exU: 'the chorus too',
    exA: 'add reverb to the verse',
    exR: 'add reverb to the chorus',
    caps: ['newTarget'],
    pri: 88,
  },
  {
    id: 'el-and-the-bridge',
    label: 'And the X?',
    pat: '\\band\\s+(?:the\\s+)?(.+?)\\??$',
    typ: 'sluice',
    mod: 'replace-target',
    desc: 'Query or apply same action to a different target',
    exU: 'and the bridge?',
    exA: 'mute the verse',
    exR: 'mute the bridge',
    caps: ['newTarget'],
    pri: 85,
  },
  {
    id: 'el-more',
    label: 'More',
    pat: '\\bmore\\b(?!\\s+(?:than|of|or))',
    typ: 'fragment',
    mod: 'scale-up',
    desc: 'Increase the last parameter value',
    exU: 'more',
    exA: 'add reverb at 30%',
    exR: 'add reverb at a higher amount',
    caps: [],
    pri: 82,
  },
  {
    id: 'el-less',
    label: 'Less',
    pat: '\\bless\\b(?!\\s+(?:than|of))',
    typ: 'fragment',
    mod: 'scale-down',
    desc: 'Decrease the last parameter value',
    exU: 'less',
    exA: 'add reverb at 30%',
    exR: 'add reverb at a lower amount',
    caps: [],
    pri: 82,
  },
  {
    id: 'el-undo-that',
    label: 'Undo that',
    pat: '\\b(?:undo\\s+(?:that|it|the\\s+last)|take\\s+(?:that|it)\\s+back|revert(?:\\s+that)?)\\b',
    typ: 'vp-ellipsis',
    mod: 'reverse-action',
    desc: 'Reverse the last action',
    exU: 'undo that',
    exA: 'transpose up 2 semitones',
    exR: 'transpose down 2 semitones',
    caps: [],
    pri: 93,
  },
  {
    id: 'el-like-before',
    label: 'Like before',
    pat: '\\b(?:like\\s+before|as\\s+before|back\\s+to\\s+(?:how\\s+it\\s+was|the\\s+original|normal))\\b',
    typ: 'vp-ellipsis',
    mod: 'recall-state',
    desc: 'Recall a prior state',
    exU: 'like before',
    exA: 'set tempo to 140',
    exR: 'restore prior state of tempo',
    caps: [],
    pri: 80,
  },
  {
    id: 'el-even-more',
    label: 'Even more X',
    pat: '\\beven\\s+(more|less|bigger|smaller|louder|quieter)\\b',
    typ: 'comparative-deletion',
    mod: 'scale-up',
    desc: 'Intensify the modification direction from the last action',
    exU: 'even more',
    exA: 'increase reverb by 10%',
    exR: 'increase reverb by a larger amount than 10%',
    caps: ['direction'],
    pri: 87,
  },
  {
    id: 'el-a-lot-more',
    label: 'A lot more',
    pat: '\\ba\\s+lot\\s+(more|less|bigger|smaller|louder|quieter)\\b',
    typ: 'comparative-deletion',
    mod: 'scale-up',
    desc: 'Strongly intensify the modification direction',
    exU: 'a lot more',
    exA: 'increase volume by 5%',
    exR: 'increase volume by a much larger amount',
    caps: ['direction'],
    pri: 86,
  },
  {
    id: 'el-just-a-little',
    label: 'Just a little',
    pat: '\\b(?:just\\s+)?a\\s+(?:little|bit|touch|tad)(?:\\s+(more|less))?\\b',
    typ: 'fragment',
    mod: 'scale-up',
    desc: 'Apply minimal change in the modification direction',
    exU: 'just a little more',
    exA: 'increase brightness by 20%',
    exR: 'increase brightness by a small amount',
    caps: ['direction'],
    pri: 83,
  },
  {
    id: 'el-twice-as-much',
    label: 'Twice as much',
    pat: '\\b(twice|double|triple|half)\\s+(?:as\\s+much|that)\\b',
    typ: 'comparative-deletion',
    mod: 'scale-up',
    desc: 'Multiply the last parameter by a factor',
    exU: 'twice as much',
    exA: 'add delay at 200ms',
    exR: 'add delay at 400ms',
    caps: ['multiplier'],
    pri: 84,
  },
  {
    id: 'el-not-that-much',
    label: 'Not that much',
    pat: '\\bnot\\s+(?:that|so|as)\\s+much\\b',
    typ: 'stripping',
    mod: 'scale-down',
    desc: 'Reduce the magnitude of the last change',
    exU: 'not that much',
    exA: 'increase reverb by 40%',
    exR: 'increase reverb by a smaller amount than 40%',
    caps: [],
    pri: 81,
  },
  {
    id: 'el-for-this-one-too',
    label: 'For this one too',
    pat: '\\bfor\\s+(?:this|that)\\s+one\\s+too\\b',
    typ: 'fragment',
    mod: 'extend-scope',
    desc: 'Extend the action scope to include another target',
    exU: 'for this one too',
    exA: 'add compression to track 1',
    exR: 'add compression to the indicated target as well',
    caps: [],
    pri: 78,
  },
  {
    id: 'el-everywhere',
    label: 'Everywhere / all of them',
    pat: '\\b(?:everywhere|all\\s+of\\s+(?:them|those)|all\\s+tracks|each\\s+one)\\b',
    typ: 'fragment',
    mod: 'extend-scope',
    desc: 'Apply the last action globally',
    exU: 'everywhere',
    exA: 'add reverb to the chorus',
    exR: 'add reverb to all sections',
    caps: [],
    pri: 77,
  },
  {
    id: 'el-only-here',
    label: 'Only here / just this one',
    pat: '\\b(?:only\\s+(?:here|this\\s+one)|just\\s+(?:here|this\\s+one|this))\\b',
    typ: 'fragment',
    mod: 'narrow-scope',
    desc: 'Narrow the scope of the last action',
    exU: 'only here',
    exA: 'mute all tracks',
    exR: 'mute only the focused target',
    caps: [],
    pri: 76,
  },
  {
    id: 'el-the-opposite',
    label: 'The opposite',
    pat: '\\b(?:the\\s+opposite|opposite\\s+(?:of\\s+)?that|reverse\\s+(?:of\\s+)?that|flip\\s+(?:it|that))\\b',
    typ: 'vp-ellipsis',
    mod: 'reverse-action',
    desc: 'Apply the opposite of the last action',
    exU: 'the opposite',
    exA: 'pan left',
    exR: 'pan right',
    caps: [],
    pri: 79,
  },
  {
    id: 'el-something-similar',
    label: 'Something similar',
    pat: '\\b(?:something\\s+similar|the\\s+same\\s+(?:kind|type|thing))\\b',
    typ: 'vp-ellipsis',
    mod: 'repeat-exact',
    desc: 'Apply a similar action (fuzzy repeat)',
    exU: 'something similar',
    exA: 'add chorus effect',
    exR: 'add a similar effect',
    caps: [],
    pri: 70,
  },
  {
    id: 'el-what-about-x',
    label: 'What about X?',
    pat: '\\bwhat\\s+about\\s+(?:the\\s+)?(.+?)\\??$',
    typ: 'sluice',
    mod: 'replace-target',
    desc: 'Query or apply action to a new target',
    exU: 'what about the intro?',
    exA: 'add reverb to the chorus',
    exR: 'add reverb to the intro',
    caps: ['newTarget'],
    pri: 84,
  },
  {
    id: 'el-how-about-x',
    label: 'How about X?',
    pat: '\\bhow\\s+about\\s+(?:the\\s+)?(.+?)\\??$',
    typ: 'sluice',
    mod: 'replace-target',
    desc: 'Suggest applying to a new target',
    exU: 'how about the outro?',
    exA: 'increase volume on the chorus',
    exR: 'increase volume on the outro',
    caps: ['newTarget'],
    pri: 83,
  },
  {
    id: 'el-same-for-x',
    label: 'Same for X',
    pat: '\\bsame\\s+(?:for|with|on)\\s+(?:the\\s+)?(.+)',
    typ: 'vp-ellipsis',
    mod: 'replace-target',
    desc: 'Apply identical action to a new target',
    exU: 'same for the bridge',
    exA: 'add reverb to the verse',
    exR: 'add reverb to the bridge',
    caps: ['newTarget'],
    pri: 91,
  },
  {
    id: 'el-ditto',
    label: 'Ditto',
    pat: '\\b(?:ditto|same\\s+here|likewise|me\\s+too)\\b',
    typ: 'vp-ellipsis',
    mod: 'repeat-exact',
    desc: 'Exact repeat of last action',
    exU: 'ditto',
    exA: 'quantize the drums',
    exR: 'quantize the drums',
    caps: [],
    pri: 74,
  },
  {
    id: 'el-but-in-x',
    label: 'But in X',
    pat: '\\bbut\\s+(?:in|on|at|for|during)\\s+(?:the\\s+)?(.+)',
    typ: 'stripping',
    mod: 'replace-target',
    desc: 'Repeat action, changing location/context',
    exU: 'but in the bridge',
    exA: 'reduce delay in the chorus',
    exR: 'reduce delay in the bridge',
    caps: ['newTarget'],
    pri: 86,
  },
  {
    id: 'el-now-the-other',
    label: 'Now the other',
    pat: '\\b(?:now\\s+)?the\\s+other\\s+(?:one|track|section|part)\\b',
    typ: 'fragment',
    mod: 'replace-target',
    desc: 'Apply to the complementary target',
    exU: 'now the other one',
    exA: 'solo track 1',
    exR: 'solo the other track',
    caps: [],
    pri: 75,
  },
  {
    id: 'el-keep-going',
    label: 'Keep going',
    pat: '\\b(?:keep\\s+going|continue|go\\s+on|carry\\s+on|keep\\s+(?:it|that)\\s+up)\\b',
    typ: 'vp-ellipsis',
    mod: 'repeat-exact',
    desc: 'Continue applying the last iterative action',
    exU: 'keep going',
    exA: 'fade out gradually',
    exR: 'continue fading out',
    caps: [],
    pri: 72,
  },
  {
    id: 'el-one-more-time',
    label: 'One more time',
    pat: '\\b(?:one\\s+more\\s+time|once\\s+more|another\\s+time)\\b',
    typ: 'vp-ellipsis',
    mod: 'repeat-exact',
    desc: 'Repeat the action one additional time',
    exU: 'one more time',
    exA: 'transpose up a semitone',
    exR: 'transpose up a semitone again',
    caps: [],
    pri: 73,
  },
  {
    id: 'el-try-x-instead',
    label: 'Try X instead',
    pat: '\\b(?:try|use)\\s+(.+?)\\s+instead\\b',
    typ: 'stripping',
    mod: 'replace-parameter',
    desc: 'Replace a parameter with a new value',
    exU: 'try 120 BPM instead',
    exA: 'set tempo to 100 BPM',
    exR: 'set tempo to 120 BPM',
    caps: ['newValue'],
    pri: 88,
  },
  {
    id: 'el-not-x-but-y',
    label: 'Not X, Y',
    pat: '\\bnot\\s+(.+?)\\s*,\\s*(.+)',
    typ: 'gapping',
    mod: 'replace-parameter',
    desc: 'Correct a parameter: reject X, use Y',
    exU: 'not reverb, delay',
    exA: 'add reverb to the chorus',
    exR: 'add delay to the chorus',
    caps: ['rejected', 'replacement'],
    pri: 89,
  },
  {
    id: 'el-with-x-this-time',
    label: 'With X this time',
    pat: '\\bwith\\s+(.+?)\\s+this\\s+time\\b',
    typ: 'vp-ellipsis',
    mod: 'add-constraint',
    desc: 'Repeat the action with an additional constraint',
    exU: 'with more swing this time',
    exA: 'quantize the drums',
    exR: 'quantize the drums with more swing',
    caps: ['addition'],
    pri: 80,
  },
  {
    id: 'el-without-x',
    label: 'Without X this time',
    pat: '\\bwithout\\s+(.+?)\\s*(?:this\\s+time)?\\b',
    typ: 'vp-ellipsis',
    mod: 'remove-constraint',
    desc: 'Repeat but remove a constraint',
    exU: 'without the compression this time',
    exA: 'master the track with compression and EQ',
    exR: 'master the track with EQ only',
    caps: ['removal'],
    pri: 79,
  },
  {
    id: 'el-up-instead',
    label: 'Up instead / down instead',
    pat: '\\b(up|down|left|right|forward|backward)\\s+instead\\b',
    typ: 'stripping',
    mod: 'shift-direction',
    desc: 'Change the direction of the last action',
    exU: 'up instead',
    exA: 'transpose down 3 semitones',
    exR: 'transpose up 3 semitones',
    caps: ['newDirection'],
    pri: 85,
  },
  {
    id: 'el-on-off-toggle',
    label: 'Toggle on/off',
    pat: '\\b(?:toggle\\s+(?:it|that)|switch\\s+(?:it|that)|on\\s+and\\s+off|off\\s+and\\s+on)\\b',
    typ: 'fragment',
    mod: 'toggle-property',
    desc: 'Toggle the boolean state of the last targeted property',
    exU: 'toggle that',
    exA: 'enable chorus effect',
    exR: 'disable chorus effect',
    caps: [],
    pri: 74,
  },
  {
    id: 'el-merge-with-last',
    label: 'Together with that',
    pat: '\\b(?:together\\s+with\\s+(?:that|the\\s+last)|combine\\s+(?:them|those|it)|merge\\s+(?:them|those))\\b',
    typ: 'vp-ellipsis',
    mod: 'merge-action',
    desc: 'Merge the current action with the last one',
    exU: 'together with that',
    exA: 'add reverb',
    exR: 'combine the current action with adding reverb',
    caps: [],
    pri: 68,
  },
] as const;


// ---- 211 Helper Utilities ----

function makeEllipsisId(prefix: string, index: number): string {
  return prefix + '-' + String(index) + '-' + String(Math.floor(Math.random() * 100000));
}

function clampConfidence(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function computeRecencyScore(turnNumber: number, currentTurn: number, decayFactor: number): number {
  const distance = currentTurn - turnNumber;
  if (distance <= 0) return 1.0;
  return Math.max(0, Math.exp(-decayFactor * distance));
}

function matchPattern(text: string, pattern: string): RegExpMatchArray | null {
  try {
    const regex = new RegExp(pattern, 'i');
    return text.match(regex);
  } catch {
    return null;
  }
}

function applyComparativeScaling(
  parameters: Record<string, string>,
  direction: 'up' | 'down',
  magnitude: 'small' | 'medium' | 'large'
): Record<string, string> {
  const result: Record<string, string> = {};
  const keys = Object.keys(parameters);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === undefined) continue;
    const val = parameters[key];
    if (val === undefined) continue;
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      const factor = magnitude === 'small' ? 0.1 : magnitude === 'medium' ? 0.25 : 0.5;
      const delta = numVal * factor;
      const newVal = direction === 'up' ? numVal + delta : numVal - delta;
      result[key] = String(Math.round(newVal * 100) / 100);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function reverseParameters(parameters: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  const keys = Object.keys(parameters);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === undefined) continue;
    const val = parameters[key];
    if (val === undefined) continue;
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      result[key] = String(-numVal);
    } else if (val === 'up') {
      result[key] = 'down';
    } else if (val === 'down') {
      result[key] = 'up';
    } else if (val === 'left') {
      result[key] = 'right';
    } else if (val === 'right') {
      result[key] = 'left';
    } else if (val === 'true') {
      result[key] = 'false';
    } else if (val === 'false') {
      result[key] = 'true';
    } else {
      result[key] = val;
    }
  }
  return result;
}

function inferMagnitude(text: string): 'small' | 'medium' | 'large' {
  const lower = text.toLowerCase();
  if (lower.includes('a lot') || lower.includes('much') || lower.includes('way') || lower.includes('significantly')) {
    return 'large';
  }
  if (lower.includes('a little') || lower.includes('slightly') || lower.includes('a bit') || lower.includes('a tad') || lower.includes('a touch')) {
    return 'small';
  }
  return 'medium';
}

function inferScaleDirection(text: string): 'up' | 'down' {
  const lower = text.toLowerCase();
  const upWords = ['more', 'bigger', 'louder', 'higher', 'faster', 'longer', 'wider', 'brighter', 'warmer', 'sharper', 'increase', 'up'];
  const downWords = ['less', 'smaller', 'quieter', 'softer', 'lower', 'slower', 'shorter', 'narrower', 'darker', 'cooler', 'flatter', 'decrease', 'down'];
  for (let i = 0; i < upWords.length; i++) {
    const w = upWords[i];
    if (w !== undefined && lower.includes(w)) return 'up';
  }
  for (let i = 0; i < downWords.length; i++) {
    const w = downWords[i];
    if (w !== undefined && lower.includes(w)) return 'down';
  }
  return 'up';
}

function extractCapturedText(m: RegExpMatchArray, groupIndex: number): string {
  if (groupIndex < m.length) {
    const val = m[groupIndex];
    return val !== undefined ? val.trim() : '';
  }
  return '';
}

function deriveMultiplier(text: string): number {
  const lower = text.toLowerCase();
  if (lower.includes('triple') || lower.includes('three times')) return 3;
  if (lower.includes('twice') || lower.includes('double') || lower.includes('two times')) return 2;
  if (lower.includes('half')) return 0.5;
  if (lower.includes('quarter')) return 0.25;
  return 1;
}

function applyMultiplier(parameters: Record<string, string>, multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  const keys = Object.keys(parameters);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === undefined) continue;
    const val = parameters[key];
    if (val === undefined) continue;
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      result[key] = String(Math.round(numVal * multiplier * 100) / 100);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function copyRecord(rec: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  const keys = Object.keys(rec);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === undefined) continue;
    const val = rec[key];
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

// ---- 211 Functions ----

/** Build an EllipsisTemplate from a template definition. */
function buildEllipsisTemplate(def: typeof ELLIPSIS_TEMPLATE_DEFS[number]): EllipsisTemplate {
  return {
    templateId: def.id,
    label: def.label,
    pattern: def.pat,
    ellipsisType: def.typ,
    modificationKind: def.mod,
    description: def.desc,
    exampleUtterance: def.exU,
    exampleAntecedent: def.exA,
    exampleResolution: def.exR,
    captureGroups: def.caps,
    priority: def.pri,
  };
}

/** Get all 30+ ellipsis templates. */
export function getEllipsisTemplates(): readonly EllipsisTemplate[] {
  const templates: EllipsisTemplate[] = [];
  for (let i = 0; i < ELLIPSIS_TEMPLATE_DEFS.length; i++) {
    const def = ELLIPSIS_TEMPLATE_DEFS[i];
    if (def !== undefined) {
      templates.push(buildEllipsisTemplate(def));
    }
  }
  return templates;
}

/** Check if an utterance appears to be elliptical. */
export function isElliptical(utterance: string): boolean {
  const lower = utterance.trim().toLowerCase();
  if (lower.length === 0) return false;
  for (let i = 0; i < ELLIPSIS_TEMPLATE_DEFS.length; i++) {
    const def = ELLIPSIS_TEMPLATE_DEFS[i];
    if (def !== undefined) {
      const m = matchPattern(lower, def.pat);
      if (m !== null) return true;
    }
  }
  const words = lower.split(/\s+/);
  if (words.length <= 3 && words.length > 0) {
    const verbIndicators = ['make', 'set', 'add', 'remove', 'delete', 'create', 'change', 'apply', 'increase', 'decrease', 'move', 'transpose', 'mute', 'solo'];
    let hasVerb = false;
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      if (word !== undefined && verbIndicators.includes(word)) {
        hasVerb = true;
        break;
      }
    }
    if (!hasVerb) return true;
  }
  return false;
}

/** Classify an elliptical utterance into its EllipsisType. */
export function classifyEllipsis(utterance: string): EllipsisType {
  const lower = utterance.trim().toLowerCase();
  let bestType: EllipsisType = 'fragment';
  let bestPri = -1;
  for (let i = 0; i < ELLIPSIS_TEMPLATE_DEFS.length; i++) {
    const def = ELLIPSIS_TEMPLATE_DEFS[i];
    if (def !== undefined) {
      const m = matchPattern(lower, def.pat);
      if (m !== null && def.pri > bestPri) {
        bestPri = def.pri;
        bestType = def.typ;
      }
    }
  }
  return bestType;
}

/** Detect ellipsis in an utterance, returning detection(s). */
export function detectEllipsis(utterance: string): readonly EllipsisDetection[] {
  const lower = utterance.trim().toLowerCase();
  const detections: EllipsisDetection[] = [];
  let idx = 0;
  for (let i = 0; i < ELLIPSIS_TEMPLATE_DEFS.length; i++) {
    const def = ELLIPSIS_TEMPLATE_DEFS[i];
    if (def === undefined) continue;
    const m = matchPattern(lower, def.pat);
    if (m === null) continue;
    const matchedText = m[0] ?? '';
    const offsetStart = m.index ?? 0;
    const confidence = clampConfidence(def.pri / 100);
    const bracket: EllipsisConfidenceBracket =
      confidence >= 0.85 ? 'high' :
      confidence >= 0.7 ? 'medium' :
      confidence >= 0.5 ? 'low' : 'speculative';
    detections.push({
      detectionId: makeEllipsisId('ed', idx),
      utterance,
      ellipsisType: def.typ,
      matchedPattern: def.pat,
      fragmentText: matchedText,
      confidence,
      confidenceBracket: bracket,
      modificationHint: def.mod,
      offsetStart,
      offsetEnd: offsetStart + matchedText.length,
    });
    idx++;
  }
  detections.sort((a, b) => b.confidence - a.confidence);
  return detections;
}

/** Find the best antecedent from dialogue history. */
export function findAntecedent(
  history: readonly EllipsisDialogueTurn[],
  detection: EllipsisDetection,
  config: EllipsisConfig
): EllipsisAntecedent | null {
  if (history.length === 0) return null;
  const lastTurn = history[history.length - 1];
  const currentTurn = lastTurn !== undefined ? lastTurn.turnNumber + 1 : 1;
  const lookback = Math.min(config.maxLookback, history.length);
  const candidates: EllipsisAntecedent[] = [];

  for (let i = history.length - 1; i >= Math.max(0, history.length - lookback); i--) {
    const turn = history[i];
    if (turn === undefined) continue;
    if (turn.turnType !== 'user-command' && turn.turnType !== 'system-execution-report') continue;
    if (turn.action.length === 0) continue;

    const recency = computeRecencyScore(turn.turnNumber, currentTurn, config.recencyDecayFactor);
    let matchScore = recency * 0.5;

    if (detection.modificationHint === 'replace-target' && turn.target.length > 0) {
      matchScore += 0.3;
    }
    if (detection.modificationHint === 'scale-up' || detection.modificationHint === 'scale-down') {
      const paramKeys = Object.keys(turn.parameters);
      if (paramKeys.length > 0) {
        matchScore += 0.2;
      }
    }
    if (detection.modificationHint === 'repeat-exact') {
      matchScore += 0.2;
    }
    if (detection.modificationHint === 'reverse-action') {
      matchScore += 0.15;
    }

    matchScore = clampConfidence(matchScore);

    candidates.push({
      antecedentId: makeEllipsisId('ea', i),
      turnNumber: turn.turnNumber,
      rawText: turn.rawText,
      action: turn.action,
      target: turn.target,
      parameters: turn.parameters,
      salience: recency,
      recency,
      matchScore,
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.matchScore - a.matchScore);
  const best = candidates[0];
  if (best === undefined) return null;
  if (best.matchScore < config.minConfidence && !config.allowSpeculative) return null;
  return best;
}

/** Apply the ellipsis modification to the antecedent. */
export function applyEllipsisModification(
  antecedent: EllipsisAntecedent,
  detection: EllipsisDetection,
  utterance: string
): { readonly action: string; readonly target: string; readonly parameters: Record<string, string>; readonly detail: string } {
  const mod = detection.modificationHint as EllipsisModificationKind;
  let action = antecedent.action;
  let target = antecedent.target;
  let parameters = copyRecord(antecedent.parameters);
  let detail = '';

  if (mod === 'repeat-exact') {
    detail = 'Repeating action "' + action + '" on "' + target + '" exactly';
  } else if (mod === 'scale-up') {
    const dir = inferScaleDirection(utterance);
    const mag = inferMagnitude(utterance);
    const actualDir = dir === 'down' ? 'down' : 'up';
    parameters = applyComparativeScaling(parameters, actualDir, mag);
    detail = 'Scaling ' + actualDir + ' (' + mag + ') parameters of "' + action + '"';
  } else if (mod === 'scale-down') {
    const mag2 = inferMagnitude(utterance);
    parameters = applyComparativeScaling(parameters, 'down', mag2);
    detail = 'Scaling down (' + mag2 + ') parameters of "' + action + '"';
  } else if (mod === 'replace-target') {
    const m = matchPattern(utterance.toLowerCase(), detection.matchedPattern);
    if (m !== null) {
      const captured = extractCapturedText(m, 1);
      if (captured.length > 0) {
        target = captured;
        detail = 'Replacing target from "' + antecedent.target + '" to "' + target + '"';
      } else {
        detail = 'Target replacement requested but no new target captured';
      }
    } else {
      detail = 'Target replacement requested, pattern did not re-match';
    }
  } else if (mod === 'replace-parameter') {
    const m2 = matchPattern(utterance.toLowerCase(), detection.matchedPattern);
    if (m2 !== null) {
      const captured2 = extractCapturedText(m2, 1);
      if (captured2.length > 0) {
        const pKeys = Object.keys(parameters);
        if (pKeys.length > 0) {
          const firstKey = pKeys[0];
          if (firstKey !== undefined) {
            parameters[firstKey] = captured2;
            detail = 'Replacing parameter "' + firstKey + '" with "' + captured2 + '"';
          }
        } else {
          parameters['value'] = captured2;
          detail = 'Setting parameter "value" to "' + captured2 + '"';
        }
      }
    }
  } else if (mod === 'extend-scope') {
    detail = 'Extending scope of "' + action + '" to include additional targets';
    parameters['scopeExtended'] = 'true';
  } else if (mod === 'narrow-scope') {
    detail = 'Narrowing scope of "' + action + '" to focused target only';
    parameters['scopeNarrowed'] = 'true';
  } else if (mod === 'reverse-action') {
    parameters = reverseParameters(parameters);
    detail = 'Reversing action "' + action + '" on "' + target + '"';
  } else if (mod === 'recall-state') {
    detail = 'Recalling prior state before "' + action + '" on "' + target + '"';
    action = 'recall-state';
  } else if (mod === 'add-constraint') {
    const m3 = matchPattern(utterance.toLowerCase(), detection.matchedPattern);
    if (m3 !== null) {
      const captured3 = extractCapturedText(m3, 1);
      if (captured3.length > 0) {
        parameters['additionalConstraint'] = captured3;
        detail = 'Adding constraint "' + captured3 + '" to "' + action + '"';
      }
    }
  } else if (mod === 'remove-constraint') {
    const m4 = matchPattern(utterance.toLowerCase(), detection.matchedPattern);
    if (m4 !== null) {
      const captured4 = extractCapturedText(m4, 1);
      if (captured4.length > 0) {
        parameters['removedConstraint'] = captured4;
        detail = 'Removing constraint "' + captured4 + '" from "' + action + '"';
      }
    }
  } else if (mod === 'shift-direction') {
    const m5 = matchPattern(utterance.toLowerCase(), detection.matchedPattern);
    if (m5 !== null) {
      const captured5 = extractCapturedText(m5, 1);
      if (captured5.length > 0) {
        parameters['direction'] = captured5;
        detail = 'Shifting direction to "' + captured5 + '" for "' + action + '"';
      }
    }
  } else if (mod === 'toggle-property') {
    parameters = reverseParameters(parameters);
    detail = 'Toggling property state for "' + action + '" on "' + target + '"';
  } else if (mod === 'merge-action') {
    detail = 'Merging current action with "' + action + '" on "' + target + '"';
    parameters['mergedWith'] = antecedent.action;
  }

  const multiplier = deriveMultiplier(utterance);
  if (multiplier !== 1 && mod !== 'replace-target' && mod !== 'replace-parameter') {
    parameters = applyMultiplier(parameters, multiplier);
    detail += ' (multiplied by ' + String(multiplier) + ')';
  }

  return { action, target, parameters, detail };
}

/** Resolve an ellipsis detection against an antecedent. */
export function resolveEllipsis(
  detection: EllipsisDetection,
  antecedent: EllipsisAntecedent,
  utterance: string
): EllipsisResolution {
  const applied = applyEllipsisModification(antecedent, detection, utterance);
  const warnings: string[] = [];
  if (detection.confidenceBracket === 'low' || detection.confidenceBracket === 'speculative') {
    warnings.push('Low confidence ellipsis detection — resolution may be incorrect');
  }
  if (antecedent.matchScore < 0.5) {
    warnings.push('Antecedent match score is low — may not be the intended referent');
  }
  const overallConfidence = clampConfidence(detection.confidence * 0.6 + antecedent.matchScore * 0.4);
  return {
    resolutionId: makeEllipsisId('er', 0),
    detection,
    antecedent,
    resolvedAction: applied.action,
    resolvedTarget: applied.target,
    resolvedParameters: applied.parameters,
    modification: detection.modificationHint as EllipsisModificationKind,
    modificationDetail: applied.detail,
    explanation: 'Resolved "' + utterance + '" as ' + detection.ellipsisType + ' referencing turn ' + String(antecedent.turnNumber) + ': ' + applied.detail,
    confidence: overallConfidence,
    warnings,
  };
}

/** Get the confidence value from an ellipsis detection. */
export function getEllipsisConfidence(detection: EllipsisDetection): number {
  return detection.confidence;
}

/** Format an ellipsis resolution into a human-readable explanation. */
export function formatEllipsisResolution(resolution: EllipsisResolution): string {
  const lines: string[] = [];
  lines.push('Ellipsis Resolution [' + resolution.resolutionId + ']');
  lines.push('  Type: ' + resolution.detection.ellipsisType);
  lines.push('  Fragment: "' + resolution.detection.fragmentText + '"');
  lines.push('  Antecedent (turn ' + String(resolution.antecedent.turnNumber) + '): "' + resolution.antecedent.rawText + '"');
  lines.push('  Resolved action: ' + resolution.resolvedAction);
  lines.push('  Resolved target: ' + resolution.resolvedTarget);
  const paramKeys = Object.keys(resolution.resolvedParameters);
  if (paramKeys.length > 0) {
    lines.push('  Resolved parameters:');
    for (let k = 0; k < paramKeys.length; k++) {
      const key = paramKeys[k];
      if (key === undefined) continue;
      const val = resolution.resolvedParameters[key];
      lines.push('    ' + key + ': ' + (val ?? '(undefined)'));
    }
  }
  lines.push('  Modification: ' + resolution.modification + ' — ' + resolution.modificationDetail);
  lines.push('  Confidence: ' + (resolution.confidence * 100).toFixed(1) + '%');
  if (resolution.warnings.length > 0) {
    lines.push('  Warnings:');
    for (let w = 0; w < resolution.warnings.length; w++) {
      const warning = resolution.warnings[w];
      if (warning !== undefined) {
        lines.push('    - ' + warning);
      }
    }
  }
  return lines.join('\n');
}

/** Batch-resolve multiple elliptical utterances against a dialogue history. */
export function batchResolveEllipsis(
  utterances: readonly string[],
  history: readonly EllipsisDialogueTurn[],
  config: EllipsisConfig
): EllipsisBatchResult {
  const results: EllipsisResolution[] = [];
  const unresolved: EllipsisDetection[] = [];
  let totalDetected = 0;
  let totalConfidence = 0;

  for (let u = 0; u < utterances.length; u++) {
    const utt = utterances[u];
    if (utt === undefined) continue;
    const detections = detectEllipsis(utt);
    totalDetected += detections.length;

    for (let d = 0; d < detections.length; d++) {
      const det = detections[d];
      if (det === undefined) continue;
      const ant = findAntecedent(history, det, config);
      if (ant === null) {
        unresolved.push(det);
      } else {
        const res = resolveEllipsis(det, ant, utt);
        results.push(res);
        totalConfidence += res.confidence;
      }
    }
  }

  return {
    results,
    unresolved,
    totalDetected,
    totalResolved: results.length,
    averageConfidence: results.length > 0 ? totalConfidence / results.length : 0,
  };
}

/** Create a default EllipsisConfig. */
export function createDefaultEllipsisConfig(): EllipsisConfig {
  return {
    maxLookback: 10,
    minConfidence: 0.3,
    preferRecency: true,
    allowSpeculative: false,
    maxCandidates: 5,
    recencyDecayFactor: 0.3,
  };
}


// ===================== STEP 212: MODAL SUBORDINATION =====================

// ---- 212 Types ----

/** Type of modal expression. */
export type ModalType =
  | 'possibility'
  | 'necessity'
  | 'permission'
  | 'ability'
  | 'volition'
  | 'obligation'
  | 'epistemic'
  | 'deontic';

/** Strength of modal force. */
export type ModalForce = 'strong' | 'weak';

/** Priority level for conditional intents. */
export type ConditionalPriority = 'hard-constraint' | 'strong-preference' | 'soft-preference' | 'best-effort' | 'exploratory';

/** A modal expression detected in an utterance. */
export interface ModalExpression {
  readonly expressionId: string;
  readonly utterance: string;
  readonly modalType: ModalType;
  readonly modalForce: ModalForce;
  readonly matchedPattern: string;
  readonly triggerPhrase: string;
  readonly scope: string;
  readonly confidence: number;
  readonly offsetStart: number;
  readonly offsetEnd: number;
}

/** A conditional intent derived from a modal expression. */
export interface ConditionalIntent {
  readonly intentId: string;
  readonly expression: ModalExpression;
  readonly condition: string;
  readonly desiredOutcome: string;
  readonly fallbackBehavior: string;
  readonly priority: ConditionalPriority;
  readonly constraintType: string;
  readonly isNegated: boolean;
  readonly explanation: string;
}

/** Result of resolving a modal expression. */
export interface ModalResolution {
  readonly resolutionId: string;
  readonly expression: ModalExpression;
  readonly intent: ConditionalIntent;
  readonly constraintEmitted: string;
  readonly constraintStrength: number;
  readonly explanation: string;
  readonly warnings: readonly string[];
}

/** Configuration for the modal subordination engine. */
export interface ModalConfig {
  readonly defaultForce: ModalForce;
  readonly treatUnknownAsWeak: boolean;
  readonly minConfidence: number;
  readonly enableNegationDetection: boolean;
  readonly maxIntentsPerUtterance: number;
  readonly preferStrongConstraints: boolean;
}

/** A pattern definition for modal detection. */
interface ModalPatternDef {
  readonly id: string;
  readonly label: string;
  readonly pat: string;
  readonly typ: ModalType;
  readonly force: ModalForce;
  readonly priority: ConditionalPriority;
  readonly desc: string;
  readonly exU: string;
  readonly fallback: string;
  readonly pri: number;
}

/** Batch result for modal processing. */
export interface ModalBatchResult {
  readonly resolutions: readonly ModalResolution[];
  readonly unresolved: readonly ModalExpression[];
  readonly totalDetected: number;
  readonly totalResolved: number;
  readonly strongCount: number;
  readonly weakCount: number;
}

// ---- 212 Modal Patterns (25+) ----

const MODAL_PATTERN_DEFS: readonly ModalPatternDef[] = [
  {
    id: 'md-if-possible',
    label: 'If possible',
    pat: '\\bif\\s+(?:at\\s+all\\s+)?possible\\b',
    typ: 'possibility',
    force: 'weak',
    priority: 'soft-preference',
    desc: 'Weak preference — do this if feasible',
    exU: 'if possible, keep the melody',
    fallback: 'Accept alternative outcome',
    pri: 75,
  },
  {
    id: 'md-if-you-can',
    label: 'If you can',
    pat: '\\bif\\s+you\\s+can\\b',
    typ: 'ability',
    force: 'weak',
    priority: 'soft-preference',
    desc: 'Ability check — do this if capable',
    exU: 'if you can, match the tempo',
    fallback: 'Report inability and skip',
    pri: 72,
  },
  {
    id: 'md-try-to',
    label: 'Try to',
    pat: '\\b(?:try\\s+to|try\\s+and|attempt\\s+to)\\b',
    typ: 'volition',
    force: 'weak',
    priority: 'best-effort',
    desc: 'Best-effort attempt',
    exU: 'try to preserve the rhythm',
    fallback: 'Accept partial result',
    pri: 70,
  },
  {
    id: 'md-make-sure',
    label: 'Make sure',
    pat: '\\b(?:make\\s+sure|ensure|be\\s+sure\\s+to|make\\s+certain)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Strong constraint — must be satisfied',
    exU: 'make sure the bass stays',
    fallback: 'Report failure as error',
    pri: 95,
  },
  {
    id: 'md-must',
    label: 'Must / has to',
    pat: '\\b(?:must|has\\s+to|have\\s+to|needs\\s+to|need\\s+to)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Hard constraint — mandatory',
    exU: 'the volume must stay below 90%',
    fallback: 'Report constraint violation',
    pri: 98,
  },
  {
    id: 'md-should',
    label: 'Should',
    pat: '\\bshould\\b',
    typ: 'obligation',
    force: 'weak',
    priority: 'strong-preference',
    desc: 'Recommendation — expected but not mandatory',
    exU: 'the chorus should be louder',
    fallback: 'Warn about deviation',
    pri: 78,
  },
  {
    id: 'md-could',
    label: 'Could',
    pat: '\\bcould\\b(?!\\s+not|n\'t)',
    typ: 'possibility',
    force: 'weak',
    priority: 'exploratory',
    desc: 'Possibility exploration — might want this',
    exU: 'the bridge could use more reverb',
    fallback: 'Skip without warning',
    pri: 60,
  },
  {
    id: 'md-would-like',
    label: 'Would like',
    pat: '\\b(?:would\\s+like|I\'d\\s+like|we\'d\\s+like)\\b',
    typ: 'volition',
    force: 'weak',
    priority: 'soft-preference',
    desc: 'Preference declaration',
    exU: 'I would like the intro to be longer',
    fallback: 'Accept alternative',
    pri: 73,
  },
  {
    id: 'md-ideally',
    label: 'Ideally',
    pat: '\\b(?:ideally|in\\s+an\\s+ideal\\s+world|in\\s+a\\s+perfect\\s+world|preferably)\\b',
    typ: 'epistemic',
    force: 'weak',
    priority: 'soft-preference',
    desc: 'Soft preference — desired but flexible',
    exU: 'ideally, keep the original tempo',
    fallback: 'Accept reasonable alternative',
    pri: 65,
  },
  {
    id: 'md-at-minimum',
    label: 'At minimum',
    pat: '\\b(?:at\\s+(?:a\\s+)?minimum|at\\s+least|no\\s+less\\s+than|minimum)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Threshold constraint — floor value',
    exU: 'at minimum, keep the verse intact',
    fallback: 'Report threshold violation',
    pri: 90,
  },
  {
    id: 'md-at-most',
    label: 'At most',
    pat: '\\b(?:at\\s+(?:a\\s+)?most|no\\s+more\\s+than|maximum|at\\s+the\\s+most)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Threshold constraint — ceiling value',
    exU: 'at most 120 BPM',
    fallback: 'Report threshold violation',
    pri: 90,
  },
  {
    id: 'md-might-want',
    label: 'Might want',
    pat: '\\b(?:might\\s+want|may\\s+want|might\\s+like)\\b',
    typ: 'epistemic',
    force: 'weak',
    priority: 'exploratory',
    desc: 'Tentative preference',
    exU: 'we might want to add a bridge',
    fallback: 'Note for consideration',
    pri: 55,
  },
  {
    id: 'md-always',
    label: 'Always',
    pat: '\\b(?:always|every\\s+time|invariably|without\\s+exception)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Universal constraint',
    exU: 'always keep the melody',
    fallback: 'Report constraint violation',
    pri: 92,
  },
  {
    id: 'md-never',
    label: 'Never',
    pat: '\\b(?:never|under\\s+no\\s+circumstances|on\\s+no\\s+account)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Universal negative constraint',
    exU: 'never delete the vocals',
    fallback: 'Report constraint violation',
    pri: 93,
  },
  {
    id: 'md-can',
    label: 'Can',
    pat: '\\bcan\\s+(?:you|we|it)\\b',
    typ: 'ability',
    force: 'weak',
    priority: 'exploratory',
    desc: 'Ability query or polite request',
    exU: 'can you add reverb?',
    fallback: 'Report inability',
    pri: 58,
  },
  {
    id: 'md-dont-have-to',
    label: 'Don\'t have to',
    pat: '\\b(?:don\'t\\s+have\\s+to|doesn\'t\\s+have\\s+to|not\\s+required|optional)\\b',
    typ: 'permission',
    force: 'weak',
    priority: 'exploratory',
    desc: 'Explicit optionality',
    exU: 'you don\'t have to keep the bridge',
    fallback: 'No fallback needed',
    pri: 50,
  },
  {
    id: 'md-prefer',
    label: 'Prefer',
    pat: '\\b(?:prefer|rather|instead\\s+of|favor|lean\\s+towards?)\\b',
    typ: 'volition',
    force: 'weak',
    priority: 'strong-preference',
    desc: 'Explicit preference',
    exU: 'I prefer keeping the drums',
    fallback: 'Accept alternative with notification',
    pri: 76,
  },
  {
    id: 'md-important',
    label: 'Important',
    pat: '\\b(?:important|crucial|critical|essential|vital|key)\\b',
    typ: 'deontic',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Importance marker — strong emphasis',
    exU: 'it is important to keep the harmony',
    fallback: 'Report failure as critical',
    pri: 88,
  },
  {
    id: 'md-absolutely',
    label: 'Absolutely',
    pat: '\\b(?:absolutely|definitely|certainly|positively|undoubtedly)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Emphatic affirmation — very strong',
    exU: 'absolutely keep the vocals',
    fallback: 'Report violation',
    pri: 94,
  },
  {
    id: 'md-maybe',
    label: 'Maybe',
    pat: '\\b(?:maybe|perhaps|possibly|conceivably)\\b',
    typ: 'epistemic',
    force: 'weak',
    priority: 'exploratory',
    desc: 'Tentative — very low commitment',
    exU: 'maybe add some reverb',
    fallback: 'Skip entirely',
    pri: 45,
  },
  {
    id: 'md-want',
    label: 'Want / need',
    pat: '\\b(?:I\\s+want|we\\s+want|I\\s+need|we\\s+need)\\b',
    typ: 'volition',
    force: 'strong',
    priority: 'strong-preference',
    desc: 'Direct desire statement',
    exU: 'I want the chorus louder',
    fallback: 'Report inability',
    pri: 82,
  },
  {
    id: 'md-no-matter-what',
    label: 'No matter what',
    pat: '\\b(?:no\\s+matter\\s+what|regardless|come\\s+what\\s+may|whatever\\s+happens)\\b',
    typ: 'necessity',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Unconditional constraint',
    exU: 'no matter what, keep the drums',
    fallback: 'Report critical violation',
    pri: 96,
  },
  {
    id: 'md-unless',
    label: 'Unless',
    pat: '\\b(?:unless|except\\s+if|barring)\\b',
    typ: 'deontic',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Conditional exception',
    exU: 'keep it quiet unless the drums are playing',
    fallback: 'Apply exception when condition met',
    pri: 80,
  },
  {
    id: 'md-supposed-to',
    label: 'Supposed to',
    pat: '\\b(?:supposed\\s+to|meant\\s+to|intended\\s+to)\\b',
    typ: 'obligation',
    force: 'weak',
    priority: 'strong-preference',
    desc: 'Expected behavior',
    exU: 'it is supposed to fade out',
    fallback: 'Warn about deviation',
    pri: 74,
  },
  {
    id: 'md-allowed',
    label: 'Allowed / permitted',
    pat: '\\b(?:allowed\\s+to|permitted\\s+to|may\\s+(?:also)?|free\\s+to)\\b',
    typ: 'permission',
    force: 'weak',
    priority: 'exploratory',
    desc: 'Permission grant',
    exU: 'you are allowed to change the tempo',
    fallback: 'No fallback needed',
    pri: 52,
  },
  {
    id: 'md-forbidden',
    label: 'Forbidden',
    pat: '\\b(?:forbidden|not\\s+allowed|prohibited|banned|off\\s+limits)\\b',
    typ: 'deontic',
    force: 'strong',
    priority: 'hard-constraint',
    desc: 'Forbidden action',
    exU: 'changing the key is forbidden',
    fallback: 'Block action entirely',
    pri: 97,
  },
] as const;

// ---- 212 Helper Utilities ----

function makeModalId(prefix: string, index: number): string {
  return prefix + '-' + String(index) + '-' + String(Math.floor(Math.random() * 100000));
}

function detectNegation(text: string): boolean {
  const negPatterns = [
    /\bnot\b/i,
    /\bdon't\b/i,
    /\bdoesn't\b/i,
    /\bwon't\b/i,
    /\bcan't\b/i,
    /\bcannot\b/i,
    /\bshouldn't\b/i,
    /\bmustn't\b/i,
    /\bnever\b/i,
    /\bno\b/i,
    /\bnone\b/i,
    /\bnowhere\b/i,
    /\bnothing\b/i,
  ];
  for (let i = 0; i < negPatterns.length; i++) {
    const pat = negPatterns[i];
    if (pat !== undefined && pat.test(text)) return true;
  }
  return false;
}

function extractModalScope(utterance: string, triggerEnd: number): string {
  const rest = utterance.substring(triggerEnd).trim();
  // Remove leading punctuation/connectives
  const cleaned = rest.replace(/^[,;:\s]+/, '').replace(/^(?:that|then|to)\s+/i, '');
  return cleaned.length > 0 ? cleaned : utterance;
}

function mapPriorityToStrength(priority: ConditionalPriority): number {
  if (priority === 'hard-constraint') return 1.0;
  if (priority === 'strong-preference') return 0.8;
  if (priority === 'soft-preference') return 0.6;
  if (priority === 'best-effort') return 0.4;
  return 0.2;
}

function deriveConstraintType(modalType: ModalType, force: ModalForce): string {
  if (force === 'strong') {
    if (modalType === 'necessity') return 'hard-requirement';
    if (modalType === 'obligation') return 'strong-expectation';
    if (modalType === 'deontic') return 'rule-based-constraint';
    return 'firm-constraint';
  }
  if (modalType === 'possibility') return 'optional-preference';
  if (modalType === 'ability') return 'capability-check';
  if (modalType === 'volition') return 'user-desire';
  if (modalType === 'epistemic') return 'tentative-suggestion';
  if (modalType === 'permission') return 'permission-grant';
  return 'general-preference';
}

// ---- 212 Functions ----

/** Detect all modal expressions in an utterance. */
export function detectModalExpressions(utterance: string): readonly ModalExpression[] {
  const lower = utterance.trim().toLowerCase();
  const results: ModalExpression[] = [];
  let idx = 0;

  for (let i = 0; i < MODAL_PATTERN_DEFS.length; i++) {
    const def = MODAL_PATTERN_DEFS[i];
    if (def === undefined) continue;
    const m = matchPattern(lower, def.pat);
    if (m === null) continue;
    const matchedText = m[0] ?? '';
    const offsetStart = m.index ?? 0;
    const offsetEnd = offsetStart + matchedText.length;
    const scope = extractModalScope(utterance, offsetEnd);
    const confidence = clampConfidence(def.pri / 100);

    results.push({
      expressionId: makeModalId('mx', idx),
      utterance,
      modalType: def.typ,
      modalForce: def.force,
      matchedPattern: def.pat,
      triggerPhrase: matchedText,
      scope,
      confidence,
      offsetStart,
      offsetEnd,
    });
    idx++;
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/** Classify the modal force of an expression. */
export function classifyModalForce(expression: ModalExpression): ModalForce {
  return expression.modalForce;
}

/** Check if an expression has strong modal force. */
export function isStrongModal(expression: ModalExpression): boolean {
  return expression.modalForce === 'strong';
}

/** Check if an expression has weak modal force. */
export function isWeakModal(expression: ModalExpression): boolean {
  return expression.modalForce === 'weak';
}

/** Create a conditional intent from a modal expression. */
export function createConditionalIntent(
  expression: ModalExpression,
  config: ModalConfig
): ConditionalIntent {
  const isNegated = config.enableNegationDetection ? detectNegation(expression.utterance) : false;

  // Find the matching pattern def for fallback info
  let fallbackBehavior = 'Accept alternative outcome';
  let priority: ConditionalPriority = expression.modalForce === 'strong' ? 'hard-constraint' : 'soft-preference';

  for (let i = 0; i < MODAL_PATTERN_DEFS.length; i++) {
    const def = MODAL_PATTERN_DEFS[i];
    if (def === undefined) continue;
    if (def.pat === expression.matchedPattern) {
      fallbackBehavior = def.fallback;
      priority = def.priority;
      break;
    }
  }

  const constraintType = deriveConstraintType(expression.modalType, expression.modalForce);

  let condition = expression.triggerPhrase;
  if (expression.modalType === 'possibility' || expression.modalType === 'ability') {
    condition = 'feasibility-check: ' + expression.scope;
  } else if (expression.modalType === 'necessity' || expression.modalType === 'obligation') {
    condition = 'must-satisfy: ' + expression.scope;
  }

  const desiredOutcome = isNegated ? 'avoid: ' + expression.scope : 'achieve: ' + expression.scope;

  return {
    intentId: makeModalId('ci', 0),
    expression,
    condition,
    desiredOutcome,
    fallbackBehavior,
    priority,
    constraintType,
    isNegated,
    explanation: 'Modal "' + expression.triggerPhrase + '" (' + expression.modalType + '/' + expression.modalForce + ') => ' + priority + ' for: ' + expression.scope,
  };
}

/** Map a modal type to its constraint type string. */
export function modalToConstraintType(modalType: ModalType, force: ModalForce): string {
  return deriveConstraintType(modalType, force);
}

/** Resolve a modal expression into a planning constraint. */
export function resolveModal(
  expression: ModalExpression,
  config: ModalConfig
): ModalResolution {
  const intent = createConditionalIntent(expression, config);
  const constraintStrength = mapPriorityToStrength(intent.priority);
  const warnings: string[] = [];

  if (expression.confidence < 0.5) {
    warnings.push('Low confidence modal detection');
  }
  if (intent.isNegated) {
    warnings.push('Negated modal — constraint is inverted');
  }

  const constraintEmitted = intent.constraintType + '(' + intent.desiredOutcome + ', strength=' + constraintStrength.toFixed(2) + ')';

  return {
    resolutionId: makeModalId('mr', 0),
    expression,
    intent,
    constraintEmitted,
    constraintStrength,
    explanation: 'Resolved modal "' + expression.triggerPhrase + '" as ' + intent.priority + ': ' + constraintEmitted,
    warnings,
  };
}

/** Evaluate whether a condition string appears satisfiable. */
export function evaluateCondition(condition: string, knownFacts: readonly string[]): boolean {
  const lower = condition.toLowerCase();
  for (let i = 0; i < knownFacts.length; i++) {
    const fact = knownFacts[i];
    if (fact === undefined) continue;
    if (lower.includes(fact.toLowerCase())) return true;
  }
  // If no known facts match, check for feasibility prefix
  if (lower.startsWith('feasibility-check:')) return true;
  if (lower.startsWith('must-satisfy:')) return true;
  return false;
}

/** Apply a conditional intent, yielding a constraint string or null if condition not met. */
export function applyConditionalIntent(
  intent: ConditionalIntent,
  knownFacts: readonly string[]
): string | null {
  const conditionMet = evaluateCondition(intent.condition, knownFacts);
  if (!conditionMet) return null;
  return intent.constraintType + ': ' + intent.desiredOutcome;
}

/** Format a modal expression for human-readable display. */
export function formatModalExplanation(resolution: ModalResolution): string {
  const lines: string[] = [];
  lines.push('Modal Resolution [' + resolution.resolutionId + ']');
  lines.push('  Trigger: "' + resolution.expression.triggerPhrase + '"');
  lines.push('  Type: ' + resolution.expression.modalType);
  lines.push('  Force: ' + resolution.expression.modalForce);
  lines.push('  Scope: "' + resolution.expression.scope + '"');
  lines.push('  Priority: ' + resolution.intent.priority);
  lines.push('  Constraint: ' + resolution.constraintEmitted);
  lines.push('  Strength: ' + (resolution.constraintStrength * 100).toFixed(0) + '%');
  lines.push('  Negated: ' + String(resolution.intent.isNegated));
  lines.push('  Fallback: ' + resolution.intent.fallbackBehavior);
  if (resolution.warnings.length > 0) {
    lines.push('  Warnings:');
    for (let w = 0; w < resolution.warnings.length; w++) {
      const warning = resolution.warnings[w];
      if (warning !== undefined) {
        lines.push('    - ' + warning);
      }
    }
  }
  return lines.join('\n');
}

/** Get all modal pattern definitions as user-facing data. */
export function getModalPatterns(): readonly { readonly id: string; readonly label: string; readonly modalType: ModalType; readonly force: ModalForce; readonly priority: ConditionalPriority; readonly description: string }[] {
  const result: { readonly id: string; readonly label: string; readonly modalType: ModalType; readonly force: ModalForce; readonly priority: ConditionalPriority; readonly description: string }[] = [];
  for (let i = 0; i < MODAL_PATTERN_DEFS.length; i++) {
    const def = MODAL_PATTERN_DEFS[i];
    if (def === undefined) continue;
    result.push({
      id: def.id,
      label: def.label,
      modalType: def.typ,
      force: def.force,
      priority: def.priority,
      description: def.desc,
    });
  }
  return result;
}

/** Batch-resolve all modal expressions across multiple utterances. */
export function batchResolveModals(
  utterances: readonly string[],
  config: ModalConfig
): ModalBatchResult {
  const resolutions: ModalResolution[] = [];
  const unresolved: ModalExpression[] = [];
  let totalDetected = 0;
  let strongCount = 0;
  let weakCount = 0;

  for (let u = 0; u < utterances.length; u++) {
    const utt = utterances[u];
    if (utt === undefined) continue;
    const expressions = detectModalExpressions(utt);
    totalDetected += expressions.length;

    const limit = Math.min(expressions.length, config.maxIntentsPerUtterance);
    for (let e = 0; e < limit; e++) {
      const expr = expressions[e];
      if (expr === undefined) continue;
      if (expr.confidence < config.minConfidence) {
        unresolved.push(expr);
        continue;
      }
      const res = resolveModal(expr, config);
      resolutions.push(res);
      if (expr.modalForce === 'strong') {
        strongCount++;
      } else {
        weakCount++;
      }
    }
  }

  return {
    resolutions,
    unresolved,
    totalDetected,
    totalResolved: resolutions.length,
    strongCount,
    weakCount,
  };
}

/** Create a default ModalConfig. */
export function createDefaultModalConfig(): ModalConfig {
  return {
    defaultForce: 'weak',
    treatUnknownAsWeak: true,
    minConfidence: 0.3,
    enableNegationDetection: true,
    maxIntentsPerUtterance: 5,
    preferStrongConstraints: true,
  };
}


// ===================== STEP 213: COMMON GROUND MODEL =====================

// ---- 213 Types ----

/** Classification of common ground entries. */
export type CommonGroundType =
  | 'entity-binding'
  | 'property-assignment'
  | 'preference-declaration'
  | 'fact-assertion'
  | 'default-acceptance'
  | 'correction'
  | 'shared-knowledge';

/** Lifecycle status of a common ground entry. */
export type GroundingStatus = 'proposed' | 'grounded' | 'revised' | 'retracted';

/** Classification of grounding move. */
export type GroundingMoveType =
  | 'explicit-confirmation'
  | 'implicit-acceptance'
  | 'correction'
  | 'elaboration'
  | 'rejection'
  | 'clarification-request'
  | 'acknowledgment'
  | 'repetition'
  | 'paraphrase'
  | 'continuation'
  | 'question'
  | 'challenge'
  | 'retraction'
  | 'default-accept'
  | 'silence-accept'
  | 'backtrack'
  | 'redirect'
  | 'expansion'
  | 'summary'
  | 'closing';

/** A single entry in the common ground. */
export interface CommonGroundEntry {
  readonly entryId: string;
  readonly groundType: CommonGroundType;
  readonly key: string;
  readonly value: string;
  readonly status: GroundingStatus;
  readonly proposedAtTurn: number;
  readonly groundedAtTurn: number;
  readonly lastModifiedTurn: number;
  readonly proposedBy: 'user' | 'system';
  readonly confidence: number;
  readonly metadata: Record<string, string>;
  readonly history: readonly { readonly turn: number; readonly status: GroundingStatus; readonly value: string }[];
}

/** A grounding move detected in dialogue. */
export interface GroundingMove {
  readonly moveId: string;
  readonly moveType: GroundingMoveType;
  readonly turnNumber: number;
  readonly utterance: string;
  readonly targetEntryId: string;
  readonly effect: string;
  readonly confidence: number;
}

/** The full common ground state. */
export interface CommonGround {
  readonly entries: readonly CommonGroundEntry[];
  readonly moves: readonly GroundingMove[];
  readonly currentTurn: number;
  readonly totalProposed: number;
  readonly totalGrounded: number;
  readonly totalRevised: number;
  readonly totalRetracted: number;
}

/** A pattern for detecting grounding moves. */
interface GroundingPatternDef {
  readonly id: string;
  readonly label: string;
  readonly pat: string;
  readonly moveType: GroundingMoveType;
  readonly effect: string;
  readonly pri: number;
}

/** Serialized format for import/export. */
export interface CommonGroundSnapshot {
  readonly entries: readonly CommonGroundEntry[];
  readonly exportedAtTurn: number;
  readonly timestamp: number;
}

// ---- 213 Grounding Move Patterns (20+) ----

const GROUNDING_PATTERN_DEFS: readonly GroundingPatternDef[] = [
  { id: 'gp-yes', label: 'Yes / OK', pat: '\\b(?:yes|yeah|yep|ok|okay|sure|right|correct|exactly|indeed|affirmative)\\b', moveType: 'explicit-confirmation', effect: 'confirm-proposed', pri: 90 },
  { id: 'gp-no', label: 'No', pat: '\\b(?:no|nope|nah|negative|wrong|incorrect)\\b', moveType: 'rejection', effect: 'reject-proposed', pri: 88 },
  { id: 'gp-got-it', label: 'Got it', pat: '\\b(?:got\\s+it|understood|I\\s+see|makes\\s+sense|noted|roger|copy)\\b', moveType: 'acknowledgment', effect: 'acknowledge-proposed', pri: 85 },
  { id: 'gp-actually', label: 'Actually', pat: '\\b(?:actually|in\\s+fact|to\\s+be\\s+precise|more\\s+precisely)\\b', moveType: 'correction', effect: 'correct-entry', pri: 86 },
  { id: 'gp-i-mean', label: 'I mean', pat: '\\b(?:I\\s+mean|what\\s+I\\s+meant|to\\s+clarify)\\b', moveType: 'correction', effect: 'correct-entry', pri: 84 },
  { id: 'gp-also', label: 'Also / and', pat: '\\b(?:also|additionally|and\\s+also|moreover|furthermore|plus)\\b', moveType: 'elaboration', effect: 'add-to-ground', pri: 70 },
  { id: 'gp-wait', label: 'Wait / hold on', pat: '\\b(?:wait|hold\\s+on|hang\\s+on|one\\s+moment|pause)\\b', moveType: 'challenge', effect: 'challenge-entry', pri: 78 },
  { id: 'gp-so', label: 'So (summary)', pat: '\\bso\\s+(?:basically|essentially|in\\s+other\\s+words|to\\s+summarize|that\\s+means)\\b', moveType: 'paraphrase', effect: 'paraphrase-ground', pri: 72 },
  { id: 'gp-what-do-you-mean', label: 'What do you mean?', pat: '\\b(?:what\\s+do\\s+you\\s+mean|what\\s+does\\s+that\\s+mean|can\\s+you\\s+clarify|I\\s+don\'t\\s+understand)\\b', moveType: 'clarification-request', effect: 'request-clarification', pri: 82 },
  { id: 'gp-right-so', label: 'Right, so...', pat: '\\bright\\s*,\\s*so\\b', moveType: 'continuation', effect: 'continue-ground', pri: 68 },
  { id: 'gp-anyway', label: 'Anyway / moving on', pat: '\\b(?:anyway|moving\\s+on|let\'s\\s+continue|back\\s+to|as\\s+I\\s+was\\s+saying)\\b', moveType: 'redirect', effect: 'redirect-focus', pri: 65 },
  { id: 'gp-let-me-repeat', label: 'Repeat', pat: '\\b(?:let\\s+me\\s+repeat|to\\s+repeat|again|once\\s+more|I\\s+said)\\b', moveType: 'repetition', effect: 'reinforce-ground', pri: 74 },
  { id: 'gp-that-is', label: 'That is / meaning', pat: '\\b(?:that\\s+is|meaning|in\\s+other\\s+words|i\\.e\\.|namely)\\b', moveType: 'paraphrase', effect: 'paraphrase-ground', pri: 71 },
  { id: 'gp-forget', label: 'Forget that', pat: '\\b(?:forget\\s+(?:that|it|about\\s+it)|never\\s+mind|scratch\\s+that|disregard)\\b', moveType: 'retraction', effect: 'retract-entry', pri: 87 },
  { id: 'gp-like-i-said', label: 'Like I said', pat: '\\b(?:like\\s+I\\s+said|as\\s+I\\s+said|as\\s+mentioned|I\\s+already\\s+said)\\b', moveType: 'repetition', effect: 'reinforce-ground', pri: 73 },
  { id: 'gp-fine', label: 'Fine / alright', pat: '\\b(?:fine|alright|all\\s+right|fair\\s+enough|works\\s+for\\s+me)\\b', moveType: 'default-accept', effect: 'accept-default', pri: 75 },
  { id: 'gp-hmm', label: 'Hmm / thinking', pat: '\\b(?:hmm|hm|umm|uh|let\\s+me\\s+think)\\b', moveType: 'silence-accept', effect: 'tentative-accept', pri: 40 },
  { id: 'gp-go-back', label: 'Go back', pat: '\\b(?:go\\s+back|backtrack|let\'s\\s+go\\s+back|return\\s+to)\\b', moveType: 'backtrack', effect: 'revert-to-prior', pri: 76 },
  { id: 'gp-to-summarize', label: 'To summarize', pat: '\\b(?:to\\s+summarize|in\\s+summary|summing\\s+up|to\\s+recap|in\\s+short)\\b', moveType: 'summary', effect: 'summarize-ground', pri: 67 },
  { id: 'gp-thats-all', label: 'That\'s all', pat: '\\b(?:that\'s\\s+all|that\'s\\s+it|we\'re\\s+done|finished|nothing\\s+else)\\b', moveType: 'closing', effect: 'close-topic', pri: 60 },
  { id: 'gp-lets-say', label: 'Let\'s say', pat: '\\b(?:let\'s\\s+say|suppose|assuming|given\\s+that|let\\s+us\\s+assume)\\b', moveType: 'expansion', effect: 'hypothetical-ground', pri: 66 },
  { id: 'gp-in-addition', label: 'In addition', pat: '\\b(?:in\\s+addition|on\\s+top\\s+of\\s+that|what\'s\\s+more|not\\s+only\\s+that)\\b', moveType: 'elaboration', effect: 'add-to-ground', pri: 69 },
] as const;

// ---- 213 Helper Utilities ----

function makeGroundId(prefix: string, index: number): string {
  return prefix + '-' + String(index) + '-' + String(Math.floor(Math.random() * 100000));
}

function makeEmptyCommonGround(currentTurn: number): CommonGround {
  return {
    entries: [],
    moves: [],
    currentTurn,
    totalProposed: 0,
    totalGrounded: 0,
    totalRevised: 0,
    totalRetracted: 0,
  };
}

function entriesAsMutable(entries: readonly CommonGroundEntry[]): CommonGroundEntry[] {
  const result: CommonGroundEntry[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e !== undefined) result.push(e);
  }
  return result;
}

function movesAsMutable(moves: readonly GroundingMove[]): GroundingMove[] {
  const result: GroundingMove[] = [];
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (m !== undefined) result.push(m);
  }
  return result;
}

function findEntryByKey(entries: readonly CommonGroundEntry[], key: string): CommonGroundEntry | null {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e !== undefined && e.key === key && e.status !== 'retracted') return e;
  }
  return null;
}

function findEntryById(entries: readonly CommonGroundEntry[], id: string): CommonGroundEntry | null {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e !== undefined && e.entryId === id) return e;
  }
  return null;
}

function replaceEntry(entries: readonly CommonGroundEntry[], updated: CommonGroundEntry): CommonGroundEntry[] {
  const result: CommonGroundEntry[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e === undefined) continue;
    if (e.entryId === updated.entryId) {
      result.push(updated);
    } else {
      result.push(e);
    }
  }
  return result;
}

function appendHistory(
  existing: readonly { readonly turn: number; readonly status: GroundingStatus; readonly value: string }[],
  turn: number,
  status: GroundingStatus,
  value: string
): readonly { readonly turn: number; readonly status: GroundingStatus; readonly value: string }[] {
  const result: { readonly turn: number; readonly status: GroundingStatus; readonly value: string }[] = [];
  for (let i = 0; i < existing.length; i++) {
    const h = existing[i];
    if (h !== undefined) result.push(h);
  }
  result.push({ turn, status, value });
  return result;
}

// ---- 213 Functions ----

/** Create a new empty CommonGround instance. */
export function createCommonGround(currentTurn: number): CommonGround {
  return makeEmptyCommonGround(currentTurn);
}

/** Propose a new entry into the common ground. */
export function proposeEntry(
  ground: CommonGround,
  key: string,
  value: string,
  groundType: CommonGroundType,
  proposedBy: 'user' | 'system',
  turnNumber: number
): CommonGround {
  const existing = findEntryByKey(ground.entries, key);
  if (existing !== null && existing.status === 'grounded') {
    // Already grounded — do not overwrite unless through revision
    return ground;
  }

  const entry: CommonGroundEntry = {
    entryId: makeGroundId('cge', ground.entries.length),
    groundType,
    key,
    value,
    status: 'proposed',
    proposedAtTurn: turnNumber,
    groundedAtTurn: -1,
    lastModifiedTurn: turnNumber,
    proposedBy,
    confidence: 0.5,
    metadata: {},
    history: [{ turn: turnNumber, status: 'proposed', value }],
  };

  const newEntries = entriesAsMutable(ground.entries);
  newEntries.push(entry);

  return {
    entries: newEntries,
    moves: ground.moves,
    currentTurn: Math.max(ground.currentTurn, turnNumber),
    totalProposed: ground.totalProposed + 1,
    totalGrounded: ground.totalGrounded,
    totalRevised: ground.totalRevised,
    totalRetracted: ground.totalRetracted,
  };
}

/** Ground (confirm) a proposed entry. */
export function groundEntry(
  ground: CommonGround,
  entryId: string,
  turnNumber: number
): CommonGround {
  const entry = findEntryById(ground.entries, entryId);
  if (entry === null) return ground;
  if (entry.status !== 'proposed' && entry.status !== 'revised') return ground;

  const updated: CommonGroundEntry = {
    entryId: entry.entryId,
    groundType: entry.groundType,
    key: entry.key,
    value: entry.value,
    status: 'grounded',
    proposedAtTurn: entry.proposedAtTurn,
    groundedAtTurn: turnNumber,
    lastModifiedTurn: turnNumber,
    proposedBy: entry.proposedBy,
    confidence: 0.9,
    metadata: entry.metadata,
    history: appendHistory(entry.history, turnNumber, 'grounded', entry.value),
  };

  return {
    entries: replaceEntry(ground.entries, updated),
    moves: ground.moves,
    currentTurn: Math.max(ground.currentTurn, turnNumber),
    totalProposed: ground.totalProposed,
    totalGrounded: ground.totalGrounded + 1,
    totalRevised: ground.totalRevised,
    totalRetracted: ground.totalRetracted,
  };
}

/** Revise an entry with a new value. */
export function reviseEntry(
  ground: CommonGround,
  entryId: string,
  newValue: string,
  turnNumber: number
): CommonGround {
  const entry = findEntryById(ground.entries, entryId);
  if (entry === null) return ground;

  const updated: CommonGroundEntry = {
    entryId: entry.entryId,
    groundType: entry.groundType,
    key: entry.key,
    value: newValue,
    status: 'revised',
    proposedAtTurn: entry.proposedAtTurn,
    groundedAtTurn: entry.groundedAtTurn,
    lastModifiedTurn: turnNumber,
    proposedBy: entry.proposedBy,
    confidence: 0.7,
    metadata: entry.metadata,
    history: appendHistory(entry.history, turnNumber, 'revised', newValue),
  };

  return {
    entries: replaceEntry(ground.entries, updated),
    moves: ground.moves,
    currentTurn: Math.max(ground.currentTurn, turnNumber),
    totalProposed: ground.totalProposed,
    totalGrounded: ground.totalGrounded,
    totalRevised: ground.totalRevised + 1,
    totalRetracted: ground.totalRetracted,
  };
}

/** Retract an entry from the common ground. */
export function retractEntry(
  ground: CommonGround,
  entryId: string,
  turnNumber: number
): CommonGround {
  const entry = findEntryById(ground.entries, entryId);
  if (entry === null) return ground;
  if (entry.status === 'retracted') return ground;

  const updated: CommonGroundEntry = {
    entryId: entry.entryId,
    groundType: entry.groundType,
    key: entry.key,
    value: entry.value,
    status: 'retracted',
    proposedAtTurn: entry.proposedAtTurn,
    groundedAtTurn: entry.groundedAtTurn,
    lastModifiedTurn: turnNumber,
    proposedBy: entry.proposedBy,
    confidence: 0,
    metadata: entry.metadata,
    history: appendHistory(entry.history, turnNumber, 'retracted', entry.value),
  };

  return {
    entries: replaceEntry(ground.entries, updated),
    moves: ground.moves,
    currentTurn: Math.max(ground.currentTurn, turnNumber),
    totalProposed: ground.totalProposed,
    totalGrounded: ground.totalGrounded,
    totalRevised: ground.totalRevised,
    totalRetracted: ground.totalRetracted + 1,
  };
}

/** Check if an entry key is grounded. */
export function isGrounded(ground: CommonGround, key: string): boolean {
  const entry = findEntryByKey(ground.entries, key);
  return entry !== null && entry.status === 'grounded';
}

/** Look up the grounded value for a key. */
export function lookupGrounded(ground: CommonGround, key: string): string | null {
  const entry = findEntryByKey(ground.entries, key);
  if (entry === null) return null;
  if (entry.status === 'retracted') return null;
  return entry.value;
}

/** Get all grounded entities (entity-binding type entries that are grounded). */
export function getGroundedEntities(ground: CommonGround): readonly CommonGroundEntry[] {
  const result: CommonGroundEntry[] = [];
  for (let i = 0; i < ground.entries.length; i++) {
    const e = ground.entries[i];
    if (e === undefined) continue;
    if (e.groundType === 'entity-binding' && e.status === 'grounded') {
      result.push(e);
    }
  }
  return result;
}

/** Detect a grounding move in an utterance. */
export function detectGroundingMove(
  utterance: string,
  turnNumber: number,
  targetEntryId: string
): GroundingMove | null {
  const lower = utterance.trim().toLowerCase();
  let bestDef: GroundingPatternDef | null = null;
  let bestPri = -1;

  for (let i = 0; i < GROUNDING_PATTERN_DEFS.length; i++) {
    const def = GROUNDING_PATTERN_DEFS[i];
    if (def === undefined) continue;
    const m = matchPattern(lower, def.pat);
    if (m !== null && def.pri > bestPri) {
      bestDef = def;
      bestPri = def.pri;
    }
  }

  if (bestDef === null) return null;

  return {
    moveId: makeGroundId('gm', 0),
    moveType: bestDef.moveType,
    turnNumber,
    utterance,
    targetEntryId,
    effect: bestDef.effect,
    confidence: clampConfidence(bestDef.pri / 100),
  };
}

/** Apply a grounding move to the common ground. */
export function applyGroundingMove(
  ground: CommonGround,
  move: GroundingMove
): CommonGround {
  const newMoves = movesAsMutable(ground.moves);
  newMoves.push(move);

  let updatedGround: CommonGround = {
    entries: ground.entries,
    moves: newMoves,
    currentTurn: Math.max(ground.currentTurn, move.turnNumber),
    totalProposed: ground.totalProposed,
    totalGrounded: ground.totalGrounded,
    totalRevised: ground.totalRevised,
    totalRetracted: ground.totalRetracted,
  };

  if (move.effect === 'confirm-proposed' || move.effect === 'accept-default' || move.effect === 'acknowledge-proposed') {
    updatedGround = groundEntry(updatedGround, move.targetEntryId, move.turnNumber);
  } else if (move.effect === 'reject-proposed') {
    updatedGround = retractEntry(updatedGround, move.targetEntryId, move.turnNumber);
  } else if (move.effect === 'retract-entry') {
    updatedGround = retractEntry(updatedGround, move.targetEntryId, move.turnNumber);
  }

  return updatedGround;
}

/** Format the common ground for human-readable display. */
export function formatCommonGround(ground: CommonGround): string {
  const lines: string[] = [];
  lines.push('Common Ground (turn ' + String(ground.currentTurn) + ')');
  lines.push('  Proposed: ' + String(ground.totalProposed) + ', Grounded: ' + String(ground.totalGrounded) + ', Revised: ' + String(ground.totalRevised) + ', Retracted: ' + String(ground.totalRetracted));
  lines.push('  Entries:');
  for (let i = 0; i < ground.entries.length; i++) {
    const e = ground.entries[i];
    if (e === undefined) continue;
    lines.push('    [' + e.status + '] ' + e.key + ' = "' + e.value + '" (' + e.groundType + ', proposed by ' + e.proposedBy + ' at turn ' + String(e.proposedAtTurn) + ')');
  }
  if (ground.moves.length > 0) {
    lines.push('  Recent moves:');
    const start = Math.max(0, ground.moves.length - 5);
    for (let j = start; j < ground.moves.length; j++) {
      const m = ground.moves[j];
      if (m === undefined) continue;
      lines.push('    Turn ' + String(m.turnNumber) + ': ' + m.moveType + ' — ' + m.effect + ' (target: ' + m.targetEntryId + ')');
    }
  }
  return lines.join('\n');
}

/** Export common ground as a snapshot for serialization. */
export function exportCommonGround(ground: CommonGround): CommonGroundSnapshot {
  return {
    entries: ground.entries,
    exportedAtTurn: ground.currentTurn,
    timestamp: Date.now(),
  };
}

/** Import a common ground snapshot. */
export function importCommonGround(snapshot: CommonGroundSnapshot): CommonGround {
  let totalProposed = 0;
  let totalGrounded = 0;
  let totalRevised = 0;
  let totalRetracted = 0;
  for (let i = 0; i < snapshot.entries.length; i++) {
    const e = snapshot.entries[i];
    if (e === undefined) continue;
    totalProposed++;
    if (e.status === 'grounded') totalGrounded++;
    if (e.status === 'revised') totalRevised++;
    if (e.status === 'retracted') totalRetracted++;
  }
  return {
    entries: snapshot.entries,
    moves: [],
    currentTurn: snapshot.exportedAtTurn,
    totalProposed,
    totalGrounded,
    totalRevised,
    totalRetracted,
  };
}

/** Merge two common ground instances, preferring the second on conflicts. */
export function mergeCommonGrounds(a: CommonGround, b: CommonGround): CommonGround {
  const merged = entriesAsMutable(a.entries);
  const aKeys = new Set<string>();
  for (let i = 0; i < a.entries.length; i++) {
    const e = a.entries[i];
    if (e !== undefined) aKeys.add(e.key);
  }

  for (let j = 0; j < b.entries.length; j++) {
    const be = b.entries[j];
    if (be === undefined) continue;
    if (aKeys.has(be.key)) {
      // Replace a's entry with b's if b is more recent
      for (let k = 0; k < merged.length; k++) {
        const ae = merged[k];
        if (ae !== undefined && ae.key === be.key) {
          if (be.lastModifiedTurn >= ae.lastModifiedTurn) {
            merged[k] = be;
          }
          break;
        }
      }
    } else {
      merged.push(be);
    }
  }

  const allMoves = movesAsMutable(a.moves);
  for (let m = 0; m < b.moves.length; m++) {
    const mv = b.moves[m];
    if (mv !== undefined) allMoves.push(mv);
  }

  return {
    entries: merged,
    moves: allMoves,
    currentTurn: Math.max(a.currentTurn, b.currentTurn),
    totalProposed: a.totalProposed + b.totalProposed,
    totalGrounded: a.totalGrounded + b.totalGrounded,
    totalRevised: a.totalRevised + b.totalRevised,
    totalRetracted: a.totalRetracted + b.totalRetracted,
  };
}

/** Prune entries that have not been modified for more than `staleTurns` turns. */
export function pruneStaleEntries(ground: CommonGround, staleTurns: number): CommonGround {
  const kept: CommonGroundEntry[] = [];
  let retractCount = 0;
  for (let i = 0; i < ground.entries.length; i++) {
    const e = ground.entries[i];
    if (e === undefined) continue;
    const age = ground.currentTurn - e.lastModifiedTurn;
    if (age > staleTurns && e.status !== 'grounded') {
      // Stale and not firmly grounded — prune
      retractCount++;
    } else {
      kept.push(e);
    }
  }
  return {
    entries: kept,
    moves: ground.moves,
    currentTurn: ground.currentTurn,
    totalProposed: ground.totalProposed,
    totalGrounded: ground.totalGrounded,
    totalRevised: ground.totalRevised,
    totalRetracted: ground.totalRetracted + retractCount,
  };
}


// ===================== STEP 214: SDRT DISCOURSE RELATIONS =====================

// ---- 214 Types ----

/** Classification of discourse relations (SDRT-inspired). */
export type DiscourseRelationType =
  | 'elaboration'
  | 'narration'
  | 'contrast'
  | 'result'
  | 'parallel'
  | 'background'
  | 'explanation'
  | 'correction'
  | 'alternation'
  | 'continuation'
  | 'comment'
  | 'attribution'
  | 'condition'
  | 'consequence'
  | 'concession'
  | 'summary';

/** The planning effect of a discourse relation. */
export type PlanEffect =
  | 'ordered-steps'
  | 'opposing-constraints'
  | 'dependency-chain'
  | 'independent-parallel'
  | 'contextual-info'
  | 'causal-link'
  | 'alternative-branch'
  | 'override-previous'
  | 'conditional-gate'
  | 'scope-elaboration'
  | 'annotation-only'
  | 'summary-merge';

/** A cue word / phrase that signals a discourse relation. */
export interface RelationCue {
  readonly cueId: string;
  readonly cuePhrase: string;
  readonly pattern: string;
  readonly relationType: DiscourseRelationType;
  readonly planEffect: PlanEffect;
  readonly description: string;
  readonly priority: number;
}

/** A detected discourse relation between two segments. */
export interface DiscourseRelation {
  readonly relationId: string;
  readonly relationType: DiscourseRelationType;
  readonly cue: RelationCue;
  readonly sourceSegmentId: string;
  readonly targetSegmentId: string;
  readonly planEffect: PlanEffect;
  readonly confidence: number;
  readonly explanation: string;
}

/** A discourse segment (unit of meaning). */
export interface SDRTSegment {
  readonly segmentId: string;
  readonly text: string;
  readonly turnNumber: number;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly isRoot: boolean;
  readonly parentSegmentId: string;
}

/** A graph of discourse segments and relations. */
export interface SDRTGraph {
  readonly segments: readonly SDRTSegment[];
  readonly relations: readonly DiscourseRelation[];
  readonly rootSegmentId: string;
  readonly totalSegments: number;
  readonly totalRelations: number;
}

/** Cue word pattern definition. */
interface CuePatternDef {
  readonly id: string;
  readonly phrase: string;
  readonly pat: string;
  readonly rel: DiscourseRelationType;
  readonly eff: PlanEffect;
  readonly desc: string;
  readonly pri: number;
}

/** Summary of discourse structure. */
export interface DiscourseStructureSummary {
  readonly dominantRelation: DiscourseRelationType;
  readonly relationCounts: Record<string, number>;
  readonly planEffects: readonly PlanEffect[];
  readonly contrastPairCount: number;
  readonly narrativeChainLength: number;
  readonly explanation: string;
}

// ---- 214 Cue Word Patterns (40+) ----

const CUE_PATTERN_DEFS: readonly CuePatternDef[] = [
  { id: 'cue-but', phrase: 'but', pat: '\\bbut\\b', rel: 'contrast', eff: 'opposing-constraints', desc: 'Contrast between segments', pri: 90 },
  { id: 'cue-however', phrase: 'however', pat: '\\bhowever\\b', rel: 'contrast', eff: 'opposing-constraints', desc: 'Formal contrast marker', pri: 88 },
  { id: 'cue-although', phrase: 'although', pat: '\\b(?:although|though|even\\s+though)\\b', rel: 'concession', eff: 'opposing-constraints', desc: 'Concessive contrast', pri: 85 },
  { id: 'cue-yet', phrase: 'yet', pat: '\\byet\\b', rel: 'contrast', eff: 'opposing-constraints', desc: 'Adversative contrast', pri: 82 },
  { id: 'cue-on-other-hand', phrase: 'on the other hand', pat: '\\bon\\s+the\\s+other\\s+hand\\b', rel: 'contrast', eff: 'opposing-constraints', desc: 'Explicit two-sided contrast', pri: 87 },
  { id: 'cue-so', phrase: 'so', pat: '\\bso\\b(?!\\s+(?:that|far|much|many|long))', rel: 'result', eff: 'dependency-chain', desc: 'Result / consequence', pri: 80 },
  { id: 'cue-therefore', phrase: 'therefore', pat: '\\b(?:therefore|thus|hence|consequently|as\\s+a\\s+result)\\b', rel: 'result', eff: 'dependency-chain', desc: 'Formal result marker', pri: 86 },
  { id: 'cue-then-seq', phrase: 'then', pat: '\\bthen\\b', rel: 'narration', eff: 'ordered-steps', desc: 'Sequential narration', pri: 78 },
  { id: 'cue-next', phrase: 'next', pat: '\\b(?:next|after\\s+that|afterwards|subsequently)\\b', rel: 'narration', eff: 'ordered-steps', desc: 'Next step in sequence', pri: 79 },
  { id: 'cue-first', phrase: 'first', pat: '\\b(?:first|firstly|to\\s+start|to\\s+begin)\\b', rel: 'narration', eff: 'ordered-steps', desc: 'Start of ordered sequence', pri: 83 },
  { id: 'cue-second', phrase: 'second', pat: '\\b(?:second|secondly|after\\s+that)\\b', rel: 'narration', eff: 'ordered-steps', desc: 'Second step', pri: 81 },
  { id: 'cue-finally', phrase: 'finally', pat: '\\b(?:finally|lastly|at\\s+last|in\\s+the\\s+end)\\b', rel: 'narration', eff: 'ordered-steps', desc: 'Final step in sequence', pri: 82 },
  { id: 'cue-also', phrase: 'also', pat: '\\b(?:also|too|as\\s+well|in\\s+addition)\\b', rel: 'continuation', eff: 'independent-parallel', desc: 'Additional information', pri: 70 },
  { id: 'cue-and', phrase: 'and', pat: '\\band\\b(?!\\s+(?:then|so|also))', rel: 'continuation', eff: 'independent-parallel', desc: 'Simple conjunction', pri: 65 },
  { id: 'cue-moreover', phrase: 'moreover', pat: '\\b(?:moreover|furthermore|besides|what\'s\\s+more)\\b', rel: 'continuation', eff: 'independent-parallel', desc: 'Formal continuation', pri: 72 },
  { id: 'cue-because', phrase: 'because', pat: '\\b(?:because|since|as|due\\s+to|owing\\s+to)\\b', rel: 'explanation', eff: 'causal-link', desc: 'Causal explanation', pri: 84 },
  { id: 'cue-reason', phrase: 'the reason', pat: '\\bthe\\s+reason\\b', rel: 'explanation', eff: 'causal-link', desc: 'Explicit reason', pri: 76 },
  { id: 'cue-instead', phrase: 'instead', pat: '\\b(?:instead|rather\\s+than|in\\s+place\\s+of)\\b', rel: 'correction', eff: 'override-previous', desc: 'Replacement / correction', pri: 89 },
  { id: 'cue-or', phrase: 'or', pat: '\\b(?:or|alternatively|either)\\b', rel: 'alternation', eff: 'alternative-branch', desc: 'Alternative options', pri: 75 },
  { id: 'cue-otherwise', phrase: 'otherwise', pat: '\\b(?:otherwise|or\\s+else|failing\\s+that)\\b', rel: 'alternation', eff: 'alternative-branch', desc: 'Fallback alternative', pri: 77 },
  { id: 'cue-meanwhile', phrase: 'meanwhile', pat: '\\b(?:meanwhile|at\\s+the\\s+same\\s+time|simultaneously|concurrently)\\b', rel: 'parallel', eff: 'independent-parallel', desc: 'Parallel / simultaneous events', pri: 74 },
  { id: 'cue-while', phrase: 'while', pat: '\\bwhile\\b', rel: 'parallel', eff: 'independent-parallel', desc: 'Temporal overlap', pri: 68 },
  { id: 'cue-if', phrase: 'if', pat: '\\bif\\b(?!\\s+(?:possible|you\\s+can))', rel: 'condition', eff: 'conditional-gate', desc: 'Conditional gate', pri: 80 },
  { id: 'cue-when', phrase: 'when', pat: '\\bwhen\\b', rel: 'condition', eff: 'conditional-gate', desc: 'Temporal condition', pri: 73 },
  { id: 'cue-in-case', phrase: 'in case', pat: '\\bin\\s+case\\b', rel: 'condition', eff: 'conditional-gate', desc: 'Contingency', pri: 71 },
  { id: 'cue-for-example', phrase: 'for example', pat: '\\b(?:for\\s+example|for\\s+instance|such\\s+as|like|e\\.g\\.)\\b', rel: 'elaboration', eff: 'scope-elaboration', desc: 'Example elaboration', pri: 69 },
  { id: 'cue-specifically', phrase: 'specifically', pat: '\\b(?:specifically|in\\s+particular|namely|that\\s+is)\\b', rel: 'elaboration', eff: 'scope-elaboration', desc: 'Specific elaboration', pri: 71 },
  { id: 'cue-in-other-words', phrase: 'in other words', pat: '\\b(?:in\\s+other\\s+words|put\\s+differently|to\\s+put\\s+it\\s+another\\s+way)\\b', rel: 'elaboration', eff: 'scope-elaboration', desc: 'Paraphrase elaboration', pri: 67 },
  { id: 'cue-by-the-way', phrase: 'by the way', pat: '\\b(?:by\\s+the\\s+way|incidentally|as\\s+an\\s+aside)\\b', rel: 'comment', eff: 'annotation-only', desc: 'Aside / comment', pri: 55 },
  { id: 'cue-note-that', phrase: 'note that', pat: '\\b(?:note\\s+that|notice\\s+that|observe\\s+that|bear\\s+in\\s+mind)\\b', rel: 'comment', eff: 'annotation-only', desc: 'Meta-comment', pri: 58 },
  { id: 'cue-according-to', phrase: 'according to', pat: '\\b(?:according\\s+to|based\\s+on|as\\s+per)\\b', rel: 'attribution', eff: 'contextual-info', desc: 'Source attribution', pri: 60 },
  { id: 'cue-apparently', phrase: 'apparently', pat: '\\b(?:apparently|seemingly|supposedly)\\b', rel: 'attribution', eff: 'contextual-info', desc: 'Hedged attribution', pri: 56 },
  { id: 'cue-in-summary', phrase: 'in summary', pat: '\\b(?:in\\s+summary|to\\s+sum\\s+up|overall|all\\s+in\\s+all|in\\s+conclusion)\\b', rel: 'summary', eff: 'summary-merge', desc: 'Summary of preceding', pri: 66 },
  { id: 'cue-before', phrase: 'before', pat: '\\bbefore\\b', rel: 'background', eff: 'contextual-info', desc: 'Background temporal', pri: 62 },
  { id: 'cue-after', phrase: 'after', pat: '\\bafter\\b', rel: 'narration', eff: 'ordered-steps', desc: 'After-sequence', pri: 74 },
  { id: 'cue-as-a-consequence', phrase: 'as a consequence', pat: '\\b(?:as\\s+a\\s+consequence|it\\s+follows|that\\s+means)\\b', rel: 'consequence', eff: 'dependency-chain', desc: 'Consequence chain', pri: 78 },
  { id: 'cue-despite', phrase: 'despite', pat: '\\b(?:despite|in\\s+spite\\s+of|notwithstanding)\\b', rel: 'concession', eff: 'opposing-constraints', desc: 'Concession despite opposition', pri: 83 },
  { id: 'cue-still', phrase: 'still', pat: '\\bstill\\b(?!\\s+(?:life|image|photo))', rel: 'concession', eff: 'opposing-constraints', desc: 'Persisting despite contrast', pri: 70 },
  { id: 'cue-namely', phrase: 'namely', pat: '\\bnamely\\b', rel: 'elaboration', eff: 'scope-elaboration', desc: 'Precise elaboration', pri: 68 },
  { id: 'cue-given-that', phrase: 'given that', pat: '\\bgiven\\s+(?:that|this)\\b', rel: 'background', eff: 'contextual-info', desc: 'Given background info', pri: 64 },
  { id: 'cue-once', phrase: 'once', pat: '\\bonce\\b(?!\\s+(?:more|again))', rel: 'condition', eff: 'conditional-gate', desc: 'Temporal condition trigger', pri: 69 },
  { id: 'cue-provided', phrase: 'provided', pat: '\\b(?:provided\\s+(?:that)?|as\\s+long\\s+as)\\b', rel: 'condition', eff: 'conditional-gate', desc: 'Conditional provision', pri: 72 },
] as const;

// ---- 214 Helper Utilities ----

function makeSDRTId(prefix: string, index: number): string {
  return prefix + '-' + String(index) + '-' + String(Math.floor(Math.random() * 100000));
}

function segmentText(text: string): readonly { readonly start: number; readonly end: number; readonly content: string }[] {
  // Split on sentence boundaries or major discourse connectives
  const segments: { readonly start: number; readonly end: number; readonly content: string }[] = [];
  const sentenceSplitters = /[.!?;]+|\b(?:but|so|then|however|therefore|instead|meanwhile|because|although)\b/gi;
  let lastEnd = 0;
  let m: RegExpExecArray | null = sentenceSplitters.exec(text);
  while (m !== null) {
    const boundary = m.index;
    if (boundary > lastEnd) {
      const seg = text.substring(lastEnd, boundary).trim();
      if (seg.length > 0) {
        segments.push({ start: lastEnd, end: boundary, content: seg });
      }
    }
    lastEnd = boundary + m[0].length;
    m = sentenceSplitters.exec(text);
  }
  // Remainder
  if (lastEnd < text.length) {
    const remainder = text.substring(lastEnd).trim();
    if (remainder.length > 0) {
      segments.push({ start: lastEnd, end: text.length, content: remainder });
    }
  }
  if (segments.length === 0 && text.trim().length > 0) {
    segments.push({ start: 0, end: text.length, content: text.trim() });
  }
  return segments;
}

function countRelationType(relations: readonly DiscourseRelation[], relType: DiscourseRelationType): number {
  let count = 0;
  for (let i = 0; i < relations.length; i++) {
    const r = relations[i];
    if (r !== undefined && r.relationType === relType) count++;
  }
  return count;
}

function computeNarrativeChainLength(relations: readonly DiscourseRelation[]): number {
  let maxChain = 0;
  let currentChain = 0;
  for (let i = 0; i < relations.length; i++) {
    const r = relations[i];
    if (r !== undefined && r.relationType === 'narration') {
      currentChain++;
      if (currentChain > maxChain) maxChain = currentChain;
    } else {
      currentChain = 0;
    }
  }
  return maxChain;
}

// ---- 214 Functions ----

/** Get all relation cue definitions. */
export function getRelationCues(): readonly RelationCue[] {
  const result: RelationCue[] = [];
  for (let i = 0; i < CUE_PATTERN_DEFS.length; i++) {
    const def = CUE_PATTERN_DEFS[i];
    if (def === undefined) continue;
    result.push({
      cueId: def.id,
      cuePhrase: def.phrase,
      pattern: def.pat,
      relationType: def.rel,
      planEffect: def.eff,
      description: def.desc,
      priority: def.pri,
    });
  }
  return result;
}

/** Detect discourse relations in a text. */
export function detectDiscourseRelations(text: string, _turnNumber: number): readonly DiscourseRelation[] {
  const lower = text.toLowerCase();
  const results: DiscourseRelation[] = [];
  const segs = segmentText(text);
  let idx = 0;

  for (let i = 0; i < CUE_PATTERN_DEFS.length; i++) {
    const def = CUE_PATTERN_DEFS[i];
    if (def === undefined) continue;
    const m = matchPattern(lower, def.pat);
    if (m === null) continue;

    // Determine source and target segments around the cue
    const cueOffset = m.index ?? 0;
    let sourceSegId = 'seg-0';
    let targetSegId = 'seg-1';
    for (let s = 0; s < segs.length; s++) {
      const seg = segs[s];
      if (seg === undefined) continue;
      if (cueOffset >= seg.start && cueOffset < seg.end) {
        sourceSegId = 'seg-' + String(Math.max(0, s - 1));
        targetSegId = 'seg-' + String(s);
        break;
      }
    }

    const cue: RelationCue = {
      cueId: def.id,
      cuePhrase: def.phrase,
      pattern: def.pat,
      relationType: def.rel,
      planEffect: def.eff,
      description: def.desc,
      priority: def.pri,
    };

    results.push({
      relationId: makeSDRTId('dr', idx),
      relationType: def.rel,
      cue,
      sourceSegmentId: sourceSegId,
      targetSegmentId: targetSegId,
      planEffect: def.eff,
      confidence: clampConfidence(def.pri / 100),
      explanation: 'Cue "' + def.phrase + '" signals ' + def.rel + ' relation (' + def.desc + ')',
    });
    idx++;
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/** Classify a single relation from a cue phrase. */
export function classifyRelation(cuePhrase: string): DiscourseRelationType {
  const lower = cuePhrase.toLowerCase();
  for (let i = 0; i < CUE_PATTERN_DEFS.length; i++) {
    const def = CUE_PATTERN_DEFS[i];
    if (def === undefined) continue;
    const m = matchPattern(lower, def.pat);
    if (m !== null) return def.rel;
  }
  return 'continuation';
}

/** Build a full SDRT graph from a multi-sentence text. */
export function buildSDRTGraph(text: string, turnNumber: number): SDRTGraph {
  const rawSegs = segmentText(text);
  const segments: SDRTSegment[] = [];
  const rootId = makeSDRTId('seg', 0);

  for (let i = 0; i < rawSegs.length; i++) {
    const raw = rawSegs[i];
    if (raw === undefined) continue;
    const segId = i === 0 ? rootId : makeSDRTId('seg', i);
    segments.push({
      segmentId: segId,
      text: raw.content,
      turnNumber,
      startOffset: raw.start,
      endOffset: raw.end,
      isRoot: i === 0,
      parentSegmentId: i === 0 ? '' : rootId,
    });
  }

  const relations = detectDiscourseRelations(text, turnNumber);
  // Re-link relation source/target to actual segment ids
  const linkedRelations: DiscourseRelation[] = [];
  for (let r = 0; r < relations.length; r++) {
    const rel = relations[r];
    if (rel === undefined) continue;
    const srcIdx = parseInt(rel.sourceSegmentId.replace('seg-', ''), 10);
    const tgtIdx = parseInt(rel.targetSegmentId.replace('seg-', ''), 10);
    const srcSeg = !isNaN(srcIdx) && srcIdx >= 0 && srcIdx < segments.length ? segments[srcIdx] : undefined;
    const tgtSeg = !isNaN(tgtIdx) && tgtIdx >= 0 && tgtIdx < segments.length ? segments[tgtIdx] : undefined;
    linkedRelations.push({
      relationId: rel.relationId,
      relationType: rel.relationType,
      cue: rel.cue,
      sourceSegmentId: srcSeg !== undefined ? srcSeg.segmentId : rel.sourceSegmentId,
      targetSegmentId: tgtSeg !== undefined ? tgtSeg.segmentId : rel.targetSegmentId,
      planEffect: rel.planEffect,
      confidence: rel.confidence,
      explanation: rel.explanation,
    });
  }

  return {
    segments,
    relations: linkedRelations,
    rootSegmentId: rootId,
    totalSegments: segments.length,
    totalRelations: linkedRelations.length,
  };
}

/** Get the relation between two specific segments in a graph. */
export function getRelationBetween(
  graph: SDRTGraph,
  sourceId: string,
  targetId: string
): DiscourseRelation | null {
  for (let i = 0; i < graph.relations.length; i++) {
    const r = graph.relations[i];
    if (r === undefined) continue;
    if (r.sourceSegmentId === sourceId && r.targetSegmentId === targetId) return r;
  }
  return null;
}

/** Find all contrast pairs in a graph. */
export function findContrastPairs(graph: SDRTGraph): readonly { readonly source: string; readonly target: string; readonly relation: DiscourseRelation }[] {
  const pairs: { readonly source: string; readonly target: string; readonly relation: DiscourseRelation }[] = [];
  for (let i = 0; i < graph.relations.length; i++) {
    const r = graph.relations[i];
    if (r === undefined) continue;
    if (r.relationType === 'contrast' || r.relationType === 'concession') {
      pairs.push({ source: r.sourceSegmentId, target: r.targetSegmentId, relation: r });
    }
  }
  return pairs;
}

/** Resolve ambiguity when multiple relations are detected for the same cue. */
export function resolveRelationAmbiguity(relations: readonly DiscourseRelation[]): DiscourseRelation | null {
  if (relations.length === 0) return null;
  let best: DiscourseRelation | null = null;
  let bestConf = -1;
  for (let i = 0; i < relations.length; i++) {
    const r = relations[i];
    if (r !== undefined && r.confidence > bestConf) {
      best = r;
      bestConf = r.confidence;
    }
  }
  return best;
}

/** Apply a discourse relation to planning: returns a plan-effect description. */
export function applyRelationToPlanning(relation: DiscourseRelation): string {
  const effect = relation.planEffect;
  const cuePhrase = relation.cue.cuePhrase;
  if (effect === 'ordered-steps') {
    return 'ORDER: segments connected by "' + cuePhrase + '" must execute sequentially';
  }
  if (effect === 'opposing-constraints') {
    return 'CONTRAST: segments connected by "' + cuePhrase + '" represent opposing constraints — balance needed';
  }
  if (effect === 'dependency-chain') {
    return 'DEPENDENCY: result segment depends on source — "' + cuePhrase + '" implies causal link';
  }
  if (effect === 'independent-parallel') {
    return 'PARALLEL: segments connected by "' + cuePhrase + '" can execute independently';
  }
  if (effect === 'contextual-info') {
    return 'BACKGROUND: "' + cuePhrase + '" provides context — no ordering constraint';
  }
  if (effect === 'causal-link') {
    return 'CAUSE: "' + cuePhrase + '" signals explanatory link — source causes target';
  }
  if (effect === 'alternative-branch') {
    return 'ALTERNATIVE: "' + cuePhrase + '" signals branching — choose one path';
  }
  if (effect === 'override-previous') {
    return 'OVERRIDE: "' + cuePhrase + '" replaces previous segment — discard source';
  }
  if (effect === 'conditional-gate') {
    return 'CONDITION: "' + cuePhrase + '" gates execution — target only if source satisfied';
  }
  if (effect === 'scope-elaboration') {
    return 'ELABORATE: "' + cuePhrase + '" refines source — target adds detail';
  }
  if (effect === 'annotation-only') {
    return 'COMMENT: "' + cuePhrase + '" is meta-information — no plan effect';
  }
  if (effect === 'summary-merge') {
    return 'SUMMARY: "' + cuePhrase + '" summarizes preceding — can collapse steps';
  }
  return 'UNKNOWN: no plan effect determined for "' + cuePhrase + '"';
}

/** Get the planning effects for a set of relations. */
export function getRelationEffects(relations: readonly DiscourseRelation[]): readonly string[] {
  const effects: string[] = [];
  for (let i = 0; i < relations.length; i++) {
    const r = relations[i];
    if (r !== undefined) {
      effects.push(applyRelationToPlanning(r));
    }
  }
  return effects;
}

/** Format an SDRT graph for human-readable display. */
export function formatSDRTGraph(graph: SDRTGraph): string {
  const lines: string[] = [];
  lines.push('SDRT Graph (' + String(graph.totalSegments) + ' segments, ' + String(graph.totalRelations) + ' relations)');
  lines.push('  Root: ' + graph.rootSegmentId);
  lines.push('  Segments:');
  for (let i = 0; i < graph.segments.length; i++) {
    const seg = graph.segments[i];
    if (seg === undefined) continue;
    const rootMark = seg.isRoot ? ' [ROOT]' : '';
    lines.push('    ' + seg.segmentId + rootMark + ': "' + seg.text + '"');
  }
  lines.push('  Relations:');
  for (let j = 0; j < graph.relations.length; j++) {
    const r = graph.relations[j];
    if (r === undefined) continue;
    lines.push('    ' + r.sourceSegmentId + ' --[' + r.relationType + ']--> ' + r.targetSegmentId + ' (cue: "' + r.cue.cuePhrase + '", effect: ' + r.planEffect + ')');
  }
  return lines.join('\n');
}

/** Batch-detect discourse relations across multiple utterances. */
export function batchDetectRelations(
  utterances: readonly { readonly text: string; readonly turnNumber: number }[]
): readonly DiscourseRelation[] {
  const all: DiscourseRelation[] = [];
  for (let i = 0; i < utterances.length; i++) {
    const u = utterances[i];
    if (u === undefined) continue;
    const rels = detectDiscourseRelations(u.text, u.turnNumber);
    for (let r = 0; r < rels.length; r++) {
      const rel = rels[r];
      if (rel !== undefined) all.push(rel);
    }
  }
  return all;
}

/** Summarize the discourse structure of a graph. */
export function summarizeDiscourseStructure(graph: SDRTGraph): DiscourseStructureSummary {
  const relationTypes: DiscourseRelationType[] = [
    'elaboration', 'narration', 'contrast', 'result', 'parallel', 'background',
    'explanation', 'correction', 'alternation', 'continuation', 'comment',
    'attribution', 'condition', 'consequence', 'concession', 'summary',
  ];

  const counts: Record<string, number> = {};
  let maxCount = 0;
  let dominant: DiscourseRelationType = 'continuation';

  for (let t = 0; t < relationTypes.length; t++) {
    const rt = relationTypes[t];
    if (rt === undefined) continue;
    const c = countRelationType(graph.relations, rt);
    counts[rt] = c;
    if (c > maxCount) {
      maxCount = c;
      dominant = rt;
    }
  }

  const effects: PlanEffect[] = [];
  const seenEffects = new Set<string>();
  for (let r = 0; r < graph.relations.length; r++) {
    const rel = graph.relations[r];
    if (rel === undefined) continue;
    if (!seenEffects.has(rel.planEffect)) {
      seenEffects.add(rel.planEffect);
      effects.push(rel.planEffect);
    }
  }

  const contrastPairs = findContrastPairs(graph);
  const narrativeLen = computeNarrativeChainLength(graph.relations);

  const explanation = 'Dominant relation: ' + dominant + ' (' + String(maxCount) + ' occurrences). ' +
    'Contrast pairs: ' + String(contrastPairs.length) + '. ' +
    'Narrative chain length: ' + String(narrativeLen) + '. ' +
    'Total relations: ' + String(graph.totalRelations) + '.';

  return {
    dominantRelation: dominant,
    relationCounts: counts,
    planEffects: effects,
    contrastPairCount: contrastPairs.length,
    narrativeChainLength: narrativeLen,
    explanation,
  };
}


// ===================== STEP 215: REPAIR MOVES =====================

// ---- 215 Types ----

/** Classification of repair move types. */
export type RepairType =
  | 'self-repair'
  | 'other-repair'
  | 'clarification-repair'
  | 'correction-repair'
  | 'elaboration-repair'
  | 'retraction-repair';

/** The scope of what a repair affects. */
export type RepairScope =
  | 'referent-only'
  | 'action-only'
  | 'parameter-only'
  | 'target-only'
  | 'full-statement'
  | 'partial-statement'
  | 'constraint-only';

/** A detected repair move in an utterance. */
export interface RepairMove {
  readonly moveId: string;
  readonly repairType: RepairType;
  readonly utterance: string;
  readonly matchedPattern: string;
  readonly triggerPhrase: string;
  readonly replacementText: string;
  readonly rejectedText: string;
  readonly scope: RepairScope;
  readonly confidence: number;
  readonly offsetStart: number;
  readonly offsetEnd: number;
}

/** The target of a repair (what is being corrected). */
export interface RepairTarget {
  readonly targetId: string;
  readonly targetType: string;
  readonly originalValue: string;
  readonly correctedValue: string;
  readonly turnNumber: number;
  readonly fieldName: string;
}

/** The effect of applying a repair. */
export interface RepairEffect {
  readonly effectId: string;
  readonly repairMove: RepairMove;
  readonly target: RepairTarget;
  readonly preservedFields: readonly string[];
  readonly modifiedFields: readonly string[];
  readonly explanation: string;
  readonly confidence: number;
  readonly warnings: readonly string[];
}

/** Configuration for the repair engine. */
export interface RepairConfig {
  readonly minConfidence: number;
  readonly enableMinimalChange: boolean;
  readonly maxHistoryLookback: number;
  readonly allowChainedRepairs: boolean;
  readonly preserveUnrepaired: boolean;
  readonly maxRepairsPerUtterance: number;
}

/** A pattern definition for repair detection. */
interface RepairPatternDef {
  readonly id: string;
  readonly label: string;
  readonly pat: string;
  readonly repType: RepairType;
  readonly scope: RepairScope;
  readonly desc: string;
  readonly exU: string;
  readonly pri: number;
  readonly captureRejected: number;
  readonly captureReplacement: number;
}

/** History entry for undo tracking. */
export interface RepairHistoryEntry {
  readonly entryId: string;
  readonly turnNumber: number;
  readonly repairMove: RepairMove;
  readonly effect: RepairEffect;
  readonly timestamp: number;
  readonly undone: boolean;
}

/** Batch result for repair processing. */
export interface RepairBatchResult {
  readonly effects: readonly RepairEffect[];
  readonly unresolved: readonly RepairMove[];
  readonly totalDetected: number;
  readonly totalApplied: number;
  readonly totalPreservedFields: number;
  readonly totalModifiedFields: number;
}

// ---- 215 Repair Patterns (30+) ----

const REPAIR_PATTERN_DEFS: readonly RepairPatternDef[] = [
  { id: 'rp-no-not-x', label: 'No, not X', pat: '\\bno\\s*,?\\s*not\\s+(.+?)(?:\\s*,\\s*(.+))?$', repType: 'correction-repair', scope: 'referent-only', desc: 'Reject referent, optionally provide replacement', exU: 'no, not that chorus', pri: 95, captureRejected: 1, captureReplacement: 2 },
  { id: 'rp-i-mean', label: 'I mean X', pat: '\\bI\\s+mean\\s+(.+)', repType: 'self-repair', scope: 'referent-only', desc: 'Self-correction of referent', exU: 'I mean the second chorus', pri: 92, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-actually', label: 'Actually, X', pat: '\\bactually\\s*,?\\s*(.+)', repType: 'correction-repair', scope: 'partial-statement', desc: 'Correct previous statement', exU: 'actually, the verse', pri: 90, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-wait', label: 'Wait, X', pat: '\\bwait\\s*,?\\s*(.+)', repType: 'retraction-repair', scope: 'full-statement', desc: 'Retract and replace', exU: 'wait, I meant the bridge', pri: 88, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-sorry', label: 'Sorry, X', pat: '\\bsorry\\s*,?\\s*(.+)', repType: 'self-repair', scope: 'full-statement', desc: 'Apologetic self-correction', exU: 'sorry, I meant the outro', pri: 86, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-not-that-the', label: 'Not that, the X', pat: '\\bnot\\s+that\\s*,?\\s*(?:the\\s+)?(.+)', repType: 'correction-repair', scope: 'referent-only', desc: 'Reject current, bind to described referent', exU: 'not that, the other one', pri: 93, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-the-other-one', label: 'The other one', pat: '\\bthe\\s+other\\s+(?:one|track|section|part|chorus|verse|bridge)\\b', repType: 'correction-repair', scope: 'referent-only', desc: 'Rebind to alternative referent', exU: 'no, the other one', pri: 87, captureRejected: -1, captureReplacement: -1 },
  { id: 'rp-i-said', label: 'I said X', pat: '\\bI\\s+said\\s+(.+)', repType: 'other-repair', scope: 'full-statement', desc: 'Reassert a prior statement', exU: 'I said the chorus', pri: 84, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-no-i-want', label: 'No, I want X', pat: '\\bno\\s*,?\\s*I\\s+want\\s+(.+)', repType: 'correction-repair', scope: 'full-statement', desc: 'Reject and restate desire', exU: 'no, I want the verse louder', pri: 94, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-thats-wrong', label: 'That\'s wrong', pat: '\\b(?:that\'s\\s+wrong|that\'s\\s+not\\s+(?:right|correct|what\\s+I\\s+(?:said|meant|wanted)))', repType: 'other-repair', scope: 'full-statement', desc: 'Flag error in system understanding', exU: 'that\'s wrong', pri: 89, captureRejected: -1, captureReplacement: -1 },
  { id: 'rp-not-x-y', label: 'Not X, Y', pat: '\\bnot\\s+(.+?)\\s*,\\s*(.+)', repType: 'correction-repair', scope: 'referent-only', desc: 'Explicit reject-and-replace', exU: 'not the verse, the chorus', pri: 96, captureRejected: 1, captureReplacement: 2 },
  { id: 'rp-let-me-rephrase', label: 'Let me rephrase', pat: '\\b(?:let\\s+me\\s+rephrase|to\\s+rephrase|what\\s+I\\s+meant\\s+(?:was|is))\\s*[,:]?\\s*(.+)', repType: 'self-repair', scope: 'full-statement', desc: 'Full rephrase of prior utterance', exU: 'let me rephrase: make the chorus louder', pri: 85, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-no-no', label: 'No no', pat: '\\bno\\s+no\\s*,?\\s*(.+)?', repType: 'retraction-repair', scope: 'full-statement', desc: 'Emphatic retraction', exU: 'no no, the bridge', pri: 91, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-correction', label: 'Correction:', pat: '\\b(?:correction|let\\s+me\\s+correct\\s+(?:that|myself))\\s*[,:]?\\s*(.+)', repType: 'self-repair', scope: 'partial-statement', desc: 'Explicit correction marker', exU: 'correction: 120 BPM not 100', pri: 87, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-wrong-one', label: 'Wrong one', pat: '\\b(?:wrong\\s+one|wrong\\s+(?:track|section|part|chorus|verse|bridge))\\b', repType: 'other-repair', scope: 'referent-only', desc: 'Flag wrong referent selection', exU: 'wrong one', pri: 88, captureRejected: -1, captureReplacement: -1 },
  { id: 'rp-scratch-that', label: 'Scratch that', pat: '\\b(?:scratch\\s+that|forget\\s+(?:that|it|what\\s+I\\s+said)|never\\s+mind(?:\\s+that)?)\\s*,?\\s*(.+)?', repType: 'retraction-repair', scope: 'full-statement', desc: 'Complete retraction', exU: 'scratch that, do the verse instead', pri: 90, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-on-second-thought', label: 'On second thought', pat: '\\b(?:on\\s+second\\s+thought|thinking\\s+about\\s+it|come\\s+to\\s+think)\\s*,?\\s*(.+)', repType: 'self-repair', scope: 'full-statement', desc: 'Reflective self-repair', exU: 'on second thought, keep the original', pri: 83, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-i-didnt-mean', label: 'I didn\'t mean', pat: '\\bI\\s+didn\'t\\s+mean\\s+(.+?)(?:\\s*,\\s*I\\s+meant\\s+(.+))?', repType: 'self-repair', scope: 'referent-only', desc: 'Explicit rejection of prior meaning', exU: 'I didn\'t mean the verse, I meant the chorus', pri: 91, captureRejected: 1, captureReplacement: 2 },
  { id: 'rp-replace-x-with-y', label: 'Replace X with Y', pat: '\\breplace\\s+(.+?)\\s+with\\s+(.+)', repType: 'correction-repair', scope: 'parameter-only', desc: 'Explicit parameter replacement', exU: 'replace reverb with delay', pri: 82, captureRejected: 1, captureReplacement: 2 },
  { id: 'rp-change-to', label: 'Change to X', pat: '\\b(?:change\\s+(?:it|that)\\s+to|switch\\s+(?:it|that)\\s+to|make\\s+(?:it|that))\\s+(.+)', repType: 'correction-repair', scope: 'parameter-only', desc: 'Change parameter value', exU: 'change it to 120 BPM', pri: 81, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-no-the-x', label: 'No, the X', pat: '\\bno\\s*,?\\s*the\\s+(.+)', repType: 'correction-repair', scope: 'referent-only', desc: 'Reject and rebind via definite description', exU: 'no, the second verse', pri: 93, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-not-there', label: 'Not there', pat: '\\bnot\\s+(?:there|here|that\\s+(?:one|part|section))\\b', repType: 'correction-repair', scope: 'target-only', desc: 'Reject target location', exU: 'not there', pri: 80, captureRejected: -1, captureReplacement: -1 },
  { id: 'rp-undo-last', label: 'Undo last repair', pat: '\\b(?:undo\\s+(?:that\\s+)?(?:repair|correction|change)|go\\s+back\\s+to\\s+(?:what|how)\\s+(?:it|I)\\s+(?:was|said))\\b', repType: 'retraction-repair', scope: 'full-statement', desc: 'Undo a prior repair', exU: 'undo that correction', pri: 79, captureRejected: -1, captureReplacement: -1 },
  { id: 'rp-but-not-x', label: 'But not X', pat: '\\bbut\\s+not\\s+(.+)', repType: 'correction-repair', scope: 'constraint-only', desc: 'Add exclusion constraint', exU: 'but not the drums', pri: 78, captureRejected: 1, captureReplacement: -1 },
  { id: 'rp-except', label: 'Except X', pat: '\\b(?:except|excluding|apart\\s+from|other\\s+than)\\s+(.+)', repType: 'elaboration-repair', scope: 'constraint-only', desc: 'Add exception to prior scope', exU: 'except the intro', pri: 77, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-i-misspoke', label: 'I misspoke', pat: '\\b(?:I\\s+misspoke|my\\s+mistake|my\\s+bad|my\\s+fault|my\\s+error)\\s*,?\\s*(.+)?', repType: 'self-repair', scope: 'full-statement', desc: 'Acknowledge error and optionally correct', exU: 'I misspoke, I meant the bridge', pri: 84, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-do-x-not-y', label: 'Do X, not Y', pat: '\\b(?:do|use|apply|try)\\s+(.+?)\\s*,?\\s*not\\s+(.+)', repType: 'correction-repair', scope: 'action-only', desc: 'Assert correct action, reject wrong one', exU: 'use delay, not reverb', pri: 85, captureRejected: 2, captureReplacement: 1 },
  { id: 'rp-thats-not-x', label: 'That\'s not what I X', pat: '\\bthat\'s\\s+not\\s+what\\s+I\\s+(?:meant|said|wanted|asked)\\b', repType: 'other-repair', scope: 'full-statement', desc: 'Dispute system interpretation', exU: 'that\'s not what I meant', pri: 89, captureRejected: -1, captureReplacement: -1 },
  { id: 'rp-hold-on', label: 'Hold on', pat: '\\b(?:hold\\s+on|stop|wait\\s+a\\s+(?:sec|second|minute|moment))\\s*,?\\s*(.+)?', repType: 'retraction-repair', scope: 'full-statement', desc: 'Pause and retract/correct', exU: 'hold on, not the chorus', pri: 82, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-what-i-meant', label: 'What I meant was', pat: '\\bwhat\\s+I\\s+(?:meant|intended|wanted\\s+to\\s+say)\\s+(?:was|is)\\s*[,:]?\\s*(.+)', repType: 'clarification-repair', scope: 'full-statement', desc: 'Clarify intended meaning', exU: 'what I meant was: increase the verse volume', pri: 86, captureRejected: -1, captureReplacement: 1 },
  { id: 'rp-instead-of-x', label: 'Instead of X, Y', pat: '\\binstead\\s+of\\s+(.+?)\\s*,\\s*(.+)', repType: 'correction-repair', scope: 'partial-statement', desc: 'Replace one element with another', exU: 'instead of reverb, use delay', pri: 88, captureRejected: 1, captureReplacement: 2 },
] as const;

// ---- 215 Helper Utilities ----

function makeRepairId(prefix: string, index: number): string {
  return prefix + '-' + String(index) + '-' + String(Math.floor(Math.random() * 100000));
}

function extractRepairTexts(m: RegExpMatchArray, def: RepairPatternDef): { rejected: string; replacement: string } {
  let rejected = '';
  let replacement = '';
  if (def.captureRejected >= 0 && def.captureRejected < m.length) {
    const val = m[def.captureRejected];
    if (val !== undefined) rejected = val.trim();
  }
  if (def.captureReplacement >= 0 && def.captureReplacement < m.length) {
    const val = m[def.captureReplacement];
    if (val !== undefined) replacement = val.trim();
  }
  return { rejected, replacement };
}

function computePreservedAndModified(
  scope: RepairScope,
  allFields: readonly string[]
): { preserved: string[]; modified: string[] } {
  const preserved: string[] = [];
  const modified: string[] = [];

  if (scope === 'referent-only') {
    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (f === undefined) continue;
      if (f === 'referent' || f === 'target') {
        modified.push(f);
      } else {
        preserved.push(f);
      }
    }
  } else if (scope === 'action-only') {
    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (f === undefined) continue;
      if (f === 'action') {
        modified.push(f);
      } else {
        preserved.push(f);
      }
    }
  } else if (scope === 'parameter-only') {
    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (f === undefined) continue;
      if (f === 'parameter' || f === 'value') {
        modified.push(f);
      } else {
        preserved.push(f);
      }
    }
  } else if (scope === 'target-only') {
    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (f === undefined) continue;
      if (f === 'target' || f === 'location') {
        modified.push(f);
      } else {
        preserved.push(f);
      }
    }
  } else if (scope === 'constraint-only') {
    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (f === undefined) continue;
      if (f === 'constraint' || f === 'scope') {
        modified.push(f);
      } else {
        preserved.push(f);
      }
    }
  } else if (scope === 'partial-statement') {
    // Heuristic: modify about half
    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (f === undefined) continue;
      if (i < allFields.length / 2) {
        preserved.push(f);
      } else {
        modified.push(f);
      }
    }
  } else {
    // full-statement: everything is modified
    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (f !== undefined) modified.push(f);
    }
  }

  return { preserved, modified };
}

// ---- 215 Functions ----

/** Check if an utterance contains a repair move. */
export function isRepairMove(utterance: string): boolean {
  const lower = utterance.trim().toLowerCase();
  for (let i = 0; i < REPAIR_PATTERN_DEFS.length; i++) {
    const def = REPAIR_PATTERN_DEFS[i];
    if (def === undefined) continue;
    const m = matchPattern(lower, def.pat);
    if (m !== null) return true;
  }
  return false;
}

/** Detect a repair move in an utterance. */
export function detectRepairMove(utterance: string): RepairMove | null {
  const lower = utterance.trim().toLowerCase();
  let bestDef: RepairPatternDef | null = null;
  let bestMatch: RegExpMatchArray | null = null;
  let bestPri = -1;

  for (let i = 0; i < REPAIR_PATTERN_DEFS.length; i++) {
    const def = REPAIR_PATTERN_DEFS[i];
    if (def === undefined) continue;
    const m = matchPattern(lower, def.pat);
    if (m !== null && def.pri > bestPri) {
      bestDef = def;
      bestMatch = m;
      bestPri = def.pri;
    }
  }

  if (bestDef === null || bestMatch === null) return null;

  const texts = extractRepairTexts(bestMatch, bestDef);
  const matchedText = bestMatch[0] ?? '';
  const offsetStart = bestMatch.index ?? 0;

  return {
    moveId: makeRepairId('rm', 0),
    repairType: bestDef.repType,
    utterance,
    matchedPattern: bestDef.pat,
    triggerPhrase: matchedText,
    replacementText: texts.replacement,
    rejectedText: texts.rejected,
    scope: bestDef.scope,
    confidence: clampConfidence(bestDef.pri / 100),
    offsetStart,
    offsetEnd: offsetStart + matchedText.length,
  };
}

/** Classify a repair move. */
export function classifyRepair(move: RepairMove): RepairType {
  return move.repairType;
}

/** Extract the repair target from a move and dialogue context. */
export function extractRepairTarget(
  move: RepairMove,
  currentAction: string,
  currentTarget: string,
  currentParameters: Record<string, string>,
  turnNumber: number
): RepairTarget {
  let targetType = 'unknown';
  let originalValue = '';
  let correctedValue = move.replacementText;
  let fieldName = 'referent';

  if (move.scope === 'referent-only' || move.scope === 'target-only') {
    targetType = 'referent';
    originalValue = move.rejectedText.length > 0 ? move.rejectedText : currentTarget;
    fieldName = 'target';
  } else if (move.scope === 'action-only') {
    targetType = 'action';
    originalValue = move.rejectedText.length > 0 ? move.rejectedText : currentAction;
    fieldName = 'action';
  } else if (move.scope === 'parameter-only') {
    targetType = 'parameter';
    const paramKeys = Object.keys(currentParameters);
    const firstKey = paramKeys.length > 0 ? paramKeys[0] : undefined;
    originalValue = move.rejectedText.length > 0 ? move.rejectedText : (firstKey !== undefined ? (currentParameters[firstKey] ?? '') : '');
    fieldName = firstKey !== undefined ? firstKey : 'value';
  } else if (move.scope === 'constraint-only') {
    targetType = 'constraint';
    originalValue = move.rejectedText;
    fieldName = 'constraint';
  } else {
    targetType = 'statement';
    originalValue = move.rejectedText.length > 0 ? move.rejectedText : currentAction + ' ' + currentTarget;
    fieldName = 'statement';
  }

  if (correctedValue.length === 0 && move.scope === 'referent-only') {
    correctedValue = '(alternative referent)';
  }

  return {
    targetId: makeRepairId('rt', 0),
    targetType,
    originalValue,
    correctedValue,
    turnNumber,
    fieldName,
  };
}

/** Get the repair scope from a move. */
export function getRepairScope(move: RepairMove): RepairScope {
  return move.scope;
}

/** Apply a repair move, preserving unrepaired meaning (minimal change principle). */
export function applyRepair(
  move: RepairMove,
  target: RepairTarget,
  allFields: readonly string[]
): RepairEffect {
  const { preserved, modified } = computePreservedAndModified(move.scope, allFields);
  const warnings: string[] = [];

  if (move.replacementText.length === 0 && move.rejectedText.length === 0) {
    warnings.push('No replacement or rejection text captured — repair may be incomplete');
  }
  if (move.confidence < 0.7) {
    warnings.push('Low confidence repair detection');
  }
  if (modified.length === 0) {
    warnings.push('No fields identified for modification — repair scope may be too narrow');
  }

  const explanation =
    'Applied ' + move.repairType + ' (scope: ' + move.scope + '): ' +
    (target.originalValue.length > 0 ? 'corrected "' + target.originalValue + '"' : 'corrected target') +
    (target.correctedValue.length > 0 ? ' to "' + target.correctedValue + '"' : '') +
    '. Preserved ' + String(preserved.length) + ' fields, modified ' + String(modified.length) + ' fields.';

  return {
    effectId: makeRepairId('re', 0),
    repairMove: move,
    target,
    preservedFields: preserved,
    modifiedFields: modified,
    explanation,
    confidence: move.confidence,
    warnings,
  };
}

/** Preserve the unrepaired meaning from a prior interpretation. */
export function preserveUnrepairedMeaning(
  priorAction: string,
  priorTarget: string,
  priorParameters: Record<string, string>,
  effect: RepairEffect
): { readonly action: string; readonly target: string; readonly parameters: Record<string, string> } {
  let action = priorAction;
  let target = priorTarget;
  const parameters = copyRecord(priorParameters);

  const modifiedSet = new Set(effect.modifiedFields);

  if (modifiedSet.has('action') || modifiedSet.has('statement')) {
    if (effect.target.correctedValue.length > 0) {
      action = effect.target.correctedValue;
    }
  }
  if (modifiedSet.has('target') || modifiedSet.has('referent') || modifiedSet.has('location')) {
    if (effect.target.correctedValue.length > 0) {
      target = effect.target.correctedValue;
    }
  }
  if (modifiedSet.has('parameter') || modifiedSet.has('value')) {
    if (effect.target.fieldName.length > 0 && effect.target.correctedValue.length > 0) {
      parameters[effect.target.fieldName] = effect.target.correctedValue;
    }
  }
  if (modifiedSet.has('constraint') || modifiedSet.has('scope')) {
    if (effect.target.correctedValue.length > 0) {
      parameters['repairConstraint'] = effect.target.correctedValue;
    }
  }

  return { action, target, parameters };
}

/** Format a repair effect for human-readable display. */
export function formatRepairExplanation(effect: RepairEffect): string {
  const lines: string[] = [];
  lines.push('Repair Effect [' + effect.effectId + ']');
  lines.push('  Type: ' + effect.repairMove.repairType);
  lines.push('  Scope: ' + effect.repairMove.scope);
  lines.push('  Trigger: "' + effect.repairMove.triggerPhrase + '"');
  if (effect.repairMove.rejectedText.length > 0) {
    lines.push('  Rejected: "' + effect.repairMove.rejectedText + '"');
  }
  if (effect.repairMove.replacementText.length > 0) {
    lines.push('  Replacement: "' + effect.repairMove.replacementText + '"');
  }
  lines.push('  Target: ' + effect.target.targetType + ' (' + effect.target.fieldName + ')');
  lines.push('    Original: "' + effect.target.originalValue + '"');
  lines.push('    Corrected: "' + effect.target.correctedValue + '"');
  lines.push('  Preserved fields: ' + effect.preservedFields.join(', '));
  lines.push('  Modified fields: ' + effect.modifiedFields.join(', '));
  lines.push('  Confidence: ' + (effect.confidence * 100).toFixed(1) + '%');
  if (effect.warnings.length > 0) {
    lines.push('  Warnings:');
    for (let w = 0; w < effect.warnings.length; w++) {
      const warning = effect.warnings[w];
      if (warning !== undefined) {
        lines.push('    - ' + warning);
      }
    }
  }
  return lines.join('\n');
}

/** Validate a repair (check it makes sense). */
export function validateRepair(effect: RepairEffect): { readonly valid: boolean; readonly issues: readonly string[] } {
  const issues: string[] = [];

  if (effect.repairMove.confidence < 0.3) {
    issues.push('Very low confidence repair — likely false positive');
  }
  if (effect.modifiedFields.length === 0 && effect.preservedFields.length === 0) {
    issues.push('No fields affected — repair may be vacuous');
  }
  if (effect.target.correctedValue.length === 0 && effect.target.originalValue.length === 0) {
    issues.push('Neither original nor corrected value available — repair is underspecified');
  }
  if (effect.target.originalValue === effect.target.correctedValue && effect.target.correctedValue.length > 0) {
    issues.push('Original and corrected values are identical — no actual change');
  }

  return { valid: issues.length === 0, issues };
}

/** Undo a repair by restoring the original values. */
export function undoRepair(
  effect: RepairEffect,
  currentAction: string,
  currentTarget: string,
  currentParameters: Record<string, string>
): { readonly action: string; readonly target: string; readonly parameters: Record<string, string> } {
  let action = currentAction;
  let target = currentTarget;
  const parameters = copyRecord(currentParameters);

  const modifiedSet = new Set(effect.modifiedFields);

  // Reverse the repair by restoring original values
  if (modifiedSet.has('action') || modifiedSet.has('statement')) {
    if (effect.target.originalValue.length > 0) {
      action = effect.target.originalValue;
    }
  }
  if (modifiedSet.has('target') || modifiedSet.has('referent') || modifiedSet.has('location')) {
    if (effect.target.originalValue.length > 0) {
      target = effect.target.originalValue;
    }
  }
  if (modifiedSet.has('parameter') || modifiedSet.has('value')) {
    if (effect.target.fieldName.length > 0 && effect.target.originalValue.length > 0) {
      parameters[effect.target.fieldName] = effect.target.originalValue;
    }
  }

  return { action, target, parameters };
}

/** Get the repair history from a list of effects. */
export function getRepairHistory(
  effects: readonly RepairEffect[],
  turnNumber: number
): readonly RepairHistoryEntry[] {
  const history: RepairHistoryEntry[] = [];
  for (let i = 0; i < effects.length; i++) {
    const eff = effects[i];
    if (eff === undefined) continue;
    history.push({
      entryId: makeRepairId('rh', i),
      turnNumber,
      repairMove: eff.repairMove,
      effect: eff,
      timestamp: Date.now(),
      undone: false,
    });
  }
  return history;
}

/** Batch-process multiple repair moves. */
export function batchProcessRepairs(
  utterances: readonly string[],
  currentAction: string,
  currentTarget: string,
  currentParameters: Record<string, string>,
  allFields: readonly string[],
  turnNumber: number,
  config: RepairConfig
): RepairBatchResult {
  const effects: RepairEffect[] = [];
  const unresolved: RepairMove[] = [];
  let totalDetected = 0;
  let totalPreserved = 0;
  let totalModified = 0;

  let activeAction = currentAction;
  let activeTarget = currentTarget;
  let activeParams = copyRecord(currentParameters);

  for (let u = 0; u < utterances.length; u++) {
    const utt = utterances[u];
    if (utt === undefined) continue;
    const move = detectRepairMove(utt);
    if (move === null) continue;
    totalDetected++;

    if (move.confidence < config.minConfidence) {
      unresolved.push(move);
      continue;
    }

    if (effects.length >= config.maxRepairsPerUtterance) {
      unresolved.push(move);
      continue;
    }

    const target = extractRepairTarget(move, activeAction, activeTarget, activeParams, turnNumber);
    const effect = applyRepair(move, target, allFields);
    effects.push(effect);
    totalPreserved += effect.preservedFields.length;
    totalModified += effect.modifiedFields.length;

    // Chain: update active state for next repair
    if (config.allowChainedRepairs) {
      const updated = preserveUnrepairedMeaning(activeAction, activeTarget, activeParams, effect);
      activeAction = updated.action;
      activeTarget = updated.target;
      activeParams = copyRecord(updated.parameters);
    }
  }

  return {
    effects,
    unresolved,
    totalDetected,
    totalApplied: effects.length,
    totalPreservedFields: totalPreserved,
    totalModifiedFields: totalModified,
  };
}

/** Create a default RepairConfig. */
export function createDefaultRepairConfig(): RepairConfig {
  return {
    minConfidence: 0.3,
    enableMinimalChange: true,
    maxHistoryLookback: 10,
    allowChainedRepairs: true,
    preserveUnrepaired: true,
    maxRepairsPerUtterance: 3,
  };
}
