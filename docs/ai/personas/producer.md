# Producer / Beatmaker Persona

Focus: arrangement templates, mix checklists, mastering readiness, and production-oriented routing/board layouts.

## Implementation

- Prolog KB: `src/ai/knowledge/persona-producer.pl`
- Loader: `src/ai/knowledge/persona-loader.ts`
- Query helpers: `src/ai/queries/persona-queries.ts` (producer section)

## What the AI helps with

- Arrangement structure templates by genre
- Mix checklist suggestions (balance, routing, common fixes)
- Mastering readiness checks + targets (LUFS/dynamics guidance)
- Board/deck layout defaults for production flow

Key query helpers:

- `suggestArrangementStructure(genre, clips)`
- `suggestMixChecklist(genre)`
- `getMasteringTarget(genre)`

## Recommended boards / decks

Typical targets:

- Producer boards (timeline + session + mixer)
- Boards that emphasize arrangement and mixing views

Useful decks:

- Timeline / arrangement
- Session grid
- Mixer + routing
- AI advisor (planning a workflow, diagnosing mix issues)

## Example “Ask AI” prompts

- “Suggest an arrangement for a 2:30 lofi beat.”
- “What’s the next section I should build (verse/chorus/breakdown)?”
- “Give me a quick mix checklist for house.”
- “Is this mix ready for mastering?”

