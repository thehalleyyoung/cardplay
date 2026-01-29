# Harmony Explorer Reference

This document provides comprehensive documentation for the Prolog-powered harmony exploration system in the CardPlay AI module.

## Overview

The Harmony Explorer provides intelligent harmonic analysis and suggestions using Prolog-based reasoning. It supports:

- **Chord Suggestions**: Context-aware next chord recommendations
- **Progression Analysis**: Full harmonic analysis with cadence detection
- **Key Detection**: Automatic key identification from pitch content
- **Reharmonization**: Substitution suggestions for chord progressions
- **Modulation Planning**: Pivot chord paths between keys

## Usage

### Basic Setup

```typescript
import { createHarmonyExplorer } from '@cardplay/ai/harmony';

const explorer = createHarmonyExplorer();
```

### Suggest Next Chords

```typescript
const suggestions = await explorer.suggestNextChords(
  { root: 'g', quality: 'major' },  // Current chord (V)
  { root: 'c', mode: 'major' },     // Key context
  { count: 5 }                       // Options
);

// Returns:
// [
//   { chord: { root: 'c', quality: 'major' }, numeral: 'I', reason: 'dominant → tonic', confidence: 95 },
//   { chord: { root: 'a', quality: 'minor' }, numeral: 'vi', reason: 'Deceptive resolution', confidence: 75 },
//   ...
// ]
```

### Analyze Chord Progression

```typescript
const analysis = await explorer.analyzeProgression([
  { root: 'c', quality: 'major' },
  { root: 'g', quality: 'major' },
  { root: 'a', quality: 'minor' },
  { root: 'f', quality: 'major' }
]);

console.log(analysis.key);              // { root: 'c', mode: 'major' }
console.log(analysis.chordAnalyses);    // Array of ChordAnalysis
console.log(analysis.cadences);         // ['Authentic cadence at position 2']
console.log(analysis.summary);          // 'Progression in C major. 100% diatonic...'
```

### Identify Key

```typescript
// From MIDI pitch classes
const pitchClasses = [0, 2, 4, 5, 7, 9, 11];  // C major scale
const key = await explorer.identifyKey(pitchClasses);
// { root: 'c', mode: 'major' }
```

### Suggest Reharmonization

```typescript
const suggestions = await explorer.suggestReharmonization(
  [60, 64, 67],  // Melody notes (C E G)
  [
    { root: 'c', quality: 'major' },
    { root: 'g', quality: 'dom7' }
  ],
  { root: 'c', mode: 'major' }
);

// Returns substitution options:
// [
//   { original: G7, replacement: Db7, type: 'tritone', explanation: '...' },
//   { original: C, replacement: Am, type: 'relative', explanation: '...' }
// ]
```

### Plan Modulation

```typescript
const path = await explorer.suggestModulation(
  { root: 'c', mode: 'major' },
  { root: 'g', mode: 'major' }
);

console.log(path.pivotChords);  // [{ root: 'd', quality: 'dom7' }]
console.log(path.steps);        // ['Use dominant of target key as pivot', ...]
```

## Chord Suggestion Logic

The `suggestNextChords` method uses harmonic function theory:

| From Function | Valid Progressions | Common Resolutions |
|---------------|-------------------|-------------------|
| Tonic | → Subdominant, Dominant | I → IV, I → V |
| Subdominant | → Dominant, Tonic | IV → V, ii → V |
| Dominant | → Tonic | V → I, V → vi (deceptive) |

### Prolog Predicates Used

```prolog
chord_tendency(tonic, subdominant).
chord_tendency(tonic, dominant).
chord_tendency(subdominant, dominant).
chord_tendency(subdominant, tonic).
chord_tendency(dominant, tonic).
chord_tendency(dominant, submediant).  % Deceptive
```

## Chord Analysis

The `analyzeChord` method returns detailed harmonic information:

```typescript
interface ChordAnalysis {
  numeral: string;        // 'I', 'V7', 'ii', etc.
  degree: number;         // 1-7
  function: HarmonicFunction;  // 'tonic' | 'subdominant' | 'dominant'
  tension: number;        // 0 (stable) to 5 (high tension)
  isDiatonic: boolean;    // True if chord belongs to key
  borrowedFrom?: string;  // If borrowed, source mode
}
```

### Tension Levels

| Degree | Tension | Function |
|--------|---------|----------|
| I | 0 | Tonic |
| vi | 1 | Tonic |
| iii | 1 | Tonic |
| IV | 2 | Subdominant |
| ii | 3 | Subdominant |
| V | 4 | Dominant |
| vii° | 5 | Dominant |

## Progression Analysis

The `analyzeProgression` method provides comprehensive analysis:

```typescript
interface ProgressionAnalysis {
  key: KeyInfo;                    // Detected key
  keyConfidence: number;           // 0-100
  chordAnalyses: ChordAnalysis[];  // Per-chord analysis
  cadences: string[];              // Detected cadences
  voiceLeadingQuality: number;     // 0-100
  summary: string;                 // Human-readable summary
}
```

### Cadence Detection

| Cadence | Pattern | Description |
|---------|---------|-------------|
| Authentic | V → I | Strong resolution |
| Plagal | IV → I | "Amen" cadence |
| Deceptive | V → vi | Unexpected resolution |
| Half | * → V | Ends on dominant |

## Key Detection

Uses the Krumhansl-Schmuckler key-finding algorithm:

```typescript
const key = await explorer.identifyKey(pitchClasses);
```

The algorithm:
1. Counts pitch class occurrences
2. Correlates with major/minor key profiles
3. Returns best matching key

## Reharmonization Suggestions

### Substitution Types

| Type | Description | Example |
|------|-------------|---------|
| tritone | Replace V7 with bII7 | G7 → Db7 |
| relative | Major ↔ relative minor | C → Am |
| ii-V | Add ii before V | G7 → Dm7 G7 |

## Modulation Paths

The explorer suggests modulation strategies:

### Close Key Modulation (1-2 accidentals difference)
- Uses dominant of target key as pivot
- Circle of fifths movement

### Parallel Mode Change
- Direct switch between major/minor
- Same root, different quality

### Distant Modulation
- Uses ii-V of target key
- Multi-step approach through pivot chords

## Voice Leading Scoring

```typescript
const score = await explorer.scoreVoiceLeading(chord1, chord2);
// Returns 0-100 based on root movement
```

| Root Movement | Score | Quality |
|---------------|-------|---------|
| P4/P5 | 90 | Strong |
| m3/M3 | 85 | Smooth |
| M2 | 80 | Okay |
| m2 | 75 | Chromatic |
| Tritone | 70 | Tense |

## Types Reference

### ChordInfo

```typescript
interface ChordInfo {
  root: string;     // 'c', 'fsharp', etc.
  quality: string;  // 'major', 'minor', 'dom7', etc.
}
```

### KeyInfo

```typescript
interface KeyInfo {
  root: string;  // Note name
  mode: string;  // 'major' or 'minor'
}
```

### ChordSuggestion

```typescript
interface ChordSuggestion {
  chord: ChordInfo;     // Suggested chord
  numeral: string;      // Roman numeral
  reason: string;       // Why this suggestion
  confidence: number;   // 0-100
}
```

### ModulationPath

```typescript
interface ModulationPath {
  targetKey: KeyInfo;        // Destination key
  pivotChords: ChordInfo[];  // Transitional chords
  steps: string[];           // Explanation steps
}
```

## Integration Example

```typescript
import { createHarmonyExplorer } from '@cardplay/ai/harmony';
import { createChordGenerator } from '@cardplay/ai/generators';

async function analyzeAndEnhance(chords: ChordInfo[]) {
  const explorer = createHarmonyExplorer();
  const generator = createChordGenerator();
  
  // Analyze current progression
  const analysis = await explorer.analyzeProgression(chords);
  console.log('Key:', analysis.key);
  console.log('Cadences:', analysis.cadences);
  
  // Get suggestions for what comes next
  const lastChord = chords[chords.length - 1];
  const suggestions = await explorer.suggestNextChords(lastChord, analysis.key);
  
  // Get reharmonization options
  const reharm = await explorer.suggestReharmonization([], chords, analysis.key);
  
  return { analysis, suggestions, reharm };
}
```

## Performance

- Chord suggestions: < 20ms after KB loaded
- Progression analysis: < 50ms for 16 chords
- Key detection: < 10ms

## See Also

- [music-theory-predicates.md](./music-theory-predicates.md) - Underlying theory KB
- [generators-reference.md](./generators-reference.md) - Chord generation
- [phrase-adaptation.md](./phrase-adaptation.md) - Phrase transposition
