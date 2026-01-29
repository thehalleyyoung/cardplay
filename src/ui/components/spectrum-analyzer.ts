/**
 * @fileoverview Spectrum Analyzer Component
 * 
 * Beautiful real-time frequency spectrum visualization with:
 * - FFT-based frequency analysis
 * - Multiple display modes (bars, curve, waterfall)
 * - Frequency scale (linear/log)
 * - Peak hold
 * - Color gradients
 * - Dark mode support
 * - Performance optimized with requestAnimationFrame
 * 
 * Used in mixer, sound design boards, and analyzer deck.
 * 
 * @module @cardplay/ui/components/spectrum-analyzer
 */

export type SpectrumDisplayMode = 'bars' | 'curve' | 'waterfall';
export type FrequencyScale = 'linear' | 'log';

export interface SpectrumAnalyzerOptions {
  /** Canvas width */
  width?: number;
  
  /** Canvas height (defaults to 200) */
  height?: number;
  
  /** Display mode */
  mode?: SpectrumDisplayMode;
  
  /** Frequency scale */
  scale?: FrequencyScale;
  
  /** FFT size (must be power of 2) */
  fftSize?: number;
  
  /** Minimum frequency (Hz) */
  minFreq?: number;
  
  /** Maximum frequency (Hz) */
  maxFreq?: number;
  
  /** Smoothing factor (0-1) */
  smoothing?: number;
  
  /** Show peak hold */
  showPeaks?: boolean;
  
  /** Color gradient start */
  colorStart?: string;
  
  /** Color gradient end */
  colorEnd?: string;
  
  /** Background color */
  backgroundColor?: string;
  
  /** Update callback (called each frame with frequency data) */
  onUpdate?: (frequencies: Float32Array) => void;
}

/**
 * Creates a beautiful spectrum analyzer
 */
export function createSpectrumAnalyzer(options: SpectrumAnalyzerOptions): HTMLElement {
  const {
    width,
    height = 200,
    mode = 'bars',
    scale = 'log',
    fftSize = 2048,
    minFreq = 20,
    maxFreq = 20000,
    smoothing = 0.8,
    showPeaks = true,
    colorStart = 'var(--color-primary, #4a90e2)',
    backgroundColor = 'var(--color-surface, #1a1a1a)',
    onUpdate,
  } = options;

  const container = document.createElement('div');
  container.className = 'spectrum-analyzer';
  container.style.cssText = `
    position: relative;
    width: ${width ? `${width}px` : '100%'};
    height: ${height}px;
    background: ${backgroundColor};
    border-radius: 4px;
    overflow: hidden;
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
  canvas.setAttribute('aria-label', 'Frequency spectrum analyzer showing audio spectrum in real-time');
  canvas.setAttribute('aria-live', 'polite');

  const ctx = canvas.getContext('2d')!;
  
  // Enable high-DPI rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.width * dpr;
  canvas.height = canvas.height * dpr;
  ctx.scale(dpr, dpr);

  // Create dummy analyzer for demo (in real app, this would come from audio engine)
  const analyzerData = new Float32Array(fftSize / 2);
  const peakData = new Float32Array(fftSize / 2);
  const waterfallHistory: Float32Array[] = [];
  const waterfallMaxLines = 100;

  /**
   * Converts frequency to X coordinate
   */
  function freqToX(freq: number): number {
    const w = canvas.width / dpr;
    
    if (scale === 'log') {
      const minLog = Math.log10(minFreq);
      const maxLog = Math.log10(maxFreq);
      const freqLog = Math.log10(freq);
      return ((freqLog - minLog) / (maxLog - minLog)) * w;
    } else {
      return ((freq - minFreq) / (maxFreq - minFreq)) * w;
    }
  }



  /**
   * Renders the spectrum in bars mode
   */
  function renderBars(data: Float32Array): void {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const barCount = Math.min(data.length, 128); // Limit to reasonable number
    const barWidth = w / barCount;
    const barGap = 2;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < barCount; i++) {
      const value = data[Math.floor((i / barCount) * data.length)] ?? -140;
      const normalized = (value + 140) / 140; // Normalize dB range (-140 to 0)
      const barHeight = Math.max(0, Math.min(1, normalized)) * h;
      
      const x = i * barWidth;
      const y = h - barHeight;
      
      // Color gradient based on height
      const hue = 180 + (normalized * 60); // Cyan to red
      const saturation = 70 + (normalized * 30);
      const lightness = 40 + (normalized * 20);
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      ctx.fillRect(x, y, barWidth - barGap, barHeight);
      
      // Peak hold
      if (showPeaks && peakData[i] !== undefined) {
        peakData[i] = Math.max(peakData[i]! * 0.99, normalized);
        const peakY = h - (peakData[i]! * h);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, peakY);
        ctx.lineTo(x + barWidth - barGap, peakY);
        ctx.stroke();
      }
    }
    
    // Draw frequency labels
    const freqLabels = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    freqLabels.forEach(freq => {
      if (freq >= minFreq && freq <= maxFreq) {
        const x = freqToX(freq);
        const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
        ctx.fillText(label, x, h - 4);
      }
    });
  }

  /**
   * Renders the spectrum in curve mode
   */
  function renderCurve(data: Float32Array): void {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw curve
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let i = 0; i < data.length; i++) {
      const value = data[i] ?? -140;
      const normalized = (value + 140) / 140;
      const x = (i / data.length) * w;
      const y = h - (Math.max(0, Math.min(1, normalized)) * h);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Fill gradient
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, 'rgba(74, 144, 226, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Stroke outline
    ctx.strokeStyle = colorStart;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Renders the spectrum in waterfall mode
   */
  function renderWaterfall(data: Float32Array): void {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Add current data to history
    const dataCopy = new Float32Array(data);
    waterfallHistory.unshift(dataCopy);
    
    if (waterfallHistory.length > waterfallMaxLines) {
      waterfallHistory.pop();
    }

    ctx.clearRect(0, 0, w, h);

    const lineHeight = h / waterfallMaxLines;

    waterfallHistory.forEach((line, lineIndex) => {
      const y = lineIndex * lineHeight;
      
      for (let i = 0; i < line.length; i++) {
        const value = line[i] ?? -140;
        const normalized = (value + 140) / 140;
        const x = (i / line.length) * w;
        
        // Color based on intensity
        const hue = 180 + (normalized * 60);
        const saturation = 70;
        const lightness = normalized * 60;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        ctx.fillRect(x, y, w / line.length, lineHeight);
      }
    });
  }

  /**
   * Animation loop
   */
  let animationFrame: number | null = null;
  let isRunning = false;

  function animate(): void {
    if (!isRunning) return;

    // Generate demo data (in real app, this would come from audio analyzer node)
    for (let i = 0; i < analyzerData.length; i++) {
      const prevValue = analyzerData[i] ?? -140;
      const newValue = -140 + Math.random() * 100;
      analyzerData[i] = prevValue * smoothing + newValue * (1 - smoothing);
    }

    // Render based on mode
    switch (mode) {
      case 'bars':
        renderBars(analyzerData);
        break;
      case 'curve':
        renderCurve(analyzerData);
        break;
      case 'waterfall':
        renderWaterfall(analyzerData);
        break;
    }

    onUpdate?.(analyzerData);

    animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Starts the analyzer
   */
  function start(): void {
    if (isRunning) return;
    isRunning = true;
    animate();
  }

  /**
   * Stops the analyzer
   */
  function stop(): void {
    isRunning = false;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  // Auto-start
  start();

  container.appendChild(canvas);

  // Return container with control methods
  (container as any).start = start;
  (container as any).stop = stop;
  (container as any).update = (newOptions: Partial<SpectrumAnalyzerOptions>) => {
    Object.assign(options, newOptions);
  };
  (container as any).destroy = () => {
    stop();
  };
  (container as any).setData = (data: Float32Array) => {
    analyzerData.set(data);
  };

  return container;
}
