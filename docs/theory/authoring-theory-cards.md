# How to Author a New Theory Card

> **Roadmap Item**: C129 Add docs: "How to author a new theory card" (params → constraints → predicates).

## Overview

This guide explains how to create a new theory card in CardPlay that integrates with the music theory knowledge base. A theory card exposes musical parameters to the UI and maps them to Prolog constraints that influence generation and analysis.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         UI Layer (Svelte)                               │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      Card Component                              │   │
│   │  - Renders sliders, dropdowns, toggles                          │   │
│   │  - Emits parameter changes                                       │   │
│   └─────────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │ parameter changes
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      TypeScript Card Definition                         │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    CardDefinition<T>                             │   │
│   │  - id, category, defaultParams                                  │   │
│   │  - getConstraints(params): MusicConstraint[]                    │   │
│   │  - applyHostAction?(action, params): T                          │   │
│   └─────────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │ MusicConstraint[]
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MusicSpec Bridge                                │
│                                                                         │
│   specToPrologFacts(spec) → Prolog facts                               │
│   specToPrologTerm(spec) → music_spec/7 term                           │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ Prolog queries
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Prolog Knowledge Base                             │
│                                                                         │
│   constraint_* predicates                                               │
│   recommend_* predicates                                                │
│   HostAction generation                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Guide

### 1. Define Card Parameters (TypeScript)

Create an interface for your card's parameters:

```typescript
// src/ai/theory/my-theory-cards.ts

export interface MyCardParams {
  /** The main selection */
  readonly selection: 'option_a' | 'option_b' | 'option_c';
  
  /** Numeric slider value (0-1) */
  readonly intensity: number;
  
  /** Boolean toggle */
  readonly enabled: boolean;
}

export const DEFAULT_MY_CARD_PARAMS: MyCardParams = {
  selection: 'option_a',
  intensity: 0.5,
  enabled: true,
};
```

### 2. Define the Constraint Type (if new)

If your card needs a new constraint type, add it to `music-spec.ts`:

```typescript
// src/ai/theory/music-spec.ts

/** My constraint type */
export interface ConstraintMyFeature extends ConstraintBase {
  readonly type: 'my_feature';
  readonly selection: 'option_a' | 'option_b' | 'option_c';
  readonly intensity: number;
}

// Add to MusicConstraint union:
export type MusicConstraint =
  | /* existing types */
  | ConstraintMyFeature;
```

### 3. Create the Card Definition

```typescript
// src/ai/theory/my-theory-cards.ts

import { CardDefinition } from '../cards/card-types';
import { MusicConstraint } from './music-spec';

export const MY_THEORY_CARD: CardDefinition<MyCardParams> = {
  id: 'my-theory-card',
  name: 'My Theory Card',
  category: 'theory',
  description: 'Controls the my-feature aspect of generation',
  
  defaultParams: DEFAULT_MY_CARD_PARAMS,
  
  /** Convert card params to MusicSpec constraints */
  getConstraints(params: MyCardParams): MusicConstraint[] {
    if (!params.enabled) return [];
    
    return [
      {
        type: 'my_feature',
        selection: params.selection,
        intensity: params.intensity,
        hard: false,
        weight: params.intensity,
      },
    ];
  },
  
  /** Handle HostActions from Prolog recommendations */
  applyHostAction(action, params: MyCardParams): MyCardParams {
    if (action.type === 'set_my_selection' && action.payload?.selection) {
      return { ...params, selection: action.payload.selection };
    }
    return params;
  },
};
```

### 4. Add Prolog Constraint Handling

Add the constraint type to `music-spec.pl`:

```prolog
% src/ai/knowledge/music-spec.pl

%% Constraint type registration
constraint_type(my_feature(_, _), my_feature).

%% Constraint accessor
constraint_my_feature(Selection, Intensity) :-
  current_spec(Spec),
  member(my_feature(Selection, Intensity), Spec.constraints).

%% Default handling if no constraint specified
default_my_feature(option_a, 0.5).
```

### 5. Add Recommendation Predicates (Optional)

If Prolog should be able to suggest values:

```prolog
%% recommend_my_selection(+Spec, -Selection, -Reasons)
recommend_my_selection(Spec, option_b, Reasons) :-
  spec_style(Spec, cinematic),
  Reasons = [because('Cinematic style works well with option_b')].

recommend_my_selection(Spec, option_c, Reasons) :-
  spec_culture(Spec, celtic),
  Reasons = [because('Celtic music traditionally uses option_c')].
```

### 6. Create HostAction Generator (Optional)

If the card should receive recommendations:

```prolog
%% generate_my_action(+Spec, -Action)
generate_my_action(Spec, Action) :-
  recommend_my_selection(Spec, Selection, Reasons),
  Action = host_action(
    set_my_selection,
    [selection(Selection)],
    Reasons,
    75,  % confidence
    'recommend_my_selection/3',
    medium
  ).
```

### 7. Add TypeScript Query Wrapper

```typescript
// src/ai/queries/my-queries.ts

export async function recommendMySelection(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string>> {
  await ensureLoaded(adapter);
  
  return withSpecContext(spec, adapter, async () => {
    const result = await adapter.querySingle(
      'current_spec(Spec), recommend_my_selection(Spec, Selection, Reasons).'
    );
    
    if (result?.Selection) {
      const reasons = prologReasonsToStrings(result.Reasons);
      return explainable(String(result.Selection), reasons, 75);
    }
    
    return explainable('option_a', ['Default selection'], 50);
  });
}
```

### 8. Register the Card

Add your card to the appropriate deck template:

```typescript
// src/ai/theory/deck-templates.ts

export const MY_DECK_TEMPLATE: DeckTemplate = {
  id: 'my-deck',
  name: 'My Theory Deck',
  description: 'Cards for my-feature',
  cards: [
    MY_THEORY_CARD,
    // ... other cards
  ],
};
```

### 9. Write Tests

```typescript
// src/ai/theory/my-theory-cards.test.ts

describe('MyTheoryCard', () => {
  it('should generate constraints from params', () => {
    const params: MyCardParams = {
      selection: 'option_b',
      intensity: 0.8,
      enabled: true,
    };
    
    const constraints = MY_THEORY_CARD.getConstraints(params);
    
    expect(constraints).toHaveLength(1);
    expect(constraints[0].type).toBe('my_feature');
    expect((constraints[0] as ConstraintMyFeature).selection).toBe('option_b');
  });
  
  it('should return empty constraints when disabled', () => {
    const params: MyCardParams = {
      selection: 'option_b',
      intensity: 0.8,
      enabled: false,
    };
    
    const constraints = MY_THEORY_CARD.getConstraints(params);
    expect(constraints).toHaveLength(0);
  });
});
```

## Best Practices

1. **Immutable Parameters**: Always treat card params as immutable; return new objects.

2. **Validation**: Validate params in `getConstraints` before generating constraints.

3. **Defaults**: Provide sensible defaults that produce valid constraints.

4. **Weight Mapping**: Map intensity/priority sliders to constraint weights (0-1).

5. **Hard vs Soft**: Use `hard: true` sparingly; most constraints should be soft.

6. **Explanations**: Always provide reasons in Prolog recommendations.

7. **Testing**: Test constraint generation, HostAction handling, and Prolog integration.

## See Also

- [C130: How to extend the music theory KB](./extending-music-theory-kb.md)
- [C023: How Prolog returns HostActions](./prolog-to-host-actions.md)
- [C024-C026: Prolog conventions](./prolog-conventions.md)
