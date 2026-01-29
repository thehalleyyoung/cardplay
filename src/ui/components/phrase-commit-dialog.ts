/**
 * @fileoverview Phrase Commit Dialog (G049-G050)
 * 
 * Allows user to save a selection of events as a new phrase in the library.
 * Includes metadata entry: name, category, tags, instrument, chord context.
 * 
 * @module @cardplay/ui/components/phrase-commit-dialog
 */

import type { Event } from '../../types/event';
import type { ChordSymbolInput } from '../../cards/score-notation';
import type { PhraseRecord } from '../../cards/phrase-system';
import { asTickDuration, asTick, type TickDuration } from '../../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Phrase commit data
 */
export interface PhraseCommitData {
  /** Display name */
  name: string;
  /** Category */
  category: string;
  /** Tags */
  tags: string[];
  /** Instrument/voice */
  instrument: string;
  /** Optional source chord context */
  sourceChord?: ChordSymbolInput;
  /** Events to save */
  events: Event<unknown>[];
  /** Duration in ticks */
  durationTicks: TickDuration;
  /** Time signature */
  timeSignature: { numerator: number; denominator: number };
}

/**
 * Dialog result
 */
export interface PhraseCommitResult {
  /** Whether commit was successful */
  readonly committed: boolean;
  /** The created phrase (if committed) */
  readonly phrase?: PhraseRecord<any>;
}

// ============================================================================
// DIALOG COMPONENT
// ============================================================================

/**
 * Create and show phrase commit dialog (G049)
 */
export function showPhraseCommitDialog(
  events: readonly Event<unknown>[],
  onCommit: (data: PhraseCommitData) => Promise<PhraseCommitResult>
): Promise<PhraseCommitResult> {
  return new Promise((resolve) => {
    const overlay = createDialogOverlay();
    const dialog = createDialogContent(events, async (data) => {
      // User committed
      const result = await onCommit(data);
      overlay.remove();
      resolve(result);
    }, () => {
      // User canceled
      overlay.remove();
      resolve({ committed: false });
    });
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Focus first input
    const firstInput = dialog.querySelector('input') as HTMLInputElement;
    firstInput?.focus();
  });
}

/**
 * Create dialog overlay
 */
function createDialogOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'phrase-commit-dialog-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
  `;
  
  return overlay;
}

/**
 * Create dialog content
 */
function createDialogContent(
  events: readonly Event<unknown>[],
  onCommit: (data: PhraseCommitData) => void,
  onCancel: () => void
): HTMLElement {
  const dialog = document.createElement('div');
  dialog.className = 'phrase-commit-dialog';
  dialog.style.cssText = `
    background: rgba(20, 20, 30, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    width: 480px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideIn 0.2s ease-out;
  `;
  
  // State
  let formData: Partial<PhraseCommitData> = {
    name: '',
    category: 'melody',
    tags: [],
    instrument: '',
    events: events as Event<unknown>[],
    timeSignature: { numerator: 4, denominator: 4 },
  };
  
  // Calculate duration
  const sortedEvents = [...events].sort((a, b) => 
    (a.start as number) - (b.start as number)
  );
  const firstTime = sortedEvents[0]?.start ?? 0;
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  const lastTime = lastEvent 
    ? (lastEvent.start as number) + (lastEvent.duration as number)
    : 0;
  const durationTicks = asTickDuration(lastTime - (firstTime as number));
  formData.durationTicks = durationTicks;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  const title = document.createElement('h2');
  title.style.cssText = `
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: white;
  `;
  title.textContent = 'Save as Phrase';
  header.appendChild(title);
  
  const subtitle = document.createElement('p');
  subtitle.style.cssText = `
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  `;
  subtitle.textContent = `Saving ${events.length} event(s) • ${Math.round((durationTicks as number) / 480)} bars`;
  header.appendChild(subtitle);
  
  dialog.appendChild(header);
  
  // Form
  const form = document.createElement('form');
  form.style.cssText = `
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (formData.name && formData.category) {
      onCommit(formData as PhraseCommitData);
    }
  });
  
  // Name input
  form.appendChild(createTextInput(
    'Phrase Name',
    'Enter a descriptive name...',
    true,
    (value) => { formData.name = value; }
  ));
  
  // Category selector
  form.appendChild(createCategorySelector(
    formData.category || 'melody',
    (value) => { formData.category = value; }
  ));
  
  // Instrument input
  form.appendChild(createTextInput(
    'Instrument/Voice',
    'e.g., Piano, Bass, Drums...',
    false,
    (value) => { formData.instrument = value; }
  ));
  
  // Tags input (G050)
  form.appendChild(createTagsInput(
    (tags) => { formData.tags = [...tags]; }
  ));
  
  // Chord context section (G050)
  const chordSection = createChordContextSection(
    (chord) => { 
      if (chord) {
        formData.sourceChord = chord;
      }
    }
  );
  form.appendChild(chordSection);
  
  dialog.appendChild(form);
  
  // Footer buttons
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  `;
  
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: white;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  `;
  cancelBtn.addEventListener('click', onCancel);
  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
  });
  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.background = 'rgba(255, 255, 255, 0.05)';
  });
  
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save Phrase';
  saveBtn.style.cssText = `
    padding: 8px 16px;
    background: rgba(59, 130, 246, 0.9);
    border: 1px solid rgba(59, 130, 246, 1);
    border-radius: 6px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  `;
  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (formData.name && formData.category) {
      onCommit(formData as PhraseCommitData);
    }
  });
  saveBtn.addEventListener('mouseenter', () => {
    saveBtn.style.background = 'rgba(59, 130, 246, 1)';
    saveBtn.style.transform = 'translateY(-1px)';
  });
  saveBtn.addEventListener('mouseleave', () => {
    saveBtn.style.background = 'rgba(59, 130, 246, 0.9)';
    saveBtn.style.transform = 'translateY(0)';
  });
  
  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);
  dialog.appendChild(footer);
  
  // ESC to cancel
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  return dialog;
}

/**
 * Create text input field
 */
function createTextInput(
  label: string,
  placeholder: string,
  required: boolean,
  onChange: (value: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;
  
  const labelEl = document.createElement('label');
  labelEl.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  `;
  labelEl.textContent = label + (required ? ' *' : '');
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.required = required;
  input.style.cssText = `
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: white;
    font-size: 13px;
    transition: all 0.15s;
  `;
  input.addEventListener('input', () => {
    onChange(input.value);
  });
  input.addEventListener('focus', () => {
    input.style.borderColor = 'rgba(59, 130, 246, 0.5)';
    input.style.background = 'rgba(255, 255, 255, 0.08)';
  });
  input.addEventListener('blur', () => {
    input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    input.style.background = 'rgba(255, 255, 255, 0.05)';
  });
  
  container.appendChild(labelEl);
  container.appendChild(input);
  return container;
}

/**
 * Create category selector
 */
function createCategorySelector(
  current: string,
  onChange: (value: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;
  
  const label = document.createElement('label');
  label.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  `;
  label.textContent = 'Category *';
  
  const select = document.createElement('select');
  select.style.cssText = `
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: white;
    font-size: 13px;
    cursor: pointer;
  `;
  
  const categories = [
    'melody', 'bass', 'rhythm', 'chord', 'fill', 
    'intro', 'outro', 'transition', 'riff', 'arpeggio', 
    'ostinato', 'hook', 'custom'
  ];
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    option.selected = cat === current;
    select.appendChild(option);
  });
  
  select.addEventListener('change', () => {
    onChange(select.value);
  });
  
  container.appendChild(label);
  container.appendChild(select);
  return container;
}

/**
 * Create tags input (G050)
 */
function createTagsInput(
  onChange: (tags: readonly string[]) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;
  
  const label = document.createElement('label');
  label.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  `;
  label.textContent = 'Tags';
  
  const tagContainer = document.createElement('div');
  tagContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    min-height: 40px;
  `;
  
  let tags: string[] = [];
  
  const updateTags = () => {
    onChange(tags);
    renderTags();
  };
  
  const renderTags = () => {
    // Clear existing tag chips
    const chips = tagContainer.querySelectorAll('.tag-chip');
    chips.forEach(chip => chip.remove());
    
    // Render tag chips
    tags.forEach((tag, index) => {
      const chip = document.createElement('div');
      chip.className = 'tag-chip';
      chip.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-radius: 4px;
        font-size: 11px;
        color: white;
      `;
      
      const text = document.createElement('span');
      text.textContent = tag;
      chip.appendChild(text);
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        font-size: 14px;
        line-height: 1;
      `;
      removeBtn.addEventListener('click', () => {
        tags.splice(index, 1);
        updateTags();
      });
      chip.appendChild(removeBtn);
      
      tagContainer.insertBefore(chip, input);
    });
  };
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add tag...';
  input.style.cssText = `
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    font-size: 13px;
    outline: none;
    min-width: 100px;
  `;
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = input.value.trim();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
        input.value = '';
        updateTags();
      }
    } else if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
      tags.pop();
      updateTags();
    }
  });
  
  tagContainer.appendChild(input);
  
  container.appendChild(label);
  container.appendChild(tagContainer);
  
  const hint = document.createElement('div');
  hint.style.cssText = `
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  `;
  hint.textContent = 'Press Enter to add tags, Backspace to remove';
  container.appendChild(hint);
  
  return container;
}

/**
 * Create chord context section (G050)
 */
function createChordContextSection(
  onChange: (chord: ChordSymbolInput | undefined) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;
  
  const label = document.createElement('label');
  label.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  `;
  label.textContent = 'Chord Context (Optional)';
  
  const row = document.createElement('div');
  row.style.cssText = `
    display: flex;
    gap: 8px;
  `;
  
  const rootInput = document.createElement('input');
  rootInput.type = 'text';
  rootInput.placeholder = 'Root (e.g., C, F#)';
  rootInput.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: white;
    font-size: 13px;
  `;
  
  const typeInput = document.createElement('input');
  typeInput.type = 'text';
  typeInput.placeholder = 'Type (e.g., m7, maj7)';
  typeInput.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: white;
    font-size: 13px;
  `;
  
  const updateChord = () => {
    const root = rootInput.value.trim();
    const type = typeInput.value.trim();
    
    if (root) {
      const symbol = type ? `${root}${type}` : root;
      onChange({
        startTick: asTick(0),
        root: root as 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B' | 'C#' | 'D#' | 'F#' | 'G#' | 'A#' | 'Db' | 'Eb' | 'Gb' | 'Ab' | 'Bb',
        type: type || 'major',
        symbol,
      });
    } else {
      onChange(undefined);
    }
  };
  
  rootInput.addEventListener('input', updateChord);
  typeInput.addEventListener('input', updateChord);
  
  row.appendChild(rootInput);
  row.appendChild(typeInput);
  
  container.appendChild(label);
  container.appendChild(row);
  
  const hint = document.createElement('div');
  hint.style.cssText = `
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  `;
  hint.textContent = 'Set chord context for smart phrase adaptation when dragging';
  container.appendChild(hint);
  
  return container;
}
