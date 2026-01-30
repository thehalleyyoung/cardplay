# Stack Systems

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document tracks Stack-related type exports across composition and UI systems.
CardPlay has two distinct "Stack" concepts that serve different purposes.

---

## Overview

The term "Stack" appears in two subsystems:

1. **Core Stacks** (`src/cards/stack.ts`): Composable card stacks
2. **UI Layout Stacks** (`src/ui/components/stack-component.ts`): Visual stacking layouts

---

## Core Stacks (Composition)

These types support card composition and signal flow:

| Name | Type | Description |
|------|------|-------------|
| `createStack` | function | N/A |
| `generateStackId` | function | N/A |
| `graphToStack` | function | N/A |
| `inferStackPorts` | function | N/A |
| `Stack` | interface | N/A |
| `stackBypassCard` | function | N/A |
| `stackDiff` | function | N/A |
| `StackDiff` | interface | N/A |
| `StackEntry` | interface | N/A |
| `StackEntryState` | interface | N/A |
| `StackGraph` | interface | N/A |
| `StackGraphEdge` | interface | N/A |
| `StackGraphNode` | interface | N/A |
| `stackInsertCard` | function | N/A |
| `stackMerge` | function | N/A |
| `StackMeta` | interface | N/A |
| `StackMode` | type | N/A |
| `stackRemoveCard` | function | N/A |
| `stackReorderCards` | function | N/A |
| `stackRestore` | function | N/A |
| `stackSnapshot` | function | N/A |
| `StackSnapshot` | interface | N/A |
| `stackSoloCard` | function | N/A |
| `stackToCard` | function | N/A |
| `stackToGraph` | function | N/A |
| `StackValidation` | interface | N/A |
| `validateStack` | function | N/A |

**Location:** `src/cards/stack.ts`

## UI Layout Stacks

These types support visual layout and arrangement:

| Name | Type | Description |
|------|------|-------------|
| `createStack` | function | N/A |
| `createUIStack` | function | N/A |
| `StackComponent` | type | N/A |
| `StackEvent` | interface | N/A |
| `StackLifecycle` | interface | N/A |
| `StackOptions` | interface | N/A |
| `StackOrientation` | type | N/A |
| `StackOverflow` | type | N/A |
| `StackState` | type | N/A |
| `UIStackComponent` | class | N/A |

**Location:** `src/ui/components/stack-component.ts`

---

## Disambiguation Rules

1. Composition stacks use `Stack<A,B>` (from `src/cards/stack.ts`)
2. UI layout stacks use `UIStackComponent` or `UILayoutStackMode`
3. Avoid exporting bare `Stack` from barrel files

To regenerate this document: `npm run docs:sync-stack-systems`
