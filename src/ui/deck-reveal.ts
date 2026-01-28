/**
 * @fileoverview Deck Reveal System
 * 
 * Implements a synchronized reveal UI for hybrid instruments on decks:
 * - Deck visualization with card slots
 * - Hybrid instrument "reveal" overlay/side panel
 * - Real-time sync visualization (waveforms, meters, MIDI activity)
 * - Interactive modulation routing display
 * - Playback position sync with visual feedback
 * - Touch/click reveal with smooth animations
 * 
 * @module @cardplay/core/ui/deck-reveal
 */

import { 
  Deck, 
  HybridCard, 
  CardState,
} from '../audio/instrument-cards';

// ============================================================================
// REVEAL TYPES
// ============================================================================

/** Reveal display mode */
export type RevealMode = 
  | 'overlay'       // Full overlay on top of deck
  | 'side_panel'    // Slide-out panel next to deck
  | 'split'         // Split view (deck + instrument)
  | 'popup'         // Floating popup window
  | 'inline';       // Expanded inline in deck

/** Reveal position for side panel mode */
export type RevealPosition = 'left' | 'right' | 'top' | 'bottom';

/** Animation easing */
export type EasingFunction = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

/** Reveal state */
export interface RevealState {
  isRevealed: boolean;
  revealedCardId: string | null;
  revealMode: RevealMode;
  revealPosition: RevealPosition;
  revealProgress: number;  // 0-1 for animation
  interactionType: 'hover' | 'click' | 'long-press' | null;
}

/** Sync visualization state */
export interface SyncVisualization {
  // Transport
  isPlaying: boolean;
  playheadPosition: number;  // 0-1
  tempo: number;
  beatPosition: number;      // Current beat
  barPosition: number;       // Current bar
  
  // Waveform
  waveformData: Float32Array | null;
  waveformPosition: number;
  
  // MIDI activity
  activeNotes: Set<number>;
  noteVelocities: Map<number, number>;
  lastNoteTime: number;
  midiActivityLevel: number;  // 0-1
  
  // Levels
  peakLevelL: number;
  peakLevelR: number;
  rmsLevelL: number;
  rmsLevelR: number;
  
  // Modulation
  activeModulations: Map<string, number>;
  macroValues: number[];
}

/** Deck visual representation */
export interface DeckVisual {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  slots: DeckSlotVisual[];
  masterMeter: MeterVisual;
}

/** Slot visual representation */
export interface DeckSlotVisual {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hasCard: boolean;
  cardType: 'sampler' | 'wavetable' | 'hybrid' | 'effect' | 'empty';
  cardName: string;
  state: CardState;
  midiActivity: number;
  audioLevel: number;
  isRevealed: boolean;
}

/** Meter visual */
export interface MeterVisual {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
  peakL: number;
  peakR: number;
  rmsL: number;
  rmsR: number;
  clipL: boolean;
  clipR: boolean;
}

// ============================================================================
// REVEAL CONFIGURATION
// ============================================================================

/** Reveal configuration */
export interface RevealConfig {
  // Mode settings
  defaultMode: RevealMode;
  defaultPosition: RevealPosition;
  allowModeSwitch: boolean;
  
  // Animation
  animationDuration: number;
  easing: EasingFunction;
  enableSpringPhysics: boolean;
  springTension: number;
  springFriction: number;
  
  // Interaction
  revealOnHover: boolean;
  hoverDelay: number;
  revealOnClick: boolean;
  revealOnLongPress: boolean;
  longPressDelay: number;
  dismissOnClickOutside: boolean;
  
  // Visual
  overlayOpacity: number;
  blurBackground: boolean;
  blurAmount: number;
  showShadow: boolean;
  shadowDepth: number;
  
  // Size
  revealWidth: number;
  revealHeight: number;
  maxWidth: number;
  maxHeight: number;
  
  // Content
  showWaveform: boolean;
  showMeters: boolean;
  showModulation: boolean;
  showMIDIActivity: boolean;
  showMacros: boolean;
  showArpeggiator: boolean;
  showSequencer: boolean;
}

/** Default reveal configuration */
export const DEFAULT_REVEAL_CONFIG: RevealConfig = {
  defaultMode: 'overlay',
  defaultPosition: 'right',
  allowModeSwitch: true,
  
  animationDuration: 300,
  easing: 'ease-out',
  enableSpringPhysics: true,
  springTension: 300,
  springFriction: 20,
  
  revealOnHover: false,
  hoverDelay: 500,
  revealOnClick: true,
  revealOnLongPress: true,
  longPressDelay: 400,
  dismissOnClickOutside: true,
  
  overlayOpacity: 0.92,
  blurBackground: true,
  blurAmount: 8,
  showShadow: true,
  shadowDepth: 24,
  
  revealWidth: 480,
  revealHeight: 640,
  maxWidth: 800,
  maxHeight: 900,
  
  showWaveform: true,
  showMeters: true,
  showModulation: true,
  showMIDIActivity: true,
  showMacros: true,
  showArpeggiator: true,
  showSequencer: true,
};

// ============================================================================
// DECK REVEAL CONTROLLER
// ============================================================================

/** Event types */
export type DeckRevealEventType = 
  | 'reveal'
  | 'hide'
  | 'modeChange'
  | 'cardSelect'
  | 'parameterChange'
  | 'transportChange'
  | 'midiActivity'
  | 'levelUpdate';

/** Event listener */
export type DeckRevealEventListener = (event: DeckRevealEvent) => void;

/** Event data */
export interface DeckRevealEvent {
  type: DeckRevealEventType;
  deckId: string;
  cardId?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Deck Reveal Controller
 * 
 * Manages the reveal UI for hybrid instruments on decks.
 */
export class DeckRevealController {
  private config: RevealConfig;
  private deck: Deck | null = null;
  private state: RevealState;
  private syncState: SyncVisualization;
  private deckVisual: DeckVisual | null = null;
  
  // Animation
  private animationFrame: number | null = null;
  
  // Timing
  private hoverTimer: number | null = null;
  private longPressTimer: number | null = null;
  
  // Events
  private listeners: Map<DeckRevealEventType, Set<DeckRevealEventListener>> = new Map();
  
  // Audio analysis (reserved for future use)
  
  constructor(config?: Partial<RevealConfig>) {
    this.config = { ...DEFAULT_REVEAL_CONFIG, ...config };
    
    this.state = {
      isRevealed: false,
      revealedCardId: null,
      revealMode: this.config.defaultMode,
      revealPosition: this.config.defaultPosition,
      revealProgress: 0,
      interactionType: null,
    };
    
    this.syncState = {
      isPlaying: false,
      playheadPosition: 0,
      tempo: 120,
      beatPosition: 0,
      barPosition: 0,
      waveformData: null,
      waveformPosition: 0,
      activeNotes: new Set(),
      noteVelocities: new Map(),
      lastNoteTime: 0,
      midiActivityLevel: 0,
      peakLevelL: 0,
      peakLevelR: 0,
      rmsLevelL: 0,
      rmsLevelR: 0,
      activeModulations: new Map(),
      macroValues: Array(8).fill(0),
    };
  }
  
  // ===========================================================================
  // DECK CONNECTION
  // ===========================================================================
  
  /**
   * Connect to a deck
   */
  connectDeck(deck: Deck): void {
    this.deck = deck;
    this.updateDeckVisual();
    this.syncState.tempo = deck.getTempo();
  }
  
  /**
   * Disconnect from deck
   */
  disconnectDeck(): void {
    this.hideReveal();
    this.deck = null;
    this.deckVisual = null;
  }
  
  /**
   * Get connected deck
   */
  getDeck(): Deck | null {
    return this.deck;
  }
  
  // ===========================================================================
  // REVEAL CONTROL
  // ===========================================================================
  
  /**
   * Show reveal for a card
   */
  showReveal(cardId: string, mode?: RevealMode): void {
    if (!this.deck) return;
    
    // Find card
    const cards = this.deck.getAllCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    // Update state
    this.state.revealedCardId = cardId;
    this.state.isRevealed = true;
    if (mode) {
      this.state.revealMode = mode;
    }
    
    // Start animation
    this.animateReveal(true);
    
    // Emit event
    this.emit({
      type: 'reveal',
      deckId: this.deck.id,
      cardId,
      timestamp: Date.now(),
    });
    
    // Update visual
    this.updateDeckVisual();
  }
  
  /**
   * Hide reveal
   */
  hideReveal(): void {
    if (!this.state.isRevealed) return;
    
    const cardId = this.state.revealedCardId;
    
    // Start animation
    this.animateReveal(false);
    
    // Emit event
    if (this.deck) {
      const event: DeckRevealEvent = {
        type: 'hide',
        deckId: this.deck.id,
        timestamp: Date.now(),
      };
      if (cardId !== null) {
        event.cardId = cardId;
      }
      this.emit(event);
    }
  }
  
  /**
   * Toggle reveal
   */
  toggleReveal(cardId: string): void {
    if (this.state.isRevealed && this.state.revealedCardId === cardId) {
      this.hideReveal();
    } else {
      this.showReveal(cardId);
    }
  }
  
  /**
   * Switch reveal mode
   */
  switchMode(mode: RevealMode): void {
    if (!this.config.allowModeSwitch) return;
    
    const previousMode = this.state.revealMode;
    this.state.revealMode = mode;
    
    this.emit({
      type: 'modeChange',
      deckId: this.deck?.id ?? '',
      data: { previousMode, newMode: mode },
      timestamp: Date.now(),
    });
  }
  
  /**
   * Get reveal state
   */
  getRevealState(): RevealState {
    return { ...this.state };
  }
  
  /**
   * Get sync visualization state
   */
  getSyncState(): SyncVisualization {
    return {
      ...this.syncState,
      activeNotes: new Set(this.syncState.activeNotes),
      noteVelocities: new Map(this.syncState.noteVelocities),
      activeModulations: new Map(this.syncState.activeModulations),
      macroValues: [...this.syncState.macroValues],
    };
  }
  
  // ===========================================================================
  // INTERACTION HANDLERS
  // ===========================================================================
  
  /**
   * Handle pointer enter on card slot
   */
  handlePointerEnter(slotIndex: number): void {
    if (!this.config.revealOnHover || !this.deck) return;
    
    const card = this.deck.getCard(slotIndex);
    if (!card) return;
    
    this.hoverTimer = window.setTimeout(() => {
      this.showReveal(card.id);
      this.state.interactionType = 'hover';
    }, this.config.hoverDelay);
  }
  
  /**
   * Handle pointer leave on card slot
   */
  handlePointerLeave(_slotIndex: number): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    
    if (this.state.interactionType === 'hover') {
      this.hideReveal();
    }
  }
  
  /**
   * Handle pointer down on card slot
   */
  handlePointerDown(slotIndex: number): void {
    if (!this.deck) return;
    
    const card = this.deck.getCard(slotIndex);
    if (!card) return;
    
    if (this.config.revealOnLongPress) {
      this.longPressTimer = window.setTimeout(() => {
        this.showReveal(card.id);
        this.state.interactionType = 'long-press';
      }, this.config.longPressDelay);
    }
  }
  
  /**
   * Handle pointer up on card slot
   */
  handlePointerUp(slotIndex: number): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Short click
    if (!this.state.isRevealed && this.config.revealOnClick && this.deck) {
      const card = this.deck.getCard(slotIndex);
      if (card) {
        this.showReveal(card.id);
        this.state.interactionType = 'click';
      }
    }
  }
  
  /**
   * Handle click outside
   */
  handleClickOutside(): void {
    if (this.config.dismissOnClickOutside && this.state.isRevealed) {
      this.hideReveal();
    }
  }
  
  // ===========================================================================
  // SYNC UPDATE
  // ===========================================================================
  
  /**
   * Update transport state
   */
  updateTransport(isPlaying: boolean, position: number): void {
    this.syncState.isPlaying = isPlaying;
    this.syncState.playheadPosition = position;
    
    // Calculate beat/bar position
    const beatsPerBar = 4;
    const totalBeats = position * this.syncState.tempo / 60;
    this.syncState.beatPosition = totalBeats % beatsPerBar;
    this.syncState.barPosition = Math.floor(totalBeats / beatsPerBar);
    
    this.emit({
      type: 'transportChange',
      deckId: this.deck?.id ?? '',
      data: { isPlaying, position },
      timestamp: Date.now(),
    });
  }
  
  /**
   * Update tempo
   */
  updateTempo(tempo: number): void {
    this.syncState.tempo = tempo;
    if (this.deck) {
      this.deck.setTempo(tempo);
    }
  }
  
  /**
   * Process MIDI event for visualization
   */
  processMIDI(data: Uint8Array): void {
    const byte0 = data[0];
    const note = data[1];
    const velocity = data[2];
    
    if (byte0 === undefined || note === undefined) return;
    
    const status = byte0 & 0xf0;
    
    if (status === 0x90 && velocity !== undefined && velocity > 0) {
      // Note on
      this.syncState.activeNotes.add(note);
      this.syncState.noteVelocities.set(note, velocity);
      this.syncState.lastNoteTime = Date.now();
      this.syncState.midiActivityLevel = Math.min(1, this.syncState.midiActivityLevel + 0.2);
    } else if (status === 0x80 || (status === 0x90 && (velocity === undefined || velocity === 0))) {
      // Note off
      this.syncState.activeNotes.delete(note);
      this.syncState.noteVelocities.delete(note);
    }
    
    this.emit({
      type: 'midiActivity',
      deckId: this.deck?.id ?? '',
      data: { status, note, velocity },
      timestamp: Date.now(),
    });
  }
  
  /**
   * Update audio levels
   */
  updateLevels(peakL: number, peakR: number, rmsL: number, rmsR: number): void {
    this.syncState.peakLevelL = peakL;
    this.syncState.peakLevelR = peakR;
    this.syncState.rmsLevelL = rmsL;
    this.syncState.rmsLevelR = rmsR;
    
    this.emit({
      type: 'levelUpdate',
      deckId: this.deck?.id ?? '',
      data: { peakL, peakR, rmsL, rmsR },
      timestamp: Date.now(),
    });
  }
  
  /**
   * Update modulation value
   */
  updateModulation(id: string, value: number): void {
    this.syncState.activeModulations.set(id, value);
  }
  
  /**
   * Update macro value
   */
  updateMacro(index: number, value: number): void {
    if (index >= 0 && index < this.syncState.macroValues.length) {
      this.syncState.macroValues[index] = value;
    }
  }
  
  /**
   * Decay MIDI activity (call periodically)
   */
  decayMIDIActivity(deltaTime: number): void {
    const decayRate = 2; // per second
    this.syncState.midiActivityLevel = Math.max(
      0,
      this.syncState.midiActivityLevel - decayRate * deltaTime
    );
  }
  
  // ===========================================================================
  // VISUAL GENERATION
  // ===========================================================================
  
  /**
   * Update deck visual representation
   */
  updateDeckVisual(): void {
    if (!this.deck) {
      this.deckVisual = null;
      return;
    }
    
    const slotVisuals: DeckSlotVisual[] = [];
    const slotWidth = 80;
    const slotHeight = 100;
    const slotGap = 8;
    const slotsPerRow = 4;
    
    for (let i = 0; i < 8; i++) {
      const card = this.deck.getCard(i);
      
      const row = Math.floor(i / slotsPerRow);
      const col = i % slotsPerRow;
      
      const category = card?.category;
      const cardType: 'sampler' | 'wavetable' | 'hybrid' | 'effect' | 'empty' = 
        category === 'sampler' || category === 'wavetable' || category === 'hybrid' || category === 'effect'
          ? category
          : 'empty';
      
      slotVisuals.push({
        index: i,
        x: col * (slotWidth + slotGap),
        y: row * (slotHeight + slotGap),
        width: slotWidth,
        height: slotHeight,
        hasCard: card !== null,
        cardType,
        cardName: card?.name ?? '',
        state: card?.getState() ?? 'idle',
        midiActivity: 0,
        audioLevel: 0,
        isRevealed: this.state.revealedCardId === card?.id,
      });
    }
    
    this.deckVisual = {
      id: this.deck.id,
      name: this.deck.name,
      x: 0,
      y: 0,
      width: slotsPerRow * (slotWidth + slotGap) - slotGap,
      height: 2 * (slotHeight + slotGap) - slotGap + 40, // +40 for master meter
      rotation: 0,
      scale: 1,
      slots: slotVisuals,
      masterMeter: {
        x: 0,
        y: 2 * (slotHeight + slotGap),
        width: slotsPerRow * (slotWidth + slotGap) - slotGap,
        height: 32,
        orientation: 'horizontal',
        peakL: this.syncState.peakLevelL,
        peakR: this.syncState.peakLevelR,
        rmsL: this.syncState.rmsLevelL,
        rmsR: this.syncState.rmsLevelR,
        clipL: this.syncState.peakLevelL > 1,
        clipR: this.syncState.peakLevelR > 1,
      },
    };
  }
  
  /**
   * Get deck visual
   */
  getDeckVisual(): DeckVisual | null {
    return this.deckVisual;
  }
  
  /**
   * Get revealed card info
   */
  getRevealedCard(): HybridCard | null {
    if (!this.state.revealedCardId || !this.deck) return null;
    
    const cards = this.deck.getAllCards();
    const card = cards.find(c => c.id === this.state.revealedCardId);
    
    if (card instanceof HybridCard) {
      return card;
    }
    
    return null;
  }
  
  // ===========================================================================
  // ANIMATION
  // ===========================================================================
  
  private animateReveal(opening: boolean): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    const startProgress = this.state.revealProgress;
    const targetProgress = opening ? 1 : 0;
    const startTime = performance.now();
    const duration = this.config.animationDuration;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      let progress: number;
      
      if (this.config.enableSpringPhysics) {
        // Spring physics animation
        const t = Math.min(1, elapsed / duration);
        progress = this.calculateSpringProgress(startProgress, targetProgress, t);
      } else {
        // Easing animation
        const t = Math.min(1, elapsed / duration);
        const easedT = this.applyEasing(t);
        progress = startProgress + (targetProgress - startProgress) * easedT;
      }
      
      this.state.revealProgress = progress;
      
      if (elapsed < duration && Math.abs(progress - targetProgress) > 0.001) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.state.revealProgress = targetProgress;
        this.animationFrame = null;
        
        if (!opening) {
          this.state.isRevealed = false;
          this.state.revealedCardId = null;
          this.state.interactionType = null;
        }
      }
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  private calculateSpringProgress(start: number, target: number, t: number): number {
    const tension = this.config.springTension;
    const friction = this.config.springFriction;
    
    // Critically damped spring approximation
    const omega = Math.sqrt(tension);
    const zeta = friction / (2 * Math.sqrt(tension));
    
    const x = target - start;
    let progress: number;
    
    if (zeta < 1) {
      // Underdamped
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      progress = target - x * Math.exp(-zeta * omega * t) * 
        (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
    } else {
      // Overdamped or critically damped
      progress = target - x * Math.exp(-omega * t) * (1 + omega * t);
    }
    
    return progress;
  }
  
  private applyEasing(t: number): number {
    switch (this.config.easing) {
      case 'linear':
        return t;
      case 'ease':
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      case 'ease-in':
        return t * t * t;
      case 'ease-out':
        return 1 - Math.pow(1 - t, 3);
      case 'ease-in-out':
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t;
    }
  }
  
  // ===========================================================================
  // EVENTS
  // ===========================================================================
  
  addEventListener(type: DeckRevealEventType, listener: DeckRevealEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }
  
  removeEventListener(type: DeckRevealEventType, listener: DeckRevealEventListener): void {
    this.listeners.get(type)?.delete(listener);
  }
  
  private emit(event: DeckRevealEvent): void {
    this.listeners.get(event.type)?.forEach(listener => listener(event));
  }
  
  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================
  
  getConfig(): RevealConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<RevealConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  // ===========================================================================
  // DISPOSAL
  // ===========================================================================
  
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    this.listeners.clear();
    this.deck = null;
    this.deckVisual = null;
  }
}

// ============================================================================
// REVEAL PANEL RENDERER
// ============================================================================

/** Render context */
export interface RevealRenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  theme: RevealTheme;
}

/** Theme colors */
export interface RevealTheme {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentDim: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  shadow: string;
  meterGradient: string[];
  waveformColor: string;
  gridColor: string;
}

/** Default dark theme */
export const DARK_REVEAL_THEME: RevealTheme = {
  background: '#0d0d14',
  backgroundAlt: '#13131f',
  surface: '#1a1a2e',
  surfaceHover: '#252540',
  text: '#f0f0f5',
  textSecondary: '#8888aa',
  accent: '#6366f1',
  accentDim: '#4f46e5',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#333355',
  shadow: 'rgba(0, 0, 0, 0.5)',
  meterGradient: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'],
  waveformColor: '#6366f1',
  gridColor: '#252540',
};

/**
 * Render the deck visualization
 */
export function renderDeckVisual(
  ctx: RevealRenderContext,
  visual: DeckVisual,
  revealState: RevealState
): void {
  const { ctx: c, theme, dpr } = ctx;
  
  // Background
  c.fillStyle = theme.background;
  c.fillRect(0, 0, ctx.width * dpr, ctx.height * dpr);
  
  // Draw slots
  for (const slot of visual.slots) {
    renderSlot(ctx, slot, revealState);
  }
  
  // Draw master meter
  renderMeter(ctx, visual.masterMeter);
  
  // Draw deck name
  c.fillStyle = theme.text;
  c.font = `${14 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText(visual.name, 8 * dpr, (ctx.height - 8) * dpr);
}

/**
 * Render a single slot
 */
function renderSlot(
  ctx: RevealRenderContext,
  slot: DeckSlotVisual,
  _revealState: RevealState
): void {
  const { ctx: c, theme, dpr } = ctx;
  const x = slot.x * dpr;
  const y = slot.y * dpr;
  const w = slot.width * dpr;
  const h = slot.height * dpr;
  const r = 8 * dpr;
  
  // Slot background
  c.fillStyle = slot.isRevealed 
    ? theme.surfaceHover 
    : slot.hasCard 
      ? theme.surface 
      : theme.backgroundAlt;
  
  // Rounded rectangle
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
  
  // Border
  c.strokeStyle = slot.isRevealed ? theme.accent : theme.border;
  c.lineWidth = slot.isRevealed ? 2 * dpr : 1 * dpr;
  c.stroke();
  
  if (slot.hasCard) {
    // Card type indicator
    const typeColors: Record<string, string> = {
      sampler: '#22c55e',
      wavetable: '#6366f1',
      hybrid: '#f59e0b',
      effect: '#ec4899',
      empty: theme.textSecondary,
    };
    
    c.fillStyle = typeColors[slot.cardType] ?? theme.textSecondary;
    c.beginPath();
    c.arc(x + w - 12 * dpr, y + 12 * dpr, 4 * dpr, 0, Math.PI * 2);
    c.fill();
    
    // Card name
    c.fillStyle = theme.text;
    c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
    c.textAlign = 'center';
    const displayName = slot.cardName.length > 10 
      ? slot.cardName.substring(0, 9) + '…' 
      : slot.cardName;
    c.fillText(displayName, x + w / 2, y + h / 2);
    
    // State indicator
    const stateColors: Record<CardState, string> = {
      idle: theme.textSecondary,
      active: theme.success,
      bypassed: theme.warning,
      muted: theme.error,
      soloed: '#f59e0b',
    };
    
    c.fillStyle = stateColors[slot.state] ?? theme.textSecondary;
    c.beginPath();
    c.arc(x + 12 * dpr, y + h - 12 * dpr, 4 * dpr, 0, Math.PI * 2);
    c.fill();
    
    // MIDI activity indicator
    if (slot.midiActivity > 0) {
      c.fillStyle = `rgba(99, 102, 241, ${slot.midiActivity})`;
      c.beginPath();
      c.arc(x + w / 2, y + h - 12 * dpr, 6 * dpr, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    // Empty slot indicator
    c.fillStyle = theme.textSecondary;
    c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
    c.textAlign = 'center';
    c.fillText('Empty', x + w / 2, y + h / 2);
  }
}

/**
 * Render a meter
 */
function renderMeter(ctx: RevealRenderContext, meter: MeterVisual): void {
  const { ctx: c, theme, dpr } = ctx;
  const x = meter.x * dpr;
  const y = meter.y * dpr;
  const w = meter.width * dpr;
  const h = meter.height * dpr;
  const halfH = h / 2;
  
  // Background
  c.fillStyle = theme.backgroundAlt;
  c.fillRect(x, y, w, h);
  
  // Create gradient
  const gradient = c.createLinearGradient(x, 0, x + w, 0);
  const colors = theme.meterGradient;
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });
  
  // Left channel
  c.fillStyle = gradient;
  const leftWidth = Math.min(1, Math.max(0, meter.rmsL)) * w;
  c.fillRect(x, y, leftWidth, halfH - 1 * dpr);
  
  // Peak indicator L
  const peakPosL = Math.min(1, Math.max(0, meter.peakL)) * w;
  c.fillStyle = meter.clipL ? theme.error : theme.text;
  c.fillRect(x + peakPosL - 1 * dpr, y, 2 * dpr, halfH - 1 * dpr);
  
  // Right channel
  c.fillStyle = gradient;
  const rightWidth = Math.min(1, Math.max(0, meter.rmsR)) * w;
  c.fillRect(x, y + halfH + 1 * dpr, rightWidth, halfH - 1 * dpr);
  
  // Peak indicator R
  const peakPosR = Math.min(1, Math.max(0, meter.peakR)) * w;
  c.fillStyle = meter.clipR ? theme.error : theme.text;
  c.fillRect(x + peakPosR - 1 * dpr, y + halfH + 1 * dpr, 2 * dpr, halfH - 1 * dpr);
  
  // Center divider
  c.fillStyle = theme.border;
  c.fillRect(x, y + halfH - 0.5 * dpr, w, 1 * dpr);
}

/**
 * Render the reveal panel content
 */
export function renderRevealPanel(
  ctx: RevealRenderContext,
  card: HybridCard,
  syncState: SyncVisualization,
  config: RevealConfig
): void {
  const { ctx: c, theme, width, height, dpr } = ctx;
  
  // Panel background with blur effect simulation
  c.fillStyle = theme.background;
  c.fillRect(0, 0, width * dpr, height * dpr);
  
  // Header
  renderRevealHeader(ctx, card);
  
  let yOffset = 60 * dpr;
  
  // Waveform
  if (config.showWaveform && syncState.waveformData) {
    renderWaveformSection(ctx, syncState, yOffset, 120 * dpr);
    yOffset += 130 * dpr;
  }
  
  // Meters
  if (config.showMeters) {
    renderMetersSection(ctx, syncState, yOffset);
    yOffset += 60 * dpr;
  }
  
  // Macros
  if (config.showMacros) {
    renderMacrosSection(ctx, card, syncState, yOffset);
    yOffset += 100 * dpr;
  }
  
  // Modulation
  if (config.showModulation) {
    renderModulationSection(ctx, card, yOffset);
    yOffset += 120 * dpr;
  }
  
  // MIDI Activity
  if (config.showMIDIActivity) {
    renderMIDIActivitySection(ctx, syncState, yOffset);
    yOffset += 80 * dpr;
  }
  
  // Arpeggiator
  if (config.showArpeggiator) {
    renderArpeggiatorSection(ctx, card, yOffset);
    yOffset += 100 * dpr;
  }
}

function renderRevealHeader(ctx: RevealRenderContext, card: HybridCard): void {
  const { ctx: c, theme, width, dpr } = ctx;
  
  // Header background
  c.fillStyle = theme.surface;
  c.fillRect(0, 0, width * dpr, 50 * dpr);
  
  // Card name
  c.fillStyle = theme.text;
  c.font = `bold ${16 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText(card.name, 16 * dpr, 30 * dpr);
  
  // Hybrid mode badge
  const mode = card.getHybridMode();
  if (mode) {
    const modeText = mode.replace(/_/g, ' ').toUpperCase();
    c.fillStyle = theme.accent;
    c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
    c.textAlign = 'right';
    c.fillText(modeText, (width - 16) * dpr, 30 * dpr);
  }
  
  // Divider
  c.fillStyle = theme.border;
  c.fillRect(0, 49 * dpr, width * dpr, 1 * dpr);
}

function renderWaveformSection(
  ctx: RevealRenderContext,
  syncState: SyncVisualization,
  y: number,
  height: number
): void {
  const { ctx: c, theme, width, dpr } = ctx;
  
  // Section background
  c.fillStyle = theme.backgroundAlt;
  c.fillRect(8 * dpr, y, (width - 16) * dpr, height);
  
  // Waveform
  if (syncState.waveformData) {
    c.strokeStyle = theme.waveformColor;
    c.lineWidth = 1.5 * dpr;
    c.beginPath();
    
    const data = syncState.waveformData;
    const centerY = y + height / 2;
    const amplitude = height * 0.4;
    const step = (width - 16) / data.length;
    
    for (let i = 0; i < data.length; i++) {
      const x = (8 + i * step) * dpr;
      const sample = data[i] ?? 0;
      const yPos = centerY - sample * amplitude;
      
      if (i === 0) {
        c.moveTo(x, yPos);
      } else {
        c.lineTo(x, yPos);
      }
    }
    
    c.stroke();
    
    // Playhead
    const playheadX = (8 + syncState.waveformPosition * (width - 16)) * dpr;
    c.strokeStyle = theme.accent;
    c.lineWidth = 2 * dpr;
    c.beginPath();
    c.moveTo(playheadX, y);
    c.lineTo(playheadX, y + height);
    c.stroke();
  }
  
  // Center line
  c.strokeStyle = theme.gridColor;
  c.lineWidth = 1 * dpr;
  c.beginPath();
  c.moveTo(8 * dpr, y + height / 2);
  c.lineTo((width - 8) * dpr, y + height / 2);
  c.stroke();
}

function renderMetersSection(
  ctx: RevealRenderContext,
  syncState: SyncVisualization,
  y: number
): void {
  const { ctx: c, theme, width, dpr } = ctx;
  
  // Label
  c.fillStyle = theme.textSecondary;
  c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText('OUTPUT', 16 * dpr, y + 12 * dpr);
  
  // Meter
  renderMeter(ctx, {
    x: 16,
    y: (y / dpr) + 20,
    width: width - 32,
    height: 24,
    orientation: 'horizontal',
    peakL: syncState.peakLevelL,
    peakR: syncState.peakLevelR,
    rmsL: syncState.rmsLevelL,
    rmsR: syncState.rmsLevelR,
    clipL: syncState.peakLevelL > 1,
    clipR: syncState.peakLevelR > 1,
  });
}

function renderMacrosSection(
  ctx: RevealRenderContext,
  card: HybridCard,
  syncState: SyncVisualization,
  y: number
): void {
  const { ctx: c, theme, width, dpr } = ctx;
  
  // Label
  c.fillStyle = theme.textSecondary;
  c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText('MACROS', 16 * dpr, y + 12 * dpr);
  
  // Draw 8 macro knobs
  const knobSize = 40;
  const knobGap = ((width - 32) - knobSize * 4) / 3;
  
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const kx = (16 + col * (knobSize + knobGap)) * dpr;
    const ky = (y / dpr + 20 + row * (knobSize + 8)) * dpr;
    
    const value = syncState.macroValues[i] ?? 0;
    const config = card.getMacroConfig(i);
    
    renderKnob(ctx, kx, ky, knobSize * dpr, value, config?.name ?? `M${i + 1}`);
  }
}

function renderKnob(
  ctx: RevealRenderContext,
  x: number,
  y: number,
  size: number,
  value: number,
  label: string
): void {
  const { ctx: c, theme, dpr } = ctx;
  const radius = size / 2 - 4 * dpr;
  const cx = x + size / 2;
  const cy = y + size / 2 - 6 * dpr;
  
  // Background circle
  c.fillStyle = theme.surface;
  c.beginPath();
  c.arc(cx, cy, radius, 0, Math.PI * 2);
  c.fill();
  
  // Value arc
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const valueAngle = startAngle + (endAngle - startAngle) * value;
  
  c.strokeStyle = theme.accent;
  c.lineWidth = 3 * dpr;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(cx, cy, radius - 4 * dpr, startAngle, valueAngle);
  c.stroke();
  
  // Indicator line
  c.strokeStyle = theme.text;
  c.lineWidth = 2 * dpr;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(
    cx + Math.cos(valueAngle) * (radius - 10 * dpr),
    cy + Math.sin(valueAngle) * (radius - 10 * dpr)
  );
  c.stroke();
  
  // Label
  c.fillStyle = theme.textSecondary;
  c.font = `${8 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'center';
  c.fillText(label, cx, y + size - 2 * dpr);
}

function renderModulationSection(
  ctx: RevealRenderContext,
  card: HybridCard,
  y: number
): void {
  const { ctx: c, theme, width, dpr } = ctx;
  
  // Label
  c.fillStyle = theme.textSecondary;
  c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText('MODULATION MATRIX', 16 * dpr, y + 12 * dpr);
  
  const mods = card.getModulations();
  
  if (mods.length === 0) {
    c.fillStyle = theme.textSecondary;
    c.font = `italic ${10 * dpr}px Inter, system-ui, sans-serif`;
    c.fillText('No modulation routes', 16 * dpr, y + 40 * dpr);
    return;
  }
  
  // Draw modulation routes
  for (let i = 0; i < Math.min(4, mods.length); i++) {
    const mod = mods[i];
    if (!mod) continue;
    
    const my = y + 24 * dpr + i * 22 * dpr;
    
    // Source
    c.fillStyle = theme.text;
    c.font = `${9 * dpr}px Inter, system-ui, sans-serif`;
    c.textAlign = 'left';
    c.fillText(mod.source, 16 * dpr, my);
    
    // Arrow
    c.fillStyle = theme.accent;
    c.fillText('→', 80 * dpr, my);
    
    // Destination
    c.fillStyle = theme.text;
    c.fillText(mod.destination, 100 * dpr, my);
    
    // Amount bar
    const barX = 200 * dpr;
    const barY = my - 8 * dpr;
    const barW = (width - 200 - 16) * dpr;
    const barH = 4 * dpr;
    
    c.fillStyle = theme.backgroundAlt;
    c.fillRect(barX, barY, barW, barH);
    
    c.fillStyle = mod.amount >= 0 ? theme.accent : theme.warning;
    c.fillRect(barX, barY, barW * Math.abs(mod.amount), barH);
  }
}

function renderMIDIActivitySection(
  ctx: RevealRenderContext,
  syncState: SyncVisualization,
  y: number
): void {
  const { ctx: c, theme, width, dpr } = ctx;
  
  // Label
  c.fillStyle = theme.textSecondary;
  c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText('MIDI ACTIVITY', 16 * dpr, y + 12 * dpr);
  
  // Mini keyboard
  const keyWidth = (width - 32) / 24;
  const keyHeight = 40;
  const startNote = 48; // C3
  
  for (let i = 0; i < 24; i++) {
    const note = startNote + i;
    const noteInOctave = note % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
    
    const kx = (16 + i * keyWidth) * dpr;
    const ky = (y / dpr + 20) * dpr;
    const kw = keyWidth * dpr - 1 * dpr;
    const kh = keyHeight * dpr;
    
    // Key background
    const isActive = syncState.activeNotes.has(note);
    if (isBlack) {
      c.fillStyle = isActive ? theme.accent : '#333';
      c.fillRect(kx, ky, kw, kh * 0.65);
    } else {
      c.fillStyle = isActive ? theme.accent : '#eee';
      c.fillRect(kx, ky, kw, kh);
    }
  }
}

function renderArpeggiatorSection(
  ctx: RevealRenderContext,
  card: HybridCard,
  y: number
): void {
  const { ctx: c, theme, width, dpr } = ctx;
  
  const arp = card.getArpeggiator();
  const arpConfig = arp.getConfig();
  
  // Label
  c.fillStyle = theme.textSecondary;
  c.font = `${10 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText('ARPEGGIATOR', 16 * dpr, y + 12 * dpr);
  
  // Status badge
  c.fillStyle = arpConfig.enabled ? theme.success : theme.textSecondary;
  c.font = `${9 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'right';
  c.fillText(arpConfig.enabled ? 'ON' : 'OFF', (width - 16) * dpr, y + 12 * dpr);
  
  // Mode
  c.fillStyle = theme.text;
  c.font = `${11 * dpr}px Inter, system-ui, sans-serif`;
  c.textAlign = 'left';
  c.fillText(`Mode: ${arpConfig.mode.toUpperCase()}`, 16 * dpr, y + 32 * dpr);
  
  // Rate
  c.fillText(`Rate: 1/${arpConfig.rate}`, 16 * dpr, y + 48 * dpr);
  
  // Octaves
  c.fillText(`Octaves: ${arpConfig.octaves}`, 16 * dpr, y + 64 * dpr);
  
  // Gate
  c.fillText(`Gate: ${Math.round(arpConfig.gate * 100)}%`, (width / 2) * dpr, y + 32 * dpr);
}

// ============================================================================
// FACTORY
// ============================================================================

export function createDeckRevealController(config?: Partial<RevealConfig>): DeckRevealController {
  return new DeckRevealController(config);
}

export function createRevealRenderContext(
  canvas: HTMLCanvasElement,
  theme?: RevealTheme
): RevealRenderContext {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2D context');
  
  const dpr = window.devicePixelRatio ?? 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  return {
    canvas,
    ctx,
    width: rect.width,
    height: rect.height,
    dpr,
    theme: theme ?? DARK_REVEAL_THEME,
  };
}
