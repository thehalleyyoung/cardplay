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

## Extending the advisor with custom rules

The advisor is intentionally split into three layers:

1. **Question routing** (pick a category)
2. **Query building** (convert question + context into Prolog queries)
3. **Answer formatting** (convert solutions into text + optional `HostAction[]`)

### Add a new question category

1. Add a category string to the advisor (and update routing priority if needed).
2. Add a handler that:
   - Extracts the minimal required context (key/chords/genre/board/etc.)
   - Constructs one or more Prolog queries using stable predicates
   - Returns `Answer` with `confidence`, `followUps`, and (optionally) `actions`

### Add new Prolog-backed knowledge

1. Add rules/facts to an existing KB under `src/ai/knowledge/` (or create a new KB + loader).
2. Ensure the KB is loaded in the relevant feature path (preload vs lazy-load).
3. Add tests for:
   - Correctness (query returns expected values)
   - “No answer” behavior (advisor should return a safe fallback)

### Add new NL → query patterns

The NL translator is deliberately minimal; prefer *explicit patterns* over “AI guessing”.

- Add a new pattern that maps a clear user phrasing to a query template.
- Keep the template stable and versionable (avoid embedding UI-only identifiers).
- Add a test that the pattern triggers and the resulting query can be answered.

### Add new `HostAction` suggestions

1. Add a Prolog predicate that emits `host_action(...)` terms (or equivalent).
2. Ensure the TypeScript side decodes to `HostAction` objects and capability-checks them.
3. Add a safety test: actions that could be destructive must require confirmation.
