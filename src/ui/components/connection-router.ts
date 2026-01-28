/**
 * @fileoverview Connection Router & Renderer
 * 
 * Handles visual routing of connections between cards:
 * - Bezier curve generation
 * - Stepped/orthogonal paths
 * - Flow animation (particles)
 * - Connection selection and editing
 * - Hit testing
 * - Connection labels and indicators
 * 
 * @module @cardplay/ui/components/connection-router
 */

// ============================================================================
// TYPES
// ============================================================================

/** Connection style */
export type ConnectionStyle = 'curved' | 'straight' | 'stepped';

/** Connection type */
export type ConnectionType = 'audio' | 'midi' | 'modulation' | 'trigger' | 'sidechain' | 'control';

/** Point in 2D space */
export interface Point {
  x: number;
  y: number;
}

/** Control point for bezier */
export interface ControlPoint extends Point {
  isHandle: boolean;
}

/** Connection endpoint */
export interface ConnectionEndpoint {
  cardId: string;
  portId: string;
  position: Point;
}

/** Connection data */
export interface ConnectionData {
  id: string;
  source: ConnectionEndpoint;
  target: ConnectionEndpoint;
  type: ConnectionType;
  style?: ConnectionStyle;
  color?: string;
  gain?: number;
  muted?: boolean;
  visible?: boolean;
  label?: string;
  zIndex?: number;
}

/** Connection state */
export interface ConnectionState {
  selected: boolean;
  hovered: boolean;
  dragging: boolean;
  signalActive: boolean;
  signalLevel: number;  // 0-1
}

/** Flow particle */
interface FlowParticle {
  t: number;  // Position along curve (0-1)
  speed: number;
  size: number;
  opacity: number;
}

/** Rendered connection */
export interface RenderedConnection {
  data: ConnectionData;
  state: ConnectionState;
  path: Path2D;
  controlPoints: ControlPoint[];
  particles: FlowParticle[];
  bounds: { x: number; y: number; width: number; height: number };
}

/** Router options */
export interface ConnectionRouterOptions {
  defaultStyle?: ConnectionStyle;
  curveTension?: number;        // For bezier (0-1)
  stepOffset?: number;          // For stepped routing
  hitTestTolerance?: number;    // Pixels for click detection
  particleCount?: number;       // Particles per connection
  particleSpeed?: number;       // Pixels per frame
  animationEnabled?: boolean;
  showLabels?: boolean;
  showGainIndicator?: boolean;
}

// ============================================================================
// CONNECTION COLORS
// ============================================================================

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  audio: '#6366f1',      // Indigo
  midi: '#22c55e',       // Green
  modulation: '#f59e0b', // Amber
  trigger: '#ec4899',    // Pink
  sidechain: '#8b5cf6',  // Purple
  control: '#06b6d4',    // Cyan
};

// ============================================================================
// CONNECTION ROUTER
// ============================================================================

/**
 * Routes and renders connections between cards
 */
export class ConnectionRouter {
  // Canvas
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Options
  private options: Required<ConnectionRouterOptions>;
  
  // Connections
  private connections: Map<string, RenderedConnection> = new Map();
  
  // Selection
  private selectedConnectionId: string | null = null;
  private hoveredConnectionId: string | null = null;
  
  // Animation
  private animationFrame: number | null = null;
  private lastFrameTime: number = 0;
  
  // Dragging
  private isDragging = false;
  private dragConnectionId: string | null = null;
  private dragPosition: Point | null = null;
  
  // Preview connection (while creating)
  private previewConnection: {
    source: Point;
    target: Point;
    type: ConnectionType;
  } | null = null;
  
  constructor(canvas: HTMLCanvasElement, options: ConnectionRouterOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.options = {
      defaultStyle: options.defaultStyle ?? 'curved',
      curveTension: options.curveTension ?? 0.5,
      stepOffset: options.stepOffset ?? 50,
      hitTestTolerance: options.hitTestTolerance ?? 8,
      particleCount: options.particleCount ?? 3,
      particleSpeed: options.particleSpeed ?? 0.01,
      animationEnabled: options.animationEnabled ?? true,
      showLabels: options.showLabels ?? true,
      showGainIndicator: options.showGainIndicator ?? true,
    };
    
    this.setupEventListeners();
    
    if (this.options.animationEnabled) {
      this.startAnimation();
    }
  }
  
  // ===========================================================================
  // CONNECTION MANAGEMENT
  // ===========================================================================
  
  /**
   * Add a connection
   */
  addConnection(data: ConnectionData): void {
    const particles = this.createParticles();
    const controlPoints = this.calculateControlPoints(data);
    const path = this.createPath(data, controlPoints);
    const bounds = this.calculateBounds(controlPoints);
    
    const rendered: RenderedConnection = {
      data,
      state: {
        selected: false,
        hovered: false,
        dragging: false,
        signalActive: false,
        signalLevel: 0,
      },
      path,
      controlPoints,
      particles,
      bounds,
    };
    
    this.connections.set(data.id, rendered);
  }
  
  /**
   * Remove a connection
   */
  removeConnection(id: string): void {
    this.connections.delete(id);
    
    if (this.selectedConnectionId === id) {
      this.selectedConnectionId = null;
    }
    if (this.hoveredConnectionId === id) {
      this.hoveredConnectionId = null;
    }
  }
  
  /**
   * Update a connection
   */
  updateConnection(id: string, updates: Partial<ConnectionData>): void {
    const conn = this.connections.get(id);
    if (!conn) return;
    
    Object.assign(conn.data, updates);
    
    // Recalculate path if endpoints changed
    if (updates.source || updates.target || updates.style) {
      conn.controlPoints = this.calculateControlPoints(conn.data);
      conn.path = this.createPath(conn.data, conn.controlPoints);
      conn.bounds = this.calculateBounds(conn.controlPoints);
    }
  }
  
  /**
   * Update endpoint position
   */
  updateEndpoint(connectionId: string, endpoint: 'source' | 'target', position: Point): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;
    
    conn.data[endpoint].position = position;
    conn.controlPoints = this.calculateControlPoints(conn.data);
    conn.path = this.createPath(conn.data, conn.controlPoints);
    conn.bounds = this.calculateBounds(conn.controlPoints);
  }
  
  /**
   * Update signal level (for animation)
   */
  updateSignalLevel(connectionId: string, level: number, active: boolean): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.state.signalLevel = level;
      conn.state.signalActive = active;
    }
  }
  
  /**
   * Get connection by ID
   */
  getConnection(id: string): RenderedConnection | undefined {
    return this.connections.get(id);
  }
  
  /**
   * Get all connections
   */
  getAllConnections(): RenderedConnection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * Get connections for a card
   */
  getConnectionsForCard(cardId: string): RenderedConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.data.source.cardId === cardId || conn.data.target.cardId === cardId
    );
  }
  
  // ===========================================================================
  // SELECTION
  // ===========================================================================
  
  /**
   * Select a connection
   */
  selectConnection(id: string | null): void {
    // Deselect previous
    if (this.selectedConnectionId) {
      const prev = this.connections.get(this.selectedConnectionId);
      if (prev) {
        prev.state.selected = false;
      }
    }
    
    this.selectedConnectionId = id;
    
    // Select new
    if (id) {
      const conn = this.connections.get(id);
      if (conn) {
        conn.state.selected = true;
      }
    }
    
    this.canvas.dispatchEvent(new CustomEvent('connection-select', {
      bubbles: true,
      detail: { connectionId: id }
    }));
  }
  
  /**
   * Get selected connection
   */
  getSelectedConnection(): RenderedConnection | null {
    return this.selectedConnectionId 
      ? this.connections.get(this.selectedConnectionId) ?? null 
      : null;
  }
  
  // ===========================================================================
  // PATH CALCULATION
  // ===========================================================================
  
  /**
   * Calculate control points for bezier curve
   */
  private calculateControlPoints(data: ConnectionData): ControlPoint[] {
    const style = data.style ?? this.options.defaultStyle;
    const source = data.source.position;
    const target = data.target.position;
    
    const points: ControlPoint[] = [
      { ...source, isHandle: false },
    ];
    
    if (style === 'curved') {
      // Bezier control points
      const dx = target.x - source.x;
      const tension = this.options.curveTension;
      
      points.push({
        x: source.x + dx * tension,
        y: source.y,
        isHandle: true,
      });
      
      points.push({
        x: target.x - dx * tension,
        y: target.y,
        isHandle: true,
      });
    } else if (style === 'stepped') {
      // Orthogonal routing
      const midX = (source.x + target.x) / 2;
      
      // Decide direction based on relative positions
      if (Math.abs(target.x - source.x) > Math.abs(target.y - source.y)) {
        // Horizontal primary
        points.push({ x: midX, y: source.y, isHandle: false });
        points.push({ x: midX, y: target.y, isHandle: false });
      } else {
        // Vertical primary
        const midY = (source.y + target.y) / 2;
        points.push({ x: source.x, y: midY, isHandle: false });
        points.push({ x: target.x, y: midY, isHandle: false });
      }
    }
    // straight: no intermediate points
    
    points.push({ ...target, isHandle: false });
    
    return points;
  }
  
  /**
   * Create Path2D from control points
   */
  private createPath(data: ConnectionData, controlPoints: ControlPoint[]): Path2D {
    const path = new Path2D();
    const style = data.style ?? this.options.defaultStyle;
    
    if (controlPoints.length < 2) return path;
    
    const startPoint = controlPoints[0];
    if (!startPoint) return path;
    path.moveTo(startPoint.x, startPoint.y);
    
    if (style === 'curved' && controlPoints.length === 4) {
      // Cubic bezier
      const cp1 = controlPoints[1];
      const cp2 = controlPoints[2];
      const cp3 = controlPoints[3];
      if (cp1 && cp2 && cp3) {
        path.bezierCurveTo(
          cp1.x, cp1.y,
          cp2.x, cp2.y,
          cp3.x, cp3.y
        );
      }
    } else if (style === 'stepped') {
      // Line segments
      for (let i = 1; i < controlPoints.length; i++) {
        const cp = controlPoints[i];
        if (cp) {
          path.lineTo(cp.x, cp.y);
        }
      }
    } else {
      // Straight line
      const lastPoint = controlPoints[controlPoints.length - 1];
      if (lastPoint) {
        path.lineTo(lastPoint.x, lastPoint.y);
      }
    }
    
    return path;
  }
  
  /**
   * Calculate bounding box
   */
  private calculateBounds(points: ControlPoint[]): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    
    const padding = 20;
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }
  
  // ===========================================================================
  // PARTICLES
  // ===========================================================================
  
  private createParticles(): FlowParticle[] {
    const particles: FlowParticle[] = [];
    
    for (let i = 0; i < this.options.particleCount; i++) {
      particles.push({
        t: i / this.options.particleCount,
        speed: this.options.particleSpeed * (0.8 + Math.random() * 0.4),
        size: 3 + Math.random() * 2,
        opacity: 0.6 + Math.random() * 0.4,
      });
    }
    
    return particles;
  }
  
  private updateParticles(particles: FlowParticle[], dt: number, active: boolean): void {
    for (const p of particles) {
      if (active) {
        p.t += p.speed * dt;
        if (p.t > 1) {
          p.t = 0;
        }
      }
    }
  }
  
  /**
   * Get point along bezier curve at t (0-1)
   */
  private getPointOnCurve(points: ControlPoint[], t: number): Point {
    if (points.length === 2) {
      // Linear interpolation
      const p0 = points[0]!;
      const p1 = points[1]!;
      return {
        x: p0.x + (p1.x - p0.x) * t,
        y: p0.y + (p1.y - p0.y) * t,
      };
    } else if (points.length === 4) {
      // Cubic bezier
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      const p0 = points[0]!;
      const p1 = points[1]!;
      const p2 = points[2]!;
      const p3 = points[3]!;
      return {
        x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
        y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
      };
    } else {
      // Multi-segment: find segment and interpolate
      const totalSegments = points.length - 1;
      const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
      const segmentT = (t * totalSegments) - segment;
      
      const pSeg = points[segment]!;
      const pNext = points[segment + 1]!;
      return {
        x: pSeg.x + (pNext.x - pSeg.x) * segmentT,
        y: pSeg.y + (pNext.y - pSeg.y) * segmentT,
      };
    }
  }
  
  // ===========================================================================
  // RENDERING
  // ===========================================================================
  
  /**
   * Render all connections
   */
  render(): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Sort by z-index
    const sorted = Array.from(this.connections.values())
      .filter(c => c.data.visible !== false)
      .sort((a, b) => (a.data.zIndex ?? 0) - (b.data.zIndex ?? 0));
    
    // Draw connections
    for (const conn of sorted) {
      this.renderConnection(conn);
    }
    
    // Draw preview connection
    if (this.previewConnection) {
      this.renderPreviewConnection();
    }
    
    // Draw drag endpoint
    if (this.isDragging && this.dragPosition) {
      this.renderDragEndpoint();
    }
  }
  
  /**
   * Render a single connection
   */
  private renderConnection(conn: RenderedConnection): void {
    const ctx = this.ctx;
    const { data, state, controlPoints: _controlPoints, particles } = conn;
    
    const color = data.color ?? CONNECTION_COLORS[data.type];
    const lineWidth = this.getLineWidth(conn);
    const alpha = data.muted ? 0.3 : state.hovered ? 1 : 0.8;
    
    // Draw path
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Shadow for selected
    if (state.selected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    }
    
    ctx.stroke(conn.path);
    ctx.restore();
    
    // Draw particles if active
    if (state.signalActive && this.options.animationEnabled) {
      this.renderParticles(conn, particles, color);
    }
    
    // Draw gain indicator
    if (this.options.showGainIndicator && data.gain !== undefined && data.gain !== 1) {
      this.renderGainIndicator(conn, color);
    }
    
    // Draw label
    if (this.options.showLabels && data.label) {
      this.renderLabel(conn, color);
    }
    
    // Draw mute indicator
    if (data.muted) {
      this.renderMuteIndicator(conn);
    }
    
    // Draw endpoints
    this.renderEndpoints(conn, color);
    
    // Draw control points if selected
    if (state.selected) {
      this.renderControlPoints(conn, color);
    }
  }
  
  private getLineWidth(conn: RenderedConnection): number {
    const base = 2;
    
    if (conn.state.selected) return base + 2;
    if (conn.state.hovered) return base + 1;
    
    // Width based on gain
    if (this.options.showGainIndicator && conn.data.gain !== undefined) {
      return base * Math.min(2, Math.max(0.5, conn.data.gain));
    }
    
    return base;
  }
  
  private renderParticles(conn: RenderedConnection, particles: FlowParticle[], color: string): void {
    const ctx = this.ctx;
    
    for (const p of particles) {
      const pos = this.getPointOnCurve(conn.controlPoints, p.t);
      
      ctx.save();
      ctx.globalAlpha = p.opacity * conn.state.signalLevel;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  private renderGainIndicator(conn: RenderedConnection, color: string): void {
    const ctx = this.ctx;
    const midPoint = this.getPointOnCurve(conn.controlPoints, 0.5);
    
    const gain = conn.data.gain ?? 1;
    const gainDb = 20 * Math.log10(gain);
    const text = `${gainDb > 0 ? '+' : ''}${gainDb.toFixed(1)} dB`;
    
    ctx.save();
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const metrics = ctx.measureText(text);
    const padding = 4;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 14;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(midPoint.x - bgWidth / 2, midPoint.y - bgHeight / 2, bgWidth, bgHeight, 4);
    ctx.fill();
    
    // Text
    ctx.fillStyle = color;
    ctx.fillText(text, midPoint.x, midPoint.y);
    ctx.restore();
  }
  
  private renderLabel(conn: RenderedConnection, color: string): void {
    const ctx = this.ctx;
    const pos = this.getPointOnCurve(conn.controlPoints, 0.3);
    
    ctx.save();
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = color;
    ctx.fillText(conn.data.label!, pos.x + 8, pos.y - 4);
    ctx.restore();
  }
  
  private renderMuteIndicator(conn: RenderedConnection): void {
    const ctx = this.ctx;
    const midPoint = this.getPointOnCurve(conn.controlPoints, 0.5);
    
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // X mark
    const size = 8;
    ctx.beginPath();
    ctx.moveTo(midPoint.x - size, midPoint.y - size);
    ctx.lineTo(midPoint.x + size, midPoint.y + size);
    ctx.moveTo(midPoint.x + size, midPoint.y - size);
    ctx.lineTo(midPoint.x - size, midPoint.y + size);
    ctx.stroke();
    ctx.restore();
  }
  
  private renderEndpoints(conn: RenderedConnection, color: string): void {
    const ctx = this.ctx;
    
    // Source
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(conn.data.source.position.x, conn.data.source.position.y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Target (arrow)
    const target = conn.data.target.position;
    const prev = conn.controlPoints[conn.controlPoints.length - 2];
    const angle = prev ? Math.atan2(target.y - prev.y, target.x - prev.x) : 0;
    
    ctx.translate(target.x, target.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  private renderControlPoints(conn: RenderedConnection, color: string): void {
    const ctx = this.ctx;
    
    for (const point of conn.controlPoints) {
      if (point.isHandle) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  
  private renderPreviewConnection(): void {
    if (!this.previewConnection) return;
    
    const ctx = this.ctx;
    const { source, target, type } = this.previewConnection;
    const color = CONNECTION_COLORS[type];
    
    // Calculate simple bezier
    const dx = target.x - source.x;
    const tension = 0.5;
    
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.bezierCurveTo(
      source.x + dx * tension, source.y,
      target.x - dx * tension, target.y,
      target.x, target.y
    );
    ctx.stroke();
    ctx.restore();
  }
  
  private renderDragEndpoint(): void {
    if (!this.dragPosition) return;
    
    const ctx = this.ctx;
    
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.dragPosition.x, this.dragPosition.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  
  // ===========================================================================
  // HIT TESTING
  // ===========================================================================
  
  /**
   * Find connection at point
   */
  connectionAtPoint(x: number, y: number): RenderedConnection | null {
    const tolerance = this.options.hitTestTolerance;
    
    // Check in reverse order (top to bottom)
    const sorted = Array.from(this.connections.values())
      .filter(c => c.data.visible !== false)
      .sort((a, b) => (b.data.zIndex ?? 0) - (a.data.zIndex ?? 0));
    
    for (const conn of sorted) {
      // Quick bounds check
      const { bounds } = conn;
      if (x < bounds.x || x > bounds.x + bounds.width ||
          y < bounds.y || y > bounds.y + bounds.height) {
        continue;
      }
      
      // Detailed path check
      if (this.isPointNearPath(conn, x, y, tolerance)) {
        return conn;
      }
    }
    
    return null;
  }
  
  private isPointNearPath(conn: RenderedConnection, x: number, y: number, tolerance: number): boolean {
    // Sample points along the curve
    const samples = 50;
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = this.getPointOnCurve(conn.controlPoints, t);
      
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist <= tolerance) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Find control point at position
   */
  controlPointAtPosition(conn: RenderedConnection, x: number, y: number): number {
    const tolerance = 10;
    
    for (let i = 0; i < conn.controlPoints.length; i++) {
      const p = conn.controlPoints[i];
      if (!p || !p.isHandle) continue;
      
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist <= tolerance) {
        return i;
      }
    }
    
    return -1;
  }
  
  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================
  
  private setupEventListeners(): void {
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
  }
  
  private onPointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.isDragging && this.dragConnectionId) {
      // Update drag position
      this.dragPosition = { x, y };
      return;
    }
    
    // Update hover state
    const conn = this.connectionAtPoint(x, y);
    
    if (conn?.data.id !== this.hoveredConnectionId) {
      // Unhover previous
      if (this.hoveredConnectionId) {
        const prev = this.connections.get(this.hoveredConnectionId);
        if (prev) {
          prev.state.hovered = false;
        }
      }
      
      // Hover new
      this.hoveredConnectionId = conn?.data.id ?? null;
      if (conn) {
        conn.state.hovered = true;
        this.canvas.style.cursor = 'pointer';
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
  }
  
  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const conn = this.connectionAtPoint(x, y);
    
    if (conn) {
      this.selectConnection(conn.data.id);
      
      // Check if clicking a control point
      if (conn.state.selected) {
        const cpIndex = this.controlPointAtPosition(conn, x, y);
        if (cpIndex >= 0) {
          this.startControlPointDrag(conn.data.id, cpIndex, e);
          return;
        }
      }
    } else {
      this.selectConnection(null);
    }
  }
  
  private onPointerUp(_e: PointerEvent): void {
    if (this.isDragging) {
      this.endDrag();
    }
  }
  
  private onDoubleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const conn = this.connectionAtPoint(x, y);
    
    if (conn) {
      this.canvas.dispatchEvent(new CustomEvent('connection-dblclick', {
        bubbles: true,
        detail: { connectionId: conn.data.id }
      }));
    }
  }
  
  private onContextMenu(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const conn = this.connectionAtPoint(x, y);
    
    if (conn) {
      e.preventDefault();
      this.selectConnection(conn.data.id);
      
      this.canvas.dispatchEvent(new CustomEvent('connection-contextmenu', {
        bubbles: true,
        detail: { 
          connectionId: conn.data.id,
          x: e.clientX,
          y: e.clientY
        }
      }));
    }
  }
  
  // ===========================================================================
  // DRAGGING
  // ===========================================================================
  
  private startControlPointDrag(connectionId: string, _pointIndex: number, e: PointerEvent): void {
    this.isDragging = true;
    this.dragConnectionId = connectionId;
    
    const rect = this.canvas.getBoundingClientRect();
    this.dragPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    this.canvas.setPointerCapture(e.pointerId);
    
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.state.dragging = true;
    }
  }
  
  private endDrag(): void {
    if (this.dragConnectionId) {
      const conn = this.connections.get(this.dragConnectionId);
      if (conn) {
        conn.state.dragging = false;
      }
    }
    
    this.isDragging = false;
    this.dragConnectionId = null;
    this.dragPosition = null;
  }
  
  // ===========================================================================
  // PREVIEW
  // ===========================================================================
  
  /**
   * Start preview connection (while creating)
   */
  startPreview(source: Point, type: ConnectionType): void {
    this.previewConnection = {
      source,
      target: source,
      type,
    };
  }
  
  /**
   * Update preview target
   */
  updatePreview(target: Point): void {
    if (this.previewConnection) {
      this.previewConnection.target = target;
    }
  }
  
  /**
   * End preview
   */
  endPreview(): void {
    this.previewConnection = null;
  }
  
  // ===========================================================================
  // ANIMATION
  // ===========================================================================
  
  private startAnimation(): void {
    this.lastFrameTime = performance.now();
    this.animate();
  }
  
  private animate = (): void => {
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 16.67; // Normalize to 60fps
    this.lastFrameTime = now;
    
    // Update particles
    for (const conn of this.connections.values()) {
      this.updateParticles(conn.particles, dt, conn.state.signalActive);
    }
    
    // Render
    this.render();
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  /**
   * Stop animation
   */
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  
  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  /**
   * Dispose router
   */
  dispose(): void {
    this.stopAnimation();
    this.connections.clear();
  }
  
  // ===========================================================================
  // EXPORT
  // ===========================================================================
  
  /**
   * Export connections as data
   */
  exportConnections(): ConnectionData[] {
    return Array.from(this.connections.values()).map(c => ({ ...c.data }));
  }
  
  /**
   * Import connections from data
   */
  importConnections(data: ConnectionData[]): void {
    this.connections.clear();
    
    for (const conn of data) {
      this.addConnection(conn);
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createConnectionRouter(canvas: HTMLCanvasElement, options?: ConnectionRouterOptions): ConnectionRouter {
  return new ConnectionRouter(canvas, options);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate shortest path between two points avoiding obstacles
 */
export function calculateAvoidancePath(
  source: Point,
  target: Point,
  _obstacles: Array<{ x: number; y: number; width: number; height: number }>,
  style: ConnectionStyle
): ControlPoint[] {
  // Simple A* or visibility graph could go here
  // For now, return direct path
  const points: ControlPoint[] = [
    { ...source, isHandle: false },
  ];
  
  if (style === 'curved') {
    const dx = target.x - source.x;
    points.push({ x: source.x + dx * 0.5, y: source.y, isHandle: true });
    points.push({ x: target.x - dx * 0.5, y: target.y, isHandle: true });
  }
  
  points.push({ ...target, isHandle: false });
  
  return points;
}
