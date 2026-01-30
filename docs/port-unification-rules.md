# Port Unification Rules

**Status:** aspirational (partially implemented)  
**Canonical terms:** PortType, PortCompatibility, port adapters  
**Primary code references:** 
- `cardplay/src/canon/port-types.ts` (canonical port types)
- `cardplay/src/boards/gating/validate-connection.ts` (compatibility rules)
- `cardplay/src/boards/gating/port-conversion.ts` (adapters - if implemented)

Ports are typed endpoints on cards and graphs. Port types follow the canonical vocabulary from `cardplay/docs/canon/port-vocabulary.md`.

## Current Implementation

The routing system currently implements:
- Direct type compatibility (audio↔audio, midi↔midi, etc.)
- Basic cross-type compatibility (notes→midi, trigger↔gate, clock↔transport)
- Port direction enforcement (out→in only)

## Aspirational: Adapter Registry

Future enhancement: explicit adapter cards that convert between port types.

For example:
- notes→midi adapter (renders note events to MIDI messages)
- midi→audio adapter (synthesizes MIDI to audio)

The system would prefer:
1. Direct compatibility (cost 0)
2. Cheapest adapter path (Dijkstra over a small graph)

## Cost Model

Costs would be additive across a multi-hop path, used for:
- Best-effort fix suggestions
- Selecting which adapters to auto-insert in a stack

**Note:** Full adapter system is not yet implemented. See `cardplay/src/boards/gating/validate-connection.ts` for current compatibility rules.
