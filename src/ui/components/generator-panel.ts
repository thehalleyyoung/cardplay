/**
 * @fileoverview Generator Panel Component (G072-G078)
 * 
 * On-demand phrase generators for assisted boards.
 * Provides melody, bass, drum, and arpeggiator generators.
 * 
 * G072: List generators + "Generate" button
 * G074: Generate into active stream
 * G075: "Generate into new clip" action
 * G076: "Regenerate" action with undo
 * G077: "Freeze" action (mark as user-owned)
 * G078: "Humanize" and "Quantize" post-process
 * 
 * @module @cardplay/ui/components/generator-panel
 */

import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getBoardContextStore } from '../../boards/context/store';
import { getUndoStack } from '../../state/undo-stack';
import { asTick, asVelocity, asTickDuration, PPQ } from '../../types/primitives';
import { EventKinds } from '../../types/event-kind';
import type { Event } from '../../types/event';
import { generateEventId } from '../../types/event-id';

/**
 * Generator types available
 */
export type GeneratorType = 'melody' | 'bass' | 'drums' | 'arp';

/**
 * Generator settings
 */
export interface GeneratorSettings {
  /** Generator type */
  type: GeneratorType;
  
  /** Style/preset (genre) */
  style?: 'lofi' | 'house' | 'ambient' | 'techno' | 'jazz';
  
  /** Note density (events per measure) */
  density?: number;
  
  /** Random seed for reproducibility */
  seed?: number;
  
  /** Humanization amount (0-100) */
  humanize?: number;
  
  /** Quantize to grid */
  quantize?: boolean;
}

/**
 * Generator result metadata
 */
export interface GeneratorResult {
  /** Generated event IDs */
  eventIds: string[];
  
  /** Generator settings used */
  settings: GeneratorSettings;
  
  /** Timestamp of generation */
  timestamp: number;
}

/**
 * Creates a generator panel component.
 * 
 * @param options Configuration options
 * @returns HTML element containing generator UI
 */
export function createGeneratorPanel(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'generator-panel';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    overflow-y: auto;
  `;

  // Header
  const header = document.createElement('div');
  header.className = 'generator-panel-header';
  header.innerHTML = `
    <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Generators</h3>
    <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--color-on-surface-variant);">
      Generate patterns on-demand
    </p>
  `;
  container.appendChild(header);

  // Generator cards
  const generators: Array<{ type: GeneratorType; name: string; icon: string; description: string }> = [
    { type: 'melody', name: 'Melody', icon: '🎵', description: 'Generate melodic phrases' },
    { type: 'bass', name: 'Bass', icon: '🎸', description: 'Generate bass lines' },
    { type: 'drums', name: 'Drums', icon: '🥁', description: 'Generate drum patterns' },
    { type: 'arp', name: 'Arpeggiator', icon: '🎹', description: 'Generate arpeggios' },
  ];

  generators.forEach(gen => {
    const card = createGeneratorCard(gen.type, gen.name, gen.icon, gen.description);
    container.appendChild(card);
  });

  return container;
}

/**
 * Creates an individual generator card.
 */
function createGeneratorCard(
  type: GeneratorType,
  name: string,
  icon: string,
  description: string
): HTMLElement {
  const card = document.createElement('div');
  card.className = `generator-card generator-card-${type}`;
  card.style.cssText = `
    background: var(--color-surface-variant);
    border-radius: var(--radius-md);
    padding: 1rem;
    border: 1px solid var(--color-outline-variant);
  `;

  // Card header
  const cardHeader = document.createElement('div');
  cardHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;';
  
  const titleSection = document.createElement('div');
  titleSection.innerHTML = `
    <div style="font-size: 1.125rem; font-weight: 600;">${icon} ${name}</div>
    <div style="font-size: 0.8125rem; color: var(--color-on-surface-variant); margin-top: 0.25rem;">${description}</div>
  `;
  
  cardHeader.appendChild(titleSection);
  card.appendChild(cardHeader);

  // Settings section
  const settingsSection = document.createElement('div');
  settingsSection.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem;';
  
  // Density control
  const densityControl = createNumberControl('Density', 4, 1, 16, 'events per measure');
  settingsSection.appendChild(densityControl.element);
  
  // Style selector
  const styleControl = createSelectControl('Style', [
    { value: 'lofi', label: 'Lo-fi' },
    { value: 'house', label: 'House' },
    { value: 'ambient', label: 'Ambient' },
    { value: 'techno', label: 'Techno' },
    { value: 'jazz', label: 'Jazz' }
  ]);
  settingsSection.appendChild(styleControl.element);
  
  card.appendChild(settingsSection);

  // Action buttons
  const actionsSection = document.createElement('div');
  actionsSection.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap;';
  
  // G072: Generate button
  const generateBtn = createButton('Generate', 'primary', async () => {
    const style = styleControl.getValue() as 'lofi' | 'house' | 'ambient' | 'techno' | 'jazz';
    const settings: GeneratorSettings = {
      type,
      density: densityControl.getValue(),
      style,
      seed: Math.floor(Math.random() * 10000)
    };
    await generatePattern(settings, 'replace');
  });
  
  // G075: Generate into new clip
  const newClipBtn = createButton('New Clip', 'secondary', async () => {
    const style = styleControl.getValue() as 'lofi' | 'house' | 'ambient' | 'techno' | 'jazz';
    const settings: GeneratorSettings = {
      type,
      density: densityControl.getValue(),
      style,
      seed: Math.floor(Math.random() * 10000)
    };
    await generatePattern(settings, 'new-clip');
  });
  
  // G076: Regenerate button
  const regenBtn = createButton('Regenerate', 'secondary', async () => {
    const style = styleControl.getValue() as 'lofi' | 'house' | 'ambient' | 'techno' | 'jazz';
    const settings: GeneratorSettings = {
      type,
      density: densityControl.getValue(),
      style,
      seed: Math.floor(Math.random() * 10000)
    };
    await generatePattern(settings, 'regenerate');
  });
  
  actionsSection.appendChild(generateBtn);
  actionsSection.appendChild(newClipBtn);
  actionsSection.appendChild(regenBtn);
  card.appendChild(actionsSection);

  // Post-processing section (G078)
  const postProcessSection = document.createElement('div');
  postProcessSection.style.cssText = 'margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-outline-variant);';
  
  const postProcessLabel = document.createElement('div');
  postProcessLabel.textContent = 'Post-Process';
  postProcessLabel.style.cssText = 'font-size: 0.75rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem; font-weight: 600;';
  postProcessSection.appendChild(postProcessLabel);
  
  const postProcessActions = document.createElement('div');
  postProcessActions.style.cssText = 'display: flex; gap: 0.5rem;';
  
  const humanizeBtn = createButton('Humanize', 'tertiary', () => {
    applyHumanize(15); // 15% humanization
  });
  
  const quantizeBtn = createButton('Quantize', 'tertiary', () => {
    applyQuantize(PPQ / 4); // Quantize to 16th notes (960 / 4 = 240 ticks)
  });
  
  postProcessActions.appendChild(humanizeBtn);
  postProcessActions.appendChild(quantizeBtn);
  postProcessSection.appendChild(postProcessActions);
  
  card.appendChild(postProcessSection);

  return card;
}

/**
 * Creates a number control with label.
 */
function createNumberControl(label: string, defaultValue: number, min: number, max: number, unit?: string): { element: HTMLElement; getValue: () => number } {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
  
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.cssText = 'font-size: 0.8125rem; color: var(--color-on-surface);';
  
  const inputWrapper = document.createElement('div');
  inputWrapper.style.cssText = 'display: flex; align-items: center; gap: 0.25rem;';
  
  const input = document.createElement('input');
  input.type = 'number';
  input.value = defaultValue.toString();
  input.min = min.toString();
  input.max = max.toString();
  input.style.cssText = 'width: 4rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-outline); border-radius: var(--radius-sm); font-size: 0.8125rem;';
  
  inputWrapper.appendChild(input);
  
  if (unit) {
    const unitEl = document.createElement('span');
    unitEl.textContent = unit;
    unitEl.style.cssText = 'font-size: 0.75rem; color: var(--color-on-surface-variant);';
    inputWrapper.appendChild(unitEl);
  }
  
  wrapper.appendChild(labelEl);
  wrapper.appendChild(inputWrapper);
  
  return {
    element: wrapper,
    getValue: () => parseInt(input.value) || defaultValue
  };
}

/**
 * Creates a select control with label.
 */
function createSelectControl(label: string, options: Array<{ value: string; label: string }>): { element: HTMLElement; getValue: () => string } {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
  
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.cssText = 'font-size: 0.8125rem; color: var(--color-on-surface);';
  
  const select = document.createElement('select');
  select.style.cssText = 'padding: 0.25rem 0.5rem; border: 1px solid var(--color-outline); border-radius: var(--radius-sm); font-size: 0.8125rem;';
  
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  });
  
  wrapper.appendChild(labelEl);
  wrapper.appendChild(select);
  
  return {
    element: wrapper,
    getValue: () => select.value
  };
}

/**
 * Creates a styled button.
 */
function createButton(text: string, variant: 'primary' | 'secondary' | 'tertiary', onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.onclick = onClick;
  
  const styles = {
    primary: 'background: var(--color-primary); color: var(--color-on-primary);',
    secondary: 'background: var(--color-secondary-container); color: var(--color-on-secondary-container);',
    tertiary: 'background: transparent; color: var(--color-primary); border: 1px solid var(--color-outline);'
  };
  
  button.style.cssText = `
    ${styles[variant]}
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  `;
  
  button.onmouseenter = () => { button.style.opacity = '0.85'; };
  button.onmouseleave = () => { button.style.opacity = '1'; };
  
  return button;
}

/**
 * Generates a pattern using the specified settings.
 * G074: Generate into active stream
 * G075: Generate into new clip
 * G076: Regenerate with undo
 */
async function generatePattern(settings: GeneratorSettings, mode: 'replace' | 'new-clip' | 'regenerate'): Promise<void> {
  const store = getSharedEventStore();
  const registry = getClipRegistry();
  const context = getBoardContextStore().getContext();
  const undoStack = getUndoStack();
  
  let targetStreamId = context.activeStreamId;
  
  if (mode === 'new-clip') {
    // G075: Create new stream and clip
    const newStream = store.createStream({ name: `Generated ${settings.type}` });
    targetStreamId = newStream.id;
    
    registry.createClip({
      name: `${settings.type} ${Date.now()}`,
      streamId: targetStreamId,
      startTick: asTick(0),
      duration: asTick(PPQ * 16), // 4 measures at PPQ=960 (4 beats * 4 measures)
      color: '#10b981' // Green for generated
    });
  }
  
  if (!targetStreamId) {
    console.warn('No active stream for generation');
    return;
  }
  
  const stream = store.getStream(targetStreamId);
  if (!stream) {
    console.warn('Target stream not found');
    return;
  }
  
  // Generate events based on type
  const events = generateEvents(settings, stream.events.length);
  
  // G076: Wrap in undo action
  undoStack.push({
    type: 'events-modify',
    description: `Generate ${settings.type} pattern`,
    undo: () => {
      if (mode === 'regenerate' || mode === 'replace') {
        // Restore original events
        store.addEvents(targetStreamId!, stream.events);
      }
      // Remove generated events
      const generatedIds = events.map(e => e.id);
      store.removeEvents(targetStreamId!, generatedIds);
    },
    redo: () => {
      if (mode === 'regenerate' || mode === 'replace') {
        // Remove existing events
        const existingIds = stream.events.map(e => e.id);
        store.removeEvents(targetStreamId!, existingIds);
      }
      // Add generated events
      store.addEvents(targetStreamId!, events);
    }
  });
  
  console.log(`Generated ${events.length} ${settings.type} events into stream ${targetStreamId}`);
}

/**
 * Generates events based on generator settings.
 * Simple implementation - can be enhanced with actual algorithmic generation.
 */
function generateEvents(settings: GeneratorSettings, _baseId: number): Event<{ note: number; velocity: number; channel: number }>[] {
  const events: Event<{ note: number; velocity: number; channel: number }>[] = [];
  const { type, density = 4 } = settings;
  
  // Simple generation logic
  // 4 measures, density events per measure
  const ppq = PPQ; // Canonical ticks per quarter note (960)
  const ticksPerMeasure = ppq * 4;
  const totalTicks = ticksPerMeasure * 4;
  const ticksBetweenEvents = Math.floor(ticksPerMeasure / density);
  
  for (let tick = 0; tick < totalTicks; tick += ticksBetweenEvents) {
    const note = generateNote(type, tick);
    if (note !== null) {
      events.push({
        id: generateEventId(),
        kind: EventKinds.NOTE,
        start: asTick(tick),
        duration: asTickDuration(ppq / 4), // 16th note default
        payload: {
          note,
          velocity: asVelocity(80 + Math.random() * 20), // 80-100
          channel: 0
        }
      });
    }
  }
  
  return events;
}

/**
 * Generates a single note based on generator type.
 */
function generateNote(type: GeneratorType, _tick: number): number | null {
  const scales: { [key: string]: number[] } = {
    major: [60, 62, 64, 65, 67, 69, 71, 72],
    minor: [60, 62, 63, 65, 67, 68, 70, 72],
    pentatonic: [60, 62, 64, 67, 69, 72]
  };
  
  const scale = scales.pentatonic!; // Use pentatonic for simplicity
  
  switch (type) {
    case 'melody':
      return scale[Math.floor(Math.random() * scale.length)]! + 12; // Octave up
    case 'bass':
      return scale[Math.floor(Math.random() * 4)]!; // Lower notes only
    case 'drums':
      // Kick (36), Snare (38), HiHat (42), Clap (39)
      return [36, 38, 42, 39][Math.floor(Math.random() * 4)]!;
    case 'arp':
      return scale[Math.floor(Math.random() * scale.length)]!;
    default:
      return null;
  }
}

/**
 * G078: Apply humanization to selected events.
 */
function applyHumanize(amount: number): void {
  const store = getSharedEventStore();
  const context = getBoardContextStore().getContext();
  const undoStack = getUndoStack();
  
  if (!context.activeStreamId) return;
  
  const stream = store.getStream(context.activeStreamId);
  if (!stream) return;
  
  const originalEvents = stream.events;
  const humanizedEvents = originalEvents.map(event => {
    const payload = event.payload as { note: number; velocity: number; channel: number };
    return {
      ...event,
      start: asTick(event.start + (Math.random() - 0.5) * amount),
      payload: {
        ...payload,
        velocity: asVelocity(Math.max(1, Math.min(127, 
          payload.velocity + (Math.random() - 0.5) * (amount / 2)
        )))
      }
    };
  });
  
  undoStack.push({
    type: 'events-modify',
    description: 'Humanize events',
    undo: () => {
      store.removeEvents(context.activeStreamId!, humanizedEvents.map(e => e.id));
      store.addEvents(context.activeStreamId!, originalEvents);
    },
    redo: () => {
      store.removeEvents(context.activeStreamId!, originalEvents.map(e => e.id));
      store.addEvents(context.activeStreamId!, humanizedEvents);
    }
  });
  
  console.log(`Humanized ${humanizedEvents.length} events`);
}

/**
 * G078: Apply quantization to selected events.
 */
function applyQuantize(gridSize: number): void {
  const store = getSharedEventStore();
  const context = getBoardContextStore().getContext();
  const undoStack = getUndoStack();
  
  if (!context.activeStreamId) return;
  
  const stream = store.getStream(context.activeStreamId);
  if (!stream) return;
  
  const originalEvents = stream.events;
  const quantizedEvents = originalEvents.map(event => ({
    ...event,
    start: asTick(Math.round(event.start / gridSize) * gridSize)
  }));
  
  undoStack.push({
    type: 'events-modify',
    description: 'Quantize events',
    undo: () => {
      store.removeEvents(context.activeStreamId!, quantizedEvents.map(e => e.id));
      store.addEvents(context.activeStreamId!, originalEvents);
    },
    redo: () => {
      store.removeEvents(context.activeStreamId!, originalEvents.map(e => e.id));
      store.addEvents(context.activeStreamId!, quantizedEvents);
    }
  });
  
  console.log(`Quantized ${quantizedEvents.length} events to grid ${gridSize}`);
}

/**
 * Inject styles for generator panel.
 */
export function injectGeneratorPanelStyles(): void {
  const styleId = 'generator-panel-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .generator-panel {
      min-height: 0;
    }
    
    .generator-card:hover {
      background: var(--color-surface-container-high);
    }
    
    .generator-card button:active {
      transform: translateY(1px);
    }
  `;
  
  document.head.appendChild(style);
}
