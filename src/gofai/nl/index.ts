/**
 * GOFAI NL — Natural Language Frontend
 *
 * This module contains the natural language parsing, semantic composition,
 * and related infrastructure for the GOFAI Music+ compiler.
 *
 * @module gofai/nl
 */

export * from './semantics';

// Tokenizer
export * from './tokenizer';

// Parser
export * from './parser';

// Grammar
export * from './grammar';

// HCI — Human-Computer Interaction specs (Steps 146-150)
export * from './hci';

// Pragmatics — Dialogue, Context, Anaphora, QUD (Steps 201–250)
export * from './pragmatics';
