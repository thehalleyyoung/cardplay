# How Prolog Returns HostActions

> **Roadmap Item**: C023 Add docs: "How Prolog returns HostActions" (actions, explanations, confidence).

## Overview

This document describes how Prolog knowledge bases communicate recommendations back to the TypeScript host through structured HostAction objects.

## HostAction Structure

```typescript
interface HostAction {
  /** Unique action type identifier */
  type: HostActionType;
  
  /** Action-specific payload */
  payload: Record<string, unknown>;
  
  /** Human-readable explanation (from explain/2) */
  explanation: string[];
  
  /** Confidence score 0-100 (from score/2 or confidence/2) */
  confidence: number;
  
  /** Source rule/predicate that generated this action */
  source: string;
  
  /** Priority for ordering multiple actions */
  priority: number;
}

type HostActionType = 
  | 'suggest_chord'
  | 'suggest_schema'
  | 'suggest_melody'
  | 'highlight_notes'
  | 'show_warning'
  | 'apply_ornament'
  | 'adjust_voicing'
  | 'set_tempo'
  | 'recommend_mode'
  | 'flag_parallel';
```

## Prolog to HostAction Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│  1. QUERY INVOCATION                                                      │
│     TS calls: recommend(Context, Recommendations)                         │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  2. RULE EVALUATION                                                       │
│     Prolog evaluates matching rules against current facts                 │
│     Multiple rules may fire, producing multiple recommendations           │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  3. EXPLANATION GENERATION                                                │
│     Each recommendation calls explain/2 to build reason list              │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  4. CONFIDENCE SCORING                                                    │
│     Each recommendation gets score/2 or confidence/2 value                │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  5. ACTION CONSTRUCTION                                                   │
│     host_action/6 term built for each recommendation                      │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  6. SERIALIZATION                                                         │
│     Actions converted to JSON for TS consumption                          │
└───────────────────────────────────────────────────────────────────────────┘
```

## Prolog Predicates

### recommend/2 - Entry Point

```prolog
% recommend(+Context, -Actions)
% Main entry point for getting recommendations
recommend(Context, Actions) :-
    findall(
        Action,
        generate_recommendation(Context, Action),
        Actions
    ).
```

### host_action/6 - Action Term

```prolog
% host_action(Type, Payload, Explanation, Confidence, Source, Priority)
host_action(
    suggest_chord,                    % Action type
    [chord(e, minor7), position(4)],  % Payload
    ['Follows circle of fifths',      % Explanation list
     'Maintains voice leading'],
    85,                               % Confidence (0-100)
    'progression_rule_42',            % Source identifier
    high                              % Priority
).
```

### explain/2 - Explanation Convention (C024)

```prolog
% explain(+Recommendation, -Reasons)
% Builds a list of human-readable reasons
explain(suggest_chord(Chord, Pos), Reasons) :-
    findall(Reason, chord_reason(Chord, Pos, Reason), Reasons).

chord_reason(chord(Root, Quality), Pos, Reason) :-
    follows_progression(Pos, Root, Quality),
    format(atom(Reason), 'Follows expected progression at position ~w', [Pos]).

chord_reason(chord(Root, Quality), _, Reason) :-
    good_voice_leading(Root, Quality),
    Reason = 'Maintains smooth voice leading'.
```

### score/2 - Numeric Scoring Convention (C025)

```prolog
% score(+Item, -Score)
% Returns a score from 0-100
score(chord_suggestion(Chord, Context), Score) :-
    base_score(Chord, Context, Base),
    voice_leading_bonus(Chord, Context, VLBonus),
    style_match_bonus(Chord, Context, StyleBonus),
    Score is min(100, Base + VLBonus + StyleBonus).

base_score(chord(_, major), _, 50).
base_score(chord(_, minor), _, 50).
base_score(chord(_, dominant7), _, 60).  % Common in jazz/galant
```

### confidence/2 - Generator vs Analyzer (C026)

```prolog
% confidence(+Source, -Confidence)
% Different conventions for generators vs analyzers

% Generators: confidence = "how strongly do I recommend this?"
confidence(generator(melody_gen), Suggestion, Confidence) :-
    fits_constraints(Suggestion, FitScore),
    novelty_score(Suggestion, NoveltyScore),
    Confidence is (FitScore * 0.7 + NoveltyScore * 0.3).

% Analyzers: confidence = "how certain am I this is correct?"
confidence(analyzer(key_detect), Detection, Confidence) :-
    ks_correlation(Detection, KS),
    dft_clarity(Detection, DFT),
    Confidence is max(KS, DFT) * 100.
```

## Action Types Reference

| Type | Payload | When Generated |
|------|---------|----------------|
| `suggest_chord` | chord term, position | Progression analysis |
| `suggest_schema` | schema name, fit score | Pattern matching |
| `suggest_melody` | pitch sequence, rhythm | Melody generation |
| `highlight_notes` | pitch class set | Harmonic analysis |
| `show_warning` | message, severity | Rule violation |
| `apply_ornament` | ornament type, position | Style matching |
| `adjust_voicing` | voice assignments | Voice leading |
| `set_tempo` | BPM, reason | Tempo inference |
| `recommend_mode` | mode name, reasons | Mode detection |
| `flag_parallel` | voice pair, interval | Parallel 5ths/8ves |

## TypeScript Handling

```typescript
// Receiving actions from Prolog
function handleHostActions(actions: HostAction[]): void {
  // Sort by priority
  const sorted = actions.sort((a, b) => 
    priorityValue(b.priority) - priorityValue(a.priority)
  );
  
  // Filter by confidence threshold
  const confident = sorted.filter(a => a.confidence >= 60);
  
  // Dispatch to appropriate handlers
  for (const action of confident) {
    switch (action.type) {
      case 'suggest_chord':
        chordSuggestionStore.update(action);
        break;
      case 'show_warning':
        notificationStore.warn(action);
        break;
      // ... etc
    }
  }
}
```

## Confidence Thresholds

| Threshold | Meaning | UI Treatment |
|-----------|---------|--------------|
| 90-100 | Very high confidence | Show prominently, auto-apply option |
| 70-89 | High confidence | Show as primary suggestion |
| 50-69 | Medium confidence | Show as alternative |
| 30-49 | Low confidence | Show only on request |
| 0-29 | Very low | Don't show, log only |

## See Also

- [C021: KB Layering](./kb-layering.md)
- [C022: Card to Prolog Sync](./card-to-prolog-sync.md)
- [C024-C026: Prolog Conventions](./prolog-conventions.md)
