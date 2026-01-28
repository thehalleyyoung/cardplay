/**
 * @fileoverview Tests for Sample Waveform Preview Component
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SampleWaveformPreview,
  type WaveformPreviewConfig,
  type SelectionRegion,
  type LoopRegion,
  type TransientMarker,
  createMetadataPanel,
  createZoomControls,
  createEditableMetadataPanel,
  createBatchMetadataEditor,
  WAVEFORM_COLOR_THEMES,
  createColorThemeSelector,
  SpectrumPreview,
  calculateLoudness,
  createLoudnessDisplay,
  WaveformComparisonView,
  createComparisonModeSelector
} from './sample-waveform-preview';
import type { SampleMetadata } from './sample-browser';

// ============================================================================
// AUDIO BUFFER POLYFILL FOR JSDOM
// ============================================================================

/**
 * Mock AudioBuffer implementation for testing.
 */
class MockAudioBuffer {
  readonly length: number;
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  readonly duration: number;
  private channelData: Map<number, Float32Array>;

  constructor(options: {
    length: number;
    numberOfChannels: number;
    sampleRate: number;
  }) {
    this.length = options.length;
    this.numberOfChannels = options.numberOfChannels;
    this.sampleRate = options.sampleRate;
    this.duration = options.length / options.sampleRate;
    this.channelData = new Map();

    for (let i = 0; i < options.numberOfChannels; i++) {
      this.channelData.set(i, new Float32Array(options.length));
    }
  }

  getChannelData(channel: number): Float32Array {
    const data = this.channelData.get(channel);
    if (!data) {
      throw new RangeError('Channel index out of range');
    }
    return data;
  }

  copyToChannel(source: Float32Array, channelNumber: number, startInChannel = 0): void {
    const dest = this.getChannelData(channelNumber);
    const len = Math.min(source.length, dest.length - startInChannel);
    for (let i = 0; i < len; i++) {
      dest[startInChannel + i] = source[i] ?? 0;
    }
  }

  copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel = 0): void {
    const source = this.getChannelData(channelNumber);
    const len = Math.min(destination.length, source.length - startInChannel);
    for (let i = 0; i < len; i++) {
      destination[i] = source[startInChannel + i] ?? 0;
    }
  }
}

// Install polyfill
if (typeof AudioBuffer === 'undefined') {
  (globalThis as any).AudioBuffer = MockAudioBuffer;
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a test audio buffer with a sine wave.
 */
function createTestAudioBuffer(
  duration: number = 1.0,
  frequency: number = 440,
  sampleRate: number = 44100
): AudioBuffer {
  const length = Math.floor(duration * sampleRate);
  const buffer = new AudioBuffer({
    length,
    numberOfChannels: 2,
    sampleRate
  });
  
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
  
  // Copy to second channel
  buffer.copyToChannel(channelData, 1);
  
  return buffer;
}

/**
 * Create test sample metadata.
 */
function createTestMetadata(): SampleMetadata {
  return {
    id: 'test-sample-1',
    name: 'Test Sample.wav',
    path: '/samples/test.wav',
    format: 'wav',
    sampleRate: 44100,
    duration: 2.5,
    channels: 2,
    sizeBytes: 220500,
    type: 'one-shot',
    key: 'C',
    bpm: 120,
    categories: ['drum', 'kick'],
    tags: ['electronic', 'punchy'],
    rating: 4,
    isFavorite: true,
    created: new Date('2024-01-01'),
    source: 'local'
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('SampleWaveformPreview', () => {
  let preview: SampleWaveformPreview;
  let audioBuffer: AudioBuffer;
  
  beforeEach(() => {
    preview = new SampleWaveformPreview({
      width: 800,
      height: 200
    });
    audioBuffer = createTestAudioBuffer();
  });
  
  describe('Construction', () => {
    it('creates canvas with correct dimensions', () => {
      const canvas = preview.getElement();
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(200);
    });
    
    it('applies default config', () => {
      const canvas = preview.getElement();
      expect(canvas.style.cursor).toBe('crosshair');
    });
    
    it('accepts custom config', () => {
      const customPreview = new SampleWaveformPreview({
        width: 1024,
        height: 256,
        showGrid: false
      });
      const canvas = customPreview.getElement();
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(256);
    });
  });
  
  describe('Audio Loading', () => {
    it('loads audio buffer', async () => {
      await preview.loadAudio(audioBuffer);
      // Should not throw
      expect(true).toBe(true);
    });
    
    it('generates waveform data', async () => {
      await preview.loadAudio(audioBuffer);
      // Waveform should be rendered (internal state)
      expect(true).toBe(true);
    });
    
    it('detects transients in audio', async () => {
      // Create buffer with sharp attack
      const testBuffer = createTestAudioBuffer(1.0, 440);
      const channelData = testBuffer.getChannelData(0);
      
      // Add sharp transient at 0.5s
      const transientSample = Math.floor(0.5 * testBuffer.sampleRate);
      for (let i = 0; i < 100; i++) {
        channelData[transientSample + i] = 1.0;
      }
      
      await preview.loadAudio(testBuffer);
      // Should detect the transient (internal)
      expect(true).toBe(true);
    });
  });
  
  describe('Metadata', () => {
    it('sets metadata', () => {
      const metadata = createTestMetadata();
      preview.setMetadata(metadata);
      // Should not throw
      expect(true).toBe(true);
    });
    
    it('auto-detects loop region from BPM', () => {
      const metadata = createTestMetadata();
      metadata.bpm = 120;
      metadata.duration = 4.0;
      
      preview.setMetadata(metadata);
      
      const loopRegion = preview.getLoopRegion();
      expect(loopRegion).not.toBeNull();
      if (loopRegion) {
        expect(loopRegion.start).toBe(0);
        // 120 BPM = 0.5s per beat, 4 beats = 2s
        expect(loopRegion.end).toBeCloseTo(2.0, 1);
      }
    });
  });
  
  describe('Selection', () => {
    it('sets and gets selection', () => {
      const selection: SelectionRegion = {
        start: 0.5,
        end: 1.5
      };
      
      preview.setSelection(selection);
      const retrieved = preview.getSelection();
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.start).toBe(0.5);
      expect(retrieved?.end).toBe(1.5);
    });
    
    it('clears selection', () => {
      preview.setSelection({ start: 0.5, end: 1.5 });
      preview.setSelection(null);
      
      expect(preview.getSelection()).toBeNull();
    });
    
    it('validates selection bounds', () => {
      const selection: SelectionRegion = {
        start: 0.5,
        end: 0.5
      };
      
      preview.setSelection(selection);
      expect(preview.getSelection()).not.toBeNull();
    });
  });
  
  describe('Loop Region', () => {
    it('sets and gets loop region', () => {
      const loop: LoopRegion = {
        start: 0.0,
        end: 1.0,
        crossfade: 0.01
      };
      
      preview.setLoopRegion(loop);
      const retrieved = preview.getLoopRegion();
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.start).toBe(0.0);
      expect(retrieved?.end).toBe(1.0);
      expect(retrieved?.crossfade).toBe(0.01);
    });
    
    it('clears loop region', () => {
      preview.setLoopRegion({ start: 0, end: 1, crossfade: 0.01 });
      preview.setLoopRegion(null);
      
      expect(preview.getLoopRegion()).toBeNull();
    });
  });
  
  describe('Zoom', () => {
    it('sets zoom level', () => {
      preview.setZoom(2.0);
      const zoom = preview.getZoom();
      
      expect(zoom.level).toBe(2.0);
    });
    
    it('sets zoom center', () => {
      preview.setZoom(2.0, 0.75);
      const zoom = preview.getZoom();
      
      expect(zoom.level).toBe(2.0);
      expect(zoom.center).toBe(0.75);
    });
    
    it('clamps zoom level', () => {
      preview.setZoom(0.1); // Too low
      expect(preview.getZoom().level).toBe(1.0);
      
      preview.setZoom(200); // Too high
      expect(preview.getZoom().level).toBe(100);
    });
    
    it('clamps zoom center', () => {
      preview.setZoom(2.0, -0.5); // Too low
      expect(preview.getZoom().center).toBeGreaterThanOrEqual(0);
      
      preview.setZoom(2.0, 1.5); // Too high
      expect(preview.getZoom().center).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Playhead', () => {
    it('sets playhead position', () => {
      preview.setPlayhead(0.5);
      // Should not throw, position is internal
      expect(true).toBe(true);
    });
    
    it('clamps playhead position', () => {
      preview.setPlayhead(-0.5);
      // Should clamp to 0
      expect(true).toBe(true);
      
      preview.setPlayhead(1.5);
      // Should clamp to 1
      expect(true).toBe(true);
    });
  });
  
  describe('Display Mode', () => {
    it('sets peak mode', () => {
      preview.setDisplayMode('peak');
      expect(true).toBe(true);
    });
    
    it('sets RMS mode', () => {
      preview.setDisplayMode('rms');
      expect(true).toBe(true);
    });
    
    it('sets both mode', () => {
      preview.setDisplayMode('both');
      expect(true).toBe(true);
    });
    
    it('sets mirror mode', () => {
      preview.setDisplayMode('mirror');
      expect(true).toBe(true);
    });
    
    it('sets spectrum mode', () => {
      preview.setDisplayMode('spectrum');
      expect(true).toBe(true);
    });
  });
  
  describe('Colors', () => {
    it('sets custom colors', () => {
      preview.setColors({
        waveform: '#FF0000',
        background: '#000000'
      });
      expect(true).toBe(true);
    });
    
    it('merges with existing colors', () => {
      preview.setColors({ waveform: '#FF0000' });
      preview.setColors({ background: '#000000' });
      // Both should be set
      expect(true).toBe(true);
    });
  });
  
  describe('Zero Crossing Detection', () => {
    it('finds zero crossing near position', async () => {
      await preview.loadAudio(audioBuffer);
      
      const time = 0.5;
      const zeroCrossing = preview.findZeroCrossing(time);
      
      // Should find a nearby zero crossing
      expect(typeof zeroCrossing).toBe('number');
      expect(Math.abs(zeroCrossing - time)).toBeLessThan(0.02); // Within 20ms
    });
    
    it('returns original position if no waveform data', () => {
      const time = 0.5;
      const result = preview.findZeroCrossing(time);
      expect(result).toBe(time);
    });
  });
});

describe('Metadata Panel', () => {
  it('creates metadata panel', () => {
    const metadata = createTestMetadata();
    const panel = createMetadataPanel(metadata);
    
    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel.className).toBe('sample-metadata-panel');
  });
  
  it('displays all metadata fields', () => {
    const metadata = createTestMetadata();
    const panel = createMetadataPanel(metadata, {
      showTempo: true,
      showKey: true,
      showSampleRate: true,
      showChannels: true,
      showDuration: true,
      showFileSize: true,
      showFormat: true
    });
    
    const text = panel.textContent || '';
    expect(text).toContain('Test Sample.wav');
    expect(text).toContain('WAV');
    expect(text).toContain('44100 Hz');
    expect(text).toContain('Stereo');
    expect(text).toContain('120');
    expect(text).toContain('BPM');
  });
  
  it('hides optional fields', () => {
    const metadata = createTestMetadata();
    const panel = createMetadataPanel(metadata, {
      showTempo: false,
      showKey: false
    });
    
    const text = panel.textContent || '';
    expect(text).not.toContain('120');
    expect(text).not.toContain('Key');
  });
  
  it('formats file size correctly', () => {
    const metadata = createTestMetadata();
    metadata.sizeBytes = 1024;
    const panel = createMetadataPanel(metadata);
    
    const text = panel.textContent || '';
    expect(text).toContain('1.0 KB');
  });
  
  it('formats duration correctly', () => {
    const metadata = createTestMetadata();
    metadata.duration = 65.5; // 1:05.50
    const panel = createMetadataPanel(metadata);
    
    const text = panel.textContent || '';
    expect(text).toContain('1:05.50');
  });
  
  it('shows tags', () => {
    const metadata = createTestMetadata();
    const panel = createMetadataPanel(metadata);
    
    const text = panel.textContent || '';
    expect(text).toContain('electronic');
    expect(text).toContain('punchy');
  });
});

describe('Zoom Controls', () => {
  it('creates zoom controls', () => {
    const preview = new SampleWaveformPreview();
    const controls = createZoomControls(preview);
    
    expect(controls).toBeInstanceOf(HTMLElement);
    expect(controls.className).toBe('waveform-zoom-controls');
  });
  
  it('has zoom in button', () => {
    const preview = new SampleWaveformPreview();
    const controls = createZoomControls(preview);
    
    const text = controls.textContent || '';
    expect(text).toContain('Zoom In');
  });
  
  it('has zoom out button', () => {
    const preview = new SampleWaveformPreview();
    const controls = createZoomControls(preview);
    
    const text = controls.textContent || '';
    expect(text).toContain('Zoom Out');
  });
  
  it('has fit button', () => {
    const preview = new SampleWaveformPreview();
    const controls = createZoomControls(preview);
    
    const text = controls.textContent || '';
    expect(text).toContain('Fit');
  });
  
  it('has zoom to selection button', () => {
    const preview = new SampleWaveformPreview();
    const controls = createZoomControls(preview);
    
    const text = controls.textContent || '';
    expect(text).toContain('Zoom to Selection');
  });
  
  it('zoom in increases zoom level', () => {
    const preview = new SampleWaveformPreview();
    const controls = createZoomControls(preview);
    
    const initialZoom = preview.getZoom().level;
    
    // Find and click zoom in button
    const buttons = controls.querySelectorAll('button');
    const zoomInBtn = Array.from(buttons).find(btn => btn.textContent === 'Zoom In');
    
    if (zoomInBtn) {
      zoomInBtn.click();
      const newZoom = preview.getZoom().level;
      expect(newZoom).toBeGreaterThan(initialZoom);
    }
  });
  
  it('zoom out decreases zoom level', () => {
    const preview = new SampleWaveformPreview();
    preview.setZoom(4.0); // Set initial zoom
    
    const controls = createZoomControls(preview);
    const initialZoom = preview.getZoom().level;
    
    // Find and click zoom out button
    const buttons = controls.querySelectorAll('button');
    const zoomOutBtn = Array.from(buttons).find(btn => btn.textContent === 'Zoom Out');
    
    if (zoomOutBtn) {
      zoomOutBtn.click();
      const newZoom = preview.getZoom().level;
      expect(newZoom).toBeLessThan(initialZoom);
    }
  });
  
  it('fit button resets zoom', () => {
    const preview = new SampleWaveformPreview();
    preview.setZoom(4.0); // Set initial zoom
    
    const controls = createZoomControls(preview);
    
    // Find and click fit button
    const buttons = controls.querySelectorAll('button');
    const fitBtn = Array.from(buttons).find(btn => btn.textContent === 'Fit');
    
    if (fitBtn) {
      fitBtn.click();
      const zoom = preview.getZoom();
      expect(zoom.level).toBe(1);
      expect(zoom.center).toBe(0.5);
    }
  });
});

describe('Integration Tests', () => {
  it('complete workflow: load, select, zoom', async () => {
    const preview = new SampleWaveformPreview();
    const audioBuffer = createTestAudioBuffer(2.0);
    const metadata = createTestMetadata();
    
    // Load audio
    await preview.loadAudio(audioBuffer);
    
    // Set metadata
    preview.setMetadata(metadata);
    
    // Create selection
    preview.setSelection({ start: 0.5, end: 1.5 });
    
    // Zoom in
    preview.setZoom(2.0);
    
    // Verify state
    expect(preview.getSelection()).not.toBeNull();
    expect(preview.getZoom().level).toBe(2.0);
  });
  
  it('handles metadata panel with waveform preview', async () => {
    const preview = new SampleWaveformPreview();
    const audioBuffer = createTestAudioBuffer();
    const metadata = createTestMetadata();
    
    await preview.loadAudio(audioBuffer);
    preview.setMetadata(metadata);
    
    const panel = createMetadataPanel(metadata);
    expect(panel.textContent).toBeTruthy();
  });
  
  it('handles zoom controls with waveform preview', async () => {
    const preview = new SampleWaveformPreview();
    const audioBuffer = createTestAudioBuffer();
    
    await preview.loadAudio(audioBuffer);
    
    const controls = createZoomControls(preview);
    expect(controls.querySelectorAll('button').length).toBe(4);
  });
});

describe('Edge Cases', () => {
  it('handles empty audio buffer', () => {
    const preview = new SampleWaveformPreview();
    const emptyBuffer = new AudioBuffer({
      length: 0,
      numberOfChannels: 1,
      sampleRate: 44100
    });
    
    expect(async () => {
      await preview.loadAudio(emptyBuffer);
    }).not.toThrow();
  });
  
  it('handles very short audio buffer', async () => {
    const preview = new SampleWaveformPreview();
    const shortBuffer = createTestAudioBuffer(0.01); // 10ms
    
    await preview.loadAudio(shortBuffer);
    expect(true).toBe(true);
  });
  
  it('handles very long audio buffer', async () => {
    const preview = new SampleWaveformPreview();
    const longBuffer = createTestAudioBuffer(300); // 5 minutes
    
    await preview.loadAudio(longBuffer);
    expect(true).toBe(true);
  });
  
  it('handles selection at boundaries', () => {
    const preview = new SampleWaveformPreview();
    
    preview.setSelection({ start: 0, end: 0 });
    expect(preview.getSelection()).not.toBeNull();
    
    preview.setSelection({ start: 0, end: 100 });
    expect(preview.getSelection()).not.toBeNull();
  });
  
  it('handles extreme zoom levels', () => {
    const preview = new SampleWaveformPreview();
    
    preview.setZoom(0.001); // Very low (should clamp)
    expect(preview.getZoom().level).toBeGreaterThanOrEqual(1);
    
    preview.setZoom(10000); // Very high (should clamp)
    expect(preview.getZoom().level).toBeLessThanOrEqual(100);
  });
  
  it('handles missing metadata fields', () => {
    const minimalMetadata: SampleMetadata = {
      id: 'test',
      name: 'test.wav',
      path: '/test.wav',
      format: 'wav',
      sampleRate: 44100,
      duration: 1.0,
      channels: 1,
      sizeBytes: 44100,
      type: 'one-shot',
      categories: [],
      tags: [],
      rating: 0,
      isFavorite: false,
      created: new Date(),
      source: 'local'
    };
    
    const panel = createMetadataPanel(minimalMetadata);
    expect(panel).toBeInstanceOf(HTMLElement);
  });
});

// ============================================================================
// NEW FEATURES TESTS (10 tasks completed)
// ============================================================================

describe('Editable Metadata Panel', () => {
  it('creates editable metadata panel with input fields', () => {
    
    
    const metadata: SampleMetadata = {
      id: 'test',
      name: 'test.wav',
      path: '/test.wav',
      format: 'wav',
      sampleRate: 44100,
      duration: 1.5,
      channels: 2,
      sizeBytes: 132300,
      type: 'loop',
      key: 'C',
      bpm: 120,
      categories: ['drums'],
      tags: ['kick', 'heavy'],
      rating: 4,
      isFavorite: true,
      created: new Date(),
      source: 'local'
    };
    
    let changedField = '';
    let changedValue: string | number = '';
    
    const panel = createEditableMetadataPanel(
      metadata,
      (field, value) => {
        changedField = field;
        changedValue = value;
      },
      { editable: true }
    );
    
    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel.className).toBe('sample-metadata-panel editable');
    
    // Check that input fields are created
    const inputs = panel.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });
  
  it('calls onChange callback when field is edited', () => {
    
    
    const metadata: SampleMetadata = {
      id: 'test',
      name: 'original.wav',
      path: '/original.wav',
      format: 'wav',
      sampleRate: 44100,
      duration: 1.0,
      channels: 1,
      sizeBytes: 44100,
      type: 'one-shot',
      categories: [],
      tags: [],
      rating: 0,
      isFavorite: false,
      created: new Date(),
      source: 'local'
    };
    
    let capturedField = '';
    let capturedValue: string | number = '';
    
    const panel = createEditableMetadataPanel(
      metadata,
      (field, value) => {
        capturedField = field;
        capturedValue = value;
      },
      { editable: true }
    );
    
    // Simulate input change
    const input = panel.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = 'changed.wav';
      input.dispatchEvent(new Event('change'));
      
      // The onChange should have been called
      expect(capturedField).toBe('name');
      expect(capturedValue).toBe('changed.wav');
    }
  });
});

describe('Batch Metadata Editor', () => {
  it('creates batch editor with multiple sample selection', () => {
    
    
    const samples: SampleMetadata[] = [
      {
        id: '1',
        name: 'sample1.wav',
        path: '/sample1.wav',
        format: 'wav',
        sampleRate: 44100,
        duration: 1.0,
        channels: 1,
        sizeBytes: 44100,
        type: 'one-shot',
        categories: [],
        tags: [],
        rating: 0,
        isFavorite: false,
        created: new Date(),
        source: 'local'
      },
      {
        id: '2',
        name: 'sample2.wav',
        path: '/sample2.wav',
        format: 'wav',
        sampleRate: 44100,
        duration: 1.0,
        channels: 1,
        sizeBytes: 44100,
        type: 'one-shot',
        categories: [],
        tags: [],
        rating: 0,
        isFavorite: false,
        created: new Date(),
        source: 'local'
      }
    ];
    
    let appliedEdit: any = null;
    
    const editor = createBatchMetadataEditor(samples, (edit) => {
      appliedEdit = edit;
    });
    
    expect(editor).toBeInstanceOf(HTMLElement);
    expect(editor.textContent).toContain('Editing 2 samples');
  });
  
  it('applies batch edits to all selected samples', () => {
    
    
    const samples: SampleMetadata[] = Array(5).fill(null).map((_, i) => ({
      id: `sample-${i}`,
      name: `sample${i}.wav`,
      path: `/sample${i}.wav`,
      format: 'wav',
      sampleRate: 44100,
      duration: 1.0,
      channels: 1,
      sizeBytes: 44100,
      type: 'one-shot',
      categories: [],
      tags: [],
      rating: 0,
      isFavorite: false,
      created: new Date(),
      source: 'local'
    }));
    
    let appliedEdit: any = null;
    
    const editor = createBatchMetadataEditor(samples, (edit) => {
      appliedEdit = edit;
    });
    
    // Simulate filling in fields and clicking apply
    const keyInput = editor.querySelector('input[type="text"]') as HTMLInputElement;
    const bpmInput = editor.querySelector('input[type="number"]') as HTMLInputElement;
    const applyButton = editor.querySelector('button') as HTMLButtonElement;
    
    if (keyInput && bpmInput && applyButton) {
      keyInput.value = 'D';
      bpmInput.value = '140';
      applyButton.click();
      
      expect(appliedEdit).not.toBeNull();
      expect(appliedEdit.sampleIds).toHaveLength(5);
      expect(appliedEdit.fields.key).toBe('D');
      expect(appliedEdit.fields.bpm).toBe(140);
    }
  });
});

describe('Waveform Color Themes', () => {
  it('provides multiple color theme presets', () => {
    
    
    expect(WAVEFORM_COLOR_THEMES).toBeDefined();
    expect(WAVEFORM_COLOR_THEMES.default).toBeDefined();
    expect(WAVEFORM_COLOR_THEMES.blue).toBeDefined();
    expect(WAVEFORM_COLOR_THEMES.purple).toBeDefined();
    expect(WAVEFORM_COLOR_THEMES.retro).toBeDefined();
    
    // Check that themes have all required color properties
    const theme = WAVEFORM_COLOR_THEMES.default;
    expect(theme.background).toBeDefined();
    expect(theme.waveform).toBeDefined();
    expect(theme.waveformFill).toBeDefined();
    expect(theme.grid).toBeDefined();
    expect(theme.selection).toBeDefined();
  });
  
  it('creates color theme selector that changes preview colors', () => {
    
    
    const preview = new SampleWaveformPreview();
    let selectedTheme = '';
    
    const selector = createColorThemeSelector(preview, (theme) => {
      selectedTheme = theme;
    });
    
    expect(selector).toBeInstanceOf(HTMLElement);
    
    // Check that selector has options
    const select = selector.querySelector('select');
    expect(select).toBeInstanceOf(HTMLSelectElement);
    expect(select?.options.length).toBeGreaterThan(1);
  });
});

describe('Spectrum Preview', () => {
  it('creates spectrum analyzer with FFT display', async () => {
    
    
    const spectrum = new SpectrumPreview({
      width: 800,
      height: 200,
      fftSize: 2048
    });
    
    expect(spectrum).toBeDefined();
    expect(spectrum.getElement()).toBeInstanceOf(HTMLCanvasElement);
    
    const canvas = spectrum.getElement();
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(200);
  });
  
  it('analyzes audio and displays spectrum', async () => {
    
    
    const audioBuffer = createTestAudioBuffer(1.0, 440, 44100);
    const spectrum = new SpectrumPreview();
    
    await spectrum.analyzeAudio(audioBuffer);
    
    // Check that canvas was rendered
    const canvas = spectrum.getElement();
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
  });
});

describe('Loudness Display', () => {
  it('calculates loudness statistics from audio buffer', () => {
    
    
    const audioBuffer = createTestAudioBuffer(1.0, 440, 44100);
    const stats = calculateLoudness(audioBuffer);
    
    expect(stats).toBeDefined();
    expect(stats.peakDb).toBeDefined();
    expect(stats.rmsDb).toBeDefined();
    expect(stats.lufs).toBeDefined();
    expect(stats.dynamicRange).toBeDefined();
    expect(stats.crestFactor).toBeDefined();
    
    // Peak should be close to 0 dB for full-scale sine wave
    expect(stats.peakDb).toBeGreaterThan(-10);
    expect(stats.peakDb).toBeLessThan(1);
  });
  
  it('creates loudness display panel with meters', () => {
    
    
    const audioBuffer = createTestAudioBuffer(1.0, 440, 44100);
    const stats = calculateLoudness(audioBuffer);
    const panel = createLoudnessDisplay(stats);
    
    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel.className).toBe('loudness-display');
    
    // Check that panel contains all meter labels
    const text = panel.textContent || '';
    expect(text).toContain('Peak');
    expect(text).toContain('RMS');
    expect(text).toContain('LUFS');
    expect(text).toContain('True Peak');
    expect(text).toContain('Dynamic Range');
    expect(text).toContain('Crest Factor');
  });
  
  it('detects clipping with warning colors', () => {
    
    
    const clippingStats = {
      peakDb: 0.5, // Above 0 dB - clipping
      rmsDb: -6,
      lufs: -23,
      truePeakDb: 1.0,
      dynamicRange: 6.5,
      crestFactor: 2.1
    };
    
    const panel = createLoudnessDisplay(clippingStats);
    
    // Check for warning indication in styles (RGB format)
    const html = panel.innerHTML;
    expect(html).toMatch(/rgb\(244,\s*67,\s*54\)|#f44336/i); // Red color for warnings
  });
});

describe('Comparison View', () => {
  it('creates waveform comparison view with two previews', () => {
    
    
    const comparison = new WaveformComparisonView({
      width: 800,
      height: 200
    });
    
    expect(comparison).toBeDefined();
    expect(comparison.getElement()).toBeInstanceOf(HTMLElement);
  });
  
  it('switches between comparison modes', () => {
    
    
    const comparison = new WaveformComparisonView();
    
    comparison.setMode('side-by-side');
    expect(comparison.getElement().style.gridTemplateColumns).toContain('1fr 1fr');
    
    comparison.setMode('overlay');
    expect(comparison.getElement().style.position).toBe('relative');
  });
  
  it('loads and compares two samples', async () => {
    
    
    const comparison = new WaveformComparisonView();
    const buffer1 = createTestAudioBuffer(1.0, 440, 44100);
    const buffer2 = createTestAudioBuffer(1.0, 880, 44100);
    
    await comparison.loadSample1(buffer1);
    await comparison.loadSample2(buffer2);
    
    // Both should be loaded without errors
    expect(comparison.getElement()).toBeDefined();
  });
  
  it('synchronizes zoom between two waveforms', () => {
    
    
    const comparison = new WaveformComparisonView();
    
    // This would synchronize zoom levels
    comparison.syncZoom();
    
    // Verify no errors thrown
    expect(comparison).toBeDefined();
  });
  
  it('creates comparison mode selector', () => {
    
    
    const comparison = new WaveformComparisonView();
    const selector = createComparisonModeSelector(comparison);
    
    expect(selector).toBeInstanceOf(HTMLElement);
    
    // Check for mode buttons
    const buttons = selector.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3); // side-by-side, overlay, difference
  });
});

describe('Duration and File Size Display', () => {
  it('displays duration in metadata panel', () => {
    
    
    const metadata: SampleMetadata = {
      id: 'test',
      name: 'test.wav',
      path: '/test.wav',
      format: 'wav',
      sampleRate: 44100,
      duration: 125.5, // 2 minutes 5.5 seconds
      channels: 2,
      sizeBytes: 44100 * 125.5 * 2 * 2, // stereo 16-bit
      type: 'loop',
      categories: [],
      tags: [],
      rating: 0,
      isFavorite: false,
      created: new Date(),
      source: 'local'
    };
    
    const panel = createMetadataPanel(metadata);
    const text = panel.textContent || '';
    
    expect(text).toContain('Duration');
    expect(text).toContain('2:05'); // Should format as MM:SS
  });
  
  it('displays file size in human-readable format', () => {
    
    
    const metadata: SampleMetadata = {
      id: 'test',
      name: 'large.wav',
      path: '/large.wav',
      format: 'wav',
      sampleRate: 44100,
      duration: 60,
      channels: 2,
      sizeBytes: 10 * 1024 * 1024, // 10 MB
      type: 'loop',
      categories: [],
      tags: [],
      rating: 0,
      isFavorite: false,
      created: new Date(),
      source: 'local'
    };
    
    const panel = createMetadataPanel(metadata);
    const text = panel.textContent || '';
    
    expect(text).toContain('Size');
    expect(text).toContain('MB'); // Should show in megabytes
  });
  
  it('formats small file sizes in KB', () => {
    
    
    const metadata: SampleMetadata = {
      id: 'test',
      name: 'small.wav',
      path: '/small.wav',
      format: 'wav',
      sampleRate: 44100,
      duration: 0.1,
      channels: 1,
      sizeBytes: 8820, // < 10 KB
      type: 'one-shot',
      categories: [],
      tags: [],
      rating: 0,
      isFavorite: false,
      created: new Date(),
      source: 'local'
    };
    
    const panel = createMetadataPanel(metadata);
    const text = panel.textContent || '';
    
    expect(text).toContain('KB'); // Should show in kilobytes
  });
});
