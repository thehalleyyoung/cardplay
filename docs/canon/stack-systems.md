# Stack Systems

**Status:** implemented  
**Canonical terms used:** Stack, StackMode, StackComponent, DeckCardLayout  
**Primary code references:** `cardplay/src/cards/stack.ts`, `cardplay/src/ui/components/stack-component.ts`, `cardplay/src/boards/types.ts`  
**Analogy:** "Combo chains" for composition vs "list containers" for layout.  
**SSOT:** This document distinguishes composition Stack from UI StackComponent.

---

## Stack Systems Overview

| Stack System | Canonical Name | Location | Purpose |
|---|---|---|---|
| Composition semantics | `Stack` | `cardplay/src/cards/stack.ts` | Serial/parallel card composition |
| UI layout container | `StackComponent` | `cardplay/src/ui/components/stack-component.ts` | Vertical list of UI cards |
| Deck layout mode | `DeckCardLayout = 'stack'` | `cardplay/src/boards/types.ts` | How cards display in a deck |

---

## 1. Composition Stack

**Location:** `cardplay/src/cards/stack.ts`

**Purpose:** Compose multiple `Card<A,B>` transforms.

```ts
type StackMode = 'serial' | 'parallel' | 'layer' | 'tabs';

interface Stack<A, B> {
  readonly cards: readonly Card<any, any>[];
  readonly mode: StackMode;
  compose(): Card<A, B>;
}
```

**Analogy:** A "combo chain" of rule cards.

---

## 2. UI StackComponent

**Location:** `cardplay/src/ui/components/stack-component.ts`

**Purpose:** Vertical list container for UI card elements.

**Naming rule:** Call this `StackComponent (UI vertical list)` in docs.

---

## 3. DeckCardLayout

**Location:** `cardplay/src/boards/types.ts`

```ts
type DeckCardLayout = 'stack' | 'tabs' | 'split' | 'floating' | 'grid';
```

This is a **layout mode**, not computation semantics.

---

## Usage Rules

- Use `Stack` for card composition logic
- Use `StackComponent (UI vertical list)` for UI containers
- Don't confuse `StackMode = 'tabs'` with `DeckCardLayout = 'tabs'`
