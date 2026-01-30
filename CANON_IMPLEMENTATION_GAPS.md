# Canon Implementation Gaps

**Generated:** 2026-01-29  
**Source:** `to_fix.md` Part B + systematic changes plan + test results

This document tracks which canon documents are partially implemented or have known gaps.

## Status Legend

- ✅ **Fully Implemented** - All canon features implemented and tested
- 🟡 **Partial** - Core features implemented, some edge cases or extensions missing
- ⏳ **In Progress** - Active implementation work
- ❌ **Not Started** - Canon documented but not yet implemented

## Canon Documents

### Core Systems

| Canon Document | Status | Gaps | Changes Tracking |
|----------------|--------|------|------------------|
| `canon/ids.md` | ✅ | None | Changes 051-100 |
| `canon/nouns.md` | 🟡 | Need bareword detector (Change 043) | - |
| `canon/port-vocabulary.md` | 🟡 | UI still uses direction-encoded types (Changes 070-072) | Changes 201-250 |
| `canon/deck-systems.md` | ✅ | All deck types have factories | Changes 101-200 |
| `canon/card-systems.md` | 🟡 | Some disambiguation pending | Changes 251-300 |
| `canon/stack-systems.md` | 🟡 | UI stack vs core stack separation | Changes 264-267 |
| `canon/legacy-type-aliases.md` | ✅ | All legacy types documented | Changes 054, 074 |
| `canon/module-map.md` | 🟡 | Need automated sync (Change 483) | Change 003 |
| `canon/ssot-stores.md` | 🟡 | Some UI still has parallel stores | Changes 301-350 |

### Board & Deck Systems

| Canon Document | Status | Gaps | Changes Tracking |
|----------------|--------|------|------------------|
| Board Model | ✅ | All boards have panelId | Changes 101-133 |
| Deck Factories | ✅ | All DeckTypes registered | Changes 151-200 |
| Layout System | ✅ | Grid layout supported | Changes 121-127 |
| Context Model | ✅ | BoardContextId/SpecContextId implemented | Changes 129-130 |

### AI & Theory Systems

| Canon Document | Status | Gaps | Changes Tracking |
|----------------|--------|------|------------------|
| `canon/host-actions.md` | 🟡 | Discriminant needs standardization (Change 351) | Changes 351-400 |
| Music Theory Integration | 🟡 | Some HostAction wire format gaps | Changes 354-362 |
| AI Deck Integration | 🟡 | Capability tables needed (Change 382) | Changes 378-386 |
| Ontology Support | ❌ | Not yet implemented | Changes 419-426 |

### Extension Systems

| Canon Document | Status | Gaps | Changes Tracking |
|----------------|--------|------|------------------|
| CardPack System | ⏳ | Manifest schema exists, loader incomplete | Changes 401-450 |
| Registry v2 | ❌ | Phantom module (Change 408-409) | Changes 407-413 |
| Theme Extensions | ❌ | Not implemented | Change 417-418 |
| Port Type Extensions | 🟡 | Registration exists, validation incomplete | Changes 430-431 |
| Event Kind Extensions | 🟡 | Registration exists, schema validation incomplete | Changes 431-434 |

### Event & Time Systems

| Canon Document | Status | Gaps | Changes Tracking |
|----------------|--------|------|------------------|
| PPQ Standard (960) | ✅ | All conversions use canonical PPQ | Changes 301-310 |
| Event Model | 🟡 | Some legacy alias fields still present | Changes 311-318 |
| Clip Registry | 🟡 | Some UI still duplicates state | Changes 325-330 |
| Track Systems | ⏳ | Track types need disambiguation | Changes 321-324 |

### Testing & Validation

| Test Category | Status | Gaps |
|---------------|--------|------|
| Canon ID Tests | ✅ | All canonical IDs validated | Changes 017-020 |
| Port Compatibility Tests | ✅ | Matrix tests implemented | Change 018 |
| Board Schema Tests | 🟡 | Need factory validation (Change 150) | Change 134 |
| Registry Snapshots | ❌ | No snapshot tests yet | Changes 491-497 |

## Priority Gaps (Blocking Other Work)

### High Priority

1. **HostAction Discriminant** (Change 351) - Blocks AI integration standardization
2. **Port Direction Model** (Changes 070-072) - Partially done, need UI migration
3. **Track Disambiguation** (Changes 321-324) - Blocks SSOT cleanup
4. **Registry v2 Decision** (Changes 408-409) - Blocks extension doc/code sync

### Medium Priority

5. **CardPack Loader** (Changes 401-404) - Blocks third-party extensions
6. **SSOT UI Cleanup** (Changes 325-350) - Improves data consistency
7. **Validation Scripts** (Changes 134-144) - Improves build confidence
8. **Test Coverage** (Changes 150, 491-497) - Prevents regressions

### Low Priority (Polish)

9. **Doc Linting** (Changes 038-047) - Improves doc maintenance
10. **Deprecation Cleanup** (Changes 471-478) - Code cleanup
11. **Snapshot Tests** (Changes 491-497) - Nice to have

## Implementation Phases Completion

- Phase 0 (Enforcement): 50% (25/50) ⏳
- Phase 1 (IDs & Naming): 96% (48/50) ✅
- Phase 2 (Board Model): 62% (31/50) 🟡
- Phase 3 (Deck Factories): 56% (28/50) 🟡
- Phase 4 (Ports): 0% (0/50) ❌
- Phase 5 (Card Systems): 10% (5/50) ❌
- Phase 6 (Events/Time): 16% (8/50) ⏳
- Phase 7 (AI/Prolog): 0% (0/50) ❌
- Phase 8 (Extensions): 0% (0/50) ❌
- Phase 9 (Cleanup): 4% (2/50) ❌

**Overall: 29% (147/500)**

## Next Actions

1. Complete Phase 0 scripts (Changes 030-050)
2. Complete Phase 1 final items (Changes 072, 075)
3. Implement Phase 2 validations (Changes 134-150)
4. Start Phase 4 port model migration (Changes 201-250)

---

*This document is generated from test results and plan tracking. Update by running:*
```bash
npm run gaps:update
```
