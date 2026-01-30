/**
 * GOFAI Infrastructure — Project Symbol Table Builder
 *
 * Builds an indexed, searchable symbol table from a CardPlay project's world
 * state. The symbol table is the central lookup structure for entity reference
 * resolution during the compilation pipeline.
 *
 * It indexes:
 *   - Sections (by type, ordinal, label, bar position)
 *   - Tracks/Layers (by type, name, role)
 *   - Cards (by name, type, containing deck/layer)
 *   - Parameters (by name, containing card, scope)
 *   - Decks (by name, containing layer)
 *   - Boards (by name)
 *
 * All lookups are deterministic and produce stable results.
 *
 * @module gofai/infra/symbol-table
 * @see gofai_goalA.md Step 056
 * @see gofaimusicplus.md §3.3 — Scope is first-class and typed
 */

import type {
  ProjectWorldAPI,
  SectionMarker,
  Track,
  CardInstance,
  TimeSignature,
} from './project-world-api';
import type { EntityType } from '../canon/types';
import type {
  ResolvedSectionRef,
  ResolvedLayerRef,
  ResolvedCardRef,
  ResolvedParamRef,
  ResolvedDeckRef,
  ResolvedBoardRef,
  ResolvedEntityRef,
  EntityResolutionResult,
  ResolutionMethod,
  EntityResolutionFailureReason,
} from '../canon/entity-refs';
import {
  createSectionRefId,
  createLayerRefId,
  createCardRefId,
  createParamRefId,
  createDeckRefId,
  createBoardRefId,
} from '../canon/entity-refs';

// =============================================================================
// SYMBOL TABLE TYPES
// =============================================================================

/**
 * A symbol entry in the table.
 *
 * Each entry represents a named entity in the project that can be
 * referenced from natural language.
 */
export interface SymbolEntry {
  /** The resolved entity reference */
  readonly entity: ResolvedEntityRef;

  /** All known names for this entity (canonical + aliases) */
  readonly names: readonly string[];

  /** The canonical (preferred) name */
  readonly canonicalName: string;

  /** Entity type for fast filtering */
  readonly entityType: EntityType;

  /** Containing scope (parent entity, if any) */
  readonly parent?: SymbolEntry;

  /** Bar range (for section/range entities) */
  readonly barRange?: { readonly start: number; readonly end: number };

  /** Layer type (for layer/track entities) */
  readonly layerType?: string;

  /** Whether this entity is currently visible/active */
  readonly isActive: boolean;

  /** Additional searchable metadata */
  readonly searchTerms: readonly string[];
}

/**
 * Configuration for building a symbol table.
 */
export interface SymbolTableConfig {
  /** Whether to include muted/disabled entities */
  readonly includeMuted: boolean;

  /** Whether to include bypassed cards */
  readonly includeBypassed: boolean;

  /** Whether to generate aliases from abbreviations */
  readonly generateAliases: boolean;

  /** Maximum number of param entries per card */
  readonly maxParamsPerCard: number;

  /** Custom name aliases for entities */
  readonly customAliases?: ReadonlyMap<string, readonly string[]>;
}

/**
 * Default symbol table configuration.
 */
export const DEFAULT_SYMBOL_TABLE_CONFIG: SymbolTableConfig = {
  includeMuted: true,
  includeBypassed: true,
  generateAliases: true,
  maxParamsPerCard: 50,
};

/**
 * Search result from the symbol table.
 */
export interface SymbolSearchResult {
  readonly entry: SymbolEntry;
  readonly score: number;
  readonly matchType: SymbolMatchType;
  readonly matchedName: string;
}

/**
 * How a symbol was matched.
 */
export type SymbolMatchType =
  | 'exact'            // Exact string match
  | 'canonical'        // Matched canonical name
  | 'alias'            // Matched an alias
  | 'prefix'           // Prefix match
  | 'fuzzy'            // Fuzzy/approximate match
  | 'type_and_ordinal' // Matched by type + ordinal number
  | 'role';            // Matched by role/function

/**
 * Statistics about the symbol table.
 */
export interface SymbolTableStats {
  readonly totalEntries: number;
  readonly sectionCount: number;
  readonly layerCount: number;
  readonly cardCount: number;
  readonly paramCount: number;
  readonly deckCount: number;
  readonly boardCount: number;
  readonly aliasCount: number;
  readonly buildTimeMs: number;
}

// =============================================================================
// SYMBOL TABLE CLASS
// =============================================================================

/**
 * The project symbol table.
 *
 * Built from a ProjectWorldAPI snapshot, provides fast lookups by name,
 * type, ordinal, and fuzzy search.
 */
export class SymbolTable {
  private entries: SymbolEntry[] = [];
  private byName: Map<string, SymbolEntry[]> = new Map();
  private byType: Map<EntityType, SymbolEntry[]> = new Map();
  private byId: Map<string, SymbolEntry> = new Map();
  private stats: SymbolTableStats;

  constructor(
    entries: readonly SymbolEntry[],
    stats: SymbolTableStats
  ) {
    this.entries = [...entries];
    this.stats = stats;

    // Build indexes
    for (const entry of entries) {
      // Index by entity ID
      const entityId = getEntityId(entry.entity);
      this.byId.set(entityId, entry);

      // Index by each name (lowercased)
      for (const name of entry.names) {
        const key = name.toLowerCase();
        const existing = this.byName.get(key);
        if (existing) {
          existing.push(entry);
        } else {
          this.byName.set(key, [entry]);
        }
      }

      // Index by entity type
      const typeEntries = this.byType.get(entry.entityType);
      if (typeEntries) {
        typeEntries.push(entry);
      } else {
        this.byType.set(entry.entityType, [entry]);
      }
    }
  }

  /**
   * Look up an entity by exact name.
   */
  lookupByName(name: string): readonly SymbolEntry[] {
    return this.byName.get(name.toLowerCase()) ?? [];
  }

  /**
   * Look up an entity by its branded ID.
   */
  lookupById(id: string): SymbolEntry | undefined {
    return this.byId.get(id);
  }

  /**
   * Get all entries of a given entity type.
   */
  getByType(entityType: EntityType): readonly SymbolEntry[] {
    return this.byType.get(entityType) ?? [];
  }

  /**
   * Look up by type and ordinal (e.g., "verse 2").
   */
  lookupByTypeAndOrdinal(
    entityType: EntityType,
    sectionType: string,
    ordinal: number
  ): SymbolEntry | undefined {
    const typeEntries = this.getByType(entityType);
    return typeEntries.find(e => {
      if (e.entityType === 'section') {
        const section = e.entity as ResolvedSectionRef;
        return section.sectionType === sectionType && section.instanceNumber === ordinal;
      }
      if (e.entityType === 'layer') {
        const layer = e.entity as ResolvedLayerRef;
        return layer.layerType === sectionType && layer.instanceNumber === ordinal;
      }
      return false;
    });
  }

  /**
   * Look up by type and relative position (e.g., "the last chorus").
   */
  lookupByTypeAndPosition(
    entityType: EntityType,
    sectionType: string,
    position: 'first' | 'last'
  ): SymbolEntry | undefined {
    const typeEntries = this.getByType(entityType).filter(e => {
      if (e.entityType === 'section') {
        return (e.entity as ResolvedSectionRef).sectionType === sectionType;
      }
      if (e.entityType === 'layer') {
        return (e.entity as ResolvedLayerRef).layerType === sectionType;
      }
      return false;
    });

    if (typeEntries.length === 0) return undefined;
    if (position === 'first') return typeEntries[0];
    return typeEntries[typeEntries.length - 1];
  }

  /**
   * Search the symbol table with fuzzy matching.
   *
   * Returns results sorted by match quality (best first).
   */
  search(
    query: string,
    options?: {
      readonly entityType?: EntityType;
      readonly maxResults?: number;
      readonly minScore?: number;
    }
  ): readonly SymbolSearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    const maxResults = options?.maxResults ?? 10;
    const minScore = options?.minScore ?? 0.3;
    const results: SymbolSearchResult[] = [];

    const candidates = options?.entityType
      ? this.getByType(options.entityType)
      : this.entries;

    for (const entry of candidates) {
      const result = scoreMatch(normalizedQuery, entry);
      if (result && result.score >= minScore) {
        results.push(result);
      }
    }

    // Sort by score descending, then by canonical name for stability
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.entry.canonicalName.localeCompare(b.entry.canonicalName);
    });

    return results.slice(0, maxResults);
  }

  /**
   * Resolve an entity reference using the symbol table.
   *
   * This is the main entry point for entity resolution during compilation.
   */
  resolve(
    query: string,
    entityType?: EntityType,
    method?: ResolutionMethod
  ): EntityResolutionResult {
    const normalizedQuery = query.toLowerCase().trim();

    // 1. Try exact name match
    const exactMatches = this.lookupByName(normalizedQuery);
    const filtered = entityType
      ? exactMatches.filter(e => e.entityType === entityType)
      : exactMatches;

    if (filtered.length === 1) {
      const entry = filtered[0]!;
      return {
        status: 'resolved',
        entity: entry.entity,
        confidence: 1.0,
        resolvedVia: method ?? 'exact_name',
      };
    }

    if (filtered.length > 1) {
      return {
        status: 'ambiguous',
        candidates: filtered.map(e => e.entity),
        disambiguationQuestion: formatDisambiguationQuestion(normalizedQuery, filtered),
      };
    }

    // 2. Try fuzzy search
    const searchOpts = entityType
      ? { entityType, maxResults: 5, minScore: 0.5 }
      : { maxResults: 5, minScore: 0.5 };
    const searchResults = this.search(normalizedQuery, searchOpts);

    if (searchResults.length === 1) {
      const result = searchResults[0]!;
      return {
        status: 'resolved',
        entity: result.entry.entity,
        confidence: result.score,
        resolvedVia: method ?? matchTypeToResolutionMethod(result.matchType),
      };
    }

    if (searchResults.length > 1) {
      // Check if top result is significantly better than second
      const top = searchResults[0]!;
      const second = searchResults[1]!;
      if (top.score - second.score > 0.15) {
        return {
          status: 'resolved',
          entity: top.entry.entity,
          confidence: top.score,
          resolvedVia: method ?? matchTypeToResolutionMethod(top.matchType),
        };
      }

      return {
        status: 'ambiguous',
        candidates: searchResults.map(r => r.entry.entity),
        disambiguationQuestion: formatDisambiguationQuestion(
          normalizedQuery,
          searchResults.map(r => r.entry)
        ),
        suggestedDefault: top.entry.entity,
      };
    }

    // 3. Nothing found
    const nearOpts = entityType
      ? { entityType, maxResults: 3, minScore: 0.2 }
      : { maxResults: 3, minScore: 0.2 };
    const nearMatches = this.search(normalizedQuery, nearOpts);

    const failResult: EntityResolutionResult = {
      status: 'failed',
      reason: 'not_found' as EntityResolutionFailureReason,
    };

    if (nearMatches.length > 0) {
      return {
        ...failResult,
        suggestion: `Did you mean ${nearMatches.map(r => `"${r.entry.canonicalName}"`).join(' or ')}?`,
        nearMatches: nearMatches.map(r => r.entry.entity),
      };
    }

    return failResult;
  }

  /**
   * Get all entries in the symbol table.
   */
  getAllEntries(): readonly SymbolEntry[] {
    return this.entries;
  }

  /**
   * Get symbol table statistics.
   */
  getStats(): SymbolTableStats {
    return this.stats;
  }

  /**
   * Check if the table contains any entry matching a name.
   */
  has(name: string): boolean {
    return this.byName.has(name.toLowerCase());
  }

  /**
   * Get all known names in the table.
   */
  getAllNames(): readonly string[] {
    return Array.from(this.byName.keys());
  }
}

// =============================================================================
// SYMBOL TABLE BUILDER
// =============================================================================

/**
 * Build a symbol table from a project world API.
 *
 * Indexes all entities in the project (sections, tracks, cards, params,
 * decks, board) and builds a searchable lookup structure.
 */
export function buildSymbolTable(
  world: ProjectWorldAPI,
  config: SymbolTableConfig = DEFAULT_SYMBOL_TABLE_CONFIG
): SymbolTable {
  const startTime = performance.now();
  const entries: SymbolEntry[] = [];

  // 1. Index board
  const boardId = world.getCurrentBoardId();
  const boardEntry = buildBoardEntry(boardId, world);
  entries.push(boardEntry);

  // 2. Index sections
  const sections = world.getSectionMarkers();
  const sectionEntries = buildSectionEntries(sections, world, config);
  entries.push(...sectionEntries);

  // 3. Index tracks/layers
  const tracks = world.getTracks();
  const trackEntries = buildTrackEntries(tracks, config);
  entries.push(...trackEntries);

  // 4. Index cards
  const cards = world.getCards();
  const cardEntries = buildCardEntries(cards, tracks, config);
  entries.push(...cardEntries);

  // 5. Index parameters
  const paramEntries = buildParamEntries(cards, world, config);
  entries.push(...paramEntries);

  // 6. Build deck entries (group cards by track)
  const deckEntries = buildDeckEntries(tracks, cards, config);
  entries.push(...deckEntries);

  const endTime = performance.now();

  const stats: SymbolTableStats = {
    totalEntries: entries.length,
    sectionCount: sectionEntries.length,
    layerCount: trackEntries.length,
    cardCount: cardEntries.length,
    paramCount: paramEntries.length,
    deckCount: deckEntries.length,
    boardCount: 1,
    aliasCount: entries.reduce((sum, e) => sum + e.names.length - 1, 0),
    buildTimeMs: endTime - startTime,
  };

  return new SymbolTable(entries, stats);
}

// =============================================================================
// ENTRY BUILDERS
// =============================================================================

/**
 * Build a board entry.
 */
function buildBoardEntry(
  boardId: string,
  _world: ProjectWorldAPI
): SymbolEntry {
  const id = createBoardRefId(boardId);
  const displayName = formatBoardName(boardId);

  const entity: ResolvedBoardRef = {
    entityType: 'board',
    id,
    boardName: boardId,
    deckCount: 0, // Will be updated later if needed
    displayName,
  };

  return {
    entity,
    names: [boardId, displayName.toLowerCase(), 'the board', 'this board', 'the project'],
    canonicalName: displayName,
    entityType: 'board',
    isActive: true,
    searchTerms: [boardId, 'board', 'project'],
  };
}

/**
 * Build section entries from section markers.
 */
function buildSectionEntries(
  sections: readonly SectionMarker[],
  world: ProjectWorldAPI,
  config: SymbolTableConfig
): SymbolEntry[] {
  const entries: SymbolEntry[] = [];
  const typeCounts = new Map<string, number>();
  const timeSignature = world.getTimeSignature();
  const tempo = world.getTempo();

  for (const section of sections) {
    const sectionType = (section.type ?? inferSectionType(section.name)).toLowerCase();

    // Track ordinal for this section type
    const ordinal = (typeCounts.get(sectionType) ?? 0) + 1;
    typeCounts.set(sectionType, ordinal);

    const startBar = ticksToBar(section.startTicks, timeSignature, tempo);
    const endBar = section.endTicks
      ? ticksToBar(section.endTicks, timeSignature, tempo)
      : ticksToBar(world.getDuration(), timeSignature, tempo);

    const id = createSectionRefId(sectionType, ordinal);
    const displayName = `${capitalize(sectionType)} ${ordinal} (bars ${startBar}–${endBar})`;

    const entity: ResolvedSectionRef = {
      entityType: 'section',
      id,
      sectionType,
      instanceNumber: ordinal,
      label: section.name,
      startBar,
      endBar,
      displayName,
    };

    const names: string[] = [
      section.name.toLowerCase(),
      `${sectionType} ${ordinal}`,
      `the ${sectionType}`,
    ];

    if (config.generateAliases) {
      names.push(`${ordinalWord(ordinal)} ${sectionType}`);
      if (ordinal === 1) names.push(`first ${sectionType}`);
    }

    entries.push({
      entity,
      names,
      canonicalName: `${capitalize(sectionType)} ${ordinal}`,
      entityType: 'section',
      barRange: { start: startBar, end: endBar },
      isActive: true,
      searchTerms: [sectionType, section.name, `bar ${startBar}`, `bars ${startBar}-${endBar}`],
    });
  }

  return entries;
}

/**
 * Build track/layer entries from tracks.
 */
function buildTrackEntries(
  tracks: readonly Track[],
  config: SymbolTableConfig
): SymbolEntry[] {
  const entries: SymbolEntry[] = [];
  const roleCounts = new Map<string, number>();

  for (const track of tracks) {
    if (!config.includeMuted && track.muted) continue;

    const role = track.role ?? 'track';
    const ordinal = (roleCounts.get(role) ?? 0) + 1;
    roleCounts.set(role, ordinal);

    const id = createLayerRefId(role, ordinal);
    const displayName = track.name || `${capitalize(role)} ${ordinal}`;

    const entity: ResolvedLayerRef = {
      entityType: 'layer',
      id,
      layerType: role,
      instanceNumber: ordinal,
      layerName: track.name,
      displayName,
    };

    const names: string[] = [
      track.name.toLowerCase(),
      role.toLowerCase(),
      `the ${role}`,
      `${role} track`,
      `${role} layer`,
    ];

    if (config.generateAliases) {
      if (ordinal > 1) {
        names.push(`${role} ${ordinal}`);
        names.push(`${ordinalWord(ordinal)} ${role}`);
      }
      // Add tag-based aliases
      for (const tag of track.tags) {
        names.push(tag.toLowerCase());
      }
    }

    entries.push({
      entity,
      names: deduplicateNames(names),
      canonicalName: displayName,
      entityType: 'layer',
      layerType: role,
      isActive: !track.muted,
      searchTerms: [role, track.name, ...track.tags],
    });
  }

  return entries;
}

/**
 * Build card entries from card instances.
 */
function buildCardEntries(
  cards: readonly CardInstance[],
  tracks: readonly Track[],
  config: SymbolTableConfig
): SymbolEntry[] {
  const entries: SymbolEntry[] = [];
  const trackMap = new Map<string, Track>();
  for (const track of tracks) {
    trackMap.set(track.id, track);
  }

  for (const card of cards) {
    if (!config.includeBypassed && card.bypassed) continue;

    const id = createCardRefId(card.id);
    const trackName = card.trackId ? trackMap.get(card.trackId)?.name : undefined;
    const displayName = trackName
      ? `${card.name} on ${trackName}`
      : card.name;

    const baseEntity = {
      entityType: 'card' as const,
      id,
      cardType: inferCardType(card),
      cardName: card.name,
      displayName,
    };

    const entity: ResolvedCardRef = card.trackId
      ? {
          ...baseEntity,
          deckId: createDeckRefId(card.trackId),
          layerId: createLayerRefId(trackMap.get(card.trackId)?.role ?? 'track', 0),
        }
      : baseEntity;

    const names: string[] = [
      card.name.toLowerCase(),
      `the ${card.name.toLowerCase()}`,
    ];

    if (trackName) {
      names.push(`the ${card.name.toLowerCase()} on the ${trackName.toLowerCase()}`);
      names.push(`${trackName.toLowerCase()} ${card.name.toLowerCase()}`);
    }

    if (config.generateAliases) {
      // Add type-based aliases
      names.push(`${card.typeId.toLowerCase()} card`);
    }

    entries.push({
      entity,
      names: deduplicateNames(names),
      canonicalName: displayName,
      entityType: 'card',
      isActive: !card.bypassed,
      searchTerms: [card.name, card.typeId],
    });
  }

  return entries;
}

/**
 * Build parameter entries from cards.
 */
function buildParamEntries(
  cards: readonly CardInstance[],
  _world: ProjectWorldAPI,
  config: SymbolTableConfig
): SymbolEntry[] {
  const entries: SymbolEntry[] = [];

  // Always add global parameters
  entries.push(...buildGlobalParamEntries());

  for (const card of cards) {
    if (!config.includeBypassed && card.bypassed) continue;

    const paramNames = Object.keys(card.params);
    const maxParams = Math.min(paramNames.length, config.maxParamsPerCard);

    for (let i = 0; i < maxParams; i++) {
      const paramName = paramNames[i]!;
      const paramValue = card.params[paramName];

      const id = createParamRefId(card.id, paramName);
      const displayName = `${paramName} on ${card.name}`;

      const entity: ResolvedParamRef = {
        entityType: 'param',
        id,
        paramName,
        paramType: inferParamType(paramValue),
        currentValue: paramValue as number | string | boolean,
        cardId: createCardRefId(card.id),
        isGlobal: false,
        displayName,
      };

      const names: string[] = [
        paramName.toLowerCase(),
        `the ${paramName.toLowerCase()}`,
        `${paramName.toLowerCase()} on ${card.name.toLowerCase()}`,
        `${card.name.toLowerCase()} ${paramName.toLowerCase()}`,
      ];

      entries.push({
        entity,
        names: deduplicateNames(names),
        canonicalName: displayName,
        entityType: 'param',
        isActive: !card.bypassed,
        searchTerms: [paramName, card.name],
      });
    }
  }

  return entries;
}

/**
 * Build global parameter entries (tempo, key, time signature, etc.).
 */
function buildGlobalParamEntries(): SymbolEntry[] {
  const entries: SymbolEntry[] = [];

  const globalParams: Array<{
    name: string;
    aliases: string[];
    paramType: 'tempo' | 'continuous' | 'enum';
  }> = [
    { name: 'tempo', aliases: ['bpm', 'speed', 'tempo', 'the tempo', 'the speed', 'the bpm'], paramType: 'tempo' },
    { name: 'key', aliases: ['key', 'the key', 'key signature', 'the key signature'], paramType: 'enum' },
    { name: 'time_signature', aliases: ['time signature', 'the time signature', 'meter', 'the meter'], paramType: 'enum' },
    { name: 'volume', aliases: ['master volume', 'the volume', 'overall volume', 'main volume'], paramType: 'continuous' },
  ];

  for (const param of globalParams) {
    const id = createParamRefId('global', param.name);
    const displayName = `Global ${param.name}`;

    const entity: ResolvedParamRef = {
      entityType: 'param',
      id,
      paramName: param.name,
      paramType: param.paramType,
      currentValue: 0, // Placeholder — actual value from world API
      isGlobal: true,
      displayName,
    };

    entries.push({
      entity,
      names: deduplicateNames(param.aliases),
      canonicalName: displayName,
      entityType: 'param',
      isActive: true,
      searchTerms: [param.name, ...param.aliases],
    });
  }

  return entries;
}

/**
 * Build deck entries from tracks and cards.
 */
function buildDeckEntries(
  tracks: readonly Track[],
  cards: readonly CardInstance[],
  _config: SymbolTableConfig
): SymbolEntry[] {
  const entries: SymbolEntry[] = [];

  for (const track of tracks) {
    const trackCards = cards.filter(c => c.trackId === track.id);

    const id = createDeckRefId(track.id);
    const displayName = `${track.name} deck`;

    const entity: ResolvedDeckRef = {
      entityType: 'deck',
      id,
      deckName: track.name,
      layerId: createLayerRefId(track.role ?? 'track', 0),
      cardCount: trackCards.length,
      displayName,
    };

    const names: string[] = [
      `${track.name.toLowerCase()} deck`,
      `the ${track.name.toLowerCase()} deck`,
      `${track.name.toLowerCase()} channel`,
      `${track.name.toLowerCase()} strip`,
    ];

    entries.push({
      entity,
      names: deduplicateNames(names),
      canonicalName: displayName,
      entityType: 'deck',
      isActive: !track.muted,
      searchTerms: [track.name, 'deck', 'channel', 'strip'],
    });
  }

  return entries;
}

// =============================================================================
// FUZZY MATCHING
// =============================================================================

/**
 * Score a query against a symbol entry.
 */
function scoreMatch(
  query: string,
  entry: SymbolEntry
): SymbolSearchResult | undefined {
  let bestScore = 0;
  let bestMatchType: SymbolMatchType = 'fuzzy';
  let bestMatchedName = '';

  for (const name of entry.names) {
    const lowerName = name.toLowerCase();

    // Exact match
    if (lowerName === query) {
      return {
        entry,
        score: 1.0,
        matchType: name === entry.canonicalName.toLowerCase() ? 'canonical' : 'alias',
        matchedName: name,
      };
    }

    // Prefix match
    if (lowerName.startsWith(query) || query.startsWith(lowerName)) {
      const prefixScore = Math.min(query.length, lowerName.length) /
        Math.max(query.length, lowerName.length) * 0.9;
      if (prefixScore > bestScore) {
        bestScore = prefixScore;
        bestMatchType = 'prefix';
        bestMatchedName = name;
      }
    }

    // Word match (query appears as a complete word in name)
    const words = lowerName.split(/\s+/);
    if (words.includes(query)) {
      const wordScore = 0.85;
      if (wordScore > bestScore) {
        bestScore = wordScore;
        bestMatchType = 'alias';
        bestMatchedName = name;
      }
    }

    // Fuzzy match using Levenshtein-like scoring
    const fuzzyScore = fuzzyMatchScore(query, lowerName);
    if (fuzzyScore > bestScore) {
      bestScore = fuzzyScore;
      bestMatchType = 'fuzzy';
      bestMatchedName = name;
    }
  }

  // Also check search terms
  for (const term of entry.searchTerms) {
    const lowerTerm = term.toLowerCase();
    if (lowerTerm === query) {
      const score = 0.8;
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'alias';
        bestMatchedName = term;
      }
    }
  }

  if (bestScore < 0.3) return undefined;

  return {
    entry,
    score: bestScore,
    matchType: bestMatchType,
    matchedName: bestMatchedName,
  };
}

/**
 * Simple fuzzy match score based on common subsequence.
 */
function fuzzyMatchScore(query: string, target: string): number {
  if (query.length === 0 || target.length === 0) return 0;

  let matchedChars = 0;
  let targetIdx = 0;

  for (let i = 0; i < query.length && targetIdx < target.length; i++) {
    const queryChar = query[i]!;
    while (targetIdx < target.length) {
      if (target[targetIdx] === queryChar) {
        matchedChars++;
        targetIdx++;
        break;
      }
      targetIdx++;
    }
  }

  if (matchedChars === 0) return 0;

  const coverage = matchedChars / query.length;
  const density = matchedChars / target.length;

  return coverage * 0.7 + density * 0.3;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a string ID from a resolved entity ref.
 */
function getEntityId(entity: ResolvedEntityRef): string {
  return entity.id as string;
}

/**
 * Infer section type from section name.
 */
function inferSectionType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('verse')) return 'verse';
  if (lower.includes('chorus')) return 'chorus';
  if (lower.includes('bridge')) return 'bridge';
  if (lower.includes('intro')) return 'intro';
  if (lower.includes('outro')) return 'outro';
  if (lower.includes('pre-chorus') || lower.includes('prechorus')) return 'pre_chorus';
  if (lower.includes('post-chorus') || lower.includes('postchorus')) return 'post_chorus';
  if (lower.includes('hook')) return 'hook';
  if (lower.includes('break')) return 'break';
  if (lower.includes('drop')) return 'drop';
  if (lower.includes('build')) return 'build';
  if (lower.includes('solo')) return 'solo';
  if (lower.includes('interlude')) return 'interlude';
  if (lower.includes('coda')) return 'coda';
  if (lower.includes('tag')) return 'tag';
  return 'section';
}

/**
 * Infer card type from a card instance.
 */
function inferCardType(card: CardInstance): 'instrument' | 'effect' | 'utility' {
  const lowerType = card.typeId.toLowerCase();
  if (lowerType.includes('synth') || lowerType.includes('piano') ||
      lowerType.includes('guitar') || lowerType.includes('bass') ||
      lowerType.includes('drum') || lowerType.includes('sampler') ||
      lowerType.includes('organ') || lowerType.includes('string') ||
      lowerType.includes('brass') || lowerType.includes('wind')) {
    return 'instrument';
  }
  if (lowerType.includes('reverb') || lowerType.includes('delay') ||
      lowerType.includes('compressor') || lowerType.includes('eq') ||
      lowerType.includes('filter') || lowerType.includes('chorus') ||
      lowerType.includes('distortion') || lowerType.includes('limiter') ||
      lowerType.includes('gate') || lowerType.includes('phaser') ||
      lowerType.includes('flanger')) {
    return 'effect';
  }
  return 'utility';
}

/**
 * Infer parameter type from a value.
 */
function inferParamType(
  value: unknown
): 'continuous' | 'discrete' | 'enum' | 'boolean' | 'tempo' {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'enum';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return 'discrete';
    return 'continuous';
  }
  return 'continuous';
}

/**
 * Convert ticks to bar number.
 */
function ticksToBar(
  ticks: number,
  timeSignature: TimeSignature,
  _tempo: number
): number {
  // Assuming 480 PPQ (pulses per quarter note) as standard
  const ppq = 480;
  const beatsPerBar = timeSignature.numerator;
  const ticksPerBar = ppq * beatsPerBar * (4 / timeSignature.denominator);
  return Math.floor(ticks / ticksPerBar) + 1;
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Get ordinal word for a number.
 */
function ordinalWord(n: number): string {
  switch (n) {
    case 1: return 'first';
    case 2: return 'second';
    case 3: return 'third';
    case 4: return 'fourth';
    case 5: return 'fifth';
    case 6: return 'sixth';
    case 7: return 'seventh';
    case 8: return 'eighth';
    case 9: return 'ninth';
    case 10: return 'tenth';
    default: return `${n}th`;
  }
}

/**
 * Format a board name for display.
 */
function formatBoardName(boardId: string): string {
  return capitalize(boardId.replace(/[-_]/g, ' '));
}

/**
 * Deduplicate an array of names (case-insensitive).
 */
function deduplicateNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter(name => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Format a disambiguation question for ambiguous results.
 */
function formatDisambiguationQuestion(
  query: string,
  candidates: readonly SymbolEntry[]
): string {
  const options = candidates
    .map(e => `"${e.canonicalName}"`)
    .join(', ');
  return `"${query}" could refer to: ${options}. Which one do you mean?`;
}

/**
 * Convert a match type to a resolution method.
 */
function matchTypeToResolutionMethod(matchType: SymbolMatchType): ResolutionMethod {
  switch (matchType) {
    case 'exact': return 'exact_name';
    case 'canonical': return 'exact_name';
    case 'alias': return 'exact_name';
    case 'prefix': return 'fuzzy_name';
    case 'fuzzy': return 'fuzzy_name';
    case 'type_and_ordinal': return 'type_and_ordinal';
    case 'role': return 'context_inferred';
  }
}

// =============================================================================
// SYMBOL TABLE SNAPSHOT & DIFF
// =============================================================================

/**
 * A serializable snapshot of the symbol table for debugging.
 */
export interface SymbolTableSnapshot {
  readonly timestamp: number;
  readonly stats: SymbolTableStats;
  readonly entries: readonly {
    readonly id: string;
    readonly canonicalName: string;
    readonly entityType: EntityType;
    readonly nameCount: number;
    readonly isActive: boolean;
  }[];
}

/**
 * Create a snapshot of the symbol table (for debugging/logging).
 */
export function snapshotSymbolTable(table: SymbolTable): SymbolTableSnapshot {
  return {
    timestamp: Date.now(),
    stats: table.getStats(),
    entries: table.getAllEntries().map(e => ({
      id: getEntityId(e.entity),
      canonicalName: e.canonicalName,
      entityType: e.entityType,
      nameCount: e.names.length,
      isActive: e.isActive,
    })),
  };
}

/**
 * Compare two symbol table snapshots and report differences.
 */
export function diffSymbolTables(
  before: SymbolTableSnapshot,
  after: SymbolTableSnapshot
): SymbolTableDiff {
  const beforeIds = new Set(before.entries.map(e => e.id));
  const afterIds = new Set(after.entries.map(e => e.id));

  const added = after.entries.filter(e => !beforeIds.has(e.id));
  const removed = before.entries.filter(e => !afterIds.has(e.id));

  const modified: Array<{ id: string; field: string; before: string; after: string }> = [];

  for (const afterEntry of after.entries) {
    const beforeEntry = before.entries.find(e => e.id === afterEntry.id);
    if (beforeEntry) {
      if (beforeEntry.canonicalName !== afterEntry.canonicalName) {
        modified.push({
          id: afterEntry.id,
          field: 'canonicalName',
          before: beforeEntry.canonicalName,
          after: afterEntry.canonicalName,
        });
      }
      if (beforeEntry.isActive !== afterEntry.isActive) {
        modified.push({
          id: afterEntry.id,
          field: 'isActive',
          before: String(beforeEntry.isActive),
          after: String(afterEntry.isActive),
        });
      }
    }
  }

  return { added, removed, modified };
}

/**
 * Differences between two symbol table snapshots.
 */
export interface SymbolTableDiff {
  readonly added: readonly SymbolTableSnapshot['entries'][number][];
  readonly removed: readonly SymbolTableSnapshot['entries'][number][];
  readonly modified: readonly {
    readonly id: string;
    readonly field: string;
    readonly before: string;
    readonly after: string;
  }[];
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules governing symbol table construction and lookup.
 */
export interface SymbolTableRule {
  readonly id: string;
  readonly description: string;
  readonly category: 'construction' | 'lookup' | 'naming' | 'lifecycle';
  readonly rule: string;
}

/**
 * Canonical rules for the symbol table.
 */
export const SYMBOL_TABLE_RULES: readonly SymbolTableRule[] = [
  {
    id: 'symtab-001',
    description: 'Symbol table is built fresh per compilation',
    category: 'lifecycle',
    rule: 'A new SymbolTable is built at the start of every compilation pipeline invocation from the current ProjectWorldAPI state. It is never reused across compilations.',
  },
  {
    id: 'symtab-002',
    description: 'All lookups are deterministic',
    category: 'lookup',
    rule: 'Given the same project state, building a SymbolTable and querying it must produce identical results every time. No randomness, no timestamp-dependent ordering.',
  },
  {
    id: 'symtab-003',
    description: 'Names are case-insensitive',
    category: 'naming',
    rule: 'All name lookups and searches are case-insensitive. "Drums", "drums", and "DRUMS" all match the same entity.',
  },
  {
    id: 'symtab-004',
    description: 'Canonical names are unique within type',
    category: 'naming',
    rule: 'Within an entity type, canonical names should be unique. If two sections are both named "Chorus", they are distinguished by ordinal: "Chorus 1", "Chorus 2".',
  },
  {
    id: 'symtab-005',
    description: 'Aliases must not create false ambiguity',
    category: 'naming',
    rule: 'Generated aliases must not create ambiguity between entities of different types. "bass" could match a layer AND a card — the resolver uses entityType to disambiguate.',
  },
  {
    id: 'symtab-006',
    description: 'Fuzzy matching has a minimum threshold',
    category: 'lookup',
    rule: 'Fuzzy matches with a score below 0.5 are not returned as resolution candidates. They may be shown as "did you mean?" suggestions only.',
  },
  {
    id: 'symtab-007',
    description: 'Ambiguity threshold',
    category: 'lookup',
    rule: 'When the top two candidates have scores within 0.15 of each other, the result is "ambiguous" and must trigger a clarification question.',
  },
  {
    id: 'symtab-008',
    description: 'Global parameters are always present',
    category: 'construction',
    rule: 'The symbol table always contains entries for global parameters (tempo, key, time signature) regardless of project state.',
  },
  {
    id: 'symtab-009',
    description: 'Muted entities are indexed but flagged',
    category: 'construction',
    rule: 'By default, muted tracks and bypassed cards are included in the symbol table but marked as isActive: false. The resolver can filter or warn based on this flag.',
  },
  {
    id: 'symtab-010',
    description: 'Symbol table is read-only after construction',
    category: 'lifecycle',
    rule: 'Once built, the SymbolTable instance is immutable. Any changes to the project require building a new SymbolTable.',
  },
];
