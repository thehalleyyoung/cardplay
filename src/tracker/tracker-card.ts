/**
 * @fileoverview Tracker Card UI Component
 * 
 * A beautiful, DOM-based tracker UI component that integrates with
 * CardPlay's card system. Renders as a stylized card with:
 * - Renoise-inspired pattern grid
 * - Smooth scrolling and cursor animations
 * - CardPlay visual theming
 * - Responsive layout within card constraints
 * 
 * @module @cardplay/tracker/tracker-card
 */

import {
  Pattern,
  CursorPosition,
  TrackerSelection,
  DisplayConfig,
  SpecialNote,
} from './types';
import { EFFECT_META } from './effects';

// =============================================================================
// CSS STYLES
// =============================================================================

const TRACKER_STYLES = `
/* ============================================================================
   TRACKER CARD CONTAINER
   ============================================================================ */

.tracker-card {
  --tracker-bg: #0d0d14;
  --tracker-bg-alt: #12121c;
  --tracker-border: rgba(255, 255, 255, 0.06);
  --tracker-text: #e8eaed;
  --tracker-text-dim: #5a5a6e;
  --tracker-text-muted: #3a3a4a;
  --tracker-accent: #6366f1;
  --tracker-accent-glow: rgba(99, 102, 241, 0.3);
  --tracker-cursor: #ff6b6b;
  --tracker-cursor-glow: rgba(255, 107, 107, 0.4);
  --tracker-selection: rgba(99, 102, 241, 0.2);
  --tracker-highlight: rgba(255, 255, 255, 0.02);
  --tracker-header-bg: linear-gradient(180deg, #1a1a2e 0%, #14141f 100%);
  
  /* Note colors by octave */
  --tracker-octave-0: #a78bfa;
  --tracker-octave-1: #818cf8;
  --tracker-octave-2: #6366f1;
  --tracker-octave-3: #4f46e5;
  --tracker-octave-4: #22d3ee;
  --tracker-octave-5: #2dd4bf;
  --tracker-octave-6: #34d399;
  --tracker-octave-7: #4ade80;
  
  /* Effect colors */
  --tracker-fx-pitch: #60a5fa;
  --tracker-fx-volume: #4ade80;
  --tracker-fx-pan: #a78bfa;
  --tracker-fx-flow: #fbbf24;
  --tracker-fx-cardplay: #f472b6;
  
  /* Special note colors */
  --tracker-note-off: #ef4444;
  --tracker-note-cut: #f59e0b;
  --tracker-note-fade: #8b5cf6;
  
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--tracker-bg);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', monospace;
  font-size: 11px;
  color: var(--tracker-text);
  user-select: none;
}

/* ============================================================================
   CARD HEADER
   ============================================================================ */

.tracker-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--tracker-header-bg);
  border-bottom: 1px solid var(--tracker-border);
  min-height: 44px;
}

.tracker-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--tracker-accent) 0%, #8b5cf6 100%);
  border-radius: 6px;
  font-size: 14px;
  box-shadow: 0 2px 8px var(--tracker-accent-glow);
}

.tracker-card__title-group {
  flex: 1;
  min-width: 0;
}

.tracker-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--tracker-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tracker-card__subtitle {
  font-size: 10px;
  color: var(--tracker-text-dim);
  margin: 2px 0 0 0;
}

.tracker-card__controls {
  display: flex;
  gap: 6px;
}

.tracker-card__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--tracker-border);
  border-radius: 6px;
  color: var(--tracker-text-dim);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tracker-card__btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--tracker-text);
  border-color: rgba(255, 255, 255, 0.1);
}

.tracker-card__btn--active {
  background: var(--tracker-accent);
  color: white;
  border-color: var(--tracker-accent);
  box-shadow: 0 2px 8px var(--tracker-accent-glow);
}

.tracker-card__btn svg {
  width: 14px;
  height: 14px;
}

/* ============================================================================
   TOOLBAR
   ============================================================================ */

.tracker-card__toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  background: var(--tracker-bg-alt);
  border-bottom: 1px solid var(--tracker-border);
}

.tracker-card__toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tracker-card__toolbar-label {
  font-size: 10px;
  color: var(--tracker-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tracker-card__toolbar-value {
  font-size: 11px;
  color: var(--tracker-accent);
  font-weight: 500;
  min-width: 24px;
  text-align: center;
}

.tracker-card__toolbar-input {
  width: 48px;
  height: 24px;
  padding: 0 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--tracker-border);
  border-radius: 4px;
  color: var(--tracker-text);
  font-family: inherit;
  font-size: 11px;
  text-align: center;
}

.tracker-card__toolbar-input:focus {
  outline: none;
  border-color: var(--tracker-accent);
  box-shadow: 0 0 0 2px var(--tracker-accent-glow);
}

.tracker-card__toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--tracker-border);
}

/* ============================================================================
   PATTERN GRID CONTAINER
   ============================================================================ */

.tracker-card__grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.tracker-card__track-headers {
  display: flex;
  background: var(--tracker-bg-alt);
  border-bottom: 1px solid var(--tracker-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tracker-card__row-header {
  width: 36px;
  min-width: 36px;
  padding: 6px 4px;
  text-align: center;
  border-right: 1px solid var(--tracker-border);
  background: var(--tracker-bg-alt);
}

.tracker-card__track-header {
  flex: 1;
  min-width: 120px;
  padding: 6px 8px;
  border-right: 1px solid var(--tracker-border);
  display: flex;
  align-items: center;
  gap: 6px;
}

.tracker-card__track-header:last-child {
  border-right: none;
}

.tracker-card__track-color {
  width: 3px;
  height: 16px;
  border-radius: 2px;
}

.tracker-card__track-name {
  flex: 1;
  font-size: 10px;
  font-weight: 500;
  color: var(--tracker-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tracker-card__track-icons {
  display: flex;
  gap: 4px;
}

.tracker-card__track-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  font-size: 8px;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.1s ease;
}

.tracker-card__track-icon:hover {
  opacity: 1;
}

.tracker-card__track-icon--active {
  opacity: 1;
  background: var(--tracker-accent);
}

/* ============================================================================
   PATTERN GRID
   ============================================================================ */

.tracker-card__grid {
  flex: 1;
  overflow: auto;
  display: flex;
}

.tracker-card__row-numbers {
  width: 36px;
  min-width: 36px;
  background: var(--tracker-bg-alt);
  border-right: 1px solid var(--tracker-border);
  position: sticky;
  left: 0;
  z-index: 5;
}

.tracker-card__row-number {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--tracker-text-dim);
  border-bottom: 1px solid transparent;
}

.tracker-card__row-number--highlight {
  color: var(--tracker-text);
  background: var(--tracker-highlight);
}

.tracker-card__row-number--current {
  color: var(--tracker-cursor);
  font-weight: 600;
}

.tracker-card__tracks {
  flex: 1;
  display: flex;
}

.tracker-card__track {
  flex: 1;
  min-width: 120px;
  border-right: 1px solid var(--tracker-border);
}

.tracker-card__track:last-child {
  border-right: none;
}

/* ============================================================================
   CELLS
   ============================================================================ */

.tracker-card__row {
  display: flex;
  height: 20px;
  border-bottom: 1px solid transparent;
}

.tracker-card__row--highlight {
  background: var(--tracker-highlight);
}

.tracker-card__row--current {
  background: rgba(255, 107, 107, 0.08);
}

.tracker-card__cell {
  display: flex;
  align-items: center;
  padding: 0 2px;
  transition: background 0.1s ease;
}

.tracker-card__cell--cursor {
  background: var(--tracker-cursor);
  color: white;
  border-radius: 2px;
  box-shadow: 0 0 8px var(--tracker-cursor-glow);
}

.tracker-card__cell--selected {
  background: var(--tracker-selection);
}

/* Note cell */
.tracker-card__note {
  width: 28px;
  font-weight: 500;
}

.tracker-card__note--empty {
  color: var(--tracker-text-muted);
}

.tracker-card__note--off {
  color: var(--tracker-note-off);
}

.tracker-card__note--cut {
  color: var(--tracker-note-cut);
}

.tracker-card__note--fade {
  color: var(--tracker-note-fade);
}

/* Instrument cell */
.tracker-card__inst {
  width: 18px;
  color: var(--tracker-accent);
}

.tracker-card__inst--empty {
  color: var(--tracker-text-muted);
}

/* Volume cell */
.tracker-card__vol {
  width: 18px;
  color: var(--tracker-fx-volume);
}

.tracker-card__vol--empty {
  color: var(--tracker-text-muted);
}

/* Pan cell */
.tracker-card__pan {
  width: 18px;
  color: var(--tracker-fx-pan);
}

.tracker-card__pan--empty {
  color: var(--tracker-text-muted);
}

/* Delay cell */
.tracker-card__delay {
  width: 18px;
  color: var(--tracker-text-dim);
}

.tracker-card__delay--empty {
  color: var(--tracker-text-muted);
}

/* Effect cell */
.tracker-card__fx {
  width: 30px;
  font-size: 10px;
}

.tracker-card__fx--empty {
  color: var(--tracker-text-muted);
}

.tracker-card__fx--pitch {
  color: var(--tracker-fx-pitch);
}

.tracker-card__fx--volume {
  color: var(--tracker-fx-volume);
}

.tracker-card__fx--pan {
  color: var(--tracker-fx-pan);
}

.tracker-card__fx--flow {
  color: var(--tracker-fx-flow);
}

.tracker-card__fx--cardplay {
  color: var(--tracker-fx-cardplay);
  font-weight: 600;
}

/* Column separator */
.tracker-card__sep {
  width: 4px;
  color: var(--tracker-border);
}

/* ============================================================================
   FOOTER / STATUS BAR
   ============================================================================ */

.tracker-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: var(--tracker-bg-alt);
  border-top: 1px solid var(--tracker-border);
  font-size: 10px;
  color: var(--tracker-text-dim);
}

.tracker-card__status {
  display: flex;
  gap: 16px;
}

.tracker-card__status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tracker-card__status-label {
  color: var(--tracker-text-muted);
}

.tracker-card__status-value {
  color: var(--tracker-text);
}

.tracker-card__status-value--accent {
  color: var(--tracker-accent);
}

.tracker-card__hints {
  display: flex;
  gap: 12px;
}

.tracker-card__hint {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tracker-card__hint-key {
  padding: 2px 5px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  font-size: 9px;
  color: var(--tracker-text-dim);
}

/* ============================================================================
   SCROLLBAR STYLING
   ============================================================================ */

.tracker-card__grid::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.tracker-card__grid::-webkit-scrollbar-track {
  background: var(--tracker-bg);
}

.tracker-card__grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.tracker-card__grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.tracker-card__grid::-webkit-scrollbar-corner {
  background: var(--tracker-bg);
}

/* ============================================================================
   ANIMATIONS
   ============================================================================ */

@keyframes tracker-cursor-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.tracker-card__cell--cursor {
  animation: tracker-cursor-pulse 1s ease-in-out infinite;
}

@keyframes tracker-row-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tracker-card__row--entering {
  animation: tracker-row-enter 0.15s ease forwards;
}

/* ============================================================================
   RESPONSIVE / COMPACT MODE
   ============================================================================ */

.tracker-card--compact .tracker-card__header {
  padding: 6px 10px;
  min-height: 36px;
}

.tracker-card--compact .tracker-card__toolbar {
  padding: 4px 10px;
}

.tracker-card--compact .tracker-card__row {
  height: 18px;
}

.tracker-card--compact .tracker-card__footer {
  padding: 4px 10px;
}

/* ============================================================================
   THEME VARIANTS
   ============================================================================ */

.tracker-card--theme-light {
  --tracker-bg: #f8fafc;
  --tracker-bg-alt: #f1f5f9;
  --tracker-border: rgba(0, 0, 0, 0.08);
  --tracker-text: #1e293b;
  --tracker-text-dim: #64748b;
  --tracker-text-muted: #94a3b8;
  --tracker-highlight: rgba(0, 0, 0, 0.02);
}

.tracker-card--theme-high-contrast {
  --tracker-bg: #000000;
  --tracker-bg-alt: #0a0a0a;
  --tracker-text: #ffffff;
  --tracker-border: rgba(255, 255, 255, 0.15);
  --tracker-accent: #818cf8;
  --tracker-cursor: #ff8a8a;
}

/* ============================================================================
   REDUCED MOTION
   ============================================================================ */

@media (prefers-reduced-motion: reduce) {
  .tracker-card__cell--cursor {
    animation: none;
  }
  
  .tracker-card__row--entering {
    animation: none;
  }
  
  .tracker-card__btn,
  .tracker-card__cell {
    transition: none;
  }
}
`;

// =============================================================================
// STYLE INJECTION
// =============================================================================

let stylesInjected = false;

/**
 * Inject tracker styles into document
 */
function injectStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.id = 'tracker-card-styles';
  style.textContent = TRACKER_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

// =============================================================================
// ICONS
// =============================================================================

const ICONS = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  stop: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>`,
  record: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`,
  loop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
  solo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
};

// =============================================================================
// NOTE FORMATTING
// =============================================================================

const NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];

function formatNoteForDisplay(noteValue: number | SpecialNote): { text: string; className: string } {
  if (noteValue === SpecialNote.Empty) {
    return { text: '---', className: 'tracker-card__note--empty' };
  }
  if (noteValue === SpecialNote.NoteOff) {
    return { text: 'OFF', className: 'tracker-card__note--off' };
  }
  if (noteValue === SpecialNote.NoteCut) {
    return { text: '^^^', className: 'tracker-card__note--cut' };
  }
  if (noteValue === SpecialNote.NoteFade) {
    return { text: '===', className: 'tracker-card__note--fade' };
  }
  
  const octave = Math.floor(noteValue / 12) - 1;
  const semitone = noteValue % 12;
  return { 
    text: `${NOTE_NAMES[semitone]}${octave}`,
    className: `tracker-card__note--octave-${octave % 8}`,
  };
}

function formatHexValue(value: number | null, placeholder: string = '..'): string {
  if (value === null) return placeholder;
  return value.toString(16).toUpperCase().padStart(2, '0');
}

function getEffectClassName(fxCommand: number | null): string {
  if (fxCommand === null || fxCommand === 0) {
    return 'tracker-card__fx--empty';
  }
  
  const meta = EFFECT_META.get(fxCommand);
  if (!meta) return '';
  
  switch (meta.category) {
    case 'pitch': return 'tracker-card__fx--pitch';
    case 'volume': return 'tracker-card__fx--volume';
    default: return '';
  }
}

// =============================================================================
// VIEW DATA STRUCTURE (Simplified for rendering)
// =============================================================================

/** Simplified track info for rendering */
export interface TrackerViewTrack {
  id: string;
  name: string;
  color: string;
  muted?: boolean;
  soloed?: boolean;
}

/** Simplified cell data for rendering */
export interface TrackerViewCell {
  note: number | SpecialNote;
  instrument: number | null;
  volume: number | null;
  pan: number | null;
  delay: number | null;
  effects: Array<{ code: number; param: number } | null>;
}

/** View data for the tracker */
export interface TrackerViewData {
  name: string;
  length: number;
  tracks: TrackerViewTrack[];
  /** 2D array: rows[rowIndex][trackIndex] */
  rows: TrackerViewCell[][];
}

/** Create empty view data */
function createEmptyViewData(numRows: number = 64, numTracks: number = 4): TrackerViewData {
  const defaultTracks: TrackerViewTrack[] = [
    { id: '1', name: 'Lead', color: '#6366f1' },
    { id: '2', name: 'Bass', color: '#22c55e' },
    { id: '3', name: 'Drums', color: '#f59e0b' },
    { id: '4', name: 'FX', color: '#ec4899' },
  ].slice(0, numTracks);
  
  const rows: TrackerViewCell[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: TrackerViewCell[] = [];
    for (let t = 0; t < numTracks; t++) {
      row.push({
        note: SpecialNote.Empty,
        instrument: null,
        volume: null,
        pan: null,
        delay: null,
        effects: [null],
      });
    }
    rows.push(row);
  }
  
  return {
    name: 'New Pattern',
    length: numRows,
    tracks: defaultTracks,
    rows,
  };
}

/** Convert Pattern to view-friendly structure */
function patternToViewData(pattern: Pattern): TrackerViewData {
  const trackIds = Array.from(pattern.tracks.keys());
  const tracks: TrackerViewTrack[] = [];
  const numRows = pattern.config.length;
  
  // Build track info
  for (const trackId of trackIds) {
    const trackData = pattern.tracks.get(trackId);
    if (trackData) {
      tracks.push({
        id: trackId,
        name: trackData.config.name,
        color: trackData.config.color ?? '#6366f1',
        muted: trackData.config.muted,
        soloed: trackData.config.soloed,
      });
    }
  }
  
  // Build row data
  const rows: TrackerViewCell[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: TrackerViewCell[] = [];
    for (const trackId of trackIds) {
      const trackData = pattern.tracks.get(trackId);
      const trackerRow = trackData?.rows[r];
      
      if (trackerRow) {
        row.push({
          note: trackerRow.note.note,
          instrument: trackerRow.note.instrument ?? null,
          volume: trackerRow.note.volume ?? null,
          pan: trackerRow.note.pan ?? null,
          delay: trackerRow.note.delay ?? null,
          effects: trackerRow.effects.map(e =>
            e.effects.length > 0
              ? { code: e.effects[0]!.code, param: e.effects[0]!.param }
              : null
          ),
        });
      } else {
        row.push({
          note: SpecialNote.Empty,
          instrument: null,
          volume: null,
          pan: null,
          delay: null,
          effects: [null],
        });
      }
    }
    rows.push(row);
  }
  
  return {
    name: pattern.config.name,
    length: numRows,
    tracks,
    rows,
  };
}

// =============================================================================
// TRACKER CARD COMPONENT
// =============================================================================

export interface TrackerCardOptions {
  /** Card title */
  title?: string;
  /** Pattern to display (will be converted to view data) */
  pattern?: Pattern;
  /** Or provide pre-converted view data directly */
  viewData?: TrackerViewData;
  /** Display configuration */
  displayConfig?: DisplayConfig;
  /** Current cursor position */
  cursor?: CursorPosition;
  /** Selection state */
  selection?: TrackerSelection;
  /** Visible row range */
  visibleRows?: { start: number; end: number };
  /** Playback state */
  isPlaying?: boolean;
  /** Recording state */
  isRecording?: boolean;
  /** Loop enabled */
  isLooping?: boolean;
  /** Theme variant */
  theme?: 'dark' | 'light' | 'high-contrast';
  /** Compact mode */
  compact?: boolean;
  /** Event callbacks */
  onCellClick?: (row: number, track: number, column: number) => void;
  onCellDoubleClick?: (row: number, track: number, column: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
  onLoopToggle?: () => void;
}

/**
 * Tracker Card UI Component
 */
export class TrackerCard {
  private container: HTMLElement;
  private options: TrackerCardOptions;
  private mounted: boolean = false;
  
  constructor(options: TrackerCardOptions = {}) {
    injectStyles();
    this.options = options;
    this.container = this.createCard();
  }
  
  /**
   * Get the root DOM element
   */
  getElement(): HTMLElement {
    return this.container;
  }
  
  /**
   * Mount to a parent element
   */
  mount(parent: HTMLElement): void {
    if (this.mounted) return;
    parent.appendChild(this.container);
    this.mounted = true;
  }
  
  /**
   * Unmount from DOM
   */
  unmount(): void {
    if (!this.mounted) return;
    this.container.remove();
    this.mounted = false;
  }
  
  /**
   * Update with new options
   */
  update(options: Partial<TrackerCardOptions>): void {
    this.options = { ...this.options, ...options };
    this.render();
  }
  
  /**
   * Create the card DOM structure
   */
  private createCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'tracker-card';
    
    if (this.options.theme === 'light') {
      card.classList.add('tracker-card--theme-light');
    } else if (this.options.theme === 'high-contrast') {
      card.classList.add('tracker-card--theme-high-contrast');
    }
    
    if (this.options.compact) {
      card.classList.add('tracker-card--compact');
    }
    
    card.appendChild(this.createHeader());
    card.appendChild(this.createToolbar());
    card.appendChild(this.createGridContainer());
    card.appendChild(this.createFooter());
    
    return card;
  }
  
  /**
   * Create header section
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'tracker-card__header';
    
    // Icon
    const icon = document.createElement('div');
    icon.className = 'tracker-card__icon';
    icon.textContent = '🎹';
    header.appendChild(icon);
    
    // Title group
    const titleGroup = document.createElement('div');
    titleGroup.className = 'tracker-card__title-group';
    
    const title = document.createElement('h3');
    title.className = 'tracker-card__title';
    title.textContent = this.options.title ?? 'Pattern Editor';
    titleGroup.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'tracker-card__subtitle';
    subtitle.textContent = this.options.pattern?.config.name ?? 'New Pattern';
    titleGroup.appendChild(subtitle);
    
    header.appendChild(titleGroup);
    
    // Controls
    const controls = document.createElement('div');
    controls.className = 'tracker-card__controls';
    
    // Play button
    const playBtn = this.createButton('play', this.options.isPlaying ? ICONS.pause : ICONS.play, () => {
      if (this.options.isPlaying) {
        this.options.onPause?.();
      } else {
        this.options.onPlay?.();
      }
    }, this.options.isPlaying);
    controls.appendChild(playBtn);
    
    // Stop button
    const stopBtn = this.createButton('stop', ICONS.stop, () => this.options.onStop?.());
    controls.appendChild(stopBtn);
    
    // Record button
    const recordBtn = this.createButton('record', ICONS.record, () => this.options.onRecord?.(), this.options.isRecording);
    if (this.options.isRecording) {
      recordBtn.style.color = '#ef4444';
    }
    controls.appendChild(recordBtn);
    
    // Loop button
    const loopBtn = this.createButton('loop', ICONS.loop, () => this.options.onLoopToggle?.(), this.options.isLooping);
    controls.appendChild(loopBtn);
    
    header.appendChild(controls);
    
    return header;
  }
  
  /**
   * Create a control button
   */
  private createButton(id: string, icon: string, onClick: () => void, active: boolean = false): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'tracker-card__btn';
    btn.dataset.btnId = id;
    if (active) {
      btn.classList.add('tracker-card__btn--active');
    }
    btn.innerHTML = icon;
    btn.addEventListener('click', onClick);
    return btn;
  }
  
  /**
   * Create toolbar section
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'tracker-card__toolbar';
    
    // Octave
    toolbar.appendChild(this.createToolbarGroup('OCT', '4'));
    
    // Divider
    toolbar.appendChild(this.createDivider());
    
    // Step
    toolbar.appendChild(this.createToolbarGroup('STEP', '1'));
    
    // Divider
    toolbar.appendChild(this.createDivider());
    
    // Length
    const viewData = this.getViewData();
    toolbar.appendChild(this.createToolbarGroup('LEN', viewData.length.toString()));
    
    // Divider
    toolbar.appendChild(this.createDivider());
    
    // BPM
    toolbar.appendChild(this.createToolbarGroup('BPM', '120'));
    
    // Divider
    toolbar.appendChild(this.createDivider());
    
    // LPB
    toolbar.appendChild(this.createToolbarGroup('LPB', '4'));
    
    return toolbar;
  }
  
  /**
   * Create toolbar group
   */
  private createToolbarGroup(label: string, value: string): HTMLElement {
    const group = document.createElement('div');
    group.className = 'tracker-card__toolbar-group';
    
    const labelEl = document.createElement('span');
    labelEl.className = 'tracker-card__toolbar-label';
    labelEl.textContent = label;
    group.appendChild(labelEl);
    
    const valueEl = document.createElement('span');
    valueEl.className = 'tracker-card__toolbar-value';
    valueEl.textContent = value;
    group.appendChild(valueEl);
    
    return group;
  }
  
  /**
   * Create divider
   */
  private createDivider(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'tracker-card__toolbar-divider';
    return div;
  }
  
  /**
   * Create grid container
   */
  private createGridContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tracker-card__grid-container';
    
    // Track headers
    container.appendChild(this.createTrackHeaders());
    
    // Main grid
    container.appendChild(this.createGrid());
    
    return container;
  }
  
  /**
   * Create track headers
   */
  private createTrackHeaders(): HTMLElement {
    const headers = document.createElement('div');
    headers.className = 'tracker-card__track-headers';
    
    // Row number header
    const rowHeader = document.createElement('div');
    rowHeader.className = 'tracker-card__row-header';
    rowHeader.textContent = '#';
    headers.appendChild(rowHeader);
    
    // Get view data
    const viewData = this.getViewData();
    
    for (const track of viewData.tracks) {
      const trackHeader = document.createElement('div');
      trackHeader.className = 'tracker-card__track-header';
      
      const colorIndicator = document.createElement('div');
      colorIndicator.className = 'tracker-card__track-color';
      colorIndicator.style.background = track.color;
      trackHeader.appendChild(colorIndicator);
      
      const name = document.createElement('span');
      name.className = 'tracker-card__track-name';
      name.textContent = track.name;
      trackHeader.appendChild(name);
      
      const icons = document.createElement('div');
      icons.className = 'tracker-card__track-icons';
      
      const muteIcon = document.createElement('div');
      muteIcon.className = 'tracker-card__track-icon';
      muteIcon.textContent = 'M';
      muteIcon.title = 'Mute';
      if (track.muted) muteIcon.classList.add('tracker-card__track-icon--active');
      icons.appendChild(muteIcon);
      
      const soloIcon = document.createElement('div');
      soloIcon.className = 'tracker-card__track-icon';
      soloIcon.textContent = 'S';
      soloIcon.title = 'Solo';
      if (track.soloed) soloIcon.classList.add('tracker-card__track-icon--active');
      icons.appendChild(soloIcon);
      
      trackHeader.appendChild(icons);
      headers.appendChild(trackHeader);
    }
    
    return headers;
  }
  
  /**
   * Get view data from pattern or use provided/default
   */
  private getViewData(): TrackerViewData {
    if (this.options.viewData) {
      return this.options.viewData;
    }
    if (this.options.pattern) {
      return patternToViewData(this.options.pattern);
    }
    return createEmptyViewData();
  }
  
  /**
   * Create main grid
   */
  private createGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'tracker-card__grid';
    
    // Row numbers column
    const rowNumbers = document.createElement('div');
    rowNumbers.className = 'tracker-card__row-numbers';
    grid.appendChild(rowNumbers);
    
    // Tracks container
    const tracks = document.createElement('div');
    tracks.className = 'tracker-card__tracks';
    grid.appendChild(tracks);
    
    // Render rows
    this.renderRows(rowNumbers, tracks);
    
    return grid;
  }
  
  /**
   * Render pattern rows
   */
  private renderRows(rowNumbersContainer: HTMLElement, tracksContainer: HTMLElement): void {
    const viewData = this.getViewData();
    const numRows = viewData.length;
    const numTracks = viewData.tracks.length;
    const highlightInterval = this.options.displayConfig?.highlightInterval ?? 4;
    const cursorRow = this.options.cursor?.row ?? -1;
    const cursorTrack = this.options.cursor?.trackId ?? -1;
    const cursorColumn = this.options.cursor?.column ?? -1;
    
    // Create track columns
    const trackColumns: HTMLElement[] = [];
    for (let t = 0; t < numTracks; t++) {
      const trackCol = document.createElement('div');
      trackCol.className = 'tracker-card__track';
      tracksContainer.appendChild(trackCol);
      trackColumns.push(trackCol);
    }
    
    // Render each row
    const startRow = this.options.visibleRows?.start ?? 0;
    const endRow = this.options.visibleRows?.end ?? Math.min(numRows, 32);
    
    for (let r = startRow; r < endRow; r++) {
      const isHighlight = r % highlightInterval === 0;
      const isCurrent = r === cursorRow;
      
      // Row number
      const rowNum = document.createElement('div');
      rowNum.className = 'tracker-card__row-number';
      if (isHighlight) rowNum.classList.add('tracker-card__row-number--highlight');
      if (isCurrent) rowNum.classList.add('tracker-card__row-number--current');
      rowNum.textContent = r.toString(16).toUpperCase().padStart(2, '0');
      rowNumbersContainer.appendChild(rowNum);
      
      // Row cells for each track
      for (let t = 0; t < numTracks; t++) {
        const row = document.createElement('div');
        row.className = 'tracker-card__row';
        if (isHighlight) row.classList.add('tracker-card__row--highlight');
        if (isCurrent) row.classList.add('tracker-card__row--current');
        
        const cellData = viewData.rows[r]?.[t];
        
        // Note
        const noteCell = document.createElement('span');
        noteCell.className = 'tracker-card__cell tracker-card__note';
        const noteInfo = formatNoteForDisplay(cellData?.note ?? SpecialNote.Empty);
        noteCell.textContent = noteInfo.text;
        noteCell.classList.add(noteInfo.className);
        if (isCurrent && t === cursorTrack && cursorColumn === 0) {
          noteCell.classList.add('tracker-card__cell--cursor');
        }
        noteCell.addEventListener('click', () => this.options.onCellClick?.(r, t, 0));
        row.appendChild(noteCell);
        
        // Instrument
        const instCell = document.createElement('span');
        instCell.className = 'tracker-card__cell tracker-card__inst';
        const inst = cellData?.instrument;
        instCell.textContent = formatHexValue(inst ?? null);
        if (inst === null || inst === undefined) instCell.classList.add('tracker-card__inst--empty');
        if (isCurrent && t === cursorTrack && cursorColumn === 1) {
          instCell.classList.add('tracker-card__cell--cursor');
        }
        instCell.addEventListener('click', () => this.options.onCellClick?.(r, t, 1));
        row.appendChild(instCell);
        
        // Volume
        const volCell = document.createElement('span');
        volCell.className = 'tracker-card__cell tracker-card__vol';
        const vol = cellData?.volume;
        volCell.textContent = formatHexValue(vol ?? null);
        if (vol === null || vol === undefined) volCell.classList.add('tracker-card__vol--empty');
        if (isCurrent && t === cursorTrack && cursorColumn === 2) {
          volCell.classList.add('tracker-card__cell--cursor');
        }
        volCell.addEventListener('click', () => this.options.onCellClick?.(r, t, 2));
        row.appendChild(volCell);
        
        // Pan
        const panCell = document.createElement('span');
        panCell.className = 'tracker-card__cell tracker-card__pan';
        const pan = cellData?.pan;
        panCell.textContent = formatHexValue(pan ?? null);
        if (pan === null || pan === undefined) panCell.classList.add('tracker-card__pan--empty');
        if (isCurrent && t === cursorTrack && cursorColumn === 3) {
          panCell.classList.add('tracker-card__cell--cursor');
        }
        panCell.addEventListener('click', () => this.options.onCellClick?.(r, t, 3));
        row.appendChild(panCell);
        
        // Delay
        const delayCell = document.createElement('span');
        delayCell.className = 'tracker-card__cell tracker-card__delay';
        const delay = cellData?.delay;
        delayCell.textContent = formatHexValue(delay ?? null);
        if (delay === null || delay === undefined) delayCell.classList.add('tracker-card__delay--empty');
        if (isCurrent && t === cursorTrack && cursorColumn === 4) {
          delayCell.classList.add('tracker-card__cell--cursor');
        }
        delayCell.addEventListener('click', () => this.options.onCellClick?.(r, t, 4));
        row.appendChild(delayCell);
        
        // Effect
        const fxCell = document.createElement('span');
        fxCell.className = 'tracker-card__cell tracker-card__fx';
        const fx = cellData?.effects?.[0];
        if (fx && (fx.code !== 0 || fx.param !== 0)) {
          const cmdChar = fx.code.toString(16).toUpperCase().padStart(2, '0').slice(-1);
          fxCell.textContent = `${cmdChar}${formatHexValue(fx.param)}`;
          fxCell.classList.add(getEffectClassName(fx.code));
        } else {
          fxCell.textContent = '...';
          fxCell.classList.add('tracker-card__fx--empty');
        }
        if (isCurrent && t === cursorTrack && cursorColumn === 5) {
          fxCell.classList.add('tracker-card__cell--cursor');
        }
        fxCell.addEventListener('click', () => this.options.onCellClick?.(r, t, 5));
        row.appendChild(fxCell);

        trackColumns[t]!.appendChild(row);
      }
    }
  }
  
  /**
   * Create footer section
   */
  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'tracker-card__footer';
    
    // Status section
    const status = document.createElement('div');
    status.className = 'tracker-card__status';
    
    // Row position
    const rowStatus = document.createElement('div');
    rowStatus.className = 'tracker-card__status-item';
    const rowLabel = document.createElement('span');
    rowLabel.className = 'tracker-card__status-label';
    rowLabel.textContent = 'Row';
    rowStatus.appendChild(rowLabel);
    const rowValue = document.createElement('span');
    rowValue.className = 'tracker-card__status-value tracker-card__status-value--accent';
    rowValue.textContent = (this.options.cursor?.row ?? 0).toString(16).toUpperCase().padStart(2, '0');
    rowStatus.appendChild(rowValue);
    status.appendChild(rowStatus);
    
    // Track position
    const trackStatus = document.createElement('div');
    trackStatus.className = 'tracker-card__status-item';
    const trackLabel = document.createElement('span');
    trackLabel.className = 'tracker-card__status-label';
    trackLabel.textContent = 'Track';
    trackStatus.appendChild(trackLabel);
    const trackValue = document.createElement('span');
    trackValue.className = 'tracker-card__status-value';
    trackValue.textContent = this.options.cursor?.trackId ?? '0';
    trackStatus.appendChild(trackValue);
    status.appendChild(trackStatus);
    
    // Edit mode
    const modeStatus = document.createElement('div');
    modeStatus.className = 'tracker-card__status-item';
    const modeLabel = document.createElement('span');
    modeLabel.className = 'tracker-card__status-label';
    modeLabel.textContent = 'Mode';
    modeStatus.appendChild(modeLabel);
    const modeValue = document.createElement('span');
    modeValue.className = 'tracker-card__status-value';
    modeValue.textContent = this.options.isRecording ? 'REC' : 'EDIT';
    if (this.options.isRecording) {
      modeValue.style.color = '#ef4444';
    }
    modeStatus.appendChild(modeValue);
    status.appendChild(modeStatus);
    
    footer.appendChild(status);
    
    // Hints section
    const hints = document.createElement('div');
    hints.className = 'tracker-card__hints';
    
    hints.appendChild(this.createHint('Space', 'Play'));
    hints.appendChild(this.createHint('Tab', 'Next Track'));
    hints.appendChild(this.createHint('↑↓', 'Navigate'));
    
    footer.appendChild(hints);
    
    return footer;
  }
  
  /**
   * Create a keyboard hint
   */
  private createHint(key: string, action: string): HTMLElement {
    const hint = document.createElement('div');
    hint.className = 'tracker-card__hint';
    
    const keyEl = document.createElement('span');
    keyEl.className = 'tracker-card__hint-key';
    keyEl.textContent = key;
    hint.appendChild(keyEl);
    
    const actionEl = document.createElement('span');
    actionEl.textContent = action;
    hint.appendChild(actionEl);
    
    return hint;
  }
  
  /**
   * Re-render the card
   */
  render(): void {
    const parent = this.container.parentElement;
    const newCard = this.createCard();
    
    if (parent) {
      parent.replaceChild(newCard, this.container);
    }
    
    this.container = newCard;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a tracker card instance
 */
export function createTrackerCard(options?: TrackerCardOptions): TrackerCard {
  return new TrackerCard(options);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { TRACKER_STYLES, ICONS };
