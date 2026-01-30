# Extending the Music Theory KB (Branch C) (C130)

The Branch C music theory knowledge base is a set of Prolog modules loaded into Tau Prolog.

Core loader:
- `src/ai/knowledge/music-theory-loader.ts`

Core modules:
- `src/ai/knowledge/music-theory.pl` (notes/intervals/scales/chords baseline)
- `src/ai/knowledge/music-theory-computational.pl` (PC profiles, DFT/phase, spiral array, similarity)
- `src/ai/knowledge/music-theory-galant.pl` (schemata)
- `src/ai/knowledge/music-theory-film*.pl` (mood/devices)
- `src/ai/knowledge/music-theory-world.pl` (Carnatic/Celtic/Chinese starter facts)
- `src/ai/knowledge/music-spec.pl` (spec plumbing + constraints + lint/autofix)

## 1) Choose the right layer (C020)

Prefer:
- `music-theory*.pl` for reusable musical relations (facts + derived predicates)
- `music-spec.pl` for *spec-specific* reasoning (conflicts, lint, constraint packs, HostActions)

Avoid putting workflow/deck/board logic into the music theory KB; that belongs in the deck/board reasoning layer.

## 2) Keep predicates pure when possible

Most analysis predicates should be **pure relations**:
- no `assertz/1` or `retractall/1` in the core analysis path
- avoid accidental global state

If you must use dynamic facts:
- keep them scoped (see `spec_push/1` + `spec_pop/1` in `music-spec.pl`)
- document the lifetime and cleanup strategy

## 3) Add facts, then derived predicates, then high-level queries

Recommended order:
1. **Facts** (`*_pcs/2`, templates, schema patterns)
2. **Derived predicates** (normalization, scoring, similarity)
3. **High-level query predicates** (`recommend_*`, `explain_*`, helpers used from TS)

This keeps the KB maintainable and testable.

## 4) Wire to TypeScript APIs

Add TypeScript wrappers in:
- `src/ai/queries/spec-queries.ts` for spec-driven queries
- `src/ai/queries/theory-queries.ts` for general theory queries

If your predicate returns structured terms, ensure `PrologAdapter.termToJS` output is handled.

## 5) Add tests

Preferred tests live alongside query wrappers:
- `src/ai/queries/*.test.ts`

For KB changes, add at least:
- one “happy path” test proving the new predicate succeeds
- one regression test (edge case, or previous bug pattern)

Use `createPrologAdapter({ enableCache: false })` for deterministic tests where helpful.

## 6) KB Contribution Guide (C970)

### Adding New Musical Data Safely

When contributing new ragas, maqamat, scales, rhythms, or other cultural data:

1. **Research**: Use authoritative sources (Sambamoorthy for Carnatic, Touma for Arabic, etc.)
2. **Namespace**: Place new data in the appropriate `.pl` module (e.g., `music-theory-indian.pl`)
3. **Facts first**: Add as Prolog facts, not derived rules. This keeps the KB declarative
4. **Types**: Add corresponding TypeScript types in `music-spec.ts` with `ConstraintBase` extension
5. **Wrappers**: Add async query wrappers in `spec-queries.ts` with Prolog bridge + TS fallback
6. **Tests**: Add both unit tests (predicate loads) and integration tests (workflow pipeline)
7. **Syntax check**: Run `checkPrologSyntax()` on any new `.pl` code
8. **Feature flag**: Gate experimental features behind `TheoryFeatureFlags`

### Data Format Guidelines

```prolog
% Good: explicit, grounded facts
raga_database(mayamalavagowla, [s,r1,g1,m1,p,d1,n1], [n1,d1,p,m1,g1,r1,s], r1, p).

% Bad: overly abstract rules without grounding
raga(X) :- some_complex_derivation(X).
```

### Testing Checklist

- [ ] New predicates load without errors
- [ ] No predicate name conflicts with existing KB
- [ ] TypeScript wrapper handles Prolog-unavailable fallback
- [ ] Fuzz test: random inputs don't crash
- [ ] Integration test: new data works with existing workflows

