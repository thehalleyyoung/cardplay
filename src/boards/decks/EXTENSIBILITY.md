# Deck Factory Extensibility

**Status:** Documented (Change 429)

## Decision

DeckType values are **pinned** and not extensible via namespacing.

### Rationale

1. **Deck factories are UI components**: Each DeckType corresponds to specific rendering logic, layout behavior, and user interaction patterns.

2. **Limited extension surface**: Unlike cards, port types, or event kinds (which are data-driven), deck factories require:
   - Complex UI component implementations
   - Integration with core layout system
   - Panel management logic
   - State persistence handling

3. **Alternative extension path**: Extensions wanting new deck-like functionality should:
   - Use existing deck types (e.g., `custom-deck` with configurable slots)
   - Register custom cards within those decks
   - Use board definitions to compose existing deck types

### What IS Extensible

Extensions can:

- **Register custom boards** with namespaced IDs (`my-pack:my-board`)
- **Register custom deck templates** with namespaced IDs (`my-pack:my-template`)
- **Register custom cards** that appear in existing deck types
- **Compose existing deck types** into new board layouts

### What is NOT Extensible

Extensions cannot:

- Add new DeckType values
- Register new deck factories
- Override builtin deck rendering

### Future Consideration

If there is strong demand for user-defined deck types:

1. Add a `custom-deck` DeckType with plugin architecture
2. Define a declarative deck schema (JSON/YAML)
3. Implement a safe rendering sandbox

For now, the 20+ builtin deck types cover all documented use cases.

## Enforcement

- `DeckType` is a closed union type
- Factory registry validates DeckType at compile time
- Extension manifests cannot declare new deck types
- Runtime validation rejects unknown DeckType values

## References

- `src/boards/types.ts` - DeckType definition
- `src/boards/decks/factory-registry.ts` - Factory registration
- `src/boards/registry.ts` - Board extension points (Change 428)
- `src/ai/theory/deck-templates.ts` - Template extension points (Change 427)
