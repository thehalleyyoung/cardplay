# Pack signing + trust model (Phase 9)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

## Integrity / signatures

Pack bundles exported by the UI include a best-effort **sha256 integrity signature** over a canonicalized manifest payload (excluding the signature itself).

Verification is best-effort:

- If WebCrypto SHA-256 is unavailable, the hash may be missing.
- ed25519 verification is supported when available via WebCrypto; otherwise it is treated as unverifiable.

Implementation:

- `cardplay/src/sandbox/packs/signing.ts`

## Trust levels

Registry policy and UI support these trust levels:

- `trusted`: full entry kinds
- `local`: full entry kinds (default)
- `untrusted`: restricted entry kinds, and disallowed high-risk capabilities

Implementation:

- `cardplay/src/registry/v2/policy.ts`
- `cardplay/src/registry/v2/types.ts`

