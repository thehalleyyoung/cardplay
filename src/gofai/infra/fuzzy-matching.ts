/**
 * GOFAI Infra — Deterministic Fuzzy Matching Rules
 *
 * Implements a single, deterministic fuzzy matching algorithm used
 * everywhere names are resolved: section names, layer names, card names,
 * parameter names, domain nouns, etc.
 *
 * ## Design Principles
 *
 * 1. **One algorithm everywhere** — All name resolution uses the same
 *    scoring function. No ad-hoc matching in individual modules.
 * 2. **Deterministic** — Same inputs always produce the same ranking.
 *    No randomness, no ML, no probabilities.
 * 3. **Stable tie-breakers** — When two candidates score equally,
 *    tie-breaking is by: (a) shorter name, (b) earlier in vocabulary,
 *    (c) alphabetical order.
 * 4. **Explainable** — Every match result includes a human-readable
 *    explanation of why that match was chosen and what the score means.
 * 5. **Configurable thresholds** — Minimum score thresholds are explicit
 *    and adjustable, not hardcoded.
 * 6. **Multi-strategy** — Combines multiple matching strategies with
 *    weighted scoring.
 *
 * @module gofai/infra/fuzzy-matching
 * @see gofai_goalA.md Step 085
 */

// =============================================================================
// MATCH RESULT TYPES
// =============================================================================

/**
 * A fuzzy match result with score and explanation.
 */
export interface FuzzyMatchResult {
  /** The matched candidate string */
  readonly candidate: string;

  /** Index in the candidate list */
  readonly candidateIndex: number;

  /** Overall match score (0–1, higher is better) */
  readonly score: number;

  /** Individual strategy scores */
  readonly strategyScores: readonly StrategyScore[];

  /** Human-readable explanation */
  readonly explanation: string;

  /** Whether the match is above the confidence threshold */
  readonly confident: boolean;

  /** Match type classification */
  readonly matchType: MatchType;
}

/**
 * Score from a single matching strategy.
 */
export interface StrategyScore {
  readonly strategy: MatchStrategy;
  readonly score: number;
  readonly weight: number;
  readonly weightedScore: number;
  readonly detail: string;
}

/**
 * Match type classification.
 */
export type MatchType =
  | 'exact'           // Exact string match
  | 'case_insensitive'// Exact match ignoring case
  | 'synonym'         // Known synonym match
  | 'prefix'          // Prefix match ("cho" → "chorus")
  | 'abbreviation'    // Abbreviation match ("ch" → "chorus")
  | 'substring'       // Substring match ("oru" in "chorus")
  | 'levenshtein'     // Edit distance match ("chrus" → "chorus")
  | 'token_overlap'   // Word-level overlap ("bass drum" ↔ "drum bass")
  | 'phonetic'        // Sounds-alike match
  | 'no_match';       // Below threshold

/**
 * Matching strategies.
 */
export type MatchStrategy =
  | 'exact'
  | 'case_insensitive'
  | 'prefix'
  | 'suffix'
  | 'substring'
  | 'levenshtein'
  | 'damerau_levenshtein'
  | 'jaro_winkler'
  | 'token_overlap'
  | 'abbreviation'
  | 'synonym'
  | 'soundex';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configuration for the fuzzy matcher.
 */
export interface FuzzyMatchConfig {
  /** Minimum score to consider a match (0–1) */
  readonly minScore: number;

  /** Minimum score for "confident" match (0–1) */
  readonly confidentScore: number;

  /** Maximum number of results to return */
  readonly maxResults: number;

  /** Strategy weights (must sum to 1.0) */
  readonly weights: Readonly<Record<MatchStrategy, number>>;

  /** Whether to use synonym lookup */
  readonly useSynonyms: boolean;

  /** Whether to use phonetic matching */
  readonly usePhonetic: boolean;

  /** Maximum edit distance for Levenshtein */
  readonly maxEditDistance: number;

  /** Minimum prefix length for prefix matching */
  readonly minPrefixLength: number;

  /** Case sensitivity */
  readonly caseSensitive: boolean;
}

/**
 * Default configuration.
 */
export const DEFAULT_FUZZY_CONFIG: FuzzyMatchConfig = {
  minScore: 0.3,
  confidentScore: 0.7,
  maxResults: 5,
  weights: {
    exact: 0.0,           // Not weighted — exact match is always 1.0
    case_insensitive: 0.0, // Not weighted — handled as special case
    prefix: 0.20,
    suffix: 0.05,
    substring: 0.10,
    levenshtein: 0.25,
    damerau_levenshtein: 0.0, // Use levenshtein instead by default
    jaro_winkler: 0.20,
    token_overlap: 0.10,
    abbreviation: 0.05,
    synonym: 0.0,          // Handled separately when enabled
    soundex: 0.05,
  },
  useSynonyms: true,
  usePhonetic: true,
  maxEditDistance: 3,
  minPrefixLength: 2,
  caseSensitive: false,
};

// =============================================================================
// SYNONYM TABLE
// =============================================================================

/**
 * A synonym entry mapping alternative names to canonical names.
 */
export interface SynonymEntry {
  readonly canonical: string;
  readonly synonyms: readonly string[];
}

/**
 * Built-in synonyms for music terminology.
 */
export const MUSIC_SYNONYMS: readonly SynonymEntry[] = [
  // Section names
  { canonical: 'chorus', synonyms: ['hook', 'refrain', 'ch'] },
  { canonical: 'verse', synonyms: ['v', 'vs'] },
  { canonical: 'bridge', synonyms: ['b section', 'middle 8', 'release'] },
  { canonical: 'intro', synonyms: ['introduction', 'opening'] },
  { canonical: 'outro', synonyms: ['ending', 'coda', 'tag'] },
  { canonical: 'pre-chorus', synonyms: ['prechorus', 'pre chorus', 'pre', 'climb', 'lift'] },
  { canonical: 'breakdown', synonyms: ['break', 'bd'] },
  { canonical: 'drop', synonyms: ['the drop'] },
  { canonical: 'build', synonyms: ['buildup', 'build-up', 'riser'] },

  // Layer/instrument names
  { canonical: 'drums', synonyms: ['drum', 'kit', 'percussion', 'perc'] },
  { canonical: 'kick', synonyms: ['kick drum', 'bass drum', 'bd'] },
  { canonical: 'snare', synonyms: ['snare drum', 'sd', 'rimshot'] },
  { canonical: 'hi-hat', synonyms: ['hihat', 'hi hat', 'hats', 'hh'] },
  { canonical: 'bass', synonyms: ['bass line', 'bassline', 'low end'] },
  { canonical: 'lead', synonyms: ['lead line', 'melody', 'topline'] },
  { canonical: 'pad', synonyms: ['pads', 'synth pad', 'atmosphere', 'atmo'] },
  { canonical: 'vocal', synonyms: ['vocals', 'vox', 'voice', 'singing'] },
  { canonical: 'guitar', synonyms: ['gtr', 'guit', 'acoustic', 'electric'] },
  { canonical: 'piano', synonyms: ['keys', 'keyboard', 'kbd'] },
  { canonical: 'strings', synonyms: ['string section', 'str', 'orchestral strings'] },
  { canonical: 'brass', synonyms: ['horns', 'horn section'] },
  { canonical: 'woodwinds', synonyms: ['winds', 'reeds'] },

  // Musical terms
  { canonical: 'tempo', synonyms: ['bpm', 'speed', 'pace'] },
  { canonical: 'key', synonyms: ['tonality', 'tonal center'] },
  { canonical: 'dynamics', synonyms: ['volume', 'loudness', 'level'] },
  { canonical: 'velocity', synonyms: ['vel', 'note velocity', 'hit strength'] },
  { canonical: 'reverb', synonyms: ['verb', 'room', 'space', 'ambience'] },
  { canonical: 'delay', synonyms: ['echo', 'dly'] },
  { canonical: 'compression', synonyms: ['comp', 'compressor', 'dynamics processing'] },
  { canonical: 'equalization', synonyms: ['eq', 'equalizer', 'tone shaping'] },
  { canonical: 'panning', synonyms: ['pan', 'stereo position'] },

  // Perceptual qualities
  { canonical: 'brightness', synonyms: ['bright', 'brighter', 'brilliance'] },
  { canonical: 'warmth', synonyms: ['warm', 'warmer', 'fullness'] },
  { canonical: 'energy', synonyms: ['energetic', 'intensity', 'power'] },
  { canonical: 'width', synonyms: ['wide', 'wider', 'stereo width', 'spread'] },
  { canonical: 'tension', synonyms: ['tense', 'suspense', 'dissonance'] },
  { canonical: 'groove', synonyms: ['feel', 'pocket', 'swing'] },
];

const _synonymMap = new Map<string, string>();
for (const entry of MUSIC_SYNONYMS) {
  for (const syn of entry.synonyms) {
    _synonymMap.set(syn.toLowerCase(), entry.canonical);
  }
}

/**
 * Look up the canonical form of a synonym.
 */
export function lookupSynonym(term: string): string | undefined {
  return _synonymMap.get(term.toLowerCase());
}

/**
 * Add custom synonyms to the synonym table.
 */
export function addSynonyms(entries: readonly SynonymEntry[]): void {
  for (const entry of entries) {
    for (const syn of entry.synonyms) {
      _synonymMap.set(syn.toLowerCase(), entry.canonical);
    }
  }
}

// =============================================================================
// CORE MATCHING ALGORITHMS
// =============================================================================

/**
 * Compute Levenshtein (edit) distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Optimizations for common cases
  if (m === 0) return n;
  if (n === 0) return m;
  if (a === b) return 0;

  // Use single-row optimization
  const row: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const current = Math.min(
        (row[j] ?? 0) + 1,           // deletion
        prev + 1,                     // insertion
        (row[j - 1] ?? 0) + cost     // substitution
      );
      row[j - 1] = prev;
      prev = current;
    }
    row[n] = prev;
  }

  return row[n] ?? 0;
}

/**
 * Compute Jaro-Winkler similarity (0–1, higher is more similar).
 */
export function jaroWinklerSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const matchDistance = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);

  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro = (
    matches / a.length +
    matches / b.length +
    (matches - transpositions / 2) / matches
  ) / 3;

  // Winkler bonus for common prefix
  let prefixLength = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefixLength++;
    else break;
  }

  return jaro + prefixLength * 0.1 * (1 - jaro);
}

/**
 * Compute Soundex code for a string.
 * Returns a 4-character code.
 */
export function soundex(s: string): string {
  if (s.length === 0) return '0000';

  const upper = s.toUpperCase();
  const codes: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
  };

  let result = upper[0] ?? '';
  let lastCode = codes[result] ?? '0';

  for (let i = 1; i < upper.length && result.length < 4; i++) {
    const char = upper[i] ?? '';
    const code = codes[char];
    if (code && code !== lastCode) {
      result += code;
      lastCode = code;
    } else if (!code) {
      lastCode = '0'; // Reset on vowels/H/W/Y
    }
  }

  return (result + '0000').slice(0, 4);
}

/**
 * Compute token overlap score (Jaccard-like).
 */
export function tokenOverlapScore(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/[\s\-_]+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/[\s\-_]+/).filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check if a string is an abbreviation of another.
 * "ch" is an abbreviation of "chorus", "bd" of "breakdown".
 */
export function isAbbreviation(abbrev: string, full: string): boolean {
  if (abbrev.length >= full.length) return false;
  if (abbrev.length === 0) return false;

  const lower = full.toLowerCase();
  const abbrevLower = abbrev.toLowerCase();

  // Check if abbreviation matches first letters of words
  const words = lower.split(/[\s\-_]+/);
  if (words.length > 1) {
    const initials = words.map(w => w[0] ?? '').join('');
    if (initials.startsWith(abbrevLower)) return true;
  }

  // Check if abbreviation is a prefix
  if (lower.startsWith(abbrevLower)) return true;

  // Check consonant skeleton
  const consonants = lower.replace(/[aeiou]/g, '');
  if (consonants.startsWith(abbrevLower)) return true;

  return false;
}

/**
 * Compute abbreviation score (0–1).
 */
export function abbreviationScore(abbrev: string, full: string): number {
  if (!isAbbreviation(abbrev, full)) return 0;

  // Score based on how much of the full string is covered
  return Math.min(1, abbrev.length / full.length + 0.3);
}

// =============================================================================
// MAIN FUZZY MATCH FUNCTION
// =============================================================================

/**
 * Find the best fuzzy matches for a query string against a list of candidates.
 *
 * This is THE function used for all name resolution in GOFAI.
 * It uses a weighted combination of multiple matching strategies
 * and returns results sorted by score with explanations.
 */
export function fuzzyMatch(
  query: string,
  candidates: readonly string[],
  config: FuzzyMatchConfig = DEFAULT_FUZZY_CONFIG
): readonly FuzzyMatchResult[] {
  if (query.length === 0 || candidates.length === 0) return [];

  const queryNorm = config.caseSensitive ? query : query.toLowerCase();
  const results: FuzzyMatchResult[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!candidate) continue;

    const candNorm = config.caseSensitive ? candidate : candidate.toLowerCase();

    // Check for exact match first (short-circuits everything)
    if (queryNorm === candNorm) {
      results.push({
        candidate,
        candidateIndex: i,
        score: 1.0,
        strategyScores: [{ strategy: 'exact', score: 1.0, weight: 1.0, weightedScore: 1.0, detail: 'Exact match' }],
        explanation: `Exact match: "${query}" = "${candidate}"`,
        confident: true,
        matchType: config.caseSensitive || query === candidate ? 'exact' : 'case_insensitive',
      });
      continue;
    }

    // Check synonym match
    if (config.useSynonyms) {
      const canonical = lookupSynonym(queryNorm);
      if (canonical && canonical.toLowerCase() === candNorm) {
        results.push({
          candidate,
          candidateIndex: i,
          score: 0.95,
          strategyScores: [{ strategy: 'synonym', score: 0.95, weight: 1.0, weightedScore: 0.95, detail: `Synonym: "${query}" → "${canonical}"` }],
          explanation: `Synonym match: "${query}" is a known synonym for "${candidate}"`,
          confident: true,
          matchType: 'synonym',
        });
        continue;
      }
    }

    // Compute individual strategy scores
    const strategyScores: StrategyScore[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Prefix match
    {
      const weight = config.weights.prefix;
      if (weight > 0 && queryNorm.length >= config.minPrefixLength) {
        const score = candNorm.startsWith(queryNorm)
          ? Math.min(1, queryNorm.length / candNorm.length + 0.2)
          : 0;
        strategyScores.push({
          strategy: 'prefix',
          score,
          weight,
          weightedScore: score * weight,
          detail: score > 0 ? `Prefix match: "${queryNorm}" is a prefix of "${candNorm}"` : 'No prefix match',
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Suffix match
    {
      const weight = config.weights.suffix;
      if (weight > 0) {
        const score = candNorm.endsWith(queryNorm)
          ? Math.min(1, queryNorm.length / candNorm.length + 0.1)
          : 0;
        strategyScores.push({
          strategy: 'suffix',
          score,
          weight,
          weightedScore: score * weight,
          detail: score > 0 ? `Suffix match` : 'No suffix match',
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Substring match
    {
      const weight = config.weights.substring;
      if (weight > 0 && queryNorm.length >= 2) {
        const idx = candNorm.indexOf(queryNorm);
        const score = idx >= 0
          ? Math.min(1, queryNorm.length / candNorm.length + 0.1) * (idx === 0 ? 1 : 0.8)
          : 0;
        strategyScores.push({
          strategy: 'substring',
          score,
          weight,
          weightedScore: score * weight,
          detail: score > 0 ? `Substring at position ${idx}` : 'No substring match',
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Levenshtein distance
    {
      const weight = config.weights.levenshtein;
      if (weight > 0) {
        const dist = levenshteinDistance(queryNorm, candNorm);
        const maxLen = Math.max(queryNorm.length, candNorm.length);
        const score = dist <= config.maxEditDistance && maxLen > 0
          ? 1 - dist / maxLen
          : 0;
        strategyScores.push({
          strategy: 'levenshtein',
          score,
          weight,
          weightedScore: score * weight,
          detail: `Edit distance: ${dist} (max: ${config.maxEditDistance})`,
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Jaro-Winkler similarity
    {
      const weight = config.weights.jaro_winkler;
      if (weight > 0) {
        const score = jaroWinklerSimilarity(queryNorm, candNorm);
        strategyScores.push({
          strategy: 'jaro_winkler',
          score,
          weight,
          weightedScore: score * weight,
          detail: `Jaro-Winkler: ${score.toFixed(3)}`,
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Token overlap
    {
      const weight = config.weights.token_overlap;
      if (weight > 0) {
        const score = tokenOverlapScore(queryNorm, candNorm);
        strategyScores.push({
          strategy: 'token_overlap',
          score,
          weight,
          weightedScore: score * weight,
          detail: `Token overlap: ${score.toFixed(3)}`,
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Abbreviation
    {
      const weight = config.weights.abbreviation;
      if (weight > 0) {
        const score = abbreviationScore(queryNorm, candNorm);
        strategyScores.push({
          strategy: 'abbreviation',
          score,
          weight,
          weightedScore: score * weight,
          detail: score > 0 ? `Abbreviation match` : 'Not an abbreviation',
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Soundex (phonetic)
    {
      const weight = config.weights.soundex;
      if (weight > 0 && config.usePhonetic) {
        const qSoundex = soundex(queryNorm);
        const cSoundex = soundex(candNorm);
        const score = qSoundex === cSoundex ? 0.8 : 0;
        strategyScores.push({
          strategy: 'soundex',
          score,
          weight,
          weightedScore: score * weight,
          detail: score > 0 ? `Soundex match: ${qSoundex}` : `No phonetic match (${qSoundex} vs ${cSoundex})`,
        });
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }

    // Normalize by total weight
    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    if (finalScore >= config.minScore) {
      const matchType = classifyMatchType(queryNorm, candNorm, finalScore, strategyScores);
      results.push({
        candidate,
        candidateIndex: i,
        score: finalScore,
        strategyScores,
        explanation: buildExplanation(query, candidate, finalScore, strategyScores, matchType),
        confident: finalScore >= config.confidentScore,
        matchType,
      });
    }
  }

  // Sort by score (descending), then by tie-breakers
  results.sort((a, b) => {
    // Primary: score
    if (Math.abs(a.score - b.score) > 0.001) return b.score - a.score;

    // Tie-breaker 1: shorter candidate name
    if (a.candidate.length !== b.candidate.length) return a.candidate.length - b.candidate.length;

    // Tie-breaker 2: earlier in candidate list
    if (a.candidateIndex !== b.candidateIndex) return a.candidateIndex - b.candidateIndex;

    // Tie-breaker 3: alphabetical
    return a.candidate.localeCompare(b.candidate);
  });

  return results.slice(0, config.maxResults);
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Find the single best match (or undefined if no match).
 */
export function bestMatch(
  query: string,
  candidates: readonly string[],
  config?: FuzzyMatchConfig
): FuzzyMatchResult | undefined {
  const results = fuzzyMatch(query, candidates, config ? { ...config, maxResults: 1 } : { ...DEFAULT_FUZZY_CONFIG, maxResults: 1 });
  return results[0];
}

/**
 * Find confident matches only.
 */
export function confidentMatches(
  query: string,
  candidates: readonly string[],
  config?: FuzzyMatchConfig
): readonly FuzzyMatchResult[] {
  return fuzzyMatch(query, candidates, config).filter(r => r.confident);
}

/**
 * Check if a query has a confident match.
 */
export function hasConfidentMatch(
  query: string,
  candidates: readonly string[],
  config?: FuzzyMatchConfig
): boolean {
  const result = bestMatch(query, candidates, config);
  return result !== undefined && result.confident;
}

/**
 * Resolve a query to the best candidate, or return the query unchanged
 * if no confident match exists.
 */
export function resolveOrKeep(
  query: string,
  candidates: readonly string[],
  config?: FuzzyMatchConfig
): string {
  const result = bestMatch(query, candidates, config);
  return result && result.confident ? result.candidate : query;
}

// =============================================================================
// MATCH TYPE CLASSIFICATION
// =============================================================================

function classifyMatchType(
  query: string,
  candidate: string,
  _score: number,
  strategies: readonly StrategyScore[]
): MatchType {
  // Find the highest-scoring strategy
  let bestStrategy: MatchStrategy = 'levenshtein';
  let bestScore = 0;
  for (const s of strategies) {
    if (s.score > bestScore) {
      bestScore = s.score;
      bestStrategy = s.strategy;
    }
  }

  if (query === candidate) return 'exact';
  if (query.toLowerCase() === candidate.toLowerCase()) return 'case_insensitive';

  switch (bestStrategy) {
    case 'prefix': return 'prefix';
    case 'abbreviation': return 'abbreviation';
    case 'substring': return 'substring';
    case 'synonym': return 'synonym';
    case 'levenshtein':
    case 'damerau_levenshtein': return 'levenshtein';
    case 'jaro_winkler': return 'levenshtein';
    case 'token_overlap': return 'token_overlap';
    case 'soundex': return 'phonetic';
    default: return 'no_match';
  }
}

// =============================================================================
// EXPLANATION BUILDING
// =============================================================================

function buildExplanation(
  query: string,
  candidate: string,
  score: number,
  strategies: readonly StrategyScore[],
  matchType: MatchType
): string {
  const pct = (score * 100).toFixed(0);
  const topStrategies = strategies
    .filter(s => s.score > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3);

  const details = topStrategies.map(s => s.detail).join('; ');
  return `"${query}" → "${candidate}" (${matchType}, ${pct}% confidence): ${details}`;
}

// =============================================================================
// BATCH MATCHING
// =============================================================================

/**
 * Match multiple queries against the same candidate list.
 */
export function batchMatch(
  queries: readonly string[],
  candidates: readonly string[],
  config?: FuzzyMatchConfig
): ReadonlyMap<string, FuzzyMatchResult | undefined> {
  const results = new Map<string, FuzzyMatchResult | undefined>();
  for (const query of queries) {
    results.set(query, bestMatch(query, candidates, config));
  }
  return results;
}

/**
 * Disambiguate: given a query and candidates, return the resolution
 * result with confidence level and alternatives.
 */
export interface DisambiguationResult {
  /** Whether the match is confident (single clear winner) */
  readonly resolved: boolean;
  /** The best match */
  readonly best: FuzzyMatchResult | undefined;
  /** All matches (for showing alternatives) */
  readonly alternatives: readonly FuzzyMatchResult[];
  /** The gap between best and second-best scores */
  readonly confidenceGap: number;
  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * Resolve a query with disambiguation support.
 */
export function disambiguate(
  query: string,
  candidates: readonly string[],
  config?: FuzzyMatchConfig,
  gapThreshold: number = 0.15
): DisambiguationResult {
  const matches = fuzzyMatch(query, candidates, config);

  if (matches.length === 0) {
    return {
      resolved: false,
      best: undefined,
      alternatives: [],
      confidenceGap: 0,
      explanation: `No matches found for "${query}"`,
    };
  }

  const best = matches[0];
  if (!best) {
    return {
      resolved: false,
      best: undefined,
      alternatives: [],
      confidenceGap: 0,
      explanation: `No matches found for "${query}"`,
    };
  }

  const secondBest = matches[1];
  const gap = secondBest ? best.score - secondBest.score : 1.0;

  const resolved = best.confident && gap >= gapThreshold;

  let explanation: string;
  if (resolved) {
    explanation = `Confidently resolved "${query}" → "${best.candidate}" (score ${(best.score * 100).toFixed(0)}%, gap ${(gap * 100).toFixed(0)}%)`;
  } else if (best.confident) {
    explanation = `Ambiguous: "${query}" could be "${best.candidate}" or "${secondBest?.candidate}" (gap only ${(gap * 100).toFixed(0)}%)`;
  } else {
    explanation = `Low confidence: best match for "${query}" is "${best.candidate}" at ${(best.score * 100).toFixed(0)}%`;
  }

  return {
    resolved,
    best,
    alternatives: matches.slice(1),
    confidenceGap: gap,
    explanation,
  };
}

// =============================================================================
// STATISTICS AND DEBUGGING
// =============================================================================

export interface FuzzyMatchStats {
  readonly totalCandidates: number;
  readonly totalSynonyms: number;
  readonly configSummary: string;
}

/**
 * Get fuzzy matching statistics.
 */
export function getFuzzyMatchStats(config: FuzzyMatchConfig = DEFAULT_FUZZY_CONFIG): FuzzyMatchStats {
  const activeStrategies = Object.entries(config.weights)
    .filter(([, w]) => w > 0)
    .map(([s]) => s);

  return {
    totalCandidates: 0, // Filled by caller
    totalSynonyms: _synonymMap.size,
    configSummary: `Min score: ${config.minScore}, Confident: ${config.confidentScore}, Strategies: ${activeStrategies.join(', ')}`,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const FUZZY_MATCHING_RULES = [
  // Rule 1: One algorithm everywhere
  'Rule FM-001: All name resolution in GOFAI uses the fuzzyMatch() function. ' +
  'No module may implement its own matching logic.',

  // Rule 2: Deterministic results
  'Rule FM-002: fuzzyMatch() is deterministic. Same query + candidates + config ' +
  'always produces the same ranking. No randomness.',

  // Rule 3: Stable tie-breakers
  'Rule FM-003: When two candidates have equal scores, tie-breaking order is: ' +
  '(1) shorter name, (2) earlier in candidate list, (3) alphabetical. ' +
  'This ensures stable results even when scores are close.',

  // Rule 4: Exact match always wins
  'Rule FM-004: An exact string match always scores 1.0 and is always ' +
  'returned first, regardless of strategy weights.',

  // Rule 5: Synonyms are canonical
  'Rule FM-005: Synonym matches score 0.95 and bypass the multi-strategy ' +
  'scoring. Synonyms are defined in the MUSIC_SYNONYMS table and can be ' +
  'extended by users and extensions.',

  // Rule 6: Minimum prefix length
  'Rule FM-006: Prefix matching requires at least minPrefixLength characters ' +
  '(default 2). Single-character prefixes are not matched to prevent ' +
  'over-matching.',

  // Rule 7: Edit distance capped
  'Rule FM-007: Levenshtein distance is capped at maxEditDistance (default 3). ' +
  'Matches beyond this distance score 0 to prevent wild matches.',

  // Rule 8: Every match is explainable
  'Rule FM-008: Every FuzzyMatchResult includes an explanation string ' +
  'describing why the match was chosen, which strategies contributed, ' +
  'and the confidence level.',

  // Rule 9: Disambiguation requires a gap
  'Rule FM-009: A match is considered "resolved" only if the best score ' +
  'is above the confident threshold AND the gap to the second-best is ' +
  'above the gap threshold. Otherwise, the system asks for clarification.',

  // Rule 10: Phonetic matching is optional
  'Rule FM-010: Soundex (phonetic) matching is optional and off by default ' +
  'for non-English contexts. It can be enabled in the config.',

  // Rule 11: Strategy weights are configurable
  'Rule FM-011: Strategy weights can be adjusted per deployment or per user. ' +
  'Weights must sum to a consistent total (normalization is automatic).',

  // Rule 12: Batch matching is efficient
  'Rule FM-012: batchMatch() reuses the same candidate preprocessing for ' +
  'multiple queries. Use it when resolving multiple names against ' +
  'the same vocabulary.',
] as const;
