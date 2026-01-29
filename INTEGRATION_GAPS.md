# Integration Gaps: Current Implementation vs. Vision

This document lists the changes needed to bring the current implementation closer to the fully integrated vision documented in cardplay2.md Part XXVI and cardplayui.md Appendix D.

---

## 🔴 CRITICAL GAPS (Architecture Breaking)

### 1. **No Unified EventStream State Store**

**Current State:**
- Each editor/view has its own event storage mechanism
- `TrackerPanel` has local events state
- `SessionView` stores clips independently
- `NotationPanel` converts events but doesn't share state
- No single source of truth for event data

**Required Change:**
- Create `SharedEventStore` singleton (zustand/immer)
- All editors read from AND write to this store
- Implement subscription system for real-time sync
- Add `EventStreamId` type for referencing shared streams

**Files to modify/create:**
```
src/state/
  ├── event-store.ts        # NEW: SharedEventStore singleton
  ├── event-subscriptions.ts # NEW: Pub/sub for event changes
  └── index.ts              # NEW: State barrel export
```

**Estimated effort:** 2-3 days

---

### 2. **Tracker, Piano Roll, Notation NOT Sharing Data**

**Current State:**
- `src/ui/components/tracker-panel.ts` exists (4585 lines) but is isolated
- No `PianoRollPanel` in `src/ui/components/`
- `src/notation/` exists but uses separate `NotationEvent` type
- `event-bridge.ts` converts events but one-way only

**Required Change:**
- Connect TrackerPanel to SharedEventStore
- Create PianoRollPanel reading from SAME store
- Modify NotationPanel to read/write SAME store
- All three views must:
  - Display same `EventStream`
  - Edit same `EventStream`  
  - React to changes from other views in real-time

**Files to modify/create:**
```
src/ui/components/
  ├── tracker-panel.ts       # MODIFY: Connect to SharedEventStore
  ├── piano-roll-panel.ts    # NEW: Full piano roll implementation
  └── notation-panel.ts      # NEW: Wrapper connecting notation to store

src/notation/
  └── event-bridge.ts        # MODIFY: Bidirectional sync
```

**Estimated effort:** 5-7 days

---

### 3. **Generator Cards Don't Output to Shared Stream**

**Current State:**
- `ArrangerCard` outputs `MultiVoiceOutput` but doesn't write to shared store
- `DrumMachineCard`, `SequencerCard` etc. have local state
- Generated events don't appear in editors

**Required Change:**
- Add `outputStreamId: EventStreamId` parameter to all generator cards
- Generator output writes to SharedEventStore
- Editors automatically display generated events
- Add "freeze" action to convert generated events to static events

**Files to modify:**
```
src/cards/arranger.ts        # MODIFY: Output to SharedEventStore
src/cards/drum-machine.ts    # MODIFY: Output to SharedEventStore
src/cards/sequencer.ts       # MODIFY: Output to SharedEventStore
src/cards/melody.ts          # MODIFY: Output to SharedEventStore
src/cards/arpeggiator.ts     # MODIFY: Output to SharedEventStore
src/cards/bassline.ts        # MODIFY: Output to SharedEventStore
```

**Estimated effort:** 3-4 days

---

### 4. **Session View and Arrangement View Not Sharing Clips**

**Current State:**
- `src/ui/session-view.ts` (4193 lines) has clip storage
- No `arrangement-view.ts` panel implementation
- `src/ui/arrangement-operations.ts` has operations but no view
- Clips are not in shared store

**Required Change:**
- Create `ClipRegistry` in SharedEventStore
- Session View references clips by ID, not copies
- Create Arrangement View reading same ClipRegistry
- Edits in either view update the registry
- Both views react to changes

**Files to modify/create:**
```
src/state/
  └── clip-registry.ts       # NEW: Shared clip storage

src/ui/
  ├── session-view.ts        # MODIFY: Use ClipRegistry
  └── arrangement-view.ts    # NEW: Full arrangement panel
```

**Estimated effort:** 4-5 days

---

## 🟠 HIGH PRIORITY GAPS (Feature Breaking)

### 5. **Sampler/Wavetable Don't Share Input Interface**

**Current State:**
- `src/audio/sampler-core.ts` has sampler implementation
- `src/audio/wavetable-synth.ts` has wavetable implementation  
- Different input handling, not interchangeable

**Required Change:**
- Create `InstrumentCard<P>` interface both implement
- Standardize `NoteEvent<P>` input handling
- Make instruments hot-swappable in signal chain
- Unified voice allocation system

**Files to modify:**
```
src/audio/
  ├── instrument-interface.ts  # NEW: Shared InstrumentCard<P> interface
  ├── sampler-core.ts          # MODIFY: Implement interface
  └── wavetable-synth.ts       # MODIFY: Implement interface
```

**Estimated effort:** 2-3 days

---

### 6. **Reveal Panels Not Connected to Audio Engine Sync**

**Current State:**
- `src/ui/deck-reveal.ts` has `DeckRevealController`
- `SyncVisualization` type defined but not populated
- No real-time data flow from audio engine

**Required Change:**
- Connect `AudioEngine` output to `SyncVisualization`
- Wire waveform, levels, MIDI activity to reveal panels
- Implement 60fps update loop for visualizations
- Add audio worklet → main thread sync channel

**Files to modify:**
```
src/audio/
  └── audio-engine.ts          # MODIFY: Export sync data

src/ui/
  └── deck-reveal.ts           # MODIFY: Consume sync data
```

**Estimated effort:** 2-3 days

---

### 7. **Automation/Modulation/Preset/Live Code Not Unified**

**Current State:**
- `src/cards/presets.ts` has preset system (1270 lines)
- `src/cards/modulation.ts` has modulation
- `src/user-cards/cardscript/` has live coding
- No unified parameter resolution

**Required Change:**
- Create `ParameterResolver` that stacks:
  - Base value from preset
  - Automation from lanes
  - Modulation from LFOs/envelopes
  - Live code overrides
- All four affect SAME parameters

**Files to create:**
```
src/state/
  └── parameter-resolver.ts    # NEW: Unified parameter resolution
```

**Estimated effort:** 2-3 days

---

### 8. **MIDI Learn Not Connected to All Parameters**

**Current State:**
- `src/audio/midi-mapping.ts` has basic MIDI mapping
- `src/audio/web-midi.ts` has Web MIDI input
- Not connected to card parameter system

**Required Change:**
- Create universal MIDI learn that works on ANY card parameter
- Add `CardParam.midiLearn()` method
- Wire to SharedEventStore for persistence
- Add bidirectional feedback (hardware ← → UI)

**Files to modify:**
```
src/audio/
  └── midi-mapping.ts          # MODIFY: Connect to all card params

src/cards/
  └── parameters.ts            # MODIFY: Add midiLearn capability
```

**Estimated effort:** 2-3 days

---

## 🟡 MEDIUM PRIORITY GAPS (Experience Breaking)

### 9. **No Sample Browser → Editor → Sampler Pipeline**

**Current State:**
- `src/audio/sample-pack-manager.ts` exists
- `src/audio/sample-editor.ts` exists
- Not connected as continuous workflow

**Required Change:**
- Sample Browser drag outputs to Sample Editor
- Sample Editor save outputs to Sampler zones
- Create unified SampleFlow component

**Files to create/modify:**
```
src/ui/components/
  └── sample-flow.ts           # NEW: Integrated sample workflow
```

**Estimated effort:** 2-3 days

---

### 10. **Arranger Not Querying Phrase Database**

**Current State:**
- `src/cards/arranger.ts` has full arranger (6000+ lines)
- `src/cards/phrase-system.ts` has phrase database
- Not connected - arranger doesn't use phrases

**Required Change:**
- Add `queryPhrases()` to ArrangerCard
- Wire arranger fills to phrase database
- Allow phrase triggering from arranger sections

**Files to modify:**
```
src/cards/
  └── arranger.ts              # MODIFY: Add phrase querying
```

**Estimated effort:** 1-2 days

---

### 11. **Chord Track Not Driving Generators**

**Current State:**
- No `ChordTrack` container type
- Arranger accepts chord events but no chord track UI
- Generators don't follow chord changes

**Required Change:**
- Create `ChordTrack` as `Container<"chords">`
- Add ChordTrack lane in arrangement view
- Wire to Arranger, MelodyGenerator, BassGenerator
- Add chord-following mode to phrase system

**Files to create:**
```
src/containers/
  └── chord-track.ts           # NEW: ChordTrack container

src/ui/
  └── chord-track-lane.ts      # NEW: Chord editing UI
```

**Estimated effort:** 3-4 days

---

### 12. **Connection Visualization Not Matching Audio Graph**

**Current State:**
- `src/ui/deck-layouts.ts` has connection types
- `src/audio/deck-audio-bridge.ts` has audio graph
- Visual connections and audio routing are separate

**Required Change:**
- Single `RoutingGraph` shared by visual and audio
- Visual cable changes → audio routing changes
- Audio routing changes → visual cable updates
- Mixer levels reflected in connection thickness

**Files to modify:**
```
src/audio/
  └── deck-audio-bridge.ts     # MODIFY: Share routing graph

src/ui/
  └── deck-layouts.ts          # MODIFY: Read from shared graph
```

**Estimated effort:** 2-3 days

---

## 🟢 LOW PRIORITY GAPS (Polish)

### 13. **Scale Constraint Not Applied to All Editors**

**Current State:**
- `src/cards/transforms.ts` has scale constrain transform
- Not applied in editor views

**Required Change:**
- Add scale overlay to Piano Roll
- Add scale highlight to Tracker
- Add key signature to Notation
- All from same ScaleContext

**Estimated effort:** 1-2 days

---

### 14. **No Unified Undo/Redo Across Views**

**Current State:**
- Individual components may have local undo
- No system-wide undo stack

**Required Change:**
- Create `UndoStack` in state store
- All event edits go through undo system
- Undo works regardless of which view made change

**Estimated effort:** 2-3 days

---

### 15. **Selection Not Shared Across Views**

**Current State:**
- Each view has own selection state
- Select in Tracker doesn't select in Piano Roll

**Required Change:**
- Create `SelectionState` in shared store
- Selection by EventId, not by view-specific index
- All views show same selection

**Estimated effort:** 1-2 days

---

### 16. **Ghost Notes Not Shown in Piano Roll**

**Current State:**
- No ghost note display implementation

**Required Change:**
- Show events from other tracks as ghost notes
- Configurable opacity/color
- Click ghost to select original

**Estimated effort:** 1 day

---

## Summary: Implementation Priority Order

| Priority | Gap # | Description | Effort |
|----------|-------|-------------|--------|
| 1 | **1** | SharedEventStore | 2-3 days |
| 2 | **2** | Editor data sharing | 5-7 days |
| 3 | **3** | Generator → store output | 3-4 days |
| 4 | **4** | Session/Arrange clip sharing | 4-5 days |
| 5 | **5** | Sampler/Wavetable interface | 2-3 days |
| 6 | **6** | Reveal panel sync | 2-3 days |
| 7 | **7** | Parameter resolution | 2-3 days |
| 8 | **11** | Chord track | 3-4 days |
| 9 | **8** | MIDI learn | 2-3 days |
| 10 | **12** | Connection/routing sync | 2-3 days |
| 11 | **9** | Sample pipeline | 2-3 days |
| 12 | **10** | Arranger + phrases | 1-2 days |
| 13 | **14** | Unified undo | 2-3 days |
| 14 | **13** | Scale overlay | 1-2 days |
| 15 | **15** | Shared selection | 1-2 days |
| 16 | **16** | Ghost notes | 1 day |

**Total estimated effort: 40-55 days**

---

## Recommended Implementation Phases

### Phase A: Foundation (Gaps 1, 2 partial) — 1 week
Create SharedEventStore, connect TrackerPanel to it, prove the concept works.

### Phase B: Editor Sync (Gaps 2 complete, 15) — 1.5 weeks  
Add PianoRollPanel and NotationPanel reading from shared store, add shared selection.

### Phase C: Generator Integration (Gaps 3, 10, 11) — 1.5 weeks
Wire generator cards to SharedEventStore, add ChordTrack, connect phrase system.

### Phase D: View Unification (Gaps 4, 12) — 1 week
Session/Arrangement clip sharing, routing graph unification.

### Phase E: Audio Integration (Gaps 5, 6, 8) — 1 week
Instrument interface, reveal panel sync, MIDI learn.

### Phase F: Control Unification (Gaps 7, 14) — 1 week
Parameter resolver, unified undo.

### Phase G: Polish (Gaps 9, 13, 16) — 0.5 weeks
Sample pipeline, scale overlay, ghost notes.

---

## Files to Create (Summary)

```
src/state/
  ├── index.ts
  ├── event-store.ts
  ├── event-subscriptions.ts
  ├── clip-registry.ts
  └── parameter-resolver.ts

src/ui/components/
  ├── piano-roll-panel.ts
  ├── notation-panel.ts
  └── sample-flow.ts

src/ui/
  ├── arrangement-view.ts
  └── chord-track-lane.ts

src/containers/
  └── chord-track.ts

src/audio/
  └── instrument-interface.ts
```

## Files to Modify (Summary)

```
src/ui/components/tracker-panel.ts
src/ui/session-view.ts
src/ui/deck-reveal.ts
src/ui/deck-layouts.ts

src/notation/event-bridge.ts

src/cards/arranger.ts
src/cards/drum-machine.ts
src/cards/sequencer.ts
src/cards/melody.ts
src/cards/arpeggiator.ts
src/cards/bassline.ts
src/cards/parameters.ts
src/cards/presets.ts

src/audio/sampler-core.ts
src/audio/wavetable-synth.ts
src/audio/audio-engine.ts
src/audio/deck-audio-bridge.ts
src/audio/midi-mapping.ts
```
