/**
 * CardScript Examples Library
 * 
 * A comprehensive collection of CardScript examples organized by category.
 * Each example includes source code, description, and metadata.
 * 
 * @module cardscript/examples
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Example category.
 */
export type ExampleCategory =
  | 'basics'
  | 'audio'
  | 'midi'
  | 'synthesis'
  | 'effects'
  | 'composition'
  | 'utilities'
  | 'advanced';

/**
 * Example difficulty level.
 */
export type ExampleDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Example metadata.
 */
export interface ExampleMeta {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Brief description */
  description: string;
  /** Category */
  category: ExampleCategory;
  /** Difficulty level */
  difficulty: ExampleDifficulty;
  /** Tags for search */
  tags: string[];
  /** Related example IDs */
  related?: string[];
  /** Author (optional) */
  author?: string;
  /** Version added */
  since?: string;
}

/**
 * Complete example with source code.
 */
export interface Example extends ExampleMeta {
  /** Source code */
  source: string;
  /** Expected output (if applicable) */
  expectedOutput?: string;
  /** Usage notes */
  notes?: string;
}

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

const HELLO_WORLD: Example = {
  id: 'basics-hello-world',
  title: 'Hello World',
  description: 'A minimal CardScript card that outputs a greeting',
  category: 'basics',
  difficulty: 'beginner',
  tags: ['introduction', 'first-card', 'output'],
  source: `/**
 * The simplest possible card - outputs a greeting message.
 */
card HelloWorld {
  outputs {
    message: String
  }

  process() {
    emit message("Hello, CardScript!")
  }
}
`,
};

const PASS_THROUGH: Example = {
  id: 'basics-passthrough',
  title: 'Pass-Through Card',
  description: 'A card that passes its input directly to output',
  category: 'basics',
  difficulty: 'beginner',
  tags: ['input', 'output', 'passthrough'],
  source: `/**
 * Passes input directly to output without modification.
 * Useful as a base for understanding signal flow.
 */
card PassThrough {
  inputs {
    signal: Audio
  }
  
  outputs {
    out: Audio
  }

  process(ctx) {
    emit out(ctx.input.signal)
  }
}
`,
};

const COUNTER: Example = {
  id: 'basics-counter',
  title: 'Counter Card',
  description: 'Demonstrates stateful cards with a simple counter',
  category: 'basics',
  difficulty: 'beginner',
  tags: ['state', 'counter', 'stateful'],
  source: `/**
 * A stateful card that counts process calls.
 */
card Counter {
  outputs {
    count: Number
  }
  
  state {
    value: Number = 0
  }

  process() {
    state.value = state.value + 1
    emit count(state.value)
  }
}
`,
};

const PARAMETERS: Example = {
  id: 'basics-parameters',
  title: 'Parameters Example',
  description: 'Shows how to use card parameters for configuration',
  category: 'basics',
  difficulty: 'beginner',
  tags: ['parameters', 'params', 'configuration'],
  source: `/**
 * Demonstrates parameter usage with constraints.
 */
card Multiplier {
  inputs {
    value: Number
  }
  
  outputs {
    result: Number
  }
  
  params {
    factor: Number = 2.0 @min(0) @max(10)
    offset: Number = 0.0
  }

  process(ctx) {
    const scaled = ctx.input.value * params.factor
    emit result(scaled + params.offset)
  }
}
`,
};

// ============================================================================
// AUDIO EXAMPLES
// ============================================================================

const GAIN: Example = {
  id: 'audio-gain',
  title: 'Gain Control',
  description: 'Simple audio gain/volume control',
  category: 'audio',
  difficulty: 'beginner',
  tags: ['gain', 'volume', 'amplitude'],
  source: `/**
 * Adjusts audio signal amplitude.
 * 
 * @param gain Multiplication factor (0 = silent, 1 = unity, >1 = boost)
 */
card Gain {
  inputs {
    audio: Audio
  }
  
  outputs {
    out: Audio
  }
  
  params {
    gain: Number = 1.0 @min(0) @max(4) @label("Gain")
  }

  process(ctx) {
    emit out(ctx.input.audio * params.gain)
  }
}
`,
};

const STEREO_PAN: Example = {
  id: 'audio-stereo-pan',
  title: 'Stereo Panner',
  description: 'Pans mono signal to stereo field',
  category: 'audio',
  difficulty: 'intermediate',
  tags: ['pan', 'stereo', 'positioning'],
  source: `/**
 * Pans a mono signal across the stereo field.
 * Uses constant power panning for smooth transitions.
 * 
 * @param pan Position (-1 = left, 0 = center, 1 = right)
 */
card StereoPan {
  inputs {
    mono: Audio
  }
  
  outputs {
    left: Audio
    right: Audio
  }
  
  params {
    pan: Number = 0.0 @min(-1) @max(1) @label("Pan")
  }

  process(ctx) {
    // Constant power panning
    const angle = (params.pan + 1) * 0.25 * Math.PI
    const leftGain = Math.cos(angle)
    const rightGain = Math.sin(angle)
    
    emit left(ctx.input.mono * leftGain)
    emit right(ctx.input.mono * rightGain)
  }
}
`,
};

const MIXER: Example = {
  id: 'audio-mixer',
  title: 'Audio Mixer',
  description: 'Mixes multiple audio inputs with individual gains',
  category: 'audio',
  difficulty: 'intermediate',
  tags: ['mixer', 'mixing', 'summing'],
  source: `/**
 * Mixes four audio inputs with individual gain controls.
 */
card Mixer4 {
  inputs {
    ch1: Audio
    ch2: Audio
    ch3: Audio
    ch4: Audio
  }
  
  outputs {
    mix: Audio
  }
  
  params {
    gain1: Number = 1.0 @min(0) @max(2) @label("Ch 1")
    gain2: Number = 1.0 @min(0) @max(2) @label("Ch 2")
    gain3: Number = 1.0 @min(0) @max(2) @label("Ch 3")
    gain4: Number = 1.0 @min(0) @max(2) @label("Ch 4")
    master: Number = 1.0 @min(0) @max(2) @label("Master")
  }

  process(ctx) {
    const sum = (
      ctx.input.ch1 * params.gain1 +
      ctx.input.ch2 * params.gain2 +
      ctx.input.ch3 * params.gain3 +
      ctx.input.ch4 * params.gain4
    )
    emit mix(sum * params.master)
  }
}
`,
};

// ============================================================================
// MIDI EXAMPLES
// ============================================================================

const MIDI_TRANSPOSE: Example = {
  id: 'midi-transpose',
  title: 'MIDI Transposer',
  description: 'Transposes MIDI notes by semitones',
  category: 'midi',
  difficulty: 'beginner',
  tags: ['transpose', 'pitch', 'semitones'],
  source: `/**
 * Transposes incoming MIDI notes by a specified interval.
 * 
 * @param semitones Number of semitones to transpose (+/- 36)
 */
card Transpose {
  inputs {
    midi: Midi
  }
  
  outputs {
    out: Midi
  }
  
  params {
    semitones: Number = 0 @min(-36) @max(36) @step(1)
  }

  on noteOn(note, velocity) {
    const transposed = note + params.semitones
    if (transposed >= 0 && transposed <= 127) {
      emit out.noteOn(transposed, velocity)
    }
  }
  
  on noteOff(note) {
    const transposed = note + params.semitones
    if (transposed >= 0 && transposed <= 127) {
      emit out.noteOff(transposed)
    }
  }
}
`,
};

const MIDI_VELOCITY: Example = {
  id: 'midi-velocity',
  title: 'Velocity Scaler',
  description: 'Scales MIDI note velocities',
  category: 'midi',
  difficulty: 'beginner',
  tags: ['velocity', 'dynamics', 'expression'],
  source: `/**
 * Scales MIDI velocity values with curve control.
 * 
 * @param scale Velocity multiplier
 * @param curve Velocity curve (0.5 = linear, <0.5 = compress, >0.5 = expand)
 */
card VelocityScale {
  inputs {
    midi: Midi
  }
  
  outputs {
    out: Midi
  }
  
  params {
    scale: Number = 1.0 @min(0) @max(2)
    curve: Number = 0.5 @min(0) @max(1)
    min: Number = 1 @min(0) @max(127)
    max: Number = 127 @min(0) @max(127)
  }

  on noteOn(note, velocity) {
    // Normalize to 0-1
    let v = velocity / 127.0
    
    // Apply curve
    const gamma = 1.0 / (params.curve * 2.0 + 0.1)
    v = Math.pow(v, gamma)
    
    // Scale and clamp
    v = v * params.scale
    const output = Math.floor(clamp(v * 127, params.min, params.max))
    
    emit out.noteOn(note, output)
  }
  
  on noteOff(note) {
    emit out.noteOff(note)
  }
}
`,
};

const ARPEGGIATOR: Example = {
  id: 'midi-arpeggiator',
  title: 'Arpeggiator',
  description: 'Creates arpeggios from held chords',
  category: 'midi',
  difficulty: 'advanced',
  tags: ['arpeggio', 'pattern', 'generator'],
  related: ['midi-transpose'],
  source: `/**
 * Generates arpeggios from held notes.
 * 
 * @param rate Arpeggio rate in beats
 * @param pattern Arpeggio pattern (up, down, updown, random)
 * @param octaves Number of octaves to span
 */
card Arpeggiator {
  inputs {
    midi: Midi
    clock: Event<Beat>
  }
  
  outputs {
    out: Midi
  }
  
  params {
    rate: Number = 0.25 @min(0.0625) @max(1)
    pattern: String = "up"
    octaves: Number = 1 @min(1) @max(4)
    gate: Number = 0.8 @min(0.1) @max(1)
  }
  
  state {
    heldNotes: Number[] = []
    currentIndex: Number = 0
    direction: Number = 1
    lastNote: Number = -1
    accumulator: Number = 0
  }

  on noteOn(note, velocity) {
    state.heldNotes.push(note)
    state.heldNotes.sort((a, b) => a - b)
  }
  
  on noteOff(note) {
    state.heldNotes = state.heldNotes.filter(n => n !== note)
    if (state.heldNotes.length === 0) {
      state.currentIndex = 0
      state.direction = 1
    }
  }
  
  on beat(position) {
    state.accumulator += 1.0 / 24  // Assuming 24 PPQN
    
    if (state.accumulator >= params.rate) {
      state.accumulator = 0
      
      if (state.heldNotes.length > 0) {
        // Turn off previous note
        if (state.lastNote >= 0) {
          emit out.noteOff(state.lastNote)
        }
        
        // Calculate expanded note list with octaves
        const expanded = []
        for (let oct = 0; oct < params.octaves; oct++) {
          for (const note of state.heldNotes) {
            expanded.push(note + oct * 12)
          }
        }
        
        // Get next note based on pattern
        let note = expanded[state.currentIndex % expanded.length]
        
        if (params.pattern === "down") {
          note = expanded[expanded.length - 1 - (state.currentIndex % expanded.length)]
        } else if (params.pattern === "random") {
          note = expanded[Math.floor(Math.random() * expanded.length)]
        } else if (params.pattern === "updown") {
          if (state.direction === 1 && state.currentIndex >= expanded.length - 1) {
            state.direction = -1
          } else if (state.direction === -1 && state.currentIndex <= 0) {
            state.direction = 1
          }
        }
        
        emit out.noteOn(note, 100)
        state.lastNote = note
        state.currentIndex += state.direction
      }
    }
  }
}
`,
};

// ============================================================================
// SYNTHESIS EXAMPLES
// ============================================================================

const OSCILLATOR: Example = {
  id: 'synth-oscillator',
  title: 'Basic Oscillator',
  description: 'Simple oscillator with multiple waveforms',
  category: 'synthesis',
  difficulty: 'intermediate',
  tags: ['oscillator', 'waveform', 'generator'],
  source: `/**
 * Basic oscillator with selectable waveform.
 * 
 * @param frequency Oscillator frequency in Hz
 * @param waveform Waveform type: sine, saw, square, triangle
 */
card Oscillator {
  outputs {
    audio: Audio
  }
  
  params {
    frequency: Number = 440.0 @min(20) @max(20000) @log
    waveform: String = "sine"
    amplitude: Number = 0.5 @min(0) @max(1)
  }
  
  state {
    phase: Number = 0.0
  }

  process(ctx) {
    const sampleRate = ctx.sampleRate
    const phaseIncrement = params.frequency / sampleRate
    
    let sample = 0.0
    
    if (params.waveform === "sine") {
      sample = Math.sin(state.phase * 2 * Math.PI)
    } else if (params.waveform === "saw") {
      sample = 2.0 * (state.phase - Math.floor(state.phase + 0.5))
    } else if (params.waveform === "square") {
      sample = state.phase < 0.5 ? 1.0 : -1.0
    } else if (params.waveform === "triangle") {
      sample = 4.0 * Math.abs(state.phase - 0.5) - 1.0
    }
    
    state.phase = (state.phase + phaseIncrement) % 1.0
    
    emit audio(sample * params.amplitude)
  }
}
`,
};

const ENVELOPE: Example = {
  id: 'synth-envelope',
  title: 'ADSR Envelope',
  description: 'Attack-Decay-Sustain-Release envelope generator',
  category: 'synthesis',
  difficulty: 'intermediate',
  tags: ['envelope', 'adsr', 'modulation'],
  source: `/**
 * Standard ADSR envelope generator.
 */
card ADSREnvelope {
  inputs {
    gate: Event<Boolean>
  }
  
  outputs {
    value: Number
  }
  
  params {
    attack: Number = 0.01 @min(0.001) @max(5) @log @label("Attack")
    decay: Number = 0.1 @min(0.001) @max(5) @log @label("Decay")
    sustain: Number = 0.7 @min(0) @max(1) @label("Sustain")
    release: Number = 0.3 @min(0.001) @max(10) @log @label("Release")
  }
  
  state {
    stage: String = "idle"
    level: Number = 0.0
    startLevel: Number = 0.0
    time: Number = 0.0
  }

  on gate(isOn) {
    if (isOn) {
      state.stage = "attack"
      state.startLevel = state.level
      state.time = 0.0
    } else {
      state.stage = "release"
      state.startLevel = state.level
      state.time = 0.0
    }
  }

  process(ctx) {
    const dt = 1.0 / ctx.sampleRate
    state.time += dt
    
    if (state.stage === "attack") {
      state.level = state.startLevel + (1.0 - state.startLevel) * (state.time / params.attack)
      if (state.time >= params.attack) {
        state.stage = "decay"
        state.time = 0.0
      }
    } else if (state.stage === "decay") {
      state.level = 1.0 - (1.0 - params.sustain) * (state.time / params.decay)
      if (state.time >= params.decay) {
        state.stage = "sustain"
        state.level = params.sustain
      }
    } else if (state.stage === "sustain") {
      state.level = params.sustain
    } else if (state.stage === "release") {
      state.level = state.startLevel * (1.0 - state.time / params.release)
      if (state.time >= params.release) {
        state.stage = "idle"
        state.level = 0.0
      }
    }
    
    emit value(state.level)
  }
}
`,
};

const LFO: Example = {
  id: 'synth-lfo',
  title: 'LFO',
  description: 'Low-frequency oscillator for modulation',
  category: 'synthesis',
  difficulty: 'beginner',
  tags: ['lfo', 'modulation', 'oscillator'],
  source: `/**
 * Low-frequency oscillator for modulation.
 */
card LFO {
  outputs {
    value: Number     // Bipolar output (-1 to +1)
    unipolar: Number  // Unipolar output (0 to +1)
  }
  
  params {
    rate: Number = 1.0 @min(0.01) @max(20) @log @label("Rate Hz")
    waveform: String = "sine"
    phase: Number = 0.0 @min(0) @max(1) @label("Phase")
  }
  
  state {
    currentPhase: Number = 0.0
  }

  process(ctx) {
    const phaseIncrement = params.rate / ctx.sampleRate
    const p = (state.currentPhase + params.phase) % 1.0
    
    let sample = 0.0
    
    if (params.waveform === "sine") {
      sample = Math.sin(p * 2 * Math.PI)
    } else if (params.waveform === "triangle") {
      sample = 4.0 * Math.abs(p - 0.5) - 1.0
    } else if (params.waveform === "saw") {
      sample = 2.0 * p - 1.0
    } else if (params.waveform === "square") {
      sample = p < 0.5 ? 1.0 : -1.0
    } else if (params.waveform === "random") {
      // Sample & hold
      if (state.currentPhase + phaseIncrement >= 1.0) {
        sample = Math.random() * 2 - 1
      }
    }
    
    state.currentPhase = (state.currentPhase + phaseIncrement) % 1.0
    
    emit value(sample)
    emit unipolar((sample + 1.0) * 0.5)
  }
}
`,
};

// ============================================================================
// EFFECTS EXAMPLES
// ============================================================================

const DELAY: Example = {
  id: 'effects-delay',
  title: 'Delay Effect',
  description: 'Simple delay effect with feedback',
  category: 'effects',
  difficulty: 'intermediate',
  tags: ['delay', 'echo', 'time'],
  source: `/**
 * Simple delay effect with feedback and mix controls.
 */
card Delay {
  inputs {
    audio: Audio
  }
  
  outputs {
    out: Audio
  }
  
  params {
    time: Number = 0.25 @min(0.001) @max(2.0) @label("Time s")
    feedback: Number = 0.4 @min(0) @max(0.95) @label("Feedback")
    mix: Number = 0.5 @min(0) @max(1) @label("Mix")
  }
  
  state {
    buffer: Number[] = []
    writeIndex: Number = 0
  }

  process(ctx) {
    const delaySamples = Math.floor(params.time * ctx.sampleRate)
    
    // Ensure buffer is correct size
    while (state.buffer.length < delaySamples) {
      state.buffer.push(0)
    }
    
    // Read delayed sample
    const readIndex = (state.writeIndex - delaySamples + state.buffer.length) % state.buffer.length
    const delayed = state.buffer[readIndex]
    
    // Write new sample with feedback
    state.buffer[state.writeIndex] = ctx.input.audio + delayed * params.feedback
    state.writeIndex = (state.writeIndex + 1) % state.buffer.length
    
    // Mix dry/wet
    const output = ctx.input.audio * (1 - params.mix) + delayed * params.mix
    
    emit out(output)
  }
}
`,
};

const FILTER: Example = {
  id: 'effects-filter',
  title: 'Lowpass Filter',
  description: 'Resonant lowpass filter (2-pole SVF)',
  category: 'effects',
  difficulty: 'advanced',
  tags: ['filter', 'lowpass', 'resonance'],
  source: `/**
 * State-variable lowpass filter with resonance.
 */
card LowpassFilter {
  inputs {
    audio: Audio
  }
  
  outputs {
    out: Audio
  }
  
  params {
    cutoff: Number = 1000 @min(20) @max(20000) @log @label("Cutoff Hz")
    resonance: Number = 0.5 @min(0) @max(1) @label("Resonance")
  }
  
  state {
    low: Number = 0
    band: Number = 0
  }

  process(ctx) {
    // SVF coefficients
    const f = 2 * Math.sin(Math.PI * params.cutoff / ctx.sampleRate)
    const q = 1 - params.resonance * 0.99
    
    // Process
    const input = ctx.input.audio
    const high = input - state.low - q * state.band
    state.band = state.band + f * high
    state.low = state.low + f * state.band
    
    emit out(state.low)
  }
}
`,
};

const REVERB: Example = {
  id: 'effects-reverb',
  title: 'Simple Reverb',
  description: 'Basic reverb using multiple delays',
  category: 'effects',
  difficulty: 'advanced',
  tags: ['reverb', 'space', 'room'],
  source: `/**
 * Simple reverb using parallel comb filters and allpass filters.
 */
card SimpleReverb {
  inputs {
    audio: Audio
  }
  
  outputs {
    out: Audio
  }
  
  params {
    roomSize: Number = 0.5 @min(0) @max(1) @label("Room Size")
    damping: Number = 0.5 @min(0) @max(1) @label("Damping")
    mix: Number = 0.3 @min(0) @max(1) @label("Mix")
  }
  
  state {
    combBuffers: Number[][] = [[],[],[],[]]
    combIndices: Number[] = [0,0,0,0]
    combFilters: Number[] = [0,0,0,0]
    apBuffers: Number[][] = [[],[]]
    apIndices: Number[] = [0,0]
  }
  
  // Comb filter delay times (in samples at 44100)
  const COMB_TIMES = [1116, 1188, 1277, 1356]
  const AP_TIMES = [225, 556]

  process(ctx) {
    const scaler = ctx.sampleRate / 44100
    const roomScaler = params.roomSize * 0.28 + 0.7
    
    // Initialize buffers if needed
    for (let i = 0; i < 4; i++) {
      const size = Math.floor(COMB_TIMES[i] * scaler)
      while (state.combBuffers[i].length < size) {
        state.combBuffers[i].push(0)
      }
    }
    for (let i = 0; i < 2; i++) {
      const size = Math.floor(AP_TIMES[i] * scaler)
      while (state.apBuffers[i].length < size) {
        state.apBuffers[i].push(0)
      }
    }
    
    const input = ctx.input.audio
    let output = 0
    
    // Parallel comb filters
    for (let i = 0; i < 4; i++) {
      const buffer = state.combBuffers[i]
      const idx = state.combIndices[i]
      const delayed = buffer[idx]
      
      // Damping filter
      state.combFilters[i] = delayed * (1 - params.damping) + state.combFilters[i] * params.damping
      
      // Write back with feedback
      buffer[idx] = input + state.combFilters[i] * roomScaler
      state.combIndices[i] = (idx + 1) % buffer.length
      
      output += delayed
    }
    
    output *= 0.25
    
    // Series allpass filters
    for (let i = 0; i < 2; i++) {
      const buffer = state.apBuffers[i]
      const idx = state.apIndices[i]
      const delayed = buffer[idx]
      const feedback = 0.5
      
      buffer[idx] = output + delayed * feedback
      output = delayed - output * feedback
      state.apIndices[i] = (idx + 1) % buffer.length
    }
    
    emit out(input * (1 - params.mix) + output * params.mix)
  }
}
`,
};

// ============================================================================
// COMPOSITION EXAMPLES
// ============================================================================

const SEQUENCER: Example = {
  id: 'composition-sequencer',
  title: 'Step Sequencer',
  description: '16-step MIDI sequencer',
  category: 'composition',
  difficulty: 'advanced',
  tags: ['sequencer', 'pattern', 'steps'],
  source: `/**
 * 16-step MIDI note sequencer.
 */
card StepSequencer {
  inputs {
    clock: Event<Beat>
    reset: Event<Boolean>
  }
  
  outputs {
    midi: Midi
  }
  
  params {
    steps: Number = 16 @min(1) @max(16)
    octave: Number = 3 @min(0) @max(8)
    gateLength: Number = 0.5 @min(0.1) @max(1)
  }
  
  state {
    currentStep: Number = 0
    pattern: Number[] = [0, 2, 4, 5, 7, 9, 11, 12, 12, 11, 9, 7, 5, 4, 2, 0]
    velocity: Number[] = [100, 80, 90, 70, 100, 80, 90, 70, 100, 80, 90, 70, 100, 80, 90, 70]
    isNoteOn: Boolean = false
    noteEndTime: Number = 0
    lastNote: Number = -1
  }

  on reset(value) {
    if (value) {
      state.currentStep = 0
    }
  }
  
  on beat(time) {
    // Turn off previous note if needed
    if (state.isNoteOn && time >= state.noteEndTime) {
      emit midi.noteOff(state.lastNote)
      state.isNoteOn = false
    }
    
    // Quantize to step
    const stepDuration = 0.25  // 16th notes
    const quantizedStep = Math.floor(time / stepDuration) % params.steps
    
    if (quantizedStep !== state.currentStep) {
      state.currentStep = quantizedStep
      
      const semitone = state.pattern[state.currentStep]
      const note = params.octave * 12 + semitone
      const vel = state.velocity[state.currentStep]
      
      emit midi.noteOn(note, vel)
      state.lastNote = note
      state.isNoteOn = true
      state.noteEndTime = time + stepDuration * params.gateLength
    }
  }
}
`,
};

const CHORD_GENERATOR: Example = {
  id: 'composition-chords',
  title: 'Chord Generator',
  description: 'Generates chords from single notes',
  category: 'composition',
  difficulty: 'intermediate',
  tags: ['chords', 'harmony', 'generator'],
  source: `/**
 * Generates chords from incoming notes.
 */
card ChordGenerator {
  inputs {
    midi: Midi
  }
  
  outputs {
    out: Midi
  }
  
  params {
    chordType: String = "major"
    inversion: Number = 0 @min(0) @max(2)
  }
  
  // Chord intervals in semitones
  const CHORDS = {
    "major": [0, 4, 7],
    "minor": [0, 3, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
    "maj7": [0, 4, 7, 11],
    "min7": [0, 3, 7, 10],
    "dom7": [0, 4, 7, 10],
    "sus2": [0, 2, 7],
    "sus4": [0, 5, 7]
  }

  on noteOn(root, velocity) {
    const intervals = CHORDS[params.chordType] || CHORDS["major"]
    
    // Apply inversion
    let notes = intervals.map(i => root + i)
    for (let i = 0; i < params.inversion; i++) {
      notes[i % notes.length] += 12
    }
    notes.sort((a, b) => a - b)
    
    // Output all chord notes
    for (const note of notes) {
      if (note >= 0 && note <= 127) {
        emit out.noteOn(note, velocity)
      }
    }
  }
  
  on noteOff(root) {
    const intervals = CHORDS[params.chordType] || CHORDS["major"]
    
    let notes = intervals.map(i => root + i)
    for (let i = 0; i < params.inversion; i++) {
      notes[i % notes.length] += 12
    }
    
    for (const note of notes) {
      if (note >= 0 && note <= 127) {
        emit out.noteOff(note)
      }
    }
  }
}
`,
};

// ============================================================================
// UTILITY EXAMPLES
// ============================================================================

const SPLIT: Example = {
  id: 'util-split',
  title: 'Signal Splitter',
  description: 'Splits one input to multiple outputs',
  category: 'utilities',
  difficulty: 'beginner',
  tags: ['split', 'routing', 'utility'],
  source: `/**
 * Splits a signal to multiple outputs.
 */
card Split4 {
  inputs {
    input: Audio
  }
  
  outputs {
    out1: Audio
    out2: Audio
    out3: Audio
    out4: Audio
  }

  process(ctx) {
    const signal = ctx.input.input
    emit out1(signal)
    emit out2(signal)
    emit out3(signal)
    emit out4(signal)
  }
}
`,
};

const CROSSFADE: Example = {
  id: 'util-crossfade',
  title: 'Crossfader',
  description: 'Crossfades between two audio inputs',
  category: 'utilities',
  difficulty: 'beginner',
  tags: ['crossfade', 'mix', 'blend'],
  source: `/**
 * Crossfades between two audio signals.
 * Uses equal-power crossfade for smooth transitions.
 */
card Crossfade {
  inputs {
    a: Audio
    b: Audio
  }
  
  outputs {
    out: Audio
  }
  
  params {
    mix: Number = 0.5 @min(0) @max(1) @label("A/B Mix")
  }

  process(ctx) {
    // Equal power crossfade
    const angle = params.mix * Math.PI * 0.5
    const gainA = Math.cos(angle)
    const gainB = Math.sin(angle)
    
    const output = ctx.input.a * gainA + ctx.input.b * gainB
    emit out(output)
  }
}
`,
};

const MATH: Example = {
  id: 'util-math',
  title: 'Math Operations',
  description: 'Various mathematical operations on signals',
  category: 'utilities',
  difficulty: 'beginner',
  tags: ['math', 'arithmetic', 'utility'],
  source: `/**
 * Collection of math operation cards.
 */

// Adds two signals
card Add {
  inputs {
    a: Number
    b: Number
  }
  
  outputs {
    sum: Number
  }

  process(ctx) {
    emit sum(ctx.input.a + ctx.input.b)
  }
}

// Multiplies two signals
card Multiply {
  inputs {
    a: Number
    b: Number
  }
  
  outputs {
    product: Number
  }

  process(ctx) {
    emit product(ctx.input.a * ctx.input.b)
  }
}

// Clamps signal to range
card Clamp {
  inputs {
    value: Number
  }
  
  outputs {
    clamped: Number
  }
  
  params {
    min: Number = -1
    max: Number = 1
  }

  process(ctx) {
    const v = ctx.input.value
    emit clamped(Math.max(params.min, Math.min(params.max, v)))
  }
}

// Maps value from one range to another
card Map {
  inputs {
    value: Number
  }
  
  outputs {
    mapped: Number
  }
  
  params {
    inMin: Number = 0
    inMax: Number = 1
    outMin: Number = 0
    outMax: Number = 100
  }

  process(ctx) {
    const v = ctx.input.value
    const normalized = (v - params.inMin) / (params.inMax - params.inMin)
    emit mapped(params.outMin + normalized * (params.outMax - params.outMin))
  }
}
`,
};

// ============================================================================
// ALL EXAMPLES
// ============================================================================

/**
 * All available examples.
 */
export const EXAMPLES: Example[] = [
  // Basics
  HELLO_WORLD,
  PASS_THROUGH,
  COUNTER,
  PARAMETERS,
  
  // Audio
  GAIN,
  STEREO_PAN,
  MIXER,
  
  // MIDI
  MIDI_TRANSPOSE,
  MIDI_VELOCITY,
  ARPEGGIATOR,
  
  // Synthesis
  OSCILLATOR,
  ENVELOPE,
  LFO,
  
  // Effects
  DELAY,
  FILTER,
  REVERB,
  
  // Composition
  SEQUENCER,
  CHORD_GENERATOR,
  
  // Utilities
  SPLIT,
  CROSSFADE,
  MATH,
];

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Gets an example by ID.
 */
export function getExample(id: string): Example | undefined {
  return EXAMPLES.find(e => e.id === id);
}

/**
 * Gets all examples in a category.
 */
export function getExamplesByCategory(category: ExampleCategory): Example[] {
  return EXAMPLES.filter(e => e.category === category);
}

/**
 * Gets all examples with a specific difficulty.
 */
export function getExamplesByDifficulty(difficulty: ExampleDifficulty): Example[] {
  return EXAMPLES.filter(e => e.difficulty === difficulty);
}

/**
 * Searches examples by query string.
 */
export function searchExamples(query: string): Example[] {
  const lower = query.toLowerCase();
  return EXAMPLES.filter(e =>
    e.title.toLowerCase().includes(lower) ||
    e.description.toLowerCase().includes(lower) ||
    e.tags.some(t => t.toLowerCase().includes(lower))
  );
}

/**
 * Gets all categories with example counts.
 */
export function getCategories(): Array<{ category: ExampleCategory; count: number }> {
  const counts = new Map<ExampleCategory, number>();
  
  for (const example of EXAMPLES) {
    counts.set(example.category, (counts.get(example.category) || 0) + 1);
  }
  
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

/**
 * Gets all tags used across examples.
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const example of EXAMPLES) {
    for (const tag of example.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

/**
 * Gets related examples for a given example.
 */
export function getRelatedExamples(id: string): Example[] {
  const example = getExample(id);
  if (!example) return [];
  
  const related: Example[] = [];
  
  // Explicitly related
  if (example.related) {
    for (const relatedId of example.related) {
      const r = getExample(relatedId);
      if (r) related.push(r);
    }
  }
  
  // Same category (excluding self)
  const sameCategory = getExamplesByCategory(example.category)
    .filter(e => e.id !== id);
  
  // Same tags
  const sameTags = EXAMPLES.filter(e =>
    e.id !== id &&
    e.tags.some(t => example.tags.includes(t))
  );
  
  // Combine and deduplicate
  const all = [...related, ...sameCategory, ...sameTags];
  const seen = new Set<string>();
  
  return all.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  }).slice(0, 5);
}
