/**
 * @fileoverview Layout Bridge - Phase 4 → Phase 43 Integration.
 * 
 * This module bridges the Phase 4 layout system (Panel, SplitPane, DockLayout,
 * TabPanel, Grid, etc.) with the Phase 43 CardPlay deck layout system to create
 * a cohesive spatial organization experience.
 * 
 * Key integrations:
 * - Phase 4 Panel → Phase 43 StackComponent
 * - Phase 4 SplitPane → Phase 43 deck orientation
 * - Phase 4 DockLayout → Phase 43 zone system
 * - Phase 4 Grid → Phase 43 card positioning
 * - Layout presets for different DAW workflows
 * 
 * @see cardplayui.md Section 2: Layout Architecture
 * @see cardplayui.md Section 3: Stack System
 * @see cardplayui.md Section 9: DAW-Native Layouts
 * @see currentsteps.md Phase 4.3: Layout System
 */

import type { UserPersona, UserBackground } from './beginner-bridge';

// ============================================================================
// LAYOUT ORIENTATION TYPES (from cardplayui.md Section 2.2)
// ============================================================================

/**
 * Layout orientation options.
 */
export type LayoutOrientation = 
  | 'horizontal'   // Stacks flow left-to-right (signal chains, timeline)
  | 'vertical'     // Stacks flow top-to-bottom (orchestral scores, trackers)
  | 'grid'         // 2D matrix arrangement (session view, drum machines)
  | 'radial'       // Circular arrangement (live performance, DJ)
  | 'freeform';    // No constraints (sound design, experimentation)

/**
 * Connection rendering style.
 */
export type ConnectionStyle = 'straight' | 'curved' | 'stepped';

// ============================================================================
// DECK LAYOUT TYPES (from cardplayui.md Section 2.1)
// ============================================================================

/**
 * Complete deck layout configuration.
 * Direct implementation of cardplayui.md Section 2.1 DeckLayout interface.
 */
export interface DeckLayout {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly author: string;
  readonly version: string;
  readonly orientation: LayoutOrientation;
  
  // Canvas dimensions
  readonly width: number;           // Total width in pixels
  readonly height: number;          // Total height in pixels
  readonly padding: number;         // Inner padding
  
  // Organization
  readonly stacks: readonly StackConfig[];    // Named card groupings
  readonly zones: readonly LayoutZone[];      // Drop target areas
  
  // Routing
  readonly defaultConnections: readonly ConnectionTemplate[];
  
  // Visual options
  readonly showGrid: boolean;
  readonly gridSize: number;        // Snap grid in pixels
  readonly snapToGrid: boolean;
  readonly showConnections: boolean;
  readonly connectionStyle: ConnectionStyle;
  
  // Behavior
  readonly allowFreeform: boolean;  // Cards outside stacks
  readonly autoArrange: boolean;    // Auto-position on add
  readonly lockPositions: boolean;  // Prevent dragging
}

// ============================================================================
// STACK TYPES (from cardplayui.md Section 3)
// ============================================================================

/**
 * Stack semantic type.
 */
export type StackType = 
  | 'instrument'   // Sound sources
  | 'midi'         // Note/CC processing
  | 'effect'       // Audio processing
  | 'routing'      // Signal flow
  | 'generator'    // Algorithmic sources
  | 'analysis'     // Visualization
  | 'utility'      // Tools
  | 'custom';      // User-defined

/**
 * Card category for filtering.
 */
export type CardCategory = 
  | 'generator'
  | 'instrument'
  | 'effect'
  | 'midi'
  | 'routing'
  | 'modulation'
  | 'utility'
  | 'analysis';

/**
 * Stack configuration.
 * Direct implementation of cardplayui.md Section 3.1.
 */
export interface StackConfig {
  readonly id: string;              // Unique identifier
  readonly name: string;            // Display name
  readonly type: StackType;         // Semantic type
  readonly orientation: 'horizontal' | 'vertical';
  readonly maxCards: number;        // Capacity limit
  readonly collapsible: boolean;    // Can minimize
  readonly defaultCollapsed: boolean;
  readonly acceptsTypes: readonly CardCategory[];  // Allowed card types
  readonly color: string;           // Header/accent color
  readonly icon: string;            // Header icon (emoji)
  
  // Position within deck
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// ============================================================================
// ZONE TYPES (from cardplayui.md Section 4.2)
// ============================================================================

/**
 * Layout zone for drop targets.
 */
export interface LayoutZone {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly acceptsTypes: readonly CardCategory[];
  readonly maxCards: number;
  readonly stackId: string | null;  // Associated stack
}

// ============================================================================
// CARD POSITION (from cardplayui.md Section 4.1)
// ============================================================================

/**
 * Card position within deck.
 */
export interface CardPosition {
  readonly cardId: string;
  readonly stackId: string | null;  // null = freeform
  readonly x: number;               // Pixel position
  readonly y: number;
  readonly width: number;           // Card dimensions
  readonly height: number;
  readonly zIndex: number;          // Stacking order
  readonly rotation: number;        // Degrees (0 = upright)
  readonly scale: number;           // 1.0 = normal size
  readonly pinned: boolean;         // Prevent auto-arrange
}

// ============================================================================
// CONNECTION TEMPLATE
// ============================================================================

/**
 * Connection template for default routing.
 */
export interface ConnectionTemplate {
  readonly fromStackType: StackType | '*';
  readonly toStackType: StackType | '*';
  readonly connectionType: 'audio' | 'midi' | 'modulation';
  readonly autoCreate: boolean;
}

// ============================================================================
// DAW-NATIVE LAYOUT PRESETS (from cardplayui.md Section 9)
// ============================================================================

/**
 * Renoise-style vertical tracker layout.
 */
export const RENOISE_LAYOUT: DeckLayout = {
  id: 'renoise-vertical',
  name: 'Renoise Tracker',
  description: 'Vertical tracker-style layout inspired by Renoise',
  author: 'CardPlay',
  version: '1.0.0',
  orientation: 'vertical',
  
  width: 1920,
  height: 1080,
  padding: 8,
  
  stacks: [
    {
      id: 'pattern',
      name: 'Pattern Editor',
      type: 'utility',
      orientation: 'vertical',
      maxCards: 1,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#88cc44',
      icon: '📊',
      x: 0,
      y: 0,
      width: 600,
      height: 800,
    },
    {
      id: 'instruments',
      name: 'Instruments',
      type: 'instrument',
      orientation: 'vertical',
      maxCards: 32,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['generator', 'instrument'],
      color: '#4488cc',
      icon: '🎹',
      x: 608,
      y: 0,
      width: 400,
      height: 400,
    },
    {
      id: 'effects',
      name: 'DSP Chain',
      type: 'effect',
      orientation: 'horizontal',
      maxCards: 16,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['effect'],
      color: '#cc88cc',
      icon: '🎛️',
      x: 608,
      y: 408,
      width: 400,
      height: 392,
    },
    {
      id: 'mixer',
      name: 'Mixer',
      type: 'routing',
      orientation: 'horizontal',
      maxCards: 64,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['routing'],
      color: '#ccaa44',
      icon: '🎚️',
      x: 1016,
      y: 0,
      width: 896,
      height: 800,
    },
  ],
  
  zones: [
    {
      id: 'pattern-zone',
      name: 'Pattern Editor',
      x: 0,
      y: 0,
      width: 600,
      height: 800,
      acceptsTypes: ['utility'],
      maxCards: 1,
      stackId: 'pattern',
    },
    {
      id: 'instrument-zone',
      name: 'Instruments',
      x: 608,
      y: 0,
      width: 400,
      height: 400,
      acceptsTypes: ['generator', 'instrument'],
      maxCards: 32,
      stackId: 'instruments',
    },
  ],
  
  defaultConnections: [
    { fromStackType: 'instrument', toStackType: 'effect', connectionType: 'audio', autoCreate: true },
    { fromStackType: 'effect', toStackType: 'routing', connectionType: 'audio', autoCreate: true },
  ],
  
  showGrid: true,
  gridSize: 8,
  snapToGrid: true,
  showConnections: true,
  connectionStyle: 'stepped',
  
  allowFreeform: false,
  autoArrange: true,
  lockPositions: false,
};

/**
 * Ableton-style session view layout.
 */
export const ABLETON_LAYOUT: DeckLayout = {
  id: 'ableton-session',
  name: 'Ableton Session',
  description: 'Grid-based session view inspired by Ableton Live',
  author: 'CardPlay',
  version: '1.0.0',
  orientation: 'grid',
  
  width: 1920,
  height: 1080,
  padding: 8,
  
  stacks: [
    {
      id: 'track-1',
      name: 'Track 1',
      type: 'instrument',
      orientation: 'vertical',
      maxCards: 16,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['generator', 'instrument', 'effect'],
      color: '#ff764d',
      icon: '🎵',
      x: 0,
      y: 0,
      width: 200,
      height: 800,
    },
    {
      id: 'track-2',
      name: 'Track 2',
      type: 'instrument',
      orientation: 'vertical',
      maxCards: 16,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['generator', 'instrument', 'effect'],
      color: '#96d35f',
      icon: '🎵',
      x: 208,
      y: 0,
      width: 200,
      height: 800,
    },
    {
      id: 'track-3',
      name: 'Track 3',
      type: 'instrument',
      orientation: 'vertical',
      maxCards: 16,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['generator', 'instrument', 'effect'],
      color: '#5fcfcf',
      icon: '🎵',
      x: 416,
      y: 0,
      width: 200,
      height: 800,
    },
    {
      id: 'track-4',
      name: 'Track 4',
      type: 'instrument',
      orientation: 'vertical',
      maxCards: 16,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['generator', 'instrument', 'effect'],
      color: '#e066ff',
      icon: '🎵',
      x: 624,
      y: 0,
      width: 200,
      height: 800,
    },
    {
      id: 'master',
      name: 'Master',
      type: 'routing',
      orientation: 'vertical',
      maxCards: 8,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['effect', 'routing', 'analysis'],
      color: '#f0ad4e',
      icon: '🎚️',
      x: 1712,
      y: 0,
      width: 200,
      height: 800,
    },
    {
      id: 'browser',
      name: 'Browser',
      type: 'utility',
      orientation: 'vertical',
      maxCards: 1,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#5a5a5a',
      icon: '📁',
      x: 832,
      y: 0,
      width: 300,
      height: 800,
    },
    {
      id: 'detail',
      name: 'Detail View',
      type: 'utility',
      orientation: 'horizontal',
      maxCards: 1,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#3a3a3a',
      icon: '🔍',
      x: 0,
      y: 808,
      width: 1920,
      height: 264,
    },
  ],
  
  zones: [],
  
  defaultConnections: [
    { fromStackType: 'instrument', toStackType: 'routing', connectionType: 'audio', autoCreate: true },
  ],
  
  showGrid: true,
  gridSize: 16,
  snapToGrid: true,
  showConnections: false, // Ableton hides connections in session view
  connectionStyle: 'straight',
  
  allowFreeform: false,
  autoArrange: true,
  lockPositions: true, // Grid is fixed in session view
};

/**
 * Cubase-style arrange view layout.
 */
export const CUBASE_LAYOUT: DeckLayout = {
  id: 'cubase-arrange',
  name: 'Cubase Arrange',
  description: 'Horizontal arrangement view inspired by Cubase',
  author: 'CardPlay',
  version: '1.0.0',
  orientation: 'horizontal',
  
  width: 1920,
  height: 1080,
  padding: 8,
  
  stacks: [
    {
      id: 'track-list',
      name: 'Track List',
      type: 'utility',
      orientation: 'vertical',
      maxCards: 64,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['generator', 'instrument', 'effect', 'midi'],
      color: '#4a5568',
      icon: '📋',
      x: 0,
      y: 40,
      width: 250,
      height: 700,
    },
    {
      id: 'arrangement',
      name: 'Arrangement',
      type: 'utility',
      orientation: 'horizontal',
      maxCards: 1,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#2d3748',
      icon: '📐',
      x: 258,
      y: 40,
      width: 1400,
      height: 700,
    },
    {
      id: 'inspector',
      name: 'Inspector',
      type: 'utility',
      orientation: 'vertical',
      maxCards: 1,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#374151',
      icon: 'ℹ️',
      x: 1666,
      y: 40,
      width: 246,
      height: 700,
    },
    {
      id: 'mixer',
      name: 'MixConsole',
      type: 'routing',
      orientation: 'horizontal',
      maxCards: 64,
      collapsible: true,
      defaultCollapsed: true,
      acceptsTypes: ['routing', 'effect', 'analysis'],
      color: '#1f2937',
      icon: '🎛️',
      x: 0,
      y: 748,
      width: 1912,
      height: 324,
    },
    {
      id: 'transport',
      name: 'Transport',
      type: 'utility',
      orientation: 'horizontal',
      maxCards: 1,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#111827',
      icon: '⏯️',
      x: 0,
      y: 0,
      width: 1912,
      height: 32,
    },
  ],
  
  zones: [],
  
  defaultConnections: [],
  
  showGrid: true,
  gridSize: 16,
  snapToGrid: true,
  showConnections: true,
  connectionStyle: 'curved',
  
  allowFreeform: true,
  autoArrange: false, // Cubase allows freeform arrangement
  lockPositions: false,
};

/**
 * Dorico-style score view layout.
 */
export const DORICO_LAYOUT: DeckLayout = {
  id: 'dorico-score',
  name: 'Dorico Score',
  description: 'Notation-focused layout inspired by Dorico',
  author: 'CardPlay',
  version: '1.0.0',
  orientation: 'vertical',
  
  width: 1920,
  height: 1080,
  padding: 8,
  
  stacks: [
    {
      id: 'score',
      name: 'Score',
      type: 'utility',
      orientation: 'vertical',
      maxCards: 1,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#f5f5dc',
      icon: '🎼',
      x: 250,
      y: 40,
      width: 1420,
      height: 800,
    },
    {
      id: 'players',
      name: 'Players',
      type: 'instrument',
      orientation: 'vertical',
      maxCards: 32,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['instrument'],
      color: '#e8dcc8',
      icon: '👤',
      x: 0,
      y: 40,
      width: 242,
      height: 400,
    },
    {
      id: 'layouts',
      name: 'Layouts',
      type: 'utility',
      orientation: 'vertical',
      maxCards: 8,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#d4c8b8',
      icon: '📄',
      x: 0,
      y: 448,
      width: 242,
      height: 392,
    },
    {
      id: 'properties',
      name: 'Properties',
      type: 'utility',
      orientation: 'vertical',
      maxCards: 1,
      collapsible: true,
      defaultCollapsed: false,
      acceptsTypes: ['utility'],
      color: '#c8bca8',
      icon: '⚙️',
      x: 1678,
      y: 40,
      width: 234,
      height: 800,
    },
    {
      id: 'playback',
      name: 'Playback',
      type: 'routing',
      orientation: 'horizontal',
      maxCards: 16,
      collapsible: true,
      defaultCollapsed: true,
      acceptsTypes: ['instrument', 'effect', 'routing'],
      color: '#3a3a4a',
      icon: '🔊',
      x: 0,
      y: 848,
      width: 1912,
      height: 224,
    },
  ],
  
  zones: [],
  
  defaultConnections: [],
  
  showGrid: false, // Notation view doesn't use grid
  gridSize: 1,
  snapToGrid: false,
  showConnections: false, // Hide connections in score view
  connectionStyle: 'curved',
  
  allowFreeform: false,
  autoArrange: true,
  lockPositions: true,
};

/**
 * Simplified beginner layout.
 */
export const SIMPLIFIED_LAYOUT: DeckLayout = {
  id: 'simplified-horizontal',
  name: 'Simple View',
  description: 'Simplified layout for beginners',
  author: 'CardPlay',
  version: '1.0.0',
  orientation: 'horizontal',
  
  width: 1920,
  height: 1080,
  padding: 16,
  
  stacks: [
    {
      id: 'sounds',
      name: 'Sounds',
      type: 'instrument',
      orientation: 'horizontal',
      maxCards: 8,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['generator', 'instrument'],
      color: '#3b82f6',
      icon: '🎵',
      x: 16,
      y: 100,
      width: 1888,
      height: 300,
    },
    {
      id: 'effects',
      name: 'Effects',
      type: 'effect',
      orientation: 'horizontal',
      maxCards: 4,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['effect'],
      color: '#8b5cf6',
      icon: '✨',
      x: 16,
      y: 416,
      width: 1888,
      height: 250,
    },
    {
      id: 'output',
      name: 'Output',
      type: 'routing',
      orientation: 'horizontal',
      maxCards: 1,
      collapsible: false,
      defaultCollapsed: false,
      acceptsTypes: ['routing', 'analysis'],
      color: '#22c55e',
      icon: '🔊',
      x: 16,
      y: 682,
      width: 400,
      height: 200,
    },
  ],
  
  zones: [],
  
  defaultConnections: [
    { fromStackType: 'instrument', toStackType: 'effect', connectionType: 'audio', autoCreate: true },
    { fromStackType: 'effect', toStackType: 'routing', connectionType: 'audio', autoCreate: true },
  ],
  
  showGrid: false,
  gridSize: 16,
  snapToGrid: true,
  showConnections: true,
  connectionStyle: 'curved',
  
  allowFreeform: false,
  autoArrange: true,
  lockPositions: true,
};

/**
 * Modular/freeform sound design layout.
 */
export const MODULAR_LAYOUT: DeckLayout = {
  id: 'modular-freeform',
  name: 'Modular',
  description: 'Freeform modular-style layout for sound design',
  author: 'CardPlay',
  version: '1.0.0',
  orientation: 'freeform',
  
  width: 4000,
  height: 3000,
  padding: 8,
  
  stacks: [], // No predefined stacks - pure freeform
  
  zones: [
    {
      id: 'canvas',
      name: 'Canvas',
      x: 0,
      y: 0,
      width: 4000,
      height: 3000,
      acceptsTypes: ['generator', 'instrument', 'effect', 'midi', 'routing', 'modulation', 'utility', 'analysis'],
      maxCards: 999,
      stackId: null,
    },
  ],
  
  defaultConnections: [],
  
  showGrid: true,
  gridSize: 16,
  snapToGrid: true,
  showConnections: true,
  connectionStyle: 'curved',
  
  allowFreeform: true,
  autoArrange: false,
  lockPositions: false,
};

/**
 * All layout presets.
 */
export const LAYOUT_PRESETS: Record<string, DeckLayout> = {
  'renoise-vertical': RENOISE_LAYOUT,
  'ableton-session': ABLETON_LAYOUT,
  'cubase-arrange': CUBASE_LAYOUT,
  'dorico-score': DORICO_LAYOUT,
  'simplified-horizontal': SIMPLIFIED_LAYOUT,
  'modular-freeform': MODULAR_LAYOUT,
};

// ============================================================================
// LAYOUT SELECTION BY PERSONA
// ============================================================================

/**
 * Get recommended layout for user background.
 */
export function getLayoutForBackground(background: UserBackground): string {
  const mapping: Record<UserBackground, string> = {
    none: 'simplified-horizontal',
    renoise: 'renoise-vertical',
    ableton: 'ableton-session',
    cubase: 'cubase-arrange',
    dorico: 'dorico-score',
    'fl-studio': 'ableton-session',
    logic: 'cubase-arrange',
    bitwig: 'modular-freeform',
    reason: 'modular-freeform',
    hardware: 'modular-freeform',
    coding: 'modular-freeform',
  };
  
  return mapping[background] ?? 'simplified-horizontal';
}

/**
 * Get layout for user persona.
 */
export function getLayoutForPersona(persona: UserPersona): DeckLayout {
  const layoutId = persona.preferredLayout;
  return LAYOUT_PRESETS[layoutId] ?? SIMPLIFIED_LAYOUT;
}

// ============================================================================
// AUTO-ARRANGE ALGORITHM (from cardplayui.md Section 4.4)
// ============================================================================

/**
 * Auto-arrange cards within a stack.
 * Implementation of cardplayui.md Section 4.4 algorithm.
 */
export function autoArrangeStack(
  stack: StackConfig,
  cards: readonly CardPosition[],
  spacing: number = 8
): readonly CardPosition[] {
  const stackCards = cards.filter(c => c.stackId === stack.id);
  const sortedCards = [...stackCards].sort((a, b) => a.zIndex - b.zIndex);
  
  let offset = 0;
  const arranged: CardPosition[] = [];
  
  for (const card of sortedCards) {
    if (card.pinned) {
      // Keep pinned cards in place
      arranged.push(card);
      continue;
    }
    
    const newCard: CardPosition = stack.orientation === 'vertical'
      ? {
          ...card,
          x: stack.x,
          y: stack.y + offset,
        }
      : {
          ...card,
          x: stack.x + offset,
          y: stack.y,
        };
    
    arranged.push(newCard);
    
    offset += stack.orientation === 'vertical'
      ? card.height + spacing
      : card.width + spacing;
  }
  
  return arranged;
}

/**
 * Auto-arrange all cards in a deck layout.
 */
export function autoArrangeDeck(
  layout: DeckLayout,
  cards: readonly CardPosition[]
): readonly CardPosition[] {
  let result: CardPosition[] = [];
  
  // Arrange cards in stacks
  for (const stack of layout.stacks) {
    const arranged = autoArrangeStack(stack, cards);
    result.push(...arranged);
  }
  
  // Keep freeform cards (not in any stack) as-is
  const stackIds = new Set(layout.stacks.map(s => s.id));
  const freeformCards = cards.filter(
    c => c.stackId === null || !stackIds.has(c.stackId)
  );
  result.push(...freeformCards);
  
  return result;
}

// ============================================================================
// GRID SNAPPING
// ============================================================================

/**
 * Snap a position to grid.
 */
export function snapToGrid(
  x: number,
  y: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

/**
 * Snap card position to grid.
 */
export function snapCardToGrid(
  card: CardPosition,
  gridSize: number
): CardPosition {
  const snapped = snapToGrid(card.x, card.y, gridSize);
  return {
    ...card,
    x: snapped.x,
    y: snapped.y,
  };
}

// ============================================================================
// ZONE HIT TESTING
// ============================================================================

/**
 * Find zone at position.
 */
export function findZoneAtPosition(
  x: number,
  y: number,
  zones: readonly LayoutZone[]
): LayoutZone | null {
  for (const zone of zones) {
    if (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    ) {
      return zone;
    }
  }
  return null;
}

/**
 * Check if a card type can be dropped in a zone.
 */
export function canDropInZone(
  cardCategory: CardCategory,
  zone: LayoutZone
): boolean {
  return zone.acceptsTypes.includes(cardCategory);
}

/**
 * Find stack at position.
 */
export function findStackAtPosition(
  x: number,
  y: number,
  stacks: readonly StackConfig[]
): StackConfig | null {
  for (const stack of stacks) {
    if (
      x >= stack.x &&
      x <= stack.x + stack.width &&
      y >= stack.y &&
      y <= stack.y + stack.height
    ) {
      return stack;
    }
  }
  return null;
}

// ============================================================================
// LAYOUT STATE MANAGEMENT
// ============================================================================

/**
 * Deck layout state.
 */
export interface DeckLayoutState {
  readonly layout: DeckLayout;
  readonly cards: readonly CardPosition[];
  readonly collapsedStacks: ReadonlySet<string>;
  readonly selectedCardIds: ReadonlySet<string>;
  readonly focusedCardId: string | null;
  readonly dragState: DragLayoutState | null;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
}

/**
 * Drag state for layout operations.
 */
export interface DragLayoutState {
  readonly type: 'card' | 'stack' | 'resize' | 'pan';
  readonly cardId?: string;
  readonly stackId?: string;
  readonly startX: number;
  readonly startY: number;
  readonly currentX: number;
  readonly currentY: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Create initial deck layout state.
 */
export function createDeckLayoutState(layout: DeckLayout = SIMPLIFIED_LAYOUT): DeckLayoutState {
  return {
    layout,
    cards: [],
    collapsedStacks: new Set(),
    selectedCardIds: new Set(),
    focusedCardId: null,
    dragState: null,
    zoom: 1,
    panX: 0,
    panY: 0,
  };
}

/**
 * Toggle stack collapsed state.
 */
export function toggleStackCollapsed(
  state: DeckLayoutState,
  stackId: string
): DeckLayoutState {
  const newCollapsed = new Set(state.collapsedStacks);
  if (newCollapsed.has(stackId)) {
    newCollapsed.delete(stackId);
  } else {
    newCollapsed.add(stackId);
  }
  return {
    ...state,
    collapsedStacks: newCollapsed,
  };
}

/**
 * Add card to layout.
 */
export function addCardToLayout(
  state: DeckLayoutState,
  cardId: string,
  cardCategory: CardCategory,
  stackId: string | null = null,
  position?: { x: number; y: number }
): DeckLayoutState {
  // Find appropriate stack if not specified
  let targetStack = stackId;
  if (!targetStack) {
    const compatibleStack = state.layout.stacks.find(s => 
      s.acceptsTypes.includes(cardCategory)
    );
    targetStack = compatibleStack?.id ?? null;
  }
  
  // Calculate position
  let x = position?.x ?? 0;
  let y = position?.y ?? 0;
  
  if (targetStack) {
    const stack = state.layout.stacks.find(s => s.id === targetStack);
    if (stack) {
      const stackCards = state.cards.filter(c => c.stackId === targetStack);
      const lastCard = stackCards[stackCards.length - 1];
      
      if (stack.orientation === 'horizontal') {
        x = lastCard ? lastCard.x + lastCard.width + 8 : stack.x;
        y = stack.y;
      } else {
        x = stack.x;
        y = lastCard ? lastCard.y + lastCard.height + 8 : stack.y;
      }
    }
  }
  
  // Snap to grid if enabled
  if (state.layout.snapToGrid) {
    const snapped = snapToGrid(x, y, state.layout.gridSize);
    x = snapped.x;
    y = snapped.y;
  }
  
  const newCard: CardPosition = {
    cardId,
    stackId: targetStack,
    x,
    y,
    width: 200,
    height: 150,
    zIndex: state.cards.length,
    rotation: 0,
    scale: 1,
    pinned: false,
  };
  
  return {
    ...state,
    cards: [...state.cards, newCard],
  };
}

/**
 * Move card to new position.
 */
export function moveCard(
  state: DeckLayoutState,
  cardId: string,
  newX: number,
  newY: number
): DeckLayoutState {
  let x = newX;
  let y = newY;
  
  // Snap to grid if enabled
  if (state.layout.snapToGrid) {
    const snapped = snapToGrid(x, y, state.layout.gridSize);
    x = snapped.x;
    y = snapped.y;
  }
  
  // Find new stack at position
  const newStack = findStackAtPosition(x, y, state.layout.stacks);
  
  const cards = state.cards.map(card => {
    if (card.cardId !== cardId) return card;
    return {
      ...card,
      x,
      y,
      stackId: newStack?.id ?? null,
    };
  });
  
  return {
    ...state,
    cards,
  };
}

/**
 * Remove card from layout.
 */
export function removeCard(
  state: DeckLayoutState,
  cardId: string
): DeckLayoutState {
  return {
    ...state,
    cards: state.cards.filter(c => c.cardId !== cardId),
    selectedCardIds: new Set([...state.selectedCardIds].filter(id => id !== cardId)),
    focusedCardId: state.focusedCardId === cardId ? null : state.focusedCardId,
  };
}

/**
 * Select card.
 */
export function selectCard(
  state: DeckLayoutState,
  cardId: string,
  addToSelection: boolean = false
): DeckLayoutState {
  const newSelection = addToSelection
    ? new Set([...state.selectedCardIds, cardId])
    : new Set([cardId]);
  
  return {
    ...state,
    selectedCardIds: newSelection,
    focusedCardId: cardId,
  };
}

/**
 * Clear selection.
 */
export function clearSelection(state: DeckLayoutState): DeckLayoutState {
  return {
    ...state,
    selectedCardIds: new Set(),
    focusedCardId: null,
  };
}

// ============================================================================
// CSS FOR LAYOUT COMPONENTS
// ============================================================================

/**
 * CSS for deck layout components.
 */
export const LAYOUT_CSS = `
/* Deck Container */
.deck-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-background, #1a1a2e);
}

.deck-canvas {
  position: absolute;
  transform-origin: 0 0;
}

/* Grid */
.deck-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: 
    linear-gradient(to right, var(--color-grid, #2a2a3e) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-grid, #2a2a3e) 1px, transparent 1px);
}

/* Stack */
.stack {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: var(--color-surface, #2a2a3e);
  border: 1px solid var(--color-border, #3a3a4e);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}

.stack.horizontal {
  flex-direction: row;
}

.stack.collapsed .stack-content {
  display: none;
}

.stack-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--stack-color, #3a3a4e);
  cursor: pointer;
  user-select: none;
}

.stack-icon {
  font-size: 16px;
}

.stack-name {
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}

.stack-count {
  font-size: 12px;
  color: var(--color-text-secondary, #a0a0b0);
}

.stack-collapse-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.stack-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stack-content {
  flex: 1;
  display: flex;
  padding: 8px;
  gap: 8px;
  overflow: auto;
}

.stack.horizontal .stack-content {
  flex-direction: row;
}

.stack.vertical .stack-content {
  flex-direction: column;
}

/* Card */
.card {
  position: absolute;
  background: var(--color-surface-elevated, #3a3a4e);
  border: 1px solid var(--color-border, #4a4a5e);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.2));
  transition: box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;
}

.card:hover {
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.3));
}

.card.selected {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.card.focused {
  border-color: var(--color-primary, #3b82f6);
}

.card.dragging {
  opacity: 0.8;
  z-index: 1000 !important;
}

/* Zone */
.zone {
  position: absolute;
  border: 2px dashed var(--color-border, #3a3a4e);
  border-radius: var(--radius-md, 8px);
  transition: border-color 0.2s, background 0.2s;
}

.zone.drop-active {
  border-color: var(--color-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
}

.zone.drop-invalid {
  border-color: var(--color-error, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

/* Connection */
.connection {
  stroke: var(--color-connection, #22c55e);
  stroke-width: 2;
  fill: none;
  pointer-events: stroke;
  cursor: pointer;
}

.connection:hover {
  stroke-width: 3;
}

.connection.selected {
  stroke: var(--color-primary, #3b82f6);
  stroke-width: 3;
}

.connection.midi {
  stroke: var(--color-midi, #3b82f6);
}

.connection.modulation {
  stroke: var(--color-modulation, #f59e0b);
  stroke-dasharray: 4 2;
}

/* Minimap */
.minimap {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 200px;
  height: 150px;
  background: var(--color-surface, #2a2a3e);
  border: 1px solid var(--color-border, #3a3a4e);
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
  opacity: 0.8;
}

.minimap:hover {
  opacity: 1;
}

.minimap-viewport {
  position: absolute;
  border: 1px solid var(--color-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.2);
}

/* Zoom Controls */
.zoom-controls {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 4px;
  background: var(--color-surface, #2a2a3e);
  border: 1px solid var(--color-border, #3a3a4e);
  border-radius: var(--radius-md, 8px);
  padding: 4px;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm, 4px);
  background: transparent;
  border: none;
  color: var(--color-text, #ffffff);
  cursor: pointer;
  transition: background 0.2s;
}

.zoom-btn:hover {
  background: var(--color-surface-elevated, #3a3a4e);
}

.zoom-level {
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-secondary, #a0a0b0);
}
`.trim();

/**
 * Apply layout CSS to document.
 */
export function applyLayoutCSS(): void {
  const styleId = 'cardplay-layout';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = LAYOUT_CSS;
}
