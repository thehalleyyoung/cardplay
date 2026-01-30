/**
 * @fileoverview Extension Pack Discovery (Change 404)
 * 
 * Implements pack discovery from multiple sources:
 * - Project-local extensions (./extensions/)
 * - User extensions (~/.cardplay/extensions/)
 * - System extensions (when running as installed app)
 * 
 * Security boundaries:
 * - Project-local packs are loaded with user confirmation
 * - User packs are trusted by default
 * - System packs are trusted by default
 * 
 * @module @cardplay/extensions/discovery
 */

import type { ExtensionManifest } from './types';

// ============================================================================
// DISCOVERY PATHS
// ============================================================================

/**
 * Extension discovery locations.
 */
export interface DiscoveryPaths {
  /** Project-local extensions (requires user confirmation) */
  projectLocal?: string;
  /** User extensions directory (trusted) */
  userExtensions?: string;
  /** System extensions directory (trusted) */
  systemExtensions?: string;
}

/**
 * Default discovery paths.
 * In browser environment, these may not be accessible.
 * In Node/Electron, these resolve to actual filesystem paths.
 */
export function getDefaultDiscoveryPaths(): DiscoveryPaths {
  // Check if running in Node/Electron environment
  if (typeof process !== 'undefined' && process.env) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    
    return {
      projectLocal: './extensions',
      userExtensions: `${homeDir}/.cardplay/extensions`,
      systemExtensions: '/usr/local/share/cardplay/extensions', // Unix-like systems
    };
  }
  
  // Browser environment - no local filesystem access
  return {};
}

// ============================================================================
// DISCOVERY RESULT
// ============================================================================

/**
 * Result of extension discovery.
 */
export interface DiscoveryResult {
  /** Extension manifest */
  manifest: ExtensionManifest;
  /** Path to extension */
  path: string;
  /** Source of discovery */
  source: 'project-local' | 'user' | 'system';
  /** Whether extension requires user confirmation to load */
  requiresConfirmation: boolean;
}

// ============================================================================
// DISCOVERY IMPLEMENTATION
// ============================================================================

/**
 * Discover extensions from configured paths.
 * 
 * This is a placeholder implementation that demonstrates the API.
 * In production, this would:
 * 1. Scan directories for extension.json files
 * 2. Validate manifests
 * 3. Return discovered extensions with metadata
 * 
 * @param paths Discovery paths configuration
 * @returns List of discovered extensions
 */
export async function discoverExtensions(
  paths: DiscoveryPaths = getDefaultDiscoveryPaths()
): Promise<DiscoveryResult[]> {
  const results: DiscoveryResult[] = [];
  
  // In browser environment, return empty list
  if (typeof process === 'undefined') {
    console.info('[Extensions] Running in browser - local extension discovery disabled');
    return results;
  }
  
  // Discovery from project-local (requires confirmation)
  if (paths.projectLocal) {
    const projectExtensions = await discoverFromPath(
      paths.projectLocal,
      'project-local',
      true
    );
    results.push(...projectExtensions);
  }
  
  // Discovery from user directory (trusted)
  if (paths.userExtensions) {
    const userExtensions = await discoverFromPath(
      paths.userExtensions,
      'user',
      false
    );
    results.push(...userExtensions);
  }
  
  // Discovery from system directory (trusted)
  if (paths.systemExtensions) {
    const systemExtensions = await discoverFromPath(
      paths.systemExtensions,
      'system',
      false
    );
    results.push(...systemExtensions);
  }
  
  return results;
}

/**
 * Discover extensions from a single directory path.
 * 
 * Placeholder implementation - in production would use fs.readdir and
 * scan for extension.json files.
 */
async function discoverFromPath(
  _path: string,
  source: 'project-local' | 'user' | 'system',
  requiresConfirmation: boolean
): Promise<DiscoveryResult[]> {
  // Placeholder: In production, implement directory scanning
  // Example implementation:
  // const fs = await import('fs/promises');
  // const entries = await fs.readdir(path, { withFileTypes: true });
  // const results: DiscoveryResult[] = [];
  // 
  // for (const entry of entries) {
  //   if (entry.isDirectory()) {
  //     const manifestPath = `${path}/${entry.name}/extension.json`;
  //     try {
  //       const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  //       const manifest = JSON.parse(manifestContent) as ExtensionManifest;
  //       results.push({
  //         manifest,
  //         path: `${path}/${entry.name}`,
  //         source,
  //         requiresConfirmation,
  //       });
  //     } catch (error) {
  //       console.warn(`Failed to load extension from ${manifestPath}:`, error);
  //     }
  //   }
  // }
  // 
  // return results;
  
  console.info(`[Extensions] Would scan ${_path} for extensions (source: ${source})`);
  return [];
}

// ============================================================================
// DISCOVERY FILTER
// ============================================================================

/**
 * Filter discovery results based on criteria.
 */
export interface DiscoveryFilter {
  /** Only include extensions with specific capabilities */
  capabilities?: string[];
  /** Only include extensions from specific sources */
  sources?: Array<'project-local' | 'user' | 'system'>;
  /** Exclude extensions requiring confirmation */
  excludeUnconfirmed?: boolean;
}

/**
 * Filter discovered extensions.
 */
export function filterDiscoveryResults(
  results: DiscoveryResult[],
  filter: DiscoveryFilter
): DiscoveryResult[] {
  return results.filter(result => {
    // Filter by source
    if (filter.sources && !filter.sources.includes(result.source)) {
      return false;
    }
    
    // Filter by confirmation requirement
    if (filter.excludeUnconfirmed && result.requiresConfirmation) {
      return false;
    }
    
    // Filter by capabilities
    if (filter.capabilities) {
      const manifestCapabilities = result.manifest.permissions || [];
      const hasAllCapabilities = filter.capabilities.every(cap =>
        manifestCapabilities.includes(cap as any)
      );
      if (!hasAllCapabilities) {
        return false;
      }
    }
    
    return true;
  });
}

// ============================================================================
// DISCOVERY CACHE
// ============================================================================

/**
 * Cache for discovered extensions to avoid repeated filesystem scans.
 */
class DiscoveryCache {
  private cache = new Map<string, { results: DiscoveryResult[]; timestamp: number }>();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes
  
  get(paths: DiscoveryPaths): DiscoveryResult[] | null {
    const key = JSON.stringify(paths);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is stale
    if (Date.now() - cached.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.results;
  }
  
  set(paths: DiscoveryPaths, results: DiscoveryResult[]): void {
    const key = JSON.stringify(paths);
    this.cache.set(key, {
      results,
      timestamp: Date.now(),
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Singleton discovery cache.
 */
const discoveryCache = new DiscoveryCache();

/**
 * Discover extensions with caching.
 */
export async function discoverExtensionsCached(
  paths: DiscoveryPaths = getDefaultDiscoveryPaths(),
  useCache = true
): Promise<DiscoveryResult[]> {
  if (useCache) {
    const cached = discoveryCache.get(paths);
    if (cached) {
      return cached;
    }
  }
  
  const results = await discoverExtensions(paths);
  discoveryCache.set(paths, results);
  
  return results;
}

/**
 * Clear discovery cache.
 */
export function clearDiscoveryCache(): void {
  discoveryCache.clear();
}
