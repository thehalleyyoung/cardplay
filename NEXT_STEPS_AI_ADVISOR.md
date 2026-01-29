# AI Advisor UI Integration - Next Steps

**Status:** Ready to implement remaining integration tasks
**Est. Time:** 1-2 days (10-13 hours)

## ✅ WHAT'S COMPLETE

### Core Implementation (100%)
- ✅ AI Advisor Panel component (618 lines Lit component)
- ✅ Reveal Panel integration (119 lines)
- ✅ All AI logic and Prolog KB (Phase L complete)
- ✅ Tests passing (325 tests, all green)
- ✅ Chat UI with history, bookmarks, confidence, actions
- ✅ Context gathering and answer formatting

### Current Functionality
Users can currently:
- Open advisor via Reveal Panel 🤖 tab
- Ask questions and get AI answers
- View conversation history
- Bookmark useful answers
- See confidence scores and explanations
- Click action buttons

## 🚀 IMPLEMENTATION PLAN

### Step 1: Add `ai-advisor` to DeckType (L299)
**Priority:** HIGH | **Time:** 1-2 hours

#### Files to Modify:
1. `src/boards/types.ts`
   - Add `'ai-advisor'` to DeckType union

2. `src/boards/validate.ts`
   - Add `'ai-advisor'` to KNOWN_DECK_TYPES set

#### Implementation:
```typescript
// In src/boards/types.ts
export type DeckType =
  | 'pattern-editor'
  | 'notation-editor'
  | 'mixer'
  | 'sampler'
  // ... other types ...
  | 'ai-advisor';  // <-- ADD THIS

// In src/boards/validate.ts
const KNOWN_DECK_TYPES: ReadonlySet<DeckType> = new Set([
  'pattern-editor',
  'notation-editor',
  // ... other types ...
  'ai-advisor',  // <-- ADD THIS
]);
```

#### Testing:
- Verify deck type is recognized
- Check no validation errors
- Ensure it appears in deck lists

---

### Step 2: Create AI Advisor Deck Factory (L299 continued)
**Priority:** HIGH | **Time:** 1-2 hours

#### File to Create:
`src/decks/ai-advisor-deck.ts`

#### Implementation:
```typescript
import { Deck, DeckInstance } from '../boards/types';
import { createAIAdvisorRevealTab } from '../ui/reveal-panel-ai-advisor';

export interface AIAdvisorDeckConfig {
  placeholder?: string;
  showConfidence?: boolean;
}

export function createAIAdvisorDeck(
  config: AIAdvisorDeckConfig = {}
): Deck {
  return {
    type: 'ai-advisor',
    title: 'AI Advisor',
    icon: '🤖',
    description: 'Ask questions about music theory, composition, and workflow',
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 300, height: 400 },

    create: (instanceConfig) => {
      const element = document.createElement('ai-advisor-panel');
      element.placeholder = config.placeholder || 'Ask about chords, scales, workflow...';
      element.showConfidence = config.showConfidence ?? true;

      return {
        element,
        dispose: () => {
          element.remove();
        }
      };
    }
  };
}
```

#### Register in Deck Registry:
```typescript
// In src/decks/index.ts or registry file
import { createAIAdvisorDeck } from './ai-advisor-deck';

export const DECK_REGISTRY = {
  // ... other decks ...
  'ai-advisor': createAIAdvisorDeck,
};
```

---

### Step 3: Register Keyboard Shortcut (L308)
**Priority:** MEDIUM | **Time:** 30 minutes

#### File to Modify:
`src/ui/keyboard-shortcuts.ts`

#### Implementation:
```typescript
// In registerBuiltinShortcuts()
this.register({
  id: 'open-ai-advisor',
  key: '/',
  modifiers: {
    meta: true,  // Cmd on Mac
    ctrl: false,
  },
  description: 'Open AI Advisor',
  category: 'view',
  action: () => {
    // Dispatch event to open advisor
    document.dispatchEvent(new CustomEvent('cardplay:open-advisor'));
  },
});
```

#### Handle Event:
```typescript
// In main app or board manager
document.addEventListener('cardplay:open-advisor', () => {
  // Open reveal panel to AI Advisor tab
  // OR focus existing AI Advisor deck
  // OR create new AI Advisor deck if none exists
});
```

---

### Step 4: Command Palette Integration (L300)
**Priority:** HIGH | **Time:** 2-3 hours

#### Find Command Palette System:
1. Search for command palette implementation
2. Understand command registration API

#### Implementation (assuming palette exists):
```typescript
// Register "Ask AI..." command
commandPalette.register({
  id: 'ask-ai',
  label: 'Ask AI...',
  icon: '🤖',
  category: 'ai',
  keywords: ['ai', 'advisor', 'help', 'assistant'],
  action: (context) => {
    // Open advisor panel/deck
    // Pass current board/deck context
    openAIAdvisor({
      context: {
        boardType: context.activeBoard?.type,
        deckTypes: context.activeDecks?.map(d => d.type),
        key: context.currentKey,
        chords: context.currentChords,
      }
    });
  }
});
```

#### If No Command Palette Exists:
Create basic Cmd+K palette:
- Modal dialog with search input
- List of commands
- Filter by search text
- Execute on select

---

### Step 5: Context Menu Integration (L309-L310)
**Priority:** HIGH | **Time:** 3-4 hours

#### Find Context Menu System:
1. Search for existing context menu implementation
2. Understand how right-click is handled

#### Implementation:
```typescript
// Add context menu items for various elements

// 1. On chord/note events
contextMenu.register({
  selector: '.chord-event, .note-event',
  items: [
    {
      label: 'Ask AI about this chord',
      icon: '🤖',
      action: (element) => {
        const chord = extractChordFromElement(element);
        openAIAdvisor({
          question: `What's special about ${chord}?`,
          context: { chords: [chord] }
        });
      }
    },
    {
      label: 'Suggest next chord',
      icon: '🎵',
      action: (element) => {
        const chord = extractChordFromElement(element);
        openAIAdvisor({
          question: `What chord should come after ${chord}?`,
          context: { chords: [chord] }
        });
      }
    },
  ]
});

// 2. On patterns/phrases
contextMenu.register({
  selector: '.pattern, .phrase',
  items: [
    {
      label: 'Explain this pattern',
      icon: '🤖',
      action: (element) => {
        const pattern = extractPatternFromElement(element);
        openAIAdvisor({
          question: 'Explain this pattern',
          context: { pattern }
        });
      }
    },
    {
      label: 'Suggest variations',
      icon: '🎲',
      action: (element) => {
        const pattern = extractPatternFromElement(element);
        openAIAdvisor({
          question: 'Suggest variations of this pattern',
          context: { pattern }
        });
      }
    },
  ]
});

// 3. On progression
contextMenu.register({
  selector: '.progression',
  items: [
    {
      label: 'Analyze harmony',
      icon: '📊',
      action: (element) => {
        const progression = extractProgressionFromElement(element);
        openAIAdvisor({
          question: 'Analyze this chord progression',
          context: { chords: progression }
        });
      }
    },
  ]
});
```

---

### Step 6: Documentation (L306-L307)
**Priority:** MEDIUM | **Time:** 2-3 hours

#### Create `docs/ai/advisor.md`:
```markdown
# AI Advisor

The AI Advisor is a Prolog-based conversational interface for musical assistance.

## Features
- Natural language questions about music theory
- Workflow and board recommendations
- Compositional suggestions
- Harmonic analysis
- Genre-specific advice

## Usage

### As Reveal Panel Tab
1. Click 🤖 tab in bottom panel
2. Type your question
3. Get answer with confidence and explanation

### As Deck
1. Add "AI Advisor" deck to your board
2. Position it where convenient
3. Ask questions inline while working

### Via Command Palette
1. Press Cmd+K
2. Type "Ask AI..."
3. Enter your question

### Via Context Menu
1. Right-click on chord/pattern/progression
2. Select "Ask AI" or "Explain this"
3. View answer in advisor

## Example Conversations

### Music Theory
Q: "What chord comes after C major in the key of C?"
A: Common progressions from C major include:
- F major (subdominant, IV)
- G major (dominant, V)
- A minor (relative minor, vi)
- D minor (ii)

### Workflow
Q: "Which board should I use for classical composition?"
A: For classical composition, I recommend:
1. **Notation Board** - Score writing with engraving
2. **Harmony Board** - Chord progression analysis
3. **Orchestration Board** - Instrument arrangement

### Composition
Q: "How do I make a lofi hip hop beat?"
A: Lofi hip hop typically features:
- Tempo: 70-90 BPM
- Drums: Laid-back, swing feel
- Chords: Jazz-influenced (7ths, 9ths)
- Bass: Root notes, simple patterns
- Melody: Rhodes, piano, atmospheric pads
```

#### Add Persona Examples (L307):
- Notation Composer conversations
- Tracker User conversations
- Sound Designer conversations
- Producer conversations

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1
- [ ] Day 1 Morning: Step 1 - Add DeckType (2h)
- [ ] Day 1 Afternoon: Step 2 - Create deck factory (2h)
- [ ] Day 2 Morning: Step 3 - Keyboard shortcut (30min)
- [ ] Day 2 Morning: Step 4 - Command palette (3h)
- [ ] Day 2 Afternoon: Step 5 - Context menus (3h)
- [ ] Day 3: Step 6 - Documentation (3h)

### Testing & Polish
- [ ] Test deck creation/deletion
- [ ] Test keyboard shortcut works
- [ ] Test command palette integration
- [ ] Test context menus on various elements
- [ ] Test advisor state persists across sessions
- [ ] Verify all L299-L310 tasks complete
- [ ] Update currentsteps-branchB.md

---

## 🎯 SUCCESS CRITERIA

After implementation, users should be able to:
1. ✅ Add AI Advisor as a deck to any board
2. ✅ Open advisor via Cmd+/ shortcut
3. ✅ Open advisor via Cmd+K → "Ask AI..."
4. ✅ Right-click chords/patterns → "Ask AI"
5. ✅ Get contextual help on any musical element
6. ✅ Have AI answers integrate back into workflow via HostActions

---

## 📊 UPDATED COMPLETION

After this work:
- **Phase L: Prolog AI Foundation** → 95% complete
- **L281-L320: AI Advisor Interface** → 90% complete
- **Critical Path Blockers** → RESOLVED

Only remaining:
- L311-L320: Optional telemetry/feedback (deferred to Phase N)

---

## 🔧 INFRASTRUCTURE DISCOVERED

| System | File | API |
|--------|------|-----|
| Deck Types | `src/boards/types.ts` | Add to union type |
| Deck Registry | `src/boards/validate.ts` | Add to KNOWN_DECK_TYPES |
| Keyboard Shortcuts | `src/ui/keyboard-shortcuts.ts` | KeyboardShortcutManager.register() |
| Command Palette | TBD | Search for implementation |
| Context Menus | TBD | Search for implementation |

---

**Ready to start implementation!**
**Begin with Step 1: Add DeckType**
