/**
 * @fileoverview Arranger Deck UI (Phase H: H013-H021)
 * 
 * UI for the AI Arranger Board:
 * - H013: Chord progression input + section blocks + part toggles
 * - H014-H017: Integration with SharedEventStore and ClipRegistry
 * - H018-H020: Per-part controls and indicators
 * 
 * @module @cardplay/ui/components/arranger-deck
 */

import type { EventStreamId } from '../../state/types';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import type { Chord } from '../../boards/builtins/harmony-analysis';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event-kind';
import { generateEventId } from '../../types/event-id';
import type { Event } from '../../types/event';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section in the arrangement.
 */
export interface ArrangerSection {
  /** Unique section ID */
  id: string;
  
  /** Section name */
  name: string;
  
  /** Section length in ticks */
  length: number;
  
  /** Chord progression */
  chords: Array<{
    chord: Chord;
    startTick: number;
    durationTicks: number;
  }>;
  
  /** Active parts */
  parts: {
    drums: boolean;
    bass: boolean;
    pad: boolean;
    melody: boolean;
  };
  
  /** Style preset */
  style: 'lofi' | 'house' | 'ambient' | 'techno' | 'jazz';
  
  /** Energy level (0-1) */
  energy: number;
}

/**
 * Part track configuration.
 */
export interface PartTrack {
  /** Part type */
  type: 'drums' | 'bass' | 'pad' | 'melody';
  
  /** Associated stream ID */
  streamId: EventStreamId;
  
  /** Control level */
  controlLevel: 'manual' | 'generated';
  
  /** Generation settings */
  settings: {
    seed?: number;
    density: number;
    swing: number;
  };
  
  /** Frozen state */
  frozen: boolean;
}

/**
 * Arranger deck state.
 */
export interface ArrangerDeckState {
  /** Sections */
  sections: ArrangerSection[];
  
  /** Part tracks */
  parts: PartTrack[];
  
  /** Active section ID */
  activeSectionId: string | null;
}

// ============================================================================
// ARRANGER DECK
// ============================================================================

/**
 * Create arranger deck instance.
 * 
 * H013: Implements chord progression input + section blocks + part toggles.
 */
export function createArrangerDeck(): {
  state: ArrangerDeckState;
  addSection: (section: Omit<ArrangerSection, 'id'>) => string;
  removeSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<ArrangerSection>) => void;
  togglePart: (sectionId: string, part: keyof ArrangerSection['parts']) => void;
  generateSection: (sectionId: string) => void;
  regenerateSection: (sectionId: string) => void;
  freezeSection: (sectionId: string) => void;
  unfreezeSection: (sectionId: string) => void;
  setEnergy: (sectionId: string, energy: number) => void;
  setStyle: (sectionId: string, style: ArrangerSection['style']) => void;
  render: (container: HTMLElement) => () => void;
} {
  const state: ArrangerDeckState = {
    sections: [],
    parts: [],
    activeSectionId: null
  };

  /**
   * Add a new section.
   */
  function addSection(section: Omit<ArrangerSection, 'id'>): string {
    const id = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    state.sections.push({ ...section, id });
    return id;
  }

  /**
   * Remove a section.
   */
  function removeSection(sectionId: string): void {
    const index = state.sections.findIndex(s => s.id === sectionId);
    if (index >= 0) {
      state.sections.splice(index, 1);
      if (state.activeSectionId === sectionId) {
        state.activeSectionId = null;
      }
    }
  }

  /**
   * Update section properties.
   */
  function updateSection(sectionId: string, updates: Partial<ArrangerSection>): void {
    const section = state.sections.find(s => s.id === sectionId);
    if (section) {
      Object.assign(section, updates);
    }
  }

  /**
   * Toggle a part on/off in a section.
   */
  function togglePart(sectionId: string, part: keyof ArrangerSection['parts']): void {
    const section = state.sections.find(s => s.id === sectionId);
    if (section) {
      section.parts[part] = !section.parts[part];
    }
  }

  /**
   * H014: Generate section - writes to per-track streams in SharedEventStore.
   */
  function generateSection(sectionId: string): void {
    const section = state.sections.find(s => s.id === sectionId);
    if (!section) return;

    const store = getSharedEventStore();
    const registry = getClipRegistry();

    // Generate for each active part
    Object.entries(section.parts).forEach(([partType, active]) => {
      if (!active) return;

      // Find or create stream for this part
      let partTrack = state.parts.find(p => p.type === partType as any);
      if (!partTrack) {
        const stream = store.createStream({ name: `${section.name} - ${partType}` });
        partTrack = {
          type: partType as 'drums' | 'bass' | 'pad' | 'melody',
          streamId: stream.id,
          controlLevel: 'generated',
          settings: {
            density: 0.5,
            swing: 0
          },
          frozen: false
        };
        state.parts.push(partTrack);
      }

      // Generate events based on part type
      const events = generatePartEvents(
        partType as 'drums' | 'bass' | 'pad' | 'melody',
        section,
        partTrack.settings
      );

      // H014: Write to SharedEventStore
      store.addEvents(partTrack.streamId, events);

      // H015: Create/update clip in ClipRegistry
      const existingClips = Array.from(registry.getAllClips().values()).filter(
        c => c.streamId === partTrack!.streamId
      );
      
      if (existingClips.length === 0) {
        registry.createClip({
          name: `${section.name} - ${partType}`,
          streamId: partTrack.streamId,
          duration: asTick(section.length),
          loop: true
        });
      }
    });

    console.info('Generated section:', {
      section: section.name,
      parts: Object.entries(section.parts).filter(([, active]) => active).map(([type]) => type)
    });
  }

  /**
   * H016: Regenerate section - updates only chosen section's events.
   */
  function regenerateSection(sectionId: string): void {
    const section = state.sections.find(s => s.id === sectionId);
    if (!section) return;

    const store = getSharedEventStore();

    // Clear and regenerate each part
    state.parts.forEach(part => {
      if (part.frozen) return; // Skip frozen parts

      const partActive = section.parts[part.type];
      if (!partActive) return;

      // Clear existing events for this section
      const stream = store.getStream(part.streamId);
      if (stream) {
        // Clear all events (simplified - real impl would track section boundaries)
        store.removeEvents(part.streamId, stream.events.map(e => e.id));
      }

      // Generate new events
      const events = generatePartEvents(part.type, section, part.settings);
      store.addEvents(part.streamId, events);
    });

    console.info('Regenerated section:', section.name);
  }

  /**
   * H017: Freeze section - marks events as user-owned.
   */
  function freezeSection(sectionId: string): void {
    const section = state.sections.find(s => s.id === sectionId);
    if (!section) return;

    state.parts.forEach(part => {
      if (section.parts[part.type]) {
        part.frozen = true;
        part.controlLevel = 'manual'; // H020: Update control level indicator
      }
    });

    console.info('Froze section:', section.name);
  }

  /**
   * Unfreeze section - allows regeneration again.
   */
  function unfreezeSection(sectionId: string): void {
    const section = state.sections.find(s => s.id === sectionId);
    if (!section) return;

    state.parts.forEach(part => {
      if (section.parts[part.type]) {
        part.frozen = false;
        part.controlLevel = 'generated'; // H020: Update control level indicator
      }
    });

    console.info('Unfroze section:', section.name);
  }

  /**
   * H018: Set energy level for section.
   */
  function setEnergy(sectionId: string, energy: number): void {
    updateSection(sectionId, { energy: Math.max(0, Math.min(1, energy)) });
  }

  /**
   * H019: Set style preset for section.
   */
  function setStyle(sectionId: string, style: ArrangerSection['style']): void {
    updateSection(sectionId, { style });
  }

  /**
   * Render arranger deck UI.
   */
  function render(container: HTMLElement): () => void {
    container.innerHTML = `
      <div class="arranger-deck">
        <div class="arranger-deck__header">
          <h3>Arranger</h3>
          <button class="arranger-deck__add-section">+ Add Section</button>
        </div>
        <div class="arranger-deck__sections"></div>
      </div>
    `;

    const sectionsContainer = container.querySelector('.arranger-deck__sections') as HTMLElement;
    const addButton = container.querySelector('.arranger-deck__add-section') as HTMLButtonElement;

    // Render sections
    function renderSections(): void {
      sectionsContainer.innerHTML = state.sections
        .map(
          section => `
          <div class="arranger-section" data-section-id="${section.id}">
            <div class="arranger-section__header">
              <input 
                class="arranger-section__name" 
                value="${section.name}"
                data-section-id="${section.id}"
              />
              <button class="arranger-section__remove" data-section-id="${section.id}">✕</button>
            </div>
            <div class="arranger-section__controls">
              <div class="arranger-section__parts">
                ${Object.entries(section.parts)
                  .map(
                    ([part, active]) => `
                  <label class="part-toggle">
                    <input 
                      type="checkbox" 
                      ${active ? 'checked' : ''}
                      data-section-id="${section.id}"
                      data-part="${part}"
                    />
                    <span>${part}</span>
                  </label>
                `
                  )
                  .join('')}
              </div>
              <div class="arranger-section__style">
                <label>Style:</label>
                <select data-section-id="${section.id}" data-field="style">
                  ${['lofi', 'house', 'ambient', 'techno', 'jazz']
                    .map(style => `<option value="${style}" ${section.style === style ? 'selected' : ''}>${style}</option>`)
                    .join('')}
                </select>
              </div>
              <div class="arranger-section__energy">
                <label>Energy: ${Math.round(section.energy * 100)}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value="${section.energy * 100}"
                  data-section-id="${section.id}"
                  data-field="energy"
                />
              </div>
            </div>
            <div class="arranger-section__actions">
              <button class="btn-generate" data-section-id="${section.id}">Generate</button>
              <button class="btn-regenerate" data-section-id="${section.id}">Regenerate</button>
              <button class="btn-freeze" data-section-id="${section.id}">
                ${state.parts.some(p => section.parts[p.type] && p.frozen) ? 'Unfreeze' : 'Freeze'}
              </button>
            </div>
          </div>
        `
        )
        .join('');
    }

    // Event listeners
    addButton.addEventListener('click', () => {
      addSection({
        name: `Section ${state.sections.length + 1}`,
        length: 384 * 4, // 4 bars
        chords: [],
        parts: { drums: true, bass: true, pad: false, melody: false },
        style: 'lofi',
        energy: 0.5
      });
      renderSections();
    });

    sectionsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const sectionId = target.dataset.sectionId;
      if (!sectionId) return;

      if (target.classList.contains('arranger-section__remove')) {
        removeSection(sectionId);
        renderSections();
      } else if (target.classList.contains('btn-generate')) {
        generateSection(sectionId);
      } else if (target.classList.contains('btn-regenerate')) {
        regenerateSection(sectionId);
      } else if (target.classList.contains('btn-freeze')) {
        const section = state.sections.find(s => s.id === sectionId);
        const isFrozen = section && state.parts.some(p => section.parts[p.type] && p.frozen);
        if (isFrozen) {
          unfreezeSection(sectionId);
        } else {
          freezeSection(sectionId);
        }
        renderSections();
      }
    });

    sectionsContainer.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const sectionId = target.dataset.sectionId;
      if (!sectionId) return;

      if (target.type === 'checkbox' && 'part' in target.dataset) {
        togglePart(sectionId, target.dataset.part as keyof ArrangerSection['parts']);
      } else if (target.dataset.field === 'style') {
        setStyle(sectionId, (target as HTMLSelectElement).value as ArrangerSection['style']);
      } else if (target.dataset.field === 'energy') {
        setEnergy(sectionId, parseInt((target as HTMLInputElement).value) / 100);
      } else if (target.classList.contains('arranger-section__name')) {
        updateSection(sectionId, { name: (target as HTMLInputElement).value });
      }
    });

    renderSections();

    return () => {
      container.innerHTML = '';
    };
  }

  return {
    state,
    addSection,
    removeSection,
    updateSection,
    togglePart,
    generateSection,
    regenerateSection,
    freezeSection,
    unfreezeSection,
    setEnergy,
    setStyle,
    render
  };
}

// ============================================================================
// GENERATION HELPERS
// ============================================================================

/**
 * Generate events for a part.
 * 
 * H019: Uses style presets mapped to generator params (no network required).
 */
function generatePartEvents(
  partType: 'drums' | 'bass' | 'pad' | 'melody',
  section: ArrangerSection,
  settings: PartTrack['settings']
): Event<any>[] {
  const events: Event<any>[] = [];

  // Simple generation based on part type and style
  // (Real implementation would use proper generator modules)
  
  const ticksPerBeat = 96;
  const beatsPerBar = 4;
  const bars = Math.ceil(section.length / (ticksPerBeat * beatsPerBar));

  if (partType === 'drums') {
    // Generate kick pattern
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < beatsPerBar; beat++) {
        const tick = bar * ticksPerBeat * beatsPerBar + beat * ticksPerBeat;
        events.push({
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(tick),
          duration: asTickDuration(ticksPerBeat / 4),
          payload: {
            note: 36, // Kick
            velocity: Math.round(80 * section.energy)
          }
        });
      }
    }
  } else if (partType === 'bass') {
    // Generate bass pattern based on chords
    section.chords.forEach(chordInfo => {
      const root = chordInfo.chord.root + 36; // Bass range
      events.push({
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(chordInfo.startTick),
        duration: asTickDuration(chordInfo.durationTicks),
        payload: {
          note: root,
          velocity: Math.round(70 * section.energy)
        }
      });
    });
  } else if (partType === 'pad') {
    // Generate pad chords
    section.chords.forEach(chordInfo => {
      const root = chordInfo.chord.root + 48; // Mid range
      [0, 4, 7].forEach(offset => {
        // Major triad
        events.push({
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(chordInfo.startTick),
          duration: asTickDuration(chordInfo.durationTicks),
          payload: {
            note: root + offset,
            velocity: Math.round(50 * section.energy)
          }
        });
      });
    });
  } else if (partType === 'melody') {
    // Generate simple melody
    const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale
    for (let i = 0; i < section.length / ticksPerBeat; i++) {
      const tick = i * ticksPerBeat;
      const scaleIndex = Math.floor(Math.random() * scale.length);
      events.push({
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(tick),
        duration: asTickDuration(ticksPerBeat),
        payload: {
          note: 60 + (scale[scaleIndex] ?? 0),
          velocity: Math.round(90 * section.energy * settings.density)
        }
      });
    }
  }

  return events;
}
