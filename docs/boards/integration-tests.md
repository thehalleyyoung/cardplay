# Board System Integration Tests

This document describes the integration tests for the board system (Phase E: E081-E083).

## Test Coverage

### E081: Board Layout Rendering

Tests that board definitions correctly translate into rendered panel arrangements:

- **Notation Board**: Verifies correct panel structure (players, score, properties)
- **Tracker Board**: Verifies correct panel structure (sidebar, main, inspector)
- **Session Board**: Verifies correct panel structure and deck assignments
- **Deck Instance Creation**: Verifies deck factories create instances with proper structure

### E082: Board Switching

Tests the board switching mechanism:

- **Deck Replacement**: Verifies decks change when switching boards
- **Recent Boards**: Verifies recent board list is maintained
- **Board Properties**: Verifies board metadata is accessible after switch

### E083: Deck State Persistence

Tests that deck state persists across operations:

- **Basic Persistence**: Verifies deck state can be saved and retrieved
- **Cross-Board Persistence**: Verifies deck state persists across board switches
- **State Reset**: Verifies deck state can be reset
- **Independent Persistence**: Verifies layout and deck state persist independently

## Running Tests

```bash
npm test -- src/tests/board-integration.test.ts
```

## Implementation Notes

### localStorage Mocking

The tests use a mock localStorage implementation to avoid issues in jsdom environments:

```typescript
const mockStorage: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    key: (index: number) => Object.keys(mockStorage)[index] || null,
    get length() { return Object.keys(mockStorage).length; }
  },
  writable: true,
  configurable: true
});
```

### Deck Type Naming

Tests use the actual deck type names from board definitions:

- **Notation Board**: `notation-deck`, `instruments-deck`, `properties-deck`
- **Tracker Board**: `pattern-deck`, `instruments-deck`, `dsp-chain`, `properties-deck`
- **Session Board**: `session-deck`, `mixer-deck`, `instruments-deck`, `properties-deck`

### Test Environment

Tests use `@vitest-environment jsdom` for proper DOM simulation.

## See Also

- [Board API Reference](./board-api.md)
- [Board State Documentation](./board-state.md)
- [Deck Documentation](./decks.md)
