/**
 * @fileoverview Card Pack System.
 * 
 * Provides the CardPack bundle format (.cpk) and utilities for:
 * - Pack bundling from source
 * - Pack installation/uninstallation
 * - Signature verification
 * - Version management
 * - Dependency resolution
 * 
 * @module @cardplay/user-cards/pack
 */

import type { CardManifest } from './manifest';
import { validateManifest, loadManifest } from './manifest';

// Types referenced only for documentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ResolvedDependency as _ResolvedDependency } from './manifest';

// ============================================================================
// PACK FORMAT
// ============================================================================

/**
 * Pack file magic bytes.
 */
export const PACK_MAGIC = 'CPK1';

/**
 * Pack file header.
 */
export interface PackHeader {
  /** Magic bytes */
  magic: string;
  /** Pack format version */
  formatVersion: number;
  /** Pack creation timestamp */
  createdAt: number;
  /** Manifest offset in file */
  manifestOffset: number;
  /** Manifest size */
  manifestSize: number;
  /** Content offset */
  contentOffset: number;
  /** Content size */
  contentSize: number;
  /** Signature offset (0 if unsigned) */
  signatureOffset: number;
  /** Signature size */
  signatureSize: number;
  /** Compression type */
  compression: 'none' | 'gzip' | 'brotli';
  /** Checksum algorithm */
  checksumAlgorithm: 'sha256' | 'sha384' | 'sha512';
  /** Content checksum */
  checksum: string;
}

/**
 * Pack file entry.
 */
export interface PackEntry {
  /** Entry path */
  path: string;
  /** Entry size */
  size: number;
  /** Entry offset in content */
  offset: number;
  /** Entry checksum */
  checksum: string;
  /** Is directory */
  isDirectory: boolean;
  /** File mode (permissions) */
  mode: number;
  /** Modification time */
  mtime: number;
}

/**
 * Pack signature.
 */
export interface PackSignature {
  /** Signature algorithm */
  algorithm: 'ed25519' | 'rsa-sha256';
  /** Public key */
  publicKey: string;
  /** Signature bytes (base64) */
  signature: string;
  /** Signing timestamp */
  signedAt: number;
  /** Signed fields */
  fields: string[];
}

/**
 * Full pack structure.
 */
export interface CardPack {
  header: PackHeader;
  manifest: CardManifest;
  entries: PackEntry[];
  signature?: PackSignature;
  content: Uint8Array;
}

// ============================================================================
// PACK BUILDER
// ============================================================================

/**
 * Pack builder options.
 */
export interface PackBuilderOptions {
  /** Compression type */
  compression?: 'none' | 'gzip' | 'brotli';
  /** Include source files */
  includeSources?: boolean;
  /** Include dev dependencies */
  includeDevDeps?: boolean;
  /** Signing key (private) */
  signingKey?: Uint8Array;
  /** Signing algorithm */
  signingAlgorithm?: 'ed25519' | 'rsa-sha256';
}

/**
 * File to include in pack.
 */
export interface PackFile {
  path: string;
  content: Uint8Array;
  mode?: number;
  mtime?: number;
}

/**
 * Pack builder.
 */
export class PackBuilder {
  private files: PackFile[] = [];
  private manifest: CardManifest | null = null;
  private options: PackBuilderOptions;
  
  constructor(options: PackBuilderOptions = {}) {
    this.options = {
      compression: 'gzip',
      includeSources: true,
      includeDevDeps: false,
      ...options,
    };
  }
  
  /**
   * Sets the manifest.
   */
  setManifest(manifest: CardManifest): this {
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    this.manifest = manifest;
    return this;
  }
  
  /**
   * Adds a file to the pack.
   */
  addFile(file: PackFile): this {
    this.files.push(file);
    return this;
  }
  
  /**
   * Adds multiple files.
   */
  addFiles(files: PackFile[]): this {
    this.files.push(...files);
    return this;
  }
  
  /**
   * Adds files from a directory.
   */
  async addDirectory(
    basePath: string,
    readFile: (path: string) => Promise<Uint8Array>,
    listDir: (path: string) => Promise<string[]>
  ): Promise<this> {
    const processDir = async (dir: string, prefix: string) => {
      const entries = await listDir(dir);
      
      for (const entry of entries) {
        const fullPath = `${dir}/${entry}`;
        const packPath = prefix ? `${prefix}/${entry}` : entry;
        
        try {
          // Try to read as file
          const content = await readFile(fullPath);
          this.addFile({
            path: packPath,
            content,
            mtime: Date.now(),
          });
        } catch {
          // Assume it's a directory
          await processDir(fullPath, packPath);
        }
      }
    };
    
    await processDir(basePath, '');
    return this;
  }
  
  /**
   * Builds the pack.
   */
  async build(): Promise<CardPack> {
    if (!this.manifest) {
      throw new Error('Manifest not set');
    }
    
    // Filter files based on manifest
    let filesToInclude = this.filterFiles();
    
    // Compress content
    const content = await this.compressFiles(filesToInclude);
    
    // Calculate checksum
    const checksum = await this.calculateChecksum(content);
    
    // Build entries
    const entries = this.buildEntries(filesToInclude);
    
    // Build header
    const manifestJson = JSON.stringify(this.manifest);
    const manifestBytes = new TextEncoder().encode(manifestJson);
    
    const header: PackHeader = {
      magic: PACK_MAGIC,
      formatVersion: 1,
      createdAt: Date.now(),
      manifestOffset: 64, // Fixed header size
      manifestSize: manifestBytes.length,
      contentOffset: 64 + manifestBytes.length,
      contentSize: content.length,
      signatureOffset: 0,
      signatureSize: 0,
      compression: this.options.compression ?? 'gzip',
      checksumAlgorithm: 'sha256',
      checksum,
    };
    
    // Sign if key provided
    let signature: PackSignature | undefined;
    if (this.options.signingKey) {
      signature = await this.sign(header, content);
      header.signatureOffset = header.contentOffset + content.length;
      header.signatureSize = JSON.stringify(signature).length;
    }
    
    return {
      header,
      manifest: this.manifest,
      entries,
      ...(signature !== undefined ? { signature } : {}),
      content,
    };
  }
  
  /**
   * Filters files based on manifest rules.
   */
  private filterFiles(): PackFile[] {
    if (!this.manifest) return [];
    
    const include = this.manifest.files ?? ['**/*'];
    const exclude = this.manifest.excludeFiles ?? ['node_modules/**', '.git/**'];
    
    return this.files.filter(file => {
      // Check excludes first
      for (const pattern of exclude) {
        if (this.matchGlob(file.path, pattern)) {
          return false;
        }
      }
      
      // Check includes
      for (const pattern of include) {
        if (this.matchGlob(file.path, pattern)) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  /**
   * Simple glob matching.
   */
  private matchGlob(path: string, pattern: string): boolean {
    // Convert glob to regex
    const regex = pattern
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/{{GLOBSTAR}}/g, '.*');
    
    return new RegExp(`^${regex}$`).test(path);
  }
  
  /**
   * Compresses files into a single content blob.
   */
  private async compressFiles(files: PackFile[]): Promise<Uint8Array> {
    // Simple concatenation for now
    // In reality, we'd use tar-like format with compression
    
    const totalSize = files.reduce((sum, f) => sum + f.content.length, 0);
    const result = new Uint8Array(totalSize);
    
    let offset = 0;
    for (const file of files) {
      result.set(file.content, offset);
      offset += file.content.length;
    }
    
    if (this.options.compression === 'gzip') {
      // Would use CompressionStream in browser
      // For now, return uncompressed
      return result;
    }
    
    return result;
  }
  
  /**
   * Calculates content checksum.
   */
  private async calculateChecksum(content: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', content.buffer as ArrayBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Builds entry list.
   */
  private buildEntries(files: PackFile[]): PackEntry[] {
    let offset = 0;
    
    return files.map(file => {
      const entry: PackEntry = {
        path: file.path,
        size: file.content.length,
        offset,
        checksum: '', // Would calculate per-file checksum
        isDirectory: false,
        mode: file.mode ?? 0o644,
        mtime: file.mtime ?? Date.now(),
      };
      
      offset += file.content.length;
      return entry;
    });
  }
  
  /**
   * Signs the pack.
   */
  private async sign(_header: PackHeader, _content: Uint8Array): Promise<PackSignature> {
    // Would use Web Crypto API for signing
    // This is a placeholder
    return {
      algorithm: this.options.signingAlgorithm ?? 'ed25519',
      publicKey: '',
      signature: '',
      signedAt: Date.now(),
      fields: ['checksum', 'manifestSize', 'contentSize'],
    };
  }
}

// ============================================================================
// PACK READER
// ============================================================================

/**
 * Pack reader.
 */
export class PackReader {
  /**
   * Reads a pack from bytes.
   */
  static async read(data: Uint8Array): Promise<CardPack> {
    // Read header
    const magic = new TextDecoder().decode(data.slice(0, 4));
    if (magic !== PACK_MAGIC) {
      throw new Error('Invalid pack file: bad magic');
    }
    
    // Parse header (simplified - would use DataView for binary format)
    // Header parsing reserved for binary format implementation
    new TextDecoder().decode(data.slice(4, 64));
    // In reality, header would be binary format
    
    // For now, assume JSON-based format for simplicity
    const fullJson = new TextDecoder().decode(data);
    const parsed = JSON.parse(fullJson) as CardPack;
    
    return parsed;
  }
  
  /**
   * Reads just the manifest from a pack.
   */
  static async readManifest(data: Uint8Array): Promise<CardManifest> {
    const pack = await this.read(data);
    return pack.manifest;
  }
  
  /**
   * Extracts a file from the pack.
   */
  static extractFile(pack: CardPack, path: string): Uint8Array | null {
    const entry = pack.entries.find(e => e.path === path);
    if (!entry) return null;
    
    return pack.content.slice(entry.offset, entry.offset + entry.size);
  }
  
  /**
   * Lists all files in the pack.
   */
  static listFiles(pack: CardPack): string[] {
    return pack.entries.map(e => e.path);
  }
}

// ============================================================================
// PACK INSTALLER
// ============================================================================

/**
 * Installation location.
 */
export interface InstallLocation {
  /** Base directory for installed packs */
  baseDir: string;
  /** Write a file */
  writeFile: (path: string, content: Uint8Array) => Promise<void>;
  /** Read a file */
  readFile: (path: string) => Promise<Uint8Array>;
  /** Delete a file */
  deleteFile: (path: string) => Promise<void>;
  /** Create a directory */
  mkdir: (path: string) => Promise<void>;
  /** Remove a directory */
  rmdir: (path: string, recursive?: boolean) => Promise<void>;
  /** List directory */
  listDir: (path: string) => Promise<string[]>;
  /** Check if path exists */
  exists: (path: string) => Promise<boolean>;
}

/**
 * Installed pack info.
 */
export interface InstalledPack {
  name: string;
  version: string;
  manifest: CardManifest;
  installPath: string;
  installedAt: number;
  checksum: string;
}

/**
 * Pack installer.
 */
export class PackInstaller {
  private location: InstallLocation;
  private installed: Map<string, InstalledPack> = new Map();
  
  constructor(location: InstallLocation) {
    this.location = location;
  }
  
  /**
   * Loads the installed packs index.
   */
  async loadIndex(): Promise<void> {
    try {
      const indexPath = `${this.location.baseDir}/index.json`;
      if (await this.location.exists(indexPath)) {
        const data = await this.location.readFile(indexPath);
        const index = JSON.parse(new TextDecoder().decode(data)) as InstalledPack[];
        this.installed = new Map(index.map(p => [p.name, p]));
      }
    } catch {
      // Index doesn't exist yet
    }
  }
  
  /**
   * Saves the installed packs index.
   */
  private async saveIndex(): Promise<void> {
    const index = Array.from(this.installed.values());
    const data = new TextEncoder().encode(JSON.stringify(index, null, 2));
    await this.location.writeFile(`${this.location.baseDir}/index.json`, data);
  }
  
  /**
   * Installs a pack.
   */
  async install(pack: CardPack, options: {
    force?: boolean;
    verify?: boolean;
  } = {}): Promise<InstalledPack> {
    const { force = false, verify = true } = options;
    
    const name = pack.manifest.name;
    const version = pack.manifest.version;
    
    // Check if already installed
    const existing = this.installed.get(name);
    if (existing && !force) {
      if (existing.version === version) {
        throw new Error(`${name}@${version} is already installed`);
      }
    }
    
    // Verify signature if present
    if (verify && pack.signature) {
      const valid = await this.verifySignature(pack);
      if (!valid) {
        throw new Error('Pack signature verification failed');
      }
    }
    
    // Verify checksum
    if (verify) {
      const actualChecksum = await this.calculateChecksum(pack.content);
      if (actualChecksum !== pack.header.checksum) {
        throw new Error('Pack checksum verification failed');
      }
    }
    
    // Uninstall existing version if upgrading
    if (existing) {
      await this.uninstall(name);
    }
    
    // Create install directory
    const installPath = `${this.location.baseDir}/packs/${name}`;
    await this.location.mkdir(installPath);
    
    // Extract files
    for (const entry of pack.entries) {
      if (entry.isDirectory) {
        await this.location.mkdir(`${installPath}/${entry.path}`);
      } else {
        const content = PackReader.extractFile(pack, entry.path);
        if (content) {
          // Ensure parent directory exists
          const dir = entry.path.split('/').slice(0, -1).join('/');
          if (dir) {
            await this.location.mkdir(`${installPath}/${dir}`);
          }
          await this.location.writeFile(`${installPath}/${entry.path}`, content);
        }
      }
    }
    
    // Write manifest
    const manifestData = new TextEncoder().encode(JSON.stringify(pack.manifest, null, 2));
    await this.location.writeFile(`${installPath}/cardpack.json`, manifestData);
    
    // Record installation
    const installed: InstalledPack = {
      name,
      version,
      manifest: pack.manifest,
      installPath,
      installedAt: Date.now(),
      checksum: pack.header.checksum,
    };
    
    this.installed.set(name, installed);
    await this.saveIndex();
    
    return installed;
  }
  
  /**
   * Uninstalls a pack.
   */
  async uninstall(name: string): Promise<boolean> {
    const pack = this.installed.get(name);
    if (!pack) {
      return false;
    }
    
    // Remove files
    await this.location.rmdir(pack.installPath, true);
    
    // Update index
    this.installed.delete(name);
    await this.saveIndex();
    
    return true;
  }
  
  /**
   * Lists installed packs.
   */
  list(): InstalledPack[] {
    return Array.from(this.installed.values());
  }
  
  /**
   * Gets an installed pack.
   */
  get(name: string): InstalledPack | undefined {
    return this.installed.get(name);
  }
  
  /**
   * Checks if a pack is installed.
   */
  isInstalled(name: string, version?: string): boolean {
    const pack = this.installed.get(name);
    if (!pack) return false;
    if (version && pack.version !== version) return false;
    return true;
  }
  
  /**
   * Verifies pack signature.
   */
  private async verifySignature(pack: CardPack): Promise<boolean> {
    if (!pack.signature) return true;
    
    // Would use Web Crypto API for verification
    // This is a placeholder
    return true;
  }
  
  /**
   * Calculates content checksum.
   */
  private async calculateChecksum(content: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', content.buffer as ArrayBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// ============================================================================
// PACK REGISTRY
// ============================================================================

/**
 * Registry pack info.
 */
export interface RegistryPackInfo {
  name: string;
  description?: string;
  author?: string;
  versions: string[];
  latestVersion: string;
  downloads: number;
  rating?: number;
  tags?: string[];
  homepage?: string;
  repository?: string;
}

/**
 * Registry search options.
 */
export interface RegistrySearchOptions {
  query?: string;
  tags?: string[];
  category?: string;
  author?: string;
  sortBy?: 'downloads' | 'rating' | 'updated' | 'name';
  limit?: number;
  offset?: number;
}

/**
 * Pack registry client.
 */
export interface PackRegistry {
  /** Search for packs */
  search(options: RegistrySearchOptions): Promise<RegistryPackInfo[]>;
  
  /** Get pack info */
  getInfo(name: string): Promise<RegistryPackInfo | null>;
  
  /** Get specific version manifest */
  getManifest(name: string, version: string): Promise<CardManifest | null>;
  
  /** Download pack */
  download(name: string, version: string): Promise<Uint8Array>;
  
  /** Publish pack */
  publish(pack: CardPack, token: string): Promise<void>;
  
  /** Unpublish pack version */
  unpublish(name: string, version: string, token: string): Promise<void>;
}

/**
 * Creates an HTTP-based registry client.
 */
export function createHttpRegistry(baseUrl: string): PackRegistry {
  return {
    async search(options) {
      const params = new URLSearchParams();
      if (options.query) params.set('q', options.query);
      if (options.tags) params.set('tags', options.tags.join(','));
      if (options.category) params.set('category', options.category);
      if (options.author) params.set('author', options.author);
      if (options.sortBy) params.set('sort', options.sortBy);
      if (options.limit) params.set('limit', String(options.limit));
      if (options.offset) params.set('offset', String(options.offset));
      
      const response = await fetch(`${baseUrl}/search?${params}`);
      if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
      return response.json();
    },
    
    async getInfo(name) {
      const response = await fetch(`${baseUrl}/packs/${encodeURIComponent(name)}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Failed to get info: ${response.statusText}`);
      return response.json();
    },
    
    async getManifest(name, version) {
      const response = await fetch(
        `${baseUrl}/packs/${encodeURIComponent(name)}/${encodeURIComponent(version)}/manifest`
      );
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Failed to get manifest: ${response.statusText}`);
      return response.json();
    },
    
    async download(name, version) {
      const response = await fetch(
        `${baseUrl}/packs/${encodeURIComponent(name)}/${encodeURIComponent(version)}/download`
      );
      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
      return new Uint8Array(await response.arrayBuffer());
    },
    
    async publish(pack, token) {
      const response = await fetch(`${baseUrl}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: JSON.stringify(pack),
      });
      if (!response.ok) throw new Error(`Publish failed: ${response.statusText}`);
    },
    
    async unpublish(name, version, token) {
      const response = await fetch(
        `${baseUrl}/packs/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error(`Unpublish failed: ${response.statusText}`);
    },
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a pack from a directory.
 */
export async function createPackFromDirectory(
  directory: string,
  manifestPath: string,
  readFile: (path: string) => Promise<Uint8Array>,
  listDir: (path: string) => Promise<string[]>,
  options?: PackBuilderOptions
): Promise<CardPack> {
  const manifestData = await readFile(manifestPath);
  const manifestJson = new TextDecoder().decode(manifestData);
  const loaded = loadManifest(manifestJson, manifestPath);
  
  if (!loaded.validation.valid) {
    throw new Error(`Invalid manifest: ${loaded.validation.errors.map(e => e.message).join(', ')}`);
  }
  
  const builder = new PackBuilder(options);
  builder.setManifest(loaded.manifest);
  await builder.addDirectory(directory, readFile, listDir);
  
  return builder.build();
}

/**
 * Installs a pack from bytes.
 */
export async function installPackFromBytes(
  data: Uint8Array,
  location: InstallLocation
): Promise<InstalledPack> {
  const pack = await PackReader.read(data);
  const installer = new PackInstaller(location);
  await installer.loadIndex();
  return installer.install(pack);
}
