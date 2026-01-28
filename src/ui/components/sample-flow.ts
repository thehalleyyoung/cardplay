/**
 * @fileoverview Sample Flow UI - Drag-and-drop workflows for samples.
 * 
 * Provides the UI layer for sample workflows:
 * - Browser → Editor drag-and-drop
 * - Editor selection → Sampler zone
 * - Waveform preview during drag
 * - Drop zone indicators
 * 
 * @module @cardplay/ui/components/sample-flow
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase H.1
 */

import type { SampleId, SliceId, LoadedSample } from '../../audio/sample-pipeline';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sample drag data transferred during drag operations.
 */
export interface SampleDragData {
  readonly type: 'sample' | 'slice' | 'region';
  readonly sampleId: SampleId;
  readonly sliceId?: SliceId;
  /** Start time in seconds (for region selections) */
  readonly startTime?: number;
  /** End time in seconds (for region selections) */
  readonly endTime?: number;
  /** Original file name */
  readonly fileName?: string;
  /** Preview waveform data (downsampled) */
  readonly waveformPreview?: readonly number[];
  /** Duration in seconds */
  readonly duration?: number;
  /** Sample rate */
  readonly sampleRate?: number;
}

/**
 * Drop target types.
 */
export type DropTargetType = 
  | 'editor-track'      // Drop into arrangement/tracker track
  | 'sampler-zone'      // Drop into sampler key zone
  | 'sampler-layer'     // Drop into sampler velocity layer
  | 'drum-pad'          // Drop onto drum machine pad
  | 'browser-folder'    // Drop into browser folder (for organizing)
  | 'delete';           // Drop onto trash/delete

/**
 * Drop zone configuration.
 */
export interface DropZoneConfig {
  readonly id: string;
  readonly type: DropTargetType;
  readonly element: HTMLElement;
  readonly accepts: readonly ('sample' | 'slice' | 'region')[];
  /** Additional context for the drop (e.g., track ID, zone index) */
  readonly context?: Record<string, unknown>;
  /** Whether this zone is currently active */
  enabled: boolean;
}

/**
 * Drop result after a successful drop.
 */
export interface DropResult {
  readonly success: boolean;
  readonly targetType: DropTargetType;
  readonly targetId: string;
  readonly data: SampleDragData;
  readonly context?: Record<string, unknown>;
}

/**
 * Sample flow event types.
 */
export interface SampleFlowEvents {
  'drag-start': { data: SampleDragData };
  'drag-move': { x: number; y: number; data: SampleDragData };
  'drag-end': { data: SampleDragData; cancelled: boolean };
  'drop': DropResult;
  'zone-enter': { zoneId: string; data: SampleDragData };
  'zone-leave': { zoneId: string };
}

/**
 * Callback for handling drops.
 */
export type DropHandler = (result: DropResult) => void | Promise<void>;

// ============================================================================
// DRAG PREVIEW
// ============================================================================

/**
 * Creates a drag preview element showing waveform.
 */
function createDragPreview(data: SampleDragData): HTMLElement {
  const preview = document.createElement('div');
  preview.className = 'sample-drag-preview';
  preview.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 10000;
    padding: 8px 12px;
    background: rgba(30, 30, 50, 0.95);
    border: 2px solid #00aaff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 170, 255, 0.3);
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 150px;
    max-width: 300px;
    transform: translate(-50%, -100%) translateY(-10px);
  `;

  // File name
  const nameEl = document.createElement('div');
  nameEl.className = 'sample-drag-name';
  nameEl.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  nameEl.textContent = data.fileName ?? `Sample ${data.sampleId}`;
  preview.appendChild(nameEl);

  // Waveform canvas
  if (data.waveformPreview && data.waveformPreview.length > 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 40;
    canvas.style.cssText = `
      width: 100%;
      height: 40px;
      border-radius: 4px;
      background: #1a1a2e;
    `;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawWaveform(ctx, data.waveformPreview, canvas.width, canvas.height);
    }
    
    preview.appendChild(canvas);
  }

  // Duration info
  if (data.duration !== undefined) {
    const durationEl = document.createElement('div');
    durationEl.className = 'sample-drag-duration';
    durationEl.style.cssText = `
      font-size: 10px;
      color: #888888;
    `;
    durationEl.textContent = formatDuration(data.duration);
    if (data.type === 'region' && data.startTime !== undefined && data.endTime !== undefined) {
      durationEl.textContent = `${formatDuration(data.startTime)} - ${formatDuration(data.endTime)}`;
    }
    preview.appendChild(durationEl);
  }

  return preview;
}

/**
 * Draws a waveform on a canvas.
 */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: readonly number[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  
  // Draw waveform
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  
  const centerY = height / 2;
  const scale = height / 2;
  const step = data.length / width;
  
  for (let x = 0; x < width; x++) {
    const dataIndex = Math.floor(x * step);
    const value = data[dataIndex] ?? 0;
    const y = centerY - value * scale;
    
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  
  // Draw center line
  ctx.strokeStyle = '#333366';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
}

/**
 * Formats duration in seconds to mm:ss.ms format.
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// ============================================================================
// DROP ZONE HIGHLIGHTING
// ============================================================================

/**
 * Applies drop zone highlight styles.
 */
function highlightDropZone(element: HTMLElement, active: boolean, accepts: boolean): void {
  if (active && accepts) {
    element.style.outline = '2px dashed #00ff88';
    element.style.outlineOffset = '-2px';
    element.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
  } else if (active && !accepts) {
    element.style.outline = '2px dashed #ff4444';
    element.style.outlineOffset = '-2px';
    element.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
  } else {
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.backgroundColor = '';
  }
}

// ============================================================================
// SAMPLE FLOW MANAGER
// ============================================================================

/**
 * SampleFlowManager - Manages sample drag-and-drop workflows.
 */
export class SampleFlowManager {
  private dropZones: Map<string, DropZoneConfig> = new Map();
  private dropHandlers: Map<DropTargetType, DropHandler[]> = new Map();
  private isDragging = false;
  private currentData: SampleDragData | null = null;
  private previewElement: HTMLElement | null = null;
  private activeZone: DropZoneConfig | null = null;
  private eventListeners: Map<keyof SampleFlowEvents, Set<(data: any) => void>> = new Map();

  constructor() {
    this.setupGlobalListeners();
  }

  // ========== DROP ZONE MANAGEMENT ==========

  /**
   * Register a drop zone.
   */
  registerDropZone(config: DropZoneConfig): void {
    this.dropZones.set(config.id, config);
    
    // Set up element listeners
    config.element.addEventListener('dragover', (e) => this.handleDragOver(e, config));
    config.element.addEventListener('dragleave', (e) => this.handleDragLeave(e, config));
    config.element.addEventListener('drop', (e) => this.handleDrop(e, config));
  }

  /**
   * Unregister a drop zone.
   */
  unregisterDropZone(zoneId: string): void {
    this.dropZones.delete(zoneId);
  }

  /**
   * Enable/disable a drop zone.
   */
  setDropZoneEnabled(zoneId: string, enabled: boolean): void {
    const zone = this.dropZones.get(zoneId);
    if (zone) {
      zone.enabled = enabled;
    }
  }

  /**
   * Register a drop handler for a target type.
   */
  onDrop(targetType: DropTargetType, handler: DropHandler): () => void {
    if (!this.dropHandlers.has(targetType)) {
      this.dropHandlers.set(targetType, []);
    }
    this.dropHandlers.get(targetType)!.push(handler);
    
    return () => {
      const handlers = this.dropHandlers.get(targetType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
      }
    };
  }

  // ========== DRAG OPERATIONS ==========

  /**
   * Start a sample drag operation.
   */
  startDrag(data: SampleDragData, event: MouseEvent | DragEvent): void {
    this.isDragging = true;
    this.currentData = data;

    // Create and show preview
    this.previewElement = createDragPreview(data);
    document.body.appendChild(this.previewElement);
    this.updatePreviewPosition(event.clientX, event.clientY);

    // Highlight all valid drop zones
    for (const zone of this.dropZones.values()) {
      if (zone.enabled && zone.accepts.includes(data.type)) {
        highlightDropZone(zone.element, true, true);
      }
    }

    // Emit event
    this.emit('drag-start', { data });

    // Set up drag event if this is a native drag
    if (event instanceof DragEvent && event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(data));
      event.dataTransfer.effectAllowed = 'copy';
      
      // Use a transparent image as the default drag preview
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      event.dataTransfer.setDragImage(img, 0, 0);
    }
  }

  /**
   * Cancel the current drag operation.
   */
  cancelDrag(): void {
    if (!this.isDragging) return;

    const data = this.currentData;
    this.cleanup();

    if (data) {
      this.emit('drag-end', { data, cancelled: true });
    }
  }

  // ========== EVENT HANDLING ==========

  /**
   * Subscribe to sample flow events.
   */
  on<K extends keyof SampleFlowEvents>(
    event: K,
    callback: (data: SampleFlowEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit<K extends keyof SampleFlowEvents>(event: K, data: SampleFlowEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        callback(data);
      }
    }
  }

  // ========== PRIVATE METHODS ==========

  private setupGlobalListeners(): void {
    // Track mouse movement for preview positioning
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.previewElement) {
        this.updatePreviewPosition(e.clientX, e.clientY);
        this.emit('drag-move', { x: e.clientX, y: e.clientY, data: this.currentData! });
      }
    });

    // Track dragover for native drag positioning
    document.addEventListener('dragover', (e) => {
      if (this.isDragging && this.previewElement) {
        this.updatePreviewPosition(e.clientX, e.clientY);
      }
    });

    // Handle escape to cancel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDragging) {
        this.cancelDrag();
      }
    });

    // Handle dragend
    document.addEventListener('dragend', () => {
      if (this.isDragging) {
        this.cancelDrag();
      }
    });
  }

  private updatePreviewPosition(x: number, y: number): void {
    if (this.previewElement) {
      this.previewElement.style.left = `${x}px`;
      this.previewElement.style.top = `${y}px`;
    }
  }

  private handleDragOver(event: DragEvent, zone: DropZoneConfig): void {
    if (!zone.enabled) return;
    
    event.preventDefault();
    event.stopPropagation();

    // Check if we accept this drag
    const data = this.currentData ?? this.parseDropData(event);
    if (!data) return;

    const accepts = zone.accepts.includes(data.type);
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = accepts ? 'copy' : 'none';
    }

    // Update active zone
    if (this.activeZone !== zone) {
      if (this.activeZone) {
        highlightDropZone(this.activeZone.element, false, false);
        this.emit('zone-leave', { zoneId: this.activeZone.id });
      }
      
      this.activeZone = zone;
      highlightDropZone(zone.element, true, accepts);
      this.emit('zone-enter', { zoneId: zone.id, data });
    }
  }

  private handleDragLeave(event: DragEvent, zone: DropZoneConfig): void {
    // Only handle if actually leaving the zone (not entering a child)
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget && zone.element.contains(relatedTarget)) {
      return;
    }

    if (this.activeZone === zone) {
      highlightDropZone(zone.element, false, false);
      this.emit('zone-leave', { zoneId: zone.id });
      this.activeZone = null;
    }
  }

  private handleDrop(event: DragEvent, zone: DropZoneConfig): void {
    event.preventDefault();
    event.stopPropagation();

    if (!zone.enabled) return;

    const data = this.currentData ?? this.parseDropData(event);
    if (!data) return;

    const accepts = zone.accepts.includes(data.type);
    if (!accepts) {
      this.cleanup();
      return;
    }

    const result: DropResult = {
      success: true,
      targetType: zone.type,
      targetId: zone.id,
      data,
      ...(zone.context !== undefined && { context: zone.context }),
    };

    // Call handlers
    const handlers = this.dropHandlers.get(zone.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(result);
      }
    }

    // Emit event
    this.emit('drop', result);
    this.emit('drag-end', { data, cancelled: false });

    this.cleanup();
  }

  private parseDropData(event: DragEvent): SampleDragData | null {
    if (!event.dataTransfer) return null;

    try {
      const json = event.dataTransfer.getData('application/json');
      if (json) {
        return JSON.parse(json) as SampleDragData;
      }
    } catch {
      // Not valid JSON
    }

    // Check for files
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files.item(0);
      if (file && file.type.startsWith('audio/')) {
        return {
          type: 'sample',
          sampleId: `file-${Date.now()}` as SampleId,
          fileName: file.name,
        };
      }
    }

    return null;
  }

  private cleanup(): void {
    this.isDragging = false;
    this.currentData = null;

    // Remove preview
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = null;
    }

    // Clear all zone highlights
    for (const zone of this.dropZones.values()) {
      highlightDropZone(zone.element, false, false);
    }

    this.activeZone = null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates sample drag data from a loaded sample.
 */
export function createSampleDragData(
  sample: LoadedSample,
  options?: {
    sliceId?: SliceId;
    startTime?: number;
    endTime?: number;
  }
): SampleDragData {
  const type = options?.sliceId ? 'slice' 
    : (options?.startTime !== undefined && options?.endTime !== undefined) ? 'region'
    : 'sample';

  const waveformPreview = sample.waveformData
    ? downsampleWaveform(sample.waveformData, 100)
    : undefined;

  return {
    type,
    sampleId: sample.metadata.id,
    ...(options?.sliceId !== undefined && { sliceId: options.sliceId }),
    ...(options?.startTime !== undefined && { startTime: options.startTime }),
    ...(options?.endTime !== undefined && { endTime: options.endTime }),
    fileName: sample.metadata.name,
    duration: sample.metadata.duration,
    sampleRate: sample.metadata.sampleRate,
    ...(waveformPreview !== undefined && { waveformPreview }),
  };
}

/**
 * Downsamples waveform data for preview.
 */
function downsampleWaveform(data: ArrayLike<number>, targetLength: number): number[] {
  if (data.length <= targetLength) {
    return Array.from({ length: data.length }, (_, i) => data[i] ?? 0);
  }

  const result: number[] = [];
  const step = data.length / targetLength;

  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    
    // Find max absolute value in this range
    let max = 0;
    for (let j = start; j < end && j < data.length; j++) {
      const value = data[j];
      if (value === undefined) continue;
      const abs = Math.abs(value);
      if (abs > max) max = abs;
    }
    
    result.push(max);
  }

  return result;
}

/**
 * Creates a draggable element for a sample in the browser.
 */
export function makeSampleDraggable(
  element: HTMLElement,
  sample: LoadedSample,
  flowManager: SampleFlowManager
): void {
  element.draggable = true;
  element.style.cursor = 'grab';

  element.addEventListener('dragstart', (event) => {
    const data = createSampleDragData(sample);
    flowManager.startDrag(data, event);
    element.style.opacity = '0.5';
  });

  element.addEventListener('dragend', () => {
    element.style.opacity = '1';
  });
}

/**
 * Creates a drop zone for an editor track.
 */
export function createEditorTrackDropZone(
  element: HTMLElement,
  trackId: string,
  flowManager: SampleFlowManager
): void {
  flowManager.registerDropZone({
    id: `track-${trackId}`,
    type: 'editor-track',
    element,
    accepts: ['sample', 'slice', 'region'],
    context: { trackId },
    enabled: true,
  });
}

/**
 * Creates a drop zone for a sampler key zone.
 */
export function createSamplerZoneDropZone(
  element: HTMLElement,
  zoneIndex: number,
  keyRange: { low: number; high: number },
  flowManager: SampleFlowManager
): void {
  flowManager.registerDropZone({
    id: `sampler-zone-${zoneIndex}`,
    type: 'sampler-zone',
    element,
    accepts: ['sample', 'slice', 'region'],
    context: { zoneIndex, keyRange },
    enabled: true,
  });
}

/**
 * Creates a drop zone for a drum pad.
 */
export function createDrumPadDropZone(
  element: HTMLElement,
  padIndex: number,
  midiNote: number,
  flowManager: SampleFlowManager
): void {
  flowManager.registerDropZone({
    id: `drum-pad-${padIndex}`,
    type: 'drum-pad',
    element,
    accepts: ['sample', 'slice'],
    context: { padIndex, midiNote },
    enabled: true,
  });
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let flowManagerInstance: SampleFlowManager | null = null;

/**
 * Gets the singleton SampleFlowManager instance.
 */
export function getSampleFlowManager(): SampleFlowManager {
  if (!flowManagerInstance) {
    flowManagerInstance = new SampleFlowManager();
  }
  return flowManagerInstance;
}

// ============================================================================
// INTEGRATION WITH SAMPLE PIPELINE
// ============================================================================

/**
 * Sets up standard drop handlers for common targets.
 */
export function setupStandardDropHandlers(
  flowManager: SampleFlowManager,
  options: {
    onTrackDrop?: (trackId: string, data: SampleDragData) => void;
    onSamplerZoneDrop?: (zoneIndex: number, keyRange: { low: number; high: number }, data: SampleDragData) => void;
    onDrumPadDrop?: (padIndex: number, midiNote: number, data: SampleDragData) => void;
  }
): void {
  // Editor track drops
  if (options.onTrackDrop) {
    flowManager.onDrop('editor-track', (result) => {
      const trackId = result.context?.trackId as string;
      if (trackId) {
        options.onTrackDrop!(trackId, result.data);
      }
    });
  }

  // Sampler zone drops
  if (options.onSamplerZoneDrop) {
    flowManager.onDrop('sampler-zone', (result) => {
      const zoneIndex = result.context?.zoneIndex as number;
      const keyRange = result.context?.keyRange as { low: number; high: number };
      if (zoneIndex !== undefined && keyRange) {
        options.onSamplerZoneDrop!(zoneIndex, keyRange, result.data);
      }
    });
  }

  // Drum pad drops
  if (options.onDrumPadDrop) {
    flowManager.onDrop('drum-pad', (result) => {
      const padIndex = result.context?.padIndex as number;
      const midiNote = result.context?.midiNote as number;
      if (padIndex !== undefined && midiNote !== undefined) {
        options.onDrumPadDrop!(padIndex, midiNote, result.data);
      }
    });
  }
}
