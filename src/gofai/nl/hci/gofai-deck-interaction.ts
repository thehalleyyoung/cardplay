/**
 * GOFAI Deck Interaction — HCI Interaction Components
 *
 * Implements Steps 356–360 of the GOFAI roadmap:
 *   356: Clarification Modal
 *   357: Ask Fewer Questions Toggle
 *   358: Strict Mode Toggle
 *   359: Keyboard-first Workflows
 *   360: Accessibility Semantics
 *
 * All types are locally defined; no external imports.
 *
 * @module gofai/nl/hci/gofai-deck-interaction
 */

// =============================================================================
// STEP 356 — CLARIFICATION MODAL
// Dedicated clarification modal with QUD-style options, defaults, consequences.
// =============================================================================

// ---------------------------------------------------------------------------
// 356 Types
// ---------------------------------------------------------------------------

/** Unique identifier for a modal instance */
export type ModalId = string;

/** Unique identifier for a modal option */
export type OptionId = string;

/** Supported animation states for modal transitions */
export type ModalAnimationState =
  | 'entering'
  | 'entered'
  | 'exiting'
  | 'exited'
  | 'bouncing'
  | 'shaking';

/** Clarification type categories used by modal templates */
export type ClarificationType =
  | 'scope'
  | 'entity'
  | 'amount'
  | 'direction'
  | 'timing'
  | 'style'
  | 'confirmation'
  | 'comparison'
  | 'parameter'
  | 'effect'
  | 'instrument'
  | 'action';

/** Consequence severity for an option selection */
export type ConsequenceSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

/** Keyboard key identifiers relevant to modal navigation */
export type ModalKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Enter'
  | 'Escape'
  | 'Tab'
  | 'ShiftTab'
  | 'Space'
  | 'Home'
  | 'End';

/** Describes a single consequence of choosing a particular modal option */
export interface ModalConsequence {
  readonly id: string;
  readonly description: string;
  readonly severity: ConsequenceSeverity;
  readonly affectedPath: string;
  readonly beforeValue: string;
  readonly afterValue: string;
  readonly reversible: boolean;
  readonly warningText: string;
}

/** A single selectable option within a clarification modal */
export interface ModalOption {
  readonly id: OptionId;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly isDefault: boolean;
  readonly isRecommended: boolean;
  readonly isDestructive: boolean;
  readonly consequences: readonly ModalConsequence[];
  readonly keyboardShortcut: string;
  readonly groupLabel: string;
  readonly iconName: string;
  readonly disabled: boolean;
  readonly disabledReason: string;
  readonly order: number;
}

/** Animation configuration for a modal */
export interface ModalAnimation {
  readonly state: ModalAnimationState;
  readonly durationMs: number;
  readonly easing: string;
  readonly delayMs: number;
  readonly backdropOpacity: number;
  readonly scaleStart: number;
  readonly scaleEnd: number;
  readonly translateY: string;
}

/** Interaction tracking for analytics */
export interface ModalInteraction {
  readonly modalId: ModalId;
  readonly openedAtMs: number;
  readonly closedAtMs: number;
  readonly selectedOptionId: string;
  readonly navigatedOptions: readonly OptionId[];
  readonly timeToSelectionMs: number;
  readonly usedKeyboard: boolean;
  readonly usedMouse: boolean;
  readonly wasSkipped: boolean;
  readonly wasDismissed: boolean;
  readonly wasChained: boolean;
  readonly chainPosition: number;
}

/** Runtime state of a modal */
export interface ModalState {
  readonly modalId: ModalId;
  readonly isOpen: boolean;
  readonly focusedOptionIndex: number;
  readonly selectedOptionId: string;
  readonly animation: ModalAnimation;
  readonly interaction: ModalInteraction;
  readonly isSubmitting: boolean;
  readonly errorMessage: string;
  readonly hasBeenSeen: boolean;
  readonly chainNext: ModalId;
}

/** Configuration for a modal instance */
export interface ModalConfig {
  readonly modalId: ModalId;
  readonly clarificationType: ClarificationType;
  readonly questionText: string;
  readonly questionContext: string;
  readonly options: readonly ModalOption[];
  readonly defaultOptionId: OptionId;
  readonly defaultExplanation: string;
  readonly skipAllowed: boolean;
  readonly skipLabel: string;
  readonly timeoutMs: number;
  readonly showConsequences: boolean;
  readonly showKeyboardHints: boolean;
  readonly width: string;
  readonly maxHeight: string;
  readonly zIndex: number;
  readonly overlayDismiss: boolean;
  readonly animationDurationMs: number;
}

/** Reusable modal template for a clarification type */
export interface ModalTemplate {
  readonly templateId: string;
  readonly clarificationType: ClarificationType;
  readonly headerPrefix: string;
  readonly bodyInstructions: string;
  readonly footerNote: string;
  readonly defaultWidth: string;
  readonly defaultMaxHeight: string;
  readonly defaultShowConsequences: boolean;
  readonly defaultSkipAllowed: boolean;
  readonly iconName: string;
  readonly accentColor: string;
  readonly optionLayout: 'grid' | 'list' | 'radio' | 'cards';
  readonly maxOptions: number;
}

/** Top-level clarification modal descriptor */
export interface ClarificationModal {
  readonly config: ModalConfig;
  readonly state: ModalState;
  readonly template: ModalTemplate;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
  readonly parentContextId: string;
  readonly sourceAmbiguityId: string;
}

// ---------------------------------------------------------------------------
// 356 Constants
// ---------------------------------------------------------------------------

const DEFAULT_MODAL_ANIMATION: ModalAnimation = {
  state: 'exited',
  durationMs: 200,
  easing: 'ease-out',
  delayMs: 0,
  backdropOpacity: 0.5,
  scaleStart: 0.95,
  scaleEnd: 1.0,
  translateY: '-10px',
};

const DEFAULT_MODAL_INTERACTION: ModalInteraction = {
  modalId: '',
  openedAtMs: 0,
  closedAtMs: 0,
  selectedOptionId: '',
  navigatedOptions: [],
  timeToSelectionMs: 0,
  usedKeyboard: false,
  usedMouse: false,
  wasSkipped: false,
  wasDismissed: false,
  wasChained: false,
  chainPosition: 0,
};

/** 12 modal templates, one per ClarificationType */
const MODAL_TEMPLATES: readonly ModalTemplate[] = [
  {
    templateId: 'tpl-scope',
    clarificationType: 'scope',
    headerPrefix: 'Scope Clarification',
    bodyInstructions: 'Which elements should this operation affect?',
    footerNote: 'Scope determines the breadth of the change.',
    defaultWidth: '520px',
    defaultMaxHeight: '600px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'target',
    accentColor: '#3b82f6',
    optionLayout: 'radio',
    maxOptions: 8,
  },
  {
    templateId: 'tpl-entity',
    clarificationType: 'entity',
    headerPrefix: 'Entity Clarification',
    bodyInstructions: 'Which entity do you mean?',
    footerNote: 'Selecting the wrong entity may change unrelated parts.',
    defaultWidth: '520px',
    defaultMaxHeight: '600px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'box',
    accentColor: '#8b5cf6',
    optionLayout: 'cards',
    maxOptions: 12,
  },
  {
    templateId: 'tpl-amount',
    clarificationType: 'amount',
    headerPrefix: 'Amount Clarification',
    bodyInstructions: 'How much should be applied?',
    footerNote: 'Amount affects intensity of the change.',
    defaultWidth: '480px',
    defaultMaxHeight: '500px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'slider',
    accentColor: '#06b6d4',
    optionLayout: 'list',
    maxOptions: 6,
  },
  {
    templateId: 'tpl-direction',
    clarificationType: 'direction',
    headerPrefix: 'Direction Clarification',
    bodyInstructions: 'Which direction should the operation go?',
    footerNote: 'Direction reversal may require separate undo.',
    defaultWidth: '480px',
    defaultMaxHeight: '480px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'arrow-right',
    accentColor: '#10b981',
    optionLayout: 'grid',
    maxOptions: 6,
  },
  {
    templateId: 'tpl-timing',
    clarificationType: 'timing',
    headerPrefix: 'Timing Clarification',
    bodyInstructions: 'When should this change take effect?',
    footerNote: 'Timing affects sequencing with other operations.',
    defaultWidth: '500px',
    defaultMaxHeight: '540px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'clock',
    accentColor: '#f59e0b',
    optionLayout: 'list',
    maxOptions: 8,
  },
  {
    templateId: 'tpl-style',
    clarificationType: 'style',
    headerPrefix: 'Style Clarification',
    bodyInstructions: 'Which style variant should be used?',
    footerNote: 'Style changes are typically non-destructive.',
    defaultWidth: '560px',
    defaultMaxHeight: '620px',
    defaultShowConsequences: false,
    defaultSkipAllowed: true,
    iconName: 'palette',
    accentColor: '#ec4899',
    optionLayout: 'cards',
    maxOptions: 12,
  },
  {
    templateId: 'tpl-confirmation',
    clarificationType: 'confirmation',
    headerPrefix: 'Confirm Action',
    bodyInstructions: 'Are you sure you want to proceed?',
    footerNote: 'This action may not be easily reversible.',
    defaultWidth: '440px',
    defaultMaxHeight: '400px',
    defaultShowConsequences: true,
    defaultSkipAllowed: false,
    iconName: 'alert-triangle',
    accentColor: '#ef4444',
    optionLayout: 'radio',
    maxOptions: 3,
  },
  {
    templateId: 'tpl-comparison',
    clarificationType: 'comparison',
    headerPrefix: 'Comparison Clarification',
    bodyInstructions: 'Which option best matches your intent?',
    footerNote: 'Compare consequences side by side.',
    defaultWidth: '640px',
    defaultMaxHeight: '700px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'columns',
    accentColor: '#6366f1',
    optionLayout: 'cards',
    maxOptions: 4,
  },
  {
    templateId: 'tpl-parameter',
    clarificationType: 'parameter',
    headerPrefix: 'Parameter Clarification',
    bodyInstructions: 'Which parameter value should be used?',
    footerNote: 'Parameters affect processing behavior.',
    defaultWidth: '500px',
    defaultMaxHeight: '560px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'settings',
    accentColor: '#78716c',
    optionLayout: 'list',
    maxOptions: 10,
  },
  {
    templateId: 'tpl-effect',
    clarificationType: 'effect',
    headerPrefix: 'Effect Clarification',
    bodyInstructions: 'Which effect should be applied?',
    footerNote: 'Effects can compound with existing operations.',
    defaultWidth: '520px',
    defaultMaxHeight: '580px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'sparkles',
    accentColor: '#a855f7',
    optionLayout: 'cards',
    maxOptions: 8,
  },
  {
    templateId: 'tpl-instrument',
    clarificationType: 'instrument',
    headerPrefix: 'Instrument Clarification',
    bodyInstructions: 'Which instrument or tool should be used?',
    footerNote: 'Instrument choice affects the output quality.',
    defaultWidth: '540px',
    defaultMaxHeight: '600px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'music',
    accentColor: '#14b8a6',
    optionLayout: 'cards',
    maxOptions: 10,
  },
  {
    templateId: 'tpl-action',
    clarificationType: 'action',
    headerPrefix: 'Action Clarification',
    bodyInstructions: 'Which action did you intend?',
    footerNote: 'Choosing the wrong action may require undo.',
    defaultWidth: '500px',
    defaultMaxHeight: '560px',
    defaultShowConsequences: true,
    defaultSkipAllowed: true,
    iconName: 'zap',
    accentColor: '#f97316',
    optionLayout: 'list',
    maxOptions: 8,
  },
] as const;

/** Key bindings for modal navigation */
const MODAL_KEY_BINDINGS: ReadonlyMap<ModalKey, string> = new Map<ModalKey, string>([
  ['ArrowUp', 'Move selection up'],
  ['ArrowDown', 'Move selection down'],
  ['ArrowLeft', 'Move selection left (grid)'],
  ['ArrowRight', 'Move selection right (grid)'],
  ['Enter', 'Confirm selection'],
  ['Escape', 'Dismiss modal'],
  ['Tab', 'Cycle to next option'],
  ['ShiftTab', 'Cycle to previous option'],
  ['Space', 'Toggle option details'],
  ['Home', 'Jump to first option'],
  ['End', 'Jump to last option'],
]);

// ---------------------------------------------------------------------------
// 356 Helper: unique ID generation
// ---------------------------------------------------------------------------

let _modalIdCounter = 0;

function generateModalId(): ModalId {
  _modalIdCounter += 1;
  return `modal-${_modalIdCounter}-${Date.now()}`;
}

function generateOptionId(index: number): OptionId {
  return `opt-${index}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// 356 Functions
// ---------------------------------------------------------------------------

/**
 * Look up the modal template for a given clarification type.
 */
export function getModalTemplate(
  clarificationType: ClarificationType
): ModalTemplate {
  const found = MODAL_TEMPLATES.find(
    (t) => t.clarificationType === clarificationType
  );
  if (found) {
    return found;
  }
  // Fallback: return the action template as a safe default
  const fallback = MODAL_TEMPLATES.find(
    (t) => t.clarificationType === 'action'
  );
  // We know MODAL_TEMPLATES has action, but satisfy noUncheckedIndexedAccess
  if (fallback) {
    return fallback;
  }
  return MODAL_TEMPLATES[0] as ModalTemplate;
}

/**
 * Format a consequence into a human-readable string.
 */
export function formatConsequence(consequence: ModalConsequence): string {
  const sevTag =
    consequence.severity === 'none'
      ? ''
      : ` [${consequence.severity.toUpperCase()}]`;
  const revTag = consequence.reversible ? ' (reversible)' : ' (irreversible)';
  const pathInfo = consequence.affectedPath
    ? ` — affects "${consequence.affectedPath}"`
    : '';
  const valueChange =
    consequence.beforeValue || consequence.afterValue
      ? `: "${consequence.beforeValue}" → "${consequence.afterValue}"`
      : '';
  const warning = consequence.warningText
    ? `\n  ⚠ ${consequence.warningText}`
    : '';
  return `${consequence.description}${sevTag}${revTag}${pathInfo}${valueChange}${warning}`;
}

/**
 * Build a default ModalState for a newly created modal.
 */
function buildDefaultModalState(modalId: ModalId): ModalState {
  return {
    modalId,
    isOpen: false,
    focusedOptionIndex: 0,
    selectedOptionId: '',
    animation: { ...DEFAULT_MODAL_ANIMATION },
    interaction: { ...DEFAULT_MODAL_INTERACTION, modalId },
    isSubmitting: false,
    errorMessage: '',
    hasBeenSeen: false,
    chainNext: '',
  };
}

/**
 * Create a full ClarificationModal from a config.
 */
export function createClarificationModal(
  config: ModalConfig
): ClarificationModal {
  const template = getModalTemplate(config.clarificationType);
  const now = Date.now();
  return {
    config,
    state: buildDefaultModalState(config.modalId),
    template,
    createdAtMs: now,
    updatedAtMs: now,
    parentContextId: '',
    sourceAmbiguityId: '',
  };
}

/**
 * Build a ModalConfig from minimal inputs plus a template.
 */
function buildModalConfig(
  questionText: string,
  clarificationType: ClarificationType,
  options: readonly ModalOption[]
): ModalConfig {
  const template = getModalTemplate(clarificationType);
  const modalId = generateModalId();
  const defaultOpt = options.find((o) => o.isDefault);
  return {
    modalId,
    clarificationType,
    questionText,
    questionContext: '',
    options,
    defaultOptionId: defaultOpt ? defaultOpt.id : (options[0]?.id ?? ''),
    defaultExplanation: defaultOpt
      ? `Default: "${defaultOpt.label}" — safest choice for most situations.`
      : 'No default selected.',
    skipAllowed: template.defaultSkipAllowed,
    skipLabel: 'Skip (use default)',
    timeoutMs: 0,
    showConsequences: template.defaultShowConsequences,
    showKeyboardHints: true,
    width: template.defaultWidth,
    maxHeight: template.defaultMaxHeight,
    zIndex: 1000,
    overlayDismiss: true,
    animationDurationMs: 200,
  };
}

/**
 * Open a modal by transitioning its state.
 */
export function openModal(modal: ClarificationModal): ClarificationModal {
  const now = Date.now();
  const defaultIdx = modal.config.options.findIndex(
    (o) => o.id === modal.config.defaultOptionId
  );
  return {
    ...modal,
    state: {
      ...modal.state,
      isOpen: true,
      hasBeenSeen: true,
      focusedOptionIndex: defaultIdx >= 0 ? defaultIdx : 0,
      animation: {
        ...modal.state.animation,
        state: 'entering',
      },
      interaction: {
        ...modal.state.interaction,
        openedAtMs: now,
      },
    },
    updatedAtMs: now,
  };
}

/**
 * Close a modal.
 */
export function closeModal(
  modal: ClarificationModal,
  dismissed: boolean
): ClarificationModal {
  const now = Date.now();
  return {
    ...modal,
    state: {
      ...modal.state,
      isOpen: false,
      animation: {
        ...modal.state.animation,
        state: 'exiting',
      },
      interaction: {
        ...modal.state.interaction,
        closedAtMs: now,
        wasDismissed: dismissed,
        timeToSelectionMs: now - modal.state.interaction.openedAtMs,
      },
    },
    updatedAtMs: now,
  };
}

/**
 * Select an option within the modal.
 */
export function selectOption(
  modal: ClarificationModal,
  optionId: OptionId
): ClarificationModal {
  const optionExists = modal.config.options.some((o) => o.id === optionId);
  if (!optionExists) {
    return {
      ...modal,
      state: {
        ...modal.state,
        errorMessage: `Option "${optionId}" not found.`,
      },
    };
  }
  const optIndex = modal.config.options.findIndex((o) => o.id === optionId);
  const now = Date.now();
  return {
    ...modal,
    state: {
      ...modal.state,
      selectedOptionId: optionId,
      focusedOptionIndex: optIndex >= 0 ? optIndex : 0,
      errorMessage: '',
      interaction: {
        ...modal.state.interaction,
        selectedOptionId: optionId,
        usedMouse: true,
        navigatedOptions: [
          ...modal.state.interaction.navigatedOptions,
          optionId,
        ],
      },
    },
    updatedAtMs: now,
  };
}

/**
 * Get the current runtime state of a modal.
 */
export function getModalState(modal: ClarificationModal): ModalState {
  return modal.state;
}

/**
 * Render the modal to an HTML string.
 */
export function renderModalHTML(modal: ClarificationModal): string {
  const { config, state, template } = modal;
  const backdropStyle = state.isOpen
    ? `opacity:${state.animation.backdropOpacity};pointer-events:auto;`
    : 'opacity:0;pointer-events:none;';

  const optionItems = config.options
    .map((opt, idx) => {
      const focused = idx === state.focusedOptionIndex ? ' data-focused="true"' : '';
      const selected = opt.id === state.selectedOptionId ? ' data-selected="true"' : '';
      const disabledAttr = opt.disabled ? ' aria-disabled="true"' : '';
      const destructiveClass = opt.isDestructive ? ' modal-option--destructive' : '';
      const recommendedBadge = opt.isRecommended
        ? '<span class="modal-badge modal-badge--recommended">Recommended</span>'
        : '';
      const defaultBadge = opt.isDefault
        ? '<span class="modal-badge modal-badge--default">Default</span>'
        : '';

      const consequenceHtml = config.showConsequences
        ? opt.consequences
            .map(
              (c) =>
                `<div class="modal-consequence modal-consequence--${c.severity}">` +
                `<span class="consequence-desc">${c.description}</span>` +
                `<span class="consequence-path">${c.affectedPath}</span>` +
                `<span class="consequence-change">${c.beforeValue} → ${c.afterValue}</span>` +
                (c.warningText
                  ? `<span class="consequence-warning">${c.warningText}</span>`
                  : '') +
                `</div>`
            )
            .join('\n')
        : '';

      const shortcutHtml = config.showKeyboardHints && opt.keyboardShortcut
        ? `<kbd class="modal-shortcut">${opt.keyboardShortcut}</kbd>`
        : '';

      return (
        `<div class="modal-option${destructiveClass}" ` +
        `role="option" id="opt-${idx}" tabindex="${idx === state.focusedOptionIndex ? 0 : -1}"` +
        `${focused}${selected}${disabledAttr} data-option-id="${opt.id}">` +
        `<div class="modal-option-header">` +
        `<span class="modal-option-icon">${opt.iconName}</span>` +
        `<span class="modal-option-label">${opt.label}</span>` +
        `${recommendedBadge}${defaultBadge}${shortcutHtml}` +
        `</div>` +
        `<div class="modal-option-desc">${opt.description}</div>` +
        (opt.disabled
          ? `<div class="modal-option-disabled-reason">${opt.disabledReason}</div>`
          : '') +
        (consequenceHtml
          ? `<div class="modal-option-consequences">${consequenceHtml}</div>`
          : '') +
        `</div>`
      );
    })
    .join('\n');

  const footerSkip = config.skipAllowed
    ? `<button class="modal-skip-btn" tabindex="0">${config.skipLabel}</button>`
    : '';

  const errorSection = state.errorMessage
    ? `<div class="modal-error" role="alert">${state.errorMessage}</div>`
    : '';

  return (
    `<div class="modal-backdrop" style="${backdropStyle}" data-modal-id="${config.modalId}">` +
    `<div class="modal-container" role="dialog" aria-modal="true" ` +
    `aria-labelledby="modal-title-${config.modalId}" ` +
    `style="width:${config.width};max-height:${config.maxHeight};z-index:${config.zIndex};">` +
    `<div class="modal-header" style="border-bottom-color:${template.accentColor};">` +
    `<span class="modal-header-icon">${template.iconName}</span>` +
    `<h2 id="modal-title-${config.modalId}" class="modal-title">` +
    `${template.headerPrefix}: ${config.questionText}</h2>` +
    `<button class="modal-close-btn" aria-label="Close modal" tabindex="0">&times;</button>` +
    `</div>` +
    `<div class="modal-body">` +
    `<p class="modal-instructions">${template.bodyInstructions}</p>` +
    (config.questionContext
      ? `<p class="modal-context">${config.questionContext}</p>`
      : '') +
    `${errorSection}` +
    `<div class="modal-options modal-options--${template.optionLayout}" ` +
    `role="listbox" aria-label="Clarification options">` +
    `${optionItems}` +
    `</div>` +
    `</div>` +
    `<div class="modal-footer">` +
    `<div class="modal-default-explanation">${config.defaultExplanation}</div>` +
    `<div class="modal-footer-note">${template.footerNote}</div>` +
    `<div class="modal-footer-actions">` +
    `${footerSkip}` +
    `<button class="modal-confirm-btn" tabindex="0" ` +
    `${state.selectedOptionId ? '' : 'disabled="disabled"'}>Confirm</button>` +
    `</div>` +
    `</div>` +
    `</div>` +
    `</div>`
  );
}

/**
 * Animate a modal transition between states.
 */
export function animateModalTransition(
  modal: ClarificationModal,
  targetState: ModalAnimationState
): ClarificationModal {
  return {
    ...modal,
    state: {
      ...modal.state,
      animation: {
        ...modal.state.animation,
        state: targetState,
      },
    },
    updatedAtMs: Date.now(),
  };
}

/**
 * Get key binding descriptions for the modal.
 */
export function getModalKeyBindings(): ReadonlyMap<ModalKey, string> {
  return MODAL_KEY_BINDINGS;
}

/**
 * Process a keyboard event within a modal, returning the updated modal.
 */
function processModalKeyEvent(
  modal: ClarificationModal,
  key: ModalKey
): ClarificationModal {
  const { config, state } = modal;
  const optCount = config.options.length;
  if (optCount === 0) {
    return modal;
  }

  const now = Date.now();

  switch (key) {
    case 'ArrowDown':
    case 'Tab': {
      const nextIdx = (state.focusedOptionIndex + 1) % optCount;
      return {
        ...modal,
        state: {
          ...state,
          focusedOptionIndex: nextIdx,
          interaction: {
            ...state.interaction,
            usedKeyboard: true,
          },
        },
        updatedAtMs: now,
      };
    }
    case 'ArrowUp':
    case 'ShiftTab': {
      const prevIdx =
        state.focusedOptionIndex <= 0
          ? optCount - 1
          : state.focusedOptionIndex - 1;
      return {
        ...modal,
        state: {
          ...state,
          focusedOptionIndex: prevIdx,
          interaction: {
            ...state.interaction,
            usedKeyboard: true,
          },
        },
        updatedAtMs: now,
      };
    }
    case 'Home': {
      return {
        ...modal,
        state: {
          ...state,
          focusedOptionIndex: 0,
          interaction: { ...state.interaction, usedKeyboard: true },
        },
        updatedAtMs: now,
      };
    }
    case 'End': {
      return {
        ...modal,
        state: {
          ...state,
          focusedOptionIndex: optCount - 1,
          interaction: { ...state.interaction, usedKeyboard: true },
        },
        updatedAtMs: now,
      };
    }
    case 'Enter':
    case 'Space': {
      const focusedOpt = config.options[state.focusedOptionIndex];
      if (focusedOpt && !focusedOpt.disabled) {
        return selectOption(modal, focusedOpt.id);
      }
      return modal;
    }
    case 'Escape': {
      return closeModal(modal, true);
    }
    default: {
      return modal;
    }
  }
}

/**
 * Batch-create multiple modals from an array of question/type/options triples.
 */
export function batchCreateModals(
  specs: readonly {
    readonly questionText: string;
    readonly clarificationType: ClarificationType;
    readonly options: readonly ModalOption[];
  }[]
): readonly ClarificationModal[] {
  return specs.map((spec) => {
    const config = buildModalConfig(
      spec.questionText,
      spec.clarificationType,
      spec.options
    );
    return createClarificationModal(config);
  });
}

/**
 * Chain modals so that closing one opens the next.
 */
export function chainModals(
  modals: readonly ClarificationModal[]
): readonly ClarificationModal[] {
  return modals.map((m, idx) => {
    const nextModal = modals[idx + 1];
    const chainNext = nextModal ? nextModal.config.modalId : '';
    return {
      ...m,
      state: {
        ...m.state,
        chainNext,
        interaction: {
          ...m.state.interaction,
          wasChained: true,
          chainPosition: idx,
        },
      },
    };
  });
}

/**
 * Build a quick ModalOption helper.
 */
function buildOption(
  index: number,
  label: string,
  description: string,
  isDefault: boolean,
  consequences: readonly ModalConsequence[]
): ModalOption {
  return {
    id: generateOptionId(index),
    label,
    shortLabel: label.substring(0, 12),
    description,
    isDefault,
    isRecommended: isDefault,
    isDestructive: consequences.some((c) => c.severity === 'critical'),
    consequences,
    keyboardShortcut: String(index + 1),
    groupLabel: '',
    iconName: 'circle',
    disabled: false,
    disabledReason: '',
    order: index,
  };
}

// Export helpers for use by other modules
export { processModalKeyEvent, buildModalConfig, buildOption as buildModalOption };


// =============================================================================
// STEP 357 — ASK FEWER QUESTIONS TOGGLE
// "Ask fewer questions" toggle for setting stronger defaults with safety warnings.
// =============================================================================

// ---------------------------------------------------------------------------
// 357 Types
// ---------------------------------------------------------------------------

/** Frequency levels from always asking to never asking */
export type QuestionFrequencyLevel =
  | 'always-ask'
  | 'ask-important'
  | 'ask-critical'
  | 'use-defaults'
  | 'never-ask';

/** Ambiguity categories for frequency settings */
export type AmbiguityCategory =
  | 'scope'
  | 'entity'
  | 'amount'
  | 'direction'
  | 'timing'
  | 'style'
  | 'action'
  | 'instrument'
  | 'effect'
  | 'parameter'
  | 'confirmation'
  | 'comparison'
  | 'naming'
  | 'ordering'
  | 'grouping';

/** Safety risk levels */
export type SafetyRiskLevel = 'safe' | 'minor-risk' | 'moderate-risk' | 'major-risk' | 'dangerous';

/** Description of a safety impact when reducing question frequency */
export interface SafetyImpact {
  readonly riskLevel: SafetyRiskLevel;
  readonly description: string;
  readonly possibleMistakes: readonly string[];
  readonly mitigationStrategies: readonly string[];
  readonly estimatedErrorRate: number;
  readonly worstCaseDescription: string;
  readonly affectedAmbiguityCategories: readonly AmbiguityCategory[];
}

/** Configuration for a single ambiguity category at a given level */
export interface AmbiguityLevelConfig {
  readonly category: AmbiguityCategory;
  readonly level: QuestionFrequencyLevel;
  readonly shouldAsk: boolean;
  readonly defaultBehavior: string;
  readonly defaultExplanation: string;
  readonly safetyNote: string;
  readonly overridable: boolean;
}

/** Preset configuration for a frequency level */
export interface FrequencyPreset {
  readonly level: QuestionFrequencyLevel;
  readonly displayName: string;
  readonly description: string;
  readonly safetyImpact: SafetyImpact;
  readonly ambiguityConfigs: readonly AmbiguityLevelConfig[];
  readonly iconName: string;
  readonly badgeColor: string;
  readonly recommended: boolean;
  readonly requiresConfirmation: boolean;
}

/** Toggle state for frequency control */
export interface FrequencyToggle {
  readonly currentLevel: QuestionFrequencyLevel;
  readonly previousLevel: QuestionFrequencyLevel;
  readonly changedAtMs: number;
  readonly overrides: ReadonlyMap<AmbiguityCategory, QuestionFrequencyLevel>;
  readonly skippedQuestionCount: number;
  readonly autoAppliedCount: number;
  readonly errorsCausedByDefaults: number;
  readonly sessionStartMs: number;
}

/** Full frequency configuration */
export interface FrequencyConfig {
  readonly toggle: FrequencyToggle;
  readonly presets: readonly FrequencyPreset[];
  readonly safetyWarningsEnabled: boolean;
  readonly showSkippedCount: boolean;
  readonly allowPerCategoryOverride: boolean;
  readonly lockLevel: boolean;
  readonly lockReason: string;
}

// ---------------------------------------------------------------------------
// 357 Constants
// ---------------------------------------------------------------------------

const FREQUENCY_LEVEL_ORDER: readonly QuestionFrequencyLevel[] = [
  'always-ask',
  'ask-important',
  'ask-critical',
  'use-defaults',
  'never-ask',
];

const ALL_AMBIGUITY_CATEGORIES: readonly AmbiguityCategory[] = [
  'scope',
  'entity',
  'amount',
  'direction',
  'timing',
  'style',
  'action',
  'instrument',
  'effect',
  'parameter',
  'confirmation',
  'comparison',
  'naming',
  'ordering',
  'grouping',
];

/**
 * Build the 15 ambiguity configs for a given frequency level.
 */
function buildAmbiguityConfigsForLevel(
  level: QuestionFrequencyLevel
): readonly AmbiguityLevelConfig[] {
  const shouldAskMap: Record<QuestionFrequencyLevel, (cat: AmbiguityCategory) => boolean> = {
    'always-ask': (_cat) => true,
    'ask-important': (cat) =>
      cat === 'scope' ||
      cat === 'entity' ||
      cat === 'action' ||
      cat === 'confirmation' ||
      cat === 'amount' ||
      cat === 'direction' ||
      cat === 'effect' ||
      cat === 'instrument',
    'ask-critical': (cat) =>
      cat === 'confirmation' || cat === 'action' || cat === 'scope',
    'use-defaults': (_cat) => false,
    'never-ask': (_cat) => false,
  };

  const defaultBehaviorMap: Record<AmbiguityCategory, string> = {
    scope: 'Apply to current selection only',
    entity: 'Use the most recently referenced entity',
    amount: 'Use moderate/50% value',
    direction: 'Use forward/ascending direction',
    timing: 'Apply immediately',
    style: 'Use default style preset',
    action: 'Use the most common interpretation',
    instrument: 'Use the primary/default instrument',
    effect: 'Use subtle/default effect',
    parameter: 'Use factory default parameter value',
    confirmation: 'Require explicit confirmation for destructive ops',
    comparison: 'Pick the first/default option',
    naming: 'Auto-generate name from context',
    ordering: 'Use alphabetical/chronological order',
    grouping: 'Group by category',
  };

  const checkFn = shouldAskMap[level];
  return ALL_AMBIGUITY_CATEGORIES.map((cat): AmbiguityLevelConfig => {
    const ask = checkFn(cat);
    const defaultBehavior = defaultBehaviorMap[cat];
    return {
      category: cat,
      level,
      shouldAsk: ask,
      defaultBehavior,
      defaultExplanation: ask
        ? `User will be asked about ${cat} ambiguities.`
        : `System will auto-apply: "${defaultBehavior}".`,
      safetyNote: ask
        ? 'User controls this decision.'
        : `Auto-defaulting ${cat} may miss the user's intent.`,
      overridable: level !== 'never-ask',
    };
  });
}

/**
 * Build safety impact for a given frequency level.
 */
function buildSafetyImpact(level: QuestionFrequencyLevel): SafetyImpact {
  switch (level) {
    case 'always-ask':
      return {
        riskLevel: 'safe',
        description: 'All ambiguities are clarified. Maximum safety.',
        possibleMistakes: [],
        mitigationStrategies: ['No mitigation needed — all decisions are explicit.'],
        estimatedErrorRate: 0.0,
        worstCaseDescription: 'Workflow may feel slow due to frequent interruptions.',
        affectedAmbiguityCategories: [],
      };
    case 'ask-important':
      return {
        riskLevel: 'minor-risk',
        description: 'Only important ambiguities are clarified. Minor style/naming decisions auto-default.',
        possibleMistakes: [
          'Style may not match preference',
          'Auto-naming may be suboptimal',
          'Ordering may differ from expectation',
          'Grouping strategy may not match intent',
        ],
        mitigationStrategies: [
          'Review output after batch operations',
          'Use undo for style mismatches',
          'Rename auto-generated names as needed',
        ],
        estimatedErrorRate: 0.05,
        worstCaseDescription: 'Minor style/naming mismatches requiring manual correction.',
        affectedAmbiguityCategories: ['style', 'naming', 'ordering', 'grouping', 'comparison'],
      };
    case 'ask-critical':
      return {
        riskLevel: 'moderate-risk',
        description: 'Only critical ambiguities clarified. Most decisions auto-defaulted.',
        possibleMistakes: [
          'Entity reference may be wrong',
          'Amount/intensity may be too high or too low',
          'Direction may be reversed',
          'Timing may cause sequence errors',
          'Instrument choice may produce unexpected results',
          'Effect stacking may compound unexpectedly',
        ],
        mitigationStrategies: [
          'Preview changes before committing',
          'Keep undo history available',
          'Review entity references in CPL view',
          'Use diff preview to catch direction errors',
        ],
        estimatedErrorRate: 0.15,
        worstCaseDescription: 'Incorrect entity resolution causing changes to wrong elements, or amount miscalculation.',
        affectedAmbiguityCategories: [
          'entity', 'amount', 'direction', 'timing', 'style',
          'instrument', 'effect', 'parameter', 'comparison',
          'naming', 'ordering', 'grouping',
        ],
      };
    case 'use-defaults':
      return {
        riskLevel: 'major-risk',
        description: 'All decisions auto-defaulted. No clarification questions asked.',
        possibleMistakes: [
          'Scope may be wrong (too broad or too narrow)',
          'Entity reference may resolve to the wrong element',
          'Actions may be misinterpreted',
          'Confirmations for destructive operations skipped',
          'All categories subject to default errors',
        ],
        mitigationStrategies: [
          'Always preview before applying',
          'Maintain comprehensive undo history',
          'Use strict mode for critical sessions',
          'Manually verify scope after every operation',
        ],
        estimatedErrorRate: 0.35,
        worstCaseDescription: 'Destructive operation applied to wrong scope without confirmation.',
        affectedAmbiguityCategories: [...ALL_AMBIGUITY_CATEGORIES],
      };
    case 'never-ask':
      return {
        riskLevel: 'dangerous',
        description: 'DANGEROUS: No questions, no confirmations, no safety checks.',
        possibleMistakes: [
          'Destructive operations proceed without confirmation',
          'Wrong scope, entity, or action applied silently',
          'No recourse if defaults are wrong',
          'Compounding errors with no checkpoints',
        ],
        mitigationStrategies: [
          'NOT RECOMMENDED for production use',
          'Use only for automated batch testing',
          'Always have backups before using this mode',
          'Enable comprehensive logging',
        ],
        estimatedErrorRate: 0.6,
        worstCaseDescription: 'Irreversible destructive operation on wrong scope with no confirmation.',
        affectedAmbiguityCategories: [...ALL_AMBIGUITY_CATEGORIES],
      };
  }
}

/**
 * Build all frequency presets.
 */
function buildAllPresets(): readonly FrequencyPreset[] {
  return FREQUENCY_LEVEL_ORDER.map((level): FrequencyPreset => {
    const displayNames: Record<QuestionFrequencyLevel, string> = {
      'always-ask': 'Always Ask',
      'ask-important': 'Ask Important Only',
      'ask-critical': 'Ask Critical Only',
      'use-defaults': 'Use Defaults',
      'never-ask': 'Never Ask',
    };
    const descriptions: Record<QuestionFrequencyLevel, string> = {
      'always-ask': 'Every ambiguity triggers a clarification question. Safest but most verbose.',
      'ask-important': 'Important decisions are clarified; minor style/naming auto-defaulted.',
      'ask-critical': 'Only critical safety-related ambiguities trigger questions.',
      'use-defaults': 'All ambiguities auto-resolved with defaults. Review output carefully.',
      'never-ask': 'No clarification at all. For automated pipelines or testing only.',
    };
    const icons: Record<QuestionFrequencyLevel, string> = {
      'always-ask': 'message-circle',
      'ask-important': 'filter',
      'ask-critical': 'alert-triangle',
      'use-defaults': 'fast-forward',
      'never-ask': 'skip-forward',
    };
    const colors: Record<QuestionFrequencyLevel, string> = {
      'always-ask': '#22c55e',
      'ask-important': '#3b82f6',
      'ask-critical': '#f59e0b',
      'use-defaults': '#ef4444',
      'never-ask': '#7f1d1d',
    };

    return {
      level,
      displayName: displayNames[level],
      description: descriptions[level],
      safetyImpact: buildSafetyImpact(level),
      ambiguityConfigs: buildAmbiguityConfigsForLevel(level),
      iconName: icons[level],
      badgeColor: colors[level],
      recommended: level === 'ask-important',
      requiresConfirmation: level === 'use-defaults' || level === 'never-ask',
    };
  });
}

const ALL_PRESETS: readonly FrequencyPreset[] = buildAllPresets();

// ---------------------------------------------------------------------------
// 357 Functions
// ---------------------------------------------------------------------------

/**
 * Create a frequency toggle at the default level.
 */
export function createFrequencyToggle(): FrequencyToggle {
  return {
    currentLevel: 'ask-important',
    previousLevel: 'always-ask',
    changedAtMs: Date.now(),
    overrides: new Map(),
    skippedQuestionCount: 0,
    autoAppliedCount: 0,
    errorsCausedByDefaults: 0,
    sessionStartMs: Date.now(),
  };
}

/**
 * Set the frequency level on a toggle, recording the previous level.
 */
export function setFrequencyLevel(
  toggle: FrequencyToggle,
  level: QuestionFrequencyLevel
): FrequencyToggle {
  return {
    ...toggle,
    currentLevel: level,
    previousLevel: toggle.currentLevel,
    changedAtMs: Date.now(),
  };
}

/**
 * Get the current frequency level.
 */
export function getFrequencyLevel(toggle: FrequencyToggle): QuestionFrequencyLevel {
  return toggle.currentLevel;
}

/**
 * Compute safety impact for a given level.
 */
export function computeSafetyImpact(level: QuestionFrequencyLevel): SafetyImpact {
  return buildSafetyImpact(level);
}

/**
 * Get warnings for a specific level.
 */
export function getWarningsForLevel(level: QuestionFrequencyLevel): readonly string[] {
  const impact = buildSafetyImpact(level);
  const warnings: string[] = [];

  if (impact.riskLevel !== 'safe') {
    warnings.push(`Risk level: ${impact.riskLevel}`);
  }
  if (impact.estimatedErrorRate > 0) {
    warnings.push(
      `Estimated error rate: ${(impact.estimatedErrorRate * 100).toFixed(0)}%`
    );
  }
  for (const mistake of impact.possibleMistakes) {
    warnings.push(`Possible: ${mistake}`);
  }
  if (impact.worstCaseDescription) {
    warnings.push(`Worst case: ${impact.worstCaseDescription}`);
  }
  return warnings;
}

/**
 * Determine if a given ambiguity category should ask at the current level.
 */
export function shouldAskAtLevel(
  toggle: FrequencyToggle,
  category: AmbiguityCategory
): boolean {
  // Check override first
  const override = toggle.overrides.get(category);
  if (override !== undefined) {
    const overridePreset = ALL_PRESETS.find((p) => p.level === override);
    if (overridePreset) {
      const cfg = overridePreset.ambiguityConfigs.find(
        (c) => c.category === category
      );
      if (cfg) {
        return cfg.shouldAsk;
      }
    }
  }
  // Use current level
  const preset = ALL_PRESETS.find((p) => p.level === toggle.currentLevel);
  if (preset) {
    const cfg = preset.ambiguityConfigs.find((c) => c.category === category);
    if (cfg) {
      return cfg.shouldAsk;
    }
  }
  return true; // default to asking
}

/**
 * Format a description of the current frequency level.
 */
export function formatFrequencyDescription(level: QuestionFrequencyLevel): string {
  const preset = ALL_PRESETS.find((p) => p.level === level);
  if (!preset) {
    return `Unknown frequency level: ${level}`;
  }
  const impact = preset.safetyImpact;
  const lines: string[] = [
    `## ${preset.displayName}`,
    '',
    preset.description,
    '',
    `**Risk Level:** ${impact.riskLevel}`,
    `**Estimated Error Rate:** ${(impact.estimatedErrorRate * 100).toFixed(0)}%`,
    '',
  ];

  if (impact.possibleMistakes.length > 0) {
    lines.push('**Possible Mistakes:**');
    for (const m of impact.possibleMistakes) {
      lines.push(`  - ${m}`);
    }
    lines.push('');
  }

  if (impact.mitigationStrategies.length > 0) {
    lines.push('**Mitigation:**');
    for (const s of impact.mitigationStrategies) {
      lines.push(`  - ${s}`);
    }
    lines.push('');
  }

  const askedCategories = preset.ambiguityConfigs
    .filter((c) => c.shouldAsk)
    .map((c) => c.category);
  const skippedCategories = preset.ambiguityConfigs
    .filter((c) => !c.shouldAsk)
    .map((c) => c.category);

  if (askedCategories.length > 0) {
    lines.push(`**Clarified:** ${askedCategories.join(', ')}`);
  }
  if (skippedCategories.length > 0) {
    lines.push(`**Auto-defaulted:** ${skippedCategories.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Get all frequency presets.
 */
export function getFrequencyPresets(): readonly FrequencyPreset[] {
  return ALL_PRESETS;
}

/**
 * Apply a preset, returning a new FrequencyConfig.
 */
export function applyFrequencyPreset(
  config: FrequencyConfig,
  level: QuestionFrequencyLevel
): FrequencyConfig {
  const newToggle = setFrequencyLevel(config.toggle, level);
  return {
    ...config,
    toggle: newToggle,
  };
}

/**
 * Get the count of questions that would be skipped at the current level.
 */
export function getSkippedQuestionCount(level: QuestionFrequencyLevel): number {
  const preset = ALL_PRESETS.find((p) => p.level === level);
  if (!preset) {
    return 0;
  }
  return preset.ambiguityConfigs.filter((c) => !c.shouldAsk).length;
}

/**
 * Estimate risk score 0..1 for a given frequency level.
 */
export function estimateRiskAtLevel(level: QuestionFrequencyLevel): number {
  const impact = buildSafetyImpact(level);
  return impact.estimatedErrorRate;
}

/**
 * Render the frequency toggle as HTML.
 */
export function renderFrequencyToggleHTML(config: FrequencyConfig): string {
  const { toggle } = config;

  const levelButtons = FREQUENCY_LEVEL_ORDER.map((level, idx) => {
    const preset = ALL_PRESETS.find((p) => p.level === level);
    if (!preset) {
      return '';
    }
    const active = level === toggle.currentLevel ? ' data-active="true"' : '';
    const locked = config.lockLevel ? ' disabled="disabled"' : '';
    const skipped = getSkippedQuestionCount(level);
    const riskPct = (preset.safetyImpact.estimatedErrorRate * 100).toFixed(0);

    return (
      `<button class="freq-level-btn" data-level="${level}" ` +
      `tabindex="${idx === 0 ? 0 : -1}"${active}${locked} ` +
      `style="border-color:${preset.badgeColor};">` +
      `<span class="freq-icon">${preset.iconName}</span>` +
      `<span class="freq-name">${preset.displayName}</span>` +
      `<span class="freq-desc">${preset.description}</span>` +
      `<span class="freq-stats">Skips ${skipped} of ${ALL_AMBIGUITY_CATEGORIES.length} | Risk ~${riskPct}%</span>` +
      (preset.recommended
        ? '<span class="freq-badge freq-badge--recommended">Recommended</span>'
        : '') +
      (preset.requiresConfirmation
        ? '<span class="freq-badge freq-badge--warning">Requires confirmation</span>'
        : '') +
      `</button>`
    );
  }).join('\n');

  const warningLines = getWarningsForLevel(toggle.currentLevel);
  const warningHtml =
    warningLines.length > 0
      ? `<div class="freq-warnings" role="alert">` +
        `<h4>Safety Warnings</h4>` +
        `<ul>${warningLines.map((w) => `<li>${w}</li>`).join('')}</ul>` +
        `</div>`
      : '';

  const statsHtml =
    config.showSkippedCount
      ? `<div class="freq-stats-bar">` +
        `<span>Questions skipped this session: ${toggle.skippedQuestionCount}</span>` +
        `<span>Auto-applied: ${toggle.autoAppliedCount}</span>` +
        `<span>Errors from defaults: ${toggle.errorsCausedByDefaults}</span>` +
        `</div>`
      : '';

  return (
    `<div class="freq-toggle-container" role="radiogroup" ` +
    `aria-label="Question frequency level">` +
    `<h3 class="freq-toggle-title">Ask Fewer Questions</h3>` +
    `<p class="freq-toggle-subtitle">Control how often the system asks for clarification.</p>` +
    `<div class="freq-levels">${levelButtons}</div>` +
    `${warningHtml}` +
    `${statsHtml}` +
    (config.lockLevel
      ? `<div class="freq-lock-notice">${config.lockReason}</div>`
      : '') +
    `</div>`
  );
}


// =============================================================================
// STEP 358 — STRICT MODE TOGGLE
// "Strict mode" for studios: always clarify; never auto-default.
// =============================================================================

// ---------------------------------------------------------------------------
// 358 Types
// ---------------------------------------------------------------------------

/** Strict mode levels from relaxed to studio */
export type StrictModeLevel = 'relaxed' | 'standard' | 'strict' | 'studio';

/** Ambiguity type identifier (reuses AmbiguityCategory from step 357) */
export type StrictAmbiguityType = AmbiguityCategory;

/** Rule action when an ambiguity is encountered */
export type StrictRuleAction =
  | 'auto-default'
  | 'ask-once'
  | 'always-ask'
  | 'double-confirm'
  | 'block-until-resolved';

/** A single strict mode rule */
export interface StrictModeRule {
  readonly ruleId: string;
  readonly ambiguityType: StrictAmbiguityType;
  readonly level: StrictModeLevel;
  readonly action: StrictRuleAction;
  readonly description: string;
  readonly rationale: string;
  readonly isDestructiveGuard: boolean;
  readonly requiresExplicitDismiss: boolean;
  readonly logAction: boolean;
  readonly priority: number;
}

/** Temporary override to relax strict mode for a specific operation */
export interface StrictModeOverride {
  readonly overrideId: string;
  readonly ambiguityType: StrictAmbiguityType;
  readonly originalAction: StrictRuleAction;
  readonly overrideAction: StrictRuleAction;
  readonly reason: string;
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
  readonly operationId: string;
  readonly createdBy: string;
  readonly isActive: boolean;
}

/** Report summarizing strict mode coverage */
export interface StrictModeReport {
  readonly level: StrictModeLevel;
  readonly totalRules: number;
  readonly activeRules: number;
  readonly overriddenRules: number;
  readonly coveragePercent: number;
  readonly uncoveredTypes: readonly StrictAmbiguityType[];
  readonly rulesByType: ReadonlyMap<StrictAmbiguityType, readonly StrictModeRule[]>;
  readonly activeOverrides: readonly StrictModeOverride[];
  readonly generatedAtMs: number;
  readonly recommendations: readonly string[];
}

/** Full strict mode configuration */
export interface StrictModeConfig {
  readonly level: StrictModeLevel;
  readonly rules: readonly StrictModeRule[];
  readonly overrides: readonly StrictModeOverride[];
  readonly enabled: boolean;
  readonly changedAtMs: number;
  readonly previousLevel: StrictModeLevel;
  readonly doubleConfirmDestructive: boolean;
  readonly logAllDecisions: boolean;
  readonly allowTemporaryOverrides: boolean;
  readonly maxOverrideDurationMs: number;
  readonly notifyOnOverride: boolean;
  readonly sessionId: string;
}

// ---------------------------------------------------------------------------
// 358 Constants
// ---------------------------------------------------------------------------

const STRICT_LEVEL_ORDER: readonly StrictModeLevel[] = [
  'relaxed',
  'standard',
  'strict',
  'studio',
];

/**
 * Build the 20+ rules for all ambiguity types at each strict level.
 */
function buildStrictRulesForLevel(level: StrictModeLevel): readonly StrictModeRule[] {
  const actionMap: Record<StrictModeLevel, Record<string, StrictRuleAction>> = {
    relaxed: {
      scope: 'auto-default',
      entity: 'auto-default',
      amount: 'auto-default',
      direction: 'auto-default',
      timing: 'auto-default',
      style: 'auto-default',
      action: 'ask-once',
      instrument: 'auto-default',
      effect: 'auto-default',
      parameter: 'auto-default',
      confirmation: 'ask-once',
      comparison: 'auto-default',
      naming: 'auto-default',
      ordering: 'auto-default',
      grouping: 'auto-default',
    },
    standard: {
      scope: 'ask-once',
      entity: 'ask-once',
      amount: 'auto-default',
      direction: 'ask-once',
      timing: 'auto-default',
      style: 'auto-default',
      action: 'always-ask',
      instrument: 'ask-once',
      effect: 'ask-once',
      parameter: 'auto-default',
      confirmation: 'always-ask',
      comparison: 'ask-once',
      naming: 'auto-default',
      ordering: 'auto-default',
      grouping: 'auto-default',
    },
    strict: {
      scope: 'always-ask',
      entity: 'always-ask',
      amount: 'always-ask',
      direction: 'always-ask',
      timing: 'ask-once',
      style: 'ask-once',
      action: 'always-ask',
      instrument: 'always-ask',
      effect: 'always-ask',
      parameter: 'always-ask',
      confirmation: 'double-confirm',
      comparison: 'always-ask',
      naming: 'ask-once',
      ordering: 'ask-once',
      grouping: 'ask-once',
    },
    studio: {
      scope: 'always-ask',
      entity: 'always-ask',
      amount: 'always-ask',
      direction: 'always-ask',
      timing: 'always-ask',
      style: 'always-ask',
      action: 'double-confirm',
      instrument: 'always-ask',
      effect: 'always-ask',
      parameter: 'always-ask',
      confirmation: 'double-confirm',
      comparison: 'always-ask',
      naming: 'always-ask',
      ordering: 'always-ask',
      grouping: 'always-ask',
    },
  };

  const levelActions = actionMap[level];
  let ruleIdx = 0;

  return ALL_AMBIGUITY_CATEGORIES.map((cat): StrictModeRule => {
    ruleIdx += 1;
    const actionKey = cat as string;
    const ruleAction: StrictRuleAction = levelActions[actionKey] ?? 'ask-once';
    const isDestructiveGuard =
      cat === 'confirmation' || cat === 'action' || cat === 'scope';
    return {
      ruleId: `strict-${level}-${cat}-${ruleIdx}`,
      ambiguityType: cat,
      level,
      action: ruleAction,
      description: `At ${level} level, ${cat} ambiguity triggers "${ruleAction}".`,
      rationale: buildRuleRationale(level, cat, ruleAction),
      isDestructiveGuard,
      requiresExplicitDismiss:
        ruleAction === 'double-confirm' || ruleAction === 'block-until-resolved',
      logAction: level === 'studio' || level === 'strict',
      priority: ruleIdx,
    };
  });
}

function buildRuleRationale(
  level: StrictModeLevel,
  cat: AmbiguityCategory,
  action: StrictRuleAction
): string {
  if (level === 'studio') {
    return `Studio mode requires maximum clarity for "${cat}". Action: ${action}.`;
  }
  if (level === 'strict') {
    return `Strict mode enforces explicit resolution of "${cat}" ambiguities. Action: ${action}.`;
  }
  if (level === 'standard') {
    return `Standard mode balances speed and safety for "${cat}". Action: ${action}.`;
  }
  return `Relaxed mode prioritizes speed for "${cat}". Action: ${action}.`;
}

/**
 * Pre-build all rules for all levels.
 */
const ALL_STRICT_RULES: ReadonlyMap<StrictModeLevel, readonly StrictModeRule[]> = new Map(
  STRICT_LEVEL_ORDER.map((level) => [level, buildStrictRulesForLevel(level)])
);

// ---------------------------------------------------------------------------
// 358 Functions
// ---------------------------------------------------------------------------

/**
 * Create a default strict mode config at the standard level.
 */
export function createStrictModeConfig(): StrictModeConfig {
  const rules = ALL_STRICT_RULES.get('standard') ?? [];
  return {
    level: 'standard',
    rules,
    overrides: [],
    enabled: true,
    changedAtMs: Date.now(),
    previousLevel: 'standard',
    doubleConfirmDestructive: true,
    logAllDecisions: false,
    allowTemporaryOverrides: true,
    maxOverrideDurationMs: 30 * 60 * 1000, // 30 minutes
    notifyOnOverride: true,
    sessionId: `session-${Date.now()}`,
  };
}

/**
 * Set the strict level, swapping in the corresponding rules.
 */
export function setStrictLevel(
  config: StrictModeConfig,
  level: StrictModeLevel
): StrictModeConfig {
  const rules = ALL_STRICT_RULES.get(level) ?? [];
  return {
    ...config,
    level,
    rules,
    previousLevel: config.level,
    changedAtMs: Date.now(),
    doubleConfirmDestructive: level === 'studio' || level === 'strict',
    logAllDecisions: level === 'studio',
  };
}

/**
 * Get the current strict level.
 */
export function getStrictLevel(config: StrictModeConfig): StrictModeLevel {
  return config.level;
}

/**
 * Check if a given ambiguity type requires asking at the current level.
 */
export function isStrictForAmbiguity(
  config: StrictModeConfig,
  ambiguityType: StrictAmbiguityType
): boolean {
  // Check overrides first
  const override = config.overrides.find(
    (o) => o.ambiguityType === ambiguityType && o.isActive
  );
  if (override) {
    return (
      override.overrideAction !== 'auto-default'
    );
  }
  // Check rules
  const rule = config.rules.find((r) => r.ambiguityType === ambiguityType);
  if (rule) {
    return rule.action !== 'auto-default';
  }
  return true;
}

let _overrideIdCounter = 0;

/**
 * Add a temporary override for a specific ambiguity type.
 */
export function addOverride(
  config: StrictModeConfig,
  ambiguityType: StrictAmbiguityType,
  overrideAction: StrictRuleAction,
  reason: string,
  operationId: string
): StrictModeConfig {
  if (!config.allowTemporaryOverrides) {
    return config;
  }
  const rule = config.rules.find((r) => r.ambiguityType === ambiguityType);
  const originalAction: StrictRuleAction = rule ? rule.action : 'always-ask';

  _overrideIdCounter += 1;
  const override: StrictModeOverride = {
    overrideId: `override-${_overrideIdCounter}-${Date.now()}`,
    ambiguityType,
    originalAction,
    overrideAction,
    reason,
    createdAtMs: Date.now(),
    expiresAtMs: Date.now() + config.maxOverrideDurationMs,
    operationId,
    createdBy: config.sessionId,
    isActive: true,
  };

  return {
    ...config,
    overrides: [...config.overrides, override],
    changedAtMs: Date.now(),
  };
}

/**
 * Remove (deactivate) an override by its ID.
 */
export function removeOverride(
  config: StrictModeConfig,
  overrideId: string
): StrictModeConfig {
  return {
    ...config,
    overrides: config.overrides.map((o) =>
      o.overrideId === overrideId ? { ...o, isActive: false } : o
    ),
    changedAtMs: Date.now(),
  };
}

/**
 * Get all currently active overrides.
 */
export function getActiveOverrides(
  config: StrictModeConfig
): readonly StrictModeOverride[] {
  const now = Date.now();
  return config.overrides.filter(
    (o) => o.isActive && o.expiresAtMs > now
  );
}

/**
 * Get all rules for the current level.
 */
export function getStrictRules(
  config: StrictModeConfig
): readonly StrictModeRule[] {
  return config.rules;
}

/**
 * Compute strictness coverage — what percentage of ambiguity types are actively enforced.
 */
export function computeStrictnessCoverage(
  config: StrictModeConfig
): number {
  const total = ALL_AMBIGUITY_CATEGORIES.length;
  if (total === 0) return 0;
  const covered = ALL_AMBIGUITY_CATEGORIES.filter((cat) =>
    isStrictForAmbiguity(config, cat)
  ).length;
  return covered / total;
}

/**
 * Validate that a strict config is internally consistent.
 */
export function validateStrictConfig(
  config: StrictModeConfig
): readonly string[] {
  const errors: string[] = [];

  if (!STRICT_LEVEL_ORDER.includes(config.level)) {
    errors.push(`Unknown strict level: ${config.level}`);
  }

  if (config.rules.length === 0) {
    errors.push('No rules defined for current strict level.');
  }

  // Check for duplicate rules
  const seen = new Set<string>();
  for (const rule of config.rules) {
    const key = `${rule.level}-${rule.ambiguityType}`;
    if (seen.has(key)) {
      errors.push(`Duplicate rule for ${key}`);
    }
    seen.add(key);
  }

  // Check overrides reference valid types
  for (const override of config.overrides) {
    if (!ALL_AMBIGUITY_CATEGORIES.includes(override.ambiguityType)) {
      errors.push(
        `Override references unknown ambiguity type: ${override.ambiguityType}`
      );
    }
    if (override.expiresAtMs < override.createdAtMs) {
      errors.push(
        `Override ${override.overrideId} has expiry before creation time.`
      );
    }
  }

  // Studio level should have double-confirm enabled
  if (config.level === 'studio' && !config.doubleConfirmDestructive) {
    errors.push('Studio level should have doubleConfirmDestructive enabled.');
  }

  return errors;
}

/**
 * Format a strict mode report.
 */
export function formatStrictModeReport(
  config: StrictModeConfig
): StrictModeReport {
  const activeOverrides = getActiveOverrides(config);
  const coverage = computeStrictnessCoverage(config);
  const uncovered = ALL_AMBIGUITY_CATEGORIES.filter(
    (cat) => !isStrictForAmbiguity(config, cat)
  );

  const rulesByType = new Map<StrictAmbiguityType, readonly StrictModeRule[]>();
  for (const cat of ALL_AMBIGUITY_CATEGORIES) {
    const catRules = config.rules.filter((r) => r.ambiguityType === cat);
    rulesByType.set(cat, catRules);
  }

  const recommendations: string[] = [];
  if (coverage < 0.5) {
    recommendations.push(
      'Coverage below 50%. Consider increasing strict level for critical operations.'
    );
  }
  if (activeOverrides.length > 3) {
    recommendations.push(
      'Many active overrides. Consider resetting or adjusting the base level.'
    );
  }
  if (config.level === 'relaxed') {
    recommendations.push(
      'Relaxed mode has minimal safety checks. Use Standard or higher for production.'
    );
  }
  if (uncovered.length > 0) {
    recommendations.push(
      `Uncovered types: ${uncovered.join(', ')}. These default silently.`
    );
  }

  return {
    level: config.level,
    totalRules: config.rules.length,
    activeRules: config.rules.filter(
      (r) => r.action !== 'auto-default'
    ).length,
    overriddenRules: activeOverrides.length,
    coveragePercent: Math.round(coverage * 100),
    uncoveredTypes: uncovered,
    rulesByType,
    activeOverrides,
    generatedAtMs: Date.now(),
    recommendations,
  };
}

/**
 * Render strict mode toggle HTML.
 */
export function renderStrictModeToggleHTML(
  config: StrictModeConfig
): string {
  const levelDescriptions: Record<StrictModeLevel, string> = {
    relaxed: 'Minimal clarification. Speed-optimized. Not recommended for critical work.',
    standard: 'Balanced approach. Important ambiguities are clarified.',
    strict: 'Most ambiguities require explicit resolution. Safe for professional use.',
    studio: 'Maximum safety. Every ambiguity clarified. Destructive actions double-confirmed.',
  };

  const levelColors: Record<StrictModeLevel, string> = {
    relaxed: '#94a3b8',
    standard: '#3b82f6',
    strict: '#f59e0b',
    studio: '#ef4444',
  };

  const levelIcons: Record<StrictModeLevel, string> = {
    relaxed: 'shield-off',
    standard: 'shield',
    strict: 'shield-alert',
    studio: 'shield-check',
  };

  const levelButtons = STRICT_LEVEL_ORDER.map((level, idx) => {
    const active = level === config.level ? ' data-active="true"' : '';
    const color = levelColors[level];
    const icon = levelIcons[level];
    const desc = levelDescriptions[level];

    return (
      `<button class="strict-level-btn" data-level="${level}" ` +
      `tabindex="${idx === 0 ? 0 : -1}"${active} ` +
      `style="border-left:4px solid ${color};">` +
      `<span class="strict-icon">${icon}</span>` +
      `<span class="strict-name">${level.charAt(0).toUpperCase() + level.slice(1)}</span>` +
      `<span class="strict-desc">${desc}</span>` +
      `</button>`
    );
  }).join('\n');

  const report = formatStrictModeReport(config);
  const coverageBar =
    `<div class="strict-coverage">` +
    `<span class="strict-coverage-label">Coverage: ${report.coveragePercent}%</span>` +
    `<div class="strict-coverage-bar" style="width:${report.coveragePercent}%;"></div>` +
    `</div>`;

  const overridesList =
    report.activeOverrides.length > 0
      ? `<div class="strict-overrides">` +
        `<h4>Active Overrides (${report.activeOverrides.length})</h4>` +
        `<ul>` +
        report.activeOverrides
          .map(
            (o) =>
              `<li>${o.ambiguityType}: ${o.originalAction} → ${o.overrideAction} (${o.reason})</li>`
          )
          .join('') +
        `</ul>` +
        `</div>`
      : '';

  const validationErrors = validateStrictConfig(config);
  const errorsHtml =
    validationErrors.length > 0
      ? `<div class="strict-errors" role="alert">` +
        `<h4>Configuration Issues</h4>` +
        `<ul>${validationErrors.map((e) => `<li>${e}</li>`).join('')}</ul>` +
        `</div>`
      : '';

  const recommendationsHtml =
    report.recommendations.length > 0
      ? `<div class="strict-recommendations">` +
        `<h4>Recommendations</h4>` +
        `<ul>${report.recommendations.map((r) => `<li>${r}</li>`).join('')}</ul>` +
        `</div>`
      : '';

  return (
    `<div class="strict-toggle-container" role="radiogroup" ` +
    `aria-label="Strict mode level">` +
    `<h3 class="strict-toggle-title">Strict Mode</h3>` +
    `<p class="strict-toggle-subtitle">` +
    `Control how strictly the system enforces clarification.</p>` +
    `<div class="strict-levels">${levelButtons}</div>` +
    `${coverageBar}` +
    `${overridesList}` +
    `${recommendationsHtml}` +
    `${errorsHtml}` +
    `</div>`
  );
}


// =============================================================================
// STEP 359 — KEYBOARD-FIRST WORKFLOWS
// Enter command, navigate clarifications, apply, undo, all without mouse.
// =============================================================================

// ---------------------------------------------------------------------------
// 359 Types
// ---------------------------------------------------------------------------

/** Navigation modes for keyboard-first interaction */
export type NavigationMode =
  | 'command'
  | 'clarification'
  | 'preview'
  | 'history'
  | 'inspector';

/** Modifier keys for chord detection */
export type KbModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

/** Key event type */
export type KeyEventType = 'keydown' | 'keyup' | 'keypress';

/** A single key binding specification */
export interface KeyBinding {
  readonly id: string;
  readonly key: string;
  readonly modifiers: readonly KbModifierKey[];
  readonly mode: NavigationMode;
  readonly action: string;
  readonly description: string;
  readonly category: string;
  readonly isChord: boolean;
  readonly chordFollowUp: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly conflictGroup: string;
}

/** A key sequence (for multi-key commands like vi-style g-g) */
export interface KeySequence {
  readonly sequenceId: string;
  readonly keys: readonly string[];
  readonly modifiers: readonly (readonly KbModifierKey[])[];
  readonly mode: NavigationMode;
  readonly action: string;
  readonly description: string;
  readonly timeoutMs: number;
  readonly partial: boolean;
  readonly matchedSoFar: number;
}

/** Context that determines which bindings are active */
export interface KeyContext {
  readonly mode: NavigationMode;
  readonly isModalOpen: boolean;
  readonly isInputFocused: boolean;
  readonly hasSelection: boolean;
  readonly hasHistory: boolean;
  readonly hasDiff: boolean;
  readonly isStrictMode: boolean;
  readonly viModeEnabled: boolean;
  readonly customBindingsActive: boolean;
}

/** Complete key map for all modes */
export interface KeyMap {
  readonly bindings: readonly KeyBinding[];
  readonly sequences: readonly KeySequence[];
  readonly context: KeyContext;
  readonly viBindings: readonly KeyBinding[];
  readonly customBindings: readonly KeyBinding[];
  readonly createdAtMs: number;
  readonly version: number;
}

/** A keyboard workflow description */
export interface KeyboardWorkflow {
  readonly workflowId: string;
  readonly name: string;
  readonly description: string;
  readonly steps: readonly KeyboardWorkflowStep[];
  readonly mode: NavigationMode;
  readonly estimatedKeystrokes: number;
}

/** A single step within a keyboard workflow */
export interface KeyboardWorkflowStep {
  readonly stepIndex: number;
  readonly instruction: string;
  readonly keyBinding: string;
  readonly expectedResult: string;
  readonly fallbackKey: string;
  readonly optional: boolean;
}

// ---------------------------------------------------------------------------
// 359 Constants: Key Bindings (40+ bindings across 5 modes)
// ---------------------------------------------------------------------------

let _bindingCounter = 0;

function kb(
  key: string,
  modifiers: readonly KbModifierKey[],
  mode: NavigationMode,
  action: string,
  description: string,
  category: string,
  isChord: boolean,
  chordFollowUp: string
): KeyBinding {
  _bindingCounter += 1;
  return {
    id: `kb-${_bindingCounter}`,
    key,
    modifiers,
    mode,
    action,
    description,
    category,
    isChord,
    chordFollowUp,
    enabled: true,
    priority: _bindingCounter,
    conflictGroup: `${mode}-${key}-${modifiers.join('+')}`,
  };
}

/** Command mode bindings */
const COMMAND_MODE_BINDINGS: readonly KeyBinding[] = [
  kb('Enter', ['ctrl'], 'command', 'submit-command', 'Submit current command', 'input', true, ''),
  kb('Escape', [], 'command', 'clear-input', 'Clear input field', 'input', false, ''),
  kb('ArrowUp', [], 'command', 'history-prev', 'Previous command from history', 'history', false, ''),
  kb('ArrowDown', [], 'command', 'history-next', 'Next command from history', 'history', false, ''),
  kb('Tab', [], 'command', 'autocomplete', 'Autocomplete current token', 'input', false, ''),
  kb('Tab', ['shift'], 'command', 'autocomplete-prev', 'Previous autocomplete suggestion', 'input', false, ''),
  kb('z', ['ctrl'], 'command', 'undo', 'Undo last action', 'edit', false, ''),
  kb('z', ['ctrl', 'shift'], 'command', 'redo', 'Redo undone action', 'edit', false, ''),
  kb('l', ['ctrl'], 'command', 'clear-output', 'Clear output pane', 'view', false, ''),
  kb('/', ['ctrl'], 'command', 'toggle-help', 'Toggle keyboard help panel', 'help', false, ''),
  kb('k', ['ctrl'], 'command', 'focus-search', 'Focus command palette search', 'navigation', false, ''),
  kb('.', ['ctrl'], 'command', 'repeat-last', 'Repeat last command', 'edit', false, ''),
];

/** Clarification mode bindings */
const CLARIFICATION_MODE_BINDINGS: readonly KeyBinding[] = [
  kb('ArrowUp', [], 'clarification', 'option-prev', 'Select previous option', 'navigation', false, ''),
  kb('ArrowDown', [], 'clarification', 'option-next', 'Select next option', 'navigation', false, ''),
  kb('ArrowLeft', [], 'clarification', 'option-left', 'Select left option (grid)', 'navigation', false, ''),
  kb('ArrowRight', [], 'clarification', 'option-right', 'Select right option (grid)', 'navigation', false, ''),
  kb('Enter', [], 'clarification', 'confirm-option', 'Confirm selected option', 'action', false, ''),
  kb('Escape', [], 'clarification', 'dismiss-modal', 'Dismiss clarification modal', 'action', false, ''),
  kb('Tab', [], 'clarification', 'cycle-next', 'Cycle to next option', 'navigation', false, ''),
  kb('Tab', ['shift'], 'clarification', 'cycle-prev', 'Cycle to previous option', 'navigation', false, ''),
  kb('Space', [], 'clarification', 'toggle-details', 'Toggle consequence details', 'view', false, ''),
  kb('Home', [], 'clarification', 'first-option', 'Jump to first option', 'navigation', false, ''),
  kb('End', [], 'clarification', 'last-option', 'Jump to last option', 'navigation', false, ''),
  kb('d', [], 'clarification', 'use-default', 'Accept default option', 'action', false, ''),
  kb('s', [], 'clarification', 'skip-question', 'Skip this question', 'action', false, ''),
];

/** Preview mode bindings */
const PREVIEW_MODE_BINDINGS: readonly KeyBinding[] = [
  kb('ArrowUp', [], 'preview', 'diff-prev-hunk', 'Previous diff hunk', 'navigation', false, ''),
  kb('ArrowDown', [], 'preview', 'diff-next-hunk', 'Next diff hunk', 'navigation', false, ''),
  kb('Enter', ['ctrl'], 'preview', 'apply-changes', 'Apply all changes', 'action', true, ''),
  kb('Escape', [], 'preview', 'cancel-preview', 'Cancel and close preview', 'action', false, ''),
  kb('a', [], 'preview', 'accept-hunk', 'Accept current hunk', 'action', false, ''),
  kb('r', [], 'preview', 'reject-hunk', 'Reject current hunk', 'action', false, ''),
  kb('t', [], 'preview', 'toggle-hunk', 'Toggle current hunk', 'action', false, ''),
  kb('e', [], 'preview', 'expand-context', 'Expand diff context', 'view', false, ''),
  kb('c', [], 'preview', 'collapse-context', 'Collapse diff context', 'view', false, ''),
];

/** History mode bindings */
const HISTORY_MODE_BINDINGS: readonly KeyBinding[] = [
  kb('ArrowUp', [], 'history', 'hist-prev', 'Previous history entry', 'navigation', false, ''),
  kb('ArrowDown', [], 'history', 'hist-next', 'Next history entry', 'navigation', false, ''),
  kb('Enter', [], 'history', 'hist-replay', 'Replay selected command', 'action', false, ''),
  kb('Escape', [], 'history', 'hist-close', 'Close history panel', 'action', false, ''),
  kb('/', [], 'history', 'hist-search', 'Search history', 'navigation', false, ''),
  kb('Delete', [], 'history', 'hist-delete', 'Delete history entry', 'action', false, ''),
  kb('c', ['ctrl'], 'history', 'hist-copy', 'Copy command to clipboard', 'action', false, ''),
];

/** Inspector mode bindings */
const INSPECTOR_MODE_BINDINGS: readonly KeyBinding[] = [
  kb('ArrowUp', [], 'inspector', 'node-prev', 'Previous tree node', 'navigation', false, ''),
  kb('ArrowDown', [], 'inspector', 'node-next', 'Next tree node', 'navigation', false, ''),
  kb('ArrowLeft', [], 'inspector', 'node-collapse', 'Collapse tree node', 'navigation', false, ''),
  kb('ArrowRight', [], 'inspector', 'node-expand', 'Expand tree node', 'navigation', false, ''),
  kb('Enter', [], 'inspector', 'node-select', 'Select/inspect node', 'action', false, ''),
  kb('Escape', [], 'inspector', 'inspector-close', 'Close inspector', 'action', false, ''),
  kb('Space', [], 'inspector', 'node-toggle', 'Toggle node expansion', 'navigation', false, ''),
  kb('Home', [], 'inspector', 'tree-top', 'Jump to tree root', 'navigation', false, ''),
  kb('End', [], 'inspector', 'tree-bottom', 'Jump to last visible node', 'navigation', false, ''),
];

/** Vi-style bindings (alternative navigation) */
const VI_STYLE_BINDINGS: readonly KeyBinding[] = [
  kb('j', [], 'command', 'vi-down', 'Move down (vi)', 'vi-nav', false, ''),
  kb('k', [], 'command', 'vi-up', 'Move up (vi)', 'vi-nav', false, ''),
  kb('h', [], 'command', 'vi-left', 'Move left / collapse (vi)', 'vi-nav', false, ''),
  kb('l', [], 'command', 'vi-right', 'Move right / expand (vi)', 'vi-nav', false, ''),
  kb('g', [], 'command', 'vi-goto-top', 'Go to top (vi, chord: gg)', 'vi-nav', true, 'g'),
  kb('G', ['shift'], 'command', 'vi-goto-bottom', 'Go to bottom (vi)', 'vi-nav', false, ''),
  kb('/', [], 'command', 'vi-search', 'Search (vi)', 'vi-nav', false, ''),
  kb('n', [], 'command', 'vi-search-next', 'Next search result (vi)', 'vi-nav', false, ''),
  kb('N', ['shift'], 'command', 'vi-search-prev', 'Previous search result (vi)', 'vi-nav', false, ''),
  kb('i', [], 'command', 'vi-insert', 'Enter insert mode (vi)', 'vi-nav', false, ''),
  kb(':', [], 'command', 'vi-command-mode', 'Enter command line (vi)', 'vi-nav', false, ''),
  kb('u', [], 'command', 'vi-undo', 'Undo (vi)', 'vi-nav', false, ''),
  kb('r', ['ctrl'], 'command', 'vi-redo', 'Redo (vi)', 'vi-nav', false, ''),
  kb('w', [], 'command', 'vi-word-next', 'Next word (vi)', 'vi-nav', false, ''),
  kb('b', [], 'command', 'vi-word-prev', 'Previous word (vi)', 'vi-nav', false, ''),
];

const ALL_DEFAULT_BINDINGS: readonly KeyBinding[] = [
  ...COMMAND_MODE_BINDINGS,
  ...CLARIFICATION_MODE_BINDINGS,
  ...PREVIEW_MODE_BINDINGS,
  ...HISTORY_MODE_BINDINGS,
  ...INSPECTOR_MODE_BINDINGS,
];

// ---------------------------------------------------------------------------
// 359 Functions
// ---------------------------------------------------------------------------

/**
 * Create a default key map with all standard bindings.
 */
export function createKeyMap(viMode: boolean): KeyMap {
  return {
    bindings: ALL_DEFAULT_BINDINGS,
    sequences: buildDefaultSequences(),
    context: {
      mode: 'command',
      isModalOpen: false,
      isInputFocused: true,
      hasSelection: false,
      hasHistory: true,
      hasDiff: false,
      isStrictMode: false,
      viModeEnabled: viMode,
      customBindingsActive: false,
    },
    viBindings: viMode ? VI_STYLE_BINDINGS : [],
    customBindings: [],
    createdAtMs: Date.now(),
    version: 1,
  };
}

function buildDefaultSequences(): readonly KeySequence[] {
  return [
    {
      sequenceId: 'seq-gg',
      keys: ['g', 'g'],
      modifiers: [[], []],
      mode: 'command',
      action: 'goto-top',
      description: 'Go to top of list (vi-style gg)',
      timeoutMs: 500,
      partial: false,
      matchedSoFar: 0,
    },
    {
      sequenceId: 'seq-dd',
      keys: ['d', 'd'],
      modifiers: [[], []],
      mode: 'command',
      action: 'delete-line',
      description: 'Delete current line (vi-style dd)',
      timeoutMs: 500,
      partial: false,
      matchedSoFar: 0,
    },
    {
      sequenceId: 'seq-yy',
      keys: ['y', 'y'],
      modifiers: [[], []],
      mode: 'command',
      action: 'copy-line',
      description: 'Copy current line (vi-style yy)',
      timeoutMs: 500,
      partial: false,
      matchedSoFar: 0,
    },
    {
      sequenceId: 'seq-ctrl-k-ctrl-c',
      keys: ['k', 'c'],
      modifiers: [['ctrl'], ['ctrl']],
      mode: 'command',
      action: 'toggle-comment',
      description: 'Toggle comment (Ctrl+K Ctrl+C)',
      timeoutMs: 800,
      partial: false,
      matchedSoFar: 0,
    },
    {
      sequenceId: 'seq-ctrl-k-ctrl-u',
      keys: ['k', 'u'],
      modifiers: [['ctrl'], ['ctrl']],
      mode: 'command',
      action: 'uncomment',
      description: 'Uncomment (Ctrl+K Ctrl+U)',
      timeoutMs: 800,
      partial: false,
      matchedSoFar: 0,
    },
  ];
}

/**
 * Add a new key binding to the map.
 */
export function bindKey(
  keyMap: KeyMap,
  key: string,
  modifiers: readonly KbModifierKey[],
  mode: NavigationMode,
  action: string,
  description: string
): KeyMap {
  _bindingCounter += 1;
  const newBinding: KeyBinding = {
    id: `kb-custom-${_bindingCounter}`,
    key,
    modifiers,
    mode,
    action,
    description,
    category: 'custom',
    isChord: false,
    chordFollowUp: '',
    enabled: true,
    priority: 1000 + _bindingCounter,
    conflictGroup: `${mode}-${key}-${modifiers.join('+')}`,
  };

  return {
    ...keyMap,
    customBindings: [...keyMap.customBindings, newBinding],
    version: keyMap.version + 1,
  };
}

/**
 * Remove a key binding by its ID.
 */
export function unbindKey(keyMap: KeyMap, bindingId: string): KeyMap {
  return {
    ...keyMap,
    bindings: keyMap.bindings.filter((b) => b.id !== bindingId),
    customBindings: keyMap.customBindings.filter((b) => b.id !== bindingId),
    version: keyMap.version + 1,
  };
}

/**
 * Get all bindings for a specific navigation mode.
 */
export function getBindingsForMode(
  keyMap: KeyMap,
  mode: NavigationMode
): readonly KeyBinding[] {
  const standard = keyMap.bindings.filter((b) => b.mode === mode && b.enabled);
  const custom = keyMap.customBindings.filter((b) => b.mode === mode && b.enabled);
  const vi = keyMap.context.viModeEnabled
    ? keyMap.viBindings.filter((b) => b.mode === mode && b.enabled)
    : [];
  return [...standard, ...vi, ...custom];
}

/**
 * Process a key event and return the action to dispatch (if any).
 */
export function processKeyEvent(
  keyMap: KeyMap,
  key: string,
  modifiers: readonly KbModifierKey[],
  _eventType: KeyEventType
): string {
  const mode = keyMap.context.mode;

  // Check custom bindings first (highest priority)
  for (const binding of keyMap.customBindings) {
    if (
      binding.mode === mode &&
      binding.key === key &&
      binding.enabled &&
      modifiersMatch(binding.modifiers, modifiers)
    ) {
      return binding.action;
    }
  }

  // Check vi bindings if enabled
  if (keyMap.context.viModeEnabled) {
    for (const binding of keyMap.viBindings) {
      if (
        binding.mode === mode &&
        binding.key === key &&
        binding.enabled &&
        modifiersMatch(binding.modifiers, modifiers)
      ) {
        return binding.action;
      }
    }
  }

  // Check standard bindings
  for (const binding of keyMap.bindings) {
    if (
      binding.mode === mode &&
      binding.key === key &&
      binding.enabled &&
      modifiersMatch(binding.modifiers, modifiers)
    ) {
      return binding.action;
    }
  }

  return '';
}

function modifiersMatch(
  expected: readonly KbModifierKey[],
  actual: readonly KbModifierKey[]
): boolean {
  if (expected.length !== actual.length) return false;
  const sortedExpected = [...expected].sort();
  const sortedActual = [...actual].sort();
  for (let i = 0; i < sortedExpected.length; i++) {
    if (sortedExpected[i] !== sortedActual[i]) return false;
  }
  return true;
}

/**
 * Switch navigation mode, returning an updated key map.
 */
export function switchNavigationMode(
  keyMap: KeyMap,
  mode: NavigationMode
): KeyMap {
  return {
    ...keyMap,
    context: {
      ...keyMap.context,
      mode,
      isModalOpen: mode === 'clarification',
      isInputFocused: mode === 'command',
    },
  };
}

/**
 * Get the current active navigation mode.
 */
export function getActiveMode(keyMap: KeyMap): NavigationMode {
  return keyMap.context.mode;
}

/**
 * Check if a binding is a chord key.
 */
export function isChordKey(binding: KeyBinding): boolean {
  return binding.isChord;
}

/**
 * Reset the key map to defaults.
 */
export function resetKeyMap(viMode: boolean): KeyMap {
  return createKeyMap(viMode);
}

/**
 * Get vi-style bindings.
 */
export function getViBindings(): readonly KeyBinding[] {
  return VI_STYLE_BINDINGS;
}

/**
 * Merge two key maps, with the second taking priority on conflicts.
 */
export function mergeKeyMaps(base: KeyMap, overlay: KeyMap): KeyMap {
  const overlayConflicts = new Set(
    overlay.customBindings.map((b) => b.conflictGroup)
  );
  const filteredBase = base.bindings.filter(
    (b) => !overlayConflicts.has(b.conflictGroup)
  );

  return {
    ...base,
    bindings: [...filteredBase, ...overlay.bindings],
    customBindings: [
      ...base.customBindings.filter(
        (b) => !overlayConflicts.has(b.conflictGroup)
      ),
      ...overlay.customBindings,
    ],
    viBindings: overlay.context.viModeEnabled
      ? overlay.viBindings
      : base.viBindings,
    context: overlay.context,
    version: Math.max(base.version, overlay.version) + 1,
  };
}

/**
 * Export key map as a serializable record.
 */
export function exportKeyMap(
  keyMap: KeyMap
): Record<string, readonly KeyBinding[]> {
  const result: Record<string, readonly KeyBinding[]> = {};
  const modes: readonly NavigationMode[] = [
    'command',
    'clarification',
    'preview',
    'history',
    'inspector',
  ];
  for (const mode of modes) {
    result[mode] = getBindingsForMode(keyMap, mode);
  }
  return result;
}

/**
 * Format key bindings as a help text string.
 */
export function formatKeyBindingsHelp(keyMap: KeyMap): string {
  const modes: readonly NavigationMode[] = [
    'command',
    'clarification',
    'preview',
    'history',
    'inspector',
  ];

  const sections: string[] = ['# Keyboard Shortcuts', ''];

  for (const mode of modes) {
    const bindings = getBindingsForMode(keyMap, mode);
    if (bindings.length === 0) continue;

    sections.push(`## ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`);
    sections.push('');

    // Group by category
    const categories = new Map<string, KeyBinding[]>();
    for (const b of bindings) {
      const existing = categories.get(b.category);
      if (existing) {
        existing.push(b);
      } else {
        categories.set(b.category, [b]);
      }
    }

    const categoryEntries = Array.from(categories.entries());
    for (const entry of categoryEntries) {
      const category = entry[0];
      const catBindings = entry[1];
      sections.push(`### ${category}`);
      for (const b of catBindings) {
        const modStr =
          b.modifiers.length > 0 ? b.modifiers.join('+') + '+' : '';
        const keyStr = `${modStr}${b.key}`;
        sections.push(`  ${keyStr.padEnd(20)} ${b.description}`);
      }
      sections.push('');
    }
  }

  if (keyMap.context.viModeEnabled) {
    sections.push('## Vi Bindings');
    sections.push('');
    for (const b of keyMap.viBindings) {
      const modStr =
        b.modifiers.length > 0 ? b.modifiers.join('+') + '+' : '';
      const keyStr = `${modStr}${b.key}`;
      sections.push(`  ${keyStr.padEnd(20)} ${b.description}`);
    }
    sections.push('');
  }

  if (keyMap.sequences.length > 0) {
    sections.push('## Key Sequences');
    sections.push('');
    for (const seq of keyMap.sequences) {
      const keyStr = seq.keys.join(' → ');
      sections.push(`  ${keyStr.padEnd(20)} ${seq.description}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Render a key bindings panel as HTML.
 */
export function renderKeyBindingsPanel(keyMap: KeyMap): string {
  const modes: readonly NavigationMode[] = [
    'command',
    'clarification',
    'preview',
    'history',
    'inspector',
  ];

  const modeTabsHtml = modes
    .map((mode, idx) => {
      const active = mode === keyMap.context.mode ? ' data-active="true"' : '';
      return (
        `<button class="keybind-tab" role="tab" tabindex="${idx === 0 ? 0 : -1}" ` +
        `aria-selected="${mode === keyMap.context.mode}"${active} ` +
        `data-mode="${mode}">` +
        `${mode.charAt(0).toUpperCase() + mode.slice(1)}` +
        `</button>`
      );
    })
    .join('\n');

  const modePanelsHtml = modes
    .map((mode) => {
      const bindings = getBindingsForMode(keyMap, mode);
      const bindingRows = bindings
        .map((b) => {
          const modStr =
            b.modifiers.length > 0 ? b.modifiers.join('+') + '+' : '';
          return (
            `<tr class="keybind-row">` +
            `<td class="keybind-key"><kbd>${modStr}${b.key}</kbd></td>` +
            `<td class="keybind-action">${b.description}</td>` +
            `<td class="keybind-category">${b.category}</td>` +
            `</tr>`
          );
        })
        .join('\n');

      const hidden = mode !== keyMap.context.mode ? ' hidden' : '';
      return (
        `<div class="keybind-panel" role="tabpanel" data-mode="${mode}"${hidden}>` +
        `<table class="keybind-table" role="grid">` +
        `<thead><tr>` +
        `<th scope="col">Key</th>` +
        `<th scope="col">Action</th>` +
        `<th scope="col">Category</th>` +
        `</tr></thead>` +
        `<tbody>${bindingRows}</tbody>` +
        `</table>` +
        `</div>`
      );
    })
    .join('\n');

  return (
    `<div class="keybind-container" role="region" aria-label="Keyboard shortcuts">` +
    `<h3 class="keybind-title">Keyboard Shortcuts</h3>` +
    `<div class="keybind-tabs" role="tablist">${modeTabsHtml}</div>` +
    `${modePanelsHtml}` +
    `<div class="keybind-footer">` +
    `<span>Mode: ${keyMap.context.mode}</span>` +
    `<span>Vi: ${keyMap.context.viModeEnabled ? 'ON' : 'OFF'}</span>` +
    `<span>Custom bindings: ${keyMap.customBindings.length}</span>` +
    `</div>` +
    `</div>`
  );
}


// =============================================================================
// STEP 360 — ACCESSIBILITY SEMANTICS
// ARIA labels, focus management, screen reader-friendly diff summaries.
// =============================================================================

// ---------------------------------------------------------------------------
// 360 Types
// ---------------------------------------------------------------------------

/** ARIA roles supported across UI components */
export type AriaRole =
  | 'dialog'
  | 'tree'
  | 'treeitem'
  | 'button'
  | 'radio'
  | 'radiogroup'
  | 'alert'
  | 'status'
  | 'progressbar'
  | 'tablist'
  | 'tab'
  | 'tabpanel'
  | 'listbox'
  | 'option'
  | 'region'
  | 'toolbar'
  | 'menu'
  | 'menuitem'
  | 'grid'
  | 'gridcell'
  | 'row'
  | 'rowgroup'
  | 'log'
  | 'marquee'
  | 'timer'
  | 'complementary'
  | 'navigation'
  | 'banner'
  | 'contentinfo'
  | 'main'
  | 'search'
  | 'form';

/** Live region politeness levels */
export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive';

/** Focus trap strategy */
export type FocusTrapStrategy = 'wrap' | 'stop' | 'redirect';

/** Component identifiers for accessibility annotations */
export type A11yComponentId =
  | 'deck-container'
  | 'input-pane'
  | 'cpl-pane'
  | 'diff-pane'
  | 'clarification-modal'
  | 'modal-header'
  | 'modal-body'
  | 'modal-footer'
  | 'modal-option'
  | 'modal-close-btn'
  | 'modal-confirm-btn'
  | 'modal-skip-btn'
  | 'freq-toggle'
  | 'freq-level-btn'
  | 'strict-toggle'
  | 'strict-level-btn'
  | 'keybind-panel'
  | 'keybind-tab'
  | 'status-bar'
  | 'diff-hunk'
  | 'cpl-tree'
  | 'cpl-node'
  | 'quick-action'
  | 'entity-chip'
  | 'scope-badge';

/** ARIA label specification for a component */
export interface AriaLabel {
  readonly componentId: A11yComponentId;
  readonly role: AriaRole;
  readonly label: string;
  readonly labelledBy: string;
  readonly describedBy: string;
  readonly liveRegion: LiveRegionPoliteness;
  readonly expanded: boolean | null;
  readonly selected: boolean | null;
  readonly checked: boolean | null;
  readonly disabled: boolean;
  readonly hidden: boolean;
  readonly level: number;
  readonly posInSet: number;
  readonly setSize: number;
  readonly valueNow: number;
  readonly valueMin: number;
  readonly valueMax: number;
  readonly valueText: string;
  readonly keyShortcuts: string;
  readonly orientation: 'horizontal' | 'vertical' | 'undefined';
  readonly hasPopup: boolean;
  readonly controls: string;
  readonly owns: string;
  readonly flowTo: string;
  readonly current: string;
}

/** Focus order specification */
export interface FocusOrder {
  readonly orderId: string;
  readonly componentIds: readonly A11yComponentId[];
  readonly wrapAround: boolean;
  readonly currentIndex: number;
  readonly direction: 'forward' | 'backward';
  readonly skipDisabled: boolean;
  readonly skipHidden: boolean;
}

/** Focus trap definition for modal or overlay */
export interface FocusTrap {
  readonly trapId: string;
  readonly containerComponentId: A11yComponentId;
  readonly focusableComponents: readonly A11yComponentId[];
  readonly initialFocusId: A11yComponentId;
  readonly returnFocusId: A11yComponentId;
  readonly strategy: FocusTrapStrategy;
  readonly isActive: boolean;
  readonly createdAtMs: number;
}

/** Live region configuration */
export interface LiveRegion {
  readonly regionId: string;
  readonly componentId: A11yComponentId;
  readonly politeness: LiveRegionPoliteness;
  readonly atomic: boolean;
  readonly relevant: string;
  readonly busy: boolean;
  readonly lastAnnouncedMs: number;
  readonly queuedAnnouncements: readonly string[];
}

/** Screen reader summary for complex UI state */
export interface ScreenReaderSummary {
  readonly summaryId: string;
  readonly componentId: A11yComponentId;
  readonly shortSummary: string;
  readonly longSummary: string;
  readonly changeDescription: string;
  readonly actionableHint: string;
  readonly updatedAtMs: number;
}

/** Accessibility configuration */
export interface A11yConfig {
  readonly enabled: boolean;
  readonly announceStateChanges: boolean;
  readonly announceNavigation: boolean;
  readonly announceSafety: boolean;
  readonly focusTrapEnabled: boolean;
  readonly highContrastMode: boolean;
  readonly reduceMotion: boolean;
  readonly screenReaderOptimized: boolean;
  readonly verbosityLevel: 'terse' | 'normal' | 'verbose';
  readonly autoDescribeDiffs: boolean;
  readonly autoDescribeCPL: boolean;
  readonly keyboardOnlyMode: boolean;
}

/** Full accessibility spec for a UI component */
export interface DeckAccessibilitySpec {
  readonly labels: readonly AriaLabel[];
  readonly focusOrders: readonly FocusOrder[];
  readonly focusTraps: readonly FocusTrap[];
  readonly liveRegions: readonly LiveRegion[];
  readonly summaries: readonly ScreenReaderSummary[];
  readonly config: A11yConfig;
  readonly createdAtMs: number;
  readonly version: number;
}

// ---------------------------------------------------------------------------
// 360 Constants: 25+ accessibility annotations
// ---------------------------------------------------------------------------

function buildAriaLabel(
  componentId: A11yComponentId,
  role: AriaRole,
  label: string,
  opts?: {
    readonly labelledBy?: string;
    readonly describedBy?: string;
    readonly liveRegion?: LiveRegionPoliteness;
    readonly expanded?: boolean | null;
    readonly selected?: boolean | null;
    readonly checked?: boolean | null;
    readonly disabled?: boolean;
    readonly hidden?: boolean;
    readonly level?: number;
    readonly posInSet?: number;
    readonly setSize?: number;
    readonly valueNow?: number;
    readonly valueMin?: number;
    readonly valueMax?: number;
    readonly valueText?: string;
    readonly keyShortcuts?: string;
    readonly orientation?: 'horizontal' | 'vertical' | 'undefined';
    readonly hasPopup?: boolean;
    readonly controls?: string;
    readonly owns?: string;
    readonly flowTo?: string;
    readonly current?: string;
  }
): AriaLabel {
  return {
    componentId,
    role,
    label,
    labelledBy: opts?.labelledBy ?? '',
    describedBy: opts?.describedBy ?? '',
    liveRegion: opts?.liveRegion ?? 'off',
    expanded: opts?.expanded ?? null,
    selected: opts?.selected ?? null,
    checked: opts?.checked ?? null,
    disabled: opts?.disabled ?? false,
    hidden: opts?.hidden ?? false,
    level: opts?.level ?? 0,
    posInSet: opts?.posInSet ?? 0,
    setSize: opts?.setSize ?? 0,
    valueNow: opts?.valueNow ?? 0,
    valueMin: opts?.valueMin ?? 0,
    valueMax: opts?.valueMax ?? 0,
    valueText: opts?.valueText ?? '',
    keyShortcuts: opts?.keyShortcuts ?? '',
    orientation: opts?.orientation ?? 'undefined',
    hasPopup: opts?.hasPopup ?? false,
    controls: opts?.controls ?? '',
    owns: opts?.owns ?? '',
    flowTo: opts?.flowTo ?? '',
    current: opts?.current ?? '',
  };
}

const DEFAULT_ARIA_LABELS: readonly AriaLabel[] = [
  buildAriaLabel('deck-container', 'main', 'GOFAI Deck workspace', {
    orientation: 'horizontal',
  }),
  buildAriaLabel('input-pane', 'region', 'English command input pane', {
    controls: 'cpl-pane',
    flowTo: 'cpl-pane',
  }),
  buildAriaLabel('cpl-pane', 'region', 'CPL tree viewer pane', {
    controls: 'diff-pane',
    flowTo: 'diff-pane',
  }),
  buildAriaLabel('diff-pane', 'region', 'Plan and diff preview pane'),
  buildAriaLabel('clarification-modal', 'dialog', 'Clarification question', {
    hasPopup: true,
    labelledBy: 'modal-title',
  }),
  buildAriaLabel('modal-header', 'banner', 'Modal header'),
  buildAriaLabel('modal-body', 'main', 'Clarification options'),
  buildAriaLabel('modal-footer', 'contentinfo', 'Modal actions'),
  buildAriaLabel('modal-option', 'option', 'Clarification option', {
    selected: false,
  }),
  buildAriaLabel('modal-close-btn', 'button', 'Close clarification modal', {
    keyShortcuts: 'Escape',
  }),
  buildAriaLabel('modal-confirm-btn', 'button', 'Confirm selection', {
    keyShortcuts: 'Enter',
  }),
  buildAriaLabel('modal-skip-btn', 'button', 'Skip question and use default'),
  buildAriaLabel('freq-toggle', 'radiogroup', 'Question frequency level'),
  buildAriaLabel('freq-level-btn', 'radio', 'Frequency level option', {
    checked: false,
  }),
  buildAriaLabel('strict-toggle', 'radiogroup', 'Strict mode level'),
  buildAriaLabel('strict-level-btn', 'radio', 'Strict mode level option', {
    checked: false,
  }),
  buildAriaLabel('keybind-panel', 'tabpanel', 'Keyboard shortcuts panel'),
  buildAriaLabel('keybind-tab', 'tab', 'Keyboard shortcut category tab', {
    selected: false,
  }),
  buildAriaLabel('status-bar', 'status', 'Application status', {
    liveRegion: 'polite',
  }),
  buildAriaLabel('diff-hunk', 'region', 'Diff change hunk', {
    expanded: true,
  }),
  buildAriaLabel('cpl-tree', 'tree', 'CPL syntax tree', {
    orientation: 'vertical',
  }),
  buildAriaLabel('cpl-node', 'treeitem', 'CPL tree node', {
    expanded: false,
  }),
  buildAriaLabel('quick-action', 'button', 'Quick action'),
  buildAriaLabel('entity-chip', 'button', 'Entity reference chip', {
    hasPopup: true,
  }),
  buildAriaLabel('scope-badge', 'status', 'Scope indicator badge', {
    liveRegion: 'polite',
  }),
];

const DEFAULT_A11Y_CONFIG: A11yConfig = {
  enabled: true,
  announceStateChanges: true,
  announceNavigation: true,
  announceSafety: true,
  focusTrapEnabled: true,
  highContrastMode: false,
  reduceMotion: false,
  screenReaderOptimized: false,
  verbosityLevel: 'normal',
  autoDescribeDiffs: true,
  autoDescribeCPL: true,
  keyboardOnlyMode: false,
};

// ---------------------------------------------------------------------------
// 360 Functions
// ---------------------------------------------------------------------------

/**
 * Create a default accessibility spec.
 */
export function createDeckAccessibilitySpec(): DeckAccessibilitySpec {
  return {
    labels: DEFAULT_ARIA_LABELS,
    focusOrders: [buildDefaultFocusOrder()],
    focusTraps: [],
    liveRegions: buildDefaultLiveRegions(),
    summaries: [],
    config: DEFAULT_A11Y_CONFIG,
    createdAtMs: Date.now(),
    version: 1,
  };
}

function buildDefaultFocusOrder(): FocusOrder {
  return {
    orderId: 'default-focus-order',
    componentIds: [
      'input-pane',
      'cpl-pane',
      'diff-pane',
      'status-bar',
    ],
    wrapAround: true,
    currentIndex: 0,
    direction: 'forward',
    skipDisabled: true,
    skipHidden: true,
  };
}

function buildDefaultLiveRegions(): readonly LiveRegion[] {
  return [
    {
      regionId: 'lr-status',
      componentId: 'status-bar',
      politeness: 'polite',
      atomic: true,
      relevant: 'additions text',
      busy: false,
      lastAnnouncedMs: 0,
      queuedAnnouncements: [],
    },
    {
      regionId: 'lr-clarification',
      componentId: 'clarification-modal',
      politeness: 'assertive',
      atomic: true,
      relevant: 'all',
      busy: false,
      lastAnnouncedMs: 0,
      queuedAnnouncements: [],
    },
    {
      regionId: 'lr-diff',
      componentId: 'diff-pane',
      politeness: 'polite',
      atomic: false,
      relevant: 'additions removals',
      busy: false,
      lastAnnouncedMs: 0,
      queuedAnnouncements: [],
    },
    {
      regionId: 'lr-scope',
      componentId: 'scope-badge',
      politeness: 'polite',
      atomic: true,
      relevant: 'text',
      busy: false,
      lastAnnouncedMs: 0,
      queuedAnnouncements: [],
    },
  ];
}

/**
 * Add or update an ARIA label for a component.
 */
export function addAriaLabel(
  spec: DeckAccessibilitySpec,
  label: AriaLabel
): DeckAccessibilitySpec {
  const existingIdx = spec.labels.findIndex(
    (l) => l.componentId === label.componentId
  );
  const updatedLabels =
    existingIdx >= 0
      ? spec.labels.map((l, idx) => (idx === existingIdx ? label : l))
      : [...spec.labels, label];

  return {
    ...spec,
    labels: updatedLabels,
    version: spec.version + 1,
  };
}

/**
 * Set the focus order for the spec.
 */
export function setFocusOrder(
  spec: DeckAccessibilitySpec,
  componentIds: readonly A11yComponentId[],
  wrapAround: boolean
): DeckAccessibilitySpec {
  const newOrder: FocusOrder = {
    orderId: `fo-${Date.now()}`,
    componentIds,
    wrapAround,
    currentIndex: 0,
    direction: 'forward',
    skipDisabled: true,
    skipHidden: true,
  };
  return {
    ...spec,
    focusOrders: [newOrder, ...spec.focusOrders.slice(1)],
    version: spec.version + 1,
  };
}

let _trapIdCounter = 0;

/**
 * Create a focus trap within a container component.
 */
export function createFocusTrap(
  spec: DeckAccessibilitySpec,
  containerComponentId: A11yComponentId,
  focusableComponents: readonly A11yComponentId[],
  initialFocusId: A11yComponentId,
  returnFocusId: A11yComponentId
): DeckAccessibilitySpec {
  _trapIdCounter += 1;
  const trap: FocusTrap = {
    trapId: `trap-${_trapIdCounter}`,
    containerComponentId,
    focusableComponents,
    initialFocusId,
    returnFocusId,
    strategy: 'wrap',
    isActive: true,
    createdAtMs: Date.now(),
  };
  return {
    ...spec,
    focusTraps: [...spec.focusTraps, trap],
    version: spec.version + 1,
  };
}

/**
 * Release (deactivate) a focus trap.
 */
export function releaseFocusTrap(
  spec: DeckAccessibilitySpec,
  trapId: string
): DeckAccessibilitySpec {
  return {
    ...spec,
    focusTraps: spec.focusTraps.map((t) =>
      t.trapId === trapId ? { ...t, isActive: false } : t
    ),
    version: spec.version + 1,
  };
}

/**
 * Generate a screen reader summary for a complex component.
 */
export function generateScreenReaderSummary(
  componentId: A11yComponentId,
  shortSummary: string,
  longSummary: string,
  actionableHint: string
): ScreenReaderSummary {
  return {
    summaryId: `srs-${componentId}-${Date.now()}`,
    componentId,
    shortSummary,
    longSummary,
    changeDescription: '',
    actionableHint,
    updatedAtMs: Date.now(),
  };
}

/**
 * Generate a screen reader summary for a diff.
 */
export function generateDiffSummary(
  additions: number,
  removals: number,
  hunks: number,
  affectedPaths: readonly string[]
): ScreenReaderSummary {
  const pathList =
    affectedPaths.length > 3
      ? affectedPaths.slice(0, 3).join(', ') +
        `, and ${affectedPaths.length - 3} more`
      : affectedPaths.join(', ');

  const short = `Diff: ${additions} additions, ${removals} removals across ${hunks} hunks.`;
  const long =
    `This diff contains ${additions} line${additions !== 1 ? 's' : ''} added ` +
    `and ${removals} line${removals !== 1 ? 's' : ''} removed, ` +
    `organized into ${hunks} hunk${hunks !== 1 ? 's' : ''}. ` +
    (affectedPaths.length > 0 ? `Affected paths: ${pathList}.` : '');

  return {
    summaryId: `srs-diff-${Date.now()}`,
    componentId: 'diff-pane',
    shortSummary: short,
    longSummary: long,
    changeDescription: `${additions} added, ${removals} removed`,
    actionableHint:
      'Use arrow keys to navigate hunks. Press A to accept, R to reject.',
    updatedAtMs: Date.now(),
  };
}

/**
 * Generate a screen reader summary for a CPL tree.
 */
export function generateCPLSummary(
  nodeCount: number,
  depth: number,
  rootLabel: string,
  errorCount: number
): ScreenReaderSummary {
  const short = `CPL tree: ${nodeCount} nodes, depth ${depth}. Root: ${rootLabel}.`;
  const errorNote =
    errorCount > 0
      ? ` There ${errorCount === 1 ? 'is' : 'are'} ${errorCount} error${errorCount !== 1 ? 's' : ''} in the tree.`
      : ' No errors detected.';
  const long =
    `The CPL syntax tree contains ${nodeCount} node${nodeCount !== 1 ? 's' : ''} ` +
    `with a maximum depth of ${depth}. ` +
    `The root node is "${rootLabel}".${errorNote}`;

  return {
    summaryId: `srs-cpl-${Date.now()}`,
    componentId: 'cpl-tree',
    shortSummary: short,
    longSummary: long,
    changeDescription: '',
    actionableHint:
      'Use arrow keys to navigate nodes. Left/Right to collapse/expand. Enter to inspect.',
    updatedAtMs: Date.now(),
  };
}

/**
 * Add a live region to the spec.
 */
export function addLiveRegion(
  spec: DeckAccessibilitySpec,
  componentId: A11yComponentId,
  politeness: LiveRegionPoliteness
): DeckAccessibilitySpec {
  const region: LiveRegion = {
    regionId: `lr-${componentId}-${Date.now()}`,
    componentId,
    politeness,
    atomic: true,
    relevant: 'additions text',
    busy: false,
    lastAnnouncedMs: 0,
    queuedAnnouncements: [],
  };
  return {
    ...spec,
    liveRegions: [...spec.liveRegions, region],
    version: spec.version + 1,
  };
}

/**
 * Queue an announcement to a specific live region.
 */
export function announceTo(
  spec: DeckAccessibilitySpec,
  componentId: A11yComponentId,
  message: string
): DeckAccessibilitySpec {
  return {
    ...spec,
    liveRegions: spec.liveRegions.map((lr) =>
      lr.componentId === componentId
        ? {
            ...lr,
            queuedAnnouncements: [...lr.queuedAnnouncements, message],
            lastAnnouncedMs: Date.now(),
          }
        : lr
    ),
    version: spec.version + 1,
  };
}

/**
 * Validate that the accessibility spec covers all required components.
 */
export function validateA11y(
  spec: DeckAccessibilitySpec
): readonly string[] {
  const errors: string[] = [];

  // Check required components have labels
  const requiredComponents: readonly A11yComponentId[] = [
    'deck-container',
    'input-pane',
    'cpl-pane',
    'diff-pane',
    'clarification-modal',
    'modal-close-btn',
    'modal-confirm-btn',
  ];

  for (const compId of requiredComponents) {
    const hasLabel = spec.labels.some((l) => l.componentId === compId);
    if (!hasLabel) {
      errors.push(`Missing ARIA label for required component: ${compId}`);
    }
  }

  // Check all labels have non-empty label text
  for (const label of spec.labels) {
    if (!label.label) {
      errors.push(`Empty label text for component: ${label.componentId}`);
    }
  }

  // Check focus orders reference valid components
  for (const fo of spec.focusOrders) {
    if (fo.componentIds.length === 0) {
      errors.push(`Empty focus order: ${fo.orderId}`);
    }
  }

  // Check active focus traps have valid components
  for (const trap of spec.focusTraps) {
    if (trap.isActive && trap.focusableComponents.length === 0) {
      errors.push(
        `Active focus trap ${trap.trapId} has no focusable components.`
      );
    }
  }

  // Check live regions have valid politeness
  for (const lr of spec.liveRegions) {
    if (lr.politeness === 'off' && lr.queuedAnnouncements.length > 0) {
      errors.push(
        `Live region ${lr.regionId} has queued announcements but politeness is "off".`
      );
    }
  }

  // Check config consistency
  if (spec.config.focusTrapEnabled && spec.focusTraps.length === 0) {
    // Not an error — traps are created on demand
  }

  if (spec.config.screenReaderOptimized && spec.summaries.length === 0) {
    errors.push(
      'Screen reader optimized mode is on but no summaries are available.'
    );
  }

  return errors;
}

/**
 * Format an accessibility report as readable text.
 */
export function formatA11yReport(spec: DeckAccessibilitySpec): string {
  const lines: string[] = [
    '# Accessibility Report',
    '',
    `**Labels:** ${spec.labels.length} component annotations`,
    `**Focus Orders:** ${spec.focusOrders.length}`,
    `**Focus Traps:** ${spec.focusTraps.filter((t) => t.isActive).length} active / ${spec.focusTraps.length} total`,
    `**Live Regions:** ${spec.liveRegions.length}`,
    `**Summaries:** ${spec.summaries.length}`,
    '',
    '## Configuration',
    `  Enabled: ${spec.config.enabled}`,
    `  Announce state changes: ${spec.config.announceStateChanges}`,
    `  Announce navigation: ${spec.config.announceNavigation}`,
    `  Announce safety: ${spec.config.announceSafety}`,
    `  Focus trap: ${spec.config.focusTrapEnabled}`,
    `  High contrast: ${spec.config.highContrastMode}`,
    `  Reduce motion: ${spec.config.reduceMotion}`,
    `  Screen reader optimized: ${spec.config.screenReaderOptimized}`,
    `  Verbosity: ${spec.config.verbosityLevel}`,
    `  Auto-describe diffs: ${spec.config.autoDescribeDiffs}`,
    `  Auto-describe CPL: ${spec.config.autoDescribeCPL}`,
    `  Keyboard-only: ${spec.config.keyboardOnlyMode}`,
    '',
    '## Labels',
  ];

  for (const label of spec.labels) {
    lines.push(
      `  ${label.componentId}: role="${label.role}" label="${label.label}"` +
        (label.liveRegion !== 'off'
          ? ` aria-live="${label.liveRegion}"`
          : '') +
        (label.keyShortcuts
          ? ` shortcuts="${label.keyShortcuts}"`
          : '') +
        (label.hasPopup ? ' hasPopup' : '') +
        (label.disabled ? ' disabled' : '')
    );
  }

  lines.push('');
  lines.push('## Live Regions');
  for (const lr of spec.liveRegions) {
    lines.push(
      `  ${lr.regionId}: component="${lr.componentId}" ` +
        `politeness="${lr.politeness}" atomic=${lr.atomic} ` +
        `queued=${lr.queuedAnnouncements.length}`
    );
  }

  const validationErrors = validateA11y(spec);
  if (validationErrors.length > 0) {
    lines.push('');
    lines.push('## Validation Issues');
    for (const err of validationErrors) {
      lines.push(`  - ${err}`);
    }
  } else {
    lines.push('');
    lines.push('## Validation: PASSED');
  }

  return lines.join('\n');
}

/**
 * Get the accessibility config.
 */
export function getA11yConfig(spec: DeckAccessibilitySpec): A11yConfig {
  return spec.config;
}

/**
 * Render accessibility annotation attributes as an HTML string
 * suitable for injection into component markup.
 */
export function renderA11yAnnotations(
  spec: DeckAccessibilitySpec,
  componentId: A11yComponentId
): string {
  const label = spec.labels.find((l) => l.componentId === componentId);
  if (!label) {
    return '';
  }

  const parts: string[] = [];

  parts.push(`role="${label.role}"`);

  if (label.label) {
    parts.push(`aria-label="${label.label}"`);
  }
  if (label.labelledBy) {
    parts.push(`aria-labelledby="${label.labelledBy}"`);
  }
  if (label.describedBy) {
    parts.push(`aria-describedby="${label.describedBy}"`);
  }
  if (label.liveRegion !== 'off') {
    parts.push(`aria-live="${label.liveRegion}"`);
  }
  if (label.expanded !== null) {
    parts.push(`aria-expanded="${label.expanded}"`);
  }
  if (label.selected !== null) {
    parts.push(`aria-selected="${label.selected}"`);
  }
  if (label.checked !== null) {
    parts.push(`aria-checked="${label.checked}"`);
  }
  if (label.disabled) {
    parts.push('aria-disabled="true"');
  }
  if (label.hidden) {
    parts.push('aria-hidden="true"');
  }
  if (label.level > 0) {
    parts.push(`aria-level="${label.level}"`);
  }
  if (label.posInSet > 0) {
    parts.push(`aria-posinset="${label.posInSet}"`);
  }
  if (label.setSize > 0) {
    parts.push(`aria-setsize="${label.setSize}"`);
  }
  if (label.valueNow > 0 || label.valueText) {
    parts.push(`aria-valuenow="${label.valueNow}"`);
    parts.push(`aria-valuemin="${label.valueMin}"`);
    parts.push(`aria-valuemax="${label.valueMax}"`);
    if (label.valueText) {
      parts.push(`aria-valuetext="${label.valueText}"`);
    }
  }
  if (label.keyShortcuts) {
    parts.push(`aria-keyshortcuts="${label.keyShortcuts}"`);
  }
  if (label.orientation !== 'undefined') {
    parts.push(`aria-orientation="${label.orientation}"`);
  }
  if (label.hasPopup) {
    parts.push('aria-haspopup="true"');
  }
  if (label.controls) {
    parts.push(`aria-controls="${label.controls}"`);
  }
  if (label.owns) {
    parts.push(`aria-owns="${label.owns}"`);
  }
  if (label.flowTo) {
    parts.push(`aria-flowto="${label.flowTo}"`);
  }
  if (label.current) {
    parts.push(`aria-current="${label.current}"`);
  }

  return parts.join(' ');
}
