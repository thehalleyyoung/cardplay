# GOFAI Music+ Documentation

> **A Deterministic Language Compiler for Musical Intent**

Welcome to the GOFAI Music+ documentation. This section covers the natural language compiler that translates English music instructions into verified CardPlay edits.

---

## Quick Start

GOFAI Music+ lets you edit music with natural language:

```
"Make the chorus brighter and add more energy"
"Keep the melody but simplify the arrangement"
"Cut the drums for two bars before the last chorus"
```

The system:
1. **Parses** your instruction into structured meaning
2. **Shows** what it understood (so you can verify)
3. **Previews** the changes it will make
4. **Applies** only what you approve
5. **Undoes** anything you don't like

---

## Core Principles

### Offline

No network required. Everything runs locally. Your music stays private.

### Deterministic

Same instruction + same project = same result. Every time. No surprises.

### Inspectable

See exactly what was understood, why, and what will change. No black boxes.

### Undoable

Undo any change completely. Try things fearlessly.

---

## Documentation Structure

### Product & Architecture

- [Product Contract](product-contract.md) — What GOFAI is and isn't (non-negotiable guarantees)
- [Architecture Overview](architecture.md) — System design and module structure
- [Pipeline Stages](pipeline.md) — How instructions become edits
- [Roadmap](roadmap.md) — The 500-step implementation plan

### The Language

- [Vocabulary Reference](vocabulary.md) — What words and phrases are understood
- [Perceptual Axes](perceptual-axes.md) — How "brighter", "tighter", etc. map to actions
- [Scopes and References](scopes.md) — Sections, layers, selections
- [Constraints](constraints.md) — "Keep the melody", "don't change", etc.
- [Clarifications](clarification.md) — How ambiguity is handled

### Technical Reference

- [CPL Type System](cpl.md) — The typed logical form specification
- [CPL Schema](cpl-schema.md) — JSON schema for CPL serialization
- [Opcodes](opcodes.md) — The action vocabulary for plans
- [Levers](levers.md) — How axes map to concrete musical changes

### Integration

- [Board Integration](board-integration.md) — GOFAI in the board system
- [Deck Layout](deck-layout.md) — The GOFAI deck UI
- [Extensions](extensions.md) — Adding new vocabulary and capabilities
- [Prolog Integration](prolog-integration.md) — Theory and reasoning layer

### Testing & Validation

- [Testing Strategy](testing.md) — Golden tests, paraphrase invariance
- [Semantic Safety](semantic-safety.md) — Invariants and verification
- [Security Model](security.md) — Offline guarantees, asset protection

### Development

- [Contributing](contributing.md) — How to add features, fix bugs
- [Adding Vocabulary](adding-vocabulary.md) — Extending the lexicon
- [Adding Grammar](adding-grammar.md) — New syntactic constructions
- [Writing Tests](writing-tests.md) — Test patterns and fixtures

---

## Key Concepts

### CPL (CardPlay Logic)

The typed intermediate representation for user intent. CPL has three layers:

1. **CPL-Intent**: What the user meant (goals, constraints, scope)
2. **CPL-Plan**: A validated action sequence (opcodes with parameters)
3. **CPL-Host**: CardPlay-specific mutations (event edits, param changes)

### Edit Package

The atomic unit of change. Every user action produces one edit package containing:
- The normalized intent (CPL)
- The executed plan
- The resulting diff
- Instructions to undo

### Perceptual Axes

Abstract musical qualities that users talk about:
- **brightness** — Timbral/harmonic brightness
- **energy** — Overall activity and impact
- **width** — Stereo spread
- **tightness** — Rhythmic precision
- **tension** — Harmonic/melodic tension
- ... and more

GOFAI maps these to concrete "levers" (register shifts, density changes, parameter tweaks).

### Clarification

When meaning is ambiguous, GOFAI asks a targeted question:

> "By 'darker', do you mean:
> - Timbre (lower brightness, warmer)
> - Harmony (more minor/modal)
> - Register (lower pitch range)
> 
> Default: Timbre"

No silent guessing. User always knows what's being assumed.

---

## Status

GOFAI Music+ is under active development. See the [Product Contract](product-contract.md) for stable guarantees and [Roadmap](roadmap.md) for implementation progress.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Product Contract](product-contract.md) | Core guarantees and non-goals |
| [CPL Reference](cpl.md) | Type system for logical forms |
| [Vocabulary](vocabulary.md) | Supported language constructs |
| [Testing](testing.md) | Test strategy and fixtures |
| [Extensions](extensions.md) | Third-party integration |

---

## Related Documentation

- [CardPlay Architecture](../architecture.md) — Overall system design
- [Board System](../boards/) — Boards, decks, and panels
- [Canon System](../canon/) — Vocabulary and ID discipline
- [AI Theory](../ai/) — Music theory and Prolog integration
