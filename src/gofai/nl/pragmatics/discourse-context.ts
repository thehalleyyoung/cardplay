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

