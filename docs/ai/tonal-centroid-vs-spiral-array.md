# Tonal Centroid vs Spiral Array (Branch C)

Branch C includes multiple “tonality geometry” tools that can be used to compare keys/chords/segments beyond simple pitch-class overlap.

CardPlay currently exposes two lightweight (and intentionally approximate) geometric models:
- **Spiral Array** (3D embedding; chord/key points and distances)
- **Tonal centroid** (6D embedding derived from DFT bins k=1,2,3)

This doc explains what each model is good for, and the practical tradeoffs.

## What’s implemented in the repo

### Spiral Array (3D)

Prolog: `src/ai/knowledge/music-theory-computational.pl`
- `spiral_point_pc/2`, `spiral_point_note/2`
- `spiral_chord_point/3`, `spiral_key_point/3`
- `spiral_distance/3`, `spiral_chord_key_distance/5`
- `spiral_best_key/3`, `spiral_best_voicing/4`

Use cases in CardPlay:
- **Chord ↔ key “fit”** explanations (`spiral_chord_key_distance/5` reasons)
- **Voicing choice** (minimize voice-leading + “tension”) via `spiral_best_voicing/4`

### Tonal centroid (6D, DFT-derived)

Prolog: `src/ai/knowledge/music-theory-computational.pl`
- `tonal_centroid/2` → `centroid(R1,I1,R2,I2,R3,I3)`
- `centroid_distance/3`

TypeScript wrappers: `src/ai/queries/spec-queries.ts`
- `getTonalCentroid(profile)`
- `getCentroidDistance(a, b)`

Use cases in CardPlay:
- **Segment-to-segment similarity** when you already have PCPs (e.g., windowed analysis)
- **Continuous drift metrics** (smooth distance curves rather than discrete key labels)

## Practical tradeoffs

### Inputs: chords vs profiles

- Spiral Array tooling is most interpretable when you have **chords** (or at least chord guesses), because it directly models chord/key points and can generate reasons in those terms.
- Tonal centroid tooling is most natural when you have **pitch-class profiles** (PCPs) from raw events and want a distance without committing to a single key label.

### Interpretability

- Spiral distances are easier to narrate as “this chord sits closer/farther from this key center”, which fits UI explainability.
- Tonal centroid distances are more abstract (“6D DFT space distance”), best used internally for ranking/smoothing or shown as a meter/curve.

### Sensitivity / robustness

- Tonal centroid (k=1..3 only) tends to be a **coarser global descriptor**; it can be robust to local chord-level noise but may collapse distinct harmonic functions into similar centroids.
- Spiral Array (as implemented here) can be **more chord-function-sensitive**, but inherits any errors in chord labeling and the approximations of the 3D embedding.

### When to prefer which (rule of thumb)

- Prefer **Spiral Array** when:
  - you want **chord-aware** reasoning (voicings, chord-key fit),
  - you need **human-readable explanations**,
  - you’re operating in functional harmony / film harmony workflows.

- Prefer **tonal centroid** when:
  - you’re doing **windowed analysis** over events,
  - you want a continuous **similarity / drift** signal,
  - you’re comparing segments that may not have stable chord labels.

## Limitations (important)

Both models are intentionally lightweight to keep Tau Prolog execution bounded:
- Spiral Array is an **approximation** (not a full tonal pitch space implementation).
- Tonal centroid uses only bins **k=1..3**, which is a pragmatic low-dimensional summary rather than a full tonal model.

If you need a higher-fidelity model later, treat these as “good-enough, explainable, fast” building blocks rather than ground truth.

