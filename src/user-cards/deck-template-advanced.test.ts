/**
 * @fileoverview Tests for Advanced Deck Template Features.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createVariation,
  applyVariation,
  generateCommonVariations,
  createShareLink,
  forkTemplate,
  exportTemplateToJSON,
  importTemplateFromJSON,
  rateTemplate,
  commentOnTemplate,
  calculateRatingStats,
  createTemplateVersion,
  getVersionHistory,
  migrateTemplate,
  testTemplate,
  generateTemplateDocumentation,
  generateTemplateThumbnail,
  thumbnailToDataURL,
  generateQuickStart,
  type TemplateVariation,
  type DeckTemplate,
} from './deck-template-advanced';
import { SubtractiveSynthTemplate } from './deck-templates';

// ============================================================================
// TEST HELPERS
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; },
  };
})();

// Replace global localStorage
global.localStorage = localStorageMock as any;

function createTestTemplate(): DeckTemplate {
  return {
    id: 'test.template.1',
    name: 'Test Template',
    category: 'synth',
    description: 'A test template',
    version: '1.0.0',
    author: 'test-user',
    tags: ['test', 'synth'],
    params: [
      {
        name: 'voices',
        label: 'Polyphony',
        type: 'select',
        default: 4,
        options: [
          { value: 1, label: 'Mono' },
          { value: 4, label: '4 Voices' },
          { value: 8, label: '8 Voices' },
        ],
      },
      {
        name: 'cutoff',
        label: 'Filter Cutoff',
        type: 'number',
        default: 1000,
        min: 20,
        max: 20000,
      },
    ],
    slots: [
      { id: 'osc', label: 'Oscillator', position: { x: 0, y: 0 } },
      { id: 'filter', label: 'Filter', position: { x: 1, y: 0 } },
      { id: 'output', label: 'Output', position: { x: 2, y: 0 } },
    ],
    connections: [
      { from: 'osc', fromPort: 'out', to: 'filter', toPort: 'in' },
      { from: 'filter', fromPort: 'out', to: 'output', toPort: 'in' },
    ],
  };
}

beforeEach(() => {
  // Clear local storage before each test
  localStorage.clear();
});

// ============================================================================
// TEMPLATE VARIATIONS
// ============================================================================

describe('Template Variations', () => {
  it('should create a variation', () => {
    const template = createTestTemplate();
    const variation = createVariation(
      template,
      'Mono Version',
      'Monophonic variation',
      { voices: 1 }
    );
    
    expect(variation.parentTemplateId).toBe(template.id);
    expect(variation.name).toBe('Mono Version');
    expect(variation.paramOverrides.voices).toBe(1);
  });
  
  it('should apply variation to base template', () => {
    const template = createTestTemplate();
    const variation = createVariation(
      template,
      'Mono Version',
      'Monophonic variation',
      { voices: 1, cutoff: 5000 }
    );
    
    const applied = applyVariation(template, variation);
    
    expect(applied.name).toContain('Mono Version');
    const voicesParam = applied.params.find(p => p.name === 'voices');
    expect(voicesParam?.default).toBe(1);
    const cutoffParam = applied.params.find(p => p.name === 'cutoff');
    expect(cutoffParam?.default).toBe(5000);
  });
  
  it('should generate common variations', () => {
    const template = createTestTemplate();
    const variations = generateCommonVariations(template);
    
    expect(variations.length).toBeGreaterThan(0);
    expect(variations.every(v => v.parentTemplateId === template.id)).toBe(true);
  });
  
  it('should apply slot modifications', () => {
    const template = createTestTemplate();
    const variation: TemplateVariation = {
      id: 'var1',
      parentTemplateId: template.id,
      name: 'With LFO',
      description: 'Adds LFO modulation',
      paramOverrides: {},
      slotMods: {
        add: [{ slotId: 'lfo', cardId: 'mod.lfo', position: { x: 0, y: 1 } }],
      },
      tags: ['modulation'],
    };
    
    const applied = applyVariation(template, variation);
    
    expect(applied.slots.length).toBe(template.slots.length + 1);
    expect(applied.slots.find(s => s.id === 'lfo')).toBeDefined();
  });
  
  it('should remove slots', () => {
    const template = createTestTemplate();
    const variation: TemplateVariation = {
      id: 'var1',
      parentTemplateId: template.id,
      name: 'Simple Version',
      description: 'Removes filter',
      paramOverrides: {},
      slotMods: {
        remove: ['filter'],
      },
      tags: ['simple'],
    };
    
    const applied = applyVariation(template, variation);
    
    expect(applied.slots.length).toBe(template.slots.length - 1);
    expect(applied.slots.find(s => s.id === 'filter')).toBeUndefined();
  });
  
  it('should replace slots', () => {
    const template = createTestTemplate();
    const variation: TemplateVariation = {
      id: 'var1',
      parentTemplateId: template.id,
      name: 'Different Filter',
      description: 'Uses different filter',
      paramOverrides: {},
      slotMods: {
        replace: [{ slotId: 'filter', newCardId: 'fx.filter.ladder' }],
      },
      tags: ['moog'],
    };
    
    const applied = applyVariation(template, variation);
    
    const filterSlot = applied.slots.find(s => s.id === 'filter');
    expect(filterSlot?.defaultCard).toBe('fx.filter.ladder');
  });
  
  it('should add connections', () => {
    const template = createTestTemplate();
    const variation: TemplateVariation = {
      id: 'var1',
      parentTemplateId: template.id,
      name: 'With Sidechain',
      description: 'Adds sidechain routing',
      paramOverrides: {},
      connectionMods: {
        add: [{ from: 'osc', fromPort: 'out', to: 'output', toPort: 'sidechain' }],
      },
      tags: ['sidechain'],
    };
    
    const applied = applyVariation(template, variation);
    
    expect(applied.connections.length).toBe(template.connections.length + 1);
  });
  
  it('should remove connections', () => {
    const template = createTestTemplate();
    const variation: TemplateVariation = {
      id: 'var1',
      parentTemplateId: template.id,
      name: 'Direct',
      description: 'Removes filter stage',
      paramOverrides: {},
      connectionMods: {
        remove: [{ from: 'osc', to: 'filter' }],
      },
      tags: ['direct'],
    };
    
    const applied = applyVariation(template, variation);
    
    expect(applied.connections.length).toBe(template.connections.length - 1);
  });
});

// ============================================================================
// TEMPLATE SHARING
// ============================================================================

describe('Template Sharing', () => {
  it('should create a share link', () => {
    const template = createTestTemplate();
    const share = createShareLink(template, 'user1', 'public');
    
    expect(share.templateId).toBe(template.id);
    expect(share.userId).toBe('user1');
    expect(share.access).toBe('public');
    expect(share.url).toContain('cardplay.app/templates');
  });
  
  it('should fork a template', () => {
    const template = createTestTemplate();
    const forked = forkTemplate(template, 'My Custom Version', 'user2');
    
    expect(forked.id).not.toBe(template.id);
    expect(forked.name).toBe('My Custom Version');
    expect(forked.author).toBe('user2');
    expect(forked.description).toContain('Forked from');
  });
  
  it('should export template to JSON', () => {
    const template = createTestTemplate();
    const json = exportTemplateToJSON(template);
    
    expect(json).toContain(template.id);
    expect(json).toContain(template.name);
    expect(() => JSON.parse(json)).not.toThrow();
  });
  
  it('should import template from JSON', () => {
    const template = createTestTemplate();
    const json = exportTemplateToJSON(template);
    const imported = importTemplateFromJSON(json);
    
    expect(imported.id).toBe(template.id);
    expect(imported.name).toBe(template.name);
    expect(imported.slots.length).toBe(template.slots.length);
  });
  
  it('should reject invalid JSON', () => {
    expect(() => importTemplateFromJSON('{}')).toThrow();
    expect(() => importTemplateFromJSON('{"id":"test"}')).toThrow();
  });
});

// ============================================================================
// RATINGS & COMMENTS
// ============================================================================

describe('Ratings & Comments', () => {
  it('should rate a template', () => {
    const rating = rateTemplate('template1', 'user1', 5, 'Excellent!');
    
    expect(rating.templateId).toBe('template1');
    expect(rating.userId).toBe('user1');
    expect(rating.rating).toBe(5);
    expect(rating.review).toBe('Excellent!');
  });
  
  it('should reject invalid ratings', () => {
    expect(() => rateTemplate('template1', 'user1', 0)).toThrow();
    expect(() => rateTemplate('template1', 'user1', 6)).toThrow();
  });
  
  it('should add a comment', () => {
    const comment = commentOnTemplate('template1', 'user1', 'Great template!');
    
    expect(comment.templateId).toBe('template1');
    expect(comment.userId).toBe('user1');
    expect(comment.text).toBe('Great template!');
    expect(comment.replies).toEqual([]);
  });
  
  it('should add a reply to comment', () => {
    const parent = commentOnTemplate('template1', 'user1', 'Great template!');
    const reply = commentOnTemplate('template1', 'user2', 'I agree!', parent.id);
    
    expect(reply.parentId).toBe(parent.id);
  });
  
  it('should calculate rating stats', () => {
    rateTemplate('template1', 'user1', 5);
    rateTemplate('template1', 'user2', 4);
    rateTemplate('template1', 'user3', 5);
    commentOnTemplate('template1', 'user1', 'Comment 1');
    commentOnTemplate('template1', 'user2', 'Comment 2');
    
    const stats = calculateRatingStats('template1');
    
    expect(stats.totalRatings).toBe(3);
    expect(stats.averageRating).toBeCloseTo(4.67, 1);
    expect(stats.distribution[5]).toBe(2);
    expect(stats.distribution[4]).toBe(1);
    expect(stats.totalComments).toBeGreaterThan(0);
  });
});

// ============================================================================
// VERSIONING & MIGRATION
// ============================================================================

describe('Versioning & Migration', () => {
  it('should create a version', () => {
    const template = createTestTemplate();
    const version = createTemplateVersion(template, 'Initial release', false);
    
    expect(version.version).toBe(template.version);
    expect(version.changelog).toBe('Initial release');
    expect(version.breaking).toBe(false);
  });
  
  it('should get version history', () => {
    const template = createTestTemplate();
    createTemplateVersion(template, 'Initial release');
    
    const history = getVersionHistory(template.id);
    
    expect(history).toBeDefined();
    expect(history?.versions.length).toBe(1);
    expect(history?.currentVersion).toBe(template.version);
  });
  
  it('should track multiple versions', () => {
    const template = createTestTemplate();
    createTemplateVersion(template, 'v1.0.0');
    
    template.version = '1.1.0';
    createTemplateVersion(template, 'v1.1.0 - Added features');
    
    template.version = '2.0.0';
    createTemplateVersion(template, 'v2.0.0 - Breaking changes', true);
    
    const history = getVersionHistory(template.id);
    
    expect(history?.versions.length).toBe(3);
    expect(history?.versions[2].breaking).toBe(true);
  });
  
  it('should migrate template', () => {
    const template = createTestTemplate();
    template.version = '1.0.0';
    
    const result = migrateTemplate(template, '2.0.0');
    
    expect(result.success).toBe(true);
    expect(result.template?.version).toBe('2.0.0');
  });
  
  it('should handle migration warnings', () => {
    const template = createTestTemplate();
    delete (template as any).tags; // Remove field
    
    const result = migrateTemplate(template, '2.0.0');
    
    expect(result.success).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.template?.tags).toBeDefined();
  });
});

// ============================================================================
// TEMPLATE TESTING
// ============================================================================

describe('Template Testing', () => {
  it('should run all tests', async () => {
    const template = createTestTemplate();
    const result = await testTemplate(template);
    
    expect(result.templateId).toBe(template.id);
    expect(result.tests.length).toBeGreaterThan(0);
    expect(result.passed + result.failed).toBe(result.tests.length);
  });
  
  it('should pass valid template', async () => {
    const template = createTestTemplate();
    const result = await testTemplate(template);
    
    expect(result.passed).toBe(result.tests.length);
    expect(result.failed).toBe(0);
  });
  
  it('should fail template without id', async () => {
    const template = createTestTemplate();
    delete (template as any).id;
    
    const result = await testTemplate(template);
    
    expect(result.failed).toBeGreaterThan(0);
    const failedTest = result.tests.find(t => !t.passed);
    expect(failedTest?.error).toContain('id');
  });
  
  it('should fail template with invalid version', async () => {
    const template = createTestTemplate();
    template.version = 'invalid';
    
    const result = await testTemplate(template);
    
    expect(result.failed).toBeGreaterThan(0);
    const failedTest = result.tests.find(t => t.name.includes('semver'));
    expect(failedTest?.passed).toBe(false);
  });
  
  it('should detect invalid connections', async () => {
    const template = createTestTemplate();
    template.connections.push({
      from: 'nonexistent',
      fromPort: 'out',
      to: 'output',
      toPort: 'in',
    });
    
    const result = await testTemplate(template);
    
    const connTest = result.tests.find(t => t.name.includes('Valid connections'));
    expect(connTest?.passed).toBe(false);
  });
  
  it('should detect circular connections', async () => {
    const template = createTestTemplate();
    template.connections.push({
      from: 'output',
      fromPort: 'out',
      to: 'osc',
      toPort: 'in',
    });
    
    const result = await testTemplate(template);
    
    const circularTest = result.tests.find(t => t.name.includes('circular'));
    expect(circularTest?.passed).toBe(false);
  });
  
  it('should validate parameter types', async () => {
    const template = createTestTemplate();
    (template.params[0] as any).type = 'invalid-type';
    
    const result = await testTemplate(template);
    
    const paramTest = result.tests.find(t => t.name.includes('parameter types'));
    expect(paramTest?.passed).toBe(false);
  });
  
  it('should require options for select parameters', async () => {
    const template = createTestTemplate();
    delete (template.params[0] as any).options;
    
    const result = await testTemplate(template);
    
    const paramTest = result.tests.find(t => t.name.includes('parameter types'));
    expect(paramTest?.passed).toBe(false);
  });
});

// ============================================================================
// DOCUMENTATION
// ============================================================================

describe('Documentation', () => {
  it('should generate markdown documentation', () => {
    const template = createTestTemplate();
    const doc = generateTemplateDocumentation(template);
    
    expect(doc).toContain(`# ${template.name}`);
    expect(doc).toContain(template.description);
    expect(doc).toContain('Parameters');
    expect(doc).toContain('Card Slots');
    expect(doc).toContain('Signal Flow');
  });
  
  it('should include all parameters', () => {
    const template = createTestTemplate();
    const doc = generateTemplateDocumentation(template);
    
    for (const param of template.params) {
      expect(doc).toContain(param.label);
      expect(doc).toContain(param.name);
    }
  });
  
  it('should include all slots', () => {
    const template = createTestTemplate();
    const doc = generateTemplateDocumentation(template);
    
    for (const slot of template.slots) {
      expect(doc).toContain(slot.label);
    }
  });
  
  it('should include connections', () => {
    const template = createTestTemplate();
    const doc = generateTemplateDocumentation(template);
    
    for (const conn of template.connections) {
      expect(doc).toContain(conn.from);
      expect(doc).toContain(conn.to);
    }
  });
});

// ============================================================================
// THUMBNAILS & PREVIEWS
// ============================================================================

describe('Thumbnails & Previews', () => {
  it('should generate SVG thumbnail', () => {
    const template = createTestTemplate();
    const svg = generateTemplateThumbnail(template);
    
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('width="400"');
    expect(svg).toContain('height="300"');
  });
  
  it('should include all slots in thumbnail', () => {
    const template = createTestTemplate();
    const svg = generateTemplateThumbnail(template);
    
    for (const slot of template.slots) {
      const label = slot.label.length > 10 ? slot.label.substring(0, 8) : slot.label;
      expect(svg).toContain(label);
    }
  });
  
  it('should convert thumbnail to data URL', () => {
    const template = createTestTemplate();
    const svg = generateTemplateThumbnail(template);
    const dataURL = thumbnailToDataURL(svg);
    
    expect(dataURL).toContain('data:image/svg+xml;base64,');
  });
});

// ============================================================================
// QUICK START
// ============================================================================

describe('Quick Start', () => {
  it('should generate quick start guide', () => {
    const template = createTestTemplate();
    const guide = generateQuickStart(template, {
      skillLevel: 'beginner',
      goal: 'learn',
    });
    
    expect(guide).toContain(`# Quick Start: ${template.name}`);
    expect(guide).toContain('What You\'ll Learn');
    expect(guide).toContain('Step-by-Step');
    expect(guide).toContain('Tips & Tricks');
  });
  
  it('should adapt to skill level', () => {
    const template = createTestTemplate();
    
    const beginnerGuide = generateQuickStart(template, {
      skillLevel: 'beginner',
      goal: 'learn',
    });
    const advancedGuide = generateQuickStart(template, {
      skillLevel: 'advanced',
      goal: 'experiment',
    });
    
    expect(beginnerGuide).not.toBe(advancedGuide);
    expect(beginnerGuide).toContain('Basic');
    expect(advancedGuide).toContain('Explore');
  });
  
  it('should warn beginners about complex templates', () => {
    const template = SubtractiveSynthTemplate;
    const guide = generateQuickStart(template, {
      skillLevel: 'beginner',
      goal: 'learn',
    });
    
    // SubtractiveSynthTemplate has decent complexity
    if (template.slots.length >= 5) {
      expect(guide).toContain('Complexity');
    }
  });
  
  it('should adapt to user goals', () => {
    const template = createTestTemplate();
    
    const learnGuide = generateQuickStart(template, {
      skillLevel: 'intermediate',
      goal: 'learn',
    });
    const createGuide = generateQuickStart(template, {
      skillLevel: 'intermediate',
      goal: 'create',
    });
    const experimentGuide = generateQuickStart(template, {
      skillLevel: 'intermediate',
      goal: 'experiment',
    });
    
    expect(learnGuide).toContain('Listen to how');
    expect(createGuide).toContain('Shape the sound');
    expect(experimentGuide).toContain('extreme');
  });
});
