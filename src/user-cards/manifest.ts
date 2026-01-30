/**
 * @fileoverview Card Manifest Format.
 * 
 * Defines the CardManifest JSON schema and provides:
 * - Manifest validation
 * - Manifest loading
 * - Version migration
 * - Dependency resolution
 * 
 * ID Validation:
 * - Pack names use the manifest name as namespace
 * - Cards in the pack should use the pack namespace (e.g., 'my-pack:my-card')
 * - Builtin IDs (no colon) are reserved for CardPlay core
 * 
 * @module @cardplay/user-cards/manifest
 */

import { isNamespacedId, isBuiltinId, validateId } from '../canon/id-validation';

// ============================================================================
// MANIFEST SCHEMA
// ============================================================================

/**
 * Current manifest version.
 */
export const MANIFEST_VERSION = '1.0.0';

/**
 * Semver constraint.
 */
export interface SemverConstraint {
  /** Minimum version (inclusive) */
  min?: string;
  /** Maximum version (exclusive) */
  max?: string;
  /** Exact version match */
  exact?: string;
  /** Range expression (e.g., "^1.0.0", "~2.3.0", ">=1.0.0 <2.0.0") */
  range?: string;
}

/**
 * Dependency specification.
 */
export interface DependencySpec {
  /** Package name */
  name: string;
  /** Version constraint */
  version: SemverConstraint | string;
  /** Is this an optional dependency? */
  optional?: boolean;
  /** Peer dependency (not bundled) */
  peer?: boolean;
  /** Development dependency only */
  dev?: boolean;
}

/**
 * Author information.
 */
export interface AuthorInfo {
  name: string;
  email?: string;
  url?: string;
}

/**
 * License specification.
 */
export interface LicenseSpec {
  /** SPDX license identifier */
  type: string;
  /** License URL */
  url?: string;
  /** Custom license text (for non-standard licenses) */
  text?: string;
}

/**
 * Repository information.
 */
export interface RepositoryInfo {
  type: 'git' | 'svn' | 'hg' | 'other';
  url: string;
  directory?: string;
}

/**
 * Icon specification.
 */
export interface IconSpec {
  /** Path to icon file (relative to manifest) */
  path: string;
  /** Icon size category */
  size: '16x16' | '32x32' | '64x64' | '128x128' | 'svg';
  /** Theme variant */
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Screenshot/preview media.
 */
export interface MediaSpec {
  /** Media type */
  type: 'screenshot' | 'video' | 'audio';
  /** Path to media file */
  path: string;
  /** Caption/description */
  caption?: string;
  /** Width in pixels (for images/video) */
  width?: number;
  /** Height in pixels (for images/video) */
  height?: number;
}

/**
 * Platform compatibility.
 */
export interface PlatformSpec {
  /** Supported operating systems */
  os?: Array<'windows' | 'macos' | 'linux' | 'web' | 'ios' | 'android'>;
  /** Minimum Cardplay version */
  cardplayVersion?: SemverConstraint | string;
  /** Required browser features */
  browserFeatures?: string[];
  /** Required Web APIs */
  webApis?: string[];
  /** Required audio features */
  audioFeatures?: Array<'webaudio' | 'midi' | 'worklet' | 'wasm'>;
}

/**
 * Card entry point.
 */
export interface CardEntry {
  /** Card ID */
  id: string;
  /** Path to card source file */
  file: string;
  /** Export name in file */
  export?: string;
  /** Card category override */
  category?: string;
  /** Card is deprecated */
  deprecated?: boolean | string;
}

/**
 * Configuration schema for card parameters.
 */
export interface ConfigSchema {
  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  /** Object properties */
  properties?: Record<string, ConfigSchema>;
  /** Array item schema */
  items?: ConfigSchema;
  /** Required properties */
  required?: string[];
  /** Default value */
  default?: unknown;
  /** Description */
  description?: string;
  /** Allowed values */
  enum?: unknown[];
  /** Minimum value (numbers) */
  minimum?: number;
  /** Maximum value (numbers) */
  maximum?: number;
  /** Minimum length (strings/arrays) */
  minLength?: number;
  /** Maximum length (strings/arrays) */
  maxLength?: number;
  /** String pattern (regex) */
  pattern?: string;
}

/**
 * Card manifest.
 */
export interface CardManifest {
  /** Manifest schema version */
  manifestVersion: string;
  
  // -------------------------------------------------------------------------
  // IDENTITY
  // -------------------------------------------------------------------------
  
  /** Package name (unique identifier) */
  name: string;
  /** Package version (semver) */
  version: string;
  /**
   * Namespace for IDs in this pack (Change 402).
   * Defaults to the pack name if not specified.
   * Card IDs, port types, event kinds, etc. in this pack should use this namespace.
   * Example: if namespace is 'my-pack', card IDs should be 'my-pack:my-card'.
   */
  namespace?: string;
  /** Display name */
  displayName?: string;
  /** Package description */
  description?: string;
  /** Keywords for search */
  keywords?: string[];
  /** Category */
  category?: string;
  
  // -------------------------------------------------------------------------
  // AUTHORSHIP
  // -------------------------------------------------------------------------
  
  /** Author information */
  author?: AuthorInfo | string;
  /** Contributors */
  contributors?: Array<AuthorInfo | string>;
  /** License */
  license?: LicenseSpec | string;
  /** Homepage URL */
  homepage?: string;
  /** Repository */
  repository?: RepositoryInfo | string;
  /** Bug tracker URL */
  bugs?: string;
  
  // -------------------------------------------------------------------------
  // DEPENDENCIES
  // -------------------------------------------------------------------------
  
  /** Runtime dependencies */
  dependencies?: Record<string, SemverConstraint | string>;
  /** Development dependencies */
  devDependencies?: Record<string, SemverConstraint | string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, SemverConstraint | string>;
  /** Optional dependencies */
  optionalDependencies?: Record<string, SemverConstraint | string>;
  /** Bundled dependencies */
  bundledDependencies?: string[];
  
  // -------------------------------------------------------------------------
  // ENTRY POINTS
  // -------------------------------------------------------------------------
  
  /** Main entry point */
  main?: string;
  /** Browser entry point */
  browser?: string;
  /** ES module entry point */
  module?: string;
  /** TypeScript types */
  types?: string;
  /** CardScript source files */
  cardscript?: string[];
  /** Card definitions */
  cards?: CardEntry[];
  /** Deck templates */
  decks?: string[];
  /** Preset definitions */
  presets?: string[];
  
  // -------------------------------------------------------------------------
  // ASSETS
  // -------------------------------------------------------------------------
  
  /** Package icons */
  icons?: IconSpec[];
  /** Screenshots/media */
  media?: MediaSpec[];
  /** Sample audio files */
  samples?: string[];
  /** Style files */
  styles?: string[];
  
  // -------------------------------------------------------------------------
  // PLATFORM
  // -------------------------------------------------------------------------
  
  /** Platform compatibility */
  platform?: PlatformSpec;
  /** Engine requirements */
  engines?: Record<string, string>;
  
  // -------------------------------------------------------------------------
  // CAPABILITIES (Change 401)
  // -------------------------------------------------------------------------
  
  /** 
   * Capabilities required by this pack.
   * Extensions declare which capabilities they need (e.g., 'audio:process', 'files:write').
   * User will be prompted when installing packs with elevated/dangerous capabilities.
   */
  capabilities?: string[];
  
  // -------------------------------------------------------------------------
  // CONFIGURATION
  // -------------------------------------------------------------------------
  
  /** User configuration schema */
  configSchema?: ConfigSchema;
  /** Default configuration */
  defaultConfig?: Record<string, unknown>;
  
  // -------------------------------------------------------------------------
  // PUBLISHING
  // -------------------------------------------------------------------------
  
  /** Files to include in package */
  files?: string[];
  /** Files to exclude */
  excludeFiles?: string[];
  /** Private (not publishable) */
  private?: boolean;
  /** Publish configuration */
  publishConfig?: {
    registry?: string;
    access?: 'public' | 'restricted';
    tag?: string;
  };
  
  // -------------------------------------------------------------------------
  // SCRIPTS
  // -------------------------------------------------------------------------
  
  /** Build/lifecycle scripts */
  scripts?: Record<string, string>;
  
  // -------------------------------------------------------------------------
  // METADATA
  // -------------------------------------------------------------------------
  
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validation error.
 */
export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation result.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates a manifest.
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const addError = (path: string, message: string) => {
    errors.push({ path, message, severity: 'error' });
  };
  
  const addWarning = (path: string, message: string) => {
    warnings.push({ path, message, severity: 'warning' });
  };
  
  // Check it's an object
  if (!manifest || typeof manifest !== 'object') {
    addError('', 'Manifest must be an object');
    return { valid: false, errors, warnings };
  }
  
  const m = manifest as Record<string, unknown>;
  
  // Required fields
  if (!m.manifestVersion) {
    addError('manifestVersion', 'manifestVersion is required');
  } else if (typeof m.manifestVersion !== 'string') {
    addError('manifestVersion', 'manifestVersion must be a string');
  }
  
  if (!m.name) {
    addError('name', 'name is required');
  } else if (typeof m.name !== 'string') {
    addError('name', 'name must be a string');
  } else if (!/^[a-z0-9][a-z0-9._-]*$/i.test(m.name)) {
    addError('name', 'name must start with alphanumeric and contain only alphanumeric, dots, underscores, and hyphens');
  }
  
  if (!m.version) {
    addError('version', 'version is required');
  } else if (typeof m.version !== 'string') {
    addError('version', 'version must be a string');
  } else if (!isValidSemver(m.version)) {
    addError('version', 'version must be a valid semver');
  }
  
  // Optional field validations
  if (m.description !== undefined && typeof m.description !== 'string') {
    addError('description', 'description must be a string');
  }
  
  if (m.keywords !== undefined) {
    if (!Array.isArray(m.keywords)) {
      addError('keywords', 'keywords must be an array');
    } else {
      for (let i = 0; i < m.keywords.length; i++) {
        if (typeof m.keywords[i] !== 'string') {
          addError(`keywords[${i}]`, 'keyword must be a string');
        }
      }
    }
  }
  
  // Validate author
  if (m.author !== undefined) {
    if (typeof m.author !== 'string' && typeof m.author !== 'object') {
      addError('author', 'author must be a string or object');
    } else if (typeof m.author === 'object') {
      const author = m.author as Record<string, unknown>;
      if (!author.name || typeof author.name !== 'string') {
        addError('author.name', 'author.name is required and must be a string');
      }
    }
  }
  
  // Validate dependencies
  for (const depType of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = m[depType];
    if (deps !== undefined) {
      if (typeof deps !== 'object' || Array.isArray(deps)) {
        addError(depType, `${depType} must be an object`);
      } else {
        for (const [name, version] of Object.entries(deps as Record<string, unknown>)) {
          if (typeof version !== 'string' && typeof version !== 'object') {
            addError(`${depType}.${name}`, 'version must be a string or version constraint object');
          }
        }
      }
    }
  }
  
  // Validate cards
  if (m.cards !== undefined) {
    if (!Array.isArray(m.cards)) {
      addError('cards', 'cards must be an array');
    } else {
      const packNamespace = typeof m.name === 'string' ? m.name.toLowerCase() : '';
      
      for (let i = 0; i < m.cards.length; i++) {
        const card = m.cards[i] as Record<string, unknown>;
        if (!card.id || typeof card.id !== 'string') {
          addError(`cards[${i}].id`, 'card id is required and must be a string');
        } else {
          // Validate card ID format
          const idResult = validateId(card.id);
          if (idResult.valid === false) {
            addError(`cards[${i}].id`, idResult.error);
          } else if (isBuiltinId(card.id)) {
            // User pack cards must use namespaced IDs
            addWarning(
              `cards[${i}].id`,
              `Card ID '${card.id}' should be namespaced (e.g., '${packNamespace}:${card.id}')`
            );
          } else if (isNamespacedId(card.id)) {
            // Check if namespace matches pack name
            const colonIdx = card.id.indexOf(':');
            const namespace = card.id.slice(0, colonIdx);
            if (namespace !== packNamespace && packNamespace) {
              addWarning(
                `cards[${i}].id`,
                `Card namespace '${namespace}' differs from pack name '${packNamespace}'`
              );
            }
          }
        }
        if (!card.file || typeof card.file !== 'string') {
          addError(`cards[${i}].file`, 'card file is required and must be a string');
        }
      }
    }
  }
  
  // Warnings for recommended fields
  if (!m.description) {
    addWarning('description', 'description is recommended');
  }
  
  if (!m.license) {
    addWarning('license', 'license is recommended');
  }
  
  if (!m.keywords || (Array.isArray(m.keywords) && m.keywords.length === 0)) {
    addWarning('keywords', 'keywords are recommended for discoverability');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a semver string.
 */
function isValidSemver(version: string): boolean {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

// ============================================================================
// LOADING
// ============================================================================

/**
 * Manifest loader options.
 */
export interface LoaderOptions {
  /** Validate on load */
  validate?: boolean;
  /** Apply migrations */
  migrate?: boolean;
  /** Resolve relative paths */
  resolvePaths?: boolean;
  /** Base path for resolution */
  basePath?: string;
}

/**
 * Loaded manifest result.
 */
export interface LoadedManifest {
  manifest: CardManifest;
  path: string;
  validation: ValidationResult;
  migrated: boolean;
  originalVersion?: string;
}

/**
 * Loads a manifest from JSON string.
 */
export function loadManifest(
  json: string,
  path: string,
  options: LoaderOptions = {}
): LoadedManifest {
  const {
    validate = true,
    migrate = true,
    resolvePaths = false,
    basePath = '',
  } = options;
  
  let manifest: CardManifest;
  
  try {
    manifest = JSON.parse(json) as CardManifest;
  } catch (e) {
    throw new Error(`Invalid JSON in manifest: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  let migrated = false;
  let originalVersion: string | undefined;
  
  // Migrate if needed
  if (migrate && manifest.manifestVersion !== MANIFEST_VERSION) {
    originalVersion = manifest.manifestVersion;
    manifest = migrateManifest(manifest);
    migrated = true;
  }
  
  // Resolve paths if requested
  if (resolvePaths && basePath) {
    manifest = resolveManifestPaths(manifest, basePath);
  }
  
  // Validate
  const validation = validate ? validateManifest(manifest) : {
    valid: true,
    errors: [],
    warnings: [],
  };
  
  return {
    manifest,
    path,
    validation,
    migrated,
    ...(originalVersion !== undefined ? { originalVersion } : {}),
  };
}

/**
 * Resolves relative paths in manifest.
 */
function resolveManifestPaths(manifest: CardManifest, basePath: string): CardManifest {
  const resolve = (p: string) => {
    if (p.startsWith('/') || p.startsWith('http://') || p.startsWith('https://')) {
      return p;
    }
    return `${basePath}/${p}`.replace(/\/+/g, '/');
  };
  
  const result = { ...manifest };
  
  if (result.main) result.main = resolve(result.main);
  if (result.browser) result.browser = resolve(result.browser);
  if (result.module) result.module = resolve(result.module);
  if (result.types) result.types = resolve(result.types);
  
  if (result.cardscript) {
    result.cardscript = result.cardscript.map(resolve);
  }
  
  if (result.cards) {
    result.cards = result.cards.map(card => ({
      ...card,
      file: resolve(card.file),
    }));
  }
  
  if (result.icons) {
    result.icons = result.icons.map(icon => ({
      ...icon,
      path: resolve(icon.path),
    }));
  }
  
  if (result.media) {
    result.media = result.media.map(media => ({
      ...media,
      path: resolve(media.path),
    }));
  }
  
  if (result.samples) {
    result.samples = result.samples.map(resolve);
  }
  
  return result;
}

// ============================================================================
// MIGRATION
// ============================================================================

/**
 * Migration function type.
 */
type MigrationFn = (manifest: CardManifest) => CardManifest;

/**
 * Registered migrations by version.
 */
const migrations: Map<string, MigrationFn> = new Map();

/**
 * Registers a migration.
 */
export function registerMigration(fromVersion: string, migrate: MigrationFn): void {
  migrations.set(fromVersion, migrate);
}

/**
 * Migrates a manifest to the current version.
 */
export function migrateManifest(manifest: CardManifest): CardManifest {
  let current = manifest;
  let version = manifest.manifestVersion || '0.0.0';
  
  // Apply migrations in order
  while (version !== MANIFEST_VERSION) {
    const migration = migrations.get(version);
    if (migration) {
      current = migration(current);
      version = current.manifestVersion;
    } else {
      // No migration found, assume it's compatible
      current = { ...current, manifestVersion: MANIFEST_VERSION };
      break;
    }
  }
  
  return current;
}

// Register default migrations
registerMigration('0.9.0', (m) => ({
  ...m,
  manifestVersion: '1.0.0',
  // Add any 0.9.0 -> 1.0.0 transformations
}));

// ============================================================================
// GENERATION
// ============================================================================

/**
 * Creates a new manifest with defaults.
 */
export function createManifest(options: {
  name: string;
  version?: string;
  description?: string;
  author?: string | AuthorInfo;
}): CardManifest {
  return {
    manifestVersion: MANIFEST_VERSION,
    name: options.name,
    version: options.version ?? '1.0.0',
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.author !== undefined ? { author: options.author } : {}),
    keywords: [],
    license: 'MIT',
    dependencies: {},
    cards: [],
  };
}

/**
 * Generates a manifest from a directory.
 */
export function generateManifestFromDir(
  dir: string,
  files: string[],
  existingManifest?: Partial<CardManifest>
): CardManifest {
  const cardFiles = files.filter(f => 
    f.endsWith('.cardscript') || 
    f.endsWith('.card.ts') || 
    f.endsWith('.card.js')
  );
  
  const manifestOpts: { name: string; version?: string; description?: string; author?: string | AuthorInfo } = {
    name: existingManifest?.name ?? dir.split('/').pop() ?? 'unknown',
    version: existingManifest?.version ?? '1.0.0',
  };
  if (existingManifest?.description !== undefined) manifestOpts.description = existingManifest.description;
  if (existingManifest?.author !== undefined) manifestOpts.author = existingManifest.author;
  const manifest = createManifest(manifestOpts);
  
  manifest.cardscript = cardFiles.filter(f => f.endsWith('.cardscript'));
  
  manifest.cards = cardFiles
    .filter(f => f.endsWith('.card.ts') || f.endsWith('.card.js'))
    .map(f => ({
      id: f.replace(/\.(card\.ts|card\.js)$/, '').replace(/[\/\\]/g, '.'),
      file: f,
    }));
  
  // Merge with existing
  return {
    ...manifest,
    ...existingManifest,
    manifestVersion: MANIFEST_VERSION,
  };
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Converts a manifest to JSON string.
 */
export function serializeManifest(manifest: CardManifest, pretty = true): string {
  return JSON.stringify(manifest, null, pretty ? 2 : undefined);
}

/**
 * Creates a minimal manifest string.
 */
export function createMinimalManifest(name: string, version: string): string {
  return serializeManifest({
    manifestVersion: MANIFEST_VERSION,
    name,
    version,
  });
}

// ============================================================================
// DEPENDENCY RESOLUTION
// ============================================================================

/**
 * Resolved dependency.
 */
export interface ResolvedDependency {
  name: string;
  version: string;
  manifest: CardManifest;
  dependencies: ResolvedDependency[];
}

/**
 * Dependency resolver.
 */
export interface DependencyResolver {
  resolve(name: string, constraint: SemverConstraint | string): Promise<CardManifest | null>;
  list(name: string): Promise<string[]>;
}

/**
 * Resolves all dependencies of a manifest.
 */
export async function resolveDependencies(
  manifest: CardManifest,
  resolver: DependencyResolver,
  visited = new Set<string>()
): Promise<ResolvedDependency[]> {
  const result: ResolvedDependency[] = [];
  
  const deps = manifest.dependencies ?? {};
  
  for (const [name, constraint] of Object.entries(deps)) {
    const key = `${name}@${typeof constraint === 'string' ? constraint : JSON.stringify(constraint)}`;
    
    if (visited.has(key)) {
      continue; // Skip circular dependencies
    }
    
    visited.add(key);
    
    const resolved = await resolver.resolve(name, constraint);
    if (!resolved) {
      throw new Error(`Could not resolve dependency: ${name}`);
    }
    
    const nested = await resolveDependencies(resolved, resolver, visited);
    
    result.push({
      name,
      version: resolved.version,
      manifest: resolved,
      dependencies: nested,
    });
  }
  
  return result;
}

/**
 * Flattens dependency tree to a list.
 */
export function flattenDependencies(deps: ResolvedDependency[]): Map<string, CardManifest> {
  const result = new Map<string, CardManifest>();
  
  const flatten = (list: ResolvedDependency[]) => {
    for (const dep of list) {
      if (!result.has(dep.name)) {
        result.set(dep.name, dep.manifest);
        flatten(dep.dependencies);
      }
    }
  };
  
  flatten(deps);
  return result;
}

// ============================================================================
// COMPATIBILITY
// ============================================================================

/**
 * Checks if a manifest is compatible with the current environment.
 */
export function checkCompatibility(
  manifest: CardManifest,
  environment: {
    os?: string;
    cardplayVersion?: string;
    browserFeatures?: string[];
    webApis?: string[];
    audioFeatures?: string[];
  }
): { compatible: boolean; issues: string[] } {
  const issues: string[] = [];
  
  const platform = manifest.platform;
  if (!platform) {
    return { compatible: true, issues: [] };
  }
  
  // Check OS
  if (platform.os && environment.os) {
    if (!platform.os.includes(environment.os as 'windows' | 'macos' | 'linux' | 'web' | 'ios' | 'android')) {
      issues.push(`Unsupported OS: ${environment.os}`);
    }
  }
  
  // Check Cardplay version
  if (platform.cardplayVersion && environment.cardplayVersion) {
    const constraint = typeof platform.cardplayVersion === 'string'
      ? { range: platform.cardplayVersion }
      : platform.cardplayVersion;
    
    if (!satisfiesConstraint(environment.cardplayVersion, constraint)) {
      issues.push(`Incompatible Cardplay version: requires ${JSON.stringify(constraint)}, have ${environment.cardplayVersion}`);
    }
  }
  
  // Check browser features
  if (platform.browserFeatures && environment.browserFeatures) {
    for (const feature of platform.browserFeatures) {
      if (!environment.browserFeatures.includes(feature)) {
        issues.push(`Missing browser feature: ${feature}`);
      }
    }
  }
  
  // Check audio features
  if (platform.audioFeatures && environment.audioFeatures) {
    for (const feature of platform.audioFeatures) {
      if (!environment.audioFeatures.includes(feature)) {
        issues.push(`Missing audio feature: ${feature}`);
      }
    }
  }
  
  return {
    compatible: issues.length === 0,
    issues,
  };
}

/**
 * Checks if a version satisfies a constraint.
 */
function satisfiesConstraint(version: string, constraint: SemverConstraint): boolean {
  if (constraint.exact) {
    return version === constraint.exact;
  }
  
  const v = parseVersion(version);
  if (!v) return false;
  
  if (constraint.min) {
    const min = parseVersion(constraint.min);
    if (min && compareVersions(v, min) < 0) return false;
  }
  
  if (constraint.max) {
    const max = parseVersion(constraint.max);
    if (max && compareVersions(v, max) >= 0) return false;
  }
  
  if (constraint.range) {
    // Simplified range matching
    const range = constraint.range;
    if (range.startsWith('^')) {
      const base = parseVersion(range.slice(1));
      if (base) {
        // ^1.2.3 means >=1.2.3 <2.0.0
        if (v.major !== base.major) return false;
        if (compareVersions(v, base) < 0) return false;
      }
    } else if (range.startsWith('~')) {
      const base = parseVersion(range.slice(1));
      if (base) {
        // ~1.2.3 means >=1.2.3 <1.3.0
        if (v.major !== base.major || v.minor !== base.minor) return false;
        if (compareVersions(v, base) < 0) return false;
      }
    }
  }
  
  return true;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

function parseVersion(version: string): ParsedVersion | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  };
}

function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}
