# Galant Schemata in CardPlay

> **Roadmap Item**: C342 Add docs: "Galant schemata in CardPlay" (what they are, how to use).

## What Are Galant Schemata?

Galant schemata are stock musical patterns from 18th-century music—melodic-harmonic "formulas" that composers used as building blocks. Identified by music theorist Robert Gjerdingen, these patterns represent the learned vocabulary of the galant style.

Think of them as "musical idioms"—just as we say "once upon a time" to start a story, galant composers used patterns like the **Prinner** to descend toward a cadence or the **Romanesca** to create a stately opening.

## Why Use Schemata in CardPlay?

1. **Style-Authentic Generation**: Generate phrases that sound genuinely 18th-century
2. **Phrase Structure**: Schemata provide ready-made melodic/bass frameworks
3. **Harmonic Guidance**: Each schema implies a chord progression
4. **Educational Value**: Learn galant style by manipulating schemata
5. **Constraint-Based Composition**: Use schemata as constraints for generators

## Schemata Supported

### Opening Schemata

These typically begin phrases or sections:

#### Romanesca
- **Character**: Stately, processional
- **Bass**: ① → ⑦ → ① → ⑦ (descending then repeating)
- **Upper voice**: ⑤ → ③ → ① → ⑦ (parallel tenths)
- **Typical use**: Opening gambits, ground bass patterns

```
Bass:    C   B   C   B
Upper:   G   E   C   B
Chord:   I  V6   I  V6
```

#### Sol-Fa-Mi
- **Character**: Rising energy, question
- **Bass**: ⑤ → ④ → ③
- **Upper voice**: ② → ⑦ → ①
- **Typical use**: Phrase openings, half cadence setup

### Continuation Schemata

These carry the phrase forward:

#### Prinner
- **Character**: Descending, relaxing, "winding down"
- **Bass**: ④ → ③ → ② → ①
- **Upper voice**: ⑥ → ⑤ → ④ → ③ (parallel 10ths)
- **Typical use**: Response to an opening, pre-cadential descent

```
Bass:    F   E   D   C
Upper:   A   G   F   E
Chord:   IV  I6  ii6  I
```

#### Monte
- **Character**: Rising, building energy
- **Bass**: ① → ② (then sequence up)
- **Pattern**: Ascending by step, modulating
- **Typical use**: Dramatic rise, development sections

#### Fonte
- **Character**: Descending sequences
- **Bass**: Descends by step through two-bar units
- **Pattern**: ii-V-I in minor, then major
- **Typical use**: Sequential passages, harmonic motion

### Cadential Schemata

These conclude phrases:

#### Cadenza Doppia
- **Character**: Elaborate, virtuosic cadence
- **Pattern**: Extended dominant with melodic flourish
- **Typical use**: Fermata cadences, solo passages

#### Meyer
- **Character**: Deceptive/chromatic approach
- **Upper voice**: ① → ⑦ → ♯④ → ⑤
- **Typical use**: Chromatic color before cadence

#### Quiescenza
- **Character**: Resting, pedal point
- **Bass**: Sustained ⑤ pedal
- **Typical use**: Pre-cadential prolongation

## Using Schemata in CardPlay

### 1. Schema Browser Card

Browse and preview available schemata:

```typescript
// Open schema browser
await openCard('schema-browser');

// Preview a schema in the current key
await previewSchema('prinner', { key: 'G', mode: 'major' });
```

### 2. Generate from Schema

Create MIDI events from a schema:

```typescript
import { realizeSchema } from '@cardplay/ai/queries/spec-queries';

const result = await realizeSchema('prinner', {
  key: 'c',
  mode: 'major',
  startBar: 4,
  barsPerDegree: 0.5, // Half bar per schema degree
});

// result.bass = MIDI events for bass line
// result.upper = MIDI events for upper voice
// result.chords = Chord symbols
```

### 3. Match Schema in Analysis

Detect which schema a phrase resembles:

```typescript
import { matchGalantSchema } from '@cardplay/ai/queries/spec-queries';

// Analyze a bass line (scale degrees)
const bassline = [4, 3, 2, 1]; // F E D C in C major
const matches = await matchGalantSchema(bassline);

// matches[0] = { schema: 'prinner', score: 95 }
```

### 4. Schema as Constraint

Use schema as a phrase generator constraint:

```typescript
const spec = withConstraints(createMusicSpec(), [
  schemaConstraint('prinner'),
  { type: 'cadence', cadenceType: 'pac', hard: true, weight: 1 },
]);

const phrase = await generatePhrase(spec);
// Phrase will follow Prinner pattern and end with PAC
```

### 5. Schema Chaining

Build longer forms from schema sequences:

```typescript
const chain = await recommendSchemaChain(spec, { length: 4 });
// chain = ['romanesca', 'monte', 'prinner', 'cadenza_doppia']

// Generate each in sequence
for (const schema of chain) {
  await realizeSchema(schema, { ...opts, startBar });
  startBar += 4;
}
```

## Schema Variation Operators

Transform schemata while preserving their identity:

### Transpose
Move to a different scale degree:
```prolog
schema_variation(prinner, transpose(2), prinner_on_ii).
% Prinner starting on ⑤-④-③-② instead of ④-③-②-①
```

### Invert
Flip the melodic direction:
```prolog
schema_variation(prinner, invert, ascending_prinner).
% Bass rises ①-②-③-④ instead of descending
```

### Sequence
Repeat the pattern at different pitch levels:
```prolog
schema_variation(fonte, sequence(2), double_fonte).
% Two iterations of Fonte, descending
```

### Diminution
Add passing tones and ornaments:
```prolog
schema_variation(prinner, diminution, ornamented_prinner).
% Same framework with 16th-note elaborations
```

## Recommended Decks

### Galant Phrase Deck
- Schema Browser Card
- Schema-to-Chords Card
- Schema-to-Melody Card
- Cadence Type Card

### Galant Analysis Deck
- Schema Matcher Card
- Phrase Boundary Card
- GTTM Grouping Card
- Key Detection Card

### Partimento Practice Deck
- Schema Browser Card
- Figured Bass Card
- Voice Leading Card
- Realization Card

## Example Projects

### 1. Galant Sentence in C
A complete 8-bar sentence using schemata:

```
Bars 1-2: Romanesca (opening)
Bars 3-4: Monte (continuation, rising)
Bars 5-6: Prinner (descent toward cadence)
Bars 7-8: Cadenza Doppia (final cadence)
```

### 2. Variation Set
Theme + variations using schema transformations:

```
Theme: Prinner (basic)
Var 1: Prinner with diminution (16th notes)
Var 2: Inverted Prinner (ascending)
Var 3: Prinner with chromaticism
Var 4: Prinner in parallel minor
```

## Prolog Predicates

### Schema Facts
```prolog
schema(prinner).
schema_category(prinner, continuation).
schema_bass_degrees(prinner, [4, 3, 2, 1]).
schema_upper_degrees(prinner, [6, 5, 4, 3]).
schema_chords(prinner, [iv, i6, ii6, i]).
```

### Schema Matching
```prolog
%% match_schema(+Degrees, -Schema, -Score)
match_schema([4,3,2,1], prinner, 100).
match_schema([4,3,2,1,7], prinner_extended, 85).
```

### Schema Realization
```prolog
%% schema_realize_harmony(+Key, +Schema, -Chords, -Reasons)
schema_realize_harmony(c, prinner, [f_major, c_major_6, d_minor_6, c_major], Reasons).
```

## See Also

- [C302-C312: Schema Cards](../cards/schema-cards.md)
- [C314-C327: Partimento and Voice Leading](../partimento.md)
- [C328-C338: Phrase Forms](../phrase-forms.md)
