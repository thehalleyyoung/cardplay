# Canon Implementation Status

**Generated:** 2026-01-30

This document tracks implementation status of canonical documentation.

---

## Summary

- ✅ **16 Implemented** - Fully implemented with tests
- 🟡 **0 Partial** - Partially implemented
- 🔵 **0 Aspirational** - Design documents, not yet implemented
- ❓ **2 Unknown** - Status not documented

---

## Implemented (16)

These canon docs are fully implemented and tested:

| Document | Test Coverage | Code Modules |
|----------|--------------|--------------|
| `docs/canon/board-analogy.md` | No tests | No modules |
| `docs/canon/card-systems.md` | 2 test(s) | No modules |
| `docs/canon/constraints.md` | 22 test(s) | No modules |
| `docs/canon/deck-systems.md` | 1 test(s) | No modules |
| `docs/canon/declarative-vs-imperative.md` | No tests | No modules |
| `docs/canon/extensibility.md` | No tests | No modules |
| `docs/canon/host-actions.md` | 3 test(s) | No modules |
| `docs/canon/ids.md` | 35 test(s) | No modules |
| `docs/canon/module-map.md` | No tests | 23 module(s) |
| `docs/canon/naming-rules.md` | No tests | No modules |
| `docs/canon/nouns.md` | 1 test(s) | No modules |
| `docs/canon/ontologies.md` | 3 test(s) | No modules |
| `docs/canon/port-vocabulary.md` | 1 test(s) | No modules |
| `docs/canon/ssot-stores.md` | 1 test(s) | No modules |
| `docs/canon/stack-systems.md` | No tests | No modules |
| `docs/canon/terminology-lint.md` | No tests | No modules |

## Partial Implementation (0)

These canon docs are partially implemented:

| Document | Test Coverage | Code Modules | Notes |
|----------|--------------|--------------|-------|

## Aspirational (0)

These canon docs describe future features:

| Document | Notes |
|----------|-------|

## Unknown Status (2)

These canon docs need status annotation:

| Document |
|----------|
| `docs/canon/implementation-status.md` |
| `docs/canon/legacy-type-aliases.md` |

---

## Guidelines

- All canon docs should have a `**Status:**` header
- Implemented features should have corresponding tests
- Code modules should reference their canon docs
- Aspirational features should be clearly marked

To regenerate this document: `npm run docs:implementation-status`
