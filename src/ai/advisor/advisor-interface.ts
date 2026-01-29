/**
 * @fileoverview AI Advisor Interface
 * 
 * Natural language query interface for the CardPlay AI system.
 * Translates questions to Prolog queries and formats answers.
 * 
 * L281-L292: AI advisor core implementation
 * 
 * @module @cardplay/ai/advisor/advisor-interface
 */

import { getPrologAdapter, PrologAdapter, type PrologSolution } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';
import { loadCompositionPatternsKB } from '../knowledge/composition-patterns-loader';
import { loadBoardLayoutKB } from '../knowledge/board-layout-loader';
import { createHarmonyExplorer, HarmonyExplorer } from '../harmony/harmony-explorer';

// =============================================================================
// Types
// =============================================================================

/**
 * Context from the active board/deck/stream.
 */
export interface AdvisorContext {
  /** Current key (if known) */
  readonly key?: { root: string; mode: string };
  /** Current chord progression */
  readonly chords?: Array<{ root: string; quality: string }>;
  /** Current genre */
  readonly genre?: string;
  /** Current board type */
  readonly boardType?: string;
  /** Active deck types */
  readonly deckTypes?: string[];
  /** User skill level (beginner/intermediate/advanced) */
  readonly skillLevel?: string;
  /** Any custom context */
  readonly custom?: Record<string, unknown>;
}

/**
 * An action that can be performed by the host.
 */
export interface HostAction {
  /** Action type */
  readonly type: 'setParam' | 'callMethod' | 'navigate' | 'create';
  /** Target card/component ID */
  readonly target?: string;
  /** Action parameters */
  readonly params: Record<string, unknown>;
  /** Human-readable description */
  readonly description: string;
}

/**
 * Follow-up question suggestion.
 */
export interface FollowUp {
  /** The question text */
  readonly question: string;
  /** Category of follow-up */
  readonly category: 'clarify' | 'expand' | 'related';
}

/**
 * Answer from the advisor.
 */
export interface AdvisorAnswer {
  /** Main answer text */
  readonly text: string;
  /** Confidence score (0-100) */
  readonly confidence: number;
  /** Whether the advisor could answer */
  readonly canAnswer: boolean;
  /** Explanation of reasoning */
  readonly explanation?: string;
  /** Suggested actions */
  readonly actions?: HostAction[];
  /** Follow-up question suggestions */
  readonly followUps?: FollowUp[];
  /** Source of answer (which KB/module) */
  readonly source?: string;
}

/**
 * Question category for routing.
 */
export type QuestionCategory = 
  | 'chord'       // Chord-related questions
  | 'melody'      // Melody questions
  | 'rhythm'      // Rhythm/beat questions
  | 'genre'       // Genre/style questions
  | 'board'       // Board/UI questions
  | 'workflow'    // How-to questions
  | 'analysis'    // Analysis questions
  | 'unknown';    // Unrecognized

// =============================================================================
// Question Patterns
// =============================================================================

/**
 * Pattern matchers for question categorization.
 * Order matters - more specific patterns should be checked first.
 */
const QUESTION_PATTERNS: Record<QuestionCategory, RegExp[]> = {
  // Board patterns first - most specific
  board: [
    /notation/i,
    /score/i,
    /compose.*music/i,
    /write.*music/i,
    /arrange|arrangement/i,
    /section/i,
    /mix(?:er|ing)?/i,
    /volume/i,
    /pan(?:ning)?/i,
    /board/i,
    /deck/i,
    /card/i,
    /layout/i,
    /which.*board/i,
    /setup/i,
    /interface/i
  ],
  chord: [
    /what chord/i,
    /which chord/i,
    /next chord/i,
    /chord progression/i,
    /harmony/i,
    /resolve/i,
    /cadence/i
  ],
  melody: [
    /melody/i,
    /melodic/i,
    /scale/i,
    /note.*use/i,
    /pitch/i,
    /interval/i
  ],
  rhythm: [
    /rhythm/i,
    /beat/i,
    /drum/i,
    /tempo/i,
    /bpm/i,
    /pattern/i,
    /groove/i
  ],
  genre: [
    /genre/i,
    /style/i,
    /lofi/i,
    /lo-fi/i,
    /hip.?hop/i,
    /jazz/i,
    /rock/i,
    /pop music/i,
    /house/i,
    /techno/i,
    /sound like/i
  ],
  workflow: [
    /how do i/i,
    /how to/i,
    /record(?!ing)/i,
    /export/i,
    /undo/i
  ],
  analysis: [
    /what('s| is) wrong/i,
    /analyze/i,
    /why/i,
    /explain/i,
    /problem/i,
    /issue/i
  ],
  unknown: []
};

/**
 * Genre-specific advice templates.
 */
const GENRE_ADVICE: Record<string, { tempo: string; chords: string; rhythm: string }> = {
  lofi: {
    tempo: '70-90 BPM with a relaxed swing feel',
    chords: 'Use jazz chords (7ths, 9ths) with chromatic movement. Try ii-V-I with extensions.',
    rhythm: 'Dusty, detuned drums with vinyl crackle. Sidechained kick, lazy swing on hi-hats.'
  },
  hiphop: {
    tempo: '85-115 BPM for boom bap, 130-160 for trap',
    chords: 'Simple progressions work well. Minor keys are common. Sample-based chords.',
    rhythm: 'Punchy kick and snare. 808s for trap. Boom bap has a head-nod swing.'
  },
  house: {
    tempo: '120-130 BPM with a steady four-on-the-floor kick',
    chords: 'Simple progressions with filter movement. Stabs and pads on the offbeat.',
    rhythm: 'Four-on-the-floor kick, open hi-hat on upbeats, clap on 2 and 4.'
  },
  jazz: {
    tempo: '120-180 BPM (varies widely by sub-style)',
    chords: 'Extended harmonies (7ths, 9ths, 13ths). ii-V-I progressions. Tritone subs.',
    rhythm: 'Swing feel with ride cymbal. Ghost notes on snare. Walking bass.'
  },
  pop: {
    tempo: '100-130 BPM, steady and consistent',
    chords: 'I-V-vi-IV is classic. Major keys, simple progressions that repeat.',
    rhythm: 'Clean, punchy drums. Strong backbeat. Syncopated hi-hats add energy.'
  }
};

// =============================================================================
// Advisor Class
// =============================================================================

/**
 * AI Advisor for natural language music queries.
 */
export class AIAdvisor {
  private adapter: PrologAdapter;
  private harmonyExplorer: HarmonyExplorer;
  private kbLoaded = false;
  private enabled = true;

  constructor(adapter: PrologAdapter = getPrologAdapter()) {
    this.adapter = adapter;
    this.harmonyExplorer = createHarmonyExplorer(adapter);
  }

  /**
   * Check whether the advisor is enabled.
   * L318: AI Off mode indicator
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable the advisor.
   * L318: When disabled, all queries return a "disabled" answer.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Ensure knowledge bases are loaded.
   */
  private async ensureKBLoaded(): Promise<void> {
    if (this.kbLoaded) return;
    
    await loadMusicTheoryKB(this.adapter);
    await loadCompositionPatternsKB(this.adapter);
    await loadBoardLayoutKB(this.adapter);
    this.kbLoaded = true;
  }
  
  /**
   * Categorize a question.
   * Order matters - more specific categories are checked first.
   */
  private categorizeQuestion(question: string): QuestionCategory {
    // Priority order for categorization (most specific first)
    const categoryOrder: QuestionCategory[] = [
      'board',    // Check board-specific terms first
      'genre',    // Can match lofi, jazz, etc. - check before rhythm/beat
      'chord',    // Music theory - specific
      'melody',   // Music theory - specific
      'rhythm',   // Music theory - specific (but "beat" may also be genre)
      'analysis', // Analysis keywords
      'workflow', // General how-to (most generic)
      'unknown'
    ];
    
    for (const category of categoryOrder) {
      const patterns = QUESTION_PATTERNS[category];
      for (const pattern of patterns) {
        if (pattern.test(question)) {
          return category;
        }
      }
    }
    return 'unknown';
  }
  
  /**
   * Ask the advisor a question.
   * 
   * @param question - Natural language question
   * @param context - Context from active board/deck
   * @returns Answer with suggestions
   * 
   * @example
   * const advisor = new AIAdvisor();
   * const answer = await advisor.ask(
   *   "What chord should I use next?",
   *   { key: { root: 'c', mode: 'major' }, chords: [...] }
   * );
   */
  async ask(question: string, context: AdvisorContext = {}): Promise<AdvisorAnswer> {
    // L318: AI Off mode — return immediately when disabled
    if (!this.enabled) {
      return {
        text: 'AI advisor is currently disabled. Enable it via board settings to get suggestions.',
        confidence: 0,
        canAnswer: false,
        source: 'disabled',
      };
    }

    await this.ensureKBLoaded();

    const category = this.categorizeQuestion(question);
    
    switch (category) {
      case 'chord':
        return this.handleChordQuestion(question, context);
      case 'melody':
        return this.handleMelodyQuestion(question, context);
      case 'rhythm':
        return this.handleRhythmQuestion(question, context);
      case 'genre':
        return this.handleGenreQuestion(question, context);
      case 'board':
        return this.handleBoardQuestion(question, context);
      case 'workflow':
        return this.handleWorkflowQuestion(question, context);
      case 'analysis':
        return this.handleAnalysisQuestion(question, context);
      default:
        return this.handleUnknownQuestion(question, context);
    }
  }
  
  /**
   * Handle chord-related questions.
   */
  private async handleChordQuestion(
    question: string,
    context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    const key = context.key ?? { root: 'c', mode: 'major' };
    const chords = context.chords ?? [];
    
    // "What chord should I use next?"
    if (/next|should.*use|comes? after/i.test(question)) {
      if (chords.length > 0) {
        const lastChord = chords[chords.length - 1];
        if (!lastChord) {
          return {
            text: "I'm missing the last chord in your progression. Try selecting a chord first.",
            confidence: 0,
            canAnswer: false,
            source: 'fallback'
          };
        }
        const suggestions = await this.harmonyExplorer.suggestNextChords(
          lastChord, key, { count: 3 }
        );
        
        if (suggestions.length > 0) {
          const primary = suggestions[0];
          if (!primary) {
            return {
              text: "I couldn't find a clear next-chord suggestion for that context.",
              confidence: 0,
              canAnswer: false,
              source: 'fallback'
            };
          }
          const alternatives = suggestions.slice(1, 3)
            .map(s => `${s.chord.root.toUpperCase()} ${s.chord.quality} (${s.numeral})`)
            .join(' or ');
          
          return {
            text: `After ${lastChord.root.toUpperCase()} ${lastChord.quality}, ` +
                  `I recommend ${primary.chord.root.toUpperCase()} ${primary.chord.quality} (${primary.numeral}). ` +
                  (alternatives ? `Alternatives: ${alternatives}` : ''),
            confidence: primary.confidence,
            canAnswer: true,
            explanation: primary.reason,
            actions: [{
              type: 'setParam',
              target: 'chord-stream',
              params: { chord: primary.chord },
              description: `Set next chord to ${primary.numeral}`
            }],
            followUps: [
              { question: 'Why does that work?', category: 'clarify' },
              { question: 'What other options do I have?', category: 'expand' }
            ],
            source: 'harmony-explorer'
          };
        }
      }
      
      return {
        text: `In ${key.root.toUpperCase()} ${key.mode}, common progressions include I-IV-V-I or I-V-vi-IV. ` +
              `The V chord (${this.getDegreeChord(key, 5).toUpperCase()}) resolves strongly to I.`,
        confidence: 70,
        canAnswer: true,
        source: 'music-theory-kb'
      };
    }
    
    // "What's wrong with this chord progression?"
    if (/wrong|problem|issue|fix/i.test(question)) {
      if (chords.length > 0) {
        const analysis = await this.harmonyExplorer.analyzeProgression(chords);
        
        let issues: string[] = [];
        if (analysis.voiceLeadingQuality < 70) {
          issues.push('Some awkward voice leading between chords');
        }
        if (analysis.chordAnalyses.some(a => !a.isDiatonic)) {
          issues.push('Contains non-diatonic chords (which may be intentional)');
        }
        if (analysis.cadences.length === 0 && chords.length >= 4) {
          issues.push('No clear cadence - progression may feel unresolved');
        }
        
        if (issues.length === 0) {
          return {
            text: 'This progression looks harmonically sound! ' + analysis.summary,
            confidence: 80,
            canAnswer: true,
            source: 'harmony-explorer'
          };
        }
        
        return {
          text: `Potential issues: ${issues.join('. ')}. ` +
                `Consider ending with a V-I or IV-I cadence for resolution.`,
          confidence: 75,
          canAnswer: true,
          explanation: analysis.summary,
          source: 'harmony-explorer'
        };
      }
    }
    
    return {
      text: 'I can help with chord progressions! ' +
            'Try asking "What chord should I use next?" or provide your current progression for analysis.',
      confidence: 50,
      canAnswer: true,
      followUps: [
        { question: 'What chord should I use next?', category: 'related' },
        { question: 'How do I create a jazzy progression?', category: 'related' }
      ],
      source: 'fallback'
    };
  }
  
  /**
   * Handle melody-related questions.
   */
  private async handleMelodyQuestion(
    question: string,
    context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    const key = context.key ?? { root: 'c', mode: 'major' };
    
    // Scale recommendations
    if (/scale|notes?.*use/i.test(question)) {
      const scale = key.mode === 'minor' 
        ? `${key.root.toUpperCase()} natural minor or harmonic minor`
        : `${key.root.toUpperCase()} major or its modes`;
      
      return {
        text: `For melodies in ${key.root.toUpperCase()} ${key.mode}, use the ${scale}. ` +
              `Focus on chord tones (root, 3rd, 5th) on strong beats, and use passing tones between.`,
        confidence: 85,
        canAnswer: true,
        followUps: [
          { question: 'What are the notes in that scale?', category: 'clarify' },
          { question: 'How do I add tension to my melody?', category: 'expand' }
        ],
        source: 'music-theory-kb'
      };
    }
    
    // Interval questions
    if (/interval/i.test(question)) {
      return {
        text: 'Stepwise motion (2nds) creates smooth melodies. Leaps (3rds, 5ths) add interest ' +
              'but should be balanced with steps. Large leaps (6ths, octaves) are dramatic ' +
              'and typically followed by contrary stepwise motion.',
        confidence: 80,
        canAnswer: true,
        source: 'music-theory-kb'
      };
    }
    
    return {
      text: 'For melodies, start with the notes of your chord, add passing tones from the scale, ' +
            'and vary the rhythm. Try singing or humming ideas first!',
      confidence: 70,
      canAnswer: true,
      source: 'fallback'
    };
  }
  
  /**
   * Handle rhythm-related questions.
   */
  private async handleRhythmQuestion(
    question: string,
    context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    const genre = context.genre ?? 'pop';
    
    // Tempo questions
    if (/tempo|bpm|speed|fast|slow/i.test(question)) {
      const result = await this.adapter.querySingle(
        `genre_tempo_range(${genre}, Min, Max)`
      );
      
      if (result) {
        return {
          text: `For ${genre}, typical tempo is ${result.Min}-${result.Max} BPM. ` +
                `Start in the middle of this range and adjust to feel.`,
          confidence: 90,
          canAnswer: true,
          source: 'composition-patterns-kb'
        };
      }
    }
    
    // Drum pattern questions
    if (/drum|beat|groove|kick|snare|hat/i.test(question)) {
      const genreAdvice = GENRE_ADVICE[genre] ?? GENRE_ADVICE.pop;
      
      return {
        text: `For ${genre}: ${genreAdvice!.rhythm}`,
        confidence: 85,
        canAnswer: true,
        actions: [{
          type: 'navigate',
          params: { deck: 'drum-generator' },
          description: 'Open drum generator'
        }],
        source: 'composition-patterns-kb'
      };
    }
    
    return {
      text: 'Start with kick on beats 1 and 3, snare on 2 and 4 for a basic backbeat. ' +
            'Add hi-hats for drive, and vary velocity for a human feel.',
      confidence: 75,
      canAnswer: true,
      source: 'fallback'
    };
  }
  
  /**
   * Handle genre-related questions.
   */
  private async handleGenreQuestion(
    question: string,
    context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    // Match genre from question
    const genreMatch = question.toLowerCase().match(
      /lofi|lo-fi|hip.?hop|house|techno|jazz|rock|pop|edm|trap|ambient/
    );
    const genre = genreMatch ? genreMatch[0].replace(/[- ]/g, '') : (context.genre ?? 'pop');
    const normalizedGenre = genre.replace('lo-fi', 'lofi').replace('hip-hop', 'hiphop');
    
    const advice = GENRE_ADVICE[normalizedGenre];
    
    if (advice) {
      return {
        text: `To create ${genre} music:\n` +
              `• Tempo: ${advice.tempo}\n` +
              `• Chords: ${advice.chords}\n` +
              `• Rhythm: ${advice.rhythm}`,
        confidence: 90,
        canAnswer: true,
        actions: [{
          type: 'setParam',
          target: 'generator',
          params: { genre: normalizedGenre },
          description: `Set generator genre to ${genre}`
        }],
        followUps: [
          { question: `What chords work for ${genre}?`, category: 'expand' },
          { question: `What tempo should I use for ${genre}?`, category: 'related' }
        ],
        source: 'genre-templates'
      };
    }
    
    // Query composition KB for genre info
    const characteristics = await this.adapter.queryAll(
      `genre_characteristic(${normalizedGenre}, Char)`
    );
    
    if (characteristics.length > 0) {
      const chars = characteristics
        .filter((r): r is PrologSolution & { Char: unknown } => r !== null)
        .map(r => String(r.Char))
        .join(', ');
      
      return {
        text: `${genre.charAt(0).toUpperCase() + genre.slice(1)} is characterized by: ${chars}`,
        confidence: 75,
        canAnswer: true,
        source: 'composition-patterns-kb'
      };
    }
    
    return {
      text: `I don't have specific templates for ${genre}, but I can help with the fundamentals! ` +
            `Try asking about tempo, chords, or rhythm separately.`,
      confidence: 50,
      canAnswer: true,
      source: 'fallback'
    };
  }
  
  /**
   * Handle board/UI questions.
   */
  private async handleBoardQuestion(
    question: string,
    context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    void context;
    // Specific board recommendations
    if (/notation|score|write.*music|compose/i.test(question)) {
      return {
        text: 'For notation and composition, use the Notation Board with a score-notation deck. ' +
              'Add a harmony-display deck to see chord analysis as you work.',
        confidence: 85,
        canAnswer: true,
        actions: [{
          type: 'navigate',
          params: { board: 'notation-board' },
          description: 'Open Notation Board'
        }],
        source: 'board-layout-kb'
      };
    }
    
    if (/arrange|arrangement|structure|section/i.test(question)) {
      return {
        text: 'For arrangement, use the Session Board. It provides a timeline view ' +
              'for organizing sections (intro, verse, chorus, etc.) and gives an overview ' +
              'of your full track.',
        confidence: 85,
        canAnswer: true,
        source: 'board-layout-kb'
      };
    }
    
    if (/mix|mixing|volume|pan/i.test(question)) {
      return {
        text: 'For mixing, use the Mixer Board. It shows all your channels with ' +
              'faders, pan controls, and effects sends.',
        confidence: 85,
        canAnswer: true,
        source: 'board-layout-kb'
      };
    }
    
    // Query board layout KB
    const boards = await this.adapter.queryAll('board_type(BoardId, _, _)');
    
    if (boards.length > 0) {
      const boardList = boards
        .map(r => r.BoardId)
        .filter((id): id is unknown => id !== undefined)
        .map(id => String(id))
        .slice(0, 5)
        .join(', ');
      
      return {
        text: `Available board types include: ${boardList}. ` +
              `Each board provides a different workflow focus. ` +
              `What are you trying to do?`,
        confidence: 70,
        canAnswer: true,
        followUps: [
          { question: 'How do I compose music?', category: 'related' },
          { question: 'How do I mix my track?', category: 'related' }
        ],
        source: 'board-layout-kb'
      };
    }
    
    return {
      text: 'CardPlay has several boards for different workflows: ' +
            'Notation for writing, Session for arranging, and Mixer for mixing. ' +
            'What would you like to do?',
      confidence: 60,
      canAnswer: true,
      followUps: [
        { question: 'How do I compose music?', category: 'related' },
        { question: 'How do I mix my track?', category: 'related' }
      ],
      source: 'fallback'
    };
  }
  
  /**
   * Handle workflow/how-to questions.
   */
  private async handleWorkflowQuestion(
    question: string,
    context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    void context;
    if (/record|audio/i.test(question)) {
      return {
        text: 'To record: 1) Add an audio track, 2) Select your input device, ' +
              '3) Arm the track for recording, 4) Press record and play! ' +
              'Monitor your levels to avoid clipping.',
        confidence: 80,
        canAnswer: true,
        source: 'workflow-templates'
      };
    }
    
    if (/export|render|bounce/i.test(question)) {
      return {
        text: 'To export: Go to File → Export Audio. Choose format (WAV for quality, ' +
              'MP3 for sharing), set your range, and export. For stems, enable ' +
              '"Export individual tracks".',
        confidence: 80,
        canAnswer: true,
        source: 'workflow-templates'
      };
    }
    
    if (/undo|mistake|go back/i.test(question)) {
      return {
        text: 'Press Cmd+Z (Mac) or Ctrl+Z (Windows) to undo. CardPlay has full ' +
              'undo history for all changes. Access the history panel via View → History.',
        confidence: 90,
        canAnswer: true,
        source: 'workflow-templates'
      };
    }
    
    return {
      text: "I can help with workflows! Try asking specifically about recording, " +
            "exporting, editing, or other tasks you'd like to accomplish.",
      confidence: 50,
      canAnswer: true,
      followUps: [
        { question: 'How do I record audio?', category: 'related' },
        { question: 'How do I export my project?', category: 'related' }
      ],
      source: 'fallback'
    };
  }
  
  /**
   * Handle analysis questions.
   */
  private async handleAnalysisQuestion(
    question: string,
    context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    void question;
    const chords = context.chords ?? [];
    
    if (chords.length > 0) {
      const analysis = await this.harmonyExplorer.analyzeProgression(chords);
      
      return {
        text: analysis.summary + 
              (analysis.cadences.length > 0 
                ? ` Cadences: ${analysis.cadences.join(', ')}.` 
                : ' No clear cadence detected.'),
        confidence: analysis.keyConfidence,
        canAnswer: true,
        explanation: `Analyzed as ${analysis.key.root.toUpperCase()} ${analysis.key.mode}. ` +
                     `Voice leading quality: ${analysis.voiceLeadingQuality}%`,
        source: 'harmony-explorer'
      };
    }
    
    return {
      text: 'I can analyze chord progressions, melodies, and rhythms. ' +
            'Please provide the content you want analyzed, or ' +
            'I\'ll use what\'s active in your current session.',
      confidence: 50,
      canAnswer: true,
      source: 'fallback'
    };
  }
  
  /**
   * Handle questions that don't match any category.
   */
  private async handleUnknownQuestion(
    question: string,
    _context: AdvisorContext
  ): Promise<AdvisorAnswer> {
    void question;
    return {
      text: "I'm not sure how to answer that specific question. " +
            "I can help with chords, melodies, rhythms, genres, and workflows. " +
            "Could you rephrase or try one of these questions?",
      confidence: 0,
      canAnswer: false,
      followUps: [
        { question: 'What chord should I use next?', category: 'related' },
        { question: 'How do I create a lofi beat?', category: 'related' },
        { question: 'Which board should I use?', category: 'related' }
      ],
      source: 'fallback'
    };
  }
  
  /**
   * Get chord for a scale degree.
   */
  private getDegreeChord(key: { root: string; mode: string }, degree: number): string {
    const roots: Record<string, number> = {
      'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11
    };
    const notes = ['c', 'csharp', 'd', 'dsharp', 'e', 'f', 'fsharp', 'g', 'gsharp', 'a', 'asharp', 'b'];
    
    const keyRoot = roots[key.root.toLowerCase()] ?? 0;
    const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
    const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
    
    const intervals = key.mode === 'minor' ? minorIntervals : majorIntervals;
    const interval = intervals[(degree - 1) % 7] ?? 0;
    const targetSemitone = (keyRoot + interval) % 12;
    
    return notes[targetSemitone] ?? 'c';
  }
}

/**
 * Create a new AI advisor instance.
 */
export function createAIAdvisor(
  adapter: PrologAdapter = getPrologAdapter()
): AIAdvisor {
  return new AIAdvisor(adapter);
}
