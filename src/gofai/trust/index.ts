/**
 * GOFAI Music+ Trust Primitives
 *
 * This module defines the five mandatory user-facing trust primitives:
 *
 * 1. **Preview** — Show what will change before applying
 * 2. **Diff** — Structured before/after comparison
 * 3. **Why** — Explain every decision with provenance chains
 * 4. **Undo** — Full-fidelity reversible edit packages
 * 5. **Scope Highlighting** — Visual indication of affected regions
 *
 * These primitives are non-negotiable: every GOFAI operation must
 * produce artifacts for all five. The UX layer consumes these
 * artifacts to build trust with the user.
 *
 * @module gofai/trust
 * @see {@link docs/gofai/product-contract.md} — Core guarantees
 * @see {@link docs/gofai/semantic-safety-invariants.md} — Invariants
 */

export { type PreviewResult, type PreviewConfig, type PreviewConstraintCheck, type PreviewSafetyLevel, type PreviewCostEstimate } from './preview';
export { type DiffReport, type EventDiff, type ParamDiff, type StructureDiff, type DiffEntry, type DiffKind, type DiffSummaryLine, createDiffReport } from './diff';
export { type WhyExplanation, type WhyChain, type WhyNode, type WhyNodeKind, type ProvenanceLink, type DecisionReason, buildWhyChain } from './why';
export { type EditPackage, type EditPackageId, type UndoResult, type RedoResult, type EditHistory, type EditHistoryConfig, createEditPackageId } from './undo';
export { type ScopeHighlight, type HighlightRegion, type HighlightKind, type HighlightLayer, type ScopeVisualization, computeScopeHighlights } from './scope-highlighting';
