/**
 * @fileoverview Chord Visualizer Component
 * 
 * Beautiful visual representation of chords showing:
 * - Chord tones highlighted on a piano keyboard
 * - Circle of fifths with current key/chord highlighted
 * - Roman numeral analysis
 * - Scale degrees
 * 
 * Implements G011: harmony-display deck UI with rich visual feedback
 * 
 * @module @cardplay/ui/components/chord-visualizer
 */

/**
 * Note names for display
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Circle of fifths order
 */
const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

/**
 * Chord quality to intervals mapping (semitones from root)
 */
const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],                    // major
  'm': [0, 3, 7],                   // minor
  '7': [0, 4, 7, 10],              // dominant 7th
  'maj7': [0, 4, 7, 11],           // major 7th
  'm7': [0, 3, 7, 10],             // minor 7th
  'dim': [0, 3, 6],                // diminished
  'aug': [0, 4, 8],                // augmented
  '6': [0, 4, 7, 9],               // major 6th
  'm6': [0, 3, 7, 9],              // minor 6th
  '9': [0, 4, 7, 10, 14],          // dominant 9th
  'maj9': [0, 4, 7, 11, 14],       // major 9th
  'm9': [0, 3, 7, 10, 14],         // minor 9th
  'sus4': [0, 5, 7],               // suspended 4th
  'sus2': [0, 2, 7],               // suspended 2nd
};

/**
 * Options for chord visualizer
 */
export interface ChordVisualizerOptions {
  /** Current chord (e.g., "Cmaj7", "Am", "G7") */
  chord?: string;
  
  /** Current key (for scale context) */
  key?: string;
  
  /** Show piano keyboard */
  showKeyboard?: boolean;
  
  /** Show circle of fifths */
  showCircle?: boolean;
  
  /** Show roman numeral analysis */
  showRomanNumerals?: boolean;
  
  /** Callback when chord tone is clicked */
  onChordToneClick?: (note: string) => void;
}

/**
 * Parses a chord string into root and quality
 */
function parseChord(chord: string): { root: string; quality: string } {
  // Match patterns like "C", "Cm", "Cmaj7", "C#m7", etc.
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return { root: 'C', quality: '' };
  }
  return { root: match[1] || 'C', quality: match[2] || '' };
}

/**
 * Gets the MIDI note number for a note name
 */
function noteToMidi(note: string, octave: number = 4): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 60; // Default to middle C
  return octave * 12 + noteIndex + 12;
}

/**
 * Gets chord tones as MIDI note numbers
 */
function getChordTones(chord: string, octave: number = 4): number[] {
  const { root, quality } = parseChord(chord);
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS[''] || [0, 4, 7];
  const rootMidi = noteToMidi(root, octave);
  return intervals.map(interval => rootMidi + interval);
}

/**
 * Creates a beautiful chord visualizer component
 */
export function createChordVisualizer(options: ChordVisualizerOptions = {}): HTMLElement {
  const {
    chord = 'C',
    key = 'C',
    showKeyboard = true,
    showCircle = true,
    showRomanNumerals = true,
    onChordToneClick,
  } = options;

  const container = document.createElement('div');
  container.className = 'chord-visualizer';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--color-surface, #1a1a1a);
    border-radius: 8px;
    color: var(--color-text, #ffffff);
  `;

  // Chord name display
  const nameDisplay = document.createElement('div');
  nameDisplay.className = 'chord-name';
  nameDisplay.textContent = chord;
  nameDisplay.style.cssText = `
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
    color: var(--color-primary, #00a6ff);
    text-shadow: 0 0 10px rgba(0, 166, 255, 0.5);
  `;
  container.appendChild(nameDisplay);

  // Piano keyboard visualization
  if (showKeyboard) {
    const keyboard = createPianoKeyboard(chord, onChordToneClick);
    container.appendChild(keyboard);
  }

  // Circle of fifths visualization
  if (showCircle) {
    const circle = createCircleOfFifths(chord, key);
    container.appendChild(circle);
  }

  // Chord info panel
  const infoPanel = createChordInfoPanel(chord, key, showRomanNumerals);
  container.appendChild(infoPanel);

  return container;
}

/**
 * Creates a visual piano keyboard showing chord tones
 */
function createPianoKeyboard(chord: string, onChordToneClick?: (note: string) => void): HTMLElement {
  const keyboard = document.createElement('div');
  keyboard.className = 'piano-keyboard';
  keyboard.style.cssText = `
    display: flex;
    position: relative;
    height: 120px;
    justify-content: center;
    gap: 2px;
  `;

  const chordTones = new Set(getChordTones(chord, 4));
  
  // Create one octave of keys (C to B)
  for (let i = 0; i < 12; i++) {
    const midi = 60 + i; // Middle C and up
    const noteName = NOTE_NAMES[i];
    if (!noteName) continue; // Safety check
    const isBlackKey = noteName.includes('#');
    const isChordTone = chordTones.has(midi);

    const key = document.createElement('button');
    key.className = `piano-key ${isBlackKey ? 'black' : 'white'}${isChordTone ? ' active' : ''}`;
    key.setAttribute('data-note', noteName);
    key.style.cssText = `
      width: ${isBlackKey ? '30px' : '45px'};
      height: ${isBlackKey ? '70px' : '120px'};
      background: ${isChordTone 
        ? 'linear-gradient(to bottom, var(--color-primary, #00a6ff), var(--color-primary-dark, #0088cc))'
        : isBlackKey ? '#2a2a2a' : '#ffffff'};
      border: 2px solid ${isChordTone ? 'var(--color-primary, #00a6ff)' : '#000'};
      border-radius: 0 0 4px 4px;
      position: ${isBlackKey ? 'absolute' : 'relative'};
      left: ${isBlackKey ? `${(i - 0.5) * 47}px` : 'auto'};
      z-index: ${isBlackKey ? '2' : '1'};
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: ${isChordTone ? '0 0 15px rgba(0, 166, 255, 0.6)' : 'none'};
    `;

    key.addEventListener('mouseenter', () => {
      key.style.transform = 'scale(1.05)';
    });

    key.addEventListener('mouseleave', () => {
      key.style.transform = 'scale(1)';
    });

    if (onChordToneClick) {
      key.addEventListener('click', () => {
        onChordToneClick(noteName);
      });
    }

    keyboard.appendChild(key);
  }

  return keyboard;
}

/**
 * Creates a circle of fifths visualization
 */
function createCircleOfFifths(chord: string, key: string): HTMLElement {
  const { root } = parseChord(chord);
  const keyRoot = parseChord(key).root;

  const container = document.createElement('div');
  container.className = 'circle-of-fifths';
  container.style.cssText = `
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto;
  `;

  // Draw circle background
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '200');
  svg.setAttribute('height', '200');
  svg.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
  `;

  // Center circle
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', '100');
  centerCircle.setAttribute('cy', '100');
  centerCircle.setAttribute('r', '80');
  centerCircle.setAttribute('fill', 'none');
  centerCircle.setAttribute('stroke', 'var(--color-border, #444)');
  centerCircle.setAttribute('stroke-width', '2');
  svg.appendChild(centerCircle);

  container.appendChild(svg);

  // Add note positions around the circle
  CIRCLE_OF_FIFTHS.forEach((note, index) => {
    const angle = (index * 30 - 90) * Math.PI / 180; // Start at top, go clockwise
    const x = 100 + 70 * Math.cos(angle);
    const y = 100 + 70 * Math.sin(angle);

    const noteElement = document.createElement('div');
    noteElement.className = 'circle-note';
    noteElement.textContent = note;
    noteElement.style.cssText = `
      position: absolute;
      left: ${x - 15}px;
      top: ${y - 15}px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: ${note === root ? 'var(--color-primary, #00a6ff)' : note === keyRoot ? 'var(--color-secondary, #ff8c00)' : '#444'};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      box-shadow: ${note === root ? '0 0 10px rgba(0, 166, 255, 0.8)' : 'none'};
      transition: all 0.3s ease;
    `;

    container.appendChild(noteElement);
  });

  return container;
}

/**
 * Creates chord information panel
 */
function createChordInfoPanel(chord: string, key: string, showRomanNumerals: boolean): HTMLElement {
  const { root, quality } = parseChord(chord);
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS[''] || [0, 4, 7];

  const panel = document.createElement('div');
  panel.className = 'chord-info-panel';
  panel.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
  `;

  // Chord tones
  const tonesSection = document.createElement('div');
  tonesSection.innerHTML = `
    <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.5rem;">
      Chord Tones
    </div>
    <div style="font-size: 1.25rem; font-weight: 600;">
      ${intervals.map(i => {
        const midi = noteToMidi(root, 4) + i;
        return NOTE_NAMES[midi % 12];
      }).join(' - ')}
    </div>
  `;

  // Quality info
  const qualitySection = document.createElement('div');
  qualitySection.innerHTML = `
    <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.5rem;">
      Quality
    </div>
    <div style="font-size: 1.25rem; font-weight: 600;">
      ${quality || 'Major'}
    </div>
  `;

  panel.appendChild(tonesSection);
  panel.appendChild(qualitySection);

  // Add roman numeral if enabled
  if (showRomanNumerals) {
    const romanSection = document.createElement('div');
    romanSection.style.gridColumn = '1 / -1';
    romanSection.innerHTML = `
      <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.5rem;">
        Roman Numeral (in ${key})
      </div>
      <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent, #ff8c00);">
        ${getRomanNumeral(chord, key)}
      </div>
    `;
    panel.appendChild(romanSection);
  }

  return panel;
}

/**
 * Gets roman numeral for a chord in a given key
 */
function getRomanNumeral(chord: string, key: string): string {
  const { root, quality } = parseChord(chord);
  const { root: keyRoot } = parseChord(key);
  
  const rootIndex = NOTE_NAMES.indexOf(root);
  const keyIndex = NOTE_NAMES.indexOf(keyRoot);
  
  if (rootIndex === -1 || keyIndex === -1) return 'I';
  
  const degree = (rootIndex - keyIndex + 12) % 12;
  const romanNumerals = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
  let numeral = romanNumerals[degree] || 'I';
  
  // Lowercase for minor chords
  if (quality.includes('m') && !quality.includes('maj')) {
    numeral = numeral.toLowerCase();
  }
  
  // Add quality suffix
  if (quality.includes('7')) {
    numeral += '7';
  }
  if (quality.includes('dim')) {
    numeral = numeral.toLowerCase() + '°';
  }
  if (quality.includes('aug')) {
    numeral += '+';
  }
  
  return numeral;
}

/**
 * Inject CSS styles for chord visualizer
 */
function injectChordVisualizerStyles(): void {
  if (document.getElementById('chord-visualizer-styles')) return;

  const style = document.createElement('style');
  style.id = 'chord-visualizer-styles';
  style.textContent = `
    .chord-visualizer {
      user-select: none;
    }

    .piano-key:hover {
      filter: brightness(1.2);
    }

    .piano-key:active {
      transform: scale(0.95) !important;
    }

    .circle-note:hover {
      transform: scale(1.2);
      z-index: 10;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .chord-visualizer {
        background: var(--color-surface, #0a0a0a);
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .piano-key {
        border-width: 3px;
      }
      
      .chord-name {
        text-shadow: none;
        border: 2px solid currentColor;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .piano-key,
      .circle-note {
        transition: none;
      }
    }
  `;

  document.head.appendChild(style);
}

// Initialize styles when module loads
if (typeof document !== 'undefined') {
  injectChordVisualizerStyles();
}

/**
 * Updates an existing chord visualizer with new chord/key
 */
export function updateChordVisualizer(
  container: HTMLElement,
  options: ChordVisualizerOptions
): void {
  const newVisualizer = createChordVisualizer(options);
  container.innerHTML = '';
  container.appendChild(newVisualizer);
}
