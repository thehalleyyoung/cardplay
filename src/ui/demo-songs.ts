/**
 * @fileoverview Demo Song Definitions - Focused mini-tutorials showing specific capabilities.
 * 
 * This module provides small, focused demonstrations that teach specific music production
 * concepts. Unlike demo decks (which are complete production setups), demo songs are
 * bite-sized lessons that highlight a single technique or workflow.
 * 
 * @see currentsteps.md Phase 7.3: Demo Songs (lines 2078-2099)
 */

// ============================================================================
// DEMO SONG TYPES
// ============================================================================

/**
 * Demo song - A focused, bite-sized music production lesson.
 */
export interface DemoSong {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly category: 'rhythm' | 'melody' | 'harmony' | 'mixing' | 'effects' | 'arrangement' | 'sampling' | 'performance';
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
  readonly estimatedTime: number; // seconds to complete
  readonly learningObjective: string;
  readonly steps: readonly DemoSongStep[];
  readonly finalState: {
    readonly cards: readonly string[]; // card types used
    readonly tempo: number;
    readonly key: string;
  };
  readonly tags: readonly string[];
}

/**
 * Single step in a demo song tutorial.
 */
export interface DemoSongStep {
  readonly title: string;
  readonly instruction: string;
  readonly action: 'add-card' | 'set-parameter' | 'connect' | 'play' | 'record' | 'edit';
  readonly details: Record<string, unknown>;
}

// ============================================================================
// DEMO SONG CATALOG
// ============================================================================

/**
 * First Beat - Create a simple 4-bar drum loop.
 */
export const FIRST_BEAT_DEMO: DemoSong = {
  id: 'first-beat',
  name: 'First Beat',
  description: 'Create your first 4-bar drum loop in under 60 seconds',
  emoji: '🥁',
  category: 'rhythm',
  difficulty: 'beginner',
  estimatedTime: 60,
  learningObjective: 'Learn to create a basic drum pattern using a drum machine card',
  steps: [
    {
      title: 'Add Drum Machine',
      instruction: 'Drag a Drum Machine card onto the canvas',
      action: 'add-card',
      details: {
        cardType: 'drum-machine',
        position: { x: 100, y: 100 },
      },
    },
    {
      title: 'Select Preset',
      instruction: 'Choose the "Basic Beat" preset from the dropdown',
      action: 'set-parameter',
      details: {
        parameter: 'preset',
        value: 'basic-beat',
      },
    },
    {
      title: 'Set Tempo',
      instruction: 'Adjust tempo to 120 BPM',
      action: 'set-parameter',
      details: {
        parameter: 'tempo',
        value: 120,
      },
    },
    {
      title: 'Play',
      instruction: 'Press the play button to hear your beat',
      action: 'play',
      details: {
        looping: true,
      },
    },
    {
      title: 'Adjust Pattern',
      instruction: 'Click on drum pads to toggle different hits',
      action: 'edit',
      details: {
        editMode: 'grid',
      },
    },
  ],
  finalState: {
    cards: ['drum-machine'],
    tempo: 120,
    key: 'C',
  },
  tags: ['beginner', 'drums', 'rhythm', 'quick-start'],
};

/**
 * Chord Journey - Create a 4-chord progression.
 */
export const CHORD_JOURNEY_DEMO: DemoSong = {
  id: 'chord-journey',
  name: 'Chord Journey',
  description: 'Build an emotional 4-chord progression that tells a story',
  emoji: '🎹',
  category: 'harmony',
  difficulty: 'beginner',
  estimatedTime: 90,
  learningObjective: 'Understand chord progressions and how they create emotion',
  steps: [
    {
      title: 'Add Chord Progression Card',
      instruction: 'Place a Chord Progression card on the canvas',
      action: 'add-card',
      details: {
        cardType: 'chord-progression',
        position: { x: 100, y: 100 },
      },
    },
    {
      title: 'Set Key',
      instruction: 'Choose C Major as your key',
      action: 'set-parameter',
      details: {
        parameter: 'key',
        value: 'C Major',
      },
    },
    {
      title: 'Build Progression',
      instruction: 'Create the classic I-V-vi-IV progression (C-G-Am-F)',
      action: 'edit',
      details: {
        progression: ['C', 'G', 'Am', 'F'],
      },
    },
    {
      title: 'Add Piano',
      instruction: 'Add a Piano card and connect the chord progression to it',
      action: 'add-card',
      details: {
        cardType: 'piano',
        preset: 'grand-piano',
      },
    },
    {
      title: 'Connect Cards',
      instruction: 'Draw a connection from Chord Progression output to Piano input',
      action: 'connect',
      details: {
        from: 'chord-progression',
        to: 'piano',
      },
    },
    {
      title: 'Play and Listen',
      instruction: 'Press play and hear how the chords create emotion',
      action: 'play',
      details: {
        looping: true,
      },
    },
  ],
  finalState: {
    cards: ['chord-progression', 'piano'],
    tempo: 90,
    key: 'C Major',
  },
  tags: ['beginner', 'chords', 'harmony', 'piano', 'emotion'],
};

/**
 * Melody Flow - Create a flowing melodic line.
 */
export const MELODY_FLOW_DEMO: DemoSong = {
  id: 'melody-flow',
  name: 'Melody Flow',
  description: 'Craft a memorable melody that flows naturally over chords',
  emoji: '🎵',
  category: 'melody',
  difficulty: 'intermediate',
  estimatedTime: 120,
  learningObjective: 'Learn melody creation using scale constraints and contour shaping',
  steps: [
    {
      title: 'Add Melody Card',
      instruction: 'Place a Melody Generator card on the canvas',
      action: 'add-card',
      details: {
        cardType: 'melody',
        position: { x: 100, y: 100 },
      },
    },
    {
      title: 'Set Scale',
      instruction: 'Choose C Major Pentatonic for easy, pleasant melodies',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C Major Pentatonic',
      },
    },
    {
      title: 'Shape Contour',
      instruction: 'Select "Arch" contour for a rising-then-falling melody',
      action: 'set-parameter',
      details: {
        parameter: 'contour',
        value: 'arch',
      },
    },
    {
      title: 'Set Rhythm',
      instruction: 'Choose "Medium Flow" rhythm for natural phrasing',
      action: 'set-parameter',
      details: {
        parameter: 'rhythm',
        value: 'medium-flow',
      },
    },
    {
      title: 'Add Synth',
      instruction: 'Add a Lead Synth card and connect melody to it',
      action: 'add-card',
      details: {
        cardType: 'lead-synth',
        preset: 'bright-lead',
      },
    },
    {
      title: 'Connect',
      instruction: 'Connect Melody output to Lead Synth input',
      action: 'connect',
      details: {
        from: 'melody',
        to: 'lead-synth',
      },
    },
    {
      title: 'Play and Refine',
      instruction: 'Listen and adjust density/range until it sounds right',
      action: 'play',
      details: {
        looping: true,
      },
    },
  ],
  finalState: {
    cards: ['melody', 'lead-synth'],
    tempo: 110,
    key: 'C Major',
  },
  tags: ['intermediate', 'melody', 'synthesis', 'contour', 'scale'],
};

/**
 * Bass Drop - Create a powerful sub-bass drop.
 */
export const BASS_DROP_DEMO: DemoSong = {
  id: 'bass-drop',
  name: 'Bass Drop',
  description: 'Design a powerful sub-bass drop that shakes the room',
  emoji: '🔊',
  category: 'mixing',
  difficulty: 'intermediate',
  estimatedTime: 150,
  learningObjective: 'Learn bass sound design with filtering, distortion, and sub-bass layering',
  steps: [
    {
      title: 'Add Bass Synth',
      instruction: 'Place a Bass Synth card on the canvas',
      action: 'add-card',
      details: {
        cardType: 'bass-synth',
        position: { x: 100, y: 100 },
      },
    },
    {
      title: 'Choose Sub-Bass Preset',
      instruction: 'Select "Deep Sub" preset for low-end power',
      action: 'set-parameter',
      details: {
        parameter: 'preset',
        value: 'deep-sub',
      },
    },
    {
      title: 'Layer with Mid Bass',
      instruction: 'Add second bass card with "Growl Bass" preset for mid-range',
      action: 'add-card',
      details: {
        cardType: 'bass-synth',
        preset: 'growl-bass',
      },
    },
    {
      title: 'Add Filter Automation',
      instruction: 'Create a low-pass filter sweep from 200Hz to 8kHz',
      action: 'edit',
      details: {
        automation: 'filter-cutoff',
        curve: 'exponential',
      },
    },
    {
      title: 'Add Distortion',
      instruction: 'Place a Distortion effect card after the mid bass',
      action: 'add-card',
      details: {
        cardType: 'distortion',
        amount: 0.6,
      },
    },
    {
      title: 'Connect Cards',
      instruction: 'Route both bass layers through a mixer card',
      action: 'connect',
      details: {
        from: ['bass-synth-1', 'bass-synth-2'],
        to: 'mixer',
      },
    },
    {
      title: 'Set Sub Level',
      instruction: 'Adjust sub-bass to -3dB and mid-bass to -6dB for balance',
      action: 'set-parameter',
      details: {
        parameter: 'gain',
        values: [-3, -6],
      },
    },
    {
      title: 'Play the Drop',
      instruction: 'Press play and feel the bass hit',
      action: 'play',
      details: {
        looping: false,
      },
    },
  ],
  finalState: {
    cards: ['bass-synth', 'bass-synth', 'distortion', 'mixer'],
    tempo: 140,
    key: 'E',
  },
  tags: ['intermediate', 'bass', 'synthesis', 'mixing', 'effects', 'sub-bass'],
};

/**
 * Drum Fill - Create dynamic drum fills.
 */
export const DRUM_FILL_DEMO: DemoSong = {
  id: 'drum-fill',
  name: 'Drum Fill',
  description: 'Build exciting drum fills that transition between sections',
  emoji: '🥁',
  category: 'rhythm',
  difficulty: 'intermediate',
  estimatedTime: 120,
  learningObjective: 'Master drum fill techniques including rolls, tom patterns, and crash hits',
  steps: [
    {
      title: 'Add Drum Machine',
      instruction: 'Place a Drum Machine card on the canvas',
      action: 'add-card',
      details: {
        cardType: 'drum-machine',
        position: { x: 100, y: 100 },
      },
    },
    {
      title: 'Create Base Beat',
      instruction: 'Start with a simple 4-bar groove',
      action: 'set-parameter',
      details: {
        parameter: 'preset',
        value: 'basic-rock',
      },
    },
    {
      title: 'Add Fill Generator',
      instruction: 'Place a Fill Generator card and connect to drums',
      action: 'add-card',
      details: {
        cardType: 'fill-generator',
      },
    },
    {
      title: 'Configure Fill Type',
      instruction: 'Select "Tom Roll" fill style for classic rock feel',
      action: 'set-parameter',
      details: {
        parameter: 'fill-style',
        value: 'tom-roll',
      },
    },
    {
      title: 'Set Fill Length',
      instruction: 'Set fill to last 2 beats before section change',
      action: 'set-parameter',
      details: {
        parameter: 'length',
        value: 2,
      },
    },
    {
      title: 'Add Crash Hit',
      instruction: 'Enable crash cymbal on downbeat after fill',
      action: 'set-parameter',
      details: {
        parameter: 'crash-at-end',
        value: true,
      },
    },
    {
      title: 'Play and Compare',
      instruction: 'Toggle fill on/off to hear the difference',
      action: 'play',
      details: {
        looping: true,
      },
    },
  ],
  finalState: {
    cards: ['drum-machine', 'fill-generator'],
    tempo: 120,
    key: 'C',
  },
  tags: ['intermediate', 'drums', 'fills', 'transitions', 'arrangement'],
};

/**
 * Build & Release - Create tension and release.
 */
export const BUILD_RELEASE_DEMO: DemoSong = {
  id: 'build-release',
  name: 'Build & Release',
  description: 'Master the art of building tension and releasing it with a drop',
  emoji: '📈',
  category: 'arrangement',
  difficulty: 'advanced',
  estimatedTime: 180,
  learningObjective: 'Understand energy curves, risers, filter sweeps, and drop techniques',
  steps: [
    {
      title: 'Create Build Section',
      instruction: 'Add a Section card and set length to 8 bars',
      action: 'add-card',
      details: {
        cardType: 'section',
        length: 8,
      },
    },
    {
      title: 'Add Riser Effect',
      instruction: 'Place a Noise card with high-pass filter sweep',
      action: 'add-card',
      details: {
        cardType: 'noise-synth',
        filter: 'high-pass-sweep',
      },
    },
    {
      title: 'Add Drum Build',
      instruction: 'Create accelerating hi-hat rolls',
      action: 'edit',
      details: {
        pattern: 'hi-hat-acceleration',
      },
    },
    {
      title: 'Add Filter Automation',
      instruction: 'Automate low-pass filter closing from bar 5-8',
      action: 'edit',
      details: {
        automation: 'filter-cutoff',
        start: 20000,
        end: 200,
      },
    },
    {
      title: 'Add Snare Rolls',
      instruction: 'Create 16th note snare rolls in bars 7-8',
      action: 'edit',
      details: {
        pattern: 'snare-roll',
        bars: [7, 8],
      },
    },
    {
      title: 'Create Drop Section',
      instruction: 'Add new section after build with full energy',
      action: 'add-card',
      details: {
        cardType: 'section',
        energy: 1.0,
      },
    },
    {
      title: 'Add Impact Sound',
      instruction: 'Place an impact sample on the first beat of drop',
      action: 'add-card',
      details: {
        cardType: 'sampler',
        sample: 'impact-heavy',
      },
    },
    {
      title: 'Play Full Sequence',
      instruction: 'Listen to the build and drop transition',
      action: 'play',
      details: {
        looping: false,
      },
    },
  ],
  finalState: {
    cards: ['section', 'noise-synth', 'drum-machine', 'sampler'],
    tempo: 128,
    key: 'G',
  },
  tags: ['advanced', 'arrangement', 'tension', 'drop', 'energy', 'edm'],
};

/**
 * Vocal Chop - Create vocal chop effects.
 */
export const VOCAL_CHOP_DEMO: DemoSong = {
  id: 'vocal-chop',
  name: 'Vocal Chop',
  description: 'Chop and rearrange vocal samples into rhythmic patterns',
  emoji: '🎤',
  category: 'sampling',
  difficulty: 'intermediate',
  estimatedTime: 150,
  learningObjective: 'Learn sample slicing, chopping, and rhythmic arrangement techniques',
  steps: [
    {
      title: 'Load Vocal Sample',
      instruction: 'Add a Sampler card and load a vocal phrase',
      action: 'add-card',
      details: {
        cardType: 'sampler',
        sample: 'vocal-phrase',
      },
    },
    {
      title: 'Detect Slices',
      instruction: 'Use transient detection to find slice points',
      action: 'edit',
      details: {
        mode: 'slice-detection',
        sensitivity: 0.7,
      },
    },
    {
      title: 'Map to Pads',
      instruction: 'Assign each slice to a drum pad (auto-map)',
      action: 'set-parameter',
      details: {
        parameter: 'mapping',
        value: 'chromatic-from-C1',
      },
    },
    {
      title: 'Create Chop Pattern',
      instruction: 'Add a Sequencer card to trigger slices rhythmically',
      action: 'add-card',
      details: {
        cardType: 'sequencer',
      },
    },
    {
      title: 'Program Rhythm',
      instruction: 'Create a 16th note pattern with selected slices',
      action: 'edit',
      details: {
        pattern: '1-0-0-1-0-1-0-0-1-0-1-0-0-1-0-0',
      },
    },
    {
      title: 'Add Reverb',
      instruction: 'Place a Reverb effect for space',
      action: 'add-card',
      details: {
        cardType: 'reverb',
        mix: 0.3,
      },
    },
    {
      title: 'Connect Cards',
      instruction: 'Route Sequencer → Sampler → Reverb',
      action: 'connect',
      details: {
        from: 'sequencer',
        to: 'sampler',
        then: 'reverb',
      },
    },
    {
      title: 'Play Vocal Chops',
      instruction: 'Listen to the rhythmic vocal pattern',
      action: 'play',
      details: {
        looping: true,
      },
    },
  ],
  finalState: {
    cards: ['sampler', 'sequencer', 'reverb'],
    tempo: 125,
    key: 'D',
  },
  tags: ['intermediate', 'sampling', 'vocals', 'chopping', 'effects'],
};

/**
 * Synth Stack - Layer multiple synths.
 */
export const SYNTH_STACK_DEMO: DemoSong = {
  id: 'synth-stack',
  name: 'Synth Stack',
  description: 'Layer multiple synthesizers to create massive, full sounds',
  emoji: '🎹',
  category: 'mixing',
  difficulty: 'advanced',
  estimatedTime: 180,
  learningObjective: 'Master sound layering, frequency separation, and stereo widening',
  steps: [
    {
      title: 'Add Sub Layer',
      instruction: 'Place a Bass Synth card with sine wave sub-bass',
      action: 'add-card',
      details: {
        cardType: 'bass-synth',
        preset: 'pure-sub',
      },
    },
    {
      title: 'Add Mid Layer',
      instruction: 'Add a Synth card with saw wave for mid-range body',
      action: 'add-card',
      details: {
        cardType: 'synth',
        preset: 'analog-saw',
      },
    },
    {
      title: 'Add Top Layer',
      instruction: 'Add another Synth card with bright detuned saws',
      action: 'add-card',
      details: {
        cardType: 'synth',
        preset: 'supersaw',
      },
    },
    {
      title: 'EQ Separation',
      instruction: 'Add EQ to each layer: sub (low-pass 150Hz), mid (150Hz-5kHz), top (5kHz+)',
      action: 'add-card',
      details: {
        cardType: 'eq',
        perLayer: true,
      },
    },
    {
      title: 'Stereo Width',
      instruction: 'Keep sub mono, widen mid slightly, make top very wide',
      action: 'set-parameter',
      details: {
        parameter: 'stereo-width',
        values: [0, 0.4, 1.0],
      },
    },
    {
      title: 'Detune Top',
      instruction: 'Add slight detune (+/- 10 cents) to top layer for width',
      action: 'set-parameter',
      details: {
        parameter: 'detune',
        value: 10,
      },
    },
    {
      title: 'Mix Levels',
      instruction: 'Balance: sub -3dB, mid -6dB, top -9dB',
      action: 'set-parameter',
      details: {
        parameter: 'gain',
        values: [-3, -6, -9],
      },
    },
    {
      title: 'Play Stack',
      instruction: 'Hear the massive, layered sound',
      action: 'play',
      details: {
        looping: true,
      },
    },
  ],
  finalState: {
    cards: ['bass-synth', 'synth', 'synth', 'eq', 'eq', 'eq'],
    tempo: 128,
    key: 'F',
  },
  tags: ['advanced', 'synthesis', 'layering', 'mixing', 'stereo'],
};

/**
 * Mix Master - Basic mixing techniques.
 */
export const MIX_MASTER_DEMO: DemoSong = {
  id: 'mix-master',
  name: 'Mix Master',
  description: 'Learn essential mixing techniques: levels, EQ, compression, and space',
  emoji: '🎚️',
  category: 'mixing',
  difficulty: 'intermediate',
  estimatedTime: 240,
  learningObjective: 'Understand gain staging, frequency balance, dynamics, and spatial effects',
  steps: [
    {
      title: 'Set Initial Levels',
      instruction: 'Start with all faders at -6dB (headroom for mixing)',
      action: 'set-parameter',
      details: {
        parameter: 'fader',
        value: -6,
      },
    },
    {
      title: 'Balance Drums',
      instruction: 'Bring up drums first, adjust kick/snare relationship',
      action: 'set-parameter',
      details: {
        track: 'drums',
        kick: -3,
        snare: -6,
      },
    },
    {
      title: 'Add Bass',
      instruction: 'Bring in bass, ensure it works with kick (not masking)',
      action: 'set-parameter',
      details: {
        track: 'bass',
        level: -6,
      },
    },
    {
      title: 'EQ Cleanup',
      instruction: 'High-pass everything except kick/bass (remove sub-100Hz rumble)',
      action: 'add-card',
      details: {
        cardType: 'eq',
        filter: 'high-pass',
        frequency: 100,
      },
    },
    {
      title: 'Compression',
      instruction: 'Add gentle compression to vocals (4:1 ratio, -3dB reduction)',
      action: 'add-card',
      details: {
        cardType: 'compressor',
        ratio: 4,
        threshold: -12,
      },
    },
    {
      title: 'Add Space',
      instruction: 'Use reverb on sends (not inserts) for depth',
      action: 'add-card',
      details: {
        cardType: 'reverb',
        bus: 'send',
        mix: 0.2,
      },
    },
    {
      title: 'Stereo Imaging',
      instruction: 'Pan instruments left/right for width (keep bass/kick center)',
      action: 'set-parameter',
      details: {
        parameter: 'pan',
        values: { guitar: -0.4, keys: 0.4, vocals: 0 },
      },
    },
    {
      title: 'Reference Mix',
      instruction: 'A/B your mix against a reference track',
      action: 'play',
      details: {
        looping: true,
        reference: true,
      },
    },
  ],
  finalState: {
    cards: ['mixer', 'eq', 'compressor', 'reverb'],
    tempo: 120,
    key: 'A',
  },
  tags: ['intermediate', 'mixing', 'eq', 'compression', 'reverb', 'stereo'],
};

/**
 * Effect Chain - Build effect chains.
 */
export const EFFECT_CHAIN_DEMO: DemoSong = {
  id: 'effect-chain',
  name: 'Effect Chain',
  description: 'Create interesting sonic transformations with effect chains',
  emoji: '⚡',
  category: 'effects',
  difficulty: 'intermediate',
  estimatedTime: 150,
  learningObjective: 'Learn effect order, parallel processing, and creative sound design',
  steps: [
    {
      title: 'Start with Source',
      instruction: 'Add a simple synth or sample as starting sound',
      action: 'add-card',
      details: {
        cardType: 'synth',
        preset: 'simple-saw',
      },
    },
    {
      title: 'Add Distortion',
      instruction: 'Place a Distortion effect for harmonic content',
      action: 'add-card',
      details: {
        cardType: 'distortion',
        amount: 0.5,
      },
    },
    {
      title: 'Add Filter',
      instruction: 'Add a Filter card with resonance for character',
      action: 'add-card',
      details: {
        cardType: 'filter',
        type: 'low-pass',
        resonance: 0.7,
      },
    },
    {
      title: 'Add Delay',
      instruction: 'Place a Delay effect with feedback for space',
      action: 'add-card',
      details: {
        cardType: 'delay',
        time: '1/4',
        feedback: 0.4,
      },
    },
    {
      title: 'Add Reverb',
      instruction: 'Add reverb as final effect for depth',
      action: 'add-card',
      details: {
        cardType: 'reverb',
        size: 'hall',
        mix: 0.3,
      },
    },
    {
      title: 'Create Parallel Path',
      instruction: 'Split signal and add chorus on parallel path',
      action: 'add-card',
      details: {
        cardType: 'splitter',
        parallel: true,
      },
    },
    {
      title: 'Mix Parallel',
      instruction: 'Blend dry/wet signals (70% wet, 30% dry)',
      action: 'set-parameter',
      details: {
        parameter: 'mix',
        dry: 0.3,
        wet: 0.7,
      },
    },
    {
      title: 'Play and Tweak',
      instruction: 'Adjust each effect to taste while playing',
      action: 'play',
      details: {
        looping: true,
      },
    },
  ],
  finalState: {
    cards: ['synth', 'distortion', 'filter', 'delay', 'reverb', 'splitter', 'chorus'],
    tempo: 110,
    key: 'Bm',
  },
  tags: ['intermediate', 'effects', 'processing', 'sound-design', 'parallel'],
};

/**
 * Automation Ride - Automate parameters over time.
 */
export const AUTOMATION_RIDE_DEMO: DemoSong = {
  id: 'automation-ride',
  name: 'Automation Ride',
  description: 'Bring your track to life with parameter automation',
  emoji: '📊',
  category: 'effects',
  difficulty: 'intermediate',
  estimatedTime: 180,
  learningObjective: 'Master automation curves, modulation, and dynamic changes',
  steps: [
    {
      title: 'Add Synth Pad',
      instruction: 'Place a Pad Synth card as the sound source',
      action: 'add-card',
      details: {
        cardType: 'pad-synth',
        preset: 'warm-pad',
      },
    },
    {
      title: 'Automate Filter',
      instruction: 'Create filter cutoff automation that opens over 8 bars',
      action: 'edit',
      details: {
        automation: 'filter-cutoff',
        curve: 'exponential',
        start: 200,
        end: 8000,
      },
    },
    {
      title: 'Automate Resonance',
      instruction: 'Add resonance sweep that follows filter (builds tension)',
      action: 'edit',
      details: {
        automation: 'filter-resonance',
        curve: 'linear',
        start: 0,
        end: 0.8,
      },
    },
    {
      title: 'Automate Volume',
      instruction: 'Create swell effect with volume automation',
      action: 'edit',
      details: {
        automation: 'volume',
        curve: 's-curve',
        pattern: 'crescendo',
      },
    },
    {
      title: 'Add LFO Modulation',
      instruction: 'Use LFO to modulate filter cutoff for movement',
      action: 'set-parameter',
      details: {
        modulation: 'lfo',
        target: 'filter-cutoff',
        rate: '1/4',
        depth: 0.3,
      },
    },
    {
      title: 'Automate Effect Mix',
      instruction: 'Increase reverb mix over time (bar 5-8)',
      action: 'edit',
      details: {
        automation: 'reverb-mix',
        start: 0.1,
        end: 0.6,
      },
    },
    {
      title: 'Add Stereo Width',
      instruction: 'Automate stereo width expanding as sound builds',
      action: 'edit',
      details: {
        automation: 'stereo-width',
        start: 0.3,
        end: 1.0,
      },
    },
    {
      title: 'Play Full Automation',
      instruction: 'Listen to how automation creates movement and interest',
      action: 'play',
      details: {
        looping: true,
      },
    },
  ],
  finalState: {
    cards: ['pad-synth', 'filter', 'reverb'],
    tempo: 100,
    key: 'Em',
  },
  tags: ['intermediate', 'automation', 'modulation', 'movement', 'dynamics'],
};

/**
 * Live Loop - Record and layer loops live.
 */
export const LIVE_LOOP_DEMO: DemoSong = {
  id: 'live-loop',
  name: 'Live Loop',
  description: 'Build a track in real-time using live looping techniques',
  emoji: '🔁',
  category: 'performance',
  difficulty: 'intermediate',
  estimatedTime: 180,
  learningObjective: 'Learn loop recording, layering, timing, and live arrangement',
  steps: [
    {
      title: 'Set Loop Length',
      instruction: 'Create a 4-bar loop region in the timeline',
      action: 'set-parameter',
      details: {
        parameter: 'loop-length',
        value: 4,
      },
    },
    {
      title: 'Record First Layer',
      instruction: 'Arm track 1, count in, record a bass line',
      action: 'record',
      details: {
        track: 1,
        countIn: 1,
      },
    },
    {
      title: 'Overdub Drums',
      instruction: 'Arm track 2, record drums while bass plays',
      action: 'record',
      details: {
        track: 2,
        mode: 'overdub',
      },
    },
    {
      title: 'Add Chord Layer',
      instruction: 'Arm track 3, play chord progression over loop',
      action: 'record',
      details: {
        track: 3,
        mode: 'overdub',
      },
    },
    {
      title: 'Record Melody',
      instruction: 'Arm track 4, add lead melody on top',
      action: 'record',
      details: {
        track: 4,
        mode: 'overdub',
      },
    },
    {
      title: 'Mute/Unmute Layers',
      instruction: 'Practice toggling tracks for arrangement',
      action: 'edit',
      details: {
        mode: 'performance',
      },
    },
    {
      title: 'Record Automation',
      instruction: 'Capture your mute/unmute performance',
      action: 'record',
      details: {
        mode: 'automation',
      },
    },
    {
      title: 'Export Loop',
      instruction: 'Bounce the looped performance to audio',
      action: 'play',
      details: {
        export: true,
      },
    },
  ],
  finalState: {
    cards: ['looper', 'mixer'],
    tempo: 95,
    key: 'G',
  },
  tags: ['intermediate', 'performance', 'looping', 'live', 'recording'],
};

/**
 * Recording Take - Capture performances.
 */
export const RECORDING_TAKE_DEMO: DemoSong = {
  id: 'recording-take',
  name: 'Recording Take',
  description: 'Learn professional recording techniques including punch-in and comping',
  emoji: '🎙️',
  category: 'performance',
  difficulty: 'beginner',
  estimatedTime: 150,
  learningObjective: 'Master recording setup, takes, punch-in recording, and basic comping',
  steps: [
    {
      title: 'Setup Recording',
      instruction: 'Arm a track and enable metronome',
      action: 'set-parameter',
      details: {
        parameter: 'arm-track',
        value: 1,
        metronome: true,
      },
    },
    {
      title: 'Set Count-In',
      instruction: 'Enable 2-bar count-in for preparation',
      action: 'set-parameter',
      details: {
        parameter: 'count-in',
        value: 2,
      },
    },
    {
      title: 'Record First Take',
      instruction: 'Press record and play your performance',
      action: 'record',
      details: {
        take: 1,
      },
    },
    {
      title: 'Record Second Take',
      instruction: 'Try again for a better performance (takes stack)',
      action: 'record',
      details: {
        take: 2,
      },
    },
    {
      title: 'Punch-In Fix',
      instruction: 'Select region with mistake, punch-in to fix just that part',
      action: 'record',
      details: {
        mode: 'punch-in',
        region: [8, 12],
      },
    },
    {
      title: 'Comp Best Parts',
      instruction: 'Select best sections from each take to create comp',
      action: 'edit',
      details: {
        mode: 'comping',
      },
    },
    {
      title: 'Finalize Take',
      instruction: 'Flatten comp to single audio file',
      action: 'edit',
      details: {
        action: 'flatten-comp',
      },
    },
    {
      title: 'Listen Back',
      instruction: 'Play the final comped take',
      action: 'play',
      details: {
        looping: false,
      },
    },
  ],
  finalState: {
    cards: ['recorder', 'metronome'],
    tempo: 100,
    key: 'C',
  },
  tags: ['beginner', 'recording', 'performance', 'comping', 'punch-in'],
};

/**
 * Sample Flip - Advanced sample chopping and rearrangement.
 */
export const SAMPLE_FLIP_DEMO: DemoSong = {
  id: 'sample-flip',
  name: 'Sample Flip',
  description: 'Transform a sample into something completely new through creative chopping',
  emoji: '✂️',
  category: 'sampling',
  difficulty: 'intermediate',
  estimatedTime: 180,
  learningObjective: 'Learn to slice, rearrange, and process samples for creative transformations',
  steps: [
    {
      title: 'Load Sample',
      instruction: 'Import a melodic or vocal sample (4-8 bars recommended)',
      action: 'add-card',
      details: {
        cardType: 'sampler',
        sampleType: 'melodic',
      },
    },
    {
      title: 'Detect Transients',
      instruction: 'Use auto-slice to detect natural chop points',
      action: 'set-parameter',
      details: {
        parameter: 'auto-slice',
        sensitivity: 0.7,
      },
    },
    {
      title: 'Chop to Grid',
      instruction: 'Quantize slices to 16th notes for rhythmic chopping',
      action: 'edit',
      details: {
        action: 'slice-to-grid',
        grid: '1/16',
      },
    },
    {
      title: 'Rearrange Slices',
      instruction: 'Drag slices into new order to create pattern',
      action: 'edit',
      details: {
        action: 'rearrange-slices',
      },
    },
    {
      title: 'Add Pitch Shifting',
      instruction: 'Pitch some slices up/down for variation',
      action: 'set-parameter',
      details: {
        parameter: 'slice-pitch',
        range: [-12, 12],
      },
    },
    {
      title: 'Apply Gating',
      instruction: 'Add rhythmic gating for stutter effects',
      action: 'add-card',
      details: {
        cardType: 'gate',
        rate: '1/8',
      },
    },
    {
      title: 'Add Filter Movement',
      instruction: 'Automate filter cutoff for dynamic texture',
      action: 'edit',
      details: {
        action: 'automate',
        parameter: 'filter-cutoff',
      },
    },
    {
      title: 'Layer Original',
      instruction: 'Blend in subtle amount of original sample',
      action: 'set-parameter',
      details: {
        parameter: 'dry-wet',
        value: 0.2,
      },
    },
  ],
  finalState: {
    cards: ['sampler', 'gate', 'filter'],
    tempo: 140,
    key: 'Cm',
  },
  tags: ['intermediate', 'sampling', 'chopping', 'creative', 'transients'],
};

/**
 * Chord Voicing - Master the art of chord voicing and inversions.
 */
export const CHORD_VOICING_DEMO: DemoSong = {
  id: 'chord-voicing',
  name: 'Chord Voicing',
  description: 'Transform basic chords into rich, professional voicings with inversions and extensions',
  emoji: '🎼',
  category: 'harmony',
  difficulty: 'intermediate',
  estimatedTime: 200,
  learningObjective: 'Learn chord inversions, voice leading, and extension techniques',
  steps: [
    {
      title: 'Add Chord Card',
      instruction: 'Place a Chord Progression card with simple triads',
      action: 'add-card',
      details: {
        cardType: 'chord-progression',
        progression: ['C', 'Am', 'F', 'G'],
      },
    },
    {
      title: 'Enable Inversions',
      instruction: 'Turn on auto-inversion for smoother voice leading',
      action: 'set-parameter',
      details: {
        parameter: 'voicing-style',
        value: 'close-position',
      },
    },
    {
      title: 'Add 7th Extensions',
      instruction: 'Extend triads to 7th chords for richer harmony',
      action: 'set-parameter',
      details: {
        parameter: 'extensions',
        value: ['7th'],
      },
    },
    {
      title: 'Spread Voicing',
      instruction: 'Change to open position voicing for wider sound',
      action: 'set-parameter',
      details: {
        parameter: 'voicing-style',
        value: 'open-position',
      },
    },
    {
      title: 'Voice Leading',
      instruction: 'Minimize voice movement between chords',
      action: 'set-parameter',
      details: {
        parameter: 'voice-leading',
        value: 'smooth',
      },
    },
    {
      title: 'Add Color Tones',
      instruction: 'Include 9ths and 13ths for modern harmony',
      action: 'set-parameter',
      details: {
        parameter: 'extensions',
        value: ['7th', '9th', '13th'],
      },
    },
    {
      title: 'Drop-2 Voicing',
      instruction: 'Apply drop-2 voicing for jazz/pro sound',
      action: 'set-parameter',
      details: {
        parameter: 'voicing-style',
        value: 'drop-2',
      },
    },
    {
      title: 'Compare Voicings',
      instruction: 'A/B between close, open, and drop-2 to hear differences',
      action: 'play',
      details: {
        mode: 'ab-compare',
      },
    },
  ],
  finalState: {
    cards: ['chord-progression', 'piano'],
    tempo: 90,
    key: 'C',
  },
  tags: ['intermediate', 'harmony', 'theory', 'voice-leading', 'inversions'],
};

/**
 * Scale Mode - Understanding modes and their emotional colors.
 */
export const SCALE_MODE_DEMO: DemoSong = {
  id: 'scale-mode',
  name: 'Scale Mode',
  description: 'Explore the unique character and emotion of each musical mode',
  emoji: '🎵',
  category: 'melody',
  difficulty: 'intermediate',
  estimatedTime: 240,
  learningObjective: 'Understand modal harmony and how each mode creates different moods',
  steps: [
    {
      title: 'Add Melody Card',
      instruction: 'Create a simple melodic pattern',
      action: 'add-card',
      details: {
        cardType: 'melody',
        pattern: 'stepwise',
      },
    },
    {
      title: 'Ionian (Major)',
      instruction: 'Set to Ionian mode - bright, happy, stable',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C-ionian',
      },
    },
    {
      title: 'Dorian',
      instruction: 'Change to Dorian - minor with raised 6th, jazzy',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C-dorian',
      },
    },
    {
      title: 'Phrygian',
      instruction: 'Switch to Phrygian - dark, Spanish/metal flavor',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C-phrygian',
      },
    },
    {
      title: 'Lydian',
      instruction: 'Try Lydian - dreamy, raised 4th creates floating quality',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C-lydian',
      },
    },
    {
      title: 'Mixolydian',
      instruction: 'Mixolydian - bluesy, rock, dominant feel',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C-mixolydian',
      },
    },
    {
      title: 'Aeolian (Natural Minor)',
      instruction: 'Aeolian - sad, melancholic, natural minor',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C-aeolian',
      },
    },
    {
      title: 'Locrian',
      instruction: 'Locrian - unstable, diminished, rarely used',
      action: 'set-parameter',
      details: {
        parameter: 'scale',
        value: 'C-locrian',
      },
    },
    {
      title: 'Compare Modes',
      instruction: 'Cycle through modes to hear the unique character of each',
      action: 'play',
      details: {
        looping: true,
        cycle: true,
      },
    },
  ],
  finalState: {
    cards: ['melody', 'chord-progression'],
    tempo: 100,
    key: 'C',
  },
  tags: ['intermediate', 'theory', 'modes', 'scales', 'melody'],
};

/**
 * Groove Pocket - Master swing, shuffle, and feel adjustments.
 */
export const GROOVE_POCKET_DEMO: DemoSong = {
  id: 'groove-pocket',
  name: 'Groove Pocket',
  description: 'Transform rigid beats into grooving, human-feeling rhythms',
  emoji: '🎯',
  category: 'rhythm',
  difficulty: 'intermediate',
  estimatedTime: 180,
  learningObjective: 'Learn swing, shuffle, humanization, and groove templates',
  steps: [
    {
      title: 'Create Straight Beat',
      instruction: 'Start with a perfectly quantized 16th-note pattern',
      action: 'add-card',
      details: {
        cardType: 'drum-machine',
        pattern: 'straight-16ths',
      },
    },
    {
      title: 'Add Swing',
      instruction: 'Apply 16th-note swing (50-75%)',
      action: 'set-parameter',
      details: {
        parameter: 'swing',
        value: 0.66,
      },
    },
    {
      title: 'Humanize Timing',
      instruction: 'Add random timing variation (±5ms)',
      action: 'set-parameter',
      details: {
        parameter: 'humanize-timing',
        value: 0.05,
      },
    },
    {
      title: 'Humanize Velocity',
      instruction: 'Vary hit strengths for natural feel',
      action: 'set-parameter',
      details: {
        parameter: 'humanize-velocity',
        value: 0.15,
      },
    },
    {
      title: 'Apply Groove Template',
      instruction: 'Try "J Dilla" groove template for signature pocket',
      action: 'set-parameter',
      details: {
        parameter: 'groove-template',
        value: 'j-dilla',
      },
    },
    {
      title: 'Adjust Pocket',
      instruction: 'Push/pull timing to sit ahead/behind the beat',
      action: 'set-parameter',
      details: {
        parameter: 'timing-offset',
        value: -0.02,
      },
    },
    {
      title: 'Ghost Notes',
      instruction: 'Add soft ghost notes for texture',
      action: 'edit',
      details: {
        action: 'add-ghost-notes',
        velocity: 0.3,
      },
    },
    {
      title: 'Compare Grooves',
      instruction: 'A/B between straight, swing, and groove template',
      action: 'play',
      details: {
        mode: 'ab-compare',
      },
    },
  ],
  finalState: {
    cards: ['drum-machine', 'groove-quantize'],
    tempo: 95,
    key: 'F',
  },
  tags: ['intermediate', 'rhythm', 'groove', 'swing', 'humanize'],
};

/**
 * Polyrhythm Play - Create complex polyrhythmic patterns.
 */
export const POLYRHYTHM_PLAY_DEMO: DemoSong = {
  id: 'polyrhythm-play',
  name: 'Polyrhythm Play',
  description: 'Layer multiple rhythms that interact in fascinating ways',
  emoji: '🔄',
  category: 'rhythm',
  difficulty: 'advanced',
  estimatedTime: 220,
  learningObjective: 'Understand polyrhythms and how to create interlocking patterns',
  steps: [
    {
      title: 'Add Base Pattern',
      instruction: 'Create a 4-beat foundation pattern',
      action: 'add-card',
      details: {
        cardType: 'sequencer',
        length: 16,
      },
    },
    {
      title: 'Add 3-Against-4',
      instruction: 'Layer a triplet pattern (3 notes per 4 beats)',
      action: 'add-card',
      details: {
        cardType: 'sequencer',
        length: 12,
        sync: 'triplet',
      },
    },
    {
      title: 'Add 5-Against-4',
      instruction: 'Add quintuplet layer for complexity',
      action: 'add-card',
      details: {
        cardType: 'sequencer',
        length: 20,
        sync: 'quintuplet',
      },
    },
    {
      title: 'Different Timbres',
      instruction: 'Assign distinct sounds to each rhythm layer',
      action: 'connect',
      details: {
        route: 'per-layer-instrument',
      },
    },
    {
      title: 'Accents Pattern',
      instruction: 'Emphasize the downbeats of each pattern',
      action: 'set-parameter',
      details: {
        parameter: 'accent-pattern',
        value: 'downbeats',
      },
    },
    {
      title: 'Pan Separation',
      instruction: 'Pan each rhythm layer for clarity',
      action: 'set-parameter',
      details: {
        parameter: 'pan-per-layer',
        value: [-0.5, 0, 0.5],
      },
    },
    {
      title: 'Build Gradually',
      instruction: 'Start with one layer, add one every 4 bars',
      action: 'edit',
      details: {
        action: 'staggered-entry',
      },
    },
    {
      title: 'Explore Cycle',
      instruction: 'Let all patterns play to hear when they align',
      action: 'play',
      details: {
        looping: true,
        bars: 60,
      },
    },
  ],
  finalState: {
    cards: ['sequencer', 'sequencer', 'sequencer', 'mixer'],
    tempo: 110,
    key: 'Em',
  },
  tags: ['advanced', 'rhythm', 'polyrhythm', 'complex', 'layers'],
};

/**
 * Sound Design - Create unique sounds from scratch.
 */
export const SOUND_DESIGN_DEMO: DemoSong = {
  id: 'sound-design',
  name: 'Sound Design',
  description: 'Design a custom synthesizer sound from an init patch',
  emoji: '🔬',
  category: 'effects',
  difficulty: 'advanced',
  estimatedTime: 300,
  learningObjective: 'Learn subtractive synthesis and sound design workflow',
  steps: [
    {
      title: 'Init Patch',
      instruction: 'Start with basic saw wave oscillator',
      action: 'add-card',
      details: {
        cardType: 'lead-synth',
        preset: 'init',
      },
    },
    {
      title: 'Add Detuned Oscillators',
      instruction: 'Enable unison with 3 voices, slight detune',
      action: 'set-parameter',
      details: {
        parameter: 'unison',
        voices: 3,
        detune: 0.15,
      },
    },
    {
      title: 'Shape with Filter',
      instruction: 'Add low-pass filter, sweep cutoff to find sweet spot',
      action: 'set-parameter',
      details: {
        parameter: 'filter-cutoff',
        value: 2000,
        resonance: 0.4,
      },
    },
    {
      title: 'Filter Envelope',
      instruction: 'Modulate filter with envelope for pluck/growl',
      action: 'set-parameter',
      details: {
        parameter: 'filter-envelope-amount',
        value: 0.7,
      },
    },
    {
      title: 'Amp Envelope',
      instruction: 'Shape attack and release for desired articulation',
      action: 'set-parameter',
      details: {
        parameter: 'amp-envelope',
        attack: 0.01,
        decay: 0.3,
        sustain: 0.7,
        release: 0.8,
      },
    },
    {
      title: 'Add LFO Movement',
      instruction: 'Modulate filter or pitch with slow LFO',
      action: 'set-parameter',
      details: {
        parameter: 'lfo-to-filter',
        rate: 0.5,
        amount: 0.3,
      },
    },
    {
      title: 'Add Effects',
      instruction: 'Layer chorus, delay, reverb for depth',
      action: 'add-card',
      details: {
        cardType: 'effect-chain',
        effects: ['chorus', 'delay', 'reverb'],
      },
    },
    {
      title: 'Save Preset',
      instruction: 'Save your custom sound for reuse',
      action: 'set-parameter',
      details: {
        action: 'save-preset',
        name: 'My First Sound',
      },
    },
  ],
  finalState: {
    cards: ['lead-synth', 'chorus', 'delay', 'reverb'],
    tempo: 128,
    key: 'Dm',
  },
  tags: ['advanced', 'synthesis', 'sound-design', 'modulation', 'effects'],
};

/**
 * Full Track - Complete song from start to finish.
 */
export const FULL_TRACK_DEMO: DemoSong = {
  id: 'full-track',
  name: 'Full Track',
  description: 'Build a complete 3-minute song with intro, verse, chorus, and outro',
  emoji: '🎬',
  category: 'arrangement',
  difficulty: 'advanced',
  estimatedTime: 600,
  learningObjective: 'Combine all techniques into a finished, professional-sounding track',
  steps: [
    {
      title: 'Set Song Structure',
      instruction: 'Plan: Intro (8) → Verse (16) → Chorus (16) → Verse (16) → Chorus (16) → Bridge (8) → Chorus (16) → Outro (8)',
      action: 'set-parameter',
      details: {
        parameter: 'song-structure',
        sections: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
      },
    },
    {
      title: 'Create Drum Foundation',
      instruction: 'Build main beat with variations for each section',
      action: 'add-card',
      details: {
        cardType: 'drum-machine',
        patterns: ['intro', 'verse', 'chorus'],
      },
    },
    {
      title: 'Add Bass Line',
      instruction: 'Create bassline that follows chord progression',
      action: 'add-card',
      details: {
        cardType: 'bassline',
      },
    },
    {
      title: 'Chord Progression',
      instruction: 'Lay down chord pattern for verse and chorus',
      action: 'add-card',
      details: {
        cardType: 'chord-progression',
      },
    },
    {
      title: 'Verse Melody',
      instruction: 'Write memorable verse melody',
      action: 'add-card',
      details: {
        cardType: 'melody',
        section: 'verse',
      },
    },
    {
      title: 'Chorus Hook',
      instruction: 'Create catchy chorus melody/hook',
      action: 'add-card',
      details: {
        cardType: 'melody',
        section: 'chorus',
      },
    },
    {
      title: 'Add Pads/Atmosphere',
      instruction: 'Layer pads for depth and emotion',
      action: 'add-card',
      details: {
        cardType: 'pad-synth',
      },
    },
    {
      title: 'Create Transitions',
      instruction: 'Add fills and rises between sections',
      action: 'edit',
      details: {
        action: 'add-transitions',
      },
    },
    {
      title: 'Arrange Dynamics',
      instruction: 'Build energy from quiet verse to loud chorus',
      action: 'edit',
      details: {
        action: 'arrange-dynamics',
      },
    },
    {
      title: 'Mix Levels',
      instruction: 'Balance all elements for clarity',
      action: 'add-card',
      details: {
        cardType: 'mixer',
      },
    },
    {
      title: 'Add Master FX',
      instruction: 'Light compression and EQ on master',
      action: 'add-card',
      details: {
        cardType: 'master-chain',
      },
    },
    {
      title: 'Final Listen',
      instruction: 'Play through entire track, make final tweaks',
      action: 'play',
      details: {
        looping: false,
        fullSong: true,
      },
    },
  ],
  finalState: {
    cards: ['drum-machine', 'bassline', 'chord-progression', 'melody', 'pad-synth', 'mixer'],
    tempo: 120,
    key: 'G',
  },
  tags: ['advanced', 'arrangement', 'composition', 'complete', 'song'],
};

// ============================================================================
// DEMO SONG CATALOG REGISTRY
// ============================================================================

/**
 * All available demo songs.
 */
export const DEMO_SONGS: Record<string, DemoSong> = {
  'first-beat': FIRST_BEAT_DEMO,
  'chord-journey': CHORD_JOURNEY_DEMO,
  'melody-flow': MELODY_FLOW_DEMO,
  'bass-drop': BASS_DROP_DEMO,
  'drum-fill': DRUM_FILL_DEMO,
  'build-release': BUILD_RELEASE_DEMO,
  'vocal-chop': VOCAL_CHOP_DEMO,
  'synth-stack': SYNTH_STACK_DEMO,
  'mix-master': MIX_MASTER_DEMO,
  'effect-chain': EFFECT_CHAIN_DEMO,
  'automation-ride': AUTOMATION_RIDE_DEMO,
  'live-loop': LIVE_LOOP_DEMO,
  'recording-take': RECORDING_TAKE_DEMO,
  'sample-flip': SAMPLE_FLIP_DEMO,
  'chord-voicing': CHORD_VOICING_DEMO,
  'scale-mode': SCALE_MODE_DEMO,
  'groove-pocket': GROOVE_POCKET_DEMO,
  'polyrhythm-play': POLYRHYTHM_PLAY_DEMO,
  'sound-design': SOUND_DESIGN_DEMO,
  'full-track': FULL_TRACK_DEMO,
};

/**
 * Get demo song by ID.
 */
export function getDemoSong(id: string): DemoSong | null {
  return DEMO_SONGS[id] || null;
}

/**
 * Get all demo songs.
 */
export function getAllDemoSongs(): DemoSong[] {
  return Object.values(DEMO_SONGS);
}

/**
 * Get demo songs filtered by category.
 */
export function getDemoSongsByCategory(category: DemoSong['category']): DemoSong[] {
  return getAllDemoSongs().filter(song => song.category === category);
}

/**
 * Get demo songs filtered by difficulty.
 */
export function getDemoSongsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): DemoSong[] {
  return getAllDemoSongs().filter(song => song.difficulty === difficulty);
}

/**
 * Search demo songs by tag.
 */
export function searchDemoSongsByTag(tag: string): DemoSong[] {
  return getAllDemoSongs().filter(song => song.tags.includes(tag));
}

/**
 * Get recommended demo song for learning path.
 */
export function getRecommendedDemoSong(
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  interest?: DemoSong['category']
): DemoSong | null {
  const songs = getDemoSongsByDifficulty(userLevel);
  
  if (interest) {
    const interestSongs = songs.filter(s => s.category === interest);
    if (interestSongs.length > 0) {
      return interestSongs[0] || null;
    }
  }
  
  return songs[0] || null;
}

/**
 * Get next demo song in learning sequence.
 */
export function getNextDemoSong(completedIds: string[]): DemoSong | null {
  const allSongs = getAllDemoSongs();
  const uncompletedSongs = allSongs.filter(song => !completedIds.includes(song.id));
  
  if (uncompletedSongs.length === 0) {
    return null;
  }
  
  // Sort by difficulty, then by category
  const sortedSongs = uncompletedSongs.sort((a, b) => {
    const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    const diffDiff = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    if (diffDiff !== 0) return diffDiff;
    return a.category.localeCompare(b.category);
  });
  
  return sortedSongs[0] || null;
}

/**
 * Load demo song into tutorial mode.
 */
export function loadDemoSong(songId: string): {
  song: DemoSong;
  currentStep: number;
} | null {
  const song = getDemoSong(songId);
  if (!song) return null;
  
  return {
    song,
    currentStep: 0,
  };
}
