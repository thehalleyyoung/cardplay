# Protocol Compatibility Rules
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Protocols are named interfaces with method signatures and optional effect annotations.

Implementation:
- `src/registry/protocols.ts`
- `src/registry/diff.ts` (diffing protocol snapshots)
- `src/registry/v2/protocol-compat.ts` (matrix + cache)

## What “compatibility” means (Phase 4)

In Phase 4, protocol compatibility is treated as **structural equality**:

- same protocol name
- same ordered set of method names + signatures

Tools:
- Registry diffs flag mismatched protocols
- Registry v2 builds a protocol matrix to enable UI graphs and completeness tests

## Effects

Some protocol methods include `effects` strings. These are:
- documentation / policy hints
- used for “effects emitted” indexing in registry v2 reports

They are not yet enforced at runtime.

