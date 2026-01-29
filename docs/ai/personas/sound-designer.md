# Sound Designer Persona

Focus: synthesis suggestions, modulation routing patterns, effect chains, preset tagging, and constrained randomization.

## Implementation

- Prolog KB: `src/ai/knowledge/persona-sound-designer.pl`
- Loader: `src/ai/knowledge/persona-loader.ts`
- Query helpers: `src/ai/queries/persona-queries.ts` (sound designer section)

## What the AI helps with

- Suggest synthesis approaches (subtractive/FM/granular/etc.) by target sound
- Suggest effect chains for a sound type (pad/lead/bass/fx)
- Suggest modulation routing patterns (mod matrix “recipes”)
- Suggest macro layouts and controller mappings
- Preset tagging/search + A/B comparisons (local-only)
- Parameter randomization constraints (keep results usable)

Key query helpers:

- `suggestSynthesis(soundType)`
- `suggestSoundEffectChain(soundType, style)`
- `suggestModulationRouting(source, target, goal)`
- `suggestMacroLayout(params)`
- `getRandomizationConstraints()`

Related learning stores:

- Preset tagging/search: `src/ai/learning/preset-tagging.ts`

## Recommended boards / decks

Typical targets:

- Sound design boards with synth + modulation + effects focus
- Boards that emphasize macro control and quick auditioning

Useful decks:

- Synth / sampler editor with macro controls
- Modulation matrix / routing graph
- Preset browser with tags + A/B comparisons
- AI advisor (recipes, “how do I build…”, chain suggestions)

## Example “Ask AI” prompts

- “Give me a modulation routing for an evolving ambient pad.”
- “Suggest an effect chain for a punchy bass in techno.”
- “Randomize parameters but keep it playable and not harsh.”
- “How should I map a MIDI controller for performance macros?”

