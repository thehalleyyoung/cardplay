# Film Music in CardPlay

CardPlay provides comprehensive support for film scoring, including mood-based device selection, emotion mapping, composer style analysis, and click track calculation.

## Film Devices

Film devices are compositional techniques mapped to dramatic functions:

| Device | Function | Example |
|--------|----------|---------|
| Ostinato | Tension, momentum | Zimmer-style repeated pattern |
| Pedal point | Grounding, suspense | Sustained bass under movement |
| Stinger | Shock, punctuation | Sudden orchestral hit |
| Riser | Building tension | Ascending chromatic/sweep |
| Lydian lift | Wonder, magic | Major with ♯4 |

## Mood Packs

Mood packs bundle devices, instruments, and constraints for a target emotion:

```typescript
import { recommendFilmDevices } from '@cardplay/ai/queries/spec-queries';

const devices = await recommendFilmDevices({
  type: 'film_mood',
  hard: false,
  mood: 'triumphant',
});
```

## Emotion-Music Mapping

Based on Russell's circumplex model (valence × arousal):

```typescript
import { mapMusicToEmotion } from '@cardplay/ai/queries/spec-queries';

const emotion = await mapMusicToEmotion({
  tempo: 140,
  mode: 'major',
  dynamics: 'ff',
});
// Returns EmotionVector with valence, arousal, tension
```

## Composer Style Profiles

Match or generate in the style of film composers:

- Williams: Fanfares, romantic melodies, orchestral color
- Zimmer: Hybrid orchestral/electronic, ostinato layers, bass design
- Morricone: Sparse textures, vocal elements, electric guitar
- Horner: Ethnic integration, danger motifs
- Elfman: Quirky orchestration, gothic choir
- Desplat: Chamber intimacy

```typescript
import { matchComposerStyle } from '@cardplay/ai/queries/spec-queries';

const style = await matchComposerStyle({
  tempo: 132,
  mode: 'major',
  dynamics: 'ff',
  texture: 'full_orchestra',
});
```

## Click Track & Sync

Calculate click tracks to hit sync points:

```typescript
import { calculateClickTrack } from '@cardplay/ai/queries/spec-queries';

const click = await calculateClickTrack(
  [{ timecode: 0, type: 'downbeat' }, { timecode: 2.0, type: 'hit' }],
  { tempoRange: [100, 140] },
);
```

## Orchestration Roles

Allocate orchestration roles by style:

```typescript
import { allocateOrchestrationRoles, generateMixerDefaults } from '@cardplay/ai/queries/spec-queries';

const roles = allocateOrchestrationRoles(6, 'film');
const mixer = generateMixerDefaults(roles);
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Computational Theory](./computational-theory.md) - Analysis models
