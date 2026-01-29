# Prolog Conventions for CardPlay Theory KB

> **Roadmap Items**: 
> - C024 Define `explain/2` convention: `explain(Recommendation, ReasonsList)`
> - C025 Define numeric scoring convention: `score(Item, 0..100)`
> - C026 Define "confidence" convention for generators vs analyzers

## Overview

This document defines the Prolog conventions used across all CardPlay knowledge bases for explanations, scoring, and confidence levels.

---

## C024: The explain/2 Convention

### Purpose

Every recommendation from the knowledge base must be explainable. The `explain/2` predicate provides a list of human-readable reasons for any recommendation.

### Signature

```prolog
% explain(+Recommendation, -ReasonsList)
% Recommendation: The term being explained
% ReasonsList: List of atoms or strings describing why
```

### Convention Rules

1. **Always return a list**: Even for single reasons, wrap in a list
2. **Human-readable**: Reasons should be understandable by musicians
3. **Ordered by importance**: Most important reason first
4. **Specific over general**: "Follows V-I cadence" > "Sounds good"
5. **Include musical terminology**: Use terms musicians know

### Examples

```prolog
% Chord suggestion explanation
explain(suggest_chord(chord(g, dominant7), 4), Reasons) :-
    Reasons = [
        'Creates authentic cadence to C major',
        'Contains leading tone (B) resolving to tonic',
        'Standard galant schema ending'
    ].

% Schema suggestion explanation
explain(suggest_schema(prinner, bars(5,8)), Reasons) :-
    Reasons = [
        'Descending bass pattern matches Prinner',
        'Upper voice moves in parallel 10ths',
        'Common continuation after opening gambit'
    ].

% Warning explanation
explain(flag_parallel(soprano, bass, fifth), Reasons) :-
    Reasons = [
        'Parallel fifths between soprano and bass',
        'Violates classical voice-leading rules',
        'Consider contrary motion instead'
    ].
```

### Building Dynamic Explanations

```prolog
% Build explanation from multiple sources
explain(Recommendation, Reasons) :-
    findall(R, reason_for(Recommendation, R), Reasons),
    Reasons \= [].  % Fail if no reasons found

reason_for(suggest_chord(Chord, Pos), Reason) :-
    progression_reason(Chord, Pos, Reason).
reason_for(suggest_chord(Chord, _), Reason) :-
    voice_leading_reason(Chord, Reason).
reason_for(suggest_chord(Chord, _), Reason) :-
    style_reason(Chord, Reason).
```

---

## C025: The score/2 Convention

### Purpose

Every evaluable item gets a numeric score from 0 to 100, enabling ranking and filtering of recommendations.

### Signature

```prolog
% score(+Item, -Score)
% Item: The item being scored
% Score: Integer from 0 to 100
```

### Score Ranges

| Range | Meaning | Usage |
|-------|---------|-------|
| 90-100 | Excellent | Perfect match, highly recommended |
| 70-89 | Good | Strong match, primary suggestions |
| 50-69 | Acceptable | Viable alternative |
| 30-49 | Marginal | Only if nothing better available |
| 0-29 | Poor | Log for debugging, don't suggest |

### Scoring Patterns

#### Additive Scoring
```prolog
score(chord_suggestion(Chord, Context), Score) :-
    base_score(Chord, Base),                    % 0-40
    context_bonus(Chord, Context, CtxBonus),    % 0-30
    style_bonus(Chord, Context, StyleBonus),    % 0-30
    Score is min(100, Base + CtxBonus + StyleBonus).
```

#### Multiplicative Scoring
```prolog
score(schema_match(Schema, Notes), Score) :-
    degree_match(Schema, Notes, DegreeScore),   % 0-1
    rhythm_match(Schema, Notes, RhythmScore),   % 0-1
    contour_match(Schema, Notes, ContourScore), % 0-1
    RawScore is DegreeScore * RhythmScore * ContourScore * 100,
    Score is round(RawScore).
```

#### Penalty-Based Scoring
```prolog
score(voice_leading(Progression), Score) :-
    count_parallels(Progression, Parallels),
    count_leaps(Progression, Leaps),
    ParallelPenalty is Parallels * 15,
    LeapPenalty is Leaps * 5,
    Score is max(0, 100 - ParallelPenalty - LeapPenalty).
```

### Component Scores

Document sub-scores for transparency:

```prolog
% Detailed scoring breakdown
score_breakdown(Item, Breakdown) :-
    Breakdown = [
        component(harmonic_fit, HarmonicScore),
        component(voice_leading, VLScore),
        component(style_match, StyleScore),
        component(total, TotalScore)
    ],
    harmonic_score(Item, HarmonicScore),
    voice_leading_score(Item, VLScore),
    style_score(Item, StyleScore),
    TotalScore is (HarmonicScore + VLScore + StyleScore) // 3.
```

---

## C026: Confidence Convention (Generators vs Analyzers)

### Purpose

Generators and analyzers have different confidence semantics. This convention clarifies what "confidence" means for each.

### Generators (Creative Tools)

For tools that **create** content (melody generator, chord suggester, etc.):

**Confidence = "How strongly do I recommend this?"**

```prolog
% Generator confidence factors
generator_confidence(Suggestion, Confidence) :-
    constraint_fit(Suggestion, FitScore),       % Does it meet requirements?
    novelty_score(Suggestion, Novelty),         % Is it interesting?
    coherence_score(Suggestion, Coherence),     % Does it flow well?
    Confidence is round(
        FitScore * 0.5 +      % Must meet constraints
        Coherence * 0.3 +     % Should be coherent
        Novelty * 0.2         % Bonus for interesting choices
    ).
```

**Generator Confidence Interpretation:**
| Score | Meaning |
|-------|---------|
| 90-100 | Excellent choice, meets all constraints beautifully |
| 70-89 | Good choice, recommended |
| 50-69 | Acceptable, but other options may be better |
| 30-49 | Marginal, only if user specifically wants this |
| 0-29 | Poor fit, violates constraints |

### Analyzers (Detection Tools)

For tools that **detect** patterns (key detector, schema matcher, etc.):

**Confidence = "How certain am I this is correct?"**

```prolog
% Analyzer confidence factors
analyzer_confidence(Detection, Confidence) :-
    evidence_strength(Detection, Evidence),     % How much data supports this?
    alternative_gap(Detection, Gap),            % How much better than 2nd place?
    noise_level(Detection, Noise),              % How noisy is the input?
    Confidence is round(
        Evidence * 0.4 +
        Gap * 0.4 +
        (100 - Noise) * 0.2
    ).
```

**Analyzer Confidence Interpretation:**
| Score | Meaning |
|-------|---------|
| 90-100 | Very certain, clear evidence |
| 70-89 | Likely correct, some ambiguity |
| 50-69 | Possible, but alternatives exist |
| 30-49 | Uncertain, multiple valid interpretations |
| 0-29 | Guess at best, insufficient evidence |

### Combined Use

When a generator uses analyzer output:

```prolog
% Melody generator using key analyzer
generate_melody(Context, Melody, Confidence) :-
    % Analyze the key
    detect_key(Context, Key, KeyConfidence),
    
    % Generate melody in that key
    melody_in_key(Context, Key, Melody, MelodyScore),
    
    % Combined confidence: uncertainty propagates
    Confidence is round(MelodyScore * (KeyConfidence / 100)).
```

### Documentation Requirements

Every predicate that returns confidence must document:

1. **What confidence means** for this specific predicate
2. **What factors** influence the score
3. **How to interpret** different score ranges

```prolog
%% key_confidence(+Analysis, -Confidence) is det.
%
% Returns confidence in key detection.
%
% Confidence meaning: Certainty that detected key is correct
%
% Factors:
%   - KS profile correlation (40%)
%   - Gap to second-best key (40%)
%   - Pitch class coverage (20%)
%
% Interpretation:
%   90-100: Clear major/minor, strong tonal center
%   70-89: Likely correct, some modal ambiguity
%   50-69: Tonal but ambiguous (parallel major/minor)
%   30-49: Weak tonality, possibly modal
%   0-29: Atonal or insufficient data
```

---

## Integration Example

Complete example showing all three conventions together:

```prolog
% Main recommendation predicate
recommend_chord(Context, Action) :-
    % Find a chord suggestion
    possible_chord(Context, Chord, Position),
    
    % Score it (C025)
    score(chord_suggestion(Chord, Context), Score),
    Score >= 50,  % Minimum threshold
    
    % Get confidence (C026 - this is a generator)
    generator_confidence(chord_suggestion(Chord, Context), Confidence),
    
    % Build explanation (C024)
    explain(suggest_chord(Chord, Position), Reasons),
    
    % Construct host action
    Action = host_action(
        suggest_chord,
        [chord: Chord, position: Position],
        Reasons,
        Confidence,
        'recommend_chord/2',
        medium
    ).
```

---

## See Also

- [C021: KB Layering](./kb-layering.md)
- [C022: Card to Prolog Sync](./card-to-prolog-sync.md)
- [C023: Prolog to Host Actions](./prolog-to-host-actions.md)
