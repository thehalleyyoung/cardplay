/**
 * @fileoverview Deck Template System.
 * 
 * Provides deck templates for quick setup of common card configurations:
 * - Template definitions
 * - Template browser/search
 * - Template instantiation
 * - Template parameters
 * 
 * @module @cardplay/user-cards/deck-templates
 */

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Deck template category.
 */
export type TemplateCategory =
  | 'synth'
  | 'drums'
  | 'effects'
  | 'mixing'
  | 'midi'
  | 'generative'
  | 'utility'
  | 'custom';

/**
 * Template parameter.
 */
export interface TemplateParam {
  /** Parameter name */
  name: string;
  /** Display label */
  label: string;
  /** Parameter type */
  type: 'number' | 'string' | 'boolean' | 'select' | 'card';
  /** Default value */
  default: unknown;
  /** Description */
  description?: string;
  /** For number: minimum value */
  min?: number;
  /** For number: maximum value */
  max?: number;
  /** For number: step increment */
  step?: number;
  /** For select: options */
  options?: Array<{ value: unknown; label: string }>;
  /** For card: allowed card types */
  cardTypes?: string[];
  /** Required */
  required?: boolean;
}

/**
 * Template card slot.
 */
export interface TemplateSlot {
  /** Slot ID */
  id: string;
  /** Slot label */
  label: string;
  /** Default card ID to use */
  defaultCard?: string;
  /** Allowed card categories */
  allowedCategories?: string[];
  /** Can be empty */
  optional?: boolean;
  /** Position in deck */
  position: { x: number; y: number };
}

/**
 * Template connection.
 */
export interface TemplateConnection {
  /** Source slot ID */
  from: string;
  /** Source port name */
  fromPort: string;
  /** Destination slot ID */
  to: string;
  /** Destination port name */
  toPort: string;
}

/**
 * Deck template definition.
 */
export interface DeckTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template category */
  category: TemplateCategory;
  /** Description */
  description: string;
  /** Version */
  version: string;
  /** Author */
  author?: string;
  /** Tags for search */
  tags: string[];
  /** Template parameters */
  params: TemplateParam[];
  /** Card slots */
  slots: TemplateSlot[];
  /** Connections between slots */
  connections: TemplateConnection[];
  /** Default parameter values for cards */
  cardParams?: Record<string, Record<string, unknown>>;
  /** Preview image URL */
  previewImage?: string;
  /** Audio demo URL */
  audioDemo?: string;
}

/**
 * Instantiated deck from template.
 */
export interface InstantiatedDeck {
  /** Deck ID */
  id: string;
  /** Source template ID */
  templateId: string;
  /** Template parameters used */
  params: Record<string, unknown>;
  /** Card instances */
  cards: Array<{
    slotId: string;
    cardId: string;
    params: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  /** Connections */
  connections: TemplateConnection[];
}

// ============================================================================
// BUILT-IN TEMPLATES
// ============================================================================

/**
 * Basic subtractive synth template.
 */
export const SubtractiveSynthTemplate: DeckTemplate = {
  id: 'builtin.synth.subtractive',
  name: 'Subtractive Synth',
  category: 'synth',
  description: 'Classic subtractive synthesizer with oscillator, filter, and envelope',
  version: '1.0.0',
  tags: ['synth', 'subtractive', 'classic', 'beginner'],
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
        { value: 16, label: '16 Voices' },
      ],
    },
    {
      name: 'oscType',
      label: 'Oscillator Type',
      type: 'select',
      default: 'saw',
      options: [
        { value: 'sine', label: 'Sine' },
        { value: 'saw', label: 'Sawtooth' },
        { value: 'square', label: 'Square' },
        { value: 'triangle', label: 'Triangle' },
      ],
    },
    {
      name: 'filterType',
      label: 'Filter Type',
      type: 'select',
      default: 'lowpass',
      options: [
        { value: 'lowpass', label: 'Low Pass' },
        { value: 'highpass', label: 'High Pass' },
        { value: 'bandpass', label: 'Band Pass' },
      ],
    },
  ],
  slots: [
    { id: 'midi', label: 'MIDI Input', position: { x: 0, y: 0 }, optional: true },
    { id: 'osc', label: 'Oscillator', defaultCard: 'gen.oscillator', position: { x: 1, y: 0 } },
    { id: 'filter', label: 'Filter', defaultCard: 'fx.filter', position: { x: 2, y: 0 } },
    { id: 'env', label: 'Envelope', defaultCard: 'gen.adsr', position: { x: 1, y: 1 } },
    { id: 'output', label: 'Output', position: { x: 3, y: 0 } },
  ],
  connections: [
    { from: 'midi', fromPort: 'note', to: 'osc', toPort: 'freq' },
    { from: 'midi', fromPort: 'gate', to: 'env', toPort: 'gate' },
    { from: 'osc', fromPort: 'out', to: 'filter', toPort: 'in' },
    { from: 'env', fromPort: 'out', to: 'filter', toPort: 'cutoff' },
    { from: 'filter', fromPort: 'out', to: 'output', toPort: 'in' },
  ],
};

/**
 * Drum machine template.
 */
export const DrumMachineTemplate: DeckTemplate = {
  id: 'builtin.drums.machine',
  name: 'Drum Machine',
  category: 'drums',
  description: 'Classic drum machine with kick, snare, hi-hat, and sequencer',
  version: '1.0.0',
  tags: ['drums', 'beats', 'sequencer', 'rhythm'],
  params: [
    {
      name: 'steps',
      label: 'Steps',
      type: 'select',
      default: 16,
      options: [
        { value: 8, label: '8 Steps' },
        { value: 16, label: '16 Steps' },
        { value: 32, label: '32 Steps' },
      ],
    },
    {
      name: 'swing',
      label: 'Swing',
      type: 'number',
      default: 0,
      min: 0,
      max: 100,
      step: 1,
    },
  ],
  slots: [
    { id: 'seq', label: 'Sequencer', defaultCard: 'gen.sequencer', position: { x: 0, y: 0 } },
    { id: 'kick', label: 'Kick', defaultCard: 'gen.kick', position: { x: 1, y: 0 } },
    { id: 'snare', label: 'Snare', defaultCard: 'gen.snare', position: { x: 1, y: 1 } },
    { id: 'hihat', label: 'Hi-Hat', defaultCard: 'gen.hihat', position: { x: 1, y: 2 } },
    { id: 'mixer', label: 'Mixer', defaultCard: 'util.mixer', position: { x: 2, y: 1 } },
    { id: 'output', label: 'Output', position: { x: 3, y: 1 } },
  ],
  connections: [
    { from: 'seq', fromPort: 'kick', to: 'kick', toPort: 'trigger' },
    { from: 'seq', fromPort: 'snare', to: 'snare', toPort: 'trigger' },
    { from: 'seq', fromPort: 'hihat', to: 'hihat', toPort: 'trigger' },
    { from: 'kick', fromPort: 'out', to: 'mixer', toPort: 'in1' },
    { from: 'snare', fromPort: 'out', to: 'mixer', toPort: 'in2' },
    { from: 'hihat', fromPort: 'out', to: 'mixer', toPort: 'in3' },
    { from: 'mixer', fromPort: 'out', to: 'output', toPort: 'in' },
  ],
};

/**
 * Effect chain template.
 */
export const EffectChainTemplate: DeckTemplate = {
  id: 'builtin.effects.chain',
  name: 'Effect Chain',
  category: 'effects',
  description: 'Customizable effect chain with 4 slots',
  version: '1.0.0',
  tags: ['effects', 'chain', 'processing'],
  params: [
    {
      name: 'wetDry',
      label: 'Wet/Dry',
      type: 'number',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
  slots: [
    { id: 'input', label: 'Input', position: { x: 0, y: 0 } },
    { id: 'fx1', label: 'Effect 1', allowedCategories: ['effects'], optional: true, position: { x: 1, y: 0 } },
    { id: 'fx2', label: 'Effect 2', allowedCategories: ['effects'], optional: true, position: { x: 2, y: 0 } },
    { id: 'fx3', label: 'Effect 3', allowedCategories: ['effects'], optional: true, position: { x: 3, y: 0 } },
    { id: 'fx4', label: 'Effect 4', allowedCategories: ['effects'], optional: true, position: { x: 4, y: 0 } },
    { id: 'output', label: 'Output', position: { x: 5, y: 0 } },
  ],
  connections: [
    { from: 'input', fromPort: 'out', to: 'fx1', toPort: 'in' },
    { from: 'fx1', fromPort: 'out', to: 'fx2', toPort: 'in' },
    { from: 'fx2', fromPort: 'out', to: 'fx3', toPort: 'in' },
    { from: 'fx3', fromPort: 'out', to: 'fx4', toPort: 'in' },
    { from: 'fx4', fromPort: 'out', to: 'output', toPort: 'in' },
  ],
};

/**
 * MIDI processor template.
 */
export const MIDIProcessorTemplate: DeckTemplate = {
  id: 'builtin.midi.processor',
  name: 'MIDI Processor',
  category: 'midi',
  description: 'Process and transform MIDI data',
  version: '1.0.0',
  tags: ['midi', 'processor', 'transform'],
  params: [
    {
      name: 'transpose',
      label: 'Transpose',
      type: 'number',
      default: 0,
      min: -24,
      max: 24,
      step: 1,
    },
    {
      name: 'velocityScale',
      label: 'Velocity Scale',
      type: 'number',
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
    },
  ],
  slots: [
    { id: 'midiIn', label: 'MIDI In', position: { x: 0, y: 0 } },
    { id: 'transpose', label: 'Transpose', defaultCard: 'midi.transpose', position: { x: 1, y: 0 } },
    { id: 'velocity', label: 'Velocity', defaultCard: 'midi.velocity', position: { x: 2, y: 0 } },
    { id: 'arpeggio', label: 'Arpeggiator', defaultCard: 'midi.arpeggiator', optional: true, position: { x: 3, y: 0 } },
    { id: 'midiOut', label: 'MIDI Out', position: { x: 4, y: 0 } },
  ],
  connections: [
    { from: 'midiIn', fromPort: 'midi', to: 'transpose', toPort: 'midi' },
    { from: 'transpose', fromPort: 'midi', to: 'velocity', toPort: 'midi' },
    { from: 'velocity', fromPort: 'midi', to: 'arpeggio', toPort: 'midi' },
    { from: 'arpeggio', fromPort: 'midi', to: 'midiOut', toPort: 'midi' },
  ],
};

/**
 * All built-in templates.
 */
export const BUILTIN_TEMPLATES: DeckTemplate[] = [
  SubtractiveSynthTemplate,
  DrumMachineTemplate,
  EffectChainTemplate,
  MIDIProcessorTemplate,
];

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Template registry.
 */
export class TemplateRegistry {
  private templates: Map<string, DeckTemplate> = new Map();
  
  constructor() {
    // Register built-in templates
    for (const template of BUILTIN_TEMPLATES) {
      this.register(template);
    }
  }
  
  /**
   * Registers a template.
   */
  register(template: DeckTemplate): void {
    this.templates.set(template.id, template);
  }
  
  /**
   * Unregisters a template.
   */
  unregister(id: string): boolean {
    return this.templates.delete(id);
  }
  
  /**
   * Gets a template by ID.
   */
  get(id: string): DeckTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Lists all templates.
   */
  list(): DeckTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Searches templates.
   */
  search(options: {
    query?: string;
    category?: TemplateCategory;
    tags?: string[];
  } = {}): DeckTemplate[] {
    let results = this.list();
    
    if (options.category) {
      results = results.filter(t => t.category === options.category);
    }
    
    if (options.tags && options.tags.length > 0) {
      results = results.filter(t => 
        options.tags!.some(tag => t.tags.includes(tag))
      );
    }
    
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.includes(query))
      );
    }
    
    return results;
  }
  
  /**
   * Gets templates by category.
   */
  byCategory(category: TemplateCategory): DeckTemplate[] {
    return this.list().filter(t => t.category === category);
  }
  
  /**
   * Gets all categories with template counts.
   */
  categories(): Map<TemplateCategory, number> {
    const counts = new Map<TemplateCategory, number>();
    
    for (const template of this.templates.values()) {
      const current = counts.get(template.category) ?? 0;
      counts.set(template.category, current + 1);
    }
    
    return counts;
  }
}

// ============================================================================
// TEMPLATE INSTANTIATION
// ============================================================================

/**
 * Instantiation options.
 */
export interface InstantiateOptions {
  /** ID for the new deck */
  deckId?: string;
  /** Parameter values */
  params?: Record<string, unknown>;
  /** Slot overrides (different cards) */
  slotOverrides?: Record<string, string>;
  /** Card parameter overrides */
  cardParamOverrides?: Record<string, Record<string, unknown>>;
}

/**
 * Instantiates a deck from a template.
 */
export function instantiateTemplate(
  template: DeckTemplate,
  options: InstantiateOptions = {}
): InstantiatedDeck {
  const deckId = options.deckId ?? `deck_${Date.now()}`;
  
  // Merge parameters with defaults
  const params: Record<string, unknown> = {};
  for (const param of template.params) {
    params[param.name] = options.params?.[param.name] ?? param.default;
  }
  
  // Create card instances
  const cards = template.slots.map(slot => {
    const cardId = options.slotOverrides?.[slot.id] ?? slot.defaultCard ?? '';
    
    // Merge card params
    const cardParams: Record<string, unknown> = {
      ...(template.cardParams?.[slot.id] ?? {}),
      ...(options.cardParamOverrides?.[slot.id] ?? {}),
    };
    
    return {
      slotId: slot.id,
      cardId,
      params: cardParams,
      position: slot.position,
    };
  });
  
  // Filter connections for non-empty slots
  const activeSlotIds = new Set(cards.filter(c => c.cardId).map(c => c.slotId));
  const connections = template.connections.filter(conn =>
    activeSlotIds.has(conn.from) && activeSlotIds.has(conn.to)
  );
  
  return {
    id: deckId,
    templateId: template.id,
    params,
    cards,
    connections,
  };
}

/**
 * Validates template parameters.
 */
export function validateTemplateParams(
  template: DeckTemplate,
  params: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const param of template.params) {
    const value = params[param.name];
    
    // Check required
    if (param.required && value === undefined) {
      errors.push(`Missing required parameter: ${param.name}`);
      continue;
    }
    
    if (value === undefined) continue;
    
    // Check type
    switch (param.type) {
      case 'number':
        if (typeof value !== 'number') {
          errors.push(`${param.name} must be a number`);
        } else {
          if (param.min !== undefined && value < param.min) {
            errors.push(`${param.name} must be >= ${param.min}`);
          }
          if (param.max !== undefined && value > param.max) {
            errors.push(`${param.name} must be <= ${param.max}`);
          }
        }
        break;
        
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${param.name} must be a string`);
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${param.name} must be a boolean`);
        }
        break;
        
      case 'select':
        if (param.options && !param.options.some(o => o.value === value)) {
          errors.push(`${param.name} has invalid value: ${value}`);
        }
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// TEMPLATE EXPORT/IMPORT
// ============================================================================

/**
 * Exports a template to JSON.
 */
export function exportTemplate(template: DeckTemplate): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Imports a template from JSON.
 */
export function importTemplate(json: string): DeckTemplate {
  const template = JSON.parse(json) as DeckTemplate;
  
  // Validate structure
  if (!template.id || !template.name || !template.category) {
    throw new Error('Invalid template: missing required fields');
  }
  
  if (!template.slots || !Array.isArray(template.slots)) {
    throw new Error('Invalid template: missing slots');
  }
  
  if (!template.connections || !Array.isArray(template.connections)) {
    throw new Error('Invalid template: missing connections');
  }
  
  return template;
}

/**
 * Exports an instantiated deck back to a template.
 */
export function deckToTemplate(
  deck: InstantiatedDeck,
  options: {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
  }
): DeckTemplate {
  return {
    id: options.id,
    name: options.name,
    description: options.description,
    category: options.category,
    version: '1.0.0',
    tags: [],
    params: [],
    slots: deck.cards.map(card => ({
      id: card.slotId,
      label: card.slotId,
      defaultCard: card.cardId,
      position: card.position,
    })),
    connections: deck.connections,
    cardParams: Object.fromEntries(
      deck.cards.map(c => [c.slotId, c.params])
    ),
  };
}

// ============================================================================
// SINGLETON REGISTRY
// ============================================================================

let defaultRegistry: TemplateRegistry | null = null;

/**
 * Gets the default template registry.
 */
export function getTemplateRegistry(): TemplateRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new TemplateRegistry();
  }
  return defaultRegistry;
}

/**
 * Registers a template in the default registry.
 */
export function registerTemplate(template: DeckTemplate): void {
  getTemplateRegistry().register(template);
}

/**
 * Searches templates in the default registry.
 */
export function searchTemplates(options?: {
  query?: string;
  category?: TemplateCategory;
  tags?: string[];
}): DeckTemplate[] {
  return getTemplateRegistry().search(options);
}
