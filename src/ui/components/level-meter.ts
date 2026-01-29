/**
 * @fileoverview Level Meter Component
 * 
 * Beautiful audio level meter with:
 * - Peak and RMS display
 * - Color-coded zones (green, yellow, red)
 * - Peak hold indicators
 * - Clip indicators
 * - Horizontal or vertical orientation
 * - Smooth ballistics
 * - Dark mode support
 * 
 * Used in mixer strips, master output, and monitoring panels.
 * 
 * @module @cardplay/ui/components/level-meter
 */

export type MeterOrientation = 'vertical' | 'horizontal';

export interface LevelMeterOptions {
  /** Width in pixels */
  width?: number;
  
  /** Height in pixels */
  height?: number;
  
  /** Orientation */
  orientation?: MeterOrientation;
  
  /** Minimum level in dB */
  minDb?: number;
  
  /** Maximum level in dB */
  maxDb?: number;
  
  /** Show peak hold */
  showPeakHold?: boolean;
  
  /** Peak hold time in ms */
  peakHoldTime?: number;
  
  /** Show clip indicator */
  showClipIndicator?: boolean;
  
  /** Clip threshold in dB */
  clipThreshold?: number;
  
  /** Show RMS level */
  showRMS?: boolean;
  
  /** Show scale markings */
  showScale?: boolean;
}

/**
 * Color zones for meter (dB thresholds and colors)
 */
const METER_ZONES = [
  { threshold: -Infinity, color: '#4a9d4a' },  // Green (< -18dB)
  { threshold: -18, color: '#9d9d4a' },        // Yellow (-18 to -6dB)
  { threshold: -6, color: '#e2994a' },         // Orange (-6 to -3dB)
  { threshold: -3, color: '#e24a4a' },         // Red (-3 to 0dB)
];

/**
 * Scale markings (dB values to show)
 */
const SCALE_MARKS = [-60, -48, -36, -24, -18, -12, -6, -3, 0];

/**
 * Creates a beautiful level meter
 */
export function createLevelMeter(options: LevelMeterOptions): HTMLElement {
  const {
    width = 20,
    height = 200,
    orientation = 'vertical',
    minDb = -60,
    maxDb = 0,
    showPeakHold = true,
    peakHoldTime = 2000,
    showClipIndicator = true,
    clipThreshold = -0.5,
    showRMS = true,
    showScale = true,
  } = options;

  const container = document.createElement('div');
  container.className = 'level-meter';
  container.style.cssText = `
    position: relative;
    width: ${width}px;
    height: ${height}px;
    background: var(--color-surface, #1a1a1a);
    border-radius: 2px;
    overflow: hidden;
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
  canvas.setAttribute('role', 'meter');
  canvas.setAttribute('aria-label', 'Audio level meter');
  canvas.setAttribute('aria-valuemin', minDb.toString());
  canvas.setAttribute('aria-valuemax', maxDb.toString());
  canvas.setAttribute('aria-live', 'polite');

  const ctx = canvas.getContext('2d')!;
  
  // Enable high-DPI rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Meter state
  let currentPeakDb = minDb;
  let currentRmsDb = minDb;
  let peakHoldDb = minDb;
  let peakHoldTime_ms = 0;
  let isClipping = false;
  let clipTime = 0;

  /**
   * Converts dB value to position (0-1)
   */
  function dbToPosition(db: number): number {
    return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
  }

  /**
   * Gets color for a given dB value
   */
  function getColorForDb(db: number): string {
    for (let i = METER_ZONES.length - 1; i >= 0; i--) {
      const zone = METER_ZONES[i];
      if (zone && db >= zone.threshold) {
        return zone.color;
      }
    }
    const firstZone = METER_ZONES[0];
    return firstZone ? firstZone.color : '#4a9d4a';
  }

  /**
   * Renders the meter
   */
  function render(): void {
    const w = width;
    const h = height;

    // Clear canvas
    ctx.fillStyle = 'var(--color-surface, #1a1a1a)';
    ctx.fillRect(0, 0, w, h);

    if (orientation === 'vertical') {
      renderVertical(w, h);
    } else {
      renderHorizontal(w, h);
    }
  }

  /**
   * Renders vertical meter
   */
  function renderVertical(w: number, h: number): void {
    const meterWidth = showScale ? w * 0.7 : w;

    // Draw color zones as background
    METER_ZONES.forEach((zone, index) => {
      const nextZone = METER_ZONES[index + 1];
      const startPos = dbToPosition(zone.threshold);
      const endPos = nextZone ? dbToPosition(nextZone.threshold) : 1;
      
      const y1 = h - (endPos * h);
      const zoneHeight = (endPos - startPos) * h;
      
      ctx.fillStyle = zone.color + '33'; // 20% opacity
      ctx.fillRect(0, y1, meterWidth, zoneHeight);
    });

    // Draw RMS level (wider bar, semi-transparent)
    if (showRMS) {
      const rmsPos = dbToPosition(currentRmsDb);
      const rmsHeight = rmsPos * h;
      const rmsY = h - rmsHeight;
      
      ctx.fillStyle = getColorForDb(currentRmsDb) + '66'; // 40% opacity
      ctx.fillRect(0, rmsY, meterWidth, rmsHeight);
    }

    // Draw peak level (main bar)
    const peakPos = dbToPosition(currentPeakDb);
    const peakHeight = peakPos * h;
    const peakY = h - peakHeight;
    
    // Gradient from bottom to top
    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    
    METER_ZONES.forEach(zone => {
      const pos = dbToPosition(zone.threshold);
      gradient.addColorStop(pos, zone.color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, peakY, meterWidth * 0.6, peakHeight);

    // Draw peak hold
    if (showPeakHold && peakHoldDb > minDb) {
      const holdPos = dbToPosition(peakHoldDb);
      const holdY = h - (holdPos * h);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, holdY - 1, meterWidth, 2);
    }

    // Draw clip indicator
    if (showClipIndicator) {
      const clipHeight = 8;
      ctx.fillStyle = isClipping ? '#ff0000' : '#333333';
      ctx.fillRect(0, 0, meterWidth, clipHeight);
      
      if (isClipping) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('CLIP', meterWidth / 2, 6);
      }
    }

    // Draw scale markings
    if (showScale) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      
      SCALE_MARKS.forEach(db => {
        if (db >= minDb && db <= maxDb) {
          const pos = dbToPosition(db);
          const y = h - (pos * h);
          
          // Tick mark
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(meterWidth, y);
          ctx.lineTo(meterWidth + 3, y);
          ctx.stroke();
          
          // Label
          ctx.fillText(db.toString(), meterWidth + 5, y + 3);
        }
      });
    }
  }

  /**
   * Renders horizontal meter
   */
  function renderHorizontal(w: number, h: number): void {
    const meterHeight = showScale ? h * 0.7 : h;

    // Draw color zones as background
    METER_ZONES.forEach((zone, index) => {
      const nextZone = METER_ZONES[index + 1];
      const startPos = dbToPosition(zone.threshold);
      const endPos = nextZone ? dbToPosition(nextZone.threshold) : 1;
      
      const x1 = startPos * w;
      const zoneWidth = (endPos - startPos) * w;
      
      ctx.fillStyle = zone.color + '33';
      ctx.fillRect(x1, 0, zoneWidth, meterHeight);
    });

    // Draw RMS level
    if (showRMS) {
      const rmsPos = dbToPosition(currentRmsDb);
      const rmsWidth = rmsPos * w;
      
      ctx.fillStyle = getColorForDb(currentRmsDb) + '66';
      ctx.fillRect(0, 0, rmsWidth, meterHeight);
    }

    // Draw peak level
    const peakPos = dbToPosition(currentPeakDb);
    const peakWidth = peakPos * w;
    
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    METER_ZONES.forEach(zone => {
      const pos = dbToPosition(zone.threshold);
      gradient.addColorStop(pos, zone.color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, peakWidth, meterHeight * 0.6);

    // Draw peak hold
    if (showPeakHold && peakHoldDb > minDb) {
      const holdPos = dbToPosition(peakHoldDb);
      const holdX = holdPos * w;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(holdX - 1, 0, 2, meterHeight);
    }

    // Draw clip indicator at the right
    if (showClipIndicator) {
      const clipWidth = 12;
      ctx.fillStyle = isClipping ? '#ff0000' : '#333333';
      ctx.fillRect(w - clipWidth, 0, clipWidth, meterHeight);
    }
  }

  /**
   * Updates meter with new level values
   */
  function update(peakDb: number, rmsDb?: number): void {
    const now = Date.now();

    // Update peak
    currentPeakDb = peakDb;
    
    // Update RMS if provided
    if (rmsDb !== undefined) {
      currentRmsDb = rmsDb;
    }

    // Update peak hold
    if (peakDb > peakHoldDb || now - peakHoldTime_ms > peakHoldTime) {
      peakHoldDb = peakDb;
      peakHoldTime_ms = now;
    }

    // Update clip indicator
    if (peakDb >= clipThreshold) {
      isClipping = true;
      clipTime = now;
    } else if (now - clipTime > 1000) {
      isClipping = false;
    }

    // Update ARIA
    canvas.setAttribute('aria-valuenow', peakDb.toFixed(1));
    canvas.setAttribute('aria-valuetext', `${peakDb.toFixed(1)} dB`);

    render();
  }

  /**
   * Resets the meter
   */
  function reset(): void {
    currentPeakDb = minDb;
    currentRmsDb = minDb;
    peakHoldDb = minDb;
    isClipping = false;
    render();
  }

  // Initial render
  render();

  container.appendChild(canvas);

  // Return container with control methods
  (container as any).update = update;
  (container as any).reset = reset;
  (container as any).destroy = () => {
    // Cleanup if needed
  };

  return container;
}

/**
 * Creates a stereo meter (left + right channels)
 */
export function createStereoMeter(options: LevelMeterOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'stereo-meter';
  
  const orientation = options.orientation || 'vertical';
  const isVertical = orientation === 'vertical';
  
  container.style.cssText = `
    display: flex;
    flex-direction: ${isVertical ? 'row' : 'column'};
    gap: 4px;
  `;

  const leftMeter = createLevelMeter({
    ...options,
    width: isVertical ? (options.width || 20) : (options.width || 200),
    height: isVertical ? (options.height || 200) : (options.height || 20),
  });

  const rightMeter = createLevelMeter({
    ...options,
    width: isVertical ? (options.width || 20) : (options.width || 200),
    height: isVertical ? (options.height || 200) : (options.height || 20),
    showScale: false, // Only show scale on left meter
  });

  leftMeter.setAttribute('aria-label', 'Left channel level meter');
  rightMeter.setAttribute('aria-label', 'Right channel level meter');

  container.appendChild(leftMeter);
  container.appendChild(rightMeter);

  // Return container with control methods
  (container as any).update = (leftPeakDb: number, rightPeakDb: number, leftRmsDb?: number, rightRmsDb?: number) => {
    (leftMeter as any).update(leftPeakDb, leftRmsDb);
    (rightMeter as any).update(rightPeakDb, rightRmsDb);
  };

  (container as any).reset = () => {
    (leftMeter as any).reset();
    (rightMeter as any).reset();
  };

  (container as any).destroy = () => {
    (leftMeter as any).destroy();
    (rightMeter as any).destroy();
  };

  return container;
}
