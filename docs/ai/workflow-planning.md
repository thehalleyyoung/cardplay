# Workflow Planning

CardPlay’s workflow planning system uses the Prolog knowledge base in `src/ai/knowledge/workflow-planning.pl` plus TypeScript query wrappers in `src/ai/queries/workflow-queries.ts` to:

- Decompose a high-level goal into ordered steps (`task_decomposition/3`).
- Recommend a deck opening order (`deck_sequencing/2`).
- Validate whether a workflow is feasible given available decks (`validateWorkflow()`).
- Suggest routing graphs (`routing_template/3` → `suggestRouting()`), and validate routing graphs (`validateSignalFlowGraph()`).
- Recommend deck configuration changes (`deck_configuration_pattern/3` → `optimizeConfiguration()`).

## Goals and personas

Workflow APIs expect **Prolog atoms** (not arbitrary strings) for `goal` and `persona`. Examples in the shipped KB include:

- Goals: `make_beat`, `mix_track`, `master_track`, `arrange_song`, `compose_score`, `design_sound`
- Personas: `producer`, `tracker_user`, `notation_composer`, `sound_designer`

## Core API surface

Primary entry points (see `src/ai/queries/workflow-queries.ts`):

- `planWorkflow(goal, persona)` → ordered workflow steps
- `validateWorkflow(goal, persona, availableDecks)` → errors/warnings
- `executeWorkflowStep(goal, stepIndex, availableDecks)` → “completed / skipped / failed”
- `optimizeConfiguration(goal, currentState)` → recommended config changes + sync rules
- `suggestRouting(taskType, availableDecks)` → filtered routing graph
- `validateSignalFlowGraph(connections)` → cycle/orphan detection + KB validations

## Example: plan a lofi beat workflow (N044)

Use the `make_beat` goal to get a concrete step list and then drive UI/UX from it (e.g., render “next step” prompts).

```ts
import { planWorkflow, validateWorkflow } from '@/ai/queries/workflow-queries';

const plan = await planWorkflow('make_beat', 'producer');
if (!plan) throw new Error('No workflow plan found');

const availableDecks = [
  'pattern_editor',
  'sample_browser',
  'instrument_rack',
  'effect_chain',
  'mixer',
  'transport', // avoids tempo/key dependency warnings
];

const validation = await validateWorkflow('make_beat', 'producer', availableDecks);
if (!validation.valid) {
  console.warn('Workflow invalid:', validation.errors);
}
```

## Example: optimize mixing board configuration (N045)

Compare current deck state against KB patterns (e.g., `deck_configuration_pattern(mix_track, mixer, ...)`) and apply changes.

```ts
import { optimizeConfiguration } from '@/ai/queries/workflow-queries';

const result = await optimizeConfiguration('mix_track', {
  mixer: ['meter_type(peak_rms)'], // intentionally incomplete
});

for (const change of result.changes) {
  console.log(`${change.deckType}: add ${change.setting} (${change.reason})`);
}
```

## Example: setup routing for live performance (N046)

Use routing templates to generate a suggested graph and validate it before applying connections.

```ts
import { suggestRouting, validateSignalFlowGraph } from '@/ai/queries/workflow-queries';

const graph = await suggestRouting('beat_making', [
  'drums',
  'drum_bus',
  'reverb',
  'master',
]);

const check = await validateSignalFlowGraph(graph.connections);
if (!check.valid) {
  console.warn(check.issues);
}
```

## Extending the workflow KB

- Add new `task_decomposition/3`, `deck_sequencing/2`, `routing_template/3`, and `deck_configuration_pattern/3` facts to `src/ai/knowledge/workflow-planning.pl`.
- Keep atoms ASCII and valid Prolog identifiers (Tau Prolog is strict about leading digits and non-ASCII atoms).

