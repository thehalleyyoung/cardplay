# AI Troubleshooting

## KB fails to load / Prolog parse errors

Common causes (Tau Prolog is strict):

- Non-ASCII atoms (use ASCII-only atoms in `.pl` files)
- Atoms starting with digits (avoid tokens like `16_bars`; rewrite as `bars(16)` or `sixteen_bars`)
- Dynamic declarations must use Tau Prolog form: `:- dynamic(foo/2).`

## “KB already loaded” but queries return nothing

If tests or workers create multiple adapters, loaders must track loaded state **per adapter**.

If you add a loader, follow the pattern used by existing loaders (WeakSet/WeakMap keyed by adapter).

## Development: hot reload

During development, KB hot reload can reset loader state and reinitialize the adapter:

- `enableKBHotReload()` in `src/ai/engine/kb-lifecycle.ts`

## Performance regressions

- Run `npm -C cardplay run test:ai:bench` to reproduce performance failures quickly.
- Use `QueryProfiler` and `SlowQueryLogger` to identify slow query patterns.

