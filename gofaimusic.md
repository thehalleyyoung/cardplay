# GOFAI Music: An Offline Natural-Language Agent That Edits Songs by Meaning (Not Vibes)

## Executive summary

This document proposes **GOFAI Music**, an **offline natural-language agent** that translates human musical directions into **explicit, verifiable changes** to a song. The premise is intentionally ambitious:

- We know enough about **music theory**, **music cognition**, and the **mathematics of musical structure** to represent “what a song is” and “what it means to change it” in formal terms.
- We also know enough about **linguistics and pragmatics** to build a system that maps natural language into a **typed logical form** that captures intent, constraints, and references across dialogue.
- Historically, we couldn’t implement broad language coverage and the sheer volume of musical domain knowledge because it would take **millions of lines** of grammar, lexicon, ontology, and rule code.
- Now, LLMs can be used as the “scaling workforce” to author and maintain those symbolic artifacts, while the deployed runtime remains **offline, deterministic, inspectable, and owned** by the user.

The result is not “a chatbot that makes music.” It’s a **natural language compiler** into a domain-specific, Prolog-friendly language that drives an **action model** over a song’s world state: arrangement, harmony, rhythm, motifs, performance, and (optionally) production parameters.

The flagship use case is high-impact and tractable:

> **Offline, low-latency “language-to-edit” control for DAW sessions, live performance rigs, education, and IP-sensitive studios**—where cloud LLM dependence is unacceptable due to cost, latency, confidentiality, or workflow reliability.

In short: talk to your song like you talk to a collaborator—then get back a structured plan, auditable edits, and a versioned, reversible result.

---

## The core claim: music directions have semantics we can compile

Musicians, producers, composers, and educators constantly use language to coordinate musical work. Crucially, much of that language is not “poetic vibes”; it is **semantically stable** within a context:

- “Make the chorus hit harder.”
- “Start with a lonely piano and let the beat creep in.”
- “Keep the chords, but make it feel more hopeful.”
- “Switch the second verse to halftime.”
- “Cut the drums for two bars before the last chorus.”
- “Bring the bass forward and tighten the groove.”
- “Give the bridge more tension, then a clean release.”
- “Same melody, different harmony; keep the hook recognizable.”

These statements encode:

1. **Targets**: sections, bars, layers, instruments, motifs, transitions.
2. **Transformations**: add/remove layers, reharmonize, change groove, change density, change register.
3. **Constraints**: preserve motif identity, keep chord progression, don’t exceed vocal range, keep the drop at bar 49.
4. **Optimization goals**: “more lift”, “less busy”, “tighter”, “more intimate”.
5. **Pragmatics**: “like before”, “that chorus”, “do it again but bigger”, implied defaults.

We can formalize these. Not perfectly for all of human language, but well enough for a large, useful sublanguage that feels natural in music workflows.

GOFAI Music treats natural language as a programming language for **musical edits**.

---

## Why offline? The compelling reason this can’t just be “LLM + tools”

If the goal were to generate a new audio clip that “sounds like X,” cloud models already do that. But the highest-value workflows in music often require:

### 1) Confidentiality and IP control

Modern production involves sensitive assets:

- unreleased songs
- label-controlled stems
- client material under NDA
- proprietary sample libraries and sound design chains
- vocal takes and identifiable performances

Sending any of this to a third-party API can be prohibited, risky, or simply a non-starter culturally. Even if a vendor promises policy compliance, many studios and labels prefer not to depend on it. An offline agent keeps the entire edit loop on the machine (or in a local network enclave) and supports a clean story: **your material never leaves your environment**.

### 2) Reliability in the moments that matter

Creative sessions and live performance have a harsh property: you can’t pause inspiration for an outage.

- Internet drops.
- Vendor APIs degrade.
- Latency spikes.
- On-tour rigs run in environments with limited connectivity.
- Classroom settings often have inconsistent network access.

If the agent is part of the core workflow—“do the thing I said, now”—it must be able to operate without cloud dependencies.

### 3) Cost predictability at “micro-edit scale”

Music editing is typically *not* one big “generate a full track” request. It is hundreds of micro-iterations:

- “Try the chorus a little brighter.”
- “Now less bright, but keep the same lift.”
- “Keep that, but tighten the drums.”
- “Drop the bass in the pre-chorus.”
- “Bring it back two bars earlier.”
- “Same thing, but make the bridge less busy.”

Token-based cloud systems charge for every loop: repeated context, repeated retrieval, repeated analysis. In creative workflows, that turns into a subtle tax on experimentation. An offline agent has a different economic shape:

- local compute once
- reusable symbolic assets (grammar, ontology, rules)
- essentially zero marginal cost per iteration

This matters not only for hobbyists, but for studios where time is money and iteration is the product.

### 4) Deterministic semantics and auditability

Professional music work values *control*. When someone says “keep the melody” they mean it. When they say “only change the drums,” they mean it. They also want to:

- inspect what changed
- revert the change
- reproduce the change later
- share a clear change summary with collaborators

LLM-only systems struggle to guarantee stable semantics under paraphrase. GOFAI Music is explicitly designed to make semantics enforceable:

- natural language is compiled to a typed logical form (MUS-LF)
- MUS-LF is validated against constraints and types
- edits are performed via a bounded library of actions (world steps)
- every action is logged with parameters and scope

This gives a user the confidence that the system is not “helpfully rewriting the song.” It is executing an edit plan you can read.

---

## The product vision: “Talk to the song, get edits you can trust”

GOFAI Music should feel like a collaborator who:

1. Understands what you said in musical terms.
2. If ambiguous, asks a precise clarification question.
3. Proposes a plan (“here’s what I’m going to change”).
4. Executes those edits (or applies them in a DAW project / score / MIDI timeline).
5. Explains what changed and why it satisfies your request.
6. Preserves musical identity unless you explicitly ask to replace it.

### A stylized interaction (designed to be plausible)

**User:**
> “Start with a lonely piano. Make it feel like 3 a.m. Keep the tempo steady, but don’t bring in drums until the second verse. In the chorus, I want more lift—brighter and wider—but keep the chord progression.”

**Agent:**
- Clarifies: “When you say ‘3 a.m.’ do you mean darker timbre, lower register, slower harmonic rhythm, or all three? Default: darker timbre + lower register + sparse texture.”
- Proposes a plan:
  - Intro (8 bars): solo piano in low register, sparse voicings, longer reverb tail.
  - Verse 1: piano + subtle pad, no drums, minimal bass.
  - Verse 2: add drums with a soft groove, add bass, keep density low.
  - Chorus: preserve chord progression, increase lift via higher register, brighter voicing, added top percussion, stereo widening (if production layer enabled).
- Applies changes and outputs:
  - a human-readable change summary
  - a machine-readable action script
  - an undoable edit package

The key: the agent is not “inventing a song.” It is taking an existing song (or a structured template) and applying explicit changes aligned with the language.

---

## The “world”: what a song is in a GOFAI agent

To compile language into edits, we need a world model. A “song” here is not just audio; it is a structured object with multiple representational layers.

### 1) Timeline and form

- sections: intro, verse, pre-chorus, chorus, bridge, outro (plus user-defined)
- bar ranges and time signatures
- transitions: pickups, breaks, builds, drops
- macro goals: energy curve, tension/release arcs

### 2) Musical layers (arrangement)

Each layer has a role and a recognizable identity:

- drums/percussion: groove, pattern families, fills, dynamics
- bass: rhythmic lock with drums, register, movement
- harmony: chords, voicings, voice-leading, rhythm
- melody: pitch contour, rhythm, range, motifs
- texture: pads, arps, guitars, synths, strings
- hooks and motifs: repeated recognizable patterns

### 3) Constraints and invariants

Musicians constantly impose invariants:

- “Keep chord progression” (exact chords vs functional skeleton must be disambiguated)
- “Keep the hook recognizable” (motif identity with allowed variation)
- “Don’t change the vocal rhythm” (alignment constraints)
- “Don’t exceed singer’s range” (pitch-set constraints)
- “Keep the drop at bar 49” (structural constraints)

GOFAI Music makes these explicit and checkable.

### 4) Performance semantics

Even in MIDI-first workflows, performance matters:

- articulation: legato/staccato, accents
- timing: laid-back, ahead-of-the-beat, humanization
- dynamics: crescendos, ghost notes, velocity shaping
- phrasing: breath points, emphasis

### 5) Production semantics (optional but powerful)

If a DAW adapter exists, production becomes first-class:

- width: stereo image, doubling, mid/side behavior
- brightness: spectral tilt, filter cutoff, harmonic excitation
- punch: transient shaping, compression, envelope
- space: reverb/delay parameters and automation

Even without a DAW adapter, production-like directions can be approximated via orchestration and arrangement (e.g., “wider” → double a pad, spread voicings, add stereo percussion).

---

## The target language: MUS-LF (Music Logical Form)

GOFAI Music compiles natural language into a typed, executable logical form that can be validated and planned into edits. MUS-LF is intentionally pragmatic: it represents the parts of meaning needed to do the job.

### Conceptual pipeline (offline)

```text
Natural language
   |
   v
Parse + pragmatics  ->  MUS-LF (typed intent)
   |                         |
   v                         v
Clarify (if needed)     Plan + validate
   |                         |
   +-----------+-------------+
               v
        World steps (edits)
               |
               v
     Updated song + diffs + explanations
```

### What MUS-LF must encode

- **Speech act**: query vs change vs propose vs commit vs undo
- **Scope**: which sections/bars/layers/motifs are targeted
- **Goals**: perceptual objectives (“more lift”, “less busy”) mapped to dimensions
- **Constraints**: hard invariants (“keep melody exact”, “only change drums”)
- **Preferences**: weighted tradeoffs (“prefer minimal change”, “prefer no new layers”)
- **Dialogue references**: “that chorus”, “same as before”, “do it again”

### An illustrative MUS-LF snippet

User:
> “Make the chorus hit harder, but keep the chords and melody the same. Add more lift and widen it.”

MUS-LF sketch:

```prolog
request(
  act(change),
  scope(section(chorus, all)),
  goals([
    increase(perceived_impact, amount(moderate)),
    increase(lift, amount(moderate)),
    increase(width, amount(moderate))
  ]),
  constraints([
    preserve(chord_progression, exact),
    preserve(melody, exact)
  ]),
  prefs([
    prefer(minimal_change),
    prefer(no_new_sections)
  ])
).
```

MUS-LF is what makes the system reviewable. It is the “source of truth” the agent can show to the user: “Here’s what I understood.”

---

## Pragmatics: meaning depends on context (and that’s okay)

Music directions are pragmatic by nature. Consider:

- “Make it darker.”
- “Do that again but bigger.”
- “Bring it in earlier.”
- “Same thing, no hats.”

A useful system needs a dialogue state that tracks:

- current song version
- salient entities (current section in focus, last edited layer)
- recent edit packages (as referents for “do that again”)
- user preferences (“dark” usually means “lower register + less brightness” for this user)

### Clarification as a feature

Ambiguity should trigger clarifying questions that are musically meaningful:

- “By ‘darker’, do you mean timbre (less brightness), harmony (more minor color), register (lower), or texture (sparser)? Default: timbre + register.”
- “When you say ‘earlier’, do you mean bring the drums in earlier in the song, or shift their placement earlier within each bar?”
- “Keep the chords: exact chord symbols, or preserve functional progression but allow extensions/substitutions?”

This is how the agent avoids “hallucinating semantics.” The system becomes trustworthy because it refuses to guess silently.

---

## The action model: “world steps” for musical edits

GOFAI Music’s runtime power comes from a bounded library of typed actions. These actions operate on the song world state and produce reproducible changes.

### Categories of actions

**Inspection actions (read-only)**
- Show chords in a section
- Display groove descriptors
- Compare two sections’ density/energy proxies
- Identify motif occurrences

**Edit actions (write)**
- Insert, remove, duplicate sections
- Add/remove layers
- Apply groove transformations (halftime/doubletime/swing)
- Change voicings or register
- Simplify or densify patterns
- Insert breaks, builds, drops

**Documentation actions**
- Generate a change summary
- Export a diff report
- Produce “teaching explanations” (why a change increased tension)

### Actions must be typed and validated

Each action should have:

- arguments with types (section, bar-range, layer, motif)
- preconditions (target exists, constraints satisfiable)
- postconditions (what facts change)
- rollback plan (undo stack or inverse action)
- provenance (what changed, where, and why)

This is what makes the system safe and professional.

---

## Planning: minimal-change edits under constraints

Once MUS-LF is compiled, the system must produce an actionable plan. Planning can be described as:

1. Convert goals into candidate lever changes.
2. Generate candidate edit packages (action sequences).
3. Validate candidates against constraints.
4. Score candidates by (a) goal satisfaction and (b) change cost.
5. Choose the best candidate, or ask the user to choose among a small set.

### The least-change principle

Many requests are “keep the song, improve the section.” The system should encode a default cost hierarchy:

- Very high cost: changing melody notes, removing the hook, changing section order
- High cost: changing chord skeleton, changing tempo, removing primary layers
- Medium cost: adding/removing supporting layers, changing bass rhythm
- Low cost: voicing/register changes, light percussion additions, timing tightening

This enables edits that feel musically respectful.

### Negotiation when goals conflict

Example: “more lift but less busy” is often achievable, but not always. The agent should:

- choose levers that increase lift without increasing density (register/voicing changes)
- avoid busy additions (arps, complex percussion)
- propose options:
  - Option A: “lift via register + brighter voicings” (minimal density)
  - Option B: “lift via arpeggiated texture” (more density)

This makes the agent feel like a collaborator rather than a random generator.

---

## Explanation and diffs: the adoption lever

People adopt tools that let them keep control. GOFAI Music should always produce:

1. **Plan explanation** (before applying)
2. **Change summary** (after applying)
3. **Diff artifact** (what changed, scoped)

Examples of a useful change summary:

- “Verse 2: applied halftime feel to snare/hats; kick preserved; bass rhythm simplified by 25%; quantize strength 0.6.”
- “Chorus: raised harmony voicings +12 semitones; added shaker on offbeats; widened pad layer by doubling and panning; preserved melody pitches exactly.”

This is the practical “sell”: it does not just do the thing, it tells you what it did in a way you can trust.

---

## A full end-to-end example (English → MUS-LF → actions)

### User request

> “Start the song with just piano and voice for 8 bars. Keep it at 96 BPM. Verse 1 should feel intimate and a little dark. Bring drums in on verse 2, but keep them soft. Make the chorus hit harder and feel more hopeful without changing the melody. Before the last chorus, drop everything for two bars.”

### Clarifications (explicit, pragmatic)

The system asks:

1. “Does ‘dark’ refer to harmony changes or to timbre/register/texture? Default: timbre/register/texture.”
2. “For ‘hopeful’ with melody fixed: allow chord extensions/substitutions under melody, or keep exact chords? Default: keep exact chords and adjust voicings/arrangement.”
3. “Drop everything: should the vocal continue (voice-only) or full silence? Default: voice-only.”

Assume the user accepts defaults.

### MUS-LF (sketch)

```prolog
request(act(change),
  steps([
    set_tempo(96),
    set_section(intro, bars(8), layers([piano, voice])),
    set_section(verse(1), goals([intimate, dark]),
      constraints([preserve(harmony, exact), preserve(melody, exact)])),
    set_section(verse(2), add_layers([drums_soft, bass_soft])),
    set_section(chorus(all), goals([hit_harder, hopeful]),
      constraints([preserve(melody, exact), preserve(chord_progression, exact)])),
    insert_break(before(last_chorus), bars(2), layers([voice_only]))
  ])
).
```

### Planned actions (executable)

1. `set_tempo(96)`
2. `ensure_section(intro, length=8)`
3. `thin_texture(intro, keep=[piano,voice])`
4. `thin_texture(verse1, keep=[piano,voice], strategy=sparse)`
5. `lower_register(piano, verse1, semitones=-5)`
6. `adjust_space(voice, verse1, closer=true)` (if production layer enabled)
7. `add_layer(verse2, drums, template=soft_pop_groove)`
8. `set_dynamics(drums, verse2, target=soft)`
9. `add_layer(verse2, bass, template=simple_root_motion)`
10. `chorus_package`:
    - `add_layer(chorus, bass, template=stronger_lock)`
    - `increase_drum_density(chorus, amount=moderate)`
    - `raise_register(harmony, chorus, semitones=+7)`
    - `brighten_voicings(chorus, constraints=keep_chords)`
    - `widen(chorus, amount=moderate)` (DAW or orchestration)
11. `insert_break(before_last_chorus, bars=2, layers=[voice_only])`
12. Validate constraints:
    - melody unchanged
    - chord progression unchanged
    - section boundaries consistent
13. Create edit package + diff + undo point

This is “music direction translation” made concrete.

---

## Why LLMs help (and why they shouldn’t be required at runtime)

The runtime of GOFAI Music should not depend on a cloud LLM. The system can be built and scaled using LLMs as tooling, but deployment should remain local and inspectable.

### LLMs as authoring assistants

LLMs can generate:

- lexical variants (“make it punchier”, “more punch”, “hit harder”)
- grammar expansions (imperatives, questions, coordination)
- MUS-LF test pairs (“utterance → expected logical form”)
- ontology expansion (instrument roles, production terms)
- action templates and precondition/effect skeletons

### Symbolic discipline keeps LLM output safe

LLM-generated artifacts are not trusted until they pass:

- type checks (arity, types, allowed predicates)
- unit tests (NL→MUS-LF expected)
- scenario tests (apply edits to fixtures and validate invariants)

This is the crucial separation:

> LLMs produce candidate code. The compiler and tests decide what ships.

---

## The MVP that proves the idea (and sells it)

The MVP should focus on “language-to-edit” for a MIDI/arrangement representation, because that gives the fastest path to a usable tool without getting stuck on audio generation.

### MVP deliverables

1. A command-line or local UI that accepts natural language instructions.
2. Import/export for a basic song representation (MIDI + markers/sections).
3. MUS-LF compiler for a documented sublanguage:
   - scope (sections/bars/layers)
   - goals (lift, energy, density, intimacy, tightness)
   - constraints (“keep melody”, “only change drums”)
4. A small but powerful action library:
   - insert break, duplicate section, change register, halftime/doubletime, thin/densify texture
5. Explanation and diff output.

### Why this is enough to be compelling

Most real musical sessions involve:

- structure editing
- arrangement editing
- groove feel adjustments

If GOFAI Music does those quickly, reliably, and offline—while producing diffs and undo—it becomes a genuinely useful tool rather than a gimmick.

---

## Measuring success

To keep the project honest, define success criteria that are operational:

- **Semantic reliability**: the same instruction phrased differently compiles to the same MUS-LF intent (or prompts the same clarification).
- **Constraint correctness**: “keep melody exact” is never violated.
- **Edit reversibility**: every applied edit package can be undone cleanly.
- **Workflow speed**: users can achieve common edits faster than manual DAW operations.
- **User trust**: explanations match observed changes.

If these hold, the system has real value even before adding any “creative generation.”

---

## Closing pitch

GOFAI Music is a bet on a different kind of AI product:

- not a black box that spits out content
- but a compiler that turns musical intent into controlled edits

It is compelling because it provides something cloud LLM assistants often cannot:

- offline operation and confidentiality
- stable semantics and reproducible behavior
- constraint satisfaction that professionals can rely on
- explicit diffs and explanations that fit real workflows

If this works, it becomes a new kind of creative tool: not a generator that replaces musicians, but a compiler that makes musical intent directly actionable.
