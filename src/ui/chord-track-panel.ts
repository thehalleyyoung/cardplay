/**
 * @fileoverview Chord Track Panel - RapidComposer-Style Chord Display
 * 
 * Displays the harmonic progression as a horizontal track of chord symbols,
 * aligned with the bar grid. Supports:
 * - Click-to-edit chord entry
 * - Drag to reposition/resize chord duration
 * - Chord analysis and suggestions
 * - Roman numeral display option
 * - Integration with ScoreNotationCard
 * 
 * @module @cardplay/ui/chord-track-panel
 */

import type { Tick } from '../types/primitives';
import type { ChordSymbolInput } from '../cards/score-notation';

// ============================================================================
// CHORD TYPES
// ============================================================================

/**
 * Chord quality types.
 */
export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'dominant7'
  | 'major7'
  | 'minor7'
  | 'halfDiminished7'
  | 'diminished7'
  | 'sus2'
  | 'sus4'
  | 'add9'
  | 'add11'
  | 'power';

/**
 * Extended chord display format.
 */
export interface ChordDisplay {
  /** Original chord input */
  readonly chord: ChordSymbolInput;
  /** Display symbol (formatted) */
  readonly displaySymbol: string;
  /** Roman numeral analysis */
  readonly romanNumeral?: string;
  /** Chord function (tonic, subdominant, dominant) */
  readonly function?: ChordFunction;
  /** Bar position (fractional) */
  readonly barPosition: number;
  /** Duration in bars (fractional) */
  readonly durationBars: number;
  /** X position in pixels (relative to visible area) */
  readonly x: number;
  /** Width in pixels */
  readonly width: number;
  /** Whether chord is selected */
  readonly selected: boolean;
  /** Whether chord is being edited */
  readonly editing: boolean;
  /** Whether chord is highlighted (current playback position) */
  readonly highlighted: boolean;
}

/**
 * Chord function in harmonic analysis.
 */
export type ChordFunction = 'tonic' | 'subdominant' | 'dominant' | 'secondary' | 'passing';

/**
 * Chord suggestion for next chord.
 */
export interface ChordSuggestion {
  readonly root: string;
  readonly type: string;
  readonly symbol: string;
  readonly probability: number;
  readonly function: ChordFunction;
  readonly voiceLeadingScore: number;
}

// ============================================================================
// CHORD TRACK STATE
// ============================================================================

/**
 * Chord track panel state.
 */
export interface ChordTrackState {
  /** Chords to display */
  readonly chords: readonly ChordSymbolInput[];
  /** Selected chord index */
  readonly selectedIndex: number | null;
  /** Chord being edited */
  readonly editingIndex: number | null;
  /** Edit input value */
  readonly editValue: string;
  /** Current key signature root */
  readonly keyRoot: string;
  /** Current key mode */
  readonly keyMode: 'major' | 'minor';
  /** Whether to show roman numerals */
  readonly showRomanNumerals: boolean;
  /** Whether to show chord suggestions */
  readonly showSuggestions: boolean;
  /** Current suggestions */
  readonly suggestions: readonly ChordSuggestion[];
  /** Drag state */
  readonly dragState: ChordDragState | null;
}

/**
 * Drag state for chord repositioning/resizing.
 */
export interface ChordDragState {
  readonly chordIndex: number;
  readonly dragType: 'move' | 'resize-start' | 'resize-end';
  readonly startX: number;
  readonly startTick: Tick;
  readonly currentX: number;
}

/**
 * Chord track configuration.
 */
export interface ChordTrackConfig {
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
  /** Minimum chord duration in ticks */
  readonly minChordDuration: number;
  /** Snap grid for chord positioning */
  readonly snapGrid: 'bar' | 'beat' | 'half-beat' | 'off';
  /** Height of chord track in pixels */
  readonly height: number;
  /** Chord block padding */
  readonly chordPadding: number;
  /** Font size for chord symbols */
  readonly fontSize: number;
  /** Font size for roman numerals */
  readonly romanNumeralFontSize: number;
  /** Colors */
  readonly colors: ChordTrackColors;
}

/**
 * Color configuration for chord track.
 */
export interface ChordTrackColors {
  readonly background: string;
  readonly chordBackground: string;
  readonly chordBorder: string;
  readonly chordText: string;
  readonly chordSelected: string;
  readonly chordHighlighted: string;
  readonly romanNumeral: string;
  readonly suggestionBackground: string;
  readonly gridLine: string;
}

// ============================================================================
// DEFAULTS
// ============================================================================

/**
 * Default chord track colors.
 */
export const DEFAULT_CHORD_TRACK_COLORS: ChordTrackColors = {
  background: '#1a1a2e',
  chordBackground: '#2d2d44',
  chordBorder: '#4a4a6a',
  chordText: '#ffffff',
  chordSelected: '#3b82f6',
  chordHighlighted: '#f59e0b',
  romanNumeral: '#9ca3af',
  suggestionBackground: '#374151',
  gridLine: '#374151',
};

/**
 * Default chord track configuration.
 */
export const DEFAULT_CHORD_TRACK_CONFIG: ChordTrackConfig = {
  ticksPerQuarter: 480,
  minChordDuration: 480, // Quarter note minimum
  snapGrid: 'beat',
  height: 64,
  chordPadding: 4,
  fontSize: 16,
  romanNumeralFontSize: 12,
  colors: DEFAULT_CHORD_TRACK_COLORS,
};

/**
 * Default chord track state.
 */
export const DEFAULT_CHORD_TRACK_STATE: ChordTrackState = {
  chords: [],
  selectedIndex: null,
  editingIndex: null,
  editValue: '',
  keyRoot: 'C',
  keyMode: 'major',
  showRomanNumerals: true,
  showSuggestions: false,
  suggestions: [],
  dragState: null,
};

// ============================================================================
// CHORD PARSING
// ============================================================================

/**
 * Parse a chord symbol string.
 */
export function parseChordSymbol(symbol: string): { root: string; type: string; bass?: string | undefined } | null {
  // Match: Root (A-G with optional #/b) + Type + optional /Bass
  const match = symbol.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/i);
  if (!match) return null;
  
  const result: { root: string; type: string; bass?: string | undefined } = {
    root: match[1]!.toUpperCase(),
    type: match[2] || 'major',
  };
  
  if (match[3]) {
    result.bass = match[3].toUpperCase();
  }
  
  return result;
}

/**
 * Format a chord for display.
 */
export function formatChordSymbol(root: string, type: string, bass?: string): string {
  let symbol = root;
  
  // Map type to display
  switch (type.toLowerCase()) {
    case 'major':
    case 'maj':
    case '':
      // No suffix for major
      break;
    case 'minor':
    case 'min':
    case 'm':
      symbol += 'm';
      break;
    case 'dominant7':
    case '7':
      symbol += '7';
      break;
    case 'major7':
    case 'maj7':
    case 'Δ7':
      symbol += 'Δ7';
      break;
    case 'minor7':
    case 'min7':
    case 'm7':
      symbol += 'm7';
      break;
    case 'diminished':
    case 'dim':
    case '°':
      symbol += '°';
      break;
    case 'augmented':
    case 'aug':
    case '+':
      symbol += '+';
      break;
    case 'halfdiminished7':
    case 'halfdim7':
    case 'ø7':
    case 'm7b5':
      symbol += 'ø7';
      break;
    case 'diminished7':
    case 'dim7':
    case '°7':
      symbol += '°7';
      break;
    case 'sus2':
      symbol += 'sus2';
      break;
    case 'sus4':
      symbol += 'sus4';
      break;
    case 'add9':
      symbol += 'add9';
      break;
    case 'add11':
      symbol += 'add11';
      break;
    case '9':
      symbol += '9';
      break;
    case 'maj9':
      symbol += 'Δ9';
      break;
    case 'm9':
    case 'min9':
      symbol += 'm9';
      break;
    case '11':
      symbol += '11';
      break;
    case '13':
      symbol += '13';
      break;
    default:
      symbol += type;
  }
  
  if (bass && bass !== root) {
    symbol += '/' + bass;
  }
  
  return symbol;
}

/**
 * Get roman numeral for chord in key.
 */
export function getRomanNumeral(
  chordRoot: string,
  chordType: string,
  keyRoot: string,
  keyMode: 'major' | 'minor'
): string {
  const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatNoteOrder = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  // Normalize roots
  let keyIndex = noteOrder.indexOf(keyRoot);
  if (keyIndex === -1) keyIndex = flatNoteOrder.indexOf(keyRoot);
  if (keyIndex === -1) return '?';
  
  let chordIndex = noteOrder.indexOf(chordRoot);
  if (chordIndex === -1) chordIndex = flatNoteOrder.indexOf(chordRoot);
  if (chordIndex === -1) return '?';
  
  // Calculate scale degree (semitones from key root)
  const semitones = (chordIndex - keyIndex + 12) % 12;
  
  // Map semitones to roman numerals
  const majorNumerals = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
  const minorNumerals = ['i', 'bII', 'ii', 'bIII', 'III', 'iv', '#iv', 'v', 'bVI', 'VI', 'bVII', 'VII'];
  
  let numeral = keyMode === 'major' ? majorNumerals[semitones]! : minorNumerals[semitones]!;
  
  // Adjust case based on chord quality
  const isMinor = chordType.toLowerCase().includes('m') && !chordType.toLowerCase().includes('maj');
  const isDiminished = chordType.includes('°') || chordType.toLowerCase().includes('dim');
  const isAugmented = chordType.includes('+') || chordType.toLowerCase().includes('aug');
  
  if (isMinor || isDiminished) {
    numeral = numeral.toLowerCase();
  } else if (!isMinor && !isDiminished) {
    numeral = numeral.toUpperCase();
  }
  
  // Add quality suffix
  if (isDiminished) {
    numeral += '°';
  } else if (isAugmented) {
    numeral += '+';
  }
  
  // Add 7 if seventh chord
  if (chordType.includes('7') || chordType.includes('Δ') || chordType.includes('ø')) {
    numeral += '7';
  }
  
  return numeral;
}

/**
 * Detect chord function in key.
 */
export function getChordFunction(
  chordRoot: string,
  keyRoot: string,
  keyMode: 'major' | 'minor'
): ChordFunction {
  const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatNoteOrder = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  let keyIndex = noteOrder.indexOf(keyRoot);
  if (keyIndex === -1) keyIndex = flatNoteOrder.indexOf(keyRoot);
  if (keyIndex === -1) return 'passing';
  
  let chordIndex = noteOrder.indexOf(chordRoot);
  if (chordIndex === -1) chordIndex = flatNoteOrder.indexOf(chordRoot);
  if (chordIndex === -1) return 'passing';
  
  const semitones = (chordIndex - keyIndex + 12) % 12;
  
  if (keyMode === 'major') {
    if (semitones === 0) return 'tonic';        // I
    if (semitones === 5) return 'subdominant';  // IV
    if (semitones === 7) return 'dominant';     // V
    if (semitones === 9) return 'tonic';        // vi (relative minor)
    if (semitones === 2) return 'subdominant';  // ii
    if (semitones === 4) return 'tonic';        // iii
    if (semitones === 11) return 'dominant';    // vii°
  } else {
    if (semitones === 0) return 'tonic';        // i
    if (semitones === 5) return 'subdominant';  // iv
    if (semitones === 7) return 'dominant';     // V or v
    if (semitones === 3) return 'tonic';        // III (relative major)
    if (semitones === 8) return 'subdominant';  // VI
    if (semitones === 10) return 'subdominant'; // VII
  }
  
  return 'secondary';
}

// ============================================================================
// STATE OPERATIONS
// ============================================================================

/**
 * Select a chord.
 */
export function selectChord(
  state: ChordTrackState,
  index: number | null
): ChordTrackState {
  return {
    ...state,
    selectedIndex: index,
    editingIndex: null,
    editValue: '',
  };
}

/**
 * Start editing a chord.
 */
export function startEditing(
  state: ChordTrackState,
  index: number
): ChordTrackState {
  const chord = state.chords[index];
  return {
    ...state,
    selectedIndex: index,
    editingIndex: index,
    editValue: chord?.symbol ?? '',
  };
}

/**
 * Update edit value.
 */
export function updateEditValue(
  state: ChordTrackState,
  value: string
): ChordTrackState {
  return {
    ...state,
    editValue: value,
  };
}

/**
 * Commit chord edit.
 */
export function commitEdit(state: ChordTrackState): ChordTrackState {
  if (state.editingIndex === null) return state;
  
  const parsed = parseChordSymbol(state.editValue);
  if (!parsed) {
    // Invalid chord, cancel edit
    return {
      ...state,
      editingIndex: null,
      editValue: '',
    };
  }
  
  const newChords = state.chords.map((chord, i) => {
    if (i !== state.editingIndex) return chord;
    
    const updated: ChordSymbolInput = {
      ...chord,
      root: parsed.root,
      type: parsed.type,
      symbol: formatChordSymbol(parsed.root, parsed.type, parsed.bass),
    };
    
    if (parsed.bass) {
      (updated as { bass?: string }).bass = parsed.bass;
    }
    
    return updated;
  });
  
  return {
    ...state,
    chords: newChords,
    editingIndex: null,
    editValue: '',
  };
}

/**
 * Cancel chord edit.
 */
export function cancelEdit(state: ChordTrackState): ChordTrackState {
  return {
    ...state,
    editingIndex: null,
    editValue: '',
  };
}

/**
 * Start dragging a chord.
 */
export function startDrag(
  state: ChordTrackState,
  chordIndex: number,
  dragType: 'move' | 'resize-start' | 'resize-end',
  x: number
): ChordTrackState {
  const chord = state.chords[chordIndex];
  if (!chord) return state;
  
  return {
    ...state,
    selectedIndex: chordIndex,
    dragState: {
      chordIndex,
      dragType,
      startX: x,
      startTick: chord.startTick,
      currentX: x,
    },
  };
}

/**
 * Update drag position.
 */
export function updateDrag(
  state: ChordTrackState,
  x: number
): ChordTrackState {
  if (!state.dragState) return state;
  
  return {
    ...state,
    dragState: {
      ...state.dragState,
      currentX: x,
    },
  };
}

/**
 * End drag and apply changes.
 */
export function endDrag(
  state: ChordTrackState,
  pixelsPerBar: number,
  ticksPerBar: number,
  snapGrid: 'bar' | 'beat' | 'half-beat' | 'off',
  beatsPerBar: number
): ChordTrackState {
  if (!state.dragState) return state;
  
  const { chordIndex, dragType, startX, startTick, currentX } = state.dragState;
  const chord = state.chords[chordIndex];
  if (!chord) return { ...state, dragState: null };
  
  // Calculate tick delta
  const pixelDelta = currentX - startX;
  const barDelta = pixelDelta / pixelsPerBar;
  let tickDelta = Math.round(barDelta * ticksPerBar);
  
  // Snap to grid
  if (snapGrid !== 'off') {
    const snapSize = getSnapSize(snapGrid, ticksPerBar, beatsPerBar);
    tickDelta = Math.round(tickDelta / snapSize) * snapSize;
  }
  
  // Apply change based on drag type
  let newChords = [...state.chords];
  
  if (dragType === 'move') {
    const newStartTick = Math.max(0, startTick + tickDelta) as Tick;
    newChords = newChords.map((c, i) =>
      i === chordIndex ? { ...c, startTick: newStartTick } : c
    );
    // Re-sort chords by start tick
    newChords.sort((a, b) => a.startTick - b.startTick);
  }
  
  return {
    ...state,
    chords: newChords,
    dragState: null,
  };
}

/**
 * Cancel drag.
 */
export function cancelDrag(state: ChordTrackState): ChordTrackState {
  return {
    ...state,
    dragState: null,
  };
}

/**
 * Get snap size in ticks.
 */
function getSnapSize(
  snapGrid: 'bar' | 'beat' | 'half-beat' | 'off',
  ticksPerBar: number,
  beatsPerBar: number
): number {
  switch (snapGrid) {
    case 'bar': return ticksPerBar;
    case 'beat': return ticksPerBar / beatsPerBar;
    case 'half-beat': return ticksPerBar / beatsPerBar / 2;
    case 'off': return 1;
  }
}

/**
 * Set key for analysis.
 */
export function setKey(
  state: ChordTrackState,
  root: string,
  mode: 'major' | 'minor'
): ChordTrackState {
  return {
    ...state,
    keyRoot: root,
    keyMode: mode,
  };
}

/**
 * Toggle roman numeral display.
 */
export function toggleRomanNumerals(state: ChordTrackState): ChordTrackState {
  return {
    ...state,
    showRomanNumerals: !state.showRomanNumerals,
  };
}

// ============================================================================
// CHORD SUGGESTIONS
// ============================================================================

/**
 * Common chord progressions for suggestions.
 */
const COMMON_PROGRESSIONS: Record<string, string[][]> = {
  major: [
    ['I', 'IV', 'V', 'I'],
    ['I', 'V', 'vi', 'IV'],
    ['I', 'vi', 'IV', 'V'],
    ['ii', 'V', 'I'],
    ['I', 'IV', 'vi', 'V'],
    ['vi', 'IV', 'I', 'V'],
    ['I', 'iii', 'vi', 'IV'],
  ],
  minor: [
    ['i', 'iv', 'V', 'i'],
    ['i', 'VI', 'III', 'VII'],
    ['i', 'iv', 'VII', 'III'],
    ['ii°', 'V', 'i'],
    ['i', 'VII', 'VI', 'V'],
    ['i', 'iv', 'v', 'i'],
  ],
};

/**
 * Generate chord suggestions based on current progression.
 */
export function generateSuggestions(
  chords: readonly ChordSymbolInput[],
  keyRoot: string,
  keyMode: 'major' | 'minor',
  _position: number = chords.length
): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];
  const progressions = COMMON_PROGRESSIONS[keyMode] ?? [];
  
  // Get recent chord roman numerals
  const recentNumerals = chords.slice(-3).map(c =>
    getRomanNumeral(c.root, c.type, keyRoot, keyMode)
  );
  
  // Find matching progressions and suggest next chord
  for (const progression of progressions) {
    for (let i = 0; i < progression.length - 1; i++) {
      const windowSize = Math.min(recentNumerals.length, i + 1);
      const window = progression.slice(i - windowSize + 1, i + 1);
      
      if (arraysEqual(recentNumerals.slice(-windowSize), window)) {
        const nextNumeral = progression[i + 1]!;
        const suggestion = romanNumeralToChord(nextNumeral, keyRoot, keyMode);
        if (suggestion && !suggestions.find(s => s.symbol === suggestion.symbol)) {
          suggestions.push({
            ...suggestion,
            probability: 1 - (i / progression.length) * 0.5,
            function: getChordFunction(suggestion.root, keyRoot, keyMode),
            voiceLeadingScore: 0.8,
          });
        }
      }
    }
  }
  
  // Add common functional suggestions if not enough
  if (suggestions.length < 4) {
    const functionalSuggestions = getFunctionalSuggestions(keyRoot, keyMode);
    for (const fs of functionalSuggestions) {
      if (!suggestions.find(s => s.symbol === fs.symbol)) {
        suggestions.push(fs);
        if (suggestions.length >= 6) break;
      }
    }
  }
  
  return suggestions.slice(0, 6);
}

/**
 * Get functional chord suggestions.
 */
function getFunctionalSuggestions(
  keyRoot: string,
  keyMode: 'major' | 'minor'
): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];
  const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  let keyIndex = noteOrder.indexOf(keyRoot);
  if (keyIndex === -1) return suggestions;
  
  if (keyMode === 'major') {
    // I, IV, V, vi
    suggestions.push(createSuggestion(keyRoot, 'major', keyRoot, keyMode, 0.9));
    suggestions.push(createSuggestion(noteOrder[(keyIndex + 5) % 12]!, 'major', keyRoot, keyMode, 0.85));
    suggestions.push(createSuggestion(noteOrder[(keyIndex + 7) % 12]!, 'major', keyRoot, keyMode, 0.85));
    suggestions.push(createSuggestion(noteOrder[(keyIndex + 9) % 12]!, 'minor', keyRoot, keyMode, 0.8));
  } else {
    // i, iv, V, VI
    suggestions.push(createSuggestion(keyRoot, 'minor', keyRoot, keyMode, 0.9));
    suggestions.push(createSuggestion(noteOrder[(keyIndex + 5) % 12]!, 'minor', keyRoot, keyMode, 0.85));
    suggestions.push(createSuggestion(noteOrder[(keyIndex + 7) % 12]!, 'major', keyRoot, keyMode, 0.85));
    suggestions.push(createSuggestion(noteOrder[(keyIndex + 8) % 12]!, 'major', keyRoot, keyMode, 0.8));
  }
  
  return suggestions;
}

/**
 * Create a chord suggestion.
 */
function createSuggestion(
  root: string,
  type: string,
  keyRoot: string,
  keyMode: 'major' | 'minor',
  probability: number
): ChordSuggestion {
  return {
    root,
    type,
    symbol: formatChordSymbol(root, type),
    probability,
    function: getChordFunction(root, keyRoot, keyMode),
    voiceLeadingScore: 0.7,
  };
}

/**
 * Convert roman numeral to chord.
 */
function romanNumeralToChord(
  numeral: string,
  keyRoot: string,
  _keyMode: 'major' | 'minor'
): { root: string; type: string; symbol: string } | null {
  const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  let keyIndex = noteOrder.indexOf(keyRoot);
  if (keyIndex === -1) return null;
  
  // Parse numeral
  let semitones = 0;
  let type = 'major';
  
  const cleanNumeral = numeral.replace(/[°+7]/g, '');
  const isMinor = cleanNumeral === cleanNumeral.toLowerCase();
  const isDiminished = numeral.includes('°');
  const hasSeventh = numeral.includes('7');
  
  // Map numeral to semitones
  switch (cleanNumeral.toUpperCase()) {
    case 'I': semitones = 0; break;
    case 'BII': semitones = 1; break;
    case 'II': semitones = 2; break;
    case 'BIII': semitones = 3; break;
    case 'III': semitones = 4; break;
    case 'IV': semitones = 5; break;
    case '#IV': semitones = 6; break;
    case 'V': semitones = 7; break;
    case 'BVI': semitones = 8; break;
    case 'VI': semitones = 9; break;
    case 'BVII': semitones = 10; break;
    case 'VII': semitones = 11; break;
    default: return null;
  }
  
  const root = noteOrder[(keyIndex + semitones) % 12]!;
  
  if (isDiminished) {
    type = hasSeventh ? 'dim7' : 'dim';
  } else if (isMinor) {
    type = hasSeventh ? 'm7' : 'minor';
  } else {
    type = hasSeventh ? '7' : 'major';
  }
  
  return {
    root,
    type,
    symbol: formatChordSymbol(root, type),
  };
}

/**
 * Check if two arrays are equal.
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v.toUpperCase() === b[i]?.toUpperCase());
}

// ============================================================================
// RENDER HELPERS
// ============================================================================

/**
 * Calculate chord display objects for rendering.
 */
export function calculateChordDisplays(
  chords: readonly ChordSymbolInput[],
  state: ChordTrackState,
  scrollBar: number,
  pixelsPerBar: number,
  ticksPerBar: number,
  currentBar: number,
  containerWidth: number
): ChordDisplay[] {
  const displays: ChordDisplay[] = [];
  
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i]!;
    const nextChord = chords[i + 1];
    
    // Calculate bar position
    const barPosition = chord.startTick / ticksPerBar;
    
    // Calculate duration (to next chord or end of visible area)
    const nextBarPosition = nextChord
      ? nextChord.startTick / ticksPerBar
      : Math.ceil(barPosition) + 4; // Default 4 bars if last chord
    const durationBars = nextBarPosition - barPosition;
    
    // Calculate pixel position
    const x = (barPosition - scrollBar) * pixelsPerBar;
    const width = durationBars * pixelsPerBar;
    
    // Skip if not visible
    if (x + width < 0 || x > containerWidth) continue;
    
    // Check states
    const selected = state.selectedIndex === i;
    const editing = state.editingIndex === i;
    const highlighted = currentBar >= barPosition && currentBar < barPosition + durationBars;
    
    // Get roman numeral if enabled
    const romanNumeral = state.showRomanNumerals
      ? getRomanNumeral(chord.root, chord.type, state.keyRoot, state.keyMode)
      : undefined;
    
    // Get chord function
    const chordFunction = getChordFunction(chord.root, state.keyRoot, state.keyMode);
    
    // Build display object, handling optional fields for exactOptionalPropertyTypes
    const display: ChordDisplay = {
      chord,
      displaySymbol: chord.symbol || formatChordSymbol(chord.root, chord.type, chord.bass),
      barPosition,
      durationBars,
      x,
      width,
      selected,
      editing,
      highlighted,
    };
    
    // Add optional fields only if defined
    if (romanNumeral !== undefined) {
      (display as { romanNumeral: string }).romanNumeral = romanNumeral;
    }
    if (chordFunction !== undefined) {
      (display as { function: ChordFunction }).function = chordFunction;
    }
    
    displays.push(display);
  }
  
  return displays;
}
