/**
 * @fileoverview Phrase Browser UI Component
 * 
 * Provides searchable, filterable interface for browsing the phrase database.
 * Includes preview playback, tagging, rating, and quick-add functionality.
 * 
 * @module @cardplay/core/ui/components/phrase-browser
 */

import type {
  PhraseRecord,
  PhraseQueryAdvanced,
} from '../../cards/phrase-system';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Browser state
 */
export interface PhraseBrowserState {
  /** Current search query */
  readonly query: string;
  /** Active filters */
  readonly filters: PhraseQueryAdvanced;
  /** Search results */
  readonly results: readonly PhraseRecord<any>[];
  /** Currently selected phrase */
  readonly selected: PhraseRecord<any> | null;
  /** Currently previewing phrase */
  readonly previewing: PhraseRecord<any> | null;
  /** Sort options */
  readonly sortBy: PhraseSortOption;
  /** View mode */
  readonly viewMode: 'list' | 'grid' | 'detail';
  /** Page number for pagination */
  readonly page: number;
  /** Results per page */
  readonly pageSize: number;
}

/**
 * Sort options
 */
export type PhraseSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'rating-asc'
  | 'rating-desc'
  | 'date-asc'
  | 'date-desc'
  | 'usage-asc'
  | 'usage-desc'
  | 'duration-asc'
  | 'duration-desc';

/**
 * Browser action
 */
export type BrowserAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_FILTERS'; filters: Partial<PhraseQueryAdvanced> }
  | { type: 'SET_RESULTS'; results: readonly PhraseRecord<any>[] }
  | { type: 'SELECT_PHRASE'; phrase: PhraseRecord<any> | null }
  | { type: 'PREVIEW_PHRASE'; phrase: PhraseRecord<any> | null }
  | { type: 'SET_SORT'; sortBy: PhraseSortOption }
  | { type: 'SET_VIEW_MODE'; viewMode: 'list' | 'grid' | 'detail' }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'RESET_FILTERS' };

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial browser state
 */
export function createInitialBrowserState(): PhraseBrowserState {
  return {
    query: '',
    filters: {},
    results: [],
    selected: null,
    previewing: null,
    sortBy: 'date-desc',
    viewMode: 'list',
    page: 0,
    pageSize: 20,
  };
}

/**
 * Browser state reducer
 */
export function browserReducer(
  state: PhraseBrowserState,
  action: BrowserAction
): PhraseBrowserState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.query,
        page: 0, // Reset to first page
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.filters,
        },
        page: 0,
      };
    
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.results,
      };
    
    case 'SELECT_PHRASE':
      return {
        ...state,
        selected: action.phrase,
      };
    
    case 'PREVIEW_PHRASE':
      return {
        ...state,
        previewing: action.phrase,
      };
    
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.sortBy,
      };
    
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.viewMode,
      };
    
    case 'SET_PAGE':
      return {
        ...state,
        page: Math.max(0, action.page),
      };
    
    case 'RESET_FILTERS':
      return {
        ...state,
        query: '',
        filters: {},
        page: 0,
      };
    
    default:
      return state;
  }
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render search bar
 */
export function renderSearchBar(
  ctx: CanvasRenderingContext2D,
  state: PhraseBrowserState,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  
  // Background
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(x, y, width, height);
  
  // Search icon
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '18px sans-serif';
  ctx.fillText('🔍', x + 10, y + height / 2 + 6);
  
  // Query text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px sans-serif';
  ctx.textBaseline = 'middle';
  const queryText = state.query || 'Search phrases...';
  ctx.fillText(queryText, x + 40, y + height / 2);
  
  // Active filter count
  const filterCount = Object.keys(state.filters).length;
  if (filterCount > 0) {
    const badgeX = x + width - 60;
    const badgeY = y + height / 2 - 10;
    
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(badgeX + 10, badgeY + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${filterCount}`, badgeX + 10, badgeY + 10 + 1);
  }
  
  ctx.restore();
}

/**
 * Render filter panel
 */
export function renderFilterPanel(
  ctx: CanvasRenderingContext2D,
  state: PhraseBrowserState,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  
  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(x, y, width, height);
  
  let currentY = y + 15;
  const lineHeight = 25;
  const indent = x + 15;
  
  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Filters', indent, currentY);
  currentY += lineHeight + 5;
  
  // Line Type filter
  renderFilterSection(ctx, 'Line Type', state.filters.lineType, indent, currentY, width - 30);
  currentY += lineHeight * 2;
  
  // Mood filter
  renderFilterSection(ctx, 'Mood', state.filters.mood, indent, currentY, width - 30);
  currentY += lineHeight * 2;
  
  // Genre filter
  renderFilterSection(ctx, 'Genre', state.filters.genre, indent, currentY, width - 30);
  currentY += lineHeight * 2;
  
  // Duration range
  if (state.filters.minDuration || state.filters.maxDuration) {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText('Duration', indent, currentY);
    currentY += lineHeight;
    
    ctx.fillStyle = '#D1D5DB';
    const durText = `${state.filters.minDuration ?? 0}-${state.filters.maxDuration ?? '∞'} bars`;
    ctx.fillText(durText, indent + 10, currentY);
    currentY += lineHeight;
  }
  
  // Note count range
  if (state.filters.minNoteCount || state.filters.maxNoteCount) {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText('Note Count', indent, currentY);
    currentY += lineHeight;
    
    ctx.fillStyle = '#D1D5DB';
    const noteText = `${state.filters.minNoteCount ?? 0}-${state.filters.maxNoteCount ?? '∞'}`;
    ctx.fillText(noteText, indent + 10, currentY);
    currentY += lineHeight;
  }
  
  // Reset button
  if (Object.keys(state.filters).length > 0) {
    const buttonY = y + height - 40;
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(indent, buttonY, width - 30, 30);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reset Filters', x + width / 2, buttonY + 20);
  }
  
  ctx.restore();
}

function renderFilterSection(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: any,
  x: number,
  y: number,
  _width: number
): void {
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y);
  
  if (value) {
    ctx.fillStyle = '#3B82F6';
    const badge = Array.isArray(value) ? value.join(', ') : String(value);
    ctx.fillText(badge, x + 10, y + 18);
  }
}

/**
 * Render results list view
 */
export function renderResultsList(
  ctx: CanvasRenderingContext2D,
  state: PhraseBrowserState,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  
  // Background
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(x, y, width, height);
  
  const itemHeight = 60;
  const startIdx = state.page * state.pageSize;
  const endIdx = Math.min(startIdx + state.pageSize, state.results.length);
  const visibleResults = state.results.slice(startIdx, endIdx);
  
  let currentY = y + 10;
  
  for (const phrase of visibleResults) {
    const isSelected = state.selected?.id === phrase.id;
    const isPreviewing = state.previewing?.id === phrase.id;
    
    // Item background
    ctx.fillStyle = isSelected ? '#374151' : isPreviewing ? '#312E81' : '#1F2937';
    ctx.fillRect(x + 5, currentY, width - 10, itemHeight);
    
    // Selection/preview indicator
    if (isSelected || isPreviewing) {
      ctx.fillStyle = isSelected ? '#10B981' : '#6366F1';
      ctx.fillRect(x + 5, currentY, 4, itemHeight);
    }
    
    // Phrase name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(phrase.name, x + 20, currentY + 20);
    
    // Metadata
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px sans-serif';
    const meta = [
      phrase.metadata.lineType,
      `${phrase.metadata.noteCount} notes`,
      `${phrase.metadata.duration} bars`,
    ].join(' • ');
    ctx.fillText(meta, x + 20, currentY + 38);
    
    // Rating stars
    if (phrase.rating !== undefined && phrase.rating > 0) {
      renderStars(ctx, phrase.rating, x + width - 80, currentY + 20, 12);
    }
    
    // Usage count
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${phrase.usageCount ?? 0}×`, x + width - 15, currentY + 38);
    
    currentY += itemHeight + 5;
  }
  
  // Empty state
  if (visibleResults.length === 0) {
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No phrases found', x + width / 2, y + height / 2);
    ctx.fillText('Try adjusting your filters', x + width / 2, y + height / 2 + 25);
  }
  
  ctx.restore();
}

/**
 * Render results grid view
 */
export function renderResultsGrid(
  ctx: CanvasRenderingContext2D,
  state: PhraseBrowserState,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  
  // Background
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(x, y, width, height);
  
  const cardWidth = 180;
  const cardHeight = 120;
  const gap = 10;
  const cols = Math.floor((width - gap) / (cardWidth + gap));
  
  const startIdx = state.page * state.pageSize;
  const endIdx = Math.min(startIdx + state.pageSize, state.results.length);
  const visibleResults = state.results.slice(startIdx, endIdx);
  
  visibleResults.forEach((phrase, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cardX = x + gap + col * (cardWidth + gap);
    const cardY = y + gap + row * (cardHeight + gap);
    
    const isSelected = state.selected?.id === phrase.id;
    const isPreviewing = state.previewing?.id === phrase.id;
    
    // Card background
    ctx.fillStyle = isSelected ? '#374151' : isPreviewing ? '#312E81' : '#111827';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    
    // Border
    ctx.strokeStyle = isSelected ? '#10B981' : isPreviewing ? '#6366F1' : '#374151';
    ctx.lineWidth = isSelected || isPreviewing ? 2 : 1;
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
    
    // Phrase name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      truncateText(phrase.name, cardWidth - 20, ctx),
      cardX + 10,
      cardY + 20
    );
    
    // Waveform preview (simplified)
    renderMiniWaveform(ctx, phrase, cardX + 10, cardY + 35, cardWidth - 20, 40);
    
    // Tags
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px sans-serif';
    const tags = (phrase.tags ?? []).slice(0, 2).join(', ');
    ctx.fillText(
      truncateText(tags, cardWidth - 20, ctx),
      cardX + 10,
      cardY + cardHeight - 10
    );
  });
  
  ctx.restore();
}

/**
 * Render phrase detail view
 */
export function renderPhraseDetail(
  ctx: CanvasRenderingContext2D,
  phrase: PhraseRecord<any>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  
  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(x, y, width, height);
  
  let currentY = y + 20;
  const indent = x + 20;
  const lineHeight = 25;
  
  // Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(phrase.name, indent, currentY);
  currentY += lineHeight + 10;
  
  // Metadata grid
  const metadataItems = [
    ['Line Type', phrase.metadata.lineType],
    ['Duration', `${phrase.metadata.duration} bars`],
    ['Note Count', String(phrase.metadata.noteCount)],
    ['Range', `${phrase.metadata.range} semitones`],
    ['Density', phrase.metadata.density.toFixed(2)],
    ['Complexity', phrase.metadata.rhythmComplexity.toFixed(2)],
  ];
  
  metadataItems.forEach(([key, value]) => {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${key}:`, indent, currentY);
    
    ctx.fillStyle = '#D1D5DB';
    ctx.fillText(value ?? '', indent + 120, currentY);
    
    currentY += lineHeight;
  });
  
  currentY += 10;
  
  // Tags
  if (phrase.tags && phrase.tags.length > 0) {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText('Tags:', indent, currentY);
    currentY += lineHeight;
    
    phrase.tags.forEach((tag, idx) => {
      const tagX = indent + (idx % 3) * 100;
      const tagY = currentY + Math.floor(idx / 3) * 25;
      
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(tagX, tagY - 12, 90, 18);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(truncateText(tag, 85, ctx), tagX + 5, tagY);
    });
    
    currentY += Math.ceil(phrase.tags.length / 3) * 25 + 15;
  }
  
  // Rating
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '12px sans-serif';
  ctx.fillText('Rating:', indent, currentY);
  renderStars(ctx, phrase.rating ?? 0, indent + 60, currentY - 8, 16);
  currentY += lineHeight + 5;
  
  // Usage count
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText(`Used ${phrase.usageCount ?? 0} times`, indent, currentY);
  currentY += lineHeight;
  
  // Timestamps
  ctx.fillStyle = '#6B7280';
  ctx.font = '10px sans-serif';
  ctx.fillText(`Created: ${new Date(phrase.createdAt ?? Date.now()).toLocaleDateString()}`, indent, currentY);
  currentY += lineHeight - 5;
  ctx.fillText(`Updated: ${new Date(phrase.updatedAt ?? Date.now()).toLocaleDateString()}`, indent, currentY);
  
  ctx.restore();
}

/**
 * Render pagination controls
 */
export function renderPagination(
  ctx: CanvasRenderingContext2D,
  state: PhraseBrowserState,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const totalPages = Math.ceil(state.results.length / state.pageSize);
  if (totalPages <= 1) return;
  
  ctx.save();
  
  // Background
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(x, y, width, height);
  
  const buttonWidth = 60;
  const centerX = x + width / 2;
  
  // Previous button
  const canGoPrev = state.page > 0;
  ctx.fillStyle = canGoPrev ? '#3B82F6' : '#374151';
  ctx.fillRect(centerX - buttonWidth - 5, y + 5, buttonWidth, height - 10);
  
  ctx.fillStyle = canGoPrev ? '#FFFFFF' : '#6B7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('← Prev', centerX - buttonWidth / 2 - 5, y + height / 2 + 4);
  
  // Page indicator
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`${state.page + 1} / ${totalPages}`, centerX, y + height / 2 + 4);
  
  // Next button
  const canGoNext = state.page < totalPages - 1;
  ctx.fillStyle = canGoNext ? '#3B82F6' : '#374151';
  ctx.fillRect(centerX + 5, y + 5, buttonWidth, height - 10);
  
  ctx.fillStyle = canGoNext ? '#FFFFFF' : '#6B7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Next →', centerX + buttonWidth / 2 + 5, y + height / 2 + 4);
  
  ctx.restore();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function renderStars(
  ctx: CanvasRenderingContext2D,
  rating: number,
  x: number,
  y: number,
  size: number
): void {
  for (let i = 0; i < 5; i++) {
    const filled = i < rating;
    ctx.fillStyle = filled ? '#F59E0B' : '#374151';
    ctx.font = `${size}px sans-serif`;
    ctx.fillText('★', x + i * (size + 2), y);
  }
}

function renderMiniWaveform(
  ctx: CanvasRenderingContext2D,
  phrase: PhraseRecord<any>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Piano-roll style visualization using actual event data
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(x, y, width, height);
  
  if (!phrase.events || phrase.events.length === 0) {
    // No events - draw empty message
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No events', x + width / 2, y + height / 2);
    return;
  }
  
  // Extract time and pitch ranges from events
  let minTime = Infinity;
  let maxTime = -Infinity;
  let minPitch = Infinity;
  let maxPitch = -Infinity;
  
  const noteData: Array<{ start: number; duration: number; pitch: number; velocity: number }> = [];
  
  phrase.events.forEach(event => {
    const payload = event.payload as any;
    let pitch: number | undefined;
    let velocity = 0.7; // Default velocity
    
    // Extract pitch from various payload structures
    if (typeof payload === 'number') {
      pitch = payload;
    } else if (payload && typeof payload === 'object') {
      if (typeof payload.pitch === 'number') {
        pitch = payload.pitch;
      } else if (typeof payload.note === 'number') {
        pitch = payload.note;
      }
      
      if (typeof payload.velocity === 'number') {
        velocity = payload.velocity;
      } else if (typeof payload.vel === 'number') {
        velocity = payload.vel;
      }
    }
    
    if (pitch !== undefined) {
      const start = event.start as number;
      const duration = event.duration as number;
      const end = start + duration;
      
      minTime = Math.min(minTime, start);
      maxTime = Math.max(maxTime, end);
      minPitch = Math.min(minPitch, pitch);
      maxPitch = Math.max(maxPitch, pitch);
      
      noteData.push({ start, duration, pitch, velocity });
    }
  });
  
  if (noteData.length === 0) {
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No notes', x + width / 2, y + height / 2);
    return;
  }
  
  const timeRange = maxTime - minTime || 1;
  const pitchRange = maxPitch - minPitch || 1;
  
  // Draw notes as rectangles
  noteData.forEach(note => {
    const noteX = x + ((note.start - minTime) / timeRange) * width;
    const noteWidth = Math.max(2, (note.duration / timeRange) * width);
    const noteY = y + height - ((note.pitch - minPitch) / pitchRange) * height;
    const noteHeight = Math.max(2, height / Math.max(12, pitchRange + 1));
    
    // Color based on velocity
    const brightness = Math.floor(100 + note.velocity * 155);
    ctx.fillStyle = `rgb(59, 130, ${brightness})`;
    ctx.fillRect(noteX, noteY - noteHeight, noteWidth, noteHeight);
  });
  
  // Draw border
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}

function truncateText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated + '...';
}

// ============================================================================
// PHRASE VISUALIZATION PREVIEWS
// ============================================================================

/**
 * Render detailed phrase visualization with piano roll and rhythm
 */
export function renderPhraseVisualizationPreview(
  ctx: CanvasRenderingContext2D,
  phrase: PhraseRecord<any>,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    showPianoRoll?: boolean;
    showRhythm?: boolean;
    showContour?: boolean;
    showMetadata?: boolean;
  } = {}
): void {
  const {
    showPianoRoll = true,
    showRhythm = true,
    showContour = true,
  } = options;
  
  ctx.save();
  
  // Background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(x, y, width, height);
  
  let currentY = y + 10;
  const sectionHeight = (height - 20) / (showPianoRoll && showRhythm && showContour ? 3 : 2);
  
  // Piano roll visualization
  if (showPianoRoll) {
    renderPianoRollPreview(ctx, phrase, x + 10, currentY, width - 20, sectionHeight - 10);
    currentY += sectionHeight;
  }
  
  // Rhythm visualization
  if (showRhythm) {
    renderRhythmPreview(ctx, phrase, x + 10, currentY, width - 20, sectionHeight - 10);
    currentY += sectionHeight;
  }
  
  // Contour visualization
  if (showContour && phrase.phrase?.shape) {
    renderContourPreview(ctx, phrase.phrase.shape, x + 10, currentY, width - 20, sectionHeight - 10);
  }
  
  ctx.restore();
}

/**
 * Render piano roll preview
 */
export function renderPianoRollPreview(
  ctx: CanvasRenderingContext2D,
  phrase: PhraseRecord<any>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Draw title
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Piano Roll', x, y + 12);
  
  const rollY = y + 20;
  const rollHeight = height - 20;
  
  // Background
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(x, rollY, width, rollHeight);
  
  // Grid lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gridY = rollY + (i / 4) * rollHeight;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x + width, gridY);
    ctx.stroke();
  }
  
  // Draw notes (same as mini waveform but with more detail)
  renderNotesOnGrid(ctx, phrase, x, rollY, width, rollHeight);
}

/**
 * Render rhythm preview with beat markers
 */
export function renderRhythmPreview(
  ctx: CanvasRenderingContext2D,
  phrase: PhraseRecord<any>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Draw title
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Rhythm', x, y + 12);
  
  const rhythmY = y + 20;
  const rhythmHeight = height - 20;
  
  // Background
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(x, rhythmY, width, rhythmHeight);
  
  if (!phrase.events || phrase.events.length === 0) return;
  
  // Find time range
  let minTime = Infinity;
  let maxTime = -Infinity;
  phrase.events.forEach(event => {
    const start = event.start as number;
    const end = start + (event.duration as number);
    minTime = Math.min(minTime, start);
    maxTime = Math.max(maxTime, end);
  });
  
  const timeRange = maxTime - minTime || 1;
  
  // Draw beat markers (assuming 4/4 time)
  const ticksPerBeat = 480; // Standard MIDI ticks
  const beats = Math.ceil(timeRange / ticksPerBeat);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  
  for (let beat = 0; beat <= beats; beat++) {
    const beatTime = minTime + beat * ticksPerBeat;
    const beatX = x + ((beatTime - minTime) / timeRange) * width;
    ctx.beginPath();
    ctx.moveTo(beatX, rhythmY);
    ctx.lineTo(beatX, rhythmY + rhythmHeight);
    ctx.stroke();
  }
  
  // Draw note onsets as vertical bars
  phrase.events.forEach(event => {
    const start = event.start as number;
    const duration = event.duration as number;
    const noteX = x + ((start - minTime) / timeRange) * width;
    const noteWidth = Math.max(2, (duration / timeRange) * width);
    
    const payload = event.payload as any;
    let velocity = 0.7;
    if (payload && typeof payload === 'object') {
      if (typeof payload.velocity === 'number') velocity = payload.velocity;
      else if (typeof payload.vel === 'number') velocity = payload.vel;
    }
    
    const barHeight = velocity * rhythmHeight;
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(noteX, rhythmY + rhythmHeight - barHeight, noteWidth, barHeight);
  });
}

/**
 * Render contour/shape preview
 */
export function renderContourPreview(
  ctx: CanvasRenderingContext2D,
  contour: any,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Draw title
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Contour', x, y + 12);
  
  const contourY = y + 20;
  const contourHeight = height - 20;
  
  // Background
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(x, contourY, width, contourHeight);
  
  if (!contour || !contour.points || contour.points.length === 0) return;
  
  // Draw contour line
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  contour.points.forEach((point: any, idx: number) => {
    const px = x + point.position * width;
    const py = contourY + (1 - point.value) * contourHeight;
    
    if (idx === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  
  ctx.stroke();
  
  // Draw points
  ctx.fillStyle = '#10B981';
  contour.points.forEach((point: any) => {
    const px = x + point.position * width;
    const py = contourY + (1 - point.value) * contourHeight;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Helper: Render notes on a grid
 */
function renderNotesOnGrid(
  ctx: CanvasRenderingContext2D,
  phrase: PhraseRecord<any>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  if (!phrase.events || phrase.events.length === 0) return;
  
  let minTime = Infinity;
  let maxTime = -Infinity;
  let minPitch = Infinity;
  let maxPitch = -Infinity;
  
  const noteData: Array<{ start: number; duration: number; pitch: number; velocity: number }> = [];
  
  phrase.events.forEach(event => {
    const payload = event.payload as any;
    let pitch: number | undefined;
    let velocity = 0.7;
    
    if (typeof payload === 'number') {
      pitch = payload;
    } else if (payload && typeof payload === 'object') {
      if (typeof payload.pitch === 'number') pitch = payload.pitch;
      else if (typeof payload.note === 'number') pitch = payload.note;
      if (typeof payload.velocity === 'number') velocity = payload.velocity;
      else if (typeof payload.vel === 'number') velocity = payload.vel;
    }
    
    if (pitch !== undefined) {
      const start = event.start as number;
      const duration = event.duration as number;
      const end = start + duration;
      
      minTime = Math.min(minTime, start);
      maxTime = Math.max(maxTime, end);
      minPitch = Math.min(minPitch, pitch);
      maxPitch = Math.max(maxPitch, pitch);
      
      noteData.push({ start, duration, pitch, velocity });
    }
  });
  
  if (noteData.length === 0) return;
  
  const timeRange = maxTime - minTime || 1;
  const pitchRange = maxPitch - minPitch || 1;
  
  noteData.forEach(note => {
    const noteX = x + ((note.start - minTime) / timeRange) * width;
    const noteWidth = Math.max(2, (note.duration / timeRange) * width);
    const noteY = y + height - ((note.pitch - minPitch) / pitchRange) * height;
    const noteHeight = Math.max(2, height / Math.max(12, pitchRange + 1));
    
    // Color based on velocity
    const brightness = Math.floor(100 + note.velocity * 155);
    ctx.fillStyle = `rgb(59, 130, ${brightness})`;
    ctx.fillRect(noteX, noteY - noteHeight, noteWidth, noteHeight);
    
    // Note border for better visibility
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(noteX, noteY - noteHeight, noteWidth, noteHeight);
  });
}


