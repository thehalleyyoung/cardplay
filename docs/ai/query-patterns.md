# Query Patterns

This document describes common query patterns used with CardPlay's Prolog AI system.

## Overview

CardPlay's `PrologAdapter` provides several methods for querying:

- `query()` - Full result with timing and error info
- `querySingle()` - First solution only
- `queryAll()` - All solutions as array
- `succeeds()` - Boolean check if query succeeds
- `findAll()` - Collect values using findall/3
- `queryHostActions()` - Parse HostAction terms

## Basic Query Patterns

### Single Value Lookup

```typescript
// Get the notes in a C major chord
const result = await adapter.querySingle('chord_tones(c, major, Notes).');
const notes = result?.Notes as string[]; // ['c', 'e', 'g']
```

### Multiple Solutions

```typescript
// Find all notes in C major scale
const solutions = await adapter.queryAll('scale_note(c, major, Note).');
const notes = solutions.map(s => s.Note as string);
```

### Existence Check

```typescript
// Check if a note is in a scale
const isInScale = await adapter.succeeds('in_scale(e, c, major).');
```

### Collect All Values

```typescript
// Get all chord types
const chordTypes = await adapter.findAll<string>('Type', 'chord_type(Type)');
```

## Music Theory Patterns

### Chord Suggestion

```prolog
% Prolog knowledge base
suggest_next_chord(CurrentChord, Key, NextChord) :-
    valid_progression(CurrentChord, NextChord, Key),
    \+ dissonant_transition(CurrentChord, NextChord).
```

```typescript
// TypeScript query
const suggestions = await adapter.queryAll(
  'suggest_next_chord(cmaj, c_major, Next).'
);
const nextChords = suggestions.map(s => s.Next as string);
```

### Scale Analysis

```prolog
% Find notes that fit over a chord
fitting_notes(ChordRoot, ChordType, Key, Notes) :-
    chord_tones(ChordRoot, ChordType, ChordNotes),
    scale_notes(Key, major, ScaleNotes),
    intersection(ScaleNotes, ChordNotes, Notes).
```

### Voice Leading

```prolog
% Check if voice leading is smooth
smooth_voice_leading(Chord1Notes, Chord2Notes) :-
    maplist(small_interval, Chord1Notes, Chord2Notes).

small_interval(N1, N2) :-
    interval_semitones(N1, N2, Dist),
    Dist =< 2.
```

## HostAction Patterns

### Generate Actions from Rules

```prolog
% Suggest volume adjustments based on context
suggest_action(set_param(CardId, volume, NewVol)) :-
    card_volume(CardId, CurrentVol),
    context_requires_quieter,
    NewVol is CurrentVol * 0.8.

% Suggest adding harmonically related cards
suggest_action(add_card(DeckId, chord_card, Params)) :-
    current_key(Key),
    suggested_chord(Key, ChordType),
    Params = [chord_type-ChordType, root-Key].
```

```typescript
// Get all suggested actions
const actions = await adapter.queryHostActions(
  'suggest_action(Action).'
);

// Apply each action
for (const action of actions) {
  await hostController.execute(action);
}
```

### Conditional Actions

```prolog
% Only suggest if conditions are met
suggest_action(Action) :-
    current_state(State),
    applicable_rule(State, Action),
    not_recently_applied(Action).
```

## Advanced Patterns

### Parameterized Queries

```typescript
// Build query with JS parameters
const root = 'c';
const chordType = 'major';
const query = `chord_tones(${root}, ${chordType}, Notes).`;
const result = await adapter.querySingle(query);
```

### Using jsToTermString for Complex Data

```typescript
const params = { waveform: 'sine', frequency: 440 };
const termString = adapter.jsToTermString(params);
// Result: "[waveform-sine, frequency-440]"

await adapter.loadProgram(`
  process_params(${termString}).
`);
```

### Aggregation

```prolog
% Count solutions
count_chords(Key, Count) :-
    findall(C, chord_in_key(Key, C), Chords),
    length(Chords, Count).

% Sum values
total_duration(Phrases, Total) :-
    findall(D, (member(P, Phrases), phrase_duration(P, D)), Durations),
    sum_list(Durations, Total).
```

### Backtracking with Cut

```prolog
% Get first valid suggestion only
best_suggestion(Context, Suggestion) :-
    generate_suggestion(Context, Suggestion),
    valid_suggestion(Suggestion),
    !.  % Commit to first valid
```

## Error Handling

### Query Result Structure

```typescript
const result = await adapter.query('some_query(X).');

if (result.success) {
  console.log(`Found ${result.solutions.length} solutions`);
  console.log(`Query took ${result.timeMs}ms`);
} else {
  console.error(`Query failed: ${result.error}`);
}
```

### Graceful Fallbacks

```typescript
// Try specific query, fall back to general
let suggestions = await adapter.queryAll(
  'specific_suggestion(Context, S).'
);

if (suggestions.length === 0) {
  suggestions = await adapter.queryAll(
    'general_suggestion(S).'
  );
}
```

## Performance Tips

1. **Use cut (`!`)** when only one solution is needed
2. **Limit solutions** with `maxSolutions` option
3. **Cache results** for expensive queries (built-in)
4. **Use ground queries** when possible (faster than open-ended)
5. **Profile with timing**: Check `result.timeMs`

```typescript
// Limit to 10 solutions max
const result = await adapter.query('find_all(X).', {
  maxSolutions: 10,
  timeoutMs: 1000
});
```

## See Also

- [Prolog Syntax](./prolog-syntax.md) - Syntax reference
- [Music Theory Predicates](./music-theory-predicates.md) - Available predicates
- [Prolog Engine Choice](./prolog-engine-choice.md) - Engine documentation
