/**
 * @fileoverview MIDI Visualization Components
 * 
 * Canvas-based MIDI activity visualization:
 * - Piano roll view (note activity)
 * - Velocity bars
 * - CC visualization (knobs, sliders)
 * - MIDI activity indicator
 * - Note history trail
 * - Chord detection display
 * 
 * @module @cardplay/ui/components/midi-visualization
 */

// ============================================================================
// TYPES
// ============================================================================

/** MIDI note event */
export interface MIDINoteEvent {
  note: number;        // 0-127
  velocity: number;    // 0-127
  channel: number;     // 0-15
  timestamp: number;   // ms
  duration?: number;   // ms (for note-off)
  isNoteOn: boolean;
}

/** MIDI CC event */
export interface MIDICCEvent {
  cc: number;          // 0-127
  value: number;       // 0-127
  channel: number;     // 0-15
  timestamp: number;
}

/** MIDI pitch bend event */
export interface MIDIPitchBendEvent {
  value: number;       // -8192 to 8191
  channel: number;
  timestamp: number;
}

/** Visualization theme */
export interface MIDIVisualizationTheme {
  background: string;
  keyWhite: string;
  keyBlack: string;
  noteActive: string;
  noteTrail: string;
  velocity: string;
  grid: string;
  text: string;
  channelColors: string[];
}

/** Base options */
export interface MIDIVisualizationOptions {
  width?: number;
  height?: number;
  theme?: Partial<MIDIVisualizationTheme>;
  fps?: number;
  historyDuration?: number;  // ms to keep history
}

/** Piano roll options */
export interface PianoRollOptions extends MIDIVisualizationOptions {
  octaveRange?: [number, number];  // e.g., [2, 6] for C2-C6
  showVelocity?: boolean;
  showNoteName?: boolean;
  orientation?: 'horizontal' | 'vertical';
  keyWidth?: number;
}

/** Velocity display options */
export interface VelocityDisplayOptions extends MIDIVisualizationOptions {
  barCount?: number;
  showPeak?: boolean;
  peakHoldTime?: number;
  decayRate?: number;
}

/** CC display options */
export interface CCDisplayOptions extends MIDIVisualizationOptions {
  ccNumbers?: number[];
  displayStyle?: 'knob' | 'slider' | 'graph';
  showLabels?: boolean;
}

/** Activity indicator options */
export interface ActivityIndicatorOptions extends MIDIVisualizationOptions {
  showNoteCount?: boolean;
  showChannels?: boolean;
  pulseOnActivity?: boolean;
}

// ============================================================================
// DEFAULT THEME
// ============================================================================

const DEFAULT_THEME: MIDIVisualizationTheme = {
  background: '#1a1a1a',
  keyWhite: '#e5e5e5',
  keyBlack: '#333333',
  noteActive: '#6366f1',
  noteTrail: '#4f46e5',
  velocity: '#22c55e',
  grid: '#333333',
  text: '#888888',
  channelColors: [
    '#6366f1', '#ec4899', '#f59e0b', '#22c55e',
    '#06b6d4', '#8b5cf6', '#ef4444', '#84cc16',
    '#14b8a6', '#f97316', '#a855f7', '#10b981',
    '#3b82f6', '#d946ef', '#eab308', '#64748b'
  ],
};

// ============================================================================
// NOTE NAMES
// ============================================================================

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

function getNoteName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES[note % 12];
  return `${name}${octave}`;
}

function isBlackKey(note: number): boolean {
  return BLACK_KEYS.includes(note % 12);
}

// ============================================================================
// BASE MIDI VISUALIZATION
// ============================================================================

abstract class BaseMIDIVisualization {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected theme: MIDIVisualizationTheme;
  protected width: number;
  protected height: number;
  protected fps: number;
  protected historyDuration: number;
  
  protected animationFrame: number | null = null;
  protected isRunning: boolean = false;
  protected lastFrameTime: number = 0;
  
  // Active notes (channel -> note -> event)
  protected activeNotes: Map<number, Map<number, MIDINoteEvent>> = new Map();
  
  // Note history
  protected noteHistory: MIDINoteEvent[] = [];
  
  constructor(options: MIDIVisualizationOptions = {}) {
    this.width = options.width ?? 300;
    this.height = options.height ?? 100;
    this.fps = options.fps ?? 60;
    this.historyDuration = options.historyDuration ?? 2000;
    this.theme = { ...DEFAULT_THEME, ...options.theme };
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.className = 'midi-visualization';
    
    this.ctx = this.canvas.getContext('2d')!;
    
    // Initialize channel maps
    for (let i = 0; i < 16; i++) {
      this.activeNotes.set(i, new Map());
    }
  }
  
  getElement(): HTMLCanvasElement {
    return this.canvas;
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  setTheme(theme: Partial<MIDIVisualizationTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }
  
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }
  
  stop(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  private animate = (): void => {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    const frameInterval = 1000 / this.fps;
    
    if (elapsed >= frameInterval) {
      this.lastFrameTime = now - (elapsed % frameInterval);
      this.pruneHistory(now);
      this.render();
    }
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  /**
   * Process note on
   */
  noteOn(note: number, velocity: number, channel: number = 0): void {
    const event: MIDINoteEvent = {
      note,
      velocity,
      channel,
      timestamp: performance.now(),
      isNoteOn: true,
    };
    
    this.activeNotes.get(channel)?.set(note, event);
    this.noteHistory.push(event);
  }
  
  /**
   * Process note off
   */
  noteOff(note: number, channel: number = 0): void {
    const channelNotes = this.activeNotes.get(channel);
    const activeNote = channelNotes?.get(note);
    
    if (activeNote) {
      activeNote.duration = performance.now() - activeNote.timestamp;
      channelNotes?.delete(note);
    }
    
    this.noteHistory.push({
      note,
      velocity: 0,
      channel,
      timestamp: performance.now(),
      isNoteOn: false,
    });
  }
  
  /**
   * All notes off
   */
  allNotesOff(channel?: number): void {
    if (channel !== undefined) {
      this.activeNotes.get(channel)?.clear();
    } else {
      for (const map of this.activeNotes.values()) {
        map.clear();
      }
    }
  }
  
  private pruneHistory(now: number): void {
    const cutoff = now - this.historyDuration;
    this.noteHistory = this.noteHistory.filter(e => e.timestamp > cutoff);
  }
  
  protected clear(): void {
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  protected abstract render(): void;
  
  dispose(): void {
    this.stop();
  }
}

// ============================================================================
// PIANO ROLL VISUALIZATION
// ============================================================================

export class PianoRollVisualization extends BaseMIDIVisualization {
  private octaveRange: [number, number];
  private showVelocity: boolean;
  private showNoteName: boolean;
  private orientation: 'horizontal' | 'vertical';
  
  private noteStart: number;
  private noteEnd: number;
  private totalKeys: number;
  
  constructor(options: PianoRollOptions = {}) {
    super(options);
    
    this.octaveRange = options.octaveRange ?? [2, 6];
    this.showVelocity = options.showVelocity ?? true;
    this.showNoteName = options.showNoteName ?? true;
    this.orientation = options.orientation ?? 'horizontal';
    
    this.noteStart = (this.octaveRange[0] + 1) * 12;
    this.noteEnd = (this.octaveRange[1] + 1) * 12;
    this.totalKeys = this.noteEnd - this.noteStart;
  }
  
  protected render(): void {
    this.clear();
    this.drawKeyboard();
    this.drawNoteTrails();
    this.drawActiveNotes();
  }
  
  private drawKeyboard(): void {
    const ctx = this.ctx;
    const isHorizontal = this.orientation === 'horizontal';
    
    const keyboardSize = isHorizontal ? this.height * 0.3 : this.width * 0.3;
    const keySize = (isHorizontal ? this.width : this.height) / this.totalKeys;
    
    // Draw white keys
    for (let i = 0; i < this.totalKeys; i++) {
      const note = this.noteStart + i;
      if (isBlackKey(note)) continue;
      
      const pos = isHorizontal 
        ? { x: i * keySize, y: this.height - keyboardSize, w: keySize, h: keyboardSize }
        : { x: this.width - keyboardSize, y: i * keySize, w: keyboardSize, h: keySize };
      
      ctx.fillStyle = this.theme.keyWhite;
      ctx.fillRect(pos.x, pos.y, pos.w - 1, pos.h);
      
      // Note name on C
      if (note % 12 === 0 && this.showNoteName) {
        ctx.fillStyle = this.theme.text;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isHorizontal) {
          ctx.fillText(getNoteName(note), pos.x + pos.w / 2, pos.y + pos.h - 10);
        } else {
          ctx.fillText(getNoteName(note), pos.x + 10, pos.y + pos.h / 2);
        }
      }
    }
    
    // Draw black keys
    for (let i = 0; i < this.totalKeys; i++) {
      const note = this.noteStart + i;
      if (!isBlackKey(note)) continue;
      
      const pos = isHorizontal 
        ? { x: i * keySize, y: this.height - keyboardSize, w: keySize, h: keyboardSize * 0.6 }
        : { x: this.width - keyboardSize * 0.6, y: i * keySize, w: keyboardSize * 0.6, h: keySize };
      
      ctx.fillStyle = this.theme.keyBlack;
      ctx.fillRect(pos.x, pos.y, pos.w - 1, pos.h);
    }
  }
  
  private drawNoteTrails(): void {
    const ctx = this.ctx;
    const isHorizontal = this.orientation === 'horizontal';
    const now = performance.now();
    
    const keyboardSize = isHorizontal ? this.height * 0.3 : this.width * 0.3;
    const keySize = (isHorizontal ? this.width : this.height) / this.totalKeys;
    
    for (const event of this.noteHistory) {
      if (!event.isNoteOn || event.note < this.noteStart || event.note >= this.noteEnd) continue;
      
      const age = now - event.timestamp;
      const opacity = 1 - (age / this.historyDuration);
      if (opacity <= 0) continue;
      
      const noteIndex = event.note - this.noteStart;
      const yProgress = age / this.historyDuration;
      
      const color = this.theme.channelColors[event.channel % 16] ?? this.theme.noteTrail;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity * 0.6;
      
      const noteWidth = keySize * 0.8;
      const noteHeight = 4;
      
      if (isHorizontal) {
        const x = noteIndex * keySize + (keySize - noteWidth) / 2;
        const y = (this.height - keyboardSize) * (1 - yProgress) - noteHeight;
        ctx.fillRect(x, y, noteWidth, noteHeight);
      } else {
        const y = noteIndex * keySize + (keySize - noteWidth) / 2;
        const x = (this.width - keyboardSize) * yProgress;
        ctx.fillRect(x, y, noteHeight, noteWidth);
      }
    }
    
    ctx.globalAlpha = 1;
  }
  
  private drawActiveNotes(): void {
    const ctx = this.ctx;
    const isHorizontal = this.orientation === 'horizontal';
    
    const keyboardSize = isHorizontal ? this.height * 0.3 : this.width * 0.3;
    const keySize = (isHorizontal ? this.width : this.height) / this.totalKeys;
    
    for (const [channel, notes] of this.activeNotes) {
      const color = this.theme.channelColors[channel % 16] ?? this.theme.noteActive;
      
      for (const [note, event] of notes) {
        if (note < this.noteStart || note >= this.noteEnd) continue;
        
        const noteIndex = note - this.noteStart;
        const velocity = event.velocity / 127;
        
        // Highlight key
        const pos = isHorizontal 
          ? { x: noteIndex * keySize, y: this.height - keyboardSize, w: keySize, h: keyboardSize }
          : { x: this.width - keyboardSize, y: noteIndex * keySize, w: keyboardSize, h: keySize };
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        
        if (isBlackKey(note)) {
          if (isHorizontal) {
            ctx.fillRect(pos.x, pos.y, pos.w - 1, pos.h * 0.6);
          } else {
            ctx.fillRect(pos.x + pos.w * 0.4, pos.y, pos.w * 0.6, pos.h - 1);
          }
        } else {
          ctx.fillRect(pos.x, pos.y, pos.w - 1, pos.h);
        }
        
        // Velocity bar
        if (this.showVelocity) {
          ctx.fillStyle = this.theme.velocity;
          ctx.globalAlpha = 0.9;
          
          if (isHorizontal) {
            const barHeight = (this.height - keyboardSize) * velocity * 0.3;
            ctx.fillRect(pos.x, this.height - keyboardSize - barHeight - 2, pos.w - 1, barHeight);
          } else {
            const barWidth = (this.width - keyboardSize) * velocity * 0.3;
            ctx.fillRect(this.width - keyboardSize + 2, pos.y, barWidth, pos.h - 1);
          }
        }
        
        ctx.globalAlpha = 1;
      }
    }
  }
}

// ============================================================================
// VELOCITY DISPLAY
// ============================================================================

export class VelocityDisplay extends BaseMIDIVisualization {
  private barCount: number;
  private showPeak: boolean;
  private peakHoldTime: number;
  private decayRate: number;
  
  private velocityBars: number[];
  private peakValues: number[];
  private peakTimestamps: number[];
  
  constructor(options: VelocityDisplayOptions = {}) {
    super(options);
    
    this.barCount = options.barCount ?? 16;
    this.showPeak = options.showPeak ?? true;
    this.peakHoldTime = options.peakHoldTime ?? 1000;
    this.decayRate = options.decayRate ?? 0.05;
    
    this.velocityBars = new Array(this.barCount).fill(0);
    this.peakValues = new Array(this.barCount).fill(0);
    this.peakTimestamps = new Array(this.barCount).fill(0);
  }
  
  noteOn(note: number, velocity: number, channel: number = 0): void {
    super.noteOn(note, velocity, channel);
    
    // Map note to bar (simplified)
    const barIndex = Math.floor((note % this.barCount));
    const normalized = velocity / 127;
    
    this.velocityBars[barIndex] = Math.max(this.velocityBars[barIndex] ?? 0, normalized);
    
    if (normalized > (this.peakValues[barIndex] ?? 0)) {
      this.peakValues[barIndex] = normalized;
      this.peakTimestamps[barIndex] = performance.now();
    }
  }
  
  protected render(): void {
    this.clear();
    
    const now = performance.now();
    const barWidth = (this.width - (this.barCount + 1) * 2) / this.barCount;
    
    for (let i = 0; i < this.barCount; i++) {
      // Decay
      const currentBar = this.velocityBars[i] ?? 0;
      this.velocityBars[i] = currentBar * (1 - this.decayRate);
      
      const x = 2 + i * (barWidth + 2);
      const barHeight = (this.velocityBars[i] ?? 0) * (this.height - 4);
      const y = this.height - 2 - barHeight;
      
      // Bar gradient
      const gradient = this.ctx.createLinearGradient(0, this.height, 0, 0);
      gradient.addColorStop(0, '#22c55e');
      gradient.addColorStop(0.6, '#eab308');
      gradient.addColorStop(1, '#ef4444');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y, barWidth, barHeight);
      
      // Peak indicator
      if (this.showPeak) {
        // Peak hold decay
        const peakTimestamp = this.peakTimestamps[i] ?? 0;
        if (now - peakTimestamp > this.peakHoldTime) {
          this.peakValues[i] = (this.peakValues[i] ?? 0) * 0.98;
        }
        
        const peakY = this.height - 2 - (this.peakValues[i] ?? 0) * (this.height - 4);
        this.ctx.fillStyle = this.theme.keyWhite;
        this.ctx.fillRect(x, peakY - 2, barWidth, 2);
      }
    }
    
    // Labels
    this.ctx.fillStyle = this.theme.text;
    this.ctx.font = '8px Inter, sans-serif';
    this.ctx.textAlign = 'center';
  }
}

// ============================================================================
// CC DISPLAY
// ============================================================================

export class CCDisplay extends BaseMIDIVisualization {
  private ccNumbers: number[];
  private displayStyle: 'knob' | 'slider' | 'graph';
  private showLabels: boolean;
  
  private ccValues: Map<number, number> = new Map();
  private ccHistory: Map<number, { value: number; timestamp: number }[]> = new Map();
  
  constructor(options: CCDisplayOptions = {}) {
    super(options);
    
    this.ccNumbers = options.ccNumbers ?? [1, 7, 10, 11, 64, 74];
    this.displayStyle = options.displayStyle ?? 'knob';
    this.showLabels = options.showLabels ?? true;
    
    for (const cc of this.ccNumbers) {
      this.ccValues.set(cc, 0);
      this.ccHistory.set(cc, []);
    }
  }
  
  /**
   * Process CC event
   */
  ccChange(cc: number, value: number, _channel: number = 0): void {
    if (!this.ccNumbers.includes(cc)) return;
    
    this.ccValues.set(cc, value);
    
    const history = this.ccHistory.get(cc) ?? [];
    history.push({ value, timestamp: performance.now() });
    
    // Keep history limited
    while (history.length > 100) {
      history.shift();
    }
    
    this.ccHistory.set(cc, history);
  }
  
  protected render(): void {
    this.clear();
    
    switch (this.displayStyle) {
      case 'knob':
        this.drawKnobs();
        break;
      case 'slider':
        this.drawSliders();
        break;
      case 'graph':
        this.drawGraphs();
        break;
    }
  }
  
  private drawKnobs(): void {
    const ctx = this.ctx;
    const count = this.ccNumbers.length;
    const knobSize = Math.min(
      (this.width - 20) / count - 10,
      this.height - 30
    );
    const radius = knobSize / 2;
    
    for (let i = 0; i < count; i++) {
      const cc = this.ccNumbers[i];
      if (cc === undefined) continue;
      const value = (this.ccValues.get(cc) ?? 0) / 127;
      
      const cx = 15 + i * (knobSize + 10) + radius;
      const cy = this.height / 2;
      
      // Background arc
      ctx.strokeStyle = this.theme.grid;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, Math.PI * 0.75, Math.PI * 2.25);
      ctx.stroke();
      
      // Value arc
      const endAngle = Math.PI * 0.75 + value * Math.PI * 1.5;
      ctx.strokeStyle = this.theme.noteActive;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, Math.PI * 0.75, endAngle);
      ctx.stroke();
      
      // Center dot
      ctx.fillStyle = this.theme.keyWhite;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      if (this.showLabels) {
        ctx.fillStyle = this.theme.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.getCCName(cc), cx, cy + radius + 4);
      }
    }
  }
  
  private drawSliders(): void {
    const ctx = this.ctx;
    const count = this.ccNumbers.length;
    const sliderWidth = (this.width - 20) / count - 10;
    
    for (let i = 0; i < count; i++) {
      const cc = this.ccNumbers[i];
      if (cc === undefined) continue;
      const value = (this.ccValues.get(cc) ?? 0) / 127;
      
      const x = 10 + i * (sliderWidth + 10);
      const trackHeight = this.height - 40;
      const y = 15;
      
      // Track background
      ctx.fillStyle = this.theme.grid;
      ctx.fillRect(x + sliderWidth / 2 - 2, y, 4, trackHeight);
      
      // Value fill
      const fillHeight = value * trackHeight;
      ctx.fillStyle = this.theme.noteActive;
      ctx.fillRect(x + sliderWidth / 2 - 3, y + trackHeight - fillHeight, 6, fillHeight);
      
      // Handle
      const handleY = y + trackHeight - fillHeight;
      ctx.fillStyle = this.theme.keyWhite;
      ctx.beginPath();
      ctx.roundRect(x, handleY - 4, sliderWidth, 8, 4);
      ctx.fill();
      
      // Label
      if (this.showLabels) {
        ctx.fillStyle = this.theme.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.getCCName(cc), x + sliderWidth / 2, this.height - 20);
      }
    }
  }
  
  private drawGraphs(): void {
    const ctx = this.ctx;
    const count = this.ccNumbers.length;
    const graphWidth = (this.width - 20) / count - 5;
    const graphHeight = this.height - 30;
    
    for (let i = 0; i < count; i++) {
      const cc = this.ccNumbers[i];
      if (cc === undefined) continue;
      const history = this.ccHistory.get(cc) ?? [];
      
      const x = 10 + i * (graphWidth + 5);
      const y = 10;
      
      // Background
      ctx.fillStyle = this.theme.grid;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y, graphWidth, graphHeight);
      ctx.globalAlpha = 1;
      
      // Graph line
      if (history.length > 1) {
        ctx.strokeStyle = this.theme.noteActive;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const now = performance.now();
        for (let j = 0; j < history.length; j++) {
          const point = history[j];
          if (!point) continue;
          const age = (now - point.timestamp) / this.historyDuration;
          const px = x + graphWidth - age * graphWidth;
          const py = y + graphHeight - (point.value / 127) * graphHeight;
          
          if (j === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        
        ctx.stroke();
      }
      
      // Current value
      const current = (this.ccValues.get(cc) ?? 0) / 127;
      ctx.fillStyle = this.theme.noteActive;
      ctx.beginPath();
      ctx.arc(x + graphWidth, y + graphHeight - current * graphHeight, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      if (this.showLabels) {
        ctx.fillStyle = this.theme.text;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.getCCName(cc), x + graphWidth / 2, this.height - 8);
      }
    }
  }
  
  private getCCName(cc: number): string {
    const names: Record<number, string> = {
      1: 'Mod',
      7: 'Vol',
      10: 'Pan',
      11: 'Expr',
      64: 'Sust',
      74: 'Filt',
      71: 'Res',
      72: 'Rel',
      73: 'Atk',
      91: 'Rev',
      93: 'Cho',
    };
    return names[cc] ?? `CC${cc}`;
  }
}

// ============================================================================
// ACTIVITY INDICATOR
// ============================================================================

export class MIDIActivityIndicator extends BaseMIDIVisualization {
  private showNoteCount: boolean;
  private showChannels: boolean;
  private pulseOnActivity: boolean;
  
  private pulseIntensity: number = 0;
  private noteCount: number = 0;
  private activeChannels: Set<number> = new Set();
  
  constructor(options: ActivityIndicatorOptions = {}) {
    super(options);
    
    this.showNoteCount = options.showNoteCount ?? true;
    this.showChannels = options.showChannels ?? true;
    this.pulseOnActivity = options.pulseOnActivity ?? true;
  }
  
  noteOn(note: number, velocity: number, channel: number = 0): void {
    super.noteOn(note, velocity, channel);
    
    this.pulseIntensity = 1;
    this.noteCount++;
    this.activeChannels.add(channel);
  }
  
  noteOff(note: number, channel: number = 0): void {
    super.noteOff(note, channel);
    
    // Check if channel still has notes
    const channelNotes = this.activeNotes.get(channel);
    if (channelNotes && channelNotes.size === 0) {
      this.activeChannels.delete(channel);
    }
  }
  
  protected render(): void {
    this.clear();
    
    // Decay pulse
    this.pulseIntensity *= 0.92;
    
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 2 - 10;
    
    // Pulse ring
    if (this.pulseOnActivity && this.pulseIntensity > 0.01) {
      ctx.strokeStyle = this.theme.noteActive;
      ctx.lineWidth = 3;
      ctx.globalAlpha = this.pulseIntensity;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5 * this.pulseIntensity, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    // Main circle
    const isActive = this.activeChannels.size > 0;
    ctx.fillStyle = isActive ? this.theme.noteActive : this.theme.grid;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Channel indicators (ring of dots)
    if (this.showChannels) {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const dotX = centerX + Math.cos(angle) * (radius - 5);
        const dotY = centerY + Math.sin(angle) * (radius - 5);
        
        ctx.fillStyle = this.activeChannels.has(i) 
          ? (this.theme.channelColors[i] ?? this.theme.noteActive)
          : this.theme.grid;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Note count
    if (this.showNoteCount) {
      ctx.fillStyle = this.theme.keyWhite;
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let count = 0;
      for (const notes of this.activeNotes.values()) {
        count += notes.size;
      }
      
      ctx.fillText(String(count), centerX, centerY);
    }
  }
}

// ============================================================================
// CHORD DISPLAY
// ============================================================================

export class ChordDisplay extends BaseMIDIVisualization {
  private currentNotes: number[] = [];
  private detectedChord: string = '';
  
  constructor(options: MIDIVisualizationOptions = {}) {
    super(options);
  }
  
  noteOn(note: number, velocity: number, channel: number = 0): void {
    super.noteOn(note, velocity, channel);
    
    this.currentNotes.push(note);
    this.currentNotes.sort((a, b) => a - b);
    this.detectChord();
  }
  
  noteOff(note: number, channel: number = 0): void {
    super.noteOff(note, channel);
    
    this.currentNotes = this.currentNotes.filter(n => n !== note);
    this.detectChord();
  }
  
  private detectChord(): void {
    const firstNote = this.currentNotes[0];
    if (this.currentNotes.length < 2) {
      this.detectedChord = this.currentNotes.length === 1 && firstNote !== undefined
        ? getNoteName(firstNote)
        : '';
      return;
    }
    
    // Get intervals relative to root
    const root = firstNote;
    if (root === undefined) return;
    const intervals = this.currentNotes.map(n => (n - root) % 12).sort((a, b) => a - b);
    const intervalsKey = intervals.join(',');
    
    // Common chord patterns
    const chordPatterns: Record<string, string> = {
      '0,4,7': 'maj',
      '0,3,7': 'min',
      '0,3,6': 'dim',
      '0,4,8': 'aug',
      '0,4,7,10': '7',
      '0,4,7,11': 'maj7',
      '0,3,7,10': 'min7',
      '0,3,6,9': 'dim7',
      '0,3,6,10': 'min7b5',
      '0,4,7,9': '6',
      '0,3,7,9': 'min6',
      '0,2,7': 'sus2',
      '0,5,7': 'sus4',
      '0,4,7,10,14': '9',
      '0,4,7,11,14': 'maj9',
    };
    
    const rootName = NOTE_NAMES[root % 12];
    const quality = chordPatterns[intervalsKey] ?? '';
    
    this.detectedChord = quality ? `${rootName}${quality}` : `${rootName}?`;
  }
  
  protected render(): void {
    this.clear();
    
    const ctx = this.ctx;
    
    // Chord name
    ctx.fillStyle = this.theme.keyWhite;
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.detectedChord || '-', this.width / 2, this.height / 2);
    
    // Note list
    if (this.currentNotes.length > 0) {
      ctx.fillStyle = this.theme.text;
      ctx.font = '11px Inter, sans-serif';
      ctx.textBaseline = 'bottom';
      
      const noteNames = this.currentNotes.map(n => getNoteName(n)).join(' ');
      ctx.fillText(noteNames, this.width / 2, this.height - 8);
    }
  }
}

// ============================================================================
// FACTORIES
// ============================================================================

export function createPianoRoll(options?: PianoRollOptions): PianoRollVisualization {
  return new PianoRollVisualization(options);
}

export function createVelocityDisplay(options?: VelocityDisplayOptions): VelocityDisplay {
  return new VelocityDisplay(options);
}

export function createCCDisplay(options?: CCDisplayOptions): CCDisplay {
  return new CCDisplay(options);
}

export function createActivityIndicator(options?: ActivityIndicatorOptions): MIDIActivityIndicator {
  return new MIDIActivityIndicator(options);
}

export function createChordDisplay(options?: MIDIVisualizationOptions): ChordDisplay {
  return new ChordDisplay(options);
}

// ============================================================================
// CSS
// ============================================================================

export const MIDI_VISUALIZATION_CSS = `
.midi-visualization {
  display: block;
  border-radius: 4px;
  background: var(--cardplay-midi-bg, #1a1a1a);
}

.midi-visualization-container {
  position: relative;
  display: inline-block;
}

.midi-visualization-label {
  position: absolute;
  top: 4px;
  left: 8px;
  font-size: 10px;
  color: var(--cardplay-text-secondary, #888);
  pointer-events: none;
}
`;
