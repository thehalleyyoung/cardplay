# Jazz Theory in CardPlay

CardPlay provides comprehensive jazz theory support spanning voicings, arranging, reharmonization, and improvisation.

## Jazz Voicing Principles

### Voice Leading
- Smooth voice leading: minimize interval movement between chord tones
- Common tones: hold shared notes between chords
- Contrary motion: outer voices move in opposite directions
- Avoid parallel fifths and octaves

### Extensions & Avoid Notes
- Extensions: 9, 11, 13 add color above 7th
- Avoid notes: notes that clash with chord function (e.g., natural 4 on major 7)
- Altered dominants: ♭9, ♯9, ♯11, ♭13 for tension

```typescript
import { suggestLCCVoiceLeading } from '@cardplay/ai/queries/spec-queries';

const vl = suggestLCCVoiceLeading(chord1, chord2, 'lydian');
```

## Big Band Arranging

### Section Writing
- **Sax section**: 5 voices (2 alto, 2 tenor, bari)
- **Brass**: 4 trumpets + 4 trombones (or 3+3)
- **Rhythm section**: piano, bass, drums, guitar

### Techniques
- Sax soli (harmonized melody in section)
- Brass shout chorus (climactic full-section writing)
- Backgrounds (accompanying figures behind soloist)
- Tutti (full ensemble)

## Small Group Arranging

| Format | Voicing | Example |
|--------|---------|---------|
| Trio | Piano/bass/drums | Bill Evans |
| Quartet | + horn | Miles quintet |
| Quintet | + 2 horns | Art Blakey |
| Sextet | + 3 horns | Cannonball |

## Reharmonization

```typescript
import {
  REHARMONIZATION_TEMPLATES,
  suggestReharmonizations,
} from '@cardplay/ai/queries/spec-queries';

// 4 template types: tritone sub, minor sub, chromatic mediant, Coltrane
const reharms = suggestReharmonizations(
  [{ root: 'g', quality: 'dom7', duration: 4 }],
  { style: 'jazz' }
);
```

### Techniques
- **Tritone substitution**: Replace V7 with ♭II7
- **Minor substitution**: Replace V with iii or vi
- **Chromatic mediant**: Third-related chord motion
- **Coltrane changes**: Major third cycle (Giant Steps)

## Jazz Improvisation

### Pattern Library

```typescript
import {
  BEBOP_VOCABULARY_CONSTRAINTS,
  getJazzPatterns,
  generateSoloSectionConfig,
} from '@cardplay/ai/queries/spec-queries';

// 6 bebop vocabulary constraint patterns
const patterns = getJazzPatterns('bebop', 'intermediate');

// Generate solo section configuration
const config = generateSoloSectionConfig('saxophone', 'bebop', 2);
```

### Practice Tools

```typescript
import {
  generateTargetNotePractice,
  generateEarTrainingExercises,
} from '@cardplay/ai/queries/spec-queries';

// Target note practice over chord changes
const practice = generateTargetNotePractice(chords, 'intermediate', 4);

// Ear training exercises
const exercises = generateEarTrainingExercises('interval', 'intermediate', 10);
```

## Board Template

```typescript
import { JAZZ_IMPROV_BOARD_TEMPLATE } from '@cardplay/ai/queries/spec-queries';
// Pre-configured board with pattern, practice, and training cards
```

## See Also

- [LCC](./lcc.md) - Lydian Chromatic Concept
- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Theory Decks](./theory-decks.md) - Deck templates
