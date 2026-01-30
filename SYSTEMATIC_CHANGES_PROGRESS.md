# Systematic Changes Progress

**Based on:** `to_fix_repo_plan_500.md`  
**Session Date:** 2026-01-29  
**Goal:** Implement systematic changes to align repo with canonical docs

---

## Completed This Session

### Phase 0 — Enforcement & Automation
- [x] Change 009 — Added ESLint to devDependencies
- [x] Change 010 — Created eslint.config.js for TypeScript ESM
- [x] Change 013 — Created find-hardcoded-ticks.ts script
- [x] Change 016 — Created find-phantom-imports.ts script  
- [x] Change 020 — Created no-phantom-modules.test.ts
- [x] Change 021 — Created codemods/ folder and codemod-runner.ts

### Phase 1 — Canonical IDs & Naming
- [x] Change 062 — DeckCardLayout 'grid' value already present
- [x] Change 063 — Grid layout rendering already implemented
- [x] Change 064 — Added normalizeDeckCardLayout() function
- [x] Change 065 — Renamed DeckId → SlotGridDeckId in deck-layout.ts
- [x] Change 067 — Updated PortTypes to match canon (added gate, clock, transport; deprecated legacy types)
- [x] Change 069 — normalizePortType() already implemented

### Phase 2 — Board Model Alignment
- [x] Change 129 — BoardContextId/SpecContextId types already implemented
- [x] Change 130 — Context namespacing by boardId/panelId already implemented

### Phase 3 — Deck Factories & Runtime Integration
- [x] Change 151 — Updated DeckFactory.deckType to use DeckType branded type
- [x] Change 152 — Updated DeckInstance.id to use DeckId, DeckInstance.type to use DeckType
- [x] Change 153 — Updated DeckFactoryRegistry Map key type to DeckType
- [x] Change 187 — Added DeckInstance.panelId field

---

## Verification

All changes have been verified with:
- `npm run typecheck` — passes ✓
- `npm run build` — passes ✓

---

## Next Steps

Continue with remaining Phase 0-3 changes:
- Phase 0: Remaining codemods (022-029), tsconfig strictness (033-036), additional checks
- Phase 1: More ID normalization and validation
- Phase 2: Board validation and migration
- Phase 3: Deck factory file renames and standardization
- Phase 4: Port vocabulary and routing
- Phase 5-9: Card systems, events, AI, extensions, cleanup

