# Feature Availability Derivation TODO

## Current State
The file `src/ai/queries/persona-queries.ts` contains a hardcoded `PERSONA_FEATURE_MATRIX` that maps feature IDs to persona availability ('available', 'limited', 'not-available').

This matrix is static and duplicates information that should be derived from board definitions.

## Target State
Feature availability should be derived from board definitions:

```typescript
// Derive features from board metadata
function derivePersonaFeatures(persona: PersonaId): PersonaFeatureEntry[] {
  const boards = getBoardsForPersona(persona);
  const features: Map<string, PersonaFeatureEntry> = new Map();
  
  for (const board of boards) {
    // Each board exposes certain deck types
    for (const deck of board.decks) {
      const feature = deckTypeToFeature(deck.type);
      features.set(feature.featureId, {
        ...feature,
        availability: board.controlLevel === 'full-manual' ? 'limited' : 'available'
      });
    }
  }
  
  return Array.from(features.values());
}
```

## Implementation Steps

1. **Create mapping: DeckType → FeatureId**
   - Define which feature each deck type provides
   - Example: `pattern-deck` → `pattern-editor` feature
   - Example: `notation-deck` → `score-layout` feature

2. **Create mapping: Board → Persona**
   - Define which personas typically use which boards
   - May be many-to-many (a board can serve multiple personas)

3. **Implement derivation function**
   - Walk board registry
   - Extract features from deck types
   - Determine availability based on controlLevel and deck presence

4. **Update query functions**
   - Replace `PERSONA_FEATURE_MATRIX` with dynamic derivation
   - Keep feature names and categories as metadata in deck factories

5. **Add validation**
   - Test that derived features match expectations
   - Warning when hardcoded data diverges from board reality

## Benefits
- Single source of truth (board definitions)
- Automatically reflects new boards/decks
- Removes maintenance burden of duplicate data
- Enables extensibility (third-party boards can define features)

## References
- Change 378 in to_fix_repo_plan_500.md
- Board definitions in src/boards/builtins/*.ts
- Deck factories in src/boards/decks/factories/*.ts
