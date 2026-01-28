# Coding style
Assumes canonical model and terminology in `cardplay2.md` (repo root).

- Prefer pure functions and immutable updates in `src/core/` and `src/state/`.
- Keep ordering stable: sort by ids where possible.
- Use `type` imports (`import type { ... }`) for types.
- Keep tests deterministic (avoid real time and randomness; use seeded RNG utilities).

