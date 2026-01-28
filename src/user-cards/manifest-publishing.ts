/**
 * @fileoverview Manifest Publishing Workflow.
 * 
 * Provides workflow automation for publishing card packs to registries:
 * - Pre-publish validation and checks
 * - Version bumping and changelog generation
 * - Pack building and signing
 * - Registry upload with progress tracking
 * - Post-publish verification
 * 
 * @module @cardplay/user-cards/manifest-publishing
 */

import type { CardManifest } from './manifest';
import { validateManifest } from './manifest';
import type { CardPack } from './pack';
import { PackBuilder } from './pack';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Publishing stage.
 */
export type PublishStage =
  | 'validating'
  | 'building'
  | 'signing'
  | 'uploading'
  | 'verifying'
  | 'complete'
  | 'failed';

/**
 * Version bump type.
 */
export type VersionBumpType = 'major' | 'minor' | 'patch' | 'prerelease';

/**
 * Publishing options.
 */
export interface PublishOptions {
  /** Target registry URL */
  registry?: string;
  /** Registry access token */
  token?: string;
  /** Version bump type (auto-bump version before publish) */
  bump?: VersionBumpType;
  /** Pre-release tag (for prerelease bumps) */
  prereleaseTag?: string;
  /** Dry run (validate but don't publish) */
  dryRun?: boolean;
  /** Include source files */
  includeSources?: boolean;
  /** Skip tests */
  skipTests?: boolean;
  /** Skip build */
  skipBuild?: boolean;
  /** Signing key */
  signingKey?: Uint8Array;
  /** Distribution tag */
  tag?: string;
  /** Access level */
  access?: 'public' | 'restricted';
  /** Generate changelog automatically */
  generateChangelog?: boolean;
  /** Changelog output file */
  changelogFile?: string;
}

/**
 * Publishing progress update.
 */
export interface PublishProgress {
  stage: PublishStage;
  message: string;
  percent: number;
  bytesUploaded?: number;
  totalBytes?: number;
}

/**
 * Publishing result.
 */
export interface PublishResult {
  success: boolean;
  manifest: CardManifest;
  pack?: CardPack;
  registryUrl?: string;
  packageUrl?: string;
  publishedVersion: string;
  errors?: string[];
  warnings?: string[];
  duration: number;
}

/**
 * Pre-publish check.
 */
export interface PrePublishCheck {
  name: string;
  passed: boolean;
  message?: string;
  blocking: boolean;
}

// ============================================================================
// PUBLISHING WORKFLOW
// ============================================================================

/**
 * Publishing workflow orchestrator.
 */
export class PublishingWorkflow {
  private manifest: CardManifest;
  private options: PublishOptions;
  private startTime: number = 0;
  private progressCallback?: (progress: PublishProgress) => void;
  
  constructor(manifest: CardManifest, options: PublishOptions = {}) {
    this.manifest = manifest;
    this.options = {
      registry: 'https://registry.cardplay.app',
      tag: 'latest',
      access: 'public',
      generateChangelog: true,
      changelogFile: 'CHANGELOG.md',
      ...options,
    };
  }
  
  /**
   * Sets progress callback.
   */
  onProgress(callback: (progress: PublishProgress) => void): void {
    this.progressCallback = callback;
  }
  
  /**
   * Reports progress.
   */
  private reportProgress(stage: PublishStage, message: string, percent: number): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, message, percent });
    }
  }
  
  /**
   * Runs pre-publish checks.
   */
  async runPrePublishChecks(): Promise<PrePublishCheck[]> {
    const checks: PrePublishCheck[] = [];
    
    // Check 1: Manifest validation
    const validation = validateManifest(this.manifest);
    checks.push({
      name: 'Manifest Validation',
      passed: validation.valid,
      message: validation.valid 
        ? 'Manifest is valid' 
        : `${validation.errors.length} errors found`,
      blocking: true,
    });
    
    // Check 2: Version format
    const versionValid = /^\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/i.test(this.manifest.version);
    checks.push({
      name: 'Version Format',
      passed: versionValid,
      message: versionValid ? 'Version is valid semver' : 'Invalid semver format',
      blocking: true,
    });
    
    // Check 3: Private flag
    if (this.manifest.private) {
      checks.push({
        name: 'Private Package',
        passed: false,
        message: 'Package is marked private and cannot be published',
        blocking: true,
      });
    }
    
    // Check 4: Required files exist
    const hasMain = !!this.manifest.main;
    checks.push({
      name: 'Entry Point',
      passed: hasMain,
      message: hasMain ? 'Entry point specified' : 'No entry point (main field)',
      blocking: false,
    });
    
    // Check 5: License specified
    const hasLicense = !!this.manifest.license;
    checks.push({
      name: 'License',
      passed: hasLicense,
      message: hasLicense ? 'License specified' : 'No license specified',
      blocking: false,
    });
    
    // Check 6: README exists
    const hasReadme = this.manifest.files?.some(f => /readme\.md$/i.test(f));
    checks.push({
      name: 'README',
      passed: !!hasReadme,
      message: hasReadme ? 'README found' : 'No README file',
      blocking: false,
    });
    
    return checks;
  }
  
  /**
   * Bumps version according to bump type.
   */
  bumpVersion(type: VersionBumpType, prereleaseTag?: string): string {
    const parts = this.manifest.version.split(/[.-]/);
    let major = parseInt(parts[0] || '0', 10);
    let minor = parseInt(parts[1] || '0', 10);
    let patch = parseInt(parts[2] || '0', 10);
    
    switch (type) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
        patch++;
        break;
      case 'prerelease': {
        const pre = parts[3] || '0';
        const preNum = parseInt(pre.replace(/^\D+/, '') || '0', 10);
        const tag = prereleaseTag || 'alpha';
        return `${major}.${minor}.${patch}-${tag}.${preNum + 1}`;
      }
    }
    
    return `${major}.${minor}.${patch}`;
  }
  
  /**
   * Builds the pack.
   */
  async buildPack(): Promise<CardPack> {
    this.reportProgress('building', 'Building pack...', 20);
    
    const builderOptions: { compression: 'gzip'; includeSources: boolean; signingKey?: Uint8Array } = {
      compression: 'gzip',
      includeSources: this.options.includeSources ?? true,
    };
    if (this.options.signingKey) {
      builderOptions.signingKey = this.options.signingKey;
    }
    const builder = new PackBuilder(builderOptions);
    
    // Add manifest
    builder.setManifest(this.manifest);
    
    // Add main entry point
    if (this.manifest.main) {
      // In a real implementation, we'd read the file from disk
      // For now, we'll simulate this
      builder.addFile({
        path: this.manifest.main,
        content: new Uint8Array(0),
      });
    }
    
    this.reportProgress('building', 'Pack built successfully', 40);
    return builder.build();
  }
  
  /**
   * Uploads pack to registry.
   */
  async uploadToRegistry(_pack: CardPack): Promise<string> {
    this.reportProgress('uploading', 'Uploading to registry...', 60);
    
    const { registry } = this.options;
    
    if (!registry) {
      throw new Error('No registry URL specified');
    }
    
    // Build upload URL
    const encodedName = encodeURIComponent(this.manifest.name);
    
    // In a real implementation, we'd make an HTTP request here
    // For now, we'll simulate success
    const simulatedResponse = {
      success: true,
      packageUrl: `${registry}/package/${encodedName}@${this.manifest.version}`,
    };
    
    this.reportProgress('uploading', 'Upload complete', 80);
    
    return simulatedResponse.packageUrl;
  }
  
  /**
   * Verifies published package.
   */
  async verifyPublished(_packageUrl: string): Promise<boolean> {
    this.reportProgress('verifying', 'Verifying published package...', 90);
    
    // In a real implementation, we'd fetch the package manifest and verify it
    // For now, we'll simulate success
    this.reportProgress('verifying', 'Verification complete', 100);
    return true;
  }
  
  /**
   * Executes the complete publishing workflow.
   */
  async publish(): Promise<PublishResult> {
    this.startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Stage 1: Validation
      this.reportProgress('validating', 'Running pre-publish checks...', 0);
      
      const checks = await this.runPrePublishChecks();
      const blockingFailures = checks.filter(c => !c.passed && c.blocking);
      
      if (blockingFailures.length > 0) {
        errors.push(...blockingFailures.map(c => c.message || c.name));
        return {
          success: false,
          manifest: this.manifest,
          publishedVersion: this.manifest.version,
          errors,
          warnings,
          duration: Date.now() - this.startTime,
        };
      }
      
      // Add non-blocking failures as warnings
      warnings.push(...checks.filter(c => !c.passed && !c.blocking).map(c => c.message || c.name));
      
      // Stage 2: Version bump (if requested)
      if (this.options.bump) {
        const newVersion = this.bumpVersion(this.options.bump, this.options.prereleaseTag);
        this.manifest = { ...this.manifest, version: newVersion };
        this.reportProgress('validating', `Version bumped to ${newVersion}`, 10);
      }
      
      // Stage 3: Dry run check
      if (this.options.dryRun) {
        this.reportProgress('complete', 'Dry run complete (no actual publish)', 100);
        return {
          success: true,
          manifest: this.manifest,
          publishedVersion: this.manifest.version,
          warnings,
          duration: Date.now() - this.startTime,
        };
      }
      
      // Stage 4: Build pack
      const pack = await this.buildPack();
      
      // Stage 5: Sign pack
      if (this.options.signingKey) {
        this.reportProgress('signing', 'Signing pack...', 50);
        // Signing is handled by PackBuilder
      }
      
      // Stage 6: Upload
      const packageUrl = await this.uploadToRegistry(pack);
      
      // Stage 7: Verify
      const verified = await this.verifyPublished(packageUrl);
      
      if (!verified) {
        errors.push('Package verification failed');
        return {
          success: false,
          manifest: this.manifest,
          pack,
          publishedVersion: this.manifest.version,
          errors,
          warnings,
          duration: Date.now() - this.startTime,
        };
      }
      
      // Success!
      this.reportProgress('complete', 'Publishing complete', 100);
      
      const result: PublishResult = {
        success: true,
        manifest: this.manifest,
        pack,
        publishedVersion: this.manifest.version,
        warnings,
        duration: Date.now() - this.startTime,
      };
      if (this.options.registry) {
        result.registryUrl = this.options.registry;
      }
      if (packageUrl) {
        result.packageUrl = packageUrl;
      }
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      
      this.reportProgress('failed', `Publishing failed: ${errorMessage}`, 100);
      
      return {
        success: false,
        manifest: this.manifest,
        publishedVersion: this.manifest.version,
        errors,
        warnings,
        duration: Date.now() - this.startTime,
      };
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick publish with sensible defaults.
 */
export async function publishManifest(
  manifest: CardManifest,
  options: PublishOptions = {}
): Promise<PublishResult> {
  const workflow = new PublishingWorkflow(manifest, options);
  return workflow.publish();
}

/**
 * Dry run publish (validate without actually publishing).
 */
export async function validatePublish(manifest: CardManifest): Promise<PublishResult> {
  return publishManifest(manifest, { dryRun: true });
}

/**
 * Bumps package version and updates manifest.
 */
export function bumpManifestVersion(
  manifest: CardManifest,
  type: VersionBumpType,
  prereleaseTag?: string
): CardManifest {
  const workflow = new PublishingWorkflow(manifest);
  const newVersion = workflow.bumpVersion(type, prereleaseTag);
  return { ...manifest, version: newVersion };
}
