/**
 * context-resolution.ts -- Steps 216-220: Context Resolution and Pragmatic Interpretation
 *
 * Step 216: Temporal Deixis — "earlier/later" ambiguity (song-form vs bar-microtiming)
 * Step 217: Scale of Granularity — section-level vs beat-level context inference
 * Step 218: Topic Continuity — "make it wider" inherits chorus scope
 * Step 219: Focus Semantics — "NOT the chords" contrastive constraint priority
 * Step 220: Reference by Description — "the noisy synth" metadata resolution
 *
 * All types are locally defined (no external imports).
 */

// ===================== STEP 216: TEMPORAL DEIXIS =====================

// ---- 216 Types ----

/** Classification of temporal reference types in music production discourse. */
export type TemporalDeixisType =
  | 'song-form'
  | 'bar-position'
  | 'beat-position'
  | 'absolute-time'
  | 'relative-time'
  | 'playback-time';

/** Confidence bracket for temporal detection. */
export type TemporalConfidenceBracket = 'high' | 'medium' | 'low' | 'speculative';

/** A temporal reference extracted from an utterance. */
export interface TemporalReference {
  readonly referenceId: string;
  readonly rawText: string;
  readonly matchedPattern: string;
  readonly deixisType: TemporalDeixisType;
  readonly direction: 'before' | 'after' | 'at' | 'during' | 'throughout' | 'unspecified';
  readonly anchor: string;
  readonly confidence: number;
  readonly confidenceBracket: TemporalConfidenceBracket;
  readonly offsetStart: number;
  readonly offsetEnd: number;
  readonly numericValue: number | null;
  readonly unit: string | null;
}

/** A resolved temporal position. */
export interface TemporalResolution {
  readonly resolutionId: string;
  readonly reference: TemporalReference;
  readonly resolvedType: TemporalDeixisType;
  readonly formPosition: string | null;
  readonly barNumber: number | null;
  readonly beatNumber: number | null;
  readonly absoluteSeconds: number | null;
  readonly relativePosition: number | null;
  readonly humanReadable: string;
  readonly isAmbiguous: boolean;
  readonly alternativeResolutions: ReadonlyArray<TemporalResolution>;
}

/** An ambiguity in temporal reference interpretation. */
export interface TemporalAmbiguity {
  readonly ambiguityId: string;
  readonly reference: TemporalReference;
  readonly interpretation1: TemporalResolution;
  readonly interpretation2: TemporalResolution;
  readonly clarificationQuestion: string;
  readonly defaultPreference: TemporalDeixisType;
  readonly confidenceDelta: number;
}

/** Context state for temporal resolution. */
export interface TemporalContext {
  readonly currentFormSection: string;
  readonly currentBar: number;
  readonly currentBeat: number;
  readonly totalBars: number;
  readonly totalBeats: number;
  readonly bpm: number;
  readonly timeSignatureNumerator: number;
  readonly timeSignatureDenominator: number;
  readonly totalDurationSeconds: number;
  readonly playbackPositionSeconds: number;
  readonly formSections: ReadonlyArray<FormSectionInfo>;
  readonly recentTemporalReferences: ReadonlyArray<TemporalReference>;
}

/** Info about a song form section. */
export interface FormSectionInfo {
  readonly name: string;
  readonly startBar: number;
  readonly endBar: number;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly ordinal: number;
}

/** Pattern for matching temporal expressions. */
interface TemporalPattern {
  readonly patternId: string;
  readonly regex: RegExp;
  readonly deixisType: TemporalDeixisType;
  readonly direction: 'before' | 'after' | 'at' | 'during' | 'throughout' | 'unspecified';
  readonly anchor: string;
  readonly description: string;
  readonly extractNumeric: boolean;
  readonly extractUnit: boolean;
}

/** Batch result for temporal resolution. */
export interface TemporalBatchResult {
  readonly utterances: ReadonlyArray<string>;
  readonly results: ReadonlyArray<ReadonlyArray<TemporalResolution>>;
  readonly ambiguities: ReadonlyArray<TemporalAmbiguity>;
  readonly totalReferences: number;
  readonly totalAmbiguities: number;
}

// ---- 216 Data ----

const TEMPORAL_PATTERNS: ReadonlyArray<TemporalPattern> = [
  {
    patternId: 'tp-earlier-general',
    regex: /\bearlier\b/i,
    deixisType: 'relative-time',
    direction: 'before',
    anchor: 'current-position',
    description: 'Earlier relative to current position (ambiguous: form vs time)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-later-general',
    regex: /\blater\b/i,
    deixisType: 'relative-time',
    direction: 'after',
    anchor: 'current-position',
    description: 'Later relative to current position (ambiguous: form vs time)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-before-section',
    regex: /\bbefore\s+(?:the\s+)?(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)\b/i,
    deixisType: 'song-form',
    direction: 'before',
    anchor: 'named-section',
    description: 'Before a named song section',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-after-section',
    regex: /\bafter\s+(?:the\s+)?(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)\b/i,
    deixisType: 'song-form',
    direction: 'after',
    anchor: 'named-section',
    description: 'After a named song section',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-at-start',
    regex: /\b(?:at\s+)?the\s+start\b/i,
    deixisType: 'song-form',
    direction: 'at',
    anchor: 'start',
    description: 'At the start (ambiguous: form start vs time start)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-beginning',
    regex: /\b(?:at\s+)?the\s+beginning\b/i,
    deixisType: 'song-form',
    direction: 'at',
    anchor: 'beginning',
    description: 'The beginning of the song form',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-the-end',
    regex: /\b(?:at\s+)?the\s+end\b/i,
    deixisType: 'song-form',
    direction: 'at',
    anchor: 'end',
    description: 'The end of the song form',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-after-bar',
    regex: /\bafter\s+bar\s+(\d+)\b/i,
    deixisType: 'bar-position',
    direction: 'after',
    anchor: 'bar-number',
    description: 'After a specific bar number',
    extractNumeric: true,
    extractUnit: false,
  },
  {
    patternId: 'tp-before-bar',
    regex: /\bbefore\s+bar\s+(\d+)\b/i,
    deixisType: 'bar-position',
    direction: 'before',
    anchor: 'bar-number',
    description: 'Before a specific bar number',
    extractNumeric: true,
    extractUnit: false,
  },
  {
    patternId: 'tp-at-bar',
    regex: /\b(?:at|on|in)\s+bar\s+(\d+)\b/i,
    deixisType: 'bar-position',
    direction: 'at',
    anchor: 'bar-number',
    description: 'At a specific bar number',
    extractNumeric: true,
    extractUnit: false,
  },
  {
    patternId: 'tp-on-beat',
    regex: /\b(?:on|at)\s+beat\s+(\d+)\b/i,
    deixisType: 'beat-position',
    direction: 'at',
    anchor: 'beat-number',
    description: 'On a specific beat',
    extractNumeric: true,
    extractUnit: false,
  },
  {
    patternId: 'tp-halfway',
    regex: /\b(?:halfway|half[\s-]?way)\s+(?:through|into)?\b/i,
    deixisType: 'relative-time',
    direction: 'at',
    anchor: 'midpoint',
    description: 'Halfway through (relative position)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-absolute-mmss',
    regex: /\bat\s+(\d{1,2}):(\d{2})\b/i,
    deixisType: 'absolute-time',
    direction: 'at',
    anchor: 'timestamp',
    description: 'At an absolute timestamp (mm:ss)',
    extractNumeric: true,
    extractUnit: true,
  },
  {
    patternId: 'tp-absolute-seconds',
    regex: /\bat\s+(\d+)\s*(?:seconds?|secs?|s)\b/i,
    deixisType: 'absolute-time',
    direction: 'at',
    anchor: 'seconds',
    description: 'At an absolute number of seconds',
    extractNumeric: true,
    extractUnit: true,
  },
  {
    patternId: 'tp-first',
    regex: /\b(?:the\s+)?first\b/i,
    deixisType: 'song-form',
    direction: 'at',
    anchor: 'ordinal-first',
    description: 'First occurrence (ordinal temporal)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-last',
    regex: /\b(?:the\s+)?last\b/i,
    deixisType: 'song-form',
    direction: 'at',
    anchor: 'ordinal-last',
    description: 'Last occurrence (ordinal temporal)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-next',
    regex: /\b(?:the\s+)?next\b/i,
    deixisType: 'relative-time',
    direction: 'after',
    anchor: 'ordinal-next',
    description: 'Next relative to current position',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-previous',
    regex: /\b(?:the\s+)?(?:previous|prev)\b/i,
    deixisType: 'relative-time',
    direction: 'before',
    anchor: 'ordinal-previous',
    description: 'Previous relative to current position',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-recently',
    regex: /\brecently\b/i,
    deixisType: 'relative-time',
    direction: 'before',
    anchor: 'recency',
    description: 'Recently (ambiguous: dialogue recency vs song recency)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-during-section',
    regex: /\bduring\s+(?:the\s+)?(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)\b/i,
    deixisType: 'song-form',
    direction: 'during',
    anchor: 'named-section',
    description: 'During a named song section',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-throughout',
    regex: /\bthroughout\b/i,
    deixisType: 'song-form',
    direction: 'throughout',
    anchor: 'entire-scope',
    description: 'Throughout the entire scope',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-from-bar',
    regex: /\bfrom\s+bar\s+(\d+)\b/i,
    deixisType: 'bar-position',
    direction: 'after',
    anchor: 'bar-number',
    description: 'From a specific bar number onward',
    extractNumeric: true,
    extractUnit: false,
  },
  {
    patternId: 'tp-bars-in',
    regex: /\b(\d+)\s+bars?\s+in\b/i,
    deixisType: 'bar-position',
    direction: 'at',
    anchor: 'bar-offset',
    description: 'N bars into the current scope',
    extractNumeric: true,
    extractUnit: false,
  },
  {
    patternId: 'tp-in-section',
    regex: /\bin\s+(?:the\s+)?(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)\b/i,
    deixisType: 'song-form',
    direction: 'during',
    anchor: 'named-section',
    description: 'In a named song section',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-right-before',
    regex: /\bright\s+before\b/i,
    deixisType: 'relative-time',
    direction: 'before',
    anchor: 'immediate-before',
    description: 'Immediately before (close temporal proximity)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-right-after',
    regex: /\bright\s+after\b/i,
    deixisType: 'relative-time',
    direction: 'after',
    anchor: 'immediate-after',
    description: 'Immediately after (close temporal proximity)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-towards-end',
    regex: /\btowards?\s+(?:the\s+)?end\b/i,
    deixisType: 'relative-time',
    direction: 'at',
    anchor: 'near-end',
    description: 'Towards the end (relative position)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-near-beginning',
    regex: /\bnear\s+(?:the\s+)?(?:beginning|start)\b/i,
    deixisType: 'relative-time',
    direction: 'at',
    anchor: 'near-start',
    description: 'Near the beginning (relative position)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-measure',
    regex: /\b(?:at|on|in)\s+measure\s+(\d+)\b/i,
    deixisType: 'bar-position',
    direction: 'at',
    anchor: 'bar-number',
    description: 'At a specific measure (synonym for bar)',
    extractNumeric: true,
    extractUnit: false,
  },
  {
    patternId: 'tp-downbeat',
    regex: /\b(?:on\s+)?(?:the\s+)?downbeat\b/i,
    deixisType: 'beat-position',
    direction: 'at',
    anchor: 'downbeat',
    description: 'On the downbeat (beat 1)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-upbeat',
    regex: /\b(?:on\s+)?(?:the\s+)?upbeat\b/i,
    deixisType: 'beat-position',
    direction: 'at',
    anchor: 'upbeat',
    description: 'On the upbeat (off-beat)',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-playback-now',
    regex: /\b(?:right\s+)?(?:now|here)\b/i,
    deixisType: 'playback-time',
    direction: 'at',
    anchor: 'playback-cursor',
    description: 'At the current playback position',
    extractNumeric: false,
    extractUnit: false,
  },
  {
    patternId: 'tp-already',
    regex: /\balready\b/i,
    deixisType: 'relative-time',
    direction: 'before',
    anchor: 'prior-occurrence',
    description: 'Something that already occurred',
    extractNumeric: false,
    extractUnit: false,
  },
];

/** Patterns that produce temporal ambiguity between form and microtiming. */
const AMBIGUOUS_TEMPORAL_ANCHORS: ReadonlyArray<string> = [
  'current-position',
  'start',
  'recency',
  'midpoint',
  'near-end',
  'near-start',
];

// ---- 216 Helpers ----

function makeTemporalId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`;
}

function bracketFromConfidence(conf: number): TemporalConfidenceBracket {
  if (conf >= 0.85) return 'high';
  if (conf >= 0.6) return 'medium';
  if (conf >= 0.35) return 'low';
  return 'speculative';
}

function extractNumericFromMatch(match: RegExpMatchArray, pattern: TemporalPattern): number | null {
  if (!pattern.extractNumeric) return null;
  const captured = match[1];
  if (captured === undefined) return null;
  const parsed = parseInt(captured, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractUnitFromPattern(pattern: TemporalPattern): string | null {
  if (!pattern.extractUnit) return null;
  if (pattern.anchor === 'timestamp') return 'mm:ss';
  if (pattern.anchor === 'seconds') return 'seconds';
  return null;
}

function extractSectionName(match: RegExpMatchArray): string {
  const captured = match[1];
  return captured !== undefined ? captured.toLowerCase() : '';
}

function barToSeconds(bar: number, bpm: number, tsNum: number, _tsDenom: number): number {
  const beatsPerBar = tsNum;
  const secondsPerBeat = 60.0 / bpm;
  return (bar - 1) * beatsPerBar * secondsPerBeat;
}

function secondsToBar(seconds: number, bpm: number, tsNum: number, _tsDenom: number): number {
  const beatsPerBar = tsNum;
  const secondsPerBeat = 60.0 / bpm;
  const secondsPerBar = beatsPerBar * secondsPerBeat;
  return Math.floor(seconds / secondsPerBar) + 1;
}

function findSectionByName(
  sections: ReadonlyArray<FormSectionInfo>,
  name: string,
): FormSectionInfo | null {
  const lower = name.toLowerCase();
  for (const section of sections) {
    if (section.name.toLowerCase() === lower) {
      return section;
    }
  }
  return null;
}

function findSectionByOrdinal(
  sections: ReadonlyArray<FormSectionInfo>,
  ordinal: 'first' | 'last',
): FormSectionInfo | null {
  if (sections.length === 0) return null;
  if (ordinal === 'first') {
    const first = sections[0];
    return first !== undefined ? first : null;
  }
  const last = sections[sections.length - 1];
  return last !== undefined ? last : null;
}

// ---- 216 Functions ----

/** Detect temporal deictic expressions in an utterance. */
export function detectTemporalDeixis(utterance: string): ReadonlyArray<TemporalReference> {
  const results: TemporalReference[] = [];
  let idx = 0;

  for (const pattern of TEMPORAL_PATTERNS) {
    const match = pattern.regex.exec(utterance);
    if (match !== null) {
      const numericVal = extractNumericFromMatch(match, pattern);
      const unitVal = extractUnitFromPattern(pattern);
      const confidence = pattern.deixisType === 'song-form' || pattern.deixisType === 'bar-position'
        ? 0.85
        : pattern.deixisType === 'absolute-time'
          ? 0.95
          : 0.65;

      results.push({
        referenceId: makeTemporalId('tref', idx),
        rawText: match[0] ?? '',
        matchedPattern: pattern.patternId,
        deixisType: pattern.deixisType,
        direction: pattern.direction,
        anchor: pattern.anchor,
        confidence,
        confidenceBracket: bracketFromConfidence(confidence),
        offsetStart: match.index ?? 0,
        offsetEnd: (match.index ?? 0) + (match[0] ?? '').length,
        numericValue: numericVal,
        unit: unitVal,
      });
      idx++;
    }
  }

  return results;
}

/** Classify the temporal type of a reference. */
export function classifyTemporalType(reference: TemporalReference): TemporalDeixisType {
  if (reference.numericValue !== null && reference.unit === 'mm:ss') return 'absolute-time';
  if (reference.numericValue !== null && reference.unit === 'seconds') return 'absolute-time';

  const patternEntry = TEMPORAL_PATTERNS.find(p => p.patternId === reference.matchedPattern);
  if (patternEntry !== undefined) return patternEntry.deixisType;

  return reference.deixisType;
}

/** Resolve a temporal reference against a context to produce a concrete position. */
export function resolveTemporalReference(
  reference: TemporalReference,
  context: TemporalContext,
): TemporalResolution {
  const resolvedType = classifyTemporalType(reference);
  let formPos: string | null = null;
  let barNum: number | null = null;
  let beatNum: number | null = null;
  let absSec: number | null = null;
  let relPos: number | null = null;
  let readable = '';

  switch (resolvedType) {
    case 'song-form': {
      if (reference.anchor === 'named-section') {
        const sectionMatch = reference.rawText.match(
          /(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)/i,
        );
        const sectionName = sectionMatch !== null
          ? (sectionMatch[1] !== undefined ? sectionMatch[1].toLowerCase() : '')
          : '';
        const section = findSectionByName(context.formSections, sectionName);
        if (section !== null) {
          formPos = section.name;
          barNum = reference.direction === 'before' ? section.startBar - 1
            : reference.direction === 'after' ? section.endBar + 1
            : section.startBar;
          absSec = reference.direction === 'before' ? section.startSeconds
            : reference.direction === 'after' ? section.endSeconds
            : section.startSeconds;
          readable = `${reference.direction} ${section.name} (bar ${barNum})`;
        } else {
          formPos = sectionName;
          readable = `${reference.direction} ${sectionName} (section not found in context)`;
        }
      } else if (reference.anchor === 'start' || reference.anchor === 'beginning') {
        formPos = 'start';
        barNum = 1;
        beatNum = 1;
        absSec = 0;
        readable = 'at the start of the song';
      } else if (reference.anchor === 'end') {
        formPos = 'end';
        barNum = context.totalBars;
        absSec = context.totalDurationSeconds;
        readable = 'at the end of the song';
      } else if (reference.anchor === 'ordinal-first') {
        const firstSection = findSectionByOrdinal(context.formSections, 'first');
        if (firstSection !== null) {
          formPos = firstSection.name;
          barNum = firstSection.startBar;
          absSec = firstSection.startSeconds;
          readable = `first section (${firstSection.name})`;
        } else {
          formPos = 'first';
          barNum = 1;
          readable = 'first position';
        }
      } else if (reference.anchor === 'ordinal-last') {
        const lastSection = findSectionByOrdinal(context.formSections, 'last');
        if (lastSection !== null) {
          formPos = lastSection.name;
          barNum = lastSection.startBar;
          absSec = lastSection.startSeconds;
          readable = `last section (${lastSection.name})`;
        } else {
          formPos = 'last';
          barNum = context.totalBars;
          readable = 'last position';
        }
      } else if (reference.anchor === 'entire-scope') {
        formPos = 'entire';
        barNum = 1;
        readable = 'throughout the entire song';
      } else {
        formPos = reference.anchor;
        readable = `song-form reference: ${reference.anchor}`;
      }
      break;
    }
    case 'bar-position': {
      barNum = reference.numericValue;
      if (barNum !== null) {
        absSec = barToSeconds(
          barNum,
          context.bpm,
          context.timeSignatureNumerator,
          context.timeSignatureDenominator,
        );
        readable = `${reference.direction} bar ${barNum}`;
      } else if (reference.anchor === 'bar-offset') {
        barNum = reference.numericValue;
        readable = `${reference.numericValue ?? 0} bars into current scope`;
      } else {
        readable = `bar-position reference: ${reference.anchor}`;
      }
      break;
    }
    case 'beat-position': {
      beatNum = reference.numericValue;
      if (reference.anchor === 'downbeat') {
        beatNum = 1;
        readable = 'on the downbeat (beat 1)';
      } else if (reference.anchor === 'upbeat') {
        beatNum = context.timeSignatureNumerator;
        readable = `on the upbeat (beat ${beatNum})`;
      } else if (beatNum !== null) {
        readable = `on beat ${beatNum}`;
      } else {
        readable = `beat-position reference: ${reference.anchor}`;
      }
      break;
    }
    case 'absolute-time': {
      if (reference.unit === 'mm:ss' && reference.rawText) {
        const tsMatch = reference.rawText.match(/(\d{1,2}):(\d{2})/);
        if (tsMatch !== null) {
          const mins = parseInt(tsMatch[1] ?? '0', 10);
          const secs = parseInt(tsMatch[2] ?? '0', 10);
          absSec = mins * 60 + secs;
          barNum = secondsToBar(
            absSec,
            context.bpm,
            context.timeSignatureNumerator,
            context.timeSignatureDenominator,
          );
          readable = `at ${mins}:${secs.toString().padStart(2, '0')} (bar ~${barNum})`;
        }
      } else if (reference.numericValue !== null) {
        absSec = reference.numericValue;
        barNum = secondsToBar(
          absSec,
          context.bpm,
          context.timeSignatureNumerator,
          context.timeSignatureDenominator,
        );
        readable = `at ${absSec} seconds (bar ~${barNum})`;
      } else {
        readable = `absolute-time reference: ${reference.anchor}`;
      }
      break;
    }
    case 'relative-time': {
      if (reference.anchor === 'midpoint') {
        relPos = 0.5;
        barNum = Math.round(context.totalBars * 0.5);
        absSec = context.totalDurationSeconds * 0.5;
        readable = `halfway through (bar ~${barNum})`;
      } else if (reference.anchor === 'near-end') {
        relPos = 0.85;
        barNum = Math.round(context.totalBars * 0.85);
        readable = `towards the end (bar ~${barNum})`;
      } else if (reference.anchor === 'near-start') {
        relPos = 0.15;
        barNum = Math.round(context.totalBars * 0.15);
        readable = `near the beginning (bar ~${barNum})`;
      } else if (reference.anchor === 'ordinal-next') {
        barNum = context.currentBar + 1;
        readable = `next (bar ${barNum})`;
      } else if (reference.anchor === 'ordinal-previous') {
        barNum = Math.max(1, context.currentBar - 1);
        readable = `previous (bar ${barNum})`;
      } else if (reference.anchor === 'current-position') {
        barNum = context.currentBar;
        absSec = context.playbackPositionSeconds;
        readable = reference.direction === 'before'
          ? `earlier (before bar ${barNum})`
          : `later (after bar ${barNum})`;
      } else if (reference.anchor === 'recency') {
        barNum = context.currentBar;
        readable = 'recently (relative to current position)';
      } else if (reference.anchor === 'immediate-before') {
        barNum = Math.max(1, context.currentBar - 1);
        readable = `right before current position (bar ${barNum})`;
      } else if (reference.anchor === 'immediate-after') {
        barNum = context.currentBar + 1;
        readable = `right after current position (bar ${barNum})`;
      } else if (reference.anchor === 'prior-occurrence') {
        readable = 'a prior occurrence (already happened)';
      } else {
        readable = `relative-time reference: ${reference.anchor}`;
      }
      break;
    }
    case 'playback-time': {
      barNum = context.currentBar;
      beatNum = context.currentBeat;
      absSec = context.playbackPositionSeconds;
      readable = `at current playback position (bar ${barNum}, beat ${beatNum})`;
      break;
    }
  }

  const isAmb = AMBIGUOUS_TEMPORAL_ANCHORS.includes(reference.anchor);

  return {
    resolutionId: makeTemporalId('tres', 0),
    reference,
    resolvedType,
    formPosition: formPos,
    barNumber: barNum,
    beatNumber: beatNum,
    absoluteSeconds: absSec,
    relativePosition: relPos,
    humanReadable: readable,
    isAmbiguous: isAmb,
    alternativeResolutions: [],
  };
}

/** Determine if a temporal reference is ambiguous between form and microtiming. */
export function isTemporallyAmbiguous(reference: TemporalReference): boolean {
  return AMBIGUOUS_TEMPORAL_ANCHORS.includes(reference.anchor);
}

/** Generate a clarification question for an ambiguous temporal reference. */
export function generateTemporalClarification(ambiguity: TemporalAmbiguity): string {
  const ref = ambiguity.reference;
  const interp1Label = formatDeixisTypeLabel(ambiguity.interpretation1.resolvedType);
  const interp2Label = formatDeixisTypeLabel(ambiguity.interpretation2.resolvedType);

  return `When you say "${ref.rawText}", do you mean ${interp1Label} `
    + `(${ambiguity.interpretation1.humanReadable}) or ${interp2Label} `
    + `(${ambiguity.interpretation2.humanReadable})?`;
}

function formatDeixisTypeLabel(dt: TemporalDeixisType): string {
  switch (dt) {
    case 'song-form': return 'in terms of song structure';
    case 'bar-position': return 'at a specific bar';
    case 'beat-position': return 'at a specific beat';
    case 'absolute-time': return 'at a specific time';
    case 'relative-time': return 'relative to current position';
    case 'playback-time': return 'at the playback cursor';
  }
}

/** Format a temporal resolution as a human-readable string. */
export function formatTemporalResolution(resolution: TemporalResolution): string {
  const parts: string[] = [`[${resolution.resolvedType}]`];
  parts.push(resolution.humanReadable);
  if (resolution.barNumber !== null) {
    parts.push(`bar=${resolution.barNumber}`);
  }
  if (resolution.beatNumber !== null) {
    parts.push(`beat=${resolution.beatNumber}`);
  }
  if (resolution.absoluteSeconds !== null) {
    parts.push(`time=${resolution.absoluteSeconds.toFixed(2)}s`);
  }
  if (resolution.formPosition !== null) {
    parts.push(`section=${resolution.formPosition}`);
  }
  if (resolution.isAmbiguous) {
    parts.push('(AMBIGUOUS)');
  }
  return parts.join(' | ');
}

/** Build a TemporalContext from available information. */
export function getTemporalContext(
  currentSection: string,
  currentBar: number,
  currentBeat: number,
  totalBars: number,
  bpm: number,
  tsNum: number,
  tsDenom: number,
  formSections: ReadonlyArray<FormSectionInfo>,
): TemporalContext {
  const secondsPerBeat = 60.0 / bpm;
  const beatsPerBar = tsNum;
  const totalDuration = totalBars * beatsPerBar * secondsPerBeat;
  const playbackSec = ((currentBar - 1) * beatsPerBar + (currentBeat - 1)) * secondsPerBeat;

  return {
    currentFormSection: currentSection,
    currentBar,
    currentBeat,
    totalBars,
    totalBeats: totalBars * beatsPerBar,
    bpm,
    timeSignatureNumerator: tsNum,
    timeSignatureDenominator: tsDenom,
    totalDurationSeconds: totalDuration,
    playbackPositionSeconds: playbackSec,
    formSections,
    recentTemporalReferences: [],
  };
}

/** Batch resolve temporal deictic references across multiple utterances. */
export function batchResolveTemporalDeixis(
  utterances: ReadonlyArray<string>,
  context: TemporalContext,
): TemporalBatchResult {
  const allResults: Array<ReadonlyArray<TemporalResolution>> = [];
  const allAmbiguities: TemporalAmbiguity[] = [];
  let totalRefs = 0;

  for (const utterance of utterances) {
    const refs = detectTemporalDeixis(utterance);
    const resolutions: TemporalResolution[] = [];

    for (const ref of refs) {
      totalRefs++;
      const resolution = resolveTemporalReference(ref, context);
      resolutions.push(resolution);

      if (resolution.isAmbiguous) {
        const formInterp: TemporalResolution = {
          ...resolution,
          resolutionId: makeTemporalId('tres-form', allAmbiguities.length),
          resolvedType: 'song-form',
          humanReadable: `${ref.rawText} interpreted as song-form position`,
        };
        const timeInterp: TemporalResolution = {
          ...resolution,
          resolutionId: makeTemporalId('tres-time', allAmbiguities.length),
          resolvedType: 'relative-time',
          humanReadable: `${ref.rawText} interpreted as relative time`,
        };

        allAmbiguities.push({
          ambiguityId: makeTemporalId('tamb', allAmbiguities.length),
          reference: ref,
          interpretation1: formInterp,
          interpretation2: timeInterp,
          clarificationQuestion: `Did you mean "${ref.rawText}" as a position in the song form, or relative to the current time?`,
          defaultPreference: 'song-form',
          confidenceDelta: Math.abs(formInterp.reference.confidence - timeInterp.reference.confidence),
        });
      }
    }

    allResults.push(resolutions);
  }

  return {
    utterances,
    results: allResults,
    ambiguities: allAmbiguities,
    totalReferences: totalRefs,
    totalAmbiguities: allAmbiguities.length,
  };
}

/** Convert a temporal resolution to an absolute position in seconds. */
export function convertToAbsolutePosition(
  resolution: TemporalResolution,
  context: TemporalContext,
): number {
  if (resolution.absoluteSeconds !== null) return resolution.absoluteSeconds;
  if (resolution.barNumber !== null) {
    return barToSeconds(
      resolution.barNumber,
      context.bpm,
      context.timeSignatureNumerator,
      context.timeSignatureDenominator,
    );
  }
  if (resolution.relativePosition !== null) {
    return context.totalDurationSeconds * resolution.relativePosition;
  }
  if (resolution.beatNumber !== null) {
    const secondsPerBeat = 60.0 / context.bpm;
    return ((context.currentBar - 1) * context.timeSignatureNumerator + (resolution.beatNumber - 1))
      * secondsPerBeat;
  }
  return context.playbackPositionSeconds;
}

/** Convert a temporal resolution to a form position string. */
export function convertToFormPosition(
  resolution: TemporalResolution,
  context: TemporalContext,
): string {
  if (resolution.formPosition !== null) return resolution.formPosition;

  const absSec = convertToAbsolutePosition(resolution, context);
  for (const section of context.formSections) {
    if (absSec >= section.startSeconds && absSec <= section.endSeconds) {
      return section.name;
    }
  }

  if (resolution.barNumber !== null) {
    for (const section of context.formSections) {
      if (resolution.barNumber >= section.startBar && resolution.barNumber <= section.endBar) {
        return section.name;
      }
    }
  }

  return context.currentFormSection;
}


// ===================== STEP 217: SCALE OF GRANULARITY =====================

// ---- 217 Types ----

/** Granularity levels for musical editing scope. */
export type GranularityLevel =
  | 'project'
  | 'section'
  | 'phrase'
  | 'bar'
  | 'beat'
  | 'sub-beat'
  | 'sample';

/** Confidence bracket for granularity inference. */
export type GranularityConfidenceBracket = 'high' | 'medium' | 'low' | 'speculative';

/** Activity context that influences granularity inference. */
export type EditingActivity =
  | 'arranging'
  | 'composing'
  | 'mixing'
  | 'editing-section'
  | 'editing-bar'
  | 'groove-editing'
  | 'sound-design'
  | 'mastering'
  | 'recording'
  | 'browsing'
  | 'auditioning'
  | 'automation-drawing';

/** Context for granularity inference. */
export interface GranularityContext {
  readonly currentActivity: EditingActivity;
  readonly zoomLevel: 'project-overview' | 'section-view' | 'bar-view' | 'beat-view' | 'sample-view';
  readonly selectedRegionBars: number;
  readonly selectedRegionBeats: number;
  readonly recentEditGranularity: GranularityLevel | null;
  readonly discussionTopic: string;
  readonly userExpertise: 'beginner' | 'intermediate' | 'advanced';
  readonly recentGranularities: ReadonlyArray<GranularityLevel>;
}

/** Result of granularity inference. */
export interface GranularityInference {
  readonly inferenceId: string;
  readonly utterance: string;
  readonly inferredLevel: GranularityLevel;
  readonly confidence: number;
  readonly confidenceBracket: GranularityConfidenceBracket;
  readonly reasoning: string;
  readonly contextFactors: ReadonlyArray<string>;
  readonly isAmbiguous: boolean;
  readonly alternativeLevel: GranularityLevel | null;
  readonly clarificationNeeded: boolean;
  readonly clarificationQuestion: string | null;
  readonly saferLevel: GranularityLevel;
}

/** Default granularity policy for ambiguous cases. */
export interface GranularityDefault {
  readonly activity: EditingActivity;
  readonly defaultLevel: GranularityLevel;
  readonly saferLevel: GranularityLevel;
  readonly rationale: string;
}

/** Configuration for granularity inference. */
export interface GranularityConfig {
  readonly preferSaferGranularity: boolean;
  readonly clarifyOnAmbiguity: boolean;
  readonly expertiseWeightFactor: number;
  readonly recencyWeightFactor: number;
  readonly activityWeightFactor: number;
  readonly zoomWeightFactor: number;
  readonly minimumConfidenceThreshold: number;
}

/** Granularity level info with typical musical ranges. */
interface GranularityLevelInfo {
  readonly level: GranularityLevel;
  readonly ordinal: number;
  readonly typicalBarRange: [number, number];
  readonly typicalBeatRange: [number, number];
  readonly description: string;
  readonly impactScope: 'high' | 'medium' | 'low';
  readonly confirmationNeeded: boolean;
}

/** Context-granularity mapping rule. */
interface GranularityMappingRule {
  readonly ruleId: string;
  readonly condition: (ctx: GranularityContext) => boolean;
  readonly inferredLevel: GranularityLevel;
  readonly confidence: number;
  readonly reasoning: string;
  readonly priority: number;
}

/** Batch inference result. */
export interface GranularityBatchResult {
  readonly utterances: ReadonlyArray<string>;
  readonly inferences: ReadonlyArray<GranularityInference>;
  readonly ambiguousCount: number;
  readonly clarificationsNeeded: number;
}

// ---- 217 Data ----

const GRANULARITY_LEVELS: ReadonlyArray<GranularityLevelInfo> = [
  {
    level: 'project',
    ordinal: 0,
    typicalBarRange: [0, 999],
    typicalBeatRange: [0, 9999],
    description: 'Entire project / song-wide changes',
    impactScope: 'high',
    confirmationNeeded: true,
  },
  {
    level: 'section',
    ordinal: 1,
    typicalBarRange: [8, 32],
    typicalBeatRange: [32, 128],
    description: 'Song section (verse, chorus, bridge, etc.)',
    impactScope: 'high',
    confirmationNeeded: true,
  },
  {
    level: 'phrase',
    ordinal: 2,
    typicalBarRange: [2, 8],
    typicalBeatRange: [8, 32],
    description: 'Musical phrase (2-8 bars)',
    impactScope: 'medium',
    confirmationNeeded: false,
  },
  {
    level: 'bar',
    ordinal: 3,
    typicalBarRange: [1, 1],
    typicalBeatRange: [3, 7],
    description: 'Single bar / measure',
    impactScope: 'medium',
    confirmationNeeded: false,
  },
  {
    level: 'beat',
    ordinal: 4,
    typicalBarRange: [0, 1],
    typicalBeatRange: [1, 1],
    description: 'Single beat within a bar',
    impactScope: 'low',
    confirmationNeeded: false,
  },
  {
    level: 'sub-beat',
    ordinal: 5,
    typicalBarRange: [0, 1],
    typicalBeatRange: [0, 1],
    description: 'Sub-beat division (16th note, triplet, etc.)',
    impactScope: 'low',
    confirmationNeeded: false,
  },
  {
    level: 'sample',
    ordinal: 6,
    typicalBarRange: [0, 1],
    typicalBeatRange: [0, 1],
    description: 'Individual audio samples',
    impactScope: 'low',
    confirmationNeeded: false,
  },
];

const GRANULARITY_DEFAULTS: ReadonlyArray<GranularityDefault> = [
  { activity: 'arranging', defaultLevel: 'section', saferLevel: 'section', rationale: 'Arrangement works at section level' },
  { activity: 'composing', defaultLevel: 'phrase', saferLevel: 'section', rationale: 'Composition typically phrase-level with section safety' },
  { activity: 'mixing', defaultLevel: 'section', saferLevel: 'project', rationale: 'Mixing often section-wide but confirm project-wide' },
  { activity: 'editing-section', defaultLevel: 'section', saferLevel: 'section', rationale: 'Editing within a section' },
  { activity: 'editing-bar', defaultLevel: 'bar', saferLevel: 'phrase', rationale: 'Bar-level editing with phrase safety net' },
  { activity: 'groove-editing', defaultLevel: 'beat', saferLevel: 'bar', rationale: 'Groove edits are beat-level but bar is safer' },
  { activity: 'sound-design', defaultLevel: 'bar', saferLevel: 'phrase', rationale: 'Sound design often auditioned per bar' },
  { activity: 'mastering', defaultLevel: 'project', saferLevel: 'project', rationale: 'Mastering is always project-wide' },
  { activity: 'recording', defaultLevel: 'phrase', saferLevel: 'section', rationale: 'Recording typically phrase-level takes' },
  { activity: 'browsing', defaultLevel: 'project', saferLevel: 'project', rationale: 'Browsing is project-level overview' },
  { activity: 'auditioning', defaultLevel: 'bar', saferLevel: 'phrase', rationale: 'Auditioning sounds typically bar-level' },
  { activity: 'automation-drawing', defaultLevel: 'beat', saferLevel: 'bar', rationale: 'Automation drawing at beat resolution' },
];

function buildGranularityMappingRules(): ReadonlyArray<GranularityMappingRule> {
  return [
    {
      ruleId: 'gm-arranging-section',
      condition: (ctx) => ctx.currentActivity === 'arranging',
      inferredLevel: 'section',
      confidence: 0.85,
      reasoning: 'User is arranging, implying section-level scope',
      priority: 10,
    },
    {
      ruleId: 'gm-groove-beat',
      condition: (ctx) => ctx.currentActivity === 'groove-editing',
      inferredLevel: 'beat',
      confidence: 0.9,
      reasoning: 'User is editing grooves, implying beat-level scope',
      priority: 10,
    },
    {
      ruleId: 'gm-zoom-project',
      condition: (ctx) => ctx.zoomLevel === 'project-overview',
      inferredLevel: 'project',
      confidence: 0.7,
      reasoning: 'Zoom level shows project overview, suggesting large scope',
      priority: 5,
    },
    {
      ruleId: 'gm-zoom-section',
      condition: (ctx) => ctx.zoomLevel === 'section-view',
      inferredLevel: 'section',
      confidence: 0.75,
      reasoning: 'Zoom level shows section view',
      priority: 5,
    },
    {
      ruleId: 'gm-zoom-bar',
      condition: (ctx) => ctx.zoomLevel === 'bar-view',
      inferredLevel: 'bar',
      confidence: 0.8,
      reasoning: 'Zoom level shows bar view, suggesting bar-level scope',
      priority: 6,
    },
    {
      ruleId: 'gm-zoom-beat',
      condition: (ctx) => ctx.zoomLevel === 'beat-view',
      inferredLevel: 'beat',
      confidence: 0.85,
      reasoning: 'Zoom level shows beat view, suggesting beat-level scope',
      priority: 6,
    },
    {
      ruleId: 'gm-zoom-sample',
      condition: (ctx) => ctx.zoomLevel === 'sample-view',
      inferredLevel: 'sample',
      confidence: 0.9,
      reasoning: 'Zoom level at sample precision',
      priority: 7,
    },
    {
      ruleId: 'gm-selection-large',
      condition: (ctx) => ctx.selectedRegionBars > 16,
      inferredLevel: 'section',
      confidence: 0.8,
      reasoning: 'Selection spans many bars, implying section-level',
      priority: 8,
    },
    {
      ruleId: 'gm-selection-phrase',
      condition: (ctx) => ctx.selectedRegionBars > 2 && ctx.selectedRegionBars <= 16,
      inferredLevel: 'phrase',
      confidence: 0.75,
      reasoning: 'Selection spans a phrase-length region',
      priority: 8,
    },
    {
      ruleId: 'gm-selection-bar',
      condition: (ctx) => ctx.selectedRegionBars === 1 || ctx.selectedRegionBars === 2,
      inferredLevel: 'bar',
      confidence: 0.8,
      reasoning: 'Selection is 1-2 bars, suggesting bar-level',
      priority: 8,
    },
    {
      ruleId: 'gm-selection-beat',
      condition: (ctx) => ctx.selectedRegionBars === 0 && ctx.selectedRegionBeats > 0 && ctx.selectedRegionBeats <= 2,
      inferredLevel: 'beat',
      confidence: 0.85,
      reasoning: 'Selection is a few beats, suggesting beat-level',
      priority: 9,
    },
    {
      ruleId: 'gm-recent-edit-carry',
      condition: (ctx) => ctx.recentEditGranularity !== null,
      inferredLevel: 'bar',
      confidence: 0.5,
      reasoning: 'Carrying forward recent edit granularity',
      priority: 3,
    },
    {
      ruleId: 'gm-mastering',
      condition: (ctx) => ctx.currentActivity === 'mastering',
      inferredLevel: 'project',
      confidence: 0.95,
      reasoning: 'Mastering implies project-wide scope',
      priority: 12,
    },
    {
      ruleId: 'gm-mixing',
      condition: (ctx) => ctx.currentActivity === 'mixing',
      inferredLevel: 'section',
      confidence: 0.7,
      reasoning: 'Mixing often applies at section level',
      priority: 7,
    },
    {
      ruleId: 'gm-sound-design',
      condition: (ctx) => ctx.currentActivity === 'sound-design',
      inferredLevel: 'bar',
      confidence: 0.7,
      reasoning: 'Sound design typically auditioned at bar level',
      priority: 6,
    },
    {
      ruleId: 'gm-composing-phrase',
      condition: (ctx) => ctx.currentActivity === 'composing',
      inferredLevel: 'phrase',
      confidence: 0.7,
      reasoning: 'Composition works at phrase level',
      priority: 6,
    },
    {
      ruleId: 'gm-recording-phrase',
      condition: (ctx) => ctx.currentActivity === 'recording',
      inferredLevel: 'phrase',
      confidence: 0.75,
      reasoning: 'Recording typically captures phrase-length takes',
      priority: 7,
    },
    {
      ruleId: 'gm-automation-beat',
      condition: (ctx) => ctx.currentActivity === 'automation-drawing',
      inferredLevel: 'beat',
      confidence: 0.8,
      reasoning: 'Automation drawing works at beat resolution',
      priority: 8,
    },
    {
      ruleId: 'gm-beginner-safer',
      condition: (ctx) => ctx.userExpertise === 'beginner',
      inferredLevel: 'section',
      confidence: 0.4,
      reasoning: 'Beginners benefit from larger, safer granularity',
      priority: 2,
    },
    {
      ruleId: 'gm-advanced-fine',
      condition: (ctx) => ctx.userExpertise === 'advanced' && ctx.zoomLevel === 'beat-view',
      inferredLevel: 'beat',
      confidence: 0.7,
      reasoning: 'Advanced user zoomed into beat view likely wants fine control',
      priority: 4,
    },
    {
      ruleId: 'gm-discussion-arrangement',
      condition: (ctx) => ctx.discussionTopic.includes('arrange') || ctx.discussionTopic.includes('structure'),
      inferredLevel: 'section',
      confidence: 0.8,
      reasoning: 'Discussion about arrangement/structure implies section-level',
      priority: 9,
    },
    {
      ruleId: 'gm-discussion-groove',
      condition: (ctx) => ctx.discussionTopic.includes('groove') || ctx.discussionTopic.includes('swing') || ctx.discussionTopic.includes('rhythm'),
      inferredLevel: 'beat',
      confidence: 0.8,
      reasoning: 'Discussion about groove/rhythm implies beat-level',
      priority: 9,
    },
    {
      ruleId: 'gm-discussion-mix',
      condition: (ctx) => ctx.discussionTopic.includes('mix') || ctx.discussionTopic.includes('balance') || ctx.discussionTopic.includes('level'),
      inferredLevel: 'section',
      confidence: 0.65,
      reasoning: 'Discussion about mixing implies section-level adjustments',
      priority: 7,
    },
    {
      ruleId: 'gm-discussion-timing',
      condition: (ctx) => ctx.discussionTopic.includes('timing') || ctx.discussionTopic.includes('quantize'),
      inferredLevel: 'sub-beat',
      confidence: 0.75,
      reasoning: 'Discussion about timing implies sub-beat precision',
      priority: 9,
    },
  ];
}

const GRANULARITY_MAPPING_RULES = buildGranularityMappingRules();

const DEFAULT_GRANULARITY_CONFIG: GranularityConfig = {
  preferSaferGranularity: true,
  clarifyOnAmbiguity: true,
  expertiseWeightFactor: 0.15,
  recencyWeightFactor: 0.2,
  activityWeightFactor: 0.35,
  zoomWeightFactor: 0.3,
  minimumConfidenceThreshold: 0.5,
};

// ---- 217 Helpers ----

function makeGranularityId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`;
}

function granularityBracket(conf: number): GranularityConfidenceBracket {
  if (conf >= 0.85) return 'high';
  if (conf >= 0.6) return 'medium';
  if (conf >= 0.35) return 'low';
  return 'speculative';
}

function getGranularityOrdinal(level: GranularityLevel): number {
  const info = GRANULARITY_LEVELS.find(g => g.level === level);
  return info !== undefined ? info.ordinal : 3;
}

function getLevelInfo(level: GranularityLevel): GranularityLevelInfo {
  const info = GRANULARITY_LEVELS.find(g => g.level === level);
  if (info !== undefined) return info;
  return GRANULARITY_LEVELS[3] as GranularityLevelInfo;
}

// ---- 217 Functions ----

/** Infer granularity level from context. */
export function inferGranularity(
  utterance: string,
  context: GranularityContext,
  config?: GranularityConfig,
): GranularityInference {
  const cfg = config ?? DEFAULT_GRANULARITY_CONFIG;
  const matchingRules: Array<{ rule: GranularityMappingRule; adjustedConf: number }> = [];

  for (const rule of GRANULARITY_MAPPING_RULES) {
    if (rule.condition(context)) {
      const activityWeight = rule.ruleId.startsWith('gm-') && rule.ruleId.includes(context.currentActivity)
        ? cfg.activityWeightFactor : 0.1;
      const zoomWeight = rule.ruleId.includes('zoom') ? cfg.zoomWeightFactor : 0.1;
      const expertWeight = rule.ruleId.includes('beginner') || rule.ruleId.includes('advanced')
        ? cfg.expertiseWeightFactor : 0.0;
      const adjustedConf = rule.confidence * (1 + activityWeight + zoomWeight + expertWeight);
      matchingRules.push({ rule, adjustedConf: Math.min(1.0, adjustedConf) });
    }
  }

  matchingRules.sort((a, b) => {
    if (b.rule.priority !== a.rule.priority) return b.rule.priority - a.rule.priority;
    return b.adjustedConf - a.adjustedConf;
  });

  const top = matchingRules[0];
  const second = matchingRules[1];

  if (top === undefined) {
    const fallback = getDefaultGranularity(context.currentActivity);
    return {
      inferenceId: makeGranularityId('ginf', 0),
      utterance,
      inferredLevel: fallback.defaultLevel,
      confidence: 0.3,
      confidenceBracket: 'speculative',
      reasoning: `No matching rules; falling back to default for ${context.currentActivity}`,
      contextFactors: ['no-matching-rules'],
      isAmbiguous: true,
      alternativeLevel: fallback.saferLevel,
      clarificationNeeded: cfg.clarifyOnAmbiguity,
      clarificationQuestion: `I'm not sure of the scope. Are you working at the ${fallback.defaultLevel} level or the ${fallback.saferLevel} level?`,
      saferLevel: fallback.saferLevel,
    };
  }

  const inferredLevel = top.rule.inferredLevel;
  const confidence = top.adjustedConf;
  const factors: string[] = [top.rule.ruleId];

  let alternativeLevel: GranularityLevel | null = null;
  let isAmb = false;
  let clarificationNeeded = false;
  let clarificationQ: string | null = null;

  if (second !== undefined && Math.abs(top.adjustedConf - second.adjustedConf) < 0.15) {
    isAmb = true;
    alternativeLevel = second.rule.inferredLevel;
    factors.push(second.rule.ruleId);

    if (cfg.clarifyOnAmbiguity && confidence < cfg.minimumConfidenceThreshold + 0.2) {
      clarificationNeeded = true;
      clarificationQ = `Should I apply this at the ${inferredLevel} level or the ${alternativeLevel} level?`;
    }
  }

  const saferLevel = getSaferGranularity(inferredLevel);

  if (cfg.preferSaferGranularity && isAmb && alternativeLevel !== null) {
    const saferOrd = getGranularityOrdinal(saferLevel);
    const altOrd = getGranularityOrdinal(alternativeLevel);
    if (altOrd < saferOrd) {
      // alternative is even safer, use it
    }
  }

  return {
    inferenceId: makeGranularityId('ginf', 0),
    utterance,
    inferredLevel: cfg.preferSaferGranularity && isAmb ? saferLevel : inferredLevel,
    confidence,
    confidenceBracket: granularityBracket(confidence),
    reasoning: top.rule.reasoning,
    contextFactors: factors,
    isAmbiguous: isAmb,
    alternativeLevel,
    clarificationNeeded,
    clarificationQuestion: clarificationQ,
    saferLevel,
  };
}

/** Get granularity from context without utterance analysis. */
export function getGranularityFromContext(context: GranularityContext): GranularityLevel {
  const inference = inferGranularity('', context);
  return inference.inferredLevel;
}

/** Check if granularity is ambiguous for a given context. */
export function isGranularityAmbiguous(context: GranularityContext): boolean {
  const inference = inferGranularity('', context);
  return inference.isAmbiguous;
}

/** Get default granularity for an editing activity. */
export function getDefaultGranularity(activity: EditingActivity): GranularityDefault {
  const found = GRANULARITY_DEFAULTS.find(d => d.activity === activity);
  if (found !== undefined) return found;
  return {
    activity,
    defaultLevel: 'bar',
    saferLevel: 'phrase',
    rationale: 'Fallback default: bar-level with phrase safety',
  };
}

/** Generate clarification question for ambiguous granularity. */
export function generateGranularityClarification(inference: GranularityInference): string {
  if (inference.clarificationQuestion !== null) return inference.clarificationQuestion;

  const alt = inference.alternativeLevel ?? inference.saferLevel;
  return `I want to make sure I apply changes at the right scope. `
    + `Did you mean at the ${inference.inferredLevel} level or the ${alt} level?`;
}

/** Format a granularity inference as a human-readable string. */
export function formatGranularityInference(inference: GranularityInference): string {
  const parts: string[] = [];
  parts.push(`level=${inference.inferredLevel}`);
  parts.push(`confidence=${inference.confidence.toFixed(2)}`);
  parts.push(`bracket=${inference.confidenceBracket}`);
  if (inference.isAmbiguous) {
    parts.push(`ambiguous (alt=${inference.alternativeLevel ?? 'none'})`);
  }
  parts.push(`safer=${inference.saferLevel}`);
  parts.push(`reason="${inference.reasoning}"`);
  return parts.join(' | ');
}

/** Get all granularity levels with their info. */
export function getGranularityLevels(): ReadonlyArray<{
  readonly level: GranularityLevel;
  readonly ordinal: number;
  readonly description: string;
  readonly impactScope: string;
}> {
  return GRANULARITY_LEVELS.map(g => ({
    level: g.level,
    ordinal: g.ordinal,
    description: g.description,
    impactScope: g.impactScope,
  }));
}

/** Compare two granularity levels. Returns negative if a is finer, positive if a is coarser. */
export function compareGranularities(a: GranularityLevel, b: GranularityLevel): number {
  return getGranularityOrdinal(a) - getGranularityOrdinal(b);
}

/** Narrow granularity to a finer level. */
export function narrowGranularity(level: GranularityLevel): GranularityLevel {
  const ord = getGranularityOrdinal(level);
  const next = GRANULARITY_LEVELS.find(g => g.ordinal === ord + 1);
  return next !== undefined ? next.level : level;
}

/** Widen granularity to a coarser level. */
export function widenGranularity(level: GranularityLevel): GranularityLevel {
  const ord = getGranularityOrdinal(level);
  const prev = GRANULARITY_LEVELS.find(g => g.ordinal === ord - 1);
  return prev !== undefined ? prev.level : level;
}

/** Batch infer granularity for multiple utterances. */
export function batchInferGranularity(
  utterances: ReadonlyArray<string>,
  context: GranularityContext,
  config?: GranularityConfig,
): GranularityBatchResult {
  const inferences: GranularityInference[] = [];
  let ambCount = 0;
  let clarCount = 0;

  for (const utterance of utterances) {
    const inf = inferGranularity(utterance, context, config);
    inferences.push(inf);
    if (inf.isAmbiguous) ambCount++;
    if (inf.clarificationNeeded) clarCount++;
  }

  return {
    utterances,
    inferences,
    ambiguousCount: ambCount,
    clarificationsNeeded: clarCount,
  };
}

/** Get the safer (larger scope) granularity for a given level. */
export function getSaferGranularity(level: GranularityLevel): GranularityLevel {
  const info = getLevelInfo(level);
  if (info.impactScope === 'high') return level;
  return widenGranularity(level);
}


// ===================== STEP 218: TOPIC CONTINUITY =====================

// ---- 218 Types ----

/** Classification of topic types. */
export type TopicType =
  | 'entity'
  | 'section'
  | 'parameter'
  | 'action'
  | 'board'
  | 'layer'
  | 'effect'
  | 'instrument';

/** Confidence bracket for topic detection. */
export type TopicConfidenceBracket = 'high' | 'medium' | 'low' | 'speculative';

/** A topic shift classification. */
export type TopicShiftKind =
  | 'explicit-verbal'
  | 'explicit-reference'
  | 'implicit-entity-change'
  | 'implicit-parameter-change'
  | 'implicit-scope-change'
  | 'continuation'
  | 'return-to-previous'
  | 'no-shift';

/** An active topic in the discourse. */
export interface TopicEntry {
  readonly topicId: string;
  readonly topicType: TopicType;
  readonly name: string;
  readonly scope: string;
  readonly turnNumber: number;
  readonly utterance: string;
  readonly confidence: number;
  readonly confidenceBracket: TopicConfidenceBracket;
  readonly isActive: boolean;
  readonly properties: ReadonlyArray<{ readonly key: string; readonly value: string }>;
}

/** State of the topic tracking system. */
export interface TopicState {
  readonly stateId: string;
  readonly topicStack: ReadonlyArray<TopicEntry>;
  readonly currentTurn: number;
  readonly topicHistory: ReadonlyArray<TopicEntry>;
  readonly lastShift: TopicShift | null;
  readonly maxStackDepth: number;
}

/** Inheritance result when a topic is carried forward. */
export interface TopicInheritance {
  readonly inheritanceId: string;
  readonly utterance: string;
  readonly inheritedTopic: TopicEntry;
  readonly inheritanceType: 'pronoun' | 'bare-action' | 'implicit-scope' | 'ellipsis' | 'default';
  readonly confidence: number;
  readonly confidenceBracket: TopicConfidenceBracket;
  readonly reasoning: string;
  readonly overridden: boolean;
  readonly overrideSource: string | null;
}

/** A detected topic shift. */
export interface TopicShift {
  readonly shiftId: string;
  readonly shiftKind: TopicShiftKind;
  readonly fromTopic: TopicEntry | null;
  readonly toTopic: TopicEntry;
  readonly utterance: string;
  readonly triggerText: string;
  readonly confidence: number;
  readonly isExplicit: boolean;
}

/** Configuration for topic continuity. */
export interface TopicConfig {
  readonly maxStackDepth: number;
  readonly decayRate: number;
  readonly inheritanceThreshold: number;
  readonly shiftDetectionThreshold: number;
  readonly pronounInheritanceWeight: number;
  readonly bareActionInheritanceWeight: number;
  readonly explicitOverrideWeight: number;
  readonly turnRecencyWeight: number;
}

/** Pattern for detecting topic-related expressions. */
interface TopicPattern {
  readonly patternId: string;
  readonly regex: RegExp;
  readonly topicType: TopicType;
  readonly isExplicitShift: boolean;
  readonly extractionGroup: number;
  readonly description: string;
}

/** Pattern for detecting topic inheritance. */
interface TopicInheritancePattern {
  readonly patternId: string;
  readonly regex: RegExp;
  readonly inheritanceType: 'pronoun' | 'bare-action' | 'implicit-scope' | 'ellipsis' | 'default';
  readonly description: string;
}

// ---- 218 Data ----

const DEFAULT_TOPIC_CONFIG: TopicConfig = {
  maxStackDepth: 10,
  decayRate: 0.1,
  inheritanceThreshold: 0.4,
  shiftDetectionThreshold: 0.5,
  pronounInheritanceWeight: 0.85,
  bareActionInheritanceWeight: 0.7,
  explicitOverrideWeight: 1.0,
  turnRecencyWeight: 0.15,
};

const TOPIC_PATTERNS: ReadonlyArray<TopicPattern> = [
  {
    patternId: 'top-section-explicit',
    regex: /\b(?:let'?s?\s+)?(?:work\s+on|go\s+to|switch\s+to|move\s+to|edit|open)\s+(?:the\s+)?(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)\b/i,
    topicType: 'section',
    isExplicitShift: true,
    extractionGroup: 1,
    description: 'Explicit shift to a song section',
  },
  {
    patternId: 'top-section-now',
    regex: /\bnow\s+(?:let'?s?\s+)?(?:do|work\s+on|focus\s+on)\s+(?:the\s+)?(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)\b/i,
    topicType: 'section',
    isExplicitShift: true,
    extractionGroup: 1,
    description: 'Explicit shift with "now" marker',
  },
  {
    patternId: 'top-instrument-explicit',
    regex: /\b(?:for|on|with)\s+(?:the\s+)?(piano|guitar|bass|drums|synth|strings|vocals?|keys|organ|pad|lead|horn|brass|wind|percussion|violin|cello|flute|saxophone)\b/i,
    topicType: 'instrument',
    isExplicitShift: false,
    extractionGroup: 1,
    description: 'Reference to an instrument',
  },
  {
    patternId: 'top-effect-explicit',
    regex: /\b(?:the\s+)?(reverb|delay|chorus|flanger|phaser|distortion|compression|compressor|eq|equalizer|filter|saturation|limiter|gate|de-?esser)\b/i,
    topicType: 'effect',
    isExplicitShift: false,
    extractionGroup: 1,
    description: 'Reference to an audio effect',
  },
  {
    patternId: 'top-layer-explicit',
    regex: /\b(?:the\s+)?(top|bottom|middle|upper|lower|main|sub|background|foreground|lead|backing)\s+(?:layer|track|channel|part)\b/i,
    topicType: 'layer',
    isExplicitShift: false,
    extractionGroup: 0,
    description: 'Reference to a layer/track/channel',
  },
  {
    patternId: 'top-board-explicit',
    regex: /\b(?:the\s+)?(mixer|editor|arranger|browser|piano\s*roll|drum\s*machine|sampler|sequencer)\b/i,
    topicType: 'board',
    isExplicitShift: true,
    extractionGroup: 1,
    description: 'Reference to a workspace/board',
  },
  {
    patternId: 'top-parameter-explicit',
    regex: /\b(?:the\s+)?(volume|level|pan|panning|pitch|tempo|key|velocity|attack|release|decay|sustain|cutoff|resonance|frequency|gain|threshold|ratio|width|depth|rate|feedback|drive|tone|mix|send|return)\b/i,
    topicType: 'parameter',
    isExplicitShift: false,
    extractionGroup: 1,
    description: 'Reference to a parameter',
  },
  {
    patternId: 'top-action-make',
    regex: /\b(make|set|change|adjust|tweak|modify|increase|decrease|raise|lower|boost|cut|add|remove|delete|copy|paste|duplicate|move|shift|transpose|reverse|mute|solo|unmute|unsolo)\b/i,
    topicType: 'action',
    isExplicitShift: false,
    extractionGroup: 1,
    description: 'Action verb (does not shift topic entity)',
  },
  {
    patternId: 'top-entity-the',
    regex: /\bthe\s+([\w-]+(?:\s+[\w-]+)?)\b/i,
    topicType: 'entity',
    isExplicitShift: false,
    extractionGroup: 1,
    description: 'Definite reference to an entity',
  },
  {
    patternId: 'top-section-in',
    regex: /\bin\s+(?:the\s+)?(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|breakdown|drop|buildup|hook|refrain|coda|interlude)\b/i,
    topicType: 'section',
    isExplicitShift: false,
    extractionGroup: 1,
    description: 'Implicit section reference with "in"',
  },
  {
    patternId: 'top-shift-lets',
    regex: /\b(?:now\s+)?let'?s?\s+(?:try|do|go|start|begin|focus)\b/i,
    topicType: 'action',
    isExplicitShift: true,
    extractionGroup: 0,
    description: 'Explicit topic shift marker with "let\'s"',
  },
  {
    patternId: 'top-shift-what-about',
    regex: /\b(?:what\s+about|how\s+about|how'?s?\s+about)\s+(?:the\s+)?([\w-]+(?:\s+[\w-]+)?)\b/i,
    topicType: 'entity',
    isExplicitShift: true,
    extractionGroup: 1,
    description: 'Topic shift with "what about"',
  },
  {
    patternId: 'top-shift-back-to',
    regex: /\b(?:back\s+to|return\s+to|go\s+back\s+to)\s+(?:the\s+)?([\w-]+(?:\s+[\w-]+)?)\b/i,
    topicType: 'entity',
    isExplicitShift: true,
    extractionGroup: 1,
    description: 'Return to previous topic',
  },
  {
    patternId: 'top-shift-instead',
    regex: /\binstead\b/i,
    topicType: 'action',
    isExplicitShift: true,
    extractionGroup: 0,
    description: 'Topic replacement marker',
  },
  {
    patternId: 'top-shift-actually',
    regex: /\bactually\b/i,
    topicType: 'action',
    isExplicitShift: true,
    extractionGroup: 0,
    description: 'Topic correction marker',
  },
];

const TOPIC_INHERITANCE_PATTERNS: ReadonlyArray<TopicInheritancePattern> = [
  {
    patternId: 'inh-pronoun-it',
    regex: /\bit\b/i,
    inheritanceType: 'pronoun',
    description: 'Pronoun "it" inherits current topic',
  },
  {
    patternId: 'inh-pronoun-that',
    regex: /\bthat\b/i,
    inheritanceType: 'pronoun',
    description: 'Pronoun "that" inherits current topic',
  },
  {
    patternId: 'inh-pronoun-this',
    regex: /\bthis\b/i,
    inheritanceType: 'pronoun',
    description: 'Pronoun "this" inherits current topic',
  },
  {
    patternId: 'inh-pronoun-them',
    regex: /\bthem\b/i,
    inheritanceType: 'pronoun',
    description: 'Pronoun "them" inherits current topic',
  },
  {
    patternId: 'inh-pronoun-those',
    regex: /\bthose\b/i,
    inheritanceType: 'pronoun',
    description: 'Pronoun "those" inherits current topic',
  },
  {
    patternId: 'inh-pronoun-these',
    regex: /\bthese\b/i,
    inheritanceType: 'pronoun',
    description: 'Pronoun "these" inherits current topic',
  },
  {
    patternId: 'inh-bare-make',
    regex: /^(?:make|set|adjust|tweak|change)\s+/i,
    inheritanceType: 'bare-action',
    description: 'Bare action command inherits topic scope',
  },
  {
    patternId: 'inh-bare-more',
    regex: /^(?:more|less|louder|quieter|brighter|darker|wider|narrower|faster|slower|bigger|smaller|longer|shorter)\b/i,
    inheritanceType: 'bare-action',
    description: 'Bare comparative inherits topic scope',
  },
  {
    patternId: 'inh-bare-add',
    regex: /^(?:add|remove|delete|insert|duplicate|copy)\s+/i,
    inheritanceType: 'bare-action',
    description: 'Bare add/remove action inherits topic scope',
  },
  {
    patternId: 'inh-bare-again',
    regex: /\bagain\b/i,
    inheritanceType: 'bare-action',
    description: '"Again" inherits previous action topic',
  },
  {
    patternId: 'inh-bare-same',
    regex: /\b(?:same|similar|like\s+before)\b/i,
    inheritanceType: 'ellipsis',
    description: '"Same" inherits previous topic entirely',
  },
  {
    patternId: 'inh-bare-too',
    regex: /\btoo\b$/i,
    inheritanceType: 'ellipsis',
    description: '"Too" at end inherits scope additively',
  },
  {
    patternId: 'inh-implicit-scope-also',
    regex: /^also\b/i,
    inheritanceType: 'implicit-scope',
    description: '"Also" inherits current scope',
  },
  {
    patternId: 'inh-implicit-scope-and',
    regex: /^and\b/i,
    inheritanceType: 'implicit-scope',
    description: '"And" continues current scope',
  },
  {
    patternId: 'inh-implicit-scope-then',
    regex: /^then\b/i,
    inheritanceType: 'implicit-scope',
    description: '"Then" continues with temporal sequence',
  },
  {
    patternId: 'inh-implicit-scope-plus',
    regex: /^(?:plus|additionally)\b/i,
    inheritanceType: 'implicit-scope',
    description: '"Plus/additionally" extends current scope',
  },
];

/** Inheritance behavior per topic type. */
const TOPIC_TYPE_INHERITANCE: ReadonlyArray<{
  readonly topicType: TopicType;
  readonly allowsPronounInheritance: boolean;
  readonly allowsBareActionInheritance: boolean;
  readonly persistsAcrossTurns: number;
  readonly overridableBy: ReadonlyArray<TopicType>;
}> = [
  { topicType: 'entity', allowsPronounInheritance: true, allowsBareActionInheritance: true, persistsAcrossTurns: 5, overridableBy: ['entity', 'instrument', 'effect'] },
  { topicType: 'section', allowsPronounInheritance: true, allowsBareActionInheritance: true, persistsAcrossTurns: 8, overridableBy: ['section'] },
  { topicType: 'parameter', allowsPronounInheritance: true, allowsBareActionInheritance: true, persistsAcrossTurns: 3, overridableBy: ['parameter', 'entity'] },
  { topicType: 'action', allowsPronounInheritance: false, allowsBareActionInheritance: false, persistsAcrossTurns: 1, overridableBy: ['action', 'entity', 'section'] },
  { topicType: 'board', allowsPronounInheritance: false, allowsBareActionInheritance: true, persistsAcrossTurns: 10, overridableBy: ['board'] },
  { topicType: 'layer', allowsPronounInheritance: true, allowsBareActionInheritance: true, persistsAcrossTurns: 5, overridableBy: ['layer', 'entity'] },
  { topicType: 'effect', allowsPronounInheritance: true, allowsBareActionInheritance: true, persistsAcrossTurns: 4, overridableBy: ['effect', 'entity'] },
  { topicType: 'instrument', allowsPronounInheritance: true, allowsBareActionInheritance: true, persistsAcrossTurns: 6, overridableBy: ['instrument', 'entity'] },
];

// ---- 218 Helpers ----

function makeTopicId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`;
}

function topicConfBracket(conf: number): TopicConfidenceBracket {
  if (conf >= 0.85) return 'high';
  if (conf >= 0.6) return 'medium';
  if (conf >= 0.35) return 'low';
  return 'speculative';
}

function getInheritanceBehavior(topicType: TopicType): (typeof TOPIC_TYPE_INHERITANCE)[number] | null {
  for (const entry of TOPIC_TYPE_INHERITANCE) {
    if (entry.topicType === topicType) return entry;
  }
  return null;
}

function computeTopicDecay(topic: TopicEntry, currentTurn: number, decayRate: number): number {
  const turnDelta = currentTurn - topic.turnNumber;
  return topic.confidence * Math.exp(-decayRate * turnDelta);
}

// ---- 218 Functions ----

/** Create a fresh topic state. */
export function createTopicState(): TopicState {
  return {
    stateId: makeTopicId('tstate', 0),
    topicStack: [],
    currentTurn: 0,
    topicHistory: [],
    lastShift: null,
    maxStackDepth: DEFAULT_TOPIC_CONFIG.maxStackDepth,
  };
}

/** Update the topic state with a new utterance. */
export function updateTopic(
  state: TopicState,
  utterance: string,
  config?: TopicConfig,
): TopicState {
  const cfg = config ?? DEFAULT_TOPIC_CONFIG;
  const turnNum = state.currentTurn + 1;

  // Detect explicit topic shifts
  const shiftDetections: Array<{
    pattern: TopicPattern;
    match: RegExpMatchArray;
  }> = [];

  for (const pattern of TOPIC_PATTERNS) {
    const match = pattern.regex.exec(utterance);
    if (match !== null) {
      shiftDetections.push({ pattern, match });
    }
  }

  // Find the highest-priority explicit shift
  const explicitShifts = shiftDetections.filter(d => d.pattern.isExplicitShift);
  const implicitRefs = shiftDetections.filter(d => !d.pattern.isExplicitShift);

  let newTopic: TopicEntry | null = null;
  let shift: TopicShift | null = null;

  if (explicitShifts.length > 0) {
    const best = explicitShifts[0];
    if (best !== undefined) {
      const extractedName = best.pattern.extractionGroup > 0
        ? (best.match[best.pattern.extractionGroup] ?? best.match[0] ?? '')
        : (best.match[0] ?? '');

      newTopic = {
        topicId: makeTopicId('topic', turnNum),
        topicType: best.pattern.topicType,
        name: extractedName.toLowerCase().trim(),
        scope: extractedName.toLowerCase().trim(),
        turnNumber: turnNum,
        utterance,
        confidence: 0.9,
        confidenceBracket: 'high',
        isActive: true,
        properties: [],
      };

      const currentTop = state.topicStack.length > 0 ? state.topicStack[state.topicStack.length - 1] : undefined;

      shift = {
        shiftId: makeTopicId('shift', turnNum),
        shiftKind: best.pattern.patternId.includes('back-to') ? 'return-to-previous' : 'explicit-verbal',
        fromTopic: currentTop !== undefined ? currentTop : null,
        toTopic: newTopic,
        utterance,
        triggerText: best.match[0] ?? '',
        confidence: 0.9,
        isExplicit: true,
      };
    }
  } else if (implicitRefs.length > 0) {
    // Check if there is an entity/section reference that might shift topic
    const entityRef = implicitRefs.find(d =>
      d.pattern.topicType !== 'action' && d.pattern.topicType !== 'parameter',
    );
    if (entityRef !== undefined) {
      const extractedName = entityRef.pattern.extractionGroup > 0
        ? (entityRef.match[entityRef.pattern.extractionGroup] ?? entityRef.match[0] ?? '')
        : (entityRef.match[0] ?? '');

      const currentTop = state.topicStack.length > 0
        ? state.topicStack[state.topicStack.length - 1]
        : undefined;

      // Only shift if it's a different topic
      if (currentTop === undefined || currentTop.name !== extractedName.toLowerCase().trim()) {
        newTopic = {
          topicId: makeTopicId('topic', turnNum),
          topicType: entityRef.pattern.topicType,
          name: extractedName.toLowerCase().trim(),
          scope: extractedName.toLowerCase().trim(),
          turnNumber: turnNum,
          utterance,
          confidence: 0.7,
          confidenceBracket: 'medium',
          isActive: true,
          properties: [],
        };

        shift = {
          shiftId: makeTopicId('shift', turnNum),
          shiftKind: 'implicit-entity-change',
          fromTopic: currentTop !== undefined ? currentTop : null,
          toTopic: newTopic,
          utterance,
          triggerText: entityRef.match[0] ?? '',
          confidence: 0.7,
          isExplicit: false,
        };
      }
    }
  }

  // Build new stack
  let newStack: TopicEntry[];
  if (newTopic !== null) {
    // Decay existing topics and push new one
    newStack = state.topicStack
      .map(t => ({
        ...t,
        confidence: computeTopicDecay(t, turnNum, cfg.decayRate),
        isActive: computeTopicDecay(t, turnNum, cfg.decayRate) > cfg.inheritanceThreshold,
      }))
      .filter(t => t.isActive);
    newStack.push(newTopic);

    // Trim to max depth
    while (newStack.length > cfg.maxStackDepth) {
      newStack.shift();
    }
  } else {
    // No new topic — just decay
    newStack = state.topicStack
      .map(t => ({
        ...t,
        confidence: computeTopicDecay(t, turnNum, cfg.decayRate),
        isActive: computeTopicDecay(t, turnNum, cfg.decayRate) > cfg.inheritanceThreshold,
      }))
      .filter(t => t.isActive);
  }

  const newHistory = [...state.topicHistory];
  if (newTopic !== null) {
    newHistory.push(newTopic);
  }

  return {
    stateId: state.stateId,
    topicStack: newStack,
    currentTurn: turnNum,
    topicHistory: newHistory,
    lastShift: shift,
    maxStackDepth: cfg.maxStackDepth,
  };
}

/** Determine what topic an utterance inherits from. */
export function inheritTopic(
  state: TopicState,
  utterance: string,
  config?: TopicConfig,
): TopicInheritance | null {
  const cfg = config ?? DEFAULT_TOPIC_CONFIG;

  if (state.topicStack.length === 0) return null;

  // Check inheritance patterns
  for (const pattern of TOPIC_INHERITANCE_PATTERNS) {
    const match = pattern.regex.exec(utterance);
    if (match !== null) {
      // Find the most relevant active topic
      const stackCopy = [...state.topicStack].reverse();
      for (const topic of stackCopy) {
        const behavior = getInheritanceBehavior(topic.topicType);
        if (behavior === null) continue;

        const turnDelta = state.currentTurn - topic.turnNumber;
        if (turnDelta > behavior.persistsAcrossTurns) continue;

        if (pattern.inheritanceType === 'pronoun' && !behavior.allowsPronounInheritance) continue;
        if (pattern.inheritanceType === 'bare-action' && !behavior.allowsBareActionInheritance) continue;

        const weight = pattern.inheritanceType === 'pronoun'
          ? cfg.pronounInheritanceWeight
          : pattern.inheritanceType === 'bare-action'
            ? cfg.bareActionInheritanceWeight
            : 0.6;

        const decayed = computeTopicDecay(topic, state.currentTurn, cfg.decayRate);
        const conf = Math.min(1.0, decayed * weight);

        if (conf >= cfg.inheritanceThreshold) {
          return {
            inheritanceId: makeTopicId('inh', state.currentTurn),
            utterance,
            inheritedTopic: topic,
            inheritanceType: pattern.inheritanceType,
            confidence: conf,
            confidenceBracket: topicConfBracket(conf),
            reasoning: `"${match[0] ?? ''}" inherits from ${topic.topicType} "${topic.name}" via ${pattern.inheritanceType}`,
            overridden: false,
            overrideSource: null,
          };
        }
      }
    }
  }

  // Default: inherit from top of stack
  const topEntry = state.topicStack[state.topicStack.length - 1];
  if (topEntry !== undefined) {
    const decayed = computeTopicDecay(topEntry, state.currentTurn, cfg.decayRate);
    if (decayed >= cfg.inheritanceThreshold) {
      return {
        inheritanceId: makeTopicId('inh', state.currentTurn),
        utterance,
        inheritedTopic: topEntry,
        inheritanceType: 'default',
        confidence: decayed * 0.5,
        confidenceBracket: topicConfBracket(decayed * 0.5),
        reasoning: `Default inheritance from top of stack: ${topEntry.topicType} "${topEntry.name}"`,
        overridden: false,
        overrideSource: null,
      };
    }
  }

  return null;
}

/** Detect if a topic shift occurred in an utterance. */
export function detectTopicShift(
  state: TopicState,
  utterance: string,
): TopicShift | null {
  for (const pattern of TOPIC_PATTERNS) {
    if (!pattern.isExplicitShift) continue;
    const match = pattern.regex.exec(utterance);
    if (match !== null) {
      const extractedName = pattern.extractionGroup > 0
        ? (match[pattern.extractionGroup] ?? match[0] ?? '')
        : (match[0] ?? '');

      const currentTop = state.topicStack.length > 0
        ? state.topicStack[state.topicStack.length - 1]
        : undefined;

      const newTopic: TopicEntry = {
        topicId: makeTopicId('topic', state.currentTurn + 1),
        topicType: pattern.topicType,
        name: extractedName.toLowerCase().trim(),
        scope: extractedName.toLowerCase().trim(),
        turnNumber: state.currentTurn + 1,
        utterance,
        confidence: 0.85,
        confidenceBracket: 'high',
        isActive: true,
        properties: [],
      };

      return {
        shiftId: makeTopicId('shift', state.currentTurn + 1),
        shiftKind: pattern.patternId.includes('back-to') ? 'return-to-previous' : 'explicit-verbal',
        fromTopic: currentTop !== undefined ? currentTop : null,
        toTopic: newTopic,
        utterance,
        triggerText: match[0] ?? '',
        confidence: 0.85,
        isExplicit: true,
      };
    }
  }

  // Check for implicit shifts via entity references
  for (const pattern of TOPIC_PATTERNS) {
    if (pattern.isExplicitShift) continue;
    if (pattern.topicType === 'action' || pattern.topicType === 'parameter') continue;

    const match = pattern.regex.exec(utterance);
    if (match !== null) {
      const extractedName = pattern.extractionGroup > 0
        ? (match[pattern.extractionGroup] ?? match[0] ?? '')
        : (match[0] ?? '');

      const currentTop = state.topicStack.length > 0
        ? state.topicStack[state.topicStack.length - 1]
        : undefined;

      if (currentTop !== undefined && currentTop.name === extractedName.toLowerCase().trim()) {
        continue; // Same topic, no shift
      }

      const newTopic: TopicEntry = {
        topicId: makeTopicId('topic', state.currentTurn + 1),
        topicType: pattern.topicType,
        name: extractedName.toLowerCase().trim(),
        scope: extractedName.toLowerCase().trim(),
        turnNumber: state.currentTurn + 1,
        utterance,
        confidence: 0.6,
        confidenceBracket: 'medium',
        isActive: true,
        properties: [],
      };

      return {
        shiftId: makeTopicId('shift', state.currentTurn + 1),
        shiftKind: 'implicit-entity-change',
        fromTopic: currentTop !== undefined ? currentTop : null,
        toTopic: newTopic,
        utterance,
        triggerText: match[0] ?? '',
        confidence: 0.6,
        isExplicit: false,
      };
    }
  }

  return null;
}

/** Check if an utterance is a continuation of the current topic. */
export function isTopicContinuation(
  state: TopicState,
  utterance: string,
  config?: TopicConfig,
): boolean {
  const cfg = config ?? DEFAULT_TOPIC_CONFIG;
  const shift = detectTopicShift(state, utterance);
  if (shift !== null && shift.confidence >= cfg.shiftDetectionThreshold) return false;

  const inheritance = inheritTopic(state, utterance, cfg);
  return inheritance !== null && inheritance.confidence >= cfg.inheritanceThreshold;
}

/** Get the active topic scope (the current topic's scope string). */
export function getActiveTopicScope(state: TopicState): string | null {
  if (state.topicStack.length === 0) return null;
  const top = state.topicStack[state.topicStack.length - 1];
  return top !== undefined ? top.scope : null;
}

/** Push a topic onto the stack. */
export function pushTopic(
  state: TopicState,
  topicType: TopicType,
  name: string,
  scope: string,
  utterance: string,
): TopicState {
  const turnNum = state.currentTurn + 1;
  const entry: TopicEntry = {
    topicId: makeTopicId('topic', turnNum),
    topicType,
    name,
    scope,
    turnNumber: turnNum,
    utterance,
    confidence: 1.0,
    confidenceBracket: 'high',
    isActive: true,
    properties: [],
  };

  const newStack = [...state.topicStack, entry];
  while (newStack.length > state.maxStackDepth) {
    newStack.shift();
  }

  return {
    stateId: state.stateId,
    topicStack: newStack,
    currentTurn: turnNum,
    topicHistory: [...state.topicHistory, entry],
    lastShift: null,
    maxStackDepth: state.maxStackDepth,
  };
}

/** Pop the top topic from the stack. */
export function popTopic(state: TopicState): TopicState {
  if (state.topicStack.length === 0) return state;

  const newStack = state.topicStack.slice(0, -1);
  return {
    stateId: state.stateId,
    topicStack: newStack,
    currentTurn: state.currentTurn,
    topicHistory: state.topicHistory,
    lastShift: state.lastShift,
    maxStackDepth: state.maxStackDepth,
  };
}

/** Format topic state as a human-readable string. */
export function formatTopicState(state: TopicState): string {
  const parts: string[] = [];
  parts.push(`turn=${state.currentTurn}`);
  parts.push(`stack-depth=${state.topicStack.length}`);

  for (let i = state.topicStack.length - 1; i >= 0; i--) {
    const entry = state.topicStack[i];
    if (entry !== undefined) {
      parts.push(`  [${i}] ${entry.topicType}:"${entry.name}" conf=${entry.confidence.toFixed(2)} turn=${entry.turnNumber}`);
    }
  }

  if (state.lastShift !== null) {
    parts.push(`last-shift: ${state.lastShift.shiftKind} -> "${state.lastShift.toTopic.name}"`);
  }

  return parts.join('\n');
}

/** Get the topic history. */
export function getTopicHistory(state: TopicState): ReadonlyArray<TopicEntry> {
  return state.topicHistory;
}

/** Clear all topics from the state. */
export function clearTopics(state: TopicState): TopicState {
  return {
    stateId: state.stateId,
    topicStack: [],
    currentTurn: state.currentTurn,
    topicHistory: state.topicHistory,
    lastShift: null,
    maxStackDepth: state.maxStackDepth,
  };
}

/** Batch resolve topic inheritance for multiple utterances. */
export function batchResolveTopicInheritance(
  utterances: ReadonlyArray<string>,
  initialState: TopicState,
  config?: TopicConfig,
): ReadonlyArray<TopicInheritance | null> {
  const results: Array<TopicInheritance | null> = [];
  let currentState = initialState;

  for (const utterance of utterances) {
    const inheritance = inheritTopic(currentState, utterance, config);
    results.push(inheritance);
    currentState = updateTopic(currentState, utterance, config);
  }

  return results;
}

/** Get the topic type of a detected topic from an utterance. */
export function getTopicType(utterance: string): TopicType | null {
  for (const pattern of TOPIC_PATTERNS) {
    const match = pattern.regex.exec(utterance);
    if (match !== null && pattern.topicType !== 'action') {
      return pattern.topicType;
    }
  }
  return null;
}

/** Check if a topic shift is explicit (verbal marker) rather than implicit. */
export function isExplicitShift(shift: TopicShift): boolean {
  return shift.isExplicit;
}
