# Computational Models Supported in CardPlay

> **Roadmap Item**: C212 Add docs: "Computational models supported and when to use them".

## Overview

CardPlay supports multiple computational music theory models for analysis and generation. This document describes each model, its strengths, and when to use it.

## Key Detection Models

### 1. Krumhansl-Schmuckler (K-S) Profiles

**What it is**: Correlation-based key detection using empirically-derived pitch-class profiles.

**How it works**:
1. Count pitch-class occurrences in the music
2. Correlate with 24 template profiles (12 major + 12 minor)
3. Highest correlation = detected key

**Strengths**:
- Well-validated on Western tonal music
- Gives separate major/minor confidence scores
- Easy to interpret

**Weaknesses**:
- Requires sufficient pitch-class coverage
- May struggle with modal music
- 24 comparisons per detection

**When to use**:
- Classical and Romantic music
- Pop/rock with clear major/minor tonality
- When you need major vs minor discrimination

**CardPlay API**:
```typescript
const result = await detectKeyKS(notes, adapter);
// result.value = { root: 'c', mode: 'major', confidence: 0.92 }
```

---

### 2. DFT Phase Detection

**What it is**: Fourier transform-based tonic detection using phase of the k=1 bin.

**How it works**:
1. Build 12-bin pitch-class histogram
2. Compute DFT of the histogram
3. Phase of bin 1 points to tonal center
4. Magnitude indicates tonal clarity

**Strengths**:
- Computationally efficient (single DFT)
- Continuous tonic estimate
- Mode-agnostic initial result
- Magnitude gives confidence directly

**Weaknesses**:
- Doesn't distinguish major/minor
- Needs post-processing for mode
- Less validated than K-S

**When to use**:
- Real-time key tracking
- Modal music (Dorian, Phrygian, etc.)
- Quick approximate detection
- Tonal ambiguity detection (low magnitude)

**CardPlay API**:
```typescript
const result = await detectKeyDFT(notes, adapter);
// result.value = { root: 'g', confidence: 0.78 }
```

---

### 3. Spiral Array

**What it is**: 3D geometric model where pitch classes, chords, and keys are points in space.

**How it works**:
1. Map pitch classes to helix coordinates
2. Chords = centroids of their pitch classes
3. Keys = centroids of their diatonic chords
4. Distance = harmonic relatedness

**Strengths**:
- Intuitive geometric interpretation
- Models chord-key relationships
- Useful for modulation planning
- Good for voice-leading optimization

**Weaknesses**:
- More complex to implement
- Western-centric assumptions
- Doesn't handle non-diatonic music well

**When to use**:
- Chord progression analysis
- Modulation detection and planning
- Voice-leading optimization
- Tonal tension visualization

**CardPlay API**:
```typescript
const distance = await spiralChordKeyDistance(chord, key, adapter);
const fit = 100 - distance * 100; // 0-100 fit score
```

---

### 4. Hybrid Detection

**What it is**: Combines K-S and DFT evidence for more robust detection.

**How it works**:
1. Run both K-S and DFT detection
2. Weight by individual confidence scores
3. Agree = high confidence
4. Disagree = use higher-confidence result

**Strengths**:
- More robust than single method
- Handles edge cases better
- Self-validating (agreement check)

**When to use**:
- Default for production use
- When accuracy is critical
- Unknown musical style

**CardPlay API**:
```typescript
const result = await detectKeyAdvanced(notes, { 
  models: ['ks', 'dft'], 
  weights: { ks: 0.6, dft: 0.4 } 
});
```

---

## Phrase/Grouping Models

### 5. GTTM (Generative Theory of Tonal Music)

**What it is**: Hierarchical analysis based on Lerdahl & Jackendoff's cognitive theory.

**Components**:
- **Grouping Structure**: Segment music into hierarchical groups
- **Metrical Structure**: Assign beat strength by position
- **Time-Span Reduction**: Extract structural notes
- **Prolongational Reduction**: Tension/relaxation hierarchy

**How it works**:
1. Detect grouping boundaries (gaps, leaps, register changes)
2. Assign metrical weights (downbeat = strong)
3. Select head notes per time-span
4. Build prolongational tree

**Strengths**:
- Cognitively motivated
- Hierarchical (captures structure)
- Works on monophonic and homophonic music

**Weaknesses**:
- Complex to implement fully
- Subjective preference rules
- Less applicable to non-Western music

**When to use**:
- Phrase boundary detection
- Extracting melody skeletons
- Guiding phrase-aware generation
- Music summarization

**CardPlay API**:
```typescript
const segments = await segmentPhraseGTTM(events, { sensitivity: 0.7 });
// segments = [{ start: 0, end: 15, confidence: 0.85 }, ...]
```

---

## Similarity/Fingerprint Models

### 6. Motif Fingerprinting

**What it is**: Represent motifs as interval sequences + rhythm patterns.

**How it works**:
1. Extract intervals between consecutive pitches
2. Extract normalized duration ratios
3. Compare using LCS (longest common subsequence)
4. Weight: 60% intervals, 40% rhythm

**Strengths**:
- Transposition-invariant
- Handles transformations (inversion, retrograde)
- Fast comparison

**Weaknesses**:
- Loses absolute pitch information
- Rhythm approximation may miss subtleties

**When to use**:
- Leitmotif tracking
- Theme detection
- Variation analysis

**CardPlay API**:
```typescript
const fingerprint = extractMotifFingerprint(events, 'hero_theme');
const similarity = calculateThemeSimilarity(fp1, fp2);
```

---

### 7. Schema Fingerprinting

**What it is**: Represent galant schemata as scale-degree patterns.

**How it works**:
1. Extract bass line scale degrees
2. Extract upper-voice contour
3. Match against schema templates
4. Score based on degree matches

**Strengths**:
- Key-independent matching
- Captures galant style patterns
- Supports fuzzy matching

**Weaknesses**:
- Limited to galant/classical style
- Requires clear bass/melody separation

**When to use**:
- 18th-century music analysis
- Schema-based generation
- Style recognition

**CardPlay API**:
```typescript
const matches = await matchGalantSchema(degrees, adapter);
// matches = [{ schema: 'prinner', score: 0.92 }, ...]
```

---

## Model Selection Guide

| Task | Recommended Model |
|------|-------------------|
| Key detection (classical) | K-S or Hybrid |
| Key detection (modal) | DFT Phase |
| Key detection (real-time) | DFT Phase |
| Chord-key fit | Spiral Array |
| Modulation planning | Spiral Array |
| Phrase segmentation | GTTM Grouping |
| Melody skeleton | GTTM TSR |
| Theme tracking | Motif Fingerprint |
| 18th-century analysis | Schema Fingerprint |

## Performance Considerations

| Model | Complexity | Typical Time |
|-------|------------|--------------|
| K-S | O(n) | < 1ms |
| DFT | O(n) | < 1ms |
| Spiral | O(1) per chord | < 1ms |
| GTTM Grouping | O(n²) | 5-50ms |
| Motif Similarity | O(m·n) | 1-10ms |

All models are designed to complete in under 100ms for typical inputs (< 1000 events).

## See Also

- [C158: DFT phase approximation](./dft-phase-tonality.md)
- [C170: Spiral Array](./spiral-array.md)
- [C342: Galant schemata](./galant-schemata.md)
