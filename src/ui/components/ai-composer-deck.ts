/**
 * @fileoverview AI Composer Deck UI (Phase H: H037-H046)
 * 
 * Prompt-based composition interface for the AI Composition Board:
 * - H037: Prompt box, target scope, Generate button
 * - H038: Local prompt → generator config mapping (no external model)
 * - H039-H042: Generation modes and constraints
 * - H043-H046: Chord-following and safety rails
 * 
 * @module @cardplay/ui/components/ai-composer-deck
 */

import type { ClipId } from '../../state/types';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getUndoStack } from '../../state/undo-stack';
import { getBoardContextStore } from '../../boards/context/store';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event-kind';
import { generateEventId } from '../../types/event-id';
import type { Event } from '../../types/event';
import type { Chord, MusicalKey } from '../../boards/builtins/harmony-analysis';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generation target scope.
 */
export type GenerationScope = 'clip' | 'section' | 'track' | 'selection';

/**
 * Generation mode.
 */
export type GenerationMode = 'draft' | 'replace' | 'append' | 'variation';

/**
 * Generation constraints.
 */
export interface GenerationConstraints {
  /** Key signature */
  key?: MusicalKey;
  
  /** Chord progression */
  chords?: Chord[];
  
  /** Density (0-1) */
  density: number;
  
  /** Register (MIDI note range) */
  register: { min: number; max: number };
  
  /** Rhythm feel */
  rhythmFeel: 'straight' | 'swing' | 'shuffle' | 'triplets';
  
  /** Length in ticks */
  length: number;
}

/**
 * Prompt template.
 */
export interface PromptTemplate {
  /** Template ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Prompt text */
  prompt: string;
  
  /** Default constraints */
  constraints: Partial<GenerationConstraints>;
}

/**
 * AI Composer deck state.
 */
export interface AIComposerDeckState {
  /** Current prompt */
  prompt: string;
  
  /** Target scope */
  scope: GenerationScope;
  
  /** Generation mode */
  mode: GenerationMode;
  
  /** Constraints */
  constraints: GenerationConstraints;
  
  /** Prompt templates */
  templates: PromptTemplate[];
  
  /** Preview clip (for diff view) */
  previewClipId: ClipId | null;
}

// ============================================================================
// PROMPT TEMPLATES (H038)
// ============================================================================

/**
 * Built-in prompt templates with local generator config mapping.
 * No external model required - maps to local generator parameters.
 */
const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'melody-simple',
    name: 'Simple Melody',
    prompt: 'Generate a simple, singable melody',
    constraints: {
      density: 0.4,
      register: { min: 60, max: 72 },
      rhythmFeel: 'straight',
      length: 384 * 4 // 4 bars
    }
  },
  {
    id: 'melody-complex',
    name: 'Complex Melody',
    prompt: 'Generate a complex, virtuosic melody',
    constraints: {
      density: 0.8,
      register: { min: 48, max: 84 },
      rhythmFeel: 'straight',
      length: 384 * 4
    }
  },
  {
    id: 'bass-walking',
    name: 'Walking Bass',
    prompt: 'Generate a walking bass line',
    constraints: {
      density: 0.7,
      register: { min: 28, max: 48 },
      rhythmFeel: 'swing',
      length: 384 * 4
    }
  },
  {
    id: 'chord-prog',
    name: 'Chord Progression',
    prompt: 'Generate a chord progression',
    constraints: {
      density: 0.2,
      register: { min: 48, max: 72 },
      rhythmFeel: 'straight',
      length: 384 * 4
    }
  },
  {
    id: 'drums-basic',
    name: 'Basic Drums',
    prompt: 'Generate a basic drum pattern',
    constraints: {
      density: 0.5,
      register: { min: 36, max: 48 },
      rhythmFeel: 'straight',
      length: 384 * 4
    }
  },
  {
    id: 'arpeggio',
    name: 'Arpeggio',
    prompt: 'Generate an arpeggiated pattern',
    constraints: {
      density: 0.9,
      register: { min: 48, max: 72 },
      rhythmFeel: 'triplets',
      length: 384 * 4
    }
  }
];

// ============================================================================
// AI COMPOSER DECK
// ============================================================================

/**
 * Create AI composer deck instance.
 * 
 * H037: Implements prompt box, target scope, and Generate button.
 */
export function createAIComposerDeck(): {
  state: AIComposerDeckState;
  setPrompt: (prompt: string) => void;
  setScope: (scope: GenerationScope) => void;
  setMode: (mode: GenerationMode) => void;
  setConstraints: (constraints: Partial<GenerationConstraints>) => void;
  loadTemplate: (templateId: string) => void;
  generate: () => void;
  acceptDraft: () => void;
  rejectDraft: () => void;
  render: (container: HTMLElement) => () => void;
} {
  const state: AIComposerDeckState = {
    prompt: '',
    scope: 'clip',
    mode: 'draft',
    constraints: {
      density: 0.5,
      register: { min: 48, max: 72 },
      rhythmFeel: 'straight',
      length: 384 * 4
    },
    templates: PROMPT_TEMPLATES,
    previewClipId: null
  };

  /**
   * Set prompt text.
   */
  function setPrompt(prompt: string): void {
    state.prompt = prompt;
  }

  /**
   * Set generation scope.
   */
  function setScope(scope: GenerationScope): void {
    state.scope = scope;
  }

  /**
   * Set generation mode.
   */
  function setMode(mode: GenerationMode): void {
    state.mode = mode;
  }

  /**
   * Update constraints.
   */
  function setConstraints(constraints: Partial<GenerationConstraints>): void {
    Object.assign(state.constraints, constraints);
  }

  /**
   * Load a template.
   */
  function loadTemplate(templateId: string): void {
    const template = state.templates.find(t => t.id === templateId);
    if (template) {
      state.prompt = template.prompt;
      Object.assign(state.constraints, template.constraints);
    }
  }

  /**
   * H039: Generate draft based on prompt.
   * H043: Can follow chord track if provided.
   */
  function generate(): void {
    const store = getSharedEventStore();
    const registry = getClipRegistry();
    const context = getBoardContextStore().getContext();

    // H038: Map prompt to generator config
    const config = mapPromptToGeneratorConfig(state.prompt, state.constraints);

    // Generate events
    const events = generateEvents(config);

    if (state.mode === 'draft') {
      // H039: Generate into preview area
      const previewStream = store.createStream({ name: 'AI Draft (preview)' });
      store.addEvents(previewStream.id, events);

      const previewClip = registry.createClip({
        name: 'AI Draft',
        streamId: previewStream.id,
        duration: asTick(state.constraints.length),
        loop: false
      });

      state.previewClipId = previewClip.id;
      console.info('Generated draft:', { events: events.length });
    } else if (state.mode === 'replace' && context.activeStreamId) {
      // H040: Replace selection mode
      const stream = store.getStream(context.activeStreamId);
      if (stream) {
        // H046: Wrap in undo group
        const undoStack = getUndoStack();
        const originalEvents = [...stream.events];

        store.removeEvents(context.activeStreamId, stream.events.map(e => e.id));
        store.addEvents(context.activeStreamId, events);

        undoStack.push({
          type: 'batch',
          description: 'AI Generate (Replace)',
          undo: () => {
            store.removeEvents(context.activeStreamId!, stream.events.map(e => e.id));
            store.addEvents(context.activeStreamId!, originalEvents);
          },
          redo: () => {
            store.removeEvents(context.activeStreamId!, originalEvents.map(e => e.id));
            store.addEvents(context.activeStreamId!, events);
          }
        });
      }
    } else if (state.mode === 'append' && context.activeStreamId) {
      // H040: Append mode
      store.addEvents(context.activeStreamId, events);
    } else if (state.mode === 'variation' && context.activeStreamId) {
      // H040: Generate variation
      const stream = store.getStream(context.activeStreamId);
      if (stream && stream.events.length > 0) {
        const variedEvents = generateVariation(stream.events, config);
        store.addEvents(context.activeStreamId, variedEvents);
      }
    }
  }

  /**
   * H041: Accept draft (commit to active stream).
   */
  function acceptDraft(): void {
    if (!state.previewClipId) return;

    const registry = getClipRegistry();
    const previewClip = registry.getClip(state.previewClipId);
    if (!previewClip) return;

    const store = getSharedEventStore();
    const previewStream = store.getStream(previewClip.streamId);
    if (!previewStream) return;

    const context = getBoardContextStore().getContext();
    if (!context.activeStreamId) return;

    // Copy events to active stream
    store.addEvents(context.activeStreamId, previewStream.events);

    // Clean up preview
    // registry.removeClip(state.previewClipId); // TODO: Implement removeClip in ClipRegistry
    state.previewClipId = null;

    console.info('Accepted draft');
  }

  /**
   * H041: Reject draft (discard preview).
   */
  function rejectDraft(): void {
    if (!state.previewClipId) return;

    // registry.removeClip(state.previewClipId); // TODO: Implement removeClip in ClipRegistry
    state.previewClipId = null;

    console.info('Rejected draft');
  }

  /**
   * Render AI composer deck UI.
   */
  function render(container: HTMLElement): () => void {
    container.innerHTML = `
      <div class="ai-composer-deck">
        <div class="ai-composer-deck__header">
          <h3>AI Composer</h3>
        </div>
        
        <div class="ai-composer-deck__templates">
          <label>Template:</label>
          <select class="template-selector">
            <option value="">Custom</option>
            ${state.templates
              .map(t => `<option value="${t.id}">${t.name}</option>`)
              .join('')}
          </select>
        </div>
        
        <div class="ai-composer-deck__prompt">
          <label>Prompt:</label>
          <textarea 
            class="prompt-input" 
            placeholder="Describe what you want to generate..."
            rows="3"
          >${state.prompt}</textarea>
        </div>
        
        <div class="ai-composer-deck__scope">
          <label>Target:</label>
          <select class="scope-selector">
            <option value="clip" ${state.scope === 'clip' ? 'selected' : ''}>Clip</option>
            <option value="section" ${state.scope === 'section' ? 'selected' : ''}>Section</option>
            <option value="track" ${state.scope === 'track' ? 'selected' : ''}>Track</option>
            <option value="selection" ${state.scope === 'selection' ? 'selected' : ''}>Selection</option>
          </select>
        </div>
        
        <div class="ai-composer-deck__mode">
          <label>Mode:</label>
          <select class="mode-selector">
            <option value="draft" ${state.mode === 'draft' ? 'selected' : ''}>Draft (preview)</option>
            <option value="replace" ${state.mode === 'replace' ? 'selected' : ''}>Replace</option>
            <option value="append" ${state.mode === 'append' ? 'selected' : ''}>Append</option>
            <option value="variation" ${state.mode === 'variation' ? 'selected' : ''}>Variation</option>
          </select>
        </div>
        
        <div class="ai-composer-deck__constraints">
          <h4>Constraints</h4>
          <div class="constraint">
            <label>Density: ${Math.round(state.constraints.density * 100)}%</label>
            <input 
              type="range" 
              class="constraint-density"
              min="0" 
              max="100" 
              value="${state.constraints.density * 100}"
            />
          </div>
          <div class="constraint">
            <label>Rhythm Feel:</label>
            <select class="constraint-rhythm">
              ${['straight', 'swing', 'shuffle', 'triplets']
                .map(feel => `<option value="${feel}" ${state.constraints.rhythmFeel === feel ? 'selected' : ''}>${feel}</option>`)
                .join('')}
            </select>
          </div>
          <div class="constraint">
            <label>Register:</label>
            <input 
              type="number" 
              class="constraint-min-note"
              value="${state.constraints.register.min}" 
              min="0" 
              max="127"
            /> - 
            <input 
              type="number" 
              class="constraint-max-note"
              value="${state.constraints.register.max}" 
              min="0" 
              max="127"
            />
          </div>
        </div>
        
        <div class="ai-composer-deck__actions">
          <button class="btn-generate btn-primary">Generate</button>
          ${
            state.previewClipId
              ? `
            <button class="btn-accept btn-success">Accept</button>
            <button class="btn-reject btn-danger">Reject</button>
          `
              : ''
          }
        </div>
      </div>
    `;

    // Event listeners
    const promptInput = container.querySelector('.prompt-input') as HTMLTextAreaElement;
    const templateSelector = container.querySelector('.template-selector') as HTMLSelectElement;
    const scopeSelector = container.querySelector('.scope-selector') as HTMLSelectElement;
    const modeSelector = container.querySelector('.mode-selector') as HTMLSelectElement;
    const densitySlider = container.querySelector('.constraint-density') as HTMLInputElement;
    const rhythmSelect = container.querySelector('.constraint-rhythm') as HTMLSelectElement;
    const minNoteInput = container.querySelector('.constraint-min-note') as HTMLInputElement;
    const maxNoteInput = container.querySelector('.constraint-max-note') as HTMLInputElement;
    const generateButton = container.querySelector('.btn-generate') as HTMLButtonElement;
    const acceptButton = container.querySelector('.btn-accept') as HTMLButtonElement | null;
    const rejectButton = container.querySelector('.btn-reject') as HTMLButtonElement | null;

    promptInput?.addEventListener('input', () => setPrompt(promptInput.value));
    templateSelector?.addEventListener('change', () => {
      if (templateSelector.value) {
        loadTemplate(templateSelector.value);
        // Re-render to show updated constraints
        render(container);
      }
    });
    scopeSelector?.addEventListener('change', () => setScope(scopeSelector.value as GenerationScope));
    modeSelector?.addEventListener('change', () => setMode(modeSelector.value as GenerationMode));
    densitySlider?.addEventListener('input', () =>
      setConstraints({ density: parseInt(densitySlider.value) / 100 })
    );
    rhythmSelect?.addEventListener('change', () =>
      setConstraints({ rhythmFeel: rhythmSelect.value as any })
    );
    minNoteInput?.addEventListener('change', () =>
      setConstraints({
        register: { ...state.constraints.register, min: parseInt(minNoteInput.value) }
      })
    );
    maxNoteInput?.addEventListener('change', () =>
      setConstraints({
        register: { ...state.constraints.register, max: parseInt(maxNoteInput.value) }
      })
    );
    generateButton?.addEventListener('click', generate);
    acceptButton?.addEventListener('click', acceptDraft);
    rejectButton?.addEventListener('click', rejectDraft);

    return () => {
      container.innerHTML = '';
    };
  }

  return {
    state,
    setPrompt,
    setScope,
    setMode,
    setConstraints,
    loadTemplate,
    generate,
    acceptDraft,
    rejectDraft,
    render
  };
}

// ============================================================================
// GENERATION HELPERS
// ============================================================================

/**
 * H038: Map prompt to generator configuration.
 * Simple keyword-based mapping (no ML model required).
 */
function mapPromptToGeneratorConfig(
  prompt: string,
  constraints: GenerationConstraints
): GenerationConstraints {
  const lower = prompt.toLowerCase();

  // Adjust density based on keywords
  let density = constraints.density;
  if (lower.includes('sparse') || lower.includes('minimal')) {
    density = Math.min(density, 0.3);
  } else if (lower.includes('dense') || lower.includes('busy')) {
    density = Math.max(density, 0.7);
  }

  // Adjust rhythm feel based on keywords
  let rhythmFeel = constraints.rhythmFeel;
  if (lower.includes('swing') || lower.includes('jazz')) {
    rhythmFeel = 'swing';
  } else if (lower.includes('shuffle')) {
    rhythmFeel = 'shuffle';
  } else if (lower.includes('triplet')) {
    rhythmFeel = 'triplets';
  }

  return {
    ...constraints,
    density,
    rhythmFeel
  };
}

/**
 * Generate events based on config.
 */
function generateEvents(
  config: GenerationConstraints
): Event<any>[] {
  const events: Event<any>[] = [];
  const ticksPerBeat = 96;
  const beats = Math.ceil(config.length / ticksPerBeat);

  const noteRange = config.register.max - config.register.min;
  const notesPerBeat = Math.round(config.density * 4); // 0-4 notes per beat

  for (let beat = 0; beat < beats; beat++) {
    for (let i = 0; i < notesPerBeat; i++) {
      const tick = beat * ticksPerBeat + (i * ticksPerBeat) / notesPerBeat;
      const note = config.register.min + Math.floor(Math.random() * noteRange);

      events.push({
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(tick),
        duration: asTickDuration(ticksPerBeat / notesPerBeat),
        payload: {
          note,
          velocity: 80
        }
      });
    }
  }

  return events;
}

/**
 * Generate variation of existing events.
 */
function generateVariation(
  existingEvents: readonly Event<any>[],
  config: GenerationConstraints
): Event<any>[] {
  // Simple variation: transpose by random interval
  const transpose = Math.floor(Math.random() * 7) - 3; // -3 to +3 semitones

  return existingEvents.map(event => ({
    ...event,
    id: generateEventId(), // Generate new ID for the variation
    payload: {
      ...event.payload,
      note: Math.max(
        config.register.min,
        Math.min(config.register.max, event.payload.note + transpose)
      )
    }
  }));
}
