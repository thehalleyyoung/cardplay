# Spiral Array for Chords and Keys

> **Roadmap Item**: C170 Add docs: "Spiral Array for chords/keys" (what distances mean).

## Overview

The Spiral Array is a three-dimensional geometric model of tonal space developed by Elaine Chew. It represents pitch classes, chords, and keys as points in 3D space, where distances correspond to perceived harmonic relationships.

## The Geometry

### Three Interleaved Spirals

The Spiral Array consists of three helical spirals:

1. **Pitch-Class Spiral**: 12 points, one per pitch class
2. **Major/Minor Chord Spiral**: 24 points (12 major + 12 minor triads)
3. **Major/Minor Key Spiral**: 24 points (12 major + 12 minor keys)

```
    Pitch Classes         Chords              Keys
         •                  •                  •
        / \                / \                / \
       •   •              •   •              •   •
      / \ / \            / \ / \            / \ / \
     •   •   •          •   •   •          •   •   •
      \ / \ /            \ / \ /            \ / \ /
       •   •              •   •              •   •
        \ /                \ /                \ /
         •                  •                  •
```

### Coordinate System

Each pitch class $p$ has coordinates:

$$
\begin{aligned}
x_p &= r \cdot \sin(p \cdot \pi / 2) \\
y_p &= r \cdot \cos(p \cdot \pi / 2) \\
z_p &= h \cdot p
\end{aligned}
$$

Where:
- $r$ = radius (controls circle of fifths spacing)
- $h$ = height increment (controls vertical pitch-class spacing)
- $p$ = pitch class (0-11, with 0=C)

The specific values are chosen so that:
- Moving up a fifth = moving along the helix
- Closely related keys are nearby
- Distant keys are far apart

## Distances and Their Meaning

### Pitch-Class Distance

Distance between two pitch classes measures their harmonic relatedness:

| Interval | Distance | Interpretation |
|----------|----------|----------------|
| Unison | 0 | Same note |
| Perfect 5th | 0.31 | Very close (dominant) |
| Perfect 4th | 0.31 | Very close (subdominant) |
| Major 2nd | 0.62 | Moderately close |
| Minor 3rd | 0.62 | Moderately close |
| Major 3rd | 0.62 | Moderately close |
| Tritone | 1.00 | Maximum distance |

### Chord Distance

A chord point is the centroid of its pitch classes:

```prolog
%% spiral_chord_point(+Root, +ChordType, -Point)
spiral_chord_point(Root, major, p(X, Y, Z)) :-
  spiral_point_pc(Root, p(X1, Y1, Z1)),      % Root
  third_of(Root, major, Third),
  spiral_point_pc(Third, p(X2, Y2, Z2)),      % Major 3rd
  fifth_of(Root, Fifth),
  spiral_point_pc(Fifth, p(X3, Y3, Z3)),      % Perfect 5th
  X is (X1 + X2 + X3) / 3,
  Y is (Y1 + Y2 + Y3) / 3,
  Z is (Z1 + Z2 + Z3) / 3.
```

Chord distances indicate harmonic motion:

| Chord Progression | Distance | Character |
|-------------------|----------|-----------|
| C → G (I → V) | 0.28 | Very smooth |
| C → Am (I → vi) | 0.24 | Smooth (relative minor) |
| C → F (I → IV) | 0.28 | Very smooth |
| C → Dm (I → ii) | 0.38 | Moderate |
| C → Em (I → iii) | 0.38 | Moderate |
| C → E (I → III) | 0.52 | Chromatic mediant (bold) |
| C → F♯ (I → ♯IV) | 0.95 | Very distant (dramatic) |

### Key Distance

Key points are centroids of their diatonic triads:

```prolog
%% spiral_key_point(+KeyRoot, +Mode, -Point)
spiral_key_point(Root, major, Point) :-
  diatonic_triads(Root, major, Triads),
  maplist(spiral_chord_point, Triads, Points),
  centroid(Points, Point).
```

Key distances measure modulation "effort":

| Modulation | Distance | Description |
|------------|----------|-------------|
| C → G major | 0.15 | One sharp added (dominant) |
| C → F major | 0.15 | One flat added (subdominant) |
| C → A minor | 0.08 | Relative minor (very close) |
| C → D major | 0.30 | Two sharps (secondary dominant) |
| C → E♭ major | 0.45 | Three flats (dramatic) |
| C → F♯ major | 0.90 | Tritone away (very dramatic) |

## Use Cases in CardPlay

### 1. Chord-Key Fit Score

How well does a chord fit the current key?

```prolog
%% spiral_chord_key_distance(+ChordRoot, +ChordType, +KeyRoot, +KeyMode, -Distance)
spiral_chord_key_distance(ChordRoot, ChordType, KeyRoot, KeyMode, Distance) :-
  spiral_chord_point(ChordRoot, ChordType, ChordPoint),
  spiral_key_point(KeyRoot, KeyMode, KeyPoint),
  point_distance(ChordPoint, KeyPoint, Distance).

%% High distance = chromatic, tension-building
%% Low distance = diatonic, stable
```

### 2. Voice-Leading Optimization

Minimize total spiral distance for smooth voice leading:

```prolog
spiral_best_voicing(Chord1, Chord2, Voicing, Score) :-
  chord_voicings(Chord1, V1),
  chord_voicings(Chord2, V2),
  all_voicing_pairs(V1, V2, Pairs),
  maplist(voicing_distance, Pairs, Distances),
  min_member(Score-Voicing, Distances).
```

### 3. Tonal Tension Curve

Track tension over a progression using key distances:

```typescript
function calculateTonalTension(chords: Chord[], key: Key): number[] {
  return chords.map(chord => {
    const distance = spiralChordKeyDistance(chord, key);
    return distance * 100; // Scale to 0-100
  });
}
```

### 4. Modulation Planning

Find smooth pivot chords for modulation:

```prolog
%% find_pivot_chord(+FromKey, +ToKey, -PivotChord, -Score)
find_pivot_chord(FromKey, ToKey, Pivot, Score) :-
  common_chord(FromKey, ToKey, Pivot),
  spiral_chord_key_distance(Pivot, FromKey, D1),
  spiral_chord_key_distance(Pivot, ToKey, D2),
  Score is 1 / (D1 + D2).  % Lower total distance = better pivot
```

## Prolog Implementation

```prolog
%% Pitch-class spiral points (pre-computed)
spiral_point_pc(c, p(0.0, 1.0, 0.0)).
spiral_point_pc(g, p(0.707, 0.707, 0.58)).
spiral_point_pc(d, p(1.0, 0.0, 1.17)).
spiral_point_pc(a, p(0.707, -0.707, 1.75)).
% ... etc.

%% Distance between two points
point_distance(p(X1,Y1,Z1), p(X2,Y2,Z2), D) :-
  D is sqrt((X2-X1)^2 + (Y2-Y1)^2 + (Z2-Z1)^2).

%% Chord fit score (0-100, higher = better fit)
spiral_chord_fit(ChordRoot, ChordType, KeyRoot, KeyMode, Fit) :-
  spiral_chord_key_distance(ChordRoot, ChordType, KeyRoot, KeyMode, Dist),
  Fit is max(0, 100 - Dist * 100).
```

## TypeScript Usage

```typescript
import { 
  spiralChordKeyDistance,
  spiralBestVoicing 
} from '@cardplay/ai/queries/spec-queries';

// Check if chord fits the key
const distance = await spiralChordKeyDistance('e', 'major', 'c', 'major');
console.log(distance); // ~0.52 (chromatic mediant, quite distant)

// Find optimal voicing for voice leading
const voicing = await spiralBestVoicing(
  { root: 'c', type: 'major' },
  { root: 'g', type: 'major' }
);
console.log(voicing.score); // Low score = smooth connection
```

## Interpretation Guide

### Distance Thresholds

| Distance | Interpretation | Use Case |
|----------|----------------|----------|
| 0.0 - 0.2 | Very close | Diatonic, stable |
| 0.2 - 0.4 | Close | Related keys, secondary dominants |
| 0.4 - 0.6 | Moderate | Chromatic mediants, modal mixture |
| 0.6 - 0.8 | Distant | Dramatic modulations |
| 0.8 - 1.0 | Very distant | Shock effect, avant-garde |

### Film Scoring Applications

| Emotion | Distance Strategy |
|---------|-------------------|
| Stability, home | Stay near key center (< 0.2) |
| Tension, unease | Drift outward (0.3-0.5) |
| Transformation | Jump to distant key (> 0.6) |
| Return, resolution | Move back toward center |

## Limitations

### 1. Equal Temperament Assumption

The Spiral Array assumes 12-TET. For other temperaments, distances may not reflect perceived relationships accurately.

### 2. Cultural Bias

The model is based on Western tonal music. It may not accurately model:
- Carnatic ragas (different hierarchy)
- Chinese pentatonic music
- Atonal or post-tonal music

### 3. Register Ignored

The Spiral Array collapses all octaves to pitch classes. Registral effects (tessitura, voice crossing) need separate modeling.

### 4. Timbre Not Considered

Harmonic distance is pitch-based. Orchestration and timbre require additional dimensions.

## See Also

- [C158: DFT phase approximation](./dft-phase-tonality.md)
- [C212: Computational models supported](./computational-models.md)
- [C242: Tonal centroid vs Spiral Array](./tonal-centroid-vs-spiral.md)
