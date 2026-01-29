# DFT Phase Approximation of Tonality

> **Roadmap Item**: C158 Add docs: "DFT phase approximation of tonality" (how/why, limitations).

## Overview

The Discrete Fourier Transform (DFT) phase method is an alternative to correlation-based key detection (like Krumhansl-Schmuckler). It treats the pitch-class distribution as a circular signal and uses the phase of specific DFT bins to estimate the tonic.

## Why Use DFT Phase?

### Advantages over K-S Correlation

1. **Computationally Efficient**: Single DFT computation vs. 24 correlations
2. **Continuous Output**: Phase gives a continuous tonic estimate, not discrete keys
3. **Robust to Missing Tones**: Less sensitive to incomplete pitch-class coverage
4. **Mode-Agnostic Initial Estimate**: Phase of bin k=1 gives tonic without assuming major/minor

### When to Use DFT Phase

- Real-time key tracking during playback
- Modal music where major/minor templates don't apply
- Quick approximate key detection before detailed analysis
- Detecting tonal ambiguity (low magnitude = unclear tonality)

## How It Works

### The Pitch-Class Circle

Pitch classes form a circle of 12 points. A key's tonic creates a "center of mass" in this circular distribution:

```
        C (0)
      B   C#
    A#      D
   A          D#
    G#      E
      G   F
        F# (6)
```

### DFT Computation

Given a pitch-class profile $p = [p_0, p_1, ..., p_{11}]$ (counts or weights for each pitch class), compute the DFT:

$$X_k = \sum_{n=0}^{11} p_n \cdot e^{-2\pi i k n / 12}$$

For key detection, we care about bin $k=1$:

$$X_1 = \sum_{n=0}^{11} p_n \cdot e^{-2\pi i n / 12}$$

### Phase as Tonic

The phase of $X_1$ tells us the "center of mass" on the pitch-class circle:

$$\text{phase} = \arctan2(\text{Im}(X_1), \text{Re}(X_1))$$

Convert phase to pitch class:

$$\text{tonic estimate} = \frac{\text{phase} \cdot 12}{2\pi} \mod 12$$

### Magnitude as Confidence

The magnitude $|X_1|$ indicates how strongly the profile is centered:

- **High magnitude**: Clear tonal center
- **Low magnitude**: Ambiguous or atonal
- **Near zero**: Evenly distributed (chromatic, twelve-tone)

## Prolog Implementation

```prolog
%% dft_bin/4 - Compute DFT bin k for a 12-element profile
%% dft_bin(+Profile, +K, -Complex, -Magnitude)
dft_bin(Profile, K, c(Re, Im), Mag) :-
  compute_dft_bin(Profile, K, 0, 0, Re, Im),
  Mag is sqrt(Re*Re + Im*Im).

%% dft_phase_key/3 - Estimate tonic from phase
%% dft_phase_key(+Profile, -KeyRoot, -Confidence)
dft_phase_key(Profile, KeyRoot, Confidence) :-
  dft_bin(Profile, 1, c(Re, Im), Mag),
  Phase is atan2(Im, Re),
  TonicFloat is mod(Phase * 12 / (2 * pi), 12),
  TonicIdx is round(TonicFloat),
  note_index(KeyRoot, TonicIdx),
  normalize_magnitude(Profile, Mag, Confidence).
```

## TypeScript Usage

```typescript
import { detectKeyDFT } from '@cardplay/ai/queries/spec-queries';

// Detect key from MIDI notes
const notes = [60, 64, 67, 72, 60, 62, 64, 65, 67]; // C major scale fragment
const result = await detectKeyDFT(notes);

console.log(result.value.root);       // 'c'
console.log(result.value.confidence); // 0.85 (high confidence)
console.log(result.reasons);          // ['DFT phase points to C', 'High magnitude indicates clear tonal center']
```

## Combining with K-S

DFT phase and K-S correlation can be combined for more robust detection:

```prolog
%% best_key_weighted/5 - Combine DFT and K-S evidence
best_key_weighted(Profile, Key, Mode, Score, Reasons) :-
  dft_phase_key(Profile, DFTKey, DFTConf),
  ks_best_key(Profile, KSKey, KSMode, KSScore),
  ( DFTKey = KSKey 
    -> Key = DFTKey, Score is (DFTConf + KSScore) / 2,
       Reasons = [because('DFT and K-S agree')]
    ; DFTConf > KSScore
      -> Key = DFTKey, Score = DFTConf,
         Reasons = [because('DFT more confident')]
      ;  Key = KSKey, Mode = KSMode, Score = KSScore,
         Reasons = [because('K-S more confident')]
  ).
```

## Limitations

### 1. Octave Ambiguity

DFT phase detects the pitch class but cannot distinguish octaves. This is usually fine for key detection.

### 2. Mode Determination

Phase alone doesn't tell you major vs. minor. You need additional analysis:

- Compare profile to major/minor templates
- Check for characteristic scale degrees (♭3, ♭6, ♭7)
- Use the k=5 bin (perfect fifth relationship)

### 3. Enharmonic Equivalence

DFT treats all enharmonic equivalents the same (C♯ = D♭). For notation purposes, you need contextual spelling rules.

### 4. Non-12-TET Music

This method assumes 12-tone equal temperament. For music with microtones:
- Carnatic music with shrutis
- Arabic maqamat with quarter tones
- Just intonation performances

Use culture-specific detection methods instead.

### 5. Chromatic Passages

Highly chromatic music may have low DFT magnitude, making the phase unreliable. Check magnitude before trusting phase:

```prolog
dft_key_reliable(Profile) :-
  dft_bin(Profile, 1, _, Mag),
  Mag > 0.3.  % Threshold for reliability
```

### 6. Short Excerpts

Very short passages may not have enough pitch-class coverage for reliable detection. Require minimum note count:

```prolog
sufficient_data_for_dft(Notes) :-
  length(Notes, Len),
  Len >= 8.  % At least 8 notes
```

## See Also

- [C170: Spiral Array for chords/keys](./spiral-array.md)
- [C212: Computational models supported](./computational-models.md)
- [C242: Tonal centroid vs Spiral Array](./tonal-centroid-vs-spiral.md)
