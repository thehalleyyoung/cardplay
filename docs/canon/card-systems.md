# Card Systems

**Status:** implemented  
**Canonical terms used:** Card<A,B>, CoreCard, AudioModuleCard, UICardComponent, TheoryCardDef, CardDefinition  
**Primary code references:** `cardplay/src/cards/card.ts`, `cardplay/src/audio/instrument-cards.ts`, `cardplay/src/ui/components/card-component.ts`, `cardplay/src/ai/theory/theory-cards.ts`, `cardplay/src/cards/card-visuals.ts`  
**Analogy:** Different types of "game pieces" with different rules for how they connect and behave.  
**SSOT:** This document is the canonical reference for distinguishing the multiple "card" systems in the codebase.

---

## Purpose

The CardPlay codebase contains multiple "card" concepts that are **not interchangeable**. This document explicitly enumerates them to prevent confusion.

---

## Card Systems Overview

| Card System | Canonical Name | Location | Purpose |
|---|---|---|---|
| Core typed transform | `Card<A,B>` / `CoreCard` | `cardplay/src/cards/card.ts` | Data transformation with ports |
| Audio processing module | `AudioModuleCard` | `cardplay/src/audio/instrument-cards.ts` | Runtime DSP with audio/MIDI |
| UI component shell | `UICardComponent` | `cardplay/src/ui/components/card-component.ts` | Visual lifecycle + interaction |
| Theory constraint card | `TheoryCardDef` | `cardplay/src/ai/theory/theory-cards.ts` | MusicSpec constraint editor |
| Visual definition schema | `CardDefinition` | `cardplay/src/cards/card-visuals.ts` | Parameter/preset UI schema |

---

## 1. Core Card (`Card<A,B>`)

**Location:** `cardplay/src/cards/card.ts`

**Purpose:** A typed morphism that transforms input type `A` to output type `B`.

```ts
interface Card<A, B> {
  readonly id: CardId;
  readonly name: string;
  readonly inputType: PortType;
  readonly outputType: PortType;
  readonly transform: (input: A) => B;
  readonly ports: readonly Port[];
  readonly metadata: CardMetadata;
}
```

**Key characteristics:**
- Pure data transformation
- Type-safe input/output contracts
- Composable via `Stack` (`cardplay/src/cards/stack.ts`)
- Registered in `cardplay/src/cards/registry.ts`

**Analogy:** A "rule card" or "spell" that transforms tokens.

---

## 2. Audio Module Card (`AudioModuleCard`)

**Location:** `cardplay/src/audio/instrument-cards.ts`

**Purpose:** Runtime audio/MIDI processing module.

```ts
interface Card {
  readonly id: string;
  readonly name: string;
  bypass: boolean;
  mute: boolean;
  solo: boolean;
  processAudio(buffer: Float32Array, sampleRate: number): void;
  processMIDI(event: MIDIEvent): void;
}
```

**Key characteristics:**
- Real-time audio processing
- State (bypass, mute, solo)
- Sample-accurate timing
- Part of audio engine graph

**Analogy:** An "instrument piece" or "effect unit" on the board.

**Distinction from CoreCard:** AudioModuleCard has runtime state and processes audio; CoreCard is a pure data transform.

---

## 3. UI Card Component (`UICardComponent`)

**Location:** `cardplay/src/ui/components/card-component.ts`

**Purpose:** UI lifecycle wrapper with drag/resize/interaction.

```ts
class CardComponent {
  readonly element: HTMLElement;
  readonly portType: PortType; // 'audio_in' | 'audio_out' | 'mod_in' | ...
  
  onDragStart(e: DragEvent): void;
  onResize(dimensions: Dimensions): void;
  render(): void;
}
```

**Key characteristics:**
- DOM-based UI component
- Drag and drop handling
- Visual port representation
- Styling and theming

**Analogy:** A "game piece" you can pick up and move on the board.

**Distinction from CoreCard:** UICardComponent is a visual shell; CoreCard is the underlying logic.

---

## 4. Theory Card (`TheoryCardDef`)

**Location:** `cardplay/src/ai/theory/theory-cards.ts`

**Purpose:** UI for editing MusicSpec constraints.

```ts
interface TheoryCardDef {
  readonly cardId: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: TheoryCardCategory;
  readonly cultures: readonly CultureTag[];
  readonly params: readonly TheoryCardParam[];
  
  extractConstraints(state: TheoryCardState): MusicConstraint[];
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec;
}
```

**Key characteristics:**
- Edits MusicSpec constraints
- Has UI parameters (dropdowns, sliders, toggles)
- Produces MusicConstraint objects
- Categorized by culture/style

**Analogy:** A "settings card" that configures the game rules.

**Distinction from CoreCard:** TheoryCardDef produces constraints, not data transforms.

---

## 5. Card Definition (`CardDefinition`)

**Location:** `cardplay/src/cards/card-visuals.ts`

**Purpose:** Visual/parameter schema for card UI rendering.

```ts
interface CardDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly ports: readonly PortDefinition[];
  readonly parameters: readonly ParameterDefinition[];
  readonly presets: readonly PresetDefinition[];
}
```

**Key characteristics:**
- Describes UI appearance
- Defines available parameters
- Lists presets
- Used by card editor

**Analogy:** The "card template" printed on the game piece.

**Distinction from CoreCard:** CardDefinition describes presentation; CoreCard is the logic.

---

## Extensibility Contract

#### EXTENSIBILITY-CONTRACT/1

- **What can extend this:** user pack | project-local
- **Extension surface:** New cards of any type can be shipped via CardPacks
- **Registration/loader:** 
  - CoreCard: `cardplay/src/cards/registry.ts`
  - TheoryCardDef: `cardplay/src/ai/theory/theory-cards.ts` exports + category registration
  - AudioModuleCard: Audio engine module registration
- **ID namespace rule:** `<namespace>:<card_name>` (e.g., `vendor:my_synth`)
- **Versioning:** Pack manifest version
- **Capabilities/sandbox:** Cards must declare required capabilities
- **Failure mode:** Unknown cards render placeholder; missing dependencies show error

---

## Which Card System to Use?

| If you need to... | Use this card system |
|---|---|
| Transform data between types | `Card<A,B>` (CoreCard) |
| Process audio/MIDI in real-time | `AudioModuleCard` |
| Create draggable UI elements | `UICardComponent` |
| Edit MusicSpec constraints | `TheoryCardDef` |
| Define card UI appearance | `CardDefinition` |

---

## Common Mistakes

❌ "Define a new `CardDefinition` for the audio processor" — Use `AudioModuleCard`, not `CardDefinition`

❌ "The card transforms the audio signal" for a `TheoryCardDef` — Theory cards produce constraints, not audio

❌ "Register the UI component in the card registry" — Card registry is for `Card<A,B>`, not UI components

❌ "Create a new interface Card" in a random file — Use the canonical card system for your use case
