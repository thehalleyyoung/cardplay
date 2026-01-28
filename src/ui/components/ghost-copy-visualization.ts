/**
 * @fileoverview Ghost Copy Visualization System
 * 
 * Provides visual representation of ghost copies in tracker and piano roll views.
 * Ghost copies are rendered with semi-transparent overlays and visual links to their source.
 * 
 * Features:
 * - Visual link indicators (lines connecting ghost to source)
 * - Semi-transparent rendering for ghost events
 * - Color coding by copy type (shape-linked, rhythm-linked, etc.)
 * - Transform preview overlays
 * - Interactive ghost selection and editing
 * 
 * @module @cardplay/core/ui/components/ghost-copy-visualization
 */

import type { Event } from '../../types/event';
import type { GhostCopy, GhostCopyType } from '../../cards/phrase-system';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Visual representation of a ghost copy
 */
export interface GhostCopyVisual {
  /** Ghost copy data */
  readonly ghost: GhostCopy;
  /** Source phrase events for comparison */
  readonly sourceEvents: readonly Event<any>[];
  /** Resolved ghost events */
  readonly ghostEvents: readonly Event<any>[];
  /** Visual bounds in screen coordinates */
  readonly bounds: VisualBounds;
  /** Whether this ghost is currently selected */
  readonly isSelected: boolean;
  /** Whether this ghost is currently hovered */
  readonly isHovered: boolean;
}

/**
 * Visual bounds in screen coordinates
 */
export interface VisualBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Link visual configuration
 */
export interface GhostLinkVisual {
  /** Start point (source) */
  readonly from: { x: number; y: number };
  /** End point (ghost) */
  readonly to: { x: number; y: number };
  /** Copy type determines line style */
  readonly copyType: GhostCopyType;
  /** Whether link is active/highlighted */
  readonly isActive: boolean;
}

/**
 * Ghost copy rendering options
 */
export interface GhostRenderOptions {
  /** Base opacity for ghost events (0-1) */
  readonly ghostOpacity: number;
  /** Whether to show link lines */
  readonly showLinks: boolean;
  /** Whether to show transform labels */
  readonly showTransformLabels: boolean;
  /** Whether to highlight differences from source */
  readonly highlightDifferences: boolean;
  /** Scale factor for rendering */
  readonly scale: number;
}

// ============================================================================
// COLORS AND STYLES
// ============================================================================

/**
 * Color scheme for different ghost copy types
 */
export const GHOST_COPY_COLORS: Record<GhostCopyType, string> = {
  'linked': '#8B5CF6',           // Purple - fully linked
  'shape-linked': '#3B82F6',     // Blue - shape only
  'rhythm-linked': '#10B981',    // Green - rhythm only
  'chord-linked': '#F59E0B',     // Amber - chord context
  'scale-linked': '#EC4899',     // Pink - scale context
  'frozen': '#6B7280',           // Gray - no longer linked
};

/**
 * Default rendering options
 */
export const DEFAULT_GHOST_RENDER_OPTIONS: GhostRenderOptions = {
  ghostOpacity: 0.5,
  showLinks: true,
  showTransformLabels: true,
  highlightDifferences: true,
  scale: 1.0,
};

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

/**
 * Render ghost copy visualization on canvas
 */
export function renderGhostCopy(
  ctx: CanvasRenderingContext2D,
  visual: GhostCopyVisual,
  options: GhostRenderOptions = DEFAULT_GHOST_RENDER_OPTIONS
): void {
  const color = GHOST_COPY_COLORS[visual.ghost.copyType];
  
  // Save context state
  ctx.save();
  
  // Render ghost events with transparency
  ctx.globalAlpha = options.ghostOpacity * (visual.isHovered ? 1.2 : 1.0);
  
  // Render each ghost event
  visual.ghostEvents.forEach((event, idx) => {
    const sourceEvent = visual.sourceEvents[idx];
    
    // Compute event bounds (this would be provided by the parent view)
    const eventBounds = computeEventBounds(event, visual.bounds);
    
    // Fill with ghost color
    ctx.fillStyle = color;
    ctx.fillRect(eventBounds.x, eventBounds.y, eventBounds.width, eventBounds.height);
    
    // If highlighting differences, show comparison with source
    if (options.highlightDifferences && sourceEvent) {
      const sourceBounds = computeEventBounds(sourceEvent, visual.bounds);
      renderDifferenceIndicator(ctx, sourceBounds, eventBounds);
    }
  });
  
  // Restore context
  ctx.restore();
  
  // Render selection border if selected
  if (visual.isSelected) {
    renderSelectionBorder(ctx, visual.bounds, color);
  }
  
  // Render transform label if enabled
  if (options.showTransformLabels) {
    renderTransformLabel(ctx, visual);
  }
}

/**
 * Render link line between ghost and source
 */
export function renderGhostLink(
  ctx: CanvasRenderingContext2D,
  link: GhostLinkVisual
): void {
  const color = GHOST_COPY_COLORS[link.copyType];
  
  ctx.save();
  
  // Set line style based on copy type and active state
  ctx.strokeStyle = color;
  ctx.lineWidth = link.isActive ? 2 : 1;
  ctx.globalAlpha = link.isActive ? 0.8 : 0.4;
  
  // Draw bezier curve for more organic look
  ctx.beginPath();
  ctx.moveTo(link.from.x, link.from.y);
  
  // Control points for curve
  const controlPointOffset = Math.abs(link.to.x - link.from.x) * 0.5;
  const cp1x = link.from.x + controlPointOffset;
  const cp1y = link.from.y;
  const cp2x = link.to.x - controlPointOffset;
  const cp2y = link.to.y;
  
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, link.to.x, link.to.y);
  
  // Draw dashed line for some copy types
  if (link.copyType === 'shape-linked' || link.copyType === 'rhythm-linked') {
    ctx.setLineDash([5, 5]);
  }
  
  ctx.stroke();
  
  // Draw arrowhead at destination
  renderArrowhead(ctx, cp2x, cp2y, link.to.x, link.to.y, color);
  
  ctx.restore();
}

/**
 * Render all ghost copies in a view
 */
export function renderAllGhostCopies(
  ctx: CanvasRenderingContext2D,
  visuals: readonly GhostCopyVisual[],
  options: GhostRenderOptions = DEFAULT_GHOST_RENDER_OPTIONS
): void {
  // First pass: render all links (behind events)
  if (options.showLinks) {
    visuals.forEach((visual, idx) => {
      if (idx > 0) { // Skip first (it's the source)
        const sourceVisual = visuals[0];
        if (sourceVisual) {
          const link: GhostLinkVisual = {
            from: {
              x: sourceVisual.bounds.x + sourceVisual.bounds.width / 2,
              y: sourceVisual.bounds.y + sourceVisual.bounds.height / 2,
            },
            to: {
              x: visual.bounds.x + visual.bounds.width / 2,
              y: visual.bounds.y + visual.bounds.height / 2,
            },
            copyType: visual.ghost.copyType,
            isActive: visual.isSelected || visual.isHovered,
          };
          
          renderGhostLink(ctx, link);
        }
      }
    });
  }
  
  // Second pass: render all ghost events (on top of links)
  visuals.forEach(visual => {
    renderGhostCopy(ctx, visual, options);
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compute event bounds in screen coordinates
 * (This is a placeholder - actual implementation would depend on view type)
 */
function computeEventBounds(
  event: Event<any>,
  containerBounds: VisualBounds
): VisualBounds {
  // Simplified calculation - real implementation would use view-specific logic
  const ticksPerPixel = 0.1; // Example conversion
  
  return {
    x: containerBounds.x + (event.start as number) * ticksPerPixel,
    y: containerBounds.y,
    width: ((event.duration ?? 0) as number) * ticksPerPixel,
    height: containerBounds.height,
  };
}

/**
 * Render difference indicator between source and ghost event
 */
function renderDifferenceIndicator(
  ctx: CanvasRenderingContext2D,
  sourceBounds: VisualBounds,
  ghostBounds: VisualBounds
): void {
  ctx.save();
  
  // Draw subtle line showing displacement
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  
  ctx.beginPath();
  ctx.moveTo(
    sourceBounds.x + sourceBounds.width / 2,
    sourceBounds.y + sourceBounds.height / 2
  );
  ctx.lineTo(
    ghostBounds.x + ghostBounds.width / 2,
    ghostBounds.y + ghostBounds.height / 2
  );
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Render selection border around ghost copy
 */
function renderSelectionBorder(
  ctx: CanvasRenderingContext2D,
  bounds: VisualBounds,
  color: string
): void {
  ctx.save();
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 1.0;
  
  // Draw rounded rectangle border
  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(bounds.x + radius, bounds.y);
  ctx.lineTo(bounds.x + bounds.width - radius, bounds.y);
  ctx.quadraticCurveTo(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + radius);
  ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height - radius);
  ctx.quadraticCurveTo(bounds.x + bounds.width, bounds.y + bounds.height, bounds.x + bounds.width - radius, bounds.y + bounds.height);
  ctx.lineTo(bounds.x + radius, bounds.y + bounds.height);
  ctx.quadraticCurveTo(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height - radius);
  ctx.lineTo(bounds.x, bounds.y + radius);
  ctx.quadraticCurveTo(bounds.x, bounds.y, bounds.x + radius, bounds.y);
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Render transform label showing applied transformations
 */
function renderTransformLabel(
  ctx: CanvasRenderingContext2D,
  visual: GhostCopyVisual
): void {
  const transform = visual.ghost.transform;
  const labels: string[] = [];
  
  // Build label text from active transforms
  if (transform.transpose) {
    labels.push(`T${transform.transpose > 0 ? '+' : ''}${transform.transpose}`);
  }
  if (transform.octaveShift) {
    labels.push(`O${transform.octaveShift > 0 ? '+' : ''}${transform.octaveShift}`);
  }
  if (transform.stretch && transform.stretch !== 1.0) {
    labels.push(`×${transform.stretch.toFixed(2)}`);
  }
  if (transform.invert) {
    labels.push('↕');
  }
  if (transform.retrograde) {
    labels.push('←');
  }
  
  if (labels.length === 0) return;
  
  const labelText = labels.join(' ');
  
  ctx.save();
  
  // Position label at top-left of ghost bounds
  const x = visual.bounds.x + 4;
  const y = visual.bounds.y + 14;
  
  // Draw label background
  ctx.font = '11px monospace';
  const metrics = ctx.measureText(labelText);
  const padding = 4;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(
    x - padding,
    y - 11,
    metrics.width + padding * 2,
    14
  );
  
  // Draw label text
  ctx.fillStyle = GHOST_COPY_COLORS[visual.ghost.copyType];
  ctx.fillText(labelText, x, y);
  
  ctx.restore();
}

/**
 * Render arrowhead at end of link line
 */
function renderArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string
): void {
  const headLength = 8;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  ctx.save();
  ctx.fillStyle = color;
  
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

// ============================================================================
// INTERACTION HELPERS
// ============================================================================

/**
 * Check if point is inside ghost copy bounds
 */
export function isPointInGhostCopy(
  x: number,
  y: number,
  visual: GhostCopyVisual
): boolean {
  const { bounds } = visual;
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

/**
 * Find ghost copy at point
 */
export function findGhostCopyAtPoint(
  x: number,
  y: number,
  visuals: readonly GhostCopyVisual[]
): GhostCopyVisual | null {
  // Check in reverse order (top-most first)
  for (let i = visuals.length - 1; i >= 0; i--) {
    const visual = visuals[i];
    if (visual && isPointInGhostCopy(x, y, visual)) {
      return visual;
    }
  }
  return null;
}

/**
 * Compute ghost copy bounds from events and view state
 * (Placeholder - actual implementation depends on view type)
 */
export function computeGhostCopyBounds(
  events: readonly Event<any>[],
  viewBounds: VisualBounds,
  scrollX: number,
  scrollY: number,
  zoom: number
): VisualBounds {
  if (events.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  // Find min/max time and pitch (simplified)
  let minTick = Infinity;
  let maxTick = -Infinity;
  
  for (const event of events) {
    const start = event.start as number;
    const end = start + ((event.duration ?? 0) as number);
    minTick = Math.min(minTick, start);
    maxTick = Math.max(maxTick, end);
  }
  
  // Convert to screen coordinates (simplified)
  const ticksPerPixel = 0.1 / zoom;
  
  return {
    x: viewBounds.x + (minTick * ticksPerPixel) - scrollX,
    y: viewBounds.y - scrollY,
    width: (maxTick - minTick) * ticksPerPixel,
    height: viewBounds.height,
  };
}

// ============================================================================
// LEGEND AND UI HELPERS
// ============================================================================

/**
 * Render ghost copy type legend
 */
export function renderGhostCopyLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  const types: GhostCopyType[] = [
    'linked',
    'shape-linked',
    'rhythm-linked',
    'chord-linked',
    'scale-linked',
    'frozen',
  ];
  
  const labels: Record<GhostCopyType, string> = {
    'linked': 'Fully Linked',
    'shape-linked': 'Shape Only',
    'rhythm-linked': 'Rhythm Only',
    'chord-linked': 'Chord Context',
    'scale-linked': 'Scale Context',
    'frozen': 'Frozen (Independent)',
  };
  
  ctx.save();
  ctx.font = '12px sans-serif';
  
  let currentY = y;
  const lineHeight = 20;
  const swatchSize = 12;
  const padding = 8;
  
  types.forEach(type => {
    const color = GHOST_COPY_COLORS[type];
    const label = labels[type];
    
    // Draw color swatch
    ctx.fillStyle = color;
    ctx.fillRect(x, currentY, swatchSize, swatchSize);
    
    // Draw label
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, x + swatchSize + padding, currentY + swatchSize);
    
    currentY += lineHeight;
  });
  
  ctx.restore();
}

/**
 * Get tooltip text for ghost copy
 */
export function getGhostCopyTooltip(ghost: GhostCopy): string {
  const lines: string[] = [];
  
  lines.push(`Ghost Copy: ${ghost.copyType}`);
  lines.push(`Source: ${ghost.sourceId}`);
  
  const transform = ghost.transform;
  if (transform.transpose) {
    lines.push(`Transpose: ${transform.transpose > 0 ? '+' : ''}${transform.transpose} semitones`);
  }
  if (transform.octaveShift) {
    lines.push(`Octave: ${transform.octaveShift > 0 ? '+' : ''}${transform.octaveShift}`);
  }
  if (transform.stretch && transform.stretch !== 1.0) {
    lines.push(`Stretch: ${(transform.stretch * 100).toFixed(0)}%`);
  }
  if (transform.velocityScale && transform.velocityScale !== 1.0) {
    lines.push(`Velocity: ${(transform.velocityScale * 100).toFixed(0)}%`);
  }
  if (transform.timeOffset) {
    lines.push(`Time Offset: ${transform.timeOffset} ticks`);
  }
  if (transform.invert) {
    lines.push('Transform: Inverted');
  }
  if (transform.retrograde) {
    lines.push('Transform: Retrograde');
  }
  
  if (ghost.isFrozen) {
    lines.push('Status: Frozen (no longer updates)');
  }
  
  return lines.join('\n');
}
