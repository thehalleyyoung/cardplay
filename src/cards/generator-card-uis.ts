/**
 * @fileoverview Generator Card UI Definitions.
 * 
 * Complete UI definitions for all generator cards including:
 * - DrumMachineCard UI
 * - SynthCard UI  
 * - SamplerCard UI
 * - PianoCard UI
 * - BassCard UI
 * - StringsCard UI
 * - BrassCard UI
 * - WoodwindsCard UI
 * - OrganCard UI
 * - PadSynthCard UI
 * - LeadSynthCard UI
 * - LoopPlayerCard UI
 * - ArpeggiatorCard UI
 * - SequencerCard UI
 * - ChordProgressionCard UI
 * - MelodyCard UI
 * - BasslineCard UI
 * 
 * @module @cardplay/core/cards/generator-card-uis
 */

import type {
  CardDefinition,
  CardVisuals,
  // CardBehavior, // Available but not used in this file
  // CardUIConfig, // Available but not used in this file
  CardPanel,
  CardControl,
  ParameterDefinition,
  PresetDefinition,
} from './card-visuals';

import {
  createKnobControl,
  createSliderControl,
  createToggleControl,
  createButtonControl,
  createDropdownControl,
  createPanel,
  createDefaultUIConfig,
  createInstrumentBehavior,
  // createAudioCardBehavior, // Reserved for audio-specific cards
  buildCardDefinition,
  DEFAULT_DARK_THEME,
  // CARD_CATEGORY_COLORS, // Reserved for category coloring
} from './card-visuals';

// ============================================================================
// DRUM MACHINE CARD UI
// ============================================================================

/**
 * Drum Machine visuals.
 */
export const DRUM_MACHINE_VISUALS: CardVisuals = {
  emoji: '🥁',
  emojiSecondary: '💥',
  color: '#FF5722',
  colorSecondary: '#E64A19',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#FF8A65',
  glowIntensity: 0.4,
  badgePosition: 'top-right',
  animation: {
    name: 'drum-pulse',
    duration: '0.1s',
    timing: 'ease-out',
    iterationCount: 1,
    keyframes: `
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    `,
  },
};

/**
 * Drum Machine controls.
 */
const DRUM_MACHINE_CONTROLS: readonly CardControl[] = [
  // Row 1: Transport
  createButtonControl('play', 'Play', { row: 0, col: 0, tooltip: 'Start/stop pattern' }),
  createButtonControl('stop', 'Stop', { row: 0, col: 1, tooltip: 'Stop and reset' }),
  createDropdownControl('kit', 'kit', 'Kit', { row: 0, col: 2, colSpan: 2, tooltip: 'Select drum kit' }),
  
  // Row 2: Global controls
  createKnobControl('tempo', 'tempo', 'Tempo', { row: 1, col: 0, tooltip: 'Pattern tempo (BPM)' }),
  createKnobControl('swing', 'swing', 'Swing', { row: 1, col: 1, tooltip: 'Swing amount' }),
  createKnobControl('volume', 'volume', 'Volume', { row: 1, col: 2, tooltip: 'Master volume' }),
  createKnobControl('humanize', 'humanize', 'Humanize', { row: 1, col: 3, tooltip: 'Timing variation' }),
  
  // Row 3: Pattern controls
  createDropdownControl('pattern-length', 'patternLength', 'Length', { row: 2, col: 0, tooltip: 'Pattern length in steps' }),
  createToggleControl('accent', 'accentEnabled', 'Accent', { row: 2, col: 1 }),
  createToggleControl('flam', 'flamEnabled', 'Flam', { row: 2, col: 2 }),
  createButtonControl('clear', 'Clear', { row: 2, col: 3, tooltip: 'Clear pattern' }),
  
  // Pad grid (16 pads)
  { id: 'pad-grid', type: 'pads', style: { size: 'lg', variant: '4x4' }, row: 3, col: 0, colSpan: 4, rowSpan: 4 },
  
  // Step sequencer (below pads)
  { id: 'step-sequencer', type: 'grid', style: { size: 'md', variant: '16-step' }, row: 7, col: 0, colSpan: 4, rowSpan: 2 },
];

/**
 * Drum Machine panels.
 */
const DRUM_MACHINE_PANELS: readonly CardPanel[] = [
  createPanel('main', 'Main', 'main', DRUM_MACHINE_CONTROLS, { columns: 4, rows: 9 }),
  createPanel('pad-settings', 'Pad Settings', 'sidebar', [
    createKnobControl('pad-volume', 'padVolume', 'Volume'),
    createKnobControl('pad-pan', 'padPan', 'Pan'),
    createKnobControl('pad-pitch', 'padPitch', 'Pitch'),
    createKnobControl('pad-decay', 'padDecay', 'Decay'),
    createKnobControl('pad-filter', 'padFilter', 'Filter'),
    createKnobControl('pad-reverb', 'padReverbSend', 'Reverb'),
    createDropdownControl('pad-choke', 'padChokeGroup', 'Choke Group'),
    createToggleControl('pad-mute', 'padMuted', 'Mute'),
    createToggleControl('pad-solo', 'padSoloed', 'Solo'),
  ], { columns: 3 }),
  createPanel('effects', 'Effects', 'footer', [
    createKnobControl('reverb', 'reverbMix', 'Reverb', { style: { size: 'sm', variant: 'default', labelPosition: 'bottom' } }),
    createKnobControl('delay', 'delayMix', 'Delay', { style: { size: 'sm', variant: 'default', labelPosition: 'bottom' } }),
    createKnobControl('drive', 'drive', 'Drive', { style: { size: 'sm', variant: 'default', labelPosition: 'bottom' } }),
    createKnobControl('compression', 'compression', 'Comp', { style: { size: 'sm', variant: 'default', labelPosition: 'bottom' } }),
  ], { columns: 4, type: 'flex' }),
];

/**
 * Drum Machine parameters.
 */
export const DRUM_MACHINE_PARAMETERS: readonly ParameterDefinition[] = [
  { id: 'tempo', type: 'float', label: 'Tempo', default: 120, min: 40, max: 300, unit: 'bpm', group: 'Transport' },
  { id: 'swing', type: 'float', label: 'Swing', default: 0, min: 0, max: 1, group: 'Transport' },
  { id: 'humanize', type: 'float', label: 'Humanize', default: 0, min: 0, max: 1, group: 'Transport' },
  { id: 'volume', type: 'float', label: 'Volume', default: 0.8, min: 0, max: 1, group: 'Master' },
  { id: 'patternLength', type: 'int', label: 'Pattern Length', default: 16, min: 1, max: 64, group: 'Pattern' },
  { id: 'accentEnabled', type: 'bool', label: 'Accent', default: false, group: 'Pattern' },
  { id: 'flamEnabled', type: 'bool', label: 'Flam', default: false, group: 'Pattern' },
  { id: 'kit', type: 'enum', label: 'Kit', default: '808', options: ['808', '909', 'Acoustic', 'Jazz', 'Rock', 'Electronic', 'Lo-Fi'], group: 'Kit' },
  { id: 'reverbMix', type: 'float', label: 'Reverb', default: 0.2, min: 0, max: 1, group: 'Effects' },
  { id: 'delayMix', type: 'float', label: 'Delay', default: 0, min: 0, max: 1, group: 'Effects' },
  { id: 'drive', type: 'float', label: 'Drive', default: 0, min: 0, max: 1, group: 'Effects' },
  { id: 'compression', type: 'float', label: 'Compression', default: 0.3, min: 0, max: 1, group: 'Effects' },
  // Per-pad parameters
  { id: 'padVolume', type: 'float', label: 'Pad Volume', default: 0.8, min: 0, max: 1, group: 'Pad', automatable: true },
  { id: 'padPan', type: 'float', label: 'Pad Pan', default: 0, min: -1, max: 1, group: 'Pad', automatable: true },
  { id: 'padPitch', type: 'float', label: 'Pad Pitch', default: 0, min: -24, max: 24, unit: 'st', group: 'Pad', automatable: true },
  { id: 'padDecay', type: 'float', label: 'Pad Decay', default: 1, min: 0, max: 2, group: 'Pad', automatable: true },
  { id: 'padFilter', type: 'float', label: 'Pad Filter', default: 20000, min: 20, max: 20000, unit: 'Hz', group: 'Pad', automatable: true },
  { id: 'padReverbSend', type: 'float', label: 'Pad Reverb Send', default: 0.1, min: 0, max: 1, group: 'Pad' },
  { id: 'padChokeGroup', type: 'int', label: 'Choke Group', default: 0, min: 0, max: 8, group: 'Pad' },
  { id: 'padMuted', type: 'bool', label: 'Muted', default: false, group: 'Pad' },
  { id: 'padSoloed', type: 'bool', label: 'Soloed', default: false, group: 'Pad' },
];

/**
 * Drum Machine presets.
 */
export const DRUM_MACHINE_PRESETS: readonly PresetDefinition[] = [
  { id: '808-classic', name: '808 Classic', category: 'Electronic', tags: ['808', 'hip-hop', 'trap'], params: { kit: '808', swing: 0, humanize: 0, drive: 0.2 } },
  { id: '808-trap', name: '808 Trap', category: 'Electronic', tags: ['808', 'trap', 'hard'], params: { kit: '808', swing: 0.1, humanize: 0.05, drive: 0.4, compression: 0.5 } },
  { id: '909-house', name: '909 House', category: 'Electronic', tags: ['909', 'house', 'dance'], params: { kit: '909', swing: 0.15, humanize: 0, drive: 0.3 } },
  { id: '909-techno', name: '909 Techno', category: 'Electronic', tags: ['909', 'techno', 'industrial'], params: { kit: '909', swing: 0, humanize: 0, drive: 0.5, compression: 0.7 } },
  { id: 'acoustic-live', name: 'Acoustic Live', category: 'Acoustic', tags: ['acoustic', 'live', 'natural'], params: { kit: 'Acoustic', swing: 0.1, humanize: 0.2, reverbMix: 0.3 } },
  { id: 'acoustic-studio', name: 'Acoustic Studio', category: 'Acoustic', tags: ['acoustic', 'studio', 'clean'], params: { kit: 'Acoustic', swing: 0.05, humanize: 0.1, compression: 0.4 } },
  { id: 'jazz-brush', name: 'Jazz Brushes', category: 'Jazz', tags: ['jazz', 'brush', 'swing'], params: { kit: 'Jazz', swing: 0.3, humanize: 0.15, reverbMix: 0.25 } },
  { id: 'jazz-bebop', name: 'Jazz Bebop', category: 'Jazz', tags: ['jazz', 'bebop', 'fast'], params: { kit: 'Jazz', swing: 0.25, humanize: 0.2, reverbMix: 0.2 } },
  { id: 'rock-power', name: 'Rock Power', category: 'Rock', tags: ['rock', 'power', 'heavy'], params: { kit: 'Rock', swing: 0, humanize: 0.1, drive: 0.4, compression: 0.6 } },
  { id: 'rock-punk', name: 'Punk Rock', category: 'Rock', tags: ['punk', 'fast', 'aggressive'], params: { kit: 'Rock', swing: 0, humanize: 0.05, drive: 0.6, compression: 0.7 } },
  { id: 'electronic-minimal', name: 'Minimal Electronic', category: 'Electronic', tags: ['minimal', 'clean', 'electronic'], params: { kit: 'Electronic', swing: 0, humanize: 0, drive: 0.1 } },
  { id: 'electronic-edm', name: 'EDM Banger', category: 'Electronic', tags: ['edm', 'big-room', 'festival'], params: { kit: 'Electronic', swing: 0, humanize: 0, drive: 0.5, compression: 0.8 } },
  { id: 'lofi-chill', name: 'Lo-Fi Chill', category: 'Lo-Fi', tags: ['lofi', 'chill', 'relaxed'], params: { kit: 'Lo-Fi', swing: 0.2, humanize: 0.25, drive: 0.3, reverbMix: 0.4 } },
  { id: 'lofi-dusty', name: 'Lo-Fi Dusty', category: 'Lo-Fi', tags: ['lofi', 'dusty', 'vinyl'], params: { kit: 'Lo-Fi', swing: 0.15, humanize: 0.3, drive: 0.4, reverbMix: 0.35 } },
];

/**
 * Complete Drum Machine card definition.
 */
export const DRUM_MACHINE_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'drum-machine',
    name: 'Drum Machine',
    category: 'generators',
    description: 'Professional drum machine with 16 pads, step sequencer, and 50+ kit presets',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['drums', 'beats', 'rhythm', 'sampler', 'sequencer'],
  },
  {
    visuals: DRUM_MACHINE_VISUALS,
    behavior: {
      ...createInstrumentBehavior(100),
      stochastic: true, // Humanize is stochastic
    },
    ui: {
      panels: DRUM_MACHINE_PANELS,
      editorType: 'pads',
      defaultView: 'standard',
      resizable: true,
      minWidth: 400,
      minHeight: 500,
      maxWidth: 800,
      theme: {
        ...DEFAULT_DARK_THEME,
        accent: '#FF5722',
      },
    },
    ports: {
      inputs: [
        { name: 'notes', type: 'Event<Note>', label: 'Notes In', description: 'Note events for pad triggers' },
        { name: 'clock', type: 'Event<Clock>', label: 'Clock', description: 'External clock sync', optional: true },
      ],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
        { name: 'notes-out', type: 'Event<Note>', label: 'Notes Out', description: 'Pattern note output' },
      ],
    },
    parameters: DRUM_MACHINE_PARAMETERS,
    presets: DRUM_MACHINE_PRESETS,
  }
);

// ============================================================================
// SYNTH CARD UI
// ============================================================================

/**
 * Synth visuals.
 */
export const SYNTH_VISUALS: CardVisuals = {
  emoji: '🎹',
  emojiSecondary: '✨',
  color: '#3F51B5',
  colorSecondary: '#303F9F',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#7986CB',
  glowIntensity: 0.4,
  badgePosition: 'top-right',
};

/**
 * Synth parameters.
 */
export const SYNTH_PARAMETERS: readonly ParameterDefinition[] = [
  // Oscillators
  { id: 'osc1-waveform', type: 'enum', label: 'OSC1 Wave', default: 'saw', options: ['sine', 'saw', 'square', 'triangle', 'pulse', 'noise'], group: 'OSC1', automatable: true },
  { id: 'osc1-octave', type: 'int', label: 'OSC1 Octave', default: 0, min: -3, max: 3, group: 'OSC1' },
  { id: 'osc1-semi', type: 'int', label: 'OSC1 Semi', default: 0, min: -12, max: 12, unit: 'st', group: 'OSC1' },
  { id: 'osc1-fine', type: 'float', label: 'OSC1 Fine', default: 0, min: -100, max: 100, unit: 'cents', group: 'OSC1', automatable: true, modulatable: true },
  { id: 'osc1-pw', type: 'float', label: 'OSC1 PW', default: 0.5, min: 0.01, max: 0.99, group: 'OSC1', automatable: true, modulatable: true },
  { id: 'osc1-level', type: 'float', label: 'OSC1 Level', default: 1, min: 0, max: 1, group: 'OSC1', automatable: true },
  
  { id: 'osc2-waveform', type: 'enum', label: 'OSC2 Wave', default: 'saw', options: ['sine', 'saw', 'square', 'triangle', 'pulse', 'noise'], group: 'OSC2', automatable: true },
  { id: 'osc2-octave', type: 'int', label: 'OSC2 Octave', default: 0, min: -3, max: 3, group: 'OSC2' },
  { id: 'osc2-semi', type: 'int', label: 'OSC2 Semi', default: 0, min: -12, max: 12, unit: 'st', group: 'OSC2' },
  { id: 'osc2-fine', type: 'float', label: 'OSC2 Fine', default: 0, min: -100, max: 100, unit: 'cents', group: 'OSC2', automatable: true, modulatable: true },
  { id: 'osc2-pw', type: 'float', label: 'OSC2 PW', default: 0.5, min: 0.01, max: 0.99, group: 'OSC2', automatable: true, modulatable: true },
  { id: 'osc2-level', type: 'float', label: 'OSC2 Level', default: 1, min: 0, max: 1, group: 'OSC2', automatable: true },
  
  { id: 'osc3-waveform', type: 'enum', label: 'OSC3 Wave', default: 'sine', options: ['sine', 'saw', 'square', 'triangle', 'pulse', 'noise'], group: 'OSC3', automatable: true },
  { id: 'osc3-octave', type: 'int', label: 'OSC3 Octave', default: -1, min: -3, max: 3, group: 'OSC3' },
  { id: 'osc3-level', type: 'float', label: 'OSC3 Level', default: 0, min: 0, max: 1, group: 'OSC3', automatable: true },
  
  // Filter
  { id: 'filter-type', type: 'enum', label: 'Filter Type', default: 'lowpass', options: ['lowpass', 'highpass', 'bandpass', 'notch', 'lowshelf', 'highshelf', 'peak'], group: 'Filter' },
  { id: 'filter-cutoff', type: 'float', label: 'Cutoff', default: 8000, min: 20, max: 20000, unit: 'Hz', group: 'Filter', automatable: true, modulatable: true },
  { id: 'filter-resonance', type: 'float', label: 'Resonance', default: 0.1, min: 0, max: 1, group: 'Filter', automatable: true, modulatable: true },
  { id: 'filter-env-amount', type: 'float', label: 'Env Amount', default: 0, min: -1, max: 1, group: 'Filter', automatable: true },
  { id: 'filter-key-track', type: 'float', label: 'Key Track', default: 0, min: 0, max: 1, group: 'Filter' },
  
  // Filter Envelope
  { id: 'filter-attack', type: 'float', label: 'F Attack', default: 0.01, min: 0.001, max: 10, unit: 's', group: 'Filter Env' },
  { id: 'filter-decay', type: 'float', label: 'F Decay', default: 0.5, min: 0.001, max: 10, unit: 's', group: 'Filter Env' },
  { id: 'filter-sustain', type: 'float', label: 'F Sustain', default: 0.5, min: 0, max: 1, group: 'Filter Env' },
  { id: 'filter-release', type: 'float', label: 'F Release', default: 0.3, min: 0.001, max: 10, unit: 's', group: 'Filter Env' },
  
  // Amp Envelope
  { id: 'amp-attack', type: 'float', label: 'A Attack', default: 0.01, min: 0.001, max: 10, unit: 's', group: 'Amp Env' },
  { id: 'amp-decay', type: 'float', label: 'A Decay', default: 0.3, min: 0.001, max: 10, unit: 's', group: 'Amp Env' },
  { id: 'amp-sustain', type: 'float', label: 'A Sustain', default: 0.7, min: 0, max: 1, group: 'Amp Env' },
  { id: 'amp-release', type: 'float', label: 'A Release', default: 0.5, min: 0.001, max: 10, unit: 's', group: 'Amp Env' },
  
  // LFO
  { id: 'lfo1-rate', type: 'float', label: 'LFO1 Rate', default: 1, min: 0.01, max: 50, unit: 'Hz', group: 'LFO1', automatable: true },
  { id: 'lfo1-waveform', type: 'enum', label: 'LFO1 Wave', default: 'sine', options: ['sine', 'triangle', 'saw', 'square', 'random', 's&h'], group: 'LFO1' },
  { id: 'lfo1-amount', type: 'float', label: 'LFO1 Amount', default: 0, min: 0, max: 1, group: 'LFO1', automatable: true },
  { id: 'lfo1-destination', type: 'enum', label: 'LFO1 Dest', default: 'none', options: ['none', 'pitch', 'filter', 'amp', 'pw', 'pan'], group: 'LFO1' },
  
  // Master
  { id: 'volume', type: 'float', label: 'Volume', default: 0.7, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'pan', type: 'float', label: 'Pan', default: 0, min: -1, max: 1, group: 'Master', automatable: true },
  { id: 'glide', type: 'float', label: 'Glide', default: 0, min: 0, max: 1, unit: 's', group: 'Master' },
  { id: 'voices', type: 'int', label: 'Voices', default: 8, min: 1, max: 32, group: 'Master' },
  { id: 'unison', type: 'int', label: 'Unison', default: 1, min: 1, max: 8, group: 'Master' },
  { id: 'unison-detune', type: 'float', label: 'Uni Detune', default: 0.1, min: 0, max: 1, group: 'Master', automatable: true },
];

/**
 * Synth presets.
 */
export const SYNTH_PRESETS: readonly PresetDefinition[] = [
  // Init
  { id: 'init', name: 'Init Patch', category: 'Init', params: { 'osc1-waveform': 'saw', 'filter-cutoff': 8000 } },
  
  // Bass
  { id: 'fat-bass', name: 'Fat Bass', category: 'Bass', tags: ['bass', 'fat', 'sub'], params: { 'osc1-waveform': 'saw', 'osc2-waveform': 'saw', 'osc2-fine': -10, 'osc3-level': 0.5, 'filter-cutoff': 400, 'filter-resonance': 0.3, 'amp-attack': 0.001, 'amp-decay': 0.2, 'amp-sustain': 0.8 } },
  { id: 'sub-bass', name: 'Sub Bass', category: 'Bass', tags: ['bass', 'sub', 'deep'], params: { 'osc1-waveform': 'sine', 'osc1-octave': -1, 'filter-cutoff': 200, 'amp-attack': 0.01, 'amp-sustain': 1 } },
  { id: 'acid-bass', name: 'Acid Squelch', category: 'Bass', tags: ['acid', '303', 'squelch'], params: { 'osc1-waveform': 'saw', 'filter-cutoff': 400, 'filter-resonance': 0.7, 'filter-env-amount': 0.6, 'filter-decay': 0.2, 'glide': 0.05 } },
  { id: 'reese-bass', name: 'Reese Bass', category: 'Bass', tags: ['reese', 'dnb', 'dark'], params: { 'osc1-waveform': 'saw', 'osc2-waveform': 'saw', 'osc2-fine': 5, 'unison': 2, 'unison-detune': 0.2, 'filter-cutoff': 800 } },
  
  // Lead
  { id: 'supersaw-lead', name: 'Supersaw Lead', category: 'Lead', tags: ['lead', 'supersaw', 'trance'], params: { 'osc1-waveform': 'saw', 'osc2-waveform': 'saw', 'osc2-fine': 7, 'unison': 7, 'unison-detune': 0.3, 'filter-cutoff': 6000, 'amp-attack': 0.01 } },
  { id: 'square-lead', name: 'Square Lead', category: 'Lead', tags: ['lead', 'square', 'retro'], params: { 'osc1-waveform': 'square', 'osc1-pw': 0.5, 'filter-cutoff': 4000, 'filter-resonance': 0.2, 'glide': 0.02 } },
  { id: 'sync-lead', name: 'Sync Lead', category: 'Lead', tags: ['lead', 'sync', 'aggressive'], params: { 'osc1-waveform': 'saw', 'osc2-waveform': 'saw', 'filter-cutoff': 8000, 'lfo1-destination': 'pitch', 'lfo1-amount': 0.02 } },
  
  // Pad
  { id: 'warm-pad', name: 'Warm Pad', category: 'Pad', tags: ['pad', 'warm', 'lush'], params: { 'osc1-waveform': 'saw', 'osc2-waveform': 'saw', 'osc2-fine': -8, 'filter-cutoff': 2000, 'filter-resonance': 0.1, 'amp-attack': 0.5, 'amp-release': 1.5, 'unison': 4, 'unison-detune': 0.15 } },
  { id: 'string-pad', name: 'String Pad', category: 'Pad', tags: ['pad', 'strings', 'ensemble'], params: { 'osc1-waveform': 'saw', 'osc2-waveform': 'saw', 'osc2-octave': 1, 'filter-cutoff': 3000, 'amp-attack': 0.3, 'amp-release': 1, 'unison': 3 } },
  { id: 'dark-pad', name: 'Dark Pad', category: 'Pad', tags: ['pad', 'dark', 'ambient'], params: { 'osc1-waveform': 'saw', 'osc1-octave': -1, 'filter-cutoff': 800, 'filter-resonance': 0.3, 'amp-attack': 1, 'amp-release': 2 } },
  
  // Pluck
  { id: 'pluck', name: 'Pluck', category: 'Pluck', tags: ['pluck', 'short', 'percussive'], params: { 'osc1-waveform': 'saw', 'filter-cutoff': 6000, 'filter-env-amount': 0.5, 'filter-decay': 0.3, 'amp-attack': 0.001, 'amp-decay': 0.3, 'amp-sustain': 0 } },
  { id: 'bell', name: 'Bell', category: 'Pluck', tags: ['bell', 'fm', 'bright'], params: { 'osc1-waveform': 'sine', 'osc2-waveform': 'sine', 'osc2-semi': 12, 'filter-cutoff': 8000, 'amp-attack': 0.001, 'amp-decay': 2, 'amp-sustain': 0 } },
  
  // Keys
  { id: 'ep-classic', name: 'Classic EP', category: 'Keys', tags: ['ep', 'rhodes', 'classic'], params: { 'osc1-waveform': 'sine', 'osc2-waveform': 'sine', 'osc2-semi': 12, 'osc2-level': 0.3, 'filter-cutoff': 4000, 'amp-attack': 0.001, 'amp-decay': 0.8, 'amp-sustain': 0.4 } },
  { id: 'organ', name: 'Organ', category: 'Keys', tags: ['organ', 'church', 'classic'], params: { 'osc1-waveform': 'sine', 'osc2-waveform': 'sine', 'osc2-octave': 1, 'osc3-waveform': 'sine', 'osc3-octave': -1, 'osc3-level': 0.5, 'filter-cutoff': 12000, 'amp-sustain': 1 } },
];

/**
 * Synth panels.
 */
const SYNTH_PANELS: readonly CardPanel[] = [
  createPanel('oscillators', 'Oscillators', 'main', [
    // OSC1 row
    createDropdownControl('osc1-wave', 'osc1-waveform', 'OSC1', { col: 0, row: 0 }),
    createKnobControl('osc1-oct', 'osc1-octave', 'Oct', { col: 1, row: 0 }),
    createKnobControl('osc1-semi', 'osc1-semi', 'Semi', { col: 2, row: 0 }),
    createKnobControl('osc1-fine', 'osc1-fine', 'Fine', { col: 3, row: 0 }),
    createKnobControl('osc1-pw', 'osc1-pw', 'PW', { col: 4, row: 0 }),
    createKnobControl('osc1-lvl', 'osc1-level', 'Level', { col: 5, row: 0 }),
    // OSC2 row
    createDropdownControl('osc2-wave', 'osc2-waveform', 'OSC2', { col: 0, row: 1 }),
    createKnobControl('osc2-oct', 'osc2-octave', 'Oct', { col: 1, row: 1 }),
    createKnobControl('osc2-semi', 'osc2-semi', 'Semi', { col: 2, row: 1 }),
    createKnobControl('osc2-fine', 'osc2-fine', 'Fine', { col: 3, row: 1 }),
    createKnobControl('osc2-pw', 'osc2-pw', 'PW', { col: 4, row: 1 }),
    createKnobControl('osc2-lvl', 'osc2-level', 'Level', { col: 5, row: 1 }),
    // OSC3/Sub row
    createDropdownControl('osc3-wave', 'osc3-waveform', 'SUB', { col: 0, row: 2 }),
    createKnobControl('osc3-oct', 'osc3-octave', 'Oct', { col: 1, row: 2 }),
    createKnobControl('osc3-lvl', 'osc3-level', 'Level', { col: 2, row: 2 }),
  ], { columns: 6, rows: 3 }),
  
  createPanel('filter', 'Filter', 'main', [
    createDropdownControl('flt-type', 'filter-type', 'Type', { col: 0, row: 0 }),
    createKnobControl('flt-cut', 'filter-cutoff', 'Cutoff', { col: 1, row: 0, style: { size: 'lg', variant: 'default', labelPosition: 'bottom' } }),
    createKnobControl('flt-res', 'filter-resonance', 'Res', { col: 2, row: 0 }),
    createKnobControl('flt-env', 'filter-env-amount', 'Env', { col: 3, row: 0 }),
    createKnobControl('flt-key', 'filter-key-track', 'Key', { col: 4, row: 0 }),
  ], { columns: 5 }),
  
  createPanel('envelopes', 'Envelopes', 'main', [
    // Filter envelope
    { id: 'flt-env-label', type: 'label', label: 'Filter', style: { size: 'sm', variant: 'default' }, col: 0, row: 0 },
    createKnobControl('flt-a', 'filter-attack', 'A', { col: 1, row: 0 }),
    createKnobControl('flt-d', 'filter-decay', 'D', { col: 2, row: 0 }),
    createKnobControl('flt-s', 'filter-sustain', 'S', { col: 3, row: 0 }),
    createKnobControl('flt-r', 'filter-release', 'R', { col: 4, row: 0 }),
    // Amp envelope
    { id: 'amp-env-label', type: 'label', label: 'Amp', style: { size: 'sm', variant: 'default' }, col: 0, row: 1 },
    createKnobControl('amp-a', 'amp-attack', 'A', { col: 1, row: 1 }),
    createKnobControl('amp-d', 'amp-decay', 'D', { col: 2, row: 1 }),
    createKnobControl('amp-s', 'amp-sustain', 'S', { col: 3, row: 1 }),
    createKnobControl('amp-r', 'amp-release', 'R', { col: 4, row: 1 }),
  ], { columns: 5, rows: 2 }),
  
  createPanel('lfo', 'LFO', 'sidebar', [
    createDropdownControl('lfo1-wave', 'lfo1-waveform', 'Wave'),
    createKnobControl('lfo1-rate', 'lfo1-rate', 'Rate'),
    createKnobControl('lfo1-amt', 'lfo1-amount', 'Amount'),
    createDropdownControl('lfo1-dest', 'lfo1-destination', 'Dest'),
  ], { columns: 2 }),
  
  createPanel('master', 'Master', 'footer', [
    createKnobControl('vol', 'volume', 'Volume'),
    createKnobControl('pan', 'pan', 'Pan'),
    createKnobControl('glide', 'glide', 'Glide'),
    createDropdownControl('voices', 'voices', 'Voices'),
    createKnobControl('unison', 'unison', 'Unison'),
    createKnobControl('uni-det', 'unison-detune', 'Detune'),
  ], { columns: 6, type: 'flex' }),
];

/**
 * Complete Synth card definition.
 */
export const SYNTH_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'synth',
    name: 'Synthesizer',
    category: 'generators',
    description: '3-oscillator subtractive synthesizer with filter, envelopes, and LFO',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['synth', 'subtractive', 'analog', 'lead', 'bass', 'pad'],
  },
  {
    visuals: SYNTH_VISUALS,
    behavior: createInstrumentBehavior(5),
    ui: {
      panels: SYNTH_PANELS,
      editorType: 'knobs',
      defaultView: 'standard',
      resizable: true,
      minWidth: 500,
      minHeight: 400,
      theme: { ...DEFAULT_DARK_THEME, accent: '#3F51B5' },
    },
    ports: {
      inputs: [
        { name: 'midi', type: 'midi', label: 'MIDI In' },
        { name: 'mod', type: 'control', label: 'Mod In', optional: true },
      ],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
      ],
    },
    parameters: SYNTH_PARAMETERS,
    presets: SYNTH_PRESETS,
  }
);

// ============================================================================
// PIANO CARD UI
// ============================================================================

export const PIANO_VISUALS: CardVisuals = {
  emoji: '🎹',
  emojiSecondary: '🎵',
  color: '#795548',
  colorSecondary: '#5D4037',
  gradient: 'linear',
  gradientAngle: 180,
  glow: '#A1887F',
  glowIntensity: 0.3,
};

export const PIANO_PARAMETERS: readonly ParameterDefinition[] = [
  { id: 'type', type: 'enum', label: 'Piano Type', default: 'grand', options: ['grand', 'upright', 'electric', 'toy', 'prepared', 'honky-tonk'], group: 'Sound' },
  { id: 'brightness', type: 'float', label: 'Brightness', default: 0.5, min: 0, max: 1, group: 'Tone', automatable: true, modulatable: true },
  { id: 'dynamics', type: 'float', label: 'Dynamics', default: 0.7, min: 0, max: 1, group: 'Tone', automatable: true },
  { id: 'resonance', type: 'float', label: 'String Resonance', default: 0.5, min: 0, max: 1, group: 'Resonance', automatable: true },
  { id: 'damper', type: 'float', label: 'Damper Noise', default: 0.3, min: 0, max: 1, group: 'Noise' },
  { id: 'pedal-noise', type: 'float', label: 'Pedal Noise', default: 0.2, min: 0, max: 1, group: 'Noise' },
  { id: 'key-noise', type: 'float', label: 'Key Noise', default: 0.15, min: 0, max: 1, group: 'Noise' },
  { id: 'lid-position', type: 'enum', label: 'Lid Position', default: 'open', options: ['closed', 'half', 'open'], group: 'Sound' },
  { id: 'stereo-width', type: 'float', label: 'Stereo Width', default: 0.8, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'volume', type: 'float', label: 'Volume', default: 0.8, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'reverb', type: 'float', label: 'Reverb', default: 0.3, min: 0, max: 1, group: 'Effects', automatable: true },
];

export const PIANO_PRESETS: readonly PresetDefinition[] = [
  { id: 'concert-grand', name: 'Concert Grand', category: 'Grand', tags: ['grand', 'concert', 'classical'], params: { type: 'grand', brightness: 0.6, dynamics: 0.8, resonance: 0.6, 'lid-position': 'open' } },
  { id: 'studio-grand', name: 'Studio Grand', category: 'Grand', tags: ['grand', 'studio', 'pop'], params: { type: 'grand', brightness: 0.5, dynamics: 0.6, resonance: 0.4, 'lid-position': 'half' } },
  { id: 'intimate-grand', name: 'Intimate Grand', category: 'Grand', tags: ['grand', 'intimate', 'soft'], params: { type: 'grand', brightness: 0.4, dynamics: 0.5, resonance: 0.5, reverb: 0.4 } },
  { id: 'bright-upright', name: 'Bright Upright', category: 'Upright', tags: ['upright', 'bright', 'pop'], params: { type: 'upright', brightness: 0.7, dynamics: 0.6 } },
  { id: 'mellow-upright', name: 'Mellow Upright', category: 'Upright', tags: ['upright', 'mellow', 'jazz'], params: { type: 'upright', brightness: 0.3, dynamics: 0.5 } },
  { id: 'rhodes', name: 'Rhodes Classic', category: 'Electric', tags: ['rhodes', 'electric', 'soul'], params: { type: 'electric', brightness: 0.5, dynamics: 0.6 } },
  { id: 'wurlitzer', name: 'Wurlitzer', category: 'Electric', tags: ['wurli', 'electric', 'vintage'], params: { type: 'electric', brightness: 0.6, dynamics: 0.7 } },
  { id: 'toy-piano', name: 'Toy Piano', category: 'Special', tags: ['toy', 'cute', 'bright'], params: { type: 'toy', brightness: 0.9, dynamics: 0.3 } },
  { id: 'prepared', name: 'Prepared Piano', category: 'Special', tags: ['prepared', 'experimental', 'textured'], params: { type: 'prepared', brightness: 0.5, resonance: 0.8 } },
  { id: 'honky-tonk', name: 'Honky Tonk', category: 'Special', tags: ['honky-tonk', 'detuned', 'saloon'], params: { type: 'honky-tonk', brightness: 0.6, dynamics: 0.7 } },
];

export const PIANO_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'piano',
    name: 'Piano',
    category: 'generators',
    description: 'Acoustic and electric piano with realistic modeling',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['piano', 'acoustic', 'keys', 'grand', 'upright', 'rhodes'],
  },
  {
    visuals: PIANO_VISUALS,
    behavior: createInstrumentBehavior(200),
    ui: {
      ...createDefaultUIConfig('keyboard'),
      panels: [
        createPanel('main', 'Main', 'main', [
          createDropdownControl('type', 'type', 'Type'),
          createKnobControl('bright', 'brightness', 'Bright'),
          createKnobControl('dyn', 'dynamics', 'Dynamics'),
          createKnobControl('res', 'resonance', 'Resonance'),
          createDropdownControl('lid', 'lid-position', 'Lid'),
          createKnobControl('width', 'stereo-width', 'Width'),
          createKnobControl('vol', 'volume', 'Volume'),
          createKnobControl('rev', 'reverb', 'Reverb'),
        ], { columns: 4, rows: 2 }),
        createPanel('noise', 'Mechanical Noise', 'sidebar', [
          createKnobControl('damper', 'damper', 'Damper'),
          createKnobControl('pedal', 'pedal-noise', 'Pedal'),
          createKnobControl('key', 'key-noise', 'Key'),
        ], { columns: 3 }),
      ],
      minWidth: 400,
      minHeight: 300,
      theme: { ...DEFAULT_DARK_THEME, accent: '#795548' },
    },
    ports: {
      inputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes In' }],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
      ],
    },
    parameters: PIANO_PARAMETERS,
    presets: PIANO_PRESETS,
  }
);

// ============================================================================
// BASS CARD UI
// ============================================================================

export const BASS_VISUALS: CardVisuals = {
  emoji: '🎸',
  emojiSecondary: '🔊',
  color: '#4CAF50',
  colorSecondary: '#388E3C',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#81C784',
  glowIntensity: 0.4,
};

export const BASS_PARAMETERS: readonly ParameterDefinition[] = [
  { id: 'type', type: 'enum', label: 'Bass Type', default: 'fingered', options: ['fingered', 'slap', 'pick', 'fretless', 'upright', 'synth-moog', 'synth-fm'], group: 'Sound' },
  { id: 'tone', type: 'float', label: 'Tone', default: 0.5, min: 0, max: 1, group: 'Tone', automatable: true, modulatable: true },
  { id: 'attack', type: 'float', label: 'Attack', default: 0.5, min: 0, max: 1, group: 'Tone', automatable: true },
  { id: 'sustain', type: 'float', label: 'Sustain', default: 0.7, min: 0, max: 1, group: 'Tone', automatable: true },
  { id: 'slide', type: 'float', label: 'Slide', default: 0, min: 0, max: 1, group: 'Articulation', automatable: true },
  { id: 'hammer', type: 'float', label: 'Hammer-On', default: 0.3, min: 0, max: 1, group: 'Articulation' },
  { id: 'mute', type: 'float', label: 'Muting', default: 0, min: 0, max: 1, group: 'Articulation', automatable: true },
  { id: 'drive', type: 'float', label: 'Drive', default: 0, min: 0, max: 1, group: 'Effects', automatable: true, modulatable: true },
  { id: 'chorus', type: 'float', label: 'Chorus', default: 0, min: 0, max: 1, group: 'Effects', automatable: true },
  { id: 'compression', type: 'float', label: 'Compression', default: 0.3, min: 0, max: 1, group: 'Effects', automatable: true },
  { id: 'volume', type: 'float', label: 'Volume', default: 0.8, min: 0, max: 1, group: 'Master', automatable: true },
];

export const BASS_PRESETS: readonly PresetDefinition[] = [
  { id: 'fingered-warm', name: 'Warm Finger', category: 'Electric', tags: ['fingered', 'warm', 'motown'], params: { type: 'fingered', tone: 0.3, attack: 0.4, sustain: 0.8 } },
  { id: 'fingered-bright', name: 'Bright Finger', category: 'Electric', tags: ['fingered', 'bright', 'funk'], params: { type: 'fingered', tone: 0.7, attack: 0.6, sustain: 0.6 } },
  { id: 'slap-funk', name: 'Slap Funk', category: 'Electric', tags: ['slap', 'funk', 'bright'], params: { type: 'slap', tone: 0.8, attack: 0.9, compression: 0.5 } },
  { id: 'slap-pop', name: 'Slap & Pop', category: 'Electric', tags: ['slap', 'pop', 'tight'], params: { type: 'slap', tone: 0.7, attack: 0.8, compression: 0.6 } },
  { id: 'pick-rock', name: 'Pick Rock', category: 'Electric', tags: ['pick', 'rock', 'aggressive'], params: { type: 'pick', tone: 0.6, attack: 0.8, drive: 0.3 } },
  { id: 'pick-punk', name: 'Pick Punk', category: 'Electric', tags: ['pick', 'punk', 'distorted'], params: { type: 'pick', tone: 0.7, attack: 0.9, drive: 0.5 } },
  { id: 'fretless-smooth', name: 'Fretless Smooth', category: 'Electric', tags: ['fretless', 'smooth', 'jazz'], params: { type: 'fretless', tone: 0.4, slide: 0.5, chorus: 0.2 } },
  { id: 'upright-jazz', name: 'Upright Jazz', category: 'Acoustic', tags: ['upright', 'jazz', 'acoustic'], params: { type: 'upright', tone: 0.4, attack: 0.3, sustain: 0.5 } },
  { id: 'upright-pizz', name: 'Upright Pizz', category: 'Acoustic', tags: ['upright', 'pizzicato', 'orchestral'], params: { type: 'upright', tone: 0.5, attack: 0.5, sustain: 0.3 } },
  { id: 'moog-sub', name: 'Moog Sub', category: 'Synth', tags: ['synth', 'moog', 'sub'], params: { type: 'synth-moog', tone: 0.3, sustain: 0.9, drive: 0.2 } },
  { id: 'moog-growl', name: 'Moog Growl', category: 'Synth', tags: ['synth', 'moog', 'growl'], params: { type: 'synth-moog', tone: 0.6, drive: 0.5 } },
  { id: 'fm-bass', name: 'FM Bass', category: 'Synth', tags: ['synth', 'fm', 'digital'], params: { type: 'synth-fm', tone: 0.5, attack: 0.7 } },
];

export const BASS_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'bass',
    name: 'Bass',
    category: 'generators',
    description: 'Electric and synth bass with multiple playing styles',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['bass', 'electric', 'synth', 'funk', 'rock', 'jazz'],
  },
  {
    visuals: BASS_VISUALS,
    behavior: createInstrumentBehavior(80),
    ui: {
      ...createDefaultUIConfig('knobs'),
      panels: [
        createPanel('main', 'Main', 'main', [
          createDropdownControl('type', 'type', 'Type', { colSpan: 2 }),
          createKnobControl('tone', 'tone', 'Tone'),
          createKnobControl('attack', 'attack', 'Attack'),
          createKnobControl('sustain', 'sustain', 'Sustain'),
          createKnobControl('vol', 'volume', 'Volume'),
        ], { columns: 4 }),
        createPanel('articulation', 'Articulation', 'main', [
          createKnobControl('slide', 'slide', 'Slide'),
          createKnobControl('hammer', 'hammer', 'Hammer'),
          createKnobControl('mute', 'mute', 'Mute'),
        ], { columns: 3 }),
        createPanel('effects', 'Effects', 'footer', [
          createKnobControl('drive', 'drive', 'Drive'),
          createKnobControl('chorus', 'chorus', 'Chorus'),
          createKnobControl('comp', 'compression', 'Comp'),
        ], { columns: 3, type: 'flex' }),
      ],
      minWidth: 350,
      minHeight: 280,
      theme: { ...DEFAULT_DARK_THEME, accent: '#4CAF50' },
    },
    ports: {
      inputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes In' }],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
      ],
    },
    parameters: BASS_PARAMETERS,
    presets: BASS_PRESETS,
  }
);

// ============================================================================
// STRINGS CARD UI
// ============================================================================

export const STRINGS_VISUALS: CardVisuals = {
  emoji: '🎻',
  emojiSecondary: '🎼',
  color: '#9C27B0',
  colorSecondary: '#7B1FA2',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#BA68C8',
  glowIntensity: 0.35,
};

export const STRINGS_PARAMETERS: readonly ParameterDefinition[] = [
  { id: 'ensemble', type: 'enum', label: 'Ensemble', default: 'full', options: ['solo-violin', 'solo-viola', 'solo-cello', 'solo-bass', 'quartet', 'chamber', 'full'], group: 'Ensemble' },
  { id: 'articulation', type: 'enum', label: 'Articulation', default: 'sustain', options: ['sustain', 'staccato', 'pizzicato', 'tremolo', 'spiccato', 'marcato', 'col-legno'], group: 'Articulation' },
  { id: 'expression', type: 'float', label: 'Expression', default: 0.7, min: 0, max: 1, group: 'Dynamics', automatable: true, modulatable: true },
  { id: 'dynamics', type: 'float', label: 'Dynamics', default: 0.6, min: 0, max: 1, group: 'Dynamics', automatable: true },
  { id: 'vibrato-depth', type: 'float', label: 'Vibrato Depth', default: 0.3, min: 0, max: 1, group: 'Vibrato', automatable: true, modulatable: true },
  { id: 'vibrato-rate', type: 'float', label: 'Vibrato Rate', default: 5, min: 1, max: 10, unit: 'Hz', group: 'Vibrato', automatable: true },
  { id: 'attack', type: 'float', label: 'Attack', default: 0.15, min: 0.01, max: 1, unit: 's', group: 'Envelope' },
  { id: 'release', type: 'float', label: 'Release', default: 0.4, min: 0.01, max: 2, unit: 's', group: 'Envelope' },
  { id: 'stereo-width', type: 'float', label: 'Width', default: 0.8, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'reverb', type: 'float', label: 'Reverb', default: 0.4, min: 0, max: 1, group: 'Effects', automatable: true },
  { id: 'volume', type: 'float', label: 'Volume', default: 0.7, min: 0, max: 1, group: 'Master', automatable: true },
];

export const STRINGS_PRESETS: readonly PresetDefinition[] = [
  { id: 'full-orchestra', name: 'Full Orchestra', category: 'Orchestral', tags: ['full', 'orchestral', 'cinematic'], params: { ensemble: 'full', articulation: 'sustain', expression: 0.7, reverb: 0.5 } },
  { id: 'chamber-strings', name: 'Chamber Strings', category: 'Orchestral', tags: ['chamber', 'intimate', 'classical'], params: { ensemble: 'chamber', expression: 0.6, reverb: 0.4 } },
  { id: 'string-quartet', name: 'String Quartet', category: 'Orchestral', tags: ['quartet', 'classical', 'intimate'], params: { ensemble: 'quartet', expression: 0.5, reverb: 0.3 } },
  { id: 'solo-violin', name: 'Solo Violin', category: 'Solo', tags: ['violin', 'solo', 'expressive'], params: { ensemble: 'solo-violin', 'vibrato-depth': 0.5, expression: 0.8 } },
  { id: 'solo-cello', name: 'Solo Cello', category: 'Solo', tags: ['cello', 'solo', 'warm'], params: { ensemble: 'solo-cello', 'vibrato-depth': 0.4, expression: 0.7 } },
  { id: 'pizzicato', name: 'Pizzicato', category: 'Articulation', tags: ['pizz', 'plucked', 'short'], params: { articulation: 'pizzicato', attack: 0.01, release: 0.2 } },
  { id: 'tremolo-dramatic', name: 'Tremolo Dramatic', category: 'Articulation', tags: ['tremolo', 'dramatic', 'tense'], params: { articulation: 'tremolo', expression: 0.9, dynamics: 0.8 } },
  { id: 'staccato-tight', name: 'Staccato Tight', category: 'Articulation', tags: ['staccato', 'short', 'rhythmic'], params: { articulation: 'staccato', attack: 0.02, release: 0.1 } },
  { id: 'cinematic-epic', name: 'Cinematic Epic', category: 'Cinematic', tags: ['epic', 'film', 'dramatic'], params: { ensemble: 'full', expression: 0.9, dynamics: 0.8, reverb: 0.6 } },
  { id: 'ambient-pad', name: 'Ambient Pad', category: 'Ambient', tags: ['ambient', 'pad', 'textured'], params: { ensemble: 'full', attack: 0.5, release: 1.5, reverb: 0.7, 'vibrato-depth': 0.2 } },
];

export const STRINGS_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'strings',
    name: 'Strings',
    category: 'generators',
    description: 'Orchestral strings ensemble with multiple articulations',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['strings', 'orchestra', 'violin', 'cello', 'viola', 'ensemble'],
  },
  {
    visuals: STRINGS_VISUALS,
    behavior: createInstrumentBehavior(300),
    ui: {
      ...createDefaultUIConfig('knobs'),
      panels: [
        createPanel('main', 'Main', 'main', [
          createDropdownControl('ensemble', 'ensemble', 'Ensemble', { colSpan: 2 }),
          createDropdownControl('artic', 'articulation', 'Articulation', { colSpan: 2 }),
          createKnobControl('expr', 'expression', 'Expression'),
          createKnobControl('dyn', 'dynamics', 'Dynamics'),
          createKnobControl('vol', 'volume', 'Volume'),
          createKnobControl('rev', 'reverb', 'Reverb'),
        ], { columns: 4, rows: 2 }),
        createPanel('vibrato', 'Vibrato', 'sidebar', [
          createKnobControl('vib-depth', 'vibrato-depth', 'Depth'),
          createKnobControl('vib-rate', 'vibrato-rate', 'Rate'),
        ], { columns: 2 }),
        createPanel('envelope', 'Envelope', 'sidebar', [
          createKnobControl('atk', 'attack', 'Attack'),
          createKnobControl('rel', 'release', 'Release'),
        ], { columns: 2 }),
      ],
      minWidth: 400,
      minHeight: 320,
      theme: { ...DEFAULT_DARK_THEME, accent: '#9C27B0' },
    },
    ports: {
      inputs: [
        { name: 'notes', type: 'Event<Note>', label: 'Notes In' },
        { name: 'expression', type: 'control', label: 'Expression', optional: true },
      ],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
      ],
    },
    parameters: STRINGS_PARAMETERS,
    presets: STRINGS_PRESETS,
  }
);

// ============================================================================
// ORGAN CARD UI
// ============================================================================

export const ORGAN_VISUALS: CardVisuals = {
  emoji: '⛪',
  emojiSecondary: '🎵',
  color: '#8D6E63',
  colorSecondary: '#6D4C41',
  gradient: 'linear',
  gradientAngle: 180,
  glow: '#BCAAA4',
  glowIntensity: 0.3,
};

export const ORGAN_PARAMETERS: readonly ParameterDefinition[] = [
  // Drawbars (9 total)
  { id: 'drawbar-16', type: 'int', label: "16'", default: 8, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-513', type: 'int', label: "5⅓'", default: 8, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-8', type: 'int', label: "8'", default: 8, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-4', type: 'int', label: "4'", default: 0, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-223', type: 'int', label: "2⅔'", default: 0, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-2', type: 'int', label: "2'", default: 0, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-135', type: 'int', label: "1⅗'", default: 0, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-113', type: 'int', label: "1⅓'", default: 0, min: 0, max: 8, group: 'Drawbars', automatable: true },
  { id: 'drawbar-1', type: 'int', label: "1'", default: 0, min: 0, max: 8, group: 'Drawbars', automatable: true },
  
  // Leslie
  { id: 'leslie-enabled', type: 'bool', label: 'Leslie', default: true, group: 'Leslie' },
  { id: 'leslie-speed', type: 'enum', label: 'Leslie Speed', default: 'slow', options: ['stop', 'slow', 'fast'], group: 'Leslie', automatable: true },
  { id: 'leslie-drive', type: 'float', label: 'Leslie Drive', default: 0.3, min: 0, max: 1, group: 'Leslie', automatable: true },
  
  // Character
  { id: 'percussion', type: 'bool', label: 'Percussion', default: false, group: 'Character' },
  { id: 'percussion-volume', type: 'enum', label: 'Perc Volume', default: 'normal', options: ['soft', 'normal'], group: 'Character' },
  { id: 'percussion-decay', type: 'enum', label: 'Perc Decay', default: 'fast', options: ['fast', 'slow'], group: 'Character' },
  { id: 'percussion-harmonic', type: 'enum', label: 'Perc Harmonic', default: '3rd', options: ['2nd', '3rd'], group: 'Character' },
  { id: 'vibrato-type', type: 'enum', label: 'Vibrato/Chorus', default: 'C3', options: ['V1', 'V2', 'V3', 'C1', 'C2', 'C3'], group: 'Character' },
  { id: 'key-click', type: 'float', label: 'Key Click', default: 0.3, min: 0, max: 1, group: 'Character' },
  
  { id: 'volume', type: 'float', label: 'Volume', default: 0.7, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'overdrive', type: 'float', label: 'Overdrive', default: 0, min: 0, max: 1, group: 'Master', automatable: true },
];

export const ORGAN_PRESETS: readonly PresetDefinition[] = [
  { id: 'jazz-full', name: 'Jazz Full', category: 'Jazz', tags: ['jazz', 'full', 'jimmy-smith'], params: { 'drawbar-16': 8, 'drawbar-513': 8, 'drawbar-8': 8, 'drawbar-4': 6, 'drawbar-2': 4, 'leslie-speed': 'slow', percussion: true } },
  { id: 'gospel-shout', name: 'Gospel Shout', category: 'Gospel', tags: ['gospel', 'shout', 'powerful'], params: { 'drawbar-16': 8, 'drawbar-513': 8, 'drawbar-8': 8, 'drawbar-4': 8, 'drawbar-223': 6, 'drawbar-2': 8, 'leslie-speed': 'fast', overdrive: 0.4 } },
  { id: 'rock-distorted', name: 'Rock Distorted', category: 'Rock', tags: ['rock', 'distorted', 'deep-purple'], params: { 'drawbar-16': 8, 'drawbar-8': 8, 'drawbar-4': 8, 'drawbar-2': 8, 'leslie-speed': 'fast', overdrive: 0.6 } },
  { id: 'ballad-soft', name: 'Ballad Soft', category: 'Ballad', tags: ['ballad', 'soft', 'mellow'], params: { 'drawbar-16': 6, 'drawbar-8': 8, 'drawbar-4': 4, 'leslie-speed': 'slow', 'vibrato-type': 'C1' } },
  { id: 'blues-gritty', name: 'Blues Gritty', category: 'Blues', tags: ['blues', 'gritty', 'raw'], params: { 'drawbar-16': 8, 'drawbar-513': 6, 'drawbar-8': 8, 'drawbar-4': 4, 'leslie-speed': 'slow', overdrive: 0.3, 'key-click': 0.5 } },
  { id: 'funk-percussive', name: 'Funk Percussive', category: 'Funk', tags: ['funk', 'percussive', 'punchy'], params: { 'drawbar-8': 8, 'drawbar-4': 8, percussion: true, 'percussion-volume': 'normal', 'percussion-decay': 'fast', 'leslie-speed': 'fast' } },
  { id: 'church-full', name: 'Church Full', category: 'Church', tags: ['church', 'pipe', 'classical'], params: { 'drawbar-16': 8, 'drawbar-513': 4, 'drawbar-8': 8, 'drawbar-4': 6, 'drawbar-223': 4, 'drawbar-2': 6, 'drawbar-1': 4, 'leslie-enabled': false } },
  { id: 'reggae-bubble', name: 'Reggae Bubble', category: 'Reggae', tags: ['reggae', 'bubble', 'offbeat'], params: { 'drawbar-16': 4, 'drawbar-8': 8, 'drawbar-4': 4, 'leslie-speed': 'slow', 'vibrato-type': 'C2' } },
];

export const ORGAN_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'organ',
    name: 'Organ',
    category: 'generators',
    description: 'Tonewheel organ with 9 drawbars, Leslie, and percussion',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['organ', 'hammond', 'tonewheel', 'drawbar', 'leslie', 'jazz', 'gospel'],
  },
  {
    visuals: ORGAN_VISUALS,
    behavior: createInstrumentBehavior(10),
    ui: {
      ...createDefaultUIConfig('knobs'),
      panels: [
        createPanel('drawbars', 'Drawbars', 'main', [
          createSliderControl('db-16', 'drawbar-16', "16'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-513', 'drawbar-513', "5⅓'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-8', 'drawbar-8', "8'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-4', 'drawbar-4', "4'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-223', 'drawbar-223', "2⅔'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-2', 'drawbar-2', "2'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-135', 'drawbar-135', "1⅗'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-113', 'drawbar-113', "1⅓'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
          createSliderControl('db-1', 'drawbar-1', "1'", { style: { size: 'lg', variant: 'vertical', labelPosition: 'bottom' } }),
        ], { columns: 9, type: 'flex' }),
        createPanel('leslie', 'Leslie', 'sidebar', [
          createToggleControl('leslie', 'leslie-enabled', 'Leslie'),
          createDropdownControl('leslie-spd', 'leslie-speed', 'Speed'),
          createKnobControl('leslie-drv', 'leslie-drive', 'Drive'),
        ], { columns: 3 }),
        createPanel('percussion', 'Percussion', 'sidebar', [
          createToggleControl('perc', 'percussion', 'On'),
          createDropdownControl('perc-vol', 'percussion-volume', 'Vol'),
          createDropdownControl('perc-dec', 'percussion-decay', 'Decay'),
          createDropdownControl('perc-harm', 'percussion-harmonic', 'Harm'),
        ], { columns: 2 }),
        createPanel('character', 'Character', 'footer', [
          createDropdownControl('vib', 'vibrato-type', 'Vib/Chorus'),
          createKnobControl('click', 'key-click', 'Click'),
          createKnobControl('drive', 'overdrive', 'Drive'),
          createKnobControl('vol', 'volume', 'Volume'),
        ], { columns: 4, type: 'flex' }),
      ],
      minWidth: 500,
      minHeight: 350,
      theme: { ...DEFAULT_DARK_THEME, accent: '#8D6E63' },
    },
    ports: {
      inputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes In' }],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
      ],
    },
    parameters: ORGAN_PARAMETERS,
    presets: ORGAN_PRESETS,
  }
);

// ============================================================================
// SAMPLER CARD UI
// ============================================================================

export const SAMPLER_VISUALS: CardVisuals = {
  emoji: '📦',
  emojiSecondary: '🎹',
  color: '#00BCD4',
  colorSecondary: '#0097A7',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#4DD0E1',
  glowIntensity: 0.35,
};

export const SAMPLER_PARAMETERS: readonly ParameterDefinition[] = [
  // Zone
  { id: 'zone-root', type: 'int', label: 'Root Key', default: 60, min: 0, max: 127, group: 'Zone' },
  { id: 'zone-low', type: 'int', label: 'Low Key', default: 0, min: 0, max: 127, group: 'Zone' },
  { id: 'zone-high', type: 'int', label: 'High Key', default: 127, min: 0, max: 127, group: 'Zone' },
  { id: 'zone-vel-low', type: 'int', label: 'Low Vel', default: 0, min: 0, max: 127, group: 'Zone' },
  { id: 'zone-vel-high', type: 'int', label: 'High Vel', default: 127, min: 0, max: 127, group: 'Zone' },
  
  // Sample
  { id: 'sample-start', type: 'float', label: 'Start', default: 0, min: 0, max: 1, group: 'Sample', automatable: true },
  { id: 'sample-end', type: 'float', label: 'End', default: 1, min: 0, max: 1, group: 'Sample', automatable: true },
  { id: 'loop-enabled', type: 'bool', label: 'Loop', default: false, group: 'Sample' },
  { id: 'loop-start', type: 'float', label: 'Loop Start', default: 0, min: 0, max: 1, group: 'Sample' },
  { id: 'loop-end', type: 'float', label: 'Loop End', default: 1, min: 0, max: 1, group: 'Sample' },
  { id: 'loop-crossfade', type: 'float', label: 'Loop XFade', default: 0.01, min: 0, max: 0.5, group: 'Sample' },
  
  // Playback
  { id: 'playback-mode', type: 'enum', label: 'Mode', default: 'one-shot', options: ['one-shot', 'loop', 'ping-pong', 'reverse'], group: 'Playback' },
  { id: 'pitch-track', type: 'bool', label: 'Pitch Track', default: true, group: 'Playback' },
  { id: 'transpose', type: 'int', label: 'Transpose', default: 0, min: -48, max: 48, unit: 'st', group: 'Playback' },
  { id: 'fine-tune', type: 'float', label: 'Fine Tune', default: 0, min: -100, max: 100, unit: 'cents', group: 'Playback', automatable: true },
  
  // Envelope
  { id: 'attack', type: 'float', label: 'Attack', default: 0.001, min: 0.001, max: 5, unit: 's', group: 'Envelope' },
  { id: 'decay', type: 'float', label: 'Decay', default: 0.5, min: 0.001, max: 10, unit: 's', group: 'Envelope' },
  { id: 'sustain', type: 'float', label: 'Sustain', default: 1, min: 0, max: 1, group: 'Envelope' },
  { id: 'release', type: 'float', label: 'Release', default: 0.1, min: 0.001, max: 10, unit: 's', group: 'Envelope' },
  
  // Filter
  { id: 'filter-enabled', type: 'bool', label: 'Filter', default: false, group: 'Filter' },
  { id: 'filter-type', type: 'enum', label: 'Type', default: 'lowpass', options: ['lowpass', 'highpass', 'bandpass'], group: 'Filter' },
  { id: 'filter-cutoff', type: 'float', label: 'Cutoff', default: 8000, min: 20, max: 20000, unit: 'Hz', group: 'Filter', automatable: true, modulatable: true },
  { id: 'filter-resonance', type: 'float', label: 'Resonance', default: 0, min: 0, max: 1, group: 'Filter', automatable: true },
  
  { id: 'volume', type: 'float', label: 'Volume', default: 0.8, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'pan', type: 'float', label: 'Pan', default: 0, min: -1, max: 1, group: 'Master', automatable: true },
];

export const SAMPLER_PRESETS: readonly PresetDefinition[] = [
  { id: 'one-shot', name: 'One Shot', category: 'Basic', params: { 'playback-mode': 'one-shot', attack: 0.001, release: 0.1 } },
  { id: 'sustaining', name: 'Sustaining', category: 'Basic', params: { 'playback-mode': 'loop', attack: 0.01, sustain: 1 } },
  { id: 'pad-long', name: 'Pad Long', category: 'Pad', params: { 'playback-mode': 'loop', attack: 0.5, release: 2, 'loop-crossfade': 0.2 } },
  { id: 'pluck', name: 'Pluck', category: 'Pluck', params: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 } },
  { id: 'keys', name: 'Keys', category: 'Keys', params: { attack: 0.001, decay: 1, sustain: 0.5, release: 0.3 } },
  { id: 'strings-sustain', name: 'Strings Sustain', category: 'Orchestral', params: { 'playback-mode': 'loop', attack: 0.2, sustain: 1, 'loop-crossfade': 0.1 } },
];

export const SAMPLER_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'sampler',
    name: 'Sampler',
    category: 'generators',
    description: 'Multi-zone sampler with velocity layers and round-robin',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['sampler', 'samples', 'zones', 'velocity', 'instruments'],
  },
  {
    visuals: SAMPLER_VISUALS,
    behavior: createInstrumentBehavior(500),
    ui: {
      ...createDefaultUIConfig('waveform'),
      panels: [
        createPanel('zone', 'Zone Editor', 'main', [
          { id: 'zone-editor', type: 'graph', style: { size: 'lg', variant: 'zone-map' }, colSpan: 4, rowSpan: 3 },
        ], { columns: 4 }),
        createPanel('sample', 'Sample', 'main', [
          { id: 'waveform', type: 'waveform', style: { size: 'lg', variant: 'default' }, colSpan: 4, rowSpan: 2 },
          createKnobControl('start', 'sample-start', 'Start'),
          createKnobControl('end', 'sample-end', 'End'),
          createToggleControl('loop', 'loop-enabled', 'Loop'),
          createKnobControl('xfade', 'loop-crossfade', 'XFade'),
        ], { columns: 4 }),
        createPanel('envelope', 'Envelope', 'sidebar', [
          createKnobControl('a', 'attack', 'A'),
          createKnobControl('d', 'decay', 'D'),
          createKnobControl('s', 'sustain', 'S'),
          createKnobControl('r', 'release', 'R'),
        ], { columns: 4 }),
        createPanel('filter', 'Filter', 'sidebar', [
          createToggleControl('flt', 'filter-enabled', 'On'),
          createDropdownControl('flt-type', 'filter-type', 'Type'),
          createKnobControl('cut', 'filter-cutoff', 'Cutoff'),
          createKnobControl('res', 'filter-resonance', 'Res'),
        ], { columns: 4 }),
      ],
      minWidth: 500,
      minHeight: 400,
      theme: { ...DEFAULT_DARK_THEME, accent: '#00BCD4' },
    },
    ports: {
      inputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes In' }],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
      ],
    },
    parameters: SAMPLER_PARAMETERS,
    presets: SAMPLER_PRESETS,
  }
);

// ============================================================================
// LOOP PLAYER CARD UI
// ============================================================================

export const LOOP_PLAYER_VISUALS: CardVisuals = {
  emoji: '🔁',
  emojiSecondary: '🎵',
  color: '#FF9800',
  colorSecondary: '#F57C00',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#FFB74D',
  glowIntensity: 0.4,
};

export const LOOP_PLAYER_PARAMETERS: readonly ParameterDefinition[] = [
  // Playback
  { id: 'play-mode', type: 'enum', label: 'Mode', default: 'sync', options: ['sync', 'free', 'slice', 'granular'], group: 'Playback' },
  { id: 'sync-mode', type: 'enum', label: 'Sync', default: 'tempo', options: ['tempo', 'beat', 'bar', 'off'], group: 'Playback' },
  { id: 'pitch-mode', type: 'enum', label: 'Pitch', default: 'repitch', options: ['repitch', 'time-stretch', 'formant'], group: 'Playback' },
  { id: 'original-tempo', type: 'float', label: 'Orig BPM', default: 120, min: 40, max: 300, unit: 'bpm', group: 'Playback' },
  { id: 'original-key', type: 'int', label: 'Orig Key', default: 0, min: -12, max: 12, unit: 'st', group: 'Playback' },
  
  // Pitch/Time
  { id: 'transpose', type: 'int', label: 'Transpose', default: 0, min: -24, max: 24, unit: 'st', group: 'Pitch', automatable: true },
  { id: 'fine-tune', type: 'float', label: 'Fine', default: 0, min: -100, max: 100, unit: 'cents', group: 'Pitch', automatable: true },
  { id: 'stretch', type: 'float', label: 'Stretch', default: 1, min: 0.25, max: 4, group: 'Time', automatable: true },
  { id: 'reverse', type: 'bool', label: 'Reverse', default: false, group: 'Time' },
  
  // Slice
  { id: 'slice-count', type: 'int', label: 'Slices', default: 16, min: 1, max: 128, group: 'Slice' },
  { id: 'slice-mode', type: 'enum', label: 'Slice Mode', default: 'transient', options: ['transient', 'grid', 'manual'], group: 'Slice' },
  { id: 'current-slice', type: 'int', label: 'Slice', default: 0, min: 0, max: 127, group: 'Slice', automatable: true },
  
  // Filter
  { id: 'filter-cutoff', type: 'float', label: 'Filter', default: 20000, min: 20, max: 20000, unit: 'Hz', group: 'Filter', automatable: true, modulatable: true },
  { id: 'filter-resonance', type: 'float', label: 'Resonance', default: 0, min: 0, max: 1, group: 'Filter', automatable: true },
  
  { id: 'volume', type: 'float', label: 'Volume', default: 0.8, min: 0, max: 1, group: 'Master', automatable: true },
  { id: 'pan', type: 'float', label: 'Pan', default: 0, min: -1, max: 1, group: 'Master', automatable: true },
];

export const LOOP_PLAYER_PRESETS: readonly PresetDefinition[] = [
  { id: 'sync-loop', name: 'Sync Loop', category: 'Basic', params: { 'play-mode': 'sync', 'sync-mode': 'tempo', 'pitch-mode': 'time-stretch' } },
  { id: 'free-loop', name: 'Free Loop', category: 'Basic', params: { 'play-mode': 'free', 'sync-mode': 'off', 'pitch-mode': 'repitch' } },
  { id: 'slicer', name: 'Slicer', category: 'Slice', params: { 'play-mode': 'slice', 'slice-count': 16, 'slice-mode': 'transient' } },
  { id: 'granular', name: 'Granular', category: 'Granular', params: { 'play-mode': 'granular', stretch: 2 } },
  { id: 'half-speed', name: 'Half Speed', category: 'Effects', params: { stretch: 2, 'pitch-mode': 'time-stretch' } },
  { id: 'double-speed', name: 'Double Speed', category: 'Effects', params: { stretch: 0.5, 'pitch-mode': 'time-stretch' } },
  { id: 'octave-down', name: 'Octave Down', category: 'Effects', params: { transpose: -12, 'pitch-mode': 'repitch' } },
  { id: 'reversed', name: 'Reversed', category: 'Effects', params: { reverse: true } },
];

export const LOOP_PLAYER_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'loop-player',
    name: 'Loop Player',
    category: 'generators',
    description: 'Audio loop player with tempo sync, slicing, and granular modes',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['loop', 'samples', 'audio', 'slice', 'granular', 'tempo-sync'],
  },
  {
    visuals: LOOP_PLAYER_VISUALS,
    behavior: {
      ...createInstrumentBehavior(100),
      cpuIntensity: 'medium',
    },
    ui: {
      ...createDefaultUIConfig('waveform'),
      panels: [
        createPanel('waveform', 'Waveform', 'main', [
          { id: 'waveform', type: 'waveform', style: { size: 'lg', variant: 'sliced' }, colSpan: 4, rowSpan: 3 },
        ], { columns: 4 }),
        createPanel('playback', 'Playback', 'main', [
          createDropdownControl('mode', 'play-mode', 'Mode'),
          createDropdownControl('sync', 'sync-mode', 'Sync'),
          createDropdownControl('pitch', 'pitch-mode', 'Pitch'),
          createToggleControl('rev', 'reverse', 'Rev'),
        ], { columns: 4 }),
        createPanel('pitch-time', 'Pitch/Time', 'sidebar', [
          createKnobControl('trans', 'transpose', 'Transpose'),
          createKnobControl('fine', 'fine-tune', 'Fine'),
          createKnobControl('stretch', 'stretch', 'Stretch'),
        ], { columns: 3 }),
        createPanel('slice', 'Slicing', 'sidebar', [
          createKnobControl('slices', 'slice-count', 'Slices'),
          createDropdownControl('slice-mode', 'slice-mode', 'Mode'),
          createKnobControl('slice', 'current-slice', 'Slice'),
        ], { columns: 3 }),
      ],
      minWidth: 450,
      minHeight: 350,
      theme: { ...DEFAULT_DARK_THEME, accent: '#FF9800' },
    },
    ports: {
      inputs: [
        { name: 'notes', type: 'Event<Note>', label: 'Notes In' },
        { name: 'audio', type: 'audio', label: 'Audio In', optional: true },
      ],
      outputs: [
        { name: 'audio-l', type: 'audio', label: 'Audio L' },
        { name: 'audio-r', type: 'audio', label: 'Audio R' },
      ],
    },
    parameters: LOOP_PLAYER_PARAMETERS,
    presets: LOOP_PLAYER_PRESETS,
  }
);

// ============================================================================
// ARPEGGIATOR CARD UI
// ============================================================================

export const ARPEGGIATOR_VISUALS: CardVisuals = {
  emoji: '🎼',
  emojiSecondary: '⬆️',
  color: '#E91E63',
  colorSecondary: '#C2185B',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#F06292',
  glowIntensity: 0.4,
};

export const ARPEGGIATOR_PARAMETERS: readonly ParameterDefinition[] = [
  // Pattern
  { id: 'pattern', type: 'enum', label: 'Pattern', default: 'up', options: ['up', 'down', 'up-down', 'down-up', 'random', 'order', 'converge', 'diverge', 'thumb'], group: 'Pattern', automatable: true },
  { id: 'rate', type: 'enum', label: 'Rate', default: '1/16', options: ['1/1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/4T', '1/8T', '1/16T'], group: 'Pattern' },
  { id: 'octaves', type: 'int', label: 'Octaves', default: 1, min: 1, max: 4, group: 'Pattern', automatable: true },
  
  // Timing
  { id: 'gate', type: 'float', label: 'Gate', default: 0.5, min: 0.01, max: 1, group: 'Timing', automatable: true },
  { id: 'swing', type: 'float', label: 'Swing', default: 0, min: 0, max: 1, group: 'Timing', automatable: true },
  { id: 'humanize', type: 'float', label: 'Humanize', default: 0, min: 0, max: 1, group: 'Timing' },
  
  // Velocity
  { id: 'velocity-mode', type: 'enum', label: 'Vel Mode', default: 'original', options: ['original', 'fixed', 'accent', 'random', 'ramp-up', 'ramp-down'], group: 'Velocity' },
  { id: 'velocity', type: 'int', label: 'Velocity', default: 100, min: 1, max: 127, group: 'Velocity', automatable: true },
  { id: 'accent-amount', type: 'int', label: 'Accent', default: 20, min: 0, max: 50, group: 'Velocity' },
  
  // Latch
  { id: 'latch', type: 'bool', label: 'Latch', default: false, group: 'Control' },
  { id: 'hold', type: 'bool', label: 'Hold', default: false, group: 'Control' },
  { id: 'retrigger', type: 'bool', label: 'Retrigger', default: true, group: 'Control' },
];

export const ARPEGGIATOR_PRESETS: readonly PresetDefinition[] = [
  { id: 'basic-up', name: 'Basic Up', category: 'Basic', params: { pattern: 'up', rate: '1/16', octaves: 1 } },
  { id: 'basic-down', name: 'Basic Down', category: 'Basic', params: { pattern: 'down', rate: '1/16', octaves: 1 } },
  { id: 'up-down-2oct', name: 'Up/Down 2 Oct', category: 'Basic', params: { pattern: 'up-down', rate: '1/16', octaves: 2 } },
  { id: 'random-wide', name: 'Random Wide', category: 'Random', params: { pattern: 'random', octaves: 3, gate: 0.3 } },
  { id: 'trance-gate', name: 'Trance Gate', category: 'Electronic', params: { pattern: 'up', rate: '1/16', gate: 0.2, octaves: 2 } },
  { id: 'funky-swing', name: 'Funky Swing', category: 'Groove', params: { pattern: 'up-down', rate: '1/16', swing: 0.3, gate: 0.6 } },
  { id: 'synth-stab', name: 'Synth Stab', category: 'Electronic', params: { pattern: 'converge', rate: '1/8', gate: 0.1 } },
  { id: 'ambient-slow', name: 'Ambient Slow', category: 'Ambient', params: { pattern: 'random', rate: '1/4', gate: 0.8, octaves: 2 } },
];

export const ARPEGGIATOR_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'arpeggiator',
    name: 'Arpeggiator',
    category: 'generators',
    description: 'MIDI arpeggiator with multiple patterns, sync, and latch',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['arpeggiator', 'arp', 'midi', 'pattern', 'sequencer'],
  },
  {
    visuals: ARPEGGIATOR_VISUALS,
    behavior: {
      ...createInstrumentBehavior(0),
      mode: 'event',
      cpuIntensity: 'light',
    },
    ui: {
      ...createDefaultUIConfig('knobs'),
      panels: [
        createPanel('pattern', 'Pattern', 'main', [
          createDropdownControl('pat', 'pattern', 'Pattern', { colSpan: 2 }),
          createDropdownControl('rate', 'rate', 'Rate'),
          createKnobControl('oct', 'octaves', 'Octaves'),
        ], { columns: 4 }),
        createPanel('timing', 'Timing', 'main', [
          createKnobControl('gate', 'gate', 'Gate'),
          createKnobControl('swing', 'swing', 'Swing'),
          createKnobControl('human', 'humanize', 'Humanize'),
        ], { columns: 3 }),
        createPanel('velocity', 'Velocity', 'sidebar', [
          createDropdownControl('vel-mode', 'velocity-mode', 'Mode'),
          createKnobControl('vel', 'velocity', 'Velocity'),
          createKnobControl('acc', 'accent-amount', 'Accent'),
        ], { columns: 3 }),
        createPanel('control', 'Control', 'footer', [
          createToggleControl('latch', 'latch', 'Latch'),
          createToggleControl('hold', 'hold', 'Hold'),
          createToggleControl('retrig', 'retrigger', 'Retrigger'),
        ], { columns: 3, type: 'flex' }),
      ],
      minWidth: 350,
      minHeight: 280,
      theme: { ...DEFAULT_DARK_THEME, accent: '#E91E63' },
    },
    ports: {
      inputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes In' }],
      outputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes Out' }],
    },
    parameters: ARPEGGIATOR_PARAMETERS,
    presets: ARPEGGIATOR_PRESETS,
  }
);

// ============================================================================
// SEQUENCER CARD UI
// ============================================================================

export const SEQUENCER_VISUALS: CardVisuals = {
  emoji: '📊',
  emojiSecondary: '🎵',
  color: '#673AB7',
  colorSecondary: '#512DA8',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#9575CD',
  glowIntensity: 0.4,
};

export const SEQUENCER_PARAMETERS: readonly ParameterDefinition[] = [
  // Global
  { id: 'steps', type: 'int', label: 'Steps', default: 16, min: 1, max: 64, group: 'Global' },
  { id: 'tracks', type: 'int', label: 'Tracks', default: 8, min: 1, max: 16, group: 'Global' },
  { id: 'rate', type: 'enum', label: 'Rate', default: '1/16', options: ['1/4', '1/8', '1/16', '1/32'], group: 'Global' },
  { id: 'swing', type: 'float', label: 'Swing', default: 0, min: 0, max: 1, group: 'Global', automatable: true },
  
  // Step (per-step parameters)
  { id: 'step-pitch', type: 'int', label: 'Pitch', default: 60, min: 0, max: 127, group: 'Step', automatable: true },
  { id: 'step-velocity', type: 'int', label: 'Velocity', default: 100, min: 0, max: 127, group: 'Step', automatable: true },
  { id: 'step-gate', type: 'float', label: 'Gate', default: 0.5, min: 0, max: 1, group: 'Step', automatable: true },
  { id: 'step-probability', type: 'float', label: 'Prob', default: 1, min: 0, max: 1, group: 'Step' },
  { id: 'step-slide', type: 'bool', label: 'Slide', default: false, group: 'Step' },
  { id: 'step-accent', type: 'bool', label: 'Accent', default: false, group: 'Step' },
  { id: 'step-ratchet', type: 'int', label: 'Ratchet', default: 1, min: 1, max: 8, group: 'Step' },
  
  // Euclidean
  { id: 'euclidean-enabled', type: 'bool', label: 'Euclidean', default: false, group: 'Euclidean' },
  { id: 'euclidean-hits', type: 'int', label: 'Hits', default: 4, min: 1, max: 16, group: 'Euclidean' },
  { id: 'euclidean-rotation', type: 'int', label: 'Rotation', default: 0, min: 0, max: 15, group: 'Euclidean', automatable: true },
  
  { id: 'playing', type: 'bool', label: 'Playing', default: false, group: 'Transport' },
];

export const SEQUENCER_PRESETS: readonly PresetDefinition[] = [
  { id: 'basic-16', name: 'Basic 16', category: 'Basic', params: { steps: 16, tracks: 1, rate: '1/16' } },
  { id: 'basic-32', name: 'Basic 32', category: 'Basic', params: { steps: 32, tracks: 1, rate: '1/16' } },
  { id: 'multi-track', name: 'Multi-Track', category: 'Advanced', params: { steps: 16, tracks: 8, rate: '1/16' } },
  { id: 'euclidean-4-16', name: 'Euclidean 4/16', category: 'Euclidean', params: { 'euclidean-enabled': true, 'euclidean-hits': 4, steps: 16 } },
  { id: 'euclidean-5-16', name: 'Euclidean 5/16', category: 'Euclidean', params: { 'euclidean-enabled': true, 'euclidean-hits': 5, steps: 16 } },
  { id: 'euclidean-7-16', name: 'Euclidean 7/16', category: 'Euclidean', params: { 'euclidean-enabled': true, 'euclidean-hits': 7, steps: 16 } },
  { id: 'swing-groove', name: 'Swing Groove', category: 'Groove', params: { steps: 16, swing: 0.3, rate: '1/16' } },
  { id: 'triplet', name: 'Triplet', category: 'Groove', params: { steps: 12, rate: '1/16' } },
];

export const SEQUENCER_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'sequencer',
    name: 'Sequencer',
    category: 'generators',
    description: '8-track x 64-step sequencer with Euclidean rhythms',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['sequencer', 'step', 'pattern', 'euclidean', 'rhythm'],
  },
  {
    visuals: SEQUENCER_VISUALS,
    behavior: {
      ...createInstrumentBehavior(0),
      mode: 'event',
      cpuIntensity: 'light',
      stochastic: true, // Probability
    },
    ui: {
      ...createDefaultUIConfig('grid'),
      panels: [
        createPanel('grid', 'Step Grid', 'main', [
          { id: 'step-grid', type: 'grid', style: { size: 'lg', variant: '16x8' }, colSpan: 4, rowSpan: 4 },
        ], { columns: 4 }),
        createPanel('global', 'Global', 'sidebar', [
          createKnobControl('steps', 'steps', 'Steps'),
          createKnobControl('tracks', 'tracks', 'Tracks'),
          createDropdownControl('rate', 'rate', 'Rate'),
          createKnobControl('swing', 'swing', 'Swing'),
        ], { columns: 2 }),
        createPanel('euclidean', 'Euclidean', 'sidebar', [
          createToggleControl('euc', 'euclidean-enabled', 'On'),
          createKnobControl('hits', 'euclidean-hits', 'Hits'),
          createKnobControl('rot', 'euclidean-rotation', 'Rotate'),
        ], { columns: 3 }),
        createPanel('transport', 'Transport', 'footer', [
          createButtonControl('play', 'Play'),
          createButtonControl('stop', 'Stop'),
          createButtonControl('clear', 'Clear'),
        ], { columns: 3, type: 'flex' }),
      ],
      minWidth: 500,
      minHeight: 400,
      theme: { ...DEFAULT_DARK_THEME, accent: '#673AB7' },
    },
    ports: {
      inputs: [
        { name: 'clock', type: 'Event<Clock>', label: 'Clock', optional: true },
        { name: 'reset', type: 'trigger', label: 'Reset', optional: true },
      ],
      outputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes Out' }],
    },
    parameters: SEQUENCER_PARAMETERS,
    presets: SEQUENCER_PRESETS,
  }
);

// ============================================================================
// CHORD PROGRESSION CARD UI
// ============================================================================

export const CHORD_PROGRESSION_VISUALS: CardVisuals = {
  emoji: '🎶',
  emojiSecondary: '🎹',
  color: '#009688',
  colorSecondary: '#00796B',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#4DB6AC',
  glowIntensity: 0.35,
};

export const CHORD_PROGRESSION_PARAMETERS: readonly ParameterDefinition[] = [
  // Chord
  { id: 'chord-count', type: 'int', label: 'Chords', default: 4, min: 1, max: 16, group: 'Progression' },
  { id: 'bars-per-chord', type: 'int', label: 'Bars/Chord', default: 1, min: 1, max: 8, group: 'Progression' },
  { id: 'current-chord', type: 'int', label: 'Current', default: 0, min: 0, max: 15, group: 'Progression', automatable: true },
  
  // Voicing
  { id: 'voicing', type: 'enum', label: 'Voicing', default: 'close', options: ['close', 'drop2', 'drop3', 'spread', 'shell', 'rootless'], group: 'Voicing' },
  { id: 'voice-leading', type: 'bool', label: 'Voice Leading', default: true, group: 'Voicing' },
  { id: 'inversion', type: 'int', label: 'Inversion', default: 0, min: 0, max: 3, group: 'Voicing', automatable: true },
  
  // Rhythm
  { id: 'rhythm-pattern', type: 'enum', label: 'Rhythm', default: 'sustain', options: ['sustain', 'strum', 'arpeggiate', 'pulse', 'syncopated'], group: 'Rhythm' },
  { id: 'strum-delay', type: 'float', label: 'Strum', default: 0, min: 0, max: 100, unit: 'ms', group: 'Rhythm', automatable: true },
  
  // Dynamics
  { id: 'velocity', type: 'int', label: 'Velocity', default: 80, min: 1, max: 127, group: 'Dynamics', automatable: true },
  { id: 'dynamics-curve', type: 'enum', label: 'Dynamics', default: 'flat', options: ['flat', 'crescendo', 'decrescendo', 'wave'], group: 'Dynamics' },
];

export const CHORD_PROGRESSION_PRESETS: readonly PresetDefinition[] = [
  { id: 'pop-i-v-vi-iv', name: 'Pop I-V-vi-IV', category: 'Pop', params: { 'chord-count': 4, voicing: 'close', 'voice-leading': true } },
  { id: 'jazz-ii-v-i', name: 'Jazz ii-V-I', category: 'Jazz', params: { 'chord-count': 3, voicing: 'drop2', 'voice-leading': true } },
  { id: 'blues-12bar', name: '12-Bar Blues', category: 'Blues', params: { 'chord-count': 12, 'bars-per-chord': 1, voicing: 'shell' } },
  { id: 'ballad-sustained', name: 'Ballad Sustained', category: 'Ballad', params: { 'rhythm-pattern': 'sustain', 'dynamics-curve': 'wave' } },
  { id: 'strummed', name: 'Strummed', category: 'Acoustic', params: { 'rhythm-pattern': 'strum', 'strum-delay': 30 } },
  { id: 'arpeggiated', name: 'Arpeggiated', category: 'Piano', params: { 'rhythm-pattern': 'arpeggiate' } },
];

export const CHORD_PROGRESSION_CARD: CardDefinition = buildCardDefinition(
  {
    id: 'chord-progression',
    name: 'Chord Progression',
    category: 'generators',
    description: 'Smart chord voicing and progression generator',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['chord', 'harmony', 'voicing', 'progression', 'jazz'],
  },
  {
    visuals: CHORD_PROGRESSION_VISUALS,
    behavior: {
      ...createInstrumentBehavior(0),
      mode: 'event',
      cpuIntensity: 'light',
    },
    ui: {
      ...createDefaultUIConfig('notation'),
      panels: [
        createPanel('chords', 'Chord Slots', 'main', [
          { id: 'chord-editor', type: 'graph', style: { size: 'lg', variant: 'chord-grid' }, colSpan: 4, rowSpan: 2 },
        ], { columns: 4 }),
        createPanel('voicing', 'Voicing', 'main', [
          createDropdownControl('voicing', 'voicing', 'Voicing'),
          createToggleControl('vl', 'voice-leading', 'Voice Leading'),
          createKnobControl('inv', 'inversion', 'Inversion'),
        ], { columns: 3 }),
        createPanel('rhythm', 'Rhythm', 'sidebar', [
          createDropdownControl('rhythm', 'rhythm-pattern', 'Pattern'),
          createKnobControl('strum', 'strum-delay', 'Strum'),
        ], { columns: 2 }),
        createPanel('dynamics', 'Dynamics', 'sidebar', [
          createKnobControl('vel', 'velocity', 'Velocity'),
          createDropdownControl('curve', 'dynamics-curve', 'Curve'),
        ], { columns: 2 }),
      ],
      minWidth: 400,
      minHeight: 300,
      theme: { ...DEFAULT_DARK_THEME, accent: '#009688' },
    },
    ports: {
      inputs: [
        { name: 'trigger', type: 'Event<Note>', label: 'Trigger In', description: 'Chord trigger input', optional: true },
      ],
      outputs: [{ name: 'notes', type: 'Event<Note>', label: 'Notes Out' }],
    },
    parameters: CHORD_PROGRESSION_PARAMETERS,
    presets: CHORD_PROGRESSION_PRESETS,
  }
);

// ============================================================================
// EXPORT ALL CARD DEFINITIONS
// ============================================================================

/**
 * All built-in generator card definitions.
 */
export const GENERATOR_CARDS: readonly CardDefinition[] = [
  DRUM_MACHINE_CARD,
  SYNTH_CARD,
  PIANO_CARD,
  BASS_CARD,
  STRINGS_CARD,
  ORGAN_CARD,
  SAMPLER_CARD,
  LOOP_PLAYER_CARD,
  ARPEGGIATOR_CARD,
  SEQUENCER_CARD,
  CHORD_PROGRESSION_CARD,
];

/**
 * Get card definition by ID.
 */
export function getCardDefinition(cardId: string): CardDefinition | undefined {
  return GENERATOR_CARDS.find(c => c.meta.id === cardId);
}

/**
 * Get all card definitions by category.
 */
export function getCardsByCategory(category: string): readonly CardDefinition[] {
  return GENERATOR_CARDS.filter(c => c.meta.category === category);
}

/**
 * Search cards by tag.
 */
export function searchCardsByTag(tag: string): readonly CardDefinition[] {
  return GENERATOR_CARDS.filter(c => c.meta.tags.includes(tag.toLowerCase()));
}
