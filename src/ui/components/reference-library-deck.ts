/**
 * Reference Library Deck
 * 
 * Provides quick access to music theory references for notation composers:
 * - Common chord progressions
 * - Scale reference charts
 * - Voice leading rules
 * - Orchestration guidelines
 * - Notation conventions
 * - Engraving best practices
 * 
 * Designed for notation board to support composition workflow.
 */

export interface ReferenceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ReferenceItem {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  tags: string[];
  examples?: string[];
}

export const REFERENCE_CATEGORIES: ReferenceCategory[] = [
  {
    id: 'progressions',
    name: 'Chord Progressions',
    description: 'Common progressions across styles',
    icon: '🎹'
  },
  {
    id: 'scales',
    name: 'Scales & Modes',
    description: 'Scale reference charts',
    icon: '🎵'
  },
  {
    id: 'voice-leading',
    name: 'Voice Leading',
    description: 'Voice leading principles',
    icon: '📐'
  },
  {
    id: 'orchestration',
    name: 'Orchestration',
    description: 'Instrument ranges and combinations',
    icon: '🎻'
  },
  {
    id: 'notation',
    name: 'Notation Conventions',
    description: 'Standard notation practices',
    icon: '📝'
  },
  {
    id: 'engraving',
    name: 'Engraving',
    description: 'Professional score layout',
    icon: '✒️'
  }
];

export const REFERENCE_ITEMS: ReferenceItem[] = [
  // Chord Progressions
  {
    id: 'prog-pop',
    categoryId: 'progressions',
    title: 'Pop Progressions',
    content: 'I-V-vi-IV (The "Axis" progression)\nI-IV-V-IV (Classic rock)\nI-vi-IV-V (50s progression)\nvi-IV-I-V (Sensitive ballad)',
    tags: ['pop', 'common', 'contemporary'],
    examples: ['C-G-Am-F', 'C-F-G-F', 'C-Am-F-G', 'Am-F-C-G']
  },
  {
    id: 'prog-jazz',
    categoryId: 'progressions',
    title: 'Jazz Progressions',
    content: 'ii-V-I (Most common)\nI-vi-ii-V (Rhythm changes)\niii-vi-ii-V-I (Extended turnaround)\nI-IV-#IVdim-V',
    tags: ['jazz', 'standards', 'turnaround'],
    examples: ['Dm7-G7-Cmaj7', 'C-Am7-Dm7-G7', 'Em7-Am7-Dm7-G7-Cmaj7']
  },
  {
    id: 'prog-classical',
    categoryId: 'progressions',
    title: 'Classical Cadences',
    content: 'Authentic: V-I (or V7-I)\nPlagal: IV-I ("Amen" cadence)\nHalf: I-V (or ii-V)\nDeceptive: V-vi',
    tags: ['classical', 'cadence', 'harmony'],
    examples: []
  },
  
  // Scales
  {
    id: 'scale-major',
    categoryId: 'scales',
    title: 'Major Scale Modes',
    content: 'Ionian (Major): W-W-H-W-W-W-H\nDorian: W-H-W-W-W-H-W\nPhrygian: H-W-W-W-H-W-W\nLydian: W-W-W-H-W-W-H\nMixolydian: W-W-H-W-W-H-W\nAeolian (Natural Minor): W-H-W-W-H-W-W\nLocrian: H-W-W-H-W-W-W',
    tags: ['modes', 'major', 'diatonic'],
    examples: ['C D E F G A B', 'D E F G A B C', 'E F G A B C D']
  },
  {
    id: 'scale-minor',
    categoryId: 'scales',
    title: 'Minor Scales',
    content: 'Natural Minor: W-H-W-W-H-W-W\nHarmonic Minor: W-H-W-W-H-W+H-H\nMelodic Minor (ascending): W-H-W-W-W-W-H\nMelodic Minor (descending): same as natural minor',
    tags: ['minor', 'melodic', 'harmonic'],
    examples: ['A B C D E F G', 'A B C D E F G#', 'A B C D E F# G#']
  },
  {
    id: 'scale-pentatonic',
    categoryId: 'scales',
    title: 'Pentatonic Scales',
    content: 'Major Pentatonic: W-W-1.5W-W-1.5W\nMinor Pentatonic: 1.5W-W-W-1.5W-W\nBlues Scale: 1.5W-W-H-H-1.5W-W',
    tags: ['pentatonic', 'blues', 'folk'],
    examples: ['C D E G A', 'A C D E G', 'A C D Eb E G']
  },
  
  // Voice Leading
  {
    id: 'voice-parallel',
    categoryId: 'voice-leading',
    title: 'Parallel Motion',
    content: 'Avoid parallel fifths and octaves between outer voices.\nParallel thirds and sixths are acceptable and common.\nParallel fourths acceptable in middle voices (not outer).',
    tags: ['counterpoint', 'rules', 'motion'],
    examples: []
  },
  {
    id: 'voice-contrary',
    categoryId: 'voice-leading',
    title: 'Contrary Motion',
    content: 'Voices move in opposite directions.\nPreferred for approaching perfect consonances (P5, P8).\nCreates independence between voices.\nReduces likelihood of voice crossing.',
    tags: ['counterpoint', 'independence', 'motion'],
    examples: []
  },
  {
    id: 'voice-common-tones',
    categoryId: 'voice-leading',
    title: 'Common Tone Connection',
    content: 'Keep common tones between chords in the same voice.\nMove other voices by smallest possible interval.\nEspecially important for smooth progressions.\nExample: C major to A minor - keep C and E.',
    tags: ['smooth', 'connection', 'efficiency'],
    examples: []
  },
  
  // Orchestration
  {
    id: 'orch-strings',
    categoryId: 'orchestration',
    title: 'String Ranges',
    content: 'Violin: G3-E7 (comfortable: A3-A6)\nViola: C3-A6 (comfortable: G3-C6)\nCello: C2-A5 (comfortable: C2-C5)\nDouble Bass: E1-G4 (comfortable: E1-G3)\n\nNote: Strings sound one octave lower than written for double bass.',
    tags: ['strings', 'ranges', 'transposition'],
    examples: []
  },
  {
    id: 'orch-woodwinds',
    categoryId: 'orchestration',
    title: 'Woodwind Ranges',
    content: 'Flute: C4-C7 (comfortable: D4-A6)\nOboe: Bb3-A6 (comfortable: C4-F6)\nClarinet (Bb): E3-G6 (written: sounds M2 lower)\nBassoon: Bb1-Eb5 (comfortable: Bb1-D5)',
    tags: ['woodwinds', 'ranges', 'transposition'],
    examples: []
  },
  {
    id: 'orch-brass',
    categoryId: 'orchestration',
    title: 'Brass Ranges',
    content: 'Trumpet (Bb): F#3-C6 (written: sounds M2 lower)\nHorn (F): B1-F5 (written: sounds P5 lower)\nTrombone: E2-F5 (comfortable: E2-C5)\nTuba: D1-F4 (comfortable: E1-C4)',
    tags: ['brass', 'ranges', 'transposition'],
    examples: []
  },
  
  // Notation Conventions
  {
    id: 'notation-stems',
    categoryId: 'notation',
    title: 'Stem Direction',
    content: 'Notes on middle line: stem can go either direction\nNotes above middle line: stems down\nNotes below middle line: stems up\nFor chords: stem direction follows the majority of noteheads\nBeamed groups: stem direction usually consistent',
    tags: ['stems', 'direction', 'conventions'],
    examples: []
  },
  {
    id: 'notation-accidentals',
    categoryId: 'notation',
    title: 'Accidental Placement',
    content: 'Accidentals placed before noteheads, never after\nApply to all notes on that line/space until bar line\nCourtesy accidentals in parentheses when helpful\nIn chords: stack accidentals left to right, top to bottom',
    tags: ['accidentals', 'placement', 'clarity'],
    examples: []
  },
  {
    id: 'notation-articulation',
    categoryId: 'notation',
    title: 'Articulation Marks',
    content: 'Staccato (dot): short, separated\nAccent (>): emphasized attack\nTenuto (line): full value, slight emphasis\nStaccatissimo (wedge): very short\nLegato (slur): smooth connection\nFermata: hold longer than written value',
    tags: ['articulation', 'expression', 'marks'],
    examples: []
  },
  
  // Engraving
  {
    id: 'engrave-spacing',
    categoryId: 'engraving',
    title: 'Note Spacing',
    content: 'Spacing should be proportional to rhythmic duration\nNot strictly linear - shorter notes compress somewhat\nBalance visual weight and rhythmic clarity\nAdd extra space after barlines\nAvoid overly compressed or spread layouts',
    tags: ['spacing', 'layout', 'readability'],
    examples: []
  },
  {
    id: 'engrave-margins',
    categoryId: 'engraving',
    title: 'Page Layout',
    content: 'Standard margins: 1 inch (2.5cm) all sides\nInner margin slightly larger for binding\nFirst page title centered, adequate white space\nPage numbers in footer, centered or outer corner\nConsistent staff sizes throughout',
    tags: ['layout', 'margins', 'professional'],
    examples: []
  },
  {
    id: 'engrave-rehearsal',
    categoryId: 'engraving',
    title: 'Rehearsal Marks',
    content: 'Place at structural boundaries (phrases, sections)\nUse boxed letters (A, B, C...) or measure numbers\nVisible in all parts and score\nConsistent placement (above top staff)\nSequential numbering/lettering throughout piece',
    tags: ['rehearsal', 'marks', 'organization'],
    examples: []
  }
];

export class ReferenceLid {
  private container: HTMLElement;
  private searchInput: HTMLInputElement | null = null;
  private currentCategory: string | null = null;
  private filteredItems: ReferenceItem[] = [];

  constructor() {
    this.container = this.createUI();
    this.filterItems();
  }

  /**
   * Get the deck container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Create reference library UI
   */
  private createUI(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'reference-library-deck';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--deck-background, #2a2a2a);
      color: var(--text-primary, #ffffff);
    `;

    // Header with search
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid var(--border-color, #444444);
    `;

    const title = document.createElement('h3');
    title.textContent = '📚 Reference Library';
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
    `;

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.placeholder = 'Search references...';
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 6px 12px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 13px;
    `;
    this.searchInput.addEventListener('input', () => {
      this.filterItems();
    });

    header.appendChild(title);
    header.appendChild(this.searchInput);

    // Category tabs
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex;
      gap: 4px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #444444);
      overflow-x: auto;
      flex-shrink: 0;
    `;

    const allTab = this.createCategoryTab('all', '📚 All', tabs);
    tabs.appendChild(allTab);

    REFERENCE_CATEGORIES.forEach((category) => {
      const tab = this.createCategoryTab(category.id, `${category.icon} ${category.name}`, tabs);
      tabs.appendChild(tab);
    });

    // Content area
    const content = document.createElement('div');
    content.id = 'reference-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    `;

    container.appendChild(header);
    container.appendChild(tabs);
    container.appendChild(content);

    return container;
  }

  /**
   * Create category tab
   */
  private createCategoryTab(categoryId: string, label: string, tabsContainer: HTMLElement): HTMLElement {
    const tab = document.createElement('button');
    tab.textContent = label;
    tab.style.cssText = `
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      background: ${this.currentCategory === categoryId ? 'var(--accent-color, #3399ff)' : 'transparent'};
      color: var(--text-primary, #ffffff);
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    `;

    tab.addEventListener('click', () => {
      this.currentCategory = categoryId === 'all' ? null : categoryId;
      
      // Update all tabs
      Array.from(tabsContainer.children).forEach((child) => {
        (child as HTMLElement).style.background = 'transparent';
      });
      tab.style.background = 'var(--accent-color, #3399ff)';

      this.filterItems();
    });

    tab.addEventListener('mouseenter', () => {
      if (this.currentCategory !== categoryId) {
        tab.style.background = 'var(--hover-background, #333333)';
      }
    });

    tab.addEventListener('mouseleave', () => {
      if (this.currentCategory !== categoryId) {
        tab.style.background = 'transparent';
      }
    });

    return tab;
  }

  /**
   * Filter items based on category and search
   */
  private filterItems(): void {
    const search = this.searchInput?.value.toLowerCase() || '';
    
    this.filteredItems = REFERENCE_ITEMS.filter((item) => {
      const matchesCategory = !this.currentCategory || item.categoryId === this.currentCategory;
      const matchesSearch = !search ||
        item.title.toLowerCase().includes(search) ||
        item.content.toLowerCase().includes(search) ||
        item.tags.some((tag) => tag.toLowerCase().includes(search));
      
      return matchesCategory && matchesSearch;
    });

    this.renderItems();
  }

  /**
   * Render filtered items
   */
  private renderItems(): void {
    const content = this.container.querySelector('#reference-content');
    if (!content) return;

    content.innerHTML = '';

    if (this.filteredItems.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No references found';
      empty.style.cssText = `
        text-align: center;
        padding: 32px;
        color: var(--text-tertiary, #888888);
      `;
      content.appendChild(empty);
      return;
    }

    this.filteredItems.forEach((item) => {
      const card = this.createReferenceCard(item);
      content.appendChild(card);
    });
  }

  /**
   * Create reference card
   */
  private createReferenceCard(item: ReferenceItem): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 12px;
      margin-bottom: 12px;
      background: var(--card-background, #333333);
      border-radius: 6px;
      border-left: 3px solid var(--accent-color, #3399ff);
    `;

    const title = document.createElement('h4');
    title.textContent = item.title;
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #ffffff);
    `;

    const content = document.createElement('pre');
    content.textContent = item.content;
    content.style.cssText = `
      margin: 0 0 8px 0;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--text-secondary, #cccccc);
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

    if (item.examples && item.examples.length > 0) {
      const examples = document.createElement('div');
      examples.style.cssText = `
        margin-top: 8px;
        padding: 8px;
        background: var(--hover-background, #2a2a2a);
        border-radius: 4px;
      `;

      const examplesLabel = document.createElement('div');
      examplesLabel.textContent = 'Examples:';
      examplesLabel.style.cssText = `
        font-size: 11px;
        font-weight: 600;
        color: var(--text-tertiary, #888888);
        margin-bottom: 4px;
      `;

      const examplesList = document.createElement('div');
      examplesList.style.cssText = `
        font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
        font-size: 11px;
        color: var(--text-secondary, #cccccc);
      `;
      examplesList.textContent = item.examples.join('\n');

      examples.appendChild(examplesLabel);
      examples.appendChild(examplesList);
      card.appendChild(examples);
    }

    const tags = document.createElement('div');
    tags.style.cssText = `
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 8px;
    `;

    item.tags.forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.textContent = tag;
      tagEl.style.cssText = `
        padding: 2px 8px;
        background: var(--tag-background, #444444);
        color: var(--text-tertiary, #888888);
        border-radius: 3px;
        font-size: 10px;
      `;
      tags.appendChild(tagEl);
    });

    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(tags);

    return card;
  }
}

/**
 * Create reference library deck
 */
export function createReferenceLibraryDeck(): HTMLElement {
  const library = new ReferenceLid();
  return library.getElement();
}
