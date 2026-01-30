# Carnatic (Indian Classical) Music in CardPlay

CardPlay provides deep support for Carnatic and Hindustani music theory, including raga/tala systems, gamaka ornaments, and compositional forms.

## Raga System

### Melakarta (72 parent scales)

The Carnatic system uses 72 melakarta ragas as parent scales, each with janya (derived) ragas.

```typescript
import { getRagaDetails } from '@cardplay/ai/queries/spec-queries';

const raga = await getRagaDetails('mayamalavagowla');
// Returns: aroha, avaroha, vadi, samvadi, gamakas, time associations
```

### Key Predicates

```prolog
raga_database(RagaName, Aroha, Avaroha, Vadi, Samvadi).
melakarta_system(MelaNumber, Name, Swaras).
janya_raga(JanyaRaga, ParentMelakarta).
raga_pakad(RagaName, CharacteristicPhrase).
raga_time_theory(RagaName, Prahar, Appropriateness).
raga_rasa(RagaName, DominantRasa).
```

## Tala System

### Structure

Talas are rhythmic cycles defined by angas (sections) and aksharas (beats).

```typescript
import { calculateTihai } from '@cardplay/ai/queries/spec-queries';

const tihai = await calculateTihai(
  { pattern: [1, 2, 3, 4], gap: 1 },
  { name: 'adi', aksharas: 32 },
);
// Returns tihai that lands on sam (beat 1)
```

### Key Predicates

```prolog
tala_definition(TalaName, Angas, Aksharas, Jaatis).
laya_type(LayaName, TempoMultiplier, Description).
tihai_calculation(Pattern, Gap, Cycles, ValidTihai).
korvai_structure(Pattern, Repetitions, Landing).
```

## Gamaka (Ornaments)

Gamakas are the micro-ornaments that give ragas their characteristic flavor:

| Gamaka | Description |
|--------|-------------|
| Kampita | Oscillation |
| Jaru | Slide |
| Odukkal | Stress/emphasis |
| Nokku | Subtle touch |
| Sphurita | Quick deflection |

```prolog
gamaka_type(GamakaName, Description, Notation).
gamaka_for_swara(RagaName, Swara, ApproprGamakas).
```

## Compositional Forms

- **Alapana**: Free-form exploration of the raga
- **Tanam**: Rhythmic elaboration
- **Pallavi**: Theme statement and development
- **Niraval**: Melodic variations on a line
- **Kalpana Swara**: Improvised solmization passages

```typescript
import { generateKalpanaSwara } from '@cardplay/ai/queries/spec-queries';

const swaras = await generateKalpanaSwara('shankarabharanam', 'adi', 16);
```

## Constraints

```typescript
// Available constraints for Indian music
{ type: 'raga', hard: true, raga: 'mayamalavagowla' }
{ type: 'tala', hard: true, tala: 'adi' }
{ type: 'laya', hard: false, laya: 'madhya' }
{ type: 'gamaka_density', hard: false, density: 'moderate' }
```

## Fusion

Raga-Western mappings enable cross-cultural composition:

```prolog
fusion_raga_mapping(RagaName, WesternMode, Notes).
raga_chord_compatibility(RagaName, ChordType, Compatibility).
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Chinese](./chinese.md) - Chinese music theory
- [Celtic](./celtic.md) - Celtic music theory
