# Ontologies

**Status:** implemented  
**Canonical terms used:** OntologyPack, CultureTag, Prolog KB  
**Primary code references:** `cardplay/src/ai/knowledge/*`, `cardplay/src/ai/knowledge/music-theory-loader.ts`  
**Analogy:** "Expansion packs" with their own rule sets for different music traditions.  
**SSOT:** This document lists ontology packs and their assumptions.

---

## What Is an Ontology Pack?

A coherent set of:
- **Entities** (what exists: notes, ragas, schemata, modes)
- **Assumptions** (12-TET? functional harmony? tala cycles?)
- **Inference rules** (Prolog predicates)

---

## Current Ontology Packs

### Western Tonal

**KB files:** `music-theory.pl`, `music-theory-harmony.pl`  
**Entities:** Keys, modes, chords, cadences, voice leading  
**Assumptions:** 12-TET, functional harmony, Roman numeral analysis  
**Constraints exposed:** `key`, `cadence`, `chord_progression`, `avoid_parallel`

### Galant (18th Century)

**KB files:** `music-theory-galant.pl`  
**Entities:** Schemata (Romanesca, Prinner, Monte, etc.), partimento  
**Assumptions:** 12-TET, galant style conventions  
**Constraints exposed:** `schema` (via `GalantSchemaName`)

### Carnatic

**KB files:** `carnatic-*.pl` files  
**Entities:** Ragas, talas, gamakas, jatis, eduppu  
**Assumptions:** Shruti-based pitch (12-TET approximation for now)  
**Constraints exposed:** `raga`, `tala`, `gamaka_density`, `eduppu`

### Celtic

**KB files:** `celtic-*.pl` files  
**Entities:** Tune types (jig, reel, hornpipe), modes, ornaments  
**Assumptions:** 12-TET, AABB forms  
**Constraints exposed:** `tune_type`, `tune_form`

### Chinese

**KB files:** `chinese-*.pl` files  
**Entities:** Modes, bian tones, heterophony  
**Assumptions:** Pentatonic base, 12-TET approximation  
**Constraints exposed:** `chinese_mode`, `heterophony`

### Computational

**KB files:** `music-theory-tonality.pl`, etc.  
**Entities:** Key profiles, DFT phase, Spiral Array positions  
**Assumptions:** 12-TET, computational analysis  
**Constraints exposed:** `tonality_model`

---

## Ontology Selection

Selected via `MusicSpec.culture` and `MusicSpec.style`:

```ts
culture: 'western' | 'carnatic' | 'celtic' | 'chinese' | 'hybrid'
style: 'galant' | 'baroque' | 'classical' | ...
```

Multiple ontology packs can be loaded simultaneously.

---

## Cross-Ontology Bridges

When mixing ontologies (e.g., Carnatic raga over Western harmony):
1. State the projection assumptions explicitly
2. Use bridge predicates where available
3. Accept that some concepts don't translate

---

## Extensibility

#### EXTENSIBILITY-CONTRACT/1

- **What can extend:** user pack
- **Extension surface:** New `.pl` files + loader registration
- **Registration:** Add to `cardplay/src/ai/knowledge/music-theory-loader.ts`
- **ID namespace:** `<namespace>:` prefix for new predicates
- **Docs update:** Add entry to this file

---

## ONTOLOGY-DECL/1 Template

Use in docs that depend on a specific tradition:

```md
#### Ontology Declaration
- **Ontology pack(s):** western-tonal | galant | carnatic | ...
- **Pitch representation:** MIDI note | pitch class | swara | cents
- **Time representation:** ticks (PPQ=960) | beats | free
- **Assumptions:** 12-TET? functional harmony? cadence vocabulary?
- **KB files:** `cardplay/src/ai/knowledge/<...>.pl`
```
