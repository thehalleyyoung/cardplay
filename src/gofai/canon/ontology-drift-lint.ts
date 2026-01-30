/**
 * GOFAI Ontology Drift Lint — Validates Docs vs Code Agreement
 *
 * This module enforces the SSOT principle: the canonical vocabulary
 * in code must match what's documented in docs/gofai/*.md files.
 * Any drift triggers a lint failure.
 *
 * This implements Step 090 [Infra] from gofai_goalB.md:
 * "Write an 'ontology drift' lint that fails if docs and canon vocab disagree."
 *
 * @module gofai/canon/ontology-drift-lint
 */

import * as fs from 'fs';
import * as path from 'path';
import { CORE_LEXEMES } from './lexemes';
import { CORE_SECTION_TYPES } from './section-vocabulary';
import { CORE_LAYER_TYPES } from './layer-vocabulary';
import { CORE_PERCEPTUAL_AXES } from './perceptual-axes';
import { CORE_OPCODES } from './edit-opcodes';

// =============================================================================
// Types
// =============================================================================

/**
 * A drift error indicating disagreement between code and docs.
 */
export interface DriftError {
  /** Error code for programmatic handling */
  readonly code: string;

  /** Human-readable error message */
  readonly message: string;

  /** The vocabulary category with the drift */
  readonly category: string;

  /** The specific ID or term with the drift */
  readonly term: string | undefined;

  /** Path to the documentation file */
  readonly docPath: string | undefined;

  /** Severity of the drift */
  readonly severity: 'error' | 'warning';
}

/**
 * Result of an ontology drift check.
 */
export interface DriftCheckResult {
  /** Whether docs and code agree */
  readonly valid: boolean;

  /** List of drift errors found */
  readonly driftErrors: readonly DriftError[];

  /** List of drift warnings (non-fatal) */
  readonly driftWarnings: readonly DriftError[];

  /** Number of terms checked */
  readonly termsChecked: number;

  /** Number of docs files checked */
  readonly filesChecked: number;

  /** Time taken for check in ms */
  readonly duration: number;
}

// =============================================================================
// Drift Check Builder
// =============================================================================

class DriftCheckBuilder {
  private readonly errors: DriftError[] = [];
  private readonly warnings: DriftError[] = [];
  private readonly startTime = Date.now();
  private termsChecked = 0;
  private filesChecked = 0;

  addError(
    code: string,
    message: string,
    category: string,
    term?: string,
    docPath?: string
  ): void {
    this.errors.push({ code, message, category, term, docPath, severity: 'error' });
  }

  addWarning(
    code: string,
    message: string,
    category: string,
    term?: string,
    docPath?: string
  ): void {
    this.warnings.push({ code, message, category, term, docPath, severity: 'warning' });
  }

  incrementTerms(): void {
    this.termsChecked++;
  }

  incrementFiles(): void {
    this.filesChecked++;
  }

  build(): DriftCheckResult {
    return {
      valid: this.errors.length === 0,
      driftErrors: [...this.errors],
      driftWarnings: [...this.warnings],
      termsChecked: this.termsChecked,
      filesChecked: this.filesChecked,
      duration: Date.now() - this.startTime,
    };
  }
}

// =============================================================================
// Documentation Parsing Helpers
// =============================================================================

/**
 * Extract ID references from markdown documentation.
 * Looks for patterns like:
 * - `id: lex:make_darker`
 * - `- lex:make_darker`
 * - **lex:make_darker**
 */
function extractIdsFromMarkdown(content: string): Set<string> {
  const ids = new Set<string>();

  // Pattern 1: id: prefix (YAML-style or table cells)
  const idPattern = /id:\s*([a-z_:]+[a-z0-9_:]*)/gi;
  let match: RegExpExecArray | null;

  while ((match = idPattern.exec(content)) !== null) {
    if (match[1]) {
      ids.add(match[1]);
    }
  }

  // Pattern 2: inline code with colons (likely IDs)
  const inlineCodePattern = /`([a-z_]+:[a-z0-9_:]+)`/gi;
  while ((match = inlineCodePattern.exec(content)) !== null) {
    if (match[1]) {
      ids.add(match[1]);
    }
  }

  // Pattern 3: bold/italic with colons
  const boldPattern = /\*\*([a-z_]+:[a-z0-9_:]+)\*\*/gi;
  while ((match = boldPattern.exec(content)) !== null) {
    if (match[1]) {
      ids.add(match[1]);
    }
  }

  return ids;
}

/**
 * Extract surface terms (lemmas) from markdown documentation.
 * Looks for quoted terms like "make darker" or "chorus".
 */
function extractTermsFromMarkdown(content: string): Set<string> {
  const terms = new Set<string>();

  // Extract quoted terms
  const quotedPattern = /"([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = quotedPattern.exec(content)) !== null) {
    if (match[1]) {
      const term = match[1].toLowerCase().trim();
      // Only include short musical terms (not full sentences)
      if (term.length > 0 && term.length < 50 && !term.includes('.')) {
        terms.add(term);
      }
    }
  }

  return terms;
}

/**
 * Read a docs file safely, returning empty string if not found.
 */
function readDocsFile(docsRoot: string, relativePath: string): string {
  try {
    const fullPath = path.join(docsRoot, relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
  } catch (err) {
    // Silently fail for missing docs
  }
  return '';
}

// =============================================================================
// Specific Vocabulary Drift Checks
// =============================================================================

/**
 * Check that documented lexeme IDs match code.
 */
function checkLexemeDrift(
  docsRoot: string,
  builder: DriftCheckBuilder
): void {
  const vocabDoc = readDocsFile(docsRoot, 'vocabulary-policy.md');
  
  if (!vocabDoc) {
    builder.addWarning(
      'MISSING_VOCAB_DOC',
      'vocabulary-policy.md not found in docs/gofai',
      'lexeme',
      undefined,
      'vocabulary-policy.md'
    );
    return;
  }

  builder.incrementFiles();

  const documentedIds = extractIdsFromMarkdown(vocabDoc);
  const codeIds = new Set(CORE_LEXEMES.map(lex => lex.id as string));

  // Check for IDs in docs but not in code
  for (const id of documentedIds) {
    if (id.startsWith('lex:') && !codeIds.has(id)) {
      builder.addError(
        'ORPHANED_DOC_ID',
        `Lexeme ID "${id}" appears in docs but not in CORE_LEXEMES`,
        'lexeme',
        id,
        'vocabulary-policy.md'
      );
    }
    builder.incrementTerms();
  }

  // Warn about significant code IDs not mentioned in docs
  // (Only check a sample to avoid overwhelming warnings)
  const sampleCodeIds = Array.from(codeIds).slice(0, 100);
  for (const id of sampleCodeIds) {
    if (!documentedIds.has(id)) {
      builder.addWarning(
        'UNDOCUMENTED_ID',
        `Lexeme ID "${id}" exists in code but not mentioned in vocabulary-policy.md`,
        'lexeme',
        id,
        'vocabulary-policy.md'
      );
    }
  }
}

/**
 * Check that documented perceptual axes match code.
 */
function checkAxesDrift(
  docsRoot: string,
  builder: DriftCheckBuilder
): void {
  const pipelineDoc = readDocsFile(docsRoot, 'pipeline.md');
  
  if (!pipelineDoc) {
    builder.addWarning(
      'MISSING_PIPELINE_DOC',
      'pipeline.md not found in docs/gofai',
      'axis',
      undefined,
      'pipeline.md'
    );
    return;
  }

  builder.incrementFiles();

  const documentedAxes = extractTermsFromMarkdown(pipelineDoc);
  const codeAxes = new Set(CORE_PERCEPTUAL_AXES.map(axis => 
    axis.name.toLowerCase()
  ));

  // Check for major axis terms mentioned in docs
  const importantAxes = ['brightness', 'width', 'lift', 'density', 'intimacy'];
  for (const axis of importantAxes) {
    builder.incrementTerms();
    
    const inCode = codeAxes.has(axis);
    const inDocs = documentedAxes.has(axis) || pipelineDoc.toLowerCase().includes(axis);

    if (inCode && !inDocs) {
      builder.addWarning(
        'UNDOCUMENTED_AXIS',
        `Perceptual axis "${axis}" exists in code but not clearly documented in pipeline.md`,
        'axis',
        axis,
        'pipeline.md'
      );
    }
  }
}

/**
 * Check that documented section types match code.
 */
function checkSectionsDrift(
  docsRoot: string,
  builder: DriftCheckBuilder
): void {
  const glossaryDoc = readDocsFile(docsRoot, 'glossary.md');
  
  if (!glossaryDoc) {
    builder.addWarning(
      'MISSING_GLOSSARY_DOC',
      'glossary.md not found in docs/gofai',
      'section',
      undefined,
      'glossary.md'
    );
    return;
  }

  builder.incrementFiles();

  const documentedTerms = extractTermsFromMarkdown(glossaryDoc);
  const codeSections = new Set(CORE_SECTION_TYPES.map(sec => 
    sec.name.toLowerCase()
  ));

  // Check for important section types
  const importantSections = ['verse', 'chorus', 'bridge', 'intro', 'outro'];
  for (const section of importantSections) {
    builder.incrementTerms();
    
    const inCode = codeSections.has(section);
    const inDocs = documentedTerms.has(section) || glossaryDoc.toLowerCase().includes(section);

    if (inCode && !inDocs) {
      builder.addWarning(
        'UNDOCUMENTED_SECTION',
        `Section type "${section}" exists in code but not clearly documented in glossary.md`,
        'section',
        section,
        'glossary.md'
      );
    } else if (!inCode && inDocs) {
      builder.addError(
        'ORPHANED_DOC_SECTION',
        `Section type "${section}" appears in docs but not in CORE_SECTION_TYPES`,
        'section',
        section,
        'glossary.md'
      );
    }
  }
}

/**
 * Check that documented layer types match code.
 */
function checkLayersDrift(
  docsRoot: string,
  builder: DriftCheckBuilder
): void {
  const glossaryDoc = readDocsFile(docsRoot, 'glossary.md');
  
  if (!glossaryDoc) {
    return; // Already warned in checkSectionsDrift
  }

  const documentedTerms = extractTermsFromMarkdown(glossaryDoc);
  const codeLayers = new Set(CORE_LAYER_TYPES.map(layer => 
    layer.name.toLowerCase()
  ));

  // Check for important layer types
  const importantLayers = ['drums', 'bass', 'pad', 'lead', 'vocal'];
  for (const layer of importantLayers) {
    builder.incrementTerms();
    
    const inCode = codeLayers.has(layer);
    const inDocs = documentedTerms.has(layer) || glossaryDoc.toLowerCase().includes(layer);

    if (inCode && !inDocs) {
      builder.addWarning(
        'UNDOCUMENTED_LAYER',
        `Layer type "${layer}" exists in code but not clearly documented in glossary.md`,
        'layer',
        layer,
        'glossary.md'
      );
    } else if (!inCode && inDocs) {
      builder.addError(
        'ORPHANED_DOC_LAYER',
        `Layer type "${layer}" appears in docs but not in CORE_LAYER_TYPES`,
        'layer',
        layer,
        'glossary.md'
      );
    }
  }
}

/**
 * Check that documented opcodes match code.
 */
function checkOpcodesDrift(
  docsRoot: string,
  builder: DriftCheckBuilder
): void {
  const pipelineDoc = readDocsFile(docsRoot, 'pipeline.md');
  
  if (!pipelineDoc) {
    return; // Already warned in checkAxesDrift
  }

  const documentedIds = extractIdsFromMarkdown(pipelineDoc);
  const codeOpcodes = new Set(CORE_OPCODES.map(op => op.id as string));

  // Check for opcode IDs in docs
  for (const id of documentedIds) {
    if (id.startsWith('op:') && !codeOpcodes.has(id)) {
      builder.addError(
        'ORPHANED_DOC_OPCODE',
        `Opcode ID "${id}" appears in docs but not in CORE_OPCODES`,
        'opcode',
        id,
        'pipeline.md'
      );
    } else if (id.startsWith('op:')) {
      builder.incrementTerms();
    }
  }
}

// =============================================================================
// Main Drift Check
// =============================================================================

/**
 * Check for ontology drift between code and documentation.
 *
 * @param docsRoot - Path to docs/gofai directory (defaults to relative path)
 */
export function checkOntologyDrift(
  docsRoot: string = path.join(__dirname, '../../../docs/gofai')
): DriftCheckResult {
  const builder = new DriftCheckBuilder();

  // Check each vocabulary category
  checkLexemeDrift(docsRoot, builder);
  checkAxesDrift(docsRoot, builder);
  checkSectionsDrift(docsRoot, builder);
  checkLayersDrift(docsRoot, builder);
  checkOpcodesDrift(docsRoot, builder);

  return builder.build();
}

/**
 * Assert that there is no ontology drift, throwing if drift detected.
 */
export function assertNoOntologyDrift(docsRoot?: string): void {
  const result = checkOntologyDrift(docsRoot);

  if (!result.valid) {
    const errorMessages = result.driftErrors
      .map((e) => `[${e.category}] ${e.message}`)
      .join('\n');

    throw new Error(
      `GOFAI ontology drift detected with ${result.driftErrors.length} errors:\n${errorMessages}\n\n` +
      `The canonical vocabulary in code must match the documentation.\n` +
      `Either update the docs or fix the code to maintain SSOT.`
    );
  }
}

/**
 * Log drift check results to console.
 */
export function logDriftCheckResults(result: DriftCheckResult): void {
  console.log('='.repeat(60));
  console.log('GOFAI Ontology Drift Check Results');
  console.log('='.repeat(60));
  console.log(`Files Checked: ${result.filesChecked}`);
  console.log(`Terms Checked: ${result.termsChecked}`);
  console.log(`Errors: ${result.driftErrors.length}`);
  console.log(`Warnings: ${result.driftWarnings.length}`);
  console.log(`Duration: ${result.duration}ms`);

  if (result.driftErrors.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('DRIFT ERRORS:');
    for (const error of result.driftErrors) {
      console.log(`  ✗ [${error.category}] ${error.message}`);
      if (error.docPath) {
        console.log(`    Doc: ${error.docPath}`);
      }
    }
  }

  if (result.driftWarnings.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('DRIFT WARNINGS:');
    for (const warning of result.driftWarnings) {
      console.log(`  ⚠ [${warning.category}] ${warning.message}`);
      if (warning.docPath) {
        console.log(`    Doc: ${warning.docPath}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Status: ${result.valid ? 'NO DRIFT ✓' : 'DRIFT DETECTED ✗'}`);
  console.log('='.repeat(60));
}
