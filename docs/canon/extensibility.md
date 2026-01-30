# Extensibility

**Status:** implemented  
**Canonical terms used:** CardPack, Registry, namespaced IDs  
**Primary code references:** `cardplay/src/cards/registry.ts`, `cardplay/src/boards/registry.ts`, `cardplay/src/ai/knowledge/music-theory-loader.ts`  
**Analogy:** The "mod loader" system for adding expansion packs.  
**SSOT:** This document defines how to extend CardPlay.

---

## Extension Is Default

CardPlay treats user-installed packs as first-class. Every extensible subsystem documents:
- What can extend it
- Registration mechanism
- ID namespace rules
- Versioning
- Failure modes

---

## Extension Surfaces

### 1. Cards

**Registry:** `cardplay/src/cards/registry.ts`  
**ID format:** `<namespace>:<card_name>`  
**What you can add:** New `Card<A,B>` transforms  
**Capabilities:** Must declare required capabilities  

### 2. Theory Cards

**Location:** `cardplay/src/ai/theory/theory-cards.ts`  
**ID format:** `theory:<card_name>` or `<namespace>:<card_name>`  
**What you can add:** New `TheoryCardDef` constraint editors  

### 3. Boards

**Registry:** `cardplay/src/boards/registry.ts`  
**ID format:** `<namespace>:<board_name>`  
**What you can add:** New board definitions with layout + policy  

### 4. Deck Templates (AI)

**Location:** `cardplay/src/ai/theory/deck-templates.ts`  
**ID format:** `<namespace>:<template_name>`  
**What you can add:** Recommended card combinations  

### 5. Ontology Packs (Prolog KB)

**Loader:** `cardplay/src/ai/knowledge/music-theory-loader.ts`  
**ID format:** Predicate namespacing `<namespace>_predicate/N`  
**What you can add:** New `.pl` files with theory rules  

### 6. Custom Constraints

**Registry:** `cardplay/src/ai/theory/custom-constraints.ts`  
**ID format:** `<namespace>:<constraint_type>`  
**What you can add:** New constraint types for MusicSpec  

### 7. Themes

**Location:** `cardplay/src/boards/theme/*`  
**ID format:** `<namespace>:<theme_name>`  
**What you can add:** Visual customization (colors, fonts)  
**Note:** Themes are visual only—no logic  

---

## CardPack Format

A CardPack bundles multiple extensions:

```json
{
  "name": "vendor:my-pack",
  "version": "1.0.0",
  "cards": [...],
  "theoryCards": [...],
  "boards": [...],
  "themes": [...],
  "kbFiles": ["my-theory.pl"],
  "constraints": [...]
}
```

See `cardplay/docs/pack-format-reference.md` for full schema.

---

## ID Namespace Rules

1. **Format:** `<namespace>:<name>`
2. **Namespace:** Match pack name or author domain
3. **Builtins:** May omit namespace (e.g., `theory:key`)
4. **Extensions:** Must include namespace
5. **Collisions:** Loader rejects duplicate IDs

---

## Versioning

Extensions declare versions in pack manifest:

```json
{
  "version": "1.2.0",
  "minEngineVersion": "0.5.0"
}
```

Migration handled by version-aware loaders.

---

## Failure Modes

| Situation | Behavior |
|---|---|
| Missing extension | Placeholder/warning, project still loads |
| Invalid extension | Rejected at load time with diagnostic |
| Version mismatch | Warning + degraded mode or migration |
| Unknown action type | Ignored with diagnostic |
| Capability not granted | Feature disabled with explanation |

---

## EXTENSIBILITY-CONTRACT/1 Template

Use when documenting extensible surfaces:

```md
#### Extensibility Contract
- **What can extend this:** builtin | user pack | project-local
- **Extension surface:** <what's being extended>
- **Registration/loader:** <registry API + file path>
- **ID namespace rule:** `<namespace>:<name>`
- **Versioning:** <schema version + migration story>
- **Capabilities/sandbox:** <required capabilities>
- **Failure mode:** <what happens if missing/broken>
```
