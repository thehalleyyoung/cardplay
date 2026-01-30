# 500 GOFAI Music+ Steps (English → CPL → Verified Edits)  
**A comprehensive, “deep semantics + deep pragmatics” build plan for CardPlay**

This plan is written to intentionally reflect three disciplines at once:

- **GOFAI NLP**: deterministic parsing, lexicons, grammar, semantics, pragmatics, dialogue.
- **Type theory**: stable intermediate representations, effect typing, refinement, namespaced extensibility, verifiable compilation.
- **HCI**: ambiguity handling, plan preview, trust, explanations, undo, onboarding, accessibility, performance UX.

It also explicitly keeps in mind the **union** of the most complete families of deep semantic/pragmatic analysis theories for mapping surface sentences to meaning (e.g., Montague-style compositional semantics, neo-Davidsonian event semantics, generalized quantifiers, degree semantics, Frame semantics, Construction grammar, CCG/HPSG/LFG-style syntax-semantics interfaces, MRS underspecification, DRT/SDRT discourse semantics, dynamic semantics for anaphora and context change, presupposition theory, Gricean pragmatics + implicature, QUD/information-structure models, speech act theory, plan/intention recognition).

**Conventions**

- Each line is a concrete deliverable step; treat it like a “systematic change” item.
- Tags are hints about what discipline dominates the step: `[NLP] [Sem] [Prag] [Type] [HCI] [Infra] [Ext] [Eval]`.
- “CPL” = *CardPlay Logic* (typed logical form), as in `cardplay/gofaimusicplus.md`.
- “Project world” = CardPlay state (events, containers, cards, decks, boards, routing, DSP).

---

## Phase 0 — Charter, Invariants, and Non‑Negotiables (Steps 001–050)

- [x] Step 001 [Infra][HCI] — Write a one-page "GOFAI Music+ product contract" (offline, deterministic, inspectable, undoable) and publish it as a repo doc with explicit non-goals.
- [ ] Step 002 [Type] — Define “semantic safety invariants” (e.g., preserve constraints are executable checks; no silent ambiguity resolution) and treat them as first-class testable requirements.
- [ ] Step 003 [Infra] — Decide and document the compilation pipeline stages (normalize → parse → semantics → pragmatics → typecheck → plan → execute → diff/explain).
- [ ] Step 004 [Type] — Introduce a vocabulary policy: builtin meaning IDs un-namespaced; extension meaning IDs must be `namespace:*` (mirrors CardPlayId rules).
- [ ] Step 005 [HCI] — Define user-facing trust primitives: **preview**, **diff**, **why**, **undo**, and **scope highlighting** are mandatory in UX.
- [ ] Step 006 [Infra] — Create a “GOFAI build matrix” mapping features to required tests (unit, golden NL→CPL, paraphrase invariance, safety diffs, UX interaction tests).
- [ ] Step 007 [Type] — Define a stable “CPL schema versioning” strategy compatible with CardPlay canon serialization/versioning conventions.
- [ ] Step 008 [Type] — Define an effect taxonomy for compiler outputs: `inspect` vs `propose` vs `mutate`, to forbid silent mutation in manual boards.
- [ ] Step 009 [HCI] — Decide the default interaction loop: parse → show CPL → ask clarifications if needed → show plan/diff → user applies.
- [ ] Step 010 [Infra] — Identify the minimal “project world API” needed by GOFAI (section markers, tracks/layers, card registry, selected range, undo stack).

- [ ] Step 011 [Type] — Specify the difference between **goals**, **constraints**, and **preferences** (hard vs soft), with a stable typed model.
- [ ] Step 012 [NLP][Prag] — Specify a formal ambiguity policy: allow underspecified meaning (holes) and require explicit resolution before execution.
- [ ] Step 013 [NLP][Sem] — Choose a core semantic representation strategy: typed lambda calculus + event semantics + degree semantics, with MRS-like underspecification for scope.
- [ ] Step 014 [Prag] — Choose a discourse model strategy: DRT/SDRT-style discourse referents + rhetorical relations for “and/but/then/after”.
- [ ] Step 015 [Prag][HCI] — Define the “clarification question” contract (QUD-style): every question must (a) name the ambiguity, (b) offer defaults, (c) show impact.
- [ ] Step 016 [Infra] — Add a glossary of key terms (scope, referent, salience, presupposition, implicature, constraint) and require it in docs review.
- [ ] Step 017 [Type] — Decide how “unknown-but-declared” extension semantics are represented (opaque namespaced nodes with schemas).
- [ ] Step 018 [HCI] — Define “error shapes” for UI: parse error, unresolved reference, unsatisfied constraint, unsafe plan, missing capability.
- [ ] Step 019 [Infra] — Commit to “no magic”: any default (e.g., what “darker” means) must be inspectable and user-configurable.
- [ ] Step 020 [Infra][Eval] — Define success metrics: semantic reliability under paraphrase, constraint correctness, edit reversibility, workflow speed, user trust.

- [ ] Step 021 [HCI] — Write 10 canonical user scenarios spanning studio editing, education, live performance, and IP-sensitive workflows.
- [ ] Step 022 [Infra] — Build a “risk register” (failure modes: wrong scope, wrong target, broken constraints, destructive edits) and map each to mitigation steps.
- [ ] Step 023 [Type] — Define a “capability model” for the current environment: what can be edited (events vs routing vs DSP) depending on board policy.
- [ ] Step 024 [Infra] — Establish a policy for deterministic output ordering (stable sorting for entities, stable tie-breakers for parsing/planning).
- [ ] Step 025 [Infra] — Create a dedicated docs entrypoint for GOFAI (index + architecture + vocabulary + extension spec).

- [ ] Step 026 [Type] — Decide on a “semantic provenance” mechanism: every CPL node retains spans + lexeme IDs + rule IDs that created it.
- [ ] Step 027 [Infra] — Define a minimal “song fixture” format for tests (small project state snapshots that can be diffed deterministically).
- [ ] Step 028 [Eval] — Create a seed dataset: 200 English instructions with expected CPL (covering scope, constraints, comparatives, anaphora, negation).
- [ ] Step 029 [Eval] — Create paraphrase sets for 50 of those instructions (≥5 paraphrases each) to enforce semantic invariance.
- [ ] Step 030 [Eval][Prag] — Create an “ambiguity suite” of utterances that must trigger clarification (not allowed to auto-resolve).

- [ ] Step 031 [Infra] — Decide on naming conventions and folder layout for GOFAI modules (canon, nl, semantics, pragmatics, planning, execution, ui).
- [ ] Step 032 [Type] — Define “CPL as a public interface”: stable TS types + JSON schema; discourage leaking parse-tree internals.
- [ ] Step 033 [Infra] — Define “compiler determinism rules” (no random choices; if multiple plans tie, show options).
- [ ] Step 034 [HCI] — Define “preview-first UX”: user can inspect plan/diff at every step; auto-apply only in explicitly allowed contexts.
- [ ] Step 035 [Type] — Define “undo tokens” as linear resources: every `apply` yields a token that can be consumed by `undo` deterministically.

- [ ] Step 036 [Prag] — Specify how UI selection participates in pragmatics (deictic “this”, “here”, “these notes”), including fallbacks when selection is empty.
- [ ] Step 037 [Sem] — Specify how contrastive constructions map (“do X but keep Y”, “do X without Y”) including constraint precedence rules.
- [ ] Step 038 [Sem][Prag] — Specify the semantics of “again”, “still”, “also”, “too” as presupposition triggers in edit dialogue.
- [ ] Step 039 [Prag] — Specify an implicature/default model (Gricean/QUD): what “keep tempo steady” implies absent explicit BPM changes.
- [ ] Step 040 [Infra] — Define a change-control rule: new lexemes/grammar rules require golden tests and ambiguity analysis notes.

- [ ] Step 041 [Type] — Decide how musical “entities” are typed: section, range, track/layer, card, param, event selector, deck, board.
- [ ] Step 042 [Infra] — Create a “canonical axis catalog” for perceptual axes (energy, lift, brightness, width, intimacy, tension, groove tightness).
- [ ] Step 043 [Sem] — Define degree semantics for comparatives (“more lift”, “less busy”) using axis values and monotonic lever mappings.
- [ ] Step 044 [HCI] — Define UI affordances for degrees: sliders, discrete “tiny/small/moderate/large”, and explicit numeric overrides.
- [ ] Step 045 [Type] — Define refinement constraints for axis values (e.g., width ∈ [0,1], BPM > 0), with validators.

- [ ] Step 046 [Infra] — Establish a local-only telemetry plan (optional) to capture anonymized parse/clarification failures for iterative improvement.
- [ ] Step 047 [Eval] — Decide on an evaluation harness that can replay a conversation against fixed fixtures and assert deterministic outputs.
- [ ] Step 048 [Infra] — Define a “migration policy” for language behavior changes (how to handle old CPL in edit history after upgrades).
- [ ] Step 049 [HCI] — Define “user preference profiles” for vague words (dark = timbre vs harmony vs register) and how UI edits those profiles.
- [ ] Step 050 [Infra] — Create a final checklist for “shipping offline compiler”: no network calls in runtime path; deterministic builds; audit logs.

---

## Phase 1 — Canonical Ontology + Extensible Symbol Tables (Steps 051–100)

- [ ] Step 051 [Type][Infra] — Create a GOFAI canon layer: a single SSOT module exporting lexeme IDs, axis IDs, opcode IDs, and normalization rules.
- [ ] Step 052 [Type] — Define `GofaiId` as a namespaced ID type that composes with `CardPlayId` rules; reject non-namespaced extension entries.
- [ ] Step 053 [Infra] — Build a “canon check” script for GOFAI (like existing canon checks) that validates all vocab tables and IDs.
- [ ] Step 054 [Type] — Define `EntityRef` types (SectionRef, RangeRef, LayerRef, CardRef, ParamRef, DeckRef, BoardRef) with branded IDs.
- [ ] Step 055 [Type] — Define `EventSelector` as a typed predicate language over `Event<P>` (kind, tags, role, pitch range, time range).

- [ ] Step 056 [Infra] — Implement a project “symbol table builder” that indexes sections, tracks/layers, cards, decks, and boards by IDs and display names.
- [ ] Step 057 [Prag][Type] — Add salience tracking to symbol tables (last-focused section, last-edited layer, current selection) for reference resolution.
- [ ] Step 058 [NLP][Sem] — Define a canonical section vocabulary: intro/verse/chorus/bridge/outro + numbered variants + user-defined labels.
- [ ] Step 059 [NLP][Sem] — Define a canonical layer vocabulary: drums/kick/snare/hats/bass/pad/lead/vocal + role mappings.
- [ ] Step 060 [NLP][Sem] — Define a canonical time vocabulary: bars/beats/ticks, relative phrases (“two bars before”), and timepoint references (“at bar 49”).

- [ ] Step 061 [Type] — Create a single “unit system” type layer: `Bpm`, `Semitones`, `Bars`, `Beats`, `Ticks`, with conversion rules and refinements.
- [ ] Step 062 [Infra] — Add a stable, human-readable ID pretty-printer and parser for all GOFAI entity references.
- [ ] Step 063 [Type] — Define a “capability lattice” (e.g., production enabled, routing editable, AI allowed) to control which semantics can compile to execution.
- [ ] Step 064 [Ext][Type] — Define extension namespaces as first-class provenance on lexeme senses, constraints, and opcodes.
- [ ] Step 065 [Ext][Infra] — Add an extension registry conceptually mirroring BoardRegistry/CardRegistry, with register/unregister events.

- [ ] Step 066 [Ext][Infra] — Define “auto-binding” rules: how card/board/deck metadata becomes baseline lexicon entries without custom code.
- [ ] Step 067 [Ext][Type] — Specify a schema for pack-provided GOFAI annotations (synonyms, roles, param semantics, default scopes).
- [ ] Step 068 [Sem] — Define the mapping between `MusicSpec` constraints and CPL constraints (lossless where possible).
- [ ] Step 069 [Sem] — Add a “constraint catalog” that includes both builtins and namespaced extension constraints with schemas.
- [ ] Step 070 [Type] — Define `ConstraintSchema` types (parametric) so unknown constraints remain typecheckable if declared.

- [ ] Step 071 [Infra] — Document the “entity binding precedence”: selection > explicit reference > salience > defaults; add tests for resolution order.
- [ ] Step 072 [Prag] — Encode deictic resolution rules (“this section”, “these notes”) and require a UI selection context for them.
- [ ] Step 073 [Prag] — Add a “speech situation” model (speaker, addressee, time, focused tool) to support situation semantics-like reasoning.
- [ ] Step 074 [Sem] — Specify how event-level references surface in language (“the last note”, “the downbeats”, “every other bar”).
- [ ] Step 075 [HCI] — Add UI copy guidelines for showing entity bindings (“‘that chorus’ → Chorus 2 (bars 49–65)”).

- [ ] Step 076 [Infra] — Create a canonical “domain noun inventory” (bars, hook, motif, voicing, groove, drop, build) with definitions and examples.  Note that it should include nouns from as many music theories and traditions as possible.
- [ ] Step 077 [Sem] — Define a “musical object ontology” that distinguishes structure, harmony, rhythm, timbre/production, performance.  Note that it should include ontological objects from as many music theories and traditions as possible.
- [ ] Step 078 [Type] — Define typed “targets” for preserve-only-change constraints (preserve melody exact vs functional harmony vs recognizable hook), again aiming for wide scope.
- [ ] Step 079 [Prag] — Define a model of “shared plans” (plan recognition) for repeated edits (“do it again but bigger”).
- [ ] Step 080 [Infra] — Implement a canonical registry of “default interpretations” with user-overridable mappings and versioned provenance.

- [ ] Step 081 [Ext][Infra] — Integrate symbol table builder with CardRegistry and BoardRegistry listeners to auto-update referents when extensions load.
- [ ] Step 082 [Ext][Infra] — Define how deck factories and deck types become referents (“open the waveform editor deck”), including namespaced deck types.
- [ ] Step 083 [Type] — Define “UI-only actions” vs “project mutation actions” with distinct effect types (prevents conflating navigation with edits).
- [ ] Step 084 [HCI] — Define how the UI exposes the current focus stack (board → deck → selection) as an explicit context panel.
- [ ] Step 085 [Infra] — Add deterministic fuzzy matching rules for resolving names (same algorithm everywhere; stable tie-breakers; explainable matches).

- [ ] Step 086 [Sem] — Define a typed representation for “musical dimensions” that can host both perceptual axes and symbolic-theory axes.
- [ ] Step 087 [Ext][Sem] — Define how an extension can add a new axis (e.g., “grit”) and map it to levers without editing core.
- [ ] Step 088 [Ext][Type] — Define a schema for “axis → parameter bindings” (e.g., width → param stereoWidth on certain cards).
- [ ] Step 089 [Sem] — Define the semantics of “only change X” as an explicit scope restriction plus a validation rule over diffs.
- [ ] Step 090 [Infra] — Write an “ontology drift” lint that fails if docs and canon vocab disagree.

- [ ] Step 091 [Type] — Define a typed “reference to historical edit package” to support “undo that”, “redo the chorus widening”.
- [ ] Step 092 [Prag] — Specify how temporal adverbs (“now”, “then”) interact with dialogue state to choose edit targets.
- [ ] Step 093 [Prag] — Specify how demonstratives (“that”, “those”) choose referents using salience, recency, and UI focus.
- [ ] Step 094 [Sem] — Define the semantics of coordination and sequencing (“do X and then Y”) as ordered plan composition.
- [ ] Step 095 [Sem] — Define the semantics of “instead” and “rather than” as plan replacement with explicit rollback.

- [ ] Step 096 [HCI] — Design a “binding inspector” UI panel that shows resolved referents and why they were chosen.
- [ ] Step 097 [HCI] — Design a “vocabulary browser” UI that lists known terms and their meanings, including extension namespaces.
- [ ] Step 098 [Infra] — Add a “vocab coverage report” script: which cards/boards/decks have no language bindings or weak bindings.
- [ ] Step 099 [Eval] — Add regression tests asserting entity bindings remain stable across refactors (ID-based, not display-name fragile).
- [ ] Step 100 [Infra] — Define the “GOFAI docs SSOT rule”: canonical vocab lives in code; docs are generated or validated from that code.

---

## Phase 2 — Parsing Frontend: Tokenization, Morphology, and Grammar (Steps 101–150)

- [ ] Step 101 [NLP] — Implement a span-preserving tokenizer that retains original substrings for quoting, highlighting, and provenance.
- [ ] Step 102 [NLP] — Implement a normalizer that canonicalizes whitespace, punctuation, unicode quotes, hyphenation, and common unit spellings.
- [ ] Step 103 [NLP] — Implement morphological normalization (lemmatization-lite) for core verbs/adjectives (tighten/tighter/tightening).
- [ ] Step 104 [NLP] — Add a robust number parser (words + digits) supporting “two”, “a couple”, “half”, and numeric ranges.
- [ ] Step 105 [NLP] — Implement unit parsing (“96 BPM”, “+7 semitones”, “two bars”), returning typed units.

- [ ] Step 106 [NLP][Infra] — Choose and implement a deterministic parsing engine (Earley/GLR + scoring, or PEG + diagnostics) and document tradeoffs.
- [ ] Step 107 [NLP] — Add a parse forest representation to preserve ambiguity instead of losing it to early decisions.
- [ ] Step 108 [NLP][Prag] — Implement a scoring model for parse selection that prefers explicit scopes and safer interpretations.
- [ ] Step 109 [NLP] — Implement parse diagnostics (“why this parse won”) to support developer debugging and user-facing explanations.
- [ ] Step 110 [NLP] — Implement incremental parsing hooks for “parse while typing” with caching keyed by token spans.

- [ ] Step 111 [NLP][Sem] — Add a grammar for imperatives (“make”, “add”, “remove”, “keep”, “switch”) with typed verb frames.
- [ ] Step 112 [NLP][Sem] — Add a grammar for comparatives and degree modifiers (“more”, “less”, “slightly”, “a lot”).
- [ ] Step 113 [NLP][Sem] — Add a grammar for coordination (“X and Y”, “X but Y”, “X then Y”) preserving rhetorical structure cues.
- [ ] Step 114 [NLP][Sem] — Add a grammar for negation and exclusion (“don’t”, “no”, “without”, “except”) with explicit scope.
- [ ] Step 115 [NLP] — Add a grammar for time expressions (“for 8 bars”, “before the last chorus”, “in verse 2”) that builds typed ranges.

- [ ] Step 116 [NLP][Prag] — Add a grammar for reference expressions (pronouns, demonstratives, “same as before”) that produce unresolved referents.
- [ ] Step 117 [NLP][Sem] — Add a grammar for quantification (“all choruses”, “every other bar”, “each verse”) producing selection predicates.
- [ ] Step 118 [NLP][Sem] — Add a grammar for modality and permission (“try”, “maybe”, “if possible”) producing soft constraints or alternative plans.
- [ ] Step 119 [NLP][Sem] — Add a grammar for questions (“what chords are in the chorus?”, “why did you change that?”) mapping to inspect/explain acts.
- [ ] Step 120 [NLP][Sem] — Add a grammar for explicit user-defined names (“the ‘glass pad’ track”) supporting quoted referents.

- [ ] Step 121 [NLP][Sem] — Add lexeme classes for musical roles (melody, bassline, hook, accompaniment) with selectional restrictions.
- [ ] Step 122 [NLP][Sem] — Add lexeme classes for musical objects (chords, voicings, rhythm, groove, density, register) with semantic mappings.
- [ ] Step 123 [NLP][Sem] — Add lexeme classes for production terms (width, brightness, punch) that map either to arrangement levers or DSP levers.
- [ ] Step 124 [NLP] — Add a grammar for “edit locality” (“just”, “only”, “at least”) to bias cost model and scope.
- [ ] Step 125 [NLP][Sem] — Add a grammar for “preservation” (“keep the chords”, “don’t change the melody”) generating explicit CPL preserve constraints.

- [ ] Step 126 [NLP] — Add a robust “unknown token” strategy that preserves unknown terms as candidate entity names rather than failing parsing.
- [ ] Step 127 [NLP][Ext] — Add a mechanism for extensions to register additional lexemes and lexical variants into the parser at runtime.
- [ ] Step 128 [NLP][Ext] — Add a mechanism for extensions to register new grammar rules with rule IDs, priorities, and required tests.
- [ ] Step 129 [NLP][Infra] — Add a grammar regression harness that can snapshot parse forests and detect unintended ambiguity explosions.
- [ ] Step 130 [NLP][HCI] — Add a user-facing “I didn’t understand” error formatter that pinpoints spans and suggests known terms.

- [ ] Step 131 [Sem] — Implement argument structure constraints: ensure verbs like “widen” modify width-like targets, not arbitrary nouns (selectional restrictions).
- [ ] Step 132 [Sem] — Implement type-directed disambiguation (bidirectional typing): use expected CPL node types to prune parse candidates.
- [ ] Step 133 [Sem] — Implement compositional semantics hooks per grammar rule to produce intermediate meaning (CPL holes allowed).
- [ ] Step 134 [Sem] — Implement “construction grammar” style templates for music-specific phrasings (“make it hit harder”, “bring it in earlier”).
- [ ] Step 135 [Sem] — Implement degree semantics for vague adjectives (“warmer”, “darker”) as axis changes with candidate interpretations.

- [ ] Step 136 [Sem] — Implement event semantics for actions (“add”, “remove”, “change”) to uniformly represent edit events and their arguments.
- [ ] Step 137 [Sem] — Implement generalized quantifier semantics for “all/some/most” when needed for selectors (“all choruses”).
- [ ] Step 138 [Sem] — Implement a representation for scope ambiguity (MRS-style) when quantifiers, negation, and “only” interact.
- [ ] Step 139 [Prag] — Implement a “pragmatic bias” layer that pushes ambiguous parses into clarification rather than unsafe execution.
- [ ] Step 140 [Infra] — Add developer tooling to visualize parse forest + semantic composition for a given utterance.

- [ ] Step 141 [Eval] — Add golden tests for 100 core utterances ensuring stable tokenization and parse outputs.
- [ ] Step 142 [Eval] — Add paraphrase invariance tests at the parse+semantics boundary (paraphrases should yield the same CPL-Intent or same holes).
- [ ] Step 143 [Eval] — Add fuzz tests for tokenizer and unit parsing (random punctuation, unicode, spacing) to ensure robustness.
- [ ] Step 144 [Eval] — Add ambiguity tests ensuring known ambiguous utterances do not collapse to a single meaning without clarification.
- [ ] Step 145 [Eval] — Add performance tests for parsing latency under incremental typing (budget targets per input length).

- [ ] Step 146 [HCI] — Define a “typing UX” spec: parse status indicator, suggestions dropdown, and how/when to interrupt with clarification.
- [ ] Step 147 [HCI] — Define an error recovery UX: user can edit the utterance, accept suggested rephrasing, or choose from interpreted candidates.
- [ ] Step 148 [HCI] — Add UI copy templates for clarification questions (“By ‘darker’ do you mean timbre, harmony, register, or texture?”).
- [ ] Step 149 [HCI] — Add a rule that every clarification UI must show a default and “why this matters” in one line.
- [ ] Step 150 [Infra] — Establish a “grammar authorship workflow” (PR checklist: add lexeme, add grammar rule, add golden tests, add docs entry).

---

## Phase 3 — Deep Semantics: From Syntax to CPL (Steps 151–200)

- [ ] Step 151 [Type][Sem] — Define the CPL AST family as three layers: CPL-Intent, CPL-Plan, CPL-Host, each with versioned JSON encoding.
- [ ] Step 152 [Type][Sem] — Define `CPLHole` nodes explicitly (unknown axis sense, unknown referent, unknown amount, unknown scope) with candidate sets.
- [ ] Step 153 [Type][Sem] — Define `SpeechAct` types (change, inspect, explain, undo/redo, propose) and make them the root of CPL-Intent.
- [ ] Step 154 [Sem] — Encode neo-Davidsonian event semantics for edits: edit actions are events with thematic roles (agent=user, patient=target).
- [ ] Step 155 [Sem] — Encode degree semantics for axes and comparatives; represent “more” as an ordering constraint on an axis variable.

- [ ] Step 156 [Sem] — Add a Montague-style compositional pipeline: parse rules attach lambda terms that assemble into CPL-Intent skeletons.
- [ ] Step 157 [Sem] — Add FrameNet/Frame semantics integration: verb frames (“tighten”, “widen”, “simplify”) map to axis/levers + selectional restrictions.
- [ ] Step 158 [Sem] — Add a typed representation for “musical goals” distinct from “actions”: goals are desiderata over axes and structures.
- [ ] Step 159 [Sem] — Add a typed representation for “constraints” that can be checked against diffs (preserve melody exact, keep chords functional).
- [ ] Step 160 [Sem] — Add a typed representation for “preferences” (least-change, no-new-layers) as weighted soft constraints.

- [ ] Step 161 [Sem] — Implement contrast semantics for “but” (SDRT cue): represent as goal+constraint pairing with discourse relation `Contrast`.
- [ ] Step 162 [Sem] — Implement sequencing semantics for “then/after/before” as plan composition constraints (order in CPL-Plan).
- [ ] Step 163 [Sem] — Implement “only” semantics: a focus-sensitive operator that restricts the allowed change targets.
- [ ] Step 164 [Sem] — Implement “still” and “again” semantics as presuppositions about prior states/edits (ties into edit history).
- [ ] Step 165 [Sem] — Implement “keep X the same” as `preserve(X, exact)` by default, with optional relaxation to functional/recognizable modes.

- [ ] Step 166 [Sem][Type] — Define `PreservationMode` = exact | functional | recognizable, and specify validation checks for each (pitch equality vs contour fingerprint).
- [ ] Step 167 [Sem] — Add motif identity semantics: define motif fingerprints (interval/rhythm) and “recognizable” thresholds.
- [ ] Step 168 [Sem] — Add harmony identity semantics: define chord skeleton vs extensions vs substitutions; map “keep chords” to an explicit tier.
- [ ] Step 169 [Sem] — Add rhythm identity semantics: define “keep rhythm” as onset grid equality or tolerance-based equivalence.
- [ ] Step 170 [Sem] — Add arrangement identity semantics: define “keep instrumentation” vs “keep roles” vs “keep layers” as distinct constraints.

- [ ] Step 171 [Sem][Type] — Implement “semantic typing” for scopes: section scopes accept section refs; bar-range scopes accept typed ranges; selectors accept predicates.
- [ ] Step 172 [Sem][Type] — Implement “semantic typing” for targets: axis modifiers must attach to axes or to entities with known axis bindings.
- [ ] Step 173 [Sem] — Implement semantics for “make it feel X” as mapping from affective adjectives to axis bundles + candidate levers (explicitly namespaced).
- [ ] Step 174 [Sem] — Implement semantics for “hit harder”/“more punch” as mapping to impact axis + candidate levers (density, transients, dynamics).
- [ ] Step 175 [Sem] — Implement semantics for “more hopeful” as mapping to tension/release + brightness + register (with explicit constraints interaction).

- [ ] Step 176 [Sem] — Build a “meaning provenance graph” that can explain which words mapped to which CPL nodes and why.
- [ ] Step 177 [Sem] — Implement MRS-like underspecification for scope ambiguities; keep an explicit set of constraints instead of choosing prematurely.
- [ ] Step 178 [Sem] — Implement a scope resolution phase that either (a) resolves safely by rules or (b) produces a clarification question.
- [ ] Step 179 [Sem] — Implement typed ellipsis templates (“same but bigger”, “do that again”) as transformations over prior CPL/plan nodes.
- [ ] Step 180 [Sem] — Implement typed metonymy handling for music talk (“the chorus” can mean section events, harmony, or arrangement) as a hole with candidates.

- [ ] Step 181 [Type] — Define a “CPL well-formedness checker” that rejects missing required fields and unknown tags/opcodes/axes.
- [ ] Step 182 [Type] — Define a “CPL effect checker” that ensures `inspect` requests cannot compile to mutation actions.
- [ ] Step 183 [Type] — Define a “CPL capability checker” that blocks compilation requiring disabled capabilities (e.g., production edits on non-production boards).
- [ ] Step 184 [Type] — Add refinement validations for numeric fields (BPM, semitones, amount) with consistent error messages.
- [ ] Step 185 [Type] — Implement bidirectional typechecking between grammar semantics and CPL AST types (catch lexeme mapping errors early).

- [ ] Step 186 [NLP][Sem] — Add support for quoted programmatic references (“the track called ‘Glass Pad’”) and ensure they bind deterministically.
- [ ] Step 187 [NLP][Sem] — Add support for adjectival stacks (“brighter and wider and less busy”) as conjunction of goals with shared scope.
- [ ] Step 188 [NLP][Sem] — Add support for nested scopes (“in the chorus, on the drums, only for two bars”) producing compositional scope nodes.
- [ ] Step 189 [NLP][Sem] — Add support for numeric qualifiers (“raise it 2 semitones”, “reduce density by 20%”) with typed units.
- [ ] Step 190 [NLP][Sem] — Add support for range expressions (“bars 33–40”, “last 2 bars”) with inclusive/exclusive rules documented.

- [ ] Step 191 [Eval] — Add golden tests for CPL-Intent construction for 200 utterances with explicit expected holes where ambiguity exists.
- [ ] Step 192 [Eval] — Add “semantic diff” tests: ensure changes to lexicon mappings don’t silently change CPL outputs without updating goldens.
- [ ] Step 193 [Eval] — Add “scope safety” tests: utterances with scoping must always bind to the same range given the same fixture.
- [ ] Step 194 [Eval] — Add “operator interaction” tests for negation/only/quantifiers, ensuring MRS underspecification behaves predictably.
- [ ] Step 195 [Eval] — Add tests ensuring presupposition triggers create expected “requires prior referent” holes when history lacks support.

- [ ] Step 196 [HCI] — Define a CPL viewer UX: collapsible tree, colored tags (goal/constraint/scope), and clickable spans back to original text.
- [ ] Step 197 [HCI] — Add an “ambiguity UI” pattern: show candidate meanings side-by-side with consequences; allow default selection.
- [ ] Step 198 [HCI] — Add a “semantic provenance UI” pattern: hover on CPL node to show source words + rule IDs in developer mode.
- [ ] Step 199 [HCI] — Add a “user vocabulary learning” UX: when user clarifies “dark means timbre”, offer to save as preference.
- [ ] Step 200 [HCI] — Add a “teach mode” option: the system can explain the semantics in musical terms (education workflow).

---

## Phase 4 — Deep Pragmatics + Dialogue: Context, Anaphora, Presupposition, QUD (Steps 201–250)

- [ ] Step 201 [Prag] — Define a dialogue state model that stores: last focused scope, salient entities, last CPL, last plan, last diff, user prefs.
- [ ] Step 202 [Prag] — Implement DRT-style discourse referents for entities (sections, layers, cards, motifs) that persist across turns.
- [ ] Step 203 [Prag] — Implement anaphora resolution rules for “it/that/this/there” using salience + UI focus + recency weighting.
- [ ] Step 204 [Prag] — Implement definite description resolution (“the chorus”, “the bridge”) with ambiguity to clarification when multiple matches exist.
- [ ] Step 205 [Prag] — Implement demonstrative resolution tied to UI selection (“these notes”) with fallback to last selection.

- [ ] Step 206 [Prag] — Implement presupposition checking/accommodation for “again”, “still”, “back”, “return”, “keep”, and “continue”.
- [ ] Step 207 [Prag] — Implement conversational implicature defaults: “make it tighter” defaults to microtiming and density levers unless user overrides.
- [ ] Step 208 [Prag] — Implement QUD stack tracking: interpret utterances relative to the current question under discussion to decide what “it” refers to.
- [ ] Step 209 [Prag] — Implement clarification generation as QUD refinement: questions should reduce candidate set cardinality maximally.
- [ ] Step 210 [Prag] — Implement “accept defaults” and “override” dialogue moves (“yes”, “no, I meant harmony”) as edits to holes.

- [ ] Step 211 [Prag] — Implement ellipsis resolution (“same but bigger”) by referencing the last plan step or last edit package as antecedent.
- [ ] Step 212 [Prag] — Implement modal subordination-like behavior for “if possible” (store conditional intent and prefer satisfying it).
- [ ] Step 213 [Prag] — Implement a “common ground” model: track what has been mutually established (selected chorus = Chorus 2) to stabilize references.
- [ ] Step 214 [Prag] — Implement discourse relations (SDRT) for “but/so/then/also” to shape plan ordering and constraint emphasis.
- [ ] Step 215 [Prag] — Implement repair moves: user can say “no, not that chorus” and the system rebinds referent without losing other meaning.

- [ ] Step 216 [Prag] — Implement temporal deixis: interpret “earlier/later” relative to (a) song form or (b) bar microtiming as an explicit ambiguity.
- [ ] Step 217 [Prag] — Implement scale of granularity: interpret “earlier” as section-level vs beat-level depending on context (default to safer clarification).
- [ ] Step 218 [Prag] — Implement “topic continuity”: if user is working on chorus, “make it wider” inherits chorus scope unless contradicted.
- [ ] Step 219 [Prag] — Implement “focus semantics”: contrastive stress (if captured) or textual cues (“NOT the chords”) prioritize certain constraints.
- [ ] Step 220 [Prag] — Implement “reference by description”: “the noisy synth” resolves via metadata/tags; if multiple, ask a disambiguating question.

- [ ] Step 221 [Prag][Type] — Typecheck pragmatic bindings: references must resolve to entities compatible with their semantic roles or become holes.
- [ ] Step 222 [Prag][Type] — Define a structured “clarification object” type: question text, options, default, effect on CPL, and safety notes.
- [ ] Step 223 [Prag] — Implement a “clarification minimality” principle: ask only what’s needed to execute safely, not what’s needed to be perfect.
- [ ] Step 224 [Prag] — Implement a “clarification batching” strategy: combine related ambiguities into one UI step when possible.
- [ ] Step 225 [Prag] — Implement user preference learning: persist mapping preferences for vague terms and apply them with provenance (“using your default”).

- [ ] Step 226 [Sem][Prag] — Model speech acts explicitly: distinguish requests, suggestions, questions, meta-questions (“why”), and commands to undo.
- [ ] Step 227 [Prag] — Implement politeness/hedging handling (“could you maybe”) as lowering confidence, not changing the semantic act type.
- [ ] Step 228 [Prag] — Implement “intention recognition” for multi-turn editing: recognize that user is optimizing a section and keep stable scope.
- [ ] Step 229 [Prag] — Implement “plan confirmation” moves: user says “yes, do that” to commit and execute; nothing executes before that.
- [ ] Step 230 [Prag] — Implement “counterfactual exploration”: user says “what if we…” to produce alternative plans without mutation.

- [ ] Step 231 [HCI] — Add UI for “clarification cards”: each ambiguity is a small card with radio options and a default explanation.
- [ ] Step 232 [HCI] — Add UI for “context strip”: shows current focus (board/deck/section/range/layer) and how pronouns will resolve.
- [ ] Step 233 [HCI] — Add UI for “conversation memory”: show last N turns with CPL and diffs; allow bookmarking.
- [ ] Step 234 [HCI] — Add UI for “undo target selection”: user can undo last, undo specific package, or undo by scope (chorus only).
- [ ] Step 235 [HCI] — Add UI for “preference tuning”: user can set “dark means…” via a simple toggle matrix.

- [ ] Step 236 [Eval] — Create a dialogue fixture suite: multi-turn conversations with expected referent bindings and clarifications.
- [ ] Step 237 [Eval] — Add tests for anaphora correctness across turns (it/that/again) using DRT-style referents.
- [ ] Step 238 [Eval] — Add tests for presupposition handling: “again” must fail/clarify if no antecedent edit exists.
- [ ] Step 239 [Eval] — Add tests for QUD behavior: clarification questions should reduce ambiguity and not introduce new ambiguities.
- [ ] Step 240 [Eval] — Add regression tests for “repair moves” (“no, I meant…”) preserving all other semantics.

- [ ] Step 241 [Sem][Prag] — Integrate discourse-level constraints: “but keep the melody” should become a high-priority hard constraint by default.
- [ ] Step 242 [Sem][Prag] — Implement “accommodation policies” for underspecified requests: propose defaults but require explicit acknowledgement before execution.
- [ ] Step 243 [Prag] — Implement “safety-first deference”: if a binding would cause large changes, prefer asking a question over executing.
- [ ] Step 244 [Prag] — Implement “confidence” as an internal measure derived from ambiguity/hole count, not as a probabilistic model.
- [ ] Step 245 [Prag] — Implement “explainable resolution”: every resolved pronoun must have a user-readable reason (“most recent focus: Chorus 2”).

- [ ] Step 246 [HCI] — Add “why this question?” affordance on clarification UI that shows the competing meanings and their edits.
- [ ] Step 247 [HCI] — Add a “safe preview mode” for ambiguous requests: show two candidate diffs without applying either.
- [ ] Step 248 [HCI] — Add a “commit button” that is disabled until all hard ambiguities are resolved (holes that affect execution).
- [ ] Step 249 [HCI] — Add “developer mode” toggles to display discourse referents and salience scores for debugging.
- [ ] Step 250 [Infra] — Define an internal “pragmatics trace” format that records binding decisions for reproducibility and bug reports.

---

## Phase 5 — Planning: Goals → Levers → Plans (Steps 251–300)

- [ ] Step 251 [Type][Sem] — Define CPL-Plan as a sequence of typed opcodes with explicit scopes, preconditions, and postconditions.
- [ ] Step 252 [Type] — Define plan opcodes for core musical edits (thin_texture, densify, raise_register, halftime, insert_break, etc.).
- [ ] Step 253 [Sem] — Define lever mappings from perceptual axes to candidate opcodes (lift → register+voicing+density; intimacy → thin+close+reduce width).
- [ ] Step 254 [Type] — Define a plan scoring model (goal satisfaction + edit cost + constraint risk) with deterministic tie-breakers.
- [ ] Step 255 [Type] — Define a cost hierarchy aligned with user expectations (melody changes expensive; voicing changes cheap).

- [ ] Step 256 [Sem] — Implement a constraint satisfaction layer: candidate plans must be validated against preserve/only-change constraints.
- [ ] Step 257 [Sem] — Implement plan generation as bounded search over opcodes (depth limit, beam size) to keep runtime predictable offline.
- [ ] Step 258 [Sem] — Implement “least-change planning” as the default preference; allow explicit user overrides (“rewrite the harmony”).
- [ ] Step 259 [Sem] — Implement option sets: if multiple plans are near-equal, present top 2–3 with clear differences.
- [ ] Step 260 [HCI] — Design plan selection UI: compare candidate plans by diff summary, not by abstract scoring numbers.

- [ ] Step 261 [Sem][Type] — Implement a “plan skeleton” step that maps from CPL-Intent to a set of lever candidates with open parameters.
- [ ] Step 262 [Sem] — Implement parameter inference: map “a little” to small amount; map explicit numbers to typed magnitudes.
- [ ] Step 263 [Sem] — Implement “plan legality” checks: ensure opcodes only touch allowed scope and do not mutate forbidden targets.
- [ ] Step 264 [Sem] — Implement “plan explainability”: each opcode carries a reason string linked to the goal it serves.
- [ ] Step 265 [Sem] — Implement “plan provenance”: preserve lexeme/rule origins through to plan steps for end-to-end explanations.

- [ ] Step 266 [Sem][Infra] — Integrate Prolog for symbolic suggestions: query theory KB for chord substitutions, cadence options, mode inference.
- [ ] Step 267 [Sem] — Define a typed Prolog query layer for GOFAI planning (wrap raw predicates; validate results).
- [ ] Step 268 [Sem] — Define “theory-driven levers” that depend on analysis (e.g., tension increase via chromatic mediants if harmony permits).
- [ ] Step 269 [Type] — Define an interface for “analysis facts” computed from project state (key estimate, chord map, density metrics).
- [ ] Step 270 [Infra] — Add caching for analysis facts keyed by project version and scope to avoid recomputation per keystroke.

- [ ] Step 271 [Sem] — Implement “constraints as filters”: constraints prune candidate levers early (if preserve melody exact, avoid reharmonize ops).
- [ ] Step 272 [Sem] — Implement “soft constraints as weights”: preferences influence scoring but never violate hard constraints.
- [ ] Step 273 [Sem] — Implement “capability-aware planning”: if production layer disabled, map “wider” to orchestration levers instead of DSP.
- [ ] Step 274 [Sem][HCI] — Implement “ask vs act” planning: if satisfaction requires risky ops, produce a clarification/choice rather than auto-select.
- [ ] Step 275 [Type] — Implement an “effect typing” rule: plans with mutation effects cannot be executed in `full-manual` without explicit confirmation.

- [ ] Step 276 [Sem] — Add plan opcodes for musical structure edits: duplicate section, shorten/extend, insert pickup, add break/build/drop.
- [ ] Step 277 [Sem] — Add plan opcodes for rhythm edits: swing adjustment, quantize strength, humanize timing, halftime/doubletime transforms.
- [ ] Step 278 [Sem] — Add plan opcodes for harmony edits: revoice, add extensions, substitute chords under melody constraints, functional reharmonization.
- [ ] Step 279 [Sem] — Add plan opcodes for melody edits: ornamentation, contour shaping, register shifts under range constraints (must be optional/high cost).
- [ ] Step 280 [Sem] — Add plan opcodes for arrangement edits: add/remove layers, role redistribution, density shaping across sections.

- [ ] Step 281 [Type] — Define a typed “plan execution preflight” that checks project world invariants and gathers required entity bindings.
- [ ] Step 282 [Type] — Define a typed “plan postflight” that recomputes diffs and verifies constraints; if fail, rollback automatically.
- [ ] Step 283 [Type] — Define a deterministic “plan-to-diff summary” mapping for UI (what changed by layer/section).
- [ ] Step 284 [HCI] — Design a “plan preview timeline” that visually marks where edits apply (bar ranges highlighted).
- [ ] Step 285 [HCI] — Design “confidence UI”: show confidence as “ready / needs clarification / risky” derived from hole count + cost.

- [ ] Step 286 [Eval] — Build a planning golden suite: given CPL-Intent and a fixture, expected top plan(s) are stable and deterministic.
- [ ] Step 287 [Eval] — Add constraint violation tests: planner must never output a plan that violates hard constraints in the fixture.
- [ ] Step 288 [Eval] — Add least-change tests: given two satisfying plans, system picks lower cost unless user requests otherwise.
- [ ] Step 289 [Eval] — Add plan explanation tests: reasons include at least one link from each goal to at least one opcode.
- [ ] Step 290 [Eval] — Add performance tests: planning stays within time budget for typical scopes (chorus-level edits).

- [ ] Step 291 [Prag] — Integrate user preference profiles into lever selection (e.g., “dark” meaning influences lever bundle).
- [ ] Step 292 [Prag] — Implement “plan negotiation”: user can accept plan A, request plan B, or modify one lever (“keep it wide but less bright”).
- [ ] Step 293 [HCI] — Add UI for “edit lever sliders” that tweak plan parameters before execution (quantize strength, register shift).
- [ ] Step 294 [HCI] — Add UI for “plan patching”: user can remove a step from the plan and revalidate.
- [ ] Step 295 [Type] — Ensure plan patching re-runs constraint checks and displays violations before allowing apply.

- [ ] Step 296 [Sem] — Add planning support for “multi-objective” requests (increase lift but decrease busyness) by choosing orthogonal levers.
- [ ] Step 297 [Sem] — Add planning support for “keep X but change Y” by encoding X as hard constraint and planning only over Y levers.
- [ ] Step 298 [Sem] — Add planning support for “only change drums” by restricting opcodes to selectors matching drums.
- [ ] Step 299 [Sem] — Add planning support for “do it again but bigger” by taking prior plan and scaling amounts with constraints preserved.
- [ ] Step 300 [Infra] — Add a plan serialization format (with schema + provenance) so plans can be saved, shared, and replayed.

---

## Phase 6 — Execution: Compile Plans to CardPlay Mutations with Diffs + Undo (Steps 301–350)

- [ ] Step 301 [Type] — Define `EditPackage` as the atomic applied unit: contains CPL, plan, diff, provenance, undo token, and timestamps.
- [ ] Step 302 [Type] — Define a transactional execution model: apply edits to a fork; validate constraints; commit or rollback.
- [ ] Step 303 [Type] — Define an execution effect system: UI actions are separate from project mutations; planners produce proposals, executors apply.
- [ ] Step 304 [Type] — Define a canonical diff model: event diffs, container diffs, card graph diffs, param diffs, each with stable ordering.
- [ ] Step 305 [Type] — Define “constraint checkers” as functions from (before, after, selector) → pass/fail + counterexample report.

- [ ] Step 306 [Infra] — Implement event-level edit primitives by composing existing `cardplay/src/events/operations.ts` functions where possible.
- [ ] Step 307 [Infra] — Implement selector application over project state: find events by scope and tags deterministically.
- [ ] Step 308 [Infra] — Implement plan opcode executors for core event transforms (quantize, shift, density edits, register shifts).
- [ ] Step 309 [Infra] — Implement plan opcode executors for structure edits (insert break, duplicate section) with marker updates.
- [ ] Step 310 [Infra] — Implement plan opcode executors for card parameter edits (set_param) with type-safe param validation.

- [ ] Step 311 [Type] — Introduce param schema validation for cards (enum/number/bool/object), so “set cutoff to 12k” can be validated or clarified.
- [ ] Step 312 [Type] — Implement “unknown param” behavior: show similar params, ask user to choose, or refuse.
- [ ] Step 313 [Type] — Implement “value coercion” rules with provenance: “12k” → 12000; “+3dB” → numeric; refuse unsafe coercions.
- [ ] Step 314 [Type] — Implement “execution capability checks”: if a plan requires routing edits but policy forbids it, downgrade to preview-only.
- [ ] Step 315 [Infra] — Implement “deterministic host action ordering” so repeated runs produce identical diffs.

- [ ] Step 316 [Infra] — Implement automatic undo integration with CardPlay store: each `EditPackage` becomes one undo step (or a grouped transaction).
- [ ] Step 317 [Infra] — Implement redo integration; ensure redo re-validates constraints if the world changed since original apply.
- [ ] Step 318 [Type] — Implement “edit package addressability”: users can undo by package ID, by scope, or by turn index.
- [ ] Step 319 [HCI] — Add UI for “undo preview”: show what will revert before actually undoing.
- [ ] Step 320 [HCI] — Add UI for “reapply”: user can reapply a prior package to a new context if still valid.

- [ ] Step 321 [Sem][Type] — Implement melody preservation checkers (exact pitch+onset equality; tolerances for “recognizable”).
- [ ] Step 322 [Sem][Type] — Implement harmony preservation checkers (chord skeleton equality; functional equivalence; extension invariance).
- [ ] Step 323 [Sem][Type] — Implement rhythm preservation checkers (grid-aligned onset sets; swing/humanize allowances).
- [ ] Step 324 [Sem][Type] — Implement “only-change” checker: diff must touch only allowed selectors; report violations with highlighted events.
- [ ] Step 325 [Sem][Type] — Implement “no-new-layers” checker: ensure no new tracks/cards are added unless allowed.

- [ ] Step 326 [Infra] — Implement diff rendering helpers: convert low-level diffs into human summary sentences (“Chorus: hats density +20%”).
- [ ] Step 327 [Infra] — Implement “reason traces”: for each diff item, link back to the plan opcode and the goal it served.
- [ ] Step 328 [Infra] — Implement “explanation generator”: produce before/after summaries and satisfy-constraint reports.
- [ ] Step 329 [HCI] — Add UI for diff visualization: per-section timeline overlay + per-layer change list + filter by kind.
- [ ] Step 330 [HCI] — Add UI for “what changed and why” that is readable by collaborators (exportable report).

- [ ] Step 331 [Ext][Type] — Define how extension opcodes compile: extensions return proposed `EditPackage` fragments but core executor applies them.
- [ ] Step 332 [Ext][Type] — Enforce extension handler purity: forbid direct store mutation in extension code paths; require returning pure patch objects.
- [ ] Step 333 [Ext][Type] — Define “unknown opcode” runtime behavior: cannot execute; must display and ask for handler selection or decline.
- [ ] Step 334 [Type] — Implement “safe failure”: if execution fails mid-transaction, rollback and show a structured error with context and suggested fixes.
- [ ] Step 335 [HCI] — Add UI for execution failures that shows exactly which precondition failed and offers remedial actions (“select a chorus first”).

- [ ] Step 336 [Eval] — Build execution golden tests: given plan + fixture, applying yields exact diff snapshots and passes constraint checks.
- [ ] Step 337 [Eval] — Add undo/redo roundtrip tests: apply → undo → redo yields identical state and identical diffs.
- [ ] Step 338 [Eval] — Add property tests: applying a plan then applying its inverse yields original state (where inverse defined).
- [ ] Step 339 [Eval] — Add fuzz tests for selector safety: random scopes must not escape their bounds or mutate outside allowed ranges.
- [ ] Step 340 [Eval] — Add performance tests for apply+diff: stay within latency budgets for typical edits.

- [ ] Step 341 [Type] — Add a “transaction log” type that records each micro-step for debugging without exposing internal mutable state.
- [ ] Step 342 [Infra] — Add “preview apply” mode that applies to a cloned project state for visualization without affecting main undo stack.
- [ ] Step 343 [HCI] — Add UI to toggle preview vs apply; preview should be the default when ambiguity/risks are high.
- [ ] Step 344 [Type] — Add a stable “edit signature hash” for deduplicating identical plans and for caching.
- [ ] Step 345 [Infra] — Add deterministic serialization of edit packages for shareability and audit.

- [ ] Step 346 [Prag] — Integrate the dialogue state with applied edits: after apply, update salience and discourse referents to stabilize subsequent pronouns.
- [ ] Step 347 [Prag] — Implement “undo affects discourse”: if user undoes an edit, update what “again” and “that change” refer to.
- [ ] Step 348 [HCI] — Add UI affordances for referencing history (“undo the chorus lift change”) by clicking on a past turn.
- [ ] Step 349 [Infra] — Add a bug-report export: include utterance, CPL, plan, diff, and provenance traces without including audio/IP data.
- [ ] Step 350 [Infra] — Add a deterministic “replay runner” that can replay a conversation and applied edits from logs for regression debugging.

---

## Phase 7 — HCI: The GOFAI Deck, Clarifications, Trust, and Flow (Steps 351–400)

- [ ] Step 351 [HCI] — Implement a GOFAI deck UI with three panes: English input, CPL viewer, Plan/Diff preview, aligned with CardPlay deck patterns.
- [ ] Step 352 [HCI] — Add inline scope visualization: hovering “chorus” highlights the bound section in the timeline and editors.
- [ ] Step 353 [HCI] — Add inline entity chips: resolved referents appear as chips (“Chorus 2”, “Drums track”) that can be clicked to change binding.
- [ ] Step 354 [HCI] — Add “apply” gating UI: disabled until required clarifications resolved and plan preflight passes.
- [ ] Step 355 [HCI] — Add a “quick actions” bar: undo, redo, explain, compare plans, export report.

- [ ] Step 356 [HCI] — Implement a dedicated clarification modal that supports QUD-style options with defaults and consequences.
- [ ] Step 357 [HCI] — Provide an “ask fewer questions” toggle that allows the user to set stronger defaults (with safety warnings).
- [ ] Step 358 [HCI] — Provide a “strict mode” toggle for studios: always clarify ambiguous terms; never auto-default.
- [ ] Step 359 [HCI] — Implement keyboard-first workflows: enter command, navigate clarifications, apply, undo, all without mouse.
- [ ] Step 360 [HCI] — Implement accessibility semantics (ARIA labels, focus management, screen reader-friendly diff summaries).

- [ ] Step 361 [HCI] — Add a “plan comparison” UI: show two candidate plans with side-by-side diff summaries and lever explanations.
- [ ] Step 362 [HCI] — Add a “lever editing” UI: user can tweak plan parameters (amounts, ranges) before apply and revalidate.
- [ ] Step 363 [HCI] — Add a “scope editing” UI: user can expand/narrow scope via timeline brushing; CPL updates live.
- [ ] Step 364 [HCI] — Add “safety badges” (safe/medium/risky) derived from cost model + constraint risk; show why in tooltip.
- [ ] Step 365 [HCI] — Add “explanation mode” where the tool narrates musical reasoning (“Raised register to increase lift”).

- [ ] Step 366 [HCI] — Integrate the GOFAI deck into board gating: only visible in boards whose tool config allows it; otherwise parse-only in a minimal panel.
- [ ] Step 367 [HCI] — Add a “board recommendation” action: if a request requires tools not available, suggest switching boards rather than failing.
- [ ] Step 368 [HCI] — Add UI for “capability mismatches” (e.g., production edits requested but production tools disabled): show alternatives.
- [ ] Step 369 [HCI] — Add UI for “inspect requests” (show chords, show density): results display in a structured viewer, not chat text.
- [ ] Step 370 [HCI] — Add “bookmarking” and “naming” of edit packages (“Chorus lift v3”), and allow quick revert to bookmarks.

- [ ] Step 371 [HCI] — Implement a “confidence timeline”: show how confidence changes as the user clarifies and refines.
- [ ] Step 372 [HCI] — Implement “show me what you understood” as a dedicated action that displays CPL and bindings even before planning.
- [ ] Step 373 [HCI] — Implement “teach me” explanations: the system can explain chord functions, groove changes, and why a plan increases tension.
- [ ] Step 374 [HCI] — Implement “collaboration export”: generate a shareable markdown/JSON report of edits without including sensitive assets.
- [ ] Step 375 [HCI] — Implement “undo/redo UX parity”: undo and redo should show the same diff previews as apply.

- [ ] Step 376 [HCI] — Implement error affordances: parse errors highlight spans; unsatisfied constraints show counterexamples; missing referents show binding suggestions.
- [ ] Step 377 [HCI] — Implement “safe degrade”: when a request is too broad, the UI offers narrower scopes or proposes inspection first.
- [ ] Step 378 [HCI] — Implement “user intent editing”: allow directly editing CPL nodes (advanced mode) while preserving provenance of manual edits.
- [ ] Step 379 [HCI] — Implement “developer inspector mode”: show parse forest, MRS constraints, discourse referents, plan scoring details.
- [ ] Step 380 [HCI] — Implement “profile UX”: per-user defaults for vague terms and safety level; allow exporting/importing profiles.

- [ ] Step 381 [HCI] — Add a “vocabulary hinting” UX: as user types, suggest known axes/entities (“lift”, “chorus 2”, “hats”).
- [ ] Step 382 [HCI] — Add “did you mean…” corrections for unknown terms based on lexicon and symbol tables.
- [ ] Step 383 [HCI] — Add “inline plan preview” for simple requests (single lever), showing immediate diff proposals.
- [ ] Step 384 [HCI] — Add “plan staging”: user can queue multiple edits and apply as a single package, with combined diff.
- [ ] Step 385 [HCI] — Add “guard rails” for destructive edits: large structural changes require extra confirmation UI.

- [ ] Step 386 [Eval][HCI] — Run formative usability tests on the clarification UI with musicians; measure confusion points and iterate.
- [ ] Step 387 [Eval][HCI] — Measure time-to-completion for common edits vs manual DAW-like operations; track deltas.
- [ ] Step 388 [Eval][HCI] — Measure “trust metrics”: frequency of undo, frequency of plan preview usage, and user-reported confidence.
- [ ] Step 389 [Eval][HCI] — Run A/B tests (local) for different explanation formats (lever-based vs narrative) and measure comprehension.
- [ ] Step 390 [Eval][HCI] — Validate accessibility with keyboard-only and screen reader testing; add tests for focus traps.

- [ ] Step 391 [HCI] — Implement onboarding: guided tutorial that teaches scopes, constraints, and how clarifications work.
- [ ] Step 392 [HCI] — Implement tooltips and inline examples for common commands (“cut drums for two bars before last chorus”).
- [ ] Step 393 [HCI] — Implement “command templates” as chips that insert structured phrases (reduces parse errors).
- [ ] Step 394 [HCI] — Implement “status bar” showing current parse state (ok / ambiguous / needs entity / needs capability).
- [ ] Step 395 [HCI] — Implement “power user shortcuts” (jump to CPL view, jump to diff view, jump to bindings inspector).

- [ ] Step 396 [HCI] — Implement “progressive disclosure”: novices see simplified CPL; experts can expand into full typed structure.
- [ ] Step 397 [HCI] — Implement “explain constraints” UI: show exactly which constraint checks were run and their outcomes.
- [ ] Step 398 [HCI] — Implement “plan safety summary” UI: small table listing touched scopes/layers/cards and preserved invariants.
- [ ] Step 399 [HCI] — Implement “offline reassurance” UI: show that no network is used and assets remain local.
- [ ] Step 400 [Infra] — Add UX instrumentation (local, optional) to capture parse failures and clarification frequency for iterative improvement.

---

## Phase 8 — Infinite Extensibility: New Cards/Decks/Boards/Theories Plug In (Steps 401–450)

- [ ] Step 401 [Ext][Type] — Define the GOFAI extension interface (register lexicon, bindings, planner hooks, Prolog modules) with strict namespacing rules.
- [ ] Step 402 [Ext][Infra] — Implement an extension registry with register/unregister events and version negotiation.
- [ ] Step 403 [Ext][Infra] — Implement auto-discovery: when a CardPlay pack loads, attempt to load its optional GOFAI extension module.
- [ ] Step 404 [Ext][Type] — Define an extension trust model (trusted/untrusted) affecting whether execution hooks are enabled by default.
- [ ] Step 405 [Ext][HCI] — Add UI for enabling/disabling extension execution capabilities with clear local-only security messaging.

- [ ] Step 406 [Ext][NLP] — Implement dynamic lexicon updates: extensions can register new lexemes/synonyms without restarting the app.
- [ ] Step 407 [Ext][NLP] — Implement dynamic grammar updates: extensions can register new constructions with rule IDs and required test artifacts.
- [ ] Step 408 [Ext][Sem] — Implement namespaced semantic nodes: extension-provided meanings must carry `namespace:` and be preserved through CPL serialization.
- [ ] Step 409 [Ext][Type] — Implement schema-declared constraints so unknown constraints are still typechecked/pretty-printed if declared by extension.
- [ ] Step 410 [Ext][Type] — Implement namespaced opcodes and an opcode registry that binds opcode IDs to pure compilation handlers.

- [ ] Step 411 [Ext][Infra] — Implement auto-binding for CardRegistry: any registered card becomes referable by name and ID (“add <card>”, “set <param>”).
- [ ] Step 412 [Ext][Infra] — Implement auto-binding for BoardRegistry: boards become referable (“switch to <board>”) and searchable via stable matching.
- [ ] Step 413 [Ext][Infra] — Implement auto-binding for deck types and deck instances (“open the mixer deck”, “move the GOFAI deck right”).
- [ ] Step 414 [Ext][Prag] — Merge extension entities into the symbol table with provenance and stable precedence rules.
- [ ] Step 415 [Ext][HCI] — Add UI labeling showing provenance (“from my-pack@1.2.0”) on lexeme meanings and plan steps.

- [ ] Step 416 [Ext][Type] — Allow cards to provide GOFAI metadata: synonyms, role hints, param semantics, and axis bindings; validate schema.
- [ ] Step 417 [Ext][Type] — Allow boards to provide GOFAI metadata: default scopes, workflow verbs, safe execution policies.
- [ ] Step 418 [Ext][Type] — Allow decks to provide GOFAI metadata: what “the deck” refers to, common actions, and safe scopes.
- [ ] Step 419 [Ext][Sem] — Implement axis-to-param binding declarations so “wider” can map to a specific card param when present.
- [ ] Step 420 [Ext][Sem] — Implement fallback semantics when no binding exists: treat adjective as axis request and plan with non-extension levers.

- [ ] Step 421 [Ext][Infra] — Define extension Prolog module registration: packs can ship `.pl` sources consulted into the PrologAdapter with stable module names.
- [ ] Step 422 [Ext][Infra] — Define Prolog vocab export conventions (e.g., `gofai_vocab/3`) so the lexicon can ingest new theory terms.
- [ ] Step 423 [Ext][NLP] — Implement lexicon ingestion from Prolog vocab exports with normalization and conflict resolution.
- [ ] Step 424 [Ext][Sem] — Implement TS-side typed wrappers over extension Prolog predicates for planning and validation.
- [ ] Step 425 [Ext][Eval] — Add tests ensuring extension Prolog load order cannot break core KB predicates; require namespaced module names.

- [ ] Step 426 [Ext][Type] — Implement extension opcode handler purity checks: handlers return patch proposals; core executor applies and diffs.
- [ ] Step 427 [Ext][Type] — Implement execution gating: extension opcodes cannot run in strict/manual contexts unless explicitly approved.
- [ ] Step 428 [Ext][HCI] — Add “unknown opcode UI”: show plan step but disable apply; allow user to install/enable the required extension.
- [ ] Step 429 [Ext][Infra] — Implement hot reload of extensions in dev mode: re-register lexicon/opcodes and invalidate parse/planning caches.
- [ ] Step 430 [Ext][Infra] — Implement cache invalidation keyed by extension registry version and enabled namespaces.

- [ ] Step 431 [Ext][Type] — Record extension namespace+version in every applied EditPackage for audit and reproducibility.
- [ ] Step 432 [Ext][Type] — Implement migration strategy when extension versions change: preserve old CPL serialization and annotate compatibility status.
- [ ] Step 433 [Ext][HCI] — Add UI to show “this plan depends on extension X”; clicking shows what it contributes and why it’s needed.
- [ ] Step 434 [Ext][Eval] — Add a per-namespace paraphrase invariance harness: extensions must provide tests for new language mappings.
- [ ] Step 435 [Ext][Eval] — Add a per-namespace golden diff harness: extension opcodes must be tested on fixtures with constraint checks.

- [ ] Step 436 [Ext][Infra] — Build a “GOFAI language pack generator” that scaffolds bindings from a pack’s card metadata + params.
- [ ] Step 437 [Ext][Infra] — Build a “lexeme coverage report” per pack that shows missing synonyms and missing axis bindings.
- [ ] Step 438 [Ext][HCI] — Build a “pack vocabulary browser” UI that lets users search pack-specific commands and examples.
- [ ] Step 439 [Ext][Type] — Enforce that all extension-added constraints/opcodes/axes are namespaced and documented; add a linter.
- [ ] Step 440 [Ext][Infra] — Define a stable API boundary so GOFAI extensions can be authored without importing deep internal modules.

- [ ] Step 441 [Ext][Prag] — Ensure pragmatic resolution accounts for extension entities: “that stutter card” should resolve to extension card instances.
- [ ] Step 442 [Ext][Prag] — Ensure clarification questions can mention extension terms cleanly (“Do you mean my-pack:stutter or core:repeat?”).
- [ ] Step 443 [Ext][Sem] — Allow extensions to contribute new discourse cues (“drop”, “build”, “lift”) with explicit mapping to plan skeletons.
- [ ] Step 444 [Ext][Sem] — Allow extensions to contribute new musical object types (microtonal pitch sets, non-Western ornaments) via schemas and selectors.
- [ ] Step 445 [Ext][Type] — Define how new object types interoperate with `Event<P>`: either new EventKind payloads or new tags/roles with adapters.

- [ ] Step 446 [Ext][HCI] — Add UI for extension-contributed “clarification defaults” and let users override them globally.
- [ ] Step 447 [Ext][HCI] — Add UI for extension safety warnings (e.g., “this opcode can add new tracks”) with explicit confirmation.
- [ ] Step 448 [Ext][Eval] — Add security tests: untrusted extensions cannot execute mutations without explicit enabling; parsing remains allowed.
- [ ] Step 449 [Ext][Infra] — Add a local “extension audit log” export: lists enabled namespaces, versions, and applied edits referencing them.
- [ ] Step 450 [Ext][Infra] — Document a complete “ship a GOFAI-enabled pack” tutorial with a minimal end-to-end example.

---

## Phase 9 — Verification, Evaluation, Performance, and Release Discipline (Steps 451–500)

- [ ] Step 451 [Eval] — Build a unified test runner: NL→CPL goldens, paraphrase invariance, planning goldens, execution diffs, undo/redo roundtrips.
- [ ] Step 452 [Eval] — Add “golden stability” policy: changing a golden requires explicit rationale and review; automated diff of CPL/plan output required.
- [ ] Step 453 [Eval] — Add fuzz testing for the full pipeline on synthetic utterances to catch crashes and unsafe defaults.
- [ ] Step 454 [Eval] — Add property-based tests for invariants (constraints never violated; execution never touches out-of-scope entities).
- [ ] Step 455 [Eval] — Add integration tests for multi-turn dialogues (DRT/QUD behaviors) with deterministic outcomes.

- [ ] Step 456 [Eval][HCI] — Conduct expert review with musicians: validate that clarifications are musically meaningful and not “computer questions.”
- [ ] Step 457 [Eval][HCI] — Run a “trust study”: measure how often users preview before apply and how often they accept defaults vs override.
- [ ] Step 458 [Eval][HCI] — Run a “workflow speed study”: compare time and error rates vs manual editing for 10 common edit tasks.
- [ ] Step 459 [Eval] — Create a benchmark suite for parsing/planning latency and memory footprint; set budgets for offline operation.
- [ ] Step 460 [Eval] — Add regression benchmarks so performance does not degrade as lexicon/grammar grows toward 100K+ LOC.

- [ ] Step 461 [Infra] — Implement aggressive caching: tokenization, parse forests, analysis facts, and plan candidates keyed by stable hashes.
- [ ] Step 462 [Infra] — Implement incremental recomputation: editing one word shouldn’t recompute the entire plan; reuse prior artifacts when safe.
- [ ] Step 463 [Infra] — Add determinism enforcement: prohibit Date.now() in semantics/planning; isolate timestamps to execution metadata only.
- [ ] Step 464 [Infra] — Add “debug traces” that can be toggled without affecting determinism of core outputs.
- [ ] Step 465 [Infra] — Add a “replay determinism” CI test: run the same utterance/fixture twice and assert byte-identical CPL/plan/diff serialization.

- [ ] Step 466 [Infra] — Ensure the runtime has no network dependencies (bundle required knowledge bases; disable accidental fetches).
- [ ] Step 467 [Infra] — Implement a packaging strategy for large lexicons/grammars (chunked loading, compression) while keeping offline guarantees.
- [ ] Step 468 [Infra] — Add a “cold start” benchmark and optimize initial lexicon load times; show progress UI if needed.
- [ ] Step 469 [Infra] — Add a “memory cap” strategy for parse forests (prune low-scoring parses; keep ambiguity visible via holes instead).
- [ ] Step 470 [Infra] — Add robust error isolation: parse/plan errors must not corrupt project state; always fail closed.

- [ ] Step 471 [Type] — Formalize the compiler interfaces in TS with strong typing and clear boundaries between layers (nl ↔ semantics ↔ pragmatics ↔ planning ↔ execution).
- [ ] Step 472 [Type] — Add a “semantic compatibility test” that ensures CPL JSON schema changes require version bumps and migration functions.
- [ ] Step 473 [Type] — Add a “planner opcode compatibility test”: opcodes must have handlers, docs entries, and tests (mirrors board factory validation spirit).
- [ ] Step 474 [Type] — Add a “namespacing compliance test” for all extension contributions (lexemes, constraints, opcodes, prolog modules).
- [ ] Step 475 [Type] — Add a “capability compliance test”: plans that require disallowed capabilities must never execute in restricted boards.

- [ ] Step 476 [HCI] — Polish micro-interactions: fast feedback while typing, smooth transitions between CPL and diff views, no modal spam.
- [ ] Step 477 [HCI] — Add “user control” improvements: allow pinning scope, pinning a referent, and preventing the system from re-binding it.
- [ ] Step 478 [HCI] — Add “explainability polish”: the system can always answer “what changed?”, “why?”, and “what did you keep fixed?”.
- [ ] Step 479 [HCI] — Add an “export CPL/plan” feature for advanced users to script and share deterministic edits.
- [ ] Step 480 [HCI] — Add an “import plan” feature to replay an edit package on a compatible project with validation and preview.

- [ ] Step 481 [Docs] — Write a full GOFAI user guide: scopes, constraints, clarifications, examples for each board persona.
- [ ] Step 482 [Docs] — Write a full GOFAI developer guide: how to add lexemes, grammar rules, opcodes, and tests.
- [ ] Step 483 [Docs][Ext] — Write a GOFAI extension spec: pack metadata, Prolog module conventions, namespacing, security, compatibility.
- [ ] Step 484 [Docs][Theory] — Write a “semantics/pragmatics design note” describing which theories are implemented where (MRS, DRT, QUD, presupposition).
- [ ] Step 485 [Docs] — Add a troubleshooting guide mapping common failures to fixes (e.g., “it” ambiguous → pin scope).

- [ ] Step 486 [Release] — Define MVP scope: a constrained sublanguage that reliably edits structure/arrangement/groove with full preview+undo.
- [ ] Step 487 [Release] — Define a staged rollout: parse+explain first, plan preview second, execution third, extension execution last.
- [ ] Step 488 [Release] — Define a “strict studio mode” default for first release: never execute without explicit apply; always log diffs.
- [ ] Step 489 [Release] — Define backward compatibility strategy for saved edit histories and preferences across versions.
- [ ] Step 490 [Release] — Define “quality gates”: block release if paraphrase invariance, constraint correctness, or undo roundtrips regress.

- [ ] Step 491 [Eval] — Create a public (or internal) benchmark corpus of music-edit utterances and fixtures for longitudinal progress tracking.
- [ ] Step 492 [Eval] — Add an “adversarial” corpus: tricky scope, nested negation, multiple referents, and vague adjectives to stress pragmatics.
- [ ] Step 493 [Eval] — Create a “domain expansion” corpus: non-Western theory terms, new pack cards, new boards to validate extensibility pipeline.
- [ ] Step 494 [Eval] — Run “human eval” sessions where experts judge whether CPL matches intended meaning; compute disagreement and target reductions.
- [ ] Step 495 [Eval] — Track “clarification load”: measure number of questions per successful edit; optimize without sacrificing safety.

- [ ] Step 496 [Infra] — Implement a stable “version fingerprint” for the GOFAI compiler (lexicon+grammar+planner+KB) stored in edit packages.
- [ ] Step 497 [Infra] — Add a compatibility checker: warn if a plan made under compiler version X is replayed under incompatible version Y.
- [ ] Step 498 [Infra] — Add a “minimal reproduction builder”: given a failure, auto-generate a fixture and utterance that reproduces it.
- [ ] Step 499 [Infra] — Add CI automation that runs a curated subset of goldens + perf checks on every change touching GOFAI modules.
- [ ] Step 500 [Release] — Ship the first offline GOFAI Music+ loop: English → CPL → clarification → plan preview → apply → diff + undo, with extension auto-binding enabled.

