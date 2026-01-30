#!/usr/bin/env node
/**
 * @fileoverview Check that docs mixing ontologies include explicit bridge sections
 * 
 * Enforces Change 426: docs that reference multiple ontologies must include
 * explicit bridging discussions or mark cross-ontology constraints.
 * 
 * Examples of ontology mixing:
 * - Using both Western and Carnatic terms
 * - Mixing 12-TET with Just Intonation
 * - Combining Celtic and Chinese music theory
 * 
 * Required bridge section markers:
 * - "## Bridging" or "## Cross-Ontology Bridge"
 * - Discussion of how the ontologies interact
 * - Warnings about potential incompatibilities
 * 
 * @module @cardplay/scripts/canon/check-ontology-mixing
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// ONTOLOGY MARKERS
// ============================================================================

/**
 * Ontology marker patterns to detect in docs.
 * Each pattern maps to an ontology ID.
 */
const ONTOLOGY_MARKERS = {
  western: [
    /\b(?:Western|12-TET|equal temperament|major|minor|diatonic)\b/i,
    /\b(?:C major|D minor|chord progression)\b/i,
  ],
  carnatic: [
    /\b(?:Carnatic|melakarta|raga|gamaka|swara)\b/i,
    /\b(?:tala|kriti|alapana)\b/i,
  ],
  just: [
    /\b(?:just intonation|JI|harmonic series|pure interval)\b/i,
    /\b(?:5-limit|7-limit|ratio)\b/i,
  ],
  celtic: [
    /\b(?:Celtic|Irish|Scottish|jig|reel)\b/i,
    /\b(?:sean-nós|uilleann|bodhrán)\b/i,
  ],
  chinese: [
    /\b(?:Chinese|pentatonic|gong shang jue zhi yu)\b/i,
    /\b(?:qin|guqin|erhu)\b/i,
  ],
  microtonal: [
    /\b(?:microtonal|quarter-tone|31-TET|19-TET)\b/i,
  ],
};

/**
 * Required bridge section patterns.
 */
const BRIDGE_SECTION_PATTERNS = [
  /^##\s+(?:Bridging|Cross-Ontology Bridge|Ontology Compatibility)/im,
  /^###\s+Bridging/im,
];

// ============================================================================
// DETECTION
// ============================================================================

interface OntologyDetection {
  readonly ontologyId: string;
  readonly lineNumbers: readonly number[];
}

interface BridgeSection {
  readonly lineNumber: number;
  readonly heading: string;
}

/**
 * Detect ontologies referenced in a document.
 */
function detectOntologies(content: string): readonly OntologyDetection[] {
  const lines = content.split('\n');
  const detections: Map<string, Set<number>> = new Map();

  for (const [ontologyId, patterns] of Object.entries(ONTOLOGY_MARKERS)) {
    const lineNumbers = new Set<number>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          lineNumbers.add(i + 1); // 1-indexed
        }
      }
    }
    
    if (lineNumbers.size > 0) {
      detections.set(ontologyId, lineNumbers);
    }
  }

  return Array.from(detections.entries()).map(([ontologyId, lineNumbers]) => ({
    ontologyId,
    lineNumbers: Array.from(lineNumbers).sort((a, b) => a - b),
  }));
}

/**
 * Detect bridge sections in a document.
 */
function detectBridgeSections(content: string): readonly BridgeSection[] {
  const lines = content.split('\n');
  const sections: BridgeSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of BRIDGE_SECTION_PATTERNS) {
      if (pattern.test(line)) {
        sections.push({
          lineNumber: i + 1,
          heading: line.trim(),
        });
      }
    }
  }

  return sections;
}

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  readonly file: string;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validate a single document for ontology mixing.
 */
function validateDocument(filePath: string): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors: string[] = [];
  const warnings: string[] = [];

  // Detect ontologies
  const ontologies = detectOntologies(content);
  
  // If multiple ontologies detected, require bridge section
  if (ontologies.length > 1) {
    const bridgeSections = detectBridgeSections(content);
    
    if (bridgeSections.length === 0) {
      const ontologyNames = ontologies.map(o => o.ontologyId).join(', ');
      errors.push(
        `Document mixes multiple ontologies (${ontologyNames}) but lacks a bridging section. ` +
        `Add a "## Bridging" or "## Cross-Ontology Bridge" section explaining how they interact.`
      );
      
      // Show where each ontology is referenced
      for (const ont of ontologies) {
        const lineList = ont.lineNumbers.slice(0, 3).join(', ');
        const more = ont.lineNumbers.length > 3 ? `, +${ont.lineNumbers.length - 3} more` : '';
        warnings.push(
          `  - ${ont.ontologyId}: lines ${lineList}${more}`
        );
      }
    }
  }

  return {
    file: filePath,
    errors,
    warnings,
  };
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  
  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other common excluded dirs
        if (!['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const docsPath = path.join(process.cwd(), 'docs');
  
  if (!fs.existsSync(docsPath)) {
    console.log('No docs directory found, skipping ontology mixing check.');
    return;
  }
  
  // Find all markdown files
  const files = findMarkdownFiles(docsPath);

  console.log(`Checking ${files.length} docs for ontology mixing...\n`);

  let totalErrors = 0;
  const results: ValidationResult[] = [];

  for (const file of files) {
    const result = validateDocument(file);
    if (result.errors.length > 0 || result.warnings.length > 0) {
      results.push(result);
      totalErrors += result.errors.length;
    }
  }

  // Report results
  if (results.length === 0) {
    console.log('✓ All docs with ontology mixing have proper bridge sections');
    process.exit(0);
  }

  console.log('✗ Found ontology mixing without bridge sections:\n');
  
  for (const result of results) {
    const relPath = path.relative(process.cwd(), result.file);
    console.log(`${relPath}:`);
    
    for (const error of result.errors) {
      console.log(`  ERROR: ${error}`);
    }
    
    for (const warning of result.warnings) {
      console.log(`  ${warning}`);
    }
    
    console.log();
  }

  console.log(`\nTotal: ${totalErrors} error(s) in ${results.length} file(s)`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

// ESM entry point
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

export { validateDocument, detectOntologies, detectBridgeSections };
