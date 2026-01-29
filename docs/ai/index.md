# AI Docs Index

This section documents CardPlay’s Prolog-based AI system (rule-based reasoning; no model inference).

## Key capabilities

- **Prolog engine + adapter**: load KBs, query, profile, cache.
  - See: `prolog-engine-choice.md`, `prolog-reference.md`, `prolog-syntax.md`
- **Knowledge bases (KBs)**: music theory, boards/decks, composition patterns, workflow planning, project analysis, learning/adaptation.
  - See: `kb-architecture.md`
- **Workflow planning**: goal → step plan, deck sequencing, routing suggestions, configuration optimization.
  - See: `workflow-planning.md`
- **Project analysis**: detect issues and provide remedies (missing/overused/structural/technical/consistency).
  - See: `project-analysis.md`
- **Learning + adaptation**: local-only preference learning, skill estimation, progressive disclosure, error prevention.
  - See: `learning.md`, `privacy.md`
- **Performance tooling**: profiling, budgets, benchmarks, memory estimates.
  - See: `performance.md`

## Common API entry points (TypeScript)

Workflow planning:

```ts
import { planWorkflow } from '@/ai/queries/workflow-queries';
const plan = await planWorkflow('make_beat', 'producer');
```

Project analysis:

```ts
import { analyzeProject } from '@/ai/queries/workflow-queries';
const result = await analyzeProject({ elements: ['drums', 'melody'] });
```

## Where to start

- If you’re integrating AI into UI: `ai-advisor.md`, `board-integration-guide.md`
- If you’re extending rules: `kb-architecture.md`, `extending-music-theory-kb.md`
- If you’re debugging: `troubleshooting.md`

