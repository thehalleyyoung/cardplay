# Tonal Centroid vs Spiral Array: Tradeoffs

This document compares two geometric approaches to representing tonality in CardPlay.

## Overview

Both **Tonal Centroid** (DFT-based) and **Spiral Array** map pitch-class information to geometric space, enabling distance-based computations for key detection, chord relationships, and modulation planning.

## Tonal Centroid (DFT Approach)

### How It Works
- Uses Discrete Fourier Transform on the 12-bin pitch-class profile
- Extracts components at k=1 (fifths), k=2 (major thirds), k=3 (minor thirds)
- Produces a 6D point (real + imaginary parts for each component)
- Distance = Euclidean distance in 6D space

### Advantages
1. **Mathematically principled**: Direct spectral decomposition
2. **Rotation invariant**: Transposition = rotation (preserves magnitude)
3. **Fast computation**: O(12) for direct DFT or O(12 log 12) for FFT
4. **Mode-agnostic**: Works equally well for modal music
5. **Continuous**: Handles microtonal or ambiguous contexts gracefully

### Disadvantages
1. **Less intuitive**: 6D space harder to visualize
2. **No voice-leading**: Doesn't model chord-to-chord motion
3. **Chromatic blind spots**: Some chromatic relations less salient

### Best For
- Modal music (Dorian, Mixolydian, etc.)
- Jazz with borrowed chords
- Ambient/EDM with chromatic shifts
- Cultures with non-Western modes

## Spiral Array (Chew)

### How It Works
- Maps pitches to 3D helix: position = (r·cos(θ), r·sin(θ), h·p)
- θ = (7π/6)·p for pitch-class p (fifths spiral)
- Chords = weighted centroid of component pitches
- Keys = centroid of scale-degree weights
- Distance = Euclidean distance in 3D

### Advantages
1. **Intuitive geometry**: 3D helix is visualizable
2. **Voice-leading aware**: Nearby chords share tones
3. **Chromatic mediants**: Captures Romantic relationships well
4. **Tension modeling**: Distance from key center = tension

### Disadvantages
1. **Western-centric**: Assumes 12-TET and major/minor duality
2. **Mode conflation**: Some modes map to same region
3. **Arbitrary parameters**: Weights (w₀, w₁, w₂) need tuning

### Best For
- Common-practice Western music (Baroque–Romantic)
- Film music with chromatic mediants
- Chord progression planning
- Modulation path finding

## When to Use Each

| Context | Recommended Model |
|---------|-------------------|
| Carnatic/raga | Tonal Centroid (mode-friendly) |
| Celtic folk | Tonal Centroid (modal) |
| Chinese traditional | Neither (use pentatonic model) |
| Galant | Spiral Array (functional) |
| Film/cinematic | Spiral Array (chromatic) |
| Jazz | Tonal Centroid (modal harmony) |
| EDM | Tonal Centroid (ambiguity) |

## In CardPlay

The `recommend_tonality_model/3` predicate automatically selects:

```prolog
recommend_tonality_model(Spec, spiral_array, Reasons) :-
  member(style(cinematic), Spec),
  Reasons = [because('Cinematic style benefits from spiral tension modeling')].

recommend_tonality_model(Spec, dft_phase, Reasons) :-
  constraint(grouping(modal)),
  Reasons = [because('Modal grouping constraint suggests DFT phase model')].
```

## Hybrid Approach

CardPlay supports using **both** models:
1. DFT for segment-level key detection (fast, robust)
2. Spiral Array for chord-to-chord relationships (tension, voice-leading)

This is configured via the `tonality_model` spec parameter:
- `ks_profile` — Krumhansl-Schmuckler (fastest)
- `dft_phase` — Tonal Centroid
- `spiral_array` — Chew Spiral Array
- `hybrid` — DFT for keys, Spiral for chords

## References

- Chew, E. (2000). *Towards a Mathematical Model of Tonality*
- Temperley, D. (2007). *Music and Probability*
- Müller, M. (2015). *Fundamentals of Music Processing*
