/**
 * @fileoverview Theme Visual-Only Lint
 * 
 * Change 418: Enforce themes are visual-only (no core logic imports).
 * 
 * This script checks that theme files only import from allowed modules:
 * - UI/visual modules
 * - Type definitions
 * - Constants
 * 
 * Themes should NOT import:
 * - State management
 * - Business logic
 * - Audio engine
 * - AI/theory modules
 * 
 * @module scripts/theme-visual-only-lint
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Allowed import patterns for theme files.
 */
const ALLOWED_IMPORT_PATTERNS = [
  /^\.\.?\//,  // Relative imports (will be checked separately)
  /^@cardplay\/types\//,  // Type definitions
  /^@cardplay\/canon\//,  // Canon types/constants
];

/**
 * Forbidden module patterns (anywhere in import path).
 */
const FORBIDDEN_MODULE_PATTERNS = [
  /\/state\//,
  /\/audio\//,
  /\/ai\//,
  /\/engine\//,
  /\/knowledge\//,
  /\/theory\//,
  /\/tracks\//,
  /\/export\//,
  /\/import\//,
  /store\.ts/,
  /adapter\.ts/,
];

/**
 * Allowed relative import paths from theme directory.
 */
const ALLOWED_RELATIVE_PATHS = [
  'registry',
  'types',
  'manager',
  'theme-applier',
  'control-level-colors',
];

// ============================================================================
// TYPES
// ============================================================================

interface LintViolation {
  file: string;
  line: number;
  import: string;
  reason: string;
}

// ============================================================================
// LINT LOGIC
// ============================================================================

/**
 * Checks if an import is allowed for theme files.
 */
function isImportAllowed(importPath: string, sourceFile: string): { allowed: boolean; reason?: string } {
  // Check if relative import
  if (importPath.startsWith('.')) {
    const resolved = path.resolve(path.dirname(sourceFile), importPath);
    const relative = path.relative(path.join(__dirname, '../src/boards/theme'), resolved);
    
    // Check if it's within theme directory or allowed relative paths
    const baseName = path.basename(relative, path.extname(relative));
    if (ALLOWED_RELATIVE_PATHS.some(allowed => relative.includes(allowed) || baseName === allowed)) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: `Relative import outside theme directory: ${importPath}`,
    };
  }
  
  // Check forbidden patterns
  for (const pattern of FORBIDDEN_MODULE_PATTERNS) {
    if (pattern.test(importPath)) {
      return {
        allowed: false,
        reason: `Import from forbidden module (${pattern}): ${importPath}`,
      };
    }
  }
  
  // Check allowed patterns
  for (const pattern of ALLOWED_IMPORT_PATTERNS) {
    if (pattern.test(importPath)) {
      return { allowed: true };
    }
  }
  
  // Default: check if it's a standard UI module
  if (
    importPath.includes('/ui/') ||
    importPath.includes('/types/') ||
    importPath.includes('/canon/')
  ) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `Import from non-visual module: ${importPath}`,
  };
}

/**
 * Extracts import statements from a TypeScript file.
 */
function extractImports(content: string, file: string): Array<{ line: number; import: string }> {
  const imports: Array<{ line: number; import: string }> = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match import statements
    const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      imports.push({
        line: i + 1,
        import: importMatch[1],
      });
      continue;
    }
    
    // Match require statements
    const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      imports.push({
        line: i + 1,
        import: requireMatch[1],
      });
    }
  }
  
  return imports;
}

/**
 * Lints a single theme file.
 */
function lintThemeFile(file: string): LintViolation[] {
  const content = fs.readFileSync(file, 'utf-8');
  const imports = extractImports(content, file);
  const violations: LintViolation[] = [];
  
  for (const { line, import: importPath } of imports) {
    const result = isImportAllowed(importPath, file);
    
    if (!result.allowed) {
      violations.push({
        file,
        line,
        import: importPath,
        reason: result.reason || 'Unknown reason',
      });
    }
  }
  
  return violations;
}

/**
 * Finds all theme TypeScript files.
 */
function findThemeFiles(themeDir: string): string[] {
  const files: string[] = [];
  
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        // Skip test files
        if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(themeDir);
  return files;
}

/**
 * Main lint function.
 */
function lintThemes(): boolean {
  const themeDir = path.join(__dirname, '../src/boards/theme');
  
  if (!fs.existsSync(themeDir)) {
    console.error(`Theme directory not found: ${themeDir}`);
    return false;
  }
  
  console.log('Linting theme files for visual-only imports...\n');
  
  const themeFiles = findThemeFiles(themeDir);
  const allViolations: LintViolation[] = [];
  
  for (const file of themeFiles) {
    const violations = lintThemeFile(file);
    allViolations.push(...violations);
  }
  
  if (allViolations.length === 0) {
    console.log('✅ All theme files are visual-only (no forbidden imports)');
    return true;
  }
  
  console.error(`❌ Found ${allViolations.length} theme import violations:\n`);
  
  for (const violation of allViolations) {
    const relFile = path.relative(process.cwd(), violation.file);
    console.error(`  ${relFile}:${violation.line}`);
    console.error(`    Import: ${violation.import}`);
    console.error(`    Reason: ${violation.reason}`);
    console.error();
  }
  
  return false;
}

// ============================================================================
// CLI
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const success = lintThemes();
  process.exit(success ? 0 : 1);
}

export { lintThemes, lintThemeFile, isImportAllowed };
