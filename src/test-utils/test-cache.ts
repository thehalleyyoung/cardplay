/**
 * Test Result Caching for Cardplay
 * 
 * Caches test results to skip unchanged tests in subsequent runs.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export type TestResult = {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  skipped?: boolean;
};

export type TestFileResult = {
  file: string;
  fileHash: string;
  timestamp: number;
  results: TestResult[];
  totalDuration: number;
};

export type TestCache = {
  version: string;
  tests: Map<string, TestFileResult>;
};

const CACHE_VERSION = '1.0.0';
const CACHE_DIR = '.test-cache';
const CACHE_FILE = 'test-results.json';

/**
 * Loads the test cache from disk.
 */
export function loadTestCache(projectRoot: string): TestCache {
  const cachePath = join(projectRoot, CACHE_DIR, CACHE_FILE);
  
  if (!existsSync(cachePath)) {
    return { version: CACHE_VERSION, tests: new Map() };
  }
  
  try {
    const data = JSON.parse(readFileSync(cachePath, 'utf-8'));
    
    if (data.version !== CACHE_VERSION) {
      console.warn('Test cache version mismatch, clearing cache');
      return { version: CACHE_VERSION, tests: new Map() };
    }
    
    const tests = new Map<string, TestFileResult>(Object.entries(data.tests));
    
    return { version: data.version, tests };
  } catch (error) {
    console.warn('Failed to load test cache:', error);
    return { version: CACHE_VERSION, tests: new Map() };
  }
}

/**
 * Saves the test cache to disk.
 */
export function saveTestCache(projectRoot: string, cache: TestCache): void {
  const cacheDir = join(projectRoot, CACHE_DIR);
  const cachePath = join(cacheDir, CACHE_FILE);
  
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  
  try {
    const data = {
      version: cache.version,
      tests: Object.fromEntries(cache.tests)
    };
    
    writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save test cache:', error);
  }
}

/**
 * Computes a hash of a file's content.
 */
export function hashFile(filePath: string): string {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Checks if a test file has changed since last run.
 */
export function hasFileChanged(filePath: string, cache: TestCache): boolean {
  const cached = cache.tests.get(filePath);
  
  if (!cached) {
    return true;
  }
  
  const currentHash = hashFile(filePath);
  
  return currentHash !== cached.fileHash;
}

/**
 * Gets cached results for a test file if unchanged.
 */
export function getCachedResults(filePath: string, cache: TestCache): TestFileResult | null {
  if (hasFileChanged(filePath, cache)) {
    return null;
  }
  
  return cache.tests.get(filePath) || null;
}

/**
 * Updates cache with new test results.
 */
export function updateCache(
  filePath: string,
  results: TestResult[],
  cache: TestCache
): void {
  const fileHash = hashFile(filePath);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  cache.tests.set(filePath, {
    file: filePath,
    fileHash,
    timestamp: Date.now(),
    results,
    totalDuration
  });
}

/**
 * Clears stale cache entries (files that no longer exist).
 */
export function clearStaleCache(projectRoot: string, cache: TestCache): void {
  const toRemove: string[] = [];
  
  for (const [filePath] of cache.tests) {
    const fullPath = join(projectRoot, filePath);
    if (!existsSync(fullPath)) {
      toRemove.push(filePath);
    }
  }
  
  toRemove.forEach(path => cache.tests.delete(path));
  
  if (toRemove.length > 0) {
    console.log(`Removed ${toRemove.length} stale cache entries`);
  }
}

/**
 * Gets cache statistics.
 */
export function getCacheStats(cache: TestCache): {
  totalFiles: number;
  totalTests: number;
  totalDuration: number;
  oldestEntry: number;
  newestEntry: number;
} {
  let totalTests = 0;
  let totalDuration = 0;
  let oldestEntry = Infinity;
  let newestEntry = 0;
  
  for (const result of cache.tests.values()) {
    totalTests += result.results.length;
    totalDuration += result.totalDuration;
    oldestEntry = Math.min(oldestEntry, result.timestamp);
    newestEntry = Math.max(newestEntry, result.timestamp);
  }
  
  return {
    totalFiles: cache.tests.size,
    totalTests,
    totalDuration,
    oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
    newestEntry
  };
}

/**
 * Generates a cache report.
 */
export function generateCacheReport(cache: TestCache): string {
  const stats = getCacheStats(cache);
  const lines: string[] = [];
  
  lines.push('==========================================');
  lines.push('  Test Cache Report');
  lines.push('==========================================');
  lines.push('');
  lines.push(`Cached Files:  ${stats.totalFiles}`);
  lines.push(`Cached Tests:  ${stats.totalTests}`);
  lines.push(`Total Duration: ${stats.totalDuration.toFixed(0)}ms`);
  
  if (stats.oldestEntry > 0) {
    const oldestAge = Date.now() - stats.oldestEntry;
    const newestAge = Date.now() - stats.newestEntry;
    lines.push(`Oldest Entry:  ${formatAge(oldestAge)} ago`);
    lines.push(`Newest Entry:  ${formatAge(newestAge)} ago`);
  }
  
  lines.push('');
  lines.push('==========================================');
  
  return lines.join('\n');
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Determines which test files need to run based on cache.
 */
export function getTestsToRun(
  allTestFiles: string[],
  cache: TestCache,
  force = false
): { toRun: string[]; cached: string[] } {
  if (force) {
    return { toRun: allTestFiles, cached: [] };
  }
  
  const toRun: string[] = [];
  const cached: string[] = [];
  
  for (const file of allTestFiles) {
    if (hasFileChanged(file, cache)) {
      toRun.push(file);
    } else {
      cached.push(file);
    }
  }
  
  return { toRun, cached };
}
