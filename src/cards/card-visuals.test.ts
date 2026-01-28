/**
 * @fileoverview Tests for Card Visuals and Generator Card UIs.
 */

import { describe, it, expect } from 'vitest';

import {
  // CardVisuals types and functions
  CARD_EMOJI_MAP,
  CARD_CATEGORY_COLORS,
  getCardEmoji,
  createDefaultCardVisuals,
  createDefaultLatency,
  createDefaultMemory,
  createEventCardBehavior,
  createAudioCardBehavior,
  createInstrumentBehavior,
  createKnobControl,
  createSliderControl,
  createToggleControl,
  createButtonControl,
  createDropdownControl,
  createPanel,
  createDefaultUIConfig,
  generateCardCSS,
  renderMiniCard,
  renderAsciiCard,
  buildCardDefinition,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  // Badge System
  CARD_BADGES,
  createBadge,
  // Frame System
  CARD_FRAMES,
  createFrame,
  // Glow Effects
  CARD_GLOW_STATES,
  getGlowCSS,
  generateGlowKeyframes,
  // User-Injectable System
  validateUserCardTemplate,
  buildCardFromUserTemplate,
  cloneCardWithOverrides,
  // Curried Preset System
  curryPreset,
  composePresets,
  createCurriedPreset,
  applyCurriedPreset,
  morphPresets,
  randomizePreset,
  mutatePreset,
  createPresetScene,
  // SVG/Canvas
  cardToSVG,
  createCardCanvasRenderer,
  CONNECTION_STYLES,
  generateConnectionCSS,
} from './card-visuals';

import {
  // Generator Card UIs
  DRUM_MACHINE_CARD,
  DRUM_MACHINE_VISUALS,
  DRUM_MACHINE_PARAMETERS,
  DRUM_MACHINE_PRESETS,
  SYNTH_CARD,
  SYNTH_VISUALS,
  SYNTH_PARAMETERS,
  SYNTH_PRESETS,
  PIANO_CARD,
  PIANO_VISUALS,
  PIANO_PARAMETERS,
  PIANO_PRESETS,
  BASS_CARD,
  BASS_VISUALS,
  BASS_PARAMETERS,
  BASS_PRESETS,
  STRINGS_CARD,
  STRINGS_VISUALS,
  STRINGS_PARAMETERS,
  STRINGS_PRESETS,
  ORGAN_CARD,
  ORGAN_VISUALS,
  ORGAN_PARAMETERS,
  ORGAN_PRESETS,
  // New cards
  SAMPLER_CARD,
  SAMPLER_VISUALS,
  SAMPLER_PARAMETERS,
  SAMPLER_PRESETS,
  LOOP_PLAYER_CARD,
  LOOP_PLAYER_VISUALS,
  LOOP_PLAYER_PARAMETERS,
  LOOP_PLAYER_PRESETS,
  ARPEGGIATOR_CARD,
  ARPEGGIATOR_VISUALS,
  ARPEGGIATOR_PARAMETERS,
  ARPEGGIATOR_PRESETS,
  SEQUENCER_CARD,
  SEQUENCER_VISUALS,
  SEQUENCER_PARAMETERS,
  SEQUENCER_PRESETS,
  CHORD_PROGRESSION_CARD,
  CHORD_PROGRESSION_VISUALS,
  CHORD_PROGRESSION_PARAMETERS,
  CHORD_PROGRESSION_PRESETS,
  // Registry
  GENERATOR_CARDS,
  getCardDefinition,
  getCardsByCategory,
  searchCardsByTag,
} from './generator-card-uis';

// ============================================================================
// EMOJI SYSTEM TESTS
// ============================================================================

describe('CardVisuals - Emoji System', () => {
  it('should have emojis for all major card types', () => {
    expect(CARD_EMOJI_MAP['drum-machine']).toBe('🥁');
    expect(CARD_EMOJI_MAP['synth']).toBe('🎹');
    expect(CARD_EMOJI_MAP['bass']).toBe('🎸');
    expect(CARD_EMOJI_MAP['strings']).toBe('🎻');
    expect(CARD_EMOJI_MAP['brass']).toBe('🎺');
    expect(CARD_EMOJI_MAP['reverb']).toBe('🏛️');
    expect(CARD_EMOJI_MAP['delay']).toBe('🔄');
  });

  it('should return correct emoji for card type', () => {
    expect(getCardEmoji('drum-machine')).toBe('🥁');
    expect(getCardEmoji('Drum-Machine')).toBe('🥁');
    expect(getCardEmoji('SYNTH')).toBe('🎹');
    expect(getCardEmoji('synthesizer')).toBe('🎹');
    expect(getCardEmoji('piano')).toBe('🎹');
  });

  it('should return default emoji for unknown types', () => {
    expect(getCardEmoji('unknown-card')).toBe('🎵');
    expect(getCardEmoji('my-custom-card')).toBe('🎵');
  });

  it('should handle genre-specific emojis', () => {
    expect(CARD_EMOJI_MAP['reggae']).toBe('🌴');
    expect(CARD_EMOJI_MAP['country']).toBe('🤠');
    expect(CARD_EMOJI_MAP['jazz']).toBe('🎭');
    expect(CARD_EMOJI_MAP['hiphop']).toBe('🎧');
  });
});

// ============================================================================
// CATEGORY COLORS TESTS
// ============================================================================

describe('CardVisuals - Category Colors', () => {
  it('should have colors for all categories', () => {
    expect(CARD_CATEGORY_COLORS.generators).toBeDefined();
    expect(CARD_CATEGORY_COLORS.effects).toBeDefined();
    expect(CARD_CATEGORY_COLORS.transforms).toBeDefined();
    expect(CARD_CATEGORY_COLORS.routing).toBeDefined();
    expect(CARD_CATEGORY_COLORS.analysis).toBeDefined();
  });

  it('should have primary, secondary, and glow for each category', () => {
    const colors = CARD_CATEGORY_COLORS.generators;
    expect(colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colors.glow).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

// ============================================================================
// DEFAULT VISUALS TESTS
// ============================================================================

describe('CardVisuals - Default Visuals', () => {
  it('should create default visuals for a card type', () => {
    const visuals = createDefaultCardVisuals('drum-machine', 'generators');
    
    expect(visuals.emoji).toBe('🥁');
    expect(visuals.color).toBe(CARD_CATEGORY_COLORS.generators.primary);
    expect(visuals.colorSecondary).toBe(CARD_CATEGORY_COLORS.generators.secondary);
    expect(visuals.gradient).toBe('linear');
    expect(visuals.glow).toBe(CARD_CATEGORY_COLORS.generators.glow);
    expect(visuals.glowIntensity).toBeGreaterThan(0);
  });

  it('should use effects colors for effect cards', () => {
    const visuals = createDefaultCardVisuals('reverb', 'effects');
    
    expect(visuals.emoji).toBe('🏛️');
    expect(visuals.color).toBe(CARD_CATEGORY_COLORS.effects.primary);
  });
});

// ============================================================================
// BEHAVIOR TESTS
// ============================================================================

describe('CardVisuals - Card Behavior', () => {
  it('should create default latency info', () => {
    const latency = createDefaultLatency(128);
    
    expect(latency.samples).toBe(128);
    expect(latency.ms).toBeCloseTo(128 / 44100 * 1000, 2);
    expect(latency.lookahead).toBe(0);
    expect(latency.reportedToHost).toBe(true);
  });

  it('should create zero latency as not reported', () => {
    const latency = createDefaultLatency(0);
    expect(latency.reportedToHost).toBe(false);
  });

  it('should create default memory footprint', () => {
    const memory = createDefaultMemory(50);
    
    expect(memory.estimatedMB).toBe(50);
    expect(memory.sampleBufferMB).toBe(0);
    expect(memory.dynamicAllocation).toBe(false);
  });

  it('should create event card behavior', () => {
    const behavior = createEventCardBehavior();
    
    expect(behavior.mode).toBe('event');
    expect(behavior.pure).toBe(true);
    expect(behavior.stateful).toBe(false);
    expect(behavior.realtime).toBe(false);
    expect(behavior.cacheable).toBe(true);
    expect(behavior.threadSafety).toBe('parallel-safe');
    expect(behavior.cpuIntensity).toBe('light');
  });

  it('should create audio card behavior', () => {
    const behavior = createAudioCardBehavior(256, 10);
    
    expect(behavior.mode).toBe('audio');
    expect(behavior.pure).toBe(false);
    expect(behavior.stateful).toBe(true);
    expect(behavior.realtime).toBe(true);
    expect(behavior.cacheable).toBe(false);
    expect(behavior.threadSafety).toBe('audio-safe');
    expect(behavior.latency.samples).toBe(256);
    expect(behavior.memoryFootprint.estimatedMB).toBe(10);
  });

  it('should create instrument behavior', () => {
    const behavior = createInstrumentBehavior(100);
    
    expect(behavior.mode).toBe('hybrid');
    expect(behavior.stateful).toBe(true);
    expect(behavior.realtime).toBe(true);
    expect(behavior.memoryFootprint.sampleBufferMB).toBe(100);
    expect(behavior.sideEffects).toContain('audio-output');
    expect(behavior.sideEffects).toContain('midi-output');
  });
});

// ============================================================================
// CONTROL CREATION TESTS
// ============================================================================

describe('CardVisuals - Control Creation', () => {
  it('should create knob control', () => {
    const knob = createKnobControl('vol', 'volume', 'Volume');
    
    expect(knob.id).toBe('vol');
    expect(knob.type).toBe('knob');
    expect(knob.paramId).toBe('volume');
    expect(knob.label).toBe('Volume');
    expect(knob.style.size).toBe('md');
    expect(knob.style.labelPosition).toBe('bottom');
  });

  it('should create slider control', () => {
    const slider = createSliderControl('lvl', 'level', 'Level');
    
    expect(slider.id).toBe('lvl');
    expect(slider.type).toBe('slider');
    expect(slider.paramId).toBe('level');
    expect(slider.style.variant).toBe('horizontal');
  });

  it('should create toggle control', () => {
    const toggle = createToggleControl('mute', 'muted', 'Mute');
    
    expect(toggle.type).toBe('toggle');
    expect(toggle.style.variant).toBe('switch');
  });

  it('should create button control', () => {
    const button = createButtonControl('play', 'Play');
    
    expect(button.type).toBe('button');
    expect(button.paramId).toBeUndefined();
    expect(button.style.variant).toBe('primary');
  });

  it('should create dropdown control', () => {
    const dropdown = createDropdownControl('wave', 'waveform', 'Waveform');
    
    expect(dropdown.type).toBe('dropdown');
    expect(dropdown.paramId).toBe('waveform');
  });

  it('should allow custom options', () => {
    const knob = createKnobControl('vol', 'volume', 'Volume', {
      row: 1,
      col: 2,
      tooltip: 'Master volume',
    });
    
    expect(knob.row).toBe(1);
    expect(knob.col).toBe(2);
    expect(knob.tooltip).toBe('Master volume');
  });
});

// ============================================================================
// PANEL AND UI CONFIG TESTS
// ============================================================================

describe('CardVisuals - Panel and UI Config', () => {
  it('should create panel with controls', () => {
    const controls = [
      createKnobControl('vol', 'volume', 'Volume'),
      createKnobControl('pan', 'pan', 'Pan'),
    ];
    const panel = createPanel('main', 'Main Controls', 'main', controls);
    
    expect(panel.id).toBe('main');
    expect(panel.label).toBe('Main Controls');
    expect(panel.position).toBe('main');
    expect(panel.controls).toHaveLength(2);
    expect(panel.layout.type).toBe('grid');
    expect(panel.layout.columns).toBe(4);
    expect(panel.collapsible).toBe(false); // main is not collapsible
  });

  it('should make sidebar panels collapsible', () => {
    const panel = createPanel('options', 'Options', 'sidebar', []);
    expect(panel.collapsible).toBe(true);
  });

  it('should create default UI config', () => {
    const config = createDefaultUIConfig('knobs');
    
    expect(config.editorType).toBe('knobs');
    expect(config.defaultView).toBe('standard');
    expect(config.resizable).toBe(true);
    expect(config.minWidth).toBe(200);
    expect(config.minHeight).toBe(150);
    expect(config.theme).toBe(DEFAULT_DARK_THEME);
  });
});

// ============================================================================
// THEME TESTS
// ============================================================================

describe('CardVisuals - Themes', () => {
  it('should have dark theme defaults', () => {
    expect(DEFAULT_DARK_THEME.name).toBe('dark');
    expect(DEFAULT_DARK_THEME.background).toBe('#1e1e1e');
    expect(DEFAULT_DARK_THEME.foreground).toBe('#ffffff');
    expect(DEFAULT_DARK_THEME.borderRadius).toBe('8px');
  });

  it('should have light theme defaults', () => {
    expect(DEFAULT_LIGHT_THEME.name).toBe('light');
    expect(DEFAULT_LIGHT_THEME.background).toBe('#ffffff');
    expect(DEFAULT_LIGHT_THEME.foreground).toBe('#1e1e1e');
  });
});

// ============================================================================
// CSS GENERATION TESTS
// ============================================================================

describe('CardVisuals - CSS Generation', () => {
  it('should generate valid CSS for a card', () => {
    const visuals = createDefaultCardVisuals('drum-machine', 'generators');
    const css = generateCardCSS('drum-machine', visuals, DEFAULT_DARK_THEME);
    
    expect(css).toContain('.card-drum-machine');
    expect(css).toContain('--card-primary');
    expect(css).toContain('--card-glow');
    expect(css).toContain('.card-drum-machine.active');
    expect(css).toContain('.card-drum-machine.bypassed');
    expect(css).toContain('.card-drum-machine.muted');
    expect(css).toContain('.card-drum-machine.recording');
    expect(css).toContain('.card-drum-machine.modulated');
    expect(css).toContain('@keyframes recording-pulse');
    expect(css).toContain('@keyframes modulation-pulse');
  });

  it('should include animation keyframes if provided', () => {
    const visuals = {
      ...createDefaultCardVisuals('test', 'generators'),
      animation: {
        name: 'test-animation',
        duration: '1s',
        timing: 'ease',
        iterationCount: 'infinite',
        keyframes: '0% { opacity: 0; } 100% { opacity: 1; }',
      },
    };
    const css = generateCardCSS('test', visuals, DEFAULT_DARK_THEME);
    
    expect(css).toContain('@keyframes test-animation');
    expect(css).toContain('opacity: 0');
    expect(css).toContain('opacity: 1');
  });
});

// ============================================================================
// HTML RENDERING TESTS
// ============================================================================

describe('CardVisuals - HTML Rendering', () => {
  it('should render mini card HTML', () => {
    const visuals = createDefaultCardVisuals('synth', 'generators');
    const html = renderMiniCard('synth', 'Synthesizer', visuals);
    
    expect(html).toContain('class="mini-card card-synth"');
    expect(html).toContain('🎹');
    expect(html).toContain('Synthesizer');
    expect(html).toContain('linear-gradient');
  });

  it('should render ASCII card', () => {
    const visuals = createDefaultCardVisuals('bass', 'generators');
    const ascii = renderAsciiCard('Bass', visuals);
    
    expect(ascii).toContain('🎸');
    expect(ascii).toContain('Bass');
    expect(ascii).toContain('┌');
    expect(ascii).toContain('└');
  });
});

// ============================================================================
// CARD DEFINITION BUILDER TESTS
// ============================================================================

describe('CardVisuals - Card Definition Builder', () => {
  it('should build complete card definition', () => {
    const def = buildCardDefinition(
      {
        id: 'test-card',
        name: 'Test Card',
        category: 'generators',
        description: 'A test card',
        version: '1.0.0',
        author: 'Test',
        tags: ['test'],
      }
    );
    
    expect(def.meta.id).toBe('test-card');
    expect(def.meta.name).toBe('Test Card');
    expect(def.visuals.emoji).toBeDefined();
    expect(def.behavior.mode).toBe('event');
    expect(def.ui.editorType).toBe('knobs');
    expect(def.ports.inputs).toEqual([]);
    expect(def.ports.outputs).toEqual([]);
    expect(def.parameters).toEqual([]);
    expect(def.presets).toEqual([]);
  });

  it('should allow overriding visuals', () => {
    const def = buildCardDefinition(
      {
        id: 'custom',
        name: 'Custom',
        category: 'generators',
        description: 'Custom card',
        version: '1.0.0',
        author: 'Test',
        tags: [],
      },
      {
        visuals: { emoji: '🎯', color: '#FF0000' },
      }
    );
    
    expect(def.visuals.emoji).toBe('🎯');
    expect(def.visuals.color).toBe('#FF0000');
  });
});

// ============================================================================
// DRUM MACHINE CARD TESTS
// ============================================================================

describe('Generator Card UI - Drum Machine', () => {
  it('should have correct visuals', () => {
    expect(DRUM_MACHINE_VISUALS.emoji).toBe('🥁');
    expect(DRUM_MACHINE_VISUALS.color).toBe('#FF5722');
    expect(DRUM_MACHINE_VISUALS.animation).toBeDefined();
  });

  it('should have complete parameters', () => {
    expect(DRUM_MACHINE_PARAMETERS.length).toBeGreaterThan(10);
    
    const tempo = DRUM_MACHINE_PARAMETERS.find(p => p.id === 'tempo');
    expect(tempo).toBeDefined();
    expect(tempo!.type).toBe('float');
    expect(tempo!.default).toBe(120);
    expect(tempo!.min).toBe(40);
    expect(tempo!.max).toBe(300);
    expect(tempo!.unit).toBe('bpm');
  });

  it('should have presets', () => {
    expect(DRUM_MACHINE_PRESETS.length).toBeGreaterThan(10);
    
    const trap = DRUM_MACHINE_PRESETS.find(p => p.id === '808-trap');
    expect(trap).toBeDefined();
    expect(trap!.category).toBe('Electronic');
    expect(trap!.params.kit).toBe('808');
  });

  it('should have complete card definition', () => {
    expect(DRUM_MACHINE_CARD.meta.id).toBe('drum-machine');
    expect(DRUM_MACHINE_CARD.meta.name).toBe('Drum Machine');
    expect(DRUM_MACHINE_CARD.visuals.emoji).toBe(DRUM_MACHINE_VISUALS.emoji);
    expect(DRUM_MACHINE_CARD.visuals.color).toBe(DRUM_MACHINE_VISUALS.color);
    expect(DRUM_MACHINE_CARD.ui.panels.length).toBeGreaterThan(0);
    expect(DRUM_MACHINE_CARD.ports.inputs.length).toBeGreaterThan(0);
    expect(DRUM_MACHINE_CARD.ports.outputs.length).toBeGreaterThan(0);
  });

  it('should have Event<Note> input and audio outputs', () => {
    const notesIn = DRUM_MACHINE_CARD.ports.inputs.find(p => p.type === 'Event<Note>');
    expect(notesIn).toBeDefined();
    
    const audioL = DRUM_MACHINE_CARD.ports.outputs.find(p => p.name === 'audio-l');
    const audioR = DRUM_MACHINE_CARD.ports.outputs.find(p => p.name === 'audio-r');
    expect(audioL).toBeDefined();
    expect(audioR).toBeDefined();
  });
});

// ============================================================================
// SYNTH CARD TESTS
// ============================================================================

describe('Generator Card UI - Synth', () => {
  it('should have correct visuals', () => {
    expect(SYNTH_VISUALS.emoji).toBe('🎹');
    expect(SYNTH_VISUALS.color).toBe('#3F51B5');
  });

  it('should have oscillator parameters', () => {
    const osc1Wave = SYNTH_PARAMETERS.find(p => p.id === 'osc1-waveform');
    expect(osc1Wave).toBeDefined();
    expect(osc1Wave!.type).toBe('enum');
    expect(osc1Wave!.options).toContain('saw');
    expect(osc1Wave!.options).toContain('sine');
    expect(osc1Wave!.options).toContain('square');
  });

  it('should have filter parameters', () => {
    const cutoff = SYNTH_PARAMETERS.find(p => p.id === 'filter-cutoff');
    expect(cutoff).toBeDefined();
    expect(cutoff!.min).toBe(20);
    expect(cutoff!.max).toBe(20000);
    expect(cutoff!.modulatable).toBe(true);
    expect(cutoff!.automatable).toBe(true);
  });

  it('should have envelope parameters', () => {
    const attack = SYNTH_PARAMETERS.find(p => p.id === 'amp-attack');
    const decay = SYNTH_PARAMETERS.find(p => p.id === 'amp-decay');
    const sustain = SYNTH_PARAMETERS.find(p => p.id === 'amp-sustain');
    const release = SYNTH_PARAMETERS.find(p => p.id === 'amp-release');
    
    expect(attack).toBeDefined();
    expect(decay).toBeDefined();
    expect(sustain).toBeDefined();
    expect(release).toBeDefined();
  });

  it('should have bass presets', () => {
    const fatBass = SYNTH_PRESETS.find(p => p.id === 'fat-bass');
    expect(fatBass).toBeDefined();
    expect(fatBass!.category).toBe('Bass');
  });

  it('should have lead presets', () => {
    const supersaw = SYNTH_PRESETS.find(p => p.id === 'supersaw-lead');
    expect(supersaw).toBeDefined();
    expect(supersaw!.params.unison).toBe(7);
  });

  it('should have pad presets', () => {
    const warmPad = SYNTH_PRESETS.find(p => p.id === 'warm-pad');
    expect(warmPad).toBeDefined();
    expect(warmPad!.category).toBe('Pad');
  });
});

// ============================================================================
// PIANO CARD TESTS
// ============================================================================

describe('Generator Card UI - Piano', () => {
  it('should have correct visuals', () => {
    expect(PIANO_VISUALS.emoji).toBe('🎹');
    expect(PIANO_VISUALS.color).toBe('#795548');
  });

  it('should have piano type parameter', () => {
    const type = PIANO_PARAMETERS.find(p => p.id === 'type');
    expect(type).toBeDefined();
    expect(type!.options).toContain('grand');
    expect(type!.options).toContain('upright');
    expect(type!.options).toContain('electric');
    expect(type!.options).toContain('toy');
  });

  it('should have mechanical noise parameters', () => {
    const damper = PIANO_PARAMETERS.find(p => p.id === 'damper');
    const pedalNoise = PIANO_PARAMETERS.find(p => p.id === 'pedal-noise');
    const keyNoise = PIANO_PARAMETERS.find(p => p.id === 'key-noise');
    
    expect(damper).toBeDefined();
    expect(pedalNoise).toBeDefined();
    expect(keyNoise).toBeDefined();
  });

  it('should have grand piano presets', () => {
    const concertGrand = PIANO_PRESETS.find(p => p.id === 'concert-grand');
    expect(concertGrand).toBeDefined();
    expect(concertGrand!.params.type).toBe('grand');
  });
});

// ============================================================================
// BASS CARD TESTS
// ============================================================================

describe('Generator Card UI - Bass', () => {
  it('should have correct visuals', () => {
    expect(BASS_VISUALS.emoji).toBe('🎸');
    expect(BASS_VISUALS.color).toBe('#4CAF50');
  });

  it('should have bass type options', () => {
    const type = BASS_PARAMETERS.find(p => p.id === 'type');
    expect(type!.options).toContain('fingered');
    expect(type!.options).toContain('slap');
    expect(type!.options).toContain('pick');
    expect(type!.options).toContain('fretless');
    expect(type!.options).toContain('upright');
    expect(type!.options).toContain('synth-moog');
  });

  it('should have articulation parameters', () => {
    const slide = BASS_PARAMETERS.find(p => p.id === 'slide');
    const hammer = BASS_PARAMETERS.find(p => p.id === 'hammer');
    
    expect(slide).toBeDefined();
    expect(hammer).toBeDefined();
  });

  it('should have synth bass presets', () => {
    const moogSub = BASS_PRESETS.find(p => p.id === 'moog-sub');
    expect(moogSub).toBeDefined();
    expect(moogSub!.params.type).toBe('synth-moog');
  });
});

// ============================================================================
// STRINGS CARD TESTS
// ============================================================================

describe('Generator Card UI - Strings', () => {
  it('should have correct visuals', () => {
    expect(STRINGS_VISUALS.emoji).toBe('🎻');
    expect(STRINGS_VISUALS.color).toBe('#9C27B0');
  });

  it('should have ensemble options', () => {
    const ensemble = STRINGS_PARAMETERS.find(p => p.id === 'ensemble');
    expect(ensemble!.options).toContain('solo-violin');
    expect(ensemble!.options).toContain('quartet');
    expect(ensemble!.options).toContain('full');
  });

  it('should have articulation options', () => {
    const artic = STRINGS_PARAMETERS.find(p => p.id === 'articulation');
    expect(artic!.options).toContain('sustain');
    expect(artic!.options).toContain('pizzicato');
    expect(artic!.options).toContain('tremolo');
    expect(artic!.options).toContain('spiccato');
  });

  it('should have vibrato parameters', () => {
    const vibDepth = STRINGS_PARAMETERS.find(p => p.id === 'vibrato-depth');
    const vibRate = STRINGS_PARAMETERS.find(p => p.id === 'vibrato-rate');
    
    expect(vibDepth).toBeDefined();
    expect(vibDepth!.modulatable).toBe(true);
    expect(vibRate).toBeDefined();
  });
});

// ============================================================================
// ORGAN CARD TESTS
// ============================================================================

describe('Generator Card UI - Organ', () => {
  it('should have correct visuals', () => {
    expect(ORGAN_VISUALS.emoji).toBe('⛪');
    expect(ORGAN_VISUALS.color).toBe('#8D6E63');
  });

  it('should have 9 drawbar parameters', () => {
    const drawbars = ORGAN_PARAMETERS.filter(p => p.id.startsWith('drawbar-'));
    expect(drawbars).toHaveLength(9);
    
    // All drawbars should be 0-8 range
    for (const db of drawbars) {
      expect(db.type).toBe('int');
      expect(db.min).toBe(0);
      expect(db.max).toBe(8);
      expect(db.automatable).toBe(true);
    }
  });

  it('should have Leslie parameters', () => {
    const leslieEnabled = ORGAN_PARAMETERS.find(p => p.id === 'leslie-enabled');
    const leslieSpeed = ORGAN_PARAMETERS.find(p => p.id === 'leslie-speed');
    
    expect(leslieEnabled).toBeDefined();
    expect(leslieEnabled!.type).toBe('bool');
    expect(leslieSpeed).toBeDefined();
    expect(leslieSpeed!.options).toContain('slow');
    expect(leslieSpeed!.options).toContain('fast');
  });

  it('should have percussion parameters', () => {
    const perc = ORGAN_PARAMETERS.find(p => p.id === 'percussion');
    const percHarm = ORGAN_PARAMETERS.find(p => p.id === 'percussion-harmonic');
    
    expect(perc).toBeDefined();
    expect(percHarm!.options).toContain('2nd');
    expect(percHarm!.options).toContain('3rd');
  });

  it('should have jazz preset', () => {
    const jazzFull = ORGAN_PRESETS.find(p => p.id === 'jazz-full');
    expect(jazzFull).toBeDefined();
    expect(jazzFull!.params.percussion).toBe(true);
  });
});

// ============================================================================
// SAMPLER CARD TESTS
// ============================================================================

describe('Generator Card - Sampler', () => {
  it('should have correct visuals', () => {
    expect(SAMPLER_VISUALS.emoji).toBe('📦');
    expect(SAMPLER_VISUALS.color).toBe('#00BCD4');
    expect(SAMPLER_VISUALS.emojiSecondary).toBe('🎹');
  });

  it('should have zone parameters', () => {
    const rootKey = SAMPLER_PARAMETERS.find(p => p.id === 'zone-root');
    const lowKey = SAMPLER_PARAMETERS.find(p => p.id === 'zone-low');
    const highKey = SAMPLER_PARAMETERS.find(p => p.id === 'zone-high');
    
    expect(rootKey).toBeDefined();
    expect(rootKey!.default).toBe(60);
    expect(lowKey!.default).toBe(0);
    expect(highKey!.default).toBe(127);
  });

  it('should have loop parameters', () => {
    const loopEnabled = SAMPLER_PARAMETERS.find(p => p.id === 'loop-enabled');
    const loopStart = SAMPLER_PARAMETERS.find(p => p.id === 'loop-start');
    const loopCrossfade = SAMPLER_PARAMETERS.find(p => p.id === 'loop-crossfade');
    
    expect(loopEnabled).toBeDefined();
    expect(loopEnabled!.type).toBe('bool');
    expect(loopStart).toBeDefined();
    expect(loopCrossfade).toBeDefined();
  });

  it('should have ADSR envelope', () => {
    const a = SAMPLER_PARAMETERS.find(p => p.id === 'attack');
    const d = SAMPLER_PARAMETERS.find(p => p.id === 'decay');
    const s = SAMPLER_PARAMETERS.find(p => p.id === 'sustain');
    const r = SAMPLER_PARAMETERS.find(p => p.id === 'release');
    
    expect(a).toBeDefined();
    expect(d).toBeDefined();
    expect(s).toBeDefined();
    expect(r).toBeDefined();
  });

  it('should have presets', () => {
    expect(SAMPLER_PRESETS.length).toBeGreaterThanOrEqual(5);
    const oneShot = SAMPLER_PRESETS.find(p => p.id === 'one-shot');
    expect(oneShot).toBeDefined();
  });

  it('should have complete card definition', () => {
    expect(SAMPLER_CARD.meta.id).toBe('sampler');
    expect(SAMPLER_CARD.meta.name).toBe('Sampler');
    expect(SAMPLER_CARD.ui.panels.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// LOOP PLAYER CARD TESTS
// ============================================================================

describe('Generator Card - Loop Player', () => {
  it('should have correct visuals', () => {
    expect(LOOP_PLAYER_VISUALS.emoji).toBe('🔁');
    expect(LOOP_PLAYER_VISUALS.color).toBe('#FF9800');
  });

  it('should have playback modes', () => {
    const playMode = LOOP_PLAYER_PARAMETERS.find(p => p.id === 'play-mode');
    expect(playMode).toBeDefined();
    expect(playMode!.options).toContain('sync');
    expect(playMode!.options).toContain('slice');
    expect(playMode!.options).toContain('granular');
  });

  it('should have pitch/time parameters', () => {
    const transpose = LOOP_PLAYER_PARAMETERS.find(p => p.id === 'transpose');
    const stretch = LOOP_PLAYER_PARAMETERS.find(p => p.id === 'stretch');
    const reverse = LOOP_PLAYER_PARAMETERS.find(p => p.id === 'reverse');
    
    expect(transpose).toBeDefined();
    expect(stretch).toBeDefined();
    expect(stretch!.default).toBe(1);
    expect(reverse).toBeDefined();
    expect(reverse!.type).toBe('bool');
  });

  it('should have slice parameters', () => {
    const sliceCount = LOOP_PLAYER_PARAMETERS.find(p => p.id === 'slice-count');
    const sliceMode = LOOP_PLAYER_PARAMETERS.find(p => p.id === 'slice-mode');
    
    expect(sliceCount).toBeDefined();
    expect(sliceCount!.default).toBe(16);
    expect(sliceMode!.options).toContain('transient');
  });

  it('should have presets', () => {
    expect(LOOP_PLAYER_PRESETS.length).toBeGreaterThanOrEqual(5);
    const slicer = LOOP_PLAYER_PRESETS.find(p => p.id === 'slicer');
    expect(slicer).toBeDefined();
  });
});

// ============================================================================
// ARPEGGIATOR CARD TESTS
// ============================================================================

describe('Generator Card - Arpeggiator', () => {
  it('should have correct visuals', () => {
    expect(ARPEGGIATOR_VISUALS.emoji).toBe('🎼');
    expect(ARPEGGIATOR_VISUALS.color).toBe('#E91E63');
  });

  it('should have pattern types', () => {
    const pattern = ARPEGGIATOR_PARAMETERS.find(p => p.id === 'pattern');
    expect(pattern).toBeDefined();
    expect(pattern!.options).toContain('up');
    expect(pattern!.options).toContain('down');
    expect(pattern!.options).toContain('up-down');
    expect(pattern!.options).toContain('random');
    expect(pattern!.options).toContain('converge');
  });

  it('should have timing parameters', () => {
    const rate = ARPEGGIATOR_PARAMETERS.find(p => p.id === 'rate');
    const gate = ARPEGGIATOR_PARAMETERS.find(p => p.id === 'gate');
    const swing = ARPEGGIATOR_PARAMETERS.find(p => p.id === 'swing');
    
    expect(rate).toBeDefined();
    expect(rate!.options).toContain('1/16');
    expect(gate).toBeDefined();
    expect(swing).toBeDefined();
  });

  it('should have latch/hold controls', () => {
    const latch = ARPEGGIATOR_PARAMETERS.find(p => p.id === 'latch');
    const hold = ARPEGGIATOR_PARAMETERS.find(p => p.id === 'hold');
    
    expect(latch).toBeDefined();
    expect(latch!.type).toBe('bool');
    expect(hold).toBeDefined();
  });

  it('should output Event<Note>', () => {
    const notesOut = ARPEGGIATOR_CARD.ports.outputs.find(p => p.type === 'Event<Note>');
    expect(notesOut).toBeDefined();
  });

  it('should be event-based', () => {
    expect(ARPEGGIATOR_CARD.behavior.mode).toBe('event');
    expect(ARPEGGIATOR_CARD.behavior.cpuIntensity).toBe('light');
  });
});

// ============================================================================
// SEQUENCER CARD TESTS
// ============================================================================

describe('Generator Card - Sequencer', () => {
  it('should have correct visuals', () => {
    expect(SEQUENCER_VISUALS.emoji).toBe('📊');
    expect(SEQUENCER_VISUALS.color).toBe('#673AB7');
  });

  it('should have grid parameters', () => {
    const steps = SEQUENCER_PARAMETERS.find(p => p.id === 'steps');
    const tracks = SEQUENCER_PARAMETERS.find(p => p.id === 'tracks');
    
    expect(steps).toBeDefined();
    expect(steps!.default).toBe(16);
    expect(steps!.max).toBe(64);
    expect(tracks).toBeDefined();
    expect(tracks!.default).toBe(8);
  });

  it('should have step parameters', () => {
    const stepPitch = SEQUENCER_PARAMETERS.find(p => p.id === 'step-pitch');
    const stepVel = SEQUENCER_PARAMETERS.find(p => p.id === 'step-velocity');
    const stepProb = SEQUENCER_PARAMETERS.find(p => p.id === 'step-probability');
    const stepRatchet = SEQUENCER_PARAMETERS.find(p => p.id === 'step-ratchet');
    
    expect(stepPitch).toBeDefined();
    expect(stepVel).toBeDefined();
    expect(stepProb).toBeDefined();
    expect(stepRatchet).toBeDefined();
    expect(stepRatchet!.max).toBe(8);
  });

  it('should have Euclidean parameters', () => {
    const eucEnabled = SEQUENCER_PARAMETERS.find(p => p.id === 'euclidean-enabled');
    const eucHits = SEQUENCER_PARAMETERS.find(p => p.id === 'euclidean-hits');
    const eucRot = SEQUENCER_PARAMETERS.find(p => p.id === 'euclidean-rotation');
    
    expect(eucEnabled).toBeDefined();
    expect(eucHits).toBeDefined();
    expect(eucRot!.automatable).toBe(true);
  });

  it('should have Euclidean presets', () => {
    const euc = SEQUENCER_PRESETS.filter(p => p.category === 'Euclidean');
    expect(euc.length).toBeGreaterThanOrEqual(3);
  });

  it('should have grid UI panel', () => {
    const gridPanel = SEQUENCER_CARD.ui.panels.find(p => p.id === 'grid');
    expect(gridPanel).toBeDefined();
    const gridControl = gridPanel!.controls.find(c => c.type === 'grid');
    expect(gridControl).toBeDefined();
  });
});

// ============================================================================
// CHORD PROGRESSION CARD TESTS
// ============================================================================

describe('Generator Card - Chord Progression', () => {
  it('should have correct visuals', () => {
    expect(CHORD_PROGRESSION_VISUALS.emoji).toBe('🎶');
    expect(CHORD_PROGRESSION_VISUALS.color).toBe('#009688');
  });

  it('should have voicing options', () => {
    const voicing = CHORD_PROGRESSION_PARAMETERS.find(p => p.id === 'voicing');
    expect(voicing).toBeDefined();
    expect(voicing!.options).toContain('close');
    expect(voicing!.options).toContain('drop2');
    expect(voicing!.options).toContain('shell');
    expect(voicing!.options).toContain('rootless');
  });

  it('should have voice leading toggle', () => {
    const vl = CHORD_PROGRESSION_PARAMETERS.find(p => p.id === 'voice-leading');
    expect(vl).toBeDefined();
    expect(vl!.type).toBe('bool');
    expect(vl!.default).toBe(true);
  });

  it('should have rhythm patterns', () => {
    const rhythm = CHORD_PROGRESSION_PARAMETERS.find(p => p.id === 'rhythm-pattern');
    expect(rhythm).toBeDefined();
    expect(rhythm!.options).toContain('sustain');
    expect(rhythm!.options).toContain('strum');
    expect(rhythm!.options).toContain('arpeggiate');
  });

  it('should have jazz and pop presets', () => {
    const jazz = CHORD_PROGRESSION_PRESETS.find(p => p.id === 'jazz-ii-v-i');
    const pop = CHORD_PROGRESSION_PRESETS.find(p => p.id === 'pop-i-v-vi-iv');
    const blues = CHORD_PROGRESSION_PRESETS.find(p => p.id === 'blues-12bar');
    
    expect(jazz).toBeDefined();
    expect(jazz!.params.voicing).toBe('drop2');
    expect(pop).toBeDefined();
    expect(blues).toBeDefined();
  });

  it('should output Event<Note>', () => {
    const notesOut = CHORD_PROGRESSION_CARD.ports.outputs.find(p => p.type === 'Event<Note>');
    expect(notesOut).toBeDefined();
  });
});

// ============================================================================
// CARD REGISTRY TESTS
// ============================================================================

describe('Generator Cards - Registry', () => {
  it('should have all generator cards', () => {
    expect(GENERATOR_CARDS.length).toBe(11);
    
    const ids = GENERATOR_CARDS.map(c => c.meta.id);
    expect(ids).toContain('drum-machine');
    expect(ids).toContain('synth');
    expect(ids).toContain('piano');
    expect(ids).toContain('bass');
    expect(ids).toContain('strings');
    expect(ids).toContain('organ');
    expect(ids).toContain('sampler');
    expect(ids).toContain('loop-player');
    expect(ids).toContain('arpeggiator');
    expect(ids).toContain('sequencer');
    expect(ids).toContain('chord-progression');
  });

  it('should find card by ID', () => {
    const synth = getCardDefinition('synth');
    expect(synth).toBeDefined();
    expect(synth!.meta.name).toBe('Synthesizer');
    
    const sampler = getCardDefinition('sampler');
    expect(sampler).toBeDefined();
    expect(sampler!.meta.name).toBe('Sampler');
    
    const unknown = getCardDefinition('not-a-card');
    expect(unknown).toBeUndefined();
  });

  it('should find cards by category', () => {
    const generators = getCardsByCategory('generators');
    expect(generators.length).toBe(11);
  });

  it('should search cards by tag', () => {
    const bassCards = searchCardsByTag('bass');
    expect(bassCards.length).toBeGreaterThan(0);
    expect(bassCards.some(c => c.meta.id === 'bass')).toBe(true);
    expect(bassCards.some(c => c.meta.id === 'synth')).toBe(true); // synth has 'bass' tag
  });
});

// ============================================================================
// CARD COMPLETENESS TESTS
// ============================================================================

describe('Generator Cards - Completeness', () => {
  it('all cards should have required metadata', () => {
    for (const card of GENERATOR_CARDS) {
      expect(card.meta.id).toBeDefined();
      expect(card.meta.name).toBeDefined();
      expect(card.meta.category).toBe('generators');
      expect(card.meta.description).toBeDefined();
      expect(card.meta.version).toBeDefined();
      expect(card.meta.author).toBeDefined();
      expect(card.meta.tags.length).toBeGreaterThan(0);
    }
  });

  it('all cards should have visuals', () => {
    for (const card of GENERATOR_CARDS) {
      expect(card.visuals.emoji).toBeDefined();
      expect(card.visuals.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(card.visuals.glow).toBeDefined();
    }
  });

  it('all cards should have behavior', () => {
    for (const card of GENERATOR_CARDS) {
      expect(card.behavior.mode).toBeDefined();
      expect(['event', 'audio', 'hybrid', 'view']).toContain(card.behavior.mode);
      expect(card.behavior.latency).toBeDefined();
      expect(card.behavior.cpuIntensity).toBeDefined();
    }
  });

  it('all cards should have UI config', () => {
    for (const card of GENERATOR_CARDS) {
      expect(card.ui.panels.length).toBeGreaterThan(0);
      expect(card.ui.editorType).toBeDefined();
      expect(card.ui.theme).toBeDefined();
      expect(card.ui.minWidth).toBeGreaterThan(0);
      expect(card.ui.minHeight).toBeGreaterThan(0);
    }
  });

  it('all cards should have inputs', () => {
    for (const card of GENERATOR_CARDS) {
      // Cards should have at least one input (MIDI, audio, clock, etc.)
      expect(card.ports.inputs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all cards should have outputs', () => {
    for (const card of GENERATOR_CARDS) {
      // Cards should have either audio outputs or Event<Note> outputs
      const audioOuts = card.ports.outputs.filter(p => p.type === 'audio');
      const noteOuts = card.ports.outputs.filter(p => p.type === 'Event<Note>');
      const hasOutput = audioOuts.length >= 2 || noteOuts.length >= 1;
      expect(hasOutput).toBe(true);
    }
  });

  it('all cards should have at least 5 presets', () => {
    for (const card of GENERATOR_CARDS) {
      expect(card.presets.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('all cards should have at least 5 parameters', () => {
    for (const card of GENERATOR_CARDS) {
      expect(card.parameters.length).toBeGreaterThanOrEqual(5);
    }
  });
});

// ============================================================================
// BADGE SYSTEM TESTS
// ============================================================================

describe('CardVisuals - Badge System', () => {
  it('should have all badge types defined', () => {
    expect(CARD_BADGES.recording).toBeDefined();
    expect(CARD_BADGES.bypassed).toBeDefined();
    expect(CARD_BADGES.soloed).toBeDefined();
    expect(CARD_BADGES.muted).toBeDefined();
    expect(CARD_BADGES.automation).toBeDefined();
    expect(CARD_BADGES.error).toBeDefined();
    expect(CARD_BADGES['midi-learn']).toBeDefined();
  });

  it('should create badge with defaults', () => {
    const badge = createBadge('recording');
    expect(badge.type).toBe('recording');
    expect(badge.active).toBe(true);
    expect(badge.pulse).toBe(true);
    expect(badge.color).toBe('#f44336');
  });

  it('should create inactive badge', () => {
    const badge = createBadge('muted', false);
    expect(badge.active).toBe(false);
  });

  it('should override badge properties', () => {
    const badge = createBadge('custom', true, { label: 'My Badge', color: '#123456' });
    expect(badge.label).toBe('My Badge');
    expect(badge.color).toBe('#123456');
  });

  it('recording badge should pulse', () => {
    expect(CARD_BADGES.recording.pulse).toBe(true);
    expect(CARD_BADGES.error.pulse).toBe(true);
    expect(CARD_BADGES['midi-learn'].pulse).toBe(true);
  });
});

// ============================================================================
// FRAME SYSTEM TESTS
// ============================================================================

describe('CardVisuals - Frame System', () => {
  it('should have all frame variants defined', () => {
    expect(CARD_FRAMES.minimal).toBeDefined();
    expect(CARD_FRAMES.standard).toBeDefined();
    expect(CARD_FRAMES.expanded).toBeDefined();
    expect(CARD_FRAMES.fullscreen).toBeDefined();
    expect(CARD_FRAMES.floating).toBeDefined();
  });

  it('minimal frame should hide header/footer', () => {
    const frame = CARD_FRAMES.minimal;
    expect(frame.showHeader).toBe(false);
    expect(frame.showFooter).toBe(false);
    expect(frame.headerHeight).toBe(0);
  });

  it('standard frame should show everything', () => {
    const frame = CARD_FRAMES.standard;
    expect(frame.showHeader).toBe(true);
    expect(frame.showFooter).toBe(true);
    expect(frame.showPorts).toBe(true);
    expect(frame.showResizeHandles).toBe(true);
  });

  it('fullscreen frame should hide ports and resize', () => {
    const frame = CARD_FRAMES.fullscreen;
    expect(frame.showPorts).toBe(false);
    expect(frame.showResizeHandles).toBe(false);
    expect(frame.borderWidth).toBe(0);
    expect(frame.cornerRadius).toBe(0);
  });

  it('should create frame with defaults', () => {
    const frame = createFrame('standard');
    expect(frame.variant).toBe('standard');
    expect(frame.showHeader).toBe(true);
  });

  it('should create frame with overrides', () => {
    const frame = createFrame('standard', { headerHeight: 50 });
    expect(frame.headerHeight).toBe(50);
    expect(frame.showHeader).toBe(true); // Still from standard
  });
});

// ============================================================================
// GLOW EFFECTS TESTS
// ============================================================================

describe('CardVisuals - Glow Effects', () => {
  it('should have all glow states defined', () => {
    expect(CARD_GLOW_STATES.idle).toBeDefined();
    expect(CARD_GLOW_STATES.focused).toBeDefined();
    expect(CARD_GLOW_STATES.active).toBeDefined();
    expect(CARD_GLOW_STATES.modulated).toBeDefined();
    expect(CARD_GLOW_STATES.recording).toBeDefined();
    expect(CARD_GLOW_STATES.error).toBeDefined();
  });

  it('idle state should have no glow', () => {
    const glow = CARD_GLOW_STATES.idle;
    expect(glow.intensity).toBe(0);
    expect(glow.blur).toBe(0);
  });

  it('modulated state should pulse', () => {
    const glow = CARD_GLOW_STATES.modulated;
    expect(glow.animation).toBe('pulse');
    expect(glow.color).toBe('#ff9800');
  });

  it('error state should flicker', () => {
    const glow = CARD_GLOW_STATES.error;
    expect(glow.animation).toBe('flicker');
    expect(glow.intensity).toBeGreaterThan(0.5);
  });

  it('should generate glow CSS for idle', () => {
    const css = getGlowCSS('idle');
    expect(css).toContain('box-shadow: none');
  });

  it('should generate glow CSS with animation', () => {
    const css = getGlowCSS('modulated');
    expect(css).toContain('box-shadow:');
    expect(css).toContain('animation:');
  });

  it('should generate keyframes CSS', () => {
    const keyframes = generateGlowKeyframes();
    expect(keyframes).toContain('@keyframes glow-pulse');
    expect(keyframes).toContain('@keyframes glow-breathe');
    expect(keyframes).toContain('@keyframes glow-flicker');
  });
});

// ============================================================================
// USER-INJECTABLE CARD SYSTEM TESTS
// ============================================================================

describe('CardVisuals - User-Injectable System', () => {
  describe('validateUserCardTemplate', () => {
    it('should validate minimal valid template', () => {
      const result = validateUserCardTemplate({ id: 'my-card', name: 'My Card' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing id', () => {
      const result = validateUserCardTemplate({ id: '', name: 'My Card' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card id is required');
    });

    it('should reject missing name', () => {
      const result = validateUserCardTemplate({ id: 'my-card', name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card name is required');
    });

    it('should reject invalid id format', () => {
      const result = validateUserCardTemplate({ id: 'MyCard', name: 'My Card' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('kebab-case'))).toBe(true);
    });

    it('should reject invalid color format', () => {
      const result = validateUserCardTemplate({ id: 'my-card', name: 'My Card', color: 'red' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('hex code'))).toBe(true);
    });

    it('should accept valid hex color', () => {
      const result = validateUserCardTemplate({ id: 'my-card', name: 'My Card', color: '#FF5500' });
      expect(result.valid).toBe(true);
    });

    it('should reject duplicate parameter ids', () => {
      const result = validateUserCardTemplate({
        id: 'my-card',
        name: 'My Card',
        params: [
          { id: 'volume', label: 'Volume', type: 'number' },
          { id: 'volume', label: 'Volume 2', type: 'number' },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate parameter'))).toBe(true);
    });

    it('should reject choice param without choices', () => {
      const result = validateUserCardTemplate({
        id: 'my-card',
        name: 'My Card',
        params: [{ id: 'mode', label: 'Mode', type: 'choice' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('requires choices'))).toBe(true);
    });

    it('should warn about missing description', () => {
      const result = validateUserCardTemplate({ id: 'my-card', name: 'My Card' });
      expect(result.warnings.some(w => w.includes('Description'))).toBe(true);
    });

    it('should warn about preset referencing unknown param', () => {
      const result = validateUserCardTemplate({
        id: 'my-card',
        name: 'My Card',
        params: [{ id: 'volume', label: 'Volume', type: 'number' }],
        presets: [{ name: 'Default', params: { volume: 0.8, unknown: 1 } }],
      });
      expect(result.warnings.some(w => w.includes('unknown parameter'))).toBe(true);
    });
  });

  describe('buildCardFromUserTemplate', () => {
    it('should build card from minimal template', () => {
      const card = buildCardFromUserTemplate({ id: 'my-synth', name: 'My Synth' });
      expect(card.meta.id).toBe('my-synth');
      expect(card.meta.name).toBe('My Synth');
      expect(card.meta.author).toBe('User');
      expect(card.visuals.emoji).toBeDefined();
    });

    it('should use custom emoji and color', () => {
      const card = buildCardFromUserTemplate({
        id: 'my-synth',
        name: 'My Synth',
        emoji: '🎵',
        color: '#FF0000',
      });
      expect(card.visuals.emoji).toBe('🎵');
      expect(card.visuals.color).toBe('#FF0000');
    });

    it('should convert user parameters to definitions', () => {
      const card = buildCardFromUserTemplate({
        id: 'my-synth',
        name: 'My Synth',
        params: [
          { id: 'volume', label: 'Volume', type: 'number', min: 0, max: 100, default: 80 },
          { id: 'mute', label: 'Mute', type: 'bool', default: false },
          { id: 'mode', label: 'Mode', type: 'choice', choices: ['A', 'B', 'C'] },
        ],
      });
      
      expect(card.parameters).toHaveLength(3);
      // Int range 0-100 with integer default → int
      expect(card.parameters[0].type).toBe('int');
      expect(card.parameters[0].default).toBe(80);
      expect(card.parameters[1].type).toBe('bool');
      expect(card.parameters[2].type).toBe('enum');
      expect(card.parameters[2].options).toContain('A');
    });

    it('should convert user presets to definitions', () => {
      const card = buildCardFromUserTemplate({
        id: 'my-synth',
        name: 'My Synth',
        presets: [{ name: 'Init', params: { volume: 0.5 } }],
      });
      
      expect(card.presets).toHaveLength(1);
      expect(card.presets[0].name).toBe('Init');
      expect(card.presets[0].category).toBe('User');
    });

    it('should throw on invalid template', () => {
      expect(() => buildCardFromUserTemplate({ id: '', name: '' })).toThrow();
    });

    it('should set appropriate ports for generators', () => {
      const card = buildCardFromUserTemplate({
        id: 'my-synth',
        name: 'My Synth',
        category: 'generators',
      });
      
      const notesIn = card.ports.inputs.find(p => p.type === 'Event<Note>');
      expect(notesIn).toBeDefined();
      expect(card.ports.outputs.length).toBe(2); // Stereo
    });
  });

  describe('cloneCardWithOverrides', () => {
    it('should clone card with new id', () => {
      const clone = cloneCardWithOverrides(SYNTH_CARD, { id: 'my-synth-clone' });
      expect(clone.meta.id).toBe('my-synth-clone');
      expect(clone.meta.name).toBe('Synthesizer (Clone)');
      expect(clone.parameters).toEqual(SYNTH_CARD.parameters);
    });

    it('should clone with custom name', () => {
      const clone = cloneCardWithOverrides(SYNTH_CARD, { id: 'my-synth', name: 'Custom Synth' });
      expect(clone.meta.name).toBe('Custom Synth');
    });

    it('should clone with visual overrides', () => {
      const clone = cloneCardWithOverrides(SYNTH_CARD, {
        id: 'my-synth',
        visuals: { emoji: '🎤', color: '#FF0000' },
      });
      expect(clone.visuals.emoji).toBe('🎤');
      expect(clone.visuals.color).toBe('#FF0000');
    });
  });
});

// ============================================================================
// CURRIED PRESET SYSTEM TESTS
// ============================================================================

describe('CardVisuals - Curried Preset System', () => {
  const basePreset = {
    id: 'init',
    name: 'Init',
    params: { attack: 0.01, decay: 0.5, sustain: 0.8, release: 0.2 },
  };

  describe('curryPreset', () => {
    it('should create curried preset factory', () => {
      const fastAttack = curryPreset(basePreset, { attack: 0.001 });
      const result = fastAttack();
      
      expect(result.params.attack).toBe(0.001);
      expect(result.params.decay).toBe(0.5); // Preserved
    });

    it('should allow overrides but not locked params', () => {
      const fastAttack = curryPreset(basePreset, { attack: 0.001 });
      const result = fastAttack({ decay: 1.0, attack: 0.5 });
      
      expect(result.params.attack).toBe(0.001); // Locked
      expect(result.params.decay).toBe(1.0); // Overridden
    });
  });

  describe('composePresets', () => {
    it('should merge multiple presets', () => {
      const preset1 = { id: 'a', name: 'A', params: { attack: 0.1, decay: 0.5 } };
      const preset2 = { id: 'b', name: 'B', params: { decay: 1.0, release: 0.3 } };
      
      const composed = composePresets([preset1, preset2], 'A+B');
      
      expect(composed.params.attack).toBe(0.1);
      expect(composed.params.decay).toBe(1.0); // Later wins
      expect(composed.params.release).toBe(0.3);
    });

    it('should throw on empty array', () => {
      expect(() => composePresets([], 'Empty')).toThrow();
    });
  });

  describe('applyCurriedPreset', () => {
    it('should apply curried to base', () => {
      const curried = createCurriedPreset('fast-attack', 'Fast Attack', { attack: 0.001 });
      const result = applyCurriedPreset(curried, basePreset);
      
      expect(result.params.attack).toBe(0.001);
      expect(result.name).toContain('Fast Attack');
    });

    it('should apply defaults and locked', () => {
      const curried = createCurriedPreset('mod', 'Modulated', { release: 2.0 }, {
        defaultParams: { decay: 0.8 },
      });
      const result = applyCurriedPreset(curried, basePreset);
      
      expect(result.params.release).toBe(2.0); // Locked
      expect(result.params.decay).toBe(0.8); // Default
    });
  });

  describe('morphPresets', () => {
    it('should interpolate at 0', () => {
      const from = { id: 'a', name: 'A', params: { volume: 0 } };
      const to = { id: 'b', name: 'B', params: { volume: 1 } };
      
      const result = morphPresets(from, to, 0);
      expect(result.params.volume).toBe(0);
    });

    it('should interpolate at 1', () => {
      const from = { id: 'a', name: 'A', params: { volume: 0 } };
      const to = { id: 'b', name: 'B', params: { volume: 1 } };
      
      const result = morphPresets(from, to, 1);
      expect(result.params.volume).toBe(1);
    });

    it('should interpolate at 0.5', () => {
      const from = { id: 'a', name: 'A', params: { volume: 0 } };
      const to = { id: 'b', name: 'B', params: { volume: 1 } };
      
      const result = morphPresets(from, to, 0.5);
      expect(result.params.volume).toBe(0.5);
    });

    it('should snap non-numeric values at midpoint', () => {
      const from = { id: 'a', name: 'A', params: { mode: 'sine' } };
      const to = { id: 'b', name: 'B', params: { mode: 'saw' } };
      
      expect(morphPresets(from, to, 0.4).params.mode).toBe('sine');
      expect(morphPresets(from, to, 0.6).params.mode).toBe('saw');
    });

    it('should clamp t to 0-1 range', () => {
      const from = { id: 'a', name: 'A', params: { volume: 0 } };
      const to = { id: 'b', name: 'B', params: { volume: 1 } };
      
      expect(morphPresets(from, to, -0.5).params.volume).toBe(0);
      expect(morphPresets(from, to, 1.5).params.volume).toBe(1);
    });
  });

  describe('randomizePreset', () => {
    it('should randomize specified params', () => {
      const result = randomizePreset(
        basePreset,
        ['attack'],
        { attack: { min: 0, max: 1 } },
        12345
      );
      
      expect(result.params.attack).not.toBe(basePreset.params.attack);
      expect(result.params.attack).toBeGreaterThanOrEqual(0);
      expect(result.params.attack).toBeLessThanOrEqual(1);
      expect(result.params.decay).toBe(0.5); // Not randomized
    });

    it('should be deterministic with seed', () => {
      const r1 = randomizePreset(basePreset, ['attack'], { attack: { min: 0, max: 1 } }, 42);
      const r2 = randomizePreset(basePreset, ['attack'], { attack: { min: 0, max: 1 } }, 42);
      
      expect(r1.params.attack).toBe(r2.params.attack);
    });
  });

  describe('mutatePreset', () => {
    it('should mutate numeric values', () => {
      const result = mutatePreset(basePreset, 0.1, 12345);
      
      // Values should be close but different
      expect(result.params.attack).not.toBe(basePreset.params.attack);
      expect(Math.abs(result.params.attack as number - (basePreset.params.attack as number))).toBeLessThan(0.1);
    });

    it('should be deterministic with seed', () => {
      const m1 = mutatePreset(basePreset, 0.1, 42);
      const m2 = mutatePreset(basePreset, 0.1, 42);
      
      expect(m1.params.attack).toBe(m2.params.attack);
    });
  });

  describe('createPresetScene', () => {
    it('should create scene with card presets', () => {
      const scene = createPresetScene('my-scene', 'My Scene', {
        'drum-machine': 'acoustic-live',
        'bass': 'fingered-warm',
        'piano': 'grand-concert',
      });
      
      expect(scene.id).toBe('my-scene');
      expect(scene.cardPresets['drum-machine']).toBe('acoustic-live');
      expect(scene.cardPresets['bass']).toBe('fingered-warm');
    });
  });
});

// ============================================================================
// SVG / CANVAS GENERATION TESTS
// ============================================================================

describe('CardVisuals - SVG/Canvas Generation', () => {
  describe('cardToSVG', () => {
    it('should generate valid SVG', () => {
      const svg = cardToSVG('synth', SYNTH_VISUALS);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain(SYNTH_VISUALS.emoji);
    });

    it('should include gradient', () => {
      const svg = cardToSVG('synth', SYNTH_VISUALS);
      
      expect(svg).toContain('linearGradient');
      expect(svg).toContain(SYNTH_VISUALS.color);
    });

    it('should respect size parameter', () => {
      const svg = cardToSVG('synth', SYNTH_VISUALS, 64);
      
      expect(svg).toContain('width="64"');
      expect(svg).toContain('height="64"');
    });
  });

  describe('createCardCanvasRenderer', () => {
    it('should return a function', () => {
      const renderer = createCardCanvasRenderer('synth', SYNTH_VISUALS);
      expect(typeof renderer).toBe('function');
    });
  });

  describe('CONNECTION_STYLES', () => {
    it('should have styles for all port types', () => {
      expect(CONNECTION_STYLES['audio']).toBeDefined();
      expect(CONNECTION_STYLES['Event<Note>']).toBeDefined();
      expect(CONNECTION_STYLES['control']).toBeDefined();
      expect(CONNECTION_STYLES['trigger']).toBeDefined();
    });

    it('audio connections should be thick green', () => {
      expect(CONNECTION_STYLES['audio'].color).toBe('#4CAF50');
      expect(CONNECTION_STYLES['audio'].width).toBeGreaterThan(2);
      expect(CONNECTION_STYLES['audio'].style).toBe('solid');
    });

    it('control connections should be dotted', () => {
      expect(CONNECTION_STYLES['control'].style).toBe('dotted');
    });
  });

  describe('generateConnectionCSS', () => {
    it('should generate CSS for all connection types', () => {
      const css = generateConnectionCSS();
      
      expect(css).toContain('.connection-audio');
      expect(css).toContain('.connection-event-note-');
      expect(css).toContain('stroke:');
      expect(css).toContain('stroke-width:');
    });
  });
});
