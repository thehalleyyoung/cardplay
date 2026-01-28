# WASM
Assumes canonical model and terminology in `cardplay2.md` (repo root).

## Build pipeline

The WASM core lives in `wasm-core/` and is built into `src/wasm/wasm_core/` via `wasm-pack`.

Commands:

- `npm run wasm:build`
- `WASM_SIMD=1 npm run wasm:build` (SIMD)
- `WASM_FEATURES=offline,realtime npm run wasm:build` (Cargo features)

## Memory and performance

WASM memory growth is currently left to the default behavior. If large offline renders require more memory, prefer:

- Chunking renders into bounded blocks
- Reusing output buffers where possible

## Versioning

The exported WASM API version is tracked by the `wasm-core` crate version and surfaced via `wasm_core_version()`.

