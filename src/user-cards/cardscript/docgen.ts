/**
 * CardScript Documentation Generator
 * 
 * Generates documentation from CardScript source code and AST.
 * Features include:
 * - JSDoc-style comment extraction
 * - Automatic type documentation
 * - Card/Deck reference generation
 * - Markdown output format
 * - HTML output format
 * - API reference generation
 * - Cross-reference linking
 * 
 * @module cardscript/docgen
 */

import type { SourceSpan } from './grammar';
import { parse } from './parser';
import * as AST from './ast';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Documentation entry for a documented item.
 */
export interface DocEntry {
  /** Entry kind */
  kind: 'card' | 'deck' | 'function' | 'type' | 'const' | 'param' | 'port';
  /** Name of the item */
  name: string;
  /** Brief description */
  description: string;
  /** Detailed description */
  details?: string;
  /** Source location */
  location?: SourceSpan;
  /** Item signature */
  signature?: string;
  /** Type information */
  type?: string;
  /** Parameters (for functions/cards) */
  params?: DocParam[];
  /** Return type */
  returns?: DocReturn;
  /** Input ports (for cards) */
  inputs?: DocPort[];
  /** Output ports (for cards) */
  outputs?: DocPort[];
  /** Examples */
  examples?: DocExample[];
  /** See also references */
  seeAlso?: string[];
  /** Deprecation notice */
  deprecated?: string;
  /** Since version */
  since?: string;
  /** Tags */
  tags?: string[];
  /** Child entries (for nested items) */
  children?: DocEntry[];
}

/**
 * Parameter documentation.
 */
export interface DocParam {
  name: string;
  type?: string;
  description: string;
  default?: string;
  optional?: boolean;
}

/**
 * Return type documentation.
 */
export interface DocReturn {
  type: string;
  description: string;
}

/**
 * Port documentation.
 */
export interface DocPort {
  name: string;
  type: string;
  description: string;
}

/**
 * Example code.
 */
export interface DocExample {
  title?: string;
  code: string;
  description?: string;
}

/**
 * Parsed documentation comment.
 */
export interface DocComment {
  description: string;
  tags: Map<string, string[]>;
}

/**
 * Documentation options.
 */
export interface DocGenOptions {
  /** Include private items */
  includePrivate?: boolean;
  /** Include source locations */
  includeLocations?: boolean;
  /** Include examples */
  includeExamples?: boolean;
  /** Output format */
  format?: 'markdown' | 'html' | 'json';
  /** Base URL for links */
  baseUrl?: string;
  /** Project name */
  projectName?: string;
  /** Project version */
  version?: string;
}

/**
 * Documentation generation result.
 */
export interface DocGenResult {
  /** All documentation entries */
  entries: DocEntry[];
  /** Table of contents */
  toc: TocEntry[];
  /** Output text */
  output: string;
}

/**
 * Table of contents entry.
 */
export interface TocEntry {
  title: string;
  anchor: string;
  level: number;
  children?: TocEntry[];
}

// ============================================================================
// DOC COMMENT PARSER
// ============================================================================

/**
 * Parses a documentation comment (JSDoc-style).
 */
export function parseDocComment(comment: string): DocComment {
  const result: DocComment = {
    description: '',
    tags: new Map(),
  };
  
  // Remove comment delimiters
  let text = comment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .replace(/^\s*\*\s?/gm, '')
    .trim();
  
  // Split into lines
  const lines = text.split('\n');
  const descLines: string[] = [];
  let currentTag: string | null = null;
  let tagContent: string[] = [];
  
  for (const line of lines) {
    const tagMatch = line.match(/^@(\w+)\s*(.*)/);
    
    if (tagMatch && tagMatch[1] !== undefined) {
      // Save previous tag
      if (currentTag) {
        addTag(result.tags, currentTag, tagContent.join('\n').trim());
      }
      
      currentTag = tagMatch[1];
      tagContent = [tagMatch[2] ?? ''];
    } else if (currentTag) {
      tagContent.push(line);
    } else {
      descLines.push(line);
    }
  }
  
  // Save last tag
  if (currentTag) {
    addTag(result.tags, currentTag, tagContent.join('\n').trim());
  }
  
  result.description = descLines.join('\n').trim();
  
  return result;
}

/**
 * Adds a tag value to the tag map.
 */
function addTag(tags: Map<string, string[]>, tag: string, value: string): void {
  const existing = tags.get(tag);
  if (existing) {
    existing.push(value);
  } else {
    tags.set(tag, [value]);
  }
}

/**
 * Extracts the leading comment for a node.
 */
export function extractLeadingComment(source: string, span: SourceSpan): string | null {
  // Find the position before the node
  const lines = source.split('\n');
  let lineIndex = span.start.line - 2; // Line before the node (0-indexed)
  
  if (lineIndex < 0) return null;
  
  const comments: string[] = [];
  
  // Walk backwards looking for comment lines
  while (lineIndex >= 0 && lineIndex < lines.length) {
    const currentLine = lines[lineIndex];
    if (currentLine === undefined) break;
    const line = currentLine.trim();
    
    if (line.startsWith('/**')) {
      // Found start of doc comment
      comments.unshift(line);
      break;
    } else if (line.startsWith('*') || line.startsWith('//')) {
      comments.unshift(line);
    } else if (line === '') {
      // Empty line - continue looking
    } else {
      // Non-comment content - stop
      break;
    }
    
    lineIndex--;
  }
  
  if (comments.length === 0) return null;
  
  return comments.join('\n');
}

// ============================================================================
// AST DOCUMENTATION EXTRACTION
// ============================================================================

/**
 * Extracts documentation from an AST.
 */
export function extractDocs(
  program: AST.Program,
  source: string,
  options: DocGenOptions = {}
): DocEntry[] {
  const entries: DocEntry[] = [];
  
  for (const item of program.body) {
    const entry = extractItemDoc(item, source, options);
    if (entry) {
      entries.push(entry);
    }
  }
  
  return entries;
}

/**
 * Extracts documentation from a declaration or statement.
 */
function extractItemDoc(
  item: AST.Declaration | AST.Statement,
  source: string,
  options: DocGenOptions
): DocEntry | null {
  switch (item.kind) {
    case 'CardDeclaration':
      return extractCardDoc(item as AST.CardDeclaration, source, options);
    case 'FunctionDeclaration':
      return extractFunctionDoc(item as AST.FunctionDeclaration, source, options);
    case 'TypeDeclaration':
      return extractTypeDoc(item as AST.TypeDeclaration, source, options);
    case 'ConstDeclaration':
      return extractConstDoc(item as AST.ConstDeclaration, source, options);
    default:
      return null;
  }
}

/**
 * Extracts documentation from a card declaration.
 */
function extractCardDoc(
  card: AST.CardDeclaration,
  source: string,
  options: DocGenOptions
): DocEntry {
  const comment = extractLeadingComment(source, card.span);
  const doc = comment ? parseDocComment(comment) : null;
  
  const inputs: DocPort[] = [];
  const outputs: DocPort[] = [];
  const params: DocParam[] = [];
  
  // Extract members - looking at card member types
  for (const member of card.members) {
    if (member.kind === 'InputsBlock') {
      const inputsBlock = member as AST.InputsBlock;
      for (const port of inputsBlock.ports) {
        inputs.push({
          name: port.name,
          type: port.type ? typeNodeToString(port.type) : 'unknown',
          description: extractPortDescription(doc, 'input', port.name),
        });
      }
    } else if (member.kind === 'OutputsBlock') {
      const outputsBlock = member as AST.OutputsBlock;
      for (const port of outputsBlock.ports) {
        outputs.push({
          name: port.name,
          type: port.type ? typeNodeToString(port.type) : 'unknown',
          description: extractPortDescription(doc, 'output', port.name),
        });
      }
    } else if (member.kind === 'ParamsBlock') {
      const paramsBlock = member as AST.ParamsBlock;
      for (const param of paramsBlock.params) {
        const paramEntry: DocParam = {
          name: param.name,
          type: param.type ? typeNodeToString(param.type) : 'unknown',
          description: extractParamDescription(doc, param.name),
        };
        if (param.defaultValue) {
          paramEntry.default = expressionToString(param.defaultValue);
        }
        params.push(paramEntry);
      }
    }
  }
  
  const entry: DocEntry = {
    kind: 'card',
    name: card.name,
    description: doc?.description || '',
    signature: `card ${card.name}`,
    inputs,
    outputs,
    params,
  };
  const details = doc?.tags.get('details')?.[0];
  if (details !== undefined) entry.details = details;
  if (options.includeLocations) entry.location = card.span;
  const examples = options.includeExamples ? extractExamples(doc) : undefined;
  if (examples !== undefined) entry.examples = examples;
  const seeAlso = doc?.tags.get('see');
  if (seeAlso !== undefined) entry.seeAlso = seeAlso;
  const deprecated = doc?.tags.get('deprecated')?.[0];
  if (deprecated !== undefined) entry.deprecated = deprecated;
  const since = doc?.tags.get('since')?.[0];
  if (since !== undefined) entry.since = since;
  const tagsStr = doc?.tags.get('tags')?.[0];
  if (tagsStr !== undefined) entry.tags = tagsStr.split(',').map(t => t.trim());
  return entry;
}

/**
 * Extracts documentation from a function declaration.
 */
function extractFunctionDoc(
  func: AST.FunctionDeclaration,
  source: string,
  options: DocGenOptions
): DocEntry {
  const comment = extractLeadingComment(source, func.span);
  const doc = comment ? parseDocComment(comment) : null;
  
  const params: DocParam[] = func.params.map(p => {
    const paramEntry: DocParam = {
      name: p.name,
      type: p.type ? typeNodeToString(p.type) : 'unknown',
      description: extractParamDescription(doc, p.name),
    };
    if (p.defaultValue) {
      paramEntry.default = expressionToString(p.defaultValue);
      paramEntry.optional = true;
    }
    return paramEntry;
  });
  
  const returns: DocReturn | undefined = func.returnType ? {
    type: typeNodeToString(func.returnType),
    description: doc?.tags.get('returns')?.[0] || '',
  } : undefined;
  
  const signature = `fn ${func.name}(${func.params.map(p => 
    `${p.name}: ${p.type ? typeNodeToString(p.type) : 'unknown'}`
  ).join(', ')})${func.returnType ? `: ${typeNodeToString(func.returnType)}` : ''}`;
  
  const entry: DocEntry = {
    kind: 'function',
    name: func.name,
    description: doc?.description || '',
    signature,
    params,
  };
  const details = doc?.tags.get('details')?.[0];
  if (details !== undefined) entry.details = details;
  if (options.includeLocations) entry.location = func.span;
  if (returns !== undefined) entry.returns = returns;
  const examples = options.includeExamples ? extractExamples(doc) : undefined;
  if (examples !== undefined) entry.examples = examples;
  const seeAlso = doc?.tags.get('see');
  if (seeAlso !== undefined) entry.seeAlso = seeAlso;
  const deprecated = doc?.tags.get('deprecated')?.[0];
  if (deprecated !== undefined) entry.deprecated = deprecated;
  const since = doc?.tags.get('since')?.[0];
  if (since !== undefined) entry.since = since;
  return entry;
}

/**
 * Extracts documentation from a type declaration.
 */
function extractTypeDoc(
  type: AST.TypeDeclaration,
  source: string,
  options: DocGenOptions
): DocEntry {
  const comment = extractLeadingComment(source, type.span);
  const doc = comment ? parseDocComment(comment) : null;
  
  const entry: DocEntry = {
    kind: 'type',
    name: type.name,
    description: doc?.description || '',
    signature: `type ${type.name} = ${typeNodeToString(type.type)}`,
    type: typeNodeToString(type.type),
  };
  const details = doc?.tags.get('details')?.[0];
  if (details !== undefined) entry.details = details;
  if (options.includeLocations) entry.location = type.span;
  const examples = options.includeExamples ? extractExamples(doc) : undefined;
  if (examples !== undefined) entry.examples = examples;
  const seeAlso = doc?.tags.get('see');
  if (seeAlso !== undefined) entry.seeAlso = seeAlso;
  const deprecated = doc?.tags.get('deprecated')?.[0];
  if (deprecated !== undefined) entry.deprecated = deprecated;
  const since = doc?.tags.get('since')?.[0];
  if (since !== undefined) entry.since = since;
  return entry;
}

/**
 * Extracts documentation from a const declaration.
 */
function extractConstDoc(
  decl: AST.ConstDeclaration,
  source: string,
  options: DocGenOptions
): DocEntry {
  const comment = extractLeadingComment(source, decl.span);
  const doc = comment ? parseDocComment(comment) : null;
  
  const entry: DocEntry = {
    kind: 'const',
    name: decl.name,
    description: doc?.description || '',
    signature: `const ${decl.name}${decl.type ? `: ${typeNodeToString(decl.type)}` : ''} = ${expressionToString(decl.initializer)}`,
  };
  const details = doc?.tags.get('details')?.[0];
  if (details !== undefined) entry.details = details;
  if (options.includeLocations) entry.location = decl.span;
  if (decl.type) entry.type = typeNodeToString(decl.type);
  const examples = options.includeExamples ? extractExamples(doc) : undefined;
  if (examples !== undefined) entry.examples = examples;
  const seeAlso = doc?.tags.get('see');
  if (seeAlso !== undefined) entry.seeAlso = seeAlso;
  const deprecated = doc?.tags.get('deprecated')?.[0];
  if (deprecated !== undefined) entry.deprecated = deprecated;
  const since = doc?.tags.get('since')?.[0];
  if (since !== undefined) entry.since = since;
  return entry;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converts an AST type node to a string.
 */
function typeNodeToString(type: AST.TypeNode): string {
  switch (type.kind) {
    case 'TypeReference':
      return (type as AST.TypeReference).name;
    case 'ArrayType':
      return `${typeNodeToString((type as AST.ArrayType).elementType)}[]`;
    case 'UnionType':
      return (type as AST.UnionType).types.map(typeNodeToString).join(' | ');
    case 'FunctionType': {
      const ft = type as AST.FunctionType;
      const paramStrs = ft.paramTypes.map((t, i) => `arg${i}: ${typeNodeToString(t)}`);
      return `(${paramStrs.join(', ')}) => ${typeNodeToString(ft.returnType)}`;
    }
    case 'ObjectType': {
      const ot = type as AST.ObjectType;
      const props = ot.properties.map(p => `${p.name}: ${typeNodeToString(p.type)}`);
      return `{ ${props.join('; ')} }`;
    }
    case 'GenericType': {
      const gt = type as AST.GenericType;
      return `${gt.name}<${gt.typeArguments.map(typeNodeToString).join(', ')}>`;
    }
    case 'OptionalType':
      return `${typeNodeToString((type as AST.OptionalType).baseType)}?`;
    case 'IntersectionType':
      return (type as AST.IntersectionType).types.map(typeNodeToString).join(' & ');
    default:
      return 'unknown';
  }
}

/**
 * Converts an expression to a string representation.
 */
function expressionToString(expr: AST.Expression): string {
  switch (expr.kind) {
    case 'NumberLiteral':
      return String((expr as AST.NumberLiteral).value);
    case 'StringLiteral':
      return `"${(expr as AST.StringLiteral).value}"`;
    case 'BooleanLiteral':
      return String((expr as AST.BooleanLiteral).value);
    case 'NullLiteral':
      return 'null';
    case 'Identifier':
      return (expr as AST.Identifier).name;
    case 'ArrayLiteral':
      return `[${(expr as AST.ArrayLiteral).elements.map(expressionToString).join(', ')}]`;
    case 'ObjectLiteral': {
      const obj = expr as AST.ObjectLiteral;
      const props = obj.properties.map(p => `${p.key}: ${expressionToString(p.value)}`);
      return `{ ${props.join(', ')} }`;
    }
    default:
      return '...';
  }
}

/**
 * Extracts param description from doc comment.
 */
function extractParamDescription(doc: DocComment | null, name: string): string {
  if (!doc) return '';
  
  const params = doc.tags.get('param') || [];
  for (const param of params) {
    const match = param.match(/^(\w+)\s+([\s\S]*)/);
    if (match && match[1] === name) {
      return match[2] ?? '';
    }
  }
  
  return '';
}

/**
 * Extracts port description from doc comment.
 */
function extractPortDescription(doc: DocComment | null, portKind: 'input' | 'output', name: string): string {
  if (!doc) return '';
  
  const ports = doc.tags.get(portKind) || [];
  for (const port of ports) {
    const match = port.match(/^(\w+)\s+([\s\S]*)/);
    if (match && match[1] === name) {
      return match[2] ?? '';
    }
  }
  
  return '';
}

/**
 * Extracts examples from doc comment.
 */
function extractExamples(doc: DocComment | null): DocExample[] | undefined {
  if (!doc) return undefined;
  
  const examples = doc.tags.get('example');
  if (!examples || examples.length === 0) return undefined;
  
  return examples.map(e => {
    const lines = e.trim().split('\n');
    const firstLine = lines[0];
    
    if (firstLine && !firstLine.includes('{') && !firstLine.includes('(') && lines.length > 1) {
      // First line might be a title
      return {
        title: firstLine,
        code: lines.slice(1).join('\n').trim(),
      };
    }
    
    return { code: e.trim() };
  });
}

// ============================================================================
// OUTPUT GENERATION
// ============================================================================

/**
 * Generates documentation output.
 */
export function generateDocs(
  entries: DocEntry[],
  options: DocGenOptions = {}
): DocGenResult {
  const format = options.format || 'markdown';
  const toc = generateToc(entries);
  
  let output: string;
  switch (format) {
    case 'html':
      output = generateHtml(entries, toc, options);
      break;
    case 'json':
      output = JSON.stringify({ entries, toc }, null, 2);
      break;
    default:
      output = generateMarkdown(entries, toc, options);
  }
  
  return { entries, toc, output };
}

/**
 * Generates table of contents.
 */
function generateToc(entries: DocEntry[]): TocEntry[] {
  const toc: TocEntry[] = [];
  
  // Group by kind
  const cards = entries.filter(e => e.kind === 'card');
  const functions = entries.filter(e => e.kind === 'function');
  const types = entries.filter(e => e.kind === 'type');
  const consts = entries.filter(e => e.kind === 'const');
  
  if (cards.length > 0) {
    toc.push({
      title: 'Cards',
      anchor: 'cards',
      level: 1,
      children: cards.map(e => ({
        title: e.name,
        anchor: `card-${toAnchor(e.name)}`,
        level: 2,
      })),
    });
  }
  
  if (functions.length > 0) {
    toc.push({
      title: 'Functions',
      anchor: 'functions',
      level: 1,
      children: functions.map(e => ({
        title: e.name,
        anchor: `function-${toAnchor(e.name)}`,
        level: 2,
      })),
    });
  }
  
  if (types.length > 0) {
    toc.push({
      title: 'Types',
      anchor: 'types',
      level: 1,
      children: types.map(e => ({
        title: e.name,
        anchor: `type-${toAnchor(e.name)}`,
        level: 2,
      })),
    });
  }
  
  if (consts.length > 0) {
    toc.push({
      title: 'Constants',
      anchor: 'constants',
      level: 1,
      children: consts.map(e => ({
        title: e.name,
        anchor: `const-${toAnchor(e.name)}`,
        level: 2,
      })),
    });
  }
  
  return toc;
}

/**
 * Converts a name to an anchor-safe string.
 */
function toAnchor(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// ============================================================================
// MARKDOWN GENERATION
// ============================================================================

/**
 * Generates Markdown documentation.
 */
function generateMarkdown(entries: DocEntry[], toc: TocEntry[], options: DocGenOptions): string {
  const lines: string[] = [];
  
  // Header
  if (options.projectName) {
    lines.push(`# ${options.projectName} API Reference`);
    lines.push('');
    if (options.version) {
      lines.push(`Version: ${options.version}`);
      lines.push('');
    }
  } else {
    lines.push('# CardScript API Reference');
    lines.push('');
  }
  
  // Table of contents
  lines.push('## Table of Contents');
  lines.push('');
  for (const section of toc) {
    lines.push(`- [${section.title}](#${section.anchor})`);
    if (section.children) {
      for (const child of section.children) {
        lines.push(`  - [${child.title}](#${child.anchor})`);
      }
    }
  }
  lines.push('');
  
  // Group entries by kind
  const cards = entries.filter(e => e.kind === 'card');
  const functions = entries.filter(e => e.kind === 'function');
  const types = entries.filter(e => e.kind === 'type');
  const consts = entries.filter(e => e.kind === 'const');
  
  // Cards section
  if (cards.length > 0) {
    lines.push('## Cards');
    lines.push('');
    for (const card of cards) {
      lines.push(...generateMarkdownEntry(card));
    }
  }
  
  // Functions section
  if (functions.length > 0) {
    lines.push('## Functions');
    lines.push('');
    for (const func of functions) {
      lines.push(...generateMarkdownEntry(func));
    }
  }
  
  // Types section
  if (types.length > 0) {
    lines.push('## Types');
    lines.push('');
    for (const type of types) {
      lines.push(...generateMarkdownEntry(type));
    }
  }
  
  // Constants section
  if (consts.length > 0) {
    lines.push('## Constants');
    lines.push('');
    for (const c of consts) {
      lines.push(...generateMarkdownEntry(c));
    }
  }
  
  return lines.join('\n');
}

/**
 * Generates Markdown for a single entry.
 */
function generateMarkdownEntry(entry: DocEntry): string[] {
  const lines: string[] = [];
  
  // Header
  lines.push(`### ${entry.name}`);
  lines.push('');
  
  // Badges
  const badges: string[] = [];
  if (entry.deprecated) {
    badges.push('⚠️ Deprecated');
  }
  if (entry.since) {
    badges.push(`📦 Since ${entry.since}`);
  }
  if (badges.length > 0) {
    lines.push(badges.join(' | '));
    lines.push('');
  }
  
  // Signature
  if (entry.signature) {
    lines.push('```cardscript');
    lines.push(entry.signature);
    lines.push('```');
    lines.push('');
  }
  
  // Description
  if (entry.description) {
    lines.push(entry.description);
    lines.push('');
  }
  
  // Deprecation notice
  if (entry.deprecated) {
    lines.push(`> ⚠️ **Deprecated:** ${entry.deprecated}`);
    lines.push('');
  }
  
  // Inputs (for cards)
  if (entry.inputs && entry.inputs.length > 0) {
    lines.push('#### Inputs');
    lines.push('');
    lines.push('| Name | Type | Description |');
    lines.push('|------|------|-------------|');
    for (const input of entry.inputs) {
      lines.push(`| \`${input.name}\` | \`${input.type}\` | ${input.description} |`);
    }
    lines.push('');
  }
  
  // Outputs (for cards)
  if (entry.outputs && entry.outputs.length > 0) {
    lines.push('#### Outputs');
    lines.push('');
    lines.push('| Name | Type | Description |');
    lines.push('|------|------|-------------|');
    for (const output of entry.outputs) {
      lines.push(`| \`${output.name}\` | \`${output.type}\` | ${output.description} |`);
    }
    lines.push('');
  }
  
  // Parameters
  if (entry.params && entry.params.length > 0) {
    lines.push('#### Parameters');
    lines.push('');
    lines.push('| Name | Type | Default | Description |');
    lines.push('|------|------|---------|-------------|');
    for (const param of entry.params) {
      const opt = param.optional ? '?' : '';
      const def = param.default || '-';
      lines.push(`| \`${param.name}${opt}\` | \`${param.type}\` | ${def} | ${param.description} |`);
    }
    lines.push('');
  }
  
  // Returns
  if (entry.returns) {
    lines.push('#### Returns');
    lines.push('');
    lines.push(`\`${entry.returns.type}\` - ${entry.returns.description}`);
    lines.push('');
  }
  
  // Examples
  if (entry.examples && entry.examples.length > 0) {
    lines.push('#### Examples');
    lines.push('');
    for (const example of entry.examples) {
      if (example.title) {
        lines.push(`**${example.title}**`);
        lines.push('');
      }
      lines.push('```cardscript');
      lines.push(example.code);
      lines.push('```');
      lines.push('');
    }
  }
  
  // See also
  if (entry.seeAlso && entry.seeAlso.length > 0) {
    lines.push('#### See Also');
    lines.push('');
    for (const ref of entry.seeAlso) {
      lines.push(`- ${ref}`);
    }
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  
  return lines;
}

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generates HTML documentation.
 */
function generateHtml(entries: DocEntry[], toc: TocEntry[], options: DocGenOptions): string {
  const title = options.projectName ? `${options.projectName} API Reference` : 'CardScript API Reference';
  
  const html: string[] = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${escapeHtml(title)}</title>`,
    '  <style>',
    getDocStyles(),
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="container">',
    `    <h1>${escapeHtml(title)}</h1>`,
  ];
  
  if (options.version) {
    html.push(`    <p class="version">Version: ${escapeHtml(options.version)}</p>`);
  }
  
  // Navigation
  html.push('    <nav class="toc">');
  html.push('      <h2>Table of Contents</h2>');
  html.push('      <ul>');
  for (const section of toc) {
    html.push(`        <li><a href="#${section.anchor}">${escapeHtml(section.title)}</a>`);
    if (section.children && section.children.length > 0) {
      html.push('          <ul>');
      for (const child of section.children) {
        html.push(`            <li><a href="#${child.anchor}">${escapeHtml(child.title)}</a></li>`);
      }
      html.push('          </ul>');
    }
    html.push('        </li>');
  }
  html.push('      </ul>');
  html.push('    </nav>');
  
  // Main content
  html.push('    <main>');
  
  // Group entries by kind
  const cards = entries.filter(e => e.kind === 'card');
  const functions = entries.filter(e => e.kind === 'function');
  const types = entries.filter(e => e.kind === 'type');
  const consts = entries.filter(e => e.kind === 'const');
  
  if (cards.length > 0) {
    html.push('      <section id="cards">');
    html.push('        <h2>Cards</h2>');
    for (const card of cards) {
      html.push(...generateHtmlEntry(card));
    }
    html.push('      </section>');
  }
  
  if (functions.length > 0) {
    html.push('      <section id="functions">');
    html.push('        <h2>Functions</h2>');
    for (const func of functions) {
      html.push(...generateHtmlEntry(func));
    }
    html.push('      </section>');
  }
  
  if (types.length > 0) {
    html.push('      <section id="types">');
    html.push('        <h2>Types</h2>');
    for (const type of types) {
      html.push(...generateHtmlEntry(type));
    }
    html.push('      </section>');
  }
  
  if (consts.length > 0) {
    html.push('      <section id="constants">');
    html.push('        <h2>Constants</h2>');
    for (const c of consts) {
      html.push(...generateHtmlEntry(c));
    }
    html.push('      </section>');
  }
  
  html.push('    </main>');
  html.push('  </div>');
  html.push('</body>');
  html.push('</html>');
  
  return html.join('\n');
}

/**
 * Generates HTML for a single entry.
 */
function generateHtmlEntry(entry: DocEntry): string[] {
  const lines: string[] = [];
  const anchor = `${entry.kind}-${toAnchor(entry.name)}`;
  
  lines.push(`        <article id="${anchor}" class="entry entry-${entry.kind}">`);
  lines.push(`          <h3>${escapeHtml(entry.name)}</h3>`);
  
  // Badges
  if (entry.deprecated || entry.since) {
    lines.push('          <div class="badges">');
    if (entry.deprecated) {
      lines.push('            <span class="badge badge-deprecated">Deprecated</span>');
    }
    if (entry.since) {
      lines.push(`            <span class="badge badge-since">Since ${escapeHtml(entry.since)}</span>`);
    }
    lines.push('          </div>');
  }
  
  // Signature
  if (entry.signature) {
    lines.push('          <pre class="signature"><code>' + escapeHtml(entry.signature) + '</code></pre>');
  }
  
  // Description
  if (entry.description) {
    lines.push(`          <p class="description">${escapeHtml(entry.description)}</p>`);
  }
  
  // Deprecation notice
  if (entry.deprecated) {
    lines.push(`          <div class="deprecation-notice">⚠️ <strong>Deprecated:</strong> ${escapeHtml(entry.deprecated)}</div>`);
  }
  
  // Inputs
  if (entry.inputs && entry.inputs.length > 0) {
    lines.push('          <h4>Inputs</h4>');
    lines.push('          <table class="params-table">');
    lines.push('            <tr><th>Name</th><th>Type</th><th>Description</th></tr>');
    for (const input of entry.inputs) {
      lines.push(`            <tr><td><code>${escapeHtml(input.name)}</code></td><td><code>${escapeHtml(input.type)}</code></td><td>${escapeHtml(input.description)}</td></tr>`);
    }
    lines.push('          </table>');
  }
  
  // Outputs
  if (entry.outputs && entry.outputs.length > 0) {
    lines.push('          <h4>Outputs</h4>');
    lines.push('          <table class="params-table">');
    lines.push('            <tr><th>Name</th><th>Type</th><th>Description</th></tr>');
    for (const output of entry.outputs) {
      lines.push(`            <tr><td><code>${escapeHtml(output.name)}</code></td><td><code>${escapeHtml(output.type)}</code></td><td>${escapeHtml(output.description)}</td></tr>`);
    }
    lines.push('          </table>');
  }
  
  // Parameters
  if (entry.params && entry.params.length > 0) {
    lines.push('          <h4>Parameters</h4>');
    lines.push('          <table class="params-table">');
    lines.push('            <tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>');
    for (const param of entry.params) {
      const opt = param.optional ? '?' : '';
      const def = param.default || '-';
      lines.push(`            <tr><td><code>${escapeHtml(param.name)}${opt}</code></td><td><code>${escapeHtml(param.type || 'unknown')}</code></td><td>${escapeHtml(def)}</td><td>${escapeHtml(param.description)}</td></tr>`);
    }
    lines.push('          </table>');
  }
  
  // Returns
  if (entry.returns) {
    lines.push('          <h4>Returns</h4>');
    lines.push(`          <p><code>${escapeHtml(entry.returns.type)}</code> - ${escapeHtml(entry.returns.description)}</p>`);
  }
  
  // Examples
  if (entry.examples && entry.examples.length > 0) {
    lines.push('          <h4>Examples</h4>');
    for (const example of entry.examples) {
      if (example.title) {
        lines.push(`          <p><strong>${escapeHtml(example.title)}</strong></p>`);
      }
      lines.push('          <pre class="example"><code>' + escapeHtml(example.code) + '</code></pre>');
    }
  }
  
  lines.push('        </article>');
  
  return lines;
}

/**
 * Gets CSS styles for documentation.
 */
function getDocStyles(): string {
  return `
    :root {
      --bg: #1a1a2e;
      --fg: #eaeaea;
      --accent: #4fc3f7;
      --muted: #888;
      --border: #333;
      --code-bg: #252540;
    }
    
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1, h2, h3, h4 {
      color: var(--accent);
    }
    
    a {
      color: var(--accent);
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    pre {
      background: var(--code-bg);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    .toc {
      background: var(--code-bg);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    
    .toc ul {
      list-style: none;
      padding-left: 16px;
    }
    
    .toc > ul {
      padding-left: 0;
    }
    
    .entry {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    
    .badges {
      margin-bottom: 12px;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      margin-right: 8px;
    }
    
    .badge-deprecated {
      background: #ff5252;
      color: white;
    }
    
    .badge-since {
      background: var(--accent);
      color: #1a1a2e;
    }
    
    .params-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    
    .params-table th,
    .params-table td {
      text-align: left;
      padding: 8px 12px;
      border: 1px solid var(--border);
    }
    
    .params-table th {
      background: var(--code-bg);
    }
    
    .deprecation-notice {
      background: rgba(255, 82, 82, 0.2);
      border-left: 4px solid #ff5252;
      padding: 12px;
      border-radius: 0 8px 8px 0;
      margin: 12px 0;
    }
    
    .signature {
      background: var(--code-bg);
      border-left: 4px solid var(--accent);
    }
    
    .version {
      color: var(--muted);
      font-style: italic;
    }
  `;
}

/**
 * Escapes HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Generates documentation from source code.
 */
export function generateDocsFromSource(
  source: string,
  options: DocGenOptions = {}
): DocGenResult {
  const parseResult = parse(source);
  
  if (!parseResult.success) {
    return {
      entries: [],
      toc: [],
      output: `Error: Failed to parse source code\n${parseResult.errors.map(e => e.message).join('\n')}`,
    };
  }
  
  const entries = extractDocs(parseResult.ast, source, options);
  return generateDocs(entries, options);
}

/**
 * Generates documentation for multiple source files.
 */
export function generateDocsFromSources(
  sources: Array<{ filename: string; source: string }>,
  options: DocGenOptions = {}
): DocGenResult {
  const allEntries: DocEntry[] = [];
  
  for (const { filename, source } of sources) {
    const parseResult = parse(source, filename);
    
    if (parseResult.success) {
      const entries = extractDocs(parseResult.ast, source, options);
      allEntries.push(...entries);
    }
  }
  
  return generateDocs(allEntries, options);
}

/**
 * Creates a documentation generator.
 */
export function createDocGenerator(options: DocGenOptions = {}): {
  addSource: (source: string, filename?: string) => void;
  generate: () => DocGenResult;
} {
  const sources: Array<{ filename: string; source: string }> = [];
  
  return {
    addSource(source: string, filename: string = 'source.cs') {
      sources.push({ filename, source });
    },
    generate() {
      return generateDocsFromSources(sources, options);
    },
  };
}
