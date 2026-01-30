# Lydian Chromatic Concept (LCC) in CardPlay

George Russell's Lydian Chromatic Concept of Tonal Organization provides an alternative framework for understanding tonal gravity and chord-scale relationships.

## Why Lydian?

Russell's key insight: the Lydian scale (with its raised 4th) is the most consonant scale relative to a major chord, because all notes stack in fifths from the root. This makes the Lydian scale — not the major scale — the "parent" scale in his system.

## Tonal Gravity

In LCC, notes have varying degrees of "tonal gravity" — attraction to or distance from a tonal center:

- **Tonal gravity levels**: close (lydian tonic chord tones), semi-close (diatonic non-chord tones), distant (chromatic)
- **Vertical vs horizontal**: Vertical gravity for chord voicing; horizontal for melodic movement

## Predicates

```prolog
lcc_parent_scale(Chord, LydianScale).
lcc_tonal_gravity(Note, Center, GravityLevel).
lcc_chord_scale(ChordType, PrimaryScale, AlternateScales).
lcc_modal_genre(Mode, Genre, CharacteristicHarmony).
```

## TypeScript API

```typescript
import {
  LCC_POLYCHORD_TEMPLATES,
  getLCCPolychordForScale,
  suggestLCCVoiceLeading,
  analyzeLCCGravity,
} from '@cardplay/ai/queries/spec-queries';

// Get polychord voicing for lydian scale
const voicing = getLCCPolychordForScale('lydian');

// Analyze voice leading between two chords using LCC
const vl = suggestLCCVoiceLeading(
  { root: 'c', quality: 'maj7', duration: 4 },
  { root: 'f', quality: 'dom7', duration: 4 },
  'lydian'
);
console.log(vl.smoothness); // Lower = smoother
console.log(vl.movements);  // Voice movement descriptions
```

## Chord-Scale Relationships: LCC vs Traditional

| Approach | ii-7 in C | V7 in C | I∆7 in C |
|----------|----------|---------|----------|
| Traditional | D Dorian | G Mixolydian | C Ionian |
| LCC | D Lydian ♭7 | G Lydian ♭7 | C Lydian |

## Polychord Voicings

LCC suggests upper-structure triads over bass notes for rich voicings:

```typescript
// 4 template types available
const templates = LCC_POLYCHORD_TEMPLATES;
// Each has upperStructure, lowerStructure, scaleContext
```

## Constraints

```typescript
{ type: 'tonality_model', hard: false, model: 'lcc' }
{ type: 'key', hard: true, key: 'c', mode: 'lydian' }
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Computational Theory](./computational-theory.md) - GTTM, Spiral Array
- [Film Music](./film-music.md) - Film scoring
