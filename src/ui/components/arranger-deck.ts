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
 * H019: Style preset mappings to generator parameters.
 * Maps musical styles to concrete generation parameters (no network required).
 */
interface StyleParams {
  density: number;        // Note density (0-1)
  swing: number;          // Swing amount (-1 to 1)
  velocityRange: number;  // Velocity variation (0-1)
  noteLength: number;     // Note length multiplier (0-1)
  syncopation: number;    // Rhythmic complexity (0-1)
}

function getStyleParams(style: ArrangerSection['style']): StyleParams {
  switch (style) {
    case 'lofi':
      return {
        density: 0.4,        // Sparse, laid-back
        swing: 0.3,          // Heavy swing
        velocityRange: 0.6,  // Significant velocity variation (humanized)
        noteLength: 0.7,     // Shorter, detached notes
        syncopation: 0.3     // Some syncopation, not too complex
      };
    
    case 'house':
      return {
        density: 0.7,        // Dense, driving
        swing: 0.0,          // Straight, four-on-the-floor
        velocityRange: 0.2,  // Consistent velocity (machine-like)
        noteLength: 0.5,     // Short, punchy notes
        syncopation: 0.2     // Simple, repetitive patterns
      };
    
    case 'ambient':
      return {
        density: 0.2,        // Very sparse
        swing: 0.0,          // No swing
        velocityRange: 0.4,  // Gentle velocity variation
        noteLength: 1.0,     // Long, sustained notes
        syncopation: 0.1     // Minimal rhythmic complexity
      };
    
    case 'techno':
      return {
        density: 0.8,        // Very dense
        swing: -0.1,         // Slightly ahead (driving)
        velocityRange: 0.1,  // Very consistent (robotic)
        noteLength: 0.4,     // Very short notes
        syncopation: 0.4     // Moderate syncopation
      };
    
    case 'jazz':
      return {
        density: 0.6,        // Medium density
        swing: 0.5,          // Strong jazz swing
        velocityRange: 0.8,  // High velocity variation (expressive)
        noteLength: 0.6,     // Medium note length
        syncopation: 0.8     // High syncopation (complex rhythms)
      };
    
    default:
      return {
        density: 0.5,
        swing: 0.0,
        velocityRange: 0.4,
        noteLength: 0.6,
        syncopation: 0.3
      };
  }
}

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

  // H019: Get style-specific parameters
  const styleParams = getStyleParams(section.style);
  
  // Simple generation based on part type and style
  // (Real implementation would use proper generator modules)
  
  const ticksPerBeat = 96;
  const beatsPerBar = 4;
  const bars = Math.ceil(section.length / (ticksPerBeat * beatsPerBar));
  
  // Apply swing from style
  const swingAmount = styleParams.swing * 24; // Max 24 ticks swing

  if (partType === 'drums') {
    // Generate kick pattern (density affects how many kicks)
    const kickPattern = styleParams.density > 0.6 ? [0, 1, 2, 3] : [0, 2]; // Four-on-floor vs halftime
    
    for (let bar = 0; bar < bars; bar++) {
      for (const beat of kickPattern) {
        const baseTick = bar * ticksPerBeat * beatsPerBar + beat * ticksPerBeat;
        const swingOffset = beat % 2 === 1 ? swingAmount : 0; // Apply swing to offbeats
        const tick = baseTick + swingOffset;
        
        // Apply velocity range from style
        const baseVelocity = 80 * section.energy;
        const velocityVariation = (Math.random() - 0.5) * styleParams.velocityRange * 40;
        
        events.push({
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(Math.round(tick)),
          duration: asTickDuration(Math.round(ticksPerBeat * styleParams.noteLength / 4)),
          payload: {
            note: 36, // Kick
            velocity: Math.round(Math.max(40, Math.min(127, baseVelocity + velocityVariation)))
          }
        });
      }
    }
  } else if (partType === 'bass') {
    // Generate bass pattern based on chords
    section.chords.forEach(chordInfo => {
      const root = chordInfo.chord.root + 36; // Bass range
      
      // Density affects note repetition
      const noteCount = Math.max(1, Math.round(styleParams.density * 4));
      const noteDuration = chordInfo.durationTicks / noteCount;
      
      for (let i = 0; i < noteCount; i++) {
        const baseTick = chordInfo.startTick + i * noteDuration;
        const swingOffset = i % 2 === 1 ? swingAmount : 0;
        const tick = baseTick + swingOffset;
        
        const baseVelocity = 70 * section.energy;
        const velocityVariation = (Math.random() - 0.5) * styleParams.velocityRange * 30;
        
        events.push({
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(Math.round(tick)),
          duration: asTickDuration(Math.round(noteDuration * styleParams.noteLength)),
          payload: {
            note: root,
            velocity: Math.round(Math.max(40, Math.min(127, baseVelocity + velocityVariation)))
          }
        });
      }
    });
  } else if (partType === 'pad') {
    // Generate pad chords
    section.chords.forEach(chordInfo => {
      const root = chordInfo.chord.root + 48; // Mid range
      [0, 4, 7].forEach(offset => {
        // Major triad
        const baseVelocity = 50 * section.energy;
        const velocityVariation = (Math.random() - 0.5) * styleParams.velocityRange * 20;
        
        events.push({
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(chordInfo.startTick),
          duration: asTickDuration(Math.round(chordInfo.durationTicks * styleParams.noteLength)),
          payload: {
            note: root + offset,
            velocity: Math.round(Math.max(30, Math.min(127, baseVelocity + velocityVariation)))
          }
        });
      });
    });
  } else if (partType === 'melody') {
    // Generate simple melody
    const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale
    const notesPerBeat = Math.max(0.25, styleParams.density); // Density affects note frequency
    const totalBeats = section.length / ticksPerBeat;
    const noteCount = Math.round(totalBeats * notesPerBeat);
    
    for (let i = 0; i < noteCount; i++) {
      const baseTick = (i / notesPerBeat) * ticksPerBeat;
      const swingOffset = i % 2 === 1 ? swingAmount : 0;
      const tick = baseTick + swingOffset;
      
      // Syncopation affects whether we use scale tones or chromatic passing tones
      const usePassingTone = Math.random() < styleParams.syncopation * 0.3;
      const scaleIndex = Math.floor(Math.random() * scale.length);
      const note = usePassingTone 
        ? 60 + Math.floor(Math.random() * 12)  // Chromatic
        : 60 + (scale[scaleIndex] ?? 0);        // Diatonic
      
      const baseVelocity = 90 * section.energy * settings.density;
      const velocityVariation = (Math.random() - 0.5) * styleParams.velocityRange * 40;
      
      events.push({
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(Math.round(tick)),
        duration: asTickDuration(Math.round(ticksPerBeat * styleParams.noteLength)),
        payload: {
          note,
          velocity: Math.round(Math.max(40, Math.min(127, baseVelocity + velocityVariation)))
        }
      });
    }
  }

  return events;
}
