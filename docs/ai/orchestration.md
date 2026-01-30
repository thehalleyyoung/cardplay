# Orchestration Theory in CardPlay

CardPlay provides computational orchestration tools based on classical orchestration principles (Rimsky-Korsakov, Piston, Adler, Kennan/Grantham) and modern algorithmic approaches.

## Spectral Music

Based on the work of Grisey and Murail, spectral composition uses the harmonic series as source material:

```typescript
import { calculateSpectralCentroid, morphSpectrum } from '@cardplay/ai/queries/spec-queries';

// Analyze brightness
const centroid = calculateSpectralCentroid(spectrum);

// Morph between two spectra
const result = morphSpectrum(spec1, spec2, 0.5); // halfway
```

## Orchestral Balance

```typescript
import { getOrchestralWeight, allocateOrchestrationRoles } from '@cardplay/ai/queries/spec-queries';

// Check orchestral weight
const weight = await getOrchestralWeight(['flute', 'oboe', 'clarinet'], 'mf');

// Allocate roles
const roles = allocateOrchestrationRoles(6, 'film');
```

## Set Theory & Neo-Riemannian Analysis

```typescript
import { findParsimoniousPath } from '@cardplay/ai/queries/spec-queries';

// Find minimal voice-leading path between chords
const path = findParsimoniousPath(
  { root: 'c', quality: 'major', duration: 4 },
  { root: 'a', quality: 'minor', duration: 4 },
);
```

## Piano-to-Orchestra Expansion

```typescript
import { expandPianoToOrchestra, solveOrchestration } from '@cardplay/ai/queries/spec-queries';

// Expand piano score to orchestral arrangement
const orchestral = await expandPianoToOrchestra(pianoScore, 'romantic');

// Solve orchestration problem with constraints
const solution = await solveOrchestration(target, constraints);
```

## Classical Orchestration Predicates

Based on standard references:
- `rimsky_korsakov_rule/3` — Principles of Orchestration
- `piston_orchestration_principle/3` — Piston's Orchestration
- `adler_doubling_rule/4` — Adler's Study of Orchestration
- `kennan_grantham_rule/3` — Kennan/Grantham technique

## See Also

- [Computational Theory](./computational-theory.md) - Analysis models
- [Film Music](./film-music.md) - Film scoring orchestration
- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
