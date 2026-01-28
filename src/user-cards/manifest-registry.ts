/**
 * @fileoverview Manifest Registry Upload.
 * 
 * Provides registry interaction for card pack publishing:
 * - Registry authentication
 * - Package upload with progress tracking
 * - Metadata updates
 * - Download statistics
 * - Registry search and discovery
 * 
 * @module @cardplay/user-cards/manifest-registry
 */

import type { CardManifest } from './manifest';
import type { CardPack } from './pack';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Registry configuration.
 */
export interface RegistryConfig {
  /** Registry base URL */
  url: string;
  /** Authentication token */
  token?: string;
  /** Request timeout (ms) */
  timeout?: number;
  /** Retry attempts */
  retries?: number;
  /** Retry delay (ms) */
  retryDelay?: number;
}

/**
 * Upload progress.
 */
export interface UploadProgress {
  /** Bytes uploaded */
  uploaded: number;
  /** Total bytes */
  total: number;
  /** Upload speed (bytes/sec) */
  speed: number;
  /** Estimated time remaining (seconds) */
  eta: number;
  /** Percentage complete */
  percent: number;
}

/**
 * Registry response.
 */
export interface RegistryResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Package metadata from registry.
 */
export interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  publishedAt: number;
  downloads: number;
  versions: string[];
  latestVersion: string;
  deprecated?: boolean;
  deprecationMessage?: string;
}

/**
 * Search result.
 */
export interface SearchResult {
  packages: PackageMetadata[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Search options.
 */
export interface SearchOptions {
  /** Search query */
  query?: string;
  /** Filter by category */
  category?: string;
  /** Filter by author */
  author?: string;
  /** Filter by keyword */
  keywords?: string[];
  /** Sort field */
  sort?: 'relevance' | 'downloads' | 'published' | 'updated' | 'name';
  /** Sort direction */
  order?: 'asc' | 'desc';
  /** Page number */
  page?: number;
  /** Results per page */
  pageSize?: number;
}

// ============================================================================
// REGISTRY CLIENT
// ============================================================================

/**
 * Registry client for package operations.
 */
export class RegistryClient {
  private config: RegistryConfig & { timeout: number; retries: number; retryDelay: number };
  
  constructor(config: RegistryConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }
  
  /**
   * Makes an HTTP request with retries.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<RegistryResponse<T>> {
    const url = `${this.config.url}${path}`;
    
    // Add authentication if token is present
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }
    
    let requestBody: string | null = null;
    if (body && (method === 'POST' || method === 'PUT')) {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        const data = await response.json();
        
        if (!response.ok) {
          return {
            success: false,
            error: data.error || `HTTP ${response.status}`,
            message: data.message,
          };
        }
        
        return {
          success: true,
          data: data as T,
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Wait before retry
        if (attempt < this.config.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Request failed',
    };
  }
  
  /**
   * Uploads a package to the registry.
   */
  async uploadPackage(
    pack: CardPack,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<RegistryResponse<PackageMetadata>> {
    const manifest = pack.manifest;
    const encodedName = encodeURIComponent(manifest.name);
    const path = `/packages/${encodedName}`;
    
    // In a real implementation, we'd use multipart/form-data
    // and track actual upload progress
    // For now, we'll simulate the upload
    
    if (onProgress) {
      const total = pack.content.length;
      let uploaded = 0;
      const startTime = Date.now();
      
      // Simulate chunked upload
      const chunkSize = Math.max(1024 * 1024, Math.floor(total / 10)); // 1MB or 10 chunks
      
      while (uploaded < total) {
        await new Promise(resolve => setTimeout(resolve, 100));
        uploaded = Math.min(uploaded + chunkSize, total);
        
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = uploaded / elapsed;
        const remaining = total - uploaded;
        const eta = remaining / speed;
        
        onProgress({
          uploaded,
          total,
          speed,
          eta,
          percent: (uploaded / total) * 100,
        });
      }
    }
    
    // Make the actual upload request
    return this.request<PackageMetadata>('POST', path, {
      manifest,
      content: Array.from(pack.content), // Convert to array for JSON
    });
  }
  
  /**
   * Fetches package metadata.
   */
  async getPackage(name: string, version?: string): Promise<RegistryResponse<PackageMetadata>> {
    const encodedName = encodeURIComponent(name);
    const path = version 
      ? `/packages/${encodedName}/${version}`
      : `/packages/${encodedName}`;
    
    return this.request<PackageMetadata>('GET', path);
  }
  
  /**
   * Lists all versions of a package.
   */
  async getVersions(name: string): Promise<RegistryResponse<string[]>> {
    const encodedName = encodeURIComponent(name);
    const path = `/packages/${encodedName}/versions`;
    
    return this.request<string[]>('GET', path);
  }
  
  /**
   * Deprecates a package version.
   */
  async deprecateVersion(
    name: string,
    version: string,
    message: string
  ): Promise<RegistryResponse<void>> {
    const encodedName = encodeURIComponent(name);
    const path = `/packages/${encodedName}/${version}/deprecate`;
    
    return this.request('POST', path, { message });
  }
  
  /**
   * Unpublishes a package version.
   */
  async unpublish(name: string, version: string): Promise<RegistryResponse<void>> {
    const encodedName = encodeURIComponent(name);
    const path = `/packages/${encodedName}/${version}`;
    
    return this.request('DELETE', path);
  }
  
  /**
   * Updates package metadata.
   */
  async updateMetadata(
    name: string,
    metadata: Partial<CardManifest>
  ): Promise<RegistryResponse<PackageMetadata>> {
    const encodedName = encodeURIComponent(name);
    const path = `/packages/${encodedName}/metadata`;
    
    return this.request<PackageMetadata>('PATCH', path, metadata);
  }
  
  /**
   * Searches the registry.
   */
  async search(options: SearchOptions = {}): Promise<RegistryResponse<SearchResult>> {
    const params = new URLSearchParams();
    
    if (options.query) params.set('q', options.query);
    if (options.category) params.set('category', options.category);
    if (options.author) params.set('author', options.author);
    if (options.keywords) params.set('keywords', options.keywords.join(','));
    if (options.sort) params.set('sort', options.sort);
    if (options.order) params.set('order', options.order);
    if (options.page) params.set('page', String(options.page));
    if (options.pageSize) params.set('pageSize', String(options.pageSize));
    
    const path = `/packages/search?${params.toString()}`;
    
    return this.request<SearchResult>('GET', path);
  }
  
  /**
   * Gets download statistics.
   */
  async getDownloadStats(
    name: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<RegistryResponse<{ downloads: number; period: string }>> {
    const encodedName = encodeURIComponent(name);
    const path = `/packages/${encodedName}/stats?period=${period}`;
    
    return this.request<{ downloads: number; period: string }>('GET', path);
  }
  
  /**
   * Gets trending packages.
   */
  async getTrending(
    category?: string,
    limit: number = 20
  ): Promise<RegistryResponse<PackageMetadata[]>> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    params.set('limit', String(limit));
    
    const path = `/packages/trending?${params.toString()}`;
    
    return this.request<PackageMetadata[]>('GET', path);
  }
  
  /**
   * Gets featured packages.
   */
  async getFeatured(
    category?: string,
    limit: number = 20
  ): Promise<RegistryResponse<PackageMetadata[]>> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    params.set('limit', String(limit));
    
    const path = `/packages/featured?${params.toString()}`;
    
    return this.request<PackageMetadata[]>('GET', path);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a registry client with default configuration.
 */
export function createRegistryClient(
  url: string = 'https://registry.cardplay.app',
  token?: string
): RegistryClient {
  const config: RegistryConfig = { url };
  if (token) {
    config.token = token;
  }
  return new RegistryClient(config);
}

/**
 * Quick package upload.
 */
export async function uploadPackage(
  pack: CardPack,
  registryUrl?: string,
  token?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<RegistryResponse<PackageMetadata>> {
  const client = createRegistryClient(registryUrl, token);
  return client.uploadPackage(pack, onProgress);
}

/**
 * Quick package search.
 */
export async function searchPackages(
  query: string,
  options: Omit<SearchOptions, 'query'> = {}
): Promise<RegistryResponse<SearchResult>> {
  const client = createRegistryClient();
  return client.search({ ...options, query });
}
