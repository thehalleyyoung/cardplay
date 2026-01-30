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

// Speech acts, hedging, intention, confirmation, counterfactual exploration (Steps 226–230)
export * from './speech-acts';

// HCI dialogue UI: clarification cards, context strip, memory, undo, tuning (Steps 231–235)
export * from './dialogue-hci';

// Evaluation: dialogue fixtures, anaphora tests, presupposition tests, QUD tests, repair tests (Steps 236–240)
export * from './dialogue-eval';

// Integration, safety, confidence, explainability, HCI, infra (Steps 241–250)
export * from './integration-safety';
