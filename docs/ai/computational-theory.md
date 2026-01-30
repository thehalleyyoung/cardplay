# Computational Music Theory in CardPlay

This document covers the computational music theory models implemented in CardPlay's knowledge base.

## GTTM (Generative Theory of Tonal Music)

Lerdahl & Jackendoff's GTTM provides the foundation for phrase structure analysis.

### Predicates

- `gttm_grouping_rule/3` — Applies grouping preference rules (proximity, similarity, parallelism)
- `gttm_metrical_preference/3` — Metrical well-formedness rules
- `gttm_time_span_reduction/3` — Time-span reduction (head selection)
- `gttm_prolongational_reduction/3` — Prolongational reduction (tension/relaxation)

### TypeScript Wrappers

```typescript
import { analyzeGTTMGrouping } from '@cardplay/ai/queries/spec-queries';

const grouping = await analyzeGTTMGrouping(noteSequence);
// Returns GroupingStructure with boundaries and hierarchy
```

## Spiral Array Model (Chew)

Elaine Chew's Spiral Array maps pitches, chords, and keys to 3D space for tonal analysis.

### Predicates

- `spiral_pitch_embedding/3` — Maps pitch class to 3D coordinates
- `spiral_chord_centroid/3` — Computes chord centroid in spiral space
- `spiral_key_center/3` — Finds key center for a passage

### TypeScript Wrappers

```typescript
import { spiralPitchEmbeddingTS, spiralChordCentroidTS } from '@cardplay/ai/queries/spec-queries';

const embedding = spiralPitchEmbeddingTS(0); // C = pitch class 0
// Returns [x, y, z] coordinates

const centroid = spiralChordCentroidTS([0, 4, 7]); // C major
// Returns [cx, cy, cz] centroid
```

## DFT / Phase Space Analysis

Discrete Fourier Transform applied to pitch-class distributions for key-finding and tonal analysis.

### Predicates

- `dft_pitch_class_profile/2` — Computes DFT of a pitch-class histogram
- `dft_key_correlation/3` — Correlates DFT coefficients with key profiles
- `dft_tonal_centroid/2` — Tonal centroid via DFT (Harte et al.)

### TypeScript Wrappers

```typescript
import { analyzeLCCGravity } from '@cardplay/ai/queries/spec-queries';

const gravity = await analyzeLCCGravity(pitchClasses, referencePitch);
// Returns tonal gravity analysis
```

## Krumhansl-Schmuckler Key-Finding

Probe-tone profiles for automatic key detection.

### Predicates

- `ks_major_profile/1` — Major key probe-tone ratings
- `ks_minor_profile/1` — Minor key probe-tone ratings
- `ks_key_correlation/3` — Correlates a pitch histogram with all 24 key profiles

## Feature Flags

Experimental models can be toggled via feature flags:

```typescript
import { getActiveFeatureFlags } from '@cardplay/ai/queries/spec-queries';

const flags = getActiveFeatureFlags();
// { spiralArray: true, dftAnalysis: true, gttmGrouping: true, ... }
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Prolog Reference](./prolog-reference.md) - Prolog engine details
