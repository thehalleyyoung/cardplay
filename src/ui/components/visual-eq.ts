/**
 * @fileoverview Visual Equalizer Component
 * 
 * Beautiful parametric EQ visualization with:
 * - Interactive frequency response curve
 * - Draggable filter nodes
 * - Frequency and gain scales
 * - Filter type indicators
 * - Solo and bypass per band
 * - Beautiful gradients and animations
 * - Dark mode support
 * 
 * Used in mixer strips, sound design boards, and mastering view.
 * 
 * @module @cardplay/ui/components/visual-eq
 */

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'peaking' | 'lowshelf' | 'highshelf' | 'allpass';

export interface EQBand {
  /** Band ID */
  id: string;
  
  /** Filter type */
  type: FilterType;
  
  /** Frequency in Hz */
  frequency: number;
  
  /** Gain in dB (for peaking/shelf filters) */
  gain: number;
  
  /** Q factor (resonance) */
  q: number;
  
  /** Whether band is enabled */
  enabled: boolean;
  
  /** Whether band is soloed */
  solo: boolean;
  
  /** Band color */
  color?: string;
}

export interface VisualEQOptions {
  /** Canvas width */
  width?: number;
  
  /** Canvas height (defaults to 300) */
  height?: number;
  
  /** EQ bands */
  bands: EQBand[];
  
  /** Minimum frequency (Hz) */
  minFreq?: number;
  
  /** Maximum frequency (Hz) */
  maxFreq?: number;
  
  /** Minimum gain (dB) */
  minGain?: number;
  
  /** Maximum gain (dB) */
  maxGain?: number;
  
  /** Background color */
  backgroundColor?: string;
  
  /** Grid color */
  gridColor?: string;
  
  /** Curve color */
  curveColor?: string;
  
  /** Show frequency grid */
  showGrid?: boolean;
  
  /** Show gain scale */
  showGainScale?: boolean;
  
  /** Interactive (drag nodes) */
  interactive?: boolean;
  
  /** Callback when band changes */
  onBandChange?: (band: EQBand) => void;
  
  /** Callback when band is clicked */
  onBandClick?: (band: EQBand) => void;
}

/**
 * Frequency grid lines (Hz)
 */
const FREQ_GRID = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

/**
 * Gain grid lines (dB)
 */
const GAIN_GRID = [-24, -18, -12, -6, 0, 6, 12, 18, 24];

/**
 * Filter type icons/labels
 */
const FILTER_LABELS: Record<FilterType, string> = {
  'lowpass': 'LP',
  'highpass': 'HP',
  'bandpass': 'BP',
  'notch': 'N',
  'peaking': 'PK',
  'lowshelf': 'LS',
  'highshelf': 'HS',
  'allpass': 'AP',
};

/**
 * Creates a beautiful visual EQ
 */
export function createVisualEQ(options: VisualEQOptions): HTMLElement {
  const {
    width,
    height = 300,
    bands = [],
    minFreq = 20,
    maxFreq = 20000,
    minGain = -24,
    maxGain = 24,
    backgroundColor = 'var(--color-surface, #1a1a1a)',
    gridColor = 'rgba(255, 255, 255, 0.1)',
    curveColor = 'var(--color-primary, #4a90e2)',
    showGrid = true,
    showGainScale = true,
    interactive = true,
    onBandChange,
    onBandClick,
  } = options;

  const container = document.createElement('div');
  container.className = 'visual-eq';
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
    cursor: ${interactive ? 'pointer' : 'default'};
  `;
  
  // ARIA accessibility
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Visual equalizer with interactive frequency response curve');
  canvas.setAttribute('tabindex', '0');

  const ctx = canvas.getContext('2d')!;
  
  // Enable high-DPI rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.width * dpr;
  canvas.height = canvas.height * dpr;
  ctx.scale(dpr, dpr);

  /**
   * Converts frequency to X coordinate (logarithmic)
   */
  function freqToX(freq: number): number {
    const w = canvas.width / dpr;
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);
    const freqLog = Math.log10(freq);
    return ((freqLog - minLog) / (maxLog - minLog)) * w;
  }

  /**
   * Converts X coordinate to frequency
   */
  function xToFreq(x: number): number {
    const w = canvas.width / dpr;
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);
    const freqLog = minLog + ((x / w) * (maxLog - minLog));
    return Math.pow(10, freqLog);
  }

  /**
   * Converts gain to Y coordinate
   */
  function gainToY(gain: number): number {
    const h = canvas.height / dpr;
    return h / 2 - ((gain / maxGain) * (h / 2));
  }

  /**
   * Converts Y coordinate to gain
   */
  function yToGain(y: number): number {
    const h = canvas.height / dpr;
    return ((h / 2 - y) / (h / 2)) * maxGain;
  }

  /**
   * Calculates frequency response at a given frequency
   */
  function getResponseAtFreq(freq: number): number {
    let totalGain = 0;
    
    for (const band of bands) {
      if (!band.enabled) continue;
      
      const gain = calculateFilterResponse(freq, band);
      totalGain += gain;
    }
    
    return totalGain;
  }

  /**
   * Calculates filter response for a single band
   */
  function calculateFilterResponse(freq: number, band: EQBand): number {
    const w = (2 * Math.PI * freq);
    const w0 = (2 * Math.PI * band.frequency);
    
    switch (band.type) {
      case 'peaking': {
        // Simplified peaking filter response
        const bw = w0 / band.q;
        const delta = w - w0;
        const response = 1 / (1 + Math.pow(delta / (bw / 2), 2));
        return band.gain * response;
      }
      
      case 'lowshelf': {
        // Simplified low shelf response
        if (freq < band.frequency) {
          return band.gain;
        } else {
          const t = Math.log10(freq / band.frequency);
          return band.gain * Math.exp(-t * 2);
        }
      }
      
      case 'highshelf': {
        // Simplified high shelf response
        if (freq > band.frequency) {
          return band.gain;
        } else {
          const t = Math.log10(band.frequency / freq);
          return band.gain * Math.exp(-t * 2);
        }
      }
      
      default:
        return 0;
    }
  }

  /**
   * Renders the EQ
   */
  function render(): void {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const centerY = h / 2;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      // Frequency grid
      FREQ_GRID.forEach(freq => {
        if (freq >= minFreq && freq <= maxFreq) {
          const x = freqToX(freq);
          
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
          
          // Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '10px system-ui';
          ctx.textAlign = 'center';
          const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
          ctx.fillText(label, x, h - 4);
        }
      });

      // Gain grid
      if (showGainScale) {
        GAIN_GRID.forEach(gain => {
          if (gain >= minGain && gain <= maxGain) {
            const y = gainToY(gain);
            
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            
            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(`${gain > 0 ? '+' : ''}${gain}dB`, w - 4, y - 2);
          }
        });
      }
    }

    // Draw center line (0dB)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();

    // Draw frequency response curve
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const freq = xToFreq(x);
      const gain = getResponseAtFreq(freq);
      const y = gainToY(gain);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Fill under curve
    ctx.lineTo(w, centerY);
    ctx.lineTo(0, centerY);
    ctx.closePath();
    ctx.fillStyle = curveColor + '22'; // 13% opacity
    ctx.fill();

    // Draw band nodes
    bands.forEach((band) => {
      const x = freqToX(band.frequency);
      const y = gainToY(band.gain);
      const color = band.color || curveColor;
      
      // Node circle
      ctx.fillStyle = band.enabled ? color : 'rgba(128, 128, 128, 0.5)';
      ctx.strokeStyle = band.solo ? '#ffff00' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = band.solo ? 3 : 2;
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Band label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(FILTER_LABELS[band.type] || '?', x, y + 3);
      
      // Frequency label below
      ctx.font = '10px system-ui';
      const freqLabel = band.frequency >= 1000 
        ? `${(band.frequency / 1000).toFixed(1)}k`
        : `${Math.round(band.frequency)}`;
      ctx.fillText(freqLabel, x, y + 20);
      
      // Gain label if non-zero
      if (Math.abs(band.gain) > 0.1) {
        const gainLabel = `${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)}`;
        ctx.fillText(gainLabel, x, y - 12);
      }
    });
  }

  // Interaction state
  let draggedBand: EQBand | null = null;
  let dragStartPos: { x: number; y: number } | null = null;

  /**
   * Finds band at given position
   */
  function findBandAt(x: number, y: number): EQBand | null {
    const threshold = 15; // Hit test radius
    
    for (const band of bands) {
      const bandX = freqToX(band.frequency);
      const bandY = gainToY(band.gain);
      const dist = Math.sqrt(Math.pow(x - bandX, 2) + Math.pow(y - bandY, 2));
      
      if (dist <= threshold) {
        return band;
      }
    }
    
    return null;
  }

  if (interactive) {
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const band = findBandAt(x, y);
      if (band) {
        draggedBand = band;
        dragStartPos = { x, y };
        
        if (e.detail === 2) {
          // Double-click to toggle bypass
          band.enabled = !band.enabled;
          onBandChange?.(band);
          render();
        }
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (draggedBand && dragStartPos) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (e.shiftKey) {
          // Shift: adjust Q (not implemented in UI yet)
        } else if (e.altKey) {
          // Alt: adjust only gain
          draggedBand.gain = Math.max(minGain, Math.min(maxGain, yToGain(y)));
        } else {
          // Normal: adjust frequency and gain
          draggedBand.frequency = Math.max(minFreq, Math.min(maxFreq, xToFreq(x)));
          draggedBand.gain = Math.max(minGain, Math.min(maxGain, yToGain(y)));
        }
        
        onBandChange?.(draggedBand);
        render();
      } else {
        // Update cursor on hover
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const band = findBandAt(x, y);
        canvas.style.cursor = band ? 'grab' : 'default';
      }
    });

    canvas.addEventListener('mouseup', () => {
      draggedBand = null;
      dragStartPos = null;
    });

    canvas.addEventListener('mouseleave', () => {
      draggedBand = null;
      dragStartPos = null;
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const band = findBandAt(x, y);
      if (band && !draggedBand) {
        onBandClick?.(band);
      }
    });

    // Keyboard navigation
    canvas.addEventListener('keydown', (e) => {
      if (bands.length === 0) return;
      
      const currentBand = bands[0]; // Focus first band for simplicity
      if (!currentBand) return;
      
      if (e.key === 'ArrowLeft') {
        currentBand.frequency = Math.max(minFreq, currentBand.frequency * 0.9);
        onBandChange?.(currentBand);
        render();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        currentBand.frequency = Math.min(maxFreq, currentBand.frequency * 1.1);
        onBandChange?.(currentBand);
        render();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        currentBand.gain = Math.min(maxGain, currentBand.gain + 1);
        onBandChange?.(currentBand);
        render();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        currentBand.gain = Math.max(minGain, currentBand.gain - 1);
        onBandChange?.(currentBand);
        render();
        e.preventDefault();
      }
    });
  }

  // Initial render
  render();

  container.appendChild(canvas);

  // Return container with control methods
  (container as any).update = (newOptions: Partial<VisualEQOptions>) => {
    Object.assign(options, newOptions);
    render();
  };

  (container as any).render = render;

  (container as any).destroy = () => {
    // Cleanup if needed
  };

  return container;
}
