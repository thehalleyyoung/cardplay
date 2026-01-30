# Galant Schemata in CardPlay

Galant schemata (Gjerdingen) are stock melodic-harmonic patterns from 18th-century music. CardPlay provides a schema library and matching system.

## Available Schemata

| Schema | Bass Motion | Soprano Motion | Typical Usage |
|--------|-----------|----------------|---------------|
| Romanesca | I–V–vi–III | 8–5–8–3 | Opening gambit |
| Prinner | iv–III–ii–I | 6–5–4–3 | Riposte / answer |
| Fonte | Seq. down from ii | 5–4–4–3 | Sequential modulation |
| Monte | Seq. up | Ascending | Rising energy |
| Do-Re-Mi | I–V–I | 1–2–3 | Opening |
| Sol-Fa-Mi | V–IV–I | 5–4–3 | Cadential approach |
| Meyer | I–V–vi–V–I | 1–7–4–3 | Complete gesture |
| Quiescenza | I (pedal) | 1–♭2–2–1 | Quiet opening |

## Predicates

```prolog
schema(romanesca, [bass([i,v,vi,iii]), soprano([8,5,8,3])]).
schema_match(NoteSequence, SchemaName, Confidence).
schema_chain(Schema1, Schema2, Compatibility).
```

## TypeScript API

```typescript
import { searchConstraints, buildAnalysisResultCard } from '@cardplay/ai/queries/spec-queries';

// Find schema-related constraints
const schemas = searchConstraints('schema');

// Build analysis result for a detected schema
const card = buildAnalysisResultCard('schema', {
  name: 'romanesca',
  confidence: 0.85,
  position: { bar: 1, beat: 1 },
});
```

## Board Templates

CardPlay includes a Galant Board Template with pre-configured schema detection cards:

```typescript
import { GALANT_BOARD_TEMPLATE, GALANT_BOARD_WITH_GATING } from '@cardplay/ai/queries/spec-queries';

// Standard galant board
console.log(GALANT_BOARD_TEMPLATE.name); // 'Galant Schemata'

// With gating constraints
console.log(GALANT_BOARD_WITH_GATING.name); // 'Galant Schemata (Gated)'
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Computational Theory](./computational-theory.md) - GTTM and analysis models
