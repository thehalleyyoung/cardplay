/**
 * @fileoverview Advanced Deck Template Features.
 * 
 * Provides advanced functionality for deck templates:
 * - Template variations
 * - Template sharing & collaboration
 * - Template ratings & comments
 * - Template versioning & migration
 * - Template testing
 * - Template documentation generation
 * - Template thumbnails & audio previews
 * 
 * @module @cardplay/user-cards/deck-template-advanced
 */

import type { DeckTemplate } from './deck-templates';

// ============================================================================
// TEMPLATE VARIATIONS
// ============================================================================

/**
 * Template variation - alternative configuration of a base template.
 */
export interface TemplateVariation {
  /** Variation ID */
  id: string;
  /** Parent template ID */
  parentTemplateId: string;
  /** Variation name */
  name: string;
  /** Description of differences from parent */
  description: string;
  /** Parameter overrides */
  paramOverrides: Record<string, unknown>;
  /** Slot modifications (add/remove/replace) */
  slotMods?: {
    add?: Array<{ slotId: string; cardId: string; position: { x: number; y: number } }>;
    remove?: string[];
    replace?: Array<{ slotId: string; newCardId: string }>;
  };
  /** Connection modifications */
  connectionMods?: {
    add?: Array<{ from: string; fromPort: string; to: string; toPort: string }>;
    remove?: Array<{ from: string; to: string }>;
  };
  /** Tags specific to this variation */
  tags: string[];
  /** Difficulty compared to parent (easier, same, harder) */
  difficulty?: 'easier' | 'same' | 'harder';
}

/**
 * Create a variation from a base template.
 */
export function createVariation(
  baseTemplate: DeckTemplate,
  varName: string,
  description: string,
  paramOverrides: Record<string, unknown>
): TemplateVariation {
  return {
    id: `${baseTemplate.id}.var.${Date.now()}`,
    parentTemplateId: baseTemplate.id,
    name: varName,
    description,
    paramOverrides,
    tags: [...baseTemplate.tags],
  };
}

/**
 * Apply variation to base template.
 */
export function applyVariation(
  baseTemplate: DeckTemplate,
  variation: TemplateVariation
): DeckTemplate {
  const newTemplate: DeckTemplate = {
    ...baseTemplate,
    id: variation.id,
    name: `${baseTemplate.name} - ${variation.name}`,
    description: variation.description,
    params: baseTemplate.params.map(param => ({
      ...param,
      default: variation.paramOverrides[param.name] ?? param.default,
    })),
    tags: [...new Set([...baseTemplate.tags, ...variation.tags])],
  };

  // Apply slot modifications
  if (variation.slotMods) {
    let slots = [...baseTemplate.slots];
    
    // Remove slots
    if (variation.slotMods.remove && variation.slotMods.remove.length > 0) {
      slots = slots.filter(s => !variation.slotMods!.remove!.includes(s.id));
    }
    
    // Replace slots
    if (variation.slotMods.replace && variation.slotMods.replace.length > 0) {
      for (const rep of variation.slotMods.replace) {
        const idx = slots.findIndex(s => s.id === rep.slotId);
        if (idx >= 0) {
          const existingSlot = slots[idx];
          if (existingSlot) {
            slots[idx] = { ...existingSlot, defaultCard: rep.newCardId };
          }
        }
      }
    }
    
    // Add slots
    if (variation.slotMods.add && variation.slotMods.add.length > 0) {
      for (const add of variation.slotMods.add) {
        slots.push({
          id: add.slotId,
          label: add.slotId,
          defaultCard: add.cardId,
          position: add.position,
        });
      }
    }
    
    newTemplate.slots = slots;
  }

  // Apply connection modifications
  if (variation.connectionMods) {
    let connections = [...baseTemplate.connections];
    
    // Remove connections
    if (variation.connectionMods.remove && variation.connectionMods.remove.length > 0) {
      connections = connections.filter(
        c => !variation.connectionMods!.remove!.some(
          rem => rem.from === c.from && rem.to === c.to
        )
      );
    }
    
    // Add connections
    if (variation.connectionMods.add && variation.connectionMods.add.length > 0) {
      connections.push(...variation.connectionMods.add);
    }
    
    newTemplate.connections = connections;
  }

  return newTemplate;
}

/**
 * Generate common variations for a template.
 */
export function generateCommonVariations(
  baseTemplate: DeckTemplate
): TemplateVariation[] {
  const variations: TemplateVariation[] = [];

  // Find polyphony parameter
  const polyParam = baseTemplate.params.find(
    p => p.name === 'voices' || p.name === 'polyphony'
  );
  if (polyParam && polyParam.type === 'select' && polyParam.options) {
    for (const opt of polyParam.options) {
      if (opt.value !== polyParam.default) {
        variations.push(
          createVariation(
            baseTemplate,
            `${opt.label}`,
            `Variation with ${opt.label} polyphony`,
            { [polyParam.name]: opt.value }
          )
        );
      }
    }
  }

  return variations;
}

// ============================================================================
// TEMPLATE SHARING & COLLABORATION
// ============================================================================

/**
 * Template sharing metadata.
 */
export interface TemplateShare {
  /** Share ID */
  id: string;
  /** Template ID */
  templateId: string;
  /** Template data (full copy) */
  template: DeckTemplate;
  /** Sharing user ID */
  userId: string;
  /** Share timestamp */
  sharedAt: number;
  /** Public URL */
  url: string;
  /** Access type */
  access: 'public' | 'unlisted' | 'private';
  /** Download count */
  downloads: number;
  /** Fork count (number of remixes) */
  forks: number;
}

/**
 * Create a shareable link for a template.
 */
export function createShareLink(
  template: DeckTemplate,
  userId: string,
  access: 'public' | 'unlisted' | 'private' = 'public'
): TemplateShare {
  const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: shareId,
    templateId: template.id,
    template: { ...template },
    userId,
    sharedAt: Date.now(),
    url: `https://cardplay.app/templates/${shareId}`,
    access,
    downloads: 0,
    forks: 0,
  };
}

/**
 * Fork a template (create a remix).
 */
export function forkTemplate(
  original: DeckTemplate,
  newName: string,
  userId: string
): DeckTemplate {
  return {
    ...original,
    id: `user.${userId}.${Date.now()}`,
    name: newName,
    author: userId,
    version: '1.0.0',
    description: `Forked from: ${original.name}. ${original.description}`,
  };
}

/**
 * Import template from share link.
 */
export async function importFromShareLink(url: string): Promise<DeckTemplate> {
  // In real implementation, fetch from server
  // For now, simulate with local storage
  const shareId = url.split('/').pop();
  const stored = localStorage.getItem(`share:${shareId}`);
  
  if (!stored) {
    throw new Error(`Template not found: ${url}`);
  }
  
  const share: TemplateShare = JSON.parse(stored);
  share.downloads++;
  localStorage.setItem(`share:${shareId}`, JSON.stringify(share));
  
  return share.template;
}

/**
 * Export template to JSON file.
 */
export function exportTemplateToJSON(template: DeckTemplate): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Import template from JSON string.
 */
export function importTemplateFromJSON(json: string): DeckTemplate {
  const template = JSON.parse(json);
  
  // Validate required fields
  if (!template.id || !template.name || !template.category) {
    throw new Error('Invalid template format');
  }
  
  return template as DeckTemplate;
}

// ============================================================================
// TEMPLATE RATINGS & COMMENTS
// ============================================================================

/**
 * Template rating.
 */
export interface TemplateRating {
  /** Rating ID */
  id: string;
  /** Template ID */
  templateId: string;
  /** User ID */
  userId: string;
  /** Rating (1-5 stars) */
  rating: number;
  /** Optional review text */
  review?: string;
  /** Timestamp */
  timestamp: number;
  /** Helpful votes */
  helpfulVotes: number;
}

/**
 * Template comment.
 */
export interface TemplateComment {
  /** Comment ID */
  id: string;
  /** Template ID */
  templateId: string;
  /** User ID */
  userId: string;
  /** Comment text */
  text: string;
  /** Timestamp */
  timestamp: number;
  /** Parent comment ID (for replies) */
  parentId?: string;
  /** Replies to this comment */
  replies: TemplateComment[];
  /** Upvotes */
  upvotes: number;
}

/**
 * Template rating aggregation.
 */
export interface TemplateRatingStats {
  /** Template ID */
  templateId: string;
  /** Average rating */
  averageRating: number;
  /** Total ratings */
  totalRatings: number;
  /** Rating distribution */
  distribution: Record<number, number>; // 1-5 stars -> count
  /** Total comments */
  totalComments: number;
}

/**
 * Add rating to template.
 */
export function rateTemplate(
  templateId: string,
  userId: string,
  rating: number,
  review?: string
): TemplateRating {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const ratingObj: TemplateRating = {
    id: `rating-${Date.now()}`,
    templateId,
    userId,
    rating,
    timestamp: Date.now(),
    helpfulVotes: 0,
  };
  
  if (review) {
    ratingObj.review = review;
  }
  
  // Store in local storage (in real app, would be server)
  const key = `rating:${templateId}:${userId}`;
  localStorage.setItem(key, JSON.stringify(ratingObj));
  
  return ratingObj;
}

/**
 * Add comment to template.
 */
export function commentOnTemplate(
  templateId: string,
  userId: string,
  text: string,
  parentId?: string
): TemplateComment {
  const comment: TemplateComment = {
    id: `comment-${Date.now()}`,
    templateId,
    userId,
    text,
    timestamp: Date.now(),
    replies: [],
    upvotes: 0,
  };
  
  if (parentId) {
    comment.parentId = parentId;
  }
  
  // Store in local storage
  const key = `comment:${comment.id}`;
  localStorage.setItem(key, JSON.stringify(comment));
  
  // Update parent if reply
  if (comment.parentId) {
    const parentKey = `comment:${comment.parentId}`;
    const parentStr = localStorage.getItem(parentKey);
    if (parentStr) {
      const parent: TemplateComment = JSON.parse(parentStr);
      parent.replies.push(comment);
      localStorage.setItem(parentKey, JSON.stringify(parent));
    }
  }
  
  return comment;
}

/**
 * Calculate rating stats for template.
 */
export function calculateRatingStats(templateId: string): TemplateRatingStats {
  const ratings: TemplateRating[] = [];
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // Scan local storage for ratings (in real app, would query server)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`rating:${templateId}:`)) {
      const ratingStr = localStorage.getItem(key);
      if (ratingStr) {
        const rating: TemplateRating = JSON.parse(ratingStr);
        ratings.push(rating);
        const ratingValue = rating.rating;
        if (ratingValue >= 1 && ratingValue <= 5) {
          const currentCount = distribution[ratingValue];
          if (currentCount !== undefined) {
            distribution[ratingValue] = currentCount + 1;
          }
        }
      }
    }
  }
  
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;
  
  // Count comments
  let totalComments = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('comment:')) {
      const commentStr = localStorage.getItem(key);
      if (commentStr) {
        const comment: TemplateComment = JSON.parse(commentStr);
        if (comment.templateId === templateId) {
          totalComments++;
        }
      }
    }
  }
  
  return {
    templateId,
    averageRating,
    totalRatings: ratings.length,
    distribution,
    totalComments,
  };
}

// ============================================================================
// TEMPLATE VERSIONING & MIGRATION
// ============================================================================

/**
 * Template version history entry.
 */
export interface TemplateVersion {
  /** Version number (semver) */
  version: string;
  /** Template snapshot at this version */
  template: DeckTemplate;
  /** Timestamp */
  timestamp: number;
  /** Change description */
  changelog: string;
  /** Breaking changes */
  breaking: boolean;
}

/**
 * Template version history.
 */
export interface TemplateVersionHistory {
  /** Template ID */
  templateId: string;
  /** All versions */
  versions: TemplateVersion[];
  /** Current version */
  currentVersion: string;
}

/**
 * Create new version of template.
 */
export function createTemplateVersion(
  template: DeckTemplate,
  changelog: string,
  breaking: boolean = false
): TemplateVersion {
  const version: TemplateVersion = {
    version: template.version,
    template: { ...template },
    timestamp: Date.now(),
    changelog,
    breaking,
  };
  
  // Store version
  const historyKey = `version-history:${template.id}`;
  const historyStr = localStorage.getItem(historyKey);
  let history: TemplateVersionHistory;
  
  if (historyStr) {
    history = JSON.parse(historyStr);
    history.versions.push(version);
    history.currentVersion = template.version;
  } else {
    history = {
      templateId: template.id,
      versions: [version],
      currentVersion: template.version,
    };
  }
  
  localStorage.setItem(historyKey, JSON.stringify(history));
  
  return version;
}

/**
 * Get version history for template.
 */
export function getVersionHistory(templateId: string): TemplateVersionHistory | null {
  const historyKey = `version-history:${templateId}`;
  const historyStr = localStorage.getItem(historyKey);
  
  if (!historyStr) {
    return null;
  }
  
  return JSON.parse(historyStr);
}

/**
 * Migrate template to new version.
 */
export interface MigrationResult {
  /** Success flag */
  success: boolean;
  /** Migrated template */
  template?: DeckTemplate;
  /** Errors encountered */
  errors: string[];
  /** Warnings */
  warnings: string[];
}

/**
 * Migrate template from old version to new version.
 */
export function migrateTemplate(
  oldTemplate: DeckTemplate,
  targetVersion: string
): MigrationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Clone template
    const migrated: DeckTemplate = JSON.parse(JSON.stringify(oldTemplate));
    migrated.version = targetVersion;
    
    // Check for deprecated params
    const deprecatedParams = ['oldParam1', 'oldParam2']; // Example
    migrated.params = migrated.params.filter(p => {
      if (deprecatedParams.includes(p.name)) {
        warnings.push(`Removed deprecated parameter: ${p.name}`);
        return false;
      }
      return true;
    });
    
    // Check for missing required fields (new in target version)
    if (!migrated.tags) {
      migrated.tags = [];
      warnings.push('Added missing tags field');
    }
    
    return {
      success: true,
      template: migrated,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Migration failed: ${error}`);
    return {
      success: false,
      errors,
      warnings,
    };
  }
}

// ============================================================================
// TEMPLATE TESTING
// ============================================================================

/**
 * Template test result.
 */
export interface TemplateTestResult {
  /** Test name */
  name: string;
  /** Pass/fail */
  passed: boolean;
  /** Error message */
  error?: string;
  /** Duration (ms) */
  duration: number;
}

/**
 * Template test suite result.
 */
export interface TemplateTestSuite {
  /** Template ID */
  templateId: string;
  /** Tests */
  tests: TemplateTestResult[];
  /** Total passed */
  passed: number;
  /** Total failed */
  failed: number;
  /** Total duration */
  duration: number;
}

/**
 * Run tests on template.
 */
export async function testTemplate(template: DeckTemplate): Promise<TemplateTestSuite> {
  const tests: TemplateTestResult[] = [];
  const startTime = Date.now();
  
  // Test: Required fields present
  tests.push(await runTest('Required fields present', () => {
    if (!template.id) throw new Error('Missing id');
    if (!template.name) throw new Error('Missing name');
    if (!template.category) throw new Error('Missing category');
    if (!template.description) throw new Error('Missing description');
    if (!template.version) throw new Error('Missing version');
  }));
  
  // Test: Valid version format
  tests.push(await runTest('Valid semver version', () => {
    const semverPattern = /^\d+\.\d+\.\d+$/;
    if (!semverPattern.test(template.version)) {
      throw new Error(`Invalid version format: ${template.version}`);
    }
  }));
  
  // Test: All slots have positions
  tests.push(await runTest('All slots have positions', () => {
    for (const slot of template.slots) {
      if (!slot.position || typeof slot.position.x !== 'number' || typeof slot.position.y !== 'number') {
        throw new Error(`Slot ${slot.id} missing valid position`);
      }
    }
  }));
  
  // Test: Connections reference valid slots
  tests.push(await runTest('Valid connections', () => {
    const slotIds = new Set(template.slots.map(s => s.id));
    for (const conn of template.connections) {
      if (!slotIds.has(conn.from)) {
        throw new Error(`Connection references unknown slot: ${conn.from}`);
      }
      if (!slotIds.has(conn.to)) {
        throw new Error(`Connection references unknown slot: ${conn.to}`);
      }
    }
  }));
  
  // Test: No circular connections
  tests.push(await runTest('No circular dependencies', () => {
    const hasCircular = detectCircularConnections(template.connections);
    if (hasCircular) {
      throw new Error('Template has circular connections');
    }
  }));
  
  // Test: Parameters have valid types
  tests.push(await runTest('Valid parameter types', () => {
    const validTypes = ['number', 'string', 'boolean', 'select', 'card'];
    for (const param of template.params) {
      if (!validTypes.includes(param.type)) {
        throw new Error(`Invalid parameter type: ${param.type}`);
      }
      if (param.type === 'select' && !param.options) {
        throw new Error(`Select parameter ${param.name} missing options`);
      }
    }
  }));
  
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  
  return {
    templateId: template.id,
    tests,
    passed,
    failed,
    duration: Date.now() - startTime,
  };
}

/**
 * Run a single test.
 */
async function runTest(name: string, test: () => void): Promise<TemplateTestResult> {
  const startTime = Date.now();
  
  try {
    test();
    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Detect circular connections using DFS.
 */
function detectCircularConnections(connections: Array<{ from: string; to: string }>): boolean {
  const graph = new Map<string, Set<string>>();
  
  // Build adjacency list
  for (const conn of connections) {
    if (!graph.has(conn.from)) {
      graph.set(conn.from, new Set());
    }
    graph.get(conn.from)!.add(conn.to);
  }
  
  // DFS to detect cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();
  
  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);
    
    const neighbors = graph.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Cycle found
        }
      }
    }
    
    recStack.delete(node);
    return false;
  }
  
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }
  
  return false;
}

// ============================================================================
// TEMPLATE DOCUMENTATION
// ============================================================================

/**
 * Generate markdown documentation for template.
 */
export function generateTemplateDocumentation(template: DeckTemplate): string {
  let doc = `# ${template.name}\n\n`;
  doc += `**Category**: ${template.category}  \n`;
  doc += `**Version**: ${template.version}  \n`;
  if (template.author) {
    doc += `**Author**: ${template.author}  \n`;
  }
  doc += `\n`;
  
  doc += `## Description\n\n${template.description}\n\n`;
  
  // Tags
  if (template.tags.length > 0) {
    doc += `## Tags\n\n`;
    doc += template.tags.map(t => `\`${t}\``).join(', ');
    doc += `\n\n`;
  }
  
  // Parameters
  if (template.params.length > 0) {
    doc += `## Parameters\n\n`;
    for (const param of template.params) {
      doc += `### ${param.label}\n\n`;
      doc += `- **Name**: \`${param.name}\`\n`;
      doc += `- **Type**: ${param.type}\n`;
      doc += `- **Default**: ${JSON.stringify(param.default)}\n`;
      if (param.description) {
        doc += `- **Description**: ${param.description}\n`;
      }
      if (param.type === 'number') {
        if (param.min !== undefined) doc += `- **Min**: ${param.min}\n`;
        if (param.max !== undefined) doc += `- **Max**: ${param.max}\n`;
        if (param.step !== undefined) doc += `- **Step**: ${param.step}\n`;
      }
      if (param.type === 'select' && param.options) {
        doc += `- **Options**:\n`;
        for (const opt of param.options) {
          doc += `  - ${opt.label}: \`${JSON.stringify(opt.value)}\`\n`;
        }
      }
      doc += `\n`;
    }
  }
  
  // Card slots
  doc += `## Card Slots\n\n`;
  for (const slot of template.slots) {
    doc += `- **${slot.label}** (\`${slot.id}\`)`;
    if (slot.defaultCard) {
      doc += ` - Default: \`${slot.defaultCard}\``;
    }
    if (slot.optional) {
      doc += ` *(optional)*`;
    }
    doc += `\n`;
  }
  doc += `\n`;
  
  // Connections
  doc += `## Signal Flow\n\n`;
  for (const conn of template.connections) {
    doc += `- \`${conn.from}.${conn.fromPort}\` → \`${conn.to}.${conn.toPort}\`\n`;
  }
  doc += `\n`;
  
  // Usage
  doc += `## Usage\n\n`;
  doc += `1. Open the template browser\n`;
  doc += `2. Search for "${template.name}"\n`;
  doc += `3. Click "Instantiate" to add to your deck\n`;
  doc += `4. Adjust parameters as needed\n`;
  doc += `\n`;
  
  return doc;
}

// ============================================================================
// TEMPLATE THUMBNAILS & AUDIO PREVIEWS
// ============================================================================

/**
 * Generate SVG thumbnail for template.
 */
export function generateTemplateThumbnail(template: DeckTemplate): string {
  const width = 400;
  const height = 300;
  const padding = 20;
  
  // Calculate bounds
  const minX = Math.min(...template.slots.map(s => s.position.x));
  const maxX = Math.max(...template.slots.map(s => s.position.x));
  const minY = Math.min(...template.slots.map(s => s.position.y));
  const maxY = Math.max(...template.slots.map(s => s.position.y));
  
  const scaleX = (width - 2 * padding) / Math.max(1, maxX - minX);
  const scaleY = (height - 2 * padding) / Math.max(1, maxY - minY);
  const scale = Math.min(scaleX, scaleY, 80); // Max 80px per unit
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="#1a1a2e"/>`;
  
  // Draw connections
  for (const conn of template.connections) {
    const fromSlot = template.slots.find(s => s.id === conn.from);
    const toSlot = template.slots.find(s => s.id === conn.to);
    
    if (fromSlot && toSlot) {
      const x1 = padding + (fromSlot.position.x - minX) * scale + 40;
      const y1 = padding + (fromSlot.position.y - minY) * scale + 30;
      const x2 = padding + (toSlot.position.x - minX) * scale + 40;
      const y2 = padding + (toSlot.position.y - minY) * scale + 30;
      
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#16213e" stroke-width="2"/>`;
    }
  }
  
  // Draw slots
  for (const slot of template.slots) {
    const x = padding + (slot.position.x - minX) * scale;
    const y = padding + (slot.position.y - minY) * scale;
    
    // Card rectangle
    svg += `<rect x="${x}" y="${y}" width="80" height="60" rx="8" fill="#0f3460" stroke="#e94560" stroke-width="2"/>`;
    
    // Label
    const label = slot.label.length > 10 ? slot.label.substring(0, 8) + '...' : slot.label;
    svg += `<text x="${x + 40}" y="${y + 35}" text-anchor="middle" fill="#ffffff" font-size="12">${label}</text>`;
  }
  
  svg += `</svg>`;
  
  return svg;
}

/**
 * Create data URL from SVG thumbnail.
 */
export function thumbnailToDataURL(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Audio preview configuration.
 */
export interface AudioPreviewConfig {
  /** Duration in seconds */
  duration: number;
  /** Tempo (BPM) */
  tempo: number;
  /** Sample rate */
  sampleRate: number;
  /** Use example MIDI pattern */
  useMidiPattern: boolean;
}

/**
 * Generate audio preview for template.
 * Note: This is a stub - full implementation would instantiate the template
 * and render audio through the engine.
 */
export async function generateAudioPreview(
  _template: DeckTemplate,
  config: AudioPreviewConfig = {
    duration: 8,
    tempo: 120,
    sampleRate: 44100,
    useMidiPattern: true,
  }
): Promise<ArrayBuffer> {
  // In real implementation:
  // 1. Instantiate template with default parameters
  // 2. Feed example MIDI pattern
  // 3. Render audio for specified duration
  // 4. Export as WAV/MP3
  
  // For now, return empty audio buffer (stub)
  const numSamples = Math.floor(config.duration * config.sampleRate);
  const buffer = new ArrayBuffer(numSamples * 4); // 32-bit float
  
  // TODO: Implement actual audio rendering
  
  return buffer;
}

/**
 * Save audio preview as WAV file.
 */
export function saveAudioPreviewAsWAV(
  audioData: ArrayBuffer,
  sampleRate: number,
  filename: string
): void {
  // Create WAV header
  const numSamples = audioData.byteLength / 4;
  const wavHeader = createWAVHeader(numSamples, sampleRate);
  
  // Combine header + data
  const wavFile = new Uint8Array(wavHeader.byteLength + audioData.byteLength);
  wavFile.set(new Uint8Array(wavHeader), 0);
  wavFile.set(new Uint8Array(audioData), wavHeader.byteLength);
  
  // Download
  const blob = new Blob([wavFile], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Create WAV file header.
 */
function createWAVHeader(numSamples: number, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 4, true); // File size - 8
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 3, true); // AudioFormat (3 = IEEE float)
  view.setUint16(22, 1, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 4, true); // ByteRate
  view.setUint16(32, 4, true); // BlockAlign
  view.setUint16(34, 32, true); // BitsPerSample (32-bit float)
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 4, true); // Subchunk2Size
  
  return buffer;
}

/**
 * Write string to DataView.
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Template quick-start generator.
 */
export interface QuickStartConfig {
  /** User skill level */
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  /** Musical goal */
  goal: 'learn' | 'create' | 'experiment';
  /** Preferred genre */
  genre?: string;
}

/**
 * Generate quick-start guide for template based on user profile.
 */
export function generateQuickStart(
  template: DeckTemplate,
  config: QuickStartConfig
): string {
  let guide = `# Quick Start: ${template.name}\n\n`;
  
  // Difficulty assessment
  const complexity = assessTemplateComplexity(template);
  guide += `**Complexity**: ${complexity}/5 ⭐\n\n`;
  
  if (config.skillLevel === 'beginner' && complexity >= 4) {
    guide += `> ⚠️ **Note**: This is an advanced template. Consider starting with a simpler template first.\n\n`;
  }
  
  guide += `## What You'll Learn\n\n`;
  
  // Skill-level specific content
  if (config.skillLevel === 'beginner') {
    guide += `This template will help you understand:\n`;
    guide += `- How to connect ${template.slots.length} cards together\n`;
    guide += `- Basic signal flow in audio processing\n`;
    guide += `- Essential parameters for ${template.category} sounds\n\n`;
  } else if (config.skillLevel === 'intermediate') {
    guide += `You'll practice:\n`;
    guide += `- Advanced routing techniques\n`;
    guide += `- Parameter automation and modulation\n`;
    guide += `- Custom sound design\n\n`;
  } else {
    guide += `Explore:\n`;
    guide += `- Complex signal routing patterns\n`;
    guide += `- Performance optimization\n`;
    guide += `- Integration with other templates\n\n`;
  }
  
  guide += `## Step-by-Step\n\n`;
  
  // Generate steps based on template
  guide += `1. **Instantiate the template** - Click the "Use Template" button\n`;
  guide += `2. **Review the cards** - The template includes ${template.slots.length} cards:\n`;
  for (const slot of template.slots.slice(0, 5)) {
    guide += `   - ${slot.label}${slot.defaultCard ? ` (${slot.defaultCard})` : ''}\n`;
  }
  if (template.slots.length > 5) {
    guide += `   - ...and ${template.slots.length - 5} more\n`;
  }
  guide += `3. **Adjust parameters** - Start with these key controls:\n`;
  for (const param of template.params.slice(0, 3)) {
    guide += `   - **${param.label}**: ${param.description || 'Adjust to taste'}\n`;
  }
  guide += `4. **Play and tweak** - ${config.goal === 'learn' ? 'Listen to how each parameter affects the sound' : config.goal === 'create' ? 'Shape the sound to match your vision' : 'Try extreme settings and see what happens!'}\n`;
  guide += `5. **Save your work** - Don't forget to save your customized template\n\n`;
  
  guide += `## Tips & Tricks\n\n`;
  
  if (config.skillLevel === 'beginner') {
    guide += `- Start with the default parameter values\n`;
    guide += `- Change one parameter at a time to hear its effect\n`;
    guide += `- Use the preset browser to find starting points\n`;
  } else {
    guide += `- Try automating key parameters over time\n`;
    guide += `- Experiment with replacing default cards\n`;
    guide += `- Create variations by duplicating and modifying\n`;
  }
  
  guide += `\n## Next Steps\n\n`;
  guide += `- Try creating a variation of this template\n`;
  guide += `- Combine with other templates for complex setups\n`;
  guide += `- Share your creations with the community\n`;
  
  return guide;
}

/**
 * Assess template complexity (1-5 scale).
 */
function assessTemplateComplexity(template: DeckTemplate): number {
  let score = 1;
  
  // More slots = more complex
  if (template.slots.length > 5) score++;
  if (template.slots.length > 10) score++;
  
  // More connections = more complex
  if (template.connections.length > 6) score++;
  
  // More parameters = more complex
  if (template.params.length > 5) score++;
  
  return Math.min(score, 5);
}
