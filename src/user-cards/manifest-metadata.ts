/**
 * @fileoverview Manifest Metadata Extraction.
 * 
 * Provides utilities for extracting and analyzing metadata from card manifests:
 * - Dependency analysis
 * - Capability detection
 * - Resource summaries
 * - Compatibility matrices
 * 
 * @module @cardplay/user-cards/manifest-metadata
 */

import type { CardManifest, SemverConstraint } from './manifest';

// ============================================================================
// METADATA EXTRACTION
// ============================================================================

/**
 * Extracted manifest metadata.
 */
export interface ManifestMetadata {
  /** Package identity */
  identity: PackageIdentity;
  /** Dependency information */
  dependencies: DependencyMetadata;
  /** Resource summaries */
  resources: ResourceSummary;
  /** Capability requirements */
  capabilities: CapabilityRequirements;
  /** Authorship info */
  authorship: AuthorshipMetadata;
  /** Size estimates */
  sizes: SizeEstimates;
  /** Compatibility info */
  compatibility: CompatibilityInfo;
}

/**
 * Package identity metadata.
 */
export interface PackageIdentity {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  category?: string;
  keywords: string[];
  homepage?: string;
  license?: string;
}

/**
 * Dependency metadata.
 */
export interface DependencyMetadata {
  /** Total dependency count */
  totalCount: number;
  /** Direct dependencies */
  directCount: number;
  /** Peer dependencies */
  peerCount: number;
  /** Optional dependencies */
  optionalCount: number;
  /** Dev dependencies */
  devCount: number;
  /** Bundled dependencies */
  bundledCount: number;
  /** Dependency list */
  list: DependencyInfo[];
  /** Dependency graph depth estimate */
  estimatedDepth: number;
}

/**
 * Individual dependency info.
 */
export interface DependencyInfo {
  name: string;
  version: SemverConstraint | string;
  type: 'runtime' | 'peer' | 'optional' | 'dev' | 'bundled';
  optional: boolean;
}

/**
 * Resource summary.
 */
export interface ResourceSummary {
  /** Card count */
  cardCount: number;
  /** Deck template count */
  deckCount: number;
  /** Preset count */
  presetCount: number;
  /** Sample count */
  sampleCount: number;
  /** Icon count */
  iconCount: number;
  /** Media count */
  mediaCount: number;
  /** CardScript file count */
  cardscriptCount: number;
  /** Total file count estimate */
  fileCount: number;
  /** Card IDs */
  cardIds: string[];
  /** Deprecated card IDs */
  deprecatedCardIds: string[];
}

/**
 * Capability requirements.
 */
export interface CapabilityRequirements {
  /** Required browser features */
  browserFeatures: string[];
  /** Required Web APIs */
  webApis: string[];
  /** Required audio features */
  audioFeatures: string[];
  /** Minimum Cardplay version */
  minCardplayVersion?: string;
  /** Engine requirements */
  engines: Record<string, string>;
  /** Requires WASM */
  requiresWasm: boolean;
  /** Requires AudioWorklet */
  requiresWorklet: boolean;
  /** Requires MIDI */
  requiresMidi: boolean;
}

/**
 * Authorship metadata.
 */
export interface AuthorshipMetadata {
  /** Author name */
  authorName?: string;
  /** Author email */
  authorEmail?: string;
  /** Author URL */
  authorUrl?: string;
  /** Contributor count */
  contributorCount: number;
  /** Contributors list */
  contributors: string[];
  /** Repository URL */
  repositoryUrl?: string;
  /** Repository type */
  repositoryType?: string;
  /** Bug tracker URL */
  bugsUrl?: string;
  /** Is open source */
  isOpenSource: boolean;
}

/**
 * Size estimates.
 */
export interface SizeEstimates {
  /** Estimated download size (bytes) */
  estimatedDownloadSize: number;
  /** Estimated installed size (bytes) */
  estimatedInstalledSize: number;
  /** Has large samples */
  hasLargeSamples: boolean;
  /** Has video media */
  hasVideoMedia: boolean;
}

/**
 * Compatibility info.
 */
export interface CompatibilityInfo {
  /** Supported platforms */
  supportedPlatforms: string[];
  /** Requires specific OS */
  requiresSpecificOs: boolean;
  /** Minimum browser version */
  minBrowserVersion?: string;
  /** Is cross-platform */
  isCrossPlatform: boolean;
  /** Has platform-specific code */
  hasPlatformSpecific: boolean;
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extracts metadata from a manifest.
 */
export function extractMetadata(manifest: CardManifest): ManifestMetadata {
  return {
    identity: extractIdentity(manifest),
    dependencies: extractDependencies(manifest),
    resources: extractResources(manifest),
    capabilities: extractCapabilities(manifest),
    authorship: extractAuthorship(manifest),
    sizes: estimateSizes(manifest),
    compatibility: extractCompatibility(manifest),
  };
}

/**
 * Extracts package identity.
 */
function extractIdentity(manifest: CardManifest): PackageIdentity {
  const result: PackageIdentity = {
    name: manifest.name,
    version: manifest.version,
    keywords: manifest.keywords ?? [],
  };
  if (manifest.displayName !== undefined) result.displayName = manifest.displayName;
  if (manifest.description !== undefined) result.description = manifest.description;
  if (manifest.category !== undefined) result.category = manifest.category;
  if (manifest.homepage !== undefined) result.homepage = manifest.homepage;
  const license = typeof manifest.license === 'string' 
    ? manifest.license 
    : manifest.license?.type;
  if (license !== undefined) result.license = license;
  return result;
}

/**
 * Extracts dependency metadata.
 */
function extractDependencies(manifest: CardManifest): DependencyMetadata {
  const list: DependencyInfo[] = [];
  
  const runtime = manifest.dependencies ?? {};
  for (const [name, version] of Object.entries(runtime)) {
    list.push({ name, version, type: 'runtime', optional: false });
  }
  
  const peer = manifest.peerDependencies ?? {};
  for (const [name, version] of Object.entries(peer)) {
    list.push({ name, version, type: 'peer', optional: false });
  }
  
  const optional = manifest.optionalDependencies ?? {};
  for (const [name, version] of Object.entries(optional)) {
    list.push({ name, version, type: 'optional', optional: true });
  }
  
  const dev = manifest.devDependencies ?? {};
  for (const [name, version] of Object.entries(dev)) {
    list.push({ name, version, type: 'dev', optional: false });
  }
  
  const bundled = manifest.bundledDependencies ?? [];
  for (const name of bundled) {
    list.push({ name, version: '*', type: 'bundled', optional: false });
  }
  
  return {
    totalCount: list.length,
    directCount: Object.keys(runtime).length,
    peerCount: Object.keys(peer).length,
    optionalCount: Object.keys(optional).length,
    devCount: Object.keys(dev).length,
    bundledCount: bundled.length,
    list,
    estimatedDepth: estimateDependencyDepth(list.length),
  };
}

/**
 * Estimates dependency tree depth based on count.
 */
function estimateDependencyDepth(count: number): number {
  if (count === 0) return 0;
  if (count <= 5) return 1;
  if (count <= 15) return 2;
  if (count <= 30) return 3;
  return Math.ceil(Math.log2(count));
}

/**
 * Extracts resource summary.
 */
function extractResources(manifest: CardManifest): ResourceSummary {
  const cards = manifest.cards ?? [];
  const cardIds = cards.map(c => c.id);
  const deprecatedCardIds = cards
    .filter(c => c.deprecated)
    .map(c => c.id);
  
  return {
    cardCount: cards.length,
    deckCount: (manifest.decks ?? []).length,
    presetCount: (manifest.presets ?? []).length,
    sampleCount: (manifest.samples ?? []).length,
    iconCount: (manifest.icons ?? []).length,
    mediaCount: (manifest.media ?? []).length,
    cardscriptCount: (manifest.cardscript ?? []).length,
    fileCount: (manifest.files ?? []).length,
    cardIds,
    deprecatedCardIds,
  };
}

/**
 * Extracts capability requirements.
 */
function extractCapabilities(manifest: CardManifest): CapabilityRequirements {
  const platform = manifest.platform ?? {};
  const audioFeatures = platform.audioFeatures ?? [];
  
  const result: CapabilityRequirements = {
    browserFeatures: platform.browserFeatures ?? [],
    webApis: platform.webApis ?? [],
    audioFeatures,
    engines: manifest.engines ?? {},
    requiresWasm: audioFeatures.includes('wasm'),
    requiresWorklet: audioFeatures.includes('worklet'),
    requiresMidi: audioFeatures.includes('midi'),
  };
  
  const minVersion = typeof platform.cardplayVersion === 'string'
    ? platform.cardplayVersion
    : platform.cardplayVersion?.min;
  if (minVersion !== undefined) result.minCardplayVersion = minVersion;
  
  return result;
}

/**
 * Extracts authorship metadata.
 */
function extractAuthorship(manifest: CardManifest): AuthorshipMetadata {
  const author = manifest.author;
  const authorName = typeof author === 'string' 
    ? author 
    : author?.name;
  const authorEmail = typeof author === 'object' 
    ? author?.email 
    : undefined;
  const authorUrl = typeof author === 'object' 
    ? author?.url 
    : undefined;
  
  const contributors = manifest.contributors ?? [];
  const contributorNames = contributors.map(c =>
    typeof c === 'string' ? c : c.name
  );
  
  const repo = manifest.repository;
  const repoUrl = typeof repo === 'string' 
    ? repo 
    : repo?.url;
  const repoType = typeof repo === 'object' 
    ? repo?.type 
    : undefined;
  
  const isOpenSource = manifest.license !== undefined && !manifest.private;
  
  const result: AuthorshipMetadata = {
    contributorCount: contributors.length,
    contributors: contributorNames,
    isOpenSource,
  };
  
  if (authorName !== undefined) result.authorName = authorName;
  if (authorEmail !== undefined) result.authorEmail = authorEmail;
  if (authorUrl !== undefined) result.authorUrl = authorUrl;
  if (repoUrl !== undefined) result.repositoryUrl = repoUrl;
  if (repoType !== undefined) result.repositoryType = repoType;
  if (manifest.bugs !== undefined) result.bugsUrl = manifest.bugs;
  
  return result;
}

/**
 * Estimates package sizes.
 */
function estimateSizes(manifest: CardManifest): SizeEstimates {
  const sampleCount = (manifest.samples ?? []).length;
  const mediaCount = (manifest.media ?? []).length;
  const cardCount = (manifest.cards ?? []).length;
  const fileCount = (manifest.files ?? []).length;
  
  const media = manifest.media ?? [];
  const hasVideoMedia = media.some(m => m.type === 'video');
  
  // Rough size estimates
  const avgSampleSize = 500_000; // 500KB per sample
  const avgMediaSize = hasVideoMedia ? 5_000_000 : 500_000; // 5MB video, 500KB image
  const avgCardSize = 50_000; // 50KB per card
  const avgFileSize = 10_000; // 10KB per misc file
  
  const estimatedDownloadSize = 
    (sampleCount * avgSampleSize) +
    (mediaCount * avgMediaSize) +
    (cardCount * avgCardSize) +
    (fileCount * avgFileSize);
  
  const estimatedInstalledSize = estimatedDownloadSize * 1.2; // 20% overhead
  
  const hasLargeSamples = sampleCount > 10;
  
  return {
    estimatedDownloadSize,
    estimatedInstalledSize,
    hasLargeSamples,
    hasVideoMedia,
  };
}

/**
 * Extracts compatibility info.
 */
function extractCompatibility(manifest: CardManifest): CompatibilityInfo {
  const platform = manifest.platform ?? {};
  const supportedOs = platform.os ?? [];
  
  const supportedPlatforms = supportedOs.length > 0 
    ? supportedOs 
    : ['windows', 'macos', 'linux', 'web', 'ios', 'android'];
  
  const requiresSpecificOs = supportedOs.length > 0 && supportedOs.length < 6;
  const isCrossPlatform = !requiresSpecificOs;
  const hasPlatformSpecific = (manifest.browser !== undefined && manifest.browser !== manifest.main);
  
  return {
    supportedPlatforms,
    requiresSpecificOs,
    isCrossPlatform,
    hasPlatformSpecific,
  };
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyzes manifest complexity.
 */
export interface ComplexityAnalysis {
  score: number;
  level: 'simple' | 'moderate' | 'complex' | 'very-complex';
  factors: string[];
}

/**
 * Analyzes manifest complexity.
 */
export function analyzeComplexity(metadata: ManifestMetadata): ComplexityAnalysis {
  const factors: string[] = [];
  let score = 0;
  
  if (metadata.dependencies.totalCount > 10) {
    score += 20;
    factors.push(`${metadata.dependencies.totalCount} dependencies`);
  } else if (metadata.dependencies.totalCount > 5) {
    score += 10;
    factors.push(`${metadata.dependencies.totalCount} dependencies`);
  }
  
  if (metadata.resources.cardCount > 20) {
    score += 15;
    factors.push(`${metadata.resources.cardCount} cards`);
  } else if (metadata.resources.cardCount > 10) {
    score += 10;
    factors.push(`${metadata.resources.cardCount} cards`);
  }
  
  if (metadata.resources.sampleCount > 50) {
    score += 15;
    factors.push(`${metadata.resources.sampleCount} samples`);
  } else if (metadata.resources.sampleCount > 20) {
    score += 10;
    factors.push(`${metadata.resources.sampleCount} samples`);
  }
  
  if (metadata.capabilities.browserFeatures.length > 5) {
    score += 10;
    factors.push(`${metadata.capabilities.browserFeatures.length} browser features required`);
  }
  
  if (metadata.sizes.estimatedDownloadSize > 50_000_000) {
    score += 15;
    factors.push('Large download size (>50MB)');
  } else if (metadata.sizes.estimatedDownloadSize > 10_000_000) {
    score += 10;
    factors.push('Medium download size (>10MB)');
  }
  
  if (metadata.compatibility.requiresSpecificOs) {
    score += 10;
    factors.push('Platform-specific code');
  }
  
  let level: ComplexityAnalysis['level'];
  if (score < 20) {
    level = 'simple';
  } else if (score < 40) {
    level = 'moderate';
  } else if (score < 60) {
    level = 'complex';
  } else {
    level = 'very-complex';
  }
  
  return { score, level, factors };
}

/**
 * Generates a summary string for metadata.
 */
export function summarizeMetadata(metadata: ManifestMetadata): string {
  const parts: string[] = [];
  
  parts.push(`${metadata.identity.name} v${metadata.identity.version}`);
  
  if (metadata.identity.description) {
    parts.push(metadata.identity.description);
  }
  
  if (metadata.resources.cardCount > 0) {
    parts.push(`${metadata.resources.cardCount} card(s)`);
  }
  
  if (metadata.dependencies.directCount > 0) {
    parts.push(`${metadata.dependencies.directCount} dep(s)`);
  }
  
  if (metadata.resources.sampleCount > 0) {
    parts.push(`${metadata.resources.sampleCount} sample(s)`);
  }
  
  const sizeMB = (metadata.sizes.estimatedDownloadSize / 1_000_000).toFixed(1);
  parts.push(`~${sizeMB}MB`);
  
  return parts.join(' • ');
}

/**
 * Compares two manifests and reports differences.
 */
export interface MetadataDiff {
  identity: IdentityDiff;
  dependencies: DependencyDiff;
  resources: ResourceDiff;
  capabilities: CapabilityDiff;
}

/**
 * Identity diff.
 */
export interface IdentityDiff {
  versionChanged: boolean;
  oldVersion?: string;
  newVersion?: string;
  descriptionChanged: boolean;
  keywordsAdded: string[];
  keywordsRemoved: string[];
}

/**
 * Dependency diff.
 */
export interface DependencyDiff {
  added: DependencyInfo[];
  removed: DependencyInfo[];
  updated: Array<{ name: string; oldVersion: string; newVersion: string }>;
}

/**
 * Resource diff.
 */
export interface ResourceDiff {
  cardsAdded: string[];
  cardsRemoved: string[];
  cardsDeprecated: string[];
  samplesAdded: number;
  samplesRemoved: number;
}

/**
 * Capability diff.
 */
export interface CapabilityDiff {
  featuresAdded: string[];
  featuresRemoved: string[];
  minVersionChanged: boolean;
  oldMinVersion?: string;
  newMinVersion?: string;
}

/**
 * Compares two metadata objects.
 */
export function compareMetadata(
  oldMeta: ManifestMetadata,
  newMeta: ManifestMetadata
): MetadataDiff {
  return {
    identity: compareIdentity(oldMeta.identity, newMeta.identity),
    dependencies: compareDependencies(oldMeta.dependencies, newMeta.dependencies),
    resources: compareResources(oldMeta.resources, newMeta.resources),
    capabilities: compareCapabilities(oldMeta.capabilities, newMeta.capabilities),
  };
}

function compareIdentity(
  oldId: PackageIdentity,
  newId: PackageIdentity
): IdentityDiff {
  const versionChanged = oldId.version !== newId.version;
  const descriptionChanged = oldId.description !== newId.description;
  
  const oldKeywords = new Set(oldId.keywords);
  const newKeywords = new Set(newId.keywords);
  
  const keywordsAdded = Array.from(newKeywords).filter(k => !oldKeywords.has(k));
  const keywordsRemoved = Array.from(oldKeywords).filter(k => !newKeywords.has(k));
  
  return {
    versionChanged,
    ...(versionChanged ? { oldVersion: oldId.version, newVersion: newId.version } : {}),
    descriptionChanged,
    keywordsAdded,
    keywordsRemoved,
  };
}

function compareDependencies(
  oldDeps: DependencyMetadata,
  newDeps: DependencyMetadata
): DependencyDiff {
  const oldMap = new Map(oldDeps.list.map(d => [d.name, d]));
  const newMap = new Map(newDeps.list.map(d => [d.name, d]));
  
  const added: DependencyInfo[] = [];
  const removed: DependencyInfo[] = [];
  const updated: Array<{ name: string; oldVersion: string; newVersion: string }> = [];
  
  for (const dep of newDeps.list) {
    if (!oldMap.has(dep.name)) {
      added.push(dep);
    } else {
      const oldDep = oldMap.get(dep.name)!;
      const oldVer = typeof oldDep.version === 'string' ? oldDep.version : JSON.stringify(oldDep.version);
      const newVer = typeof dep.version === 'string' ? dep.version : JSON.stringify(dep.version);
      if (oldVer !== newVer) {
        updated.push({ name: dep.name, oldVersion: oldVer, newVersion: newVer });
      }
    }
  }
  
  for (const dep of oldDeps.list) {
    if (!newMap.has(dep.name)) {
      removed.push(dep);
    }
  }
  
  return { added, removed, updated };
}

function compareResources(
  oldRes: ResourceSummary,
  newRes: ResourceSummary
): ResourceDiff {
  const oldCards = new Set(oldRes.cardIds);
  const newCards = new Set(newRes.cardIds);
  const newDeprecated = new Set(newRes.deprecatedCardIds);
  
  const cardsAdded = Array.from(newCards).filter(id => !oldCards.has(id));
  const cardsRemoved = Array.from(oldCards).filter(id => !newCards.has(id));
  const cardsDeprecated = Array.from(newDeprecated).filter(id => oldCards.has(id));
  
  const samplesAdded = Math.max(0, newRes.sampleCount - oldRes.sampleCount);
  const samplesRemoved = Math.max(0, oldRes.sampleCount - newRes.sampleCount);
  
  return {
    cardsAdded,
    cardsRemoved,
    cardsDeprecated,
    samplesAdded,
    samplesRemoved,
  };
}

function compareCapabilities(
  oldCap: CapabilityRequirements,
  newCap: CapabilityRequirements
): CapabilityDiff {
  const oldFeatures = new Set([
    ...oldCap.browserFeatures,
    ...oldCap.webApis,
    ...oldCap.audioFeatures,
  ]);
  const newFeatures = new Set([
    ...newCap.browserFeatures,
    ...newCap.webApis,
    ...newCap.audioFeatures,
  ]);
  
  const featuresAdded = Array.from(newFeatures).filter(f => !oldFeatures.has(f));
  const featuresRemoved = Array.from(oldFeatures).filter(f => !newFeatures.has(f));
  
  const minVersionChanged = oldCap.minCardplayVersion !== newCap.minCardplayVersion;
  
  return {
    featuresAdded,
    featuresRemoved,
    minVersionChanged,
    ...(minVersionChanged ? {
      oldMinVersion: oldCap.minCardplayVersion,
      newMinVersion: newCap.minCardplayVersion,
    } : {}),
  };
}
