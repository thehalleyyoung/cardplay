/**
 * GOFAI Section Vocabulary — Form Structure Terminology
 *
 * This module defines the canonical vocabulary for song sections and
 * form structure that users can reference in natural language.
 *
 * @module gofai/canon/section-vocabulary
 */

import {
  type SectionType,
  type SectionTypeId,
  type VocabularyTable,
  createSectionTypeId,
  createVocabularyTable,
} from './types';

// =============================================================================
// Core Section Types
// =============================================================================

const SECTION_INTRO: SectionType = {
  id: createSectionTypeId('intro'),
  name: 'Intro',
  variants: ['introduction', 'opening', 'start'],
  description: 'Opening section of the song, typically instrumental.',
  typicalPosition: 'start',
  repeatable: false,
};

const SECTION_VERSE: SectionType = {
  id: createSectionTypeId('verse'),
  name: 'Verse',
  variants: ['v', 'vs'],
  description: 'Main lyrical/melodic section, usually repeated with variations.',
  typicalPosition: 'anywhere',
  repeatable: true,
};

const SECTION_PRECHORUS: SectionType = {
  id: createSectionTypeId('prechorus'),
  name: 'Pre-Chorus',
  variants: ['pre-chorus', 'pre', 'build', 'lift'],
  description: 'Transitional section building to the chorus.',
  typicalPosition: 'middle',
  repeatable: true,
};

const SECTION_CHORUS: SectionType = {
  id: createSectionTypeId('chorus'),
  name: 'Chorus',
  variants: ['hook', 'refrain', 'ch'],
  description: 'Main memorable section, typically the emotional peak.',
  typicalPosition: 'anywhere',
  repeatable: true,
};

const SECTION_BRIDGE: SectionType = {
  id: createSectionTypeId('bridge'),
  name: 'Bridge',
  variants: ['middle eight', 'middle 8', 'b section', 'br'],
  description: 'Contrasting section that provides variety before the final chorus.',
  typicalPosition: 'middle',
  repeatable: false,
};

const SECTION_OUTRO: SectionType = {
  id: createSectionTypeId('outro'),
  name: 'Outro',
  variants: ['ending', 'coda', 'end', 'close', 'fadeout'],
  description: 'Closing section of the song.',
  typicalPosition: 'end',
  repeatable: false,
};

const SECTION_BREAKDOWN: SectionType = {
  id: createSectionTypeId('breakdown'),
  name: 'Breakdown',
  variants: ['break', 'stripped'],
  description: 'Stripped-down section, often just rhythm or bass.',
  typicalPosition: 'anywhere',
  repeatable: true,
};

const SECTION_DROP: SectionType = {
  id: createSectionTypeId('drop'),
  name: 'Drop',
  variants: ['main drop', 'the drop'],
  description: 'High-energy section after a build, common in EDM.',
  typicalPosition: 'anywhere',
  repeatable: true,
};

const SECTION_BUILDUP: SectionType = {
  id: createSectionTypeId('buildup'),
  name: 'Build-Up',
  variants: ['build', 'riser', 'build-up'],
  description: 'Section that builds energy before a drop or chorus.',
  typicalPosition: 'middle',
  repeatable: true,
};

const SECTION_INSTRUMENTAL: SectionType = {
  id: createSectionTypeId('instrumental'),
  name: 'Instrumental',
  variants: ['inst', 'solo section', 'interlude'],
  description: 'Section featuring instrumental performance without vocals.',
  typicalPosition: 'middle',
  repeatable: true,
};

const SECTION_SOLO: SectionType = {
  id: createSectionTypeId('solo'),
  name: 'Solo',
  variants: ['guitar solo', 'synth solo', 'lead break'],
  description: 'Featured instrumental solo.',
  typicalPosition: 'middle',
  repeatable: false,
};

const SECTION_TAG: SectionType = {
  id: createSectionTypeId('tag'),
  name: 'Tag',
  variants: ['vamp', 'turnaround'],
  description: 'Short repeated phrase, often at the end.',
  typicalPosition: 'end',
  repeatable: true,
};

// =============================================================================
// Section Table
// =============================================================================

/**
 * All core section types.
 */
export const CORE_SECTION_TYPES: readonly SectionType[] = [
  SECTION_INTRO,
  SECTION_VERSE,
  SECTION_PRECHORUS,
  SECTION_CHORUS,
  SECTION_BRIDGE,
  SECTION_OUTRO,
  SECTION_BREAKDOWN,
  SECTION_DROP,
  SECTION_BUILDUP,
  SECTION_INSTRUMENTAL,
  SECTION_SOLO,
  SECTION_TAG,
];

/**
 * Section vocabulary table.
 */
export const SECTION_TYPES_TABLE: VocabularyTable<SectionType> =
  createVocabularyTable(CORE_SECTION_TYPES);

// =============================================================================
// Section Utilities
// =============================================================================

/**
 * Get a section type by ID.
 */
export function getSectionTypeById(id: SectionTypeId): SectionType | undefined {
  return SECTION_TYPES_TABLE.byId.get(id);
}

/**
 * Get a section type by name or variant.
 */
export function getSectionTypeByName(name: string): SectionType | undefined {
  return SECTION_TYPES_TABLE.byVariant.get(name.toLowerCase());
}

/**
 * Check if a string refers to a section type.
 */
export function isSectionType(name: string): boolean {
  return SECTION_TYPES_TABLE.byVariant.has(name.toLowerCase());
}

/**
 * Parse a section reference with optional number.
 *
 * Examples:
 * - "chorus" → { type: chorus, number: undefined }
 * - "chorus 2" → { type: chorus, number: 2 }
 * - "verse 1" → { type: verse, number: 1 }
 * - "the last chorus" → { type: chorus, ordinal: 'last' }
 * - "first verse" → { type: verse, ordinal: 'first' }
 */
export interface ParsedSectionRef {
  /** The section type */
  readonly type: SectionType;

  /** Explicit number (1-indexed) if present */
  readonly number?: number;

  /** Ordinal reference */
  readonly ordinal?: 'first' | 'last' | 'next' | 'previous';
}

/**
 * Parse a section reference string.
 */
export function parseSectionReference(input: string): ParsedSectionRef | undefined {
  const normalized = input.toLowerCase().trim();

  // Check for ordinal prefixes
  const ordinalPatterns: Array<{ pattern: RegExp; ordinal: ParsedSectionRef['ordinal'] }> = [
    { pattern: /^(the\s+)?first\s+/, ordinal: 'first' },
    { pattern: /^(the\s+)?last\s+/, ordinal: 'last' },
    { pattern: /^(the\s+)?next\s+/, ordinal: 'next' },
    { pattern: /^(the\s+)?previous\s+/, ordinal: 'previous' },
  ];

  let remaining = normalized;
  let ordinal: ParsedSectionRef['ordinal'] | undefined;

  for (const { pattern, ordinal: ord } of ordinalPatterns) {
    const match = remaining.match(pattern);
    if (match) {
      remaining = remaining.slice(match[0].length);
      ordinal = ord;
      break;
    }
  }

  // Remove leading "the "
  remaining = remaining.replace(/^the\s+/, '');

  // Check for trailing number
  const numberMatch = remaining.match(/^(.+?)\s+(\d+)$/);
  let typePart = remaining;
  let number: number | undefined;

  if (numberMatch && numberMatch[1] && numberMatch[2]) {
    typePart = numberMatch[1];
    number = parseInt(numberMatch[2], 10);
  }

  // Look up section type
  const sectionType = getSectionTypeByName(typePart);
  if (!sectionType) {
    return undefined;
  }

  // Build result with only defined properties
  if (number !== undefined && ordinal !== undefined) {
    return { type: sectionType, number, ordinal };
  } else if (number !== undefined) {
    return { type: sectionType, number };
  } else if (ordinal !== undefined) {
    return { type: sectionType, ordinal };
  } else {
    return { type: sectionType };
  }
}

/**
 * Get all surface forms for a section type.
 */
export function getAllSectionSurfaceForms(sectionType: SectionType): readonly string[] {
  return [sectionType.name, ...sectionType.variants];
}

/**
 * Normalize a section name to its canonical form.
 */
export function normalizeSectionName(name: string): string | undefined {
  const sectionType = getSectionTypeByName(name);
  return sectionType?.name;
}

/**
 * Get section types by typical position.
 */
export function getSectionTypesByPosition(
  position: SectionType['typicalPosition']
): readonly SectionType[] {
  return CORE_SECTION_TYPES.filter(
    s => s.typicalPosition === position || s.typicalPosition === 'anywhere'
  );
}

/**
 * Get repeatable section types (can appear multiple times).
 */
export function getRepeatableSectionTypes(): readonly SectionType[] {
  return CORE_SECTION_TYPES.filter(s => s.repeatable);
}

// =============================================================================
// Section Reference Resolution
// =============================================================================

/**
 * A resolved section reference in a specific project context.
 */
export interface ResolvedSectionRef {
  /** The section type */
  readonly type: SectionType;

  /** The instance number (1-indexed) */
  readonly instanceNumber: number;

  /** Start bar (1-indexed) */
  readonly startBar: number;

  /** End bar (1-indexed, exclusive) */
  readonly endBar: number;

  /** Display name */
  readonly displayName: string;
}

/**
 * Resolve a section reference given project markers.
 *
 * This is a placeholder interface; actual resolution requires
 * project state from the execution module.
 */
export function resolveSectionReference(
  _ref: ParsedSectionRef,
  _projectMarkers: unknown
): ResolvedSectionRef | undefined {
  // Implementation requires project state
  // This is a stub for the interface
  return undefined;
}
