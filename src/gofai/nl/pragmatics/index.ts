/**
 * GOFAI NL Pragmatics — Dialogue, Context, Anaphora, Presupposition, QUD
 *
 * @module gofai/nl/pragmatics
 */

// Dialogue state, DRT referents, anaphora, definite descriptions, demonstratives (Steps 201–205)
export * from './dialogue-state';

// Presupposition, implicature, QUD, clarification, accept/override (Steps 206–210)
export * from './presupposition-qud';

// Discourse context: ellipsis, modals, common ground, SDRT, repair (Steps 211–215)
export * from './discourse-context';

// Context resolution: temporal deixis, granularity, topic continuity, focus, descriptive reference (Steps 216–220)
export * from './context-resolution';

// Pragmatic typing: binding typecheck, clarification objects, minimality, batching, preference learning (Steps 221–225)
export * from './pragmatic-typing';
