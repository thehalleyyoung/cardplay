# ComposerDeck Layout: RapidComposer-Like Cards + Notation + Sessions

This document outlines the steps to create a **RapidComposer-inspired workflow** using CardPlay's card system, with notation instead of piano roll, combined with Ableton-style session/clip organization.

---

## Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECK BAR: [Chord Track] [Phrase Library] [Generators] [FX Chain] [Master]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ARRANGER SECTIONS (Horizontal)                    │   │
│  │  [Intro 4] [Verse A 8] [Chorus 8] [Verse B 8] [Chorus 8] [Outro 4]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CHORD TRACK (RapidComposer-style)                │   │
│  │  | Cm7     | Fm9     | Bb13    | EbΔ7    | AbΔ7    | Dm7b5 G7|      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  SESSION GRID (Ableton-style clips)                  │   │
│  │                                                                       │   │
│  │  Track 1: Lead    [Clip A] [Clip B] [     ] [Clip C] [     ] [     ]│   │
│  │  Track 2: Bass    [Clip A] [Clip B] [Clip B] [Clip C] [Clip C] [   ]│   │
│  │  Track 3: Drums   [Clip A] [Clip A] [Clip A] [Clip B] [Clip B] [Fil]│   │
│  │  Track 4: Pads    [Clip A] [     ] [Clip B] [     ] [Clip C] [     ]│   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              SCORE NOTATION CARD (Bottom Panel - Always Visible)     │   │
│  │  ═══════════════════════════════════════════════════════════════════ │   │
│  │   Cm7                    Fm9                     Bb13                │   │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐    │   │
│  │  │ ♪ ♪ ♫ ♩ ♪ ♫ ♪  │   │ ♩ ♫ ♪ ♪ ♫ ♩ ♫  │   │ ♫ ♪ ♩ ♫ ♪ ♪ ♩  │    │   │
│  │  └─────────────────┘   └─────────────────┘   └─────────────────┘    │   │
│  │                                                                       │   │
│  │  [▶ Selected Clip] [Voice: Lead] [Bars: 1-8] [Zoom: 100%]           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRANSPORT: [◀◀] [▶/❚❚] [●] [⏹]  BPM: 120  TIME: 1:04:23  LOOP: [1-16]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Core Integration (Connect ScoreNotationCard to Existing Systems)

#### Step 1.1: Create ScoreNotation-Session Bridge
**File:** `src/ui/score-notation-session-bridge.ts`

Connect ScoreNotationCard to ClipRegistry so it displays selected clip's contents:

```typescript
// Bridge that connects:
// - ClipRegistry (clip selection, clip data)
// - ScoreNotationCard (notation display)
// - Session View (clip grid selection events)

interface NotationSessionBridge {
  // When user selects a clip in Session View
  onClipSelected(clipId: ClipId): void;
  
  // Sync notation edits back to clip
  onNotationEdited(changes: NotationEdit[]): void;
  
  // Handle multi-clip viewing (show arrangement range)
  setViewRange(startBar: number, endBar: number): void;
}
```

**Tasks:**
1. Subscribe to ClipRegistry selection changes
2. Convert ClipRecord events to ScoreNoteInput format
3. Push updates to ScoreNotationCard.setInputNotes()
4. Handle bidirectional sync (notation edits → clip updates)

---

#### Step 1.2: Wire MIDI Input to ScoreNotationCard
**File:** `src/audio/midi-notation-bridge.ts`

Route live MIDI input to notation display:

```typescript
// Bridge that connects:
// - MIDIInputHandler (incoming notes)
// - ScoreNotationCard (live display)
// - Optional: Recording to current clip

interface MIDINotationBridge {
  // Real-time note display (ghost notes while held)
  onNoteOn(event: NoteEvent): void;
  onNoteOff(event: NoteEvent): void;
  
  // Recording mode
  startRecording(targetClipId: ClipId): void;
  stopRecording(): NotationEdit[];
}
```

**Tasks:**
1. Subscribe to MIDIInputHandler note events
2. Convert NoteEvent to ScoreNoteInput format
3. Display as "preview" notes (different styling)
4. On record: accumulate notes → write to clip on stop

---

#### Step 1.3: Connect Generators to ScoreNotationCard
**File:** `src/cards/generator-notation-bridge.ts`

Show generator output in notation:

```typescript
// Bridge that connects:
// - ArrangerCard output
// - PhraseGeneratorCard output  
// - MelodyCard output
// - ScoreNotationCard display

interface GeneratorNotationBridge {
  // Register a generator card for notation display
  connectGenerator(cardId: CardId, streamId: EventStreamId): void;
  
  // Show generated output (with distinct styling)
  displayGeneratedOutput(events: NoteEvent[]): void;
  
  // "Freeze" generated content to editable notation
  freezeToClip(clipId: ClipId): ClipRecord;
}
```

**Tasks:**
1. Subscribe to generator card output changes
2. Convert to ScoreNoteInput with `source: 'generated'` flag
3. Display with different opacity/color
4. Implement freeze action (copies to ClipRegistry as editable)

---

### Phase 2: ComposerDeck Layout Panel

#### Step 2.1: Create ComposerDeckLayout Component
**File:** `src/ui/composer-deck-layout.ts`

The main layout container that orchestrates all panels:

```typescript
interface ComposerDeckLayout {
  // Panel visibility
  showArrangerSections: boolean;
  showChordTrack: boolean;
  showSessionGrid: boolean;
  showNotation: boolean;
  
  // Panel heights (resizable)
  arrangerHeight: number;
  chordTrackHeight: number;
  sessionGridHeight: number;
  notationHeight: number;
  
  // Sync state
  currentBar: number;
  viewStartBar: number;
  viewEndBar: number;
  selectedClipId: ClipId | null;
  selectedTrackId: TrackId | null;
}
```

**Tasks:**
1. Create resizable split panel layout
2. Implement horizontal scroll sync across all panels
3. Handle clip selection → notation update flow
4. Implement track selection → filter notation by track

---

#### Step 2.2: Create Chord Track Panel
**File:** `src/ui/chord-track-panel.ts`

RapidComposer-style chord progression display:

```typescript
interface ChordTrackPanel {
  // Chord display
  chords: ChordSymbol[];
  
  // Editing
  insertChord(position: Tick, chord: ChordSymbol): void;
  deleteChord(position: Tick): void;
  moveChord(from: Tick, to: Tick): void;
  
  // Analysis
  suggestNextChord(): ChordSymbol[];
  analyzeProgression(): HarmonyAnalysis;
}
```

**Tasks:**
1. Display chord symbols aligned with bars
2. Click-to-edit chord entry
3. Drag to reposition/resize chord duration
4. Connect to ScoreNotationCard chord input

---

#### Step 2.3: Create Arranger Sections Bar
**File:** `src/ui/arranger-sections-bar.ts`

Visual section markers (Intro, Verse, Chorus, etc.):

```typescript
interface ArrangerSectionsBar {
  sections: ArrangerSection[];
  
  // Display
  getSectionAt(bar: number): ArrangerSection | null;
  getSectionColor(type: SectionType): string;
  
  // Editing  
  addSection(start: number, length: number, type: SectionType): void;
  resizeSection(sectionId: string, newLength: number): void;
  moveSection(sectionId: string, newStart: number): void;
}
```

**Tasks:**
1. Display colored section blocks
2. Drag edges to resize
3. Connect to ScoreNotationCard section input
4. Auto-generate section suggestions from chord analysis

---

#### Step 2.4: Integrate Session Grid (Already Exists)
**File:** `src/ui/session-view.ts` (MODIFY)

Add hooks for ComposerDeck integration:

```typescript
// Add to existing SessionView:
interface SessionViewComposerHooks {
  // Notify ComposerDeck of selection changes
  onClipSelectionChange: (clipId: ClipId | null) => void;
  
  // Notify of playback position for notation sync
  onPlaybackPositionChange: (bar: number) => void;
  
  // Handle notation-initiated clip edits
  applyNotationEdit(clipId: ClipId, edit: NotationEdit): void;
}
```

**Tasks:**
1. Add selection change callbacks
2. Implement scroll sync with notation panel
3. Add visual indicator for which clip is shown in notation

---

### Phase 3: Advanced RapidComposer Features

#### Step 3.1: Phrase Library Panel (Card-Based)
**File:** `src/ui/phrase-library-panel.ts`

Library of reusable musical phrases as cards:

```typescript
interface PhraseLibraryPanel {
  // Browse phrases
  phrases: PhraseCard[];
  categories: string[];
  
  // Drag & drop
  onPhraseDragStart(phraseId: string): void;
  onPhraseDrop(targetClipId: ClipId, position: Tick): void;
  
  // Phrase variations
  generateVariation(phraseId: string, style: VariationStyle): PhraseCard;
  
  // Save current notation as phrase
  saveAsPhrase(name: string, category: string): PhraseCard;
}
```

**Tasks:**
1. Create phrase card grid view
2. Implement drag-to-session-grid
3. Auto-adapt phrases to current chord/scale
4. Preview phrases in notation before dropping

---

#### Step 3.2: Smart Phrase Adaptation
**File:** `src/cards/phrase-adapter.ts`

Automatically adapt phrases to chord context:

```typescript
interface PhraseAdapter {
  // Adapt phrase to chord
  adaptToChord(
    phrase: NoteEvent[],
    sourceChord: ChordSymbol,
    targetChord: ChordSymbol,
    mode: AdaptationMode
  ): NoteEvent[];
  
  // Modes
  type AdaptationMode = 
    | 'transpose'      // Simple transposition
    | 'chord-tone'     // Map to nearest chord tone
    | 'scale-degree'   // Preserve scale degrees
    | 'voice-leading'  // Smooth voice leading
    | 'rhythm-only';   // Keep rhythm, regenerate pitches
}
```

**Tasks:**
1. Implement chord-aware transposition
2. Implement scale-degree preservation
3. Show adaptation preview in notation
4. Allow manual adjustment after auto-adapt

---

#### Step 3.3: Generator Cards in Deck Bar
**File:** `src/ui/composer-deck-bar.ts`

Quick access to phrase generators:

```typescript
interface ComposerDeckBar {
  // Active cards
  chordTrackCard: ChordTrackCard;
  phraseGeneratorCard: PhraseGeneratorCard;
  melodyGeneratorCard: MelodyCard;
  basslineCard: BasslineCard;
  drumPatternCard: DrumMachineCard;
  
  // Generate → Notation flow
  generateAndShow(cardId: CardId): void;
  
  // Accept generated content
  acceptToClip(clipId: ClipId): void;
}
```

**Tasks:**
1. Create compact card strip UI
2. One-click generate → show in notation
3. Accept/reject/regenerate workflow
4. Remember generator settings per section type

---

### Phase 4: Playback & Recording Integration

#### Step 4.1: Notation-Aware Transport
**File:** `src/audio/notation-transport-bridge.ts`

Sync playback position with notation display:

```typescript
interface NotationTransportBridge {
  // Playback position indicator in notation
  currentTick: Tick;
  isPlaying: boolean;
  
  // Click-to-seek from notation
  seekToPosition(tick: Tick): void;
  
  // Loop selection from notation
  setLoopFromSelection(startTick: Tick, endTick: Tick): void;
}
```

**Tasks:**
1. Draw playhead in notation
2. Click notation to seek
3. Selection-based loop points
4. Follow mode (auto-scroll during playback)

---

#### Step 4.2: Step Recording Mode
**File:** `src/audio/step-recording.ts`

Record notes step-by-step (like RapidComposer):

```typescript
interface StepRecorder {
  // State
  isActive: boolean;
  currentStep: Tick;
  stepSize: Duration; // 1/4, 1/8, 1/16, etc.
  
  // Recording
  recordNote(note: number, velocity: number): void;
  advanceStep(): void;
  backStep(): void;
  
  // Finish
  commitRecording(): NoteEvent[];
}
```

**Tasks:**
1. Show step cursor in notation
2. MIDI note → add at current step
3. Arrow keys to navigate steps
4. Space bar to advance without note (rest)

---

### Phase 5: Polish & Workflow Optimization

#### Step 5.1: Keyboard Shortcuts
```typescript
const COMPOSER_DECK_SHORTCUTS = {
  // Navigation
  'ArrowLeft': 'previousBar',
  'ArrowRight': 'nextBar',
  'Home': 'goToStart',
  'End': 'goToEnd',
  
  // Selection
  'Tab': 'nextClip',
  'Shift+Tab': 'previousClip',
  
  // Editing
  'Enter': 'editSelectedClip',
  'Delete': 'deleteSelectedNotes',
  'Ctrl+D': 'duplicateClip',
  
  // Generators
  'G': 'generatePhrase',
  'Ctrl+G': 'regenerateWithVariation',
  'Ctrl+Enter': 'acceptGenerated',
  'Escape': 'cancelGenerated',
  
  // Recording
  'R': 'toggleRecording',
  'Ctrl+R': 'toggleStepRecording',
};
```

---

#### Step 5.2: Visual Feedback System

```typescript
interface ComposerVisualFeedback {
  // Clip states
  clipPlaying: 'glow-green';
  clipQueued: 'glow-yellow';
  clipRecording: 'glow-red';
  clipEditing: 'border-blue';
  
  // Notation states
  noteSelected: 'fill-blue';
  noteGenerated: 'fill-purple-50%';
  notePreview: 'fill-gray-30%';
  notePlaying: 'fill-green';
  
  // Chord states
  chordCurrent: 'highlight-yellow';
  chordSuggested: 'border-dashed';
}
```

---

## File Summary

### New Files to Create:
```
src/ui/
  ├── composer-deck-layout.ts      # Main layout orchestrator
  ├── composer-deck-bar.ts         # Top card strip
  ├── chord-track-panel.ts         # Chord progression display
  ├── arranger-sections-bar.ts     # Section markers
  ├── phrase-library-panel.ts      # Phrase browser
  ├── score-notation-session-bridge.ts  # Clip ↔ Notation sync

src/audio/
  ├── midi-notation-bridge.ts      # MIDI → Notation
  ├── notation-transport-bridge.ts # Playback sync
  ├── step-recording.ts            # Step record mode

src/cards/
  ├── generator-notation-bridge.ts # Generator → Notation
  ├── phrase-adapter.ts            # Chord-aware adaptation
```

### Files to Modify:
```
src/ui/session-view.ts             # Add ComposerDeck hooks
src/cards/score-notation.ts        # Add bridge connection points
src/audio/midi-input-handler.ts    # Add notation routing
```

---

## Estimated Timeline

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Core Integration | 5-7 days | ScoreNotationCard, ClipRegistry |
| Phase 2: Layout Panel | 4-5 days | Phase 1 |
| Phase 3: RapidComposer Features | 6-8 days | Phase 2 |
| Phase 4: Playback Integration | 3-4 days | Phase 1 |
| Phase 5: Polish | 2-3 days | All phases |

**Total: ~20-27 days**

---

## Success Criteria

1. ✅ Select clip in Session Grid → Notation shows clip contents
2. ✅ Edit in Notation → Clip updated in Session Grid
3. ✅ MIDI keyboard input → Notes appear in Notation (live)
4. ✅ Generate phrase → Preview in Notation → Accept to Clip
5. ✅ Chord track changes → Phrases auto-adapt
6. ✅ All panels scroll in sync
7. ✅ Playhead visible across all panels during playback
