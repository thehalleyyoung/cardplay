/**
 * GOFAI NL HCI — Clarification UI Copy Templates
 *
 * Provides structured copy (text) templates for clarification questions.
 * Each ambiguity category has a set of templates that produce
 * human-friendly clarification questions with examples.
 *
 * ## Template Design Principles
 *
 * 1. **Concrete examples**: Always show what each option means in practice.
 * 2. **Short**: Questions ≤ 1 sentence. Options ≤ 10 words.
 * 3. **Non-technical**: Avoid linguistic jargon (no "scope", "PP-attachment").
 * 4. **Actionable**: Each option clearly maps to a different edit result.
 * 5. **Default visible**: The recommended option is always first.
 *
 * @module gofai/nl/hci/clarification-templates
 * @see gofai_goalA.md Step 148
 */

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

/**
 * A clarification template for a specific ambiguity pattern.
 */
export interface ClarificationTemplate {
  /** Unique template ID (CT001–CTnnn) */
  readonly id: string;
  /** Which ambiguity pattern this template is for */
  readonly pattern: ClarificationPattern;
  /** The question text (supports {word}, {entity} placeholders) */
  readonly question: string;
  /** Option templates */
  readonly options: readonly ClarificationOptionTemplate[];
  /** "Why this matters" text */
  readonly whyItMatters: string;
  /** Whether a safe default exists */
  readonly hasDefault: boolean;
  /** Index of the default option (0-based) */
  readonly defaultIndex: number;
  /** Category for grouping */
  readonly category: TemplateCategory;
}

/**
 * An option within a clarification template.
 */
export interface ClarificationOptionTemplate {
  /** Short label (≤ 10 words) */
  readonly label: string;
  /** Longer explanation (1 sentence) */
  readonly explanation: string;
  /** What this option does in audio terms */
  readonly audioEffect: string;
  /** Risk level */
  readonly risk: 'safe' | 'moderate' | 'risky';
}

/**
 * Named ambiguity patterns that have templates.
 */
export type ClarificationPattern =
  // Degree/adjective patterns
  | 'darker_ambiguity'
  | 'brighter_ambiguity'
  | 'warmer_ambiguity'
  | 'thicker_ambiguity'
  | 'tighter_ambiguity'
  | 'cleaner_ambiguity'
  | 'heavier_ambiguity'
  | 'fuller_ambiguity'
  | 'spacious_ambiguity'
  // Lexical patterns
  | 'bass_entity_ambiguity'
  | 'double_verb_ambiguity'
  | 'clip_verb_ambiguity'
  | 'boost_verb_ambiguity'
  | 'cut_verb_ambiguity'
  | 'drop_verb_ambiguity'
  // Scope patterns
  | 'negation_scope'
  | 'only_focus'
  | 'quantifier_scope'
  // Reference patterns
  | 'pronoun_reference'
  | 'definite_reference'
  | 'demonstrative_reference'
  // Structural patterns
  | 'pp_attachment'
  | 'coordination_scope'
  | 'adverb_attachment'
  // Pragmatic patterns
  | 'indirect_request'
  | 'modal_interpretation';

export type TemplateCategory =
  | 'sound_quality'    // Adjective/degree ambiguity
  | 'word_meaning'     // Lexical ambiguity
  | 'sentence_meaning' // Scope/structural ambiguity
  | 'reference'        // Who/what is meant
  | 'intent';          // What the user wants

// =============================================================================
// THE CLARIFICATION TEMPLATES
// =============================================================================

export const CLARIFICATION_TEMPLATES: readonly ClarificationTemplate[] = [
  // ─── DEGREE / ADJECTIVE TEMPLATES ──────────────────────────────────────
  {
    id: 'CT001',
    pattern: 'darker_ambiguity',
    question: 'By "darker" do you mean the sound quality or the musical mood?',
    options: [
      {
        label: 'Darker tone (EQ)',
        explanation: 'Reduce high frequencies for a warmer, mellower sound.',
        audioEffect: 'High-frequency EQ cut',
        risk: 'safe',
      },
      {
        label: 'Darker harmony',
        explanation: 'Shift chords toward minor/diminished qualities.',
        audioEffect: 'Chord voicing changes',
        risk: 'moderate',
      },
      {
        label: 'Darker mood overall',
        explanation: 'Multiple changes to create a moodier atmosphere.',
        audioEffect: 'EQ, reverb, and arrangement changes',
        risk: 'moderate',
      },
    ],
    whyItMatters: 'These interpretations affect very different aspects of your music.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT002',
    pattern: 'brighter_ambiguity',
    question: 'By "brighter" do you mean the frequency balance or the energy?',
    options: [
      {
        label: 'Brighter EQ (more highs)',
        explanation: 'Boost high frequencies for more clarity and air.',
        audioEffect: 'High-frequency EQ boost',
        risk: 'safe',
      },
      {
        label: 'More energetic/uplifting',
        explanation: 'Increase energy through dynamics and arrangement.',
        audioEffect: 'Multiple parameter changes',
        risk: 'moderate',
      },
    ],
    whyItMatters: 'An EQ change is subtle; an energy change affects the whole feel.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT003',
    pattern: 'warmer_ambiguity',
    question: 'By "warmer" do you mean adding harmonic richness or adjusting EQ?',
    options: [
      {
        label: 'Warmer tone (EQ + saturation)',
        explanation: 'Add low-mid warmth and gentle harmonic saturation.',
        audioEffect: 'Low-mid EQ boost + subtle saturation',
        risk: 'safe',
      },
      {
        label: 'More analog character',
        explanation: 'Apply tape/tube emulation for vintage warmth.',
        audioEffect: 'Analog modeling plugin',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Both add warmth, but through different processing.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT004',
    pattern: 'thicker_ambiguity',
    question: 'Should "thicker" mean more layers or a fuller frequency spectrum?',
    options: [
      {
        label: 'More layers/voices',
        explanation: 'Duplicate and slightly detune for a thicker texture.',
        audioEffect: 'Track duplication + detuning',
        risk: 'moderate',
      },
      {
        label: 'Fuller frequency spectrum',
        explanation: 'Widen EQ and add harmonics.',
        audioEffect: 'EQ + harmonic exciter',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Adding layers changes the arrangement; EQ changes the mix.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT005',
    pattern: 'tighter_ambiguity',
    question: 'By "tighter" do you mean timing or frequency?',
    options: [
      {
        label: 'Tighter timing (quantize)',
        explanation: 'Snap notes closer to the grid.',
        audioEffect: 'MIDI/audio quantization',
        risk: 'safe',
      },
      {
        label: 'Tighter low-end (less mud)',
        explanation: 'Clean up bass resonances.',
        audioEffect: 'Low-frequency EQ cut/compression',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Timing affects groove; EQ affects clarity.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT006',
    pattern: 'cleaner_ambiguity',
    question: 'By "cleaner" do you mean less noise or less effects?',
    options: [
      {
        label: 'Less noise/distortion',
        explanation: 'Reduce unwanted noise, hum, or digital artifacts.',
        audioEffect: 'Noise reduction + denoising',
        risk: 'safe',
      },
      {
        label: 'Drier (less effects)',
        explanation: 'Reduce reverb, delay, and other processing.',
        audioEffect: 'Effect level reduction',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Noise reduction preserves effects; drying removes them.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT007',
    pattern: 'spacious_ambiguity',
    question: 'By "more space" do you mean reverb or arrangement breathing room?',
    options: [
      {
        label: 'More reverb/ambience',
        explanation: 'Add spatial reverb for a larger room feel.',
        audioEffect: 'Reverb increase',
        risk: 'safe',
      },
      {
        label: 'More silence between elements',
        explanation: 'Add gaps and reduce density.',
        audioEffect: 'Arrangement thinning',
        risk: 'moderate',
      },
    ],
    whyItMatters: 'Reverb adds virtual space; arrangement space is about density.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT008',
    pattern: 'heavier_ambiguity',
    question: 'By "heavier" do you mean more bass weight or more aggressive?',
    options: [
      {
        label: 'More bass/low-end weight',
        explanation: 'Boost low frequencies for more bottom end.',
        audioEffect: 'Low-frequency EQ boost',
        risk: 'safe',
      },
      {
        label: 'More aggressive/distorted',
        explanation: 'Add distortion and saturation for an aggressive tone.',
        audioEffect: 'Distortion + saturation',
        risk: 'moderate',
      },
    ],
    whyItMatters: 'Bass boost is subtle; distortion changes the character.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'sound_quality',
  },
  {
    id: 'CT009',
    pattern: 'fuller_ambiguity',
    question: 'By "fuller" do you mean frequency fullness or arrangement density?',
    options: [
      {
        label: 'Fuller frequency range',
        explanation: 'Fill in gaps in the frequency spectrum.',
        audioEffect: 'EQ + harmonic enhancement',
        risk: 'safe',
      },
      {
        label: 'More instruments/parts',
        explanation: 'Add more musical elements to the arrangement.',
        audioEffect: 'New track/layer additions',
        risk: 'moderate',
      },
    ],
    whyItMatters: 'EQ fullness is a mix change; arrangement fullness adds new content.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sound_quality',
  },

  // ─── LEXICAL TEMPLATES ──────────────────────────────────────────────────
  {
    id: 'CT010',
    pattern: 'bass_entity_ambiguity',
    question: 'By "bass" do you mean the bass instrument or the low frequencies?',
    options: [
      {
        label: 'Bass instrument track',
        explanation: 'The bass guitar or bass synth track.',
        audioEffect: 'Applied to the bass track',
        risk: 'safe',
      },
      {
        label: 'Low frequency range',
        explanation: 'The low-end frequencies (20-200 Hz).',
        audioEffect: 'Applied as EQ adjustment',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Changing the track vs. the frequency range produces very different results.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'word_meaning',
  },
  {
    id: 'CT011',
    pattern: 'double_verb_ambiguity',
    question: 'By "double" do you mean duplicate or multiply by 2?',
    options: [
      {
        label: 'Duplicate (make a copy)',
        explanation: 'Create an identical copy of the element.',
        audioEffect: 'New duplicated track/region',
        risk: 'safe',
      },
      {
        label: 'Multiply value by 2',
        explanation: 'Double the numeric parameter value.',
        audioEffect: 'Parameter doubled (e.g., 60→120)',
        risk: 'moderate',
      },
    ],
    whyItMatters: 'Duplication adds a copy; multiplying changes the value.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'word_meaning',
  },
  {
    id: 'CT012',
    pattern: 'clip_verb_ambiguity',
    question: 'By "clip" do you mean trim the audio or apply clipping distortion?',
    options: [
      {
        label: 'Trim/cut the region',
        explanation: 'Remove audio outside the selected range.',
        audioEffect: 'Region trimming',
        risk: 'moderate',
      },
      {
        label: 'Apply hard clipping',
        explanation: 'Apply aggressive distortion by clipping the waveform.',
        audioEffect: 'Hard clipping distortion',
        risk: 'moderate',
      },
    ],
    whyItMatters: 'Trimming removes audio; clipping distorts it.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'word_meaning',
  },
  {
    id: 'CT013',
    pattern: 'boost_verb_ambiguity',
    question: 'By "boost" do you mean increase volume or EQ boost?',
    options: [
      {
        label: 'Increase volume',
        explanation: 'Turn up the overall level of the track.',
        audioEffect: 'Volume fader increase',
        risk: 'safe',
      },
      {
        label: 'EQ boost (which frequency?)',
        explanation: 'Apply an EQ boost at a specific frequency.',
        audioEffect: 'EQ band boost',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Volume affects the whole signal; EQ boost targets specific frequencies.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'word_meaning',
  },
  {
    id: 'CT014',
    pattern: 'cut_verb_ambiguity',
    question: 'By "cut" do you mean remove the audio or cut the EQ?',
    options: [
      {
        label: 'Remove/delete the audio',
        explanation: 'Delete the selected region or element.',
        audioEffect: 'Audio deletion',
        risk: 'risky',
      },
      {
        label: 'EQ cut (reduce frequency)',
        explanation: 'Reduce specific frequencies with EQ.',
        audioEffect: 'EQ band reduction',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Deleting audio is destructive; EQ cutting is reversible.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'word_meaning',
  },

  // ─── SCOPE TEMPLATES ────────────────────────────────────────────────────
  {
    id: 'CT015',
    pattern: 'negation_scope',
    question: 'Which did you mean?',
    options: [
      {
        label: 'Don\'t apply to ALL (some is OK)',
        explanation: 'Skip the "apply to everything" — apply selectively.',
        audioEffect: 'Selective application',
        risk: 'safe',
      },
      {
        label: 'Apply to NONE of them',
        explanation: 'Don\'t apply this change to any of them.',
        audioEffect: 'No changes made',
        risk: 'safe',
      },
    ],
    whyItMatters: 'One applies to some; the other applies to none.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sentence_meaning',
  },
  {
    id: 'CT016',
    pattern: 'only_focus',
    question: 'What does "only" restrict?',
    options: [
      {
        label: 'Only this effect (no other effects)',
        explanation: 'Apply just this one effect, not others.',
        audioEffect: 'Single effect application',
        risk: 'safe',
      },
      {
        label: 'Only this section (not other sections)',
        explanation: 'Apply it here but not elsewhere.',
        audioEffect: 'Section-specific application',
        risk: 'safe',
      },
    ],
    whyItMatters: '"Only" could limit what you\'re adding or where you\'re adding it.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'sentence_meaning',
  },
  {
    id: 'CT017',
    pattern: 'quantifier_scope',
    question: 'Should each {entity} get its own {action}, or share one?',
    options: [
      {
        label: 'Each gets its own',
        explanation: 'Apply individually to each one.',
        audioEffect: 'Individual per-entity changes',
        risk: 'moderate',
      },
      {
        label: 'All share the same',
        explanation: 'Apply one shared setting to all.',
        audioEffect: 'Single shared change',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Individual settings give more control; shared is simpler.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sentence_meaning',
  },

  // ─── REFERENCE TEMPLATES ────────────────────────────────────────────────
  {
    id: 'CT018',
    pattern: 'pronoun_reference',
    question: 'What does "{pronoun}" refer to?',
    options: [
      {
        label: 'The selected element',
        explanation: 'The currently highlighted/selected item.',
        audioEffect: 'Applied to selection',
        risk: 'safe',
      },
      {
        label: 'The last mentioned element',
        explanation: 'The most recently discussed item.',
        audioEffect: 'Applied to last reference',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Applying changes to the wrong element can cause unintended edits.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'reference',
  },
  {
    id: 'CT019',
    pattern: 'definite_reference',
    question: 'Which {entity_type} do you mean?',
    options: [
      {
        label: 'The currently selected one',
        explanation: 'The one that\'s currently highlighted.',
        audioEffect: 'Applied to selection',
        risk: 'safe',
      },
      {
        label: 'Choose from a list',
        explanation: 'Show me all matching items to pick from.',
        audioEffect: 'Deferred — awaiting selection',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Multiple items match — we need to know which one.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'reference',
  },

  // ─── STRUCTURAL TEMPLATES ──────────────────────────────────────────────
  {
    id: 'CT020',
    pattern: 'pp_attachment',
    question: 'Does "{pp}" describe when/where, or which {entity}?',
    options: [
      {
        label: 'When/where to apply',
        explanation: 'It describes the timing or location of the action.',
        audioEffect: 'Action scoped to location',
        risk: 'safe',
      },
      {
        label: 'Which {entity}',
        explanation: 'It identifies which specific element.',
        audioEffect: 'Action applied to specific element',
        risk: 'safe',
      },
    ],
    whyItMatters: 'Different attachments target different things.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sentence_meaning',
  },
  {
    id: 'CT021',
    pattern: 'coordination_scope',
    question: 'Does "{modifier}" apply to all items or just the last one?',
    options: [
      {
        label: 'Applies to all',
        explanation: 'Apply equally to everything mentioned.',
        audioEffect: 'Same change to all elements',
        risk: 'safe',
      },
      {
        label: 'Only the last one',
        explanation: 'Apply only to the last-mentioned item.',
        audioEffect: 'Change to last element only',
        risk: 'safe',
      },
    ],
    whyItMatters: 'This affects whether the change is applied broadly or narrowly.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'sentence_meaning',
  },

  // ─── PRAGMATIC TEMPLATES ───────────────────────────────────────────────
  {
    id: 'CT022',
    pattern: 'indirect_request',
    question: 'Should I make this change or are you just noting it?',
    options: [
      {
        label: 'Yes, make the change',
        explanation: 'Go ahead and apply the edit.',
        audioEffect: 'Edit applied',
        risk: 'safe',
      },
      {
        label: 'Just noting it for later',
        explanation: 'Save as a note without making changes.',
        audioEffect: 'No changes; note saved',
        risk: 'safe',
      },
    ],
    whyItMatters: 'We want to make sure you intended an action, not just an observation.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'intent',
  },
  {
    id: 'CT023',
    pattern: 'modal_interpretation',
    question: 'Is this a request or a question?',
    options: [
      {
        label: 'It\'s a request (do it)',
        explanation: 'Interpret as a command to execute.',
        audioEffect: 'Edit executed',
        risk: 'safe',
      },
      {
        label: 'It\'s a question (tell me)',
        explanation: 'Explain what would happen without doing it.',
        audioEffect: 'Preview only; no changes',
        risk: 'safe',
      },
    ],
    whyItMatters: 'We want to either act or explain, depending on your intent.',
    hasDefault: true,
    defaultIndex: 0,
    category: 'intent',
  },

  // ─── ADDITIONAL LEXICAL ────────────────────────────────────────────────
  {
    id: 'CT024',
    pattern: 'drop_verb_ambiguity',
    question: 'By "drop" do you mean the beat drop or lower the volume?',
    options: [
      {
        label: 'Beat drop (transition)',
        explanation: 'Trigger the musical "drop" — a moment of impact.',
        audioEffect: 'Arrangement transition',
        risk: 'moderate',
      },
      {
        label: 'Lower the volume/level',
        explanation: 'Reduce the volume or level.',
        audioEffect: 'Volume decrease',
        risk: 'safe',
      },
    ],
    whyItMatters: 'A beat drop changes the arrangement; lowering volume just turns it down.',
    hasDefault: false,
    defaultIndex: 0,
    category: 'word_meaning',
  },
];

// =============================================================================
// TEMPLATE LOOKUP
// =============================================================================

/**
 * Index of templates by pattern for quick lookup.
 */
const TEMPLATE_BY_PATTERN: ReadonlyMap<ClarificationPattern, ClarificationTemplate> = new Map(
  CLARIFICATION_TEMPLATES.map(t => [t.pattern, t]),
);

/**
 * Look up a clarification template by pattern.
 */
export function getTemplateByPattern(pattern: ClarificationPattern): ClarificationTemplate | undefined {
  return TEMPLATE_BY_PATTERN.get(pattern);
}

/**
 * Look up a template by ID.
 */
export function getTemplateById(id: string): ClarificationTemplate | undefined {
  return CLARIFICATION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all templates for a category.
 */
export function getTemplatesByCategory(category: TemplateCategory): readonly ClarificationTemplate[] {
  return CLARIFICATION_TEMPLATES.filter(t => t.category === category);
}

/**
 * Fill in template placeholders with concrete values.
 */
export function fillTemplate(
  template: ClarificationTemplate,
  values: Partial<Record<string, string>>,
): ClarificationTemplate {
  const fill = (s: string): string => {
    let result = s;
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }
    return result;
  };

  return {
    ...template,
    question: fill(template.question),
    whyItMatters: fill(template.whyItMatters),
    options: template.options.map(o => ({
      ...o,
      label: fill(o.label),
      explanation: fill(o.explanation),
      audioEffect: fill(o.audioEffect),
    })),
  };
}

// =============================================================================
// STATISTICS
// =============================================================================

export function getClarificationTemplateStats(): {
  readonly templateCount: number;
  readonly byCategory: ReadonlyMap<TemplateCategory, number>;
  readonly withDefaults: number;
  readonly avgOptionsPerTemplate: number;
} {
  const byCategory = new Map<TemplateCategory, number>();
  let withDefaults = 0;
  let totalOptions = 0;

  for (const t of CLARIFICATION_TEMPLATES) {
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
    if (t.hasDefault) withDefaults++;
    totalOptions += t.options.length;
  }

  return {
    templateCount: CLARIFICATION_TEMPLATES.length,
    byCategory,
    withDefaults,
    avgOptionsPerTemplate: CLARIFICATION_TEMPLATES.length > 0
      ? totalOptions / CLARIFICATION_TEMPLATES.length
      : 0,
  };
}
