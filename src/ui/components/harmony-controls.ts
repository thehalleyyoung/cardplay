/**
 * @fileoverview Harmony Controls Component
 * 
 * Interactive controls for setting key and chord in harmony-assisted boards.
 * Implements G014-G015: "Set Chord" and "Set Key" actions.
 * 
 * @module @cardplay/ui/components/harmony-controls
 */

import { getBoardContextStore } from '../../boards/context/store';

/**
 * Common musical keys
 */
const KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

/**
 * Common chord types
 */
const CHORD_QUALITIES = [
  '', 'm', '7', 'maj7', 'm7', 'dim', 'aug', 
  '6', 'm6', '9', 'maj9', 'm9', 'sus4', 'sus2'
];

/**
 * Options for creating harmony controls
 */
export interface HarmonyControlsOptions {
  /** Initial key */
  initialKey?: string | null;
  
  /** Initial chord */
  initialChord?: string | null;
  
  /** Callback when key changes */
  onKeyChange?: (key: string) => void;
  
  /** Callback when chord changes */
  onChordChange?: (chord: string) => void;
}

/**
 * Creates an interactive harmony controls component.
 * 
 * Provides:
 * - Key selector dropdown
 * - Chord builder (root + quality)
 * - Current harmony display
 * - Integration with BoardContextStore
 * 
 * @param options Configuration options
 * @returns HTML element containing harmony controls
 */
export function createHarmonyControls(options: HarmonyControlsOptions = {}): HTMLElement {
  const store = getBoardContextStore();
  const context = store.getContext();
  
  // Use initial values from options or context
  let currentKey = options.initialKey ?? context.currentKey ?? 'C';
  let currentChord = options.initialChord ?? context.currentChord ?? 'C';
  
  // Main container
  const container = document.createElement('div');
  container.className = 'harmony-controls';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
  `;
  
  // Key section
  const keySection = document.createElement('div');
  keySection.className = 'harmony-key-section';
  
  const keyLabel = document.createElement('label');
  keyLabel.textContent = 'Key';
  keyLabel.style.cssText = `
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-on-surface);
    margin-bottom: 0.25rem;
  `;
  
  const keySelect = document.createElement('select');
  keySelect.className = 'harmony-key-select';
  keySelect.style.cssText = `
    width: 100%;
    padding: 0.5rem;
    font-size: 0.875rem;
    border: 1px solid var(--color-outline);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-on-surface);
    cursor: pointer;
  `;
  
  // Populate key options
  KEYS.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    if (key === currentKey) option.selected = true;
    keySelect.appendChild(option);
  });
  
  keySelect.addEventListener('change', () => {
    currentKey = keySelect.value;
    store.setCurrentKey(currentKey);
    updateDisplay();
    options.onKeyChange?.(currentKey);
  });
  
  keySection.appendChild(keyLabel);
  keySection.appendChild(keySelect);
  
  // Chord section
  const chordSection = document.createElement('div');
  chordSection.className = 'harmony-chord-section';
  
  const chordLabel = document.createElement('label');
  chordLabel.textContent = 'Current Chord';
  chordLabel.style.cssText = keyLabel.style.cssText;
  
  const chordBuilder = document.createElement('div');
  chordBuilder.style.cssText = `
    display: flex;
    gap: 0.5rem;
  `;
  
  // Chord root selector
  const chordRootSelect = document.createElement('select');
  chordRootSelect.style.cssText = `
    flex: 1;
    padding: 0.5rem;
    font-size: 0.875rem;
    border: 1px solid var(--color-outline);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-on-surface);
    cursor: pointer;
  `;
  
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].forEach(root => {
    const option = document.createElement('option');
    option.value = root;
    option.textContent = root;
    chordRootSelect.appendChild(option);
  });
  
  // Chord quality selector
  const chordQualitySelect = document.createElement('select');
  chordQualitySelect.style.cssText = chordRootSelect.style.cssText;
  
  CHORD_QUALITIES.forEach(quality => {
    const option = document.createElement('option');
    option.value = quality;
    option.textContent = quality || 'major';
    chordQualitySelect.appendChild(option);
  });
  
  // Parse current chord to set initial values
  const parseChord = (chord: string): { root: string; quality: string } => {
    const match = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!match || !match[1]) return { root: 'C', quality: '' };
    return { root: match[1], quality: match[2] || '' };
  };
  
  const { root: initialRoot, quality: initialQuality } = parseChord(currentChord);
  chordRootSelect.value = initialRoot;
  chordQualitySelect.value = initialQuality;
  
  const updateChord = () => {
    const root = chordRootSelect.value;
    const quality = chordQualitySelect.value;
    currentChord = root + quality;
    store.setCurrentChord(currentChord);
    updateDisplay();
    options.onChordChange?.(currentChord);
  };
  
  chordRootSelect.addEventListener('change', updateChord);
  chordQualitySelect.addEventListener('change', updateChord);
  
  chordBuilder.appendChild(chordRootSelect);
  chordBuilder.appendChild(chordQualitySelect);
  
  chordSection.appendChild(chordLabel);
  chordSection.appendChild(chordBuilder);
  
  // Current harmony display
  const displaySection = document.createElement('div');
  displaySection.className = 'harmony-display';
  displaySection.style.cssText = `
    padding: 1rem;
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
    border-radius: var(--radius-md);
    text-align: center;
  `;
  
  const displayText = document.createElement('div');
  displayText.style.cssText = `
    font-size: 1.25rem;
    font-weight: 600;
  `;
  
  const updateDisplay = () => {
    displayText.textContent = `${currentChord} in ${currentKey}`;
  };
  
  updateDisplay();
  displaySection.appendChild(displayText);
  
  // Assemble
  container.appendChild(keySection);
  container.appendChild(chordSection);
  container.appendChild(displaySection);
  
  return container;
}

/**
 * Injects CSS styles for harmony controls.
 */
export function injectHarmonyControlsStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'harmony-controls-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .harmony-controls select:hover {
      border-color: var(--color-primary);
    }
    
    .harmony-controls select:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-color: var(--color-primary);
    }
  `;
  
  document.head.appendChild(style);
}
