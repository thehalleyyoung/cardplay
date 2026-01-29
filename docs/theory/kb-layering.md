# Knowledge Base Layering and Responsibilities

> **Roadmap Item**: C021 Add docs: "Where does this knowledge live?" (KB layering and responsibilities).

## Overview

This document defines where different kinds of musical knowledge live in the CardPlay system, distinguishing between TypeScript-side representations and Prolog knowledge bases.

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     UI Layer (Svelte)                           │
│  Card parameters, user interactions, real-time visualization    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  TypeScript Bridge Layer                        │
│  MusicSpec, canonical-representations.ts, type validation       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Prolog Knowledge Bases                        │
│  Facts, rules, inference, pattern matching, recommendations     │
└─────────────────────────────────────────────────────────────────┘
```

## Knowledge Base Responsibilities

### `music-theory.pl` - Core Theory
- **Pitch relationships**: intervals, pitch classes, enharmonic equivalence
- **Scale/mode definitions**: pitch class sets, degree functions
- **Chord definitions**: quality, extensions, voicings
- **Key detection algorithms**: KS profiles, DFT phase
- **Consonance/dissonance rules**

### `composition-patterns.pl` - Pattern Knowledge
- **Schema definitions**: Prinner, Romanesca, Monte, Fonte, Meyer
- **Voice-leading rules**: parallel motion, tendency tones
- **Cadence patterns**: authentic, half, deceptive, galant-era
- **Phrase structure rules**: antecedent-consequent, sentence, period
- **Harmonic rhythm patterns**

### `music-theory-galant.pl` - 18th Century Schemata
- **Galant schema details**: degree patterns, bass patterns
- **Upper-voice patterns**: thirds, sixths, tenths
- **Schema chaining rules**: which schemas follow which
- **Period-specific voice-leading conventions**

### `music-theory-film.pl` - Cinematic Harmony
- **Film chord progressions**: chromatic mediants, modal mixture
- **Tension/release patterns for scoring**
- **Emotional mapping to harmonic devices**
- **Tempo-drama relationships**

### `music-theory-world.pl` - Non-Western Theory
- **Carnatic system**: ragas, talas, gamakas
- **Celtic system**: tune types, ornament patterns
- **Chinese system**: pentatonic modes, regional styles
- **Hybrid patterns for cross-cultural fusion**

### `music-spec.pl` - Specification Predicates
- **`music_spec/7`**: Bridge predicate for card ↔ KB communication
- **Invariant validation predicates**
- **Spec transformation rules**
- **Default value inference**

## TypeScript Responsibilities

### `music-spec.ts`
- **Type definitions**: TypeScript types mirroring Prolog atoms
- **Validation functions**: ensuring TS values are valid before Prolog
- **Default factories**: creating valid specs with sensible defaults

### `canonical-representations.ts`
- **Lookup tables**: Static data structures for schemas, talas, etc.
- **Conversion utilities**: MIDI ↔ note name, time units
- **Invariant checking**: Fast TS-side validation before Prolog

## Decision Principles

1. **Facts in Prolog, Types in TS**: Raw knowledge lives in Prolog; TypeScript defines the shape of data.

2. **Inference in Prolog**: Any "what follows from X?" logic belongs in Prolog.

3. **Validation at the Bridge**: Before data crosses TS → Prolog, validate in TS.

4. **Performance-Critical in TS**: Real-time audio/MIDI operations stay in TS.

5. **Cultural Knowledge in Specialized KBs**: Each musical tradition gets its own `.pl` file to keep concerns separated.

## Example: Where Does Raga Knowledge Live?

| Aspect | Location | Rationale |
|--------|----------|-----------|
| Raga type definitions | `music-spec.ts` | TS needs to know valid raga names for autocomplete |
| Raga aroha/avaroha | `music-theory-world.pl` | Pitch patterns are knowledge, not types |
| Raga-time associations | `music-theory-world.pl` | "Yaman is an evening raga" is a fact |
| Pitch class set for raga | `canonical-representations.ts` | Fast lookup for real-time matching |
| Raga similarity scoring | `music-theory-world.pl` | Inference rule: "X is similar to Y because..." |

## See Also

- [C022: How card params become Prolog facts](./card-to-prolog-sync.md)
- [C023: How Prolog returns HostActions](./prolog-to-host-actions.md)
