# 15: The Event-Card Music System (standalone spec)

**Status:** partial (canonical core model, some sections aspirational)  
**Canonical terms used:** Event, EventStream, Card<A,B>, Stack, Container, Clip, MusicSpec, MusicConstraint, HostAction  
**Primary code references:** `cardplay/src/types/*`, `cardplay/src/cards/*`, `cardplay/src/state/*`, `cardplay/src/ai/theory/*`  
**Analogy:** The "master rulebook" defining how game pieces (cards), tokens (events), and zones (containers) work together.  
**SSOT:** This doc is canonical for the core model, but must match code paths under `cardplay/src/`. When conflicts arise, follow `to_fix.md` + `cardplay/docs/canon/**` + `cardplay/src/**`.

> **Note:** This repo has multiple Card/Deck/Stack systems. This spec defines the canonical *core* ones. See [Card Systems](./docs/canon/card-systems.md), [Deck Systems](./docs/canon/deck-systems.md), and [Stack Systems](./docs/canon/stack-systems.md) for the full disambiguation.

---

This document defines a unified music system that combines:
- Ableton-like clips and scenes
- Renoise-style trackers
- notation and score editing
- phrase grammar and harmonic tooling (RapidComposer-style)
- Carnatic music concepts (raga, tala, gamaka, konnakol)
- algorithmic composition and live performance
- timbre-first sound design and sample manipulation

Everything runs through one consistent card model and one event model so there is a clear, inspectable path from:
- what a card contains
- how cards compose into stacks and graphs
- the exact events that result
- the final audio output

This document stands alone. It does not rely on any other spec.

---

## 0.0 Consistency conventions (cardplay2)

This is a lightly revised copy of `cardplay.md` that focuses on small but high-leverage internal consistency improvements (typing story, operational semantics, naming, and repeated core definitions) while preserving the “open world” extensibility story (users can plug in new cards/decks easily).

Conventions used throughout:
- **Event contents are called `payload`**. If you see `props` in an example, read it as a legacy alias for `payload`.
- **Time is `ticks` by default**: `start` and `duration` are integer ticks at PPQ=960 (see `cardplay/src/types/primitives.ts`) unless a section explicitly says otherwise.
- **Examples may omit bookkeeping fields** (`id`, `tags`, `meta`) when they are not the point of the example.
- **Lanes are one concept with two uses**:
  - As **attached modulation** on an event (e.g., per-note expression envelopes).
  - As **derived projections** from events (e.g., grouping `kind: "automation"` into a lane UI).
- **`EventStream<E>` is an alias** for `Stream<E>` where `E extends Event<any>`. CardScript/manifests tend to write `EventStream<NoteEvent>`; TS-like snippets may use either form.
- **`MarkerPayload` names marker/label payloads** to avoid confusion with `meta` (event provenance metadata). `MetaPayload` may appear as a legacy alias.

## Part 0) Reading guide and layout

The spec is large and detailed. It is organized in parts so you can read it in layers:

Part I: Vision and goals (why the system exists, who it serves, and what it must guarantee)
Part II: Type-theoretic foundation (how events, containers, tracks, and cards relate)
Part III: Event system and time (the atomic data model and its temporal semantics)
Part IV: Containers, tracks, and scenes (how time and structure are organized)
Part V: Cards and composition (typed morphisms, stacks, and graphs)
Part VI: Views and surfaces (tracker, piano roll, session, notation, phrase)
Part VII: Algorithmic and generative composition
Part VIII: Timbre-first sound design and analysis
Part IX: Live recording and performance
Part X: Automation and modulation
Part XI: Engine and render pipeline
Part XII: Visual system and interaction language
Part XIII: Deck and workspace
Part XIV: Example stacks and workflows
Part XV: Canonical DSL and text representation
Part XVI: Implementation map, tests, and milestones

If you are only trying to understand the core relationship between scene, event, track, and card, start with Part II and Part IV.

---

## Part I) Vision and goals

### 1.1 Goals (the three non-negotiables)

1) Extensibility at the edges:
   - New cards can be added by users (or by an LLM) by generating code against a predefined API.
   - The system must remain type-safe even when it has never seen a new card type before.

2) Works for any kind of musician:
   - beatmakers and electronic producers
   - classical and notational composers
   - Carnatic and non-Western traditions
   - algorithmic and generative composers
   - live performers and sound designers

3) Progressive disclosure of structure:
   - Beginners see a friendly, minimal surface.
   - Pros can peel back layers into trackers, automation lanes, and routing.
   - The data model stays identical across all levels.

### 1.2 Additional goals (system guarantees)

4) One core abstraction: every time-based action is an Event.
5) One composition system: cards are typed functions on streams.
6) One timeline: patterns, scenes, clips, scores, and takes are all EventContainers.
7) One rendering story: every sound is explained by a lineage graph.
8) One user model: no split between "toy mode" and "pro mode," only different views.

### 1.3 User archetypes (all first-class)

- The Beatmaker: pads, clips, and immediate audio feedback.
- The Tracker: row/column editing, microtiming, and compact control.
- The Notator: engraved score, dynamics, and articulation.
- The Algorithmic Composer: phrase rules, grammar, and transformations.
- The Raga/Tala Composer: cyclic time, ornaments, and syllabic rhythm.
- The Sound Sculptor: spectral/timbre control and analysis-driven modulation.
- The Live Performer: recording, launching, and capturing takes on the fly.

Every archetype must map to the same Event model.

### 1.4 Non-goals (what this spec does not assume)

- A single "correct" UI layout. The model must survive multiple skins.
- A fixed hardware or controller mapping. Mappings are user-defined.
- A single musical tradition or pitch system. Multiple coexist.

---

## Part II) Type-theoretic foundation

This part is the formal backbone of the system. It describes how scenes, tracks, events, and cards relate without mixing UI or engine detail.

### 2.0 Parametric polymorphism as the unifying principle

The core design goal is **minimal type proliferation through maximal parametric polymorphism**. Instead of creating many specialized types (MelodyRules, HarmonyRules, NoteEvent, ChordEvent, etc.), we use a small number of generic types that compose through type parameters.

This section defines the **unified parametric type lattice** that underpins all other type definitions.

#### 2.0.1 The parametric type hierarchy (six core generics)

All types in the system derive from six parametric foundations:

```ts
type Tick = number;        // integer ticks at global PPQ
type TickDuration = Tick;
type EventId = string;
type ContainerId = string;
type EventKind = string;   // open set (registered by schemas)

type EventMeta = {
  label?: string;
  color?: string;
  sourceCardId?: string;
  sourceContainerId?: string;
  lineage?: string[];
  author?: string;         // user or system
  payloadSchemaId?: string;
};

// Legacy alias used in some sections
type Meta<P = any> = EventMeta;

// 1. Event<P> - A temporal interval with payload type P
type Event<P> = {
  id: EventId;
  kind: EventKind;
  start: Tick;
  duration: TickDuration;  // >= 0 (0 means instantaneous)
  payload: P;
  triggers?: Trigger<P>[];
  // Optional per-event attached modulation (e.g., per-note expression)
  automation?: Lane<Control>[];
  tags?: Record<string, string>;
  meta?: EventMeta;
};

// 2. Stream<E> - An ordered sequence of events (replaces EventStream, NoteStream, GestureStream, etc.)
type Stream<E> = E[];

// Convenience alias used throughout (especially in manifests/DSL)
type EventStream<E extends Event<any> = Event<any>> = Stream<E>;

// 3. Container<K, E> - A named context owning a stream (replaces Pattern, Scene, Clip, Score, Take, Phrase)
type Container<K extends string, E extends Event<any> = Event<any>> = {
  id: ContainerId;
  kind: K;
  events: Stream<E>;
  meta?: ContainerMeta;
  refs?: Ref<Container<any, any>>[];
};

// 4. Rules<E, C> - Constraints over events with context C (replaces MelodyRules, HarmonyRules, RagaConstraint, etc.)
type Rules<E, C = void> = {
  validate: (event: E, context: C) => boolean;
  transform?: (event: E, context: C) => E;
  suggest?: (context: C) => E[];
};

// 5. Lane<T> - A projection of values over time (replaces AutomationLane, ModulationLane, ExpressionLane, etc.)
type Lane<T> = {
  target: Target<T>;
  points: Point<T>[];
  interpolation?: Interpolation;
};

// 6. Voice<P extends Pitch> - A sounding entity with pitch system P (parametric over tuning/pitch representation)
type Voice<P extends Pitch> = {
  pitch: P;
  velocity: number;
  channel?: number;
  sampleId?: string;
  articulation?: Articulation;
  envelope?: Envelope;
};
```

#### 2.0.2 Type parameter vocabulary

The system uses consistent type parameter names:

| Parameter | Meaning | Examples |
|-----------|---------|----------|
| `P` | Payload / Pitch | `NotePayload`, `ChordPayload`, `MIDIPitch`, `MicrotonalPitch` |
| `E` | Event type | `Event<NotePayload>`, `Event<GesturePayload>` |
| `K` | Container kind | `"pattern"`, `"scene"`, `"clip"`, `"score"` |
| `C` | Context / Constraint | `HarmonicContext`, `RagaContext`, `TalaContext` |
| `T` | Target type | `number`, `Control`, `AudioBuffer` |
| `V` | Voice type | `Voice<MIDIPitch>`, `Voice<JustPitch>` |
| `A`, `B` | Input/Output | Used in morphisms: `Card<A, B>` |

#### 2.0.3 Type reduction through generics

Instead of proliferating types, we compose:

| Old (proliferated) | New (parametric) |
|--------------------|------------------|
| `NoteEvent` | `Event<NotePayload>` |
| `ChordEvent` | `Event<ChordPayload>` |
| `GestureEvent` | `Event<GesturePayload>` |
| `AutomationEvent` | `Event<AutomationPayload>` |
| `MelodyRules` | `Rules<Event<NotePayload>, ScaleContext>` |
| `HarmonyRules` | `Rules<Event<ChordPayload>, ProgressionContext>` |
| `RagaConstraint` | `Rules<Event<NotePayload>, RagaContext>` |
| `VoiceLeadingRules` | `Rules<Stream<Event<NotePayload>>, VoicingContext>` |
| `NoteStream` | `Stream<Event<NotePayload>>` |
| `GestureStream` | `Stream<Event<GesturePayload>>` |
| `Pattern` | `Container<"pattern", Event<any>>` |
| `Scene` | `Container<"scene", Event<any>>` |
| `AutomationLane` | `Lane<number>` |
| `ModulationLane` | `Lane<Control>` |
| `ExpressionLane` | `Lane<Expression>` |

#### 2.0.4 Payload types as the extensibility mechanism

Instead of creating new event types, users create new payload types:

```ts
// Core payloads (built-in)
type NotePayload<P extends Pitch = MIDIPitch> = Voice<P>;
type ChordPayload = { root: Pitch; quality: ChordQuality; voicing?: Voicing };
type GesturePayload = { shape: GestureShape; intensity: number };
type AutomationPayload = { target: string; value: number };
type MarkerPayload = { label: string; color?: string };
type MetaPayload = MarkerPayload; // legacy alias

// User-defined payloads (extensible)
type KonnakolPayload = { syllable: string; stress: number; tala: string };
type GamakaPayload = { ornament: GamakaType; depth: number; curve: Curve };
type SpectralPayload = { bins: number[]; centroid: number };
```

#### 2.0.5 Voice parameterization over pitch systems

The Voice type is parametric over pitch representation:

```ts
// Base pitch constraint
type Pitch = { toMIDI(): number; toCents(): number };

// Specific pitch systems
type MIDIPitch = number & Pitch;
type MicrotonalPitch = { cents: number; reference: number } & Pitch;
type JustPitch = { ratio: [number, number]; reference: Pitch } & Pitch;
type SwaraPitch = { swara: Swara; shruti: number; raga?: Raga } & Pitch;

// Voice is parametric
type Voice<P extends Pitch> = {
  pitch: P;
  velocity: number;
  channel?: number;
  sampleId?: string;
  articulation?: Articulation;
  envelope?: Envelope;
};

// NoteEvent as Event with Voice payload
type NoteEvent<P extends Pitch = MIDIPitch> = Event<Voice<P>> & { kind: "note" };
```

#### 2.0.6 Rules as parametric constraints

All constraint systems unify under `Rules<E, C>`:

```ts
// Melody rules: constraints on note sequences
type MelodyRules<P extends Pitch> = Rules<
  NoteEvent<P>,
  { scale: Scale<P>; range: [P, P]; density: number }
>;

// Harmony rules: constraints on chord sequences
type HarmonyRules = Rules<
  ChordEvent,
  { key: Key; mode: Mode; tension: number }
>;

// Raga rules: constraints specific to Carnatic music
type RagaRules = Rules<
  NoteEvent<SwaraPitch>,
  { raga: Raga; tala: Tala; gamaka: GamakaPolicy }
>;

// Voice leading rules: constraints on multi-voice motion
type VoiceLeadingRules<P extends Pitch> = Rules<
  Stream<NoteEvent<P>>,
  { maxLeap: number; parallelism: ParallelPolicy }
>;

// Rhythm rules: constraints on timing patterns
type RhythmRules = Rules<
  Event<any>,
  { grid: Grid; swing: number; density: number }
>;
```

#### 2.0.7 Context types as parametric composition

Contexts compose through type parameters rather than inheritance:

```ts
// Base context interface
type Context<T, M = {}> = {
  data: T;
  meta: M;
  time: TimeContext;
};

// Specific contexts are instances
type HarmonicContext = Context<
  { scale: Scale; chords: Stream<Event<ChordPayload>> },
  { key: Key; mode: Mode }
>;

type RagaContext = Context<
  { raga: Raga; tala: Tala; eduppu: number },
  { kalai: number; karvai: number }
>;

type EngineContext = Context<
  { sampleRate: number; bufferSize: number },
  { now: number; bpm: number }
>;

// Contexts can compose
type ComposedContext<A, B> = Context<A["data"] & B["data"], A["meta"] & B["meta"]>;
```

#### 2.0.8 The functor pattern for stream transformations

Streams are functorial, enabling map/filter/flatMap operations:

```ts
// Stream is a functor
function mapStream<A, B>(s: Stream<A>, f: (a: A) => B): Stream<B>;
function filterStream<A>(s: Stream<A>, p: (a: A) => boolean): Stream<A>;
function flatMapStream<A, B>(s: Stream<A>, f: (a: A) => Stream<B>): Stream<B>;

// Transformers are natural transformations
type StreamTransform<A, B> = (s: Stream<A>) => Stream<B>;
```

#### 2.0.9 Type aliases for readability

For convenience, we provide type aliases that expand the parametric forms:

```ts
// Convenient aliases
type NoteEvent = Event<Voice<MIDIPitch>> & { kind: "note" };
type MicrotonalNoteEvent<P extends Pitch> = Event<Voice<P>> & { kind: "note" };
type ChordEvent = Event<ChordPayload> & { kind: "chord" };
type GestureEvent = Event<GesturePayload> & { kind: "gesture" };
type AutomationEvent = Event<AutomationPayload> & { kind: "automation" };
type MarkerEvent = Event<MarkerPayload> & { kind: "marker" };

type Pattern = Container<"pattern">;
type Scene = Container<"scene">;
type Clip = Container<"clip">;
type Score = Container<"score">;
type Take = Container<"take">;
type Phrase = Container<"phrase">;

type AutomationLane = Lane<number>;
type ModulationLane = Lane<Control>;
type ExpressionLane = Lane<Expression>;

// These aliases are sugar; the underlying parametric types are the source of truth
```

#### 2.0.10 Higher-kinded types for advanced composition

For maximum expressiveness, the system supports higher-kinded type patterns:

```ts
// F is a type constructor (higher-kinded)
type Functor<F> = {
  map: <A, B>(fa: F<A>, f: (a: A) => B) => F<B>;
};

// Stream implements Functor
const StreamFunctor: Functor<Stream> = {
  map: (stream, f) => stream.map(e => ({ ...e, payload: f(e.payload) }))
};

// Rules can be composed via Applicative
type Applicative<F> = Functor<F> & {
  pure: <A>(a: A) => F<A>;
  ap: <A, B>(ff: F<(a: A) => B>, fa: F<A>) => F<B>;
};

// Combined rules: if both R1 and R2 pass, the event is valid
function combineRules<E, C>(r1: Rules<E, C>, r2: Rules<E, C>): Rules<E, C> {
  return {
    validate: (e, c) => r1.validate(e, c) && r2.validate(e, c),
    transform: (e, c) => r2.transform?.(r1.transform?.(e, c) ?? e, c) ?? e
  };
}
```

### 2.1 The core objects

We treat the system as a typed, compositional language:

- Event<P>: a typed value with temporal extent and payload P.
- Stream<E>: an ordered list of Events (replaces all *Stream types).
- Container<K, E>: a named context that owns a Stream.
- Track<K, A, B>: a bidirectional lens into a container, projecting A to B.
- Card<A, B>: a typed morphism between input and output types.
- Stack: a composition of cards, serial or parallel.
- Rules<E, C>: constraints over events with context (replaces all *Rules types).
- Lane<T>: a projection of values over time (replaces all *Lane types).
- Voice<P>: a sounding entity parametric over pitch system.

The types are structural, not nominal. This is crucial for extensibility.

### 2.2 Relationship summary (formal, minimal)

```
Event<P>         : A value with time and payload type P.
Stream<E>        : [E] where E extends Event<any>
Container<K,E>   : { kind: K, events: Stream<E>, meta... }
Track<K,A,B>     : Container<K,A> <-> Stream<B>
Card<A,B>        : f: A -> B (typed morphism)
Stack            : composition of cards, f ∘ g or f ⊗ g
Rules<E,C>       : constraints on E given context C
Lane<T>          : temporal projection of values of type T
Voice<P>         : sounding entity with pitch system P
```

Interpretation:
- A Scene is a `Container<"scene", Event<any>>`, not a track and not a card.
- A Track is a view into a container, not a separate store of events.
- A RapidComposer card is a `Card<Context<HarmonicSpec>, Stream<Event<Voice<P>>>>`.
- Rules are always `Rules<SomeEventType, SomeContext>`, never specialized types like "MelodyRules".
- Lanes are always `Lane<SomeValueType>`, never specialized types like "AutomationLane".

### 2.3 Why tracks are lenses (not containers)

A Track is defined as a read/write pair over the parametric Container type:

```ts
type Track<K extends string, E, V> = {
  read: (container: Container<K, E>) => Stream<V>;
  write: (container: Container<K, E>, edits: Stream<V>) => Container<K, E>;
};

// Example instantiations:
type NoteTrack = Track<"pattern", Event<any>, Event<Voice<MIDIPitch>>>;
type AutomationTrack = Track<"pattern", Event<any>, Event<AutomationPayload>>;
type ChordTrack = Track<"score", Event<any>, Event<ChordPayload>>;
```

This makes the tracker, piano roll, and notation all consistent: they are different lenses on the same container.

### 2.4 Open unions and structural typing (extensibility)

Event kinds, port types, and protocols are open. A new card declares what it needs; the system checks if those structural requirements can be met.

This is the path to infinite extensibility:
- New event kinds are schemas, not enum additions.
- New port types are registered with adapters and protocols.
- Existing cards remain compatible as long as required fields exist.

### 2.5 The compact "type story"

Events are values, EventStreams are sequences, EventContainers are named contexts, Tracks are lenses, Cards are morphisms, Stacks are compositions, and Graphs are the global wiring of compositions.

### 2.6 Structural types and subtyping (open world)

The system uses structural typing for event payloads and port values. This is essential for extensibility:

- A card that requires fields { pitch, velocity } accepts any event payload that has those fields, even if it contains extras.
- A card that emits { pitch, velocity, articulation } still typechecks against consumers that only require pitch and velocity.

This is a form of width subtyping:

```
{ pitch: number, velocity: number, articulation: string } <: { pitch: number, velocity: number }
```

The rule is: if you have more fields than required, you are still compatible. This allows new event kinds to be introduced without breaking old cards.

### 2.7 Event payload kinds as open unions

Event kinds are not enumerated at compile time. Instead, they are registered with schemas:

```ts
registerEventKind({
  kind: "note",
  schema: { pitch: "number", velocity: "number", channel: "number?" },
  renderHints: { icon: "note", color: "#ffd16a" }
});
```

Key rules:
- Unknown kinds are still valid Event payloads, they are just opaque to views that do not know them.
- Known kinds can be edited in views that implement that schema.
- Any card can claim compatibility with a schema by declaring required fields.

### 2.8 Port type unification (open types)

Port types are also open and use a unification rule rather than a fixed enum.

At the core there are a few canonical types:
- AudioBuffer
- EventStream<A>
- Control (scalar or low-rate signal)
- Analysis (feature stream)

Users can add new port types:

```ts
registerPortType({
  type: "GestureStream",
  compatibleWith: ["EventStream"],
  adapters: [
    { to: "EventStream", card: "GestureToEvents" }
  ]
});
```

Unification rule (sketch):
- If A == B, types unify.
- If A can be adapted to B (adapter registry), types unify with an inserted adapter.
- If A is structurally compatible with B (e.g. EventStream of payloads with required fields), they unify.

### 2.9 Protocols (typeclasses for compatibility)

Some cards do not require a concrete type, only a capability. We express this as **protocols** (typeclasses), which are parametric over their content types. Protocols enable open extensibility: any new type that implements the protocol automatically works with existing cards.

#### 2.9.1 Core protocols

```ts
// Schedulable: can be converted to a timed event stream
protocol Schedulable<E extends Event<any>> {
  toEvents(x: unknown): Stream<E>;
  schedule(x: unknown, ctx: Context<TimeSpec>): Stream<E>;
}

// Renderable: can produce audio output
protocol Renderable<E extends Event<any>> {
  toAudio(events: Stream<E>, ctx: Context<EngineSpec>): AudioBuffer;
}

// Automatable: can receive automation/modulation
protocol Automatable<T> {
  targets(): Target<T>[];
  applyAutomation(lane: Lane<T>, time: number): T;
  applyModulation(mod: Modulation<T>, time: number): T;
}

// Notatable: can be rendered to notation
protocol Notatable<P extends Pitch> {
  toNotation(event: Event<Voice<P>>): NotationSymbol[];
  fromNotation(symbols: NotationSymbol[]): Event<Voice<P>>;
}

// Constrainable: can have rules applied
protocol Constrainable<E, C> {
  applyRules(events: Stream<E>, rules: Rules<E, C>, ctx: C): Stream<E>;
  validateRules(events: Stream<E>, rules: Rules<E, C>, ctx: C): ValidationResult<E>[];
}

// Transformable: can be transformed by event algebra
protocol Transformable<E extends Event<any>> {
  split(event: E, at: number): [E, E];
  merge(events: Stream<E>): Stream<E>;
  stretch(event: E, factor: number): E;
  shift(event: E, delta: number): E;
  quantize(event: E, grid: Grid): E;
}

// Serializable: can be serialized to DSL
protocol Serializable<T> {
  toDSL(x: T): string;
  fromDSL(dsl: string): T;
}

// Diffable: can compute and apply diffs (for meta-cards and contracts)
protocol Diffable<T> {
  diff(before: T, after: T): Diff<T>;
  patch(x: T, diff: Diff<T>): T;
  preview(x: T, diff: Diff<T>): T;
}
```

#### 2.9.2 Protocol composition

Protocols can be composed using intersection types:

```ts
// A type that is both Schedulable and Automatable
type InstrumentInput<P extends Pitch> = 
  Schedulable<Event<Voice<P>>> & Automatable<number>;

// A type that is Constrainable with multiple rule types
type HarmonicStream<P extends Pitch> = 
  Constrainable<Event<Voice<P>>, ScaleContext> & 
  Constrainable<Event<Voice<P>>, RagaContext>;
```

#### 2.9.3 Protocol implementation for parametric types

The core parametric types implement relevant protocols:

```ts
// Event<P> implements Transformable, Serializable
impl<P> Transformable<Event<P>> for Event<P> { ... }
impl<P> Serializable<Event<P>> for Event<P> { ... }

// Stream<E> implements Schedulable when E extends Event
impl<E extends Event<any>> Schedulable<E> for Stream<E> { ... }

// Container<K, E> implements Diffable for meta-card support
impl<K, E> Diffable<Container<K, E>> for Container<K, E> { ... }

// Lane<T> implements Automatable
impl<T> Automatable<T> for Lane<T> { ... }

// Voice<P> implements Notatable when P extends Pitch
impl<P extends Pitch> Notatable<P> for Voice<P> { ... }
```

A card can declare:

```
RenderInstrument<P extends Pitch> : Schedulable<Event<Voice<P>>> -> AudioBuffer
```

If a user adds a new type and provides a `toEvents` adapter, it automatically becomes Schedulable and can plug into RenderInstrument.

#### 2.9.4 Protocols for meta-cards and behavior contracts

Meta-cards and behavior contracts use specific protocols:

```ts
// Patchable: can emit and receive structural patches
protocol Patchable<S> {
  emitPatch(before: S, after: S): Patch<S>;
  applyPatch(state: S, patch: Patch<S>): S;
  validatePatch(state: S, patch: Patch<S>): ValidationResult<S>;
  previewPatch(state: S, patch: Patch<S>): S;
}

// Contractable: can declare and verify behavior contracts
protocol Contractable {
  declareContract(): BehaviorContract;
  verifyContract(actions: Action[]): ContractViolation[];
}

// Auditable: can log and replay actions
protocol Auditable<A> {
  log(action: A): void;
  replay(actions: A[]): void;
  revert(action: A): void;
}
```

### 2.10 Type inference for stacks (how the system decides)

Given a stack of cards, the system infers types left to right:

1) Start with declared input types.
2) For each card, unify the previous output with its input.
3) If no direct unification exists, search for adapters.
4) If multiple adapters exist, choose the lowest-cost path or ask the user.

The cost model is visible in the UI:
- direct match = 0
- structural match = 1
- adapter insertion = 2

The user can override unification by explicitly inserting adapters.

### 2.11 Effects and determinism (type-level annotations)

Cards can be annotated with effect tags that influence how they are composed:

- `pure`: deterministic, no internal state
- `stateful`: has internal memory
- `stochastic`: uses random sources
- `realtime`: depends on wall-clock input

These tags allow:
- caching of pure cards
- warnings when non-determinism is introduced
- reproducibility metadata for rendering

Example:

```ts
card "ChaosSprite" {
  signature: { inputs: ["Stream<Event<any>>"], outputs: ["Stream<Event<any>>"] }
  effects: ["stochastic"]
  protocols: ["Schedulable", "Transformable"]
}
```

### 2.12 Tracks vs channels vs buses (terminology)

To avoid confusion:
- Track is a view/lens into a container.
- Channel is a mixer routing concept (audio level, pan, sends).
- Bus is an audio summing path.

These are different. Tracks do not sum audio. Tracks do not own time. Tracks only project and edit Events.

### 2.13 LLM-friendly card API (safe extensibility)

The system exposes a stable, documented API so an LLM can generate new cards safely:

- A card manifest defines signature, params, schemas, UI hints, and adapters.
- The runtime validates the manifest before loading.
- Generated cards are sandboxed and cannot access global state directly.

Example manifest:

```ts
card "AutoKonnakol" {
  signature: { inputs: ["Control"], outputs: ["EventStream<NoteEvent>"] }
  params: { tala: "string", density: "number", style: "string" }
  eventKinds: ["note", "syllable"]
  protocols: ["Schedulable"]
  ui: { editor: "grid", theme: "rhythm" }
}
```

### 2.14 User-defined schemas and editors

When a new event kind is registered, the system can auto-generate a basic editor:

- Numeric fields -> sliders or step inputs
- Enum fields -> dropdowns
- Nested objects -> collapsible groups

Users can override with custom UI components, but the default editor ensures any new kind is editable immediately.

### 2.15 Type story for scene, track, and rapidcomposer

In the formal model using parametric types:

- Scene: `Container<"scene", Event<any>>` (alias for the parametric container)
- Track: `Track<K, E, V>` (bidirectional lens projecting E to V)
- RapidComposer card: `Card<Context<HarmonicSpec>, Stream<Event<Voice<P>>>>` or `Card<Stream<Event<Voice<P>>>, Stream<Event<Voice<P>>>>`

This makes their relationship unambiguous:
- Scene owns events (and references).
- Track edits events, never owns them.
- RapidComposer card produces or transforms events; it does not own a timeline.

All three use the same parametric foundations: `Container<K,E>`, `Stream<E>`, `Event<P>`, `Voice<P>`.

---

## Part III) Event system and time

---

## 3.1 Events

### 3.1.1 Event definition (parametric)
An Event is a continuous fixed interval with a parametric payload type. All specialized event types are instantiations of `Event<P>`.

```ts
type Tick = number;        // ticks at global PPQ
type EventId = string;
type EventKind = string;   // open set; schemas register known kinds

// The core parametric Event type
type Event<P> = {
  id: EventId;
  kind: EventKind;         // "note", "automation", "meter", "tempo", "gesture", "marker", ...
  start: Tick;
  duration: Tick;          // >= 0 (0 means instantaneous)
  payload: P;
  triggers?: Trigger<P>[];
  // Optional per-event attached modulation (e.g., per-note expression)
  automation?: Lane<Control>[];
  tags?: Record<string, string>;
  meta?: EventMeta;
};

// Voice type parametric over pitch system (canonical payload for kind == "note")
type Voice<P extends Pitch> = {
  pitch: P;
  velocity: number;
  channel?: number;
  sampleId?: string;
  articulation?: Articulation;
  envelope?: Envelope;
};

// NoteEvent is just Event<Voice<P>> with a discriminant kind
type NoteEvent<P extends Pitch = MIDIPitch> = Event<Voice<P>> & { kind: "note" };

// Other event types follow the same pattern
type ChordEvent = Event<ChordPayload> & { kind: "chord" };
type GestureEvent = Event<GesturePayload> & { kind: "gesture" };
type AutomationEvent = Event<AutomationPayload> & { kind: "automation" };
type TempoEvent = Event<TempoPayload> & { kind: "tempo" };
type MeterEvent = Event<MeterPayload> & { kind: "meter" };
type MarkerEvent = Event<MarkerPayload> & { kind: "marker" };

// Payload types (these are what users extend)
type ChordPayload = { root: Pitch; quality: ChordQuality; voicing?: Voicing };
type GesturePayload = { shape: GestureShape; intensity: number };
type AutomationPayload = { target: string; value: number };
type TempoPayload = { bpm: number };
type MeterPayload = { numerator: number; denominator: number };
type MarkerPayload = { label: string; color?: string };
type MetaPayload = MarkerPayload; // legacy alias

// Provenance/inspection metadata is *not* parametric over payload.
type EventMeta = {
  label?: string;
  color?: string;
  sourceCardId?: string;
  sourceContainerId?: string;
  lineage?: string[];
  author?: string;         // user or system
  payloadSchemaId?: string;
};

// Legacy alias used in some sections
type Meta<P = any> = EventMeta;
```

### 3.1.2 Trigger model (parametric, extensible)
Triggers are parametric over the payload they can influence. They do not have to be note-specific.

Examples:
- "pad" trigger for live pads
- "gate" trigger for step sequencers
- "scene" trigger when a scene launches
- "threshold" trigger for audio analysis (e.g. transient detection)

```ts
// Trigger is parametric over payload type
type Trigger<P = any> = {
  kind: string;           // "pad", "gate", "scene", "threshold", etc
  at: "start" | "end" | { offset: number };
  payload?: Partial<P>;   // can override parts of the event payload
  conditions?: TriggerCondition;
};

type TriggerCondition = {
  probability?: number;
  every?: number;
  until?: number;
};
```

### 3.1.3 Automation and modulation (parametric, extensible)
Automation uses the parametric `Lane<T>` type. Modulation is automation with a source signal.

```ts
// Target is parametric over the value type
type Target<T> = {
  kind: string;           // "track.volume", "card.knob", "transport.bpm", etc
  ref?: string;           // id of card/track/etc
  path?: string;          // property path
  range?: [T, T];         // valid range for this target
};

// Point is parametric
type Point<T> = {
  time: number;           // ticks
  value: T;
  curve?: Interpolation;
};

type Interpolation = "step" | "linear" | "exp" | "bezier";

// Lane is the core parametric type (replaces AutomationLane, ModulationLane, ExpressionLane)
type Lane<T> = {
  target: Target<T>;
  points: Point<T>[];
  shape?: string;         // optional named shaping
};

// Convenient aliases
type AutomationLane = Lane<number>;
type ModulationLane = Lane<Control>;
type ExpressionLane = Lane<Expression>;
type PitchBendLane = Lane<Cents>;

// Modulation adds a source to a Lane
type Modulation<T> = Lane<T> & {
  source: ModulationSource;
  depth: number;
  mode: "add" | "multiply" | "override";
};

type ModulationSource = {
  kind: "lfo" | "envelope" | "analysis" | "control";
  ref?: string;
  params?: Record<string, number>;
};
```

The key design: any property is an automation target. The registry can be extended by any card or plugin. The Lane type is parametric, so the same machinery works for numbers, control signals, expressions, or any custom value type.

### 3.1.4 Event invariants and normalization

Events are not arbitrary blobs. They obey invariants so the system is deterministic and editable across views:

- start and duration are integers in ticks (duration >= 0).
- duration == 0 means instantaneous (e.g., tempo change, marker).
- events are stored in non-decreasing order by start time.
- events have stable ids across edits; the id persists even if the event moves.
- NoteEvents always contain pitch and velocity, even if the UI hides them.

Normalization rules:
- If duration is negative after editing, it is clamped to 0 and marked as invalid until corrected.
- If two events have identical id and different payloads, the later edit wins and an audit entry is created.
- If a view edits a derived representation (e.g., tracker rows), it reconciles into the event list and re-normalizes.

### 3.1.5 Event identity, lineage, and provenance

Each event has metadata that can trace it back to its origin:

```ts
type EventMeta = {
  label?: string;
  color?: string;
  sourceCardId?: string;
  sourceContainerId?: string;
  lineage?: string[]; // e.g., ["phrase:arp-01", "humanize:v2", "render:mono-synth"]
  author?: string;    // user or system
  payloadSchemaId?: string;
};
```

Use cases:
- A phrase generator emits events with lineage tags so the user can "freeze" or "unlink" later.
- A performance take can show which pads created which notes.
- A render trace can explain what card caused an audio frame.

### 3.1.6 Event algebra (merge, split, warp)

Events can be transformed using composable operations. These operations are used in both UI editing and algorithmic cards:

- split(event, t): splits an event into two events at time t.
- merge(events): merges adjacent events of the same kind and compatible payloads.
- stretch(event, factor): scales duration and offset relative to a pivot.
- shift(event, delta): offsets start by delta ticks.
- quantize(event, grid): snaps start and duration to a grid without changing payload.

These are defined as pure transformations on EventStream.

### 3.1.7 Event overlap and conflict resolution

Overlaps are legal. The system resolves conflicts based on the target and kind:

- NoteEvents in the same channel can overlap; rendering depends on instrument polyphony.
- Automation events targeting the same property are merged into a single lane; later events override earlier events when both define values at the same time.
- Meta events (markers) simply coexist.

Conflict rules are explicit and discoverable:
- Each Event kind defines a "merge policy" (e.g., sum, last-write-wins, max, or union).
- A card can expose a conflict override policy (e.g., "ignore overlaps").

### 3.1.8 Event kinds and semantics (core set)

The system treats some event kinds as conventional, but not fixed:

- note: pitched note events with duration, velocity, articulation.
- chord: harmonic blocks that can be expanded into note events.
- automation: parameter changes over time (a lane).
- tempo: instantaneous BPM changes.
- meter: instantaneous time signature changes.
- marker: labeled points on the timeline.
- gesture: a higher-level movement that can be rendered into notes or automation.
- analysis: analysis results such as onset, pitch, spectral centroid.

Each kind defines:
- A minimal required schema.
- A preferred UI representation.
- A merge policy.
- A default renderer (if applicable).

### 3.1.9 Trigger evaluation and conditions

Triggers can fire at different offsets and under conditions:

```ts
type Trigger = {
  kind: string;
  at: "start" | "end" | { offset: number };
  conditions?: { probability?: number; every?: number; until?: number };
  payload?: Record<string, unknown>;
};
```

Examples:
- Every 2nd occurrence (every: 2) for pattern-based variation.
- Probability (probability: 0.5) for stochastic stutters.
- Until (until: tick) for conditional gates in performance.

Trigger evaluation occurs after event selection and before rendering. A trigger is not a separate Event; it is a behavior attached to the Event.

### 3.1.10 Automation curves and interpolation

Automation lanes interpolate between points:

- step: value jumps at the point.
- linear: straight line between points.
- exp: exponential curve (useful for volume).
- bezier: custom curves (stored as control points).

Evaluation rule:
- The automation value at time t is computed by finding the nearest points before/after t and applying the curve rule.
- If no points exist, the parameter remains at its default value.

### 3.1.11 Modulation sources and routing

Modulation uses the parametric `Modulation<T>` type which extends `Lane<T>` with a source signal:

- LFOs: periodic signals.
- Envelopes: triggered by events.
- Analysis signals: derived from audio (e.g., envelope followers).

```ts
// Modulation is Lane<T> with source (defined in 3.1.3)
// Example usage:
const filterMod: Modulation<number> = {
  target: { kind: "card.knob", ref: "synth-1", path: "cutoff" },
  points: [],
  source: { kind: "lfo", params: { rate: 2, shape: "sine" } },
  depth: 0.5,
  mode: "add"
};
```

The modulation output is combined with automation according to the merge policy:
- add, multiply, or override.

### 3.1.12 Event ordering and deterministic scheduling

Determinism requires a stable event order:
- Primary key: start time (ascending).
- Secondary key: kind priority (e.g., tempo before note).
- Tertiary key: stable id sort (lexicographic).

This ensures that when multiple events occur at the same tick, their effects are applied in a predictable order.

### 3.1.13 Event serialization and compression

Events are stored in a durable, text-friendly format:
- Optional delta encoding for start times.
- Schema-aware compression (e.g., repeating values are omitted).
- Lossless round-tripping between DSL and internal state.

This supports LLM-driven editing and version control without ambiguity.

---

## 3.2 Time, Meter, Cycles

### 3.2.1 Unified timebase
Everything resolves to ticks with a global PPQ. UI views can render in bars/steps/frames, but the core engine only cares about tick time.

### 3.2.2 Tempo and meter are Events
Tempo and meter changes are Events, not global settings. This allows:
- polymetric compositions
- Carnatic tala cycles
- modulation-based tempo bends

```ts
// examples
{ kind: "tempo", start: 0, duration: 0, payload: { bpm: 124 } }
{ kind: "meter", start: 0, duration: 0, payload: { numerator: 7, denominator: 8 } }
{ kind: "tala", start: 0, duration: 0, payload: { tala: "Adi", cycle: [4,4,4,4] } }
```

### 3.2.3 Cycles and grids
Patterns can define their own grid interpretation (rows, beats, or tala counts). The grid is a view-level mapping to ticks.

### 3.2.4 Time maps and tempo curves

Tempo events define a time map: a function from ticks to seconds.

- With a constant tempo, the mapping is linear.
- With tempo changes, it becomes piecewise linear or piecewise exponential.

The engine always uses the time map for scheduling so that tempo automation affects playback and rendering identically.

### 3.2.5 Swing and microtiming

Swing is a systematic displacement of alternating grid positions. It is modeled as a time-warp on ticks:

- Even grid positions remain fixed.
- Odd positions are delayed by a percentage of the grid step.

Microtiming is more general: per-event offsets that are not aligned to the grid. These are stored as explicit start offsets in ticks, not as UI-only adjustments.

### 3.2.6 Polymeter and polytempo

The system supports:
- Polymeter: multiple grids referencing the same tick timeline with different bar lengths.
- Polytempo: multiple tempo lanes associated with different containers, resolved into a master time map.

Resolution strategy:
- Each container defines its local tempo events.
- A master sync rule maps container time to global time for rendering.
- Views can show local bar counts even when the global time map is different.

### 3.2.7 Tala and non-Western cycles

Carnatic tala is modeled as an event-defined cycle:

```ts
{ kind: "tala", start: 0, duration: 0, payload: {
  tala: "Adi",
  cycle: [4,4,4,4],
  eduppu: 0,
  kalai: 1
}}
```

- cycle defines beat groupings.
- eduppu defines offset from the cycle start.
- kalai defines slow/fast subdivision.

The notation and tracker views map cycle counts into tick grid positions using these parameters.

### 3.2.8 Time signature conflicts and overlays

When multiple meter events overlap:
- The system chooses the most local meter for a view (container-first).
- A view can overlay meter markers from other containers for reference.

This allows, for example, a 7/8 phrase inside a 4/4 scene without losing either representation.

### 3.2.9 Quantization and snap rules

Quantization is a view-level operation that edits Event start and duration. It is not a separate data model.

Quantization rules can be:
- absolute (snap to grid)
- relative (move toward grid by percentage)
- conditional (only if within threshold)

The same operation is available in tracker, piano roll, and notation, each with a different grid mapping.

### 3.2.10 Time scaling and warping

Time scaling applies a factor to a container or to a selection:

- stretch: change duration and start offsets relative to a pivot.
- compress: inverse of stretch.
- warp: non-linear time mapping, defined as a curve of tick -> tick.

Warping is represented as an event transform card, not a hidden UI-only feature.

### 3.2.11 Audio frame conversion

The renderer converts ticks to audio frames:

```
seconds = ticks / (PPQ * bpm / 60)
frames = seconds * sampleRate
```

Tempo curves make this piecewise. The engine keeps a time map to avoid accumulating floating point drift.

### 3.2.12 External clock and sync

External clocks (MIDI, OSC, Ableton Link) are treated as time map inputs:

- External clock updates the tempo events or overrides the master map.
- The system can run in "chase" mode (follow external) or "lead" mode (broadcast).

All scheduling still happens in ticks; only the tick-to-time conversion changes.

---

## Part IV) Containers, tracks, scenes

---

## 4.1 Event Containers: Pattern, Scene, Clip, Score, Take

The system does not treat these as separate time systems. They are all instantiations of `Container<K, E>` with a common API.

```ts
// Container kinds as a union (open, can be extended)
type ContainerKind = "pattern" | "scene" | "clip" | "score" | "phrase" | "take" | string;

// The parametric Container type (replaces all specialized container types)
type Container<K extends string, E = Event<any>> = {
  id: string;
  kind: K;
  name: string;
  events: Stream<E>;       // the core truth (Stream<E> = E[])
  meta?: ContainerMeta;
  refs?: Ref<Container<any, any>>[];  // references to other containers
  source?: string;         // e.g. card id or external import
};

// Convenient aliases (these are just instantiations of Container<K, E>)
type Pattern = Container<"pattern">;
type Scene = Container<"scene">;
type Clip = Container<"clip">;
type Score = Container<"score">;
type Phrase = Container<"phrase">;
type Take = Container<"take">;

// ContainerMeta is shared across all container kinds
type ContainerMeta = {
  lengthInTicks?: number;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
  timeSignature?: TimeSignature;
  tempoMode?: "inherit" | "override";
  tags?: string[];
  version?: string;
};

// References use a parametric Ref type
type Ref<C extends Container<any, any>> = {
  containerId: string;
  offset: number;
  length?: number;
  scale?: number;
  gain?: number;
  transpose?: number;
  mute?: boolean;
};
```

### 4.1.1 Pattern
A Pattern is a compact, grid-aware container. The tracker UI is a Pattern view.

### 4.1.2 Scene
A Scene is a macro container that references Patterns (and can also contain its own Events). Scenes are interchangeable with Patterns by projection:
- materializeSceneAsPattern(scene): flatten referenced patterns + scene events
- clonePatternAsScene(pattern): wrap pattern as a scene

### 4.1.3 Clip
Clips are launchable, loopable, timeboxed containers. A Clip is a Pattern with a launch/stop envelope.

### 4.1.4 Score
Score is a long-form container that can embed Clips and Patterns. This is what notation and arrangement views operate on.

### 4.1.5 Take
A Take captures live-recorded Events with provenance metadata. Takes can be merged into Patterns or Scenes.

### 4.1.6 Container metadata and invariants

Containers use the shared `ContainerMeta` type (defined in 4.1). The metadata is parametric-friendly:

```ts
// Already defined in 4.1, shown here for reference:
type ContainerMeta = {
  lengthInTicks?: number;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
  timeSignature?: TimeSignature;
  tempoMode?: "inherit" | "override";
  tags?: string[];
  version?: string;
};

type TimeSignature = { numerator: number; denominator: number };
```

Invariants:
- If loop is true, loopStart and loopEnd must define a valid range.
- If lengthInTicks is set, events beyond that range are either truncated or wrapped depending on container settings.
- timeSignature can be overridden locally but does not erase global meter events.

### 4.1.7 Local time vs global time

Each container has a local time axis. When it is referenced inside a scene or score, it is mapped onto a global time axis by a transform:

```
globalTick = offset + localTick * scale
```

The scale can represent:
- time-stretching a clip
- half-time or double-time phrasing
- a different tempo for a sub-container

The time transform is explicit in the container reference so that the same container can be reused at multiple tempos.

### 4.1.8 Container transforms

Common transformations are applied at the container level rather than per-event:

- transpose: shift all pitch values by a semitone offset
- humanize: randomized microtiming or velocity
- time-stretch: scale all event positions relative to a pivot
- quantize: snap events to a grid

These are applied as non-destructive layers. The original events remain intact and the transform is stored as metadata. This makes it possible to "render" and "commit" later.

### 4.1.9 Container references and layering

Scenes and scores reference containers using the parametric `Ref<C>` type (defined in 4.1):

```ts
// Ref is parametric over the container type
type Ref<C extends Container<any, any>> = {
  containerId: string;
  offset: number;
  length?: number;
  scale?: number;
  gain?: number;
  transpose?: number;
  mute?: boolean;
};

// Example: a Scene referencing Patterns
type SceneRef = Ref<Pattern>;
type ScoreRef = Ref<Scene | Clip>;
```

This allows a scene to layer multiple patterns without copying them. The rendered timeline is the composition of:
- overlay events in the scene
- referenced container events transformed by the ref

### 4.1.10 Pattern semantics (grid + event model)

Patterns are grid-aware, but the grid is a view, not the storage:

- The tracker grid maps row index -> tick.
- A row can contain multiple events (note, automation, meta).
- Pattern length is independent of the grid resolution.

Tracker-specific fields (e.g., effect columns) are stored as event properties:
- effect column = a meta event or automation event, not a separate structure.

### 4.1.11 Scene semantics (launching and switching)

A scene defines a set of container references that can be launched together. Launching a scene can produce events:

- scene.trigger events (meta)
- quantized launch events (for exact timing)
- overrides (tempo, meter, or loop rules for its clips)

Scenes support follow actions:
- launch next scene after N bars
- jump to a labeled scene
- probabilistic scene transitions

These are represented as events so they can be edited and automated.

### 4.1.12 Clip semantics (looping and envelopes)

Clips are containers with additional launch and loop rules:

- launch quantization (e.g., 1 bar)
- loop mode (forward, ping-pong, one-shot)
- legato rules (whether a new clip inherits playback position)
- clip envelope (fade in/out)

Clip launch itself is an event that can be recorded into a scene.

### 4.1.13 Score semantics (hierarchy and form)

Score is a long-form container with hierarchical structure:

- sections (intro, verse, chorus)
- nested scenes
- long-range tempo and meter events

This enables notation and arrangement views to operate on the same Event model at different scales.

### 4.1.14 Take semantics (recording and comping)

Takes are transient containers used for live capture:

- Each take records source metadata (performer, device, pad).
- Multiple takes can be layered and comped into a final pattern.
- Takes can be merged, flattened, or kept as references.

The system keeps the original take events so edits remain reversible.

### 4.1.15 Phrase containers (grammar and motif)

Phrase containers are for algorithmic generation:

- They store grammar definitions and seed values.
- They can render to EventStreams on demand.
- They are versioned so a phrase can be frozen at any time.

Phrase containers do not directly schedule audio; they produce events that are then routed through cards.

### 4.2 Track and Lane (views, not sources)
A Track is not a new time system and not a new container. It is a view and editing lens on top of a `Container<K, E>`.

- Track = filter + projection + grouping + (optional) writeback rules.
- Lane = a specific projection of a Track, using `Lane<T>` for value streams.

Type-theoretic view using parametric types:

```ts
// All types use the parametric foundations from Part II

type Tick = number;
type EventId = string;
type ContainerId = string;
type EventKind = string;

// Stream is just an array of events
type Stream<E> = E[];

// Event is parametric over payload
type Event<P> = {
  id: EventId;
  kind: EventKind;
  start: Tick;
  duration: Tick;
  payload: P;
  triggers?: Trigger<P>[];
  automation?: Lane<Control>[];
  tags?: Record<string, string>;
  meta?: EventMeta;
};

// Container is parametric over kind and event type
type Container<K extends string, E extends Event<any> = Event<any>> = {
  id: ContainerId;
  kind: K;
  events: Stream<E>;
  meta?: ContainerMeta;
  refs?: Ref<Container<any, any>>[];
};

// Track is a bidirectional view (lens) with three type parameters
type Track<K extends string, E, V> = {
  name: string;
  read: (container: Container<K, E>) => Stream<V>;
  write: (container: Container<K, E>, edits: Stream<V>) => Container<K, E>;
};

// Example instantiations
type NoteTrack<P extends Pitch> = Track<"pattern", Event<any>, NoteEvent<P>>;
type ChordTrack = Track<"score", Event<any>, ChordEvent>;
type AutomationTrack = Track<"pattern", Event<any>, AutomationEvent>;
```

Implication:
- The tracker UI is a `Track<"pattern", Event<any>, Event<Voice<MIDIPitch>>>` over a Pattern container.
- The piano roll is another Track over the same Pattern container.
- Notation is also a Track, with a different projection and edit rules.
- Lanes are `Lane<T>` projections (e.g., `Lane<number>` for automation).

### 4.2.1 Track filters and projections

Tracks are defined by projection functions. Common projections:
- Note track: select events where kind == "note".
- Automation track: select events where kind == "automation" and target path matches.
- Gesture track: select events where kind == "gesture".
- Meta track: select markers, labels, and scene triggers.

Track filters can be compositional:

```
noteTrack = filter(kind == "note") ∘ map(toNotePayload)
```

### 4.2.2 Track grouping and layering

Tracks can be grouped without changing the container:
- Group tracks are UI constructs that aggregate multiple projections.
- Layered tracks can reference different containers but display them together.

This allows:
- A "Drums" track group to show kick, snare, and hat lanes from multiple patterns.
- A "Harmonic" group to show chord events and bass notes together.

### 4.2.3 Track editing and writeback rules

Tracks are bidirectional. Edits in a track are written back into the container:

- Insert event: translate UI position to tick, insert into container.
- Edit event: update event properties in container.
- Delete event: remove from container.

Writeback rules specify how to translate UI edits into event edits:
- In notation, a tied note edits duration.
- In tracker, a row edit may create multiple events (note + effect).

### 4.2.4 Lanes as first-class views

Lanes are tracks focused on a single property or subset:
- Velocity lane: view of NoteEvent velocity across time.
- Automation lane: view of target parameter values.
- Expression lane: articulation, vibrato, or pitch bend.

Lanes are not separate storage; they are projections of EventStream.

### 4.2.5 Track templates and roles

Track templates are reusable track definitions:

- Drum lane template (kick, snare, hat, percussion).
- String section template (violins, violas, celli).
- Carnatic template (melody, mridangam, drone).

Templates define default projections and UI configurations without changing the underlying Event data.

### 4.2.6 Track vs channel (audio routing)

Tracks are view constructs; channels are audio routing constructs:

- A track can target multiple channels.
- A channel can receive events from multiple tracks.

This separation is essential when a notation staff feeds a synth rack and a sampler simultaneously.

### 4.3 Scene vs Event vs Track (relationship summary)

This is the core mental model:

- Event = atomic time interval with payload and triggers.
- EventStream = ordered set of Events (single timeline).
- EventContainer = named collection of EventStream + metadata.
- Scene = EventContainer that references other EventContainers, plus optional overlay events.
- Track = view/lens that filters and edits the EventStream inside a container.
- Card = typed function that produces or transforms EventStreams or AudioBuffers.

Therefore:
- A Scene is a container (not a track). A Scene contains or references EventStreams.
- A Track does not contain Events; it selects and edits Events from a container.
- A Card is not a container; it is a function that either reads or writes streams.

### 4.3.1 Practical examples (mental model)

Example 1: A piano roll editing the bass line:
- Container: Pattern "Bass A"
- Track: NoteTrack over Pattern "Bass A"
- Card: PianoRollCard is a UI card that edits that track

Example 2: A scene launching two clips:
- Container: Scene "Verse"
- Scene references Pattern "Drums A" and "Bass A"
- Launching emits scene.trigger events and starts clip playback

Example 3: RapidComposer generating a phrase:
- Container: Pattern "Lead A"
- Card: RapidComposer generates EventStream<NoteEvent>
- The generated events are inserted into the Pattern container

### 4.4 Scene formalization (type-theoretic)

There are two equivalent ways to represent a Scene using parametric types:

Option A: Scene as a Container whose events include references to other containers.

```ts
// RefPayload for container references
type RefPayload = {
  kind: "ref";
  ref: Ref<Container<any, any>>;
};

// Scene events can be any payload or a reference
type ScenePayload = Event<any> | Event<RefPayload>;

// Scene is just Container<"scene">
type Scene = Container<"scene", ScenePayload>;
```

Option B: Scene as a Container + separate refs list. Both compile to the same event timeline.

```ts
type Scene = Container<"scene"> & {
  refs: Ref<Pattern | Clip>[];
};
```

The rule is that both options can be materialized into a Pattern via:

```
materializeSceneAsPattern<E>(scene: Scene): Container<"pattern", E>
```

This is why Scenes and Patterns are interchangeable—they're both `Container<K, E>` instantiations.

### 4.5 RapidComposer card (type-theoretic positioning)

A RapidComposer-like card is not a container. It is a generator or transformer card that produces Streams from structured inputs.

Using the parametric type system, it can be modeled as:

```ts
// Context is parametric over data and meta types
type Context<D, M = {}> = {
  data: D;
  meta: M;
  time: TimeContext;
};

// HarmonicSpec replaces the old HarmonyContext
type HarmonicSpec = {
  scale?: Scale;
  chords?: Stream<Event<ChordPayload>>;
  constraints?: Rules<Event<Voice<any>>, ScaleContext>;
};

// PhraseSpec is parametric over the voice type
type PhraseSpec<P extends Pitch> = {
  grammar: GrammarRule[];
  length: number;
  density: number;
  voice?: Voice<P>;
};

// GrammarRule is parametric
type GrammarRule = {
  symbol: string;
  expansion: string | ((ctx: Context<any>) => Stream<Event<any>>);
};

// Generator-style card using parametric types
type RapidComposerCard<P extends Pitch> = Card<
  [Context<HarmonicSpec>, PhraseSpec<P>],
  Stream<Event<Voice<P>>>
>;

// Or, as a pure transformer
type MelodyTransformCard<P extends Pitch> = Card<
  Stream<Event<Voice<P>>>,
  Stream<Event<Voice<P>>>
>;
```

In both cases, it is a typed morphism. It does not own time. It emits Events into a container selected by the user.

Note how the old proliferated types (`HarmonyContext`, `PhraseSpec`, `NoteEvent`) are replaced by parametric compositions:
- `HarmonyContext` → `Context<HarmonicSpec>`
- `PhraseSpec` → `PhraseSpec<P extends Pitch>`
- `NoteEvent` → `Event<Voice<P>>`

---

## Part V) Cards and composition

> **Noun Contract: Card**
> - **Canonical meaning:** A typed transform `Card<A,B>` mapping input A to output B
> - **Not this:** UI widgets, audio processor modules, or theory constraint cards
> - **Canonical type:** `Card<A,B>` in `cardplay/src/cards/card.ts`
> - **See also:** [Card Systems](./docs/canon/card-systems.md) for all card types in the codebase
> - **Analogy:** A "rule card" or "spell" that transforms tokens

---

## 5.1 Cards as Typed Functions

Cards are the universal unit: instruments, effects, generators, views, and transformers. Each card has explicit input/output types and a runtime behavior.

### 5.1.1 Card interface

Cards use the parametric type system for maximum composability:

```ts
// Port types are parametric
type PortType<T> = 
  | { kind: "audio"; type: AudioBuffer }
  | { kind: "stream"; type: Stream<T> }
  | { kind: "control"; type: Control }
  | { kind: "container"; type: Container<any, T> }
  | { kind: "analysis"; type: Analysis<T> }
  | { kind: "any"; type: any };

// CardSignature is parametric over input/output types
type CardSignature<I, O> = {
  inputs: PortSpec<I>[];
  outputs: PortSpec<O>[];
};

type PortSpec<T> = { name: string; type: PortType<T> };

// CardDefinition is parametric
type CardDefinition<I, O> = {
  type: string;
  name: string;
  signature: CardSignature<I, O>;
  params: Record<string, Control>;
  defaults?: Record<string, unknown>;
  rules?: Rules<Event<any>, any>;  // optional constraints
  renderUI?: (state: AppState) => void;
  process?: (input: I, context: Context<EngineSpec>) => O;
};

// CardInstance carries the type parameters
type CardInstance<I, O> = {
  id: string;
  type: string;
  name: string;
  params: Record<string, unknown>;
  state?: Record<string, unknown>;
  _phantom?: [I, O];  // type witness
};

// The fundamental Card type is a typed morphism
type Card<A, B> = {
  name: string;
  signature: CardSignature<A, B>;
  transform: (a: A) => B;
  params?: Record<string, Control>;
  rules?: Rules<any, any>;
};

// Example instantiations
type InstrumentCard<P extends Pitch> = Card<Stream<Event<Voice<P>>>, AudioBuffer>;
type TransformCard<E> = Card<Stream<E>, Stream<E>>;
type GeneratorCard<P extends Pitch> = Card<Context<HarmonicSpec>, Stream<Event<Voice<P>>>>;
type AnalysisCard<T> = Card<AudioBuffer, Stream<Event<T>>>;
```

### 5.1.2 Card categories
- Event creators: trackers, piano roll, notation, step sequencers, phrase generators
- Event transformers: swing, quantize, humanize, morph, probabilistic routers
- Audio generators: synths, samplers, spectral engines
- Audio transformers: effects, spatializers, resynth, granular
- Analysis cards: pitch tracking, onset detection, timbre profiling
- Mix and output: mixer, bus, limiter, meter
- View cards: score view, performance view, inspector

Every view is a card: the UI itself is a typed view of Event containers.

### 5.1.3 Parameters vs state (editable vs runtime)

Cards separate user parameters from runtime state:

- Params: stable, user-editable configuration (knobs, dropdowns, macro controls).
- State: runtime memory (buffers, envelopes, analysis history).

Why it matters:
- Params are automatable and serialized in the project.
- State is ephemeral and only saved when explicitly frozen or captured as a snapshot.

Example:
- A "Granular Cloud" card has params like grainSize and density, but its grain buffer is runtime state.

### 5.1.4 UI contract and editor hints

Cards expose UI metadata so different surfaces can render them consistently:

```ts
ui: {
  editor: "knobs" | "grid" | "graph" | "notation",
  groups: [
    { label: "Tone", params: ["color", "brightness"] },
    { label: "Time", params: ["grainSize", "spray"] }
  ],
  preview: { audioDemo: "url", visualHint: "spectrum" }
}
```

This allows a minimal deck UI, a pro inspector, and a mobile view to all use the same card definition.

### 5.1.4A Universal inter-card control (cards can drive cards)

There is no privileged “controller” card type in CardPlay. **All cards are peers**: any card may control **any other card’s** public **parameters** and **methods**, provided the host grants the required capabilities (effects) and the active board policy allows it.

This is the key unifying idea behind “AI can edit the tracker” and “the tracker can arrange AI calls”:

- The **AI card can control the Tracker** by writing events into the same stream/container the tracker is editing (or by emitting a validated patch that inserts/edits those events). The tracker is a view over shared state, not an isolated editor.
- The **Tracker can control AI** by authoring *arrangeable* “call events” (e.g., `ai_call`) that schedule method calls on an AI card during playback or at edit-time checkpoints, with results written back as explicit events/patches with full provenance.

Concretely, the host exposes a stable, capability-checked control surface for cards:

```ts
type CardParamRef<T = any> = { cardId: string; paramId: string };
type CardMethodRef = { cardId: string; methodId: string };

type HostAction =
  | { kind: "setParam"; target: CardParamRef; value: any }
  | { kind: "callMethod"; target: CardMethodRef; args: any[] }
  | { kind: "applyPatch"; patch: MetaPatch };
```

Cards do not “reach into” each other directly. They request `HostAction`s through the host API; the host validates, applies (or rejects), logs, and integrates with undo/redo. This keeps cross-card control powerful, auditable, and safe.

### 5.1.5 Card lifecycle (runtime semantics)

Cards have a consistent lifecycle in the engine:

1) instantiate: create runtime state.
2) configure: apply default params and load assets.
3) connect: wire ports according to the stack/graph.
4) schedule: receive event windows and time context.
5) process: produce event or audio output.
6) teardown: release resources.

This makes it possible to hot-swap cards or reload updated definitions without losing deck structure.

### 5.1.6 Card execution modes

Cards are classified by how they execute:

- event-mode: operate on EventStream (pure transformations).
- audio-mode: operate on AudioBuffer (DSP effects).
- hybrid: accept events and produce audio (instruments).
- view-mode: no engine process, only UI (notation editor).

The engine can optimize based on mode:
- event-mode cards can run ahead of time.
- audio-mode cards run in real time.

### 5.1.7 Presets, snapshots, and versioning

Cards support:
- Presets: named parameter sets.
- Snapshots: params plus optional captured state (e.g., LFO phase).
- Versioning: migration rules when a card definition changes.

Versioning is explicit so old projects remain playable:

```ts
card "SamplerBuddy" {
  version: "2.1.0"
  migrations: ["1.9.0->2.0.0", "2.0.0->2.1.0"]
}
```

#### 5.1.7.1 Preset Architecture (Automatable Parameters)

**Core Principle**: Every preset is a named collection of automatable/modulatable parameter values. Presets are NOT opaque blobs—they are fully decomposable into individual parameters that users can:
1. Modify independently while keeping other preset values
2. Automate via lanes and envelopes
3. Modulate via LFOs, envelopes, or other cards
4. Save as a new user preset with their modifications

**Parameter Types (all automatable)**:

```ts
type ParameterType = 
  | FloatParameter      // Continuous 0.0-1.0 or custom range
  | IntParameter        // Discrete integer values
  | EnumParameter       // Named options (e.g., "sine" | "saw" | "square")
  | StringParameter     // Text values (e.g., sample path, pattern name)
  | BoolParameter       // On/off toggles
  | ArrayParameter<T>;  // Lists of sub-parameters

interface Parameter<T> {
  readonly id: string;
  readonly name: string;
  readonly type: ParameterType;
  readonly value: T;
  readonly default: T;
  readonly min?: number;           // For float/int
  readonly max?: number;           // For float/int
  readonly step?: number;          // For int
  readonly options?: readonly T[]; // For enum
  readonly automatable: boolean;   // Can be targeted by automation lanes
  readonly modulatable: boolean;   // Can be modulated by LFOs/envelopes
  readonly ccNumber?: number;      // MIDI CC mapping
  readonly group?: string;         // UI grouping
  readonly description?: string;
}
```

**Preset Structure**:

```ts
interface Preset {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly params: Record<string, ParameterValue>;  // id -> value
  readonly description?: string;
  readonly isFactory: boolean;     // Built-in vs user-created
  readonly isModified: boolean;    // User has changed values
  readonly parentPresetId?: string; // If derived from another preset
}

interface PresetBank {
  readonly cardId: string;
  readonly factoryPresets: readonly Preset[];
  readonly userPresets: readonly Preset[];
  readonly currentPreset: Preset;
  readonly parameterOverrides: Record<string, ParameterValue>; // Changes from current preset
}
```

**Preset Operations**:

```ts
// Load a preset (copies all param values)
loadPreset(bank: PresetBank, presetId: string): PresetBank;

// Get effective parameter value (preset + overrides)
getParameter<T>(bank: PresetBank, paramId: string): T;

// Modify single parameter (creates override, marks as modified)
setParameter<T>(bank: PresetBank, paramId: string, value: T): PresetBank;

// Save current state as new user preset
saveAsPreset(bank: PresetBank, name: string, category: string): Preset;

// Revert to preset defaults (clears overrides)
revertToPreset(bank: PresetBank): PresetBank;

// Compare current state to preset (shows what changed)
diffFromPreset(bank: PresetBank): Record<string, { preset: any; current: any }>;
```

**Automation and Modulation Targets**:

Every automatable parameter is a valid target for:
- Automation lanes (event-based curves over time)
- LFO modulation (continuous oscillation)
- Envelope modulation (ADSR or custom shapes)
- MIDI CC (external controller input)
- Expression (per-note modulation)
- Cross-card modulation (output of one card modulates another)

```ts
interface ModulationRouting {
  readonly targetCardId: string;
  readonly targetParamId: string;
  readonly sourceType: "lane" | "lfo" | "envelope" | "cc" | "expression" | "card";
  readonly sourceId: string;
  readonly amount: number;          // Modulation depth (-1 to 1)
  readonly bipolar: boolean;        // Centered at 0 or unipolar
}
```

**Example: DrumMachineCard Preset Decomposition**:

```ts
// Factory preset "808 Kit"
const preset808: Preset = {
  id: "808-kit",
  name: "808 Kit",
  category: "Electronic",
  author: "Factory",
  tags: ["808", "hip-hop", "trap"],
  params: {
    // Each value is individually automatable
    "kick-decay": 0.6,
    "kick-pitch": 48,
    "kick-drive": 0.3,
    "snare-tone": 0.5,
    "snare-snap": 0.7,
    "hihat-decay": 0.2,
    "hihat-tone": 0.8,
    "swing": 0.1,
    "humanize": 0.05,
    // ...hundreds more parameters
  },
  isFactory: true,
  isModified: false,
};

// User loads preset, tweaks kick decay, saves as new preset
const userPreset = saveAsPreset(
  setParameter(loadPreset(bank, "808-kit"), "kick-decay", 0.8),
  "My Punchy 808",
  "User/Hip-Hop"
);
// userPreset.parentPresetId === "808-kit"
// userPreset.isFactory === false
```

**Nested Presets (for complex cards)**:

Cards with sub-components (e.g., Arranger with multiple voices) use nested preset structures:

```ts
interface ArrangerPreset extends Preset {
  params: {
    "bass-pattern": string;        // Pattern preset ID
    "chord-voicing": string;       // Voicing style enum
    "drums-style": string;         // Drum pattern preset ID
    "energy-level": number;        // 0-1 float
    // Individual voice parameters (all automatable)
    "bass-volume": number;
    "bass-octave": number;
    "chord-spread": number;
    "drums-volume": number;
    // ...
  };
}
```

### 5.1.8 Card safety for user-generated extensions

User-defined cards (including LLM-generated ones) run in a sandbox:
- No filesystem access.
- No global state mutation.
- Only explicit APIs for audio, events, and UI.

This allows the system to load community cards safely.

### 5.1.9 Card Definition System with UI/Behavior Metadata (IMPLEMENTATION SPEC)

**Goal**: Build all cards with enough metadata that they know how to render, behave, and be visually represented with emoji/CSS—enabling "user-injectable" cards where simple preset definitions yield enormous sonic power.

#### 5.1.9.1 CardVisuals (Visual Identity)

```ts
interface CardVisuals {
  readonly emoji: string;              // Primary emoji: 🥁, 🎹, 🎸, 🎺, 🎻, 🎤, 🔊
  readonly emojiSecondary?: string;    // Secondary: genre/style specific
  readonly color: string;              // Primary color hex (#FF5722)
  readonly colorSecondary?: string;    // Gradient end color
  readonly gradient?: 'linear' | 'radial' | 'conic';
  readonly glow?: string;              // Glow color when active
  readonly glowIntensity?: number;     // 0-1 glow strength
  readonly animation?: CardAnimation;  // CSS animation definition
  readonly badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface CardAnimation {
  readonly name: string;               // CSS animation name
  readonly duration: string;           // e.g., "0.5s"
  readonly timing: string;             // e.g., "ease-in-out"
  readonly iterationCount: string;     // e.g., "infinite"
  readonly keyframes: string;          // CSS keyframes definition
}

// Emoji mapping by category
const CARD_EMOJI_MAP = {
  // Generators
  'drum-machine': '🥁',
  'synth': '🎹',
  'bass': '🎸',
  'guitar': '🎸',
  'piano': '🎹',
  'strings': '🎻',
  'brass': '🎺',
  'woodwinds': '🎷',
  'choir': '🎤',
  'organ': '⛪',
  'sampler': '📦',
  'loop-player': '🔁',
  
  // Effects
  'reverb': '🏛️',
  'delay': '🔄',
  'chorus': '👥',
  'filter': '🎚️',
  'distortion': '⚡',
  'compressor': '📊',
  'eq': '📈',
  
  // Transforms
  'transpose': '⬆️',
  'quantize': '📐',
  'arpeggiator': '🎼',
  
  // Genre-specific
  'reggae': '🌴',
  'country': '🤠',
  'jazz': '🎭',
  'electronic': '⚡',
  'classical': '🎩',
  'hiphop': '🎧',
  'rock': '🤘',
  'latin': '💃',
} as const;
```

#### 5.1.9.2 CardBehavior (Runtime Semantics)

```ts
interface CardBehavior {
  readonly mode: 'event' | 'audio' | 'hybrid' | 'view';
  readonly pure: boolean;              // No side effects
  readonly stateful: boolean;          // Has internal state
  readonly stochastic: boolean;        // Randomness in output
  readonly realtime: boolean;          // Must run in audio thread
  readonly cacheable: boolean;         // Output can be cached
  readonly latency: CardLatency;
  readonly cpuIntensity: 'light' | 'medium' | 'heavy' | 'extreme';
  readonly memoryFootprint: CardMemory;
  readonly sideEffects: CardSideEffect[];
  readonly threadSafety: 'main-only' | 'audio-safe' | 'parallel-safe';
  readonly hotReloadable: boolean;
  readonly stateSerializable: boolean;
}

interface CardLatency {
  readonly samples: number;            // Processing latency in samples
  readonly ms: number;                 // Latency in milliseconds
  readonly lookahead: number;          // Required lookahead (samples)
  readonly reportedToHost: boolean;    // Latency compensation enabled
}

interface CardMemory {
  readonly estimatedMB: number;        // Total memory estimate
  readonly sampleBufferMB: number;     // Sample data
  readonly wavetablesMB: number;       // Wavetable data
  readonly stateKB: number;            // Internal state
  readonly dynamicAllocation: boolean; // Allocates at runtime
}

type CardSideEffect = 
  | 'none'
  | 'audio-output'
  | 'midi-output'
  | 'file-read'
  | 'file-write'
  | 'network'
  | 'clipboard'
  | 'notification';
```

#### 5.1.9.3 CardUIConfig (Rendering Instructions)

```ts
interface CardUIConfig {
  readonly panels: CardPanel[];
  readonly editorType: 'knobs' | 'grid' | 'graph' | 'notation' | 'waveform' | 'custom';
  readonly defaultView: 'compact' | 'standard' | 'expanded' | 'fullscreen';
  readonly resizable: boolean;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly theme: CardTheme;
}

interface CardPanel {
  readonly id: string;
  readonly label: string;
  readonly position: 'main' | 'sidebar' | 'footer' | 'overlay' | 'drawer';
  readonly controls: CardControl[];
  readonly layout: CardControlLayout;
  readonly collapsible: boolean;
  readonly defaultCollapsed: boolean;
}

interface CardControlLayout {
  readonly type: 'grid' | 'flex' | 'absolute';
  readonly columns?: number;
  readonly rows?: number;
  readonly gap?: string;
  readonly padding?: string;
}

interface CardControl {
  readonly id: string;
  readonly type: 'knob' | 'slider' | 'button' | 'toggle' | 'dropdown' | 'xy-pad' | 'meter' | 'waveform' | 'label' | 'group';
  readonly paramId?: string;           // Bound parameter
  readonly style: CardControlStyle;
  readonly label?: string;
  readonly tooltip?: string;
  readonly contextMenu?: CardContextMenuItem[];
}

interface CardControlStyle {
  readonly size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly variant: string;            // Style variant name
  readonly color?: string;
  readonly accentColor?: string;
  readonly trackColor?: string;
  readonly labelPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
}

interface CardTheme {
  readonly name: string;
  readonly background: string;
  readonly foreground: string;
  readonly accent: string;
  readonly border: string;
  readonly shadow: string;
  readonly fontFamily: string;
  readonly fontSize: string;
}
```

#### 5.1.9.4 User-Injectable Card System

The system allows users (and LLMs) to create new cards from simple JSON definitions:

```ts
interface UserCardTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: CardCategory;
  readonly description: string;
  readonly version: string;
  readonly author: string;
  
  // Minimal required definitions
  readonly ports: {
    readonly inputs: PortDefinition[];
    readonly outputs: PortDefinition[];
  };
  
  // Parameters (auto-generates UI)
  readonly parameters: ParameterDefinition[];
  
  // Presets (simple key-value objects)
  readonly presets: PresetDefinition[];
  
  // Processing (can be omitted for passthrough)
  readonly process?: string | ProcessFunction;
  
  // Optional visual overrides
  readonly visuals?: Partial<CardVisuals>;
  readonly ui?: Partial<CardUIConfig>;
}

// Example: User-created card from simple definition
const myKickCard: UserCardTemplate = {
  id: 'user:my-808-kick',
  name: 'My 808 Kick',
  category: 'generators',
  description: 'Custom 808 kick with extra punch',
  version: '1.0.0',
  author: 'user@example.com',
  
  ports: {
    inputs: [{ name: 'trigger', type: 'trigger' }],
    outputs: [{ name: 'audio', type: 'audio' }]
  },
  
  parameters: [
    { id: 'pitch', type: 'float', default: 48, min: 20, max: 80, label: 'Pitch', unit: 'Hz' },
    { id: 'decay', type: 'float', default: 0.5, min: 0.1, max: 2.0, label: 'Decay', unit: 's' },
    { id: 'drive', type: 'float', default: 0.3, min: 0, max: 1, label: 'Drive' },
    { id: 'click', type: 'float', default: 0.2, min: 0, max: 1, label: 'Click' },
  ],
  
  presets: [
    { id: 'punchy', name: 'Punchy', params: { pitch: 52, decay: 0.4, drive: 0.5, click: 0.3 } },
    { id: 'subby', name: 'Sub Heavy', params: { pitch: 40, decay: 0.8, drive: 0.2, click: 0.1 } },
    { id: 'tight', name: 'Tight', params: { pitch: 55, decay: 0.2, drive: 0.4, click: 0.5 } },
  ],
  
  visuals: {
    emoji: '🥁',
    color: '#FF5722',
    glow: '#FF9800',
  },
};

// System builds full card with all metadata
const fullCard = buildCardFromTemplate(myKickCard);
// Returns Card<A, B> with complete CardMeta, CardBehavior, CardUIConfig
```

#### 5.1.9.5 Curried Presets (Partial Application)

```ts
interface CurriedPreset<T extends Record<string, unknown>> {
  readonly basePreset: Preset;
  readonly appliedParams: Partial<T>;
  readonly remainingParams: (keyof T)[];
  
  // Apply more params, returning new curried preset
  apply(params: Partial<T>): CurriedPreset<T>;
  
  // Finalize with remaining params
  finalize(params: Pick<T, keyof T>): Preset;
}

// Currying example
const bass808Base = getPreset('808-bass');

// Curry with attack time locked
const punchyBass = curryPreset(bass808Base, { attack: 0.001, drive: 0.7 });
// punchyBass can be further customized by user

// Curry for specific genre
const trapBass = curryPreset(bass808Base, { 
  attack: 0.001, 
  decay: 0.3, 
  slideProbability: 0.2,
  slideAmount: 12,
});

// Compose presets
const layeredBass = composePresets([
  { preset: bass808, weight: 0.7 },
  { preset: bassReese, weight: 0.3 },
]);

// Morph between presets over time
const morphingBass = morphPresets(bass808, bassReese, {
  duration: 4000, // 4 bars
  curve: 'easeInOutCubic',
  parameterCurves: {
    'filter-cutoff': 'exponential',
    'drive': 'linear',
  },
});
```

#### 5.1.9.6 Card CSS Generation

```ts
function generateCardCSS(card: CardDefinition): string {
  const v = card.visuals;
  
  return `
    .card-${card.meta.id} {
      --card-primary: ${v.color};
      --card-secondary: ${v.colorSecondary || v.color};
      --card-glow: ${v.glow || 'transparent'};
      --card-glow-intensity: ${v.glowIntensity || 0};
      
      background: ${v.gradient 
        ? `${v.gradient}-gradient(var(--card-primary), var(--card-secondary))`
        : 'var(--card-primary)'
      };
      
      border-radius: 8px;
      box-shadow: 0 0 calc(20px * var(--card-glow-intensity)) var(--card-glow);
      
      ${v.animation ? `
        animation: ${v.animation.name} ${v.animation.duration} ${v.animation.timing} ${v.animation.iterationCount};
      ` : ''}
    }
    
    .card-${card.meta.id}.active {
      --card-glow-intensity: 1;
    }
    
    .card-${card.meta.id}.bypassed {
      opacity: 0.5;
      filter: grayscale(0.8);
    }
    
    .card-${card.meta.id}.modulated {
      --card-glow: orange;
      animation: modulation-pulse 1s ease-in-out infinite;
    }
    
    .card-${card.meta.id} .card-emoji {
      font-size: 2rem;
      filter: drop-shadow(0 0 4px var(--card-glow));
    }
    
    @keyframes modulation-pulse {
      0%, 100% { box-shadow: 0 0 10px var(--card-glow); }
      50% { box-shadow: 0 0 25px var(--card-glow); }
    }
  `;
}

// Generate mini card view (for palette, compact mode)
function renderMiniCard(card: CardDefinition): string {
  return `
    <div class="mini-card card-${card.meta.id}">
      <span class="card-emoji">${card.visuals.emoji}</span>
      <span class="card-name">${card.meta.name}</span>
    </div>
  `;
}
```

### 5.2.1 Type theory foundation (compositional model)

We treat cards as morphisms in a typed category, using the parametric type system:

- Objects are parametric port types: `AudioBuffer`, `Stream<E>`, `Container<K,E>`, `Lane<T>`, `Control`, `Analysis<T>`.
- Morphisms are cards: `Card<A, B>` where `f: A -> B`.
- Serial stack = composition (g after f).
- Parallel stack = monoidal product (f ⊗ g), producing a tuple or tagged union of outputs.

Type rules (using parametric types):

```
Card<A, B> : A -> B
Card<B, C> : B -> C
------------------------
compose(f, g) : A -> C
```

```
Card<A, B>   Card<A, C>
---------------------------
parallel(f, g) : A -> (B, C)
```

The parametric nature means:
- `Card<Stream<Event<Voice<MIDIPitch>>>, AudioBuffer>` is an instrument
- `Card<Stream<Event<Voice<P>>>, Stream<Event<Voice<P>>>>` is a transform (parametric over pitch)
- `Card<Context<HarmonicSpec>, Stream<Event<Voice<P>>>>` is a generator

This is the formal explanation for stacks:
- Serial stacks use composition.
- Parallel stacks use the monoidal product.
- Tabs/switch are a sum type (B + C), stabilized by a common supertype.

### 5.2.2 Event kinds are open (extensibility)

Event kinds are an open union. Any card can register a new kind with a schema and renderer. Thanks to the parametric `Event<P>` type, new kinds simply provide a new payload type `P`:

```ts
// Define a new parametric event payload type
type GesturePayload = {
  intensity: number;
  shape: string;
  contour: number[];
};

// Register the event kind using the parametric type
registerEventKind<GesturePayload>({
  kind: "gesture",
  payloadType: GesturePayload,
  schema: { intensity: "number", shape: "string", contour: "number[]" },
  renderHints: { color: "#f0a", icon: "wave" }
});

// Usage: Event<GesturePayload>
const gestureEvent: Event<GesturePayload> = {
  id: "evt:gesture:1",
  kind: "gesture",
  start: 0,
  duration: 100,
  payload: { intensity: 0.8, shape: "arc", contour: [0, 0.5, 1, 0.7] }
};
```

Structural typing is used for compatibility:
- A card that requires `Event<{pitch, velocity}>` accepts any `Event<P>` whose P includes those fields, even if extra fields exist.
- A card that emits `Event<{pitch, velocity, articulation}>` is still compatible with a consumer that only requires `Event<{pitch, velocity}>`.

This is the core of infinite extensibility: new event kinds do not require changes to the core as long as they declare a payload type and optionally implement adapters.

### 5.2.3 Port types are open (extensibility)

Port types are also open. Users can define new ports by providing:

- A type id (e.g., "SpectralFrame", "GestureStream")
- A parametric type signature
- A unification rule (how it can be coerced into known ports)
- Adapters (cards that map between types)
- UI render hints

Example:

```ts
// Define a new parametric stream type
type SpectralFrame = {
  bins: Float32Array;
  centroid: number;
  flux: number;
};

registerPortType<Stream<Event<SpectralFrame>>>({
  type: "SpectralStream",
  parametricSignature: "Stream<Event<SpectralFrame>>",
  compatibleWith: ["Stream<Event<any>>", "Analysis"],
  adapters: [
    { to: "Stream<Event<Voice<any>>>", card: "SpectralToNotes" as Card<Stream<Event<SpectralFrame>>, Stream<Event<Voice<StandardPitch>>>> }
  ]
});
```

### 5.2.4 Protocols and typeclasses (how new cards remain compatible)

We define parametric protocols (typeclasses) so cards can declare what they need without locking into a single concrete type. See section 2.9 for the full protocol definitions.

Examples of protocol usage in card signatures:

```ts
// Any stream that can be rendered as audio
card "UniversalRenderer" {
  // Accepts anything implementing Renderable<E> for some E
  signature: { 
    inputs: ["Renderable<E extends Event<any>>"], 
    outputs: ["AudioBuffer"] 
  }
  constraints: ["E : Renderable"]
}

// Any stream that can be scheduled into time
card "UniversalScheduler" {
  // Accepts anything implementing Schedulable<E> for some E
  signature: { 
    inputs: ["Schedulable<E extends Event<any>>"], 
    outputs: ["Stream<E>"] 
  }
  constraints: ["E : Schedulable"]
}

// Any stream that can be automated
card "UniversalAutomator" {
  signature: {
    inputs: ["Automatable<T>", "Lane<T>"],
    outputs: ["Stream<Event<any>>"]
  }
  constraints: ["T : Automatable"]
}
```

Cards can express parametric protocol constraints:

```ts
RenderInstrument<P extends Pitch> : Schedulable<Event<Voice<P>>> -> AudioBuffer
ApplyRules<E, C> : [Constrainable<E, C>, Rules<E, C>] -> Stream<E>
AutomateParam<T> : [Automatable<T>, Lane<T>] -> T
```

So a new user-defined stream type can still be used as long as it implements the relevant protocol.

### 5.2.5 User-defined cards (infinite extensibility)

Users can define cards with a manifest that declares:
- parametric signature (inputs/outputs with type parameters)
- schemas for parameters and event payloads
- protocol implementations
- adapters for type coercion
- UI renderer and editor hints

Example manifest with full parametric types:

```ts
card "KonnakolGenerator"<P extends Pitch = StandardPitch> {
  signature: { 
    inputs: ["Context<RhythmSpec>"], 
    outputs: ["Stream<Event<Voice<P>>>"] 
  }
  typeParams: {
    P: { extends: "Pitch", default: "StandardPitch" }
  }
  params: { 
    syllables: "string[]", 
    tala: "string", 
    density: "number" 
  }
  implements: ["Schedulable<Event<Voice<P>>>"]
  eventKinds: ["note", "rhythm-syllable"]
  behaviorContract: {
    emits: ["Stream<Event<Voice<P>>>"],
    mutates: [],
    observes: ["Context<RhythmSpec>"],
    sideEffects: ["none"]
  }
}
```

The core rule: if a card declares its parametric signature, protocol implementations, and behavior contract, it can be composed with anything that unifies its port types, even if the core system never knew it existed.

Extensibility guarantees:
1. **Type extensibility**: New payload types `P` work with `Event<P>` automatically
2. **Protocol extensibility**: Implement protocols to gain compatibility with existing cards
3. **Container extensibility**: New container kinds work with `Container<K, E>`
4. **Rule extensibility**: New rule systems work with `Rules<E, C>`
5. **Voice extensibility**: New pitch systems work with `Voice<P extends Pitch>`

### 5.2.6 Sandboxed behavior contracts (material influence)

User-provided cards (including LLM-generated cards) must declare not only their data types, but also how they materially influence the project. This is formalized as a behavior contract that runs inside the sandbox.

The behavior contract describes:
- what the card can emit (events, automation, audio, analysis)
- what it can mutate (parameters, containers, graph wiring)
- what it can observe (inputs, context, analysis streams)
- what side effects are allowed (none outside declared capabilities)

Behavior contracts are themselves parametric:

```ts
// Parametric behavior contract type
type BehaviorContract<
  E extends Event<any>,     // Event types this card emits
  T,                        // Automation target types
  C                         // Context types observed
> = {
  emits: TypeDescriptor<E>[];
  mutates: MutationTarget[];
  observes: TypeDescriptor<C>[];
  automationTargets: Target<T>[];
  sideEffects: SideEffectKind[];
};

// Example: a card that emits NoteEvents and can automate numbers
behavior "AutoOrchestrator" : BehaviorContract<
  Event<Voice<StandardPitch>>,
  number,
  Context<HarmonicSpec>
> {
  emits: ["Stream<Event<Voice<StandardPitch>>>", "Lane<number>"]
  mutates: ["Container<pattern, Event<any>>.events", "Card<any,any>.params"]
  observes: ["Stream<Event<Voice<any>>>", "Context<HarmonicSpec>"]
  automationTargets: [Target<number>("gain"), Target<number>("pan")]
  sideEffects: ["none"]
}
```

This makes the card's influence explicit and inspectable. Cards implement the `Contractable` protocol (see 2.9.4) to declare and verify contracts.

### 5.2.7 Meta-cards (higher-order cards)

Meta-cards are cards whose outputs are not just events or audio, but transformations of the project structure itself. They are parametric over the types they transform.

Type-theoretically, they are higher-order morphisms with parametric input/output:

```ts
// Meta-card type: transforms structures, not just events
type MetaCard<S, P> = Card<S, Patch<S>>;

// Concrete meta-card types
type DeckMetaCard = MetaCard<DeckState, DeckPatch>;
type GraphMetaCard = MetaCard<Graph<Card<any,any>>, GraphPatch>;

// Full signature with policy context
type PolicyMetaCard<S> = Card<
  [Graph<Card<any,any>>, Context<PolicySpec>],
  [Patch<Graph<Card<any,any>>>, Patch<Context<PolicySpec>>]
>;
```

Examples:
- "AutoMixer" : `MetaCard<MixerState, MixerPatch>` — adjusts mix parameters across multiple cards.
- "StackRefactor" : `Card<Stack<Card<any,any>>, Patch<Stack<Card<any,any>>>>` — inserts or removes adapters.
- "ArrangementWeaver" : `Card<Container<scene, Event<any>>[], Patch<Container<scene, Event<any>>[]>>` — rearranges scenes.

Meta-cards implement the `Patchable` protocol (see 2.9.4). They do not directly mutate state. They emit a diff or patch that the user approves:

```ts
// Parametric meta-card output type
type MetaOutput<S> = {
  patch: Patch<S>;
  preview: S;            // State after patch applied
  rollback: Patch<S>;    // Inverse patch for undo
  provenance: ActionLog; // Audit trail
};

// Example output
metaOutput: MetaOutput<Graph<Card<any,any>>> = {
  patch: {
    addCards: [Card<Stream<Event<any>>, Stream<Event<any>>>],
    updateParams: [ParamPatch<number>],
    rewire: [ConnectionPatch]
  },
  preview: previewGraph,
  rollback: inversePatch,
  provenance: auditLog
}
```

This preserves user control and makes changes auditable. All meta-card operations are logged via the `Auditable` protocol.

### 5.2.8 Effect manifest and causal graph

Every user-provided card must emit an effect manifest so its influence is visible:

```ts
effectManifest: {
  reads: ["EventStream<NoteEvent>", "Transport.bpm"],
  writes: ["container.events", "card.params", "automation"],
  creates: ["EventStream<AnalysisEvent>"],
  latency: "0 ticks",
  determinism: "stochastic"
}
```

The engine builds a causal graph from these manifests:
- which cards depend on which inputs
- which cards modify which containers or parameters
- which cards are pure vs stateful

This graph is visible in the inspector and is used to order execution.

#### 5.2.8.1 Effect manifest and causal graph (parametric)

Every user-provided card must emit a parametric effect manifest so its influence is visible:

```ts
// Parametric effect manifest type
type EffectManifest<
  R extends Event<any>,    // Types read
  W extends Event<any>,    // Types written
  C extends Event<any>     // Types created
> = {
  reads: TypeDescriptor<R | Context<any> | Lane<any>>[];
  writes: MutationDescriptor<W>[];
  creates: TypeDescriptor<C>[];
  latency: TickDuration;
  determinism: "pure" | "stateful" | "stochastic";
};

// Example with full parametric types
effectManifest: EffectManifest<
  Event<Voice<StandardPitch>>,
  Event<Voice<StandardPitch>>,
  Event<AnalysisPayload>
> = {
  reads: ["Stream<Event<Voice<StandardPitch>>>", "Context<TransportSpec>.bpm"],
  writes: ["Container<pattern, Event<any>>.events", "Card<any,any>.params", "Lane<number>"],
  creates: ["Stream<Event<AnalysisPayload>>"],
  latency: "0 ticks",
  determinism: "stochastic"
}
```

The engine builds a typed causal graph from these manifests:

```ts
// Causal graph is parametric over card types
type CausalGraph<C extends Card<any, any>> = {
  nodes: Map<CardId, CausalNode<C>>;
  edges: CausalEdge<C>[];
};

type CausalNode<C extends Card<any, any>> = {
  card: C;
  manifest: EffectManifest<any, any, any>;
  dependencies: CardId[];
  dependents: CardId[];
};

type CausalEdge<C extends Card<any, any>> = {
  from: CardId;
  to: CardId;
  via: "event" | "automation" | "param" | "context";
  type: TypeDescriptor<any>;
};
```

### 5.2.9 Sandbox execution model (parametric isolation)

Sandboxed cards execute under strict constraints:
- bounded CPU and memory
- no filesystem or network access
- deterministic execution unless marked stochastic
- time budget per render block

The sandbox uses parametric staging types:

```ts
// Staged changes are parametric
type StagedChange<S> = {
  state: "preview" | "committed" | "rolled-back";
  before: S;
  after: S;
  patch: Patch<S>;
  provenance: Provenance;
};

// Sandbox output type
type SandboxOutput<
  E extends Event<any>,
  S
> = {
  events: Stream<E>;
  stagedChanges: StagedChange<S>[];
  violations: ContractViolation[];
};
```

Sandbox outputs are staged:
- preview mode: apply in-memory only
- commit mode: apply to the project after user approval

All staged changes are logged with provenance metadata via the `Auditable` protocol.

### 5.2.10 Cross-card influence protocols (parametric channels)

Cross-card influence is only allowed through explicit parametric channels:

```ts
// Influence channel types
type InfluenceChannel<T> = 
  | { kind: "event"; type: Stream<Event<any>> }
  | { kind: "automation"; target: Target<T>; lane: Lane<T> }
  | { kind: "param"; path: ParamPath; type: T }
  | { kind: "meta"; patch: Patch<any> };

// Cross-card link is parametric
type CardLink<
  A extends Card<any, any>,
  B extends Card<any, any>,
  T
> = {
  from: A;
  to: B;
  channel: InfluenceChannel<T>;
  validated: boolean;
};
```

Allowed influence types:
- events: `Stream<Event<P>>` for any payload P
- automation targets: `Target<T>` with `Lane<T>` for any automatable T
- parameter mutation: declared in effect manifest
- graph rewiring: `Patch<Graph>` (meta-card output only)

This prevents hidden or implicit coupling between cards. Any influence must be:
1. Declared in the behavior contract
2. Typechecked against parametric signatures
3. Visible in the causal graph
4. Logged via the `Auditable` protocol

### 5.2.11 The "type story" in one sentence

Events are `Event<P>` values, Streams are `Stream<E>` sequences, Containers are `Container<K, E>` named contexts, Tracks are `Track<K, E, V>` lenses, Cards are `Card<A, B>` morphisms, Rules are `Rules<E, C>` constraints, and Lanes are `Lane<T>` projections. Extensibility is achieved through parametric polymorphism: new payload types, new pitch systems, new contexts, and new rules all compose with the six core generic types without adding new specialized types to the system.

### 5.2.12 Adapter synthesis and justification

When types do not match directly, the system searches for adapter paths:

- It builds a graph of registered adapters.
- It finds the lowest-cost path between output and input types.
- It presents the path to the user for approval.

Example:
- EventStream<NoteEvent> -> AudioBuffer
  - RenderInstrument adapter

The justification is exposed in UI so the user understands why an adapter was inserted.

### 5.2.13 Type reflection and introspection

Every card and port type can be reflected at runtime:
- Inputs/outputs are discoverable for UI.
- Event payload schemas are inspectable.
- Constraints and protocols are visible to the user.

This enables stack inspectors, auto-wiring suggestions, and LLM-based modifications.

### 5.2.14 Parametric types and constraints (the unification principle)

The entire type system is built on parametric polymorphism. Instead of creating many specialized types, we compose a small set of generic foundations:

```
Stream<E>                        // replaces EventStream, NoteStream, GestureStream, etc.
Event<P>                         // replaces NoteEvent, ChordEvent, AutomationEvent, etc.
Voice<P extends Pitch>           // parametric over pitch system
Container<K, E>                  // replaces Pattern, Scene, Clip, Score, Take, Phrase
Lane<T>                          // replaces AutomationLane, ModulationLane, ExpressionLane
Rules<E, C>                      // replaces MelodyRules, HarmonyRules, RagaConstraint, etc.
Context<D, M>                    // replaces HarmonyContext, EngineContext, etc.
Card<A, B>                       // typed morphism
```

Cards can declare parametric constraints rather than concrete types:

```ts
// This card works for any pitch system
Transpose<P extends Pitch> : Stream<Event<Voice<P>>> -> Stream<Event<Voice<P>>>

// This card works for any event type
Quantize<E extends Event<any>> : Stream<E> -> Stream<E>

// Rules are parametric over event and context
type MelodyRules<P extends Pitch> = Rules<Event<Voice<P>>, ScaleContext>;
type VoiceLeadingRules<P extends Pitch> = Rules<Stream<Event<Voice<P>>>, VoicingContext>;
```

This parametric approach means:
1. **Fewer types to learn** - understand the 6 core generics, not 50 specialized types
2. **Better composability** - types compose through parameters, not inheritance
3. **Infinite extensibility** - new payload types automatically work with existing infrastructure
4. **Type inference** - the system can infer concrete types from usage

The type reduction table (from 2.0.3) shows how proliferated types map to parametric forms:

| Old (proliferated) | New (parametric) |
|--------------------|------------------|
| `NoteEvent` | `Event<Voice<MIDIPitch>>` |
| `MicrotonalNoteEvent` | `Event<Voice<MicrotonalPitch>>` |
| `CarnaticNoteEvent` | `Event<Voice<SwaraPitch>>` |
| `ChordEvent` | `Event<ChordPayload>` |
| `MelodyRules` | `Rules<Event<Voice<P>>, ScaleContext>` |
| `HarmonyRules` | `Rules<Event<ChordPayload>, ProgressionContext>` |
| `RagaConstraint` | `Rules<Event<Voice<SwaraPitch>>, RagaContext>` |
| `AutomationLane` | `Lane<number>` |
| `ModulationLane` | `Lane<Control>` |
| `Pattern` | `Container<"pattern", Event<any>>` |
| `HarmonyContext` | `Context<HarmonicSpec>` |

### 5.2.15 Type errors and recovery strategies

When a mismatch occurs, the system offers recoveries:

- Insert adapter (if available).
- Suggest a different card.
- Allow a temporary "Any" cast with a warning.

Errors are not silent. They are surfaced in the stack inspector and in-line on the deck.

### 5.2.16 End-user card packages and library insertion

Users do not need repository changes to add new cards. They create a card package (a "card pack") and load it into the library through the UI. The runtime validates, sandboxes, and indexes the pack.

Card pack structure (minimal):

```
my-card-pack/
  card.json            // manifest
  processor.ts         // optional logic, sandboxed
  ui.tsx               // optional editor UI
  assets/              // samples, presets, icons
```

The manifest declares:
- signature (inputs/outputs)
- params and schemas
- event kinds or port types (if any)
- protocols implemented
- behavior contract (emits/mutates/observes)
- effect manifest (reads/writes/latency/determinism)
- UI hints (if no custom UI is provided)

Loading flow:
1) User installs pack (drag folder, paste URL, or import from gallery).
2) Runtime validates manifest and sandbox permissions.
3) Optional: user approves capabilities (what it can read/write).
4) Card appears in the library with tags and category.
5) If the card defines new event kinds or port types, they are registered locally.

No core code changes are required. The pack is isolated, and all influence is declared through the behavior contract and effect manifest.

### 5.2.16.1 How a user creates new capabilities without rebuilding the repo

This is a programming languages problem as much as a product feature. The system solves it by treating cards as small, typed programs that run in a sandboxed runtime, compiled at install time, and linked via explicit interfaces.

The key properties:
- A user can define new types and behaviors locally.
- The host validates those definitions against a fixed, stable API.
- The card runs inside a sandboxed interpreter or WASM runtime.
- The card exposes only declared effects and capabilities.

This is how a new capability becomes a library item without rebuilding the core code.

### 5.2.16.2 The CardScript language (user-facing DSL)

Users write card logic in a restricted, typed DSL called CardScript. It is intentionally small and safe, and uses the parametric type system:

- No file or network access.
- Only pure functions plus explicit effect APIs.
- Strongly typed ports using parametric types (`Stream<Event<Voice<P>>>`, `Lane<T>`, etc.).
- Deterministic by default unless seeded.

Example CardScript using parametric types:

```ts
card "EuclidRhythm"<P extends Pitch> {
  signature: { 
    inputs: ["Control"], 
    outputs: ["Stream<Event<Voice<P>>>"] 
  }
  params: { 
    steps: "number", 
    pulses: "number", 
    rotate: "number",
    pitch: "P"  // parametric pitch
  }
  behavior: {
    run(ctx) {
      const pattern = euclid(ctx.params.steps, ctx.params.pulses, ctx.params.rotate);
      return toVoiceEvents<P>(pattern, ctx.params.pitch, ctx.timeGrid);
    }
  }
  effects: ["pure"]
}
```

CardScript is not the repo code. It is interpreted or compiled inside the app.

### 5.2.16.3 Interface checking and type inference

When a user loads a pack, the runtime:
- Parses the manifest.
- Typechecks the CardScript against the declared signature.
- Infers any generic types (e.g., EventStream<A>).
- Verifies that all event kinds and port types are registered or declared.

If the types do not match, the card is rejected with a readable error. This ensures user-defined cards cannot violate the type system.

### 5.2.16.4 Effects system and capability negotiation

Cards declare what they can do via an effect manifest:

```ts
effects: {
  reads: ["EventStream<NoteEvent>", "Transport.bpm"],
  writes: ["container.events"],
  creates: ["EventStream<GestureEvent>"],
  mutates: ["card.params"],
  deterministic: true
}
```

The host app presents a capability prompt on install:
- "This card writes events into containers."
- "This card reads transport tempo."
- "This card is stochastic and uses a random seed."

Users can deny or restrict capabilities, which the runtime enforces.

### 5.2.16.5 Compilation pipeline (no repo rebuild)

Card packs are compiled locally:

1) Parse manifest and CardScript.
2) Typecheck against the core API.
3) Compile to a sandbox bytecode or WASM module.
4) Register the card, event kinds, and port types in the local registry.

Because the compiler runs inside the app, no repository rebuild is required.

### 5.2.16.6 Sandbox runtime model

The sandbox runtime provides a stable "host API":

- `emit(events)` for EventStreams.
- `writeContainer(containerId, events)` for explicitly declared mutations.
- `readContainer(containerId)` for read-only access.
- `registerEventKind(schema)` for local event kinds.
- `registerPortType(definition)` for local port types.

All calls are permission-checked against the effect manifest. Unauthorized calls throw runtime errors and are logged.

### 5.2.16.7 Local registry and namespacing

User-defined types live in a local namespace:

- `user:<author>/<cardPack>/EventKind`
- `user:<author>/<cardPack>/PortType`

This prevents collisions with core types and other user packs. The registry can alias a user type to a known core type if a structural match exists.

### 5.2.16.8 Custom UI without core changes

Card packs can include UI components:

- UI is rendered in a sandboxed iframe or component boundary.
- The UI can only read/write through the declared params and events.
- If no custom UI is provided, the system auto-generates one from schemas.

This allows a user to add a novel notation editor or tuning map UI without touching the core repo.

### 5.2.16.9 Asset access and sample manipulation

Card packs can request typed access to asset types:

```ts
// Parametric asset access declaration
type AssetAccess<A> = {
  read: AssetKind[];
  write: AssetKind[];
  transform: Array<Card<A, A>>;
};

assets: AssetAccess<AudioBuffer> = {
  read: ["sample", "ir", "preset"],
  write: ["analysisCache"],
  transform: [NormalizeCard, TrimCard]
}
```

The runtime provides safe, parametric APIs:

```ts
// Parametric asset API
interface AssetAPI<A> {
  readSample(sampleId: SampleId): Promise<A>;
  writeAnalysis<F>(sampleId: SampleId, features: F): Promise<void>;
  transform<B>(asset: A, card: Card<A, B>): Promise<B>;
}
```

No direct file access is granted. This enables sample manipulation tools without repo changes.

### 5.2.16.10 Meta-cards as macros (structural edits)

When a user-defined card wants to change the deck graph, it emits a parametric patch:

```ts
// Parametric patch for meta-card structural edits
type MetaPatch = Patch<Graph<Card<any, any>>> & {
  addCard?: CardDefinition<any, any>;
  updateParams?: ParamPatch<any>[];
  rewire?: ConnectionPatch[];
  removeCard?: CardId[];
  insertAdapter?: { at: ConnectionId; adapter: Card<any, any> };
};

// Meta-card output with full provenance
metaOutput: MetaOutput<Graph<Card<any, any>>> = {
  patch: {
    addCard: { signature: Card<Stream<Event<any>>, Stream<Event<any>>> },
    updateParams: [{ path: "gain", value: 0.8 }],
    rewire: [{ from: cardA, to: cardB }]
  },
  preview: previewGraph,
  rollback: inversePatch,
  provenance: auditLog
}
```

The host validates the patch against parametric type rules and asks the user to approve it. This allows complex behavior (like automatic arrangement changes) without giving the card direct write access to the global state.

### 5.2.16.11 Practical authoring flow (no rebuild)

A user adds a new capability by:

1) Opening the "Card Forge" in the app.
2) Selecting a template (generator, transform, view, meta-card).
3) Defining parametric inputs/outputs and parameters with type constraints.
4) Writing CardScript logic or attaching a UI component.
5) Declaring required effects, capabilities, and behavior contract.
6) Clicking "Build" to compile into a sandbox module.
7) Installing it into the library with a category and tags.

The Card Forge provides parametric type assistance:

```ts
// Card Forge type templates
template Generator<P extends Pitch> {
  inputs: ["Context<any>"]
  outputs: ["Stream<Event<Voice<P>>>"]
  protocols: ["Schedulable"]
}

template Transform<E extends Event<any>> {
  inputs: ["Stream<E>"]
  outputs: ["Stream<E>"]
  protocols: ["Transformable"]
}

template MetaCard<S> {
  inputs: ["S"]
  outputs: ["Patch<S>"]
  protocols: ["Patchable", "Auditable"]
}
```

This flow requires no codebase rebuild, only local compilation and registration.

### 5.2.16.12 Making CardScript maximally powerful while safe

The goal is to let CardScript modify or add virtually anything about the DAW without giving it unrestricted authority. This is achieved by splitting power into layers and requiring every change to flow through typed, inspectable, and reversible channels.

Core strategy: maximize the *surface area of declarative control* while minimizing *implicit side effects*.

#### A) Make the host model fully programmable via parametric APIs

CardScript can only be powerful if the host model is programmable. Expose these surfaces as stable, parametric APIs:

- Events: `Stream<Event<P>>` — create, transform, and annotate event streams
- Containers: `Container<K, E>` — read/write through typed lenses
- Graph: `Patch<Graph<Card<any, any>>>` — propose stack and wiring changes
- UI: `UICapability<T>` — register panels, editors, renderers, and view overlays
- Transport: `Context<TransportSpec>` — read time map, emit tempo/meter events
- Automation: `Target<T>` and `Lane<T>` — register targets and write automation
- Assets: `AssetAPI<A>` — scoped access to samples, presets, and analysis caches
- Rules: `Rules<E, C>` — register and apply constraint systems

Every surface is exposed as a parametric capability, not a global.

#### B) Use declarative patches instead of direct mutation

CardScript does not mutate the DAW directly. It emits parametric patches:

```ts
patch<S> {
  updateContainer<K, E>(id: ContainerId, diff: Diff<Container<K, E>>)
  addCard<A, B>(definition: CardDefinition<A, B>)
  wire<T>(from: Port<T>, to: Port<T>)
  registerEventKind<P>(schema: EventSchema<P>)
  registerRules<E, C>(rules: Rules<E, C>)
}
```

The host validates patches, shows a preview, and only then commits. This gives maximal power with user control and auditability.

#### C) Capabilities-as-types (parametric capability tokens)

CardScript uses parametric capability tokens as typed values:

```ts
// Parametric capability types
capability ContainerWrite<K extends string, E extends Event<any>> 
  : Container<K, E> -> Patch<Container<K, E>>

capability GraphPatch<C extends Card<any, any>>
  : Graph<C> -> Patch<Graph<C>>

capability UIOverlay<T>
  : T -> UIComponent<T>

capability AutomationWrite<T>
  : Lane<T> -> void

capability RulesRegister<E, C>
  : Rules<E, C> -> void
```

If a script does not have a token, it cannot call the API. This is enforced at compile time and runtime.

#### D) Staged execution and approval gates

Powerful actions require user approval:
- preview stage: patches computed, not applied.
- commit stage: user confirms, patches applied.

This allows a CardScript to propose large structural changes (e.g., rearranging scenes) without silently doing so.

#### E) Multi-tier privilege levels

Card packs declare a privilege tier:

- Tier 0: pure Event transforms only.
- Tier 1: writes to containers and automation.
- Tier 2: proposes graph patches and UI changes.
- Tier 3: meta-cards that can restructure projects (requires explicit approval each time).

The host enforces tier limits and prompts users when installing.

#### F) Static analysis and effect inference

The compiler performs static analysis:
- infers which APIs are used
- confirms that declared effects match actual usage
- rejects scripts that attempt undeclared capabilities

This keeps CardScript safe even if authored by an LLM.

#### G) Determinism controls

By default, CardScript is deterministic:
- no random numbers unless a seed is provided
- no time-based entropy unless explicitly declared

Determinism flags are surfaced in the UI to support reproducible renders.

#### H) Resource budgets and time slicing

Each script runs with:
- CPU time budget per frame
- memory cap
- execution timeouts

If a script exceeds its budget, it yields or is throttled. This prevents a single card from destabilizing the DAW.

#### I) Safe UI extension model

Custom UIs run in a sandboxed component boundary:
- only read/write params and events
- no DOM access outside their frame
- no direct network or file access

This lets users add new notation editors or visualizers safely.

#### J) Versioned host API and compatibility contracts

CardScript targets a stable host API version:
- the host exposes adapters for older scripts
- deprecations are handled by explicit migration rules

This keeps user packs functional across updates without rebuilding the repo.

#### K) Composability by construction

Because all effects flow through typed ports and patches:
- new cards are composable by default
- structural compatibility is discoverable
- adapters can be synthesized

This is how CardScript remains both powerful and safe: all power is routed through the same typed, inspectable channels that the core uses.

### 5.2.16.13 CardScript core language specification (exact, minimal)

CardScript is a small, typed, capability-aware language designed to be:
- deterministic by default
- statically typechecked
- sandboxed at runtime
- simple enough for LLMs and end users

It is not JavaScript. It is a constrained language with a fixed standard library and a fixed host API.

#### A) Syntax (EBNF summary)

```txt
program     ::= (cardDef | protocolDef | typeDef)* ;
cardDef     ::= "card" string "{" cardBody "}" ;
cardBody    ::= signatureDecl paramsDecl? stateDecl? effectsDecl? behaviorDecl uiDecl? assetsDecl? ;
signatureDecl ::= "signature" ":" "{" "inputs" ":" typeList "," "outputs" ":" typeList "}" ;
paramsDecl  ::= "params" ":" "{" paramEntry* "}" ;
stateDecl   ::= "state" ":" "{" paramEntry* "}" ;
effectsDecl ::= "effects" ":" effectBlock ;
behaviorDecl ::= "behavior" ":" funcBlock ;
uiDecl      ::= "ui" ":" objectLit ;
assetsDecl  ::= "assets" ":" objectLit ;

protocolDef ::= "protocol" ident "{" protocolBody "}" ;
protocolBody ::= (methodSig ";")* ;

typeDef     ::= "type" ident "=" typeExpr ;
typeExpr    ::= ident | "EventStream" "<" typeExpr ">" | "Control" | "AudioBuffer" | "Pattern" | "Scene" | "Score" | "Any" | "{" fieldList "}" ;
fieldList   ::= ident ":" typeExpr ("," ident ":" typeExpr)* ;
```

#### B) Type system (core)

Primitive types:
- number, string, boolean
- array<T>
- map<K,V>

Parametric musical types (the six core generics):
- `Event<P>` - event with payload type P
- `Stream<E>` - sequence of events (replaces EventStream, NoteStream, etc.)
- `Container<K, E>` - named context (replaces Pattern, Scene, etc.)
- `Lane<T>` - temporal value projection (replaces AutomationLane, etc.)
- `Voice<P extends Pitch>` - sounding entity
- `Rules<E, C>` - constraints over events (replaces MelodyRules, HarmonyRules, etc.)

Additional types derived from generics:
- `Control` = `Lane<number>` alias
- `AudioBuffer`
- `Context<D, M>` - context with data and meta

Structural typing is used for objects:
- `{ pitch: number, velocity: number }` is compatible with `{ pitch: number, velocity: number, articulation: string }`

Generics:
- `Stream<E>` is parameterized over event type
- Functions can be generic: `Quantize<E> : Stream<E> -> Stream<E>`
- `Rules<E, C>` is parameterized over event and context types

Type aliases for convenience:
```ts
type NoteEvent = Event<Voice<MIDIPitch>>;
type MicrotonalNoteEvent<P extends Pitch> = Event<Voice<P>>;
type ChordEvent = Event<ChordPayload>;
type Pattern = Container<"pattern">;
type AutomationLane = Lane<number>;
type MelodyRules<P extends Pitch> = Rules<Event<Voice<P>>, ScaleContext>;
```

#### C) Functions and purity

CardScript functions are pure unless they call an effectful host API.

```ts
fn transpose(events: EventStream<NoteEvent>, semis: number) -> EventStream<NoteEvent>
```

The compiler enforces effect annotations:
- pure functions cannot call effectful APIs
- effectful functions must declare which capability tokens they use

#### D) Effects and annotations

Effects are declared in the card manifest:

```ts
effects: {
  reads: ["EventStream<NoteEvent>", "Transport.bpm"],
  writes: ["container.events"],
  creates: ["EventStream<GestureEvent>"],
  mutates: ["card.params"],
  deterministic: true
}
```

The compiler checks that the behavior uses only declared effects.

#### E) Host API (minimal core, parametric)

CardScript can only call the host API via parametric capability tokens:

```ts
// Parametric capability tokens
cap ContainerRead<K extends string, E extends Event<any>>
cap ContainerWrite<K extends string, E extends Event<any>>
cap GraphPatch<C extends Card<any, any>>
cap UIOverlay<T>
cap AssetRead<A>
cap AutomationWrite<T>
cap RulesApply<E, C>

// Host API with parametric types
fn readContainer<K, E>(
  cap: ContainerRead<K, E>, 
  id: ContainerId
) -> Container<K, E>

fn writeContainer<K, E>(
  cap: ContainerWrite<K, E>, 
  id: ContainerId, 
  diff: Diff<Container<K, E>>
) -> void

fn emitEvents<E extends Event<any>>(
  events: Stream<E>
) -> void

fn proposePatch<C extends Card<any, any>>(
  cap: GraphPatch<C>, 
  patch: Patch<Graph<C>>
) -> void

fn registerEventKind<P>(
  schema: EventSchema<P>
) -> void

fn applyAutomation<T>(
  cap: AutomationWrite<T>,
  target: Target<T>,
  lane: Lane<T>
) -> void

fn applyRules<E, C>(
  cap: RulesApply<E, C>,
  events: Stream<E>,
  rules: Rules<E, C>,
  context: C
) -> Stream<E>
```

If a card lacks a capability token, it cannot compile or run.

#### F) Standard library (selected)

All library functions use parametric types:

- `mapStream<E, F>(Stream<E>, fn: E -> F) -> Stream<F>`
- `filterStream<E>(Stream<E>, predicate: E -> boolean) -> Stream<E>`
- `quantize<E extends Event<any>>(Stream<E>, grid) -> Stream<E>`
- `euclid(steps, pulses, rotate) -> array<boolean>`
- `toVoiceEvents<P extends Pitch>(pattern, pitch: P, grid) -> Stream<Event<Voice<P>>>`
- `applyRules<E, C>(Stream<E>, Rules<E, C>, context: C) -> Stream<E>`
- `transpose<P extends Pitch>(Stream<Event<Voice<P>>>, semitones) -> Stream<Event<Voice<P>>>`

The standard library is fixed; user packs cannot inject new primitives.

#### G) Execution model

- Behavior code runs in a deterministic VM or WASM runtime.
- Inputs are snapshots (no shared mutable state).
- Outputs are events, audio, or patches, never direct mutations.

#### H) Example: a safe generator

```ts
card "EuclidRhythm" {
  signature: { inputs: ["Control"], outputs: ["EventStream<NoteEvent>"] }
  params: { steps: "number", pulses: "number", rotate: "number" }
  effects: { reads: ["Control"], writes: [], creates: ["EventStream<NoteEvent>"], deterministic: true }
  behavior: {
    run(ctx) {
      const pat = euclid(ctx.params.steps, ctx.params.pulses, ctx.params.rotate);
      return toNoteEvents(pat, ctx.timeGrid);
    }
  }
}
```

#### I) Lexical layer and literals

CardScript is deliberately small in its lexical surface:

- identifiers: [A-Za-z_][A-Za-z0-9_]*
- strings: double-quoted UTF-8 strings, with escapes
- numbers: decimal and fixed-point only (no floats with exponent)
- comments: // line and /* block */

There is no reflection, eval, or dynamic import.

#### J) Full grammar (expanded EBNF)

```txt
program       ::= (cardDef | protocolDef | typeDef | importDef)* ;
importDef     ::= "use" string "as" ident ";" ;

cardDef       ::= "card" string "{" cardBody "}" ;
cardBody      ::= signatureDecl paramsDecl? stateDecl? effectsDecl? behaviorDecl uiDecl? assetsDecl? ;

signatureDecl ::= "signature" ":" "{" "inputs" ":" typeList "," "outputs" ":" typeList "}" ;
paramsDecl    ::= "params" ":" "{" paramEntry* "}" ;
stateDecl     ::= "state" ":" "{" paramEntry* "}" ;
effectsDecl   ::= "effects" ":" effectBlock ;
behaviorDecl  ::= "behavior" ":" funcBlock ;
uiDecl        ::= "ui" ":" objectLit ;
assetsDecl    ::= "assets" ":" objectLit ;

protocolDef   ::= "protocol" ident "{" protocolBody "}" ;
protocolBody  ::= (methodSig ";")* ;

typeDef       ::= "type" ident "=" typeExpr ;
typeExpr      ::= ident
               | "EventStream" "<" typeExpr ">"
               | "Control"
               | "AudioBuffer"
               | "Pattern" | "Scene" | "Score"
               | "Any"
               | "{" fieldList "}" ;

fieldList     ::= ident ":" typeExpr ("," ident ":" typeExpr)* ;
typeList      ::= "[" typeExpr ("," typeExpr)* "]" ;
paramEntry    ::= ident ":" typeExpr ("," ident ":" typeExpr)* ;

funcBlock     ::= "{" funcDef+ "}" ;
funcDef       ::= "run" "(" "ctx" ")" block ;
block         ::= "{" stmt* "}" ;
stmt          ::= letStmt | ifStmt | forStmt | returnStmt | exprStmt ;
```

#### K) Module system and imports

CardScript has no filesystem access. Modules are declared within the card pack and imported by name:

```ts
use "stdlib/notes" as Notes;
use "stdlib/rhythm" as Rhythm;
```

Only whitelisted standard modules are available. User packs cannot import arbitrary code outside the pack.

#### L) Type inference and unification rules

CardScript uses local type inference:
- function parameters are inferred from usage
- generic types are inferred by unification
- explicit annotations override inference

Unification rules are structural:
- objects with extra fields are compatible with narrower types
- EventStream<A> unifies with EventStream<B> only if A unifies with B
- Any unifies with everything, but emits a warning

#### M) Effect typing (formal)

Every function has an effect row:

```
fn f(x: T) -> U ! {reads: R, writes: W, creates: C}
```

The compiler infers the row from host API calls. The card's declared effects must be a superset of the inferred effects. If not, compilation fails.

#### N) Memory model and immutability

All CardScript data is immutable by default:
- arrays and objects are persistent data structures
- update operations return new values

This ensures that sandbox execution is deterministic and safe under parallel evaluation.

#### O) Scheduling model

CardScript runs in discrete ticks:
- the host calls run(ctx) with an event window and time slice
- ctx contains the time range, params, and input streams

The script cannot access real time. It only sees the scheduled time window.

#### P) Error model and fault isolation

Errors are handled in three layers:
- compile-time errors: type or capability mismatches
- runtime errors: sandbox exceptions (caught and logged)
- validation errors: invalid output (rejected by host)

If a card fails, the host replaces its output with silence or an empty stream and surfaces an error badge in the UI.

#### Q) Debugging hooks (safe)

Debugging is opt-in and capability-checked:

- `debug.log(value)` writes to a sandbox console
- `debug.trace(eventId)` logs event transformations

Debug output is rate-limited to prevent spam.

#### R) Expanded standard library (core groups)

All functions use parametric types:

Rhythm:
- `euclid(steps, pulses, rotate) -> array<boolean>`
- `swing<E extends Event<any>>(Stream<E>, amount) -> Stream<E>`
- `grooveTemplate(name) -> Lane<number>`
- `subdivide(pattern, ratio) -> array<boolean>`
- `rotatePattern<E>(Stream<E>, steps) -> Stream<E>`

Pitch:
- `transpose<P extends Pitch>(Stream<Event<Voice<P>>>, semis) -> Stream<Event<Voice<P>>>`
- `scaleMap<P extends Pitch>(Stream<Event<Voice<P>>>, Scale<P>) -> Stream<Event<Voice<P>>>`
- `microtune<P extends Pitch>(Stream<Event<Voice<P>>>, centsTable) -> Stream<Event<Voice<P>>>`
- `quantizePitch<P extends Pitch>(Stream<Event<Voice<P>>>, Scale<P>) -> Stream<Event<Voice<P>>>`

Events:
- `mapStream<E, F>(Stream<E>, fn: E -> F) -> Stream<F>`
- `filterStream<E>(Stream<E>, predicate: E -> boolean) -> Stream<E>`
- `groupBy<E, K>(Stream<E>, keyFn: E -> K) -> map<K, Stream<E>>`
- `mergeStreams<E>(Stream<E>, Stream<E>) -> Stream<E>`
- `splitEvent<P>(Event<P>, atTick) -> [Event<P>, Event<P>]`

Automation:
- `curve<T>(points: Point<T>[]) -> Lane<T>`
- `ramp<T>(start: T, end: T, length) -> Lane<T>`
- `hold<T>(value: T, length) -> Lane<T>`
- `interpolate<T>(Lane<T>, time) -> T`

Rules:
- `combineRules<E, C>(Rules<E, C>, Rules<E, C>) -> Rules<E, C>`
- `applyRules<E, C>(Stream<E>, Rules<E, C>, ctx: C) -> Stream<E>`

Utilities:
- clamp, lerp, range, seedRandom

No user-defined native extensions are allowed. All extensions must be expressed in CardScript.

#### S) Host API (expanded)

Host APIs are limited to explicit capability tokens and use parametric types:

```ts
// Container APIs use Container<K, E>
fn readContainer<K, E>(cap: ContainerRead<Container<K, E>>, id: string) -> Container<K, E>
fn writeContainer<K, E>(cap: ContainerWrite<Container<K, E>>, id: string, diff: ContainerDiff<E>) -> void

// Stream APIs use Stream<E>
fn emitEvents<E>(events: Stream<E>) -> void
fn emitAutomation<T>(lanes: Lane<T>[]) -> void

// Graph and patch APIs
fn proposePatch(cap: GraphPatch, patch: GraphDiff) -> void

// Registry APIs for extensibility
fn registerPayloadType<P>(schema: PayloadSchema<P>) -> void
fn registerPortType<T>(def: PortTypeDef<T>) -> void
fn registerTarget<T>(def: TargetDef<T>) -> void

// Rules APIs
fn registerRules<E, C>(rules: Rules<E, C>) -> void

// UI APIs
fn requestUIOverlay(cap: UIOverlay, uiDef: UIDef) -> UIHandle
```

All API calls are audited and logged.

#### T) Event schema registration (details)

Event schemas are structural:

```ts
EventSchema {
  kind: "syllable",
  fields: { text: "string", stress: "number" },
  defaultMergePolicy: "union"
}
```

Schema registration is local to the pack and namespaced to prevent collisions.

#### U) Deterministic randomness

Randomness is only available through seeded APIs:

```
rand(seed, index) -> number
```

The seed is part of params, so render output can be reproduced exactly.

#### V) Testing harness

Card packs can include tests:

```ts
test "euclid length" {
  expect(length(euclid(16, 5, 0)) == 16);
}
```

Tests run in the same sandbox and can be executed in the UI. This allows end users to validate their card without rebuilding.

#### W) Compatibility and versioning

Each card declares:
- hostApiVersion
- cardVersion
- migration steps for params

The host provides compatibility shims where possible, but scripts that target a newer API are blocked until the host updates.

#### X) Operational semantics (informal)

CardScript evaluation is stream-oriented:

1) The host selects input windows (event slices, audio blocks).
2) CardScript run(ctx) is invoked with immutable inputs.
3) The script returns outputs (events, audio, patches).
4) The host validates outputs and merges them into the graph.

There is no shared mutable state between cards. State is explicitly stored in card state and updated via return values.

#### Y) Patch language (for meta-cards)

Meta-cards emit patches in a restricted structural language:

```ts
patch {
  addCard({ type: "RenderInstrument", id: "card-123", params: {...} })
  removeCard("card-456")
  updateParams("card-789", { cutoff: 0.7 })
  rewire({ from: "card-123.out", to: "card-890.in" })
}
```

Patches are declarative. The host checks:
- type compatibility for new wiring
- uniqueness of ids
- resource access based on capabilities

#### Z) UI schema contract (for custom editors)

Card packs can declare UI schemas:

```ts
uiSchema {
  widgets: [
    { type: "knob", param: "cutoff", min: 0, max: 1 },
    { type: "grid", param: "pattern", rows: 16, cols: 4 }
  ]
}
```

The host uses this schema to render a default UI if no custom component is provided.

#### AA) Serialization and project persistence

All CardScript artifacts are serializable:
- params
- state snapshots (optional)
- registered event kinds
- patches and diffs

Serialization is explicit and versioned, so projects can be shared without embedding arbitrary code.

#### AB) Security invariants (compile-time guarantees)

CardScript guarantees:
- no access to network or filesystem
- no access to global environment or OS
- no reflection or code evaluation
- all side effects are declared and capability-checked

These invariants are enforced by the compiler and the sandbox runtime.

#### AC) Concurrency and determinism

The host may execute cards in parallel. CardScript is safe under parallel execution because:
- inputs are immutable
- outputs are pure values or patches
- state is isolated to the card instance

This enables multi-core rendering without nondeterministic interference.

#### AD) Error reporting and diagnostics

Errors include:
- source span and card name
- inferred vs declared effect mismatch
- type mismatch explanation

Diagnostics are surfaced in the UI so end users can correct pack errors.

#### AE) Formal typing rules (selected)

Typing judgments:

```
Gamma |- e : T
```

Selected rules:

```
Gamma(x) = T
----------------
Gamma |- x : T
```

```
Gamma |- e1 : EventStream<T>
Gamma |- f : (T -> U)
----------------------------
Gamma |- mapEvents(e1, f) : EventStream<U>
```

```
Gamma |- e1 : EventStream<T>
Gamma |- e2 : EventStream<T>
--------------------------------
Gamma |- mergeStreams(e1, e2) : EventStream<T>
```

```
Gamma |- p : Pattern
--------------------
Gamma |- toEvents(p) : EventStream<Any>
```

These rules are structural and extend naturally to user-defined types.

#### AF) Effect inference (algorithm sketch)

Effect inference is a pass over the AST:

1) Assign empty effect rows to all functions.
2) For each host API call, add its effect to the current row.
3) For each function call, union the callee's effect row.
4) Propagate until fixpoint.

The inferred row must be a subset of the declared card effects.

#### AG) Resource budgeting model ("gas")

Each script is charged a "gas" budget per render frame:

- every host API call costs a fixed amount
- every event emitted costs proportional gas
- complex operations (sorting, grouping) cost more

If gas is exceeded:
- the script is interrupted
- output is discarded for that frame
- a throttle warning is shown to the user

#### AH) Determinism proofs (practical)

The host enforces determinism by:
- removing access to wall-clock time
- requiring explicit seeds for randomness
- ensuring input windows are deterministic

This allows identical renders for the same project state.

#### AI) Structured logging and telemetry

Cards can emit structured logs:

```
log.info("density", { value: 0.7 })
```

Logs are scoped to the card and rate-limited. They do not escape the sandbox unless the user exports them.

#### AJ) Formal semantics appendix (small-step core)

This appendix gives an informal but rigorous semantics for CardScript. It is meant to be implementable and to support proofs of safety and determinism.

Syntactic categories (core):

```
v  ::= number | string | boolean | array | record | lambda | EventStream | AudioBuffer
e  ::= v | x | e(e) | let x = e in e | if e then e else e | for x in e do e | callHost(api, args)
s  ::= let x = e | if e then s else s | for x in e do s | return e | expr e
P  ::= cardDef*
```

Runtime configuration:

```
<e, rho, sigma, C, g> -> <e', rho', sigma', C, g'>
```

Where:
- rho is the immutable environment (variables -> values)
- sigma is the card state store (state fields -> values)
- C is the capability set (typed tokens)
- g is the remaining gas budget

Selected rules:

Variable:

```
rho(x) = v
-----------------
<x, rho, sigma, C, g> -> <v, rho, sigma, C, g>
```

Let-binding:

```
<e1, rho, sigma, C, g> -> <v1, rho, sigma, C, g'>
----------------------------------------------------
<let x = e1 in e2, rho, sigma, C, g> -> <e2, rho[x->v1], sigma, C, g'>
```

Host call (capability check + gas):

```
capRequired(api) = cap
cap in C, cost(api) <= g
------------------------------------------------------
<callHost(api, args), rho, sigma, C, g> -> <result, rho, sigma, C, g - cost(api)>
```

If cap is not in C, evaluation steps to a runtime error with a capability violation.

EventStream map (pure):

```
<mapEvents(es, f), rho, sigma, C, g> -> <es', rho, sigma, C, g - cost(map)>
```

State update is explicit:
- run(ctx) returns { output, stateDelta }
- the host merges stateDelta into sigma

#### AJ.1 Progress and preservation (sketch)

Progress:
- A well-typed expression either is a value or can take a step, unless it requires a capability it does not have (in which case it fails safely).

Preservation:
- If Gamma |- e : T and e -> e', then Gamma |- e' : T.

This ensures no ill-typed outputs are produced by well-typed scripts.

#### AJ.2 Effect soundness (sketch)

If a function is inferred to have effect row E, and the declared effects are E', then execution is permitted only if E is a subset of E'. The compiler enforces E <= E', guaranteeing that no undeclared effect is exercised.

#### AJ.3 Determinism lemma (practical)

Given identical inputs (ctx, params, state) and identical seeds, and no capability that accesses wall-clock time, the result of run(ctx) is identical. Determinism follows from:
- immutable inputs
- pure standard library
- explicit seeded randomness
- no external IO

#### AJ.4 Safety theorem (practical)

A well-typed CardScript cannot:
- access the filesystem or network
- mutate the global host state
- execute code outside the sandbox

Because no primitive exists for those actions, and all host calls are capability-checked.

#### AJ.5 Patch application semantics (host-side)

Patches emitted by scripts are not applied directly. The host validates:
- type compatibility for wiring changes
- id uniqueness
- capability scopes
- resource budgets

Only validated patches are committed; invalid patches are rejected with an error.

#### AJ.6 Gas semantics (formalized)

Each evaluation step consumes gas:

```
g' = g - cost(step)
```

When g < 0, execution halts and output is discarded for that frame. This provides a total execution bound.

#### AJ.7 Concurrency safety

Because evaluation does not mutate shared state and uses immutable inputs, multiple cards can evaluate in parallel without race conditions.

#### AJ.8 Soundness of UI extensions

UI scripts never execute host mutations; they only bind to params/events. The UI surface is declarative and cannot directly access or mutate graph or container state.

#### AJ.9 Effect trace

The runtime maintains an effect trace for each run:
- which host APIs were called
- which resources were touched
- which outputs were emitted

This trace is used for debugging, auditing, and reproducibility.

#### AK) Host API reference (complete)

CardScript can only interact with the host through these APIs. All APIs require capability tokens. Each API call is logged and validated.

Event and stream APIs:

```ts
fn emitEvents(events: EventStream<Any>) -> void
fn emitAutomation(lanes: AutomationLane[]) -> void
fn emitAudio(buffer: AudioBuffer) -> void
```

Container APIs (requires ContainerRead/ContainerWrite):

```ts
fn readContainer(cap: ContainerRead<T>, id: string) -> T
fn writeContainer(cap: ContainerWrite<T>, id: string, diff: ContainerDiff) -> void
fn appendEvents(cap: ContainerWrite<T>, id: string, events: EventStream<Any>) -> void
fn replaceEvents(cap: ContainerWrite<T>, id: string, events: EventStream<Any>) -> void
fn createContainer(cap: ContainerWrite<EventContainer>, def: ContainerDef) -> string
fn deleteContainer(cap: ContainerWrite<EventContainer>, id: string) -> void
```

Graph and stack APIs (requires GraphPatch or MetaTransform):

```ts
fn proposePatch(cap: GraphPatch, patch: GraphDiff) -> void
fn previewPatch(cap: GraphPatch, patch: GraphDiff) -> PatchPreview
fn validatePatch(cap: GraphPatch, patch: GraphDiff) -> PatchReport
```

Event schema and port registration:

```ts
fn registerEventKind(schema: EventSchema) -> void
fn registerPortType(def: PortTypeDef) -> void
fn registerProtocol(def: ProtocolDef) -> void
```

Automation target registration:

```ts
fn registerAutomationTarget(def: AutomationTargetDef) -> void
fn writeAutomationTarget(cap: AutomationWrite, targetId: string, lane: AutomationLane) -> void
```

Transport APIs (requires TransportRead/TransportWrite):

```ts
fn readTransport(cap: TransportRead) -> TransportState
fn emitTempoEvent(cap: TransportWrite, bpm: number, atTick: number) -> void
fn emitMeterEvent(cap: TransportWrite, num: number, den: number, atTick: number) -> void
```

Asset APIs (requires AssetRead/AssetWrite):

```ts
fn listAssets(cap: AssetRead, kind: string) -> AssetSummary[]
fn readSample(cap: AssetRead, id: string) -> AudioBuffer
fn writeAnalysis(cap: AssetWrite, id: string, features: AnalysisData) -> void
fn storePreset(cap: AssetWrite, def: PresetDef) -> string
```

UI APIs (requires UIOverlay):

```ts
fn requestUIOverlay(cap: UIOverlay, uiDef: UIDef) -> UIHandle
fn registerViewRenderer(cap: UIOverlay, kind: string, renderer: UIRendererDef) -> void
fn registerInspectorPanel(cap: UIOverlay, def: InspectorPanelDef) -> void
```

Analysis APIs (requires AnalysisRead/AnalysisWrite):

```ts
fn readAnalysis(cap: AnalysisRead, id: string) -> AnalysisData
fn emitAnalysis(cap: AnalysisWrite, data: AnalysisData) -> void
```

Logging APIs (requires Debug):

```ts
fn logInfo(msg: string, data: record) -> void
fn logWarn(msg: string, data: record) -> void
fn logError(msg: string, data: record) -> void
```

All host APIs are versioned and backward-compatible where possible.

#### AL) Standard library reference (complete)

The standard library is fixed and versioned. It is grouped by module for clarity.

Core:
- clamp(x, lo, hi) -> number
- lerp(a, b, t) -> number
- range(n) -> array<number>
- map(arr, fn) -> array
- filter(arr, fn) -> array
- fold(arr, init, fn) -> value

Random (seeded):
- rand(seed, index) -> number
- randInt(seed, index, min, max) -> number

Time:
- barsToTicks(bars, ppq, timeSig) -> number
- ticksToBars(ticks, ppq, timeSig) -> number
- quantizeTicks(ticks, grid) -> number

Events:
- mapEvents<T>(EventStream<T>, fn) -> EventStream<T>
- filterEvents<T>(EventStream<T>, predicate) -> EventStream<T>
- mergeStreams<T>(EventStream<T>, EventStream<T>) -> EventStream<T>
- splitEvent<T>(event, atTick) -> [Event<T>, Event<T>]
- sortEvents<T>(EventStream<T>) -> EventStream<T>
- groupByKind(EventStream<Any>) -> map<string, EventStream<Any>>

Rhythm:
- euclid(steps, pulses, rotate) -> array<boolean>
- swing(pattern, amount) -> array<boolean>
- grooveTemplate(name) -> array<number>
- subdivide(pattern, ratio) -> array<boolean>

Pitch:
- transpose(events, semis) -> EventStream<NoteEvent>
- scaleMap(events, scale) -> EventStream<NoteEvent>
- microtune(events, centsTable) -> EventStream<NoteEvent>

Automation:
- ramp(start, end, length) -> AutomationLane
- hold(value, length) -> AutomationLane
- interpolate(points, curve) -> AutomationLane

Analysis helpers:
- centroid(buffer) -> number
- rms(buffer) -> number
- onsetDetect(buffer, threshold) -> array<number>

Utilities:
- unique(arr) -> array
- flatten(arr) -> array
- zip(a, b) -> array<[a,b]>

All functions are pure. Any function requiring IO or state must be provided via the host API and capability tokens.

### 5.2.16.14 Capability lattice (formal safety model)

Capabilities form a lattice so the system can reason about privilege levels and safely compose packs.

Partial order (<= means "no more powerful than"):

```
None
  <= ReadOnly
  <= EventWrite
  <= ContainerWrite
  <= GraphPatch
  <= MetaTransform
```

Definitions:
- ReadOnly: can read containers and events, no writes.
- EventWrite: can emit new EventStreams but not write into containers.
- ContainerWrite: can apply diffs to containers (requires approval).
- GraphPatch: can propose wiring/stack changes (requires approval).
- MetaTransform: can propose deck-level edits (highest privilege, approval each time).

Capability tokens are typed:

```
ContainerWrite<Pattern> <= ContainerWrite<EventContainer>
GraphPatch <= MetaTransform
```

This allows precise constraints:
- A card can be granted ContainerWrite<Pattern> but not ContainerWrite<Score>.
- A UI-only card gets ReadOnly + UIOverlay, nothing else.

#### Examples of capability grants

Example A: Note humanizer
- Capabilities: ReadOnly + EventWrite
- Can read events and emit a transformed stream, but cannot write containers.

Example B: Auto-arranger (meta-card)
- Capabilities: ReadOnly + GraphPatch + MetaTransform
- Can propose scene reordering and stack rewiring, but only via patches.

Example C: Tuning mapper
- Capabilities: ReadOnly + EventWrite
- Pure transform, no container writes.

#### Enforcement

- The compiler rejects any CardScript that uses a capability it does not declare.
- The runtime rejects any patch that exceeds granted capability.
- The UI prompts the user when a pack requests a higher tier than it currently has.

#### 5.2.16.14.1 Lattice operations (join/meet)

Capabilities form a join-semilattice:

- join (A ∨ B) = least capability that includes both A and B
- meet (A ∧ B) = most restrictive capability shared by both

This is used when stacking or composing cards:
- the composed card inherits the join of its components

#### 5.2.16.14.2 Scoped capabilities

Capabilities can be scoped to specific resources:

- ContainerWrite<Pattern:drums>
- AssetRead<Sample:pack-01>
- AutomationWrite<card:mono-synth.cutoff>

This prevents a card from touching anything outside its scope.

#### 5.2.16.14.3 Time-bounded and session-bounded caps

Capabilities can expire:

- valid for this session only
- valid for N minutes
- valid until project close

This allows "temporary trust" for experimental cards.

#### 5.2.16.14.4 Delegation and revocation

Capabilities can be delegated by the user:
- delegate ContainerWrite<Pattern:drums> to a specific card
- revoke at any time, which immediately blocks further writes

Revocation is enforced at runtime and recorded in the audit log.

#### 5.2.16.14.5 Policy language for approval

The host uses a small policy language:

```
allow if cap <= ContainerWrite<Pattern:drums>
deny if cap == MetaTransform and pack is unsigned
```

Users can define default policies so they are not prompted repeatedly.

#### 5.2.16.14.6 Trust tiers and signatures

Card packs can be signed:
- unsigned packs default to low-tier capabilities
- signed packs can request higher tiers if the user trusts the signer

Signature verification happens before capabilities are granted.

#### 5.2.16.14.7 Capability inference

The compiler infers actual capability usage and compares it to declared caps:
- if declared > used, warn (over-scoped)
- if used > declared, reject

This keeps packs honest even if written by LLMs.

#### 5.2.16.14.8 Audit log and replay

Every effectful action emits a log entry:
- card id
- capability used
- resource touched
- diff or patch applied

Logs can be replayed or reverted for safety and debugging.

#### 5.2.16.14.9 Capability composition in stacks

When cards are composed:
- serial composition uses the join of capabilities
- parallel composition uses the join of capabilities
- view-only cards can remain ReadOnly if no effectful APIs are used

This ensures the composed stack never exceeds the least upper bound of its parts.

#### 5.2.16.14.10 Capability polymorphism

Cards can be capability-polymorphic:

```
card "EventViewer" {
  requires: ReadOnly
}
```

The host can then grant the minimal capability required for the card to run. If a card later requests more, it must be re-approved.

#### 5.2.16.14.11 Separation of duties

High-privilege actions are separated:
- GraphPatch can be granted without ContainerWrite
- ContainerWrite can be granted without MetaTransform

This allows fine-grained control rather than a single "admin" capability.

#### 5.2.16.14.12 Capability prompts and UX rules

Capability prompts are explicit and specific:
- "This card can write events into pattern 'Drums A'."
- "This card can propose stack rewiring."

The UI shows a diff preview for any action beyond EventWrite.

#### 5.2.16.14.13 Capability revocation semantics

Revocation is immediate:
- current execution finishes
- future writes are blocked
- pending patches are invalidated

The audit log notes the revocation event.

#### 5.2.16.14.14 Capability inheritance and pack updates

When a pack updates:
- new capabilities must be approved again
- unchanged capabilities remain active

This prevents silent privilege escalation.

#### 5.2.16.14.15 Capability tokens as affine resources

Capability tokens are affine: they can be used multiple times but cannot be forged.

- tokens are provided by the host
- tokens can be revoked or time-limited
- tokens cannot be created by CardScript

This prevents a card from self-escalating permissions.

#### 5.2.16.14.16 Capability to effect mapping

Each capability maps to an allowed effect set:

```
ReadOnly        -> reads only
EventWrite      -> creates EventStream
ContainerWrite  -> writes container diffs
GraphPatch      -> emits graph patches
MetaTransform   -> emits deck-level patches
```

If a card declares an effect not permitted by its capabilities, compilation fails.

#### 5.2.16.14.17 Least-privilege defaults

When installing a pack:
- the host proposes the minimal capability set required by the script
- the user can grant more, but is warned

This nudges users toward least-privilege installation.

#### 5.2.16.14.18 Capability budgeting in shared projects

In collaborative projects:
- capabilities can be scoped per user
- a card may have different capabilities for different collaborators
- changes are attributed to the user who approved the capability

This allows shared projects without giving every collaborator admin-level power.

### 5.2.17 Twenty end-user card examples beyond standard DAWs

Each example below is inserted via a card pack. The pack declares its signature, schemas, and behavior contract, and then appears in the library. The repo code remains unchanged.

Example 1: Just Intonation Tuning Mapper
- What it is: A tuning card that maps incoming pitch to a just intonation lattice.
- Inputs/outputs: `Stream<Event<Voice<MIDIPitch>>> -> Stream<Event<Voice<JustPitch>>>`.
- User pack: defines a `TuningTable<JustPitch>` param and a microtonal pitch schema.
- Library insertion: register a new "TuningMap" card with UI hints (grid editor for ratios).

Example 2: Scala/KBM Importer
- What it is: Loads .scl/.kbm files and applies them as tuning rules.
- Inputs/outputs: `Control -> Stream<Event<Voice<MicrotonalPitch>>>` or transform.
- User pack: includes file parser and a custom editor to visualize scale steps.
- Library insertion: the pack registers a `MicrotonalPitch` type and adapters to `Voice<MIDIPitch>`.

Example 3: Gamelan Tuning and Instrument Layout
- What it is: Defines a pelog/slendro tuning and a multi-part instrument layout.
- Inputs/outputs: `Stream<Event<Voice<MIDIPitch>>> -> Stream<Event<Voice<GamelanPitch>>>`.
- User pack: includes UI to map lanes to saron, bonang, gong roles.
- Library insertion: adds a "GamelanNotation" view card plus a tuning transform using `Rules<Event<Voice<GamelanPitch>>, GamelanContext>`.

Example 4: Carnatic Gamaka Sculptor
- What it is: Converts ornament labels into pitch curves and expression events.
- Inputs/outputs: `Stream<Event<Voice<SwaraPitch>>> -> Stream<Event<Voice<SwaraPitch>>> + Lane<PitchBend>`.
- User pack: defines gamaka presets using `Rules<Event<Voice<SwaraPitch>>, RagaContext>`.
- Library insertion: registers `GamakaPayload` and a renderer for notation view.

Example 5: Konnakol-to-Rhythm Generator
- What it is: Converts syllables into rhythmic events.
- Inputs/outputs: `Stream<Event<KonnakolPayload>> -> Stream<Event<Voice<P>>>`.
- User pack: defines `KonnakolPayload` schema and timing `Rules<Event<KonnakolPayload>, TalaContext>`.
- Library insertion: includes a syllable editor and adapter to voice events.

Example 6: Microtonal Piano Roll View
- What it is: A view card that displays 19-TET or 31-TET lanes.
- Inputs/outputs: `Stream<Event<Voice<MicrotonalPitch>>> -> Stream<Event<Voice<MicrotonalPitch>>>` (view-only).
- User pack: supplies a custom UI with `Track<"pattern", E, Event<Voice<MicrotonalPitch>>>`.
- Library insertion: adds a new view card with UI-only behavior contract (no mutations).

Example 7: Gesture-based Conductor
- What it is: Camera or controller gestures drive tempo and dynamics.
- Inputs/outputs: `Control -> Lane<number>[] + Stream<Event<TempoPayload>>`.
- User pack: uses a sandboxed input bridge and emits tempo/meter events.
- Library insertion: declares effect manifest that writes to transport targets only.

Example 8: AI Phrase Companion (call-and-response)
- What it is: Generates responsive phrases from the current container.
- Inputs/outputs: `Stream<Event<Voice<P>>> -> Stream<Event<Voice<P>>>`.
- User pack: includes a generator with seed control, style params, and `Rules<E, StyleContext>`.
- Library insertion: behavior contract marks stochastic with explicit seed.

Example 9: Style Transfer for Melody
- What it is: Transforms a melody into a stylistic variant (e.g., "bebop").
- Inputs/outputs: `Stream<Event<Voice<P>>> -> Stream<Event<Voice<P>>>`.
- User pack: declares a "style" param and `Rules<Event<Voice<P>>, StyleContext>`.
- Library insertion: exposes a preview mode so users approve changes before commit.

Example 10: Concatenative Sample Mosaic
- What it is: Rebuilds audio or events using micro-sample fragments.
- Inputs/outputs: `AudioBuffer | Stream<Event<any>> -> AudioBuffer`.
- User pack: adds a `FragmentLibrary` asset type and spectral matching using `Analysis<SpectralPayload>`.
- Library insertion: registers a new analysis port type and adapter.

Example 11: Rhythmic Density Map
- What it is: A control card that densifies or sparsifies rhythms over time.
- Inputs/outputs: `Stream<Event<Voice<P>>> -> Stream<Event<Voice<P>>>`.
- User pack: exposes density `Lane<number>` and `Rules<E, DensityContext>`.
- Library insertion: declares a behavior contract that only mutates event lists.

Example 12: Harmonic Navigator
- What it is: A chord suggestion card that emits chord events and constraints.
- Inputs/outputs: `Control -> Stream<Event<ChordPayload>>`.
- User pack: registers `ChordPayload` type and chord palette UI.
- Library insertion: chord events can be expanded via `Rules<Event<ChordPayload>, VoicingContext>`.

Example 13: Storyboard Scoring Grid
- What it is: A film scoring view card with cue points and hit markers.
- Inputs/outputs: `Stream<Event<MarkerPayload>> -> Stream<Event<Voice<P>>>` (view + helper).
- User pack: includes a timeline UI and `CuePayload` schema.
- Library insertion: adds a new view card and marker payload type.

Example 14: Polytempo Layerer
- What it is: A container transform that remaps local tempo for a pattern.
- Inputs/outputs: `Container<"pattern"> -> Container<"pattern">` with tempo events.
- User pack: provides a tempo `Lane<number>` editor and override policy.
- Library insertion: registers a container transform card with explicit meta output.

Example 15: Breath-controlled Instrument Mapper
- What it is: Converts breath controller input into expression events.
- Inputs/outputs: `Control -> Lane<Expression>[] + Stream<Event<Voice<P>>>`.
- User pack: maps CC to `Target<Expression>` and supports calibration.
- Library insertion: declares control input protocol and target mappings.

Example 16: Spectral Gesture Painter
- What it is: A UI card that lets users paint spectral curves over time.
- Inputs/outputs: `Stream<Event<Voice<P>>> -> Lane<SpectralParam>[]`.
- User pack: provides a custom canvas UI and registers `Target<SpectralParam>`.
- Library insertion: uses automation registry to expose new targets.

Example 17: Adaptive Drum Kit Builder
- What it is: Learns velocity layers from samples and builds a kit.
- Inputs/outputs: `Control -> Stream<Event<Voice<DrumPitch>>> + SampleMapping`.
- User pack: includes an asset analyzer and a kit mapping UI.
- Library insertion: declares a sandboxed asset read permission only.

Example 18: Tabla Bol Grammar Engine
- What it is: Generates rhythmic patterns from tabla syllable grammar.
- Inputs/outputs: `Stream<Event<BolPayload>> -> Stream<Event<Voice<TablaPitch>>>`.
- User pack: defines `BolPayload` schema and `Rules<Event<BolPayload>, TalaContext>`.
- Library insertion: registers bol payload type and a notation renderer.

Example 19: Live Arrangement Director (meta-card)
- What it is: Suggests or applies scene order changes based on energy.
- Inputs/outputs: DeckState -> DeckState (meta diff).
- User pack: emits a patch proposal, not direct mutations.
- Library insertion: requires explicit user approval for scene reordering.

Example 20: Custom Notation System (user-defined glyphs)
- What it is: A notation view card with custom symbols (e.g., neumes, cipher).
- Inputs/outputs: EventStream<NoteEvent> -> EventStream<NoteEvent> (view-only).
- User pack: provides glyph set, rendering rules, and pitch naming scheme.
- Library insertion: registers a notation renderer and view card with no engine side effects.

---

## 5.3 Stacks and graphs

> **Noun Contract: Stack**
> - **Canonical meaning:** Serial/parallel composition of `Card<A,B>` transforms
> - **Not this:** UI StackComponent (vertical list) or DeckCardLayout modes
> - **Canonical type:** `Stack` in `cardplay/src/cards/stack.ts`
> - **See also:** [Stack Systems](./docs/canon/stack-systems.md)
> - **Analogy:** A "combo chain" of rule cards

### 5.3.1 Stacks
Stacks are compositional groups with explicit semantics. They can be serial (pipeline) or parallel (layer), plus tabs or switch modes for view logic.

```ts
type CardStack = {
  id: string;
  cardIds: string[];
  behavior: "layer" | "switch" | "tabs";
  compositionMode: "parallel" | "serial";
  activeCardIndex?: number;
  signature?: CardSignature;
  bindings?: PortBinding[];
};

type PortBinding = {
  from: { cardId: string; port: string };
  to: { cardId: string; port: string };
};
```

### 5.3.2 Type unification
- Serial: output type of card i must unify with input type of card i+1
- Parallel: inputs are shared, outputs are merged into a tagged union
- Tabs: outputs are from the active card only, but must be compatible to maintain stable types

Adapters can be auto-inserted:
- Pattern -> EventStream (PatternToEvents)
- EventStream -> AudioBuffer (RenderInstrument)
- AudioBuffer -> EventStream (AnalyzeAudio)

### 5.3.3 Graph mode
Stacks compose into a graph. Graph edges are explicit; a stack can be collapsed to a single node for usability.

### 5.3.4 Stack behaviors (serial, parallel, tabs, switch)

Stacks define how cards are combined:

- serial: output of card i feeds input of card i+1.
- parallel: all cards receive the same input, outputs are aggregated.
- tabs: only the active card is "hot", others are paused.
- switch: cards share a single output, active card can change based on events.

The behavior is stored in the stack so the same cards can be recomposed without re-wiring.

### 5.3.5 Stack signatures and inference

Each stack has an inferred signature derived from its cards:

- For serial stacks: input type is the input of the first card; output type is output of the last.
- For parallel stacks: input type is shared; output type is a tagged union or tuple.
- For tabs/switch: output type must unify across branches.

The inferred signature is shown in the UI for clarity and debugging.

### 5.3.6 Explicit bindings (manual wiring)

By default, stacks use implicit wiring (in order or parallel). When needed, explicit bindings can override:

```ts
bindings: [
  { from: { cardId: "card-a", port: "events" }, to: { cardId: "card-b", port: "in" } }
]
```

This enables advanced routing, such as:
- one card feeding two downstream cards
- manual sidechain routing
- multi-input cards (e.g., render + control)

### 5.3.7 Feedback and cycles

Graphs may include cycles (feedback loops). These are only allowed when:
- there is an explicit delay element, or
- the cycle is purely event-based and resolves at a higher time slice.

This prevents undefined behavior in audio feedback while still enabling creative routing.

### 5.3.8 Scheduling and latency

Stacks have explicit latency metadata:

- Each card declares a latency (in ticks or samples).
- Serial stacks sum latency.
- Parallel stacks align outputs to the maximum latency.

The engine uses this to align audio and event outputs precisely.

### 5.3.9 Stack inspectors and type hints

The UI includes a stack inspector that displays:
- input/output types
- adapter insertions
- latency and performance hints
- warnings when type compatibility is partial

This makes composition transparent rather than magic.

---

## Part VI) Views and surfaces

---

## 6.1 Unified sequencing surfaces

The system provides multiple sequencing views, all on the same underlying Events.

### 6.1.1 Shared invariants (every view must obey)

All sequencing views share the same invariants:
- They read from the same EventContainer.
- They write through the same event CRUD operations.
- They never store separate event lists.
- Edits are immediately visible across all other views.

### 6.1.2 Cross-view selection and linking

Selections are global and can be linked:
- Selecting a note in the tracker highlights it in piano roll and notation.
- Selecting a clip in the session view highlights its container in notation.
- Linked selection can be toggled for focused editing.

### 6.1.3 Event lanes and overlays

Every view can show multiple lanes:
- note lanes
- automation lanes
- meta lanes (markers, tempo, meter)
- analysis lanes (onset, spectral events)

Lanes are overlays on the same timeline, not separate data sources.

### 6.1.4 View-level transforms (non-destructive)

Views can apply temporary transforms for editing:
- quantization preview
- swing preview
- scale mapping

These are visual or interactive aids; they are committed only when the user confirms.

### 6.2 Tracker (Renoise-inspired)
- Rows are ticks; columns are event fields
- Can represent NoteEvents, automation, and meta events
- Pattern length and line-count are freeform

### 6.2.1 Columns and field mapping

Tracker columns are direct projections of event properties:

- Note column: pitch, octave, note-off.
- Instrument column: sample or instrument id.
- Volume column: velocity or gain.
- Effect columns: automation or parameter locks.
- Delay column: microtiming offset in ticks.

Each column maps to event properties so edits are reversible.

### 6.2.2 Note entry and row semantics

Row index maps to tick position using the pattern's grid definition. Editing a row creates or updates an Event:

- Enter note: create NoteEvent at row tick with default duration.
- Note-off: set duration so the note ends at the row.
- Chord entry: multiple note columns in the same row create overlapping NoteEvents.

### 6.2.3 Effects and parameter locks

Effect columns do not store magic values. They write automation events:

- A filter cutoff effect column writes an automation event targeting card.knob("cutoff").
- A retrigger effect column writes a gate trigger in the note's triggers list.

This makes tracker effects visible in other views as automation lanes.

### 6.2.4 Pattern operations

Trackers are fast because they allow structural operations:

- double/halve pattern length
- duplicate bars
- slice selection to a new pattern
- merge patterns

These are container-level transformations; they do not require per-event manual edits.

### 6.2.5 Conditional triggers and probability

Tracker conditions (e.g., 1/2, A:B, random) are stored as trigger conditions:

```ts
conditions: { probability: 0.5, every: 2 }
```

This makes conditional playback visible in every view.

### 6.2.6 Simple vs pro tracker

The tracker UI can hide complexity without changing data:

- Simple view: fewer columns, big cells, macro effects.
- Pro view: full column set, hex values, microtiming.

Both views edit the same events.

### 6.3 Piano roll
- Traditional pitch/time editing
- Automation lanes are just Event lanes
- Supports non-Western scales and microtonal pitch mapping

### 6.3.1 Pitch mapping and scale systems

The piano roll can map pitch lanes to:
- 12-TET MIDI notes
- microtonal scales (e.g., 19-TET, 24-TET)
- raga-based pitch sets (Sa, Ri, Ga, Ma, Pa, Dha, Ni)

The mapping is a view setting; the underlying Event stores pitch as a number plus optional tuning metadata.

### 6.3.2 Note editing and articulation

Note blocks represent NoteEvents:
- left edge = start time
- right edge = end time (duration)
- vertical position = pitch

Articulations are stored on the note payload (`Voice.articulation`):
- staccato, legato, slide, accent, ghost

### 6.3.3 Velocity and expression lanes

Below the grid, the piano roll displays lanes:
- velocity lane (NoteEvent velocity)
- expression lane (modulation index, vibrato depth)
- pitch bend lane (continuous pitch curves)

These lanes are projections of event properties, not separate data.

### 6.3.4 Microtiming and swing visualization

Microtiming offsets are shown as slight shifts from the grid. Swing is shown as alternating grid offsets.

This ensures that the piano roll reflects actual event timing, not an idealized grid.

### 6.3.5 Multi-note editing and chords

Chord blocks can be edited as:
- independent notes
- grouped chord events (if the user chooses to collapse them)

Collapsing creates a chord event with child notes, which can still be expanded back into individual note events.

### 6.4 Session view (Ableton-like)
- Clips are launchable EventContainers
- Scenes are rows of clips
- Scene launching emits Events (including meta and automation)

### 6.4.1 Clip grid and routing

The session grid is a UI for container references:
- Each cell is a clip (an EventContainer or a reference to one).
- Each column can be treated as a track lane for organization.
- Routing is defined by the stack or graph, not by the grid itself.

### 6.4.2 Launch quantization and follow actions

Clip and scene launches are quantized:
- Launch at next bar, beat, or tick.
- Quantization is stored as a meta event so it is editable.

Follow actions are represented as events:
- "After 4 bars, launch Scene B"
- "Randomize next scene"

### 6.4.3 Scene transitions as events

Scene transitions emit events that can be rendered or automated:
- scene.enter
- scene.exit
- clip.launch

This allows scene changes to trigger sound design or visual changes.

### 6.4.4 Recording into clips

Recording into a clip writes events into its container:
- Live pad hits become NoteEvents.
- Automation moves become automation events.
- Timing is recorded in ticks with microtiming offsets.

### 6.4.5 Clip envelopes and per-clip automation

Each clip can have an envelope:
- volume fade in/out
- filter sweeps

Clip envelopes are stored as automation events scoped to the clip container.

### 6.5 Notation view
- Engraved notation with flexible systems
- Supports Carnatic notation variants and other non-Western notations
- Maps to the same Event containers; notation is a view, not a separate data source

### 6.5.1 Notation mapping

Notation maps Event data into symbols:
- NoteEvent pitch and duration map to noteheads and stems.
- Articulations map to glyphs (staccato, tenuto, accent).
- Dynamics map to automation or expression events.

No additional note storage exists; notation is purely a projection.

### 6.5.2 Engraving rules and layout

The notation engine applies engraving rules:
- spacing based on rhythmic density
- collision avoidance for dynamics and articulations
- automatic beaming based on meter or tala cycles

The user can override layout, but overrides are stored as view metadata, not as event changes.

### 6.5.3 Dynamics and expressive markings

Dynamics can be stored as automation events targeting velocity or expression:
- p, mf, f become automation curves
- crescendos become ramped automation events

This keeps notation expressive while retaining a precise event model.

### 6.5.4 Microtonal notation

Microtonal pitches can be displayed with:
- custom accidentals
- cents offsets
- raga-specific note names

The underlying Event stores pitch as a numeric value with optional tuning metadata.

### 6.5.5 Carnatic notation support

Carnatic notation requires:
- svara (Sa, Ri, Ga, Ma, Pa, Dha, Ni)
- gamaka markings for ornamentation
- tala cycle markers (laghu, drutam, anudrutam)

These are represented as event properties and meta events so they can coexist with Western notation.

### 6.5.6 Score navigation and hierarchy

Notation can show:
- a single part
- a full score
- linked parts with shared markers

Navigation does not create new containers; it filters and aggregates existing ones.

### 6.6 Phrase and grammar view (RapidComposer-style)
- Phrase cards define motifs and grammar rules
- Phrases render to Event streams that can be edited in tracker or notation

All views are consistent: editing in one reflects immediately in the others.

### 6.6.1 Grammar definitions and phrase rules

Phrase view exposes a grammar language:
- symbols that represent intervals or rhythm cells
- transformation rules that expand symbols
- constraints (range, density, repetition)

This grammar is stored in a phrase container, not in the view itself.

### 6.6.2 Preview, commit, and freeze

Phrase view supports non-destructive preview:
- generate a phrase preview stream
- audition without writing to a container
- commit to a target container when satisfied

The commit operation writes actual NoteEvents into the chosen container.

### 6.6.3 Harmony and raga constraints

Phrase generation can use:
- chord progressions
- scale constraints
- raga rules and permitted ornamentation

Constraints are stored as separate events or rule objects so they can be edited and automated.

### 6.6.4 Variations and mutation

Phrase view supports controlled variations:
- density variation
- rhythm mutation
- melodic contour inversion

These are implemented as event-transform cards, so they can be reused elsewhere.

### 6.7 Cross-view operations (global editing)

The system supports operations that span multiple views:

- cross-quantize: quantize selection across tracker, piano roll, and notation at once
- global transpose: shift a selection regardless of view
- cross-view copy/paste: paste a tracker selection into piano roll or notation

These operations run on the EventStream directly, so they remain view-agnostic.

### 6.7.1 Linked cursors and time focus

Views can share a playhead and selection region:
- changing loop region in tracker updates piano roll and notation
- clicking a bar in notation jumps the tracker to that region

### 6.7.2 Event lane overlays in all views

Automation and meta events can be overlaid:
- tempo and meter changes appear in tracker and piano roll
- markers and scene triggers appear in notation
- analysis events can be displayed as translucent overlays

### 6.7.3 View cards as first-class nodes

Views themselves are cards, so they can be stacked or composed:
- a tracker, piano roll, and notation can be stacked in parallel
- switching tabs is a "tabs" stack with shared input/output types

This makes UI composition part of the same type system.

---

## 6.8 Carnatic and global music support (parametric types)

Carnatic music requires different primitives that map naturally to the parametric type system:
- Tala cycles that are not necessarily equal-length bars
- Gamaka (ornamentation) that is more than simple pitch bends
- Raga rules and phrase logic

We treat these as parametric types:

```ts
// SwaraPitch is a pitch system for Carnatic music
type SwaraPitch = {
  swara: "Sa" | "Ri1" | "Ri2" | "Ga1" | "Ga2" | "Ma1" | "Ma2" | "Pa" | "Dha1" | "Dha2" | "Ni1" | "Ni2";
  shruti: number;  // microtonal offset
  raga?: Raga;
} & Pitch;

// Carnatic events use Voice<SwaraPitch>
type CarnaticNoteEvent = Event<Voice<SwaraPitch>>;

// Raga rules use the parametric Rules<E, C>
type RagaRules = Rules<Event<Voice<SwaraPitch>>, RagaContext>;

// RagaContext provides the constraint information
type RagaContext = Context<{
  raga: Raga;
  arohana: SwaraPitch[];
  avarohana: SwaraPitch[];
  vadi: SwaraPitch;
  samvadi: SwaraPitch;
}, { kalai: number }>;

// Tala is also a context
type TalaContext = Context<{
  tala: Tala;
  cycle: number[];
  eduppu: number;
}, { kalai: number; karvai: number }>;
```

Cards for Carnatic:
- Tala card: defines cycle and beat groupings as `Container<"tala", Event<TalaPayload>>`
- Raga card: `Rules<Event<Voice<SwaraPitch>>, RagaContext>`
- Gamaka card: `Card<Stream<Event<Voice<SwaraPitch>>>, Stream<Event<Voice<SwaraPitch>>> & Lane<PitchBend>>`
- Konnakol card: `Card<Stream<Event<KonnakolPayload>>, Stream<Event<Voice<SwaraPitch>>>>`

All of these use the same parametric foundations, so they coexist with Western notation and tracker grids.

### 6.8.1 Raga as constraint system (Rules<E, RagaContext>)

Raga constraints use `Rules<Event<Voice<SwaraPitch>>, RagaContext>`:

```ts
const kalyaniRules: RagaRules = {
  validate: (e, ctx) => ctx.data.arohana.some(s => s.swara === e.payload.pitch.swara),
  transform: (e, ctx) => applyGamaka(e, ctx.data.raga.defaultGamaka),
  suggest: (ctx) => ctx.data.arohana.map(s => createCarnaticNote(s))
};
```

A raga card is a constraint transformer that uses `Rules<E, C>` to filter or annotate events.

### 6.8.2 Gamaka as event transforms (Lane<PitchBend>)

Gamaka uses the parametric `Lane<T>` for pitch curves:

```ts
// Gamaka transforms produce both events and pitch lanes
type GamakaTransform<P extends SwaraPitch> = Card<
  Stream<Event<Voice<P>>>,
  { events: Stream<Event<Voice<P>>>; pitchBend: Lane<Cents> }
>;

// Gamaka types
type GamakaPayload = {
  ornament: "kampita" | "jaru" | "spuritam" | "odukkal" | "pratyahatam";
  depth: number;
  curve: Interpolation;
};
```

### 6.8.3 Tala and rhythmic syllables (parametric containers)

Tala uses `Container<"tala">` and konnakol uses a custom payload:

```ts
type KonnakolPayload = {
  syllable: "ta" | "ki" | "na" | "tom" | "dhi" | "mi";
  stress: number;
  position: number;  // within tala cycle
};

// Konnakol generator card
type KonnakolCard = Card<
  Context<TalaContext>,
  Stream<Event<KonnakolPayload>>
>;

// Convert to voice events
type KonnakolToVoice<P extends Pitch> = Card<
  Stream<Event<KonnakolPayload>>,
  Stream<Event<Voice<P>>>
>;
```

### 6.8.4 Global music systems (parametric pitch types)

The parametric pitch system supports any tradition:

```ts
// Arabic maqam
type MaqamPitch = { degree: number; comma: number; maqam: Maqam } & Pitch;
type MaqamRules = Rules<Event<Voice<MaqamPitch>>, MaqamContext>;

// Indonesian gamelan
type GamelanPitch = { laras: "slendro" | "pelog"; tone: number } & Pitch;
type GamelanRules = Rules<Event<Voice<GamelanPitch>>, GamelanContext>;

// West African
type AfricanPitch = { drum: DrumType; stroke: StrokeType } & Pitch;
type PolyrythmRules = Rules<Stream<Event<Voice<AfricanPitch>>>, PolyrythmContext>;
```

Each system is implemented by:
1. Defining a pitch type that extends `Pitch`
2. Creating `Voice<ThatPitch>` events
3. Defining `Rules<Event<Voice<ThatPitch>>, ThatContext>`
4. Optional: custom notation mapping

---

## Part VII) Algorithmic and generative composition

---

## 7.1 Algorithmic composition

Algorithmic cards produce or transform Events. Examples:
- Rule-based harmony generator
- Euclidean rhythm generator
- Markov melody generator
- Live coding card (text to Events)

Algorithmic cards are just EventStream producers and can be stacked with tracker or notation cards.

### 7.1.1 Deterministic vs stochastic generators

Algorithmic cards declare whether they are deterministic:
- deterministic: given the same seed and input, output is identical
- stochastic: uses randomness, must expose seed control

This is critical for reproducibility and offline rendering.

### 7.1.2 Seed control and reproducibility

Generators expose a seed parameter:
- seed can be fixed or automated
- seed changes are stored as events so they can be edited

This allows a phrase to be "frozen" by locking the seed.

### 7.1.3 Grammar and rule systems (parametric Rules<E, C>)

Grammar systems use the parametric `Rules<E, C>` type:

```ts
// Rules is parametric over event type E and context C
type Rules<E, C = void> = {
  validate: (event: E, context: C) => boolean;
  transform?: (event: E, context: C) => E;
  suggest?: (context: C) => E[];
};

// Grammar rules are just Rules applied to streams
type GrammarRules<P extends Pitch> = Rules<
  Stream<Event<Voice<P>>>,
  { symbols: GrammarSymbol[]; depth: number }
>;

// Example: scale constraint
const scaleRules: Rules<Event<Voice<MIDIPitch>>, ScaleContext> = {
  validate: (e, ctx) => ctx.scale.includes(e.payload.pitch % 12),
  transform: (e, ctx) => ({ ...e, payload: { ...e.payload, pitch: quantizeToScale(e.payload.pitch, ctx.scale) } }),
  suggest: (ctx) => ctx.scale.map(p => createNoteEvent(p, 0.8))
};
```

They emit Streams that can be edited by any view.

### 7.1.4 Constraint-driven generation (Rules composition)

Constraints use the parametric `Rules<E, C>` system and can be composed:

```ts
// Combine multiple rules
function combineRules<E, C>(r1: Rules<E, C>, r2: Rules<E, C>): Rules<E, C> {
  return {
    validate: (e, c) => r1.validate(e, c) && r2.validate(e, c),
    transform: (e, c) => r2.transform?.(r1.transform?.(e, c) ?? e, c) ?? e
  };
}

// Example: melody rules = scale + range + density
const melodyRules = combineRules(
  combineRules(scaleRules, rangeRules),
  densityRules
);
```

Generators consume `Rules<E, C>` as input, which keeps the system composable.

### 7.1.5 Live coding

Live coding cards parse text into Events:
- code is treated as a stream definition
- outputs are event lists, not opaque audio

This makes live-coded output editable in tracker or notation immediately.

---

## 7.2 Arranger System (Auto-Accompaniment Engine)

The Arranger is a **meta-card** that transforms a stream of chord events into multiple parallel streams of note events—one per voice/instrument. It implements the type signature:

```ts
type Arranger<P extends Pitch = MIDIPitch> = Card<
  { chords: Stream<Event<ChordPayload<P>>> },
  { 
    drums: Stream<Event<DrumPayload>>;
    bass: Stream<Event<Voice<P>>>;
    keys: Stream<Event<Voice<P>>>;
    pad: Stream<Event<Voice<P>>>;
    all: Stream<Event<Voice<P> | DrumPayload>>;
  }
>
```

This design makes the arranger a **stream transformer** that can be composed with any other card in the system.

### 7.2.1 Arranger Type Lattice

The arranger system defines a precise type hierarchy:

```ts
// ============================================================================
// PITCH SYSTEM (integrates with cardplay's MIDIPitch)
// ============================================================================

type ChordRoot = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;  // pitch class

type ChordQuality = 
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'sus2' | 'sus4'
  | 'dom7' | 'maj7' | 'min7' | 'dim7' | 'hdim7' | 'minmaj7' | 'aug7'
  | 'dom9' | 'maj9' | 'min9' | 'dom11' | 'min11' | 'dom13' | 'maj13'
  | 'add9' | 'add11' | '6' | 'min6' | '6/9'
  | 'altered' | 'lydian' | 'phrygian';

type RecognizedChord<P extends Pitch = MIDIPitch> = {
  readonly root: ChordRoot;
  readonly quality: ChordQuality;
  readonly bass?: P;                    // slash chord bass
  readonly tensions?: readonly number[]; // extensions [9, 11, 13]
  readonly omissions?: readonly number[]; // omitted tones [5]
  readonly confidence: number;          // 0-1 recognition confidence
};

// ============================================================================
// VOICE SYSTEM
// ============================================================================

type VoiceType = 
  | 'bass' | 'drums' | 'keys' | 'pad' | 'rhythm'
  | 'melody' | 'brass' | 'strings' | 'woodwinds' | 'percussion';

type VoiceConfig<P extends Pitch = MIDIPitch> = {
  readonly type: VoiceType;
  readonly instrument: string;
  readonly channel: number;                // MIDI channel
  readonly octaveRange: readonly [P, P];   // [low, high]
  readonly velocityRange: readonly [number, number];
  readonly pan: number;                    // -1 to 1
  readonly volume: number;                 // 0 to 1
};

// ============================================================================
// PATTERN SYSTEM (Rules<E, C> specialization)
// ============================================================================

// A PatternStep is parametric over note type
type PatternStep<N extends 'degree' | 'drum'> = N extends 'degree'
  ? { beat: number; degree: ScaleDegree; duration: number; velocity: number; articulation?: Articulation }
  : { beat: number; drum: DrumPiece; velocity: number; flam?: boolean };

type ScaleDegree = 'root' | 'second' | 'third' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'octave';
type DrumPiece = 'kick' | 'snare' | 'hihat-closed' | 'hihat-open' | 'ride' | 'crash' | 'tom-high' | 'tom-mid' | 'tom-low' | 'clap' | 'cowbell' | 'rimshot';
type Articulation = 'staccato' | 'legato' | 'accent' | 'ghost' | 'slide' | 'bend';

// VoicePattern wraps steps with swing and humanization
type VoicePattern<N extends 'degree' | 'drum'> = {
  readonly steps: readonly PatternStep<N>[];
  readonly swing: number;      // 0 = straight, 0.67 = triplet swing
  readonly humanize?: number;  // timing randomization 0-1
};

// ============================================================================
// STYLE SYSTEM
// ============================================================================

type StyleCategory = 'Pop' | 'Rock' | 'Jazz' | 'Latin' | 'Electronic' | 'R&B' | 'Folk' | 'World' | 'Blues' | 'Country' | 'Classical';

type ArrangerStyle = {
  readonly id: string;
  readonly name: string;
  readonly category: StyleCategory;
  readonly subcategory: string;
  readonly description: string;
  readonly tempoRange: { min: number; max: number };
  readonly defaultTempo: number;
  readonly timeSignature: TimeSignature | '4/4' | '3/4' | '6/8';
  readonly voices: readonly VoiceConfig[];
  readonly variations: readonly StyleVariation[];
  readonly intros: readonly StyleSection[];
  readonly endings: readonly StyleSection[];
  readonly fills: readonly StyleSection[];
  readonly breaks: readonly StyleSection[];
  readonly tags: readonly string[];
  readonly icon: string;  // emoji
};

type StyleVariation = {
  readonly name: 'A' | 'B' | 'C' | 'D';
  readonly description: string;
  readonly voices: Record<VoiceType, VoicePattern<'degree' | 'drum'>>;
};

type StyleSection = {
  readonly id: string;
  readonly name: string;
  readonly lengthBars: number;
  readonly patterns: Record<VoiceType, VoicePattern<'degree' | 'drum'>>;
};
```

### 7.2.2 Arranger State Machine

The arranger operates as a deterministic state machine with the following transitions:

```ts
type ArrangerPlayState = 'stopped' | 'playing' | 'intro' | 'ending' | 'fill' | 'break';

type ArrangerState = {
  readonly playState: ArrangerPlayState;
  readonly currentStyle: ArrangerStyle;
  readonly currentVariation: 'A' | 'B' | 'C' | 'D';
  readonly currentChord: RecognizedChord | null;
  readonly previousChord: RecognizedChord | null;
  readonly tempo: number;
  readonly energy: number;           // 0-1 intensity
  readonly complexity: number;       // 0-1 pattern complexity
  readonly splitPoint: MIDIPitch;    // chord detection zone
  readonly voiceLeadingState: FourPartVoicing | null;
  readonly measurePosition: number;  // 0 to timeSignature.numerator
  readonly queuedSection: StyleSection | null;
};

// State transitions via commands (Command pattern)
type ArrangerCommand =
  | { type: 'play' }
  | { type: 'stop' }
  | { type: 'setStyle'; styleId: string }
  | { type: 'setVariation'; variation: 'A' | 'B' | 'C' | 'D' }
  | { type: 'triggerFill' }
  | { type: 'triggerIntro' }
  | { type: 'triggerEnding' }
  | { type: 'triggerBreak' }
  | { type: 'setChord'; chord: RecognizedChord }
  | { type: 'setTempo'; tempo: number }
  | { type: 'setEnergy'; energy: number }
  | { type: 'setSplitPoint'; note: MIDIPitch };

// Pure state reducer
function processArrangerCommand(
  state: ArrangerState,
  command: ArrangerCommand
): ArrangerState;
```

### 7.2.3 Voice Leading Engine

The voice leading engine minimizes voice movement between chords using the `Rules<E, C>` pattern:

```ts
type VoiceLeadingConfig = {
  readonly maxMovement: number;        // max semitones per voice (default: 4)
  readonly preferCommonTones: boolean; // keep shared notes in same voice
  readonly preferContraryMotion: boolean;
  readonly avoidParallels: boolean;    // avoid parallel 5ths/octaves
  readonly voiceRanges: {
    soprano: readonly [MIDIPitch, MIDIPitch];
    alto: readonly [MIDIPitch, MIDIPitch];
    tenor: readonly [MIDIPitch, MIDIPitch];
    bass: readonly [MIDIPitch, MIDIPitch];
  };
};

type FourPartVoicing = {
  readonly soprano: MIDIPitch;
  readonly alto: MIDIPitch;
  readonly tenor: MIDIPitch;
  readonly bass: MIDIPitch;
};

// Voice leading as Rules<FourPartVoicing, ChordContext>
const voiceLeadingRules: Rules<FourPartVoicing, { prev: FourPartVoicing; chord: RecognizedChord }> = {
  validate: (voicing, ctx) => {
    // Check all voices within ranges
    // Check no parallel 5ths/octaves with ctx.prev
    // Check maximum movement constraint
  },
  transform: (voicing, ctx) => {
    // Apply minimal movement from ctx.prev to reach chord tones
  },
  suggest: (ctx) => {
    // Generate candidate voicings ranked by voice leading quality
  }
};

// Primary API
function applyVoiceLeading(
  chord: RecognizedChord,
  previousVoicing: FourPartVoicing | null,
  config: VoiceLeadingConfig
): FourPartVoicing;
```

### 7.2.4 EZ Keys-Inspired Features

The arranger implements EZ Keys-style workflow presets:

```ts
// Song part presets (pre-configured energy/complexity/voices)
type SongPartPreset = 
  | 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'post-chorus'
  | 'bridge' | 'breakdown' | 'buildup' | 'drop' | 'outro' | 'solo' | 'instrumental';

type SongPartConfig = {
  readonly type: SongPartPreset;
  readonly energy: 1 | 2 | 3 | 4 | 5;
  readonly complexity: number;  // 0-1
  readonly activeVoices: readonly VoiceType[];
  readonly variation: 'A' | 'B' | 'C' | 'D';
};

// Energy levels with multipliers
type EnergyLevelConfig = {
  readonly level: number;
  readonly name: string;
  readonly velocityMultiplier: number;
  readonly densityMultiplier: number;
  readonly voiceCount: number;
};

// Voicing styles (harmonic distribution)
type VoicingStyleType = 
  | 'close'      // all notes within octave
  | 'open'       // spread across octaves
  | 'drop2'      // jazz drop 2
  | 'drop3'      // jazz drop 3
  | 'drop24'     // wide jazz voicing
  | 'rootless'   // no root (jazz piano)
  | 'quartal'    // stacked 4ths
  | 'shell'      // root, 3rd, 7th only
  | 'spread';    // very wide across keyboard

type VoicingStyleConfig = {
  readonly type: VoicingStyleType;
  readonly minSpread: number;   // semitones
  readonly maxSpread: number;
  readonly includeBass: boolean;
  readonly extensions: readonly ('7th' | '9th' | '11th' | '13th')[];
};

// Bass line styles (LiquidNotes-inspired)
type BassLineStyle = 
  | 'root'         // simple root notes
  | 'walking'      // jazz walking bass
  | 'pedal'        // pedal point
  | 'counterpoint' // melodic counterpoint
  | 'octave'       // root-octave pattern
  | 'arpeggiated'  // arpeggio patterns
  | 'syncopated'   // funk syncopation
  | 'slap';        // slap bass technique

type BassLineStyleConfig = {
  readonly type: BassLineStyle;
  readonly density: number;        // notes per bar
  readonly chordTonesOnly: boolean;
  readonly genres: readonly string[];
};
```

### 7.2.5 Real-Time Control System

The arranger exposes keyboard-style real-time controls:

```ts
type ArrangerControlType = 
  | 'syncStart' | 'syncStop' | 'tapTempo'
  | 'variationUp' | 'variationDown'
  | 'fillNow' | 'intro' | 'ending' | 'break'
  | 'bassInversion' | 'octaveUp' | 'octaveDown'
  | 'tempoLock' | 'chordMemory' | 'splitPoint';

type ArrangerControl = {
  readonly type: ArrangerControlType;
  readonly name: string;
  readonly shortcut?: string;
  readonly momentary: boolean;  // held vs toggle
  readonly icon: string;
};

type ArrangerControlState = {
  readonly syncStart: boolean;
  readonly syncStop: boolean;
  readonly tempoLock: boolean;
  readonly chordMemory: boolean;
  readonly splitPoint: MIDIPitch;
  readonly octaveOffset: number;
  readonly forcedBassNote: MIDIPitch | null;
  readonly heldChordNotes: readonly MIDIPitch[];
  readonly tapTimestamps: readonly number[];  // for tempo calculation
};

type ArrangerControlCommand = 
  | { type: 'toggleSyncStart' }
  | { type: 'toggleSyncStop' }
  | { type: 'tapTempo'; timestamp: number }
  | { type: 'variationUp' }
  | { type: 'variationDown' }
  | { type: 'triggerFill' }
  // ... etc

function processArrangerControlCommand(
  state: ArrangerControlState,
  command: ArrangerControlCommand
): ArrangerControlState;

function calculateTapTempo(timestamps: readonly number[]): number | null;
```

### 7.2.6 Instrument Switcher

The arranger includes an instrument switching system for voice reassignment:

```ts
type InstrumentCategory = 
  | 'bass' | 'drums' | 'piano' | 'organ' | 'guitar'
  | 'strings' | 'brass' | 'woodwinds' | 'synth' | 'pad' | 'lead' | 'percussion';

type InstrumentOption = {
  readonly id: string;
  readonly name: string;
  readonly category: InstrumentCategory;
  readonly program: number;      // MIDI program 0-127
  readonly bankMSB?: number;
  readonly bankLSB?: number;
  readonly description: string;
  readonly icon: string;
  readonly tags: readonly string[];
};

// 60+ factory instruments across 12 categories
const INSTRUMENT_OPTIONS: Record<InstrumentCategory, readonly InstrumentOption[]>;

function getInstrumentOptions(category: InstrumentCategory): readonly InstrumentOption[];
function searchInstruments(query: string): readonly InstrumentOption[];
```

### 7.2.7 Fill and Ending Generators

Transition generation follows the `Rules<E, C>` pattern:

```ts
type FillStyle = 'simple' | 'building' | 'breakdown' | 'tom-roll' | 'snare-roll' | 'crash' | 'syncopated' | 'polyrhythmic';

type FillConfig = {
  readonly style: FillStyle;
  readonly lengthBeats: number;
  readonly intensity: number;    // 0-1
  readonly crashAtEnd: boolean;
  readonly density: number;      // notes per beat
};

type EndingStyle = 'ritardando' | 'fermata' | 'tag' | 'cold' | 'fade' | 'big-finish' | 'vamp-out';

type EndingConfig = {
  readonly style: EndingStyle;
  readonly lengthBars: number;
  readonly finalChord: RecognizedChord;
  readonly ritardandoAmount: number;  // 0-1 for ritardando style
};

function generateFill(config: FillConfig, currentStyle: ArrangerStyle): VoicePattern<'drum'>;
function generateEnding(config: EndingConfig, currentStyle: ArrangerStyle): Record<VoiceType, VoicePattern<'degree' | 'drum'>>;
```

### 7.2.8 Texture Generator

The texture generator transforms chord input into textured output:

```ts
type TextureType = 
  | 'monophonic'   // single melody line
  | 'homophonic'   // melody with block chords
  | 'polyphonic'   // independent voices
  | 'heterophonic' // simultaneous variations
  | 'fugal'        // imitative counterpoint
  | 'ostinato'     // repeated pattern
  | 'antiphonal'   // call and response
  | 'unison'       // all voices same pitch
  | 'drone';       // sustained pedal

type TextureConfig = {
  readonly type: TextureType;
  readonly voiceCount: number;
  readonly density: number;         // 0-1
  readonly rhythmVariation: number; // 0-1
  readonly spread: number;          // octave spread
};

function applyTexture(
  notes: readonly MIDIPitch[],
  config: TextureConfig
): readonly MIDIPitch[][];
```

### 7.2.9 Style Preset Library

The arranger ships with 37+ factory styles across 9 categories:

| Category | Styles |
|----------|--------|
| Pop | 8-Beat, 16-Beat, Ballad |
| Rock | Hard Rock, Classic Rock, Soft Rock, Power Ballad |
| Blues | Shuffle, Slow Blues |
| Jazz | Swing, Ballad, Funk, Bebop, Bossa Nova |
| Latin | Salsa, Cha Cha, Tango, Mambo, Reggae |
| Electronic | House, Techno, Trance, DnB, Dubstep, Chillout, Lo-Fi Hip-Hop, Trap |
| R&B | Classic Soul, Neo-Soul, Gospel, Funk |
| Folk | Country Pop, Folk Rock, Bluegrass, Celtic |
| World | Afrobeat |

Each style defines:
- Tempo range and default
- Time signature
- 4 variations (A/B/C/D)
- Voice configurations
- Pattern definitions for each voice
- Intro/ending/fill sections

---

## 7.3 Arranger Integration with RapidComposer-like Phrase System

The arranger operates at the **accompaniment layer** while the phrase system operates at the **melodic/compositional layer**. They integrate through shared types:

### 7.3.1 Phrase Query System

The phrase system queries a database of musical phrases using the `Rules<E, C>` pattern:

```ts
type PhraseQuery = {
  readonly scaleFilter?: ScaleType[];
  readonly chordFilter?: ChordQuality[];
  readonly moodFilter?: MoodTag[];
  readonly durationRange?: readonly [Tick, Tick];
  readonly densityRange?: readonly [number, number];
  readonly contourFilter?: ('ascending' | 'descending' | 'arch' | 'wave')[];
};

type PhraseResult<P extends Pitch = MIDIPitch> = {
  readonly id: string;
  readonly events: Stream<Event<Voice<P>>>;
  readonly metadata: PhraseMetadata;
  readonly matchScore: number;
};

// Phrase database query
function queryPhrases<P extends Pitch>(
  query: PhraseQuery,
  context: { chord: RecognizedChord; style: ArrangerStyle }
): readonly PhraseResult<P>[];
```

### 7.3.2 Integration Points

The arranger and phrase system share:

1. **Chord Recognition**: Both use `RecognizedChord<P>` as the harmonic input
2. **Scale Context**: Both quantize to scale degrees
3. **Energy/Complexity**: Both respond to 0-1 intensity parameters
4. **Voice Leading**: Phrases can use the same `VoiceLeadingConfig`

```ts
// Phrase responds to arranger context
type PhraseContext = {
  readonly chord: RecognizedChord;
  readonly style: ArrangerStyle;
  readonly energy: number;
  readonly variation: 'A' | 'B' | 'C' | 'D';
  readonly voiceLeadingState: FourPartVoicing | null;
};

// Phrases as Rules<Stream<Event<Voice<P>>>, PhraseContext>
type PhraseRules<P extends Pitch> = Rules<
  Stream<Event<Voice<P>>>,
  PhraseContext
>;
```

### 7.3.3 Arranger as Phrase Parameter Source

The arranger can drive phrase selection:

```ts
// Arranger exports parameters for phrase system
type ArrangerPhraseParams = {
  readonly currentChord: RecognizedChord;
  readonly currentStyle: ArrangerStyle;
  readonly energy: number;
  readonly complexity: number;
  readonly measurePosition: number;
  readonly isDownbeat: boolean;
  readonly isFill: boolean;
  readonly suggestedScale: ScaleType;
};

// Phrase card subscribes to arranger parameters
function createPhraseCard(
  arrangerParams$: Stream<ArrangerPhraseParams>
): Card<{}, { melody: Stream<Event<Voice<MIDIPitch>>> }>;
```

### 7.3.4 Designing Arranger Parameters for Phrase Integration

The arranger's parameter system is designed for phrase system integration:

```ts
// Arranger parameters (CardParam[])
const ARRANGER_PARAMETERS: readonly CardParam[] = [
  // Master parameters (also useful for phrases)
  { id: 'tempo', type: 'number', min: 40, max: 240, default: 120, group: 'Master' },
  { id: 'energy', type: 'number', min: 0, max: 1, default: 0.5, group: 'Master' },
  { id: 'complexity', type: 'number', min: 0, max: 1, default: 0.5, group: 'Master' },
  
  // Style parameters
  { id: 'style', type: 'enum', options: STYLE_IDS, default: 'pop-8beat', group: 'Style' },
  { id: 'variation', type: 'enum', options: ['A', 'B', 'C', 'D'], default: 'A', group: 'Style' },
  
  // Voice leading (shared with phrase system)
  { id: 'voiceLeading', type: 'boolean', default: true, group: 'Voice Leading' },
  { id: 'maxMovement', type: 'number', min: 1, max: 12, default: 4, group: 'Voice Leading' },
  
  // Texture (phrase system uses same types)
  { id: 'textureType', type: 'enum', options: TEXTURE_TYPES, default: 'homophonic', group: 'Texture' },
  { id: 'textureSpread', type: 'number', min: 0, max: 36, default: 12, group: 'Texture' },
  
  // Voicing style (phrase system uses same types)
  { id: 'voicingStyle', type: 'enum', options: VOICING_STYLES, default: 'close', group: 'Voicing' },
  
  // Voice volumes (per-voice control)
  { id: 'drumsVolume', type: 'number', min: 0, max: 1, default: 0.8, group: 'Voices' },
  { id: 'bassVolume', type: 'number', min: 0, max: 1, default: 0.8, group: 'Voices' },
  { id: 'keysVolume', type: 'number', min: 0, max: 1, default: 0.7, group: 'Voices' },
  { id: 'padVolume', type: 'number', min: 0, max: 1, default: 0.5, group: 'Voices' },
];
```

### 7.3.5 MIDI Phrase Querying Interface

The phrase system queries MIDI phrases with arranger-compatible parameters:

```ts
type MIDIPhraseQuery = {
  // Harmonic filters (from arranger)
  readonly chord?: RecognizedChord;
  readonly scale?: ScaleType;
  readonly key?: ChordRoot;
  
  // Rhythmic filters (from arranger)
  readonly tempo?: number;
  readonly timeSignature?: TimeSignature;
  readonly swing?: number;
  
  // Style filters (from arranger)
  readonly styleCategory?: StyleCategory;
  readonly styleTags?: readonly string[];
  
  // Content filters
  readonly instrument?: InstrumentCategory;
  readonly phraseType?: 'melody' | 'bass' | 'chord' | 'rhythm' | 'fill' | 'lick';
  readonly duration?: { min: Tick; max: Tick };
  readonly noteCount?: { min: number; max: number };
  readonly range?: { low: MIDIPitch; high: MIDIPitch };
  
  // Expressive filters
  readonly energy?: { min: number; max: number };
  readonly complexity?: { min: number; max: number };
  readonly mood?: readonly MoodTag[];
};

type MIDIPhraseResult = {
  readonly id: string;
  readonly name: string;
  readonly events: Stream<Event<Voice<MIDIPitch>>>;
  readonly originalKey: ChordRoot;
  readonly originalTempo: number;
  readonly tags: readonly string[];
  readonly matchScore: number;
};

interface PhraseDatabase {
  query(query: MIDIPhraseQuery): Promise<readonly MIDIPhraseResult[]>;
  getById(id: string): Promise<MIDIPhraseResult | null>;
  transpose(phrase: MIDIPhraseResult, semitones: number): MIDIPhraseResult;
  stretch(phrase: MIDIPhraseResult, factor: number): MIDIPhraseResult;
}
```

### 7.3.6 Combined Arranger + Phrase Workflow

The arranger and phrase system combine into a unified composition workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPOSITION WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ MIDI Input  │────▶│   Chord     │────▶│  Arranger   │       │
│  │ (keyboard)  │     │ Recognizer  │     │   State     │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                 │               │
│                           ┌─────────────────────┼───────┐       │
│                           │                     │       │       │
│                           ▼                     ▼       ▼       │
│                    ┌─────────────┐      ┌──────────┐ ┌─────┐   │
│                    │   Phrase    │      │  Voice   │ │Drums│   │
│                    │   Query     │      │ Leading  │ │     │   │
│                    │   System    │      │  Engine  │ │     │   │
│                    └─────────────┘      └──────────┘ └─────┘   │
│                           │                     │       │       │
│                           ▼                     ▼       ▼       │
│                    ┌─────────────┐      ┌──────────┐ ┌─────┐   │
│                    │   Melody    │      │  Keys/   │ │Drum │   │
│                    │   Stream    │      │  Pad     │ │Patrn│   │
│                    └─────────────┘      └──────────┘ └─────┘   │
│                           │                     │       │       │
│                           └─────────────────────┼───────┘       │
│                                                 │               │
│                                                 ▼               │
│                                          ┌───────────┐          │
│                                          │  Output   │          │
│                                          │  Streams  │          │
│                                          └───────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7.4 RapidComposer-like Phrase System (Comprehensive)

The phrase system provides RapidComposer-inspired compositional tools with full type-theoretic precision. It operates on the principle that musical content can be **decoupled into orthogonal dimensions** (shape, rhythm, chord, scale) and recombined freely.

### 7.4.1 Core Architecture: Decoupled Musical Dimensions

The fundamental insight is that a melodic phrase can be decomposed into independent, interchangeable components:

```ts
// The four orthogonal dimensions of a phrase
type ShapeContour = {
  readonly id: string;
  readonly name: string;
  readonly points: readonly ContourPoint[];  // normalized 0-1 pitch curve
  readonly interpolation: 'linear' | 'smooth' | 'step';
};

type ContourPoint = {
  readonly position: number;   // 0-1 normalized time
  readonly value: number;      // 0-1 normalized pitch (0=low, 1=high)
  readonly tension?: number;   // bezier tension for smooth
};

type RhythmPattern = {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly RhythmStep[];
  readonly length: Tick;
  readonly swing?: number;
};

type RhythmStep = {
  readonly position: Tick;
  readonly duration: Tick;
  readonly accent: number;     // 0-1 velocity multiplier
  readonly articulation?: Articulation;
  readonly probability?: number;  // 0-1 for probabilistic patterns
};

type ChordContext = {
  readonly id: string;
  readonly name: string;
  readonly chords: readonly ChordEvent[];
  readonly voicingStyle: VoicingStyleType;
};

type ChordEvent = {
  readonly start: Tick;
  readonly duration: Tick;
  readonly chord: RecognizedChord;
};

type ScaleContext = {
  readonly id: string;
  readonly name: string;
  readonly scale: ScaleType;
  readonly root: ChordRoot;
  readonly mode?: number;       // mode rotation (0 = ionian, 1 = dorian, etc.)
  readonly alterations?: readonly ScaleAlteration[];
};

type ScaleAlteration = {
  readonly degree: number;      // 1-7
  readonly alteration: 'sharp' | 'flat' | 'natural';
};

// The decoupled phrase definition
type DecoupledPhrase<P extends Pitch = MIDIPitch> = {
  readonly shape: ShapeContour;
  readonly rhythm: RhythmPattern;
  readonly chordContext: ChordContext;
  readonly scaleContext: ScaleContext;
  readonly range: { readonly low: P; readonly high: P };
  readonly dynamics: DynamicsProfile;
};

type DynamicsProfile = {
  readonly baseVelocity: number;      // 0-127
  readonly velocityCurve: ShapeContour;  // reuse contour type
  readonly accentStrength: number;    // 0-1
};

// Materialize decoupled phrase into concrete events
function materializePhrase<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  options?: MaterializeOptions
): Stream<Event<Voice<P>>>;

type MaterializeOptions = {
  readonly startTick?: Tick;
  readonly transpose?: number;
  readonly stretchFactor?: number;
  readonly humanize?: HumanizeConfig;
};
```

### 7.4.2 Phrase Recombination System

Each dimension can be swapped independently:

```ts
// Replace one dimension while keeping others
function replaceShape<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  newShape: ShapeContour
): DecoupledPhrase<P>;

function replaceRhythm<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  newRhythm: RhythmPattern
): DecoupledPhrase<P>;

function replaceChordContext<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  newChords: ChordContext
): DecoupledPhrase<P>;

function replaceScaleContext<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  newScale: ScaleContext
): DecoupledPhrase<P>;

// Combine dimensions from multiple sources
function combinePhraseDimensions<P extends Pitch>(config: {
  shape: ShapeContour;
  rhythm: RhythmPattern;
  chords: ChordContext;
  scale: ScaleContext;
  range: { low: P; high: P };
  dynamics?: DynamicsProfile;
}): DecoupledPhrase<P>;

// Example: take shape from phrase A, rhythm from phrase B, apply to new chords
const hybridPhrase = combinePhraseDimensions({
  shape: phraseA.shape,
  rhythm: phraseB.rhythm,
  chords: newChordProgression,
  scale: { id: 'dorian', name: 'D Dorian', scale: 'dorian', root: 'D' },
  range: { low: 48, high: 72 },
});
```

### 7.4.3 Shape Contour Library

Pre-built melodic contours for common patterns:

```ts
type ContourType =
  | 'ascending'      // steadily rising
  | 'descending'     // steadily falling
  | 'arch'           // rise then fall
  | 'inverted-arch'  // fall then rise
  | 'wave'           // oscillating
  | 'plateau'        // rise, sustain, fall
  | 'step-up'        // stair-step ascending
  | 'step-down'      // stair-step descending
  | 'zigzag'         // alternating
  | 'flat'           // no change
  | 'peak-start'     // high then descending
  | 'trough-start';  // low then ascending

const SHAPE_CONTOURS: Record<ContourType, ShapeContour> = {
  ascending: {
    id: 'ascending',
    name: 'Ascending',
    points: [
      { position: 0, value: 0 },
      { position: 1, value: 1 }
    ],
    interpolation: 'linear'
  },
  arch: {
    id: 'arch',
    name: 'Arch',
    points: [
      { position: 0, value: 0.2 },
      { position: 0.5, value: 1 },
      { position: 1, value: 0.2 }
    ],
    interpolation: 'smooth'
  },
  wave: {
    id: 'wave',
    name: 'Wave',
    points: [
      { position: 0, value: 0.5 },
      { position: 0.25, value: 1 },
      { position: 0.5, value: 0.5 },
      { position: 0.75, value: 0 },
      { position: 1, value: 0.5 }
    ],
    interpolation: 'smooth'
  },
  // ... etc
};

// Generate custom contours
function createContourFromPoints(points: readonly ContourPoint[]): ShapeContour;
function createContourFromMelody<P extends Pitch>(events: Stream<Event<Voice<P>>>): ShapeContour;
function invertContour(contour: ShapeContour): ShapeContour;
function reverseContour(contour: ShapeContour): ShapeContour;
function stretchContour(contour: ShapeContour, factor: number): ShapeContour;
```

### 7.4.4 Rhythm Pattern Library

Pre-built rhythm patterns per line type:

```ts
type RhythmCategory =
  | 'melody'     // longer notes, breathing room
  | 'bass'       // root-focused, syncopated options
  | 'comping'    // chord rhythm patterns
  | 'arpeggio'   // regular subdivisions
  | 'drums'      // kit-specific patterns
  | 'percussion' // auxiliary percussion
  | 'fills'      // transitional patterns
  | 'ostinato';  // repeated figures

const RHYTHM_PATTERNS: Record<RhythmCategory, readonly RhythmPattern[]> = {
  melody: [
    {
      id: 'melody-quarter',
      name: 'Quarter Notes',
      steps: [
        { position: 0, duration: 480, accent: 1.0 },
        { position: 480, duration: 480, accent: 0.8 },
        { position: 960, duration: 480, accent: 0.9 },
        { position: 1440, duration: 480, accent: 0.7 }
      ],
      length: 1920
    },
    {
      id: 'melody-syncopated',
      name: 'Syncopated Melody',
      steps: [
        { position: 0, duration: 360, accent: 1.0 },
        { position: 480, duration: 240, accent: 0.7 },
        { position: 720, duration: 480, accent: 0.9 },
        { position: 1200, duration: 240, accent: 0.6 },
        { position: 1560, duration: 360, accent: 0.8 }
      ],
      length: 1920,
      swing: 0.3
    },
    // ... 20+ melody patterns
  ],
  bass: [
    {
      id: 'bass-roots',
      name: 'Root Notes',
      steps: [
        { position: 0, duration: 960, accent: 1.0 },
        { position: 960, duration: 960, accent: 0.9 }
      ],
      length: 1920
    },
    {
      id: 'bass-walking',
      name: 'Walking Bass',
      steps: [
        { position: 0, duration: 480, accent: 1.0 },
        { position: 480, duration: 480, accent: 0.7 },
        { position: 960, duration: 480, accent: 0.8 },
        { position: 1440, duration: 480, accent: 0.7 }
      ],
      length: 1920
    },
    {
      id: 'bass-octave',
      name: 'Octave Jump',
      steps: [
        { position: 0, duration: 720, accent: 1.0 },
        { position: 720, duration: 240, accent: 0.6, articulation: 'staccato' },
        { position: 960, duration: 720, accent: 0.9 },
        { position: 1680, duration: 240, accent: 0.6, articulation: 'staccato' }
      ],
      length: 1920
    },
    // ... 20+ bass patterns
  ],
  // ... etc for all categories
};
```

### 7.4.5 Line Type Generators

Different generators for each musical line type, following the `Rules<E, C>` pattern:

```ts
// Generator type signature
type LineGenerator<P extends Pitch, C> = {
  readonly lineType: LineType;
  readonly name: string;
  readonly rules: Rules<Stream<Event<Voice<P>>>, C>;
  readonly defaultConfig: C;
};

type LineType = 
  | 'melody'
  | 'bass'
  | 'chord'
  | 'arpeggio'
  | 'countermelody'
  | 'pedal'
  | 'ostinato'
  | 'fill'
  | 'drum'
  | 'percussion';

// Melody generator
type MelodyGeneratorConfig = {
  readonly shape: ShapeContour;
  readonly rhythm: RhythmPattern;
  readonly scale: ScaleContext;
  readonly range: { low: MIDIPitch; high: MIDIPitch };
  readonly targetNotes?: readonly MIDIPitch[];  // chord tones to target
  readonly avoidNotes?: readonly MIDIPitch[];   // notes to avoid
  readonly stepSize: 'conjunct' | 'mixed' | 'disjunct';
  readonly repetitionAllowed: boolean;
  readonly phraseBreathing: number;  // 0-1 amount of rest
};

const melodyGenerator: LineGenerator<MIDIPitch, MelodyGeneratorConfig> = {
  lineType: 'melody',
  name: 'Melodic Line Generator',
  rules: {
    validate: (stream, ctx) => {
      // Check range, scale membership, stepwise motion
      return stream.every(e => 
        e.payload.pitch >= ctx.range.low &&
        e.payload.pitch <= ctx.range.high &&
        isInScale(e.payload.pitch, ctx.scale)
      );
    },
    transform: (stream, ctx) => applyMelodyRules(stream, ctx),
    suggest: (partial, ctx) => suggestNextMelodyNote(partial, ctx),
  },
  defaultConfig: {
    shape: SHAPE_CONTOURS.arch,
    rhythm: RHYTHM_PATTERNS.melody[0],
    scale: { id: 'major', name: 'C Major', scale: 'major', root: 'C' },
    range: { low: 60, high: 84 },
    stepSize: 'mixed',
    repetitionAllowed: true,
    phraseBreathing: 0.3,
  },
};

// Bass generator
type BassGeneratorConfig = {
  readonly rhythm: RhythmPattern;
  readonly chords: ChordContext;
  readonly style: BassLineStyle;
  readonly range: { low: MIDIPitch; high: MIDIPitch };
  readonly chromaticApproach: boolean;
  readonly fifthsAllowed: boolean;
  readonly octaveJumps: boolean;
};

const bassGenerator: LineGenerator<MIDIPitch, BassGeneratorConfig> = {
  lineType: 'bass',
  name: 'Bass Line Generator',
  rules: {
    validate: (stream, ctx) => validateBassLine(stream, ctx),
    transform: (stream, ctx) => applyBassRules(stream, ctx),
    suggest: (partial, ctx) => suggestNextBassNote(partial, ctx),
  },
  defaultConfig: {
    rhythm: RHYTHM_PATTERNS.bass[0],
    chords: { id: 'empty', name: 'Empty', chords: [], voicingStyle: 'root-position' },
    style: 'root',
    range: { low: 28, high: 55 },
    chromaticApproach: true,
    fifthsAllowed: true,
    octaveJumps: true,
  },
};

// Arpeggio generator
type ArpeggioGeneratorConfig = {
  readonly pattern: ArpeggioPattern;
  readonly chords: ChordContext;
  readonly octaves: number;
  readonly direction: 'up' | 'down' | 'updown' | 'random';
  readonly gateLength: number;   // 0-1
  readonly rate: NoteValue;
};

type ArpeggioPattern = 
  | 'chord-order'    // play chord tones in order
  | 'thirds'         // skip by thirds
  | 'random'         // random chord tones
  | 'alberti'        // classical alberti bass pattern
  | 'broken-chord'   // 1-5-3-5 style
  | 'pinky-thumb';   // alternating outer notes

const arpeggioGenerator: LineGenerator<MIDIPitch, ArpeggioGeneratorConfig>;

// Countermelody generator
type CountermelodyConfig = {
  readonly mainMelody: Stream<Event<Voice<MIDIPitch>>>;
  readonly relationship: 'parallel-thirds' | 'parallel-sixths' | 'contrary' | 'oblique' | 'imitation';
  readonly delay?: Tick;  // for imitation
  readonly intervalMap?: Record<number, number>;  // custom interval mapping
};

const countermelodyGenerator: LineGenerator<MIDIPitch, CountermelodyConfig>;

// Pedal tone generator
type PedalToneConfig = {
  readonly note: MIDIPitch | 'root' | 'fifth';
  readonly rhythm: RhythmPattern;
  readonly duration: 'sustained' | 'pulsing' | 'tremolo';
};

const pedalGenerator: LineGenerator<MIDIPitch, PedalToneConfig>;

// Ostinato generator
type OstinatoConfig = {
  readonly pattern: readonly OstinatoNote[];
  readonly transposeToChord: boolean;
  readonly length: Tick;
};

type OstinatoNote = {
  readonly degree: number;       // scale degree 1-7
  readonly position: Tick;
  readonly duration: Tick;
  readonly velocity: number;
};

const ostinatoGenerator: LineGenerator<MIDIPitch, OstinatoConfig>;

// Fill generator (transitional phrases)
type FillGeneratorConfig = {
  readonly style: 'scalar-run' | 'arpeggio-run' | 'chromatic' | 'turn' | 'trill' | 'glissando';
  readonly direction: 'up' | 'down' | 'toward-target';
  readonly targetNote: MIDIPitch;
  readonly duration: Tick;
  readonly density: number;
};

const fillGenerator: LineGenerator<MIDIPitch, FillGeneratorConfig>;

// Generator registry
const LINE_GENERATORS: Record<LineType, LineGenerator<MIDIPitch, any>> = {
  melody: melodyGenerator,
  bass: bassGenerator,
  chord: chordVoicingGenerator,
  arpeggio: arpeggioGenerator,
  countermelody: countermelodyGenerator,
  pedal: pedalGenerator,
  ostinato: ostinatoGenerator,
  fill: fillGenerator,
  drum: drumPatternGenerator,
  percussion: percussionGenerator,
};
```

### 7.4.6 Idea Tool System

The Idea Tool generates musical ideas by combining generators with random/intelligent selection:

```ts
type IdeaToolConfig = {
  readonly lineTypes: readonly LineType[];  // which lines to generate
  readonly style: ArrangerStyle | null;     // style context (optional)
  readonly chords: ChordContext;
  readonly scale: ScaleContext;
  readonly length: Tick;
  readonly complexity: number;   // 0-1
  readonly density: number;      // 0-1
  readonly coherence: number;    // 0-1 (how related ideas should be)
};

type GeneratedIdea = {
  readonly id: string;
  readonly lines: Record<LineType, Stream<Event<Voice<MIDIPitch>>>>;
  readonly phrase: DecoupledPhrase<MIDIPitch>;  // extractable components
  readonly config: IdeaToolConfig;
  readonly rating?: number;       // user rating for learning
  readonly tags: readonly string[];
};

// Idea Tool interface
interface IdeaTool {
  // Generate a complete musical idea
  generate(config: IdeaToolConfig): GeneratedIdea;
  
  // Generate variations of an existing idea
  generateVariations(idea: GeneratedIdea, count: number): readonly GeneratedIdea[];
  
  // Generate ideas based on audio input
  generateFromAudio(audio: AudioBuffer, config: Partial<IdeaToolConfig>): GeneratedIdea;
  
  // Generate ideas based on humming/singing
  generateFromPitch(pitchTrack: Stream<Event<{ pitch: number }>>, config: Partial<IdeaToolConfig>): GeneratedIdea;
  
  // Morph between two ideas
  morphIdeas(ideaA: GeneratedIdea, ideaB: GeneratedIdea, amount: number): GeneratedIdea;
  
  // Rate an idea (for learning/personalization)
  rateIdea(idea: GeneratedIdea, rating: number): void;
  
  // Get suggested ideas based on context
  suggest(context: { style?: ArrangerStyle; recentIdeas?: readonly GeneratedIdea[] }): readonly GeneratedIdea[];
}

// Idea Tool Card Definition
const IDEA_TOOL_CARD: CardDefinition<IdeaToolInputs, IdeaToolOutputs> = {
  type: 'idea-tool',
  name: 'Idea Tool',
  category: 'generator',
  signature: {
    inputs: [
      { name: 'chords', type: { kind: 'stream', type: {} as Stream<Event<ChordPayload>> } },
      { name: 'trigger', type: { kind: 'control', type: {} as Control } },
    ],
    outputs: [
      { name: 'melody', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
      { name: 'bass', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
      { name: 'chordVoicing', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
      { name: 'arpeggio', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
    ],
  },
  params: {
    lineTypes: { type: 'multi-enum', options: LINE_TYPES, default: ['melody', 'bass'] },
    complexity: { type: 'number', min: 0, max: 1, default: 0.5 },
    density: { type: 'number', min: 0, max: 1, default: 0.5 },
    coherence: { type: 'number', min: 0, max: 1, default: 0.7 },
    contourType: { type: 'enum', options: CONTOUR_TYPES, default: 'arch' },
    rhythmCategory: { type: 'enum', options: RHYTHM_CATEGORIES, default: 'melody' },
    seed: { type: 'number', min: 0, max: 999999, default: 0 },  // for reproducibility
  },
};
```

### 7.4.7 Ghost Copies and Reference System

Ghost copies are non-destructive references that follow changes to the original:

```ts
type GhostCopyType =
  | 'linked'         // follows all changes
  | 'shape-linked'   // follows shape changes only
  | 'rhythm-linked'  // follows rhythm changes only
  | 'chord-linked'   // follows chord changes only
  | 'scale-linked'   // follows scale changes only
  | 'frozen';        // snapshot, no longer follows

type GhostCopy<P extends Pitch = MIDIPitch> = {
  readonly id: string;
  readonly sourceId: string;       // reference to original phrase
  readonly copyType: GhostCopyType;
  readonly transform: GhostTransform<P>;
  readonly isFrozen: boolean;
};

type GhostTransform<P extends Pitch> = {
  readonly transpose: number;          // semitones
  readonly timeOffset: Tick;           // position offset
  readonly stretch: number;            // time stretch factor
  readonly velocityScale: number;      // velocity multiplier
  readonly octaveShift: number;        // octave transposition
  readonly invert: boolean;            // pitch inversion
  readonly retrograde: boolean;        // time reversal
  readonly rhythmScale: number;        // rhythm augmentation/diminution
  readonly customPitchMap?: (p: P) => P;  // custom pitch transformation
};

// Ghost copy operations
function createGhostCopy<P extends Pitch>(
  sourcePhrase: DecoupledPhrase<P>,
  transform: Partial<GhostTransform<P>>,
  copyType?: GhostCopyType
): GhostCopy<P>;

function resolveGhostCopy<P extends Pitch>(
  ghost: GhostCopy<P>,
  sourcePhrase: DecoupledPhrase<P>
): DecoupledPhrase<P>;

function freezeGhostCopy<P extends Pitch>(
  ghost: GhostCopy<P>,
  sourcePhrase: DecoupledPhrase<P>
): DecoupledPhrase<P>;  // returns independent copy

function updateGhostTransform<P extends Pitch>(
  ghost: GhostCopy<P>,
  updates: Partial<GhostTransform<P>>
): GhostCopy<P>;

// Ghost copy manager for tracking relationships
interface GhostCopyManager<P extends Pitch> {
  // Create a new ghost copy
  create(sourceId: string, transform: Partial<GhostTransform<P>>, copyType?: GhostCopyType): GhostCopy<P>;
  
  // Get all ghosts of a source
  getGhostsOf(sourceId: string): readonly GhostCopy<P>[];
  
  // Get the source of a ghost
  getSource(ghostId: string): string | null;
  
  // Freeze a ghost (break link)
  freeze(ghostId: string): DecoupledPhrase<P>;
  
  // Update source and propagate to linked ghosts
  updateSource(sourceId: string, phrase: DecoupledPhrase<P>): void;
  
  // Get all phrases affected by a source change
  getAffectedPhrases(sourceId: string): readonly string[];
}

// Example: Create ghost copies for call-and-response
const originalPhrase = createDecoupledPhrase(/* ... */);
const responseGhost = createGhostCopy(originalPhrase, {
  transpose: 5,          // up a fourth
  timeOffset: 1920,      // delay by one bar
  velocityScale: 0.8,    // slightly softer
}, 'linked');

// When originalPhrase changes, responseGhost automatically follows
```

### 7.4.8 Variation Types and Transformation System

Comprehensive variation generation following RapidComposer patterns:

```ts
type VariationType =
  // Pitch variations
  | 'transpose'          // shift all pitches
  | 'invert'             // mirror around axis
  | 'retrograde'         // reverse time
  | 'retrograde-invert'  // both
  | 'modal-shift'        // shift to different mode
  | 'octave-displace'    // random octave shifts
  | 'neighbor-embellish' // add neighbor tones
  | 'passing-tones'      // add passing tones
  | 'enclosure'          // chromatic enclosure
  
  // Rhythm variations
  | 'augmentation'       // double durations
  | 'diminution'         // halve durations
  | 'dotted'             // add dots
  | 'syncopate'          // shift off beat
  | 'swing'              // apply swing
  | 'humanize'           // timing variation
  | 'accent-shift'       // move accents
  | 'rest-insert'        // add breathing room
  
  // Density variations
  | 'thin'               // remove notes
  | 'thicken'            // add notes
  | 'simplify'           // reduce to essentials
  | 'elaborate'          // add embellishments
  
  // Contour variations
  | 'flatten'            // reduce range
  | 'exaggerate'         // increase range
  | 'smooth'             // reduce large intervals
  | 'angularize'         // increase intervals
  
  // Harmonic variations
  | 'reharmonize'        // fit to new chords
  | 'modal-interchange'  // borrow from parallel mode
  | 'chromaticize'       // add chromatic alterations
  | 'diatonicize';       // remove chromatic alterations

type VariationConfig = {
  readonly type: VariationType;
  readonly amount: number;      // 0-1 intensity
  readonly seed?: number;       // for reproducibility
  readonly preserveShape?: boolean;  // keep overall contour
  readonly preserveRhythm?: boolean; // keep rhythm structure
};

// Variation generator
function generateVariation<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  config: VariationConfig
): DecoupledPhrase<P>;

// Generate multiple variations at once
function generateVariationSet<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  types: readonly VariationType[],
  count: number
): readonly DecoupledPhrase<P>[];

// Variation chain (apply multiple variations in sequence)
function chainVariations<P extends Pitch>(
  phrase: DecoupledPhrase<P>,
  configs: readonly VariationConfig[]
): DecoupledPhrase<P>;

// Variation morphing (gradual transformation)
function morphVariation<P extends Pitch>(
  from: DecoupledPhrase<P>,
  to: DecoupledPhrase<P>,
  steps: number
): readonly DecoupledPhrase<P>[];

// Variation presets for common use cases
const VARIATION_PRESETS: Record<string, readonly VariationConfig[]> = {
  'subtle-melody': [
    { type: 'neighbor-embellish', amount: 0.3 },
    { type: 'humanize', amount: 0.2 },
  ],
  'rhythmic-variation': [
    { type: 'syncopate', amount: 0.4 },
    { type: 'accent-shift', amount: 0.3 },
  ],
  'dramatic-development': [
    { type: 'exaggerate', amount: 0.5 },
    { type: 'elaborate', amount: 0.6 },
    { type: 'chromaticize', amount: 0.3 },
  ],
  'call-response': [
    { type: 'transpose', amount: 0.5 },  // up a fourth
    { type: 'invert', amount: 0.3 },
  ],
  'minimalist-shift': [
    { type: 'thin', amount: 0.4 },
    { type: 'augmentation', amount: 0.3 },
  ],
};
```

### 7.4.9 Phrase Database and Query System

Full-featured phrase database with RapidComposer-style querying:

```ts
type PhraseRecord<P extends Pitch = MIDIPitch> = {
  readonly id: string;
  readonly name: string;
  readonly phrase: DecoupledPhrase<P>;
  readonly events: Stream<Event<Voice<P>>>;  // materialized
  readonly metadata: PhraseMetadata;
  readonly ghosts: readonly GhostCopy<P>[];
  readonly variations: readonly string[];     // IDs of variation phrases
  readonly parentId?: string;                 // if this is a variation
  readonly tags: readonly string[];
  readonly rating: number;
  readonly usageCount: number;
  readonly createdAt: number;
  readonly modifiedAt: number;
};

type PhraseMetadata = {
  readonly lineType: LineType;
  readonly duration: Tick;
  readonly noteCount: number;
  readonly range: { low: MIDIPitch; high: MIDIPitch };
  readonly ambitus: number;              // range in semitones
  readonly density: number;              // notes per beat
  readonly averageInterval: number;      // average interval size
  readonly contourType: ContourType;
  readonly rhythmComplexity: number;     // 0-1
  readonly harmonicContent: {
    readonly chordTones: number;         // percentage
    readonly scaleTones: number;
    readonly chromaticTones: number;
  };
  readonly mood: readonly MoodTag[];
  readonly genre: readonly GenreTag[];
  readonly instrument: InstrumentCategory;
};

type MoodTag = 
  | 'happy' | 'sad' | 'energetic' | 'calm' | 'tense' | 'relaxed'
  | 'mysterious' | 'triumphant' | 'melancholic' | 'playful' | 'aggressive' | 'peaceful';

type GenreTag =
  | 'pop' | 'rock' | 'jazz' | 'classical' | 'electronic' | 'r&b'
  | 'latin' | 'folk' | 'blues' | 'country' | 'hip-hop' | 'world';

// Advanced query interface
type PhraseQueryAdvanced = {
  // Basic filters
  readonly lineType?: readonly LineType[];
  readonly tags?: readonly string[];
  readonly mood?: readonly MoodTag[];
  readonly genre?: readonly GenreTag[];
  
  // Metric filters
  readonly duration?: { min?: Tick; max?: Tick };
  readonly noteCount?: { min?: number; max?: number };
  readonly range?: { low?: MIDIPitch; high?: MIDIPitch };
  readonly density?: { min?: number; max?: number };
  
  // Harmonic filters
  readonly scale?: ScaleType;
  readonly chordFilter?: readonly ChordQuality[];
  readonly chromaticContent?: { min?: number; max?: number };
  
  // Contour filters
  readonly contourType?: readonly ContourType[];
  readonly intervalSize?: { min?: number; max?: number };
  
  // Similarity search
  readonly similarTo?: string;           // phrase ID
  readonly similarityThreshold?: number; // 0-1
  
  // Sorting
  readonly sortBy?: 'rating' | 'usageCount' | 'createdAt' | 'similarity' | 'duration';
  readonly sortOrder?: 'asc' | 'desc';
  
  // Pagination
  readonly limit?: number;
  readonly offset?: number;
};

interface PhraseDatabase<P extends Pitch = MIDIPitch> {
  // CRUD operations
  add(phrase: DecoupledPhrase<P>, metadata: Partial<PhraseMetadata>): Promise<PhraseRecord<P>>;
  get(id: string): Promise<PhraseRecord<P> | null>;
  update(id: string, updates: Partial<PhraseRecord<P>>): Promise<PhraseRecord<P>>;
  delete(id: string): Promise<void>;
  
  // Query
  query(query: PhraseQueryAdvanced): Promise<readonly PhraseRecord<P>[]>;
  search(text: string): Promise<readonly PhraseRecord<P>[]>;
  findSimilar(phrase: DecoupledPhrase<P>, threshold: number): Promise<readonly PhraseRecord<P>[]>;
  
  // Ghost copy management
  createGhost(sourceId: string, transform: GhostTransform<P>): Promise<GhostCopy<P>>;
  getGhosts(sourceId: string): Promise<readonly GhostCopy<P>[]>;
  
  // Variation management
  createVariation(sourceId: string, config: VariationConfig): Promise<PhraseRecord<P>>;
  getVariations(sourceId: string): Promise<readonly PhraseRecord<P>[]>;
  
  // Statistics
  getStats(): Promise<{
    totalPhrases: number;
    byLineType: Record<LineType, number>;
    byMood: Record<MoodTag, number>;
    byGenre: Record<GenreTag, number>;
  }>;
  
  // Import/Export
  import(data: readonly PhraseRecord<P>[]): Promise<void>;
  export(query?: PhraseQueryAdvanced): Promise<readonly PhraseRecord<P>[]>;
}
```

### 7.4.10 Phrase Card Integration

Cards that use the phrase system:

```ts
// Phrase Generator Card
const PHRASE_GENERATOR_CARD: CardDefinition<PhraseGenInputs, PhraseGenOutputs> = {
  type: 'phrase-generator',
  name: 'Phrase Generator',
  category: 'generator',
  signature: {
    inputs: [
      { name: 'chords', type: { kind: 'stream', type: {} as Stream<Event<ChordPayload>> } },
      { name: 'scale', type: { kind: 'control', type: {} as Control } },
    ],
    outputs: [
      { name: 'events', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
      { name: 'phrase', type: { kind: 'any', type: {} as DecoupledPhrase<MIDIPitch> } },
    ],
  },
  params: {
    lineType: { type: 'enum', options: LINE_TYPES, default: 'melody', group: 'Type' },
    contour: { type: 'enum', options: CONTOUR_TYPES, default: 'arch', group: 'Shape' },
    rhythm: { type: 'enum', options: RHYTHM_PATTERN_IDS, default: 'melody-quarter', group: 'Rhythm' },
    density: { type: 'number', min: 0, max: 1, default: 0.5, group: 'Density' },
    complexity: { type: 'number', min: 0, max: 1, default: 0.5, group: 'Complexity' },
    rangeLow: { type: 'number', min: 0, max: 127, default: 48, group: 'Range' },
    rangeHigh: { type: 'number', min: 0, max: 127, default: 84, group: 'Range' },
  },
};

// Phrase Browser Card
const PHRASE_BROWSER_CARD: CardDefinition<PhraseBrowserInputs, PhraseBrowserOutputs> = {
  type: 'phrase-browser',
  name: 'Phrase Browser',
  category: 'utility',
  signature: {
    inputs: [
      { name: 'query', type: { kind: 'control', type: {} as Control } },
    ],
    outputs: [
      { name: 'selected', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
      { name: 'phrase', type: { kind: 'any', type: {} as DecoupledPhrase<MIDIPitch> } },
    ],
  },
  renderUI: (state) => {
    // Renders phrase browser with filters, search, preview
  },
};

// Phrase Variation Card
const PHRASE_VARIATION_CARD: CardDefinition<VariationInputs, VariationOutputs> = {
  type: 'phrase-variation',
  name: 'Phrase Variation',
  category: 'transform',
  signature: {
    inputs: [
      { name: 'phrase', type: { kind: 'any', type: {} as DecoupledPhrase<MIDIPitch> } },
    ],
    outputs: [
      { name: 'variation', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
      { name: 'phrase', type: { kind: 'any', type: {} as DecoupledPhrase<MIDIPitch> } },
    ],
  },
  params: {
    variationType: { type: 'enum', options: VARIATION_TYPES, default: 'neighbor-embellish', group: 'Type' },
    amount: { type: 'number', min: 0, max: 1, default: 0.5, group: 'Amount' },
    preserveShape: { type: 'boolean', default: true, group: 'Preserve' },
    preserveRhythm: { type: 'boolean', default: false, group: 'Preserve' },
    seed: { type: 'number', min: 0, max: 999999, default: 0, group: 'Random' },
  },
};

// Ghost Copy Card
const GHOST_COPY_CARD: CardDefinition<GhostInputs, GhostOutputs> = {
  type: 'ghost-copy',
  name: 'Ghost Copy',
  category: 'utility',
  signature: {
    inputs: [
      { name: 'source', type: { kind: 'any', type: {} as DecoupledPhrase<MIDIPitch> } },
    ],
    outputs: [
      { name: 'ghost', type: { kind: 'stream', type: {} as Stream<Event<Voice<MIDIPitch>>> } },
    ],
  },
  params: {
    copyType: { type: 'enum', options: GHOST_COPY_TYPES, default: 'linked', group: 'Link' },
    transpose: { type: 'number', min: -24, max: 24, default: 0, group: 'Transform' },
    timeOffset: { type: 'number', min: -7680, max: 7680, default: 0, group: 'Transform' },
    velocityScale: { type: 'number', min: 0, max: 2, default: 1, group: 'Transform' },
    octaveShift: { type: 'number', min: -4, max: 4, default: 0, group: 'Transform' },
    invert: { type: 'boolean', default: false, group: 'Transform' },
    retrograde: { type: 'boolean', default: false, group: 'Transform' },
  },
};
```

### 7.4.11 Phrase-Arranger Integration

The phrase system connects to the arranger for coordinated composition:

```ts
// Phrase system receives arranger context
type PhraseArrangerContext = {
  readonly arrangerState: ArrangerState;
  readonly currentChord: RecognizedChord;
  readonly currentStyle: ArrangerStyle;
  readonly energy: number;
  readonly variation: 'A' | 'B' | 'C' | 'D';
  readonly sectionType: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
  readonly measureInSection: number;
  readonly beatInMeasure: number;
};

// Arranger can drive phrase generation
function generatePhraseFromArranger(
  context: PhraseArrangerContext,
  lineType: LineType,
  config: Partial<MelodyGeneratorConfig | BassGeneratorConfig>
): DecoupledPhrase<MIDIPitch>;

// Phrase can respond to arranger changes
function adaptPhraseToContext(
  phrase: DecoupledPhrase<MIDIPitch>,
  context: PhraseArrangerContext
): DecoupledPhrase<MIDIPitch>;

// Coordinated multi-line generation
function generateCoordinatedLines(
  context: PhraseArrangerContext,
  lineTypes: readonly LineType[]
): Record<LineType, DecoupledPhrase<MIDIPitch>>;

// Example workflow:
// 1. Arranger sets up chord progression and style
// 2. Phrase system generates melody fitting the style
// 3. Ghost copies create harmonized countermelodies
// 4. Variations create development over sections
// 5. All lines output to tracker/piano roll for editing
```

### 7.4.12 Real-Time Phrase Manipulation

Interactive phrase manipulation during playback:

```ts
// Live phrase parameter control
type LivePhraseControls = {
  readonly density: Control;           // 0-1 note density
  readonly complexity: Control;        // 0-1 variation complexity
  readonly energy: Control;            // 0-1 velocity/intensity
  readonly contourStrength: Control;   // 0-1 how closely to follow shape
  readonly rhythmTightness: Control;   // 0-1 quantization amount
  readonly chromaticism: Control;      // 0-1 chromatic content
};

// Live phrase triggering
type PhraseTrigger = {
  readonly phraseId: string;
  readonly startPosition: Tick;
  readonly transpose: number;
  readonly velocity: number;
  readonly legato: boolean;
};

// Phrase player state machine
type PhrasePlayerState = {
  readonly currentPhrase: DecoupledPhrase<MIDIPitch> | null;
  readonly position: Tick;
  readonly isPlaying: boolean;
  readonly pendingTriggers: readonly PhraseTrigger[];
  readonly liveControls: LivePhraseControls;
};

type PhrasePlayerCommand =
  | { type: 'trigger'; trigger: PhraseTrigger }
  | { type: 'stop' }
  | { type: 'setControl'; control: keyof LivePhraseControls; value: number }
  | { type: 'freeze' }
  | { type: 'unfreeze' };

function processPhrasePlayerCommand(
  state: PhrasePlayerState,
  command: PhrasePlayerCommand
): PhrasePlayerState;
```

---

## Part VIII) Timbre-first sound design and analysis

---

## 8.1 Timbre-first sound design

Timbre is a first-class element, not just a byproduct of synths.

### 8.1.1 Timbre cards
- Spectral map: edit energy across partials over time
- Resynthesis: derive harmonic control from audio
- Granular field: manipulate time and grain density as events
- Sample sculptor: slice, envelope, and re-map sample segments

### 8.1.2 Timbre events
We allow timbre changes to be recorded as Events so they can be sequenced, humanized, or algorithmically generated.

### 8.1.3 Analysis as event streams

Analysis cards emit events:
- onset events
- pitch tracking events
- spectral centroid events

These events can drive modulation or be used as editing overlays.

### 8.1.4 Spectral editing as event editing

Spectral edits are stored as events targeting spectral parameters:
- tilt
- brightness
- noise ratio

This allows a timbre curve to be automated and sequenced like any other event.

### 8.1.5 Sample semantics and slicing

Samples are treated as assets referenced by events:
- NoteEvents can carry sampleId or sliceId.
- Slice grids are metadata that can be edited without changing the event structure.

This keeps sample workflows aligned with the event model.

---

## Part IX) Live recording and performance

---

## 9.1 Live recording and performance

### 9.1.1 Pads and live capture
Pads emit NoteEvents directly into the active EventContainer (Pattern or Take). This is always true, even if a tracker or piano roll is not visible.

### 9.1.2 Performance view
Performance view is a card that shows:
- Launchable scenes
- Live pad recording
- Timeline of recorded takes

Recorded events carry provenance:
- source card
- take id
- performer id

### 9.1.3 Live quantization and capture modes

Recording can operate in modes:
- free: record exact microtiming
- quantized: snap to grid on record
- hybrid: capture microtiming but display quantized

The capture mode is stored as metadata so the user can re-interpret later.

### 9.1.4 Overdubs and comping

Recording over an existing container creates new events rather than replacing:
- overdubs are layered events
- comping selects the best segments into a final take

Comping is expressed as event selection, not destructive deletion.

### 9.1.5 Performance automation

Live performance can record:
- knob movements
- controller gestures
- scene launches

These are stored as automation or meta events so they are replayable.


---

## Part X) Automation and modulation

---

## 10.1 Automation and "everything is automatable"

Automation is an Event and targets any property. The system registers targets via an automation registry.
- Transport: bpm, swing, time signature
- Card knobs: any parameter in any card
- Mix: volume, pan, send
- Visual properties: color, layout (used in visualization)

Modulation is automation driven by another stream. Example:
- audio envelope follower -> modulates filter cutoff
- phrase density -> modulates reverb size

### 10.1.1 Automation targets as registry entries

Targets are discoverable and typed:
- target id
- unit
- range
- default value

This allows UI to auto-render a control lane and prevents invalid automation.

### 10.1.2 Automation layering and priority

Multiple automation sources can target the same parameter:
- base automation (explicit lane)
- modulation (from sources)
- manual overrides (live performance)

Merge order is explicit and deterministic.

### 10.1.3 Automation in non-audio domains

Automation is not limited to audio:
- layout transitions
- card visibility
- scene launch probabilities

This makes the UI itself a performable surface.

---

## Part XI) Engine and render pipeline

---

## 11.1 Audio engine and render pipeline

The audio engine has a simple structure:

1) Event scheduler resolves events for the current time slice.
2) Event -> Voice translator maps NoteEvents to instruments.
3) Audio graph renders through stacks and buses.
4) Output graph combines all final AudioBuffers.

### 11.1.1 Engine context (parametric)

The engine context uses the parametric `Context<D, M>` type:

```ts
// EngineSpec is the data for the engine context
type EngineSpec = {
  sampleRate: number;
  bufferSize: number;
};

// EngineMeta is the runtime metadata
type EngineMeta = {
  now: number;          // ticks
  bpm: number;
  timeSignature: TimeSignature;
};

// EngineContext is just Context<EngineSpec, EngineMeta>
type EngineContext = Context<EngineSpec, EngineMeta> & {
  registry: TargetRegistry;
};
```

### 11.1.2 Provenance and explainability
Every rendered audio frame can be traced to:
- Event ids
- Cards involved
- Parameter values and automation at that time

This enables an "explain" panel: why did I hear this sound at this time?

### 11.1.3 Scheduler phases

The scheduler operates in phases:

1) resolve time map (tempo/meter events)
2) select events in window
3) evaluate automation and modulation
4) dispatch to card graph

Each phase is deterministic and traceable.

### 11.1.4 Voice allocation

Instruments allocate voices based on NoteEvents:
- polyphony limits
- voice stealing policies
- per-note parameters

Voice allocation is consistent between live playback and offline render.

### 11.1.5 Real-time vs offline render

The engine supports two modes:
- real-time: low latency, bounded computation
- offline: unlimited lookahead, higher precision

Both modes share the same event selection and automation logic.

### 11.1.6 Buffering and latency compensation

The engine maintains a latency model:
- each card declares latency
- the graph aligns outputs to a shared timeline

This keeps audio and event playback consistent even with heavy processing.

---

## Part XII) Visual system and interaction language

---

## 12.1 Visual system: elegant, not a rack

The visual language is inspired by modular systems but intentionally avoids cable chaos. The interface uses:
- layered panels and magnetic routing ribbons
- clear input/output badges
- stack headers that show type signatures at a glance
- animation that reveals structure only when needed

The goal is elegance: a calm studio surface, not a circuitboard.

### 12.1.1 Spatial hierarchy

The UI uses depth to show meaning:
- cards sit on the deck surface
- stacks have a subtle raised frame
- inspectors and overlays float above the deck

This creates a visual hierarchy without clutter.

### 12.1.2 Type visibility without noise

Type information is shown in a compact, glanceable form:
- small input/output badges on each card
- a stack signature banner when hovering
- color-coded adapters for mismatches

The user sees type structure only when needed.

### 12.1.3 Routing without cables

Instead of physical cables, the UI uses:
- routing ribbons between ports
- animated flow when audio is passing
- dashed lines for conditional connections

This conveys structure without overwhelming the user.

### 12.1.4 Motion as explanation

Motion is used to reveal structure:
- stacks expand slightly when hovered
- adapters animate into place when inserted
- scene launches ripple across related cards

Motion is intentionally subtle and informative.

---

## Part XIII) Deck and workspace

> **Clarification:** In the board-centric architecture, the **Board** is the main workspace; **BoardDeck** is a zone within it. The "deck as workspace" concept here describes the slot-grid view inside certain deck types.
>
> See [Deck Systems](./docs/canon/deck-systems.md) for the full disambiguation of deck concepts.

---

## 13.1 Deck and card layout

The deck (zone) is a workspace surface. Cards live in a grid. Cards can be:
- stacked into serial or parallel groups
- focused to fullscreen (double-click)
- collapsed to minimal chips

### 13.1.1 Grid and layout rules

The deck grid is flexible:
- cards snap to a grid for visual alignment
- free positioning is allowed in pro mode
- stacks maintain relative internal layout

### 13.1.2 Focus and fullscreen

Any card can be focused:
- double-click to expand
- escape to return
- focus preserves the card's state

Focus mode is a view transform, not a separate card.

### 13.1.3 Card sizing and readability

Cards have minimum sizes based on their UI:
- trackers and piano roll are wider
- small utility cards can collapse to chips

This ensures every card remains usable without overwhelming the deck.

### 13.2 Stacking tutorial
On first open, the UI provides a short tutorial showing:
- how stacking is like layering instruments or chaining effects
- how types unify (EventStream -> AudioBuffer)
- how to split stacks into separate cards

---

## 13.3 Board-Centric Architecture and the Control Spectrum

CardPlay organizes workspaces around **Boards**—typed environment configurations that determine which Cards are available and how they behave. Boards exist on a **control spectrum** from fully manual to fully generative.

### 13.3.1 The Control Spectrum: Core Concept

Users choose their level of control by choosing a Board:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           THE CONTROL SPECTRUM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FULL MANUAL                                                    FULL GENERATIVE │
│  ◄────────────────────────────────────────────────────────────────────────────► │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   NOTATION   │  │   TRACKER    │  │  TRACKER +   │  │  AI ARRANGER │        │
│  │    BOARD     │  │    BOARD     │  │   PHRASES    │  │    BOARD     │        │
│  │              │  │              │  │              │  │              │        │
│  │ Write every  │  │ Type every   │  │ Type + drag  │  │ Play chords, │        │
│  │ note by hand │  │ note by hand │  │ from library │  │ AI does rest │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                 │
│        ▲                  ▲                  ▲                  ▲               │
│   "I control         "I control        "I control         "I provide           │
│    everything"        everything"       the ideas"         direction"          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 13.3.2 Type-Theoretic Foundation: Boards as Typed Environments

A Board is a **type-level configuration** that restricts the space of available Cards:

```typescript
// A Board is parameterized by:
// - L: the ControlLevel (affects which card types are available)
// - C: the CompositionToolConfig (concrete availability of tools)
// - V: the primary View type (tracker, notation, session, etc.)

type ControlLevel = 
  | 'full-manual'           // You control everything
  | 'manual-with-hints'     // Manual + visual suggestions
  | 'assisted'              // Your ideas + tool execution
  | 'collaborative'         // 50/50 with AI
  | 'directed'              // You direct, AI creates
  | 'generative';           // AI creates, you curate

type Board<
  L extends ControlLevel,
  C extends CompositionToolConfig,
  V extends ViewType
> = {
  id: string;
  name: string;
  controlLevel: L;
  compositionTools: C;
  primaryView: V;
  
  // Type-level constraint: only cards compatible with L are allowed
  allowedCards: CardFilter<L, C>;
  
  // Deck slots are typed by what cards they can hold
  decks: DeckSlot<CardFilter<L, C>>[];
  
  // Layout and interaction
  layout: BoardLayout;
  shortcuts: KeyboardShortcutMap;
};

// CardFilter is a type-level function that returns allowed card types
type CardFilter<L extends ControlLevel, C extends CompositionToolConfig> = 
  L extends 'full-manual' ? ManualCards :
  L extends 'manual-with-hints' ? ManualCards | HintCards :
  L extends 'assisted' ? ManualCards | HintCards | AssistedCards :
  L extends 'collaborative' ? ManualCards | HintCards | AssistedCards | CollaborativeCards :
  L extends 'directed' ? AllCards :
  L extends 'generative' ? AllCards :
  never;

// Card type categories
type ManualCards = TrackerCard | NotationCard | SamplerCard | InstrumentCard | EffectCard;
type HintCards = HarmonyDisplayCard | ScaleOverlayCard | ChordToneHighlightCard;
type AssistedCards = PhraseDatabaseCard | OnDemandGeneratorCard | CommandPaletteAICard;
type CollaborativeCards = InlineSuggestionCard | ContextualGeneratorCard;
type GenerativeCards = ArrangerCard | AutonomousGeneratorCard | AIComposerCard;
type AllCards = ManualCards | HintCards | AssistedCards | CollaborativeCards | GenerativeCards;
```

### 13.3.3 Boards as Functors Over Card Categories

Mathematically, a Board is a **functor** from the category of ControlLevels to the category of available Cards:

```
Board : ControlLevel → Set<Card>

Where:
  Board('full-manual') = { TrackerCard, NotationCard, SamplerCard, ... }
  Board('assisted') = Board('full-manual') ∪ { PhraseDatabaseCard, GeneratorCard, ... }
  Board('generative') = Board('assisted') ∪ { ArrangerCard, AIComposerCard, ... }
```

This functor is **monotonic**: more permissive ControlLevels include all cards from less permissive levels. You can always "downgrade" to manual within a generative board.

### 13.3.4 CompositionToolConfig as a Type-Level Record

The `CompositionToolConfig` is a product type where each field's mode determines UI behavior:

```typescript
type CompositionToolConfig = {
  phraseDatabase: ToolConfig<'phraseDatabase'>;
  harmonyExplorer: ToolConfig<'harmonyExplorer'>;
  phraseGenerators: ToolConfig<'phraseGenerators'>;
  arrangerCard: ToolConfig<'arrangerCard'>;
  aiComposer: ToolConfig<'aiComposer'>;
};

type ToolConfig<K extends ToolKind> = {
  enabled: boolean;
  mode: ToolMode<K>;
};

// Modes are tool-specific
type ToolMode<K> = 
  K extends 'phraseDatabase' ? 'hidden' | 'browse-only' | 'drag-drop' | 'auto-suggest' :
  K extends 'harmonyExplorer' ? 'hidden' | 'display-only' | 'suggest' | 'auto-apply' :
  K extends 'phraseGenerators' ? 'hidden' | 'on-demand' | 'continuous' :
  K extends 'arrangerCard' ? 'hidden' | 'manual-trigger' | 'chord-follow' | 'autonomous' :
  K extends 'aiComposer' ? 'hidden' | 'command-palette' | 'inline-suggest' | 'autonomous' :
  never;

// UI behavior is determined by mode at the type level
type UIBehavior<K extends ToolKind, M extends ToolMode<K>> = {
  canDrag: M extends 'drag-drop' | 'auto-suggest' ? true : false;
  canAutoSuggest: M extends 'auto-suggest' | 'continuous' | 'autonomous' ? true : false;
  showsInPanel: M extends 'hidden' ? false : true;
  requiresUserTrigger: M extends 'on-demand' | 'manual-trigger' | 'command-palette' ? true : false;
};

// Standard configurations
const FULL_MANUAL_TOOLS: CompositionToolConfig = {
  phraseDatabase: { enabled: false, mode: 'hidden' },
  harmonyExplorer: { enabled: false, mode: 'hidden' },
  phraseGenerators: { enabled: false, mode: 'hidden' },
  arrangerCard: { enabled: false, mode: 'hidden' },
  aiComposer: { enabled: false, mode: 'hidden' }
};

const ASSISTED_TOOLS: CompositionToolConfig = {
  phraseDatabase: { enabled: true, mode: 'drag-drop' },
  harmonyExplorer: { enabled: true, mode: 'suggest' },
  phraseGenerators: { enabled: true, mode: 'on-demand' },
  arrangerCard: { enabled: false, mode: 'hidden' },
  aiComposer: { enabled: true, mode: 'command-palette' }
};

const GENERATIVE_TOOLS: CompositionToolConfig = {
  phraseDatabase: { enabled: true, mode: 'auto-suggest' },
  harmonyExplorer: { enabled: true, mode: 'auto-apply' },
  phraseGenerators: { enabled: true, mode: 'continuous' },
  arrangerCard: { enabled: true, mode: 'chord-follow' },
  aiComposer: { enabled: true, mode: 'inline-suggest' }
};
```

### 13.3.5 Practical UI Behavior by Control Level

#### Full-Manual: Zero AI, Zero Suggestions

In `full-manual` mode, the UI is completely passive:

```
WHAT YOU SEE:                          WHAT YOU DON'T SEE:
─────────────────────────────          ───────────────────────────────
• Pattern editor (empty)               • Phrase library panel
• Instrument list                      • Harmony suggestions
• Effect chain                         • "Generate" buttons
• Playback controls                    • AI suggestions
• Undo/redo                           • Chord detection
• Copy/paste                          • Auto-complete hints
```

Event creation in full-manual mode:

```typescript
// Events ONLY come from user input
type ManualEventSource = {
  kind: 'user-input';
  input: 
    | { type: 'keyboard'; key: string; row: number; column: number }
    | { type: 'midi'; note: number; velocity: number; channel: number }
    | { type: 'mouse'; x: number; y: number; action: 'create' | 'move' | 'resize' };
};

// Direct pipeline: User Input → Event Validator → Container
// No suggestion step, no generation step, no AI step.
```

#### Manual-with-Hints: Display Only, No Auto-Action

In `manual-with-hints` mode, the UI shows helpful context but never acts:

```
HINT PANEL (read-only):               PATTERN EDITOR (you control):
┌─────────────────────┐               ┌────────────────────────────────┐
│ Key: C Major        │               │  00 │ C-4 ← green (root)      │
│ Chord: Cmaj7        │               │  01 │ D-4 ← yellow (2nd)      │
│                     │               │  02 │ E-4 ← green (3rd)       │
│ Chord tones:        │               │  03 │ F#4 ← red (out of key!) │
│ ● C ● E ● G ○ B     │               │  04 │ G-4 ← green (5th)       │
└─────────────────────┘               └────────────────────────────────┘

Notes are COLOR-CODED by harmonic function, but YOU type every note.
The system NEVER inserts notes. The hint panel is PASSIVE.
```

#### Assisted: You Trigger, System Executes

In `assisted` mode, tools activate only when you ask:

```typescript
type OnDemandGenerator = {
  // User triggers
  trigger: 'button-click' | 'menu-select' | 'keyboard-shortcut';
  
  // User provides parameters
  params: { style: GeneratorStyle; length: BarCount; complexity: number; };
  
  // Generator runs once and returns editable events
  generate(params: GeneratorParams): Stream<Event<any>>;
  
  // NEVER includes:
  runContinuously(): never;
  autoTriggerOnChordChange(): never;
  suggestWithoutAsking(): never;
};
```

#### Directed: You Provide High-Level Input, AI Fills In

In `directed` mode, you control direction, AI handles details:

```typescript
type ChordFollowArranger = {
  // Input: chord changes from MIDI keyboard
  input: Stream<Event<ChordPayload>>;
  
  // Parameters: style, energy, active parts
  style: ArrangerStyle;
  energy: number;  // 0-1
  activeParts: PartConfig[];
  
  // Output: continuous generation on each chord change
  generateForChord(chord: Chord): Map<PartName, Stream<Event<Voice>>>;
  
  // Like an arranger keyboard: you play chords, it accompanies
  // But unlike a keyboard, you can edit every generated note after
};
```

#### Generative: AI Creates, You Curate

In `generative` mode, AI runs autonomously; you pick what to keep:

```typescript
type AutonomousGenerator = {
  state: 'running' | 'paused';
  
  // Generates a stream of proposals
  proposals: AsyncIterable<Proposal>;
  
  interface Proposal {
    section: Stream<Event<any>>;
    description: string;
    preview(): void;
  }
  
  // User curation actions
  curation: {
    keep(proposalId: string): void;
    regenerate(proposalId: string): void;
    morph(proposalId: string, target: string): void;
    edit(proposalId: string): Container;
  };
  
  // AI acts without being asked; user responds
};
```

### 13.3.6 Per-Track Control Level (Hybrid Boards)

In hybrid boards, each track has its own control level:

```typescript
type TrackWithControlLevel<T extends Track, L extends ControlLevel> = T & {
  controlLevel: L;
  allowedCards: CardFilter<L, any>;
};

type HybridBoard = Board<'hybrid', AllToolsEnabled, 'composer'> & {
  tracks: Array<TrackWithControlLevel<Track, ControlLevel>>;
};

// Example: different tracks, different control levels
const composerProject: HybridBoard = {
  tracks: [
    { name: 'Melody', controlLevel: 'full-manual' },     // You write every note
    { name: 'Bass', controlLevel: 'assisted' },          // Use phrase library
    { name: 'Drums', controlLevel: 'directed' }          // AI generates
  ]
};
```

### 13.3.7 Board Switching as Type-Level Migration

When switching boards, we handle incompatible cards:

```typescript
type BoardSwitch<FromL extends ControlLevel, ToL extends ControlLevel> = {
  preserved: CardFilter<FromL> & CardFilter<ToL>;
  deprecated: Exclude<CardFilter<FromL>, CardFilter<ToL>>;
  newlyAvailable: Exclude<CardFilter<ToL>, CardFilter<FromL>>;
};

// UI behavior: prompt user about deprecated cards
function handleBoardSwitch(from: Board, to: Board, currentCards: CardInstance[]): SwitchResult {
  const incompatible = currentCards.filter(c => !isAllowedIn(c, to.allowedCards));
  
  if (incompatible.length > 0) {
    return {
      status: 'requires-migration',
      incompatibleCards: incompatible,
      options: [
        'freeze-to-events',  // Render generative output to static events
        'disable',           // Keep but disable
        'remove'             // Remove from project
      ]
    };
  }
  return { status: 'compatible' };
}
```

### 13.3.8 Board Categories

| Control Level | Board Type | You Control | System Provides |
|---------------|------------|-------------|-----------------|
| **100% Manual** | Notation Board | Every note | Playback only |
| **100% Manual** | Basic Tracker | Every note, effect | Playback only |
| **90% Manual** | Tracker + Harmony | Notes | Harmonic hints |
| **80% Manual** | Tracker + Phrases | Structure | Phrase library |
| **70% You** | Session + Generator | Song structure | Clip generation |
| **50/50** | Assisted Arranger | Chords, style | Parts, patterns |
| **30% You** | AI Composition | Direction | Most content |
| **20% You** | Generative Board | Constraints | Everything |

### 13.3.9 Event Flow by Control Level

```typescript
// Manual: User → Editor → Events → Playback
type ManualEventFlow = {
  source: 'user-input';
  path: ['editor', 'events', 'playback'];
  generatorInvolved: false;
};

// Assisted: User → Editor → Events (or) User → Generator (on demand) → Events
type AssistedEventFlow = {
  source: 'user-input' | 'user-triggered-generator';
  generatorInvolved: 'on-demand';
};

// Directed: User → High-Level Input → Generator → Events
type DirectedEventFlow = {
  source: 'chord-input' | 'style-selection';
  generatorInvolved: 'continuous';
};

// Generative: Generator → Events, User → Curation
type GenerativeEventFlow = {
  source: 'autonomous-generator';
  userRole: 'curator';
  generatorInvolved: 'autonomous';
};
```

---

## Part XIV) Example stacks and workflows

---

## 14.1 Example stacks

All stacks use the parametric type system. Type signatures show the composition.

### 14.1.1 Rhythm UI layer
- Tracker -> PianoRoll -> Session
Parallel stack: all read/write the same `Container<"pattern", Event<any>>`.
Type: `Track<"pattern", E, V>` views

### 14.1.2 Master chain
- Mixer -> Limiter -> Meter
Serial stack: `AudioBuffer -> AudioBuffer -> Analysis<MeterPayload>`

### 14.1.3 Phrase composer
- PhraseGen -> Humanize -> RenderInstrument
Serial stack: `Stream<Event<Voice<P>>> -> Stream<Event<Voice<P>>> -> AudioBuffer`

### 14.1.4 Carnatic performance stack

- KonnakolGenerator -> RagaConstraint -> GamakaTransform -> RenderInstrument
Serial stack using parametric Carnatic types:
```
Stream<Event<KonnakolPayload>> 
  -> Stream<Event<Voice<SwaraPitch>>>  // via Rules<E, TalaContext>
  -> Stream<Event<Voice<SwaraPitch>>>  // via Rules<E, RagaContext>
  -> AudioBuffer
```

### 14.1.5 Analysis feedback stack

- MicInput -> OnsetDetector -> PatternRecorder
Serial stack: `AudioBuffer -> Stream<Event<OnsetPayload>> -> Container<"pattern">`

### 14.1.6 Timbre sculpting stack

- PianoRoll -> RenderInstrument -> SpectralMap -> GranularField
Serial stack: `Stream<Event<Voice<P>>> -> AudioBuffer -> AudioBuffer -> AudioBuffer`

---

## 14.2 Board-Based Workflow Examples

These examples show how different boards enable different workflows, all using the same underlying event model.

### 14.2.1 Traditional Composer Workflow (Full Manual)

**Board**: Notation Board (Manual)  
**Control Level**: `full-manual`  
**Cards Available**: `ManualCards` only

```typescript
// Workflow: Write a string quartet movement
const workflow = {
  board: 'notation-board-manual',
  controlLevel: 'full-manual',
  
  steps: [
    // 1. Create score container
    { action: 'create-container', kind: 'score', name: 'String Quartet No. 1' },
    
    // 2. Add players (instruments)
    { action: 'add-players', players: ['Violin I', 'Violin II', 'Viola', 'Cello'] },
    
    // 3. Write notes by hand (every note is user input)
    { action: 'write-note', player: 'Violin I', pitch: 'C5', duration: '4n', bar: 1 },
    { action: 'write-note', player: 'Violin I', pitch: 'E5', duration: '4n', bar: 1 },
    // ... hundreds more notes, all typed by user
    
    // 4. Add articulations and dynamics
    { action: 'add-articulation', player: 'Violin I', bar: 1, type: 'legato' },
    { action: 'add-dynamic', player: 'Cello', bar: 1, type: 'mp' }
  ],
  
  // What the system provides:
  systemProvides: ['playback', 'engraving', 'part-extraction'],
  
  // What the system does NOT provide:
  systemDoesNot: ['suggestions', 'auto-complete', 'phrase-library', 'generation']
};
```

**Type Signature:**
```
NotationBoard<'full-manual'> 
  → User types every Event<Voice<MIDIPitch>> 
  → Container<"score", Event<Voice<MIDIPitch>>> 
  → Playback
```

### 14.2.2 Tracker Purist Workflow (Full Manual)

**Board**: Basic Tracker Board  
**Control Level**: `full-manual`  
**Cards Available**: `ManualCards` only

```typescript
// Workflow: Create a chiptune track
const workflow = {
  board: 'basic-tracker-board',
  controlLevel: 'full-manual',
  
  steps: [
    // 1. Create pattern container
    { action: 'create-container', kind: 'pattern', name: 'Pattern 00' },
    
    // 2. Type notes in tracker grid (keyboard input)
    { action: 'type-note', row: 0, column: 'note', value: 'C-4', instrument: '01' },
    { action: 'type-note', row: 0, column: 'volume', value: '80' },
    { action: 'type-note', row: 4, column: 'note', value: 'E-4', instrument: '01' },
    
    // 3. Add effects via effect columns (also typed)
    { action: 'type-effect', row: 8, column: 'fx1', value: '0A08' }, // Arpeggio
    
    // 4. Create pattern sequence
    { action: 'sequence-patterns', order: ['00', '00', '01', '02', '00'] }
  ],
  
  // UI shows: pattern editor, instrument list, effect chain
  // UI hides: phrase library, harmony panel, generators, AI tools
  visiblePanels: ['pattern-editor', 'instruments', 'dsp-chain', 'pattern-matrix'],
  hiddenPanels: ['phrase-library', 'harmony-helper', 'generators', 'ai-composer']
};
```

### 14.2.3 Assisted Production Workflow (Tracker + Phrases)

**Board**: Tracker + Phrases Board  
**Control Level**: `assisted`  
**Cards Available**: `ManualCards | AssistedCards`

```typescript
// Workflow: Create an EDM track with phrase library assistance
const workflow = {
  board: 'tracker-phrases-board',
  controlLevel: 'assisted',
  
  steps: [
    // 1. Type the lead melody manually (full control)
    { action: 'type-note', row: 0, column: 'note', value: 'E-5' },
    // ... melody is handwritten
    
    // 2. Drag a bass phrase from library (assisted)
    { 
      action: 'drag-phrase',
      source: 'phrase-library://bass/synth-wobble-01',
      target: { pattern: '00', track: 'Bass', startRow: 0 }
    },
    // Phrase expands to editable notes
    
    // 3. Edit the dragged phrase (back to manual)
    { action: 'type-note', row: 8, column: 'note', value: 'G-2' },  // Change one note
    
    // 4. Use on-demand generator for drums (user triggers)
    { 
      action: 'trigger-generator',
      generator: 'drum-pattern-generator',
      params: { style: 'breakbeat', length: '4bars', complexity: 0.7 },
      target: { pattern: '00', track: 'Drums' }
    },
    // Generator runs once, produces editable notes
    
    // 5. Fine-tune generated drums (manual again)
    { action: 'delete-note', row: 12, track: 'Drums' },
    { action: 'type-note', row: 14, column: 'note', value: 'D-3' }
  ],
  
  // Flow: manual → assisted → manual → assisted → manual
  // User is always in control of WHEN to use assistance
};
```

**Type Signature:**
```
TrackerPhrasesBoard<'assisted'>
  → User creates Event<Voice<P>> OR drags Phrase → Stream<Event<Voice<P>>>
  → User can trigger Generator → Stream<Event<Voice<P>>>
  → All events are editable in Container<"pattern">
  → Playback
```

### 14.2.4 AI Arranger Workflow (Directed)

**Board**: AI Arranger Board  
**Control Level**: `directed`  
**Cards Available**: `AllCards`

```typescript
// Workflow: Create a jazz backing track by playing chords
const workflow = {
  board: 'ai-arranger-board',
  controlLevel: 'directed',
  
  steps: [
    // 1. Configure arranger style
    { action: 'set-style', style: 'jazz-swing', energy: 0.6 },
    
    // 2. Enable parts
    { action: 'enable-parts', parts: ['drums', 'bass', 'piano-comp'] },
    
    // 3. Play chords (user's only note-level input)
    { action: 'play-chord', chord: 'Cmaj7', time: '1:1:1' },
    { action: 'play-chord', chord: 'Dm7', time: '2:1:1' },
    { action: 'play-chord', chord: 'G7', time: '3:1:1' },
    { action: 'play-chord', chord: 'Cmaj7', time: '4:1:1' },
    
    // AI generates drums, bass, piano for each chord
    // Happens automatically (chord-follow mode)
    
    // 4. Trigger a fill (user controls transitions)
    { action: 'trigger-transition', type: 'fill', at: '4:1:1' },
    
    // 5. Capture output to clips (optional)
    { action: 'capture-to-clips', tracks: ['drums', 'bass', 'piano-comp'] }
  ],
  
  // User controls: chords, style, energy, transitions
  // AI controls: drum patterns, bass lines, piano voicings
  userControls: ['chord-input', 'style', 'energy', 'transitions'],
  aiControls: ['drum-generation', 'bass-generation', 'voicing-generation']
};
```

**Type Signature:**
```
AIArrangerBoard<'directed'>
  → User plays Event<ChordPayload>
  → Arranger consumes Stream<Event<ChordPayload>>
  → Arranger generates Map<PartName, Stream<Event<Voice<P>>>>
  → Playback OR capture to Container<"clip">
```

### 14.2.5 Hybrid Composition Workflow (Composer Board)

**Board**: Composer Board  
**Control Level**: `hybrid` (per-track)  
**Cards Available**: `AllCards`

```typescript
// Workflow: Song with mixed control levels
const workflow = {
  board: 'composer-board',
  controlLevel: 'hybrid',
  
  tracks: [
    // Melody track: full-manual (you write every note)
    {
      name: 'Lead Vocal Melody',
      controlLevel: 'full-manual',
      workflow: 'type-every-note'
    },
    
    // Chord track: manual-with-hints (see suggestions, type yourself)
    {
      name: 'Piano Chords',
      controlLevel: 'manual-with-hints',
      workflow: 'type-with-harmony-display'
    },
    
    // Bass track: assisted (drag phrases, edit)
    {
      name: 'Bass',
      controlLevel: 'assisted',
      workflow: 'drag-and-edit-phrases'
    },
    
    // Drums track: directed (AI generates, you trigger)
    {
      name: 'Drums',
      controlLevel: 'directed',
      workflow: 'style-and-trigger'
    },
    
    // Ambient pad: generative (AI creates, you curate)
    {
      name: 'Ambient Pad',
      controlLevel: 'generative',
      workflow: 'curate-from-proposals'
    }
  ],
  
  // Same project, same event model, different control levels per track
  projectType: 'Container<"score", Event<any>>',
  allTracksShareSameEventModel: true
};
```

**Visual Representation:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        HYBRID PROJECT EXAMPLE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TRACK          │ CONTROL LEVEL  │ CARDS AVAILABLE        │ HOW YOU WORK       │
│  ───────────────┼────────────────┼────────────────────────┼──────────────────  │
│  Lead Melody    │ full-manual    │ Notation, Tracker      │ Write every note   │
│  Piano Chords   │ manual+hints   │ Tracker, HarmonyDisplay│ Type, see context  │
│  Bass           │ assisted       │ Tracker, PhraseLibrary │ Drag, then edit    │
│  Drums          │ directed       │ TrackerArranger        │ Style + trigger    │
│  Ambient Pad    │ generative     │ All + AIComposer       │ Curate proposals   │
│                                                                                 │
│  All tracks use the same Event<Voice<P>> model.                                │
│  Control level determines which cards are active for that track.               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 14.2.6 Board Switching Mid-Project

```typescript
// User starts with AI Arranger, then switches to Tracker for fine-tuning
const switchWorkflow = {
  phase1: {
    board: 'ai-arranger-board',
    controlLevel: 'directed',
    action: 'Generate drums via chord-follow arranger'
  },
  
  switch: {
    from: 'ai-arranger-board',
    to: 'basic-tracker-board',
    migration: {
      // Arranger card is incompatible with basic-tracker
      incompatibleCards: ['ArrangerCard'],
      
      // User chooses: freeze to events
      choice: 'freeze-to-events',
      
      // Result: generated drum patterns become static Event<Voice<P>>
      result: 'All generated content is now editable as individual notes'
    }
  },
  
  phase2: {
    board: 'basic-tracker-board',
    controlLevel: 'full-manual',
    action: 'Fine-tune individual drum hits in tracker'
  }
};

// The switch preserves all musical content.
// Only the available tools change.
```

---

## Part XV) Canonical DSL and text representation

---

## 15.1 Canonical DSL

Every stack has a canonical textual form for LLM edits and version control.

```ts
stack "Drum FX" {
  mode: "layer"
  composition: "serial"
  cards: [
    tracker("Drums"),
    compressor({ sidechain: "Kick" }),
    reverb({ room: "plate" })
  ]
}
```

The DSL compiles to the same data model used in the UI.

### 15.1.1 DSL design goals

The DSL exists to be:
- human-readable
- unambiguous
- roundtrip-safe (parse -> model -> text)
- editable by LLMs without losing structure

### 15.1.2 DSL structural layers

The DSL has clear layers:
- project: global metadata, transport, root deck
- containers: patterns, scenes, clips, scores, takes
- cards and stacks: composition graph
- events: actual musical data

This mirrors the internal model directly.

### 15.1.3 Event syntax

Events can be defined with symbolic time or tick time:

```ts
note { at: "1:1:0", dur: "1/8", pitch: 60, vel: 0.8 }
note { atTicks: 1920, durTicks: 240, pitch: 60, vel: 0.8 }
```

The DSL supports both for clarity and precision.

### 15.1.4 Automation syntax

Automation lanes are first-class blocks:

```ts
automation "filter.cutoff" {
  target { kind: "card.knob", ref: "card-synth", path: "cutoff" }
  points: [
    { at: "1:1:0", value: 0.2 },
    { at: "1:3:0", value: 0.7, curve: "exp" }
  ]
}
```

### 15.1.5 Constraint syntax

Constraints are expressed as declarative blocks:

```ts
raga "Kalyani" {
  allowed: ["Sa", "Ri2", "Ga3", "Ma#", "Pa", "Dha2", "Ni3"]
  arohana: ["Sa", "Ri2", "Ga3", "Ma#", "Pa", "Dha2", "Ni3", "Sa"]
}
```

### 15.1.6 Versioning and migrations

The DSL includes a version header:

```ts
version "1.0.0"
```

When parsing older files, migrations are applied to ensure compatibility.

### 15.1.7 LLM editing conventions

LLM edits follow conventions:
- preserve ids unless explicitly replaced
- make changes minimal and localized
- add new cards using manifest-compatible syntax

This keeps automated edits safe and diff-friendly.

---

## Part XVI) Implementation map and tests

---

## 16.1 Protocol summary (all parametric protocols)

The system uses these parametric protocols (typeclasses) for composability:

### Core event protocols

| Protocol | Signature | Purpose |
|----------|-----------|---------|
| `Schedulable<E>` | `toEvents(x) -> Stream<E>` | Convert anything to an event stream |
| `Renderable<E>` | `toAudio(events) -> AudioBuffer` | Produce audio output |
| `Transformable<E>` | `split/merge/stretch/shift/quantize` | Event algebra operations |
| `Notatable<P>` | `toNotation/fromNotation` | Notation rendering and parsing |

### Automation protocols

| Protocol | Signature | Purpose |
|----------|-----------|---------|
| `Automatable<T>` | `targets() -> Target<T>[]` | Expose automation targets |
| `Constrainable<E,C>` | `applyRules(events, rules, ctx)` | Apply rule constraints |

### Structural protocols (for meta-cards and contracts)

| Protocol | Signature | Purpose |
|----------|-----------|---------|
| `Patchable<S>` | `emitPatch/applyPatch/previewPatch` | Structural editing via diffs |
| `Contractable` | `declareContract/verifyContract` | Behavior contract verification |
| `Auditable<A>` | `log/replay/revert` | Action logging for undo/redo |
| `Diffable<T>` | `diff/patch/preview` | Compute and apply diffs |

### Serialization protocols

| Protocol | Signature | Purpose |
|----------|-----------|---------|
| `Serializable<T>` | `toDSL/fromDSL` | DSL round-tripping |

### Protocol implementation hierarchy

```
Event<P>        : Transformable, Serializable
Stream<E>       : Schedulable, Transformable (when E : Event)
Container<K,E>  : Diffable, Patchable, Serializable
Lane<T>         : Automatable, Serializable
Voice<P>        : Notatable (when P : Pitch)
Card<A,B>       : Contractable (when user-defined)
Rules<E,C>      : Constrainable
```

---

## 16.2 Implementation map (hypothetical current codebase)

Key modules in the codebase should align to the design:
- `audio/pattern.ts`: Event, Pattern, Scene, container transforms
- `audio/automation-registry.ts`: extensible targets
- `audio/sequencer.ts`: event scheduling and tempo/meter events
- `state/store.ts`: deck state, stacks, card registry, event containers
- `ui/TrackerCard.ts`, `ui/PianoRollCard.ts`, `ui/SessionCard.ts`, `ui/NotationCard.ts`: views over Event containers
- `ui/Card.ts`: consistent card surface and focus behavior

---

## 16.3 Behavior guarantees

1) If types unify, the stack is total and deterministic.
2) Runtime matches compile-time typing; no hidden routing.
3) Events remain the single source of truth across views.
4) Any event can be traced to audio output.
5) All protocol implementations are verified at card registration.
6) Behavior contracts are enforced in sandbox execution.

---

## 16.4 Glossary (parametric type definitions)

The six core parametric types:
- **Event<P>**: a timed interval with payload type P, triggers, and automation
- **Stream<E>**: an ordered sequence of events (replaces EventStream, NoteStream, etc.)
- **Container<K, E>**: a named context owning a Stream (replaces Pattern, Scene, Clip, etc.)
- **Lane<T>**: a temporal projection of values type T (replaces AutomationLane, etc.)
- **Rules<E, C>**: constraints over events E with context C (replaces MelodyRules, etc.)
- **Voice<P extends Pitch>**: a sounding entity with pitch system P

Derived types (aliases for common instantiations):
- **NoteEvent**: `Event<Voice<MIDIPitch>>` - standard MIDI note
- **MicrotonalNoteEvent<P>**: `Event<Voice<P>>` - microtonal note
- **ChordEvent**: `Event<ChordPayload>` - harmonic block
- **Pattern**: `Container<"pattern">` - grid-aware sequence
- **Scene**: `Container<"scene">` - launchable collection
- **AutomationLane**: `Lane<number>` - numeric parameter over time
- **MelodyRules<P>**: `Rules<Event<Voice<P>>, ScaleContext>` - melodic constraints
- **VoiceLeadingRules<P>**: `Rules<Stream<Event<Voice<P>>>, VoicingContext>` - voice leading

Infrastructure types:
- **Card<A, B>**: typed morphism from A to B
- **Stack**: composition group of cards (serial, parallel, tabs)
- **Graph**: the full routing of stacks and cards
- **Track<K, E, V>**: bidirectional lens projecting E to V
- **Context<D, M>**: context with data D and meta M
- **Ref<C>**: reference to container C with transform

Modulation types:
- **Modulation<T>**: `Lane<T>` with a source signal
- **Control**: scalar or low-rate signal for automation
- **Target<T>**: automation target for value type T

---

## 16.5 What this enables

This unified system allows a user to:
- sketch a groove in a tracker
- launch it as a clip in session view
- edit the same notes in notation
- generate harmonies with phrase cards
- add Carnatic ornamentation with gamaka transforms
- record live pad performance into the same event stream
- see a clear lineage from any event to the final audio

All of this occurs without switching mental models or duplicating data. The card system is the single metaphor, and Events are the single truth.

---

## 16.6 Implementation plan (milestones and acceptance criteria)

This is a detailed, ordered path that can be mapped onto the current codebase. Each phase has: scope, concrete changes, tests, and acceptance criteria.

### Phase 0: Baseline instrumentation and invariants

Goal: make behavior observable and add guardrails before larger refactors.

- Add event logging around EventContainer mutations (create/update/delete).
- Add span timing for engine scheduling and card processing.
- Add a small invariants module that can assert:
  - Events are sorted by start time per container.
  - No event has negative duration.
  - All NoteEvents have pitch and velocity.
  - Triggers have valid offsets and kinds.
- Add a "sanity test pack" that runs on CI:
  - Load default project.
  - Ensure tracker/piano roll/notation can read the same container.
  - Ensure automation lanes do not crash when empty.

Acceptance criteria:
- Invariants are enforced in dev builds and logged in production.
- The test pack runs under 1 second locally.

### Phase 1: Event model consolidation

Goal: make Event the single source of truth across views.

Changes:
- Standardize Event shape in `audio/pattern.ts`.
- Make NoteEvent a typed subset with a strict schema.
- Normalize automation to a first-class Event (automation lanes are explicit).
- Update event helpers:
  - `ensurePatternEvents`
  - `updatePatternEvent`
  - `deletePatternEvent`
  - `setStepNote` and `setStepNoteDuration`
- Add a "container sync" utility that can reconcile step data with Events when needed.

Tests:
- Unit tests for update/delete consistency.
- Conversion tests: step data -> events -> step data roundtrip.

Acceptance criteria:
- Tracker, piano roll, session, and notation all read the same events list.
- Changing an event in any view updates all others without reloading.

### Phase 2: EventContainers and interchange

Goal: implement Pattern, Scene, Clip, Score, Take as different facades of the same container API.

Changes:
- Introduce `EventContainer` base type.
- Implement:
  - `materializeSceneAsPattern(scene)` and `clonePatternAsScene(pattern)`
  - `resolveEventTimeline(containerRef)` for stacked containers
- Add metadata fields (loop, length, timeSignature, source).

Tests:
- Scene flattening produces deterministic event order.
- Clip launch merges with existing events without duplication.

Acceptance criteria:
- Session view can trigger clips that are just containers.
- Scenes are interchangeable with patterns when rendered or edited.

### Phase 3: Card registry and type system

Goal: unify typed card signatures and stack composition.

Changes:
- Expand CardSignature and PortType definitions.
- Add type unification rules for serial/parallel/tabs composition.
- Create adapter registry:
  - PatternToEvents
  - EventsToAudio
  - AudioToEvents (analysis)
- Auto-suggest adapters when types mismatch.

Tests:
- Serial stack with mismatch yields warning.
- Auto-adapter insertion creates a valid chain.

Acceptance criteria:
- Stacks show a green "type-safe" badge when unified.
- Mismatches are explainable and fixable in the inspector.

### Phase 4: Unified sequencer + automation engine

Goal: create an event scheduler that handles tempo/meter events and automation.

Changes:
- Sequencer resolves tempo/meter events per time slice.
- Automation lanes evaluate against current time range.
- Voice scheduler maps NoteEvents to instrument cards.
- Extend `automation-registry.ts` so cards can register their targets.

Tests:
- Tempo change event affects tick-to-time conversion.
- Automation points are sampled correctly.

Acceptance criteria:
- Tempo and meter changes are audible and visible in UI.
- Automation lanes control arbitrary card parameters.

### Phase 5: UI surfaces are views, not sources

Goal: make tracker, piano roll, session, and notation read/write the same container.

Changes:
- Implement common EventEditor hooks for create/update/delete.
- Add event lanes to tracker/piano roll/session.
- Add notation card with event queue and inspector.
- Add multi-select and drag editing across views.

Tests:
- Edit in tracker reflects in piano roll and notation.
- Recording creates events visible in all views.

Acceptance criteria:
- A user can edit a note in any view and see it update in the others immediately.
- No view maintains its own separate event list.

### Phase 6: Performance and live capture

Goal: unify live performance, pads, and takes.

Changes:
- Pad hits emit NoteEvents into active container or Take.
- Take merge workflow to commit into Pattern or Scene.
- Scene launching triggers event injections.

Tests:
- Live pad recording creates NoteEvents with source metadata.
- Take merge preserves event timestamps.

Acceptance criteria:
- Pads can record to the timeline even with no editor open.
- Performance view shows live event flow.

### Phase 7: Phrase grammar and algorithmic cards

Goal: implement RapidComposer-like phrase generation and harmonic logic.

Changes:
- Create Phrase card with rule-based event generation.
- Add chord/raga constraint cards that transform events.
- Provide "grammar" definition that can be edited as text or cards.

Tests:
- Phrase card generates deterministic output from a seed.
- Constraints do not produce invalid pitch outside raga rules.

Acceptance criteria:
- A phrase can be edited as text and rendered into events.
- Generated phrases can be edited in tracker or notation.

### Phase 8: Timbre and analysis

Goal: timbre-first manipulation and feedback loop.

Changes:
- Spectral analysis cards that emit analysis events.
- Resynthesis and granular cards that accept EventStream or audio.
- Timbre automation lanes (e.g., spectral tilt, grain density).

Tests:
- Analysis events match audio features for known test cases.
- Timbre automation events affect sound output deterministically.

Acceptance criteria:
- A user can "draw" a timbre curve and hear changes in real time.
- Analysis cards can drive modulation targets.

### Phase 9: UX polish, DSL, and sharing

Goal: finish the glue that makes the system learnable and shareable.

Changes:
- Canonical DSL serialization for cards and stacks.
- Stacking tutorial and type inspector.
- Shareable project snapshots and remix lineage.

Tests:
- DSL export + import yields same deck and events.
- Stacks show consistent signatures in UI and DSL.

Acceptance criteria:
- A project can be recreated from DSL alone.
- The deck UI is stable and predictable under heavy edits.

---

## 22) Canonical DSL examples (deep)

The DSL is human-readable but precise enough to compile into the internal model. The goal is to make every deck state editable as text and roundtrip-safe.

### 22.1 Project and transport

```ts
project "Fifteen Demo" {
  transport { bpm: 124, timeSignature: "7/8", swing: 0.12 }
  containers {
    pattern "Drums A" { length: "2 bars" }
    pattern "Bass A"  { length: "2 bars" }
    scene "Scene 1"   { clips: ["Drums A", "Bass A"] }
  }
}
```

### 22.2 Event definitions

```ts
pattern "Drums A" {
  events: [
    note { at: "1:1:0", dur: "1/16", pitch: 36, vel: 0.9, sample: "kick-01" },
    note { at: "1:1:2", dur: "1/16", pitch: 38, vel: 0.7, sample: "snare-02" },
    tempo { at: "2:1:0", bpm: 128 },
    meter { at: "3:1:0", num: 5, den: 8 }
  ]
}
```

### 22.3 Automation as events

```ts
pattern "Bass A" {
  automation "filter.cutoff" {
    target { kind: "card.knob", ref: "card-bass", path: "cutoff" }
    points: [
      { at: "1:1:0", value: 0.2 },
      { at: "1:3:0", value: 0.7, curve: "exp" }
    ]
  }
}
```

### 22.4 Stacks and type hints (parametric)

Stacks now show parametric type signatures:

```ts
stack "Bass Chain"<P extends Pitch = MIDIPitch> {
  mode: "layer"
  composition: "serial"
  cards: [
    tracker("Bass A")     // Container<"pattern"> -> Stream<Event<Voice<P>>>
    renderInstrument("MonoSynth") // Stream<Event<Voice<P>>> -> AudioBuffer
    saturation({ drive: 0.4 })    // AudioBuffer -> AudioBuffer
  ]
  typeHint: "Container<\"pattern\"> -> AudioBuffer"
}
```

### 22.5 Session view

```ts
session "Main" {
  scenes: [
    sceneRow "Verse" { clips: ["Drums A", "Bass A"] },
    sceneRow "Chorus" { clips: ["Drums B", "Bass B"] }
  ]
  launchQuantize: "1 bar"
}
```

### 22.6 Notation + Carnatic constraints (parametric Rules)

The Carnatic example uses parametric `Rules<E, C>`:

```ts
score "Raga Sketch" {
  meta { raga: "Kalyani", tala: "Adi" }
  events: [
    // Events use Voice<SwaraPitch> payload
    note { at: "1:1:0", dur: "1/4", pitch: "Sa", vel: 0.8, ornament: "kampita" },
    note { at: "1:2:0", dur: "1/4", pitch: "Ma#", vel: 0.7 }
  ]
  // Rules are parametric: Rules<Event<Voice<SwaraPitch>>, RagaContext>
  rules: [
    ragaConstraint<SwaraPitch> { raga: "Kalyani" },
    gamaka<SwaraPitch> { style: "kampita", depth: 0.5 }
  ]
}
```

### 22.7 Algorithmic phrases (parametric)

Phrase generation uses parametric types:

```ts
phrase "Arp Seed"<P extends Pitch = MIDIPitch> {
  scale: Scale<P>("D minor")
  grammar: GrammarRule[] = [
    "A -> A B",
    "B -> C D",
    "C -> up3",
    "D -> down2"
  ]
  render: { length: "4 bars", density: 0.7 }
  // Produces: Stream<Event<Voice<P>>>
}

stack "Phrase Stack"<P extends Pitch = MIDIPitch> {
  composition: "serial"
  cards: [
    phraseGen<P>("Arp Seed"),           // Context<PhraseSpec<P>> -> Stream<Event<Voice<P>>>
    humanize<P>({ timing: 0.02, velocity: 0.1 }), // Stream<E> -> Stream<E>
    renderInstrument<P>("Glass Choir")  // Stream<Event<Voice<P>>> -> AudioBuffer
  ]
}
```

### 22.8 Analysis and feedback (parametric)

Analysis uses parametric types for the output:

```ts
stack "Audio Feedback" {
  composition: "serial"
  cards: [
    micInput(),
    onsetDetector({ sensitivity: 0.6 }),   // AudioBuffer -> Stream<Event<OnsetPayload>>
    patternRecorder("Live Hits")           // Stream<Event<any>> -> Container<"pattern">
  ]
}
```

### 22.9 Live performance and takes

```ts
take "Pad Jam 01" {
  source: "Pads"
  events: [
    note { at: "0:0:0", dur: "1/8", pitch: 36, vel: 1.0, trigger: "pad:0" }
  ]
  mergeTarget: "Drums A"
}
```

### 22.10 Full deck example

```ts
deck "Main" {
  cards: [
    tracker("Drums A"),
    pianoRoll("Bass A"),
    session("Main"),
    notation("Raga Sketch"),
    mixer(),
    masterLimiter()
  ]
  stacks: [
    stack "Rhythm UI" {
      mode: "layer"
      composition: "parallel"
      cards: [ tracker("Drums A"), pianoRoll("Drums A"), session("Main") ]
    },
    stack "Master" {
      composition: "serial"
      cards: [ mixer(), masterLimiter(), meter() ]
    }
  ]
}
```

---

## 23) Mapping appendix: spec to current code paths

This section ties the design to the likely files in the repo. It is intentionally explicit so future refactors have a clear map.

### 23.1 Event core (parametric types)

Files:
- `./src/audio/pattern.ts`

Responsibilities:
- Define `Event<P>`, `Voice<P>`, `Stream<E>` shapes.
- Define `Container<K, E>` interfaces.
- Provide CRUD helpers for events.
- Provide container interchange helpers.
- Provide grid-to-event reconciliation for tracker view.

Suggested API surface using parametric types:
```ts
// Core parametric types
export type Event<P> = { id: string; kind: string; start: number; duration: number; payload: P; meta?: EventMeta; tags?: Record<string, string>; ... };
export type Voice<P extends Pitch> = { pitch: P; velocity: number; channel?: number; sampleId?: string; articulation?: Articulation; envelope?: Envelope; ... };
export type Stream<E> = E[];
export type Container<K extends string, E = Event<any>> = { kind: K; events: Stream<E>; ... };

// Aliases for common instantiations
export type NoteEvent = Event<Voice<MIDIPitch>> & { kind: "note" };
export type Pattern = Container<"pattern">;
export type Scene = Container<"scene">;

// CRUD using parametric types
export function ensurePatternEvents<E>(pattern: Container<"pattern", E>): Container<"pattern", E>;
export function updatePatternEvent<E>(pattern: Container<"pattern", E>, eventId: string, patch: Partial<E>): Container<"pattern", E>;
export function deletePatternEvent<E>(pattern: Container<"pattern", E>, eventId: string): Container<"pattern", E>;

// Container interchange
export function materializeSceneAsPattern<E>(scene: Container<"scene", E>): Container<"pattern", E>;
export function clonePatternAsScene<E>(pattern: Container<"pattern", E>): Container<"scene", E>;
```

### 23.2 Automation targets (parametric Lane<T>)

Files:
- `./src/audio/automation-registry.ts`

Responsibilities:
- Register `Target<T>` entries (transport, card knobs, mix, UI properties).
- Validate ranges and units using the parametric type.
- Provide search/filter for UI picker.

Suggested API using parametric types:
```ts
// Target is parametric
type Target<T> = {
  kind: string;
  ref?: string;
  path?: string;
  range?: [T, T];
};

// Lane is parametric (replaces AutomationLane, ModulationLane, etc.)
type Lane<T> = {
  target: Target<T>;
  points: Point<T>[];
};

// Registration uses parametric targets
function registerTarget<T>(def: {
  key: string;
  label: string;
  unit: string;
  range: [T, T];
}): void;

// Example
registerTarget<number>({
  key: "transport.bpm",
  label: "Tempo",
  unit: "bpm",
  range: [40, 220]
});
```

### 23.3 Sequencer and engine (parametric)

Files:
- `./src/audio/sequencer.ts`
- `./src/audio/engine.ts`

Responsibilities:
- Event scheduling with tempo/meter changes.
- Resolve events into voices and parameter changes.
- Provide render hooks for cards.

Suggested structure using parametric types:
```ts
// Schedule using parametric Container and Stream
function scheduleEvents<E>(container: Container<any, E>, timeRange: TickRange): Stream<E>;

// Apply automation using parametric Lane
function applyAutomation<T>(lanes: Lane<T>[], registry: TargetRegistry): Map<string, T>;

// Voice allocation using Voice<P>
function allocateVoices<P extends Pitch>(
  events: Stream<Event<Voice<P>>>,
  polyphony: number
): VoiceAllocation<P>[];
```

### 23.4 Store and deck state

Files:
- `./src/state/store.ts`
- `./src/state/card-registry.ts`

Responsibilities:
- Store EventContainers and deck layout.
- Track selection, focus, stacking.
- Provide actions for:
  - create/update/delete events
  - add/remove/move cards
  - stack operations
  - tutorial flow

Suggested actions:
```ts
createEvent(containerId, eventData)
updateEvent(containerId, eventId, patch)
deleteEvent(containerId, eventId)
createStack(cardIds, mode, composition)
```

### 23.5 UI: Event views

Files:
- `./src/ui/TrackerCard.ts`
- `./src/ui/PianoRollCard.ts`
- `./src/ui/SessionCard.ts`
- `./src/ui/NotationCard.ts`
- `./src/ui/EventInspector.ts`

Responsibilities:
- Present events in different representations.
- Use shared hooks for create/update/delete.
- Render event lanes for automation and meta events.

Key design rule:
- No view owns its own event list. All views read from store and write via shared actions.

### 23.6 UI: Card system and stacks

Files:
- `./src/ui/Card.ts`
- `./src/ui/DeckGrid.ts`
- `./src/ui/StackInspector.ts` (future)

Responsibilities:
- Consistent card frame and focus behavior.
- Drag-to-stack and adapter suggestions.
- Stack inspector to show type signatures and wiring.

### 23.7 UI: Transport and performance

Files:
- `./src/ui/TransportBar.ts`
- `./src/ui/PerformanceView.ts` (future)

Responsibilities:
- Transport controls for bpm/time signature/record.
- Performance view for clips, scenes, and takes.

### 23.8 CSS and interaction polish

Files:
- `./src/styles/main.css`

Responsibilities:
- Ensure card sizing and stable layout.
- Provide clear event lane visuals and spacing.
- Provide tutorial styling.

### 23.9 Tests

Suggested locations:
- `./tests/store.test.ts`
- `./tests/card-system.test.ts`
- `./tests/event-model.test.ts` (new)

Focus:
- Event CRUD, container interchange.
- Stack typing and auto-adapters.
- Multi-view coherence (edit in tracker -> reflected in piano roll).

---

## 24) Concrete next steps for the current repo

If applied directly to the current repo, the highest leverage changes are:
1) Add a small `event-model.test.ts` that validates CRUD, interchange, and order invariants.
2) Create a shared `useEventEditor` hook used by tracker, piano roll, and notation.
3) Add a Stack Inspector skeleton and expose type signatures in UI.
4) Introduce a minimal DSL export that serializes the deck and patterns.
5) Add a simple "adapter suggestions" card list based on type mismatches.

This turns the spec into a staged implementation plan with measurable milestones.

---

## 25) CardScript Complete & Live System

CardScript provides two modes for defining and invoking cards, optimized for different use cases:

- **Complete Mode**: Verbose, self-documenting definitions suitable for LLM generation
- **Live Mode**: Minimal syntax for real-time performance with low latency

### 25.1 Philosophy

> Define once (complete), invoke many times (live).

Complex cards can be defined with full documentation and then invoked with just a few parameters. This separation allows:
- LLMs to generate rich, documented card definitions
- Humans to perform with minimal keystrokes
- Both to produce the same runtime behavior

### 25.2 Complete Mode (LLM-Friendly)

Complete definitions include all metadata, making them self-documenting:

```typescript
const reverb: CompleteCardDef<number, number, ReverbState> = {
  // Metadata
  id: 'fx.reverb',
  name: 'Reverb',
  category: 'effects',
  description: 'Stereo reverb with decay and damping controls',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['audio', 'reverb', 'space', 'ambience'],
  
  // Inputs
  inputs: [
    { name: 'input', type: 'audio', label: 'Audio Input',
      description: 'The dry audio signal to process' }
  ],
  
  // Outputs
  outputs: [
    { name: 'output', type: 'audio', label: 'Audio Output',
      description: 'The wet/dry mixed signal' }
  ],
  
  // Parameters
  params: [
    { name: 'decay', type: 'number', default: 2.0, min: 0.1, max: 20,
      step: 0.1, label: 'Decay Time', unit: 's', automatable: true },
    { name: 'damping', type: 'number', default: 0.5, min: 0, max: 1,
      step: 0.01, label: 'Damping', automatable: true },
    { name: 'mix', type: 'number', default: 0.3, min: 0, max: 1,
      step: 0.01, label: 'Dry/Wet Mix', unit: '%', automatable: true }
  ],
  
  state: { buffer: new Float32Array(96000), pos: 0 },
  
  process: (input, ctx, state, params) => {
    // Complex reverb algorithm here...
    return { output: processedSignal, state: newState };
  }
};
```

### 25.3 Live Mode (Performance-Friendly)

Live definitions use shorthand syntax for real-time coding:

```typescript
// Same reverb in 3 lines
const reverb = fx<number, number, ReverbState>('Reverb',
  (i, c, s, p) => ({ output: process(i, s, p), state: newState(s) }),
  [n('decay', 2, 0.1, 20), n('damp', 0.5, 0, 1), n('mix', 0.3, 0, 1)]
);
```

### 25.4 Shorthand Reference

| Full | Short | Description |
|------|-------|-------------|
| `generators` | `g` | Category |
| `effects` | `e` | Category |
| `transforms` | `t` | Category |
| `filters` | `f` | Category |
| `routing` | `r` | Category |
| `audio` | `a` | Port type |
| `midi` | `m` | Port type |
| `number` | `n` | Port type |
| `trigger` | `t` | Port type |

Param helpers:
```typescript
n('gain', 1, 0, 2)     // Number: [name, default, min, max]
b('mute', false)       // Boolean: [name, default]
s('mode', 'normal')    // String: [name, default]
```

### 25.5 Invocation System

Register complex cards once, invoke them simply:

```typescript
// Register the complete definition
registerCard(reverbComplete);

// Invoke with minimal params
const out = invoke('fx.reverb', input, ctx, { mix: 0.5 });
const out2 = i('fx.reverb', input, ctx, { decay: 3 });  // Short alias

// Set persistent parameters
set('fx.reverb', 'mix', 0.8);
```

### 25.6 First-Class Live Elements

All these elements are first-class in the live coding system:

**Presets** (named param configurations):
```typescript
pre('verb.hall', 'fx.reverb', { decay: 3.5, mix: 0.4 });
ip('verb.hall', input, ctx);  // Invoke preset
```

**Decks** (card chains):
```typescript
deck('chain.vocal', ['fx.comp', 'fx.eq', 'fx.reverb'], 'series');
id('chain.vocal', input, ctx);  // Invoke deck
```

**Scenes** (multi-card snapshots):
```typescript
scn('verse', { 'fx.reverb': { decay: 2 }, 'fx.filter': { cutoff: 1000 } }, 500);
scene('verse');  // Switch with 500ms transition
```

**Clips** (time-bounded automation):
```typescript
clip('wobble', 'fx.filter', 4, [lane('cutoff', [pt(0,200), pt(2,2000), pt(4,200)])]);
playClip('wobble', beat, true);  // Play looped
```

**Phrases** (musical patterns):
```typescript
phr('bass', 4, [nt(0,36,100,0.5), nt(1,38,80,0.25), nt(2,36,100,1)]);
playPhrase('bass', beat, true, noteOn, noteOff);
```

**Triggers** (event handlers):
```typescript
trig('kick', { type: 'midi', note: 36 }, { type: 'invoke', cardId: 'gen.kick' });
trig('drop', { type: 'beat', division: 4 }, { type: 'scene', sceneId: 'drop' });
activateTrigger('kick');
```

### 25.7 Live DSL Shortcuts Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `i(id, in, ctx, p?)` | Invoke card | `i('fx.rev', sig, ctx, {mix:0.5})` |
| `ip(id, in, ctx, p?)` | Invoke preset | `ip('verb.hall', sig, ctx)` |
| `id(id, in, ctx, p?)` | Invoke deck | `id('chain.vox', sig, ctx)` |
| `set(id, p, v)` | Set param | `set('fx.rev', 'mix', 0.8)` |
| `scene(id)` | Switch scene | `scene('chorus')` |
| `playClip(id, b, l?)` | Play clip | `playClip('wobble', beat)` |
| `playPhrase(id, b, l?)` | Play phrase | `playPhrase('bass', beat)` |
| `pre(id, card, p)` | Create preset | `pre('v.big', 'fx.rev', {...})` |
| `deck(id, cards, r?)` | Create deck | `deck('ch', ['a','b'], 'series')` |
| `scn(id, states, t?)` | Create scene | `scn('dark', {...}, 500)` |
| `clip(id, card, d, a)` | Create clip | `clip('w', 'fx.f', 4, [...])` |
| `phr(id, len, notes)` | Create phrase | `phr('b', 4, [...])` |
| `trig(id, ev, act)` | Create trigger | `trig('k', {...}, {...})` |
| `nt(b, p, v?, d?)` | Create note | `nt(0, 60, 100, 0.5)` |
| `pt(b, v)` | Create point | `pt(0, 200)` |
| `lane(p, pts, c?)` | Create lane | `lane('cut', [...])` |

### 25.8 Performance Considerations

1. **Zero Allocation**: Live mode uses preallocated contexts to avoid GC pauses
2. **Inlined Math**: All math helpers are inlined for minimal overhead
3. **Cached Lookups**: Card registry uses Map for O(1) lookups
4. **Persistent State**: Card states persist across invocations automatically
5. **Batched Updates**: Scene transitions interpolate multiple params efficiently
6. **Beat Quantization**: Changes can be scheduled to beat boundaries

### 25.9 Complete Live Session Example

```typescript
import {
  registerCard, pre, deck, scn, clip, phr, trig,
  i, ip, id, set, scene, playClip, playPhrase, activateTrigger,
  n, nt, pt, lane,
  updateSceneTransition, updateClips, updatePhrases, updateTriggers
} from '@cardplay/cardscript';

// === SETUP ===
registerCard(KickComplete);
registerCard(ReverbComplete);
pre('verb.hall', 'fx.reverb', { decay: 3, mix: 0.4 });
deck('master', ['fx.comp', 'fx.eq', 'fx.limiter']);
scn('intro', { 'fx.filter': { cutoff: 500 } }, 2000);
scn('drop', { 'fx.filter': { cutoff: 8000 } }, 100);
clip('wobble', 'fx.filter', 4, [lane('cutoff', [pt(0,200), pt(2,2000), pt(4,200)])]);
phr('bass', 4, [nt(0,36,100,0.5), nt(2,38,100,0.5)]);
trig('drop', { type: 'midi', note: 60 }, { type: 'scene', sceneId: 'drop' });
activateTrigger('drop');

// === AUDIO CALLBACK ===
function process(input: number, ctx: CardContext): number {
  updateSceneTransition();
  updateClips(ctx.currentTick);
  updatePhrases(ctx.currentTick, prevTick);
  updateTriggers(ctx, midiEvents);
  
  let signal = input;
  signal = i('fx.filter', signal, ctx).value;
  signal = i('fx.reverb', signal, ctx).value;
  return id('master', signal, ctx)[0]?.value ?? signal;
}

// === LIVE TWEAKS ===
set('fx.filter', 'cutoff', 2000);
scene('drop');
playClip('wobble', currentBeat, true);
playPhrase('bass', currentBeat, true, noteOn, noteOff);
```

---

## **Part XXVI) COMPLETE PHASE INTEGRATION: HOW ALL SYSTEMS FIT TOGETHER**

> **⚠️ CRITICAL ARCHITECTURAL DOCUMENT ⚠️**
> 
> This section is **THE DEFINITIVE REFERENCE** for understanding how every phase of CardPlay integrates into a unified system. **Every feature described in Phases 1-40 is NOT standalone**—they are deeply interconnected components of a single coherent architecture. **READ THIS SECTION CAREFULLY** before assuming any phase is independent.

---

### **26.1 THE FUNDAMENTAL INTEGRATION PRINCIPLE**

**EVERYTHING IS AN EVENT. EVERYTHING IS A CARD. EVERYTHING FLOWS THROUGH ONE PIPELINE.**

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   USER INPUT (MIDI/Mouse/Keyboard/Audio/Controller)                          ║
║         │                                                                     ║
║         ▼                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                     EVENT<P> (Parametric Foundation)                 │    ║
║   │   • Every note, automation point, gesture, marker is Event<P>       │    ║
║   │   • Phase 1's type system is THE FOUNDATION for EVERYTHING          │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║         │                                                                     ║
║         ▼                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                     CARD<A,B> (Processing Graph)                     │    ║
║   │   • Phase 2's cards are THE ONLY way to transform events            │    ║
║   │   • Sampler, Arranger, Tracker, Notation—ALL ARE CARDS              │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║         │                                                                     ║
║         ▼                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                     ENGINE (WebAudio + Scheduler)                    │    ║
║   │   • Phase 3's engine renders ALL events to audio                    │    ║
║   │   • Every card's output eventually flows here                       │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║         │                                                                     ║
║         ▼                                                                     ║
║                              AUDIO OUTPUT                                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

### **26.2 SAMPLER ↔ WAVETABLE ↔ SAMPLE EDITOR INTEGRATION**

> **These are NOT three separate systems. They are ONE INSTRUMENT SYSTEM with three views.**

**The Unified Instrument Model:**

```typescript
// ALL instruments share this foundation (Phase 1 + Phase 5)
type InstrumentCard<P extends Pitch> = Card<
  EventStream<NoteEvent<P>>,    // Input: note events
  AudioStream,                   // Output: audio
  InstrumentState<P>            // State: voices, samples, wavetables
>;

// The SAME note event drives ALL instrument types
type NoteEvent<P extends Pitch> = Event<Voice<P>> & { kind: "note" };
```

**How They Connect:**

| Component | Phase | Role | Integration Point |
|-----------|-------|------|-------------------|
| **SamplerCard** | Phase 5.1 | Plays samples in response to `NoteEvent<P>` | Receives events from Arranger, Tracker, Piano Roll, Notation |
| **WavetableCard** | Phase 5.1 | Synthesizes via wavetable in response to `NoteEvent<P>` | SAME input as Sampler—they're interchangeable |
| **SampleEditorCard** | Phase 13 | Edits samples that Sampler plays | Outputs to SamplerCard's sample bank |
| **Sample Browser** | Phase 13 | Selects samples for Sampler | Drag-drops to SamplerCard, updates `InstrumentState.samples` |

**The Integration Flow:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │ SAMPLE BROWSER  │────▶│  SAMPLE EDITOR  │────▶│    SAMPLER      │        │
│  │   (Phase 13)    │     │   (Phase 13)    │     │   (Phase 5.1)   │        │
│  │                 │     │                 │     │                 │        │
│  │ • Find samples  │     │ • Trim/fade     │     │ • Play samples  │        │
│  │ • Preview       │     │ • Loop points   │     │ • Multi-zone    │        │
│  │ • Drag to card  │     │ • Slice         │     │ • Velocity      │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
│          │                        │                      ▲                   │
│          │                        │                      │                   │
│          ▼                        ▼                      │                   │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                        SAME NoteEvent<P> INPUT                   │        │
│  │    From: Tracker, Piano Roll, Notation, Arranger, Sequencer     │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│                     WAVETABLE IS JUST ANOTHER OPTION:                       │
│                                                                              │
│  ┌─────────────────┐                           ┌─────────────────┐          │
│  │   WAVETABLE     │◀──── SAME NoteEvent<P> ──▶│    SAMPLER      │          │
│  │   (Phase 5.1)   │                           │   (Phase 5.1)   │          │
│  │                 │                           │                 │          │
│  │ • Wavetable     │     They receive the      │ • Sample-based  │          │
│  │   synthesis     │     EXACT SAME EVENTS     │   playback      │          │
│  │ • FM/additive   │                           │                 │          │
│  └─────────────────┘                           └─────────────────┘          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Why This Matters:**

1. **You can swap Sampler for Wavetable without changing ANYTHING upstream**—the Tracker, Notation, Piano Roll, and Arranger don't care which sound source plays the notes.

2. **Sample Editor output goes directly into Sampler's sample bank**—they share the same `AudioBuffer` format.

3. **Sample Browser is the discovery layer for Sample Editor which feeds Sampler**—a continuous pipeline.

---

### **26.3 ARRANGER ↔ PHRASE SYSTEM ↔ CHORD TRACK INTEGRATION**

> **These are NOT three separate composition tools. They are ONE HARMONIC ENGINE with three control surfaces.**

**The Unified Harmonic Model:**

```typescript
// Chord Track provides the harmonic context (Phase 17)
type ChordTrack = Container<"chords", Event<ChordPayload>>;

// Arranger consumes chords, outputs multi-voice streams (Phase 5.1.A)
type ArrangerCard = Card<
  EventStream<ChordEvent>,           // Input: chord progression
  MultiVoiceOutput,                  // Output: drums, bass, keys, pad streams
  ArrangerState                      // State: style, variation, section
>;

// Phrase System provides melodic/rhythmic content that follows chords (Phase 18)
type PhraseFollowCard = Card<
  { phrase: Phrase; chords: ChordTrack },  // Input: phrase + harmonic context
  EventStream<NoteEvent>,                   // Output: adapted phrase
  PhraseFollowState
>;
```

**The Integration Triangle:**

```
                    ┌────────────────────────────┐
                    │       CHORD TRACK          │
                    │       (Phase 17)           │
                    │                            │
                    │  Cmaj7 │ Am7 │ Dm7 │ G7   │
                    └────────────────────────────┘
                         │              │
          ┌──────────────┘              └──────────────┐
          │                                            │
          ▼                                            ▼
┌─────────────────────┐                    ┌─────────────────────┐
│     ARRANGER        │                    │   PHRASE SYSTEM     │
│    (Phase 5.1.A)    │                    │    (Phase 18)       │
│                     │                    │                     │
│ • Auto-accompaniment│                    │ • Melodic phrases   │
│ • Style patterns    │                    │ • Chord-following   │
│ • Multi-voice output│                    │ • Ghost copies      │
│                     │                    │                     │
│ Outputs:            │                    │ Outputs:            │
│ • Drums stream      │                    │ • Melody stream     │
│ • Bass stream       │                    │ • Counter-melody    │
│ • Keys stream       │                    │ • Fill patterns     │
│ • Pad stream        │                    │                     │
└─────────────────────┘                    └─────────────────────┘
          │                                            │
          │                                            │
          └──────────────┬─────────────────────────────┘
                         │
                         ▼
          ┌────────────────────────────────────────────┐
          │              UNIFIED OUTPUT                │
          │   All streams combine into EventStream<E>  │
          │   Displayed in: Tracker, Piano Roll,       │
          │   Notation, Session View, Arrangement      │
          └────────────────────────────────────────────┘
```

**Critical Integration Details:**

| From | To | What Flows | How It Works |
|------|-----|-----------|--------------|
| **Chord Track** | **Arranger** | `EventStream<ChordEvent>` | Arranger listens to chord changes, generates accompaniment patterns |
| **Chord Track** | **Phrase System** | `ChordContext` | Phrases transpose/adapt to current chord |
| **Arranger** | **Phrase System** | `ArrangerState` (energy, section, variation) | Phrases adjust density/complexity based on arrangement energy |
| **Phrase System** | **Arranger** | `PhraseQueryResult` | Arranger can query phrase database for fills, melodies |
| **Both** | **All Editors** | `EventStream<NoteEvent>` | Every editor displays the same event data |

**Example of Full Integration:**

```typescript
// 1. Chord Track defines harmony
const chords: ChordTrack = [
  { start: 0, duration: 480, payload: { root: 'C', quality: 'maj7' } },
  { start: 480, duration: 480, payload: { root: 'A', quality: 'm7' } },
  // ...
];

// 2. Arranger generates accompaniment
const arrangerOutput = arrangerCard.process(chords, ctx, arrangerState, {
  style: 'jazz-swing-medium',
  variation: 'A',
  energy: 0.6
});
// Returns: { drums: [...], bass: [...], keys: [...], pad: [...] }

// 3. Phrase system generates melody that follows same chords
const melodyOutput = phraseFollowCard.process({
  phrase: selectedPhrase,
  chords: chords
}, ctx, phraseState, {
  followMode: 'chord-tone',
  adaptation: 0.8
});

// 4. Everything merges into one timeline
const fullArrangement = mergeStreams([
  arrangerOutput.drums,
  arrangerOutput.bass,
  arrangerOutput.keys,
  melodyOutput
]);

// 5. This SINGLE stream is what Tracker/Piano Roll/Notation display
```

---

### **26.4 TRACKER ↔ PIANO ROLL ↔ NOTATION ↔ SESSION VIEW INTEGRATION**

> **These are NOT four separate editors. They are FOUR VIEWS of the SAME DATA.**

**The Single Source of Truth:**

```typescript
// There is ONE event stream per track/container
type TrackData = {
  id: string;
  events: EventStream<NoteEvent>;  // THE source of truth
  meta: TrackMeta;
};

// Every view reads from AND writes to the SAME stream
type EditorView = {
  render: (events: EventStream<NoteEvent>) => void;
  edit: (change: EventChange) => void;  // Modifies the source stream
};
```

**The Multi-View Architecture:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                        SINGLE EVENT STREAM (Source of Truth)                 │
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────┐       │
│    │  Event<Voice<P>>[]  (NoteEvents with pitch, velocity, duration) │       │
│    └─────────────────────────────────────────────────────────────────┘       │
│                                    │                                         │
│         ┌──────────────┬───────────┼───────────┬──────────────┐              │
│         │              │           │           │              │              │
│         ▼              ▼           ▼           ▼              ▼              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │  TRACKER   │ │ PIANO ROLL │ │  NOTATION  │ │  SESSION   │ │ ARRANGE    │ │
│  │ (Phase 9)  │ │ (Phase 10) │ │ (Phase 11) │ │ (Phase 8)  │ │ (Phase 12) │ │
│  │            │ │            │ │            │ │            │ │            │ │
│  │ Row/column │ │ Horizontal │ │ Traditional│ │ Clip grid  │ │ Timeline   │ │
│  │ hex values │ │ time axis  │ │ staff      │ │ launch     │ │ clips      │ │
│  │            │ │            │ │            │ │            │ │            │ │
│  │ Edit → stream │ Edit → stream │ Edit → stream │ Edit → stream │ Edit → stream │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                    │                                         │
│                   ┌────────────────┴────────────────┐                        │
│                   │  ALL EDITS GO BACK TO SOURCE    │                        │
│                   │  Bidirectional sync guaranteed   │                        │
│                   └─────────────────────────────────┘                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key Integration Guarantees:**

1. **Real-time sync**: Edit a note in Piano Roll → immediately appears in Tracker AND Notation.

2. **Lossless conversion**: The `Event<Voice<P>>` type preserves ALL information across views:
   - Tracker sees: step position, hex velocity, instrument column
   - Piano Roll sees: horizontal time, vertical pitch, velocity bars
   - Notation sees: note heads, stems, beams, dynamics
   - ALL from the SAME underlying event!

3. **View-specific metadata is additive, not destructive**:
   ```typescript
   // Notation may add engraving hints
   event.meta.notationHints = { stemDirection: 'up', beamGroup: 3 };
   // Tracker may add effect commands
   event.meta.trackerEffects = [{ cmd: 'volume', val: 0x40 }];
   // These coexist on the SAME event
   ```

**Cross-View Operations:**

| Action | Source View | Effect on Other Views |
|--------|-------------|----------------------|
| Add note | Piano Roll | Appears in Tracker, Notation, Session clip |
| Delete note | Tracker | Disappears from Piano Roll, Notation |
| Change pitch | Notation (drag notehead) | Piano Roll note moves, Tracker row changes |
| Change velocity | Tracker (edit hex) | Piano Roll velocity bar updates |
| Quantize | Any view | All views show quantized positions |

---

### **26.5 GENERATOR CARDS ↔ EDITOR VIEWS ↔ PLAYBACK ENGINE**

> **Generator cards CREATE events. Editor views DISPLAY events. Engine PLAYS events. They are ONE PIPELINE.**

**The Event Lifecycle:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  GENERATION PHASE (Events are created)                                          │
│  ───────────────────────────────────────                                        │
│                                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ DrumMachine   │  │   Arranger    │  │ Arpeggiator   │  │ MelodyGen     │   │
│  │    Card       │  │     Card      │  │    Card       │  │    Card       │   │
│  │ (Phase 5.1)   │  │ (Phase 5.1.A) │  │ (Phase 5.1)   │  │ (Phase 19)    │   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘   │
│          │                  │                  │                  │            │
│          └──────────────────┼──────────────────┼──────────────────┘            │
│                             │                  │                               │
│                             ▼                  ▼                               │
│                    ┌─────────────────────────────────┐                         │
│                    │    EventStream<NoteEvent>       │                         │
│                    │    (Unified output format)      │                         │
│                    └─────────────────────────────────┘                         │
│                                     │                                          │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  EDITING PHASE (Events are displayed and modified)                              │
│  ─────────────────────────────────────────────────                              │
│                                     │                                          │
│                                     ▼                                          │
│          ┌────────────────────────────────────────────────────┐                │
│          │              CONTAINER (Pattern/Clip/Score)         │                │
│          │           Stores EventStream for persistence        │                │
│          └────────────────────────────────────────────────────┘                │
│                                     │                                          │
│          ┌──────────────────────────┼──────────────────────────┐               │
│          │                          │                          │               │
│          ▼                          ▼                          ▼               │
│   ┌─────────────┐           ┌─────────────┐           ┌─────────────┐          │
│   │  TRACKER    │           │ PIANO ROLL  │           │  NOTATION   │          │
│   │   View      │           │    View     │           │    View     │          │
│   │ (Phase 9)   │           │ (Phase 10)  │           │ (Phase 11)  │          │
│   │             │           │             │           │             │          │
│   │ User edits  │◄─────────▶│ User edits  │◄─────────▶│ User edits  │          │
│   │ sync both   │           │ sync both   │           │ sync both   │          │
│   │ ways        │           │ ways        │           │ ways        │          │
│   └─────────────┘           └─────────────┘           └─────────────┘          │
│                                     │                                          │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  PLAYBACK PHASE (Events become audio)                                          │
│  ────────────────────────────────────                                          │
│                                     │                                          │
│                                     ▼                                          │
│                    ┌─────────────────────────────────┐                         │
│                    │       SCHEDULER (Phase 3)       │                         │
│                    │    Tick-to-sample conversion    │                         │
│                    │    Event queue with lookahead   │                         │
│                    └─────────────────────────────────┘                         │
│                                     │                                          │
│                                     ▼                                          │
│          ┌────────────────────────────────────────────────────┐                │
│          │                 INSTRUMENT CARDS                    │                │
│          │    Sampler, Wavetable, Synth (Phase 3 + 5)         │                │
│          │    Convert NoteEvents → AudioBuffer                 │                │
│          └────────────────────────────────────────────────────┘                │
│                                     │                                          │
│                                     ▼                                          │
│                    ┌─────────────────────────────────┐                         │
│                    │      EFFECT CARDS (Phase 5.2)   │                         │
│                    │   Reverb, Delay, Compression    │                         │
│                    └─────────────────────────────────┘                         │
│                                     │                                          │
│                                     ▼                                          │
│                    ┌─────────────────────────────────┐                         │
│                    │        MIXER (Phase 3)          │                         │
│                    │    Routing, levels, panning     │                         │
│                    └─────────────────────────────────┘                         │
│                                     │                                          │
│                                     ▼                                          │
│                              AUDIO OUTPUT                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**The Crucial Point:**

**Generator cards (Arranger, DrumMachine, Arpeggiator, MelodyGenerator) output to the SAME EventStream format that editors (Tracker, Piano Roll, Notation) read AND that instruments (Sampler, Wavetable, Synth) play.**

This means:
- You can generate a drum pattern → see it in the Tracker → edit in Piano Roll → hear via Sampler
- All using the SAME events, not copies or conversions

---

### **26.6 AUTOMATION ↔ MODULATION ↔ PRESET ↔ LIVE CODING INTEGRATION**

> **Parameter control is ONE SYSTEM with four access patterns.**

**The Unified Parameter Model:**

```typescript
// Every automatable parameter (Phase 1.5 + Phase 5.0)
type Parameter<T> = {
  id: string;
  value: T;
  default: T;
  range?: { min: T; max: T };
  automatable: boolean;
  modulatable: boolean;
};

// Four ways to control the SAME parameter:
// 1. Automation (recorded/drawn curves)
// 2. Modulation (real-time LFO/envelope)
// 3. Presets (named snapshots)
// 4. Live coding (programmatic control)
```

**Integration Matrix:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                         PARAMETER: filter.cutoff                                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐│
│  │   AUTOMATION    │  │   MODULATION    │  │     PRESET      │  │ LIVE CODE  ││
│  │   (Phase 10)    │  │   (Phase 1.5)   │  │   (Phase 5.6)   │  │ (Phase 6)  ││
│  │                 │  │                 │  │                 │  │            ││
│  │ ●───●───●───●   │  │    ∿∿∿∿∿∿∿      │  │ "Warm Bass"     │  │ set('f',   ││
│  │ Drawn in        │  │ LFO at 2Hz      │  │ cutoff: 800     │  │ 'cut',     ││
│  │ Piano Roll lane │  │ depth: 50%      │  │                 │  │ 2000)      ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └─────┬──────┘│
│           │                    │                    │                 │       │
│           └────────────────────┼────────────────────┼─────────────────┘       │
│                                │                    │                         │
│                                ▼                    ▼                         │
│                    ┌──────────────────────────────────────┐                   │
│                    │         PARAMETER RESOLUTION          │                   │
│                    │                                        │                   │
│                    │  final = base                          │                   │
│                    │        + automation.valueAt(tick)     │                   │
│                    │        + modulation.valueAt(sample)   │                   │
│                    │        // Preset sets the base        │                   │
│                    │        // Live code can override any  │                   │
│                    └──────────────────────────────────────┘                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**How They Stack:**

1. **Preset** (Phase 5.6): Sets base value → `cutoff = 800`
2. **Automation** (Phase 10): Adds time-varying offset → `+200 at beat 4`
3. **Modulation** (Phase 1.5): Adds real-time variation → `±100 from LFO`
4. **Live Code** (Phase 6): Can override any or all → `set('filter', 'cutoff', 3000)`

**All four coexist on THE SAME PARAMETER simultaneously.**

---

### **26.7 SESSION VIEW ↔ ARRANGEMENT VIEW ↔ LIVE PERFORMANCE INTEGRATION**

> **These are NOT separate modes. They are THREE TEMPORAL PERSPECTIVES on the same content.**

**The Temporal Unity:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                              TIMELINE ABSTRACTION                               │
│                   (All views reference the same timeline)                       │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════    │
│  │ Bar 1  │ Bar 2  │ Bar 3  │ Bar 4  │ Bar 5  │ Bar 6  │ Bar 7  │ Bar 8  │    │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                     │                                           │
│         ┌───────────────────────────┼───────────────────────────┐               │
│         │                           │                           │               │
│         ▼                           ▼                           ▼               │
│  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐     │
│  │  SESSION VIEW   │        │ ARRANGEMENT     │        │ LIVE PERFORM    │     │
│  │   (Phase 8)     │        │   (Phase 12)    │        │   (Phase 6.8)   │     │
│  │                 │        │                 │        │                 │     │
│  │ CLIP GRID:      │        │ LINEAR:         │        │ NOW:            │     │
│  │ ┌───┬───┬───┐   │        │ ═══════════     │        │ ▶ Playing:      │     │
│  │ │ A │ B │ C │   │        │ [Clip A──────]  │        │   Clip A        │     │
│  │ ├───┼───┼───┤   │        │     [Clip B───] │        │ ▶ Queued:       │     │
│  │ │ D │ E │ F │   │        │ [Clip D────]    │        │   Clip B        │     │
│  │ └───┴───┴───┘   │        │                 │        │                 │     │
│  │                 │        │                 │        │                 │     │
│  │ Launch clips    │        │ Linear playback │        │ Real-time       │     │
│  │ Non-linear      │        │ Rendered order  │        │ Low-latency     │     │
│  └─────────────────┘        └─────────────────┘        └─────────────────┘     │
│         │                           │                           │               │
│         │                           │                           │               │
│         └───────────────────────────┼───────────────────────────┘               │
│                                     │                                           │
│                    ┌────────────────┴────────────────┐                          │
│                    │   SAME CLIPS, SAME EVENTS       │                          │
│                    │   Different temporal access     │                          │
│                    └─────────────────────────────────┘                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Integration Workflows:**

| Workflow | Path | Description |
|----------|------|-------------|
| **Jamming → Arrangement** | Session → Arrange | Launch clips in Session, capture to Arrangement timeline |
| **Arrangement → Performance** | Arrange → Live | Render arrangement, trigger sections live |
| **Live → Session** | Live → Session | Record live performance into clip slots |
| **Session ↔ Arrange** | Bidirectional | Clips exist in both, edits sync |

---

### **26.8 MIDI CONTROLLERS ↔ UI ↔ PARAMETERS ↔ CARDS INTEGRATION**

> **Hardware control is mapped through ONE system to ANY card parameter.**

**The Universal Control Mapping:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                            HARDWARE LAYER                                       │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   KEYBOARD   │  │    PADS      │  │    KNOBS     │  │   FADERS     │        │
│  │  (Note On)   │  │ (Note+Vel)   │  │   (CC 0-7)   │  │  (CC 8-15)   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │                │
│         └─────────────────┼─────────────────┼─────────────────┘                │
│                           │                 │                                  │
│                           ▼                 ▼                                  │
│                    ┌─────────────────────────────────┐                         │
│                    │      MIDI LEARN SYSTEM           │                         │
│                    │        (Phase 14.3)              │                         │
│                    │                                  │                         │
│                    │  Maps any MIDI → any Parameter  │                         │
│                    └─────────────────────────────────┘                         │
│                                     │                                          │
│         ┌───────────────────────────┼───────────────────────────┐              │
│         │                           │                           │              │
│         ▼                           ▼                           ▼              │
│  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐    │
│  │  INSTRUMENT     │        │    EFFECT       │        │      UI         │    │
│  │   PARAMS        │        │    PARAMS       │        │    CONTROLS     │    │
│  │                 │        │                 │        │                 │    │
│  │ • Sampler zone  │        │ • Reverb decay  │        │ • Knob position │    │
│  │ • Synth cutoff  │        │ • Delay time    │        │ • Slider value  │    │
│  │ • Arranger var  │        │ • Comp ratio    │        │ • Button state  │    │
│  └─────────────────┘        └─────────────────┘        └─────────────────┘    │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│                         BIDIRECTIONAL FEEDBACK                                  │
│                                                                                 │
│  UI changes → update hardware display (LEDs, motor faders, LCD)                │
│  Preset recall → update hardware to match                                      │
│  Automation playback → update hardware to match                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### **26.9 CHORD TRACK ↔ SCALE CONSTRAINT ↔ GENERATOR ↔ EDITOR INTEGRATION**

> **Harmonic intelligence is ONE SYSTEM that flows through all music creation.**

**The Harmonic Pipeline:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                        HARMONIC INTELLIGENCE FLOW                               │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      CHORD TRACK (Phase 17)                              │   │
│  │                                                                          │   │
│  │   Cmaj7        │    Am7         │    Dm7         │    G7           │    │   │
│  │   ○ ○ ○ ○      │    ○ ○ ○ ○     │    ○ ○ ○ ○     │    ○ ○ ○ ○      │    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│         ┌─────────────────────────────┼─────────────────────────────┐           │
│         │                             │                             │           │
│         ▼                             ▼                             ▼           │
│  ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐ │
│  │    ARRANGER     │          │ MELODY GENERATOR│          │ BASS GENERATOR  │ │
│  │  (Phase 5.1.A)  │          │   (Phase 19)    │          │   (Phase 19)    │ │
│  │                 │          │                 │          │                 │ │
│  │ Follows chords  │          │ Targets chord   │          │ Root movement   │ │
│  │ Outputs voices  │          │ tones on beats  │          │ Approach notes  │ │
│  └────────┬────────┘          └────────┬────────┘          └────────┬────────┘ │
│           │                            │                            │          │
│           └────────────────────────────┼────────────────────────────┘          │
│                                        │                                        │
│                                        ▼                                        │
│                         ┌─────────────────────────────┐                         │
│                         │   SCALE CONSTRAINT CARD     │                         │
│                         │      (Phase 5.3)            │                         │
│                         │                             │                         │
│                         │  Ensures all notes fit      │                         │
│                         │  current chord/scale        │                         │
│                         └──────────────┬──────────────┘                         │
│                                        │                                        │
│                                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        EDITOR VIEWS (Phases 9-11)                        │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │   │
│  │  │   TRACKER   │    │ PIANO ROLL  │    │  NOTATION   │                   │   │
│  │  │             │    │             │    │             │                   │   │
│  │  │ Shows scale │    │ Highlights  │    │ Shows key   │                   │   │
│  │  │ overlay     │    │ chord tones │    │ signature   │                   │   │
│  │  │             │    │             │    │             │                   │   │
│  │  │ Constrain   │    │ Snap to     │    │ Accidentals │                   │   │
│  │  │ to scale    │    │ scale       │    │ from scale  │                   │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### **26.10 COMPLETE INTEGRATION SUMMARY TABLE**

| System A | System B | Integration Type | Integration Point |
|----------|----------|------------------|-------------------|
| **Sampler** | **Wavetable** | SAME INPUT | Both accept `NoteEvent<P>` |
| **Sampler** | **Sample Editor** | DATA FLOW | Editor outputs to Sampler's bank |
| **Arranger** | **Chord Track** | INPUT | Arranger reads chord events |
| **Arranger** | **Phrase System** | BIDIRECTIONAL | Arranger queries phrases; phrases follow arranger state |
| **Tracker** | **Piano Roll** | SAME SOURCE | Both edit same `EventStream` |
| **Tracker** | **Notation** | SAME SOURCE | Both edit same `EventStream` |
| **Piano Roll** | **Notation** | SAME SOURCE | Both edit same `EventStream` |
| **Generator Cards** | **Editors** | OUTPUT → DISPLAY | Generators output to editor views |
| **Editors** | **Engine** | DISPLAY → PLAY | Editor events flow to engine |
| **Automation** | **Modulation** | STACK | Both modify same parameters |
| **Presets** | **Live Code** | STACK | Both modify same parameters |
| **Session View** | **Arrangement** | SAME CLIPS | Clips exist in both |
| **MIDI Controllers** | **Any Parameter** | MIDI LEARN | Universal mapping system |
| **Chord Track** | **Scale Constraint** | CONTEXT | Chords inform scale |
| **Scale Constraint** | **Generators** | FILTER | Constrains generator output |
| **All Generators** | **All Editors** | TYPE UNIFICATION | All use `Event<P>` |

---

### **26.11 WHY THIS INTEGRATION MATTERS**

**For Users:**
- **No mode switching**: Edit in Tracker, hear via Sampler, see in Notation—same data
- **No format conversion**: Arranger output plays immediately through any instrument
- **No workflow silos**: Session View clips appear in Arrangement View
- **No re-mapping**: MIDI controller controls everything with one learn system

**For Developers:**
- **One type system**: Phase 1's `Event<P>` is the universal format
- **One card interface**: Phase 2's `Card<A,B>` is the universal processor
- **One engine**: Phase 3's scheduler handles all timing
- **One UI framework**: Phase 4's components render all views

**For Extensibility:**
- **New instruments**: Just accept `NoteEvent<P>`, integrate immediately
- **New editors**: Just read/write `EventStream`, sync with all others
- **New generators**: Just output `EventStream`, display everywhere
- **New effects**: Just process audio, slot into any chain

---

> **⚠️ REMEMBER: The phases are not 40 separate features. They are 40 aspects of ONE INTEGRATED SYSTEM. When you implement Phase 19 (Melody Generator), it MUST output to Phase 9 (Tracker), Phase 10 (Piano Roll), and Phase 11 (Notation) via Phase 1's `Event<P>` type, using Phase 2's `Card<A,B>` interface, rendered by Phase 3's engine. THIS IS NON-NEGOTIABLE.**
