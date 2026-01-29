# AI Advisor

The AI Advisor is the natural language entry point to CardPlay’s Prolog-backed music intelligence.

It provides:
- Question routing (chords, melody, rhythm, genre, board/workflow, analysis)
- Prolog/KB-backed answers where available
- Confidence scoring and safe “I don’t know” fallbacks
- Follow-up question suggestions
- Optional host actions (e.g. set next chord, open a generator)
- Conversation history + bookmarks via the conversation manager

## Files

- Core advisor: [src/ai/advisor/advisor-interface.ts](../../src/ai/advisor/advisor-interface.ts)
- Conversation manager: [src/ai/advisor/conversation-manager.ts](../../src/ai/advisor/conversation-manager.ts)
- Barrel exports: [src/ai/advisor/index.ts](../../src/ai/advisor/index.ts)
- UI panel: [src/ui/components/ai-advisor-panel.ts](../../src/ui/components/ai-advisor-panel.ts)

## Usage

### Basic

```ts
import { createAIAdvisor } from '@/ai/advisor';

const advisor = createAIAdvisor();
const answer = await advisor.ask('What chord should I use next?', {
  key: { root: 'c', mode: 'major' },
  chords: [{ root: 'c', quality: 'major' }]
});

console.log(answer.text, answer.confidence);
```

### With conversation history

```ts
import { createConversationManager } from '@/ai/advisor';

const manager = createConversationManager();
manager.startSession({ genre: 'lofi' });

await manager.ask('How do I create a lofi beat?');
await manager.ask('What tempo should I use?');

const history = manager.getHistory();
```

### Host actions

Some answers include `actions` to let the host UI apply changes:

- `setParam`: set a parameter on a card/component
- `navigate`: open a board/deck
- `create`: create a new entity (reserved)
- `callMethod`: call a host-defined method (reserved)

The UI panel dispatches:

- `advisor-answer` with `{ turn }`
- `advisor-action` with `{ action }`

## Question routing

Routing is intentionally simple and deterministic.

The advisor checks categories in this order:

1. `board`
2. `genre`
3. `chord`
4. `melody`
5. `rhythm`
6. `analysis`
7. `workflow`

This prevents generic terms like “beat” or “how do I” from overriding more specific intent.

## Confidence

Confidence is a 0–100 score.

- 80–100: Strong answer from KB/harmony explorer.
- 50–79: General advice or partial grounding.
- 0–49: Unclear; typically paired with follow-up suggestions.

## UI panel

`ai-advisor-panel` is a Lit component implementing a chat-like interface.

It supports:
- Conversation turns
- Confidence badges
- Follow-ups as quick buttons
- Action buttons
- Bookmarks (stored in the conversation manager)

### Minimal example

```html
<ai-advisor-panel></ai-advisor-panel>
```

### Feeding context

```ts
panel.context = {
  key: { root: 'd', mode: 'minor' },
  genre: 'jazz',
  chords: [
    { root: 'd', quality: 'minor' },
    { root: 'g', quality: 'major7' }
  ]
};
```

## Tests

- Advisor tests: [src/ai/advisor/advisor-interface.test.ts](../../src/ai/advisor/advisor-interface.test.ts)
- Conversation manager tests: [src/ai/advisor/conversation-manager.test.ts](../../src/ai/advisor/conversation-manager.test.ts)

All AI tests should pass:

```bash
npm test -- src/ai/
```
