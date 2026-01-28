/**
 * @fileoverview Composer Deck Bar - Quick Access Generator Cards Strip
 * 
 * A horizontal strip of compact generator cards for quick phrase generation.
 * Provides one-click generate → show in notation → accept/reject workflow.
 * 
 * Features:
 * - Compact card representations in a toolbar
 * - Quick generate buttons
 * - Accept/reject/regenerate workflow
 * - Settings memory per section type
 * - Integration with phrase library
 * 
 * @module @cardplay/ui/composer-deck-bar
 */

import type { ClipId, EventStreamId } from '../state/types';
import type { ScoreNoteInput, ChordSymbolInput } from '../cards/score-notation';

// ============================================================================
// DECK BAR TYPES
// ============================================================================

/**
 * Unique identifier for a card slot in the deck bar.
 */
export type DeckSlotId = string & { readonly __deckSlotId?: unique symbol };

/**
 * Create a typed DeckSlotId.
 */
export function asDeckSlotId(id: string): DeckSlotId {
  return id as DeckSlotId;
}

/**
 * Generator card type.
 */
export type GeneratorCardType =
  | 'chord-track'
  | 'phrase-generator'
  | 'melody'
  | 'bassline'
  | 'drums'
  | 'arpeggio'
  | 'harmony'
  | 'counterpoint'
  | 'custom';

/**
 * Card display info.
 */
export const GENERATOR_CARD_INFO: Record<GeneratorCardType, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  'chord-track': {
    label: 'Chords',
    icon: '🎹',
    color: '#9C27B0',
    description: 'Generate chord progressions',
  },
  'phrase-generator': {
    label: 'Phrase',
    icon: '🎵',
    color: '#4CAF50',
    description: 'Generate melodic phrases',
  },
  'melody': {
    label: 'Melody',
    icon: '🎼',
    color: '#2196F3',
    description: 'Generate lead melodies',
  },
  'bassline': {
    label: 'Bass',
    icon: '🎸',
    color: '#FF5722',
    description: 'Generate bass lines',
  },
  'drums': {
    label: 'Drums',
    icon: '🥁',
    color: '#FF9800',
    description: 'Generate drum patterns',
  },
  'arpeggio': {
    label: 'Arp',
    icon: '🌊',
    color: '#00BCD4',
    description: 'Generate arpeggios',
  },
  'harmony': {
    label: 'Harmony',
    icon: '🎻',
    color: '#E91E63',
    description: 'Generate harmonized parts',
  },
  'counterpoint': {
    label: 'Counter',
    icon: '↔️',
    color: '#607D8B',
    description: 'Generate counterpoint',
  },
  'custom': {
    label: 'Custom',
    icon: '⚙️',
    color: '#9E9E9E',
    description: 'Custom generator',
  },
};

/**
 * A card slot in the deck bar.
 */
export interface DeckSlot {
  /** Slot ID */
  readonly id: DeckSlotId;
  /** Card type */
  readonly cardType: GeneratorCardType;
  /** Whether slot is active (expanded) */
  readonly active: boolean;
  /** Whether slot is generating */
  readonly generating: boolean;
  /** Current settings for this slot */
  readonly settings: GeneratorSettings;
  /** Generated output (if any) */
  readonly output: GeneratorOutput | null;
  /** Associated stream ID */
  readonly streamId?: EventStreamId;
  /** Position in deck (0-based) */
  readonly position: number;
  /** Whether slot is pinned (always visible) */
  readonly pinned: boolean;
}

/**
 * Generator settings (shared structure, card-specific values).
 */
export interface GeneratorSettings {
  /** Complexity level (0-1) */
  readonly complexity: number;
  /** Density (notes per beat) */
  readonly density: number;
  /** Rhythm variation (0-1) */
  readonly rhythmVariation: number;
  /** Pitch range */
  readonly pitchRange: { min: number; max: number };
  /** Duration range (in bars) */
  readonly durationBars: number;
  /** Sync to chord changes */
  readonly syncToChords: boolean;
  /** Style/preset name */
  readonly style?: string;
  /** Card-specific parameters */
  readonly custom: Record<string, unknown>;
}

/**
 * Default generator settings.
 */
export const DEFAULT_GENERATOR_SETTINGS: GeneratorSettings = {
  complexity: 0.5,
  density: 2,
  rhythmVariation: 0.5,
  pitchRange: { min: 48, max: 84 },
  durationBars: 4,
  syncToChords: true,
  custom: {},
};

/**
 * Generator output.
 */
export interface GeneratorOutput {
  /** Generated notes */
  readonly notes: readonly ScoreNoteInput[];
  /** Generation timestamp */
  readonly timestamp: number;
  /** Settings used for generation */
  readonly settings: GeneratorSettings;
  /** Source chord context */
  readonly chordContext?: ChordSymbolInput;
  /** Whether output is accepted */
  readonly accepted: boolean;
  /** Whether output is rejected */
  readonly rejected: boolean;
}

// ============================================================================
// DECK BAR STATE
// ============================================================================

/**
 * Deck bar state.
 */
export interface DeckBarState {
  /** All slots */
  readonly slots: readonly DeckSlot[];
  /** Currently active slot (expanded) */
  readonly activeSlotId: DeckSlotId | null;
  /** Slot being configured */
  readonly configuringSlotId: DeckSlotId | null;
  /** Deck bar collapsed */
  readonly collapsed: boolean;
  /** Settings presets per section type */
  readonly sectionPresets: Record<string, Record<GeneratorCardType, GeneratorSettings>>;
  /** Current section type (for preset recall) */
  readonly currentSectionType?: string;
  /** Quick generate enabled */
  readonly quickGenerateEnabled: boolean;
  /** Auto-accept generated content */
  readonly autoAccept: boolean;
}

/**
 * Create initial deck bar state.
 */
export function createDeckBarState(): DeckBarState {
  return {
    slots: [
      createDeckSlot('slot_chord', 'chord-track', 0, true),
      createDeckSlot('slot_phrase', 'phrase-generator', 1, true),
      createDeckSlot('slot_melody', 'melody', 2, false),
      createDeckSlot('slot_bass', 'bassline', 3, false),
      createDeckSlot('slot_drums', 'drums', 4, false),
    ],
    activeSlotId: null,
    configuringSlotId: null,
    collapsed: false,
    sectionPresets: {},
    quickGenerateEnabled: true,
    autoAccept: false,
  };
}

/**
 * Create a deck slot.
 */
function createDeckSlot(
  id: string,
  cardType: GeneratorCardType,
  position: number,
  pinned: boolean
): DeckSlot {
  return {
    id: asDeckSlotId(id),
    cardType,
    active: false,
    generating: false,
    settings: { ...DEFAULT_GENERATOR_SETTINGS },
    output: null,
    position,
    pinned,
  };
}

// ============================================================================
// SLOT OPERATIONS
// ============================================================================

/**
 * Add a slot to the deck bar.
 */
export function addSlot(
  state: DeckBarState,
  cardType: GeneratorCardType
): DeckBarState {
  const newPosition = state.slots.length;
  const newId = `slot_${cardType}_${Date.now()}`;
  
  const newSlot = createDeckSlot(newId, cardType, newPosition, false);
  
  return {
    ...state,
    slots: [...state.slots, newSlot],
  };
}

/**
 * Remove a slot from the deck bar.
 */
export function removeSlot(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckBarState {
  const slot = state.slots.find(s => s.id === slotId);
  if (!slot || slot.pinned) return state;
  
  const filtered = state.slots.filter(s => s.id !== slotId);
  
  // Renumber positions
  const renumbered = filtered.map((s, i) => ({
    ...s,
    position: i,
  }));
  
  return {
    ...state,
    slots: renumbered,
    activeSlotId: state.activeSlotId === slotId ? null : state.activeSlotId,
    configuringSlotId: state.configuringSlotId === slotId ? null : state.configuringSlotId,
  };
}

/**
 * Reorder slots.
 */
export function reorderSlots(
  state: DeckBarState,
  fromIndex: number,
  toIndex: number
): DeckBarState {
  const slots = [...state.slots];
  const [removed] = slots.splice(fromIndex, 1);
  if (!removed) return state;
  
  slots.splice(toIndex, 0, removed);
  
  // Renumber positions
  const renumbered = slots.map((s, i) => ({
    ...s,
    position: i,
  }));
  
  return {
    ...state,
    slots: renumbered,
  };
}

/**
 * Set slot as active (expanded).
 */
export function setActiveSlot(
  state: DeckBarState,
  slotId: DeckSlotId | null
): DeckBarState {
  // Deactivate all, then activate the specified one
  const slots = state.slots.map(slot => ({
    ...slot,
    active: slot.id === slotId,
  }));
  
  return {
    ...state,
    slots,
    activeSlotId: slotId,
  };
}

/**
 * Toggle slot configuration panel.
 */
export function toggleSlotConfiguration(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckBarState {
  return {
    ...state,
    configuringSlotId: state.configuringSlotId === slotId ? null : slotId,
  };
}

/**
 * Update slot settings.
 */
export function updateSlotSettings(
  state: DeckBarState,
  slotId: DeckSlotId,
  settings: Partial<GeneratorSettings>
): DeckBarState {
  const slots = state.slots.map(slot => {
    if (slot.id !== slotId) return slot;
    return {
      ...slot,
      settings: {
        ...slot.settings,
        ...settings,
      },
    };
  });
  
  return {
    ...state,
    slots,
  };
}

/**
 * Toggle slot pinned state.
 */
export function toggleSlotPinned(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckBarState {
  const slots = state.slots.map(slot => {
    if (slot.id !== slotId) return slot;
    return {
      ...slot,
      pinned: !slot.pinned,
    };
  });
  
  return {
    ...state,
    slots,
  };
}

// ============================================================================
// GENERATION OPERATIONS
// ============================================================================

/**
 * Start generating for a slot.
 */
export function startGenerating(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckBarState {
  const slots = state.slots.map(slot => {
    if (slot.id !== slotId) return slot;
    return {
      ...slot,
      generating: true,
      output: null, // Clear previous output
    };
  });
  
  return {
    ...state,
    slots,
    activeSlotId: slotId,
  };
}

/**
 * Set generation output for a slot.
 */
export function setGenerationOutput(
  state: DeckBarState,
  slotId: DeckSlotId,
  notes: readonly ScoreNoteInput[],
  chordContext?: ChordSymbolInput
): DeckBarState {
  const slot = state.slots.find(s => s.id === slotId);
  if (!slot) return state;
  
  // Build output object, handling optional chordContext for exactOptionalPropertyTypes
  const output: GeneratorOutput = {
    notes,
    timestamp: Date.now(),
    settings: slot.settings,
    accepted: state.autoAccept,
    rejected: false,
  };
  
  // Add optional chordContext only if defined
  if (chordContext !== undefined) {
    (output as { chordContext: ChordSymbolInput }).chordContext = chordContext;
  }
  
  const slots = state.slots.map(s => {
    if (s.id !== slotId) return s;
    return {
      ...s,
      generating: false,
      output,
    };
  });
  
  return {
    ...state,
    slots,
  };
}

/**
 * Accept generated output.
 */
export function acceptOutput(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckBarState {
  const slots = state.slots.map(slot => {
    if (slot.id !== slotId || !slot.output) return slot;
    return {
      ...slot,
      output: {
        ...slot.output,
        accepted: true,
        rejected: false,
      },
    };
  });
  
  return {
    ...state,
    slots,
  };
}

/**
 * Reject generated output.
 */
export function rejectOutput(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckBarState {
  const slots = state.slots.map(slot => {
    if (slot.id !== slotId || !slot.output) return slot;
    return {
      ...slot,
      output: {
        ...slot.output,
        accepted: false,
        rejected: true,
      },
    };
  });
  
  return {
    ...state,
    slots,
  };
}

/**
 * Clear output for a slot.
 */
export function clearOutput(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckBarState {
  const slots = state.slots.map(slot => {
    if (slot.id !== slotId) return slot;
    return {
      ...slot,
      output: null,
    };
  });
  
  return {
    ...state,
    slots,
  };
}

// ============================================================================
// PRESET OPERATIONS
// ============================================================================

/**
 * Save current settings as preset for section type.
 */
export function saveSettingsPreset(
  state: DeckBarState,
  sectionType: string
): DeckBarState {
  const preset: Record<GeneratorCardType, GeneratorSettings> = {} as Record<GeneratorCardType, GeneratorSettings>;
  
  for (const slot of state.slots) {
    preset[slot.cardType] = slot.settings;
  }
  
  return {
    ...state,
    sectionPresets: {
      ...state.sectionPresets,
      [sectionType]: preset,
    },
  };
}

/**
 * Recall settings preset for section type.
 */
export function recallSettingsPreset(
  state: DeckBarState,
  sectionType: string
): DeckBarState {
  const preset = state.sectionPresets[sectionType];
  if (!preset) return state;
  
  const slots = state.slots.map(slot => {
    const savedSettings = preset[slot.cardType];
    if (!savedSettings) return slot;
    return {
      ...slot,
      settings: savedSettings,
    };
  });
  
  return {
    ...state,
    slots,
    currentSectionType: sectionType,
  };
}

/**
 * Set current section type (triggers preset recall if available).
 */
export function setCurrentSection(
  state: DeckBarState,
  sectionType: string
): DeckBarState {
  const preset = state.sectionPresets[sectionType];
  if (preset) {
    return recallSettingsPreset(state, sectionType);
  }
  
  return {
    ...state,
    currentSectionType: sectionType,
  };
}

// ============================================================================
// VIEW STATE
// ============================================================================

/**
 * Toggle deck bar collapsed state.
 */
export function toggleDeckBarCollapsed(state: DeckBarState): DeckBarState {
  return {
    ...state,
    collapsed: !state.collapsed,
  };
}

/**
 * Set quick generate enabled.
 */
export function setQuickGenerateEnabled(
  state: DeckBarState,
  enabled: boolean
): DeckBarState {
  return {
    ...state,
    quickGenerateEnabled: enabled,
  };
}

/**
 * Set auto accept.
 */
export function setAutoAccept(
  state: DeckBarState,
  autoAccept: boolean
): DeckBarState {
  return {
    ...state,
    autoAccept,
  };
}

// ============================================================================
// COMPUTED VALUES
// ============================================================================

/**
 * Get visible slots (pinned + some unpinned based on available space).
 */
export function getVisibleSlots(
  state: DeckBarState,
  maxVisible: number = 8
): readonly DeckSlot[] {
  if (state.collapsed) return [];
  
  const pinned = state.slots.filter(s => s.pinned);
  const unpinned = state.slots.filter(s => !s.pinned);
  
  const remainingSpace = maxVisible - pinned.length;
  const visibleUnpinned = unpinned.slice(0, Math.max(0, remainingSpace));
  
  return [...pinned, ...visibleUnpinned].sort((a, b) => a.position - b.position);
}

/**
 * Get active slot.
 */
export function getActiveSlot(state: DeckBarState): DeckSlot | null {
  if (!state.activeSlotId) return null;
  return state.slots.find(s => s.id === state.activeSlotId) ?? null;
}

/**
 * Get slot by ID.
 */
export function getSlotById(
  state: DeckBarState,
  slotId: DeckSlotId
): DeckSlot | null {
  return state.slots.find(s => s.id === slotId) ?? null;
}

/**
 * Get slots with pending output (not accepted or rejected).
 */
export function getSlotsWithPendingOutput(state: DeckBarState): readonly DeckSlot[] {
  return state.slots.filter(
    s => s.output && !s.output.accepted && !s.output.rejected
  );
}

/**
 * Get any generating slots.
 */
export function getGeneratingSlots(state: DeckBarState): readonly DeckSlot[] {
  return state.slots.filter(s => s.generating);
}

/**
 * Check if any slot has pending output.
 */
export function hasPendingOutput(state: DeckBarState): boolean {
  return getSlotsWithPendingOutput(state).length > 0;
}

// ============================================================================
// DECK BAR CONTROLLER
// ============================================================================

/**
 * Generator callback type.
 */
export type GeneratorCallback = (
  cardType: GeneratorCardType,
  settings: GeneratorSettings,
  chordContext?: ChordSymbolInput
) => Promise<readonly ScoreNoteInput[]>;

/**
 * Deck bar adapter interface.
 */
export interface DeckBarAdapter {
  /** Generate content for a card type */
  generate: GeneratorCallback;
  
  /** Show generated content in notation */
  showInNotation(notes: readonly ScoreNoteInput[]): void;
  
  /** Clear notation preview */
  clearNotationPreview(): void;
  
  /** Accept content to target clip */
  acceptToClip(notes: readonly ScoreNoteInput[], clipId?: ClipId): void;
  
  /** Get current chord context */
  getCurrentChordContext(): ChordSymbolInput | null;
  
  /** Get current section type */
  getCurrentSectionType(): string | null;
}

/**
 * Deck bar controller.
 */
export class DeckBarController {
  private state: DeckBarState;
  private adapter: DeckBarAdapter | null = null;
  private listeners: Set<(state: DeckBarState) => void> = new Set();
  
  constructor() {
    this.state = createDeckBarState();
  }
  
  /**
   * Set adapter for external integration.
   */
  setAdapter(adapter: DeckBarAdapter): void {
    this.adapter = adapter;
  }
  
  /**
   * Get current state.
   */
  getState(): DeckBarState {
    return this.state;
  }
  
  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: DeckBarState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Update state and notify listeners.
   */
  private updateState(newState: DeckBarState): void {
    this.state = newState;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
  
  /**
   * Add a slot.
   */
  addSlot(cardType: GeneratorCardType): void {
    this.updateState(addSlot(this.state, cardType));
  }
  
  /**
   * Remove a slot.
   */
  removeSlot(slotId: DeckSlotId): void {
    this.updateState(removeSlot(this.state, slotId));
  }
  
  /**
   * Reorder slots.
   */
  reorderSlots(fromIndex: number, toIndex: number): void {
    this.updateState(reorderSlots(this.state, fromIndex, toIndex));
  }
  
  /**
   * Set active slot.
   */
  setActiveSlot(slotId: DeckSlotId | null): void {
    this.updateState(setActiveSlot(this.state, slotId));
    
    // Show output in notation if available
    const slot = slotId ? getSlotById(this.state, slotId) : null;
    if (slot?.output && this.adapter) {
      this.adapter.showInNotation(slot.output.notes);
    } else if (this.adapter) {
      this.adapter.clearNotationPreview();
    }
  }
  
  /**
   * Toggle slot configuration.
   */
  toggleConfiguration(slotId: DeckSlotId): void {
    this.updateState(toggleSlotConfiguration(this.state, slotId));
  }
  
  /**
   * Update slot settings.
   */
  updateSettings(slotId: DeckSlotId, settings: Partial<GeneratorSettings>): void {
    this.updateState(updateSlotSettings(this.state, slotId, settings));
  }
  
  /**
   * Toggle slot pinned.
   */
  togglePinned(slotId: DeckSlotId): void {
    this.updateState(toggleSlotPinned(this.state, slotId));
  }
  
  /**
   * Generate for a slot.
   */
  async generate(slotId: DeckSlotId): Promise<void> {
    if (!this.adapter) return;
    
    const slot = getSlotById(this.state, slotId);
    if (!slot) return;
    
    // Start generating
    this.updateState(startGenerating(this.state, slotId));
    
    try {
      const chordContext = this.adapter.getCurrentChordContext() ?? undefined;
      const notes = await this.adapter.generate(
        slot.cardType,
        slot.settings,
        chordContext
      );
      
      // Set output
      this.updateState(setGenerationOutput(this.state, slotId, notes, chordContext));
      
      // Show in notation
      this.adapter.showInNotation(notes);
    } catch (error) {
      console.error('Generation failed:', error);
      // Clear generating state
      this.updateState({
        ...this.state,
        slots: this.state.slots.map(s =>
          s.id === slotId ? { ...s, generating: false } : s
        ),
      });
    }
  }
  
  /**
   * Quick generate (one-click).
   */
  async quickGenerate(slotId: DeckSlotId): Promise<void> {
    if (!this.state.quickGenerateEnabled) return;
    await this.generate(slotId);
  }
  
  /**
   * Regenerate with variation.
   */
  async regenerate(slotId: DeckSlotId): Promise<void> {
    const slot = getSlotById(this.state, slotId);
    if (!slot) return;
    
    // Slightly vary settings for different result
    const variedSettings: Partial<GeneratorSettings> = {
      complexity: Math.max(0, Math.min(1, slot.settings.complexity + (Math.random() - 0.5) * 0.2)),
      rhythmVariation: Math.max(0, Math.min(1, slot.settings.rhythmVariation + (Math.random() - 0.5) * 0.2)),
    };
    
    this.updateSettings(slotId, variedSettings);
    await this.generate(slotId);
  }
  
  /**
   * Accept output for a slot.
   */
  accept(slotId: DeckSlotId, clipId?: ClipId): void {
    const slot = getSlotById(this.state, slotId);
    if (!slot?.output || !this.adapter) return;
    
    this.adapter.acceptToClip(slot.output.notes, clipId);
    this.updateState(acceptOutput(this.state, slotId));
    this.adapter.clearNotationPreview();
  }
  
  /**
   * Reject output for a slot.
   */
  reject(slotId: DeckSlotId): void {
    this.updateState(rejectOutput(this.state, slotId));
    this.adapter?.clearNotationPreview();
  }
  
  /**
   * Accept all pending outputs.
   */
  acceptAll(clipId?: ClipId): void {
    const pending = getSlotsWithPendingOutput(this.state);
    for (const slot of pending) {
      this.accept(slot.id, clipId);
    }
  }
  
  /**
   * Reject all pending outputs.
   */
  rejectAll(): void {
    const pending = getSlotsWithPendingOutput(this.state);
    for (const slot of pending) {
      this.reject(slot.id);
    }
  }
  
  /**
   * Clear output for a slot.
   */
  clear(slotId: DeckSlotId): void {
    this.updateState(clearOutput(this.state, slotId));
  }
  
  /**
   * Toggle collapsed state.
   */
  toggleCollapsed(): void {
    this.updateState(toggleDeckBarCollapsed(this.state));
  }
  
  /**
   * Set quick generate enabled.
   */
  setQuickGenerate(enabled: boolean): void {
    this.updateState(setQuickGenerateEnabled(this.state, enabled));
  }
  
  /**
   * Set auto accept.
   */
  setAutoAccept(autoAccept: boolean): void {
    this.updateState(setAutoAccept(this.state, autoAccept));
  }
  
  /**
   * Save settings preset for current section.
   */
  savePreset(): void {
    if (this.adapter) {
      const sectionType = this.adapter.getCurrentSectionType();
      if (sectionType) {
        this.updateState(saveSettingsPreset(this.state, sectionType));
      }
    }
  }
  
  /**
   * Recall preset for section type.
   */
  recallPreset(sectionType: string): void {
    this.updateState(recallSettingsPreset(this.state, sectionType));
  }
  
  /**
   * Handle section change (auto-recall preset if available).
   */
  onSectionChange(sectionType: string): void {
    this.updateState(setCurrentSection(this.state, sectionType));
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let deckBarControllerInstance: DeckBarController | null = null;

/**
 * Get deck bar controller singleton.
 */
export function getDeckBarController(): DeckBarController {
  if (!deckBarControllerInstance) {
    deckBarControllerInstance = new DeckBarController();
  }
  return deckBarControllerInstance;
}

/**
 * Reset deck bar controller (for testing).
 */
export function resetDeckBarController(): void {
  deckBarControllerInstance = null;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Keyboard shortcuts for deck bar.
 */
export const DECK_BAR_SHORTCUTS: Record<string, {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  description: string;
  action: string;
}> = {
  'generate': {
    key: 'g',
    description: 'Generate phrase',
    action: 'generateActive',
  },
  'regenerate': {
    key: 'g',
    modifiers: ['ctrl'],
    description: 'Regenerate with variation',
    action: 'regenerateActive',
  },
  'accept': {
    key: 'Enter',
    modifiers: ['ctrl'],
    description: 'Accept generated content',
    action: 'acceptActive',
  },
  'reject': {
    key: 'Escape',
    description: 'Reject generated content',
    action: 'rejectActive',
  },
  'nextSlot': {
    key: 'Tab',
    description: 'Next generator slot',
    action: 'nextSlot',
  },
  'prevSlot': {
    key: 'Tab',
    modifiers: ['shift'],
    description: 'Previous generator slot',
    action: 'prevSlot',
  },
  'toggleConfig': {
    key: 's',
    modifiers: ['ctrl'],
    description: 'Toggle settings panel',
    action: 'toggleConfig',
  },
  'slot1': {
    key: '1',
    description: 'Activate slot 1',
    action: 'activateSlot0',
  },
  'slot2': {
    key: '2',
    description: 'Activate slot 2',
    action: 'activateSlot1',
  },
  'slot3': {
    key: '3',
    description: 'Activate slot 3',
    action: 'activateSlot2',
  },
  'slot4': {
    key: '4',
    description: 'Activate slot 4',
    action: 'activateSlot3',
  },
  'slot5': {
    key: '5',
    description: 'Activate slot 5',
    action: 'activateSlot4',
  },
};

/**
 * Handle keyboard shortcut.
 */
export function handleDeckBarShortcut(
  controller: DeckBarController,
  action: string
): void {
  const state = controller.getState();
  
  switch (action) {
    case 'generateActive': {
      const activeSlot = getActiveSlot(state);
      if (activeSlot) {
        controller.generate(activeSlot.id);
      }
      break;
    }
    case 'regenerateActive': {
      const activeSlot = getActiveSlot(state);
      if (activeSlot) {
        controller.regenerate(activeSlot.id);
      }
      break;
    }
    case 'acceptActive': {
      const activeSlot = getActiveSlot(state);
      if (activeSlot?.output) {
        controller.accept(activeSlot.id);
      }
      break;
    }
    case 'rejectActive': {
      const activeSlot = getActiveSlot(state);
      if (activeSlot?.output) {
        controller.reject(activeSlot.id);
      }
      break;
    }
    case 'nextSlot': {
      const visible = getVisibleSlots(state);
      const activeIndex = visible.findIndex(s => s.id === state.activeSlotId);
      const nextIndex = (activeIndex + 1) % visible.length;
      const nextSlot = visible[nextIndex];
      if (nextSlot) {
        controller.setActiveSlot(nextSlot.id);
      }
      break;
    }
    case 'prevSlot': {
      const visible = getVisibleSlots(state);
      const activeIndex = visible.findIndex(s => s.id === state.activeSlotId);
      const prevIndex = (activeIndex - 1 + visible.length) % visible.length;
      const prevSlot = visible[prevIndex];
      if (prevSlot) {
        controller.setActiveSlot(prevSlot.id);
      }
      break;
    }
    case 'toggleConfig': {
      const activeSlot = getActiveSlot(state);
      if (activeSlot) {
        controller.toggleConfiguration(activeSlot.id);
      }
      break;
    }
    default: {
      // Handle slot activation (activateSlot0, activateSlot1, etc.)
      const slotMatch = action.match(/^activateSlot(\d+)$/);
      if (slotMatch) {
        const index = parseInt(slotMatch[1]!, 10);
        const visible = getVisibleSlots(state);
        const slot = visible[index];
        if (slot) {
          controller.setActiveSlot(slot.id);
        }
      }
    }
  }
}
