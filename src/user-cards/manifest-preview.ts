/**
 * @fileoverview Manifest Preview Generator.
 * 
 * Generates human-readable previews of CardManifest files including:
 * - Markdown documentation
 * - HTML card view
 * - Plain text summary
 * - JSON schema visualization
 * 
 * @module @cardplay/user-cards/manifest-preview
 */

import type { CardManifest, AuthorInfo } from './manifest.js';

// ============================================================================
// PREVIEW OPTIONS
// ============================================================================

/**
 * Preview format.
 */
export type PreviewFormat = 'markdown' | 'html' | 'text' | 'json';

/**
 * Preview options.
 */
export interface PreviewOptions {
  /** Output format */
  format?: PreviewFormat;
  /** Include full details */
  verbose?: boolean;
  /** Include metadata section */
  includeMetadata?: boolean;
  /** Include dependencies section */
  includeDependencies?: boolean;
  /** Include cards list */
  includeCards?: boolean;
  /** Include platform info */
  includePlatform?: boolean;
  /** Include assets */
  includeAssets?: boolean;
  /** Maximum description length */
  maxDescriptionLength?: number;
  /** Base URL for relative links */
  baseUrl?: string;
}

/**
 * Preview result.
 */
export interface PreviewResult {
  format: PreviewFormat;
  content: string;
  metadata: {
    name: string;
    version: string;
    description?: string;
  };
}

// ============================================================================
// PREVIEW GENERATORS
// ============================================================================

/**
 * Generates a preview of the manifest.
 */
export function generatePreview(
  manifest: CardManifest,
  options: PreviewOptions = {}
): PreviewResult {
  const {
    format = 'markdown',
    verbose = false,
    includeMetadata = true,
    includeDependencies = true,
    includeCards = true,
    includePlatform = true,
    includeAssets = true,
    maxDescriptionLength = 500,
    baseUrl = '',
  } = options;

  let content: string;

  switch (format) {
    case 'markdown':
      content = generateMarkdownPreview(manifest, {
        verbose,
        includeMetadata,
        includeDependencies,
        includeCards,
        includePlatform,
        includeAssets,
        maxDescriptionLength,
        baseUrl,
      });
      break;
    case 'html':
      content = generateHTMLPreview(manifest, {
        verbose,
        includeMetadata,
        includeDependencies,
        includeCards,
        includePlatform,
        includeAssets,
        maxDescriptionLength,
        baseUrl,
      });
      break;
    case 'text':
      content = generateTextPreview(manifest, {
        verbose,
        includeMetadata,
        includeDependencies,
        includeCards,
        includePlatform,
        includeAssets,
        maxDescriptionLength,
      });
      break;
    case 'json':
      content = JSON.stringify(manifest, null, 2);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  return {
    format,
    content,
    metadata: {
      name: manifest.name,
      version: manifest.version,
      ...(manifest.description ? { description: manifest.description } : {}),
    },
  };
}

// ============================================================================
// MARKDOWN GENERATOR
// ============================================================================

function generateMarkdownPreview(
  manifest: CardManifest,
  options: Omit<PreviewOptions, 'format'>
): string {
  const lines: string[] = [];
  const { verbose, baseUrl = '' } = options;

  // Header
  lines.push(`# ${manifest.displayName || manifest.name}`);
  lines.push('');

  if (manifest.description) {
    lines.push(truncateText(manifest.description, options.maxDescriptionLength));
    lines.push('');
  }

  // Badges
  const badges: string[] = [];
  badges.push(`![Version](https://img.shields.io/badge/version-${encodeURIComponent(manifest.version)}-blue)`);
  
  if (manifest.license) {
    const license = typeof manifest.license === 'string' ? manifest.license : manifest.license.type;
    badges.push(`![License](https://img.shields.io/badge/license-${encodeURIComponent(license)}-green)`);
  }

  if (manifest.cards && manifest.cards.length > 0) {
    badges.push(`![Cards](https://img.shields.io/badge/cards-${manifest.cards.length}-orange)`);
  }

  lines.push(badges.join(' '));
  lines.push('');

  // Metadata
  if (options.includeMetadata) {
    lines.push('## 📋 Metadata');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|-------|-------|');
    lines.push(`| Name | \`${manifest.name}\` |`);
    lines.push(`| Version | ${manifest.version} |`);
    
    if (manifest.category) {
      lines.push(`| Category | ${manifest.category} |`);
    }

    if (manifest.author) {
      const author = formatAuthor(manifest.author);
      lines.push(`| Author | ${author} |`);
    }

    if (manifest.license) {
      const license = formatLicense(manifest.license);
      lines.push(`| License | ${license} |`);
    }

    if (manifest.homepage) {
      lines.push(`| Homepage | [Link](${manifest.homepage}) |`);
    }

    if (manifest.repository) {
      const repo = typeof manifest.repository === 'string' 
        ? manifest.repository 
        : manifest.repository.url;
      lines.push(`| Repository | [Link](${repo}) |`);
    }

    lines.push('');
  }

  // Keywords
  if (manifest.keywords && manifest.keywords.length > 0) {
    lines.push('**Keywords:** ' + manifest.keywords.map(k => `\`${k}\``).join(', '));
    lines.push('');
  }

  // Cards
  if (options.includeCards && manifest.cards && manifest.cards.length > 0) {
    lines.push('## 🎴 Cards');
    lines.push('');
    
    if (verbose) {
      for (const card of manifest.cards) {
        lines.push(`### ${card.id}`);
        lines.push('');
        lines.push(`- **File:** \`${card.file}\``);
        if (card.export) {
          lines.push(`- **Export:** \`${card.export}\``);
        }
        if (card.category) {
          lines.push(`- **Category:** ${card.category}`);
        }
        if (card.deprecated) {
          const reason = typeof card.deprecated === 'string' ? card.deprecated : 'This card is deprecated';
          lines.push(`- **⚠️ Deprecated:** ${reason}`);
        }
        lines.push('');
      }
    } else {
      lines.push('| ID | File | Category |');
      lines.push('|----|------|----------|');
      for (const card of manifest.cards) {
        const category = card.category || '-';
        const deprecated = card.deprecated ? ' ⚠️' : '';
        lines.push(`| \`${card.id}\`${deprecated} | ${card.file} | ${category} |`);
      }
      lines.push('');
    }
  }

  // Dependencies
  if (options.includeDependencies) {
    const hasDeps = manifest.dependencies && Object.keys(manifest.dependencies).length > 0;
    const hasDevDeps = manifest.devDependencies && Object.keys(manifest.devDependencies).length > 0;
    const hasPeerDeps = manifest.peerDependencies && Object.keys(manifest.peerDependencies).length > 0;

    if (hasDeps || hasDevDeps || hasPeerDeps) {
      lines.push('## 📦 Dependencies');
      lines.push('');

      if (hasDeps) {
        lines.push('### Runtime Dependencies');
        lines.push('');
        for (const [name, version] of Object.entries(manifest.dependencies!)) {
          const versionStr = typeof version === 'string' ? version : formatConstraint(version);
          lines.push(`- \`${name}\`: ${versionStr}`);
        }
        lines.push('');
      }

      if (hasPeerDeps) {
        lines.push('### Peer Dependencies');
        lines.push('');
        for (const [name, version] of Object.entries(manifest.peerDependencies!)) {
          const versionStr = typeof version === 'string' ? version : formatConstraint(version);
          lines.push(`- \`${name}\`: ${versionStr}`);
        }
        lines.push('');
      }

      if (verbose && hasDevDeps) {
        lines.push('### Development Dependencies');
        lines.push('');
        for (const [name, version] of Object.entries(manifest.devDependencies!)) {
          const versionStr = typeof version === 'string' ? version : formatConstraint(version);
          lines.push(`- \`${name}\`: ${versionStr}`);
        }
        lines.push('');
      }
    }
  }

  // Platform
  if (options.includePlatform && manifest.platform) {
    lines.push('## 💻 Platform Requirements');
    lines.push('');
    
    const platform = manifest.platform;
    
    if (platform.os && platform.os.length > 0) {
      lines.push(`**Operating Systems:** ${platform.os.join(', ')}`);
      lines.push('');
    }

    if (platform.cardplayVersion) {
      const version = typeof platform.cardplayVersion === 'string'
        ? platform.cardplayVersion
        : formatConstraint(platform.cardplayVersion);
      lines.push(`**Cardplay Version:** ${version}`);
      lines.push('');
    }

    if (platform.browserFeatures && platform.browserFeatures.length > 0) {
      lines.push('**Required Browser Features:**');
      lines.push('');
      for (const feature of platform.browserFeatures) {
        lines.push(`- ${feature}`);
      }
      lines.push('');
    }

    if (platform.audioFeatures && platform.audioFeatures.length > 0) {
      lines.push('**Required Audio Features:**');
      lines.push('');
      for (const feature of platform.audioFeatures) {
        lines.push(`- ${feature}`);
      }
      lines.push('');
    }
  }

  // Assets
  if (options.includeAssets) {
    const hasIcons = manifest.icons && manifest.icons.length > 0;
    const hasMedia = manifest.media && manifest.media.length > 0;
    const hasSamples = manifest.samples && manifest.samples.length > 0;

    if (hasIcons || hasMedia || hasSamples) {
      lines.push('## 🖼️ Assets');
      lines.push('');

      if (hasIcons) {
        lines.push('### Icons');
        lines.push('');
        for (const icon of manifest.icons!) {
          const theme = icon.theme ? ` (${icon.theme})` : '';
          const url = baseUrl ? `${baseUrl}/${icon.path}` : icon.path;
          lines.push(`- [${icon.size}${theme}](${url})`);
        }
        lines.push('');
      }

      if (hasMedia && verbose) {
        lines.push('### Media');
        lines.push('');
        for (const media of manifest.media!) {
          const caption = media.caption ? `: ${media.caption}` : '';
          const url = baseUrl ? `${baseUrl}/${media.path}` : media.path;
          lines.push(`- [${media.type}${caption}](${url})`);
        }
        lines.push('');
      }

      if (hasSamples && verbose) {
        lines.push(`### Samples (${manifest.samples!.length} files)`);
        lines.push('');
      }
    }
  }

  // Footer
  if (manifest.bugs) {
    lines.push(`🐛 [Report Issues](${manifest.bugs})`);
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// HTML GENERATOR
// ============================================================================

function generateHTMLPreview(
  manifest: CardManifest,
  options: Omit<PreviewOptions, 'format'>
): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>${escapeHtml(manifest.displayName || manifest.name)}</title>`);
  lines.push('  <style>');
  lines.push(getPreviewCSS());
  lines.push('  </style>');
  lines.push('</head>');
  lines.push('<body>');
  lines.push('  <div class="container">');

  // Header
  lines.push('    <header>');
  lines.push(`      <h1>${escapeHtml(manifest.displayName || manifest.name)}</h1>`);
  lines.push(`      <p class="version">v${escapeHtml(manifest.version)}</p>`);
  if (manifest.description) {
    lines.push(`      <p class="description">${escapeHtml(truncateText(manifest.description, options.maxDescriptionLength))}</p>`);
  }
  lines.push('    </header>');

  // Metadata
  if (options.includeMetadata) {
    lines.push('    <section class="metadata">');
    lines.push('      <h2>📋 Metadata</h2>');
    lines.push('      <dl>');
    lines.push(`        <dt>Name</dt><dd><code>${escapeHtml(manifest.name)}</code></dd>`);
    
    if (manifest.category) {
      lines.push(`        <dt>Category</dt><dd>${escapeHtml(manifest.category)}</dd>`);
    }

    if (manifest.author) {
      const author = formatAuthor(manifest.author);
      lines.push(`        <dt>Author</dt><dd>${escapeHtml(author)}</dd>`);
    }

    if (manifest.license) {
      const license = formatLicense(manifest.license);
      lines.push(`        <dt>License</dt><dd>${escapeHtml(license)}</dd>`);
    }

    if (manifest.homepage) {
      lines.push(`        <dt>Homepage</dt><dd><a href="${escapeHtml(manifest.homepage)}" target="_blank">Visit</a></dd>`);
    }

    lines.push('      </dl>');
    lines.push('    </section>');
  }

  // Keywords
  if (manifest.keywords && manifest.keywords.length > 0) {
    lines.push('    <section class="keywords">');
    lines.push('      <strong>Keywords:</strong> ');
    lines.push(manifest.keywords.map(k => `<span class="keyword">${escapeHtml(k)}</span>`).join(' '));
    lines.push('    </section>');
  }

  // Cards
  if (options.includeCards && manifest.cards && manifest.cards.length > 0) {
    lines.push('    <section class="cards">');
    lines.push('      <h2>🎴 Cards</h2>');
    lines.push('      <table>');
    lines.push('        <thead>');
    lines.push('          <tr><th>ID</th><th>File</th><th>Category</th></tr>');
    lines.push('        </thead>');
    lines.push('        <tbody>');
    for (const card of manifest.cards) {
      const category = card.category || '-';
      const deprecated = card.deprecated ? ' <span class="deprecated">⚠️ Deprecated</span>' : '';
      lines.push(`          <tr><td><code>${escapeHtml(card.id)}</code>${deprecated}</td><td>${escapeHtml(card.file)}</td><td>${escapeHtml(category)}</td></tr>`);
    }
    lines.push('        </tbody>');
    lines.push('      </table>');
    lines.push('    </section>');
  }

  // Dependencies
  if (options.includeDependencies && manifest.dependencies && Object.keys(manifest.dependencies).length > 0) {
    lines.push('    <section class="dependencies">');
    lines.push('      <h2>📦 Dependencies</h2>');
    lines.push('      <ul>');
    for (const [name, version] of Object.entries(manifest.dependencies)) {
      const versionStr = typeof version === 'string' ? version : formatConstraint(version);
      lines.push(`        <li><code>${escapeHtml(name)}</code>: ${escapeHtml(versionStr)}</li>`);
    }
    lines.push('      </ul>');
    lines.push('    </section>');
  }

  // Footer
  lines.push('  </div>');
  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}

// ============================================================================
// TEXT GENERATOR
// ============================================================================

function generateTextPreview(
  manifest: CardManifest,
  options: Omit<PreviewOptions, 'format'>
): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(80));
  lines.push(`${manifest.displayName || manifest.name} v${manifest.version}`);
  lines.push('='.repeat(80));
  lines.push('');

  if (manifest.description) {
    lines.push(wrapText(manifest.description, 78));
    lines.push('');
  }

  // Metadata
  if (options.includeMetadata) {
    lines.push('METADATA');
    lines.push('-'.repeat(80));
    lines.push(`Name:        ${manifest.name}`);
    lines.push(`Version:     ${manifest.version}`);
    
    if (manifest.category) {
      lines.push(`Category:    ${manifest.category}`);
    }

    if (manifest.author) {
      lines.push(`Author:      ${formatAuthor(manifest.author)}`);
    }

    if (manifest.license) {
      lines.push(`License:     ${formatLicense(manifest.license)}`);
    }

    if (manifest.homepage) {
      lines.push(`Homepage:    ${manifest.homepage}`);
    }

    lines.push('');
  }

  // Keywords
  if (manifest.keywords && manifest.keywords.length > 0) {
    lines.push(`Keywords: ${manifest.keywords.join(', ')}`);
    lines.push('');
  }

  // Cards
  if (options.includeCards && manifest.cards && manifest.cards.length > 0) {
    lines.push('CARDS');
    lines.push('-'.repeat(80));
    for (const card of manifest.cards) {
      const deprecated = card.deprecated ? ' [DEPRECATED]' : '';
      lines.push(`  ${card.id}${deprecated}`);
      lines.push(`    File: ${card.file}`);
      if (card.category) {
        lines.push(`    Category: ${card.category}`);
      }
      lines.push('');
    }
  }

  // Dependencies
  if (options.includeDependencies && manifest.dependencies && Object.keys(manifest.dependencies).length > 0) {
    lines.push('DEPENDENCIES');
    lines.push('-'.repeat(80));
    for (const [name, version] of Object.entries(manifest.dependencies)) {
      const versionStr = typeof version === 'string' ? version : formatConstraint(version);
      lines.push(`  ${name}: ${versionStr}`);
    }
    lines.push('');
  }

  // Platform
  if (options.includePlatform && manifest.platform) {
    lines.push('PLATFORM REQUIREMENTS');
    lines.push('-'.repeat(80));
    
    if (manifest.platform.os) {
      lines.push(`  OS: ${manifest.platform.os.join(', ')}`);
    }
    if (manifest.platform.cardplayVersion) {
      const version = typeof manifest.platform.cardplayVersion === 'string'
        ? manifest.platform.cardplayVersion
        : formatConstraint(manifest.platform.cardplayVersion);
      lines.push(`  Cardplay: ${version}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatAuthor(author: string | AuthorInfo): string {
  if (typeof author === 'string') {
    return author;
  }
  let result = author.name;
  if (author.email) {
    result += ` <${author.email}>`;
  }
  if (author.url) {
    result += ` (${author.url})`;
  }
  return result;
}

function formatLicense(license: string | { type: string; url?: string }): string {
  if (typeof license === 'string') {
    return license;
  }
  return license.url ? `${license.type} (${license.url})` : license.type;
}

function formatConstraint(constraint: { min?: string; max?: string; exact?: string; range?: string }): string {
  if (constraint.exact) return constraint.exact;
  if (constraint.range) return constraint.range;
  
  const parts: string[] = [];
  if (constraint.min) parts.push(`>=${constraint.min}`);
  if (constraint.max) parts.push(`<${constraint.max}`);
  return parts.join(' ');
}

function truncateText(text: string, maxLength?: number): string {
  if (!maxLength || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

function wrapText(text: string, width: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPreviewCSS(): string {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 40px;
    }
    header {
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      font-size: 2.5em;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .version {
      display: inline-block;
      background: #3498db;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.9em;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .description {
      color: #555;
      font-size: 1.1em;
      margin-top: 15px;
    }
    section {
      margin-bottom: 30px;
    }
    h2 {
      font-size: 1.8em;
      color: #2c3e50;
      margin-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 10px;
    }
    dl {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
    }
    dt {
      font-weight: 600;
      color: #555;
    }
    dd {
      color: #333;
    }
    .keywords {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .keyword {
      display: inline-block;
      background: #e9ecef;
      padding: 4px 10px;
      border-radius: 3px;
      margin: 2px;
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #555;
    }
    .deprecated {
      color: #e74c3c;
      font-weight: 600;
      margin-left: 8px;
    }
    code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.9em;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    ul {
      list-style-position: inside;
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
  `;
}

// ============================================================================
// QUICK GENERATORS
// ============================================================================

/**
 * Generates a quick README-style markdown preview.
 */
export function generateQuickReadme(manifest: CardManifest): string {
  return generateMarkdownPreview(manifest, {
    verbose: false,
    includeMetadata: true,
    includeDependencies: true,
    includeCards: true,
    includePlatform: true,
    includeAssets: false,
    maxDescriptionLength: 500,
  });
}

/**
 * Generates a package card HTML suitable for a registry.
 */
export function generatePackageCard(manifest: CardManifest): string {
  return generateHTMLPreview(manifest, {
    verbose: false,
    includeMetadata: true,
    includeDependencies: false,
    includeCards: true,
    includePlatform: false,
    includeAssets: false,
    maxDescriptionLength: 200,
  });
}

/**
 * Generates a brief text summary.
 */
export function generateSummary(manifest: CardManifest): string {
  const parts: string[] = [];
  
  parts.push(`${manifest.name} v${manifest.version}`);
  
  if (manifest.description) {
    parts.push(truncateText(manifest.description, 100));
  }
  
  if (manifest.cards) {
    parts.push(`${manifest.cards.length} card${manifest.cards.length !== 1 ? 's' : ''}`);
  }
  
  if (manifest.author) {
    parts.push(`by ${formatAuthor(manifest.author)}`);
  }
  
  return parts.join(' • ');
}
