/**
 * @fileoverview Personalized Onboarding Flow
 * 
 * Implements Phase 10.2: Personalized Onboarding Flow
 * - Genre preference picker
 * - Skill level selector
 * - DAW background selector
 * - Instrument preference picker
 * - Goal selector (produce/learn/jam)
 * - Name/avatar setup
 * - Account creation (optional)
 * - Personalized dashboard generation
 * - Recommended templates
 * - Suggested first actions
 * 
 * @see currentsteps.md Phase 10.2 (lines 2037-2054)
 */

import type { UserPersona, ExperienceLevel, UserBackground, UserInterest } from './beginner-bridge';

// ============================================================================
// ONBOARDING STATE
// ============================================================================

/**
 * Genre preference for music production.
 */
export type GenrePreference =
  | 'electronic'
  | 'hip-hop'
  | 'pop'
  | 'rock'
  | 'jazz'
  | 'classical'
  | 'world'
  | 'experimental'
  | 'ambient'
  | 'metal'
  | 'folk'
  | 'r&b';

/**
 * Instrument preference.
 */
export type InstrumentPreference =
  | 'keys'
  | 'guitar'
  | 'drums'
  | 'bass'
  | 'synth'
  | 'vocals'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'percussion'
  | 'sampler'
  | 'all';

/**
 * User goal for using the application.
 */
export type UserGoal =
  | 'produce'     // Create finished tracks
  | 'learn'       // Learn music production
  | 'jam'         // Improvise and experiment
  | 'compose'     // Write compositions
  | 'sound-design' // Create sounds
  | 'perform';    // Live performance

/**
 * Onboarding step in the flow.
 */
export type OnboardingStep =
  | 'welcome'
  | 'genre-preference'
  | 'skill-level'
  | 'daw-background'
  | 'instrument-preference'
  | 'goal-selection'
  | 'name-avatar'
  | 'account-creation'
  | 'audio-setup'
  | 'midi-setup'
  | 'complete';

/**
 * Onboarding state tracking.
 */
export interface OnboardingState {
  /** Current step in onboarding */
  readonly currentStep: OnboardingStep;
  /** Steps completed */
  readonly completedSteps: readonly OnboardingStep[];
  /** Selected genres */
  readonly genres: readonly GenrePreference[];
  /** Selected skill level */
  readonly skillLevel: ExperienceLevel | null;
  /** Selected DAW background */
  readonly dawBackground: UserBackground | null;
  /** Selected instruments */
  readonly instruments: readonly InstrumentPreference[];
  /** Selected goals */
  readonly goals: readonly UserGoal[];
  /** User name */
  readonly userName: string | null;
  /** Avatar selection */
  readonly avatar: string | null;
  /** Account creation opted in */
  readonly accountCreated: boolean;
  /** Audio device configured */
  readonly audioConfigured: boolean;
  /** MIDI device configured */
  readonly midiConfigured: boolean;
  /** Start timestamp */
  readonly startedAt: number;
  /** Completed timestamp */
  readonly completedAt: number | null;
}

/**
 * Create initial onboarding state.
 */
export function createOnboardingState(): OnboardingState {
  return {
    currentStep: 'welcome',
    completedSteps: [],
    genres: [],
    skillLevel: null,
    dawBackground: null,
    instruments: [],
    goals: [],
    userName: null,
    avatar: null,
    accountCreated: false,
    audioConfigured: false,
    midiConfigured: false,
    startedAt: Date.now(),
    completedAt: null,
  };
}

// ============================================================================
// GENRE PREFERENCE PICKER
// ============================================================================

/**
 * Genre option with metadata.
 */
export interface GenreOption {
  readonly id: GenrePreference;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly popularInstruments: readonly InstrumentPreference[];
  readonly typicalTempo: { min: number; max: number };
  readonly keywords: readonly string[];
}

/**
 * Genre preference options.
 */
export const GENRE_OPTIONS: Record<GenrePreference, GenreOption> = {
  'electronic': {
    id: 'electronic',
    name: 'Electronic',
    description: 'Synths, beats, and digital production',
    emoji: '🎹',
    popularInstruments: ['synth', 'sampler', 'drums'],
    typicalTempo: { min: 110, max: 140 },
    keywords: ['EDM', 'house', 'techno', 'dubstep', 'trance'],
  },
  'hip-hop': {
    id: 'hip-hop',
    name: 'Hip-Hop',
    description: 'Beats, samples, and rap',
    emoji: '🎤',
    popularInstruments: ['drums', 'sampler', 'bass'],
    typicalTempo: { min: 70, max: 100 },
    keywords: ['rap', 'trap', 'boom-bap', 'lo-fi'],
  },
  'pop': {
    id: 'pop',
    name: 'Pop',
    description: 'Catchy melodies and modern production',
    emoji: '🎵',
    popularInstruments: ['keys', 'synth', 'drums', 'vocals'],
    typicalTempo: { min: 100, max: 130 },
    keywords: ['radio', 'mainstream', 'chart', 'vocal'],
  },
  'rock': {
    id: 'rock',
    name: 'Rock',
    description: 'Guitars, bass, and drums',
    emoji: '🎸',
    popularInstruments: ['guitar', 'bass', 'drums'],
    typicalTempo: { min: 110, max: 150 },
    keywords: ['guitar', 'band', 'live', 'energy'],
  },
  'jazz': {
    id: 'jazz',
    name: 'Jazz',
    description: 'Improvisation and complex harmony',
    emoji: '🎺',
    popularInstruments: ['keys', 'bass', 'drums', 'brass', 'woodwinds'],
    typicalTempo: { min: 80, max: 180 },
    keywords: ['swing', 'bebop', 'fusion', 'improvisation'],
  },
  'classical': {
    id: 'classical',
    name: 'Classical',
    description: 'Orchestral and traditional composition',
    emoji: '🎻',
    popularInstruments: ['strings', 'brass', 'woodwinds', 'percussion'],
    typicalTempo: { min: 60, max: 160 },
    keywords: ['orchestra', 'chamber', 'symphony', 'notation'],
  },
  'world': {
    id: 'world',
    name: 'World',
    description: 'Global rhythms and melodies',
    emoji: '🌍',
    popularInstruments: ['percussion', 'strings', 'woodwinds'],
    typicalTempo: { min: 70, max: 150 },
    keywords: ['ethnic', 'traditional', 'fusion', 'exotic'],
  },
  'experimental': {
    id: 'experimental',
    name: 'Experimental',
    description: 'Pushing boundaries and exploring sound',
    emoji: '🔬',
    popularInstruments: ['synth', 'sampler', 'all'],
    typicalTempo: { min: 60, max: 200 },
    keywords: ['avant-garde', 'noise', 'glitch', 'abstract'],
  },
  'ambient': {
    id: 'ambient',
    name: 'Ambient',
    description: 'Atmospheric and textural soundscapes',
    emoji: '🌌',
    popularInstruments: ['synth', 'sampler', 'strings'],
    typicalTempo: { min: 60, max: 90 },
    keywords: ['drone', 'atmospheric', 'chill', 'meditative'],
  },
  'metal': {
    id: 'metal',
    name: 'Metal',
    description: 'Heavy guitars and aggressive sound',
    emoji: '🤘',
    popularInstruments: ['guitar', 'bass', 'drums'],
    typicalTempo: { min: 100, max: 200 },
    keywords: ['heavy', 'distortion', 'riffs', 'aggressive'],
  },
  'folk': {
    id: 'folk',
    name: 'Folk',
    description: 'Acoustic and storytelling',
    emoji: '🪕',
    popularInstruments: ['guitar', 'strings', 'vocals'],
    typicalTempo: { min: 80, max: 130 },
    keywords: ['acoustic', 'storytelling', 'traditional', 'organic'],
  },
  'r&b': {
    id: 'r&b',
    name: 'R&B/Soul',
    description: 'Groove, vocals, and emotion',
    emoji: '🎙️',
    popularInstruments: ['keys', 'bass', 'drums', 'vocals'],
    typicalTempo: { min: 70, max: 110 },
    keywords: ['soul', 'groove', 'vocal', 'smooth'],
  },
};

// ============================================================================
// SKILL LEVEL SELECTOR
// ============================================================================

/**
 * Skill level option with metadata.
 */
export interface SkillLevelOption {
  readonly level: ExperienceLevel;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly features: readonly string[];
  readonly tutorialLength: 'short' | 'medium' | 'long';
}

/**
 * Skill level options.
 */
export const SKILL_LEVEL_OPTIONS: Record<ExperienceLevel, SkillLevelOption> = {
  'beginner': {
    level: 'beginner',
    name: 'Beginner',
    description: 'New to music production',
    emoji: '🌱',
    features: ['guided-tutorials', 'simplified-ui', 'tooltips', 'help-hints'],
    tutorialLength: 'long',
  },
  'intermediate': {
    level: 'intermediate',
    name: 'Intermediate',
    description: 'Some experience with DAWs',
    emoji: '🎓',
    features: ['standard-ui', 'optional-help', 'keyboard-shortcuts'],
    tutorialLength: 'medium',
  },
  'advanced': {
    level: 'advanced',
    name: 'Advanced',
    description: 'Power user',
    emoji: '⚡',
    features: ['advanced-features', 'scripting', 'deep-customization'],
    tutorialLength: 'short',
  },
  'expert': {
    level: 'expert',
    name: 'Expert',
    description: 'Developer/sound designer',
    emoji: '🔬',
    features: ['full-access', 'api', 'custom-cards', 'low-level-control'],
    tutorialLength: 'short',
  },
};

// ============================================================================
// DAW BACKGROUND SELECTOR
// ============================================================================

/**
 * DAW background option with metadata.
 */
export interface DAWBackgroundOption {
  readonly background: UserBackground;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly layoutPreset: string;
  readonly similarConcepts: readonly string[];
}

/**
 * DAW background options.
 */
export const DAW_BACKGROUND_OPTIONS: Record<UserBackground, DAWBackgroundOption> = {
  'none': {
    background: 'none',
    name: 'No Prior Experience',
    description: 'Brand new to music production',
    emoji: '🆕',
    layoutPreset: 'simplified',
    similarConcepts: [],
  },
  'renoise': {
    background: 'renoise',
    name: 'Renoise/Tracker',
    description: 'Pattern-based vertical workflow',
    emoji: '📊',
    layoutPreset: 'renoise',
    similarConcepts: ['patterns', 'tracks', 'hex-values', 'vertical-editing'],
  },
  'ableton': {
    background: 'ableton',
    name: 'Ableton Live',
    description: 'Session view and clips',
    emoji: '🎛️',
    layoutPreset: 'ableton',
    similarConcepts: ['clips', 'scenes', 'racks', 'session-arrangement'],
  },
  'cubase': {
    background: 'cubase',
    name: 'Cubase/Traditional DAW',
    description: 'Timeline-based arrangement',
    emoji: '🎬',
    layoutPreset: 'cubase',
    similarConcepts: ['timeline', 'regions', 'tracks', 'mixer'],
  },
  'dorico': {
    background: 'dorico',
    name: 'Dorico/Notation',
    description: 'Score-based composition',
    emoji: '🎼',
    layoutPreset: 'dorico',
    similarConcepts: ['notation', 'measures', 'staves', 'parts'],
  },
  'fl-studio': {
    background: 'fl-studio',
    name: 'FL Studio',
    description: 'Pattern-based with piano roll',
    emoji: '🍊',
    layoutPreset: 'simplified',
    similarConcepts: ['patterns', 'playlist', 'mixer', 'channel-rack'],
  },
  'logic': {
    background: 'logic',
    name: 'Logic Pro',
    description: 'Apple professional DAW',
    emoji: '🍎',
    layoutPreset: 'cubase',
    similarConcepts: ['regions', 'tracks', 'smart-controls', 'library'],
  },
  'bitwig': {
    background: 'bitwig',
    name: 'Bitwig Studio',
    description: 'Modular and hybrid workflow',
    emoji: '🔗',
    layoutPreset: 'modular',
    similarConcepts: ['clips', 'modulators', 'devices', 'hybrid-view'],
  },
  'reason': {
    background: 'reason',
    name: 'Reason',
    description: 'Virtual rack and routing',
    emoji: '🔌',
    layoutPreset: 'modular',
    similarConcepts: ['rack', 'cables', 'devices', 'cv-routing'],
  },
  'hardware': {
    background: 'hardware',
    name: 'Hardware Synths/Sequencers',
    description: 'Physical gear workflow',
    emoji: '🎹',
    layoutPreset: 'simplified',
    similarConcepts: ['knobs', 'sequences', 'patches', 'midi'],
  },
  'coding': {
    background: 'coding',
    name: 'Programming Background',
    description: 'Code-driven music creation',
    emoji: '💻',
    layoutPreset: 'modular',
    similarConcepts: ['functions', 'types', 'composition', 'api'],
  },
};

// ============================================================================
// INSTRUMENT PREFERENCE PICKER
// ============================================================================

/**
 * Instrument preference option.
 */
export interface InstrumentOption {
  readonly id: InstrumentPreference;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly category: 'melodic' | 'rhythmic' | 'harmonic' | 'all';
  readonly defaultCards: readonly string[];
}

/**
 * Instrument preference options.
 */
export const INSTRUMENT_OPTIONS: Record<InstrumentPreference, InstrumentOption> = {
  'keys': {
    id: 'keys',
    name: 'Keys/Piano',
    description: 'Piano, organ, electric piano',
    emoji: '🎹',
    category: 'harmonic',
    defaultCards: ['piano', 'organ', 'electric-piano'],
  },
  'guitar': {
    id: 'guitar',
    name: 'Guitar',
    description: 'Acoustic and electric guitar',
    emoji: '🎸',
    category: 'harmonic',
    defaultCards: ['guitar-acoustic', 'guitar-electric'],
  },
  'drums': {
    id: 'drums',
    name: 'Drums',
    description: 'Drum kits and percussion',
    emoji: '🥁',
    category: 'rhythmic',
    defaultCards: ['drum-machine', 'drum-kit'],
  },
  'bass': {
    id: 'bass',
    name: 'Bass',
    description: 'Bass guitar and synth bass',
    emoji: '🎸',
    category: 'melodic',
    defaultCards: ['bass-electric', 'bass-synth'],
  },
  'synth': {
    id: 'synth',
    name: 'Synthesizers',
    description: 'Synth leads, pads, and basses',
    emoji: '🎛️',
    category: 'all',
    defaultCards: ['synth-lead', 'synth-pad', 'synth-bass'],
  },
  'vocals': {
    id: 'vocals',
    name: 'Vocals',
    description: 'Voice and vocal processing',
    emoji: '🎤',
    category: 'melodic',
    defaultCards: ['vocal-processor', 'vocal-harmonizer'],
  },
  'strings': {
    id: 'strings',
    name: 'Strings',
    description: 'Violin, cello, orchestral strings',
    emoji: '🎻',
    category: 'melodic',
    defaultCards: ['strings-ensemble', 'strings-solo'],
  },
  'brass': {
    id: 'brass',
    name: 'Brass',
    description: 'Trumpet, trombone, horns',
    emoji: '🎺',
    category: 'melodic',
    defaultCards: ['brass-section', 'brass-solo'],
  },
  'woodwinds': {
    id: 'woodwinds',
    name: 'Woodwinds',
    description: 'Flute, clarinet, saxophone',
    emoji: '🎷',
    category: 'melodic',
    defaultCards: ['woodwinds-ensemble', 'woodwinds-solo'],
  },
  'percussion': {
    id: 'percussion',
    name: 'Percussion',
    description: 'World percussion and drums',
    emoji: '🪘',
    category: 'rhythmic',
    defaultCards: ['percussion-world', 'percussion-latin'],
  },
  'sampler': {
    id: 'sampler',
    name: 'Sampler',
    description: 'Sample-based instruments',
    emoji: '📼',
    category: 'all',
    defaultCards: ['sampler-multi', 'sampler-drum'],
  },
  'all': {
    id: 'all',
    name: 'All Instruments',
    description: 'Interested in everything',
    emoji: '🎼',
    category: 'all',
    defaultCards: [],
  },
};

// ============================================================================
// GOAL SELECTOR
// ============================================================================

/**
 * User goal option.
 */
export interface GoalOption {
  readonly id: UserGoal;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly recommendedTutorials: readonly string[];
  readonly recommendedCards: readonly string[];
}

/**
 * User goal options.
 */
export const GOAL_OPTIONS: Record<UserGoal, GoalOption> = {
  'produce': {
    id: 'produce',
    name: 'Produce Tracks',
    description: 'Create finished, polished songs',
    emoji: '🎵',
    recommendedTutorials: ['first-track', 'mixing-basics', 'arrangement'],
    recommendedCards: ['arranger', 'mixer', 'master-limiter'],
  },
  'learn': {
    id: 'learn',
    name: 'Learn Production',
    description: 'Understand music theory and techniques',
    emoji: '📚',
    recommendedTutorials: ['theory-basics', 'synthesis', 'arrangement'],
    recommendedCards: ['chord-helper', 'scale-guide', 'theory-analyzer'],
  },
  'jam': {
    id: 'jam',
    name: 'Jam & Experiment',
    description: 'Improvise and explore sounds',
    emoji: '🎹',
    recommendedTutorials: ['quick-loops', 'live-performance'],
    recommendedCards: ['looper', 'arpeggiator', 'randomizer'],
  },
  'compose': {
    id: 'compose',
    name: 'Compose Music',
    description: 'Write structured compositions',
    emoji: '🎼',
    recommendedTutorials: ['notation', 'orchestration', 'form'],
    recommendedCards: ['notation-editor', 'chord-progression', 'orchestrator'],
  },
  'sound-design': {
    id: 'sound-design',
    name: 'Sound Design',
    description: 'Create unique sounds and textures',
    emoji: '🔊',
    recommendedTutorials: ['synthesis', 'sampling', 'effects'],
    recommendedCards: ['wavetable-synth', 'sampler', 'granular'],
  },
  'perform': {
    id: 'perform',
    name: 'Live Performance',
    description: 'Perform music in real-time',
    emoji: '🎤',
    recommendedTutorials: ['session-view', 'controller-mapping', 'effects'],
    recommendedCards: ['session-launcher', 'effect-rack', 'looper'],
  },
};

// ============================================================================
// NAME/AVATAR SETUP
// ============================================================================

/**
 * Avatar preset option.
 */
export interface AvatarOption {
  readonly id: string;
  readonly emoji: string;
  readonly name: string;
  readonly category: 'music' | 'animal' | 'space' | 'abstract';
}

/**
 * Avatar presets.
 */
export const AVATAR_PRESETS: readonly AvatarOption[] = [
  // Music category
  { id: 'music-note', emoji: '🎵', name: 'Music Note', category: 'music' },
  { id: 'headphones', emoji: '🎧', name: 'Headphones', category: 'music' },
  { id: 'microphone', emoji: '🎤', name: 'Microphone', category: 'music' },
  { id: 'guitar', emoji: '🎸', name: 'Guitar', category: 'music' },
  { id: 'piano', emoji: '🎹', name: 'Piano', category: 'music' },
  { id: 'drum', emoji: '🥁', name: 'Drum', category: 'music' },
  { id: 'saxophone', emoji: '🎷', name: 'Saxophone', category: 'music' },
  { id: 'trumpet', emoji: '🎺', name: 'Trumpet', category: 'music' },
  // Animal category
  { id: 'cat', emoji: '🐱', name: 'Cat', category: 'animal' },
  { id: 'dog', emoji: '🐶', name: 'Dog', category: 'animal' },
  { id: 'panda', emoji: '🐼', name: 'Panda', category: 'animal' },
  { id: 'koala', emoji: '🐨', name: 'Koala', category: 'animal' },
  { id: 'fox', emoji: '🦊', name: 'Fox', category: 'animal' },
  { id: 'owl', emoji: '🦉', name: 'Owl', category: 'animal' },
  // Space category
  { id: 'star', emoji: '⭐', name: 'Star', category: 'space' },
  { id: 'moon', emoji: '🌙', name: 'Moon', category: 'space' },
  { id: 'planet', emoji: '🪐', name: 'Planet', category: 'space' },
  { id: 'comet', emoji: '☄️', name: 'Comet', category: 'space' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', category: 'space' },
  // Abstract category
  { id: 'sparkles', emoji: '✨', name: 'Sparkles', category: 'abstract' },
  { id: 'fire', emoji: '🔥', name: 'Fire', category: 'abstract' },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', category: 'abstract' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', category: 'abstract' },
  { id: 'gem', emoji: '💎', name: 'Gem', category: 'abstract' },
];

// ============================================================================
// PERSONALIZED DASHBOARD
// ============================================================================

/**
 * Personalized dashboard configuration.
 */
export interface PersonalizedDashboard {
  /** Welcome message */
  readonly welcomeMessage: string;
  /** Recommended templates */
  readonly recommendedTemplates: readonly string[];
  /** Suggested first actions */
  readonly firstActions: readonly DashboardAction[];
  /** Quick-win tutorial */
  readonly quickWinTutorial: string;
  /** Featured cards */
  readonly featuredCards: readonly string[];
  /** Layout preset */
  readonly layoutPreset: string;
}

/**
 * Dashboard action suggestion.
 */
export interface DashboardAction {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly emoji: string;
  readonly actionType: 'tutorial' | 'template' | 'card' | 'demo';
  readonly targetId: string;
  readonly estimatedMinutes: number;
}

/**
 * Generate personalized dashboard from onboarding state.
 */
export function generatePersonalizedDashboard(state: OnboardingState): PersonalizedDashboard {
  const userName = state.userName || 'there';
  const skillLevel = state.skillLevel || 'beginner';
  const primaryGenre = state.genres[0] || 'electronic';
  const primaryGoal = state.goals[0] || 'produce';
  const primaryInstrument = state.instruments[0] || 'synth';

  // Generate welcome message
  const welcomeMessage = `Welcome${userName !== 'there' ? `, ${userName}` : ''}! Let's create some ${primaryGenre} music together.`;

  // Recommend templates based on preferences
  const recommendedTemplates = [
    `${primaryGenre}-starter`,
    `${primaryGoal}-${primaryGenre}`,
    `${primaryInstrument}-demo`,
  ];

  // Suggest first actions based on goals
  const firstActions: DashboardAction[] = [];

  if (skillLevel === 'beginner') {
    firstActions.push({
      id: 'make-first-beat',
      title: 'Make Your First Beat',
      description: '5-minute guided tutorial to create a simple rhythm',
      emoji: '🥁',
      actionType: 'tutorial',
      targetId: 'tutorial-first-beat',
      estimatedMinutes: 5,
    });
  }

  firstActions.push({
    id: `try-${primaryInstrument}`,
    title: `Try ${INSTRUMENT_OPTIONS[primaryInstrument].name}`,
    description: `Explore ${INSTRUMENT_OPTIONS[primaryInstrument].description}`,
    emoji: INSTRUMENT_OPTIONS[primaryInstrument].emoji,
    actionType: 'card',
    targetId: INSTRUMENT_OPTIONS[primaryInstrument].defaultCards[0] || 'synth-lead',
    estimatedMinutes: 10,
  });

  firstActions.push({
    id: 'explore-sounds',
    title: 'Explore Sounds',
    description: 'Browse presets and samples',
    emoji: '🔊',
    actionType: 'demo',
    targetId: 'sound-browser',
    estimatedMinutes: 15,
  });

  // Quick-win tutorial based on goal
  const quickWinTutorial = primaryGoal === 'learn' 
    ? 'theory-basics'
    : primaryGoal === 'jam'
    ? 'live-loop'
    : primaryGoal === 'compose'
    ? 'simple-melody'
    : 'first-loop';

  // Featured cards based on instruments and goals
  const featuredCards = [
    ...state.instruments.flatMap(inst => INSTRUMENT_OPTIONS[inst].defaultCards),
    ...state.goals.flatMap(goal => GOAL_OPTIONS[goal].recommendedCards),
  ].slice(0, 8);

  // Layout preset based on DAW background
  const layoutPreset = state.dawBackground 
    ? DAW_BACKGROUND_OPTIONS[state.dawBackground].layoutPreset
    : 'simplified';

  return {
    welcomeMessage,
    recommendedTemplates,
    firstActions,
    quickWinTutorial,
    featuredCards,
    layoutPreset,
  };
}

// ============================================================================
// ONBOARDING FLOW CONTROL
// ============================================================================

/**
 * Get next step in onboarding flow.
 */
export function getNextOnboardingStep(current: OnboardingStep): OnboardingStep {
  const sequence: OnboardingStep[] = [
    'welcome',
    'genre-preference',
    'skill-level',
    'daw-background',
    'instrument-preference',
    'goal-selection',
    'name-avatar',
    'account-creation',
    'audio-setup',
    'midi-setup',
    'complete',
  ];
  
  const currentIndex = sequence.indexOf(current);
  const nextStep = sequence[currentIndex + 1];
  return nextStep !== undefined && currentIndex < sequence.length - 1 ? nextStep : 'complete';
}

/**
 * Get previous step in onboarding flow.
 */
export function getPreviousOnboardingStep(current: OnboardingStep): OnboardingStep | null {
  const sequence: OnboardingStep[] = [
    'welcome',
    'genre-preference',
    'skill-level',
    'daw-background',
    'instrument-preference',
    'goal-selection',
    'name-avatar',
    'account-creation',
    'audio-setup',
    'midi-setup',
    'complete',
  ];
  
  const currentIndex = sequence.indexOf(current);
  const prevStep = sequence[currentIndex - 1];
  return currentIndex > 0 && prevStep !== undefined ? prevStep : null;
}

/**
 * Check if onboarding can proceed to next step.
 */
export function canProceedToNextStep(state: OnboardingState): boolean {
  switch (state.currentStep) {
    case 'welcome':
      return true;
    case 'genre-preference':
      return state.genres.length > 0;
    case 'skill-level':
      return state.skillLevel !== null;
    case 'daw-background':
      return state.dawBackground !== null;
    case 'instrument-preference':
      return state.instruments.length > 0;
    case 'goal-selection':
      return state.goals.length > 0;
    case 'name-avatar':
      return state.userName !== null;
    case 'account-creation':
      return true; // Optional step
    case 'audio-setup':
      return true; // Can skip
    case 'midi-setup':
      return true; // Can skip
    case 'complete':
      return false;
    default:
      return false;
  }
}

/**
 * Complete onboarding and return generated persona.
 */
export function completeOnboarding(state: OnboardingState): UserPersona {
  const skillLevel = state.skillLevel || 'beginner';
  const background = state.dawBackground || 'none';
  const interests = state.genres.map(g => g as UserInterest);
  
  // Map goals to interests
  const goalInterests: Record<UserGoal, UserInterest> = {
    'produce': 'electronic',
    'learn': 'education',
    'jam': 'electronic',
    'compose': 'songwriting',
    'sound-design': 'sound-design',
    'perform': 'dj',
  };
  
  state.goals.forEach(goal => {
    const interest = goalInterests[goal];
    if (interest && !interests.includes(interest)) {
      interests.push(interest);
    }
  });

  const layoutPreset = DAW_BACKGROUND_OPTIONS[background].layoutPreset;
  
  return {
    id: `custom-${Date.now()}`,
    name: state.userName || 'Custom User',
    description: `Personalized profile for ${state.userName || 'user'}`,
    experienceLevel: skillLevel,
    background,
    primaryInterests: interests,
    preferredLayout: layoutPreset,
    enabledFeatures: SKILL_LEVEL_OPTIONS[skillLevel].features,
    disabledFeatures: [],
    defaultView: skillLevel === 'beginner' ? 'simplified' : skillLevel === 'expert' ? 'advanced' : 'standard',
    tutorialSequence: state.goals.flatMap(goal => GOAL_OPTIONS[goal].recommendedTutorials),
    helpTopics: state.instruments.map(inst => inst),
    shortcuts: skillLevel === 'beginner' ? [] : ['space', 'enter', 'delete', 'ctrl-z', 'ctrl-s'],
  };
}

/**
 * Save onboarding state to local storage.
 */
export function saveOnboardingState(state: OnboardingState): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cardplay-onboarding', JSON.stringify(state));
  }
}

/**
 * Load onboarding state from local storage.
 */
export function loadOnboardingState(): OnboardingState | null {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('cardplay-onboarding');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if user has completed onboarding.
 */
export function hasCompletedOnboarding(): boolean {
  const state = loadOnboardingState();
  return state !== null && state.completedAt !== null;
}

// ============================================================================
// CONNECT CONTROLLER SETUP (Step 4)
// ============================================================================

/**
 * MIDI controller connection state.
 */
export interface ControllerConnection {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;
  readonly connected: boolean;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly mappingPreset: string | null;
}

/**
 * Controller setup wizard state.
 */
export interface ControllerSetupState {
  readonly step: 'detect' | 'configure' | 'test' | 'complete';
  readonly availableControllers: readonly ControllerConnection[];
  readonly selectedController: string | null;
  readonly testingComplete: boolean;
}

/**
 * Detect available MIDI controllers.
 */
export async function detectMIDIControllers(): Promise<ControllerConnection[]> {
  if (!navigator.requestMIDIAccess) {
    return [];
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    const controllers: ControllerConnection[] = [];

    midiAccess.inputs.forEach((input) => {
      controllers.push({
        id: input.id || `input-${controllers.length}`,
        name: input.name || 'Unknown Controller',
        manufacturer: input.manufacturer || 'Unknown',
        connected: input.state === 'connected',
        inputs: [input.name || 'input'],
        outputs: [],
        mappingPreset: null,
      });
    });

    return controllers;
  } catch (error) {
    console.error('Failed to detect MIDI controllers:', error);
    return [];
  }
}

/**
 * Popular controller presets.
 */
export const CONTROLLER_PRESETS: Record<string, { name: string; manufacturer: string; mapping: Record<string, number> }> = {
  'akai-mpk-mini': {
    name: 'Akai MPK Mini',
    manufacturer: 'Akai',
    mapping: {
      knob1: 1,
      knob2: 2,
      knob3: 3,
      knob4: 4,
      knob5: 5,
      knob6: 6,
      knob7: 7,
      knob8: 8,
    },
  },
  'novation-launchkey': {
    name: 'Novation Launchkey',
    manufacturer: 'Novation',
    mapping: {
      slider1: 41,
      slider2: 42,
      slider3: 43,
      slider4: 44,
      slider5: 45,
      slider6: 46,
      slider7: 47,
      slider8: 48,
    },
  },
  'generic': {
    name: 'Generic MIDI Controller',
    manufacturer: 'Generic',
    mapping: {
      cc1: 1,
      cc2: 2,
      cc3: 3,
      cc4: 4,
    },
  },
};

// ============================================================================
// AUDIO SETTINGS WIZARD (Step 5)
// ============================================================================

/**
 * Audio device information.
 */
export interface AudioDevice {
  readonly deviceId: string;
  readonly label: string;
  readonly kind: 'audioinput' | 'audiooutput';
  readonly groupId: string;
}

/**
 * Audio settings configuration.
 */
export interface AudioSettings {
  readonly outputDevice: string | null;
  readonly inputDevice: string | null;
  readonly sampleRate: number;
  readonly bufferSize: number;
  readonly latency: 'balanced' | 'interactive' | 'playback';
}

/**
 * Default audio settings.
 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  outputDevice: null,
  inputDevice: null,
  sampleRate: 48000,
  bufferSize: 128,
  latency: 'interactive',
};

/**
 * Enumerate audio devices.
 */
export async function enumerateAudioDevices(): Promise<AudioDevice[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(d => d.kind === 'audioinput' || d.kind === 'audiooutput')
      .map(d => ({
        deviceId: d.deviceId,
        label: d.label || `${d.kind} (${d.deviceId.slice(0, 8)})`,
        kind: d.kind as 'audioinput' | 'audiooutput',
        groupId: d.groupId,
      }));
  } catch (error) {
    console.error('Failed to enumerate audio devices:', error);
    return [];
  }
}

/**
 * Test audio output with a test tone.
 */
export function testAudioOutput(audioContext: AudioContext, duration: number = 0.5): void {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 440; // A4
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// ============================================================================
// PERMISSION REQUESTS (Step 6)
// ============================================================================

/**
 * Permission types that CardPlay may need.
 */
export type Permission = 'microphone' | 'midi' | 'notifications' | 'persistent-storage';

/**
 * Permission status.
 */
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'not-applicable';

/**
 * Permission info.
 */
export interface PermissionInfo {
  readonly type: Permission;
  readonly status: PermissionStatus;
  readonly required: boolean;
  readonly description: string;
  readonly benefit: string;
}

/**
 * Request microphone permission.
 */
export async function requestMicrophonePermission(): Promise<PermissionStatus> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'not-applicable';
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (error) {
    return 'denied';
  }
}

/**
 * Request MIDI permission.
 */
export async function requestMIDIPermission(): Promise<PermissionStatus> {
  if (!navigator.requestMIDIAccess) {
    return 'not-applicable';
  }

  try {
    await navigator.requestMIDIAccess();
    return 'granted';
  } catch (error) {
    return 'denied';
  }
}

/**
 * Request all permissions.
 */
export async function requestAllPermissions(): Promise<Record<Permission, PermissionStatus>> {
  const [micStatus, midiStatus] = await Promise.all([
    requestMicrophonePermission(),
    requestMIDIPermission(),
  ]);

  return {
    'microphone': micStatus,
    'midi': midiStatus,
    'notifications': 'not-applicable',
    'persistent-storage': 'not-applicable',
  };
}

/**
 * Permission descriptions.
 */
export const PERMISSION_INFO: Record<Permission, Omit<PermissionInfo, 'status'>> = {
  'microphone': {
    type: 'microphone',
    required: false,
    description: 'Access your microphone to record audio',
    benefit: 'Record vocals, instruments, or external audio sources directly into CardPlay',
  },
  'midi': {
    type: 'midi',
    required: false,
    description: 'Connect MIDI controllers and keyboards',
    benefit: 'Play instruments with your MIDI keyboard or controller for a more expressive workflow',
  },
  'notifications': {
    type: 'notifications',
    required: false,
    description: 'Show desktop notifications',
    benefit: 'Get notified when exports complete or when there are important updates',
  },
  'persistent-storage': {
    type: 'persistent-storage',
    required: false,
    description: 'Store projects and samples locally',
    benefit: 'Keep your work safe even if you clear browser data',
  },
};

// ============================================================================
// PROGRESS CELEBRATION (Step 7)
// ============================================================================

/**
 * Milestone achievement.
 */
export interface Milestone {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly emoji: string;
  readonly achievedAt: number;
  readonly category: 'getting-started' | 'creation' | 'learning' | 'mastery';
}

/**
 * Celebration animation type.
 */
export type CelebrationType = 'confetti' | 'fireworks' | 'sparkles' | 'subtle';

/**
 * Celebration configuration.
 */
export interface CelebrationConfig {
  readonly type: CelebrationType;
  readonly duration: number;
  readonly message: string;
  readonly emoji: string;
  readonly sound: boolean;
}

/**
 * First-time achievements for celebration.
 */
export const FIRST_TIME_MILESTONES: Record<string, Omit<Milestone, 'achievedAt'>> = {
  'first-card-added': {
    id: 'first-card-added',
    title: 'First Card Added!',
    description: 'You added your first card to the deck',
    emoji: '🎴',
    category: 'getting-started',
  },
  'first-sound-made': {
    id: 'first-sound-made',
    title: 'First Sound!',
    description: 'You pressed play and heard your creation',
    emoji: '🔊',
    category: 'getting-started',
  },
  'first-connection': {
    id: 'first-connection',
    title: 'Cards Connected!',
    description: 'You connected two cards together',
    emoji: '🔗',
    category: 'getting-started',
  },
  'first-beat-created': {
    id: 'first-beat-created',
    title: 'Beat Maker!',
    description: 'You created your first complete beat',
    emoji: '🥁',
    category: 'creation',
  },
  'first-melody': {
    id: 'first-melody',
    title: 'Melody Writer!',
    description: 'You created your first melody',
    emoji: '🎵',
    category: 'creation',
  },
  'first-save': {
    id: 'first-save',
    title: 'Project Saved!',
    description: 'You saved your first project',
    emoji: '💾',
    category: 'getting-started',
  },
  'tutorial-complete': {
    id: 'tutorial-complete',
    title: 'Tutorial Graduate!',
    description: 'You completed your first tutorial',
    emoji: '🎓',
    category: 'learning',
  },
  'five-projects': {
    id: 'five-projects',
    title: 'Creator!',
    description: 'You\'ve created 5 projects',
    emoji: '⭐',
    category: 'creation',
  },
};

/**
 * Create celebration for milestone.
 */
export function createCelebration(milestoneId: string): CelebrationConfig {
  const milestone = FIRST_TIME_MILESTONES[milestoneId];
  if (!milestone) {
    return {
      type: 'subtle',
      duration: 1000,
      message: 'Nice work!',
      emoji: '✨',
      sound: false,
    };
  }

  const isMajor = milestone.category === 'mastery' || milestoneId === 'first-beat-created';
  
  return {
    type: isMajor ? 'confetti' : milestone.category === 'getting-started' ? 'sparkles' : 'subtle',
    duration: isMajor ? 3000 : 1500,
    message: milestone.title,
    emoji: milestone.emoji,
    sound: isMajor,
  };
}

// ============================================================================
// SHARE FIRST CREATION (Step 8)
// ============================================================================

/**
 * Share destination.
 */
export type ShareDestination = 'link' | 'twitter' | 'facebook' | 'reddit' | 'download';

/**
 * Share options.
 */
export interface ShareOptions {
  readonly destination: ShareDestination;
  readonly includeAudio: boolean;
  readonly includeVisualization: boolean;
  readonly privacy: 'public' | 'unlisted' | 'private';
}

/**
 * Share result.
 */
export interface ShareResult {
  readonly success: boolean;
  readonly url?: string;
  readonly error?: string;
}

/**
 * Generate shareable link for project.
 */
export async function generateShareLink(projectId: string, _options: ShareOptions): Promise<ShareResult> {
  // This would integrate with a backend service
  // For now, return a mock result
  const mockUrl = `https://cardplay.app/share/${projectId}`;
  
  return {
    success: true,
    url: mockUrl,
  };
}

/**
 * Share to social media.
 */
export async function shareToSocial(
  destination: 'twitter' | 'facebook' | 'reddit',
  projectUrl: string,
  projectName: string
): Promise<void> {
  const message = `Check out my first beat made in CardPlay! 🎵 ${projectName}`;
  
  const shareUrls: Record<typeof destination, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(projectUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(projectUrl)}&title=${encodeURIComponent(projectName)}`,
  };

  window.open(shareUrls[destination], '_blank', 'width=600,height=400');
}

/**
 * Default share message templates.
 */
export const SHARE_TEMPLATES: Record<string, string> = {
  'first-beat': 'Just made my first beat in @CardPlayApp! 🎵 #MusicProduction #BeatMaking',
  'first-melody': 'Created my first melody with @CardPlayApp! 🎹 #Music #Composition',
  'first-project': 'Check out my first CardPlay project! 🎵 #CardPlay #MusicMaking',
  'learning': 'Learning music production with @CardPlayApp - it\'s so intuitive! 🎓 #LearnMusic',
};
