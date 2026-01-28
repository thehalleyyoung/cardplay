/**
 * @fileoverview Demo Deck Definitions - Pre-configured card decks for instant music making.
 * 
 * This module provides complete, ready-to-play deck configurations that demonstrate
 * CardPlay's capabilities and give users immediate musical results. Each demo deck
 * is a fully configured collection of cards with presets, connections, and patterns.
 * 
 * @see currentsteps.md Phase 7.2: Demo Decks (lines 2056-2076)
 */

// ============================================================================
// DEMO DECK TYPES
// ============================================================================

/**
 * Card configuration within a demo deck.
 */
export interface DemoCard {
  readonly id: string;
  readonly type: string;
  readonly preset: string;
  readonly position: { x: number; y: number };
  readonly parameters: Record<string, unknown>;
}

/**
 * Connection between cards in demo deck.
 */
export interface DemoConnection {
  readonly from: string;
  readonly to: string;
  readonly fromPort: string;
  readonly toPort: string;
  readonly gain: number;
}

/**
 * Complete demo deck definition.
 */
export interface DemoDeck {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly emoji: string;
  readonly genre: string;
  readonly tempo: number;
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
  readonly estimatedPlayTime: number; // seconds
  readonly cards: readonly DemoCard[];
  readonly connections: readonly DemoConnection[];
  readonly initialState: {
    readonly playing: boolean;
    readonly looping: boolean;
    readonly selectedCardId: string | null;
  };
  readonly learningPoints: readonly string[];
  readonly tags: readonly string[];
}

// ============================================================================
// DEMO DECK CATALOG
// ============================================================================

/**
 * 808 Boom Bap demo deck - Classic hip-hop beat.
 */
export const BOOM_BAP_DEMO: DemoDeck = {
  id: '808-boom-bap',
  name: '808 Boom Bap',
  description: 'Classic hip-hop beat with 808 drums, vinyl crackle, and dusty bass',
  emoji: '🎤',
  genre: 'hip-hop',
  tempo: 90,
  difficulty: 'beginner',
  estimatedPlayTime: 30,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: '808-classic',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'boom-bap-basic',
        swing: 0.55,
        volume: 0.8,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'sub-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'root-note',
        octave: 1,
        filter: 0.3,
      },
    },
    {
      id: 'fx-1',
      type: 'vinyl-effect',
      preset: 'dusty',
      position: { x: 300, y: 100 },
      parameters: {
        crackle: 0.3,
        wear: 0.5,
        hiss: 0.2,
      },
    },
    {
      id: 'mixer-1',
      type: 'mixer',
      preset: 'stereo',
      position: { x: 500, y: 175 },
      parameters: {},
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'fx-1', to: 'mixer-1', fromPort: 'audio-out', toPort: 'ch1-in', gain: 0.8 },
    { from: 'bass-1', to: 'mixer-1', fromPort: 'audio-out', toPort: 'ch2-in', gain: 0.7 },
    { from: 'mixer-1', to: 'output', fromPort: 'master-out', toPort: 'audio-in', gain: 1.0 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'drums-1',
  },
  learningPoints: [
    'Classic 808 drum sounds are fundamental to hip-hop',
    'Swing adds a human feel to programmed beats',
    'Vinyl effects create authentic old-school texture',
    'Sub-bass provides weight without muddying the mix',
  ],
  tags: ['hip-hop', 'boom-bap', '808', 'classic', 'beginner-friendly'],
};

/**
 * Trap Essentials demo deck - Modern trap production.
 */
export const TRAP_ESSENTIALS_DEMO: DemoDeck = {
  id: 'trap-essentials',
  name: 'Trap Essentials',
  description: 'Hard-hitting trap beat with 808 bass, hi-hat rolls, and snare stabs',
  emoji: '🔥',
  genre: 'trap',
  tempo: 140,
  difficulty: 'beginner',
  estimatedPlayTime: 30,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'trap-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'trap-basic',
        hihatRolls: true,
        rollProbability: 0.4,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: '808-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'trap-bass',
        slide: true,
        glideTime: 0.1,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'trap-hall',
      position: { x: 300, y: 100 },
      parameters: {
        size: 0.6,
        decay: 2.5,
        mix: 0.3,
      },
    },
    {
      id: 'fx-2',
      type: 'compressor',
      preset: 'trap-smash',
      position: { x: 500, y: 175 },
      parameters: {
        threshold: -12,
        ratio: 8,
        attack: 0.01,
        release: 0.1,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'bass-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.8 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.7 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'drums-1',
  },
  learningPoints: [
    'Hi-hat rolls are a signature trap element',
    '808 bass slides create movement and energy',
    'Heavy compression gives trap its aggressive sound',
    'Reverb on drums adds depth and space',
  ],
  tags: ['trap', 'modern', '808', 'hi-hat-rolls', 'beginner-friendly'],
};

/**
 * Lo-Fi Chill demo deck - Relaxed lo-fi hip-hop.
 */
export const LOFI_CHILL_DEMO: DemoDeck = {
  id: 'lofi-chill',
  name: 'Lo-Fi Chill',
  description: 'Relaxing lo-fi hip-hop with dusty drums, warm Rhodes, and vinyl crackle',
  emoji: '☕',
  genre: 'lo-fi',
  tempo: 85,
  difficulty: 'beginner',
  estimatedPlayTime: 45,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'lofi-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'lofi-basic',
        swing: 0.62,
        humanize: 0.3,
      },
    },
    {
      id: 'keys-1',
      type: 'sampler',
      preset: 'rhodes-lofi',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'chord-progression-1',
        detuneAmount: 0.15,
        bitCrush: 12,
      },
    },
    {
      id: 'fx-1',
      type: 'vinyl-effect',
      preset: 'worn',
      position: { x: 300, y: 100 },
      parameters: {
        crackle: 0.4,
        wear: 0.7,
        wobble: 0.2,
      },
    },
    {
      id: 'fx-2',
      type: 'eq',
      preset: 'lo-fi-cut',
      position: { x: 300, y: 250 },
      parameters: {
        highCut: 8000,
        lowCut: 100,
        midBoost: 2,
      },
    },
    {
      id: 'mixer-1',
      type: 'mixer',
      preset: 'stereo',
      position: { x: 500, y: 175 },
      parameters: {},
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.7 },
    { from: 'keys-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.8 },
    { from: 'fx-1', to: 'mixer-1', fromPort: 'audio-out', toPort: 'ch1-in', gain: 0.75 },
    { from: 'fx-2', to: 'mixer-1', fromPort: 'audio-out', toPort: 'ch2-in', gain: 0.8 },
    { from: 'mixer-1', to: 'output', fromPort: 'master-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'keys-1',
  },
  learningPoints: [
    'Lo-fi uses imperfection as an aesthetic choice',
    'High swing creates a lazy, relaxed groove',
    'Vinyl effects add warmth and nostalgia',
    'Bit crushing and EQ cuts create lo-fi character',
  ],
  tags: ['lo-fi', 'chill', 'vinyl', 'rhodes', 'relaxing', 'study-beats'],
};

/**
 * House Groove demo deck - Classic 4-on-the-floor house music.
 */
export const HOUSE_GROOVE_DEMO: DemoDeck = {
  id: 'house-groove',
  name: 'House Groove',
  description: '4-on-the-floor house beat with filtered chords, bass, and classic house piano stabs',
  emoji: '🏠',
  genre: 'house',
  tempo: 124,
  difficulty: 'beginner',
  estimatedPlayTime: 40,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'house-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'four-on-floor',
        openHats: 0.6,
        closedHats: 0.8,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'house-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'house-groove',
        filter: 0.5,
        resonance: 0.4,
      },
    },
    {
      id: 'keys-1',
      type: 'sampler',
      preset: 'house-piano',
      position: { x: 100, y: 400 },
      parameters: {
        pattern: 'piano-stabs',
        velocity: 0.85,
      },
    },
    {
      id: 'fx-1',
      type: 'filter',
      preset: 'sweep-lp',
      position: { x: 300, y: 250 },
      parameters: {
        cutoff: 2000,
        resonance: 0.5,
        lfoRate: 0.25,
      },
    },
    {
      id: 'fx-2',
      type: 'reverb',
      preset: 'club-hall',
      position: { x: 500, y: 175 },
      parameters: {
        size: 0.7,
        decay: 3.0,
        mix: 0.25,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'bass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'keys-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.75 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.8 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'drums-1',
  },
  learningPoints: [
    '4-on-the-floor kick is the foundation of house music',
    'Filter sweeps add movement to static elements',
    'Piano stabs create energy and emotion',
    'Tight kick and bass relationship is crucial',
  ],
  tags: ['house', 'dance', '4-on-floor', 'club', 'filter-sweep'],
};

/**
 * Techno Pulse demo deck - Driving techno with industrial elements.
 */
export const TECHNO_PULSE_DEMO: DemoDeck = {
  id: 'techno-pulse',
  name: 'Techno Pulse',
  description: 'Driving techno beat with pounding kick, hypnotic synths, and industrial textures',
  emoji: '⚙️',
  genre: 'techno',
  tempo: 130,
  difficulty: 'intermediate',
  estimatedPlayTime: 50,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'techno-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'techno-driving',
        kickPitch: -2,
        kickDecay: 0.3,
      },
    },
    {
      id: 'synth-1',
      type: 'synth',
      preset: 'techno-lead',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'sequence-16',
        filter: 0.35,
        resonance: 0.6,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'acid-303',
      position: { x: 100, y: 400 },
      parameters: {
        pattern: 'acid-line',
        slide: true,
        accent: 0.7,
      },
    },
    {
      id: 'fx-1',
      type: 'delay',
      preset: 'ping-pong',
      position: { x: 300, y: 175 },
      parameters: {
        time: 0.375,
        feedback: 0.4,
        mix: 0.3,
      },
    },
    {
      id: 'fx-2',
      type: 'distortion',
      preset: 'industrial',
      position: { x: 500, y: 250 },
      parameters: {
        drive: 0.5,
        tone: 0.6,
        mix: 0.4,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
    { from: 'synth-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.7 },
    { from: 'bass-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.8 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.75 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'synth-1',
  },
  learningPoints: [
    'Techno relies on repetition and subtle evolution',
    'Industrial distortion adds edge and aggression',
    'Acid bass lines create hypnotic movement',
    'Ping-pong delay adds stereo width',
  ],
  tags: ['techno', 'industrial', 'acid', 'hypnotic', 'underground'],
};

/**
 * Ambient Dreams demo deck - Ethereal ambient soundscapes.
 */
export const AMBIENT_DREAMS_DEMO: DemoDeck = {
  id: 'ambient-dreams',
  name: 'Ambient Dreams',
  description: 'Ethereal ambient textures with evolving pads, field recordings, and spatial reverb',
  emoji: '🌌',
  genre: 'ambient',
  tempo: 60,
  difficulty: 'intermediate',
  estimatedPlayTime: 90,
  cards: [
    {
      id: 'pad-1',
      type: 'synth',
      preset: 'ambient-pad',
      position: { x: 100, y: 100 },
      parameters: {
        attack: 3.0,
        release: 5.0,
        filterSweep: 0.15,
      },
    },
    {
      id: 'pad-2',
      type: 'synth',
      preset: 'string-pad',
      position: { x: 100, y: 250 },
      parameters: {
        detune: 0.25,
        chorus: 0.6,
        vibrato: 0.2,
      },
    },
    {
      id: 'texture-1',
      type: 'sampler',
      preset: 'field-recording',
      position: { x: 100, y: 400 },
      parameters: {
        grainSize: 0.5,
        grainDensity: 0.3,
        reverseProb: 0.2,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'infinite-hall',
      position: { x: 300, y: 175 },
      parameters: {
        size: 1.0,
        decay: 10.0,
        mix: 0.6,
      },
    },
    {
      id: 'fx-2',
      type: 'delay',
      preset: 'shimmer',
      position: { x: 500, y: 250 },
      parameters: {
        time: 1.5,
        feedback: 0.7,
        shimmer: 0.5,
      },
    },
  ],
  connections: [
    { from: 'pad-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.7 },
    { from: 'pad-2', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.6 },
    { from: 'texture-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.5 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.8 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'pad-1',
  },
  learningPoints: [
    'Ambient music focuses on texture over rhythm',
    'Long attack/release creates smooth evolution',
    'Heavy reverb creates spaciousness',
    'Layering pads adds depth and complexity',
  ],
  tags: ['ambient', 'atmospheric', 'ethereal', 'soundscape', 'meditation'],
};

/**
 * Funk Machine demo deck - Groovy funk with tight rhythm section.
 */
export const FUNK_MACHINE_DEMO: DemoDeck = {
  id: 'funk-machine',
  name: 'Funk Machine',
  description: 'Groovy funk with syncopated drums, slap bass, clavinet, and horn stabs',
  emoji: '🎸',
  genre: 'funk',
  tempo: 108,
  difficulty: 'intermediate',
  estimatedPlayTime: 35,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'funk-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'funk-groove',
        ghostNotes: 0.7,
        swing: 0.58,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'slap-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'funk-bass',
        slap: true,
        mute: 0.6,
      },
    },
    {
      id: 'keys-1',
      type: 'sampler',
      preset: 'clavinet',
      position: { x: 100, y: 400 },
      parameters: {
        pattern: 'funk-comp',
        wah: 0.5,
        phaser: 0.3,
      },
    },
    {
      id: 'horns-1',
      type: 'sampler',
      preset: 'brass-section',
      position: { x: 300, y: 100 },
      parameters: {
        pattern: 'horn-stabs',
        tight: true,
      },
    },
    {
      id: 'fx-1',
      type: 'compressor',
      preset: 'funk-glue',
      position: { x: 500, y: 200 },
      parameters: {
        threshold: -18,
        ratio: 4,
        attack: 0.005,
        release: 0.08,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'bass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.9 },
    { from: 'keys-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.7 },
    { from: 'horns-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.75 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'bass-1',
  },
  learningPoints: [
    'Funk grooves on syncopation and ghost notes',
    'Tight interplay between bass and drums is essential',
    'Compression glues the rhythm section together',
    'Horn stabs add punctuation and energy',
  ],
  tags: ['funk', 'groove', 'syncopated', 'slap-bass', 'brass'],
};

/**
 * Jazz Quartet demo deck - Classic jazz ensemble sound.
 */
export const JAZZ_QUARTET_DEMO: DemoDeck = {
  id: 'jazz-quartet',
  name: 'Jazz Quartet',
  description: 'Classic jazz quartet with walking bass, ride cymbal, piano comp, and sax melody',
  emoji: '🎷',
  genre: 'jazz',
  tempo: 140,
  difficulty: 'advanced',
  estimatedPlayTime: 60,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'jazz-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'swing-medium',
        rideCymbal: 0.8,
        brushes: false,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'upright-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'walking-bass',
        swing: 0.67,
        humanize: 0.4,
      },
    },
    {
      id: 'keys-1',
      type: 'sampler',
      preset: 'jazz-piano',
      position: { x: 100, y: 400 },
      parameters: {
        pattern: 'jazz-comp',
        voicing: 'rootless',
        swing: 0.67,
      },
    },
    {
      id: 'sax-1',
      type: 'synth',
      preset: 'sax-lead',
      position: { x: 300, y: 250 },
      parameters: {
        vibrato: 0.3,
        breathiness: 0.2,
        legato: true,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'club-room',
      position: { x: 500, y: 200 },
      parameters: {
        size: 0.5,
        decay: 1.8,
        mix: 0.2,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.75 },
    { from: 'bass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.85 },
    { from: 'keys-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.7 },
    { from: 'sax-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.8 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'sax-1',
  },
  learningPoints: [
    'Jazz swing is more than just a timing adjustment',
    'Walking bass provides harmonic movement',
    'Piano comping leaves space for melody',
    'Ride cymbal defines the time feel',
  ],
  tags: ['jazz', 'swing', 'quartet', 'walking-bass', 'bebop'],
};

/**
 * Orchestral Sketch demo deck - Cinematic orchestral arrangement.
 */
export const ORCHESTRAL_SKETCH_DEMO: DemoDeck = {
  id: 'orchestral-sketch',
  name: 'Orchestral Sketch',
  description: 'Cinematic orchestral piece with strings, brass, woodwinds, and timpani',
  emoji: '🎻',
  genre: 'orchestral',
  tempo: 80,
  difficulty: 'advanced',
  estimatedPlayTime: 75,
  cards: [
    {
      id: 'strings-1',
      type: 'sampler',
      preset: 'string-ensemble',
      position: { x: 100, y: 100 },
      parameters: {
        articulation: 'legato',
        expression: 0.7,
        vibrato: 0.3,
      },
    },
    {
      id: 'brass-1',
      type: 'sampler',
      preset: 'brass-ensemble',
      position: { x: 100, y: 250 },
      parameters: {
        articulation: 'sustain',
        dynamics: 0.8,
      },
    },
    {
      id: 'woodwinds-1',
      type: 'sampler',
      preset: 'woodwind-ensemble',
      position: { x: 100, y: 400 },
      parameters: {
        articulation: 'staccato',
        breath: 0.2,
      },
    },
    {
      id: 'percussion-1',
      type: 'sampler',
      preset: 'orchestral-perc',
      position: { x: 300, y: 250 },
      parameters: {
        timpaniRoll: true,
        cymbals: 0.6,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'concert-hall',
      position: { x: 500, y: 200 },
      parameters: {
        size: 0.9,
        decay: 3.5,
        mix: 0.4,
      },
    },
  ],
  connections: [
    { from: 'strings-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.8 },
    { from: 'brass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.75 },
    { from: 'woodwinds-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.7 },
    { from: 'percussion-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.85 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'strings-1',
  },
  learningPoints: [
    'Orchestral balance requires careful level management',
    'Concert hall reverb creates realistic space',
    'Different articulations create expressive phrases',
    'Section layering builds orchestral depth',
  ],
  tags: ['orchestral', 'cinematic', 'classical', 'film-score', 'epic'],
};

/**
 * Acoustic Singer demo deck - Singer-songwriter acoustic arrangement.
 */
export const ACOUSTIC_SINGER_DEMO: DemoDeck = {
  id: 'acoustic-singer',
  name: 'Acoustic Singer',
  description: 'Singer-songwriter arrangement with acoustic guitar, vocals, light percussion',
  emoji: '🎤',
  genre: 'acoustic',
  tempo: 95,
  difficulty: 'beginner',
  estimatedPlayTime: 40,
  cards: [
    {
      id: 'guitar-1',
      type: 'sampler',
      preset: 'acoustic-guitar',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'fingerpicking',
        capo: 2,
        bright: 0.6,
      },
    },
    {
      id: 'vocal-1',
      type: 'sampler',
      preset: 'vocal-female',
      position: { x: 100, y: 250 },
      parameters: {
        melody: 'verse-1',
        breathiness: 0.3,
      },
    },
    {
      id: 'percussion-1',
      type: 'drum-machine',
      preset: 'hand-percussion',
      position: { x: 100, y: 400 },
      parameters: {
        shaker: 0.4,
        tambourine: 0.3,
      },
    },
    {
      id: 'fx-1',
      type: 'eq',
      preset: 'acoustic-warm',
      position: { x: 300, y: 175 },
      parameters: {
        lowMid: 2,
        highCut: 12000,
      },
    },
    {
      id: 'fx-2',
      type: 'reverb',
      preset: 'small-room',
      position: { x: 500, y: 200 },
      parameters: {
        size: 0.3,
        decay: 1.2,
        mix: 0.2,
      },
    },
  ],
  connections: [
    { from: 'guitar-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'vocal-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'percussion-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.6 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.8 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'guitar-1',
  },
  learningPoints: [
    'Acoustic arrangements prioritize natural intimacy',
    'Fingerpicking creates rhythmic and melodic motion',
    'Subtle reverb adds space without washing out',
    'Minimalism can be powerful',
  ],
  tags: ['acoustic', 'singer-songwriter', 'folk', 'intimate', 'organic'],
};

/**
 * EDM Festival demo deck - Big room EDM with massive drops.
 */
export const EDM_FESTIVAL_DEMO: DemoDeck = {
  id: 'edm-festival',
  name: 'EDM Festival',
  description: 'Big room EDM with massive synths, festival drops, and energetic builds',
  emoji: '🎆',
  genre: 'edm',
  tempo: 128,
  difficulty: 'intermediate',
  estimatedPlayTime: 45,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'big-room-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'festival-drop',
        kickPunch: 0.9,
        sidechain: true,
      },
    },
    {
      id: 'synth-1',
      type: 'synth',
      preset: 'supersaw-lead',
      position: { x: 100, y: 250 },
      parameters: {
        unison: 8,
        detune: 0.3,
        cutoff: 0.7,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'festival-bass',
      position: { x: 100, y: 400 },
      parameters: {
        pattern: 'drop-bass',
        sub: 0.8,
        distortion: 0.5,
      },
    },
    {
      id: 'fx-1',
      type: 'riser',
      preset: 'white-noise-riser',
      position: { x: 300, y: 175 },
      parameters: {
        length: 8,
        filterSweep: 1.0,
      },
    },
    {
      id: 'fx-2',
      type: 'compressor',
      preset: 'sidechain-pump',
      position: { x: 500, y: 200 },
      parameters: {
        threshold: -24,
        ratio: 10,
        attack: 0.001,
        release: 0.25,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
    { from: 'drums-1', to: 'fx-2', fromPort: 'sidechain-out', toPort: 'sidechain-in', gain: 1.0 },
    { from: 'synth-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.85 },
    { from: 'bass-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.9 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.7 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'synth-1',
  },
  learningPoints: [
    'EDM relies on massive builds and drops',
    'Sidechain compression creates pumping effect',
    'Supersaw leads are huge and energetic',
    'Risers build tension before drops',
  ],
  tags: ['edm', 'festival', 'big-room', 'drops', 'energetic'],
};

/**
 * R&B Smooth demo deck - Smooth contemporary R&B.
 */
export const RNB_SMOOTH_DEMO: DemoDeck = {
  id: 'rnb-smooth',
  name: 'R&B Smooth',
  description: 'Smooth contemporary R&B with electric piano, tight drums, and warm bass',
  emoji: '✨',
  genre: 'rnb',
  tempo: 88,
  difficulty: 'intermediate',
  estimatedPlayTime: 40,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'rnb-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'rnb-groove',
        snareLayering: true,
        hihatVelocity: 0.6,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'sub-rnb',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'rnb-bass',
        smooth: true,
        roundness: 0.7,
      },
    },
    {
      id: 'keys-1',
      type: 'sampler',
      preset: 'rhodes-warm',
      position: { x: 100, y: 400 },
      parameters: {
        pattern: 'chord-stabs',
        tremolo: 0.2,
        chorus: 0.4,
      },
    },
    {
      id: 'vocal-1',
      type: 'sampler',
      preset: 'vocal-rnb',
      position: { x: 300, y: 250 },
      parameters: {
        melody: 'hook',
        adlibs: true,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'smooth-plate',
      position: { x: 500, y: 200 },
      parameters: {
        size: 0.5,
        decay: 2.0,
        mix: 0.3,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'bass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.9 },
    { from: 'keys-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.75 },
    { from: 'vocal-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.9 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'vocal-1',
  },
  learningPoints: [
    'R&B grooves sit in the pocket between swing and straight',
    'Electric piano adds warmth and soul',
    'Layered snares create depth',
    'Smooth bass complements without overpowering',
  ],
  tags: ['rnb', 'smooth', 'soul', 'contemporary', 'groovy'],
};

/**
 * Rock Band demo deck - Classic rock with guitar, bass, drums, and keys.
 */
export const ROCK_BAND_DEMO: DemoDeck = {
  id: 'rock-band',
  name: 'Rock Band',
  description: 'Classic rock setup with driving drums, distorted guitar, bass, and organ',
  emoji: '🎸',
  genre: 'rock',
  tempo: 125,
  difficulty: 'intermediate',
  estimatedPlayTime: 45,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'rock-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'rock-basic',
        kickPower: 0.9,
        snareCrack: 0.85,
        crashIntensity: 0.7,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'electric-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'rock-bass',
        attack: 'pick',
        tone: 0.6,
        drive: 0.3,
      },
    },
    {
      id: 'guitar-1',
      type: 'sampler',
      preset: 'distorted-guitar',
      position: { x: 300, y: 150 },
      parameters: {
        pattern: 'power-chords',
        distortion: 0.75,
        palmMute: false,
        crunch: 0.8,
      },
    },
    {
      id: 'organ-1',
      type: 'organ',
      preset: 'hammond-b3',
      position: { x: 300, y: 350 },
      parameters: {
        pattern: 'chord-comping',
        drawbars: '888000000',
        leslie: 'fast',
        drive: 0.5,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'room',
      position: { x: 500, y: 200 },
      parameters: {
        size: 0.4,
        decay: 1.5,
        mix: 0.25,
      },
    },
    {
      id: 'comp-1',
      type: 'compressor',
      preset: 'rock-glue',
      position: { x: 700, y: 200 },
      parameters: {
        threshold: -18,
        ratio: 4,
        attack: 5,
        release: 50,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'bass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.85 },
    { from: 'guitar-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.8 },
    { from: 'organ-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.65 },
    { from: 'fx-1', to: 'comp-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
    { from: 'comp-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'guitar-1',
  },
  learningPoints: [
    'Rock relies on powerful, driving drums with emphasis on kick and snare',
    'Distorted guitar provides the main harmonic content',
    'Bass follows root notes with occasional fills',
    'Hammond organ adds fullness in the mid-range',
    'Room reverb creates natural space without washing out',
    'Compression glues the mix together',
  ],
  tags: ['rock', 'guitar', 'classic-rock', 'band', 'energetic'],
};

/**
 * Electronic Pop demo deck - Modern synth-pop with catchy melodies and electronic beats.
 */
export const ELECTRONIC_POP_DEMO: DemoDeck = {
  id: 'electronic-pop',
  name: 'Electronic Pop',
  description: 'Modern synth-pop with catchy melodies, lush pads, and punchy electronic drums',
  emoji: '🎹',
  genre: 'electronic-pop',
  tempo: 118,
  difficulty: 'beginner',
  estimatedPlayTime: 40,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'electronic-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'four-on-floor',
        sidechain: true,
        punchiness: 0.8,
      },
    },
    {
      id: 'synth-1',
      type: 'synth',
      preset: 'supersaw-lead',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'melody-catchy',
        detune: 0.4,
        filter: 0.6,
      },
    },
    {
      id: 'pad-1',
      type: 'pad-synth',
      preset: 'warm-pad',
      position: { x: 300, y: 150 },
      parameters: {
        chords: 'pop-progression',
        stereoWidth: 0.8,
        brightness: 0.5,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'synth-bass',
      position: { x: 100, y: 400 },
      parameters: {
        pattern: 'pop-bass',
        sidechain: true,
        punch: 0.7,
      },
    },
    {
      id: 'fx-1',
      type: 'chorus',
      preset: 'lush',
      position: { x: 500, y: 200 },
      parameters: {
        rate: 1.2,
        depth: 0.4,
        mix: 0.35,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'synth-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.75 },
    { from: 'pad-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.6 },
    { from: 'bass-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.8 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.85 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'synth-1',
  },
  learningPoints: [
    'Electronic pop uses sidechain compression for pumping effect',
    'Supersaw leads create wide, lush melodies',
    'Pad synths fill the harmonic space between bass and melody',
    'Four-on-floor kick pattern drives the energy',
    'Chorus effect adds width and depth to synth layers',
  ],
  tags: ['electronic', 'pop', 'synth-pop', 'catchy', 'modern'],
};

/**
 * World Fusion demo deck - Blend of global instruments and rhythms.
 */
export const WORLD_FUSION_DEMO: DemoDeck = {
  id: 'world-fusion',
  name: 'World Fusion',
  description: 'Blend of global instruments: tabla, oud, kalimba with electronic elements',
  emoji: '🌍',
  genre: 'world-fusion',
  tempo: 105,
  difficulty: 'intermediate',
  estimatedPlayTime: 55,
  cards: [
    {
      id: 'perc-1',
      type: 'drum-machine',
      preset: 'tabla-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'tabla-theka',
        tuning: 'indian-scale',
        dynamics: 0.75,
      },
    },
    {
      id: 'string-1',
      type: 'sampler',
      preset: 'oud',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'maqam-phrase',
        tuning: 'quarter-tone',
        vibrato: 0.3,
      },
    },
    {
      id: 'mallet-1',
      type: 'sampler',
      preset: 'kalimba',
      position: { x: 300, y: 150 },
      parameters: {
        pattern: 'pentatonic-melody',
        reverb: 0.6,
        resonance: 0.7,
      },
    },
    {
      id: 'pad-1',
      type: 'pad-synth',
      preset: 'ethnic-drone',
      position: { x: 300, y: 350 },
      parameters: {
        root: 'D',
        harmonics: 'overtone-series',
        evolve: 0.3,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'cathedral',
      position: { x: 500, y: 200 },
      parameters: {
        size: 0.85,
        decay: 3.5,
        mix: 0.4,
      },
    },
  ],
  connections: [
    { from: 'perc-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.8 },
    { from: 'string-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.75 },
    { from: 'mallet-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.7 },
    { from: 'pad-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.65 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'string-1',
  },
  learningPoints: [
    'World fusion blends traditional instruments with modern production',
    'Microtonal scales add authentic ethnic flavor',
    'Drone pads create harmonic foundation',
    'Tabla provides complex, evolving rhythms',
    'Long reverb creates spacious, meditative atmosphere',
  ],
  tags: ['world', 'fusion', 'ethnic', 'global', 'meditative'],
};

/**
 * Cinematic Score demo deck - Epic orchestral with emotional strings and brass.
 */
export const CINEMATIC_SCORE_DEMO: DemoDeck = {
  id: 'cinematic-score',
  name: 'Cinematic Score',
  description: 'Epic orchestral score with soaring strings, powerful brass, and dramatic percussion',
  emoji: '🎬',
  genre: 'cinematic',
  tempo: 80,
  difficulty: 'advanced',
  estimatedPlayTime: 60,
  cards: [
    {
      id: 'strings-1',
      type: 'sampler',
      preset: 'string-ensemble',
      position: { x: 100, y: 100 },
      parameters: {
        articulation: 'legato',
        expression: 0.8,
        vibrato: 0.4,
      },
    },
    {
      id: 'brass-1',
      type: 'sampler',
      preset: 'brass-section',
      position: { x: 100, y: 250 },
      parameters: {
        articulation: 'sustain',
        dynamics: 0.85,
        punch: 0.7,
      },
    },
    {
      id: 'perc-1',
      type: 'drum-machine',
      preset: 'orchestral-perc',
      position: { x: 300, y: 150 },
      parameters: {
        pattern: 'epic-hits',
        timpanis: 0.9,
        crashIntensity: 0.8,
      },
    },
    {
      id: 'choir-1',
      type: 'sampler',
      preset: 'choir-pad',
      position: { x: 300, y: 350 },
      parameters: {
        vowel: 'ah',
        blend: 0.7,
        reverb: 0.6,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'concert-hall',
      position: { x: 500, y: 200 },
      parameters: {
        size: 0.95,
        decay: 4.0,
        preDelay: 30,
        mix: 0.5,
      },
    },
    {
      id: 'comp-1',
      type: 'compressor',
      preset: 'orchestral',
      position: { x: 700, y: 200 },
      parameters: {
        threshold: -20,
        ratio: 2.5,
        attack: 15,
        release: 100,
      },
    },
  ],
  connections: [
    { from: 'strings-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'brass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.8 },
    { from: 'perc-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.9 },
    { from: 'choir-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-4', gain: 0.7 },
    { from: 'fx-1', to: 'comp-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
    { from: 'comp-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'strings-1',
  },
  learningPoints: [
    'Cinematic scores layer many orchestral instruments for full sound',
    'String legato creates emotional, flowing melodies',
    'Brass adds power and drama at climactic moments',
    'Timpani and crash cymbals punctuate important beats',
    'Concert hall reverb places instruments in realistic space',
    'Gentle compression maintains dynamics while controlling peaks',
  ],
  tags: ['cinematic', 'orchestral', 'epic', 'dramatic', 'film-score'],
};

/**
 * Retro Synth demo deck - 80s inspired synthwave with nostalgic vibes.
 */
export const RETRO_SYNTH_DEMO: DemoDeck = {
  id: 'retro-synth',
  name: 'Retro Synth',
  description: '80s synthwave with analog-style synths, gated reverb drums, and nostalgic arpeggios',
  emoji: '🌆',
  genre: 'synthwave',
  tempo: 115,
  difficulty: 'beginner',
  estimatedPlayTime: 40,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'linn-drum',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: '80s-beat',
        gatedReverb: true,
        snareGate: 0.15,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'dx-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'synth-bass-line',
        filter: 0.4,
        drive: 0.3,
      },
    },
    {
      id: 'synth-1',
      type: 'synth',
      preset: 'juno-pad',
      position: { x: 300, y: 150 },
      parameters: {
        chords: '80s-progression',
        chorus: 0.7,
        detune: 0.3,
      },
    },
    {
      id: 'arp-1',
      type: 'arpeggiator',
      preset: 'classic-arp',
      position: { x: 300, y: 350 },
      parameters: {
        pattern: 'up-down',
        rate: '1/16',
        octaves: 2,
      },
    },
    {
      id: 'fx-1',
      type: 'delay',
      preset: 'analog-delay',
      position: { x: 500, y: 200 },
      parameters: {
        time: 0.375,
        feedback: 0.4,
        modulation: 0.3,
        mix: 0.3,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'bass-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.8 },
    { from: 'synth-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.7 },
    { from: 'arp-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.65 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.8 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'synth-1',
  },
  learningPoints: [
    'Synthwave captures the sound of 80s electronic music',
    'Gated reverb on snare is signature 80s production technique',
    'Chorus effect on pads creates lush, wide soundscape',
    'Arpeggiated synths add movement and energy',
    'Analog-style delay adds depth and space',
  ],
  tags: ['synthwave', 'retro', '80s', 'nostalgic', 'analog'],
};

/**
 * Drum & Bass demo deck - Fast breakbeats and heavy sub bass.
 */
export const DRUM_AND_BASS_DEMO: DemoDeck = {
  id: 'drum-and-bass',
  name: 'Drum & Bass',
  description: 'Fast-paced DnB with chopped breakbeats, rolling bassline, and atmospheric pads',
  emoji: '🥁',
  genre: 'drum-and-bass',
  tempo: 174,
  difficulty: 'advanced',
  estimatedPlayTime: 50,
  cards: [
    {
      id: 'drums-1',
      type: 'loop-player',
      preset: 'amen-break',
      position: { x: 100, y: 100 },
      parameters: {
        chop: true,
        shuffle: 0.6,
        pitchShift: 2,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'reese-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'rolling-bass',
        detune: 0.5,
        filter: 0.3,
      },
    },
    {
      id: 'pad-1',
      type: 'pad-synth',
      preset: 'liquid-pad',
      position: { x: 300, y: 150 },
      parameters: {
        chords: 'atmospheric',
        stereoWidth: 0.9,
        evolve: 0.5,
      },
    },
    {
      id: 'fx-1',
      type: 'reverb',
      preset: 'plate',
      position: { x: 500, y: 150 },
      parameters: {
        size: 0.7,
        decay: 2.0,
        mix: 0.35,
      },
    },
    {
      id: 'fx-2',
      type: 'compressor',
      preset: 'dnb-glue',
      position: { x: 700, y: 150 },
      parameters: {
        threshold: -12,
        ratio: 6,
        attack: 1,
        release: 30,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'bass-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.85 },
    { from: 'pad-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.6 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.7 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'drums-1',
  },
  learningPoints: [
    'Drum & Bass uses 174 BPM with fast breakbeats',
    'Chopped Amen break is iconic DnB element',
    'Reese bass provides rolling, evolving sub-bass',
    'Atmospheric pads create space above busy drums',
    'Heavy compression glues fast elements together',
  ],
  tags: ['drum-and-bass', 'dnb', 'breakbeat', 'rolling-bass', 'fast'],
};

/**
 * Dubstep Heavy demo deck - Wobble bass and half-time drums.
 */
export const DUBSTEP_HEAVY_DEMO: DemoDeck = {
  id: 'dubstep-heavy',
  name: 'Dubstep Heavy',
  description: 'Heavy dubstep with wobble bass, aggressive drums, and powerful build-ups',
  emoji: '🔊',
  genre: 'dubstep',
  tempo: 140,
  difficulty: 'intermediate',
  estimatedPlayTime: 45,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'dubstep-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'half-time',
        kickSub: 0.9,
        snareLayers: 3,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'wobble-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'wobble-rhythm',
        lfoRate: '1/8T',
        distortion: 0.8,
      },
    },
    {
      id: 'synth-1',
      type: 'synth',
      preset: 'growl-bass',
      position: { x: 300, y: 150 },
      parameters: {
        pattern: 'bass-stabs',
        modulation: 0.9,
        aggression: 0.85,
      },
    },
    {
      id: 'fx-1',
      type: 'distortion',
      preset: 'heavy-distortion',
      position: { x: 500, y: 150 },
      parameters: {
        drive: 0.7,
        tone: 0.5,
        mix: 0.6,
      },
    },
    {
      id: 'fx-2',
      type: 'compressor',
      preset: 'dubstep-master',
      position: { x: 700, y: 150 },
      parameters: {
        threshold: -10,
        ratio: 8,
        attack: 1,
        release: 25,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.9 },
    { from: 'bass-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'synth-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.8 },
    { from: 'fx-1', to: 'fx-2', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.9 },
    { from: 'fx-2', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.95 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'bass-1',
  },
  learningPoints: [
    'Dubstep uses half-time drums at 140 BPM (feels like 70)',
    'Wobble bass is created with LFO modulating filter',
    'Heavy distortion adds aggression to bass sounds',
    'Layered snares create massive impact',
    'Extreme compression creates punchy, loud sound',
  ],
  tags: ['dubstep', 'wobble-bass', 'heavy', 'aggressive', 'bass-music'],
};

/**
 * Minimal Techno demo deck - Stripped-down techno with hypnotic grooves.
 */
export const MINIMAL_TECHNO_DEMO: DemoDeck = {
  id: 'minimal-techno',
  name: 'Minimal Techno',
  description: 'Stripped-down minimal techno with subtle evolving grooves and deep bassline',
  emoji: '⚫',
  genre: 'minimal-techno',
  tempo: 128,
  difficulty: 'intermediate',
  estimatedPlayTime: 50,
  cards: [
    {
      id: 'drums-1',
      type: 'drum-machine',
      preset: 'minimal-kit',
      position: { x: 100, y: 100 },
      parameters: {
        pattern: 'minimal-groove',
        swing: 0.52,
        subtlety: 0.8,
      },
    },
    {
      id: 'bass-1',
      type: 'bass-synth',
      preset: 'deep-bass',
      position: { x: 100, y: 250 },
      parameters: {
        pattern: 'minimal-bass',
        filter: 0.2,
        evolve: 0.4,
      },
    },
    {
      id: 'perc-1',
      type: 'drum-machine',
      preset: 'percussion-kit',
      position: { x: 300, y: 150 },
      parameters: {
        pattern: 'minimal-perc',
        randomize: 0.3,
        subtle: true,
      },
    },
    {
      id: 'fx-1',
      type: 'delay',
      preset: 'minimal-delay',
      position: { x: 500, y: 150 },
      parameters: {
        time: 0.375,
        feedback: 0.3,
        filter: 0.4,
        mix: 0.25,
      },
    },
  ],
  connections: [
    { from: 'drums-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.85 },
    { from: 'bass-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in-2', gain: 0.8 },
    { from: 'perc-1', to: 'fx-1', fromPort: 'audio-out', toPort: 'audio-in', gain: 0.6 },
    { from: 'fx-1', to: 'output', fromPort: 'audio-out', toPort: 'audio-in-3', gain: 0.7 },
  ],
  initialState: {
    playing: false,
    looping: true,
    selectedCardId: 'drums-1',
  },
  learningPoints: [
    'Minimal techno focuses on subtle groove variations',
    'Less is more - every element serves a purpose',
    'Deep, evolving basslines create hypnotic foundation',
    'Percussion adds texture without cluttering',
    'Subtle delay creates space and movement',
  ],
  tags: ['minimal', 'techno', 'hypnotic', 'stripped-down', 'deep'],
};

// ============================================================================
// DEMO DECK CATALOG REGISTRY
// ============================================================================

/**
 * All available demo decks.
 */
export const DEMO_DECKS: Record<string, DemoDeck> = {
  '808-boom-bap': BOOM_BAP_DEMO,
  'trap-essentials': TRAP_ESSENTIALS_DEMO,
  'lofi-chill': LOFI_CHILL_DEMO,
  'house-groove': HOUSE_GROOVE_DEMO,
  'techno-pulse': TECHNO_PULSE_DEMO,
  'ambient-dreams': AMBIENT_DREAMS_DEMO,
  'funk-machine': FUNK_MACHINE_DEMO,
  'jazz-quartet': JAZZ_QUARTET_DEMO,
  'orchestral-sketch': ORCHESTRAL_SKETCH_DEMO,
  'acoustic-singer': ACOUSTIC_SINGER_DEMO,
  'edm-festival': EDM_FESTIVAL_DEMO,
  'rnb-smooth': RNB_SMOOTH_DEMO,
  'rock-band': ROCK_BAND_DEMO,
  'electronic-pop': ELECTRONIC_POP_DEMO,
  'world-fusion': WORLD_FUSION_DEMO,
  'cinematic-score': CINEMATIC_SCORE_DEMO,
  'retro-synth': RETRO_SYNTH_DEMO,
  'drum-and-bass': DRUM_AND_BASS_DEMO,
  'dubstep-heavy': DUBSTEP_HEAVY_DEMO,
  'minimal-techno': MINIMAL_TECHNO_DEMO,
};

/**
 * Get demo deck by ID.
 */
export function getDemoDeck(id: string): DemoDeck | null {
  return DEMO_DECKS[id] || null;
}

/**
 * Get all demo decks.
 */
export function getAllDemoDecks(): DemoDeck[] {
  return Object.values(DEMO_DECKS);
}

/**
 * Get demo decks filtered by difficulty.
 */
export function getDemoDecksByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): DemoDeck[] {
  return getAllDemoDecks().filter(deck => deck.difficulty === difficulty);
}

/**
 * Get demo decks filtered by genre.
 */
export function getDemoDecksByGenre(genre: string): DemoDeck[] {
  return getAllDemoDecks().filter(deck => deck.genre === genre);
}

/**
 * Search demo decks by tag.
 */
export function searchDemoDecksByTag(tag: string): DemoDeck[] {
  return getAllDemoDecks().filter(deck => deck.tags.includes(tag));
}

/**
 * Get recommended demo deck for user persona.
 */
export function getRecommendedDemoDeck(
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
  genrePreference?: string
): DemoDeck | null {
  const difficulty = skillLevel === 'expert' ? 'advanced' : skillLevel;
  const decks = getDemoDecksByDifficulty(difficulty);
  
  if (genrePreference) {
    const genreDecks = decks.filter(d => d.genre === genrePreference);
    if (genreDecks.length > 0) {
      return genreDecks[0] || null;
    }
  }
  
  return decks[0] || null;
}

/**
 * Load demo deck into application state.
 * This would integrate with the actual card/deck system.
 */
export function loadDemoDeck(deckId: string): {
  cards: DemoCard[];
  connections: DemoConnection[];
  tempo: number;
} | null {
  const deck = getDemoDeck(deckId);
  if (!deck) return null;
  
  return {
    cards: [...deck.cards],
    connections: [...deck.connections],
    tempo: deck.tempo,
  };
}
