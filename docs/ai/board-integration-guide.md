# Board-AI Integration Guide
**How to Power Board Workflows with Prolog AI**

This guide shows how to integrate CardPlay's Prolog-based AI system into board workflows.

---

## Quick Reference

**AI Capabilities:**
- 🎵 Music Theory (scales, chords, voice leading)
- 🎹 Pattern Generation (bass, drums, melody, chords, arpeggios)  
- 🎨 Phrase Adaptation (transpose, chord-tone, scale-degree, voice-leading)
- 🎼 Harmony Analysis (suggestions, reharmonization, modulation)
- 🗺️ Board Recommendations (workflow → board mapping)
- 💬 Natural Language Q&A (AI Advisor)

**Import Paths:**
```typescript
// Generators
import { ArpeggioGenerator, BassGenerator, ChordGenerator,
         DrumGenerator, MelodyGenerator } from '@/ai/generators';

// Queries
import { getScaleNotes, suggestNextChord } from '@/ai/queries/theory-queries';
import { recommendBoardForWorkflow } from '@/ai/queries/board-queries';

// Adaptation & Analysis
import { PrologPhraseAdapter } from '@/ai/adaptation';
import { HarmonyExplorer } from '@/ai/harmony';
import { AIAdvisor } from '@/ai/advisor';
```

---

## Board Workflow Examples

### 1. Notation Board + Harmony Hints

```typescript
import { HarmonyExplorer, createHarmonyExplorer } from '@/ai/harmony';

class NotationHarmonyBoard {
  private harmony = createHarmonyExplorer();

  async onChordSelected(chord: { root: string, quality: string }) {
    // Get next chord suggestions from Prolog KB
    const suggestions = await this.harmony.suggestNextChords({
      root: chord.root,
      quality: chord.quality,
      key: this.currentKey
    });

    // Display in harmony deck
    this.harmonyDeck.showSuggestions(suggestions);
  }

  async onMelodyWritten(notes: Note[]) {
    // Analyze chord fit
    const analysis = await this.harmony.analyzeChordFit(notes, this.currentKey);
    this.harmonyDeck.showChordOptions(analysis.chords);
  }
}
```

### 2. Tracker Board + Phrase Library

```typescript
import { PrologPhraseAdapter } from '@/ai/adaptation';

class TrackerPhrasesBoard {
  private adapter = new PrologPhraseAdapter();

  async onPhraseDragged(phrase: PhraseNote[], targetChord: Chord) {
    // Adapt phrase using voice-leading mode
    const adapted = await this.adapter.adaptPhrase(phrase, {
      target: { type: 'chord', ...targetChord },
      mode: 'voice-leading',
      preserveRhythm: true,
      preserveContour: true
    });

    // Insert adapted notes
    const events = this.convertToEvents(adapted.notes);
    this.eventStore.addEvents(this.activeStreamId, events);
  }
}
```

### 3. Session Board + Generators

```typescript
import { BassGenerator, DrumGenerator } from '@/ai/generators';

class SessionGeneratorsBoard {
  private bassGen = new BassGenerator();
  private drumGen = new DrumGenerator();

  async onGenerateBass(chords: Chord[], genre: string) {
    const bass = await this.bassGen.generate({
      chords,
      genre,
      pattern: 'walking',
      seed: this.settings.seed
    });

    // Insert into bass track
    this.eventStore.addEvents(this.bassTrackStream, bass.events);
  }

  async onGenerateDrums(genre: string, energy: number) {
    const drums = await this.drumGen.generate({
      genre,
      energy,
      length: 16
    });

    // Insert drum tracks
    for (const [instrument, events] of Object.entries(drums.tracks)) {
      const streamId = this.getStreamForInstrument(instrument);
      this.eventStore.addEvents(streamId, events);
    }
  }
}
```

### 4. Arranger Board (AI-Driven)

```typescript
import { suggestArrangement } from '@/ai/queries/composition-queries';
import { ChordGenerator, BassGenerator } from '@/ai/generators';

class ArrangerBoard {
  async onCreateArrangement(genre: string, length: number, key: string) {
    // 1. Get structure from Prolog KB
    const structure = await suggestArrangement(genre, length);
    // Returns: [
    //   { section: 'intro', bars: 8, energy: 0.3 },
    //   { section: 'verse', bars: 16, energy: 0.5 },
    //   { section: 'chorus', bars: 8, energy: 0.8 }
    // ]

    // 2. Generate content for each section
    for (const section of structure.sections) {
      const chords = await this.chordGen.generate({
        key,
        length: section.bars,
        style: this.getSectionStyle(section.section)
      });

      const bass = await this.bassGen.generate({
        chords: chords.chords,
        genre,
        energy: section.energy
      });

      // Store section data
      section.chords = chords.chords;
      section.bass = bass.events;
    }

    // 3. Create clips
    this.createClipsFromSections(structure.sections);
  }
}
```

### 5. AI Advisor Integration

```typescript
import { AIAdvisor, ConversationManager } from '@/ai/advisor';

class AnyBoard {
  private advisor = createAIAdvisor();
  private conversation = createConversationManager();

  async onUserAsksQuestion(question: string) {
    const context = {
      boardId: this.boardId,
      key: this.currentKey,
      genre: this.currentGenre,
      currentChords: this.getCurrentChords()
    };

    const turn = await this.conversation.ask(question, context);
    
    // Display answer
    this.advisorDeck.showAnswer(turn);

    // Execute suggested actions if user accepts
    if (turn.answer.actions?.length > 0) {
      this.advisorDeck.showActionButtons(turn.answer.actions);
    }
  }
}
```

---

## Integration Patterns

### Pattern 1: Hints/Suggestions (Assisted)
Show suggestions but user decides:
```typescript
const suggestions = await this.harmony.suggestNextChords(currentChord);
this.harmonyDeck.showHints(suggestions, { dismissible: true });
```

### Pattern 2: On-Demand (Manual + Tools)
Generate when button clicked:
```typescript
this.generatorDeck.on('generate', async (params) => {
  const result = await this.generator.generate(params);
  this.showPreview(result); // User accepts/rejects
});
```

### Pattern 3: Continuous (Generative)
AI generates continuously, user curates:
```typescript
setInterval(async () => {
  const candidate = await this.melodyGen.generate(params);
  this.candidateDeck.showCandidate(candidate); // User accepts/rejects
}, this.generationInterval);
```

---

## Performance Tips

### Preload Knowledge Bases
```typescript
import { loadMusicTheoryKB, loadCompositionPatternsKB } from '@/ai/knowledge';

async function initAI() {
  await Promise.all([
    loadMusicTheoryKB(),
    loadCompositionPatternsKB()
  ]);
}
```

### Cache Results
```typescript
const cache = new Map<string, GeneratedPhrase>();
const key = `${JSON.stringify(params)}-${seed}`;
if (!cache.has(key)) {
  cache.set(key, await generator.generate(params));
}
```

### Debounce Queries
```typescript
const debouncedUpdate = debounce(async (chord) => {
  const suggestions = await harmony.suggestNextChords(chord);
  this.updateUI(suggestions);
}, 300);
```

---

## Summary

✅ **Assisted Boards:** Suggestions without forcing
✅ **Generative Boards:** Continuous AI + user curation  
✅ **Hybrid Boards:** Mix manual + AI per track
✅ **Any Board:** Add AI Advisor for Q&A

**All systems tested and production-ready (326 tests passing)!**

---

*Related: [generators-reference.md](./generators-reference.md), [harmony-explorer.md](./harmony-explorer.md), [ai-advisor.md](./ai-advisor.md)*
