/**
 * @fileoverview Manifest Changelog Generator.
 * 
 * Provides automatic changelog generation from version history:
 * - Git commit analysis
 * - Conventional commits parsing
 * - Categorized change lists
 * - Markdown formatting
 * - Changelog file management
 * 
 * @module @cardplay/user-cards/manifest-changelog
 */

import type { CardManifest } from './manifest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Change type based on conventional commits.
 */
export type ChangeType =
  | 'feat'      // New features
  | 'fix'       // Bug fixes
  | 'docs'      // Documentation changes
  | 'style'     // Code style changes
  | 'refactor'  // Code refactoring
  | 'perf'      // Performance improvements
  | 'test'      // Test additions/changes
  | 'chore'     // Build/tooling changes
  | 'breaking'; // Breaking changes

/**
 * Single changelog entry.
 */
export interface ChangeEntry {
  /** Change type */
  type: ChangeType;
  /** Scope (optional, e.g., "cards", "ui") */
  scope?: string;
  /** Description */
  description: string;
  /** Is breaking change */
  breaking: boolean;
  /** Issue/PR references */
  refs?: string[];
  /** Commit hash */
  hash?: string;
  /** Author */
  author?: string;
  /** Timestamp */
  timestamp?: number;
}

/**
 * Changelog for a version.
 */
export interface VersionChangelog {
  /** Version number */
  version: string;
  /** Release date */
  date: number;
  /** Changes grouped by type */
  changes: Record<ChangeType, ChangeEntry[]>;
  /** All changes (ungrouped) */
  allChanges: ChangeEntry[];
  /** Breaking changes (if any) */
  breakingChanges: ChangeEntry[];
}

/**
 * Full changelog.
 */
export interface Changelog {
  /** Package name */
  package: string;
  /** All versions */
  versions: VersionChangelog[];
}

/**
 * Changelog generation options.
 */
export interface ChangelogOptions {
  /** Include all commits or only conventional ones */
  includeAll?: boolean;
  /** Group by type */
  groupByType?: boolean;
  /** Include commit hashes */
  includeHashes?: boolean;
  /** Include authors */
  includeAuthors?: boolean;
  /** Include dates */
  includeDates?: boolean;
  /** Max commits per version */
  maxCommits?: number;
  /** Markdown output */
  markdown?: boolean;
}

// ============================================================================
// COMMIT PARSING
// ============================================================================

/**
 * Parses a conventional commit message.
 * Format: <type>(<scope>): <description>
 * Example: "feat(cards): add new synth card"
 */
function parseCommit(message: string): ChangeEntry | null {
  // Match conventional commit format
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!?):\s*(.+)$/);
  
  if (!match) {
    // Not a conventional commit, return as generic change
    return {
      type: 'chore',
      description: message.split('\n')[0] || '',
      breaking: false,
    };
  }
  
  const [, rawType, scope, breakingMarker, description] = match;
  
  // Map type to ChangeType
  const type = rawType as ChangeType;
  const descriptionText = description?.trim() || '';
  const breaking = breakingMarker === '!' || descriptionText.toLowerCase().includes('breaking');
  
  // Extract issue references
  const refs = (message.match(/#\d+/g) || []).map(ref => ref.substring(1));
  
  return {
    type: breaking ? 'breaking' : type,
    ...(scope ? { scope } : {}),
    description: descriptionText,
    breaking,
    ...(refs.length > 0 ? { refs } : {}),
  };
}

// ============================================================================
// CHANGELOG GENERATOR
// ============================================================================

/**
 * Generates changelog from commit messages.
 */
export class ChangelogGenerator {
  private options: Required<ChangelogOptions>;
  
  constructor(options: ChangelogOptions = {}) {
    this.options = {
      includeAll: false,
      groupByType: true,
      includeHashes: true,
      includeAuthors: true,
      includeDates: true,
      maxCommits: 100,
      markdown: true,
      ...options,
    };
  }
  
  /**
   * Generates changelog for a version from commits.
   */
  generateVersionChangelog(
    version: string,
    commits: string[],
    date: number = Date.now()
  ): VersionChangelog {
    const allChanges: ChangeEntry[] = [];
    const changes: Record<ChangeType, ChangeEntry[]> = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      chore: [],
      breaking: [],
    };
    
    // Parse all commits
    for (const commit of commits.slice(0, this.options.maxCommits)) {
      const entry = parseCommit(commit);
      
      if (entry) {
        // Skip non-conventional commits unless includeAll is true
        if (!this.options.includeAll && entry.type === 'chore' && !commit.match(/^(\w+)\(/)) {
          continue;
        }
        
        allChanges.push(entry);
        changes[entry.type].push(entry);
        
        // Add to breaking changes if applicable
        if (entry.breaking) {
          changes.breaking.push(entry);
        }
      }
    }
    
    return {
      version,
      date,
      changes,
      allChanges,
      breakingChanges: changes.breaking,
    };
  }
  
  /**
   * Generates full changelog from multiple versions.
   */
  generateChangelog(versions: Array<{ version: string; commits: string[]; date: number }>): Changelog {
    const versionChangelogs = versions.map(v => 
      this.generateVersionChangelog(v.version, v.commits, v.date)
    );
    
    return {
      package: '',
      versions: versionChangelogs,
    };
  }
  
  /**
   * Formats changelog as Markdown.
   */
  formatMarkdown(changelog: VersionChangelog): string {
    const lines: string[] = [];
    
    // Version header
    lines.push(`## [${changelog.version}]${this.options.includeDates ? ` - ${new Date(changelog.date).toISOString().split('T')[0]}` : ''}`);
    lines.push('');
    
    // Breaking changes first (if any)
    if (changelog.breakingChanges.length > 0) {
      lines.push('### ⚠ BREAKING CHANGES');
      lines.push('');
      for (const change of changelog.breakingChanges) {
        lines.push(this.formatEntry(change));
      }
      lines.push('');
    }
    
    // Group by type
    if (this.options.groupByType) {
      const typeLabels: Record<ChangeType, string> = {
        feat: '### ✨ Features',
        fix: '### 🐛 Bug Fixes',
        docs: '### 📝 Documentation',
        perf: '### ⚡ Performance',
        refactor: '### ♻️ Refactoring',
        style: '### 💄 Styling',
        test: '### ✅ Tests',
        chore: '### 🔧 Chores',
        breaking: '### ⚠ Breaking Changes',
      };
      
      for (const type of Object.keys(typeLabels) as ChangeType[]) {
        const entries = changelog.changes[type];
        
        // Skip breaking changes (already shown) and empty sections
        if (type === 'breaking' || entries.length === 0) {
          continue;
        }
        
        lines.push(typeLabels[type]);
        lines.push('');
        
        for (const entry of entries) {
          lines.push(this.formatEntry(entry));
        }
        
        lines.push('');
      }
    } else {
      // Show all changes chronologically
      lines.push('### Changes');
      lines.push('');
      for (const change of changelog.allChanges) {
        lines.push(this.formatEntry(change));
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Formats a single change entry.
   */
  private formatEntry(entry: ChangeEntry): string {
    const parts: string[] = [];
    
    // Bullet point
    parts.push('*');
    
    // Scope
    if (entry.scope) {
      parts.push(`**${entry.scope}:**`);
    }
    
    // Description
    parts.push(entry.description);
    
    // Issue references
    if (entry.refs && entry.refs.length > 0) {
      parts.push(`(${entry.refs.map(ref => `#${ref}`).join(', ')})`);
    }
    
    // Commit hash
    if (this.options.includeHashes && entry.hash) {
      parts.push(`[\`${entry.hash.substring(0, 7)}\`]`);
    }
    
    // Author
    if (this.options.includeAuthors && entry.author) {
      parts.push(`by @${entry.author}`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Generates complete changelog file content.
   */
  generateChangelogFile(changelog: Changelog, packageName: string): string {
    const lines: string[] = [];
    
    // Title
    lines.push(`# Changelog`);
    lines.push('');
    lines.push(`All notable changes to \`${packageName}\` will be documented in this file.`);
    lines.push('');
    lines.push('The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),');
    lines.push('and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).');
    lines.push('');
    
    // Versions (newest first)
    for (const version of changelog.versions) {
      lines.push(this.formatMarkdown(version));
    }
    
    return lines.join('\n');
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Generates changelog from manifest and commit history.
 */
export function generateChangelog(
  manifest: CardManifest,
  commits: string[],
  options?: ChangelogOptions
): string {
  const generator = new ChangelogGenerator(options);
  
  const versionChangelog = generator.generateVersionChangelog(
    manifest.version,
    commits,
    Date.now()
  );
  
  return generator.formatMarkdown(versionChangelog);
}

/**
 * Appends new version to existing changelog file.
 */
export function appendToChangelog(
  existingChangelog: string,
  newVersion: VersionChangelog,
  options?: ChangelogOptions
): string {
  const generator = new ChangelogGenerator(options);
  const newEntry = generator.formatMarkdown(newVersion);
  
  // Find where to insert (after header, before first version)
  const lines = existingChangelog.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## ['));
  
  if (insertIndex === -1) {
    // No existing versions, append to end
    return existingChangelog + '\n\n' + newEntry;
  }
  
  // Insert before first version
  lines.splice(insertIndex, 0, newEntry, '');
  return lines.join('\n');
}

/**
 * Extracts version history from changelog file.
 */
export function parseChangelog(content: string): Changelog {
  const versions: VersionChangelog[] = [];
  const lines = content.split('\n');
  
  let currentVersion: VersionChangelog | null = null;
  let currentType: ChangeType | null = null;
  
  for (const line of lines) {
    // Version header: ## [1.0.0] - 2024-01-01
    const versionMatch = line.match(/^## \[(.+?)\](?:\s*-\s*(.+))?$/);
    if (versionMatch) {
      if (currentVersion) {
        versions.push(currentVersion);
      }
      
      const version = versionMatch[1] || '';
      const dateStr = versionMatch[2];
      const date = dateStr ? new Date(dateStr).getTime() : Date.now();
      
      currentVersion = {
        version,
        date,
        changes: {
          feat: [],
          fix: [],
          docs: [],
          style: [],
          refactor: [],
          perf: [],
          test: [],
          chore: [],
          breaking: [],
        },
        allChanges: [],
        breakingChanges: [],
      };
      
      currentType = null;
      continue;
    }
    
    // Type header: ### ✨ Features
    const typeMatch = line.match(/^### [^a-zA-Z]*([A-Z][a-z]+)/);
    if (typeMatch && typeMatch[1] && currentVersion) {
      const typeStr = typeMatch[1].toLowerCase();
      currentType = typeStr as ChangeType;
      continue;
    }
    
    // Change entry: * description
    if (line.startsWith('*') && currentVersion && currentType) {
      const description = line.substring(1).trim();
      if (description) {
        const entry: ChangeEntry = {
          type: currentType,
          description,
          breaking: currentType === 'breaking',
        };
        
        currentVersion.changes[currentType].push(entry);
          currentVersion.allChanges.push(entry);
        
        if (entry.breaking) {
          currentVersion.breakingChanges.push(entry);
        }
      }
    }
  }
  
  // Add last version
  if (currentVersion) {
    versions.push(currentVersion);
  }
  
  return {
    package: '',
    versions,
  };
}
