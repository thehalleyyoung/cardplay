# Validator Rules
Assumes canonical model and terminology in `cardplay2.md` (repo root).

**Status:** Mix of implemented and aspirational  
**Real implementation:** `cardplay/src/extensions/validators.ts` and `cardplay/src/registry/v2/validate.ts`

Validators aim to catch common mistakes early (registry defs, graphs, patches).

## Registry validators

Implementation:
- `src/extensions/validators.ts` [**Implemented**]
- `src/registry/v2/validate.ts` [**Implemented**]

Examples:
- port type defs must have non-empty `type` [**Implemented**]
- card IDs must be namespaced for extensions [**Implemented**]
- pack manifests must have valid namespace and version [**Implemented**]

**Aspirational:**
- adapter edges must have `from`, `to`, `card`, and non-negative `cost`
- protocol defs must have non-empty names and valid method signatures

## Graph validators

**Aspirational reference:** `src/core/graph-validator.ts` (does not exist)

**Implemented validators:**
- Connection validation: `src/boards/gating/validate-connection.ts` [**Implemented**]
- Routing graph validation: `src/state/routing-graph.ts` [**Implemented**]

Examples:
- edges must reference existing nodes
- edges must reference existing ports
- port types must be compatible or require adapters [**Implemented in validate-connection.ts**]

## Registry v2 validation

Registry v2 adds "tooling-level" validation:
- entry ids are unique and non-empty [**Implemented**]
- metadata fields exist (`namespace`, `provenance`, `trust`) [**Implemented**]
- pack records have valid ids and semver [**Implemented**]

This is used for:
- validator coverage reports [**Implemented in scripts/registry-report.ts**]
- stable snapshot testing of validator messages [**Aspirational**]
