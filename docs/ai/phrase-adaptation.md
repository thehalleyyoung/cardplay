# Phrase Adaptation Reference

This document provides comprehensive documentation for the Prolog-powered phrase adaptation system in the CardPlay AI module.

## Overview

The phrase adaptation system allows musical phrases to be intelligently transformed to fit different harmonic contexts. It uses Prolog-based reasoning for voice leading analysis, chord-tone mapping, and similarity measurement.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PrologPhraseAdapter                       │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌───────────────────┐   ┌──────────────┐ │
│  │  Phrase     │──▶│ Prolog KB Queries │──▶│  Adapted     │ │
│  │  Notes      │   │                   │   │  Notes       │ │
│  └─────────────┘   └───────────────────┘   └──────────────┘ │
│                             │                               │
│                    ┌────────┴────────┐                      │
│                    ▼                 ▼                      │
│         ┌─────────────────┐  ┌───────────────────┐          │
│         │ music-theory.pl │  │ phrase-adaptation │          │
│         │                 │  │ .pl               │          │
│         └─────────────────┘  └───────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Adaptation

```typescript
import { createPrologPhraseAdapter } from '@cardplay/ai/adaptation';

const adapter = createPrologPhraseAdapter();

// Original phrase (C major arpeggio)
const phrase = [
  { pitch: 60, start: 0, duration: 480, velocity: 100 },    // C4
  { pitch: 64, start: 480, duration: 480, velocity: 100 },  // E4
  { pitch: 67, start: 960, duration: 480, velocity: 100 },  // G4
  { pitch: 72, start: 1440, duration: 480, velocity: 100 }  // C5
];

// Adapt to G major
const result = await adapter.adaptToChord(
  phrase,
  { root: 'c', quality: 'major' },
  { root: 'g', quality: 'major' },
  { mode: 'chord-tone', preserveContour: true }
);

console.log(result.notes);       // Adapted note array
console.log(result.quality);     // Quality score (0-100)
console.log(result.explanation); // Human-readable explanation
```

## Adaptation Modes

### Transpose Mode

Simple transposition by the interval between source and target chord roots.

```typescript
const result = await adapter.adaptToChord(
  phrase,
  { root: 'c', quality: 'major' },
  { root: 'g', quality: 'major' },
  { mode: 'transpose' }
);
// All notes transposed up a perfect 5th (7 semitones)
```

**When to use:**
- Moving a phrase to a different key
- Parallel harmony sections
- When exact intervals must be preserved

**Prolog predicates used:**
- `transpose_pitch/3` - Calculate transposed pitch
- `interval_between/3` - Determine transposition amount

### Chord-Tone Mode

Maps notes to the chord tones of the target chord. Non-chord tones are mapped to the nearest chord tone.

```typescript
const result = await adapter.adaptToChord(
  phrase,
  { root: 'c', quality: 'major' },
  { root: 'a', quality: 'minor' },
  { mode: 'chord-tone' }
);
// Notes mapped to A, C, E (Am chord tones)
```

**When to use:**
- Adapting melodies to different chord qualities
- Ensuring harmonic compatibility
- Creating arpeggiated patterns over chords

**Prolog predicates used:**
- `is_chord_tone/2` - Check if note is a chord tone
- `nearest_chord_tone/3` - Find closest chord tone
- `map_chord_tone/5` - Map between chord tone positions

### Scale-Degree Mode

Preserves the scale degree function of each note when moving to a new key.

```typescript
const result = await adapter.adaptToChord(
  phrase,
  { root: 'c', quality: 'major' },
  { root: 'g', quality: 'major' },
  { mode: 'scale-degree' }
);
// Scale degrees preserved: 1-3-5-1 → G-B-D-G
```

**When to use:**
- Modulating while preserving melodic function
- Modal interchange
- Keeping melodic character across key changes

**Prolog predicates used:**
- `scale_degree/3` - Get degree of a pitch in scale
- `pitch_from_degree/3` - Convert degree back to pitch
- `nearest_scale_tone/3` - Handle non-scale tones

### Voice-Leading Mode

Optimizes for smooth voice leading by minimizing voice movement.

```typescript
const result = await adapter.adaptToChord(
  phrase,
  { root: 'c', quality: 'major' },
  { root: 'f', quality: 'major' },
  { mode: 'voice-leading' }
);
// Notes chosen to minimize movement from previous notes
```

**When to use:**
- Creating smooth transitions
- Vocal arrangements
- Classical-style part writing
- Avoiding large jumps

**Prolog predicates used:**
- `voice_leading_cost/3` - Score voice movement quality
- `smooth_voice_leading/2` - Check if movement is smooth
- `stepwise_motion/2` - Check for stepwise movement

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | AdaptMode | required | Adaptation algorithm |
| `preserveRhythm` | boolean | true | Keep original timing |
| `preserveContour` | boolean | true | Maintain melodic shape |
| `allowChromaticism` | boolean | false | Allow chromatic passing tones |
| `pitchRange` | object | - | Constrain to pitch range |
| `voiceLeadingWeight` | number | 0.5 | Weight for voice leading (0-1) |

### Pitch Range Constraint

```typescript
const result = await adapter.adaptToChord(
  phrase,
  { root: 'c', quality: 'major' },
  { root: 'c', quality: 'major' },
  { 
    mode: 'transpose',
    pitchRange: { min: 48, max: 72 }  // C3 to C5
  }
);
// All notes constrained to range (octave-shifted if needed)
```

## Phrase Similarity

Calculate similarity between two phrases:

```typescript
const similarity = await adapter.calculateSimilarity(phrase1, phrase2);

console.log(similarity.overall);   // 0-100 overall score
console.log(similarity.rhythm);    // Rhythm similarity
console.log(similarity.contour);   // Melodic contour similarity  
console.log(similarity.intervals); // Interval pattern similarity
```

### Similarity Components

| Component | Weight | Description |
|-----------|--------|-------------|
| `rhythm` | 30% | Duration pattern matching |
| `contour` | 35% | Direction of pitch movement |
| `intervals` | 35% | Interval size matching |

### Prolog Predicates for Similarity

```prolog
% Rhythm similarity (duration patterns)
rhythm_similarity(Durations1, Durations2, Score).

% Contour similarity (up/down/same patterns)
contour_similarity(Pitches1, Pitches2, Score).

% Interval similarity (interval size patterns)
interval_similarity(Pitches1, Pitches2, Score).
```

## Phrase Search

Find similar phrases in a database:

```typescript
const phraseDB = [
  { id: 'phrase1', notes: [...] },
  { id: 'phrase2', notes: [...] },
  { id: 'phrase3', notes: [...] }
];

const matches = await adapter.findSimilarPhrases(
  targetPhrase,
  phraseDB,
  70  // Minimum similarity threshold (0-100)
);

// Returns: [{ id: 'phrase2', similarity: { overall: 85, ... } }, ...]
```

## Prolog Knowledge Base

### phrase-adaptation.pl Predicates

#### Transposition Rules

| Predicate | Description |
|-----------|-------------|
| `transpose_pitch(Pitch, Semitones, Result)` | Transpose MIDI pitch |
| `transpose_pitch_class(PC, Semitones, Result)` | Transpose pitch class (0-11) |
| `interval_between(Note1, Note2, Interval)` | Calculate interval |

#### Chord-Tone Mapping

| Predicate | Description |
|-----------|-------------|
| `is_chord_tone(PC, ChordTones)` | Check if pitch is chord tone |
| `nearest_chord_tone(PC, ChordTones, Nearest)` | Find nearest chord tone |
| `map_chord_tone(PC, Source, Target, ResultPC)` | Map between chords |
| `chord_tone_index(PC, ChordTones, Index)` | Get chord tone position |

#### Voice Leading

| Predicate | Description |
|-----------|-------------|
| `voice_leading_cost(P1, P2, Cost)` | Score voice movement |
| `smooth_voice_leading(P1, P2)` | Check if ≤2 semitones |
| `stepwise_motion(P1, P2)` | Check if 1-2 semitones |

#### Contour Analysis

| Predicate | Description |
|-----------|-------------|
| `contour_direction(P1, P2, Direction)` | ascending/descending/static |
| `contour_matches(O1, O2, N1, N2)` | Check contour preserved |

#### Passing Tone Detection

| Predicate | Description |
|-----------|-------------|
| `is_passing_tone(Note, Prev, Next, Chord, Scale)` | Detect passing tones |
| `is_neighbor_tone(Note, Prev, Next, Chord)` | Detect neighbor tones |
| `is_approach_tone(Note, Target, Chord)` | Detect approach tones |

#### Similarity Measurement

| Predicate | Description |
|-----------|-------------|
| `rhythm_similarity(D1, D2, Score)` | Compare duration patterns |
| `contour_similarity(P1, P2, Score)` | Compare contour |
| `interval_similarity(P1, P2, Score)` | Compare intervals |

## Integration with Existing Phrase Adapter

The Prolog-based adapter can be used alongside or instead of the existing `phrase-adapter.ts`:

```typescript
import { adaptByChordTone } from '@cardplay/cards/phrase-adapter';
import { createPrologPhraseAdapter } from '@cardplay/ai/adaptation';

// Option 1: Use existing adapter (no Prolog)
const result1 = adaptByChordTone(notes, sourceChord, targetChord, options);

// Option 2: Use Prolog-enhanced adapter
const prologAdapter = createPrologPhraseAdapter();
const result2 = await prologAdapter.adaptToChord(
  notes, sourceChord, targetChord, { mode: 'chord-tone' }
);
```

### When to Use Prolog Adapter

| Use Case | Recommended Adapter |
|----------|---------------------|
| Simple transposition | Existing (faster) |
| Chord-tone mapping | Either |
| Voice-leading optimization | Prolog (better quality) |
| Similarity search | Prolog (required) |
| Batch processing | Prolog (consistent) |
| Real-time preview | Existing (faster) |

## Types

### PhraseNote

```typescript
interface PhraseNote {
  pitch: number;     // MIDI note (0-127)
  start: number;     // Start time in ticks
  duration: number;  // Duration in ticks
  velocity: number;  // Velocity (0-127)
}
```

### ChordTarget

```typescript
interface ChordTarget {
  root: string;     // Note name (e.g., 'c', 'fsharp')
  quality: string;  // Chord quality (e.g., 'major', 'minor')
}
```

### AdaptResult

```typescript
interface AdaptResult {
  notes: PhraseNote[];    // Adapted notes
  mode: AdaptMode;        // Mode used
  quality: number;        // Quality score (0-100)
  explanation: string;    // Human-readable explanation
}
```

### SimilarityResult

```typescript
interface SimilarityResult {
  overall: number;   // Overall similarity (0-100)
  rhythm: number;    // Rhythm similarity
  contour: number;   // Contour similarity
  intervals: number; // Interval similarity
}
```

## See Also

- [music-theory-predicates.md](./music-theory-predicates.md) - Music theory KB
- [composition-predicates.md](./composition-predicates.md) - Composition patterns
- [generators-reference.md](./generators-reference.md) - Prolog-based generators
