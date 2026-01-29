# Notation Composer Persona

Focus: engraving-quality scores, orchestration guidance, form templates, and notation-centric workflows.

## Implementation

- Prolog KB: `src/ai/knowledge/persona-notation-composer.pl`
- Loader: `src/ai/knowledge/persona-loader.ts`
- Query helpers: `src/ai/queries/persona-queries.ts` (notation section)

## What the AI helps with

- Score layout suggestions (staff order, instrument groupings)
- Range checks per instrument and orchestration suitability
- Engraving checks (common formatting issues)
- Form templates (sonata/rondo/etc.) and “check against form”
- Page layout planning (system breaks, page turns)

Key query helpers:

- `suggestScoreLayout(instrumentation)`
- `checkInstrumentRange(part, instrument)`
- `getEngravingRules()`, `checkEngravingQuality(...)`
- `planExportParts(...)`
- `getFormTemplates()`, `applyFormTemplate(...)`, `checkAgainstForm(...)`

## Recommended boards / decks

Typical targets:

- Manual notation boards for writing/engraving
- Assisted notation + harmony boards for harmony checks and suggestions

Useful decks:

- Notation editor + properties
- Harmony display / analysis (for cadence + modulation planning)
- AI advisor (for “how do I…” questions and workflow guidance)

## Example “Ask AI” prompts

- “Check this score for engraving issues.”
- “What’s a good orchestration for this melody in a small ensemble?”
- “Suggest page breaks for 64 measures in a classical style.”
- “Apply a sonata form template to an 80-bar piece.”

