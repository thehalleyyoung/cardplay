# Chinese Music Theory in CardPlay

CardPlay provides support for Chinese traditional music theory, including pentatonic modes, heterophonic ensemble writing, and instrument-specific ornaments.

## Pentatonic Modes

The five standard Chinese modes (wusheng):

| Mode | Chinese Name | Degree | Character |
|------|-------------|--------|-----------|
| Gong | 宫 | 1 | Bright, noble |
| Shang | 商 | 2 | Clear, crisp |
| Jue | 角 | 3 | Gentle, warm |
| Zhi | 徵 | 5 | Energetic, festive |
| Yu | 羽 | 6 | Plaintive, melancholic |

```typescript
import { getChineseModeInfo } from '@cardplay/ai/queries/spec-queries';

const mode = getChineseModeInfo('gong');
// Returns pitch set, character, typical usage
```

## Heterophony

Chinese ensemble writing uses heterophonic texture — multiple instruments playing the same melody with individual variations:

```typescript
import { generateHeterophonyLanes } from '@cardplay/ai/queries/spec-queries';

const lanes = generateHeterophonyLanes([60, 64, 67, 72], 3, 'chinese');
// Returns lanes with leader + followers with variation depth
```

### Variation Depth

- **Lead voice**: Plays the melody as-is
- **Second voice**: Slight ornamental variations (depth 1)
- **Third voice**: More elaborate decorations (depth 2)
- **Percussion**: Rhythmic punctuation

## Instruments

### Silk Instruments
- **Guqin** (古琴): 7-string zither, scholarly tradition
- **Pipa** (琵琶): 4-string lute, virtuosic
- **Erhu** (二胡): 2-string fiddle, expressive

### Bamboo Instruments
- **Dizi** (笛子): Transverse flute with membrane
- **Xiao** (箫): End-blown flute
- **Sheng** (笙): Mouth organ, chordal capability

### Sheng Voicings

```typescript
import { SHENG_VOICINGS, getShengVoicing } from '@cardplay/ai/queries/spec-queries';

const voicing = getShengVoicing('gong');
// Returns template with parallel intervals and register
```

## Ornaments

| Ornament | Chinese | Description |
|----------|---------|-------------|
| Hua | 花 | Ornamental note grouping |
| Bo | 拨 | Plucked articulation |
| Nao | 挠 | Vibrato |
| Rou | 揉 | Pitch bending |
| Hua zhi | 滑指 | Glissando |

## Constraints

```typescript
{ type: 'chinese_mode', hard: true, mode: 'gong' }
{ type: 'culture', hard: false, culture: 'chinese' }
{ type: 'east_asian_tradition', hard: false, tradition: 'chinese' }
{ type: 'chinese_regional', hard: false, region: 'jiangnan' }
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Full predicate reference
- [Carnatic](./carnatic.md) - Indian classical music
- [Celtic](./celtic.md) - Celtic music theory
