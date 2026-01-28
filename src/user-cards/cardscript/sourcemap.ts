/**
 * @fileoverview CardScript Source Maps.
 * 
 * Provides source map generation and consumption for CardScript compilation.
 * Follows the Source Map v3 specification for compatibility with browser DevTools.
 * 
 * Features:
 * - Generate source maps during compilation
 * - Map compiled positions back to source
 * - Support inline and external source maps
 * - Efficient VLQ encoding/decoding
 * - Source content embedding
 * 
 * @see https://sourcemaps.info/spec.html
 * @module @cardplay/user-cards/cardscript/sourcemap
 */

import type { ASTNode } from './ast';

// ============================================================================
// SOURCE MAP TYPES
// ============================================================================

/**
 * Source Map v3 format.
 */
export interface SourceMap {
  /** Version - always 3 */
  version: 3;
  /** File name of the generated file */
  file?: string;
  /** Root for source file paths */
  sourceRoot?: string;
  /** List of source file names */
  sources: string[];
  /** Original source content (optional) */
  sourcesContent?: (string | null)[];
  /** Symbol names referenced in mappings */
  names: string[];
  /** VLQ-encoded mappings string */
  mappings: string;
  /** Extensions (x_ prefixed) */
  [key: `x_${string}`]: unknown;
}

/**
 * A single source mapping segment.
 */
export interface MappingSegment {
  /** Generated column (0-indexed) */
  generatedColumn: number;
  /** Source file index */
  sourceIndex?: number;
  /** Source line (0-indexed) */
  sourceLine?: number;
  /** Source column (0-indexed) */
  sourceColumn?: number;
  /** Name index */
  nameIndex?: number;
}

/**
 * Decoded mapping entry.
 */
export interface DecodedMapping {
  /** Generated position */
  generated: {
    line: number;    // 1-indexed
    column: number;  // 0-indexed
  };
  /** Original position (if mapped) */
  original?: {
    line: number;    // 1-indexed
    column: number;  // 0-indexed
  };
  /** Source file path */
  source?: string;
  /** Original name/symbol */
  name?: string;
}

/**
 * Position lookup result.
 */
export interface LookupResult {
  /** Source file path */
  source: string | null;
  /** Original line (1-indexed) */
  line: number | null;
  /** Original column (0-indexed) */
  column: number | null;
  /** Original name/symbol */
  name: string | null;
}

// ============================================================================
// VLQ ENCODING/DECODING
// ============================================================================

const VLQ_BASE_SHIFT = 5;
const VLQ_BASE = 1 << VLQ_BASE_SHIFT; // 32
const VLQ_BASE_MASK = VLQ_BASE - 1;   // 31
const VLQ_CONTINUATION_BIT = VLQ_BASE; // 32

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_MAP = new Map<string, number>();
for (let i = 0; i < BASE64_CHARS.length; i++) {
  const char = BASE64_CHARS[i];
  if (char !== undefined) {
    BASE64_MAP.set(char, i);
  }
}

/**
 * Encodes a single VLQ value.
 */
export function encodeVLQ(value: number): string {
  let vlq = value < 0 ? ((-value) << 1) + 1 : (value << 1);
  let encoded = '';
  
  do {
    let digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += BASE64_CHARS[digit];
  } while (vlq > 0);
  
  return encoded;
}

/**
 * Decodes VLQ values from a string.
 */
export function decodeVLQ(str: string, index: number): { value: number; nextIndex: number } {
  let vlq = 0;
  let shift = 0;
  let continuation = true;
  
  while (continuation && index < str.length) {
    const char = str[index++];
    if (char === undefined) {
      throw new Error('Unexpected end of VLQ string');
    }
    const digit = BASE64_MAP.get(char);
    if (digit === undefined) {
      throw new Error(`Invalid base64 character: ${char}`);
    }
    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    vlq += (digit & VLQ_BASE_MASK) << shift;
    shift += VLQ_BASE_SHIFT;
  }
  
  // Convert from signed VLQ
  const isNegative = vlq & 1;
  const value = vlq >> 1;
  
  return {
    value: isNegative ? -value : value,
    nextIndex: index,
  };
}

/**
 * Encodes multiple VLQ values.
 */
export function encodeVLQs(values: number[]): string {
  return values.map(encodeVLQ).join('');
}

// ============================================================================
// SOURCE MAP GENERATOR
// ============================================================================

/**
 * Generates source maps during compilation.
 */
export class SourceMapGenerator {
  private readonly sources: string[] = [];
  private readonly sourcesContent: (string | null)[] = [];
  private readonly names: string[] = [];
  private readonly mappings: MappingSegment[][] = [[]];
  
  private sourceRoot?: string;
  private file?: string;
  
  // Previous values for delta encoding
  private prevSourceIndex = 0;
  private prevSourceLine = 0;
  private prevSourceColumn = 0;
  private prevNameIndex = 0;
  
  constructor(options: { file?: string; sourceRoot?: string } = {}) {
    if (options.file !== undefined) {
      this.file = options.file;
    }
    if (options.sourceRoot !== undefined) {
      this.sourceRoot = options.sourceRoot;
    }
  }
  
  /**
   * Adds a source file.
   */
  addSource(source: string, content?: string): number {
    let index = this.sources.indexOf(source);
    if (index === -1) {
      index = this.sources.length;
      this.sources.push(source);
      this.sourcesContent.push(content ?? null);
    } else if (content !== undefined && this.sourcesContent[index] === null) {
      this.sourcesContent[index] = content;
    }
    return index;
  }
  
  /**
   * Adds a name/symbol.
   */
  addName(name: string): number {
    let index = this.names.indexOf(name);
    if (index === -1) {
      index = this.names.length;
      this.names.push(name);
    }
    return index;
  }
  
  /**
   * Adds a mapping from generated to original position.
   */
  addMapping(mapping: {
    generated: { line: number; column: number };
    original?: { line: number; column: number };
    source?: string;
    name?: string;
  }): void {
    const { generated, original, source, name } = mapping;
    
    // Ensure we have enough lines
    while (this.mappings.length < generated.line) {
      this.mappings.push([]);
    }
    
    let line = this.mappings[generated.line - 1];
    if (!line) {
      line = [];
      this.mappings[generated.line - 1] = line;
    }
    
    // Create segment
    const segment: MappingSegment = {
      generatedColumn: generated.column,
    };
    
    // Add source mapping if provided
    if (original && source) {
      segment.sourceIndex = this.addSource(source);
      segment.sourceLine = original.line - 1; // 0-indexed
      segment.sourceColumn = original.column;
      
      if (name) {
        segment.nameIndex = this.addName(name);
      }
    }
    
    // Insert in sorted order by column
    let insertIndex = line.length;
    for (let i = 0; i < line.length; i++) {
      const seg = line[i];
      if (seg && seg.generatedColumn >= segment.generatedColumn) {
        insertIndex = i;
        break;
      }
    }
    line.splice(insertIndex, 0, segment);
  }
  
  /**
   * Adds a mapping from an AST node.
   */
  addMappingFromNode(
    generatedLine: number,
    generatedColumn: number,
    node: ASTNode,
    source: string,
    name?: string
  ): void {
    if (node.span) {
      const mapping: {
        generated: { line: number; column: number };
        original: { line: number; column: number };
        source: string;
        name?: string;
      } = {
        generated: { line: generatedLine, column: generatedColumn },
        original: { line: node.span.start.line, column: node.span.start.column - 1 },
        source,
      };
      if (name !== undefined) {
        mapping.name = name;
      }
      this.addMapping(mapping);
    }
  }
  
  /**
   * Starts a new line in the generated code.
   */
  newLine(): void {
    this.mappings.push([]);
  }
  
  /**
   * Generates the VLQ-encoded mappings string.
   */
  private encodeMappings(): string {
    const lines: string[] = [];
    
    // Reset deltas at start of each source map
    this.prevSourceIndex = 0;
    this.prevSourceLine = 0;
    this.prevSourceColumn = 0;
    this.prevNameIndex = 0;
    
    for (const line of this.mappings) {
      const segments: string[] = [];
      let prevGeneratedColumn = 0;
      
      for (const segment of line) {
        const values: number[] = [];
        
        // Generated column (delta from previous in same line)
        values.push(segment.generatedColumn - prevGeneratedColumn);
        prevGeneratedColumn = segment.generatedColumn;
        
        // Source mapping (if present)
        if (segment.sourceIndex !== undefined && 
            segment.sourceLine !== undefined && 
            segment.sourceColumn !== undefined) {
          // Source index (delta)
          values.push(segment.sourceIndex - this.prevSourceIndex);
          this.prevSourceIndex = segment.sourceIndex;
          
          // Source line (delta)
          values.push(segment.sourceLine - this.prevSourceLine);
          this.prevSourceLine = segment.sourceLine;
          
          // Source column (delta)
          values.push(segment.sourceColumn - this.prevSourceColumn);
          this.prevSourceColumn = segment.sourceColumn;
          
          // Name index (if present, delta)
          if (segment.nameIndex !== undefined) {
            values.push(segment.nameIndex - this.prevNameIndex);
            this.prevNameIndex = segment.nameIndex;
          }
        }
        
        segments.push(encodeVLQs(values));
      }
      
      lines.push(segments.join(','));
    }
    
    return lines.join(';');
  }
  
  /**
   * Generates the source map JSON.
   */
  toJSON(): SourceMap {
    const map: SourceMap = {
      version: 3,
      sources: [...this.sources],
      names: [...this.names],
      mappings: this.encodeMappings(),
    };
    
    if (this.file) {
      map.file = this.file;
    }
    
    if (this.sourceRoot) {
      map.sourceRoot = this.sourceRoot;
    }
    
    // Only include sourcesContent if any content is present
    if (this.sourcesContent.some(c => c !== null)) {
      map.sourcesContent = [...this.sourcesContent];
    }
    
    return map;
  }
  
  /**
   * Generates the source map as a string.
   */
  toString(): string {
    return JSON.stringify(this.toJSON());
  }
  
  /**
   * Generates an inline source map (data URL).
   */
  toInlineSourceMap(): string {
    const json = this.toString();
    const base64 = typeof btoa !== 'undefined' 
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json).toString('base64');
    return `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64}`;
  }
  
  /**
   * Generates a source map comment.
   */
  toSourceMapComment(url: string): string {
    return `//# sourceMappingURL=${url}`;
  }
}

// ============================================================================
// SOURCE MAP CONSUMER
// ============================================================================

/**
 * Consumes and queries source maps.
 */
export class SourceMapConsumer {
  private readonly map: SourceMap;
  private readonly decodedMappings: DecodedMapping[][] = [];
  private decoded = false;
  
  constructor(map: SourceMap | string) {
    this.map = typeof map === 'string' ? JSON.parse(map) as SourceMap : map;
    
    if (this.map.version !== 3) {
      throw new Error(`Unsupported source map version: ${this.map.version}`);
    }
  }
  
  /**
   * Decodes the mappings lazily.
   */
  private decode(): void {
    if (this.decoded) return;
    this.decoded = true;
    
    const mappings = this.map.mappings;
    let prevSourceIndex = 0;
    let prevSourceLine = 0;
    let prevSourceColumn = 0;
    let prevNameIndex = 0;
    
    let generatedLine = 1;
    let generatedColumn = 0;
    let index = 0;
    
    let currentLine: DecodedMapping[] = [];
    this.decodedMappings.push(currentLine);
    
    while (index < mappings.length) {
      const char = mappings[index];
      
      if (char === ';') {
        // New line
        generatedLine++;
        generatedColumn = 0;
        currentLine = [];
        this.decodedMappings.push(currentLine);
        index++;
        continue;
      }
      
      if (char === ',') {
        // New segment separator
        index++;
        continue;
      }
      
      // Decode segment
      const segment: DecodedMapping = {
        generated: { line: generatedLine, column: 0 },
      };
      
      // Generated column (always present)
      const col = decodeVLQ(mappings, index);
      generatedColumn += col.value;
      segment.generated.column = generatedColumn;
      index = col.nextIndex;
      
      // Check if there's more in this segment (source info)
      if (index < mappings.length && mappings[index] !== ',' && mappings[index] !== ';') {
        // Source index
        const srcIdx = decodeVLQ(mappings, index);
        prevSourceIndex += srcIdx.value;
        index = srcIdx.nextIndex;
        
        // Source line
        const srcLine = decodeVLQ(mappings, index);
        prevSourceLine += srcLine.value;
        index = srcLine.nextIndex;
        
        // Source column
        const srcCol = decodeVLQ(mappings, index);
        prevSourceColumn += srcCol.value;
        index = srcCol.nextIndex;
        
        const sourceValue = this.map.sources[prevSourceIndex];
        if (sourceValue !== undefined) {
          segment.source = sourceValue;
        }
        segment.original = {
          line: prevSourceLine + 1, // Convert to 1-indexed
          column: prevSourceColumn,
        };
        
        // Check for name
        if (index < mappings.length && mappings[index] !== ',' && mappings[index] !== ';') {
          const nameIdx = decodeVLQ(mappings, index);
          prevNameIndex += nameIdx.value;
          index = nameIdx.nextIndex;
          const nameValue = this.map.names[prevNameIndex];
          if (nameValue !== undefined) {
            segment.name = nameValue;
          }
        }
      }
      
      currentLine.push(segment);
    }
  }
  
  /**
   * Looks up the original position for a generated position.
   */
  originalPositionFor(generated: { line: number; column: number }): LookupResult {
    this.decode();
    
    const lineIndex = generated.line - 1;
    if (lineIndex < 0 || lineIndex >= this.decodedMappings.length) {
      return { source: null, line: null, column: null, name: null };
    }
    
    const line = this.decodedMappings[lineIndex];
    if (!line || line.length === 0) {
      return { source: null, line: null, column: null, name: null };
    }
    
    // Binary search for the segment
    let low = 0;
    let high = line.length - 1;
    
    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      const midSegment = line[mid];
      if (midSegment && midSegment.generated.column <= generated.column) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    
    const segment = line[low];
    if (!segment || segment.generated.column > generated.column) {
      return { source: null, line: null, column: null, name: null };
    }
    
    return {
      source: segment.source ?? null,
      line: segment.original?.line ?? null,
      column: segment.original?.column ?? null,
      name: segment.name ?? null,
    };
  }
  
  /**
   * Looks up the generated position for an original position.
   */
  generatedPositionFor(original: { source: string; line: number; column: number }): { line: number | null; column: number | null } {
    this.decode();
    
    for (let lineIndex = 0; lineIndex < this.decodedMappings.length; lineIndex++) {
      const line = this.decodedMappings[lineIndex];
      if (!line) continue;
      for (const segment of line) {
        if (segment.source === original.source &&
            segment.original?.line === original.line &&
            segment.original?.column === original.column) {
          return {
            line: segment.generated.line,
            column: segment.generated.column,
          };
        }
      }
    }
    
    return { line: null, column: null };
  }
  
  /**
   * Gets all mappings.
   */
  allMappings(): DecodedMapping[] {
    this.decode();
    return this.decodedMappings.flat();
  }
  
  /**
   * Gets mappings for a specific source file.
   */
  mappingsForSource(source: string): DecodedMapping[] {
    return this.allMappings().filter(m => m.source === source);
  }
  
  /**
   * Gets source content (if embedded).
   */
  sourceContentFor(source: string): string | null {
    const index = this.map.sources.indexOf(source);
    if (index === -1 || !this.map.sourcesContent) {
      return null;
    }
    return this.map.sourcesContent[index] ?? null;
  }
  
  /**
   * Gets all source file names.
   */
  get sources(): readonly string[] {
    return this.map.sources;
  }
  
  /**
   * Gets all names.
   */
  get names(): readonly string[] {
    return this.map.names;
  }
}

// ============================================================================
// SOURCE MAP UTILITIES
// ============================================================================

/**
 * Parses a source map from a URL or inline data.
 */
export async function parseSourceMapFromUrl(url: string): Promise<SourceMap> {
  // Handle inline source maps
  if (url.startsWith('data:')) {
    const match = url.match(/^data:application\/json;(?:charset=utf-8;)?base64,(.+)$/);
    if (match && match[1]) {
      const json = typeof atob !== 'undefined'
        ? decodeURIComponent(escape(atob(match[1])))
        : Buffer.from(match[1], 'base64').toString('utf8');
      return JSON.parse(json) as SourceMap;
    }
    throw new Error('Invalid inline source map format');
  }
  
  // Fetch from URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch source map: ${response.statusText}`);
  }
  return await response.json() as SourceMap;
}

/**
 * Extracts source map URL from source code.
 */
export function extractSourceMapUrl(source: string): string | null {
  // Check for sourceMappingURL comment
  const match = source.match(/\/\/[#@]\s*sourceMappingURL=(.+?)(?:\s|$)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Check for sourceURL comment (older format)
  const urlMatch = source.match(/\/\/[#@]\s*sourceURL=(.+?)(?:\s|$)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].trim();
  }
  
  return null;
}

/**
 * Removes source map comments from source code.
 */
export function removeSourceMapComments(source: string): string {
  return source
    .replace(/\/\/[#@]\s*sourceMappingURL=.+?(?:\s|$)/g, '')
    .replace(/\/\/[#@]\s*sourceURL=.+?(?:\s|$)/g, '');
}

/**
 * Merges multiple source maps (for chained transformations).
 */
export function mergeSourceMaps(maps: SourceMap[]): SourceMap {
  if (maps.length === 0) {
    throw new Error('No source maps to merge');
  }
  
  if (maps.length === 1 && maps[0]) {
    return maps[0];
  }
  
  const lastMap = maps[maps.length - 1];
  if (!lastMap) {
    throw new Error('Invalid source map array');
  }
  
  const generator = new SourceMapGenerator(
    lastMap.file ? { file: lastMap.file } : {}
  );
  const consumers = maps.map(m => new SourceMapConsumer(m));
  
  // Start from the last consumer and trace back
  const lastConsumer = consumers[consumers.length - 1];
  if (!lastConsumer) {
    throw new Error('Invalid consumer array');
  }
  
  for (const mapping of lastConsumer.allMappings()) {
    if (!mapping.original || !mapping.source) {
      continue;
    }
    
    // Trace through all consumers
    let current = {
      source: mapping.source,
      line: mapping.original.line,
      column: mapping.original.column,
    };
    
    for (let i = consumers.length - 2; i >= 0; i--) {
      const consumer = consumers[i];
      if (!consumer) continue;
      
      const result = consumer.originalPositionFor({
        line: current.line,
        column: current.column,
      });
      
      if (result.line === null || result.source === null) {
        break;
      }
      
      current = {
        source: result.source,
        line: result.line,
        column: result.column ?? 0,
      };
    }
    
    const addMappingArg: {
      generated: { line: number; column: number };
      original: { line: number; column: number };
      source: string;
      name?: string;
    } = {
      generated: mapping.generated,
      original: { line: current.line, column: current.column },
      source: current.source,
    };
    if (mapping.name !== undefined) {
      addMappingArg.name = mapping.name;
    }
    generator.addMapping(addMappingArg);
    
    // Add source content if available
    const firstConsumer = consumers[0];
    if (firstConsumer) {
      const content = firstConsumer.sourceContentFor(current.source);
      if (content) {
        generator.addSource(current.source, content);
      }
    }
  }
  
  return generator.toJSON();
}

// ============================================================================
// SOURCE LOCATION TRACKING
// ============================================================================

/**
 * Tracks source locations during code generation.
 */
export class SourceLocationTracker {
  private line = 1;
  private column = 0;
  private readonly generator: SourceMapGenerator;
  private readonly sourceFile: string;
  private readonly output: string[] = [];
  
  constructor(sourceFile: string, generator?: SourceMapGenerator) {
    this.sourceFile = sourceFile;
    this.generator = generator ?? new SourceMapGenerator({ file: sourceFile + '.js' });
    this.generator.addSource(sourceFile);
  }
  
  /**
   * Writes text with source mapping.
   */
  write(text: string, node?: ASTNode): void {
    if (node?.span) {
      this.generator.addMapping({
        generated: { line: this.line, column: this.column },
        original: { line: node.span.start.line, column: node.span.start.column - 1 },
        source: this.sourceFile,
      });
    }
    
    this.output.push(text);
    
    // Update position
    for (const char of text) {
      if (char === '\n') {
        this.line++;
        this.column = 0;
        this.generator.newLine();
      } else {
        this.column++;
      }
    }
  }
  
  /**
   * Writes a new line.
   */
  writeLine(text?: string, node?: ASTNode): void {
    if (text) {
      this.write(text, node);
    }
    this.write('\n');
  }
  
  /**
   * Gets the generated code.
   */
  getCode(): string {
    return this.output.join('');
  }
  
  /**
   * Gets the source map.
   */
  getSourceMap(): SourceMap {
    return this.generator.toJSON();
  }
  
  /**
   * Gets the source map generator.
   */
  getGenerator(): SourceMapGenerator {
    return this.generator;
  }
  
  /**
   * Gets code with inline source map.
   */
  getCodeWithInlineSourceMap(): string {
    return this.getCode() + '\n' + this.generator.toInlineSourceMap();
  }
}

// ============================================================================
// STACK TRACE MAPPING
// ============================================================================

/**
 * Parsed stack frame.
 */
export interface ParsedStackFrame {
  functionName: string | undefined;
  fileName: string | undefined;
  lineNumber: number;
  columnNumber: number;
  isNative?: boolean;
  isEval?: boolean;
  original?: ParsedStackFrame;
}

/**
 * Parses a stack trace line.
 */
export function parseStackFrame(line: string): ParsedStackFrame | null {
  // V8 format: "    at functionName (fileName:lineNumber:columnNumber)"
  const v8Match = line.match(/^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
  if (v8Match && v8Match[2] && v8Match[3] && v8Match[4]) {
    return {
      functionName: v8Match[1] || undefined,
      fileName: v8Match[2] || undefined,
      lineNumber: parseInt(v8Match[3], 10),
      columnNumber: parseInt(v8Match[4], 10),
    };
  }
  
  // Firefox/Safari format: "functionName@fileName:lineNumber:columnNumber"
  const ffMatch = line.match(/^(.+)?@(.+?):(\d+):(\d+)$/);
  if (ffMatch && ffMatch[2] && ffMatch[3] && ffMatch[4]) {
    return {
      functionName: ffMatch[1] || undefined,
      fileName: ffMatch[2] || undefined,
      lineNumber: parseInt(ffMatch[3], 10),
      columnNumber: parseInt(ffMatch[4], 10),
    };
  }
  
  return null;
}

/**
 * Maps a stack trace using source maps.
 */
export function mapStackTrace(
  stack: string,
  consumers: Map<string, SourceMapConsumer>
): string {
  const lines = stack.split('\n');
  const mappedLines: string[] = [];
  
  for (const line of lines) {
    const frame = parseStackFrame(line);
    
    if (!frame || !frame.fileName || !frame.lineNumber) {
      mappedLines.push(line);
      continue;
    }
    
    const consumer = consumers.get(frame.fileName);
    if (!consumer) {
      mappedLines.push(line);
      continue;
    }
    
    const original = consumer.originalPositionFor({
      line: frame.lineNumber,
      column: frame.columnNumber ?? 0,
    });
    
    if (original.line === null || original.source === null) {
      mappedLines.push(line);
      continue;
    }
    
    // Format mapped frame
    const funcName = original.name ?? frame.functionName ?? '<anonymous>';
    const mappedLine = `    at ${funcName} (${original.source}:${original.line}:${original.column ?? 0})`;
    mappedLines.push(mappedLine);
  }
  
  return mappedLines.join('\n');
}

/**
 * Creates a source map error with mapped stack.
 */
export class MappedError extends Error {
  readonly originalStack: string;
  
  constructor(
    message: string,
    stack: string,
    consumers: Map<string, SourceMapConsumer>
  ) {
    super(message);
    this.name = 'MappedError';
    this.originalStack = stack;
    this.stack = `${this.name}: ${message}\n${mapStackTrace(stack, consumers)}`;
  }
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export const _testing = {
  encodeVLQ,
  decodeVLQ,
  encodeVLQs,
  BASE64_CHARS,
};
