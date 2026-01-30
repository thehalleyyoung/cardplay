# Constraints

**Status:** implemented  
**Canonical terms used:** MusicSpec, MusicConstraint, hard/soft, weight  
**Primary code references:** `cardplay/src/ai/theory/music-spec.ts`, `cardplay/src/ai/theory/custom-constraints.ts`  
**Analogy:** "Rule tokens" or "quest requirements" that define what the music should achieve.  
**SSOT:** This document defines MusicSpec + MusicConstraint semantics.

---

## MusicSpec

**Location:** `cardplay/src/ai/theory/music-spec.ts`

The declarative musical intent container:

```ts
interface MusicSpec {
  culture: CultureTag;
  style: StyleTag;
  constraints: MusicConstraint[];
  // ... other fields
}
```

---

## MusicConstraint

A single constraint within a spec:

```ts
interface MusicConstraint {
  type: string;           // Constraint type identifier
  hard: boolean;          // Hard = must satisfy; Soft = prefer
  weight?: number;        // 0-1, importance for soft constraints
  // ... type-specific fields
}
```

### Hard vs Soft

- **Hard constraints** (`hard: true`): Must be satisfied. Violations are errors.
- **Soft constraints** (`hard: false`): Should be satisfied. Violations are warnings weighted by `weight`.

### Weight

For soft constraints, `weight` (0-1) determines priority when constraints conflict.

---

## Builtin Constraint Types

See [Canonical IDs](./ids.md#musicconstraint-type-strings) for the full list.

Key types:
- `key`, `meter`, `tempo` — Basic musical parameters
- `cadence`, `chord_progression` — Harmony
- `raga`, `tala` — Carnatic
- `tune_type`, `tune_form` — Celtic
- `culture`, `style` — Style selection

---

## Custom Constraints

Custom constraint types **must** be namespaced: `<namespace>:<type>`

Register via `cardplay/src/ai/theory/custom-constraints.ts`.

---

## Conflict Detection

`validateSpecConsistency()` in `music-spec.ts` detects conflicts.

Prolog predicates:
- `spec_conflict/3` — Detects constraint conflicts
- `spec_lint/2` — Lint warnings
- `spec_autofix/3` — Suggested fixes (as HostActions)
