/**
 * Starter Templates
 *
 * Pre-built project templates covering common use cases
 */

import type { ProjectTemplate } from './types';
import { getTemplateRegistry } from './registry';

/**
 * Lofi Hip Hop Beat template
 */
export const lofiHipHopTemplate: ProjectTemplate = {
  metadata: {
    id: 'lofi-hip-hop',
    name: 'Lofi Hip Hop Beat',
    description: 'Relaxing lo-fi hip hop template with drum pattern, bass, and chord progression',
    genre: 'hip-hop',
    difficulty: 'beginner',
    estimatedTime: '30min',
    tags: ['lofi', 'hip-hop', 'chill', 'beats'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'drums',
      name: 'Drums',
      events: [],
      color: '#FF6B6B',
    },
    {
      id: 'bass',
      name: 'Bass',
      events: [],
      color: '#4ECDC4',
    },
    {
      id: 'chords',
      name: 'Chords',
      events: [],
      color: '#95E1D3',
    },
  ],
  clips: [
    {
      id: 'drums-clip',
      name: 'Drum Loop',
      streamId: 'drums',
      loop: true,
    },
    {
      id: 'bass-clip',
      name: 'Bassline',
      streamId: 'bass',
      loop: true,
    },
    {
      id: 'chords-clip',
      name: 'Chord Progression',
      streamId: 'chords',
      loop: true,
    },
  ],
  board: {
    boardId: 'session-generators',
  },
  readme: `# Lofi Hip Hop Beat Template

A starter template for creating relaxing lo-fi hip hop tracks.

## What's Included
- Drum pattern track ready for samples
- Bass track for melodic basslines
- Chord progression track for harmony

## Getting Started
1. Add drum samples to the drum track
2. Program a simple bass pattern
3. Add chords using the harmony helper
4. Experiment with effects and textures`,
};

/**
 * Ambient Soundscape template
 */
export const ambientTemplate: ProjectTemplate = {
  metadata: {
    id: 'ambient-soundscape',
    name: 'Ambient Soundscape',
    description: 'Evolving ambient template with pad layers and atmospheric textures',
    genre: 'ambient',
    difficulty: 'intermediate',
    estimatedTime: '1-2hrs',
    tags: ['ambient', 'soundscape', 'atmospheric', 'generative'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'pad1',
      name: 'Pad Layer 1',
      events: [],
      color: '#A8DADC',
    },
    {
      id: 'pad2',
      name: 'Pad Layer 2',
      events: [],
      color: '#457B9D',
    },
    {
      id: 'texture',
      name: 'Texture',
      events: [],
      color: '#1D3557',
    },
  ],
  clips: [],
  board: {
    boardId: 'generative-ambient',
  },
  readme: `# Ambient Soundscape Template

Create evolving ambient textures with generative elements.

## What's Included
- Two pad layers for harmonic depth
- Texture track for atmospheric elements
- Generative tools for evolution

## Tips
- Use long release times
- Layer multiple textures
- Let the generators create variations`,
};

/**
 * String Quartet template
 */
export const stringQuartetTemplate: ProjectTemplate = {
  metadata: {
    id: 'string-quartet',
    name: 'String Quartet',
    description: 'Classical string quartet template with four voices and notation view',
    genre: 'orchestral',
    difficulty: 'advanced',
    estimatedTime: '2-4hrs',
    tags: ['classical', 'strings', 'chamber', 'notation'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'violin1',
      name: 'Violin I',
      events: [],
      color: '#E63946',
    },
    {
      id: 'violin2',
      name: 'Violin II',
      events: [],
      color: '#F1FAEE',
    },
    {
      id: 'viola',
      name: 'Viola',
      events: [],
      color: '#A8DADC',
    },
    {
      id: 'cello',
      name: 'Cello',
      events: [],
      color: '#457B9D',
    },
  ],
  clips: [],
  board: {
    boardId: 'notation-harmony',
  },
  readme: `# String Quartet Template

Compose for string quartet with proper notation.

## What's Included
- Four string parts (Violin I, Violin II, Viola, Cello)
- Notation view with harmony helper
- Proper voice ranges and clefs

## Composition Tips
- Consider voice leading
- Balance melodic interest across parts
- Use the harmony helper for chord suggestions`,
};

/**
 * House Track template
 */
export const houseTrackTemplate: ProjectTemplate = {
  metadata: {
    id: 'house-track',
    name: 'House Track',
    description: 'Classic house music template with drums, bass, chords, and arrangement',
    genre: 'electronic',
    difficulty: 'intermediate',
    estimatedTime: '1-2hrs',
    tags: ['house', 'dance', 'electronic', '4x4'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'kick',
      name: 'Kick',
      events: [],
      color: '#E63946',
    },
    {
      id: 'hats',
      name: 'Hi-Hats',
      events: [],
      color: '#F1FAEE',
    },
    {
      id: 'percussion',
      name: 'Percussion',
      events: [],
      color: '#A8DADC',
    },
    {
      id: 'bass',
      name: 'Bass',
      events: [],
      color: '#457B9D',
    },
    {
      id: 'chords',
      name: 'Chords',
      events: [],
      color: '#1D3557',
    },
    {
      id: 'lead',
      name: 'Lead',
      events: [],
      color: '#F77F00',
    },
  ],
  clips: [
    {
      id: 'kick-clip',
      name: 'Kick Pattern',
      streamId: 'kick',
      loop: true,
    },
    {
      id: 'hats-clip',
      name: 'Hi-Hat Pattern',
      streamId: 'hats',
      loop: true,
    },
    {
      id: 'perc-clip',
      name: 'Percussion Loop',
      streamId: 'percussion',
      loop: true,
    },
    {
      id: 'bass-clip',
      name: 'Bassline',
      streamId: 'bass',
      loop: true,
    },
    {
      id: 'chords-clip',
      name: 'Chord Progression',
      streamId: 'chords',
      loop: true,
    },
    {
      id: 'lead-clip',
      name: 'Lead Melody',
      streamId: 'lead',
      loop: true,
    },
  ],
  board: {
    boardId: 'producer',
  },
  readme: `# House Track Template

Create a classic house track with solid groove and arrangement.

## What's Included
- Solid 4-on-the-floor kick pattern track
- Hi-hat and percussion tracks
- Bass, chord, and lead tracks
- Arrangement view for building your track

## Production Tips
- Start with the kick and bass
- Layer hi-hats for groove
- Use sidechain compression on bass/chords
- Build energy with filters and arrangement`,
};

/**
 * Jazz Standard template
 */
export const jazzStandardTemplate: ProjectTemplate = {
  metadata: {
    id: 'jazz-standard',
    name: 'Jazz Standard',
    description: 'Jazz ensemble template with chord changes, bass walking, and improvisation',
    genre: 'jazz',
    difficulty: 'advanced',
    estimatedTime: '2-3hrs',
    tags: ['jazz', 'swing', 'bebop', 'standards'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'melody',
      name: 'Melody (Head)',
      events: [],
      color: '#E63946',
    },
    {
      id: 'chords',
      name: 'Chords',
      events: [],
      color: '#F1FAEE',
    },
    {
      id: 'bass',
      name: 'Walking Bass',
      events: [],
      color: '#457B9D',
    },
    {
      id: 'drums',
      name: 'Drums (Ride)',
      events: [],
      color: '#1D3557',
    },
  ],
  clips: [],
  board: {
    boardId: 'notation-harmony',
  },
  readme: `# Jazz Standard Template

Compose and perform jazz standards with proper harmony.

## What's Included
- Melody track for the head
- Chord changes with jazz voicings
- Walking bass line
- Swing drum pattern

## Jazz Tips
- Study the chord progression
- Use the harmony helper for extensions
- Walking bass follows chord roots
- Leave space for improvisation`,
};

/**
 * Techno Track template
 */
export const technoTrackTemplate: ProjectTemplate = {
  metadata: {
    id: 'techno-track',
    name: 'Techno Track',
    description: 'Driving techno template with modular routing and evolving sequences',
    genre: 'electronic',
    difficulty: 'advanced',
    estimatedTime: '2-4hrs',
    tags: ['techno', 'electronic', 'modular', 'hypnotic'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'kick',
      name: 'Kick',
      events: [],
      color: '#000000',
    },
    {
      id: 'hats',
      name: 'Hi-Hats',
      events: [],
      color: '#808080',
    },
    {
      id: 'bass',
      name: 'Bass Sequence',
      events: [],
      color: '#E63946',
    },
    {
      id: 'lead',
      name: 'Lead Sequence',
      events: [],
      color: '#F77F00',
    },
    {
      id: 'perc1',
      name: 'Percussion 1',
      events: [],
      color: '#457B9D',
    },
    {
      id: 'perc2',
      name: 'Percussion 2',
      events: [],
      color: '#1D3557',
    },
  ],
  clips: [],
  board: {
    boardId: 'live-performance',
  },
  readme: `# Techno Track Template

Create hypnotic techno with evolving sequences and modular routing.

## What's Included
- Solid kick and hi-hat patterns
- Bass and lead sequence tracks
- Multiple percussion layers
- Modular routing for creative patching

## Techno Production Tips
- Keep the kick clean and punchy
- Use modulation for evolution
- Layer percussion for complexity
- Build tension with filters and automation`,
};

/**
 * Sound Design Patch template
 */
export const soundDesignTemplate: ProjectTemplate = {
  metadata: {
    id: 'sound-design-patch',
    name: 'Sound Design Patch',
    description: 'Experimental sound design template with modular routing and effect chains',
    genre: 'sound-design',
    difficulty: 'expert',
    estimatedTime: '1-3hrs',
    tags: ['sound-design', 'synthesis', 'modular', 'experimental'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'osc1',
      name: 'Oscillator 1',
      events: [],
      color: '#FF006E',
    },
    {
      id: 'osc2',
      name: 'Oscillator 2',
      events: [],
      color: '#FB5607',
    },
    {
      id: 'noise',
      name: 'Noise Source',
      events: [],
      color: '#8338EC',
    },
    {
      id: 'modulation',
      name: 'Modulation',
      events: [],
      color: '#3A86FF',
    },
  ],
  clips: [],
  board: {
    boardId: 'producer',
  },
  readme: `# Sound Design Patch Template

Explore synthesis and sound design with modular routing.

## What's Included
- Multiple oscillator sources
- Noise generator for texture
- Modulation routing setup
- Effect chain ready for processing

## Sound Design Tips
- Start with simple waveforms
- Layer and detune for richness
- Use modulation for movement
- Experiment with unconventional routing`,
};

/**
 * Film Score Sketch template
 */
export const filmScoreTemplate: ProjectTemplate = {
  metadata: {
    id: 'film-score-sketch',
    name: 'Film Score Sketch',
    description: 'Cinematic orchestral template with sections and emotional development',
    genre: 'orchestral',
    difficulty: 'expert',
    estimatedTime: '3-6hrs',
    tags: ['film', 'cinematic', 'orchestral', 'score'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'strings',
      name: 'Strings',
      events: [],
      color: '#A8DADC',
    },
    {
      id: 'brass',
      name: 'Brass',
      events: [],
      color: '#E63946',
    },
    {
      id: 'woodwinds',
      name: 'Woodwinds',
      events: [],
      color: '#F1FAEE',
    },
    {
      id: 'percussion',
      name: 'Percussion',
      events: [],
      color: '#457B9D',
    },
    {
      id: 'piano',
      name: 'Piano',
      events: [],
      color: '#1D3557',
    },
  ],
  clips: [],
  board: {
    boardId: 'composer',
  },
  readme: `# Film Score Sketch Template

Compose cinematic music with orchestral palette and emotional arc.

## What's Included
- Full orchestral sections (strings, brass, woodwinds)
- Percussion for impact
- Piano for intimate moments
- Composer board with arrangement tools

## Scoring Tips
- Start with melody and harmony
- Build orchestration gradually
- Use dynamics for emotion
- Consider the narrative arc`,
};

/**
 * Tracker Chip Tune template
 */
export const chipTuneTemplate: ProjectTemplate = {
  metadata: {
    id: 'tracker-chip-tune',
    name: 'Tracker Chip Tune',
    description: 'Retro chip tune template with pulse, triangle, and noise channels',
    genre: 'electronic',
    difficulty: 'beginner',
    estimatedTime: '30min',
    tags: ['chiptune', 'retro', 'tracker', '8-bit'],
    author: 'CardPlay',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
  streams: [
    {
      id: 'pulse1',
      name: 'Pulse 1',
      events: [],
      color: '#FF006E',
    },
    {
      id: 'pulse2',
      name: 'Pulse 2',
      events: [],
      color: '#FB5607',
    },
    {
      id: 'triangle',
      name: 'Triangle',
      events: [],
      color: '#FFBE0B',
    },
    {
      id: 'noise',
      name: 'Noise',
      events: [],
      color: '#8338EC',
    },
  ],
  clips: [],
  board: {
    boardId: 'basic-tracker',
  },
  readme: `# Tracker Chip Tune Template

Create authentic chip tune music using tracker workflow.

## What's Included
- 4 channels mimicking classic game consoles
- Tracker interface for precise sequencing
- Perfect for 8-bit style music

## Tips
- Use arpeggios for chords
- Keep patterns short and looping
- Noise channel works great for percussion`,
};

/**
 * Register all builtin templates
 */
export function registerBuiltinTemplates(): void {
  const registry = getTemplateRegistry();
  
  registry.register(lofiHipHopTemplate);
  registry.register(houseTrackTemplate);
  registry.register(jazzStandardTemplate);
  registry.register(technoTrackTemplate);
  registry.register(soundDesignTemplate);
  registry.register(filmScoreTemplate);
  registry.register(ambientTemplate);
  registry.register(stringQuartetTemplate);
  registry.register(chipTuneTemplate);

  console.log(`Registered ${registry.getAll().length} builtin templates`);
}
