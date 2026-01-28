# Prolog Syntax Conventions

This document describes the Prolog syntax conventions used in CardPlay's AI system.

## Overview

CardPlay uses **Tau Prolog** as its Prolog engine. Tau Prolog is ISO Prolog compliant, meaning it follows the ISO/IEC 13211-1 standard for Prolog.

## Basic Syntax

### Terms

Prolog programs are built from **terms**:

1. **Atoms** - Constants starting with lowercase letter or quoted:
   ```prolog
   hello
   'Hello World'
   c_major
   ```

2. **Numbers** - Integer or floating-point:
   ```prolog
   42
   3.14
   -17
   ```

3. **Variables** - Start with uppercase letter or underscore:
   ```prolog
   X
   Note
   _Unused
   ```

4. **Compound Terms** - Functor with arguments:
   ```prolog
   note(c, 4, 60)
   chord(c, major)
   set_param(card_id, volume, 0.8)
   ```

5. **Lists** - Ordered sequences:
   ```prolog
   [1, 2, 3]
   [c, e, g]
   [Head | Tail]
   ```

### Facts

Facts are unconditional truths:

```prolog
% A note fact
note(c).
note(d).
note(e).

% A chord definition
chord_tones(c, major, [c, e, g]).

% An interval relation
interval(c, e, major_third).
```

### Rules

Rules define relationships with conditions:

```prolog
% X is a grandparent of Z if X is parent of Y and Y is parent of Z
grandparent(X, Z) :- parent(X, Y), parent(Y, Z).

% A note is in a scale if it's a member of the scale's notes
in_scale(Note, Root, ScaleType) :-
    scale_notes(Root, ScaleType, Notes),
    member(Note, Notes).
```

### Queries

Queries ask questions about the knowledge base:

```prolog
?- note(X).           % What notes exist?
?- chord_tones(c, major, Tones).  % What are C major's tones?
?- in_scale(e, c, major).  % Is E in C major scale?
```

## CardPlay Conventions

### Naming Conventions

- **Predicates**: lowercase with underscores (`chord_tones`, `suggest_next`)
- **Atoms**: lowercase with underscores (`c_major`, `half_diminished`)
- **Variables**: PascalCase (`Note`, `ChordType`, `Interval`)
- **Card IDs**: lowercase with underscores (`card_123`, `deck_main`)

### HostAction Terms

CardPlay uses special compound terms to communicate actions from Prolog to JavaScript:

```prolog
% Set a parameter on a card
set_param(CardId, ParamName, Value)

% Invoke a method on a card
invoke_method(CardId, MethodName, Args)

% Add a new card to a deck
add_card(DeckId, CardType, InitParams)

% Remove a card
remove_card(CardId)

% Move a card between decks
move_card(CardId, FromDeck, ToDeck)
```

### Standard Modules

CardPlay loads these Tau Prolog modules by default:

- **lists**: `member/2`, `append/3`, `length/2`, `reverse/2`, etc.
- **random**: `random/1`, `random_between/3`
- **format**: `format/2`, `format/3`

### Music Theory Predicates

Music theory predicates follow these conventions:

```prolog
% Note representation: atom (c, csharp, d, etc.)
note(c).
note(csharp).

% Interval: source, target, interval_name
interval(c, e, major_third).

% Scale: type, semitone pattern
scale(major, [2, 2, 1, 2, 2, 2, 1]).

% Chord: root, type, notes
chord_tones(c, major, [c, e, g]).
```

## Control Constructs

### Conjunction (AND)

Use comma to combine goals:

```prolog
goal1, goal2, goal3.
```

### Disjunction (OR)

Use semicolon for alternatives:

```prolog
(goal1 ; goal2).
```

### Negation-as-Failure

Use `\+` for negation:

```prolog
not_in_chord(Note, Root, Type) :-
    \+ chord_contains(Root, Type, Note).
```

### Cut

Use `!` to commit to a choice:

```prolog
first_solution(X) :-
    find_solution(X),
    !.
```

### Conditional

Use `->` for if-then-else:

```prolog
check(X) :-
    (X > 0 -> positive(X) ; non_positive(X)).
```

## Arithmetic

Prolog uses `is` for arithmetic evaluation:

```prolog
X is 3 + 4.
Y is X * 2.
transpose(Note, Semitones, Result) :-
    midi_note(Note, Midi),
    NewMidi is Midi + Semitones,
    midi_note(Result, NewMidi).
```

Comparison operators:
- `=:=` arithmetic equality
- `=\=` arithmetic inequality
- `<`, `>`, `=<`, `>=` comparisons

## Best Practices

1. **Use descriptive predicate names**: `suggest_next_chord/3` not `snc/3`

2. **Document predicates with comments**:
   ```prolog
   % chord_tones(+Root, +Type, -Notes)
   % Unifies Notes with the list of notes in the chord.
   chord_tones(c, major, [c, e, g]).
   ```

3. **Use guard predicates for validation**:
   ```prolog
   valid_note(Note) :- note(Note), !.
   valid_note(Note) :- throw(error(invalid_note(Note))).
   ```

4. **Prefer deterministic predicates** when a single answer is expected.

5. **Use findall/3 or bagof/3** for collecting all solutions:
   ```prolog
   all_notes_in_scale(Root, Type, Notes) :-
       findall(N, in_scale(N, Root, Type), Notes).
   ```

## See Also

- [Query Patterns](./query-patterns.md) - Common query patterns
- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Tau Prolog Documentation](http://tau-prolog.org/documentation)
