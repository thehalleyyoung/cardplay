/**
 * @fileoverview CardScript Phrase Database Queries.
 * 
 * Provides first-class support for querying phrases from a database:
 * - Single phrases
 * - Sequences of phrases (List<Phrase>)
 * - Tuples of phrases (List<Phrase> for simultaneous playback)
 * - Tuples of sequences of phrases (List<List<Phrase>>)
 * - Phrase collections with typed operations
 * 
 * @module @cardplay/user-cards/cardscript/query
 */

import type { NoteEvent } from './invoke';

// PhraseDef is imported only for type reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PhraseDef as _PhraseDef } from './invoke';

// ============================================================================
// BASE COLLECTION TYPES
// ============================================================================

/**
 * Base list interface for phrase collections.
 * Provides common operations for all phrase-based lists.
 */
export interface PhraseList<T> extends Iterable<T> {
  readonly length: number;
  readonly items: readonly T[];
  
  // Core operations
  get(index: number): T | undefined;
  first(): T | undefined;
  last(): T | undefined;
  slice(start?: number, end?: number): PhraseList<T>;
  
  // Transformations
  map<U>(fn: (item: T, index: number) => U): PhraseList<U>;
  filter(fn: (item: T, index: number) => boolean): PhraseList<T>;
  flatMap<U>(fn: (item: T, index: number) => PhraseList<U>): PhraseList<U>;
  
  // Reductions
  reduce<U>(fn: (acc: U, item: T, index: number) => U, initial: U): U;
  
  // Queries
  find(fn: (item: T, index: number) => boolean): T | undefined;
  findIndex(fn: (item: T, index: number) => boolean): number;
  some(fn: (item: T, index: number) => boolean): boolean;
  every(fn: (item: T, index: number) => boolean): boolean;
  includes(item: T): boolean;
  
  // Conversion
  toArray(): T[];
  toJSON(): unknown;
}

/**
 * Mutable phrase list builder.
 */
export interface PhraseListBuilder<T> {
  add(item: T): this;
  addAll(items: Iterable<T>): this;
  remove(index: number): this;
  clear(): this;
  build(): PhraseList<T>;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Phrase metadata stored in database.
 */
export interface PhraseMetadata {
  id: string;
  name: string;
  tags: string[];
  category?: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  duration: number;
  noteCount: number;
  key?: string;
  scale?: string;
  tempo?: number;
  timeSignature?: [number, number];
  instrument?: string;
  style?: string;
  energy?: number;
  complexity?: number;
}

/**
 * Stored phrase with metadata.
 */
export interface StoredPhrase extends PhraseMetadata {
  notes: NoteEvent[];
}

/**
 * Phrase sequence - ordered list of phrase IDs (List<Phrase>).
 */
export interface PhraseSequence {
  id: string;
  name: string;
  phraseIds: string[];
  gaps?: number[]; // Gaps between phrases in beats
  tags: string[];
  totalDuration: number;
}

/**
 * Phrase tuple - group of phrases to be played simultaneously (List<Phrase>).
 */
export interface PhraseTuple {
  id: string;
  name: string;
  phraseIds: string[];
  offsets?: number[]; // Beat offsets for each phrase
  tags: string[];
}

/**
 * Tuple of sequences - multiple sequences to be played simultaneously (List<List<Phrase>>).
 */
export interface SequenceTuple {
  id: string;
  name: string;
  sequenceIds: string[];
  offsets?: number[]; // Beat offsets for each sequence
  tags: string[];
}

// ============================================================================
// CONCRETE COLLECTION IMPLEMENTATIONS
// ============================================================================

/**
 * Immutable phrase collection (List<Phrase>).
 */
export class PhraseCollection implements PhraseList<StoredPhrase> {
  readonly items: readonly StoredPhrase[];
  
  constructor(items: StoredPhrase[] = []) {
    this.items = Object.freeze([...items]);
  }
  
  get length(): number {
    return this.items.length;
  }
  
  [Symbol.iterator](): Iterator<StoredPhrase> {
    return this.items[Symbol.iterator]();
  }
  
  get(index: number): StoredPhrase | undefined {
    return this.items[index];
  }
  
  first(): StoredPhrase | undefined {
    return this.items[0];
  }
  
  last(): StoredPhrase | undefined {
    return this.items[this.items.length - 1];
  }
  
  slice(start?: number, end?: number): PhraseCollection {
    return new PhraseCollection(this.items.slice(start, end) as StoredPhrase[]);
  }
  
  map<U>(fn: (item: StoredPhrase, index: number) => U): PhraseList<U> {
    return new GenericPhraseList(this.items.map(fn));
  }
  
  filter(fn: (item: StoredPhrase, index: number) => boolean): PhraseCollection {
    return new PhraseCollection(this.items.filter(fn) as StoredPhrase[]);
  }
  
  flatMap<U>(fn: (item: StoredPhrase, index: number) => PhraseList<U>): PhraseList<U> {
    const results: U[] = [];
    this.items.forEach((item, i) => {
      const list = fn(item, i);
      results.push(...list.toArray());
    });
    return new GenericPhraseList(results);
  }
  
  reduce<U>(fn: (acc: U, item: StoredPhrase, index: number) => U, initial: U): U {
    return this.items.reduce((acc, item, i) => fn(acc, item, i), initial);
  }
  
  find(fn: (item: StoredPhrase, index: number) => boolean): StoredPhrase | undefined {
    return this.items.find(fn);
  }
  
  findIndex(fn: (item: StoredPhrase, index: number) => boolean): number {
    return this.items.findIndex(fn);
  }
  
  some(fn: (item: StoredPhrase, index: number) => boolean): boolean {
    return this.items.some(fn);
  }
  
  every(fn: (item: StoredPhrase, index: number) => boolean): boolean {
    return this.items.every(fn);
  }
  
  includes(item: StoredPhrase): boolean {
    return this.items.includes(item);
  }
  
  toArray(): StoredPhrase[] {
    return [...this.items];
  }
  
  toJSON(): unknown {
    return this.items;
  }
  
  // -------------------------------------------------------------------------
  // Phrase-specific operations
  // -------------------------------------------------------------------------
  
  /** Gets total duration of all phrases */
  get totalDuration(): number {
    return this.items.reduce((sum, p) => sum + p.duration, 0);
  }
  
  /** Gets total note count */
  get totalNoteCount(): number {
    return this.items.reduce((sum, p) => sum + p.noteCount, 0);
  }
  
  /** Filters by tag */
  byTag(tag: string): PhraseCollection {
    return this.filter(p => p.tags.includes(tag));
  }
  
  /** Filters by key */
  byKey(key: string): PhraseCollection {
    return this.filter(p => p.key === key);
  }
  
  /** Filters by category */
  byCategory(category: string): PhraseCollection {
    return this.filter(p => p.category === category);
  }
  
  /** Sorts by field */
  sortBy(field: keyof StoredPhrase, direction: 'asc' | 'desc' = 'asc'): PhraseCollection {
    const sorted = [...this.items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return direction === 'asc' ? cmp : -cmp;
    });
    return new PhraseCollection(sorted);
  }
  
  /** Gets random phrase */
  random(): StoredPhrase | undefined {
    if (this.length === 0) return undefined;
    return this.items[Math.floor(Math.random() * this.length)];
  }
  
  /** Gets N random phrases */
  randomN(n: number): PhraseCollection {
    if (n >= this.length) return this;
    const shuffled = [...this.items].sort(() => Math.random() - 0.5);
    return new PhraseCollection(shuffled.slice(0, n));
  }
  
  /** Concatenates with another collection */
  concat(other: PhraseCollection): PhraseCollection {
    return new PhraseCollection([...this.items, ...other.items]);
  }
  
  /** Creates a builder from this collection */
  toBuilder(): PhraseCollectionBuilder {
    return new PhraseCollectionBuilder([...this.items]);
  }
}

/**
 * Phrase sequence collection (List<List<Phrase>>).
 * Represents multiple phrase sequences that can be played in parallel.
 */
export class PhraseSequenceCollection implements PhraseList<PhraseCollection> {
  readonly items: readonly PhraseCollection[];
  
  constructor(items: PhraseCollection[] = []) {
    this.items = Object.freeze([...items]);
  }
  
  get length(): number {
    return this.items.length;
  }
  
  [Symbol.iterator](): Iterator<PhraseCollection> {
    return this.items[Symbol.iterator]();
  }
  
  get(index: number): PhraseCollection | undefined {
    return this.items[index];
  }
  
  first(): PhraseCollection | undefined {
    return this.items[0];
  }
  
  last(): PhraseCollection | undefined {
    return this.items[this.items.length - 1];
  }
  
  slice(start?: number, end?: number): PhraseSequenceCollection {
    return new PhraseSequenceCollection(this.items.slice(start, end) as PhraseCollection[]);
  }
  
  map<U>(fn: (item: PhraseCollection, index: number) => U): PhraseList<U> {
    return new GenericPhraseList(this.items.map(fn));
  }
  
  filter(fn: (item: PhraseCollection, index: number) => boolean): PhraseSequenceCollection {
    return new PhraseSequenceCollection(this.items.filter(fn) as PhraseCollection[]);
  }
  
  flatMap<U>(fn: (item: PhraseCollection, index: number) => PhraseList<U>): PhraseList<U> {
    const results: U[] = [];
    this.items.forEach((item, i) => {
      const list = fn(item, i);
      results.push(...list.toArray());
    });
    return new GenericPhraseList(results);
  }
  
  reduce<U>(fn: (acc: U, item: PhraseCollection, index: number) => U, initial: U): U {
    return this.items.reduce((acc, item, i) => fn(acc, item, i), initial);
  }
  
  find(fn: (item: PhraseCollection, index: number) => boolean): PhraseCollection | undefined {
    return this.items.find(fn);
  }
  
  findIndex(fn: (item: PhraseCollection, index: number) => boolean): number {
    return this.items.findIndex(fn);
  }
  
  some(fn: (item: PhraseCollection, index: number) => boolean): boolean {
    return this.items.some(fn);
  }
  
  every(fn: (item: PhraseCollection, index: number) => boolean): boolean {
    return this.items.every(fn);
  }
  
  includes(item: PhraseCollection): boolean {
    return this.items.includes(item);
  }
  
  toArray(): PhraseCollection[] {
    return [...this.items];
  }
  
  toJSON(): unknown {
    return this.items.map(c => c.toJSON());
  }
  
  // -------------------------------------------------------------------------
  // Sequence-specific operations
  // -------------------------------------------------------------------------
  
  /** Flattens all sequences into a single phrase collection */
  flatten(): PhraseCollection {
    const all: StoredPhrase[] = [];
    for (const seq of this.items) {
      all.push(...seq.toArray());
    }
    return new PhraseCollection(all);
  }
  
  /** Gets the maximum duration across all sequences */
  get maxDuration(): number {
    return Math.max(0, ...this.items.map(s => s.totalDuration));
  }
  
  /** Gets the total phrase count across all sequences */
  get totalPhraseCount(): number {
    return this.items.reduce((sum, s) => sum + s.length, 0);
  }
  
  /** Zips sequences together (interleaves phrases) */
  zip(): PhraseCollection {
    const maxLen = Math.max(0, ...this.items.map(s => s.length));
    const result: StoredPhrase[] = [];
    
    for (let i = 0; i < maxLen; i++) {
      for (const seq of this.items) {
        const phrase = seq.get(i);
        if (phrase) result.push(phrase);
      }
    }
    
    return new PhraseCollection(result);
  }
  
  /** Concatenates all sequences end-to-end */
  concat(): PhraseCollection {
    return this.flatten();
  }
  
  /** Adds a new sequence */
  addSequence(sequence: PhraseCollection): PhraseSequenceCollection {
    return new PhraseSequenceCollection([...this.items, sequence]);
  }
}

/**
 * Generic phrase list for arbitrary types.
 */
class GenericPhraseList<T> implements PhraseList<T> {
  readonly items: readonly T[];
  
  constructor(items: T[]) {
    this.items = Object.freeze([...items]);
  }
  
  get length(): number {
    return this.items.length;
  }
  
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
  
  get(index: number): T | undefined {
    return this.items[index];
  }
  
  first(): T | undefined {
    return this.items[0];
  }
  
  last(): T | undefined {
    return this.items[this.items.length - 1];
  }
  
  slice(start?: number, end?: number): PhraseList<T> {
    return new GenericPhraseList(this.items.slice(start, end) as T[]);
  }
  
  map<U>(fn: (item: T, index: number) => U): PhraseList<U> {
    return new GenericPhraseList(this.items.map(fn));
  }
  
  filter(fn: (item: T, index: number) => boolean): PhraseList<T> {
    return new GenericPhraseList(this.items.filter(fn) as T[]);
  }
  
  flatMap<U>(fn: (item: T, index: number) => PhraseList<U>): PhraseList<U> {
    const results: U[] = [];
    this.items.forEach((item, i) => {
      const list = fn(item, i);
      results.push(...list.toArray());
    });
    return new GenericPhraseList(results);
  }
  
  reduce<U>(fn: (acc: U, item: T, index: number) => U, initial: U): U {
    return this.items.reduce((acc, item, i) => fn(acc, item, i), initial);
  }
  
  find(fn: (item: T, index: number) => boolean): T | undefined {
    return this.items.find(fn);
  }
  
  findIndex(fn: (item: T, index: number) => boolean): number {
    return this.items.findIndex(fn);
  }
  
  some(fn: (item: T, index: number) => boolean): boolean {
    return this.items.some(fn);
  }
  
  every(fn: (item: T, index: number) => boolean): boolean {
    return this.items.every(fn);
  }
  
  includes(item: T): boolean {
    return this.items.includes(item);
  }
  
  toArray(): T[] {
    return [...this.items];
  }
  
  toJSON(): unknown {
    return this.items;
  }
}

/**
 * Builder for phrase collections.
 */
export class PhraseCollectionBuilder implements PhraseListBuilder<StoredPhrase> {
  private items: StoredPhrase[];
  
  constructor(initial: StoredPhrase[] = []) {
    this.items = [...initial];
  }
  
  add(item: StoredPhrase): this {
    this.items.push(item);
    return this;
  }
  
  addAll(items: Iterable<StoredPhrase>): this {
    for (const item of Array.from(items)) {
      this.items.push(item);
    }
    return this;
  }
  
  remove(index: number): this {
    this.items.splice(index, 1);
    return this;
  }
  
  clear(): this {
    this.items = [];
    return this;
  }
  
  build(): PhraseCollection {
    return new PhraseCollection(this.items);
  }
}

/**
 * Builder for phrase sequence collections.
 */
export class PhraseSequenceCollectionBuilder implements PhraseListBuilder<PhraseCollection> {
  private items: PhraseCollection[];
  
  constructor(initial: PhraseCollection[] = []) {
    this.items = [...initial];
  }
  
  add(item: PhraseCollection): this {
    this.items.push(item);
    return this;
  }
  
  addAll(items: Iterable<PhraseCollection>): this {
    for (const item of Array.from(items)) {
      this.items.push(item);
    }
    return this;
  }
  
  remove(index: number): this {
    this.items.splice(index, 1);
    return this;
  }
  
  clear(): this {
    this.items = [];
    return this;
  }
  
  build(): PhraseSequenceCollection {
    return new PhraseSequenceCollection(this.items);
  }
}

// ============================================================================
// COLLECTION FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a phrase collection from phrases.
 */
export function phrases(...items: StoredPhrase[]): PhraseCollection {
  return new PhraseCollection(items);
}

/**
 * Creates a phrase sequence collection from collections.
 */
export function sequences(...items: PhraseCollection[]): PhraseSequenceCollection {
  return new PhraseSequenceCollection(items);
}

/**
 * Creates an empty phrase collection.
 */
export function emptyPhrases(): PhraseCollection {
  return new PhraseCollection();
}

/**
 * Creates an empty sequence collection.
 */
export function emptySequences(): PhraseSequenceCollection {
  return new PhraseSequenceCollection();
}

/**
 * Type alias for List<Phrase>.
 */
export type ListOfPhrases = PhraseCollection;

/**
 * Type alias for List<List<Phrase>>.
 */
export type ListOfPhraseSequences = PhraseSequenceCollection;

// ============================================================================
// QUERY DSL
// ============================================================================

/**
 * Query operator.
 */
export type QueryOp = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith'
  | 'regex' | 'exists' | 'between';

/**
 * Query condition.
 */
export interface QueryCondition {
  field: string;
  op: QueryOp;
  value: unknown;
}

/**
 * Query sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Query sort spec.
 */
export interface QuerySort {
  field: string;
  direction: SortDirection;
}

/**
 * Phrase query.
 */
export interface PhraseQuery {
  conditions: QueryCondition[];
  sort?: QuerySort[];
  limit?: number;
  offset?: number;
  include?: ('notes' | 'metadata')[];
}

/**
 * Query result.
 */
export interface QueryResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  executionTimeMs: number;
}

// ============================================================================
// QUERY BUILDER
// ============================================================================

/**
 * Fluent query builder for phrases.
 */
export class PhraseQueryBuilder {
  private query: PhraseQuery = { conditions: [] };
  
  /**
   * Adds an equality condition.
   */
  where(field: string, value: unknown): this {
    this.query.conditions.push({ field, op: 'eq', value });
    return this;
  }
  
  /**
   * Adds a condition with custom operator.
   */
  whereOp(field: string, op: QueryOp, value: unknown): this {
    this.query.conditions.push({ field, op, value });
    return this;
  }
  
  /**
   * Filters by tag.
   */
  tag(tag: string): this {
    return this.whereOp('tags', 'contains', tag);
  }
  
  /**
   * Filters by multiple tags (AND).
   */
  tags(...tags: string[]): this {
    for (const tag of tags) {
      this.tag(tag);
    }
    return this;
  }
  
  /**
   * Filters by any of the tags (OR).
   */
  anyTag(...tags: string[]): this {
    return this.whereOp('tags', 'in', tags);
  }
  
  /**
   * Filters by category.
   */
  category(category: string): this {
    return this.where('category', category);
  }
  
  /**
   * Filters by key.
   */
  key(key: string): this {
    return this.where('key', key);
  }
  
  /**
   * Filters by scale.
   */
  scale(scale: string): this {
    return this.where('scale', scale);
  }
  
  /**
   * Filters by tempo range.
   */
  tempo(min: number, max?: number): this {
    if (max !== undefined) {
      return this.whereOp('tempo', 'between', [min, max]);
    }
    return this.where('tempo', min);
  }
  
  /**
   * Filters by duration range.
   */
  duration(min: number, max?: number): this {
    if (max !== undefined) {
      return this.whereOp('duration', 'between', [min, max]);
    }
    return this.where('duration', min);
  }
  
  /**
   * Filters by complexity range.
   */
  complexity(min: number, max?: number): this {
    if (max !== undefined) {
      return this.whereOp('complexity', 'between', [min, max]);
    }
    return this.where('complexity', min);
  }
  
  /**
   * Filters by energy range.
   */
  energy(min: number, max?: number): this {
    if (max !== undefined) {
      return this.whereOp('energy', 'between', [min, max]);
    }
    return this.where('energy', min);
  }
  
  /**
   * Filters by instrument.
   */
  instrument(instrument: string): this {
    return this.where('instrument', instrument);
  }
  
  /**
   * Filters by style.
   */
  style(style: string): this {
    return this.where('style', style);
  }
  
  /**
   * Filters by author.
   */
  author(author: string): this {
    return this.where('author', author);
  }
  
  /**
   * Filters by name pattern.
   */
  nameLike(pattern: string): this {
    return this.whereOp('name', 'contains', pattern);
  }
  
  /**
   * Filters by note count range.
   */
  noteCount(min: number, max?: number): this {
    if (max !== undefined) {
      return this.whereOp('noteCount', 'between', [min, max]);
    }
    return this.where('noteCount', min);
  }
  
  /**
   * Adds sorting.
   */
  orderBy(field: string, direction: SortDirection = 'asc'): this {
    if (!this.query.sort) this.query.sort = [];
    this.query.sort.push({ field, direction });
    return this;
  }
  
  /**
   * Limits results.
   */
  limit(n: number): this {
    this.query.limit = n;
    return this;
  }
  
  /**
   * Skips results.
   */
  offset(n: number): this {
    this.query.offset = n;
    return this;
  }
  
  /**
   * Skips results (alias).
   */
  skip(n: number): this {
    return this.offset(n);
  }
  
  /**
   * Paginate results.
   */
  page(pageNum: number, pageSize: number): this {
    this.query.offset = (pageNum - 1) * pageSize;
    this.query.limit = pageSize;
    return this;
  }
  
  /**
   * Include only metadata (no notes).
   */
  metadataOnly(): this {
    this.query.include = ['metadata'];
    return this;
  }
  
  /**
   * Builds the query.
   */
  build(): PhraseQuery {
    return { ...this.query };
  }
  
  /**
   * Executes the query.
   */
  async execute(db: PhraseDatabase): Promise<QueryResult<StoredPhrase>> {
    return db.queryPhrases(this.query);
  }
  
  /**
   * Gets a single result.
   */
  async one(db: PhraseDatabase): Promise<StoredPhrase | null> {
    const result = await db.queryPhrases({ ...this.query, limit: 1 });
    return result.items[0] ?? null;
  }
  
  /**
   * Gets all results.
   */
  async all(db: PhraseDatabase): Promise<StoredPhrase[]> {
    const result = await db.queryPhrases(this.query);
    return result.items;
  }
  
  /**
   * Gets count.
   */
  async count(db: PhraseDatabase): Promise<number> {
    const result = await db.queryPhrases({ ...this.query, include: [] });
    return result.total;
  }
  
  /**
   * Gets random results.
   */
  async random(db: PhraseDatabase, n = 1): Promise<StoredPhrase[]> {
    // Get count then random selection
    const count = await this.count(db);
    if (count === 0) return [];
    
    const indices = new Set<number>();
    while (indices.size < Math.min(n, count)) {
      indices.add(Math.floor(Math.random() * count));
    }
    
    const results: StoredPhrase[] = [];
    for (const idx of Array.from(indices)) {
      const result = await db.queryPhrases({ ...this.query, offset: idx, limit: 1 });
      if (result.items[0]) results.push(result.items[0]);
    }
    
    return results;
  }
}

// ============================================================================
// DATABASE INTERFACE
// ============================================================================

/**
 * Phrase database interface.
 */
export interface PhraseDatabase {
  // Single phrases
  getPhrase(id: string): Promise<StoredPhrase | null>;
  getPhrases(ids: string[]): Promise<StoredPhrase[]>;
  queryPhrases(query: PhraseQuery): Promise<QueryResult<StoredPhrase>>;
  savePhrase(phrase: StoredPhrase): Promise<void>;
  deletePhrase(id: string): Promise<boolean>;
  
  // Sequences
  getSequence(id: string): Promise<PhraseSequence | null>;
  querySequences(query: PhraseQuery): Promise<QueryResult<PhraseSequence>>;
  saveSequence(sequence: PhraseSequence): Promise<void>;
  deleteSequence(id: string): Promise<boolean>;
  
  // Tuples
  getTuple(id: string): Promise<PhraseTuple | null>;
  queryTuples(query: PhraseQuery): Promise<QueryResult<PhraseTuple>>;
  saveTuple(tuple: PhraseTuple): Promise<void>;
  deleteTuple(id: string): Promise<boolean>;
  
  // Sequence tuples
  getSequenceTuple(id: string): Promise<SequenceTuple | null>;
  querySequenceTuples(query: PhraseQuery): Promise<QueryResult<SequenceTuple>>;
  saveSequenceTuple(tuple: SequenceTuple): Promise<void>;
  deleteSequenceTuple(id: string): Promise<boolean>;
  
  // Materialized views
  materializeSequence(id: string): Promise<StoredPhrase>;
  materializeTuple(id: string): Promise<StoredPhrase[]>;
  materializeSequenceTuple(id: string): Promise<StoredPhrase[][]>;
}

// ============================================================================
// IN-MEMORY DATABASE
// ============================================================================

/**
 * In-memory phrase database for testing/development.
 */
export class InMemoryPhraseDatabase implements PhraseDatabase {
  private phrases: Map<string, StoredPhrase> = new Map();
  private sequences: Map<string, PhraseSequence> = new Map();
  private tuples: Map<string, PhraseTuple> = new Map();
  private sequenceTuples: Map<string, SequenceTuple> = new Map();
  
  // -------------------------------------------------------------------------
  // PHRASES
  // -------------------------------------------------------------------------
  
  async getPhrase(id: string): Promise<StoredPhrase | null> {
    return this.phrases.get(id) ?? null;
  }
  
  async getPhrases(ids: string[]): Promise<StoredPhrase[]> {
    return ids.map(id => this.phrases.get(id)).filter((p): p is StoredPhrase => p !== undefined);
  }
  
  async queryPhrases(query: PhraseQuery): Promise<QueryResult<StoredPhrase>> {
    const start = performance.now();
    let items = Array.from(this.phrases.values());
    
    // Apply conditions
    items = items.filter(item => this.matchConditions(item as unknown as Record<string, unknown>, query.conditions));
    
    const total = items.length;
    
    // Apply sort
    if (query.sort) {
      items = this.sortItems(items, query.sort);
    }
    
    // Apply pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? items.length;
    items = items.slice(offset, offset + limit);
    
    return {
      items,
      total,
      hasMore: offset + items.length < total,
      executionTimeMs: performance.now() - start,
    };
  }
  
  async savePhrase(phrase: StoredPhrase): Promise<void> {
    this.phrases.set(phrase.id, phrase);
  }
  
  async deletePhrase(id: string): Promise<boolean> {
    return this.phrases.delete(id);
  }
  
  // -------------------------------------------------------------------------
  // SEQUENCES
  // -------------------------------------------------------------------------
  
  async getSequence(id: string): Promise<PhraseSequence | null> {
    return this.sequences.get(id) ?? null;
  }
  
  async querySequences(query: PhraseQuery): Promise<QueryResult<PhraseSequence>> {
    const start = performance.now();
    let items = Array.from(this.sequences.values());
    items = items.filter(item => this.matchConditions(item as unknown as Record<string, unknown>, query.conditions));
    const total = items.length;
    
    if (query.sort) {
      items = this.sortItems(items, query.sort);
    }
    
    const offset = query.offset ?? 0;
    const limit = query.limit ?? items.length;
    items = items.slice(offset, offset + limit);
    
    return {
      items,
      total,
      hasMore: offset + items.length < total,
      executionTimeMs: performance.now() - start,
    };
  }
  
  async saveSequence(sequence: PhraseSequence): Promise<void> {
    this.sequences.set(sequence.id, sequence);
  }
  
  async deleteSequence(id: string): Promise<boolean> {
    return this.sequences.delete(id);
  }
  
  // -------------------------------------------------------------------------
  // TUPLES
  // -------------------------------------------------------------------------
  
  async getTuple(id: string): Promise<PhraseTuple | null> {
    return this.tuples.get(id) ?? null;
  }
  
  async queryTuples(query: PhraseQuery): Promise<QueryResult<PhraseTuple>> {
    const start = performance.now();
    let items = Array.from(this.tuples.values());
    items = items.filter(item => this.matchConditions(item as unknown as Record<string, unknown>, query.conditions));
    const total = items.length;
    
    if (query.sort) {
      items = this.sortItems(items, query.sort);
    }
    
    const offset = query.offset ?? 0;
    const limit = query.limit ?? items.length;
    items = items.slice(offset, offset + limit);
    
    return {
      items,
      total,
      hasMore: offset + items.length < total,
      executionTimeMs: performance.now() - start,
    };
  }
  
  async saveTuple(tuple: PhraseTuple): Promise<void> {
    this.tuples.set(tuple.id, tuple);
  }
  
  async deleteTuple(id: string): Promise<boolean> {
    return this.tuples.delete(id);
  }
  
  // -------------------------------------------------------------------------
  // SEQUENCE TUPLES
  // -------------------------------------------------------------------------
  
  async getSequenceTuple(id: string): Promise<SequenceTuple | null> {
    return this.sequenceTuples.get(id) ?? null;
  }
  
  async querySequenceTuples(query: PhraseQuery): Promise<QueryResult<SequenceTuple>> {
    const start = performance.now();
    let items = Array.from(this.sequenceTuples.values());
    items = items.filter(item => this.matchConditions(item as unknown as Record<string, unknown>, query.conditions));
    const total = items.length;
    
    if (query.sort) {
      items = this.sortItems(items, query.sort);
    }
    
    const offset = query.offset ?? 0;
    const limit = query.limit ?? items.length;
    items = items.slice(offset, offset + limit);
    
    return {
      items,
      total,
      hasMore: offset + items.length < total,
      executionTimeMs: performance.now() - start,
    };
  }
  
  async saveSequenceTuple(tuple: SequenceTuple): Promise<void> {
    this.sequenceTuples.set(tuple.id, tuple);
  }
  
  async deleteSequenceTuple(id: string): Promise<boolean> {
    return this.sequenceTuples.delete(id);
  }
  
  // -------------------------------------------------------------------------
  // MATERIALIZATION
  // -------------------------------------------------------------------------
  
  async materializeSequence(id: string): Promise<StoredPhrase> {
    const seq = await this.getSequence(id);
    if (!seq) throw new Error(`Sequence not found: ${id}`);
    
    const phrases = await this.getPhrases(seq.phraseIds);
    const gaps = seq.gaps ?? seq.phraseIds.map(() => 0);
    
    // Concatenate phrases with gaps
    const notes: NoteEvent[] = [];
    let currentBeat = 0;
    
    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i];
      if (!phrase) continue;
      
      for (const note of phrase.notes) {
        notes.push({
          ...note,
          beat: note.beat + currentBeat,
        });
      }
      
      currentBeat += phrase.duration + (gaps[i] ?? 0);
    }
    
    return {
      id: `materialized_${id}`,
      name: `Materialized: ${seq.name}`,
      tags: seq.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      duration: currentBeat,
      noteCount: notes.length,
      notes,
    };
  }
  
  async materializeTuple(id: string): Promise<StoredPhrase[]> {
    const tuple = await this.getTuple(id);
    if (!tuple) throw new Error(`Tuple not found: ${id}`);
    
    const phrases = await this.getPhrases(tuple.phraseIds);
    const offsets = tuple.offsets ?? tuple.phraseIds.map(() => 0);
    
    // Apply offsets to each phrase
    return phrases.map((phrase, i) => {
      if (!phrase) return null;
      const offset = offsets[i] ?? 0;
      
      return {
        ...phrase,
        id: `materialized_${id}_${i}`,
        notes: phrase.notes.map(note => ({
          ...note,
          beat: note.beat + offset,
        })),
      };
    }).filter((p): p is StoredPhrase => p !== null);
  }
  
  async materializeSequenceTuple(id: string): Promise<StoredPhrase[][]> {
    const seqTuple = await this.getSequenceTuple(id);
    if (!seqTuple) throw new Error(`Sequence tuple not found: ${id}`);
    
    const offsets = seqTuple.offsets ?? seqTuple.sequenceIds.map(() => 0);
    
    const results: StoredPhrase[][] = [];
    
    for (let i = 0; i < seqTuple.sequenceIds.length; i++) {
      const seqId = seqTuple.sequenceIds[i]!;
      const offset = offsets[i] ?? 0;
      
      const materialized = await this.materializeSequence(seqId);
      
      // Apply offset
      const adjusted: StoredPhrase = {
        ...materialized,
        notes: materialized.notes.map(note => ({
          ...note,
          beat: note.beat + offset,
        })),
      };
      
      results.push([adjusted]);
    }
    
    return results;
  }
  
  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------
  
  private matchConditions(item: Record<string, unknown>, conditions: QueryCondition[]): boolean {
    for (const cond of conditions) {
      if (!this.matchCondition(item, cond)) {
        return false;
      }
    }
    return true;
  }
  
  private matchCondition(item: Record<string, unknown>, cond: QueryCondition): boolean {
    const value = this.getFieldValue(item, cond.field);
    
    switch (cond.op) {
      case 'eq': return value === cond.value;
      case 'ne': return value !== cond.value;
      case 'gt': return typeof value === 'number' && value > (cond.value as number);
      case 'gte': return typeof value === 'number' && value >= (cond.value as number);
      case 'lt': return typeof value === 'number' && value < (cond.value as number);
      case 'lte': return typeof value === 'number' && value <= (cond.value as number);
      case 'in': return Array.isArray(cond.value) && cond.value.includes(value);
      case 'nin': return Array.isArray(cond.value) && !cond.value.includes(value);
      case 'contains':
        if (Array.isArray(value)) return value.includes(cond.value);
        if (typeof value === 'string') return value.includes(cond.value as string);
        return false;
      case 'startsWith':
        return typeof value === 'string' && value.startsWith(cond.value as string);
      case 'endsWith':
        return typeof value === 'string' && value.endsWith(cond.value as string);
      case 'regex':
        return typeof value === 'string' && new RegExp(cond.value as string).test(value);
      case 'exists':
        return cond.value ? value !== undefined : value === undefined;
      case 'between':
        if (typeof value !== 'number') return false;
        const [min, max] = cond.value as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }
  
  private getFieldValue(item: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = item;
    
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }
    
    return value;
  }
  
  private sortItems<T>(items: T[], sorts: QuerySort[]): T[] {
    return [...items].sort((a, b) => {
      for (const sort of sorts) {
        const aVal = this.getFieldValue(a as Record<string, unknown>, sort.field);
        const bVal = this.getFieldValue(b as Record<string, unknown>, sort.field);
        
        let cmp = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          cmp = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        }
        
        if (cmp !== 0) {
          return sort.direction === 'desc' ? -cmp : cmp;
        }
      }
      return 0;
    });
  }
}

// ============================================================================
// LIVE DSL SHORTCUTS
// ============================================================================

/** Default database instance */
let defaultDb: PhraseDatabase | null = null;

/**
 * Sets the default phrase database.
 */
export function setDefaultPhraseDb(db: PhraseDatabase): void {
  defaultDb = db;
}

/**
 * Gets the default phrase database.
 */
export function getDefaultPhraseDb(): PhraseDatabase {
  if (!defaultDb) {
    defaultDb = new InMemoryPhraseDatabase();
  }
  return defaultDb;
}

/**
 * Creates a new phrase query builder.
 */
export function q(): PhraseQueryBuilder {
  return new PhraseQueryBuilder();
}

/**
 * Queries phrases by tag (shorthand).
 */
export async function byTag(tag: string): Promise<StoredPhrase[]> {
  return q().tag(tag).all(getDefaultPhraseDb());
}

/**
 * Queries phrases by tags (shorthand).
 */
export async function byTags(...tags: string[]): Promise<StoredPhrase[]> {
  return q().tags(...tags).all(getDefaultPhraseDb());
}

/**
 * Queries phrases by category (shorthand).
 */
export async function byCategory(category: string): Promise<StoredPhrase[]> {
  return q().category(category).all(getDefaultPhraseDb());
}

/**
 * Queries phrases by key (shorthand).
 */
export async function byKey(key: string): Promise<StoredPhrase[]> {
  return q().key(key).all(getDefaultPhraseDb());
}

/**
 * Gets a phrase by ID (shorthand).
 */
export async function phr(id: string): Promise<StoredPhrase | null> {
  return getDefaultPhraseDb().getPhrase(id);
}

/**
 * Gets multiple phrases by IDs (shorthand).
 */
export async function phrs(...ids: string[]): Promise<StoredPhrase[]> {
  return getDefaultPhraseDb().getPhrases(ids);
}

/**
 * Gets a sequence by ID (shorthand).
 */
export async function seq(id: string): Promise<PhraseSequence | null> {
  return getDefaultPhraseDb().getSequence(id);
}

/**
 * Gets a tuple by ID (shorthand).
 */
export async function tup(id: string): Promise<PhraseTuple | null> {
  return getDefaultPhraseDb().getTuple(id);
}

/**
 * Gets a sequence tuple by ID (shorthand).
 */
export async function seqTup(id: string): Promise<SequenceTuple | null> {
  return getDefaultPhraseDb().getSequenceTuple(id);
}

/**
 * Gets random phrases matching criteria.
 */
export async function randomPhrases(n: number, query?: PhraseQueryBuilder): Promise<StoredPhrase[]> {
  const builder = query ?? q();
  return builder.random(getDefaultPhraseDb(), n);
}

/**
 * Materializes a sequence into a single phrase.
 */
export async function materialize(seqId: string): Promise<StoredPhrase> {
  return getDefaultPhraseDb().materializeSequence(seqId);
}

/**
 * Materializes a tuple into phrases.
 */
export async function materializeTup(tupId: string): Promise<StoredPhrase[]> {
  return getDefaultPhraseDb().materializeTuple(tupId);
}

// ============================================================================
// PHRASE CREATION HELPERS
// ============================================================================

/**
 * Creates a phrase from notes.
 */
export function createPhrase(
  id: string,
  name: string,
  notes: NoteEvent[],
  metadata?: Partial<PhraseMetadata>
): StoredPhrase {
  const duration = notes.reduce((max, n) => Math.max(max, n.beat + n.duration), 0);
  
  return {
    id,
    name,
    tags: metadata?.tags ?? [],
    ...(metadata?.category !== undefined ? { category: metadata.category } : {}),
    ...(metadata?.author !== undefined ? { author: metadata.author } : {}),
    createdAt: metadata?.createdAt ?? Date.now(),
    updatedAt: metadata?.updatedAt ?? Date.now(),
    duration,
    noteCount: notes.length,
    ...(metadata?.key !== undefined ? { key: metadata.key } : {}),
    ...(metadata?.scale !== undefined ? { scale: metadata.scale } : {}),
    ...(metadata?.tempo !== undefined ? { tempo: metadata.tempo } : {}),
    ...(metadata?.timeSignature !== undefined ? { timeSignature: metadata.timeSignature } : {}),
    ...(metadata?.instrument !== undefined ? { instrument: metadata.instrument } : {}),
    ...(metadata?.style !== undefined ? { style: metadata.style } : {}),
    ...(metadata?.energy !== undefined ? { energy: metadata.energy } : {}),
    ...(metadata?.complexity !== undefined ? { complexity: metadata.complexity } : {}),
    notes,
  };
}

/**
 * Creates a sequence from phrase IDs.
 */
export function createSequence(
  id: string,
  name: string,
  phraseIds: string[],
  gaps?: number[],
  tags: string[] = []
): PhraseSequence {
  return {
    id,
    name,
    phraseIds,
    ...(gaps !== undefined ? { gaps } : {}),
    tags,
    totalDuration: 0, // Will be calculated on materialization
  };
}

/**
 * Creates a tuple from phrase IDs.
 */
export function createTuple(
  id: string,
  name: string,
  phraseIds: string[],
  offsets?: number[],
  tags: string[] = []
): PhraseTuple {
  return {
    id,
    name,
    phraseIds,
    ...(offsets !== undefined ? { offsets } : {}),
    tags,
  };
}

/**
 * Creates a sequence tuple from sequence IDs.
 */
export function createSeqTuple(
  id: string,
  name: string,
  sequenceIds: string[],
  offsets?: number[],
  tags: string[] = []
): SequenceTuple {
  return {
    id,
    name,
    sequenceIds,
    ...(offsets !== undefined ? { offsets } : {}),
    tags,
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Bulk saves phrases.
 */
export async function savePhrases(phrases: StoredPhrase[]): Promise<void> {
  const db = getDefaultPhraseDb();
  await Promise.all(phrases.map(p => db.savePhrase(p)));
}

/**
 * Bulk saves sequences.
 */
export async function saveSequences(sequences: PhraseSequence[]): Promise<void> {
  const db = getDefaultPhraseDb();
  await Promise.all(sequences.map(s => db.saveSequence(s)));
}

/**
 * Bulk saves tuples.
 */
export async function saveTuples(tuples: PhraseTuple[]): Promise<void> {
  const db = getDefaultPhraseDb();
  await Promise.all(tuples.map(t => db.saveTuple(t)));
}

/**
 * Imports phrases from JSON.
 */
export async function importPhrases(json: string): Promise<number> {
  const data = JSON.parse(json) as {
    phrases?: StoredPhrase[];
    sequences?: PhraseSequence[];
    tuples?: PhraseTuple[];
    sequenceTuples?: SequenceTuple[];
  };
  
  let count = 0;
  const db = getDefaultPhraseDb();
  
  if (data.phrases) {
    await Promise.all(data.phrases.map(p => db.savePhrase(p)));
    count += data.phrases.length;
  }
  
  if (data.sequences) {
    await Promise.all(data.sequences.map(s => db.saveSequence(s)));
    count += data.sequences.length;
  }
  
  if (data.tuples) {
    await Promise.all(data.tuples.map(t => db.saveTuple(t)));
    count += data.tuples.length;
  }
  
  if (data.sequenceTuples) {
    await Promise.all(data.sequenceTuples.map(t => db.saveSequenceTuple(t)));
    count += data.sequenceTuples.length;
  }
  
  return count;
}

/**
 * Exports phrases to JSON.
 */
export async function exportPhrases(query?: PhraseQuery): Promise<string> {
  const db = getDefaultPhraseDb();
  
  const phrases = await db.queryPhrases(query ?? { conditions: [] });
  const sequences = await db.querySequences(query ?? { conditions: [] });
  const tuples = await db.queryTuples(query ?? { conditions: [] });
  const sequenceTuples = await db.querySequenceTuples(query ?? { conditions: [] });
  
  return JSON.stringify({
    phrases: phrases.items,
    sequences: sequences.items,
    tuples: tuples.items,
    sequenceTuples: sequenceTuples.items,
  }, null, 2);
}
