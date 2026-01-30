/**
 * GOFAI NL Semantics — Semantic Representation and Composition
 *
 * @module gofai/nl/semantics
 */

export * from './representation';

// Coordination and sequencing semantics
export * from './coordination-sequencing';

// Replacement and substitution semantics
export * from './replacement-semantics';

// Selectional restrictions (Step 131)
export * from './selectional-restrictions';

// Type-directed disambiguation (Step 132)
export * from './type-directed-disambiguation';

// Compositional semantics hooks (Step 133)
export * from './compositional-hooks';

// Construction grammar templates (Step 134)
export * from './construction-grammar';

// Degree semantics (Step 135)
export * from './degree-semantics';

// Event semantics (Step 136)
export * from './event-semantics';

// Quantifier semantics (Step 137)
export * from './quantifier-semantics';

// Scope ambiguity — MRS-style (Step 138)
export * from './scope-ambiguity';

// Pragmatic bias layer (Step 139)
export * from './pragmatic-bias';

// Event-to-CPL bridge (Step 154)
export * from './event-to-cpl';

// Degree-to-CPL bridge (Step 155)
export * from './degree-to-cpl';

// Montague-style compositional pipeline (Step 156)
export * from './compositional-pipeline';

// FrameNet / Frame semantics integration (Step 157)
export * from './frame-semantics';

// Musical goals representation (Step 158)
export * from './musical-goals';

// Musical constraints for diff checking (Step 159)
export * from './musical-constraints';

// Musical preferences as weighted soft constraints (Step 160)
export * from './musical-preferences';
