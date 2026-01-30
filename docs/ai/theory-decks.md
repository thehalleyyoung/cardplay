# Theory Decks in CardPlay

Theory decks are pre-configured collections of theory cards that work together for specific musical tasks. Each deck provides a coherent set of constraints and analysis tools.

## Available Theory Decks

### Core Theory Deck
Cards for fundamental music theory analysis:
- Key detection (Krumhansl-Schmuckler, Spiral Array)
- Scale/mode identification
- Chord quality analysis
- Voice leading checking

### Galant Schemata Deck
Cards for 18th-century pattern analysis:
- Schema detection (Romanesca, Prinner, Fonte, Monte, etc.)
- Schema chaining and compatibility
- Cadence type identification

### Film Scoring Deck
Cards for film music composition:
- Mood-to-device mapping
- Emotion-music mapping (Russell circumplex)
- Composer style matching
- Click track calculation
- Orchestration role allocation

### World Music Deck
Cards for cross-cultural music:
- Carnatic raga/tala cards
- Celtic tune type/ornament cards
- Chinese mode/heterophony cards
- Arabic maqam/iqa cards

### Jazz Theory Deck
Cards for jazz analysis and composition:
- LCC (Lydian Chromatic Concept) analysis
- Jazz voicing suggestions
- Reharmonization techniques
- Improvisation pattern library

## Board Templates

Pre-configured boards combine decks with layout:

```typescript
import {
  GALANT_BOARD_TEMPLATE,
  CELTIC_BOARD_TEMPLATE,
  JAZZ_IMPROV_BOARD_TEMPLATE,
} from '@cardplay/ai/queries/spec-queries';
```

| Template | Cards | Purpose |
|----------|-------|---------|
| Galant Schemata | Schema, Cadence, Key | 18th-century analysis |
| Galant (Gated) | + Style gate | Filtered galant analysis |
| Celtic | Tune, Mode, Form, Ornament | Celtic composition |
| Jazz Improv | Patterns, Practice, Training | Jazz practice |

## Sample Deck Exports

```typescript
import { SAMPLE_DECK_EXPORTS, SAMPLE_BOARD_PRESETS } from '@cardplay/ai/queries/spec-queries';

// Pre-built deck configurations for quick setup
console.log(SAMPLE_DECK_EXPORTS.length); // Number of available decks

// Board presets reference deck exports
console.log(SAMPLE_BOARD_PRESETS.length); // Number of available presets
```

## Progressive Disclosure

Theory decks support progressive disclosure levels:

```typescript
import { getTheoryModeConfig } from '@cardplay/ai/queries/spec-queries';

const beginner = getTheoryModeConfig('beginner');
// Shows only basic cards, simplified explanations

const pro = getTheoryModeConfig('pro');
// Shows all cards, raw Prolog access, advanced constraints
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Galant Schemata](./galant-schemata.md) - Schema library details
- [Film Music](./film-music.md) - Film scoring details
- [Carnatic](./carnatic.md) - Indian classical music
- [Celtic](./celtic.md) - Celtic music theory
- [Chinese](./chinese.md) - Chinese music theory
