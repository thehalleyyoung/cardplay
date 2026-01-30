# Celtic Music Theory in CardPlay

CardPlay provides comprehensive support for Celtic (Irish/Scottish/Welsh/Breton) music theory, including tune types, ornaments, forms, and set building.

## Tune Types

| Type | Meter | Typical Tempo | Form |
|------|-------|--------------|------|
| Reel | 4/4 | 110–130 | AABB |
| Jig | 6/8 | 110–130 | AABB |
| Hornpipe | 4/4 | 80–100 | AABB |
| Slow Air | Free | 60–80 | Through-composed |
| Polka | 2/4 | 120–140 | AABB |
| Waltz | 3/4 | 100–120 | AABB |
| March | 4/4 | 90–110 | AABB |
| Strathspey | 4/4 | 100–120 | AABB |

## Modes

Celtic music primarily uses:
- **Dorian** (most common for minor tunes)
- **Mixolydian** (most common for major tunes)
- **Aeolian** (natural minor, less common)
- **Ionian** (major, used in songs)

## Ornaments

| Ornament | Description | Applies To |
|----------|-------------|------------|
| Roll | 5-note group: upper-main-lower-main-main | Single notes |
| Cran | Piping ornament with repeated cutting | Low notes |
| Cut | Quick grace note from above | Any note |
| Tip | Quick grace note from below | Any note |
| Treble | Rhythmic ornament (3 notes) | Dance tunes |
| Triplet | Three even notes in one beat | Jigs, reels |

## Form and Structure

Standard Celtic tunes follow `AABB` form with 8-bar parts:

```typescript
import { generateFormMarkers, CELTIC_FORM_PATTERNS } from '@cardplay/ai/queries/spec-queries';

// Get standard patterns
console.log(CELTIC_FORM_PATTERNS.reel); // 'AABB'

// Generate form markers
const markers = generateFormMarkers('AABB', 8);
// [{ section: 'A1', startBar: 0, endBar: 7 }, ...]
```

## Harp Voicings

Celtic harp accompaniment templates:

```typescript
import { CELTIC_HARP_VOICINGS, getHarpVoicing } from '@cardplay/ai/queries/spec-queries';

const voicing = getHarpVoicing('slow_air');
// Returns template with bass pattern, chord voicing, arpeggio style
```

## Set Building

Build sets of tunes with key compatibility scoring:

```typescript
import { buildCelticSet } from '@cardplay/ai/queries/spec-queries';

// Builds a set checking key compatibility and estimating duration
```

## Board Template

```typescript
import { CELTIC_BOARD_TEMPLATE } from '@cardplay/ai/queries/spec-queries';

// Pre-configured board with Celtic tune type, mode, form, ornament cards
```

## Constraints

```typescript
{ type: 'celtic_tune', hard: true, tuneType: 'reel' }
{ type: 'style', hard: false, style: 'celtic' }
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Carnatic](./carnatic.md) - Indian classical music
- [Chinese](./chinese.md) - Chinese music theory
