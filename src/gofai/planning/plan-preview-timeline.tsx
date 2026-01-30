/**
 * @file Plan Preview Timeline Component
 * @module gofai/planning/plan-preview-timeline
 *
 * Implements Step 284 from gofai_goalB.md:
 * - Design a "plan preview timeline" that visually marks where edits apply
 * - Highlight bar ranges affected by each opcode
 * - Show temporal scope of operations clearly
 * - Allow users to see exactly what sections will be modified
 *
 * Key Features:
 * - Visual timeline representation matching project structure
 * - Color-coded highlights for different opcode categories
 * - Interactive tooltips showing edit details
 * - Zoom/pan for long compositions
 * - Section markers and measure numbers
 * - Layer-specific indicators (which tracks affected)
 * - Intensity/magnitude visualization
 *
 * Design Principles:
 * - Match CardPlay's existing timeline visual language
 * - Use familiar music production UI patterns
 * - Make scope boundaries crystal clear
 * - Prevent "where will this apply?" confusion
 * - Support both detailed and overview modes
 *
 * @see src/gofai/planning/plan-types.ts (opcode definitions)
 * @see src/gofai/planning/plan-selection-ui.tsx (parent context)
 * @see src/gofai/execution/diff-types.ts (what actually changed)
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { CPLPlan, BaseOpcode, OpcodeCategory } from './plan-types';
import type { CPLScope } from '../canon/cpl-types';
import type { ProjectState } from '../execution/transactional-execution';

// ============================================================================
// Types
// ============================================================================

/**
 * Time range in musical units (bars and beats)
 */
export interface TimeRange {
  readonly startBar: number;
  readonly startBeat: number;
  readonly endBar: number;
  readonly endBeat: number;
}

/**
 * A highlighted region on the timeline for a specific opcode
 */
export interface TimelineHighlight {
  readonly opcodeId: string;
  readonly opcodeName: string;
  readonly category: OpcodeCategory;
  readonly range: TimeRange;
  readonly affectedLayers: readonly string[]; // Track IDs
  readonly intensity: number; // 0-1, magnitude of change
  readonly description: string;
  readonly color: string;
}

/**
 * Section marker for the timeline
 */
export interface SectionMarker {
  readonly id: string;
  readonly name: string;
  readonly startBar: number;
  readonly endBar: number;
  readonly color?: string;
}

/**
 * Props for PlanPreviewTimeline component
 */
export interface PlanPreviewTimelineProps {
  /** The plan to visualize */
  readonly plan: CPLPlan;

  /** Current project state (for structure info) */
  readonly projectState: ProjectState;

  /** Height of timeline in pixels */
  readonly height?: number;

  /** Whether to show layer-specific highlights */
  readonly showLayers?: boolean;

  /** Whether to show measure numbers */
  readonly showMeasures?: boolean;

  /** Whether to show section markers */
  readonly showSections?: boolean;

  /** Callback when user clicks on a highlight */
  readonly onHighlightClick?: (opcodeId: string) => void;

  /** Callback when user hovers over a highlight */
  readonly onHighlightHover?: (opcodeId: string | null) => void;

  /** Currently selected opcode ID */
  readonly selectedOpcodeId?: string;

  /** Whether timeline is in compact mode */
  readonly compact?: boolean;
}

/**
 * Viewport state for zoom/pan
 */
interface ViewportState {
  startBar: number;
  endBar: number;
  zoom: number; // pixels per bar
}

// ============================================================================
// Opcode Category Colors
// ============================================================================

const CATEGORY_COLORS: Record<OpcodeCategory, string> = {
  'structure': '#8B5CF6',    // Purple - structural changes
  'event': '#3B82F6',        // Blue - note edits
  'harmony': '#10B981',      // Green - harmonic changes
  'melody': '#F59E0B',       // Amber - melodic alterations
  'rhythm': '#EF4444',       // Red - timing changes
  'texture': '#EC4899',      // Pink - density/layering
  'production': '#6366F1',   // Indigo - DSP/mixing
  'routing': '#8B5CF6',      // Purple - signal flow
  'metadata': '#6B7280',     // Gray - labels/colors
};

const CATEGORY_LABELS: Record<OpcodeCategory, string> = {
  'structure': 'Structure',
  'event': 'Events',
  'harmony': 'Harmony',
  'melody': 'Melody',
  'rhythm': 'Rhythm',
  'texture': 'Texture',
  'production': 'Production',
  'routing': 'Routing',
  'metadata': 'Metadata',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract time range from CPL scope
 */
function scopeToTimeRange(scope: CPLScope, projectState: ProjectState): TimeRange | null {
  // Check if scope has timeRange
  if (scope.timeRange) {
    const tr = scope.timeRange;
    
    // Handle bar-based range
    if (tr.bars) {
      return {
        startBar: tr.bars[0],
        startBeat: 0,
        endBar: tr.bars[1],
        endBeat: 0,
      };
    }
    
    // Handle tick-based range (convert to bars)
    if (tr.start !== undefined && tr.end !== undefined) {
      // Rough conversion: assume 960 ticks per quarter note, 4 beats per bar
      const ticksPerBar = 960 * 4;
      return {
        startBar: Math.floor(tr.start / ticksPerBar),
        startBeat: Math.floor((tr.start % ticksPerBar) / 960),
        endBar: Math.floor(tr.end / ticksPerBar),
        endBeat: Math.floor((tr.end % ticksPerBar) / 960),
      };
    }
    
    // Handle section-based range
    if (tr.sections && tr.sections.length > 0) {
      const section = findSectionByName(projectState, tr.sections[0]);
      if (section) {
        return {
          startBar: section.startBar,
          startBeat: 0,
          endBar: section.endBar,
          endBeat: 0,
        };
      }
    }
  }
  
  // If no timeRange specified, assume whole project
  return {
    startBar: 0,
    startBeat: 0,
    endBar: getProjectLengthInBars(projectState),
    endBeat: 0,
  };
}

/**
 * Find section by name in project state
 */
function findSectionByName(projectState: ProjectState, sectionName: string): SectionMarker | null {
  const sections = projectState.sections?.getAll() || [];
  const section = sections.find((s: any) => s.name === sectionName);
  if (section) {
    return {
      id: section.id,
      name: section.name,
      startBar: section.startBar || 0,
      endBar: section.endBar || 0,
      color: section.color,
    };
  }
  return null;
}

/**
 * Get project length in bars
 */
function getProjectLengthInBars(projectState: ProjectState): number {
  // Try to get from metadata
  if (projectState.metadata && 'lengthInBars' in projectState.metadata) {
    return (projectState.metadata as any).lengthInBars || 32;
  }
  // Default fallback
  return 32;
}

/**
 * Extract affected layer IDs from opcode
 */
function getAffectedLayers(opcode: BaseOpcode, projectState: ProjectState): readonly string[] {
  const scope = opcode.scope;
  
  // Check if scope has entity selector
  if (scope.entities) {
    // Would need to evaluate selector against project state
    // For now, return empty array
    return [];
  }

  // If no specific entities, assume all tracks
  return [];
}

/**
 * Estimate intensity/magnitude of change from opcode
 */
function estimateIntensity(opcode: BaseOpcode): number {
  // Look at opcode params to gauge magnitude
  const params = opcode.params;

  // Check for amount/degree parameters
  if ('amount' in params) {
    const amount = params.amount;
    if (typeof amount === 'number') {
      return Math.min(Math.abs(amount), 1.0);
    }
    if (typeof amount === 'string') {
      // Map degree words to intensities
      const degreeMap: Record<string, number> = {
        'a-bit': 0.2,
        'a-little': 0.3,
        'somewhat': 0.4,
        'moderately': 0.5,
        'significantly': 0.7,
        'very': 0.8,
        'extremely': 0.95,
      };
      return degreeMap[amount] || 0.5;
    }
  }

  if ('degree' in params) {
    const degree = params.degree;
    if (typeof degree === 'number') {
      return Math.min(degree, 1.0);
    }
  }

  // Default moderate intensity
  return 0.5;
}

/**
 * Convert opcode to timeline highlight
 */
function opcodeToHighlight(
  opcode: BaseOpcode,
  projectState: ProjectState
): TimelineHighlight | null {
  const range = scopeToTimeRange(opcode.scope, projectState);
  if (!range) return null;

  const affectedLayers = getAffectedLayers(opcode, projectState);
  const intensity = estimateIntensity(opcode);

  return {
    opcodeId: opcode.id,
    opcodeName: opcode.name,
    category: opcode.category,
    range,
    affectedLayers,
    intensity,
    description: opcode.description,
    color: CATEGORY_COLORS[opcode.category],
  };
}

/**
 * Extract section markers from project state
 */
function extractSectionMarkers(projectState: ProjectState): readonly SectionMarker[] {
  const sections = projectState.sections?.getAll() || [];
  return sections.map((s: any) => ({
    id: s.id,
    name: s.name,
    startBar: s.startBar || 0,
    endBar: s.endBar || 0,
    color: s.color,
  }));
}

// ============================================================================
// Timeline Rendering Helpers
// ============================================================================

/**
 * Calculate pixel position for a bar number
 */
function barToPixels(bar: number, viewport: ViewportState): number {
  return (bar - viewport.startBar) * viewport.zoom;
}

/**
 * Calculate bar number from pixel position
 */
function pixelsToBar(pixels: number, viewport: ViewportState): number {
  return viewport.startBar + pixels / viewport.zoom;
}

/**
 * Format bar number for display
 */
function formatBarNumber(bar: number): string {
  return `${Math.floor(bar) + 1}`; // 1-indexed for display
}

/**
 * Calculate smart zoom level based on project length and available width
 */
function calculateDefaultZoom(projectLength: number, width: number): number {
  const minZoom = 5;   // Minimum pixels per bar (very zoomed out)
  const maxZoom = 100; // Maximum pixels per bar (very zoomed in)
  const targetBarsVisible = 32; // Aim to show ~32 bars at default zoom

  const zoom = width / targetBarsVisible;
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Measure ruler showing bar numbers
 */
interface MeasureRulerProps {
  viewport: ViewportState;
  width: number;
  height: number;
}

const MeasureRuler: React.FC<MeasureRulerProps> = ({ viewport, width, height }) => {
  const bars = useMemo(() => {
    const result: number[] = [];
    const startBar = Math.floor(viewport.startBar);
    const endBar = Math.ceil(viewport.endBar);
    
    for (let bar = startBar; bar <= endBar; bar++) {
      result.push(bar);
    }
    
    return result;
  }, [viewport]);

  return (
    <div
      className="measure-ruler"
      style={{
        position: 'relative',
        width,
        height,
        borderBottom: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {bars.map(bar => {
        const x = barToPixels(bar, viewport);
        if (x < 0 || x > width) return null;

        return (
          <div
            key={bar}
            className="measure-tick"
            style={{
              position: 'absolute',
              left: x,
              top: 0,
              height: '100%',
              borderLeft: bar % 4 === 0 ? '2px solid var(--border-primary)' : '1px solid var(--border-secondary)',
            }}
          >
            {bar % 4 === 0 && (
              <span
                style={{
                  position: 'absolute',
                  left: 4,
                  top: 4,
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  userSelect: 'none',
                }}
              >
                {formatBarNumber(bar)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Section marker display
 */
interface SectionMarkerDisplayProps {
  section: SectionMarker;
  viewport: ViewportState;
  height: number;
}

const SectionMarkerDisplay: React.FC<SectionMarkerDisplayProps> = ({ section, viewport, height }) => {
  const startX = barToPixels(section.startBar, viewport);
  const endX = barToPixels(section.endBar, viewport);
  const width = endX - startX;

  if (width <= 0 || startX > viewport.endBar || endX < viewport.startBar) {
    return null;
  }

  return (
    <div
      className="section-marker"
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width,
        height,
        borderLeft: '2px solid ' + (section.color || 'var(--accent-primary)'),
        borderRight: '1px solid var(--border-secondary)',
        backgroundColor: section.color ? `${section.color}15` : 'transparent',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 4,
          top: 4,
          fontSize: '12px',
          fontWeight: 600,
          color: section.color || 'var(--text-primary)',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          userSelect: 'none',
        }}
      >
        {section.name}
      </div>
    </div>
  );
};

/**
 * Opcode highlight visualization
 */
interface HighlightDisplayProps {
  highlight: TimelineHighlight;
  viewport: ViewportState;
  height: number;
  layerOffset: number;
  layerHeight: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const HighlightDisplay: React.FC<HighlightDisplayProps> = ({
  highlight,
  viewport,
  height,
  layerOffset,
  layerHeight,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const startX = barToPixels(highlight.range.startBar, viewport);
  const endX = barToPixels(highlight.range.endBar, viewport);
  const width = endX - startX;

  if (width <= 0 || startX > viewport.endBar || endX < viewport.startBar) {
    return null;
  }

  const opacity = 0.3 + highlight.intensity * 0.5; // More intense = more opaque

  return (
    <div
      className={`timeline-highlight ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: Math.max(0, startX),
        top: layerOffset,
        width: Math.min(width, viewport.endBar * viewport.zoom),
        height: layerHeight,
        backgroundColor: highlight.color,
        opacity,
        border: isSelected ? `2px solid ${highlight.color}` : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'opacity 0.15s, transform 0.15s',
        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`${highlight.opcodeName}: ${highlight.description}`}
    >
      {/* Intensity indicator */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: `${highlight.intensity * 100}%`,
          height: 3,
          backgroundColor: highlight.color,
          opacity: 0.8,
        }}
      />

      {/* Label for wide enough highlights */}
      {width > 50 && (
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: width - 8,
          }}
        >
          {highlight.opcodeName}
        </div>
      )}
    </div>
  );
};

/**
 * Tooltip for highlight details
 */
interface HighlightTooltipProps {
  highlight: TimelineHighlight;
  position: { x: number; y: number };
}

const HighlightTooltip: React.FC<HighlightTooltipProps> = ({ highlight, position }) => {
  return (
    <div
      className="timeline-tooltip"
      style={{
        position: 'fixed',
        left: position.x + 10,
        top: position.y + 10,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: 4,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 10000,
        pointerEvents: 'none',
        maxWidth: 300,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, color: highlight.color }}>
        {highlight.opcodeName}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4 }}>
        {CATEGORY_LABELS[highlight.category]}
      </div>
      <div style={{ fontSize: '12px', marginBottom: 4 }}>
        {highlight.description}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Bars {highlight.range.startBar + 1}–{highlight.range.endBar + 1}
      </div>
      {highlight.affectedLayers.length > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4 }}>
          Affects {highlight.affectedLayers.length} layer(s)
        </div>
      )}
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4 }}>
        Intensity: {Math.round(highlight.intensity * 100)}%
      </div>
    </div>
  );
};

/**
 * Legend showing opcode categories
 */
interface CategoryLegendProps {
  categories: readonly OpcodeCategory[];
}

const CategoryLegend: React.FC<CategoryLegendProps> = ({ categories }) => {
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(categories));
  }, [categories]);

  return (
    <div
      className="timeline-legend"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: '8px 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
      }}
    >
      {uniqueCategories.map(category => (
        <div
          key={category}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '11px',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: CATEGORY_COLORS[category],
              borderRadius: 2,
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {CATEGORY_LABELS[category]}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Plan Preview Timeline Component
 * 
 * Visualizes where plan opcodes will apply on a musical timeline.
 * Shows sections, measures, and color-coded edit regions with intensity.
 */
export const PlanPreviewTimeline: React.FC<PlanPreviewTimelineProps> = ({
  plan,
  projectState,
  height = 200,
  showLayers = true,
  showMeasures = true,
  showSections = true,
  onHighlightClick,
  onHighlightHover,
  selectedOpcodeId,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoveredOpcodeId, setHoveredOpcodeId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Calculate viewport
  const projectLength = getProjectLengthInBars(projectState);
  const [viewport, setViewport] = useState<ViewportState>({
    startBar: 0,
    endBar: projectLength,
    zoom: 20, // pixels per bar
  });

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Recalculate zoom when width changes
  useEffect(() => {
    const zoom = calculateDefaultZoom(projectLength, containerWidth);
    setViewport(prev => ({
      ...prev,
      zoom,
      endBar: prev.startBar + containerWidth / zoom,
    }));
  }, [containerWidth, projectLength]);

  // Extract highlights from plan
  const highlights = useMemo(() => {
    return plan.opcodes
      .map(opcode => opcodeToHighlight(opcode, projectState))
      .filter((h): h is TimelineHighlight => h !== null);
  }, [plan, projectState]);

  // Extract sections
  const sections = useMemo(() => {
    return showSections ? extractSectionMarkers(projectState) : [];
  }, [projectState, showSections]);

  // Get unique categories for legend
  const categories = useMemo(() => {
    return highlights.map(h => h.category);
  }, [highlights]);

  // Handle highlight interactions
  const handleHighlightClick = useCallback((opcodeId: string) => {
    onHighlightClick?.(opcodeId);
  }, [onHighlightClick]);

  const handleHighlightHover = useCallback((opcodeId: string | null, event?: React.MouseEvent) => {
    setHoveredOpcodeId(opcodeId);
    onHighlightHover?.(opcodeId);
    
    if (event && opcodeId) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    } else {
      setTooltipPosition(null);
    }
  }, [onHighlightHover]);

  // Calculate layout dimensions
  const rulerHeight = showMeasures ? 32 : 0;
  const timelineHeight = height - rulerHeight;
  const layerHeight = showLayers ? 40 : timelineHeight;

  return (
    <div
      ref={containerRef}
      className="plan-preview-timeline"
      style={{
        width: '100%',
        height: height + (compact ? 0 : 40), // Extra space for legend
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Measure ruler */}
      {showMeasures && (
        <MeasureRuler
          viewport={viewport}
          width={containerWidth}
          height={rulerHeight}
        />
      )}

      {/* Timeline content */}
      <div
        className="timeline-content"
        style={{
          position: 'relative',
          width: containerWidth,
          height: timelineHeight,
          backgroundColor: 'var(--bg-primary)',
          overflow: 'hidden',
        }}
      >
        {/* Section markers */}
        {sections.map(section => (
          <SectionMarkerDisplay
            key={section.id}
            section={section}
            viewport={viewport}
            height={timelineHeight}
          />
        ))}

        {/* Opcode highlights */}
        {highlights.map((highlight, index) => (
          <HighlightDisplay
            key={highlight.opcodeId}
            highlight={highlight}
            viewport={viewport}
            height={timelineHeight}
            layerOffset={showLayers ? (index % 3) * layerHeight : 0}
            layerHeight={layerHeight}
            isSelected={highlight.opcodeId === selectedOpcodeId}
            onClick={() => handleHighlightClick(highlight.opcodeId)}
            onMouseEnter={(e) => handleHighlightHover(highlight.opcodeId, e)}
            onMouseLeave={() => handleHighlightHover(null)}
          />
        ))}

        {/* Playhead / current position indicator could go here */}
      </div>

      {/* Category legend */}
      {!compact && (
        <CategoryLegend categories={categories} />
      )}

      {/* Tooltip */}
      {hoveredOpcodeId && tooltipPosition && (
        <HighlightTooltip
          highlight={highlights.find(h => h.opcodeId === hoveredOpcodeId)!}
          position={tooltipPosition}
        />
      )}
    </div>
  );
};

export default PlanPreviewTimeline;
