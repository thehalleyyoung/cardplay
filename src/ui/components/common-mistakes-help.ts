/**
 * Common Mistakes Help Section
 * 
 * Educational component showing common mistakes made by users
 * across different personas and workflows. Helps users avoid
 * pitfalls and learn best practices.
 * 
 * Organized by persona and workflow type.
 */

export interface MistakeCategory {
  id: string;
  name: string;
  persona: 'notation-composer' | 'tracker-user' | 'sound-designer' | 'producer' | 'general';
  icon: string;
}

export interface CommonMistake {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  consequence: string;
  solution: string;
  severity: 'minor' | 'moderate' | 'severe';
  examples?: string[];
  relatedTopics?: string[];
}

export const MISTAKE_CATEGORIES: MistakeCategory[] = [
  { id: 'notation', name: 'Notation Errors', persona: 'notation-composer', icon: '📝' },
  { id: 'tracker', name: 'Tracker Pitfalls', persona: 'tracker-user', icon: '🎹' },
  { id: 'sound-design', name: 'Sound Design Issues', persona: 'sound-designer', icon: '🔊' },
  { id: 'mixing', name: 'Mixing Mistakes', persona: 'producer', icon: '🎚️' },
  { id: 'workflow', name: 'Workflow Issues', persona: 'general', icon: '⚙️' },
  { id: 'theory', name: 'Music Theory', persona: 'general', icon: '🎵' }
];

export const COMMON_MISTAKES: CommonMistake[] = [
  // Notation mistakes
  {
    id: 'note-spacing',
    categoryId: 'notation',
    title: 'Uneven Note Spacing',
    description: 'Notes are spaced evenly by visual distance rather than rhythmic duration.',
    consequence: 'Score is difficult to read and performers struggle with timing.',
    solution: 'Use proportional spacing where longer durations get more horizontal space. Most notation software does this automatically.',
    severity: 'moderate',
    examples: ['Quarter notes and eighth notes look the same distance apart'],
    relatedTopics: ['engraving', 'readability']
  },
  {
    id: 'stem-direction',
    categoryId: 'notation',
    title: 'Incorrect Stem Direction',
    description: 'Note stems point in non-standard directions (e.g., up when they should point down).',
    consequence: 'Score looks unprofessional and may confuse performers.',
    solution: 'Follow standard conventions: stems up for notes below the middle line, down for notes above.',
    severity: 'minor',
    examples: ['High notes with stems pointing up', 'Low notes with stems pointing down'],
    relatedTopics: ['notation-conventions', 'engraving']
  },
  {
    id: 'voice-crossing',
    categoryId: 'notation',
    title: 'Excessive Voice Crossing',
    description: 'Inner voices frequently cross each other, making parts hard to follow.',
    consequence: 'Individual parts become difficult to read and perform.',
    solution: 'Use separate staves for voices when they cross frequently. Ensure each voice has a clear melodic line.',
    severity: 'moderate',
    relatedTopics: ['voice-leading', 'orchestration']
  },

  // Tracker mistakes
  {
    id: 'pattern-length',
    categoryId: 'tracker',
    title: 'Inconsistent Pattern Length',
    description: 'Patterns have different lengths causing sync issues when looping.',
    consequence: 'Tracks fall out of sync when patterns loop at different times.',
    solution: 'Keep all patterns the same length (usually 64 rows) or use multiples of a base length.',
    severity: 'severe',
    examples: ['Pattern A is 64 rows, Pattern B is 48 rows'],
    relatedTopics: ['arrangement', 'timing']
  },
  {
    id: 'effect-column',
    categoryId: 'tracker',
    title: 'Forgetting Effect Column Values',
    description: 'Using an effect command without specifying the parameter value.',
    consequence: 'Effect doesn\'t work or uses a default value that doesn\'t match intent.',
    solution: 'Always specify both effect command and value (e.g., "C40" not just "C").',
    severity: 'moderate',
    examples: ['Volume slide command without rate', 'Portamento without speed'],
    relatedTopics: ['effects', 'commands']
  },
  {
    id: 'note-off',
    categoryId: 'tracker',
    title: 'Missing Note-Off Commands',
    description: 'Notes sustain indefinitely because no note-off event is placed.',
    consequence: 'Notes drone on, consuming voices and creating muddy mix.',
    solution: 'Use note-off command (usually "===") or set envelope release in instrument.',
    severity: 'moderate',
    relatedTopics: ['instruments', 'envelopes']
  },

  // Sound design mistakes
  {
    id: 'filter-resonance',
    categoryId: 'sound-design',
    title: 'Excessive Filter Resonance',
    description: 'Filter resonance cranked too high causing harsh ringing or self-oscillation.',
    consequence: 'Harsh, piercing sound that dominates the mix and causes ear fatigue.',
    solution: 'Use resonance sparingly. Start low and increase gradually while listening at normal volume.',
    severity: 'moderate',
    examples: ['High-Q peaks causing ringing', 'Self-oscillation overwhelming signal'],
    relatedTopics: ['filtering', 'synthesis']
  },
  {
    id: 'mono-output',
    categoryId: 'sound-design',
    title: 'Forgetting Stereo Width',
    description: 'All synth patches are perfectly mono or too narrow.',
    consequence: 'Mix sounds flat and lacks spatial dimension.',
    solution: 'Add subtle stereo width with unison detune, chorus, or stereo delay. Don\'t overdo it.',
    severity: 'minor',
    relatedTopics: ['stereo-imaging', 'mixing']
  },
  {
    id: 'clipping-oscillators',
    categoryId: 'sound-design',
    title: 'Oscillator Clipping',
    description: 'Too many oscillators at full volume causing internal clipping before filters.',
    consequence: 'Harsh distortion, reduced dynamic range, filters can\'t work properly.',
    solution: 'Reduce oscillator volumes so sum is below 0dB. Use mixer section gain staging.',
    severity: 'severe',
    examples: ['3+ oscillators all at 100% volume'],
    relatedTopics: ['gain-staging', 'mixing']
  },

  // Mixing mistakes
  {
    id: 'master-clipping',
    categoryId: 'mixing',
    title: 'Master Bus Clipping',
    description: 'Master output exceeds 0dBFS causing digital clipping.',
    consequence: 'Harsh distortion, lost detail, unprofessional sound.',
    solution: 'Leave headroom on master (aim for -6dB peak). Use limiter as safety, not for volume.',
    severity: 'severe',
    examples: ['Master meter constantly red', 'Audible distortion on loud sections'],
    relatedTopics: ['mastering', 'gain-staging']
  },
  {
    id: 'eq-boost-only',
    categoryId: 'mixing',
    title: 'Only Boosting EQ',
    description: 'Always adding frequencies with EQ, never cutting.',
    consequence: 'Mix becomes muddy, loses clarity, headroom problems.',
    solution: 'Cut problem frequencies first. Boost sparingly. Subtractive EQ is often better.',
    severity: 'moderate',
    examples: ['Boosting lows on every track', 'Never removing muddy frequencies'],
    relatedTopics: ['eq', 'frequency-balance']
  },
  {
    id: 'reverb-overload',
    categoryId: 'mixing',
    title: 'Too Much Reverb',
    description: 'Every track has heavy reverb, creating a washedout sound.',
    consequence: 'Mix is muddy, instruments lose clarity and punch, sounds amateurish.',
    solution: 'Use reverb selectively. Keep drums mostly dry. Use different reverb types/sizes.',
    severity: 'moderate',
    relatedTopics: ['reverb', 'spatial-effects']
  },

  // Workflow mistakes
  {
    id: 'no-backups',
    categoryId: 'workflow',
    title: 'Not Saving Versions',
    description: 'Working on a single file without saving incremental versions.',
    consequence: 'Can\'t revert bad changes, risk losing hours of work.',
    solution: 'Save new versions regularly (e.g., "track_v1", "track_v2"). Use project folders.',
    severity: 'severe',
    examples: ['Overwriting the only copy', 'Losing 4 hours of work to a crash'],
    relatedTopics: ['project-management', 'backups']
  },
  {
    id: 'mixing-while-composing',
    categoryId: 'workflow',
    title: 'Mixing Too Early',
    description: 'Spending time on detailed mixing before arrangement is complete.',
    consequence: 'Wasted effort when arrangements change. Creative flow interrupted.',
    solution: 'Rough mix only during composition. Save detailed mixing for dedicated mixing phase.',
    severity: 'minor',
    relatedTopics: ['workflow', 'production-stages']
  },
  {
    id: 'monitoring-volume',
    categoryId: 'workflow',
    title: 'Monitoring Too Loud',
    description: 'Working at high monitoring volumes for extended periods.',
    consequence: 'Ear fatigue, poor mixing decisions, potential hearing damage.',
    solution: 'Work at conversation level (70-85 dB). Take breaks. Check mixes at low volume.',
    severity: 'severe',
    relatedTopics: ['monitoring', 'hearing-health']
  },

  // Music theory mistakes
  {
    id: 'parallel-fifths',
    categoryId: 'theory',
    title: 'Parallel Perfect Fifths',
    description: 'Outer voices moving in parallel perfect fifths or octaves.',
    consequence: 'Sounds hollow and reduces independence between voices (in classical contexts).',
    solution: 'Use contrary or oblique motion when approaching perfect consonances. Or embrace it if stylistically appropriate.',
    severity: 'minor',
    examples: ['Bass and melody both moving up by perfect fifth'],
    relatedTopics: ['voice-leading', 'counterpoint']
  },
  {
    id: 'key-signature',
    categoryId: 'theory',
    title: 'Wrong Key Signature',
    description: 'Using accidentals for every note instead of proper key signature.',
    consequence: 'Score is cluttered, harder to read, key center unclear.',
    solution: 'Identify the key and use appropriate key signature. Use accidentals only for chromatic notes.',
    severity: 'moderate',
    relatedTopics: ['key-signatures', 'notation']
  },
  {
    id: 'resolution',
    categoryId: 'theory',
    title: 'Unresolved Leading Tone',
    description: 'Leading tone (scale degree 7) doesn\'t resolve up to tonic.',
    consequence: 'Cadences sound weak or incomplete (in tonal music).',
    solution: 'Resolve leading tone up by half-step to tonic, especially in outer voices.',
    severity: 'minor',
    examples: ['B to C in C major', 'F# to G in G major'],
    relatedTopics: ['harmony', 'voice-leading']
  }
];

export class CommonMistakesHelp {
  private container: HTMLElement;
  private selectedCategory: string | null = null;
  private searchQuery = '';
  private filteredMistakes: CommonMistake[] = [];

  constructor() {
    this.container = this.createUI();
    this.filterMistakes();
  }

  /**
   * Get the help container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Create help UI
   */
  private createUI(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'common-mistakes-help';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--panel-background, #2a2a2a);
      color: var(--text-primary, #ffffff);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--border-color, #444444);
    `;

    const title = document.createElement('h2');
    title.textContent = '⚠️ Common Mistakes';
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Learn from common pitfalls and improve your workflow';
    subtitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 13px;
      color: var(--text-secondary, #cccccc);
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search mistakes...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 13px;
    `;
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      this.filterMistakes();
    });

    header.appendChild(title);
    header.appendChild(subtitle);
    header.appendChild(searchInput);

    // Category filters
    const filters = this.createFilters();

    // Content
    const content = document.createElement('div');
    content.id = 'mistakes-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `;

    container.appendChild(header);
    container.appendChild(filters);
    container.appendChild(content);

    return container;
  }

  /**
   * Create filter buttons
   */
  private createFilters(): HTMLElement {
    const filters = document.createElement('div');
    filters.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid var(--border-color, #444444);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    `;

    const allButton = this.createFilterButton('all', '📚 All', filters);
    filters.appendChild(allButton);

    MISTAKE_CATEGORIES.forEach((category) => {
      const button = this.createFilterButton(category.id, `${category.icon} ${category.name}`, filters);
      filters.appendChild(button);
    });

    return filters;
  }

  /**
   * Create filter button
   */
  private createFilterButton(categoryId: string, label: string, container: HTMLElement): HTMLElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = `
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      background: ${this.selectedCategory === categoryId ? 'var(--accent-color, #3399ff)' : 'transparent'};
      color: var(--text-primary, #ffffff);
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    `;

    button.addEventListener('click', () => {
      this.selectedCategory = categoryId === 'all' ? null : categoryId;
      
      // Update all buttons
      Array.from(container.children).forEach((child) => {
        (child as HTMLElement).style.background = 'transparent';
      });
      button.style.background = 'var(--accent-color, #3399ff)';

      this.filterMistakes();
    });

    return button;
  }

  /**
   * Filter mistakes
   */
  private filterMistakes(): void {
    const search = this.searchQuery.toLowerCase();

    this.filteredMistakes = COMMON_MISTAKES.filter((mistake) => {
      // Category filter
      if (this.selectedCategory && mistake.categoryId !== this.selectedCategory) {
        return false;
      }

      // Search filter
      if (search) {
        const matchesTitle = mistake.title.toLowerCase().includes(search);
        const matchesDescription = mistake.description.toLowerCase().includes(search);
        const matchesSolution = mistake.solution.toLowerCase().includes(search);
        
        if (!matchesTitle && !matchesDescription && !matchesSolution) {
          return false;
        }
      }

      return true;
    });

    this.renderMistakes();
  }

  /**
   * Render mistakes
   */
  private renderMistakes(): void {
    const content = this.container.querySelector('#mistakes-content');
    if (!content) return;

    content.innerHTML = '';

    if (this.filteredMistakes.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No mistakes found';
      empty.style.cssText = `
        text-align: center;
        padding: 48px;
        color: var(--text-tertiary, #888888);
      `;
      content.appendChild(empty);
      return;
    }

    this.filteredMistakes.forEach((mistake) => {
      const card = this.createMistakeCard(mistake);
      content.appendChild(card);
    });
  }

  /**
   * Create mistake card
   */
  private createMistakeCard(mistake: CommonMistake): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 16px;
      margin-bottom: 16px;
      background: var(--card-background, #333333);
      border-radius: 8px;
      border-left: 4px solid ${this.getSeverityColor(mistake.severity)};
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    `;

    const title = document.createElement('h3');
    title.textContent = mistake.title;
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, #ffffff);
    `;

    const severity = document.createElement('span');
    severity.textContent = mistake.severity.toUpperCase();
    severity.style.cssText = `
      padding: 4px 8px;
      border-radius: 4px;
      background: ${this.getSeverityColor(mistake.severity)};
      color: white;
      font-size: 10px;
      font-weight: 600;
    `;

    header.appendChild(title);
    header.appendChild(severity);

    const description = document.createElement('p');
    description.textContent = mistake.description;
    description.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--text-secondary, #cccccc);
      line-height: 1.5;
    `;

    const consequence = this.createSection('⚠️ Consequence:', mistake.consequence, '#ff9933');
    const solution = this.createSection('✅ Solution:', mistake.solution, '#33ff99');

    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(consequence);
    card.appendChild(solution);

    return card;
  }

  /**
   * Create info section
   */
  private createSection(label: string, text: string, color: string): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      margin: 12px 0;
      padding: 12px;
      background: var(--hover-background, #2a2a2a);
      border-radius: 6px;
      border-left: 3px solid ${color};
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: ${color};
      margin-bottom: 6px;
    `;

    const textEl = document.createElement('div');
    textEl.textContent = text;
    textEl.style.cssText = `
      font-size: 13px;
      color: var(--text-secondary, #cccccc);
      line-height: 1.5;
    `;

    section.appendChild(labelEl);
    section.appendChild(textEl);

    return section;
  }

  /**
   * Get severity color
   */
  private getSeverityColor(severity: CommonMistake['severity']): string {
    switch (severity) {
      case 'minor':
        return '#3399ff';
      case 'moderate':
        return '#ff9933';
      case 'severe':
        return '#ff3333';
    }
  }
}

/**
 * Create common mistakes help component
 */
export function createCommonMistakesHelp(): HTMLElement {
  const help = new CommonMistakesHelp();
  return help.getElement();
}
