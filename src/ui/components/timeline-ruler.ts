/**
 * @fileoverview Timeline Ruler Component
 * 
 * Beautiful timeline ruler with:
 * - Bar and beat markers
 * - Time signatures
 * - Tempo changes
 * - Section markers
 * - Snap grid visualization
 * - Dark mode support
 * 
 * Used in arrangement view, piano roll, and tracker.
 * 
 * @module @cardplay/ui/components/timeline-ruler
 */

export interface TimeSignature {
  /** Bar number where this signature starts */
  bar: number;
  
  /** Numerator (beats per bar) */
  numerator: number;
  
  /** Denominator (note value) */
  denominator: number;
}

export interface TempoChange {
  /** Bar number where this tempo starts */
  bar: number;
  
  /** BPM */
  bpm: number;
}

export interface SectionMarker {
  /** Bar number */
  bar: number;
  
  /** Section name */
  name: string;
  
  /** Section color */
  color?: string;
}

export interface TimelineRulerOptions {
  /** Width in pixels */
  width: number;
  
  /** Height in pixels (defaults to 40) */
  height?: number;
  
  /** Pixels per bar */
  pixelsPerBar: number;
  
  /** Starting bar number (for scroll offset) */
  startBar?: number;
  
  /** Time signature (defaults to 4/4) */
  timeSignature?: TimeSignature;
  
  /** Tempo in BPM (defaults to 120) */
  tempo?: number;
  
  /** Time signature changes */
  timeSignatures?: TimeSignature[];
  
  /** Tempo changes */
  tempoChanges?: TempoChange[];
  
  /** Section markers */
  sections?: SectionMarker[];
  
  /** Show beat subdivisions */
  showSubdivisions?: boolean;
  
  /** Subdivision level (4 = 16th notes, 2 = 8th notes) */
  subdivisions?: number;
  
  /** Current playhead position (in bars) */
  playhead?: number;
  
  /** Loop region (start and end bars) */
  loop?: { start: number; end: number };
  
  /** Callback when ruler is clicked */
  onClick?: (bar: number, beat: number) => void;
}

/**
 * Creates a beautiful timeline ruler
 */
export function createTimelineRuler(options: TimelineRulerOptions): HTMLElement {
  const {
    width,
    height = 40,
    pixelsPerBar,
    startBar = 1,
    timeSignature = { bar: 1, numerator: 4, denominator: 4 },
    timeSignatures = [],
    tempoChanges = [],
    sections = [],
    showSubdivisions = true,
    subdivisions = 4,
    playhead,
    loop,
    onClick,
  } = options;

  const container = document.createElement('div');
  container.className = 'timeline-ruler';
  container.style.cssText = `
    position: relative;
    width: ${width}px;
    height: ${height}px;
    background: var(--color-surface-elevated, #2a2a2a);
    border-bottom: 1px solid var(--color-border, #444);
    overflow: hidden;
    user-select: none;
    cursor: pointer;
  `;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = `
    display: block;
    width: 100%;
    height: 100%;
  `;
  
  // ARIA accessibility
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Timeline ruler showing bars, beats, and sections');
  canvas.setAttribute('tabindex', '0');

  const ctx = canvas.getContext('2d')!;
  
  // Enable high-DPI rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  /**
   * Gets the active time signature at a given bar
   */
  function getTimeSignatureAt(bar: number): TimeSignature {
    let active = timeSignature;
    
    for (const ts of timeSignatures) {
      if (ts.bar <= bar) {
        active = ts;
      } else {
        break;
      }
    }
    
    return active;
  }



  /**
   * Converts bar number to X coordinate
   */
  function barToX(bar: number): number {
    return (bar - startBar) * pixelsPerBar;
  }

  /**
   * Converts X coordinate to bar number and beat
   */
  function xToBarAndBeat(x: number): { bar: number; beat: number } {
    const bar = Math.floor(x / pixelsPerBar) + startBar;
    const ts = getTimeSignatureAt(bar);
    const beatFraction = (x % pixelsPerBar) / (pixelsPerBar / ts.numerator);
    const beat = Math.floor(beatFraction) + 1;
    
    return { bar, beat };
  }

  /**
   * Renders the ruler
   */
  function render(): void {
    const w = width;
    const h = height;
    
    // Clear canvas
    ctx.fillStyle = 'var(--color-surface-elevated, #2a2a2a)';
    ctx.fillRect(0, 0, w, h);
    
    // Draw loop region
    if (loop) {
      const loopStartX = barToX(loop.start);
      const loopEndX = barToX(loop.end);
      
      if (loopStartX < w && loopEndX > 0) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        ctx.fillRect(
          Math.max(0, loopStartX),
          0,
          Math.min(w, loopEndX) - Math.max(0, loopStartX),
          h
        );
      }
    }
    
    // Draw section markers
    sections.forEach(section => {
      const x = barToX(section.bar);
      
      if (x < 0 || x > w) return;
      
      // Section line
      ctx.strokeStyle = section.color || 'rgba(100, 150, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.3);
      ctx.lineTo(x, h);
      ctx.stroke();
      
      // Section label
      ctx.fillStyle = section.color || 'rgba(100, 150, 255, 0.9)';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText(section.name, x + 4, 12);
    });
    
    // Calculate visible bar range
    const startBarVisible = Math.floor(startBar);
    const endBarVisible = Math.ceil(startBar + (w / pixelsPerBar));
    
    // Draw bars and beats
    for (let bar = startBarVisible; bar <= endBarVisible; bar++) {
      const ts = getTimeSignatureAt(bar);
      const barX = barToX(bar);
      
      if (barX > w) break;
      
      // Bar line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(barX, h * 0.4);
      ctx.lineTo(barX, h);
      ctx.stroke();
      
      // Bar number
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(bar.toString(), barX + 4, h * 0.3);
      
      // Check for time signature change
      const tsChange = timeSignatures.find(ts => ts.bar === bar);
      if (tsChange) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
        ctx.font = '10px system-ui';
        ctx.fillText(
          `${tsChange.numerator}/${tsChange.denominator}`,
          barX + 4,
          h * 0.3 + 12
        );
      }
      
      // Check for tempo change
      const tempoChange = tempoChanges.find(tc => tc.bar === bar);
      if (tempoChange) {
        ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
        ctx.font = '10px system-ui';
        ctx.fillText(
          `♩=${tempoChange.bpm}`,
          barX + 4,
          h * 0.3 + 24
        );
      }
      
      // Draw beat subdivisions
      const beatWidth = pixelsPerBar / ts.numerator;
      
      for (let beat = 1; beat < ts.numerator; beat++) {
        const beatX = barX + (beat * beatWidth);
        
        if (beatX > w) break;
        
        // Beat line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(beatX, h * 0.6);
        ctx.lineTo(beatX, h);
        ctx.stroke();
        
        // Subdivisions
        if (showSubdivisions) {
          const subWidth = beatWidth / subdivisions;
          
          for (let sub = 1; sub < subdivisions; sub++) {
            const subX = beatX - (beatWidth - (sub * subWidth));
            
            if (subX < barX || subX > w) continue;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(subX, h * 0.8);
            ctx.lineTo(subX, h);
            ctx.stroke();
          }
        }
      }
    }
    
    // Draw playhead
    if (playhead !== undefined && playhead >= startBar) {
      const playheadX = barToX(playhead);
      
      if (playheadX >= 0 && playheadX <= w) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, h);
        ctx.stroke();
        
        // Playhead triangle
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.beginPath();
        ctx.moveTo(playheadX - 6, 0);
        ctx.lineTo(playheadX + 6, 0);
        ctx.lineTo(playheadX, 8);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Interaction handlers
  if (onClick) {
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const { bar, beat } = xToBarAndBeat(x);
      onClick(bar, beat);
    });
  }

  // Keyboard navigation
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && playhead !== undefined) {
      const ts = getTimeSignatureAt(Math.floor(playhead));
      const newPos = playhead - (1 / ts.numerator);
      onClick?.(Math.floor(newPos), 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && playhead !== undefined) {
      const ts = getTimeSignatureAt(Math.floor(playhead));
      const newPos = playhead + (1 / ts.numerator);
      onClick?.(Math.floor(newPos), 1);
      e.preventDefault();
    }
  });

  // Initial render
  render();

  container.appendChild(canvas);

  // Return container with update method
  (container as any).update = (newOptions: Partial<TimelineRulerOptions>) => {
    Object.assign(options, newOptions);
    render();
  };

  (container as any).destroy = () => {
    // Cleanup if needed
  };

  return container;
}
