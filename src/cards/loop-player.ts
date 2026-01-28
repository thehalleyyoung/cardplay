/**
 * LoopPlayer Card
 *
 * Professional audio loop player with time-stretching, pitch-shifting,
 * slicing, and intelligent tempo/key matching. Supports multiple loop
 * formats and provides extensive preset library for instant musical ideas.
 *
 * Features:
 * - Multi-layer loop playback (8 simultaneous layers)
 * - Real-time time-stretching (granular/phase vocoder)
 * - Pitch-shifting independent of tempo
 * - Beat slicing and rearrangement
 * - Automatic tempo detection
 * - Key/chord detection
 * - Loop crossfading
 * - Per-layer effects (filter, EQ, reverb send)
 * - Extensive preset library (100+ loops)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum simultaneous loop layers */
export const MAX_LAYERS = 8;

/** Maximum slice count per loop */
export const MAX_SLICES = 64;

/** Minimum tempo BPM */
export const MIN_TEMPO = 20;

/** Maximum tempo BPM */
export const MAX_TEMPO = 300;

/** Minimum pitch shift (semitones) */
export const MIN_PITCH = -24;

/** Maximum pitch shift (semitones) */
export const MAX_PITCH = 24;

/** Sample rate for audio processing */
export const SAMPLE_RATE = 44100;

/** Maximum loop length in seconds */
export const MAX_LOOP_LENGTH = 30;

/** Crossfade default (ms) */
export const DEFAULT_CROSSFADE_MS = 10;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Time-stretch algorithm
 */
export type TimeStretchAlgorithm =
  | 'granular'      // Granular synthesis - good for percussion
  | 'phaseVocoder'  // Phase vocoder - good for tonal
  | 'elastique'     // Elastique-style high quality
  | 'paulstretch'   // Extreme stretching
  | 'wavetable'     // Wavetable-based
  | 'resample';     // Simple resampling (pitch changes with tempo)

/**
 * Loop playback direction
 */
export type LoopDirection = 'forward' | 'reverse' | 'pingpong' | 'random';

/**
 * Slice trigger mode
 */
export type SliceTriggerMode =
  | 'beat'          // Trigger on beats
  | 'midi'          // Trigger via MIDI notes
  | 'pattern'       // Pattern-based triggering
  | 'random'        // Random slice selection
  | 'sequential';   // Play slices in order

/**
 * Loop sync mode
 */
export type LoopSyncMode =
  | 'free'          // Free-running
  | 'tempo'         // Sync to host tempo
  | 'beat'          // Sync to beat grid
  | 'bar'           // Start on bar
  | 'trigger';      // Wait for trigger

/**
 * Filter type for per-layer filtering
 */
export type FilterType =
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'notch'
  | 'lowshelf'
  | 'highshelf'
  | 'peaking';

/**
 * Loop category for organization
 */
export type LoopCategory =
  | 'drums'
  | 'percussion'
  | 'bass'
  | 'guitar'
  | 'piano'
  | 'keys'
  | 'synth'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'vocal'
  | 'fx'
  | 'ambient'
  | 'ethnic'
  | 'full-mix';

/**
 * Detected key/chord information
 */
export interface KeyInfo {
  /** Root note (0-11) */
  root: number;

  /** Scale type */
  scale: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'lydian' | 'phrygian' | 'locrian' | 'chromatic';

  /** Detected chords */
  chords?: Array<{
    beat: number;
    root: number;
    type: string;
  }>;

  /** Confidence 0-1 */
  confidence: number;
}

/**
 * Slice within a loop
 */
export interface LoopSlice {
  /** Slice index */
  index: number;

  /** Start position in samples */
  startSample: number;

  /** End position in samples */
  endSample: number;

  /** Start position in beats */
  startBeat: number;

  /** End position in beats */
  endBeat: number;

  /** Detected transient strength 0-1 */
  transientStrength: number;

  /** Is this a beat boundary? */
  isBeat: boolean;

  /** Is this a downbeat? */
  isDownbeat: boolean;

  /** Gain adjustment for this slice */
  gain: number;

  /** Pitch offset for this slice (semitones) */
  pitch: number;

  /** Reverse this slice */
  reverse: boolean;
}

/**
 * Loop audio data and metadata
 */
export interface LoopData {
  /** Unique loop ID */
  id: string;

  /** Display name */
  name: string;

  /** Category */
  category: LoopCategory;

  /** Tags for searching */
  tags: string[];

  /** Original tempo in BPM */
  originalTempo: number;

  /** Detected key information */
  keyInfo?: KeyInfo;

  /** Loop length in beats */
  lengthBeats: number;

  /** Loop length in bars */
  lengthBars: number;

  /** Time signature numerator */
  timeSignatureNumerator: number;

  /** Time signature denominator */
  timeSignatureDenominator: number;

  /** Audio data (left channel) */
  audioDataL?: Float32Array;

  /** Audio data (right channel) */
  audioDataR?: Float32Array;

  /** Is stereo? */
  isStereo: boolean;

  /** Sample rate of original audio */
  sampleRate: number;

  /** Total samples */
  totalSamples: number;

  /** Detected slices */
  slices: LoopSlice[];

  /** Waveform peak data for visualization */
  waveformPeaks?: number[];

  /** Freesound sample ID (if from Freesound) */
  freesoundId?: number;

  /** Is factory preset? */
  isFactory: boolean;
}

/**
 * Layer configuration
 */
export interface LoopLayer {
  /** Layer ID */
  id: string;

  /** Layer index 0-7 */
  index: number;

  /** Loaded loop data */
  loop: LoopData | null;

  /** Layer enabled */
  enabled: boolean;

  /** Volume 0-1 */
  volume: number;

  /** Pan -1 to 1 */
  pan: number;

  /** Pitch shift in semitones */
  pitch: number;

  /** Fine tune in cents */
  fineTune: number;

  /** Start offset in beats */
  startOffset: number;

  /** End offset (negative from end) in beats */
  endOffset: number;

  /** Loop direction */
  direction: LoopDirection;

  /** Muted */
  muted: boolean;

  /** Solo */
  solo: boolean;

  /** Slice trigger mode */
  sliceTriggerMode: SliceTriggerMode;

  /** Currently active slice index */
  activeSlice: number;

  /** Slice pattern (for pattern mode) */
  slicePattern: number[];

  /** Current pattern step */
  patternStep: number;

  /** Filter enabled */
  filterEnabled: boolean;

  /** Filter type */
  filterType: FilterType;

  /** Filter frequency */
  filterFreq: number;

  /** Filter resonance */
  filterQ: number;

  /** Filter envelope amount */
  filterEnvAmount: number;

  /** Reverb send 0-1 */
  reverbSend: number;

  /** Delay send 0-1 */
  delaySend: number;

  /** Time stretch ratio (1 = original speed) */
  stretchRatio: number;

  /** Lock pitch when stretching */
  lockPitch: boolean;

  /** Current playhead position in samples */
  playheadSample: number;

  /** Current playhead in beats */
  playheadBeat: number;

  /** Is playing */
  isPlaying: boolean;

  /** Trigger pending */
  triggerPending: boolean;

  /** Fade in ms */
  fadeIn: number;

  /** Fade out ms */
  fadeOut: number;

  /** Crossfade ms (for looping) */
  crossfade: number;

  /** MIDI note assignments for slices */
  sliceMidiMap: Map<number, number>;

  /** Quantize triggers to beat grid */
  quantizeTrigger: boolean;
}

/**
 * Loop preset (full configuration)
 */
export interface LoopPreset {
  /** Preset ID */
  id: string;

  /** Display name */
  name: string;

  /** Category */
  category: string;

  /** Tags */
  tags: string[];

  /** BPM for this preset */
  bpm: number;

  /** Key root (0-11) */
  keyRoot: number;

  /** Key scale */
  keyScale: 'major' | 'minor';

  /** Layer configurations */
  layers: Array<{
    loopId: string;
    enabled: boolean;
    volume: number;
    pan: number;
    pitch: number;
    filterEnabled: boolean;
    filterType: FilterType;
    filterFreq: number;
    filterQ: number;
    direction: LoopDirection;
  }>;

  /** Time stretch algorithm */
  stretchAlgorithm: TimeStretchAlgorithm;

  /** Description */
  description?: string;
}

/**
 * Loop player state
 */
export interface LoopPlayerState {
  /** Is globally playing */
  isPlaying: boolean;

  /** Global tempo */
  tempo: number;

  /** Global pitch offset */
  globalPitch: number;

  /** Master volume */
  masterVolume: number;

  /** Time stretch algorithm */
  stretchAlgorithm: TimeStretchAlgorithm;

  /** Sync mode */
  syncMode: LoopSyncMode;

  /** All layers */
  layers: LoopLayer[];

  /** Solo layers (empty = no solo active) */
  soloLayers: string[];

  /** Loop library */
  library: Map<string, LoopData>;

  /** Current preset */
  currentPreset: string | null;

  /** Key root for matching */
  keyRoot: number;

  /** Key scale for matching */
  keyScale: 'major' | 'minor';

  /** Auto-match key */
  autoMatchKey: boolean;

  /** Auto-match tempo */
  autoMatchTempo: boolean;

  /** Metronome enabled */
  metronomeEnabled: boolean;

  /** Current beat position */
  currentBeat: number;

  /** Current bar */
  currentBar: number;

  /** Transport position in samples */
  transportSample: number;

  /** Quantize grid (beats) */
  quantizeGrid: number;

  /** Crossfade for all loops */
  globalCrossfade: number;

  /** Master filter enabled */
  masterFilterEnabled: boolean;

  /** Master filter frequency */
  masterFilterFreq: number;

  /** Master reverb mix */
  masterReverb: number;
}

/**
 * Loop player input events
 */
export type LoopPlayerInput =
  | { type: 'play' }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'setTempo'; bpm: number }
  | { type: 'setGlobalPitch'; semitones: number }
  | { type: 'setMasterVolume'; volume: number }
  | { type: 'setStretchAlgorithm'; algorithm: TimeStretchAlgorithm }
  | { type: 'setSyncMode'; mode: LoopSyncMode }
  | { type: 'loadLoop'; layerIndex: number; loopId: string }
  | { type: 'unloadLoop'; layerIndex: number }
  | { type: 'setLayerVolume'; layerIndex: number; volume: number }
  | { type: 'setLayerPan'; layerIndex: number; pan: number }
  | { type: 'setLayerPitch'; layerIndex: number; semitones: number }
  | { type: 'setLayerDirection'; layerIndex: number; direction: LoopDirection }
  | { type: 'muteLayer'; layerIndex: number }
  | { type: 'soloLayer'; layerIndex: number }
  | { type: 'enableLayer'; layerIndex: number; enabled: boolean }
  | { type: 'setLayerFilter'; layerIndex: number; config: Partial<{ enabled: boolean; type: FilterType; freq: number; q: number }> }
  | { type: 'setLayerSends'; layerIndex: number; reverb?: number; delay?: number }
  | { type: 'triggerSlice'; layerIndex: number; sliceIndex: number }
  | { type: 'setSlicePattern'; layerIndex: number; pattern: number[] }
  | { type: 'setSliceTriggerMode'; layerIndex: number; mode: SliceTriggerMode }
  | { type: 'loadPreset'; presetId: string }
  | { type: 'savePreset'; name: string; category: string }
  | { type: 'setKeyRoot'; root: number }
  | { type: 'setKeyScale'; scale: 'major' | 'minor' }
  | { type: 'setAutoMatchKey'; enabled: boolean }
  | { type: 'setAutoMatchTempo'; enabled: boolean }
  | { type: 'setQuantizeGrid'; beats: number }
  | { type: 'tick'; time: number; beat: number }
  | { type: 'midiNoteOn'; note: number; velocity: number }
  | { type: 'midiNoteOff'; note: number }
  | { type: 'midiCC'; controller: number; value: number }
  | { type: 'addLoopToLibrary'; loop: LoopData }
  | { type: 'removeLoopFromLibrary'; loopId: string }
  | { type: 'detectTempo'; layerIndex: number }
  | { type: 'detectKey'; layerIndex: number }
  | { type: 'sliceLoop'; layerIndex: number; sliceCount: number }
  | { type: 'importFromFreesound'; freesoundId: number; apiKey: string };

/**
 * Loop player output events
 */
export type LoopPlayerOutput =
  | { type: 'audioFrame'; layerIndex: number; bufferL: Float32Array; bufferR: Float32Array; time: number }
  | { type: 'loopStart'; layerIndex: number; loopId: string }
  | { type: 'loopEnd'; layerIndex: number; loopId: string }
  | { type: 'sliceTriggered'; layerIndex: number; sliceIndex: number }
  | { type: 'beatSync'; beat: number; bar: number }
  | { type: 'tempoDetected'; layerIndex: number; tempo: number; confidence: number }
  | { type: 'keyDetected'; layerIndex: number; keyInfo: KeyInfo }
  | { type: 'slicesGenerated'; layerIndex: number; sliceCount: number }
  | { type: 'presetLoaded'; presetId: string }
  | { type: 'presetSaved'; presetId: string }
  | { type: 'loopLoaded'; layerIndex: number; loopId: string }
  | { type: 'loopUnloaded'; layerIndex: number }
  | { type: 'error'; message: string };

/**
 * Result from processing
 */
export interface LoopPlayerResult {
  state: LoopPlayerState;
  outputs: LoopPlayerOutput[];
}

// =============================================================================
// FACTORY LOOPS (PRESET LIBRARY)
// =============================================================================

/**
 * Create placeholder loop data (in real app, would load audio)
 */
function createLoopData(
  id: string,
  name: string,
  category: LoopCategory,
  tempo: number,
  lengthBars: number,
  tags: string[],
  keyRoot: number = 0,
  keyScale: 'major' | 'minor' = 'minor'
): LoopData {
  const beatsPerBar = 4;
  const lengthBeats = lengthBars * beatsPerBar;
  const sampleLength = Math.floor((lengthBeats / tempo) * 60 * SAMPLE_RATE);

  return {
    id,
    name,
    category,
    tags,
    originalTempo: tempo,
    keyInfo: {
      root: keyRoot,
      scale: keyScale,
      confidence: 0.9,
    },
    lengthBeats,
    lengthBars,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    isStereo: true,
    sampleRate: SAMPLE_RATE,
    totalSamples: sampleLength,
    slices: [],
    isFactory: true,
  };
}

/**
 * Factory loop library
 */
export const FACTORY_LOOPS: LoopData[] = [
  // =========================================================================
  // DRUMS
  // =========================================================================
  createLoopData('drums-house-1', 'House Groove 1', 'drums', 124, 2, ['house', 'four-on-floor', 'electronic']),
  createLoopData('drums-house-2', 'House Groove 2', 'drums', 124, 2, ['house', 'funky', 'electronic']),
  createLoopData('drums-techno-1', 'Techno Drive', 'drums', 130, 2, ['techno', 'driving', 'electronic']),
  createLoopData('drums-techno-2', 'Techno Industrial', 'drums', 135, 2, ['techno', 'industrial', 'hard']),
  createLoopData('drums-dnb-1', 'DnB Roller', 'drums', 174, 2, ['dnb', 'jungle', 'breakbeat']),
  createLoopData('drums-dnb-2', 'DnB Steppy', 'drums', 170, 2, ['dnb', 'neurofunk', 'complex']),
  createLoopData('drums-hiphop-1', 'Hip-Hop Boom Bap', 'drums', 90, 2, ['hip-hop', 'boom-bap', 'classic']),
  createLoopData('drums-hiphop-2', 'Hip-Hop Trap', 'drums', 140, 2, ['hip-hop', 'trap', 'hi-hats']),
  createLoopData('drums-breakbeat-1', 'Breakbeat Funk', 'drums', 110, 2, ['breakbeat', 'funk', 'groovy']),
  createLoopData('drums-rock-1', 'Rock Steady', 'drums', 120, 2, ['rock', 'acoustic', 'live']),
  createLoopData('drums-rock-2', 'Rock Power', 'drums', 130, 2, ['rock', 'powerful', 'fill']),
  createLoopData('drums-jazz-1', 'Jazz Swing', 'drums', 120, 2, ['jazz', 'swing', 'brushes']),
  createLoopData('drums-jazz-2', 'Jazz Bebop', 'drums', 180, 2, ['jazz', 'bebop', 'fast']),
  createLoopData('drums-latin-1', 'Latin Salsa', 'drums', 100, 2, ['latin', 'salsa', 'clave']),
  createLoopData('drums-reggae-1', 'Reggae One Drop', 'drums', 80, 2, ['reggae', 'dub', 'one-drop']),
  createLoopData('drums-funk-1', 'Funk Groove', 'drums', 100, 2, ['funk', 'groovy', 'syncopated']),
  createLoopData('drums-disco-1', 'Disco Beat', 'drums', 120, 2, ['disco', 'four-on-floor', 'groovy']),
  createLoopData('drums-afrobeat-1', 'Afrobeat Poly', 'drums', 105, 4, ['afrobeat', 'polyrhythmic', 'complex']),

  // =========================================================================
  // PERCUSSION
  // =========================================================================
  createLoopData('perc-conga-1', 'Conga Latin', 'percussion', 100, 2, ['conga', 'latin', 'acoustic']),
  createLoopData('perc-bongo-1', 'Bongo Groove', 'percussion', 95, 2, ['bongo', 'latin', 'funky']),
  createLoopData('perc-shaker-1', 'Shaker 16ths', 'percussion', 120, 1, ['shaker', 'rhythm', 'groove']),
  createLoopData('perc-tambourine-1', 'Tambourine 8ths', 'percussion', 120, 1, ['tambourine', 'rhythm', 'bright']),
  createLoopData('perc-djembe-1', 'Djembe African', 'percussion', 90, 4, ['djembe', 'african', 'tribal']),
  createLoopData('perc-tabla-1', 'Tabla Indian', 'percussion', 80, 4, ['tabla', 'indian', 'complex']),
  createLoopData('perc-cajon-1', 'Cajon Flamenco', 'percussion', 95, 2, ['cajon', 'flamenco', 'acoustic']),
  createLoopData('perc-electronic-1', 'Electronic Perc', 'percussion', 128, 2, ['electronic', 'glitchy', 'synth']),

  // =========================================================================
  // BASS
  // =========================================================================
  createLoopData('bass-house-1', 'House Bass', 'bass', 124, 2, ['house', 'synth', 'pumping'], 0, 'minor'),
  createLoopData('bass-techno-1', 'Techno Bass', 'bass', 130, 2, ['techno', 'dark', 'rumble'], 5, 'minor'),
  createLoopData('bass-dnb-1', 'DnB Reese', 'bass', 174, 4, ['dnb', 'reese', 'moving'], 7, 'minor'),
  createLoopData('bass-dubstep-1', 'Dubstep Wobble', 'bass', 140, 4, ['dubstep', 'wobble', 'aggressive'], 0, 'minor'),
  createLoopData('bass-funk-1', 'Funk Slap', 'bass', 100, 2, ['funk', 'slap', 'groovy'], 9, 'minor'),
  createLoopData('bass-hiphop-1', 'Hip-Hop Sub', 'bass', 90, 2, ['hip-hop', 'sub', '808'], 3, 'minor'),
  createLoopData('bass-rock-1', 'Rock Bass', 'bass', 120, 2, ['rock', 'distorted', 'power'], 4, 'minor'),
  createLoopData('bass-reggae-1', 'Reggae Dub Bass', 'bass', 80, 2, ['reggae', 'dub', 'deep'], 2, 'minor'),
  createLoopData('bass-jazz-1', 'Jazz Upright', 'bass', 120, 4, ['jazz', 'upright', 'walking'], 7, 'major'),
  createLoopData('bass-latin-1', 'Latin Tumbao', 'bass', 100, 2, ['latin', 'tumbao', 'syncopated'], 0, 'minor'),

  // =========================================================================
  // GUITAR
  // =========================================================================
  createLoopData('guitar-funk-1', 'Funk Wah Guitar', 'guitar', 100, 2, ['funk', 'wah', 'rhythmic'], 4, 'minor'),
  createLoopData('guitar-rock-1', 'Rock Power Chords', 'guitar', 130, 2, ['rock', 'power-chords', 'distorted'], 4, 'minor'),
  createLoopData('guitar-rock-2', 'Rock Clean Arp', 'guitar', 120, 4, ['rock', 'clean', 'arpeggiated'], 0, 'major'),
  createLoopData('guitar-blues-1', 'Blues Lick', 'guitar', 80, 4, ['blues', 'lick', 'expressive'], 7, 'minor'),
  createLoopData('guitar-acoustic-1', 'Acoustic Strum', 'guitar', 100, 2, ['acoustic', 'strumming', 'folk'], 7, 'major'),
  createLoopData('guitar-acoustic-2', 'Acoustic Fingerpick', 'guitar', 90, 4, ['acoustic', 'fingerpicking', 'gentle'], 0, 'major'),
  createLoopData('guitar-reggae-1', 'Reggae Skank', 'guitar', 80, 2, ['reggae', 'skank', 'offbeat'], 5, 'minor'),
  createLoopData('guitar-jazz-1', 'Jazz Comping', 'guitar', 120, 4, ['jazz', 'comping', 'chord-melody'], 2, 'major'),

  // =========================================================================
  // PIANO / KEYS
  // =========================================================================
  createLoopData('piano-pop-1', 'Pop Piano Chords', 'piano', 120, 4, ['pop', 'chords', 'emotional'], 0, 'major'),
  createLoopData('piano-jazz-1', 'Jazz Piano Voicing', 'piano', 110, 4, ['jazz', 'voicings', 'complex'], 5, 'major'),
  createLoopData('piano-classical-1', 'Classical Arpeggio', 'piano', 80, 4, ['classical', 'arpeggio', 'romantic'], 9, 'minor'),
  createLoopData('piano-ballad-1', 'Ballad Piano', 'piano', 70, 4, ['ballad', 'emotional', 'slow'], 7, 'major'),
  createLoopData('keys-rhodes-1', 'Rhodes Electric', 'keys', 90, 2, ['rhodes', 'electric', 'soulful'], 4, 'minor'),
  createLoopData('keys-wurli-1', 'Wurlitzer Groove', 'keys', 100, 2, ['wurlitzer', 'funky', 'vintage'], 2, 'minor'),
  createLoopData('keys-organ-1', 'Hammond Groove', 'keys', 110, 2, ['organ', 'hammond', 'gospel'], 7, 'major'),
  createLoopData('keys-clavinet-1', 'Clavinet Funk', 'keys', 100, 2, ['clavinet', 'funk', 'percussive'], 9, 'minor'),

  // =========================================================================
  // SYNTH
  // =========================================================================
  createLoopData('synth-pad-1', 'Ambient Pad', 'synth', 120, 8, ['pad', 'ambient', 'lush'], 0, 'major'),
  createLoopData('synth-pad-2', 'Dark Pad', 'synth', 100, 8, ['pad', 'dark', 'evolving'], 2, 'minor'),
  createLoopData('synth-arp-1', 'Synth Arpeggio', 'synth', 128, 4, ['arpeggio', 'electronic', 'pulsing'], 5, 'minor'),
  createLoopData('synth-arp-2', 'Trance Arp', 'synth', 140, 4, ['trance', 'uplifting', 'bright'], 9, 'minor'),
  createLoopData('synth-lead-1', 'Synth Lead', 'synth', 128, 2, ['lead', 'monophonic', 'aggressive'], 7, 'minor'),
  createLoopData('synth-stab-1', 'House Stabs', 'synth', 124, 2, ['stabs', 'house', 'classic'], 0, 'minor'),
  createLoopData('synth-pluck-1', 'Pluck Sequence', 'synth', 120, 4, ['pluck', 'sequenced', 'melodic'], 4, 'minor'),
  createLoopData('synth-acid-1', 'Acid 303', 'synth', 130, 2, ['acid', '303', 'squelchy'], 5, 'minor'),
  createLoopData('synth-modular-1', 'Modular Sequence', 'synth', 120, 4, ['modular', 'random', 'experimental'], 0, 'minor'),
  createLoopData('synth-retrowave-1', 'Retrowave Chords', 'synth', 110, 4, ['retrowave', 'synthwave', '80s'], 2, 'major'),

  // =========================================================================
  // STRINGS
  // =========================================================================
  createLoopData('strings-legato-1', 'Strings Legato', 'strings', 60, 8, ['strings', 'legato', 'cinematic'], 0, 'minor'),
  createLoopData('strings-staccato-1', 'Strings Staccato', 'strings', 120, 2, ['strings', 'staccato', 'rhythmic'], 5, 'minor'),
  createLoopData('strings-tremolo-1', 'Strings Tremolo', 'strings', 100, 4, ['strings', 'tremolo', 'tense'], 2, 'minor'),
  createLoopData('strings-pizzicato-1', 'Pizzicato Pattern', 'strings', 90, 2, ['pizzicato', 'playful', 'light'], 7, 'major'),

  // =========================================================================
  // BRASS
  // =========================================================================
  createLoopData('brass-stabs-1', 'Brass Stabs', 'brass', 100, 2, ['brass', 'stabs', 'funk'], 4, 'minor'),
  createLoopData('brass-section-1', 'Brass Section', 'brass', 110, 4, ['brass', 'section', 'big-band'], 5, 'major'),
  createLoopData('brass-trumpet-1', 'Trumpet Solo', 'brass', 100, 4, ['trumpet', 'solo', 'jazz'], 2, 'major'),

  // =========================================================================
  // VOCALS
  // =========================================================================
  createLoopData('vocal-chop-1', 'Vocal Chops', 'vocal', 128, 2, ['vocal', 'chops', 'electronic'], 0, 'minor'),
  createLoopData('vocal-phrase-1', 'Vocal Phrase', 'vocal', 120, 4, ['vocal', 'phrase', 'rnb'], 7, 'minor'),
  createLoopData('vocal-ad-lib-1', 'Vocal Ad-libs', 'vocal', 100, 2, ['vocal', 'ad-libs', 'hip-hop'], 5, 'minor'),
  createLoopData('vocal-choir-1', 'Choir Pad', 'vocal', 80, 8, ['choir', 'pad', 'ethereal'], 0, 'major'),

  // =========================================================================
  // FX / AMBIENT
  // =========================================================================
  createLoopData('fx-riser-1', 'White Noise Riser', 'fx', 128, 4, ['riser', 'noise', 'build']),
  createLoopData('fx-downlifter-1', 'Downlifter', 'fx', 128, 4, ['downlifter', 'impact', 'transition']),
  createLoopData('fx-atmosphere-1', 'Dark Atmosphere', 'ambient', 100, 8, ['atmosphere', 'dark', 'texture'], 2, 'minor'),
  createLoopData('fx-texture-1', 'Granular Texture', 'ambient', 80, 8, ['texture', 'granular', 'evolving'], 0, 'minor'),
  createLoopData('ambient-drone-1', 'Ambient Drone', 'ambient', 60, 16, ['drone', 'ambient', 'meditative'], 0, 'major'),

  // =========================================================================
  // ETHNIC / WORLD
  // =========================================================================
  createLoopData('ethnic-sitar-1', 'Sitar Phrase', 'ethnic', 90, 4, ['sitar', 'indian', 'melodic'], 4, 'minor'),
  createLoopData('ethnic-koto-1', 'Koto Japanese', 'ethnic', 80, 4, ['koto', 'japanese', 'pentatonic'], 7, 'minor'),
  createLoopData('ethnic-kalimba-1', 'Kalimba Pattern', 'ethnic', 100, 2, ['kalimba', 'african', 'melodic'], 0, 'major'),
  createLoopData('ethnic-oud-1', 'Oud Middle Eastern', 'ethnic', 85, 4, ['oud', 'middle-eastern', 'modal'], 2, 'minor'),

  // =========================================================================
  // FULL MIX
  // =========================================================================
  createLoopData('fullmix-house-1', 'House Full Loop', 'full-mix', 124, 8, ['house', 'full-mix', 'complete'], 0, 'minor'),
  createLoopData('fullmix-hiphop-1', 'Hip-Hop Full Beat', 'full-mix', 90, 4, ['hip-hop', 'full-mix', 'complete'], 5, 'minor'),
  createLoopData('fullmix-dnb-1', 'DnB Full Loop', 'full-mix', 174, 4, ['dnb', 'full-mix', 'complete'], 7, 'minor'),
  createLoopData('fullmix-lofi-1', 'Lo-Fi Full Beat', 'full-mix', 75, 4, ['lofi', 'full-mix', 'chill'], 4, 'major'),
];

// =============================================================================
// PRESETS
// =============================================================================

/**
 * Factory presets with layer configurations
 */
export const LOOP_PLAYER_PRESETS: LoopPreset[] = [
  // =========================================================================
  // HOUSE
  // =========================================================================
  {
    id: 'house-groove-1',
    name: 'House Groove 1',
    category: 'House',
    tags: ['house', 'four-on-floor', 'electronic'],
    bpm: 124,
    keyRoot: 0,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Classic house groove with drums, bass, and synth stabs',
    layers: [
      { loopId: 'drums-house-1', enabled: true, volume: 0.9, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-house-1', enabled: true, volume: 0.8, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'synth-stab-1', enabled: true, volume: 0.6, pan: 0.2, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
    ],
  },
  {
    id: 'house-deep-1',
    name: 'Deep House Vibes',
    category: 'House',
    tags: ['house', 'deep', 'soulful'],
    bpm: 122,
    keyRoot: 5,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Deep house with rhodes and subtle percussion',
    layers: [
      { loopId: 'drums-house-2', enabled: true, volume: 0.85, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-house-1', enabled: true, volume: 0.75, pan: 0, pitch: 5, filterEnabled: true, filterType: 'lowpass', filterFreq: 800, filterQ: 0.5, direction: 'forward' },
      { loopId: 'keys-rhodes-1', enabled: true, volume: 0.7, pan: -0.2, pitch: 1, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'perc-shaker-1', enabled: true, volume: 0.4, pan: 0.4, pitch: 0, filterEnabled: true, filterType: 'highpass', filterFreq: 2000, filterQ: 0.5, direction: 'forward' },
    ],
  },

  // =========================================================================
  // TECHNO
  // =========================================================================
  {
    id: 'techno-drive-1',
    name: 'Techno Drive',
    category: 'Techno',
    tags: ['techno', 'driving', 'dark'],
    bpm: 130,
    keyRoot: 5,
    keyScale: 'minor',
    stretchAlgorithm: 'granular',
    description: 'Driving techno with heavy kick and dark atmosphere',
    layers: [
      { loopId: 'drums-techno-1', enabled: true, volume: 0.95, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-techno-1', enabled: true, volume: 0.85, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 400, filterQ: 1.0, direction: 'forward' },
      { loopId: 'synth-pad-2', enabled: true, volume: 0.4, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 2000, filterQ: 0.5, direction: 'forward' },
      { loopId: 'fx-atmosphere-1', enabled: true, volume: 0.3, pan: 0, pitch: -2, filterEnabled: true, filterType: 'highpass', filterFreq: 500, filterQ: 0.5, direction: 'forward' },
    ],
  },
  {
    id: 'techno-acid-1',
    name: 'Acid Techno',
    category: 'Techno',
    tags: ['techno', 'acid', '303'],
    bpm: 135,
    keyRoot: 5,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Acid techno with 303 bassline and industrial drums',
    layers: [
      { loopId: 'drums-techno-2', enabled: true, volume: 0.9, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'synth-acid-1', enabled: true, volume: 0.8, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'perc-electronic-1', enabled: true, volume: 0.5, pan: 0.3, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
    ],
  },

  // =========================================================================
  // DRUM & BASS
  // =========================================================================
  {
    id: 'dnb-roller-1',
    name: 'DnB Roller',
    category: 'Drum & Bass',
    tags: ['dnb', 'roller', 'deep'],
    bpm: 174,
    keyRoot: 7,
    keyScale: 'minor',
    stretchAlgorithm: 'granular',
    description: 'Deep rolling DnB with reese bass',
    layers: [
      { loopId: 'drums-dnb-1', enabled: true, volume: 0.9, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-dnb-1', enabled: true, volume: 0.85, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 600, filterQ: 0.8, direction: 'forward' },
      { loopId: 'synth-pad-2', enabled: true, volume: 0.35, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 3000, filterQ: 0.5, direction: 'forward' },
    ],
  },

  // =========================================================================
  // HIP-HOP
  // =========================================================================
  {
    id: 'hiphop-boom-bap-1',
    name: 'Boom Bap Classic',
    category: 'Hip-Hop',
    tags: ['hip-hop', 'boom-bap', 'classic'],
    bpm: 90,
    keyRoot: 5,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Classic boom bap with dusty drums and jazz samples',
    layers: [
      { loopId: 'drums-hiphop-1', enabled: true, volume: 0.9, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 8000, filterQ: 0.5, direction: 'forward' },
      { loopId: 'bass-hiphop-1', enabled: true, volume: 0.8, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'piano-jazz-1', enabled: true, volume: 0.5, pan: 0.1, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 6000, filterQ: 0.5, direction: 'forward' },
    ],
  },
  {
    id: 'hiphop-lofi-1',
    name: 'Lo-Fi Chill',
    category: 'Hip-Hop',
    tags: ['lofi', 'chill', 'study'],
    bpm: 75,
    keyRoot: 4,
    keyScale: 'major',
    stretchAlgorithm: 'elastique',
    description: 'Lo-fi hip-hop with vinyl crackle vibes',
    layers: [
      { loopId: 'drums-hiphop-1', enabled: true, volume: 0.7, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 5000, filterQ: 0.4, direction: 'forward' },
      { loopId: 'keys-rhodes-1', enabled: true, volume: 0.6, pan: -0.1, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 4000, filterQ: 0.4, direction: 'forward' },
      { loopId: 'bass-jazz-1', enabled: true, volume: 0.55, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 3000, filterQ: 0.4, direction: 'forward' },
    ],
  },

  // =========================================================================
  // FUNK / SOUL
  // =========================================================================
  {
    id: 'funk-groove-1',
    name: 'Funk Groove',
    category: 'Funk',
    tags: ['funk', 'groovy', 'bass'],
    bpm: 100,
    keyRoot: 4,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Funky groove with slap bass and wah guitar',
    layers: [
      { loopId: 'drums-funk-1', enabled: true, volume: 0.9, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-funk-1', enabled: true, volume: 0.85, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'guitar-funk-1', enabled: true, volume: 0.7, pan: 0.3, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'keys-clavinet-1', enabled: true, volume: 0.6, pan: -0.2, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
    ],
  },

  // =========================================================================
  // JAZZ
  // =========================================================================
  {
    id: 'jazz-swing-1',
    name: 'Jazz Swing',
    category: 'Jazz',
    tags: ['jazz', 'swing', 'trio'],
    bpm: 120,
    keyRoot: 2,
    keyScale: 'major',
    stretchAlgorithm: 'elastique',
    description: 'Jazz trio swing with walking bass',
    layers: [
      { loopId: 'drums-jazz-1', enabled: true, volume: 0.8, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-jazz-1', enabled: true, volume: 0.75, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'piano-jazz-1', enabled: true, volume: 0.7, pan: 0.1, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
    ],
  },

  // =========================================================================
  // LATIN
  // =========================================================================
  {
    id: 'latin-salsa-1',
    name: 'Salsa Groove',
    category: 'Latin',
    tags: ['latin', 'salsa', 'tropical'],
    bpm: 100,
    keyRoot: 0,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Hot salsa groove with tumbao bass',
    layers: [
      { loopId: 'drums-latin-1', enabled: true, volume: 0.85, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'perc-conga-1', enabled: true, volume: 0.75, pan: 0.2, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-latin-1', enabled: true, volume: 0.8, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'brass-stabs-1', enabled: true, volume: 0.6, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
    ],
  },

  // =========================================================================
  // AMBIENT
  // =========================================================================
  {
    id: 'ambient-space-1',
    name: 'Space Ambient',
    category: 'Ambient',
    tags: ['ambient', 'space', 'atmospheric'],
    bpm: 80,
    keyRoot: 0,
    keyScale: 'minor',
    stretchAlgorithm: 'paulstretch',
    description: 'Ethereal ambient soundscape',
    layers: [
      { loopId: 'synth-pad-1', enabled: true, volume: 0.7, pan: -0.3, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 4000, filterQ: 0.3, direction: 'forward' },
      { loopId: 'synth-pad-2', enabled: true, volume: 0.6, pan: 0.3, pitch: 7, filterEnabled: true, filterType: 'lowpass', filterFreq: 3000, filterQ: 0.3, direction: 'reverse' },
      { loopId: 'ambient-drone-1', enabled: true, volume: 0.5, pan: 0, pitch: -12, filterEnabled: true, filterType: 'lowpass', filterFreq: 2000, filterQ: 0.3, direction: 'forward' },
      { loopId: 'fx-atmosphere-1', enabled: true, volume: 0.4, pan: 0, pitch: 0, filterEnabled: true, filterType: 'bandpass', filterFreq: 1500, filterQ: 0.5, direction: 'pingpong' },
    ],
  },

  // =========================================================================
  // CINEMATIC
  // =========================================================================
  {
    id: 'cinematic-epic-1',
    name: 'Epic Cinematic',
    category: 'Cinematic',
    tags: ['cinematic', 'epic', 'orchestral'],
    bpm: 100,
    keyRoot: 2,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Epic cinematic buildup with strings and brass',
    layers: [
      { loopId: 'strings-legato-1', enabled: true, volume: 0.8, pan: -0.2, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'strings-tremolo-1', enabled: true, volume: 0.6, pan: 0.2, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'brass-section-1', enabled: true, volume: 0.7, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'fx-riser-1', enabled: true, volume: 0.5, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
    ],
  },

  // =========================================================================
  // WORLD
  // =========================================================================
  {
    id: 'world-afrobeat-1',
    name: 'Afrobeat Groove',
    category: 'World',
    tags: ['afrobeat', 'african', 'polyrhythmic'],
    bpm: 105,
    keyRoot: 0,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Polyrhythmic Afrobeat with Fela influence',
    layers: [
      { loopId: 'drums-afrobeat-1', enabled: true, volume: 0.9, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'perc-djembe-1', enabled: true, volume: 0.7, pan: 0.3, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'bass-funk-1', enabled: true, volume: 0.75, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'keys-organ-1', enabled: true, volume: 0.6, pan: -0.2, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
    ],
  },
  {
    id: 'world-indian-1',
    name: 'Indian Fusion',
    category: 'World',
    tags: ['indian', 'fusion', 'tabla'],
    bpm: 90,
    keyRoot: 4,
    keyScale: 'minor',
    stretchAlgorithm: 'elastique',
    description: 'Indian classical meets electronic',
    layers: [
      { loopId: 'perc-tabla-1', enabled: true, volume: 0.85, pan: 0, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'ethnic-sitar-1', enabled: true, volume: 0.7, pan: 0.2, pitch: 0, filterEnabled: false, filterType: 'lowpass', filterFreq: 20000, filterQ: 0.7, direction: 'forward' },
      { loopId: 'synth-pad-1', enabled: true, volume: 0.4, pan: 0, pitch: 0, filterEnabled: true, filterType: 'lowpass', filterFreq: 3000, filterQ: 0.5, direction: 'forward' },
    ],
  },
];

// =============================================================================
// LAYER FACTORY
// =============================================================================

/**
 * Create an empty loop layer
 */
export function createLoopLayer(index: number): LoopLayer {
  return {
    id: `layer-${index}`,
    index,
    loop: null,
    enabled: false,
    volume: 0.8,
    pan: 0,
    pitch: 0,
    fineTune: 0,
    startOffset: 0,
    endOffset: 0,
    direction: 'forward',
    muted: false,
    solo: false,
    sliceTriggerMode: 'beat',
    activeSlice: 0,
    slicePattern: [],
    patternStep: 0,
    filterEnabled: false,
    filterType: 'lowpass',
    filterFreq: 20000,
    filterQ: 0.707,
    filterEnvAmount: 0,
    reverbSend: 0,
    delaySend: 0,
    stretchRatio: 1,
    lockPitch: true,
    playheadSample: 0,
    playheadBeat: 0,
    isPlaying: false,
    triggerPending: false,
    fadeIn: 10,
    fadeOut: 10,
    crossfade: DEFAULT_CROSSFADE_MS,
    sliceMidiMap: new Map(),
    quantizeTrigger: true,
  };
}

// =============================================================================
// STATE FACTORY
// =============================================================================

/**
 * Create initial loop player state
 */
export function createLoopPlayerState(): LoopPlayerState {
  const layers: LoopLayer[] = [];
  for (let i = 0; i < MAX_LAYERS; i++) {
    layers.push(createLoopLayer(i));
  }

  // Build library from factory loops
  const library = new Map<string, LoopData>();
  for (const loop of FACTORY_LOOPS) {
    library.set(loop.id, loop);
  }

  return {
    isPlaying: false,
    tempo: 120,
    globalPitch: 0,
    masterVolume: 0.9,
    stretchAlgorithm: 'elastique',
    syncMode: 'tempo',
    layers,
    soloLayers: [],
    library,
    currentPreset: null,
    keyRoot: 0,
    keyScale: 'minor',
    autoMatchKey: true,
    autoMatchTempo: true,
    metronomeEnabled: false,
    currentBeat: 0,
    currentBar: 0,
    transportSample: 0,
    quantizeGrid: 0.25,
    globalCrossfade: DEFAULT_CROSSFADE_MS,
    masterFilterEnabled: false,
    masterFilterFreq: 20000,
    masterReverb: 0,
  };
}

// =============================================================================
// TIME STRETCH HELPERS
// =============================================================================

/**
 * Calculate stretch ratio to match target tempo
 */
export function calculateStretchRatio(originalTempo: number, targetTempo: number): number {
  if (originalTempo <= 0 || targetTempo <= 0) return 1;
  return originalTempo / targetTempo;
}

/**
 * Calculate pitch shift to match target key
 */
export function calculateKeyShift(originalRoot: number, targetRoot: number): number {
  let shift = targetRoot - originalRoot;
  // Keep within ±6 semitones
  while (shift > 6) shift -= 12;
  while (shift < -6) shift += 12;
  return shift;
}

// =============================================================================
// SLICE GENERATION
// =============================================================================

/**
 * Generate slices for a loop based on beats
 */
export function generateBeatSlices(loop: LoopData, slicesPerBeat: number = 1): LoopSlice[] {
  const slices: LoopSlice[] = [];
  const totalSlices = Math.floor(loop.lengthBeats * slicesPerBeat);
  const samplesPerSlice = Math.floor(loop.totalSamples / totalSlices);

  for (let i = 0; i < totalSlices; i++) {
    const startBeat = i / slicesPerBeat;
    const endBeat = (i + 1) / slicesPerBeat;
    const isDownbeat = i % (slicesPerBeat * loop.timeSignatureNumerator) === 0;
    const isBeat = i % slicesPerBeat === 0;

    slices.push({
      index: i,
      startSample: i * samplesPerSlice,
      endSample: (i + 1) * samplesPerSlice,
      startBeat,
      endBeat,
      transientStrength: isBeat ? 0.8 : 0.4,
      isBeat,
      isDownbeat,
      gain: 1.0,
      pitch: 0,
      reverse: false,
    });
  }

  return slices;
}

/**
 * Generate slices based on transient detection (simplified)
 */
export function generateTransientSlices(loop: LoopData, _threshold: number = 0.3): LoopSlice[] {
  // Simplified: just divide evenly
  // Real implementation would analyze audio for transients
  return generateBeatSlices(loop, 4);
}

// =============================================================================
// PLAYBACK HELPERS
// =============================================================================

/**
 * Get next playhead position based on direction
 */
export function getNextPlayheadPosition(
  currentSample: number,
  totalSamples: number,
  direction: LoopDirection,
  pingpongState: { ascending: boolean } = { ascending: true }
): { sample: number; looped: boolean; pingpongState: { ascending: boolean } } {
  switch (direction) {
    case 'forward': {
      const next = currentSample + 1;
      if (next >= totalSamples) {
        return { sample: 0, looped: true, pingpongState };
      }
      return { sample: next, looped: false, pingpongState };
    }

    case 'reverse': {
      const next = currentSample - 1;
      if (next < 0) {
        return { sample: totalSamples - 1, looped: true, pingpongState };
      }
      return { sample: next, looped: false, pingpongState };
    }

    case 'pingpong': {
      if (pingpongState.ascending) {
        const next = currentSample + 1;
        if (next >= totalSamples) {
          return {
            sample: totalSamples - 2,
            looped: false,
            pingpongState: { ascending: false },
          };
        }
        return { sample: next, looped: false, pingpongState };
      } else {
        const next = currentSample - 1;
        if (next < 0) {
          return {
            sample: 1,
            looped: true,
            pingpongState: { ascending: true },
          };
        }
        return { sample: next, looped: false, pingpongState };
      }
    }

    case 'random':
      return {
        sample: Math.floor(Math.random() * totalSamples),
        looped: false,
        pingpongState,
      };

    default:
      return { sample: currentSample + 1, looped: false, pingpongState };
  }
}

// =============================================================================
// INPUT PROCESSING
// =============================================================================

/**
 * Process loop player input
 */
export function processLoopPlayerInput(
  state: LoopPlayerState,
  input: LoopPlayerInput
): LoopPlayerResult {
  const outputs: LoopPlayerOutput[] = [];

  switch (input.type) {
    case 'play': {
      const newLayers = state.layers.map(layer => ({
        ...layer,
        isPlaying: layer.enabled && layer.loop !== null,
        playheadSample: layer.playheadSample,
        playheadBeat: layer.playheadBeat,
      }));

      return {
        state: { ...state, isPlaying: true, layers: newLayers },
        outputs,
      };
    }

    case 'stop': {
      const newLayers = state.layers.map(layer => ({
        ...layer,
        isPlaying: false,
        playheadSample: 0,
        playheadBeat: 0,
      }));

      return {
        state: {
          ...state,
          isPlaying: false,
          currentBeat: 0,
          currentBar: 0,
          transportSample: 0,
          layers: newLayers,
        },
        outputs,
      };
    }

    case 'pause': {
      const newLayers = state.layers.map(layer => ({
        ...layer,
        isPlaying: false,
      }));

      return {
        state: { ...state, isPlaying: false, layers: newLayers },
        outputs,
      };
    }

    case 'reset': {
      const newLayers = state.layers.map(layer => ({
        ...layer,
        playheadSample: 0,
        playheadBeat: 0,
      }));

      return {
        state: {
          ...state,
          currentBeat: 0,
          currentBar: 0,
          transportSample: 0,
          layers: newLayers,
        },
        outputs,
      };
    }

    case 'setTempo': {
      const tempo = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, input.bpm));
      return { state: { ...state, tempo }, outputs };
    }

    case 'setGlobalPitch': {
      const globalPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, input.semitones));
      return { state: { ...state, globalPitch }, outputs };
    }

    case 'setMasterVolume': {
      const masterVolume = Math.max(0, Math.min(1, input.volume));
      return { state: { ...state, masterVolume }, outputs };
    }

    case 'setStretchAlgorithm': {
      return { state: { ...state, stretchAlgorithm: input.algorithm }, outputs };
    }

    case 'setSyncMode': {
      return { state: { ...state, syncMode: input.mode }, outputs };
    }

    case 'loadLoop': {
      const { layerIndex, loopId } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        outputs.push({ type: 'error', message: `Invalid layer index: ${layerIndex}` });
        return { state, outputs };
      }

      const loop = state.library.get(loopId);
      if (!loop) {
        outputs.push({ type: 'error', message: `Loop not found: ${loopId}` });
        return { state, outputs };
      }

      // Calculate pitch shift if auto-match enabled
      let pitchShift = 0;
      if (state.autoMatchKey && loop.keyInfo) {
        pitchShift = calculateKeyShift(loop.keyInfo.root, state.keyRoot);
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        outputs.push({ type: 'error', message: `Layer not found: ${layerIndex}` });
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        loop,
        enabled: true,
        pitch: pitchShift,
        playheadSample: 0,
        playheadBeat: 0,
        slicePattern: loop.slices.map(s => s.index),
        stretchRatio: state.autoMatchTempo
          ? calculateStretchRatio(loop.originalTempo, state.tempo)
          : 1,
      };

      outputs.push({ type: 'loopLoaded', layerIndex, loopId });

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'unloadLoop': {
      const { layerIndex } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        loop: null,
        enabled: false,
        isPlaying: false,
        playheadSample: 0,
        playheadBeat: 0,
      };

      outputs.push({ type: 'loopUnloaded', layerIndex });

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setLayerVolume': {
      const { layerIndex, volume } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        volume: Math.max(0, Math.min(1, volume)),
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setLayerPan': {
      const { layerIndex, pan } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        pan: Math.max(-1, Math.min(1, pan)),
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setLayerPitch': {
      const { layerIndex, semitones } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        pitch: Math.max(MIN_PITCH, Math.min(MAX_PITCH, semitones)),
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setLayerDirection': {
      const { layerIndex, direction } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        direction,
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'muteLayer': {
      const { layerIndex } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        muted: !existingLayer.muted,
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'soloLayer': {
      const { layerIndex } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const layer = state.layers[layerIndex];
      if (!layer) {
        return { state, outputs };
      }
      const layerId = layer.id;
      const soloLayers = state.soloLayers.includes(layerId)
        ? state.soloLayers.filter(id => id !== layerId)
        : [...state.soloLayers, layerId];

      return { state: { ...state, soloLayers }, outputs };
    }

    case 'enableLayer': {
      const { layerIndex, enabled } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        enabled,
        isPlaying: enabled && state.isPlaying && existingLayer.loop !== null,
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setLayerFilter': {
      const { layerIndex, config } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        filterEnabled: config.enabled ?? existingLayer.filterEnabled,
        filterType: config.type ?? existingLayer.filterType,
        filterFreq: config.freq ?? existingLayer.filterFreq,
        filterQ: config.q ?? existingLayer.filterQ,
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setLayerSends': {
      const { layerIndex, reverb, delay } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        reverbSend: reverb ?? existingLayer.reverbSend,
        delaySend: delay ?? existingLayer.delaySend,
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'triggerSlice': {
      const { layerIndex, sliceIndex } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const layer = state.layers[layerIndex];
      if (!layer || !layer.loop || sliceIndex >= layer.loop.slices.length) {
        return { state, outputs };
      }

      const slice = layer.loop.slices[sliceIndex];
      if (!slice) {
        return { state, outputs };
      }
      const newLayers = [...state.layers];
      newLayers[layerIndex] = {
        ...layer,
        activeSlice: sliceIndex,
        playheadSample: slice.startSample,
        isPlaying: true,
      };

      outputs.push({ type: 'sliceTriggered', layerIndex, sliceIndex });

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setSlicePattern': {
      const { layerIndex, pattern } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        slicePattern: pattern,
        patternStep: 0,
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'setSliceTriggerMode': {
      const { layerIndex, mode } = input;
      if (layerIndex < 0 || layerIndex >= MAX_LAYERS) {
        return { state, outputs };
      }

      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        sliceTriggerMode: mode,
      };

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'loadPreset': {
      const preset = LOOP_PLAYER_PRESETS.find(p => p.id === input.presetId);
      if (!preset) {
        outputs.push({ type: 'error', message: `Preset not found: ${input.presetId}` });
        return { state, outputs };
      }

      let newState = { ...state };

      // Clear all layers first
      const newLayers = state.layers.map(l => createLoopLayer(l.index));

      // Apply preset layers
      for (let i = 0; i < preset.layers.length && i < MAX_LAYERS; i++) {
        const presetLayer = preset.layers[i];
        if (!presetLayer) continue;
        const loop = state.library.get(presetLayer.loopId);
        const existingLayer = newLayers[i];

        if (loop && existingLayer) {
          newLayers[i] = {
            ...existingLayer,
            loop,
            enabled: presetLayer.enabled,
            volume: presetLayer.volume,
            pan: presetLayer.pan,
            pitch: presetLayer.pitch,
            filterEnabled: presetLayer.filterEnabled,
            filterType: presetLayer.filterType,
            filterFreq: presetLayer.filterFreq,
            filterQ: presetLayer.filterQ,
            direction: presetLayer.direction,
            stretchRatio: calculateStretchRatio(loop.originalTempo, preset.bpm),
          };
        }
      }

      newState = {
        ...newState,
        layers: newLayers,
        tempo: preset.bpm,
        keyRoot: preset.keyRoot,
        keyScale: preset.keyScale,
        stretchAlgorithm: preset.stretchAlgorithm,
        currentPreset: preset.id,
      };

      outputs.push({ type: 'presetLoaded', presetId: preset.id });

      return { state: newState, outputs };
    }

    case 'savePreset': {
      // Would save to user presets
      const presetId = `user-${Date.now()}`;
      outputs.push({ type: 'presetSaved', presetId });
      return { state: { ...state, currentPreset: presetId }, outputs };
    }

    case 'setKeyRoot': {
      const keyRoot = ((input.root % 12) + 12) % 12;
      return { state: { ...state, keyRoot }, outputs };
    }

    case 'setKeyScale': {
      return { state: { ...state, keyScale: input.scale }, outputs };
    }

    case 'setAutoMatchKey': {
      return { state: { ...state, autoMatchKey: input.enabled }, outputs };
    }

    case 'setAutoMatchTempo': {
      return { state: { ...state, autoMatchTempo: input.enabled }, outputs };
    }

    case 'setQuantizeGrid': {
      const quantizeGrid = Math.max(0, Math.min(4, input.beats));
      return { state: { ...state, quantizeGrid }, outputs };
    }

    case 'tick': {
      if (!state.isPlaying) {
        return { state, outputs };
      }

      const { beat } = input;
      const bar = Math.floor(beat / (state.layers[0]?.loop?.timeSignatureNumerator ?? 4));

      // Check for beat sync
      if (Math.floor(beat) !== Math.floor(state.currentBeat)) {
        outputs.push({ type: 'beatSync', beat: Math.floor(beat), bar });
      }

      // Process each layer
      const newLayers = state.layers.map((layer, layerIndex) => {
        if (!layer.loop || !layer.isPlaying || layer.muted) {
          return layer;
        }

        // Check solo
        if (state.soloLayers.length > 0 && !state.soloLayers.includes(layer.id)) {
          return layer;
        }

        // Advance playhead
        const result = getNextPlayheadPosition(
          layer.playheadSample,
          layer.loop.totalSamples,
          layer.direction
        );

        if (result.looped) {
          outputs.push({ type: 'loopEnd', layerIndex, loopId: layer.loop.id });
          outputs.push({ type: 'loopStart', layerIndex, loopId: layer.loop.id });
        }

        return {
          ...layer,
          playheadSample: result.sample,
          playheadBeat: (result.sample / layer.loop.totalSamples) * layer.loop.lengthBeats,
        };
      });

      return {
        state: {
          ...state,
          currentBeat: beat,
          currentBar: bar,
          layers: newLayers,
        },
        outputs,
      };
    }

    case 'midiNoteOn': {
      const { note, velocity } = input;

      // Check if any layer has this note mapped to a slice
      const newLayers = [...state.layers];
      for (let i = 0; i < newLayers.length; i++) {
        const layer = newLayers[i];
        if (!layer) continue;
        if (layer.sliceMidiMap.has(note) && layer.loop) {
          const sliceIndex = layer.sliceMidiMap.get(note)!;
          const slice = layer.loop.slices[sliceIndex];
          if (slice) {
            newLayers[i] = {
              ...layer,
              activeSlice: sliceIndex,
              playheadSample: slice.startSample,
              isPlaying: true,
              volume: velocity / 127,
            };
            outputs.push({ type: 'sliceTriggered', layerIndex: i, sliceIndex });
          }
        }
      }

      return { state: { ...state, layers: newLayers }, outputs };
    }

    case 'midiNoteOff': {
      // Could stop slice playback if using one-shot mode
      return { state, outputs };
    }

    case 'midiCC': {
      // Map common CCs
      let newState = state;
      switch (input.controller) {
        case 1: // Mod wheel → master filter
          newState = {
            ...state,
            masterFilterFreq: 100 + (input.value / 127) * 19900,
          };
          break;
        case 7: // Volume
          newState = {
            ...state,
            masterVolume: input.value / 127,
          };
          break;
      }
      return { state: newState, outputs };
    }

    case 'addLoopToLibrary': {
      const newLibrary = new Map(state.library);
      newLibrary.set(input.loop.id, input.loop);
      return { state: { ...state, library: newLibrary }, outputs };
    }

    case 'removeLoopFromLibrary': {
      const newLibrary = new Map(state.library);
      newLibrary.delete(input.loopId);
      return { state: { ...state, library: newLibrary }, outputs };
    }

    case 'detectTempo': {
      const { layerIndex } = input;
      const layer = state.layers[layerIndex];
      if (!layer?.loop) {
        return { state, outputs };
      }

      // Simplified tempo detection (real impl would analyze audio)
      const detectedTempo = layer.loop.originalTempo;
      outputs.push({
        type: 'tempoDetected',
        layerIndex,
        tempo: detectedTempo,
        confidence: 0.9,
      });

      return { state, outputs };
    }

    case 'detectKey': {
      const { layerIndex } = input;
      const layer = state.layers[layerIndex];
      if (!layer?.loop) {
        return { state, outputs };
      }

      // Simplified key detection (real impl would analyze audio)
      const keyInfo: KeyInfo = layer.loop.keyInfo ?? {
        root: 0,
        scale: 'minor',
        confidence: 0.5,
      };

      outputs.push({ type: 'keyDetected', layerIndex, keyInfo });

      return { state, outputs };
    }

    case 'sliceLoop': {
      const { layerIndex, sliceCount } = input;
      const layer = state.layers[layerIndex];
      if (!layer?.loop) {
        return { state, outputs };
      }

      // Generate slices
      const slicesPerBeat = sliceCount / layer.loop.lengthBeats;
      const slices = generateBeatSlices(layer.loop, slicesPerBeat);

      // Update loop with slices
      const newLoop = { ...layer.loop, slices };
      const newLayers = [...state.layers];
      const existingLayer = newLayers[layerIndex];
      if (!existingLayer) {
        return { state, outputs };
      }
      newLayers[layerIndex] = {
        ...existingLayer,
        loop: newLoop,
        slicePattern: slices.map(s => s.index),
      };

      // Also update library
      const newLibrary = new Map(state.library);
      newLibrary.set(newLoop.id, newLoop);

      outputs.push({ type: 'slicesGenerated', layerIndex, sliceCount: slices.length });

      return { state: { ...state, layers: newLayers, library: newLibrary }, outputs };
    }

    case 'importFromFreesound': {
      // Would fetch from Freesound API
      outputs.push({
        type: 'error',
        message: 'Freesound import not yet implemented',
      });
      return { state, outputs };
    }

    default:
      return { state, outputs };
  }
}

// =============================================================================
// CARD IMPLEMENTATION
// =============================================================================

/**
 * Card metadata
 */
export const LOOP_PLAYER_CARD_META = {
  id: 'loop-player',
  name: 'Loop Player',
  category: 'generator' as const,
  description: 'Multi-layer loop player with time-stretching and slicing',

  inputPorts: [
    { id: 'transport', name: 'Transport', type: 'transport' as const },
    { id: 'midi', name: 'MIDI In', type: 'midi' as const },
    { id: 'tempo', name: 'Tempo', type: 'number' as const },
  ],

  outputPorts: [
    { id: 'audio-l', name: 'Audio L', type: 'audio' as const },
    { id: 'audio-r', name: 'Audio R', type: 'audio' as const },
    { id: 'sync', name: 'Sync', type: 'trigger' as const },
  ],

  parameters: [
    { id: 'tempo', name: 'Tempo', type: 'float' as const, min: 20, max: 300, default: 120 },
    { id: 'globalPitch', name: 'Global Pitch', type: 'int' as const, min: -24, max: 24, default: 0 },
    { id: 'masterVolume', name: 'Master Volume', type: 'float' as const, min: 0, max: 1, default: 0.9 },
    { id: 'stretchAlgorithm', name: 'Stretch Algorithm', type: 'enum' as const, values: ['granular', 'phaseVocoder', 'elastique', 'paulstretch', 'resample'], default: 'elastique' },
    { id: 'autoMatchKey', name: 'Auto-Match Key', type: 'bool' as const, default: true },
    { id: 'autoMatchTempo', name: 'Auto-Match Tempo', type: 'bool' as const, default: true },
    { id: 'keyRoot', name: 'Key Root', type: 'int' as const, min: 0, max: 11, default: 0 },
    { id: 'keyScale', name: 'Key Scale', type: 'enum' as const, values: ['major', 'minor'], default: 'minor' },
    { id: 'quantizeGrid', name: 'Quantize Grid', type: 'float' as const, min: 0, max: 4, default: 0.25 },
  ],
};

/**
 * Create loop player card instance
 */
export function createLoopPlayerCard() {
  let state = createLoopPlayerState();

  return {
    meta: LOOP_PLAYER_CARD_META,

    process(input: LoopPlayerInput): LoopPlayerOutput[] {
      const result = processLoopPlayerInput(state, input);
      state = result.state;
      return result.outputs;
    },

    getState(): LoopPlayerState {
      return state;
    },

    reset(): void {
      state = createLoopPlayerState();
    },

    loadPreset(presetId: string): LoopPlayerOutput[] {
      return this.process({ type: 'loadPreset', presetId });
    },

    getPresets(): LoopPreset[] {
      return LOOP_PLAYER_PRESETS;
    },

    getFactoryLoops(): LoopData[] {
      return FACTORY_LOOPS;
    },

    getLoopsByCategory(category: LoopCategory): LoopData[] {
      return FACTORY_LOOPS.filter(l => l.category === category);
    },

    searchLoops(query: string): LoopData[] {
      const q = query.toLowerCase();
      return FACTORY_LOOPS.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q)) ||
        l.category.toLowerCase().includes(q)
      );
    },
  };
}
