# AI Generators Reference

This document provides comprehensive documentation for the Prolog-powered music generators in the CardPlay AI system.

## Overview

The generator module provides five specialized generators that use the Prolog knowledge bases (music theory, composition patterns) to create musically coherent content:

| Generator | Purpose | Key KB Used |
|-----------|---------|-------------|
| `BassGenerator` | Bass line generation | composition-patterns, music-theory |
| `MelodyGenerator` | Melodic line generation | composition-patterns, music-theory |
| `DrumGenerator` | Drum pattern generation | composition-patterns |
| `ChordGenerator` | Chord progression generation | music-theory |
| `ArpeggioGenerator` | Arpeggiated pattern generation | music-theory |

## BassGenerator

Generates bass lines for chord progressions using Prolog-defined bass patterns.

### Usage

```typescript
import { createBassGenerator } from '@cardplay/ai/generators';

const generator = createBassGenerator();

const result = await generator.generate([
  { root: 'c', quality: 'major', start: 0, duration: 1920 },
  { root: 'g', quality: 'major', start: 1920, duration: 1920 }
], {
  genre: 'house',
  octave: 2,
  velocity: 100,
  variation: 0.2
});

console.log(result.events);  // NoteEvent[]
console.log(result.patternId);  // Pattern used
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `genre` | string | 'pop' | Genre for pattern selection |
| `patternId` | string | auto | Specific pattern ID to use |
| `octave` | number | 2 | Octave for bass notes |
| `velocity` | number | 100 | Base velocity (0-127) |
| `seed` | number | - | Random seed for reproducibility |
| `variation` | number | 0 | Variation amount (0-1) |
| `ticksPerBeat` | number | 480 | Ticks per beat |

### KB Predicates Used

- `bass_pattern(Genre, PatternId)` - Get pattern for genre
- `bass_pattern_steps(PatternId, Steps)` - Get pattern step sequence

## MelodyGenerator

Generates melodic lines constrained by scale and chord context.

### Usage

```typescript
import { createMelodyGenerator } from '@cardplay/ai/generators';

const generator = createMelodyGenerator();

const result = await generator.generate(
  [{ root: 'c', quality: 'major', start: 0, duration: 1920 }],
  { root: 'c', scale: 'major' },
  { 
    genre: 'pop',
    density: 0.6,
    contour: 'arch',
    maxInterval: 5
  }
);
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `genre` | string | 'pop' | Genre for constraints |
| `octave` | number | 4 | Octave for melody |
| `velocity` | number | 100 | Base velocity |
| `seed` | number | - | Random seed |
| `density` | number | 0.5 | Note density (0-1) |
| `contour` | string | 'random' | Contour: 'ascending', 'descending', 'arch', 'random' |
| `maxInterval` | number | 5 | Max interval jump in semitones |
| `ticksPerBeat` | number | 480 | Ticks per beat |
| `phraseLength` | number | 4 | Phrase length in beats |

### Variation Techniques

Apply transformations to generated melodies:

```typescript
const motif = await generator.generateMotif(
  { root: 'c', scale: 'major' },
  2  // 2 beats
);

// Apply variations
const transposed = await generator.applyVariation(motif, 'transposition', 0.5);
const inverted = await generator.applyVariation(motif, 'inversion');
const retrograde = await generator.applyVariation(motif, 'retrograde');
const augmented = await generator.applyVariation(motif, 'augmentation');
const diminished = await generator.applyVariation(motif, 'diminution');
const ornamented = await generator.applyVariation(motif, 'ornamentation', 0.3);
```

### KB Predicates Used

- `melodic_range(Genre, MinInterval, MaxInterval)` - Genre melodic constraints
- `genre_characteristic(Genre, Characteristic)` - Genre style hints
- `variation_technique(Technique, Description)` - Variation descriptions

## DrumGenerator

Generates drum patterns for various genres.

### Usage

```typescript
import { createDrumGenerator } from '@cardplay/ai/generators';

const generator = createDrumGenerator();

const result = await generator.generate({
  genre: 'house',
  bars: 4,
  humanize: 0.2,
  swing: 0.3
});

console.log(result.events);  // DrumEvent[]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `genre` | string | 'pop' | Genre for pattern selection |
| `patternId` | string | auto | Specific pattern ID |
| `velocity` | number | 100 | Base velocity |
| `seed` | number | - | Random seed |
| `humanize` | number | 0 | Humanization amount (0-1) |
| `swing` | number | auto | Swing amount (0-1), auto from KB |
| `ticksPerBeat` | number | 480 | Ticks per beat |
| `bars` | number | 1 | Number of bars to generate |
| `beatsPerBar` | number | 4 | Beats per bar |

### Built-in Patterns

| Pattern ID | Description | Genres |
|------------|-------------|--------|
| `basic_rock` | Standard rock beat | rock, pop |
| `four_on_floor` | Dance kick pattern | house, techno, edm |
| `trap_beat` | Trap hip-hop | trap, hiphop |
| `boom_bap` | Classic hip-hop | hiphop |
| `jazz_swing` | Jazz swing feel | jazz |
| `bossa_nova` | Brazilian rhythm | bossa |
| `reggae` | Reggae pattern | reggae |
| `dnb` | Drum and bass | dnb, drum_and_bass |

### Drum Instruments (GM Map)

| Instrument | MIDI Note |
|------------|-----------|
| kick | 36 |
| snare | 38 |
| hihat | 42 |
| hihat_open | 46 |
| tom_high | 50 |
| tom_mid | 47 |
| tom_low | 45 |
| crash | 49 |
| ride | 51 |
| clap | 39 |
| rim | 37 |

### Generate Fills

```typescript
const fill = await generator.generateFill(1, { velocity: 100 });
// Generates a 1-beat fill ending with crash
```

### KB Predicates Used

- `drum_pattern(Genre, PatternId)` - Pattern for genre
- `swing_feel(Genre, Amount)` - Swing amount (heavy/medium/light/straight)
- `humanization_rule(Genre, TimingVar, VelocityVar)` - Humanization params

## ChordGenerator

Generates chord progressions with harmonic analysis.

### Usage

```typescript
import { createChordGenerator } from '@cardplay/ai/generators';

const generator = createChordGenerator();

const result = await generator.generate(
  { root: 'c', mode: 'major' },
  {
    genre: 'pop',
    length: 4,
    cadence: 'authentic',
    useExtensions: true
  }
);

console.log(result.chords);  // Chord[]
// [
//   { root: 'c', quality: 'maj7', numeral: 'I', start: 0, duration: 1920 },
//   { root: 'g', quality: 'dom7', numeral: 'V', start: 1920, duration: 1920 },
//   ...
// ]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `genre` | string | 'pop' | Genre for progression style |
| `length` | number | 4 | Number of chords |
| `seed` | number | - | Random seed |
| `ticksPerBeat` | number | 480 | Ticks per beat |
| `beatsPerChord` | number | 4 | Beats per chord |
| `allowBorrowed` | boolean | false | Allow borrowed chords |
| `useExtensions` | boolean | false | Use 7th chords |
| `cadence` | string | - | Target cadence type |

### Cadence Types

| Cadence | Pattern | Description |
|---------|---------|-------------|
| `authentic` | V-I | Strong resolution |
| `plagal` | IV-I | "Amen" cadence |
| `deceptive` | V-vi | Unexpected resolution |
| `half` | *-V | Ends on dominant |

### Chord Suggestion and Analysis

```typescript
// Suggest next chords
const suggestions = await generator.suggestNextChord('V', { root: 'c', mode: 'major' });
// ['I'] - V resolves to I

// Analyze progression
const analysis = await generator.analyzeProgression(
  [
    { root: 'c', quality: 'major' },
    { root: 'g', quality: 'major' },
    { root: 'a', quality: 'minor' },
    { root: 'f', quality: 'major' }
  ],
  { root: 'c', mode: 'major' }
);
// { numerals: ['I', 'V', 'vi', 'IV'], isValid: true, suggestions: [] }
```

### KB Predicates Used

- `chord_tendency(FromFunction, ToFunction)` - Valid chord progressions
- `diatonic_chord(Mode, Degree, Quality)` - Chord qualities by degree
- `harmonic_function(Degree, Function)` - Degree to function mapping

## ArpeggioGenerator

Generates arpeggiated patterns for chords.

### Usage

```typescript
import { createArpeggioGenerator } from '@cardplay/ai/generators';

const generator = createArpeggioGenerator();

const result = await generator.generate(
  { root: 'c', quality: 'major', start: 0, duration: 1920 },
  {
    pattern: 'up_down',
    octaveRange: 2,
    notesPerBeat: 4,
    overlap: 0.2
  }
);
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pattern` | ArpeggioPattern | 'up' | Arpeggio pattern type |
| `octave` | number | 4 | Starting octave |
| `velocity` | number | 100 | Base velocity |
| `seed` | number | - | Random seed |
| `notesPerBeat` | number | 4 | Notes per beat (16ths) |
| `overlap` | number | 0 | Note overlap (0=staccato, 1=legato) |
| `octaveRange` | number | 1 | Octave span |
| `ticksPerBeat` | number | 480 | Ticks per beat |
| `velocityCurve` | string | 'flat' | Velocity curve |
| `includeExtensions` | boolean | false | Include 9ths, 11ths, etc. |

### Pattern Types

| Pattern | Description |
|---------|-------------|
| `up` | Ascending |
| `down` | Descending |
| `up_down` | Ascending then descending |
| `down_up` | Descending then ascending |
| `random` | Random order |
| `chord` | All notes together |
| `pinky` | Alternating bass and treble |
| `alberti` | Alberti bass (1-5-3-5) |
| `pedal` | Pedal tone with moving notes |
| `cascade` | Overlapping notes |

### Velocity Curves

| Curve | Effect |
|-------|--------|
| `flat` | Constant velocity |
| `accent_first` | First note louder |
| `crescendo` | Getting louder |
| `decrescendo` | Getting softer |

### Generate for Progression

```typescript
const events = await generator.generateProgression([
  { root: 'c', quality: 'major', start: 0, duration: 960 },
  { root: 'f', quality: 'major', start: 960, duration: 960 },
  { root: 'g', quality: 'major', start: 1920, duration: 960 },
  { root: 'c', quality: 'major', start: 2880, duration: 960 }
], { pattern: 'alberti' });
```

### Pattern Suggestions by Genre

```typescript
const pattern = await generator.suggestPattern('classical');  // 'alberti'
const pattern = await generator.suggestPattern('edm');  // 'up'
```

## Common Types

### NoteEvent

```typescript
interface NoteEvent {
  pitch: number;     // MIDI note (0-127)
  start: number;     // Start time in ticks
  duration: number;  // Duration in ticks
  velocity: number;  // Velocity (0-127)
}
```

### DrumEvent

```typescript
interface DrumEvent {
  instrument: DrumInstrument;  // Instrument type
  pitch: number;               // MIDI note
  start: number;               // Start time in ticks
  duration: number;            // Duration in ticks
  velocity: number;            // Velocity (0-127)
}
```

### ChordContext / ChordInfo

```typescript
interface ChordContext {
  root: string;      // Note name (e.g., 'c', 'fsharp')
  quality: string;   // Chord quality (e.g., 'major', 'min7')
  start: number;     // Start time in ticks
  duration: number;  // Duration in ticks
}
```

### ScaleContext

```typescript
interface ScaleContext {
  root: string;   // Note name
  scale: string;  // Scale type (e.g., 'major', 'minor', 'pentatonic_minor')
}
```

### KeyContext

```typescript
interface KeyContext {
  root: string;  // Note name
  mode: string;  // 'major' or 'minor'
}
```

## Integration Example

Here's how to use multiple generators together:

```typescript
import { 
  createChordGenerator,
  createBassGenerator,
  createMelodyGenerator,
  createDrumGenerator,
  createArpeggioGenerator
} from '@cardplay/ai/generators';

async function generateTrack() {
  const key = { root: 'c', mode: 'major' };
  const scale = { root: 'c', scale: 'major' };
  const ticksPerBeat = 480;
  
  // Generate chord progression
  const chordGen = createChordGenerator();
  const { chords } = await chordGen.generate(key, {
    genre: 'pop',
    length: 8,
    cadence: 'authentic'
  });
  
  // Generate bass line
  const bassGen = createBassGenerator();
  const bass = await bassGen.generate(chords, {
    genre: 'pop',
    octave: 2
  });
  
  // Generate melody
  const melodyGen = createMelodyGenerator();
  const melody = await melodyGen.generate(chords, scale, {
    genre: 'pop',
    density: 0.6,
    contour: 'arch'
  });
  
  // Generate drums
  const drumGen = createDrumGenerator();
  const drums = await drumGen.generate({
    genre: 'pop',
    bars: 8,
    humanize: 0.1
  });
  
  // Generate arpeggios for pads
  const arpGen = createArpeggioGenerator();
  const arps = await arpGen.generateProgression(chords, {
    pattern: 'up_down',
    octave: 5,
    velocity: 60,
    overlap: 0.5
  });
  
  return {
    chords,
    bass: bass.events,
    melody: melody.events,
    drums: drums.events,
    arpeggios: arps
  };
}
```

## See Also

- [music-theory-predicates.md](./music-theory-predicates.md) - Music theory KB reference
- [composition-predicates.md](./composition-predicates.md) - Composition patterns KB reference
- [board-predicates.md](./board-predicates.md) - Board layout KB reference
