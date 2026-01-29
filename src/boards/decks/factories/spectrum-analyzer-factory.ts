/**
 * @fileoverview Spectrum Analyzer Deck Factory (M179)
 *
 * Creates spectrum analyzer decks for real-time frequency visualization.
 * Provides FFT display, peak detection, and spectrum comparison.
 *
 * @module @cardplay/boards/decks/factories/spectrum-analyzer-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Frequency band configuration */
export interface FrequencyBand {
  id: string;
  name: string;
  minHz: number;
  maxHz: number;
  color: string;
}

/** Spectrum data point */
export interface SpectrumPoint {
  frequency: number;
  magnitude: number;
  phase?: number;
}

/** Detected peak */
export interface Peak {
  frequency: number;
  magnitude: number;
  note?: string;
}

/** Analyzer configuration */
export interface AnalyzerConfig {
  fftSize: 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  scale: 'linear' | 'logarithmic';
  peakHold: boolean;
}

/** Display mode */
export type AnalyzerDisplayMode = 'spectrum' | 'spectrogram' | 'bars' | 'octave';

// --------------------------------------------------------------------------
// Default bands
// --------------------------------------------------------------------------

export const STANDARD_FREQUENCY_BANDS: FrequencyBand[] = [
  { id: 'sub', name: 'Sub', minHz: 20, maxHz: 60, color: '#ff4444' },
  { id: 'bass', name: 'Bass', minHz: 60, maxHz: 250, color: '#ff8844' },
  { id: 'low-mid', name: 'Low Mid', minHz: 250, maxHz: 500, color: '#ffcc44' },
  { id: 'mid', name: 'Mid', minHz: 500, maxHz: 2000, color: '#44ff44' },
  { id: 'high-mid', name: 'High Mid', minHz: 2000, maxHz: 6000, color: '#44ccff' },
  { id: 'high', name: 'High', minHz: 6000, maxHz: 12000, color: '#8844ff' },
  { id: 'air', name: 'Air', minHz: 12000, maxHz: 20000, color: '#ff44ff' },
];

// --------------------------------------------------------------------------
// Utility functions
// --------------------------------------------------------------------------

/**
 * Find the closest musical note to a frequency
 */
export function frequencyToNote(frequency: number): string | undefined {
  const A4 = 440;
  const semitones = 12 * Math.log2(frequency / A4);
  const noteIndex = Math.round(semitones);
  const octave = Math.floor((noteIndex + 9) / 12) + 4;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteName = noteNames[((noteIndex % 12) + 12) % 12];
  
  if (octave < 0 || octave > 10) return undefined;
  return `${noteName}${octave}`;
}

/**
 * Detect peaks in spectrum data
 */
export function detectPeaks(
  data: SpectrumPoint[],
  threshold: number = -60
): Peak[] {
  const peaks: Peak[] = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const next = data[i + 1];
    
    if (!prev || !curr || !next) continue;
    
    if (curr.magnitude > prev.magnitude && curr.magnitude > next.magnitude && curr.magnitude > threshold) {
      const note = frequencyToNote(curr.frequency);
      peaks.push({
        frequency: curr.frequency,
        magnitude: curr.magnitude,
        ...(note ? { note } : {}),
      });
    }
  }
  
  peaks.sort((a, b) => b.magnitude - a.magnitude);
  return peaks.slice(0, 10);
}

// --------------------------------------------------------------------------
// Spectrum Analyzer Store
// --------------------------------------------------------------------------

export class SpectrumAnalyzerStore {
  private config: AnalyzerConfig;
  private displayMode: AnalyzerDisplayMode = 'spectrum';
  private bands: FrequencyBand[] = STANDARD_FREQUENCY_BANDS;
  private peakHoldData = new Map<number, number>();
  private spectrogramHistory: SpectrumPoint[][] = [];
  
  constructor(config?: Partial<AnalyzerConfig>) {
    this.config = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: 0,
      scale: 'logarithmic',
      peakHold: true,
      ...config,
    };
  }
  
  getConfig(): AnalyzerConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<AnalyzerConfig>): void {
    Object.assign(this.config, updates);
  }
  
  getDisplayMode(): AnalyzerDisplayMode {
    return this.displayMode;
  }
  
  setDisplayMode(mode: AnalyzerDisplayMode): void {
    this.displayMode = mode;
  }
  
  getBands(): FrequencyBand[] {
    return [...this.bands];
  }
  
  processData(data: SpectrumPoint[]): Peak[] {
    if (this.displayMode === 'spectrogram') {
      this.spectrogramHistory.push(data);
      if (this.spectrogramHistory.length > 100) {
        this.spectrogramHistory.shift();
      }
    }
    return detectPeaks(data, this.config.minDecibels + 40);
  }
  
  clearPeakHold(): void {
    this.peakHoldData.clear();
  }
  
  clear(): void {
    this.peakHoldData.clear();
    this.spectrogramHistory = [];
  }
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

/**
 * Factory for creating spectrum analyzer deck instances.
 */
export const spectrumAnalyzerDeckFactory: DeckFactory = {
  deckType: 'spectrum-analyzer-deck',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'spectrum-analyzer-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'spectrum-analyzer-deck');
    
    const header = document.createElement('div');
    header.className = 'spectrum-analyzer-deck-header';
    header.textContent = 'Spectrum Analyzer';
    container.appendChild(header);
    
    // Mode selector
    const modeSelector = document.createElement('select');
    modeSelector.className = 'analyzer-mode-selector';
    ['spectrum', 'spectrogram', 'bars', 'octave'].forEach(mode => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
      modeSelector.appendChild(option);
    });
    container.appendChild(modeSelector);
    
    // Spectrum display canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'spectrum-canvas';
    canvas.width = 400;
    canvas.height = 200;
    container.appendChild(canvas);
    
    // Band meters
    const bandMeters = document.createElement('div');
    bandMeters.className = 'band-meters';
    STANDARD_FREQUENCY_BANDS.forEach(band => {
      const meter = document.createElement('div');
      meter.className = 'band-meter';
      meter.setAttribute('data-band', band.id);
      meter.style.backgroundColor = band.color;
      
      const label = document.createElement('span');
      label.textContent = band.name;
      meter.appendChild(label);
      
      bandMeters.appendChild(meter);
    });
    container.appendChild(bandMeters);
    
    // Peak list
    const peakList = document.createElement('div');
    peakList.className = 'peak-list';
    peakList.innerHTML = '<h4>Detected Peaks</h4><ul></ul>';
    container.appendChild(peakList);
    
    // Controls
    const controls = document.createElement('div');
    controls.className = 'analyzer-controls';
    
    const clearPeakBtn = document.createElement('button');
    clearPeakBtn.textContent = 'Clear Peak Hold';
    clearPeakBtn.className = 'analyzer-btn';
    controls.appendChild(clearPeakBtn);
    
    container.appendChild(controls);
    
    // Store
    const store = new SpectrumAnalyzerStore();
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Spectrum Analyzer',
      render: () => container,
      destroy: () => {
        store.clear();
        container.remove();
      },
    };
  },
};

// Singleton store
export const spectrumAnalyzerStore = new SpectrumAnalyzerStore();
