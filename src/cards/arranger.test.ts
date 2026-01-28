/**
 * @fileoverview Tests for Arranger System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Chord Recognition
  recognizeChord,
  DEFAULT_RECOGNIZER_CONFIG,
  type RecognizedChord,
  
  // Song Parts
  createSongPart,
  SONG_PART_THEMES,
  createPopSongStructure,
  createEDMSongStructure,
  createJazzAABASongStructure,
  type SongPart,
  type SongStructure,
  
  // Arranger State
  createArrangerState,
  processArrangerCommand,
  type ArrangerState,
  type ArrangerCommand,
  
  // Styles
  getArrangerStyle,
  getStylesByCategory,
  searchStyles,
  POP_8BEAT_STYLE,
  JAZZ_SWING_STYLE,
  BOSSA_NOVA_STYLE,
  HOUSE_STYLE,
  ARRANGER_STYLES,
  
  // Voice Allocation
  allocateVoices,
  
  // Scene View
  createSceneViewState,
  processSceneViewCommand,
  generateSceneViewRenderData,
  type SceneViewState,
  type SceneViewCommand,
  
  // Integrated State
  createArrangerSceneState,
  processArrangerSceneCommand,
  getCurrentPartInfo,
  renderMiniSceneView,
  renderAsciiTimeline,
  type ArrangerSceneState,
  type ArrangerSceneCommand,
  
  // Parameters
  createArrangerParameters,
  
  // Voice Leading Engine
  type VoiceLeadingConfig,
  DEFAULT_VOICE_LEADING_CONFIG,
  type FourPartVoicing,
  getChordTones,
  applyVoiceLeading,
  
  // Fill & Ending Generators
  type FillStyle,
  type FillConfig,
  generateFill,
  type EndingStyle,
  type EndingConfig,
  generateEnding,
  
  // Texture Generator
  type TextureType,
  type TextureConfig,
  DEFAULT_TEXTURE_CONFIG,
  applyTexture,
  
  // Drum Pattern Library Integration
  convertAudioDrumPattern,
  LIBRARY_DRUM_PATTERNS,
  getLibraryDrumPattern,
  getLibraryDrumPatternsByCategory,
  getLibraryDrumPatternsByTag,
  createVariationWithLibraryPattern,
  
  // Arranger Card
  ARRANGER_CARD,
  ARRANGER_CARD_VISUALS,
  ARRANGER_CARD_BEHAVIOR,
  ARRANGER_UI_CONFIG,
  ARRANGER_PARAMETERS,
  ARRANGER_PRESETS,
  
  // EZ Keys Features
  type SongPartPreset,
  type SongPartConfig,
  SONG_PART_CONFIGS,
  type EnergyLevelConfig,
  ENERGY_LEVELS,
  type VoicingStyleType,
  type VoicingStyleConfig,
  VOICING_STYLES,
  type BassLineStyle,
  type BassLineStyleConfig,
  BASS_LINE_STYLES,
  
  // Real-Time Controls
  type ArrangerControlType,
  type ArrangerControl,
  ARRANGER_CONTROLS,
  type ArrangerControlState,
  createArrangerControlState,
  type ArrangerControlCommand,
  processArrangerControlCommand,
  calculateTapTempo,
  
  // Instrument Switcher
  type InstrumentCategory,
  type InstrumentOption,
  INSTRUMENT_OPTIONS,
  getInstrumentOptions,
  searchInstruments,
  
  // Chord Substitution & Reharmonization
  type SubstitutionType,
  type ChordSubstitutionConfig,
  substituteChord,
  
  // Passing Chords
  type PassingChordConfig,
  generatePassingChords,
  
  // Pedal Tones
  type PedalToneConfig,
  applyPedalTone,
  
  // Anticipation
  type AnticipationConfig,
  applyAnticipation,
  
  // Harmonic Tension
  type HarmonicTensionConfig,
  calculateChordTension,
  adjustChordTension,
  
  // Chord Complexity
  adjustChordComplexity,
  
  // Tension Resolver
  resolveTensionChord,
  
  // Melody Harmonizer
  type HarmonyType,
  type MelodyHarmonizerConfig,
  harmonizeMelody,
} from './arranger';

// ============================================================================
// Chord Recognition Tests
// ============================================================================

describe('Chord Recognition', () => {
  describe('recognizeChord', () => {
    it('should recognize C major triad', () => {
      const chord = recognizeChord([60, 64, 67]); // C E G
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe(0); // C
      expect(chord!.quality).toBe('major');
      expect(chord!.symbol).toBe('C');
    });
    
    it('should recognize A minor triad', () => {
      const chord = recognizeChord([57, 60, 64]); // A C E
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe(9); // A
      expect(chord!.quality).toBe('minor');
      expect(chord!.symbol).toBe('Am');
    });
    
    it('should recognize G7 chord', () => {
      const chord = recognizeChord([55, 59, 62, 65]); // G B D F
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe(7); // G
      expect(chord!.quality).toBe('dom7');
      expect(chord!.symbol).toBe('G7');
    });
    
    it('should recognize Cmaj7 chord', () => {
      const chord = recognizeChord([60, 64, 67, 71]); // C E G B
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe(0);
      expect(chord!.quality).toBe('maj7');
      expect(chord!.symbol).toBe('Cmaj7');
    });
    
    it('should recognize Dm7 chord', () => {
      const chord = recognizeChord([62, 65, 69, 72]); // D F A C
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe(2); // D
      expect(chord!.quality).toBe('min7');
      expect(chord!.symbol).toBe('Dm7');
    });
    
    it('should detect slash chord with bass note', () => {
      const chord = recognizeChord([52, 60, 64, 67]); // E/C (C major with E bass)
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe(0); // C
      expect(chord!.bass).toBe(4); // E
      expect(chord!.symbol).toBe('C/E');
    });
    
    it('should handle suspended chords', () => {
      const chord = recognizeChord([60, 65, 67]); // C F G (sus4)
      expect(chord).not.toBeNull();
      expect(chord!.quality).toBe('sus4');
    });
    
    it('should return null for single notes', () => {
      const chord = recognizeChord([60]);
      expect(chord).toBeNull();
    });
    
    it('should return null for empty input', () => {
      const chord = recognizeChord([]);
      expect(chord).toBeNull();
    });
    
    it('should recognize power chord', () => {
      const chord = recognizeChord([60, 67], { ...DEFAULT_RECOGNIZER_CONFIG, minNotes: 2 });
      expect(chord).not.toBeNull();
      expect(chord!.quality).toBe('power');
      expect(chord!.symbol).toBe('C5');
    });
  });
});

// ============================================================================
// Song Part Tests
// ============================================================================

describe('Song Parts', () => {
  describe('createSongPart', () => {
    it('should create a verse part with defaults', () => {
      const part = createSongPart('verse', 1);
      expect(part.type).toBe('verse');
      expect(part.number).toBe(1);
      expect(part.name).toBe('Verse 1');
      expect(part.lengthBars).toBe(8);
      expect(part.variationIndex).toBe(0); // A variation
      expect(part.energy).toBe(2);
    });
    
    it('should create a chorus part with higher energy', () => {
      const part = createSongPart('chorus', 1);
      expect(part.type).toBe('chorus');
      expect(part.variationIndex).toBe(2); // C variation
      expect(part.energy).toBe(4);
    });
    
    it('should create a drop part with maximum energy', () => {
      const part = createSongPart('drop', 1);
      expect(part.type).toBe('drop');
      expect(part.variationIndex).toBe(3); // D variation
      expect(part.energy).toBe(5);
    });
    
    it('should allow custom options', () => {
      const part = createSongPart('verse', 2, {
        name: 'Custom Verse',
        lengthBars: 16,
        energy: 4,
      });
      expect(part.name).toBe('Custom Verse');
      expect(part.lengthBars).toBe(16);
      expect(part.energy).toBe(4);
    });
  });
  
  describe('SONG_PART_THEMES', () => {
    it('should have themes for all part types', () => {
      const partTypes = ['intro', 'verse', 'chorus', 'bridge', 'outro', 'drop', 'breakdown'];
      for (const type of partTypes) {
        expect(SONG_PART_THEMES[type as keyof typeof SONG_PART_THEMES]).toBeDefined();
        expect(SONG_PART_THEMES[type as keyof typeof SONG_PART_THEMES].icon).toBeTruthy();
        expect(SONG_PART_THEMES[type as keyof typeof SONG_PART_THEMES].color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });
  
  describe('createPopSongStructure', () => {
    it('should create a typical pop song structure', () => {
      const structure = createPopSongStructure('pop-8beat');
      expect(structure.parts.length).toBeGreaterThan(0);
      expect(structure.totalBars).toBeGreaterThan(0);
      
      // Should have intro, verses, choruses, bridge, outro
      const types = structure.parts.map(p => p.type);
      expect(types).toContain('intro');
      expect(types).toContain('verse');
      expect(types).toContain('chorus');
      expect(types).toContain('bridge');
      expect(types).toContain('outro');
    });
  });
  
  describe('createEDMSongStructure', () => {
    it('should create an EDM song structure with drops', () => {
      const structure = createEDMSongStructure('house');
      const types = structure.parts.map(p => p.type);
      expect(types).toContain('drop');
      expect(types).toContain('breakdown');
      expect(structure.tempo).toBe(128);
    });
  });
  
  describe('createJazzAABASongStructure', () => {
    it('should create a jazz AABA structure', () => {
      const structure = createJazzAABASongStructure('jazz-swing-medium');
      expect(structure.key).toBe('Bb');
      expect(structure.tempo).toBe(140);
      // Should have solo section
      const types = structure.parts.map(p => p.type);
      expect(types).toContain('solo');
    });
  });
});

// ============================================================================
// Arranger State Tests
// ============================================================================

describe('Arranger State', () => {
  describe('createArrangerState', () => {
    it('should create initial state', () => {
      const state = createArrangerState();
      expect(state.isPlaying).toBe(false);
      expect(state.tempo).toBe(120);
      expect(state.variationIndex).toBe(0);
      expect(state.currentChord).toBeNull();
      expect(state.syncStart).toBe(true);
      expect(state.energyLevel).toBe(3);
    });
  });
  
  describe('processArrangerCommand', () => {
    let state: ArrangerState;
    
    beforeEach(() => {
      state = createArrangerState();
    });
    
    it('should load a style', () => {
      const newState = processArrangerCommand(state, { type: 'loadStyle', styleId: 'pop-8beat' });
      expect(newState.styleId).toBe('pop-8beat');
      expect(newState.tempo).toBe(120);
    });
    
    it('should start playback', () => {
      const newState = processArrangerCommand(state, { type: 'play' });
      expect(newState.isPlaying).toBe(true);
    });
    
    it('should stop playback', () => {
      let newState = processArrangerCommand(state, { type: 'play' });
      newState = processArrangerCommand(newState, { type: 'stop' });
      expect(newState.isPlaying).toBe(false);
      expect(newState.positionTicks).toBe(0);
    });
    
    it('should set variation', () => {
      const newState = processArrangerCommand(state, { type: 'setVariation', index: 2 });
      expect(newState.variationIndex).toBe(2);
    });
    
    it('should recognize and set chord', () => {
      const newState = processArrangerCommand(state, { type: 'setChord', notes: [60, 64, 67] });
      expect(newState.currentChord).not.toBeNull();
      expect(newState.currentChord!.symbol).toBe('C');
      // With syncStart enabled, should start playing
      expect(newState.isPlaying).toBe(true);
    });
    
    it('should handle chord release with syncStop', () => {
      let newState = processArrangerCommand(state, { type: 'setSyncStop', enabled: true });
      newState = processArrangerCommand(newState, { type: 'setChord', notes: [60, 64, 67] });
      expect(newState.isPlaying).toBe(true);
      
      newState = processArrangerCommand(newState, { type: 'releaseChord' });
      expect(newState.isPlaying).toBe(false);
      expect(newState.currentChord).toBeNull();
    });
    
    it('should hold chord with chord memory', () => {
      let newState = processArrangerCommand(state, { type: 'setChordMemory', enabled: true });
      newState = processArrangerCommand(newState, { type: 'setChord', notes: [60, 64, 67] });
      newState = processArrangerCommand(newState, { type: 'releaseChord' });
      // Chord should still be held
      expect(newState.currentChord).not.toBeNull();
    });
    
    it('should set tempo within bounds', () => {
      let newState = processArrangerCommand(state, { type: 'setTempo', tempo: 180 });
      expect(newState.tempo).toBe(180);
      
      newState = processArrangerCommand(state, { type: 'setTempo', tempo: 300 });
      expect(newState.tempo).toBe(240); // Clamped to max
      
      newState = processArrangerCommand(state, { type: 'setTempo', tempo: 20 });
      expect(newState.tempo).toBe(40); // Clamped to min
    });
    
    it('should mute/solo voices', () => {
      let newState = processArrangerCommand(state, { type: 'muteVoice', voiceId: 'bass', muted: true });
      expect(newState.voiceMutes.get('bass')).toBe(true);
      
      newState = processArrangerCommand(newState, { type: 'soloVoice', voiceId: 'drums', soloed: true });
      expect(newState.voiceSolos.get('drums')).toBe(true);
    });
    
    it('should queue fill', () => {
      const newState = processArrangerCommand(state, { type: 'triggerFill' });
      expect(newState.fillQueued).toBe(true);
    });
    
    it('should set energy level', () => {
      const newState = processArrangerCommand(state, { type: 'setEnergy', level: 5 });
      expect(newState.energyLevel).toBe(5);
    });
  });
});

// ============================================================================
// Style Tests
// ============================================================================

describe('Arranger Styles', () => {
  describe('ARRANGER_STYLES', () => {
    it('should contain built-in styles', () => {
      expect(ARRANGER_STYLES.length).toBeGreaterThan(0);
      expect(ARRANGER_STYLES).toContain(POP_8BEAT_STYLE);
      expect(ARRANGER_STYLES).toContain(JAZZ_SWING_STYLE);
      expect(ARRANGER_STYLES).toContain(BOSSA_NOVA_STYLE);
      expect(ARRANGER_STYLES).toContain(HOUSE_STYLE);
    });
    
    it('should have at least 35 styles', () => {
      expect(ARRANGER_STYLES.length).toBeGreaterThanOrEqual(35);
    });
    
    it('should have unique style IDs', () => {
      const ids = ARRANGER_STYLES.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
    
    it('should have all major categories', () => {
      const categories = new Set(ARRANGER_STYLES.map(s => s.category.toLowerCase()));
      expect(categories.has('pop')).toBe(true);
      expect(categories.has('rock')).toBe(true);
      expect(categories.has('blues')).toBe(true);
      expect(categories.has('jazz')).toBe(true);
      expect(categories.has('latin')).toBe(true);
      expect(categories.has('electronic')).toBe(true);
      expect(categories.has('r&b')).toBe(true);
      expect(categories.has('folk')).toBe(true);
      expect(categories.has('world')).toBe(true);
    });
  });
  
  describe('getArrangerStyle', () => {
    it('should find style by ID', () => {
      const style = getArrangerStyle('pop-8beat');
      expect(style).toBe(POP_8BEAT_STYLE);
    });
    
    it('should return undefined for unknown style', () => {
      const style = getArrangerStyle('nonexistent');
      expect(style).toBeUndefined();
    });
  });
  
  describe('getStylesByCategory', () => {
    it('should find styles by category', () => {
      const jazzStyles = getStylesByCategory('jazz');
      expect(jazzStyles).toContain(JAZZ_SWING_STYLE);
    });
  });
  
  describe('searchStyles', () => {
    it('should search by name', () => {
      const results = searchStyles('swing');
      expect(results).toContain(JAZZ_SWING_STYLE);
    });
    
    it('should search by tags', () => {
      const results = searchStyles('bebop');
      expect(results).toContain(JAZZ_SWING_STYLE);
    });
  });
  
  describe('Style structure', () => {
    it('POP_8BEAT_STYLE should have required properties', () => {
      const style = POP_8BEAT_STYLE;
      expect(style.id).toBe('pop-8beat');
      expect(style.voices.length).toBeGreaterThan(0);
      expect(style.variations.length).toBeGreaterThan(0);
      expect(style.tempoRange.min).toBeLessThan(style.tempoRange.max);
    });
    
    it('JAZZ_SWING_STYLE should have swing patterns', () => {
      const style = JAZZ_SWING_STYLE;
      const variation = style.variations[0];
      expect(variation.patterns.some(p => p.swing > 0)).toBe(true);
    });
    
    it('HOUSE_STYLE should have 4-on-the-floor kick pattern', () => {
      const style = HOUSE_STYLE;
      const drums = style.variations[0].drumPattern;
      const kicks = drums.steps.filter(s => s.sound === 'kick');
      expect(kicks.length).toBe(4); // Kick on every beat
    });
  });
});

// ============================================================================
// Voice Allocation Tests
// ============================================================================

describe('Voice Allocation', () => {
  describe('allocateVoices', () => {
    it('should allocate voices for C major', () => {
      const chord: RecognizedChord = {
        root: 0,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 64, 67],
        symbol: 'C',
      };
      
      const voicing = allocateVoices(chord, [], 3, 'close');
      expect(voicing.length).toBe(3);
    });
    
    it('should maintain voice leading continuity', () => {
      const cMajor: RecognizedChord = {
        root: 0,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 64, 67],
        symbol: 'C',
      };
      
      const voicing1 = allocateVoices(cMajor, [], 3, 'close');
      
      const gMajor: RecognizedChord = {
        root: 7,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [55, 59, 62],
        symbol: 'G',
      };
      
      const voicing2 = allocateVoices(gMajor, voicing1, 3, 'close');
      
      // Voice movement should be minimized
      let totalMovement = 0;
      for (let i = 0; i < voicing1.length; i++) {
        totalMovement += Math.abs(voicing2[i] - voicing1[i]);
      }
      // Should be reasonable voice leading (not jumping octaves)
      expect(totalMovement).toBeLessThan(20);
    });
    
    it('should create open voicing', () => {
      const chord: RecognizedChord = {
        root: 0,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 64, 67],
        symbol: 'C',
      };
      
      const close = allocateVoices(chord, [], 3, 'close');
      const open = allocateVoices(chord, [], 3, 'open');
      
      // Open voicing should have wider spread
      const closeSpread = Math.max(...close) - Math.min(...close);
      const openSpread = Math.max(...open) - Math.min(...open);
      expect(openSpread).toBeGreaterThanOrEqual(closeSpread);
    });
  });
});

// ============================================================================
// Scene View Tests
// ============================================================================

describe('Scene View', () => {
  describe('createSceneViewState', () => {
    it('should create initial scene view state', () => {
      const state = createSceneViewState();
      expect(state.currentPartIndex).toBe(0);
      expect(state.positionInPart).toBe(0);
      expect(state.zoom).toBe(1);
      expect(state.loopMode).toBe(false);
    });
  });
  
  describe('processSceneViewCommand', () => {
    let viewState: SceneViewState;
    let structure: SongStructure;
    
    beforeEach(() => {
      viewState = createSceneViewState();
      structure = createPopSongStructure('pop-8beat');
    });
    
    it('should select a part', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'selectPart', index: 2 });
      expect(result.viewState.selectedParts).toContain(2);
    });
    
    it('should add to selection with addToSelection', () => {
      let result = processSceneViewCommand(viewState, structure, { type: 'selectPart', index: 1 });
      result = processSceneViewCommand(result.viewState, result.structure, { type: 'selectPart', index: 3, addToSelection: true });
      expect(result.viewState.selectedParts).toContain(1);
      expect(result.viewState.selectedParts).toContain(3);
    });
    
    it('should queue a part', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'queuePart', index: 2 });
      expect(result.viewState.queuedPartIndex).toBe(2);
    });
    
    it('should jump to a part', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'jumpToPart', index: 3 });
      expect(result.viewState.currentPartIndex).toBe(3);
      expect(result.viewState.positionInPart).toBe(0);
      expect(result.viewState.queuedPartIndex).toBeNull();
    });
    
    it('should set loop range', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'setLoopRange', start: 2, end: 4 });
      expect(result.viewState.loopRange).toEqual([2, 4]);
      expect(result.viewState.loopMode).toBe(true);
    });
    
    it('should toggle loop mode', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'toggleLoopMode' });
      expect(result.viewState.loopMode).toBe(true);
    });
    
    it('should add a part', () => {
      const originalLength = structure.parts.length;
      const result = processSceneViewCommand(viewState, structure, { type: 'addPart', partType: 'solo', afterIndex: 2 });
      expect(result.structure.parts.length).toBe(originalLength + 1);
      expect(result.structure.parts[3].type).toBe('solo');
    });
    
    it('should remove a part', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'removePart', index: 1 });
      expect(result.structure.parts.length).toBe(structure.parts.length - 1);
    });
    
    it('should not remove last part', () => {
      // Create a single-part structure
      const singlePart: SongStructure = { ...structure, parts: [structure.parts[0]], totalBars: 4 };
      const result = processSceneViewCommand(viewState, singlePart, { type: 'removePart', index: 0 });
      expect(result.structure.parts.length).toBe(1);
    });
    
    it('should duplicate a part', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'duplicatePart', index: 1 });
      expect(result.structure.parts.length).toBe(structure.parts.length + 1);
      expect(result.structure.parts[2].type).toBe(structure.parts[1].type);
    });
    
    it('should update a part', () => {
      const result = processSceneViewCommand(viewState, structure, {
        type: 'updatePart',
        index: 0,
        updates: { lengthBars: 8, name: 'Extended Intro' },
      });
      expect(result.structure.parts[0].lengthBars).toBe(8);
      expect(result.structure.parts[0].name).toBe('Extended Intro');
    });
    
    it('should set zoom', () => {
      const result = processSceneViewCommand(viewState, structure, { type: 'setZoom', zoom: 2 });
      expect(result.viewState.zoom).toBe(2);
    });
    
    it('should clamp zoom to bounds', () => {
      let result = processSceneViewCommand(viewState, structure, { type: 'setZoom', zoom: 10 });
      expect(result.viewState.zoom).toBe(4);
      
      result = processSceneViewCommand(viewState, structure, { type: 'setZoom', zoom: 0.1 });
      expect(result.viewState.zoom).toBe(0.25);
    });
  });
  
  describe('generateSceneViewRenderData', () => {
    it('should generate render data for parts', () => {
      const structure = createPopSongStructure('pop-8beat');
      const viewState = createSceneViewState();
      
      const renderData = generateSceneViewRenderData(structure, viewState);
      
      expect(renderData.length).toBe(structure.parts.length);
      expect(renderData[0].isCurrent).toBe(true);
      expect(renderData[0].startBar).toBe(0);
    });
    
    it('should calculate correct bar positions', () => {
      const structure = createPopSongStructure('pop-8beat');
      const viewState = createSceneViewState();
      
      const renderData = generateSceneViewRenderData(structure, viewState);
      
      let expectedStart = 0;
      for (const data of renderData) {
        expect(data.startBar).toBe(expectedStart);
        expectedStart = data.endBar;
      }
    });
  });
});

// ============================================================================
// Integrated State Tests
// ============================================================================

describe('Integrated Arranger + Scene State', () => {
  describe('createArrangerSceneState', () => {
    it('should create integrated state with pop template', () => {
      const state = createArrangerSceneState('pop-8beat', 'pop');
      expect(state.arranger.styleId).toBe('pop-8beat');
      expect(state.songStructure.parts.length).toBeGreaterThan(0);
    });
    
    it('should create integrated state with EDM template', () => {
      const state = createArrangerSceneState('house', 'edm');
      // Tempo comes from house style (124) not EDM template default
      expect(state.arranger.tempo).toBe(124);
      expect(state.songStructure.parts.some(p => p.type === 'drop')).toBe(true);
    });
    
    it('should create integrated state with jazz template', () => {
      const state = createArrangerSceneState('jazz-swing-medium', 'jazz');
      expect(state.arranger.tempo).toBe(140);
    });
  });
  
  describe('processArrangerSceneCommand', () => {
    let state: ArrangerSceneState;
    
    beforeEach(() => {
      state = createArrangerSceneState('pop-8beat', 'pop');
    });
    
    it('should process arranger commands', () => {
      const newState = processArrangerSceneCommand(state, {
        type: 'arranger',
        command: { type: 'play' },
      });
      expect(newState.arranger.isPlaying).toBe(true);
    });
    
    it('should process scene view commands', () => {
      const newState = processArrangerSceneCommand(state, {
        type: 'sceneView',
        command: { type: 'selectPart', index: 2 },
      });
      expect(newState.sceneView.selectedParts).toContain(2);
    });
    
    it('should sync arranger when jumping to part', () => {
      // Jump to chorus (should have higher energy)
      const chorusIndex = state.songStructure.parts.findIndex(p => p.type === 'chorus');
      const newState = processArrangerSceneCommand(state, {
        type: 'sceneView',
        command: { type: 'jumpToPart', index: chorusIndex },
      });
      
      const chorusPart = state.songStructure.parts[chorusIndex];
      expect(newState.arranger.variationIndex).toBe(chorusPart.variationIndex);
      expect(newState.arranger.energyLevel).toBe(chorusPart.energy);
    });
    
    it('should sync on explicit sync command', () => {
      let newState = processArrangerSceneCommand(state, {
        type: 'sceneView',
        command: { type: 'jumpToPart', index: 3 },
      });
      
      // Manually change arranger state
      newState = processArrangerSceneCommand(newState, {
        type: 'arranger',
        command: { type: 'setEnergy', level: 1 },
      });
      
      // Sync should restore to part settings
      newState = processArrangerSceneCommand(newState, { type: 'sync' });
      const part = newState.songStructure.parts[3];
      expect(newState.arranger.energyLevel).toBe(part.energy);
    });
  });
  
  describe('getCurrentPartInfo', () => {
    it('should return current part info', () => {
      const state = createArrangerSceneState('pop-8beat', 'pop');
      const info = getCurrentPartInfo(state);
      
      expect(info).not.toBeNull();
      expect(info!.part).toBe(state.songStructure.parts[0]);
      expect(info!.progress).toBe(0);
    });
  });
  
  describe('renderMiniSceneView', () => {
    it('should render emoji-based mini view', () => {
      const state = createArrangerSceneState('pop-8beat', 'pop');
      const miniView = renderMiniSceneView(state);
      
      expect(miniView).toContain('['); // Current part marker
      expect(miniView.length).toBeGreaterThan(0);
    });
  });
  
  describe('renderAsciiTimeline', () => {
    it('should render ASCII art timeline', () => {
      const state = createArrangerSceneState('pop-8beat', 'pop');
      const timeline = renderAsciiTimeline(state);
      
      expect(timeline).toContain('┌');
      expect(timeline).toContain('└');
      expect(timeline).toContain('▶'); // Current part marker
    });
  });
});

// ============================================================================
// Parameters Tests
// ============================================================================

describe('Arranger Parameters', () => {
  describe('createArrangerParameters', () => {
    it('should create all arranger parameters', () => {
      const params = createArrangerParameters();
      expect(params.length).toBeGreaterThan(0);
      
      // Check for key parameters
      const paramIds = params.map(p => p.id);
      expect(paramIds).toContain('tempo');
      expect(paramIds).toContain('syncStart');
      expect(paramIds).toContain('energyLevel');
      expect(paramIds).toContain('swing');
      expect(paramIds).toContain('voicingStyle');
    });
    
    it('should have proper parameter groups', () => {
      const params = createArrangerParameters();
      const groups = new Set(params.map(p => p.group).filter(Boolean));
      
      expect(groups.has('transport')).toBe(true);
      expect(groups.has('sync')).toBe(true);
      expect(groups.has('mix')).toBe(true);
      expect(groups.has('feel')).toBe(true);
      expect(groups.has('harmony')).toBe(true);
    });
  });
});

// ============================================================================
// Voice Leading Engine Tests
// ============================================================================

describe('Voice Leading Engine', () => {
  describe('DEFAULT_VOICE_LEADING_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_VOICE_LEADING_CONFIG.maxMovement).toBe(7);
      expect(DEFAULT_VOICE_LEADING_CONFIG.preferCommonTones).toBe(true);
      expect(DEFAULT_VOICE_LEADING_CONFIG.preferContraryMotion).toBe(true);
      expect(DEFAULT_VOICE_LEADING_CONFIG.avoidParallels).toBe(true);
    });
    
    it('should have valid voice ranges', () => {
      const { voiceRanges } = DEFAULT_VOICE_LEADING_CONFIG;
      expect(voiceRanges.soprano.min).toBeLessThan(voiceRanges.soprano.max);
      expect(voiceRanges.alto.min).toBeLessThan(voiceRanges.alto.max);
      expect(voiceRanges.tenor.min).toBeLessThan(voiceRanges.tenor.max);
      expect(voiceRanges.bass.min).toBeLessThan(voiceRanges.bass.max);
    });
  });
  
  describe('getChordTones', () => {
    it('should get chord tones for C major', () => {
      const chord: RecognizedChord = { root: 0, quality: 'major', symbol: 'C', notes: [60, 64, 67] };
      const tones = getChordTones(chord);
      expect(tones).toContain(0); // C
      expect(tones).toContain(4); // E
      expect(tones).toContain(7); // G
    });
    
    it('should get chord tones for A minor', () => {
      const chord: RecognizedChord = { root: 9, quality: 'minor', symbol: 'Am', notes: [57, 60, 64] };
      const tones = getChordTones(chord);
      expect(tones).toContain(9);  // A
      expect(tones).toContain(12); // C (9+3)
      expect(tones).toContain(16); // E (9+7)
    });
    
    it('should get chord tones for dominant 7th', () => {
      const chord: RecognizedChord = { root: 7, quality: 'dom7', symbol: 'G7', notes: [55, 59, 62, 65] };
      const tones = getChordTones(chord);
      expect(tones.length).toBe(4);
    });
  });
  
  describe('applyVoiceLeading', () => {
    it('should create initial voicing when previous is null', () => {
      const chord: RecognizedChord = { root: 0, quality: 'major', symbol: 'C', notes: [60, 64, 67] };
      const voicing = applyVoiceLeading(null, chord);
      
      expect(voicing.soprano).toBeGreaterThanOrEqual(DEFAULT_VOICE_LEADING_CONFIG.voiceRanges.soprano.min);
      expect(voicing.soprano).toBeLessThanOrEqual(DEFAULT_VOICE_LEADING_CONFIG.voiceRanges.soprano.max);
      expect(voicing.bass).toBeGreaterThanOrEqual(DEFAULT_VOICE_LEADING_CONFIG.voiceRanges.bass.min);
      expect(voicing.bass).toBeLessThanOrEqual(DEFAULT_VOICE_LEADING_CONFIG.voiceRanges.bass.max);
    });
    
    it('should minimize voice movement from previous voicing', () => {
      const cMajor: RecognizedChord = { root: 0, quality: 'major', symbol: 'C', notes: [60, 64, 67] };
      const gMajor: RecognizedChord = { root: 7, quality: 'major', symbol: 'G', notes: [55, 59, 62] };
      
      const voicing1 = applyVoiceLeading(null, cMajor);
      const voicing2 = applyVoiceLeading(voicing1, gMajor);
      
      // Voice movement should be limited
      expect(Math.abs(voicing2.soprano - voicing1.soprano)).toBeLessThanOrEqual(12);
      expect(Math.abs(voicing2.alto - voicing1.alto)).toBeLessThanOrEqual(12);
      expect(Math.abs(voicing2.tenor - voicing1.tenor)).toBeLessThanOrEqual(12);
    });
    
    it('should respect custom voice leading config', () => {
      const chord: RecognizedChord = { root: 0, quality: 'major', symbol: 'C', notes: [60, 64, 67] };
      const customConfig: VoiceLeadingConfig = {
        ...DEFAULT_VOICE_LEADING_CONFIG,
        maxMovement: 3,
      };
      
      const voicing = applyVoiceLeading(null, chord, customConfig);
      expect(voicing.bass).toBeDefined();
      expect(voicing.soprano).toBeDefined();
    });
  });
});

// ============================================================================
// Fill & Ending Generator Tests
// ============================================================================

describe('Fill Generator', () => {
  describe('generateFill', () => {
    it('should generate simple fill', () => {
      const config: FillConfig = {
        style: 'simple',
        lengthBeats: 4,
        intensity: 3,
        crashAtEnd: false,
        density: 0.5,
      };
      
      const fill = generateFill(config);
      expect(fill.lengthBeats).toBe(4);
      expect(fill.steps.length).toBeGreaterThan(0);
    });
    
    it('should generate building fill', () => {
      const config: FillConfig = {
        style: 'building',
        lengthBeats: 4,
        intensity: 4,
        crashAtEnd: true,
        density: 0.7,
      };
      
      const fill = generateFill(config);
      expect(fill.steps.length).toBeGreaterThan(0);
      // Should include crash at end
      expect(fill.steps.some(s => s.sound === 'crash')).toBe(true);
    });
    
    it('should generate tom-roll fill', () => {
      const config: FillConfig = {
        style: 'tom-roll',
        lengthBeats: 2,
        intensity: 4,
        crashAtEnd: false,
        density: 1,
      };
      
      const fill = generateFill(config);
      const tomSounds = fill.steps.filter(s => s.sound.startsWith('tom'));
      expect(tomSounds.length).toBeGreaterThan(0);
    });
    
    it('should generate snare-roll fill', () => {
      const config: FillConfig = {
        style: 'snare-roll',
        lengthBeats: 1,
        intensity: 5,
        crashAtEnd: false,
        density: 1,
      };
      
      const fill = generateFill(config);
      const snareHits = fill.steps.filter(s => s.sound === 'snare');
      expect(snareHits.length).toBeGreaterThan(2);
    });
    
    it('should add crash at end when configured', () => {
      const config: FillConfig = {
        style: 'simple',
        lengthBeats: 1,
        intensity: 3,
        crashAtEnd: true,
        density: 0.5,
      };
      
      const fill = generateFill(config);
      const crashHits = fill.steps.filter(s => s.sound === 'crash');
      expect(crashHits.length).toBeGreaterThan(0);
    });
  });
});

describe('Ending Generator', () => {
  describe('generateEnding', () => {
    it('should generate ritardando ending', () => {
      const config: EndingConfig = {
        style: 'ritardando',
        lengthBars: 2,
        finalChord: null,
        includeFill: true,
      };
      
      const ending = generateEnding(config);
      expect(ending.tempoMultiplier).toBeLessThan(1);
      expect(ending.dynamics).toBeLessThanOrEqual(1);
    });
    
    it('should generate fermata ending', () => {
      const config: EndingConfig = {
        style: 'fermata',
        lengthBars: 1,
        finalChord: null,
        includeFill: false,
      };
      
      const ending = generateEnding(config);
      expect(ending.tempoMultiplier).toBeLessThan(0.5);
      expect(ending.drumPattern.steps.some(s => s.sound === 'crash')).toBe(true);
    });
    
    it('should generate cold ending', () => {
      const config: EndingConfig = {
        style: 'cold',
        lengthBars: 1,
        finalChord: null,
        includeFill: false,
      };
      
      const ending = generateEnding(config);
      expect(ending.dynamics).toBe(0);
    });
    
    it('should generate big-finish ending', () => {
      const config: EndingConfig = {
        style: 'big-finish',
        lengthBars: 2,
        finalChord: null,
        includeFill: true,
      };
      
      const ending = generateEnding(config);
      expect(ending.dynamics).toBeGreaterThan(1);
      const crashes = ending.drumPattern.steps.filter(s => s.sound === 'crash');
      expect(crashes.length).toBeGreaterThan(1);
    });
  });
});

// ============================================================================
// Texture Generator Tests
// ============================================================================

describe('Texture Generator', () => {
  describe('DEFAULT_TEXTURE_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_TEXTURE_CONFIG.type).toBe('homophonic');
      expect(DEFAULT_TEXTURE_CONFIG.voiceCount).toBe(4);
      expect(DEFAULT_TEXTURE_CONFIG.density).toBe(0.5);
    });
  });
  
  describe('applyTexture', () => {
    const chord: RecognizedChord = { root: 0, quality: 'major', symbol: 'C', notes: [60, 64, 67] };
    
    it('should apply monophonic texture', () => {
      const config: TextureConfig = { ...DEFAULT_TEXTURE_CONFIG, type: 'monophonic' };
      const events = applyTexture(chord, 0, 480, config);
      
      expect(events.length).toBe(1);
      expect(events[0].voiceType).toBe('lead');
    });
    
    it('should apply homophonic texture', () => {
      const config: TextureConfig = { ...DEFAULT_TEXTURE_CONFIG, type: 'homophonic' };
      const events = applyTexture(chord, 0, 480, config);
      
      expect(events.length).toBeGreaterThan(1);
    });
    
    it('should apply polyphonic texture', () => {
      const config: TextureConfig = { ...DEFAULT_TEXTURE_CONFIG, type: 'polyphonic' };
      const events = applyTexture(chord, 0, 480, config);
      
      expect(events.length).toBe(config.voiceCount);
      // Staggered entries - different start times
      const startTimes = new Set(events.map(e => e.startTick));
      expect(startTimes.size).toBeGreaterThan(1);
    });
    
    it('should apply ostinato texture', () => {
      const config: TextureConfig = { ...DEFAULT_TEXTURE_CONFIG, type: 'ostinato' };
      const events = applyTexture(chord, 0, 480, config);
      
      // Should have repeated pattern + melody
      const ostinatoEvents = events.filter(e => e.voiceId === 'ostinato');
      const melodyEvents = events.filter(e => e.voiceId === 'melody');
      expect(ostinatoEvents.length).toBeGreaterThan(1);
      expect(melodyEvents.length).toBe(1);
    });
    
    it('should apply antiphonal texture', () => {
      const config: TextureConfig = { ...DEFAULT_TEXTURE_CONFIG, type: 'antiphonal' };
      const events = applyTexture(chord, 0, 480, config);
      
      const call = events.find(e => e.voiceId === 'call');
      const response = events.find(e => e.voiceId === 'response');
      expect(call).toBeDefined();
      expect(response).toBeDefined();
      expect(response!.startTick).toBeGreaterThan(call!.startTick);
    });
    
    it('should apply drone texture', () => {
      const config: TextureConfig = { ...DEFAULT_TEXTURE_CONFIG, type: 'drone' };
      const events = applyTexture(chord, 0, 480, config);
      
      const droneEvents = events.filter(e => e.voiceId.startsWith('drone'));
      expect(droneEvents.length).toBe(2); // Root + 5th
    });
    
    it('should apply unison texture', () => {
      const config: TextureConfig = { ...DEFAULT_TEXTURE_CONFIG, type: 'unison', voiceCount: 3 };
      const events = applyTexture(chord, 0, 480, config);
      
      expect(events.length).toBe(3);
      // All voices at same pitch class
      const pitchClasses = events.map(e => e.note % 12);
      expect(new Set(pitchClasses).size).toBe(1);
    });
  });
});

// ============================================================================
// Drum Pattern Library Integration Tests
// ============================================================================

describe('Drum Pattern Library Integration', () => {
  describe('LIBRARY_DRUM_PATTERNS', () => {
    it('should have pre-converted rock patterns', () => {
      expect(LIBRARY_DRUM_PATTERNS['rock-basic']).toBeDefined();
      expect(LIBRARY_DRUM_PATTERNS['rock-basic'].lengthBeats).toBe(4);
      expect(LIBRARY_DRUM_PATTERNS['rock-driving']).toBeDefined();
    });
    
    it('should have pre-converted funk patterns', () => {
      expect(LIBRARY_DRUM_PATTERNS['funk-basic']).toBeDefined();
      expect(LIBRARY_DRUM_PATTERNS['funk-james-brown']).toBeDefined();
    });
    
    it('should have pre-converted jazz patterns', () => {
      expect(LIBRARY_DRUM_PATTERNS['jazz-swing']).toBeDefined();
      expect(LIBRARY_DRUM_PATTERNS['jazz-bossa']).toBeDefined();
    });
    
    it('should have pre-converted electronic patterns', () => {
      expect(LIBRARY_DRUM_PATTERNS['electronic-four-floor']).toBeDefined();
      expect(LIBRARY_DRUM_PATTERNS['electronic-breakbeat']).toBeDefined();
      expect(LIBRARY_DRUM_PATTERNS['electronic-trap']).toBeDefined();
    });
    
    it('should have pre-converted world patterns', () => {
      expect(LIBRARY_DRUM_PATTERNS['world-afrobeat']).toBeDefined();
      expect(LIBRARY_DRUM_PATTERNS['world-reggae']).toBeDefined();
    });
  });
  
  describe('getLibraryDrumPattern', () => {
    it('should get pre-converted pattern by ID', () => {
      const pattern = getLibraryDrumPattern('rock-basic');
      expect(pattern).toBeDefined();
      expect(pattern!.steps.length).toBeGreaterThan(0);
    });
    
    it('should get pattern from audio library on-demand', () => {
      const pattern = getLibraryDrumPattern('rock-halftime');
      expect(pattern).toBeDefined();
      expect(pattern!.lengthBeats).toBe(4);
    });
    
    it('should return undefined for unknown pattern', () => {
      const pattern = getLibraryDrumPattern('nonexistent-pattern');
      expect(pattern).toBeUndefined();
    });
  });
  
  describe('getLibraryDrumPatternsByCategory', () => {
    it('should get all rock patterns', () => {
      const patterns = getLibraryDrumPatternsByCategory('Rock');
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(p => {
        expect(p.lengthBeats).toBeGreaterThan(0);
        expect(p.steps.length).toBeGreaterThan(0);
      });
    });
    
    it('should get all jazz patterns', () => {
      const patterns = getLibraryDrumPatternsByCategory('Jazz');
      expect(patterns.length).toBeGreaterThan(0);
    });
    
    it('should get all electronic patterns', () => {
      const patterns = getLibraryDrumPatternsByCategory('Electronic');
      expect(patterns.length).toBeGreaterThan(0);
    });
  });
  
  describe('getLibraryDrumPatternsByTag', () => {
    it('should find patterns by tag', () => {
      const patterns = getLibraryDrumPatternsByTag('swing');
      expect(patterns.length).toBeGreaterThan(0);
    });
    
    it('should find patterns by partial tag match', () => {
      const patterns = getLibraryDrumPatternsByTag('eight');
      expect(patterns.length).toBeGreaterThan(0);
    });
  });
  
  describe('createVariationWithLibraryPattern', () => {
    it('should create variation with library drum pattern', () => {
      const variation = createVariationWithLibraryPattern(
        'A',
        'Verse',
        2,
        'rock-basic'
      );
      
      expect(variation.id).toBe('A');
      expect(variation.name).toBe('Verse');
      expect(variation.intensity).toBe(2);
      expect(variation.drumPattern.steps.length).toBeGreaterThan(0);
    });
    
    it('should throw for unknown pattern', () => {
      expect(() => createVariationWithLibraryPattern(
        'A',
        'Test',
        1,
        'nonexistent'
      )).toThrow();
    });
  });
});

// ============================================================================
// Arranger Card Definition Tests
// ============================================================================

describe('Arranger Card Definition', () => {
  describe('ARRANGER_CARD_VISUALS', () => {
    it('should have proper visual config', () => {
      expect(ARRANGER_CARD_VISUALS.emoji).toBe('🎼');
      expect(ARRANGER_CARD_VISUALS.color).toBe('#673AB7');
      expect(ARRANGER_CARD_VISUALS.gradient).toBe('radial');
      expect(ARRANGER_CARD_VISUALS.glowIntensity).toBeGreaterThan(0.5);
    });
    
    it('should have animation defined', () => {
      expect(ARRANGER_CARD_VISUALS.animation).toBeDefined();
      expect(ARRANGER_CARD_VISUALS.animation!.name).toBe('arranger-pulse');
      expect(ARRANGER_CARD_VISUALS.animation!.iterationCount).toBe('infinite');
    });
  });
  
  describe('ARRANGER_CARD_BEHAVIOR', () => {
    it('should have proper behavior config', () => {
      expect(ARRANGER_CARD_BEHAVIOR.mode).toBe('event');
      expect(ARRANGER_CARD_BEHAVIOR.cpuIntensity).toBe('medium');
      expect(ARRANGER_CARD_BEHAVIOR.threadSafety).toBe('main-only');
      expect(ARRANGER_CARD_BEHAVIOR.stateful).toBe(true);
      expect(ARRANGER_CARD_BEHAVIOR.hotReloadable).toBe(true);
    });
  });
  
  describe('ARRANGER_UI_CONFIG', () => {
    it('should have panels defined', () => {
      expect(ARRANGER_UI_CONFIG.panels.length).toBeGreaterThan(0);
    });
    
    it('should have size constraints', () => {
      expect(ARRANGER_UI_CONFIG.minWidth).toBeGreaterThan(0);
      expect(ARRANGER_UI_CONFIG.minHeight).toBeGreaterThan(0);
    });
    
    it('should have custom theme', () => {
      expect(ARRANGER_UI_CONFIG.theme).toBeDefined();
      expect(ARRANGER_UI_CONFIG.theme.accent).toBe('#673AB7');
    });
  });
  
  describe('ARRANGER_PARAMETERS', () => {
    it('should have all key parameters', () => {
      const paramIds = ARRANGER_PARAMETERS.map(p => p.id);
      expect(paramIds).toContain('tempo');
      expect(paramIds).toContain('energy');
      expect(paramIds).toContain('complexity');
      expect(paramIds).toContain('variation');
      expect(paramIds).toContain('style');
      expect(paramIds).toContain('voiceLeading');
      expect(paramIds).toContain('textureType');
    });
    
    it('should have voice controls', () => {
      const paramIds = ARRANGER_PARAMETERS.map(p => p.id);
      expect(paramIds).toContain('drumsVolume');
      expect(paramIds).toContain('bassVolume');
      expect(paramIds).toContain('keysVolume');
      expect(paramIds).toContain('padVolume');
    });
    
    it('should have proper groups', () => {
      const groups = new Set(ARRANGER_PARAMETERS.map(p => p.group));
      expect(groups.has('Master')).toBe(true);
      expect(groups.has('Style')).toBe(true);
      expect(groups.has('Voices')).toBe(true);
      expect(groups.has('Voice Leading')).toBe(true);
      expect(groups.has('Texture')).toBe(true);
    });
  });
  
  describe('ARRANGER_PRESETS', () => {
    it('should have presets for different genres', () => {
      const categories = new Set(ARRANGER_PRESETS.map(p => p.category));
      expect(categories.has('Pop')).toBe(true);
      expect(categories.has('Jazz')).toBe(true);
      expect(categories.has('Latin')).toBe(true);
      expect(categories.has('Electronic')).toBe(true);
    });
    
    it('should have at least 10 presets', () => {
      expect(ARRANGER_PRESETS.length).toBeGreaterThanOrEqual(10);
    });
  });
  
  describe('ARRANGER_CARD', () => {
    it('should be a complete card definition', () => {
      expect(ARRANGER_CARD.meta.id).toBe('arranger');
      expect(ARRANGER_CARD.meta.name).toBe('Auto-Arranger');
      expect(ARRANGER_CARD.meta.category).toBe('meta');
    });
    
    it('should have input ports', () => {
      const inputNames = ARRANGER_CARD.ports.inputs.map(p => p.name);
      expect(inputNames).toContain('chord-in');
      expect(inputNames).toContain('trigger');
      expect(inputNames).toContain('clock');
    });
    
    it('should have output ports', () => {
      const outputNames = ARRANGER_CARD.ports.outputs.map(p => p.name);
      expect(outputNames).toContain('drums');
      expect(outputNames).toContain('bass');
      expect(outputNames).toContain('keys');
      expect(outputNames).toContain('pad');
      expect(outputNames).toContain('all');
    });
    
    it('should have Event<Note> port types', () => {
      const drumOut = ARRANGER_CARD.ports.outputs.find(p => p.name === 'drums');
      expect(drumOut?.type).toBe('Event<Note>');
    });
    
    it('should include parameters and presets', () => {
      expect(ARRANGER_CARD.parameters.length).toBeGreaterThan(0);
      expect(ARRANGER_CARD.presets.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// EZ Keys Features Tests
// ============================================================================

describe('EZ Keys-Inspired Features', () => {
  describe('Song Part Configs', () => {
    it('should have all song part presets', () => {
      const parts: SongPartPreset[] = [
        'intro', 'verse', 'pre-chorus', 'chorus', 'post-chorus',
        'bridge', 'breakdown', 'buildup', 'drop', 'outro', 'solo', 'instrumental'
      ];
      
      for (const part of parts) {
        expect(SONG_PART_CONFIGS[part]).toBeDefined();
        expect(SONG_PART_CONFIGS[part].type).toBe(part);
      }
    });
    
    it('should have valid energy levels 1-5', () => {
      for (const config of Object.values(SONG_PART_CONFIGS)) {
        expect(config.energy).toBeGreaterThanOrEqual(1);
        expect(config.energy).toBeLessThanOrEqual(5);
      }
    });
    
    it('should have chorus at higher energy than verse', () => {
      expect(SONG_PART_CONFIGS['chorus'].energy).toBeGreaterThan(
        SONG_PART_CONFIGS['verse'].energy
      );
    });
    
    it('should have drop at maximum energy', () => {
      expect(SONG_PART_CONFIGS['drop'].energy).toBe(5);
    });
    
    it('should have breakdown at minimum energy', () => {
      expect(SONG_PART_CONFIGS['breakdown'].energy).toBe(1);
    });
  });
  
  describe('Energy Levels', () => {
    it('should have 5 energy levels', () => {
      expect(ENERGY_LEVELS.length).toBe(5);
    });
    
    it('should have levels 1-5', () => {
      const levels = ENERGY_LEVELS.map(e => e.level);
      expect(levels).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should have increasing velocity multipliers', () => {
      for (let i = 1; i < ENERGY_LEVELS.length; i++) {
        expect(ENERGY_LEVELS[i].velocityMultiplier).toBeGreaterThan(
          ENERGY_LEVELS[i - 1].velocityMultiplier
        );
      }
    });
    
    it('should have increasing density multipliers', () => {
      for (let i = 1; i < ENERGY_LEVELS.length; i++) {
        expect(ENERGY_LEVELS[i].densityMultiplier).toBeGreaterThanOrEqual(
          ENERGY_LEVELS[i - 1].densityMultiplier
        );
      }
    });
    
    it('should have increasing voice counts', () => {
      for (let i = 1; i < ENERGY_LEVELS.length; i++) {
        expect(ENERGY_LEVELS[i].voiceCount).toBeGreaterThanOrEqual(
          ENERGY_LEVELS[i - 1].voiceCount
        );
      }
    });
  });
  
  describe('Voicing Styles', () => {
    it('should have all voicing style types', () => {
      const styles: VoicingStyleType[] = [
        'close', 'open', 'drop2', 'drop3', 'drop24', 'rootless', 'quartal', 'shell', 'spread'
      ];
      
      for (const style of styles) {
        expect(VOICING_STYLES[style]).toBeDefined();
        expect(VOICING_STYLES[style].type).toBe(style);
      }
    });
    
    it('should have valid spread ranges', () => {
      for (const style of Object.values(VOICING_STYLES)) {
        expect(style.minSpread).toBeGreaterThan(0);
        expect(style.maxSpread).toBeGreaterThan(style.minSpread);
      }
    });
    
    it('should have rootless without bass', () => {
      expect(VOICING_STYLES['rootless'].includeBass).toBe(false);
    });
    
    it('should have drop2 with 7th extension', () => {
      expect(VOICING_STYLES['drop2'].extensions).toContain('7th');
    });
    
    it('should have spread with widest range', () => {
      const maxSpread = Math.max(...Object.values(VOICING_STYLES).map(s => s.maxSpread));
      expect(VOICING_STYLES['spread'].maxSpread).toBe(maxSpread);
    });
  });
  
  describe('Bass Line Styles', () => {
    it('should have all bass line styles', () => {
      const styles: BassLineStyle[] = [
        'root', 'walking', 'pedal', 'counterpoint', 'octave', 'arpeggiated', 'syncopated', 'slap'
      ];
      
      for (const style of styles) {
        expect(BASS_LINE_STYLES[style]).toBeDefined();
        expect(BASS_LINE_STYLES[style].type).toBe(style);
      }
    });
    
    it('should have walking bass for jazz', () => {
      expect(BASS_LINE_STYLES['walking'].genres).toContain('jazz');
    });
    
    it('should have syncopated bass for funk', () => {
      expect(BASS_LINE_STYLES['syncopated'].genres).toContain('funk');
    });
    
    it('should have pedal as lowest density', () => {
      const minDensity = Math.min(...Object.values(BASS_LINE_STYLES).map(s => s.density));
      expect(BASS_LINE_STYLES['pedal'].density).toBe(minDensity);
    });
    
    it('should have arpeggiated with chord tones only', () => {
      expect(BASS_LINE_STYLES['arpeggiated'].chordTonesOnly).toBe(true);
    });
  });
});

// ============================================================================
// Arranger Real-Time Controls Tests
// ============================================================================

describe('Arranger Real-Time Controls', () => {
  describe('ARRANGER_CONTROLS', () => {
    it('should have all control types', () => {
      const types: ArrangerControlType[] = [
        'syncStart', 'syncStop', 'tapTempo', 'variationUp', 'variationDown',
        'fillNow', 'intro', 'ending', 'break', 'bassInversion',
        'octaveUp', 'octaveDown', 'tempoLock', 'chordMemory', 'splitPoint'
      ];
      
      for (const type of types) {
        expect(ARRANGER_CONTROLS[type]).toBeDefined();
        expect(ARRANGER_CONTROLS[type].type).toBe(type);
      }
    });
    
    it('should have icons for all controls', () => {
      for (const control of Object.values(ARRANGER_CONTROLS)) {
        expect(control.icon).toBeDefined();
        expect(control.icon.length).toBeGreaterThan(0);
      }
    });
    
    it('should have shortcuts for key controls', () => {
      expect(ARRANGER_CONTROLS['syncStart'].shortcut).toBe('Space');
      expect(ARRANGER_CONTROLS['fillNow'].shortcut).toBe('F');
      expect(ARRANGER_CONTROLS['intro'].shortcut).toBe('I');
      expect(ARRANGER_CONTROLS['ending'].shortcut).toBe('E');
    });
    
    it('should mark toggle vs momentary correctly', () => {
      // These are toggles
      expect(ARRANGER_CONTROLS['syncStart'].momentary).toBe(false);
      expect(ARRANGER_CONTROLS['tempoLock'].momentary).toBe(false);
      expect(ARRANGER_CONTROLS['chordMemory'].momentary).toBe(false);
      
      // These are momentary
      expect(ARRANGER_CONTROLS['tapTempo'].momentary).toBe(true);
      expect(ARRANGER_CONTROLS['fillNow'].momentary).toBe(true);
      expect(ARRANGER_CONTROLS['variationUp'].momentary).toBe(true);
    });
  });
  
  describe('createArrangerControlState', () => {
    it('should create default control state', () => {
      const state = createArrangerControlState();
      
      expect(state.syncStart).toBe(true);
      expect(state.syncStop).toBe(false);
      expect(state.tempoLock).toBe(false);
      expect(state.chordMemory).toBe(false);
      expect(state.splitPoint).toBe(60);
      expect(state.octaveOffset).toBe(0);
      expect(state.forcedBassNote).toBeNull();
      expect(state.heldChordNotes).toEqual([]);
      expect(state.tapTimestamps).toEqual([]);
    });
    
    it('should return frozen state', () => {
      const state = createArrangerControlState();
      expect(Object.isFrozen(state)).toBe(true);
    });
  });
  
  describe('processArrangerControlCommand', () => {
    let state: ArrangerControlState;
    
    beforeEach(() => {
      state = createArrangerControlState();
    });
    
    it('should toggle syncStart', () => {
      const newState = processArrangerControlCommand(state, { type: 'toggleSyncStart' });
      expect(newState.syncStart).toBe(false);
      
      const toggledBack = processArrangerControlCommand(newState, { type: 'toggleSyncStart' });
      expect(toggledBack.syncStart).toBe(true);
    });
    
    it('should toggle syncStop', () => {
      const newState = processArrangerControlCommand(state, { type: 'toggleSyncStop' });
      expect(newState.syncStop).toBe(true);
    });
    
    it('should toggle tempoLock', () => {
      const newState = processArrangerControlCommand(state, { type: 'toggleTempoLock' });
      expect(newState.tempoLock).toBe(true);
    });
    
    it('should toggle chordMemory', () => {
      const newState = processArrangerControlCommand(state, { type: 'toggleChordMemory' });
      expect(newState.chordMemory).toBe(true);
    });
    
    it('should record tap tempo timestamps', () => {
      let s = state;
      s = processArrangerControlCommand(s, { type: 'tapTempo', timestamp: 1000 });
      expect(s.tapTimestamps).toEqual([1000]);
      
      s = processArrangerControlCommand(s, { type: 'tapTempo', timestamp: 1500 });
      expect(s.tapTimestamps).toEqual([1000, 1500]);
    });
    
    it('should keep only last 4 taps', () => {
      let s = state;
      for (let i = 0; i < 6; i++) {
        s = processArrangerControlCommand(s, { type: 'tapTempo', timestamp: i * 500 });
      }
      expect(s.tapTimestamps.length).toBe(4);
      expect(s.tapTimestamps).toEqual([1000, 1500, 2000, 2500]);
    });
    
    it('should set split point within bounds', () => {
      let s = processArrangerControlCommand(state, { type: 'setSplitPoint', note: 72 });
      expect(s.splitPoint).toBe(72);
      
      s = processArrangerControlCommand(state, { type: 'setSplitPoint', note: -10 });
      expect(s.splitPoint).toBe(0);
      
      s = processArrangerControlCommand(state, { type: 'setSplitPoint', note: 200 });
      expect(s.splitPoint).toBe(127);
    });
    
    it('should handle octave up/down', () => {
      let s = processArrangerControlCommand(state, { type: 'octaveUp' });
      expect(s.octaveOffset).toBe(1);
      
      s = processArrangerControlCommand(s, { type: 'octaveUp' });
      expect(s.octaveOffset).toBe(2);
      
      s = processArrangerControlCommand(s, { type: 'octaveUp' });
      expect(s.octaveOffset).toBe(2); // Max is 2
      
      s = processArrangerControlCommand(state, { type: 'octaveDown' });
      expect(s.octaveOffset).toBe(-1);
      
      s = processArrangerControlCommand(s, { type: 'octaveDown' });
      expect(s.octaveOffset).toBe(-2);
      
      s = processArrangerControlCommand(s, { type: 'octaveDown' });
      expect(s.octaveOffset).toBe(-2); // Min is -2
    });
    
    it('should force bass note', () => {
      const s = processArrangerControlCommand(state, { type: 'forceBassNote', note: 48 });
      expect(s.forcedBassNote).toBe(48);
      
      const cleared = processArrangerControlCommand(s, { type: 'forceBassNote', note: null });
      expect(cleared.forcedBassNote).toBeNull();
    });
    
    it('should update held notes', () => {
      const s = processArrangerControlCommand(state, { 
        type: 'updateHeldNotes', 
        notes: [60, 64, 67] 
      });
      expect(s.heldChordNotes).toEqual([60, 64, 67]);
    });
  });
  
  describe('calculateTapTempo', () => {
    it('should return null with less than 2 taps', () => {
      expect(calculateTapTempo([])).toBeNull();
      expect(calculateTapTempo([1000])).toBeNull();
    });
    
    it('should calculate tempo from taps', () => {
      // 500ms intervals = 120 BPM
      const tempo = calculateTapTempo([0, 500, 1000, 1500]);
      expect(tempo).toBe(120);
    });
    
    it('should calculate slower tempos', () => {
      // 1000ms intervals = 60 BPM
      const tempo = calculateTapTempo([0, 1000, 2000]);
      expect(tempo).toBe(60);
    });
    
    it('should calculate faster tempos', () => {
      // 250ms intervals = 240 BPM (clamped)
      const tempo = calculateTapTempo([0, 250, 500, 750]);
      expect(tempo).toBe(240);
    });
    
    it('should clamp to reasonable range', () => {
      // Very slow: 2000ms = 30 BPM (clamped to 40)
      const slow = calculateTapTempo([0, 2000, 4000]);
      expect(slow).toBe(40);
      
      // Very fast: 100ms = 600 BPM (clamped to 240)
      const fast = calculateTapTempo([0, 100, 200, 300]);
      expect(fast).toBe(240);
    });
  });
});

// ============================================================================
// Instrument Switcher Tests
// ============================================================================

describe('Instrument Switcher', () => {
  describe('INSTRUMENT_OPTIONS', () => {
    it('should have all instrument categories', () => {
      const categories: InstrumentCategory[] = [
        'bass', 'drums', 'piano', 'organ', 'guitar', 'strings',
        'brass', 'woodwinds', 'synth', 'pad', 'lead', 'percussion'
      ];
      
      for (const category of categories) {
        expect(INSTRUMENT_OPTIONS[category]).toBeDefined();
        expect(INSTRUMENT_OPTIONS[category].length).toBeGreaterThan(0);
      }
    });
    
    it('should have unique ids within each category', () => {
      for (const [category, options] of Object.entries(INSTRUMENT_OPTIONS)) {
        const ids = options.map(o => o.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });
    
    it('should have valid MIDI programs', () => {
      for (const options of Object.values(INSTRUMENT_OPTIONS)) {
        for (const option of options) {
          expect(option.program).toBeGreaterThanOrEqual(0);
          expect(option.program).toBeLessThanOrEqual(127);
        }
      }
    });
    
    it('should have icons for all instruments', () => {
      for (const options of Object.values(INSTRUMENT_OPTIONS)) {
        for (const option of options) {
          expect(option.icon).toBeDefined();
          expect(option.icon.length).toBeGreaterThan(0);
        }
      }
    });
    
    it('should have bass instruments with bass category', () => {
      for (const option of INSTRUMENT_OPTIONS.bass) {
        expect(option.category).toBe('bass');
      }
    });
    
    it('should have drum kits with bank MSB 120', () => {
      for (const option of INSTRUMENT_OPTIONS.drums) {
        expect(option.bankMSB).toBe(120);
      }
    });
  });
  
  describe('getInstrumentOptions', () => {
    it('should return options for valid category', () => {
      const bass = getInstrumentOptions('bass');
      expect(bass.length).toBeGreaterThan(0);
      expect(bass[0].category).toBe('bass');
    });
    
    it('should return piano options', () => {
      const piano = getInstrumentOptions('piano');
      expect(piano.length).toBeGreaterThanOrEqual(4);
      expect(piano.some(p => p.name === 'Rhodes')).toBe(true);
    });
    
    it('should return empty for invalid category', () => {
      // @ts-expect-error Testing invalid input
      const invalid = getInstrumentOptions('invalid');
      expect(invalid).toEqual([]);
    });
  });
  
  describe('searchInstruments', () => {
    it('should find instruments by name', () => {
      const results = searchInstruments('rhodes');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.toLowerCase().includes('rhodes'))).toBe(true);
    });
    
    it('should find instruments by tag', () => {
      const results = searchInstruments('jazz');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.tags.includes('jazz'))).toBe(true);
    });
    
    it('should find synth bass', () => {
      const results = searchInstruments('synth');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.id === 'synth-bass')).toBe(true);
    });
    
    it('should be case insensitive', () => {
      const lower = searchInstruments('piano');
      const upper = searchInstruments('PIANO');
      expect(lower.length).toBe(upper.length);
    });
    
    it('should return empty for no matches', () => {
      const results = searchInstruments('xyznonexistent');
      expect(results.length).toBe(0);
    });
    
    it('should find multiple categories', () => {
      const results = searchInstruments('acoustic');
      const categories = new Set(results.map(r => r.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });

  // ============================================================================
  // CHORD SUBSTITUTION TESTS
  // ============================================================================
  
  describe('Chord Substitution', () => {
    const cMajor: RecognizedChord = {
      root: 0, // C
      quality: 'major',
      extensions: [],
      alterations: [],
      sourceNotes: [60, 64, 67],
      symbol: 'C',
    };
    
    const g7: RecognizedChord = {
      root: 7, // G
      quality: 'dom7',
      extensions: [],
      alterations: [],
      sourceNotes: [55, 59, 62, 65],
      symbol: 'G7',
    };
    
    it('should perform tritone substitution on dominant 7th', () => {
      const subs = substituteChord(g7, 0, {
        type: 'tritone',
        strength: 1,
        preserveBass: false,
        preserveVoiceLeading: true,
        targetComplexity: '7ths',
      });
      
      expect(subs.length).toBe(1);
      expect(subs[0].root).toBe(1); // Db (6 semitones from G)
      expect(subs[0].quality).toBe('dom7');
    });
    
    it('should find relative minor', () => {
      const subs = substituteChord(cMajor, 0, {
        type: 'relative',
        strength: 1,
        preserveBass: false,
        preserveVoiceLeading: true,
        targetComplexity: 'triads',
      });
      
      expect(subs.length).toBe(1);
      expect(subs[0].root).toBe(9); // A minor (relative of C major)
      expect(subs[0].quality).toBe('minor');
    });
    
    it('should create secondary dominant', () => {
      const subs = substituteChord(cMajor, 0, {
        type: 'secondary',
        strength: 1,
        preserveBass: false,
        preserveVoiceLeading: true,
        targetComplexity: '7ths',
      });
      
      expect(subs.length).toBe(1);
      expect(subs[0].root).toBe(7); // G7 (V7 of C)
      expect(subs[0].quality).toBe('dom7');
    });
    
    it('should add diminished passing chord', () => {
      const subs = substituteChord(cMajor, 0, {
        type: 'diminished',
        strength: 1,
        preserveBass: false,
        preserveVoiceLeading: true,
        targetComplexity: '7ths',
      });
      
      expect(subs.length).toBe(1);
      expect(subs[0].quality).toBe('dim7');
    });
    
    it('should extend chord to 9th', () => {
      const subs = substituteChord(cMajor, 0, {
        type: 'extended',
        strength: 1,
        preserveBass: false,
        preserveVoiceLeading: true,
        targetComplexity: '9ths',
      });
      
      expect(subs.length).toBe(1);
      expect(subs[0].quality).toBe('9');
      expect(subs[0].extensions).toContain(9);
    });
    
    it('should simplify to triad', () => {
      const subs = substituteChord(g7, 0, {
        type: 'simplified',
        strength: 1,
        preserveBass: false,
        preserveVoiceLeading: true,
        targetComplexity: 'triads',
      });
      
      expect(subs.length).toBe(1);
      expect(subs[0].quality).toBe('major');
      expect(subs[0].extensions.length).toBe(0);
    });
  });

  // ============================================================================
  // PASSING CHORDS TESTS
  // ============================================================================
  
  describe('Passing Chords', () => {
    const cMajor: RecognizedChord = {
      root: 0,
      quality: 'major',
      extensions: [],
      alterations: [],
      sourceNotes: [60, 64, 67],
      symbol: 'C',
    };
    
    const fMajor: RecognizedChord = {
      root: 5,
      quality: 'major',
      extensions: [],
      alterations: [],
      sourceNotes: [65, 69, 72],
      symbol: 'F',
    };
    
    it('should generate chromatic passing chord', () => {
      const passing = generatePassingChords(cMajor, fMajor, {
        type: 'chromatic',
        density: 1,
        placement: 'between',
        duration: 0.25,
      });
      
      expect(passing.length).toBeGreaterThan(0);
      expect(passing[0].quality).toBe('dim7'); // Diminished is common chromatic passing
    });
    
    it('should generate diatonic passing chord', () => {
      const passing = generatePassingChords(cMajor, fMajor, {
        type: 'diatonic',
        density: 1,
        placement: 'between',
        duration: 0.5,
      });
      
      expect(passing.length).toBeGreaterThan(0);
      expect(passing[0].quality).toBe('dom7'); // V7 of F
    });
    
    it('should return empty array for zero density', () => {
      const passing = generatePassingChords(cMajor, fMajor, {
        type: 'chromatic',
        density: 0,
        placement: 'between',
        duration: 0.25,
      });
      
      expect(passing.length).toBe(0);
    });
  });

  // ============================================================================
  // PEDAL TONE TESTS
  // ============================================================================
  
  describe('Pedal Tones', () => {
    const cMajor: RecognizedChord = {
      root: 0,
      quality: 'major',
      extensions: [],
      alterations: [],
      sourceNotes: [60, 64, 67],
      symbol: 'C',
    };
    
    it('should apply bass pedal tone', () => {
      const result = applyPedalTone(cMajor, {
        note: 7, // G pedal
        duration: 4,
        inBass: true,
        rhythm: 'sustained',
      });
      
      expect(result.bass).toBe(7);
      expect(result.symbol).toContain('/G');
    });
    
    it('should keep original chord structure with bass pedal', () => {
      const result = applyPedalTone(cMajor, {
        note: 0, // C pedal (same as root)
        duration: 4,
        inBass: true,
        rhythm: 'sustained',
      });
      
      expect(result.root).toBe(0);
      expect(result.quality).toBe('major');
    });
  });

  // ============================================================================
  // ANTICIPATION TESTS
  // ============================================================================
  
  describe('Anticipation', () => {
    it('should anticipate by specified amount', () => {
      const originalTick = 1920; // Beat 4
      const result = applyAnticipation(originalTick, {
        amount: 0.25, // Sixteenth note
        probability: 1,
        chordChanges: true,
        melodyNotes: true,
      }, () => 0.5); // Always apply (above probability threshold)
      
      expect(result).toBe(1920 - 0.25 * 480); // 480 = PPQ
      expect(result).toBe(1800);
    });
    
    it('should not anticipate based on probability', () => {
      const originalTick = 1920;
      const result = applyAnticipation(originalTick, {
        amount: 0.25,
        probability: 0.5,
        chordChanges: true,
        melodyNotes: true,
      }, () => 0.9); // Above threshold, no anticipation
      
      expect(result).toBe(originalTick);
    });
    
    it('should not go negative', () => {
      const originalTick = 100;
      const result = applyAnticipation(originalTick, {
        amount: 1, // Full beat
        probability: 1,
        chordChanges: true,
        melodyNotes: true,
      }, () => 0.5);
      
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // HARMONIC TENSION TESTS
  // ============================================================================
  
  describe('Harmonic Tension', () => {
    it('should calculate low tension for major triad', () => {
      const cMajor: RecognizedChord = {
        root: 0,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 64, 67],
        symbol: 'C',
      };
      
      const tension = calculateChordTension(cMajor);
      expect(tension).toBeLessThan(0.2);
    });
    
    it('should calculate high tension for diminished 7th', () => {
      const bdim7: RecognizedChord = {
        root: 11,
        quality: 'dim7',
        extensions: [],
        alterations: [],
        sourceNotes: [59, 62, 65, 68],
        symbol: 'Bdim7',
      };
      
      const tension = calculateChordTension(bdim7);
      expect(tension).toBeGreaterThan(0.5);
    });
    
    it('should calculate medium tension for dominant 7th', () => {
      const g7: RecognizedChord = {
        root: 7,
        quality: 'dom7',
        extensions: [],
        alterations: [],
        sourceNotes: [55, 59, 62, 65],
        symbol: 'G7',
      };
      
      const tension = calculateChordTension(g7);
      expect(tension).toBeGreaterThan(0.2);
      expect(tension).toBeLessThan(0.5);
    });
    
    it('should increase tension with extensions', () => {
      const c9: RecognizedChord = {
        root: 0,
        quality: '9',
        extensions: [9],
        alterations: [],
        sourceNotes: [60, 64, 67, 70, 74],
        symbol: 'C9',
      };
      
      const tension = calculateChordTension(c9);
      expect(tension).toBeGreaterThan(0.3);
    });
    
    it('should adjust chord to increase tension', () => {
      const cMajor: RecognizedChord = {
        root: 0,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 64, 67],
        symbol: 'C',
      };
      
      const result = adjustChordTension(cMajor, 0.5);
      expect(result.extensions.length).toBeGreaterThan(0);
    });
    
    it('should adjust chord to decrease tension', () => {
      const c9: RecognizedChord = {
        root: 0,
        quality: '9',
        extensions: [9, 11],
        alterations: ['#5'],
        sourceNotes: [60, 64, 68, 70, 74, 77],
        symbol: 'C9#5',
      };
      
      const result = adjustChordTension(c9, 0.1);
      expect(result.extensions.length).toBe(0);
      expect(result.alterations.length).toBe(0);
    });
  });

  // ============================================================================
  // CHORD COMPLEXITY TESTS
  // ============================================================================
  
  describe('Chord Complexity', () => {
    const c9: RecognizedChord = {
      root: 0,
      quality: 'maj9',
      extensions: [9],
      alterations: [],
      sourceNotes: [60, 64, 67, 71, 74],
      symbol: 'Cmaj9',
    };
    
    it('should simplify to triad', () => {
      const result = adjustChordComplexity(c9, 'triads');
      expect(result.quality).toBe('major');
      expect(result.extensions.length).toBe(0);
    });
    
    it('should adjust to 7th', () => {
      const result = adjustChordComplexity(c9, '7ths');
      expect(result.quality).toBe('maj7');
      expect(result.extensions.length).toBe(0);
    });
    
    it('should maintain 9th', () => {
      const result = adjustChordComplexity(c9, '9ths');
      expect(result.quality).toBe('maj9');
      expect(result.extensions).toContain(9);
    });
    
    it('should extend to 11th', () => {
      const result = adjustChordComplexity(c9, '11ths');
      expect(result.extensions).toContain(11);
    });
    
    it('should extend to 13th', () => {
      const result = adjustChordComplexity(c9, '13ths');
      expect(result.extensions).toContain(13);
    });
  });

  // ============================================================================
  // TENSION RESOLVER TESTS
  // ============================================================================
  
  describe('Tension Resolver', () => {
    it('should resolve sus4 to major', () => {
      const csus4: RecognizedChord = {
        root: 0,
        quality: 'sus4',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 65, 67],
        symbol: 'Csus4',
      };
      
      const result = resolveTensionChord(csus4);
      expect(result.quality).toBe('major');
    });
    
    it('should resolve sus2 to major', () => {
      const csus2: RecognizedChord = {
        root: 0,
        quality: 'sus2',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 62, 67],
        symbol: 'Csus2',
      };
      
      const result = resolveTensionChord(csus2);
      expect(result.quality).toBe('major');
    });
    
    it('should resolve dominant 7 to tonic', () => {
      const g7: RecognizedChord = {
        root: 7,
        quality: 'dom7',
        extensions: [],
        alterations: [],
        sourceNotes: [55, 59, 62, 65],
        symbol: 'G7',
      };
      
      const result = resolveTensionChord(g7);
      expect(result.root).toBe(0); // Resolves to C (5 semitones up from G)
      expect(result.quality).toBe('major');
    });
    
    it('should resolve diminished 7 to nearby chord', () => {
      const bdim7: RecognizedChord = {
        root: 11,
        quality: 'dim7',
        extensions: [],
        alterations: [],
        sourceNotes: [59, 62, 65, 68],
        symbol: 'Bdim7',
      };
      
      const result = resolveTensionChord(bdim7);
      expect(result.root).toBe(0); // Resolves up half step to C
      expect(result.quality).toBe('minor');
    });
    
    it('should not change stable chords', () => {
      const cMajor: RecognizedChord = {
        root: 0,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 64, 67],
        symbol: 'C',
      };
      
      const result = resolveTensionChord(cMajor);
      expect(result).toBe(cMajor); // Should return same object
    });
  });

  // ============================================================================
  // MELODY HARMONIZER TESTS
  // ============================================================================
  
  describe('Melody Harmonizer', () => {
    const melodyNote = 60; // Middle C
    
    it('should harmonize in parallel thirds', () => {
      const harmony = harmonizeMelody(melodyNote, {
        type: 'thirds',
        voices: 2,
        below: true,
      });
      
      expect(harmony.length).toBe(2);
      expect(harmony[0]).toBe(57); // 3 semitones below
      expect(harmony[1]).toBe(54); // 6 semitones below
    });
    
    it('should harmonize in parallel sixths', () => {
      const harmony = harmonizeMelody(melodyNote, {
        type: 'sixths',
        voices: 1,
        below: true,
      });
      
      expect(harmony.length).toBe(1);
      expect(harmony[0]).toBe(51); // 9 semitones below
    });
    
    it('should harmonize in parallel fourths', () => {
      const harmony = harmonizeMelody(melodyNote, {
        type: 'fourths',
        voices: 1,
        below: false,
      });
      
      expect(harmony.length).toBe(1);
      expect(harmony[0]).toBe(65); // 5 semitones above
    });
    
    it('should harmonize in parallel fifths', () => {
      const harmony = harmonizeMelody(melodyNote, {
        type: 'fifths',
        voices: 1,
        below: true,
      });
      
      expect(harmony.length).toBe(1);
      expect(harmony[0]).toBe(53); // 7 semitones below
    });
    
    it('should harmonize in octaves', () => {
      const harmony = harmonizeMelody(melodyNote, {
        type: 'octaves',
        voices: 2,
        below: false,
      });
      
      expect(harmony.length).toBe(2);
      expect(harmony[0]).toBe(72); // 12 semitones above
      expect(harmony[1]).toBe(84); // 24 semitones above
    });
    
    it('should harmonize in diatonic thirds with scale', () => {
      const cMajorScale = [0, 2, 4, 5, 7, 9, 11]; // C major
      const harmony = harmonizeMelody(melodyNote, {
        type: 'diatonic-thirds',
        voices: 1,
        scale: cMajorScale,
        below: true,
      });
      
      expect(harmony.length).toBe(1);
      // Should be E (scale degree below C in thirds)
    });
    
    it('should harmonize with four-part harmony', () => {
      const cMajorChord: RecognizedChord = {
        root: 0,
        quality: 'major',
        extensions: [],
        alterations: [],
        sourceNotes: [60, 64, 67],
        symbol: 'C',
      };
      
      const harmony = harmonizeMelody(melodyNote, {
        type: 'four-part',
        voices: 3,
        chord: cMajorChord,
        below: true,
      });
      
      expect(harmony.length).toBeGreaterThan(0);
      expect(harmony.length).toBeLessThanOrEqual(3);
    });
  });
});
