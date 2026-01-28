/**
 * @fileoverview Beginner UI Bridge - Phase 4 → Phase 43 Integration.
 * 
 * This module bridges Phase 4 beginner-friendly UI components (welcome screen,
 * tutorials, tooltips, help panels, etc.) with the Phase 43 CardPlay UI system
 * to create a cohesive onboarding and guidance experience.
 * 
 * Key integrations:
 * - Phase 4 WelcomeScreen → Phase 43 deck initialization
 * - Phase 4 TutorialSystem → Phase 43 card interactions
 * - Phase 4 TooltipTour → Phase 43 component highlights
 * - Phase 4 HelpPanel → Phase 43 reveal panels
 * - Progressive disclosure for user personas
 * 
 * @see cardplayui.md Section 1: Design Philosophy (Progressive Disclosure)
 * @see cardplayui.md Section 8: User Personas
 * @see currentsteps.md Phase 4.6: Beginner-Friendly UI
 */

import type {
  TutorialStep,
  HelpArticle,
} from './beginner';

// ============================================================================
// USER PERSONAS (from cardplayui.md Section 8)
// ============================================================================

/**
 * User persona experience levels.
 */
export type ExperienceLevel = 
  | 'beginner'      // New to music production
  | 'intermediate'  // Some DAW experience
  | 'advanced'      // Power user
  | 'expert';       // Developer/sound designer

/**
 * User persona background type.
 */
export type UserBackground =
  | 'none'          // No prior experience
  | 'renoise'       // Tracker background
  | 'ableton'       // Ableton Live background
  | 'cubase'        // Cubase/traditional DAW
  | 'dorico'        // Notation/scoring
  | 'fl-studio'     // FL Studio
  | 'logic'         // Logic Pro
  | 'bitwig'        // Bitwig Studio
  | 'reason'        // Reason
  | 'hardware'      // Hardware synths/sequencers
  | 'coding';       // Programming background

/**
 * User persona interests.
 */
export type UserInterest =
  | 'electronic'    // Electronic music production
  | 'orchestral'    // Orchestral/film scoring
  | 'band'          // Band recording/mixing
  | 'dj'            // DJing/live performance
  | 'sound-design'  // Sound design/synthesis
  | 'songwriting'   // Songwriting/composition
  | 'podcasting'    // Podcasting/voice work
  | 'generative'    // Generative/experimental
  | 'education'     // Teaching/learning
  | 'game-audio';   // Game audio

/**
 * Complete user persona definition.
 * Based on cardplayui.md Section 8.
 */
export interface UserPersona {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly experienceLevel: ExperienceLevel;
  readonly background: UserBackground;
  readonly primaryInterests: readonly UserInterest[];
  readonly preferredLayout: string;           // Layout preset ID
  readonly enabledFeatures: readonly string[]; // Feature flags
  readonly disabledFeatures: readonly string[];
  readonly defaultView: 'simplified' | 'standard' | 'advanced';
  readonly tutorialSequence: readonly string[]; // Tutorial IDs
  readonly helpTopics: readonly string[];       // Prioritized help topics
  readonly shortcuts: readonly string[];        // Recommended shortcuts to learn
}

/**
 * Predefined user personas from cardplayui.md Section 8.
 */
export const USER_PERSONAS: Record<string, UserPersona> = {
  // Complete beginner
  'first-timer': {
    id: 'first-timer',
    name: 'First Timer',
    description: 'New to music production, wants guided experience',
    experienceLevel: 'beginner',
    background: 'none',
    primaryInterests: ['songwriting', 'electronic'],
    preferredLayout: 'simplified-horizontal',
    enabledFeatures: ['tutorials', 'tooltips', 'guided-workflow', 'big-buttons'],
    disabledFeatures: ['advanced-routing', 'scripting', 'midi-learn'],
    defaultView: 'simplified',
    tutorialSequence: ['welcome', 'first-beat', 'add-melody', 'export-audio'],
    helpTopics: ['what-is-a-card', 'making-your-first-beat', 'playing-notes'],
    shortcuts: ['space', 'cmd-s', 'cmd-z'],
  },
  
  // Tracker user (Renoise background)
  'tracker-user': {
    id: 'tracker-user',
    name: 'Tracker User',
    description: 'Coming from Renoise or other trackers',
    experienceLevel: 'advanced',
    background: 'renoise',
    primaryInterests: ['electronic', 'sound-design'],
    preferredLayout: 'renoise-vertical',
    enabledFeatures: ['hex-display', 'pattern-editor', 'tracker-shortcuts', 'sample-editor'],
    disabledFeatures: [],
    defaultView: 'standard',
    tutorialSequence: ['tracker-migration', 'card-patterns', 'sample-workflow'],
    helpTopics: ['tracker-differences', 'pattern-vs-cards', 'effect-columns'],
    shortcuts: ['hex-entry', 'pattern-nav', 'sample-map'],
  },
  
  // Live performer (Ableton background)
  'live-performer': {
    id: 'live-performer',
    name: 'Live Performer',
    description: 'Coming from Ableton Live, focused on performance',
    experienceLevel: 'intermediate',
    background: 'ableton',
    primaryInterests: ['electronic', 'dj'],
    preferredLayout: 'ableton-session',
    enabledFeatures: ['session-view', 'clip-launcher', 'midi-mapping', 'tempo-sync'],
    disabledFeatures: [],
    defaultView: 'standard',
    tutorialSequence: ['ableton-migration', 'clip-to-card', 'live-setup'],
    helpTopics: ['session-vs-deck', 'clip-launching', 'midi-controllers'],
    shortcuts: ['launch-clip', 'arm-record', 'tempo-tap'],
  },
  
  // Traditional DAW user (Cubase/Logic)
  'arranger': {
    id: 'arranger',
    name: 'Arranger',
    description: 'Traditional DAW user focused on arrangement',
    experienceLevel: 'intermediate',
    background: 'cubase',
    primaryInterests: ['band', 'orchestral', 'songwriting'],
    preferredLayout: 'cubase-arrange',
    enabledFeatures: ['timeline-view', 'track-lanes', 'automation', 'mixer'],
    disabledFeatures: [],
    defaultView: 'standard',
    tutorialSequence: ['cubase-migration', 'cards-as-tracks', 'arrangement-workflow'],
    helpTopics: ['timeline-arrangement', 'track-routing', 'automation-lanes'],
    shortcuts: ['split', 'glue', 'quantize', 'bounce'],
  },
  
  // Composer (Dorico/notation background)
  'composer': {
    id: 'composer',
    name: 'Composer',
    description: 'Coming from notation software like Dorico',
    experienceLevel: 'advanced',
    background: 'dorico',
    primaryInterests: ['orchestral', 'education', 'songwriting'],
    preferredLayout: 'dorico-score',
    enabledFeatures: ['notation-input', 'score-view', 'expression-maps', 'articulations'],
    disabledFeatures: [],
    defaultView: 'standard',
    tutorialSequence: ['notation-migration', 'midi-to-score', 'expression-setup'],
    helpTopics: ['note-input-methods', 'articulation-keyswitches', 'score-playback'],
    shortcuts: ['note-entry', 'dynamics', 'articulations'],
  },
  
  // Sound designer
  'sound-designer': {
    id: 'sound-designer',
    name: 'Sound Designer',
    description: 'Focused on synthesis and sound creation',
    experienceLevel: 'advanced',
    background: 'hardware',
    primaryInterests: ['sound-design', 'generative', 'electronic'],
    preferredLayout: 'modular-freeform',
    enabledFeatures: ['modular-view', 'cv-routing', 'oscilloscope', 'parameter-lock'],
    disabledFeatures: [],
    defaultView: 'advanced',
    tutorialSequence: ['synth-cards', 'modulation-routing', 'preset-design'],
    helpTopics: ['synthesis-basics', 'modulation-matrix', 'wavetables'],
    shortcuts: ['mod-matrix', 'parameter-lock', 'preset-save'],
  },
  
  // Developer/coder
  'developer': {
    id: 'developer',
    name: 'Developer',
    description: 'Programmer wanting to extend the system',
    experienceLevel: 'expert',
    background: 'coding',
    primaryInterests: ['generative', 'sound-design', 'game-audio'],
    preferredLayout: 'developer-split',
    enabledFeatures: ['scripting', 'api-access', 'debug-view', 'custom-cards'],
    disabledFeatures: [],
    defaultView: 'advanced',
    tutorialSequence: ['api-overview', 'custom-card-creation', 'scripting-basics'],
    helpTopics: ['card-api', 'event-system', 'custom-processors'],
    shortcuts: ['console', 'reload', 'inspect'],
  },
  
  // Game audio designer
  'game-audio': {
    id: 'game-audio',
    name: 'Game Audio Designer',
    description: 'Creating interactive audio for games',
    experienceLevel: 'advanced',
    background: 'coding',
    primaryInterests: ['game-audio', 'sound-design', 'generative'],
    preferredLayout: 'adaptive-audio',
    enabledFeatures: ['state-machines', 'parameter-binding', 'randomization', 'export-banks'],
    disabledFeatures: [],
    defaultView: 'standard',
    tutorialSequence: ['game-audio-intro', 'adaptive-music', 'sound-banks'],
    helpTopics: ['adaptive-systems', 'parameter-layers', 'export-formats'],
    shortcuts: ['state-trigger', 'parameter-bind', 'preview-state'],
  },
};

// ============================================================================
// PROGRESSIVE DISCLOSURE SYSTEM
// ============================================================================

/**
 * Feature visibility level.
 */
export type FeatureVisibility = 'hidden' | 'disabled' | 'visible' | 'highlighted';

/**
 * Progressive disclosure configuration.
 */
export interface ProgressiveDisclosureConfig {
  readonly experienceLevel: ExperienceLevel;
  readonly featureOverrides: Record<string, FeatureVisibility>;
  readonly showAdvancedToggle: boolean;
  readonly autoRevealOnUse: boolean;
  readonly revealAnimationDuration: number;
}

/**
 * Feature definition for progressive disclosure.
 */
export interface FeatureDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly minLevel: ExperienceLevel;
  readonly category: string;
  readonly dependencies: readonly string[];
  readonly tutorialId: string | null;
}

/**
 * Built-in feature definitions.
 */
export const FEATURES: Record<string, FeatureDefinition> = {
  // Basic features (beginner)
  'play-stop': {
    id: 'play-stop',
    name: 'Play/Stop',
    description: 'Start and stop playback',
    minLevel: 'beginner',
    category: 'transport',
    dependencies: [],
    tutorialId: 'transport-basics',
  },
  'add-card': {
    id: 'add-card',
    name: 'Add Card',
    description: 'Add a new card to the deck',
    minLevel: 'beginner',
    category: 'cards',
    dependencies: [],
    tutorialId: 'adding-cards',
  },
  'card-presets': {
    id: 'card-presets',
    name: 'Card Presets',
    description: 'Load and save card presets',
    minLevel: 'beginner',
    category: 'cards',
    dependencies: ['add-card'],
    tutorialId: 'using-presets',
  },
  'basic-connections': {
    id: 'basic-connections',
    name: 'Basic Connections',
    description: 'Connect cards together',
    minLevel: 'beginner',
    category: 'routing',
    dependencies: ['add-card'],
    tutorialId: 'connecting-cards',
  },
  
  // Intermediate features
  'automation': {
    id: 'automation',
    name: 'Automation',
    description: 'Record and edit parameter automation',
    minLevel: 'intermediate',
    category: 'editing',
    dependencies: ['basic-connections'],
    tutorialId: 'automation-intro',
  },
  'midi-learn': {
    id: 'midi-learn',
    name: 'MIDI Learn',
    description: 'Map MIDI controllers to parameters',
    minLevel: 'intermediate',
    category: 'midi',
    dependencies: [],
    tutorialId: 'midi-mapping',
  },
  'stacks': {
    id: 'stacks',
    name: 'Stack Management',
    description: 'Organize cards into stacks',
    minLevel: 'intermediate',
    category: 'layout',
    dependencies: ['add-card'],
    tutorialId: 'using-stacks',
  },
  'reveal-panels': {
    id: 'reveal-panels',
    name: 'Reveal Panels',
    description: 'Open detailed card editors',
    minLevel: 'intermediate',
    category: 'ui',
    dependencies: ['add-card'],
    tutorialId: 'reveal-panels',
  },
  
  // Advanced features
  'advanced-routing': {
    id: 'advanced-routing',
    name: 'Advanced Routing',
    description: 'Sidechain, parallel, and complex routing',
    minLevel: 'advanced',
    category: 'routing',
    dependencies: ['basic-connections', 'stacks'],
    tutorialId: 'advanced-routing',
  },
  'modulation-matrix': {
    id: 'modulation-matrix',
    name: 'Modulation Matrix',
    description: 'Create complex modulation routings',
    minLevel: 'advanced',
    category: 'modulation',
    dependencies: ['automation'],
    tutorialId: 'mod-matrix',
  },
  'custom-layouts': {
    id: 'custom-layouts',
    name: 'Custom Layouts',
    description: 'Create and save custom deck layouts',
    minLevel: 'advanced',
    category: 'layout',
    dependencies: ['stacks'],
    tutorialId: 'custom-layouts',
  },
  
  // Expert features
  'scripting': {
    id: 'scripting',
    name: 'Scripting',
    description: 'Write custom card behaviors in code',
    minLevel: 'expert',
    category: 'development',
    dependencies: [],
    tutorialId: 'scripting-intro',
  },
  'custom-cards': {
    id: 'custom-cards',
    name: 'Custom Cards',
    description: 'Create custom card types',
    minLevel: 'expert',
    category: 'development',
    dependencies: ['scripting'],
    tutorialId: 'custom-cards',
  },
  'api-access': {
    id: 'api-access',
    name: 'API Access',
    description: 'Direct access to the CardPlay API',
    minLevel: 'expert',
    category: 'development',
    dependencies: ['scripting'],
    tutorialId: 'api-reference',
  },
};

/**
 * Experience level order for comparison.
 */
const EXPERIENCE_ORDER: Record<ExperienceLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

/**
 * Check if a feature is visible for a given experience level.
 */
export function isFeatureVisible(
  featureId: string,
  level: ExperienceLevel,
  overrides: Record<string, FeatureVisibility> = {}
): FeatureVisibility {
  // Check overrides first
  const override = overrides[featureId];
  if (override !== undefined) {
    return override;
  }
  
  // Check feature definition
  const feature = FEATURES[featureId];
  if (!feature) {
    return 'hidden';
  }
  
  // Compare experience levels
  const userLevel = EXPERIENCE_ORDER[level];
  const featureLevel = EXPERIENCE_ORDER[feature.minLevel];
  
  if (userLevel >= featureLevel) {
    return 'visible';
  } else if (userLevel === featureLevel - 1) {
    return 'disabled'; // Show as locked/coming soon
  } else {
    return 'hidden';
  }
}

/**
 * Get all visible features for an experience level.
 */
export function getVisibleFeatures(
  level: ExperienceLevel,
  overrides: Record<string, FeatureVisibility> = {}
): readonly FeatureDefinition[] {
  return Object.values(FEATURES).filter(feature => {
    const visibility = isFeatureVisible(feature.id, level, overrides);
    return visibility === 'visible' || visibility === 'highlighted';
  });
}

/**
 * Get features that would be unlocked at the next level.
 */
export function getNextLevelFeatures(level: ExperienceLevel): readonly FeatureDefinition[] {
  const nextLevel = getNextLevel(level);
  if (!nextLevel) return [];
  
  return Object.values(FEATURES).filter(feature => feature.minLevel === nextLevel);
}

/**
 * Get the next experience level.
 */
function getNextLevel(level: ExperienceLevel): ExperienceLevel | null {
  const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const currentIndex = levels.indexOf(level);
  if (currentIndex < levels.length - 1) {
    const nextLevel = levels[currentIndex + 1];
    return nextLevel !== undefined ? nextLevel : null;
  }
  return null;
}

// ============================================================================
// CARDPLAY-SPECIFIC TUTORIALS
// ============================================================================

/**
 * CardPlay tutorial targeting for Phase 43 components.
 */
export interface CardPlayTutorialTarget {
  readonly type: 'card' | 'stack' | 'connection' | 'reveal-panel' | 'toolbar' | 'menu' | 'global';
  readonly cardId?: string;
  readonly stackId?: string;
  readonly connectionId?: string;
  readonly elementSelector?: string;
  readonly position?: { x: number; y: number };
}

/**
 * Extended tutorial step for CardPlay integration.
 */
export interface CardPlayTutorialStep extends TutorialStep {
  // Phase 43 specific targeting
  readonly cardPlayTarget: CardPlayTutorialTarget;
  
  // Card interaction requirements
  readonly requiredCardTypes?: readonly string[];
  readonly requiredConnections?: readonly string[];
  
  // State validation
  readonly validateState?: (state: unknown) => boolean;
  
  // Actions to perform automatically
  readonly autoActions?: readonly CardPlayAutoAction[];
}

/**
 * Automatic action to perform during tutorial.
 */
export interface CardPlayAutoAction {
  readonly type: 'add-card' | 'select-card' | 'open-reveal' | 'connect' | 'play' | 'stop' | 'highlight' | 'scroll';
  readonly params: Record<string, unknown>;
  readonly delay: number;
}

/**
 * CardPlay-specific tutorials.
 */
export const CARDPLAY_TUTORIALS: Record<string, readonly CardPlayTutorialStep[]> = {
  'welcome': [
    {
      id: 'welcome-1',
      type: 'modal',
      title: 'Welcome to CardPlay! 🎵',
      content: `
CardPlay is a new way to make music using **cards** - think of them as building blocks you can connect together.

Each card does something musical:
- **Generators** create sound (synths, drums, samples)
- **Effects** modify sound (reverb, delay, compression)
- **MIDI** cards process notes (arpeggiators, chords)

Let's create your first beat!
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
    {
      id: 'welcome-2',
      type: 'highlight',
      title: 'The Card Browser',
      content: 'Click here to browse available cards. Try searching for "drums" to find drum machines.',
      target: { type: 'selector', selector: '[data-component="card-browser"]' },
      highlightStyle: 'spotlight',
      position: 'right',
      waitForAction: 'card-browser-opened',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'toolbar', elementSelector: '[data-action="browse-cards"]' },
      autoActions: [
        { type: 'highlight', params: { selector: '[data-action="browse-cards"]' }, delay: 0 },
      ],
    },
    {
      id: 'welcome-3',
      type: 'action',
      title: 'Add a Drum Machine',
      content: 'Drag the **Drum Machine** card onto the deck, or double-click to add it.',
      target: { type: 'selector', selector: '[data-card-type="drum-machine"]' },
      highlightStyle: 'glow',
      position: 'bottom',
      waitForAction: 'card-added',
      mediaUrl: null,
      skippable: false,
      cardPlayTarget: { type: 'global' },
      requiredCardTypes: ['drum-machine'],
      autoAdvance: 0,
      validateState: (state: unknown) => {
        // Check if a drum machine card exists
        const s = state as { cards?: { type: string }[] };
        return s.cards?.some(c => c.type === 'drum-machine') ?? false;
      },
    },
  ],
  
  'first-beat': [
    {
      id: 'beat-1',
      type: 'highlight',
      title: 'Your Drum Machine',
      content: 'Great! You\'ve added a drum machine. Click on it to select it.',
      target: { type: 'selector', selector: '[data-card-type="drum-machine"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'card-selected',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'card' },
    },
    {
      id: 'beat-2',
      type: 'action',
      title: 'Open the Editor',
      content: 'Press **R** or double-click to reveal the drum machine\'s full editor.',
      target: { type: 'selector', selector: '[data-card-type="drum-machine"]' },
      highlightStyle: 'border',
      position: 'right',
      waitForAction: 'reveal-opened',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'card' },
    },
    {
      id: 'beat-3',
      type: 'tooltip',
      title: 'The Pattern Grid',
      content: 'Click squares in the grid to add drum hits. Try clicking on row 1 (kick) at steps 1, 5, 9, 13.',
      target: { type: 'selector', selector: '[data-component="pattern-grid"]' },
      highlightStyle: 'spotlight',
      position: 'bottom',
      waitForAction: 'pattern-edited',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'reveal-panel' },
    },
    {
      id: 'beat-4',
      type: 'action',
      title: 'Play Your Beat!',
      content: 'Press **Space** or click the play button to hear your beat.',
      target: { type: 'selector', selector: '[data-action="play"]' },
      highlightStyle: 'glow',
      position: 'top',
      waitForAction: 'transport-play',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'toolbar' },
    },
    {
      id: 'beat-5',
      type: 'celebration',
      title: '🎉 You Made a Beat!',
      content: 'Congratulations! You\'ve created your first beat. Keep adding to the pattern, or try adding more cards.',
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
  ],
  
  'connecting-cards': [
    {
      id: 'connect-1',
      type: 'modal',
      title: 'Connecting Cards',
      content: `
Cards connect to each other through **ports**:
- **Output ports** (right side) send audio or MIDI
- **Input ports** (left side) receive audio or MIDI

Drag from an output to an input to create a connection.
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
    {
      id: 'connect-2',
      type: 'highlight',
      title: 'Output Port',
      content: 'This is an output port. Drag from here to start a connection.',
      target: { type: 'selector', selector: '[data-port="output"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'connection-started',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'card' },
    },
    {
      id: 'connect-3',
      type: 'action',
      title: 'Make the Connection',
      content: 'Drop on an input port to complete the connection.',
      target: { type: 'selector', selector: '[data-port="input"]' },
      highlightStyle: 'glow',
      position: 'left',
      waitForAction: 'connection-completed',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'card' },
    },
  ],

  // Quick-win tutorial: Get immediate results in under 60 seconds
  'quick-win': [
    {
      id: 'quick-win-1',
      type: 'modal',
      title: '60-Second Beat! ⏱️',
      content: `
Let's make your first beat in just 60 seconds! We'll use a pre-made drum pattern so you can hear results immediately.

Ready? Let's go!
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: false,
      autoAdvance: 2000,
      cardPlayTarget: { type: 'global' },
    },
    {
      id: 'quick-win-2',
      type: 'action',
      title: 'Add a Drum Machine',
      content: 'Click here to add a pre-configured drum machine with a ready-to-play pattern.',
      target: { type: 'selector', selector: '[data-quick-action="add-drums"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'drum-machine-added',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'toolbar', elementSelector: '[data-quick-action="add-drums"]' },
      autoActions: [
        { type: 'add-card', params: { cardType: 'drum-machine', preset: '808-boom-bap' }, delay: 0 },
      ],
      requiredCardTypes: ['drum-machine'],
    },
    {
      id: 'quick-win-3',
      type: 'action',
      title: 'Press Play!',
      content: 'Click the play button to hear your beat. That\'s it - you\'ve made music! 🎉',
      target: { type: 'selector', selector: '[data-action="play"]' },
      highlightStyle: 'glow',
      position: 'bottom',
      waitForAction: 'playback-started',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'toolbar', elementSelector: '[data-action="play"]' },
    },
    {
      id: 'quick-win-4',
      type: 'modal',
      title: 'You Did It! 🎵',
      content: `
Congratulations! You just made your first beat in CardPlay.

**What just happened?**
- A drum machine card was added with a classic 808 pattern
- The card is already connected to the output
- Pressing play triggers the pattern

**Next Steps:**
- Try clicking on the drum machine to change the pattern
- Add more cards from the browser
- Experiment with different sounds

Ready to learn more?
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
  ],

  // Make your first beat: Detailed step-by-step beat creation
  'make-first-beat': [
    {
      id: 'first-beat-1',
      type: 'modal',
      title: 'Create Your First Beat 🥁',
      content: `
In this tutorial, you'll learn how to:
1. Add a drum machine card
2. Choose a drum kit
3. Program a simple pattern
4. Adjust the tempo
5. Press play and listen

Let's start making beats!
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
    {
      id: 'first-beat-2',
      type: 'highlight',
      title: 'Open Card Browser',
      content: 'First, let\'s add a drum machine. Click the card browser button in the toolbar.',
      target: { type: 'selector', selector: '[data-action="browse-cards"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'card-browser-opened',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'toolbar', elementSelector: '[data-action="browse-cards"]' },
    },
    {
      id: 'first-beat-3',
      type: 'action',
      title: 'Search for Drums',
      content: 'Type "drum" in the search box to find drum machines.',
      target: { type: 'selector', selector: '[data-component="card-search"]' },
      highlightStyle: 'glow',
      position: 'bottom',
      waitForAction: 'search-entered',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'menu', elementSelector: '[data-component="card-search"]' },
    },
    {
      id: 'first-beat-4',
      type: 'action',
      title: 'Add Drum Machine',
      content: 'Double-click the Drum Machine card to add it to your deck.',
      target: { type: 'selector', selector: '[data-card-type="drum-machine"]' },
      highlightStyle: 'glow',
      position: 'bottom',
      waitForAction: 'card-added',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
      requiredCardTypes: ['drum-machine'],
    },
    {
      id: 'first-beat-5',
      type: 'highlight',
      title: 'Your Drum Machine',
      content: 'Great! This is your drum machine. It already has a basic kick-snare pattern.',
      target: { type: 'selector', selector: '[data-card-type="drum-machine"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 3000,
      cardPlayTarget: { type: 'card' },
    },
    {
      id: 'first-beat-6',
      type: 'action',
      title: 'Open the Editor',
      content: 'Click the reveal button to open the drum machine editor.',
      target: { type: 'selector', selector: '[data-action="reveal-editor"]' },
      highlightStyle: 'glow',
      position: 'bottom',
      waitForAction: 'editor-opened',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'card', elementSelector: '[data-action="reveal-editor"]' },
    },
    {
      id: 'first-beat-7',
      type: 'highlight',
      title: 'The Pattern Editor',
      content: 'This is where you program your drum pattern. Each row is a different sound (kick, snare, hi-hat). Click squares to add or remove hits.',
      target: { type: 'selector', selector: '[data-component="pattern-grid"]' },
      highlightStyle: 'spotlight',
      position: 'right',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 5000,
      cardPlayTarget: { type: 'reveal-panel' },
    },
    {
      id: 'first-beat-8',
      type: 'action',
      title: 'Try Changing the Pattern',
      content: 'Click on a few squares in the hi-hat row to add more hi-hats to your beat.',
      target: { type: 'selector', selector: '[data-row="hihat"]' },
      highlightStyle: 'glow',
      position: 'bottom',
      waitForAction: 'pattern-modified',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'reveal-panel' },
    },
    {
      id: 'first-beat-9',
      type: 'highlight',
      title: 'Set the Tempo',
      content: 'Adjust the tempo to change how fast your beat plays. Try 120 BPM for a moderate speed.',
      target: { type: 'selector', selector: '[data-control="tempo"]' },
      highlightStyle: 'glow',
      position: 'left',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 3000,
      cardPlayTarget: { type: 'toolbar', elementSelector: '[data-control="tempo"]' },
    },
    {
      id: 'first-beat-10',
      type: 'action',
      title: 'Press Play!',
      content: 'Now let\'s hear it! Click the play button to start playback.',
      target: { type: 'selector', selector: '[data-action="play"]' },
      highlightStyle: 'glow',
      position: 'bottom',
      waitForAction: 'playback-started',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'toolbar', elementSelector: '[data-action="play"]' },
    },
    {
      id: 'first-beat-11',
      type: 'modal',
      title: 'You\'re a Beat Maker! 🎉',
      content: `
Awesome! You've created and customized your first beat.

**What you learned:**
- How to add cards from the browser
- How to open the card editor
- How to program a drum pattern
- How to adjust tempo and play

**Next Steps:**
- Try different drum kits in the preset browser
- Add more sounds like bass or melody
- Experiment with effects like reverb
- Save your project

Keep creating!
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
  ],

  // Explore sounds tour: Discover different card categories
  'explore-sounds': [
    {
      id: 'explore-1',
      type: 'modal',
      title: 'Explore the Sound Library 🔊',
      content: `
CardPlay comes with hundreds of sounds organized into categories. Let's take a tour!

We'll explore:
- **Drums** - Beats and percussion
- **Synths** - Electronic sounds
- **Samples** - Real instruments
- **Effects** - Sound processing

Ready to explore?
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
    {
      id: 'explore-2',
      type: 'highlight',
      title: 'Card Browser',
      content: 'This is your gateway to all available cards. Click to open it.',
      target: { type: 'selector', selector: '[data-action="browse-cards"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'card-browser-opened',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'toolbar', elementSelector: '[data-action="browse-cards"]' },
    },
    {
      id: 'explore-3',
      type: 'highlight',
      title: 'Categories',
      content: 'Cards are organized by category. Let\'s start with Drums.',
      target: { type: 'selector', selector: '[data-category="drums"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'category-selected',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'menu' },
    },
    {
      id: 'explore-4',
      type: 'highlight',
      title: 'Drum Cards',
      content: 'These are all the drum-related cards. You can hover over each one to hear a preview.',
      target: { type: 'selector', selector: '[data-category="drums"]' },
      highlightStyle: 'spotlight',
      position: 'right',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 5000,
      cardPlayTarget: { type: 'menu' },
    },
    {
      id: 'explore-5',
      type: 'highlight',
      title: 'Try Synths',
      content: 'Now let\'s check out synthesizers. These create electronic sounds.',
      target: { type: 'selector', selector: '[data-category="synths"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'category-selected',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'menu' },
    },
    {
      id: 'explore-6',
      type: 'highlight',
      title: 'Synth Variety',
      content: 'From bass synths to pads, leads to effects - synths can create almost any electronic sound. Try previewing a few!',
      target: { type: 'selector', selector: '[data-category="synths"]' },
      highlightStyle: 'spotlight',
      position: 'right',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 5000,
      cardPlayTarget: { type: 'menu' },
    },
    {
      id: 'explore-7',
      type: 'highlight',
      title: 'Samplers',
      content: 'Samplers play recordings of real instruments. Great for realistic sounds!',
      target: { type: 'selector', selector: '[data-category="samplers"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'category-selected',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'menu' },
    },
    {
      id: 'explore-8',
      type: 'highlight',
      title: 'Effects',
      content: 'Finally, effects process and transform sound. Reverb, delay, distortion, and more.',
      target: { type: 'selector', selector: '[data-category="effects"]' },
      highlightStyle: 'glow',
      position: 'right',
      waitForAction: 'category-selected',
      mediaUrl: null,
      skippable: false,
      autoAdvance: 0,
      cardPlayTarget: { type: 'menu' },
    },
    {
      id: 'explore-9',
      type: 'modal',
      title: 'Sound Library Explored! 🎵',
      content: `
Great job exploring! You now know where to find:

✅ **Drums** - Rhythm and percussion
✅ **Synths** - Electronic synthesis  
✅ **Samplers** - Real instrument recordings
✅ **Effects** - Sound processing

**Pro Tips:**
- Use the search box to quickly find specific sounds
- Star your favorite cards for quick access
- Try different presets within each card
- Combine multiple cards for unique sounds

Start building your own sound palette!
      `.trim(),
      target: { type: 'none' },
      highlightStyle: 'spotlight',
      position: 'center',
      waitForAction: null,
      mediaUrl: null,
      skippable: true,
      autoAdvance: 0,
      cardPlayTarget: { type: 'global' },
    },
  ],
};

// ============================================================================
// CONTEXTUAL HELP INTEGRATION
// ============================================================================

/**
 * Help topic with CardPlay-specific context.
 */
export interface CardPlayHelpTopic extends HelpArticle {
  readonly relatedCards: readonly string[];
  readonly relatedFeatures: readonly string[];
  readonly experienceLevel: ExperienceLevel;
  readonly videoUrl?: string;
  readonly exampleDeckId?: string;
}

/**
 * CardPlay help topics organized by category.
 */
export const CARDPLAY_HELP_TOPICS: Record<string, CardPlayHelpTopic> = {
  'what-is-a-card': {
    id: 'what-is-a-card',
    title: 'What is a Card?',
    content: `
# What is a Card?

A **card** is the fundamental building block in CardPlay. Think of cards like LEGO bricks for music - each one does something specific, and you connect them together to build complex musical systems.

## Types of Cards

### Generator Cards 🎵
Create sound from nothing:
- **Drum Machines**: Create beats with samples or synthesis
- **Synthesizers**: Generate tones using oscillators
- **Samplers**: Play back audio files

### Effect Cards 🎛️
Process and transform sound:
- **Reverb**: Add space and ambience
- **Delay**: Create echoes and rhythmic effects
- **Compressor**: Control dynamics

### MIDI Cards 🎹
Process musical notes:
- **Arpeggiator**: Turn chords into patterns
- **Chord Generator**: Create harmonies
- **Sequencer**: Program note sequences

## Card Anatomy

Every card has:
1. **Header**: Name and controls
2. **Ports**: Connection points
3. **Parameters**: Adjustable settings
4. **Mini-view**: Compact state indicator

## Next Steps

- [Adding Your First Card](#adding-cards)
- [Connecting Cards](#connecting-cards)
    `.trim(),
    category: 'basics',
    tags: ['card', 'basics', 'introduction', 'getting started'],
    relatedArticles: ['connecting-cards', 'using-stacks'],
    lastUpdated: Date.now(),
    relatedCards: [],
    relatedFeatures: ['add-card'],
    experienceLevel: 'beginner',
  },
  
  'connecting-cards': {
    id: 'connecting-cards',
    title: 'Connecting Cards',
    content: `
# Connecting Cards

Cards communicate through **connections** - visual cables that carry audio or MIDI data.

## Connection Types

| Type | Color | Description |
|------|-------|-------------|
| Audio | Green | Stereo audio signal |
| MIDI | Blue | Note and control data |
| Modulation | Orange | Parameter automation |

## Making Connections

1. Hover over a card to see its ports
2. Click and drag from an **output port** (right side)
3. Drop on a compatible **input port** (left side)

## Connection Rules

- Audio outputs connect to audio inputs
- MIDI outputs connect to MIDI inputs
- One output can connect to multiple inputs
- Feedback loops are prevented automatically
    `.trim(),
    category: 'basics',
    tags: ['connection', 'routing', 'audio', 'midi', 'cable'],
    relatedArticles: ['what-is-a-card', 'using-stacks'],
    lastUpdated: Date.now(),
    relatedCards: [],
    relatedFeatures: ['basic-connections'],
    experienceLevel: 'beginner',
  },
  
  'using-stacks': {
    id: 'using-stacks',
    title: 'Organizing with Stacks',
    content: `
# Organizing with Stacks

**Stacks** are containers that group related cards together. They help keep your deck organized as it grows.

## Stack Types

- **Instruments**: Sound-generating cards
- **Effects**: Processing cards
- **MIDI**: Note processing cards
- **Routing**: Mixer and bus cards

## Creating Stacks

1. Right-click on empty space
2. Select "New Stack"
3. Choose a stack type
4. Drag cards into the stack

## Stack Features

- **Collapse**: Hide cards to save space
- **Color**: Customize for visual organization
- **Lock**: Prevent accidental changes
- **Solo/Mute**: Affect all cards in stack
    `.trim(),
    category: 'intermediate',
    tags: ['stack', 'organize', 'group', 'layout'],
    relatedArticles: ['what-is-a-card', 'connecting-cards'],
    lastUpdated: Date.now(),
    relatedCards: [],
    relatedFeatures: ['stacks'],
    experienceLevel: 'intermediate',
  },
};

// ============================================================================
// ONBOARDING FLOW
// ============================================================================

/**
 * Onboarding step for new users.
 */
export interface OnboardingStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly isRequired: boolean;
  readonly estimatedMinutes: number;
  readonly tutorialId: string | null;
  readonly validateCompletion: (state: unknown) => boolean;
}

/**
 * Onboarding checklist for new users.
 */
export const ONBOARDING_CHECKLIST: readonly OnboardingStep[] = [
  {
    id: 'choose-persona',
    title: 'Tell us about yourself',
    description: 'Choose your experience level and background',
    isRequired: true,
    estimatedMinutes: 1,
    tutorialId: null,
    validateCompletion: (state: unknown) => {
      const s = state as { persona?: unknown };
      return s.persona !== undefined;
    },
  },
  {
    id: 'add-first-card',
    title: 'Add your first card',
    description: 'Drag a card from the browser onto the deck',
    isRequired: true,
    estimatedMinutes: 1,
    tutorialId: 'welcome',
    validateCompletion: (state: unknown) => {
      const s = state as { cards?: unknown[] };
      return (s.cards?.length ?? 0) > 0;
    },
  },
  {
    id: 'make-sound',
    title: 'Make some sound',
    description: 'Press play to hear your creation',
    isRequired: true,
    estimatedMinutes: 1,
    tutorialId: 'first-beat',
    validateCompletion: (state: unknown) => {
      const s = state as { hasPlayedAudio?: boolean };
      return s.hasPlayedAudio ?? false;
    },
  },
  {
    id: 'connect-cards',
    title: 'Connect two cards',
    description: 'Create a connection between cards',
    isRequired: false,
    estimatedMinutes: 2,
    tutorialId: 'connecting-cards',
    validateCompletion: (state: unknown) => {
      const s = state as { connections?: unknown[] };
      return (s.connections?.length ?? 0) > 0;
    },
  },
  {
    id: 'save-project',
    title: 'Save your work',
    description: 'Save your project for later',
    isRequired: false,
    estimatedMinutes: 1,
    tutorialId: null,
    validateCompletion: (state: unknown) => {
      const s = state as { hasSaved?: boolean };
      return s.hasSaved ?? false;
    },
  },
];

// ============================================================================
// TOOLTIP CONTENT FOR PHASE 43 COMPONENTS
// ============================================================================

/**
 * Contextual tooltip content for UI elements.
 */
export const COMPONENT_TOOLTIPS: Record<string, { title: string; content: string; shortcut?: string }> = {
  // Toolbar
  'play-button': {
    title: 'Play',
    content: 'Start playback',
    shortcut: 'Space',
  },
  'stop-button': {
    title: 'Stop',
    content: 'Stop playback and return to start',
    shortcut: 'Space (while playing)',
  },
  'record-button': {
    title: 'Record',
    content: 'Enable recording mode',
    shortcut: 'R',
  },
  'tempo-control': {
    title: 'Tempo',
    content: 'Set the project tempo in BPM. Drag to adjust, double-click to type.',
  },
  'card-browser': {
    title: 'Card Browser',
    content: 'Browse and add cards to your deck',
    shortcut: 'Cmd+Shift+B',
  },
  
  // Card components
  'card-header': {
    title: 'Card Header',
    content: 'Drag to move. Double-click to rename. Right-click for options.',
  },
  'card-port-input': {
    title: 'Input Port',
    content: 'Receives audio or MIDI. Drop a connection here.',
  },
  'card-port-output': {
    title: 'Output Port',
    content: 'Sends audio or MIDI. Drag from here to create a connection.',
  },
  'card-bypass': {
    title: 'Bypass',
    content: 'Temporarily disable this card',
    shortcut: 'B (when selected)',
  },
  'card-reveal': {
    title: 'Reveal Editor',
    content: 'Open the full card editor',
    shortcut: 'R (when selected)',
  },
  
  // Stack components
  'stack-header': {
    title: 'Stack Header',
    content: 'Click to collapse/expand. Drag to reorder stacks.',
  },
  'stack-add-card': {
    title: 'Add Card',
    content: 'Add a new card to this stack',
    shortcut: 'A (when stack focused)',
  },
  'stack-solo': {
    title: 'Solo',
    content: 'Only hear this stack',
    shortcut: 'S',
  },
  'stack-mute': {
    title: 'Mute',
    content: 'Silence this stack',
    shortcut: 'M',
  },
  
  // Connection
  'connection-line': {
    title: 'Connection',
    content: 'Click to select. Press Delete to remove. Drag the line to curve it.',
  },
  'connection-gain': {
    title: 'Connection Gain',
    content: 'Adjust the signal level passing through this connection',
  },
};

// ============================================================================
// UI STATE MANAGEMENT FOR BEGINNER FEATURES
// ============================================================================

/**
 * Beginner UI state.
 */
export interface BeginnerUIState {
  readonly persona: UserPersona | null;
  readonly experienceLevel: ExperienceLevel;
  readonly onboardingComplete: boolean;
  readonly completedSteps: readonly string[];
  readonly activeTutorialId: string | null;
  readonly activeTutorialStep: number;
  readonly tooltipsEnabled: boolean;
  readonly showWelcome: boolean;
  readonly simplifiedMode: boolean;
  readonly featureOverrides: Record<string, FeatureVisibility>;
}

/**
 * Create initial beginner UI state.
 */
export function createBeginnerUIState(): BeginnerUIState {
  return {
    persona: null,
    experienceLevel: 'beginner',
    onboardingComplete: false,
    completedSteps: [],
    activeTutorialId: null,
    activeTutorialStep: 0,
    tooltipsEnabled: true,
    showWelcome: true,
    simplifiedMode: true,
    featureOverrides: {},
  };
}

/**
 * Set user persona and configure UI accordingly.
 */
export function setUserPersona(
  state: BeginnerUIState,
  personaId: string
): BeginnerUIState {
  const persona = USER_PERSONAS[personaId];
  if (!persona) return state;
  
  return {
    ...state,
    persona,
    experienceLevel: persona.experienceLevel,
    simplifiedMode: persona.defaultView === 'simplified',
    featureOverrides: buildFeatureOverrides(persona),
  };
}

/**
 * Build feature overrides from persona settings.
 */
function buildFeatureOverrides(persona: UserPersona): Record<string, FeatureVisibility> {
  const overrides: Record<string, FeatureVisibility> = {};
  
  for (const feature of persona.enabledFeatures) {
    overrides[feature] = 'visible';
  }
  
  for (const feature of persona.disabledFeatures) {
    overrides[feature] = 'hidden';
  }
  
  return overrides;
}

/**
 * Complete an onboarding step.
 */
export function completeOnboardingStep(
  state: BeginnerUIState,
  stepId: string
): BeginnerUIState {
  if (state.completedSteps.includes(stepId)) {
    return state;
  }
  
  const newCompleted = [...state.completedSteps, stepId];
  const allRequired = ONBOARDING_CHECKLIST
    .filter(s => s.isRequired)
    .every(s => newCompleted.includes(s.id));
  
  return {
    ...state,
    completedSteps: newCompleted,
    onboardingComplete: allRequired,
  };
}

/**
 * Start a tutorial.
 */
export function startTutorial(
  state: BeginnerUIState,
  tutorialId: string
): BeginnerUIState {
  if (!(tutorialId in CARDPLAY_TUTORIALS)) {
    return state;
  }
  
  return {
    ...state,
    activeTutorialId: tutorialId,
    activeTutorialStep: 0,
  };
}

/**
 * Advance to next tutorial step.
 */
export function nextTutorialStep(state: BeginnerUIState): BeginnerUIState {
  if (!state.activeTutorialId) return state;
  
  const tutorial = CARDPLAY_TUTORIALS[state.activeTutorialId];
  if (!tutorial) return state;
  
  const nextStep = state.activeTutorialStep + 1;
  
  if (nextStep >= tutorial.length) {
    // Tutorial complete
    return {
      ...state,
      activeTutorialId: null,
      activeTutorialStep: 0,
    };
  }
  
  return {
    ...state,
    activeTutorialStep: nextStep,
  };
}

/**
 * Get current tutorial step.
 */
export function getCurrentTutorialStep(state: BeginnerUIState): CardPlayTutorialStep | null {
  if (!state.activeTutorialId) return null;
  
  const tutorial = CARDPLAY_TUTORIALS[state.activeTutorialId];
  if (!tutorial) return null;
  
  return tutorial[state.activeTutorialStep] ?? null;
}

// ============================================================================
// CSS FOR BEGINNER UI COMPONENTS
// ============================================================================

/**
 * CSS for beginner UI overlay components.
 */
export const BEGINNER_UI_CSS = `
/* Tutorial Overlay */
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
}

.tutorial-spotlight {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-md, 8px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.tutorial-tooltip {
  position: absolute;
  background: var(--color-surface, #2a2a3e);
  border: 1px solid var(--color-border, #3a3a4e);
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
  max-width: 320px;
  box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.3));
  pointer-events: auto;
  animation: fadeIn 0.2s ease;
}

.tutorial-tooltip-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text, #ffffff);
}

.tutorial-tooltip-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-secondary, #a0a0b0);
}

.tutorial-tooltip-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

/* Onboarding Checklist */
.onboarding-checklist {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  background: var(--color-surface, #2a2a3e);
  border: 1px solid var(--color-border, #3a3a4e);
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
  box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 100;
}

.onboarding-progress {
  height: 4px;
  background: var(--color-surface-elevated, #3a3a4e);
  border-radius: 2px;
  margin-bottom: 16px;
  overflow: hidden;
}

.onboarding-progress-bar {
  height: 100%;
  background: var(--color-primary, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.onboarding-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.onboarding-step-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-border, #3a3a4e);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.onboarding-step-check.completed {
  background: var(--color-success, #22c55e);
  border-color: var(--color-success, #22c55e);
}

.onboarding-step-check.completed::after {
  content: '✓';
  color: white;
  font-size: 12px;
}

/* Feature Teaser (locked features) */
.feature-teaser {
  position: relative;
  opacity: 0.5;
  pointer-events: none;
}

.feature-teaser::after {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.feature-teaser-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--color-primary, #3b82f6);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
}

/* Welcome Modal */
.welcome-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
}

.welcome-content {
  background: var(--color-surface, #2a2a3e);
  border-radius: var(--radius-xl, 16px);
  padding: 32px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary, #a0a0b0);
  margin-bottom: 24px;
}

/* Persona Selection */
.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.persona-card {
  background: var(--color-surface-elevated, #3a3a4e);
  border: 2px solid transparent;
  border-radius: var(--radius-md, 8px);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.persona-card:hover {
  border-color: var(--color-primary, #3b82f6);
}

.persona-card.selected {
  border-color: var(--color-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
}

.persona-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.persona-description {
  font-size: 12px;
  color: var(--color-text-secondary, #a0a0b0);
}

/* Simplified Mode Indicator */
.simplified-mode-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--color-primary, #3b82f6);
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 14px;
  z-index: 1000;
}

.simplified-mode-banner button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  margin-left: 8px;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`.trim();

/**
 * Apply beginner UI CSS to document.
 */
export function applyBeginnerUICSS(): void {
  const styleId = 'cardplay-beginner-ui';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = BEGINNER_UI_CSS;
}
