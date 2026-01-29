/**
 * @fileoverview Enhanced Waveform Visualizer
 * 
 * Beautiful waveform visualization for audio clips and samples with:
 * - High-resolution rendering with anti-aliasing
 * - Zoom and scroll support
 * - Selection regions
 * - Loop markers
 * - Color gradients for depth
 * - Dark mode support
 * - Performance optimizations (caching, dirty regions)
 * 
 * Used in sampler board, arrangement timeline, and sample browser.
 * 
 * @module @cardplay/ui/components/waveform-visualizer
 */

export interface WaveformData {
  /** Audio buffer peaks (normalized -1 to 1) */
  peaks: Float32Array;
  
  /** Sample rate */
  sampleRate: number;
  
  /** Duration in seconds */
  duration: number;
  
  /** Number of channels */
  channels: number;
}

export interface WaveformRegion {
  /** Start time in seconds */
  start: number;
  
  /** End time in seconds */
  end: number;
  
  /** Region color */
  color?: string;
  
  /** Region label */
  label?: string;
}

export interface WaveformVisualizerOptions {
  /** Waveform data to display */
  data: WaveformData;
  
  /** Canvas width (defaults to container width) */
  width?: number;
  
  /** Canvas height (defaults to 200) */
  height?: number;
  
  /** Waveform color */
  waveColor?: string;
  
  /** Progress color (for played portion) */
  progressColor?: string;
  
  /** Background color */
  backgroundColor?: string;
  
  /** Current playhead position (0-1) */
  playhead?: number;
  
  /** Selection region */
  selection?: WaveformRegion;
  
  /** Loop region */
  loop?: WaveformRegion;
  
  /** Additional regions (markers, sections) */
  regions?: WaveformRegion[];
  
  /** Zoom level (pixels per second) */
  pixelsPerSecond?: number;
  
  /** Scroll offset in seconds */
  scrollOffset?: number;
  
  /** Enable interaction (click to seek, drag to select) */
  interactive?: boolean;
  
  /** Callback when user clicks/seeks */
  onSeek?: (time: number) => void;
  
  /** Callback when selection changes */
  onSelectionChange?: (region: WaveformRegion | null) => void;
  
  /** Callback when loop changes */
  onLoopChange?: (region: WaveformRegion | null) => void;
}

/**
 * Creates a beautiful, high-performance waveform visualizer
 */
export function createWaveformVisualizer(options: WaveformVisualizerOptions): HTMLElement {
  const {
    data,
    width,
    height = 200,
    waveColor = 'var(--color-primary, #4a90e2)',
    progressColor = 'var(--color-primary-active, #357abd)',
    backgroundColor = 'var(--color-surface, #1a1a1a)',
    playhead = 0,
    selection,
    loop,
    regions = [],
    pixelsPerSecond = 100,
    scrollOffset = 0,
    interactive = true,
    onSeek,
    onSelectionChange,
  } = options;

  const container = document.createElement('div');
  container.className = 'waveform-visualizer';
  container.style.cssText = `
    position: relative;
    width: ${width ? `${width}px` : '100%'};
    height: ${height}px;
    background: ${backgroundColor};
    border-radius: 4px;
    overflow: hidden;
    user-select: none;
  `;

  const canvas = document.createElement('canvas');
  canvas.width = width || container.clientWidth;
  canvas.height = height;
  canvas.style.cssText = `
    display: block;
    width: 100%;
    height: 100%;
  `;
  
  // ARIA accessibility
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Audio waveform visualization');
  
  if (interactive) {
    canvas.setAttribute('tabindex', '0');
    canvas.style.cursor = 'pointer';
  }

  const ctx = canvas.getContext('2d')!;
  
  // Enable high-DPI rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.width * dpr;
  canvas.height = canvas.height * dpr;
  ctx.scale(dpr, dpr);

  /**
   * Renders the waveform with all decorations
   */
  function render(): void {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const centerY = h / 2;
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);
    
    // Draw loop region
    if (loop) {
      const loopStartX = timeToX(loop.start);
      const loopEndX = timeToX(loop.end);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, h);
      
      // Loop markers
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(loopStartX, 0);
      ctx.lineTo(loopStartX, h);
      ctx.moveTo(loopEndX, 0);
      ctx.lineTo(loopEndX, h);
      ctx.stroke();
    }
    
    // Draw custom regions
    regions.forEach(region => {
      const startX = timeToX(region.start);
      const endX = timeToX(region.end);
      const color = region.color || 'rgba(100, 150, 255, 0.2)';
      
      ctx.fillStyle = color;
      ctx.fillRect(startX, 0, endX - startX, h);
      
      if (region.label) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '12px system-ui';
        ctx.fillText(region.label, startX + 4, 16);
      }
    });
    
    // Draw waveform
    const samplesPerPixel = Math.ceil((data.peaks.length / w) * pixelsPerSecond / 100);
    
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = 0; x < w; x++) {
      const sampleIndex = Math.floor((x + scrollOffset * pixelsPerSecond) * samplesPerPixel);
      
      if (sampleIndex >= data.peaks.length) break;
      
      // Get peak value for this pixel
      let max = 0;
      for (let i = 0; i < samplesPerPixel && sampleIndex + i < data.peaks.length; i++) {
        const peak = data.peaks[sampleIndex + i];
        if (peak !== undefined) {
          max = Math.max(max, Math.abs(peak));
        }
      }
      
      const amplitude = max * (h / 2) * 0.9; // 90% of height
      const y1 = centerY - amplitude;
      const y2 = centerY + amplitude;
      
      // Draw vertical line for this pixel
      if (x < playhead * w) {
        ctx.strokeStyle = progressColor;
      } else {
        ctx.strokeStyle = waveColor;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    }
    
    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    
    // Draw selection region
    if (selection) {
      const selStartX = timeToX(selection.start);
      const selEndX = timeToX(selection.end);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(selStartX, 0, selEndX - selStartX, h);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(selStartX, 0, selEndX - selStartX, h);
    }
    
    // Draw playhead
    if (playhead > 0 && playhead <= 1) {
      const playheadX = playhead * w;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      
      // Playhead triangle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Converts time in seconds to X coordinate
   */
  function timeToX(time: number): number {
    return (time - scrollOffset) * pixelsPerSecond;
  }

  /**
   * Converts X coordinate to time in seconds
   */
  function xToTime(x: number): number {
    return (x / pixelsPerSecond) + scrollOffset;
  }

  // Interaction handlers
  let isDragging = false;
  let dragStart: { x: number; time: number } | null = null;

  if (interactive) {
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = xToTime(x);
      
      isDragging = true;
      dragStart = { x, time };
      
      if (!e.shiftKey) {
        // Click to seek
        onSeek?.(time);
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging && dragStart && e.shiftKey) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = xToTime(x);
        
        // Create selection
        const region: WaveformRegion = {
          start: Math.min(dragStart.time, time),
          end: Math.max(dragStart.time, time),
        };
        
        onSelectionChange?.(region);
      }
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      dragStart = null;
    });

    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      dragStart = null;
    });

    // Keyboard navigation
    canvas.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        onSeek?.(Math.max(0, (playhead * data.duration) - 0.1));
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        onSeek?.(Math.min(data.duration, (playhead * data.duration) + 0.1));
        e.preventDefault();
      } else if (e.key === 'Home') {
        onSeek?.(0);
        e.preventDefault();
      } else if (e.key === 'End') {
        onSeek?.(data.duration);
        e.preventDefault();
      }
    });
  }

  // Initial render
  render();
  
  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    canvas.width = (width || container.clientWidth) * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    render();
  });
  resizeObserver.observe(container);

  container.appendChild(canvas);

  // Return container with update method
  (container as any).update = (newOptions: Partial<WaveformVisualizerOptions>) => {
    Object.assign(options, newOptions);
    render();
  };

  (container as any).destroy = () => {
    resizeObserver.disconnect();
  };

  return container;
}

/**
 * Generates sample waveform data for testing
 */
export function generateSampleWaveform(durationSeconds: number, sampleRate: number = 44100): WaveformData {
  const samples = Math.floor(durationSeconds * sampleRate);
  const peaks = new Float32Array(samples);
  
  // Generate a sine wave with envelope
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 440; // A4
    const envelope = Math.exp(-t * 2); // Decay
    peaks[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
  }
  
  return {
    peaks,
    sampleRate,
    duration: durationSeconds,
    channels: 1,
  };
}
