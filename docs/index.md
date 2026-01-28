# Cardplay Docs
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This folder is both:

- The long-lived build plan (`plan.md`)
- A small documentation site scaffold (VitePress)

These docs are strict extensions of the canonical data model and semantics in `cardplay2.md` (repo root). In particular:
- Events store their contents in `event.payload` (not `event.props`)
- Types follow the parametric vocabulary: `Event<P>`, `Stream<E>`, `Container<K,E>`, `Lane<T>`, `Rules<E,C>`, `Voice<P>` (see cardplay2.md §2.0.1)
- Convenience aliases like `NoteEvent`, `Pattern`, `Scene` expand to parametric forms (see cardplay2.md §2.0.9)

## Quick links

- [Master plan](./plan.md)
- [Architecture](./architecture.md)
- [Glossary](./glossary.md)
- [Debugging](./debugging.md)
- [Runtime execution model](./runtime-execution.md)
- [Builtin samples](./builtin-samples.md)
- [WASM](./wasm.md)
- [CardScript](./cardscript.md)
- [AI: Prolog engine choice](./ai/prolog-engine-choice.md)
- [AI: Prolog deck/card/board reasoning](./ai/prolog-deck-reasoning.md)
- [Release](./release.md)
- [Coding style](./coding-style.md)
- [UI integration scenarios](./ui-integration-scenarios.md)
- [Graph invariants](./graph-invariants.md)
- [Stack inference](./stack-inference.md)
- [Registry API](./registry-api.md)
- [Event kind schemas](./event-kind-schemas.md)
- [Port unification rules](./port-unification-rules.md)
- [Protocol compatibility](./protocol-compatibility.md)
- [Adapter cost model](./adapter-cost-model.md)
- [Card definition format](./card-definition-format.md)
- [Validator rules](./validator-rules.md)
- [Pack provenance](./pack-provenance.md)
- [Capability prompts](./capability-prompts.md)
- [Registry diff format](./registry-diff-format.md)
- [Registry migration format](./registry-migration-format.md)

## State + playback references (Phase 6+)

- [State model reference](./state-model.md)
- [State schema versioning + migration policy](./state-schema-versioning.md)
- [Persistence format reference](./persistence-format.md)
- [Autosave UX + failure modes](./autosave-ux.md)
- [History semantics reference](./history-semantics.md)
- [Transport semantics reference](./transport-semantics.md)
- [Recording semantics reference](./recording-semantics.md)
- [Mixer semantics reference](./mixer-semantics.md)
