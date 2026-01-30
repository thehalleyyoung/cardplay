/**
 * GOFAI NL Grammar — User-Defined Names (Quoted Referents)
 *
 * Implements grammar rules for explicit user-defined names that
 * support quoted referents. Users assign names to tracks, sections,
 * presets, and other entities. These names appear in natural language
 * as quoted strings or with naming verbs.
 *
 * ## Naming Patterns
 *
 * 1. **Quoted names**: "the 'Glass Pad' track", "'Verse 2A'"
 * 2. **Called/named pattern**: "the track called 'Glass Pad'"
 * 3. **Labelled pattern**: "the section labelled 'Drop'"
 * 4. **Titled pattern**: "the preset titled 'Warm Reverb'"
 * 5. **Bare names**: "Glass Pad" (unquoted, matched by name index)
 * 6. **Naming commands**: "call this 'My Chorus'", "name it 'Bass V2'"
 * 7. **Renaming**: "rename 'Old Name' to 'New Name'"
 * 8. **Name references**: "the one called 'X'", "anything named 'Y'"
 *
 * ## Quote Handling
 *
 * The tokenizer should already handle quote extraction (Step 101),
 * but this module defines the grammar-level treatment:
 * - Single quotes: 'Glass Pad'
 * - Double quotes: "Glass Pad"
 * - Smart quotes: 'Glass Pad' / "Glass Pad"
 * - Backticks: `Glass Pad`
 * - No quotes: Glass Pad (when preceded by naming keyword)
 *
 * ## Resolution
 *
 * Named references resolve deterministically by exact name match
 * against the project symbol table. If no match is found, the system
 * suggests close matches using fuzzy matching (Step 085).
 *
 * ## Safety
 *
 * Quoted names bind with highest priority — they override salience,
 * recency, and all other resolution strategies. If the name doesn't
 * exist, it must fail with a clear error (never fall back to a
 * different entity silently).
 *
 * @module gofai/nl/grammar/user-defined-names
 * @see gofai_goalA.md Step 120
 * @see gofai_goalA.md Step 186 (quoted programmatic references)
 * @see gofai_goalA.md Step 085 (fuzzy matching)
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// NAMED REFERENCE — output of name parsing
// =============================================================================

/**
 * A parsed named reference: an entity identified by a user-given name.
 */
export interface NamedReference {
  /** Unique ID for tracking */
  readonly refId: string;

  /** The user-defined name (without quotes) */
  readonly name: string;

  /** The original surface form (with quotes if present) */
  readonly surface: string;

  /** The type of name reference */
  readonly type: NameReferenceType;

  /** The quoting style used */
  readonly quoteStyle: QuoteStyle;

  /** The entity type constraint (if specified by context) */
  readonly entityTypeHint: string | undefined;

  /** The entity type keyword used (e.g., "track", "section") */
  readonly entityKeyword: string | undefined;

  /** The naming verb used (e.g., "called", "named") */
  readonly namingVerb: string | undefined;

  /** Span in the input */
  readonly span: Span;

  /** Resolution strategy: exact match, then fuzzy */
  readonly resolutionStrategy: NameResolutionStrategy;

  /** Confidence in the parse */
  readonly confidence: number;

  /** Warnings */
  readonly warnings: readonly NameWarning[];
}

// =============================================================================
// NAME REFERENCE TYPES
// =============================================================================

/**
 * Types of name references.
 */
export type NameReferenceType =
  | 'quoted_standalone'    // "'Glass Pad'" (just the quoted name)
  | 'quoted_with_type'     // "the 'Glass Pad' track"
  | 'called_pattern'       // "the track called 'Glass Pad'"
  | 'named_pattern'        // "the section named 'Drop'"
  | 'labelled_pattern'     // "the preset labelled 'Warm'"
  | 'titled_pattern'       // "the preset titled 'Warm Reverb'"
  | 'naming_command'       // "call this 'My Chorus'" (creating a name)
  | 'renaming_command'     // "rename 'Old' to 'New'" (changing a name)
  | 'bare_name'            // "Glass Pad" (unquoted, identified by context)
  | 'tagged_reference';    // "#intro" or "@bass" (tag-style references)

/**
 * Quote styles.
 */
export type QuoteStyle =
  | 'single'       // 'name'
  | 'double'       // "name"
  | 'smart_single' // \u2018name\u2019
  | 'smart_double' // \u201cname\u201d
  | 'backtick'     // `name`
  | 'none';        // unquoted

/**
 * How to resolve a named reference.
 */
export type NameResolutionStrategy =
  | 'exact_match'          // Must match exactly (for quoted names)
  | 'case_insensitive'     // Match ignoring case
  | 'fuzzy_match'          // Allow close matches (for bare names)
  | 'prefix_match'         // Match by prefix ("Glass" → "Glass Pad")
  | 'tag_match';           // Match by tag (#intro)

// =============================================================================
// NAME WARNINGS
// =============================================================================

/**
 * Warning about a name parse.
 */
export interface NameWarning {
  readonly code: NameWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes for name parsing.
 */
export type NameWarningCode =
  | 'name_not_found'           // No entity with this name exists
  | 'multiple_matches'         // Multiple entities share this name
  | 'ambiguous_bare_name'      // Unquoted name could be a regular word
  | 'unclosed_quote'           // Opening quote without closing
  | 'empty_name'               // Empty string as name
  | 'reserved_name'            // Name conflicts with a keyword
  | 'name_too_long'            // Name exceeds reasonable length
  | 'special_characters'       // Name contains unusual characters
  | 'renaming_source_missing'  // Source name in rename doesn't exist
  | 'fuzzy_match_used';        // Exact match failed; fuzzy match proposed

// =============================================================================
// NAMING VERB LEXICON
// =============================================================================

/**
 * A naming verb entry.
 */
export interface NamingVerbEntry {
  /** Surface forms */
  readonly forms: readonly string[];

  /** What kind of naming operation */
  readonly operation: NamingOperation;

  /** The preposition that introduces the name (if any) */
  readonly namePreposition: string | undefined;

  /** Whether this verb creates a new name or references an existing one */
  readonly createsName: boolean;

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;

  /** Priority */
  readonly priority: number;
}

/**
 * Naming operations.
 */
export type NamingOperation =
  | 'reference_by_name'   // "the track called X" — look up by name
  | 'assign_name'         // "call this X" — create a name
  | 'rename'              // "rename X to Y" — change a name
  | 'remove_name'         // "unlabel X" — remove a name
  | 'search_by_name';     // "find X" — search by name

/**
 * All recognized naming verbs.
 */
export const NAMING_VERB_ENTRIES: readonly NamingVerbEntry[] = [
  // --- Reference by name ---
  {
    forms: ['called', 'named', 'labelled', 'labeled', 'titled', 'known as'],
    operation: 'reference_by_name',
    namePreposition: undefined,
    createsName: false,
    examples: ["the track called 'Glass Pad'", "the section named 'Drop'", "the preset labelled 'Warm'"],
    description: 'Reference an entity by its user-assigned name',
    priority: 15,
  },
  {
    forms: ['with the name', 'by the name of', 'with name'],
    operation: 'reference_by_name',
    namePreposition: undefined,
    createsName: false,
    examples: ["the track with the name 'Glass Pad'"],
    description: 'Reference by name using prepositional phrase',
    priority: 12,
  },

  // --- Assign name ---
  {
    forms: ['call', 'name', 'label', 'title', 'tag'],
    operation: 'assign_name',
    namePreposition: undefined,
    createsName: true,
    examples: ["call this 'My Chorus'", "name it 'Bass V2'", "label this section 'Drop'"],
    description: 'Assign a name to an entity',
    priority: 14,
  },
  {
    forms: ['call it', 'name it', 'label it', 'tag it'],
    operation: 'assign_name',
    namePreposition: undefined,
    createsName: true,
    examples: ["call it 'My Chorus'", "name it 'Bass V2'"],
    description: 'Assign a name to the salient entity',
    priority: 16,
  },
  {
    forms: ['mark as', 'mark it as'],
    operation: 'assign_name',
    namePreposition: 'as',
    createsName: true,
    examples: ["mark as 'Intro'", "mark it as 'Final Version'"],
    description: 'Mark with a label',
    priority: 12,
  },
  {
    forms: ['save as', 'save it as'],
    operation: 'assign_name',
    namePreposition: 'as',
    createsName: true,
    examples: ["save as 'My Preset'", "save it as 'Warm Reverb V2'"],
    description: 'Save with a name',
    priority: 14,
  },

  // --- Rename ---
  {
    forms: ['rename', 'relabel', 'retitle'],
    operation: 'rename',
    namePreposition: 'to',
    createsName: true,
    examples: ["rename 'Old Name' to 'New Name'", "relabel the track to 'Bass V3'"],
    description: 'Change the name of an entity',
    priority: 15,
  },
  {
    forms: ['change the name of', 'change its name to'],
    operation: 'rename',
    namePreposition: 'to',
    createsName: true,
    examples: ["change the name of 'Chorus' to 'Chorus 2'"],
    description: 'Change name using explicit phrasing',
    priority: 13,
  },

  // --- Remove name ---
  {
    forms: ['unlabel', 'untag', 'remove the name from', 'clear the name of'],
    operation: 'remove_name',
    namePreposition: undefined,
    createsName: false,
    examples: ['unlabel this section', 'remove the name from this track'],
    description: 'Remove a name/label from an entity',
    priority: 10,
  },

  // --- Search by name ---
  {
    forms: ['find', 'search for', 'look for', 'locate'],
    operation: 'search_by_name',
    namePreposition: undefined,
    createsName: false,
    examples: ["find 'Glass Pad'", "search for 'Chorus 2'", "locate the 'Drop' section"],
    description: 'Search for an entity by name',
    priority: 12,
  },
  {
    forms: ['go to', 'jump to', 'navigate to'],
    operation: 'search_by_name',
    namePreposition: undefined,
    createsName: false,
    examples: ["go to 'Chorus 2'", "jump to 'Drop'"],
    description: 'Navigate to a named entity',
    priority: 12,
  },
];

// =============================================================================
// ENTITY TYPE KEYWORDS — words that indicate entity type for named references
// =============================================================================

/**
 * Keywords that specify what entity type a name refers to.
 */
export interface EntityTypeKeyword {
  /** Surface forms */
  readonly forms: readonly string[];

  /** The entity type */
  readonly entityType: string;

  /** Priority */
  readonly priority: number;
}

/**
 * All recognized entity type keywords for named references.
 */
export const ENTITY_TYPE_KEYWORDS: readonly EntityTypeKeyword[] = [
  { forms: ['track', 'tracks'], entityType: 'track', priority: 12 },
  { forms: ['layer', 'layers'], entityType: 'layer', priority: 12 },
  { forms: ['section', 'sections', 'part', 'parts'], entityType: 'section', priority: 12 },
  { forms: ['card', 'cards'], entityType: 'card', priority: 12 },
  { forms: ['preset', 'presets', 'patch', 'patches'], entityType: 'preset', priority: 12 },
  { forms: ['effect', 'effects', 'fx'], entityType: 'effect', priority: 12 },
  { forms: ['instrument', 'instruments'], entityType: 'instrument', priority: 12 },
  { forms: ['board', 'boards'], entityType: 'board', priority: 10 },
  { forms: ['deck', 'decks'], entityType: 'deck', priority: 10 },
  { forms: ['bus', 'buses', 'buss', 'busses'], entityType: 'bus', priority: 10 },
  { forms: ['channel', 'channels'], entityType: 'channel', priority: 10 },
  { forms: ['group', 'groups'], entityType: 'group', priority: 10 },
  { forms: ['pattern', 'patterns'], entityType: 'pattern', priority: 10 },
  { forms: ['clip', 'clips', 'region', 'regions'], entityType: 'clip', priority: 10 },
  { forms: ['marker', 'markers'], entityType: 'marker', priority: 10 },
  { forms: ['bookmark', 'bookmarks'], entityType: 'bookmark', priority: 10 },
  { forms: ['version', 'versions', 'snapshot', 'snapshots'], entityType: 'version', priority: 10 },
  { forms: ['template', 'templates'], entityType: 'template', priority: 10 },
];

// =============================================================================
// QUOTE DETECTION — finding quoted strings in token sequences
// =============================================================================

/**
 * Quote characters recognized.
 */
export const QUOTE_CHARS: Record<string, { close: string; style: QuoteStyle }> = {
  "'": { close: "'", style: 'single' },
  '"': { close: '"', style: 'double' },
  '\u2018': { close: '\u2019', style: 'smart_single' },
  '\u201c': { close: '\u201d', style: 'smart_double' },
  '`': { close: '`', style: 'backtick' },
};

/**
 * A detected quoted string in the input.
 */
export interface DetectedQuote {
  /** Token index where the quote starts (including opening quote) */
  readonly startTokenIndex: number;

  /** Token index where the quote ends (including closing quote, exclusive) */
  readonly endTokenIndex: number;

  /** The quoted content (without quotes) */
  readonly content: string;

  /** The quote style */
  readonly style: QuoteStyle;

  /** The full surface text (with quotes) */
  readonly surface: string;
}

/**
 * Scan for quoted strings in a token sequence.
 *
 * This handles both tokens-that-are-entire-quotes and quotes
 * that span multiple tokens. The tokenizer may already have
 * identified quote tokens (QUOTE type), but this provides
 * grammar-level handling.
 */
export function scanForQuotedStrings(words: readonly string[]): readonly DetectedQuote[] {
  const quotes: DetectedQuote[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;

    // Check if this token starts with a quote character
    const firstChar = word.charAt(0);
    const quoteInfo = QUOTE_CHARS[firstChar];

    if (quoteInfo) {
      // Case 1: Entire quoted string in one token ('name' or "name")
      const lastChar = word.charAt(word.length - 1);
      if (word.length > 1 && lastChar === quoteInfo.close) {
        quotes.push({
          startTokenIndex: i,
          endTokenIndex: i + 1,
          content: word.slice(1, -1),
          style: quoteInfo.style,
          surface: word,
        });
        continue;
      }

      // Case 2: Quote spans multiple tokens
      // Find closing quote
      let closeIdx = -1;
      for (let j = i + 1; j < words.length; j++) {
        const w = words[j]!;
        if (w.endsWith(quoteInfo.close) || w === quoteInfo.close) {
          closeIdx = j;
          break;
        }
      }

      if (closeIdx !== -1) {
        // Extract content between quotes
        const parts: string[] = [];
        // First token (strip opening quote)
        parts.push(word.slice(1));
        // Middle tokens
        for (let j = i + 1; j < closeIdx; j++) {
          parts.push(words[j]!);
        }
        // Last token (strip closing quote)
        const lastToken = words[closeIdx]!;
        if (lastToken !== quoteInfo.close) {
          parts.push(lastToken.slice(0, -1));
        }

        const content = parts.join(' ').trim();
        const surface = words.slice(i, closeIdx + 1).join(' ');

        quotes.push({
          startTokenIndex: i,
          endTokenIndex: closeIdx + 1,
          content,
          style: quoteInfo.style,
          surface,
        });

        // Skip past the quoted string
        i = closeIdx;
      }
    }
  }

  return quotes;
}

// =============================================================================
// NAMING VERB LOOKUP INDEX
// =============================================================================

/**
 * Index: surface form → naming verb entries.
 */
const namingVerbIndex: ReadonlyMap<string, readonly NamingVerbEntry[]> = (() => {
  const index = new Map<string, NamingVerbEntry[]>();
  for (const entry of NAMING_VERB_ENTRIES) {
    for (const form of entry.forms) {
      const lower = form.toLowerCase();
      const existing = index.get(lower);
      if (existing) {
        existing.push(entry);
      } else {
        index.set(lower, [entry]);
      }
    }
  }
  for (const entries of index.values()) {
    entries.sort((a, b) => b.priority - a.priority);
  }
  return index;
})();

/**
 * Entity type keyword index.
 */
const entityTypeKeywordIndex: ReadonlyMap<string, EntityTypeKeyword> = (() => {
  const index = new Map<string, EntityTypeKeyword>();
  for (const entry of ENTITY_TYPE_KEYWORDS) {
    for (const form of entry.forms) {
      index.set(form.toLowerCase(), entry);
    }
  }
  return index;
})();

/**
 * Look up a naming verb by surface form.
 */
export function lookupNamingVerb(form: string): readonly NamingVerbEntry[] {
  return namingVerbIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Look up an entity type keyword.
 */
export function lookupEntityTypeKeyword(word: string): EntityTypeKeyword | undefined {
  return entityTypeKeywordIndex.get(word.toLowerCase());
}

/**
 * Check if a word is a known naming verb.
 */
export function isNamingVerb(word: string): boolean {
  return namingVerbIndex.has(word.toLowerCase());
}

/**
 * Check if a word is an entity type keyword.
 */
export function isEntityTypeKeyword(word: string): boolean {
  return entityTypeKeywordIndex.has(word.toLowerCase());
}

// =============================================================================
// NAME REFERENCE SCANNING
// =============================================================================

/**
 * Result of scanning for named references.
 */
export interface NameScan {
  /** Detected named references */
  readonly namedRefs: readonly DetectedNameRef[];

  /** Detected quoted strings */
  readonly quotes: readonly DetectedQuote[];

  /** Whether any named references were found */
  readonly hasNamedRefs: boolean;

  /** Whether any naming commands were found */
  readonly hasNamingCommands: boolean;
}

/**
 * A detected named reference in the input.
 */
export interface DetectedNameRef {
  /** Token index where the reference starts */
  readonly startTokenIndex: number;

  /** Token index where the reference ends (exclusive) */
  readonly endTokenIndex: number;

  /** The name (without quotes) */
  readonly name: string;

  /** The reference type */
  readonly type: NameReferenceType;

  /** The quote style */
  readonly quoteStyle: QuoteStyle;

  /** The entity type hint (if any) */
  readonly entityTypeHint: string | undefined;

  /** The entity type keyword */
  readonly entityKeyword: string | undefined;

  /** The naming verb */
  readonly namingVerb: string | undefined;

  /** Surface text */
  readonly surface: string;

  /** Confidence */
  readonly confidence: number;
}

/**
 * Scan for named references in a token sequence.
 *
 * This detects patterns like:
 * - Quoted strings: "'Glass Pad'"
 * - "the 'Glass Pad' track" → quoted_with_type
 * - "the track called 'Glass Pad'" → called_pattern
 * - "call this 'My Chorus'" → naming_command
 * - "rename 'Old' to 'New'" → renaming_command
 */
export function scanForNamedReferences(words: readonly string[]): NameScan {
  const quotes = scanForQuotedStrings(words);
  const namedRefs: DetectedNameRef[] = [];
  let hasNamingCommands = false;

  for (const quote of quotes) {
    let type: NameReferenceType = 'quoted_standalone';
    let entityTypeHint: string | undefined;
    let entityKeyword: string | undefined;
    let namingVerb: string | undefined;
    let startIdx = quote.startTokenIndex;
    let endIdx = quote.endTokenIndex;
    let confidence = 0.8;

    // Check what comes before the quote
    const beforeTokens: string[] = [];
    for (let j = Math.max(0, quote.startTokenIndex - 4); j < quote.startTokenIndex; j++) {
      beforeTokens.push(words[j]!.toLowerCase());
    }
    const beforeText = beforeTokens.join(' ');

    // Check what comes after the quote
    const afterWord = quote.endTokenIndex < words.length
      ? words[quote.endTokenIndex]!.toLowerCase()
      : undefined;

    // Pattern: "the ENTITY called/named/labelled 'NAME'"
    for (const nv of NAMING_VERB_ENTRIES) {
      if (nv.operation !== 'reference_by_name') continue;
      for (const form of nv.forms) {
        if (beforeText.endsWith(form.toLowerCase())) {
          type = form.includes('called') ? 'called_pattern'
            : form.includes('named') ? 'named_pattern'
            : form.includes('label') ? 'labelled_pattern'
            : form.includes('title') ? 'titled_pattern'
            : 'called_pattern';
          namingVerb = form;
          confidence = 0.9;

          // Look for entity type before naming verb
          for (let k = 0; k < beforeTokens.length - 1; k++) {
            const etk = lookupEntityTypeKeyword(beforeTokens[k]!);
            if (etk) {
              entityTypeHint = etk.entityType;
              entityKeyword = beforeTokens[k];
              startIdx = quote.startTokenIndex - (beforeTokens.length - k);
              break;
            }
          }
          break;
        }
      }
      if (namingVerb) break;
    }

    // Pattern: "the 'NAME' track"
    if (!namingVerb && afterWord) {
      const etk = lookupEntityTypeKeyword(afterWord);
      if (etk) {
        type = 'quoted_with_type';
        entityTypeHint = etk.entityType;
        entityKeyword = afterWord;
        endIdx = quote.endTokenIndex + 1;
        confidence = 0.85;
      }
    }

    // Pattern: "the 'NAME' track" with "the" before
    if (type === 'quoted_with_type' && beforeTokens.length > 0) {
      const lastBefore = beforeTokens[beforeTokens.length - 1];
      if (lastBefore === 'the' || lastBefore === 'a' || lastBefore === 'an') {
        startIdx = quote.startTokenIndex - 1;
      }
    }

    // Pattern: naming commands — "call this 'NAME'", "name it 'NAME'"
    if (!namingVerb) {
      for (const nv of NAMING_VERB_ENTRIES) {
        if (nv.operation !== 'assign_name') continue;
        for (const form of nv.forms) {
          if (beforeText.endsWith(form.toLowerCase())) {
            type = 'naming_command';
            namingVerb = form;
            hasNamingCommands = true;
            confidence = 0.9;
            break;
          }
        }
        if (namingVerb) break;
      }
    }

    // Pattern: rename command — "rename 'OLD' to 'NEW'"
    if (!namingVerb) {
      for (const nv of NAMING_VERB_ENTRIES) {
        if (nv.operation !== 'rename') continue;
        for (const form of nv.forms) {
          if (beforeText.includes(form.toLowerCase())) {
            type = 'renaming_command';
            namingVerb = form;
            hasNamingCommands = true;
            confidence = 0.85;
            break;
          }
        }
        if (namingVerb) break;
      }
    }

    namedRefs.push({
      startTokenIndex: startIdx,
      endTokenIndex: endIdx,
      name: quote.content,
      type,
      quoteStyle: quote.style,
      entityTypeHint,
      entityKeyword,
      namingVerb,
      surface: words.slice(startIdx, endIdx).join(' '),
      confidence,
    });
  }

  return {
    namedRefs,
    quotes,
    hasNamedRefs: namedRefs.length > 0,
    hasNamingCommands,
  };
}

// =============================================================================
// NAMED REFERENCE BUILDER
// =============================================================================

let nameRefIdCounter = 0;

/**
 * Reset the name ref ID counter (for testing).
 */
export function resetNameRefIdCounter(): void {
  nameRefIdCounter = 0;
}

/**
 * Build a NamedReference from a DetectedNameRef.
 */
export function buildNamedReference(
  detected: DetectedNameRef,
  inputSpan: Span,
): NamedReference {
  const refId = `name-ref-${++nameRefIdCounter}`;
  const warnings: NameWarning[] = [];

  // Empty name warning
  if (detected.name.trim().length === 0) {
    warnings.push({
      code: 'empty_name',
      message: 'Empty quoted name',
      span: inputSpan,
    });
  }

  // Very long name warning
  if (detected.name.length > 100) {
    warnings.push({
      code: 'name_too_long',
      message: `Name "${detected.name.slice(0, 30)}..." is unusually long`,
      span: inputSpan,
    });
  }

  // Determine resolution strategy
  let resolutionStrategy: NameResolutionStrategy = 'exact_match';
  if (detected.quoteStyle === 'none') {
    resolutionStrategy = 'fuzzy_match';
  } else if (detected.type === 'tagged_reference') {
    resolutionStrategy = 'tag_match';
  }

  return {
    refId,
    name: detected.name,
    surface: detected.surface,
    type: detected.type,
    quoteStyle: detected.quoteStyle,
    entityTypeHint: detected.entityTypeHint,
    entityKeyword: detected.entityKeyword,
    namingVerb: detected.namingVerb,
    span: inputSpan,
    resolutionStrategy,
    confidence: detected.confidence,
    warnings,
  };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a NamedReference for display.
 */
export function formatNamedReference(ref: NamedReference): string {
  const lines: string[] = [];
  lines.push(`[${ref.refId}] ${ref.type}: "${ref.name}"`);
  lines.push(`  Surface: "${ref.surface}"`);
  lines.push(`  Quote style: ${ref.quoteStyle}`);
  lines.push(`  Resolution: ${ref.resolutionStrategy}`);
  if (ref.entityTypeHint) {
    lines.push(`  Entity type: ${ref.entityTypeHint}`);
  }
  if (ref.entityKeyword) {
    lines.push(`  Entity keyword: ${ref.entityKeyword}`);
  }
  if (ref.namingVerb) {
    lines.push(`  Naming verb: ${ref.namingVerb}`);
  }
  lines.push(`  Confidence: ${(ref.confidence * 100).toFixed(0)}%`);
  for (const w of ref.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }
  return lines.join('\n');
}

/**
 * Format a NameScan for display.
 */
export function formatNameScan(scan: NameScan): string {
  if (!scan.hasNamedRefs) return 'No named references detected.';

  const lines: string[] = [];
  lines.push(`Named references found: ${scan.namedRefs.length}`);
  lines.push(`Quoted strings: ${scan.quotes.length}`);
  lines.push(`Has naming commands: ${scan.hasNamingCommands}`);
  lines.push('');

  for (const ref of scan.namedRefs) {
    lines.push(`  [${ref.startTokenIndex}-${ref.endTokenIndex}] ` +
      `${ref.type}: "${ref.name}" (${ref.quoteStyle})`);
    if (ref.entityTypeHint) {
      lines.push(`    Entity type: ${ref.entityTypeHint}`);
    }
    if (ref.namingVerb) {
      lines.push(`    Naming verb: ${ref.namingVerb}`);
    }
    lines.push(`    Confidence: ${(ref.confidence * 100).toFixed(0)}%`);
  }

  return lines.join('\n');
}

/**
 * Format all naming verb entries.
 */
export function formatAllNamingVerbs(): string {
  const sections: string[] = [];
  const operations = [...new Set(NAMING_VERB_ENTRIES.map(e => e.operation))];

  for (const op of operations) {
    const entries = NAMING_VERB_ENTRIES.filter(e => e.operation === op);
    sections.push(`\n=== ${op.toUpperCase()} ===`);
    for (const entry of entries) {
      sections.push(`  ${entry.forms.join('/')} (priority: ${entry.priority})`);
      sections.push(`    Examples: ${entry.examples.join('; ')}`);
    }
  }

  return sections.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the user-defined names grammar.
 */
export function getNameGrammarStats(): NameGrammarStats {
  const operationCounts = new Map<NamingOperation, number>();
  let totalVerbForms = 0;
  let totalKeywordForms = 0;

  for (const entry of NAMING_VERB_ENTRIES) {
    operationCounts.set(entry.operation, (operationCounts.get(entry.operation) ?? 0) + 1);
    totalVerbForms += entry.forms.length;
  }

  for (const entry of ENTITY_TYPE_KEYWORDS) {
    totalKeywordForms += entry.forms.length;
  }

  return {
    totalNamingVerbEntries: NAMING_VERB_ENTRIES.length,
    totalVerbForms,
    totalEntityTypeKeywords: ENTITY_TYPE_KEYWORDS.length,
    totalKeywordForms,
    totalQuoteStyles: Object.keys(QUOTE_CHARS).length,
    operationCounts: Object.fromEntries(operationCounts) as Record<NamingOperation, number>,
  };
}

/**
 * Statistics about the user-defined names grammar.
 */
export interface NameGrammarStats {
  readonly totalNamingVerbEntries: number;
  readonly totalVerbForms: number;
  readonly totalEntityTypeKeywords: number;
  readonly totalKeywordForms: number;
  readonly totalQuoteStyles: number;
  readonly operationCounts: Record<string, number>;
}

// =============================================================================
// GRAMMAR RULES
// =============================================================================

/**
 * Generate grammar rules for user-defined names.
 */
export function generateNameGrammarRules(): readonly NameGrammarRule[] {
  return [
    {
      id: 'name-001',
      lhs: 'NamedRefExpr',
      rhsDescription: 'QuotedString',
      producesType: 'quoted_standalone',
      priority: 15,
      semanticAction: 'sem:name:quoted',
      examples: ["'Glass Pad'", '"Warm Reverb"'],
    },
    {
      id: 'name-002',
      lhs: 'NamedRefExpr',
      rhsDescription: '"the" QuotedString EntityTypeKeyword',
      producesType: 'quoted_with_type',
      priority: 20,
      semanticAction: 'sem:name:quoted_type',
      examples: ["the 'Glass Pad' track", "the 'Drop' section"],
    },
    {
      id: 'name-003',
      lhs: 'NamedRefExpr',
      rhsDescription: '"the" EntityTypeKeyword NamingVerb QuotedString',
      producesType: 'called_pattern',
      priority: 22,
      semanticAction: 'sem:name:called',
      examples: ["the track called 'Glass Pad'", "the section named 'Drop'"],
    },
    {
      id: 'name-004',
      lhs: 'NamingCommand',
      rhsDescription: 'NamingVerb RefExpr QuotedString',
      producesType: 'naming_command',
      priority: 18,
      semanticAction: 'sem:name:assign',
      examples: ["call this 'My Chorus'", "name it 'Bass V2'"],
    },
    {
      id: 'name-005',
      lhs: 'NamingCommand',
      rhsDescription: '"rename" QuotedString "to" QuotedString',
      producesType: 'renaming_command',
      priority: 20,
      semanticAction: 'sem:name:rename',
      examples: ["rename 'Old' to 'New'", "rename 'Bass' to 'Bass V2'"],
    },
    {
      id: 'name-006',
      lhs: 'NamedRefExpr',
      rhsDescription: 'SearchVerb QuotedString',
      producesType: 'quoted_standalone',
      priority: 14,
      semanticAction: 'sem:name:search',
      examples: ["find 'Glass Pad'", "go to 'Chorus 2'"],
    },
  ];
}

/**
 * A grammar rule for user-defined names.
 */
export interface NameGrammarRule {
  readonly id: string;
  readonly lhs: string;
  readonly rhsDescription: string;
  readonly producesType: NameReferenceType;
  readonly priority: number;
  readonly semanticAction: string;
  readonly examples: readonly string[];
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const NAME_GRAMMAR_RULES = [
  'Rule NAME-001: Quoted strings are treated as exact entity names. They bind ' +
  'with highest priority and override all other resolution strategies.',

  'Rule NAME-002: The pattern "the X called/named/labelled \'Y\'" combines an ' +
  'entity type with a name. The entity type constrains the search space.',

  'Rule NAME-003: The pattern "the \'Y\' X" (quoted name before entity keyword) ' +
  'is a common alternative to "the X called \'Y\'".',

  'Rule NAME-004: Naming commands ("call this \'Y\'", "name it \'Y\'") create ' +
  'new user-defined names. They produce metadata mutation opcodes.',

  'Rule NAME-005: Rename commands ("rename \'X\' to \'Y\'") change existing ' +
  'names. Both old and new names must be quoted.',

  'Rule NAME-006: If a quoted name does not match any entity exactly, the system ' +
  'must offer fuzzy match suggestions rather than silently failing.',

  'Rule NAME-007: All quote styles (single, double, smart, backtick) are ' +
  'recognized. The tokenizer normalizes them before grammar processing.',

  'Rule NAME-008: Bare (unquoted) names are only recognized after explicit ' +
  'naming verbs or when the word doesn\'t match any known vocabulary term.',

  'Rule NAME-009: Tag-style references (#intro, @bass) are treated as names ' +
  'with tag_match resolution strategy.',

  'Rule NAME-010: User-defined names are case-insensitive for matching but ' +
  'case-preserving for display.',
] as const;
