/**
 * @fileoverview Project Template Registry
 * 
 * Manages project templates that provide starting points for different workflows.
 * Templates include pre-configured boards, sample content, and helpful README notes.
 */

import type { BoardDifficulty, UserType } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  difficulty: BoardDifficulty;
  estimatedTime?: string;
  genre?: string[];
  tags?: string[];
  recommendedFor?: UserType[];
  
  // Template content factory
  create: () => ProjectTemplateContent;
}

export interface ProjectTemplateContent {
  // Board configuration
  defaultBoard?: string;
  
  // Initial streams and clips
  streams?: Array<{
    name: string;
    events: any[];
  }>;
  
  clips?: Array<{
    name: string;
    streamId: string;
    loop?: boolean;
  }>;
  
  // README/help text
  readme?: string;
  
  // Any additional metadata
  metadata?: Record<string, any>;
}

class TemplateRegistry {
  private templates: Map<string, ProjectTemplate> = new Map();

  register(template: ProjectTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template with ID "${template.id}" is already registered`);
    }
    this.templates.set(template.id, template);
  }

  get(templateId: string): ProjectTemplate | undefined {
    return this.templates.get(templateId);
  }

  list(): ProjectTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  filterByDifficulty(difficulty: BoardDifficulty): ProjectTemplate[] {
    return this.list().filter(t => t.difficulty === difficulty);
  }

  filterByGenre(genre: string): ProjectTemplate[] {
    return this.list().filter(t => t.genre?.includes(genre));
  }

  filterByUserType(userType: UserType): ProjectTemplate[] {
    return this.list().filter(t => t.recommendedFor?.includes(userType));
  }

  search(query: string): ProjectTemplate[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.list();

    return this.list().filter(template => {
      return (
        template.name.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q) ||
        template.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        template.genre?.some(genre => genre.toLowerCase().includes(q))
      );
    });
  }

  loadTemplate(templateId: string): ProjectTemplateContent | null {
    const template = this.get(templateId);
    if (!template) return null;
    
    return template.create();
  }

  clear(): void {
    this.templates.clear();
  }
}

let registryInstance: TemplateRegistry | null = null;

export function getTemplateRegistry(): TemplateRegistry {
  if (!registryInstance) {
    registryInstance = new TemplateRegistry();
    registerBuiltinTemplates(registryInstance);
  }
  return registryInstance;
}

export function resetTemplateRegistry(): void {
  registryInstance = null;
}

// Register builtin templates
function registerBuiltinTemplates(registry: TemplateRegistry): void {
  // Lofi Hip Hop Beat
  registry.register({
    id: 'lofi-hip-hop-beat',
    name: 'Lofi Hip Hop Beat',
    description: 'Chill lofi beat with drums, bass, and atmospheric pads',
    icon: '🎵',
    difficulty: 'beginner',
    estimatedTime: '30 minutes',
    genre: ['lofi', 'hip-hop', 'beats'],
    tags: ['drums', 'bass', 'chill', 'atmospheric'],
    recommendedFor: ['producer', 'beginner'],
    create: () => ({
      defaultBoard: 'session-generators',
      readme: `# Lofi Hip Hop Beat Template

Start creating chill lofi beats! This template sets you up with:

- Session view for clip launching
- Generator tools for drums, bass, and melody
- Preset effects chain for that lofi sound

## Quick Start

1. Generate drum patterns using the drum generator
2. Add a bass line with the bass generator
3. Layer atmospheric pads for texture
4. Add vinyl crackle and lo-fi effects for character

Experiment with different generator settings to find your vibe!
`
    })
  });

  // House Track
  registry.register({
    id: 'house-track',
    name: 'House Track',
    description: '4/4 house music with kick, bass, and synths',
    icon: '🏠',
    difficulty: 'intermediate',
    estimatedTime: '1 hour',
    genre: ['house', 'electronic', 'dance'],
    tags: ['4/4', 'kick', 'bass', 'synth', 'dance'],
    recommendedFor: ['producer'],
    create: () => ({
      defaultBoard: 'producer-board',
      readme: `# House Track Template

Create driving house music with this production-ready template.

## Structure

- 4/4 beat at 125 BPM
- Punchy kick and tight bass
- Synth hooks and pads
- Build-ups and breakdowns

Use the arrangement view to structure your track into intro, build, drop, and outro sections.
`
    })
  });

  // Jazz Standard
  registry.register({
    id: 'jazz-standard',
    name: 'Jazz Standard',
    description: 'Chord progression and lead sheet for jazz composition',
    icon: '🎺',
    difficulty: 'advanced',
    estimatedTime: '2 hours',
    genre: ['jazz', 'swing', 'standards'],
    tags: ['chords', 'notation', 'lead-sheet', 'harmony'],
    recommendedFor: ['notation-composer'],
    create: () => ({
      defaultBoard: 'notation-harmony-board',
      readme: `# Jazz Standard Template

Compose jazz standards with notation and harmony tools.

## Features

- Lead sheet notation
- Chord symbols and progressions
- Harmony hints for voice leading
- Export to PDF for musicians

Start by setting the key and writing a chord progression, then add melody notes that follow the harmony.
`
    })
  });

  // Techno Track
  registry.register({
    id: 'techno-track',
    name: 'Techno Track',
    description: 'Modular techno with sequencers and synthesis',
    icon: '🎛️',
    difficulty: 'advanced',
    estimatedTime: '2 hours',
    genre: ['techno', 'electronic', 'industrial'],
    tags: ['modular', 'sequencer', 'synthesis', 'minimal'],
    recommendedFor: ['sound-designer', 'producer'],
    create: () => ({
      defaultBoard: 'producer-board',
      readme: `# Techno Track Template

Build hypnotic techno with modular routing and synthesis.

## Approach

- Use modular routing for complex rhythms
- Layer multiple sequencers
- Apply effects and modulation
- Build tension with minimal changes

This template emphasizes sound design and modular patching over traditional arrangement.
`
    })
  });

  // Ambient Soundscape
  registry.register({
    id: 'ambient-soundscape',
    name: 'Ambient Soundscape',
    description: 'Generative ambient music with evolving textures',
    icon: '🌊',
    difficulty: 'intermediate',
    estimatedTime: '1 hour',
    genre: ['ambient', 'atmospheric', 'generative'],
    tags: ['generative', 'drone', 'texture', 'evolving'],
    recommendedFor: ['sound-designer', 'ai-explorer'],
    create: () => ({
      defaultBoard: 'generative-ambient',
      readme: `# Ambient Soundscape Template

Create evolving ambient textures with generative tools.

## Workflow

- Let the system generate layers continuously
- Accept or reject generated phrases
- Freeze layers you like
- Capture moments to the timeline

This template is ideal for exploration and happy accidents. Let the system surprise you!
`
    })
  });

  // String Quartet
  registry.register({
    id: 'string-quartet',
    name: 'String Quartet',
    description: 'Classical notation for four string voices',
    icon: '🎻',
    difficulty: 'expert',
    estimatedTime: '3+ hours',
    genre: ['classical', 'chamber', 'strings'],
    tags: ['notation', 'classical', 'strings', 'chamber'],
    recommendedFor: ['notation-composer'],
    create: () => ({
      defaultBoard: 'notation-manual',
      readme: `# String Quartet Template

Compose for string quartet with professional notation.

## Voices

- Violin I
- Violin II
- Viola
- Cello

Each part has its own staff with appropriate clefs and range. Use the notation board for precise control over articulations, dynamics, and phrasing.
`
    })
  });

  // Tracker Chip Tune
  registry.register({
    id: 'tracker-chip-tune',
    name: 'Tracker Chip Tune',
    description: 'Retro chiptune with tracker interface',
    icon: '🎮',
    difficulty: 'beginner',
    estimatedTime: '45 minutes',
    genre: ['chiptune', 'retro', '8-bit'],
    tags: ['tracker', 'chiptune', '8-bit', 'retro'],
    recommendedFor: ['tracker-user', 'beginner'],
    create: () => ({
      defaultBoard: 'basic-tracker',
      readme: `# Tracker Chip Tune Template

Create retro chiptunes with the tracker interface!

## Getting Started

- Use square wave and triangle instruments
- Keep patterns short and repetitive
- Use arpeggios for chord sounds
- Limit yourself to 4 channels for authenticity

The tracker is perfect for chiptunes - embrace the constraints!
`
    })
  });

  // Sound Design Patch
  registry.register({
    id: 'sound-design-patch',
    name: 'Sound Design Patch',
    description: 'Modular synthesis exploration workspace',
    icon: '🔊',
    difficulty: 'intermediate',
    estimatedTime: '1 hour',
    genre: ['experimental', 'synthesis', 'sound-design'],
    tags: ['modular', 'synthesis', 'exploration', 'patch'],
    recommendedFor: ['sound-designer'],
    create: () => ({
      defaultBoard: 'producer-board',
      readme: `# Sound Design Patch Template

Explore synthesis with modular routing and effects.

## Workflow

- Start with basic oscillators
- Route through filters and effects
- Add modulation for movement
- Save your favorite patches

Use the modular routing view to visualize your signal flow. Experiment freely!
`
    })
  });

  // Film Score Sketch
  registry.register({
    id: 'film-score-sketch',
    name: 'Film Score Sketch',
    description: 'Cinematic orchestral composition',
    icon: '🎬',
    difficulty: 'advanced',
    estimatedTime: '2+ hours',
    genre: ['cinematic', 'orchestral', 'film'],
    tags: ['orchestral', 'cinematic', 'score', 'dramatic'],
    recommendedFor: ['notation-composer', 'producer'],
    create: () => ({
      defaultBoard: 'composer-board',
      readme: `# Film Score Sketch Template

Compose cinematic music with full orchestration.

## Sections

- Strings (violins, violas, cellos, bass)
- Brass (horns, trumpets, trombones)
- Woodwinds (flutes, clarinets, oboes)
- Percussion and timpani

Use the composer board to combine notation with arrangement and mixing tools.
`
    })
  });
}
