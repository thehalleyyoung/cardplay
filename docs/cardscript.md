# CardScript
Assumes canonical model and terminology in `cardplay2.md` (repo root).

CardScript is a small scripting language used for packs and dynamic cards.

Key ideas:

- Deterministic execution is prioritized.
- Capabilities gate host effects (registry mutation, event emission, etc).
- Errors are surfaced with actionable messages.

## AI / Prolog

CardScript can optionally participate in the Prolog-based AI system:
- Cards/decks defined in CardScript can be synthesized into Prolog facts at install time (so Prolog can reason about what exists).
- Cards can call capability-gated “AI query” helpers (e.g. Prolog queries) to request suggestions/explanations without hardcoding behavior.

See:
- `docs/ai/prolog-engine-choice.md`
- `docs/ai/prolog-deck-reasoning.md`
