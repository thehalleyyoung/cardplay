/**
 * GOFAI Pipeline — UI Copy Guidelines for Entity Bindings
 *
 * Specifies how resolved entity bindings are displayed to users in the
 * preview-first UX. Every binding must be shown clearly so the user
 * can verify and correct it before execution.
 *
 * Display format: "'raw text' → Resolved Entity (context)"
 * Example: "'that chorus' → Chorus 2 (bars 49–65)"
 *
 * This module defines:
 *   1. Display templates for each entity type
 *   2. Copy guidelines (tone, length, clarity rules)
 *   3. Error message templates for failed resolutions
 *   4. Interactive correction affordances
 *
 * @module gofai/pipeline/entity-binding-ui
 * @see gofai_goalA.md Step 075
 * @see preview-first-ux.ts for the preview display framework
 */

import type { EntityType } from '../canon/types';

// =============================================================================
// DISPLAY TEMPLATE TYPES
// =============================================================================

/**
 * A template for displaying a resolved binding.
 */
export interface BindingDisplayTemplate {
  readonly entityType: EntityType;
  readonly format: string;
  readonly includeContext: boolean;
  readonly contextFields: readonly string[];
  readonly maxLength: number;
  readonly truncationStrategy: 'ellipsis' | 'abbreviate' | 'drop_context';
  readonly examples: readonly BindingDisplayExample[];
}

/**
 * An example of a binding display.
 */
export interface BindingDisplayExample {
  readonly rawText: string;
  readonly resolvedName: string;
  readonly context: string;
  readonly fullDisplay: string;
  readonly shortDisplay: string;
}

// =============================================================================
// BINDING DISPLAY TEMPLATES
// =============================================================================

/**
 * Display templates for each entity type.
 */
export const BINDING_DISPLAY_TEMPLATES: readonly BindingDisplayTemplate[] = [
  {
    entityType: 'section',
    format: "'{raw}' → {name} ({bars})",
    includeContext: true,
    contextFields: ['startBar', 'endBar', 'instanceNumber'],
    maxLength: 80,
    truncationStrategy: 'drop_context',
    examples: [
      {
        rawText: 'that chorus',
        resolvedName: 'Chorus 2',
        context: 'bars 49–65',
        fullDisplay: "'that chorus' → Chorus 2 (bars 49–65)",
        shortDisplay: "'that chorus' → Chorus 2",
      },
      {
        rawText: 'the verse',
        resolvedName: 'Verse 1',
        context: 'bars 1–16',
        fullDisplay: "'the verse' → Verse 1 (bars 1–16)",
        shortDisplay: "'the verse' → Verse 1",
      },
      {
        rawText: 'the last bridge',
        resolvedName: 'Bridge 3',
        context: 'bars 97–112',
        fullDisplay: "'the last bridge' → Bridge 3 (bars 97–112)",
        shortDisplay: "'the last bridge' → Bridge 3",
      },
      {
        rawText: 'this section',
        resolvedName: 'Intro',
        context: 'bars 1–8, selected',
        fullDisplay: "'this section' → Intro (bars 1–8) [selected]",
        shortDisplay: "'this section' → Intro [selected]",
      },
    ],
  },
  {
    entityType: 'layer',
    format: "'{raw}' → {name} layer",
    includeContext: true,
    contextFields: ['layerType', 'instanceNumber'],
    maxLength: 60,
    truncationStrategy: 'abbreviate',
    examples: [
      {
        rawText: 'the drums',
        resolvedName: 'Drums',
        context: 'layer',
        fullDisplay: "'the drums' → Drums layer",
        shortDisplay: "'the drums' → Drums",
      },
      {
        rawText: 'bass',
        resolvedName: 'Bass',
        context: 'layer',
        fullDisplay: "'bass' → Bass layer",
        shortDisplay: "'bass' → Bass",
      },
      {
        rawText: 'the second guitar',
        resolvedName: 'Guitar 2',
        context: 'layer',
        fullDisplay: "'the second guitar' → Guitar 2 layer",
        shortDisplay: "'the second guitar' → Guitar 2",
      },
    ],
  },
  {
    entityType: 'track',
    format: "'{raw}' → {name} track",
    includeContext: true,
    contextFields: ['layerType'],
    maxLength: 60,
    truncationStrategy: 'abbreviate',
    examples: [
      {
        rawText: 'the vocal track',
        resolvedName: 'Vocals',
        context: 'track',
        fullDisplay: "'the vocal track' → Vocals track",
        shortDisplay: "'the vocal track' → Vocals",
      },
    ],
  },
  {
    entityType: 'card',
    format: "'{raw}' → {name} on {layer}",
    includeContext: true,
    contextFields: ['cardType', 'layerName'],
    maxLength: 80,
    truncationStrategy: 'drop_context',
    examples: [
      {
        rawText: 'the piano',
        resolvedName: 'Grand Piano',
        context: 'on Keys deck',
        fullDisplay: "'the piano' → Grand Piano on Keys deck",
        shortDisplay: "'the piano' → Grand Piano",
      },
      {
        rawText: 'the reverb on the drums',
        resolvedName: 'Room Reverb',
        context: 'on Drums deck',
        fullDisplay: "'the reverb on the drums' → Room Reverb on Drums deck",
        shortDisplay: "'the reverb on the drums' → Room Reverb",
      },
    ],
  },
  {
    entityType: 'param',
    format: "'{raw}' → {name} ({value})",
    includeContext: true,
    contextFields: ['paramType', 'currentValue', 'cardName'],
    maxLength: 80,
    truncationStrategy: 'drop_context',
    examples: [
      {
        rawText: 'the tempo',
        resolvedName: 'Tempo',
        context: '120 BPM',
        fullDisplay: "'the tempo' → Tempo (120 BPM)",
        shortDisplay: "'the tempo' → Tempo",
      },
      {
        rawText: 'the reverb decay',
        resolvedName: 'Decay on Room Reverb',
        context: '2.5s',
        fullDisplay: "'the reverb decay' → Decay on Room Reverb (2.5s)",
        shortDisplay: "'the reverb decay' → Decay",
      },
    ],
  },
  {
    entityType: 'range',
    format: "'{raw}' → bars {start}–{end}",
    includeContext: true,
    contextFields: ['startBar', 'endBar'],
    maxLength: 60,
    truncationStrategy: 'abbreviate',
    examples: [
      {
        rawText: 'bars 33 to 40',
        resolvedName: 'bars 33–40',
        context: '8 bars',
        fullDisplay: "'bars 33 to 40' → bars 33–40",
        shortDisplay: "bars 33–40",
      },
      {
        rawText: 'the first 8 bars',
        resolvedName: 'bars 1–8',
        context: 'Intro',
        fullDisplay: "'the first 8 bars' → bars 1–8 (Intro)",
        shortDisplay: "'the first 8 bars' → bars 1–8",
      },
    ],
  },
  {
    entityType: 'event',
    format: "'{raw}' → {count} {kind} events",
    includeContext: true,
    contextFields: ['matchedCount', 'eventKind', 'layerName'],
    maxLength: 80,
    truncationStrategy: 'drop_context',
    examples: [
      {
        rawText: 'the high notes',
        resolvedName: '12 note events',
        context: 'in Chorus 2, MIDI ≥ 84',
        fullDisplay: "'the high notes' → 12 note events (in Chorus 2, MIDI ≥ 84)",
        shortDisplay: "'the high notes' → 12 events",
      },
      {
        rawText: 'the downbeats',
        resolvedName: '32 events',
        context: 'on beat 1 of each bar',
        fullDisplay: "'the downbeats' → 32 events (on beat 1 of each bar)",
        shortDisplay: "'the downbeats' → 32 events",
      },
      {
        rawText: 'these notes',
        resolvedName: '3 selected notes',
        context: 'UI selection',
        fullDisplay: "'these notes' → 3 selected notes [from UI selection]",
        shortDisplay: "'these notes' → 3 notes [selected]",
      },
    ],
  },
  {
    entityType: 'deck',
    format: "'{raw}' → {name} deck",
    includeContext: true,
    contextFields: ['cardCount'],
    maxLength: 60,
    truncationStrategy: 'abbreviate',
    examples: [
      {
        rawText: 'the drums deck',
        resolvedName: 'Drums',
        context: '5 cards',
        fullDisplay: "'the drums deck' → Drums deck (5 cards)",
        shortDisplay: "'the drums deck' → Drums deck",
      },
    ],
  },
  {
    entityType: 'board',
    format: "'{raw}' → {name}",
    includeContext: false,
    contextFields: [],
    maxLength: 40,
    truncationStrategy: 'abbreviate',
    examples: [
      {
        rawText: 'the project',
        resolvedName: 'Main Board',
        context: '',
        fullDisplay: "'the project' → Main Board",
        shortDisplay: "Main Board",
      },
    ],
  },
  {
    entityType: 'axis',
    format: "'{raw}' → {name} axis",
    includeContext: false,
    contextFields: [],
    maxLength: 50,
    truncationStrategy: 'abbreviate',
    examples: [
      {
        rawText: 'brightness',
        resolvedName: 'Brightness',
        context: '',
        fullDisplay: "'brightness' → Brightness axis",
        shortDisplay: "Brightness",
      },
    ],
  },
];

// =============================================================================
// ERROR MESSAGE TEMPLATES
// =============================================================================

/**
 * Template for error messages when binding fails.
 */
export interface BindingErrorTemplate {
  readonly reason: string;
  readonly template: string;
  readonly tone: 'neutral' | 'helpful' | 'apologetic';
  readonly includesAction: boolean;
  readonly examples: readonly string[];
}

/**
 * Error message templates for failed entity bindings.
 */
export const BINDING_ERROR_TEMPLATES: readonly BindingErrorTemplate[] = [
  {
    reason: 'not_found',
    template: 'I couldn\'t find "{rawText}" in your project. {suggestion}',
    tone: 'helpful',
    includesAction: true,
    examples: [
      'I couldn\'t find "the flute" in your project. Your tracks are: Drums, Bass, Keys, Vocals.',
      'I couldn\'t find "Verse 4" in your project. You have Verse 1, Verse 2, and Verse 3.',
    ],
  },
  {
    reason: 'no_selection',
    template: 'You said "{rawText}" but nothing is selected. {suggestion}',
    tone: 'helpful',
    includesAction: true,
    examples: [
      'You said "this section" but nothing is selected. Please select a section first.',
      'You said "these notes" but no notes are selected. Select the notes you want to change.',
    ],
  },
  {
    reason: 'stale_selection',
    template: 'You said "{rawText}" — did you mean {lastSelection}? (Selected {turnsAgo} turns ago.)',
    tone: 'neutral',
    includesAction: true,
    examples: [
      'You said "this" — did you mean Chorus 2? (Selected 5 turns ago.)',
    ],
  },
  {
    reason: 'ambiguous',
    template: '"{rawText}" could refer to: {options}. Which one?',
    tone: 'neutral',
    includesAction: true,
    examples: [
      '"the chorus" could refer to: Chorus 1 (bars 17–32), Chorus 2 (bars 49–65), or Chorus 3 (bars 81–96). Which one?',
    ],
  },
  {
    reason: 'type_mismatch',
    template: 'You said "{rawText}" but {selectedEntity} is selected (a {selectedType}, not a {expectedType}). {suggestion}',
    tone: 'helpful',
    includesAction: true,
    examples: [
      'You said "this section" but a note is selected (an event, not a section). Did you mean the section containing the selected note?',
    ],
  },
  {
    reason: 'no_discourse',
    template: 'I\'m not sure what "{rawText}" refers to. Could you be more specific?',
    tone: 'apologetic',
    includesAction: false,
    examples: [
      'I\'m not sure what "that" refers to. Could you be more specific?',
      'I\'m not sure what "those" refers to. Could you name what you\'d like to change?',
    ],
  },
  {
    reason: 'out_of_range',
    template: '"{rawText}" is out of range. Your project has {available}.',
    tone: 'neutral',
    includesAction: false,
    examples: [
      '"Bar 200" is out of range. Your project has 128 bars.',
      '"Verse 5" is out of range. You have Verses 1 through 3.',
    ],
  },
];

// =============================================================================
// COPY GUIDELINES
// =============================================================================

/**
 * A copy guideline rule.
 */
export interface CopyGuideline {
  readonly id: string;
  readonly category: 'tone' | 'format' | 'length' | 'content' | 'interaction';
  readonly rule: string;
  readonly good: readonly string[];
  readonly bad: readonly string[];
}

/**
 * Canonical copy guidelines for entity binding displays.
 */
export const ENTITY_BINDING_COPY_GUIDELINES: readonly CopyGuideline[] = [
  {
    id: 'copy-001',
    category: 'format',
    rule: "Always show the user's raw text alongside the resolved entity. Use single quotes for raw text and arrow for the binding.",
    good: [
      "'the chorus' → Chorus 2 (bars 49–65)",
      "'that synth' → Analog Pad on Keys deck",
    ],
    bad: [
      "Chorus 2",
      "Resolved to Chorus 2",
      "Binding: Chorus 2",
    ],
  },
  {
    id: 'copy-002',
    category: 'content',
    rule: 'Include enough context to disambiguate. Section references show bar ranges. Card references show their containing deck. Parameter references show their current value.',
    good: [
      "'the chorus' → Chorus 2 (bars 49–65)",
      "'the reverb' → Hall Reverb on Drums deck",
    ],
    bad: [
      "'the chorus' → Chorus 2",
      "'the reverb' → Hall Reverb",
    ],
  },
  {
    id: 'copy-003',
    category: 'tone',
    rule: 'Error messages should be helpful, not technical. Always suggest what the user can do. Never blame the user.',
    good: [
      "I couldn't find \"the flute\" in your project. Your tracks are: Drums, Bass, Keys, Vocals.",
      "You said \"this section\" but nothing is selected. Please select a section first.",
    ],
    bad: [
      "Error: Entity not found",
      "Resolution failed: no_selection",
      "Invalid reference: the flute",
    ],
  },
  {
    id: 'copy-004',
    category: 'length',
    rule: 'Keep binding displays under 80 characters. Drop context before truncating names. Never truncate the raw text.',
    good: [
      "'the drums' → Drums layer",
      "'the chorus' → Chorus 2",
    ],
    bad: [
      "'the drums' → Drums layer (track 3, contains 5 cards, 2400 events, soloed, volume 0.8)",
      "'the ch...' → Ch... 2",
    ],
  },
  {
    id: 'copy-005',
    category: 'interaction',
    rule: 'Disambiguation questions should list options with enough context. Use ordinal descriptions, not IDs. Limit to 4 options.',
    good: [
      '"the chorus" could refer to: Chorus 1 (bars 17–32), Chorus 2 (bars 49–65), or Chorus 3 (bars 81–96). Which one?',
    ],
    bad: [
      '"the chorus" is ambiguous. Options: secref:chorus:1, secref:chorus:2, secref:chorus:3',
      '"the chorus" matches 3 sections. Please specify.',
    ],
  },
  {
    id: 'copy-006',
    category: 'interaction',
    rule: 'When showing resolved bindings in the preview panel, use a compact table format. Group bindings by type.',
    good: [
      "Scope:     'in the chorus' → Chorus 2 (bars 49–65)\nTarget:    'the drums' → Drums layer\nAction:    make louder",
    ],
    bad: [
      "Binding 1: chorus. Binding 2: drums. Action: louder.",
    ],
  },
  {
    id: 'copy-007',
    category: 'format',
    rule: 'Show the resolution method as a subtle badge, not in the main text. [selected], [named], [recent], [inferred].',
    good: [
      "'this section' → Intro (bars 1–8) [selected]",
      "'it' → Drums layer [recent]",
    ],
    bad: [
      "'this section' → Intro (resolved via deictic from UI selection at turn 3)",
    ],
  },
  {
    id: 'copy-008',
    category: 'content',
    rule: 'For event selectors, show the count of matched events. Use human-readable descriptions, not selector types.',
    good: [
      "'the high notes' → 12 notes (MIDI ≥ 84) in Chorus 2",
      "'the downbeats' → 32 events (beat 1 of each bar)",
    ],
    bad: [
      "'the high notes' → EventSelector(and(kind:note, pitch_range:high))",
      "'the downbeats' → pattern_selector:downbeat",
    ],
  },
  {
    id: 'copy-009',
    category: 'tone',
    rule: 'Suggestions should be actionable and specific. "Did you mean X?" is better than "Please try again."',
    good: [
      'Did you mean "Chorus 2" or "Chorus 3"?',
      "I couldn't find that. Your sections are: Intro, Verse 1, Chorus, Bridge.",
    ],
    bad: [
      'Please try again with a more specific reference.',
      'Entity not found. Check your spelling.',
    ],
  },
  {
    id: 'copy-010',
    category: 'interaction',
    rule: 'Allow the user to correct bindings inline. Show a clickable/selectable alternative when ambiguous.',
    good: [
      "'the chorus' → Chorus 2 (bars 49–65) [click to change]",
    ],
    bad: [
      "'the chorus' → Chorus 2 (bars 49–65) [no way to change]",
    ],
  },
];

// =============================================================================
// BINDING DISPLAY HELPERS
// =============================================================================

/**
 * Get the display template for an entity type.
 */
export function getBindingTemplate(entityType: EntityType): BindingDisplayTemplate | undefined {
  return BINDING_DISPLAY_TEMPLATES.find(t => t.entityType === entityType);
}

/**
 * Get the error template for a failure reason.
 */
export function getErrorTemplate(reason: string): BindingErrorTemplate | undefined {
  return BINDING_ERROR_TEMPLATES.find(t => t.reason === reason);
}

/**
 * Format a binding display string.
 */
export function formatBindingDisplay(
  rawText: string,
  resolvedName: string,
  context: string,
  method?: string,
  maxLength?: number
): string {
  const methodBadge = method ? ` [${method}]` : '';
  const full = context
    ? `'${rawText}' → ${resolvedName} (${context})${methodBadge}`
    : `'${rawText}' → ${resolvedName}${methodBadge}`;

  if (maxLength && full.length > maxLength) {
    // Drop context first
    const short = `'${rawText}' → ${resolvedName}${methodBadge}`;
    if (short.length <= maxLength) return short;
    return short;
  }

  return full;
}

/**
 * Format a resolution method as a human-readable badge.
 */
export function formatMethodBadge(method: string): string {
  switch (method) {
    case 'exact_id': return 'exact';
    case 'exact_name': return 'named';
    case 'fuzzy_name': return 'fuzzy';
    case 'type_and_ordinal': return 'ordinal';
    case 'type_and_position': return 'position';
    case 'deictic': return 'selected';
    case 'anaphoric': return 'referenced';
    case 'salience': return 'recent';
    case 'default': return 'default';
    case 'context_inferred': return 'inferred';
    default: return method;
  }
}

/**
 * Format a binding error message.
 */
export function formatBindingError(
  reason: string,
  rawText: string,
  suggestion?: string
): string {
  const template = getErrorTemplate(reason);
  if (!template) {
    return `Could not resolve "${rawText}".${suggestion ? ` ${suggestion}` : ''}`;
  }

  return template.template
    .replace('{rawText}', rawText)
    .replace('{suggestion}', suggestion ?? '');
}

/**
 * Format a disambiguation question.
 */
export function formatDisambiguationForUI(
  rawText: string,
  options: readonly { name: string; context: string }[],
  maxOptions: number = 4
): string {
  const displayOptions = options.slice(0, maxOptions);
  const optionStrings = displayOptions
    .map(o => o.context ? `${o.name} (${o.context})` : o.name)
    .join(', ');

  const moreCount = options.length - displayOptions.length;
  const moreText = moreCount > 0 ? `, and ${moreCount} more` : '';

  return `"${rawText}" could refer to: ${optionStrings}${moreText}. Which one?`;
}

// =============================================================================
// BINDING PREVIEW PANEL TYPES
// =============================================================================

/**
 * A binding summary for display in the preview panel.
 */
export interface BindingPreviewSummary {
  readonly bindings: readonly BindingPreviewItem[];
  readonly hasErrors: boolean;
  readonly errorCount: number;
  readonly ambiguityCount: number;
}

/**
 * A single binding item in the preview panel.
 */
export interface BindingPreviewItem {
  readonly role: 'scope' | 'target' | 'constraint' | 'parameter' | 'action';
  readonly rawText: string;
  readonly display: string;
  readonly status: 'resolved' | 'ambiguous' | 'failed';
  readonly methodBadge?: string;
  readonly isEditable: boolean;
}

/**
 * Format a complete binding preview panel.
 */
export function formatBindingPreviewPanel(
  summary: BindingPreviewSummary
): string {
  const lines: string[] = [];

  for (const item of summary.bindings) {
    const roleLabel = item.role.charAt(0).toUpperCase() + item.role.slice(1);
    const statusIcon = item.status === 'resolved' ? '✓'
      : item.status === 'ambiguous' ? '?'
      : '✗';
    const badge = item.methodBadge ? ` [${item.methodBadge}]` : '';

    lines.push(`${statusIcon} ${roleLabel}: ${item.display}${badge}`);
  }

  if (summary.hasErrors) {
    lines.push('');
    lines.push(`${summary.errorCount} binding(s) need attention.`);
  }

  return lines.join('\n');
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules for entity binding UI display.
 */
export const BINDING_UI_RULES: readonly {
  readonly id: string;
  readonly description: string;
  readonly rule: string;
}[] = [
  {
    id: 'bui-001',
    description: 'Every binding is visible',
    rule: 'Every entity binding must be visible in the preview panel. No binding should be hidden or only shown on hover. The user must be able to verify all bindings at a glance.',
  },
  {
    id: 'bui-002',
    description: 'Bindings are editable',
    rule: 'The user can click/tap on any binding to change it. Clicking opens a dropdown or search field showing alternatives. The edit is reflected immediately in the preview.',
  },
  {
    id: 'bui-003',
    description: 'Resolution method is shown subtly',
    rule: 'The resolution method (named, selected, inferred, etc.) is shown as a small badge next to the binding. It helps the user understand WHY this binding was chosen.',
  },
  {
    id: 'bui-004',
    description: 'Errors are prominent and actionable',
    rule: 'Failed bindings are highlighted in red/orange. The error message includes a suggestion for how to fix it. The user can click to resolve the issue.',
  },
  {
    id: 'bui-005',
    description: 'Ambiguities show options inline',
    rule: 'Ambiguous bindings show a dropdown with the top candidates. The system-suggested default is highlighted but not auto-selected. The user must actively choose.',
  },
  {
    id: 'bui-006',
    description: 'Context helps disambiguation',
    rule: 'Each option in a disambiguation dropdown includes context (bar range for sections, deck name for cards, etc.) to help the user choose correctly.',
  },
];
