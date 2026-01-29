/**
 * @fileoverview Properties Panel Component (E047-E050)
 * 
 * Inspector for selected entities (events, clips, cards).
 * Integrates with SelectionStore, ClipRegistry, and SharedEventStore.
 * 
 * Features:
 * - Edit ClipRecord (name/color/loop) via ClipRegistry (E049)
 * - Edit Event payload fields via SharedEventStore (E050)
 * - Show selection context from SelectionStore
 * - Undo/redo integration for all edits
 * 
 * @module @cardplay/ui/components/properties-panel
 */

import type { Event } from '../../types/event';
import type { ClipId, ClipRecord } from '../../state/types';
import { getSelectionStore } from '../../state/selection-state';
import { getClipRegistry } from '../../state/clip-registry';
import { getSharedEventStore } from '../../state/event-store';
import { asTick } from '../../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

export interface PropertiesPanelState {
  selectedEntityType: 'none' | 'clip' | 'event' | 'events';
  selectedClipId: ClipId | null;
  selectedEventId: string | null;
  selectedEventIds: string[];
  clipData: ClipRecord | null;
  eventData: Event<unknown> | null;
}

export interface PropertiesPanelConfig {
  showClipProperties: boolean;
  showEventProperties: boolean;
  allowEditing: boolean;
}

// ============================================================================
// PROPERTIES PANEL
// ============================================================================

/**
 * Properties panel component.
 * 
 * E047: Inspector for selection (event/clip/card).
 */
export class PropertiesPanel {
  private container: HTMLElement;
  private state: PropertiesPanelState;
  private config: PropertiesPanelConfig;
  private unsubscribers: Array<() => void> = [];

  constructor(config: Partial<PropertiesPanelConfig> = {}) {
    this.config = {
      showClipProperties: true,
      showEventProperties: true,
      allowEditing: true,
      ...config,
    };

    this.state = {
      selectedEntityType: 'none',
      selectedClipId: null,
      selectedEventId: null,
      selectedEventIds: [],
      clipData: null,
      eventData: null,
    };

    // Create container first
    this.container = document.createElement('div');
    this.container.className = 'properties-panel';
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1e1e1e;
      color: #cccccc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      overflow: hidden;
    `;

    // Then render into it
    this.render();

    // Finally attach listeners
    this.attachListeners();
  }

  private attachListeners(): void {
    // Subscribe to selection changes
    const selectionStore = getSelectionStore();
    const unsubSelection = selectionStore.subscribe(() => {
      this.updateFromSelection();
    });
    // Store unsubscribe wrapper function
    this.unsubscribers.push(() => {
      selectionStore.unsubscribe(unsubSelection);
    });

    // Subscribe to clip registry changes
    const clipRegistry = getClipRegistry();
    const unsubClips = clipRegistry.subscribeAll(() => {
      if (this.state.selectedClipId) {
        this.updateClipData();
      }
    });
    // Store unsubscribe wrapper function
    this.unsubscribers.push(() => {
      clipRegistry.unsubscribe(unsubClips);
    });

    // Subscribe to event store changes
    const eventStore = getSharedEventStore();
    const streams = eventStore.getAllStreams();
    for (const stream of streams) {
      const unsubStream = eventStore.subscribe(stream.id, () => {
        if (this.state.selectedEventId) {
          this.updateEventData();
        }
      });
      // Store unsubscribe wrapper function
      this.unsubscribers.push(() => {
        eventStore.unsubscribe(unsubStream);
      });
    }
  }

  private updateFromSelection(): void {
    const selectionStore = getSelectionStore();
    const selection = selectionStore.getState();

    // For now, focus on events since SelectionState tracks events by default
    // Clip selection can be added when we have a clip selection mechanism
    
    if (selection.selected.size === 1) {
      // Single event selected
      const eventId = Array.from(selection.selected)[0] as string;
      this.state.selectedEntityType = 'event';
      this.state.selectedEventId = eventId;
      this.state.selectedEventIds = [];
      this.state.selectedClipId = null;
      this.updateEventData();
    } else if (selection.selected.size > 1) {
      // Multiple events selected
      this.state.selectedEntityType = 'events';
      this.state.selectedEventIds = Array.from(selection.selected) as string[];
      this.state.selectedEventId = null;
      this.state.selectedClipId = null;
      this.state.eventData = null;
      this.render();
    } else {
      // No selection
      this.state.selectedEntityType = 'none';
      this.state.selectedClipId = null;
      this.state.selectedEventId = null;
      this.state.selectedEventIds = [];
      this.state.clipData = null;
      this.state.eventData = null;
      this.render();
    }
  }

  private updateClipData(): void {
    if (!this.state.selectedClipId) return;

    const clipRegistry = getClipRegistry();
    const clip = clipRegistry.getClip(this.state.selectedClipId);

    if (clip) {
      this.state.clipData = clip;
      this.render();
    }
  }

  private updateEventData(): void {
    if (!this.state.selectedEventId) return;

    const eventStore = getSharedEventStore();
    const streams = eventStore.getAllStreams();

    for (const stream of streams) {
      const events = eventStore.getEventsInRange(stream.id, asTick(0), asTick(Number.MAX_SAFE_INTEGER));
      const event = events.find(e => e.id === this.state.selectedEventId);
      if (event) {
        this.state.eventData = event;
        this.render();
        return;
      }
    }
  }

  private render(): void {
    this.container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'properties-header';
    header.style.cssText = `
      padding: 12px 16px;
      font-weight: 600;
      font-size: 14px;
      border-bottom: 1px solid #3e3e3e;
      background: #2d2d2d;
    `;
    header.textContent = 'Properties';
    this.container.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'properties-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `;

    if (this.state.selectedEntityType === 'clip' && this.state.clipData) {
      content.appendChild(this.renderClipProperties());
    } else if (this.state.selectedEntityType === 'event' && this.state.eventData) {
      content.appendChild(this.renderEventProperties());
    } else if (this.state.selectedEntityType === 'events' && this.state.selectedEventIds.length > 0) {
      content.appendChild(this.renderMultiEventProperties());
    } else {
      content.appendChild(this.renderEmptyState());
    }

    this.container.appendChild(content);
  }

  /**
   * E049: Editing ClipRecord (name/color/loop) via ClipRegistry.
   */
  private renderClipProperties(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'clip-properties';

    if (!this.state.clipData) return section;

    const clip = this.state.clipData;

    // Title
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 13px;
      font-weight: 600;
      color: #4a9eff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    title.textContent = 'Clip Properties';
    section.appendChild(title);

    // Clip ID (read-only)
    section.appendChild(this.createField('ID', clip.id, true));

    // Clip Name (editable)
    const nameInput = this.createInputField('Name', clip.name || 'Untitled Clip', (value) => {
      this.updateClipProperty('name', value);
    });
    section.appendChild(nameInput);

    // Clip Color (editable)
    const colorInput = this.createColorField('Color', clip.color || '#4a9eff', (value) => {
      this.updateClipProperty('color', value);
    });
    section.appendChild(colorInput);

    // Duration (read-only)
    section.appendChild(this.createField('Duration', `${clip.duration} ticks`, true));

    // Loop (editable)
    const loopCheckbox = this.createCheckboxField('Loop', clip.loop, (value) => {
      this.updateClipProperty('loop', value);
    });
    section.appendChild(loopCheckbox);

    // Stream Reference (read-only)
    section.appendChild(this.createField('Stream ID', clip.streamId, true));

    return section;
  }

  /**
   * E050: Edit Event payload fields via SharedEventStore (safe typed editing).
   */
  private renderEventProperties(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'event-properties';

    if (!this.state.eventData) return section;

    const event = this.state.eventData;

    // Title
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 13px;
      font-weight: 600;
      color: #4a9eff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    title.textContent = 'Event Properties';
    section.appendChild(title);

    // Event ID (read-only)
    section.appendChild(this.createField('ID', event.id, true));

    // Event Type (read-only)
    section.appendChild(this.createField('Type', event.kind || event.type || 'unknown', true));

    // Start Time (editable)
    const startInput = this.createNumberField('Start', event.start, (value) => {
      this.updateEventProperty('start', value);
    });
    section.appendChild(startInput);

    // Duration (editable)
    const durationInput = this.createNumberField('Duration', event.duration, (value) => {
      this.updateEventProperty('duration', value);
    });
    section.appendChild(durationInput);

    // Payload fields (type-specific)
    if (event.type === 'note' && typeof event.payload === 'object' && event.payload !== null) {
      const payload = event.payload as { note?: number; velocity?: number };
      
      if (typeof payload.note === 'number') {
        const noteInput = this.createNumberField('Note', payload.note, (value) => {
          this.updateEventPayloadProperty('note', value);
        });
        section.appendChild(noteInput);
      }

      if (typeof payload.velocity === 'number') {
        const velocityInput = this.createNumberField('Velocity', payload.velocity, (value) => {
          this.updateEventPayloadProperty('velocity', value);
        }, { min: 0, max: 127 });
        section.appendChild(velocityInput);
      }
    }

    return section;
  }

  private renderMultiEventProperties(): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      color: #999;
      text-align: center;
      padding: 24px;
    `;
    section.textContent = `${this.state.selectedEventIds.length} events selected`;
    
    // Could add bulk edit actions here in the future
    
    return section;
  }

  private renderEmptyState(): HTMLElement {
    const empty = document.createElement('div');
    empty.style.cssText = `
      color: #999;
      text-align: center;
      padding: 24px;
    `;
    empty.textContent = 'No selection';
    return empty;
  }

  private createField(label: string, value: string, readOnly: boolean): HTMLElement {
    const field = document.createElement('div');
    field.style.cssText = `
      margin-bottom: 12px;
    `;

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: #999;
    `;
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const valueEl = document.createElement('div');
    valueEl.style.cssText = `
      padding: 6px 8px;
      background: ${readOnly ? '#2d2d2d' : '#3e3e3e'};
      border-radius: 4px;
      color: ${readOnly ? '#666' : '#cccccc'};
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
    `;
    valueEl.textContent = value;
    field.appendChild(valueEl);

    return field;
  }

  private createInputField(label: string, value: string, onChange: (value: string) => void): HTMLElement {
    const field = document.createElement('div');
    field.style.cssText = `
      margin-bottom: 12px;
    `;

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: #999;
    `;
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.disabled = !this.config.allowEditing;
    input.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      background: #3e3e3e;
      border: 1px solid #555;
      border-radius: 4px;
      color: #cccccc;
      font-size: 12px;
      font-family: inherit;
    `;
    input.addEventListener('input', () => {
      onChange(input.value);
    });
    field.appendChild(input);

    return field;
  }

  private createNumberField(
    label: string,
    value: number,
    onChange: (value: number) => void,
    options: { min?: number; max?: number } = {}
  ): HTMLElement {
    const field = document.createElement('div');
    field.style.cssText = `
      margin-bottom: 12px;
    `;

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: #999;
    `;
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(value);
    input.disabled = !this.config.allowEditing;
    if (options.min !== undefined) input.min = String(options.min);
    if (options.max !== undefined) input.max = String(options.max);
    input.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      background: #3e3e3e;
      border: 1px solid #555;
      border-radius: 4px;
      color: #cccccc;
      font-size: 12px;
      font-family: inherit;
    `;
    input.addEventListener('input', () => {
      const numValue = parseFloat(input.value);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    });
    field.appendChild(input);

    return field;
  }

  private createColorField(label: string, value: string, onChange: (value: string) => void): HTMLElement {
    const field = document.createElement('div');
    field.style.cssText = `
      margin-bottom: 12px;
    `;

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: #999;
    `;
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'color';
    input.value = value;
    input.disabled = !this.config.allowEditing;
    input.style.cssText = `
      width: 100%;
      height: 36px;
      padding: 4px;
      background: #3e3e3e;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
    `;
    input.addEventListener('input', () => {
      onChange(input.value);
    });
    field.appendChild(input);

    return field;
  }

  private createCheckboxField(label: string, checked: boolean, onChange: (value: boolean) => void): HTMLElement {
    const field = document.createElement('div');
    field.style.cssText = `
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    `;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.disabled = !this.config.allowEditing;
    input.style.cssText = `
      margin-right: 8px;
    `;
    input.addEventListener('change', () => {
      onChange(input.checked);
    });
    field.appendChild(input);

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      font-size: 12px;
      color: #cccccc;
      cursor: pointer;
    `;
    labelEl.textContent = label;
    labelEl.addEventListener('click', () => {
      if (this.config.allowEditing) {
        input.checked = !input.checked;
        onChange(input.checked);
      }
    });
    field.appendChild(labelEl);

    return field;
  }

  private updateClipProperty(property: keyof ClipRecord, value: unknown): void {
    if (!this.state.selectedClipId || !this.state.clipData) return;

    const clipRegistry = getClipRegistry();
    const updatedClip = { ...this.state.clipData, [property]: value };
    
    // Update via clip registry
    clipRegistry.updateClip(this.state.selectedClipId, updatedClip as Partial<ClipRecord>);
  }

  private updateEventProperty(property: keyof Event<unknown>, value: unknown): void {
    if (!this.state.selectedEventId || !this.state.eventData) return;

    // Find the stream containing this event
    const eventStore = getSharedEventStore();
    const streams = eventStore.getAllStreams();

    for (const stream of streams) {
      const events = eventStore.getEventsInRange(stream.id, asTick(0), asTick(Number.MAX_SAFE_INTEGER));
      const event = events.find(e => e.id === this.state.selectedEventId);
      
      if (event) {
        const updatedEvent = { ...event, [property]: value };
        
        // Update event in store
        eventStore.updateEvent(stream.id, event.id, updatedEvent as Event<unknown>);
        return;
      }
    }
  }

  private updateEventPayloadProperty(property: string, value: unknown): void {
    if (!this.state.selectedEventId || !this.state.eventData) return;

    const eventStore = getSharedEventStore();
    const streams = eventStore.getAllStreams();

    for (const stream of streams) {
      const events = eventStore.getEventsInRange(stream.id, asTick(0), asTick(Number.MAX_SAFE_INTEGER));
      const event = events.find(e => e.id === this.state.selectedEventId);
      
      if (event && typeof event.payload === 'object' && event.payload !== null) {
        const updatedPayload = { ...event.payload as Record<string, unknown>, [property]: value };
        const updatedEvent = { ...event, payload: updatedPayload };
        
        eventStore.updateEvent(stream.id, event.id, updatedEvent as Event<unknown>);
        return;
      }
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
}
