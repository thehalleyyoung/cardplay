/**
 * @fileoverview Screenshot Sequence Generator
 * 
 * Generates actual PNG frame sequences showing user behavior traces.
 * Uses node-canvas for server-side rendering.
 * 
 * Usage:
 *   npx ts-node src/ui/video/screenshot-sequence.ts
 * 
 * Output:
 *   test-output/screenshots/frame_0001.png
 *   test-output/screenshots/frame_0002.png
 *   ...
 */

import { createCanvas, type Canvas, type CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface Point {
  x: number;
  y: number;
}

interface Card {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
  selected: boolean;
}

interface Stack {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  collapsed: boolean;
}

interface Connection {
  fromCard: string;
  toCard: string;
  fromPort: 'output';
  toPort: 'input';
}

interface UIState {
  cards: Card[];
  stacks: Stack[];
  connections: Connection[];
  cursorPosition: Point;
  cursorTrail: Point[];
  clickRipples: Array<{ position: Point; progress: number }>;
  dragGhost: { card: Card; position: Point } | null;
  annotations: Array<{ text: string; position: Point; style: string }>;
  keyIndicator: string | null;
}

// BehaviorAction interface removed - was unused

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
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
  text: '#ffffff',
  textMuted: '#a0a0b0',
  connectionAudio: '#22c55e',
  connectionMidi: '#3b82f6',
  cursor: '#ffffff',
  cursorStroke: '#000000',
  ripple: 'rgba(59, 130, 246, 0.5)',
  trail: 'rgba(59, 130, 246, 0.3)',
  annotationBg: 'rgba(42, 42, 62, 0.95)',
  annotationBorder: '#3b82f6',
  keyIndicatorBg: 'rgba(42, 42, 62, 0.95)',
};

// ============================================================================
// RENDERER
// ============================================================================

class ScreenshotRenderer {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(width: number = 1280, height: number = 720) {
    this.width = width;
    this.height = height;
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
  }

  renderFrame(state: UIState): Buffer {
    // Clear background
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render layers
    this.renderGrid();
    this.renderStacks(state.stacks);
    this.renderConnections(state);
    this.renderCards(state.cards);
    this.renderDragGhost(state.dragGhost);
    this.renderCursorTrail(state.cursorTrail);
    this.renderClickRipples(state.clickRipples);
    this.renderCursor(state.cursorPosition);
    this.renderAnnotations(state.annotations);
    this.renderKeyIndicator(state.keyIndicator);

    return this.canvas.toBuffer('image/png');
  }

  private renderGrid(): void {
    const gridSize = 20;

    // Minor grid
    this.ctx.strokeStyle = COLORS.gridLineMinor;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    this.ctx.stroke();

    // Major grid
    this.ctx.strokeStyle = COLORS.gridLine;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = 0; x < this.width; x += gridSize * 4) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += gridSize * 4) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    this.ctx.stroke();
  }

  private renderStacks(stacks: Stack[]): void {
    for (const stack of stacks) {
      const headerHeight = 32;
      const height = stack.collapsed ? headerHeight : stack.height;

      // Background
      this.ctx.fillStyle = COLORS.stackBackground;
      this.ctx.strokeStyle = COLORS.stackBorder;
      this.ctx.lineWidth = 1;
      this.roundRect(stack.x, stack.y, stack.width, height, 8);
      this.ctx.fill();
      this.ctx.stroke();

      // Header
      this.ctx.fillStyle = stack.color;
      this.roundRect(stack.x, stack.y, stack.width, headerHeight, [8, 8, 0, 0]);
      this.ctx.fill();

      // Name
      this.ctx.fillStyle = COLORS.text;
      this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(stack.name, stack.x + 12, stack.y + headerHeight / 2);

      // Collapse indicator
      const chevron = stack.collapsed ? '▶' : '▼';
      this.ctx.fillText(chevron, stack.x + stack.width - 24, stack.y + headerHeight / 2);
    }
  }

  private renderCards(cards: Card[]): void {
    for (const card of cards) {
      const headerHeight = 28;

      // Shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 8;
      this.ctx.shadowOffsetY = 2;

      // Background
      this.ctx.fillStyle = COLORS.cardBackground;
      this.ctx.strokeStyle = card.selected ? COLORS.cardBorderSelected : COLORS.cardBorder;
      this.ctx.lineWidth = card.selected ? 2 : 1;
      this.roundRect(card.x, card.y, card.width, card.height, 6);
      this.ctx.fill();
      this.ctx.stroke();

      // Reset shadow
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetY = 0;

      // Header
      this.ctx.fillStyle = card.color;
      this.roundRect(card.x, card.y, card.width, headerHeight, [6, 6, 0, 0]);
      this.ctx.fill();

      // Name
      this.ctx.fillStyle = COLORS.text;
      this.ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(card.name, card.x + 8, card.y + headerHeight / 2);

      // Ports
      this.renderPort(card.x, card.y + card.height / 2);
      this.renderPort(card.x + card.width, card.y + card.height / 2);

      // Mini waveform
      this.renderMiniWaveform(
        card.x + 8,
        card.y + headerHeight + 8,
        card.width - 16,
        card.height - headerHeight - 16
      );
    }
  }

  private renderPort(x: number, y: number): void {
    this.ctx.fillStyle = '#4a4a5e';
    this.ctx.strokeStyle = '#6a6a7e';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private renderMiniWaveform(x: number, y: number, width: number, height: number): void {
    this.ctx.strokeStyle = COLORS.connectionAudio;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    const centerY = y + height / 2;
    const amplitude = height * 0.3;

    for (let i = 0; i <= width; i++) {
      const progress = i / width;
      const wave = Math.sin(progress * Math.PI * 4) * amplitude * (0.5 + Math.random() * 0.5);
      if (i === 0) {
        this.ctx.moveTo(x + i, centerY + wave);
      } else {
        this.ctx.lineTo(x + i, centerY + wave);
      }
    }
    this.ctx.stroke();
  }

  private renderConnections(state: UIState): void {
    for (const conn of state.connections) {
      const fromCard = state.cards.find(c => c.id === conn.fromCard);
      const toCard = state.cards.find(c => c.id === conn.toCard);
      if (!fromCard || !toCard) continue;

      const fromX = fromCard.x + fromCard.width;
      const fromY = fromCard.y + fromCard.height / 2;
      const toX = toCard.x;
      const toY = toCard.y + toCard.height / 2;

      // Bezier curve
      const midX = (fromX + toX) / 2;

      this.ctx.strokeStyle = COLORS.connectionAudio;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.bezierCurveTo(midX, fromY, midX, toY, toX, toY);
      this.ctx.stroke();
    }
  }

  private renderDragGhost(ghost: { card: Card; position: Point } | null): void {
    if (!ghost) return;

    this.ctx.globalAlpha = 0.6;
    this.ctx.fillStyle = COLORS.cardBackground;
    this.ctx.strokeStyle = COLORS.cardBorderSelected;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);

    this.roundRect(
      ghost.position.x - ghost.card.width / 2,
      ghost.position.y - ghost.card.height / 2,
      ghost.card.width,
      ghost.card.height,
      6
    );
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;
  }

  private renderCursorTrail(trail: Point[]): void {
    if (trail.length < 2) return;

    this.ctx.strokeStyle = COLORS.trail;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const first = trail[0];
    if (!first) return;

    this.ctx.beginPath();
    this.ctx.moveTo(first.x, first.y);
    for (let i = 1; i < trail.length; i++) {
      const point = trail[i];
      if (point) {
        this.ctx.lineTo(point.x, point.y);
      }
    }
    this.ctx.stroke();
  }

  private renderClickRipples(ripples: Array<{ position: Point; progress: number }>): void {
    for (const ripple of ripples) {
      const maxRadius = 40;
      const radius = maxRadius * ripple.progress;
      const opacity = 1 - ripple.progress;

      this.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(ripple.position.x, ripple.position.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Inner dot
      const innerRadius = 8 * (1 - ripple.progress);
      this.ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(ripple.position.x, ripple.position.y, innerRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderCursor(position: Point): void {
    const { x, y } = position;

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 1, y + 1);
    this.ctx.lineTo(x + 1, y + 21);
    this.ctx.lineTo(x + 6, y + 16);
    this.ctx.lineTo(x + 11, y + 21);
    this.ctx.lineTo(x + 14, y + 18);
    this.ctx.lineTo(x + 9, y + 13);
    this.ctx.lineTo(x + 15, y + 13);
    this.ctx.closePath();
    this.ctx.fill();

    // Cursor
    this.ctx.fillStyle = COLORS.cursor;
    this.ctx.strokeStyle = COLORS.cursorStroke;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, y + 20);
    this.ctx.lineTo(x + 5, y + 15);
    this.ctx.lineTo(x + 10, y + 20);
    this.ctx.lineTo(x + 13, y + 17);
    this.ctx.lineTo(x + 8, y + 12);
    this.ctx.lineTo(x + 14, y + 12);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private renderAnnotations(annotations: Array<{ text: string; position: Point; style: string }>): void {
    for (const ann of annotations) {
      this.renderTooltip(ann.position.x, ann.position.y, ann.text);
    }
  }

  private renderTooltip(x: number, y: number, text: string): void {
    const padding = 10;
    this.ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
    const textWidth = this.ctx.measureText(text).width;
    const width = textWidth + padding * 2;
    const height = 28;

    // Arrow
    const arrowSize = 6;
    this.ctx.fillStyle = COLORS.annotationBg;
    this.ctx.beginPath();
    this.ctx.moveTo(x + width / 2 - arrowSize, y + height);
    this.ctx.lineTo(x + width / 2, y + height + arrowSize);
    this.ctx.lineTo(x + width / 2 + arrowSize, y + height);
    this.ctx.closePath();
    this.ctx.fill();

    // Background
    this.roundRect(x, y, width, height, 4);
    this.ctx.fill();

    // Border
    this.ctx.strokeStyle = COLORS.annotationBorder;
    this.ctx.lineWidth = 1;
    this.roundRect(x, y, width, height, 4);
    this.ctx.stroke();

    // Text
    this.ctx.fillStyle = COLORS.text;
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + padding, y + height / 2);
  }

  private renderKeyIndicator(key: string | null): void {
    if (!key) return;

    const x = this.width - 120;
    const y = this.height - 60;
    const padding = 12;

    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    const textWidth = this.ctx.measureText(key).width;
    const width = textWidth + padding * 2;
    const height = 32;

    // Background
    this.ctx.fillStyle = COLORS.keyIndicatorBg;
    this.ctx.strokeStyle = COLORS.annotationBorder;
    this.ctx.lineWidth = 2;
    this.roundRect(x, y, width, height, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Text
    this.ctx.fillStyle = COLORS.text;
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(key, x + padding, y + height / 2);
  }

  private roundRect(
    x: number, y: number,
    width: number, height: number,
    radius: number | [number, number, number, number]
  ): void {
    const r: [number, number, number, number] = typeof radius === 'number' 
      ? [radius, radius, radius, radius] 
      : radius;

    this.ctx.beginPath();
    this.ctx.moveTo(x + r[0], y);
    this.ctx.lineTo(x + width - r[1], y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + r[1]);
    this.ctx.lineTo(x + width, y + height - r[2]);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height);
    this.ctx.lineTo(x + r[3], y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - r[3]);
    this.ctx.lineTo(x, y + r[0]);
    this.ctx.quadraticCurveTo(x, y, x + r[0], y);
    this.ctx.closePath();
  }
}

// ============================================================================
// BEHAVIOR SIMULATOR
// ============================================================================

class BehaviorSimulator {
  private state: UIState;
  private renderer: ScreenshotRenderer;
  private frameNumber: number = 0;
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.renderer = new ScreenshotRenderer(1280, 720);

    // Initialize state with sample UI
    this.state = this.createInitialState();

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  private createInitialState(): UIState {
    return {
      stacks: [
        { id: 'instruments', name: '🎹 Instruments', x: 50, y: 50, width: 300, height: 400, color: '#4a5568', collapsed: false },
        { id: 'effects', name: '🎛️ Effects', x: 400, y: 50, width: 300, height: 400, color: '#2d3748', collapsed: false },
        { id: 'routing', name: '🔀 Routing', x: 750, y: 50, width: 300, height: 400, color: '#1a202c', collapsed: false },
      ],
      cards: [
        { id: 'synth1', name: 'Analog Synth', x: 70, y: 100, width: 260, height: 100, color: '#805ad5', selected: false },
        { id: 'sampler1', name: 'Drum Sampler', x: 70, y: 220, width: 260, height: 100, color: '#d69e2e', selected: false },
        { id: 'reverb1', name: 'Hall Reverb', x: 420, y: 100, width: 260, height: 100, color: '#38a169', selected: false },
        { id: 'delay1', name: 'Ping Pong Delay', x: 420, y: 220, width: 260, height: 100, color: '#3182ce', selected: false },
        { id: 'mixer1', name: 'Stereo Mixer', x: 770, y: 150, width: 260, height: 120, color: '#e53e3e', selected: false },
      ],
      connections: [
        { fromCard: 'synth1', toCard: 'reverb1', fromPort: 'output', toPort: 'input' },
        { fromCard: 'reverb1', toCard: 'mixer1', fromPort: 'output', toPort: 'input' },
        { fromCard: 'sampler1', toCard: 'delay1', fromPort: 'output', toPort: 'input' },
        { fromCard: 'delay1', toCard: 'mixer1', fromPort: 'output', toPort: 'input' },
      ],
      cursorPosition: { x: 640, y: 360 },
      cursorTrail: [],
      clickRipples: [],
      dragGhost: null,
      annotations: [],
      keyIndicator: null,
    };
  }

  saveFrame(): void {
    this.frameNumber++;
    const frameId = String(this.frameNumber).padStart(4, '0');
    const filename = path.join(this.outputDir, `frame_${frameId}.png`);
    const buffer = this.renderer.renderFrame(this.state);
    fs.writeFileSync(filename, buffer);
    console.log(`Saved: ${filename}`);
  }

  // Interpolate cursor position
  moveTo(x: number, y: number, frames: number): void {
    const startX = this.state.cursorPosition.x;
    const startY = this.state.cursorPosition.y;

    for (let i = 1; i <= frames; i++) {
      const t = i / frames;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      this.state.cursorPosition = {
        x: startX + (x - startX) * eased,
        y: startY + (y - startY) * eased,
      };

      // Add to trail (keep last 20 points)
      this.state.cursorTrail.push({ ...this.state.cursorPosition });
      if (this.state.cursorTrail.length > 20) {
        this.state.cursorTrail.shift();
      }

      this.saveFrame();
    }
  }

  click(): void {
    // Add ripple
    this.state.clickRipples.push({
      position: { ...this.state.cursorPosition },
      progress: 0,
    });

    // Animate ripple over 15 frames
    for (let i = 0; i < 15; i++) {
      for (const ripple of this.state.clickRipples) {
        ripple.progress = Math.min(1, ripple.progress + 0.07);
      }
      // Remove completed ripples
      this.state.clickRipples = this.state.clickRipples.filter(r => r.progress < 1);
      this.saveFrame();
    }
  }

  selectCard(cardId: string): void {
    const card = this.state.cards.find(c => c.id === cardId);
    if (!card) return;

    // Move to card center
    this.moveTo(card.x + card.width / 2, card.y + card.height / 2, 15);

    // Deselect all, select this one
    for (const c of this.state.cards) {
      c.selected = c.id === cardId;
    }

    this.click();
  }

  dragCard(cardId: string, toX: number, toY: number, frames: number): void {
    const card = this.state.cards.find(c => c.id === cardId);
    if (!card) return;

    // Move to card
    this.moveTo(card.x + card.width / 2, card.y + card.height / 2, 10);

    // Start drag
    card.selected = true;
    this.state.dragGhost = {
      card: { ...card },
      position: { x: card.x + card.width / 2, y: card.y + card.height / 2 },
    };

    // Drag animation
    const startX = card.x + card.width / 2;
    const startY = card.y + card.height / 2;

    for (let i = 1; i <= frames; i++) {
      const t = i / frames;
      const eased = 1 - Math.pow(1 - t, 2);

      const newX = startX + (toX - startX) * eased;
      const newY = startY + (toY - startY) * eased;

      this.state.cursorPosition = { x: newX, y: newY };
      this.state.dragGhost!.position = { x: newX, y: newY };

      // Update trail
      this.state.cursorTrail.push({ ...this.state.cursorPosition });
      if (this.state.cursorTrail.length > 20) {
        this.state.cursorTrail.shift();
      }

      this.saveFrame();
    }

    // Drop
    card.x = toX - card.width / 2;
    card.y = toY - card.height / 2;
    this.state.dragGhost = null;
    this.click();
  }

  showAnnotation(text: string, x: number, y: number, frames: number): void {
    this.state.annotations.push({ text, position: { x, y }, style: 'tooltip' });

    for (let i = 0; i < frames; i++) {
      this.saveFrame();
    }

    this.state.annotations.pop();
  }

  showKeyPress(key: string, frames: number): void {
    this.state.keyIndicator = key;

    for (let i = 0; i < frames; i++) {
      this.saveFrame();
    }

    this.state.keyIndicator = null;
    this.saveFrame();
  }

  wait(frames: number): void {
    // Clear trail gradually
    for (let i = 0; i < frames; i++) {
      if (this.state.cursorTrail.length > 0 && i % 2 === 0) {
        this.state.cursorTrail.shift();
      }
      this.saveFrame();
    }
  }
}

// ============================================================================
// DEMO SEQUENCES
// ============================================================================

function runBasicInteractionDemo(outputDir: string): void {
  console.log('\n🎬 Running Basic Interaction Demo...\n');

  const sim = new BehaviorSimulator(outputDir);

  // Opening scene
  sim.showAnnotation('Welcome to CardPlay!', 500, 30, 30);

  // Move around to explore
  sim.moveTo(200, 150, 20);
  sim.showAnnotation('Analog Synth Card', 70, 70, 20);

  // Select first card
  sim.selectCard('synth1');
  sim.wait(10);

  // Move to effects
  sim.moveTo(550, 150, 25);
  sim.showAnnotation('Effects Stack', 450, 30, 20);

  // Select reverb
  sim.selectCard('reverb1');
  sim.wait(10);

  // Keyboard shortcut demo
  sim.showAnnotation('Use ⌘Z to undo', 450, 300, 10);
  sim.showKeyPress('⌘Z', 20);

  // Move to routing
  sim.moveTo(900, 200, 25);
  sim.showAnnotation('Audio flows to Mixer', 750, 30, 25);

  // Final wait
  sim.wait(20);

  console.log('\n✅ Basic interaction demo complete!\n');
}

function runDragDropDemo(outputDir: string): void {
  console.log('\n🎬 Running Drag & Drop Demo...\n');

  const sim = new BehaviorSimulator(outputDir);

  // Intro
  sim.showAnnotation('Drag & Drop Demo', 500, 30, 25);
  sim.wait(10);

  // Select card to drag
  sim.moveTo(200, 150, 20);
  sim.showAnnotation('Click to select', 100, 70, 15);
  sim.selectCard('synth1');
  sim.wait(10);

  // Drag it to a new position
  sim.showAnnotation('Drag to move', 100, 70, 15);
  sim.dragCard('synth1', 200, 350, 40);

  sim.wait(15);

  // Drag another card
  sim.showAnnotation('Reorganize your workspace', 350, 30, 20);
  sim.dragCard('reverb1', 550, 350, 35);

  sim.wait(20);

  console.log('\n✅ Drag & drop demo complete!\n');
}

function runPersonaDemo(outputDir: string, personaName: string): void {
  console.log(`\n🎬 Running ${personaName} Persona Demo...\n`);

  const sim = new BehaviorSimulator(outputDir);

  // Persona-specific intro
  sim.showAnnotation(`${personaName} Workflow`, 500, 30, 30);

  if (personaName === 'Beginner') {
    // Slow, deliberate movements with lots of annotations
    sim.moveTo(200, 150, 30); // Slower
    sim.showAnnotation('This is an instrument card', 70, 70, 35);
    sim.selectCard('synth1');
    sim.wait(20);

    sim.showAnnotation('Cards connect together', 350, 150, 30);
    sim.moveTo(400, 150, 25);
    sim.wait(15);

    sim.showAnnotation('Click to select effects', 400, 70, 25);
    sim.selectCard('reverb1');
    sim.wait(15);

  } else if (personaName === 'Power User') {
    // Fast, efficient movements with keyboard shortcuts
    sim.moveTo(200, 150, 10); // Fast
    sim.selectCard('synth1');

    sim.showKeyPress('⌘D', 15); // Duplicate
    sim.wait(5);

    sim.moveTo(550, 150, 8);
    sim.selectCard('reverb1');

    sim.showKeyPress('⌘C', 12); // Copy
    sim.showKeyPress('⌘V', 12); // Paste

    sim.dragCard('delay1', 550, 380, 20); // Quick drag

  } else if (personaName === 'Live Performer') {
    // Focus on mixer and quick access
    sim.moveTo(900, 200, 15);
    sim.showAnnotation('Mixer is your focus', 750, 70, 25);
    sim.selectCard('mixer1');

    sim.showKeyPress('Space', 20); // Play
    sim.wait(10);

    sim.showKeyPress('M', 15); // Mute
    sim.showKeyPress('S', 15); // Solo
  }

  sim.wait(20);

  console.log(`\n✅ ${personaName} persona demo complete!\n`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const baseDir = path.join(process.cwd(), 'test-output', 'screenshots');

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         CardPlay Screenshot Sequence Generator                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Run demos
  runBasicInteractionDemo(path.join(baseDir, 'basic-interaction'));
  runDragDropDemo(path.join(baseDir, 'drag-drop'));
  runPersonaDemo(path.join(baseDir, 'persona-beginner'), 'Beginner');
  runPersonaDemo(path.join(baseDir, 'persona-power-user'), 'Power User');
  runPersonaDemo(path.join(baseDir, 'persona-live-performer'), 'Live Performer');

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('All demos complete! Screenshots saved to:');
  console.log(`  ${baseDir}/`);
  console.log('');
  console.log('To view as animation, use:');
  console.log('  open test-output/screenshots/basic-interaction/');
  console.log('  # Or create a GIF with ffmpeg:');
  console.log('  ffmpeg -framerate 30 -i frame_%04d.png -vf "fps=30" demo.gif');
  console.log('════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
