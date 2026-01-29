# Cadence Types (Branch C): Beyond Common-Practice Harmony

In CardPlay, a “cadence” is shorthand for **phrase/section closure**. Branch C treats cadences as:
- a **constraint** (what kind of ending a generator should aim for),
- an **analysis result** (what kind of ending was detected),
- and a **ranking signal** (how “strong” an ending feels depends on context like culture/style).

This doc describes what is implemented today and where the extension points are for non‑common‑practice cadences.

## What exists today

### TypeScript types

Cadence types live in `src/ai/theory/music-spec.ts`:
- `CadenceType`: `authentic`, `perfect_authentic`, `imperfect_authentic`, `half`, `plagal`, `deceptive`
- `ExtendedCadenceType`: `CadenceType` plus additional taxonomy hooks (galant/modal/cinematic/carnatic)

Constraints currently use the core cadence ids:
- `ConstraintCadence.cadenceType` is a `CadenceType` (not `ExtendedCadenceType` yet).

### Prolog predicates

Cadence predicates live in `src/ai/knowledge/music-theory-computational.pl`:
- `detect_cadence/3` — pattern-matches a short chord list into a cadence id
- `cadence_strength/3` — base strength (0–100) for common cadence ids
- `cadence_strength_culture/3` — adjusts cadence strength for `culture/1` via the active `music_spec/7`

TypeScript wrappers live in `src/ai/queries/spec-queries.ts`:
- `detectCadence(chords)` → `Explainable<{ type, confidence }>`
- `getCadenceStrength(cadenceType, spec)` → `Explainable<number>`

## “Beyond common-practice”: taxonomy hooks (extension points)

`ExtendedCadenceType` defines a vocabulary for endings that matter in practice but don’t fit cleanly into V–I / IV–I language:

- `phrygian_half`: minor-mode half-cadence color (bII → V or related phrygian closure feel)
- `picardy`: minor context resolving to major tonic (Picardy third)
- `backdoor`: jazz/pop backdoor dominant color (bVII7 → I / iv → bVII → I family)
- `galant_meyer`: galant Meyer cadence family (schema-driven closure rather than functional V–I only)
- `galant_quiescenza`: galant Quiescenza frame (cadential 6/4 and variants)
- `modal_bvii_i`: modal/plagal modal closure (bVII → i or i ← bVII gestures)
- `modal_iv_i`: modal plagal minor (iv → i, often stronger than “plagal” in modal contexts)
- `cinematic_bvi_bvii_i`: common film “epic” minor closure (bVI → bVII → i)
- `carnatic_arudi`: Carnatic phrase-point closure (arudi) — structurally meaningful but not a chord-function cadence

These are currently **taxonomy hooks** (types + docs) more than fully modeled detection rules.

## How to extend cadence detection and ranking

If you want CardPlay to *detect* and *rank* one of the extended cadence types:

1. **Add/extend Prolog detection**
   - Extend `detect_cadence/3`, or add a new predicate (recommended) like:
     - `detect_extended_cadence(+Chords, +Spec, -CadenceType, -Confidence)`
   - Prefer taking `music_spec/7` (or using `current_spec/1`) so detection can be culture/style‑aware.

2. **Extend cadence strength**
   - Add clauses to `cadence_strength/3` for the new atoms, and/or route through a `cadence_strength_style/3`.
   - Keep strength on `0..100` and explainability via a “reasons” predicate if exposed to UI.

3. **Wire TypeScript**
   - If the cadence should become a **constraint**, widen `ConstraintCadence.cadenceType` to `ExtendedCadenceType` and keep the Prolog encoding `cadence(TypeAtom)` stable.
   - Add tests alongside `detectCadence` / `getCadenceStrength` to ensure round‑trip encoding and stable semantics.

4. **Keep the contract coherent**
   - The cadence “id” should be the same string across:
     - TS discriminants / unions,
     - Prolog atoms,
     - and UI dropdowns (cards).

