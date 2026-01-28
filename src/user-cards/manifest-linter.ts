/**
 * @fileoverview Card Manifest Linter.
 * 
 * Provides comprehensive linting for CardManifest files including:
 * - Best practices checking
 * - Common error detection
 * - Security analysis
 * - Performance hints
 * - Consistency validation
 * 
 * @module @cardplay/user-cards/manifest-linter
 */

import type { CardManifest, ValidationError } from './manifest.js';

// ============================================================================
// LINT RULES
// ============================================================================

/**
 * Lint rule severity.
 */
export type LintSeverity = 'error' | 'warning' | 'info';

/**
 * Lint rule category.
 */
export type LintCategory = 
  | 'structure'       // Manifest structure issues
  | 'metadata'        // Metadata completeness
  | 'dependencies'    // Dependency issues
  | 'security'        // Security concerns
  | 'performance'     // Performance implications
  | 'compatibility'   // Compatibility warnings
  | 'bestpractice'    // Best practice recommendations
  | 'style'           // Code style consistency
  | 'documentation';  // Documentation completeness

/**
 * Lint rule definition.
 */
export interface LintRule {
  id: string;
  category: LintCategory;
  severity: LintSeverity;
  message: string;
  check: (manifest: CardManifest) => boolean;
  suggestion?: string;
  url?: string;
}

/**
 * Lint result for a specific rule.
 */
export interface LintIssue extends ValidationError {
  ruleId: string;
  category: LintCategory;
  suggestion?: string;
  url?: string;
}

/**
 * Complete lint result.
 */
export interface LintResult {
  errors: LintIssue[];
  warnings: LintIssue[];
  info: LintIssue[];
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

// ============================================================================
// BUILT-IN RULES
// ============================================================================

const RULES: LintRule[] = [
  // ---------------------------------------------------------------------------
  // STRUCTURE RULES
  // ---------------------------------------------------------------------------
  {
    id: 'required-manifest-version',
    category: 'structure',
    severity: 'error',
    message: 'Manifest version is required',
    check: (m) => !!m.manifestVersion,
    suggestion: 'Add "manifestVersion": "1.0.0" to your manifest',
  },
  {
    id: 'required-name',
    category: 'structure',
    severity: 'error',
    message: 'Package name is required',
    check: (m) => !!m.name,
    suggestion: 'Add "name" field with a unique package identifier',
  },
  {
    id: 'required-version',
    category: 'structure',
    severity: 'error',
    message: 'Package version is required',
    check: (m) => !!m.version,
    suggestion: 'Add "version" field following semver (e.g., "1.0.0")',
  },
  {
    id: 'valid-name-format',
    category: 'structure',
    severity: 'error',
    message: 'Package name must be lowercase and contain only alphanumeric, dots, underscores, and hyphens',
    check: (m) => !m.name || /^[a-z0-9][a-z0-9._-]*$/i.test(m.name),
    suggestion: 'Use lowercase letters, numbers, dots, underscores, and hyphens only',
  },
  {
    id: 'valid-semver',
    category: 'structure',
    severity: 'error',
    message: 'Version must be valid semver',
    check: (m) => !m.version || /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(m.version),
    suggestion: 'Use semantic versioning format: MAJOR.MINOR.PATCH (e.g., "1.0.0")',
    url: 'https://semver.org',
  },

  // ---------------------------------------------------------------------------
  // METADATA RULES
  // ---------------------------------------------------------------------------
  {
    id: 'recommended-description',
    category: 'metadata',
    severity: 'warning',
    message: 'Description is recommended for discoverability',
    check: (m) => !!m.description && m.description.length > 10,
    suggestion: 'Add a clear description of what your card pack does',
  },
  {
    id: 'recommended-keywords',
    category: 'metadata',
    severity: 'warning',
    message: 'Keywords are recommended for search discoverability',
    check: (m) => !!m.keywords && m.keywords.length >= 3,
    suggestion: 'Add at least 3 relevant keywords to improve searchability',
  },
  {
    id: 'recommended-license',
    category: 'metadata',
    severity: 'warning',
    message: 'License is recommended to clarify usage rights',
    check: (m) => !!m.license,
    suggestion: 'Add a license field (e.g., "MIT", "Apache-2.0", "CC0-1.0")',
    url: 'https://spdx.org/licenses/',
  },
  {
    id: 'recommended-author',
    category: 'metadata',
    severity: 'warning',
    message: 'Author information is recommended',
    check: (m) => !!m.author,
    suggestion: 'Add author field with your name and optional email/URL',
  },
  {
    id: 'recommended-homepage',
    category: 'metadata',
    severity: 'info',
    message: 'Homepage URL helps users learn more',
    check: (m) => !!m.homepage,
    suggestion: 'Add homepage URL pointing to documentation or project website',
  },
  {
    id: 'recommended-repository',
    category: 'metadata',
    severity: 'info',
    message: 'Repository URL helps with contribution and transparency',
    check: (m) => !!m.repository,
    suggestion: 'Add repository field with source code location',
  },
  {
    id: 'description-length',
    category: 'style',
    severity: 'info',
    message: 'Description should be concise (under 200 characters)',
    check: (m) => !m.description || m.description.length <= 200,
    suggestion: 'Keep description brief; use homepage/README for detailed info',
  },
  {
    id: 'description-complete-sentence',
    category: 'style',
    severity: 'info',
    message: 'Description should be a complete sentence with proper capitalization',
    check: (m) => {
      if (!m.description) return true;
      const firstChar = m.description[0];
      return firstChar === firstChar?.toUpperCase();
    },
    suggestion: 'Start description with a capital letter',
  },
  {
    id: 'keywords-lowercase',
    category: 'style',
    severity: 'info',
    message: 'Keywords should be lowercase for consistency',
    check: (m) => {
      if (!m.keywords) return true;
      return m.keywords.every(k => k === k.toLowerCase());
    },
    suggestion: 'Use lowercase for all keywords',
  },
  {
    id: 'keywords-count',
    category: 'metadata',
    severity: 'info',
    message: 'Too many keywords may reduce relevance',
    check: (m) => !m.keywords || m.keywords.length <= 10,
    suggestion: 'Limit keywords to 3-10 most relevant terms',
  },
  {
    id: 'keywords-duplicates',
    category: 'structure',
    severity: 'warning',
    message: 'Duplicate keywords detected',
    check: (m) => {
      if (!m.keywords) return true;
      const unique = new Set(m.keywords);
      return unique.size === m.keywords.length;
    },
    suggestion: 'Remove duplicate keywords',
  },

  // ---------------------------------------------------------------------------
  // DEPENDENCY RULES
  // ---------------------------------------------------------------------------
  {
    id: 'dependencies-not-empty-object',
    category: 'dependencies',
    severity: 'info',
    message: 'Remove empty dependencies object',
    check: (m) => !m.dependencies || Object.keys(m.dependencies).length > 0,
    suggestion: 'Either add dependencies or remove the empty object',
  },
  {
    id: 'dev-dependencies-not-empty-object',
    category: 'dependencies',
    severity: 'info',
    message: 'Remove empty devDependencies object',
    check: (m) => !m.devDependencies || Object.keys(m.devDependencies).length > 0,
    suggestion: 'Either add devDependencies or remove the empty object',
  },
  {
    id: 'no-wildcard-dependencies',
    category: 'dependencies',
    severity: 'warning',
    message: 'Wildcard dependencies (*) are not recommended',
    check: (m) => {
      if (!m.dependencies) return true;
      return !Object.values(m.dependencies).some(v => v === '*');
    },
    suggestion: 'Specify version constraints instead of wildcards for stability',
  },
  {
    id: 'no-http-urls-in-dependencies',
    category: 'security',
    severity: 'error',
    message: 'HTTP URLs in dependencies are insecure',
    check: (m) => {
      if (!m.dependencies) return true;
      return !Object.values(m.dependencies).some(v => 
        typeof v === 'string' && v.startsWith('http://')
      );
    },
    suggestion: 'Use HTTPS URLs or package names instead',
  },

  // ---------------------------------------------------------------------------
  // SECURITY RULES
  // ---------------------------------------------------------------------------
  {
    id: 'private-no-publish',
    category: 'security',
    severity: 'info',
    message: 'Private package should not have publish config',
    check: (m) => !m.private || !m.publishConfig,
    suggestion: 'Remove publishConfig from private packages',
  },
  {
    id: 'suspicious-scripts',
    category: 'security',
    severity: 'warning',
    message: 'Suspicious scripts detected (postinstall with curl/wget)',
    check: (m) => {
      if (!m.scripts) return true;
      const suspicious = ['curl', 'wget', 'chmod', 'rm -rf'];
      return !Object.values(m.scripts).some(script =>
        suspicious.some(cmd => script.includes(cmd))
      );
    },
    suggestion: 'Review scripts for security concerns before publishing',
  },
  {
    id: 'no-absolute-paths',
    category: 'security',
    severity: 'warning',
    message: 'Avoid absolute paths in manifest',
    check: (m) => {
      const paths: string[] = [];
      if (m.main) paths.push(m.main);
      if (m.browser) paths.push(m.browser);
      if (m.module) paths.push(m.module);
      if (m.cards) paths.push(...m.cards.map(c => c.file));
      
      return !paths.some(p => p.startsWith('/'));
    },
    suggestion: 'Use relative paths for portability',
  },

  // ---------------------------------------------------------------------------
  // PERFORMANCE RULES
  // ---------------------------------------------------------------------------
  {
    id: 'files-array-recommended',
    category: 'performance',
    severity: 'info',
    message: 'Using "files" array reduces package size',
    check: (m) => !!m.files && m.files.length > 0,
    suggestion: 'Add "files" array to explicitly control what gets published',
  },
  {
    id: 'too-many-cards',
    category: 'performance',
    severity: 'warning',
    message: 'Large number of cards may impact load time',
    check: (m) => !m.cards || m.cards.length <= 50,
    suggestion: 'Consider splitting into multiple packages if >50 cards',
  },
  {
    id: 'large-bundled-dependencies',
    category: 'performance',
    severity: 'warning',
    message: 'Too many bundled dependencies increases package size',
    check: (m) => !m.bundledDependencies || m.bundledDependencies.length <= 5,
    suggestion: 'Bundle only essential dependencies; let users install others',
  },

  // ---------------------------------------------------------------------------
  // COMPATIBILITY RULES
  // ---------------------------------------------------------------------------
  {
    id: 'cardplay-version-specified',
    category: 'compatibility',
    severity: 'warning',
    message: 'Specify required Cardplay version',
    check: (m) => !!m.platform?.cardplayVersion,
    suggestion: 'Add platform.cardplayVersion to ensure compatibility',
  },
  {
    id: 'platform-specified',
    category: 'compatibility',
    severity: 'info',
    message: 'Platform requirements help users know compatibility',
    check: (m) => !!m.platform,
    suggestion: 'Add platform field with OS and feature requirements',
  },
  {
    id: 'deprecated-cards-documented',
    category: 'documentation',
    severity: 'info',
    message: 'Deprecated cards should have explanation',
    check: (m) => {
      if (!m.cards) return true;
      return !m.cards.some(card => 
        card.deprecated === true
      );
    },
    suggestion: 'Set deprecated to a string explaining why and alternatives',
  },

  // ---------------------------------------------------------------------------
  // BEST PRACTICE RULES
  // ---------------------------------------------------------------------------
  {
    id: 'semantic-version-start',
    category: 'bestpractice',
    severity: 'info',
    message: 'Consider starting at 0.1.0 for new packages',
    check: (m) => !m.version || m.version !== '1.0.0' || !!m.description,
    suggestion: 'Use 0.x.x for pre-release, 1.0.0 for stable release',
  },
  {
    id: 'category-specified',
    category: 'bestpractice',
    severity: 'info',
    message: 'Category helps with organization',
    check: (m) => !!m.category,
    suggestion: 'Add category field (e.g., "generators", "effects", "utilities")',
  },
  {
    id: 'icons-provided',
    category: 'bestpractice',
    severity: 'info',
    message: 'Icons improve visual recognition',
    check: (m) => !!m.icons && m.icons.length > 0,
    suggestion: 'Add icons for better UI integration',
  },
  {
    id: 'multiple-icon-sizes',
    category: 'bestpractice',
    severity: 'info',
    message: 'Provide multiple icon sizes for different contexts',
    check: (m) => {
      if (!m.icons) return true;
      const sizes = new Set(m.icons.map(i => i.size));
      return sizes.size >= 2 || sizes.has('svg');
    },
    suggestion: 'Provide at least 2 sizes (or SVG) for optimal display',
  },
  {
    id: 'media-for-showcase',
    category: 'bestpractice',
    severity: 'info',
    message: 'Screenshots/videos help users understand functionality',
    check: (m) => !!m.media && m.media.length > 0,
    suggestion: 'Add screenshots or demo videos to showcase features',
  },
  {
    id: 'types-for-typescript',
    category: 'bestpractice',
    severity: 'info',
    message: 'TypeScript types improve developer experience',
    check: (m) => !!m.types,
    suggestion: 'Add "types" field pointing to .d.ts file',
  },
  {
    id: 'main-entry-exists',
    category: 'structure',
    severity: 'warning',
    message: 'Main entry point should be specified',
    check: (m) => !!m.main || !!m.module || !!m.browser,
    suggestion: 'Add "main", "module", or "browser" entry point',
  },
  {
    id: 'cards-have-ids',
    category: 'structure',
    severity: 'error',
    message: 'All cards must have unique IDs',
    check: (m) => {
      if (!m.cards) return true;
      const ids = m.cards.map(c => c.id);
      const unique = new Set(ids);
      return unique.size === ids.length;
    },
    suggestion: 'Ensure each card has a unique ID',
  },
  {
    id: 'cards-have-files',
    category: 'structure',
    severity: 'error',
    message: 'All cards must specify file paths',
    check: (m) => {
      if (!m.cards) return true;
      return m.cards.every(c => !!c.file);
    },
    suggestion: 'Add "file" field to each card entry',
  },

  // ---------------------------------------------------------------------------
  // DOCUMENTATION RULES
  // ---------------------------------------------------------------------------
  {
    id: 'bugs-url-provided',
    category: 'documentation',
    severity: 'info',
    message: 'Bug tracker URL helps users report issues',
    check: (m) => !!m.bugs,
    suggestion: 'Add "bugs" field with issue tracker URL',
  },
  {
    id: 'config-schema-documented',
    category: 'documentation',
    severity: 'info',
    message: 'Configuration schema helps users understand options',
    check: (m) => {
      if (!m.defaultConfig) return true;
      return !!m.configSchema;
    },
    suggestion: 'Add configSchema if defaultConfig is provided',
  },
];

// ============================================================================
// LINTER
// ============================================================================

/**
 * Linter options.
 */
export interface LinterOptions {
  /** Rules to run (defaults to all) */
  rules?: string[];
  /** Rules to ignore */
  ignoreRules?: string[];
  /** Minimum severity to report */
  minSeverity?: LintSeverity;
  /** Include info-level issues */
  includeInfo?: boolean;
}

/**
 * Lints a manifest against all rules.
 */
export function lintManifest(
  manifest: CardManifest,
  options: LinterOptions = {}
): LintResult {
  const {
    rules: rulesToRun,
    ignoreRules = [],
    includeInfo = true,
  } = options;

  const errors: LintIssue[] = [];
  const warnings: LintIssue[] = [];
  const info: LintIssue[] = [];

  // Determine which rules to run
  const activeRules = RULES.filter(rule => {
    if (ignoreRules.includes(rule.id)) return false;
    if (rulesToRun && !rulesToRun.includes(rule.id)) return false;
    if (!includeInfo && rule.severity === 'info') return false;
    return true;
  });

  // Run rules
  for (const rule of activeRules) {
    try {
      if (!rule.check(manifest)) {
        const issue: LintIssue = {
          ruleId: rule.id,
          category: rule.category,
          path: '',
          message: rule.message,
          severity: rule.severity,
          ...(rule.suggestion ? { suggestion: rule.suggestion } : {}),
          ...(rule.url ? { url: rule.url } : {}),
        };

        if (rule.severity === 'error') {
          errors.push(issue);
        } else if (rule.severity === 'warning') {
          warnings.push(issue);
        } else {
          info.push(issue);
        }
      }
    } catch (e) {
      // Rule execution failed - report as error
      errors.push({
        ruleId: rule.id,
        category: 'structure',
        path: '',
        message: `Rule ${rule.id} failed: ${e instanceof Error ? e.message : String(e)}`,
        severity: 'error',
      });
    }
  }

  return {
    errors,
    warnings,
    info,
    summary: {
      totalIssues: errors.length + warnings.length + info.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: info.length,
    },
  };
}

/**
 * Formats lint results as human-readable text.
 */
export function formatLintResults(result: LintResult, options: { colors?: boolean } = {}): string {
  const { colors = false } = options;

  const lines: string[] = [];

  const colorize = (text: string, color: 'red' | 'yellow' | 'blue' | 'gray') => {
    if (!colors) return text;
    const codes = { red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m', gray: '\x1b[90m' };
    return `${codes[color]}${text}\x1b[0m`;
  };

  // Errors
  if (result.errors.length > 0) {
    lines.push(colorize('\nErrors:', 'red'));
    for (const err of result.errors) {
      lines.push(`  ${colorize('✗', 'red')} ${err.message} (${err.ruleId})`);
      if (err.suggestion) {
        lines.push(`    ${colorize('💡', 'gray')} ${err.suggestion}`);
      }
      if (err.url) {
        lines.push(`    ${colorize('🔗', 'gray')} ${err.url}`);
      }
    }
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(colorize('\nWarnings:', 'yellow'));
    for (const warn of result.warnings) {
      lines.push(`  ${colorize('⚠', 'yellow')} ${warn.message} (${warn.ruleId})`);
      if (warn.suggestion) {
        lines.push(`    ${colorize('💡', 'gray')} ${warn.suggestion}`);
      }
      if (warn.url) {
        lines.push(`    ${colorize('🔗', 'gray')} ${warn.url}`);
      }
    }
  }

  // Info
  if (result.info.length > 0) {
    lines.push(colorize('\nInfo:', 'blue'));
    for (const inf of result.info) {
      lines.push(`  ${colorize('ℹ', 'blue')} ${inf.message} (${inf.ruleId})`);
      if (inf.suggestion) {
        lines.push(`    ${colorize('💡', 'gray')} ${inf.suggestion}`);
      }
      if (inf.url) {
        lines.push(`    ${colorize('🔗', 'gray')} ${inf.url}`);
      }
    }
  }

  // Summary
  lines.push('\n' + colorize('Summary:', 'gray'));
  lines.push(`  Total issues: ${result.summary.totalIssues}`);
  if (result.summary.errorCount > 0) {
    lines.push(`  Errors: ${colorize(result.summary.errorCount.toString(), 'red')}`);
  }
  if (result.summary.warningCount > 0) {
    lines.push(`  Warnings: ${colorize(result.summary.warningCount.toString(), 'yellow')}`);
  }
  if (result.summary.infoCount > 0) {
    lines.push(`  Info: ${colorize(result.summary.infoCount.toString(), 'blue')}`);
  }

  return lines.join('\n');
}

/**
 * Returns all available rules.
 */
export function getRules(): readonly LintRule[] {
  return RULES;
}

/**
 * Returns rules in a specific category.
 */
export function getRulesByCategory(category: LintCategory): LintRule[] {
  return RULES.filter(r => r.category === category);
}

/**
 * Returns a specific rule by ID.
 */
export function getRule(id: string): LintRule | undefined {
  return RULES.find(r => r.id === id);
}

/**
 * Checks if manifest passes all error-level rules.
 */
export function isManifestValid(manifest: CardManifest): boolean {
  const result = lintManifest(manifest, { minSeverity: 'error', includeInfo: false });
  return result.summary.errorCount === 0;
}

/**
 * Gets recommended fixes for a lint result.
 */
export function getRecommendedFixes(result: LintResult): string[] {
  const fixes: string[] = [];

  // Collect all suggestions
  for (const issue of [...result.errors, ...result.warnings]) {
    if (issue.suggestion) {
      fixes.push(`${issue.ruleId}: ${issue.suggestion}`);
    }
  }

  return fixes;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type CardManifest,
  type ValidationError,
};
