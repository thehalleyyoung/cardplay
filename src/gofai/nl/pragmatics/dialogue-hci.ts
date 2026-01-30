/**
 * dialogue-hci.ts -- Steps 231-235: HCI dialogue UI specifications
 *
 * Step 231: Clarification Cards UI — card-based ambiguity resolution
 * Step 232: Context Strip UI — breadcrumb-like context display with pronoun preview
 * Step 233: Conversation Memory UI — turn history with CPL diffs and bookmarks
 * Step 234: Undo Target Selection UI — selective undo with preview and grouping
 * Step 235: Preference Tuning UI — toggle matrix for vocabulary axis mappings
 *
 * All types are locally defined (no external imports).
 */

// ===================== STEP 231: CLARIFICATION CARDS UI =====================

// ---- 231 Types ----

/** Style variant for a clarification card. */
export type CardStyleVariant =
  | 'compact'
  | 'expanded'
  | 'side-by-side'
  | 'stacked'
  | 'floating'
  | 'inline'
  | 'modal'
  | 'toast';

/** Animation type for card transitions. */
export type CardAnimationType =
  | 'fade-in'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'flip'
  | 'none'
  | 'bounce'
  | 'morph';

/** Interaction type supported by a card. */
export type CardInteractionType =
  | 'select-option'
  | 'hover-detail'
  | 'keyboard-nav'
  | 'swipe-dismiss'
  | 'auto-select-timeout'
  | 'tap-confirm'
  | 'long-press-info'
  | 'double-tap-expand'
  | 'drag-reorder'
  | 'voice-select';

/** Ambiguity type the card addresses. */
export type CardAmbiguityType =
  | 'lexical'
  | 'scope'
  | 'attachment'
  | 'degree'
  | 'reference'
  | 'quantifier'
  | 'temporal'
  | 'entity'
  | 'parameter'
  | 'verb-frame'
  | 'adjective-axis'
  | 'pronoun'
  | 'coordination'
  | 'ellipsis'
  | 'metaphor'
  | 'negation';

/** A single option within a clarification card. */
export interface CardOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly audioPreviewHint: string;
  readonly risk: 'safe' | 'moderate' | 'risky';
  readonly isDefault: boolean;
  readonly shortcut: string;
  readonly iconName: string;
}

/** Style properties for a card. */
export interface CardStyle {
  readonly variant: CardStyleVariant;
  readonly borderColor: string;
  readonly backgroundColor: string;
  readonly headerColor: string;
  readonly textColor: string;
  readonly accentColor: string;
  readonly borderRadius: number;
  readonly elevation: number;
  readonly opacity: number;
  readonly maxWidth: number;
  readonly padding: number;
}

/** Animation configuration for a card. */
export interface CardAnimation {
  readonly type: CardAnimationType;
  readonly durationMs: number;
  readonly delayMs: number;
  readonly easing: string;
  readonly exitType: CardAnimationType;
  readonly exitDurationMs: number;
}

/** Layout for a clarification card. */
export type CardLayoutMode =
  | 'vertical'
  | 'horizontal'
  | 'grid'
  | 'carousel'
  | 'accordion';

/** Layout specification for a card. */
export interface CardLayout {
  readonly mode: CardLayoutMode;
  readonly columns: number;
  readonly gap: number;
  readonly alignment: 'start' | 'center' | 'end' | 'stretch';
  readonly optionLayout: 'list' | 'grid' | 'radio' | 'chips';
  readonly showDescriptions: boolean;
  readonly showIcons: boolean;
  readonly showShortcuts: boolean;
}

/** Interaction configuration for a card. */
export interface CardInteraction {
  readonly type: CardInteractionType;
  readonly enabled: boolean;
  readonly timeoutMs: number;
  readonly feedbackType: 'visual' | 'audio' | 'haptic' | 'none';
  readonly requireConfirm: boolean;
}

/** ARIA accessibility specification for a card. */
export interface CardAccessibility {
  readonly role: string;
  readonly ariaLabel: string;
  readonly ariaDescribedBy: string;
  readonly ariaLive: 'off' | 'polite' | 'assertive';
  readonly tabIndex: number;
  readonly focusTrapEnabled: boolean;
  readonly screenReaderDescription: string;
  readonly announceOnAppear: boolean;
  readonly keyboardShortcutsDescription: string;
}

/** Full configuration for the clarification card system. */
export interface ClarificationCardConfig {
  readonly defaultStyle: CardStyle;
  readonly defaultLayout: CardLayout;
  readonly defaultAnimation: CardAnimation;
  readonly defaultInteractions: readonly CardInteraction[];
  readonly autoSelectTimeoutMs: number;
  readonly maxVisibleCards: number;
  readonly stackBehavior: 'queue' | 'replace' | 'overlay';
  readonly showSafetyNotes: boolean;
  readonly enableKeyboardNav: boolean;
  readonly enableSwipeDismiss: boolean;
  readonly showProgress: boolean;
  readonly dismissOnOutsideClick: boolean;
}

/** A full clarification card specification. */
export interface ClarificationCard {
  readonly id: string;
  readonly ambiguityType: CardAmbiguityType;
  readonly question: string;
  readonly options: readonly CardOption[];
  readonly defaultExplanation: string;
  readonly safetyNote: string;
  readonly style: CardStyle;
  readonly layout: CardLayout;
  readonly animation: CardAnimation;
  readonly interactions: readonly CardInteraction[];
  readonly accessibility: CardAccessibility;
  readonly templateId: string;
  readonly priority: number;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly context: Record<string, string>;
}

/** Template for creating clarification cards. */
export interface CardTemplate {
  readonly id: string;
  readonly name: string;
  readonly ambiguityType: CardAmbiguityType;
  readonly questionPattern: string;
  readonly optionPatterns: readonly CardOptionPattern[];
  readonly defaultExplanationPattern: string;
  readonly safetyNotePattern: string;
  readonly preferredStyle: CardStyleVariant;
  readonly preferredLayout: CardLayoutMode;
}

/** Pattern for generating card options from templates. */
export interface CardOptionPattern {
  readonly labelPattern: string;
  readonly descriptionPattern: string;
  readonly audioHintPattern: string;
  readonly defaultRisk: 'safe' | 'moderate' | 'risky';
  readonly isDefault: boolean;
}

/** Rendered card spec output for the UI layer. */
export interface RenderedCardSpec {
  readonly cardId: string;
  readonly html: string;
  readonly ariaAttributes: Record<string, string>;
  readonly eventBindings: readonly string[];
  readonly styleOverrides: Record<string, string>;
  readonly animationClasses: readonly string[];
  readonly dataAttributes: Record<string, string>;
}

/** Result of a card selection by the user. */
export interface CardSelectionResult {
  readonly cardId: string;
  readonly selectedOptionId: string;
  readonly selectionMethod: CardInteractionType;
  readonly timeToSelectMs: number;
  readonly wasDefault: boolean;
  readonly wasAutoSelected: boolean;
}

/** A stack of pending clarification cards. */
export interface CardStack {
  readonly cards: readonly ClarificationCard[];
  readonly currentIndex: number;
  readonly totalCount: number;
  readonly resolvedCount: number;
  readonly behavior: 'queue' | 'replace' | 'overlay';
}

// ---- 231 Data: Card Templates ----

const CARD_TEMPLATES: readonly CardTemplate[] = [
  {
    id: 'CT-LEX-001',
    name: 'Lexical Ambiguity — Noun',
    ambiguityType: 'lexical',
    questionPattern: 'Which "{word}" do you mean?',
    optionPatterns: [
      { labelPattern: '{option1}', descriptionPattern: '{desc1}', audioHintPattern: 'Affects {target1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{option2}', descriptionPattern: '{desc2}', audioHintPattern: 'Affects {target2}', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'We\'ll assume "{defaultWord}" unless you choose otherwise.',
    safetyNotePattern: 'Both options are non-destructive.',
    preferredStyle: 'compact',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-LEX-002',
    name: 'Lexical Ambiguity — Verb',
    ambiguityType: 'lexical',
    questionPattern: 'What should "{word}" do here?',
    optionPatterns: [
      { labelPattern: '{action1}', descriptionPattern: '{desc1}', audioHintPattern: 'Will {effect1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{action2}', descriptionPattern: '{desc2}', audioHintPattern: 'Will {effect2}', defaultRisk: 'moderate', isDefault: false },
    ],
    defaultExplanationPattern: 'Default: "{defaultAction}" (safest interpretation).',
    safetyNotePattern: 'Some options may modify existing content.',
    preferredStyle: 'expanded',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-SCOPE-001',
    name: 'Scope Ambiguity — Range',
    ambiguityType: 'scope',
    questionPattern: 'Should this apply to {narrowScope} or {wideScope}?',
    optionPatterns: [
      { labelPattern: 'Just {narrowScope}', descriptionPattern: 'Only affects the selected region', audioHintPattern: 'Changes only {narrowScope}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: 'All of {wideScope}', descriptionPattern: 'Applies to everything in scope', audioHintPattern: 'Changes entire {wideScope}', defaultRisk: 'moderate', isDefault: false },
    ],
    defaultExplanationPattern: 'We\'ll apply to {narrowScope} only (safer).',
    safetyNotePattern: 'Wider scope affects more content.',
    preferredStyle: 'side-by-side',
    preferredLayout: 'horizontal',
  },
  {
    id: 'CT-SCOPE-002',
    name: 'Scope Ambiguity — Quantifier',
    ambiguityType: 'quantifier',
    questionPattern: 'Does "{quantifier}" mean every instance or a specific one?',
    optionPatterns: [
      { labelPattern: 'Every {entity}', descriptionPattern: 'Applies globally', audioHintPattern: 'All instances affected', defaultRisk: 'moderate', isDefault: false },
      { labelPattern: 'This specific {entity}', descriptionPattern: 'Only the one in focus', audioHintPattern: 'Just the focused instance', defaultRisk: 'safe', isDefault: true },
    ],
    defaultExplanationPattern: 'Default: just this specific {entity}.',
    safetyNotePattern: '"Every" changes many things at once.',
    preferredStyle: 'expanded',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-ATT-001',
    name: 'Attachment Ambiguity — PP',
    ambiguityType: 'attachment',
    questionPattern: 'Does "{modifier}" describe {target1} or {target2}?',
    optionPatterns: [
      { labelPattern: 'Modifies {target1}', descriptionPattern: 'Changes quality of {target1}', audioHintPattern: '{target1} is modified', defaultRisk: 'safe', isDefault: true },
      { labelPattern: 'Modifies {target2}', descriptionPattern: 'Changes quality of {target2}', audioHintPattern: '{target2} is modified', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'We\'ll attach to {target1} (nearest).',
    safetyNotePattern: 'Both options affect different parts.',
    preferredStyle: 'side-by-side',
    preferredLayout: 'horizontal',
  },
  {
    id: 'CT-DEG-001',
    name: 'Degree Ambiguity — Adjective Axis',
    ambiguityType: 'degree',
    questionPattern: '"{adjective}" can mean different things. Which do you mean?',
    optionPatterns: [
      { labelPattern: '{axis1}: {meaning1}', descriptionPattern: 'Adjusts {param1}', audioHintPattern: 'Changes {param1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{axis2}: {meaning2}', descriptionPattern: 'Adjusts {param2}', audioHintPattern: 'Changes {param2}', defaultRisk: 'safe', isDefault: false },
      { labelPattern: '{axis3}: {meaning3}', descriptionPattern: 'Adjusts {param3}', audioHintPattern: 'Changes {param3}', defaultRisk: 'moderate', isDefault: false },
    ],
    defaultExplanationPattern: 'Default axis: {axis1} (most common use).',
    safetyNotePattern: 'You can undo and try another axis.',
    preferredStyle: 'expanded',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-DEG-002',
    name: 'Degree Ambiguity — Amount',
    ambiguityType: 'degree',
    questionPattern: 'How much "{adjective}" do you want?',
    optionPatterns: [
      { labelPattern: 'Subtle change', descriptionPattern: 'Small adjustment (~10-20%)', audioHintPattern: 'Barely noticeable', defaultRisk: 'safe', isDefault: true },
      { labelPattern: 'Moderate change', descriptionPattern: 'Clear difference (~30-50%)', audioHintPattern: 'Clearly audible', defaultRisk: 'safe', isDefault: false },
      { labelPattern: 'Dramatic change', descriptionPattern: 'Major shift (~60-100%)', audioHintPattern: 'Very obvious change', defaultRisk: 'moderate', isDefault: false },
    ],
    defaultExplanationPattern: 'Default: subtle (easy to increase later).',
    safetyNotePattern: 'You can always apply more later.',
    preferredStyle: 'compact',
    preferredLayout: 'horizontal',
  },
  {
    id: 'CT-REF-001',
    name: 'Reference Ambiguity — Pronoun',
    ambiguityType: 'pronoun',
    questionPattern: 'What does "{pronoun}" refer to?',
    optionPatterns: [
      { labelPattern: '{entity1}', descriptionPattern: 'Most recently mentioned', audioHintPattern: 'The {entity1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{entity2}', descriptionPattern: 'Previously discussed', audioHintPattern: 'The {entity2}', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'We\'ll use {entity1} (most recent).',
    safetyNotePattern: 'You can always re-specify after.',
    preferredStyle: 'compact',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-REF-002',
    name: 'Reference Ambiguity — Definite Description',
    ambiguityType: 'reference',
    questionPattern: 'Which "{description}" do you mean?',
    optionPatterns: [
      { labelPattern: '{match1} ({location1})', descriptionPattern: 'Found at {location1}', audioHintPattern: 'At {location1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{match2} ({location2})', descriptionPattern: 'Found at {location2}', audioHintPattern: 'At {location2}', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'We\'ll use the one at {location1}.',
    safetyNotePattern: 'Both entities exist in your project.',
    preferredStyle: 'stacked',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-TEMP-001',
    name: 'Temporal Ambiguity — When',
    ambiguityType: 'temporal',
    questionPattern: 'When should this happen: {time1} or {time2}?',
    optionPatterns: [
      { labelPattern: 'At {time1}', descriptionPattern: 'Occurs first', audioHintPattern: 'Happens at {time1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: 'At {time2}', descriptionPattern: 'Occurs later', audioHintPattern: 'Happens at {time2}', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'Default: {time1} (earliest point).',
    safetyNotePattern: 'Timing is adjustable after the fact.',
    preferredStyle: 'compact',
    preferredLayout: 'horizontal',
  },
  {
    id: 'CT-ENT-001',
    name: 'Entity Ambiguity — Track/Layer',
    ambiguityType: 'entity',
    questionPattern: 'Which layer should be affected?',
    optionPatterns: [
      { labelPattern: '{layer1}', descriptionPattern: 'Currently selected', audioHintPattern: 'Modifies {layer1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{layer2}', descriptionPattern: 'Also matches your description', audioHintPattern: 'Modifies {layer2}', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'We\'ll use {layer1} (currently selected).',
    safetyNotePattern: 'Other layers remain unchanged.',
    preferredStyle: 'floating',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-PARAM-001',
    name: 'Parameter Ambiguity — Which Knob',
    ambiguityType: 'parameter',
    questionPattern: '"{term}" maps to multiple parameters. Which one?',
    optionPatterns: [
      { labelPattern: '{param1} ({range1})', descriptionPattern: 'Controls {desc1}', audioHintPattern: 'Adjusts {param1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{param2} ({range2})', descriptionPattern: 'Controls {desc2}', audioHintPattern: 'Adjusts {param2}', defaultRisk: 'safe', isDefault: false },
      { labelPattern: '{param3} ({range3})', descriptionPattern: 'Controls {desc3}', audioHintPattern: 'Adjusts {param3}', defaultRisk: 'moderate', isDefault: false },
    ],
    defaultExplanationPattern: 'Default: {param1} (most common mapping).',
    safetyNotePattern: 'All parameters are individually undoable.',
    preferredStyle: 'expanded',
    preferredLayout: 'grid',
  },
  {
    id: 'CT-VERB-001',
    name: 'Verb Frame Ambiguity',
    ambiguityType: 'verb-frame',
    questionPattern: 'Should "{verb}" {interpretation1} or {interpretation2}?',
    optionPatterns: [
      { labelPattern: '{interpretation1}', descriptionPattern: '{desc1}', audioHintPattern: 'Will {effect1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{interpretation2}', descriptionPattern: '{desc2}', audioHintPattern: 'Will {effect2}', defaultRisk: 'moderate', isDefault: false },
    ],
    defaultExplanationPattern: 'Default: {interpretation1} (non-destructive).',
    safetyNotePattern: 'The alternative may remove content.',
    preferredStyle: 'side-by-side',
    preferredLayout: 'horizontal',
  },
  {
    id: 'CT-COORD-001',
    name: 'Coordination Ambiguity',
    ambiguityType: 'coordination',
    questionPattern: 'Does "{conjunction}" group {groupA} or {groupB}?',
    optionPatterns: [
      { labelPattern: '{groupA}', descriptionPattern: 'Treats as one group', audioHintPattern: 'Groups: {groupA}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{groupB}', descriptionPattern: 'Treats as separate', audioHintPattern: 'Groups: {groupB}', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'Default grouping: {groupA}.',
    safetyNotePattern: 'Both groupings produce valid results.',
    preferredStyle: 'expanded',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-ELLIP-001',
    name: 'Ellipsis Recovery',
    ambiguityType: 'ellipsis',
    questionPattern: 'Your instruction seems incomplete. Did you mean {completion1} or {completion2}?',
    optionPatterns: [
      { labelPattern: '{completion1}', descriptionPattern: 'Based on previous context', audioHintPattern: 'Completes as: {completion1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{completion2}', descriptionPattern: 'Alternative reading', audioHintPattern: 'Completes as: {completion2}', defaultRisk: 'safe', isDefault: false },
    ],
    defaultExplanationPattern: 'We\'ll assume "{completion1}" from context.',
    safetyNotePattern: 'You can rephrase if neither fits.',
    preferredStyle: 'toast',
    preferredLayout: 'vertical',
  },
  {
    id: 'CT-META-001',
    name: 'Metaphor Interpretation',
    ambiguityType: 'metaphor',
    questionPattern: '"{metaphor}" could mean several things musically:',
    optionPatterns: [
      { labelPattern: '{meaning1}', descriptionPattern: 'Most common usage', audioHintPattern: 'Adjusts {param1}', defaultRisk: 'safe', isDefault: true },
      { labelPattern: '{meaning2}', descriptionPattern: 'Alternative reading', audioHintPattern: 'Adjusts {param2}', defaultRisk: 'safe', isDefault: false },
      { labelPattern: '{meaning3}', descriptionPattern: 'Experimental interpretation', audioHintPattern: 'Adjusts {param3}', defaultRisk: 'moderate', isDefault: false },
    ],
    defaultExplanationPattern: 'Default: "{meaning1}" (most producers mean this).',
    safetyNotePattern: 'Metaphors are personal — tune your preferences in Settings.',
    preferredStyle: 'expanded',
    preferredLayout: 'vertical',
  },
] as const;

// ---- 231 Defaults ----

const DEFAULT_CARD_STYLE: CardStyle = {
  variant: 'compact',
  borderColor: '#E0E0E0',
  backgroundColor: '#FFFFFF',
  headerColor: '#1A1A2E',
  textColor: '#333333',
  accentColor: '#4A90D9',
  borderRadius: 8,
  elevation: 2,
  opacity: 1.0,
  maxWidth: 400,
  padding: 16,
};

const DEFAULT_CARD_LAYOUT: CardLayout = {
  mode: 'vertical',
  columns: 1,
  gap: 8,
  alignment: 'start',
  optionLayout: 'radio',
  showDescriptions: true,
  showIcons: true,
  showShortcuts: true,
};

const DEFAULT_CARD_ANIMATION: CardAnimation = {
  type: 'fade-in',
  durationMs: 200,
  delayMs: 0,
  easing: 'ease-out',
  exitType: 'fade-in',
  exitDurationMs: 150,
};

const DEFAULT_CARD_INTERACTIONS: readonly CardInteraction[] = [
  { type: 'select-option', enabled: true, timeoutMs: 0, feedbackType: 'visual', requireConfirm: false },
  { type: 'keyboard-nav', enabled: true, timeoutMs: 0, feedbackType: 'visual', requireConfirm: false },
  { type: 'hover-detail', enabled: true, timeoutMs: 300, feedbackType: 'visual', requireConfirm: false },
  { type: 'swipe-dismiss', enabled: true, timeoutMs: 0, feedbackType: 'haptic', requireConfirm: false },
  { type: 'auto-select-timeout', enabled: false, timeoutMs: 10000, feedbackType: 'visual', requireConfirm: true },
];

const DEFAULT_CARD_CONFIG: ClarificationCardConfig = {
  defaultStyle: DEFAULT_CARD_STYLE,
  defaultLayout: DEFAULT_CARD_LAYOUT,
  defaultAnimation: DEFAULT_CARD_ANIMATION,
  defaultInteractions: DEFAULT_CARD_INTERACTIONS,
  autoSelectTimeoutMs: 10000,
  maxVisibleCards: 3,
  stackBehavior: 'queue',
  showSafetyNotes: true,
  enableKeyboardNav: true,
  enableSwipeDismiss: true,
  showProgress: true,
  dismissOnOutsideClick: false,
};

// ---- 231 Style Map ----

const STYLE_VARIANT_MAP: Record<CardStyleVariant, Partial<CardStyle>> = {
  compact: { maxWidth: 320, padding: 12, borderRadius: 6, elevation: 1 },
  expanded: { maxWidth: 480, padding: 20, borderRadius: 10, elevation: 3 },
  'side-by-side': { maxWidth: 600, padding: 16, borderRadius: 8, elevation: 2 },
  stacked: { maxWidth: 400, padding: 16, borderRadius: 8, elevation: 2 },
  floating: { maxWidth: 360, padding: 16, borderRadius: 12, elevation: 4, opacity: 0.97 },
  inline: { maxWidth: 9999, padding: 8, borderRadius: 4, elevation: 0, opacity: 1 },
  modal: { maxWidth: 500, padding: 24, borderRadius: 12, elevation: 6, opacity: 1, backgroundColor: '#FFFFFF' },
  toast: { maxWidth: 360, padding: 12, borderRadius: 20, elevation: 3, opacity: 0.95 },
};

const LAYOUT_MODE_MAP: Record<CardLayoutMode, Partial<CardLayout>> = {
  vertical: { mode: 'vertical', columns: 1, optionLayout: 'radio' },
  horizontal: { mode: 'horizontal', columns: 2, optionLayout: 'chips' },
  grid: { mode: 'grid', columns: 3, optionLayout: 'grid' },
  carousel: { mode: 'carousel', columns: 1, optionLayout: 'list' },
  accordion: { mode: 'accordion', columns: 1, optionLayout: 'list' },
};

// ---- 231 Functions ----

/** Create a new clarification card from parameters. */
export function createClarificationCard(
  id: string,
  ambiguityType: CardAmbiguityType,
  question: string,
  options: readonly CardOption[],
  defaultExplanation: string,
  safetyNote: string,
  config?: Partial<ClarificationCardConfig>,
): ClarificationCard {
  const resolvedConfig = config
    ? { ...DEFAULT_CARD_CONFIG, ...config }
    : DEFAULT_CARD_CONFIG;

  const accessibility: CardAccessibility = {
    role: 'dialog',
    ariaLabel: `Clarification: ${question}`,
    ariaDescribedBy: `card-desc-${id}`,
    ariaLive: 'polite',
    tabIndex: 0,
    focusTrapEnabled: resolvedConfig.defaultStyle.variant === 'modal',
    screenReaderDescription: `Ambiguity detected: ${question}. ${options.length} options available. ${defaultExplanation}`,
    announceOnAppear: true,
    keyboardShortcutsDescription: 'Use arrow keys to navigate options, Enter to select, Escape to dismiss.',
  };

  return {
    id,
    ambiguityType,
    question,
    options,
    defaultExplanation,
    safetyNote,
    style: resolvedConfig.defaultStyle,
    layout: resolvedConfig.defaultLayout,
    animation: resolvedConfig.defaultAnimation,
    interactions: resolvedConfig.defaultInteractions,
    accessibility,
    templateId: '',
    priority: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60000,
    context: {},
  };
}

/** Render a card to a UI specification object. */
export function renderCardToSpec(card: ClarificationCard): RenderedCardSpec {
  const optionHtmlParts = card.options.map((opt, idx) => {
    const checkedAttr = opt.isDefault ? ' checked' : '';
    const riskClass = `risk-${opt.risk}`;
    return `<div class="card-option ${riskClass}" data-option-id="${opt.id}">` +
      `<input type="radio" name="card-${card.id}" id="opt-${card.id}-${idx}"${checkedAttr} />` +
      `<label for="opt-${card.id}-${idx}">` +
      `<span class="option-icon">${opt.iconName}</span>` +
      `<span class="option-label">${opt.label}</span>` +
      `<span class="option-desc">${opt.description}</span>` +
      `<span class="option-shortcut">${opt.shortcut}</span>` +
      `</label></div>`;
  });

  const html = `<div class="clarification-card card-${card.style.variant}" id="${card.id}" role="${card.accessibility.role}">` +
    `<div class="card-header"><h3>${card.question}</h3></div>` +
    `<div class="card-body">${optionHtmlParts.join('')}</div>` +
    `<div class="card-footer">` +
    `<p class="default-explanation">${card.defaultExplanation}</p>` +
    (card.safetyNote ? `<p class="safety-note">${card.safetyNote}</p>` : '') +
    `</div>` +
    `<div class="card-actions">` +
    `<button class="btn-confirm" aria-label="Confirm selection">Confirm</button>` +
    `<button class="btn-skip" aria-label="Skip and use default">Skip</button>` +
    `</div></div>`;

  return {
    cardId: card.id,
    html,
    ariaAttributes: {
      'aria-label': card.accessibility.ariaLabel,
      'aria-describedby': card.accessibility.ariaDescribedBy,
      'aria-live': card.accessibility.ariaLive,
      'role': card.accessibility.role,
      'tabindex': String(card.accessibility.tabIndex),
    },
    eventBindings: [
      'click:.card-option',
      'keydown:ArrowUp,ArrowDown,Enter,Escape',
      'click:.btn-confirm',
      'click:.btn-skip',
      'mouseenter:.card-option',
      'touchstart:.card-body',
    ],
    styleOverrides: {
      '--card-border-color': card.style.borderColor,
      '--card-bg': card.style.backgroundColor,
      '--card-header-color': card.style.headerColor,
      '--card-text-color': card.style.textColor,
      '--card-accent': card.style.accentColor,
      '--card-radius': `${card.style.borderRadius}px`,
      '--card-elevation': String(card.style.elevation),
      '--card-max-width': `${card.style.maxWidth}px`,
      '--card-padding': `${card.style.padding}px`,
    },
    animationClasses: [
      `anim-enter-${card.animation.type}`,
      `anim-exit-${card.animation.exitType}`,
      `anim-duration-${card.animation.durationMs}`,
    ],
    dataAttributes: {
      'data-ambiguity-type': card.ambiguityType,
      'data-template-id': card.templateId,
      'data-priority': String(card.priority),
      'data-option-count': String(card.options.length),
    },
  };
}

/** Record a user's option selection on a card. */
export function selectOption(
  card: ClarificationCard,
  optionId: string,
  method: CardInteractionType,
  elapsedMs: number,
): CardSelectionResult {
  const selectedOption = card.options.find(o => o.id === optionId);
  const wasDefault = selectedOption ? selectedOption.isDefault : false;

  return {
    cardId: card.id,
    selectedOptionId: optionId,
    selectionMethod: method,
    timeToSelectMs: elapsedMs,
    wasDefault,
    wasAutoSelected: method === 'auto-select-timeout',
  };
}

/** Retrieve a card template by ambiguity type. */
export function getCardTemplate(ambiguityType: CardAmbiguityType): CardTemplate | undefined {
  return CARD_TEMPLATES.find(t => t.ambiguityType === ambiguityType);
}

/** Format card accessibility information for screen readers. */
export function formatCardForAccessibility(card: ClarificationCard): string {
  const optionDescriptions = card.options.map((opt, idx) => {
    const defaultMarker = opt.isDefault ? ' (recommended)' : '';
    return `Option ${idx + 1}: ${opt.label}${defaultMarker} — ${opt.description}. Risk: ${opt.risk}.`;
  });

  const lines = [
    `Clarification needed: ${card.question}`,
    `Type: ${card.ambiguityType} ambiguity.`,
    `${card.options.length} options available:`,
    ...optionDescriptions,
    `Default: ${card.defaultExplanation}`,
    card.safetyNote ? `Note: ${card.safetyNote}` : '',
    card.accessibility.keyboardShortcutsDescription,
  ];

  return lines.filter(l => l.length > 0).join('\n');
}

/** Generate animation transition class strings for a card. */
export function animateCardTransition(
  card: ClarificationCard,
  phase: 'enter' | 'exit' | 'update',
): { classes: readonly string[]; durationMs: number; easing: string } {
  if (phase === 'enter') {
    return {
      classes: [`anim-${card.animation.type}`, 'anim-entering'],
      durationMs: card.animation.durationMs,
      easing: card.animation.easing,
    };
  }
  if (phase === 'exit') {
    return {
      classes: [`anim-${card.animation.exitType}`, 'anim-exiting'],
      durationMs: card.animation.exitDurationMs,
      easing: card.animation.easing,
    };
  }
  return {
    classes: ['anim-morph', 'anim-updating'],
    durationMs: Math.round(card.animation.durationMs * 0.5),
    easing: card.animation.easing,
  };
}

/** Get the layout spec for a card based on its style variant. */
export function getCardLayout(variant: CardStyleVariant): CardLayout {
  const overrides = STYLE_VARIANT_MAP[variant];
  const layoutMode: CardLayoutMode =
    variant === 'side-by-side' ? 'horizontal' :
    variant === 'stacked' ? 'vertical' :
    variant === 'compact' ? 'vertical' :
    variant === 'expanded' ? 'vertical' :
    'vertical';
  const layoutOverrides = LAYOUT_MODE_MAP[layoutMode];
  return {
    ...DEFAULT_CARD_LAYOUT,
    ...layoutOverrides,
    ...(overrides && typeof overrides.maxWidth === 'number' ? {} : {}),
  };
}

/** Render multiple cards in batch. */
export function batchRenderCards(cards: readonly ClarificationCard[]): readonly RenderedCardSpec[] {
  return cards.map(card => renderCardToSpec(card));
}

/** Dismiss a card, returning the updated stack. */
export function dismissCard(stack: CardStack, cardId: string): CardStack {
  const filteredCards = stack.cards.filter(c => c.id !== cardId);
  const newIndex = stack.currentIndex >= filteredCards.length
    ? Math.max(0, filteredCards.length - 1)
    : stack.currentIndex;
  return {
    cards: filteredCards,
    currentIndex: newIndex,
    totalCount: stack.totalCount,
    resolvedCount: stack.resolvedCount + 1,
    behavior: stack.behavior,
  };
}

/** Get all interaction types enabled for a card. */
export function getCardInteractions(card: ClarificationCard): readonly CardInteractionType[] {
  return card.interactions
    .filter(i => i.enabled)
    .map(i => i.type);
}

/** Apply the chosen option, returning an action descriptor. */
export function applyCardChoice(
  card: ClarificationCard,
  selection: CardSelectionResult,
): { action: string; params: Record<string, string>; confidence: number } {
  const selectedOption = card.options.find(o => o.id === selection.selectedOptionId);
  const label = selectedOption ? selectedOption.label : 'unknown';
  const risk = selectedOption ? selectedOption.risk : 'safe';

  const confidence = risk === 'safe' ? 0.95 : risk === 'moderate' ? 0.8 : 0.6;

  return {
    action: `resolve-${card.ambiguityType}`,
    params: {
      cardId: card.id,
      selectedOption: selection.selectedOptionId,
      selectedLabel: label,
      method: selection.selectionMethod,
      timeMs: String(selection.timeToSelectMs),
    },
    confidence,
  };
}

/** Create a new card stack for managing multiple clarification cards. */
export function createCardStack(
  cards: readonly ClarificationCard[],
  behavior: 'queue' | 'replace' | 'overlay',
): CardStack {
  return {
    cards,
    currentIndex: 0,
    totalCount: cards.length,
    resolvedCount: 0,
    behavior,
  };
}

// ---- 231 Internal Helpers ----

function _resolveStyleForVariant(variant: CardStyleVariant): CardStyle {
  const overrides = STYLE_VARIANT_MAP[variant];
  return {
    ...DEFAULT_CARD_STYLE,
    variant,
    ...(overrides.borderRadius !== undefined ? { borderRadius: overrides.borderRadius } : {}),
    ...(overrides.elevation !== undefined ? { elevation: overrides.elevation } : {}),
    ...(overrides.maxWidth !== undefined ? { maxWidth: overrides.maxWidth } : {}),
    ...(overrides.padding !== undefined ? { padding: overrides.padding } : {}),
    ...(overrides.opacity !== undefined ? { opacity: overrides.opacity } : {}),
    ...(overrides.backgroundColor !== undefined ? { backgroundColor: overrides.backgroundColor } : {}),
  };
}

/** Ensure all templates are well-formed — validation utility. */
function _validateTemplates(templates: readonly CardTemplate[]): readonly string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const tmpl of templates) {
    if (seenIds.has(tmpl.id)) {
      errors.push(`Duplicate template ID: ${tmpl.id}`);
    }
    seenIds.add(tmpl.id);

    if (tmpl.optionPatterns.length === 0) {
      errors.push(`Template ${tmpl.id} has no option patterns`);
    }

    const defaultCount = tmpl.optionPatterns.filter(p => p.isDefault).length;
    if (defaultCount !== 1) {
      errors.push(`Template ${tmpl.id} has ${defaultCount} defaults (expected 1)`);
    }

    if (!tmpl.questionPattern.includes('{')) {
      errors.push(`Template ${tmpl.id} question has no placeholders`);
    }
  }

  return errors;
}

// Expose template count for testing
export const CLARIFICATION_CARD_TEMPLATE_COUNT = CARD_TEMPLATES.length;

// Expose config for external use
export const DEFAULT_CLARIFICATION_CARD_CONFIG = DEFAULT_CARD_CONFIG;

// Expose validation
export function validateCardTemplates(): readonly string[] {
  return _validateTemplates(CARD_TEMPLATES);
}

// Expose style resolver
export function resolveCardStyle(variant: CardStyleVariant): CardStyle {
  return _resolveStyleForVariant(variant);
}


// ===================== STEP 232: CONTEXT STRIP UI =====================

// ---- 232 Types ----

/** Segment types for the context strip. */
export type ContextSegmentType =
  | 'board'
  | 'deck'
  | 'section'
  | 'range'
  | 'layer'
  | 'entity'
  | 'parameter'
  | 'effect';

/** Icon set for segment types. */
export type SegmentIconName =
  | 'icon-board'
  | 'icon-deck'
  | 'icon-section'
  | 'icon-range'
  | 'icon-layer'
  | 'icon-entity'
  | 'icon-parameter'
  | 'icon-effect';

/** Click behavior when a segment is activated. */
export type SegmentClickBehavior =
  | 'navigate'
  | 'expand'
  | 'select'
  | 'focus'
  | 'filter'
  | 'zoom'
  | 'info'
  | 'none';

/** Visual state of a segment. */
export type SegmentVisualState =
  | 'active'
  | 'inactive'
  | 'hovered'
  | 'focused'
  | 'collapsed'
  | 'highlighted'
  | 'dimmed'
  | 'error';

/** Animation for strip transitions. */
export type StripAnimationType =
  | 'slide'
  | 'fade'
  | 'morph'
  | 'pop'
  | 'none';

/** Pronoun resolution preview. */
export interface PronounPreview {
  readonly pronoun: string;
  readonly resolvesTo: string;
  readonly entityType: string;
  readonly confidence: number;
  readonly alternativeResolutions: readonly PronounAlternative[];
  readonly displayHint: string;
}

/** An alternative pronoun resolution. */
export interface PronounAlternative {
  readonly entityId: string;
  readonly entityName: string;
  readonly entityType: string;
  readonly confidence: number;
  readonly reason: string;
}

/** A single segment in the context strip. */
export interface ContextSegment {
  readonly id: string;
  readonly segmentType: ContextSegmentType;
  readonly label: string;
  readonly sublabel: string;
  readonly iconName: SegmentIconName;
  readonly color: string;
  readonly backgroundColor: string;
  readonly clickBehavior: SegmentClickBehavior;
  readonly visualState: SegmentVisualState;
  readonly depth: number;
  readonly entityId: string;
  readonly metadata: Record<string, string>;
  readonly tooltip: string;
}

/** Configuration for the context strip. */
export interface StripConfig {
  readonly maxSegments: number;
  readonly collapseBehavior: 'ellipsis' | 'scroll' | 'overflow' | 'priority';
  readonly showPronounPreviews: boolean;
  readonly showBreadcrumbSeparator: boolean;
  readonly separatorChar: string;
  readonly animationType: StripAnimationType;
  readonly animationDurationMs: number;
  readonly highlightActiveSegment: boolean;
  readonly showTooltips: boolean;
  readonly orientation: 'horizontal' | 'vertical';
  readonly theme: 'light' | 'dark' | 'auto';
  readonly compactMode: boolean;
  readonly accessibilityMode: boolean;
}

/** The full context strip state. */
export interface ContextStrip {
  readonly id: string;
  readonly segments: readonly ContextSegment[];
  readonly pronounPreviews: readonly PronounPreview[];
  readonly config: StripConfig;
  readonly activeSegmentId: string;
  readonly breadcrumbPath: string;
  readonly lastUpdated: number;
  readonly visible: boolean;
  readonly collapsed: boolean;
}

/** Rendered context strip output for the UI. */
export interface RenderedStripSpec {
  readonly stripId: string;
  readonly segmentSpecs: readonly RenderedSegmentSpec[];
  readonly pronounPreviewSpecs: readonly RenderedPronounSpec[];
  readonly breadcrumb: string;
  readonly ariaLabel: string;
  readonly cssClasses: readonly string[];
}

/** Rendered segment spec. */
export interface RenderedSegmentSpec {
  readonly segmentId: string;
  readonly html: string;
  readonly cssClasses: readonly string[];
  readonly ariaAttributes: Record<string, string>;
}

/** Rendered pronoun preview spec. */
export interface RenderedPronounSpec {
  readonly pronoun: string;
  readonly displayText: string;
  readonly tooltipText: string;
  readonly cssClass: string;
}

/** Strip layout configuration for different contexts. */
export interface StripLayoutConfig {
  readonly name: string;
  readonly description: string;
  readonly maxSegments: number;
  readonly showPronounPreviews: boolean;
  readonly compactMode: boolean;
  readonly orientation: 'horizontal' | 'vertical';
  readonly separatorChar: string;
  readonly collapseAfter: number;
}

// ---- 232 Data: Segment Type Info ----

const SEGMENT_TYPE_INFO: Record<ContextSegmentType, {
  icon: SegmentIconName;
  color: string;
  backgroundColor: string;
  defaultClickBehavior: SegmentClickBehavior;
  description: string;
}> = {
  board: {
    icon: 'icon-board',
    color: '#1A73E8',
    backgroundColor: '#E8F0FE',
    defaultClickBehavior: 'navigate',
    description: 'The project or composition board',
  },
  deck: {
    icon: 'icon-deck',
    color: '#E8710A',
    backgroundColor: '#FEF3E8',
    defaultClickBehavior: 'navigate',
    description: 'A card deck or track group',
  },
  section: {
    icon: 'icon-section',
    color: '#0B8043',
    backgroundColor: '#E6F4EA',
    defaultClickBehavior: 'focus',
    description: 'A section of the composition (verse, chorus, etc.)',
  },
  range: {
    icon: 'icon-range',
    color: '#9334E6',
    backgroundColor: '#F3E8FD',
    defaultClickBehavior: 'select',
    description: 'A time range or selection',
  },
  layer: {
    icon: 'icon-layer',
    color: '#D93025',
    backgroundColor: '#FCE8E6',
    defaultClickBehavior: 'focus',
    description: 'A layer or track within a section',
  },
  entity: {
    icon: 'icon-entity',
    color: '#185ABC',
    backgroundColor: '#E8EAF6',
    defaultClickBehavior: 'info',
    description: 'A specific musical entity (instrument, clip, etc.)',
  },
  parameter: {
    icon: 'icon-parameter',
    color: '#137333',
    backgroundColor: '#E6F4EA',
    defaultClickBehavior: 'expand',
    description: 'A parameter or control value',
  },
  effect: {
    icon: 'icon-effect',
    color: '#B06000',
    backgroundColor: '#FEF7E0',
    defaultClickBehavior: 'expand',
    description: 'An audio effect or processor',
  },
};

// ---- 232 Data: Strip Layout Configurations ----

const STRIP_LAYOUT_CONFIGS: readonly StripLayoutConfig[] = [
  { name: 'default', description: 'Standard horizontal strip', maxSegments: 8, showPronounPreviews: true, compactMode: false, orientation: 'horizontal', separatorChar: ' > ', collapseAfter: 6 },
  { name: 'compact', description: 'Minimal strip for small screens', maxSegments: 4, showPronounPreviews: false, compactMode: true, orientation: 'horizontal', separatorChar: '/', collapseAfter: 3 },
  { name: 'vertical', description: 'Sidebar vertical strip', maxSegments: 12, showPronounPreviews: true, compactMode: false, orientation: 'vertical', separatorChar: '', collapseAfter: 8 },
  { name: 'breadcrumb', description: 'Traditional breadcrumb style', maxSegments: 6, showPronounPreviews: false, compactMode: false, orientation: 'horizontal', separatorChar: ' / ', collapseAfter: 4 },
  { name: 'pill', description: 'Pill-shaped segments', maxSegments: 5, showPronounPreviews: true, compactMode: false, orientation: 'horizontal', separatorChar: '', collapseAfter: 4 },
  { name: 'tabs', description: 'Tab-style segments', maxSegments: 6, showPronounPreviews: false, compactMode: false, orientation: 'horizontal', separatorChar: '', collapseAfter: 5 },
  { name: 'tree', description: 'Tree-style indented segments', maxSegments: 20, showPronounPreviews: true, compactMode: false, orientation: 'vertical', separatorChar: '', collapseAfter: 10 },
  { name: 'floating-bar', description: 'Floating bar overlay', maxSegments: 5, showPronounPreviews: true, compactMode: true, orientation: 'horizontal', separatorChar: ' > ', collapseAfter: 4 },
  { name: 'sidebar-full', description: 'Full sidebar with details', maxSegments: 15, showPronounPreviews: true, compactMode: false, orientation: 'vertical', separatorChar: '', collapseAfter: 12 },
  { name: 'mini', description: 'Minimal icon-only strip', maxSegments: 8, showPronounPreviews: false, compactMode: true, orientation: 'horizontal', separatorChar: '', collapseAfter: 6 },
  { name: 'modal-header', description: 'Strip in modal dialog header', maxSegments: 4, showPronounPreviews: false, compactMode: true, orientation: 'horizontal', separatorChar: ' > ', collapseAfter: 3 },
  { name: 'inspector', description: 'Inspector panel strip', maxSegments: 10, showPronounPreviews: true, compactMode: false, orientation: 'vertical', separatorChar: '', collapseAfter: 7 },
  { name: 'command-palette', description: 'Strip in command palette', maxSegments: 3, showPronounPreviews: false, compactMode: true, orientation: 'horizontal', separatorChar: ' > ', collapseAfter: 3 },
  { name: 'focus-mode', description: 'Focus mode minimal strip', maxSegments: 2, showPronounPreviews: false, compactMode: true, orientation: 'horizontal', separatorChar: ' > ', collapseAfter: 2 },
  { name: 'editing-context', description: 'Full context for editing', maxSegments: 10, showPronounPreviews: true, compactMode: false, orientation: 'horizontal', separatorChar: ' > ', collapseAfter: 6 },
  { name: 'mobile', description: 'Mobile-optimized strip', maxSegments: 3, showPronounPreviews: false, compactMode: true, orientation: 'horizontal', separatorChar: '/', collapseAfter: 2 },
  { name: 'accessibility', description: 'High-contrast accessible strip', maxSegments: 8, showPronounPreviews: true, compactMode: false, orientation: 'horizontal', separatorChar: ' > ', collapseAfter: 6 },
  { name: 'narration', description: 'Narration/voice context display', maxSegments: 4, showPronounPreviews: true, compactMode: false, orientation: 'horizontal', separatorChar: ' in ', collapseAfter: 3 },
  { name: 'debug', description: 'Debug mode with full detail', maxSegments: 30, showPronounPreviews: true, compactMode: false, orientation: 'vertical', separatorChar: '', collapseAfter: 25 },
  { name: 'status-bar', description: 'Status bar integration', maxSegments: 4, showPronounPreviews: false, compactMode: true, orientation: 'horizontal', separatorChar: ' | ', collapseAfter: 3 },
];

// ---- 232 Default Config ----

const DEFAULT_STRIP_CONFIG: StripConfig = {
  maxSegments: 8,
  collapseBehavior: 'ellipsis',
  showPronounPreviews: true,
  showBreadcrumbSeparator: true,
  separatorChar: ' > ',
  animationType: 'slide',
  animationDurationMs: 200,
  highlightActiveSegment: true,
  showTooltips: true,
  orientation: 'horizontal',
  theme: 'auto',
  compactMode: false,
  accessibilityMode: false,
};

// ---- 232 Functions ----

/** Create a new context strip. */
export function createContextStrip(
  id: string,
  config?: Partial<StripConfig>,
): ContextStrip {
  const resolvedConfig: StripConfig = config
    ? {
        ...DEFAULT_STRIP_CONFIG,
        ...(config.maxSegments !== undefined ? { maxSegments: config.maxSegments } : {}),
        ...(config.collapseBehavior !== undefined ? { collapseBehavior: config.collapseBehavior } : {}),
        ...(config.showPronounPreviews !== undefined ? { showPronounPreviews: config.showPronounPreviews } : {}),
        ...(config.showBreadcrumbSeparator !== undefined ? { showBreadcrumbSeparator: config.showBreadcrumbSeparator } : {}),
        ...(config.separatorChar !== undefined ? { separatorChar: config.separatorChar } : {}),
        ...(config.animationType !== undefined ? { animationType: config.animationType } : {}),
        ...(config.animationDurationMs !== undefined ? { animationDurationMs: config.animationDurationMs } : {}),
        ...(config.highlightActiveSegment !== undefined ? { highlightActiveSegment: config.highlightActiveSegment } : {}),
        ...(config.showTooltips !== undefined ? { showTooltips: config.showTooltips } : {}),
        ...(config.orientation !== undefined ? { orientation: config.orientation } : {}),
        ...(config.theme !== undefined ? { theme: config.theme } : {}),
        ...(config.compactMode !== undefined ? { compactMode: config.compactMode } : {}),
        ...(config.accessibilityMode !== undefined ? { accessibilityMode: config.accessibilityMode } : {}),
      }
    : DEFAULT_STRIP_CONFIG;

  return {
    id,
    segments: [],
    pronounPreviews: [],
    config: resolvedConfig,
    activeSegmentId: '',
    breadcrumbPath: '',
    lastUpdated: Date.now(),
    visible: true,
    collapsed: false,
  };
}

/** Add a segment to the context strip. */
export function addSegment(
  strip: ContextStrip,
  segmentType: ContextSegmentType,
  label: string,
  entityId: string,
  sublabel?: string,
): ContextStrip {
  const typeInfo = SEGMENT_TYPE_INFO[segmentType];
  const newSegment: ContextSegment = {
    id: `seg-${strip.id}-${strip.segments.length}`,
    segmentType,
    label,
    sublabel: sublabel ?? '',
    iconName: typeInfo.icon,
    color: typeInfo.color,
    backgroundColor: typeInfo.backgroundColor,
    clickBehavior: typeInfo.defaultClickBehavior,
    visualState: 'active',
    depth: strip.segments.length,
    entityId,
    metadata: {},
    tooltip: `${typeInfo.description}: ${label}`,
  };

  const newSegments = [...strip.segments, newSegment];
  const trimmedSegments = newSegments.length > strip.config.maxSegments
    ? newSegments.slice(newSegments.length - strip.config.maxSegments)
    : newSegments;

  const breadcrumb = trimmedSegments.map(s => s.label).join(strip.config.separatorChar);

  return {
    ...strip,
    segments: trimmedSegments,
    activeSegmentId: newSegment.id,
    breadcrumbPath: breadcrumb,
    lastUpdated: Date.now(),
  };
}

/** Remove a segment from the context strip. */
export function removeSegment(strip: ContextStrip, segmentId: string): ContextStrip {
  const filtered = strip.segments.filter(s => s.id !== segmentId);
  const lastSeg = filtered[filtered.length - 1];
  const newActiveId = lastSeg ? lastSeg.id : '';
  const breadcrumb = filtered.map(s => s.label).join(strip.config.separatorChar);

  return {
    ...strip,
    segments: filtered,
    activeSegmentId: newActiveId,
    breadcrumbPath: breadcrumb,
    lastUpdated: Date.now(),
  };
}

/** Update a segment's properties. */
export function updateSegment(
  strip: ContextStrip,
  segmentId: string,
  updates: Partial<Pick<ContextSegment, 'label' | 'sublabel' | 'visualState' | 'clickBehavior'>>,
): ContextStrip {
  const newSegments = strip.segments.map(seg => {
    if (seg.id !== segmentId) return seg;
    return {
      ...seg,
      ...(updates.label !== undefined ? { label: updates.label } : {}),
      ...(updates.sublabel !== undefined ? { sublabel: updates.sublabel } : {}),
      ...(updates.visualState !== undefined ? { visualState: updates.visualState } : {}),
      ...(updates.clickBehavior !== undefined ? { clickBehavior: updates.clickBehavior } : {}),
    };
  });

  const breadcrumb = newSegments.map(s => s.label).join(strip.config.separatorChar);

  return {
    ...strip,
    segments: newSegments,
    breadcrumbPath: breadcrumb,
    lastUpdated: Date.now(),
  };
}

/** Get pronoun previews for the current strip context. */
export function getPronounPreviews(strip: ContextStrip): readonly PronounPreview[] {
  const pronouns = ['it', 'this', 'that', 'there', 'here', 'them'];
  const previews: PronounPreview[] = [];

  for (const pronoun of pronouns) {
    const lastSeg = strip.segments[strip.segments.length - 1];
    if (!lastSeg) continue;

    const alternatives: PronounAlternative[] = strip.segments
      .filter(s => s.id !== lastSeg.id)
      .slice(-3)
      .map(s => ({
        entityId: s.entityId,
        entityName: s.label,
        entityType: s.segmentType,
        confidence: Math.max(0.1, 0.8 - (strip.segments.indexOf(s) * 0.15)),
        reason: `Previously in context (depth ${s.depth})`,
      }));

    let displayHint: string;
    if (pronoun === 'it' || pronoun === 'this') {
      displayHint = `"${pronoun}" -> ${lastSeg.label} (${lastSeg.segmentType})`;
    } else if (pronoun === 'there' || pronoun === 'here') {
      const locSeg = strip.segments.find(s => s.segmentType === 'section' || s.segmentType === 'range');
      displayHint = locSeg
        ? `"${pronoun}" -> ${locSeg.label} (${locSeg.segmentType})`
        : `"${pronoun}" -> ${lastSeg.label} (${lastSeg.segmentType})`;
    } else if (pronoun === 'that') {
      const prevSeg = strip.segments[strip.segments.length - 2];
      displayHint = prevSeg
        ? `"${pronoun}" -> ${prevSeg.label} (${prevSeg.segmentType})`
        : `"${pronoun}" -> ${lastSeg.label} (${lastSeg.segmentType})`;
    } else {
      displayHint = `"${pronoun}" -> ${lastSeg.label} (${lastSeg.segmentType})`;
    }

    previews.push({
      pronoun,
      resolvesTo: lastSeg.label,
      entityType: lastSeg.segmentType,
      confidence: 0.9,
      alternativeResolutions: alternatives,
      displayHint,
    });
  }

  return previews;
}

/** Format the strip as a display string. */
export function formatStripForDisplay(strip: ContextStrip): string {
  if (strip.segments.length === 0) return '(no context)';

  if (strip.collapsed) {
    const first = strip.segments[0];
    const last = strip.segments[strip.segments.length - 1];
    if (first && last && first.id !== last.id) {
      return `${first.label} ... ${last.label}`;
    }
    return first ? first.label : '(no context)';
  }

  return strip.breadcrumbPath;
}

/** Get style properties for a segment type. */
export function getSegmentStyle(segmentType: ContextSegmentType): {
  color: string;
  backgroundColor: string;
  icon: SegmentIconName;
  description: string;
} {
  const info = SEGMENT_TYPE_INFO[segmentType];
  return {
    color: info.color,
    backgroundColor: info.backgroundColor,
    icon: info.icon,
    description: info.description,
  };
}

/** Handle a click on a segment, returning an action. */
export function handleSegmentClick(
  strip: ContextStrip,
  segmentId: string,
): { action: SegmentClickBehavior; segmentId: string; entityId: string; segmentType: ContextSegmentType } | undefined {
  const segment = strip.segments.find(s => s.id === segmentId);
  if (!segment) return undefined;
  return {
    action: segment.clickBehavior,
    segmentId: segment.id,
    entityId: segment.entityId,
    segmentType: segment.segmentType,
  };
}

/** Get animation configuration for strip update. */
export function animateStripUpdate(
  strip: ContextStrip,
  _changeType: 'add' | 'remove' | 'update' | 'reorder',
): { animationClass: string; durationMs: number } {
  return {
    animationClass: `strip-anim-${strip.config.animationType}`,
    durationMs: strip.config.animationDurationMs,
  };
}

/** Get the breadcrumb string for the strip. */
export function getStripBreadcrumb(strip: ContextStrip): string {
  return strip.breadcrumbPath;
}

/** Collapse the strip to its minimal form. */
export function collapseStrip(strip: ContextStrip): ContextStrip {
  return {
    ...strip,
    collapsed: true,
    lastUpdated: Date.now(),
  };
}

/** Expand the strip to its full form. */
export function expandStrip(strip: ContextStrip): ContextStrip {
  return {
    ...strip,
    collapsed: false,
    lastUpdated: Date.now(),
  };
}

/** Highlight a segment as active, dimming others. */
export function highlightActiveSegment(strip: ContextStrip, segmentId: string): ContextStrip {
  const newSegments = strip.segments.map(seg => ({
    ...seg,
    visualState: (seg.id === segmentId ? 'highlighted' : 'dimmed') as SegmentVisualState,
  }));

  return {
    ...strip,
    segments: newSegments,
    activeSegmentId: segmentId,
    lastUpdated: Date.now(),
  };
}

// ---- 232 Exports ----

export const CONTEXT_STRIP_LAYOUT_COUNT = STRIP_LAYOUT_CONFIGS.length;
export const CONTEXT_SEGMENT_TYPE_COUNT = Object.keys(SEGMENT_TYPE_INFO).length;

export function getStripLayoutConfig(name: string): StripLayoutConfig | undefined {
  return STRIP_LAYOUT_CONFIGS.find(c => c.name === name);
}

export function getAllStripLayoutNames(): readonly string[] {
  return STRIP_LAYOUT_CONFIGS.map(c => c.name);
}

export function getSegmentTypeInfo(segmentType: ContextSegmentType): {
  icon: SegmentIconName;
  color: string;
  backgroundColor: string;
  defaultClickBehavior: SegmentClickBehavior;
  description: string;
} {
  return SEGMENT_TYPE_INFO[segmentType];
}


// ===================== STEP 233: CONVERSATION MEMORY UI =====================

// ---- 233 Types ----

/** Type of memory entry. */
export type MemoryEntryType =
  | 'edit-command'
  | 'question'
  | 'exploration'
  | 'clarification'
  | 'undo'
  | 'redo'
  | 'bookmark-action'
  | 'system-note'
  | 'error'
  | 'suggestion'
  | 'confirmation'
  | 'preference-change';

/** View mode for conversation memory. */
export type MemoryViewMode =
  | 'timeline'
  | 'compact'
  | 'detailed'
  | 'diff-only'
  | 'cpl-only'
  | 'bookmarks-only'
  | 'errors-only'
  | 'edits-only'
  | 'questions-only'
  | 'search-results'
  | 'grouped-by-scope'
  | 'grouped-by-entity';

/** Search field for memory search. */
export type MemorySearchField =
  | 'raw-text'
  | 'cpl-content'
  | 'entity-reference'
  | 'bookmark-name'
  | 'tag'
  | 'all';

/** A diff representing what changed in an edit. */
export interface MemoryDiff {
  readonly entityId: string;
  readonly entityName: string;
  readonly parameterName: string;
  readonly oldValue: string;
  readonly newValue: string;
  readonly changeType: 'set' | 'add' | 'remove' | 'modify';
}

/** A single memory entry representing one turn in the conversation. */
export interface MemoryEntry {
  readonly id: string;
  readonly turnNumber: number;
  readonly entryType: MemoryEntryType;
  readonly timestamp: number;
  readonly userInput: string;
  readonly cplRepresentation: string;
  readonly planDescription: string;
  readonly diffs: readonly MemoryDiff[];
  readonly entityReferences: readonly string[];
  readonly scope: string;
  readonly tags: readonly string[];
  readonly isBookmarked: boolean;
  readonly bookmarkName: string;
  readonly executionStatus: 'pending' | 'executed' | 'undone' | 'failed';
  readonly metadata: Record<string, string>;
}

/** A bookmark attached to a memory entry. */
export interface MemoryBookmark {
  readonly id: string;
  readonly entryId: string;
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly createdAt: number;
  readonly color: string;
  readonly icon: string;
}

/** Filter for memory queries. */
export interface MemoryFilter {
  readonly entryTypes: readonly MemoryEntryType[];
  readonly scope: string;
  readonly timeRangeStart: number;
  readonly timeRangeEnd: number;
  readonly bookmarkedOnly: boolean;
  readonly searchText: string;
  readonly searchField: MemorySearchField;
  readonly entityReferences: readonly string[];
  readonly tags: readonly string[];
  readonly executionStatus: readonly string[];
  readonly maxResults: number;
}

/** Configuration for conversation memory. */
export interface MemoryConfig {
  readonly maxEntries: number;
  readonly defaultViewMode: MemoryViewMode;
  readonly showCplRepresentation: boolean;
  readonly showDiffs: boolean;
  readonly showPlanDescription: boolean;
  readonly enableBookmarks: boolean;
  readonly enableSearch: boolean;
  readonly enableExport: boolean;
  readonly enableImport: boolean;
  readonly autoBookmarkErrors: boolean;
  readonly compactDiffThreshold: number;
  readonly timestampFormat: 'relative' | 'absolute' | 'both';
}

/** A view configuration for displaying memory. */
export interface MemoryView {
  readonly mode: MemoryViewMode;
  readonly entries: readonly MemoryEntry[];
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly scrollPosition: number;
  readonly selectedEntryId: string;
  readonly expandedEntryIds: readonly string[];
}

/** Statistics about the conversation memory. */
export interface MemoryStats {
  readonly totalEntries: number;
  readonly editCount: number;
  readonly questionCount: number;
  readonly undoCount: number;
  readonly errorCount: number;
  readonly bookmarkCount: number;
  readonly uniqueEntities: number;
  readonly uniqueScopes: number;
  readonly timeSpanMs: number;
  readonly averageTurnDurationMs: number;
}

/** Export format for memory. */
export interface MemoryExport {
  readonly version: string;
  readonly exportedAt: number;
  readonly entries: readonly MemoryEntry[];
  readonly bookmarks: readonly MemoryBookmark[];
  readonly stats: MemoryStats;
}

/** The full conversation memory state. */
export interface ConversationMemory {
  readonly id: string;
  readonly entries: readonly MemoryEntry[];
  readonly bookmarks: readonly MemoryBookmark[];
  readonly config: MemoryConfig;
  readonly currentView: MemoryView;
  readonly stats: MemoryStats;
}

// ---- 233 Default Config ----

const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxEntries: 1000,
  defaultViewMode: 'timeline',
  showCplRepresentation: true,
  showDiffs: true,
  showPlanDescription: true,
  enableBookmarks: true,
  enableSearch: true,
  enableExport: true,
  enableImport: true,
  autoBookmarkErrors: true,
  compactDiffThreshold: 5,
  timestampFormat: 'relative',
};

const EMPTY_MEMORY_STATS: MemoryStats = {
  totalEntries: 0,
  editCount: 0,
  questionCount: 0,
  undoCount: 0,
  errorCount: 0,
  bookmarkCount: 0,
  uniqueEntities: 0,
  uniqueScopes: 0,
  timeSpanMs: 0,
  averageTurnDurationMs: 0,
};

// ---- 233 Functions ----

/** Create a new conversation memory store. */
export function createConversationMemory(
  id: string,
  config?: Partial<MemoryConfig>,
): ConversationMemory {
  const resolvedConfig: MemoryConfig = config
    ? {
        ...DEFAULT_MEMORY_CONFIG,
        ...(config.maxEntries !== undefined ? { maxEntries: config.maxEntries } : {}),
        ...(config.defaultViewMode !== undefined ? { defaultViewMode: config.defaultViewMode } : {}),
        ...(config.showCplRepresentation !== undefined ? { showCplRepresentation: config.showCplRepresentation } : {}),
        ...(config.showDiffs !== undefined ? { showDiffs: config.showDiffs } : {}),
        ...(config.showPlanDescription !== undefined ? { showPlanDescription: config.showPlanDescription } : {}),
        ...(config.enableBookmarks !== undefined ? { enableBookmarks: config.enableBookmarks } : {}),
        ...(config.enableSearch !== undefined ? { enableSearch: config.enableSearch } : {}),
        ...(config.enableExport !== undefined ? { enableExport: config.enableExport } : {}),
        ...(config.enableImport !== undefined ? { enableImport: config.enableImport } : {}),
        ...(config.autoBookmarkErrors !== undefined ? { autoBookmarkErrors: config.autoBookmarkErrors } : {}),
        ...(config.compactDiffThreshold !== undefined ? { compactDiffThreshold: config.compactDiffThreshold } : {}),
        ...(config.timestampFormat !== undefined ? { timestampFormat: config.timestampFormat } : {}),
      }
    : DEFAULT_MEMORY_CONFIG;

  const emptyView: MemoryView = {
    mode: resolvedConfig.defaultViewMode,
    entries: [],
    totalCount: 0,
    filteredCount: 0,
    scrollPosition: 0,
    selectedEntryId: '',
    expandedEntryIds: [],
  };

  return {
    id,
    entries: [],
    bookmarks: [],
    config: resolvedConfig,
    currentView: emptyView,
    stats: EMPTY_MEMORY_STATS,
  };
}

/** Add an entry to conversation memory. */
export function addEntry(
  memory: ConversationMemory,
  entry: MemoryEntry,
): ConversationMemory {
  const newEntries = [...memory.entries, entry];
  const trimmed = newEntries.length > memory.config.maxEntries
    ? newEntries.slice(newEntries.length - memory.config.maxEntries)
    : newEntries;

  const shouldAutoBookmark = memory.config.autoBookmarkErrors && entry.entryType === 'error';
  let newBookmarks = memory.bookmarks;
  if (shouldAutoBookmark) {
    const autoBookmark: MemoryBookmark = {
      id: `bm-auto-${entry.id}`,
      entryId: entry.id,
      name: `Error at turn ${entry.turnNumber}`,
      description: `Auto-bookmarked error: ${entry.userInput.substring(0, 50)}`,
      tags: ['auto', 'error'],
      createdAt: Date.now(),
      color: '#D93025',
      icon: 'error',
    };
    newBookmarks = [...memory.bookmarks, autoBookmark];
  }

  const newStats = _computeMemoryStats(trimmed, newBookmarks);

  return {
    ...memory,
    entries: trimmed,
    bookmarks: newBookmarks,
    stats: newStats,
    currentView: {
      ...memory.currentView,
      entries: trimmed,
      totalCount: trimmed.length,
      filteredCount: trimmed.length,
    },
  };
}

/** Get the most recent N entries. */
export function getRecentEntries(memory: ConversationMemory, count: number): readonly MemoryEntry[] {
  const start = Math.max(0, memory.entries.length - count);
  return memory.entries.slice(start);
}

/** Bookmark a memory entry. */
export function bookmarkEntry(
  memory: ConversationMemory,
  entryId: string,
  name: string,
  description?: string,
  tags?: readonly string[],
  color?: string,
): ConversationMemory {
  const entry = memory.entries.find(e => e.id === entryId);
  if (!entry) return memory;

  const bookmark: MemoryBookmark = {
    id: `bm-${entryId}-${Date.now()}`,
    entryId,
    name,
    description: description ?? '',
    tags: tags ?? [],
    createdAt: Date.now(),
    color: color ?? '#4A90D9',
    icon: 'bookmark',
  };

  const updatedEntries = memory.entries.map(e =>
    e.id === entryId ? { ...e, isBookmarked: true, bookmarkName: name } : e
  );

  const newBookmarks = [...memory.bookmarks, bookmark];

  return {
    ...memory,
    entries: updatedEntries,
    bookmarks: newBookmarks,
    stats: _computeMemoryStats(updatedEntries, newBookmarks),
    currentView: {
      ...memory.currentView,
      entries: updatedEntries,
    },
  };
}

/** Remove a bookmark from a memory entry. */
export function removeBookmark(memory: ConversationMemory, bookmarkId: string): ConversationMemory {
  const bookmark = memory.bookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return memory;

  const newBookmarks = memory.bookmarks.filter(b => b.id !== bookmarkId);
  const stillBookmarked = newBookmarks.some(b => b.entryId === bookmark.entryId);

  const updatedEntries = memory.entries.map(e =>
    e.id === bookmark.entryId && !stillBookmarked
      ? { ...e, isBookmarked: false, bookmarkName: '' }
      : e
  );

  return {
    ...memory,
    entries: updatedEntries,
    bookmarks: newBookmarks,
    stats: _computeMemoryStats(updatedEntries, newBookmarks),
    currentView: {
      ...memory.currentView,
      entries: updatedEntries,
    },
  };
}

/** Filter memory entries based on a filter. */
export function filterEntries(
  memory: ConversationMemory,
  filter: Partial<MemoryFilter>,
): ConversationMemory {
  let filtered = [...memory.entries];

  if (filter.entryTypes && filter.entryTypes.length > 0) {
    const types = new Set(filter.entryTypes);
    filtered = filtered.filter(e => types.has(e.entryType));
  }

  if (filter.scope && filter.scope.length > 0) {
    filtered = filtered.filter(e => e.scope === filter.scope);
  }

  if (filter.timeRangeStart !== undefined && filter.timeRangeStart > 0) {
    filtered = filtered.filter(e => e.timestamp >= (filter.timeRangeStart ?? 0));
  }

  if (filter.timeRangeEnd !== undefined && filter.timeRangeEnd > 0) {
    filtered = filtered.filter(e => e.timestamp <= (filter.timeRangeEnd ?? Infinity));
  }

  if (filter.bookmarkedOnly) {
    filtered = filtered.filter(e => e.isBookmarked);
  }

  if (filter.searchText && filter.searchText.length > 0) {
    const searchLower = filter.searchText.toLowerCase();
    const field = filter.searchField ?? 'all';
    filtered = filtered.filter(e => _matchesSearch(e, searchLower, field));
  }

  if (filter.entityReferences && filter.entityReferences.length > 0) {
    const refs = new Set(filter.entityReferences);
    filtered = filtered.filter(e => e.entityReferences.some(r => refs.has(r)));
  }

  if (filter.tags && filter.tags.length > 0) {
    const tagSet = new Set(filter.tags);
    filtered = filtered.filter(e => e.tags.some(t => tagSet.has(t)));
  }

  if (filter.maxResults !== undefined && filter.maxResults > 0) {
    filtered = filtered.slice(0, filter.maxResults);
  }

  return {
    ...memory,
    currentView: {
      ...memory.currentView,
      entries: filtered,
      filteredCount: filtered.length,
      mode: 'search-results',
    },
  };
}

/** Search memory entries by keyword. */
export function searchMemory(
  memory: ConversationMemory,
  query: string,
  field: MemorySearchField,
  maxResults: number,
): readonly MemoryEntry[] {
  const queryLower = query.toLowerCase();
  const matched = memory.entries.filter(e => _matchesSearch(e, queryLower, field));
  return matched.slice(0, maxResults);
}

/** Format memory entries for display in a given view mode. */
export function formatMemoryForDisplay(
  memory: ConversationMemory,
  viewMode: MemoryViewMode,
): readonly string[] {
  const entries = memory.currentView.entries;

  switch (viewMode) {
    case 'timeline':
      return entries.map(e => {
        const ts = _formatTimestamp(e.timestamp, memory.config.timestampFormat);
        return `[${ts}] ${e.entryType}: ${e.userInput}`;
      });
    case 'compact':
      return entries.map(e => `#${e.turnNumber} ${e.userInput.substring(0, 60)}${e.userInput.length > 60 ? '...' : ''}`);
    case 'detailed':
      return entries.flatMap(e => [
        `--- Turn #${e.turnNumber} (${e.entryType}) ---`,
        `Input: ${e.userInput}`,
        `CPL: ${e.cplRepresentation}`,
        `Plan: ${e.planDescription}`,
        ...e.diffs.map(d => `  ${d.changeType} ${d.entityName}.${d.parameterName}: ${d.oldValue} -> ${d.newValue}`),
        '',
      ]);
    case 'diff-only':
      return entries.flatMap(e =>
        e.diffs.map(d => `#${e.turnNumber} ${d.changeType} ${d.entityName}.${d.parameterName}: ${d.oldValue} -> ${d.newValue}`)
      );
    case 'cpl-only':
      return entries.map(e => `#${e.turnNumber}: ${e.cplRepresentation}`);
    case 'bookmarks-only':
      return entries.filter(e => e.isBookmarked).map(e => `[${e.bookmarkName}] #${e.turnNumber}: ${e.userInput}`);
    case 'errors-only':
      return entries.filter(e => e.entryType === 'error').map(e => `#${e.turnNumber} ERROR: ${e.userInput}`);
    case 'edits-only':
      return entries.filter(e => e.entryType === 'edit-command').map(e => `#${e.turnNumber}: ${e.userInput}`);
    case 'questions-only':
      return entries.filter(e => e.entryType === 'question').map(e => `#${e.turnNumber}: ${e.userInput}`);
    case 'search-results':
      return entries.map(e => `#${e.turnNumber} [${e.entryType}]: ${e.userInput}`);
    case 'grouped-by-scope':
      return _groupByField(entries, 'scope');
    case 'grouped-by-entity':
      return _groupByEntityRef(entries);
    default:
      return entries.map(e => `#${e.turnNumber}: ${e.userInput}`);
  }
}

/** Get memory statistics. */
export function getMemoryStats(memory: ConversationMemory): MemoryStats {
  return memory.stats;
}

/** Export memory to a portable format. */
export function exportMemory(memory: ConversationMemory): MemoryExport {
  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    entries: memory.entries,
    bookmarks: memory.bookmarks,
    stats: memory.stats,
  };
}

/** Import memory from an exported format. */
export function importMemory(
  memory: ConversationMemory,
  exported: MemoryExport,
): ConversationMemory {
  const mergedEntries = [...memory.entries, ...exported.entries];
  const uniqueEntries = _deduplicateEntries(mergedEntries);
  const trimmed = uniqueEntries.length > memory.config.maxEntries
    ? uniqueEntries.slice(uniqueEntries.length - memory.config.maxEntries)
    : uniqueEntries;

  const mergedBookmarks = [...memory.bookmarks, ...exported.bookmarks];
  const seenBmIds = new Set<string>();
  const uniqueBookmarks = mergedBookmarks.filter(b => {
    if (seenBmIds.has(b.id)) return false;
    seenBmIds.add(b.id);
    return true;
  });

  const newStats = _computeMemoryStats(trimmed, uniqueBookmarks);

  return {
    ...memory,
    entries: trimmed,
    bookmarks: uniqueBookmarks,
    stats: newStats,
    currentView: {
      ...memory.currentView,
      entries: trimmed,
      totalCount: trimmed.length,
      filteredCount: trimmed.length,
    },
  };
}

/** Clear all memory entries and bookmarks. */
export function clearMemory(memory: ConversationMemory): ConversationMemory {
  return {
    ...memory,
    entries: [],
    bookmarks: [],
    stats: EMPTY_MEMORY_STATS,
    currentView: {
      ...memory.currentView,
      entries: [],
      totalCount: 0,
      filteredCount: 0,
      selectedEntryId: '',
      expandedEntryIds: [],
    },
  };
}

/** Get all bookmarks. */
export function getBookmarks(memory: ConversationMemory): readonly MemoryBookmark[] {
  return memory.bookmarks;
}

/** Get detail for a specific entry. */
export function getEntryDetail(memory: ConversationMemory, entryId: string): MemoryEntry | undefined {
  return memory.entries.find(e => e.id === entryId);
}

// ---- 233 Internal Helpers ----

function _matchesSearch(entry: MemoryEntry, queryLower: string, field: MemorySearchField): boolean {
  switch (field) {
    case 'raw-text':
      return entry.userInput.toLowerCase().includes(queryLower);
    case 'cpl-content':
      return entry.cplRepresentation.toLowerCase().includes(queryLower);
    case 'entity-reference':
      return entry.entityReferences.some(r => r.toLowerCase().includes(queryLower));
    case 'bookmark-name':
      return entry.bookmarkName.toLowerCase().includes(queryLower);
    case 'tag':
      return entry.tags.some(t => t.toLowerCase().includes(queryLower));
    case 'all':
      return entry.userInput.toLowerCase().includes(queryLower) ||
        entry.cplRepresentation.toLowerCase().includes(queryLower) ||
        entry.entityReferences.some(r => r.toLowerCase().includes(queryLower)) ||
        entry.planDescription.toLowerCase().includes(queryLower) ||
        entry.tags.some(t => t.toLowerCase().includes(queryLower));
    default:
      return entry.userInput.toLowerCase().includes(queryLower);
  }
}

function _formatTimestamp(ts: number, format: 'relative' | 'absolute' | 'both'): string {
  const now = Date.now();
  const diffMs = now - ts;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (format === 'relative' || format === 'both') {
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }
  return new Date(ts).toISOString();
}

function _computeMemoryStats(entries: readonly MemoryEntry[], bookmarks: readonly MemoryBookmark[]): MemoryStats {
  const entitySet = new Set<string>();
  const scopeSet = new Set<string>();
  let editCount = 0;
  let questionCount = 0;
  let undoCount = 0;
  let errorCount = 0;

  for (const e of entries) {
    for (const ref of e.entityReferences) entitySet.add(ref);
    if (e.scope) scopeSet.add(e.scope);
    if (e.entryType === 'edit-command') editCount++;
    if (e.entryType === 'question') questionCount++;
    if (e.entryType === 'undo') undoCount++;
    if (e.entryType === 'error') errorCount++;
  }

  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];
  const timeSpanMs = (firstEntry && lastEntry) ? lastEntry.timestamp - firstEntry.timestamp : 0;
  const avgDuration = entries.length > 1 ? Math.round(timeSpanMs / (entries.length - 1)) : 0;

  return {
    totalEntries: entries.length,
    editCount,
    questionCount,
    undoCount,
    errorCount,
    bookmarkCount: bookmarks.length,
    uniqueEntities: entitySet.size,
    uniqueScopes: scopeSet.size,
    timeSpanMs,
    averageTurnDurationMs: avgDuration,
  };
}

function _deduplicateEntries(entries: readonly MemoryEntry[]): MemoryEntry[] {
  const seen = new Set<string>();
  const result: MemoryEntry[] = [];
  for (const e of entries) {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      result.push(e);
    }
  }
  return result;
}

function _groupByField(entries: readonly MemoryEntry[], _field: 'scope'): readonly string[] {
  const groups = new Map<string, MemoryEntry[]>();
  for (const e of entries) {
    const key = e.scope || '(no scope)';
    const group = groups.get(key);
    if (group) {
      group.push(e);
    } else {
      groups.set(key, [e]);
    }
  }

  const lines: string[] = [];
  for (const [scope, scopeEntries] of groups) {
    lines.push(`== ${scope} (${scopeEntries.length} entries) ==`);
    for (const e of scopeEntries) {
      lines.push(`  #${e.turnNumber}: ${e.userInput}`);
    }
    lines.push('');
  }
  return lines;
}

function _groupByEntityRef(entries: readonly MemoryEntry[]): readonly string[] {
  const groups = new Map<string, MemoryEntry[]>();
  for (const e of entries) {
    for (const ref of e.entityReferences) {
      const group = groups.get(ref);
      if (group) {
        group.push(e);
      } else {
        groups.set(ref, [e]);
      }
    }
    if (e.entityReferences.length === 0) {
      const group = groups.get('(no entity)');
      if (group) {
        group.push(e);
      } else {
        groups.set('(no entity)', [e]);
      }
    }
  }

  const lines: string[] = [];
  for (const [entity, entityEntries] of groups) {
    lines.push(`== ${entity} (${entityEntries.length} references) ==`);
    for (const en of entityEntries) {
      lines.push(`  #${en.turnNumber}: ${en.userInput}`);
    }
    lines.push('');
  }
  return lines;
}


// ===================== STEP 234: UNDO TARGET SELECTION UI =====================

// ---- 234 Types ----

/** Type of undo target. */
export type UndoTargetType =
  | 'last'
  | 'specific'
  | 'by-scope'
  | 'by-entity'
  | 'by-time-range'
  | 'all-since';

/** Severity of an undo operation. */
export type UndoSeverity = 'trivial' | 'minor' | 'moderate' | 'major' | 'critical';

/** State of an undo operation. */
export type UndoState = 'pending' | 'previewing' | 'confirmed' | 'executing' | 'completed' | 'cancelled' | 'failed';

/** A single undoable action. */
export interface UndoAction {
  readonly id: string;
  readonly turnNumber: number;
  readonly description: string;
  readonly timestamp: number;
  readonly scope: string;
  readonly entityId: string;
  readonly entityName: string;
  readonly parameterChanges: readonly UndoParameterChange[];
  readonly severity: UndoSeverity;
  readonly isReversible: boolean;
}

/** A parameter change that can be undone. */
export interface UndoParameterChange {
  readonly parameterName: string;
  readonly oldValue: string;
  readonly newValue: string;
  readonly changeType: 'set' | 'add' | 'remove' | 'modify';
}

/** Preview of what undo will revert. */
export interface UndoPreview {
  readonly targetDescription: string;
  readonly actionsToUndo: readonly UndoAction[];
  readonly totalChanges: number;
  readonly affectedEntities: readonly string[];
  readonly affectedScopes: readonly string[];
  readonly severity: UndoSeverity;
  readonly warnings: readonly string[];
  readonly estimatedDurationMs: number;
  readonly beforeState: Record<string, string>;
  readonly afterState: Record<string, string>;
}

/** Configuration for undo behavior. */
export interface UndoConfig {
  readonly maxHistoryDepth: number;
  readonly requireConfirmForMultiStep: boolean;
  readonly requireConfirmThreshold: number;
  readonly showPreviewAlways: boolean;
  readonly groupByScope: boolean;
  readonly groupByEntity: boolean;
  readonly warnOnLargeUndo: boolean;
  readonly largeUndoThreshold: number;
  readonly enableTimeRangeUndo: boolean;
  readonly enableBatchUndo: boolean;
  readonly animateUndoPreview: boolean;
}

/** An undo target specification. */
export interface UndoTarget {
  readonly id: string;
  readonly targetType: UndoTargetType;
  readonly description: string;
  readonly actions: readonly UndoAction[];
  readonly preview: UndoPreview;
  readonly state: UndoState;
  readonly createdAt: number;
  readonly config: UndoConfig;
}

/** Grouping of undo actions by scope. */
export interface UndoGroup {
  readonly groupKey: string;
  readonly groupType: 'scope' | 'entity' | 'time-range';
  readonly label: string;
  readonly actions: readonly UndoAction[];
  readonly totalChanges: number;
  readonly severity: UndoSeverity;
}

/** Full undo history. */
export interface UndoHistory {
  readonly actions: readonly UndoAction[];
  readonly undoneActionIds: readonly string[];
  readonly maxDepth: number;
  readonly oldestTimestamp: number;
  readonly newestTimestamp: number;
}

/** Statistics about undo history. */
export interface UndoStats {
  readonly totalActions: number;
  readonly undoneCount: number;
  readonly availableCount: number;
  readonly scopeCount: number;
  readonly entityCount: number;
  readonly oldestActionAge: number;
  readonly averageSeverity: number;
}

/** Result of an undo execution. */
export interface UndoResult {
  readonly success: boolean;
  readonly undoneActionIds: readonly string[];
  readonly revertedChanges: number;
  readonly warnings: readonly string[];
  readonly durationMs: number;
}

/** Warning about an undo operation. */
export interface UndoWarning {
  readonly level: 'info' | 'warning' | 'danger';
  readonly message: string;
  readonly affectedEntity: string;
  readonly suggestion: string;
}

// ---- 234 Data: Interaction Patterns ----

const UNDO_INTERACTION_PATTERNS: readonly { name: string; targetType: UndoTargetType; description: string; uiHint: string; shortcut: string }[] = [
  { name: 'undo-last', targetType: 'last', description: 'Undo the most recent action', uiHint: 'Single button click', shortcut: 'Ctrl+Z' },
  { name: 'undo-specific-pick', targetType: 'specific', description: 'Pick a specific action from history', uiHint: 'Dropdown list', shortcut: 'Ctrl+Shift+Z' },
  { name: 'undo-scope-chorus', targetType: 'by-scope', description: 'Undo all changes to chorus', uiHint: 'Scope filter', shortcut: '' },
  { name: 'undo-scope-verse', targetType: 'by-scope', description: 'Undo all changes to verse', uiHint: 'Scope filter', shortcut: '' },
  { name: 'undo-scope-bridge', targetType: 'by-scope', description: 'Undo all changes to bridge', uiHint: 'Scope filter', shortcut: '' },
  { name: 'undo-entity-drums', targetType: 'by-entity', description: 'Undo all drum changes', uiHint: 'Entity filter', shortcut: '' },
  { name: 'undo-entity-bass', targetType: 'by-entity', description: 'Undo all bass changes', uiHint: 'Entity filter', shortcut: '' },
  { name: 'undo-entity-vocals', targetType: 'by-entity', description: 'Undo all vocal changes', uiHint: 'Entity filter', shortcut: '' },
  { name: 'undo-entity-synth', targetType: 'by-entity', description: 'Undo all synth changes', uiHint: 'Entity filter', shortcut: '' },
  { name: 'undo-time-last5min', targetType: 'by-time-range', description: 'Undo last 5 minutes', uiHint: 'Time slider', shortcut: '' },
  { name: 'undo-time-last15min', targetType: 'by-time-range', description: 'Undo last 15 minutes', uiHint: 'Time slider', shortcut: '' },
  { name: 'undo-time-last30min', targetType: 'by-time-range', description: 'Undo last 30 minutes', uiHint: 'Time slider', shortcut: '' },
  { name: 'undo-time-lasthour', targetType: 'by-time-range', description: 'Undo last hour', uiHint: 'Time slider', shortcut: '' },
  { name: 'undo-since-bookmark', targetType: 'all-since', description: 'Undo since last bookmark', uiHint: 'Bookmark picker', shortcut: '' },
  { name: 'undo-since-save', targetType: 'all-since', description: 'Undo since last save', uiHint: 'Save point picker', shortcut: '' },
  { name: 'undo-batch-selected', targetType: 'specific', description: 'Undo multiple selected actions', uiHint: 'Multi-select list', shortcut: '' },
  { name: 'undo-all-errors', targetType: 'specific', description: 'Undo all failed/error actions', uiHint: 'Error filter', shortcut: '' },
  { name: 'undo-preview-hover', targetType: 'specific', description: 'Preview undo on hover', uiHint: 'Hover preview', shortcut: '' },
  { name: 'undo-drag-timeline', targetType: 'by-time-range', description: 'Drag timeline to undo point', uiHint: 'Timeline drag', shortcut: '' },
  { name: 'undo-voice-command', targetType: 'last', description: 'Voice command undo', uiHint: 'Voice recognition', shortcut: '' },
  { name: 'undo-contextual-menu', targetType: 'specific', description: 'Right-click contextual undo', uiHint: 'Context menu', shortcut: '' },
  { name: 'undo-gesture-shake', targetType: 'last', description: 'Shake gesture to undo (mobile)', uiHint: 'Device shake', shortcut: '' },
];

// ---- 234 Default Config ----

const DEFAULT_UNDO_CONFIG: UndoConfig = {
  maxHistoryDepth: 200,
  requireConfirmForMultiStep: true,
  requireConfirmThreshold: 3,
  showPreviewAlways: true,
  groupByScope: true,
  groupByEntity: true,
  warnOnLargeUndo: true,
  largeUndoThreshold: 10,
  enableTimeRangeUndo: true,
  enableBatchUndo: true,
  animateUndoPreview: true,
};

// ---- 234 Functions ----

/** Create an undo target for the last action. */
export function createUndoTarget(
  targetType: UndoTargetType,
  actions: readonly UndoAction[],
  description: string,
  config?: Partial<UndoConfig>,
): UndoTarget {
  const resolvedConfig: UndoConfig = config
    ? {
        ...DEFAULT_UNDO_CONFIG,
        ...(config.maxHistoryDepth !== undefined ? { maxHistoryDepth: config.maxHistoryDepth } : {}),
        ...(config.requireConfirmForMultiStep !== undefined ? { requireConfirmForMultiStep: config.requireConfirmForMultiStep } : {}),
        ...(config.requireConfirmThreshold !== undefined ? { requireConfirmThreshold: config.requireConfirmThreshold } : {}),
        ...(config.showPreviewAlways !== undefined ? { showPreviewAlways: config.showPreviewAlways } : {}),
        ...(config.groupByScope !== undefined ? { groupByScope: config.groupByScope } : {}),
        ...(config.groupByEntity !== undefined ? { groupByEntity: config.groupByEntity } : {}),
        ...(config.warnOnLargeUndo !== undefined ? { warnOnLargeUndo: config.warnOnLargeUndo } : {}),
        ...(config.largeUndoThreshold !== undefined ? { largeUndoThreshold: config.largeUndoThreshold } : {}),
        ...(config.enableTimeRangeUndo !== undefined ? { enableTimeRangeUndo: config.enableTimeRangeUndo } : {}),
        ...(config.enableBatchUndo !== undefined ? { enableBatchUndo: config.enableBatchUndo } : {}),
        ...(config.animateUndoPreview !== undefined ? { animateUndoPreview: config.animateUndoPreview } : {}),
      }
    : DEFAULT_UNDO_CONFIG;

  const preview = _buildUndoPreview(actions, description);

  return {
    id: `undo-${targetType}-${Date.now()}`,
    targetType,
    description,
    actions,
    preview,
    state: 'pending',
    createdAt: Date.now(),
    config: resolvedConfig,
  };
}

/** Preview what an undo operation will revert. */
export function previewUndo(actions: readonly UndoAction[]): UndoPreview {
  return _buildUndoPreview(actions, 'Preview');
}

/** Execute an undo operation, returning the result. */
export function executeUndo(target: UndoTarget): UndoResult {
  if (target.state === 'cancelled' || target.state === 'completed') {
    return {
      success: false,
      undoneActionIds: [],
      revertedChanges: 0,
      warnings: [`Cannot execute undo in state: ${target.state}`],
      durationMs: 0,
    };
  }

  const undoneIds = target.actions.filter(a => a.isReversible).map(a => a.id);
  const totalChanges = target.actions.reduce((sum, a) => sum + a.parameterChanges.length, 0);

  return {
    success: true,
    undoneActionIds: undoneIds,
    revertedChanges: totalChanges,
    warnings: target.preview.warnings,
    durationMs: target.preview.estimatedDurationMs,
  };
}

/** Get the full undo history. */
export function getUndoHistory(actions: readonly UndoAction[], undoneIds: readonly string[]): UndoHistory {
  const timestamps = actions.map(a => a.timestamp);
  const minTs = timestamps.length > 0 ? Math.min(...timestamps) : 0;
  const maxTs = timestamps.length > 0 ? Math.max(...timestamps) : 0;

  return {
    actions,
    undoneActionIds: undoneIds,
    maxDepth: DEFAULT_UNDO_CONFIG.maxHistoryDepth,
    oldestTimestamp: minTs,
    newestTimestamp: maxTs,
  };
}

/** Group undo actions by scope. */
export function groupUndosByScope(actions: readonly UndoAction[]): readonly UndoGroup[] {
  const groups = new Map<string, UndoAction[]>();
  for (const action of actions) {
    const key = action.scope || '(global)';
    const group = groups.get(key);
    if (group) {
      group.push(action);
    } else {
      groups.set(key, [action]);
    }
  }

  return Array.from(groups.entries()).map(([scope, scopeActions]) => ({
    groupKey: scope,
    groupType: 'scope' as const,
    label: `Scope: ${scope}`,
    actions: scopeActions,
    totalChanges: scopeActions.reduce((s, a) => s + a.parameterChanges.length, 0),
    severity: _maxSeverity(scopeActions),
  }));
}

/** Group undo actions by entity. */
export function groupUndosByEntity(actions: readonly UndoAction[]): readonly UndoGroup[] {
  const groups = new Map<string, UndoAction[]>();
  for (const action of actions) {
    const key = action.entityId || '(no entity)';
    const group = groups.get(key);
    if (group) {
      group.push(action);
    } else {
      groups.set(key, [action]);
    }
  }

  return Array.from(groups.entries()).map(([entityId, entityActions]) => {
    const firstAction = entityActions[0];
    const entityName = firstAction ? firstAction.entityName : entityId;
    return {
      groupKey: entityId,
      groupType: 'entity' as const,
      label: `Entity: ${entityName}`,
      actions: entityActions,
      totalChanges: entityActions.reduce((s, a) => s + a.parameterChanges.length, 0),
      severity: _maxSeverity(entityActions),
    };
  });
}

/** Select an undo target from the interaction pattern name. */
export function selectUndoTarget(
  patternName: string,
  allActions: readonly UndoAction[],
): UndoTarget | undefined {
  const pattern = UNDO_INTERACTION_PATTERNS.find(p => p.name === patternName);
  if (!pattern) return undefined;

  let selectedActions: readonly UndoAction[];
  switch (pattern.targetType) {
    case 'last': {
      const lastAction = allActions[allActions.length - 1];
      selectedActions = lastAction ? [lastAction] : [];
      break;
    }
    case 'specific':
      selectedActions = allActions.slice(-1);
      break;
    case 'by-scope':
      selectedActions = allActions;
      break;
    case 'by-entity':
      selectedActions = allActions;
      break;
    case 'by-time-range':
      selectedActions = allActions;
      break;
    case 'all-since':
      selectedActions = allActions;
      break;
    default:
      selectedActions = [];
  }

  if (selectedActions.length === 0) return undefined;

  return createUndoTarget(pattern.targetType, selectedActions, pattern.description);
}

/** Format an undo preview for display. */
export function formatUndoPreview(preview: UndoPreview): readonly string[] {
  const lines: string[] = [];
  lines.push(`Undo: ${preview.targetDescription}`);
  lines.push(`Actions to undo: ${preview.actionsToUndo.length}`);
  lines.push(`Total changes: ${preview.totalChanges}`);
  lines.push(`Severity: ${preview.severity}`);
  lines.push('');

  if (preview.affectedEntities.length > 0) {
    lines.push(`Affected entities: ${preview.affectedEntities.join(', ')}`);
  }
  if (preview.affectedScopes.length > 0) {
    lines.push(`Affected scopes: ${preview.affectedScopes.join(', ')}`);
  }

  lines.push('');
  lines.push('Changes to revert:');
  for (const action of preview.actionsToUndo) {
    lines.push(`  ${action.description}`);
    for (const change of action.parameterChanges) {
      lines.push(`    ${change.parameterName}: ${change.newValue} -> ${change.oldValue}`);
    }
  }

  if (preview.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of preview.warnings) {
      lines.push(`  ! ${warning}`);
    }
  }

  return lines;
}

/** Confirm an undo operation, advancing state. */
export function confirmUndo(target: UndoTarget): UndoTarget {
  return {
    ...target,
    state: 'confirmed',
  };
}

/** Batch undo multiple targets. */
export function batchUndo(targets: readonly UndoTarget[]): readonly UndoResult[] {
  return targets.map(target => executeUndo(target));
}

/** Get undo statistics. */
export function getUndoStats(history: UndoHistory): UndoStats {
  const undoneSet = new Set(history.undoneActionIds);
  const availableActions = history.actions.filter(a => !undoneSet.has(a.id));
  const scopeSet = new Set(history.actions.map(a => a.scope));
  const entitySet = new Set(history.actions.map(a => a.entityId));
  const severityValues: Record<UndoSeverity, number> = { trivial: 1, minor: 2, moderate: 3, major: 4, critical: 5 };
  const totalSeverity = history.actions.reduce((s, a) => s + severityValues[a.severity], 0);
  const avgSeverity = history.actions.length > 0 ? totalSeverity / history.actions.length : 0;

  return {
    totalActions: history.actions.length,
    undoneCount: history.undoneActionIds.length,
    availableCount: availableActions.length,
    scopeCount: scopeSet.size,
    entityCount: entitySet.size,
    oldestActionAge: history.oldestTimestamp > 0 ? Date.now() - history.oldestTimestamp : 0,
    averageSeverity: avgSeverity,
  };
}

/** Check if undo is available. */
export function canUndo(history: UndoHistory): boolean {
  const undoneSet = new Set(history.undoneActionIds);
  return history.actions.some(a => !undoneSet.has(a.id) && a.isReversible);
}

/** Get warnings about a potential undo operation. */
export function getUndoWarnings(target: UndoTarget): readonly UndoWarning[] {
  const warnings: UndoWarning[] = [];

  if (target.actions.length >= target.config.largeUndoThreshold) {
    warnings.push({
      level: 'warning',
      message: `This will undo ${target.actions.length} actions at once.`,
      affectedEntity: '',
      suggestion: 'Consider undoing in smaller batches.',
    });
  }

  const irreversibleActions = target.actions.filter(a => !a.isReversible);
  if (irreversibleActions.length > 0) {
    warnings.push({
      level: 'danger',
      message: `${irreversibleActions.length} action(s) cannot be re-done after undo.`,
      affectedEntity: irreversibleActions.map(a => a.entityName).join(', '),
      suggestion: 'Save your project before proceeding.',
    });
  }

  const criticalActions = target.actions.filter(a => a.severity === 'critical');
  if (criticalActions.length > 0) {
    warnings.push({
      level: 'danger',
      message: `${criticalActions.length} critical change(s) will be reverted.`,
      affectedEntity: criticalActions.map(a => a.entityName).join(', '),
      suggestion: 'Review the preview carefully before confirming.',
    });
  }

  const scopeSet = new Set(target.actions.map(a => a.scope));
  if (scopeSet.size > 3) {
    warnings.push({
      level: 'info',
      message: `This undo spans ${scopeSet.size} different scopes.`,
      affectedEntity: '',
      suggestion: 'You may want to undo by scope instead.',
    });
  }

  return warnings;
}

/** Suggest the best undo target based on recent history. */
export function suggestUndoTarget(history: UndoHistory): { targetType: UndoTargetType; description: string; actionCount: number } {
  const undoneSet = new Set(history.undoneActionIds);
  const available = history.actions.filter(a => !undoneSet.has(a.id) && a.isReversible);

  if (available.length === 0) {
    return { targetType: 'last', description: 'No actions to undo', actionCount: 0 };
  }

  if (available.length === 1) {
    const single = available[0];
    return {
      targetType: 'last',
      description: single ? `Undo: ${single.description}` : 'Undo last action',
      actionCount: 1,
    };
  }

  // Check if recent actions are all same scope
  const recentActions = available.slice(-5);
  const recentScopes = new Set(recentActions.map(a => a.scope));
  if (recentScopes.size === 1) {
    const scopeVal = recentActions[0];
    return {
      targetType: 'by-scope',
      description: scopeVal ? `Undo all changes to ${scopeVal.scope}` : 'Undo by scope',
      actionCount: recentActions.length,
    };
  }

  // Check if recent actions are all same entity
  const recentEntities = new Set(recentActions.map(a => a.entityId));
  if (recentEntities.size === 1) {
    const entityVal = recentActions[0];
    return {
      targetType: 'by-entity',
      description: entityVal ? `Undo all ${entityVal.entityName} changes` : 'Undo by entity',
      actionCount: recentActions.length,
    };
  }

  const lastAction = available[available.length - 1];
  return {
    targetType: 'last',
    description: lastAction ? `Undo: ${lastAction.description}` : 'Undo last action',
    actionCount: 1,
  };
}

// ---- 234 Internal Helpers ----

function _buildUndoPreview(actions: readonly UndoAction[], description: string): UndoPreview {
  const entitySet = new Set<string>();
  const scopeSet = new Set<string>();
  let totalChanges = 0;
  const warnings: string[] = [];

  for (const action of actions) {
    if (action.entityName) entitySet.add(action.entityName);
    if (action.scope) scopeSet.add(action.scope);
    totalChanges += action.parameterChanges.length;
    if (!action.isReversible) {
      warnings.push(`Action "${action.description}" is not reversible.`);
    }
  }

  const maxSev = _maxSeverity(actions);

  if (actions.length > 10) {
    warnings.push(`Large undo: ${actions.length} actions will be reverted.`);
  }

  const beforeState: Record<string, string> = {};
  const afterState: Record<string, string> = {};
  for (const action of actions) {
    for (const change of action.parameterChanges) {
      const key = `${action.entityName}.${change.parameterName}`;
      beforeState[key] = change.newValue;
      afterState[key] = change.oldValue;
    }
  }

  return {
    targetDescription: description,
    actionsToUndo: actions,
    totalChanges,
    affectedEntities: Array.from(entitySet),
    affectedScopes: Array.from(scopeSet),
    severity: maxSev,
    warnings,
    estimatedDurationMs: Math.max(50, actions.length * 10),
    beforeState,
    afterState,
  };
}

function _maxSeverity(actions: readonly UndoAction[]): UndoSeverity {
  const order: readonly UndoSeverity[] = ['trivial', 'minor', 'moderate', 'major', 'critical'];
  let maxIdx = 0;
  for (const action of actions) {
    const idx = order.indexOf(action.severity);
    if (idx > maxIdx) maxIdx = idx;
  }
  const result = order[maxIdx];
  return result ?? 'trivial';
}

// Export interaction pattern count
export const UNDO_INTERACTION_PATTERN_COUNT = UNDO_INTERACTION_PATTERNS.length;

export function getUndoInteractionPatterns(): readonly { name: string; targetType: UndoTargetType; description: string }[] {
  return UNDO_INTERACTION_PATTERNS.map(p => ({
    name: p.name,
    targetType: p.targetType,
    description: p.description,
  }));
}
