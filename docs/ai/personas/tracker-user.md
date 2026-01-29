# Tracker User Persona

Focus: pattern workflows, groove/humanization, routing suggestions, and live performance layout support.

## Implementation

- Prolog KB: `src/ai/knowledge/persona-tracker-user.pl`
- Loader: `src/ai/knowledge/persona-loader.ts`
- Query helpers: `src/ai/queries/persona-queries.ts` (tracker section)

## What the AI helps with

- Pattern length and variation suggestions
- Groove templates and humanization amounts by genre
- Effect chain suggestions for common tracker tasks
- Routing suggestions + validation (feedback loop detection)
- Performance mode layout guidance (HUD, launch controls)

Key query helpers:

- `suggestPatternLengths(genre)`
- `getGrooveTemplates()`, `applyGroove(pattern, template)`
- `getHumanizationAmount(genre)`, `humanize(pattern, amount)`
- `getTrackerVariationTechniques()`, `generateVariation(pattern, technique)`
- `suggestTrackerRouting(nodes)`, `optimizeTrackerRouting(nodes)`
- `detectFeedbackLoop(graph)`
- `getPerformanceModeLayout()`, `getLaunchQuantizationModes()`

## Recommended boards / decks

Typical targets:

- Tracker + harmony (assisted) for harmonic context + coloring
- Tracker + phrases (assisted) for phrase browsing and adaptation
- Live performance tracker board for rapid pattern switching

Useful decks:

- Tracker editor + mixer + routing graph
- Harmony display / explorer
- AI advisor (workflow questions, routing help)

## Example “Ask AI” prompts

- “Suggest a swing/groove template for this pattern.”
- “Generate 3 variations of this pattern without changing the groove.”
- “Optimize this routing to avoid feedback loops.”
- “What launch quantization should I use for house vs DnB?”

