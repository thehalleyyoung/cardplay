/**
 * @fileoverview Interactive Tutorial System - Step-by-step guided lessons.
 * 
 * This module provides comprehensive, interactive tutorials that teach music production
 * concepts through hands-on experience. Unlike demo songs (quick bite-sized lessons),
 * tutorials are longer, multi-step guided experiences with validation and feedback.
 * 
 * @see currentsteps.md Phase 7.4: Interactive Tutorials (lines 2100-2120)
 */

// ============================================================================
// TUTORIAL TYPES
// ============================================================================

/**
 * Tutorial step type - defines what action the user must take.
 */
export type TutorialStepType =
  | 'instruction'    // Just show information, no action required
  | 'add-card'       // User must add a specific card
  | 'set-parameter'  // User must adjust a parameter
  | 'connect'        // User must connect two cards
  | 'play'           // User must play the project
  | 'record'         // User must record audio/MIDI
  | 'edit'           // User must edit something in the UI
  | 'listen'         // User must listen to audio
  | 'validation';    // Check if user's work meets criteria

/**
 * Validation criteria for a tutorial step.
 */
export interface ValidationCriteria {
  /** Type of validation */
  readonly type: 'card-exists' | 'parameter-value' | 'connection-exists' | 'audio-playing' | 'custom';
  /** Expected value or condition */
  readonly expected: unknown;
  /** Error message if validation fails */
  readonly errorMessage: string;
}

/**
 * Single step in an interactive tutorial.
 */
export interface TutorialStep {
  readonly id: string;
  readonly title: string;
  readonly instruction: string;
  readonly type: TutorialStepType;
  readonly details: Record<string, unknown>;
  readonly validation?: ValidationCriteria;
  readonly hint?: string; // Optional hint if user is stuck
  readonly videoUrl?: string; // Optional video demonstration
}

/**
 * Interactive tutorial - comprehensive guided lesson.
 */
export interface Tutorial {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly category: 'basics' | 'production' | 'mixing' | 'advanced' | 'workflow';
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
  readonly estimatedTime: number; // seconds to complete
  readonly prerequisites: readonly string[]; // Tutorial IDs that should be completed first
  readonly learningGoals: readonly string[]; // What you'll learn
  readonly steps: readonly TutorialStep[];
  readonly finalProject: {
    readonly description: string;
    readonly expectedCards: readonly string[];
  };
  readonly tags: readonly string[];
}

// ============================================================================
// TUTORIAL CATALOG
// ============================================================================

/**
 * Your First Note - Absolute beginner tutorial.
 */
export const YOUR_FIRST_NOTE_TUTORIAL: Tutorial = {
  id: 'your-first-note',
  name: 'Your First Note',
  description: 'Learn the absolute basics: create a sound and play your first note',
  emoji: '🎹',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: 180,
  prerequisites: [],
  learningGoals: [
    'Understand cards and the canvas',
    'Add your first instrument',
    'Play notes with your keyboard or MIDI',
    'Hear your first sound',
  ],
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to CardPlay',
      instruction: 'Welcome! In CardPlay, you create music by connecting cards. Each card is like an instrument, effect, or musical building block. Let\'s start by making your first sound.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-piano',
      title: 'Add a Piano',
      instruction: 'Click on the card palette on the left, find "Piano Card" and drag it onto the canvas.',
      type: 'add-card',
      details: {
        cardType: 'piano',
      },
      validation: {
        type: 'card-exists',
        expected: 'piano',
        errorMessage: 'Add a Piano card to continue',
      },
      hint: 'Look in the "Instruments" category',
    },
    {
      id: 'connect-output',
      title: 'Connect to Output',
      instruction: 'Every card needs to connect to the output to be heard. Drag a cable from the piano\'s output port to the "Audio Out" card.',
      type: 'connect',
      details: {
        from: 'piano',
        to: 'audio-out',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'piano', to: 'audio-out' },
        errorMessage: 'Connect the piano to Audio Out',
      },
      hint: 'Click and drag from the circular output port',
    },
    {
      id: 'play-note',
      title: 'Play a Note',
      instruction: 'Click on the piano card to focus it, then press a key on your computer keyboard (A, S, D, F...) or click the on-screen piano keys.',
      type: 'play',
      details: {
        instrument: 'piano',
      },
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Try pressing a keyboard key or clicking a piano key',
      },
      hint: 'The middle row of your keyboard (ASDF) plays notes',
    },
    {
      id: 'congrats',
      title: 'You Did It!',
      instruction: 'Congratulations! You just played your first note in CardPlay. The same process works for all instruments: add card → connect → play. Try experimenting with different notes and octaves!',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A working piano connected to audio output',
    expectedCards: ['piano', 'audio-out'],
  },
  tags: ['beginner', 'basics', 'first-time', 'piano'],
};

/**
 * Building Drums - Create your first beat.
 */
export const BUILDING_DRUMS_TUTORIAL: Tutorial = {
  id: 'building-drums',
  name: 'Building Drums',
  description: 'Learn to create drum patterns using a drum machine card',
  emoji: '🥁',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: 300,
  prerequisites: ['your-first-note'],
  learningGoals: [
    'Understand drum machine cards',
    'Program kick, snare, and hi-hat patterns',
    'Adjust tempo and swing',
    'Create variations',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Let\'s Make a Beat',
      instruction: 'Drums are the foundation of most modern music. We\'ll use a Drum Machine card to program a simple 4-bar beat with kick, snare, and hi-hats.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-drum-machine',
      title: 'Add Drum Machine',
      instruction: 'From the card palette, add a "Drum Machine" card to your canvas.',
      type: 'add-card',
      details: {
        cardType: 'drum-machine',
      },
      validation: {
        type: 'card-exists',
        expected: 'drum-machine',
        errorMessage: 'Add a Drum Machine card',
      },
    },
    {
      id: 'connect-drums',
      title: 'Connect to Output',
      instruction: 'Connect the drum machine\'s output to Audio Out.',
      type: 'connect',
      details: {
        from: 'drum-machine',
        to: 'audio-out',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'drum-machine', to: 'audio-out' },
        errorMessage: 'Connect drum machine to Audio Out',
      },
    },
    {
      id: 'set-tempo',
      title: 'Set Tempo',
      instruction: 'Click on the drum machine card to open it. Set the tempo to 120 BPM - a good starting point.',
      type: 'set-parameter',
      details: {
        parameter: 'tempo',
        value: 120,
      },
      validation: {
        type: 'parameter-value',
        expected: { parameter: 'tempo', value: 120, tolerance: 5 },
        errorMessage: 'Set tempo to around 120 BPM',
      },
      hint: 'Look for the BPM knob or text field',
    },
    {
      id: 'add-kick',
      title: 'Add Kick Drum',
      instruction: 'In the step sequencer grid, click on beats 1 and 3 in the "Kick" row to place kick drums on the downbeats.',
      type: 'edit',
      details: {
        action: 'toggle-step',
        drum: 'kick',
        steps: [0, 8],
      },
      validation: {
        type: 'custom',
        expected: { drum: 'kick', steps: [0, 8] },
        errorMessage: 'Add kicks on beats 1 and 3',
      },
      hint: 'Click the squares in the Kick row',
    },
    {
      id: 'add-snare',
      title: 'Add Snare',
      instruction: 'Now add snares on beats 2 and 4 (the backbeat). This creates the basic "boom-clap" pattern.',
      type: 'edit',
      details: {
        action: 'toggle-step',
        drum: 'snare',
        steps: [4, 12],
      },
      validation: {
        type: 'custom',
        expected: { drum: 'snare', steps: [4, 12] },
        errorMessage: 'Add snares on beats 2 and 4',
      },
    },
    {
      id: 'add-hihat',
      title: 'Add Hi-Hats',
      instruction: 'Add hi-hats on every 8th note (every other step) for a driving rhythm.',
      type: 'edit',
      details: {
        action: 'toggle-step',
        drum: 'hihat',
        steps: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      validation: {
        type: 'custom',
        expected: { drum: 'hihat', minSteps: 6 },
        errorMessage: 'Add multiple hi-hat hits',
      },
      hint: 'Click every other square in the Hi-Hat row',
    },
    {
      id: 'play-beat',
      title: 'Play Your Beat',
      instruction: 'Press the Play button (or spacebar) to hear your beat loop!',
      type: 'play',
      details: {
        looping: true,
      },
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Press Play to hear your beat',
      },
    },
    {
      id: 'add-swing',
      title: 'Add Swing (Optional)',
      instruction: 'Try adjusting the Swing knob to 50-70% to make the hi-hats feel more groovy and less robotic.',
      type: 'set-parameter',
      details: {
        parameter: 'swing',
        value: 0.6,
      },
      hint: 'Swing delays every other hi-hat slightly',
    },
    {
      id: 'congrats',
      title: 'You Built a Beat!',
      instruction: 'Great work! You\'ve created a classic four-on-the-floor beat. Experiment with adding more drums, changing velocities, or trying different patterns.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A working drum pattern with kick, snare, and hi-hats',
    expectedCards: ['drum-machine', 'audio-out'],
  },
  tags: ['beginner', 'drums', 'rhythm', 'sequencing'],
};

/**
 * Writing Chords - Harmonic foundations.
 */
export const WRITING_CHORDS_TUTORIAL: Tutorial = {
  id: 'writing-chords',
  name: 'Writing Chords',
  description: 'Learn to create chord progressions that sound professional',
  emoji: '🎼',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: 360,
  prerequisites: ['your-first-note'],
  learningGoals: [
    'Understand chord progressions',
    'Use the Chord Progression card',
    'Learn common progressions (I-V-vi-IV)',
    'Connect chords to instruments',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Harmony Basics',
      instruction: 'Chords are multiple notes played together. A chord progression is a sequence of chords that creates the harmonic foundation of your song. We\'ll create a common progression: C - G - Am - F (I - V - vi - IV).',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-chord-card',
      title: 'Add Chord Progression',
      instruction: 'Add a "Chord Progression" card from the palette.',
      type: 'add-card',
      details: {
        cardType: 'chord-progression',
      },
      validation: {
        type: 'card-exists',
        expected: 'chord-progression',
        errorMessage: 'Add a Chord Progression card',
      },
    },
    {
      id: 'add-piano',
      title: 'Add Piano',
      instruction: 'Add a "Piano" card to play the chords.',
      type: 'add-card',
      details: {
        cardType: 'piano',
      },
      validation: {
        type: 'card-exists',
        expected: 'piano',
        errorMessage: 'Add a Piano card',
      },
    },
    {
      id: 'connect-chord-to-piano',
      title: 'Connect Chords to Piano',
      instruction: 'Connect the Chord Progression card\'s MIDI output to the Piano\'s MIDI input.',
      type: 'connect',
      details: {
        from: 'chord-progression',
        to: 'piano',
        portType: 'midi',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'chord-progression', to: 'piano' },
        errorMessage: 'Connect Chord Progression to Piano',
      },
      hint: 'MIDI connections send note information',
    },
    {
      id: 'connect-piano-out',
      title: 'Connect Piano to Output',
      instruction: 'Connect the Piano\'s audio output to Audio Out.',
      type: 'connect',
      details: {
        from: 'piano',
        to: 'audio-out',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'piano', to: 'audio-out' },
        errorMessage: 'Connect Piano to Audio Out',
      },
    },
    {
      id: 'set-key',
      title: 'Set Key',
      instruction: 'Open the Chord Progression card and set the key to C major.',
      type: 'set-parameter',
      details: {
        parameter: 'key',
        value: 'C',
      },
      validation: {
        type: 'parameter-value',
        expected: { parameter: 'key', value: 'C' },
        errorMessage: 'Set key to C major',
      },
    },
    {
      id: 'set-progression',
      title: 'Set Progression',
      instruction: 'Set the chord progression to: C, G, Am, F (this is the famous "I-V-vi-IV" progression used in countless hit songs).',
      type: 'set-parameter',
      details: {
        parameter: 'progression',
        value: ['C', 'G', 'Am', 'F'],
      },
      validation: {
        type: 'parameter-value',
        expected: { parameter: 'progression', minChords: 4 },
        errorMessage: 'Enter at least 4 chords',
      },
      hint: 'Type chord names or select from the preset progressions',
    },
    {
      id: 'play-chords',
      title: 'Play the Progression',
      instruction: 'Press Play to hear your chord progression!',
      type: 'play',
      details: {
        looping: true,
      },
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Press Play',
      },
    },
    {
      id: 'experiment',
      title: 'Experiment',
      instruction: 'Try changing the chords or adjusting the voicing style in the Chord Progression card. Notice how different chord orders create different emotions.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'congrats',
      title: 'You Created Harmony!',
      instruction: 'Excellent! You now understand how to create chord progressions. This same card can feed chords to any instrument, bassline, or melody generator.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A chord progression playing through a piano',
    expectedCards: ['chord-progression', 'piano', 'audio-out'],
  },
  tags: ['beginner', 'harmony', 'chords', 'theory'],
};

/**
 * Melody 101 - Learn melodic writing fundamentals.
 */
export const MELODY_101_TUTORIAL: Tutorial = {
  id: 'melody-101',
  name: 'Melody 101',
  description: 'Master the art of creating memorable melodies that stick',
  emoji: '🎶',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: 420,
  prerequisites: ['writing-chords'],
  learningGoals: [
    'Understand melodic contour and shape',
    'Use the Melody card with chord awareness',
    'Create call-and-response phrases',
    'Layer melody over chords',
  ],
  steps: [
    {
      id: 'intro',
      title: 'What Makes a Good Melody?',
      instruction: 'A great melody has shape, rhythm, and emotion. It rises and falls like a story. We\'ll create a simple melody that works with our chord progression.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-melody-card',
      title: 'Add Melody Generator',
      instruction: 'Add a "Melody" card from the Generators category.',
      type: 'add-card',
      details: {
        cardType: 'melody',
      },
      validation: {
        type: 'card-exists',
        expected: 'melody',
        errorMessage: 'Add a Melody card',
      },
    },
    {
      id: 'add-synth',
      title: 'Add Lead Synth',
      instruction: 'Add a "Lead Synth" card to play the melody.',
      type: 'add-card',
      details: {
        cardType: 'lead-synth',
      },
      validation: {
        type: 'card-exists',
        expected: 'lead-synth',
        errorMessage: 'Add a Lead Synth card',
      },
    },
    {
      id: 'connect-melody-to-synth',
      title: 'Connect Melody to Synth',
      instruction: 'Connect the Melody card\'s MIDI output to the Lead Synth\'s MIDI input.',
      type: 'connect',
      details: {
        from: 'melody',
        to: 'lead-synth',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'melody', to: 'lead-synth' },
        errorMessage: 'Connect Melody to Lead Synth',
      },
    },
    {
      id: 'connect-synth-out',
      title: 'Connect to Output',
      instruction: 'Connect the Lead Synth to Audio Out.',
      type: 'connect',
      details: {
        from: 'lead-synth',
        to: 'audio-out',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'lead-synth', to: 'audio-out' },
        errorMessage: 'Connect Lead Synth to Audio Out',
      },
    },
    {
      id: 'set-scale',
      title: 'Set Scale',
      instruction: 'Open the Melody card and set the scale to C Major (same key as your chords).',
      type: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C major',
      },
      validation: {
        type: 'parameter-value',
        expected: { parameter: 'scale', value: 'C major' },
        errorMessage: 'Set scale to C major',
      },
    },
    {
      id: 'set-contour',
      title: 'Choose Melodic Shape',
      instruction: 'Select an "arch" contour - the melody will rise to a peak and fall back down, creating natural tension and release.',
      type: 'set-parameter',
      details: {
        parameter: 'contour',
        value: 'arch',
      },
      hint: 'An arch shape creates a natural sense of journey',
    },
    {
      id: 'play-melody',
      title: 'Hear Your Melody',
      instruction: 'Press Play to hear the generated melody!',
      type: 'play',
      details: {},
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Press Play',
      },
    },
    {
      id: 'adjust-density',
      title: 'Adjust Note Density',
      instruction: 'Try adjusting the "density" slider to make the melody simpler (fewer notes) or busier (more notes).',
      type: 'set-parameter',
      details: {
        parameter: 'density',
        value: 0.5,
      },
      hint: 'Start with medium density (0.5) for balanced melodies',
    },
    {
      id: 'congrats',
      title: 'Melody Mastered!',
      instruction: 'Perfect! You\'ve learned how melodies work with scales and contours. Try different contour shapes and density settings to create various moods.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A melody generator connected to a synth',
    expectedCards: ['melody', 'lead-synth', 'audio-out'],
  },
  tags: ['beginner', 'melody', 'lead', 'composition'],
};

/**
 * Bass Fundamentals - Learn to create solid bass lines.
 */
export const BASS_FUNDAMENTALS_TUTORIAL: Tutorial = {
  id: 'bass-fundamentals',
  name: 'Bass Fundamentals',
  description: 'Create bass lines that lock with drums and support harmony',
  emoji: '🎸',
  category: 'production',
  difficulty: 'beginner',
  estimatedTime: 360,
  prerequisites: ['writing-chords'],
  learningGoals: [
    'Understand bass line function',
    'Use the Bassline card',
    'Create patterns that follow chords',
    'Lock bass with kick drum',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Bass Is the Foundation',
      instruction: 'The bass line connects rhythm (drums) to harmony (chords). A good bass line is simple, groovy, and emphasizes chord roots.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-bassline-card',
      title: 'Add Bassline Generator',
      instruction: 'Add a "Bassline" card from the Generators category.',
      type: 'add-card',
      details: {
        cardType: 'bassline',
      },
      validation: {
        type: 'card-exists',
        expected: 'bassline',
        errorMessage: 'Add a Bassline card',
      },
    },
    {
      id: 'add-bass-synth',
      title: 'Add Bass Instrument',
      instruction: 'Add a bass instrument like "Bass Card" or use a synth with bass preset.',
      type: 'add-card',
      details: {
        cardType: 'bass',
      },
      validation: {
        type: 'card-exists',
        expected: 'bass',
        errorMessage: 'Add a Bass instrument',
      },
    },
    {
      id: 'connect-bassline',
      title: 'Connect Bassline',
      instruction: 'Connect: Bassline → Bass → Audio Out.',
      type: 'connect',
      details: {
        from: 'bassline',
        to: 'bass',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'bassline', to: 'bass' },
        errorMessage: 'Connect Bassline to Bass instrument',
      },
    },
    {
      id: 'connect-bass-out',
      title: 'Connect to Output',
      instruction: 'Connect the Bass instrument to Audio Out.',
      type: 'connect',
      details: {
        from: 'bass',
        to: 'audio-out',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'bass', to: 'audio-out' },
        errorMessage: 'Connect Bass to Audio Out',
      },
    },
    {
      id: 'set-pattern-style',
      title: 'Choose Pattern Style',
      instruction: 'In the Bassline card, select "Root" pattern style - this plays the root note of each chord on the beat.',
      type: 'set-parameter',
      details: {
        parameter: 'style',
        value: 'root',
      },
      hint: 'Root patterns are the simplest and most solid',
    },
    {
      id: 'play-bass',
      title: 'Hear the Bass',
      instruction: 'Press Play to hear how the bass line follows your chord progression.',
      type: 'play',
      details: {},
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Press Play',
      },
    },
    {
      id: 'try-walking',
      title: 'Try Walking Bass',
      instruction: 'Change the pattern style to "Walking" for a jazzy, moving bass line.',
      type: 'set-parameter',
      details: {
        parameter: 'style',
        value: 'walking',
      },
      hint: 'Walking bass connects chords with stepwise motion',
    },
    {
      id: 'congrats',
      title: 'Bass Master!',
      instruction: 'Excellent! You understand how bass supports harmony. Experiment with different pattern styles (root, walking, pedal, counterpoint) for different genres.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A bassline following chords',
    expectedCards: ['bassline', 'bass', 'audio-out'],
  },
  tags: ['beginner', 'bass', 'harmony', 'production'],
};

/**
 * Mixing Basics - Balance and polish your track.
 */
export const MIXING_BASICS_TUTORIAL: Tutorial = {
  id: 'mixing-basics',
  name: 'Mixing Basics',
  description: 'Learn to balance levels, pan, and add polish with EQ',
  emoji: '🎚️',
  category: 'mixing',
  difficulty: 'intermediate',
  estimatedTime: 480,
  prerequisites: ['building-drums', 'writing-chords'],
  learningGoals: [
    'Understand gain staging and headroom',
    'Use panning for stereo width',
    'Apply basic EQ for clarity',
    'Create space with volume balance',
  ],
  steps: [
    {
      id: 'intro',
      title: 'What Is Mixing?',
      instruction: 'Mixing is the art of balancing all elements so they work together. We\'ll use volume, panning, and EQ to create space and clarity.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'check-levels',
      title: 'Check Your Levels',
      instruction: 'First rule: don\'t clip! Make sure your master meter isn\'t hitting red (over 0dB). If it is, turn down individual tracks.',
      type: 'listen',
      details: {
        focus: 'meter',
      },
      hint: 'Aim for peaks around -6dB to leave headroom',
    },
    {
      id: 'balance-drums-bass',
      title: 'Balance Drums and Bass',
      instruction: 'These are your foundation. Start with kick and bass at similar volumes, complementing each other.',
      type: 'set-parameter',
      details: {
        parameter: 'volume',
        cards: ['drums', 'bass'],
      },
      hint: 'Kick and bass together form the low-end foundation',
    },
    {
      id: 'add-chords-lower',
      title: 'Add Chords Below Melody',
      instruction: 'Chords support the melody, so they should be present but not dominate. Set chord volume about 3-6 dB below your melody.',
      type: 'set-parameter',
      details: {
        parameter: 'volume',
        card: 'chords',
      },
    },
    {
      id: 'pan-for-width',
      title: 'Use Panning',
      instruction: 'Create stereo width by panning elements left and right. Try panning hi-hats slightly left, chords slightly right.',
      type: 'set-parameter',
      details: {
        parameter: 'pan',
      },
      hint: 'Keep kick, snare, bass, and lead vocals centered',
    },
    {
      id: 'add-eq',
      title: 'Add EQ Card',
      instruction: 'Add an "EQ" effect card from the Effects category.',
      type: 'add-card',
      details: {
        cardType: 'eq',
      },
      validation: {
        type: 'card-exists',
        expected: 'eq',
        errorMessage: 'Add an EQ card',
      },
    },
    {
      id: 'eq-bass',
      title: 'EQ the Bass',
      instruction: 'Connect EQ to your bass track. Cut frequencies below 40Hz (they\'re just muddy rumble) and boost around 80-100Hz for warmth.',
      type: 'connect',
      details: {
        from: 'bass',
        to: 'eq',
        to2: 'audio-out',
      },
      hint: 'High-pass filter removes unnecessary low-end',
    },
    {
      id: 'listen-mix',
      title: 'Listen to Your Mix',
      instruction: 'Play your track and listen critically. Can you hear every element clearly? Is anything too loud or too quiet?',
      type: 'listen',
      details: {},
    },
    {
      id: 'congrats',
      title: 'Mixing Mind Unlocked!',
      instruction: 'Great work! Mixing takes practice, but you now understand the fundamentals: balance, panning, and EQ. Keep experimenting!',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A balanced mix with proper levels and panning',
    expectedCards: ['drums', 'bass', 'chords', 'eq', 'audio-out'],
  },
  tags: ['intermediate', 'mixing', 'eq', 'balance'],
};

/**
 * Effect Essentials - Transform sound with effects.
 */
export const EFFECT_ESSENTIALS_TUTORIAL: Tutorial = {
  id: 'effect-essentials',
  name: 'Effect Essentials',
  description: 'Master reverb, delay, and other effects to add depth and space',
  emoji: '✨',
  category: 'production',
  difficulty: 'intermediate',
  estimatedTime: 420,
  prerequisites: ['mixing-basics'],
  learningGoals: [
    'Understand reverb for space and depth',
    'Use delay for rhythmic interest',
    'Apply effects with proper wet/dry balance',
    'Chain effects in the right order',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Effects Add Magic',
      instruction: 'Effects transform dry sounds into lush, spacious productions. Reverb adds room, delay adds rhythm, and modulation adds movement.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-reverb',
      title: 'Add Reverb Card',
      instruction: 'Add a "Reverb" effect card from the Effects category.',
      type: 'add-card',
      details: {
        cardType: 'reverb',
      },
      validation: {
        type: 'card-exists',
        expected: 'reverb',
        errorMessage: 'Add a Reverb card',
      },
    },
    {
      id: 'connect-reverb',
      title: 'Add Reverb to Synth',
      instruction: 'Connect your lead synth through the reverb: Lead Synth → Reverb → Audio Out.',
      type: 'connect',
      details: {
        from: 'lead-synth',
        to: 'reverb',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'lead-synth', to: 'reverb' },
        errorMessage: 'Connect Lead Synth to Reverb',
      },
    },
    {
      id: 'set-room-size',
      title: 'Set Room Size',
      instruction: 'In the Reverb card, set the room size to "Medium Hall" - big enough for space but not overwhelming.',
      type: 'set-parameter',
      details: {
        parameter: 'room-size',
        value: 0.5,
      },
      hint: 'Smaller rooms = tighter sound, larger = more spacious',
    },
    {
      id: 'set-wet-dry',
      title: 'Balance Wet/Dry Mix',
      instruction: 'Set the wet/dry mix to about 30% wet. Too much reverb makes things muddy.',
      type: 'set-parameter',
      details: {
        parameter: 'mix',
        value: 0.3,
      },
      hint: '20-40% wet is good for most instruments',
    },
    {
      id: 'add-delay',
      title: 'Add Delay Card',
      instruction: 'Add a "Delay" effect card.',
      type: 'add-card',
      details: {
        cardType: 'delay',
      },
      validation: {
        type: 'card-exists',
        expected: 'delay',
        errorMessage: 'Add a Delay card',
      },
    },
    {
      id: 'chain-delay',
      title: 'Chain Effects',
      instruction: 'Insert the Delay between Lead Synth and Reverb. Order matters: Synth → Delay → Reverb → Audio Out.',
      type: 'connect',
      details: {
        chain: ['lead-synth', 'delay', 'reverb', 'audio-out'],
      },
      hint: 'Time-based effects (delay) usually go before space effects (reverb)',
    },
    {
      id: 'sync-delay',
      title: 'Sync Delay to Tempo',
      instruction: 'Set delay time to "1/4" (quarter note) so it syncs rhythmically with your song.',
      type: 'set-parameter',
      details: {
        parameter: 'time',
        value: '1/4',
      },
      hint: 'Synced delays create rhythmic patterns',
    },
    {
      id: 'listen-effects',
      title: 'Hear the Effects',
      instruction: 'Play your track. Notice how delay adds rhythm and reverb adds space. Try toggling effects on/off to hear the difference.',
      type: 'play',
      details: {},
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Press Play',
      },
    },
    {
      id: 'congrats',
      title: 'Effects Wizard!',
      instruction: 'Perfect! You\'ve mastered the basics of reverb and delay. Experiment with other effects like chorus, phaser, and distortion!',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'An effects chain with delay and reverb',
    expectedCards: ['lead-synth', 'delay', 'reverb', 'audio-out'],
  },
  tags: ['intermediate', 'effects', 'reverb', 'delay'],
};

/**
 * Automation Magic - Bring movement and dynamics to your track.
 */
export const AUTOMATION_MAGIC_TUTORIAL: Tutorial = {
  id: 'automation-magic',
  name: 'Automation Magic',
  description: 'Add movement and dynamics with parameter automation',
  emoji: '🎭',
  category: 'production',
  difficulty: 'intermediate',
  estimatedTime: 360,
  prerequisites: ['effect-essentials'],
  learningGoals: [
    'Understand automation lanes',
    'Automate filter cutoff for builds',
    'Automate volume for dynamics',
    'Create automation curves',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Automation Creates Life',
      instruction: 'Static parameters sound robotic. Automation adds movement, builds tension, and creates dynamics. We\'ll automate a filter sweep.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'select-parameter',
      title: 'Choose Parameter to Automate',
      instruction: 'Right-click on the Filter Cutoff parameter in your synth and select "Create Automation Lane".',
      type: 'edit',
      details: {
        action: 'create-automation',
        parameter: 'filter-cutoff',
      },
      validation: {
        type: 'custom',
        expected: { automation: 'filter-cutoff' },
        errorMessage: 'Create automation for filter cutoff',
      },
      hint: 'Automation lanes appear below the track',
    },
    {
      id: 'draw-automation',
      title: 'Draw Automation Curve',
      instruction: 'Draw a rising curve: start low (closed filter) at the beginning, then rise to high (open filter) over 4 bars.',
      type: 'edit',
      details: {
        action: 'draw-automation',
      },
      hint: 'Click and drag to create points, drag points to adjust',
    },
    {
      id: 'play-automation',
      title: 'Hear the Filter Sweep',
      instruction: 'Press Play. You should hear the filter gradually open, creating a build-up effect.',
      type: 'play',
      details: {},
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Press Play',
      },
    },
    {
      id: 'adjust-curve',
      title: 'Adjust Curve Shape',
      instruction: 'Right-click an automation point and try different curve shapes (linear, exponential, S-curve). Exponential curves feel more natural.',
      type: 'edit',
      details: {
        action: 'adjust-curve',
      },
      hint: 'Different curves create different emotional impacts',
    },
    {
      id: 'automate-volume',
      title: 'Automate Volume',
      instruction: 'Create another automation lane for track volume. Draw a dip in volume during the break, then bring it back up for the drop.',
      type: 'edit',
      details: {
        action: 'create-automation',
        parameter: 'volume',
      },
    },
    {
      id: 'congrats',
      title: 'Automation Expert!',
      instruction: 'Amazing! You can automate any parameter in CardPlay. Try automating panning, reverb amount, delay feedback, or effect parameters for dynamic productions.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A track with filter and volume automation',
    expectedCards: ['synth', 'audio-out'],
  },
  tags: ['intermediate', 'automation', 'dynamics', 'production'],
};

/**
 * Sampling School - Learn sampling techniques.
 */
export const SAMPLING_SCHOOL_TUTORIAL: Tutorial = {
  id: 'sampling-school',
  name: 'Sampling School',
  description: 'Master the art of sampling: chop, pitch, and mangle audio',
  emoji: '🎙️',
  category: 'production',
  difficulty: 'intermediate',
  estimatedTime: 480,
  prerequisites: ['building-drums'],
  learningGoals: [
    'Import and load audio samples',
    'Use the Sampler card',
    'Slice samples into zones',
    'Create velocity layers',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Sampling Is Everything',
      instruction: 'Sampling lets you use any sound as an instrument. From drums to vocals to found sounds, sampling is a cornerstone of modern production.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-sampler',
      title: 'Add Sampler Card',
      instruction: 'Add a "Sampler" card from the Instruments category.',
      type: 'add-card',
      details: {
        cardType: 'sampler',
      },
      validation: {
        type: 'card-exists',
        expected: 'sampler',
        errorMessage: 'Add a Sampler card',
      },
    },
    {
      id: 'load-sample',
      title: 'Load a Sample',
      instruction: 'Click "Load Sample" in the Sampler card and choose an audio file, or drag a WAV/MP3 file onto the sampler.',
      type: 'edit',
      details: {
        action: 'load-sample',
      },
      validation: {
        type: 'custom',
        expected: { sampleLoaded: true },
        errorMessage: 'Load an audio sample',
      },
      hint: 'You can use your own files or search Freesound for Creative Commons samples',
    },
    {
      id: 'connect-sampler',
      title: 'Connect to Output',
      instruction: 'Connect the Sampler to Audio Out.',
      type: 'connect',
      details: {
        from: 'sampler',
        to: 'audio-out',
      },
      validation: {
        type: 'connection-exists',
        expected: { from: 'sampler', to: 'audio-out' },
        errorMessage: 'Connect Sampler to Audio Out',
      },
    },
    {
      id: 'set-root-key',
      title: 'Set Root Key',
      instruction: 'If your sample has a clear pitch, set the "Root Key" so it plays in tune when you press different keys.',
      type: 'set-parameter',
      details: {
        parameter: 'root-key',
        value: 'C3',
      },
      hint: 'For drum samples, root key doesn\'t matter as much',
    },
    {
      id: 'play-sample',
      title: 'Play the Sample',
      instruction: 'Play notes on your keyboard. The sample will pitch up and down chromatically.',
      type: 'play',
      details: {},
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Play some notes',
      },
    },
    {
      id: 'adjust-envelope',
      title: 'Shape the Sound',
      instruction: 'Adjust the ADSR envelope to change how the sample attacks and releases. Short attack + release = percussive.',
      type: 'set-parameter',
      details: {
        parameter: 'envelope',
      },
      hint: 'Attack controls how quickly the sound starts',
    },
    {
      id: 'add-filter',
      title: 'Add Filter',
      instruction: 'Lower the filter cutoff to make the sample darker, or add filter envelope for movement.',
      type: 'set-parameter',
      details: {
        parameter: 'filter-cutoff',
        value: 0.7,
      },
    },
    {
      id: 'congrats',
      title: 'Sampling Samurai!',
      instruction: 'Perfect! You can now load any audio and turn it into a playable instrument. Try loading vocal samples, drum loops, or field recordings!',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A sampler with loaded audio and shaped envelope',
    expectedCards: ['sampler', 'audio-out'],
  },
  tags: ['intermediate', 'sampling', 'audio', 'production'],
};

/**
 * Synthesis Start - Build sounds from scratch with synthesis.
 */
export const SYNTHESIS_START_TUTORIAL: Tutorial = {
  id: 'synthesis-start',
  name: 'Synthesis Start',
  description: 'Create sounds from scratch using oscillators and filters',
  emoji: '🔬',
  category: 'production',
  difficulty: 'intermediate',
  estimatedTime: 420,
  prerequisites: ['effect-essentials'],
  learningGoals: [
    'Understand oscillators and waveforms',
    'Use filters to shape timbre',
    'Apply envelopes to parameters',
    'Create basic synth patches',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Synthesis = Pure Creation',
      instruction: 'Synthesis creates sound from scratch using oscillators (tone generators) and filters (tone shapers). We\'ll build a classic analog-style bass.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'add-synth',
      title: 'Add Synthesizer',
      instruction: 'Add a "Lead Synth" or "Pad Synth" card with full synthesis controls.',
      type: 'add-card',
      details: {
        cardType: 'lead-synth',
      },
      validation: {
        type: 'card-exists',
        expected: 'lead-synth',
        errorMessage: 'Add a synth card',
      },
    },
    {
      id: 'select-waveform',
      title: 'Choose Oscillator Waveform',
      instruction: 'Set Oscillator 1 to "Sawtooth" wave. Saw waves are bright and rich in harmonics - perfect for basses and leads.',
      type: 'set-parameter',
      details: {
        parameter: 'osc1-waveform',
        value: 'sawtooth',
      },
      hint: 'Sine = pure, Square = hollow, Saw = bright, Triangle = soft',
    },
    {
      id: 'add-second-osc',
      title: 'Add Second Oscillator',
      instruction: 'Enable Oscillator 2 and set it to Sawtooth as well, detuned by 7 semitones down for thickness.',
      type: 'set-parameter',
      details: {
        parameter: 'osc2-tune',
        value: -7,
      },
      hint: 'Layering detuned oscillators creates fatness',
    },
    {
      id: 'set-filter-type',
      title: 'Set Filter Type',
      instruction: 'Set the filter to "Low Pass" (LP). This cuts high frequencies, making the sound warmer.',
      type: 'set-parameter',
      details: {
        parameter: 'filter-type',
        value: 'lowpass',
      },
    },
    {
      id: 'adjust-cutoff',
      title: 'Adjust Filter Cutoff',
      instruction: 'Lower the filter cutoff to around 30-40%. This gives a warm, analog sound.',
      type: 'set-parameter',
      details: {
        parameter: 'filter-cutoff',
        value: 0.35,
      },
      hint: 'Lower cutoff = darker sound',
    },
    {
      id: 'add-resonance',
      title: 'Add Resonance',
      instruction: 'Increase filter resonance to 50-60% to emphasize the cutoff frequency and add character.',
      type: 'set-parameter',
      details: {
        parameter: 'filter-resonance',
        value: 0.55,
      },
      hint: 'Resonance can self-oscillate at high values',
    },
    {
      id: 'shape-envelope',
      title: 'Shape the Envelope',
      instruction: 'Set a snappy envelope: short attack (0.01s), medium decay (0.3s), low sustain (30%), short release (0.1s).',
      type: 'set-parameter',
      details: {
        parameter: 'envelope',
      },
      hint: 'ADSR controls volume shape over time',
    },
    {
      id: 'play-patch',
      title: 'Play Your Patch',
      instruction: 'Connect to Audio Out and play some low notes. You\'ve created a classic analog bass sound!',
      type: 'play',
      details: {},
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Play some notes',
      },
    },
    {
      id: 'congrats',
      title: 'Synthesis Sorcerer!',
      instruction: 'Excellent! You understand the synthesis basics. Try different waveforms, filter types, and envelope shapes to create infinite sounds.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A custom synthesized bass patch',
    expectedCards: ['lead-synth', 'audio-out'],
  },
  tags: ['intermediate', 'synthesis', 'sound-design', 'oscillators'],
};

/**
 * Recording Ready - Record audio and MIDI input.
 */
export const RECORDING_READY_TUTORIAL: Tutorial = {
  id: 'recording-ready',
  name: 'Recording Ready',
  description: 'Learn to record your own audio and MIDI performances',
  emoji: '⏺️',
  category: 'workflow',
  difficulty: 'beginner',
  estimatedTime: 300,
  prerequisites: ['your-first-note'],
  learningGoals: [
    'Set up audio input',
    'Record audio takes',
    'Record MIDI performances',
    'Use count-in and metronome',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Capture Your Performance',
      instruction: 'Recording lets you capture live performances - vocals, guitars, keyboards, or any MIDI controller.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'check-input',
      title: 'Check Audio Input',
      instruction: 'Open Settings → Audio and make sure your microphone or audio interface is selected as the input device.',
      type: 'edit',
      details: {
        action: 'check-audio-input',
      },
      hint: 'You should see an input level meter moving when you make sound',
    },
    {
      id: 'add-audio-track',
      title: 'Create Audio Track',
      instruction: 'Add an "Audio Input" card from the Recording category.',
      type: 'add-card',
      details: {
        cardType: 'audio-input',
      },
      validation: {
        type: 'card-exists',
        expected: 'audio-input',
        errorMessage: 'Add an Audio Input card',
      },
    },
    {
      id: 'arm-recording',
      title: 'Arm Track for Recording',
      instruction: 'Click the Record-Arm button on the Audio Input card (usually a red circle). The track is now ready to record.',
      type: 'edit',
      details: {
        action: 'arm-track',
      },
      validation: {
        type: 'custom',
        expected: { armed: true },
        errorMessage: 'Arm the track for recording',
      },
      hint: 'Armed tracks show in red and will record when you hit record',
    },
    {
      id: 'enable-metronome',
      title: 'Enable Metronome',
      instruction: 'Turn on the metronome (click the metronome icon in the transport) so you can stay in time.',
      type: 'edit',
      details: {
        action: 'enable-metronome',
      },
    },
    {
      id: 'set-count-in',
      title: 'Set Count-In',
      instruction: 'Enable a 1-bar count-in so you have time to prepare before recording starts.',
      type: 'set-parameter',
      details: {
        parameter: 'count-in',
        value: 1,
      },
      hint: 'Count-in gives you clicks before recording',
    },
    {
      id: 'record-take',
      title: 'Record!',
      instruction: 'Press the Record button (red circle in transport) and perform! Press Stop when done.',
      type: 'record',
      details: {
        duration: 8,
      },
      validation: {
        type: 'custom',
        expected: { recorded: true },
        errorMessage: 'Record at least one take',
      },
    },
    {
      id: 'listen-back',
      title: 'Listen to Your Take',
      instruction: 'Disarm the track (click record-arm again) and press Play to hear what you recorded.',
      type: 'play',
      details: {},
      validation: {
        type: 'audio-playing',
        expected: true,
        errorMessage: 'Play back your recording',
      },
    },
    {
      id: 'congrats',
      title: 'Recording Engineer!',
      instruction: 'Great! You can now record audio. The same process works for MIDI: add MIDI Input card, arm, record your keyboard/controller performance.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A recorded audio take on a track',
    expectedCards: ['audio-input', 'audio-out'],
  },
  tags: ['beginner', 'recording', 'audio', 'workflow'],
};

/**
 * Performance Mode - Play live with CardPlay.
 */
export const PERFORMANCE_MODE_TUTORIAL: Tutorial = {
  id: 'performance-mode',
  name: 'Performance Mode',
  description: 'Learn to perform live with scenes, pads, and real-time controls',
  emoji: '🎤',
  category: 'workflow',
  difficulty: 'advanced',
  estimatedTime: 480,
  prerequisites: ['building-drums', 'writing-chords'],
  learningGoals: [
    'Understand scene launching',
    'Use pad controllers for live triggering',
    'Map MIDI controllers to parameters',
    'Create live performance sets',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Live Performance',
      instruction: 'Performance Mode turns CardPlay into a live instrument. You\'ll trigger clips, adjust effects in real-time, and create dynamic sets.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'create-scenes',
      title: 'Create Scenes',
      instruction: 'Scenes are snapshots of your project. Create Scene 1 with just drums, Scene 2 with drums + bass, Scene 3 with everything.',
      type: 'edit',
      details: {
        action: 'create-scene',
      },
      hint: 'Scenes let you switch between different arrangements',
    },
    {
      id: 'add-pad-controller',
      title: 'Add Pad Controller',
      instruction: 'Add a "Pad Controller" card from the Controllers category.',
      type: 'add-card',
      details: {
        cardType: 'pad-controller',
      },
      validation: {
        type: 'card-exists',
        expected: 'pad-controller',
        errorMessage: 'Add a Pad Controller',
      },
    },
    {
      id: 'assign-clips',
      title: 'Assign Clips to Pads',
      instruction: 'Drag clips or loops onto the pad grid. Each pad can trigger a different clip.',
      type: 'edit',
      details: {
        action: 'assign-clip-to-pad',
      },
      hint: 'You can also assign scenes to pads',
    },
    {
      id: 'launch-clip',
      title: 'Launch Clips',
      instruction: 'Click a pad (or press the corresponding key) to launch that clip in real-time.',
      type: 'play',
      details: {
        action: 'launch-clip',
      },
      validation: {
        type: 'custom',
        expected: { clipLaunched: true },
        errorMessage: 'Launch at least one clip',
      },
    },
    {
      id: 'map-controller',
      title: 'Map MIDI Controller',
      instruction: 'Right-click any parameter (like filter cutoff) and select "MIDI Learn". Move a knob on your MIDI controller to map it.',
      type: 'edit',
      details: {
        action: 'midi-learn',
      },
      hint: 'This lets you control parameters with hardware knobs/faders',
    },
    {
      id: 'perform',
      title: 'Perform!',
      instruction: 'Trigger clips, switch scenes, and adjust parameters live. You\'re performing with CardPlay!',
      type: 'play',
      details: {},
    },
    {
      id: 'congrats',
      title: 'Live Performance Pro!',
      instruction: 'Amazing! You can now perform live sets with CardPlay. Connect a MIDI controller for even more control. Try creating setlists and transitioning between songs!',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A performance set with scenes and pads',
    expectedCards: ['pad-controller', 'scenes', 'clips'],
  },
  tags: ['advanced', 'performance', 'live', 'workflow'],
};

/**
 * Card Stacking - Master the card/deck system.
 */
export const CARD_STACKING_TUTORIAL: Tutorial = {
  id: 'card-stacking',
  name: 'Card Stacking',
  description: 'Learn to stack cards in series, parallel, and custom routing',
  emoji: '🃏',
  category: 'workflow',
  difficulty: 'advanced',
  estimatedTime: 360,
  prerequisites: ['effect-essentials'],
  learningGoals: [
    'Understand serial vs parallel card chains',
    'Create effect stacks',
    'Use send/return routing',
    'Build complex signal flow',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Cards Are Modular',
      instruction: 'CardPlay\'s power comes from flexible routing. You can stack cards in series (one after another) or parallel (split signal).',
      type: 'instruction',
      details: {},
    },
    {
      id: 'create-serial-chain',
      title: 'Create Serial Chain',
      instruction: 'Connect cards in a chain: Synth → Compressor → EQ → Reverb → Audio Out. Each processes the output of the previous.',
      type: 'connect',
      details: {
        chain: ['synth', 'compressor', 'eq', 'reverb', 'audio-out'],
      },
      validation: {
        type: 'custom',
        expected: { chainLength: 4 },
        errorMessage: 'Create a chain of at least 4 cards',
      },
    },
    {
      id: 'create-parallel-split',
      title: 'Create Parallel Split',
      instruction: 'Connect one synth output to TWO different effect chains (e.g., one dry, one with heavy reverb). Then mix them back together.',
      type: 'connect',
      details: {
        action: 'parallel-routing',
      },
      hint: 'Use a Mixer card to recombine parallel signals',
    },
    {
      id: 'add-send-effect',
      title: 'Add Send/Return',
      instruction: 'Create a send: Synth → Send card → Reverb → Return → Mixer. This lets multiple tracks share one effect.',
      type: 'edit',
      details: {
        action: 'create-send',
      },
      hint: 'Sends are efficient for shared effects like reverb',
    },
    {
      id: 'use-sidechain',
      title: 'Use Sidechain',
      instruction: 'Connect kick drum to a compressor\'s sidechain input. Now the kick will duck (lower) other instruments for that "pumping" effect.',
      type: 'connect',
      details: {
        from: 'kick',
        to: 'compressor',
        portType: 'sidechain',
      },
      hint: 'Sidechain is huge in EDM for pumping bass',
    },
    {
      id: 'create-feedback',
      title: 'Create Feedback Loop',
      instruction: 'Connect a delay\'s output back to its input (with a Feedback card to prevent runaway). This creates infinite delay repeats.',
      type: 'connect',
      details: {
        action: 'feedback-loop',
      },
      hint: 'Always use a feedback card to prevent infinite loops',
    },
    {
      id: 'congrats',
      title: 'Routing Master!',
      instruction: 'Incredible! You understand CardPlay\'s flexible routing. Experiment with complex chains, parallel processing, and creative routing!',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A complex routing setup with serial, parallel, and send/return',
    expectedCards: ['synth', 'effects', 'mixer', 'send', 'audio-out'],
  },
  tags: ['advanced', 'routing', 'signal-flow', 'workflow'],
};

/**
 * Graph Routing - Master complex graph-based routing.
 */
export const GRAPH_ROUTING_TUTORIAL: Tutorial = {
  id: 'graph-routing',
  name: 'Graph Routing',
  description: 'Go beyond linear chains with graph-based routing for complex signal flow',
  emoji: '🕸️',
  category: 'advanced',
  difficulty: 'advanced',
  estimatedTime: 420,
  prerequisites: ['card-stacking'],
  learningGoals: [
    'Switch from stacks to graph view',
    'Create complex multi-path routing',
    'Use feedback and modulation routing',
    'Optimize signal flow',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Beyond Linear Chains',
      instruction: 'Sometimes you need more than a linear chain. Graph mode lets you route signals anywhere, creating complex patches like modular synths.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'switch-to-graph',
      title: 'Enable Graph View',
      instruction: 'Click the "Graph Mode" button to switch from stacks to a free-form node graph. Now you can position cards anywhere.',
      type: 'edit',
      details: {
        action: 'enable-graph-mode',
      },
    },
    {
      id: 'create-split',
      title: 'Create Signal Split',
      instruction: 'Connect one LFO output to THREE different card inputs (filter cutoff, reverb mix, panner). One source, multiple destinations.',
      type: 'connect',
      details: {
        from: 'lfo',
        to: ['filter-cutoff', 'reverb-mix', 'panner'],
      },
    },
    {
      id: 'create-merge',
      title: 'Merge Multiple Signals',
      instruction: 'Connect three oscillators to a single mixer input. Multiple sources, one destination.',
      type: 'connect',
      details: {
        from: ['osc1', 'osc2', 'osc3'],
        to: 'mixer',
      },
    },
    {
      id: 'modulation-routing',
      title: 'Route Modulation',
      instruction: 'Connect envelope outputs to multiple parameters: one envelope controls filter, amp, and pitch simultaneously.',
      type: 'connect',
      details: {
        from: 'envelope',
        toParams: ['filter-cutoff', 'amp-level', 'pitch-bend'],
      },
      hint: 'Modulation routing uses dotted orange lines',
    },
    {
      id: 'validate-graph',
      title: 'Check for Cycles',
      instruction: 'Click "Validate Graph" to ensure no infinite loops. CardPlay will detect cycles and suggest fixes.',
      type: 'validation',
      details: {},
      validation: {
        type: 'custom',
        expected: { noCycles: true },
        errorMessage: 'Graph contains cycles—remove feedback loops or add delay',
      },
    },
    {
      id: 'auto-layout',
      title: 'Auto-Arrange',
      instruction: 'Click "Auto Layout" to automatically position cards for clear signal flow visualization.',
      type: 'edit',
      details: {
        action: 'auto-layout',
      },
    },
    {
      id: 'congrats',
      title: 'Graph Routing Master!',
      instruction: 'You\'ve mastered graph routing! Now you can create any signal flow you can imagine—from simple to modular-synth complex.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A complex graph with splits, merges, and modulation routing',
    expectedCards: ['lfo', 'envelope', 'oscillators', 'filter', 'mixer', 'effects'],
  },
  tags: ['advanced', 'graph', 'routing', 'modular', 'workflow'],
};

/**
 * Preset Power - Master presets and parameters.
 */
export const PRESET_POWER_TUTORIAL: Tutorial = {
  id: 'preset-power',
  name: 'Preset Power',
  description: 'Learn to use, customize, and create your own presets',
  emoji: '💾',
  category: 'workflow',
  difficulty: 'intermediate',
  estimatedTime: 300,
  prerequisites: ['synthesis-start', 'effect-essentials'],
  learningGoals: [
    'Browse and load presets',
    'Customize preset parameters',
    'Save your own presets',
    'Organize preset library',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Presets = Starting Points',
      instruction: 'Presets are collections of parameter settings. They give you pro sounds instantly, which you can then customize.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'browse-presets',
      title: 'Browse Presets',
      instruction: 'Click the preset browser icon on a synth card. Browse by category (bass, lead, pad, etc.).',
      type: 'edit',
      details: {
        action: 'open-preset-browser',
      },
    },
    {
      id: 'load-preset',
      title: 'Load a Preset',
      instruction: 'Select "Fat Analog Bass" from the Bass category. Hear how the sound changes.',
      type: 'edit',
      details: {
        preset: 'fat-analog-bass',
      },
      validation: {
        type: 'parameter-value',
        expected: { presetName: 'fat-analog-bass' },
        errorMessage: 'Load the "Fat Analog Bass" preset',
      },
    },
    {
      id: 'tweak-preset',
      title: 'Customize Parameters',
      instruction: 'Adjust the filter cutoff to make it brighter. Change attack time to make it more punchy. You\'re customizing the preset.',
      type: 'set-parameter',
      details: {
        card: 'synth',
        parameters: ['filter-cutoff', 'attack'],
      },
      hint: 'Modified presets show a * indicator',
    },
    {
      id: 'save-preset',
      title: 'Save Your Preset',
      instruction: 'Click "Save Preset As..." and name it "My Fat Bass". Now it\'s in your user presets library.',
      type: 'edit',
      details: {
        action: 'save-preset',
      },
    },
    {
      id: 'preset-tags',
      title: 'Tag Your Preset',
      instruction: 'Add tags like "bass", "analog", "heavy" to make it easy to find later.',
      type: 'edit',
      details: {
        action: 'add-preset-tags',
      },
      hint: 'Good tags help you find presets quickly',
    },
    {
      id: 'favorite-preset',
      title: 'Mark as Favorite',
      instruction: 'Click the star icon on your favorite presets to add them to your favorites list.',
      type: 'edit',
      details: {
        action: 'favorite-preset',
      },
    },
    {
      id: 'congrats',
      title: 'Preset Pro!',
      instruction: 'Awesome! You can now browse, customize, and save presets. Build your own library of go-to sounds.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A custom preset library with tagged, organized sounds',
    expectedCards: ['synth', 'custom-presets'],
  },
  tags: ['intermediate', 'presets', 'workflow', 'organization'],
};

/**
 * Template Time - Use and create project templates.
 */
export const TEMPLATE_TIME_TUTORIAL: Tutorial = {
  id: 'template-time',
  name: 'Template Time',
  description: 'Speed up your workflow with project templates',
  emoji: '📐',
  category: 'workflow',
  difficulty: 'intermediate',
  estimatedTime: 240,
  prerequisites: ['mixing-basics'],
  learningGoals: [
    'Load genre-specific templates',
    'Understand template structure',
    'Customize and save templates',
    'Create quick-start setups',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Templates = Fast Starts',
      instruction: 'Templates are pre-configured projects with cards, routing, and settings. They let you start making music immediately.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'load-template',
      title: 'Load a Template',
      instruction: 'File → New from Template → "Pop Song Starter". This loads drums, bass, keys, vocal track—ready to go.',
      type: 'edit',
      details: {
        action: 'load-template',
        template: 'pop-song-starter',
      },
    },
    {
      id: 'explore-template',
      title: 'Explore Template Structure',
      instruction: 'Look at the cards, routing, and mixer settings. Templates include effect chains, send busses, and proper gain staging.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'customize-template',
      title: 'Customize the Template',
      instruction: 'Add your favorite reverb to the send bus. Change the drum kit. Adjust mixer levels to your taste.',
      type: 'edit',
      details: {
        action: 'customize-template',
      },
    },
    {
      id: 'save-template',
      title: 'Save as Template',
      instruction: 'File → Save as Template → "My Pop Template". Now you have a custom starting point.',
      type: 'edit',
      details: {
        action: 'save-template',
      },
    },
    {
      id: 'create-minimal',
      title: 'Create Minimal Template',
      instruction: 'Create a simple template with just your most-used cards: one synth, one drum kit, mixer, effects. Save as "Quick Jam".',
      type: 'edit',
      details: {
        action: 'create-minimal-template',
      },
      hint: 'Minimal templates are great for quick ideas',
    },
    {
      id: 'congrats',
      title: 'Template Master!',
      instruction: 'Perfect! Templates save you tons of setup time. Create templates for different genres and workflows.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'Custom templates for your favorite workflows',
    expectedCards: ['template-library'],
  },
  tags: ['intermediate', 'templates', 'workflow', 'productivity'],
};

/**
 * Export Excellence - Master export and bounce settings.
 */
export const EXPORT_EXCELLENCE_TUTORIAL: Tutorial = {
  id: 'export-excellence',
  name: 'Export Excellence',
  description: 'Learn to export your music in the right format for any destination',
  emoji: '📤',
  category: 'workflow',
  difficulty: 'intermediate',
  estimatedTime: 240,
  prerequisites: ['mixing-basics'],
  learningGoals: [
    'Choose the right export format',
    'Set proper sample rate and bit depth',
    'Export stems for collaboration',
    'Prepare for mastering',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Export = Share Your Music',
      instruction: 'Exporting turns your project into an audio file others can hear. Different destinations need different formats.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'export-master',
      title: 'Export Master Mix',
      instruction: 'File → Export → Master Mix. This exports your full song as one stereo audio file.',
      type: 'edit',
      details: {
        action: 'export-master',
      },
    },
    {
      id: 'choose-format-mp3',
      title: 'Export for Streaming',
      instruction: 'For SoundCloud/Spotify demos, use: MP3, 320kbps, 44.1kHz. Good quality, small file size.',
      type: 'edit',
      details: {
        format: 'mp3',
        bitrate: 320,
        sampleRate: 44100,
      },
    },
    {
      id: 'choose-format-wav',
      title: 'Export for Mastering',
      instruction: 'For professional mastering, use: WAV, 24-bit, 48kHz. Maximum quality, no compression.',
      type: 'edit',
      details: {
        format: 'wav',
        bitDepth: 24,
        sampleRate: 48000,
      },
      hint: 'Leave headroom (peak around -6dB) for mastering',
    },
    {
      id: 'export-stems',
      title: 'Export Stems',
      instruction: 'File → Export → Stems. This exports each track separately (drums, bass, vocals, etc.) for remixing or collaboration.',
      type: 'edit',
      details: {
        action: 'export-stems',
      },
    },
    {
      id: 'normalize-loudness',
      title: 'Normalize Loudness',
      instruction: 'Enable "Normalize to -14 LUFS" for streaming platforms. This ensures consistent loudness.',
      type: 'set-parameter',
      details: {
        parameter: 'normalize-lufs',
        value: -14,
      },
      hint: 'Spotify/YouTube target -14 LUFS',
    },
    {
      id: 'batch-export',
      title: 'Batch Export',
      instruction: 'Export multiple formats at once: MP3 for sharing + WAV for archiving. Check "Export Multiple Formats".',
      type: 'edit',
      details: {
        action: 'batch-export',
      },
    },
    {
      id: 'congrats',
      title: 'Export Expert!',
      instruction: 'Excellent! You know how to export for any destination. Your music is ready to share with the world!',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'Exported files in multiple formats ready for distribution',
    expectedCards: ['export-settings'],
  },
  tags: ['intermediate', 'export', 'format', 'workflow', 'distribution'],
};

/**
 * Collaboration - Work with others on music.
 */
export const COLLABORATION_TUTORIAL: Tutorial = {
  id: 'collaboration',
  name: 'Collaboration',
  description: 'Learn to collaborate with other musicians and producers',
  emoji: '🤝',
  category: 'workflow',
  difficulty: 'intermediate',
  estimatedTime: 300,
  prerequisites: ['export-excellence'],
  learningGoals: [
    'Share projects with collaborators',
    'Handle version control',
    'Export stems for others',
    'Import collaborator files',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Making Music Together',
      instruction: 'Collaboration means working with others. CardPlay makes it easy to share projects, stems, and ideas.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'export-project',
      title: 'Export Project Package',
      instruction: 'File → Export → Project Package. This creates a .cardplay file with all samples and settings.',
      type: 'edit',
      details: {
        action: 'export-project-package',
      },
    },
    {
      id: 'share-link',
      title: 'Generate Share Link',
      instruction: 'Click "Share" to upload your project to CardPlay Cloud. Get a link to send to collaborators.',
      type: 'edit',
      details: {
        action: 'generate-share-link',
      },
      hint: 'Cloud projects can be opened by anyone with the link',
    },
    {
      id: 'import-collab',
      title: 'Import Collaborator Changes',
      instruction: 'When a collaborator sends you their version, File → Import → Merge Changes. Review and accept their edits.',
      type: 'edit',
      details: {
        action: 'import-merge-changes',
      },
    },
    {
      id: 'export-stems-collab',
      title: 'Export Stems for Remix',
      instruction: 'Export stems for a remix artist: File → Export → Stems (Dry). This removes effects so they can add their own.',
      type: 'edit',
      details: {
        action: 'export-stems-dry',
      },
    },
    {
      id: 'version-control',
      title: 'Save Versions',
      instruction: 'Before major changes, File → Save Version → "Before Remix". This lets you roll back if needed.',
      type: 'edit',
      details: {
        action: 'save-version',
      },
      hint: 'Version history prevents losing work',
    },
    {
      id: 'add-notes',
      title: 'Add Collaboration Notes',
      instruction: 'Add notes to the project: "Vocals need tuning" or "Change bass in chorus". Collaborators will see these.',
      type: 'edit',
      details: {
        action: 'add-collab-notes',
      },
    },
    {
      id: 'congrats',
      title: 'Collaboration Pro!',
      instruction: 'Amazing! You can now collaborate seamlessly. Make music with anyone, anywhere.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A collaborative project with versions and shared stems',
    expectedCards: ['project-package', 'version-history'],
  },
  tags: ['intermediate', 'collaboration', 'workflow', 'sharing'],
};

/**
 * Advanced Tricks - Power user tips and tricks.
 */
export const ADVANCED_TRICKS_TUTORIAL: Tutorial = {
  id: 'advanced-tricks',
  name: 'Advanced Tricks',
  description: 'Learn pro shortcuts, hidden features, and power user techniques',
  emoji: '🎩',
  category: 'advanced',
  difficulty: 'advanced',
  estimatedTime: 360,
  prerequisites: ['automation-magic', 'graph-routing', 'preset-power'],
  learningGoals: [
    'Master keyboard shortcuts',
    'Use hidden power features',
    'Optimize your workflow',
    'Discover secret techniques',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Level Up Your Skills',
      instruction: 'You know the basics. Now learn the tricks that make pros fast and creative.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'quick-add',
      title: 'Quick Add Cards',
      instruction: 'Press "/" to open quick add. Type card name and hit Enter. Way faster than clicking.',
      type: 'edit',
      details: {
        shortcut: '/',
        action: 'quick-add-card',
      },
      hint: 'Try: "/synth" → Enter → instant synth card',
    },
    {
      id: 'duplicate-trick',
      title: 'Duplicate with Settings',
      instruction: 'Select a card, press Cmd+D (Ctrl+D). This duplicates the card WITH all your custom settings.',
      type: 'edit',
      details: {
        shortcut: 'cmd-d',
      },
    },
    {
      id: 'parameter-linking',
      title: 'Link Parameters',
      instruction: 'Right-click any knob → "Link to...". Now two parameters move together. Great for consistent control.',
      type: 'set-parameter',
      details: {
        action: 'link-parameters',
      },
    },
    {
      id: 'randomize-smart',
      title: 'Smart Randomize',
      instruction: 'Right-click card → "Randomize Parameters (Musically)". Gets random but musical variations.',
      type: 'edit',
      details: {
        action: 'smart-randomize',
      },
      hint: 'Unlike full random, this stays musical',
    },
    {
      id: 'freeze-track',
      title: 'Freeze Tracks',
      instruction: 'Heavy CPU use? Click "Freeze Track" to render it to audio. Frees up CPU without losing editability.',
      type: 'edit',
      details: {
        action: 'freeze-track',
      },
    },
    {
      id: 'macro-recording',
      title: 'Record Macros',
      instruction: 'Click "Record Macro" and perform actions. Play it back to repeat complex workflows instantly.',
      type: 'edit',
      details: {
        action: 'record-macro',
      },
    },
    {
      id: 'midi-learn',
      title: 'MIDI Learn Everything',
      instruction: 'Right-click any control → "MIDI Learn". Move your MIDI knob. Now hardware controls that parameter.',
      type: 'set-parameter',
      details: {
        action: 'midi-learn',
      },
      hint: 'Map your whole controller in minutes',
    },
    {
      id: 'preset-morph',
      title: 'Morph Between Presets',
      instruction: 'Load preset A, load preset B, click "Morph". Drag slider to blend between them smoothly.',
      type: 'edit',
      details: {
        action: 'preset-morph',
      },
    },
    {
      id: 'congrats',
      title: 'Power User!',
      instruction: 'You\'re now a CardPlay power user! These tricks will make you incredibly fast and creative.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A workflow utilizing shortcuts, macros, and advanced techniques',
    expectedCards: ['frozen-tracks', 'macros', 'midi-mappings'],
  },
  tags: ['advanced', 'shortcuts', 'workflow', 'power-user', 'tricks'],
};

/**
 * Pro Workflow - Professional production techniques.
 */
export const PRO_WORKFLOW_TUTORIAL: Tutorial = {
  id: 'pro-workflow',
  name: 'Pro Workflow',
  description: 'Learn professional production workflow from idea to finished track',
  emoji: '🎬',
  category: 'workflow',
  difficulty: 'advanced',
  estimatedTime: 480,
  prerequisites: ['mixing-basics', 'export-excellence', 'advanced-tricks'],
  learningGoals: [
    'Organize projects professionally',
    'Use reference tracks effectively',
    'Work non-destructively',
    'Prepare for release',
  ],
  steps: [
    {
      id: 'intro',
      title: 'Think Like a Pro',
      instruction: 'Pros work efficiently and stay organized. Learn the workflow that turns ideas into releases.',
      type: 'instruction',
      details: {},
    },
    {
      id: 'organize-project',
      title: 'Name Everything',
      instruction: 'Name your tracks, cards, and clips clearly. "Lead Synth Chorus" beats "Synth 3" when you have 50 tracks.',
      type: 'edit',
      details: {
        action: 'rename-all',
      },
      hint: 'Future you will thank present you',
    },
    {
      id: 'use-colors',
      title: 'Color-Code Tracks',
      instruction: 'Color drums blue, bass red, melodies green, vocals yellow. Visual organization speeds up workflow.',
      type: 'edit',
      details: {
        action: 'color-code-tracks',
      },
    },
    {
      id: 'reference-track',
      title: 'Load Reference Track',
      instruction: 'Import a reference track in your genre. A/B compare to check your mix, loudness, and arrangement.',
      type: 'edit',
      details: {
        action: 'import-reference',
      },
    },
    {
      id: 'gain-staging',
      title: 'Gain Stage Properly',
      instruction: 'Set every track to peak around -12dB. This prevents clipping and gives headroom for the master bus.',
      type: 'set-parameter',
      details: {
        action: 'gain-stage-all',
      },
      hint: 'Good gain staging prevents distortion',
    },
    {
      id: 'bus-organization',
      title: 'Create Bus Groups',
      instruction: 'Send all drums to "Drum Bus", all synths to "Synth Bus". Process groups together for cohesion.',
      type: 'edit',
      details: {
        action: 'create-bus-groups',
      },
    },
    {
      id: 'version-saves',
      title: 'Save Versions at Milestones',
      instruction: 'After arrangement: "v1-arrangement". After mixing: "v2-mixed". After mastering: "v3-mastered".',
      type: 'edit',
      details: {
        action: 'save-milestone-versions',
      },
    },
    {
      id: 'documentation',
      title: 'Document Your Work',
      instruction: 'Add project notes: BPM, key, reference artists, ideas for next session. Future you needs this.',
      type: 'edit',
      details: {
        action: 'add-project-documentation',
      },
    },
    {
      id: 'export-checklist',
      title: 'Pre-Release Checklist',
      instruction: 'Check: No clipping, consistent loudness, proper fades, metadata filled, backups saved. Ready for release!',
      type: 'validation',
      details: {},
      validation: {
        type: 'custom',
        expected: { checklistComplete: true },
        errorMessage: 'Complete all pre-release checks',
      },
    },
    {
      id: 'congrats',
      title: 'Pro Producer!',
      instruction: 'Phenomenal! You now have a professional workflow. You\'re ready to make release-quality music.',
      type: 'instruction',
      details: {},
    },
  ],
  finalProject: {
    description: 'A professionally organized, documented project ready for release',
    expectedCards: ['organized-tracks', 'bus-groups', 'reference-track', 'documentation'],
  },
  tags: ['advanced', 'workflow', 'professional', 'organization', 'production'],
};

// ============================================================================
// TUTORIAL CATALOG REGISTRY
// ============================================================================

/**
 * All available tutorials.
 */
export const TUTORIALS: Record<string, Tutorial> = {
  'your-first-note': YOUR_FIRST_NOTE_TUTORIAL,
  'building-drums': BUILDING_DRUMS_TUTORIAL,
  'writing-chords': WRITING_CHORDS_TUTORIAL,
  'melody-101': MELODY_101_TUTORIAL,
  'bass-fundamentals': BASS_FUNDAMENTALS_TUTORIAL,
  'mixing-basics': MIXING_BASICS_TUTORIAL,
  'effect-essentials': EFFECT_ESSENTIALS_TUTORIAL,
  'automation-magic': AUTOMATION_MAGIC_TUTORIAL,
  'sampling-school': SAMPLING_SCHOOL_TUTORIAL,
  'synthesis-start': SYNTHESIS_START_TUTORIAL,
  'recording-ready': RECORDING_READY_TUTORIAL,
  'performance-mode': PERFORMANCE_MODE_TUTORIAL,
  'card-stacking': CARD_STACKING_TUTORIAL,
  'graph-routing': GRAPH_ROUTING_TUTORIAL,
  'preset-power': PRESET_POWER_TUTORIAL,
  'template-time': TEMPLATE_TIME_TUTORIAL,
  'export-excellence': EXPORT_EXCELLENCE_TUTORIAL,
  'collaboration': COLLABORATION_TUTORIAL,
  'advanced-tricks': ADVANCED_TRICKS_TUTORIAL,
  'pro-workflow': PRO_WORKFLOW_TUTORIAL,
};

/**
 * Get tutorial by ID.
 */
export function getTutorial(id: string): Tutorial | null {
  return TUTORIALS[id] || null;
}

/**
 * Get all tutorials.
 */
export function getAllTutorials(): Tutorial[] {
  return Object.values(TUTORIALS);
}

/**
 * Get tutorials filtered by category.
 */
export function getTutorialsByCategory(category: Tutorial['category']): Tutorial[] {
  return getAllTutorials().filter(tut => tut.category === category);
}

/**
 * Get tutorials filtered by difficulty.
 */
export function getTutorialsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Tutorial[] {
  return getAllTutorials().filter(tut => tut.difficulty === difficulty);
}

/**
 * Get tutorials with no prerequisites (good starting points).
 */
export function getStarterTutorials(): Tutorial[] {
  return getAllTutorials().filter(tut => tut.prerequisites.length === 0);
}

/**
 * Get next recommended tutorial based on completed tutorials.
 */
export function getNextTutorial(completedIds: string[]): Tutorial | null {
  const allTutorials = getAllTutorials();
  
  // Filter out completed tutorials
  const uncompletedTutorials = allTutorials.filter(tut => !completedIds.includes(tut.id));
  
  if (uncompletedTutorials.length === 0) {
    return null;
  }
  
  // Find tutorials where all prerequisites are met
  const availableTutorials = uncompletedTutorials.filter(tut => {
    return tut.prerequisites.every(prereqId => completedIds.includes(prereqId));
  });
  
  if (availableTutorials.length === 0) {
    return null;
  }
  
  // Sort by difficulty, then by category
  const sortedTutorials = availableTutorials.sort((a, b) => {
    const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    const diffDiff = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    if (diffDiff !== 0) return diffDiff;
    return a.category.localeCompare(b.category);
  });
  
  return sortedTutorials[0] || null;
}

/**
 * Check if tutorial is available (prerequisites met).
 */
export function isTutorialAvailable(tutorialId: string, completedIds: string[]): boolean {
  const tutorial = getTutorial(tutorialId);
  if (!tutorial) return false;
  
  return tutorial.prerequisites.every(prereqId => completedIds.includes(prereqId));
}

/**
 * Get learning path - ordered sequence of tutorials.
 */
export function getLearningPath(): Tutorial[] {
  const allTutorials = getAllTutorials();
  
  // Topological sort based on prerequisites
  const sorted: Tutorial[] = [];
  const visited = new Set<string>();
  
  function visit(tutorial: Tutorial) {
    if (visited.has(tutorial.id)) return;
    
    // Visit prerequisites first
    tutorial.prerequisites.forEach(prereqId => {
      const prereqTutorial = getTutorial(prereqId);
      if (prereqTutorial) {
        visit(prereqTutorial);
      }
    });
    
    visited.add(tutorial.id);
    sorted.push(tutorial);
  }
  
  allTutorials.forEach(visit);
  
  return sorted;
}

/**
 * Get user progress - which tutorials are locked/available/completed.
 */
export function getTutorialProgress(completedIds: string[]): {
  completed: Tutorial[];
  available: Tutorial[];
  locked: Tutorial[];
} {
  const allTutorials = getAllTutorials();
  
  const completed = allTutorials.filter(tut => completedIds.includes(tut.id));
  const available = allTutorials.filter(tut => 
    !completedIds.includes(tut.id) && isTutorialAvailable(tut.id, completedIds)
  );
  const locked = allTutorials.filter(tut =>
    !completedIds.includes(tut.id) && !isTutorialAvailable(tut.id, completedIds)
  );
  
  return { completed, available, locked };
}
