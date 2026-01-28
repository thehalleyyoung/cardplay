/**
 * Deprecation Warning System for Cardplay
 * 
 * Tracks deprecated APIs and generates migration warnings.
 */

export type DeprecationLevel = 'warning' | 'error' | 'removed';

export type DeprecationInfo = {
  api: string;
  version: string;
  level: DeprecationLevel;
  replacement?: string;
  reason?: string;
  removalVersion?: string;
  migration?: string;
  issueUrl?: string;
};

export type DeprecationRegistry = Map<string, DeprecationInfo>;

const DEPRECATIONS: DeprecationRegistry = new Map();
const WARNED: Set<string> = new Set();

/**
 * Registers a deprecated API.
 */
export function registerDeprecation(info: DeprecationInfo): void {
  DEPRECATIONS.set(info.api, info);
}

/**
 * Emits a deprecation warning (once per API per session).
 */
export function deprecate(api: string, customMessage?: string): void {
  if (WARNED.has(api)) return;
  
  const info = DEPRECATIONS.get(api);
  if (!info) {
    console.warn(`⚠️  API "${api}" is deprecated (no details available)`);
    WARNED.add(api);
    return;
  }
  
  const message = customMessage || generateDeprecationMessage(info);
  
  if (info.level === 'error') {
    console.error(`❌ ${message}`);
  } else if (info.level === 'removed') {
    throw new Error(`API "${api}" has been removed in version ${info.removalVersion || info.version}`);
  } else {
    console.warn(`⚠️  ${message}`);
  }
  
  WARNED.add(api);
}

/**
 * Generates a formatted deprecation message.
 */
function generateDeprecationMessage(info: DeprecationInfo): string {
  const lines: string[] = [];
  
  lines.push(`"${info.api}" is deprecated since v${info.version}`);
  
  if (info.reason) {
    lines.push(`Reason: ${info.reason}`);
  }
  
  if (info.replacement) {
    lines.push(`Use "${info.replacement}" instead`);
  }
  
  if (info.removalVersion) {
    lines.push(`Will be removed in v${info.removalVersion}`);
  }
  
  if (info.migration) {
    lines.push(`Migration: ${info.migration}`);
  }
  
  if (info.issueUrl) {
    lines.push(`Details: ${info.issueUrl}`);
  }
  
  return lines.join('\n  ');
}

/**
 * Gets all registered deprecations.
 */
export function getAllDeprecations(): DeprecationInfo[] {
  return Array.from(DEPRECATIONS.values());
}

/**
 * Gets deprecations for a specific level.
 */
export function getDeprecationsByLevel(level: DeprecationLevel): DeprecationInfo[] {
  return Array.from(DEPRECATIONS.values()).filter(d => d.level === level);
}

/**
 * Clears warning history (for testing).
 */
export function clearWarningHistory(): void {
  WARNED.clear();
}

/**
 * Generates a deprecation report.
 */
export function generateDeprecationReport(): string {
  const all = getAllDeprecations();
  
  if (all.length === 0) {
    return 'No deprecations registered.';
  }
  
  const lines: string[] = [];
  
  lines.push('==========================================');
  lines.push('  Cardplay Deprecation Report');
  lines.push('==========================================');
  lines.push('');
  
  const byLevel: Record<DeprecationLevel, DeprecationInfo[]> = {
    warning: [],
    error: [],
    removed: []
  };
  
  all.forEach(d => byLevel[d.level].push(d));
  
  if (byLevel.removed.length > 0) {
    lines.push('REMOVED APIs:');
    byLevel.removed.forEach(d => {
      lines.push(`  ❌ ${d.api} (removed in v${d.removalVersion || d.version})`);
      if (d.replacement) lines.push(`     → Use: ${d.replacement}`);
    });
    lines.push('');
  }
  
  if (byLevel.error.length > 0) {
    lines.push('DEPRECATED (Error Level):');
    byLevel.error.forEach(d => {
      lines.push(`  ⚠️  ${d.api} (since v${d.version})`);
      if (d.replacement) lines.push(`     → Use: ${d.replacement}`);
      if (d.removalVersion) lines.push(`     → Will be removed in v${d.removalVersion}`);
    });
    lines.push('');
  }
  
  if (byLevel.warning.length > 0) {
    lines.push('DEPRECATED (Warning Level):');
    byLevel.warning.forEach(d => {
      lines.push(`  ⚠️  ${d.api} (since v${d.version})`);
      if (d.replacement) lines.push(`     → Use: ${d.replacement}`);
      if (d.removalVersion) lines.push(`     → Will be removed in v${d.removalVersion}`);
    });
    lines.push('');
  }
  
  lines.push('==========================================');
  
  return lines.join('\n');
}

/**
 * Checks if code uses deprecated APIs (for CI).
 */
export function checkForDeprecatedUsage(code: string): { api: string; info: DeprecationInfo }[] {
  const found: { api: string; info: DeprecationInfo }[] = [];
  
  for (const [api, info] of DEPRECATIONS) {
    const pattern = new RegExp(`\\b${api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (pattern.test(code)) {
      found.push({ api, info });
    }
  }
  
  return found;
}
