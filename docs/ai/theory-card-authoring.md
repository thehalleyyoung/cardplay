# Authoring a Theory Card (Branch C) (C129)

Theory cards are “constraint-contributing cards”: they don’t generate audio directly, but update a `MusicSpec` that constrains generators/analyzers and Prolog recommendations.

Core files:
- Types: `src/ai/theory/music-spec.ts`
- Card defs: `src/ai/theory/theory-cards.ts`
- Param→constraint registry: `src/ai/theory/constraint-mappers.ts`
- Prolog glue: `src/ai/knowledge/music-spec.pl`
- TS⇄Prolog bridge: `src/ai/theory/spec-prolog-bridge.ts`

## 1) Add/confirm a constraint type

If your new card introduces a new constraint:
1. Add a new `ConstraintX` interface and extend the `MusicConstraint` union in `src/ai/theory/music-spec.ts`.
2. Add encoding support in `src/ai/theory/spec-prolog-bridge.ts`:
   - `constraintToPrologFact(...)` (facts form)
   - `constraintToTerm(...)` (inline term form)
3. Add/confirm Prolog constraint typing in `src/ai/knowledge/music-spec.pl`:
   - extend `constraint_type/2` for the new constraint term shape

Keep Prolog functors stable: once shipped, they’re part of your “wire format”.

## 2) Define the card

In `src/ai/theory/theory-cards.ts`, define a `TheoryCardDef`:
- `cardId`: unique ID for the card type (TS-side)
- `params`: parameter schema (`id`, `type`, defaults, weights)
- `extractConstraints(state)`: produce `MusicConstraint[]`
- `applyToSpec(state, spec)`: return updated `MusicSpec`

Key guideline: **the card state is UI**, but the card output is **purely declarative constraints**.

## 3) Register param→constraint mappings

In `src/ai/theory/constraint-mappers.ts`, ensure there is a single source of truth mapping:
- `(cardId, paramId) -> constraintType + encoder`

This keeps:
- UI controls
- Prolog card reasoning (`recommend_param/4`, `derived_param/3`)
- HostAction application

consistent.

## 4) Update Prolog card constraint metadata (optional but recommended)

If the Prolog KB reasons about card params directly, add metadata in `src/ai/knowledge/music-spec.pl`:
- `theory_card_constraint(CardType, ParamId, ConstraintType).`

This lets Prolog recommend parameters and actions in a way the host can interpret.

## 5) Add tests

Add or extend tests in:
- `src/ai/theory/theory-cards.test.ts` (card definition + constraint extraction)
- `src/ai/queries/spec-queries.test.ts` (KB integration via Prolog queries)

Write at least one test that:
- constructs a `MusicSpec` via the new card
- runs a Prolog query that depends on the constraint
- verifies returned recommendations/explanations are stable

