# Project Analysis

CardPlay’s project analysis system is a Prolog knowledge base that helps identify common project problems (missing elements, structural issues, technical problems, and consistency concerns) and provides plain-language remedies.

Implementation:

- KB: `src/ai/knowledge/project-analysis.pl`
- Loader: `src/ai/knowledge/project-analysis-loader.ts`
- Queries: `src/ai/queries/workflow-queries.ts`

## Two ways to use it

### 1) Browse the “issue catalog”

These functions return the **full set of known issues** and their remedies/descriptions:

- `getMissingElements()`
- `getOverusedElements()`
- `getStructuralIssues()`
- `getTechnicalIssues()`
- `getStyleConsistencyIssues()`
- `getHarmonyCoherenceIssues()`
- `getRhythmConsistencyIssues()`
- `getInstrumentationBalanceIssues()`

This is useful for UI lists, tooltips, and “what can the system detect?” browsing.

### 2) Analyze a specific project snapshot (recommended)

Use `analyzeProject(snapshot)` to inject a project snapshot into the KB and get **only issues relevant to that snapshot**.

The snapshot has two inputs:

- `elements`: what the project contains (used to infer missing elements).
- `issueFlags`: issues detected elsewhere (audio analysis, arrangement heuristics, etc.) that should be mapped to KB remedies.

```ts
import { analyzeProject } from '@/ai/queries/workflow-queries';

const analysis = await analyzeProject({
  elements: ['drums', 'melody', 'harmony', 'intro', 'outro', 'transition', 'variation'],
  issueFlags: [{ category: 'technical', issueId: 'clipping' }],
  stats: { track_count: 6, effect_count: 8 },
});

console.log(analysis.issues);
```

## Examples of typical issues (N096)

Common “missing element” signals:

- `missing:no_bass` → “Add a bass element to anchor the low end”
- `missing:no_transition` → “Add transitions (fills, risers, sweeps) between sections”
- `missing:no_variation` → “Add variation to repeated sections to prevent monotony”

Common technical/structural flags to feed via `issueFlags`:

- `technical:clipping`, `technical:mud_buildup`, `technical:phase_cancellation`
- `structural:monotonic_energy`, `structural:weak_hook`, `structural:no_buildup`

