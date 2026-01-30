/**
 * Stereo Imaging Visualizer
 * 
 * Displays stereo field visualization showing:
 * - Left/right channel balance
 * - Stereo width meter
 * - Phase correlation meter
 * - Goniometer (vectorscope) display
 * 
 * Provides real-time visual feedback for stereo imaging decisions
 * in mixing and mastering workflows.
 */

export interface StereoImagingVisualizerConfig {
  /** Width of visualization canvas */
  width?: number;
  /** Height of visualization canvas */
  height?: number;
  /** Update rate in Hz (default: 30) */
  updateRate?: number;
  /** Enable goniometer display */
  showGoniometer?: boolean;
  /** Enable correlation meter */
  showCorrelation?: boolean;
  /** Enable width meter */
  showWidth?: boolean;
  /** Color scheme */
  theme?: 'dark' | 'light';
}

export interface StereoMeteringData {
  /** Left channel RMS level (0-1) */
  leftLevel: number;
  /** Right channel RMS level (0-1) */
  rightLevel: number;
  /** Stereo width (0=mono, 1=normal, >1=wide) */
  stereoWidth: number;
  /** Phase correlation (-1=out of phase, 0=uncorrelated, 1=in phase) */
  phaseCorrelation: number;
  /** Goniometer samples for vectorscope (left/right pairs) */
  goniometerSamples?: Array<[number, number]>;
}

export class StereoImagingVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<StereoImagingVisualizerConfig>;
  private animationFrameId: number | null = null;
  private lastUpdateTime = 0;
  private meteringData: StereoMeteringData = {
    leftLevel: 0,
    rightLevel: 0,
    stereoWidth: 1,
    phaseCorrelation: 0,
    goniometerSamples: []
  };

  constructor(
    container: HTMLElement,
    config: StereoImagingVisualizerConfig = {}
  ) {
    this.config = {
      width: config.width ?? 400,
      height: config.height ?? 300,
      updateRate: config.updateRate ?? 30,
      showGoniometer: config.showGoniometer ?? true,
      showCorrelation: config.showCorrelation ?? true,
      showWidth: config.showWidth ?? true,
      theme: config.theme ?? 'dark'
    };

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.cssText = `
      display: block;
      border-radius: 4px;
      background: ${this.config.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    `;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = ctx;

    container.appendChild(this.canvas);
    this.draw();
  }

  /**
   * Update metering data from audio analysis
   */
  updateData(data: Partial<StereoMeteringData>): void {
    this.meteringData = {
      ...this.meteringData,
      ...data
    };
  }

  /**
   * Start animation loop
   */
  start(): void {
    if (this.animationFrameId !== null) return;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - this.lastUpdateTime;
      const frameTime = 1000 / this.config.updateRate;

      if (elapsed >= frameTime) {
        this.draw();
        this.lastUpdateTime = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Draw visualization
   */
  private draw(): void {
    const { width, height } = this.config;
    const isDark = this.config.theme === 'dark';

    // Clear canvas
    this.ctx.fillStyle = isDark ? '#1a1a1a' : '#ffffff';
    this.ctx.fillRect(0, 0, width, height);

    const sections = [
      this.config.showGoniometer,
      this.config.showCorrelation,
      this.config.showWidth
    ].filter(Boolean).length;

    let yOffset = 0;
    const sectionHeight = height / sections;

    // Draw goniometer (vectorscope)
    if (this.config.showGoniometer) {
      this.drawGoniometer(0, yOffset, width, sectionHeight);
      yOffset += sectionHeight;
    }

    // Draw correlation meter
    if (this.config.showCorrelation) {
      this.drawCorrelationMeter(0, yOffset, width, sectionHeight * 0.4);
      yOffset += sectionHeight * 0.4;
    }

    // Draw width meter
    if (this.config.showWidth) {
      this.drawWidthMeter(0, yOffset, width, sectionHeight * 0.4);
    }
  }

  /**
   * Draw goniometer (vectorscope) display
   */
  private drawGoniometer(x: number, y: number, w: number, h: number): void {
    const isDark = this.config.theme === 'dark';
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const radius = Math.min(w, h) * 0.4;

    this.ctx.save();

    // Draw grid
    this.ctx.strokeStyle = isDark ? '#333333' : '#cccccc';
    this.ctx.lineWidth = 1;

    // Circular grid
    for (let r = radius / 3; r <= radius; r += radius / 3) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Cross-hairs
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius, centerY);
    this.ctx.lineTo(centerX + radius, centerY);
    this.ctx.moveTo(centerX, centerY - radius);
    this.ctx.lineTo(centerX, centerY + radius);
    this.ctx.stroke();

    // Draw diagonal reference lines (L=R and L=-R)
    this.ctx.strokeStyle = isDark ? '#444444' : '#bbbbbb';
    this.ctx.setLineDash([2, 2]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
    this.ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.7);
    this.ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.7);
    this.ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.7);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw samples
    if (this.meteringData.goniometerSamples && this.meteringData.goniometerSamples.length > 0) {
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 0.7;

      this.ctx.beginPath();
      for (let i = 0; i < this.meteringData.goniometerSamples.length; i++) {
        const sample = this.meteringData.goniometerSamples[i];
        if (!sample) continue;
        const [left, right] = sample;
        const px = centerX + (left + right) * 0.5 * radius;
        const py = centerY + (left - right) * 0.5 * radius;

        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }

    // Label
    this.ctx.fillStyle = isDark ? '#999999' : '#666666';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Goniometer', x + 8, y + 16);

    this.ctx.restore();
  }

  /**
   * Draw phase correlation meter
   */
  private drawCorrelationMeter(x: number, y: number, w: number, h: number): void {
    const isDark = this.config.theme === 'dark';
    const padding = 40;
    const meterWidth = w - padding * 2;
    const meterHeight = 20;
    const meterY = y + h / 2 - meterHeight / 2;

    this.ctx.save();

    // Label
    this.ctx.fillStyle = isDark ? '#999999' : '#666666';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Phase Correlation', x + 8, y + 16);

    // Background
    this.ctx.fillStyle = isDark ? '#2a2a2a' : '#eeeeee';
    this.ctx.fillRect(x + padding, meterY, meterWidth, meterHeight);

    // Draw meter with color gradient
    const correlation = this.meteringData.phaseCorrelation;
    const normalizedPos = (correlation + 1) / 2; // Map -1..1 to 0..1
    const meterPos = x + padding + normalizedPos * meterWidth;

    // Color based on correlation value
    let meterColor: string;
    if (correlation < -0.5) {
      meterColor = '#ff3333'; // Red for out of phase
    } else if (correlation < 0) {
      meterColor = '#ff9933'; // Orange for weak correlation
    } else if (correlation < 0.7) {
      meterColor = '#ffff33'; // Yellow for moderate correlation
    } else {
      meterColor = '#33ff33'; // Green for strong correlation
    }

    // Draw indicator
    this.ctx.fillStyle = meterColor;
    this.ctx.fillRect(meterPos - 3, meterY - 5, 6, meterHeight + 10);

    // Center mark
    const centerX = x + padding + meterWidth / 2;
    this.ctx.strokeStyle = isDark ? '#666666' : '#999999';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, meterY);
    this.ctx.lineTo(centerX, meterY + meterHeight);
    this.ctx.stroke();

    // Value text
    this.ctx.fillStyle = isDark ? '#cccccc' : '#333333';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(correlation.toFixed(2), x + w - 8, y + 16);

    this.ctx.restore();
  }

  /**
   * Draw stereo width meter
   */
  private drawWidthMeter(x: number, y: number, w: number, h: number): void {
    const isDark = this.config.theme === 'dark';
    const padding = 40;
    const meterWidth = w - padding * 2;
    const meterHeight = 20;
    const meterY = y + h / 2 - meterHeight / 2;

    this.ctx.save();

    // Label
    this.ctx.fillStyle = isDark ? '#999999' : '#666666';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Stereo Width', x + 8, y + 16);

    // Background
    this.ctx.fillStyle = isDark ? '#2a2a2a' : '#eeeeee';
    this.ctx.fillRect(x + padding, meterY, meterWidth, meterHeight);

    // Draw meter
    const width = Math.min(this.meteringData.stereoWidth, 2); // Cap at 2 for display
    const normalizedWidth = width / 2; // Map 0..2 to 0..1
    const meterFillWidth = normalizedWidth * meterWidth;

    // Color based on width value
    let meterColor: string;
    if (width < 0.5) {
      meterColor = '#ff9933'; // Orange for narrow
    } else if (width < 0.9) {
      meterColor = '#ffff33'; // Yellow for moderate
    } else if (width < 1.1) {
      meterColor = '#33ff33'; // Green for normal
    } else if (width < 1.5) {
      meterColor = '#3399ff'; // Blue for wide
    } else {
      meterColor = '#ff33ff'; // Magenta for very wide
    }

    this.ctx.fillStyle = meterColor;
    this.ctx.fillRect(x + padding, meterY, meterFillWidth, meterHeight);

    // Mono/Normal/Wide markers
    const monoX = x + padding;
    const normalX = x + padding + meterWidth / 2;
    const wideX = x + padding + meterWidth;

    this.ctx.strokeStyle = isDark ? '#666666' : '#999999';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    [monoX, normalX, wideX].forEach((mx) => {
      this.ctx.beginPath();
      this.ctx.moveTo(mx, meterY);
      this.ctx.lineTo(mx, meterY + meterHeight);
      this.ctx.stroke();
    });
    this.ctx.setLineDash([]);

    // Value text
    this.ctx.fillStyle = isDark ? '#cccccc' : '#333333';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${width.toFixed(2)}x`, x + w - 8, y + 16);

    this.ctx.restore();
  }

  /**
   * Cleanup and remove from DOM
   */
  destroy(): void {
    this.stop();
    this.canvas.remove();
  }
}

/**
 * Create stereo imaging visualizer component
 */
export function createStereoImagingVisualizer(
  config?: StereoImagingVisualizerConfig
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'stereo-imaging-visualizer';
  container.style.cssText = `
    padding: 16px;
    background: var(--panel-background, #1a1a1a);
    border-radius: 8px;
  `;

  const visualizer = new StereoImagingVisualizer(container, config);
  visualizer.start();

  // Store instance for external access
  (container as any).__visualizer = visualizer;

  return container;
}

/**
 * Update visualizer with new audio data
 */
export function updateStereoImagingVisualizer(
  element: HTMLElement,
  data: Partial<StereoMeteringData>
): void {
  const visualizer = (element as any).__visualizer as StereoImagingVisualizer | undefined;
  if (visualizer) {
    visualizer.updateData(data);
  }
}

/**
 * Destroy visualizer and clean up
 */
export function destroyStereoImagingVisualizer(element: HTMLElement): void {
  const visualizer = (element as any).__visualizer as StereoImagingVisualizer | undefined;
  if (visualizer) {
    visualizer.destroy();
    delete (element as any).__visualizer;
  }
}
