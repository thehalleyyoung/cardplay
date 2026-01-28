/**
 * @fileoverview Frame Compositor for Video Generation.
 * 
 * This module composites all UI layers into individual frames for video export.
 * It renders the complete CardPlay interface state at any given timestamp.
 * 
 * Layers (bottom to top):
 * 1. Background / Grid
 * 2. Connections (cables between cards)
 * 3. Stacks (containers)
 * 4. Cards (positioned within stacks or freeform)
 * 5. Reveal panels
 * 6. Visualizations (meters, waveforms, MIDI)
 * 7. Drag ghosts / previews
 * 8. Cursor
 * 9. Visual effects (ripples, trails)
 * 10. Annotations / overlays
 * 11. Tutorial highlights
 * 
 * @see interaction-recorder.ts for playback state
 * @see layout-bridge.ts for layout/position types
 */

import type {
  PlaybackState,
  VisualEffect,
  AnnotationAction,
} from './interaction-recorder';
import type { DeckLayout, StackConfig, CardPosition } from '../layout-bridge';
import { DARK_VIZ_COLORS } from '../visualization-bridge';

// ============================================================================
// FRAME CONFIGURATION
// ============================================================================

/**
 * Frame rendering configuration.
 */
export interface FrameConfig {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
  readonly backgroundColor: string;
  readonly theme: CompositorTheme;
  readonly showGrid: boolean;
  readonly showCursor: boolean;
  readonly showAnnotations: boolean;
  readonly showEffects: boolean;
  readonly antiAlias: boolean;
}

/**
 * Default frame configuration.
 */
export const DEFAULT_FRAME_CONFIG: FrameConfig = {
  width: 1920,
  height: 1080,
  pixelRatio: 1,
  backgroundColor: '#1a1a2e',
  theme: 'dark',
  showGrid: true,
  showCursor: true,
  showAnnotations: true,
  showEffects: true,
  antiAlias: true,
};

/**
 * Compositor theme.
 */
export type CompositorTheme = 'dark' | 'light' | 'high-contrast';

// ============================================================================
// LAYER RENDERERS
// ============================================================================

/**
 * Layer render context.
 */
export interface LayerContext {
  readonly ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  readonly config: FrameConfig;
  readonly state: PlaybackState;
  readonly time: number;
  readonly layout: DeckLayout;
  readonly colors: CompositorColors;
}

/**
 * Compositor color palette.
 */
export interface CompositorColors {
  readonly background: string;
  readonly gridLine: string;
  readonly gridLineMinor: string;
  readonly stackHeader: string;
  readonly stackBorder: string;
  readonly stackBackground: string;
  readonly cardBackground: string;
  readonly cardBorder: string;
  readonly cardBorderSelected: string;
  readonly cardHeader: string;
  readonly cardHeaderText: string;
  readonly connectionAudio: string;
  readonly connectionMidi: string;
  readonly connectionModulation: string;
  readonly portFill: string;
  readonly portStroke: string;
  readonly cursorFill: string;
  readonly cursorStroke: string;
  readonly rippleColor: string;
  readonly annotationBackground: string;
  readonly annotationText: string;
  readonly annotationBorder: string;
  readonly highlightColor: string;
}

/**
 * Dark theme colors.
 */
export const DARK_COMPOSITOR_COLORS: CompositorColors = {
  background: '#1a1a2e',
  gridLine: '#2a2a3e',
  gridLineMinor: '#222233',
  stackHeader: '#3a3a4e',
  stackBorder: '#4a4a5e',
  stackBackground: '#252538',
  cardBackground: '#2a2a3e',
  cardBorder: '#3a3a4e',
  cardBorderSelected: '#3b82f6',
  cardHeader: '#333348',
  cardHeaderText: '#ffffff',
  connectionAudio: '#22c55e',
  connectionMidi: '#3b82f6',
  connectionModulation: '#f59e0b',
  portFill: '#4a4a5e',
  portStroke: '#6a6a7e',
  cursorFill: '#ffffff',
  cursorStroke: '#000000',
  rippleColor: 'rgba(59, 130, 246, 0.4)',
  annotationBackground: 'rgba(42, 42, 62, 0.95)',
  annotationText: '#ffffff',
  annotationBorder: '#3b82f6',
  highlightColor: 'rgba(59, 130, 246, 0.3)',
};

/**
 * Light theme colors.
 */
export const LIGHT_COMPOSITOR_COLORS: CompositorColors = {
  background: '#f8fafc',
  gridLine: '#e2e8f0',
  gridLineMinor: '#f1f5f9',
  stackHeader: '#e2e8f0',
  stackBorder: '#cbd5e1',
  stackBackground: '#ffffff',
  cardBackground: '#ffffff',
  cardBorder: '#e2e8f0',
  cardBorderSelected: '#2563eb',
  cardHeader: '#f1f5f9',
  cardHeaderText: '#1e293b',
  connectionAudio: '#16a34a',
  connectionMidi: '#2563eb',
  connectionModulation: '#d97706',
  portFill: '#e2e8f0',
  portStroke: '#94a3b8',
  cursorFill: '#1e293b',
  cursorStroke: '#ffffff',
  rippleColor: 'rgba(37, 99, 235, 0.3)',
  annotationBackground: 'rgba(255, 255, 255, 0.95)',
  annotationText: '#1e293b',
  annotationBorder: '#2563eb',
  highlightColor: 'rgba(37, 99, 235, 0.2)',
};

/**
 * Get colors for theme.
 */
export function getCompositorColors(theme: CompositorTheme): CompositorColors {
  switch (theme) {
    case 'light':
      return LIGHT_COMPOSITOR_COLORS;
    case 'high-contrast':
      return {
        ...DARK_COMPOSITOR_COLORS,
        background: '#000000',
        gridLine: '#ffffff',
        cardBorderSelected: '#ffff00',
        highlightColor: 'rgba(255, 255, 0, 0.3)',
      };
    default:
      return DARK_COMPOSITOR_COLORS;
  }
}

// ============================================================================
// FRAME COMPOSITOR
// ============================================================================

/**
 * Main frame compositor class.
 */
export class FrameCompositor {
  private config: FrameConfig;
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private colors: CompositorColors;

  constructor(config: Partial<FrameConfig> = {}) {
    this.config = { ...DEFAULT_FRAME_CONFIG, ...config };
    this.colors = getCompositorColors(this.config.theme);

    const width = this.config.width * this.config.pixelRatio;
    const height = this.config.height * this.config.pixelRatio;

    this.canvas = new OffscreenCanvas(width, height);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D context');
    this.ctx = ctx;

    if (this.config.pixelRatio !== 1) {
      this.ctx.scale(this.config.pixelRatio, this.config.pixelRatio);
    }
  }

  /**
   * Render a single frame at the given playback state.
   */
  renderFrame(state: PlaybackState): ImageBitmap {
    const layerCtx: LayerContext = {
      ctx: this.ctx,
      config: this.config,
      state,
      time: state.currentTime,
      layout: state.sequence.layout,
      colors: this.colors,
    };

    // Clear canvas
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Render layers
    this.renderGrid(layerCtx);
    this.renderConnections(layerCtx);
    this.renderStacks(layerCtx);
    this.renderCards(layerCtx);
    this.renderRevealPanel(layerCtx);
    this.renderVisualEffects(layerCtx);
    
    if (this.config.showCursor) {
      this.renderCursor(layerCtx);
    }
    
    if (this.config.showAnnotations) {
      this.renderAnnotations(layerCtx);
    }

    return this.canvas.transferToImageBitmap();
  }

  /**
   * Render grid layer.
   */
  private renderGrid(ctx: LayerContext): void {
    if (!ctx.layout.showGrid) return;

    const { width, height } = ctx.config;
    const gridSize = ctx.layout.gridSize;

    ctx.ctx.strokeStyle = ctx.colors.gridLineMinor;
    ctx.ctx.lineWidth = 0.5;

    // Minor grid lines
    ctx.ctx.beginPath();
    for (let x = 0; x < width; x += gridSize) {
      ctx.ctx.moveTo(x, 0);
      ctx.ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.ctx.moveTo(0, y);
      ctx.ctx.lineTo(width, y);
    }
    ctx.ctx.stroke();

    // Major grid lines (every 4th)
    ctx.ctx.strokeStyle = ctx.colors.gridLine;
    ctx.ctx.lineWidth = 1;
    ctx.ctx.beginPath();
    for (let x = 0; x < width; x += gridSize * 4) {
      ctx.ctx.moveTo(x, 0);
      ctx.ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize * 4) {
      ctx.ctx.moveTo(0, y);
      ctx.ctx.lineTo(width, y);
    }
    ctx.ctx.stroke();
  }

  /**
   * Render connections between cards.
   */
  private renderConnections(ctx: LayerContext): void {
    if (!ctx.layout.showConnections) return;

    // Demo connections based on layout defaults
    // In a real implementation, this would come from the deck state
    const connections = this.getDemoConnections(ctx);

    for (const conn of connections) {
      this.renderConnection(ctx, conn);
    }
  }

  /**
   * Get demo connections for rendering.
   */
  private getDemoConnections(ctx: LayerContext): readonly ConnectionRenderData[] {
    // Create sample connections based on stacks
    const connections: ConnectionRenderData[] = [];
    const stacks = ctx.layout.stacks;

    for (let i = 0; i < stacks.length - 1; i++) {
      const fromStack = stacks[i];
      const toStack = stacks[i + 1];

      if (fromStack && toStack) {
        connections.push({
          fromX: fromStack.x + fromStack.width,
          fromY: fromStack.y + fromStack.height / 2,
          toX: toStack.x,
          toY: toStack.y + toStack.height / 2,
          type: 'audio',
          animated: ctx.state.isPlaying,
        });
      }
    }

    return connections;
  }

  /**
   * Connection render data.
   */
  private renderConnection(ctx: LayerContext, conn: ConnectionRenderData): void {
    const { fromX, fromY, toX, toY, type, animated } = conn;

    // Bezier control points
    const midX = (fromX + toX) / 2;
    const cp1x = midX;
    const cp1y = fromY;
    const cp2x = midX;
    const cp2y = toY;

    // Connection color
    let color = ctx.colors.connectionAudio;
    if (type === 'midi') color = ctx.colors.connectionMidi;
    if (type === 'modulation') color = ctx.colors.connectionModulation;

    // Draw cable
    ctx.ctx.strokeStyle = color;
    ctx.ctx.lineWidth = 2;
    ctx.ctx.lineCap = 'round';

    ctx.ctx.beginPath();
    ctx.ctx.moveTo(fromX, fromY);
    ctx.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toX, toY);
    ctx.ctx.stroke();

    // Draw flow particles if animated
    if (animated) {
      const numParticles = 3;
      const particleProgress = (ctx.time % 1000) / 1000;

      for (let i = 0; i < numParticles; i++) {
        const t = (particleProgress + i / numParticles) % 1;
        const pos = this.getBezierPoint(fromX, fromY, cp1x, cp1y, cp2x, cp2y, toX, toY, t);

        ctx.ctx.fillStyle = color;
        ctx.ctx.beginPath();
        ctx.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.ctx.fill();
      }
    }

    // Draw ports
    this.renderPort(ctx, fromX, fromY);
    this.renderPort(ctx, toX, toY);
  }

  /**
   * Get point on bezier curve.
   */
  private getBezierPoint(
    x1: number, y1: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x2: number, y2: number,
    t: number
  ): { x: number; y: number } {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * x1 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * x2,
      y: mt3 * y1 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * y2,
    };
  }

  /**
   * Render a port indicator.
   */
  private renderPort(ctx: LayerContext, x: number, y: number): void {
    ctx.ctx.fillStyle = ctx.colors.portFill;
    ctx.ctx.strokeStyle = ctx.colors.portStroke;
    ctx.ctx.lineWidth = 2;

    ctx.ctx.beginPath();
    ctx.ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.ctx.fill();
    ctx.ctx.stroke();
  }

  /**
   * Render stacks.
   */
  private renderStacks(ctx: LayerContext): void {
    const collapsedStacks = new Set(ctx.state.sequence.initialState.collapsedStacks);

    for (const stack of ctx.layout.stacks) {
      this.renderStack(ctx, stack, collapsedStacks.has(stack.id));
    }
  }

  /**
   * Render a single stack.
   */
  private renderStack(ctx: LayerContext, stack: StackConfig, collapsed: boolean): void {
    const { x, y, width, height, name, icon, color } = stack;
    const headerHeight = 32;

    // Stack background
    ctx.ctx.fillStyle = ctx.colors.stackBackground;
    ctx.ctx.strokeStyle = ctx.colors.stackBorder;
    ctx.ctx.lineWidth = 1;

    this.roundRect(ctx.ctx, x, y, width, collapsed ? headerHeight : height, 8);
    ctx.ctx.fill();
    ctx.ctx.stroke();

    // Stack header
    ctx.ctx.fillStyle = color || ctx.colors.stackHeader;
    this.roundRect(ctx.ctx, x, y, width, headerHeight, [8, 8, 0, 0]);
    ctx.ctx.fill();

    // Stack name
    ctx.ctx.fillStyle = ctx.colors.cardHeaderText;
    ctx.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.ctx.textBaseline = 'middle';
    ctx.ctx.fillText(`${icon} ${name}`, x + 12, y + headerHeight / 2);

    // Collapse indicator
    const chevron = collapsed ? '▶' : '▼';
    ctx.ctx.fillText(chevron, x + width - 24, y + headerHeight / 2);
  }

  /**
   * Render cards.
   */
  private renderCards(ctx: LayerContext): void {
    const cards = ctx.state.sequence.initialState.cards;
    const selected = new Set(ctx.state.sequence.initialState.selectedCardIds);

    for (const card of cards) {
      this.renderCard(ctx, card, selected.has(card.cardId));
    }
  }

  /**
   * Render a single card.
   */
  private renderCard(ctx: LayerContext, card: CardPosition, selected: boolean): void {
    const { x, y, width, height } = card;
    const headerHeight = 28;

    // Card shadow
    ctx.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.ctx.shadowBlur = 8;
    ctx.ctx.shadowOffsetY = 2;

    // Card background
    ctx.ctx.fillStyle = ctx.colors.cardBackground;
    ctx.ctx.strokeStyle = selected ? ctx.colors.cardBorderSelected : ctx.colors.cardBorder;
    ctx.ctx.lineWidth = selected ? 2 : 1;

    this.roundRect(ctx.ctx, x, y, width, height, 6);
    ctx.ctx.fill();
    ctx.ctx.stroke();

    // Reset shadow
    ctx.ctx.shadowColor = 'transparent';
    ctx.ctx.shadowBlur = 0;
    ctx.ctx.shadowOffsetY = 0;

    // Card header
    ctx.ctx.fillStyle = ctx.colors.cardHeader;
    this.roundRect(ctx.ctx, x, y, width, headerHeight, [6, 6, 0, 0]);
    ctx.ctx.fill();

    // Card title (placeholder)
    ctx.ctx.fillStyle = ctx.colors.cardHeaderText;
    ctx.ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.ctx.textBaseline = 'middle';
    ctx.ctx.fillText(`Card ${card.cardId}`, x + 8, y + headerHeight / 2);

    // Input/output ports
    this.renderPort(ctx, x, y + height / 2);
    this.renderPort(ctx, x + width, y + height / 2);

    // Mini visualization placeholder
    this.renderMiniVisualization(ctx, x + 8, y + headerHeight + 8, width - 16, height - headerHeight - 16);
  }

  /**
   * Render a mini visualization inside a card.
   */
  private renderMiniVisualization(ctx: LayerContext, x: number, y: number, width: number, height: number): void {
    // Simple waveform visualization
    ctx.ctx.strokeStyle = DARK_VIZ_COLORS.waveformForeground;
    ctx.ctx.lineWidth = 1;
    ctx.ctx.beginPath();

    const centerY = y + height / 2;
    const amplitude = height * 0.3;

    for (let i = 0; i <= width; i++) {
      const progress = i / width;
      const wave = Math.sin(progress * Math.PI * 4 + ctx.time / 200) * amplitude;
      
      if (i === 0) {
        ctx.ctx.moveTo(x + i, centerY + wave);
      } else {
        ctx.ctx.lineTo(x + i, centerY + wave);
      }
    }

    ctx.ctx.stroke();
  }

  /**
   * Render reveal panel (if any).
   */
  private renderRevealPanel(ctx: LayerContext): void {
    const revealedCardId = ctx.state.sequence.initialState.revealedCardId;
    if (!revealedCardId) return;

    // Find the revealed card
    const card = ctx.state.sequence.initialState.cards.find(c => c.cardId === revealedCardId);
    if (!card) return;

    // Panel dimensions
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = card.x + card.width + 16;
    const panelY = card.y;

    // Panel background
    ctx.ctx.fillStyle = ctx.colors.cardBackground;
    ctx.ctx.strokeStyle = ctx.colors.cardBorder;
    ctx.ctx.lineWidth = 1;
    ctx.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.ctx.shadowBlur = 16;
    ctx.ctx.shadowOffsetY = 4;

    this.roundRect(ctx.ctx, panelX, panelY, panelWidth, panelHeight, 8);
    ctx.ctx.fill();
    ctx.ctx.stroke();

    ctx.ctx.shadowColor = 'transparent';
    ctx.ctx.shadowBlur = 0;

    // Panel header
    ctx.ctx.fillStyle = ctx.colors.cardHeader;
    this.roundRect(ctx.ctx, panelX, panelY, panelWidth, 32, [8, 8, 0, 0]);
    ctx.ctx.fill();

    ctx.ctx.fillStyle = ctx.colors.cardHeaderText;
    ctx.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.ctx.fillText('Editor Panel', panelX + 12, panelY + 20);

    // Placeholder controls
    this.renderKnobsRow(ctx, panelX + 20, panelY + 50, 4);
    this.renderSliderRow(ctx, panelX + 20, panelY + 130, 4);
    this.renderMeterRow(ctx, panelX + 20, panelY + 200, 4);
  }

  /**
   * Render a row of knobs.
   */
  private renderKnobsRow(ctx: LayerContext, x: number, y: number, count: number): void {
    const spacing = 80;
    const radius = 24;

    for (let i = 0; i < count; i++) {
      const kx = x + i * spacing + radius;
      const ky = y + radius;

      // Knob background
      ctx.ctx.fillStyle = ctx.colors.stackBackground;
      ctx.ctx.beginPath();
      ctx.ctx.arc(kx, ky, radius, 0, Math.PI * 2);
      ctx.ctx.fill();

      // Knob arc
      const value = 0.3 + Math.sin(ctx.time / 1000 + i) * 0.3;
      const startAngle = Math.PI * 0.75;
      const endAngle = startAngle + value * Math.PI * 1.5;

      ctx.ctx.strokeStyle = ctx.colors.cardBorderSelected;
      ctx.ctx.lineWidth = 4;
      ctx.ctx.lineCap = 'round';
      ctx.ctx.beginPath();
      ctx.ctx.arc(kx, ky, radius - 6, startAngle, endAngle);
      ctx.ctx.stroke();

      // Indicator dot
      const dotAngle = endAngle;
      const dotX = kx + Math.cos(dotAngle) * (radius - 6);
      const dotY = ky + Math.sin(dotAngle) * (radius - 6);
      ctx.ctx.fillStyle = ctx.colors.cardBorderSelected;
      ctx.ctx.beginPath();
      ctx.ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.ctx.fill();
    }
  }

  /**
   * Render a row of sliders.
   */
  private renderSliderRow(ctx: LayerContext, x: number, y: number, count: number): void {
    const spacing = 80;
    const width = 60;
    const height = 8;

    for (let i = 0; i < count; i++) {
      const sx = x + i * spacing;
      const value = 0.3 + Math.sin(ctx.time / 800 + i * 0.5) * 0.3;

      // Track
      ctx.ctx.fillStyle = ctx.colors.stackBackground;
      this.roundRect(ctx.ctx, sx, y, width, height, 4);
      ctx.ctx.fill();

      // Fill
      ctx.ctx.fillStyle = ctx.colors.cardBorderSelected;
      this.roundRect(ctx.ctx, sx, y, width * value, height, [4, 0, 0, 4]);
      ctx.ctx.fill();

      // Handle
      const handleX = sx + width * value;
      ctx.ctx.fillStyle = '#ffffff';
      ctx.ctx.beginPath();
      ctx.ctx.arc(handleX, y + height / 2, 8, 0, Math.PI * 2);
      ctx.ctx.fill();
    }
  }

  /**
   * Render a row of meters.
   */
  private renderMeterRow(ctx: LayerContext, x: number, y: number, count: number): void {
    const spacing = 80;
    const width = 16;
    const height = 60;

    for (let i = 0; i < count; i++) {
      const mx = x + i * spacing;
      const level = 0.3 + Math.sin(ctx.time / 100 + i * 0.7) * 0.4;

      // Background
      ctx.ctx.fillStyle = ctx.colors.stackBackground;
      this.roundRect(ctx.ctx, mx, y, width, height, 2);
      ctx.ctx.fill();

      // Level gradient
      const gradient = ctx.ctx.createLinearGradient(mx, y + height, mx, y);
      gradient.addColorStop(0, DARK_VIZ_COLORS.meterGreen);
      gradient.addColorStop(0.6, DARK_VIZ_COLORS.meterGreen);
      gradient.addColorStop(0.8, DARK_VIZ_COLORS.meterYellow);
      gradient.addColorStop(1, DARK_VIZ_COLORS.meterRed);

      ctx.ctx.fillStyle = gradient;
      const levelHeight = height * level;
      this.roundRect(ctx.ctx, mx, y + height - levelHeight, width, levelHeight, [0, 0, 2, 2]);
      ctx.ctx.fill();
    }
  }

  /**
   * Render visual effects (ripples, trails, etc).
   */
  private renderVisualEffects(ctx: LayerContext): void {
    if (!ctx.config.showEffects) return;

    for (const effect of ctx.state.visualEffects) {
      switch (effect.type) {
        case 'click-ripple':
          this.renderClickRipple(ctx, effect);
          break;
        case 'key-indicator':
          this.renderKeyIndicator(ctx, effect);
          break;
        case 'drag-ghost':
          this.renderDragGhost(ctx, effect);
          break;
        case 'hover-glow':
          this.renderHoverGlow(ctx, effect);
          break;
      }
    }
  }

  /**
   * Render click ripple effect.
   */
  private renderClickRipple(ctx: LayerContext, effect: VisualEffect): void {
    const progress = effect.data.progress as number;
    const { x, y } = effect.position;
    const maxRadius = 40;
    const radius = maxRadius * progress;
    const opacity = 1 - progress;

    ctx.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
    ctx.ctx.lineWidth = 2;
    ctx.ctx.beginPath();
    ctx.ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.ctx.stroke();

    // Inner solid circle
    const innerRadius = 8 * (1 - progress);
    ctx.ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.5})`;
    ctx.ctx.beginPath();
    ctx.ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
    ctx.ctx.fill();
  }

  /**
   * Render key indicator.
   */
  private renderKeyIndicator(ctx: LayerContext, effect: VisualEffect): void {
    const { key, modifiers, progress } = effect.data as {
      key: string;
      modifiers: { shift: boolean; ctrl: boolean; alt: boolean; meta: boolean };
      progress: number;
    };

    const opacity = progress < 0.8 ? 1 : 1 - (progress - 0.8) / 0.2;
    const { x, y } = effect.position;

    // Build key string
    const parts: string[] = [];
    if (modifiers.meta) parts.push('⌘');
    if (modifiers.ctrl) parts.push('⌃');
    if (modifiers.alt) parts.push('⌥');
    if (modifiers.shift) parts.push('⇧');
    parts.push(key.toUpperCase());
    const keyString = parts.join('');

    // Background pill
    ctx.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    const textWidth = ctx.ctx.measureText(keyString).width;
    const padding = 12;
    const pillWidth = textWidth + padding * 2;
    const pillHeight = 32;

    ctx.ctx.fillStyle = `rgba(42, 42, 62, ${opacity * 0.95})`;
    ctx.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
    ctx.ctx.lineWidth = 2;
    this.roundRect(ctx.ctx, x, y, pillWidth, pillHeight, 6);
    ctx.ctx.fill();
    ctx.ctx.stroke();

    // Key text
    ctx.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.ctx.textBaseline = 'middle';
    ctx.ctx.fillText(keyString, x + padding, y + pillHeight / 2);
  }

  /**
   * Render drag ghost.
   */
  private renderDragGhost(ctx: LayerContext, effect: VisualEffect): void {
    const { x, y } = effect.position;
    const width = 100;
    const height = 60;

    ctx.ctx.globalAlpha = 0.6;
    ctx.ctx.fillStyle = ctx.colors.cardBackground;
    ctx.ctx.strokeStyle = ctx.colors.cardBorderSelected;
    ctx.ctx.lineWidth = 2;
    ctx.ctx.setLineDash([4, 4]);

    this.roundRect(ctx.ctx, x - width / 2, y - height / 2, width, height, 6);
    ctx.ctx.fill();
    ctx.ctx.stroke();

    ctx.ctx.setLineDash([]);
    ctx.ctx.globalAlpha = 1;
  }

  /**
   * Render hover glow.
   */
  private renderHoverGlow(ctx: LayerContext, effect: VisualEffect): void {
    const { x, y } = effect.position;
    const radius = 30;
    const progress = effect.data.progress as number ?? 0.5;

    const gradient = ctx.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(59, 130, 246, ${0.3 * progress})`);
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.ctx.fillStyle = gradient;
    ctx.ctx.beginPath();
    ctx.ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.ctx.fill();
  }

  /**
   * Render cursor.
   */
  private renderCursor(ctx: LayerContext): void {
    const { x, y } = ctx.state.cursorPosition;

    // Cursor shadow
    ctx.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.ctx.beginPath();
    ctx.ctx.moveTo(x + 1, y + 1);
    ctx.ctx.lineTo(x + 1, y + 21);
    ctx.ctx.lineTo(x + 6, y + 16);
    ctx.ctx.lineTo(x + 11, y + 21);
    ctx.ctx.lineTo(x + 14, y + 18);
    ctx.ctx.lineTo(x + 9, y + 13);
    ctx.ctx.lineTo(x + 15, y + 13);
    ctx.ctx.closePath();
    ctx.ctx.fill();

    // Cursor body (white fill, black stroke)
    ctx.ctx.fillStyle = ctx.colors.cursorFill;
    ctx.ctx.strokeStyle = ctx.colors.cursorStroke;
    ctx.ctx.lineWidth = 1;

    ctx.ctx.beginPath();
    ctx.ctx.moveTo(x, y);
    ctx.ctx.lineTo(x, y + 20);
    ctx.ctx.lineTo(x + 5, y + 15);
    ctx.ctx.lineTo(x + 10, y + 20);
    ctx.ctx.lineTo(x + 13, y + 17);
    ctx.ctx.lineTo(x + 8, y + 12);
    ctx.ctx.lineTo(x + 14, y + 12);
    ctx.ctx.closePath();
    ctx.ctx.fill();
    ctx.ctx.stroke();
  }

  /**
   * Render annotations.
   */
  private renderAnnotations(ctx: LayerContext): void {
    for (const annotation of ctx.state.activeAnnotations) {
      this.renderAnnotation(ctx, annotation);
    }
  }

  /**
   * Render a single annotation.
   */
  private renderAnnotation(ctx: LayerContext, annotation: AnnotationAction): void {
    const { text, position, style, targetPosition } = annotation;
    const { x, y } = position;

    // Calculate fade based on time
    const elapsed = ctx.time - annotation.timestamp;
    const fadeIn = Math.min(1, elapsed / 200);
    const fadeOut = annotation.duration - elapsed > 300 ? 1 : Math.max(0, (annotation.duration - elapsed) / 300);
    const opacity = fadeIn * fadeOut;

    ctx.ctx.globalAlpha = opacity;

    switch (style) {
      case 'tooltip':
        this.renderTooltip(ctx, x, y, text);
        break;
      case 'callout':
        this.renderCallout(ctx, x, y, text);
        break;
      case 'highlight':
        this.renderHighlight(ctx, x, y, text);
        break;
      case 'arrow':
        if (targetPosition) {
          this.renderArrow(ctx, x, y, targetPosition.x, targetPosition.y, text);
        }
        break;
    }

    ctx.ctx.globalAlpha = 1;
  }

  /**
   * Render tooltip annotation.
   */
  private renderTooltip(ctx: LayerContext, x: number, y: number, text: string): void {
    const padding = 8;
    ctx.ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
    const textWidth = ctx.ctx.measureText(text).width;
    const width = textWidth + padding * 2;
    const height = 28;

    // Arrow
    const arrowSize = 6;
    ctx.ctx.fillStyle = ctx.colors.annotationBackground;

    ctx.ctx.beginPath();
    ctx.ctx.moveTo(x + width / 2 - arrowSize, y + height);
    ctx.ctx.lineTo(x + width / 2, y + height + arrowSize);
    ctx.ctx.lineTo(x + width / 2 + arrowSize, y + height);
    ctx.ctx.closePath();
    ctx.ctx.fill();

    // Background
    this.roundRect(ctx.ctx, x, y, width, height, 4);
    ctx.ctx.fill();

    // Border
    ctx.ctx.strokeStyle = ctx.colors.annotationBorder;
    ctx.ctx.lineWidth = 1;
    this.roundRect(ctx.ctx, x, y, width, height, 4);
    ctx.ctx.stroke();

    // Text
    ctx.ctx.fillStyle = ctx.colors.annotationText;
    ctx.ctx.textBaseline = 'middle';
    ctx.ctx.fillText(text, x + padding, y + height / 2);
  }

  /**
   * Render callout annotation.
   */
  private renderCallout(ctx: LayerContext, x: number, y: number, text: string): void {
    const padding = 16;
    ctx.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    
    // Wrap text if needed
    const maxWidth = 300;
    const lines = this.wrapText(ctx.ctx, text, maxWidth);
    const lineHeight = 24;
    const width = Math.min(maxWidth, ctx.ctx.measureText(text).width) + padding * 2;
    const height = lines.length * lineHeight + padding * 2;

    // Background with stronger border
    ctx.ctx.fillStyle = ctx.colors.annotationBackground;
    ctx.ctx.strokeStyle = ctx.colors.annotationBorder;
    ctx.ctx.lineWidth = 2;

    this.roundRect(ctx.ctx, x, y, width, height, 8);
    ctx.ctx.fill();
    ctx.ctx.stroke();

    // Icon
    ctx.ctx.fillStyle = ctx.colors.annotationBorder;
    ctx.ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.ctx.fillText('💡', x + padding, y + padding + 16);

    // Text
    ctx.ctx.fillStyle = ctx.colors.annotationText;
    ctx.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.ctx.textBaseline = 'top';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line) {
        ctx.ctx.fillText(line, x + padding + 28, y + padding + i * lineHeight);
      }
    }
  }

  /**
   * Render highlight annotation.
   */
  private renderHighlight(ctx: LayerContext, x: number, y: number, text: string): void {
    const radius = 60;

    // Pulsing highlight circle
    const pulse = Math.sin(ctx.time / 200) * 0.2 + 0.8;
    
    ctx.ctx.strokeStyle = ctx.colors.highlightColor;
    ctx.ctx.lineWidth = 4;
    ctx.ctx.beginPath();
    ctx.ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
    ctx.ctx.stroke();

    // Inner glow
    const gradient = ctx.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.ctx.fillStyle = gradient;
    ctx.ctx.beginPath();
    ctx.ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.ctx.fill();

    // Label below
    if (text) {
      this.renderTooltip(ctx, x - 50, y + radius + 10, text);
    }
  }

  /**
   * Render arrow annotation.
   */
  private renderArrow(
    ctx: LayerContext,
    fromX: number, fromY: number,
    toX: number, toY: number,
    text: string
  ): void {
    // Arrow line
    ctx.ctx.strokeStyle = ctx.colors.annotationBorder;
    ctx.ctx.lineWidth = 2;
    ctx.ctx.setLineDash([4, 4]);

    ctx.ctx.beginPath();
    ctx.ctx.moveTo(fromX, fromY);
    ctx.ctx.lineTo(toX, toY);
    ctx.ctx.stroke();

    ctx.ctx.setLineDash([]);

    // Arrowhead
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 12;

    ctx.ctx.fillStyle = ctx.colors.annotationBorder;
    ctx.ctx.beginPath();
    ctx.ctx.moveTo(toX, toY);
    ctx.ctx.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.ctx.lineTo(
      toX - arrowLength * Math.cos(angle + Math.PI / 6),
      toY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.ctx.closePath();
    ctx.ctx.fill();

    // Label at start
    if (text) {
      this.renderTooltip(ctx, fromX - 50, fromY - 40, text);
    }
  }

  /**
   * Wrap text to fit within maxWidth.
   */
  private wrapText(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Draw rounded rectangle helper.
   */
  private roundRect(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | [number, number, number, number]
  ): void {
    const r: [number, number, number, number] = typeof radius === 'number'
      ? [radius, radius, radius, radius]
      : radius;

    ctx.beginPath();
    ctx.moveTo(x + r[0], y);
    ctx.lineTo(x + width - r[1], y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r[1]);
    ctx.lineTo(x + width, y + height - r[2]);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height);
    ctx.lineTo(x + r[3], y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r[3]);
    ctx.lineTo(x, y + r[0]);
    ctx.quadraticCurveTo(x, y, x + r[0], y);
    ctx.closePath();
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<FrameConfig>): void {
    this.config = { ...this.config, ...config };
    this.colors = getCompositorColors(this.config.theme);

    // Resize canvas if dimensions changed
    if (config.width || config.height || config.pixelRatio) {
      const width = this.config.width * this.config.pixelRatio;
      const height = this.config.height * this.config.pixelRatio;
      this.canvas = new OffscreenCanvas(width, height);
      const ctx = this.canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create 2D context');
      this.ctx = ctx;

      if (this.config.pixelRatio !== 1) {
        this.ctx.scale(this.config.pixelRatio, this.config.pixelRatio);
      }
    }
  }

  /**
   * Get canvas dimensions.
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height,
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Connection render data.
 */
interface ConnectionRenderData {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly type: 'audio' | 'midi' | 'modulation';
  readonly animated: boolean;
}
