# How to Extend the Music Theory KB

> **Roadmap Item**: C130 Add docs: "How to extend the music theory KB" (facts, predicates, tests).

## Overview

This guide explains how to add new musical knowledge to CardPlay's Prolog knowledge bases. The KB is organized into modules by domain (theory, style, culture) with clear layering from facts to derived predicates to high-level queries.

## KB Architecture

```
src/ai/knowledge/
├── music-theory.pl              # Core theory (intervals, scales, chords)
├── music-theory-computational.pl # GTTM, DFT, Spiral Array
├── music-theory-galant.pl       # 18th century schemata
├── music-theory-film.pl         # Film scoring devices
├── music-theory-world.pl        # Celtic/Carnatic/Chinese basics
├── music-theory-jazz.pl         # Jazz harmony
├── music-theory-spectral.pl     # Spectral analysis
├── music-spec.pl                # MusicSpec predicates, constraints
└── [style/culture-specific KBs]
```

## Layering Convention

Every KB should follow this three-layer structure:

### Layer 1: Facts (Data)

Static data that doesn't change:

```prolog
%% ============================================================================
%% LAYER 1: FACTS
%% ============================================================================

%% scale_degrees(+ScaleName, -Degrees)
%% Define the degrees (semitones from root) for each scale type.
scale_degrees(major, [0, 2, 4, 5, 7, 9, 11]).
scale_degrees(natural_minor, [0, 2, 3, 5, 7, 8, 10]).
scale_degrees(dorian, [0, 2, 3, 5, 7, 9, 10]).
scale_degrees(mixolydian, [0, 2, 4, 5, 7, 9, 10]).

%% chord_intervals(+ChordType, -Intervals)
chord_intervals(major, [0, 4, 7]).
chord_intervals(minor, [0, 3, 7]).
chord_intervals(dominant7, [0, 4, 7, 10]).
```

### Layer 2: Derived Predicates (Logic)

Predicates that compute results from facts:

```prolog
%% ============================================================================
%% LAYER 2: DERIVED PREDICATES
%% ============================================================================

%% scale_contains_pitch(+Scale, +Root, +Pitch)
%% True if Pitch is in the scale rooted at Root.
scale_contains_pitch(Scale, Root, Pitch) :-
  scale_degrees(Scale, Degrees),
  note_index(Root, RootIdx),
  PitchClass is Pitch mod 12,
  member(Deg, Degrees),
  ScalePitch is (RootIdx + Deg) mod 12,
  ScalePitch =:= PitchClass.

%% chord_in_key(+Key, +Mode, +Degree, -ChordRoot, -ChordType)
%% Compute the diatonic chord on a given scale degree.
chord_in_key(Key, Mode, Degree, ChordRoot, ChordType) :-
  scale_degrees(Mode, Degrees),
  nth1(Degree, Degrees, RootOffset),
  note_index(Key, KeyIdx),
  ChordRootIdx is (KeyIdx + RootOffset) mod 12,
  note_index(ChordRoot, ChordRootIdx),
  diatonic_chord_quality(Mode, Degree, ChordType).
```

### Layer 3: Query Predicates (API)

High-level predicates that serve as the API for TypeScript:

```prolog
%% ============================================================================
%% LAYER 3: QUERY PREDICATES
%% ============================================================================

%% analyze_key(+Notes, -Key, -Mode, -Confidence)
%% High-level key detection combining multiple methods.
analyze_key(Notes, Key, Mode, Confidence) :-
  pc_profile(Notes, Profile),
  best_key_weighted(Profile, Key, Mode, Score, _Reasons),
  Confidence is Score / 100.

%% recommend_chord(+Spec, -Chord, -Reasons)
%% Recommend a chord based on current musical context.
recommend_chord(Spec, Chord, Reasons) :-
  spec_key(Spec, Key, Mode),
  spec_style(Spec, Style),
  style_chord_preferences(Style, Prefs),
  select_chord_from_prefs(Key, Mode, Prefs, Chord, Reasons).
```

## Adding New Knowledge

### Step 1: Choose the Right KB File

| Knowledge Type | File |
|---------------|------|
| Basic intervals, scales, chords | `music-theory.pl` |
| Computational models (GTTM, DFT) | `music-theory-computational.pl` |
| Galant schemata | `music-theory-galant.pl` |
| Film scoring | `music-theory-film.pl` |
| Carnatic/Celtic/Chinese | `music-theory-world.pl` |
| MusicSpec constraints | `music-spec.pl` |
| New genre/style | Create new `music-theory-{style}.pl` |

### Step 2: Add Facts

Start with the raw data:

```prolog
%% New raga definition
raga_aroha(charukeshi, [sa, re2, ga2, ma1, pa, dha1, ni1]).
raga_avaroha(charukeshi, [ni1, dha1, pa, ma1, ga2, re2, sa]).
raga_vadi(charukeshi, pa).
raga_samvadi(charukeshi, re2).
raga_thaat(charukeshi, kafi).
raga_time(charukeshi, late_night).
```

### Step 3: Add Derived Predicates

Build logic on top of facts:

```prolog
%% Get all notes in a raga's aroha
raga_notes(Raga, Notes) :-
  raga_aroha(Raga, Notes).

%% Check if a swara is in the raga
raga_contains_swara(Raga, Swara) :-
  raga_aroha(Raga, Aroha),
  member(Swara, Aroha).
raga_contains_swara(Raga, Swara) :-
  raga_avaroha(Raga, Avaroha),
  member(Swara, Avaroha).

%% Compute raga similarity based on shared notes
raga_note_similarity(Raga1, Raga2, Similarity) :-
  raga_aroha(Raga1, A1), raga_aroha(Raga2, A2),
  intersection(A1, A2, Common),
  length(Common, CommonLen),
  length(A1, Len1), length(A2, Len2),
  MaxLen is max(Len1, Len2),
  Similarity is CommonLen / MaxLen.
```

### Step 4: Add Query/Recommend Predicates

Create the API for TypeScript:

```prolog
%% recommend_raga(+Spec, -Raga, -Reasons)
%% Recommend a raga based on current spec.
recommend_raga(Spec, Raga, Reasons) :-
  spec_culture(Spec, carnatic),
  current_time_of_day(TimeCategory),
  raga_time(Raga, TimeCategory),
  Reasons = [because('Raga matches time of day'), raga(Raga)].

recommend_raga(Spec, Raga, Reasons) :-
  spec_constraint(Spec, raga, DesiredRaga),
  raga_note_similarity(Raga, DesiredRaga, Sim),
  Sim > 0.7,
  Reasons = [because('Similar to requested raga'), similarity(Sim)].
```

### Step 5: Add HostAction Generator (If Needed)

If Prolog should push recommendations to cards:

```prolog
%% generate_raga_action(+Spec, -Action)
generate_raga_action(Spec, Action) :-
  recommend_raga(Spec, Raga, Reasons),
  Action = host_action(
    suggest_raga,
    [raga(Raga)],
    Reasons,
    80,
    'recommend_raga/3',
    medium
  ).
```

### Step 6: Register in Loader

If you created a new KB file, add it to the loader:

```typescript
// src/ai/knowledge/music-theory-loader.ts

import newKB from './music-theory-new.pl?raw';

const KB_FILES = [
  // ... existing files
  { name: 'music-theory-new', content: newKB },
];
```

## Writing Tests

### Unit Tests for Predicates

Create tests in TypeScript that query the predicates:

```typescript
// src/ai/knowledge/music-theory-new.test.ts

describe('New KB Predicates', () => {
  let adapter: PrologAdapter;
  
  beforeEach(async () => {
    adapter = await createPrologAdapter();
    await loadMusicTheoryKB(adapter);
  });
  
  it('should find raga aroha', async () => {
    const result = await adapter.querySingle(
      "raga_aroha(charukeshi, Notes)."
    );
    expect(result?.Notes).toBeDefined();
    expect(result?.Notes).toContain('sa');
    expect(result?.Notes).toContain('pa');
  });
  
  it('should compute raga similarity', async () => {
    const result = await adapter.querySingle(
      "raga_note_similarity(charukeshi, bhimpalasi, Sim)."
    );
    expect(result?.Sim).toBeGreaterThan(0);
    expect(result?.Sim).toBeLessThanOrEqual(1);
  });
  
  it('should recommend appropriate raga', async () => {
    const spec = createMusicSpec({ culture: 'carnatic' });
    const result = await recommendRaga(spec, adapter);
    expect(result.value).toBeDefined();
  });
});
```

### Property Tests

For predicates with mathematical properties:

```typescript
it('should have symmetric similarity', async () => {
  const forward = await adapter.querySingle(
    "raga_note_similarity(charukeshi, bhimpalasi, Sim1)."
  );
  const backward = await adapter.querySingle(
    "raga_note_similarity(bhimpalasi, charukeshi, Sim2)."
  );
  expect(forward?.Sim1).toBeCloseTo(backward?.Sim2);
});

it('should have self-similarity of 1.0', async () => {
  const result = await adapter.querySingle(
    "raga_note_similarity(charukeshi, charukeshi, Sim)."
  );
  expect(result?.Sim).toBeCloseTo(1.0);
});
```

## Best Practices

### 1. Use Consistent Naming

```prolog
%% Predicate naming: noun_verb or noun_property
raga_aroha/2          % Good: noun_property
chord_intervals/2     % Good: noun_property
scale_contains_pitch/3 % Good: noun_verb

%% Avoid: action_first style
get_raga_aroha/2      % Avoid
find_chord/3          % Avoid
```

### 2. Document with Comments

```prolog
%% raga_compatibility(+Raga1, +Raga2, -Score)
%% Compute compatibility score for melodic transition between ragas.
%% Score is 0-1, where 1 means highly compatible.
%% 
%% Based on:
%%   - Shared notes (40%)
%%   - Shared vadi/samvadi (30%)
%%   - Same thaat family (30%)
raga_compatibility(Raga1, Raga2, Score) :-
  ...
```

### 3. Handle Edge Cases

```prolog
%% Safe division avoiding divide-by-zero
safe_ratio(_, 0, 0) :- !.
safe_ratio(Num, Denom, Ratio) :-
  Denom > 0,
  Ratio is Num / Denom.
```

### 4. Keep Facts and Logic Separate

Don't embed logic in fact definitions:

```prolog
%% Bad: logic in fact
good_progression(Chord1, Chord2) :- 
  fifths_motion(Chord1, Chord2).

%% Good: separate facts from derived rules
progression_pattern(circle_of_fifths, 5).
progression_pattern(step_up, 2).

good_progression(Chord1, Chord2) :-
  progression_pattern(Pattern, Interval),
  chord_interval(Chord1, Chord2, Interval).
```

### 5. Use Explain Predicates

Always provide explanation variants:

```prolog
%% Basic predicate
recommend_schema(Spec, Schema, Score) :- ...

%% Explain variant for UI
recommend_schema_explain(Spec, Schema, Score, Reasons) :-
  recommend_schema(Spec, Schema, Score),
  gather_schema_reasons(Spec, Schema, Reasons).
```

## See Also

- [C129: How to author a new theory card](./authoring-theory-cards.md)
- [C021: KB layering](./kb-layering.md)
- [C024-C026: Prolog conventions](./prolog-conventions.md)
