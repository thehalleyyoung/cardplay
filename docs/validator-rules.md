# Validator Rules
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Validators aim to catch common mistakes early (registry defs, graphs, patches).

## Registry validators

Implementation:
- `src/registry/validators.ts`
- `src/registry/v2/validate.ts`

Examples:
- port type defs must have non-empty `type`
- adapter edges must have `from`, `to`, `card`, and non-negative `cost`
- protocol defs must have non-empty names and valid method signatures

## Graph validators

Implementation:
- `src/core/graph-validator.ts`

Examples:
- edges must reference existing nodes
- edges must reference existing ports
- port types must be compatible or require adapters

## Registry v2 validation

Registry v2 adds “tooling-level” validation:
- entry ids are unique and non-empty
- metadata fields exist (`namespace`, `provenance`, `trust`)
- pack records have valid ids and semver

This is used for:
- validator coverage reports
- stable snapshot testing of validator messages

