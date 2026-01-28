/**
 * @fileoverview Notation annotations and markup.
 * 
 * Supports text annotations, performance notes, analytical markings,
 * and collaborative comments on musical scores.
 * 
 * @module @cardplay/core/notation/annotations
 */

// ============================================================================
// ANNOTATION TYPES
// ============================================================================

/**
 * Annotation attached to a specific location in the score.
 */
export interface Annotation {
  readonly id: string;
  readonly type: AnnotationType;
  readonly measureIndex: number;
  readonly tick: number; // Position within measure
  readonly text: string;
  readonly author?: string;
  readonly timestamp?: number;
  readonly color?: string;
  readonly resolved?: boolean; // For comment threads
}

/**
 * Types of annotations.
 */
export type AnnotationType = 
  | 'text' // General text annotation
  | 'rehearsal-mark' // Rehearsal letters/numbers (A, B, C, etc.)
  | 'tempo-marking' // Tempo indications
  | 'expression' // Expression markings (dolce, espressivo, etc.)
  | 'fingering' // Fingering numbers
  | 'bowing' // Bowing marks for strings
  | 'pedal' // Pedal markings
  | 'analysis' // Harmonic/formal analysis
  | 'comment' // Collaborative comment
  | 'performance-note' // Performance instructions
  | 'editorial'; // Editorial notes

/**
 * Rehearsal mark configuration.
 */
export interface RehearsalMark extends Annotation {
  readonly type: 'rehearsal-mark';
  readonly label: string; // A, B, C, or 1, 2, 3, or custom
  readonly style: 'letter' | 'number' | 'custom';
}

/**
 * Tempo marking.
 */
export interface TempoMarking extends Annotation {
  readonly type: 'tempo-marking';
  readonly bpm?: number;
  readonly indication?: string; // Allegro, Andante, etc.
  readonly noteValue?: string; // Quarter note, eighth note, etc.
}

/**
 * Expression marking.
 */
export interface ExpressionMarking extends Annotation {
  readonly type: 'expression';
  readonly placement: 'above' | 'below';
  readonly italic: boolean;
}

/**
 * Comment thread for collaboration.
 */
export interface CommentThread {
  readonly id: string;
  readonly annotation: Annotation;
  readonly replies: ReadonlyArray<Comment>;
  readonly resolved: boolean;
}

/**
 * Individual comment in thread.
 */
export interface Comment {
  readonly id: string;
  readonly text: string;
  readonly author: string;
  readonly timestamp: number;
}

// ============================================================================
// ANNOTATION MANAGEMENT
// ============================================================================

/**
 * Annotation layer containing all annotations for a score.
 */
export interface AnnotationLayer {
  readonly annotations: ReadonlyArray<Annotation>;
  readonly threads: ReadonlyArray<CommentThread>;
  readonly visible: boolean;
}

/**
 * Create empty annotation layer.
 */
export function createAnnotationLayer(): AnnotationLayer {
  return {
    annotations: [],
    threads: [],
    visible: true,
  };
}

/**
 * Add annotation to layer.
 */
export function addAnnotation(
  layer: AnnotationLayer,
  annotation: Annotation
): AnnotationLayer {
  return {
    ...layer,
    annotations: [...layer.annotations, annotation],
  };
}

/**
 * Remove annotation by ID.
 */
export function removeAnnotation(
  layer: AnnotationLayer,
  annotationId: string
): AnnotationLayer {
  return {
    ...layer,
    annotations: layer.annotations.filter((a) => a.id !== annotationId),
    threads: layer.threads.filter((t) => t.annotation.id !== annotationId),
  };
}

/**
 * Update annotation.
 */
export function updateAnnotation(
  layer: AnnotationLayer,
  annotationId: string,
  updates: Partial<Annotation>
): AnnotationLayer {
  return {
    ...layer,
    annotations: layer.annotations.map((a) =>
      a.id === annotationId ? { ...a, ...updates } : a
    ),
  };
}

/**
 * Get annotations for specific measure.
 */
export function getAnnotationsForMeasure(
  layer: AnnotationLayer,
  measureIndex: number
): ReadonlyArray<Annotation> {
  return layer.annotations.filter((a) => a.measureIndex === measureIndex);
}

/**
 * Get annotations in tick range.
 */
export function getAnnotationsInRange(
  layer: AnnotationLayer,
  startTick: number,
  endTick: number
): ReadonlyArray<Annotation> {
  return layer.annotations.filter(
    (a) => a.tick >= startTick && a.tick <= endTick
  );
}

// ============================================================================
// COMMENT THREADS
// ============================================================================

/**
 * Create new comment thread.
 */
export function createCommentThread(
  annotation: Annotation
): CommentThread {
  return {
    id: `thread-${Date.now()}`,
    annotation,
    replies: [],
    resolved: false,
  };
}

/**
 * Add reply to thread.
 */
export function addReply(
  thread: CommentThread,
  text: string,
  author: string
): CommentThread {
  const reply: Comment = {
    id: `comment-${Date.now()}`,
    text,
    author,
    timestamp: Date.now(),
  };
  
  return {
    ...thread,
    replies: [...thread.replies, reply],
  };
}

/**
 * Resolve comment thread.
 */
export function resolveThread(thread: CommentThread): CommentThread {
  return {
    ...thread,
    resolved: true,
  };
}

/**
 * Reopen comment thread.
 */
export function reopenThread(thread: CommentThread): CommentThread {
  return {
    ...thread,
    resolved: false,
  };
}

// ============================================================================
// REHEARSAL MARKS
// ============================================================================

/**
 * Generate rehearsal marks automatically.
 */
export function generateRehearsalMarks(
  measureCount: number,
  interval: number = 8,
  style: 'letter' | 'number' = 'letter'
): ReadonlyArray<RehearsalMark> {
  const marks: RehearsalMark[] = [];
  
  for (let i = 0; i < measureCount; i += interval) {
    const label = style === 'letter' 
      ? String.fromCharCode(65 + Math.floor(i / interval)) // A, B, C, ...
      : String(Math.floor(i / interval) + 1); // 1, 2, 3, ...
    
    marks.push({
      id: `rehearsal-${i}`,
      type: 'rehearsal-mark',
      measureIndex: i,
      tick: 0,
      text: label,
      label,
      style,
    });
  }
  
  return marks;
}

// ============================================================================
// PERFORMANCE NOTES
// ============================================================================

/**
 * Common performance note templates.
 */
export const PERFORMANCE_NOTE_TEMPLATES: Record<string, string> = {
  'repeat-from-sign': 'D.S. (Dal Segno)',
  'repeat-to-coda': 'To Coda',
  'fine': 'Fine',
  'da-capo': 'D.C. (Da Capo)',
  'da-capo-al-fine': 'D.C. al Fine',
  'da-capo-al-coda': 'D.C. al Coda',
  'dal-segno-al-fine': 'D.S. al Fine',
  'dal-segno-al-coda': 'D.S. al Coda',
  'tacet': 'Tacet',
  'solo': 'Solo',
  'tutti': 'Tutti',
  'div': 'div. (divisi)',
  'unis': 'unis. (unison)',
};

/**
 * Create performance note from template.
 */
export function createPerformanceNote(
  measureIndex: number,
  tick: number,
  template: keyof typeof PERFORMANCE_NOTE_TEMPLATES
): Annotation {
  const text = PERFORMANCE_NOTE_TEMPLATES[template];
  if (text === undefined) {
    throw new Error(`Unknown performance note template: ${template}`);
  }
  return {
    id: `perf-note-${Date.now()}`,
    type: 'performance-note',
    measureIndex,
    tick,
    text,
  };
}

// ============================================================================
// ANALYTICAL MARKINGS
// ============================================================================

/**
 * Analytical marking types.
 */
export type AnalysisType = 
  | 'roman-numeral'
  | 'figured-bass'
  | 'formal-section'
  | 'cadence'
  | 'sequence'
  | 'modulation'
  | 'phrase-mark';

/**
 * Analytical marking.
 */
export interface AnalyticalMarking extends Annotation {
  readonly type: 'analysis';
  readonly analysisType: AnalysisType;
  readonly endMeasure?: number;
  readonly endTick?: number;
}

/**
 * Create analytical marking.
 */
export function createAnalyticalMarking(
  measureIndex: number,
  tick: number,
  analysisType: AnalysisType,
  text: string,
  endMeasure?: number,
  endTick?: number
): AnalyticalMarking {
  return {
    id: `analysis-${Date.now()}`,
    type: 'analysis',
    analysisType,
    measureIndex,
    tick,
    text,
    ...(endMeasure !== undefined && { endMeasure }),
    ...(endTick !== undefined && { endTick }),
  };
}

/**
 * Common formal section labels.
 */
export const FORMAL_SECTIONS = [
  'Introduction',
  'Exposition',
  'Development',
  'Recapitulation',
  'Coda',
  'Verse',
  'Chorus',
  'Bridge',
  'Pre-Chorus',
  'Outro',
  'Interlude',
];

/**
 * Common cadence types.
 */
export const CADENCE_TYPES = [
  'Authentic (V-I)',
  'Half (I-V)',
  'Plagal (IV-I)',
  'Deceptive (V-vi)',
  'Phrygian',
];

// ============================================================================
// RENDERING UTILITIES
// ============================================================================

/**
 * Get annotation color by type.
 */
export function getAnnotationColor(type: AnnotationType): string {
  const colors: Record<AnnotationType, string> = {
    'text': '#000000',
    'rehearsal-mark': '#0066cc',
    'tempo-marking': '#006600',
    'expression': '#333333',
    'fingering': '#666666',
    'bowing': '#666666',
    'pedal': '#444444',
    'analysis': '#cc6600',
    'comment': '#ff6600',
    'performance-note': '#cc0000',
    'editorial': '#999999',
  };
  
  return colors[type];
}

/**
 * Format annotation text for display.
 */
export function formatAnnotationText(annotation: Annotation): string {
  switch (annotation.type) {
    case 'rehearsal-mark':
      return `[${annotation.text}]`;
    case 'tempo-marking':
      return annotation.text;
    case 'expression':
      return annotation.text; // Typically italicized in rendering
    case 'analysis':
      return annotation.text;
    default:
      return annotation.text;
  }
}

/**
 * Calculate annotation position relative to staff.
 */
export function calculateAnnotationPosition(
  annotation: Annotation,
  staffY: number,
  placement: 'above' | 'below' = 'above'
): { x: number; y: number } {
  const offset = placement === 'above' ? -30 : 50;
  
  return {
    x: annotation.tick * 2, // Convert tick to x position (approximate)
    y: staffY + offset,
  };
}

// ============================================================================
// ANNOTATION LAYER (VISUAL SEPARATION OF ANNOTATIONS)
// ============================================================================

/**
 * Annotation layer visibility and styling.
 */
export interface AnnotationLayerConfig {
  readonly visible: boolean;
  readonly opacity: number; // 0-1
  readonly editable: boolean;
  readonly highlightColor?: string;
}

/**
 * Multi-layer annotation system for organizing different types of markup.
 */
export interface AnnotationLayerSystem {
  readonly layers: Record<string, AnnotationLayerConfig>;
  readonly activeLayer: string;
  readonly annotationsByLayer: Record<string, ReadonlyArray<Annotation>>;
}

/**
 * Default annotation layers.
 */
export const DEFAULT_ANNOTATION_LAYERS = {
  'performance': {
    visible: true,
    opacity: 1.0,
    editable: true,
    highlightColor: '#0066cc',
  },
  'analysis': {
    visible: true,
    opacity: 0.7,
    editable: true,
    highlightColor: '#cc6600',
  },
  'comments': {
    visible: true,
    opacity: 0.9,
    editable: true,
    highlightColor: '#ff6600',
  },
  'editorial': {
    visible: false,
    opacity: 0.5,
    editable: false,
    highlightColor: '#999999',
  },
};

/**
 * Create annotation layer system.
 */
export function createAnnotationLayerSystem(): AnnotationLayerSystem {
  return {
    layers: DEFAULT_ANNOTATION_LAYERS,
    activeLayer: 'performance',
    annotationsByLayer: {},
  };
}

/**
 * Add annotation to specific layer.
 */
export function addAnnotationToLayer(
  system: AnnotationLayerSystem,
  layerName: string,
  annotation: Annotation
): AnnotationLayerSystem {
  const currentAnnotations = system.annotationsByLayer[layerName] || [];
  
  return {
    ...system,
    annotationsByLayer: {
      ...system.annotationsByLayer,
      [layerName]: [...currentAnnotations, annotation],
    },
  };
}

/**
 * Toggle layer visibility.
 */
export function toggleLayerVisibility(
  system: AnnotationLayerSystem,
  layerName: string
): AnnotationLayerSystem {
  const layer = system.layers[layerName];
  if (!layer) return system;
  
  return {
    ...system,
    layers: {
      ...system.layers,
      [layerName]: {
        ...layer,
        visible: !layer.visible,
      },
    },
  };
}

/**
 * Get visible annotations from all layers.
 */
export function getVisibleAnnotations(
  system: AnnotationLayerSystem
): ReadonlyArray<Annotation> {
  const annotations: Annotation[] = [];
  
  for (const [layerName, layer] of Object.entries(system.layers)) {
    if (layer.visible) {
      const layerAnnotations = system.annotationsByLayer[layerName] || [];
      annotations.push(...layerAnnotations);
    }
  }
  
  return annotations;
}

// ============================================================================
// MARKUP COMMENTS (COLLABORATIVE ANNOTATIONS)
// ============================================================================

/**
 * Markup comment with rich formatting.
 */
export interface MarkupComment extends Annotation {
  readonly type: 'comment';
  readonly mentions?: ReadonlyArray<string>; // @username mentions
  readonly attachments?: ReadonlyArray<CommentAttachment>;
  readonly reactions?: Record<string, number>; // emoji reactions with count
  readonly parentId?: string; // For threaded replies
}

/**
 * Attachment to comment (image, audio, etc.).
 */
export interface CommentAttachment {
  readonly type: 'image' | 'audio' | 'link';
  readonly url: string;
  readonly name: string;
  readonly size?: number;
}

/**
 * Create markup comment.
 */
export function createMarkupComment(
  measureIndex: number,
  tick: number,
  text: string,
  author: string,
  options?: {
    mentions?: string[];
    parentId?: string;
    attachments?: CommentAttachment[];
  }
): MarkupComment {
  return {
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    type: 'comment',
    measureIndex,
    tick,
    text,
    author,
    timestamp: Date.now(),
    ...(options?.mentions && { mentions: options.mentions }),
    ...(options?.parentId && { parentId: options.parentId }),
    ...(options?.attachments && { attachments: options.attachments }),
  };
}

/**
 * Add reaction to comment.
 */
export function addReactionToComment(
  comment: MarkupComment,
  emoji: string
): MarkupComment {
  const currentCount = comment.reactions?.[emoji] || 0;
  
  return {
    ...comment,
    reactions: {
      ...comment.reactions,
      [emoji]: currentCount + 1,
    },
  };
}

/**
 * Resolve comment (mark as addressed).
 */
export function resolveComment(comment: MarkupComment): MarkupComment {
  return {
    ...comment,
    resolved: true,
  };
}

/**
 * Get comment thread (parent + replies).
 */
export function getCommentThread(
  comments: ReadonlyArray<MarkupComment>,
  parentId: string
): ReadonlyArray<MarkupComment> {
  const parent = comments.find(c => c.id === parentId);
  if (!parent) return [];
  
  const replies = comments.filter(c => c.parentId === parentId);
  return [parent, ...replies];
}

/**
 * Get unresolved comments.
 */
export function getUnresolvedComments(
  comments: ReadonlyArray<MarkupComment>
): ReadonlyArray<MarkupComment> {
  return comments.filter(c => !c.resolved && !c.parentId);
}

/**
 * Get comments by author.
 */
export function getCommentsByAuthor(
  comments: ReadonlyArray<MarkupComment>,
  author: string
): ReadonlyArray<MarkupComment> {
  return comments.filter(c => c.author === author);
}

/**
 * Search comments by text.
 */
export function searchComments(
  comments: ReadonlyArray<MarkupComment>,
  query: string
): ReadonlyArray<MarkupComment> {
  const lowerQuery = query.toLowerCase();
  return comments.filter(c => 
    c.text.toLowerCase().includes(lowerQuery) ||
    c.author?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Export comments to JSON for collaboration.
 */
export function exportCommentsToJSON(
  comments: ReadonlyArray<MarkupComment>
): string {
  return JSON.stringify(comments, null, 2);
}

/**
 * Import comments from JSON.
 */
export function importCommentsFromJSON(
  json: string
): ReadonlyArray<MarkupComment> {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}
