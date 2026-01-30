/**
 * @fileoverview Deck Templates for Theory Workflows (C101–C110)
 *
 * Defines recommended deck templates for different theory-driven workflows.
 * Each template specifies:
 * - Which theory cards to include
 * - Recommended order
 * - Which board types the template fits
 * - Prolog-side metadata for template recommendations
 *
 * Templates are "suggestions" — users can customize after creation.
 * The Prolog KB can recommend templates via recommend_template/3.
 *
 * ID Convention:
 * - Builtin templates use 'template:name' format (canonical)
 * - Custom/extension templates must use 'namespace:name' format
 *
 * @module @cardplay/ai/theory/deck-templates
 */

import type { CultureTag, StyleTag, MusicSpec } from './music-spec';
import { validateId, isNamespacedId } from '../../canon/id-validation';
import { validateTheoryCardIds } from './theory-card-registry';

// ============================================================================
// DECK TEMPLATE TYPES
// ============================================================================

/**
 * A deck template defines a recommended combination of cards.
 */
export interface DeckTemplate {
  /** Unique template ID */
  readonly id: string;
  /** Display name */
  readonly displayName: string;
  /** Description */
  readonly description: string;
  /** Template category */
  readonly category: 'theory' | 'phrase' | 'harmony' | 'arranger' | 'tracker' | 'world';
  /** Board types this template is designed for */
  readonly boardTypes: readonly ('arranger' | 'tracker' | 'notation' | 'phrase' | 'harmony')[];
  /** Culture affinities (which cultures this template serves) */
  readonly cultures: readonly CultureTag[];
  /** Style affinities */
  readonly styles: readonly StyleTag[];
  /** Ordered list of theory card IDs to include */
  readonly cardIds: readonly string[];
  /** Slots: named positions in the template that can hold cards */
  readonly slots: readonly DeckTemplateSlot[];
  /** Priority for recommendation ranking (higher = more likely to recommend) */
  readonly priority: number;
}

/**
 * A slot within a deck template.
 */
export interface DeckTemplateSlot {
  /** Slot position (0-based) */
  readonly position: number;
  /** Slot label */
  readonly label: string;
  /** The card ID that fills this slot */
  readonly cardId: string;
  /** Whether this slot is required or optional */
  readonly required: boolean;
  /** Alternative card IDs that could fill this slot */
  readonly alternatives?: readonly string[];
}

// ============================================================================
// C101 — THEORY DECK TEMPLATE
// ============================================================================

export const THEORY_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:theory',
  displayName: 'Theory Deck',
  description: 'Core theory tools: tonality model, meter/accent, grouping, and style constraints',
  category: 'theory',
  boardTypes: ['arranger', 'tracker', 'notation', 'phrase', 'harmony'],
  cultures: ['western', 'hybrid'],
  styles: ['galant', 'baroque', 'classical', 'romantic', 'cinematic', 'trailer', 'underscore', 'pop', 'jazz', 'custom'],
  cardIds: [
    'theory:tonality_model',
    'theory:meter_accent',
    'theory:grouping',
    'theory:schema',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Tonality Model', cardId: 'theory:tonality_model', required: true },
    { position: 1, label: 'Meter & Accent', cardId: 'theory:meter_accent', required: true },
    { position: 2, label: 'Phrase Grouping', cardId: 'theory:grouping', required: false,
      alternatives: ['theory:schema'] },
    { position: 3, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 90,
};

// ============================================================================
// C102 — PHRASE DECK TEMPLATE
// ============================================================================

export const PHRASE_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:phrase',
  displayName: 'Phrase Deck',
  description: 'Phrase browsing, generation, variation, and schema-driven composition',
  category: 'phrase',
  boardTypes: ['phrase', 'tracker', 'notation'],
  cultures: ['western', 'hybrid'],
  styles: ['galant', 'classical', 'romantic', 'cinematic', 'pop', 'custom'],
  cardIds: [
    'theory:schema',
    'theory:grouping',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Schema', cardId: 'theory:schema', required: true,
      alternatives: ['theory:constraint_pack'] },
    { position: 1, label: 'Grouping', cardId: 'theory:grouping', required: false },
    { position: 2, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 80,
};

// ============================================================================
// C103 — HARMONY DECK TEMPLATE
// ============================================================================

export const HARMONY_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:harmony',
  displayName: 'Harmony Deck',
  description: 'Harmony exploration, tonality analysis, and cadence tools',
  category: 'harmony',
  boardTypes: ['harmony', 'arranger', 'notation'],
  cultures: ['western', 'hybrid'],
  styles: ['galant', 'baroque', 'classical', 'romantic', 'cinematic', 'jazz', 'custom'],
  cardIds: [
    'theory:tonality_model',
    'theory:schema',
    'theory:meter_accent',
  ],
  slots: [
    { position: 0, label: 'Tonality Model', cardId: 'theory:tonality_model', required: true },
    { position: 1, label: 'Schema', cardId: 'theory:schema', required: false },
    { position: 2, label: 'Meter & Accent', cardId: 'theory:meter_accent', required: false },
  ],
  priority: 75,
};

// ============================================================================
// C104 — ARRANGER DECK TEMPLATE
// ============================================================================

export const ARRANGER_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:arranger',
  displayName: 'Arranger Deck',
  description: 'Arranger-focused: film scoring, orchestration, and style constraints',
  category: 'arranger',
  boardTypes: ['arranger'],
  cultures: ['western', 'hybrid'],
  styles: ['cinematic', 'trailer', 'underscore', 'custom'],
  cardIds: [
    'theory:film_scoring',
    'theory:tonality_model',
    'theory:meter_accent',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Film Scoring', cardId: 'theory:film_scoring', required: true },
    { position: 1, label: 'Tonality', cardId: 'theory:tonality_model', required: false },
    { position: 2, label: 'Meter', cardId: 'theory:meter_accent', required: false },
    { position: 3, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 85,
};

// ============================================================================
// C105 — TRACKER ASSISTANCE DECK TEMPLATE
// ============================================================================

export const TRACKER_ASSISTANCE_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:tracker_assistance',
  displayName: 'Tracker Assistance Deck',
  description: 'Tracker-focused: phrase insertion, GTTM grouping, pattern roles',
  category: 'tracker',
  boardTypes: ['tracker'],
  cultures: ['western', 'hybrid'],
  styles: ['edm', 'pop', 'cinematic', 'custom'],
  cardIds: [
    'theory:grouping',
    'theory:meter_accent',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Grouping', cardId: 'theory:grouping', required: true },
    { position: 1, label: 'Meter', cardId: 'theory:meter_accent', required: true },
    { position: 2, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 70,
};

// ============================================================================
// C106 — WORLD MUSIC DECK TEMPLATE
// ============================================================================

export const CARNATIC_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:carnatic',
  displayName: 'Carnatic Deck',
  description: 'Carnatic raga, tala, gamaka density, and related constraints',
  category: 'world',
  boardTypes: ['tracker', 'phrase', 'notation'],
  cultures: ['carnatic', 'hybrid'],
  styles: ['custom'],
  cardIds: [
    'theory:carnatic_raga_tala',
    'theory:meter_accent',
  ],
  slots: [
    { position: 0, label: 'Raga/Tala', cardId: 'theory:carnatic_raga_tala', required: true },
    { position: 1, label: 'Meter', cardId: 'theory:meter_accent', required: false },
  ],
  priority: 85,
};

export const CELTIC_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:celtic',
  displayName: 'Celtic Deck',
  description: 'Celtic tune type, ornaments, drone, and set building',
  category: 'world',
  boardTypes: ['tracker', 'phrase', 'notation'],
  cultures: ['celtic', 'hybrid'],
  styles: ['custom'],
  cardIds: [
    'theory:celtic_tune',
    'theory:meter_accent',
    'theory:grouping',
  ],
  slots: [
    { position: 0, label: 'Tune Type', cardId: 'theory:celtic_tune', required: true },
    { position: 1, label: 'Meter', cardId: 'theory:meter_accent', required: false },
    { position: 2, label: 'Grouping', cardId: 'theory:grouping', required: false },
  ],
  priority: 85,
};

export const CHINESE_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:chinese',
  displayName: 'Chinese Deck',
  description: 'Chinese pentatonic modes, heterophony, and ornament style',
  category: 'world',
  boardTypes: ['tracker', 'phrase', 'notation', 'arranger'],
  cultures: ['chinese', 'hybrid'],
  styles: ['custom'],
  cardIds: [
    'theory:chinese_mode',
    'theory:meter_accent',
  ],
  slots: [
    { position: 0, label: 'Mode', cardId: 'theory:chinese_mode', required: true },
    { position: 1, label: 'Meter', cardId: 'theory:meter_accent', required: false },
  ],
  priority: 85,
};

export const WORLD_MUSIC_DECK_TEMPLATE: DeckTemplate = {
  id: 'template:world_music',
  displayName: 'World Music Deck',
  description: 'Combined world music deck with Carnatic, Celtic, and Chinese cards',
  category: 'world',
  boardTypes: ['tracker', 'phrase', 'notation', 'arranger'],
  cultures: ['carnatic', 'celtic', 'chinese', 'hybrid'],
  styles: ['custom'],
  cardIds: [
    'theory:carnatic_raga_tala',
    'theory:celtic_tune',
    'theory:chinese_mode',
    'theory:meter_accent',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Carnatic', cardId: 'theory:carnatic_raga_tala', required: false },
    { position: 1, label: 'Celtic', cardId: 'theory:celtic_tune', required: false },
    { position: 2, label: 'Chinese', cardId: 'theory:chinese_mode', required: false },
    { position: 3, label: 'Meter', cardId: 'theory:meter_accent', required: false },
    { position: 4, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 60,
};

// ============================================================================
// C349 — GALANT WORKSPACE BOARD TEMPLATE
// ============================================================================

export const GALANT_BOARD_TEMPLATE: DeckTemplate = {
  id: 'template:galant_board',
  displayName: 'Galant Workspace',
  description: 'Full galant composition workspace: notation, schema browser, harmony explorer, phrase generation',
  category: 'phrase',
  boardTypes: ['notation', 'phrase', 'harmony'],
  cultures: ['western'],
  styles: ['galant', 'baroque', 'classical'],
  cardIds: [
    'schema:browser',
    'schema:to_chords',
    'schema:to_bass',
    'schema:to_melody',
    'schema:variation',
    'schema:constraint',
    'theory:grouping',
    'theory:tonality_model',
  ],
  slots: [
    { position: 0, label: 'Schema Browser', cardId: 'schema:browser', required: true },
    { position: 1, label: 'Schema to Chords', cardId: 'schema:to_chords', required: true },
    { position: 2, label: 'Schema to Melody', cardId: 'schema:to_melody', required: true },
    { position: 3, label: 'Variation', cardId: 'schema:variation', required: false, 
      alternatives: ['schema:to_bass'] },
    { position: 4, label: 'Constraints', cardId: 'schema:constraint', required: false },
    { position: 5, label: 'Grouping', cardId: 'theory:grouping', required: false },
    { position: 6, label: 'Tonality', cardId: 'theory:tonality_model', required: false },
  ],
  priority: 75,
};

// ============================================================================
// C470 — FILM BOARD TEMPLATE
// ============================================================================

export const FILM_BOARD_TEMPLATE: DeckTemplate = {
  id: 'template:film_board',
  displayName: 'Film Scoring Board',
  description: 'Film/media scoring workspace: arranger, theory, leitmotif tracking, mixer integration',
  category: 'arranger',
  boardTypes: ['arranger', 'tracker', 'notation'],
  cultures: ['western', 'hybrid'],
  styles: ['cinematic', 'trailer', 'underscore'],
  cardIds: [
    'theory:film_scoring',
    'theory:trailer_build',
    'theory:leitmotif_library',
    'theory:leitmotif_matcher',
    'theory:tonality_model',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Film Scoring', cardId: 'theory:film_scoring', required: true },
    { position: 1, label: 'Trailer Build', cardId: 'theory:trailer_build', required: false,
      alternatives: ['theory:constraint_pack'] },
    { position: 2, label: 'Leitmotif Library', cardId: 'theory:leitmotif_library', required: false },
    { position: 3, label: 'Leitmotif Matcher', cardId: 'theory:leitmotif_matcher', required: false },
    { position: 4, label: 'Tonality Model', cardId: 'theory:tonality_model', required: true },
    { position: 5, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 85,
};

// ============================================================================
// C640 — CARNATIC BOARD TEMPLATE
// ============================================================================

export const CARNATIC_BOARD_TEMPLATE: DeckTemplate = {
  id: 'template:carnatic_board',
  displayName: 'Carnatic Board',
  description: 'Carnatic music workspace: tracker with tala grid, drone, mridangam patterns, phrase generator',
  category: 'tracker',
  boardTypes: ['tracker', 'notation'],
  cultures: ['carnatic'],
  styles: ['classical', 'custom', 'custom'],
  cardIds: [
    'theory:carnatic_raga_tala',
    'theory:drone',
    'theory:mridangam_pattern',
    'theory:korvai_generator',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Raga/Tala', cardId: 'theory:carnatic_raga_tala', required: true },
    { position: 1, label: 'Drone', cardId: 'theory:drone', required: true },
    { position: 2, label: 'Mridangam', cardId: 'theory:mridangam_pattern', required: false },
    { position: 3, label: 'Korvai', cardId: 'theory:korvai_generator', required: false },
    { position: 4, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 80,
};

// ============================================================================
// C788 — CELTIC BOARD TEMPLATE
// ============================================================================

export const CELTIC_BOARD_TEMPLATE: DeckTemplate = {
  id: 'template:celtic_board',
  displayName: 'Celtic Board',
  description: 'Celtic/Irish music workspace: tune type, ornament generator, bodhran, drone',
  category: 'tracker',
  boardTypes: ['tracker', 'notation'],
  cultures: ['celtic'],
  styles: ['custom', 'custom', 'custom'],
  cardIds: [
    'theory:celtic_tune',
    'theory:ornament_generator',
    'theory:bodhran',
    'theory:drone',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Tune Type', cardId: 'theory:celtic_tune', required: true },
    { position: 1, label: 'Ornaments', cardId: 'theory:ornament_generator', required: false },
    { position: 2, label: 'Bodhrán', cardId: 'theory:bodhran', required: false },
    { position: 3, label: 'Drone', cardId: 'theory:drone', required: false },
    { position: 4, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 75,
};

// ============================================================================
// C888 — CHINESE BOARD TEMPLATE
// ============================================================================

export const CHINESE_BOARD_TEMPLATE: DeckTemplate = {
  id: 'template:chinese_board',
  displayName: 'Chinese Board',
  description: 'Chinese traditional music workspace: mode, heterophony, guzheng, erhu ornaments',
  category: 'tracker',
  boardTypes: ['tracker', 'notation'],
  cultures: ['chinese'],
  styles: ['custom', 'classical', 'custom'],
  cardIds: [
    'theory:chinese_mode',
    'theory:heterophony',
    'theory:guzheng_gliss',
    'theory:erhu_ornament',
    'theory:constraint_pack',
  ],
  slots: [
    { position: 0, label: 'Mode', cardId: 'theory:chinese_mode', required: true },
    { position: 1, label: 'Heterophony', cardId: 'theory:heterophony', required: false },
    { position: 2, label: 'Guzheng', cardId: 'theory:guzheng_gliss', required: false },
    { position: 3, label: 'Erhu', cardId: 'theory:erhu_ornament', required: false },
    { position: 4, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 75,
};

// ============================================================================
// C1195 — LCC BOARD TEMPLATE
// ============================================================================

export const LCC_BOARD_TEMPLATE: DeckTemplate = {
  id: 'template:lcc_board',
  displayName: 'Lydian Chromatic Board',
  description: 'George Russell\'s LCC workspace: Lydian theory, gravity-based harmony, jazz voicings',
  category: 'harmony',
  boardTypes: ['arranger', 'notation'],
  cultures: ['western', 'hybrid'],
  styles: ['jazz', 'custom', 'custom'],
  cardIds: [
    'theory:lydian_chromatic',
    'theory:tonality_model',
    'theory:constraint_pack',
    'theory:schema',
  ],
  slots: [
    { position: 0, label: 'Lydian Chromatic', cardId: 'theory:lydian_chromatic', required: true },
    { position: 1, label: 'Tonality Model', cardId: 'theory:tonality_model', required: false },
    { position: 2, label: 'Schema', cardId: 'theory:schema', required: false },
    { position: 3, label: 'Presets', cardId: 'theory:constraint_pack', required: false },
  ],
  priority: 70,
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Builtin deck templates (non-extensible).
 */
const BUILTIN_TEMPLATES: readonly DeckTemplate[] = [
  THEORY_DECK_TEMPLATE,
  PHRASE_DECK_TEMPLATE,
  HARMONY_DECK_TEMPLATE,
  ARRANGER_DECK_TEMPLATE,
  TRACKER_ASSISTANCE_DECK_TEMPLATE,
  CARNATIC_DECK_TEMPLATE,
  CELTIC_DECK_TEMPLATE,
  CHINESE_DECK_TEMPLATE,
  WORLD_MUSIC_DECK_TEMPLATE,
  GALANT_BOARD_TEMPLATE,
  FILM_BOARD_TEMPLATE,
  CARNATIC_BOARD_TEMPLATE,
  CELTIC_BOARD_TEMPLATE,
  CHINESE_BOARD_TEMPLATE,
  LCC_BOARD_TEMPLATE,
];

/**
 * Extension template registry (Change 427).
 * Allows packs to register additional DeckTemplate definitions with namespaced IDs.
 */
const extensionTemplates = new Map<string, DeckTemplate>();

/**
 * Register an extension deck template.
 * 
 * Change 427: Implements extension points for deck templates.
 * 
 * @param template - The deck template to register
 * @returns Success or error
 */
export function registerDeckTemplate(template: DeckTemplate): { success: boolean; error?: string } {
  // Validate template ID
  const idValidation = validateTemplateId(template.id, false);
  if (!idValidation.valid) {
    return {
      success: false,
      error: idValidation.error,
    };
  }
  
  // Check for duplicates with builtins
  if (BUILTIN_TEMPLATES.some(t => t.id === template.id)) {
    return {
      success: false,
      error: `Template ID '${template.id}' conflicts with builtin template`,
    };
  }
  
  // Check for duplicate extension registrations
  if (extensionTemplates.has(template.id)) {
    return {
      success: false,
      error: `Template ID '${template.id}' is already registered`,
    };
  }
  
  // Validate card IDs
  try {
    validateTheoryCardIds(template.cardIds);
  } catch (error) {
    return {
      success: false,
      error: `Template '${template.id}' references invalid card IDs: ${error}`,
    };
  }
  
  // Register
  extensionTemplates.set(template.id, template);
  
  return { success: true };
}

/**
 * Unregister an extension deck template.
 */
export function unregisterDeckTemplate(templateId: string): boolean {
  return extensionTemplates.delete(templateId);
}

/**
 * All deck templates (builtins + extensions).
 */
export function getAllDeckTemplates(): DeckTemplate[] {
  return [...BUILTIN_TEMPLATES, ...extensionTemplates.values()];
}

/**
 * Legacy export for compatibility (dynamically includes extensions).
 * @deprecated Use getAllDeckTemplates() instead for clarity.
 */
export const DECK_TEMPLATES: readonly DeckTemplate[] = BUILTIN_TEMPLATES;

// ============================================================================
// VALIDATION (Change 280)
// ============================================================================

/**
 * Validate all builtin deck templates at module load time.
 * Ensures all cardIds reference registered theory cards.
 */
function validateBuiltinTemplates(): void {
  for (const template of BUILTIN_TEMPLATES) {
    try {
      validateTheoryCardIds(template.cardIds);
    } catch (error) {
      console.error(
        `Deck template '${template.id}' references invalid card IDs:`,
        error
      );
      throw error;
    }
  }
}

// Validate builtin templates on module load
validateBuiltinTemplates();

// ============================================================================
// TEMPLATE LOOKUP
// ============================================================================

/**
 * Lookup a deck template by ID.
 */
export function getDeckTemplate(templateId: string): DeckTemplate | undefined {
  // Check builtins first
  const builtin = BUILTIN_TEMPLATES.find(t => t.id === templateId);
  if (builtin) return builtin;
  
  // Check extensions
  return extensionTemplates.get(templateId);
}

/**
 * Get deck templates suitable for a given board type.
 */
export function getTemplatesForBoard(
  boardType: 'arranger' | 'tracker' | 'notation' | 'phrase' | 'harmony'
): DeckTemplate[] {
  return getAllDeckTemplates()
    .filter(t => t.boardTypes.includes(boardType))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get deck templates suitable for a given culture.
 */
export function getTemplatesForCulture(culture: CultureTag): DeckTemplate[] {
  return getAllDeckTemplates()
    .filter(t => t.cultures.includes(culture))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get deck templates suitable for a given style.
 */
export function getTemplatesForStyle(style: StyleTag): DeckTemplate[] {
  return getAllDeckTemplates()
    .filter(t => t.styles.includes(style))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Recommend a deck template based on MusicSpec.
 * Scores templates by culture match, style match, and board type.
 */
export function recommendTemplate(
  spec: MusicSpec,
  boardType: 'arranger' | 'tracker' | 'notation' | 'phrase' | 'harmony'
): DeckTemplate | undefined {
  const candidates = getAllDeckTemplates()
    .filter(t => t.boardTypes.includes(boardType))
    .map(t => {
      let score = t.priority;
      // Boost for culture match
      if (t.cultures.includes(spec.culture)) score += 20;
      // Boost for style match
      if (t.styles.includes(spec.style)) score += 10;
      return { template: t, score };
    })
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.template;
}

// ============================================================================
// TEMPLATE ID VALIDATION
// ============================================================================

/**
 * Validate a deck template's ID.
 * 
 * - Builtin templates (from this module) are allowed to use 'template:name' format
 * - Custom/extension templates must use proper namespaced IDs like 'my-pack:name'
 * 
 * @param templateId - The template ID to validate
 * @param isBuiltin - Whether this is a builtin template (default false)
 * @returns Validation result
 */
export function validateTemplateId(
  templateId: string,
  isBuiltin = false
): { valid: true } | { valid: false; error: string } {
  // Check basic format
  const result = validateId(templateId);
  if (result.valid === false) {
    return result;
  }
  
  // Builtin templates can use template: prefix
  if (templateId.startsWith('template:') && isBuiltin) {
    return { valid: true };
  }
  
  // Non-builtin templates must use namespaced IDs (not template: prefix)
  if (!isBuiltin && !isNamespacedId(templateId)) {
    return {
      valid: false,
      error: `Custom template must use namespaced ID (e.g., 'my-pack:${templateId}')`,
    };
  }
  
  // Non-builtin templates cannot use reserved template: prefix
  if (!isBuiltin && templateId.startsWith('template:')) {
    return {
      valid: false,
      error: `Custom templates cannot use 'template:' prefix. Use 'your-namespace:name' instead.`,
    };
  }
  
  return { valid: true };
}

// ============================================================================
// PROLOG FACT GENERATION (for C865, C866, C867)
// ============================================================================

/**
 * Generate Prolog facts for all deck templates (builtins + extensions).
 * These can be loaded into the Prolog KB for template recommendation queries.
 */
export function generateTemplatePrologFacts(): string[] {
  const facts: string[] = [
    '%% Deck template facts (generated from deck-templates.ts)',
    '%% deck_template(TemplateId, Category).',
    '%% template_slot(TemplateId, Position, CardId).',
    '%% template_board(TemplateId, BoardType).',
    '%% template_culture(TemplateId, Culture).',
    '%% template_style(TemplateId, Style).',
    '%% template_priority(TemplateId, Priority).',
    '',
  ];

  // Generate facts for all templates (builtins + extensions)
  for (const template of getAllDeckTemplates()) {
    const id = template.id.replace('template:', '');
    facts.push(`deck_template(${id}, ${template.category}).`);
    facts.push(`template_priority(${id}, ${template.priority}).`);

    for (const slot of template.slots) {
      const cardAtom = slot.cardId.replace('theory:', '');
      facts.push(`template_slot(${id}, ${slot.position}, ${cardAtom}).`);
    }

    for (const bt of template.boardTypes) {
      facts.push(`template_board(${id}, ${bt}).`);
    }

    for (const culture of template.cultures) {
      facts.push(`template_culture(${id}, ${culture}).`);
    }

    for (const style of template.styles) {
      facts.push(`template_style(${id}, ${style}).`);
    }

    facts.push('');
  }

  // Add recommendation rule
  facts.push('%% recommend_template(+Spec, -TemplateId, -Score)');
  facts.push('recommend_template(music_spec(_, _, _, _, Style, Culture, _), TemplateId, Score) :-');
  facts.push('  deck_template(TemplateId, _),');
  facts.push('  template_priority(TemplateId, BasePriority),');
  facts.push('  ( template_culture(TemplateId, Culture) -> CultureBonus is 20 ; CultureBonus is 0 ),');
  facts.push('  ( template_style(TemplateId, Style) -> StyleBonus is 10 ; StyleBonus is 0 ),');
  facts.push('  Score is BasePriority + CultureBonus + StyleBonus.');
  facts.push('');

  // Add template_fits_board rule
  facts.push('%% template_fits_board(+TemplateId, +BoardType, -Score)');
  facts.push('template_fits_board(TemplateId, BoardType, Score) :-');
  facts.push('  deck_template(TemplateId, _),');
  facts.push('  template_board(TemplateId, BoardType),');
  facts.push('  template_priority(TemplateId, Score).');
  facts.push('');

  return facts;
}
