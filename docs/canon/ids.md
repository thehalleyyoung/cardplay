# Canonical ID Tables

**Status:** implemented  
**Canonical terms used:** ControlLevel, DeckType, PortType, CultureTag, StyleTag, TonalityModel, CadenceType, MusicConstraint types  
**Primary code references:** `cardplay/src/boards/types.ts`, `cardplay/src/types/primitives.ts`, `cardplay/src/cards/card.ts`, `cardplay/src/ai/theory/music-spec.ts`  
**Analogy:** This is the "official rulebook appendix" listing all valid game piece IDs, zone types, and rule tokens.  
**SSOT:** This document is the single source of truth for canonical IDs. Docs must use these exact values.

---

## Purpose

This document pins the **canonical IDs** used throughout CardPlay. When docs reference these enums/types, they must use the exact values listed here. Extensions must use namespaced IDs.

---

## Core IDs (Stable, Pinned)

### ControlLevel

From `cardplay/src/boards/types.ts`:

```ts
type ControlLevel = 
  | 'full-manual'       // User does everything; no AI assistance
  | 'manual-with-hints' // User drives; AI shows hints/warnings
  | 'assisted'          // AI suggests; user confirms
  | 'collaborative'     // AI and user take turns
  | 'directed'          // User sets goals; AI executes
  | 'generative';       // AI generates; user curates/edits
```

**Usage:** Board policy, gating rules, AI suggestion mode.

---

### DeckType

From `cardplay/src/boards/types.ts`:

```ts
type DeckType = 
  // Pattern/Tracker
  | 'pattern-deck'
  // Notation
  | 'notation-deck'
  // Piano Roll
  | 'piano-roll-deck'
  // Session/Clips
  | 'session-deck'
  // Arrangement
  | 'arrangement-deck'
  // Instruments
  | 'instruments-deck'
  // DSP/Effects
  | 'dsp-chain'
  | 'effects-deck'
  // Samples
  | 'samples-deck'
  | 'sample-manager-deck'
  // Phrases
  | 'phrases-deck'
  // Harmony/Theory
  | 'harmony-deck'
  // Generators
  | 'generators-deck'
  // Mixing
  | 'mixer-deck'
  | 'mix-bus-deck'
  // Routing
  | 'routing-deck'
  // Automation
  | 'automation-deck'
  // Properties
  | 'properties-deck'
  // Transport
  | 'transport-deck'
  // Arranger
  | 'arranger-deck'
  // AI
  | 'ai-advisor-deck'
  // Modulation
  | 'modulation-matrix-deck'
  // Groups
  | 'track-groups-deck'
  // Reference
  | 'reference-track-deck'
  // Analysis
  | 'spectrum-analyzer-deck'
  // Waveform
  | 'waveform-editor-deck';
```

#### Legacy Aliases (doc-only)

| Old Name | Canonical Name | Notes |
|---|---|---|
| `pattern-editor` | `pattern-deck` | Legacy from pre-board era |
| `notation-score` | `notation-deck` | Legacy from pre-board era |
| `piano-roll` | `piano-roll-deck` | Missing `-deck` suffix |
| `session` | `session-deck` | Missing `-deck` suffix |
| `arrangement` | `arrangement-deck` | Missing `-deck` suffix |
| `mixer` | `mixer-deck` | Missing `-deck` suffix |

---

### PPQ (Ticks Per Quarter Note)

From `cardplay/src/types/primitives.ts`:

```ts
export const PPQ = 960 as const;
```

**Usage:** All tick calculations must use PPQ=960. Never use 96 or other values in docs/examples.

**Time conversions:**
- 1 quarter note = 960 ticks
- 1 beat (at 4/4) = 960 ticks
- 1 bar (at 4/4) = 3840 ticks
- 1 sixteenth note = 240 ticks
- 1 eighth note = 480 ticks

---

### PortType

From `cardplay/src/cards/card.ts`:

```ts
// Canonical builtin port types
const PortTypes = {
  audio: 'audio' as PortType,
  midi: 'midi' as PortType,
  notes: 'notes' as PortType,
  control: 'control' as PortType,
  trigger: 'trigger' as PortType,
  gate: 'gate' as PortType,
  clock: 'clock' as PortType,
  transport: 'transport' as PortType,
} as const;
```

**Extension:** Custom port types must be namespaced: `<namespace>:port_type`

See [Port Vocabulary](./port-vocabulary.md) for compatibility rules.

---

## MusicSpec IDs

From `cardplay/src/ai/theory/music-spec.ts`:

### CultureTag

```ts
type CultureTag = 
  | 'western'   // Western tonal music
  | 'carnatic'  // South Indian classical
  | 'celtic'    // Irish/Scottish/Breton traditional
  | 'chinese'   // Chinese traditional
  | 'hybrid';   // Cross-cultural fusion
```

### StyleTag

```ts
type StyleTag = 
  | 'galant'      // 18th century galant style
  | 'baroque'     // Baroque period
  | 'classical'   // Classical period
  | 'romantic'    // Romantic period
  | 'cinematic'   // Film score style
  | 'trailer'     // Trailer music
  | 'underscore'  // Background/ambient scoring
  | 'edm'         // Electronic dance music
  | 'pop'         // Pop music
  | 'jazz'        // Jazz
  | 'lofi'        // Lo-fi hip hop / chill
  | 'custom';     // User-defined style
```

### TonalityModel

```ts
type TonalityModel = 
  | 'ks_profile'   // Krumhansl-Schmuckler key profiles
  | 'dft_phase'    // DFT phase-based tonality
  | 'spiral_array'; // Chew's Spiral Array model
```

**Note:** `hybrid` was previously mentioned in some docs but is not implemented. Mark as legacy/aspirational.

### ModeName

```ts
type ModeName = 
  | 'ionian' | 'dorian' | 'phrygian' | 'lydian' 
  | 'mixolydian' | 'aeolian' | 'locrian'
  // Extended modes
  | 'harmonic_minor' | 'melodic_minor'
  | 'pentatonic_major' | 'pentatonic_minor'
  | 'blues' | 'whole_tone' | 'diminished';
```

### CadenceType

```ts
type CadenceType = 
  | 'perfect_authentic'    // PAC: V → I, soprano on tonic
  | 'imperfect_authentic'  // IAC: V → I, soprano not on tonic
  | 'half'                 // HC: ends on V
  | 'plagal'               // PC: IV → I
  | 'deceptive'            // DC: V → vi (or other)
  | 'phrygian_half'        // PHC: iv6 → V in minor
  | 'evaded';              // Cadence avoided/interrupted
```

#### Legacy Cadence Aliases (doc-only)

| Abbreviation | Canonical CadenceType | Notes |
|---|---|---|
| `PAC` | `perfect_authentic` | Common abbreviation |
| `IAC` | `imperfect_authentic` | Common abbreviation |
| `HC` | `half` | Common abbreviation |
| `PC` | `plagal` | Common abbreviation |
| `DC` | `deceptive` | Common abbreviation |
| `pac` | `perfect_authentic` | Lowercase variant |

---

## MusicConstraint Type Strings

From `cardplay/src/ai/theory/music-spec.ts`:

### Builtin Constraint Types

```ts
// Key/Tonality
| 'key'              // Key constraint: { key, mode }
| 'tonality_model'   // Analysis model: { model: TonalityModel }

// Meter/Rhythm
| 'meter'            // Time signature: { numerator, denominator }
| 'tempo'            // Tempo: { bpm, allowRubato }

// Harmony
| 'cadence'          // Cadence: { cadenceType, position }
| 'chord_progression'// Progression: { progression: ChordSymbol[] }
| 'harmonic_rhythm'  // Rate: { beatsPerChord }
| 'avoid_parallel'   // Voice leading: { intervals: number[] }

// Melody
| 'range'            // Pitch range: { low, high }
| 'contour'          // Shape: { shape: 'ascending' | 'descending' | 'arch' | ... }
| 'density'          // Note density: { notesPerBeat }

// Style/Culture
| 'culture'          // Culture tag: { culture: CultureTag }
| 'style'            // Style tag: { style: StyleTag }
| 'schema'           // Galant schema: { schemaName }

// Carnatic
| 'raga'             // Raga: { raga: RagaName }
| 'tala'             // Tala: { tala: TalaName, jati? }
| 'gamaka_density'   // Ornaments: { density: 'light' | 'medium' | 'heavy' }
| 'eduppu'           // Starting beat: { eduppu: 'sama' | 'vishama' | ... }

// Celtic
| 'tune_type'        // Tune form: { type: 'jig' | 'reel' | ... }
| 'tune_form'        // Structure: { form: 'AABB' | 'AABA' | ... }

// Chinese
| 'chinese_mode'     // Mode: { mode: ChinesModeName }
| 'heterophony'      // Texture: { enabled: boolean }

// Film/Media
| 'film_device'      // Scoring device: { device: FilmDeviceName }
```

### Custom Constraint Types (Extension)

Custom constraints **must** be namespaced:

```
<namespace>:<constraint_type>
```

Examples:
- `arabic:maqam` — Arabic maqam constraint
- `japanese:scale` — Japanese scale constraint
- `vendor:custom_rule` — Third-party constraint

Register custom constraints via `cardplay/src/ai/theory/custom-constraints.ts`.

---

## Routing Edge Types

From `cardplay/src/state/types.ts`:

```ts
type RoutingConnectionType = 
  | 'audio'       // Audio signal
  | 'midi'        // MIDI messages
  | 'modulation'  // Control rate modulation
  | 'sidechain';  // Sidechain signal
```

**Note:** `cv` and `data` appear in some docs but may not be implemented. Check code before using.

---

## Namespaced ID Pattern

For all extensible IDs (cards, constraints, decks, boards, themes, ontology packs):

```
<namespace>:<name>
```

### Rules

1. **`namespace`** should match:
   - Pack/author domain (e.g., `mycompany`)
   - Stable subsystem prefix (e.g., `carnatic`, `galant`)
   
2. **Builtins may omit namespace** — but third-party additions **must not**

3. **Examples:**
   - `theory:tonality_model` — Builtin theory card
   - `carnatic:raga` — Carnatic-specific constraint
   - `vendor:custom_card` — Third-party card
   - `user:my_preset` — User-created preset

4. **Registration required** — Namespaced IDs must be registered via appropriate registry

---

## Version Identifiers

For extensible artifacts (packs, schemas, state snapshots, KB packs):

```
<artifact_type>/<namespace>:<name>@<version>
```

Examples:
- `pack/mycompany:instruments@1.2.0`
- `schema/state@2.0.0`
- `kb/galant:schemata@1.0.0`

---

## Usage Rules

1. **Use exact canonical values** — no synonyms or abbreviations in code/docs
2. **Map legacy values** — use the LEGACY-ALIASES tables when converting old docs
3. **Namespace extensions** — all non-core IDs must use `<namespace>:<name>`
4. **Link to this doc** — reference this doc when introducing IDs in other docs
5. **Don't invent new core IDs** — extend via namespaced IDs + registries
