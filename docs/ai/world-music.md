# World Music Theory in CardPlay

CardPlay provides deep support for non-Western music traditions, enabling authentic representation and cross-cultural fusion.

## Supported Traditions

### Indian Classical (Carnatic & Hindustani)
Full raga/tala system with gamaka ornaments. See [Carnatic](./carnatic.md).

### Middle Eastern & Arabic
Maqam system with quarter-tones, jins theory, and iqa rhythms.

```typescript
import { getMaqamDetails } from '@cardplay/ai/queries/spec-queries';
const maqam = await getMaqamDetails('bayati');
```

Covers: Egyptian, Levantine, Iraqi, Maghrebi, Turkish makam, Persian dastgah.

### East Asian
Chinese pentatonic modes, Japanese scales (gagaku, min'yo), Korean modes.
See [Chinese](./chinese.md).

### African
Sub-Saharan timeline rhythms, bell patterns, polyrhythm, and cross-rhythm.

```typescript
import { generatePolyrhythm } from '@cardplay/ai/queries/spec-queries';
const poly = await generatePolyrhythm(patterns, density);
```

Covers: West African, Highlife, Afrobeat, Soukous.

### Latin American
Clave-based systems, montuno patterns, Brazilian rhythms, tango.

```typescript
import { generateMontuno, checkClaveAlignment } from '@cardplay/ai/queries/spec-queries';
const montuno = await generateMontuno(chords, 'son');
const aligned = await checkClaveAlignment(pattern, 'son');
```

Covers: Salsa, Son, Mambo, Samba, Bossa Nova, Baião, Tango, Cumbia, Reggaeton.

## Cross-Cultural Fusion

```typescript
import {
  suggestFusionApproach,
  analyzeCulturalElements,
  translateMusicalConcept,
} from '@cardplay/ai/queries/spec-queries';

// Suggest how to fuse two traditions
const approach = await suggestFusionApproach('indian', 'jazz');

// Analyze cultural elements in a piece
const elements = await analyzeCulturalElements({ culture: 'african', rhythm: 'timeline' });

// Translate concepts across traditions
const translation = await translateMusicalConcept('pentatonic_mode', 'chinese', 'western');
```

## Tarab Aesthetics (Arabic)
The concept of tarab (musical ecstasy) in Arabic music — the interaction between performer intensity (saltanah) and audience response.

## Psychophysiology
Chill-inducing patterns, emotional response prediction, and cross-cultural emotion mapping.

## See Also

- [Carnatic](./carnatic.md) - Indian classical music
- [Chinese](./chinese.md) - Chinese music theory
- [Celtic](./celtic.md) - Celtic music theory
- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
